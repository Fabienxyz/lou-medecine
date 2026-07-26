// Learner-layer storage (IMPLEMENTATION_CONTRACT.md C.8; Renderer V2.1 highlights).
//
// Personal Diagrams and text-selection highlights are learner-owned. They live in the browser: they
// are not part of a chapter's artifact set, are not versioned with it, and are never stored in Git
// beside medical content. No generation, checking, grounding, reconciliation or packaging pass
// reads them, and nothing here interprets them — no vision model, no OCR, no text analysis.
//
// Personal Diagrams (C.8), text-selection highlights (V2.1), walkthrough notes (V2.2), and SVG text
// formats (V2.3) get separate object stores rather than one table with a `kind` column, because
// they are distinct mechanisms with different payloads, anchors and durability.
window.LouLearnerStore = {
    DB_NAME: "lou-learner",
    DB_VERSION: 4,
    DIAGRAMS: "personal_diagrams",
    HIGHLIGHTS: "text_annotations",
    WALKTHROUGH_NOTES: "walkthrough_notes",
    SVG_TEXT_FORMATS: "svg_text_formats",
    LEGACY_INLINE_NOTES: "inline_notes",

    SVG_TEXT_FORMAT_KINDS: [
        "bold",
        "italic",
        "underline",
        "strike",
        "textColor",
        "backgroundColor",
    ],

    SVG_TEXT_COLOR_PALETTE: [
        "#c0392b",
        "#2980b9",
        "#27ae60",
        "#8e44ad",
        "#d35400",
        "#1a1a1a",
    ],

    SVG_BACKGROUND_COLOR_PALETTE: [
        "#fff3bf",
        "#d3f9d8",
        "#cfe8ff",
        "#ffe0ef",
        "#ffe8cc",
    ],

    db: null,

    _invalidateConnection(db) {
        if (this.db === db) {
            this.db = null;
        }
        try {
            db.close();
        } catch (err) {
            // Connection may already be closing.
        }
    },

    _attachConnectionHandlers(db) {
        const self = this;
        db.onversionchange = function () {
            console.warn(
                "[LouLearnerStore] IndexedDB version change; closing stale connection."
            );
            self._invalidateConnection(db);
        };
    },

    open() {
        const self = this;
        if (this.db) {
            return Promise.resolve(this.db);
        }
        return new Promise(function (resolve, reject) {
            const request = indexedDB.open(self.DB_NAME, self.DB_VERSION);
            request.onupgradeneeded = function (event) {
                const db = request.result;
                if (!db.objectStoreNames.contains(self.DIAGRAMS)) {
                    db.createObjectStore(self.DIAGRAMS, {
                        keyPath: "id",
                        autoIncrement: true,
                    });
                }
                if (!db.objectStoreNames.contains(self.HIGHLIGHTS)) {
                    db.createObjectStore(self.HIGHLIGHTS, {
                        keyPath: "id",
                        autoIncrement: true,
                    });
                }
                if (!db.objectStoreNames.contains(self.WALKTHROUGH_NOTES)) {
                    db.createObjectStore(self.WALKTHROUGH_NOTES, {
                        keyPath: "id",
                        autoIncrement: true,
                    });
                }
                if (db.objectStoreNames.contains(self.LEGACY_INLINE_NOTES)) {
                    db.deleteObjectStore(self.LEGACY_INLINE_NOTES);
                }
                if (!db.objectStoreNames.contains(self.SVG_TEXT_FORMATS)) {
                    const formatStore = db.createObjectStore(self.SVG_TEXT_FORMATS, {
                        keyPath: "id",
                        autoIncrement: true,
                    });
                    formatStore.createIndex("chapter_projection", [
                        "chapter",
                        "projection",
                    ]);
                    formatStore.createIndex("chapter_projection_element", [
                        "chapter",
                        "projection",
                        "element",
                    ]);
                }
            };
            request.onblocked = function () {
                console.warn(
                    "[LouLearnerStore] IndexedDB upgrade blocked by another open connection."
                );
            };
            request.onsuccess = function () {
                const db = request.result;
                self._attachConnectionHandlers(db);
                self.db = db;
                resolve(self.db);
            };
            request.onerror = function () {
                reject(request.error);
            };
        });
    },

    _run(storeName, mode, action) {
        return this.open().then(function (db) {
            return new Promise(function (resolve, reject) {
                const request = action(
                    db.transaction(storeName, mode).objectStore(storeName)
                );
                request.onsuccess = function () {
                    resolve(request.result);
                };
                request.onerror = function () {
                    reject(request.error);
                };
            });
        });
    },

    _listForChapter(storeName, chapter) {
        return this._run(storeName, "readonly", function (store) {
            return store.getAll();
        }).then(function (rows) {
            return (rows || []).filter(function (row) {
                return row.chapter === chapter;
            });
        });
    },

    // C.8 — anchored to the Blueprint element, never to the Official Visual, so availability never
    // depends on a visual existing and a re-rendered visual never disturbs the learner's drawing.
    addPersonalDiagram(chapter, element, blob) {
        return this._run(this.DIAGRAMS, "readwrite", function (store) {
            return store.add({
                chapter: chapter,
                element: element,
                blob: blob,
                created: new Date().toISOString(),
            });
        });
    },

    listPersonalDiagrams(chapter) {
        return this._listForChapter(this.DIAGRAMS, chapter);
    },

    deletePersonalDiagram(id) {
        return this._run(this.DIAGRAMS, "readwrite", function (store) {
            return store.delete(id);
        });
    },

    // V2.1 — text-selection highlights; separate store, TextQuoteSelector anchoring (docs/renderer/08).
    addTextHighlight(chapter, projection, element, selector) {
        return this._run(this.HIGHLIGHTS, "readwrite", function (store) {
            return store.add({
                chapter: chapter,
                projection: projection,
                element: element,
                selector: selector,
                kind: "highlight",
                created: new Date().toISOString(),
            });
        });
    },

    listTextHighlights(chapter, projection) {
        return this._listForChapter(this.HIGHLIGHTS, chapter).then(function (rows) {
            return rows.filter(function (row) {
                return row.projection === projection;
            });
        });
    },

    // V2.2 — walkthrough notes; CaretAnchor in official text stream (renderer-v2.2-walkthrough-notes.md).
    addWalkthroughNote(chapter, projection, element, anchor, text) {
        if (!text || !String(text).trim()) {
            return Promise.reject(
                new Error("Walkthrough note text must be non-empty")
            );
        }
        return this._run(this.WALKTHROUGH_NOTES, "readwrite", function (store) {
            return store.add({
                chapter: chapter,
                projection: projection,
                element: element,
                anchor: anchor,
                text: text,
                created: new Date().toISOString(),
            });
        });
    },

    updateWalkthroughNote(id, text) {
        if (!text || !String(text).trim()) {
            return Promise.reject(
                new Error("Walkthrough note text must be non-empty")
            );
        }
        const self = this;
        return this.open().then(function (db) {
            return new Promise(function (resolve, reject) {
                const tx = db.transaction(self.WALKTHROUGH_NOTES, "readwrite");
                const store = tx.objectStore(self.WALKTHROUGH_NOTES);
                const getReq = store.get(id);
                getReq.onsuccess = function () {
                    const row = getReq.result;
                    if (!row) {
                        reject(new Error("Walkthrough note not found"));
                        return;
                    }
                    row.text = text;
                    row.updated = new Date().toISOString();
                    const putReq = store.put(row);
                    putReq.onsuccess = function () {
                        resolve();
                    };
                    putReq.onerror = function () {
                        reject(putReq.error);
                    };
                };
                getReq.onerror = function () {
                    reject(getReq.error);
                };
            });
        });
    },

    deleteWalkthroughNote(id) {
        return this._run(this.WALKTHROUGH_NOTES, "readwrite", function (store) {
            return store.delete(id);
        });
    },

    listWalkthroughNotes(chapter, projection) {
        return this._listForChapter(this.WALKTHROUGH_NOTES, chapter).then(
            function (rows) {
                return rows.filter(function (row) {
                    return row.projection === projection;
                });
            }
        );
    },

    _normalizeStreamText(value) {
        return String(value)
            .replace(/[\t\n\r ]+/g, " ")
            .trim();
    },

    _isNonEmptyString(value) {
        return typeof value === "string" && value.length > 0;
    },

    _isStreamPosition(value) {
        return (
            value != null &&
            typeof value === "object" &&
            Number.isInteger(value.position) &&
            value.position >= 0
        );
    },

    _validateSvgTextRangeAnchor(anchor) {
        if (
            anchor == null ||
            typeof anchor !== "object" ||
            anchor.type !== "SvgTextRangeAnchor"
        ) {
            throw new Error("SvgTextRangeAnchor type is required");
        }
        if (!this._isStreamPosition(anchor.start)) {
            throw new Error("SvgTextRangeAnchor start.position must be an integer >= 0");
        }
        if (!this._isStreamPosition(anchor.end)) {
            throw new Error("SvgTextRangeAnchor end.position must be an integer >= 0");
        }
        if (anchor.start.position >= anchor.end.position) {
            throw new Error(
                "SvgTextRangeAnchor start.position must be less than end.position"
            );
        }
        if (typeof anchor.prefix !== "string" || anchor.prefix.length > 32) {
            throw new Error("SvgTextRangeAnchor prefix must be a string of at most 32 characters");
        }
        if (typeof anchor.suffix !== "string" || anchor.suffix.length > 32) {
            throw new Error("SvgTextRangeAnchor suffix must be a string of at most 32 characters");
        }
        const exact = this._normalizeStreamText(anchor.exact);
        if (!exact) {
            throw new Error("SvgTextRangeAnchor exact must be non-empty after normalization");
        }
        return {
            type: "SvgTextRangeAnchor",
            start: { position: anchor.start.position },
            end: { position: anchor.end.position },
            exact: exact,
            prefix: anchor.prefix,
            suffix: anchor.suffix,
        };
    },

    _validateSvgTextFormatRecord(record) {
        if (record == null || typeof record !== "object") {
            throw new Error("SvgTextFormat record must be an object");
        }
        if (!this._isNonEmptyString(record.chapter)) {
            throw new Error("SvgTextFormat chapter is required");
        }
        if (!this._isNonEmptyString(record.projection)) {
            throw new Error("SvgTextFormat projection is required");
        }
        if (!this._isNonEmptyString(record.element)) {
            throw new Error("SvgTextFormat element is required");
        }
        if (!this._isNonEmptyString(record.assetPath)) {
            throw new Error("SvgTextFormat assetPath is required");
        }
        if (!this.SVG_TEXT_FORMAT_KINDS.includes(record.format)) {
            throw new Error("SvgTextFormat format is invalid");
        }
        if (record.anchor === undefined) {
            throw new Error("SvgTextFormat anchor is required");
        }
        record.anchor = this._validateSvgTextRangeAnchor(record.anchor);
        const format = record.format;
        if (format === "textColor") {
            const color =
                record.style && record.style.color != null
                    ? String(record.style.color)
                    : "";
            if (!this.SVG_TEXT_COLOR_PALETTE.includes(color)) {
                throw new Error("SvgTextFormat text color must be from the closed palette");
            }
            record.style = { color: color };
        } else if (format === "backgroundColor") {
            const backgroundColor =
                record.style && record.style.backgroundColor != null
                    ? String(record.style.backgroundColor)
                    : "";
            if (!this.SVG_BACKGROUND_COLOR_PALETTE.includes(backgroundColor)) {
                throw new Error(
                    "SvgTextFormat background color must be from the closed palette"
                );
            }
            record.style = { backgroundColor: backgroundColor };
        } else if (format != null && record.style != null) {
            throw new Error("SvgTextFormat style is only allowed for color formats");
        }
        return record;
    },

    // V2.3 — inline formatting on official SVG text (renderer-v2.3-inline-formatting.md).
    addSvgTextFormat(record) {
        let payload;
        try {
            payload = Object.assign({}, record);
            delete payload.id;
            delete payload.created;
            delete payload.updated;
            this._validateSvgTextFormatRecord(payload);
            payload.created = new Date().toISOString();
        } catch (err) {
            return Promise.reject(err);
        }
        return this._run(this.SVG_TEXT_FORMATS, "readwrite", function (store) {
            return store.add(payload);
        });
    },

    updateSvgTextFormat(id, partial) {
        if (partial == null || typeof partial !== "object") {
            return Promise.reject(new Error("SvgTextFormat update partial must be an object"));
        }
        const self = this;
        return this.open().then(function (db) {
            return new Promise(function (resolve, reject) {
                const tx = db.transaction(self.SVG_TEXT_FORMATS, "readwrite");
                const store = tx.objectStore(self.SVG_TEXT_FORMATS);
                const getReq = store.get(id);
                getReq.onsuccess = function () {
                    const existing = getReq.result;
                    if (!existing) {
                        reject(new Error("SvgTextFormat not found"));
                        return;
                    }
                    const merged = Object.assign({}, existing, partial, { id: existing.id });
                    try {
                        self._validateSvgTextFormatRecord(merged);
                    } catch (err) {
                        reject(err);
                        return;
                    }
                    merged.created = existing.created;
                    merged.updated = new Date().toISOString();
                    const putReq = store.put(merged);
                    putReq.onsuccess = function () {
                        resolve();
                    };
                    putReq.onerror = function () {
                        reject(putReq.error);
                    };
                };
                getReq.onerror = function () {
                    reject(getReq.error);
                };
            });
        });
    },

    deleteSvgTextFormat(id) {
        return this._run(this.SVG_TEXT_FORMATS, "readwrite", function (store) {
            return store.delete(id);
        });
    },

    listSvgTextFormats(chapter, projection, element) {
        const filterElement = arguments.length >= 3;
        return this._listForChapter(this.SVG_TEXT_FORMATS, chapter).then(function (rows) {
            return rows.filter(function (row) {
                if (row.projection !== projection) {
                    return false;
                }
                if (filterElement && row.element !== element) {
                    return false;
                }
                return true;
            });
        });
    },
};
