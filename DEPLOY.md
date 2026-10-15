# Objavuj: main (zdroj) + gh-pages (publikované súbory)

## Jednorazovo

1. V lokálnom klone `git switch main && git pull --ff-only origin main`.
2. Vytvor deploy vetvu bez zmien v main: `git push origin main:refs/heads/gh-pages`.
3. GitHub Settings → Pages → Build and deployment → **Source: GitHub Actions** (nie Deploy from a branch). Dôvod: GITHUB_TOKEN push do gh-pages nespúšťa Pages rebuild. Nový workflow Pages nasadzuje explicitne.
4. Opravu workflow urob v novej feature vetve, napríklad `git switch -c feature/gh-pages-publishing`; skopíruj `.github/workflows/update.yml` z tohto balíka a commitni.
5. `git push -u origin feature/gh-pages-publishing`; `gh pr create --base main --fill`; zreviduj a merge PR.
6. Settings → Actions → General → Workflow permissions: **Read and write permissions** (ak workflow nevie pushovať do gh-pages). Skontroluj tiež možnosť Actions deployment do Pages a prípadné pravidlá `github-pages` environmentu.
7. Actions → Aktualizovat a publikovat Objavuj → Run workflow (spusti z `main`).
8. Skontroluj log, `gh-pages/data/latest.json`, a web https://janmanina-ux.github.io/objavuj/.

## Tok údajov

main (chránená, iba PR) -> Actions -> načítanie starého gh-pages/data/latest.json -> import RSS -> public/ -> commit snapshotu do gh-pages -> upload Pages artifact -> explicitný deploy.

## Dôležité

- V `main` nebudú robotické commity s feedmi.
- `gh-pages` obsahuje verejné výstupné súbory, nie API secrets; špeciálne neukladaj tokeny do repozitára.
- `gh-pages` je publikačný snapshot; v Settings/Pages je **GitHub Actions** (nie branch mode) z dôvodu GitHub obmedzenia.
- Workflow môže zlyhať pri nefunkčných RSS adresách alebo pri zakázanom publikačnom oprávnení. Kontroluj jeho logy.
- Externé RSS zdroje a automatický deploy neboli v tomto prostredí naživo odskúšané.
