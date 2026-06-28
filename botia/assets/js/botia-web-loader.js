// Función para leer claves anidadas como "page.title"
function getNestedValue(obj, key) {
  return key.split('.').reduce((o, k) => (o || {})[k], obj);
}

// Función principal de renderizado
function renderBotiaContent(data) {
  const elements = document.querySelectorAll('[data-i18n]');

  elements.forEach(el => {
    const key = el.getAttribute('data-i18n');
    const value = getNestedValue(data, key);

    if (value !== undefined) {
      if (Array.isArray(value)) {
        el.innerHTML = value.map(item => `<span>${item}</span>`).join(' • ');
      } else {
        el.textContent = value;
      }
    } else {
      console.warn(`[BOTIA] Clave no encontrada: ${key}`);
    }
  });
}

// Flujo de carga
async function initBotia() {
  try {
    const lang = new URLSearchParams(window.location.search).get('lang') || 'en';
    const response = await fetch(`./i18n/${lang}.json`);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const data = await response.json();
    renderBotiaContent(data);
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
  } catch (err) {
    console.error('[BOTIA ERROR]', err);
  }
}

document.addEventListener('DOMContentLoaded', initBotia);
