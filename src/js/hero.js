// ========================================
// HERO.JS — Hero section rendering
// ========================================

async function loadHeroVideo() {
  try {
    const res = await fetch('/api/hero-video');
    const data = await res.json();
    if (data.url) {
      document.getElementById('heroVideo').src = data.url;
    }
  } catch { /* silent */ }
}

function renderHero(data) {
  var greeting = document.getElementById('heroGreeting');
  if (greeting && data.greeting) {
    greeting.textContent = data.greeting;
  } else if (greeting) {
    greeting.textContent = "Hello, I'm";
  }
  document.getElementById('heroName').innerHTML = data.name.replace(/\s+/, '<br>');
  document.getElementById('heroTagline').textContent = data.tagline || 'Data analyst by day. Explorer of the world by heart.';
  document.getElementById('footerText').innerHTML = data.footer;
}

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

function renderInterests() {
  const grid = document.getElementById('interestsGrid');

  INTERESTS.forEach((interest) => {
    const card = document.createElement('a');
    card.className = 'interest-card';
    card.href = interest.href;

    card.innerHTML = `
      ${interest.hoverCover ? `<img class="interest-card-bg interest-card-bg--hover" src="${interest.hoverCover}" alt="${interest.label}" />` : ''}
      <img class="interest-card-bg${interest.hoverCover ? ' interest-card-bg--default' : ''}" src="${interest.cover}" alt="${interest.label}" />
      <div class="interest-card-overlay"></div>
      <span class="interest-card-tag">${interest.tag}</span>
      <h3 class="interest-card-title">${interest.label}</h3>
    `;

    grid.appendChild(card);
  });
}

function renderNavSocials(data) {
  const container = document.getElementById('topnavSocials');
  if (!container || !data.socials) return;
  const platforms = ['linkedin', 'instagram'];
  data.socials.forEach(social => {
    if (platforms.includes(social.platform) && SOCIAL_ICONS[social.platform]) {
      const a = document.createElement('a');
      a.href = social.url;
      a.target = '_blank';
      a.rel = 'noopener noreferrer';
      a.setAttribute('aria-label', social.platform);
      a.innerHTML = SOCIAL_ICONS[social.platform];
      container.appendChild(a);
    }
  });
}

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
