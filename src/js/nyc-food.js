// ========================================
// NYC-FOOD.JS — My NYC Food Journey page logic
// ========================================

(function () {
  'use strict';

  // ---- State ----
  let restaurantData = [];
  let originalOrder = [];
  let currentView = 'list';
  let sortCol = 'default';
  let sortDir = 'desc';
  let isAnimating = false;
  let cachedBadgePositions = {};

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
    'love':      { bg: '#9E3D3D', color: 'var(--powder-petal)' },
    'hype':      { bg: '#B05B5B', color: 'var(--powder-petal)' },
    'area':      { bg: '#C37A7A', color: 'var(--powder-petal)' },
    'not-worth': { bg: '#D4C5B5', color: 'var(--midnight-violet)' }
  };

  const VIBES_HEADER_COLORS = {
    'love':      '#9E3D3D',
    'hype':      '#B05B5B',
    'area':      '#C37A7A',
    'not-worth': 'var(--midnight-violet)'
  };

  function normalizeVibes(raw) {
    if (!raw) return '';
    return VIBES_NORMALIZE[raw.toLowerCase().trim()] || '';
  }

  // ---- Hero Slideshow ----
  function showFallbackBackground() {
    const hero = document.querySelector('.nyc-hero');
    if (hero) hero.style.background = 'var(--russet-clay)';
  }

  function initSlideshow(photos) {
    const container = document.getElementById('nycSlideshow');
    if (!container) return;

    if (!photos || photos.length === 0) {
      showFallbackBackground();
      return;
    }

    photos.forEach((src, i) => {
      const slide = document.createElement('div');
      slide.className = 'nyc-hero-slide' + (i === 0 ? ' active' : '');
      const img = document.createElement('img');
      img.src = src;
      img.alt = '';
      slide.appendChild(img);
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

  // ---- Hero Stats ----
  function updateHeroStats() {
    var visitedEl = document.getElementById('nycStatsVisited');
    if (visitedEl) visitedEl.textContent = restaurantData.length;
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
      originalOrder = restaurantData.slice();

      loading.classList.add('hidden');
      views.classList.remove('hidden');

      renderList();
      renderCluster();
      updateHeroStats();
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

    if (col === 'default') {
      sortCol = 'default';
      restaurantData = originalOrder.slice();
    } else {
      if (sortCol === col) {
        sortDir = sortDir === 'asc' ? 'desc' : 'asc';
      } else {
        sortCol = col;
        sortDir = (col === 'name' || col === 'vibes') ? 'asc' : 'desc';
      }
      sortData();
    }

    if (currentView === 'list') {
      renderList();
    } else {
      // Groups view — re-render all columns and animate them dropping in
      renderCluster();
      const clusterView = document.getElementById('nycClusterView');
      const groups = clusterView.querySelectorAll('.nyc-cluster-items');
      animateClusterDropIn(Array.from(groups), null);
    }
    updateSortButtons();
  }

  function updateSortButtons() {
    document.querySelectorAll('.nyc-sort-btn').forEach(function (btn) {
      btn.classList.toggle('sort-active', btn.dataset.sort === sortCol);
    });
  }

  function updateSortVisibility() {
    var wrap = document.getElementById('nycSortWrap');
    if (!wrap) return;
    var activeBtn = document.querySelector('.nyc-toggle-btn.active');
    var active = activeBtn ? activeBtn.dataset.view : currentView;
    // Sort bar is visible in both views — only the available options differ
    wrap.style.visibility = '';
    var inCluster = active === 'cluster';
    // In groups view, only Name + Rating make sense
    document.querySelectorAll('.nyc-sort-btn').forEach(function (btn) {
      var s = btn.dataset.sort;
      btn.style.display = (inCluster && (s === 'default' || s === 'vibes')) ? 'none' : '';
    });
  }

  // ---- List View ----
  function vibesBadge(vibesKey) {
    const label = VIBES_LABELS[vibesKey] || vibesKey;
    return `<span class="vibes-badge vibes-badge--${vibesKey}" data-vibes="${vibesKey}">${label}</span>`;
  }

  function rowHtml(r) {
    const rating = r.rating != null ? r.rating : null;
    const pct = rating != null ? Math.max(0, Math.min(100, (rating / 10) * 100)) : 0;
    const ratingCell = rating != null
      ? `<div class="nyc-rating-cell">
           <span class="nyc-rating-number">${rating}</span>
           <div class="nyc-rating-track"><div class="nyc-rating-fill" style="width: ${pct}%"></div></div>
         </div>`
      : '';
    return `
      <div class="nyc-row">
        <div class="nyc-row-cell nyc-col-name"><a class="name-link" href="${r.googleMapsLink || '#'}" target="_blank" rel="noopener">${r.name}</a></div>
        <div class="nyc-row-cell nyc-col-vibes">${r.vibesKey ? vibesBadge(r.vibesKey) : ''}</div>
        <div class="nyc-row-cell nyc-col-rating">${ratingCell}</div>
      </div>
    `;
  }

  function renderList() {
    const colA = document.getElementById('nycListColA');
    const colB = document.getElementById('nycListColB');
    if (!colA || !colB) return;
    const half = Math.ceil(restaurantData.length / 2);
    colA.innerHTML = restaurantData.slice(0, half).map(rowHtml).join('');
    colB.innerHTML = restaurantData.slice(half).map(rowHtml).join('');
  }

  // ---- Cluster View ----
  // Groups view uses the same global sort as list view (Name or Rating).
  // restaurantData is already sorted when this is called, so grouping
  // preserves the desired order within each column.
  function renderCluster() {
    const container = document.getElementById('nycCluster');
    if (!container) return;

    const groups = {};
    VIBES_ORDER.forEach(v => { groups[v] = []; });
    restaurantData.forEach(r => {
      if (r.vibesKey && groups[r.vibesKey]) {
        groups[r.vibesKey].push(r);
      }
    });

    const totalCount = restaurantData.length || 1;

    container.innerHTML = VIBES_ORDER.map(key => {
      const label = VIBES_LABELS[key];
      const items = groups[key];
      const pct = Math.round((items.length / totalCount) * 100);
      const dots = Array.from({ length: items.length })
        .map(() => '<span class="nyc-cluster-dot"></span>').join('');
      return `
        <div class="nyc-cluster-col nyc-cluster-col--${key}">
          <div class="nyc-cluster-header nyc-cluster-header--${key}" data-vibes="${key}">
            <span class="nyc-cluster-header-name">${label}</span>
            <span class="nyc-cluster-header-meta">
              <span class="nyc-cluster-header-count">${items.length}</span>
              <span class="nyc-cluster-header-sep">.</span>
              <span class="nyc-cluster-header-pct">${pct}%</span>
              <span class="nyc-cluster-toggle">\u25BC</span>
            </span>
          </div>
          <div class="nyc-cluster-dots nyc-cluster-dots--${key}">${dots}</div>
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

  // ---- Cluster Wave Animation (top to bottom) ----
  const COLUMN_WAVE_DELAY = 0.15; // seconds between columns
  const NAME_STAGGER = 0.06;      // seconds between names within a column
  const NAME_DURATION = 0.28;     // seconds per name animation

  function animateClusterDropIn(groups, onDone) {
    let maxDelay = 0;

    groups.forEach((group, colIndex) => {
      group.style.opacity = '1';
      const items = group.querySelectorAll('.nyc-cluster-item');
      const colDelay = colIndex * COLUMN_WAVE_DELAY;

      // Set initial hidden state — start slightly above, drop down
      items.forEach(item => {
        item.style.opacity = '0';
        item.style.transform = 'translateY(-14px)';
      });

      // Force reflow
      group.offsetHeight;

      // Apply staggered transitions — top-to-bottom, one after the other
      items.forEach((item, j) => {
        const d = colDelay + j * NAME_STAGGER;
        item.style.transition = `opacity ${NAME_DURATION}s ease-out ${d}s, transform ${NAME_DURATION}s cubic-bezier(0.22, 1, 0.36, 1) ${d}s`;
        item.style.opacity = '1';
        item.style.transform = 'translateY(0)';

        const itemEnd = d + NAME_DURATION;
        if (itemEnd > maxDelay) maxDelay = itemEnd;
      });
    });

    // Cleanup after all animations complete
    setTimeout(() => {
      groups.forEach(group => {
        group.style.opacity = '';
        group.querySelectorAll('.nyc-cluster-item').forEach(item => {
          // Kill transition first so clearing values doesn't spawn a new stuck transition
          item.style.transition = 'none';
          item.style.opacity = '';
          item.style.transform = '';
          // Force reflow then drop the transition override so CSS defaults take over
          void item.offsetHeight;
          item.style.transition = '';
        });
      });
      if (onDone) onDone();
    }, maxDelay * 1000 + 50);
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

    // Groups view only supports Name / Rating — if we're entering with
    // Default or Vibes active, fall back to Name asc so a sort button
    // stays highlighted and the data order is well-defined.
    if (sortCol === 'default' || sortCol === 'vibes') {
      sortCol = 'name';
      sortDir = 'asc';
      sortData();
      updateSortButtons();
    }

    // Re-render cluster so it reflects the current sort order
    renderCluster();

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

      // Hide meta and dots rows — they animate in after the category flight
      const metas = clusterView.querySelectorAll('.nyc-cluster-header-meta');
      const dotsRows = clusterView.querySelectorAll('.nyc-cluster-dots');
      metas.forEach(m => {
        m.style.opacity = '0';
        m.style.transform = 'translateX(-16px)';
      });
      dotsRows.forEach(d => {
        d.style.opacity = '0';
        d.style.transform = 'translateX(16px)';
      });

      // Step 3: Create flying labels. FLIP technique — place label at its
      // FINAL size/position, measure, then transform-scale+translate it to
      // the badge start. The animation then runs purely on transform
      // (GPU-composited, no per-frame layout from font-size/padding).
      const flyingLabels = [];

      headers.forEach((header, i) => {
        const key = header.dataset.vibes;
        const startPos = cachedBadgePositions[key];
        const nameEl = header.querySelector('.nyc-cluster-header-name');
        const endRect = (nameEl || header).getBoundingClientRect();

        if (!startPos) {
          header.style.visibility = '';
          return;
        }

        const badgeStyle = VIBES_BADGE_STYLES[key];
        const headerColor = VIBES_HEADER_COLORS[key];
        const delay = i * STAGGER_DELAY;

        const label = document.createElement('div');
        label.className = 'nyc-flying-label';
        label.textContent = (nameEl ? nameEl.textContent : header.textContent).trim();

        // Place at final position with final style (so we can measure it)
        Object.assign(label.style, {
          left: endRect.left + 'px',
          top: endRect.top + 'px',
          transformOrigin: 'top left',
          fontSize: '1.3rem',
          fontWeight: '700',
          fontFamily: 'var(--font-heading)',
          color: headerColor,
          background: 'transparent',
          padding: '0',
          borderRadius: '0',
          opacity: '1',
          transition: 'none'
        });
        document.body.appendChild(label);

        const finalRect = label.getBoundingClientRect();
        const scale = Math.max(0.1, startPos.height / finalRect.height);
        const dx = startPos.x - endRect.left;
        const dy = startPos.y - endRect.top;

        // Snap to badge start state (scaled down, badge-colored)
        Object.assign(label.style, {
          transform: `translate(${dx}px, ${dy}px) scale(${scale})`,
          color: badgeStyle.color,
          backgroundColor: badgeStyle.bg,
          padding: '3px 10px',
          borderRadius: '99px'
        });

        flyingLabels.push({ label, header, key, delay });
      });

      // Force reflow before starting the animation
      void document.body.offsetHeight;

      // Animate — transform drives everything; color/bg/padding/radius fade separately
      flyingLabels.forEach(({ label, key, delay }) => {
        const headerColor = VIBES_HEADER_COLORS[key];
        label.style.transition = [
          `transform ${FLY_DURATION}s ${FLY_EASING} ${delay}s`,
          `background-color ${FLY_DURATION * 0.55}s ease ${delay + FLY_DURATION * 0.3}s`,
          `color ${FLY_DURATION * 0.45}s ease ${delay + FLY_DURATION * 0.35}s`,
          `padding ${FLY_DURATION * 0.5}s ease ${delay + FLY_DURATION * 0.35}s`,
          `border-radius ${FLY_DURATION * 0.45}s ease ${delay + FLY_DURATION * 0.35}s`
        ].join(', ');
        label.style.transform = 'translate(0, 0) scale(1)';
        label.style.color = headerColor;
        label.style.backgroundColor = 'transparent';
        label.style.padding = '0';
        label.style.borderRadius = '0';
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

          // Phase: meta (from left) + dots (from right) fade in per column
          const metaDotsDuration = 400;   // ms
          const metaDotsStagger  = 80;    // ms between columns
          const cols = clusterView.querySelectorAll('.nyc-cluster-col');
          cols.forEach((col, idx) => {
            const delay = idx * metaDotsStagger;
            const meta = col.querySelector('.nyc-cluster-header-meta');
            const dots = col.querySelector('.nyc-cluster-dots');
            if (meta) {
              meta.style.transition = `opacity ${metaDotsDuration}ms ease ${delay}ms, transform ${metaDotsDuration}ms ease ${delay}ms`;
              meta.style.opacity = '1';
              meta.style.transform = 'translateX(0)';
            }
            if (dots) {
              dots.style.transition = `opacity ${metaDotsDuration}ms ease ${delay}ms, transform ${metaDotsDuration}ms ease ${delay}ms`;
              dots.style.opacity = '1';
              dots.style.transform = 'translateX(0)';
            }
          });

          const totalMetaDotsTime = metaDotsDuration + Math.max(0, cols.length - 1) * metaDotsStagger;

          setTimeout(() => {
            // Clean inline styles — kill transition first to avoid a stuck
            // zero-duration transition locking opacity at 0
            const resetEl = (el) => {
              el.style.transition = 'none';
              el.style.transform = '';
              el.style.opacity = '';
              void el.offsetHeight;
              el.style.transition = '';
            };
            metas.forEach(resetEl);
            dotsRows.forEach(resetEl);

            // Now animate restaurant names dropping in
            animateClusterDropIn(clusterItems, () => {
              currentView = 'cluster';
              updateToggleButtons();
              isAnimating = false;
            });
          }, totalMetaDotsTime);

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
    updateSortVisibility();
  }

  // ---- Init ----
  function init() {
    // Fetch slideshow photos from Cloudinary
    var slideshowPromise = fetch('/api/cloudinary/photos?folder=sarthak-website/interests/nyc-food/hero-slide')
      .then(function (res) { return res.json(); })
      .then(function (data) { initSlideshow(data.photos); })
      .catch(function () { showFallbackBackground(); });

    if (window.loadingPromises) {
      window.loadingPromises.push(slideshowPromise);
    }

    // Toggle buttons — apply active class instantly before animation
    document.querySelectorAll('.nyc-toggle-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        // Instantly highlight the clicked button
        document.querySelectorAll('.nyc-toggle-btn').forEach(b => {
          b.classList.toggle('active', b === btn);
        });
        updateSortVisibility();
        switchView(btn.dataset.view);
      });
    });

    // Sort pill buttons
    document.querySelectorAll('.nyc-sort-btn').forEach(btn => {
      btn.addEventListener('click', () => handleSort(btn.dataset.sort));
    });

    var restaurantPromise = fetchRestaurants();
    if (window.loadingPromises) {
      window.loadingPromises.push(restaurantPromise);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
