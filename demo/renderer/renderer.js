window.LouRenderer = {
    contentEl: null,
    headerEls: null,
    tracePanelEl: null,

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
        const response = await fetch(url);
        if (!response.ok) {
            const error = new Error("HTTP " + response.status);
            error.status = response.status;
            throw error;
        }
        return asJson ? response.json() : response.text();
    },

    async fetchText(url) {
        return this.fetchResource(url, false);
    },

    async fetchJson(url) {
        return this.fetchResource(url, true);
    },

    applyHeaderMetadata(data) {
        if (!data || !this.headerEls) {
            return;
        }

        const els = this.headerEls;

        if (data.specialty && els.specialty) {
            els.specialty.textContent = data.specialty;
        }
        if (data.chapterLine && els.chapterLine) {
            els.chapterLine.textContent = data.chapterLine;
        }
        if (data.chapterTitle && els.chapterTitle) {
            els.chapterTitle.textContent = data.chapterTitle;
        }
        if (data.readTime && els.readTime) {
            els.readTime.textContent = data.readTime;
        }
        if (Array.isArray(data.objectives) && els.objectivesList) {
            els.objectivesList.innerHTML = data.objectives
                .map(function (item) {
                    return "<li>" + LouRenderer.escapeHtml(String(item)) + "</li>";
                })
                .join("");
        }
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
    async renderProjection(html, context) {
        this.replayAnimation(this.contentEl);
        await LouBlocks.render(this.contentEl, html, context);
        this.contentEl.appendChild(this.footerNavNode());
    },

    footerNavNode() {
        const nav = document.createElement("div");
        nav.className = "footer-nav";
        nav.innerHTML =
            '<button type="button" class="nav-btn" data-nav="prev">← Concept précédent</button>' +
            '<button type="button" class="nav-btn primary" data-nav="next">Concept suivant →</button>';
        return nav;
    },

    wrapWithFooterNav(bodyHtml) {
        return (
            bodyHtml +
            '<div class="footer-nav">' +
            '<button type="button" class="nav-btn" data-nav="prev">← Concept précédent</button>' +
            '<button type="button" class="nav-btn primary" data-nav="next">Concept suivant →</button>' +
            "</div>"
        );
    },

    replayAnimation(el) {
        el.style.animation = "none";
        el.offsetHeight;
        el.style.animation = "";
    },

    showMessage(message) {
        this.replayAnimation(this.contentEl);
        this.contentEl.innerHTML =
            '<p class="content-status">' + this.escapeHtml(message) + "</p>" +
            this.wrapWithFooterNav("");
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
};
