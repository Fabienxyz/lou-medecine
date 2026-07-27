# Lou Learning Companion — Chapter Renderer

Static, chapter-agnostic preview shell for generated learning assets. It reuses the visual design of the legacy `demo/legacy/221/` prototype without embedding medical content in the renderer itself.

> **Architecture reference:** [`docs/renderer/README.md`](../../docs/renderer/README.md) — authoritative Renderer V2 specification, migration plan, and roadmap. This file is the operational quick-start only.

## Purpose

The renderer displays generated projections for a chapter. For a chapter that ships a `manifest.json`, the tab list, the projection paths and the visual availability all come from the manifest — the hardcoded `TABS` registry in `config.js` is only the fallback for legacy asset folders that have no manifest.

## Architecture

```
index.html          Shell (header, tabs container, content area)
styles.css          Layout, pedagogical block, learner layer
lib/marked.min.js   Local markdown parser (vendored from npm)
config.js           Paths, legacy tab fallback, URL/chapter helpers
markdown.js         Thin marked wrapper
learner-store.js    IndexedDB: diagrams, highlights, notes, svg_text_formats
text-highlights.js  V2.1 text selection highlights
caret-anchor.js     V2.2 CaretAnchor primitives
inline-notes.js     V2.2 walkthrough notes
svg-loader.js       V2.3 async inline SVG loader
inline-formatting.js V2.3 SVG text stream, selection, formatting
blocks.js           Pedagogical block assembly and learner affordances
renderer.js         Fetch, markdown preparation, visual state notices, mounting
app.js              Boot sequence, tabs, chapter loading
```

Data flow:

1. `app.js` reads `?chapter=` from the URL and fetches `manifest.json`.
2. `config.js` resolves asset paths relative to the current page URL (works in Cursor Preview over HTTP).
3. `renderer.prepareLearnerMarkdown` strips front matter and the claim-trace block, turns claim anchors into "source" buttons, and **preserves Blueprint-element anchors** as block boundary markers.
4. `markdown.js` converts markdown to HTML via `marked`.
5. `blocks.js` groups the result into pedagogical blocks, binds each Official Visual to its block by element ID, and mounts the learner affordances.

## The pedagogical block

Each projection body is a sequence of blocks, one per projected Blueprint element (`IMPLEMENTATION_CONTRACT.md` Part B, C.7):

```
Question              the element's question, from the Blueprint       REQUIRED
Official Visual       bound by element ID                             OPTIONAL
  📷 Ajouter mon schéma   learner layer, on every block
Guided Walkthrough    the canonical explanation                       REQUIRED
```

A block boundary is an `h2` whose anchor is a known element ID. Content before the first such heading stays a preamble — the renderer never invents a block for content that is not shaped as one, and never places a visual by ordinal position.

An Official Visual has three availability states, kept distinguishable and never collapsed: **published** renders a figure with manifest-supplied alt text; **withheld** and **planned-not-built** render an explicit notice; an element with no manifest entry warrants no visual and renders nothing. The walkthrough publishes either way.

## The learner layer

Learner-owned artifacts in IndexedDB, namespaced by chapter:

- **Personal Diagrams** — photo anchored to element ID (every block).
- **Text highlights (V2.1)** — prose walkthrough selections.
- **Walkthrough notes (V2.2)** — caret-anchored notes in official walkthrough.
- **SVG inline formatting (V2.3)** — one format per range on official SVG text (`svg_text_formats` store).

None are generated content, never modify the Official Layer, and never ship in Git beside medical content.

## Tests

```bash
cd demo/renderer
npm test           # unit tests (186+)
npm run test:smoke # Playwright browser smoke (48)
npm run test:all   # both
```

Expected manifest shape:

```json
{
  "specialty": "Cardiologie",
  "chapterLine": "Chapitre 234",
  "chapterTitle": "Insuffisance cardiaque",
  "readTime": "12 min",
  "objectives": ["Objectif 1", "Objectif 2"]
}
```

To switch filename later, change `MANIFEST_FILENAME` in `config.js` only.

## File responsibilities

| File | Role |
|------|------|
| `index.html` | Page structure, script load order, header placeholders |
| `styles.css` | Layout, typography, tabs, content area |
| `config.js` | `ASSETS_ROOT`, legacy tab fallback (`TABS`), path resolution, messages |
| `markdown.js` | Markdown → HTML via `marked` |
| `learner-store.js` | IndexedDB store for Personal Diagrams |
| `blocks.js` | Block assembly, visual binding, learner affordances, degradation |
| `renderer.js` | HTTP helpers, markdown preparation, visual notices, mounting |
| `app.js` | Tab UI, chapter boot, orchestrates loading |
| `lib/marked.min.js` | Vendored `marked` bundle (offline, no CDN) |
| `package.json` | Declares `marked` and test dependencies; `postinstall` refreshes `lib/` |

## How chapters are loaded

Chapters are selected with a single URL parameter:

```
index.html?chapter=cardio/234
```

Resolution is canonical-first. The renderer looks for `01-learning/chapters/{chapter}/manifest.json` — the build's output location — and every projection in that manifest becomes a tab. Only if no manifest exists there does it fall back to the superseded prototype folder `01-learning/generated-assets/{chapter}/` with the `TABS` registry, and it then displays a notice saying the content predates the architecture and is neither traced nor verified.

There is no per-chapter allowlist in the renderer: a chapter is served from the build output whenever that output exists, so a newly built chapter needs no renderer change. Legacy prose slugs are aliased onto the built chapter id (`cardio/234-insuffisance-cardiaque` → `cardio/234`) so old links keep working without copying artifacts between locations.

Examples:

- `?chapter=cardio/234` (built chapter, manifest-driven)
- `?chapter=cardio/234-insuffisance-cardiaque` (legacy slug, aliased to `cardio/234`)
- `?chapter=cardio/221-atherome` (never built — prototype fallback, shown with a notice)

If `chapter` is missing or invalid, the renderer shows an error message. Unimplemented tabs skip fetch and show `"Content not yet implemented."`.

## Local launch

The renderer must be served over HTTP (relative fetches do not work reliably from `file://`).

From the repository root:

```bash
python3 -m http.server 8765
```

Then open:

```
http://localhost:8765/demo/renderer/index.html?chapter=cardio/234
```

### Updating `marked`

```bash
cd demo/renderer
npm install
```

`postinstall` copies the bundled file into `lib/marked.min.js`.

## Cursor Preview

1. Open `demo/renderer/index.html` in the editor.
2. Use **Cursor Preview** (Simple Browser / Live Preview).
3. Append the chapter query string to the preview URL:

```
?chapter=cardio/234
```

Path resolution uses `new URL(relative, window.location.href)`, so it works with whatever base URL Cursor Preview serves.

## Adding a projection

Nothing is registered in the renderer. Declare the projection in the chapter's `projections.yaml` and run `lou-build build`; the manifest then carries its tab label, path, status and element list, and the renderer picks it up. The only requirement on the content is the block shape: one `## question {#ELEMENT-ID}` per projected element.

To change the manifest filename, edit `MANIFEST_FILENAME` in `config.js` only.
