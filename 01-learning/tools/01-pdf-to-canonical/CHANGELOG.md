# Changelog

Notable changes to Tool 01 (`lou-pdf-to-canonical`).

This file records **what changed**. Architectural rationale lives in [`DECISIONS.md`](./DECISIONS.md).

---

## [1.0.0] — 2026-07-25

### First stable release

- Promoted to **v1.0.0**
- Added `README.md` usage/guarantees docs, `CONTRACT.md`, and `DECISIONS.md` (ADR-001 … ADR-008)
- No new conversion features; Tool 01 scope frozen for downstream work on Tool 02+

Related: [ADR-007](./DECISIONS.md#adr-007)

---

## [0.3.0] — 2026-07-25

### Internal document block model

- Pipeline: extract → segment → classify → specialized reconstruct → render
- Internal blocks + reconstructors for HierarchyTable, Box, DataTable
- Multi-page hierarchy merge and prose-leak handling
- Markdown remained the sole downstream output

Related: [ADR-001](./DECISIONS.md#adr-001), [ADR-008](./DECISIONS.md#adr-008)

---

## [0.2.0] — 2026-07-25

### Table reconstruction improvements

- Geometry-based multi-column table detection
- Anti-phantom chapter detection
- Pipe tables when confidence allows; warning + preformatted fallback otherwise

Related: [ADR-005](./DECISIONS.md#adr-005), [ADR-006](./DECISIONS.md#adr-006)

---

## [0.1.0] — 2026-07-25

### Initial converter

- PDF text extraction, normalize, Markdown reconstruction
- Fail-closed validation and `manifest.json`
- CLI for specialty/edition conversion

Related: [ADR-002](./DECISIONS.md#adr-002), [ADR-003](./DECISIONS.md#adr-003), [ADR-004](./DECISIONS.md#adr-004)
