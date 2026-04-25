// ========================================
// MUSIC.JS — Immersive Spotify-driven player
// ========================================

(function () {
  const audio          = document.getElementById('musicAudio');
  const discEl         = document.getElementById('musicDisc');
  const discImg        = document.getElementById('musicDiscImg');
  const titleEl        = document.getElementById('musicTrackTitle');
  const artistEl       = document.getElementById('musicTrackArtist');
  const playBtn        = document.getElementById('musicPlay');
  const prevBtn        = document.getElementById('musicPrev');
  const nextBtn        = document.getElementById('musicNext');
  const spotifyLink    = document.getElementById('musicSpotifyLink');
  const playerBg       = document.getElementById('musicPlayerBg');
  const eqLeft         = document.getElementById('musicEqLeft');
  const eqRight        = document.getElementById('musicEqRight');

  let tracks = [];
  let currentIndex = 0;
  let audioCtx = null;
  let analyser = null;
  let sourceNode = null;
  let dataArray = null;
  let rafId = null;

  // ----- Format duration -----
  function formatDuration(ms) {
    if (!ms) return '0:00';
    const total = Math.floor(ms / 1000);
    const m = Math.floor(total / 60);
    const s = total % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  }

  // ----- Dominant color extraction from album art -----
  function extractDominantColor(img) {
    return new Promise(resolve => {
      try {
        const c = document.createElement('canvas');
        const size = 32;
        c.width = size; c.height = size;
        const ctx = c.getContext('2d');
        ctx.drawImage(img, 0, 0, size, size);
        const data = ctx.getImageData(0, 0, size, size).data;
        const buckets = {};
        let bestKey = null, bestCount = 0, bestRgb = [231, 79, 55];
        for (let i = 0; i < data.length; i += 4) {
          const r = data[i], g = data[i + 1], b = data[i + 2], a = data[i + 3];
          if (a < 200) continue;
          const max = Math.max(r, g, b), min = Math.min(r, g, b);
          // skip near-grayscale and near-black pixels — they wash out the accent
          if (max - min < 25) continue;
          if (max < 60) continue;
          const key = `${r >> 5},${g >> 5},${b >> 5}`;
          const entry = buckets[key] || (buckets[key] = { count: 0, r: 0, g: 0, b: 0 });
          entry.count++;
          entry.r += r; entry.g += g; entry.b += b;
          if (entry.count > bestCount) {
            bestCount = entry.count;
            bestKey = key;
            bestRgb = [
              Math.round(entry.r / entry.count),
              Math.round(entry.g / entry.count),
              Math.round(entry.b / entry.count)
            ];
          }
        }
        resolve(bestRgb);
      } catch (err) {
        resolve([231, 79, 55]);
      }
    });
  }

  function applyAccent([r, g, b]) {
    const accent = `rgba(${r}, ${g}, ${b}, 0.45)`;
    playerBg.style.background =
      `radial-gradient(ellipse at 50% 40%, ${accent} 0%, rgba(26, 44, 66, 0) 60%)`;
  }

  // ----- Audio graph (built lazily on first play) -----
  function ensureAudioGraph() {
    if (audioCtx) return;
    try {
      const Ctx = window.AudioContext || window.webkitAudioContext;
      audioCtx = new Ctx();
      sourceNode = audioCtx.createMediaElementSource(audio);
      analyser = audioCtx.createAnalyser();
      analyser.fftSize = 1024;
      analyser.smoothingTimeConstant = 0.85;
      sourceNode.connect(analyser);
      analyser.connect(audioCtx.destination);
      dataArray = new Uint8Array(analyser.frequencyBinCount);
    } catch (err) {
      console.warn('Audio graph init failed:', err);
    }
  }

  // ----- Equalizer rendering -----
  function setupCanvas(canvas) {
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width  = Math.max(1, Math.floor(rect.width * dpr));
    canvas.height = Math.max(1, Math.floor(rect.height * dpr));
    const ctx = canvas.getContext('2d');
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    return { ctx, w: rect.width, h: rect.height };
  }

  function drawEq() {
    const left = setupCanvas(eqLeft);
    const right = setupCanvas(eqRight);
    const playing = !audio.paused;
    if (analyser && playing) analyser.getByteFrequencyData(dataArray);

    // Compute overall audio level from low/mid bands (drives wave amplitude).
    let level = 0;
    if (analyser && playing) {
      const useBins = Math.min(64, dataArray.length);
      let sum = 0;
      for (let i = 0; i < useBins; i++) sum += dataArray[i];
      level = Math.min(1, (sum / useBins) / 180);
    }

    const t = performance.now() / 1000;

    const drawSide = (target, mirror) => {
      const { ctx, w, h } = target;
      ctx.clearRect(0, 0, w, h);
      const mid = h / 2;
      const points = 220;

      ctx.lineWidth = 4;
      ctx.strokeStyle = '#f9dec9';
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.beginPath();

      // When paused, render a straight line at mid; skip the sine math entirely.
      if (!playing) {
        ctx.moveTo(0, mid);
        ctx.lineTo(w, mid);
        ctx.stroke();
        return;
      }

      for (let i = 0; i <= points; i++) {
        const px = i / points; // 0..1 across canvas
        const x = px * w;

        // Envelope: full amplitude at the disc-side edge, taper to 0 at the outer edge.
        const envT = mirror ? px : (1 - px);
        const envelope = Math.pow(envT, 1.4);

        // Multi-frequency sine — looks like a clean responsive waveform.
        const phase = px * Math.PI * (mirror ? 6 : -6);
        const wave =
            Math.sin(phase * 1.0 + t * 1.6) * 0.55
          + Math.sin(phase * 2.1 + t * 2.3) * 0.30
          + Math.sin(phase * 3.7 + t * 3.1) * 0.15;

        // Cap so the wave never reaches the canvas edges, even on loud peaks.
        // wave ∈ [-1, 1], so amp_max stays below mid (h/2) with margin.
        const amp = h * 0.28 * envelope * (0.25 + level * 1.2);
        const cap = h * 0.45;
        let yOff = wave * amp;
        if (yOff > cap)  yOff = cap;
        if (yOff < -cap) yOff = -cap;
        const y = mid + yOff;

        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();
    };

    drawSide(left, false);
    drawSide(right, true);
    rafId = requestAnimationFrame(drawEq);
  }

  // ----- Track loading + playback -----
  function loadTrack(index, autoPlay) {
    if (!tracks.length) return;
    currentIndex = ((index % tracks.length) + tracks.length) % tracks.length;
    const t = tracks[currentIndex];

    titleEl.textContent  = t.name;
    artistEl.textContent = t.artists.join(', ');
    spotifyLink.href     = t.spotifyUrl || '#';

    discImg.classList.remove('is-loaded');
    discImg.onload = async () => {
      discImg.classList.add('is-loaded');
      const rgb = await extractDominantColor(discImg);
      applyAccent(rgb);
    };
    discImg.src = t.albumArt || t.albumArtSmall || '';

    if (t.previewUrl) {
      audio.src = t.previewUrl;
      if (autoPlay) {
        audio.play().catch(() => updatePlayState(false));
      } else {
        audio.load();
      }
    } else {
      audio.removeAttribute('src');
      audio.load();
      updatePlayState(false);
    }

    updateNoPreviewUi(!t.previewUrl);
  }

  function updateNoPreviewUi(noPreview) {
    playBtn.setAttribute('aria-disabled', noPreview ? 'true' : 'false');
    playBtn.disabled = noPreview;
    if (noPreview) {
      artistEl.textContent = `${tracks[currentIndex].artists.join(', ')} · preview unavailable`;
    }
  }

  function updatePlayState(playing) {
    playBtn.classList.toggle('is-playing', playing);
    discEl.classList.toggle('is-playing', playing);
    playBtn.setAttribute('aria-label', playing ? 'Pause' : 'Play');
  }

  function togglePlay() {
    if (!tracks.length || !tracks[currentIndex].previewUrl) return;
    ensureAudioGraph();
    if (audioCtx && audioCtx.state === 'suspended') audioCtx.resume();
    if (audio.paused) {
      audio.play().catch(err => console.warn('Play failed:', err));
    } else {
      audio.pause();
    }
  }

  function findNextWithPreview(start, dir) {
    if (!tracks.length) return start;
    let i = start;
    for (let n = 0; n < tracks.length; n++) {
      i = ((i + dir) % tracks.length + tracks.length) % tracks.length;
      if (tracks[i].previewUrl) return i;
    }
    return start;
  }

  function next() { loadTrack(findNextWithPreview(currentIndex, 1), true); }
  function prev() { loadTrack(findNextWithPreview(currentIndex, -1), true); }

  // ----- Wire up controls -----
  playBtn.addEventListener('click', togglePlay);
  nextBtn.addEventListener('click', next);
  prevBtn.addEventListener('click', prev);

  audio.addEventListener('play',  () => updatePlayState(true));
  audio.addEventListener('pause', () => updatePlayState(false));
  audio.addEventListener('ended', next);

  function shuffle(arr) {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }

  // ----- Fetch playlist + boot -----
  const bootPromise = fetch('/api/spotify/playlist')
    .then(r => r.json())
    .then(data => {
      tracks = shuffle((data.tracks || []).filter(t => t.albumArt));
      if (!tracks.length) {
        titleEl.textContent = 'No tracks available';
        artistEl.textContent = '';
        return;
      }
      const firstPlayable = tracks.findIndex(t => t.previewUrl);
      currentIndex = firstPlayable >= 0 ? firstPlayable : 0;
      loadTrack(currentIndex, false);
      drawEq();
    })
    .catch(err => {
      console.error('Spotify playlist load failed:', err);
      titleEl.textContent = 'Could not load playlist';
      artistEl.textContent = '';
    });

  if (window.loadingPromises) window.loadingPromises.push(bootPromise);

  window.addEventListener('resize', () => {
    // canvas resize handled in drawEq via setupCanvas every frame
  });
})();
