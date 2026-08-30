#!/usr/bin/env python3
"""Prepare the local-only 50-recipient Nürnberg postal batch input.

This script transforms the already reviewed research snapshots into the strict
schema consumed by ``create_postal_batch.py``. It never reads from or writes to
Google Sheets, never publishes a personal page, and never sends anything.

Re-running the script preserves already generated public tokens by Company_ID,
so a reviewed QR payload cannot change silently between draft builds.
"""

from __future__ import annotations

import argparse
import hashlib
import json
import re
import secrets
import unicodedata
from pathlib import Path
from typing import Any
from urllib.parse import urlsplit


ROOT = Path(__file__).resolve().parents[1]
WORKSPACE = ROOT.parent
TMP = WORKSPACE / "tmp"

EXISTING_PATH = TMP / "ixa_nbg_existing_28.json"
RESEARCH_PATHS = [TMP / f"research_{letter}.json" for letter in "abcde"]
DEFAULT_OUTPUT = TMP / "ixa_nbg_postal_50_input.json"
DEFAULT_NEW_PROSPECTS = TMP / "ixa_nbg_new_22_sheet_rows.json"
DEFAULT_NEW_POSTAL = TMP / "ixa_nbg_new_22_postal_rows.json"
DEFAULT_PAGE_TASKS = TMP / "ixa_nbg_50_page_content_rows.json"

BATCH_ID = "IXA-NBG-POSTAL-20260828-DRAFT01"
CONTENT_VERSION = "IXA-POSTAL-NBG-V2"
LETTER_DATE = "2026-08-28"
BASE_URL = "https://ixa-leads.de"
EXPECTED_EXISTING = 28
EXPECTED_NEW = 22
EXPECTED_TOTAL = 50
FIRST_NEW_COMPANY_NUMBER = 62
SOURCE_RUN_ID = "IXA-RUN-20260828T050759800Z-NBG-POSTAL-PREP"
PREPARED_AT_UTC = "2026-08-28T05:07:59.800Z"

# BOHNER shares the exact postal address of the existing Herrmann Haustechnik
# record. The first self-mailed batch intentionally avoids two letters to one
# site; research_e.json contains the reviewed replacement.
EXCLUDED_DOMAINS = {"bohner-installation.de"}

ADDRESS_RE = re.compile(
    r"^(?P<street>.+),\s*(?P<postal_code>904\d{2})\s+(?P<city>Nürnberg)$"
)
NURNBERG_POSTCODES = {
    "90402", "90403", "90408", "90409", "90411", "90419", "90425",
    "90427", "90429", "90431", "90439", "90441", "90443", "90449",
    "90451", "90453", "90455", "90459", "90461", "90469", "90471",
    "90473", "90475", "90478", "90480", "90482", "90489", "90491",
}


def load_json(path: Path) -> Any:
    try:
        return json.loads(path.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError) as exc:
        raise SystemExit(f"Could not read {path}: {exc}") from exc


def normalize(value: str) -> str:
    return unicodedata.normalize("NFKC", value).strip().casefold()


def parse_address(value: str) -> tuple[str, str, str]:
    match = ADDRESS_RE.fullmatch(value.strip())
    if not match:
        raise SystemExit(f"Address is not a strict Nürnberg address: {value!r}")
    postal_code = match.group("postal_code")
    if postal_code not in NURNBERG_POSTCODES:
        raise SystemExit(f"Unsupported Nürnberg postcode: {postal_code}")
    return match.group("street").strip(), postal_code, match.group("city")


def source_label(url: str) -> str:
    host = urlsplit(url).hostname or "öffentliche Quelle"
    return host.removeprefix("www.")


def validated_source_urls(value: Any, field: str) -> list[str]:
    if not isinstance(value, list) or not value:
        raise SystemExit(f"{field} must be a non-empty URL array when present")
    result: list[str] = []
    for index, raw in enumerate(value):
        if not isinstance(raw, str):
            raise SystemExit(f"{field}[{index}] must be a URL string")
        url = raw.strip()
        parts = urlsplit(url)
        if parts.scheme not in {"http", "https"} or not parts.netloc:
            raise SystemExit(f"{field}[{index}] is not an absolute HTTP(S) URL")
        result.append(url)
    if len({normalize(url) for url in result}) != len(result):
        raise SystemExit(f"{field} contains a duplicate URL")
    return result


def provenance_fields(raw: dict[str, Any]) -> dict[str, Any]:
    """Carry only semantically explicit provenance; never infer it from a site."""
    result: dict[str, Any] = {}
    identity_urls = raw.get("identity_source_urls")
    if identity_urls is None:
        identity_urls = raw.get("person_source_urls")
    if identity_urls is not None:
        result["identity_source_urls"] = validated_source_urls(
            identity_urls, "identity_source_urls/person_source_urls"
        )

    address_urls = raw.get("address_source_urls")
    if address_urls is not None:
        result["address_source_urls"] = validated_source_urls(
            address_urls, "address_source_urls"
        )

    identity_date = raw.get("identity_source_verified_at")
    if identity_date is None:
        identity_date = raw.get("person_source_verified_at")
    if identity_date is not None:
        if "identity_source_urls" not in result:
            raise SystemExit(
                "identity source date is present without an explicit identity URL"
            )
        result["identity_source_verified_at"] = iso_date(str(identity_date))

    address_date = raw.get("address_source_verified_at")
    if address_date is not None:
        if "address_source_urls" not in result:
            raise SystemExit(
                "address source date is present without an explicit address URL"
            )
        result["address_source_verified_at"] = iso_date(str(address_date))
    return result


def observation_title(text: str, position: int) -> str:
    lowered = normalize(text)
    if any(term in lowered for term in ("karriere", "sucht", "stellen", "auszubild")):
        return "Aktueller Personalbedarf"
    if any(term in lowered for term in ("konfigurator", "online-anfrage", "formular", "bildupload")):
        return "Digitaler Einstieg für Anfragen"
    if any(term in lowered for term in ("wartung", "kundendienst", "service")):
        return "Service und strukturierte Anfrage"
    if any(term in lowered for term in ("wärmepumpe", "heizsystem", "heizung")):
        return "Wärmepumpenangebot im Netz"
    if any(term in lowered for term in ("referenz", "projekt", "fallbeispiel")):
        return "Sichtbare Projekte und Referenzen"
    return (
        "Öffentlich sichtbarer Leistungsfokus"
        if position == 1
        else "Zweiter Punkt im Anfrageweg"
    )


def iso_date(value: str) -> str:
    result = value.strip()[:10]
    if not re.fullmatch(r"\d{4}-\d{2}-\d{2}", result):
        raise SystemExit(f"Invalid verification date: {value!r}")
    return result


def address_and_greeting(salutation: str, recipient_name: str) -> tuple[str, str, str]:
    salutation = salutation.strip()
    if salutation.startswith("Sehr geehrte Frau "):
        surname = salutation.removeprefix("Sehr geehrte Frau ").removesuffix(",")
        return "Frau", f"Sehr geehrte Frau {surname},", f"Frau {surname}"
    if salutation.startswith("Sehr geehrter Herr "):
        surname = salutation.removeprefix("Sehr geehrter Herr ").removesuffix(",")
        return "Herrn", f"Sehr geehrter Herr {surname},", f"Herr {surname}"
    if salutation.startswith("Frau "):
        surname = salutation.removeprefix("Frau ")
        return "Frau", f"Sehr geehrte Frau {surname},", salutation
    if salutation.startswith("Herr "):
        surname = salutation.removeprefix("Herr ")
        return "Herrn", f"Sehr geehrter Herr {surname},", salutation
    surname = recipient_name.strip().split()[-1]
    return "Herrn", f"Sehr geehrter Herr {surname},", f"Herr {surname}"


def opening_for(variant: str, company: str) -> str:
    if variant == "A":
        return (
            f"Bei einer kurzen Prüfung des öffentlich sichtbaren Anfragewegs von {company} "
            "sind uns zwei konkrete Punkte aufgefallen. Beide lassen sich sachlich zeigen. "
            "Ob sie intern tatsächlich Wirkung haben, sollte anschließend mit Ihren Zahlen "
            "geprüft werden."
        )
    return (
        "Ein passender Wärmepumpenauftrag hat einen erheblichen wirtschaftlichen Wert. "
        "Entscheidend ist deshalb nicht bloß mehr Reichweite, sondern ein klarer Weg von "
        "der konkreten Suche zur qualifizierten Anfrage. In Ihrem öffentlich sichtbaren "
        "Auftritt sind uns dazu zwei Punkte aufgefallen."
    )


def make_observation(raw: dict[str, Any], position: int) -> dict[str, str]:
    urls = raw.get("source_urls")
    if not isinstance(urls, list) or not urls or not isinstance(urls[0], str):
        raise SystemExit("Each observation needs at least one source URL")
    fact = str(raw.get("text", "")).strip()
    impact = str(raw.get("impact", "")).strip()
    if not fact or not impact:
        raise SystemExit("Observation text and impact are required")
    return {
        "title": observation_title(fact, position),
        "fact": fact,
        "impact": impact,
        "source_label": source_label(urls[0]),
        "source_url": urls[0],
        "verified_at": iso_date(str(raw.get("verified_at", ""))),
    }


def existing_recipient(raw: dict[str, Any]) -> dict[str, Any]:
    street, postal_code, city = parse_address(str(raw["address"]))
    address_salutation, greeting, preferred_salutation = address_and_greeting(
        str(raw["salutation"]), str(raw["recipient_name"])
    )
    variant = "B" if str(raw.get("template_id", "")).endswith("_B") else "A"
    return {
        "company_id": str(raw["company_id"]),
        "contact_id": str(raw["contact_id"]),
        "printed_ref": str(raw["printed_ref"]),
        "public_token": "",
        "address_salutation": address_salutation,
        "recipient_name": str(raw["recipient_name"]).strip(),
        "recipient_role": str(raw["role"]).strip(),
        **provenance_fields(raw),
        "greeting": greeting,
        "preferred_salutation": preferred_salutation,
        "company_name": str(raw["company"]).strip(),
        "street": street,
        "postal_code": postal_code,
        "city": city,
        "website": str(raw["website"]).strip(),
        "domain": str(raw["domain"]).strip().lower(),
        "subject": (
            "Ein klarerer Weg zu passenden Projektanfragen"
            if variant == "B"
            else "Zwei konkrete Punkte zu Ihrem digitalen Anfrageweg"
        ),
        "opening": opening_for(variant, str(raw["company"]).strip()),
        "observations": [
            make_observation(dict(raw["observation_1"]), 1),
            make_observation(dict(raw["observation_2"]), 2),
        ],
        "suppression": False,
        "legal_status": "LEGAL_REVIEW",
        "page_status": "PREPARED_NOT_ACTIVATED",
        "template_variant": variant,
        "source_kind": "existing_verified_nuernberg_record",
    }


def new_recipient(raw: dict[str, Any], company_number: int, order: int) -> dict[str, Any]:
    street, postal_code, city = parse_address(str(raw["address"]))
    address_salutation, greeting, preferred_salutation = address_and_greeting(
        str(raw["salutation"]), str(raw["recipient_name"])
    )
    variant = "A" if order % 2 else "B"
    return {
        "company_id": f"IXA-CO-{company_number:06d}",
        "contact_id": f"IXA-CT-{company_number:06d}",
        "printed_ref": f"IXAP260828{company_number:03d}",
        "public_token": "",
        "address_salutation": address_salutation,
        "recipient_name": str(raw["recipient_name"]).strip(),
        "recipient_role": str(raw["role"]).strip(),
        **provenance_fields(raw),
        "greeting": greeting,
        "preferred_salutation": preferred_salutation,
        "company_name": str(raw["company"]).strip(),
        "street": street,
        "postal_code": postal_code,
        "city": city,
        "website": str(raw["website"]).strip(),
        "domain": str(raw["domain"]).strip().lower(),
        "subject": (
            "Ein klarerer Weg zu passenden Projektanfragen"
            if variant == "B"
            else "Zwei konkrete Punkte zu Ihrem digitalen Anfrageweg"
        ),
        "opening": opening_for(variant, str(raw["company"]).strip()),
        "observations": [
            make_observation(dict(raw["observation_1"]), 1),
            make_observation(dict(raw["observation_2"]), 2),
        ],
        "suppression": False,
        "legal_status": "LEGAL_REVIEW",
        "page_status": "PREPARED_NOT_ACTIVATED",
        "template_variant": variant,
        "source_kind": "new_nuernberg_research",
    }


def preserve_or_create_tokens(recipients: list[dict[str, Any]], output: Path) -> None:
    prior: dict[str, str] = {}
    if output.is_file():
        payload = load_json(output)
        for item in payload.get("recipients", []):
            company_id = str(item.get("company_id", ""))
            token = str(item.get("public_token", ""))
            if company_id and re.fullmatch(r"[A-Za-z0-9_-]{16,80}", token):
                prior[company_id] = token
    for item in recipients:
        item["public_token"] = prior.get(item["company_id"]) or secrets.token_urlsafe(18)


def validate_unique(recipients: list[dict[str, Any]]) -> None:
    if len(recipients) != EXPECTED_TOTAL:
        raise SystemExit(f"Expected {EXPECTED_TOTAL} recipients, got {len(recipients)}")
    for field in ("company_id", "contact_id", "printed_ref", "public_token", "domain"):
        values = [normalize(str(item[field])) for item in recipients]
        if len(values) != len(set(values)):
            raise SystemExit(f"Duplicate {field} in final batch")
    addresses = [
        normalize(f"{item['street']}, {item['postal_code']} {item['city']}")
        for item in recipients
    ]
    if len(addresses) != len(set(addresses)):
        raise SystemExit("Duplicate postal address in final batch")
    if any(item["city"] != "Nürnberg" for item in recipients):
        raise SystemExit("Final batch contains a non-Nürnberg city")
    if any(len(item["observations"]) != 2 for item in recipients):
        raise SystemExit("Each recipient must have exactly two observations")


def sheet_rows_for_new(recipients: list[dict[str, Any]]) -> dict[str, Any]:
    rows = []
    for order, item in enumerate(recipients, start=1):
        sources = []
        for observation in item["observations"]:
            sources.append(observation["source_url"])
        person_sources = list(item.get("identity_source_urls", []))
        notes = (
            "Nürnberg-only research verified 28.08.2026. Two current observations "
            "and decision-maker evidence prepared for the internal postal draft. "
            "No electronic consent inferred. No token activated, page published, "
            "PDF printed or letter sent. Sources: "
            + " | ".join(dict.fromkeys(person_sources + sources))
        )
        address = f"{item['street']}, {item['postal_code']} {item['city']}"
        row = [
            item["company_id"],
            item["contact_id"],
            item["company_name"],
            "SHK / Wärmepumpe",
            item["recipient_name"],
            item["recipient_role"],
            "",
            "",
            "",
            item["website"],
            item["domain"],
            address,
            "Nürnberg web discovery",
            f"NBG-{order:03d}",
            "Research complete",
            "Not documented",
            "Postal Art. 6(1)(f) individual assessment pending; electronic §7 UWG blocked without consent",
            "",
            "",
            "",
            "Postal preferred; electronic blocked",
            item["printed_ref"],
            "",
            "",
            "",
            "",
            False,
            "28.08.2027",
            notes,
            "Yes",
            item["preferred_salutation"],
            "Preview and postal preparation",
            "No interaction",
            "Review exact PDF, page activation and legal notice; no sending",
            "Approve exact 50-item batch and page activation before printing",
            "Postal review required; electronic blocked",
            "Draft preparation",
            "28.08.2026",
            item["company_name"],
            "",
        ]
        if len(row) != 40:
            raise SystemExit(f"Internal error: prospect row has {len(row)} fields")
        rows.append(row)
    return {
        "schema": "01 Prospects A:AN",
        "header_count": 40,
        "source_batch_id": BATCH_ID,
        "rows": rows,
    }


def postal_rows_for_new(recipients: list[dict[str, Any]]) -> dict[str, Any]:
    rows = []
    for order, item in enumerate(recipients, start=1):
        row = [
            f"IXA-P-20260828-NBG-{order:03d}",
            item["company_id"],
            item["contact_id"],
            "",
            item["printed_ref"],
            "",
            "",
            "",
            f"SHK_POST_V2_{item['template_variant']}",
            (
                f"Exact two-page draft is stored in batch {BATCH_ID}; "
                f"content version {CONTENT_VERSION}; reference {item['printed_ref']}."
            ),
            "Draft package generated",
            "Pending",
            "",
            "",
            "Not sent",
            (
                "Local-only draft. Personal token exists only in the controlled local "
                "package and is not activated in the Sheet. No publication, printing, "
                "franking or dispatch."
            ),
            item["recipient_name"],
            item["preferred_salutation"],
            "Yes",
            (
                "LEGAL_REVIEW: per-recipient Art. 6(1)(f) assessment and exact Art. "
                "14/21 notice review required; personal page not activated."
            ),
            "Draft created",
            "",
        ]
        if len(row) != 22:
            raise SystemExit(f"Internal error: postal row has {len(row)} fields")
        rows.append(row)
    return {
        "schema": "05 Postal Queue A:V",
        "header_count": 22,
        "source_batch_id": BATCH_ID,
        "rows": rows,
    }


def page_evidence(
    observation: dict[str, str],
    *,
    position: int,
    include_first_test: bool,
) -> str:
    payload: dict[str, Any] = {
        "schema": "ixa.personal-page-observation.v1",
        "position": position,
        "title": observation["title"],
        "observation": observation["fact"],
        "implication": observation["impact"],
        "sourceLabel": observation["source_label"],
        "sourceUrl": observation["source_url"],
        "verifiedAt": observation["verified_at"],
    }
    if include_first_test:
        payload["firstTest"] = {
            "title": "Vier Wochen lang die Anfragewege getrennt messen",
            "description": (
                "Für vier Wochen bleiben Angebot und Werbebudget unverändert. "
                "Telefon, WhatsApp und Formular werden getrennt ausgewertet. "
                "Entscheidend ist nicht nur die Zahl der Kontakte, sondern wie viele "
                "Anfragen fachlich, regional und vom Projektwert her passen. Danach "
                "wird zuerst nur der schwächste Übergang verbessert."
            ),
        }
    return json.dumps(payload, ensure_ascii=False, separators=(",", ":"))


def page_content_rows(recipients: list[dict[str, Any]]) -> dict[str, Any]:
    rows = []
    for order, item in enumerate(recipients, start=1):
        evidence_1 = page_evidence(
            item["observations"][0], position=1, include_first_test=True
        )
        evidence_2 = page_evidence(
            item["observations"][1], position=2, include_first_test=False
        )
        page_content_id = f"IXA-PC-{item['printed_ref']}"
        experiment_id = f"IXA-EXP-{CONTENT_VERSION}-{item['template_variant']}"
        page_version = "v3.0"
        letter_id = f"IXA-L-{item['printed_ref']}"
        token_sha256 = hashlib.sha256(item["public_token"].encode("utf-8")).hexdigest()
        hash_fields = [
            page_content_id,
            BATCH_ID,
            experiment_id,
            page_version,
            item["company_id"],
            item["contact_id"],
            token_sha256,
            letter_id,
            item["company_name"],
            evidence_1,
            evidence_2,
        ]
        content_sha256 = hashlib.sha256("\x1f".join(hash_fields).encode("utf-8")).hexdigest()
        row = [
            page_content_id,
            BATCH_ID,
            experiment_id,
            page_version,
            item["company_id"],
            item["contact_id"],
            token_sha256,
            letter_id,
            item["company_name"],
            evidence_1,
            evidence_2,
            content_sha256,
            "Prepared",
            "Pending",
            "",
            "",
            "",
            "",
            SOURCE_RUN_ID,
        ]
        if len(row) != 19:
            raise SystemExit(f"Internal error: page content row has {len(row)} fields")
        item.update({
            "page_content_id": page_content_id,
            "experiment_id": experiment_id,
            "page_version": page_version,
            "letter_id": letter_id,
            "page_content_sha256": content_sha256,
        })
        rows.append(row)
    return {
        "schema": "11 Page Content A:S",
        "header_count": 19,
        "source_batch_id": BATCH_ID,
        "rows": rows,
    }


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--output", type=Path, default=DEFAULT_OUTPUT)
    parser.add_argument("--new-prospects-output", type=Path, default=DEFAULT_NEW_PROSPECTS)
    parser.add_argument("--new-postal-output", type=Path, default=DEFAULT_NEW_POSTAL)
    parser.add_argument("--page-tasks-output", type=Path, default=DEFAULT_PAGE_TASKS)
    args = parser.parse_args()

    existing_payload = load_json(EXISTING_PATH)
    existing_raw = existing_payload.get("records")
    if not isinstance(existing_raw, list) or len(existing_raw) != EXPECTED_EXISTING:
        raise SystemExit(f"Expected {EXPECTED_EXISTING} existing records")

    research_raw: list[dict[str, Any]] = []
    for path in RESEARCH_PATHS:
        value = load_json(path)
        if not isinstance(value, list):
            raise SystemExit(f"Research snapshot is not an array: {path}")
        research_raw.extend(dict(item) for item in value)
    research_raw = [
        item for item in research_raw
        if str(item.get("domain", "")).strip().lower() not in EXCLUDED_DOMAINS
    ]
    if len(research_raw) != EXPECTED_NEW:
        raise SystemExit(f"Expected {EXPECTED_NEW} selected new records, got {len(research_raw)}")

    existing = [existing_recipient(dict(item)) for item in existing_raw]
    research_raw.sort(key=lambda item: (normalize(str(item["company"])), normalize(str(item["domain"]))))
    new = [
        new_recipient(item, FIRST_NEW_COMPANY_NUMBER + index, index + 1)
        for index, item in enumerate(research_raw)
    ]
    recipients = existing + new
    preserve_or_create_tokens(recipients, args.output)
    recipients.sort(key=lambda item: (item["postal_code"], normalize(item["company_name"])))
    validate_unique(recipients)

    page_tasks_payload = page_content_rows(recipients)

    payload = {
        "batch_id": BATCH_ID,
        "content_version": CONTENT_VERSION,
        "letter_date": LETTER_DATE,
        "base_url": BASE_URL,
        "recipients": [
            {key: value for key, value in item.items() if key not in {
                "preferred_salutation", "website", "domain", "template_variant",
                "source_kind"
            }}
            for item in recipients
        ],
    }
    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text(json.dumps(payload, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")

    new_sheet_payload = sheet_rows_for_new(new)
    args.new_prospects_output.parent.mkdir(parents=True, exist_ok=True)
    args.new_prospects_output.write_text(
        json.dumps(new_sheet_payload, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )

    new_postal_payload = postal_rows_for_new(new)
    args.new_postal_output.parent.mkdir(parents=True, exist_ok=True)
    args.new_postal_output.write_text(
        json.dumps(new_postal_payload, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )

    args.page_tasks_output.parent.mkdir(parents=True, exist_ok=True)
    args.page_tasks_output.write_text(
        json.dumps(page_tasks_payload, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )

    print(json.dumps({
        "batch_id": BATCH_ID,
        "recipients": len(recipients),
        "existing": len(existing),
        "new": len(new),
        "excluded_domains": sorted(EXCLUDED_DOMAINS),
        "input": str(args.output),
        "new_prospect_rows": str(args.new_prospects_output),
        "new_postal_rows": str(args.new_postal_output),
        "page_task_rows": str(args.page_tasks_output),
    }, ensure_ascii=False))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
