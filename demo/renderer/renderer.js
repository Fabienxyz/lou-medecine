window.LouRenderer = {
    contentEl: null,
    headerEls: null,
    tracePanelEl: null,
    _pendingLearnerLayers: null,

    init(contentEl, headerEls) {
        this.contentEl = contentEl;
        this.headerEls = headerEls || null;
        this.ensureTracePanel();
    },

    ensureTracePanel() {
        if (this.tracePanelEl) return;
        const panel = document.createElement("div");
        panel.id = "trace-panel";
        panel.className = "trace-panel hidden";
        panel.innerHTML =
            '<div class="trace-panel-inner">' +
            '<button type="button" class="trace-close" aria-label="Fermer">×</button>' +
            '<p class="trace-title">Source officielle</p>' +
            '<p class="trace-kp" id="trace-kp"></p>' +
            '<blockquote class="trace-quote" id="trace-quote"></blockquote>' +
            '<p class="trace-meta" id="trace-meta"></p>' +
            "</div>";
        document.body.appendChild(panel);
        panel.querySelector(".trace-close").addEventListener("click", function () {
            panel.classList.add("hidden");
        });
        this.tracePanelEl = panel;
    },

    async fetchResource(url, asJson) {
        let response;
        try {
            response = await fetch(url);
        } catch (err) {
            const error = new Error("Network error");
            error.code = "network";
            error.cause = err;
            throw error;
        }
        if (!response.ok) {
            const error = new Error("HTTP " + response.status);
            error.status = response.status;
            error.code = response.status === 404 ? "not_found" : "server";
            throw error;
        }
        if (asJson) {
            try {
                return await response.json();
            } catch (err) {
                const error = new Error("Invalid JSON");
                error.status = response.status;
                error.code = "invalid";
                error.cause = err;
                throw error;
            }
        }
        return response.text();
    },

    async fetchText(url) {
        return this.fetchResource(url, false);
    },

    async fetchJson(url) {
        return this.fetchResource(url, true);
    },

    // Manifest fetch doctrine (RCC §6.1 / §6.7): only a true absence (404) may activate legacy.
    classifyManifestFetchError(err) {
        if (!err) {
            return "network";
        }
        if (err.code === "not_found" || err.status === 404) {
            return "not_found";
        }
        if (err.code === "invalid") {
            return "invalid";
        }
        if (err.code === "network") {
            return "network";
        }
        if (err.code === "server" || (err.status && err.status >= 400)) {
            return "server";
        }
        return "network";
    },

    async loadPublishedManifest(chapterId, config) {
        if (!chapterId) {
            return { ok: false, reason: "no_chapter", useLegacy: false };
        }
        try {
            const manifest = await this.fetchJson(
                config.resolveManifestPath(chapterId)
            );
            return { ok: true, manifest: manifest };
        } catch (err) {
            const reason = this.classifyManifestFetchError(err);
            return {
                ok: false,
                reason: reason,
                useLegacy: reason === "not_found",
                error: err,
            };
        }
    },

    manifestErrorMessage(reason, config) {
        const messages = config.ERROR_MESSAGES;
        if (reason === "invalid") {
            return messages.manifestInvalid;
        }
        if (reason === "server") {
            return messages.manifestServer;
        }
        if (reason === "network") {
            return messages.manifestNetwork;
        }
        return messages.loadFailed;
    },

    productBootstrapErrorMessage(err, config) {
        if (!err) {
            return config.ERROR_MESSAGES.productBootstrap.UNKNOWN;
        }
        const messages = config.ERROR_MESSAGES.productBootstrap || {};
        const code =
            typeof err === "object" &&
            err !== null &&
            "code" in err &&
            typeof err.code === "string"
                ? err.code
                : null;
        if (code && messages[code]) {
            const detail = err instanceof Error ? err.message : String(err);
            return messages[code] + " (" + code + ") — " + detail;
        }
        if (err instanceof Error && err.message) {
            return messages.UNKNOWN + " — " + err.message;
        }
        return messages.UNKNOWN;
    },

    projectionAvailabilityMessage(availability, config) {
        if (availability === "known_absent") {
            return config.ERROR_MESSAGES.knownAbsent;
        }
        if (availability === "missing") {
            return config.ERROR_MESSAGES.projectionMissing;
        }
        if (availability === "invalid") {
            return config.ERROR_MESSAGES.projectionInvalid;
        }
        return config.PLACEHOLDER_MESSAGE;
    },

    applyHeaderMetadata(data) {
        if (!data || !this.headerEls) {
            return;
        }

        const els = this.headerEls;

        if (data.chapterLine && els.chapterLine) {
            els.chapterLine.textContent = data.chapterLine;
        }
        if (data.chapterTitle && els.chapterTitle) {
            els.chapterTitle.textContent = data.chapterTitle;
        }

        // Objectives and read-time remain on manifest for Amorçage / Couche 1 — not Shell chrome.
    },

    prepareLearnerMarkdown(raw) {
        let text = raw.replace(/^---\r?\n[\s\S]*?\r?\n---\r?\n/, "");
        text = text.replace(/<!--\s*claim-trace[\s\S]*?-->/, "");
        text = text.replace(/\{#([a-zA-Z0-9_-]+)\}/g, function (_m, id) {
            if (id.indexOf("cb-") === 0) {
                return (
                    ' <button type="button" class="claim-trace-link" data-claim="' +
                    id +
                    '" title="D\'où vient cette affirmation ?">source</button>'
                );
            }
            // A Blueprint-element anchor marks a pedagogical-block boundary, so it is preserved as
            // a marker rather than discarded. Dropping it would leave the Official Visual with no
            // identifier to bind to, and ordinal placement is forbidden.
            return (
                '<span data-element-anchor="' + id + '" hidden></span>'
            );
        });
        return text.trim();
    },

    // Alt text always comes from the manifest, which derives it from the visualSpec. The renderer
    // holds no medical content and must never author a visual's text alternative.
    visualAltText(manifest, elementId) {
        const entry = ((manifest && manifest.visuals) || []).find(function (v) {
            return v.element === elementId;
        });
        return (entry && entry.alt) || "";
    },

    // An Official Visual is optional support, so its absence is not automatically a defect. The
    // three manifest states must stay distinguishable and must never be collapsed: an element with
    // no entry warrants no visual and says nothing; a planned-but-unbuilt visual reports a known
    // gap; a withheld visual reports that support is temporarily unavailable. Nothing is hidden.
    VISUAL_STATE_MESSAGES: {
        "planned-not-built":
            "Visuel officiel prévu, pas encore produit. L'explication ci-dessous reste complète.",
        withheld:
            "Support visuel temporairement indisponible. L'explication ci-dessous reste complète.",
    },

    visualStateNotice(manifest, elementId) {
        const entry = ((manifest && manifest.official_visuals) || []).find(
            function (v) {
                return v.element === elementId;
            }
        );
        const message =
            entry && this.VISUAL_STATE_MESSAGES[entry.state];
        if (!message) {
            return "";
        }
        return (
            '<p class="visual-unavailable" data-element="' +
            elementId +
            '" data-state="' +
            entry.state +
            '" role="status">' +
            message +
            "</p>"
        );
    },

    // Blocks are assembled as DOM rather than as a string, because the learner affordances need
    // event handlers and stored artifacts need to be loaded asynchronously.
    /** @deprecated Legacy prototype path — nominal chapters use Composition V1. */
    async renderProjection(html, context) {
        this.replayAnimation(this.contentEl);
        await LouBlocks.render(this.contentEl, html, context);
    },

    replayAnimation(el) {
        el.style.animation = "none";
        el.offsetHeight;
        el.style.animation = "";
    },

    showMessage(message, options) {
        this.replayAnimation(this.contentEl);
        const state = options && options.state;
        const stateAttr = state
            ? ' data-state="' + this.escapeHtml(String(state)) + '"'
            : "";
        this.contentEl.innerHTML =
            '<p class="content-status"' +
            stateAttr +
            ">" +
            this.escapeHtml(message) +
            "</p>";
    },

    injectHtml(html) {
        this.replayAnimation(this.contentEl);
        this.contentEl.innerHTML = html;
    },

    async showTraceability(claimId, traceIndexUrl) {
        this.ensureTracePanel();
        const index = await this.fetchJson(traceIndexUrl);
        const entry = index[claimId];
        if (!entry) {
            return;
        }
        const kpLabel = (entry.kp || []).join(", ");
        document.getElementById("trace-kp").textContent = "Points de connaissance : " + kpLabel;
        const anchor = entry.anchor || (entry.anchors && entry.anchors[0]);
        document.getElementById("trace-quote").textContent = anchor
            ? anchor.quote
            : "Citation non disponible.";
        document.getElementById("trace-meta").textContent = anchor
            ? anchor.edition + " — " + anchor.section_path
            : "";
        this.tracePanelEl.classList.remove("hidden");
    },

    escapeHtml(text) {
        return text
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;");
    },

    isCompositionContext(context) {
        return !!(context && context.view);
    },

    resolveProjectionId(context, elementId, sourceProjectionId) {
        if (this.isCompositionContext(context)) {
            if (typeof context.projectionIdForElement === "function") {
                const id = context.projectionIdForElement(
                    elementId,
                    sourceProjectionId
                );
                if (id) {
                    return id;
                }
            }
            console.warn(
                "[LouRenderer] Composition resolveProjectionId failed: elementId=" +
                    elementId +
                    (sourceProjectionId
                        ? " sourceProjectionId=" + sourceProjectionId
                        : " (sourceProjectionId required)")
            );
            return null;
        }
        if (context && typeof context.projectionForElement === "function") {
            const projection = context.projectionForElement(elementId);
            if (projection && projection.id) {
                return projection.id;
            }
        }
        if (context && typeof context.projectionIdForElement === "function") {
            const id = context.projectionIdForElement(elementId);
            if (id) {
                return id;
            }
        }
        return context && context.projection && context.projection.id;
    },

    viewAvailabilityMessage(availability, config) {
        if (availability === "planned") {
            return config.ERROR_MESSAGES.viewPlanned;
        }
        return this.projectionAvailabilityMessage(availability, config);
    },

    createViewRenderContext(view, manifest, chapter, config) {
        const projectionIdsToRestore = [];
        const seen = new Set();
        (view.blocks || []).forEach(function (block) {
            if (block.sourceProjectionId && !seen.has(block.sourceProjectionId)) {
                seen.add(block.sourceProjectionId);
                projectionIdsToRestore.push(block.sourceProjectionId);
            }
        });
        const primaryProjection = projectionIdsToRestore.length
            ? (manifest.projections || []).find(function (p) {
                  return p.id === projectionIdsToRestore[0];
              })
            : null;

        return {
            view: view,
            manifest: manifest,
            chapter: chapter,
            config: config,
            renderer: this,
            store: window.LouLearnerStore,
            projection: primaryProjection || null,
            projectionIdsToRestore: projectionIdsToRestore,
            projectionIdForElement: function (elementId, sourceProjectionId) {
                const blocks = view.blocks || [];
                if (sourceProjectionId) {
                    const exact = blocks.find(function (b) {
                        return (
                            b.elementId === elementId &&
                            b.sourceProjectionId === sourceProjectionId
                        );
                    });
                    if (!exact) {
                        console.warn(
                            "[LouRenderer] Composition lookup failed: elementId=" +
                                elementId +
                                " sourceProjectionId=" +
                                sourceProjectionId
                        );
                    }
                    return exact ? exact.sourceProjectionId : null;
                }
                const matches = blocks.filter(function (b) {
                    return b.elementId === elementId;
                });
                if (matches.length === 1) {
                    return matches[0].sourceProjectionId;
                }
                if (matches.length > 1) {
                    console.warn(
                        "[LouRenderer] Composition lookup ambiguous: elementId=" +
                            elementId +
                            " matches " +
                            matches.length +
                            " projections; sourceProjectionId required"
                    );
                    return null;
                }
                console.warn(
                    "[LouRenderer] Composition lookup failed: elementId=" +
                        elementId +
                        " not in view"
                );
                return null;
            },
            projectionForElement: function (elementId, sourceProjectionId) {
                const id = this.projectionIdForElement(
                    elementId,
                    sourceProjectionId
                );
                return id
                    ? (manifest.projections || []).find(function (p) {
                          return p.id === id;
                      })
                    : null;
            },
        };
    },

    async mountLearnerLayers(host, context) {
        const ids =
            context.projectionIdsToRestore && context.projectionIdsToRestore.length
                ? context.projectionIdsToRestore
                : context.projection && context.projection.id
                  ? [context.projection.id]
                  : [];

        for (let i = 0; i < ids.length; i += 1) {
            const subContext = Object.assign({}, context, {
                projection: { id: ids[i] },
            });
            if (window.LouTextHighlights) {
                await window.LouTextHighlights.restore(host, subContext);
            }
            if (window.LouInlineNotes) {
                await window.LouInlineNotes.restore(host, subContext);
            }
        }

        if (window.LouTextHighlights) {
            await window.LouTextHighlights.mount(host, context);
        }
        if (window.LouInlineNotes) {
            await window.LouInlineNotes.mount(host, context);
        }
        if (window.LouInlineFormatting) {
            await window.LouInlineFormatting.mount(host, context);
        }
    },

    deferLearnerLayers(host, context) {
        this._pendingLearnerLayers = { host: host, context: context };
    },

    async flushPendingLearnerLayers() {
        if (!this._pendingLearnerLayers) {
            return;
        }
        const pending = this._pendingLearnerLayers;
        this._pendingLearnerLayers = null;
        await this.mountLearnerLayers(pending.host, pending.context);
    },

    clearPendingLearnerLayers() {
        this._pendingLearnerLayers = null;
    },

    async renderComposedBlocks(view, manifest, chapter, config, renderOptions) {
        renderOptions = renderOptions || {};
        const host = this.contentEl;
        const pathCache = new Map();
        const combined = document.createDocumentFragment();

        this.replayAnimation(host);
        window.LouBlocks.releaseObjectUrls();

        for (let i = 0; i < (view.blocks || []).length; i += 1) {
            const block = view.blocks[i];
            const projection = (manifest.projections || []).find(function (p) {
                return p.id === block.sourceProjectionId;
            });
            if (!projection) {
                continue;
            }

            let html = pathCache.get(block.artifactRef);
            if (!html) {
                const url = config.resolveAssetPath(chapter, block.artifactRef);
                const text = await this.fetchText(url);
                const learnerMd = this.prepareLearnerMarkdown(text);
                html = window.LouMarkdown.parse(learnerMd);
                pathCache.set(block.artifactRef, html);
            }

            const blockContext = this.createViewRenderContext(view, manifest, chapter, config);
            blockContext.projection = Object.assign({}, projection, {
                elements: [block.elementId],
            });
            blockContext.sourceProjectionId = block.sourceProjectionId;

            combined.appendChild(window.LouBlocks.assemble(html, blockContext));
        }

        host.innerHTML = "";
        host.appendChild(combined);

        const context = this.createViewRenderContext(view, manifest, chapter, config);
        try {
            await window.LouBlocks.hydrate(host, context);
        } catch (err) {
            console.warn(
                "[LouRenderer] Learner artifact hydration failed; official content remains.",
                err
            );
        }
        try {
            if (window.LouSvgLoader) {
                await window.LouSvgLoader.loadAllFigures(host, context);
            }
            if (window.LouFigureZoom) {
                window.LouFigureZoom.bind(host);
            }
        } catch (err) {
            console.warn(
                "[LouRenderer] Official SVG loading failed; learner layers continue.",
                err
            );
        }

        if (renderOptions.deferLearnerLayers) {
            this.deferLearnerLayers(host, context);
        } else {
            await this.mountLearnerLayers(host, context);
        }
        if (view.scenarios && view.scenarios.length) {
            host.appendChild(this.createScenariosSection(view));
        }
    },

    showViewNotesShell(config) {
        this.replayAnimation(this.contentEl);
        this.contentEl.innerHTML =
            '<section class="view-notes-shell" role="status"><p>' +
            this.escapeHtml(config.ERROR_MESSAGES.notesShell) +
            "</p></section>";
    },

    showViewQcmList(view, config) {
        const items = (view.questions || [])
            .map(function (q) {
                return (
                    '<li class="view-qcm-item" data-question-id="' +
                    LouRenderer.escapeHtml(String(q.questionId)) +
                    '">' +
                    LouRenderer.escapeHtml(String(q.questionId)) +
                    "</li>"
                );
            })
            .join("");
        this.replayAnimation(this.contentEl);
        this.contentEl.innerHTML =
            '<section class="view-qcm-shell">' +
            "<p>" +
            this.escapeHtml(
                view.questions.length + " question(s) d'évaluation disponibles."
            ) +
            "</p>" +
            '<ul class="view-qcm-list">' +
            items +
            "</ul></section>";
    },

    async renderCognitivePrimingView(view, manifest, chapter, config, renderOptions) {
        renderOptions = renderOptions || {};
        const cp = window.LouCognitivePrimingRender;
        const primingRef = view.primingRef;

        if (!primingRef || !primingRef.path) {
            this.showMessage(config.ERROR_MESSAGES.cognitivePrimingArtifactMissing, {
                state: "cp_artifact_missing",
            });
            return;
        }

        let text;
        try {
            text = await this.fetchText(
                config.resolveAssetPath(chapter, primingRef.path)
            );
        } catch (err) {
            if (err && (err.code === "not_found" || err.status === 404)) {
                this.showMessage(config.ERROR_MESSAGES.cognitivePrimingArtifactMissing, {
                    state: "cp_artifact_missing",
                });
            } else {
                this.showMessage(config.ERROR_MESSAGES.cognitivePrimingLoadFailed, {
                    state: "cp_load_failed",
                });
            }
            return;
        }

        const parsed = cp.parseCognitivePrimingArtifact(text);
        if (!parsed.ok) {
            const messageKey =
                parsed.code === "schema"
                    ? "cognitivePrimingSchema"
                    : parsed.code === "badge"
                      ? "cognitivePrimingBadge"
                      : "cognitivePrimingParse";
            this.showMessage(config.ERROR_MESSAGES[messageKey], {
                state: "cp_" + parsed.code,
            });
            return;
        }

        if (
            parsed.record.chapter_id &&
            manifest.chapter &&
            parsed.record.chapter_id !== manifest.chapter
        ) {
            console.warn(
                "[LouRenderer] CP-RENDER-CHAPTER-MISMATCH: artefact chapter_id=" +
                    parsed.record.chapter_id +
                    " manifest.chapter=" +
                    manifest.chapter
            );
        }

        this.replayAnimation(this.contentEl);
        this.contentEl.innerHTML =
            '<section class="cognitive-priming-view lou-official-content">' +
            '<div class="cognitive-priming-body"></div></section>';

        const host = this.contentEl.querySelector(".cognitive-priming-body");
        if (!host) {
            return;
        }

        await cp.renderCognitivePriming(host, parsed.record, {
            chapterTitle: manifest.title || manifest.chapter,
            manifestChapter: manifest.chapter,
            packageAccess:
                config.isProductMode() && config._packageAccess
                    ? config._packageAccess
                    : null,
            onEdnNavigate:
                window.LouApp && typeof window.LouApp.navigateToChapterById === "function"
                    ? function (targetChapterId) {
                          window.LouApp.navigateToChapterById(targetChapterId, {
                              targetViewId: "cognitive-priming",
                          });
                      }
                    : null,
            document: this.contentEl.ownerDocument,
        });
    },

    async renderCollegeOfficial(view, manifest, chapter, config, renderOptions) {
        renderOptions = renderOptions || {};
        const collegePath = view.collegeRef && view.collegeRef.path;
        if (!collegePath) {
            this.showMessage(config.ERROR_MESSAGES.projectionMissing);
            return;
        }

        let text;
        try {
            text = await this.fetchText(config.resolveAssetPath(chapter, collegePath));
        } catch (err) {
            this.showMessage(config.ERROR_MESSAGES.loadFailed);
            return;
        }

        if (!text.trim()) {
            this.showMessage(config.ERROR_MESSAGES.emptyContent);
            return;
        }

        const edition =
            view.collegeRef && view.collegeRef.value !== undefined
                ? String(view.collegeRef.value)
                : null;
        const header =
            '<header class="college-official-header">' +
            "<p class=\"college-official-badge\">Texte officiel Collège" +
            (edition ? " — édition " + this.escapeHtml(edition) : "") +
            "</p></header>";
        const body = window.LouMarkdown.parse(text);

        this.replayAnimation(this.contentEl);
        this.contentEl.innerHTML =
            '<section class="college-official-view lou-official-content">' +
            header +
            '<article class="college-official-body">' +
            body +
            "</article></section>";

        const host = this.contentEl.querySelector(".college-official-body");
        if (host) {
            if (window.LouSearchNavigation && typeof window.LouSearchNavigation.decorateCollegeSectionPaths === "function") {
                window.LouSearchNavigation.decorateCollegeSectionPaths(host);
            }
            const context = this.createViewRenderContext(view, manifest, chapter, config);
            if (renderOptions.deferLearnerLayers) {
                this.deferLearnerLayers(host, context);
            } else {
                await this.mountLearnerLayers(host, context);
            }
        }
    },

    createScenariosSection(view) {
        const list = document.createElement("ul");
        list.className = "view-scenarios-list";
        (view.scenarios || []).forEach(function (scenario) {
            const item = document.createElement("li");
            item.textContent = scenario.scenarioId + " (" + scenario.kind + ")";
            if (scenario.scenarioId) {
                item.setAttribute("data-scenario-id", scenario.scenarioId);
            }
            list.appendChild(item);
        });
        const wrapper = document.createElement("section");
        wrapper.className = "view-scenarios-shell";
        const title = document.createElement("p");
        title.textContent = "Scénarios cliniques";
        wrapper.appendChild(title);
        wrapper.appendChild(list);
        return wrapper;
    },

    appendScenariosList(view) {
        const existing = this.contentEl.querySelector(".view-scenarios-list");
        if (existing) {
            existing.remove();
        }
        this.contentEl.appendChild(this.createScenariosSection(view));
    },

    async renderComposedView(view, manifest, chapter, config, renderOptions) {
        renderOptions = renderOptions || {};
        if (view.availability === "planned") {
            this.showMessage(this.viewAvailabilityMessage("planned", config), {
                state: "planned",
            });
            return;
        }

        if (view.viewId === "notes") {
            this.showViewNotesShell(config);
            return;
        }

        if (view.questions && view.questions.length) {
            this.showViewQcmList(view, config);
            return;
        }

        if (view.primingRef && view.primingRef.resolved === true) {
            await this.renderCognitivePrimingView(
                view,
                manifest,
                chapter,
                config,
                renderOptions
            );
            return;
        }

        if (view.blocks && view.blocks.length) {
            await this.renderComposedBlocks(
                view,
                manifest,
                chapter,
                config,
                renderOptions
            );
            return;
        }

        if (view.scenarios && view.scenarios.length) {
            this.replayAnimation(this.contentEl);
            this.contentEl.innerHTML = "";
            this.appendScenariosList(view);
            return;
        }

        if (view.collegeRef && view.collegeRef.path) {
            await this.renderCollegeOfficial(
                view,
                manifest,
                chapter,
                config,
                renderOptions
            );
            return;
        }

        this.showMessage(config.PLACEHOLDER_MESSAGE);
    },
};
