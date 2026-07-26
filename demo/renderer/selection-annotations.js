// Text selection annotations (Renderer V2.2+).
//
// Selection toolbar, selection notes, and future text-annotation UX. Highlight restore/apply
// delegates to LouTextHighlights; anchoring uses the shared TextQuoteSelector helpers there.
window.LouSelectionAnnotations = {
    HIGHLIGHT_LABEL: "Surligner",
    NOTE_LABEL: "Note",
    NOTE_CLASS: "selection-note",

    _toolbar: null,
    _highlightBtn: null,
    _noteEditor: null,
    _boundHost: null,
    _selectionContext: null,

    mount(host, context) {
        const self = this;
        const chain = window.LouTextHighlights
            ? window.LouTextHighlights.restore(host, context)
            : Promise.resolve();
        return chain.then(function () {
            return self.restoreSelectionNotes(host, context);
        }).then(function () {
            self.bindSelection(host, context);
        });
    },

    bindSelection(host, context) {
        const self = this;
        if (this._boundHost === host) {
            return;
        }
        this._boundHost = host;
        this.dismissToolbar();

        host.addEventListener("mouseup", function (event) {
            if (
                event.target.closest(".highlight-toolbar") ||
                event.target.closest(".selection-note-editor")
            ) {
                return;
            }
            window.requestAnimationFrame(function () {
                self._onSelectionChange(host, context);
            });
        });

        document.addEventListener("keydown", function (event) {
            if (event.key === "Escape") {
                self.dismissToolbar();
            }
        });

        document.addEventListener("mousedown", function (event) {
            if (
                (self._toolbar && self._toolbar.contains(event.target)) ||
                (self._noteEditor && self._noteEditor.contains(event.target))
            ) {
                return;
            }
            self.dismissToolbar();
        });
    },

    _onSelectionChange(host, context) {
        const selection = window.getSelection();
        if (!selection || selection.isCollapsed || selection.rangeCount === 0) {
            this.dismissToolbar();
            return;
        }

        const range = selection.getRangeAt(0);
        const walkthrough = this._officialWalkthrough(range.commonAncestorContainer, host);
        if (!walkthrough || !walkthrough.contains(range.commonAncestorContainer)) {
            this.dismissToolbar();
            return;
        }

        const block = walkthrough.closest(".pedagogical-block");
        if (!block) {
            this.dismissToolbar();
            return;
        }

        this._selectionContext = {
            host: host,
            context: context,
            walkthrough: walkthrough,
            element: block.dataset.element,
            range: range.cloneRange(),
        };
        this._showToolbar(range);
    },

    _officialWalkthrough(node, host) {
        if (!node) {
            return null;
        }
        const el = node.nodeType === Node.ELEMENT_NODE ? node : node.parentElement;
        if (!el) {
            return null;
        }
        const walkthrough = el.closest("[data-official='true']");
        if (!walkthrough || !host.contains(walkthrough)) {
            return null;
        }
        return walkthrough;
    },

    _selectionInsideHighlight(range) {
        const node = range.commonAncestorContainer;
        const el = node.nodeType === Node.ELEMENT_NODE ? node : node.parentElement;
        return !!(el && el.closest("." + window.LouTextHighlights.HIGHLIGHT_CLASS));
    },

    _showToolbar(range) {
        const rect = range.getBoundingClientRect();
        if (!rect.width && !rect.height) {
            return;
        }

        if (!this._toolbar) {
            const toolbar = document.createElement("div");
            toolbar.className = "highlight-toolbar";
            toolbar.setAttribute("role", "toolbar");
            toolbar.setAttribute("aria-label", "Annotations");

            const highlightBtn = document.createElement("button");
            highlightBtn.type = "button";
            highlightBtn.className = "highlight-toolbar-btn";
            highlightBtn.textContent = this.HIGHLIGHT_LABEL;
            highlightBtn.addEventListener("click", function () {
                LouSelectionAnnotations._applyHighlight();
            });

            const noteBtn = document.createElement("button");
            noteBtn.type = "button";
            noteBtn.className = "highlight-toolbar-btn highlight-toolbar-btn-note";
            noteBtn.textContent = this.NOTE_LABEL;
            noteBtn.addEventListener("click", function () {
                LouSelectionAnnotations._openNoteEditor();
            });

            toolbar.appendChild(highlightBtn);
            toolbar.appendChild(noteBtn);
            this._toolbar = toolbar;
            this._highlightBtn = highlightBtn;
            document.body.appendChild(toolbar);
        }

        if (this._highlightBtn) {
            this._highlightBtn.disabled = this._selectionInsideHighlight(range);
        }

        this._toolbar.style.left = Math.max(8, rect.left + window.scrollX) + "px";
        this._toolbar.style.top =
            Math.max(8, rect.top + window.scrollY - this._toolbar.offsetHeight - 8) + "px";
        this._toolbar.hidden = false;
    },

    dismissToolbar() {
        this._closeNoteEditor();
        if (this._toolbar) {
            this._toolbar.hidden = true;
        }
        this._selectionContext = null;
        const selection = window.getSelection();
        if (selection) {
            selection.removeAllRanges();
        }
    },

    _applyHighlight() {
        const ctx = this._selectionContext;
        if (!ctx || !window.LouTextHighlights) {
            return;
        }
        if (this._selectionInsideHighlight(ctx.range)) {
            return;
        }

        window.LouTextHighlights.applyHighlight(
            ctx.walkthrough,
            ctx.range,
            ctx.context,
            ctx.element
        );
        this.dismissToolbar();
    },

    _openNoteEditor() {
        const self = this;
        const ctx = this._selectionContext;
        if (!ctx || this._noteEditor) {
            return;
        }

        const rect = ctx.range.getBoundingClientRect();
        const editor = document.createElement("form");
        editor.className = "selection-note-editor";
        editor.setAttribute("role", "dialog");
        editor.setAttribute("aria-label", "Note sur la sélection");

        const field = document.createElement("textarea");
        field.rows = 3;
        field.placeholder = "Ta note…";

        const save = document.createElement("button");
        save.type = "submit";
        save.className = "note-save";
        save.textContent = "Enregistrer";

        const cancel = document.createElement("button");
        cancel.type = "button";
        cancel.className = "note-cancel";
        cancel.textContent = "Annuler";
        cancel.addEventListener("click", function () {
            self._closeNoteEditor();
        });

        editor.addEventListener("submit", function (event) {
            event.preventDefault();
            const text = field.value.trim();
            if (!text) {
                self._closeNoteEditor();
                return;
            }
            self._saveSelectionNote(text);
        });

        editor.appendChild(field);
        editor.appendChild(save);
        editor.appendChild(cancel);
        document.body.appendChild(editor);
        this._noteEditor = editor;

        if (this._toolbar) {
            this._toolbar.hidden = true;
        }

        editor.style.left = Math.max(8, rect.left + window.scrollX) + "px";
        editor.style.top =
            Math.max(8, rect.bottom + window.scrollY + 8) + "px";
        field.focus();
    },

    _closeNoteEditor() {
        if (this._noteEditor) {
            this._noteEditor.remove();
            this._noteEditor = null;
        }
    },

    _saveSelectionNote(noteText) {
        const ctx = this._selectionContext;
        if (!ctx || !window.LouTextHighlights) {
            this.dismissToolbar();
            return;
        }

        const selector = window.LouTextHighlights.selectorFromRange(
            ctx.walkthrough,
            ctx.range
        );
        if (!selector || !selector.exact) {
            this.dismissToolbar();
            return;
        }

        const callout = this._renderSelectionNote(selector.exact, noteText);
        const anchor = this._blockAncestor(ctx.walkthrough, ctx.range.endContainer);
        if (anchor) {
            anchor.insertAdjacentElement("afterend", callout);
        } else {
            ctx.walkthrough.appendChild(callout);
        }

        const projection = ctx.context.projection && ctx.context.projection.id;
        ctx.context.store
            .addSelectionNote(
                ctx.context.chapter,
                projection,
                ctx.element,
                selector,
                noteText
            )
            .catch(function () {
                callout.remove();
            });

        this.dismissToolbar();
    },

    async restoreSelectionNotes(host, context) {
        const self = this;
        const projection = context.projection && context.projection.id;
        if (!projection || !context.store.listSelectionNotes) {
            return;
        }

        const rows = await context.store.listSelectionNotes(
            context.chapter,
            projection
        );
        rows.forEach(function (record) {
            const block = host.querySelector(
                '.pedagogical-block[data-element="' + record.element + '"]'
            );
            if (!block) {
                return;
            }
            const walkthrough = block.querySelector(".block-walkthrough");
            if (!walkthrough || !record.noteText) {
                return;
            }
            const range = window.LouTextHighlights.findRangeForSelector(
                walkthrough,
                record.selector
            );
            if (!range) {
                return;
            }
            const callout = self._renderSelectionNote(
                record.selector.exact,
                record.noteText
            );
            const anchor = self._blockAncestor(walkthrough, range.endContainer);
            if (anchor) {
                anchor.insertAdjacentElement("afterend", callout);
            } else {
                walkthrough.appendChild(callout);
            }
        });
    },

    _renderSelectionNote(quoteText, noteText) {
        const note = document.createElement("div");
        note.className = this.NOTE_CLASS;
        note.dataset.learner = "true";

        const quote = document.createElement("p");
        quote.className = "selection-note-quote";
        quote.textContent = quoteText;

        const body = document.createElement("p");
        body.className = "selection-note-text";
        body.textContent = noteText;

        note.appendChild(quote);
        note.appendChild(body);
        return note;
    },

    _blockAncestor(walkthrough, node) {
        let current = node.nodeType === Node.ELEMENT_NODE ? node : node.parentElement;
        while (current && current.parentElement !== walkthrough) {
            current = current.parentElement;
        }
        return current;
    },
};
