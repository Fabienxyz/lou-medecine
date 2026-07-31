// Pedagogical blocks (IMPLEMENTATION_CONTRACT.md Part B, C.4, C.7).
//
// A block is one Blueprint element, in the order the contract fixes:
//
//   Question -> Official Visual (optional) -> 📷 Personal Diagram -> Guided Walkthrough
//
// The block's identity is the Blueprint-element id, so this file mints no identifiers and holds no
// medical content: every learner-visible string below is either chrome or comes from the manifest.
window.LouBlocks = {
    LABELS: {
        addDiagram: "📷 Ajouter mon schéma",
        diagramHint:
            "Photographie ton schéma. Il reste à toi : rien ne le lit et rien ne le corrige.",
        deleteDiagram: "Retirer",
        orphanTitle: "Tes ajouts dont le point d’ancrage a disparu",
        orphanHint:
            "L’élément correspondant n’existe plus dans ce chapitre. Rien n’a été supprimé.",
        orphanAnnotationsTitle: "Annotations personnelles non restaurables",
        orphanAnnotationsHint:
            "Ces annotations existent toujours localement, mais leur ancre ne peut plus être résolue. Rien n’a été supprimé.",
        orphanNoteKind: "Note de walkthrough",
        orphanHighlightKind: "Surlignage",
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
        const sourceProjection =
            context.sourceProjectionId ||
            (context.projection && context.projection.id);
        if (sourceProjection) {
            block.dataset.sourceProjection = sourceProjection;
        }

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
        if (record.blob == null) {
            console.warn(
                "[LouBlocks] Skipping personal diagram with invalid blob.",
                record.id
            );
            return null;
        }

        const card = document.createElement("figure");
        card.className = "personal-diagram";
        card.dataset.learner = "true";

        const img = document.createElement("img");
        try {
            img.src = this._objectUrl(record.blob);
        } catch (err) {
            console.warn(
                "[LouBlocks] Skipping personal diagram with invalid blob.",
                record.id,
                err
            );
            return null;
        }
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

    _runtimeBlockKey(element, sourceProjection, composition) {
        if (composition && sourceProjection) {
            return sourceProjection + "\0" + element;
        }
        return element;
    },

    _isCompositionContext(context) {
        return !!(context && context.view);
    },

    /**
     * Load stored Personal Diagrams into the blocks that are on screen.
     *
     * Degradation is honest (C.7, C.8):
     *   - element still exists in the chapter but is projected elsewhere → not shown here, not lost;
     *   - element no longer exists anywhere in the chapter → surfaced as orphaned, never discarded.
     */
    async hydrate(root, context) {
        const self = this;
        const composition = this._isCompositionContext(context);
        const blocks = new Map();
        root.querySelectorAll(".pedagogical-block").forEach(function (block) {
            const key = self._runtimeBlockKey(
                block.dataset.element,
                block.dataset.sourceProjection,
                composition
            );
            blocks.set(key, block);
        });

        const chapterElements = new Set();
        (context.manifest.projections || []).forEach(function (projection) {
            (projection.elements || []).forEach(function (id) {
                chapterElements.add(id);
            });
        });

        const orphans = [];
        const diagrams = await context.store.listPersonalDiagrams(context.chapter);

        diagrams.forEach(function (record) {
            let block = null;
            if (composition) {
                const matches = [];
                blocks.forEach(function (candidate, key) {
                    if (key.endsWith("\0" + record.element)) {
                        matches.push(candidate);
                    }
                });
                if (matches.length === 1) {
                    block = matches[0];
                } else if (matches.length > 1) {
                    console.warn(
                        "[LouBlocks] Composition diagram hydrate ambiguous: element=" +
                            record.element +
                            " matches " +
                            matches.length +
                            " blocks; projection-scoped anchor required"
                    );
                }
            } else {
                block = blocks.get(record.element);
            }
            if (block) {
                const card = self._diagramCard(record, context);
                if (card) {
                    block.querySelector(".diagram-gallery").appendChild(card);
                }
            } else if (!chapterElements.has(record.element)) {
                orphans.push(record);
            }
        });

        if (orphans.length) {
            root.appendChild(this._orphanPanel(orphans, context));
        }
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

        orphans.forEach(function (record) {
            const item = self._diagramCard(record, context);
            if (!item) {
                return;
            }
            const label = document.createElement("p");
            label.className = "orphan-anchor";
            label.textContent = record.element;
            panel.appendChild(label);
            panel.appendChild(item);
        });

        return panel;
    },

    // Honest degradation for unrestorable notes / highlights (RCC §6.6): signal, never delete.
    ensureOrphanPanel(root, titleText, hintText) {
        let panel = root.querySelector(".learner-orphans");
        if (panel) {
            return panel;
        }
        panel = document.createElement("section");
        panel.className = "learner-orphans";
        panel.dataset.learner = "true";

        const title = document.createElement("p");
        title.className = "orphan-title";
        title.textContent = titleText || this.LABELS.orphanAnnotationsTitle;
        panel.appendChild(title);

        const hint = document.createElement("p");
        hint.className = "orphan-hint";
        hint.textContent = hintText || this.LABELS.orphanAnnotationsHint;
        panel.appendChild(hint);

        root.appendChild(panel);
        return panel;
    },

    appendAnnotationOrphans(root, orphans) {
        if (!orphans || !orphans.length) {
            return null;
        }
        const self = this;
        const panel = this.ensureOrphanPanel(
            root,
            this.LABELS.orphanAnnotationsTitle,
            this.LABELS.orphanAnnotationsHint
        );

        orphans.forEach(function (item) {
            const record = item.record || {};
            const row = document.createElement("div");
            row.className = "learner-orphan-annotation";
            row.dataset.learner = "true";
            row.dataset.orphanKind = item.kind;
            if (record.id != null) {
                row.dataset.orphanId = String(record.id);
            }
            if (record.element) {
                row.dataset.orphanElement = record.element;
            }
            row.setAttribute("role", "status");

            const kindLabel =
                item.kind === "highlight"
                    ? self.LABELS.orphanHighlightKind
                    : self.LABELS.orphanNoteKind;
            const preview =
                item.kind === "highlight"
                    ? (record.selector && record.selector.exact) || ""
                    : record.text || "";

            const kindEl = document.createElement("p");
            kindEl.className = "orphan-anchor";
            kindEl.textContent =
                kindLabel +
                (record.element ? " — " + record.element : "");
            row.appendChild(kindEl);

            if (preview) {
                const body = document.createElement("p");
                body.className = "orphan-annotation-preview";
                body.textContent = preview;
                row.appendChild(body);
            }

            panel.appendChild(row);
        });

        return panel;
    },

    async render(host, html, context) {
        this.releaseObjectUrls();
        const fragment = this.assemble(html, context);
        host.innerHTML = "";
        host.appendChild(fragment);
        try {
            await this.hydrate(host, context);
        } catch (err) {
            console.warn(
                "[LouBlocks] Learner artifact hydration failed; official content remains.",
                err
            );
        }
        try {
            if (window.LouSvgLoader) {
                await window.LouSvgLoader.loadAllFigures(host, context);
            }
        } catch (err) {
            console.warn(
                "[LouBlocks] Official SVG loading failed; learner layers continue.",
                err
            );
        } finally {
            if (window.LouTextHighlights) {
                await window.LouTextHighlights.mount(host, context);
            }
            if (window.LouInlineNotes) {
                await window.LouInlineNotes.mount(host, context);
            }
            if (window.LouInlineFormatting) {
                await window.LouInlineFormatting.mount(host, context);
            }
        }
    },
};
