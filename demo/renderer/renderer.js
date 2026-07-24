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
            return "";
        });
        return text.trim();
    },

    injectVisuals(html, projection, chapter, config) {
        if (!projection || !projection.visuals) {
            return html;
        }
        let out = html;
        Object.keys(projection.visuals).forEach(function (elementId) {
            const rel = projection.visuals[elementId];
            const url = config.resolveAssetPath(chapter, rel);
            const block =
                '<figure class="injected-figure" data-element="' +
                elementId +
                '">' +
                '<img src="' +
                url +
                '" alt="' +
                elementId +
                ' diagram">' +
                "</figure>";
            const anchor = 'id="' + elementId + '"';
            if (out.indexOf(anchor) !== -1) {
                const headingClose = out.indexOf("</h2>", out.indexOf(anchor));
                if (headingClose !== -1) {
                    out =
                        out.slice(0, headingClose + 5) +
                        block +
                        out.slice(headingClose + 5);
                } else {
                    out = block + out;
                }
            } else {
                const firstH2 = out.indexOf("</h2>");
                if (firstH2 !== -1) {
                    out =
                        out.slice(0, firstH2 + 5) +
                        block +
                        out.slice(firstH2 + 5);
                } else {
                    out = block + out;
                }
            }
        });
        return out;
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
