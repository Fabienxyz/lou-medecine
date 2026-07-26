// CaretAnchor primitives (Renderer V2.2).
//
// Official text stream anchoring for walkthrough notes. No UI, no persistence — low-level
// create/restore only. Marks are transparent wrappers; walkthrough-note subtrees are excluded.
window.LouCaretAnchor = {
    ANCHOR_TYPE: "CaretAnchor",
    ADDITIVE_CLASS: "walkthrough-note",
    CONTEXT_CHARS: 32,

    createCaretAnchor(walkthrough, container, offsetInContainer) {
        const offset = this._caretOffsetFromDomPoint(
            walkthrough,
            container,
            offsetInContainer
        );
        if (offset < 0) {
            return null;
        }
        const length = this._officialStreamLength(walkthrough);
        if (offset > length) {
            return null;
        }
        return this._anchorFromOffset(walkthrough, offset);
    },

    restoreCaretAnchor(walkthrough, anchor) {
        const offset = this._resolveAnchor(walkthrough, anchor);
        if (offset < 0) {
            return null;
        }
        return this._caretRangeFromOffset(walkthrough, offset);
    },

    _isAdditiveNode(node) {
        if (!node) {
            return false;
        }
        const el =
            node.nodeType === Node.ELEMENT_NODE ? node : node.parentElement;
        return !!(el && el.closest("." + this.ADDITIVE_CLASS));
    },

    _walkOfficialTextNodes(walkthrough, fn) {
        const self = this;
        const walker = document.createTreeWalker(
            walkthrough,
            NodeFilter.SHOW_TEXT,
            {
                acceptNode: function (node) {
                    if (self._isAdditiveNode(node)) {
                        return NodeFilter.FILTER_REJECT;
                    }
                    return NodeFilter.FILTER_ACCEPT;
                },
            }
        );
        let node;
        let offset = 0;
        while ((node = walker.nextNode())) {
            const len = node.textContent.length;
            fn(node, offset, len);
            offset += len;
        }
        return offset;
    },

    _officialStreamLength(walkthrough) {
        return this._walkOfficialTextNodes(walkthrough, function () {});
    },

    _officialStreamText(walkthrough) {
        let text = "";
        this._walkOfficialTextNodes(walkthrough, function (node) {
            text += node.textContent;
        });
        return text;
    },

    _officialStreamSlice(walkthrough, start, end) {
        return this._officialStreamText(walkthrough).slice(start, end);
    },

    _caretOffsetFromDomPoint(walkthrough, container, offsetInContainer) {
        if (this._isAdditiveNode(container)) {
            return -1;
        }
        if (container.nodeType === Node.ELEMENT_NODE) {
            const range = document.createRange();
            try {
                range.setStart(container, offsetInContainer);
                range.collapse(true);
                container = range.startContainer;
                offsetInContainer = range.startOffset;
            } catch (err) {
                return -1;
            }
        }
        if (container.nodeType !== Node.TEXT_NODE) {
            return -1;
        }
        if (this._isAdditiveNode(container)) {
            return -1;
        }

        let found = -1;
        this._walkOfficialTextNodes(walkthrough, function (node, start) {
            if (found >= 0) {
                return;
            }
            if (node === container) {
                found = start + offsetInContainer;
            }
        });
        return found;
    },

    _anchorFromOffset(walkthrough, offset) {
        return {
            type: this.ANCHOR_TYPE,
            offset: offset,
            prefix: this._officialStreamSlice(
                walkthrough,
                Math.max(0, offset - this.CONTEXT_CHARS),
                offset
            ),
            suffix: this._officialStreamSlice(
                walkthrough,
                offset,
                offset + this.CONTEXT_CHARS
            ),
        };
    },

    _resolveAnchor(walkthrough, anchor) {
        if (!anchor || anchor.type !== this.ANCHOR_TYPE) {
            return -1;
        }
        const full = this._officialStreamText(walkthrough);
        const prefix = anchor.prefix || "";
        const suffix = anchor.suffix || "";

        if (this._contextMatchesAt(full, anchor.offset, prefix, suffix)) {
            return anchor.offset;
        }

        for (let idx = 0; idx <= full.length; idx++) {
            if (idx === anchor.offset) {
                continue;
            }
            if (this._contextMatchesAt(full, idx, prefix, suffix)) {
                return idx;
            }
        }
        return -1;
    },

    _contextMatchesAt(full, pos, prefix, suffix) {
        if (pos < 0 || pos > full.length) {
            return false;
        }
        const before = full.slice(Math.max(0, pos - prefix.length), pos);
        const after = full.slice(pos, Math.min(full.length, pos + suffix.length));
        return before === prefix && after === suffix;
    },

    _caretRangeFromOffset(walkthrough, offset) {
        const range = document.createRange();
        let set = false;

        this._walkOfficialTextNodes(walkthrough, function (node, nodeStart, nodeLen) {
            const nodeEnd = nodeStart + nodeLen;
            if (!set && offset >= nodeStart && offset <= nodeEnd) {
                const local = offset - nodeStart;
                range.setStart(node, local);
                range.setEnd(node, local);
                set = true;
            }
        });

        if (!set) {
            return null;
        }
        return range;
    },
};
