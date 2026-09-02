from __future__ import annotations

import hashlib
import unittest

from scripts import create_postal_batch as postal


class PostalV5ContractTests(unittest.TestCase):
    def test_approved_release_identifiers_are_fixed(self) -> None:
        self.assertEqual(postal.LETTER_VERSION, "IXA-POSTAL-V5-L1-20260901")
        self.assertEqual(postal.PAGE_VERSION, "v4.0")
        self.assertEqual(postal.DESIGN_ID, "IXA-DESIGN-V5-DUPLEX")
        self.assertEqual(postal.RENDERER_SCHEMA, "ixa.postal.v5.duplex.1")

    def test_approved_logo_is_present_and_hash_bound(self) -> None:
        self.assertTrue(postal.LOGO_PATH.is_file())
        actual = hashlib.sha256(postal.LOGO_PATH.read_bytes()).hexdigest()
        self.assertEqual(actual, postal.LOGO_SHA256)

    def test_draft_qr_is_an_explicit_non_scannable_placeholder(self) -> None:
        placeholder = postal.DraftQRPlaceholder()
        self.assertGreater(placeholder.width, 0)
        self.assertGreater(placeholder.height, 0)
        self.assertNotIsInstance(placeholder, postal.QRCodeFlowable)

    def test_batch_contract_remains_exactly_fifty_duplex_recipients(self) -> None:
        self.assertEqual(postal.EXPECTED_RECIPIENT_COUNT, 50)
        self.assertEqual(postal.EXPECTED_RECIPIENT_COUNT * 2, 100)


if __name__ == "__main__":
    unittest.main()
