#!/usr/bin/env python3
"""Verify IXA print-ready approvals signed inside Google Apps Script.

The private RSA key never leaves Apps Script.  This verifier uses the pinned
public key committed with the generator, so a Sheet writer cannot manufacture
a PRINT_READY approval by changing cells or environment variables.
"""

from __future__ import annotations

import base64
import hashlib
import hmac
import json
import re
from dataclasses import dataclass
from datetime import datetime, timedelta, timezone
from pathlib import Path
from typing import Any, Mapping


ROOT = Path(__file__).resolve().parents[1]
DEFAULT_PUBLIC_KEY_PATH = (
    ROOT
    / "integrations"
    / "ixa-outreach-webhook"
    / "postal_activation_public_key.json"
)
SIGNATURE_DOMAIN = b"IXA_POSTAL_ACTIVATION_V2\n"
UNIT_SEPARATOR = b"\x1f"
TRUSTED_APPROVER = "Owner-Emad-Alzaim"
SAFE_ID = re.compile(r"^[A-Za-z0-9][A-Za-z0-9._:-]{2,119}$")
SAFE_VERSION = re.compile(r"^[A-Za-z0-9][A-Za-z0-9._:-]{2,119}$")
HASH = re.compile(r"^[0-9a-f]{64}$")
NONCE = re.compile(r"^[A-Za-z0-9_-]{43}$")
SIGNATURE = re.compile(r"^[A-Za-z0-9_-]{300,400}$")
SHA256_DIGEST_INFO_PREFIX = bytes.fromhex(
    "3031300d060960864801650304020105000420"
)


class PostalActivationError(ValueError):
    """Raised when a print-ready approval is not authentic and exact."""


@dataclass(frozen=True)
class VerifiedPostalActivation:
    receipt_id: str
    approved_by: str
    approved_at_utc: datetime
    expires_at_utc: datetime
    consumed_at_utc: datetime
    batch_digest_sha256: str
    receipt_sha256: str
    key_id: str


RECEIPT_FIELDS = frozenset(
    {
        "schema_version",
        "key_id",
        "receipt_id",
        "approved_for",
        "batch_id",
        "content_version",
        "letter_date",
        "recipient_count",
        "batch_digest_sha256",
        "approved_by",
        "approved_at_utc",
        "expires_at_utc",
        "consumed_at_utc",
        "nonce",
        "signature_rsa_sha256_base64url",
    }
)


def canonical_json_bytes(value: Any) -> bytes:
    return json.dumps(
        value,
        ensure_ascii=False,
        sort_keys=True,
        separators=(",", ":"),
    ).encode("utf-8")


def _text(value: Any, name: str, maximum: int = 200) -> str:
    if not isinstance(value, str):
        raise PostalActivationError(f"{name} must be text")
    text = " ".join(value.split()).strip()
    if not text or len(text) > maximum:
        raise PostalActivationError(f"{name} is empty or too long")
    return text


def _utc(value: Any, name: str) -> datetime:
    raw = _text(value, name, maximum=40)
    candidate = raw[:-1] + "+00:00" if raw.endswith("Z") else raw
    try:
        parsed = datetime.fromisoformat(candidate)
    except ValueError as exc:
        raise PostalActivationError(f"{name} must be an ISO-8601 timestamp") from exc
    if parsed.tzinfo is None:
        raise PostalActivationError(f"{name} must include a UTC offset")
    return parsed.astimezone(timezone.utc)


def _public_key(path: Path) -> tuple[str, int, int]:
    try:
        value = json.loads(path.read_text(encoding="utf-8"))
    except (OSError, UnicodeError, json.JSONDecodeError) as exc:
        raise PostalActivationError(f"postal public key is unavailable: {exc}") from exc
    required = {
        "schema_version",
        "key_id",
        "algorithm",
        "public_key_der_sha256",
        "modulus_hex",
        "exponent",
    }
    if not isinstance(value, dict) or set(value) != required:
        raise PostalActivationError("postal public key schema mismatch")
    if value["schema_version"] != 1:
        raise PostalActivationError("postal public key schema version mismatch")
    if value["algorithm"] != "RSASSA-PKCS1-v1_5-SHA256":
        raise PostalActivationError("postal public key algorithm mismatch")
    key_id = _text(value["key_id"], "public_key.key_id", maximum=120)
    modulus_hex = str(value["modulus_hex"])
    if not re.fullmatch(r"[0-9a-f]{512}", modulus_hex):
        raise PostalActivationError("postal RSA key must be exactly 2048 bits")
    exponent = value["exponent"]
    if isinstance(exponent, bool) or exponent != 65537:
        raise PostalActivationError("postal RSA exponent mismatch")
    fingerprint = str(value["public_key_der_sha256"])
    if not HASH.fullmatch(fingerprint):
        raise PostalActivationError("postal public key fingerprint is invalid")
    return key_id, int(modulus_hex, 16), exponent


def _verify_rsa_sha256(message: bytes, signature_text: str, modulus: int, exponent: int) -> None:
    if not SIGNATURE.fullmatch(signature_text):
        raise PostalActivationError("postal activation RSA signature format is invalid")
    try:
        signature = base64.urlsafe_b64decode(
            signature_text + "=" * ((4 - len(signature_text) % 4) % 4)
        )
    except (ValueError, base64.binascii.Error) as exc:
        raise PostalActivationError("postal activation RSA signature is invalid") from exc
    key_bytes = (modulus.bit_length() + 7) // 8
    if len(signature) != key_bytes:
        raise PostalActivationError("postal activation RSA signature length mismatch")
    signature_number = int.from_bytes(signature, "big")
    if signature_number >= modulus:
        raise PostalActivationError("postal activation RSA signature is out of range")
    encoded = pow(signature_number, exponent, modulus).to_bytes(key_bytes, "big")
    digest_info = SHA256_DIGEST_INFO_PREFIX + hashlib.sha256(message).digest()
    padding_length = key_bytes - len(digest_info) - 3
    if padding_length < 8:
        raise PostalActivationError("postal RSA key is too short")
    expected = b"\x00\x01" + b"\xff" * padding_length + b"\x00" + digest_info
    if not hmac.compare_digest(encoded, expected):
        raise PostalActivationError("postal activation RSA signature is invalid")


def receipt_sha256(receipt: Mapping[str, Any]) -> str:
    signed_body = {
        key: receipt[key]
        for key in sorted(receipt)
        if key != "signature_rsa_sha256_base64url"
    }
    signature = str(receipt["signature_rsa_sha256_base64url"])
    material = (
        SIGNATURE_DOMAIN
        + canonical_json_bytes(signed_body)
        + UNIT_SEPARATOR
        + signature.encode("ascii")
    )
    return hashlib.sha256(material).hexdigest()


def verify_postal_activation(
    payload: Any,
    *,
    batch_id: str,
    content_version: str,
    letter_date: str,
    recipient_count: int,
    batch_digest_sha256: str,
    now: datetime | None = None,
    public_key_path: Path = DEFAULT_PUBLIC_KEY_PATH,
) -> VerifiedPostalActivation:
    if not isinstance(payload, Mapping):
        raise PostalActivationError("activation_receipt must be an object")
    receipt = dict(payload)
    if set(receipt) != RECEIPT_FIELDS:
        missing = sorted(RECEIPT_FIELDS - set(receipt))
        extra = sorted(set(receipt) - RECEIPT_FIELDS)
        raise PostalActivationError(
            f"activation_receipt schema mismatch; missing={missing}, extra={extra}"
        )
    if receipt["schema_version"] != 2:
        raise PostalActivationError("activation_receipt.schema_version must be 2")

    key_id, modulus, exponent = _public_key(public_key_path)
    if receipt["key_id"] != key_id:
        raise PostalActivationError("activation_receipt.key_id is not trusted")
    receipt_id = _text(receipt["receipt_id"], "activation_receipt.receipt_id", 120)
    if not SAFE_ID.fullmatch(receipt_id):
        raise PostalActivationError("activation_receipt.receipt_id is invalid")
    if receipt["approved_for"] != "PRINT_READY":
        raise PostalActivationError("activation_receipt.approved_for must be PRINT_READY")
    if receipt["batch_id"] != batch_id or not SAFE_ID.fullmatch(batch_id):
        raise PostalActivationError("activation_receipt.batch_id does not match")
    if receipt["content_version"] != content_version or not SAFE_VERSION.fullmatch(content_version):
        raise PostalActivationError("activation_receipt.content_version does not match")
    if receipt["letter_date"] != letter_date:
        raise PostalActivationError("activation_receipt.letter_date does not match")
    if (
        isinstance(receipt["recipient_count"], bool)
        or receipt["recipient_count"] != recipient_count
        or recipient_count != 50
    ):
        raise PostalActivationError("activation_receipt.recipient_count must match exact 50")
    digest = str(receipt["batch_digest_sha256"])
    if not HASH.fullmatch(digest) or not hmac.compare_digest(digest, batch_digest_sha256):
        raise PostalActivationError("activation_receipt batch digest does not match")
    approved_by = _text(receipt["approved_by"], "activation_receipt.approved_by", 120)
    if approved_by != TRUSTED_APPROVER:
        raise PostalActivationError("activation_receipt.approved_by is not the IXA owner")
    approved_at = _utc(receipt["approved_at_utc"], "activation_receipt.approved_at_utc")
    expires_at = _utc(receipt["expires_at_utc"], "activation_receipt.expires_at_utc")
    consumed_at = _utc(receipt["consumed_at_utc"], "activation_receipt.consumed_at_utc")
    current = (now or datetime.now(timezone.utc)).astimezone(timezone.utc)
    if approved_at > current + timedelta(minutes=5):
        raise PostalActivationError("activation_receipt approval time is in the future")
    if expires_at <= current:
        raise PostalActivationError("activation_receipt has expired")
    if expires_at <= approved_at or expires_at > approved_at + timedelta(days=7):
        raise PostalActivationError("activation_receipt approval window is invalid")
    if consumed_at < approved_at or consumed_at > expires_at or consumed_at > current:
        raise PostalActivationError("activation_receipt consumption time is invalid")
    nonce = str(receipt["nonce"])
    if not NONCE.fullmatch(nonce) or len(set(nonce)) < 12:
        raise PostalActivationError("activation_receipt nonce is invalid")

    signed_body = {
        key: receipt[key]
        for key in sorted(receipt)
        if key != "signature_rsa_sha256_base64url"
    }
    _verify_rsa_sha256(
        SIGNATURE_DOMAIN + canonical_json_bytes(signed_body),
        str(receipt["signature_rsa_sha256_base64url"]),
        modulus,
        exponent,
    )
    return VerifiedPostalActivation(
        receipt_id=receipt_id,
        approved_by=approved_by,
        approved_at_utc=approved_at,
        expires_at_utc=expires_at,
        consumed_at_utc=consumed_at,
        batch_digest_sha256=digest,
        receipt_sha256=receipt_sha256(receipt),
        key_id=key_id,
    )
