(function () {
    const config = window.LouConfig;
    const renderer = window.LouRenderer;
    const markdown = window.LouMarkdown;

    const tabsEl = document.getElementById("tabs");
    const contentEl = document.getElementById("content");

    const headerEls = {
        specialty: document.getElementById("specialty"),
        chapterLine: document.getElementById("chapter-line"),
        chapterTitle: document.getElementById("chapter-title"),
        objectivesList: document.getElementById("objectives-list"),
        readTime: document.getElementById("read-time"),
    };

    let currentTab = 0;
    let chapter = null;
    let manifest = null;
    let tabs = config.TABS.slice();
    let traceIndexUrl = null;

    function getChapterFromUrl() {
        return config.sanitizeChapter(
            new URLSearchParams(window.location.search).get("chapter")
        );
    }

    // Probe the canonical build output first. Legacy activates only on true manifest absence
    // (404). Invalid JSON, network and server errors stay explicit (RCC §6.7).
    async function loadChapterMetadata(chapterId) {
        return renderer.loadPublishedManifest(chapterId, config);
    }

    function announceLegacyContent() {
        if (!chapter || !config.isLegacyContentRoot()) {
            return;
        }
        const notice = document.createElement("p");
        notice.className = "legacy-notice";
        notice.setAttribute("role", "status");
        notice.textContent = config.ERROR_MESSAGES.legacyContent;
        tabsEl.insertAdjacentElement("beforebegin", notice);
    }

    function buildTabs() {
        tabsEl.innerHTML = "";
        tabs.forEach(function (tab, index) {
            const el = document.createElement("div");
            el.className = "tab" + (index === 0 ? " active" : "");
            el.textContent = tab.label;
            el.dataset.index = String(index);
            if (tab.availability) {
                el.dataset.availability = tab.availability;
            }
            el.addEventListener("click", function () {
                showTab(index);
            });
            tabsEl.appendChild(el);
        });
    }

    function setActiveTab(index) {
        tabsEl.querySelectorAll(".tab").forEach(function (el, i) {
            el.classList.toggle("active", i === index);
        });
    }

    async function loadTabContent(index) {
        const tab = tabs[index];

        if (!chapter) {
            renderer.showMessage(config.ERROR_MESSAGES.noChapter);
            return;
        }

        if (tab.availability === "known_absent") {
            renderer.showMessage(
                renderer.projectionAvailabilityMessage("known_absent", config),
                { state: "known_absent" }
            );
            return;
        }

        if (tab.availability === "invalid") {
            renderer.showMessage(
                renderer.projectionAvailabilityMessage("invalid", config),
                { state: "invalid" }
            );
            return;
        }

        if (!tab.implemented) {
            renderer.showMessage(config.PLACEHOLDER_MESSAGE);
            return;
        }

        const file = tab.path || tab.file;
        if (!file) {
            renderer.showMessage(
                renderer.projectionAvailabilityMessage("invalid", config),
                { state: "invalid" }
            );
            return;
        }

        const url = config.resolveAssetPath(chapter, file);

        try {
            const text = await renderer.fetchText(url);
            if (!text.trim()) {
                renderer.showMessage(config.ERROR_MESSAGES.emptyContent);
                return;
            }
            const learnerMd = renderer.prepareLearnerMarkdown(text);
            const html = markdown.parse(learnerMd);
            if (tab.projection && manifest) {
                await renderer.renderProjection(html, {
                    projection: tab.projection,
                    manifest: manifest,
                    chapter: chapter,
                    config: config,
                    renderer: renderer,
                    store: window.LouLearnerStore,
                });
            } else {
                renderer.injectHtml(renderer.wrapWithFooterNav(html));
            }
        } catch (err) {
            if (err.status === 404 || err.code === "not_found") {
                renderer.showMessage(
                    renderer.projectionAvailabilityMessage("missing", config),
                    { state: "missing" }
                );
            } else if (err.code === "invalid") {
                renderer.showMessage(
                    renderer.projectionAvailabilityMessage("invalid", config),
                    { state: "invalid" }
                );
            } else {
                renderer.showMessage(config.ERROR_MESSAGES.loadFailed);
            }
        }
    }

    function showTab(index) {
        if (index < 0 || index >= tabs.length) {
            return;
        }
        currentTab = index;
        setActiveTab(index);
        loadTabContent(index);
    }

    contentEl.addEventListener("click", function (e) {
        const traceBtn = e.target.closest(".claim-trace-link");
        if (traceBtn && traceIndexUrl) {
            renderer.showTraceability(traceBtn.dataset.claim, traceIndexUrl);
            return;
        }
        const btn = e.target.closest("[data-nav]");
        if (!btn) {
            return;
        }
        showTab(btn.dataset.nav === "next" ? currentTab + 1 : currentTab - 1);
    });

    async function boot() {
        renderer.init(contentEl, headerEls);
        chapter = getChapterFromUrl();

        if (!chapter) {
            renderer.showMessage(config.ERROR_MESSAGES.noChapter);
            return;
        }

        const loaded = await loadChapterMetadata(chapter);
        if (loaded.ok) {
            manifest = loaded.manifest;
            tabs = renderer.buildProjectionTabs(manifest, config);
            traceIndexUrl = manifest.trace_index
                ? config.resolveAssetPath(chapter, manifest.trace_index)
                : null;
            renderer.applyHeaderMetadata({
                specialty: manifest.specialty || "Cardiologie",
                chapterLine: manifest.chapterLine || manifest.chapter,
                chapterTitle: manifest.title || manifest.chapter,
            });
        } else if (loaded.useLegacy) {
            config.useLegacyContentRoot();
            tabs = config.TABS.slice();
            announceLegacyContent();
        } else {
            tabs = [];
            buildTabs();
            renderer.showMessage(
                renderer.manifestErrorMessage(loaded.reason, config),
                { state: "manifest_" + loaded.reason }
            );
            return;
        }

        buildTabs();
        showTab(0);
    }

    boot();
})();
