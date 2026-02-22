# Prosjektbeskrivelse – IT‑portalen 🚀

## Teknisk oppsett (IT‑utvikling/Drift)

- **Tech‑stack**: Frontend er bygget med HTML5, Vanilla CSS3 og JavaScript (ES6+). Backend bruker **Node.js (Express)** med **MySQL** (mysql2) for databasen. AI‑chatbot er integrert via **Google Gemini 2.5**.
- **Kode‑struktur**: 
  - `server.js` – Express‑server, API‑ruter og sesjonshåndtering.
  - `database.sql` – SQL‑skript som oppretter alle tabeller (brukere, guider, tickets, chat‑historikk osv.).
  - `pages/` – Alle HTML‑sider, delt inn i `artikler/`, `kategorier/`, `undersider/` og `tjenester/`.
  - `css/` – Globalt design‑system (`styles.css`) og komponent‑spesifikke stiler.
  - `js/` – Frontend‑logikk (`script.js`, `progress.js` osv.).
- **Hosting**: Lokalt under utvikling (`http://localhost:3000`). Prosjektet kan enkelt deployes til en VPS eller Azure App Service ved å installere Node.js, sette miljøvariabler (`.env`) og kjøre `npm start`.

## Design og brukervennlighet (IT‑utvikling/Brukerstøtte)

- **Live‑lenke**: Ingen live‑versjon enda, men du kan starte serveren lokalt for å se siden på `http://localhost:3000`.
- **Skjermbilder**: Se vedlagt mappe `Images/` for mock‑ups av hovedsiden, chatbot‑vinduet og admin‑panelet.
- **Universell utforming (UU)**: Bruk av semantisk HTML, ARIA‑etiketter på navigasjon, høy kontrast via CSS‑variabler, og responsivt design for mobil/tabell.
- **Brukertester**: Klassen har testet navigasjon og søk på flere enheter (PC, nettbrett, mobil). Tilbakemeldinger er samlet i `feedback`‑tabellen og reflektert i UI‑justeringer.

## Sikkerhet (IT‑drift)

- **Innlogging**: Passord hashet med **bcrypt**. Sesjonshåndtering via `express-session` med `SESSION_SECRET` fra `.env`. Administrator‑tilgang sjekkes med `isAdmin`‑middleware.
- **GDPR**: Brukerdata lagres kun så lenge det er nødvendig. Ingen personlige data deles uten samtykke. `personvernerklaering.html` beskriver rettigheter og hvordan data kan slettes.
- **Databehandleravtale**: Ikke nødvendig i skoleprosjektet, men koden er klar for å legge til en avtale ved produksjons‑deploy.

## Dokumentasjon (YFF)

- **Logg‑utdrag**: Se `verify_setup.js` for oppsett‑logg og `run_sql.js` for database‑initialisering. 
- **Refleksjoner**: Valg av Node.js ga rask prototyping, men krevde ekstra sikkerhets‑håndtering (sesjoner, hashing). Database‑design ble justert for å støtte både kurs‑progress og tickets. 
- **Hva gikk galt**: Opprinnelig var `session`‑konfigurasjonen feil for HTTPS, løst ved å sette `cookie.secure = false` i dev‑modus. 
- **Løsninger**: Implementerte `isAdmin`‑middleware, oppdaterte `database.sql` med `ON DELETE SET NULL`‑regler, og la til `guides`‑tabell for innholdshåndtering.

---
*Dette dokumentet er ment for innlevering i VG2‑IT som helårsoppgave.*
