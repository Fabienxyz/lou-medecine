# ADR-002: Renderer V2 Architecture

## Status

**Accepted**

## Date

2026-07-26

## Context

Lou Médecine's renderer began as a visual prototype (`demo/legacy/221/`) with embedded medical HTML, evolved through an AI-generated asset era with 61 ordinal SVGs, and converged on a manifest-driven static application (`demo/renderer/`) validated by the Item 234 OAP vertical slice.

That application implements the contractual renderer obligations ([`IMPLEMENTATION_CONTRACT.md`](../../IMPLEMENTATION_CONTRACT.md) C.7–C.9): manifest-driven discovery, pedagogical blocks, ID-bound visuals, traceability lookup, Personal Diagrams, and Inline Notes. Contract tests enforce compliance.

However, three forces require a formal architectural evolution — **Renderer V2** — documented in [`docs/renderer/`](../../docs/renderer/):

### 1. Product gap — paper study parity

Live research with Lou ([`05-research/RESEARCH_LOG.md`](../../05-research/RESEARCH_LOG.md) Session 002) established that understanding-first reading requires:

- Immutable official content
- Personal appropriation through **separate** learner mechanisms
- Annotation while reading — highlights, emphasis, margin notes — not merely notes at claim-block boundaries

The current renderer implements Personal Diagrams and claim-block Inline Notes but **not text-selection annotations**. Lou's paper study workflow is incomplete digitally.

### 2. Architectural drift risk

The repository simultaneously contains:

- An authoritative manifest-driven renderer (`demo/renderer/`)
- A legacy fallback to ordinal SVGs (`generated-assets/`, `config.js` TABS)
- Two SVG build pipelines (V1 `svg.js` hard-coded; V2 `visual-*.js` experimental)
- Obsolete documentation claiming the renderer never loads SVGs (`ARCHITECTURE_AUDIT.md`)

Without a definitive reference, future contributors may extend the wrong component, reintroduce embedded content, or build a parallel framework-based renderer.

### 3. Strategic elevation

The renderer is no longer a demo shell. It is the **student-facing application** — the surface on which 350 chapters will be consumed. It requires the same architectural rigour as the Knowledge Inventory, Blueprint, and Visual Grammar Library.

Renderer V2 is therefore defined as an **evolution** of the existing application plus formal documentation — not a greenfield rewrite.

## Decision

### 1. Establish `docs/renderer/` as the authoritative renderer reference

The document set mirrors the role of `VISUAL_GRAMMAR_LIBRARY.md` for SVG grammar: vision, product specification, target architecture, migration plan, roadmap, and explicit non-goals.

Operational quick-start remains in `apps/renderer/README.md` (after migration) or `demo/renderer/README.md` (during transition).

### 2. Renderer V2 extends Generation 3 — it does not replace it

The browser implementation in `demo/renderer/` remains the authoritative codebase. V2 adds:

- Text selection annotation layer (overlay model)
- SVG display polish (responsive, zoom)
- Module extraction (`text-annotations.js`, `svg-display.js`, etc.)
- Event emission for future adaptivity

No framework rewrite. No second renderer directory. Vanilla JavaScript with at most one new MIT dependency (`dom-anchor-text-quote`) for text anchoring.

### 3. Official content immutability is absolute

The renderer never edits, rewrites, or stores modified versions of generated projections. Annotations are overlays stored in IndexedDB, merged at display time. This invariant is product-critical and non-negotiable.

### 4. Learner mechanisms remain separate — V2 adds a third without unifying C.8/C.9

Personal Diagrams (C.8), claim-block Inline Notes (C.9), and text selection annotations (V2) are **three distinct mechanisms** sharing one boundary (learner-owned, never input to generation). They must not be generalised into a single "attachment system" or editor.

### 5. SVG build pipeline migration is parallel but separate

Browser renderer work and `lou-build` SVG pipeline integration proceed on separate tracks:

- **Browser:** display artefacts from manifest
- **Build:** generate artefacts via V2 `visual-render.js`; retire V1 `svg.js` when primitives are covered

Confusing these two "renderers" is an explicit anti-pattern documented in the architecture map.

### 6. Legacy components are scheduled for removal, not immediate deletion

`demo/legacy/`, `generated-assets/` fallback, `config.js` TABS, and `svg.js` V1 remain until migration Phase 5 prerequisites are met. Incremental migration preserves repository functionality throughout ([`10-MIGRATION_PLAN.md`](../renderer/10-MIGRATION_PLAN.md)).

### 7. Explicit non-goals are documented

The renderer will not become a word processor, Google Docs, medical AI, collaborative editor, CMS, or visual editor ([`12-NON_GOALS.md`](../renderer/12-NON_GOALS.md)).

## Alternatives Considered

### Greenfield React/Svelte renderer

**Rejected.** The existing static shell passes contract tests, loads chapters without code changes, and matches the reversible framework decision in [`REFERENCE_IMPLEMENTATION_DESIGN.md`](../../REFERENCE_IMPLEMENTATION_DESIGN.md) §19. A rewrite would stall annotation work for months while reproducing solved problems (manifest loading, block assembly, IndexedDB). Framework adoption remains a reversible future decision with evidence threshold.

### Unified annotation + editing system (ProseMirror-based)

**Rejected.** Editor frameworks assume mutable documents. Lou's invariant requires official content immutability with overlay annotations. ProseMirror would fight the architecture and introduce commercial-scale complexity for a single-learner read-only application.

### Hypothesis or full annotation suite integration

**Rejected.** Hypothesis assumes collaborative web annotation with server sync. Lou's model is local-first, single-learner, no accounts. Extracting only the anchoring library (`dom-anchor-text-quote`) captures the solved problem without the collaboration model.

### Keep legacy fallback indefinitely

**Rejected.** The fallback preserves ordinal SVG binding and untraced content — the exact failures the architecture converged to eliminate. It exists only as a migration bridge with a defined removal phase.

### Single monolithic RENDERER_ARCHITECTURE.md at repo root

**Rejected.** The renderer spans product, UX, technical architecture, migration, and ADR concerns with different update frequencies. A document set in `docs/renderer/` scales better than a 3000-line monolith, while an index README provides the single entry point the grammar library achieves with one file.

### Merge browser renderer into lou-build

**Rejected.** Build tooling runs in Node.js; the renderer runs in the browser consuming static artefacts. Merging would coupling packaging with presentation and prevent independent versioning (C.7: "Versioned independently of content").

## Consequences

### Positive

- Contributors have a definitive reference — no ambiguity about authoritative implementation
- Annotation feature can proceed without architectural re-debate
- Legacy retirement is scheduled with explicit prerequisites
- Renderer elevated to strategic component with same rigour as grammar library
- Immutability invariant documented and enforceable

### Negative / costs

- Documentation maintenance burden — `docs/renderer/` must stay current with implementation
- Three learner mechanisms increase UI complexity versus one generic "notes" feature
- Text quote anchoring degrades on major regeneration — must be communicated to learner
- SVG overlay annotations deferred — paper diagram marking on screen waits for Phase B.5

### Neutral

- Directory rename `demo/renderer/` → `apps/renderer/` deferred to late migration — no immediate path disruption
- V1 svg.js remains until V2 pipeline covers process-flow — two SVG pipelines persist temporarily

## Compliance

This ADR is implemented by the existence of [`docs/renderer/`](../renderer/) and governed by:

- [`IMPLEMENTATION_CONTRACT.md`](../../IMPLEMENTATION_CONTRACT.md) C.7–C.9 (contractual obligations — supersede this ADR where specified)
- [`FINAL_ARCHITECTURE.md`](../../FINAL_ARCHITECTURE.md) (system-level renderer role)
- ADR-001 (grammar catalogue freeze — renderer displays grammar output, does not define it)

## References

- [`docs/renderer/README.md`](../renderer/README.md) — entry point and repository audit
- [`03-HISTORICAL_ARCHITECTURE.md`](../renderer/03-HISTORICAL_ARCHITECTURE.md) — generations 1–3
- [`04-TARGET_ARCHITECTURE.md`](../renderer/04-TARGET_ARCHITECTURE.md) — target design
- [`10-MIGRATION_PLAN.md`](../renderer/10-MIGRATION_PLAN.md) — incremental path
- [`13-ROADMAP.md`](../renderer/13-ROADMAP.md) — implementation phases
