// Walkthrough Notes (Renderer V2.2) — restore + create (commit 5) + edit/delete (commit 6).
//
// Reads persisted notes from IndexedDB and injects additive spans into official walkthroughs.
// Context menu create flow: pending span → blur persist/discard. Anchoring via LouCaretAnchor only.
window.LouInlineNotes = {
    NOTE_CLASS: "walkthrough-note",
    MENU_CLASS: "inline-notes-context-menu",
    _MENU_ADD_LABEL: "Add note",
    _MENU_DELETE_LABEL: "Supprimer la note",

    _boundHost: null,
    _bindContext: null,
    _contextMenuEl: null,
    _pendingMenuContext: null,
    _activeEditNote: null,
    _committing: false,
    _commitInFlight: null,
    _pendingAnchors: new WeakMap(),
    _editSnapshots: new WeakMap(),
    _mountGeneration: 0,
    _onDocumentMouseDown: null,
    _onWindowScroll: null,

    _normalizeNoteText(raw) {
        return String(raw).trim();
    },

    _noteStoreId(noteEl) {
        const raw = noteEl && noteEl.getAttribute("data-note-id");
        if (raw == null || this._normalizeNoteText(raw) === "") {
            return null;
        }
        const id = Number(raw);
        if (!Number.isFinite(id) || !Number.isInteger(id) || id <= 0) {
            return null;
        }
        return id;
    },

    async mount(host, context) {
        this._mountGeneration += 1;
        this._hideContextMenu();
        this._activeEditNote = null;
        if (!this._commitInFlight) {
            this._committing = false;
        }
        try {
            await this.restore(host, context);
        } catch (err) {
            console.warn("[LouInlineNotes] Note restore failed.", err);
        } finally {
            this.bind(host, context);
        }
    },

    bind(host, context) {
        this._bindContext = context;
        if (this._boundHost === host) {
            return;
        }
        this._boundHost = host;
        const self = this;

        host.addEventListener("contextmenu", function (event) {
            self._onContextMenu(event, host);
        });

        host.addEventListener("dblclick", function (event) {
            void self._onNoteDblClick(event, host);
        });

        if (!this._onDocumentMouseDown) {
            this._onDocumentMouseDown = function (event) {
                if (
                    self._contextMenuEl &&
                    self._contextMenuEl.contains(event.target)
                ) {
                    return;
                }
                self._hideContextMenu();
            };
            document.addEventListener("mousedown", this._onDocumentMouseDown);
        }

        if (!this._onWindowScroll) {
            this._onWindowScroll = function () {
                self._hideContextMenu();
            };
            window.addEventListener("scroll", this._onWindowScroll, true);
        }
    },

    async restore(host, context) {
        const store = context && context.store;
        const projection =
            context && context.projection && context.projection.id;
        if (!store || !projection || !store.listWalkthroughNotes) {
            return;
        }
        if (
            !window.LouCaretAnchor ||
            typeof window.LouCaretAnchor.restoreCaretAnchor !== "function"
        ) {
            throw new Error("LouCaretAnchor.restoreCaretAnchor is unavailable");
        }

        const rows = await store.listWalkthroughNotes(
            context.chapter,
            projection
        );
        const self = this;
        rows.forEach(function (record) {
            self._restoreRecord(host, record);
        });
    },

    _restoreRecord(host, record) {
        if (!record || !record.text || !String(record.text).trim()) {
            return;
        }

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

        if (
            walkthrough.querySelector('[data-note-id="' + record.id + '"]')
        ) {
            return;
        }

        const range = window.LouCaretAnchor.restoreCaretAnchor(
            walkthrough,
            record.anchor
        );
        if (!range) {
            return;
        }

        const noteEl = document.createElement("span");
        noteEl.className = this.NOTE_CLASS;
        noteEl.dataset.learner = "true";
        noteEl.setAttribute("data-note-id", String(record.id));
        noteEl.textContent = record.text;

        range.insertNode(noteEl);
    },

    _walkthroughFromTarget(target, host) {
        if (!target || !host) {
            return null;
        }
        const el =
            target.nodeType === Node.ELEMENT_NODE ? target : target.parentElement;
        if (!el) {
            return null;
        }
        const walkthrough = el.closest("[data-official='true']");
        if (!walkthrough || !host.contains(walkthrough)) {
            return null;
        }
        return walkthrough;
    },

    _noteFromElement(target) {
        if (!target) {
            return null;
        }
        const el =
            target.nodeType === Node.ELEMENT_NODE ? target : target.parentElement;
        if (!el) {
            return null;
        }
        return el.closest("." + this.NOTE_CLASS);
    },

    _onContextMenu(event, host) {
        const noteEl = this._noteFromElement(event.target);
        if (noteEl && noteEl.hasAttribute("data-note-id")) {
            event.preventDefault();
            this._hideContextMenu();
            this._showContextMenu(event.clientX, event.clientY, {
                noteEl: noteEl,
            });
            return;
        }

        const walkthrough = this._walkthroughFromTarget(event.target, host);
        if (!walkthrough) {
            return;
        }
        if (noteEl) {
            return;
        }

        event.preventDefault();
        this._hideContextMenu();
        this._showContextMenu(event.clientX, event.clientY, {
            walkthrough: walkthrough,
            clientX: event.clientX,
            clientY: event.clientY,
        });
    },

    _ensureContextMenu() {
        if (this._contextMenuEl) {
            return this._contextMenuEl;
        }
        const menu = document.createElement("div");
        menu.className = this.MENU_CLASS;
        menu.setAttribute("role", "menu");
        menu.hidden = true;
        document.body.appendChild(menu);
        this._contextMenuEl = menu;
        return menu;
    },

    _showContextMenu(clientX, clientY, menuContext) {
        const menu = this._ensureContextMenu();
        menu.textContent = "";
        const button = document.createElement("button");
        button.type = "button";
        button.setAttribute("role", "menuitem");

        const self = this;
        if (menuContext && menuContext.noteEl) {
            button.textContent = this._MENU_DELETE_LABEL;
            button.addEventListener("click", function () {
                void self._onDeleteNote(menuContext);
            });
        } else {
            button.textContent = this._MENU_ADD_LABEL;
            button.addEventListener("click", function () {
                void self._onCreateNote(menuContext);
            });
        }

        menu.appendChild(button);
        this._pendingMenuContext = menuContext;
        menu.style.position = "fixed";
        menu.style.left = clientX + "px";
        menu.style.top = clientY + "px";
        menu.hidden = false;
    },

    _hideContextMenu() {
        if (this._contextMenuEl) {
            this._contextMenuEl.hidden = true;
        }
        this._pendingMenuContext = null;
    },

    async _onNoteDblClick(event, host) {
        const noteEl = this._noteFromElement(event.target);
        if (!noteEl || !noteEl.hasAttribute("data-note-id")) {
            return;
        }
        if (!host.contains(noteEl)) {
            return;
        }

        event.stopPropagation();

        await this._waitForCommitIdle();
        if (this._activeEditNote && this._activeEditNote !== noteEl) {
            await this._commitOnBlur(this._activeEditNote);
        }
        await this._waitForCommitIdle();

        if (this._activeEditNote === noteEl) {
            return;
        }

        this._editSnapshots.set(
            noteEl,
            this._normalizeNoteText(noteEl.textContent)
        );
        this._enterEditMode(noteEl);
    },

    async _onCreateNote(menuContext) {
        this._hideContextMenu();
        if (!menuContext || !menuContext.walkthrough) {
            return;
        }

        await this._waitForCommitIdle();
        if (this._activeEditNote) {
            await this._commitOnBlur(this._activeEditNote);
        }
        await this._waitForCommitIdle();

        const walkthrough = menuContext.walkthrough;
        const range = this._caretRangeFromClick(
            menuContext.clientX,
            menuContext.clientY
        );
        if (!range) {
            return;
        }

        if (
            !window.LouCaretAnchor ||
            typeof window.LouCaretAnchor.createCaretAnchor !== "function"
        ) {
            return;
        }

        const anchor = window.LouCaretAnchor.createCaretAnchor(
            walkthrough,
            range.startContainer,
            range.startOffset
        );
        if (!anchor) {
            return;
        }

        const block = walkthrough.closest(".pedagogical-block");
        if (!block || !block.dataset.element) {
            return;
        }

        const ctx = this._bindContext;
        if (!ctx || !ctx.store) {
            return;
        }

        const noteEl = this._createNoteElement();
        this._insertNoteAtRange(range, noteEl);
        this._pendingAnchors.set(noteEl, {
            walkthrough: walkthrough,
            element: block.dataset.element,
            anchor: anchor,
            context: {
                chapter: ctx.chapter,
                projection: ctx.projection,
                store: ctx.store,
            },
        });
        this._enterEditMode(noteEl);
    },

    // Internal write primitive — not a public queue API.
    // Precondition: callers on user-facing paths (_commitOnBlur branches, _onDeleteNote)
    // already await _waitForCommitIdle() where needed; E4 guarantees at most one edit intent.
    // If _committing is already true, return immediately (same-stack reentrancy / double blur).
    // That does not drop a serialized commit: the in-flight owner holds _commitInFlight until
    // settlement, and other paths wait on _waitForCommitIdle() before entering here.
    async _withWriteLock(work) {
        if (this._committing) {
            return;
        }
        this._committing = true;
        try {
            await this._waitForCommitIdle();
            return await work();
        } finally {
            this._committing = false;
        }
    },

    async _runStoreCommit(spec) {
        const intentGen = spec.intentGen;
        const noteEl = spec.noteEl;
        const accept = spec.accept;
        const onSuccessConnected = spec.onSuccessConnected;
        const onFailureConnected = spec.onFailureConnected;
        const converge = spec.converge;

        const acceptedGen = this._mountGeneration;
        const host = this._boundHost;
        const ctx = this._bindContext;
        const self = this;

        const commitWork = (async function () {
            let result;
            try {
                if (intentGen !== self._mountGeneration) {
                    return;
                }
                result = await accept();
                if (noteEl && noteEl.isConnected && onSuccessConnected) {
                    onSuccessConnected(result);
                }
            } catch (err) {
                if (noteEl && noteEl.isConnected && onFailureConnected) {
                    onFailureConnected(err);
                }
                return;
            }
            const needsConverge =
                host &&
                ctx &&
                converge &&
                (acceptedGen !== self._mountGeneration ||
                    (noteEl && !noteEl.isConnected));
            if (needsConverge) {
                try {
                    await self._convergeAfterCommit(
                        host,
                        ctx,
                        converge,
                        result
                    );
                } catch (convergeErr) {
                    console.warn(
                        "[LouInlineNotes] Note converge failed.",
                        convergeErr
                    );
                }
            }
            return result;
        })();

        this._commitInFlight = commitWork;
        try {
            return await commitWork;
        } finally {
            this._commitInFlight = null;
        }
    },

    async _convergeAfterCommit(host, context, converge, result) {
        if (!host || !context || !converge) {
            return;
        }
        const op = converge.op;
        const id = converge.id != null ? converge.id : result;
        if (id == null) {
            return;
        }
        if (op === "delete") {
            const el = host.querySelector('[data-note-id="' + id + '"]');
            if (el) {
                el.remove();
            }
            return;
        }
        if (op === "update") {
            const el = host.querySelector('[data-note-id="' + id + '"]');
            if (el && converge.text != null) {
                el.textContent = converge.text;
            }
            return;
        }
        if (op === "add") {
            const store = context.store;
            const projection =
                context.projection && context.projection.id;
            if (!store || !projection || !store.listWalkthroughNotes) {
                return;
            }
            const rows = await store.listWalkthroughNotes(
                context.chapter,
                projection
            );
            const record = rows.find(function (row) {
                return row.id === id;
            });
            if (record) {
                this._restoreRecord(host, record);
            }
        }
    },

    async _onDeleteNote(menuContext) {
        this._hideContextMenu();
        if (!menuContext || !menuContext.noteEl) {
            return;
        }

        await this._waitForCommitIdle();

        const noteEl = menuContext.noteEl;
        const id = this._noteStoreId(noteEl);
        if (id == null) {
            return;
        }

        const ctx = this._bindContext;
        const store = ctx && ctx.store;
        if (!store || !store.deleteWalkthroughNote) {
            return;
        }

        if (this._activeEditNote === noteEl) {
            this._activeEditNote = null;
        }
        this._editSnapshots.delete(noteEl);

        const intentGen = this._mountGeneration;
        const self = this;
        await this._withWriteLock(function () {
            return self._runStoreCommit({
            intentGen: intentGen,
            noteEl: noteEl,
            accept: function () {
                return store.deleteWalkthroughNote(id);
            },
            onSuccessConnected: function () {
                self._exitEditMode(noteEl);
                noteEl.remove();
            },
            onFailureConnected: function () {},
            converge: { op: "delete", id: id },
            });
        });
    },

    _caretRangeFromClick(clientX, clientY) {
        let range = null;
        if (document.caretRangeFromPoint) {
            range = document.caretRangeFromPoint(clientX, clientY);
        } else if (document.caretPositionFromPoint) {
            const pos = document.caretPositionFromPoint(clientX, clientY);
            if (pos) {
                range = document.createRange();
                range.setStart(pos.offsetNode, pos.offset);
                range.collapse(true);
            }
        }
        if (!range) {
            return null;
        }
        if (this._noteFromElement(range.startContainer)) {
            return null;
        }
        return range;
    },

    _createNoteElement() {
        const noteEl = document.createElement("span");
        noteEl.className = this.NOTE_CLASS;
        noteEl.dataset.learner = "true";
        return noteEl;
    },

    _insertNoteAtRange(range, noteEl) {
        range.insertNode(noteEl);
    },

    _enterEditMode(noteEl) {
        const self = this;
        noteEl.contentEditable = "true";
        this._activeEditNote = noteEl;

        noteEl._inlineNotesBlur = function () {
            void self._commitOnBlur(noteEl);
        };
        noteEl._inlineNotesKeydown = function (event) {
            if (event.key === "Escape") {
                noteEl.blur();
            }
        };
        noteEl.addEventListener("blur", noteEl._inlineNotesBlur);
        noteEl.addEventListener("keydown", noteEl._inlineNotesKeydown);
        noteEl.focus();
    },

    _exitEditMode(noteEl) {
        if (!noteEl) {
            return;
        }
        noteEl.contentEditable = "false";
        if (noteEl._inlineNotesBlur) {
            noteEl.removeEventListener("blur", noteEl._inlineNotesBlur);
            noteEl._inlineNotesBlur = null;
        }
        if (noteEl._inlineNotesKeydown) {
            noteEl.removeEventListener("keydown", noteEl._inlineNotesKeydown);
            noteEl._inlineNotesKeydown = null;
        }
    },

    async _waitForCommitIdle() {
        if (this._commitInFlight) {
            await this._commitInFlight;
        }
    },

    async _commitOnBlur(noteEl) {
        if (this._committing) {
            return;
        }
        if (!noteEl) {
            return;
        }

        const text = this._normalizeNoteText(noteEl.textContent);

        if (!noteEl.hasAttribute("data-note-id")) {
            await this._commitPendingOnBlur(noteEl, text);
            return;
        }

        await this._commitPersistedOnBlur(noteEl, text);
    },

    async _commitPendingOnBlur(noteEl, text) {
        if (!text) {
            this._exitEditMode(noteEl);
            this._pendingAnchors.delete(noteEl);
            noteEl.remove();
            if (this._activeEditNote === noteEl) {
                this._activeEditNote = null;
            }
            return;
        }

        const pending = this._pendingAnchors.get(noteEl);
        if (!pending) {
            noteEl.remove();
            if (this._activeEditNote === noteEl) {
                this._activeEditNote = null;
            }
            return;
        }

        const store = pending.context && pending.context.store;
        const chapter = pending.context.chapter;
        const projection =
            pending.context.projection && pending.context.projection.id;
        if (!store || !chapter || !projection) {
            this._rollbackNote(noteEl);
            this._pendingAnchors.delete(noteEl);
            if (this._activeEditNote === noteEl) {
                this._activeEditNote = null;
            }
            return;
        }

        const intentGen = this._mountGeneration;
        const self = this;
        await this._withWriteLock(function () {
            return self._runStoreCommit({
                intentGen: intentGen,
                noteEl: noteEl,
                accept: function () {
                    return store.addWalkthroughNote(
                        chapter,
                        projection,
                        pending.element,
                        pending.anchor,
                        text
                    );
                },
                onSuccessConnected: function (id) {
                    noteEl.setAttribute("data-note-id", String(id));
                    self._pendingAnchors.delete(noteEl);
                    self._exitEditMode(noteEl);
                    if (self._activeEditNote === noteEl) {
                        self._activeEditNote = null;
                    }
                },
                onFailureConnected: function () {
                    self._rollbackNote(noteEl);
                    self._pendingAnchors.delete(noteEl);
                    if (self._activeEditNote === noteEl) {
                        self._activeEditNote = null;
                    }
                },
                converge: { op: "add" },
            });
        });
    },

    async _commitPersistedOnBlur(noteEl, text) {
        const snapshot = this._editSnapshots.get(noteEl);
        const id = this._noteStoreId(noteEl);
        const ctx = this._bindContext;
        const store = ctx && ctx.store;

        if (id == null || !store) {
            this._exitEditMode(noteEl);
            this._editSnapshots.delete(noteEl);
            if (this._activeEditNote === noteEl) {
                this._activeEditNote = null;
            }
            return;
        }

        if (snapshot !== undefined && text === snapshot) {
            this._exitEditMode(noteEl);
            this._editSnapshots.delete(noteEl);
            if (this._activeEditNote === noteEl) {
                this._activeEditNote = null;
            }
            return;
        }

        const intentGen = this._mountGeneration;
        const self = this;

        if (text === "") {
            await this._withWriteLock(function () {
                return self._runStoreCommit({
                intentGen: intentGen,
                noteEl: noteEl,
                accept: function () {
                    return store.deleteWalkthroughNote(id);
                },
                onSuccessConnected: function () {
                    self._editSnapshots.delete(noteEl);
                    self._exitEditMode(noteEl);
                    noteEl.remove();
                    if (self._activeEditNote === noteEl) {
                        self._activeEditNote = null;
                    }
                },
                onFailureConnected: function () {
                    if (snapshot !== undefined) {
                        noteEl.textContent = snapshot;
                    }
                    self._editSnapshots.delete(noteEl);
                    self._exitEditMode(noteEl);
                    if (self._activeEditNote === noteEl) {
                        self._activeEditNote = null;
                    }
                },
                converge: { op: "delete", id: id },
                });
            });
            return;
        }

        await this._withWriteLock(function () {
            return self._runStoreCommit({
            intentGen: intentGen,
            noteEl: noteEl,
            accept: function () {
                return store.updateWalkthroughNote(id, text);
            },
            onSuccessConnected: function () {
                noteEl.textContent = text;
                self._editSnapshots.delete(noteEl);
                self._exitEditMode(noteEl);
                if (self._activeEditNote === noteEl) {
                    self._activeEditNote = null;
                }
            },
            onFailureConnected: function () {
                if (snapshot !== undefined) {
                    noteEl.textContent = snapshot;
                }
                self._editSnapshots.delete(noteEl);
                self._exitEditMode(noteEl);
                if (self._activeEditNote === noteEl) {
                    self._activeEditNote = null;
                }
            },
            converge: { op: "update", id: id, text: text },
            });
        });
    },

    _rollbackNote(noteEl) {
        this._exitEditMode(noteEl);
        noteEl.remove();
    },
};
