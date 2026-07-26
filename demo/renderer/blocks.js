// Pedagogical blocks (IMPLEMENTATION_CONTRACT.md Part B, C.4, C.7).
//
// A block is one Blueprint element, in the order the contract fixes:
//
//   Question -> Official Visual (optional) -> 📷 Personal Diagram -> Guided Walkthrough -> 📝 Inline Notes
//
// The block's identity is the Blueprint-element id, so this file mints no identifiers and holds no
// medical content: every learner-visible string below is either chrome or comes from the manifest.
window.LouBlocks = {
    LABELS: {
        addDiagram: "📷 Ajouter mon schéma",
        diagramHint:
            "Photographie ton schéma. Il reste à toi : rien ne le lit et rien ne le corrige.",
        deleteDiagram: "Retirer",
        addNote: "📝 Note",
        notePlaceholder: "Ta note…",
        saveNote: "Enregistrer",
        cancelNote: "Annuler",
        deleteNote: "Supprimer",
        movedAnchor: "Note rattachée au bloc : le passage annoté a été régénéré.",
        orphanTitle: "Tes ajouts dont le point d’ancrage a disparu",
        orphanHint:
            "L’élément correspondant n’existe plus dans ce chapitre. Rien n’a été supprimé.",
    },

    _objectUrls: [],

    releaseObjectUrls() {
        this._objectUrls.forEach(function (url) {
            URL.revokeObjectURL(url);
        });
        this._objectUrls = [];
    },

    _objectUrl(blob) {
        const url = URL.createObjectURL(blob);
        this._objectUrls.push(url);
        return url;
    },

    // `prepareLearnerMarkdown` keeps element anchors as inline markers so the block boundary
    // survives markdown parsing. Without this the visual could only be placed by ordinal position,
    // which the renderer contract forbids.
    promoteElementAnchors(root) {
        root.querySelectorAll("[data-element-anchor]").forEach(function (marker) {
            const heading = marker.closest("h1, h2, h3, h4, h5, h6");
            if (heading) {
                heading.id = marker.getAttribute("data-element-anchor");
            }
            marker.remove();
        });
    },

    /**
     * Group flat parsed markdown into blocks. A heading whose id is a known Blueprint element opens
     * a block; everything up to the next such heading is that block's walkthrough. Content before
     * the first block is a preamble and is left alone — the renderer never invents a block for
     * content that is not shaped as one.
     */
    assemble(html, context) {
        const source = document.createElement("div");
        source.innerHTML = html;
        this.promoteElementAnchors(source);

        const known = new Set(context.projection.elements || []);
        const out = document.createDocumentFragment();
        let walkthrough = null;

        while (source.firstChild) {
            const node = source.firstChild;

            if (node.nodeType === Node.ELEMENT_NODE) {
                const isBoundary =
                    node.tagName === "H2" && node.id && known.has(node.id);
                if (isBoundary) {
                    walkthrough = this._openBlock(out, node, context);
                    continue;
                }
                // Legacy `---` rules separated sections; blocks provide their own separation and
                // the rule carries no content.
                if (node.tagName === "HR" && walkthrough) {
                    node.remove();
                    continue;
                }
            }

            (walkthrough || out).appendChild(node);
        }

        return out;
    },

    _openBlock(out, heading, context) {
        const elementId = heading.id;
        const block = document.createElement("section");
        block.className = "pedagogical-block";
        block.dataset.element = elementId;

        heading.classList.add("block-question");
        // Generated content is immutable to the learner: it is marked as generated and no editing
        // affordance is ever attached to it.
        heading.dataset.generated = "true";
        block.appendChild(heading);

        const visual = this._officialVisual(elementId, context);
        if (visual) {
            block.appendChild(visual);
        }

        block.appendChild(this._diagramSlot(elementId, context));

        const walkthrough = document.createElement("div");
        walkthrough.className = "block-walkthrough";
        walkthrough.dataset.generated = "true";
        walkthrough.dataset.official = "true";
        block.appendChild(walkthrough);

        out.appendChild(block);
        return walkthrough;
    },

    // The visual is bound to its block by element id, and its three availability states stay
    // distinguishable: published renders a figure, withheld or planned-not-built renders the
    // manifest-derived notice, and an element with no entry renders nothing at all.
    _officialVisual(elementId, context) {
        const relPath = (context.projection.visuals || {})[elementId];
        if (relPath) {
            const figure = document.createElement("figure");
            figure.className = "official-visual";
            figure.dataset.element = elementId;
            figure.dataset.generated = "true";
            const img = document.createElement("img");
            img.src = context.config.resolveAssetPath(context.chapter, relPath);
            img.alt = context.renderer.visualAltText(context.manifest, elementId);
            figure.appendChild(img);
            return figure;
        }

        const notice = context.renderer.visualStateNotice(
            context.manifest,
            elementId
        );
        if (!notice) {
            return null;
        }
        const holder = document.createElement("div");
        holder.innerHTML = notice;
        return holder.firstElementChild;
    },

    // 📷 Personal Diagram — on every block, whether or not an Official Visual exists (C.8). The
    // behaviour it serves (redrawing a mechanism to understand it) does not depend on a figure.
    _diagramSlot(elementId, context) {
        const self = this;
        const slot = document.createElement("div");
        slot.className = "learner-diagrams";
        slot.dataset.element = elementId;

        const gallery = document.createElement("div");
        gallery.className = "diagram-gallery";

        const input = document.createElement("input");
        input.type = "file";
        input.accept = "image/*";
        // Lets a phone open the camera directly, which is how a paper drawing gets captured.
        input.setAttribute("capture", "environment");
        input.hidden = true;

        const button = document.createElement("button");
        button.type = "button";
        button.className = "learner-affordance diagram-affordance";
        button.textContent = this.LABELS.addDiagram;
        button.title = this.LABELS.diagramHint;
        button.addEventListener("click", function () {
            input.click();
        });

        input.addEventListener("change", function () {
            const file = input.files && input.files[0];
            input.value = "";
            if (!file) {
                return;
            }
            context.store
                .addPersonalDiagram(context.chapter, elementId, file)
                .then(function (id) {
                    gallery.appendChild(
                        self._diagramCard({ id: id, blob: file }, context)
                    );
                });
        });

        slot.appendChild(button);
        slot.appendChild(input);
        slot.appendChild(gallery);
        return slot;
    },

    _diagramCard(record, context) {
        const self = this;
        const card = document.createElement("figure");
        card.className = "personal-diagram";
        card.dataset.learner = "true";

        const img = document.createElement("img");
        img.src = this._objectUrl(record.blob);
        img.alt = "";
        card.appendChild(img);

        const caption = document.createElement("figcaption");
        caption.textContent = "Mon schéma";
        const remove = document.createElement("button");
        remove.type = "button";
        remove.className = "learner-remove";
        remove.textContent = this.LABELS.deleteDiagram;
        remove.addEventListener("click", function () {
            context.store.deletePersonalDiagram(record.id).then(function () {
                card.remove();
            });
        });
        caption.appendChild(remove);
        card.appendChild(caption);
        return card;
    },

    // 📝 Inline Notes — anchored to a claim-block boundary inside the walkthrough (C.9), which is
    // the finest anchor the architecture can keep durable across regeneration.
    mountNoteAffordances(root, context) {
        const self = this;
        root.querySelectorAll(".pedagogical-block").forEach(function (block) {
            block
                .querySelectorAll(".block-walkthrough .claim-trace-link")
                .forEach(function (link) {
                    const claimId = link.dataset.claim;
                    const button = document.createElement("button");
                    button.type = "button";
                    button.className = "learner-affordance note-affordance";
                    button.textContent = self.LABELS.addNote;
                    button.dataset.claim = claimId;
                    button.addEventListener("click", function () {
                        self._openNoteEditor(block, claimId, context);
                    });
                    link.insertAdjacentElement("afterend", button);
                });
        });
    },

    _notesContainer(block, claimId) {
        const walkthrough = block.querySelector(".block-walkthrough");
        const existing = walkthrough.querySelector(
            '[data-notes-for="' + claimId + '"]'
        );
        if (existing) {
            return existing;
        }
        const container = document.createElement("div");
        container.className = "inline-notes";
        container.dataset.notesFor = claimId;

        const affordance = walkthrough.querySelector(
            '.note-affordance[data-claim="' + claimId + '"]'
        );
        const anchorBlock = affordance
            ? this._topLevelAncestor(affordance, walkthrough)
            : null;
        if (anchorBlock) {
            anchorBlock.insertAdjacentElement("afterend", container);
        } else {
            walkthrough.appendChild(container);
        }
        return container;
    },

    _topLevelAncestor(node, root) {
        let current = node;
        while (current && current.parentElement !== root) {
            current = current.parentElement;
        }
        return current;
    },

    _openNoteEditor(block, claimId, context) {
        const self = this;
        const container = this._notesContainer(block, claimId);
        if (container.querySelector(".note-editor")) {
            return;
        }

        const editor = document.createElement("form");
        editor.className = "note-editor";
        const field = document.createElement("textarea");
        field.rows = 3;
        field.placeholder = this.LABELS.notePlaceholder;

        const save = document.createElement("button");
        save.type = "submit";
        save.className = "note-save";
        save.textContent = this.LABELS.saveNote;

        const cancel = document.createElement("button");
        cancel.type = "button";
        cancel.className = "note-cancel";
        cancel.textContent = this.LABELS.cancelNote;
        cancel.addEventListener("click", function () {
            editor.remove();
        });

        editor.addEventListener("submit", function (event) {
            event.preventDefault();
            const text = field.value.trim();
            if (!text) {
                editor.remove();
                return;
            }
            context.store
                .addInlineNote(
                    context.chapter,
                    block.dataset.element,
                    claimId,
                    text
                )
                .then(function (id) {
                    editor.remove();
                    container.appendChild(
                        self._noteCard(
                            { id: id, text: text, claim: claimId },
                            context,
                            false
                        )
                    );
                });
        });

        editor.appendChild(field);
        editor.appendChild(save);
        editor.appendChild(cancel);
        container.appendChild(editor);
        field.focus();
    },

    _noteCard(record, context, degraded) {
        const card = document.createElement("aside");
        card.className = "inline-note" + (degraded ? " inline-note-degraded" : "");
        card.dataset.learner = "true";

        if (degraded) {
            const marker = document.createElement("p");
            marker.className = "note-degraded-marker";
            marker.textContent = this.LABELS.movedAnchor;
            card.appendChild(marker);
        }

        const body = document.createElement("p");
        body.className = "note-text";
        body.textContent = record.text;
        card.appendChild(body);

        const remove = document.createElement("button");
        remove.type = "button";
        remove.className = "learner-remove";
        remove.textContent = this.LABELS.deleteNote;
        remove.addEventListener("click", function () {
            context.store.deleteInlineNote(record.id).then(function () {
                card.remove();
            });
        });
        card.appendChild(remove);
        return card;
    },

    /**
     * Load stored learner artifacts into the blocks that are on screen.
     *
     * Degradation is honest and has three distinct cases (C.7, C.9):
     *   - element still exists in the chapter but is projected elsewhere → not shown here, not lost;
     *   - element on screen but the annotated claim block was re-cut → shown, degraded to the block;
     *   - element no longer exists anywhere in the chapter → surfaced as orphaned, never discarded.
     */
    async hydrate(root, context) {
        const self = this;
        const blocks = new Map();
        root.querySelectorAll(".pedagogical-block").forEach(function (block) {
            blocks.set(block.dataset.element, block);
        });

        const chapterElements = new Set();
        (context.manifest.projections || []).forEach(function (projection) {
            (projection.elements || []).forEach(function (id) {
                chapterElements.add(id);
            });
        });

        const orphans = [];
        const [diagrams, notes] = await Promise.all([
            context.store.listPersonalDiagrams(context.chapter),
            context.store.listInlineNotes(context.chapter),
        ]);

        diagrams.forEach(function (record) {
            const block = blocks.get(record.element);
            if (block) {
                block
                    .querySelector(".diagram-gallery")
                    .appendChild(self._diagramCard(record, context));
            } else if (!chapterElements.has(record.element)) {
                orphans.push({ kind: "diagram", record: record });
            }
        });

        notes.forEach(function (record) {
            const block = blocks.get(record.element);
            if (!block) {
                if (!chapterElements.has(record.element)) {
                    orphans.push({ kind: "note", record: record });
                }
                return;
            }
            const anchorExists = !!block.querySelector(
                '.note-affordance[data-claim="' + record.claim + '"]'
            );
            if (anchorExists) {
                self._notesContainer(block, record.claim).appendChild(
                    self._noteCard(record, context, false)
                );
                return;
            }
            const fallback = self._blockLevelNotes(block);
            fallback.appendChild(self._noteCard(record, context, true));
        });

        if (orphans.length) {
            root.appendChild(this._orphanPanel(orphans, context));
        }
    },

    _blockLevelNotes(block) {
        const walkthrough = block.querySelector(".block-walkthrough");
        let container = walkthrough.querySelector('[data-notes-for="__block__"]');
        if (!container) {
            container = document.createElement("div");
            container.className = "inline-notes";
            container.dataset.notesFor = "__block__";
            walkthrough.appendChild(container);
        }
        return container;
    },

    _orphanPanel(orphans, context) {
        const self = this;
        const panel = document.createElement("section");
        panel.className = "learner-orphans";
        panel.dataset.learner = "true";

        const title = document.createElement("p");
        title.className = "orphan-title";
        title.textContent = this.LABELS.orphanTitle;
        panel.appendChild(title);

        const hint = document.createElement("p");
        hint.className = "orphan-hint";
        hint.textContent = this.LABELS.orphanHint;
        panel.appendChild(hint);

        orphans.forEach(function (orphan) {
            const item =
                orphan.kind === "diagram"
                    ? self._diagramCard(orphan.record, context)
                    : self._noteCard(orphan.record, context, false);
            const label = document.createElement("p");
            label.className = "orphan-anchor";
            label.textContent = orphan.record.element;
            panel.appendChild(label);
            panel.appendChild(item);
        });

        return panel;
    },

    async render(host, html, context) {
        this.releaseObjectUrls();
        const fragment = this.assemble(html, context);
        host.innerHTML = "";
        host.appendChild(fragment);
        this.mountNoteAffordances(host, context);
        await this.hydrate(host, context);
        if (window.LouSelectionAnnotations) {
            await window.LouSelectionAnnotations.mount(host, context);
        }
    },
};
