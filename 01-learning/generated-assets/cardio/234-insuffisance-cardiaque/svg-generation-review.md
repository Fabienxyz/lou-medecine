# SVG Generation Pipeline — Integration Test Review

**Chapter:** cardio/234-insuffisance-cardiaque  
**Date:** 2026-07-06  
**Scope:** End-to-end generation of all required SVGs using official repository specifications only.

---

## Generation summary

| Asset | Source | SVGs generated |
|-------|--------|----------------|
| Overview | `vue-ensemble.md` | `figures/overview.svg` |
| Mechanisms | `mecanismes.md` (24 sections) | `figures/mechanism-01.svg` … `figures/mechanism-24.svg` |
| Actors | `acteurs.md` (36 sections) | `figures/actor-01.svg` … `figures/actor-36.svg` |

**Total:** 61 SVG files in `figures/`.

All files validate as well-formed XML (`xmllint`). Each file includes `role="img"`, `<title id="svg-title">`, `<desc id="svg-desc">`, embedded `<defs>`, and the typography/colour classes from `diagram-template.svg`.

---

## Issues encountered during generation

### 1. Design System is incomplete for SVG generation

- **Severity:** Critical
- **Location:** `01-learning/templates/design-system.md`
- **Problem:** The file references colour tables, type scale, spacing, and card specs with placeholder text such as `(keep the existing colour tables)` but does not contain the actual values. `svg-style-guide.md` (both copies) instructs generators to use only colours defined in `design-system.md`.
- **Why it matters:** The generator cannot resolve colours from the declared single source of truth. During this test, colours were taken from `diagram-template.svg` and the legacy reference SVG instead.
- **Recommended improvement:** Publish complete colour, typography, and spacing tables in `design-system.md`, or explicitly delegate SVG colours to `diagram-template.svg`.

---

### 2. Two conflicting SVG Style Guide documents

- **Severity:** Critical
- **Location:** `01-learning/templates/svg/svg-style-guide.md` and `01-learning/templates/svg-style-guide.md`
- **Problem:** Two files share the same name and role but differ in content. The root-level guide requires a **transparent background**, defines a **complexity budget** (10 boxes, 30 text nodes, 5 colours), documents **`[[SVG:…]]` placeholders**, and states **summary always at the bottom**. The `templates/svg/` copy omits these rules and adds different renderer guidance. `generate-svg.md` references `svg-style-guide.md` without a path.
- **Why it matters:** A generator following one file violates the other (e.g. white `#FFFFFF` background vs transparent; summary card optional vs mandatory).
- **Recommended improvement:** Merge into one authoritative document under `templates/svg/svg-style-guide.md`, redirect or delete the duplicate, and update all cross-references with explicit paths.

---

### 3. Design System path mismatch in the visual system bundle

- **Severity:** Important
- **Location:** Task specification lists `01-learning/templates/svg/design-system.md`; repository contains `01-learning/templates/design-system.md`
- **Problem:** The expected file inside `templates/svg/` does not exist.
- **Why it matters:** Onboarding and automated tooling will look in the wrong directory.
- **Recommended improvement:** Either move `design-system.md` into `templates/svg/` or update all prompts and README paths to the actual location.

---

### 4. Output directory ambiguity in `generate-svg.md`

- **Severity:** Important
- **Location:** `01-learning/templates/prompt/generate-svg.md` → Output section
- **Problem:** The prompt instructs saving SVGs directly under `generated-assets/` (e.g. `overview.svg`). The chapter integration test and renderer convention expect `generated-assets/<chapter>/figures/`.
- **Why it matters:** Files saved per the prompt would land in the wrong place and would not match renderer expectations.
- **Recommended improvement:** Update the Output section to `generated-assets/<chapter>/figures/` and show the full path pattern.

---

### 5. Missing upstream `storyboard.md`

- **Severity:** Important
- **Location:** `01-learning/generated-assets/cardio/234-insuffisance-cardiaque/`
- **Problem:** `generate-svg.md` and `svg-patterns.md` list `storyboard.md` as an input. The file is absent from the chapter directory.
- **Why it matters:** Pedagogical organisation and diagram intent cannot be cross-checked against the storyboard during generation.
- **Recommended improvement:** Add `storyboard.md` to the chapter or mark it optional in the prompt when absent.

---

### 6. No SVG placeholders in learning Markdown assets

- **Severity:** Important
- **Location:** `vue-ensemble.md`, `mecanismes.md`, `acteurs.md`
- **Problem:** None of the chapter Markdown files contain `[[SVG:overview]]`, `[[SVG:mechanism-NN]]`, or `[[SVG:actor-NN]]` placeholders documented in `templates/svg-style-guide.md`.
- **Why it matters:** The link between prose and diagrams is implicit (numbering convention only). The renderer cannot display diagrams until placeholders are added manually.
- **Recommended improvement:** Define whether placeholders are required in generated assets and add them during asset generation or as a post-SVG step documented in `generate-svg.md`.

---

### 7. No machine-readable mapping from Markdown sections to diagram content

- **Severity:** Important
- **Location:** `generate-svg.md` tasks 3–4; `mecanismes.md`, `acteurs.md`
- **Problem:** The prompt requires one SVG per numbered mechanism/actor but does not specify how to extract diagram steps from Markdown structure (headings, tables, lists). Each mechanism required manual interpretation of which sentences become cards, branches, or summary lines.
- **Why it matters:** Inconsistent diagrams across chapters; high cognitive load for human or LLM generators; risk of medical oversimplification or omission.
- **Recommended improvement:** Add a lightweight convention in Markdown (e.g. `### Diagram` blocks) or document parsing rules (first paragraph → highlight card, table → comparison branch, etc.).

---

### 8. Long text has no wrapping or truncation rules

- **Severity:** Important
- **Location:** `svg-style-guide.md` (Typography); actor generation from `acteurs.md`
- **Problem:** SVG `<text>` does not wrap automatically. Long actor names (e.g. *Inhibiteurs de l'enzyme de conversion (IEC) / ARA2 / ARNI*) and multi-sentence roles exceed single-line card width. Manual line breaking was required; some role text still truncates mid-sentence when limited to three lines (e.g. `actor-36.svg`).
- **Why it matters:** Readability and accessibility suffer; generators produce inconsistent results.
- **Recommended improvement:** Specify max characters per line, max lines per card, font-size reduction rules, or require `<tspan>` wrapping patterns in the style guide.

---

### 9. Feedback Loop pattern has no template component

- **Severity:** Important
- **Location:** `svg-patterns.md` Pattern 6; `diagram-template.svg`
- **Problem:** Mechanism 4 (tachycardie compensatrice puis délétère) maps naturally to a feedback loop. The template provides no loop-back connector or labelled return arrow.
- **Why it matters:** The generator approximated with a linear cause→consequence flow, which weakens the pedagogical pattern match.
- **Recommended improvement:** Add a `component-feedback-connector` to `diagram-template.svg` and document its use in `svg-patterns.md`.

---

### 10. Branching layout rules are underspecified after a split

- **Severity:** Important
- **Location:** `svg-patterns.md` Pattern 3 (Comparison); `diagram-template.svg` (`component-branch-connector`)
- **Problem:** The template shows a split into two branch cards but does not define how branches merge back into a single vertical flow. The overview and several mechanisms (7, 8, 10) required ad hoc centre arrows below the branch pair.
- **Why it matters:** Layout decisions are reinvented per diagram; step numbering skips when the first step is a branch (mechanism-08 shows step **2** on the first post-branch card).
- **Recommended improvement:** Document merge semantics and numbering rules; optionally add a `component-branch-merge` connector.

---

### 11. Step indicator convention is ambiguous

- **Severity:** Minor
- **Location:** `diagram-template.svg` (numeric `1`); `demo/legacy/assets/svg/cardio-221-overview.svg` (circled Unicode `①`)
- **Problem:** The approved template uses Arabic numerals in step circles; the legacy production overview uses circled numbers.
- **Why it matters:** Visual inconsistency between legacy and new chapter diagrams.
- **Recommended improvement:** State the canonical step indicator in `svg-style-guide.md` and align the template with legacy or document the intentional change.

---

### 12. Semantic colour `#FEF3C7` absent from component library

- **Severity:** Minor
- **Location:** `diagram-template.svg`; legacy `cardio-221-overview.svg`
- **Problem:** Legacy diagrams use `#FEF3C7` for intermediate progression steps. The template showcase does not include a card with this fill, though `svg-style-guide-draft.md` documents it.
- **Why it matters:** Generators must hard-code a colour not demonstrated in the official component library.
- **Recommended improvement:** Add a `component-card-medium-progress` (or similar) to the template with `#FEF3C7` fill.

---

### 13. Background fill contradicts transparent-background rule

- **Severity:** Minor
- **Location:** `templates/svg-style-guide.md` (transparent); `diagram-template.svg` and generated SVGs (`#FFFFFF` rect)
- **Problem:** Generated SVGs follow the template (white background). The root-level style guide requires transparency.
- **Why it matters:** When embedded in the renderer on a non-white surface, diagrams may show unintended borders or mismatched canvas colour.
- **Recommended improvement:** Resolve the contradiction; if the renderer provides a white frame, document that explicitly and remove the transparent requirement.

---

### 14. Root `width` / `height` attributes vs responsiveness guidance

- **Severity:** Minor
- **Location:** `diagram-template.svg` (`width="1200" height="1320"`); `templates/svg/svg-style-guide.md` (do not rely on fixed display dimensions)
- **Problem:** The template sets explicit dimensions; the style guide says the renderer controls final size via `viewBox` only.
- **Why it matters:** Unclear whether production SVGs should omit `width`/`height` on the root element.
- **Recommended improvement:** Clarify in the style guide: omit root `width`/`height` in chapter SVGs, or keep them as hints matching `viewBox`.

---

### 15. `card-badges` component unused despite overview content

- **Severity:** Minor
- **Location:** `vue-ensemble.md` (cardiopathies ischémique, HTA, valvulaire, rythmique); `overview.svg`
- **Problem:** The vue d'ensemble text lists four etiology types suitable for badge pills. The overview was built with a single neutral card instead of `component-card-badges` because the prompt does not tie content patterns to specific components.
- **Why it matters:** Under-utilisation of the component library; missed visual parity with legacy overview diagrams.
- **Recommended improvement:** Add a mapping table in `svg-patterns.md` or `generate-svg.md` (e.g. “list of 3–5 categorical items → card-badges”).

---

### 16. Duplicated `<defs>` in every SVG

- **Severity:** Minor
- **Location:** All 61 generated SVGs; `svg-style-guide.md` (self-contained requirement)
- **Problem:** Each file embeds an identical ~1 KB `<defs>` block copied from the template.
- **Why it matters:** Updating the visual language requires regenerating or patching every chapter file.
- **Recommended improvement:** Accept duplication for `<img>` compatibility but document a regeneration workflow; optionally provide a shared defs snippet file for build-time inclusion (not runtime).

---

### 17. No validation checklist tooling referenced

- **Severity:** Nice to have
- **Location:** `templates/svg/svg-style-guide.md` Validation checklist; `generate-svg.md` Self-audit
- **Problem:** Both documents list manual checks (XML validity, complexity budget, pattern match) but no script or CI step is referenced.
- **Why it matters:** Integration tests rely on ad hoc validation (`xmllint` run manually during this exercise).
- **Recommended improvement:** Add a minimal `validate-svg.sh` or documented `xmllint` + id-uniqueness + complexity-budget script to the repository.

---

### 18. High volume per chapter without official composition tooling

- **Severity:** Nice to have
- **Location:** `generate-svg.md`; chapter 234 (61 SVGs)
- **Problem:** Producing 61 hand-composed SVGs from the component library is feasible but slow. The official pipeline provides a prompt and template but no generator, snippet library, or layout helpers beyond the static showcase SVG.
- **Why it matters:** Production scalability and cross-chapter consistency depend entirely on LLM/human discipline.
- **Recommended improvement:** Consider a thin composition layer (Python/Node templates) that imports standard defs and enforces layout constants from `diagram-template.svg`.

---

## Validation results

| Check | Result |
|-------|--------|
| All required SVGs present | ✅ 61 / 61 |
| XML well-formed | ✅ `xmllint` pass on all files |
| Unique `id` attributes per file | ✅ |
| Accessibility (`title`, `desc`, `role`, `aria-labelledby`) | ✅ |
| Self-contained (no external CSS/JS/fonts/images) | ✅ |
| Design System colours from official source | ⚠️ Blocked — see issue 1 |
| Renderer placeholder integration | ⚠️ Blocked — see issue 6 |
| Storyboard alignment | ⚠️ Blocked — see issue 5 |

---

## Conclusion

The integration test **successfully produced all required SVGs** for chapter 234 using the diagram template visual language, appropriate patterns (process flow, cause→consequence, comparison, actor card), and content from the learning assets.

The pipeline is **not yet robust enough for unattended production** because of critical gaps in the Design System content, duplicate/conflicting style guides, ambiguous output paths, missing storyboard, and absent Markdown↔SVG linking. Addressing issues 1–6 should be the priority before treating `generate-svg.md` as the official production workflow.
