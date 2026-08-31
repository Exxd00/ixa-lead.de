from __future__ import annotations

import copy
import unittest
from datetime import datetime, timezone

from scripts.postal_activation import (
    PostalActivationError,
    verify_postal_activation,
)


NOW = datetime(2026, 8, 31, 20, 2, tzinfo=timezone.utc)
DIGEST = "a" * 64
RECEIPT = {
    "approved_at_utc": "2026-08-31T20:00:00.000Z",
    "approved_by": "Owner-Emad-Alzaim",
    "approved_for": "PRINT_READY",
    "batch_digest_sha256": DIGEST,
    "batch_id": "IXA001",
    "consumed_at_utc": "2026-08-31T20:01:00.000Z",
    "content_version": "IXA-POSTAL-V3-L1-20260830",
    "expires_at_utc": "2026-09-01T20:00:00.000Z",
    "key_id": "IXA-POSTAL-RSA-2026-01",
    "letter_date": "2026-09-01",
    "nonce": "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopq",
    "receipt_id": "IXA-POSTAL-ACT-TEST-001",
    "recipient_count": 50,
    "schema_version": 2,
    "signature_rsa_sha256_base64url": (
        "ClCjtRkBT9Lc-nYxWy-VwX5JuYXwncnecMENbAGqaBmmSA3_jIYTKyR20365DzJEaTU"
        "4EZVki7XER3BxwNP1ax6i7ZEDnIJBATtyB0JyGy_YHjehuKFNb39Nc_TLWqtOS5WeC"
        "uOfgIVMC7EdQ-5AOJkFNimLXKChViMhz2P7RRrhuJcFqQ4wNIne2054gPatpZ4Cwn5"
        "v3xotsD4RmEW7ROxDHSSXmMCChtXc5_53D9MQPIZUEuq_J641zt6EtuNhG4MrfMAHZ"
        "VJ4oQpHfmr5LxbULMwcgr_TDonBpqG88r6vNB6iq9qWbV4FMSwiPK3gu_fsNFuqHmK"
        "ZRqJ-DPOYuA"
    ),
}


def verify(value: dict, *, now: datetime = NOW):
    return verify_postal_activation(
        value,
        batch_id="IXA001",
        content_version="IXA-POSTAL-V3-L1-20260830",
        letter_date="2026-09-01",
        recipient_count=50,
        batch_digest_sha256=DIGEST,
        now=now,
    )


class PostalActivationTests(unittest.TestCase):
    def test_pinned_public_key_accepts_exact_apps_script_contract(self) -> None:
        result = verify(copy.deepcopy(RECEIPT))
        self.assertEqual(result.receipt_id, "IXA-POSTAL-ACT-TEST-001")
        self.assertEqual(result.batch_digest_sha256, DIGEST)
        self.assertEqual(result.key_id, "IXA-POSTAL-RSA-2026-01")
        self.assertRegex(result.receipt_sha256, r"^[0-9a-f]{64}$")

    def test_material_change_invalidates_signature(self) -> None:
        changed = copy.deepcopy(RECEIPT)
        changed["approved_by"] = "Someone else"
        with self.assertRaisesRegex(PostalActivationError, "not the IXA owner"):
            verify(changed)

    def test_wrong_batch_digest_fails_before_build(self) -> None:
        changed = copy.deepcopy(RECEIPT)
        changed["batch_digest_sha256"] = "b" * 64
        with self.assertRaisesRegex(PostalActivationError, "digest does not match"):
            verify(changed)

    def test_expired_receipt_is_not_reusable(self) -> None:
        with self.assertRaisesRegex(PostalActivationError, "has expired"):
            verify(
                copy.deepcopy(RECEIPT),
                now=datetime(2026, 9, 1, 20, 0, 1, tzinfo=timezone.utc),
            )

    def test_general_or_partial_approval_is_not_accepted(self) -> None:
        partial = copy.deepcopy(RECEIPT)
        partial["recipient_count"] = 49
        with self.assertRaisesRegex(PostalActivationError, "exact 50"):
            verify_postal_activation(
                partial,
                batch_id="IXA001",
                content_version="IXA-POSTAL-V3-L1-20260830",
                letter_date="2026-09-01",
                recipient_count=49,
                batch_digest_sha256=DIGEST,
                now=NOW,
            )


if __name__ == "__main__":
    unittest.main()
