# Lou Learning Companion — Chapter Renderer

Static, chapter-agnostic preview shell for generated learning assets. It reuses the visual design of the legacy `demo/legacy/221/` prototype without embedding medical content in the renderer itself.

## Purpose

The renderer displays markdown files produced by the learning pipeline under `01-learning/generated-assets/`. Milestone 1 loads only the **Histoire** tab; other tabs show a placeholder until their assets are implemented.

## Architecture

```
index.html          Shell (header, tabs container, content area)
styles.css          Legacy visual design
lib/marked.min.js   Local markdown parser (vendored from npm)
config.js           Paths, tab registry, URL/chapter helpers
markdown.js         Thin marked wrapper
renderer.js         Fetch, DOM injection, header metadata hooks
app.js              Boot sequence, tabs, chapter loading
```

Data flow:

1. `app.js` reads `?chapter=` from the URL.
2. `config.js` resolves asset paths relative to the current page URL (works in Cursor Preview over HTTP).
3. `renderer.js` fetches markdown and injects HTML.
4. `markdown.js` converts markdown to HTML via `marked`.

Future metadata (not implemented yet):

1. `loadChapterMetadata()` in `app.js` will fetch `manifest.json` (or `chapter.json`) from the chapter folder.
2. `config.resolveManifestPath(chapter)` builds the manifest URL.
3. `renderer.applyHeaderMetadata(data)` fills header placeholders (`#specialty`, `#chapter-line`, etc.).

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
| `config.js` | `ASSETS_ROOT`, tab registry (`TABS`), path resolution, messages |
| `markdown.js` | Markdown → HTML via `marked` |
| `renderer.js` | HTTP helpers, content injection, header metadata application |
| `app.js` | Tab UI, chapter boot, orchestrates loading |
| `lib/marked.min.js` | Vendored `marked` bundle (offline, no CDN) |
| `package.json` | Declares `marked` version; `postinstall` refreshes `lib/` |

## How chapters are loaded

Chapters are selected with a single URL parameter:

```
index.html?chapter=cardio/234-insuffisance-cardiaque
```

The value maps to:

```
01-learning/generated-assets/{chapter}/histoire.md
```

Examples:

- `?chapter=cardio/221-atherome`
- `?chapter=cardio/234-insuffisance-cardiaque`

If `chapter` is missing or invalid, the renderer shows an error message. Unimplemented tabs skip fetch and show `"Content not yet implemented."`.

## Local launch

The renderer must be served over HTTP (relative fetches do not work reliably from `file://`).

From the repository root:

```bash
python3 -m http.server 8765
```

Then open:

```
http://localhost:8765/demo/renderer/index.html?chapter=cardio/234-insuffisance-cardiaque
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
?chapter=cardio/234-insuffisance-cardiaque
```

Path resolution uses `new URL(relative, window.location.href)`, so it works with whatever base URL Cursor Preview serves.

## Adding future generated assets

1. **Add a tab** — Edit `TABS` in `config.js`: set `file` to the markdown filename and `implemented: true`.
2. **Generate content** — Place the file under `01-learning/generated-assets/{chapter}/`.
3. **Header metadata** — When ready, generate `manifest.json` per chapter and implement the fetch in `loadChapterMetadata()` (`app.js`). No structural changes required.
4. **Rename manifest** — Change `MANIFEST_FILENAME` in `config.js` if the pipeline uses `chapter.json` instead.

No changes to `index.html` or `renderer.js` are needed for new markdown tabs beyond the config registry.
