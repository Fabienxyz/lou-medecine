// Inline formatting on official SVG text (Renderer V2.3).
//
// M4: apply, split, overlay, restore, persistence.
window.LouInlineFormatting = {
    TOOLBAR_CLASS: "svg-format-toolbar",
    OVERLAY_GROUP_CLASS: "learner-svg-formats",
    SVG_NS: "http://www.w3.org/2000/svg",
    CONTEXT_CHARS: 32,

    _toolbar: null,
    _boundHost: null,
    _bindContext: null,
    _selectionContext: null,
    _writing: false,
    _onDocumentMouseDown: null,
    _onDocumentKeyDown: null,

    async mount(host, context) {
        try {
            await this.restore(host, context);
        } catch (err) {
            console.warn("[LouInlineFormatting] Format restore failed.", err);
        }
    },

    officialInlineSvg(node, host) {
        return this._officialInlineSvg(node, host);
    },

    rangesOverlap(aStart, aEnd, bStart, bEnd) {
        return this._rangesOverlap(aStart, aEnd, bStart, bEnd);
    },

    async findIntersectingBackgroundRecords(context, element, start, end) {
        const store = context && context.store;
        const chapter = context && context.chapter;
        const projection =
            context && context.projection && context.projection.id;
        if (
            !store ||
            !chapter ||
            !projection ||
            typeof store.listSvgTextFormats !== "function"
        ) {
            return [];
        }
        const records = await store.listSvgTextFormats(
            chapter,
            projection,
            element
        );
        const self = this;
        return (records || []).filter(function (record) {
            if (record.format !== "backgroundColor") {
                return false;
            }
            const rs = record.anchor.start.position;
            const re = record.anchor.end.position;
            return self._rangesOverlap(rs, re, start, end);
        });
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
            if (
                window.LouInlineNotes &&
                typeof window.LouInlineNotes.isNoteEditProtected === "function" &&
                window.LouInlineNotes.isNoteEditProtected()
            ) {
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
                if (
                    window.LouInlineNotes &&
                    typeof window.LouInlineNotes.isNoteEditProtected === "function" &&
                    window.LouInlineNotes.isNoteEditProtected()
                ) {
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
        if (
            window.LouInlineNotes &&
            typeof window.LouInlineNotes.isNoteEditProtected === "function" &&
            window.LouInlineNotes.isNoteEditProtected()
        ) {
            return;
        }

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

        const removeBtn = document.createElement("button");
        removeBtn.type = "button";
        removeBtn.className = "svg-format-toolbar-btn svg-format-toolbar-remove";
        removeBtn.textContent = "Remove";
        removeBtn.title = "Retirer le formatage";
        removeBtn.dataset.format = "remove";
        removeBtn.addEventListener("click", function () {
            self._onFormatIntent("remove", null);
        });
        toolbar.appendChild(removeBtn);

        this._toolbar = toolbar;
        document.body.appendChild(toolbar);
    },

    _setToolbarDisabled(disabled) {
        if (!this._toolbar) {
            return;
        }
        this._toolbar.querySelectorAll("button").forEach(function (btn) {
            btn.disabled = disabled;
        });
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

    dismissToolbar(clearSelection) {
        if (
            window.LouInlineNotes &&
            typeof window.LouInlineNotes.isNoteEditProtected === "function" &&
            window.LouInlineNotes.isNoteEditProtected()
        ) {
            if (this._toolbar) {
                this._toolbar.hidden = true;
            }
            this._selectionContext = null;
            this._setToolbarDisabled(false);
            return;
        }
        if (clearSelection !== false) {
            const selection = window.getSelection();
            if (selection) {
                selection.removeAllRanges();
            }
        }
        if (this._toolbar) {
            this._toolbar.hidden = true;
        }
        this._selectionContext = null;
        this._setToolbarDisabled(false);
    },

    _rangesOverlap(aStart, aEnd, bStart, bEnd) {
        return aStart < bEnd && bStart < aEnd;
    },

    _formatsEqual(formatA, styleA, formatB, styleB) {
        if (formatA !== formatB) {
            return false;
        }
        if (formatA === "textColor") {
            return (styleA && styleA.color) === (styleB && styleB.color);
        }
        if (formatA === "backgroundColor") {
            return (
                (styleA && styleA.backgroundColor) ===
                (styleB && styleB.backgroundColor)
            );
        }
        return !styleA && !styleB;
    },

    _anchorFromStreamRange(streamData, start, end) {
        const raw = streamData.stream.slice(start, end);
        const exact = this.normalizeStreamText(raw);
        if (!exact) {
            return null;
        }
        return {
            type: "SvgTextRangeAnchor",
            start: { position: start },
            end: { position: end },
            exact: exact,
            prefix: streamData.stream.slice(
                Math.max(0, start - this.CONTEXT_CHARS),
                start
            ),
            suffix: streamData.stream.slice(
                end,
                Math.min(streamData.length, end + this.CONTEXT_CHARS)
            ),
        };
    },

    _recordPayload(meta, start, end, format, style, streamData) {
        const anchor = this._anchorFromStreamRange(streamData, start, end);
        if (!anchor) {
            return null;
        }
        const payload = {
            chapter: meta.chapter,
            projection: meta.projection,
            element: meta.element,
            assetPath: meta.assetPath,
            format: format,
            anchor: anchor,
        };
        if (style) {
            payload.style = style;
        }
        return payload;
    },

    _computeFinalRecords(existing, start, end, intent, streamData, meta) {
        if (intent && intent.format !== "remove") {
            const exactMatch = existing.find(function (record) {
                return (
                    record.anchor.start.position === start &&
                    record.anchor.end.position === end &&
                    window.LouInlineFormatting._formatsEqual(
                        record.format,
                        record.style,
                        intent.format,
                        intent.style
                    )
                );
            });
            if (exactMatch) {
                return { noOp: true, records: existing };
            }
        }

        const kept = [];
        const fragments = [];

        existing.forEach(function (record) {
            const rs = record.anchor.start.position;
            const re = record.anchor.end.position;
            if (!window.LouInlineFormatting._rangesOverlap(rs, re, start, end)) {
                kept.push(record);
                return;
            }
            if (rs < start) {
                const left = window.LouInlineFormatting._recordPayload(
                    meta,
                    rs,
                    start,
                    record.format,
                    record.style,
                    streamData
                );
                if (left) {
                    fragments.push(left);
                }
            }
            if (re > end) {
                const right = window.LouInlineFormatting._recordPayload(
                    meta,
                    end,
                    re,
                    record.format,
                    record.style,
                    streamData
                );
                if (right) {
                    fragments.push(right);
                }
            }
        });

        let finalRecords = kept.map(function (record) {
            return {
                chapter: record.chapter,
                projection: record.projection,
                element: record.element,
                assetPath: record.assetPath,
                format: record.format,
                style: record.style,
                anchor: record.anchor,
                id: record.id,
            };
        }).concat(fragments);

        if (intent && intent.format !== "remove") {
            const created = this._recordPayload(
                meta,
                start,
                end,
                intent.format,
                intent.style,
                streamData
            );
            if (!created) {
                return null;
            }
            finalRecords = finalRecords.filter(function (record) {
                return !(
                    record.anchor.start.position === start &&
                    record.anchor.end.position === end
                );
            });
            finalRecords.push(created);
        }

        if (intent && intent.format === "remove") {
            const hadOverlap = existing.some(function (record) {
                const rs = record.anchor.start.position;
                const re = record.anchor.end.position;
                return window.LouInlineFormatting._rangesOverlap(
                    rs,
                    re,
                    start,
                    end
                );
            });
            if (!hadOverlap) {
                return { noOp: true, records: existing };
            }
        }

        finalRecords = this._mergeAdjacentRecords(finalRecords, streamData, meta);
        finalRecords.sort(function (a, b) {
            return (
                a.anchor.start.position - b.anchor.start.position ||
                (a.id || 0) - (b.id || 0)
            );
        });
        return { noOp: false, records: finalRecords };
    },

    _mergeAdjacentRecords(records, streamData, meta) {
        const sorted = records.slice().sort(function (a, b) {
            return a.anchor.start.position - b.anchor.start.position;
        });
        const merged = [];
        sorted.forEach(function (record) {
            const last = merged[merged.length - 1];
            if (
                last &&
                last.anchor.end.position === record.anchor.start.position &&
                this._formatsEqual(
                    last.format,
                    last.style,
                    record.format,
                    record.style
                )
            ) {
                const combined = this._recordPayload(
                    meta,
                    last.anchor.start.position,
                    record.anchor.end.position,
                    last.format,
                    last.style,
                    streamData
                );
                if (combined) {
                    combined.id = last.id;
                    merged[merged.length - 1] = combined;
                }
            } else {
                merged.push(Object.assign({}, record));
            }
        }, this);
        return merged;
    },

    _recordsEquivalent(existing, planned) {
        if (existing.length !== planned.length) {
            return false;
        }
        const norm = function (records) {
            return records
                .map(function (record) {
                    return [
                        record.anchor.start.position,
                        record.anchor.end.position,
                        record.format,
                        JSON.stringify(record.style || null),
                        record.anchor.exact,
                    ].join("|");
                })
                .sort()
                .join("||");
        };
        return norm(existing) === norm(planned);
    },

    async _replaceElementRecords(context, element, assetPath, plannedRecords) {
        const store = context.store;
        const chapter = context.chapter;
        const projection = context.projection.id;
        const existing = await store.listSvgTextFormats(
            chapter,
            projection,
            element
        );
        const plannedPayloads = plannedRecords.map(function (record) {
            const payload = {
                chapter: chapter,
                projection: projection,
                element: element,
                assetPath: assetPath,
                format: record.format,
                anchor: record.anchor,
            };
            if (record.style) {
                payload.style = record.style;
            }
            return payload;
        });

        if (this._recordsEquivalent(existing, plannedPayloads)) {
            return { noOp: true, records: existing };
        }

        const previous = existing.slice();
        const deletedIds = [];
        for (let i = 0; i < existing.length; i += 1) {
            await store.deleteSvgTextFormat(existing[i].id);
            deletedIds.push(existing[i].id);
        }

        const saved = [];
        try {
            for (let i = 0; i < plannedPayloads.length; i += 1) {
                const id = await store.addSvgTextFormat(plannedPayloads[i]);
                saved.push(
                    Object.assign({}, plannedPayloads[i], { id: id })
                );
            }
        } catch (err) {
            for (let i = 0; i < saved.length; i += 1) {
                await store.deleteSvgTextFormat(saved[i].id);
            }
            for (let j = 0; j < previous.length; j += 1) {
                const old = previous[j];
                await store.addSvgTextFormat({
                    chapter: old.chapter,
                    projection: old.projection,
                    element: old.element,
                    assetPath: old.assetPath,
                    format: old.format,
                    style: old.style,
                    anchor: old.anchor,
                });
            }
            throw err;
        }
        return { noOp: false, records: saved, deletedIds: deletedIds };
    },

    _resolveRecordRange(streamData, record) {
        const start = record.anchor.start.position;
        const end = record.anchor.end.position;
        if (start < 0 || end <= start || end > streamData.length) {
            return null;
        }
        const sub = streamData.stream.slice(start, end);
        if (this.normalizeStreamText(sub) !== record.anchor.exact) {
            return null;
        }
        return { start: start, end: end };
    },

    _clearOverlayGroup(svgRoot) {
        svgRoot.querySelectorAll("g." + this.OVERLAY_GROUP_CLASS).forEach(function (group) {
            group.remove();
        });
        svgRoot
            .querySelectorAll(
                'rect[data-learner="true"][data-overlay-layer="background"]'
            )
            .forEach(function (rect) {
                rect.remove();
            });
    },

    _officialTextElement(node) {
        let el = node;
        while (el && el.nodeType === Node.ELEMENT_NODE) {
            if (el.localName === "text") {
                return el;
            }
            el = el.parentElement;
        }
        return node && node.parentElement ? node.parentElement : null;
    },

    /** Place highlight rect above node fills, directly under official text (Stabilo order). */
    _insertBackgroundHighlightRect(svgRoot, segmentParent, rect) {
        const textElement = this._officialTextElement(segmentParent);
        if (!textElement || !textElement.parentElement) {
            return false;
        }
        rect.setAttribute("data-overlay-layer", "background");
        rect.setAttribute("pointer-events", "none");
        textElement.parentElement.insertBefore(rect, textElement);
        return true;
    },

    _subtreeHasOfficialText(element) {
        if (!element || element.nodeType !== Node.ELEMENT_NODE) {
            return false;
        }
        const tag = element.localName.toLowerCase();
        if (
            (tag === "text" || tag === "tspan") &&
            element.hasAttribute("data-official-text-id")
        ) {
            return true;
        }
        return !!element.querySelector("[data-official-text-id]");
    },

    /** Insert highlight rects beneath official text (Stabilo paint order). */
    _insertOverlayBackgroundLayer(svgRoot, group) {
        const children = Array.from(svgRoot.children);
        for (let i = 0; i < children.length; i += 1) {
            if (this._subtreeHasOfficialText(children[i])) {
                svgRoot.insertBefore(group, children[i]);
                return;
            }
        }
        svgRoot.appendChild(group);
    },

    _iterStreamSegments(streamData, start, end) {
        const segments = [];
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
        let node = walker.nextNode();
        while (node) {
            const bounds = streamData.nodeOffsets.get(node);
            const segStart = Math.max(start, bounds.start);
            const segEnd = Math.min(end, bounds.end);
            if (segStart < segEnd) {
                segments.push({
                    node: node,
                    parent: node.parentElement,
                    startOffset: segStart - bounds.start,
                    endOffset: segEnd - bounds.start,
                    text: node.textContent.slice(
                        segStart - bounds.start,
                        segEnd - bounds.start
                    ),
                });
            }
            node = walker.nextNode();
        }
        return segments;
    },

    _copyPresentationAttributes(source, target) {
        [
            "x",
            "y",
            "dx",
            "dy",
            "transform",
            "font-size",
            "font-family",
            "text-anchor",
            "dominant-baseline",
        ].forEach(function (name) {
            if (source.hasAttribute(name)) {
                target.setAttribute(name, source.getAttribute(name));
            }
        });
    },

    _renderFormatOverlay(group, svgRoot, streamData, record) {
        const range = this._resolveRecordRange(streamData, record);
        if (!range) {
            return null;
        }
        const segments = this._iterStreamSegments(
            streamData,
            range.start,
            range.end
        );
        if (!segments.length) {
            return null;
        }

        const fragment = document.createDocumentFragment();
        segments.forEach(function (segment) {
            const parent = segment.parent;
            if (record.format === "backgroundColor") {
                const rect = document.createElementNS(
                    window.LouInlineFormatting.SVG_NS,
                    "rect"
                );
                if (record.id != null) {
                    rect.setAttribute("data-format-id", String(record.id));
                }
                rect.setAttribute("data-learner", "true");
                rect.setAttribute(
                    "fill",
                    record.style && record.style.backgroundColor
                        ? record.style.backgroundColor
                        : "#fff3bf"
                );
                const box = window.LouInlineFormatting._measureTextSegment(
                    segment.node,
                    segment.startOffset,
                    segment.endOffset
                );
                if (box) {
                    rect.setAttribute("x", String(box.x));
                    rect.setAttribute("y", String(box.y));
                    rect.setAttribute("width", String(box.width));
                    rect.setAttribute("height", String(box.height));
                    const inserted =
                        window.LouInlineFormatting._insertBackgroundHighlightRect(
                            svgRoot,
                            parent,
                            rect
                        );
                    if (!inserted) {
                        if (group) {
                            fragment.appendChild(rect);
                        } else {
                            svgRoot.appendChild(rect);
                        }
                    }
                }
                return;
            }

            const overlayText = document.createElementNS(
                window.LouInlineFormatting.SVG_NS,
                parent.localName === "tspan" ? "tspan" : "text"
            );
            if (record.id != null) {
                overlayText.setAttribute("data-format-id", String(record.id));
            }
            overlayText.setAttribute("data-learner", "true");
            overlayText.textContent = segment.text;
            window.LouInlineFormatting._copyPresentationAttributes(
                parent,
                overlayText
            );

            if (record.format === "bold") {
                overlayText.setAttribute("font-weight", "bold");
            } else if (record.format === "italic") {
                overlayText.setAttribute("font-style", "italic");
            } else if (record.format === "underline") {
                overlayText.setAttribute("text-decoration", "underline");
            } else if (record.format === "strike") {
                overlayText.setAttribute("text-decoration", "line-through");
            } else if (record.format === "textColor") {
                overlayText.setAttribute(
                    "fill",
                    record.style && record.style.color
                        ? record.style.color
                        : "#1a1a1a"
                );
            }

            fragment.appendChild(overlayText);
        });

        if (group && fragment.childNodes.length) {
            group.appendChild(fragment);
        }
        return group;
    },

    _measureTextSegmentViaSvgApi(textElement, startOffset, endOffset) {
        if (
            !textElement ||
            typeof textElement.getStartPositionOfChar !== "function" ||
            typeof textElement.getSubStringLength !== "function"
        ) {
            return null;
        }
        try {
            const startPoint = textElement.getStartPositionOfChar(startOffset);
            const width = textElement.getSubStringLength(
                startOffset,
                endOffset - startOffset
            );
            if (!Number.isFinite(width) || width <= 0) {
                return null;
            }
            return {
                x: startPoint.x,
                y: startPoint.y - 12,
                width: width,
                height: 14,
            };
        } catch (err) {
            return null;
        }
    },

    _measureTextSegmentViaRange(textNode, startOffset, endOffset) {
        if (!textNode || textNode.nodeType !== Node.TEXT_NODE) {
            return null;
        }
        const range = document.createRange();
        try {
            range.setStart(textNode, startOffset);
            range.setEnd(textNode, endOffset);
        } catch (err) {
            return null;
        }
        let clientRect = null;
        try {
            if (typeof range.getBoundingClientRect !== "function") {
                return null;
            }
            clientRect = range.getBoundingClientRect();
        } catch (err) {
            return null;
        }
        if (!clientRect || (!clientRect.width && !clientRect.height)) {
            return null;
        }
        const textElement = textNode.parentElement;
        const svg =
            textElement &&
            (textElement.ownerSVGElement ||
                textElement.closest("svg"));
        if (
            !svg ||
            typeof svg.createSVGPoint !== "function" ||
            typeof svg.getScreenCTM !== "function"
        ) {
            return null;
        }
        let ctm = null;
        try {
            ctm = svg.getScreenCTM();
        } catch (err) {
            return null;
        }
        if (!ctm) {
            return null;
        }
        const inv = ctm.inverse();
        const pt = svg.createSVGPoint();
        const toSvg = function (x, y) {
            pt.x = x;
            pt.y = y;
            return pt.matrixTransform(inv);
        };
        const tl = toSvg(clientRect.left, clientRect.top);
        const br = toSvg(clientRect.right, clientRect.bottom);
        return {
            x: Math.min(tl.x, br.x),
            y: Math.min(tl.y, br.y) - 1,
            width: Math.max(Math.abs(br.x - tl.x), 1),
            height: Math.max(Math.abs(br.y - tl.y), 10),
        };
    },

    _measureTextSegment(textNodeOrElement, startOffset, endOffset) {
        let textNode = null;
        let textElement = null;
        if (textNodeOrElement && textNodeOrElement.nodeType === Node.TEXT_NODE) {
            textNode = textNodeOrElement;
            textElement = textNode.parentElement;
        } else {
            textElement = textNodeOrElement;
            if (
                textElement &&
                textElement.firstChild &&
                textElement.firstChild.nodeType === Node.TEXT_NODE
            ) {
                textNode = textElement.firstChild;
            }
        }

        let box = null;
        if (textElement) {
            box = this._measureTextSegmentViaSvgApi(
                textElement,
                startOffset,
                endOffset
            );
            if (
                !box &&
                textElement.parentElement &&
                textElement.parentElement !== textElement.ownerSVGElement &&
                textElement.localName === "tspan"
            ) {
                box = this._measureTextSegmentViaSvgApi(
                    textElement.parentElement,
                    startOffset,
                    endOffset
                );
            }
        }

        if (!box && textNode) {
            box = this._measureTextSegmentViaRange(
                textNode,
                startOffset,
                endOffset
            );
        }

        if (box) {
            if (typeof window.louSvgDebugStep === "function") {
                window.louSvgDebugStep("measure.ok", {
                    startOffset: startOffset,
                    endOffset: endOffset,
                    box: box,
                });
            }
            return box;
        }

        if (
            !textElement ||
            typeof textElement.getStartPositionOfChar !== "function" ||
            typeof textElement.getSubStringLength !== "function"
        ) {
            return this._estimateTextSegmentBox(startOffset, endOffset);
        }

        if (typeof window.louSvgDebugStep === "function") {
            window.louSvgDebugStep("measure.failed", {
                startOffset: startOffset,
                endOffset: endOffset,
                tag: textElement && textElement.localName,
            });
            if (typeof window.louSvgDebugPause === "function") {
                window.louSvgDebugPause("measure.failed", {});
            }
        }
        return null;
    },

    _estimateTextSegmentBox(startOffset, endOffset) {
        return {
            x: 0,
            y: 0,
            width: Math.max(1, endOffset - startOffset) * 8,
            height: 14,
        };
    },

    _countBackgroundOverlayRects(svgRoot) {
        if (!svgRoot) {
            return 0;
        }
        return svgRoot.querySelectorAll(
            'rect[data-learner="true"][data-overlay-layer="background"]'
        ).length;
    },

    _renderOverlaysForFigure(svgRoot, records) {
        this._clearOverlayGroup(svgRoot);
        if (!records || !records.length) {
            return;
        }
        const streamData = this.buildSvgTextStream(svgRoot);
        if (!streamData) {
            return;
        }
        const sorted = records.slice().sort(function (a, b) {
            return (
                a.anchor.start.position - b.anchor.start.position ||
                (a.id || 0) - (b.id || 0)
            );
        });
        const bgRecords = sorted.filter(function (record) {
            return record.format === "backgroundColor";
        });
        const fgRecords = sorted.filter(function (record) {
            return record.format !== "backgroundColor";
        });

        bgRecords.forEach(function (record) {
            window.LouInlineFormatting._renderFormatOverlay(
                null,
                svgRoot,
                streamData,
                record
            );
        });
        let fgGroup = null;
        if (fgRecords.length) {
            fgGroup = document.createElementNS(this.SVG_NS, "g");
            fgGroup.setAttribute("class", this.OVERLAY_GROUP_CLASS);
            fgGroup.setAttribute("data-learner", "true");
            fgGroup.setAttribute("data-overlay-layer", "foreground");
            fgGroup.setAttribute("pointer-events", "none");
            svgRoot.appendChild(fgGroup);
        }

        fgRecords.forEach(function (record) {
            window.LouInlineFormatting._renderFormatOverlay(
                fgGroup,
                svgRoot,
                streamData,
                record
            );
        });
    },

    async restore(host, context) {
        const projection = context.projection && context.projection.id;
        if (!projection || !context.store.listSvgTextFormats) {
            return;
        }
        const self = this;
        const figures = host.querySelectorAll(".official-visual[data-element]");
        for (let i = 0; i < figures.length; i += 1) {
            const figure = figures[i];
            if (figure.dataset.inlineFallback === "true") {
                continue;
            }
            const svgRoot = figure.querySelector(
                'svg[data-inline="true"][data-inline-ready="true"]'
            );
            if (!svgRoot) {
                continue;
            }
            const element = figure.dataset.element;
            const records = await context.store.listSvgTextFormats(
                context.chapter,
                projection,
                element
            );
            self._renderOverlaysForFigure(svgRoot, records || []);
        }
    },

    async applyFormat(host, context, selectionRange, formatIntent) {
        if (!selectionRange || !formatIntent) {
            return null;
        }
        const svgRoot = selectionRange.svgRoot;
        const element = selectionRange.element;
        const start = selectionRange.start.position;
        const end = selectionRange.end.position;
        const streamData = this.buildSvgTextStream(svgRoot);
        if (!streamData) {
            return null;
        }
        const assetPath = (context.projection.visuals || {})[element];
        if (!assetPath) {
            return null;
        }
        const meta = {
            chapter: context.chapter,
            projection: context.projection.id,
            element: element,
            assetPath: assetPath,
        };
        const existing = await context.store.listSvgTextFormats(
            context.chapter,
            context.projection.id,
            element
        );
        const plan = this._computeFinalRecords(
            existing,
            start,
            end,
            formatIntent,
            streamData,
            meta
        );
        if (!plan) {
            return null;
        }
        if (plan.noOp) {
            return { noOp: true };
        }

        this._renderOverlaysForFigure(svgRoot, plan.records);

        if (formatIntent.format === "backgroundColor") {
            const bgCount = this._countBackgroundOverlayRects(svgRoot);
            if (typeof window.louSvgDebugStep === "function") {
                window.louSvgDebugStep("applyFormat.overlay", {
                    bgCount: bgCount,
                    recordCount: plan.records.length,
                    svgConnected: svgRoot.isConnected,
                });
            }
            if (bgCount === 0) {
                if (typeof window.louSvgDebugPause === "function") {
                    window.louSvgDebugPause("applyFormat.noVisibleRects", {
                        element: element,
                        start: start,
                        end: end,
                    });
                }
                this._renderOverlaysForFigure(svgRoot, existing);
                return null;
            }
        }

        try {
            const result = await this._replaceElementRecords(
                context,
                element,
                assetPath,
                plan.records
            );
            this._renderOverlaysForFigure(svgRoot, result.records);
            return result;
        } catch (err) {
            console.warn("[LouInlineFormatting] Format apply failed.", err);
            this._clearOverlayGroup(svgRoot);
            await this.restore(host, context);
            throw err;
        }
    },

    async removeFormat(host, context, selectionRange) {
        return this.applyFormat(host, context, selectionRange, {
            format: "remove",
            style: null,
        });
    },

    async _onFormatIntent(format, style) {
        const ctx = this._selectionContext;
        if (!ctx || this._writing) {
            return;
        }
        const selectionRange = {
            element: ctx.element,
            figure: ctx.figure,
            svgRoot: ctx.svgRoot,
            start: { position: ctx.anchor.start.position },
            end: { position: ctx.anchor.end.position },
            anchor: Object.assign({}, ctx.anchor),
        };
        const intent = {
            format: format,
            style: style,
        };

        this._writing = true;
        this._setToolbarDisabled(true);
        try {
            if (format === "remove") {
                await this.removeFormat(ctx.host, ctx.context, selectionRange);
            } else {
                await this.applyFormat(
                    ctx.host,
                    ctx.context,
                    selectionRange,
                    intent
                );
            }
        } catch (err) {
            // warn already logged in applyFormat
        } finally {
            this._writing = false;
            this.dismissToolbar();
        }
    },
};
