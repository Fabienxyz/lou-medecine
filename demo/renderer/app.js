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

    function getChapterFromUrl() {
        return config.sanitizeChapter(
            new URLSearchParams(window.location.search).get("chapter")
        );
    }

    async function loadChapterMetadata(chapterId) {
        if (!chapterId) {
            return null;
        }

        // Future milestone: fetch config.resolveManifestPath(chapterId),
        // return parsed JSON, and fall back gracefully on 404.
        return null;
    }

    function buildTabs() {
        tabsEl.innerHTML = "";
        config.TABS.forEach(function (tab, index) {
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
        const tab = config.TABS[index];

        if (!chapter) {
            renderer.showMessage(config.ERROR_MESSAGES.noChapter);
            return;
        }

        if (!tab.implemented || !tab.file) {
            renderer.showMessage(config.PLACEHOLDER_MESSAGE);
            return;
        }

        const url = config.resolveAssetPath(chapter, tab.file);

        try {
            const text = await renderer.fetchText(url);
            if (!text.trim()) {
                renderer.showMessage(config.ERROR_MESSAGES.emptyContent);
                return;
            }
            const html = markdown.parse(text);
            renderer.injectHtml(renderer.wrapWithFooterNav(html));
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
        if (index < 0 || index >= config.TABS.length) {
            return;
        }
        currentTab = index;
        setActiveTab(index);
        loadTabContent(index);
    }

    contentEl.addEventListener("click", function (e) {
        const btn = e.target.closest("[data-nav]");
        if (!btn) {
            return;
        }
        showTab(btn.dataset.nav === "next" ? currentTab + 1 : currentTab - 1);
    });

    async function boot() {
        renderer.init(contentEl, headerEls);
        buildTabs();

        chapter = getChapterFromUrl();
        const metadata = await loadChapterMetadata(chapter);
        if (metadata) {
            renderer.applyHeaderMetadata(metadata);
        }

        showTab(0);
    }

    boot();
})();
