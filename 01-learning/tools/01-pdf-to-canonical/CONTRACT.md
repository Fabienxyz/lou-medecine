# Tool 01 — Downstream Compatibility Contract

**Converter:** `lou-pdf-to-canonical`  
**Contract version:** aligned with tool **v1.0.0**

This document states **behavioural guarantees** between Tool 01 and downstream tools.

It does not explain architectural rationale. For why these rules exist, see [`DECISIONS.md`](./DECISIONS.md).

Public deliverables:

- `official-college.md`
- `manifest.json`

The internal document block model is not part of this contract ([ADR-008](./DECISIONS.md#adr-008)).

---

## Downstream tools MAY assume

### Determinism and provenance

- For a fixed `converter_version` and identical PDF bytes, `official-college.md` is byte-deterministic.
- `manifest.json` records `original_pdf_sha256`, `markdown_sha256`, `converter_version`, `specialty`, `edition`, `original_pdf_filename`, validation outcome, and warnings.
- Markdown does not embed a generation timestamp.

### Document structure

- UTF-8 Markdown.
- Chapter ordering preserved as `#` headings in College order.
- Heading levels (`#` … `####`) usable for structural navigation when sections are detectable.
- Paragraph and list order follow PDF reading order (within text-layer limits).
- Figure/table captions preserved as text when present in the text layer.
- Encadrés appear as Markdown blockquotes with a bold title line when detected.
- Knowledge-hierarchy tables use:

  `| Rang | Rubrique | Intitulé | Descriptif |`

  when structurally detected.

### Consumption

- `official-college.md` is the textual source to parse ([ADR-002](./DECISIONS.md#adr-002)).
- Downstream tools must not extract College content from the PDF ([ADR-002](./DECISIONS.md#adr-002), [ADR-003](./DECISIONS.md#adr-003)).
- `manifest.json` may be used for provenance and version checks.
- A successfully written Markdown file passed fail-closed structural validation for that run.
- Warnings mean imperfect reconstruction was acknowledged, not that structure was silently invented.

---

## Downstream tools MUST NOT assume

- Visually perfect tables or pixel-perfect PDF layout ([ADR-001](./DECISIONS.md#adr-001), [ADR-005](./DECISIONS.md#adr-005))
- Exact multi-column / decorative layout inside encadrés or floats
- That graphics-only PDF content appears in Markdown
- That figures are available as binary assets
- Medical or semantic interpretation by Tool 01 ([ADR-004](./DECISIONS.md#adr-004))
- Byte-identical Markdown across major converter versions
- That Tool 01 performs chapter splitting, Knowledge Inventory, or Blueprint work ([ADR-004](./DECISIONS.md#adr-004))

Residual conversion limits are accepted at v1.0.0 ([ADR-007](./DECISIONS.md#adr-007)).

---

## Compatibility policy

| Change | Version impact |
|---|---|
| Bugfix preserving MAY-assume clauses | Patch (`1.0.x`) |
| Additive backward-compatible manifest fields or warnings | Minor (`1.x.0`) |
| Break to MAY-assume clauses | Major (`2.0.0`) + contract revision |

Guarantees not listed under **MAY assume** must not be inferred from Tool 01 internals.
