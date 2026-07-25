# 02 — Chapter Splitter

**Version 1.0.0** — frozen, production-ready.

Tool 02 of the Lou learning pipeline.

Splits Tool 01 canonical Markdown into one canonical Markdown file per chapter.

No semantic interpretation. No medical knowledge. No AI / LLM. Deterministic document processing only.

Further Lou development should proceed to **Tool 03+** without expanding Tool 02’s scope.

See also:

| Document | Responsibility |
|---|---|
| [`CONTRACT.md`](./CONTRACT.md) | What downstream tools may rely upon |
| [`CHANGELOG.md`](./CHANGELOG.md) | What changed over time |
| [`DECISIONS.md`](./DECISIONS.md) | Why the architecture is the way it is |

---

## Purpose

```
official-college.md   (Tool 01)
        ↓
     Tool 02
        ↓
chapters/
  manifest.json
  item-<n>-<slug>.md
  …
```

Produce chapter files suitable for direct consumption by Tool 03 without manual intervention.

---

## Architectural role

```
Official College PDF
        ↓
     Tool 01 (frozen)
        ↓
 official-college.md
        ↓
     Tool 02
        ↓
 chapters/*.md
        ↓
     Tool 03 …
```

Tool 02 assumes Tool 01 already produced a valid canonical Markdown document.

---

## Architectural decisions

Long-term design choices are recorded in [`DECISIONS.md`](./DECISIONS.md).

---

## Inputs

| Input | Source |
|---|---|
| `official-college.md` | Tool 01 output |

Resolved via `--input` or `--specialty` + `--edition` under `01-learning/full-edn/`.

---

## Outputs

Default directory: `<edition>/chapters/`

| Artifact | Role |
|---|---|
| `item-<n>-<slug>.md` (or `<slug>.md`) | Exact Markdown slice for one chapter |
| `manifest.json` | Chapter index, filenames, line ranges, checksums |

Filenames are derived **only from heading text in the document** (identifier + slug). No specialty- or College-specific filename catalogs.

Each chapter file preserves the original Markdown bytes for that span — no rewriting, formatting changes, or embedded metadata.

---

## Guarantees

See [`CONTRACT.md`](./CONTRACT.md).

- Deterministic chapter files for a fixed tool version + input Markdown
- Structural H1-based chapter detection only
- Exact round-trip: concatenating chapter files reconstructs the input
- Fail-closed validation (no silent guessing)
- Generic across specialties/editions

---

## Known limitations

- Requires Tool 01-style ATX H1 chapter headings at document start
- Numeric identifiers are taken from heading text when present (e.g. `Item 234`); they are not looked up in an external catalog
- Does not interpret medical meaning of titles

---

## Non-goals

- Summarization or rewriting
- Knowledge extraction / classification
- Renaming chapters for pedagogy
- OCR or PDF access

---

## Usage

```bash
cd 01-learning/tools/02-chapter-splitter

node cli.js --specialty cardiology --edition 2022 --verbose
node cli.js --input ../../full-edn/cardiology/edition-2022/official-college.md
node cli.js --specialty cardiology --edition 2022 --dry-run
npm test
```

| Option | Meaning |
|---|---|
| `--specialty <name>` | Folder under `full-edn/` |
| `--edition <year>` | `2022` or `edition-2022` |
| `--input <md>` | Explicit `official-college.md` |
| `--outdir <dir>` | Output chapters directory |
| `--root <dir>` | Path to `01-learning/` |
| `--dry-run` | Validate without writing |
| `--verbose` | Progress on stderr |

---

## Directory layout

```
01-learning/full-edn/<specialty>/edition-<year>/
  official-college.md       ← input (Tool 01)
  chapters/
    manifest.json
    item-<n>-<slug>.md
    …

01-learning/tools/02-chapter-splitter/
  README.md
  CONTRACT.md
  CHANGELOG.md
  DECISIONS.md
  cli.js
  lib/
  test/
```

---

## Versioning

**v1.0.0** is frozen after independent certification audit.

Breaking changes after v1.0.0 require a major version bump and a contract update.
