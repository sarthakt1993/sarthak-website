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
     sarthak-website/interests/national-parks/hero-slide */

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
  // Hero Title Fill + Stats Card
  // ========================================
  function updateHeroStats() {
    var visited = parkData.filter(function (p) { return p.visited; }).length;
    var total = parkData.length;
    var pct = total > 0 ? Math.round(visited / total * 100) : 0;
    var fillPct = total > 0 ? (visited / total * 100) : 0;

    // Title fill — transition animates the registered --fill-end custom property
    var fillEl = document.getElementById('npTitleFill');
    if (fillEl) {
      setTimeout(function () {
        fillEl.style.setProperty('--fill-end', (100 - fillPct) + '%');
      }, 600);
    }

    // Stats card
    var visitedEl = document.getElementById('npStatsVisited');
    var dividerEl = document.getElementById('npStatsDivider');
    var labelEl = document.getElementById('npStatsLabel');
    if (visitedEl) visitedEl.textContent = visited;
    if (dividerEl) dividerEl.textContent = '/ ' + total;
    if (labelEl) labelEl.textContent = pct + '% explored';
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
  // Tile Sort Buttons (in control bar)
  // ========================================
  function renderTileSortButtons() {
    var container = document.getElementById('npTileSort');
    if (!container) return;

    var sorts = [
      { key: 'alpha', label: 'A \u2192 Z' },
      { key: 'year', label: 'Year Visited' },
      { key: 'visitors', label: 'Visitors' }
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
          tileSortAsc = s.key === 'alpha' ? true : false;
        }
        container.querySelectorAll('.np-sort-btn').forEach(function (b) {
          b.classList.toggle('sort-active', b.getAttribute('data-sort') === tileSortKey);
        });
        renderTileGrid(true);
      });
      container.appendChild(btn);
    });
  }

  // ========================================
  // Portrait Park Tile
  // ========================================
  function buildParkTile(park) {
    var tile = document.createElement('div');
    tile.className = 'park-tile ' + (park.visited ? 'visited' : 'unvisited');
    if (park.parkPic) {
      tile.style.backgroundImage = 'url(' + park.parkPic + ')';
    }

    // Badge
    var badge = document.createElement('div');
    badge.className = 'park-tile-badge';
    if (park.visited) {
      badge.textContent = park.yearVisited ? ('Visited ' + park.yearVisited) : 'Visited';
    } else {
      badge.textContent = 'Planning';
    }
    tile.appendChild(badge);

    // Gradient overlay
    var gradient = document.createElement('div');
    gradient.className = 'park-tile-gradient';
    tile.appendChild(gradient);

    // Text overlay
    var text = document.createElement('div');
    text.className = 'park-tile-text';

    if (park.location) {
      var loc = document.createElement('div');
      loc.className = 'park-tile-location';
      loc.textContent = park.location;
      text.appendChild(loc);
    }

    var name = document.createElement('div');
    name.className = 'park-tile-name';
    name.textContent = park.name;
    text.appendChild(name);

    tile.appendChild(text);

    // Click handler for visited parks with personal photo
    if (park.visited && park.myPic) {
      tile.addEventListener('click', function () {
        handleTileClick(park, tile);
      });
    }

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
  // 3D Flip Animation (portrait 3:4)
  // ========================================
  function handleTileClick(park, tileEl) {
    var overlay = document.getElementById('npFlipOverlay');
    if (!overlay) return;

    var rect = tileEl.getBoundingClientRect();
    var vw = window.innerWidth;
    var vh = window.innerHeight;

    // Target: centered 3:4 portrait card
    var targetW = Math.min(vw * 0.6, 500);
    var targetH = targetW * (4 / 3);
    if (targetH > vh * 0.85) {
      targetH = vh * 0.85;
      targetW = targetH * (3 / 4);
    }
    var targetX = (vw - targetW) / 2;
    var targetY = (vh - targetH) / 2;

    var clone = document.createElement('div');
    clone.className = 'np-flying-clone';
    clone.style.left = targetX + 'px';
    clone.style.top = targetY + 'px';
    clone.style.width = targetW + 'px';
    clone.style.height = targetH + 'px';

    var scaleX = rect.width / targetW;
    var scaleY = rect.height / targetH;
    var translateX = (rect.left + rect.width / 2) - (targetX + targetW / 2);
    var translateY = (rect.top + rect.height / 2) - (targetY + targetH / 2);
    clone.style.transform = 'translate(' + translateX + 'px, ' + translateY + 'px) scale(' + scaleX + ', ' + scaleY + ')';

    var inner = document.createElement('div');
    inner.className = 'np-flip-inner';

    var front = document.createElement('div');
    front.className = 'np-flip-front';
    if (park.parkPic) {
      front.style.backgroundImage = 'url(' + park.parkPic + ')';
    }

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

    overlay.classList.remove('hidden');

    void clone.offsetHeight;
    clone.style.transition = 'transform 0.5s ease';
    clone.style.transform = 'translate(0, 0) scale(1, 1)';

    setTimeout(function () {
      inner.classList.add('flipped');
    }, 250);

    function closeFlip() {
      overlay.removeEventListener('click', closeFlip);

      inner.classList.remove('flipped');

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

    var label = document.createElement('span');
    label.className = 'np-sort-label';
    label.textContent = 'SORT:';
    sortRow.appendChild(label);

    var sorts = [
      { key: 'alpha', label: 'A \u2192 Z' },
      { key: 'year', label: 'Year Visited' },
      { key: 'visitors', label: 'Visitors' }
    ];

    var currentKey = isVisited ? groupedVisitedSortKey : groupedUnvisitedSortKey;

    sorts.forEach(function (s) {
      var btn = document.createElement('button');
      btn.className = 'np-sort-btn' + (s.key === currentKey ? ' sort-active' : '');
      btn.textContent = s.label;
      btn.setAttribute('data-sort', s.key);

      if (!isVisited && s.key === 'year') {
        btn.classList.add('sort-disabled');
        btn.title = 'Only available for visited parks';
      }

      btn.addEventListener('click', function () {
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

        sortRow.querySelectorAll('.np-sort-btn').forEach(function (b) {
          var bKey = b.getAttribute('data-sort');
          b.classList.toggle('sort-active', bKey === (isVisited ? groupedVisitedSortKey : groupedUnvisitedSortKey));
        });

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

    var unvisitedParks = parkData.filter(function (p) { return !p.visited; });
    var sortedUnvisited = sortParks(unvisitedParks, groupedUnvisitedSortKey, groupedUnvisitedSortAsc);

    if (unvisitedParks.length) {
      var unvisitedSection = document.createElement('div');
      unvisitedSection.className = 'np-grouped-section';

      var unvisitedHeader = document.createElement('h3');
      unvisitedHeader.className = 'np-grouped-header';
      unvisitedHeader.textContent = 'Not Yet (' + unvisitedParks.length + ')';
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
    var sortWrap = document.getElementById('npSortWrap');
    var outgoing = view === 'tiles' ? groupedView : tileView;
    var incoming = view === 'tiles' ? tileView : groupedView;

    if (!outgoing || !incoming) return;

    // Hide/show the top-level sort (tiles only — grouped has its own per-section sorts)
    if (sortWrap) {
      sortWrap.style.visibility = view === 'tiles' ? 'visible' : 'hidden';
    }

    outgoing.classList.add('fading');
    setTimeout(function () {
      outgoing.classList.add('hidden');
      outgoing.classList.remove('fading');

      incoming.classList.remove('hidden');
      incoming.classList.add('fading');

      void incoming.offsetHeight;

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
    var slideshowPromise = fetch('/api/cloudinary/photos?folder=sarthak-website/interests/national-parks/hero-slide')
      .then(function (res) { return res.json(); })
      .then(function (data) { initSlideshow(data.photos); })
      .catch(function () { showFallbackBackground(); });

    if (window.loadingPromises) {
      window.loadingPromises.push(slideshowPromise);
    }

    attachToggle();

    var parksPromise = fetchParks();
    if (window.loadingPromises) {
      window.loadingPromises.push(parksPromise);
    }
  }

  init();
})();
