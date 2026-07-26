// Learner-layer storage (IMPLEMENTATION_CONTRACT.md C.8; Renderer V2.1 highlights).
//
// Personal Diagrams and text-selection highlights are learner-owned. They live in the browser: they
// are not part of a chapter's artifact set, are not versioned with it, and are never stored in Git
// beside medical content. No generation, checking, grounding, reconciliation or packaging pass
// reads them, and nothing here interprets them — no vision model, no OCR, no text analysis.
//
// Personal Diagrams (C.8) and text-selection highlights (V2.1) get separate object stores rather
// than one table with a `kind` column, because they are distinct mechanisms with different payloads,
// anchors and durability.
window.LouLearnerStore = {
    DB_NAME: "lou-learner",
    DB_VERSION: 2,
    DIAGRAMS: "personal_diagrams",
    HIGHLIGHTS: "text_annotations",

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
};
