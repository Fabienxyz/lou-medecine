# Tool 02 — Downstream Compatibility Contract

**Tool:** `lou-chapter-splitter`  
**Contract version:** aligned with tool **v1.0.0** (frozen)

Behavioural guarantees between Tool 02 and downstream tools (Tool 03+).

Architectural rationale: [`DECISIONS.md`](./DECISIONS.md).

Public deliverables:

- `chapters/*.md`
- `chapters/manifest.json`

---

## Downstream tools MAY assume

### Determinism

- For a fixed `tool_version` and identical `official-college.md` bytes, every chapter `.md` file is byte-deterministic.
- Filenames are deterministic functions of chapter H1 text content.
- `manifest.json` chapter entries (except `generated_at`) are stable for a fixed input + tool version when `generated_at` is held constant.

### Structure

- One Markdown file per detected chapter, in document order.
- Each file is an exact byte slice of the source Markdown for that chapter span (plus the necessary boundary newline for round-trip).
- Each file begins with its official `# …` H1.
- `manifest.json` lists every chapter with:
  - `index`
  - `edn_item_number` (string or `null` if absent from heading text)
  - `official_title`
  - `filename`
  - `sha256`
  - `first_line` / `last_line` (1-based, inclusive, in the source document)
- `chapter_count` equals the number of chapter files.

### Round-trip

- Concatenating chapter file contents in manifest order reconstructs `official-college.md` **exactly**.

### Consumption

- Downstream tools should read `chapters/` — not re-split `official-college.md` ad hoc.
- Tool 02 does not open PDFs.

---

## Downstream tools MUST NOT assume

- Semantic correctness of titles or item numbers beyond faithful extraction from H1 text
- That every College heading contains a numeric item identifier
- That Tool 02 rewrites, normalizes, or annotates chapter bodies
- Medical interpretation, inventory, or blueprint generation
- Stability of filenames across **major** tool versions if heading parsing rules change

---

## Compatibility policy

| Change | Version impact |
|---|---|
| Bug fix preserving MAY-assume clauses | Patch (`1.0.x`) |
| Additive manifest fields | Minor (`1.x.0`) |
| Break to MAY-assume clauses | Major (`2.0.0`) + contract revision |
