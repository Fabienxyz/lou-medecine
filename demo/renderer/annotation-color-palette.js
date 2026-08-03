// Shared annotation color palette UI (Product Polish V1).
window.LouAnnotationColorPalette = {
    CLASS: "annotation-color-palette",

    create(options) {
        const colors = window.LouAnnotationColors;
        const palette = colors && colors.PALETTE ? colors.PALETTE : [];
        const selectedId =
            options && options.selectedColorId
                ? options.selectedColorId
                : colors
                  ? colors.DEFAULT_HIGHLIGHT_ID
                  : "yellow";
        const onSelect =
            options && typeof options.onSelect === "function"
                ? options.onSelect
                : function () {};
        const ariaLabel =
            (options && options.ariaLabel) || "Couleurs d'annotation";

        const root = document.createElement("div");
        root.className = this.CLASS;
        root.setAttribute("role", "toolbar");
        root.setAttribute("aria-label", ariaLabel);
        root.hidden = true;

        const swatches = document.createElement("div");
        swatches.className = "annotation-color-palette-swatches";
        swatches.setAttribute("role", "group");

        let activeId = selectedId;
        const buttons = [];

        function setActive(nextId) {
            activeId = nextId;
            for (let i = 0; i < buttons.length; i += 1) {
                const btn = buttons[i];
                const isActive = btn.dataset.colorId === nextId;
                btn.setAttribute("aria-pressed", isActive ? "true" : "false");
                btn.classList.toggle("is-active", isActive);
            }
        }

        for (let i = 0; i < palette.length; i += 1) {
            const color = palette[i];
            const button = document.createElement("button");
            button.type = "button";
            button.className = "annotation-color-palette-swatch";
            button.dataset.colorId = color.id;
            button.style.backgroundColor = color.swatch;
            button.setAttribute(
                "aria-label",
                (options && options.colorLabelPrefix
                    ? options.colorLabelPrefix
                    : "") + color.label
            );
            button.setAttribute("aria-pressed", color.id === selectedId ? "true" : "false");
            if (color.id === selectedId) {
                button.classList.add("is-active");
            }
            button.addEventListener("click", function (event) {
                event.preventDefault();
                event.stopPropagation();
                setActive(color.id);
                onSelect(color.id);
            });
            swatches.appendChild(button);
            buttons.push(button);
        }

        root.appendChild(swatches);
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
            const paletteRect = root.getBoundingClientRect();
            const paletteH = paletteRect.height || 44;
            const paletteW = paletteRect.width || 200;
            let top = rect.top + window.scrollY - paletteH - margin;
            if (!preferAbove || top < window.scrollY + margin) {
                const below = rect.bottom + window.scrollY + margin;
                if (
                    preferAbove &&
                    rect.top - paletteH - margin >= window.scrollY + margin
                ) {
                    top = rect.top + window.scrollY - paletteH - margin;
                } else if (
                    below + paletteH <
                    window.scrollY + window.innerHeight - margin
                ) {
                    top = below;
                } else {
                    top = Math.max(
                        window.scrollY + margin,
                        rect.top + window.scrollY - paletteH - margin
                    );
                }
            }
            let left =
                rect.left + window.scrollX + anchorWidth / 2 - paletteW / 2;
            left = Math.max(
                margin,
                Math.min(left, window.scrollX + window.innerWidth - paletteW - margin)
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
                setActive(activeId);
                positionNearRect(rect, preferAbove !== false);
                if (buttons[0]) {
                    buttons[0].focus();
                }
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
            setSelectedColorId: function (nextId) {
                setActive(nextId);
            },
            focusFirst: function () {
                if (buttons[0]) {
                    buttons[0].focus();
                }
            },
            destroy: function () {
                root.remove();
            },
            getSwatchCount: function () {
                return buttons.length;
            },
        };
    },
};
