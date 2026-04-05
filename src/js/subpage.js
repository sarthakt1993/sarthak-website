// ========================================
// SUBPAGE.JS — Shared logic for sub-pages (pages/*.html)
// ========================================
// Handles sidebar nav behavior, social icons, footer text,
// and loading screen for all interest sub-pages.

// Populate sidebar social icons by fetching contact data
async function initSubpage() {
  try {
    const contact = await fetch('/api/contact').then(r => r.json());

    // Sidebar socials
    const sidebarSocials = document.getElementById('sidebarSocials');
    if (sidebarSocials && contact.socials) {
      const platforms = ['linkedin', 'instagram'];
      contact.socials.forEach(social => {
        if (platforms.includes(social.platform) && SOCIAL_ICONS[social.platform]) {
          const a = document.createElement('a');
          a.href = social.url;
          a.className = 'sidebar-social-link';
          a.target = '_blank';
          a.rel = 'noopener noreferrer';
          a.setAttribute('aria-label', social.platform);
          a.innerHTML = SOCIAL_ICONS[social.platform];
          sidebarSocials.appendChild(a);
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

// Sidebar mobile toggle behavior
function attachSubpageNav() {
  const sidebar = document.getElementById('sidebar');
  const toggle = document.getElementById('mobileMenuToggle');
  const overlay = document.getElementById('sidebarOverlay');
  const navLinks = document.querySelectorAll('.sidebar-nav a');

  if (toggle) {
    toggle.addEventListener('click', () => {
      sidebar.classList.toggle('open');
      toggle.classList.toggle('active');
      overlay.classList.toggle('active');
    });
  }

  if (overlay) {
    overlay.addEventListener('click', () => {
      sidebar.classList.remove('open');
      toggle.classList.remove('active');
      overlay.classList.remove('active');
    });
  }

  navLinks.forEach(link => {
    link.addEventListener('click', () => {
      sidebar.classList.remove('open');
      toggle.classList.remove('active');
      overlay.classList.remove('active');
    });
  });
}

// Loading screen dismiss
window.addEventListener('load', function() {
  var ls = document.getElementById('loadingScreen');
  if (ls) {
    ls.classList.add('hidden');
    setTimeout(function() { ls.style.display = 'none'; }, 500);
  }
});

// Initialize
attachSubpageNav();
initSubpage();
