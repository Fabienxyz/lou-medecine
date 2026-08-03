// Walkthrough Notes (Renderer V2.2) — restore + create (commit 5) + edit/delete (commit 6).
//
// Reads persisted notes from IndexedDB and injects additive spans into official walkthroughs.
// Context menu create flow: pending span → blur persist/discard. Anchoring via LouCaretAnchor only.
window.LouInlineNotes = {
    NOTE_CLASS: "walkthrough-note",
    MENU_CLASS: "inline-notes-context-menu",
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
            await this.restoreAll(host, context);
        } catch (err) {
            console.warn("[LouInlineNotes] Note restore failed.", err);
        } finally {
            this.bind(host, context);
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

    bind(host, context) {
        this._bindContext = context;
        if (host && host.dataset.louInlineNotesBound === "true") {
            return;
        }
        if (host) {
            host.dataset.louInlineNotesBound = "true";
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
                const ctrl = window.LouAnnotationController;
                if (ctrl && ctrl.isToolbarTarget(event.target)) {
                    return;
                }
                self._hideContextMenu();
            };
            document.addEventListener("mousedown", this._onDocumentMouseDown);
        }

        if (!this._onWindowScroll) {
            this._onWindowScroll = function () {
                self._hideContextMenu();
                if (!self._activeEditNote) {
                    self._dismissNoteToolbar();
                }
            };
            window.addEventListener("scroll", this._onWindowScroll, true);
        }

        if (!this._onDocumentKeydown) {
            this._onDocumentKeydown = function (event) {
                if (event.key === "Escape") {
                    if (self._activeEditNote) {
                        self._activeEditNote.blur();
                    } else {
                        self._dismissNoteToolbar(true);
                    }
                }
            };
            document.addEventListener("keydown", this._onDocumentKeydown);
        }
    },

    async restore(host, context) {
        const store = context && context.store;
        const projection =
            context && context.projection && context.projection.id;
        const composition =
            window.LouRenderer &&
            window.LouRenderer.isCompositionContext(context);
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
        const orphans = [];
        const self = this;
        const decide = window.LouLearnerOrphanDecision;

        rows.forEach(function (record) {
            if (decide && typeof decide.evaluateNote === "function") {
                const outcome = decide.evaluateNote(
                    host,
                    record,
                    composition,
                    self,
                    window.LouCaretAnchor
                );
                if (outcome.decision === "orphan") {
                    orphans.push({ kind: "note", record: record });
                }
                return;
            }

            const result = self._restoreRecord(host, record, composition);
            if (result === "orphan") {
                orphans.push({ kind: "note", record: record });
            }
        });

        if (orphans.length && window.LouBlocks) {
            const filtered =
                decide && typeof decide.filterOrphans === "function"
                    ? decide.filterOrphans(
                          host,
                          orphans,
                          window.LouTextHighlights,
                          self
                      )
                    : orphans;
            if (filtered.length) {
                window.LouBlocks.appendAnnotationOrphans(host, filtered);
            }
        }
    },

    _isNoteRecordSatisfiedInBlock(block, record) {
        if (!block || !record) {
            return false;
        }
        if (
            record.id != null &&
            block.querySelector('[data-note-id="' + record.id + '"]')
        ) {
            return true;
        }
        const text = record.text && String(record.text).trim();
        if (!text) {
            return false;
        }
        const notes = block.querySelectorAll("." + this.NOTE_CLASS);
        for (let i = 0; i < notes.length; i += 1) {
            if (this._normalizeNoteText(notes[i].textContent) === text) {
                return true;
            }
        }
        return false;
    },

    _isNoteRecordSatisfiedInWalkthrough(walkthrough, record) {
        const block =
            walkthrough && walkthrough.closest
                ? walkthrough.closest(".pedagogical-block")
                : null;
        return this._isNoteRecordSatisfiedInBlock(block || walkthrough, record);
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

    // Returns "restored" | "orphan" | "skipped". Never deletes persisted records.
    _restoreRecord(host, record, composition) {
        if (!record || !record.text || !String(record.text).trim()) {
            return "skipped";
        }

        const block = this._findBlock(
            host,
            record.element,
            record.projection,
            composition
        );
        if (!block) {
            return "orphan";
        }

        const walkthrough = block.querySelector(".block-walkthrough");
        if (!walkthrough && !block.querySelector('.block-question[data-official="true"]')) {
            return "orphan";
        }

        if (block.querySelector('[data-note-id="' + record.id + '"]')) {
            return "skipped";
        }

        const roots = window.LouAnnotationColors.officialRootsInBlock(block);
        let range = null;
        let officialRoot = null;
        for (let i = 0; i < roots.length; i += 1) {
            const candidate = window.LouCaretAnchor.restoreCaretAnchor(
                roots[i],
                record.anchor
            );
            if (candidate) {
                range = candidate;
                officialRoot = roots[i];
                break;
            }
        }
        if (!range) {
            if (this._isNoteRecordSatisfiedInBlock(block, record)) {
                return "skipped";
            }
            return "orphan";
        }

        const noteEl = document.createElement("span");
        noteEl.className = this.NOTE_CLASS;
        noteEl.dataset.learner = "true";
        noteEl.setAttribute("data-note-id", String(record.id));
        noteEl.textContent = record.text;
        const colorId =
            window.LouAnnotationColors.getRecordColor("note", record.id) ||
            window.LouAnnotationColors.DEFAULT_NOTE_ID;
        const formatState =
            window.LouAnnotationColors.getRecordStyle("note", record.id) ||
            window.LouAnnotationColors.emptyFormatState();
        window.LouAnnotationColors.applyNoteColor(noteEl, colorId);
        window.LouAnnotationColors.applyNoteStyle(noteEl, formatState);

        range.insertNode(noteEl);
        return "restored";
    },

    _officialRootFromTarget(target, host) {
        return window.LouAnnotationColors.annotatableRoot(target, host);
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
        if (!noteEl || !noteEl.hasAttribute("data-note-id")) {
            return;
        }
        if (!host.contains(noteEl)) {
            return;
        }

        event.preventDefault();
        this._hideContextMenu();
        this._showContextMenu(event.clientX, event.clientY, {
            noteEl: noteEl,
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
        if (!menuContext || !menuContext.noteEl) {
            return;
        }
        button.textContent = this._MENU_DELETE_LABEL;
        button.addEventListener("click", function () {
            void self._onDeleteNote(menuContext);
        });

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
        if (noteEl) {
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
            this._editSnapshots.set(noteEl, {
                text: this._normalizeNoteText(noteEl.textContent),
                prefs: this._prefsSnapshot(noteEl),
            });
            this._enterEditMode(noteEl);
            this._showAnnotationToolbarForNote(noteEl);
            return;
        }

        const officialRoot = this._officialRootFromTarget(event.target, host);
        if (!officialRoot) {
            return;
        }

        event.preventDefault();
        event.stopPropagation();
        await this._startNoteAtPoint(event.clientX, event.clientY, officialRoot);
    },

    async _startNoteAtPoint(clientX, clientY, officialRoot) {
        await this._waitForCommitIdle();
        if (this._activeEditNote) {
            await this._commitOnBlur(this._activeEditNote);
        }
        await this._waitForCommitIdle();

        const range = this._caretRangeFromClick(clientX, clientY);
        if (!range || !officialRoot.contains(range.startContainer)) {
            return;
        }

        if (
            !window.LouCaretAnchor ||
            typeof window.LouCaretAnchor.createCaretAnchor !== "function"
        ) {
            return;
        }

        const anchor = window.LouCaretAnchor.createCaretAnchor(
            officialRoot,
            range.startContainer,
            range.startOffset
        );
        if (!anchor) {
            return;
        }

        const block = officialRoot.closest(".pedagogical-block");
        if (!block || !block.dataset.element) {
            return;
        }

        const ctx = this._bindContext;
        if (!ctx || !ctx.store) {
            return;
        }

        const noteEl = this._createNoteElement();
        const prefs = window.LouAnnotationColors.getLastNotePreferences();
        window.LouAnnotationColors.applyNotePreferences(noteEl, prefs);
        noteEl.dataset.pendingNoteColor = prefs.colorId;
        noteEl.dataset.pendingNoteBold = prefs.bold ? "true" : "false";
        noteEl.dataset.pendingNoteUnderline = prefs.underline ? "true" : "false";
        noteEl.dataset.pendingNoteStrikethrough = prefs.strikethrough
            ? "true"
            : "false";

        this._insertNoteAtRange(range, noteEl);
        const sourceProjection = block.dataset.sourceProjection || null;
        let projectionContext = ctx.projection;
        if (sourceProjection) {
            projectionContext = { id: sourceProjection };
        } else if (window.LouRenderer.isCompositionContext(ctx)) {
            console.warn(
                "[LouInlineNotes] Composition note blocked: missing data-source-projection on block"
            );
            noteEl.remove();
            return;
        } else if (ctx.projectionForElement) {
            projectionContext = ctx.projectionForElement(block.dataset.element);
        }
        this._pendingAnchors.set(noteEl, {
            officialRoot: officialRoot,
            element: block.dataset.element,
            sourceProjection: sourceProjection,
            anchor: anchor,
            context: {
                chapter: ctx.chapter,
                projection: projectionContext,
                store: ctx.store,
            },
        });
        this._enterEditMode(noteEl);
        this._showAnnotationToolbarForNote(noteEl, clientX, clientY);
    },

    _prefsSnapshot(noteEl) {
        return this._notePreferencesFromElement(noteEl);
    },

    _prefsEqual(a, b) {
        if (!a || !b) {
            return false;
        }
        return (
            a.colorId === b.colorId &&
            !!a.bold === !!b.bold &&
            !!a.underline === !!b.underline &&
            !!a.strikethrough === !!b.strikethrough
        );
    },

    _showAnnotationToolbarForNote(noteEl, clientX, clientY) {
        const self = this;
        const spec = {
            ariaLabel: "Note et mise en forme",
            state: this._notePreferencesFromElement(noteEl),
            onIntent: function (state) {
                self._applyToolbarStateToNote(noteEl, state);
            },
        };
        if (clientX != null && clientY != null) {
            spec.rect = {
                left: clientX,
                top: clientY,
                width: 0,
                height: 0,
                right: clientX,
                bottom: clientY,
            };
            spec.preferAbove = true;
        } else {
            spec.noteEl = noteEl;
            spec.preferAbove = true;
        }
        window.LouAnnotationController.openForNote(spec);
    },

    _dismissNoteToolbar(cancelPending) {
        if (window.LouAnnotationController) {
            window.LouAnnotationController.dismissNote();
        }
        if (cancelPending && this._activeEditNote) {
            this._cancelPendingNote(this._activeEditNote);
        }
    },

    _cancelPendingNote(noteEl) {
        if (!noteEl || noteEl.hasAttribute("data-note-id")) {
            return;
        }
        this._pendingAnchors.delete(noteEl);
        this._exitEditMode(noteEl);
        noteEl.remove();
        if (this._activeEditNote === noteEl) {
            this._activeEditNote = null;
        }
    },

    _notePreferencesFromElement(noteEl) {
        if (!noteEl) {
            return window.LouAnnotationColors.getLastNotePreferences();
        }
        const colorId =
            noteEl.dataset.noteColor ||
            noteEl.dataset.pendingNoteColor ||
            window.LouAnnotationColors.getLastNoteColorId();
        return {
            colorId: colorId,
            bold:
                noteEl.dataset.noteBold === "true" ||
                noteEl.dataset.pendingNoteBold === "true",
            underline:
                noteEl.dataset.noteUnderline === "true" ||
                noteEl.dataset.pendingNoteUnderline === "true",
            strikethrough:
                noteEl.dataset.noteStrikethrough === "true" ||
                noteEl.dataset.pendingNoteStrikethrough === "true",
        };
    },

    _applyToolbarStateToNote(noteEl, state) {
        if (!noteEl || !state) {
            return;
        }
        const prefs = {
            colorId:
                state.colorId ||
                noteEl.dataset.pendingNoteColor ||
                noteEl.dataset.noteColor ||
                window.LouAnnotationColors.getLastNoteColorId(),
            bold: state.bold,
            underline: state.underline,
            strikethrough: state.strikethrough,
        };
        if (state.colorId) {
            prefs.colorId = window.LouAnnotationColors.normalizeColorId(
                state.colorId,
                window.LouAnnotationColors.getLastNoteColorId()
            );
            noteEl.dataset.pendingNoteColor = prefs.colorId;
        }
        window.LouAnnotationColors.applyNotePreferences(noteEl, prefs);
        noteEl.dataset.pendingNoteBold = prefs.bold ? "true" : "false";
        noteEl.dataset.pendingNoteUnderline = prefs.underline ? "true" : "false";
        noteEl.dataset.pendingNoteStrikethrough = prefs.strikethrough
            ? "true"
            : "false";
        window.LouAnnotationColors.setLastNotePreferences(prefs);
    },

    _pendingNotePreferences(noteEl) {
        return {
            colorId:
                noteEl.dataset.pendingNoteColor ||
                noteEl.dataset.noteColor ||
                window.LouAnnotationColors.getLastNoteColorId(),
            bold: noteEl.dataset.pendingNoteBold === "true",
            underline: noteEl.dataset.pendingNoteUnderline === "true",
            strikethrough: noteEl.dataset.pendingNoteStrikethrough === "true",
        };
    },

    _persistNotePresentation(noteEl, recordId) {
        const prefs = this._pendingNotePreferences(noteEl);
        window.LouAnnotationColors.setRecordColor("note", recordId, prefs.colorId);
        window.LouAnnotationColors.setRecordStyle("note", recordId, prefs);
        window.LouAnnotationColors.setLastNotePreferences(prefs);
        delete noteEl.dataset.pendingNoteColor;
        delete noteEl.dataset.pendingNoteBold;
        delete noteEl.dataset.pendingNoteUnderline;
        delete noteEl.dataset.pendingNoteStrikethrough;
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
                    if (noteEl && self._activeEditNote === noteEl) {
                        self._exitEditMode(noteEl);
                        self._activeEditNote = null;
                    }
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
                window.LouAnnotationColors.removeRecordColor("note", id);
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
        if (this._activeEditNote === noteEl) {
            this._dismissNoteToolbar(false);
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
            (pending.context.projection && pending.context.projection.id) ||
            pending.sourceProjection ||
            window.LouRenderer.resolveProjectionId(
                pending.context,
                pending.element,
                pending.sourceProjection
            );
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
                    self._persistNotePresentation(noteEl, id);
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
        const textSnapshot =
            snapshot && typeof snapshot === "object" ? snapshot.text : snapshot;
        const prefsSnapshot =
            snapshot && typeof snapshot === "object" ? snapshot.prefs : null;
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

        const currentPrefs = this._pendingNotePreferences(noteEl);
        const textUnchanged =
            textSnapshot !== undefined && text === textSnapshot;
        const prefsUnchanged =
            prefsSnapshot && this._prefsEqual(currentPrefs, prefsSnapshot);

        if (textUnchanged && prefsUnchanged) {
            this._exitEditMode(noteEl);
            this._editSnapshots.delete(noteEl);
            if (this._activeEditNote === noteEl) {
                this._activeEditNote = null;
            }
            return;
        }

        if (textUnchanged && text !== "") {
            this._persistNotePresentation(noteEl, id);
            this._editSnapshots.delete(noteEl);
            this._exitEditMode(noteEl);
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
                    if (textSnapshot !== undefined) {
                        noteEl.textContent = textSnapshot;
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
                self._persistNotePresentation(noteEl, id);
                self._editSnapshots.delete(noteEl);
                self._exitEditMode(noteEl);
                if (self._activeEditNote === noteEl) {
                    self._activeEditNote = null;
                }
            },
            onFailureConnected: function () {
                if (textSnapshot !== undefined) {
                    noteEl.textContent = textSnapshot;
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
