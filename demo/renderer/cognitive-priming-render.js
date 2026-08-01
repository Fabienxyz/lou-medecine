/**
 * Cognitive Priming Renderer (AP-E) — parse and DOM presentation only.
 * No fetch, no Blueprint, no medical derivation.
 */
window.LouCognitivePrimingRender = (function () {
    const COGNITIVE_PRIMING_SCHEMA_VERSION = 1;
    const AI_COMPLEMENT_BADGE_V1 =
        "Complément pédagogique (IA) — non issu du Collège";

    function isProfileStar(value) {
        return Number.isInteger(value) && value >= 1 && value <= 5;
    }

    function isNonEmptyString(value) {
        return typeof value === "string" && value.trim().length > 0;
    }

    function isValidInterEdn(value) {
        return (
            value === undefined ||
            value === null ||
            (Array.isArray(value) && value.length === 0)
        );
    }

    function escapeHtml(text) {
        return String(text)
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;");
    }

    function buildStars(count) {
        let html = "";
        for (let i = 1; i <= 5; i += 1) {
            html +=
                '<span class="cp-star' +
                (i <= count ? " cp-star--filled" : "") +
                '" aria-hidden="true">' +
                (i <= count ? "★" : "☆") +
                "</span>";
        }
        return html;
    }

    /**
     * @param {string} jsonText
     * @returns {{ ok: true, record: Record<string, unknown> } | { ok: false, code: string, message: string, diagnostics: string[] }}
     */
    function parseCognitivePrimingArtifact(jsonText) {
        /** @type {string[]} */
        const diagnostics = [];

        if (typeof jsonText !== "string" || !jsonText.trim()) {
            return {
                ok: false,
                code: "parse",
                message: "Empty cognitive priming artefact",
                diagnostics: ["CP-RENDER-PARSE: empty body"],
            };
        }

        /** @type {unknown} */
        let parsed;
        try {
            parsed = JSON.parse(jsonText);
        } catch (err) {
            return {
                ok: false,
                code: "parse",
                message: "Invalid cognitive priming JSON",
                diagnostics: ["CP-RENDER-PARSE: " + (err && err.message ? err.message : "syntax error")],
            };
        }

        if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
            return {
                ok: false,
                code: "parse",
                message: "Invalid cognitive priming JSON",
                diagnostics: ["CP-RENDER-PARSE: root must be an object"],
            };
        }

        const record = /** @type {Record<string, unknown>} */ (parsed);

        if (record.schema_version !== COGNITIVE_PRIMING_SCHEMA_VERSION) {
            diagnostics.push("CP-RENDER-SCHEMA: schema_version must be 1");
            return {
                ok: false,
                code: "schema",
                message: "Unsupported cognitive priming schema version",
                diagnostics: diagnostics.slice(),
            };
        }

        if (!isNonEmptyString(record.chapter_id)) {
            diagnostics.push("CP-RENDER-PARSE: chapter_id required");
        }

        const profile = record.profile;
        if (!profile || typeof profile !== "object" || Array.isArray(profile)) {
            diagnostics.push("CP-RENDER-PARSE: profile object required");
        } else {
            if (!isProfileStar(profile.comprehension)) {
                diagnostics.push("CP-RENDER-PARSE: profile.comprehension must be integer 1–5");
            }
            if (!isProfileStar(profile.memorization)) {
                diagnostics.push("CP-RENDER-PARSE: profile.memorization must be integer 1–5");
            }
        }

        const prerequisites = record.prerequisites;
        if (
            !prerequisites ||
            typeof prerequisites !== "object" ||
            Array.isArray(prerequisites)
        ) {
            diagnostics.push("CP-RENDER-PARSE: prerequisites object required");
        } else {
            if (!isValidInterEdn(prerequisites.inter_edn)) {
                diagnostics.push("CP-RENDER-PARSE: prerequisites.inter_edn must be absent or empty");
            }

            const ednRefs = prerequisites.edn_references;
            if (!Array.isArray(ednRefs)) {
                diagnostics.push("CP-RENDER-PARSE: prerequisites.edn_references must be an array");
            } else {
                ednRefs.forEach(function (ref, index) {
                    if (!ref || typeof ref !== "object" || Array.isArray(ref)) {
                        diagnostics.push(
                            "CP-RENDER-PARSE: edn_references[" + index + "] must be an object"
                        );
                        return;
                    }
                    for (const key of ["reference_id", "chapter_id", "label"]) {
                        if (!isNonEmptyString(ref[key])) {
                            diagnostics.push(
                                "CP-RENDER-PARSE: edn_references[" + index + "]." + key + " required"
                            );
                        }
                    }
                });
            }

            const aiComplements = prerequisites.ai_complements;
            if (!Array.isArray(aiComplements)) {
                diagnostics.push("CP-RENDER-PARSE: prerequisites.ai_complements must be an array");
            } else {
                for (let index = 0; index < aiComplements.length; index += 1) {
                    const item = aiComplements[index];
                    if (!item || typeof item !== "object" || Array.isArray(item)) {
                        diagnostics.push(
                            "CP-RENDER-PARSE: ai_complements[" + index + "] must be an object"
                        );
                        continue;
                    }
                    if (!isNonEmptyString(item.complement_id)) {
                        diagnostics.push(
                            "CP-RENDER-PARSE: ai_complements[" + index + "].complement_id required"
                        );
                    }
                    if (!isNonEmptyString(item.sentence)) {
                        diagnostics.push(
                            "CP-RENDER-PARSE: ai_complements[" + index + "].sentence required"
                        );
                    }
                    if (item.badge !== AI_COMPLEMENT_BADGE_V1) {
                        diagnostics.push(
                            "CP-RENDER-BADGE: ai_complements[" + index + "].badge invalid"
                        );
                        return {
                            ok: false,
                            code: "badge",
                            message: "Invalid AI complement badge in cognitive priming artefact",
                            diagnostics: diagnostics.slice(),
                        };
                    }
                }
            }
        }

        const summary = record.summary;
        if (!summary || typeof summary !== "object" || Array.isArray(summary)) {
            diagnostics.push("CP-RENDER-PARSE: summary object required");
        } else if (!Array.isArray(summary.bullets)) {
            diagnostics.push("CP-RENDER-PARSE: summary.bullets must be an array");
        } else if (!summary.bullets.some(function (b) { return isNonEmptyString(b); })) {
            diagnostics.push("CP-RENDER-PARSE: summary.bullets must contain at least one non-empty string");
        }

        if (diagnostics.length > 0) {
            return {
                ok: false,
                code: "parse",
                message: "Invalid cognitive priming artefact structure",
                diagnostics: diagnostics.slice(),
            };
        }

        return { ok: true, record: record };
    }

    /**
     * @param {string} chapterId
     * @param {{ getActiveRelease?: (chapter: string) => Promise<unknown> } | null | undefined} packageAccess
     * @returns {Promise<{ navigable: boolean, releaseId?: string, reason?: string }>}
     */
    async function resolveEdnReferenceNavigability(chapterId, packageAccess) {
        if (!packageAccess || typeof packageAccess.getActiveRelease !== "function") {
            return { navigable: false, reason: "no_catalog" };
        }
        try {
            const release = await packageAccess.getActiveRelease(chapterId);
            const releaseId =
                release && typeof release === "object" && release.release_id
                    ? String(release.release_id)
                    : release && typeof release === "object" && release.releaseId
                      ? String(release.releaseId)
                      : undefined;
            return { navigable: true, releaseId: releaseId };
        } catch (err) {
            const code =
                err && typeof err === "object" && "code" in err
                    ? String(err.code)
                    : "unknown";
            return { navigable: false, reason: code };
        }
    }

    /**
     * @param {HTMLElement} container
     * @param {Record<string, unknown>} record
     * @param {{
     *   chapterTitle?: string,
     *   manifestChapter?: string,
     *   packageAccess?: { getActiveRelease?: (chapter: string) => Promise<unknown> } | null,
     *   onEdnNavigate?: ((chapterId: string, referenceId: string) => void) | null,
     *   document?: Document,
     * }} context
     */
    async function renderCognitivePriming(container, record, context) {
        context = context || {};
        const doc = context.document || container.ownerDocument;
        const profile = /** @type {{ comprehension: number, memorization: number }} */ (
            record.profile
        );
        const prerequisites = /** @type {Record<string, unknown>} */ (record.prerequisites);
        const summary = /** @type {{ bullets: string[] }} */ (record.summary);

        container.innerHTML = "";

        if (context.chapterTitle) {
            const header = doc.createElement("header");
            header.className = "cp-header";
            const title = doc.createElement("h2");
            title.className = "cp-title";
            title.textContent = String(context.chapterTitle);
            header.appendChild(title);
            container.appendChild(header);
        }

        const profileSection = doc.createElement("section");
        profileSection.className = "cp-profile";
        profileSection.innerHTML =
            '<h3 class="cp-section-title">Profil du chapitre</h3>' +
            '<p class="cp-profile-hint">Repères pédagogiques</p>' +
            '<div class="cp-profile-row">' +
            '<span class="cp-profile-label">Compréhension</span>' +
            '<span class="cp-stars" aria-label="Compréhension ' +
            profile.comprehension +
            ' sur 5">' +
            buildStars(profile.comprehension) +
            "</span></div>" +
            '<div class="cp-profile-row">' +
            '<span class="cp-profile-label">Mémorisation</span>' +
            '<span class="cp-stars" aria-label="Mémorisation ' +
            profile.memorization +
            ' sur 5">' +
            buildStars(profile.memorization) +
            "</span></div>";
        container.appendChild(profileSection);

        const prereqSection = doc.createElement("section");
        prereqSection.className = "cp-prereq";
        prereqSection.innerHTML = '<h3 class="cp-section-title">Pré-requis</h3>';

        const ednRefs = Array.isArray(prerequisites.edn_references)
            ? prerequisites.edn_references
            : [];
        if (ednRefs.length > 0) {
            const ednList = doc.createElement("ul");
            ednList.className = "cp-edn-list";
            for (let i = 0; i < ednRefs.length; i += 1) {
                const ref = ednRefs[i];
                const li = doc.createElement("li");
                const nav = await resolveEdnReferenceNavigability(
                    String(ref.chapter_id),
                    context.packageAccess || null
                );
                let labelText = String(ref.label);
                if (isNonEmptyString(ref.item_label)) {
                    labelText += " (" + String(ref.item_label) + ")";
                }
                if (nav.navigable) {
                    const btn = doc.createElement("button");
                    btn.type = "button";
                    btn.className = "cp-edn-ref cp-edn-ref--navigable";
                    btn.textContent = labelText;
                    btn.setAttribute("data-chapter-id", String(ref.chapter_id));
                    btn.setAttribute("data-reference-id", String(ref.reference_id));
                    if (context.onEdnNavigate) {
                        btn.addEventListener("click", function () {
                            context.onEdnNavigate(
                                String(ref.chapter_id),
                                String(ref.reference_id)
                            );
                        });
                    }
                    li.appendChild(btn);
                } else {
                    const span = doc.createElement("span");
                    span.className = "cp-edn-ref cp-edn-ref--unavailable";
                    span.textContent = labelText + " (non disponible)";
                    li.appendChild(span);
                }
                ednList.appendChild(li);
            }
            prereqSection.appendChild(ednList);
        }

        const aiComplements = Array.isArray(prerequisites.ai_complements)
            ? prerequisites.ai_complements
            : [];
        if (aiComplements.length > 0) {
            const aiList = doc.createElement("ul");
            aiList.className = "cp-ai-list";
            aiComplements.forEach(function (item) {
                const li = doc.createElement("li");
                li.className = "cp-ai-complement";
                li.innerHTML =
                    '<span class="cp-ai-badge">' +
                    escapeHtml(String(item.badge)) +
                    "</span>" +
                    '<span class="cp-ai-sentence">' +
                    escapeHtml(String(item.sentence)) +
                    "</span>";
                aiList.appendChild(li);
            });
            prereqSection.appendChild(aiList);
        }

        container.appendChild(prereqSection);

        const summarySection = doc.createElement("section");
        summarySection.className = "cp-summary";
        summarySection.innerHTML = '<h3 class="cp-section-title">Résumé du chapitre</h3>';
        const bulletList = doc.createElement("ul");
        bulletList.className = "cp-summary-list";
        summary.bullets.forEach(function (bullet) {
            if (!isNonEmptyString(bullet)) {
                return;
            }
            const li = doc.createElement("li");
            li.textContent = bullet;
            bulletList.appendChild(li);
        });
        summarySection.appendChild(bulletList);
        container.appendChild(summarySection);

        if (
            context.manifestChapter &&
            record.chapter_id &&
            record.chapter_id !== context.manifestChapter
        ) {
            const mismatch = doc.createElement("p");
            mismatch.className = "cp-chapter-mismatch";
            mismatch.setAttribute("role", "status");
            mismatch.textContent =
                "Attention : l'identité chapitre de l'artefact ne correspond pas à la Release ouverte.";
            container.insertBefore(mismatch, container.firstChild);
        }
    }

    return {
        COGNITIVE_PRIMING_SCHEMA_VERSION: COGNITIVE_PRIMING_SCHEMA_VERSION,
        AI_COMPLEMENT_BADGE_V1: AI_COMPLEMENT_BADGE_V1,
        parseCognitivePrimingArtifact: parseCognitivePrimingArtifact,
        resolveEdnReferenceNavigability: resolveEdnReferenceNavigability,
        renderCognitivePriming: renderCognitivePriming,
    };
})();
