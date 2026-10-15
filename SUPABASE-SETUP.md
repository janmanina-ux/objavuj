# Objavuj 12.6 – súkromné preklady SK

## 1. Projekt a databáza
1. Vytvor Supabase projekt na https://supabase.com/dashboard.
2. SQL Editor → spusti `supabase/migrations/20261015_library.sql`.
3. Authentication → URL Configuration: Site URL `https://janmanina-ux.github.io/objavuj/`, do Redirect URLs pridaj `https://janmanina-ux.github.io/objavuj/**`.
4. Authentication → Providers → Email: zapni Magic Link/OTP. Odporúčame obmedziť vytváranie používateľov a ponechať iba vlastný účet (ak to nastavenia umožňujú).

## 2. Verejná konfigurácia (nie tajomstvá)
Uprav `config/supabase.json`:
```json
{ "url": "https://PROJECT_REF.supabase.co", "publishableKey": "sb_publishable_..." }
```
Supabase URL a publishable key sú určené na použitie v klientovi; **nikdy** sem nedávaj secret/service_role alebo OpenAI kľúč. Bez RLS tieto verejné údaje nestačia na ochranu dát, preto SQL politiky nevynechávaj.

## 3. Serverová prekladová funkcia
Nainštaluj Supabase CLI, prihlás sa a v koreňovom adresári repozitára:
```bash
supabase login
supabase link --project-ref PROJECT_REF
supabase secrets set OPENAI_API_KEY=sk-...
supabase functions deploy translate-article
```
Kľúč radšej zadávaj interaktívne alebo cez dočasný lokálny env súbor (nevkladaj ho do histórie shellu). Funkcia používa `withSupabase({auth:'user'})` a v `supabase/config.toml` `verify_jwt=false` pre novšie publishable keys, pričom autentifikáciu overuje na serveri.

## 4. Publikovanie
`~/bin/deploy-objavuj.sh ~/Downloads/objavuj-v12.6.zip` → manuálne merge PR → aktualizácia GitHub Pages. Serverovú funkciu je nutné nasadiť zvlášť pomocou Supabase CLI.

## 5. Ako používať
V Objavuj klikni na **Moje slovenské preklady**, prihlás sa rovnakým emailom na laptope/mobilnom telefóne, v článku klikni **Preložiť do slovenčiny** a skopíruj text z originálu. Preklad sa uloží do súkromnej databázy. Znovu preložený nezmenený text sa načíta z cache.

**Limity:** Preklad je určený na súkromné čítanie. Aplikácia sama nesťahuje celé články ani text z webov za paywallom. Vyžaduje text vložený používateľom. Serverový limit na požiadavku je 20 000 znakov. Preklady sú osobné a nie sú súčasťou verejného `gh-pages`.

Server kontroluje orientačný limit 10 novo uložených prekladov denne na účet. Súbežné požiadavky môžu limit obísť; preto nastav aj API rozpočtové upozornenia a obmedz prihlasovanie.


## 12.8: Prihlasovanie heslom

Existujúcemu e-mailom overenému používateľovi nastavte heslo zabezpečeným administračným spôsobom. Vo verejnom klientovi sa používa iba `auth.signInWithPassword`. Magic Link zostáva záložný. Po nasadení otestujte, že zostane prihlásenie aj po refreshi.
