/**
 * Lot D7-E — Display Preferences Reader UI (ephemeral controls only).
 * All persistence goes through Display Preferences Runtime — no patrimony access here.
 */
(function (global) {
    const THEME_OPTIONS = [
        { value: "light", label: "Clair" },
        { value: "dark", label: "Sombre" },
    ];
    const FONT_SIZE_OPTIONS = [
        { value: "small", label: "Petite" },
        { value: "medium", label: "Moyenne" },
        { value: "large", label: "Grande" },
    ];
    const READING_WIDTH_OPTIONS = [
        { value: "narrow", label: "Étroite" },
        { value: "standard", label: "Standard" },
        { value: "wide", label: "Large" },
    ];

    /**
     * @param {{
     *   runtime: {
     *     applyPatch: (patch: object) => Promise<{ preferences: object }>,
     *     resetToDefaults: () => Promise<{ preferences: object }>,
     *     getCurrentPreferences: () => object,
     *   },
     *   root?: HTMLElement,
     * }} options
     */
    function createDisplayPreferencesUI(options) {
        const runtime = options.runtime;
        if (!runtime || typeof runtime.applyPatch !== "function") {
            throw new Error("display preferences UI: runtime with applyPatch is required");
        }

        const root = options.root || document.getElementById("display-preferences-root");
        if (!root) {
            throw new Error("display preferences UI: root element is required");
        }

        /** @type {HTMLSelectElement | null} */
        let themeSelect = null;
        /** @type {HTMLSelectElement | null} */
        let fontSizeSelect = null;
        /** @type {HTMLSelectElement | null} */
        let readingWidthSelect = null;
        /** @type {HTMLButtonElement | null} */
        let resetButton = null;
        let mounted = false;
        let applyingUiSync = false;
        let patchChain = Promise.resolve();

        function enqueuePatch(patch) {
            patchChain = patchChain
                .then(function () {
                    return runtime.applyPatch(patch);
                })
                .catch(function (err) {
                    console.warn("[LouDisplayPreferencesUI] applyPatch failed", err);
                });
            return patchChain;
        }

        function buildSelect(id, labelText, optionsList, field) {
            const wrap = document.createElement("div");
            wrap.className = "display-preferences-field";

            const label = document.createElement("label");
            label.className = "display-preferences-label";
            label.setAttribute("for", id);
            label.textContent = labelText;

            const select = document.createElement("select");
            select.id = id;
            select.className = "display-preferences-select";
            select.name = field;

            for (let i = 0; i < optionsList.length; i += 1) {
                const opt = optionsList[i];
                const option = document.createElement("option");
                option.value = opt.value;
                option.textContent = opt.label;
                select.appendChild(option);
            }

            select.__dpLastEmitted = select.value;

            function emitPreferencePatch() {
                if (applyingUiSync) {
                    return;
                }
                const nextValue = select.value;
                if (nextValue === select.__dpLastEmitted) {
                    return;
                }
                select.__dpLastEmitted = nextValue;
                const patch = {};
                patch[field] = nextValue;
                enqueuePatch(patch);
            }

            select.addEventListener("change", emitPreferencePatch);
            select.addEventListener("input", emitPreferencePatch);
            select.addEventListener("keydown", function (event) {
                if (applyingUiSync) {
                    return;
                }
                if (event.key !== "ArrowUp" && event.key !== "ArrowDown") {
                    return;
                }
                event.preventDefault();
                const delta = event.key === "ArrowDown" ? 1 : -1;
                const nextIndex = Math.min(
                    Math.max(select.selectedIndex + delta, 0),
                    select.options.length - 1
                );
                if (nextIndex === select.selectedIndex) {
                    return;
                }
                select.selectedIndex = nextIndex;
                emitPreferencePatch();
            });

            wrap.appendChild(label);
            wrap.appendChild(select);
            return { wrap: wrap, select: select };
        }

        function syncSelectFromRuntime(select, value) {
            if (!select) {
                return;
            }
            select.value = value;
            select.__dpLastEmitted = value;
        }

        function syncFromRuntime() {
            const prefs = runtime.getCurrentPreferences();
            applyingUiSync = true;
            syncSelectFromRuntime(themeSelect, prefs.theme);
            syncSelectFromRuntime(fontSizeSelect, prefs.fontSize);
            syncSelectFromRuntime(readingWidthSelect, prefs.readingWidth);
            applyingUiSync = false;
        }

        function mount() {
            if (mounted) {
                syncFromRuntime();
                return;
            }
            root.innerHTML = "";

            const panel = document.createElement("section");
            panel.className = "display-preferences-panel";
            panel.setAttribute("aria-label", "Préférences d'affichage");

            const title = document.createElement("h2");
            title.className = "display-preferences-title";
            title.textContent = "Affichage";
            panel.appendChild(title);

            const fields = document.createElement("div");
            fields.className = "display-preferences-fields";

            const themeBuilt = buildSelect(
                "display-preferences-theme",
                "Thème",
                THEME_OPTIONS,
                "theme"
            );
            themeSelect = themeBuilt.select;
            fields.appendChild(themeBuilt.wrap);

            const fontBuilt = buildSelect(
                "display-preferences-font-size",
                "Taille de police",
                FONT_SIZE_OPTIONS,
                "fontSize"
            );
            fontSizeSelect = fontBuilt.select;
            fields.appendChild(fontBuilt.wrap);

            const widthBuilt = buildSelect(
                "display-preferences-reading-width",
                "Largeur de lecture",
                READING_WIDTH_OPTIONS,
                "readingWidth"
            );
            readingWidthSelect = widthBuilt.select;
            fields.appendChild(widthBuilt.wrap);

            panel.appendChild(fields);

            resetButton = document.createElement("button");
            resetButton.type = "button";
            resetButton.className = "display-preferences-reset";
            resetButton.textContent = "Réinitialiser";
            resetButton.addEventListener("click", function () {
                runtime.resetToDefaults().then(function () {
                    syncFromRuntime();
                }).catch(function (err) {
                    console.warn("[LouDisplayPreferencesUI] reset failed", err);
                });
            });
            panel.appendChild(resetButton);

            root.appendChild(panel);
            root.hidden = false;
            mounted = true;
            syncFromRuntime();
        }

        return {
            mount: mount,
            syncFromRuntime: syncFromRuntime,
            whenPatchesIdle: function () {
                return patchChain;
            },
            getRoot: function () {
                return root;
            },
        };
    }

    global.LouDisplayPreferencesUI = {
        create: createDisplayPreferencesUI,
        THEME_OPTIONS: THEME_OPTIONS,
        FONT_SIZE_OPTIONS: FONT_SIZE_OPTIONS,
        READING_WIDTH_OPTIONS: READING_WIDTH_OPTIONS,
    };
})(typeof window !== "undefined" ? window : globalThis);
