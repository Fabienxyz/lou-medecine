# Tool 01 — Architectural Decision Log

**Converter:** `lou-pdf-to-canonical`  
**Scope:** Tool 01 only (`01-learning/tools/01-pdf-to-canonical`)

This file is the **single authoritative record** of architectural decisions for Tool 01.

- Future architectural decisions **must be appended here** as new ADR entries.
- Do not duplicate architectural rationale in `README.md`, `CONTRACT.md`, or `CHANGELOG.md`.
- Cross-reference ADRs from those documents when needed.

Document roles:

| Document | Responsibility |
|---|---|
| `README.md` | What the tool does and how to use it |
| `CONTRACT.md` | Behavioural guarantees for downstream tools |
| `CHANGELOG.md` | What changed over time |
| `DECISIONS.md` | Why the architecture is the way it is |

---

# ADR-001

**Title**

Canonical Markdown representation, not visual PDF reproduction

**Status**

Accepted

**Date**

2026-07-25

**Context**

Official EDN Colleges are published as PDFs. Downstream Lou tools need a stable working representation. Reconstructing print layout in Markdown (or another visual format) is expensive, fragile, and unnecessary for learning-pipeline work.

**Decision**

Tool 01 produces a **canonical textual Markdown** representation of the College. It does not attempt pixel-perfect or visually faithful PDF reproduction.

**Rationale**

Markdown is portable, diffable, deterministic, and sufficient for heading structure, prose, lists, captions, and semantic tables. Visual reproduction would couple Lou to PDF layout quirks without helping Knowledge Inventory or Blueprint work.

**Consequences**

Positive:

- Stable, reviewable textual source
- Simple downstream parsing
- Deterministic regeneration

Trade-offs:

- Multi-column layouts and decorative structure are simplified or lost
- Tables/boxes are semantic approximations, not print clones

Future impact:

- Layout-sensitive features must not be built on Tool 01 Markdown as if it were a page renderer

---

# ADR-002

**Title**

`official-college.md` is the canonical textual source for downstream tools

**Status**

Accepted

**Date**

2026-07-25

**Context**

If every tool read the PDF independently, conversion drift, duplicated PDF logic, and inconsistent structure would accumulate across the pipeline.

**Decision**

`official-college.md` is the **unique canonical textual source** consumed by downstream Lou tools. Downstream tools must not extract College content from the PDF.

**Rationale**

A single textual SoT keeps the pipeline coherent: one conversion boundary, one validation gate, one checksummable artifact.

**Consequences**

Positive:

- Clear ownership of PDF ingestion (Tool 01 only)
- Downstream tools stay PDF-agnostic
- Auditable Markdown diffs

Trade-offs:

- Downstream quality is bounded by Tool 01 conversion quality
- Regeneration must go through Tool 01, not hand-edited Markdown as source

Future impact:

- Tool 02+ must be specified against Markdown (+ optional `manifest.json`), not PDF APIs

---

# ADR-003

**Title**

The original PDF remains the immutable reference source

**Status**

Accepted

**Date**

2026-07-25

**Context**

Canonical Markdown is a derived artifact. Medical and legal authority still rests with the published College PDF.

**Decision**

The original `official-college.pdf` remains the **immutable reference source**. Markdown is derived and regenerable. The PDF is never modified by Tool 01.

**Rationale**

Separating immutable reference (PDF) from working textual source (Markdown) preserves provenance and allows safe re-conversion when the converter improves.

**Consequences**

Positive:

- Clear provenance via PDF SHA-256 in `manifest.json`
- Converter upgrades can regenerate Markdown without altering the reference
- Disputes about wording can be checked against the PDF

Trade-offs:

- Two artifacts must be kept together in the edition directory
- Markdown alone is not a substitute for archival custody of the PDF

Future impact:

- Audits compare Markdown fidelity against the PDF; they do not treat Markdown as the legal publication

---

# ADR-004

**Title**

Tool 01 is limited to deterministic document conversion

**Status**

Accepted

**Date**

2026-07-25

**Context**

Lou needs conversion, chapter splitting, knowledge inventory, blueprints, and projections. Putting semantics into Tool 01 would conflate ingestion with interpretation and make the converter unstable.

**Decision**

Tool 01 is responsible **only** for deterministic document conversion (PDF text layer → structured Markdown + manifest). Semantic interpretation belongs to downstream tools.

**Rationale**

Conversion and interpretation have different change rates, validation criteria, and failure modes. Keeping them separate protects the stable ingestion boundary.

**Consequences**

Positive:

- Narrow, testable Tool 01 scope
- Downstream tools can evolve semantics without reopening PDF conversion
- Fail-closed validation stays structural, not medical

Trade-offs:

- Tool 01 will not “fix” clinical wording or normalize ontology labels
- Some structures remain imperfect until a semantic tool interprets them

Future impact:

- Knowledge Inventory, Blueprint, and understanding projections must not be absorbed into Tool 01

---

# ADR-005

**Title**

Information fidelity over visual fidelity

**Status**

Accepted

**Date**

2026-07-25

**Context**

PDF conversion constantly trades prettier layout against preserving source wording and reading order. Optimizing for appearance invites silent edits and invented structure.

**Decision**

When trade-offs arise, Tool 01 prioritizes **fidelity of information** (wording, order, detectable structure) over visual fidelity.

**Rationale**

Lou’s downstream value depends on not rewriting the College. Misleading pretty tables are worse than imperfect tables with explicit warnings.

**Consequences**

Positive:

- Medical wording is not rewritten
- Low-confidence structures emit warnings instead of fabricated grids
- Determinism is easier to maintain

Trade-offs:

- Output can look rough compared with the printed College
- Some layout cues useful to human readers are absent

Future impact:

- UI/rendering layers may restyle Markdown later; they must not require Tool 01 to become a typesetter

---

# ADR-006

**Title**

Generic implementation — no specialty-specific logic

**Status**

Accepted

**Date**

2026-07-25

**Context**

Lou must support multiple EDN specialties and editions. Cardiology-specific heuristics (hardcoded titles, page numbers, chapter names) would make the converter non-portable and hide coupling in “bug fixes.”

**Decision**

Tool 01 must remain **generic**. Detectors and reconstructors rely on document structure (geometry, font size, recurring EDN College patterns), never on specialty-, chapter-, or page-specific rules.

**Rationale**

A specialty-agnostic converter is reusable and honest: if a structure is real in EDN Colleges, it should be detectable structurally; if not, it belongs outside Tool 01.

**Consequences**

Positive:

- One converter for all specialties/editions
- CLI-driven specialty/edition selection
- Lower risk of overfitting to Cardiology

Trade-offs:

- Cannot ship quick one-off fixes keyed to known Cardiology pages
- Some College-specific oddities remain as documented limitations

Future impact:

- Specialty-specific enrichment is a downstream concern, not a Tool 01 patch series

---

# ADR-007

**Title**

Accepted limitations at the conversion boundary

**Status**

Accepted

**Date**

2026-07-25

**Context**

After hierarchy/box/table reconstruction reached production quality, residual issues (multi-column encadré interleaving, missing graphical rank markers, imperfect data tables) remained. Continuing to patch these inside Tool 01 risked scope creep into interpretation and layout engines.

**Decision**

Remaining limitations of Tool 01 at v1.0.0 are **accepted** as conversion-boundary limits. Problems that require semantic interpretation, clinical judgment, or visual layout recovery belong to downstream tools — not to further Tool 01 redesign.

**Rationale**

A frozen, explicit limitation set is more valuable to the pipeline than an endlessly evolving converter. Tool 01’s job is durable ingestion, not perfect page understanding.

**Consequences**

Positive:

- Clear freeze point for Tool 01 (v1.0.0)
- Downstream tools know which imperfections to expect
- Engineering attention can move to Tool 02+

Trade-offs:

- Some imperfect tables/boxes remain in Markdown
- Graphical-only PDF content may be absent

Future impact:

- New Tool 01 work should be limited to contract-preserving bug fixes unless a new ADR revises scope

---

# ADR-008

**Title**

Lightweight internal document block model (private to Tool 01)

**Status**

Accepted

**Date**

2026-07-25

**Context**

A single generic Markdown reconstruction pass was insufficient for recurring EDN structures (hierarchy tables, encadrés, data tables). Ad-hoc patches did not compose.

**Decision**

Tool 01 uses a **small internal block model** (Heading, Paragraph, List, HierarchyTable, DataTable, Box, Figure, Caption) with specialized reconstructors. The model is an implementation detail; Markdown remains the only downstream interface.

**Rationale**

Specialized reconstruction improves reliability for a few recurring College structures without building a universal document framework or exposing a second public format.

**Consequences**

Positive:

- Better hierarchy tables, boxes, and data tables
- Clearer internal pipeline stages

Trade-offs:

- Slightly more internal complexity than a single pass
- Block model must not become an accidental public API

Future impact:

- Downstream tools continue to consume Markdown only; block-model changes do not require downstream updates unless Markdown behaviour changes (see `CONTRACT.md`)
