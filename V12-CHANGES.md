# Objavuj 12.0 — automatické AI prehľady

- AI sa v publikačnom workflow zapína automaticky, **iba keď je prítomný** `OPENAI_API_KEY` secret; bez neho zostáva pôvodný RSS feed.
- Predvolené maximum 10 nových AI požiadaviek za jeden beh (možno znížiť prostredníctvom `OBJAVUJ_AI_MAX_PER_RUN`).
- Odborný prehľad, 3 hlavné poznatky a otázka v slovenčine; žiadna manuálna obsahová revízia.
- `ai_learning` sa zachová pri nezmenenom RSS úryvku. Ak sa obsah úryvku zmení, AI spracovanie sa vytvorí nanovo.
- AI výstup je viditeľne označený ako spracovanie **iba z RSS úryvku**, nie celého článku.
- API kľúč sa drží iba v GitHub Secrets; nevkladá sa do repozitára ani publikovaného webu.
- Každodenná publikácia pokračuje cez `gh-pages`, bez automatických pushov do `main`.

Dôležité: GitHub Pages adresa je verejne prístupná aj vtedy, keď ju používaš iba ty.
`OBJAVUJ_AI_MAX_PER_RUN` je technický limit počtu požiadaviek, nie garancia maximálnej peňažnej spotreby.

## Aktivácia

1. Repozitár → Settings → Secrets and variables → Actions → New repository secret:
   `OPENAI_API_KEY` = tajný API kľúč.
2. (Voliteľne) Settings → Secrets and variables → Actions → Variables:
   `OBJAVUJ_AI_MAX_PER_RUN` = `10` (alebo 3, 5...).
   `OBJAVUJ_AI_MODEL` = `gpt-4.1-mini`.
3. Po zlúčení PR spusti `gh workflow run update.yml --ref main` a skontroluj
   `gh run list --workflow update.yml --limit 1`.
4. Over `https://janmanina-ux.github.io/objavuj/data/latest.json`, hľadaj `ai_learning`.

Ak nechceš API spracovanie dočasne používať, nastav v Actions Variables
`OBJAVUJ_AI_ENABLED=false` alebo odstráň secret.
