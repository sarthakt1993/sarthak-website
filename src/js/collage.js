// ========================================
// COLLAGE.JS — Yearly collage grid, timeline, and photo logic
// ========================================

const COLLAGE_YEARS = [2026, 2025, 2024, 2023];
const COLLAGE_MAX = 30;
let currentCollageYear = COLLAGE_YEARS[0]; // default to latest

// Seeded Fisher-Yates shuffle — deterministic for a given seed so the
// layout stays consistent across page reloads for the same year
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

// Builds the year timeline buttons
function renderCollageTimeline() {
  const container = document.getElementById('collageTimeline');
  COLLAGE_YEARS.forEach((year, i) => {
    if (i > 0) {
      const dot = document.createElement('span');
      dot.className = 'collage-timeline-dot';
      container.appendChild(dot);
    }
    const btn = document.createElement('button');
    btn.className = 'collage-timeline-year' + (year === currentCollageYear ? ' active' : '');
    btn.textContent = year;
    btn.addEventListener('click', () => switchCollageYear(year));
    container.appendChild(btn);
  });
}

// Fetches photos for a year and renders the grid
async function loadCollagePhotos(year) {
  const grid = document.getElementById('collageGrid');
  let photos = [];
  try {
    const res = await fetch(`/api/collage/${year}`);
    photos = await res.json();
  } catch { /* empty */ }

  grid.innerHTML = '';

  if (!photos.length) {
    const empty = document.createElement('div');
    empty.className = 'collage-empty';
    empty.textContent = 'No memories added yet for this year';
    grid.appendChild(empty);
    return;
  }

  // If more than COLLAGE_MAX, use seeded shuffle to pick exactly 30
  if (photos.length > COLLAGE_MAX) {
    photos = seededShuffle(photos, year).slice(0, COLLAGE_MAX);
  }

  // Indices for varied grid sizing — visual rhythm
  const wideIndices = [0, 5, 11, 18, 24];
  const tallIndices = [2, 8, 15, 22, 28];

  photos.forEach((filename, i) => {
    const item = document.createElement('div');
    item.className = 'collage-item';
    if (wideIndices.includes(i)) item.classList.add('wide');
    if (tallIndices.includes(i)) item.classList.add('tall');

    const img = document.createElement('img');
    img.src = `assets/images/collage/${year}/${filename}`;
    img.alt = 'Memory';
    img.loading = 'lazy';
    img.style.cssText = 'width:100%;height:100%;object-fit:cover;';
    item.appendChild(img);

    grid.appendChild(item);
  });
}

// Switches the active year with a fade transition
async function switchCollageYear(year) {
  if (year === currentCollageYear) return;
  currentCollageYear = year;

  // Update active button
  document.querySelectorAll('.collage-timeline-year').forEach(btn => {
    btn.classList.toggle('active', parseInt(btn.textContent) === year);
  });

  // Fade out, swap content, fade in
  const grid = document.getElementById('collageGrid');
  grid.classList.add('fading');
  await new Promise(r => setTimeout(r, 300));
  await loadCollagePhotos(year);
  grid.classList.remove('fading');
}

// Initial render: build timeline + load default year
async function renderCollage() {
  renderCollageTimeline();
  await loadCollagePhotos(currentCollageYear);
}
