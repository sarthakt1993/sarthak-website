// ========================================
// SUBPAGE.JS — Shared logic for sub-pages (pages/*.html)
// ========================================
// Handles topnav behavior, social icons, footer text,
// and loading screen for all interest sub-pages.

// Populate topnav social icons by fetching contact data
async function initSubpage() {
  try {
    const contact = await fetch('/api/contact').then(r => r.json());

    // Topnav socials
    const topnavSocials = document.getElementById('topnavSocials');
    if (topnavSocials && contact.socials) {
      const platforms = ['linkedin', 'instagram'];
      contact.socials.forEach(social => {
        if (platforms.includes(social.platform) && SOCIAL_ICONS[social.platform]) {
          const a = document.createElement('a');
          a.href = social.url;
          a.target = '_blank';
          a.rel = 'noopener noreferrer';
          a.setAttribute('aria-label', social.platform);
          a.innerHTML = SOCIAL_ICONS[social.platform];
          topnavSocials.appendChild(a);
        }
      });
    }

    // Footer text from hero data
    const hero = await fetch('/api/hero').then(r => r.json());
    const footerText = document.getElementById('footerText');
    if (footerText && hero.footer) {
      footerText.innerHTML = hero.footer;
    }
  } catch (err) {
    console.error('Subpage init failed:', err.message);
  }
}

// Topnav mobile toggle behavior
function attachSubpageNav() {
  const toggle = document.getElementById('mobileMenuToggle');
  const navLinks = document.getElementById('topnavLinks');

  if (toggle && navLinks) {
    toggle.addEventListener('click', () => {
      navLinks.classList.toggle('open');
      toggle.classList.toggle('active');
    });

    const links = navLinks.querySelectorAll('a');
    links.forEach(link => {
      link.addEventListener('click', () => {
        navLinks.classList.remove('open');
        toggle.classList.remove('active');
      });
    });
  }
}

// Initialize — register as loading promise so loader waits for content
attachSubpageNav();
window.loadingPromises.push(initSubpage());
