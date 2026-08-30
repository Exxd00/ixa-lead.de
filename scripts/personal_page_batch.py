#!/usr/bin/env python3
"""Prepare and approve deterministic IXA personal-page cohorts locally.

This module is intentionally independent of Google Sheets, Apps Script, and
the network.  It never activates a page.  ``prepare`` emits append-ready rows
for ``11 Page Content`` in the non-active state ``Prepared / Pending`` plus an
unsigned, cohort-level ``PAGE_ACTIVATION`` request.  ``sign`` turns that exact
request into a narrowly scoped receipt; ``verify`` verifies the receipt at the
current UTC time.

Canonical commitments
=====================

All JSON written by this program is UTF-8 with keys sorted, no insignificant
whitespace, and a single trailing newline.  Evidence objects use the same
canonical JSON form inside each Sheet cell.  C0 controls (including the two
separators below) and DEL are rejected from all user-provided text.

``Content_SHA256`` is SHA-256 over the first eleven ``11 Page Content`` fields
joined by U+001F.  The cohort commitments are deliberately simple enough to
implement identically in Apps Script::

    recipient_set_hash = sha256(
        U+001E.join(sorted(
            U+001F.join([company_id, contact_id, token_sha256, letter_id])
            for each recipient
        ))
    )

    page_set_sha256 = sha256(
        U+001E.join(sorted(
            U+001F.join([
                page_content_id, batch_id, experiment_id, page_version,
                company_id, contact_id, token_sha256, letter_id,
                content_sha256, expires_utc, source_run_id
            ])
            for each page row
        ))
    )

The receipt HMAC body is the ASCII domain prefix
``IXA_PAGE_ACTIVATION_V1\n`` followed by UTF-8 text joined by U+001F in
``RECEIPT_FIELDS`` order.  It is not a general send or print authorization;
the literal scope is always ``PAGE_ACTIVATION``.  The signing secret is
accepted by the CLI only through ``IXA_PAGE_ACTIVATION_SECRET_V1`` and must
contain at least 32 UTF-8 bytes.  A production receipt can only be signed or
verified for exactly 50 recipients; smaller cohorts remain preview-only.

Input schema::

    {
      "batch_id": "IXA001",
      "experiment_id": "IXA-EXP-001",
      "page_version": "v3.0",
      "page_expires_at_utc": "2026-09-30T22:00:00.000Z",
      "source_run_id": "IXA-RUN-...",
      "recipients": [
        {
          "company_id": "IXA-C-001",
          "contact_id": "IXA-P-001",
          "public_token": "url_safe_random_token",
          "letter_id": "IXA-L-001",
          "public_page_label": "Example GmbH",
          "evidence": [
            {
              "schema": "ixa.personal-page-observation.v1",
              "position": 1,
              "title": "...",
              "observation": "...",
              "implication": "...",
              "sourceLabel": "...",
              "sourceUrl": "https://example.invalid/page",
              "verifiedAt": "2026-08-30",
              "firstTest": {"title": "...", "description": "..."}
            },
            {
              "schema": "ixa.personal-page-observation.v1",
              "position": 2,
              "title": "...",
              "observation": "...",
              "implication": "...",
              "sourceLabel": "...",
              "sourceUrl": "https://example.invalid/other",
              "verifiedAt": "2026-08-30"
            }
          ]
        }
      ]
    }
"""

from __future__ import annotations

import argparse
import hashlib
import hmac
import json
import os
import re
import sys
import unicodedata
from datetime import date, datetime, timedelta, timezone
from pathlib import Path
from typing import Any, Mapping, Sequence
from urllib.parse import urlsplit


UNIT_SEP = "\u001f"
RECORD_SEP = "\u001e"
EVIDENCE_SCHEMA = "ixa.personal-page-observation.v1"
ACTIVATION_SCOPE = "PAGE_ACTIVATION"
ACTIVATION_SCHEMA_VERSION = 1
MAX_RECIPIENTS = 50
MAX_RECEIPT_VALIDITY = timedelta(hours=24)
SIGNING_SECRET_ENV = "IXA_PAGE_ACTIVATION_SECRET_V1"
RECEIPT_DOMAIN_PREFIX = b"IXA_PAGE_ACTIVATION_V1\n"

SAFE_ID_RE = re.compile(r"^[A-Za-z0-9][A-Za-z0-9._:-]{2,119}$")
PUBLIC_TOKEN_RE = re.compile(r"^[A-Za-z0-9_-]{16,80}$")
PAGE_VERSION_RE = re.compile(
    r"^v[1-9][0-9]{0,5}(?:\.(?:0|[1-9][0-9]{0,5}))?$")
HASH_RE = re.compile(r"^[0-9a-f]{64}$")
NONCE_RE = re.compile(r"^[A-Za-z0-9_-]{43}$")
UTC_RE = re.compile(r"^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$")
DATE_RE = re.compile(r"^\d{4}-\d{2}-\d{2}$")
CONTROL_RE = re.compile(r"[\x00-\x1f\x7f]")

PAGE_CONTENT_HEADERS = (
    "Page_Content_ID",
    "Batch_ID",
    "Experiment_ID",
    "Page_Version",
    "Company_ID",
    "Contact_ID",
    "Token_SHA256",
    "Letter_ID",
    "Public_Page_Label",
    "Evidence_1",
    "Evidence_2",
    "Content_SHA256",
    "State",
    "Approval_Status",
    "Approved_By",
    "Approved_At_UTC",
    "Activated_At_UTC",
    "Expires_UTC",
    "Source_Run_ID",
    "Activation_Receipt_ID",
    "Activation_Receipt_SHA256",
)

REQUEST_FIELDS = (
    "schema_version",
    "scope",
    "batch_id",
    "recipient_set_hash",
    "page_version",
    "page_set_sha256",
    "recipient_count",
)

RECEIPT_FIELDS = (
    "schema_version",
    "scope",
    "receipt_id",
    "batch_id",
    "recipient_set_hash",
    "page_version",
    "page_set_sha256",
    "recipient_count",
    "approved_by",
    "approved_at_utc",
    "expires_at_utc",
    "consumed_at_utc",
    "nonce",
)

RECEIPT_KEYS = frozenset(
    (*RECEIPT_FIELDS, "signature_hmac_sha256", "receipt_sha256")
)
INPUT_KEYS = frozenset(
    {
        "batch_id",
        "experiment_id",
        "page_version",
        "page_expires_at_utc",
        "source_run_id",
        "recipients",
    }
)
RECIPIENT_KEYS = frozenset(
    {
        "company_id",
        "contact_id",
        "public_token",
        "letter_id",
        "public_page_label",
        "evidence",
    }
)
EVIDENCE_BASE_KEYS = frozenset(
    {
        "schema",
        "position",
        "title",
        "observation",
        "implication",
        "sourceLabel",
        "sourceUrl",
        "verifiedAt",
    }
)


class ValidationError(ValueError):
    """Raised whenever an input, request, or receipt fails closed."""


def canonical_json(value: Any) -> str:
    """Return the one canonical JSON representation used by this module."""

    return json.dumps(
        value,
        ensure_ascii=False,
        sort_keys=True,
        separators=(",", ":"),
        allow_nan=False,
    )


def sha256_hex(value: str) -> str:
    return hashlib.sha256(value.encode("utf-8")).hexdigest()


def _object(value: Any, field: str) -> dict[str, Any]:
    if not isinstance(value, dict):
        raise ValidationError(f"{field} must be a JSON object")
    return value


def _exact_keys(value: Mapping[str, Any], expected: frozenset[str], field: str) -> None:
    actual = frozenset(value)
    if actual != expected:
        missing = sorted(expected - actual)
        extra = sorted(actual - expected)
        details = []
        if missing:
            details.append("missing=" + ",".join(missing))
        if extra:
            details.append("extra=" + ",".join(extra))
        raise ValidationError(f"{field} has invalid fields ({'; '.join(details)})")


def _text(value: Any, field: str, *, maximum: int, minimum: int = 1) -> str:
    if not isinstance(value, str):
        raise ValidationError(f"{field} must be a string")
    result = unicodedata.normalize("NFC", value).strip()
    if CONTROL_RE.search(result):
        raise ValidationError(f"{field} contains a forbidden control character")
    if not minimum <= len(result) <= maximum:
        raise ValidationError(
            f"{field} length must be between {minimum} and {maximum} characters"
        )
    return result


def _safe_id(value: Any, field: str) -> str:
    result = _text(value, field, maximum=120, minimum=3)
    if not SAFE_ID_RE.fullmatch(result):
        raise ValidationError(f"{field} is not a safe identifier")
    return result


def _page_version(value: Any, field: str = "page_version") -> str:
    result = _text(value, field, maximum=20)
    if not PAGE_VERSION_RE.fullmatch(result):
        raise ValidationError(f"{field} must match vN or vN.N")
    return result


def _hash(value: Any, field: str) -> str:
    result = _text(value, field, maximum=64, minimum=64)
    if not HASH_RE.fullmatch(result):
        raise ValidationError(f"{field} must be a lowercase SHA-256 hex digest")
    return result


def _utc(value: Any, field: str) -> tuple[str, datetime]:
    result = _text(value, field, maximum=40)
    if not UTC_RE.fullmatch(result):
        raise ValidationError(f"{field} must be an ISO-8601 UTC timestamp with .sssZ")
    try:
        parsed = datetime.fromisoformat(result[:-1] + "+00:00")
    except ValueError as exc:
        raise ValidationError(f"{field} is not a real UTC timestamp") from exc
    return result, parsed.astimezone(timezone.utc)


def _iso_date(value: Any, field: str) -> str:
    result = _text(value, field, maximum=10, minimum=10)
    if not DATE_RE.fullmatch(result):
        raise ValidationError(f"{field} must be YYYY-MM-DD")
    try:
        date.fromisoformat(result)
    except ValueError as exc:
        raise ValidationError(f"{field} is not a real calendar date") from exc
    return result


def _https_url(value: Any, field: str) -> str:
    result = _text(value, field, maximum=2048)
    parts = urlsplit(result)
    if parts.scheme != "https" or not parts.netloc or parts.username or parts.password:
        raise ValidationError(f"{field} must be an absolute HTTPS URL without credentials")
    if any(char.isspace() for char in result) or parts.fragment:
        raise ValidationError(f"{field} must not contain whitespace or a fragment")
    return result


def _evidence(value: Any, expected_position: int, field: str) -> dict[str, Any]:
    record = _object(value, field)
    expected_keys = (
        EVIDENCE_BASE_KEYS | {"firstTest"}
        if expected_position == 1
        else EVIDENCE_BASE_KEYS
    )
    _exact_keys(record, frozenset(expected_keys), field)
    if record.get("schema") != EVIDENCE_SCHEMA:
        raise ValidationError(f"{field}.schema must be {EVIDENCE_SCHEMA}")
    if type(record.get("position")) is not int or record["position"] != expected_position:
        raise ValidationError(f"{field}.position must be {expected_position}")

    result: dict[str, Any] = {
        "schema": EVIDENCE_SCHEMA,
        "position": expected_position,
        "title": _text(record.get("title"), f"{field}.title", maximum=120),
        "observation": _text(
            record.get("observation"), f"{field}.observation", maximum=900
        ),
        "implication": _text(
            record.get("implication"), f"{field}.implication", maximum=900
        ),
        "sourceLabel": _text(
            record.get("sourceLabel"), f"{field}.sourceLabel", maximum=160
        ),
        "sourceUrl": _https_url(record.get("sourceUrl"), f"{field}.sourceUrl"),
        "verifiedAt": _iso_date(record.get("verifiedAt"), f"{field}.verifiedAt"),
    }
    if expected_position == 1:
        first_test = _object(record.get("firstTest"), f"{field}.firstTest")
        _exact_keys(
            first_test,
            frozenset({"title", "description"}),
            f"{field}.firstTest",
        )
        result["firstTest"] = {
            "title": _text(
                first_test.get("title"), f"{field}.firstTest.title", maximum=160
            ),
            "description": _text(
                first_test.get("description"),
                f"{field}.firstTest.description",
                maximum=1200,
            ),
        }
    return result


def _unique(values: Sequence[str], field: str, *, case_sensitive: bool = True) -> None:
    keys = values if case_sensitive else [value.casefold() for value in values]
    if len(set(keys)) != len(keys):
        raise ValidationError(f"recipients contain a duplicate {field}")


def _page_content_id(
    batch_id: str,
    company_id: str,
    contact_id: str,
    token_sha256: str,
    letter_id: str,
) -> str:
    material = UNIT_SEP.join(
        [batch_id, company_id, contact_id, token_sha256, letter_id]
    )
    return "IXA-PC-" + sha256_hex(material)[:32]


def prepare_batch(payload: Any) -> dict[str, Any]:
    """Validate an arbitrary 1..50 cohort and return deterministic Sheet rows."""

    root = _object(payload, "input")
    _exact_keys(root, INPUT_KEYS, "input")
    batch_id = _safe_id(root.get("batch_id"), "batch_id")
    experiment_id = _safe_id(root.get("experiment_id"), "experiment_id")
    page_version = _page_version(root.get("page_version"))
    page_expires_at_utc, _ = _utc(
        root.get("page_expires_at_utc"), "page_expires_at_utc"
    )
    source_run_id = _safe_id(root.get("source_run_id"), "source_run_id")
    recipients_raw = root.get("recipients")
    if not isinstance(recipients_raw, list):
        raise ValidationError("recipients must be an array")
    if not 1 <= len(recipients_raw) <= MAX_RECIPIENTS:
        raise ValidationError("recipients must contain between 1 and 50 entries")

    recipients: list[dict[str, Any]] = []
    for index, raw in enumerate(recipients_raw):
        field = f"recipients[{index}]"
        recipient = _object(raw, field)
        _exact_keys(recipient, RECIPIENT_KEYS, field)
        public_token = _text(
            recipient.get("public_token"), f"{field}.public_token", maximum=80
        )
        if not PUBLIC_TOKEN_RE.fullmatch(public_token):
            raise ValidationError(
                f"{field}.public_token must be 16..80 URL-safe characters"
            )
        evidence_raw = recipient.get("evidence")
        if not isinstance(evidence_raw, list) or len(evidence_raw) != 2:
            raise ValidationError(f"{field}.evidence must contain exactly two objects")
        evidence = [
            _evidence(evidence_raw[0], 1, f"{field}.evidence[0]"),
            _evidence(evidence_raw[1], 2, f"{field}.evidence[1]"),
        ]
        evidence_signatures = {
            canonical_json(
                {
                    "title": item["title"],
                    "observation": item["observation"],
                    "implication": item["implication"],
                    "sourceUrl": item["sourceUrl"],
                }
            )
            for item in evidence
        }
        if len(evidence_signatures) != 2:
            raise ValidationError(f"{field}.evidence must contain two distinct findings")
        recipients.append(
            {
                "company_id": _safe_id(
                    recipient.get("company_id"), f"{field}.company_id"
                ),
                "contact_id": _safe_id(
                    recipient.get("contact_id"), f"{field}.contact_id"
                ),
                "token_sha256": sha256_hex(public_token),
                "public_token": public_token,
                "letter_id": _safe_id(
                    recipient.get("letter_id"), f"{field}.letter_id"
                ),
                "public_page_label": _text(
                    recipient.get("public_page_label"),
                    f"{field}.public_page_label",
                    maximum=120,
                ),
                "evidence": evidence,
            }
        )

    _unique([item["company_id"] for item in recipients], "company_id", case_sensitive=False)
    _unique([item["contact_id"] for item in recipients], "contact_id", case_sensitive=False)
    _unique([item["public_token"] for item in recipients], "public_token")
    _unique([item["letter_id"] for item in recipients], "letter_id", case_sensitive=False)

    rows: list[list[str]] = []
    recipients.sort(
        key=lambda item: (
            item["company_id"],
            item["contact_id"],
            item["token_sha256"],
            item["letter_id"],
        )
    )
    for item in recipients:
        page_content_id = _page_content_id(
            batch_id,
            item["company_id"],
            item["contact_id"],
            item["token_sha256"],
            item["letter_id"],
        )
        first_eleven = [
            page_content_id,
            batch_id,
            experiment_id,
            page_version,
            item["company_id"],
            item["contact_id"],
            item["token_sha256"],
            item["letter_id"],
            item["public_page_label"],
            canonical_json(item["evidence"][0]),
            canonical_json(item["evidence"][1]),
        ]
        content_sha256 = sha256_hex(UNIT_SEP.join(first_eleven))
        rows.append(
            [
                *first_eleven,
                content_sha256,
                "Prepared",
                "Pending",
                "",
                "",
                "",
                page_expires_at_utc,
                source_run_id,
                "",
                "",
            ]
        )

    _unique([row[0] for row in rows], "page_content_id")
    recipient_commitments = sorted(
        UNIT_SEP.join([row[4], row[5], row[6], row[7]]) for row in rows
    )
    recipient_set_hash = sha256_hex(RECORD_SEP.join(recipient_commitments))
    page_commitments = sorted(
        UNIT_SEP.join(
            [
                row[0],
                row[1],
                row[2],
                row[3],
                row[4],
                row[5],
                row[6],
                row[7],
                row[11],
                row[17],
                row[18],
            ]
        )
        for row in rows
    )
    page_set_sha256 = sha256_hex(RECORD_SEP.join(page_commitments))
    activation_request = {
        "schema_version": ACTIVATION_SCHEMA_VERSION,
        "scope": ACTIVATION_SCOPE,
        "batch_id": batch_id,
        "recipient_set_hash": recipient_set_hash,
        "page_version": page_version,
        "page_set_sha256": page_set_sha256,
        "recipient_count": len(rows),
    }
    return {
        "schema": "ixa.personal-page-batch.v1",
        "batch_id": batch_id,
        "experiment_id": experiment_id,
        "page_version": page_version,
        "page_expires_at_utc": page_expires_at_utc,
        "source_run_id": source_run_id,
        "recipient_count": len(rows),
        "recipient_set_hash": recipient_set_hash,
        "page_set_sha256": page_set_sha256,
        "page_content": {
            "schema": "11 Page Content A:U",
            "header_count": len(PAGE_CONTENT_HEADERS),
            "headers": list(PAGE_CONTENT_HEADERS),
            "rows": rows,
        },
        "activation_request": activation_request,
    }


def _request(value: Any) -> dict[str, Any]:
    request = _object(value, "activation_request")
    _exact_keys(request, frozenset(REQUEST_FIELDS), "activation_request")
    if type(request.get("schema_version")) is not int or request["schema_version"] != 1:
        raise ValidationError("activation_request.schema_version must be 1")
    if request.get("scope") != ACTIVATION_SCOPE:
        raise ValidationError("activation_request.scope must be PAGE_ACTIVATION")
    result = {
        "schema_version": 1,
        "scope": ACTIVATION_SCOPE,
        "batch_id": _safe_id(request.get("batch_id"), "activation_request.batch_id"),
        "recipient_set_hash": _hash(
            request.get("recipient_set_hash"),
            "activation_request.recipient_set_hash",
        ),
        "page_version": _page_version(
            request.get("page_version"), "activation_request.page_version"
        ),
        "page_set_sha256": _hash(
            request.get("page_set_sha256"), "activation_request.page_set_sha256"
        ),
    }
    count = request.get("recipient_count")
    if type(count) is not int or not 1 <= count <= MAX_RECIPIENTS:
        raise ValidationError("activation_request.recipient_count must be 1..50")
    result["recipient_count"] = count
    return result


def _receipt_body(receipt: Mapping[str, Any]) -> bytes:
    values: list[str] = []
    for field in RECEIPT_FIELDS:
        value = receipt[field]
        if field in {"schema_version", "recipient_count"}:
            values.append(str(value))
        else:
            values.append(str(value))
    return RECEIPT_DOMAIN_PREFIX + UNIT_SEP.join(values).encode("utf-8")


def _receipt_sha256(receipt: Mapping[str, Any], signature: str) -> str:
    material = _receipt_body(receipt) + UNIT_SEP.encode("utf-8") + signature.encode("ascii")
    return hashlib.sha256(material).hexdigest()


def _secret(value: Any) -> bytes:
    if isinstance(value, str):
        encoded = value.encode("utf-8")
    elif isinstance(value, bytes):
        encoded = value
    else:
        raise ValidationError("signing secret must be bytes or text")
    if len(encoded) < 32:
        raise ValidationError(
            "IXA_PAGE_ACTIVATION_SECRET_V1 must be at least 32 bytes"
        )
    return encoded


def _time_window(
    approved_at: datetime,
    expires_at: datetime,
    *,
    now: datetime,
) -> None:
    if expires_at <= approved_at:
        raise ValidationError("expires_at_utc must be after approved_at_utc")
    if expires_at - approved_at > MAX_RECEIPT_VALIDITY:
        raise ValidationError("receipt validity must not exceed 24 hours")
    if approved_at > now + timedelta(minutes=5):
        raise ValidationError("approved_at_utc is unreasonably far in the future")
    if expires_at <= now:
        raise ValidationError("activation receipt is expired")


def sign_activation_request(
    request_value: Any,
    *,
    receipt_id: Any,
    approved_by: Any,
    approved_at_utc: Any,
    expires_at_utc: Any,
    consumed_at_utc: Any,
    nonce: Any,
    secret: bytes | str,
    now: datetime | None = None,
) -> dict[str, Any]:
    """Return a signed receipt bound to the exact activation request."""

    request = _request(request_value)
    if request["recipient_count"] != MAX_RECIPIENTS:
        raise ValidationError("production activation receipts require exactly 50 recipients")
    approved_text, approved_at = _utc(approved_at_utc, "approved_at_utc")
    expires_text, expires_at = _utc(expires_at_utc, "expires_at_utc")
    consumed_text, consumed_at = _utc(consumed_at_utc, "consumed_at_utc")
    current = now or datetime.now(timezone.utc)
    if current.tzinfo is None:
        raise ValidationError("verification time must be timezone-aware")
    current_utc = current.astimezone(timezone.utc)
    _time_window(approved_at, expires_at, now=current_utc)
    if consumed_at < approved_at or consumed_at > expires_at:
        raise ValidationError(
            "consumed_at_utc must be inside the signed approval window"
        )
    if consumed_at > current_utc:
        raise ValidationError("consumed_at_utc must not be in the future")
    nonce_text = _text(nonce, "nonce", maximum=43, minimum=43)
    if not NONCE_RE.fullmatch(nonce_text) or len(set(nonce_text)) < 12:
        raise ValidationError(
            "nonce must be 43 unpadded base64url characters with at least 12 distinct characters"
        )
    receipt: dict[str, Any] = {
        "schema_version": 1,
        "scope": ACTIVATION_SCOPE,
        "receipt_id": _safe_id(receipt_id, "receipt_id"),
        "batch_id": request["batch_id"],
        "recipient_set_hash": request["recipient_set_hash"],
        "page_version": request["page_version"],
        "page_set_sha256": request["page_set_sha256"],
        "recipient_count": request["recipient_count"],
        "approved_by": _text(approved_by, "approved_by", maximum=200),
        "approved_at_utc": approved_text,
        "expires_at_utc": expires_text,
        "consumed_at_utc": consumed_text,
        "nonce": nonce_text,
    }
    receipt["signature_hmac_sha256"] = hmac.new(
        _secret(secret), _receipt_body(receipt), hashlib.sha256
    ).hexdigest()
    receipt["receipt_sha256"] = _receipt_sha256(
        receipt, receipt["signature_hmac_sha256"]
    )
    return receipt


def verify_activation_receipt(
    receipt_value: Any,
    *,
    secret: bytes | str,
    now: datetime | None = None,
) -> dict[str, Any]:
    """Validate signature, fixed scope, exact fields, and current validity."""

    receipt = _object(receipt_value, "receipt")
    _exact_keys(receipt, RECEIPT_KEYS, "receipt")
    request = _request({field: receipt.get(field) for field in REQUEST_FIELDS})
    if request["recipient_count"] != MAX_RECIPIENTS:
        raise ValidationError("production activation receipts require exactly 50 recipients")
    if receipt.get("scope") != ACTIVATION_SCOPE:
        raise ValidationError("receipt.scope must be PAGE_ACTIVATION")
    validated: dict[str, Any] = {
        "schema_version": request["schema_version"],
        "scope": request["scope"],
        "receipt_id": _safe_id(receipt.get("receipt_id"), "receipt.receipt_id"),
        "batch_id": request["batch_id"],
        "recipient_set_hash": request["recipient_set_hash"],
        "page_version": request["page_version"],
        "page_set_sha256": request["page_set_sha256"],
        "recipient_count": request["recipient_count"],
        "approved_by": _text(receipt.get("approved_by"), "receipt.approved_by", maximum=200),
    }
    approved_text, approved_at = _utc(
        receipt.get("approved_at_utc"), "receipt.approved_at_utc"
    )
    expires_text, expires_at = _utc(
        receipt.get("expires_at_utc"), "receipt.expires_at_utc"
    )
    consumed_text, consumed_at = _utc(
        receipt.get("consumed_at_utc"), "receipt.consumed_at_utc"
    )
    validated["approved_at_utc"] = approved_text
    validated["expires_at_utc"] = expires_text
    validated["consumed_at_utc"] = consumed_text
    if consumed_at < approved_at or consumed_at > expires_at:
        raise ValidationError(
            "receipt.consumed_at_utc must be inside the signed approval window"
        )
    nonce_text = _text(receipt.get("nonce"), "receipt.nonce", maximum=43, minimum=43)
    if not NONCE_RE.fullmatch(nonce_text) or len(set(nonce_text)) < 12:
        raise ValidationError(
            "receipt.nonce must be 43 unpadded base64url characters with at least 12 distinct characters"
        )
    validated["nonce"] = nonce_text
    signature = _hash(
        receipt.get("signature_hmac_sha256"), "receipt.signature_hmac_sha256"
    )
    expected = hmac.new(
        _secret(secret), _receipt_body(validated), hashlib.sha256
    ).hexdigest()
    if not hmac.compare_digest(expected, signature):
        raise ValidationError("activation receipt signature is invalid")
    receipt_sha256 = _hash(receipt.get("receipt_sha256"), "receipt.receipt_sha256")
    expected_receipt_sha256 = _receipt_sha256(validated, signature)
    if not hmac.compare_digest(expected_receipt_sha256, receipt_sha256):
        raise ValidationError("activation receipt digest is invalid")
    current = now or datetime.now(timezone.utc)
    if current.tzinfo is None:
        raise ValidationError("verification time must be timezone-aware")
    current_utc = current.astimezone(timezone.utc)
    _time_window(approved_at, expires_at, now=current_utc)
    if consumed_at > current_utc:
        raise ValidationError("receipt.consumed_at_utc must not be in the future")
    return validated | {
        "signature_hmac_sha256": signature,
        "receipt_sha256": receipt_sha256,
    }


def _load_json(path: Path) -> Any:
    def reject_duplicate_keys(pairs: list[tuple[str, Any]]) -> dict[str, Any]:
        result: dict[str, Any] = {}
        for key, value in pairs:
            if key in result:
                raise ValidationError(f"duplicate JSON key: {key}")
            result[key] = value
        return result

    try:
        return json.loads(
            path.read_text(encoding="utf-8"),
            object_pairs_hook=reject_duplicate_keys,
        )
    except (OSError, UnicodeError, json.JSONDecodeError) as exc:
        raise ValidationError(f"could not read JSON from {path}: {exc}") from exc


def _write_json(path: Path, value: Any, *, force: bool) -> None:
    if path.exists() and not force:
        raise ValidationError(f"output already exists: {path} (use --force to replace it)")
    if not path.parent.is_dir():
        raise ValidationError(f"output directory does not exist: {path.parent}")
    try:
        path.write_text(canonical_json(value) + "\n", encoding="utf-8", newline="\n")
    except OSError as exc:
        raise ValidationError(f"could not write output {path}: {exc}") from exc


def _secret_from_environment() -> bytes:
    value = os.environ.get(SIGNING_SECRET_ENV)
    if value is None:
        raise ValidationError(f"{SIGNING_SECRET_ENV} is not set")
    return _secret(value)


def _request_from_file(value: Any) -> Any:
    if isinstance(value, dict) and "activation_request" in value:
        return value["activation_request"]
    return value


def _parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(description=__doc__)
    commands = parser.add_subparsers(dest="command", required=True)

    prepare = commands.add_parser("prepare", help="build Prepared/Pending page rows")
    prepare.add_argument("input", type=Path, help="cohort input JSON")
    prepare.add_argument("--output", required=True, type=Path)
    prepare.add_argument("--force", action="store_true")

    sign = commands.add_parser("sign", help="sign an exact PAGE_ACTIVATION request")
    sign.add_argument("request", type=Path, help="request or prepare output JSON")
    sign.add_argument("--receipt-id", required=True)
    sign.add_argument("--approved-by", required=True)
    sign.add_argument("--approved-at-utc", required=True)
    sign.add_argument("--expires-at-utc", required=True)
    sign.add_argument("--consumed-at-utc", required=True)
    sign.add_argument("--nonce", required=True)
    sign.add_argument("--output", required=True, type=Path)
    sign.add_argument("--force", action="store_true")

    verify = commands.add_parser("verify", help="verify a receipt at current UTC time")
    verify.add_argument("receipt", type=Path)
    return parser


def main(argv: Sequence[str] | None = None) -> int:
    args = _parser().parse_args(argv)
    try:
        if args.command == "prepare":
            if args.input.resolve() == args.output.resolve():
                raise ValidationError("input and output paths must differ")
            _write_json(
                args.output,
                prepare_batch(_load_json(args.input)),
                force=args.force,
            )
            return 0
        if args.command == "sign":
            if args.request.resolve() == args.output.resolve():
                raise ValidationError("request and output paths must differ")
            request = _request_from_file(_load_json(args.request))
            receipt = sign_activation_request(
                request,
                receipt_id=args.receipt_id,
                approved_by=args.approved_by,
                approved_at_utc=args.approved_at_utc,
                expires_at_utc=args.expires_at_utc,
                consumed_at_utc=args.consumed_at_utc,
                nonce=args.nonce,
                secret=_secret_from_environment(),
            )
            _write_json(args.output, receipt, force=args.force)
            return 0
        if args.command == "verify":
            receipt = verify_activation_receipt(
                _load_json(args.receipt), secret=_secret_from_environment()
            )
            print(
                canonical_json(
                    {
                        "ok": True,
                        "receipt_id": receipt["receipt_id"],
                        "scope": receipt["scope"],
                        "batch_id": receipt["batch_id"],
                        "recipient_set_hash": receipt["recipient_set_hash"],
                        "page_set_sha256": receipt["page_set_sha256"],
                        "recipient_count": receipt["recipient_count"],
                    }
                )
            )
            return 0
        raise ValidationError("unknown command")
    except ValidationError as exc:
        print(f"error: {exc}", file=sys.stderr)
        return 2


if __name__ == "__main__":
    raise SystemExit(main())
