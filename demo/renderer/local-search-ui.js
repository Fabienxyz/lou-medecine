/**
 * Lot D6-E — Local Search Reader panel (ephemeral UI states only).
 * All queries go through Local Search Runtime — no matching or snippet logic here.
 */
(function (global) {
    const SEARCH_STATES = {
        CLOSED: "closed",
        IDLE: "idle",
        INDEXING: "indexing",
        SEARCHING: "searching",
        RESULTS: "results",
        EMPTY: "empty",
        NO_RESULTS: "no-results",
        ERROR: "error",
    };

    const STATUS_MESSAGES = {
        indexing: "Indexation en cours…",
        searching: "Recherche…",
        empty: "Saisissez au moins 2 caractères.",
        "no-results": "Aucun résultat dans cette Release.",
        error: "La recherche est momentanément indisponible.",
        "cache-rebuilt": "Index reconstruit pour cette Release.",
    };

    /**
     * @param {{
     *   runtime: { search: Function, ensureIndex: Function, getStatus: Function },
     *   releaseId: string,
     *   tabs: Array<{ viewId: string, label?: string }>,
     *   showTab: (index: number, options?: object) => Promise<void>,
     *   whenTabReady?: () => Promise<void>,
     *   root?: HTMLElement,
     *   trigger?: HTMLElement,
     *   input?: HTMLInputElement,
     *   statusEl?: HTMLElement,
     *   resultsEl?: HTMLElement,
     *   debounceMs?: number,
     * }} options
     */
    function createLocalSearchUI(options) {
        const runtime = options.runtime;
        const releaseId = options.releaseId;
        let tabs = options.tabs || [];
        const showTab = options.showTab;
        const whenTabReady =
            options.whenTabReady ||
            function () {
                return Promise.resolve();
            };
        const debounceMs = options.debounceMs || 200;

        const root = options.root || document.getElementById("local-search-root");
        const trigger =
            options.trigger || document.getElementById("local-search-trigger");
        const input =
            options.input || document.getElementById("local-search-input");
        const statusEl =
            options.statusEl || document.getElementById("local-search-status");
        const resultsEl =
            options.resultsEl || document.getElementById("local-search-results");

        let state = SEARCH_STATES.CLOSED;
        let hits = [];
        let selectedIndex = -1;
        let debounceTimer = null;
        let searchGeneration = 0;
        let lastDiagnostic = null;
        let indexReady = false;

        function getViewLabel(viewId) {
            const tab = tabs.find(function (t) {
                return t.viewId === viewId;
            });
            return (tab && tab.label) || viewId;
        }

        function setState(next) {
            state = next;
            renderChrome();
        }

        function renderChrome() {
            if (!root) {
                return;
            }
            const open = state !== SEARCH_STATES.CLOSED;
            root.hidden = !open;
            root.setAttribute("aria-hidden", open ? "false" : "true");
            if (trigger) {
                trigger.setAttribute("aria-expanded", open ? "true" : "false");
            }
            if (statusEl) {
                statusEl.textContent = statusMessageForState();
                statusEl.dataset.state = state;
            }
            if (resultsEl) {
                resultsEl.hidden =
                    state !== SEARCH_STATES.RESULTS && state !== SEARCH_STATES.SEARCHING;
            }
        }

        function statusMessageForState() {
            if (state === SEARCH_STATES.INDEXING) {
                return STATUS_MESSAGES.indexing;
            }
            if (state === SEARCH_STATES.SEARCHING) {
                return STATUS_MESSAGES.searching;
            }
            if (state === SEARCH_STATES.EMPTY) {
                return STATUS_MESSAGES.empty;
            }
            if (state === SEARCH_STATES.NO_RESULTS) {
                return STATUS_MESSAGES["no-results"];
            }
            if (state === SEARCH_STATES.ERROR) {
                return lastDiagnostic || STATUS_MESSAGES.error;
            }
            if (lastDiagnostic === "cache-rebuilt") {
                return STATUS_MESSAGES["cache-rebuilt"];
            }
            return "";
        }

        function renderResults() {
            if (!resultsEl || !global.LouSearchNavigation) {
                return;
            }
            resultsEl.innerHTML = "";
            hits.forEach(function (hit, index) {
                const li = document.createElement("li");
                li.className = "local-search-result";
                li.setAttribute("role", "option");
                li.tabIndex = -1;
                li.dataset.index = String(index);
                if (index === selectedIndex) {
                    li.classList.add("is-selected");
                    li.setAttribute("aria-selected", "true");
                } else {
                    li.setAttribute("aria-selected", "false");
                }

                const viewLabel = document.createElement("span");
                viewLabel.className = "local-search-result-view";
                viewLabel.textContent = getViewLabel(hit.viewId);

                const snippet = document.createElement("span");
                snippet.className = "local-search-result-snippet";
                snippet.innerHTML = global.LouSearchNavigation.renderSnippetHtml(
                    hit.snippet,
                    hit.snippetMatchRanges
                );

                const meta = document.createElement("span");
                meta.className = "local-search-result-meta";
                meta.textContent = [hit.unitType, hit.unitId].filter(Boolean).join(" · ");

                li.appendChild(viewLabel);
                li.appendChild(snippet);
                li.appendChild(meta);

                li.addEventListener("click", function () {
                    void selectHit(index);
                });

                resultsEl.appendChild(li);
            });
        }

        function clearDebounce() {
            if (debounceTimer) {
                clearTimeout(debounceTimer);
                debounceTimer = null;
            }
        }

        async function ensureSearchIndex() {
            if (indexReady) {
                return true;
            }
            setState(SEARCH_STATES.INDEXING);
            try {
                const result = await runtime.ensureIndex({ releaseId: releaseId });
                indexReady = result.ok;
                if (!result.ok) {
                    lastDiagnostic = mapRuntimeFailure(result.diagnostics);
                    setState(SEARCH_STATES.ERROR);
                    return false;
                }
                if (result.cacheStatus === "rebuilt") {
                    lastDiagnostic = "cache-rebuilt";
                }
                return true;
            } catch (_err) {
                lastDiagnostic = STATUS_MESSAGES.error;
                setState(SEARCH_STATES.ERROR);
                return false;
            }
        }

        function mapRuntimeFailure(diagnostics) {
            const list = Array.isArray(diagnostics) ? diagnostics : [];
            if (list.some(function (d) {
                return d === "LS-SCOPE-REFUSED" || d === "LS-RUNTIME-RELEASE-NOT-OPEN";
            })) {
                return "Release incohérente pour la recherche.";
            }
            return STATUS_MESSAGES.error;
        }

        function queryTooShort(raw) {
            const trimmed = String(raw || "").trim();
            return trimmed.length < 2;
        }

        async function runSearch(rawQuery) {
            const query = String(rawQuery || "").trim();
            clearDebounce();

            if (global.LouSearchNavigation) {
                global.LouSearchNavigation.clearSearchHighlights(document);
            }

            if (queryTooShort(query)) {
                hits = [];
                selectedIndex = -1;
                renderResults();
                setState(query.length === 0 ? SEARCH_STATES.IDLE : SEARCH_STATES.EMPTY);
                return;
            }

            const generation = ++searchGeneration;
            setState(SEARCH_STATES.SEARCHING);

            const ready = await ensureSearchIndex();
            if (!ready || generation !== searchGeneration) {
                return;
            }

            try {
                const result = await runtime.search(query, { releaseId: releaseId });
                if (generation !== searchGeneration) {
                    return;
                }

                if (result.cacheStatus === "rebuilt") {
                    lastDiagnostic = "cache-rebuilt";
                }

                hits = Array.isArray(result.hits) ? result.hits.slice() : [];
                selectedIndex = hits.length ? 0 : -1;
                renderResults();

                if (!hits.length) {
                    const diagnostics = result.diagnostics || [];
                    if (diagnostics.indexOf("LS-QUERY-TOO-SHORT") >= 0) {
                        setState(SEARCH_STATES.EMPTY);
                    } else if (diagnostics.some(function (d) {
                        return d.indexOf("LS-RUNTIME") === 0 || d === "LS-SCOPE-REFUSED";
                    })) {
                        lastDiagnostic = mapRuntimeFailure(diagnostics);
                        setState(SEARCH_STATES.ERROR);
                    } else {
                        setState(SEARCH_STATES.NO_RESULTS);
                    }
                    return;
                }

                setState(SEARCH_STATES.RESULTS);
            } catch (_err) {
                if (generation !== searchGeneration) {
                    return;
                }
                lastDiagnostic = STATUS_MESSAGES.error;
                hits = [];
                selectedIndex = -1;
                renderResults();
                setState(SEARCH_STATES.ERROR);
            }
        }

        function scheduleSearch(rawQuery) {
            clearDebounce();
            debounceTimer = setTimeout(function () {
                runSearch(rawQuery);
            }, debounceMs);
        }

        async function selectHit(index) {
            if (index < 0 || index >= hits.length) {
                return;
            }
            selectedIndex = index;
            renderResults();
            const hit = hits[index];
            if (!global.LouSearchNavigation) {
                return;
            }

            const navResult = await global.LouSearchNavigation.navigateToSearchHit(hit, {
                tabs: tabs,
                releaseId: releaseId,
                showTab: showTab,
                whenTabReady: whenTabReady,
                onDiagnostic: function (code) {
                    lastDiagnostic =
                        code === "LS-READER-ANCHOR-MISSING"
                            ? "Ancre introuvable dans la vue."
                            : code === "LS-READER-RELEASE-MISMATCH"
                              ? "Release incohérente pour la navigation."
                              : "Navigation impossible.";
                    if (statusEl) {
                        statusEl.textContent = lastDiagnostic;
                        statusEl.dataset.state = "navigation-error";
                    }
                },
            });

            if (!navResult.ok && statusEl) {
                statusEl.textContent =
                    lastDiagnostic ||
                    (navResult.code === "LS-READER-ANCHOR-MISSING"
                        ? "Ancre introuvable dans la vue."
                        : "Navigation impossible.");
                statusEl.dataset.state = "navigation-error";
            }
        }

        function moveSelection(delta) {
            if (!hits.length) {
                return;
            }
            if (selectedIndex < 0) {
                selectedIndex = 0;
            } else {
                selectedIndex = Math.max(
                    0,
                    Math.min(hits.length - 1, selectedIndex + delta)
                );
            }
            renderResults();
            const selected = resultsEl && resultsEl.querySelector(".is-selected");
            if (selected && typeof selected.scrollIntoView === "function") {
                selected.scrollIntoView({ block: "nearest" });
            }
        }

        function open() {
            if (!runtime || !releaseId) {
                return;
            }
            lastDiagnostic = null;
            if (input) {
                input.value = "";
            }
            hits = [];
            selectedIndex = -1;
            renderResults();
            if (indexReady) {
                setState(SEARCH_STATES.IDLE);
            } else {
                setState(SEARCH_STATES.INDEXING);
                ensureSearchIndex().then(function (ok) {
                    if (state === SEARCH_STATES.CLOSED) {
                        return;
                    }
                    setState(ok ? SEARCH_STATES.IDLE : SEARCH_STATES.ERROR);
                });
            }
            if (input) {
                input.focus();
            }
        }

        function close() {
            clearDebounce();
            searchGeneration += 1;
            hits = [];
            selectedIndex = -1;
            if (input) {
                input.value = "";
            }
            if (global.LouSearchNavigation) {
                global.LouSearchNavigation.clearSearchHighlights(document);
            }
            renderResults();
            setState(SEARCH_STATES.CLOSED);
            lastDiagnostic = null;
        }

        function toggle() {
            if (state === SEARCH_STATES.CLOSED) {
                open();
            } else {
                close();
            }
        }

        function onContextChange() {
            if (global.LouSearchNavigation) {
                global.LouSearchNavigation.clearSearchHighlights(document);
            }
        }

        function updateTabs(nextTabs) {
            tabs = nextTabs || [];
        }

        function bindEvents() {
            if (trigger) {
                trigger.hidden = false;
                trigger.addEventListener("click", function () {
                    toggle();
                });
            }

            if (input) {
                input.addEventListener("input", function () {
                    scheduleSearch(input.value);
                });
                input.addEventListener("keydown", function (event) {
                    if (event.key === "Escape") {
                        event.preventDefault();
                        close();
                        return;
                    }
                    if (event.key === "ArrowDown") {
                        event.preventDefault();
                        moveSelection(1);
                        return;
                    }
                    if (event.key === "ArrowUp") {
                        event.preventDefault();
                        moveSelection(-1);
                        return;
                    }
                    if (event.key === "Enter") {
                        event.preventDefault();
                        if (selectedIndex >= 0) {
                            selectHit(selectedIndex);
                        } else if (hits.length) {
                            selectHit(0);
                        }
                    }
                });
            }

            document.addEventListener("keydown", function (event) {
                const mod = event.metaKey || event.ctrlKey;
                if (mod && event.key.toLowerCase() === "k") {
                    event.preventDefault();
                    toggle();
                }
            });

            if (root) {
                root.addEventListener("click", function (event) {
                    if (event.target === root) {
                        close();
                    }
                });
            }
        }

        return {
            SEARCH_STATES: SEARCH_STATES,
            mount: function () {
                bindEvents();
                setState(SEARCH_STATES.CLOSED);
            },
            open: open,
            close: close,
            toggle: toggle,
            runSearch: runSearch,
            selectHit: selectHit,
            onContextChange: onContextChange,
            updateTabs: updateTabs,
            getState: function () {
                return state;
            },
            getHits: function () {
                return hits.slice();
            },
            getSelectedIndex: function () {
                return selectedIndex;
            },
        };
    }

    global.LouLocalSearchUI = {
        create: createLocalSearchUI,
        SEARCH_STATES: SEARCH_STATES,
    };
})(typeof window !== "undefined" ? window : globalThis);
