# IT-portalen 🚀

En moderne, responsiv og funksjonell brukerstøtteportal utviklet for elever og personer med behov for IT-støtte. Portalen kombinerer et profesjonelt design med en solid teknisk backend.

## 🌟 Funksjoner

- **20+ Temasider:** Omfattende guider innen IT-drift, sikkerhet, etikk og kommunikasjon.
- **Interaktiv Chatbot:** Loki Chatbot hjelper brukere med raske svar på vanlige spørsmål.
- **Dynamisk Søk:** Finn raskt frem til riktig ressurs med sanntidsfiltrering på forsiden.
- **Brukerhåndtering:** Full støtte for registrering og innlogging med sikker database-lagring.
- **Kontaktskjema & Tilbakemelding:** Integrasjon med MySQL for lagring av henvendelser og brukervurderinger.
- **Responsivt Design:** Optimalisert for både mobil, nettbrett og desktop.

## 🛠 Teknologi

- **Frontend:** HTML5, Vanilla CSS3 (Custom Design System), JavaScript (ES6+).
- **Backend:** Node.js (Express) with MySQL (mysql2) for secure database communication.
- **Database:** MySQL (innstalleres via `database.sql`).
- **Ikoner:** Feather Icons (SVG).
- **Typografi:** Inter (Google Fonts).

## 🚀 Kom i gang

### Forutsetninger
- [Node.js](https://nodejs.org/) (anbefalt LTS versjon).
- MySQL/MariaDB (f.eks. via XAMPP eller en separat installasjon).

### Installasjon
1. Last ned eller klon prosjektet.
2. Åpne terminalen i prosjektmappen og kjør:
   ```bash
   npm install
   ```
3. Importer `database.sql` i din MySQL-database (inneholder alle tabeller for tickets, kurs og chat).
4. Opprett en `.env`-fil i rotmappen med følgende innhold:
   ```env
   DB_HOST=localhost
   DB_USER=root
   DB_PASS=ditt_passord
   DB_NAME=IT_portalen
   SESSION_SECRET=velg_en_hemmelig_streng
   PORT=3000
   ```
5. Start serveren:
   ```bash
   node server.js
   ```
6. Åpne `http://localhost:3000` i nettleseren din.

## 👤 Forfatter
**Theodor "Loki" Kvalem**
© 2026 IT-portalen. Designet for Students and People who need IT-support.
