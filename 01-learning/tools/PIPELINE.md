# Lou Learning Pipeline

Architectural overview of the Lou learning toolchain under `01-learning/tools/`.

This document describes **how tools compose**. Per-tool rationale lives in each tool’s `DECISIONS.md`; behavioural guarantees live in each tool’s `CONTRACT.md`.

---

## Overall architecture

```
Official PDF
    ↓
Tool 01
    ↓
official-college.md
    ↓
Tool 02
    ↓
chapters/
    ↓
Tool 03
    ↓
Knowledge Inventory
    ↓
Tool 04
    ↓
Blueprint
    ↓
Tool 05
    ↓
Understanding Assets
```

### Design principles

1. **Single ingestion boundary** — only Tool 01 reads PDFs.
2. **Deterministic building blocks** — frozen tools produce byte-stable artifacts for a fixed version + input.
3. **Separation of concerns** — conversion ≠ splitting ≠ semantics ≠ blueprint ≠ learner assets.
4. **Fail closed** — ambiguous structure aborts; tools do not silently guess.
5. **Generic College support** — no specialty-hardcoded pipelines in frozen tools.

### Status board

| Tool | Role | Status |
|---|---|---|
| Tool 01 | PDF → canonical Markdown | ✓ Frozen (v1.0.0) |
| Tool 02 | Markdown → chapter files | ✓ Frozen (v1.0.0) |
| Tool 03 | Chapters → Knowledge Inventory | Planned |
| Tool 04 | Inventory → Blueprint | Planned |
| Tool 05 | Blueprint → Understanding Assets | Planned |

---

## Data flow

| From | Artifact | To |
|---|---|---|
| Publisher / archive | `official-college.pdf` | Tool 01 |
| Tool 01 | `official-college.md` + edition `manifest.json` | Tool 02 (+ audits) |
| Tool 02 | `chapters/*.md` + `chapters/manifest.json` | Tool 03 |
| Tool 03 | Knowledge Inventory (planned) | Tool 04 |
| Tool 04 | Blueprint (planned) | Tool 05 |
| Tool 05 | Understanding Assets (planned) | Learner surfaces / validators |

Typical on-disk layout (Cardiology example):

```
01-learning/full-edn/<specialty>/edition-<year>/
  official-college.pdf          ← immutable reference
  official-college.md           ← Tool 01
  manifest.json                 ← Tool 01 provenance
  chapters/
    manifest.json               ← Tool 02 provenance
    item-<n>-<slug>.md          ← Tool 02
```

---

## Immutable artifacts

| Artifact | Owner | Mutability |
|---|---|---|
| `official-college.pdf` | External publication | **Immutable reference** — never modified by Lou tools |
| `official-college.md` | Tool 01 | Regenerable derived textual SoT; do not hand-edit as source |
| Edition `manifest.json` | Tool 01 | Regenerable provenance |
| `chapters/*.md` | Tool 02 | Regenerable exact slices of `official-college.md` |
| `chapters/manifest.json` | Tool 02 | Regenerable provenance |

Rules:

- The PDF remains the archival reference ([Tool 01 ADR-003](./01-pdf-to-canonical/DECISIONS.md#adr-003)).
- Downstream tools must not reopen the PDF for content extraction.
- Chapter files must not be rewritten by later tools; later tools produce **new** artifacts.

---

## Frozen contracts

Frozen tools publish a consumer contract. Downstream tools may rely only on what that contract states.

| Tool | Contract | Decision log |
|---|---|---|
| Tool 01 | [`01-pdf-to-canonical/CONTRACT.md`](./01-pdf-to-canonical/CONTRACT.md) | [`DECISIONS.md`](./01-pdf-to-canonical/DECISIONS.md) |
| Tool 02 | [`02-chapter-splitter/CONTRACT.md`](./02-chapter-splitter/CONTRACT.md) | [`DECISIONS.md`](./02-chapter-splitter/DECISIONS.md) |

Contract policy (both frozen tools):

- Patch / minor versions preserve MAY-assume clauses
- Breaking MAY-assume clauses requires a **major** version bump and contract revision

---

## Tool catalog

### Tool 01 — PDF → Canonical Markdown

**Path:** `01-pdf-to-canonical/`  
**Status:** ✓ Frozen (v1.0.0)

| | |
|---|---|
| **Purpose** | Convert an official EDN College PDF into faithful, deterministic canonical Markdown. |
| **Input** | `official-college.pdf` (born-digital text PDF) |
| **Output** | `official-college.md`, edition `manifest.json` |
| **Guarantees** | Deterministic Markdown; chapter/heading preservation; reading-order fidelity within text-layer limits; generic across specialties; fail-closed validation; provenance checksums. See contract. |
| **Non-goals** | OCR; medical semantics; Knowledge Inventory; Blueprint; chapter splitting; visual PDF reproduction; universal arbitrary-PDF conversion. |

---

### Tool 02 — Chapter Splitter

**Path:** `02-chapter-splitter/`  
**Status:** ✓ Frozen (v1.0.0)

| | |
|---|---|
| **Purpose** | Split canonical College Markdown into one exact Markdown file per chapter. |
| **Input** | `official-college.md` (Tool 01) |
| **Output** | `chapters/*.md`, `chapters/manifest.json` |
| **Guarantees** | H1-based detection; content-derived deterministic filenames; exact byte slices; mandatory round-trip (concatenate chapters → original); fail-closed; no rewriting. See contract. |
| **Non-goals** | Summarization; medical interpretation; renaming for pedagogy; PDF access; AI/LLM use. |

---

### Tool 03 — Knowledge Inventory *(planned)*

**Status:** Planned

| | |
|---|---|
| **Purpose** | Build a structured Knowledge Inventory from canonical chapter Markdown. |
| **Input** | `chapters/` (Tool 02) |
| **Output** | Knowledge Inventory artifacts (schema TBD) |
| **Guarantees** | *(to be defined in Tool 03 CONTRACT)* — expected to be explicit, validated, and reproducible for a frozen inventory schema. |
| **Non-goals** | PDF conversion; chapter splitting; Blueprint authoring; learner-facing asset generation. |

Tool 03 is the first stage allowed to perform **semantic structuring** of College content. It must consume Tool 02 outputs, not the PDF.

---

### Tool 04 — Blueprint *(planned)*

**Status:** Planned

| | |
|---|---|
| **Purpose** | Produce a chapter Blueprint from a Knowledge Inventory. |
| **Input** | Knowledge Inventory (Tool 03) |
| **Output** | Blueprint artifacts (schema TBD; see project Blueprint conventions) |
| **Guarantees** | *(to be defined in Tool 04 CONTRACT)* |
| **Non-goals** | Raw PDF/Markdown ingestion; inventory extraction from scratch; final learner UI rendering. |

---

### Tool 05 — Understanding Assets *(planned)*

**Status:** Planned

| | |
|---|---|
| **Purpose** | Generate Understanding projections / learner-facing assets from a Blueprint (and related Visual Grammar constraints). |
| **Input** | Blueprint (Tool 04) |
| **Output** | Understanding Assets (projections, validated visuals, etc. — TBD) |
| **Guarantees** | *(to be defined in Tool 05 CONTRACT)* |
| **Non-goals** | Replacing Tools 01–04; ad-hoc PDF scraping; bypassing Blueprint structure. |

---

## Future tools

Beyond Tool 05, the pipeline may grow (validation gates, packagers, demo renderers, multi-specialty batch runners). New tools must:

1. Depend on the nearest frozen upstream artifact — never skip back to the PDF when Markdown/chapters exist
2. Ship `README.md`, `CONTRACT.md`, `CHANGELOG.md`, and `DECISIONS.md` using the same conventions as Tools 01–02
3. Remain specialty-agnostic unless a later ADR explicitly scopes otherwise

---

## Documentation map

| Document | Role |
|---|---|
| **This file (`PIPELINE.md`)** | Pipeline architecture and tool composition |
| `*/README.md` | What a tool does and how to run it |
| `*/CONTRACT.md` | What downstream tools may rely upon |
| `*/CHANGELOG.md` | What changed over time |
| `*/DECISIONS.md` | Why that tool’s architecture is the way it is |

---

## Working rule

- **Frozen tools (01, 02):** treat as stable dependencies. Prefer Tool 03+ for new capability.
- **Planned tools (03+):** specify contracts before implementation; do not weaken upstream guarantees.
