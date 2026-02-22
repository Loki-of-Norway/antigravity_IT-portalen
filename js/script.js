/* ==========================================
   Brukerstøtteportal - JavaScript
   ========================================== */

document.addEventListener('DOMContentLoaded', function() {
  // Initialize all components
  initMobileNav();
  initHeaderScroll();
  initSearch();
  initAnimations();
  initChatbot();
  initFAQ();
  initAuthStatus();
});

/* ==========================================
   Auth Status (Dynamic Login/Logout)
   ========================================== */
function initAuthStatus() {
  fetch('/api/user-status')
    .then(res => res.json())
    .then(data => {
      if (data.loggedIn) {
        updateAuthButtons(true, data.user);
      }
    })
    .catch(err => console.error('Auth check failed:', err));
}

function updateAuthButtons(isLoggedIn, user) {
  // Find all Login links (desktop and mobile)
  // We look for links pointing to login.html
  const loginLinks = document.querySelectorAll('a[href*="login.html"]');
  
  loginLinks.forEach(link => {
    if (isLoggedIn) {
      link.textContent = 'Logg ut';
      link.href = '#';
      link.classList.add('logout-btn'); // For specific styling if needed
      
      // Remove existing event listeners by cloning or just adding new one that prevents default
      link.addEventListener('click', (e) => {
        e.preventDefault();
        handleLogout();
      });
    }
  });
}

function handleLogout() {
  fetch('/api/logout', { method: 'POST' })
    .then(res => res.json())
    .then(data => {
      if (data.success) {
        window.location.href = '/index.html'; // Redirect to home after logout
      }
    })
    .catch(err => console.error('Logout failed:', err));
}

/* ==========================================
   Mobile Navigation
   ========================================== */
function initMobileNav() {
  const menuToggle = document.querySelector('.menu-toggle');
  const navMobile = document.querySelector('.nav-mobile');
  const body = document.body;

  if (!menuToggle || !navMobile) return;

  menuToggle.addEventListener('click', function() {
    this.classList.toggle('active');
    navMobile.classList.toggle('active');
    body.style.overflow = navMobile.classList.contains('active') ? 'hidden' : '';
  });

  // Close menu when clicking on a link
  navMobile.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', function() {
      menuToggle.classList.remove('active');
      navMobile.classList.remove('active');
      body.style.overflow = '';
    });
  });

  // Close menu on escape key
  document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape' && navMobile.classList.contains('active')) {
      menuToggle.classList.remove('active');
      navMobile.classList.remove('active');
      body.style.overflow = '';
    }
  });
}

/* ==========================================
   Header Scroll Effect
   ========================================== */
function initHeaderScroll() {
  const header = document.querySelector('.header');
  if (!header) return;

  let lastScroll = 0;

  window.addEventListener('scroll', function() {
    const currentScroll = window.pageYOffset;

    if (currentScroll > 50) {
      header.classList.add('scrolled');
    } else {
      header.classList.remove('scrolled');
    }

    lastScroll = currentScroll;
  });
}

/* ==========================================
   Search Functionality
   ========================================== */
function initSearch() {
  const searchInput = document.querySelector('.search-input');
  const cards = document.querySelectorAll('.card:not(.card-feature)');
  
  if (!searchInput || cards.length === 0) return;

  searchInput.addEventListener('input', function() {
    const query = this.value.toLowerCase().trim();
    
    if (query === '') {
      cards.forEach(card => {
        card.style.display = '';
        card.classList.remove('hidden');
      });
      return;
    }

    cards.forEach(card => {
      const title = card.querySelector('h3')?.textContent.toLowerCase() || '';
      const description = card.querySelector('p')?.textContent.toLowerCase() || '';
      
      if (title.includes(query) || description.includes(query)) {
        card.style.display = '';
        card.classList.remove('hidden');
      } else {
        card.style.display = 'none';
        card.classList.add('hidden');
      }
    });
  });

  // Clear search on escape
  searchInput.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
      this.value = '';
      cards.forEach(card => {
        card.style.display = '';
        card.classList.remove('hidden');
      });
      this.blur();
    }
  });
}

/* ==========================================
   Scroll Animations
   ========================================== */
function initAnimations() {
  const observerOptions = {
    root: null,
    rootMargin: '0px',
    threshold: 0.1
  };

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('animate-fade-in');
        observer.unobserve(entry.target);
      }
    });
  }, observerOptions);

  // Observe all cards and sections
  document.querySelectorAll('.card, .section').forEach((el, index) => {
    el.style.opacity = '0';
    el.style.animationDelay = `${index * 0.05}s`;
    observer.observe(el);
  });
}

/* ==========================================
   Chatbot Functionality
   ========================================== */
/* ==========================================
   Chatbot Functionality (Enhanced with Gemini & Decision Tree)
   ========================================== */
function initChatbot() {
  const chatInput = document.querySelector('.chat-input');
  const chatMessages = document.querySelector('.chat-messages');
  const sendButton = document.querySelector('.chat-send');
  const toggleSwitch = document.getElementById('decisionTreeToggle');
  
  if (!chatInput || !chatMessages) return;

  // State
  let isAiMode = false; // Default to Guided Mode (since toggle is "Unchecked" = Guided usually, but let's check HTML)
  // HTML: <input type="checkbox" id="decisionTreeToggle" checked> -> Checked = ? 
  // Label says: "AI-Assistent" [Switch] "Veiledet"
  // If checked (right side/slider moved) -> Veiledet? Or AI?
  // Let's interpret: Left (unchecked) = AI, Right (checked) = Guided.
  // We'll update state on load.

  // Decision Tree Data
  const decisionTree = {
    'ROOT': {
      text: "Hei! Hva kan jeg hjelpe deg med i dag? Velg en kategori nedenfor.",
      options: [
        { text: "Lære noe nytt (Kurs)", next: "LEARNING_ROOT" },
        { text: "Teknisk Problem", next: "SUPPORT_ROOT" },
        { text: "Verktøy & Regler", next: "TOOLS_ROOT" },
        { text: "Kontakt & Info", next: "CONTACT_ROOT" }
      ]
    },
    // --- LEARNING BRANCH ---
    'LEARNING_ROOT': {
      text: "Hva vil du lære mer om?",
      options: [
        { text: "Grunnleggende PC", next: "LEARNING_GRUNNLEGGENDE" },
        { text: "Office & Teams", next: "LEARNING_OFFICE" },
        { text: "Alle Veiledninger", link: "/pages/kategorier/veiledninger.html" }
      ]
    },
    'LEARNING_GRUNNLEGGENDE': {
      text: "Vi har fine guider for nybegynnere!",
      link: "/pages/kategorier/veiledninger.html#grunnleggende",
      linkText: "Gå til Grunnleggende",
      options: [{ text: "Start på nytt", next: "ROOT" }]
    },
    'LEARNING_OFFICE': {
      text: "Word, Excel eller Teams? Vi har kurs for alt.",
      link: "/pages/kategorier/veiledninger.html#office",
      linkText: "Se Office-kurs",
      options: [{ text: "Start på nytt", next: "ROOT" }]
    },

    // --- SUPPORT BRANCH ---
    'SUPPORT_ROOT': {
      text: "Hva er problemet?",
      options: [
        { text: "Glemt Passord / Feide", next: "SUPPORT_PASSWORD" },
        { text: "Nettverk / Wi-Fi", next: "SUPPORT_WIFI" },
        { text: "Printer / Utskrift", next: "SUPPORT_PRINTER" },
        { text: "Maskinvare (PC/Skjerm)", next: "SUPPORT_HARDWARE" },
        { text: "Annet", next: "CONTACT_FORM" }
      ]
    },
    'SUPPORT_PASSWORD': {
      text: "Du kan endre passord selv på nett, eller kontakte oss for nullstilling.",
      link: "https://passord.vlfk.no",
      linkText: "Resett Passord (VLFK)",
      options: [
        { text: "Lese mer om Feide?", link: "/pages/undersider/faq.html#feide" },
        { text: "Start på nytt", next: "ROOT" }
      ]
    },
    'SUPPORT_WIFI': {
      text: "Nettverksproblemer? Sjekk at du er på 'Skole-Guest' eller 'Skole-Ansatt'.",
      link: "/pages/tjenester/feilsoking.html#nettverk",
      linkText: "Feilsøking Nettverk",
      options: [{ text: "Melde sak", next: "TOOLS_REPORT" }]
    },
    'SUPPORT_PRINTER': {
        text: "Tomt for papir eller toner? Eller kommer ikke utskriften?",
        options: [
            { text: "Melde mangel (Toner/Papir)", next: "TOOLS_REPORT" },
            { text: "Installasjon av printer", link: "/pages/veiledninger/printer-setup.html" }
        ]
    },
    'SUPPORT_HARDWARE': {
      text: "Maskinvareproblemer krever ofte at vi ser på PC-en.",
      link: "/pages/tjenester/feilsoking.html",
      linkText: "Prøv feilsøking først",
      options: [{ text: "Melde sak", next: "TOOLS_REPORT" }]
    },

    // --- TOOLS & CONTACT ---
    'TOOLS_ROOT': {
      text: "Verktøy:",
      options: [
        { text: "Melde sak", next: "TOOLS_REPORT" },
        { text: "GDPR Info", next: "TOOLS_GDPR" }
      ]
    },
    'TOOLS_REPORT': {
      text: "Bruk kontaktskjemaet for å registrere saken.",
      link: "/pages/konvertering/kontakt.html",
      linkText: "Gå til Skjema",
      options: [{ text: "Start på nytt", next: "ROOT" }]
    },
    'TOOLS_GDPR': {
        text: "Personvern er viktig. Les våre rutiner.",
        link: "/pages/kategorier/ressurser.html",
        linkText: "Ressursbibliotek",
        options: [{ text: "Tilbake", next: "ROOT" }]
    },
    'CONTACT_ROOT': {
        text: "Du finner oss i 2. etasje, rom 202.",
        options: [
            { text: "Send e-post", link: "mailto:support@skole.no" },
            { text: "Åpningstider", next: "CONTACT_INFO" }
        ]
    },
    'CONTACT_INFO': {
        text: "Vi har åpent 08:00 - 15:30 alle hverdager.",
        options: [{ text: "Takk!", next: "ROOT" }]
    },
    'CONTACT_FORM': {
        text: "Send oss en melding direkte.", 
        next: "TOOLS_REPORT" 
    },
    
    // FALLBACKS
    'UNKNOWN': {
        text: "Jeg forstod ikke helt. Kan du velge fra menyen?",
        next: "ROOT"
    }
  };

  // --- Logic ---

  function updateMode() {
      // Toggle Switch: 
      // Checked = Guided Mode (Right: "Veiledet")
      // Unchecked = AI Mode (Left: "AI-Assistent")
      if (toggleSwitch) {
          const isChecked = toggleSwitch.checked;
          isAiMode = !isChecked; 
          
          // UI Updates
          // We now allow typing in BOTH modes (for "Jump to Node" search in Guided Mode)
          chatInput.disabled = false; 
          chatInput.placeholder = isAiMode ? 'Spør "Loki" om hva som helst...' : 'Søk i menyen eller bruk knappene...';
          sendButton.disabled = false;
          
          // Clear chat or show welcome based on mode
          chatMessages.innerHTML = '';
          
          if (isAiMode) {
              addMessage("Hei! Jeg er din AI-assistent (drevet av Gemini). Fortell meg hva du trenger, så finner jeg riktig sted for deg!", false);
          } else {
              // Start Guided Tour
              displayNode('ROOT');
          }
      }
  }

  // Toggle Listener
  if (toggleSwitch) {
      toggleSwitch.addEventListener('change', updateMode);
      // Initialize state on load
      updateMode();
  }

  function addMessage(text, isUser = false) {
    const messageDiv = document.createElement('div');
    messageDiv.className = `chat-message ${isUser ? 'user' : 'bot'}`;
    
    const avatar = document.createElement('div');
    avatar.className = `chat-avatar ${isUser ? 'user' : 'bot'}`;
    avatar.innerHTML = isUser ? '👤' : '🤖';
    
    const bubble = document.createElement('div');
    bubble.className = 'chat-bubble';
    bubble.innerHTML = text.replace(/\n/g, '<br>'); // Simple formatting
    
    messageDiv.appendChild(avatar);
    messageDiv.appendChild(bubble);
    chatMessages.appendChild(messageDiv);
    
    chatMessages.scrollTop = chatMessages.scrollHeight;
  }

  function renderQuickReplies(options) {
      // Remove existing quick replies if any
      const existing = chatMessages.querySelectorAll('.chat-quick-replies');
      existing.forEach(el => el.remove());

      if (!options || options.length === 0) return;

      const container = document.createElement('div');
      container.className = 'chat-quick-replies';

      options.forEach(opt => {
          const btn = document.createElement('button');
          btn.className = 'quick-reply-btn';
          btn.textContent = opt.text;
          btn.addEventListener('click', () => {
              if (opt.link) {
                  window.location.href = opt.link; // Navigate away
                  return;
              }
              if (opt.next) {
                  // If in AI mode, clicking a button switches to 'acting' like guided for a step
                  // or we just traverse.
                  // Let's mimic user choosing:
                  addMessage(`Valgt: ${opt.text}`, true); // Show selection
                  displayNode(opt.next);
              }
          });
          container.appendChild(btn);
      });

      chatMessages.appendChild(container); // Append to bottom of chat
      chatMessages.scrollTop = chatMessages.scrollHeight;
  }

  function displayNode(nodeId) {
      const node = decisionTree[nodeId] || decisionTree['UNKNOWN'];
      
      // Delay slightly for "bot thinking" feel
      setTimeout(() => {
          addMessage(node.text, false);
          
          // If node has a main link/CTA
          if (node.link && node.linkText) {
             const linkMsg = `<a href="${node.link}" class="btn btn-outline btn-sm">${node.linkText}</a>`;
             // Append to bubble or new bubble? New bubble is cleaner for HTML
             const bubble = chatMessages.lastElementChild.querySelector('.chat-bubble');
             bubble.innerHTML += `<br><br>${linkMsg}`;
          }

          // Show options
          if (node.options) {
              renderQuickReplies(node.options);
          }
      }, 500);
  }

  // --- Typing Indicator ---
  function showTyping() {
      const existing = chatMessages.querySelector('.chat-message.typing');
      if (existing) return;

      const messageDiv = document.createElement('div');
      messageDiv.className = 'chat-message bot typing'; // add 'typing' class
      
      const avatar = document.createElement('div');
      avatar.className = 'chat-avatar bot';
      avatar.innerHTML = '🤖';
      
      const bubble = document.createElement('div');
      bubble.className = 'chat-bubble';
      
      // Typing animation dots
      const indicator = document.createElement('div');
      indicator.className = 'typing-indicator';
      indicator.innerHTML = `
        <div class="typing-dot"></div>
        <div class="typing-dot"></div>
        <div class="typing-dot"></div>
      `;
      
      bubble.appendChild(indicator);
      messageDiv.appendChild(avatar);
      messageDiv.appendChild(bubble);
      
      chatMessages.appendChild(messageDiv);
      chatMessages.scrollTop = chatMessages.scrollHeight;
  }

  function hideTyping() {
      const typingMsg = chatMessages.querySelector('.chat-message.typing');
      if (typingMsg) {
          typingMsg.remove();
      }
  }

  function handleSend() {
    const message = chatInput.value.trim();
    if (!message) return;
    
    // UI: Add User Message
    addMessage(message, true);
    chatInput.value = '';
    
    // Choose Mode
    // Locked/Guided Mode -> Usually input is disabled, BUT if we want "AI Jumping" in guided mode,
    // we need to allow input. 
    // Plan: 
    // - Guided Mode (Checked): "Veiledet". If user clicks -> Tree. If user Types -> "Jump to Node" (Intent).
    // - AI Mode (Unchecked): "AI-Assistent". Free chat.
    
    const mode = isAiMode ? 'free_chat' : 'guided';

    // Show Typing
    showTyping();

    fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: message, mode: mode }) 
    })
    .then(res => res.json())
    .then(data => {
      hideTyping();
      
      if (data.success) {
          if (mode === 'guided') {
              // Expect Intent
              const intent = data.intent; // e.g., "LEARNING_GRUNNLEGGENDE" or "UNKNOWN"
              if (intent && decisionTree[intent]) {
                  // Success: Jump to node
                  // Maybe add a small text first?
                  // addMessage("Jeg fant dette for deg:", false);
                  displayNode(intent);
              } else {
                  // Fallback: No matching node found
                  addMessage("Beklager, jeg fant ingen relevant kategori i menyen. Prøv å bruke knappene eller formuler deg annerledes.", false);
              }
          } else {
              // Free Chat
              // Expect 'response' text
              addMessage(data.response, false); 
          }
      } else {
        addMessage('Beklager, en serverfeil oppstod.', false);
      }
    })
    .catch(err => {
      hideTyping();
      console.error(err);
      addMessage('Kunne ikke koble til serveren.', false);
    });
  }

  // Event listeners
  chatInput.addEventListener('keydown', function(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  });

  if (sendButton) {
    sendButton.addEventListener('click', handleSend);
  }
}

/* ==========================================
   FAQ Accordion
   ========================================== */
function initFAQ() {
  const faqQuestions = document.querySelectorAll('.faq-question');
  if (!faqQuestions.length) return;

  faqQuestions.forEach(button => {
    button.addEventListener('click', () => {
      const item = button.parentElement;
      const isActive = item.classList.contains('active');
      
      // Close all items
      document.querySelectorAll('.faq-item').forEach(i => i.classList.remove('active'));
      
      // Open clicked item if it wasn't active
      if (!isActive) {
        item.classList.add('active');
      }
    });
  });
}

/* ==========================================
   Form Validation
   ========================================== */
function validateForm(form) {
  let isValid = true;
  const inputs = form.querySelectorAll('input[required], textarea[required]');
  
  inputs.forEach(input => {
    if (!input.value.trim()) {
      isValid = false;
      input.classList.add('error');
    } else {
      input.classList.remove('error');
    }
  });
  
  // Email validation
  const emailInput = form.querySelector('input[type="email"]');
  if (emailInput && emailInput.value) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(emailInput.value)) {
      isValid = false;
      emailInput.classList.add('error');
    }
  }
  
  return isValid;
}

/* ==========================================
   Utility Functions
   ========================================== */

// Smooth scroll to element
function scrollTo(elementId) {
  const element = document.getElementById(elementId);
  if (element) {
    element.scrollIntoView({ behavior: 'smooth' });
  }
}

// Format date
function formatDate(date) {
  return new Intl.DateTimeFormat('nb-NO', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  }).format(date);
}

// Debounce function
function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}
