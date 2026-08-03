// Text selection highlights (Renderer V2.1).
//
// Learner-owned overlays on official walkthrough prose. Stored separately from generated content;
// applied after block assembly. Scoped to [data-official="true"] pedagogical containers.
//
// Highlight edit (recolor / reformat existing marks) has never been implemented — create-only.
window.LouTextHighlights = {
    HIGHLIGHT_CLASS: "learner-highlight",
    CONTEXT_CHARS: 32,

    _boundHost: null,
    _bindContext: null,
    _selectionContext: null,

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
        if (this._selectionInsideHighlight(range)) {
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

        this._selectionContext = {
            host: host,
            context: context,
            officialRoot: officialRoot,
            element: block.dataset.element,
            sourceProjection: block.dataset.sourceProjection || null,
            range: range.cloneRange(),
        };
        this._showToolbar(range);
    },

    _selectionInsideHighlight(range) {
        const node = range.commonAncestorContainer;
        const el = node.nodeType === Node.ELEMENT_NODE ? node : node.parentElement;
        return !!(el && el.closest("." + this.HIGHLIGHT_CLASS));
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

    _showToolbar(range) {
        const self = this;
        const rect = range.getBoundingClientRect();
        window.LouAnnotationController.openForHighlight({
            ariaLabel: "Surlignage et mise en forme",
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
                if (detail && detail.kind === "color" && detail.colorId) {
                    self._applyCurrentSelection(state);
                }
            },
        });
    },

    dismissToolbar() {
        if (window.LouAnnotationController) {
            window.LouAnnotationController.dismissHighlight({
                clearSelection: !window.LouAnnotationController.isNoteEditBlockingSelectionClear(),
            });
        }
        this._selectionContext = null;
    },

    _applyCurrentSelection(toolbarState) {
        const ctx = this._selectionContext;
        if (!ctx || !toolbarState || !toolbarState.colorId) {
            return;
        }

        const colorId = toolbarState.colorId;
        const range = ctx.range;
        const selector = this.selectorFromRange(ctx.officialRoot, range);
        if (!selector || !selector.exact) {
            this.dismissToolbar();
            return;
        }

        const wrapped = this.wrapRangeInMark(range, colorId, toolbarState);
        if (!wrapped) {
            this.dismissToolbar();
            return;
        }

        const store = ctx.context.store;
        let projection = ctx.sourceProjection;
        if (!projection) {
            if (window.LouRenderer.isCompositionContext(ctx.context)) {
                console.warn(
                    "[LouTextHighlights] Composition highlight blocked: missing data-source-projection on block"
                );
                wrapped.remove();
                this.dismissToolbar();
                return;
            }
            projection = window.LouRenderer.resolveProjectionId(
                ctx.context,
                ctx.element
            );
        }
        if (!projection) {
            wrapped.remove();
            this.dismissToolbar();
            return;
        }
        const chosenColor = window.LouAnnotationColors.normalizeColorId(
            colorId,
            window.LouAnnotationColors.DEFAULT_HIGHLIGHT_ID
        );
        const formatState = window.LouAnnotationColors.normalizeFormatState(
            toolbarState
        );
        const self = this;
        store
            .addTextHighlight(ctx.context.chapter, projection, ctx.element, selector)
            .then(function (id) {
                if (id != null) {
                    window.LouAnnotationColors.setRecordColor(
                        "highlight",
                        id,
                        chosenColor
                    );
                    window.LouAnnotationColors.setRecordStyle(
                        "highlight",
                        id,
                        formatState
                    );
                    wrapped.dataset.highlightId = String(id);
                }
                self.dismissToolbar();
            })
            .catch(function () {
                wrapped.remove();
                self.dismissToolbar();
            });
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
        const start = this._textOffset(root, range.startContainer, range.startOffset);
        const end = this._textOffset(root, range.endContainer, range.endOffset);
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
        const mark = document.createElement("mark");
        mark.className = this.HIGHLIGHT_CLASS;
        mark.dataset.learner = "true";
        window.LouAnnotationColors.applyHighlightColor(mark, colorId);
        window.LouAnnotationColors.applyHighlightStyle(
            mark,
            formatState || window.LouAnnotationColors.emptyFormatState()
        );

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
