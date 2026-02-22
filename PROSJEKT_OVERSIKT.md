# Prosjektoversikt – IT‑portalen 🚀

## Beskrivelse
IT‑portalen er en responsiv web‑applikasjon som gir elever, IT‑lærlinger og IT‑interesserte tilgang til guider, kurs, support og en AI‑drevet chatbot. Portalen kombinerer et moderne design med en solid backend basert på **Node.js/Express** og **MySQL**.

## Teknologier
- **Frontend**: HTML5, Vanilla CSS3 (eget design‑system), JavaScript (ES6+)
- **Backend**: Node.js, Express, MySQL (mysql2), dotenv, bcrypt, express‑session
- **AI‑Chatbot**: Google Gemini (generativ AI) med intensjonsklassifisering
- **Verktøy**: npm, nodemon, Git, `run_sql.js` (for database-oppdatering)

## Hovedfunksjoner
- **Navigasjon** – konsistent desktop‑ og mobilmeny med dynamisk innhold.
- **Chatbot** – svarer på IT‑spørsmål, bruker intents og fallback‑logikk.
- **Bruker‑autentisering** – registrering, innlogging, sesjonshåndtering.
- **Admin‑panel** – statistikk, feedback‑håndtering, ticket‑system.
- **Ressurser** – guider, videoer, PDF‑nedlastinger, quiz‑moduler.
- **Søk** – sanntidssøk med mulighet for AI‑basert semantisk søk.

## Fil‑ og mappestruktur (utdrag)
```
antigravity_brukerstøtte_portal/
├─ index.html               # Hovedside
├─ pages/                   # Alle HTML‑sider
│   ├─ artikler/            # Artikler (veiledninger, sikkerhet, osv.)
│   ├─ kategorier/          # Kategorisider (veiledninger, nyheter)
│   └─ undersider/          # Om‑oss, kontakt, FAQ
├─ css/
│   ├─ styles.css           # Globalt design‑system
│   └─ modal_styles.css    # Modal‑stiler
├─ js/
│   ├─ script.js           # Hoved‑JS‑logikk
│   └─ ...
├─ server.js                # Express‑server og API‑ruter
├─ .env                     # Miljøvariabler (DB‑tilkobling osv.)
├─ database.sql             # SQL‑skript for opprettelse av DB‑tabeller
└─ FremtidigeOppgraderinger.md  # Ideer til videre utvikling
```

## Pågående arbeid / neste steg
- Fullføre **dark‑mode**‑implementasjon.
- Integrere **analytics‑dashboard** i admin‑panelet.
- Migrere til et moderne frontend‑rammeverk (f.eks. **React** eller **Next.js**) for bedre skalerbarhet.
- Utvide **AI‑chatbot** med flere intents og kontekst‑bevaring.

*Dette dokumentet er ment som basis for å generere AI‑prompter for videre utvikling.*
