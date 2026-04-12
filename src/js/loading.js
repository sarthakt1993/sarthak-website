// ========================================
// LOADING.JS — Two-word loader + page reveal
// ========================================
// Must be the FIRST script loaded on every page.
// Loading screen plays on EVERY page load.
// Page reveal entry animation only on index.html first visit per session.

window.loadingPromises = [];

(function () {
  var hasSeenIntro = sessionStorage.getItem('hasSeenIntro');
  var isHomePage = window.location.pathname === '/' ||
    window.location.pathname.endsWith('index.html') ||
    window.location.pathname.endsWith('/');

  // --------------------------------------------------
  // Pre-hide reveal elements on home page FIRST VISIT ONLY
  // --------------------------------------------------
  if (!hasSeenIntro && isHomePage) {
    var nav = document.getElementById('topnav');
    var heroName = document.getElementById('heroName');
    var heroTagline = document.getElementById('heroTagline');
    var videoArea = document.getElementById('heroVideoArea');

    if (nav) { nav.classList.add('page-hidden', 'reveal-from-top'); }
    if (heroName) { heroName.classList.add('page-hidden', 'reveal-from-right'); }
    if (heroTagline) { heroTagline.classList.add('page-hidden', 'reveal-from-left'); }
    if (videoArea) { videoArea.classList.add('page-hidden', 'reveal-from-bottom'); }
  }

  // --------------------------------------------------
  // TWO-WORD ANIMATION — Random pairs, opposite directions
  // --------------------------------------------------
  var wordPool = ['Traveling', 'Eating', 'Listening', 'Caffeinating'];
  var topEl = document.getElementById('loaderWordTop');
  var bottomEl = document.getElementById('loaderWordBottom');
  var easeIn = 'cubic-bezier(0.25, 0.46, 0.45, 0.94)';

  function shuffle(arr) {
    var a = arr.slice();
    for (var i = a.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var temp = a[i];
      a[i] = a[j];
      a[j] = temp;
    }
    return a;
  }

  function wait(ms) {
    return new Promise(function (r) { setTimeout(r, ms); });
  }

  function setWords(top, bottom) {
    if (topEl) topEl.textContent = top;
    if (bottomEl) bottomEl.textContent = bottom;
  }

  function animateIn() {
    if (topEl) {
      topEl.style.opacity = '0';
      topEl.style.transform = 'translateX(-60px)';
      topEl.style.transition = 'opacity 0.4s ' + easeIn + ', transform 0.4s ' + easeIn;
      void topEl.offsetWidth;
      topEl.style.opacity = '1';
      topEl.style.transform = 'translateX(0)';
    }
    if (bottomEl) {
      bottomEl.style.opacity = '0';
      bottomEl.style.transform = 'translateX(60px)';
      bottomEl.style.transition = 'opacity 0.4s ' + easeIn + ', transform 0.4s ' + easeIn;
      void bottomEl.offsetWidth;
      bottomEl.style.opacity = '1';
      bottomEl.style.transform = 'translateX(0)';
    }
  }

  function animateOut() {
    if (topEl) {
      topEl.style.transition = 'opacity 0.35s ease-in, transform 0.35s ease-in';
      topEl.style.opacity = '0';
      topEl.style.transform = 'translateX(60px)';
    }
    if (bottomEl) {
      bottomEl.style.transition = 'opacity 0.35s ease-in, transform 0.35s ease-in';
      bottomEl.style.opacity = '0';
      bottomEl.style.transform = 'translateX(-60px)';
    }
  }

  // Run the word sequence
  var shuffled = shuffle(wordPool);
  var pairs = [
    [shuffled[0], shuffled[1]],
    [shuffled[2], shuffled[3]]
  ];

  function runWordSequence() {
    var sequence = Promise.resolve();

    for (var loop = 0; loop < 2; loop++) {
      (function () {
        for (var p = 0; p < pairs.length; p++) {
          (function (pair) {
            sequence = sequence.then(function () {
              setWords(pair[0], pair[1]);
              animateIn();
              return wait(400);  // in animation
            }).then(function () {
              return wait(1200); // hold
            }).then(function () {
              animateOut();
              return wait(350);  // out animation
            }).then(function () {
              return wait(150);  // gap
            });
          })(pairs[p]);
        }
      })();
    }

    return sequence;
  }

  runWordSequence();

  // --------------------------------------------------
  // LOADING BAR — size bar track to longest word
  // --------------------------------------------------
  var barTrack = document.getElementById('loaderBarTrack');
  var barFill = document.getElementById('loaderBarFill');

  if (barTrack && topEl) {
    var maxW = 0;
    var origText = topEl.textContent;
    topEl.style.visibility = 'hidden';
    topEl.style.opacity = '1';
    topEl.style.position = 'absolute';
    wordPool.forEach(function (w) {
      topEl.textContent = w;
      var ww = topEl.offsetWidth;
      if (ww > maxW) maxW = ww;
    });
    topEl.textContent = origText;
    topEl.style.visibility = '';
    topEl.style.opacity = '0';
    topEl.style.position = '';
    barTrack.style.width = maxW + 'px';
  }

  // --------------------------------------------------
  // REVEAL HELPERS
  // --------------------------------------------------
  function triggerReveal() {
    var nav = document.getElementById('topnav');
    var heroName = document.getElementById('heroName');
    var heroTagline = document.getElementById('heroTagline');
    var videoArea = document.getElementById('heroVideoArea');

    var ease = 'cubic-bezier(0.16, 1, 0.3, 1)';
    if (nav) {
      nav.style.transition = 'opacity 1.2s ' + ease + ' 0.1s, transform 1.2s ' + ease + ' 0.1s';
    }
    if (heroName) {
      heroName.style.transition = 'opacity 1.4s ' + ease + ' 0.4s, transform 1.4s ' + ease + ' 0.4s';
    }
    if (heroTagline) {
      heroTagline.style.transition = 'opacity 1.4s ' + ease + ' 0.7s, transform 1.4s ' + ease + ' 0.7s';
    }
    if (videoArea) {
      videoArea.style.transition = 'opacity 1.6s ' + ease + ' 0.3s, transform 1.6s ' + ease + ' 0.3s';
    }

    void document.body.offsetWidth;

    [nav, heroName, heroTagline, videoArea].forEach(function (el) {
      if (el) el.classList.add('page-reveal');
    });
  }

  function showContentImmediately() {
    if (!isHomePage) return;

    var targets = [
      document.getElementById('topnav'),
      document.getElementById('heroName'),
      document.getElementById('heroTagline'),
      document.getElementById('heroVideoArea')
    ];
    targets.forEach(function (el) {
      if (el) {
        el.classList.remove('page-hidden', 'reveal-from-top', 'reveal-from-left', 'reveal-from-right', 'reveal-from-bottom');
        el.classList.add('skip-reveal');
      }
    });
  }

  // --------------------------------------------------
  // LOADER DISMISSAL
  // --------------------------------------------------
  var dismissed = false;

  function hideLoader() {
    if (dismissed) return;
    dismissed = true;

    var ls = document.getElementById('loadingScreen');
    if (!ls) return;

    ls.style.transition = 'opacity 0.5s ease';
    ls.style.opacity = '0';
    setTimeout(function () {
      ls.style.display = 'none';
    }, 500);

    if (!hasSeenIntro && isHomePage) {
      triggerReveal();
      sessionStorage.setItem('hasSeenIntro', 'true');
    } else {
      showContentImmediately();
    }
  }

  // Wait for BOTH animation (~8.4s) AND loadingPromises
  var animationComplete = new Promise(function (resolve) {
    setTimeout(resolve, 8400);
  });

  // --------------------------------------------------
  // LOADING BAR — time-driven, holds at 95% until promises resolve
  // --------------------------------------------------
  if (barFill) {
    var barStart = Date.now();
    var barDuration = 8400;
    var allPromisesResolved = false;

    var barInterval = setInterval(function () {
      // Check if all promises have settled
      if (!allPromisesResolved && window.loadingPromises.length > 0) {
        Promise.all(window.loadingPromises.map(function (p) {
          return p.then(function () { return true; }, function () { return true; });
        })).then(function () { allPromisesResolved = true; });
      } else if (window.loadingPromises.length === 0) {
        allPromisesResolved = true;
      }

      var elapsed = Date.now() - barStart;
      var timeProgress = Math.min(elapsed / barDuration, 1);

      // Fill smoothly with time, but cap at 95% until promises are done
      var progress = allPromisesResolved
        ? timeProgress
        : Math.min(timeProgress, 0.95);

      barFill.style.transform = 'translateX(-' + (100 - (progress * 100)) + '%)';
      if (dismissed) clearInterval(barInterval);
    }, 50);
  }

  window.addEventListener('load', function () {
    Promise.all([animationComplete].concat(window.loadingPromises))
      .then(function () { hideLoader(); })
      .catch(function () { hideLoader(); });
  });

  // 10 second absolute safety net
  setTimeout(function () { hideLoader(); }, 10000);
})();
