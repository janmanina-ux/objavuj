# Objavuj 8.0 — kvalita článkov

- Obrázky sa preberajú **len z RSS metadát** (media thumbnail/content alebo image enclosure). Ak zdroj obrázok neposkytne, karta ostáva bez obrázka. Žiadne sťahovanie obrázkov ani scraping celých článkov.
- Vylepšený výber: nižšia priorita všeobecných alebo marketingových správ, orientačné *prečo čítať* a limit článkov na kategóriu.
- Odhad času **RSS úryvku**, nie celého článku. Jasný odkaz na pôvodný zdroj.
- Pridaný zdroj MTHIKER s testovaním dostupnosti počas bežného importu; import nepadne, ak je jeden zdroj nedostupný.
- Obnovená cache PWA (`objavuj-shell-v8`).
- Bez AI API a bez dodatočných mesačných nákladov.

## Obmedzenia
RSS obrázky môžu byť blokované vydavateľom. Klasifikácia je heuristická a dôvod na čítanie je len informácia o téme, nie redakčne overený rozbor konkrétneho článku. RSS adresa nového zdroja musí prejsť živým testom pri prvom GitHub Actions importe.
