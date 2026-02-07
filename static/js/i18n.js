/* ── Internationalization (i18n) ── */

var LOCALES = window.LOCALES || {};
var currentLang = localStorage.getItem('lang') ||
    (navigator.language.startsWith('ro') ? 'ro' : 'en');

/**
 * Look up a translation key like "barrier_access" or "weather.0".
 * Returns the value from the current locale, or the fallback string.
 */
function t(key, fallback) {
    var locale = LOCALES[currentLang] || LOCALES['en'] || {};
    var keys = key.split('.');
    var value = locale;
    for (var i = 0; i < keys.length; i++) {
        if (value && typeof value === 'object') {
            value = value[keys[i]];
        } else {
            value = undefined;
            break;
        }
    }
    return value !== undefined ? value : (fallback || key);
}

/**
 * Walk the DOM and replace text for elements with data-i18n / data-i18n-alt.
 */
function applyTranslations() {
    document.querySelectorAll('[data-i18n]').forEach(function(el) {
        var key = el.getAttribute('data-i18n');
        var val = t(key);
        if (typeof val === 'string') {
            el.textContent = val;
        }
    });

    document.querySelectorAll('[data-i18n-alt]').forEach(function(el) {
        el.alt = t(el.getAttribute('data-i18n-alt'));
    });

    // Update the language-switcher button
    var langBtn = document.getElementById('lang-switcher');
    if (langBtn) {
        if (currentLang === 'en') {
            langBtn.innerHTML = '<span class="text-blue-700">EN</span> <span class="opacity-70">🇬🇧</span>';
        } else {
            langBtn.innerHTML = '<span class="text-blue-700">RO</span> <span class="opacity-70">🇷🇴</span>';
        }
    }
}

function switchLanguage() {
    currentLang = currentLang === 'en' ? 'ro' : 'en';
    localStorage.setItem('lang', currentLang);
    applyTranslations();
    window.dispatchEvent(new CustomEvent('languageChanged', { detail: { lang: currentLang } }));
}

// Apply translations on page load
document.addEventListener('DOMContentLoaded', applyTranslations);
