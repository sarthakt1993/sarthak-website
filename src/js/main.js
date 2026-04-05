// ========================================
// MAIN.JS — Global initialization and interactive behaviors
// ========================================

// Sidebar navigation: mobile hamburger toggle, overlay close, active section highlighting
function attachNavBehavior() {
  const sidebar = document.getElementById('sidebar');
  const toggle = document.getElementById('mobileMenuToggle');
  const overlay = document.getElementById('sidebarOverlay');
  const navLinks = document.querySelectorAll('.sidebar-nav a');

  toggle.addEventListener('click', () => {
    sidebar.classList.toggle('open');
    toggle.classList.toggle('active');
    overlay.classList.toggle('active');
  });

  overlay.addEventListener('click', () => {
    sidebar.classList.remove('open');
    toggle.classList.remove('active');
    overlay.classList.remove('active');
  });

  navLinks.forEach(link => {
    link.addEventListener('click', () => {
      sidebar.classList.remove('open');
      toggle.classList.remove('active');
      overlay.classList.remove('active');
    });
  });

  // Highlight the nav link corresponding to the currently visible section
  const sections = document.querySelectorAll('section[id]');
  window.addEventListener('scroll', () => {
    const scrollY = window.scrollY + 150;
    let currentSection = '';

    sections.forEach(section => {
      const top = section.offsetTop;
      const height = section.offsetHeight;
      if (scrollY >= top && scrollY < top + height) {
        currentSection = section.getAttribute('id');
      }
    });

    navLinks.forEach(link => {
      const sectionId = link.getAttribute('href').replace('#', '');
      link.classList.toggle('active', sectionId === currentSection);
    });
  });
}

// Fade-in animations: elements start invisible and fade in when scrolled into view
function attachFadeAnimations() {
  const fadeElements = document.querySelectorAll(
    '.about-grid, .interests-grid, .collage-grid, .contact-info, .section-header'
  );
  fadeElements.forEach(el => el.classList.add('fade-in'));

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.05 });

  fadeElements.forEach(el => observer.observe(el));

  // Safety fallback: make everything visible after 2 seconds
  setTimeout(() => {
    fadeElements.forEach(el => el.classList.add('visible'));
  }, 2000);
}

// Initialize: fetch content and build the page
async function init() {
  const [hero, about, contact] = await Promise.all([
    fetch('/api/hero').then(r => r.json()),
    fetch('/api/about').then(r => r.json()),
    fetch('/api/contact').then(r => r.json())
  ]);

  renderHero(hero);
  renderAbout(about);
  renderInterests();
  await renderCollage();
  renderContact(contact);
  renderSidebarSocials(contact);

  attachNavBehavior();
  attachFadeAnimations();
}

// Start everything
init();
