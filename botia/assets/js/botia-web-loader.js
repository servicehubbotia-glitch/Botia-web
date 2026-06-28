document.addEventListener('DOMContentLoaded', async () => {
  
  // 1. Buscamos el agua (el archivo JSON)
  // Usamos "./i18n/en.json" porque desde el HTML, esa es la ruta correcta
  const jsonPath = './i18n/en.json';

  try {
    const response = await fetch(jsonPath);
    
    // Si no encuentra el agua, mostramos error
    if (!response.ok) {
      console.error('BOTIA: No encontré el archivo JSON en ' + jsonPath);
      return;
    }

    const data = await response.json();

    // 2. Función para leer las claves con puntos (ejemplo: "page.title")
    const getNestedValue = (obj, key) => {
      return key.split('.').reduce((o, k) => (o || {})[k], obj);
    };

    // 3. Vertemos el agua en el vaso (inyectamos los textos)
    document.querySelectorAll('[data-i18n]').forEach(el => {
      const key = el.getAttribute('data-i18n');
      const value = getNestedValue(data, key);
      
      if (value) {
        // Si es una lista (como los enlaces relacionados)
        if (Array.isArray(value)) {
          el.innerHTML = value.map(item => `<span>${item}</span>`).join(' &bull; ');
        } else {
          // Si es texto normal
          el.textContent = value;
        }
      }
    });

  } catch (error) {
    console.error('BOTIA: Error crítico cargando los textos', error);
  }
});
