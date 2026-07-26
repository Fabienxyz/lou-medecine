// Walkthrough Notes (Renderer V2.2) — restore + create (commit 5).
//
// Reads persisted notes from IndexedDB and injects additive spans into official walkthroughs.
// Context menu create flow: pending span → blur persist/discard. Anchoring via LouCaretAnchor only.
window.LouInlineNotes = {
    NOTE_CLASS: "walkthrough-note",
    MENU_CLASS: "inline-notes-context-menu",
    _MENU_ADD_LABEL: "Add note",

    _boundHost: null,
    _bindContext: null,
    _contextMenuEl: null,
    _pendingMenuContext: null,
    _activeEditNote: null,
    _committing: false,
    _commitInFlight: null,
    _pendingAnchors: new WeakMap(),
    _onDocumentMouseDown: null,
    _onWindowScroll: null,

    async mount(host, context) {
        this._hideContextMenu();
        this._activeEditNote = null;
        this._committing = false;
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
        const walkthrough = this._walkthroughFromTarget(event.target, host);
        if (!walkthrough) {
            return;
        }
        if (this._noteFromElement(event.target)) {
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

        const button = document.createElement("button");
        button.type = "button";
        button.textContent = this._MENU_ADD_LABEL;
        button.setAttribute("role", "menuitem");

        const self = this;
        button.addEventListener("click", function () {
            void self._onCreateNote(self._pendingMenuContext);
        });

        menu.appendChild(button);
        document.body.appendChild(menu);
        this._contextMenuEl = menu;
        return menu;
    },

    _showContextMenu(clientX, clientY, menuContext) {
        const menu = this._ensureContextMenu();
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

        const text = noteEl.textContent.trim();

        if (!text) {
            this._exitEditMode(noteEl);
            this._pendingAnchors.delete(noteEl);
            noteEl.remove();
            if (this._activeEditNote === noteEl) {
                this._activeEditNote = null;
            }
            return;
        }

        if (noteEl.hasAttribute("data-note-id")) {
            this._exitEditMode(noteEl);
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

        this._committing = true;
        const self = this;
        const commitWork = (async function () {
            try {
                const id = await store.addWalkthroughNote(
                    chapter,
                    projection,
                    pending.element,
                    pending.anchor,
                    text
                );
                noteEl.setAttribute("data-note-id", String(id));
                self._pendingAnchors.delete(noteEl);
                self._exitEditMode(noteEl);
                if (self._activeEditNote === noteEl) {
                    self._activeEditNote = null;
                }
            } catch (err) {
                self._rollbackNote(noteEl);
                self._pendingAnchors.delete(noteEl);
                if (self._activeEditNote === noteEl) {
                    self._activeEditNote = null;
                }
            }
        })();
        this._commitInFlight = commitWork;
        try {
            await commitWork;
        } finally {
            this._commitInFlight = null;
            this._committing = false;
        }
    },

    _rollbackNote(noteEl) {
        this._exitEditMode(noteEl);
        noteEl.remove();
    },
};
