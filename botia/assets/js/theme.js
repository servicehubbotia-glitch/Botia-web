// Shared theme control. The small head bootstrap applies the first theme before paint.
(() => {
  'use strict';
  const root = document.documentElement;
  const key = 'botia-theme';
  const system = window.matchMedia('(prefers-color-scheme: dark)');
  let preference = window.__botiaThemePreference || null;
  const labels = {
    en: ['Switch to dark mode', 'Switch to light mode'],
    es: ['Cambiar a modo oscuro', 'Cambiar a modo claro'],
    ar: ['التبديل إلى الوضع الداكن', 'التبديل إلى الوضع الفاتح'],
    de: ['Zum dunklen Modus wechseln', 'Zum hellen Modus wechseln'],
    fr: ['Passer au mode sombre', 'Passer au mode clair'],
    nl: ['Overschakelen naar donkere modus', 'Overschakelen naar lichte modus'],
    it: ['Passa alla modalità scura', 'Passa alla modalità chiara'],
    pt: ['Mudar para o modo escuro', 'Mudar para o modo claro'],
    pl: ['Przełącz na tryb ciemny', 'Przełącz na tryb jasny'],
    ro: ['Comută la modul întunecat', 'Comută la modul luminos'],
    ru: ['Переключить на тёмную тему', 'Переключить на светлую тему'],
    tr: ['Koyu moda geç', 'Açık moda geç'],
    zh: ['切换到深色模式', '切换到浅色模式'],
    id: ['Beralih ke mode gelap', 'Beralih ke mode terang']
  };
  let button;
  let icon;
  const updateLabel = () => {
    if (!button) return;
    const language = (root.lang || 'en').toLowerCase().split('-')[0];
    const dark = root.dataset.theme === 'dark';
    const label = (labels[language] || labels.en)[dark ? 1 : 0];
    button.setAttribute('aria-label', label);
    button.title = label;
    icon.textContent = dark ? '☀️' : '🌙';
  };
  const applyTheme = () => {
    const theme = preference || (system.matches ? 'dark' : 'light');
    root.dataset.theme = theme;
    root.style.colorScheme = theme;
    updateLabel();
  };
  const initialise = () => {
    if (document.querySelector('.botia-theme-toggle')) return;
    button = document.createElement('button');
    button.type = 'button';
    button.className = 'botia-theme-toggle';
    icon = document.createElement('span');
    icon.setAttribute('aria-hidden', 'true');
    button.append(icon);

    const select = document.getElementById('lang-select');
    if (select) {
      const language = select.closest('.lang-switcher, .lang, .lang-pill') || select.parentElement;
      const controls = document.createElement('div');
      controls.className = 'botia-theme-controls';
      if (getComputedStyle(language).position === 'fixed') {
        controls.classList.add('botia-theme-controls--floating');
      }
      language.before(controls);
      controls.append(button, language);
    } else {
      const header = document.querySelector('.botia-header-bar, header, .brand');
      if (header) {
        header.classList.add('botia-theme-header');
        header.append(button);
      } else {
        const header = document.createElement('header');
        header.className = 'botia-theme-header';
        header.append(button);
        document.body.prepend(header);
      }
    }
    button.addEventListener('click', () => {
      preference = root.dataset.theme === 'dark' ? 'light' : 'dark';
      try { localStorage.setItem(key, preference); } catch (_) { /* Keep the in-page choice. */ }
      applyTheme();
    });
    applyTheme();
    new MutationObserver(updateLabel).observe(root, { attributes: true, attributeFilter: ['lang'] });
  };
  const systemChanged = () => { if (!preference) applyTheme(); };
  if (system.addEventListener) system.addEventListener('change', systemChanged);
  else if (system.addListener) system.addListener(systemChanged);
  window.addEventListener('storage', event => {
    if (event.key !== key && event.key !== null) return;
    preference = event.newValue === 'light' || event.newValue === 'dark' ? event.newValue : null;
    applyTheme();
  });
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', initialise, { once: true });
  else initialise();
})();
