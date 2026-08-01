(function () {
    const config = window.LouConfig;
    const renderer = window.LouRenderer;
    const markdown = window.LouMarkdown;
    const sessionService = window.LouSessionService;
    const sessionResume = window.LouSessionResume;

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
    let readingViewModel = null;
    let tabs = config.TABS.slice();
    let traceIndexUrl = null;
    let releaseId = null;
    let offlineStatus = null;
    let commitController = null;
    let restorePlanBuilt = false;
    let localSearchUI = null;
    let displayPreferencesRuntime = null;
    let displayPreferencesUI = null;
    let displayPreferencesLoaded = false;

    function getChapterFromUrl() {
        return config.sanitizeChapter(
            new URLSearchParams(window.location.search).get("chapter")
        );
    }

    function redirectChapter(targetChapter) {
        const params = new URLSearchParams(window.location.search);
        params.set("chapter", targetChapter);
        window.location.assign(
            window.location.pathname + "?" + params.toString()
        );
    }

    function getCurrentViewState() {
        const tab = tabs[currentTab];
        if (!tab) {
            return null;
        }
        return {
            viewId: tab.viewId,
            index: currentTab,
        };
    }

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
            el.className = "tab" + (index === currentTab ? " active" : "");
            el.textContent = tab.label;
            el.dataset.index = String(index);
            if (tab.viewId) {
                el.dataset.viewId = tab.viewId;
            }
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

    async function loadLegacyPrototypeTabContent(index) {
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
            await renderer.renderProjection(html, {
                projection: tab.projection,
                manifest: manifest,
                chapter: chapter,
                config: config,
                renderer: renderer,
                store: window.LouLearnerStore,
            });
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

    async function loadComposedViewContent(index, options) {
        options = options || {};
        const tab = tabs[index];
        const view = tab.view;

        if (!chapter || !view) {
            renderer.showMessage(config.ERROR_MESSAGES.noChapter);
            return;
        }

        await renderer.renderComposedView(view, manifest, chapter, config, {
            deferLearnerLayers: options.deferLearnerLayers === true,
        });
    }

    async function loadTabContent(index, options) {
        if (readingViewModel) {
            await loadComposedViewContent(index, options);
            return;
        }
        await loadLegacyPrototypeTabContent(index);
    }

    let tabContentReady = Promise.resolve();

    async function showTab(index, options) {
        options = options || {};
        if (index < 0 || index >= tabs.length) {
            return;
        }

        if (
            commitController &&
            !options.fromResumePlan &&
            index !== currentTab
        ) {
            await commitController.flushViewLeave();
        }

        const previousTab = currentTab;
        currentTab = index;
        setActiveTab(index);
        tabContentReady = loadTabContent(index, options);
        await tabContentReady;

        if (
            localSearchUI &&
            !options.fromSearchNavigation
        ) {
            localSearchUI.onContextChange();
        }

        if (
            commitController &&
            !options.fromResumePlan &&
            !options.skipViewCommit &&
            index !== previousTab
        ) {
            const tab = tabs[index];
            commitController.onViewChanged(
                tab.viewId,
                sessionService.defaultResumePointForView(tab.viewId)
            );
            if (tab.viewId === "notes") {
                commitController.onNotesFocusChanged("shell").catch(function (err) {
                    console.warn("[LouApp] CE-05 commit failed", err);
                });
            }
        }
    }

    async function resolveRestoreCatalogFacts() {
        if (config.isProductMode() && config._packageAccess) {
            const bootstrap = await import("./product-bootstrap.mjs");
            return bootstrap.buildRestoreCatalogFacts({
                chapter: chapter,
                packageAccess: config._packageAccess,
                releaseId: releaseId,
                offlineStatus: offlineStatus,
            });
        }
        return {
            activeReleaseId: releaseId,
            installedReleaseIds: releaseId ? [releaseId] : [],
            releaseInstalled: !!releaseId,
            offlineStatus: offlineStatus || null,
        };
    }

    async function runSessionRestore() {
        if (!sessionResume || !sessionService || !releaseId) {
            currentTab = 0;
            await showTab(0, { fromResumePlan: true });
            return;
        }

        if (restorePlanBuilt) {
            throw new Error("[LouApp] Second buildResumePlan forbidden (IA-20)");
        }

        const catalogFacts = await resolveRestoreCatalogFacts();

        const restoreContext = await sessionResume.buildRestoreContext({
            chapter: chapter,
            releaseId: catalogFacts.activeReleaseId,
            tabs: tabs,
            offlineStatus: catalogFacts.offlineStatus,
            releaseInstalled: catalogFacts.releaseInstalled,
            installedReleaseIds: catalogFacts.installedReleaseIds,
            productMode: config.isProductMode(),
            isOfflineRequired:
                config.isProductMode() &&
                typeof navigator !== "undefined" &&
                !navigator.onLine,
            observedAt: new Date().toISOString(),
        });

        const plan = sessionService.buildResumePlan(restoreContext);
        restorePlanBuilt = true;

        await sessionResume.applyResumePlan(plan, {
            tabs: tabs,
            chapter: chapter,
            showTab: showTab,
            redirectChapter: redirectChapter,
            showBlocked: function (reason) {
                renderer.showMessage(
                    "Contenu hors ligne indisponible (" + reason + ").",
                    { state: "blocked_offline" }
                );
            },
        });
    }

    async function initDisplayPreferences() {
        if (
            !window.LouDisplayPreferencesApply ||
            !window.LouDisplayPreferencesUI ||
            !window.LouLearnerStore
        ) {
            return;
        }

        try {
            await window.LouLearnerStore.open();
            const dpModule = await import("./library/browser-display-preferences-runtime.js");
            displayPreferencesRuntime = dpModule.createBrowserDisplayPreferencesRuntime({
                store: window.LouLearnerStore,
                applyDisplayPreferences:
                    window.LouDisplayPreferencesApply.applyDisplayPreferences,
            });
            await displayPreferencesRuntime.loadAndApply();
            displayPreferencesLoaded = true;

            displayPreferencesUI = window.LouDisplayPreferencesUI.create({
                runtime: displayPreferencesRuntime,
            });
            displayPreferencesUI.mount();

            window.LouDisplayPreferences = {
                runtime: displayPreferencesRuntime,
                ui: displayPreferencesUI,
            };
        } catch (err) {
            console.warn("[LouApp] display preferences init failed", err);
        }
    }

    async function initLocalSearch() {
        if (
            !window.LouLocalSearchUI ||
            !window.LouSearchNavigation ||
            !releaseId ||
            !manifest ||
            !config.isProductMode() ||
            !config.libraryBaseUrl
        ) {
            return;
        }

        const contentDigest = manifest.content_digest;
        if (!contentDigest) {
            return;
        }

        try {
            const searchModule = await import("./library/browser-local-search-runtime.js");
            const runtime = searchModule.createBrowserLocalSearchRuntime({
                libraryBaseUrl: config.libraryBaseUrl,
            });
            runtime.setOpenRelease({
                releaseId: releaseId,
                contentDigest: contentDigest,
                chapter: chapter,
            });

            localSearchUI = window.LouLocalSearchUI.create({
                runtime: runtime,
                releaseId: releaseId,
                tabs: tabs,
                showTab: showTab,
                whenTabReady: function () {
                    return tabContentReady;
                },
            });
            localSearchUI.mount();
            window.LouLocalSearch = {
                runtime: runtime,
                ui: localSearchUI,
            };
        } catch (err) {
            console.warn("[LouApp] local search init failed", err);
        }
    }

    window.LouApp = {
        whenTabReady: function () {
            return tabContentReady;
        },
        getCurrentViewId: function () {
            const tab = tabs[currentTab];
            return tab ? tab.viewId : null;
        },
        wasRestorePlanBuilt: function () {
            return restorePlanBuilt;
        },
        wasDisplayPreferencesLoaded: function () {
            return displayPreferencesLoaded;
        },
        getDisplayPreferencesRuntime: function () {
            return displayPreferencesRuntime;
        },
    };

    function bindBreadcrumbAmorçage() {
        const chapterLine = headerEls.chapterLine;
        if (!chapterLine) {
            return;
        }
        chapterLine.classList.add("chapter-line-nav");
        chapterLine.setAttribute("role", "button");
        chapterLine.tabIndex = 0;
        chapterLine.addEventListener("click", async function () {
            const amorIndex = tabs.findIndex(function (tab) {
                return tab.viewId === sessionService.AMORCAGE_VIEW_ID;
            });
            if (amorIndex < 0) {
                return;
            }
            await showTab(amorIndex, { skipViewCommit: true });
            if (commitController) {
                commitController.onInternalNavValidated().catch(function (err) {
                    console.warn("[LouApp] CE-04 commit failed", err);
                });
            }
        });
    }

    contentEl.addEventListener("click", function (e) {
        const traceBtn = e.target.closest(".claim-trace-link");
        if (traceBtn && traceIndexUrl) {
            renderer.showTraceability(traceBtn.dataset.claim, traceIndexUrl);
            return;
        }

        const qcmItem = e.target.closest(".view-qcm-item[data-question-id]");
        if (qcmItem && commitController) {
            const questionId = qcmItem.getAttribute("data-question-id");
            if (questionId) {
                commitController.onQcmQuestionChanged(questionId).catch(function (err) {
                    console.warn("[LouApp] CE-03 commit failed", err);
                });
            }
            return;
        }

        const notionBlock = e.target.closest(".pedagogical-block[data-element]");
        if (notionBlock && commitController) {
            const viewState = getCurrentViewState();
            if (viewState && viewState.viewId === "notions") {
                const elementId = notionBlock.getAttribute("data-element");
                if (elementId) {
                    commitController.onNotionChanged(elementId).catch(function (err) {
                        console.warn("[LouApp] CE-02 commit failed", err);
                    });
                }
            }
        }

        const btn = e.target.closest("[data-nav]");
        if (!btn) {
            return;
        }
        showTab(btn.dataset.nav === "next" ? currentTab + 1 : currentTab - 1);
    });

    function registerServiceWorker() {
        if (!("serviceWorker" in navigator)) {
            return;
        }
        if (navigator.webdriver) {
            return;
        }
        navigator.serviceWorker.register("/sw.js", { type: "module" }).catch(function (err) {
            console.warn("[LouApp] Service worker registration failed", err);
        });
    }

    async function boot() {
        renderer.init(contentEl, headerEls);
        chapter = getChapterFromUrl();

        if (!chapter) {
            renderer.showMessage(config.ERROR_MESSAGES.noChapter);
            return;
        }

        let loaded;
        const productRequested =
            new URLSearchParams(window.location.search).get("product") === "1" ||
            new URLSearchParams(window.location.search).get("library") === "1";

        if (productRequested) {
            registerServiceWorker();
            try {
                const bootstrap = await import("./product-bootstrap.mjs");
                window.LouProductBootstrap = {
                    isProductMode: bootstrap.isProductMode,
                    init: bootstrap.initProductMode,
                    readOfflineStatus: bootstrap.readOfflineStatus,
                    OFFLINE_STATUS: bootstrap.OFFLINE_STATUS,
                };
                const product = await bootstrap.initProductMode(chapter);
                loaded = { ok: true, manifest: product.manifest };
                releaseId = product.releaseId;
                offlineStatus = product.offlineStatus;
            } catch (err) {
                console.error("[LouApp] product bootstrap failed", err);
                loaded = { ok: false, reason: "network", useLegacy: false };
            }
        } else {
            loaded = await loadChapterMetadata(chapter);
        }
        if (loaded.ok) {
            manifest = loaded.manifest;
            releaseId =
                releaseId ||
                (config.isProductMode()
                    ? config._releaseId
                    : manifest.release_id || null);
            offlineStatus = offlineStatus || null;
            if (window.LouLearnerStore && releaseId) {
                window.LouLearnerStore.setReleaseContext({
                    releaseId: releaseId,
                    chapter: chapter,
                });
            }
            traceIndexUrl = manifest.trace_index
                ? config.resolveAssetPath(chapter, manifest.trace_index)
                : null;
            renderer.applyHeaderMetadata({
                specialty: manifest.specialty || "Cardiologie",
                chapterLine: manifest.chapterLine || manifest.chapter,
                chapterTitle: manifest.title || manifest.chapter,
            });

            if (!window.LouComposition) {
                renderer.showMessage(config.ERROR_MESSAGES.loadFailed);
                return;
            }
            const composed = await window.LouComposition.buildReadingViewModel(
                manifest
            );
            readingViewModel = composed.readingViewModel;
            tabs = window.LouComposition.buildNavigationFromViewModel(
                readingViewModel
            );
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
        bindBreadcrumbAmorçage();

        await initDisplayPreferences();

        commitController = sessionResume.createCommitController(getCurrentViewState);
        commitController.bindLifecycleEvents();

        await runSessionRestore();

        await initLocalSearch();
        if (localSearchUI) {
            localSearchUI.updateTabs(tabs);
        }

        if (!config.productMode) {
            registerServiceWorker();
        }
    }

    boot();
})();
