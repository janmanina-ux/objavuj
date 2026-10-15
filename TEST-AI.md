# First cloud AI quality test (one request only)

1. Create a project API key at https://platform.openai.com/api-keys and configure billing. API usage is charged separately from ChatGPT. Start with a small budget alert; it is not a guaranteed hard spending cap.
2. In your *local terminal*, `export OPENAI_API_KEY='...'` (never put it into Git/PR, screenshots, or chat). Prefer secret storage or a shell session that doesn't persist the value in history.
3. Preview without charges: `python3 scripts/translation_eval.py --model gpt-4.1-mini`
4. Make exactly one test request: `python3 scripts/translation_eval.py --execute --model gpt-4.1-mini --output /tmp/objavuj-translation.json`
5. Compare resulting text to the local Qwen models and manually verify mainsheet, leech, airflow, telltale terminology.
6. `unset OPENAI_API_KEY` afterward. Do not enable `OBJAVUJ_AI_ENABLED` in GitHub until quality and pricing are approved.

If this is run from GitHub Actions later, save credentials as `OPENAI_API_KEY` secret (never to a public branch).
