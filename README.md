# Matplan · mat.fuglestad.io

En minimal, statisk, mobiltilpasset matportal publisert via GitHub Pages.

## Oppsett

- `index.html`, `styles.css` og `app.js` er en ren statisk nettside.
- `data/weeks/index.json` peker til siste uke og har et arkiv over tidligere uker.
- `data/weeks/YYYY-Www.json` har ukemeny, oppskrifter, meal prep, tilbud, kilder og handleliste.
- Handlelisten lagres lokalt i nettleseren. Ingen konto eller backend trengs.

## Ukentlig publisering

1. Lag og kvalitetssikre en ny matplan på søndag (særlig gyldige tilbud, kilde-URL-er og summert budsjett).
2. Legg til `data/weeks/YYYY-Www.json` (samme skjema som uke 48).
3. Oppdater `data/weeks/index.json` med nyeste uke først og endre `latest`.
4. GitHub Pages publiserer endringene når Pages er aktivert.

Den eksisterende ChatGPT-søndagsoppgaven kan brukes til å generere planen og, **hvis GitHub-tilkoblingen er tilgjengelig i den automatiserte kjøringen**, skrive endringene til repositoriet. Dette er ikke garantert før første automatiserte kjøring er testet. En selvstendig GitHub Actions-jobb krever en egen datakilde/genereringstjeneste. Ikke lag en tom tidsstyrt workflow som hevder å generere innhold.

## GitHub Pages og DNS

1. Under **Settings → Pages**: publiser fra `main` og `/(root)` (hvis branchen er `main`), eller bruk ønsket Actions-workflow.
2. Egendomene `mat.fuglestad.io` ligger i `CNAME`.
3. Hos DNS-leverandøren: CNAME-record `mat` → `Objektorientert.github.io`.
4. Aktiver **Enforce HTTPS** i GitHub Pages etter at sertifikatet er tilgjengelig.

GitHub Pages-domenet vil først fungere når Pages og DNS er riktig konfigurert.

## Vurderinger

Nettsiden er offentlig. Ikke publiser sensitive personopplysninger eller private innkjøp.
Vanlig HTML/CSS/JS uten rammeverk betyr rask side og svært lite vedlikehold.
Nye uker kan legges til uten å endre frontenden.
