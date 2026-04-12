(function () {
  'use strict';

  // ========================================
  // State
  // ========================================
  var parkData = [];
  var currentView = 'tiles';
  var tileSortKey = 'alpha';   // 'alpha' | 'visitors' | 'year'
  var tileSortAsc = true;

  // Independent sort state for grouped view sections
  var groupedVisitedSortKey = 'alpha';
  var groupedVisitedSortAsc = true;
  var groupedUnvisitedSortKey = 'alpha';
  var groupedUnvisitedSortAsc = true;

  // ========================================
  // Hero Slideshow
  // ========================================

  /* CLOUDINARY SLIDESHOW FOLDER:
     sarthak-website/interests/national-parks/hero-slide
     Upload national park landscape photos
     to this folder in Cloudinary to populate
     the hero slideshow */

  function showFallbackBackground() {
    var hero = document.querySelector('.np-hero');
    if (hero) hero.style.background = 'var(--russet-clay)';
  }

  function initSlideshow(photos) {
    var container = document.getElementById('npSlideshow');
    if (!container) return;
    if (!photos || photos.length === 0) {
      showFallbackBackground();
      return;
    }

    photos.forEach(function (src, i) {
      var slide = document.createElement('div');
      slide.className = 'np-hero-slide' + (i === 0 ? ' active' : '');
      var img = document.createElement('img');
      img.src = src;
      img.alt = '';
      slide.appendChild(img);
      container.appendChild(slide);
    });

    if (photos.length > 1) {
      var current = 0;
      var slides = container.querySelectorAll('.np-hero-slide');
      setInterval(function () {
        slides[current].classList.remove('active');
        current = (current + 1) % slides.length;
        slides[current].classList.add('active');
      }, 4000);
    }
  }

  // ========================================
  // Hero Title Fill + Subtitle Count
  // ========================================
  function updateHeroStats() {
    var visited = parkData.filter(function (p) { return p.visited; }).length;
    var total = parkData.length;
    var pct = total > 0 ? (visited / total * 100) : 0;

    // Title fill effect — animate after fade-in completes
    var fillEl = document.getElementById('npTitleFill');
    if (fillEl) {
      setTimeout(function () {
        fillEl.style.width = pct + '%';
      }, 600);
    }

    // Subtitle visited count
    var countEl = document.getElementById('npHeroCount');
    if (countEl) {
      countEl.textContent = ' \u00B7 ' + visited + ' of ' + total + ' explored';
    }
  }

  // ========================================
  // Sorting helpers
  // ========================================
  function sortParks(arr, key, asc) {
    var sorted = arr.slice();
    sorted.sort(function (a, b) {
      var va, vb;
      if (key === 'alpha') {
        va = (a.name || '').toLowerCase();
        vb = (b.name || '').toLowerCase();
        return asc ? va.localeCompare(vb) : vb.localeCompare(va);
      }
      if (key === 'visitors') {
        va = a.visitors || 0;
        vb = b.visitors || 0;
        return asc ? va - vb : vb - va;
      }
      if (key === 'year') {
        va = a.yearVisited || 0;
        vb = b.yearVisited || 0;
        return asc ? va - vb : vb - va;
      }
      return 0;
    });
    return sorted;
  }

  // ========================================
  // Tile View
  // ========================================
  function renderTileSortButtons() {
    var container = document.getElementById('npTileSort');
    if (!container) return;

    var sorts = [
      { key: 'alpha', label: 'A \u2192 Z' },
      { key: 'visitors', label: 'Most Visited' },
      { key: 'year', label: 'Year Visited' }
    ];

    container.innerHTML = '';
    sorts.forEach(function (s) {
      var btn = document.createElement('button');
      btn.className = 'np-sort-btn' + (s.key === tileSortKey ? ' sort-active' : '');
      btn.textContent = s.label;
      btn.setAttribute('data-sort', s.key);
      btn.addEventListener('click', function () {
        if (tileSortKey === s.key) {
          tileSortAsc = !tileSortAsc;
        } else {
          tileSortKey = s.key;
          // Default directions
          tileSortAsc = s.key === 'alpha' ? true : false;
        }
        // Update active state
        container.querySelectorAll('.np-sort-btn').forEach(function (b) {
          b.classList.toggle('sort-active', b.getAttribute('data-sort') === tileSortKey);
        });
        renderTileGrid(true);
      });
      container.appendChild(btn);
    });
  }

  function buildParkTile(park) {
    var tile = document.createElement('div');
    tile.className = 'park-tile ' + (park.visited ? 'visited' : 'unvisited');

    var imgDiv = document.createElement('div');
    imgDiv.className = 'park-tile-img';
    if (park.parkPic) {
      imgDiv.style.backgroundImage = 'url(' + park.parkPic + ')';
    }

    // Overlay label inside the image
    var label = document.createElement('div');
    label.className = 'park-tile-label';
    var nameSpan = document.createElement('div');
    nameSpan.textContent = park.name;
    label.appendChild(nameSpan);
    if (park.location) {
      var locSpan = document.createElement('div');
      locSpan.className = 'park-tile-location';
      locSpan.textContent = park.location;
      label.appendChild(locSpan);
    }
    imgDiv.appendChild(label);

    // Click handler for visited parks with personal photo
    if (park.visited && park.myPic) {
      imgDiv.addEventListener('click', function () {
        handleTileClick(park, imgDiv);
      });
    }

    tile.appendChild(imgDiv);
    return tile;
  }

  function renderTileGrid(animate) {
    var grid = document.getElementById('npTileGrid');
    if (!grid) return;

    var sorted = sortParks(parkData, tileSortKey, tileSortAsc);
    grid.innerHTML = '';

    sorted.forEach(function (park, i) {
      var tile = buildParkTile(park);
      if (animate) tile.classList.add('tile-entering');

      grid.appendChild(tile);

      // Staggered drop-in animation
      if (animate) {
        (function (el, delay) {
          setTimeout(function () {
            el.classList.remove('tile-entering');
            el.classList.add('tile-entered');
          }, delay);
        })(tile, i * 30);
      }
    });
  }

  // ========================================
  // 3D Flip Animation
  // ========================================
  function handleTileClick(park, tileEl) {
    var overlay = document.getElementById('npFlipOverlay');
    if (!overlay) return;

    var rect = tileEl.getBoundingClientRect();
    var vw = window.innerWidth;
    var vh = window.innerHeight;

    // Target: centered 4:3 landscape card
    var targetW = Math.min(vw * 0.8, 800);
    var targetH = targetW * (3 / 4);
    if (targetH > vh * 0.8) {
      targetH = vh * 0.8;
      targetW = targetH * (4 / 3);
    }
    var targetX = (vw - targetW) / 2;
    var targetY = (vh - targetH) / 2;

    // Create flying clone — positioned at center with target 4:3 size
    // We use transform to start from tile position and animate to center
    var clone = document.createElement('div');
    clone.className = 'np-flying-clone';
    clone.style.left = targetX + 'px';
    clone.style.top = targetY + 'px';
    clone.style.width = targetW + 'px';
    clone.style.height = targetH + 'px';

    // Calculate transform to place clone at tile's current position
    var scaleX = rect.width / targetW;
    var scaleY = rect.height / targetH;
    var translateX = (rect.left + rect.width / 2) - (targetX + targetW / 2);
    var translateY = (rect.top + rect.height / 2) - (targetY + targetH / 2);
    clone.style.transform = 'translate(' + translateX + 'px, ' + translateY + 'px) scale(' + scaleX + ', ' + scaleY + ')';

    // Inner flip container
    var inner = document.createElement('div');
    inner.className = 'np-flip-inner';

    // Front face (park pic)
    var front = document.createElement('div');
    front.className = 'np-flip-front';
    if (park.parkPic) {
      front.style.backgroundImage = 'url(' + park.parkPic + ')';
    }

    // Back face (my pic + text overlay)
    var back = document.createElement('div');
    back.className = 'np-flip-back';
    if (park.myPic) {
      back.style.backgroundImage = 'url(' + park.myPic + ')';
    }

    var backOverlay = document.createElement('div');
    backOverlay.className = 'np-flip-back-overlay';

    var nameEl = document.createElement('div');
    nameEl.className = 'np-flip-back-name';
    nameEl.textContent = park.name;

    var detailsEl = document.createElement('div');
    detailsEl.className = 'np-flip-back-details';
    if (park.yearVisited) {
      detailsEl.textContent = 'Visited ' + park.yearVisited;
    }

    backOverlay.appendChild(nameEl);
    backOverlay.appendChild(detailsEl);
    back.appendChild(backOverlay);

    inner.appendChild(front);
    inner.appendChild(back);
    clone.appendChild(inner);
    document.body.appendChild(clone);

    // Show overlay
    overlay.classList.remove('hidden');

    // Force reflow then animate transform to identity (centered 4:3)
    void clone.offsetHeight;
    clone.style.transition = 'transform 0.5s ease';
    clone.style.transform = 'translate(0, 0) scale(1, 1)';

    // Flip mid-flight (50% of 500ms)
    setTimeout(function () {
      inner.classList.add('flipped');
    }, 250);

    // Close handler
    function closeFlip() {
      overlay.removeEventListener('click', closeFlip);

      // Unflip
      inner.classList.remove('flipped');

      // Fly back to original square position (4:3 → 1:1)
      setTimeout(function () {
        var newRect = tileEl.getBoundingClientRect();
        var sx = newRect.width / targetW;
        var sy = newRect.height / targetH;
        var tx = (newRect.left + newRect.width / 2) - (targetX + targetW / 2);
        var ty = (newRect.top + newRect.height / 2) - (targetY + targetH / 2);
        clone.style.transform = 'translate(' + tx + 'px, ' + ty + 'px) scale(' + sx + ', ' + sy + ')';

        setTimeout(function () {
          overlay.classList.add('hidden');
          if (clone.parentNode) clone.parentNode.removeChild(clone);
        }, 520);
      }, 300);
    }

    // Defer close handler to avoid the opening click triggering close
    setTimeout(function () {
      overlay.addEventListener('click', closeFlip);
    }, 50);
  }

  // ========================================
  // Grouped View
  // ========================================

  function buildGroupedCards(parks, grid) {
    grid.innerHTML = '';
    parks.forEach(function (park) {
      grid.appendChild(buildParkTile(park));
    });
  }

  function buildGroupedSortRow(isVisited) {
    var sortRow = document.createElement('div');
    sortRow.className = 'np-grouped-sort';

    var sorts = [
      { key: 'alpha', label: 'A \u2192 Z' },
      { key: 'visitors', label: 'Most Visited' },
      { key: 'year', label: 'Year Visited' }
    ];

    var currentKey = isVisited ? groupedVisitedSortKey : groupedUnvisitedSortKey;

    sorts.forEach(function (s) {
      var btn = document.createElement('button');
      btn.className = 'np-sort-btn' + (s.key === currentKey ? ' sort-active' : '');
      btn.textContent = s.label;
      btn.setAttribute('data-sort', s.key);

      // Disable Year Visited for unvisited section
      if (!isVisited && s.key === 'year') {
        btn.classList.add('sort-disabled');
        btn.title = 'Only available for visited parks';
      }

      btn.addEventListener('click', function () {
        // Disabled button — do nothing
        if (!isVisited && s.key === 'year') return;

        if (isVisited) {
          if (groupedVisitedSortKey === s.key) {
            groupedVisitedSortAsc = !groupedVisitedSortAsc;
          } else {
            groupedVisitedSortKey = s.key;
            groupedVisitedSortAsc = s.key === 'alpha' ? true : false;
          }
        } else {
          if (groupedUnvisitedSortKey === s.key) {
            groupedUnvisitedSortAsc = !groupedUnvisitedSortAsc;
          } else {
            groupedUnvisitedSortKey = s.key;
            groupedUnvisitedSortAsc = s.key === 'alpha' ? true : false;
          }
        }

        // Update active state on this row's buttons only
        sortRow.querySelectorAll('.np-sort-btn').forEach(function (b) {
          var bKey = b.getAttribute('data-sort');
          b.classList.toggle('sort-active', bKey === (isVisited ? groupedVisitedSortKey : groupedUnvisitedSortKey));
        });

        // Re-render only this section's grid
        var sectionEl = sortRow.closest('.np-grouped-section');
        var grid = sectionEl.querySelector('.np-grouped-grid');
        var parks = isVisited
          ? parkData.filter(function (p) { return p.visited; })
          : parkData.filter(function (p) { return !p.visited; });
        var key = isVisited ? groupedVisitedSortKey : groupedUnvisitedSortKey;
        var asc = isVisited ? groupedVisitedSortAsc : groupedUnvisitedSortAsc;
        var sorted = sortParks(parks, key, asc);
        buildGroupedCards(sorted, grid);
      });

      sortRow.appendChild(btn);
    });

    return sortRow;
  }

  function renderGroupedView() {
    var container = document.getElementById('npGroupedView');
    if (!container) return;

    container.innerHTML = '';

    // --- Visited section ---
    var visitedParks = parkData.filter(function (p) { return p.visited; });
    var sortedVisited = sortParks(visitedParks, groupedVisitedSortKey, groupedVisitedSortAsc);

    if (visitedParks.length) {
      var visitedSection = document.createElement('div');
      visitedSection.className = 'np-grouped-section';

      var visitedHeader = document.createElement('h3');
      visitedHeader.className = 'np-grouped-header';
      visitedHeader.textContent = 'Visited (' + visitedParks.length + ')';
      visitedSection.appendChild(visitedHeader);

      visitedSection.appendChild(buildGroupedSortRow(true));

      var visitedGrid = document.createElement('div');
      visitedGrid.className = 'np-grouped-grid';
      buildGroupedCards(sortedVisited, visitedGrid);
      visitedSection.appendChild(visitedGrid);

      container.appendChild(visitedSection);
    }

    // --- Not Yet Visited section ---
    var unvisitedParks = parkData.filter(function (p) { return !p.visited; });
    var sortedUnvisited = sortParks(unvisitedParks, groupedUnvisitedSortKey, groupedUnvisitedSortAsc);

    if (unvisitedParks.length) {
      var unvisitedSection = document.createElement('div');
      unvisitedSection.className = 'np-grouped-section';

      var unvisitedHeader = document.createElement('h3');
      unvisitedHeader.className = 'np-grouped-header';
      unvisitedHeader.textContent = 'Yet to visit (' + unvisitedParks.length + ')';
      unvisitedSection.appendChild(unvisitedHeader);

      unvisitedSection.appendChild(buildGroupedSortRow(false));

      var unvisitedGrid = document.createElement('div');
      unvisitedGrid.className = 'np-grouped-grid';
      buildGroupedCards(sortedUnvisited, unvisitedGrid);
      unvisitedSection.appendChild(unvisitedGrid);

      container.appendChild(unvisitedSection);
    }
  }

  // ========================================
  // View Switching
  // ========================================
  function switchView(view) {
    if (view === currentView) return;
    currentView = view;

    var tileView = document.getElementById('npTileView');
    var groupedView = document.getElementById('npGroupedView');
    var outgoing = view === 'tiles' ? groupedView : tileView;
    var incoming = view === 'tiles' ? tileView : groupedView;

    if (!outgoing || !incoming) return;

    // Fade out
    outgoing.classList.add('fading');
    setTimeout(function () {
      outgoing.classList.add('hidden');
      outgoing.classList.remove('fading');

      incoming.classList.remove('hidden');
      incoming.classList.add('fading');

      // Force reflow
      void incoming.offsetHeight;

      // Fade in
      incoming.classList.remove('fading');
    }, 250);
  }

  // ========================================
  // Fetch Parks Data
  // ========================================
  function fetchParks() {
    var loading = document.getElementById('npLoading');
    var error = document.getElementById('npError');
    var views = document.getElementById('npViews');

    return fetch('/api/national-parks')
      .then(function (res) {
        if (!res.ok) throw new Error('HTTP ' + res.status);
        return res.json();
      })
      .then(function (data) {
        parkData = data;

        if (loading) loading.classList.add('hidden');
        if (views) views.classList.remove('hidden');

        updateHeroStats();
        renderTileSortButtons();
        renderTileGrid(true);
        renderGroupedView();
      })
      .catch(function (err) {
        console.error('Failed to fetch parks:', err);
        if (loading) loading.classList.add('hidden');
        if (error) error.classList.remove('hidden');
      });
  }

  // ========================================
  // Toggle Buttons
  // ========================================
  function attachToggle() {
    var buttons = document.querySelectorAll('.np-toggle-btn');
    buttons.forEach(function (btn) {
      btn.addEventListener('click', function () {
        // Instant highlight
        buttons.forEach(function (b) {
          b.classList.toggle('active', b === btn);
        });
        switchView(btn.getAttribute('data-view'));
      });
    });
  }

  // ========================================
  // Init
  // ========================================
  function init() {
    // Slideshow from Cloudinary
    var slideshowPromise = fetch('/api/cloudinary/photos?folder=sarthak-website/interests/national-parks/hero-slide')
      .then(function (res) { return res.json(); })
      .then(function (data) { initSlideshow(data.photos); })
      .catch(function () { showFallbackBackground(); });

    if (window.loadingPromises) {
      window.loadingPromises.push(slideshowPromise);
    }

    attachToggle();

    // Parks data fetch
    var parksPromise = fetchParks();
    if (window.loadingPromises) {
      window.loadingPromises.push(parksPromise);
    }
  }

  init();
})();
