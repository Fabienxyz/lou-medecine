// Text selection highlights (Renderer V2.1 + Highlight Interaction V2).
//
// Learner-owned overlays on official walkthrough prose. Stored separately from generated content;
// applied after block assembly. Scoped to [data-official="true"] pedagogical containers.
//
// Highlight Interaction V2: immediate creation on mouseup; toolbar edits the active mark live.
window.LouTextHighlights = {
    HIGHLIGHT_CLASS: "learner-highlight",
    EDITING_CLASS: "is-editing",
    CONTEXT_CHARS: 32,

    _boundHost: null,
    _bindContext: null,
    _editContext: null,

    async mount(host, context) {
        try {
            await this.restoreAll(host, context);
        } catch (err) {
            console.warn(
                "[LouTextHighlights] Highlight restore failed; selection binding continues.",
                err
            );
        } finally {
            this.bindSelection(host, context);
        }
    },

    async restoreAll(host, context) {
        const ids =
            context.projectionIdsToRestore && context.projectionIdsToRestore.length
                ? context.projectionIdsToRestore
                : context.projection && context.projection.id
                  ? [context.projection.id]
                  : [];
        for (let i = 0; i < ids.length; i += 1) {
            await this.restore(
                host,
                Object.assign({}, context, { projection: { id: ids[i] } })
            );
        }
    },

    bindSelection(host, context) {
        const self = this;
        this._bindContext = context;
        if (host && host.dataset.louTextHighlightsBound === "true") {
            return;
        }
        if (host) {
            host.dataset.louTextHighlightsBound = "true";
        }
        this._boundHost = host;
        this.dismissToolbar();

        host.addEventListener("mouseup", function (event) {
            const ctrl = window.LouAnnotationController;
            if (ctrl && ctrl.isToolbarTarget(event.target)) {
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

        if (!this._onDocumentKeydown) {
            this._onDocumentKeydown = function (event) {
                if (event.key === "Escape") {
                    self.dismissToolbar();
                }
            };
            document.addEventListener("keydown", this._onDocumentKeydown);
        }

        if (!this._onDocumentMousedown) {
            this._onDocumentMousedown = function (event) {
                const ctrl = window.LouAnnotationController;
                if (ctrl && ctrl.isToolbarTarget(event.target)) {
                    return;
                }
                if (ctrl && ctrl.isNoteEditBlockingSelectionClear()) {
                    return;
                }
                self.dismissToolbar();
            };
            document.addEventListener("mousedown", this._onDocumentMousedown);
        }
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
        const officialRoot = window.LouAnnotationColors.annotatableRoot(
            range.commonAncestorContainer,
            host
        );
        if (!officialRoot || !officialRoot.contains(range.commonAncestorContainer)) {
            this.dismissToolbar();
            return;
        }
        if (this._selectionInsideWalkthroughNote(range)) {
            this.dismissToolbar();
            return;
        }

        const block = officialRoot.closest(".pedagogical-block");
        if (!block) {
            this.dismissToolbar();
            return;
        }

        const intersecting = this._marksIntersectingRange(range, officialRoot);
        if (intersecting.length > 1) {
            this.dismissToolbar();
            return;
        }
        if (intersecting.length === 1) {
            this._beginHighlightEdit(intersecting[0], host, context);
            return;
        }

        void this._createHighlightFromSelection(
            host,
            context,
            range,
            officialRoot,
            block
        );
    },

    _selectionInsideWalkthroughNote(range) {
        const noteClass =
            window.LouInlineNotes && window.LouInlineNotes.NOTE_CLASS
                ? window.LouInlineNotes.NOTE_CLASS
                : "walkthrough-note";
        const node = range.commonAncestorContainer;
        const el = node.nodeType === Node.ELEMENT_NODE ? node : node.parentElement;
        return !!(el && el.closest("." + noteClass));
    },

    _marksIntersectingRange(range, officialRoot) {
        const marks = officialRoot.querySelectorAll("." + this.HIGHLIGHT_CLASS);
        const hits = [];
        for (let i = 0; i < marks.length; i += 1) {
            if (this._rangeIntersectsNode(range, marks[i])) {
                hits.push(marks[i]);
            }
        }
        return hits;
    },

    _rangeIntersectsNode(range, node) {
        if (!range || !node) {
            return false;
        }
        if (typeof range.intersectsNode === "function") {
            try {
                return range.intersectsNode(node);
            } catch (err) {
                return false;
            }
        }
        const nodeRange = document.createRange();
        nodeRange.selectNodeContents(node);
        return (
            range.compareBoundaryPoints(Range.END_TO_START, nodeRange) > 0 &&
            range.compareBoundaryPoints(Range.START_TO_END, nodeRange) < 0
        );
    },

    _highlightPreferencesFromMark(mark) {
        if (!mark) {
            return window.LouAnnotationColors.getLastHighlightPreferences();
        }
        const style = window.LouAnnotationColors.readHighlightStyleFromElement(mark);
        return {
            colorId:
                mark.dataset.highlightColor ||
                window.LouAnnotationColors.getLastHighlightColorId(),
            bold: style.bold,
            underline: style.underline,
            strikethrough: style.strikethrough,
        };
    },

    _syncHighlightSidecar(mark) {
        if (!mark) {
            return;
        }
        const prefs = this._highlightPreferencesFromMark(mark);
        const id = mark.dataset.highlightId;
        window.LouAnnotationColors.setLastHighlightPreferences(prefs);
        if (id == null) {
            return;
        }
        window.LouAnnotationColors.setRecordColor("highlight", id, prefs.colorId);
        window.LouAnnotationColors.setRecordStyle("highlight", id, prefs);
    },

    _applyLiveHighlightUpdate(mark, toolbarState) {
        if (!mark || !toolbarState) {
            return;
        }
        const colorId =
            toolbarState.colorId ||
            mark.dataset.highlightColor ||
            window.LouAnnotationColors.getLastHighlightColorId();
        const formatState = window.LouAnnotationColors.normalizeFormatState(
            toolbarState
        );
        window.LouAnnotationColors.applyHighlightColor(
            mark,
            window.LouAnnotationColors.normalizeColorId(
                colorId,
                window.LouAnnotationColors.DEFAULT_HIGHLIGHT_ID
            )
        );
        window.LouAnnotationColors.applyHighlightStyle(mark, formatState);
        this._syncHighlightSidecar(mark);
    },

    _onHighlightToolbarIntent(state, detail) {
        const mark = this._editContext && this._editContext.mark;
        if (!mark || !state) {
            return;
        }
        if (detail && detail.kind === "erase") {
            void this._deleteHighlightMark(mark);
            return;
        }
        if (detail && detail.kind === "color" && !detail.colorId) {
            return;
        }
        this._applyLiveHighlightUpdate(mark, state);
    },

    _unwrapMark(mark) {
        const parent = mark && mark.parentNode;
        if (!parent) {
            return;
        }
        while (mark.firstChild) {
            parent.insertBefore(mark.firstChild, mark);
        }
        mark.remove();
        parent.normalize();
    },

    async _deleteHighlightMark(mark) {
        if (!mark) {
            return;
        }
        const id = mark.dataset.highlightId;
        this._unwrapMark(mark);
        this.dismissToolbar();
        if (id == null) {
            return;
        }
        window.LouAnnotationColors.removeRecordColor("highlight", id);
        const store = this._bindContext && this._bindContext.store;
        if (store && typeof store.deleteTextHighlight === "function") {
            try {
                await store.deleteTextHighlight(Number(id));
            } catch (err) {
                console.warn("[LouTextHighlights] Highlight delete failed.", err);
            }
        }
    },

    _setHighlightEditingMark(mark) {
        this._clearHighlightEditVisual();
        this._editContext = mark ? { mark: mark } : null;
        if (mark) {
            mark.classList.add(this.EDITING_CLASS);
        }
    },

    _clearHighlightEditVisual() {
        if (this._editContext && this._editContext.mark) {
            this._editContext.mark.classList.remove(this.EDITING_CLASS);
        }
    },

    _openHighlightToolbar(mark) {
        const self = this;
        const rect = mark.getBoundingClientRect();
        window.LouAnnotationController.openForHighlight({
            ariaLabel: "Surlignage et mise en forme",
            state: this._highlightPreferencesFromMark(mark),
            rect: {
                left: rect.left,
                top: rect.top,
                width: Math.max(rect.width, 1),
                height: Math.max(rect.height, 1),
                right: rect.right,
                bottom: rect.bottom,
            },
            preferAbove: true,
            onIntent: function (state, detail) {
                self._onHighlightToolbarIntent(state, detail);
            },
        });
    },

    _beginHighlightEdit(mark, host, context) {
        this._setHighlightEditingMark(mark);
        this._openHighlightToolbar(mark);
    },

    _resolveProjection(ctx) {
        if (ctx.sourceProjection) {
            return ctx.sourceProjection;
        }
        if (
            window.LouRenderer &&
            window.LouRenderer.isCompositionContext(ctx.context)
        ) {
            return null;
        }
        return window.LouRenderer.resolveProjectionId(ctx.context, ctx.element);
    },

    async _createHighlightFromSelection(host, context, range, officialRoot, block) {
        const selector = this.selectorFromRange(officialRoot, range);
        if (!selector || !selector.exact) {
            this.dismissToolbar();
            return;
        }

        const prefs = window.LouAnnotationColors.getLastHighlightPreferences();
        const colorId = window.LouAnnotationColors.normalizeColorId(
            prefs.colorId,
            window.LouAnnotationColors.DEFAULT_HIGHLIGHT_ID
        );
        const formatState = window.LouAnnotationColors.normalizeFormatState(prefs);
        const mark = this.wrapRangeInMark(range, colorId, formatState);
        if (!mark) {
            this.dismissToolbar();
            return;
        }

        const store = context && context.store;
        const projection = this._resolveProjection({
            context: context,
            element: block.dataset.element,
            sourceProjection: block.dataset.sourceProjection || null,
        });
        if (!store || !context.chapter || !projection) {
            if (
                window.LouRenderer &&
                window.LouRenderer.isCompositionContext(context) &&
                !block.dataset.sourceProjection
            ) {
                console.warn(
                    "[LouTextHighlights] Composition highlight blocked: missing data-source-projection on block"
                );
            }
            mark.remove();
            this.dismissToolbar();
            return;
        }

        this._setHighlightEditingMark(mark);
        this._openHighlightToolbar(mark);

        try {
            const id = await store.addTextHighlight(
                context.chapter,
                projection,
                block.dataset.element,
                selector
            );
            if (!mark.isConnected) {
                return;
            }
            if (id != null) {
                mark.dataset.highlightId = String(id);
                this._syncHighlightSidecar(mark);
            }
        } catch (err) {
            if (mark.isConnected) {
                mark.remove();
            }
            this.dismissToolbar();
        }
    },

    dismissToolbar() {
        this._clearHighlightEditVisual();
        this._editContext = null;
        if (window.LouAnnotationController) {
            window.LouAnnotationController.dismissHighlight({
                clearSelection:
                    !window.LouAnnotationController.isNoteEditBlockingSelectionClear(),
            });
        }
    },

    _isSelectorSatisfiedInOfficialRoot(officialRoot, selector) {
        if (!officialRoot || !selector || !selector.exact) {
            return false;
        }
        const exact = String(selector.exact);
        const marks = officialRoot.querySelectorAll("." + this.HIGHLIGHT_CLASS);
        for (let i = 0; i < marks.length; i += 1) {
            if (marks[i].textContent.includes(exact)) {
                return true;
            }
        }
        return false;
    },

    _isSelectorSatisfiedInWalkthrough(walkthrough, selector) {
        return this._isSelectorSatisfiedInOfficialRoot(walkthrough, selector);
    },

    _findBlock(host, element, projectionId, composition) {
        if (projectionId) {
            const scoped = host.querySelector(
                '.pedagogical-block[data-element="' +
                    element +
                    '"][data-source-projection="' +
                    projectionId +
                    '"]'
            );
            if (scoped) {
                return scoped;
            }
        }
        if (composition) {
            return null;
        }
        return host.querySelector('.pedagogical-block[data-element="' + element + '"]');
    },

    _findRangeInBlock(block, selector) {
        const roots = window.LouAnnotationColors.officialRootsInBlock(block);
        for (let i = 0; i < roots.length; i += 1) {
            const range = this.findRangeForSelector(roots[i], selector);
            if (range) {
                return range;
            }
        }
        return null;
    },

    async restore(host, context) {
        const self = this;
        const projection = context.projection && context.projection.id;
        const composition =
            window.LouRenderer &&
            window.LouRenderer.isCompositionContext(context);
        if (!projection || !context.store.listTextHighlights) {
            return;
        }

        const rows = await context.store.listTextHighlights(
            context.chapter,
            projection
        );
        const orphans = [];
        const decide = window.LouLearnerOrphanDecision;

        rows.forEach(function (record) {
            if (decide && typeof decide.evaluateHighlight === "function") {
                const outcome = decide.evaluateHighlight(
                    host,
                    record,
                    projection,
                    composition,
                    self
                );
                if (outcome.decision === "orphan") {
                    orphans.push({ kind: "highlight", record: record });
                }
                return;
            }

            const block = self._findBlock(
                host,
                record.element,
                record.projection || projection,
                composition
            );
            if (!block) {
                orphans.push({ kind: "highlight", record: record });
                return;
            }
            const range = self._findRangeInBlock(block, record.selector);
            if (range && !self._rangeAlreadyHighlighted(range)) {
                const colorId =
                    window.LouAnnotationColors.getRecordColor(
                        "highlight",
                        record.id
                    ) || window.LouAnnotationColors.DEFAULT_HIGHLIGHT_ID;
                const formatState =
                    window.LouAnnotationColors.getRecordStyle(
                        "highlight",
                        record.id
                    ) || window.LouAnnotationColors.emptyFormatState();
                const mark = self.wrapRangeInMark(range, colorId, formatState);
                if (mark && record.id != null) {
                    mark.dataset.highlightId = String(record.id);
                }
                return;
            }
            if (!range) {
                const roots = window.LouAnnotationColors.officialRootsInBlock(block);
                let satisfied = false;
                for (let i = 0; i < roots.length; i += 1) {
                    if (
                        self._isSelectorSatisfiedInOfficialRoot(
                            roots[i],
                            record.selector
                        )
                    ) {
                        satisfied = true;
                        break;
                    }
                }
                if (satisfied) {
                    return;
                }
                orphans.push({ kind: "highlight", record: record });
            }
        });

        if (orphans.length && window.LouBlocks) {
            const filtered =
                decide && typeof decide.filterOrphans === "function"
                    ? decide.filterOrphans(
                          host,
                          orphans,
                          self,
                          window.LouInlineNotes
                      )
                    : orphans;
            if (filtered.length) {
                window.LouBlocks.appendAnnotationOrphans(host, filtered);
            }
        }
    },

    selectorFromRange(root, range) {
        const normalized = this._normalizeRangeEndpoints(root, range);
        if (!normalized) {
            return null;
        }
        const start = this._textOffset(
            root,
            normalized.startContainer,
            normalized.startOffset
        );
        const end = this._textOffset(
            root,
            normalized.endContainer,
            normalized.endOffset
        );
        if (start < 0 || end < 0 || start >= end) {
            return null;
        }
        const full = root.textContent;
        const exact = full.slice(start, end);
        return {
            type: "TextQuoteSelector",
            exact: exact,
            prefix: full.slice(Math.max(0, start - this.CONTEXT_CHARS), start),
            suffix: full.slice(end, Math.min(full.length, end + this.CONTEXT_CHARS)),
        };
    },

    _firstTextNodeInSubtree(node) {
        if (!node) {
            return null;
        }
        if (node.nodeType === Node.TEXT_NODE) {
            return node;
        }
        const walker = document.createTreeWalker(node, NodeFilter.SHOW_TEXT);
        return walker.nextNode();
    },

    _lastTextNodeInSubtree(node) {
        if (!node) {
            return null;
        }
        if (node.nodeType === Node.TEXT_NODE) {
            return node;
        }
        const walker = document.createTreeWalker(node, NodeFilter.SHOW_TEXT);
        let last = null;
        let current;
        while ((current = walker.nextNode())) {
            last = current;
        }
        return last;
    },

    _normalizeRangeEndpoints(root, range) {
        if (!root || !range) {
            return null;
        }
        const normalized = range.cloneRange();
        try {
            if (normalized.startContainer.nodeType === Node.ELEMENT_NODE) {
                const child = normalized.startContainer.childNodes[normalized.startOffset];
                const textNode = this._firstTextNodeInSubtree(child);
                if (!textNode || !root.contains(textNode)) {
                    return null;
                }
                normalized.setStart(textNode, 0);
            }
            if (normalized.endContainer.nodeType === Node.ELEMENT_NODE) {
                const child =
                    normalized.endOffset > 0
                        ? normalized.endContainer.childNodes[normalized.endOffset - 1]
                        : null;
                const textNode = this._lastTextNodeInSubtree(child);
                if (!textNode || !root.contains(textNode)) {
                    return null;
                }
                normalized.setEnd(textNode, textNode.textContent.length);
            }
            if (normalized.collapsed || !root.contains(normalized.commonAncestorContainer)) {
                return null;
            }
            return normalized;
        } catch (err) {
            return null;
        }
    },

    findRangeForSelector(root, selector) {
        if (!selector || !selector.exact) {
            return null;
        }
        const full = root.textContent;
        const exact = selector.exact;
        const prefix = selector.prefix || "";
        const suffix = selector.suffix || "";
        let idx = 0;

        while (idx <= full.length) {
            const pos = full.indexOf(exact, idx);
            if (pos < 0) {
                return null;
            }
            const before = full.slice(Math.max(0, pos - prefix.length), pos);
            const after = full.slice(
                pos + exact.length,
                pos + exact.length + suffix.length
            );
            if (before === prefix && after === suffix) {
                return this._rangeFromTextOffsets(root, pos, pos + exact.length);
            }
            idx = pos + 1;
        }
        return null;
    },

    wrapRangeInMark(range, colorId, formatState) {
        const colors = window.LouAnnotationColors;
        const resolvedColor = colors.normalizeColorId(
            colorId || colors.getLastHighlightColorId(),
            colors.DEFAULT_HIGHLIGHT_ID
        );
        const resolvedFormat = colors.normalizeFormatState(
            formatState || colors.emptyFormatState()
        );
        const mark = document.createElement("mark");
        mark.className = this.HIGHLIGHT_CLASS;
        mark.dataset.learner = "true";
        window.LouAnnotationColors.applyHighlightColor(mark, resolvedColor);
        window.LouAnnotationColors.applyHighlightStyle(mark, resolvedFormat);

        try {
            range.surroundContents(mark);
        } catch (err) {
            const fragment = range.extractContents();
            if (!fragment.textContent) {
                return null;
            }
            mark.appendChild(fragment);
            range.insertNode(mark);
        }
        return mark;
    },

    _forEachTextNode(root, fn) {
        const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
        let node;
        let offset = 0;
        while ((node = walker.nextNode())) {
            const len = node.textContent.length;
            fn(node, offset, len);
            offset += len;
        }
        return offset;
    },

    _textOffset(root, container, offsetInContainer) {
        let found = -1;
        this._forEachTextNode(root, function (node, start) {
            if (found >= 0) {
                return;
            }
            if (node === container) {
                found = start + offsetInContainer;
            }
        });
        return found;
    },

    _rangeAlreadyHighlighted(range) {
        const node = range.commonAncestorContainer;
        const el = node.nodeType === Node.ELEMENT_NODE ? node : node.parentElement;
        return !!(el && el.closest("." + this.HIGHLIGHT_CLASS));
    },

    _rangeFromTextOffsets(root, start, end) {
        const range = document.createRange();
        let startSet = false;
        let endSet = false;

        this._forEachTextNode(root, function (node, nodeStart, nodeLen) {
            const nodeEnd = nodeStart + nodeLen;
            if (!startSet && start < nodeEnd) {
                range.setStart(node, Math.max(0, start - nodeStart));
                startSet = true;
            }
            if (end > nodeStart && end <= nodeEnd) {
                range.setEnd(node, end - nodeStart);
                endSet = true;
            }
        });

        if (!startSet || !endSet || range.collapsed) {
            return null;
        }
        return range;
    },
};
