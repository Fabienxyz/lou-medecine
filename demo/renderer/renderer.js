window.LouRenderer = {
    contentEl: null,
    headerEls: null,

    init(contentEl, headerEls) {
        this.contentEl = contentEl;
        this.headerEls = headerEls || null;
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

    /**
     * Expected manifest shape (future):
     * { specialty, chapterLine, chapterTitle, readTime, objectives: string[] }
     */
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

    escapeHtml(text) {
        return text
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;");
    },
};
