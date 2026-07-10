// BOTIA Drawer Menu
(function() {
  const DRAWER_HTML = `
<div class="botia-overlay" id="botiaOverlay"></div>
<aside class="botia-drawer" id="botiaDrawer">
  <div class="drawer-header">
    <a href="/" class="drawer-brand">BOTIA</a>
    <button class="drawer-close" id="drawerClose">✕</button>
  </div>
  <nav class="drawer-nav">
    <a href="/" class="drawer-link">Home</a>
    <div class="drawer-divider"></div>

    <div class="drawer-section-label">Choices</div>
    <a href="/pages/muslim.html" class="drawer-link">Muslim Choice</a>
    <a href="/pages/animal.html" class="drawer-link">Animal Origin</a>
    <div class="drawer-divider"></div>

    <div class="drawer-section-label">Risks</div>
    <div class="drawer-group-header" onclick="toggleDrawerSub('risks')">
      <span>Evidence</span>
      <span class="drawer-arrow" id="arrow-risks">›</span>
    </div>
    <div class="drawer-submenu" id="sub-risks">
      <a href="/pages/sugar.html">Sugar</a>
      <a href="/pages/sweetener.html">Sweeteners</a>
      <a href="/pages/flavor.html">Flavourings</a>
      <a href="/pages/texture.html">Texture</a>
      <a href="/pages/enumbers.html">E-numbers</a>
    </div>
    <div class="drawer-divider"></div>

    <div class="drawer-section-label">Health</div>
    <div class="drawer-group-header" onclick="toggleDrawerSub('woman')">
      <span>Woman</span>
      <span class="drawer-arrow" id="arrow-woman">›</span>
    </div>
    <div class="drawer-submenu" id="sub-woman">
      <a href="/pages/woman.html">Woman (general)</a>
      <a href="/ingredients/endocrine-disruptors.html">Endocrine Disruptors</a>
      <a href="/ingredients/packaging-migrants.html">Packaging Migrants</a>
      <a href="/ingredients/fat-accumulation.html">Fat-Soluble Accumulation</a>
    </div>
    <div class="drawer-group-header" onclick="toggleDrawerSub('muslim')">
      <span>Muslim Choice</span>
      <span class="drawer-arrow" id="arrow-muslim">›</span>
    </div>
    <div class="drawer-submenu" id="sub-muslim">
      <a href="/pages/muslim.html">Muslim (general)</a>
      <a href="/ingredients/halal.html">Halal</a>
      <a href="/ingredients/haram.html">Haram</a>
      <a href="/ingredients/mashbooh.html">Mashbooh</a>
    </div>
    <div class="drawer-divider"></div>

    <a href="/ingredients/index.html" class="drawer-link">Ingredient Index</a>
    <a href="/privacy.html" class="drawer-link">Privacy Policy</a>
  </nav>
</aside>`;

  document.addEventListener('DOMContentLoaded', function() {
    document.body.insertAdjacentHTML('afterbegin', DRAWER_HTML);

    document.getElementById('botiaOverlay').addEventListener('click', closeDrawer);
    document.getElementById('drawerClose').addEventListener('click', closeDrawer);

    const btn = document.getElementById('drawerBtn') || document.querySelector('.hamburger-btn');
    if (btn) btn.addEventListener('click', openDrawer);
  });

  function openDrawer() {
    document.getElementById('botiaDrawer').classList.add('active');
    document.getElementById('botiaOverlay').classList.add('active');
    document.body.style.overflow = 'hidden';
  }

  function closeDrawer() {
    document.getElementById('botiaDrawer').classList.remove('active');
    document.getElementById('botiaOverlay').classList.remove('active');
    document.body.style.overflow = '';
  }

  window.toggleDrawerSub = function(id) {
    const sub = document.getElementById('sub-' + id);
    const arrow = document.getElementById('arrow-' + id);
    if (sub) sub.classList.toggle('open');
    if (arrow) arrow.classList.toggle('open');
  };

  window.openDrawer = openDrawer;
  window.closeDrawer = closeDrawer;
})();
