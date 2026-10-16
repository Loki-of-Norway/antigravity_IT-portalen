---
name: student-simulator
description: Generer testelever, tilfeldige eller realistiske oppgavebesvarelser, quizer og support-tickets for full testing av adminpanelet og lærer-oversikten i IT-portalen.
---

# Testelev & Oppgavesimulator (MCP)

Dette verktøyet gjør det mulig å fylle IT-portalens database med realistiske testelever, oppgavebesvarelser, quiz-resultater, vurderinger og brukerstøtte-tickets for å teste adminpanelet og lærer-oversikten.

## Tilgjengelige MCP Verktøy:

1. **`create_test_students`**: Oppretter testelever med norske navn og e-poster (f.eks. `elev_emilie@skole-test.no`).
2. **`simulate_task_responses`**: Genererer oppgave- og quiz-svar på kursene (`intro-coding`, `pc-basics`, `datasikkerhet` osv.).
   - Moduser: `random`, `realistic`, `high_performing`, `struggling`.
3. **`simulate_tickets`**: Genererer realistiske IT-tickets (nettverk, passord, maskinvare).
4. **`simulate_feedback`**: Genererer stjernerangeringer og tilbakemeldinger.
5. **`run_full_simulation`**: Kjører komplett oppsett i én operasjon.
6. **`clear_test_data`**: Sletter alle genererte testelever og tilhørende data trygt.
7. **`get_simulation_summary`**: Henter oversikt over databasestatus.

## Kjøring fra CLI / Terminal:
- Kjøre simulering: `node mcp/simulator-server.js --run`
- Nullstille testdata: `node mcp/simulator-server.js --clear`
- Se status: `node mcp/simulator-server.js --status`
