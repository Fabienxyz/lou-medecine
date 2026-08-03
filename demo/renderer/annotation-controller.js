// Annotation controller — single toolbar orchestrator (Annotation Toolbar Integration).
//
// Owns the sole LouAnnotationToolbar instance. Routes toolbar intents to Learner modules.
// Never touches store, patrimony, or CaretAnchor — presentation intents only.
window.LouAnnotationController = {
    CONTEXT_HIGHLIGHT: "highlight-create",
    CONTEXT_NOTE: "note-edit",

    _toolbar: null,
    _context: null,
    _highlightIntent: null,
    _noteIntent: null,

    _neutralState() {
        return {
            colorId: null,
            bold: false,
            underline: false,
            strikethrough: false,
        };
    },

    _ensureToolbar() {
        if (this._toolbar) {
            return this._toolbar;
        }
        const self = this;
        this._toolbar = window.LouAnnotationToolbar.create({
            ariaLabel: "Barre d'annotation",
            onStateChange: function (state, detail) {
                self._dispatchIntent(state, detail || {});
            },
        });
        return this._toolbar;
    },

    getToolbar() {
        return this._ensureToolbar();
    },

    getElement() {
        return this._ensureToolbar().element;
    },

    isToolbarTarget(target) {
        const root = this._toolbar && this._toolbar.element;
        return !!(root && target && root.contains(target));
    },

    getContext() {
        return this._context;
    },

    isNoteEditActive() {
        return this._context === this.CONTEXT_NOTE;
    },

    isHighlightCreateActive() {
        return this._context === this.CONTEXT_HIGHLIGHT;
    },

    isNoteEditBlockingSelectionClear() {
        return !!(
            window.LouInlineNotes &&
            window.LouInlineNotes._activeEditNote
        );
    },

    openForHighlight(options) {
        if (!options || typeof options.onIntent !== "function") {
            return;
        }
        this.dismissHighlight({ clearSelection: true });
        this._context = this.CONTEXT_HIGHLIGHT;
        this._highlightIntent = options.onIntent;
        const toolbar = this._ensureToolbar();
        if (options.ariaLabel) {
            toolbar.element.setAttribute("aria-label", options.ariaLabel);
        }
        if (options.colorLabelPrefix) {
            toolbar.element.dataset.colorLabelPrefix = options.colorLabelPrefix;
        }
        toolbar.setState(options.state || this._neutralState());
        toolbar.showNearRect(options.rect, options.preferAbove !== false);
    },

    openForNote(options) {
        if (!options || typeof options.onIntent !== "function") {
            return;
        }
        this.dismissHighlight({ clearSelection: false });
        this._context = this.CONTEXT_NOTE;
        this._noteIntent = options.onIntent;
        const toolbar = this._ensureToolbar();
        if (options.ariaLabel) {
            toolbar.element.setAttribute("aria-label", options.ariaLabel);
        }
        toolbar.setState(options.state || this._neutralState());
        if (options.rect) {
            toolbar.showNearRect(options.rect, options.preferAbove !== false);
        } else if (options.noteEl) {
            toolbar.showNearElement(options.noteEl, options.preferAbove !== false);
        }
    },

    dismissHighlight(options) {
        if (this._context !== this.CONTEXT_HIGHLIGHT) {
            return;
        }
        options = options || {};
        this._hideToolbar();
        this._context = null;
        this._highlightIntent = null;
        const clearSelection =
            options.clearSelection !== false &&
            !this.isNoteEditBlockingSelectionClear();
        if (clearSelection) {
            const selection = window.getSelection();
            if (selection) {
                selection.removeAllRanges();
            }
        }
    },

    dismissNote() {
        if (this._context !== this.CONTEXT_NOTE) {
            return;
        }
        this._hideToolbar();
        this._context = null;
        this._noteIntent = null;
    },

    dismissAll(options) {
        options = options || {};
        const preserveSelection = this.isNoteEditBlockingSelectionClear();
        if (this._context === this.CONTEXT_NOTE) {
            this.dismissNote();
        }
        if (this._context === this.CONTEXT_HIGHLIGHT) {
            this.dismissHighlight({
                clearSelection: !preserveSelection && options.clearSelection !== false,
            });
        } else if (
            !preserveSelection &&
            options.clearSelection !== false
        ) {
            const selection = window.getSelection();
            if (selection) {
                selection.removeAllRanges();
            }
        }
    },

    _hideToolbar() {
        if (this._toolbar) {
            this._toolbar.hide();
        }
    },

    _dispatchIntent(state, detail) {
        if (this._context === this.CONTEXT_HIGHLIGHT && this._highlightIntent) {
            this._highlightIntent(state, detail);
            return;
        }
        if (this._context === this.CONTEXT_NOTE && this._noteIntent) {
            this._noteIntent(state, detail);
        }
    },
};
