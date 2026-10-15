# Objavuj 4.0 — súkromný slovenský magazín

## Čo funguje
- Redakčne pripravené články, filtre, záložky a kurz **Europa od základov**.
- RSS import bežiaci denne cez GitHub Actions, s diagnostikou chýb a zachovaním starších článkov pri výpadkoch.
- PWA manifest, offline shell a offline cache naposledy načítaného RSS súboru, tlačidlo na obnovenie.
- Bez účtu, bez plateného API a bez centrálnej databázy.

## Publikovanie cez GitHub Pages
1. Rozbaľ ZIP; v adresári založ **nový verejný GitHub repozitár**, napríklad `objavuj`.
2. `git init && git add . && git commit -m "Objavuj 4.0" && git branch -M main`
3. `git remote add origin https://github.com/TVOJ-UCET/objavuj.git && git push -u origin main`
4. Repo **Settings → Pages → Deploy from branch**, `main`, `/ (root)`.
5. Repo **Actions → Aktualizovat magazin → Run workflow**; skontroluj log a súbor `data/latest.json`.
6. Otvor GitHub Pages URL (príklad `https://TVOJ-UCET.github.io/objavuj/`). V Chrome na Androide si ju môžeš pridať na plochu.

## Lokálne spustenie
`python3 -m http.server 8080` a otvor `http://localhost:8080`.

## Dôležité obmedzenia
- **Neoverené živé RSS:** prostredie, kde vznikol prototyp, nemalo sieťový DNS prístup. RSS URL sú kandidátske; prvé workflow môže oznámiť chyby. Zoznam spravuje `feeds.json`.
- Aktuálne články obsahujú titulky a krátke úryvky poskytnuté RSS zdrojom; **nie automatický slovenský preklad** ani plné články.
- Bezplatný GitHub Actions workflow nemá garantovaný presný čas spustenia. GitHub Pages web je verejný, **nie súkromný**; uložené články sú iba v danom prehliadači.
- Ilustračné fotky z externých URL nie sú offline uložené ani nejde o obrázky z pôvodných článkov.
- Offline funguje obsah aplikácie a predtým úspešne načítaný feed po návšteve online. Bez predchádzajúcej návštevy offline nefunguje.
- PWA inštalácia a service worker vyžadujú HTTPS (GitHub Pages) alebo localhost.

## Ručný import na stroji s internetom
`python3 scripts/update_feeds.py`

## Kam ďalej
Pred pridaním AI zhrnutí overiť kvalitu zdrojov, filtráciu článkov a práva na preberaný obsah. Ak by sa pridalo AI API, kľúč patrí výlučne do **GitHub Actions Secrets**, nikdy do frontendu.

## Verzia 8.0

Podrobnosti sú v `V8-CHANGES.md`. V aplikácii sa RSS fotografie zobrazujú iba vtedy, keď ich samotný RSS zdroj poskytuje. Čas čítania sa vzťahuje iba na ukážku z RSS, nie na celý článok. Automatické súhrny pomocou AI zatiaľ nie sú aktivované.

Offline overenie pred publikovaním:

```bash
python3 -m unittest discover -s tests -v
python3 -m py_compile scripts/update_feeds.py
```


## Verzia 9
Pozri `V9-CHANGES.md`. Nové otázky sa vytvoria počas ďalšieho RSS importu; AI API sa nepoužíva.
