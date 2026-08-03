/**
 * Lot D4 — Reader session resume orchestration.
 * RestoreContext assembly, applyResumePlan, Commit Events (IA-25).
 */
(function (global) {
    const service = global.LouSessionService;
    if (!service) {
        throw new Error(
            "[LouSessionResume] session-service.js must load before session-resume.js"
        );
    }

    let resumePlanApplied = false;
    let activeWarnings = [];
    let pendingResumePoint = null;
    let restoreCycleComplete = false;

    function readEntryModeFromUrl() {
        const params = new URLSearchParams(global.location.search);
        const entry = params.get("entry");
        if (entry === "continue_global") {
            return "continue_global";
        }
        if (entry === "chapter_direct") {
            return "chapter_direct";
        }
        if (entry === "post_import") {
            return "post_import";
        }
        if (entry === "breadcrumb_amorçage") {
            return "breadcrumb_amorçage";
        }
        if (params.get("continue") === "1") {
            return "continue_global";
        }
        return "cold_boot";
    }

    function deepFreeze(value) {
        if (value === null || typeof value !== "object") {
            return value;
        }
        Object.freeze(value);
        Object.getOwnPropertyNames(value).forEach(function (key) {
            const nested = value[key];
            if (
                nested &&
                typeof nested === "object" &&
                !Object.isFrozen(nested)
            ) {
                deepFreeze(nested);
            }
        });
        return value;
    }

    function cloneResumePoint(resumePoint) {
        if (!resumePoint || typeof resumePoint !== "object") {
            return resumePoint;
        }
        return deepFreeze(Object.assign({}, resumePoint));
    }

    function normalizeSessionRecord(record) {
        if (!record || typeof record !== "object") {
            return record;
        }
        return deepFreeze(
            Object.assign({}, record, {
                resumePoint: record.resumePoint
                    ? cloneResumePoint(record.resumePoint)
                    : record.resumePoint,
            })
        );
    }

    function buildViewAvailabilityMap(tabs) {
        const map = {};
        const order = [];
        for (let i = 0; i < tabs.length; i++) {
            const tab = tabs[i];
            map[tab.viewId] = tab.availability || "unknown";
            order.push(tab.viewId);
        }
        return { map: map, order: order };
    }

    function captureScrollResumePoint(viewId) {
        if (viewId === "clinical-cases" || viewId === "college-official") {
            return {
                kind: "view_scroll",
                scrollY: global.scrollY || 0,
            };
        }
        if (viewId === "mental-model") {
            return {
                kind: "view_scroll",
                scrollY: global.scrollY || 0,
            };
        }
        if (viewId === "cognitive-priming") {
            return { kind: "view_entry" };
        }
        return service.defaultResumePointForView(viewId);
    }

    /**
     * @param {{
     *   chapter: string,
     *   releaseId: string,
     *   tabs: Array<{ viewId: string, availability: string }>,
     *   offlineStatus?: string|null,
     *   releaseInstalled?: boolean,
     *   installedReleaseIds?: string[],
     *   productMode?: boolean,
     *   isOfflineRequired?: boolean,
     *   observedAt?: string,
     *   entryMode?: string,
     *   store?: { listSessionRecords: () => Promise<object[]> }
     * }} options
     */
    async function buildRestoreContext(options) {
        const store = options.store || global.LouLearnerStore;
        if (!store || typeof store.listSessionRecords !== "function") {
            throw new Error("[LouSessionResume] listSessionRecords unavailable");
        }
        const sessionRecords = (await store.listSessionRecords()).map(
            normalizeSessionRecord
        );
        const availability = buildViewAvailabilityMap(options.tabs || []);

        return deepFreeze({
            entryMode: options.entryMode || readEntryModeFromUrl(),
            requestedChapter: options.chapter,
            activeReleaseId: options.releaseId,
            offlineStatus: options.offlineStatus || null,
            releaseInstalled: options.releaseInstalled === true,
            installedReleaseIds: Array.isArray(options.installedReleaseIds)
                ? options.installedReleaseIds.slice()
                : [],
            viewAvailability: deepFreeze(Object.assign({}, availability.map)),
            viewOrder: availability.order.slice(),
            sessionRecords: sessionRecords,
            observedAt: options.observedAt || new Date().toISOString(),
            isOfflineRequired: options.isOfflineRequired === true,
            productMode: options.productMode === true,
        });
    }

    function ensureWarningBanner() {
        let banner = document.getElementById("session-resume-warnings");
        if (!banner) {
            banner = document.createElement("div");
            banner.id = "session-resume-warnings";
            banner.className = "session-resume-warnings";
            banner.setAttribute("role", "status");
            const tabsEl = document.getElementById("tabs");
            if (tabsEl && tabsEl.parentNode) {
                tabsEl.parentNode.insertBefore(banner, tabsEl);
            }
        }
        return banner;
    }

    const WARNING_LABELS = {
        orphan_anchor:
            "le repère de lecture exact n'a pas pu être restauré",
    };

    function formatWarning(code) {
        return WARNING_LABELS[code] || null;
    }

    function displayWarnings(warnings) {
        activeWarnings = warnings ? warnings.slice() : [];
        const banner = ensureWarningBanner();
        if (activeWarnings.length === 0) {
            banner.classList.add("hidden");
            banner.textContent = "";
            return;
        }
        const labels = [];
        for (let i = 0; i < activeWarnings.length; i += 1) {
            const label = formatWarning(activeWarnings[i]);
            if (label) {
                labels.push(label);
            } else {
                console.warn(
                    "[LouSessionResume] Unknown resume warning:",
                    activeWarnings[i]
                );
            }
        }
        banner.classList.remove("hidden");
        banner.textContent =
            labels.length > 0
                ? "Reprise de session : " + labels.join(" · ")
                : "";
        if (labels.length === 0) {
            banner.classList.add("hidden");
        }
    }

    function addApplicationWarning(code) {
        if (activeWarnings.indexOf(code) < 0) {
            activeWarnings.push(code);
            displayWarnings(activeWarnings);
        }
    }

    function validatePlanCompleteness(plan) {
        if (!service.validateResumePlanCompleteness(plan)) {
            console.error(
                "[LouSessionResume] Incomplete ResumePlan — fatal (L27)",
                plan
            );
            return false;
        }
        return true;
    }

    function findTabIndexByViewId(tabs, viewId) {
        for (let i = 0; i < tabs.length; i++) {
            if (tabs[i].viewId === viewId) {
                return i;
            }
        }
        return -1;
    }

    function applyResumePoint(resumePoint, viewId) {
        if (!resumePoint || typeof resumePoint !== "object") {
            addApplicationWarning("orphan_anchor");
            return false;
        }

        if (
            service.isResumePointStructurallyInvalid(viewId, resumePoint)
        ) {
            addApplicationWarning("orphan_anchor");
            return false;
        }

        try {
            if (resumePoint.kind === "view_entry") {
                global.scrollTo(0, 0);
                return true;
            }
            if (resumePoint.kind === "view_scroll") {
                const y = Number(resumePoint.scrollY) || 0;
                global.scrollTo(0, y);
                return true;
            }
            if (resumePoint.kind === "element_block") {
                const id = resumePoint.elementId;
                if (!id) {
                    addApplicationWarning("orphan_anchor");
                    return false;
                }
                const el =
                    document.getElementById(id) ||
                    document.querySelector('[data-element-id="' + id + '"]');
                if (!el) {
                    addApplicationWarning("orphan_anchor");
                    return false;
                }
                el.scrollIntoView({ block: "start" });
                return true;
            }
            if (resumePoint.kind === "section_path") {
                const path = resumePoint.sectionPath;
                if (!path) {
                    addApplicationWarning("orphan_anchor");
                    return false;
                }
                const el = document.querySelector(
                    '[data-section-path="' + path + '"]'
                );
                if (!el) {
                    addApplicationWarning("orphan_anchor");
                    return false;
                }
                el.scrollIntoView({ block: "start" });
                return true;
            }
            if (resumePoint.kind === "question_id") {
                const qEl = document.querySelector(
                    '[data-question-id="' + resumePoint.questionId + '"]'
                );
                if (!qEl) {
                    addApplicationWarning("orphan_anchor");
                    return false;
                }
                qEl.scrollIntoView({ block: "start" });
                return true;
            }
            if (resumePoint.kind === "notes_focus") {
                return true;
            }
        } catch (err) {
            addApplicationWarning("orphan_anchor");
            return false;
        }

        addApplicationWarning("orphan_anchor");
        return false;
    }

    /**
     * @param {object} plan
     * @param {{
     *   tabs: Array<{ viewId: string }>,
     *   chapter: string,
     *   showTab: (index: number) => Promise<void>,
     *   redirectChapter?: (chapter: string) => void,
     *   showBlocked?: (reason: string) => void
     * }} handlers
     */
    async function applyResumePlan(plan, handlers) {
        if (restoreCycleComplete) {
            throw new Error(
                "[LouSessionResume] Second applyResumePlan forbidden (L26)"
            );
        }
        if (!validatePlanCompleteness(plan)) {
            restoreCycleComplete = true;
            throw new Error(
                "[LouSessionResume] Incomplete ResumePlan — restore cycle aborted (L27)"
            );
        }

        resumePlanApplied = true;
        displayWarnings(plan.warnings || []);

        if (plan.action === "blocked_offline") {
            if (handlers.showBlocked) {
                handlers.showBlocked(plan.blockedReason || "offline_not_ready");
            }
            restoreCycleComplete = true;
            return { ok: true, action: plan.action };
        }

        if (
            plan.targetChapter &&
            handlers.chapter &&
            plan.targetChapter !== handlers.chapter &&
            handlers.redirectChapter
        ) {
            handlers.redirectChapter(plan.targetChapter);
            restoreCycleComplete = true;
            return { ok: true, action: plan.action, redirect: plan.targetChapter };
        }

        const tabIndex = findTabIndexByViewId(handlers.tabs, plan.targetViewId);
        if (tabIndex < 0) {
            restoreCycleComplete = true;
            throw new Error(
                "[LouSessionResume] targetViewId not in rendered tabs: " +
                    plan.targetViewId
            );
        }
        pendingResumePoint =
            plan.action === "restore" ? plan.resumePoint : null;

        await handlers.showTab(tabIndex, {
            fromResumePlan: true,
            deferLearnerLayers: true,
        });

        if (plan.action === "restore" && pendingResumePoint) {
            applyResumePoint(pendingResumePoint, plan.targetViewId);
            pendingResumePoint = null;
        }

        if (handlers.flushLearnerLayers) {
            await handlers.flushLearnerLayers();
        } else if (
            global.LouRenderer &&
            typeof global.LouRenderer.flushPendingLearnerLayers === "function"
        ) {
            await global.LouRenderer.flushPendingLearnerLayers();
        }

        restoreCycleComplete = true;
        return { ok: true, action: plan.action };
    }

    async function persistCommitEvent(eventType, payload) {
        const store = global.LouLearnerStore;
        const releaseContext = store.getReleaseContext();
        if (!releaseContext) {
            return null;
        }

        const existing = await store.getSessionForRelease(
            releaseContext.releaseId
        );
        const commitContext = deepFreeze({
            release_id: releaseContext.releaseId,
            chapter: releaseContext.chapter,
            viewId: payload.viewId || (existing && existing.viewId),
            resumePoint: payload.resumePoint
                ? cloneResumePoint(payload.resumePoint)
                : payload.resumePoint,
            committedAt: new Date().toISOString(),
            eventId: service.COMMIT_EVENTS[eventType] || eventType,
            existingSessionState: existing
                ? normalizeSessionRecord(existing)
                : existing,
        });

        const sessionState = service.handleCommitEvent(commitContext, {
            type: eventType,
            payload: payload,
        });
        return store.upsertSessionState(sessionState);
    }

    function createCommitController(getCurrentViewState) {
        let debounceTimer = null;
        const DEBOUNCE_MS = 400;

        function flushViewLeave() {
            const state = getCurrentViewState();
            if (!state) {
                return Promise.resolve(null);
            }
            const resumePoint = captureScrollResumePoint(state.viewId);
            return persistCommitEvent("VIEW_LEAVE", {
                viewId: state.viewId,
                resumePoint: resumePoint,
            });
        }

        function onViewChanged(viewId, resumePoint) {
            if (debounceTimer) {
                clearTimeout(debounceTimer);
            }
            debounceTimer = setTimeout(function () {
                debounceTimer = null;
                persistCommitEvent("VIEW_CHANGED", {
                    viewId: viewId,
                    resumePoint:
                        resumePoint || service.defaultResumePointForView(viewId),
                }).catch(function (err) {
                    console.warn("[LouSessionResume] commit failed", err);
                });
            }, DEBOUNCE_MS);
        }

        function onLifecycleFlush(eventType) {
            const state = getCurrentViewState();
            if (!state) {
                return;
            }
            const resumePoint = captureScrollResumePoint(state.viewId);
            persistCommitEvent(eventType, {
                viewId: state.viewId,
                resumePoint: resumePoint,
            }).catch(function (err) {
                console.warn("[LouSessionResume] lifecycle commit failed", err);
            });
        }

        function onNotionChanged(elementId) {
            if (!elementId) {
                return Promise.resolve(null);
            }
            return persistCommitEvent("NOTION_CHANGED", {
                viewId: "notions",
                elementId: elementId,
                resumePoint: {
                    kind: "element_block",
                    elementId: elementId,
                },
            });
        }

        function onQcmQuestionChanged(questionId) {
            if (!questionId) {
                return Promise.resolve(null);
            }
            return persistCommitEvent("QCM_QUESTION_CHANGED", {
                viewId: "qcm",
                questionId: questionId,
                resumePoint: {
                    kind: "question_id",
                    questionId: questionId,
                },
            });
        }

        function onInternalNavValidated() {
            return persistCommitEvent("INTERNAL_NAV_VALIDATED", {
                viewId: service.AMORCAGE_VIEW_ID,
                resumePoint: { kind: "view_entry" },
            });
        }

        function onNotesFocusChanged(category) {
            return persistCommitEvent("NOTES_FOCUS_CHANGED", {
                viewId: "notes",
                category: category || "",
                resumePoint: {
                    kind: "notes_focus",
                    category: category || "",
                },
            });
        }

        function bindLifecycleEvents() {
            global.addEventListener("pagehide", function () {
                onLifecycleFlush("PAGEHIDE");
            });
            document.addEventListener("visibilitychange", function () {
                if (document.visibilityState === "hidden") {
                    onLifecycleFlush("VISIBILITY_HIDDEN");
                }
            });
        }

        return {
            flushViewLeave: flushViewLeave,
            onViewChanged: onViewChanged,
            onNotionChanged: onNotionChanged,
            onQcmQuestionChanged: onQcmQuestionChanged,
            onInternalNavValidated: onInternalNavValidated,
            onNotesFocusChanged: onNotesFocusChanged,
            bindLifecycleEvents: bindLifecycleEvents,
        };
    }

    function resetRestoreCycleForTests() {
        resumePlanApplied = false;
        activeWarnings = [];
        pendingResumePoint = null;
        restoreCycleComplete = false;
    }

    global.LouSessionResume = {
        buildRestoreContext: buildRestoreContext,
        applyResumePlan: applyResumePlan,
        applyResumePoint: applyResumePoint,
        persistCommitEvent: persistCommitEvent,
        createCommitController: createCommitController,
        readEntryModeFromUrl: readEntryModeFromUrl,
        captureScrollResumePoint: captureScrollResumePoint,
        displayWarnings: displayWarnings,
        deepFreeze: deepFreeze,
        normalizeSessionRecord: normalizeSessionRecord,
        resetRestoreCycleForTests: resetRestoreCycleForTests,
        wasResumePlanApplied: function () {
            return resumePlanApplied;
        },
    };
})(typeof window !== "undefined" ? window : globalThis);
