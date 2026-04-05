// ========================================
// LOADING.JS — Loading screen overlay logic
// ========================================
// Dismisses the loading screen once all assets (images, video, fonts) are loaded.

window.addEventListener('load', function() {
  var ls = document.getElementById('loadingScreen');
  if (ls) {
    ls.classList.add('hidden');
    setTimeout(function() { ls.style.display = 'none'; }, 500);
  }
});
