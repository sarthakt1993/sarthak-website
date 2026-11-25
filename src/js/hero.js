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
  var tagline = data.tagline || 'Data analyst by day. Explorer of the world by heart.';
  document.getElementById('heroTagline').innerHTML = tagline.replace(/\.\s+/g, '.<br>');
  document.getElementById('footerText').innerHTML = data.footer;

  var logo = document.querySelector('.topnav-logo');
  if (logo && data.logo) {
    logo.textContent = data.logo;
  }
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

  const introEl = document.getElementById('aboutIntro');
  if (data.intro) {
    introEl.innerHTML = data.intro;
  } else {
    introEl.remove();
  }

  const paragraphsContainer = document.getElementById('aboutParagraphs');
  (data.paragraphs || []).forEach(text => {
    const p = document.createElement('p');
    p.innerHTML = text;
    paragraphsContainer.appendChild(p);
  });
}

// About photo slideshow from Cloudinary (sarthak-website/hero/about_me).
// Leaves the existing photo/placeholder untouched if the folder is empty.
async function loadAboutSlideshow() {
  const container = document.getElementById('aboutPhoto');
  if (!container) return;

  let photos = [];
  try {
    const res = await fetch('/api/cloudinary/photos?folder=sarthak-website/hero/about_me');
    if (res.ok) photos = (await res.json()).photos || [];
  } catch (err) {
    console.error('About slideshow fetch failed:', err);
  }
  if (!photos.length) return;

  container.innerHTML = '';
  container.classList.remove('about-image-placeholder');
  container.classList.add('about-slideshow');

  photos.forEach((src, i) => {
    const slide = document.createElement('div');
    slide.className = 'about-slide' + (i === 0 ? ' active' : '');
    const img = document.createElement('img');
    img.src = src;
    img.alt = i === 0 ? 'Photo of Sarthak' : '';
    img.loading = i === 0 ? 'eager' : 'lazy';
    slide.appendChild(img);
    container.appendChild(slide);
  });

  const slides = container.querySelectorAll('.about-slide');
  if (slides.length <= 1) return;

  let current = 0;
  setInterval(() => {
    slides[current].classList.remove('active');
    current = (current + 1) % slides.length;
    slides[current].classList.add('active');
  }, 4000);
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
