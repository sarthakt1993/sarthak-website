// ========================================
// MAIN.JS — Global initialization and interactive behaviors
// ========================================

function attachNavBehavior() {
  const toggle = document.getElementById('mobileMenuToggle');
  const navLinks = document.getElementById('topnavLinks');
  const links = document.querySelectorAll('.topnav-links a');

  toggle.addEventListener('click', () => {
    navLinks.classList.toggle('open');
    toggle.classList.toggle('active');
  });

  links.forEach(link => {
    link.addEventListener('click', () => {
      navLinks.classList.remove('open');
      toggle.classList.remove('active');
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

    links.forEach(link => {
      const sectionId = link.getAttribute('href').replace('#', '');
      link.classList.toggle('active', sectionId === currentSection);
    });
  });
}

function attachFadeAnimations() {
  const fadeElements = document.querySelectorAll(
    '.about-grid, .interests-grid, .collage-grid, .contact-split, .section-header, .section-label'
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

  setTimeout(() => {
    fadeElements.forEach(el => el.classList.add('visible'));
  }, 2000);
}

async function init() {
  const [hero, about, contact] = await Promise.all([
    fetch('/api/hero').then(r => r.json()),
    fetch('/api/about').then(r => r.json()),
    fetch('/api/contact').then(r => r.json())
  ]);

  renderHero(hero);
  loadHeroVideo();
  renderAbout(about);
  renderInterests();
  await renderCollage();
  renderContact(contact);
  renderNavSocials(contact);

  attachNavBehavior();
  attachFadeAnimations();
}

window.loadingPromises.push(init());
