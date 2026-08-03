// Text selection highlights (Renderer V2.1).
//
// Learner-owned overlays on official walkthrough prose. Stored separately from generated content;
// applied after block assembly. Scoped to [data-official="true"] walkthrough containers.
window.LouTextHighlights = {
    LABEL: "Surligner",
    HIGHLIGHT_CLASS: "learner-highlight",
    CONTEXT_CHARS: 32,

    _toolbar: null,
    _toolbarRoot: null,
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
        if (this._boundHost === host) {
            return;
        }
        this._boundHost = host;
        this.dismissToolbar();

        host.addEventListener("mouseup", function (event) {
            if (event.target.closest(".highlight-toolbar")) {
                return;
            }
            window.requestAnimationFrame(function () {
                self._onSelectionChange(host, self._bindContext);
            });
        });

        document.addEventListener("keydown", function (event) {
            if (event.key === "Escape") {
                self.dismissToolbar();
            }
        });

        document.addEventListener("mousedown", function (event) {
            if (!self._toolbar || self._toolbar.contains(event.target)) {
                return;
            }
            self.dismissToolbar();
        });
    },

    _onSelectionChange(host, context) {
        const selection = window.getSelection();
        if (!selection || selection.isCollapsed || selection.rangeCount === 0) {
            this.dismissToolbar();
            return;
        }

        const range = selection.getRangeAt(0);
        const walkthrough = this._officialWalkthrough(range.commonAncestorContainer, host);
        if (!walkthrough || !walkthrough.contains(range.commonAncestorContainer)) {
            this.dismissToolbar();
            return;
        }
        if (this._selectionInsideHighlight(range)) {
            this.dismissToolbar();
            return;
        }

        const block = walkthrough.closest(".pedagogical-block");
        if (!block) {
            this.dismissToolbar();
            return;
        }

        this._selectionContext = {
            host: host,
            context: context,
            walkthrough: walkthrough,
            element: block.dataset.element,
            sourceProjection: block.dataset.sourceProjection || null,
            range: range.cloneRange(),
        };
        this._showToolbar(range);
    },

    _officialWalkthrough(node, host) {
        if (!node) {
            return null;
        }
        const el = node.nodeType === Node.ELEMENT_NODE ? node : node.parentElement;
        if (!el) {
            return null;
        }
        const walkthrough = el.closest("[data-official='true']");
        if (!walkthrough || !host.contains(walkthrough)) {
            return null;
        }
        return walkthrough;
    },

    _selectionInsideHighlight(range) {
        const node = range.commonAncestorContainer;
        const el = node.nodeType === Node.ELEMENT_NODE ? node : node.parentElement;
        return !!(el && el.closest("." + this.HIGHLIGHT_CLASS));
    },

    _showToolbar(range) {
        const rect = range.getBoundingClientRect();
        if (!rect.width && !rect.height) {
            return;
        }

        if (!this._toolbar) {
            const toolbar = document.createElement("div");
            toolbar.className = "highlight-toolbar";
            toolbar.setAttribute("role", "toolbar");
            toolbar.setAttribute("aria-label", "Surlignage");

            const button = document.createElement("button");
            button.type = "button";
            button.className = "highlight-toolbar-btn";
            button.textContent = this.LABEL;
            button.addEventListener("click", function () {
                LouTextHighlights._applyCurrentSelection();
            });
            toolbar.appendChild(button);
            this._toolbar = toolbar;
            document.body.appendChild(toolbar);
        }

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

    _applyCurrentSelection() {
        const ctx = this._selectionContext;
        if (!ctx) {
            return;
        }

        const range = ctx.range;
        const selector = this.selectorFromRange(ctx.walkthrough, range);
        if (!selector || !selector.exact) {
            this.dismissToolbar();
            return;
        }

        const wrapped = this.wrapRangeInMark(range);
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
        const self = this;
        store
            .addTextHighlight(ctx.context.chapter, projection, ctx.element, selector)
            .then(function () {
                self.dismissToolbar();
            })
            .catch(function () {
                wrapped.remove();
                self.dismissToolbar();
            });
    },

    _isSelectorSatisfiedInWalkthrough(walkthrough, selector) {
        if (!walkthrough || !selector || !selector.exact) {
            return false;
        }
        const exact = String(selector.exact);
        const marks = walkthrough.querySelectorAll("." + this.HIGHLIGHT_CLASS);
        for (let i = 0; i < marks.length; i += 1) {
            if (marks[i].textContent.includes(exact)) {
                return true;
            }
        }
        return false;
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
        rows.forEach(function (record) {
            const block = self._findBlock(
                host,
                record.element,
                projection,
                composition
            );
            if (!block) {
                orphans.push({ kind: "highlight", record: record });
                return;
            }
            const walkthrough = block.querySelector(".block-walkthrough");
            if (!walkthrough) {
                orphans.push({ kind: "highlight", record: record });
                return;
            }
            const range = self.findRangeForSelector(walkthrough, record.selector);
            if (range && !self._rangeAlreadyHighlighted(range)) {
                self.wrapRangeInMark(range);
                return;
            }
            if (!range) {
                if (
                    self._isSelectorSatisfiedInWalkthrough(
                        walkthrough,
                        record.selector
                    )
                ) {
                    return;
                }
                orphans.push({ kind: "highlight", record: record });
            }
        });
        if (orphans.length && window.LouBlocks) {
            window.LouBlocks.appendAnnotationOrphans(host, orphans);
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

    wrapRangeInMark(range) {
        const mark = document.createElement("mark");
        mark.className = this.HIGHLIGHT_CLASS;
        mark.dataset.learner = "true";

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

        // Global offsets are half-open [start, end). Using strict comparisons at node
        // boundaries avoids overwriting setEnd when end === nodeStart of a later node
        // (e.g. after prior marks split the walkthrough text nodes).
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
