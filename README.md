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


## V10: voliteľné AI spracovanie
Pozri `V10-CHANGES.md`. Predvolene vypnuté a bezpečné pre bezplatný release.

## v11: controlled comparison before cloud rollout
See `TEST-AI.md` and `V11-CHANGES.md`. Test script does not call APIs without explicit `--execute` and an API key; the existing scheduled workflow remains opt-in for enrichment.


## Release 12

Pozri `V12-CHANGES.md` pre zapnutie automatického AI spracovania, limity a bezpečnostné poznámky.


## V12.3: Automatické titulky a odkazy

Pozri `V12.3-CHANGES.md`. Lokálna skúška: `python3 scripts/discover_links.py`. Nájde len odkazy z tematických indexov, nikdy nepreberá celé články. Nová sekcia sa načítava zo `data/discovered.json`. V prípade blokovania stránky alebo robots.txt je záložný obsah zachovaný.

## V12.4: vyhľadávanie
Klikni na **⌕ Hľadať** alebo stlač **Ctrl/Cmd + K**. Vyhľadávanie beží v prehliadači nad načítanými dátami a nepotrebuje ďalšie API. Odkaz „Hľadať na celom webe“ otvorí Google mimo aplikácie.

## V12.6: Súkromná knižnica a slovenské preklady
Pozri `SUPABASE-SETUP.md`. Supabase a OpenAI vyžadujú konfiguráciu pred použitím.


## v12.7
Prihlasovanie Magic Link zobrazuje chyby callbacku, obnovuje stav na pageshow a pri návrate na kartu.
