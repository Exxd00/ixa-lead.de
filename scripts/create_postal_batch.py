#!/usr/bin/env python3
"""Build a strictly validated, local-only IXA postal batch from JSON.

The generator never sends, publishes, uploads, or marks a letter as dispatched.
It creates one two-page PDF per recipient, one combined duplex-print PDF, a
manifest, a machine-readable QA report, print instructions, and a ZIP archive.
An activation checklist keeps Sheet, Apps Script, website, legal, and offline
QR-verification gates explicit without opening a production personal page.

Input schema (all recipient fields are required)::

    {
      "batch_id": "SAFE-BATCH-ID",
      "content_version": "IXA-POSTAL-V1",
      "letter_date": "YYYY-MM-DD",
      "base_url": "https://ixa-leads.de",
      "privacy_facts": {
        "provider_disclosures": [
          {
            "service": "contact_register_apps_script",
            "legal_name": "exact contractual entity",
            "country": "documented country",
            "transfer_details": "documented transfer position and safeguard",
            "safeguards_copy_method": "how a copy can be obtained"
          }
        ],
        "no_response_retention_days": 0,
        "visit_event_retention_days": 0,
        "response_retention_rule": "documented rule",
        "suppression_record_legal_basis": "documented legal basis",
        "hosting_connection_data_details": "documented settings and retention",
        "analytics_disabled_verified": true,
        "dpo_status": "NOT_REQUIRED or CONTACT_PROVIDED",
        "dpo_contact": "required only when CONTACT_PROVIDED",
        "no_profiling_or_article22_verified": true
      },
      "recipients": [
        {
          "company_id": "...",
          "contact_id": "...",
          "printed_ref": "...",
          "public_token": "16-to-80-url-safe-characters",
          "address_salutation": "Herrn",
          "recipient_name": "...",
          "recipient_role": "...",
          "identity_source_urls": ["https://..."],
          "identity_source_verified_at": "YYYY-MM-DD",
          "address_source_urls": ["https://..."],
          "address_source_verified_at": "YYYY-MM-DD",
          "greeting": "Sehr geehrter ... ,",
          "company_name": "...",
          "street": "...",
          "postal_code": "904..",
          "city": "Nürnberg",
          "subject": "...",
          "opening": "...",
          "observations": [
            {
              "title": "...",
              "fact": "...",
              "impact": "...",
              "source_label": "...",
              "source_url": "https://...",
              "verified_at": "YYYY-MM-DD"
            },
            { "...": "exactly one second observation with its source" }
          ],
          "suppression": false,
          "legal_status": "Approved",
          "page_status": "Ready"
        }
      ]
    }

Exactly 50 recipients are required. ``--draft`` visibly marks every page as
ENTWURF / NICHT VERSENDEN. ``--print-ready`` additionally requires the exact
gates ``legal_status=Approved`` and ``page_status=Ready`` for every recipient,
documented sources for name/function/address, complete provider/transfer/
retention facts, and a separate, unexpired Apps-Script-signed activation
receipt whose batch digest matches every material input field. Missing legal
facts remain visible activation blockers in a draft; they are never guessed.
The private RSA key remains in Apps Script; this generator verifies with the
pinned public key in the repository.
"""

from __future__ import annotations

import argparse
import csv
import hashlib
import json
import os
import re
import shutil
import sys
import tempfile
import unicodedata
import zipfile
from dataclasses import dataclass
from datetime import date, datetime, timedelta, timezone
from pathlib import Path
from typing import Any, Iterable, Mapping, Sequence
from urllib.parse import urlsplit, urlunsplit
from xml.sax.saxutils import escape

try:
    from .postal_activation import (
        PostalActivationError,
        verify_postal_activation,
    )
except ImportError:  # Direct ``python scripts/create_postal_batch.py`` execution.
    from postal_activation import (  # type: ignore[no-redef]
        PostalActivationError,
        verify_postal_activation,
    )

from pypdf import PdfReader, PdfWriter
from pypdf.errors import PdfReadError
from reportlab.graphics.barcode import qr
from reportlab.graphics.shapes import Drawing
from reportlab.lib import colors
from reportlab.lib.enums import TA_LEFT
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import mm
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.platypus import (
    BaseDocTemplate,
    Flowable,
    Frame,
    KeepTogether,
    PageBreak,
    PageTemplate,
    Paragraph,
    Spacer,
    Table,
    TableStyle,
)
from reportlab.platypus.doctemplate import LayoutError


ROOT = Path(__file__).resolve().parents[1]
DEFAULT_OUTPUT_DIR = ROOT / "output" / "postal"
EXPECTED_RECIPIENT_COUNT = 50
GENERATOR_VERSION = "1.1.0"

PROVIDER_SERVICES = (
    "contact_register_apps_script",
    "personal_page_hosting",
    "postal_transport",
    "whatsapp_link",
)
PROVIDER_SERVICE_LABELS = {
    "contact_register_apps_script": "Kontaktregister und Apps Script",
    "personal_page_hosting": "Hosting der persönlichen Prüfseite",
    "postal_transport": "Postbeförderung",
    "whatsapp_link": "WhatsApp-Link",
}

SAFE_ID = re.compile(r"^[A-Za-z0-9][A-Za-z0-9._-]{2,79}$")
PUBLIC_TOKEN = re.compile(r"^[A-Za-z0-9_-]{16,80}$")
NURNBERG_POSTCODES = frozenset(
    {
        "90402",
        "90403",
        "90408",
        "90409",
        "90411",
        "90419",
        "90425",
        "90427",
        "90429",
        "90431",
        "90439",
        "90441",
        "90443",
        "90449",
        "90451",
        "90453",
        "90455",
        "90459",
        "90461",
        "90469",
        "90471",
        "90473",
        "90475",
        "90478",
        "90480",
        "90482",
        "90489",
        "90491",
    }
)
FORBIDDEN_PRINT_READY_TEXT = (
    "MUSTER - NICHT VERSENDEN",
    "MUSTERHINWEIS",
    "FIKTIVER EMPFÄNGER",
    "NICHT VERSENDEN",
    "MUSTERSTADT",
    "MAX MUSTERMANN",
    "EXAMPLE.COM",
    "/VORSCHAU/",
    "LEGAL_REVIEW",
)

NAVY = colors.HexColor("#102A43")
BLUE = colors.HexColor("#1463E6")
BLUE_SOFT = colors.HexColor("#EAF2FF")
INK = colors.HexColor("#17212B")
MUTED = colors.HexColor("#52606D")
LINE = colors.HexColor("#D9E2EC")
PAPER = colors.HexColor("#FFFFFF")
STONE = colors.HexColor("#F7F9FC")
RED = colors.HexColor("#A82424")
GREEN = colors.HexColor("#13795B")


class BatchValidationError(ValueError):
    """Raised when input or generated artifacts violate a hard gate."""


@dataclass(frozen=True)
class Observation:
    title: str
    fact: str
    impact: str
    source_label: str
    source_url: str
    verified_at: date


@dataclass(frozen=True)
class ProviderDisclosure:
    service: str
    legal_name: str
    country: str
    transfer_details: str
    safeguards_copy_method: str


@dataclass(frozen=True)
class PrivacyFacts:
    provider_disclosures: tuple[ProviderDisclosure, ...]
    no_response_retention_days: int | None
    visit_event_retention_days: int | None
    response_retention_rule: str | None
    suppression_record_legal_basis: str | None
    hosting_connection_data_details: str | None
    analytics_disabled_verified: bool | None
    dpo_status: str | None
    dpo_contact: str | None
    no_profiling_or_article22_verified: bool | None


@dataclass(frozen=True)
class Recipient:
    company_id: str
    contact_id: str
    printed_ref: str
    public_token: str
    page_content_id: str
    experiment_id: str
    page_version: str
    letter_id: str
    page_content_sha256: str
    address_salutation: str
    recipient_name: str
    recipient_role: str
    identity_source_urls: tuple[str, ...]
    identity_source_verified_at: date | None
    address_source_urls: tuple[str, ...]
    address_source_verified_at: date | None
    greeting: str
    company_name: str
    street: str
    postal_code: str
    city: str
    subject: str
    opening: str
    observations: tuple[Observation, Observation]
    suppression: bool
    legal_status: str
    page_status: str
    personal_page_url: str


@dataclass(frozen=True)
class Batch:
    batch_id: str
    content_version: str
    letter_date: date
    base_url: str
    privacy_facts: PrivacyFacts
    recipients: tuple[Recipient, ...]


@dataclass(frozen=True)
class GeneratedRecipient:
    order: int
    recipient: Recipient
    relative_pdf: str
    pdf_sha256: str
    combined_page_start: int
    combined_page_end: int


@dataclass(frozen=True)
class VerifiedActivation:
    receipt_id: str
    approved_by: str
    approved_at_utc: datetime
    expires_at_utc: datetime
    batch_digest_sha256: str
    receipt_sha256: str


def _register_fonts() -> tuple[str, str]:
    regular = Path("/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf")
    bold = Path("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf")
    if not regular.is_file() or not bold.is_file():
        raise RuntimeError(
            "Required DejaVu fonts are missing; refusing a non-reproducible PDF build."
        )
    pdfmetrics.registerFont(TTFont("IXA-Regular", str(regular)))
    pdfmetrics.registerFont(TTFont("IXA-Bold", str(bold)))
    return "IXA-Regular", "IXA-Bold"


FONT, FONT_BOLD = _register_fonts()


def _build_styles() -> dict[str, ParagraphStyle]:
    sample = getSampleStyleSheet()
    return {
        "body": ParagraphStyle(
            "IXABody",
            parent=sample["BodyText"],
            fontName=FONT,
            fontSize=8.2,
            leading=10.35,
            textColor=INK,
            spaceAfter=2.2,
            splitLongWords=True,
        ),
        "small": ParagraphStyle(
            "IXASmall",
            parent=sample["BodyText"],
            fontName=FONT,
            fontSize=7.35,
            leading=9.15,
            textColor=MUTED,
            spaceAfter=1.5,
            splitLongWords=True,
        ),
        "legal": ParagraphStyle(
            "IXALegal",
            parent=sample["BodyText"],
            fontName=FONT,
            fontSize=7.05,
            leading=8.25,
            textColor=MUTED,
            spaceAfter=1.2,
            splitLongWords=True,
        ),
        "micro": ParagraphStyle(
            "IXAMicro",
            parent=sample["BodyText"],
            fontName=FONT,
            fontSize=6.15,
            leading=7.2,
            textColor=MUTED,
            splitLongWords=True,
        ),
        "title": ParagraphStyle(
            "IXATitle",
            parent=sample["Title"],
            fontName=FONT_BOLD,
            fontSize=15.7,
            leading=18.5,
            textColor=NAVY,
            alignment=TA_LEFT,
            spaceAfter=4.5,
            splitLongWords=True,
        ),
        "section": ParagraphStyle(
            "IXASection",
            parent=sample["Heading2"],
            fontName=FONT_BOLD,
            fontSize=8.25,
            leading=9.5,
            textColor=NAVY,
            spaceBefore=0.7,
            spaceAfter=0.3,
            splitLongWords=True,
        ),
        "card_title": ParagraphStyle(
            "IXACardTitle",
            parent=sample["Heading3"],
            fontName=FONT_BOLD,
            fontSize=9.0,
            leading=11.0,
            textColor=NAVY,
            spaceAfter=1.5,
            splitLongWords=True,
        ),
        "cta": ParagraphStyle(
            "IXACTA",
            parent=sample["BodyText"],
            fontName=FONT_BOLD,
            fontSize=9.0,
            leading=11.0,
            textColor=NAVY,
            splitLongWords=True,
        ),
    }


STYLES = _build_styles()


class QRCodeFlowable(Flowable):
    def __init__(self, value: str, size: float = 27 * mm) -> None:
        super().__init__()
        self.value = value
        self.width = size
        self.height = size

    def draw(self) -> None:
        widget = qr.QrCodeWidget(self.value)
        bounds = widget.getBounds()
        width = bounds[2] - bounds[0]
        height = bounds[3] - bounds[1]
        drawing = Drawing(
            self.width,
            self.height,
            transform=[self.width / width, 0, 0, self.height / height, 0, 0],
        )
        drawing.add(widget)
        drawing.drawOn(self.canv, 0, 0)


class Rule(Flowable):
    def __init__(self, color: colors.Color = LINE, width: float = 1) -> None:
        super().__init__()
        self.color = color
        self.line_width = width
        self.height = 1

    def wrap(self, avail_width: float, avail_height: float) -> tuple[float, float]:
        self._available_width = avail_width
        return avail_width, self.height

    def draw(self) -> None:
        self.canv.setStrokeColor(self.color)
        self.canv.setLineWidth(self.line_width)
        self.canv.line(0, 0, self._available_width, 0)


def _text(value: Any, field: str, *, minimum: int = 1, maximum: int) -> str:
    if not isinstance(value, str):
        raise BatchValidationError(f"{field} must be a string")
    normalized = unicodedata.normalize("NFC", value).strip()
    if len(normalized) < minimum or len(normalized) > maximum:
        raise BatchValidationError(
            f"{field} must contain {minimum}..{maximum} characters"
        )
    bidi_controls = {"RLO", "LRO", "RLE", "LRE", "PDF", "RLI", "LRI", "FSI", "PDI"}
    if any(
        ord(char) < 32
        or ord(char) == 127
        or unicodedata.bidirectional(char) in bidi_controls
        for char in normalized
    ):
        raise BatchValidationError(
            f"{field} contains a control, line-break, tab, or bidi-control character"
        )
    return normalized


def _optional_text(
    value: Any, field: str, *, minimum: int = 1, maximum: int
) -> str | None:
    if value is None:
        return None
    return _text(value, field, minimum=minimum, maximum=maximum)


def _optional_bool(value: Any, field: str) -> bool | None:
    if value is None:
        return None
    if not isinstance(value, bool):
        raise BatchValidationError(f"{field} must be a JSON boolean")
    return value


def _optional_positive_int(
    value: Any, field: str, *, maximum: int = 3650
) -> int | None:
    if value is None:
        return None
    if isinstance(value, bool) or not isinstance(value, int):
        raise BatchValidationError(f"{field} must be an integer")
    if value < 1 or value > maximum:
        raise BatchValidationError(f"{field} must be within 1..{maximum}")
    return value


def _mapping(value: Any, field: str) -> Mapping[str, Any]:
    if not isinstance(value, Mapping):
        raise BatchValidationError(f"{field} must be a JSON object")
    return value


def _iso_date(value: Any, field: str) -> date:
    raw = _text(value, field, maximum=10)
    try:
        parsed = date.fromisoformat(raw)
    except ValueError as exc:
        raise BatchValidationError(f"{field} must be YYYY-MM-DD") from exc
    if parsed.isoformat() != raw:
        raise BatchValidationError(f"{field} must be canonical YYYY-MM-DD")
    return parsed


def _optional_iso_date(value: Any, field: str) -> date | None:
    if value is None:
        return None
    return _iso_date(value, field)


def _safe_id(value: Any, field: str) -> str:
    raw = _text(value, field, minimum=3, maximum=80)
    if not SAFE_ID.fullmatch(raw):
        raise BatchValidationError(
            f"{field} must contain only ASCII letters, digits, dot, underscore, or hyphen"
        )
    return raw


def _page_version(value: Any, field: str) -> str:
    raw = _text(value, field, maximum=20)
    if not re.fullmatch(r"v[1-9][0-9]{0,5}(?:\.(?:0|[1-9][0-9]{0,5}))?", raw):
        raise BatchValidationError(f"{field} must match lowercase vN or vN.N")
    return raw


def _lower_hex_sha256(value: Any, field: str) -> str:
    raw = _text(value, field, minimum=64, maximum=64)
    if not re.fullmatch(r"[0-9a-f]{64}", raw):
        raise BatchValidationError(f"{field} must be 64 lowercase hexadecimal characters")
    return raw


def _origin(value: Any, field: str) -> str:
    raw = _text(value, field, maximum=200).rstrip("/")
    try:
        parts = urlsplit(raw)
        hostname = parts.hostname
        port = parts.port
    except ValueError as exc:
        raise BatchValidationError(f"{field} is not a valid HTTPS origin") from exc
    if (
        parts.scheme != "https"
        or not parts.netloc
        or not hostname
        or parts.username
        or parts.password
        or parts.path not in ("", "/")
        or parts.query
        or parts.fragment
        or any(char.isspace() or char == "\\" for char in raw)
    ):
        raise BatchValidationError(f"{field} must be a bare HTTPS origin")
    try:
        hostname.encode("idna")
    except UnicodeError as exc:
        raise BatchValidationError(f"{field} contains an invalid hostname") from exc
    if port is not None and not 1 <= port <= 65535:
        raise BatchValidationError(f"{field} contains an invalid port")
    return urlunsplit(("https", parts.netloc.lower(), "", "", ""))


def _source_url(value: Any, field: str) -> str:
    raw = _text(value, field, maximum=320)
    try:
        parts = urlsplit(raw)
        hostname = parts.hostname
        port = parts.port
    except ValueError as exc:
        raise BatchValidationError(f"{field} is not a valid HTTP(S) URL") from exc
    if (
        parts.scheme not in {"http", "https"}
        or not parts.netloc
        or not hostname
        or any(char.isspace() or char == "\\" for char in raw)
    ):
        raise BatchValidationError(f"{field} must be an absolute HTTP(S) URL")
    if parts.username or parts.password:
        raise BatchValidationError(f"{field} must not contain credentials")
    try:
        hostname.encode("idna")
    except UnicodeError as exc:
        raise BatchValidationError(f"{field} contains an invalid hostname") from exc
    if port is not None and not 1 <= port <= 65535:
        raise BatchValidationError(f"{field} contains an invalid port")
    return raw


def _source_url_list(value: Any, field: str) -> tuple[str, ...]:
    if value is None:
        return ()
    if not isinstance(value, list):
        raise BatchValidationError(f"{field} must be a JSON array")
    if len(value) > 8:
        raise BatchValidationError(f"{field} must contain at most 8 URLs")
    urls = tuple(
        _source_url(item, f"{field}[{index}]")
        for index, item in enumerate(value)
    )
    if len({url.casefold() for url in urls}) != len(urls):
        raise BatchValidationError(f"{field} contains a duplicate URL")
    return urls


def _parse_provider_disclosure(value: Any, *, index: int) -> ProviderDisclosure:
    prefix = f"privacy_facts.provider_disclosures[{index}]"
    item = _mapping(value, prefix)
    required = {
        "service",
        "legal_name",
        "country",
        "transfer_details",
        "safeguards_copy_method",
    }
    if set(item) != required:
        missing = sorted(required - set(item))
        extra = sorted(set(item) - required)
        raise BatchValidationError(
            f"{prefix} schema mismatch; missing={missing}, extra={extra}"
        )
    service = _text(item.get("service"), f"{prefix}.service", maximum=60)
    if service not in PROVIDER_SERVICES:
        raise BatchValidationError(
            f"{prefix}.service must be one of {list(PROVIDER_SERVICES)}"
        )
    return ProviderDisclosure(
        service=service,
        legal_name=_text(
            item.get("legal_name"), f"{prefix}.legal_name", maximum=180
        ),
        country=_text(item.get("country"), f"{prefix}.country", maximum=100),
        transfer_details=_text(
            item.get("transfer_details"),
            f"{prefix}.transfer_details",
            minimum=12,
            maximum=700,
        ),
        safeguards_copy_method=_text(
            item.get("safeguards_copy_method"),
            f"{prefix}.safeguards_copy_method",
            minimum=8,
            maximum=400,
        ),
    )


def _parse_privacy_facts(value: Any) -> PrivacyFacts:
    if value is None:
        item: Mapping[str, Any] = {}
    else:
        item = _mapping(value, "privacy_facts")
    allowed = {
        "provider_disclosures",
        "no_response_retention_days",
        "visit_event_retention_days",
        "response_retention_rule",
        "suppression_record_legal_basis",
        "hosting_connection_data_details",
        "analytics_disabled_verified",
        "dpo_status",
        "dpo_contact",
        "no_profiling_or_article22_verified",
    }
    extra = sorted(set(item) - allowed)
    if extra:
        raise BatchValidationError(f"privacy_facts has unsupported fields: {extra}")

    raw_providers = item.get("provider_disclosures", [])
    if not isinstance(raw_providers, list):
        raise BatchValidationError(
            "privacy_facts.provider_disclosures must be a JSON array"
        )
    providers = tuple(
        _parse_provider_disclosure(provider, index=index)
        for index, provider in enumerate(raw_providers)
    )
    services = [provider.service for provider in providers]
    if len(services) != len(set(services)):
        raise BatchValidationError(
            "privacy_facts.provider_disclosures contains a duplicate service"
        )

    dpo_status = _optional_text(
        item.get("dpo_status"), "privacy_facts.dpo_status", maximum=40
    )
    if dpo_status not in {
        None,
        "NOT_APPOINTED",
        "NOT_REQUIRED",
        "CONTACT_PROVIDED",
    }:
        raise BatchValidationError(
            "privacy_facts.dpo_status must be NOT_APPOINTED, NOT_REQUIRED, "
            "or CONTACT_PROVIDED"
        )
    dpo_contact = _optional_text(
        item.get("dpo_contact"), "privacy_facts.dpo_contact", maximum=300
    )
    if dpo_status == "CONTACT_PROVIDED" and not dpo_contact:
        raise BatchValidationError(
            "privacy_facts.dpo_contact is required when dpo_status=CONTACT_PROVIDED"
        )
    if dpo_status != "CONTACT_PROVIDED" and dpo_contact:
        raise BatchValidationError(
            "privacy_facts.dpo_contact is allowed only when dpo_status=CONTACT_PROVIDED"
        )

    return PrivacyFacts(
        provider_disclosures=providers,
        no_response_retention_days=_optional_positive_int(
            item.get("no_response_retention_days"),
            "privacy_facts.no_response_retention_days",
        ),
        visit_event_retention_days=_optional_positive_int(
            item.get("visit_event_retention_days"),
            "privacy_facts.visit_event_retention_days",
        ),
        response_retention_rule=_optional_text(
            item.get("response_retention_rule"),
            "privacy_facts.response_retention_rule",
            minimum=12,
            maximum=700,
        ),
        suppression_record_legal_basis=_optional_text(
            item.get("suppression_record_legal_basis"),
            "privacy_facts.suppression_record_legal_basis",
            minimum=8,
            maximum=300,
        ),
        hosting_connection_data_details=_optional_text(
            item.get("hosting_connection_data_details"),
            "privacy_facts.hosting_connection_data_details",
            minimum=12,
            maximum=700,
        ),
        analytics_disabled_verified=_optional_bool(
            item.get("analytics_disabled_verified"),
            "privacy_facts.analytics_disabled_verified",
        ),
        dpo_status=dpo_status,
        dpo_contact=dpo_contact,
        no_profiling_or_article22_verified=_optional_bool(
            item.get("no_profiling_or_article22_verified"),
            "privacy_facts.no_profiling_or_article22_verified",
        ),
    )


def _privacy_facts_payload(facts: PrivacyFacts) -> dict[str, Any]:
    return {
        "provider_disclosures": [
            {
                "service": provider.service,
                "legal_name": provider.legal_name,
                "country": provider.country,
                "transfer_details": provider.transfer_details,
                "safeguards_copy_method": provider.safeguards_copy_method,
            }
            for provider in facts.provider_disclosures
        ],
        "no_response_retention_days": facts.no_response_retention_days,
        "visit_event_retention_days": facts.visit_event_retention_days,
        "response_retention_rule": facts.response_retention_rule,
        "suppression_record_legal_basis": facts.suppression_record_legal_basis,
        "hosting_connection_data_details": facts.hosting_connection_data_details,
        "analytics_disabled_verified": facts.analytics_disabled_verified,
        "dpo_status": facts.dpo_status,
        "dpo_contact": facts.dpo_contact,
        "no_profiling_or_article22_verified": (
            facts.no_profiling_or_article22_verified
        ),
    }


def _privacy_activation_gates(facts: PrivacyFacts) -> tuple[str, ...]:
    gates: list[str] = []
    services = {provider.service for provider in facts.provider_disclosures}
    for service in PROVIDER_SERVICES:
        if service not in services:
            gates.append(f"PROVIDER_DISCLOSURE_MISSING:{service}")
    if facts.no_response_retention_days is None:
        gates.append("RETENTION_NO_RESPONSE_MISSING")
    if facts.visit_event_retention_days is None:
        gates.append("RETENTION_VISIT_EVENT_MISSING")
    if facts.response_retention_rule is None:
        gates.append("RETENTION_RESPONSE_RULE_MISSING")
    if facts.suppression_record_legal_basis is None:
        gates.append("SUPPRESSION_LEGAL_BASIS_MISSING")
    if facts.hosting_connection_data_details is None:
        gates.append("HOSTING_CONNECTION_DATA_FACTS_MISSING")
    if facts.analytics_disabled_verified is not True:
        gates.append("ANALYTICS_DISABLED_NOT_VERIFIED")
    if facts.dpo_status is None:
        gates.append("DPO_STATUS_NOT_CONFIRMED")
    if facts.no_profiling_or_article22_verified is not True:
        gates.append("NO_PROFILING_ARTICLE22_NOT_CONFIRMED")
    return tuple(gates)


def _recipient_source_gates(recipient: Recipient) -> tuple[str, ...]:
    gates: list[str] = []
    if not recipient.identity_source_urls:
        gates.append("IDENTITY_SOURCE_URLS_MISSING")
    if recipient.identity_source_verified_at is None:
        gates.append("IDENTITY_SOURCE_DATE_MISSING")
    if not recipient.address_source_urls:
        gates.append("ADDRESS_SOURCE_URLS_MISSING")
    if recipient.address_source_verified_at is None:
        gates.append("ADDRESS_SOURCE_DATE_MISSING")
    return tuple(gates)


def _recipient_activation_gates(
    batch: Batch, recipient: Recipient
) -> tuple[str, ...]:
    gates = [*_privacy_activation_gates(batch.privacy_facts)]
    gates.extend(_recipient_source_gates(recipient))
    if recipient.legal_status != "Approved":
        gates.append("LEGAL_STATUS_NOT_APPROVED")
    if recipient.page_status != "Ready":
        gates.append("PAGE_STATUS_NOT_READY")
    return tuple(gates)


def _gate_description(code: str) -> str:
    descriptions = {
        "RETENTION_NO_RESPONSE_MISSING": "Löschfrist ohne Antwort",
        "RETENTION_VISIT_EVENT_MISSING": "Löschfrist für Besuchsereignisse",
        "RETENTION_RESPONSE_RULE_MISSING": "Aufbewahrungsregel nach einer Antwort",
        "SUPPRESSION_LEGAL_BASIS_MISSING": "Rechtsgrundlage des Sperrvermerks",
        "HOSTING_CONNECTION_DATA_FACTS_MISSING": "Hosting-Verbindungsdaten und Log-Fristen",
        "ANALYTICS_DISABLED_NOT_VERIFIED": "technische Prüfung der deaktivierten Analyse-Dienste",
        "DPO_STATUS_NOT_CONFIRMED": "Status eines Datenschutzbeauftragten",
        "NO_PROFILING_ARTICLE22_NOT_CONFIRMED": "Bestätigung zu Profiling und Art. 22 DSGVO",
        "IDENTITY_SOURCE_URLS_MISSING": "öffentliche Quellen für Name und Funktion",
        "IDENTITY_SOURCE_DATE_MISSING": "Abrufdatum der Quellen für Name und Funktion",
        "ADDRESS_SOURCE_URLS_MISSING": "öffentliche Quelle für die Geschäftsanschrift",
        "ADDRESS_SOURCE_DATE_MISSING": "Abrufdatum der Adressquelle",
        "LEGAL_STATUS_NOT_APPROVED": "abschließende rechtliche Freigabe",
        "PAGE_STATUS_NOT_READY": "gemeinsame Freigabe von Sheet, Apps Script und Seite",
    }
    if code.startswith("PROVIDER_DISCLOSURE_MISSING:"):
        service = code.split(":", 1)[1]
        return (
            "tatsächlicher Vertragspartner, Staat und Transferangaben für "
            + PROVIDER_SERVICE_LABELS.get(service, service)
        )
    return descriptions.get(code, code)


def _html(value: str) -> str:
    """Escape all user-controlled ReportLab markup and preserve line breaks."""
    return escape(value, {'"': "&quot;", "'": "&#39;"}).replace("\n", "<br/>")


def _csv_safe(value: Any) -> Any:
    """Prevent spreadsheet formula execution when the manifest is opened."""
    if not isinstance(value, str):
        return value
    if value.startswith(("=", "+", "-", "@", "\t", "\r")):
        return "'" + value
    return value


def _paragraph(value: str, style: str = "body") -> Paragraph:
    return Paragraph(_html(value), STYLES[style])


def _rich_paragraph(value: str, style: str = "body") -> Paragraph:
    """Render trusted, generator-owned markup only."""
    return Paragraph(value, STYLES[style])


def _german_date(value: date) -> str:
    months = (
        "Januar",
        "Februar",
        "März",
        "April",
        "Mai",
        "Juni",
        "Juli",
        "August",
        "September",
        "Oktober",
        "November",
        "Dezember",
    )
    return f"{value.day}. {months[value.month - 1]} {value.year}"


def _short_date(value: date) -> str:
    return value.strftime("%d.%m.%Y")


def _parse_observation(
    value: Any, *, recipient_index: int, observation_index: int, letter_date: date
) -> Observation:
    prefix = f"recipients[{recipient_index}].observations[{observation_index}]"
    item = _mapping(value, prefix)
    verified_at = _iso_date(item.get("verified_at"), f"{prefix}.verified_at")
    if verified_at > letter_date:
        raise BatchValidationError(
            f"{prefix}.verified_at cannot be after letter_date"
        )
    if letter_date - verified_at > timedelta(days=30):
        raise BatchValidationError(
            f"{prefix}.verified_at is more than 30 days before letter_date"
        )
    return Observation(
        title=_text(item.get("title"), f"{prefix}.title", maximum=110),
        fact=_text(item.get("fact"), f"{prefix}.fact", maximum=650),
        impact=_text(item.get("impact"), f"{prefix}.impact", maximum=480),
        source_label=_text(
            item.get("source_label"), f"{prefix}.source_label", maximum=100
        ),
        source_url=_source_url(
            item.get("source_url"), f"{prefix}.source_url"
        ),
        verified_at=verified_at,
    )


def _parse_recipient(
    value: Any,
    *,
    index: int,
    base_url: str,
    letter_date: date,
    print_ready: bool,
) -> Recipient:
    prefix = f"recipients[{index}]"
    item = _mapping(value, prefix)

    if item.get("suppression") is not False:
        raise BatchValidationError(f"{prefix}.suppression must be boolean false")

    city = _text(item.get("city"), f"{prefix}.city", maximum=80)
    if city != "Nürnberg":
        raise BatchValidationError(
            f"{prefix}.city must be exactly 'Nürnberg' for this batch"
        )
    postal_code = _text(
        item.get("postal_code"), f"{prefix}.postal_code", maximum=5
    )
    if postal_code not in NURNBERG_POSTCODES:
        raise BatchValidationError(
            f"{prefix}.postal_code is not in the strict Nürnberg postcode list"
        )

    public_token = _text(
        item.get("public_token"), f"{prefix}.public_token", minimum=16, maximum=80
    )
    if not PUBLIC_TOKEN.fullmatch(public_token):
        raise BatchValidationError(
            f"{prefix}.public_token must be 16..80 URL-safe ASCII characters"
        )
    if len(set(public_token)) < 8:
        raise BatchValidationError(
            f"{prefix}.public_token lacks sufficient character diversity"
        )

    observations_raw = item.get("observations")
    if not isinstance(observations_raw, list) or len(observations_raw) != 2:
        raise BatchValidationError(
            f"{prefix}.observations must contain exactly two observations"
        )
    observations = tuple(
        _parse_observation(
            observation,
            recipient_index=index,
            observation_index=observation_index,
            letter_date=letter_date,
        )
        for observation_index, observation in enumerate(observations_raw)
    )
    observation_signatures = {
        (
            observation.title.casefold(),
            observation.fact.casefold(),
            observation.impact.casefold(),
            observation.source_url.casefold(),
        )
        for observation in observations
    }
    if len(observation_signatures) != 2:
        raise BatchValidationError(
            f"{prefix}.observations must be two distinct sourced observations"
        )

    identity_source_urls = _source_url_list(
        item.get("identity_source_urls"), f"{prefix}.identity_source_urls"
    )
    identity_source_verified_at = _optional_iso_date(
        item.get("identity_source_verified_at"),
        f"{prefix}.identity_source_verified_at",
    )
    address_source_urls = _source_url_list(
        item.get("address_source_urls"), f"{prefix}.address_source_urls"
    )
    address_source_verified_at = _optional_iso_date(
        item.get("address_source_verified_at"),
        f"{prefix}.address_source_verified_at",
    )
    if identity_source_verified_at and not identity_source_urls:
        raise BatchValidationError(
            f"{prefix}.identity_source_verified_at requires identity_source_urls"
        )
    if address_source_verified_at and not address_source_urls:
        raise BatchValidationError(
            f"{prefix}.address_source_verified_at requires address_source_urls"
        )
    for field, verified_at in (
        ("identity_source_verified_at", identity_source_verified_at),
        ("address_source_verified_at", address_source_verified_at),
    ):
        if verified_at and verified_at > letter_date:
            raise BatchValidationError(f"{prefix}.{field} cannot be after letter_date")

    legal_status = _text(
        item.get("legal_status"), f"{prefix}.legal_status", maximum=40
    )
    page_status = _text(
        item.get("page_status"), f"{prefix}.page_status", maximum=40
    )
    if print_ready and legal_status != "Approved":
        raise BatchValidationError(
            f"{prefix}.legal_status must be exactly 'Approved' in --print-ready mode"
        )
    if print_ready and page_status != "Ready":
        raise BatchValidationError(
            f"{prefix}.page_status must be exactly 'Ready' in --print-ready mode"
        )

    recipient = Recipient(
        company_id=_safe_id(item.get("company_id"), f"{prefix}.company_id"),
        contact_id=_safe_id(item.get("contact_id"), f"{prefix}.contact_id"),
        printed_ref=_safe_id(item.get("printed_ref"), f"{prefix}.printed_ref"),
        public_token=public_token,
        page_content_id=_safe_id(
            item.get("page_content_id"), f"{prefix}.page_content_id"
        ),
        experiment_id=_safe_id(
            item.get("experiment_id"), f"{prefix}.experiment_id"
        ),
        page_version=_page_version(
            item.get("page_version"), f"{prefix}.page_version"
        ),
        letter_id=_safe_id(item.get("letter_id"), f"{prefix}.letter_id"),
        page_content_sha256=_lower_hex_sha256(
            item.get("page_content_sha256"), f"{prefix}.page_content_sha256"
        ),
        address_salutation=_text(
            item.get("address_salutation"),
            f"{prefix}.address_salutation",
            maximum=40,
        ),
        recipient_name=_text(
            item.get("recipient_name"), f"{prefix}.recipient_name", maximum=100
        ),
        recipient_role=_text(
            item.get("recipient_role"), f"{prefix}.recipient_role", maximum=100
        ),
        identity_source_urls=identity_source_urls,
        identity_source_verified_at=identity_source_verified_at,
        address_source_urls=address_source_urls,
        address_source_verified_at=address_source_verified_at,
        greeting=_text(item.get("greeting"), f"{prefix}.greeting", maximum=140),
        company_name=_text(
            item.get("company_name"), f"{prefix}.company_name", maximum=140
        ),
        street=_text(item.get("street"), f"{prefix}.street", maximum=120),
        postal_code=postal_code,
        city=city,
        subject=_text(item.get("subject"), f"{prefix}.subject", maximum=150),
        opening=_text(item.get("opening"), f"{prefix}.opening", maximum=650),
        observations=(observations[0], observations[1]),
        suppression=False,
        legal_status=legal_status,
        page_status=page_status,
        personal_page_url=f"{base_url}/r/{public_token}",
    )
    if print_ready:
        source_gates = _recipient_source_gates(recipient)
        if source_gates:
            raise BatchValidationError(
                f"{prefix} has unresolved identity/address provenance gates: "
                + ", ".join(source_gates)
            )
    return recipient


def _ensure_unique(recipients: Sequence[Recipient], field: str) -> None:
    seen: dict[str, int] = {}
    for index, recipient in enumerate(recipients):
        raw = getattr(recipient, field)
        key = unicodedata.normalize("NFC", str(raw)).strip().casefold()
        if key in seen:
            raise BatchValidationError(
                f"recipients[{index}].{field} duplicates recipients[{seen[key]}].{field}"
            )
        seen[key] = index


def parse_batch(payload: Any, *, print_ready: bool) -> Batch:
    root = _mapping(payload, "root")
    batch_id = _safe_id(root.get("batch_id"), "batch_id")
    content_version = _safe_id(root.get("content_version"), "content_version")
    letter_date = _iso_date(root.get("letter_date"), "letter_date")
    if letter_date > date.today() + timedelta(days=7):
        raise BatchValidationError("letter_date cannot be more than 7 days ahead")
    base_url = _origin(root.get("base_url", "https://ixa-leads.de"), "base_url")
    if print_ready and base_url != "https://ixa-leads.de":
        raise BatchValidationError(
            "base_url must be exactly 'https://ixa-leads.de' in --print-ready mode"
        )
    privacy_facts = _parse_privacy_facts(root.get("privacy_facts"))
    privacy_gates = _privacy_activation_gates(privacy_facts)
    if print_ready and privacy_gates:
        raise BatchValidationError(
            "privacy_facts has unresolved print-ready activation gates: "
            + ", ".join(privacy_gates)
        )

    raw_recipients = root.get("recipients")
    if not isinstance(raw_recipients, list):
        raise BatchValidationError("recipients must be a JSON array")
    if len(raw_recipients) != EXPECTED_RECIPIENT_COUNT:
        raise BatchValidationError(
            f"recipients must contain exactly {EXPECTED_RECIPIENT_COUNT} items; "
            f"received {len(raw_recipients)}"
        )

    recipients = tuple(
        _parse_recipient(
            value,
            index=index,
            base_url=base_url,
            letter_date=letter_date,
            print_ready=print_ready,
        )
        for index, value in enumerate(raw_recipients)
    )
    for field in (
        "company_id",
        "contact_id",
        "printed_ref",
        "public_token",
        "page_content_id",
        "letter_id",
        "personal_page_url",
    ):
        _ensure_unique(recipients, field)

    address_seen: dict[tuple[str, str, str, str], int] = {}
    for index, recipient in enumerate(recipients):
        key = (
            recipient.company_name.casefold(),
            recipient.street.casefold(),
            recipient.postal_code,
            recipient.city.casefold(),
        )
        if key in address_seen:
            raise BatchValidationError(
                f"recipients[{index}] duplicates the company/address of "
                f"recipients[{address_seen[key]}]"
            )
        address_seen[key] = index

    return Batch(
        batch_id=batch_id,
        content_version=content_version,
        letter_date=letter_date,
        base_url=base_url,
        privacy_facts=privacy_facts,
        recipients=recipients,
    )


def _canonical_json_bytes(value: Any) -> bytes:
    return json.dumps(
        value,
        ensure_ascii=False,
        sort_keys=True,
        separators=(",", ":"),
    ).encode("utf-8")


def _batch_digest_sha256(batch: Batch) -> str:
    material = {
        "batch_id": batch.batch_id,
        "content_version": batch.content_version,
        "letter_date": batch.letter_date.isoformat(),
        "base_url": batch.base_url,
        "privacy_facts": {
            "provider_disclosures": [
                {
                    "service": provider.service,
                    "legal_name": provider.legal_name,
                    "country": provider.country,
                    "transfer_details": provider.transfer_details,
                    "safeguards_copy_method": provider.safeguards_copy_method,
                }
                for provider in batch.privacy_facts.provider_disclosures
            ],
            "no_response_retention_days": (
                batch.privacy_facts.no_response_retention_days
            ),
            "visit_event_retention_days": (
                batch.privacy_facts.visit_event_retention_days
            ),
            "response_retention_rule": batch.privacy_facts.response_retention_rule,
            "suppression_record_legal_basis": (
                batch.privacy_facts.suppression_record_legal_basis
            ),
            "hosting_connection_data_details": (
                batch.privacy_facts.hosting_connection_data_details
            ),
            "analytics_disabled_verified": (
                batch.privacy_facts.analytics_disabled_verified
            ),
            "dpo_status": batch.privacy_facts.dpo_status,
            "dpo_contact": batch.privacy_facts.dpo_contact,
            "no_profiling_or_article22_verified": (
                batch.privacy_facts.no_profiling_or_article22_verified
            ),
        },
        "recipients": [
            {
                "company_id": recipient.company_id,
                "contact_id": recipient.contact_id,
                "printed_ref": recipient.printed_ref,
                "public_token": recipient.public_token,
                "page_content_id": recipient.page_content_id,
                "experiment_id": recipient.experiment_id,
                "page_version": recipient.page_version,
                "letter_id": recipient.letter_id,
                "page_content_sha256": recipient.page_content_sha256,
                "address_salutation": recipient.address_salutation,
                "recipient_name": recipient.recipient_name,
                "recipient_role": recipient.recipient_role,
                "identity_source_urls": list(recipient.identity_source_urls),
                "identity_source_verified_at": (
                    recipient.identity_source_verified_at.isoformat()
                    if recipient.identity_source_verified_at
                    else None
                ),
                "address_source_urls": list(recipient.address_source_urls),
                "address_source_verified_at": (
                    recipient.address_source_verified_at.isoformat()
                    if recipient.address_source_verified_at
                    else None
                ),
                "greeting": recipient.greeting,
                "company_name": recipient.company_name,
                "street": recipient.street,
                "postal_code": recipient.postal_code,
                "city": recipient.city,
                "subject": recipient.subject,
                "opening": recipient.opening,
                "observations": [
                    {
                        "title": observation.title,
                        "fact": observation.fact,
                        "impact": observation.impact,
                        "source_label": observation.source_label,
                        "source_url": observation.source_url,
                        "verified_at": observation.verified_at.isoformat(),
                    }
                    for observation in recipient.observations
                ],
                "suppression": recipient.suppression,
                "legal_status": recipient.legal_status,
                "page_status": recipient.page_status,
                "personal_page_url": recipient.personal_page_url,
            }
            for recipient in batch.recipients
        ],
    }
    return hashlib.sha256(_canonical_json_bytes(material)).hexdigest()


def _utc_datetime(value: Any, field: str) -> datetime:
    raw = _text(value, field, maximum=40)
    candidate = raw[:-1] + "+00:00" if raw.endswith("Z") else raw
    try:
        parsed = datetime.fromisoformat(candidate)
    except ValueError as exc:
        raise BatchValidationError(f"{field} must be an ISO-8601 timestamp") from exc
    if parsed.tzinfo is None:
        raise BatchValidationError(f"{field} must include a UTC offset")
    return parsed.astimezone(timezone.utc)


def _verify_activation_receipt(
    batch: Batch, payload: Any
) -> VerifiedActivation:
    receipt = _mapping(payload, "activation_receipt")
    batch_digest = _batch_digest_sha256(batch)
    try:
        verified = verify_postal_activation(
            receipt,
            batch_id=batch.batch_id,
            content_version=batch.content_version,
            letter_date=batch.letter_date.isoformat(),
            recipient_count=len(batch.recipients),
            batch_digest_sha256=batch_digest,
        )
    except PostalActivationError as exc:
        raise BatchValidationError(str(exc)) from exc
    return VerifiedActivation(
        receipt_id=verified.receipt_id,
        approved_by=verified.approved_by,
        approved_at_utc=verified.approved_at_utc,
        expires_at_utc=verified.expires_at_utc,
        batch_digest_sha256=batch_digest,
        receipt_sha256=verified.receipt_sha256,
    )


def _load_json(path: str) -> Any:
    try:
        if path == "-":
            return json.load(sys.stdin)
        with Path(path).open("r", encoding="utf-8") as handle:
            return json.load(handle)
    except (OSError, UnicodeError, json.JSONDecodeError) as exc:
        raise BatchValidationError(f"Could not read input JSON: {exc}") from exc


def _observation_card(number: int, observation: Observation) -> Table:
    number_cell = Table(
        [[_rich_paragraph(str(number), "cta")]],
        colWidths=[9 * mm],
        rowHeights=[9 * mm],
        style=TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, -1), BLUE_SOFT),
                ("TEXTCOLOR", (0, 0), (-1, -1), BLUE),
                ("ALIGN", (0, 0), (-1, -1), "CENTER"),
                ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
                ("BOX", (0, 0), (-1, -1), 0.7, colors.HexColor("#BFD4FF")),
            ]
        ),
    )
    content = [
        _paragraph(observation.title, "card_title"),
        _paragraph(observation.fact),
        _rich_paragraph(
            "<b>Mögliche geschäftliche Wirkung:</b> " + _html(observation.impact),
            "small",
        ),
        _rich_paragraph(
            "Quelle: "
            + _html(observation.source_label)
            + " · geprüft am "
            + _html(_short_date(observation.verified_at)),
            "micro",
        ),
    ]
    return Table(
        [[number_cell, content]],
        colWidths=[13 * mm, 148 * mm],
        style=TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, -1), STONE),
                ("BOX", (0, 0), (-1, -1), 0.65, LINE),
                ("VALIGN", (0, 0), (-1, -1), "TOP"),
                ("LEFTPADDING", (0, 0), (-1, -1), 3 * mm),
                ("RIGHTPADDING", (0, 0), (-1, -1), 3 * mm),
                ("TOPPADDING", (0, 0), (-1, -1), 2.0 * mm),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 2.0 * mm),
            ]
        ),
    )


def _first_page_story(batch: Batch, recipient: Recipient) -> list[Flowable]:
    local_badge = Table(
        [[
            _rich_paragraph("PERSÖNLICH FÜR", "cta"),
            _paragraph(f"{recipient.company_name} in Nürnberg", "small"),
        ]],
        colWidths=[43 * mm, 118 * mm],
        style=TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, -1), BLUE_SOFT),
                ("BOX", (0, 0), (-1, -1), 0.8, colors.HexColor("#BFD4FF")),
                ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
                ("LEFTPADDING", (0, 0), (-1, -1), 3 * mm),
                ("RIGHTPADDING", (0, 0), (-1, -1), 3 * mm),
                ("TOPPADDING", (0, 0), (-1, -1), 1.5 * mm),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 1.5 * mm),
            ]
        ),
    )
    sender = _rich_paragraph(
        "<b>IXA-Leads</b> · Emad Alzaim · Einsteinring 12 · 90453 Nürnberg",
        "small",
    )
    address_lines = (
        "PERSÖNLICH\n"
        f"{recipient.address_salutation} {recipient.recipient_name}\n"
        f"{recipient.company_name}\n"
        f"{recipient.street}\n"
        f"{recipient.postal_code} {recipient.city}"
    )
    recipient_block = Table(
        [
            [_paragraph(address_lines), ""],
            [
                _rich_paragraph(
                    "Funktion: " + _html(recipient.recipient_role), "micro"
                ),
                _paragraph(
                    f"Nürnberg, {_german_date(batch.letter_date)}", "small"
                ),
            ],
        ],
        colWidths=[88 * mm, 73 * mm],
        style=TableStyle(
            [
                ("SPAN", (0, 0), (1, 0)),
                ("VALIGN", (0, 0), (-1, -1), "TOP"),
                ("ALIGN", (1, 1), (1, 1), "RIGHT"),
                ("LEFTPADDING", (0, 0), (-1, -1), 0),
                ("RIGHTPADDING", (0, 0), (-1, -1), 0),
                ("TOPPADDING", (0, 0), (-1, -1), 0),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 0.8 * mm),
            ]
        ),
    )

    cta_copy = [
        _rich_paragraph("IHR PERSÖNLICHER IXA CHECK", "cta"),
        _rich_paragraph(
            "Scannen Sie den QR-Code. Auf Ihrer persönlichen Seite sehen Sie "
            "die beiden Punkte und entscheiden selbst, ob Sie den vertieften "
            "Check oder ein kurzes Gespräch per WhatsApp anfragen möchten."
        ),
        _rich_paragraph(
            "<b>Sie starten den Kontakt:</b> Beim Öffnen des WhatsApp-Links "
            "verarbeitet dessen Anbieter bereits Daten. IXA erhält Telefonnummer "
            "und Nachrichtentext erst nach Ihrem Senden. Beim Öffnen der "
            "Prüfseite wird ein diesem Schreiben zugeordnetes Besuchsereignis "
            "erfasst; Details stehen auf der Rückseite.",
            "small",
        ),
        _rich_paragraph(
            "Referenz: "
            + _html(recipient.printed_ref)
            + "<br/><font color='#1463E6'>"
            + _html(recipient.personal_page_url)
            + "</font>",
            "micro",
        ),
    ]
    cta = Table(
        [[QRCodeFlowable(recipient.personal_page_url), cta_copy]],
        colWidths=[35 * mm, 126 * mm],
        style=TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, -1), BLUE_SOFT),
                ("BOX", (0, 0), (-1, -1), 1.0, BLUE),
                ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
                ("LEFTPADDING", (0, 0), (-1, -1), 3 * mm),
                ("RIGHTPADDING", (0, 0), (-1, -1), 3 * mm),
                ("TOPPADDING", (0, 0), (-1, -1), 2.0 * mm),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 2.0 * mm),
            ]
        ),
    )
    objection = Table(
        [
            [_rich_paragraph("IHR WIDERSPRUCHSRECHT", "cta")],
            [
                _rich_paragraph(
                    "Sie können der Verarbeitung für Direktwerbung jederzeit "
                    "ohne Angabe von Gründen widersprechen. Gegen andere "
                    "Verarbeitungen nach Art. 6 Abs. 1 lit. f DSGVO können Sie "
                    "aus Gründen Ihrer besonderen Situation widersprechen. "
                    "Formlos an <b>info@ixa-leads.de</b> oder IXA-Leads, "
                    "Einsteinring 12, 90453 Nürnberg.",
                    "small",
                )
            ],
        ],
        colWidths=[161 * mm],
        style=TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, -1), colors.HexColor("#EFFAF6")),
                ("BOX", (0, 0), (-1, -1), 0.8, colors.HexColor("#90C9B8")),
                ("TEXTCOLOR", (0, 0), (-1, 0), GREEN),
                ("LEFTPADDING", (0, 0), (-1, -1), 3.2 * mm),
                ("RIGHTPADDING", (0, 0), (-1, -1), 3.2 * mm),
                ("TOPPADDING", (0, 0), (-1, -1), 1.5 * mm),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 1.5 * mm),
            ]
        ),
    )

    return [
        local_badge,
        Spacer(1, 2.0 * mm),
        sender,
        Rule(),
        Spacer(1, 2.0 * mm),
        recipient_block,
        Spacer(1, 0.7 * mm),
        _paragraph(recipient.subject, "title"),
        _paragraph(recipient.greeting),
        _paragraph(recipient.opening),
        Spacer(1, 1.2 * mm),
        _observation_card(1, recipient.observations[0]),
        Spacer(1, 1.6 * mm),
        _observation_card(2, recipient.observations[1]),
        Spacer(1, 1.6 * mm),
        _rich_paragraph(
            "Es geht nicht pauschal um eine neue Website. Im vertieften Check "
            "betrachten wir die ganze Kette: <b>Google-Suche → passende Seite → "
            "Kontakt → qualifizierte Anfrage → Angebot/Auftrag → messbares "
            "Ergebnis.</b> Die Einschätzung bleibt unverbindlich und enthält "
            "keine Ergebnisgarantie."
        ),
        Spacer(1, 1.6 * mm),
        cta,
        Spacer(1, 1.6 * mm),
        _rich_paragraph(
            "Mit freundlichen Grüßen<br/><b>Emad Alzaim</b><br/>IXA-Leads",
            "small",
        ),
        Spacer(1, 0.8 * mm),
        objection,
    ]


def _privacy_section(
    title: str, body: str, *, body_style: str = "legal"
) -> KeepTogether:
    return KeepTogether(
        [_rich_paragraph(title, "section"), _rich_paragraph(body, body_style)]
    )


def _gate_markup(text: str) -> str:
    return "<font color='#A82424'><b>AKTIVIERUNGSSPERRE:</b> " + text + "</font>"


def _source_group_text(
    label: str,
    urls: Sequence[str],
    verified_at: date | None,
    *,
    missing_label: str,
) -> str:
    if not urls:
        return _gate_markup(missing_label + " fehlen.")
    links = "<br/>".join(_html(url) for url in urls)
    if verified_at is None:
        date_text = _gate_markup("Abrufdatum dieser Quellen fehlt.")
    else:
        date_text = "abgerufen am " + _html(_short_date(verified_at))
    return f"<b>{label}:</b><br/>{links}<br/>{date_text}"


def _provider_map(facts: PrivacyFacts) -> dict[str, ProviderDisclosure]:
    return {provider.service: provider for provider in facts.provider_disclosures}


def _provider_text(facts: PrivacyFacts) -> str:
    providers = _provider_map(facts)
    if set(providers) != set(PROVIDER_SERVICES):
        missing = [
            PROVIDER_SERVICE_LABELS[service]
            for service in PROVIDER_SERVICES
            if service not in providers
        ]
        return (
            "Zugriff erhalten intern zuständige Personen bei IXA. "
            + _gate_markup(
                "Die tatsächlich eingesetzten Vertragspartner mit Rechtsform "
                "und Staat fehlen für: " + ", ".join(missing) + "."
            )
        )
    listed = "; ".join(
        f"{_html(PROVIDER_SERVICE_LABELS[service])}: "
        f"{_html(providers[service].legal_name)} "
        f"({_html(providers[service].country)})"
        for service in PROVIDER_SERVICES
    )
    return (
        "Zugriff erhalten intern zuständige Personen bei IXA sowie die "
        "tatsächlich eingesetzten Dienstleister: "
        + listed
        + ". Beim Öffnen des WhatsApp-Links verarbeitet der dort genannte "
        "WhatsApp-Anbieter Daten nach seinen Datenschutzhinweisen. IXA erhält "
        "Telefonnummer und Nachrichtentext erst, wenn die Nachricht abgesendet wird."
    )


def _transfer_text(facts: PrivacyFacts) -> str:
    providers = _provider_map(facts)
    if set(providers) != set(PROVIDER_SERVICES):
        return _gate_markup(
            "Für jeden tatsächlichen Dienstleister fehlen Staat, Aussage zur "
            "Drittlandverarbeitung, konkreter Angemessenheitsbeschluss oder "
            "Art.-46-Garantie und der Weg zum Erhalt einer Kopie."
        )
    return "<br/>".join(
        f"<b>{_html(provider.legal_name)}:</b> "
        f"{_html(provider.transfer_details)} Kopie/Information: "
        f"{_html(provider.safeguards_copy_method)}."
        for provider in (providers[service] for service in PROVIDER_SERVICES)
    )


def _retention_text(facts: PrivacyFacts) -> str:
    if (
        facts.no_response_retention_days is None
        or facts.visit_event_retention_days is None
        or facts.response_retention_rule is None
    ):
        return _gate_markup(
            "Verbindliche Löschfristen für Datensatz ohne Antwort, "
            "Besuchsereignis und Daten nach einer Antwort sind noch festzulegen. "
            "Eine bloße Erforderlichkeitsprüfung nach 365 Tagen genügt hierfür nicht."
        )
    return (
        "Bei ausbleibender Antwort löschen wir den Kontakt- und Prüfsatz "
        f"spätestens {_html(str(facts.no_response_retention_days))} Tage nach "
        "Versand. Das zugeordnete Besuchsereignis löschen wir nach "
        f"{_html(str(facts.visit_event_retention_days))} Tagen. Für eine Antwort "
        "gilt: " + _html(facts.response_retention_rule) + ". Nach einem "
        "Widerspruch bleiben nur die minimal erforderlichen Sperrdaten, soweit "
        "dies zur Beachtung des Widerspruchs notwendig ist."
    )


def _second_page_story(batch: Batch, recipient: Recipient) -> list[Flowable]:
    source_parts = [
        _source_group_text(
            "Name und berufliche Funktion",
            recipient.identity_source_urls,
            recipient.identity_source_verified_at,
            missing_label="Öffentlich zugängliche Quellen für Name und Funktion",
        ),
        _source_group_text(
            "Geschäftliche Anschrift",
            recipient.address_source_urls,
            recipient.address_source_verified_at,
            missing_label="Öffentlich zugängliche Quelle für die Geschäftsanschrift",
        ),
    ]
    for index, observation in enumerate(recipient.observations, start=1):
        source_parts.append(
            f"<b>Fachliche Beobachtung {index}:</b> "
            f"{_html(observation.source_label)}: {_html(observation.source_url)} "
            f"- abgerufen am {_html(_short_date(observation.verified_at))}."
        )
    source_text = "<br/><br/>".join(source_parts)

    facts = batch.privacy_facts
    suppression_basis = (
        _html(facts.suppression_record_legal_basis)
        if facts.suppression_record_legal_basis
        else _gate_markup(
            "Die Rechtsgrundlage für den minimalen Sperrvermerk nach einem "
            "Widerspruch ist noch festzulegen und zu dokumentieren."
        )
    )
    dpo_text = ""
    if facts.dpo_status == "CONTACT_PROVIDED" and facts.dpo_contact:
        dpo_text = " Datenschutzbeauftragter: " + _html(facts.dpo_contact) + "."
    elif facts.dpo_status is None:
        dpo_text = " " + _gate_markup(
            "Ob ein Datenschutzbeauftragter zu benennen ist, ist nicht bestätigt."
        )

    hosting_details = (
        _html(facts.hosting_connection_data_details)
        if facts.hosting_connection_data_details
        else _gate_markup(
            "Tatsächlicher Live-Host, dort verarbeitete Verbindungsdaten und "
            "Log-Fristen sind nicht bestätigt."
        )
    )
    analytics_details = (
        "Google Analytics, Google Ads und Vercel Analytics sind auf der "
        "persönlichen Prüfseite technisch als deaktiviert bestätigt."
        if facts.analytics_disabled_verified is True
        else _gate_markup(
            "Vor Freigabe ist technisch zu bestätigen, welche Analytics- und "
            "Werbedienste auf der Live-Prüfseite deaktiviert sind."
        )
    )
    automated_text = (
        "Es findet keine ausschließlich automatisierte Entscheidung mit "
        "rechtlicher oder ähnlich erheblicher Wirkung gemäß Art. 22 DSGVO und "
        "kein Profiling statt."
        if facts.no_profiling_or_article22_verified is True
        else _gate_markup(
            "Der Verantwortliche muss bestätigen, dass kein Profiling und keine "
            "Entscheidung nach Art. 22 DSGVO außerhalb des geprüften Codes erfolgt."
        )
    )
    objection = Table(
        [
            [
                _rich_paragraph(
                    "IHR WIDERSPRUCHSRECHT GEGEN DIREKTWERBUNG", "cta"
                )
            ],
            [
                _rich_paragraph(
                    "Sie können der Verarbeitung für Direktwerbung jederzeit "
                    "und ohne Angabe von Gründen widersprechen. Danach "
                    "verarbeiten wir Ihre Daten nicht mehr für Direktwerbung; "
                    "ein minimaler Sperrvermerk kann zur Beachtung des "
                    "Widerspruchs bleiben. Gegen andere Verarbeitungen auf "
                    "Grundlage von Art. 6 Abs. 1 lit. f DSGVO können Sie aus "
                    "Gründen Ihrer besonderen Situation widersprechen. Formlos "
                    "an <b>info@ixa-leads.de</b> oder IXA-Leads, Einsteinring 12, "
                    "90453 Nürnberg.",
                    "legal",
                )
            ],
        ],
        colWidths=[161 * mm],
        style=TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, -1), colors.HexColor("#EFFAF6")),
                ("BOX", (0, 0), (-1, -1), 0.8, colors.HexColor("#90C9B8")),
                ("TEXTCOLOR", (0, 0), (-1, 0), GREEN),
                ("LEFTPADDING", (0, 0), (-1, -1), 3.2 * mm),
                ("RIGHTPADDING", (0, 0), (-1, -1), 3.2 * mm),
                ("TOPPADDING", (0, 0), (-1, -1), 1.8 * mm),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 1.8 * mm),
            ]
        ),
    )

    return [
        _rich_paragraph(
            "Datenschutz zur ersten postalischen Kontaktaufnahme", "title"
        ),
        _rich_paragraph(
            "Informationen gemäß Art. 14 DSGVO · Rückseite des persönlichen "
            "Schreibens · Referenz "
            + _html(recipient.printed_ref),
            "small",
        ),
        Spacer(1, 0.6 * mm),
        _privacy_section(
            "1. Verantwortlicher",
            "Emad Alzaim, IXA-Leads, Einsteinring 12, 90453 Nürnberg, "
            "E-Mail: info@ixa-leads.de, Telefon: +49 162 9155408."
            + dpo_text,
        ),
        _privacy_section(
            "2. Zweck und Rechtsgrundlage",
            "Wir verarbeiten die Daten, um (1) dieses einmalige, individuell "
            "ausgewählte postalische Schreiben zu versenden und den "
            "Kontaktstatus zu verwalten, (2) eine von Ihnen veranlasste "
            "geschäftliche Anfrage zu bearbeiten und (3) einen Widerspruch zu "
            "erfassen und künftig zu beachten. Soweit die persönliche Prüfseite "
            "freigeschaltet ist, ordnen wir einen von Ihnen ausgelösten "
            "Seitenaufruf Ihrer Kontaktakte zu und stellen die Seite technisch "
            "sicher bereit. Rechtsgrundlage für postalische Direktansprache, "
            "Bearbeitung Ihrer Anfrage und Seitenaufruf ist Art. 6 Abs. 1 lit. f "
            "DSGVO. Berechtigte Interessen sind die einmalige sachbezogene "
            "Vorstellung gegenüber einer beruflich zuständigen Person, die "
            "Bearbeitung ihrer Anfrage sowie die sichere Bereitstellung und "
            "Zuordnung der Prüfseite. Sperrvermerk: " + suppression_basis,
        ),
        _privacy_section(
            "3. Kategorien personenbezogener Daten",
            "Name und berufliche Funktion, Unternehmenszugehörigkeit, "
            "geschäftliche Postanschrift, öffentlich zugängliche geschäftliche "
            "Informationen, Referenz und Linkschlüssel des Schreibens sowie - "
            "bei Nutzung der Prüfseite - Zeitpunkt, Kontakt- und "
            "Unternehmenskennung und Hash des Linkschlüssels. Bei einer Antwort "
            "können geschäftliche Kontaktdaten, Telefonnummer, Nachrichteninhalt "
            "und Kommunikationszeitpunkt hinzukommen; ferner Widerspruchs- und "
            "minimale Sperrinformationen, soweit sie entstehen.",
        ),
        _privacy_section("4. Herkunft der Daten", source_text, body_style="micro"),
        _privacy_section(
            "5. Empfänger",
            _provider_text(facts),
        ),
        _privacy_section(
            "6. Drittlandübermittlung",
            _transfer_text(facts),
            body_style="micro",
        ),
        _privacy_section(
            "7. Speicherdauer",
            _retention_text(facts),
        ),
        _privacy_section(
            "8. Persönliche Prüfseite",
            "Beim Aufruf speichern wir im vorgesehenen Kontaktregister einmalig "
            "ein Ihrer Kontaktakte zugeordnetes Besuchsereignis mit Zeitpunkt, "
            "Unternehmens- und Kontaktkennung sowie einem Hash des "
            "Linkschlüssels. IP-Adresse, User-Agent, Referrer und vollständiger "
            "Linkschlüssel werden nicht in dieses Kontaktregister übernommen. "
            "Zur technischen Auslieferung und Absicherung verarbeitet der "
            "Hosting-Anbieter jedoch erforderliche Verbindungsdaten. "
            + hosting_details
            + " "
            + analytics_details,
        ),
        _privacy_section(
            "9. Rechte und Beschwerde",
            "Sie haben nach Maßgabe der gesetzlichen Voraussetzungen Rechte auf "
            "Auskunft, Berichtigung, Löschung, Einschränkung, "
            "Datenübertragbarkeit und Widerspruch. Zuständige Aufsichtsbehörde: "
            "Bayerisches Landesamt für Datenschutzaufsicht, Promenade 18, "
            "91522 Ansbach, www.lda.bayern.de.",
        ),
        _privacy_section(
            "10. Automatisierte Entscheidungen",
            automated_text,
        ),
        Spacer(1, 0.5 * mm),
        objection,
    ]


def _page_chrome(
    recipient: Recipient, *, draft: bool
):
    def draw(canvas, doc) -> None:
        width, height = A4
        canvas.saveState()
        canvas.setFillColor(PAPER)
        canvas.rect(0, 0, width, height, fill=1, stroke=0)

        if draft:
            canvas.saveState()
            canvas.setFillColor(colors.HexColor("#EDC7C7"))
            canvas.setFont(FONT_BOLD, 32)
            canvas.translate(width / 2, height / 2)
            canvas.rotate(35)
            canvas.drawCentredString(0, 0, "NICHT VERSENDEN")
            canvas.restoreState()

        canvas.setFillColor(NAVY)
        canvas.roundRect(
            17 * mm,
            height - 18 * mm,
            9 * mm,
            9 * mm,
            2.2 * mm,
            fill=1,
            stroke=0,
        )
        canvas.setFillColor(colors.white)
        canvas.setFont(FONT_BOLD, 7.2)
        canvas.drawCentredString(21.5 * mm, height - 14.6 * mm, "IXA")
        canvas.setFillColor(NAVY)
        canvas.setFont(FONT_BOLD, 9)
        canvas.drawString(29 * mm, height - 13.8 * mm, "IXA-Leads")

        canvas.setFont(FONT_BOLD if draft else FONT, 6.8)
        canvas.setFillColor(RED if draft else MUTED)
        header = (
            "ENTWURF · NICHT VERSENDEN"
            if draft
            else "Persönlicher Anfrageweg-Check · Nürnberg"
        )
        canvas.drawRightString(width - 17 * mm, height - 13.8 * mm, header)

        canvas.setStrokeColor(LINE)
        canvas.setLineWidth(0.6)
        canvas.line(17 * mm, 13 * mm, width - 17 * mm, 13 * mm)
        canvas.setFillColor(RED if draft else MUTED)
        canvas.setFont(FONT_BOLD if draft else FONT, 6.7)
        footer = (
            "ENTWURF · NICHT VERSENDEN"
            if draft
            else f"IXA-Leads · Referenz {recipient.printed_ref}"
        )
        canvas.drawString(17 * mm, 8.8 * mm, footer)
        canvas.setFillColor(MUTED)
        canvas.setFont(FONT, 6.7)
        canvas.drawRightString(
            width - 17 * mm, 8.8 * mm, f"Seite {doc.page}/2"
        )
        canvas.restoreState()

    return draw


def _build_individual_pdf(
    batch: Batch, recipient: Recipient, output: Path, *, draft: bool
) -> None:
    doc = BaseDocTemplate(
        str(output),
        pagesize=A4,
        leftMargin=24 * mm,
        rightMargin=24 * mm,
        topMargin=21 * mm,
        bottomMargin=17 * mm,
        title=f"IXA Postal · {recipient.printed_ref}",
        author="IXA-Leads",
        subject=(
            "Entwurf - nicht versenden"
            if draft
            else "Persönliches postalisches Anschreiben"
        ),
    )
    frame = Frame(
        doc.leftMargin,
        doc.bottomMargin,
        doc.width,
        doc.height,
        leftPadding=0,
        rightPadding=0,
        topPadding=0,
        bottomPadding=0,
        id="content",
    )
    doc.addPageTemplates(
        [
            PageTemplate(
                id="ixa",
                frames=[frame],
                onPage=_page_chrome(recipient, draft=draft),
            )
        ]
    )
    story = (
        _first_page_story(batch, recipient)
        + [PageBreak()]
        + _second_page_story(batch, recipient)
    )
    try:
        doc.build(story)
    except LayoutError as exc:
        raise BatchValidationError(
            f"{recipient.printed_ref} does not fit the fixed two-page layout; "
            "shorten the supplied fields"
        ) from exc


def _sha256(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as handle:
        for chunk in iter(lambda: handle.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def _is_a4_page(page: Any) -> bool:
    expected_width, expected_height = A4
    return (
        abs(float(page.mediabox.width) - expected_width) <= 0.5
        and abs(float(page.mediabox.height) - expected_height) <= 0.5
    )


def _validate_individual_pdf(
    path: Path, *, draft: bool, recipient: Recipient
) -> None:
    reader = PdfReader(str(path))
    if len(reader.pages) != 2:
        raise BatchValidationError(
            f"{path.name} rendered {len(reader.pages)} pages; exactly 2 required. "
            "Shorten the longest supplied fields before printing."
        )
    if not all(_is_a4_page(page) for page in reader.pages):
        raise BatchValidationError(f"{path.name} contains a non-A4 page")
    page_texts = [(page.extract_text() or "") for page in reader.pages]
    if not all(recipient.printed_ref in text for text in page_texts):
        raise BatchValidationError(
            f"{path.name} does not identify the recipient on both pages"
        )
    text = "\n".join(page_texts).upper()
    forbidden = (
        tuple(item for item in FORBIDDEN_PRINT_READY_TEXT if item != "NICHT VERSENDEN")
        if draft
        else FORBIDDEN_PRINT_READY_TEXT
    )
    present = [item for item in forbidden if item in text]
    if present:
        raise BatchValidationError(
            f"{path.name} contains forbidden placeholder text: {present}"
        )
    if draft and not all(
        "ENTWURF" in page_text.upper()
        and "NICHT VERSENDEN" in page_text.upper()
        for page_text in page_texts
    ):
        raise BatchValidationError(
            f"{path.name} is missing ENTWURF / NICHT VERSENDEN on a page"
        )


def _merge_pdfs(
    individual_paths: Iterable[Path], output: Path, *, batch: Batch
) -> int:
    writer = PdfWriter()
    page_count = 0
    for path in individual_paths:
        reader = PdfReader(str(path))
        for page in reader.pages:
            writer.add_page(page)
            page_count += 1
    writer.add_metadata(
        {
            "/Title": f"IXA Nürnberg Postal Batch {batch.batch_id}",
            "/Author": "IXA-Leads",
            "/Subject": f"{len(batch.recipients)} personalisierte Briefe",
        }
    )
    with output.open("wb") as handle:
        writer.write(handle)
    return page_count


def _validate_combined_pdf(
    combined_path: Path,
    *,
    individual_paths: Sequence[Path],
    recipients: Sequence[Recipient],
) -> int:
    combined = PdfReader(str(combined_path))
    expected_pages = len(individual_paths) * 2
    if len(combined.pages) != expected_pages:
        raise BatchValidationError(
            f"Combined PDF has {len(combined.pages)} pages; expected {expected_pages}"
        )
    if not all(_is_a4_page(page) for page in combined.pages):
        raise BatchValidationError("Combined PDF contains a non-A4 page")

    for order, (individual_path, recipient) in enumerate(
        zip(individual_paths, recipients, strict=True), start=1
    ):
        individual = PdfReader(str(individual_path))
        for local_page in range(2):
            combined_index = (order - 1) * 2 + local_page
            individual_text = individual.pages[local_page].extract_text() or ""
            combined_text = combined.pages[combined_index].extract_text() or ""
            if combined_text != individual_text:
                raise BatchValidationError(
                    f"Combined page {combined_index + 1} does not match "
                    f"{individual_path.name} page {local_page + 1}"
                )
            if recipient.printed_ref not in combined_text:
                raise BatchValidationError(
                    f"Combined page {combined_index + 1} is paired to the wrong recipient"
                )
    return len(combined.pages)


def _write_manifest(
    path: Path,
    *,
    batch: Batch,
    generated: Sequence[GeneratedRecipient],
    mode: str,
    activation: VerifiedActivation | None,
) -> None:
    fields = [
        "batch_id",
        "content_version",
        "mode",
        "order",
        "company_id",
        "contact_id",
        "printed_ref",
        "page_content_id",
        "experiment_id",
        "page_version",
        "letter_id",
        "page_content_sha256",
        "recipient_name",
        "recipient_role",
        "identity_source_count",
        "identity_source_verified_at",
        "address_source_count",
        "address_source_verified_at",
        "company_name",
        "street",
        "postal_code",
        "city",
        "personal_page_url",
        "individual_pdf",
        "combined_page_start",
        "combined_page_end",
        "pages_per_recipient",
        "page_pairing",
        "duplex_setting",
        "pdf_sha256",
        "suppression",
        "legal_status",
        "page_status",
        "legal_notice_state",
        "legal_activation_gate_count",
        "legal_activation_gates",
        "artifact_state",
        "send_rule",
        "activation_receipt_id",
        "batch_digest_sha256",
    ]
    with path.open("w", encoding="utf-8", newline="") as handle:
        writer = csv.DictWriter(handle, fieldnames=fields)
        writer.writeheader()
        for item in generated:
            recipient = item.recipient
            activation_gates = _recipient_activation_gates(batch, recipient)
            writer.writerow(
                {
                    "batch_id": batch.batch_id,
                    "content_version": batch.content_version,
                    "mode": mode,
                    "order": item.order,
                    "company_id": recipient.company_id,
                    "contact_id": recipient.contact_id,
                    "printed_ref": recipient.printed_ref,
                    "page_content_id": recipient.page_content_id,
                    "experiment_id": recipient.experiment_id,
                    "page_version": recipient.page_version,
                    "letter_id": recipient.letter_id,
                    "page_content_sha256": recipient.page_content_sha256,
                    "recipient_name": _csv_safe(recipient.recipient_name),
                    "recipient_role": _csv_safe(recipient.recipient_role),
                    "identity_source_count": len(recipient.identity_source_urls),
                    "identity_source_verified_at": (
                        recipient.identity_source_verified_at.isoformat()
                        if recipient.identity_source_verified_at
                        else ""
                    ),
                    "address_source_count": len(recipient.address_source_urls),
                    "address_source_verified_at": (
                        recipient.address_source_verified_at.isoformat()
                        if recipient.address_source_verified_at
                        else ""
                    ),
                    "company_name": _csv_safe(recipient.company_name),
                    "street": _csv_safe(recipient.street),
                    "postal_code": recipient.postal_code,
                    "city": recipient.city,
                    "personal_page_url": _csv_safe(recipient.personal_page_url),
                    "individual_pdf": item.relative_pdf,
                    "combined_page_start": item.combined_page_start,
                    "combined_page_end": item.combined_page_end,
                    "pages_per_recipient": 2,
                    "page_pairing": "consecutive_front_then_privacy_back",
                    "duplex_setting": "flip_on_long_edge",
                    "pdf_sha256": item.pdf_sha256,
                    "suppression": "false",
                    "legal_status": _csv_safe(recipient.legal_status),
                    "page_status": _csv_safe(recipient.page_status),
                    "legal_notice_state": (
                        "BLOCKED_MISSING_FACTS"
                        if activation_gates
                        else "FACT_FIELDS_COMPLETE"
                    ),
                    "legal_activation_gate_count": len(activation_gates),
                    "legal_activation_gates": _csv_safe(";".join(activation_gates)),
                    "artifact_state": "DRAFTED" if mode == "DRAFT" else "PRINT_READY",
                    "send_rule": (
                        "PROHIBITED_DRAFT"
                        if mode == "DRAFT"
                        else "NOT_AUTHORIZED_BY_ARTIFACT"
                    ),
                    "activation_receipt_id": (
                        activation.receipt_id if activation else ""
                    ),
                    "batch_digest_sha256": (
                        activation.batch_digest_sha256 if activation else ""
                    ),
                }
            )


def _write_instructions(path: Path, *, batch: Batch, mode: str) -> None:
    blocked_recipients = sum(
        bool(_recipient_activation_gates(batch, recipient))
        for recipient in batch.recipients
    )
    warning = (
        "ACHTUNG: ENTWURF. NICHT VERSENDEN.\n"
        if mode == "DRAFT"
        else "Vor dem Druck die exakte Freigabe des gesamten Batches prüfen.\n"
    )
    text = f"""IXA Nürnberg Postal Batch {batch.batch_id}

{warning}
Diese Dateien wurden nur vorbereitet. Der Generator druckt, versendet,
veröffentlicht und protokolliert keinen tatsächlichen Versand.
Rechtliche Aktivierungsblocker: {blocked_recipients} von {len(batch.recipients)}
Empfängern. Platzhalter auf der Datenschutz-Rückseite sind keine fertige
Datenschutzerklärung und dürfen nicht an Empfänger gelangen.

Druck des kombinierten PDFs:
1. A4, tatsächliche Größe / 100 %, keine Seitenanpassung.
2. Beidseitig (Duplex), an der langen Kante wenden.
3. Jede ungerade Seite ist die Vorderseite; die direkt folgende gerade Seite
   ist die Datenschutz-Rückseite desselben Empfängers.
4. Sortierung beibehalten. Nicht als Broschüre drucken.
5. Zuerst genau einen vollständigen Testbrief drucken. Den QR-Code nur mit
   einem Offline-Decoder lesen, ohne die Zieladresse zu öffnen, und die
   dekodierte URL exakt mit dem Manifest vergleichen. Einen Produktionslink
   nicht testweise öffnen; das könnte ein personal_page_visit auslösen und die
   Messung verfälschen. Anschrift und Fensterposition separat prüfen.
6. Für DIN-lang-Umschläge passend falten. Einen kompletten Brief inklusive
   Umschlag wiegen, bevor Porto gekauft oder aufgeklebt wird.
7. Manifest und QA_REPORT prüfen. Ein PDF-Artefakt bedeutet weder APPROVED
   noch SENT; tatsächlichen Versand separat bestätigen und protokollieren.

Anzahl Empfänger: {len(batch.recipients)}
Kombinierte PDF-Seiten: {len(batch.recipients) * 2}
Content-Version: {batch.content_version}
Modus: {mode}
"""
    path.write_text(text, encoding="utf-8")


def _write_activation_checklist(path: Path, *, batch: Batch, mode: str) -> None:
    global_gates = _privacy_activation_gates(batch.privacy_facts)
    global_lines = (
        "\n".join(
            f"[ ] {code}: {_gate_description(code)}" for code in global_gates
        )
        if global_gates
        else "[x] Keine offenen globalen Privacy-Fact-Felder."
    )
    recipient_lines: list[str] = []
    for recipient in batch.recipients:
        recipient_gates = [
            *_recipient_source_gates(recipient),
            *(
                []
                if recipient.legal_status == "Approved"
                else ["LEGAL_STATUS_NOT_APPROVED"]
            ),
            *(
                []
                if recipient.page_status == "Ready"
                else ["PAGE_STATUS_NOT_READY"]
            ),
        ]
        if recipient_gates:
            recipient_lines.append(
                f"[ ] {recipient.printed_ref}: " + ", ".join(recipient_gates)
            )
    recipient_block = (
        "\n".join(recipient_lines)
        if recipient_lines
        else "[x] Alle empfängerbezogenen Quellen- und Statusfelder vollständig."
    )
    state = (
        "DRAFT: Diese Hülle ist gesperrt. NICHT VERSENDEN. Die enthaltenen "
        "persönlichen Links gelten für diese Hülle als nicht aktiviert."
        if mode == "DRAFT"
        else "PRINT_READY: Der exakte Batch besitzt eine verifizierte, "
        "unabgelaufene Aktivierungsquittung. Das ist keine Versandbestätigung."
    )
    text = f"""IXA ACTIVATION CHECKLIST · {batch.batch_id}

{state}

Vor einer PRINT_READY-Ausgabe müssen alle Ebenen zusammen bereit sein:
[ ] Google Sheet: exakt 50 Empfänger, Nürnberg, keine Suppression, zwei aktuelle
    Beobachtungen mit Quellen, Quellen und Abrufdaten für Name/Funktion und
    Geschäftsanschrift, Legal_Status=Approved, Page_Status=Ready.
[ ] Apps Script: Token-Auflösung, Sperrprüfung und Visit-Ticket-Endpunkte sind
    für genau diese Datensätze konfiguriert.
[ ] Website: die zugehörige /r/<Public_Token>-Version ist veröffentlicht und
    zeigt die beiden richtigen Beobachtungen für denselben Empfänger.
[ ] Aktivierung: separate Apps-Script-RSA-Quittung stimmt mit Batch-ID,
    Content-Version, Datum, 50 Empfängern, allen Quellen, Provider-/Transfer-
    Angaben, Löschfristen und dem vollständigen Batch-Digest überein und ist
    noch gültig.
[ ] QR-QA: QR ausschließlich offline dekodieren, NICHT öffnen; Zieladresse mit
    manifest.csv vergleichen. Ein echter Seitenaufruf kann personal_page_visit
    auslösen und darf nicht als Drucktest verwendet werden.
[ ] Druck: A4, Duplex, an der langen Kante wenden; je Empfänger liegen Vorder-
    und Datenschutz-Rückseite direkt hintereinander.

Offene globale Pflichtfelder:
{global_lines}

Offene empfängerbezogene Pflichtfelder:
{recipient_block}

Wichtig: DRAFTED, PRINT_READY, APPROVED und SENT sind getrennte Zustände. Der
Generator druckt oder versendet nichts und setzt keinen Datensatz auf SENT.
"""
    path.write_text(text, encoding="utf-8")


def _write_qa(
    path: Path,
    *,
    batch: Batch,
    mode: str,
    generated: Sequence[GeneratedRecipient],
    combined_path: Path,
    combined_pages: int,
    manifest_path: Path,
    instructions_path: Path,
    activation_checklist_path: Path,
    activation: VerifiedActivation | None,
) -> None:
    individual_paths = [path.parent / item.relative_pdf for item in generated]
    individual_readers = [PdfReader(str(pdf_path)) for pdf_path in individual_paths]
    combined_reader = PdfReader(str(combined_path))
    unique_fields = (
        "company_id",
        "contact_id",
        "printed_ref",
        "public_token",
        "page_content_id",
        "letter_id",
        "personal_page_url",
    )
    uniqueness_ok = all(
        len(
            {
                str(getattr(recipient, field)).strip().casefold()
                for recipient in batch.recipients
            }
        )
        == len(batch.recipients)
        for field in unique_fields
    )
    individual_two_pages = all(
        len(reader.pages) == 2 for reader in individual_readers
    )
    individual_a4 = all(
        _is_a4_page(page)
        for reader in individual_readers
        for page in reader.pages
    )
    draft_markers_ok = mode != "DRAFT" or all(
        "ENTWURF" in (page.extract_text() or "").upper()
        and "NICHT VERSENDEN" in (page.extract_text() or "").upper()
        for reader in individual_readers
        for page in reader.pages
    )
    combined_pairing_ok = len(combined_reader.pages) == len(generated) * 2
    if combined_pairing_ok:
        combined_pairing_ok = all(
            item.recipient.printed_ref
            in (combined_reader.pages[page_index].extract_text() or "")
            for item in generated
            for page_index in (
                item.combined_page_start - 1,
                item.combined_page_end - 1,
            )
        )
    instructions = instructions_path.read_text(encoding="utf-8")
    activation_checklist = activation_checklist_path.read_text(encoding="utf-8")
    recipient_activation_gates = [
        _recipient_activation_gates(batch, recipient)
        for recipient in batch.recipients
    ]
    blocked_recipients = sum(bool(gates) for gates in recipient_activation_gates)
    with manifest_path.open("r", encoding="utf-8", newline="") as handle:
        manifest_rows = list(csv.DictReader(handle))
    manifest_pairing_ok = len(manifest_rows) == len(generated) and all(
        row["pages_per_recipient"] == "2"
        and row["page_pairing"] == "consecutive_front_then_privacy_back"
        and row["duplex_setting"] == "flip_on_long_edge"
        and int(row["combined_page_start"]) == (index - 1) * 2 + 1
        and int(row["combined_page_end"]) == index * 2
        for index, row in enumerate(manifest_rows, start=1)
    )
    manifest_legal_gates_ok = len(manifest_rows) == len(generated) and all(
        int(row["identity_source_count"])
        == len(item.recipient.identity_source_urls)
        and int(row["address_source_count"])
        == len(item.recipient.address_source_urls)
        and int(row["legal_activation_gate_count"])
        == len(_recipient_activation_gates(batch, item.recipient))
        and row["legal_activation_gates"]
        == ";".join(_recipient_activation_gates(batch, item.recipient))
        for row, item in zip(manifest_rows, generated, strict=True)
    )
    draft_gate_disclosure_ok = mode != "DRAFT" or all(
        (
            not gates
            or "AKTIVIERUNGSSPERRE"
            in (reader.pages[1].extract_text() or "").upper()
        )
        and all(code in activation_checklist for code in gates)
        for gates, reader in zip(
            recipient_activation_gates, individual_readers, strict=True
        )
    )
    checks = {
        "exact_recipient_count": len(batch.recipients) == EXPECTED_RECIPIENT_COUNT,
        "strict_nuernberg_city_and_postcode": all(
            recipient.city == "Nürnberg"
            and recipient.postal_code in NURNBERG_POSTCODES
            for recipient in batch.recipients
        ),
        "unique_company_contact_reference_token_url": uniqueness_ok,
        "suppression_false_for_all": all(
            recipient.suppression is False for recipient in batch.recipients
        ),
        "exactly_two_sourced_observations_each": all(
            len(recipient.observations) == 2
            and all(observation.source_url for observation in recipient.observations)
            for recipient in batch.recipients
        ),
        "print_ready_legal_page_gates": (
            mode == "DRAFT"
            or all(
                recipient.legal_status == "Approved"
                and recipient.page_status == "Ready"
                for recipient in batch.recipients
            )
        ),
        "print_ready_has_no_unresolved_legal_fact_gates": (
            mode == "DRAFT" or blocked_recipients == 0
        ),
        "draft_discloses_every_unresolved_legal_fact_gate": (
            draft_gate_disclosure_ok and manifest_legal_gates_ok
        ),
        "trusted_activation_receipt": mode == "DRAFT" or activation is not None,
        "individual_pdf_count": (
            len(generated) == EXPECTED_RECIPIENT_COUNT
            and len(individual_paths) == EXPECTED_RECIPIENT_COUNT
        ),
        "individual_pdfs_two_pages_each": individual_two_pages,
        "all_pdf_pages_are_a4": individual_a4
        and all(_is_a4_page(page) for page in combined_reader.pages),
        "combined_pdf_page_count": (
            combined_pages == EXPECTED_RECIPIENT_COUNT * 2
            and len(combined_reader.pages) == combined_pages
        ),
        "two_consecutive_pages_per_recipient": (
            combined_pairing_ok and manifest_pairing_ok
        ),
        "duplex_flip_on_long_edge_documented": (
            "an der langen Kante wenden" in instructions
            and all(row["duplex_setting"] == "flip_on_long_edge" for row in manifest_rows)
        ),
        "qr_offline_decode_without_opening_documented": (
            "Offline-Decoder" in instructions
            and "nicht testweise öffnen" in instructions
            and "QR ausschließlich offline dekodieren" in activation_checklist
        ),
        "draft_link_activation_block_documented": (
            mode != "DRAFT"
            or "persönlichen Links gelten für diese Hülle als nicht aktiviert"
            in activation_checklist
        ),
        "draft_not_sendable_marker_on_every_page": draft_markers_ok
        and (mode != "DRAFT" or "NICHT VERSENDEN" in instructions),
        "qr_payload_built_from_validated_personal_url": all(
            recipient.personal_page_url
            == f"{batch.base_url}/r/{recipient.public_token}"
            for recipient in batch.recipients
        ),
        "instructions_state_no_send_or_publish": (
            "druckt, versendet" in instructions
            and "keinen tatsächlichen Versand" in instructions
        ),
    }
    status = "PASSED" if all(checks.values()) else "FAILED"
    report = {
        "schema_version": 1,
        "generator_version": GENERATOR_VERSION,
        "generated_at_utc": datetime.now(timezone.utc).isoformat(),
        "batch_id": batch.batch_id,
        "content_version": batch.content_version,
        "mode": mode,
        "artifact_state": "DRAFTED" if mode == "DRAFT" else "PRINT_READY",
        "dispatch_state": "NOT_SENT",
        "send_rule": (
            "PROHIBITED_DRAFT"
            if mode == "DRAFT"
            else "NOT_AUTHORIZED_BY_ARTIFACT"
        ),
        "activation": (
            None
            if activation is None
            else {
                "receipt_id": activation.receipt_id,
                "approved_by": activation.approved_by,
                "approved_at_utc": activation.approved_at_utc.isoformat(),
                "expires_at_utc": activation.expires_at_utc.isoformat(),
                "batch_digest_sha256": activation.batch_digest_sha256,
                "receipt_sha256": activation.receipt_sha256,
                "verified": True,
            }
        ),
        "legal_activation": {
            "status": "BLOCKED" if blocked_recipients else "FACT_FIELDS_COMPLETE",
            "blocked_recipient_count": blocked_recipients,
            "global_gate_codes": list(
                _privacy_activation_gates(batch.privacy_facts)
            ),
            "draft_placeholders_are_not_sendable_legal_notice": mode == "DRAFT",
        },
        "printing": {
            "duplex": True,
            "flip_on": "long_edge",
            "pages_per_recipient": 2,
            "page_pairing": "consecutive_front_then_privacy_back",
            "draft_must_not_be_sent": mode == "DRAFT",
        },
        "status": status,
        "recipient_count": len(batch.recipients),
        "individual_pdf_count": len(generated),
        "combined_pdf": combined_path.name,
        "combined_pdf_pages": combined_pages,
        "combined_pdf_sha256": _sha256(combined_path),
        "manifest_sha256": _sha256(manifest_path),
        "instructions_sha256": _sha256(instructions_path),
        "activation_checklist_sha256": _sha256(activation_checklist_path),
        "checks": checks,
        "recipients": [
            {
                "order": item.order,
                "company_id": item.recipient.company_id,
                "contact_id": item.recipient.contact_id,
                "printed_ref": item.recipient.printed_ref,
                "page_content_id": item.recipient.page_content_id,
                "experiment_id": item.recipient.experiment_id,
                "page_version": item.recipient.page_version,
                "letter_id": item.recipient.letter_id,
                "page_content_sha256": item.recipient.page_content_sha256,
                "individual_pdf": item.relative_pdf,
                "pages": 2,
                "sha256": item.pdf_sha256,
                "suppression": False,
                "legal_status": item.recipient.legal_status,
                "page_status": item.recipient.page_status,
                "personal_page_url": item.recipient.personal_page_url,
                "identity_source_count": len(
                    item.recipient.identity_source_urls
                ),
                "address_source_count": len(item.recipient.address_source_urls),
                "legal_activation_gates": list(
                    _recipient_activation_gates(batch, item.recipient)
                ),
            }
            for item in generated
        ],
    }
    path.write_text(
        json.dumps(report, ensure_ascii=False, indent=2) + "\n", encoding="utf-8"
    )
    if status != "PASSED":
        raise BatchValidationError("Generated QA report contains a failed check")


def _write_zip(zip_path: Path, files: Sequence[Path], *, base: Path) -> None:
    expected = {
        path.relative_to(base).as_posix(): _sha256(path) for path in files
    }
    with zipfile.ZipFile(
        zip_path, "w", compression=zipfile.ZIP_DEFLATED, compresslevel=9
    ) as archive:
        for path in files:
            archive.write(path, arcname=path.relative_to(base).as_posix())
    with zipfile.ZipFile(zip_path, "r") as archive:
        if set(archive.namelist()) != set(expected):
            raise BatchValidationError("ZIP members do not match package files")
        broken_member = archive.testzip()
        if broken_member is not None:
            raise BatchValidationError(f"ZIP integrity check failed: {broken_member}")
        for member, expected_hash in expected.items():
            digest = hashlib.sha256(archive.read(member)).hexdigest()
            if digest != expected_hash:
                raise BatchValidationError(
                    f"ZIP member hash does not match source file: {member}"
                )


def _validate_batch_for_build(batch: Batch, *, draft: bool) -> None:
    """Re-apply hard gates so direct Python callers cannot bypass the CLI parser."""
    if len(batch.recipients) != EXPECTED_RECIPIENT_COUNT:
        raise BatchValidationError(
            f"A build requires exactly {EXPECTED_RECIPIENT_COUNT} recipients"
        )
    if batch.letter_date > date.today() + timedelta(days=7):
        raise BatchValidationError("letter_date cannot be more than 7 days ahead")
    if not draft and batch.base_url != "https://ixa-leads.de":
        raise BatchValidationError(
            "A print-ready build requires base_url=https://ixa-leads.de"
        )
    validated_privacy_facts = _parse_privacy_facts(
        _privacy_facts_payload(batch.privacy_facts)
    )
    if validated_privacy_facts != batch.privacy_facts:
        raise BatchValidationError(
            "privacy_facts changed during internal normalization"
        )
    privacy_gates = _privacy_activation_gates(batch.privacy_facts)
    if not draft and privacy_gates:
        raise BatchValidationError(
            "A print-ready build has unresolved privacy fact gates: "
            + ", ".join(privacy_gates)
        )

    for index, recipient in enumerate(batch.recipients):
        prefix = f"recipients[{index}]"
        if recipient.suppression is not False:
            raise BatchValidationError(f"{prefix} is suppressed")
        if (
            recipient.city != "Nürnberg"
            or recipient.postal_code not in NURNBERG_POSTCODES
        ):
            raise BatchValidationError(f"{prefix} is outside strict Nürnberg scope")
        if not PUBLIC_TOKEN.fullmatch(recipient.public_token) or len(
            set(recipient.public_token)
        ) < 8:
            raise BatchValidationError(f"{prefix} has an invalid public_token")
        expected_url = f"{batch.base_url}/r/{recipient.public_token}"
        if recipient.personal_page_url != expected_url:
            raise BatchValidationError(
                f"{prefix}.personal_page_url does not match its public_token"
            )
        if len(recipient.observations) != 2:
            raise BatchValidationError(
                f"{prefix} must have exactly two observations"
            )
        observation_signatures = set()
        for observation_index, observation in enumerate(recipient.observations):
            observation_prefix = f"{prefix}.observations[{observation_index}]"
            _source_url(observation.source_url, f"{observation_prefix}.source_url")
            if observation.verified_at > batch.letter_date or (
                batch.letter_date - observation.verified_at > timedelta(days=30)
            ):
                raise BatchValidationError(
                    f"{observation_prefix}.verified_at is outside the 30-day window"
                )
            observation_signatures.add(
                (
                    observation.title.casefold(),
                    observation.fact.casefold(),
                    observation.impact.casefold(),
                    observation.source_url.casefold(),
                )
            )
        if len(observation_signatures) != 2:
            raise BatchValidationError(
                f"{prefix} must have two distinct sourced observations"
            )
        for field, urls, verified_at in (
            (
                "identity_source_urls",
                recipient.identity_source_urls,
                recipient.identity_source_verified_at,
            ),
            (
                "address_source_urls",
                recipient.address_source_urls,
                recipient.address_source_verified_at,
            ),
        ):
            if len({url.casefold() for url in urls}) != len(urls):
                raise BatchValidationError(f"{prefix}.{field} contains duplicates")
            for url_index, url in enumerate(urls):
                _source_url(url, f"{prefix}.{field}[{url_index}]")
            if verified_at and not urls:
                raise BatchValidationError(
                    f"{prefix}.{field} has a verification date but no URL"
                )
            if verified_at and verified_at > batch.letter_date:
                raise BatchValidationError(
                    f"{prefix}.{field} verification date is after letter_date"
                )
        source_gates = _recipient_source_gates(recipient)
        if not draft and source_gates:
            raise BatchValidationError(
                f"{prefix} has unresolved identity/address provenance gates: "
                + ", ".join(source_gates)
            )
        if not draft and recipient.legal_status != "Approved":
            raise BatchValidationError(
                f"{prefix}.legal_status must be Approved for print-ready output"
            )
        if not draft and recipient.page_status != "Ready":
            raise BatchValidationError(
                f"{prefix}.page_status must be Ready for print-ready output"
            )

    for field in (
        "company_id",
        "contact_id",
        "printed_ref",
        "public_token",
        "page_content_id",
        "letter_id",
        "personal_page_url",
    ):
        _ensure_unique(batch.recipients, field)


def build_package(
    batch: Batch,
    *,
    output_dir: Path,
    draft: bool,
    activation_receipt: Any | None = None,
) -> Path:
    _validate_batch_for_build(batch, draft=draft)
    if draft:
        if activation_receipt is not None:
            raise BatchValidationError(
                "A draft build must not receive an activation receipt"
            )
        activation = None
    else:
        if activation_receipt is None:
            raise BatchValidationError(
                "A print-ready build requires a separate signed activation receipt"
            )
        activation = _verify_activation_receipt(batch, activation_receipt)
    mode = "DRAFT" if draft else "PRINT_READY"
    output_dir = output_dir.resolve()
    output_dir.mkdir(parents=True, exist_ok=True)
    destination = output_dir / batch.batch_id
    if destination.exists():
        raise BatchValidationError(
            f"Destination already exists; refusing to overwrite: {destination}"
        )

    staging = Path(
        tempfile.mkdtemp(prefix=f".staging-{batch.batch_id}-", dir=output_dir)
    )
    try:
        individual_dir = staging / "individual"
        individual_dir.mkdir()
        generated: list[GeneratedRecipient] = []
        individual_paths: list[Path] = []

        for order, recipient in enumerate(batch.recipients, start=1):
            filename = f"IXA_{recipient.printed_ref}.pdf"
            path = individual_dir / filename
            _build_individual_pdf(batch, recipient, path, draft=draft)
            _validate_individual_pdf(path, draft=draft, recipient=recipient)
            individual_paths.append(path)
            generated.append(
                GeneratedRecipient(
                    order=order,
                    recipient=recipient,
                    relative_pdf=path.relative_to(staging).as_posix(),
                    pdf_sha256=_sha256(path),
                    combined_page_start=(order - 1) * 2 + 1,
                    combined_page_end=order * 2,
                )
            )

        combined_path = staging / (
            f"IXA_Nuernberg_{batch.batch_id}_COMBINED_"
            f"{'DRAFT' if draft else 'PRINT'}.pdf"
        )
        written_pages = _merge_pdfs(individual_paths, combined_path, batch=batch)
        if written_pages != EXPECTED_RECIPIENT_COUNT * 2:
            raise BatchValidationError(
                f"Combined PDF writer added {written_pages} pages; expected "
                f"{EXPECTED_RECIPIENT_COUNT * 2}"
            )
        combined_pages = _validate_combined_pdf(
            combined_path,
            individual_paths=individual_paths,
            recipients=batch.recipients,
        )

        manifest_path = staging / f"IXA_Nuernberg_{batch.batch_id}_manifest.csv"
        _write_manifest(
            manifest_path,
            batch=batch,
            generated=generated,
            mode=mode,
            activation=activation,
        )
        instructions_path = staging / "PRINT_INSTRUCTIONS.txt"
        _write_instructions(instructions_path, batch=batch, mode=mode)
        activation_checklist_path = staging / "ACTIVATION_CHECKLIST.txt"
        _write_activation_checklist(
            activation_checklist_path,
            batch=batch,
            mode=mode,
        )
        qa_path = staging / f"IXA_Nuernberg_{batch.batch_id}_QA.json"
        _write_qa(
            qa_path,
            batch=batch,
            mode=mode,
            generated=generated,
            combined_path=combined_path,
            combined_pages=combined_pages,
            manifest_path=manifest_path,
            instructions_path=instructions_path,
            activation_checklist_path=activation_checklist_path,
            activation=activation,
        )

        zip_path = staging / f"IXA_Nuernberg_{batch.batch_id}_PACKAGE.zip"
        zip_members = [
            *individual_paths,
            combined_path,
            manifest_path,
            qa_path,
            instructions_path,
            activation_checklist_path,
        ]
        _write_zip(zip_path, zip_members, base=staging)

        os.replace(staging, destination)
        return destination
    except Exception:
        shutil.rmtree(staging, ignore_errors=True)
        raise


def _parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(
        description=(
            "Create a local-only, strictly validated 50-recipient IXA Nürnberg "
            "postal package. Nothing is sent or published."
        )
    )
    parser.add_argument(
        "--input",
        required=True,
        help="Input JSON path, or '-' to read JSON from stdin.",
    )
    parser.add_argument(
        "--output-dir",
        type=Path,
        default=DEFAULT_OUTPUT_DIR,
        help=f"Parent output directory (default: {DEFAULT_OUTPUT_DIR}).",
    )
    parser.add_argument(
        "--activation-receipt",
        help=(
            "Separate Apps-Script-RSA-signed activation receipt JSON. Required only for "
            "--print-ready and forbidden for --draft."
        ),
    )
    mode = parser.add_mutually_exclusive_group(required=True)
    mode.add_argument(
        "--draft",
        action="store_true",
        help="Create visibly marked ENTWURF / NICHT VERSENDEN artifacts.",
    )
    mode.add_argument(
        "--print-ready",
        action="store_true",
        help=(
            "Require Approved/Ready gates plus a valid signed activation "
            "receipt for the exact 50-recipient batch."
        ),
    )
    return parser


def main(argv: Sequence[str] | None = None) -> int:
    args = _parser().parse_args(argv)
    try:
        if args.draft and args.activation_receipt is not None:
            raise BatchValidationError(
                "--activation-receipt is forbidden with --draft"
            )
        if args.print_ready and not args.activation_receipt:
            raise BatchValidationError(
                "--print-ready requires --activation-receipt"
            )
        if args.activation_receipt == "-":
            raise BatchValidationError(
                "--activation-receipt must be a file path, not stdin"
            )
        payload = _load_json(args.input)
        batch = parse_batch(payload, print_ready=args.print_ready)
        activation_receipt = (
            _load_json(args.activation_receipt) if args.activation_receipt else None
        )
        destination = build_package(
            batch,
            output_dir=args.output_dir,
            draft=args.draft,
            activation_receipt=activation_receipt,
        )
    except (BatchValidationError, RuntimeError, OSError, PdfReadError, UnicodeError) as exc:
        print(f"ERROR: {exc}", file=sys.stderr)
        return 2

    result = {
        "ok": True,
        "batch_id": batch.batch_id,
        "mode": "DRAFT" if args.draft else "PRINT_READY",
        "artifact_state": "DRAFTED" if args.draft else "PRINT_READY",
        "dispatch_state": "NOT_SENT",
        "recipient_count": len(batch.recipients),
        "output_directory": str(destination),
    }
    print(json.dumps(result, ensure_ascii=False, indent=2))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
