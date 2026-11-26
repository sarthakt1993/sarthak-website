// ========================================
// COLLAGE.JS — "Where I've Been?" elastic year gallery
// One panel per year. Hover/focus expands a panel (accordion), and
// clicking an expanded panel opens that year's photos in the lightbox.
// ========================================

const COLLAGE_YEARS = [2026, 2025, 2024, 2023];
const COLLAGE_MAX = 30;
let activeCollageYear = COLLAGE_YEARS[0]; // latest year starts expanded
const collagePhotos = {}; // year -> [urls]

// Seeded Fisher-Yates shuffle — deterministic for a given seed so the
// photo order stays consistent across reloads for the same year
function seededShuffle(arr, seed) {
  const result = arr.slice();
  let s = seed;
  function rand() {
    s = (s * 16807 + 0) % 2147483647;
    return (s - 1) / 2147483646;
  }
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

// Smaller Cloudinary rendition for the panel background
function collageCoverUrl(url) {
  return url.includes('/image/upload/')
    ? url.replace('/image/upload/', '/image/upload/w_1400,q_auto,f_auto/')
    : url;
}

async function fetchCollageYear(year) {
  let photos = [];
  try {
    const res = await fetch(`/api/collage/${year}`);
    photos = await res.json();
  } catch { /* empty */ }
  if (photos.length > COLLAGE_MAX) {
    photos = seededShuffle(photos, year).slice(0, COLLAGE_MAX);
  }
  collagePhotos[year] = photos;
  return photos;
}

function setActiveCollageYear(year) {
  activeCollageYear = year;
  document.querySelectorAll('.elastic-panel').forEach(panel => {
    const isActive = parseInt(panel.dataset.year, 10) === year;
    panel.classList.toggle('is-active', isActive);
    panel.setAttribute('aria-expanded', isActive ? 'true' : 'false');
  });
}

function openCollageYear(year) {
  const photos = collagePhotos[year] || [];
  if (photos.length && window.openLightbox) window.openLightbox(photos, 0);
}

function buildCollagePanel(year, index) {
  const photos = collagePhotos[year] || [];
  const hasPhotos = photos.length > 0;

  const panel = document.createElement('div');
  panel.className = 'elastic-panel' + (hasPhotos ? '' : ' is-empty');
  panel.dataset.year = year;
  panel.tabIndex = 0;
  panel.setAttribute('role', 'button');
  panel.setAttribute(
    'aria-label',
    hasPhotos ? `${year}: view ${photos.length} photos` : `${year}: no memories yet`
  );

  const chapter = String(index + 1).padStart(2, '0');
  const tag = hasPhotos ? `${photos.length} memories` : 'Coming soon';
  const cta = hasPhotos
    ? `<span class="elastic-cta">View memories <span class="elastic-cta-arrow" aria-hidden="true">↗</span></span>`
    : `<span class="elastic-cta elastic-cta--muted">Still being lived</span>`;

  panel.innerHTML = `
    <div class="elastic-media">
      ${hasPhotos ? `<img src="${collageCoverUrl(photos[0])}" alt="" loading="lazy" />` : ''}
      <div class="elastic-shade"></div>
    </div>
    <div class="elastic-content">
      <div class="elastic-active">
        <span class="elastic-tag">${tag}</span>
        <h3 class="elastic-year">${year}</h3>
        ${cta}
      </div>
      <div class="elastic-idle" aria-hidden="true">
        <span class="elastic-idle-year">${year}</span>
        <span class="elastic-idle-num">${chapter}</span>
      </div>
    </div>
  `;

  // Desktop: hover expands. Touch: first tap expands, second tap opens.
  // (pointerdown fires before the emulated mouseenter on touch devices,
  // so we can tell whether the panel was already open before the tap)
  let wasActiveOnTouch = true;
  panel.addEventListener('pointerdown', (e) => {
    wasActiveOnTouch = e.pointerType !== 'touch' || activeCollageYear === year;
  });
  panel.addEventListener('mouseenter', () => setActiveCollageYear(year));
  panel.addEventListener('focus', () => setActiveCollageYear(year));
  panel.addEventListener('click', () => {
    if (!wasActiveOnTouch || activeCollageYear !== year) {
      wasActiveOnTouch = true;
      setActiveCollageYear(year);
      return;
    }
    openCollageYear(year);
  });
  panel.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      openCollageYear(year);
    }
  });

  return panel;
}

// Initial render: fetch every year in parallel, then build the panels
async function renderCollage() {
  const container = document.getElementById('collageGallery');
  if (!container) return;
  await Promise.all(COLLAGE_YEARS.map(fetchCollageYear));

  container.innerHTML = '';
  COLLAGE_YEARS.forEach((year, i) => container.appendChild(buildCollagePanel(year, i)));
  setActiveCollageYear(activeCollageYear);
}
