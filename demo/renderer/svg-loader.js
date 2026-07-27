// Official SVG loader (Renderer V2.3 M2).
//
// Fetches published manifest-linked figures, sanitizes inbound SVG, and injects inline DOM.
// Fallback to <img> on fetch/parse/sanitize failure. No Learner Layer coupling.
window.LouSvgLoader = {
    ALLOWED_ELEMENTS: new Set([
        "svg",
        "g",
        "text",
        "tspan",
        "rect",
        "line",
        "path",
        "circle",
        "ellipse",
        "polygon",
        "polyline",
        "defs",
        "use",
    ]),

    SVG_NS: "http://www.w3.org/2000/svg",

    _fetch(url) {
        if (typeof window !== "undefined" && window.fetch) {
            return window.fetch(url);
        }
        return fetch(url);
    },

    async loadAllFigures(host, context) {
        const self = this;
        const figures = host.querySelectorAll(".official-visual[data-element]");
        let success = 0;
        let fallback = 0;
        let skipped = 0;

        await Promise.all(
            Array.from(figures).map(function (figure) {
                return self.loadFigure(figure, context).then(function (result) {
                    if (result === "ready") {
                        success += 1;
                    } else if (result === "fallback") {
                        fallback += 1;
                    } else {
                        skipped += 1;
                    }
                });
            })
        );

        return { success: success, fallback: fallback, skipped: skipped };
    },

    async loadFigure(figure, context) {
        if (figure.querySelector('svg[data-inline-ready="true"]')) {
            return "ready";
        }
        if (figure.dataset.inlineFallback === "true") {
            return "fallback";
        }

        const elementId = figure.dataset.element;
        const relPath = (context.projection.visuals || {})[elementId];
        if (!relPath) {
            return "skipped";
        }

        try {
            const url = context.config.resolveAssetPath(context.chapter, relPath);
            const response = await this._fetch(url);
            if (!response || !response.ok) {
                throw new Error("SVG fetch failed");
            }
            const markup = await response.text();
            const svg = this.sanitizeSvgMarkup(markup);
            svg.setAttribute("data-inline", "true");
            svg.setAttribute("data-inline-ready", "true");
            const alt = context.renderer.visualAltText(context.manifest, elementId);
            if (alt) {
                svg.setAttribute("role", "img");
                svg.setAttribute("aria-label", alt);
            }
            this._replaceFigureContent(figure, svg);
            delete figure.dataset.inlineFallback;
            return "ready";
        } catch (err) {
            console.warn(
                "[LouSvgLoader] Inline SVG unavailable; using image fallback.",
                elementId,
                err
            );
            this._applyFallback(figure, context, elementId, relPath);
            return "fallback";
        }
    },

    sanitizeSvgMarkup(markup) {
        const doc = new DOMParser().parseFromString(String(markup), "image/svg+xml");
        const parseError = doc.querySelector("parsererror");
        if (parseError) {
            throw new Error("SVG parse error");
        }
        const root = doc.documentElement;
        if (!root || root.localName !== "svg") {
            throw new Error("SVG root element required");
        }
        this._sanitizeElement(root);
        return document.importNode(root, true);
    },

    _sanitizeElement(node) {
        const children = Array.from(node.childNodes);
        for (let i = 0; i < children.length; i += 1) {
            const child = children[i];
            if (child.nodeType === Node.TEXT_NODE) {
                continue;
            }
            if (child.nodeType !== Node.ELEMENT_NODE) {
                child.remove();
                continue;
            }
            const tag = child.localName.toLowerCase();
            if (!this.ALLOWED_ELEMENTS.has(tag)) {
                child.remove();
                continue;
            }
            this._sanitizeAttributes(child);
            if (child.localName.toLowerCase() === "use") {
                const href =
                    child.getAttribute("href") ||
                    child.getAttribute("xlink:href");
                if (!href || !String(href).trim().startsWith("#")) {
                    child.remove();
                    continue;
                }
            }
            this._sanitizeElement(child);
        }
    },

    _sanitizeAttributes(element) {
        Array.from(element.attributes).forEach(function (attr) {
            const name = attr.name.toLowerCase();
            const value = attr.value;
            if (name.startsWith("on")) {
                element.removeAttribute(attr.name);
                return;
            }
            if (/javascript:/i.test(value)) {
                element.removeAttribute(attr.name);
                return;
            }
            if (
                (name === "href" || name === "xlink:href") &&
                element.localName.toLowerCase() === "use"
            ) {
                if (!String(value).trim().startsWith("#")) {
                    element.removeAttribute(attr.name);
                }
            }
        });
    },

    _replaceFigureContent(figure, node) {
        while (figure.firstChild) {
            figure.removeChild(figure.firstChild);
        }
        figure.appendChild(node);
    },

    _applyFallback(figure, context, elementId, relPath) {
        this._replaceFigureContent(figure, document.createDocumentFragment());
        const img = document.createElement("img");
        img.src = context.config.resolveAssetPath(context.chapter, relPath);
        img.alt = context.renderer.visualAltText(context.manifest, elementId);
        figure.appendChild(img);
        figure.dataset.inlineFallback = "true";
    },
};
