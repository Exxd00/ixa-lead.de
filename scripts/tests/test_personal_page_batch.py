from __future__ import annotations

import copy
import hashlib
import hmac
import json
import os
import tempfile
import unittest
from contextlib import redirect_stderr
from datetime import datetime, timezone
from io import StringIO
from pathlib import Path
from unittest.mock import patch

import sys


SCRIPTS = Path(__file__).resolve().parents[1]
if str(SCRIPTS) not in sys.path:
    sys.path.insert(0, str(SCRIPTS))

import personal_page_batch as page_batch  # noqa: E402


SECRET = b"0123456789abcdef0123456789abcdef"
OTHER_SECRET = b"abcdef0123456789abcdef0123456789"
NOW = datetime(2026, 8, 30, 20, 5, tzinfo=timezone.utc)
APPROVED_AT = "2026-08-30T20:00:00.000Z"
EXPIRES_AT = "2026-08-30T21:00:00.000Z"
CONSUMED_AT = "2026-08-30T20:05:00.000Z"
NONCE = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopq"


def evidence(position: int) -> dict[str, object]:
    result: dict[str, object] = {
        "schema": "ixa.personal-page-observation.v1",
        "position": position,
        "title": f"Öffentlicher Befund {position}",
        "observation": f"Beobachtung {position} auf der Website.",
        "implication": f"Mögliche Wirkung {position}, vorsichtig formuliert.",
        "sourceLabel": "Öffentliche Website",
        "sourceUrl": f"https://example.invalid/nachweis-{position}",
        "verifiedAt": "2026-08-30",
    }
    if position == 1:
        result["firstTest"] = {
            "title": "Vier Wochen getrennt messen",
            "description": "Anfragewege vergleichen und nur den schwächsten Übergang ändern.",
        }
    return result


def recipient(number: int) -> dict[str, object]:
    return {
        "company_id": f"IXA-C-{number:03d}",
        "contact_id": f"IXA-P-{number:03d}",
        "public_token": f"token_{number:03d}_abcdefghijklmnop",
        "letter_id": f"IXA-L-{number:03d}",
        "public_page_label": f"Betrieb {number:03d} GmbH",
        "evidence": [evidence(1), evidence(2)],
    }


def payload(count: int = 50) -> dict[str, object]:
    return {
        "batch_id": "IXA001",
        "experiment_id": "IXA-EXP-001",
        "page_version": "v3.0",
        "page_expires_at_utc": "2026-09-30T22:00:00.000Z",
        "source_run_id": "IXA-RUN-20260830-PAGE-001",
        "recipients": [recipient(index) for index in range(1, count + 1)],
    }


def sign(bundle: dict[str, object], secret: bytes = SECRET) -> dict[str, object]:
    return page_batch.sign_activation_request(
        bundle["activation_request"],
        receipt_id="IXA-PA-001",
        approved_by="IXA owner",
        approved_at_utc=APPROVED_AT,
        expires_at_utc=EXPIRES_AT,
        consumed_at_utc=CONSUMED_AT,
        nonce=NONCE,
        secret=secret,
        now=NOW,
    )


class PrepareTests(unittest.TestCase):
    def test_prepare_one_and_fifty_but_only_fifty_can_be_signed(self) -> None:
        one = page_batch.prepare_batch(payload(1))
        fifty = page_batch.prepare_batch(payload(50))

        self.assertEqual(one["recipient_count"], 1)
        self.assertEqual(len(one["page_content"]["rows"]), 1)
        self.assertEqual(fifty["recipient_count"], 50)
        self.assertEqual(len(fifty["page_content"]["rows"]), 50)
        with self.assertRaisesRegex(page_batch.ValidationError, "exactly 50"):
            sign(one)
        self.assertEqual(sign(fifty)["recipient_count"], 50)

    def test_output_is_deterministic_and_independent_of_input_order(self) -> None:
        first_input = payload(3)
        second_input = copy.deepcopy(first_input)
        second_input["recipients"].reverse()

        first = page_batch.prepare_batch(first_input)
        second = page_batch.prepare_batch(second_input)

        self.assertEqual(first, second)
        self.assertEqual(page_batch.canonical_json(first), page_batch.canonical_json(second))

    def test_rows_are_prepared_pending_unactivated_and_do_not_leak_tokens(self) -> None:
        source = payload(2)
        result = page_batch.prepare_batch(source)
        self.assertEqual(result["page_content"]["schema"], "11 Page Content A:U")
        self.assertEqual(result["page_content"]["header_count"], 21)
        for row in result["page_content"]["rows"]:
            self.assertEqual(len(row), 21)
            self.assertEqual(row[12:14], ["Prepared", "Pending"])
            self.assertEqual(row[14:17], ["", "", ""])
            self.assertEqual(row[17], source["page_expires_at_utc"])
            self.assertEqual(row[18], source["source_run_id"])
            self.assertEqual(row[19:21], ["", ""])
        serialized = page_batch.canonical_json(result)
        for item in source["recipients"]:
            self.assertNotIn(item["public_token"], serialized)

    def test_hash_protocol_matches_documented_cross_language_commitments(self) -> None:
        result = page_batch.prepare_batch(payload(2))
        rows = result["page_content"]["rows"]
        recipient_records: list[str] = []
        page_records: list[str] = []
        for row in rows:
            self.assertEqual(
                row[11],
                hashlib.sha256(page_batch.UNIT_SEP.join(row[:11]).encode()).hexdigest(),
            )
            recipient_records.append(page_batch.UNIT_SEP.join([row[4], row[5], row[6], row[7]]))
            page_records.append(
                page_batch.UNIT_SEP.join(
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
            )
        expected_recipient_set = hashlib.sha256(
            page_batch.RECORD_SEP.join(sorted(recipient_records)).encode()
        ).hexdigest()
        expected_page_set = hashlib.sha256(
            page_batch.RECORD_SEP.join(sorted(page_records)).encode()
        ).hexdigest()
        self.assertEqual(result["recipient_set_hash"], expected_recipient_set)
        self.assertEqual(result["page_set_sha256"], expected_page_set)

    def test_evidence_json_is_utf8_sorted_compact_and_exactly_two(self) -> None:
        result = page_batch.prepare_batch(payload(1))
        row = result["page_content"]["rows"][0]
        for position, cell in enumerate(row[9:11], start=1):
            parsed = json.loads(cell)
            self.assertEqual(cell, page_batch.canonical_json(parsed))
            self.assertEqual(parsed["position"], position)
            self.assertIn("Öffentlicher", cell)

        cases = []
        missing_first_test = payload(1)
        del missing_first_test["recipients"][0]["evidence"][0]["firstTest"]
        cases.append(missing_first_test)
        wrong_schema = payload(1)
        wrong_schema["recipients"][0]["evidence"][0]["schema"] = "wrong"
        cases.append(wrong_schema)
        third_evidence = payload(1)
        third_evidence["recipients"][0]["evidence"].append(evidence(2))
        cases.append(third_evidence)
        first_test_on_second = payload(1)
        first_test_on_second["recipients"][0]["evidence"][1]["firstTest"] = {
            "title": "not allowed",
            "description": "not allowed",
        }
        cases.append(first_test_on_second)
        unknown_key = payload(1)
        unknown_key["recipients"][0]["evidence"][0]["unknown"] = "no"
        cases.append(unknown_key)
        control = payload(1)
        control["recipients"][0]["evidence"][0]["title"] = "bad\u001fvalue"
        cases.append(control)
        duplicate_finding = payload(1)
        first = duplicate_finding["recipients"][0]["evidence"][0]
        second = duplicate_finding["recipients"][0]["evidence"][1]
        for key in ("title", "observation", "implication", "sourceUrl"):
            second[key] = first[key]
        cases.append(duplicate_finding)

        for case in cases:
            with self.subTest(case=cases.index(case)):
                with self.assertRaises(page_batch.ValidationError):
                    page_batch.prepare_batch(case)

    def test_duplicate_ids_and_tokens_fail_closed(self) -> None:
        for field in ("company_id", "contact_id", "public_token", "letter_id"):
            case = payload(2)
            case["recipients"][1][field] = case["recipients"][0][field]
            with self.subTest(field=field):
                with self.assertRaisesRegex(page_batch.ValidationError, "duplicate"):
                    page_batch.prepare_batch(case)

    def test_page_expiry_is_required_and_bound(self) -> None:
        missing = payload(1)
        del missing["page_expires_at_utc"]
        with self.assertRaises(page_batch.ValidationError):
            page_batch.prepare_batch(missing)

        changed = payload(1)
        first = page_batch.prepare_batch(changed)
        changed["page_expires_at_utc"] = "2026-10-01T22:00:00.000Z"
        second = page_batch.prepare_batch(changed)
        self.assertNotEqual(first["page_set_sha256"], second["page_set_sha256"])
        self.assertEqual(first["recipient_set_hash"], second["recipient_set_hash"])


class ReceiptTests(unittest.TestCase):
    def setUp(self) -> None:
        self.bundle = page_batch.prepare_batch(payload(50))
        self.receipt = sign(self.bundle)

    def test_sign_and_verify_with_domain_separated_golden_vector(self) -> None:
        verified = page_batch.verify_activation_receipt(
            self.receipt, secret=SECRET, now=NOW
        )
        self.assertEqual(verified, self.receipt)
        self.assertTrue(page_batch._receipt_body(self.receipt).startswith(b"IXA_PAGE_ACTIVATION_V1\n"))
        self.assertEqual(
            self.bundle["recipient_set_hash"],
            "5396697978ddb94134ae46e0c6764c2cbf2d839ba952bf8c94409a6f5375676e",
        )
        self.assertEqual(
            self.bundle["page_set_sha256"],
            "d5af087ae80bcd1ebfafbb4f7008067f145b18fbc1e4e2100dc941c739ec7a0b",
        )
        self.assertEqual(
            self.receipt["signature_hmac_sha256"],
            "1b919ffc8d0e4ee2dc6f91fb0af7993051cca8683974ca7a78237d3d4289077b",
        )
        self.assertEqual(
            self.receipt["receipt_sha256"],
            "8b2c97ffed91017aa6c618697c9e9253a32b5518766f12f288aa9ba07e6d6765",
        )

    def test_runtime_canonical_page_version_and_nonce_rules(self) -> None:
        invalid_version = payload(50)
        invalid_version["page_version"] = "v3.00"
        with self.assertRaisesRegex(page_batch.ValidationError, "vN or vN.N"):
            page_batch.prepare_batch(invalid_version)

        with self.assertRaisesRegex(page_batch.ValidationError, "12 distinct"):
            page_batch.sign_activation_request(
                self.bundle["activation_request"],
                receipt_id="IXA-PA-002",
                approved_by="IXA owner",
                approved_at_utc=APPROVED_AT,
                expires_at_utc=EXPIRES_AT,
                consumed_at_utc=CONSUMED_AT,
                nonce="a" * 43,
                secret=SECRET,
                now=NOW,
            )

    def test_wrong_or_short_secret_fails(self) -> None:
        with self.assertRaisesRegex(page_batch.ValidationError, "signature"):
            page_batch.verify_activation_receipt(
                self.receipt, secret=OTHER_SECRET, now=NOW
            )
        with self.assertRaisesRegex(page_batch.ValidationError, "at least 32"):
            page_batch.verify_activation_receipt(
                self.receipt, secret=b"too-short", now=NOW
            )

    def test_every_signed_field_mutation_is_rejected(self) -> None:
        mutations: dict[str, object] = {
            "schema_version": 2,
            "scope": "PRINT_READY",
            "receipt_id": "IXA-PA-002",
            "batch_id": "IXA002",
            "recipient_set_hash": "1" * 64,
            "page_version": "v3.1",
            "page_set_sha256": "2" * 64,
            "recipient_count": 49,
            "approved_by": "Another owner",
            "approved_at_utc": "2026-08-30T19:59:59.000Z",
            "expires_at_utc": "2026-08-30T21:00:01.000Z",
            "consumed_at_utc": "2026-08-30T20:05:01.000Z",
            "nonce": "ZBCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopq",
        }
        for field, value in mutations.items():
            changed = copy.deepcopy(self.receipt)
            changed[field] = value
            with self.subTest(field=field):
                with self.assertRaises(page_batch.ValidationError):
                    page_batch.verify_activation_receipt(changed, secret=SECRET, now=NOW)

    def test_scope_is_isolated_from_print_ready_even_with_valid_hmac(self) -> None:
        request = copy.deepcopy(self.bundle["activation_request"])
        request["scope"] = "PRINT_READY"
        with self.assertRaisesRegex(page_batch.ValidationError, "PAGE_ACTIVATION"):
            page_batch.sign_activation_request(
                request,
                receipt_id="IXA-PA-002",
                approved_by="IXA owner",
                approved_at_utc=APPROVED_AT,
                expires_at_utc=EXPIRES_AT,
                consumed_at_utc=CONSUMED_AT,
                nonce="ZBCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopq",
                secret=SECRET,
                now=NOW,
            )

        forged = copy.deepcopy(self.receipt)
        forged["scope"] = "PRINT_READY"
        forged["signature_hmac_sha256"] = hmac.new(
            SECRET, page_batch._receipt_body(forged), hashlib.sha256
        ).hexdigest()
        forged["receipt_sha256"] = page_batch._receipt_sha256(
            forged, forged["signature_hmac_sha256"]
        )
        with self.assertRaisesRegex(page_batch.ValidationError, "PAGE_ACTIVATION"):
            page_batch.verify_activation_receipt(forged, secret=SECRET, now=NOW)

    def test_expiry_and_maximum_24_hour_window(self) -> None:
        with self.assertRaisesRegex(page_batch.ValidationError, "must not be in the future"):
            page_batch.sign_activation_request(
                self.bundle["activation_request"],
                receipt_id="IXA-PA-002",
                approved_by="IXA owner",
                approved_at_utc=APPROVED_AT,
                expires_at_utc=EXPIRES_AT,
                consumed_at_utc="2026-08-30T20:06:00.000Z",
                nonce="ZBCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopq",
                secret=SECRET,
                now=NOW,
            )

        future_consumption = copy.deepcopy(self.receipt)
        future_consumption["consumed_at_utc"] = "2026-08-30T20:06:00.000Z"
        future_consumption["signature_hmac_sha256"] = hmac.new(
            SECRET,
            page_batch._receipt_body(future_consumption),
            hashlib.sha256,
        ).hexdigest()
        future_consumption["receipt_sha256"] = page_batch._receipt_sha256(
            future_consumption,
            future_consumption["signature_hmac_sha256"],
        )
        with self.assertRaisesRegex(page_batch.ValidationError, "must not be in the future"):
            page_batch.verify_activation_receipt(
                future_consumption,
                secret=SECRET,
                now=NOW,
            )

        with self.assertRaisesRegex(page_batch.ValidationError, "expired"):
            page_batch.verify_activation_receipt(
                self.receipt,
                secret=SECRET,
                now=datetime(2026, 8, 30, 21, 0, tzinfo=timezone.utc),
            )

        with self.assertRaisesRegex(page_batch.ValidationError, "24 hours"):
            page_batch.sign_activation_request(
                self.bundle["activation_request"],
                receipt_id="IXA-PA-002",
                approved_by="IXA owner",
                approved_at_utc=APPROVED_AT,
                expires_at_utc="2026-08-31T20:00:01.000Z",
                consumed_at_utc=CONSUMED_AT,
                nonce="ZBCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopq",
                secret=SECRET,
                now=NOW,
            )

    def test_signature_and_receipt_digest_tampering_fail(self) -> None:
        bad_signature = copy.deepcopy(self.receipt)
        bad_signature["signature_hmac_sha256"] = "0" * 64
        with self.assertRaisesRegex(page_batch.ValidationError, "signature"):
            page_batch.verify_activation_receipt(bad_signature, secret=SECRET, now=NOW)

        bad_digest = copy.deepcopy(self.receipt)
        bad_digest["receipt_sha256"] = "0" * 64
        with self.assertRaisesRegex(page_batch.ValidationError, "digest"):
            page_batch.verify_activation_receipt(bad_digest, secret=SECRET, now=NOW)


class CliTests(unittest.TestCase):
    def test_cli_requires_v1_environment_secret_and_writes_only_explicit_outputs(self) -> None:
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            input_path = root / "input.json"
            prepared_path = root / "prepared.json"
            receipt_path = root / "receipt.json"
            input_path.write_text(page_batch.canonical_json(payload(50)), encoding="utf-8")

            self.assertEqual(
                page_batch.main(
                    ["prepare", str(input_path), "--output", str(prepared_path)]
                ),
                0,
            )
            with patch.dict(os.environ, {}, clear=True), redirect_stderr(StringIO()):
                self.assertEqual(
                    page_batch.main(
                        [
                            "sign",
                            str(prepared_path),
                            "--receipt-id",
                            "IXA-PA-001",
                            "--approved-by",
                            "IXA owner",
                            "--approved-at-utc",
                            APPROVED_AT,
                            "--expires-at-utc",
                            EXPIRES_AT,
                            "--consumed-at-utc",
                            CONSUMED_AT,
                            "--nonce",
                            NONCE,
                            "--output",
                            str(receipt_path),
                        ]
                    ),
                    2,
                )
            self.assertFalse(receipt_path.exists())

    def test_duplicate_json_keys_are_rejected(self) -> None:
        with tempfile.TemporaryDirectory() as directory:
            path = Path(directory) / "duplicate.json"
            path.write_text('{"batch_id":"A","batch_id":"B"}', encoding="utf-8")
            with self.assertRaisesRegex(page_batch.ValidationError, "duplicate JSON key"):
                page_batch._load_json(path)


if __name__ == "__main__":
    unittest.main()
