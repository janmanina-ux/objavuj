# Objavuj v6 – relevance a filtre

- Skóre relevancie 0–100 je jednoduchá heuristika nad titulkom a RSS úryvkom; nejde o AI ani garanciu kvality.
- Automatická klasifikácia tém, maximálne 10 článkov na tému, max 36 spolu.
- Nové filtre tém a prepínanie poradia článkov v UI.
- Záložný obsah zostáva pri chybe niektorých RSS zdrojov.
- Oprava `rsync --exclude=.git` prenesená do workflow.

## Nasadenie (main chránený)

Rozbaľ balíček cez existujúci projekt, vytvor vetvu `feature/relevant-feed`, commitni zmeny, otvor PR do `main` a zlúč ho. Potom spusti `gh workflow run update.yml --ref main`. Workflow vytvorí nový JSON v `gh-pages` a nasadí Pages.

## Bezpečnosť

Žiadne API tokeny v klientskom kóde. RSS tituly sú v UI vkladané cez `textContent`. Odkazy prechádzajú overením schémy HTTP(S).
