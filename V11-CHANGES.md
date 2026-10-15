# Objavuj 11.0 — controlled cloud benchmark

- Added `scripts/translation_eval.py`: an opt-in **one-request** OpenAI API test for the exact sailing translation that failed on local models.
- **Dry-run by default** (`python scripts/translation_eval.py`). `--execute` is required to make a potentially billable call.
- Terminology glossary is supplied explicitly; structured JSON output is validated, and results are saved **outside** the repo for manual review.
- AI enrichment in the automatic GitHub workflow stays **disabled** unless explicitly enabled in GitHub variables.
- Added tests and `.gitignore` protections. No API keys shipped or stored.
- No attempt to publish unreviewed translations as expert instruction.

This is a **controlled model-quality experiment**, not proof that an API model gives accurate domain translations.
