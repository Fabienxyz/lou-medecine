/**
 * Lot D7-E — Display Preferences visual application (presentation-only).
 * Applies theme, font size, and reading width via root data attributes — no I/O.
 */
(function (global) {
    const ATTR = {
        theme: "data-dp-theme",
        fontSize: "data-dp-font-size",
        readingWidth: "data-dp-reading-width",
    };

    /**
     * @param {{ theme: string, fontSize: string, readingWidth: string }} preferences
     */
    function applyDisplayPreferences(preferences) {
        if (!preferences || typeof preferences !== "object") {
            return;
        }
        const root = global.document && global.document.documentElement;
        if (!root) {
            return;
        }
        if (preferences.theme) {
            root.setAttribute(ATTR.theme, preferences.theme);
        }
        if (preferences.fontSize) {
            root.setAttribute(ATTR.fontSize, preferences.fontSize);
        }
        if (preferences.readingWidth) {
            root.setAttribute(ATTR.readingWidth, preferences.readingWidth);
        }
    }

    global.LouDisplayPreferencesApply = {
        applyDisplayPreferences,
        ATTR,
    };
})(typeof window !== "undefined" ? window : globalThis);
