# Hvordan lage nye sider i IT-portalen

Dette dokumentet forklarer hvordan du legger til nye sider i prosjektet på riktig måte, slik at design og navigasjon fungerer som det skal.

## 1. Hvor skal filen lagres?

Velg riktig mappe under `pages/` basert på innholdet:

*   **`pages/undersider/`**: Generelle sider (f.eks. Om oss, FAQ).
*   **`pages/tjenester/`**: Spesifikke tjenester (f.eks. Chatbot).
*   **`pages/kategorier/`**: Samlesider (f.eks. Veiledninger, Ressurser).
*   **`pages/artikler/`**: Dybdeartikler og guider (f.eks. Feilsøking, Sikkerhet).
*   **`pages/konvertering/`**: Skjemaer og landingssider (f.eks. Login, Kontakt).

## 2. Start med en mal

Kopier koden under inn i den nye filen din (f.eks. `min-nye-side.html`). Denne malen har korrekte lenker til CSS, bilder og JavaScript.

```html
<!DOCTYPE html>
<html lang="nb">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="description" content="Kort beskrivelse av siden din her.">
  <title>Tittel på siden - IT-portalen</title>
  <!-- Merk: Bruk absolutt sti (/) for å sikre at CSS alltid lastes korrekt -->
  <link rel="stylesheet" href="/css/styles.css">
  <link rel="icon" type="image/png" href="/Images/Loki_Brukerstøtte.png">
</head>
<body>
  <!-- Header -->
  <header class="header">
    <div class="container">
      <div class="header-inner">
        <a href="/index.html" class="logo">
          <img src="/Images/Loki_Brukerstøtte.png" alt="Loki Brukerstøtte" class="logo-icon">
          <span class="logo-text">IT-portalen</span>
        </a>
        
        <nav class="nav-desktop">
          <ul>
            <li><a href="/index.html">Hjem</a></li>
            <li><a href="/pages/undersider/om-oss.html">Om oss</a></li>
            <li><a href="/pages/kategorier/veiledninger.html">Veiledninger</a></li>
            <li><a href="/pages/kategorier/ressurser.html">Ressurser</a></li>
            <li><a href="/pages/undersider/faq.html">FAQ</a></li>
            <li><a href="/pages/konvertering/kontakt.html">Kontakt</a></li>
          </ul>
        </nav>
        
        <div class="header-actions">
          <a href="/pages/konvertering/login.html" class="btn btn-outline">Logg inn</a>
          <a href="/pages/konvertering/registrer.html" class="btn btn-primary">Registrer</a>
          <button class="menu-toggle" aria-label="Meny">
            <span></span>
            <span></span>
            <span></span>
          </button>
        </div>
      </div>
    </div>
    
    <!-- Mobilmeny -->
    <nav class="nav-mobile">
      <ul>
        <li><a href="/index.html">Hjem</a></li>
        <li><a href="/pages/undersider/om-oss.html">Om oss</a></li>
        <li><a href="/pages/kategorier/veiledninger.html">Veiledninger & Kurs</a></li>
        <li><a href="/pages/undersider/faq.html">FAQ</a></li>
        <li><a href="/pages/konvertering/kontakt.html">Kontakt oss</a></li>
      </ul>
    </nav>
  </header>

  <!-- Side-overskrift (Breadcrumbs og tittel) -->
  <section class="page-header">
    <div class="container">
      <div class="breadcrumb">
        <a href="/index.html">Hjem</a>
        <span>/</span>
        <!-- Endre dette til passende kategori -->
        <span>Kategori</span>
      </div>
      <h1>Tittel på siden</h1>
    </div>
  </section>

  <!-- Hovedinnhold -->
  <main class="page-content">
    <div class="container">
      <div class="content-card">
        <h2>Overskrift i kortet</h2>
        <p>Her skriver du innholdet ditt.</p>
        
        <!-- Eksempel på ikon -->
        <!-- Du kan finne flere SVG-ikoner på nettet (f.eks. Lucide Icons) -->
      </div>
    </div>
  </main>

  <!-- Footer -->
  <footer class="footer">
    <div class="container">
      <p>Theodor "Loki" Kvalem © 2026 IT-portalen. Designet for IT-Studenter and IT-Entusiaster.</p>
    </div>
  </footer>

  <script src="/js/script.js"></script>
</body>
</html>
```

## 3. Viktige ting å huske på

1.  **Absolutte stier**:
    *   Vi bruker nå `/` foran alle stier (f.eks. `/css/styles.css`, `/index.html`).
    *   Dette gjør at lenkene fungerer uansett hvilken mappe du lagrer filen i.
    *   Ikke bruk `../` eller `../../` lenger.

2.  **Oppdater menyen (hvis nødvendig)**:
    *   Hvis du lager en ny hovedside som skal vises i menyen, må du oppdatere `index.html` og headeren i **alle** andre HTML-filer.
    *   Søk etter `<nav class="nav-desktop">` for å finne menyen i filene.

3.  **Bilder**:
    *   Bilder skal ligge i `Images/`-mappen.
    *   Lenk til dem slik: `<img src="/Images/bildenavn.png" alt="Beskrivelse">`.
