/**
 * Lot D6-E — SearchHit navigation adapter (Reader).
 * Maps SearchHit anchors to DOM targets — no matching, no index logic.
 */
(function (global) {
    const UNIT_SEPARATOR = "\u001f";

    function findTabIndex(tabs, viewId) {
        if (!Array.isArray(tabs) || !viewId) {
            return -1;
        }
        return tabs.findIndex(function (tab) {
            return tab && tab.viewId === viewId;
        });
    }

    function sectionPathKey(path) {
        if (Array.isArray(path)) {
            return path.join(UNIT_SEPARATOR);
        }
        return String(path || "");
    }

    /**
     * Resolve a DOM element for a SearchHit anchor within the current document.
     * @returns {{ element: Element | null, code: string | null }}
     */
    function resolveSearchAnchorTarget(anchor, viewId) {
        if (!anchor || typeof anchor !== "object") {
            return { element: null, code: "LS-READER-ANCHOR-INVALID" };
        }

        if (anchor.kind === "element_block") {
            if (anchor.blockAnchor) {
                const claimBtn = document.querySelector(
                    '.claim-trace-link[data-claim="' + anchor.blockAnchor + '"]'
                );
                if (claimBtn) {
                    return { element: claimBtn, code: null };
                }
            }
            const elementId = anchor.elementId;
            if (!elementId) {
                return { element: null, code: "LS-READER-ANCHOR-INVALID" };
            }
            const el =
                document.getElementById(elementId) ||
                document.querySelector('[data-element-id="' + elementId + '"]') ||
                document.querySelector('.pedagogical-block[data-element="' + elementId + '"]');
            if (!el) {
                return { element: null, code: "LS-READER-ANCHOR-MISSING" };
            }
            return { element: el, code: null };
        }

        if (anchor.kind === "section_path") {
            const key = sectionPathKey(anchor.path);
            const el = document.querySelector('[data-section-path="' + key + '"]');
            if (!el) {
                return { element: null, code: "LS-READER-ANCHOR-MISSING" };
            }
            return { element: el, code: null };
        }

        if (anchor.kind === "question_id") {
            const el = document.querySelector(
                '[data-question-id="' + anchor.questionId + '"]'
            );
            if (!el) {
                return { element: null, code: "LS-READER-ANCHOR-MISSING" };
            }
            return { element: el, code: null };
        }

        if (anchor.kind === "scenario_scroll") {
            if (anchor.scenarioId) {
                const el = document.querySelector(
                    '[data-scenario-id="' + anchor.scenarioId + '"]'
                );
                if (el) {
                    return { element: el, code: null };
                }
            }
            return { element: document.scrollingElement || document.body, code: null };
        }

        if (anchor.kind === "manifest_alt") {
            const elementId = anchor.elementId || anchor.visualId;
            if (!elementId) {
                return { element: null, code: "LS-READER-ANCHOR-INVALID" };
            }
            const el =
                document.getElementById(elementId) ||
                document.querySelector('.pedagogical-block[data-element="' + elementId + '"]');
            if (!el) {
                return { element: null, code: "LS-READER-ANCHOR-MISSING" };
            }
            return { element: el, code: null };
        }

        return { element: null, code: "LS-READER-ANCHOR-INVALID" };
    }

    function clearSearchHighlights(root) {
        const scope = root || document;
        scope.querySelectorAll(".search-hit-highlight").forEach(function (el) {
            el.classList.remove("search-hit-highlight");
        });
        scope.querySelectorAll("mark.search-hit-mark").forEach(function (mark) {
            const parent = mark.parentNode;
            if (!parent) {
                return;
            }
            while (mark.firstChild) {
                parent.insertBefore(mark.firstChild, mark);
            }
            parent.removeChild(mark);
            parent.normalize();
        });
    }

    function applySearchTargetHighlight(element) {
        if (!element) {
            return;
        }
        element.classList.add("search-hit-highlight");
    }

    function renderSnippetHtml(snippet, ranges) {
        if (!snippet) {
            return "";
        }
        const safe = String(snippet);
        if (!Array.isArray(ranges) || !ranges.length) {
            return escapeHtml(safe);
        }
        const sorted = ranges.slice().sort(function (a, b) {
            return a.start - b.start;
        });
        let html = "";
        let cursor = 0;
        for (let i = 0; i < sorted.length; i += 1) {
            const range = sorted[i];
            const start = Math.max(0, range.start);
            const end = Math.min(safe.length, start + range.length);
            if (start > cursor) {
                html += escapeHtml(safe.slice(cursor, start));
            }
            html +=
                "<mark class=\"search-hit-mark\">" +
                escapeHtml(safe.slice(start, end)) +
                "</mark>";
            cursor = end;
        }
        if (cursor < safe.length) {
            html += escapeHtml(safe.slice(cursor));
        }
        return html;
    }

    function escapeHtml(text) {
        return String(text)
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;");
    }

    /** Mirrors normTextPreserveCase (D6-B) for college section_path DOM keys. */
    function normalizeSectionTitle(text) {
        if (typeof text !== "string") {
            return "";
        }
        let s = text.normalize("NFC");
        s = s.replace(/\r\n/g, "\n").replace(/\r/g, "\n");
        s = s.replace(/\t/g, " ");
        s = s.replace(/[ \t]+$/gm, "");
        s = s.replace(/\n{3,}/g, "\n\n");
        return s.trim();
    }

    function decorateCollegeSectionPaths(root) {
        if (!root) {
            return;
        }
        const headings = root.querySelectorAll("h1, h2, h3, h4, h5, h6");
        const stack = [];
        headings.forEach(function (heading) {
            const level = parseInt(heading.tagName.slice(1), 10);
            while (stack.length && stack[stack.length - 1].level >= level) {
                stack.pop();
            }
            const title = normalizeSectionTitle(heading.textContent || "");
            stack.push({ level: level, title: title });
            const key = stack.map(function (item) {
                return item.title;
            }).join(UNIT_SEPARATOR);
            heading.setAttribute("data-section-path", key);
        });
    }

    /**
     * Navigate to a SearchHit within the open Release.
     * @param {object} hit
     * @param {{
     *   tabs: Array<{ viewId: string }>,
     *   releaseId: string,
     *   showTab: (index: number, options?: object) => Promise<void>,
     *   whenTabReady?: () => Promise<void>,
     *   onDiagnostic?: (code: string) => void,
     * }} handlers
     */
    async function navigateToSearchHit(hit, handlers) {
        if (!hit || !handlers) {
            return { ok: false, code: "LS-READER-HIT-INVALID" };
        }
        if (handlers.releaseId && hit.release_id !== handlers.releaseId) {
            if (handlers.onDiagnostic) {
                handlers.onDiagnostic("LS-READER-RELEASE-MISMATCH");
            }
            return { ok: false, code: "LS-READER-RELEASE-MISMATCH" };
        }

        const tabIndex = findTabIndex(handlers.tabs, hit.viewId);
        if (tabIndex < 0) {
            if (handlers.onDiagnostic) {
                handlers.onDiagnostic("LS-READER-VIEW-MISSING");
            }
            return { ok: false, code: "LS-READER-VIEW-MISSING" };
        }

        clearSearchHighlights(document);

        await handlers.showTab(tabIndex, {
            skipViewCommit: true,
            deferLearnerLayers: true,
            fromSearchNavigation: true,
        });

        if (handlers.whenTabReady) {
            await handlers.whenTabReady();
        }

        if (global.LouRenderer && typeof global.LouRenderer.flushPendingLearnerLayers === "function") {
            await global.LouRenderer.flushPendingLearnerLayers();
        }

        const resolved = resolveSearchAnchorTarget(hit.anchor, hit.viewId);
        if (!resolved.element) {
            if (handlers.onDiagnostic) {
                handlers.onDiagnostic(resolved.code || "LS-READER-ANCHOR-MISSING");
            }
            return { ok: false, code: resolved.code || "LS-READER-ANCHOR-MISSING" };
        }

        if (typeof resolved.element.scrollIntoView === "function") {
            resolved.element.scrollIntoView({ block: "center", behavior: "auto" });
        }
        applySearchTargetHighlight(resolved.element);

        return { ok: true, code: null };
    }

    const api = {
        UNIT_SEPARATOR,
        findTabIndex,
        sectionPathKey,
        resolveSearchAnchorTarget,
        clearSearchHighlights,
        applySearchTargetHighlight,
        renderSnippetHtml,
        navigateToSearchHit,
        normalizeSectionTitle,
        decorateCollegeSectionPaths,
    };

    global.LouSearchNavigation = api;
})(typeof window !== "undefined" ? window : globalThis);
