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

    // Probe the canonical build output first. Only if no manifest exists there does the renderer
    // fall back to the superseded prototype folder — and it says so, rather than quietly serving
    // stale content that looks like pipeline output.
    async function loadChapterMetadata(chapterId) {
        if (!chapterId) {
            return null;
        }

        try {
            return await renderer.fetchJson(config.resolveManifestPath(chapterId));
        } catch (err) {
            config.useLegacyContentRoot();
            return null;
        }
    }

    function buildTabsFromManifest(data) {
        return (data.projections || [])
            .slice()
            .sort(function (a, b) {
                return (a.order || 0) - (b.order || 0);
            })
            .map(function (p) {
                return {
                    id: p.id,
                    label: config.projectionTabLabel(p),
                    path: p.path,
                    implemented: p.status === "published",
                    projection: p,
                };
            });
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

        if (!tab.implemented) {
            renderer.showMessage(config.PLACEHOLDER_MESSAGE);
            return;
        }

        const file = tab.path || tab.file;
        if (!file) {
            renderer.showMessage(config.PLACEHOLDER_MESSAGE);
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
            if (err.status === 404) {
                renderer.showMessage(
                    config.ERROR_MESSAGES.chapterNotFound + " (" + chapter + ")"
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

        manifest = await loadChapterMetadata(chapter);
        if (manifest) {
            tabs = buildTabsFromManifest(manifest);
            traceIndexUrl = manifest.trace_index
                ? config.resolveAssetPath(chapter, manifest.trace_index)
                : null;
            renderer.applyHeaderMetadata({
                specialty: manifest.specialty || "Cardiologie",
                chapterLine: manifest.chapterLine || manifest.chapter,
                chapterTitle: manifest.title || manifest.chapter,
            });
        } else {
            tabs = config.TABS.slice();
            announceLegacyContent();
        }

        buildTabs();
        showTab(0);
    }

    boot();
})();
