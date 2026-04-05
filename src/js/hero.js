// ========================================
// HERO.JS — Hero section rendering
// ========================================
// Renders the Hero section: name and tagline over the video background.
// Fetched from Notion /api/hero (falls back to hero.json).

function renderHero(data) {
  document.getElementById('heroName').textContent = data.name;
  document.getElementById('heroTagline').textContent = data.tagline;
  // Footer text also comes from hero data
  document.getElementById('footerText').innerHTML = data.footer;
}

// Renders the About section: profile photo, intro paragraph, and body paragraphs.
function renderAbout(data) {
  if (data.photo) {
    const photoContainer = document.getElementById('aboutPhoto');
    photoContainer.innerHTML = '';
    photoContainer.classList.remove('about-image-placeholder');
    const img = document.createElement('img');
    img.src = data.photo;
    img.alt = 'Profile photo';
    img.style.width = '100%';
    img.style.height = '100%';
    img.style.objectFit = 'cover';
    img.style.borderRadius = 'var(--radius-lg)';
    photoContainer.appendChild(img);
  }

  document.getElementById('aboutIntro').innerHTML = data.intro;

  const paragraphsContainer = document.getElementById('aboutParagraphs');
  data.paragraphs.forEach(text => {
    const p = document.createElement('p');
    p.innerHTML = text;
    paragraphsContainer.appendChild(p);
  });
}

// Renders the 4 interest cards as a clickable grid.
function renderInterests() {
  const grid = document.getElementById('interestsGrid');

  INTERESTS.forEach(interest => {
    const card = document.createElement('a');
    card.className = 'interest-card';
    card.href = interest.href;

    card.innerHTML = `
      <div class="interest-card-image">
        <span>${interest.icon}</span>
      </div>
      <div class="interest-card-label">${interest.label}</div>
    `;

    grid.appendChild(card);
  });
}

// Renders the Contact section: location card and social media links.
function renderContact(data) {
  const container = document.getElementById('contactInfo');

  container.innerHTML = `
    <div class="contact-card">
      <div class="contact-icon">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
          <circle cx="12" cy="10" r="3"></circle>
        </svg>
      </div>
      <div>
        <h4>Location</h4>
        <p>${data.location}</p>
      </div>
    </div>
    <div class="contact-socials" id="contactSocialLinks"></div>
  `;

  const socialsContainer = document.getElementById('contactSocialLinks');
  data.socials.forEach(social => {
    const a = document.createElement('a');
    a.href = social.url;
    a.className = 'social-link';
    a.target = '_blank';
    a.rel = 'noopener noreferrer';
    a.setAttribute('aria-label', social.platform);
    a.innerHTML = SOCIAL_ICONS[social.platform] || '';
    socialsContainer.appendChild(a);
  });
}

// Renders social icons in the sidebar.
function renderSidebarSocials(contactData) {
  const container = document.getElementById('sidebarSocials');
  const sidebarPlatforms = ['linkedin', 'instagram'];

  contactData.socials.forEach(social => {
    if (sidebarPlatforms.includes(social.platform)) {
      const a = document.createElement('a');
      a.href = social.url;
      a.className = 'sidebar-social-link';
      a.target = '_blank';
      a.rel = 'noopener noreferrer';
      a.setAttribute('aria-label', social.platform);
      a.innerHTML = SOCIAL_ICONS[social.platform] || '';
      container.appendChild(a);
    }
  });
}
