# 01 — PDF → Canonical Markdown

**Version 1.0.0** — first stable release.

Tool 01 of the Lou learning pipeline.

Converts an official EDN College PDF into canonical Markdown for every downstream Lou tool.

See also:

| Document | Responsibility |
|---|---|
| [`CONTRACT.md`](./CONTRACT.md) | What downstream tools may rely upon |
| [`CHANGELOG.md`](./CHANGELOG.md) | What changed over time |
| [`DECISIONS.md`](./DECISIONS.md) | Why the architecture is the way it is |

---

## Purpose

Turn a published official EDN College PDF into a faithful, deterministic textual source (`official-college.md`) that the rest of Lou can consume without opening the PDF again.

---

## Architectural role

```
Official College PDF
        ↓
     Tool 01
        ↓
 official-college.md
 manifest.json
        ↓
     Tool 02 …
```

Downstream tools read `official-college.md` (and optionally `manifest.json`). They must not open the PDF for content extraction.

---

## Architectural decisions

Long-term design choices for Tool 01 are recorded in [`DECISIONS.md`](./DECISIONS.md).

Do not duplicate architectural rationale in this README. Append new ADRs to `DECISIONS.md` instead.

---

## Inputs

Official EDN College PDF:

```
01-learning/full-edn/<specialty>/edition-<year>/official-college.pdf
```

Example:

```
01-learning/full-edn/cardiology/edition-2022/official-college.pdf
```

Assumptions:

- Born-digital text PDF (extractable positioned text)
- Specialty / edition provided via CLI (not hardcoded)
- One PDF → one full-college Markdown file

Unsupported:

- Scanned / image-only PDFs (no OCR)
- Arbitrary non-College PDFs

---

## Outputs

| File | Role |
|---|---|
| `official-college.md` | Canonical Markdown source for downstream tools |
| `manifest.json` | Provenance, checksums, converter version, validation, warnings, stats |

`manifest.json` includes at least: `specialty`, `edition`, `original_pdf_filename`, `original_pdf_sha256`, `markdown_sha256`, `converter_version`, `generated_at`.

---

## Guarantees

Behavioural guarantees for consumers are defined in [`CONTRACT.md`](./CONTRACT.md).

In short, Tool 01 v1.0.0 provides:

- Faithful textual conversion (no medical rewriting)
- Deterministic Markdown for a fixed converter version + PDF bytes
- Chapter and heading hierarchy preservation when detectable
- Reading-order preservation for paragraphs and lists (text-layer limits apply)
- Generic conversion across specialties/editions
- Fail-closed validation
- Provenance via `manifest.json`

---

## Known limitations

- Markdown is a textual representation, not a visual PDF reproduction
- Complex layouts (e.g. multi-column encadrés) may interleave or simplify
- Table reconstruction is best-effort; low confidence yields warnings + preserved text
- Graphics-only content in the PDF text layer may be missing
- No OCR; no binary figure extraction

Architectural acceptance of these limits: [ADR-007](./DECISIONS.md#adr-007).

---

## Non-goals

Out of scope for Tool 01:

- OCR
- Semantic / medical interpretation
- Knowledge Inventory extraction
- Blueprint generation
- Chapter splitting (Tool 02)
- Universal PDF reconstruction for arbitrary documents

---

## Usage

```bash
cd 01-learning/tools/01-pdf-to-canonical
npm install

node cli.js --specialty cardiology --edition 2022 --verbose
node cli.js --input ../../full-edn/cardiology/edition-2022/official-college.pdf --verbose
node cli.js --specialty cardiology --edition 2022 --dry-run
npm test
```

| Option | Meaning |
|---|---|
| `--specialty <name>` | Folder under `full-edn/` |
| `--edition <year>` | `2022` or `edition-2022` |
| `--input <pdf>` | Explicit PDF path |
| `--outdir <dir>` | Output directory (default: PDF directory) |
| `--root <dir>` | Path to `01-learning/` |
| `--dry-run` | Convert + validate, write nothing |
| `--verbose` | Progress on stderr |

---

## Directory layout

```
01-learning/full-edn/<specialty>/edition-<year>/
  official-college.pdf      ← input (immutable reference)
  official-college.md       ← output
  manifest.json             ← output

01-learning/tools/01-pdf-to-canonical/
  README.md
  CONTRACT.md
  CHANGELOG.md
  DECISIONS.md
  cli.js
  lib/
  test/
```
