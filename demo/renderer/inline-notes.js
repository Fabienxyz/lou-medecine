// Walkthrough Notes (Renderer V2.2) — restore-only pass.
//
// Reads persisted notes from IndexedDB and injects additive spans into official walkthroughs.
// No UI, no listeners, no store writes. Anchoring delegated entirely to LouCaretAnchor.
window.LouInlineNotes = {
    NOTE_CLASS: "walkthrough-note",

    async mount(host, context) {
        try {
            await this.restore(host, context);
        } catch (err) {
            console.warn("[LouInlineNotes] Note restore failed.", err);
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
};
