# Objavuj 10.0

- Voliteľné slovenské vzdelávacie spracovanie RSS úryvkov cez OpenAI Responses API.
- **Predvolene vypnuté** (`OBJAVUJ_AI_ENABLED=false`). Bez kľúča nevykonáva API volania.
- Max. 3 požiadavky na beh predvolene, hard cap 5; nejde o garantovaný finančný strop.
- AI nepristupuje k celým článkom, len k titulku a krátkemu RSS úryvku.
- Chyby API nespôsobia výpadok publikovania; zostáva predchádzajúci feed.
- AI výstupy sú viditeľne označené; žiadny API kľúč nie je v statických súboroch.

## Zapnutie až po rozhodnutí používateľa

GitHub repo → Settings → Secrets and variables → Actions:

1. Secret `OPENAI_API_KEY` (nevkladať do kódu ani do PR).
2. Variable `OBJAVUJ_AI_ENABLED` nastaviť na `true`.
3. Voliteľne variable `OBJAVUJ_AI_MAX_PER_RUN` na `1` až `5`.
4. Voliteľne `OBJAVUJ_AI_MODEL` (predvolený `gpt-4.1-mini`; skontroluj dostupnosť a cenník API).

**Náklady:** Každý úspešný alebo čiastočne spracovaný API request môže byť účtovaný. Limity volaní na workflow nie sú hard spending cap. Samostatne nastav billing budget/usage alerts na platform.openai.com. API účet je nezávislý od predplatného ChatGPT.
