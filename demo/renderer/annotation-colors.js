// Annotation color palette — presentation layer (Product Polish V1).
// Soft reading colors + localStorage sidecar for per-record colors (no patrimony format change).
window.LouAnnotationColors = {
    STORAGE_KEY: "lou-annotation-color-prefs-v1",

    PALETTE: [
        {
            id: "yellow",
            label: "Jaune",
            highlight: "#fef9c3",
            swatch: "#fde68a",
            text: "#92400e",
        },
        {
            id: "green",
            label: "Vert",
            highlight: "#dcfce7",
            swatch: "#86efac",
            text: "#166534",
        },
        {
            id: "blue",
            label: "Bleu",
            highlight: "#dbeafe",
            swatch: "#93c5fd",
            text: "#1e40af",
        },
        {
            id: "pink",
            label: "Rose",
            highlight: "#fce7f3",
            swatch: "#f9a8d4",
            text: "#9d174d",
        },
        {
            id: "violet",
            label: "Violet",
            highlight: "#ede9fe",
            swatch: "#c4b5fd",
            text: "#5b21b6",
        },
    ],

    DEFAULT_HIGHLIGHT_ID: "yellow",
    DEFAULT_NOTE_ID: "blue",

    CHROME_SELECTORS:
        ".learner-affordance, .diagram-affordance, .note-affordance, .shell-breadcrumb, .tabs, .tab, " +
        ".shell-actions, .shell-chrome, .local-search-root, .display-preferences-popover, " +
        ".annotation-color-palette, .highlight-toolbar, .inline-notes-context-menu",

    getById(colorId) {
        const id = String(colorId || "");
        for (let i = 0; i < this.PALETTE.length; i += 1) {
            if (this.PALETTE[i].id === id) {
                return this.PALETTE[i];
            }
        }
        return null;
    },

    normalizeColorId(colorId, fallbackId) {
        return this.getById(colorId) ? String(colorId) : fallbackId;
    },

    officialRootsInBlock(block) {
        if (!block) {
            return [];
        }
        const roots = [];
        const question = block.querySelector('.block-question[data-official="true"]');
        const walkthrough = block.querySelector(
            '.block-walkthrough[data-official="true"]'
        );
        if (question) {
            roots.push(question);
        }
        if (walkthrough) {
            roots.push(walkthrough);
        }
        return roots;
    },

    annotatableRoot(node, host) {
        if (!node || !host) {
            return null;
        }
        const el =
            node.nodeType === Node.ELEMENT_NODE ? node : node.parentElement;
        if (!el || !host.contains(el)) {
            return null;
        }
        if (el.closest(this.CHROME_SELECTORS)) {
            return null;
        }
        const official = el.closest('[data-official="true"]');
        if (!official || !host.contains(official)) {
            return null;
        }
        if (!official.closest(".pedagogical-block")) {
            return null;
        }
        return official;
    },

    applyHighlightColor(mark, colorId) {
        if (!mark) {
            return;
        }
        const color = this.getById(
            this.normalizeColorId(colorId, this.DEFAULT_HIGHLIGHT_ID)
        );
        mark.dataset.highlightColor = color.id;
        mark.style.backgroundColor = color.highlight;
        mark.style.color = "inherit";
    },

    applyNoteColor(noteEl, colorId) {
        if (!noteEl) {
            return;
        }
        const color = this.getById(
            this.normalizeColorId(colorId, this.DEFAULT_NOTE_ID)
        );
        noteEl.dataset.noteColor = color.id;
        noteEl.style.color = color.text;
    },

    _readStore() {
        try {
            const raw = window.localStorage.getItem(this.STORAGE_KEY);
            if (!raw) {
                return {
                    lastHighlight: this.DEFAULT_HIGHLIGHT_ID,
                    lastNote: this.DEFAULT_NOTE_ID,
                    highlights: {},
                    notes: {},
                };
            }
            const parsed = JSON.parse(raw);
            return {
                lastHighlight: this.normalizeColorId(
                    parsed.lastHighlight,
                    this.DEFAULT_HIGHLIGHT_ID
                ),
                lastNote: this.normalizeColorId(
                    parsed.lastNote,
                    this.DEFAULT_NOTE_ID
                ),
                highlights:
                    parsed.highlights && typeof parsed.highlights === "object"
                        ? parsed.highlights
                        : {},
                notes:
                    parsed.notes && typeof parsed.notes === "object"
                        ? parsed.notes
                        : {},
            };
        } catch (err) {
            return {
                lastHighlight: this.DEFAULT_HIGHLIGHT_ID,
                lastNote: this.DEFAULT_NOTE_ID,
                highlights: {},
                notes: {},
            };
        }
    },

    _writeStore(store) {
        try {
            window.localStorage.setItem(this.STORAGE_KEY, JSON.stringify(store));
        } catch (err) {
            /* presentation preference — ignore quota errors */
        }
    },

    getLastHighlightColorId() {
        return this._readStore().lastHighlight;
    },

    setLastHighlightColorId(colorId) {
        const store = this._readStore();
        store.lastHighlight = this.normalizeColorId(
            colorId,
            this.DEFAULT_HIGHLIGHT_ID
        );
        this._writeStore(store);
    },

    getLastNoteColorId() {
        return this._readStore().lastNote;
    },

    setLastNoteColorId(colorId) {
        const store = this._readStore();
        store.lastNote = this.normalizeColorId(colorId, this.DEFAULT_NOTE_ID);
        this._writeStore(store);
    },

    getRecordColor(kind, recordId) {
        if (recordId == null) {
            return null;
        }
        const store = this._readStore();
        const key = String(recordId);
        const bucket =
            kind === "note" ? store.notes : store.highlights;
        const colorId = bucket[key];
        return colorId ? this.normalizeColorId(colorId, null) : null;
    },

    setRecordColor(kind, recordId, colorId) {
        if (recordId == null) {
            return;
        }
        const normalized = this.getById(colorId);
        if (!normalized) {
            return;
        }
        const store = this._readStore();
        const key = String(recordId);
        if (kind === "note") {
            store.notes[key] = normalized.id;
            store.lastNote = normalized.id;
        } else {
            store.highlights[key] = normalized.id;
            store.lastHighlight = normalized.id;
        }
        this._writeStore(store);
    },

    removeRecordColor(kind, recordId) {
        if (recordId == null) {
            return;
        }
        const store = this._readStore();
        const key = String(recordId);
        if (kind === "note") {
            delete store.notes[key];
        } else {
            delete store.highlights[key];
        }
        this._writeStore(store);
    },
};
