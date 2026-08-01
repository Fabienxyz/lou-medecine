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
//
// Lot E-B — all Release-scoped patrimonial writes carry release_id + schema_version
// (LEARNER-PATRIMONY-COMPONENT-CONTRACT.md).
if (!window.LouLearnerPatrimony) {
    throw new Error(
        "[LouLearnerStore] learner-patrimony.js must load before learner-store.js"
    );
}
window.LouLearnerStore = {
    DB_NAME: "lou-learner",
    DB_VERSION: 8,
    DIAGRAMS: "personal_diagrams",
    HIGHLIGHTS: "text_annotations",
    WALKTHROUGH_NOTES: "walkthrough_notes",
    SVG_TEXT_FORMATS: "svg_text_formats",
    SESSION_RESUME: "session_resume",
    DISPLAY_PREFERENCES: "display_preferences",
    LEGACY_INLINE_NOTES: "inline_notes",
    META: "patrimony_meta",
    MIGRATION_V5_KEY: "migration_v5",
    MIGRATION_V6_KEY: "migration_v6",

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
    _releaseContext: null,
    _migrationPromise: null,

    /**
     * @param {{ releaseId: string, chapter: string }} ctx
     */
    setReleaseContext(ctx) {
        if (
            !ctx ||
            typeof ctx.releaseId !== "string" ||
            !ctx.releaseId ||
            typeof ctx.chapter !== "string" ||
            !ctx.chapter
        ) {
            throw new Error("Release context requires releaseId and chapter");
        }
        this._releaseContext = {
            releaseId: ctx.releaseId,
            chapter: ctx.chapter,
        };
    },

    getReleaseContext() {
        return this._releaseContext
            ? {
                  releaseId: this._releaseContext.releaseId,
                  chapter: this._releaseContext.chapter,
              }
            : null;
    },

    clearReleaseContext() {
        this._releaseContext = null;
    },

    RELEASE_SCOPED_STORES: [
        "personal_diagrams",
        "text_annotations",
        "walkthrough_notes",
        "svg_text_formats",
    ],

    APPLICATION_SCOPED_STORES: ["session_resume", "display_preferences"],

    _isProductMode() {
        return (
            window.LouConfig &&
            typeof window.LouConfig.isProductMode === "function" &&
            window.LouConfig.isProductMode()
        );
    },

    _patrimonyOptions() {
        return {
            releaseContext: this._releaseContext,
            requireCatalogRelease: this._isProductMode(),
        };
    },

    _migrationPatrimonyOptions() {
        return {
            releaseContext: this._releaseContext,
            requireCatalogRelease: false,
        };
    },

    _resolveReleaseIdForChapter(chapter) {
        return window.LouLearnerPatrimony.resolveReleaseIdForChapter(
            chapter,
            this._patrimonyOptions()
        );
    },

    _stampPatrimonyRecord(chapter, record) {
        return window.LouLearnerPatrimony.stampPatrimonyRecord(
            chapter,
            record,
            this._patrimonyOptions()
        );
    },

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

    _ensureSvgTextFormatIndexes(store) {
        if (!store.indexNames.contains("chapter_projection")) {
            store.createIndex("chapter_projection", ["chapter", "projection"]);
        }
        if (!store.indexNames.contains("chapter_projection_element")) {
            store.createIndex("chapter_projection_element", [
                "chapter",
                "projection",
                "element",
            ]);
        }
        if (!store.indexNames.contains("release_id")) {
            store.createIndex("release_id", "release_id", { unique: false });
        }
    },

    _ensureLogicalRecordIdIndex(store) {
        if (!store.indexNames.contains("logical_record_id")) {
            store.createIndex("logical_record_id", "logical_record_id", {
                unique: true,
            });
        }
    },

    _domainIdForStore(storeName) {
        return window.LouLearnerPatrimony.STORE_TO_DOMAIN[storeName] || null;
    },

    _deriveLogicalRecordIdForRow(storeName, row) {
        const domainId = this._domainIdForStore(storeName);
        if (!domainId || row == null || row.id == null) {
            return null;
        }
        return window.LouLearnerPatrimony.deriveLogicalRecordId(
            domainId,
            row.release_id,
            row.id
        );
    },

    _runPatrimonyMigrationV6(db) {
        const self = this;
        const storeNames = self.RELEASE_SCOPED_STORES;

        return storeNames.reduce(function (chain, storeName) {
            return chain.then(function () {
                if (!db.objectStoreNames.contains(storeName)) {
                    return undefined;
                }
                return self._backfillLogicalRecordIds(db, storeName);
            });
        }, Promise.resolve());
    },

    _backfillLogicalRecordIds(db, storeName) {
        const self = this;
        return new Promise(function (resolve, reject) {
            const tx = db.transaction(storeName, "readwrite");
            const store = tx.objectStore(storeName);
            const cursorReq = store.openCursor();

            cursorReq.onsuccess = function () {
                const cursor = cursorReq.result;
                if (!cursor) {
                    return;
                }
                const row = cursor.value;
                if (
                    !row.logical_record_id ||
                    typeof row.logical_record_id !== "string"
                ) {
                    const logicalRecordId = self._deriveLogicalRecordIdForRow(
                        storeName,
                        row
                    );
                    if (logicalRecordId) {
                        row.logical_record_id = logicalRecordId;
                        cursor.update(row);
                    }
                }
                cursor.continue();
            };

            tx.oncomplete = function () {
                resolve();
            };
            tx.onerror = function () {
                reject(tx.error);
            };
            tx.onabort = function () {
                reject(tx.error || new Error("Patrimony v6 migration aborted"));
            };
            cursorReq.onerror = function () {
                reject(cursorReq.error);
            };
        });
    },

    _runPatrimonyMigrationV5(db) {
        const self = this;
        const options = this._migrationPatrimonyOptions();
        const storeNames = self.RELEASE_SCOPED_STORES;

        return storeNames.reduce(function (chain, storeName) {
            return chain.then(function () {
                if (!db.objectStoreNames.contains(storeName)) {
                    return undefined;
                }
                return self._migrateStoreRecords(db, storeName, options);
            });
        }, Promise.resolve());
    },

    _migrateStoreRecords(db, storeName, options) {
        const self = this;
        return new Promise(function (resolve, reject) {
            const tx = db.transaction(storeName, "readwrite");
            const store = tx.objectStore(storeName);
            const cursorReq = store.openCursor();

            cursorReq.onsuccess = function () {
                const cursor = cursorReq.result;
                if (!cursor) {
                    return;
                }
                const row = cursor.value;
                if (window.LouLearnerPatrimony.needsPatrimonyMigration(row)) {
                    const migrated = window.LouLearnerPatrimony.migratePatrimonyRow(
                        Object.assign({}, row),
                        options
                    );
                    cursor.update(migrated);
                }
                cursor.continue();
            };

            tx.oncomplete = function () {
                resolve();
            };
            tx.onerror = function () {
                reject(tx.error);
            };
            tx.onabort = function () {
                reject(tx.error || new Error("Patrimony migration transaction aborted"));
            };
            cursorReq.onerror = function () {
                reject(cursorReq.error);
            };
        });
    },

    _readMeta(db, key) {
        return new Promise(function (resolve, reject) {
            if (!db.objectStoreNames.contains("patrimony_meta")) {
                resolve(null);
                return;
            }
            const tx = db.transaction("patrimony_meta", "readonly");
            const req = tx.objectStore("patrimony_meta").get(key);
            req.onsuccess = function () {
                resolve(req.result || null);
            };
            req.onerror = function () {
                reject(req.error);
            };
        });
    },

    _writeMeta(db, key, value) {
        return new Promise(function (resolve, reject) {
            const tx = db.transaction("patrimony_meta", "readwrite");
            const req = tx.objectStore("patrimony_meta").put(
                Object.assign({ key: key }, value)
            );
            req.onsuccess = function () {
                resolve();
            };
            req.onerror = function () {
                reject(req.error);
            };
        });
    },

    _ensurePatrimonyMigrationComplete(db) {
        const self = this;
        if (this._migrationPromise) {
            return this._migrationPromise;
        }
        this._migrationPromise = this._readMeta(db, this.MIGRATION_V5_KEY)
            .then(function (meta) {
                if (meta && meta.completed === true) {
                    return undefined;
                }
                return self._runPatrimonyMigrationV5(db).then(function () {
                    return self._writeMeta(db, self.MIGRATION_V5_KEY, {
                        completed: true,
                        completedAt: new Date().toISOString(),
                        targetDbVersion: 5,
                        recordSchemaVersion:
                            window.LouLearnerPatrimony.PATRIMONY_RECORD_SCHEMA_VERSION,
                    });
                });
            })
            .then(function () {
                return self._readMeta(db, self.MIGRATION_V6_KEY);
            })
            .then(function (meta) {
                if (meta && meta.completed === true) {
                    return undefined;
                }
                return self._runPatrimonyMigrationV6(db).then(function () {
                    return self._writeMeta(db, self.MIGRATION_V6_KEY, {
                        completed: true,
                        completedAt: new Date().toISOString(),
                        targetDbVersion: self.DB_VERSION,
                        logicalRecordIdIndex: true,
                    });
                });
            })
            .finally(function () {
                self._migrationPromise = null;
            });
        return this._migrationPromise;
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
                    const diagramStore = db.createObjectStore(self.DIAGRAMS, {
                        keyPath: "id",
                        autoIncrement: true,
                    });
                    self._ensureLogicalRecordIdIndex(diagramStore);
                } else if (event.oldVersion > 0 && event.oldVersion < 6) {
                    self._ensureLogicalRecordIdIndex(
                        request.transaction.objectStore(self.DIAGRAMS)
                    );
                }
                if (!db.objectStoreNames.contains(self.HIGHLIGHTS)) {
                    const highlightStore = db.createObjectStore(self.HIGHLIGHTS, {
                        keyPath: "id",
                        autoIncrement: true,
                    });
                    self._ensureLogicalRecordIdIndex(highlightStore);
                } else if (event.oldVersion > 0 && event.oldVersion < 6) {
                    self._ensureLogicalRecordIdIndex(
                        request.transaction.objectStore(self.HIGHLIGHTS)
                    );
                }
                if (!db.objectStoreNames.contains(self.WALKTHROUGH_NOTES)) {
                    const noteStore = db.createObjectStore(self.WALKTHROUGH_NOTES, {
                        keyPath: "id",
                        autoIncrement: true,
                    });
                    self._ensureLogicalRecordIdIndex(noteStore);
                } else if (event.oldVersion > 0 && event.oldVersion < 6) {
                    self._ensureLogicalRecordIdIndex(
                        request.transaction.objectStore(self.WALKTHROUGH_NOTES)
                    );
                }
                if (db.objectStoreNames.contains(self.LEGACY_INLINE_NOTES)) {
                    db.deleteObjectStore(self.LEGACY_INLINE_NOTES);
                }
                if (!db.objectStoreNames.contains(self.SVG_TEXT_FORMATS)) {
                    const formatStore = db.createObjectStore(self.SVG_TEXT_FORMATS, {
                        keyPath: "id",
                        autoIncrement: true,
                    });
                    self._ensureSvgTextFormatIndexes(formatStore);
                    self._ensureLogicalRecordIdIndex(formatStore);
                } else if (event.oldVersion > 0 && event.oldVersion < 5) {
                    const formatStore = request.transaction.objectStore(
                        self.SVG_TEXT_FORMATS
                    );
                    self._ensureSvgTextFormatIndexes(formatStore);
                }
                if (event.oldVersion > 0 && event.oldVersion < 6) {
                    if (db.objectStoreNames.contains(self.SVG_TEXT_FORMATS)) {
                        self._ensureLogicalRecordIdIndex(
                            request.transaction.objectStore(self.SVG_TEXT_FORMATS)
                        );
                    }
                }
                if (!db.objectStoreNames.contains(self.META)) {
                    db.createObjectStore(self.META, { keyPath: "key" });
                }
                if (!db.objectStoreNames.contains(self.SESSION_RESUME)) {
                    const sessionStore = db.createObjectStore(self.SESSION_RESUME, {
                        keyPath: "id",
                        autoIncrement: true,
                    });
                    self._ensureLogicalRecordIdIndex(sessionStore);
                    if (!sessionStore.indexNames.contains("release_id")) {
                        sessionStore.createIndex("release_id", "release_id", {
                            unique: true,
                        });
                    }
                } else if (event.oldVersion > 0 && event.oldVersion < 7) {
                    const sessionStore = request.transaction.objectStore(
                        self.SESSION_RESUME
                    );
                    self._ensureLogicalRecordIdIndex(sessionStore);
                    if (!sessionStore.indexNames.contains("release_id")) {
                        sessionStore.createIndex("release_id", "release_id", {
                            unique: true,
                        });
                    }
                }
                if (!db.objectStoreNames.contains(self.DISPLAY_PREFERENCES)) {
                    const displayStore = db.createObjectStore(self.DISPLAY_PREFERENCES, {
                        keyPath: "id",
                        autoIncrement: true,
                    });
                    self._ensureLogicalRecordIdIndex(displayStore);
                } else if (event.oldVersion > 0 && event.oldVersion < 8) {
                    self._ensureLogicalRecordIdIndex(
                        request.transaction.objectStore(self.DISPLAY_PREFERENCES)
                    );
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
                self._ensurePatrimonyMigrationComplete(db)
                    .then(function () {
                        resolve(self.db);
                    })
                    .catch(function (err) {
                        self._invalidateConnection(db);
                        reject(err);
                    });
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

    _addPatrimonyRecord(storeName, record) {
        const self = this;
        const domainId = this._domainIdForStore(storeName);
        return this.open().then(function (db) {
            return new Promise(function (resolve, reject) {
                const tx = db.transaction(storeName, "readwrite");
                const store = tx.objectStore(storeName);
                const addReq = store.add(record);
                addReq.onsuccess = function () {
                    const id = addReq.result;
                    record.id = id;
                    record.logical_record_id =
                        window.LouLearnerPatrimony.deriveLogicalRecordId(
                            domainId,
                            record.release_id,
                            id
                        );
                    const putReq = store.put(record);
                    putReq.onsuccess = function () {
                        resolve(id);
                    };
                    putReq.onerror = function () {
                        reject(putReq.error);
                    };
                };
                addReq.onerror = function () {
                    reject(addReq.error);
                };
                tx.onerror = function () {
                    reject(tx.error);
                };
            });
        });
    },

    /**
     * Apply a patrimonial import plan inside one global IndexedDB transaction (Lot E-D).
     * @param {{ storeName: string, action: string, row: object, logicalRecordId: string }[]} plan
     * @returns {Promise<{ inserted: object[], updated: object[], unchanged: object[] }>}
     */
    applyPatrimonialImportPlan(plan) {
        const self = this;
        const touchedStores = {};
        for (let i = 0; i < plan.length; i++) {
            touchedStores[plan[i].storeName] = true;
        }
        const storeNames = Object.keys(touchedStores);
        if (storeNames.length === 0) {
            return Promise.resolve({
                inserted: [],
                updated: [],
                unchanged: [],
            });
        }

        return this.open().then(function (db) {
            return new Promise(function (resolve, reject) {
                const tx = db.transaction(storeNames, "readwrite");
                const outcome = {
                    inserted: [],
                    updated: [],
                    unchanged: [],
                };
                let pending = plan.length;
                let failed = false;

                function finishEntry() {
                    pending -= 1;
                }

                function fail(err) {
                    if (failed) {
                        return;
                    }
                    failed = true;
                    try {
                        tx.abort();
                    } catch (abortErr) {
                        // Transaction may already be aborting.
                    }
                    reject(err);
                }

                if (pending === 0) {
                    resolve(outcome);
                    return;
                }

                for (let i = 0; i < plan.length; i++) {
                    const entry = plan[i];
                    const store = tx.objectStore(entry.storeName);
                    const lookupReq = store
                        .index("logical_record_id")
                        .get(entry.logicalRecordId);
                    lookupReq.onsuccess = function () {
                        if (failed) {
                            return;
                        }
                        const existing = lookupReq.result;
                        if (entry.action === "insert") {
                            if (existing) {
                                fail(
                                    new Error(
                                        "[LouLearnerStore] Import insert collision for " +
                                            entry.logicalRecordId
                                    )
                                );
                                return;
                            }
                            const addReq = store.add(entry.row);
                            addReq.onerror = function () {
                                fail(addReq.error);
                            };
                            addReq.onsuccess = function () {
                                outcome.inserted.push({
                                    storeName: entry.storeName,
                                    logical_record_id: entry.logicalRecordId,
                                    id: addReq.result,
                                });
                                finishEntry();
                            };
                            return;
                        }
                        if (entry.action === "unchanged") {
                            outcome.unchanged.push({
                                storeName: entry.storeName,
                                logical_record_id: entry.logicalRecordId,
                                id: existing ? existing.id : null,
                            });
                            finishEntry();
                            return;
                        }
                        if (entry.action === "update") {
                            if (!existing) {
                                fail(
                                    new Error(
                                        "[LouLearnerStore] Import update missing row for " +
                                            entry.logicalRecordId
                                    )
                                );
                                return;
                            }
                            const merged = Object.assign({}, entry.row, {
                                id: existing.id,
                            });
                            window.LouLearnerPatrimony.preservePatrimonyIdentity(
                                existing,
                                merged
                            );
                            const putReq = store.put(merged);
                            putReq.onerror = function () {
                                fail(putReq.error);
                            };
                            putReq.onsuccess = function () {
                                outcome.updated.push({
                                    storeName: entry.storeName,
                                    logical_record_id: entry.logicalRecordId,
                                    id: existing.id,
                                });
                                finishEntry();
                            };
                        }
                    };
                    lookupReq.onerror = function () {
                        fail(lookupReq.error);
                    };
                }

                tx.oncomplete = function () {
                    if (!failed) {
                        resolve(outcome);
                    }
                };
                tx.onerror = function () {
                    fail(tx.error);
                };
                tx.onabort = function () {
                    fail(
                        tx.error ||
                            new Error("Patrimonial import transaction aborted")
                    );
                };
            });
        });
    },

    _listForPatrimonyScope(storeName, chapter) {
        const self = this;
        const options = this._patrimonyOptions();
        return this._run(storeName, "readonly", function (store) {
            return store.getAll();
        }).then(function (rows) {
            return (rows || []).filter(function (row) {
                return window.LouLearnerPatrimony.matchesPatrimonyScope(
                    row,
                    chapter,
                    options
                );
            });
        });
    },

    /**
     * Read all Release-scoped patrimonial stores for snapshot export (Lot E-C).
     * Read-only — does not mutate source data.
     * @returns {Promise<{ storeName: string, records: object[] }[]>}
     */
    listAllPatrimonialRecords() {
        const self = this;
        const storeNames = self.RELEASE_SCOPED_STORES.concat(
            self.APPLICATION_SCOPED_STORES
        );
        return this.open().then(function (db) {
            return Promise.all(
                storeNames.map(function (storeName) {
                    if (!db.objectStoreNames.contains(storeName)) {
                        return { storeName: storeName, records: [] };
                    }
                    return self
                        ._run(storeName, "readonly", function (store) {
                            return store.getAll();
                        })
                        .then(function (rows) {
                            return {
                                storeName: storeName,
                                records: rows || [],
                            };
                        });
                })
            );
        });
    },

    listRecordsForRelease(releaseId) {
        if (!releaseId) {
            return Promise.reject(new Error("releaseId is required"));
        }
        const self = this;
        const storeNames = self.RELEASE_SCOPED_STORES;
        return this.open().then(function (db) {
            return Promise.all(
                storeNames.map(function (storeName) {
                    if (!db.objectStoreNames.contains(storeName)) {
                        return [];
                    }
                    return self._run(storeName, "readonly", function (store) {
                        return store.getAll();
                    }).then(function (rows) {
                        return (rows || []).filter(function (row) {
                            return row && row.release_id === releaseId;
                        });
                    });
                })
            ).then(function (groups) {
                return groups.flat();
            });
        });
    },

    // C.8 — anchored to the Blueprint element, never to the Official Visual, so availability never
    // depends on a visual existing and a re-rendered visual never disturbs the learner's drawing.
    addPersonalDiagram(chapter, element, blob) {
        let record;
        try {
            record = this._stampPatrimonyRecord(chapter, {
                element: element,
                blob: blob,
                created: new Date().toISOString(),
            });
        } catch (err) {
            return Promise.reject(err);
        }
        return this._addPatrimonyRecord(this.DIAGRAMS, record);
    },

    listPersonalDiagrams(chapter) {
        return this._listForPatrimonyScope(this.DIAGRAMS, chapter);
    },

    deletePersonalDiagram(id) {
        return this._run(this.DIAGRAMS, "readwrite", function (store) {
            return store.delete(id);
        });
    },

    // V2.1 — text-selection highlights; separate store, TextQuoteSelector anchoring (docs/renderer/08).
    addTextHighlight(chapter, projection, element, selector) {
        let record;
        try {
            record = this._stampPatrimonyRecord(chapter, {
                projection: projection,
                element: element,
                selector: selector,
                kind: "highlight",
                created: new Date().toISOString(),
            });
        } catch (err) {
            return Promise.reject(err);
        }
        return this._addPatrimonyRecord(this.HIGHLIGHTS, record);
    },

    listTextHighlights(chapter, projection) {
        return this._listForPatrimonyScope(this.HIGHLIGHTS, chapter).then(function (rows) {
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
        let record;
        try {
            record = this._stampPatrimonyRecord(chapter, {
                projection: projection,
                element: element,
                anchor: anchor,
                text: text,
                created: new Date().toISOString(),
            });
        } catch (err) {
            return Promise.reject(err);
        }
        return this._addPatrimonyRecord(this.WALKTHROUGH_NOTES, record);
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
        return this._listForPatrimonyScope(this.WALKTHROUGH_NOTES, chapter).then(
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
        if (!this._isNonEmptyString(record.release_id)) {
            throw new Error("SvgTextFormat release_id is required");
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
            delete payload.schema_version;
            delete payload.release_id;
            this._stampPatrimonyRecord(payload.chapter, payload);
            this._validateSvgTextFormatRecord(payload);
            payload.created = new Date().toISOString();
        } catch (err) {
            return Promise.reject(err);
        }
        return this._addPatrimonyRecord(this.SVG_TEXT_FORMATS, payload);
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
                    window.LouLearnerPatrimony.preservePatrimonyIdentity(
                        existing,
                        merged
                    );
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
        return this._listForPatrimonyScope(this.SVG_TEXT_FORMATS, chapter).then(function (rows) {
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

    /**
     * Lot D4 — list all session_resume records (application scope).
     * @returns {Promise<object[]>}
     */
    listSessionRecords() {
        return this._run(this.SESSION_RESUME, "readonly", function (store) {
            return store.getAll();
        }).then(function (rows) {
            return rows || [];
        });
    },

    /**
     * @param {string} releaseId
     * @returns {Promise<object|null>}
     */
    getSessionForRelease(releaseId) {
        if (!releaseId) {
            return Promise.reject(new Error("releaseId is required"));
        }
        return this.open().then(function (db) {
            return new Promise(function (resolve, reject) {
                const store = db
                    .transaction(window.LouLearnerStore.SESSION_RESUME, "readonly")
                    .objectStore(window.LouLearnerStore.SESSION_RESUME);
                const req = store.index("release_id").get(releaseId);
                req.onsuccess = function () {
                    resolve(req.result || null);
                };
                req.onerror = function () {
                    reject(req.error);
                };
            });
        });
    },

    /**
     * Upsert SessionState after handleCommitEvent (IA-25).
     * @param {object} sessionState
     * @returns {Promise<object>}
     */
    upsertSessionState(sessionState) {
        if (!sessionState || typeof sessionState !== "object") {
            return Promise.reject(new Error("sessionState is required"));
        }
        const required = [
            "release_id",
            "chapter",
            "viewId",
            "resumePoint",
            "last_activity_at",
            "schema_version",
        ];
        for (let i = 0; i < required.length; i++) {
            const key = required[i];
            if (sessionState[key] === undefined || sessionState[key] === null) {
                return Promise.reject(
                    new Error("SessionState missing required field: " + key)
                );
            }
        }

        const self = this;
        const row = Object.assign({}, sessionState);
        delete row.resume_status;
        if (!row.logical_record_id) {
            row.logical_record_id = window.LouLearnerPatrimony.deriveLogicalRecordId(
                "session_resume",
                row.release_id,
                row.id || 1
            );
        }

        return this.open().then(function (db) {
            return new Promise(function (resolve, reject) {
                const tx = db.transaction(self.SESSION_RESUME, "readwrite");
                const store = tx.objectStore(self.SESSION_RESUME);
                const lookup = store.index("release_id").get(row.release_id);
                lookup.onsuccess = function () {
                    const existing = lookup.result;
                    if (existing) {
                        row.id = existing.id;
                        row.logical_record_id = existing.logical_record_id;
                    }
                    const putReq = store.put(row);
                    putReq.onsuccess = function () {
                        row.id = putReq.result || row.id;
                        resolve(row);
                    };
                    putReq.onerror = function () {
                        reject(putReq.error);
                    };
                };
                lookup.onerror = function () {
                    reject(lookup.error);
                };
            });
        });
    },

    /**
     * Lot D7-D — list all display_preferences records (application scope).
     * @returns {Promise<object[]>}
     */
    listDisplayPreferencesRecords() {
        return this._run(this.DISPLAY_PREFERENCES, "readonly", function (store) {
            return store.getAll();
        }).then(function (rows) {
            return rows || [];
        });
    },

    /**
     * Upsert singleton display_preferences record (Lot D7-D).
     * @param {object} record
     * @returns {Promise<object>}
     */
    upsertDisplayPreferencesRecord(record) {
        if (!record || typeof record !== "object") {
            return Promise.reject(new Error("display preferences record is required"));
        }
        const required = [
            "record_id",
            "logical_record_id",
            "schema_version",
            "theme",
            "fontSize",
            "readingWidth",
        ];
        for (let i = 0; i < required.length; i++) {
            const key = required[i];
            if (record[key] === undefined || record[key] === null) {
                return Promise.reject(
                    new Error("Display preferences record missing required field: " + key)
                );
            }
        }
        if (record.release_id !== undefined) {
            return Promise.reject(
                new Error("Display preferences record must not include release_id")
            );
        }

        const self = this;
        const row = Object.assign({}, record);
        row.record_id = row.record_id || "display-preferences-v1";
        row.logical_record_id = row.logical_record_id || row.record_id;

        return this.open().then(function (db) {
            return new Promise(function (resolve, reject) {
                const tx = db.transaction(self.DISPLAY_PREFERENCES, "readwrite");
                const store = tx.objectStore(self.DISPLAY_PREFERENCES);
                const lookup = store.index("logical_record_id").get(row.logical_record_id);
                lookup.onsuccess = function () {
                    const existing = lookup.result;
                    if (existing) {
                        row.id = existing.id;
                    }
                    const putReq = store.put(row);
                    putReq.onsuccess = function () {
                        row.id = putReq.result || row.id;
                        resolve(row);
                    };
                    putReq.onerror = function () {
                        reject(putReq.error);
                    };
                };
                lookup.onerror = function () {
                    reject(lookup.error);
                };
            });
        });
    },

    /**
     * Delete all display_preferences records (Lot D7-D reset).
     * @returns {Promise<void>}
     */
    deleteDisplayPreferencesRecords() {
        return this._run(this.DISPLAY_PREFERENCES, "readwrite", function (store) {
            return store.clear();
        });
    },

    /**
     * Delete duplicate display_preferences records, keeping one logical_record_id.
     * @param {string} keepLogicalRecordId
     * @returns {Promise<number>} number of deleted rows
     */
    deleteDisplayPreferencesExcept(keepLogicalRecordId) {
        if (!keepLogicalRecordId) {
            return Promise.reject(new Error("keepLogicalRecordId is required"));
        }
        const self = this;
        return this.listDisplayPreferencesRecords().then(function (rows) {
            const toDelete = (rows || []).filter(function (row) {
                return row.logical_record_id !== keepLogicalRecordId;
            });
            if (toDelete.length === 0) {
                return 0;
            }
            return self.open().then(function (db) {
                return new Promise(function (resolve, reject) {
                    const tx = db.transaction(self.DISPLAY_PREFERENCES, "readwrite");
                    const store = tx.objectStore(self.DISPLAY_PREFERENCES);
                    let pending = toDelete.length;
                    let deleted = 0;
                    let failed = false;

                    function finish() {
                        pending -= 1;
                        if (!failed && pending === 0) {
                            resolve(deleted);
                        }
                    }

                    for (let i = 0; i < toDelete.length; i++) {
                        const row = toDelete[i];
                        const req = store.delete(row.id);
                        req.onsuccess = function () {
                            deleted += 1;
                            finish();
                        };
                        req.onerror = function () {
                            if (!failed) {
                                failed = true;
                                reject(req.error);
                            }
                        };
                    }
                });
            });
        });
    },
};
