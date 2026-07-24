# Architecture Audit — Lou Learning Companion

> Read-only forensic audit. No repository files were modified, renamed, moved, or deleted in the course of this audit; only this file was created.
>
> Reference chapter: **Item 234 — Insuffisance cardiaque** (`cardio/234-insuffisance-cardiaque`).
> Item 221 and `demo/legacy/` are treated as historical prototypes.
>
> Method: every claim below is grounded in file contents and paths read directly from the repository at the "Checkpoint before Fable architecture audit" commit (`12e33d8`). Status checkboxes, `Progress: ✅ 100%` banners, and "Consistent with the storyboard" claims inside generated files were **not** trusted; they were verified against actual dependencies.

---

## 1. Executive summary

The repository contains **two loosely-coupled things wearing one name**:

1. **An aspirational methodology corpus** — the root docs (`README.md`, `MASTER_CONTEXT.md`, `START_HERE.md`, `CURRENT_PRIORITIES.md`), `00-foundation/`, and `05-research/`. These describe a research-first, *paragraph-level* pedagogical method and repeatedly state the project is still "designing the workflow… before building the software."

2. **A working chapter-level content-generation pipeline** — everything under `01-learning/templates/` (prompts + templates + visual system) plus the `demo/renderer/` app. This pipeline actually operates at *chapter* granularity, not paragraph granularity, and has already produced a full asset set for Item 234.

The intended flow (Official College → Coverage → Storyboard → Learning assets → SVG assets → Renderer → Learner) exists **only partially and is broken at three joints**:

- **Storyboard is not actually upstream.** The Item 234 `storyboard.md` is an *unfilled template* (placeholders `Module 1 — <Title>`), yet five complete learning assets and 61 SVGs were generated anyway. The assets were derived from `official-college.md` + `coverage.md` (and, for the SVGs, from the assets themselves), not from a storyboard. Coverage and Storyboard are therefore only *nominally* upstream.
- **The assets → SVG link is a naming convention only.** The generated Markdown assets contain **no `[[SVG:…]]` placeholders** (the mechanism the templates and prompts define). Diagrams are matched to prose purely by ordinal filename (`mechanism-01.svg` ↔ 1st `##` in `mecanismes.md`).
- **The renderer consumes almost none of what the pipeline produced.** `demo/renderer/config.js` marks only `histoire` as implemented; `vue-ensemble`, `acteurs`, and `pret` are `implemented: false` (they render a "Content not yet implemented." placeholder despite existing and being marked 100% done). There is **no tab for `mecanismes`** at all — the single largest asset (24 mechanisms). The renderer never loads any file from `figures/`, so all 61 SVGs are currently unreachable through the UI.

What is genuinely solid: the `official-college.md` source-fidelity discipline, a thorough `coverage.md` knowledge inventory, the medical quality of the five generated Item 234 assets, a complete and internally coherent visual system (`design-system.md` + `diagram-template.svg`), and a clean, chapter-agnostic renderer shell.

A prior self-audit already exists at `01-learning/generated-assets/cardio/234-insuffisance-cardiaque/svg-generation-review.md`. It is a valuable artifact but **partially stale**: at least two of its "Critical" findings (incomplete Design System; two conflicting style-guide files) no longer match the repository, because later commits completed `design-system.md` and renamed the duplicate style guide.

---

## 2. Repository map

```
lou-medecine/
├── README.md, MASTER_CONTEXT.md, START_HERE.md, CURRENT_PRIORITIES.md   ← project framing (aspirational)
├── 00-foundation/            vision.md, principles.md, README.md         ← immutable principles
├── 01-learning/              ← THE ACTUAL PIPELINE lives here
│   ├── README.md, learning-workflow.md, learning-assets.md,
│   │   pedagogical-strategies.md, paragraph-analysis-template.md
│   ├── paragraph-analysis/   cardio-221-001.md                          ← 1 paragraph analysis (221 only)
│   ├── chapter-analysis/
│   │   └── cardio/
│   │       ├── 221-atherome/       chapter.md, coverage.md(1 line), storyboard.md(1 line)
│   │       └── 234-insuffisance-cardiaque/
│   │           ├── official-college.md   ← AUTHORITATIVE SOURCE (1352 lines)
│   │           ├── coverage.md           ← filled inventory (0% checkboxes)
│   │           ├── coverage-v0.md        ← stale older coverage (849 lines)
│   │           └── storyboard.md         ← UNFILLED TEMPLATE (placeholders)
│   ├── generated-assets/
│   │   └── cardio/
│   │       ├── 221-atherome/       histoire/vue-ensemble/mechanismes/acteurs/pret .md
│   │       └── 234-insuffisance-cardiaque/
│   │           ├── histoire.md vue-ensemble.md mecanismes.md acteurs.md pret.md
│   │           ├── svg-generation-review.md   ← prior self-audit (partly stale)
│   │           └── figures/  overview.svg + mechanism-01..24.svg + actor-01..36.svg (61 files)
│   ├── templates/
│   │   ├── coverage-template.md storyboard-template.md
│   │   ├── histoire/vue-ensemble/mecanismes/acteurs/pret -template.md
│   │   ├── design-system.md              ← visual SoT (complete)
│   │   ├── svg-style-guide-draft.md      ← design-system extraction from legacy (draft)
│   │   ├── svg/ diagram-template.svg svg-style-guide.md svg-patterns.md
│   │   └── prompt/ generate-{coverage,storyboard,histoire,vue-ensemble,
│   │       mecanismes,acteurs,pret,svg}.md + 2 temp-prompt-cursor-*.md
│   └── validation/ lou-feedback.md (empty)
├── 02-product/ 03-architecture/ 04-decisions-adr/   ← README stubs (7 lines each)
├── 05-research/    RESEARCH_*, PATTERNS.md, learning-profile/*, HYPOTHESES.md(empty), OBSERVATIONS.md(empty)
├── demo/
│   ├── README.md (empty), legacy/README.md (empty)
│   ├── legacy/221/  index.html, app.js         ← hardcoded HTML prototype (visual origin)
│   ├── legacy/assets/svg/cardio-221-overview.svg
│   └── renderer/   index.html config.js app.js renderer.js markdown.js styles.css
│                   README.md package.json lib/marked.min.js node_modules/ (gitignored)
└── playground/ README.md
```

Working tree is **clean** (`git status` empty); everything is committed. `node_modules/`, `.DS_Store`, `.vscode/`, `.cursor/` are in `.gitignore`.

---

## 3. Actual end-to-end architecture (as built)

### 3.1 What the documents *say* the flow is

- `demo/renderer/README.md` states the renderer "displays markdown files produced by the learning pipeline under `01-learning/generated-assets/`."
- `01-learning/templates/prompt/temp-prompt-cursor-pourgenerer5assets.md` documents the canonical chain: `official-college.md` + `coverage.md` + `storyboard.md` → per-asset prompt/template pair → five assets in `generated-assets/<specialty>/<chapter>/`.
- `01-learning/templates/prompt/generate-svg.md` then turns the assets into SVGs.

### 3.2 What actually happens (verified)

```
official-college.md  ──(generate-coverage.md + coverage-template.md)──▶  coverage.md
        │                                                                    │
        │                                                                    ▼
        │                                            storyboard.md  ◀── generate-storyboard.md
        │                                            (234: LEFT EMPTY / template only)
        │                                                                    ┆ (link not exercised)
        ▼                                                                    ┆
   5 asset prompts (generate-histoire/vue-ensemble/mecanismes/acteurs/pret)  ┆
   + 5 asset templates  ─────────────────────────────────────────────────▶  histoire.md
        (inputs claim official-college + coverage + storyboard;              vue-ensemble.md
         storyboard was empty, so effectively college + coverage)            mecanismes.md
                                                                             acteurs.md
                                                                             pret.md
                                        │
                                        ▼
                        generate-svg.md (reads the assets)  ──▶  figures/overview.svg,
                                                                 mechanism-01..24.svg,
                                                                 actor-01..36.svg
                                        │
                                        ▼
                        demo/renderer  ──▶  renders ONLY histoire.md
                                            (vue-ensemble/acteurs/pret = placeholder;
                                             mecanismes = no tab; figures = never loaded)
```

The pipeline is **prompt-driven and manual**: there is no code that orchestrates generation. Each stage is a Markdown prompt intended to be pasted into an assistant (Cursor). The only executable code in the whole repository is the static renderer (`demo/renderer/*.js`) and its vendored `marked` parser.

Granularity mismatch worth flagging: `00-foundation/` and `01-learning/README.md`, `learning-workflow.md`, `paragraph-analysis-template.md` describe a **paragraph-level** method ("Transform an official EDN *paragraph*…"). The pipeline that actually produced Item 234 is **chapter-level** (one coverage, one storyboard, five whole-chapter assets). The paragraph method survives only as `01-learning/paragraph-analysis/cardio-221-001.md` (a single 221 paragraph).

---

## 4. Item 234 lineage (end-to-end trace)

| Stage | File | State | Evidence / notes |
|---|---|---|---|
| Official source | `chapter-analysis/cardio/234-insuffisance-cardiaque/official-college.md` | Authoritative, faithful, but with OCR/paste artifacts | 1352 lines. The "Hiérarchisation des connaissances" table (lines ~45–203) is scrambled during extraction (e.g. `rdiographique` line 131, `Encadre` without accent line 775). Body prose is intact. |
| Coverage | `…/234-…/coverage.md` | Filled, thorough, **checkboxes all ⬜ 0%** | 13 major sections + ~88 knowledge-unit rows. `Progress` still shows `⬜ 0%` and `- [ ] …` — i.e. the audit was performed but never "closed". |
| Coverage (stale) | `…/234-…/coverage-v0.md` | Superseded duplicate | 849 lines, older/longer variant. No file references it. Residue. |
| Storyboard | `…/234-…/storyboard.md` | **UNFILLED TEMPLATE** | 125 lines of placeholders: `## Module 1 — <Title>`, `### Goal / What should the learner understand…`, empty `Asset inventory` table. No chapter content whatsoever. |
| Asset — story | `generated-assets/…/234-…/histoire.md` | Complete, high quality | "La ville et sa pompe" pump analogy; marked `✅ 100%` and "The story follows the storyboard" — **untrue**, no storyboard content exists. |
| Asset — overview | `…/vue-ensemble.md` | Complete | Contains a **fenced ASCII diagram** (```text …```), **not** the `[[SVG:overview]]` marker its template prescribes. |
| Asset — mechanisms | `…/mecanismes.md` | Complete, 24 mechanisms | 370 lines, `## 1 … ## 24`. No `[[SVG:mechanism-NN]]` markers. |
| Asset — actors | `…/acteurs.md` | Complete, 36 actors | 328 lines, `## <name>` × 36. No `[[SVG:actor-NN]]` markers. |
| Asset — readiness | `…/pret.md` | Complete | 35 self-check questions across 6 "Niveaux". |
| Figures | `…/figures/overview.svg`, `mechanism-01..24.svg`, `actor-01..36.svg` | 61 valid SVGs | `figures/mechanism-01.svg` confirmed: composed from `diagram-template.svg` classes/defs, white `#FFFFFF` background, ordinal title "Mécanisme 1". |
| Self-audit | `…/svg-generation-review.md` | Present, partly stale | Dated 2026-07-06; documents 18 issues (see §12). |
| Render | `demo/renderer` | Only `histoire.md` reaches the learner | See §9. |

**Lineage verdict:** the source→coverage→assets→SVG chain is real and traceable for Item 234, but the **storyboard node is bypassed**, the asset→SVG edge is a filename convention, and the asset→renderer edge is mostly disconnected.

---

## 5. Sources of truth and dependency graph

### 5.1 Declared sources of truth

- **Medical SoT:** `official-college.md` (asserted everywhere: `00-foundation/principles.md` §1, every `generate-*.md`).
- **Completeness ledger:** `coverage.md` (`generate-storyboard.md`: "Coverage.md is the production checklist").
- **Pedagogical SoT:** `storyboard.md` (`storyboard-template.md`: "the single source used to generate all learning assets").
- **Visual SoT:** `design-system.md` ("single source of truth for every learner-facing visual asset"), with `svg/diagram-template.svg` as the component library and `svg/svg-patterns.md` / `svg/svg-style-guide.md` as rules.

### 5.2 Dependency reality

| Consumer | Declared inputs | Actually present / used |
|---|---|---|
| `coverage.md` | official-college.md, coverage-template.md | ✅ both present |
| `storyboard.md` | official-college.md, coverage.md, storyboard-template.md | ⚠️ never produced for 234 (template left blank) |
| 5 asset files | official-college.md, coverage.md, **storyboard.md**, template | ⚠️ storyboard empty → effectively college + coverage only |
| 61 SVGs | assets + design-system.md + svg-style-guide.md + svg-patterns.md + diagram-template.svg | ✅ visually consistent with `diagram-template.svg`; colour SoT ambiguous (see §7/§12) |
| renderer | `generated-assets/<chapter>/<file>.md` via `config.TABS` | ⚠️ only `histoire.md`; ignores `figures/` |

**Conflict of authority for SVG colour:** `svg/svg-style-guide.md` (lines ~129–139) says "Use only colours defined in `design-system.md`." `design-system.md` is now complete and does contain colour tables (lines 86–136). But `diagram-template.svg` hard-codes its own hex palette in a `<style>` block, and the generated SVGs copied *those* values. So in practice the **component template**, not the design system, was the effective colour source.

---

## 6. Prompt / template / generation architecture

**Two parallel families of files, cleanly separated:**

- **Templates** (`templates/*-template.md`): the output skeletons. Each learner-facing template (`histoire`, `vue-ensemble`, `mecanismes`, `acteurs`, `pret`) opens with a `> Purpose` blockquote, a `# Progress` checklist, and closes with `# Final validation` + `# Notes`.
- **Prompts** (`templates/prompt/generate-*.md`): the instructions that fill a template from sources.

Both families are well-written, consistent in tone, and enforce the fidelity principles. Issues are structural, not editorial:

1. **Templates leak scaffolding into learner output.** The generated assets faithfully kept the `> Purpose`, `# Progress`, `# Final validation`, and `# Notes` sections (visible in `histoire.md`, `mecanismes.md`, etc.). Because the renderer runs the *entire* file through `marked` (`demo/renderer/markdown.js`), all of this internal scaffolding would be shown to the learner. The templates say the file "is the final learning content, not a design document," yet they embed design-document furniture.

2. **`[[SVG:…]]` marker contract is defined but unfulfilled.** `vue-ensemble-template.md` (`[[SVG:overview]]`), `mecanismes-template.md` (`[[SVG:mechanism-XX]]`), `acteurs-template.md` (`[[SVG:actor-XX]]`), and prompts `generate-vue-ensemble.md`/`-mecanismes.md`/`-acteurs.md` all mandate keeping these markers. The **actual generated assets contain none of them** — `vue-ensemble.md` substituted a fenced ASCII diagram instead. Nothing (asset, renderer) currently honours the marker.

3. **Two irreconcilable storyboard schemas.**
   - `templates/storyboard-template.md` is organised as `Histoire → Vue d'ensemble → Mécanismes → Acteurs → Suis-je prêt ?` (i.e. one section per downstream asset).
   - `chapter-analysis/…/234-…/storyboard.md` is organised as `Module 1/2/3 → Final mental model → Asset inventory`.
   These are different documents claiming the same role. The 221 `storyboard.md` is a 1-line stub, so neither schema has ever been exercised on real content.

4. **Temp prompts are committed and path-drifted.**
   - `temp-prompt-cursor-pour-coverage.md` (note the **trailing space** in the filename) references `../../../templates/prompts/generate-coverage.md` — **`prompts` (plural)**, but the directory is `prompt` (singular). Broken path.
   - `temp-prompt-cursor-pourgenerer5assets.md` is a batch generator for exactly `cardio/234-insuffisance-cardiaque`; it hard-codes the chapter and asserts "This architecture is approved. Do not modify it." It is the most likely instrument that actually produced the five 234 assets, but this cannot be confirmed from evidence (see §13).

5. **`pret` question vs competency contradiction.** `storyboard-template.md` §5 says "Do not generate questions. Describe only the expected competencies." `pret-template.md` and `generate-pret.md` instead ask for reasoning questions, and `pret.md` contains 35 questions. Minor, but a real spec conflict.

---

## 7. SVG architecture

**Component model (solid):** `templates/svg/diagram-template.svg` is a single 245-line "component library" — a showcase SVG with `<defs>` (shadow filter, arrowhead marker, typography `<style>`) and labelled component groups (`component-title-block`, `component-card-medium`, `component-card-highlight`, `component-branch-connector`, `component-outcome-card`, `component-summary-card`, …). Its header comments say it is derived from `demo/legacy/assets/svg/cardio-221-overview.svg` and is "Approved". The generated figures reuse this exact language (verified in `figures/mechanism-01.svg`: identical `<defs>`, class names, palette, card grammar).

**Specification stack:**
- `svg/svg-patterns.md` — 9 diagram patterns (process flow, cause→consequence, comparison, decision tree, hierarchy, feedback loop, timeline, anatomy, actor card).
- `svg/svg-style-guide.md` — technical/XML/accessibility rules.
- `design-system.md` — colours/typography/spacing.
- `generate-svg.md` — the generator prompt.

**Confirmed disconnects:**

1. **Output path mismatch.** `generate-svg.md` (Output section, lines ~317–335) says save to `generated-assets/overview.svg`, `mechanism-01.svg`, … (chapter-root). Reality: everything is under `generated-assets/cardio/234-…/figures/`. The prompt and the on-disk convention disagree.
2. **No prose↔diagram binding.** With no `[[SVG:…]]` markers in the assets, the only link between `mecanismes.md` §N and `mechanism-NN.svg` is ordinal position — brittle and undocumented in the assets themselves.
3. **Colour SoT ambiguity** (see §5.2): style guide points to `design-system.md`; generator used `diagram-template.svg`.
4. **`svg-style-guide-draft.md` is a misleading sibling.** Despite the name, `templates/svg-style-guide-draft.md` is not a draft of `svg/svg-style-guide.md`; it is a *visual design-system extraction* from the legacy prototype (573 lines, overlaps heavily with `design-system.md`). It closes with "Draft status … Not yet approved as final `svg-style-guide.md`." So the repository has three overlapping visual-language documents (`design-system.md`, `svg-style-guide-draft.md`, `svg/svg-style-guide.md`) with unclear precedence.
5. **`svg-generation-review.md` is partly stale.** Its issue #1 ("Design System is incomplete… placeholder text `(keep the existing colour tables)`") does not match the current `design-system.md`, which contains full colour/type/spacing tables. Its issue #2 ("two conflicting `svg-style-guide.md`") no longer holds: only one `svg-style-guide.md` exists (`templates/svg/`); the root duplicate was renamed to `svg-style-guide-draft.md`. Issue #3 (expected `templates/svg/design-system.md`) is a genuine path question — the file lives at `templates/design-system.md`. Issues #4–#8 (output path, missing storyboard, absent placeholders, no md↔svg mapping) remain valid.

**SVG technical quality (spot-check):** `figures/mechanism-01.svg` is well-formed, has `role="img"`, `<title>`, `<desc>`, `viewBox`, self-contained `<defs>`, and a white background `<rect>`. The review's claim of `xmllint`-clean, accessible, self-contained SVGs is credible.

---

## 8. Does the SVG system connect assets → design system → figures → renderer?

Partly.

- assets → figures: **yes at generation time** (a human/LLM read the assets and hand-composed figures), **no at data-model time** (no markers, no manifest, ordinal-only).
- design system → figures: **yes visually** (via `diagram-template.svg`), with the colour-SoT caveat above.
- figures → renderer: **no**. Nothing in `demo/renderer/` references `figures/`, resolves `[[SVG:…]]`, or injects `<img>`/inline SVG. The 61 figures are currently orphaned from the UI.

The only place a diagram is actually shown to a learner is the **legacy** prototype: `demo/legacy/221/app.js` hard-codes `<img src="assets/svg/cardio-221-overview.svg">`. The new renderer has no equivalent path.

---

## 9. Renderer architecture

**Design (clean and worth keeping):** `demo/renderer/` cleanly separates concerns — `config.js` (paths, tab registry, `sanitizeChapter`/`resolveAssetPath`), `renderer.js` (fetch, DOM injection, header-metadata hooks), `markdown.js` (thin `marked` wrapper), `app.js` (boot, tab UI). It is chapter-agnostic (`?chapter=cardio/234-insuffisance-cardiaque`), guards against path traversal (`sanitizeChapter` rejects `..` and leading `/`), and vendors `marked` offline (`lib/marked.min.js`, refreshed by `package.json` `postinstall`).

**What it actually consumes vs. what exists:**

`demo/renderer/config.js` `TABS`:

| Tab id | `file` | `implemented` | Matching asset on disk | Result |
|---|---|---|---|---|
| `histoire` | `histoire.md` | `true` | ✅ `histoire.md` | Renders |
| `pourquoi` | `null` | `false` | ✗ (no such asset in pipeline) | Placeholder; **legacy concept** |
| `vue-ensemble` | `vue-ensemble.md` | `false` | ✅ exists, `✅ 100%` | Placeholder ("Content not yet implemented.") |
| `acteurs` | `acteurs.md` | `false` | ✅ exists | Placeholder |
| `pret` | `pret.md` | `false` | ✅ exists | Placeholder |
| — | — | — | ✅ `mecanismes.md` (largest asset) | **No tab exists** |

**Findings:**

1. **The renderer under-serves the pipeline.** Four of five produced assets are either flagged not-implemented (`vue-ensemble`, `acteurs`, `pret`) or have no tab (`mecanismes`). Only `histoire` is live. So the "learner experience" today is one tab out of a five-asset chapter.
2. **Legacy `pourquoi` tab is residue.** The tab list mirrors the *legacy* 221 prototype (`demo/legacy/221/app.js` hard-codes pages `Histoire / Pourquoi ? / Vue d'ensemble / Les acteurs / Suis-je prêt ?`). The current pipeline replaced "Pourquoi ?" with "Mécanismes," but `config.js` still lists `pourquoi` (file `null`) and omits `mecanismes`. The tab registry was never migrated from prototype to pipeline.
3. **No SVG handling.** The renderer pipes raw Markdown through `marked` and injects the HTML. There is no `[[SVG:…]]` substitution and no image loading from `figures/`. Diagrams cannot appear.
4. **Scaffolding would render.** Because the whole file is parsed, a learner opening `histoire` would see the `> Purpose`, `Progress: ✅ 100%`, `Final validation` checklist, and `Notes` sections (§6.1).
5. **Header is inert.** `config.MANIFEST_FILENAME = "manifest.json"` and `renderer.applyHeaderMetadata` exist, but `app.js` `loadChapterMetadata` is a stub `return null`, and **no `manifest.json` exists for any chapter**. So `#specialty`, `#chapter-line`, etc. stay as literal `…` placeholders from `index.html`.

---

## 10. Implicit data model

There is no schema, manifest, or ID system anywhere; the model is entirely implicit in paths and ordinals.

- **Chapter identity:** `<specialty>/<itemNumber>-<slug>`, e.g. `cardio/234-insuffisance-cardiaque`. Used as the renderer `?chapter=` value and as the directory key under both `chapter-analysis/` and `generated-assets/`. This is the one stable, traceable identifier in the system.
- **Knowledge unit:** a free-text row in `coverage.md` §2 (~88 rows for 234). It has `Covered` and `Destination` columns intended to trace it downstream — **both are empty** for every row, so coverage → asset traceability is declared but never recorded.
- **Major section:** free-text rows in `coverage.md` §1 (13 for 234).
- **Mechanism:** ordinal `## N. <question>` in `mecanismes.md` (1–24) → `mechanism-NN.svg`. Identity = position.
- **Actor:** ordinal `## <name>` in `acteurs.md` (1–36) → `actor-NN.svg`. Identity = position.
- **Figure:** filename `overview.svg | mechanism-NN.svg | actor-NN.svg` under `figures/`.

**Stability/traceability assessment:** The chapter key is stable. Everything below it is **positional and fragile**: reordering, inserting, or deleting a mechanism/actor silently misaligns every subsequent `-NN.svg`. The `svg-generation-review.md` already caught a symptom of this (issue #10: step numbering skips when a mechanism starts with a branch). There are no back-references from figures to source knowledge units, so the `principles.md` §3 "complete traceability" requirement is **aspirational, not implemented** below the chapter level.

---

## 11. Legacy vs current

- `demo/legacy/221/` — a fully hard-coded single-file prototype (`app.js` holds five `pages[]` HTML string literals, including an inline `<img>` to the overview SVG). This is the **visual origin** of the entire project; `design-system.md`, `svg-style-guide-draft.md`, and `diagram-template.svg` all cite it as their source.
- `demo/legacy/assets/svg/cardio-221-overview.svg` — the seed diagram the component library was extracted from.
- `221-atherome` chapter files: `chapter.md` (181 lines, real), but `coverage.md` and `storyboard.md` are **1-line stubs**. The 221 `generated-assets` (histoire/vue-ensemble/**mechanismes**/acteurs/pret) exist and are substantive — but they predate and differ from the 234 convention.
- **Filename drift 221 vs 234:** `221-atherome/generated-assets/mechanismes.md` vs `234-…/mecanismes.md`. Two spellings of the same asset ("mechanismes" vs "mecanismes"). The prompts/templates use `mecanismes`; 221 is the outlier.

Per the audit brief, 221/legacy are historical. The only *current* dependency on legacy is documentary (the visual system's provenance) — no current pipeline file imports 221 content at runtime, except the renderer's stale `pourquoi` tab which is a legacy-shaped hole.

---

## 12. File integrity and repository hygiene

**Empty / stub files (committed):**
- `demo/README.md`, `demo/legacy/README.md` — 0 bytes.
- `05-research/HYPOTHESES.md`, `05-research/OBSERVATIONS.md` — 0 lines.
- `01-learning/validation/lou-feedback.md` — empty (1 blank line). This is notable: the whole project premise is "adapt to Lou," and the single validation/feedback file is empty.
- `01-learning/chapter-analysis/cardio/221-atherome/coverage.md` and `storyboard.md` — 1 line each (effectively empty).
- `02-product/`, `03-architecture/`, `04-decisions-adr/` READMEs — 7-line placeholders.

**Stale / duplicate:**
- `coverage-v0.md` (849 lines) alongside `coverage.md` (192 lines) in the 234 folder — superseded, unreferenced.
- `svg-style-guide-draft.md` overlaps `design-system.md` and `svg/svg-style-guide.md` (three visual-language docs).
- `svg-generation-review.md` — historically accurate but now partly contradicted by later commits (§7).

**Naming problems:**
- Filename with a **trailing space**: `templates/prompt/temp-prompt-cursor-pour-coverage.md ` (the space is part of the name — fragile on some tooling).
- `mecanismes` vs `mechanismes` (234 vs 221).
- `temp-prompt-*` files are temporary artifacts living in the canonical `prompt/` directory rather than `playground/`.

**Checkbox / status untrustworthiness (as the brief warned):**
- `coverage.md`: `Progress ⬜ 0%`, all boxes unchecked, though the inventory is fully written.
- All five 234 assets: `Progress ✅ 100%` and "Consistent with the storyboard" — false, since no storyboard content exists.
- These banners are self-declared and do not reflect verified state.

**Not tracked (correctly):** `demo/renderer/node_modules/` is gitignored though present on disk; `marked` is additionally vendored to `lib/marked.min.js`. `.DS_Store` files present but ignored.

---

## 13. Observed vs documented architecture (path/claim mismatches)

| Documented | Actual | Location |
|---|---|---|
| Repo has `04-decisions/` | Directory is `04-decisions-adr/` | `README.md` line ~40 |
| Coverage temp prompt input `templates/prompts/generate-coverage.md` | Directory is `templates/prompt/` (singular) | `temp-prompt-cursor-pour-coverage.md ` |
| SVGs saved to `generated-assets/overview.svg` etc. | Saved to `generated-assets/<chapter>/figures/` | `generate-svg.md` Output |
| Assets carry `[[SVG:…]]` markers | No markers in any generated asset | `*-template.md` vs `vue-ensemble.md`/`mecanismes.md`/`acteurs.md` |
| Storyboard is "the single source used to generate all learning assets" | 234 storyboard is an empty template; assets exist regardless | `storyboard-template.md` vs `234/storyboard.md` |
| Renderer shows generated assets | Only `histoire`; `mecanismes` tab absent; others `implemented:false` | `demo/renderer/config.js` |
| `design-system.md` is the colour SoT | Generated SVGs took colours from `diagram-template.svg` | `svg/svg-style-guide.md` vs `figures/*.svg` |
| `svg-generation-review.md` issues #1–#2 (incomplete DS; duplicate style guide) | Both superseded by later commits | review vs `design-system.md`, file tree |
| Expected `templates/svg/design-system.md` | File is at `templates/design-system.md` | review issue #3 |
| `01-learning/README.md` lists `experiments/` | No such directory | `01-learning/README.md` |
| `MASTER_CONTEXT.md`: "Other folders remain intentionally lightweight" | `01-learning/` is the heaviest, most developed area | `MASTER_CONTEXT.md` |

The framing docs (root + `00` + `05`) describe an *earlier, research-only* phase; the pipeline (`01` + `demo/renderer`) is well ahead of them. The documentation lags the implementation.

---

## 14. Gaps and inconsistencies, prioritized by severity

### Critical (break the intended end-to-end flow)
1. **Storyboard bypassed.** `234/storyboard.md` is an empty template, yet all assets were generated and claim consistency with it. Coverage/Storyboard are not truly upstream. *(§4, §5, §6.3)*
2. **Renderer does not consume the pipeline.** `mecanismes` has no tab; `vue-ensemble`/`acteurs`/`pret` are `implemented:false`; only `histoire` renders. *(§9)*
3. **Figures are unreachable.** No `[[SVG:…]]` resolution or `figures/` loading in the renderer; 61 SVGs are orphaned. *(§8, §9)*
4. **Asset↔SVG contract unfulfilled.** Templates/prompts mandate `[[SVG:…]]` markers; assets contain none, leaving only fragile ordinal linkage. *(§6.2, §7.2, §10)*

### Important (correctness/consistency risks)
5. **Two conflicting storyboard schemas** (module-based vs asset-section-based). *(§6.3)*
6. **Learner output contains template scaffolding** (`Purpose`/`Progress`/`Final validation`/`Notes` would render). *(§6.1, §9.4)*
7. **`generate-svg.md` output path** disagrees with the `figures/` convention. *(§7.1)*
8. **Colour source-of-truth ambiguity** (design-system vs diagram-template). *(§5.2, §7.3)*
9. **Positional data model** with no stable IDs and no coverage→asset traceability recorded (Destination columns empty). *(§10)*
10. **Header metadata inert**; `manifest.json` referenced but absent and unimplemented. *(§9.5)*
11. **`svg-generation-review.md` partially stale**, risking action on resolved issues. *(§7.5, §13)*

### Minor (hygiene / naming)
12. Stale `coverage-v0.md`; three overlapping visual docs; empty stubs (`lou-feedback.md`, demo READMEs, research HYPOTHESES/OBSERVATIONS); filename trailing space; `mecanismes`/`mechanismes` split; broken `prompts` path in temp prompt; `04-decisions` vs `04-decisions-adr`; `experiments/` referenced but missing. *(§12, §13)*

---

## 15. Unresolved architectural questions (cannot be determined from repo evidence)

1. **Which storyboard schema is intended** — module-based (`234/storyboard.md`) or asset-section-based (`storyboard-template.md`)? Both exist; neither has been used on real content.
2. **Was "Pourquoi ?" permanently replaced by "Mécanismes,"** or are both meant to coexist? The renderer says Pourquoi; the pipeline produces Mécanismes.
3. **How were the five 234 assets actually generated** — via the five per-asset prompts, or via the batch `temp-prompt-cursor-pourgenerer5assets.md`? Not recoverable from artifacts.
4. **Where should figures live and how should they bind to prose** — chapter-root vs `figures/`, and `[[SVG:…]]` markers vs `<img>` vs manifest? The specs and the on-disk reality disagree and no decision record exists (`04-decisions-adr/` is empty).
5. **Is `design-system.md` or `diagram-template.svg` the colour authority?**
6. **Who is meant to produce `manifest.json`,** and with what schema beyond the renderer README's example?
7. **Is `coverage-v0.md` intentionally retained** (history) or leftover?
8. **What is the Phase-3 (memorisation/EDN: flashcards, QCM, spaced repetition) pipeline?** It is described in `vision.md`/`principles.md` but has no templates, prompts, assets, or renderer surface.
9. **Is the paragraph-level method (paragraph-analysis-template) abandoned** in favour of chapter-level, or meant to nest inside it? Only one 221 paragraph analysis exists.

---

## 16. What is solid and should probably be preserved

- **`official-college.md` as immutable medical SoT** and the fidelity discipline in `00-foundation/principles.md` — clear, consistently applied in the prompts.
- **`coverage.md` for Item 234** — a genuinely thorough, faithful knowledge inventory (~88 units, 13 sections). Strong foundation even though its trace columns are unused.
- **The five generated 234 assets** — medically faithful, well-sequenced, good pedagogy (the pump analogy, the one-question-per-mechanism structure, the FE-diminuée/préservée comparison table). This is the strongest evidence the concept works.
- **The visual system**: `design-system.md` (complete) + `svg/diagram-template.svg` (coherent, approved component library) + `svg/svg-patterns.md` + `svg/svg-style-guide.md`. The 61 SVGs demonstrate it composes consistently.
- **The renderer shell** (`demo/renderer/`): clean separation, chapter-agnostic, path-sanitized, offline `marked`, ready to grow (tab registry + metadata hooks already stubbed). Its problems are configuration and missing features, not architecture.
- **The prompt suite** (`generate-*.md`): consistent, fidelity-first, self-audit sections. Good scaffolding to build a real orchestrated pipeline on.
- **`svg-generation-review.md`** itself: even where stale, it models the right instinct — integration-testing the pipeline and recording concrete, path-cited issues.

---

*End of audit. This document is descriptive only; no redesign or implementation changes are proposed beyond what is needed to explain a finding.*
