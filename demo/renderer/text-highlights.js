// Text selection highlights (Renderer V2.1).
//
// Learner-owned overlays on official walkthrough prose. Stored separately from generated content;
// applied after block assembly. Selection UI lives in selection-annotations.js.
window.LouTextHighlights = {
    LABEL: "Surligner",
    HIGHLIGHT_CLASS: "learner-highlight",
    CONTEXT_CHARS: 32,

    async restore(host, context) {
        const self = this;
        const projection = context.projection && context.projection.id;
        if (!projection || !context.store.listTextHighlights) {
            return;
        }

        const rows = await context.store.listTextHighlights(
            context.chapter,
            projection
        );
        rows.forEach(function (record) {
            const block = host.querySelector(
                '.pedagogical-block[data-element="' + record.element + '"]'
            );
            if (!block) {
                return;
            }
            const walkthrough = block.querySelector(".block-walkthrough");
            if (!walkthrough) {
                return;
            }
            const range = self.findRangeForSelector(walkthrough, record.selector);
            if (range) {
                self.wrapRangeInMark(range);
            }
        });
    },

    applyHighlight(walkthrough, range, context, element) {
        const selector = this.selectorFromRange(walkthrough, range);
        if (!selector || !selector.exact) {
            return null;
        }

        const wrapped = this.wrapRangeInMark(range);
        if (!wrapped) {
            return null;
        }

        const projection = context.projection && context.projection.id;
        context.store
            .addTextHighlight(context.chapter, projection, element, selector)
            .catch(function () {
                wrapped.remove();
            });

        return wrapped;
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

    _rangeFromTextOffsets(root, start, end) {
        const range = document.createRange();
        let started = false;

        this._forEachTextNode(root, function (node, nodeStart, nodeLen) {
            const nodeEnd = nodeStart + nodeLen;
            if (!started && start >= nodeStart && start <= nodeEnd) {
                range.setStart(node, Math.min(nodeLen, start - nodeStart));
                started = true;
            }
            if (started) {
                if (end >= nodeStart && end <= nodeEnd) {
                    range.setEnd(node, Math.min(nodeLen, end - nodeStart));
                }
            }
        });

        if (!started || range.collapsed) {
            return null;
        }
        return range;
    },
};
