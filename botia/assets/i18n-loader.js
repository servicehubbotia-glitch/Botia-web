// BOTIA i18n Loader
// Load translations from JSON based on user language preference
// Usage: Add ?lang=es to URL or set localStorage['botia-lang']

async function loadTranslations(ingredientCode, lang) {
    try {
        // Validate language code
        const supportedLangs = ['en', 'es', 'ar', 'fr', 'nl', 'de', 'pt', 'pl'];
        if (!supportedLangs.includes(lang)) {
            lang = 'en'; // Fallback to English
        }

        // Load JSON translations
        const response = await fetch(`./i18n/${lang}.json`);
        if (!response.ok) {
            throw new Error(`Failed to load ${lang}.json`);
        }

        const translations = await response.json();
        const data = translations[ingredientCode];

        if (!data) {
            console.warn(`No translations found for ${ingredientCode} in ${lang}`);
            return false;
        }

        // Fill each element with its translation
        Object.keys(data).forEach(key => {
            const element = document.getElementById(key);
            if (element) {
                // Handle different element types
                if (element.tagName === 'A') {
                    element.href = data[key]; // For links, set href
                } else if (element.tagName === 'IMG') {
                    element.alt = data[key]; // For images, set alt text
                } else {
                    element.textContent = data[key]; // For all others, set text content
                }
            } else {
                console.warn(`Element with id "${key}" not found in HTML`);
            }
        });

        // Set HTML language attribute
        document.documentElement.lang = lang;

        // Save language preference
        localStorage.setItem('botia-lang', lang);

        return true;

    } catch (error) {
        console.error('Error loading translations:', error);
        return false;
    }
}

// Detect language from URL or localStorage
function detectLanguage() {
    // Priority: URL param > localStorage > browser language > English
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
    if (['en', 'es', 'ar', 'fr', 'nl', 'de', 'pt', 'pl'].includes(browserLang)) {
        return browserLang;
    }

    return 'en'; // Default fallback
}

// Export for use in HTML
window.BOTIA = {
    loadTranslations: loadTranslations,
    detectLanguage: detectLanguage
};
