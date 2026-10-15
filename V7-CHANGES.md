# Objavuj 7.0 – redakčná knižnica a čerstvosť

- Pridaný `data/library.json` s ôsmimi tematickými rozcestníkmi; pri Europe oficiálne tuning guides.
- Knižnica má samostatnú sekciu, nie je vydávaná za RSS články.
- Pridaný filter zdrojov a bezpečné vykreslenie odkazov cez DOM (`textContent`).
- Import ignoruje články staršie ako 120 dní; historické články bez dátumu pri ďalšom importe nepretrvávajú.
- Publikačný workflow zahŕňa aj `data/library.json`.
- Bez AI API, bez zmeny GitHub Pages architektúry.

## Nasadenie

Vytvor vetvu z aktuálneho main, skopíruj súbory z balíka, commitni, otvor PR a po merge spusti update.yml. Žiadny push priamo do main.

## Limity

RSS adresy mimo pôvodných piatich zatiaľ nepridávame bez živého overenia. Zmeny treba otestovať v browseri a na GitHub Actions.
