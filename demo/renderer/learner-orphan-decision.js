// Learner orphan decision — traceable restore outcomes (Renderer V1).
//
// Opt-in trace: ?learnerTrace=1 or localStorage lou-learner-trace=1
(function (global) {
    const TRACE_KEY = "lou-learner-trace";

    function traceEnabled() {
        if (global.LouLearnerOrphanDecision && global.LouLearnerOrphanDecision._forceTrace) {
            return true;
        }
        try {
            if (global.localStorage && global.localStorage.getItem(TRACE_KEY) === "1") {
                return true;
            }
        } catch (err) {
            // ignore
        }
        const params = global.location && global.location.search;
        return !!(params && /(?:^|[?&])learnerTrace=1(?:&|$)/.test(params));
    }

    function releaseIdFromRecord(record) {
        return record && record.release_id ? String(record.release_id) : null;
    }

    function baseTrace(kind, record, projectionId) {
        return {
            annotationId: record && record.id != null ? record.id : null,
            type: kind,
            releaseId: releaseIdFromRecord(record),
            projectionId: projectionId || (record && record.projection) || null,
            elementId: record && record.element ? record.element : null,
            selector:
                kind === "highlight" && record && record.selector
                    ? record.selector
                    : null,
            blockFound: false,
            walkthroughFound: false,
            rangeFound: false,
            domCreated: false,
            alreadyPresent: false,
            decision: null,
            reason: null,
        };
    }

    function emitTrace(entry) {
        if (!traceEnabled()) {
            return;
        }
        if (!global.__LouLearnerRestoreTrace) {
            global.__LouLearnerRestoreTrace = [];
        }
        global.__LouLearnerRestoreTrace.push(
            Object.assign({ at: new Date().toISOString() }, entry)
        );
        if (global.console && typeof global.console.info === "function") {
            global.console.info("[LouLearnerOrphanDecision]", entry);
        }
    }

    function findScopedBlock(host, element, projectionId, composition) {
        if (!host || !element) {
            return null;
        }
        if (projectionId) {
            const scoped = host.querySelector(
                '.pedagogical-block[data-element="' +
                    element +
                    '"][data-source-projection="' +
                    projectionId +
                    '"]'
            );
            if (scoped) {
                return scoped;
            }
        }
        if (composition) {
            return null;
        }
        return host.querySelector('.pedagogical-block[data-element="' + element + '"]');
    }

    function clearAnnotationOrphanRows(host) {
        if (!host) {
            return;
        }
        host.querySelectorAll(".learner-orphan-annotation").forEach(function (row) {
            row.remove();
        });
        const panel = host.querySelector(".learner-orphans");
        if (!panel) {
            return;
        }
        const hasDiagramOrphans = panel.querySelector(
            ".personal-diagram, .orphan-anchor + figure.personal-diagram"
        );
        const hasAnnotationOrphans = panel.querySelector(".learner-orphan-annotation");
        if (!hasDiagramOrphans && !hasAnnotationOrphans) {
            panel.remove();
        }
    }

    function isHighlightSatisfied(walkthrough, record, highlights) {
        if (!walkthrough || !record || !highlights) {
            return false;
        }
        if (
            highlights._isSelectorSatisfiedInWalkthrough(
                walkthrough,
                record.selector
            )
        ) {
            return true;
        }
        const range = highlights.findRangeForSelector(
            walkthrough,
            record.selector
        );
        if (range && highlights._rangeAlreadyHighlighted(range)) {
            return true;
        }
        return false;
    }

    function isNoteSatisfied(walkthrough, record, inlineNotes) {
        if (!walkthrough || !record || !inlineNotes) {
            return false;
        }
        return inlineNotes._isNoteRecordSatisfiedInWalkthrough(walkthrough, record);
    }

    function evaluateHighlight(host, record, projectionId, composition, highlights) {
        const trace = baseTrace("highlight", record, projectionId);
        const lookupProjection =
            (record && record.projection) || projectionId || null;

        const block = findScopedBlock(
            host,
            record.element,
            lookupProjection,
            composition
        );
        trace.blockFound = !!block;
        if (!block) {
            trace.decision = "orphan";
            trace.reason = "block_not_found";
            emitTrace(trace);
            return trace;
        }

        const walkthrough = block.querySelector(".block-walkthrough");
        trace.walkthroughFound = !!walkthrough;
        if (!walkthrough) {
            trace.decision = "orphan";
            trace.reason = "walkthrough_not_found";
            emitTrace(trace);
            return trace;
        }

        if (isHighlightSatisfied(walkthrough, record, highlights)) {
            trace.alreadyPresent = true;
            trace.decision = "restored";
            trace.reason = "already_satisfied_in_dom";
            emitTrace(trace);
            return trace;
        }

        const range = highlights.findRangeForSelector(
            walkthrough,
            record.selector
        );
        trace.rangeFound = !!range;
        if (range && !highlights._rangeAlreadyHighlighted(range)) {
            const mark = highlights.wrapRangeInMark(range);
            trace.domCreated = !!mark;
            if (mark) {
                trace.decision = "restored";
                trace.reason = "wrapped_from_selector";
                emitTrace(trace);
                return trace;
            }
        }
        if (range && highlights._rangeAlreadyHighlighted(range)) {
            trace.alreadyPresent = true;
            trace.decision = "restored";
            trace.reason = "range_already_highlighted";
            emitTrace(trace);
            return trace;
        }

        trace.decision = "orphan";
        trace.reason = "selector_unresolved";
        emitTrace(trace);
        return trace;
    }

    function evaluateNote(host, record, composition, inlineNotes, caretAnchor) {
        const trace = baseTrace(
            "note",
            record,
            record && record.projection
        );

        if (!record || !record.text || !String(record.text).trim()) {
            trace.decision = "skipped";
            trace.reason = "empty_text";
            emitTrace(trace);
            return trace;
        }

        const block = findScopedBlock(
            host,
            record.element,
            record.projection,
            composition
        );
        trace.blockFound = !!block;
        if (!block) {
            trace.decision = "orphan";
            trace.reason = "block_not_found";
            emitTrace(trace);
            return trace;
        }

        const walkthrough = block.querySelector(".block-walkthrough");
        trace.walkthroughFound = !!walkthrough;
        if (!walkthrough) {
            trace.decision = "orphan";
            trace.reason = "walkthrough_not_found";
            emitTrace(trace);
            return trace;
        }

        if (
            record.id != null &&
            walkthrough.querySelector('[data-note-id="' + record.id + '"]')
        ) {
            trace.alreadyPresent = true;
            trace.decision = "skipped";
            trace.reason = "note_id_already_in_dom";
            emitTrace(trace);
            return trace;
        }

        if (isNoteSatisfied(walkthrough, record, inlineNotes)) {
            trace.alreadyPresent = true;
            trace.decision = "skipped";
            trace.reason = "note_text_already_in_dom";
            emitTrace(trace);
            return trace;
        }

        const range =
            caretAnchor &&
            typeof caretAnchor.restoreCaretAnchor === "function"
                ? caretAnchor.restoreCaretAnchor(walkthrough, record.anchor)
                : null;
        trace.rangeFound = !!range;
        if (!range) {
            trace.decision = "orphan";
            trace.reason = "caret_anchor_unresolved";
            emitTrace(trace);
            return trace;
        }

        const noteEl = global.document.createElement("span");
        noteEl.className = inlineNotes.NOTE_CLASS;
        noteEl.dataset.learner = "true";
        noteEl.setAttribute("data-note-id", String(record.id));
        noteEl.textContent = record.text;
        range.insertNode(noteEl);
        trace.domCreated = true;
        trace.decision = "restored";
        trace.reason = "inserted_from_caret_anchor";
        emitTrace(trace);
        return trace;
    }

    function filterOrphans(host, orphans, highlights, inlineNotes) {
        if (!orphans || !orphans.length) {
            return [];
        }
        return orphans.filter(function (item) {
            const record = item.record || {};
            const lookupProjection = record.projection || null;
            const block = findScopedBlock(
                host,
                record.element,
                lookupProjection,
                true
            );
            const walkthrough =
                block && block.querySelector(".block-walkthrough");
            if (!walkthrough) {
                return true;
            }
            if (item.kind === "highlight" && highlights) {
                return !isHighlightSatisfied(walkthrough, record, highlights);
            }
            if (item.kind === "note" && inlineNotes) {
                return !isNoteSatisfied(walkthrough, record, inlineNotes);
            }
            return true;
        });
    }

    global.LouLearnerOrphanDecision = {
        TRACE_KEY: TRACE_KEY,
        traceEnabled: traceEnabled,
        beginRestoreCycle: clearAnnotationOrphanRows,
        clearAnnotationOrphanRows: clearAnnotationOrphanRows,
        findScopedBlock: findScopedBlock,
        isHighlightSatisfied: isHighlightSatisfied,
        isNoteSatisfied: isNoteSatisfied,
        evaluateHighlight: evaluateHighlight,
        evaluateNote: evaluateNote,
        filterOrphans: filterOrphans,
        getTraceLog: function () {
            return global.__LouLearnerRestoreTrace
                ? global.__LouLearnerRestoreTrace.slice()
                : [];
        },
        resetTraceLog: function () {
            global.__LouLearnerRestoreTrace = [];
        },
    };
})(window);
