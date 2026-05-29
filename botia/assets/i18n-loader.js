// BOTIA i18n Loader
// Loads translations by product and language.
// Example path: /botia/i18n/halal/es.json

async function loadTranslations(product, ingredientCode, lang) {
    try {
        const supportedLangs = ['en', 'es', 'ar', 'fr', 'nl', 'de', 'pt', 'pl', 'zh'];

        if (!supportedLangs.includes(lang)) {
            lang = 'en';
        }

        const response = await fetch(`/botia/i18n/${product}/${lang}.json`);

        if (!response.ok) {
            throw new Error(`Failed to load /botia/i18n/${product}/${lang}.json`);
        }

        const translations = await response.json();
        const data = translations[ingredientCode];

        if (!data) {
            console.warn(`No translations found for ${ingredientCode} in ${product}/${lang}`);
            return false;
        }

        Object.keys(data).forEach(key => {
            const element = document.getElementById(key);

            if (element) {
                if (element.tagName === 'A') {
                    element.href = data[key];
                } else if (element.tagName === 'IMG') {
                    element.alt = data[key];
                } else {
                    element.textContent = data[key];
                }
            } else {
                console.warn(`Element with id "${key}" not found in HTML`);
            }
        });

        document.documentElement.lang = lang;
        localStorage.setItem('botia-lang', lang);

        return true;

    } catch (error) {
        console.error('BOTIA translation loading error:', error);
        return false;
    }
}

function detectLanguage() {
    const urlParams = new URLSearchParams(window.location.search);
    const langFromUrl = urlParams.get('lang');

    if (langFromUrl) {
        return langFromUrl;
    }

    const langFromStorage = localStorage.getItem('botia-lang');

    if (langFromStorage) {
        return langFromStorage;
    }

    const browserLang = navigator.language.split('-')[0];
    const supportedLangs = ['en', 'es', 'ar', 'fr', 'nl', 'de', 'pt', 'pl', 'zh'];

    if (supportedLangs.includes(browserLang)) {
        return browserLang;
    }

    return 'en';
}

window.BOTIA = {
    loadTranslations: loadTranslations,
    detectLanguage: detectLanguage
};
