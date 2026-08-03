// Official figure lightbox — generic zoom for inline SVG figures (Reader spec §3).
window.LouFigureZoom = {
    _overlay: null,
    _lastFocus: null,

    bind(host) {
        if (!host) {
            return;
        }
        const self = this;
        host.querySelectorAll(".official-visual[data-element]").forEach(function (figure) {
            if (figure.dataset.zoomBound === "true") {
                return;
            }
            if (figure.dataset.inlineFallback === "true") {
                return;
            }
            const svg = figure.querySelector('svg[data-inline-ready="true"]');
            if (!svg) {
                return;
            }
            figure.dataset.zoomBound = "true";
            figure.classList.add("official-visual-zoomable");

            if (!figure.querySelector(".figure-zoom-trigger")) {
                const trigger = document.createElement("button");
                trigger.type = "button";
                trigger.className = "figure-zoom-trigger";
                trigger.setAttribute("aria-label", "Agrandir la figure");
                trigger.textContent = "\u2922";
                trigger.addEventListener("click", function (event) {
                    event.preventDefault();
                    event.stopPropagation();
                    self.open(figure);
                });
                figure.appendChild(trigger);
            }
        });
    },

    open(figure) {
        const svg = figure.querySelector('svg[data-inline-ready="true"]');
        if (!svg || this._overlay) {
            return;
        }
        this._lastFocus = document.activeElement;

        const overlay = document.createElement("div");
        overlay.className = "figure-zoom-overlay";
        overlay.setAttribute("role", "dialog");
        overlay.setAttribute("aria-modal", "true");
        overlay.setAttribute("aria-label", "Figure agrandie");

        const panel = document.createElement("div");
        panel.className = "figure-zoom-panel";

        const closeBtn = document.createElement("button");
        closeBtn.type = "button";
        closeBtn.className = "figure-zoom-close";
        closeBtn.setAttribute("aria-label", "Fermer");
        closeBtn.textContent = "×";

        const stage = document.createElement("div");
        stage.className = "figure-zoom-stage";
        stage.appendChild(svg.cloneNode(true));

        panel.appendChild(closeBtn);
        panel.appendChild(stage);
        overlay.appendChild(panel);
        document.body.appendChild(overlay);
        document.body.classList.add("figure-zoom-open");

        this._overlay = overlay;

        const self = this;
        closeBtn.addEventListener("click", function () {
            self.close();
        });
        overlay.addEventListener("click", function (event) {
            if (event.target === overlay) {
                self.close();
            }
        });
        this._onKeyDown = function (event) {
            if (event.key === "Escape") {
                self.close();
            }
        };
        document.addEventListener("keydown", this._onKeyDown);
        closeBtn.focus();
    },

    close() {
        if (!this._overlay) {
            return;
        }
        this._overlay.remove();
        this._overlay = null;
        document.body.classList.remove("figure-zoom-open");
        if (this._onKeyDown) {
            document.removeEventListener("keydown", this._onKeyDown);
            this._onKeyDown = null;
        }
        if (this._lastFocus && typeof this._lastFocus.focus === "function") {
            this._lastFocus.focus();
        }
    },
};
