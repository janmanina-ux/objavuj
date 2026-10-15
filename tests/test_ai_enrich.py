import os, unittest
from unittest.mock import patch
from scripts import ai_enrich

class AIEnrichTests(unittest.TestCase):
    def test_disabled_by_default(self):
        with patch.dict(os.environ, {}, clear=True):
            self.assertFalse(ai_enrich.enabled())
    def test_enabled_opt_in_only(self):
        with patch.dict(os.environ, {'OBJAVUJ_AI_ENABLED':'true'}, clear=True):
            self.assertTrue(ai_enrich.enabled())
    def test_missing_key_is_safe(self):
        with patch.dict(os.environ, {'OBJAVUJ_AI_ENABLED':'true'}, clear=True):
            self.assertEqual(ai_enrich.main(), 0)
