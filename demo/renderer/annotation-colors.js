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
        ".annotation-toolbar, .highlight-toolbar, .inline-notes-context-menu, .figure-zoom-trigger",

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

    // Sidecar stores three booleans (backward compatible). Exactly one may be true.
    // Legacy entries with multiple flags are coerced on read: bold > underline > strikethrough.
    STYLE_NORMAL: "normal",
    STYLE_BOLD: "bold",
    STYLE_UNDERLINE: "underline",
    STYLE_STRIKETHROUGH: "strikethrough",

    emptyFormatState() {
        return { bold: false, underline: false, strikethrough: false };
    },

    normalizeFormatState(raw) {
        const base = this.emptyFormatState();
        if (!raw || typeof raw !== "object") {
            return base;
        }
        if (raw.bold) {
            base.bold = true;
            return base;
        }
        if (raw.underline) {
            base.underline = true;
            return base;
        }
        if (raw.strikethrough) {
            base.strikethrough = true;
            return base;
        }
        return base;
    },

    formatStateToStyleId(state) {
        const normalized = this.normalizeFormatState(state);
        if (normalized.bold) {
            return this.STYLE_BOLD;
        }
        if (normalized.underline) {
            return this.STYLE_UNDERLINE;
        }
        if (normalized.strikethrough) {
            return this.STYLE_STRIKETHROUGH;
        }
        return this.STYLE_NORMAL;
    },

    formatStateFromStyleId(styleId) {
        const base = this.emptyFormatState();
        if (styleId === this.STYLE_BOLD) {
            base.bold = true;
        } else if (styleId === this.STYLE_UNDERLINE) {
            base.underline = true;
        } else if (styleId === this.STYLE_STRIKETHROUGH) {
            base.strikethrough = true;
        }
        return base;
    },

    _applyExclusiveTypography(el, state) {
        if (state.bold) {
            el.style.fontWeight = "700";
            el.style.textDecoration = "";
            return;
        }
        if (state.underline) {
            el.style.fontWeight = "";
            el.style.textDecoration = "underline";
            return;
        }
        if (state.strikethrough) {
            el.style.fontWeight = "";
            el.style.textDecoration = "line-through";
            return;
        }
        el.style.fontWeight = "";
        el.style.textDecoration = "";
    },

    applyHighlightStyle(mark, formatState) {
        if (!mark) {
            return;
        }
        const state = this.normalizeFormatState(formatState);
        this._applyExclusiveTypography(mark, state);
    },

    applyNoteStyle(noteEl, formatState) {
        if (!noteEl) {
            return;
        }
        const state = this.normalizeFormatState(formatState);
        noteEl.dataset.noteBold = state.bold ? "true" : "false";
        noteEl.dataset.noteUnderline = state.underline ? "true" : "false";
        noteEl.dataset.noteStrikethrough = state.strikethrough ? "true" : "false";
        this._applyExclusiveTypography(noteEl, state);
    },

    readNoteStyleFromElement(noteEl) {
        if (!noteEl) {
            return this.emptyFormatState();
        }
        return this.normalizeFormatState({
            bold: noteEl.dataset.noteBold === "true",
            underline: noteEl.dataset.noteUnderline === "true",
            strikethrough: noteEl.dataset.noteStrikethrough === "true",
        });
    },

    readHighlightStyleFromElement(mark) {
        if (!mark) {
            return this.emptyFormatState();
        }
        const weight = mark.style.fontWeight || "";
        const deco = mark.style.textDecoration || "";
        return this.normalizeFormatState({
            bold: weight === "700" || weight === "bold",
            underline: deco.includes("underline"),
            strikethrough: deco.includes("line-through"),
        });
    },

    _readStore() {
        try {
            const raw = window.localStorage.getItem(this.STORAGE_KEY);
            if (!raw) {
                return this._emptyStore();
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
                lastNoteStyle: this.normalizeFormatState(parsed.lastNoteStyle),
                highlights:
                    parsed.highlights && typeof parsed.highlights === "object"
                        ? parsed.highlights
                        : {},
                notes:
                    parsed.notes && typeof parsed.notes === "object"
                        ? parsed.notes
                        : {},
                highlightStyles:
                    parsed.highlightStyles &&
                    typeof parsed.highlightStyles === "object"
                        ? parsed.highlightStyles
                        : {},
                noteStyles:
                    parsed.noteStyles && typeof parsed.noteStyles === "object"
                        ? parsed.noteStyles
                        : {},
            };
        } catch (err) {
            return this._emptyStore();
        }
    },

    _emptyStore() {
        return {
            lastHighlight: this.DEFAULT_HIGHLIGHT_ID,
            lastNote: this.DEFAULT_NOTE_ID,
            lastNoteStyle: this.emptyFormatState(),
            highlights: {},
            notes: {},
            highlightStyles: {},
            noteStyles: {},
        };
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
            delete store.noteStyles[key];
        } else {
            delete store.highlights[key];
            delete store.highlightStyles[key];
        }
        this._writeStore(store);
    },

    getLastNoteStyle() {
        return this.normalizeFormatState(this._readStore().lastNoteStyle);
    },

    setLastNoteStyle(formatState) {
        const store = this._readStore();
        store.lastNoteStyle = this.normalizeFormatState(formatState);
        this._writeStore(store);
    },

    getLastNotePreferences() {
        const store = this._readStore();
        return {
            colorId: store.lastNote,
            bold: store.lastNoteStyle.bold,
            underline: store.lastNoteStyle.underline,
            strikethrough: store.lastNoteStyle.strikethrough,
        };
    },

    setLastNotePreferences(prefs) {
        if (!prefs || typeof prefs !== "object") {
            return;
        }
        if (prefs.colorId != null) {
            this.setLastNoteColorId(prefs.colorId);
        }
        this.setLastNoteStyle({
            bold: prefs.bold,
            underline: prefs.underline,
            strikethrough: prefs.strikethrough,
        });
    },

    getRecordStyle(kind, recordId) {
        if (recordId == null) {
            return null;
        }
        const store = this._readStore();
        const key = String(recordId);
        const bucket =
            kind === "note" ? store.noteStyles : store.highlightStyles;
        const raw = bucket[key];
        return raw ? this.normalizeFormatState(raw) : null;
    },

    setRecordStyle(kind, recordId, formatState) {
        if (recordId == null) {
            return;
        }
        const store = this._readStore();
        const key = String(recordId);
        const normalized = this.normalizeFormatState(formatState);
        if (kind === "note") {
            store.noteStyles[key] = normalized;
            store.lastNoteStyle = normalized;
        } else {
            store.highlightStyles[key] = normalized;
        }
        this._writeStore(store);
    },

    applyNotePreferences(noteEl, prefs) {
        if (!noteEl || !prefs) {
            return;
        }
        this.applyNoteColor(noteEl, prefs.colorId);
        this.applyNoteStyle(noteEl, prefs);
    },
};
