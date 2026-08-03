// Unified annotation toolbar — Product Polish V1.1.
// Vertical pill: row 1 = five color swatches, row 2 = G / S / ab̶ (left-aligned).
window.LouAnnotationToolbar = {
    CLASS: "annotation-toolbar",

    create(options) {
        const colors = window.LouAnnotationColors;
        const palette = colors && colors.PALETTE ? colors.PALETTE : [];
        const ariaLabel =
            (options && options.ariaLabel) || "Barre d'annotation";
        const colorLabelPrefix =
            (options && options.colorLabelPrefix) || "";
        const onStateChange =
            options && typeof options.onStateChange === "function"
                ? options.onStateChange
                : function () {};

        const root = document.createElement("div");
        root.className = this.CLASS;
        root.setAttribute("role", "toolbar");
        root.setAttribute("aria-label", ariaLabel);
        root.hidden = true;

        root.addEventListener("mousedown", function (event) {
            event.preventDefault();
        });

        const state = {
            colorId: null,
            bold: false,
            underline: false,
            strikethrough: false,
        };

        const swatchRow = document.createElement("div");
        swatchRow.className = "annotation-toolbar-colors";
        swatchRow.setAttribute("role", "group");
        swatchRow.setAttribute("aria-label", "Couleurs");

        const formatRow = document.createElement("div");
        formatRow.className = "annotation-toolbar-formats";
        formatRow.setAttribute("role", "radiogroup");
        formatRow.setAttribute("aria-label", "Style typographique");

        const swatchButtons = [];
        const formatButtons = {};

        function emitChange(detail) {
            onStateChange(Object.assign({}, state), detail || {});
        }

        function syncSwatches() {
            for (let i = 0; i < swatchButtons.length; i += 1) {
                const btn = swatchButtons[i];
                const isActive = btn.dataset.colorId === state.colorId;
                btn.setAttribute("aria-pressed", isActive ? "true" : "false");
                btn.classList.toggle("is-active", isActive);
                if (isActive) {
                    btn.style.color = colors.getById(state.colorId).swatch;
                } else {
                    btn.style.color = "";
                }
            }
        }

        function syncFormats() {
            formatButtons.bold.classList.toggle("is-active", state.bold);
            formatButtons.bold.setAttribute(
                "aria-pressed",
                state.bold ? "true" : "false"
            );
            formatButtons.underline.classList.toggle("is-active", state.underline);
            formatButtons.underline.setAttribute(
                "aria-pressed",
                state.underline ? "true" : "false"
            );
            formatButtons.strikethrough.classList.toggle(
                "is-active",
                state.strikethrough
            );
            formatButtons.strikethrough.setAttribute(
                "aria-pressed",
                state.strikethrough ? "true" : "false"
            );
        }

        function syncAll() {
            syncSwatches();
            syncFormats();
        }

        function setFormatControlsVisible(visible) {
            formatRow.hidden = !visible;
        }

        for (let i = 0; i < palette.length; i += 1) {
            const color = palette[i];
            const button = document.createElement("button");
            button.type = "button";
            button.className = "annotation-toolbar-swatch";
            button.dataset.colorId = color.id;
            button.style.backgroundColor = color.swatch;
            button.setAttribute(
                "aria-label",
                colorLabelPrefix + color.label
            );
            button.setAttribute("aria-pressed", "false");
            button.addEventListener("click", function (event) {
                event.preventDefault();
                event.stopPropagation();
                const prev = state.colorId;
                if (prev === color.id) {
                    state.colorId = null;
                    emitChange({ kind: "color", colorId: null, deselected: true });
                } else {
                    state.colorId = color.id;
                    emitChange({
                        kind: "color",
                        colorId: color.id,
                        deselected: false,
                        previousColorId: prev,
                    });
                }
                syncSwatches();
            });
            swatchRow.appendChild(button);
            swatchButtons.push(button);
        }

        function normalizeFormatFlags() {
            if (!colors || typeof colors.normalizeFormatState !== "function") {
                return;
            }
            const normalized = colors.normalizeFormatState(state);
            state.bold = normalized.bold;
            state.underline = normalized.underline;
            state.strikethrough = normalized.strikethrough;
        }

        function setExclusiveFormat(key) {
            const wasActive = state[key];
            state.bold = false;
            state.underline = false;
            state.strikethrough = false;
            if (!wasActive) {
                state[key] = true;
            }
        }

        function makeFormatButton(key, label, text) {
            const button = document.createElement("button");
            button.type = "button";
            button.className =
                "annotation-toolbar-format annotation-toolbar-format-" + key;
            button.dataset.format = key;
            button.textContent = text;
            button.setAttribute("aria-label", label);
            button.setAttribute("aria-pressed", "false");
            button.addEventListener("click", function (event) {
                event.preventDefault();
                event.stopPropagation();
                setExclusiveFormat(key);
                syncFormats();
                emitChange({ kind: "format", format: key, active: state[key] });
            });
            formatRow.appendChild(button);
            formatButtons[key] = button;
            return button;
        }

        makeFormatButton("bold", "Gras", "G");
        makeFormatButton("underline", "Souligné", "S");
        makeFormatButton("strikethrough", "Barré", "ab\u0336");

        const eraserRow = document.createElement("div");
        eraserRow.className = "annotation-toolbar-actions";
        const eraserButton = document.createElement("button");
        eraserButton.type = "button";
        eraserButton.className = "annotation-toolbar-erase";
        eraserButton.setAttribute("aria-label", "Effacer");
        eraserButton.textContent = "\u232B";
        eraserButton.addEventListener("click", function (event) {
            event.preventDefault();
            event.stopPropagation();
            emitChange({ kind: "erase" });
        });
        eraserRow.appendChild(eraserButton);

        root.appendChild(swatchRow);
        root.appendChild(formatRow);
        root.appendChild(eraserRow);
        document.body.appendChild(root);

        function positionNearRect(rect, preferAbove) {
            if (!rect) {
                return;
            }
            root.hidden = false;
            root.classList.remove("is-closing");
            root.classList.add("is-open");

            const margin = 8;
            const anchorWidth = Math.max(rect.width, 8);
            const anchorHeight = Math.max(rect.height, 8);
            const toolbarRect = root.getBoundingClientRect();
            const toolbarH = toolbarRect.height || 88;
            const toolbarW = toolbarRect.width || 160;
            let top = rect.top + window.scrollY - toolbarH - margin;
            if (!preferAbove || top < window.scrollY + margin) {
                const below = rect.bottom + window.scrollY + margin;
                if (
                    preferAbove &&
                    rect.top - toolbarH - margin >= window.scrollY + margin
                ) {
                    top = rect.top + window.scrollY - toolbarH - margin;
                } else if (
                    below + toolbarH <
                    window.scrollY + window.innerHeight - margin
                ) {
                    top = below;
                } else {
                    top = Math.max(
                        window.scrollY + margin,
                        rect.top + window.scrollY - toolbarH - margin
                    );
                }
            }
            let left = rect.left + window.scrollX;
            left = Math.max(
                margin,
                Math.min(
                    left,
                    window.scrollX + window.innerWidth - toolbarW - margin
                )
            );
            root.style.left = left + "px";
            root.style.top = top + "px";
        }

        function hideImmediate() {
            root.hidden = true;
            root.classList.remove("is-open", "is-closing");
        }

        function hide() {
            if (root.hidden) {
                return;
            }
            root.classList.remove("is-open");
            root.classList.add("is-closing");
            window.setTimeout(function () {
                if (root.classList.contains("is-closing")) {
                    hideImmediate();
                }
            }, 120);
        }

        return {
            element: root,
            showNearRect: function (rect, preferAbove) {
                positionNearRect(rect, preferAbove !== false);
            },
            showNearElement: function (el, preferAbove) {
                if (!el || !el.getBoundingClientRect) {
                    return;
                }
                this.showNearRect(el.getBoundingClientRect(), preferAbove);
            },
            hide: hide,
            hideImmediate: hideImmediate,
            isVisible: function () {
                return !root.hidden;
            },
            setState: function (next) {
                if (!next || typeof next !== "object") {
                    return;
                }
                if ("colorId" in next) {
                    state.colorId =
                        next.colorId && colors.getById(next.colorId)
                            ? String(next.colorId)
                            : null;
                }
                if (
                    "bold" in next ||
                    "underline" in next ||
                    "strikethrough" in next
                ) {
                    if ("bold" in next) {
                        state.bold = !!next.bold;
                    }
                    if ("underline" in next) {
                        state.underline = !!next.underline;
                    }
                    if ("strikethrough" in next) {
                        state.strikethrough = !!next.strikethrough;
                    }
                    normalizeFormatFlags();
                }
                syncAll();
            },
            getState: function () {
                return Object.assign({}, state);
            },
            focusFirst: function () {
                if (swatchButtons[0]) {
                    swatchButtons[0].focus();
                }
            },
            destroy: function () {
                root.remove();
            },
            getSwatchCount: function () {
                return swatchButtons.length;
            },
            getFormatButtonCount: function () {
                return Object.keys(formatButtons).length;
            },
            setFormatControlsVisible: setFormatControlsVisible,
            areFormatControlsVisible: function () {
                return !formatRow.hidden;
            },
        };
    },
};
