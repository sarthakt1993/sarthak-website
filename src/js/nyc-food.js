// ========================================
// NYC-FOOD.JS — My NYC Food Journey page logic
// ========================================

(function () {
  'use strict';

  // ---- State ----
  let restaurantData = [];
  let currentView = 'list';
  let sortCol = 'rating';
  let sortDir = 'desc';
  let isAnimating = false;
  let cachedBadgePositions = {};
  const clusterSortDirs = {}; // per-column sort state: 'asc' or 'desc'

  /* CLOUDINARY PHOTOS — replace these placeholder
     src values with your Cloudinary image URLs */
  const SLIDESHOW_IMAGES = [
    '', // placeholder 1
    '', // placeholder 2
    '', // placeholder 3
    '', // placeholder 4
    '', // placeholder 5
  ];

  // Vibes categories — keys are normalized (lowercase) for matching
  const VIBES_NORMALIZE = {
    'i am in love':            'love',
    'am in love':              'love',
    'worth the hype':          'hype',
    'will go if i am nearby':  'area',
    'will go if i\'m in the area': 'area',
    'not worth the hype':      'not-worth'
  };

  const VIBES_ORDER = ['love', 'hype', 'area', 'not-worth'];

  const VIBES_LABELS = {
    'love':      'Am In Love',
    'hype':      'Worth The Hype',
    'area':      'Will Go If I\'m In The Area',
    'not-worth': 'Not Worth The Hype'
  };

  const VIBES_BADGE_STYLES = {
    'love':      { bg: 'var(--russet-clay)',   color: 'var(--powder-petal)' },
    'hype':      { bg: 'var(--pine-blue)',     color: 'var(--powder-petal)' },
    'area':      { bg: 'var(--pacific-blue)',  color: 'var(--powder-petal)' },
    'not-worth': { bg: 'var(--powder-petal)',  color: 'var(--russet-clay)' }
  };

  const VIBES_HEADER_COLORS = {
    'love':      'var(--russet-clay)',
    'hype':      'var(--pine-blue)',
    'area':      'var(--pacific-blue)',
    'not-worth': 'var(--russet-clay)'
  };

  function normalizeVibes(raw) {
    if (!raw) return '';
    return VIBES_NORMALIZE[raw.toLowerCase().trim()] || '';
  }

  // ---- Hero Slideshow ----
  function initSlideshow() {
    const container = document.getElementById('nycSlideshow');
    if (!container) return;

    SLIDESHOW_IMAGES.forEach((src, i) => {
      const slide = document.createElement('div');
      slide.className = 'nyc-hero-slide' + (i === 0 ? ' active' : '');
      if (src) {
        const img = document.createElement('img');
        img.src = src;
        img.alt = '';
        slide.appendChild(img);
      }
      container.appendChild(slide);
    });

    let current = 0;
    const slides = container.querySelectorAll('.nyc-hero-slide');
    if (slides.length <= 1) return;

    setInterval(() => {
      slides[current].classList.remove('active');
      current = (current + 1) % slides.length;
      slides[current].classList.add('active');
    }, 4000);
  }

  // ---- Data Fetch ----
  async function fetchRestaurants() {
    const loading = document.getElementById('nycLoading');
    const error = document.getElementById('nycError');
    const views = document.getElementById('nycViews');

    try {
      const res = await fetch('/api/nyc-food');
      if (!res.ok) throw new Error('fetch failed');
      restaurantData = (await res.json()).map(r => ({
        ...r,
        vibesKey: normalizeVibes(r.vibes)
      }));

      loading.classList.add('hidden');
      views.classList.remove('hidden');

      sortData();
      renderList();
      renderCluster();
    } catch (err) {
      console.error('NYC food fetch error:', err);
      loading.classList.add('hidden');
      error.classList.remove('hidden');
    }
  }

  // ---- Sorting ----
  function sortData() {
    restaurantData.sort((a, b) => {
      let valA, valB;
      if (sortCol === 'name') {
        valA = (a.name || '').toLowerCase();
        valB = (b.name || '').toLowerCase();
        return sortDir === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA);
      }
      if (sortCol === 'vibes') {
        valA = VIBES_ORDER.indexOf(a.vibesKey);
        valB = VIBES_ORDER.indexOf(b.vibesKey);
        if (valA === -1) valA = 999;
        if (valB === -1) valB = 999;
      } else {
        valA = a.rating ?? -1;
        valB = b.rating ?? -1;
      }
      return sortDir === 'asc' ? valA - valB : valB - valA;
    });
  }

  function handleSort(col) {
    if (isAnimating) return;
    if (sortCol === col) {
      sortDir = sortDir === 'asc' ? 'desc' : 'asc';
    } else {
      sortCol = col;
      sortDir = col === 'name' ? 'asc' : 'desc';
    }
    sortData();
    renderList();
  }

  // ---- List View ----
  function vibesBadge(vibesKey) {
    const label = VIBES_LABELS[vibesKey] || vibesKey;
    return `<span class="vibes-badge vibes-badge--${vibesKey}" data-vibes="${vibesKey}">${label}</span>`;
  }

  function renderList() {
    const tbody = document.getElementById('nycTbody');
    const ths = document.querySelectorAll('.nyc-table th');

    ths.forEach(th => {
      const col = th.dataset.col;
      th.classList.toggle('sort-active', sortCol === col);
      const arrowEl = th.querySelector('.sort-arrow');
      if (arrowEl) {
        arrowEl.textContent = sortCol === col ? (sortDir === 'asc' ? '\u25B2' : '\u25BC') : '\u25B2';
      }
    });

    tbody.innerHTML = restaurantData.map(r => `
      <tr>
        <td><a class="name-link" href="${r.googleMapsLink || '#'}" target="_blank" rel="noopener">${r.name}</a></td>
        <td>${r.vibesKey ? vibesBadge(r.vibesKey) : ''}</td>
        <td class="rating">${r.rating != null ? r.rating : ''}</td>
      </tr>
    `).join('');
  }

  // ---- Cluster View ----
  function renderCluster(animateKey) {
    const container = document.getElementById('nycCluster');

    const groups = {};
    VIBES_ORDER.forEach(v => { groups[v] = []; });
    restaurantData.forEach(r => {
      if (r.vibesKey && groups[r.vibesKey]) {
        groups[r.vibesKey].push(r);
      }
    });

    // Sort each column
    VIBES_ORDER.forEach(key => {
      const dir = clusterSortDirs[key] || 'asc';
      groups[key].sort((a, b) => {
        const cmp = (a.name || '').toLowerCase().localeCompare((b.name || '').toLowerCase());
        return dir === 'asc' ? cmp : -cmp;
      });
    });

    container.innerHTML = VIBES_ORDER.map(key => {
      const label = VIBES_LABELS[key];
      const items = groups[key];
      const dir = clusterSortDirs[key] || 'asc';
      const sortLabel = dir === 'asc' ? 'A\u2192Z' : 'Z\u2192A';
      return `
        <div class="nyc-cluster-col nyc-cluster-col--${key}">
          <div class="nyc-cluster-header nyc-cluster-header--${key}" data-vibes="${key}">
            ${label} (${items.length})
            <span class="nyc-cluster-toggle">\u25BC</span>
          </div>
          <button class="nyc-cluster-sort" data-vibes="${key}">${sortLabel}</button>
          <div class="nyc-cluster-items" data-vibes="${key}">
            ${items.map(r => `
              <div class="nyc-cluster-item">
                <a class="nyc-cluster-link" href="${r.googleMapsLink || '#'}" target="_blank" rel="noopener">${r.name}</a>
              </div>
            `).join('')}
          </div>
        </div>
      `;
    }).join('');

    // Sort toggle click handlers
    container.querySelectorAll('.nyc-cluster-sort').forEach(btn => {
      btn.addEventListener('click', () => {
        if (isAnimating) return;
        const key = btn.dataset.vibes;
        clusterSortDirs[key] = (clusterSortDirs[key] || 'asc') === 'asc' ? 'desc' : 'asc';
        renderCluster(key);
      });
    });

    // Mobile collapsible
    container.querySelectorAll('.nyc-cluster-header').forEach(header => {
      header.addEventListener('click', () => {
        if (window.innerWidth > 480) return;
        header.classList.toggle('collapsed');
        const col = header.closest('.nyc-cluster-col');
        const items = col.querySelector('.nyc-cluster-items');
        if (items) items.classList.toggle('collapsed');
      });
    });

    // Animate only the re-sorted column if specified
    if (animateKey) {
      const group = container.querySelector(`.nyc-cluster-items[data-vibes="${animateKey}"]`);
      if (group) {
        animateClusterDropIn([group], null);
      }
    }
  }

  // ---- Badge Position Capture ----
  function captureBadgePositions() {
    const positions = {};
    const seen = {};
    document.querySelectorAll('.vibes-badge').forEach(badge => {
      const key = badge.dataset.vibes;
      if (!key || seen[key]) return;
      seen[key] = true;
      const rect = badge.getBoundingClientRect();
      positions[key] = {
        x: rect.left,
        y: rect.top,
        width: rect.width,
        height: rect.height
      };
    });
    return positions;
  }

  // ---- Cluster Drop-In Animation ----
  function animateClusterDropIn(groups, onDone) {
    let maxItems = 0;
    groups.forEach(group => {
      group.style.opacity = '1';
      const items = group.querySelectorAll('.nyc-cluster-item');
      if (items.length > maxItems) maxItems = items.length;
      items.forEach((item, j) => {
        item.style.opacity = '0';
        item.style.transform = 'translateY(-12px)';
        const d = j * 0.08;
        item.style.transition = `opacity 0.2s ease-out ${d}s, transform 0.2s ease ${d}s`;
      });

      group.offsetHeight;

      items.forEach(item => {
        item.style.opacity = '1';
        item.style.transform = 'translateY(0)';
      });
    });

    const cleanupTime = 200 + maxItems * 80;
    setTimeout(() => {
      groups.forEach(group => {
        group.style.opacity = '';
        group.querySelectorAll('.nyc-cluster-item').forEach(item => {
          item.style.opacity = '';
          item.style.transform = '';
          item.style.transition = '';
        });
      });
      if (onDone) onDone();
    }, cleanupTime);
  }

  // ---- Animated Transitions ----

  // Smooth easing curve — fast start, gentle deceleration
  const FLY_EASING = 'cubic-bezier(0.22, 1, 0.36, 1)';
  const FLY_DURATION = 0.6; // seconds
  const STAGGER_DELAY = 0.1; // seconds between each label

  function animateListToCluster() {
    if (isAnimating) return;
    isAnimating = true;

    const listView = document.getElementById('nycListView');
    const clusterView = document.getElementById('nycClusterView');

    // Step 1: Capture badge positions before fading
    cachedBadgePositions = captureBadgePositions();

    // Step 2: Fade out table
    listView.style.transition = 'opacity 0.35s ease-out';
    listView.style.opacity = '0';

    setTimeout(() => {
      listView.classList.add('hidden');
      listView.style.opacity = '';
      listView.style.transition = '';

      clusterView.classList.remove('hidden');

      // Hide cluster content initially
      const clusterItems = clusterView.querySelectorAll('.nyc-cluster-items');
      clusterItems.forEach(group => { group.style.opacity = '0'; });

      const headers = clusterView.querySelectorAll('.nyc-cluster-header');
      headers.forEach(h => { h.style.visibility = 'hidden'; });

      // Step 3: Create flying labels using transform for GPU-accelerated motion
      const flyingLabels = [];

      headers.forEach((header, i) => {
        const key = header.dataset.vibes;
        const startPos = cachedBadgePositions[key];
        const endRect = header.getBoundingClientRect();

        if (!startPos) {
          header.style.visibility = '';
          return;
        }

        const dx = endRect.left - startPos.x;
        const dy = endRect.top - startPos.y;

        const label = document.createElement('div');
        label.className = 'nyc-flying-label';
        label.textContent = header.textContent.trim();

        const badgeStyle = VIBES_BADGE_STYLES[key];
        const delay = i * STAGGER_DELAY;

        // Place at badge start position, no transform yet
        Object.assign(label.style, {
          left: startPos.x + 'px',
          top: startPos.y + 'px',
          transform: 'translate(0, 0)',
          fontSize: '0.72rem',
          fontWeight: '700',
          fontFamily: 'var(--font-body)',
          padding: '3px 10px',
          borderRadius: '99px',
          background: badgeStyle.bg,
          color: badgeStyle.color,
          opacity: '1',
          // Separate transitions: transform for position (GPU), rest for style morph
          transition: [
            `transform ${FLY_DURATION}s ${FLY_EASING} ${delay}s`,
            `font-size ${FLY_DURATION}s ${FLY_EASING} ${delay}s`,
            `padding ${FLY_DURATION}s ${FLY_EASING} ${delay}s`,
            `border-radius ${FLY_DURATION * 0.6}s ease-out ${delay}s`,
            `background ${FLY_DURATION * 0.7}s ease ${delay + FLY_DURATION * 0.3}s`,
            `color ${FLY_DURATION * 0.5}s ease ${delay + FLY_DURATION * 0.4}s`
          ].join(', ')
        });

        document.body.appendChild(label);
        flyingLabels.push({ label, header, key, dx, dy, index: i });
      });

      // Force reflow
      document.body.offsetHeight;

      // Animate: translate to header position + morph style
      flyingLabels.forEach(({ label, dx, dy, key }) => {
        const headerColor = VIBES_HEADER_COLORS[key];
        Object.assign(label.style, {
          transform: `translate(${dx}px, ${dy}px)`,
          fontSize: '1rem',
          fontFamily: 'var(--font-heading)',
          padding: '0',
          borderRadius: '0',
          background: 'transparent',
          color: headerColor
        });
      });

      // Step 4: After headers land, crossfade to real headers and drop in names
      const totalFlyTime = (FLY_DURATION + (flyingLabels.length - 1) * STAGGER_DELAY) * 1000;

      setTimeout(() => {
        // Crossfade: fade out flying labels while showing real headers
        flyingLabels.forEach(({ label, header }) => {
          label.style.transition = 'opacity 0.15s ease-out';
          label.style.opacity = '0';
          header.style.visibility = '';
          header.style.opacity = '0';
          header.style.transition = 'opacity 0.15s ease-in';
          header.offsetHeight;
          header.style.opacity = '1';
        });

        setTimeout(() => {
          flyingLabels.forEach(({ label, header }) => {
            label.remove();
            header.style.opacity = '';
            header.style.transition = '';
          });

          // Animate restaurant names dropping in — sequential per column
          animateClusterDropIn(clusterItems, () => {
            currentView = 'cluster';
            updateToggleButtons();
            isAnimating = false;
          });

        }, 150);

      }, totalFlyTime);

    }, 350);
  }

  function animateClusterToList() {
    if (isAnimating) return;
    isAnimating = true;

    const listView = document.getElementById('nycListView');
    const clusterView = document.getElementById('nycClusterView');

    // Simple fade out cluster
    clusterView.style.transition = 'opacity 0.25s ease-out';
    clusterView.style.opacity = '0';

    setTimeout(() => {
      clusterView.classList.add('hidden');
      clusterView.style.opacity = '';
      clusterView.style.transition = '';

      // Fade in list
      listView.classList.remove('hidden');
      listView.style.opacity = '0';
      listView.style.transition = 'opacity 0.25s ease-in';
      listView.offsetHeight;
      listView.style.opacity = '1';

      setTimeout(() => {
        listView.style.opacity = '';
        listView.style.transition = '';
        currentView = 'list';
        updateToggleButtons();
        isAnimating = false;
      }, 250);
    }, 250);
  }

  // ---- View Toggle ----
  function switchView(view) {
    if (view === currentView || isAnimating) return;

    if (currentView === 'list' && view === 'cluster') {
      animateListToCluster();
    } else if (currentView === 'cluster' && view === 'list') {
      animateClusterToList();
    }
  }

  function updateToggleButtons() {
    document.querySelectorAll('.nyc-toggle-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.view === currentView);
    });
  }

  // ---- Init ----
  function init() {
    initSlideshow();

    // Toggle buttons
    document.querySelectorAll('.nyc-toggle-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        switchView(btn.dataset.view);
      });
    });

    // Table header sort
    document.querySelectorAll('.nyc-table th[data-col]').forEach(th => {
      th.addEventListener('click', () => handleSort(th.dataset.col));
    });

    fetchRestaurants();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
