# Changelog

Notable changes to Tool 02 (`lou-chapter-splitter`).

Architectural rationale: [`DECISIONS.md`](./DECISIONS.md).

---

## [1.0.0] — 2026-07-25

### Frozen production release

Tool 02 is frozen as a deterministic building block for the Lou learning pipeline.

- Deterministic H1-based chapter splitting of Tool 01 Markdown
- Content-derived filenames (`item-<n>-<slug>.md` when a numeric item appears in the heading)
- `chapters/manifest.json` with line ranges and SHA-256
- Mandatory round-trip validation (concatenate chapters → original)
- Fail-closed detection and tests
- Docs: README, CONTRACT, CHANGELOG, DECISIONS

Related: [ADR-001](./DECISIONS.md#adr-001) … [ADR-006](./DECISIONS.md#adr-006)
