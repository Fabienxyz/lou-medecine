/**
 * Lot D4 — Session Service (pure, stateless).
 * ResumePlan = f(RestoreContext) ; handleCommitEvent(CommitContext, Event) → SessionState.
 * No DOM, IndexedDB, Composition, Catalogue, Package Access, or system clock (IA-11–IA-13).
 */
(function (global) {
    const SESSION_SCHEMA_VERSION = 1;
    const AMORCAGE_VIEW_ID = "cognitive-priming";

    const RESUME_POINT_KINDS_BY_VIEW = {
        "cognitive-priming": ["view_entry"],
        "mental-model": ["element_block", "view_scroll"],
        notions: ["element_block"],
        "clinical-cases": ["view_scroll"],
        "college-official": ["section_path", "view_scroll"],
        qcm: ["question_id"],
        notes: ["notes_focus"],
    };

    const COMMIT_EVENTS = Object.freeze({
        VIEW_CHANGED: "CE-01",
        NOTION_CHANGED: "CE-02",
        QCM_QUESTION_CHANGED: "CE-03",
        INTERNAL_NAV_VALIDATED: "CE-04",
        NOTES_FOCUS_CHANGED: "CE-05",
        VIEW_LEAVE: "CE-06",
        PAGEHIDE: "CE-07",
        VISIBILITY_HIDDEN: "CE-08",
        READER_CLOSE: "CE-09",
    });

    function cloneWarnings(warnings) {
        return warnings && warnings.length ? warnings.slice() : [];
    }

    function pushWarning(warnings, code) {
        if (warnings.indexOf(code) < 0) {
            warnings.push(code);
        }
    }

    function isObject(value) {
        return value !== null && typeof value === "object" && !Array.isArray(value);
    }

    function isLegacyReleaseId(releaseId) {
        return (
            typeof releaseId === "string" &&
            releaseId.indexOf("__legacy__") === 0
        );
    }

    function normalizeSessionRecord(record) {
        if (!isObject(record)) {
            return null;
        }
        return {
            logical_record_id: record.logical_record_id || record.record_id || null,
            release_id: record.release_id,
            chapter: record.chapter,
            viewId: record.viewId,
            resumePoint: record.resumePoint,
            last_activity_at: record.last_activity_at,
            schema_version: record.schema_version,
        };
    }

    function compareActivityDesc(a, b) {
        const aTime = a && a.last_activity_at ? String(a.last_activity_at) : "";
        const bTime = b && b.last_activity_at ? String(b.last_activity_at) : "";
        return bTime.localeCompare(aTime);
    }

    function selectSessionRecord(restoreContext) {
        const records = (restoreContext.sessionRecords || [])
            .map(normalizeSessionRecord)
            .filter(Boolean);
        if (records.length === 0) {
            return null;
        }

        const entryMode = restoreContext.entryMode;
        if (entryMode === "breadcrumb_amorçage") {
            return null;
        }

        if (entryMode === "continue_global" || entryMode === "post_import") {
            return records.slice().sort(compareActivityDesc)[0];
        }

        const chapter = restoreContext.requestedChapter;
        const activeReleaseId = restoreContext.activeReleaseId;
        const matches = records.filter(function (record) {
            return (
                record.chapter === chapter &&
                record.release_id === activeReleaseId
            );
        });
        if (matches.length === 0) {
            return null;
        }
        return matches.slice().sort(compareActivityDesc)[0];
    }

    function getViewAvailability(restoreContext, viewId) {
        const map = restoreContext.viewAvailability || {};
        return map[viewId] || "unknown";
    }

    function firstPublishedViewId(restoreContext) {
        const map = restoreContext.viewAvailability || {};
        const ordered = restoreContext.viewOrder;
        if (!Array.isArray(ordered) || ordered.length === 0) {
            return null;
        }
        for (let i = 0; i < ordered.length; i++) {
            const viewId = ordered[i];
            if (map[viewId] === "published") {
                return viewId;
            }
        }
        return null;
    }

    function isReleaseInstalled(restoreContext, releaseId) {
        const installed = restoreContext.installedReleaseIds;
        if (Array.isArray(installed)) {
            return installed.indexOf(releaseId) >= 0;
        }
        if (releaseId === restoreContext.activeReleaseId) {
            return restoreContext.releaseInstalled !== false;
        }
        return restoreContext.releaseInstalled === true;
    }

    function validateResumePointStructure(viewId, resumePoint) {
        if (!isObject(resumePoint) || typeof resumePoint.kind !== "string") {
            return false;
        }
        const allowed = RESUME_POINT_KINDS_BY_VIEW[viewId];
        if (!allowed) {
            return false;
        }
        return allowed.indexOf(resumePoint.kind) >= 0;
    }

    function defaultResumePointForView(viewId) {
        if (viewId === AMORCAGE_VIEW_ID) {
            return { kind: "view_entry" };
        }
        if (viewId === "notions" || viewId === "mental-model") {
            return { kind: "element_block", elementId: "" };
        }
        if (viewId === "clinical-cases" || viewId === "college-official") {
            return { kind: "view_scroll", scrollY: 0 };
        }
        if (viewId === "qcm") {
            return { kind: "question_id", questionId: "" };
        }
        if (viewId === "notes") {
            return { kind: "notes_focus", category: "" };
        }
        return { kind: "view_entry" };
    }

    function buildFallbackAmorçage(restoreContext, warnings) {
        const w = cloneWarnings(warnings);
        return {
            action: "fallback_amorçage",
            targetReleaseId: restoreContext.activeReleaseId,
            targetChapter: restoreContext.requestedChapter,
            targetViewId: AMORCAGE_VIEW_ID,
            warnings: w,
        };
    }

    function buildFallbackRequestedChapter(restoreContext, warnings) {
        const w = cloneWarnings(warnings);
        const targetViewId = firstPublishedViewId(restoreContext);
        if (!targetViewId) {
            pushWarning(w, "no_published_view");
            return buildFallbackAmorçage(restoreContext, w);
        }
        return {
            action: "fallback_requested_chapter",
            targetReleaseId: restoreContext.activeReleaseId,
            targetChapter: restoreContext.requestedChapter,
            targetViewId: targetViewId,
            warnings: w,
        };
    }

    function buildBlockedOffline(restoreContext, session, warnings) {
        const w = cloneWarnings(warnings);
        return {
            action: "blocked_offline",
            targetReleaseId: session
                ? session.release_id
                : restoreContext.activeReleaseId,
            targetChapter: session
                ? session.chapter
                : restoreContext.requestedChapter,
            targetViewId: session ? session.viewId : undefined,
            warnings: w,
            blockedReason: "offline_not_ready",
        };
    }

    function buildOrphanSignal(restoreContext, session) {
        const warnings = ["orphan_release"];
        return {
            action: "orphan_signal",
            targetReleaseId: session.release_id,
            targetChapter: session.chapter || restoreContext.requestedChapter,
            targetViewId: AMORCAGE_VIEW_ID,
            warnings: warnings,
        };
    }

    function buildRestorePlan(restoreContext, session, warnings, targetViewId, resumePoint) {
        const w = cloneWarnings(warnings);
        return {
            action: "restore",
            targetReleaseId: session.release_id,
            targetChapter: session.chapter,
            targetViewId: targetViewId,
            resumePoint: resumePoint,
            warnings: w,
        };
    }

    function resolveTargetViewId(restoreContext, session, warnings) {
        let targetViewId = session.viewId;
        const availability = getViewAvailability(restoreContext, targetViewId);

        if (availability === "unknown") {
            pushWarning(warnings, "unknown_view");
            return {
                plan: buildFallbackRequestedChapter(restoreContext, warnings),
                done: true,
            };
        }

        if (availability === "planned") {
            pushWarning(warnings, "planned");
            targetViewId = firstPublishedViewId(restoreContext);
            if (!targetViewId) {
                pushWarning(warnings, "no_published_view");
                return {
                    plan: buildFallbackAmorçage(restoreContext, warnings),
                    done: true,
                };
            }
        }

        return { targetViewId: targetViewId, done: false };
    }

    /**
     * @param {Record<string, unknown>} restoreContext
     */
    function buildResumePlan(restoreContext) {
        if (!isObject(restoreContext)) {
            throw new Error("[LouSessionService] RestoreContext must be an object");
        }

        const warnings = [];

        const session = selectSessionRecord(restoreContext);
        if (!session) {
            return buildFallbackAmorçage(restoreContext, warnings);
        }

        if (
            restoreContext.isOfflineRequired &&
            restoreContext.offlineStatus !== "offline_ready"
        ) {
            return buildBlockedOffline(restoreContext, session, warnings);
        }

        if (!isReleaseInstalled(restoreContext, session.release_id)) {
            return buildOrphanSignal(restoreContext, session);
        }

        if (
            session.release_id !== restoreContext.activeReleaseId &&
            session.chapter === restoreContext.requestedChapter
        ) {
            pushWarning(warnings, "superseded_release");
            return buildFallbackAmorçage(restoreContext, warnings);
        }

        if (
            session.schema_version == null ||
            Number(session.schema_version) !== SESSION_SCHEMA_VERSION
        ) {
            pushWarning(warnings, "schema_incompatible");
            return buildFallbackAmorçage(restoreContext, warnings);
        }

        const resolved = resolveTargetViewId(restoreContext, session, warnings);
        if (resolved.done) {
            return resolved.plan;
        }

        let targetViewId = resolved.targetViewId;
        let resumePoint =
            session.resumePoint && isObject(session.resumePoint)
                ? Object.assign({}, session.resumePoint)
                : defaultResumePointForView(targetViewId);

        if (!validateResumePointStructure(targetViewId, resumePoint)) {
            pushWarning(warnings, "orphan_anchor");
            resumePoint =
                resumePoint && isObject(resumePoint)
                    ? resumePoint
                    : defaultResumePointForView(targetViewId);
        }

        if (
            isLegacyReleaseId(session.release_id) &&
            restoreContext.productMode === true
        ) {
            pushWarning(warnings, "legacy");
        }

        return buildRestorePlan(
            restoreContext,
            session,
            warnings,
            targetViewId,
            resumePoint
        );
    }

    function deriveLogicalRecordId(releaseId, storageKey) {
        return (
            "session_resume::" +
            releaseId +
            "::" +
            String(Math.trunc(Number(storageKey) || 1)).padStart(10, "0")
        );
    }

    function buildSessionStateFromCommit(commitContext, event, overrides) {
        const ctx = commitContext || {};
        const payload = (event && event.payload) || {};
        const viewId =
            payload.viewId || ctx.viewId || AMORCAGE_VIEW_ID;
        const resumePoint =
            payload.resumePoint ||
            ctx.resumePoint ||
            defaultResumePointForView(viewId);
        const releaseId = ctx.release_id;
        const storageKey =
            ctx.existingSessionState && ctx.existingSessionState.id
                ? ctx.existingSessionState.id
                : 1;

        const state = {
            logical_record_id: deriveLogicalRecordId(releaseId, storageKey),
            release_id: releaseId,
            chapter: ctx.chapter,
            viewId: viewId,
            resumePoint: resumePoint,
            last_activity_at: ctx.committedAt,
            schema_version: SESSION_SCHEMA_VERSION,
        };

        if (overrides) {
            Object.assign(state, overrides);
        }
        if (ctx.existingSessionState && ctx.existingSessionState.id != null) {
            state.id = ctx.existingSessionState.id;
        }
        return state;
    }

    /**
     * @param {Record<string, unknown>} commitContext
     * @param {{ type: string, payload?: Record<string, unknown> }} event
     */
    function handleCommitEvent(commitContext, event) {
        if (!isObject(commitContext)) {
            throw new Error("[LouSessionService] CommitContext must be an object");
        }
        if (!event || typeof event.type !== "string") {
            throw new Error("[LouSessionService] Commit event type is required");
        }

        const payload = event.payload || {};
        const existing = commitContext.existingSessionState || null;

        switch (event.type) {
            case "VIEW_CHANGED":
                return buildSessionStateFromCommit(commitContext, event, {
                    viewId: payload.viewId,
                    resumePoint: payload.resumePoint,
                });
            case "NOTION_CHANGED":
                return buildSessionStateFromCommit(commitContext, event, {
                    viewId: "notions",
                    resumePoint: payload.resumePoint || {
                        kind: "element_block",
                        elementId: payload.elementId || "",
                    },
                });
            case "QCM_QUESTION_CHANGED":
                return buildSessionStateFromCommit(commitContext, event, {
                    viewId: "qcm",
                    resumePoint: {
                        kind: "question_id",
                        questionId: payload.questionId || "",
                    },
                });
            case "INTERNAL_NAV_VALIDATED":
                return buildSessionStateFromCommit(commitContext, event, {
                    viewId: AMORCAGE_VIEW_ID,
                    resumePoint: { kind: "view_entry" },
                });
            case "NOTES_FOCUS_CHANGED":
                return buildSessionStateFromCommit(commitContext, event, {
                    viewId: "notes",
                    resumePoint: {
                        kind: "notes_focus",
                        category: payload.category || "",
                        noteId: payload.noteId || undefined,
                    },
                });
            case "VIEW_LEAVE":
            case "PAGEHIDE":
            case "VISIBILITY_HIDDEN":
            case "READER_CLOSE":
                return buildSessionStateFromCommit(commitContext, event, {
                    viewId: payload.viewId || commitContext.viewId,
                    resumePoint:
                        payload.resumePoint || commitContext.resumePoint,
                });
            default:
                throw new Error(
                    "[LouSessionService] Unsupported commit event: " + event.type
                );
        }
    }

    function validateResumePlanCompleteness(plan) {
        if (!isObject(plan) || typeof plan.action !== "string") {
            return false;
        }
        const action = plan.action;
        const needs = ["targetChapter", "targetViewId"];
        if (
            action === "restore" ||
            action === "fallback_amorçage" ||
            action === "fallback_requested_chapter" ||
            action === "blocked_offline"
        ) {
            if (typeof plan.targetReleaseId !== "string" || !plan.targetReleaseId) {
                return false;
            }
        }
        for (let i = 0; i < needs.length; i++) {
            const key = needs[i];
            if (action === "blocked_offline" && key === "targetViewId") {
                continue;
            }
            if (typeof plan[key] !== "string" || !plan[key]) {
                return false;
            }
        }
        if (action === "restore") {
            if (!isObject(plan.resumePoint)) {
                return false;
            }
            if (plan.blockedReason !== undefined) {
                return false;
            }
        } else if (plan.resumePoint !== undefined) {
            return false;
        }
        if (action === "blocked_offline") {
            if (typeof plan.blockedReason !== "string" || !plan.blockedReason) {
                return false;
            }
        } else if (plan.blockedReason !== undefined) {
            return false;
        }
        if (action === "orphan_signal") {
            if (!Array.isArray(plan.warnings) || plan.warnings.indexOf("orphan_release") < 0) {
                return false;
            }
        }
        return true;
    }

    function isResumePointStructurallyInvalid(viewId, resumePoint) {
        return !validateResumePointStructure(viewId, resumePoint);
    }

    const api = {
        SESSION_SCHEMA_VERSION,
        AMORCAGE_VIEW_ID,
        COMMIT_EVENTS,
        RESUME_POINT_KINDS_BY_VIEW,
        buildResumePlan,
        handleCommitEvent,
        validateResumePlanCompleteness,
        validateResumePointStructure,
        isResumePointStructurallyInvalid,
        defaultResumePointForView,
        selectSessionRecord,
    };

    if (typeof module !== "undefined" && module.exports) {
        module.exports = api;
    }
    global.LouSessionService = api;
})(typeof window !== "undefined" ? window : globalThis);
