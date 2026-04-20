// ========================================
// LIGHTBOX.JS — Fullscreen photo viewer
// Reads images from #collageGrid, opens on click, supports
// keyboard nav, touch swipe, and a thumbnail strip.
// ========================================

(function () {
  const COLLAGE_SELECTOR = '#collageGrid';

  const state = {
    images: [],
    index: 0,
    isOpen: false,
    touchStartX: 0,
    touchStartY: 0
  };

  const els = {};

  // Build the overlay once and wire up its controls
  function buildLightbox() {
    const overlay = document.createElement('div');
    overlay.className = 'lightbox';
    overlay.id = 'lightbox';
    overlay.setAttribute('aria-hidden', 'true');
    overlay.setAttribute('role', 'dialog');
    overlay.innerHTML = `
      <button class="lightbox-close" aria-label="Close">×</button>
      <button class="lightbox-nav lightbox-prev" aria-label="Previous photo">‹</button>
      <button class="lightbox-nav lightbox-next" aria-label="Next photo">›</button>
      <div class="lightbox-stage">
        <img class="lightbox-img lightbox-img--a" alt="" />
        <img class="lightbox-img lightbox-img--b" alt="" />
      </div>
      <div class="lightbox-thumbs" id="lightboxThumbs"></div>
    `;
    document.body.appendChild(overlay);

    els.overlay = overlay;
    els.close = overlay.querySelector('.lightbox-close');
    els.prev = overlay.querySelector('.lightbox-prev');
    els.next = overlay.querySelector('.lightbox-next');
    els.stage = overlay.querySelector('.lightbox-stage');
    els.imgA = overlay.querySelector('.lightbox-img--a');
    els.imgB = overlay.querySelector('.lightbox-img--b');
    els.thumbs = overlay.querySelector('.lightbox-thumbs');
    els.activeImg = els.imgA;
    els.inactiveImg = els.imgB;

    els.close.addEventListener('click', close);
    els.prev.addEventListener('click', (e) => { e.stopPropagation(); prev(); });
    els.next.addEventListener('click', (e) => { e.stopPropagation(); next(); });

    // Clicking the dark backdrop (overlay or stage padding) closes the lightbox
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay || e.target === els.stage) close();
    });

    // Swipe support for mobile
    overlay.addEventListener('touchstart', (e) => {
      state.touchStartX = e.touches[0].clientX;
      state.touchStartY = e.touches[0].clientY;
    }, { passive: true });

    overlay.addEventListener('touchend', (e) => {
      const dx = e.changedTouches[0].clientX - state.touchStartX;
      const dy = e.changedTouches[0].clientY - state.touchStartY;
      if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy)) {
        if (dx < 0) next(); else prev();
      }
    });

    // Scroll/wheel on the main image advances photos; scroll over the
    // thumbnail strip scrolls the strip natively. Throttle so one trackpad
    // gesture advances exactly one image.
    state.wheelCooldown = 0;
    overlay.addEventListener('wheel', (e) => {
      // Let the thumbnail strip scroll normally when the pointer is over it
      if (e.target.closest('.lightbox-thumbs')) return;
      e.preventDefault();
      const now = Date.now();
      if (now - state.wheelCooldown < 450) return;
      const delta = Math.abs(e.deltaY) > Math.abs(e.deltaX) ? e.deltaY : e.deltaX;
      if (Math.abs(delta) < 4) return;
      state.wheelCooldown = now;
      if (delta > 0) next(); else prev();
    }, { passive: false });
  }

  function open(imgList, index) {
    if (!imgList.length) return;
    state.images = imgList;
    state.index = index;
    state.isOpen = true;
    document.body.classList.add('lightbox-open');
    els.overlay.classList.add('is-open');
    els.overlay.setAttribute('aria-hidden', 'false');
    renderThumbs();
    showImage(index, false);
  }

  function close() {
    state.isOpen = false;
    document.body.classList.remove('lightbox-open');
    els.overlay.classList.remove('is-open');
    els.overlay.setAttribute('aria-hidden', 'true');
  }

  function next() {
    const n = state.images.length;
    if (n < 2) return;
    state.index = (state.index + 1) % n;
    showImage(state.index, true);
  }

  function prev() {
    const n = state.images.length;
    if (n < 2) return;
    state.index = (state.index - 1 + n) % n;
    showImage(state.index, true);
  }

  // Crossfade by loading the new url into the "inactive" <img> and
  // swapping visibility once it's decoded
  function showImage(i, crossfade) {
    const url = state.images[i];
    const incoming = els.inactiveImg;
    const outgoing = els.activeImg;
    incoming.src = url;

    const reveal = () => {
      incoming.classList.add('is-visible');
      outgoing.classList.remove('is-visible');
    };

    if (!crossfade || incoming.complete) {
      reveal();
    } else {
      incoming.onload = reveal;
    }

    els.activeImg = incoming;
    els.inactiveImg = outgoing;
    updateThumbsActive();
  }

  function renderThumbs() {
    els.thumbs.innerHTML = '';
    state.images.forEach((url, i) => {
      const btn = document.createElement('button');
      btn.className = 'lightbox-thumb' + (i === state.index ? ' is-active' : '');
      btn.setAttribute('aria-label', 'Go to photo ' + (i + 1));
      const img = document.createElement('img');
      img.src = url;
      img.alt = '';
      img.loading = 'lazy';
      btn.appendChild(img);
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        state.index = i;
        showImage(i, true);
      });
      els.thumbs.appendChild(btn);
    });
  }

  function updateThumbsActive() {
    const thumbs = els.thumbs.querySelectorAll('.lightbox-thumb');
    thumbs.forEach((t, i) => {
      const isActive = i === state.index;
      t.classList.toggle('is-active', isActive);
      if (isActive) {
        t.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
      }
    });
  }

  // Event delegation on the collage grid — works even after photos
  // are re-rendered (e.g. when switching year)
  function bindCollage() {
    const container = document.querySelector(COLLAGE_SELECTOR);
    if (!container) return;
    container.addEventListener('click', (e) => {
      // Target might be the img, the .collage-item wrapper, or its ::after overlay
      const item = e.target.closest('.collage-item');
      const img = (item && item.querySelector('img')) || e.target.closest('img');
      if (!img || !container.contains(img)) return;
      const all = Array.from(container.querySelectorAll('img'));
      const idx = all.indexOf(img);
      if (idx === -1) return;
      open(all.map((el) => el.currentSrc || el.src), idx);
    });
  }

  document.addEventListener('keydown', (e) => {
    if (!state.isOpen) return;
    if (e.key === 'Escape') close();
    else if (e.key === 'ArrowLeft') prev();
    else if (e.key === 'ArrowRight') next();
  });

  function init() {
    buildLightbox();
    bindCollage();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
