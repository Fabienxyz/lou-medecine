// Inline formatting on official SVG text (Renderer V2.3).
//
// M3: SVG Text Stream, selection, toolbar intent only — no store writes, no overlays.
window.LouInlineFormatting = {
    TOOLBAR_CLASS: "svg-format-toolbar",
    CONTEXT_CHARS: 32,

    _toolbar: null,
    _boundHost: null,
    _bindContext: null,
    _selectionContext: null,
    _lastFormatIntent: null,
    _onDocumentMouseDown: null,
    _onDocumentKeyDown: null,

    async mount(host, context) {
        this._lastFormatIntent = null;
        this.bindSelection(host, context);
    },

    bindSelection(host, context) {
        const self = this;
        this._bindContext = context;
        if (this._boundHost === host) {
            return;
        }
        this._boundHost = host;
        this.dismissToolbar();

        host.addEventListener("mouseup", function (event) {
            if (event.target.closest("." + self.TOOLBAR_CLASS)) {
                return;
            }
            window.requestAnimationFrame(function () {
                self._onSelectionChange(host, self._bindContext);
            });
        });

        if (!this._onDocumentKeyDown) {
            this._onDocumentKeyDown = function (event) {
                if (event.key === "Escape") {
                    self.dismissToolbar();
                }
            };
            document.addEventListener("keydown", this._onDocumentKeyDown);
        }

        if (!this._onDocumentMouseDown) {
            this._onDocumentMouseDown = function (event) {
                if (!self._toolbar || self._toolbar.contains(event.target)) {
                    return;
                }
                self.dismissToolbar();
            };
            document.addEventListener("mousedown", this._onDocumentMouseDown);
        }
    },

    normalizeStreamText(value) {
        return String(value)
            .replace(/[\t\n\r ]+/g, " ")
            .trim();
    },

    buildSvgTextStream(svgRoot) {
        if (
            !svgRoot ||
            svgRoot.localName !== "svg" ||
            svgRoot.getAttribute("data-inline") !== "true" ||
            svgRoot.getAttribute("data-inline-ready") !== "true"
        ) {
            return null;
        }

        const nodeOffsets = new WeakMap();
        let stream = "";

        const walker = document.createTreeWalker(
            svgRoot,
            NodeFilter.SHOW_TEXT,
            {
                acceptNode: function (node) {
                    return window.LouInlineFormatting._isEligibleStreamTextNode(node)
                        ? NodeFilter.FILTER_ACCEPT
                        : NodeFilter.FILTER_REJECT;
                },
            }
        );

        let textNode = walker.nextNode();
        while (textNode) {
            const content = textNode.textContent;
            nodeOffsets.set(textNode, {
                start: stream.length,
                end: stream.length + content.length,
            });
            stream += content;
            textNode = walker.nextNode();
        }

        return {
            svgRoot: svgRoot,
            stream: stream,
            length: stream.length,
            nodeOffsets: nodeOffsets,
        };
    },

    _isInsideTextPath(element) {
        let el = element;
        while (el) {
            if (el.localName && el.localName.toLowerCase() === "textpath") {
                return true;
            }
            el = el.parentElement;
        }
        return false;
    },

    _isEligibleStreamTextNode(textNode) {
        if (!textNode || textNode.nodeType !== Node.TEXT_NODE) {
            return false;
        }
        const parent = textNode.parentElement;
        if (!parent) {
            return false;
        }
        const tag = parent.localName.toLowerCase();
        if (tag !== "text" && tag !== "tspan") {
            return false;
        }
        if (!parent.getAttribute("data-official-text-id")) {
            return false;
        }
        if (parent.closest("[data-learner='true']")) {
            return false;
        }
        if (this._isInsideTextPath(parent)) {
            return false;
        }
        const svg = parent.closest('svg[data-inline="true"][data-inline-ready="true"]');
        return !!svg;
    },

    streamPositionFromPoint(streamData, node, offsetInNode) {
        if (!streamData || !node) {
            return null;
        }
        if (node.nodeType !== Node.TEXT_NODE) {
            return null;
        }
        const bounds = streamData.nodeOffsets.get(node);
        if (!bounds) {
            return null;
        }
        const offset = Number(offsetInNode);
        if (!Number.isFinite(offset) || offset < 0 || offset > bounds.end - bounds.start) {
            return null;
        }
        return bounds.start + offset;
    },

    streamPointFromPosition(streamData, position) {
        if (!streamData) {
            return null;
        }
        const pos = Number(position);
        if (!Number.isFinite(pos) || pos < 0 || pos > streamData.length) {
            return null;
        }
        if (pos === streamData.length) {
            if (streamData.length === 0) {
                return null;
            }
            const walker = document.createTreeWalker(
                streamData.svgRoot,
                NodeFilter.SHOW_TEXT,
                {
                    acceptNode: function (node) {
                        return window.LouInlineFormatting._isEligibleStreamTextNode(node)
                            ? NodeFilter.FILTER_ACCEPT
                            : NodeFilter.FILTER_REJECT;
                    },
                }
            );
            let last = null;
            let current = walker.nextNode();
            while (current) {
                last = current;
                current = walker.nextNode();
            }
            if (!last) {
                return null;
            }
            const bounds = streamData.nodeOffsets.get(last);
            return { node: last, offset: bounds.end - bounds.start };
        }

        const walker = document.createTreeWalker(
            streamData.svgRoot,
            NodeFilter.SHOW_TEXT,
            {
                acceptNode: function (node) {
                    return window.LouInlineFormatting._isEligibleStreamTextNode(node)
                        ? NodeFilter.FILTER_ACCEPT
                        : NodeFilter.FILTER_REJECT;
                },
            }
        );
        let current = walker.nextNode();
        while (current) {
            const bounds = streamData.nodeOffsets.get(current);
            if (pos >= bounds.start && pos < bounds.end) {
                return { node: current, offset: pos - bounds.start };
            }
            current = walker.nextNode();
        }
        return null;
    },

    selectionToStreamRange(selection, svgRoot) {
        if (!selection || selection.rangeCount === 0 || selection.isCollapsed) {
            return null;
        }
        const range = selection.getRangeAt(0);
        return this.rangeToStreamRange(range, svgRoot);
    },

    rangeToStreamRange(range, svgRoot) {
        if (!range || range.collapsed || !svgRoot) {
            return null;
        }

        const figure = svgRoot.closest(".official-visual");
        if (!figure || figure.dataset.inlineFallback === "true") {
            return null;
        }
        if (!svgRoot.contains(range.commonAncestorContainer)) {
            return null;
        }

        if (this._rangeIntersectsLearner(range) || this._rangeIntersectsTextPath(range)) {
            return null;
        }
        if (this._rangeSpansMultipleTextRoots(range, svgRoot)) {
            return null;
        }
        if (this._rangeUsesIneligibleText(range, svgRoot)) {
            return null;
        }

        const streamData = this.buildSvgTextStream(svgRoot);
        if (!streamData) {
            return null;
        }

        let start = this.streamPositionFromPoint(
            streamData,
            range.startContainer,
            range.startOffset
        );
        let end = this.streamPositionFromPoint(
            streamData,
            range.endContainer,
            range.endOffset
        );
        if (start == null || end == null) {
            return null;
        }
        if (start > end) {
            const swap = start;
            start = end;
            end = swap;
        }
        if (start >= end) {
            return null;
        }

        const raw = streamData.stream.slice(start, end);
        const exact = this.normalizeStreamText(raw);
        if (!exact) {
            return null;
        }

        const leading = raw.match(/^[\t\n\r ]+/);
        if (leading) {
            start += leading[0].length;
        }
        const trailing = raw.match(/[\t\n\r ]+$/);
        if (trailing) {
            end -= trailing[0].length;
        }
        if (start >= end) {
            return null;
        }

        const prefix = streamData.stream.slice(
            Math.max(0, start - this.CONTEXT_CHARS),
            start
        );
        const suffix = streamData.stream.slice(
            end,
            Math.min(streamData.length, end + this.CONTEXT_CHARS)
        );

        return {
            element: figure.dataset.element,
            figure: figure,
            svgRoot: svgRoot,
            start: { position: start },
            end: { position: end },
            anchor: {
                type: "SvgTextRangeAnchor",
                start: { position: start },
                end: { position: end },
                exact: exact,
                prefix: prefix,
                suffix: suffix,
            },
        };
    },

    _rangeIntersectsLearner(range) {
        const nodes = this._textNodesInRange(range);
        for (let i = 0; i < nodes.length; i += 1) {
            const parent = nodes[i].parentElement;
            if (parent && parent.closest("[data-learner='true']")) {
                return true;
            }
        }
        return false;
    },

    _rangeIntersectsTextPath(range) {
        const nodes = this._textNodesInRange(range);
        for (let i = 0; i < nodes.length; i += 1) {
            const parent = nodes[i].parentElement;
            if (parent && this._isInsideTextPath(parent)) {
                return true;
            }
        }
        return false;
    },

    _rangeUsesIneligibleText(range, svgRoot) {
        const nodes = this._textNodesInRange(range);
        if (!nodes.length) {
            return true;
        }
        for (let i = 0; i < nodes.length; i += 1) {
            if (!this._isEligibleStreamTextNode(nodes[i])) {
                return true;
            }
            if (!svgRoot.contains(nodes[i])) {
                return true;
            }
        }
        return false;
    },

    _rangeSpansMultipleTextRoots(range, svgRoot) {
        const roots = new Set();
        const nodes = this._textNodesInRange(range);
        for (let i = 0; i < nodes.length; i += 1) {
            const textRoot = nodes[i].parentElement.closest("text");
            if (!textRoot || !svgRoot.contains(textRoot)) {
                return true;
            }
            roots.add(textRoot);
        }
        return roots.size > 1;
    },

    _textNodesInRange(range) {
        const root = range.commonAncestorContainer;
        const rootEl =
            root.nodeType === Node.ELEMENT_NODE ? root : root.parentElement;
        if (!rootEl) {
            return [];
        }
        const result = [];
        const walker = document.createTreeWalker(rootEl, NodeFilter.SHOW_TEXT);
        let node = walker.nextNode();
        while (node) {
            if (typeof range.intersectsNode === "function" && range.intersectsNode(node)) {
                result.push(node);
            }
            node = walker.nextNode();
        }
        if (
            !result.length &&
            range.startContainer.nodeType === Node.TEXT_NODE
        ) {
            result.push(range.startContainer);
        }
        return result;
    },

    _officialInlineSvg(node, host) {
        if (!node) {
            return null;
        }
        const el = node.nodeType === Node.ELEMENT_NODE ? node : node.parentElement;
        if (!el || !host.contains(el)) {
            return null;
        }
        const figure = el.closest(".official-visual");
        if (!figure || figure.dataset.inlineFallback === "true") {
            return null;
        }
        const svg = el.closest('svg[data-inline="true"][data-inline-ready="true"]');
        if (!svg || !figure.contains(svg)) {
            return null;
        }
        return svg;
    },

    _onSelectionChange(host, context) {
        const selection = window.getSelection();
        if (!selection || selection.isCollapsed || selection.rangeCount === 0) {
            this.dismissToolbar();
            return;
        }

        const range = selection.getRangeAt(0);
        const svgRoot = this._officialInlineSvg(range.commonAncestorContainer, host);
        if (!svgRoot) {
            this.dismissToolbar();
            return;
        }

        const streamRange = this.selectionToStreamRange(selection, svgRoot);
        if (!streamRange) {
            this.dismissToolbar();
            return;
        }

        this._selectionContext = {
            host: host,
            context: context,
            svgRoot: svgRoot,
            figure: streamRange.figure,
            element: streamRange.element,
            range: range.cloneRange(),
            anchor: streamRange.anchor,
        };
        this._showToolbar(range);
    },

    _ensureToolbar() {
        if (this._toolbar) {
            return;
        }

        const self = this;
        const toolbar = document.createElement("div");
        toolbar.className = this.TOOLBAR_CLASS;
        toolbar.dataset.learner = "true";
        toolbar.setAttribute("role", "toolbar");
        toolbar.setAttribute("aria-label", "Mise en forme SVG");

        const formats = [
            { kind: "bold", label: "B", title: "Gras" },
            { kind: "italic", label: "I", title: "Italique" },
            { kind: "underline", label: "U", title: "Souligné" },
            { kind: "strike", label: "S", title: "Barré" },
        ];
        formats.forEach(function (item) {
            const button = document.createElement("button");
            button.type = "button";
            button.className = "svg-format-toolbar-btn";
            button.textContent = item.label;
            button.title = item.title;
            button.dataset.format = item.kind;
            button.addEventListener("click", function () {
                self._onFormatIntent(item.kind, null);
            });
            toolbar.appendChild(button);
        });

        const textGroup = document.createElement("div");
        textGroup.className = "svg-format-toolbar-swatches";
        textGroup.setAttribute("aria-label", "Couleur de texte");
        (window.LouLearnerStore.SVG_TEXT_COLOR_PALETTE || []).forEach(function (color) {
            const swatch = document.createElement("button");
            swatch.type = "button";
            swatch.className = "svg-format-toolbar-swatch";
            swatch.title = color;
            swatch.style.backgroundColor = color;
            swatch.dataset.format = "textColor";
            swatch.dataset.color = color;
            swatch.addEventListener("click", function () {
                self._onFormatIntent("textColor", { color: color });
            });
            textGroup.appendChild(swatch);
        });
        toolbar.appendChild(textGroup);

        const bgGroup = document.createElement("div");
        bgGroup.className = "svg-format-toolbar-swatches";
        bgGroup.setAttribute("aria-label", "Couleur de fond");
        (window.LouLearnerStore.SVG_BACKGROUND_COLOR_PALETTE || []).forEach(function (color) {
            const swatch = document.createElement("button");
            swatch.type = "button";
            swatch.className = "svg-format-toolbar-swatch svg-format-toolbar-swatch-bg";
            swatch.title = color;
            swatch.style.backgroundColor = color;
            swatch.dataset.format = "backgroundColor";
            swatch.dataset.color = color;
            swatch.addEventListener("click", function () {
                self._onFormatIntent("backgroundColor", { backgroundColor: color });
            });
            bgGroup.appendChild(swatch);
        });
        toolbar.appendChild(bgGroup);

        this._toolbar = toolbar;
        document.body.appendChild(toolbar);
    },

    _getRangeRect(range) {
        if (range && typeof range.getBoundingClientRect === "function") {
            const rect = range.getBoundingClientRect();
            if (rect && (rect.width || rect.height)) {
                return rect;
            }
        }
        return {
            left: 100,
            top: 100,
            width: 1,
            height: 1,
            right: 101,
            bottom: 101,
        };
    },

    _showToolbar(range) {
        const rect = this._getRangeRect(range);
        this._ensureToolbar();
        this._toolbar.style.left = Math.max(8, rect.left + window.scrollX) + "px";
        this._toolbar.style.top =
            Math.max(8, rect.top + window.scrollY - this._toolbar.offsetHeight - 8) + "px";
        this._toolbar.hidden = false;
    },

    dismissToolbar() {
        if (this._toolbar) {
            this._toolbar.hidden = true;
        }
        this._selectionContext = null;
        const selection = window.getSelection();
        if (selection) {
            selection.removeAllRanges();
        }
    },

    _onFormatIntent(format, style) {
        const ctx = this._selectionContext;
        if (!ctx) {
            return;
        }
        this._lastFormatIntent = {
            format: format,
            style: style,
            element: ctx.element,
            anchor: ctx.anchor,
        };
        this.dismissToolbar();
    },
};
