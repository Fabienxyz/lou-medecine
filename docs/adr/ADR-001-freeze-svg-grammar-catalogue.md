# ADR-001: Freeze SVG Grammar Catalogue after Independent Validation

## Status

**Accepted**

## Date

2026-07-26

## Context

Lou Médecine generates pedagogical medical diagrams from official French EDN Collège content. Those diagrams are not free-form illustrations: they are produced from a **semantic grammar catalogue** — a fixed set of named primitives, each with a defined cognitive pattern, input contract, and rendering technology (SVG or HTML).

The catalogue exists to solve a specific architectural problem. Without a shared vocabulary of diagram *types*, authors and tooling inevitably redraw the same clinical structures in incompatible ways — sequences where the source claims concurrency, causal arrows where the source claims temporal succession, tables where the source claims simultaneous classification. A frozen catalogue turns diagram design into a specification problem: choose the correct primitive, populate its contract, render deterministically.

**Why freezing matters.** The catalogue is the boundary between *research* (what structures medicine needs) and *engineering* (how to select, specify, and render them). Continuous redesign without a baseline prevents implementation from converging: every renderer change risks invalidating prior specifications, and every new chapter invites ad hoc primitives. Freezing establishes a stable contract under which visual-spec generation, grammar selection, and SVG rendering can proceed.

**Why independent validation was required.** The catalogue was first derived from Item 234 (Heart Failure) using evidence from blueprint, inventory, and audit material. Item 234 alone cannot prove project-wide adequacy, but it can define candidate primitives. Cardiology — the specialty that produced the catalogue — was the natural falsification target: if the nine buildable primitives plus one reserved primitive cannot represent Cardiology without semantic distortion, the catalogue is not ready to freeze.

### Validation process (summary)

The decision rests on a completed validation chain. Details live in the validation report; this ADR records only the architectural arc.

1. **Initial design.** Nine buildable primitives and one reserved primitive (`annotated-figure`) were specified in `VISUAL_GRAMMAR_LIBRARY.md`, grounded in Item 234 evidence and cross-EDN structural reasoning. Governance remains subordinate to `VISUAL_GRAMMAR_CONTRACT.md`.

2. **Cardiology corpus validation.** A falsification-oriented coverage study mapped visual concepts across the Cardiology EDN edition 2022 (22 Tool 02 chapters). Approximately **298** load-bearing visual concepts were identified and assigned to frozen grammars. The study asked whether any concept required an eleventh semantic primitive or could not be represented without distortion.

3. **Independent peer review.** A separate reviewer (Grok) evaluated whether study conclusions followed from evidence. The review scored the work **6.5/10** overall and recommended certification **B — largely correct but requires minor corrections**, while scoring ~**8/10** on the core claim that no new grammar is required.

4. **Peer-review integration.** Five matrix rows were reclassified for primitive-boundary violations (notably over-use of `transmission-path` and one `timeline` misassignment). Amended totals: **268** buildable mappings, **30** reserved (`annotated-figure`), **0** fundamental grammar gaps.

5. **Correction audit.** Each accepted reclassification was checked against authoritative definitions in `VISUAL_GRAMMAR_LIBRARY.md` (§3.3, §5.5–§5.9, §5.7). All five corrections were found consistent with the library; none required reverting the peer review.

**Outcome.** Cardiology did not falsify the catalogue. No additional semantic primitive is required for Cardiology. The catalogue is sufficiently validated to become the architectural baseline for implementation work within that scope.

Known qualifications (documented in the validation report, not re-litigated here): ~10% of concepts map to the reserved `annotated-figure` primitive (implementation blocked, not a missing design slot); the consolidated matrix has documented corpus/consolidation caveats (Items 233 RM, 236); minimality of the nine primitives was argued, not empirically proven.

## Decision

1. **`VISUAL_GRAMMAR_LIBRARY.md` is the authoritative specification** of the semantic visual grammar catalogue for this project.

2. **The grammar catalogue is frozen.** The set of named primitives, their boundaries, and their per-primitive specifications are not to be redesigned as part of routine feature work.

3. **Future changes require documented evidence.** Any proposal to add, remove, merge, or materially redefine a primitive must be accompanied by a validation study (or equivalent documented evidence) showing that existing primitives cannot represent affected content without semantic distortion.

4. **No new primitive may be introduced based solely on intuition or isolated examples.** Single-chapter convenience, renderer limitations, and aesthetic preference are not sufficient grounds for catalogue change.

This ADR does not implement primitives, ratify contract amendments, or unblock `annotated-figure`. It fixes the **semantic catalogue** as stable architecture.

## Alternatives Considered

### Continue evolving the catalogue indefinitely

**Rejected.** Open-ended evolution keeps grammar research and implementation coupled. Tooling cannot stabilise while primitives rename, merge, or shift boundaries chapter by chapter. The Item 234 audit already showed the cost of absent vocabulary (sets drawn as sequences, comparisons atomised into cards).

### Validate only Item 234

**Rejected.** Item 234 exercises all nine buildable primitives but cannot stress every boundary across a specialty (ECG territory mapping, resuscitation chains, V/Q discordance, congenital shunt cascades, etc.). Cardiology-wide falsification was the minimum credible scope for a freeze decision in the specialty that originated the library.

### Postpone freezing until all EDN specialties are validated

**Rejected.** Full multi-specialty validation before any baseline would defer all spec-generation and rendering work indefinitely. The catalogue was designed with cross-specialty reasoning (§4 of the library); Cardiology validation provides the first empirical falsification pass. Other specialties may reopen the question under explicit criteria (see **Scope** and **Decision Criteria**), but they do not block freezing for Cardiology-backed implementation.

## Evidence Supporting the Decision

The validation report (`05-research/visual-grammar/CARDIOLOGY_VISUAL_GRAMMAR_VALIDATION.md`) contains the complete evidence. Summary for architectural purposes:

| Finding | Result |
|---|---|
| Cardiology coverage | 22 chapters; ~298 visual concepts in consolidated matrix |
| Fundamental grammar gaps | **0** — no eleventh primitive required |
| Buildable assignment | **268** concepts (~90%) map to nine buildable grammars |
| Reserved assignment | **30** concepts (~10%) map to `annotated-figure` (specified, not buildable) |
| Peer review | Recommendation **B**; five boundary corrections integrated |
| Correction audit | All five accepted corrections consistent with `VISUAL_GRAMMAR_LIBRARY.md` |
| Persisted certification | **B — Catalogue validated with qualifications** |

The reserved share reflects an **implementation and asset-sourcing debt** (`annotated-figure`), not a missing semantic slot in the catalogue design. Blocks remain complete without a visual where the library allows text-only completion (§5.1).

## Consequences

### What closes

- **Grammar research is closed** for Cardiology-scoped work unless a future study meets the Decision Criteria below.
- Ad hoc primitive invention during chapter authoring or renderer development is out of scope.
- Boundary disputes are resolved by reference to `VISUAL_GRAMMAR_LIBRARY.md`, not by local convention.

### What opens

Implementation and product work should assume a **fixed semantic layer** and invest in:

- **Automatic grammar selection** — classifying blueprint/inventory elements into the correct primitive;
- **Visual-spec generation** — populating per-primitive contracts from grounded medical content;
- **SVG/HTML rendering** — deterministic renderers for the nine buildable primitives;
- **Extension to additional specialties** — reuse the same catalogue; validate before claiming specialty coverage.

### Reopening the catalogue

Other EDN specialties may trigger a **new ADR** only if a documented validation study demonstrates a **genuine grammar gap**: a load-bearing visual concept that no existing primitive can represent without semantic distortion, following the same falsification methodology and independent review standard.

Renderer bugs, missing implementations, and `annotated-figure` blocking conditions are **not** grammar gaps.

## Scope

This ADR validates the catalogue **for Cardiology only**.

It does **not** claim EDN-wide validation across all specialties (~370 items). The library’s cross-specialty survey (§4) remains design reasoning until each specialty undergoes its own falsification pass.

Cardiology validation caveats recorded in the validation report (corpus gaps, matrix omissions) remain documented limitations; they do not invalidate the freeze decision but must not be silently extrapolated to “all of EDN.”

## References

| Document | Role |
|---|---|
| [`VISUAL_GRAMMAR_LIBRARY.md`](../../VISUAL_GRAMMAR_LIBRARY.md) | Authoritative grammar catalogue specification |
| [`05-research/visual-grammar/CARDIOLOGY_VISUAL_GRAMMAR_VALIDATION.md`](../../05-research/visual-grammar/CARDIOLOGY_VISUAL_GRAMMAR_VALIDATION.md) | Complete Cardiology falsification study, peer review, and certification |
| [`VISUAL_GRAMMAR_CONTRACT.md`](../../VISUAL_GRAMMAR_CONTRACT.md) | Ratified governance (subordinate to this ADR for catalogue semantics) |
| [`05-research/VISUAL_GRAMMAR_AUDIT.md`](../../05-research/VISUAL_GRAMMAR_AUDIT.md) | Item 234 evidence audit (precursor to the library) |

## Decision Criteria

The governing rule for all future catalogue evolution:

> **The burden of proof is reversed.**
>
> The catalogue remains unchanged unless a future validation study demonstrates that an existing concept cannot be represented without semantic distortion.

A valid reopening case must identify:

1. The concept and its source grounding;
2. Which primitive(s) were attempted and why each distorts meaning;
3. Why the gap is semantic (primitive missing or boundary wrong), not implementation (renderer absent, asset blocked, or author error);
4. Independent review of the claim.

Until that burden is met, `VISUAL_GRAMMAR_LIBRARY.md` stands as the frozen architectural baseline.
