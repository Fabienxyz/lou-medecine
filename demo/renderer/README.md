# Lou Learning Companion — Chapter Renderer

Static, chapter-agnostic preview shell for generated learning assets.

> **Architecture reference:** [`docs/renderer/README.md`](../../docs/renderer/README.md) · [`docs/renderer/READER-COMPOSITION-V1-FREEZE.md`](../../docs/renderer/READER-COMPOSITION-V1-FREEZE.md)

## Purpose

The renderer displays composed Reader views for a published Chapter Package. Navigation, view labels and content aggregation come from the **Composition layer** — not from the manifest.

## Architecture (Composition V1 — nominal path)

```
Composition Specification (corpus-composition-v1.json)
        ↓
Composition Engine          compose(manifest, spec)
        ↓
Reading View Model
        ↓
Renderer                    renderComposedView(view, …)
        ↓
Learner Layer               highlights, notes, diagrams, SVG formatting
```

```
index.html          Shell (header, tabs container, content area)
composition/        Spec, Engine, View Model validator, navigation mapper
config.js           Package Access paths, legacy prototype fallback
app.js              Boot: manifest → ViewModel → tabs → view render
renderer.js         View render, block fetch, learner layer mount
blocks.js           Pedagogical block assembly
learner-store.js    IndexedDB persistence
…                   V2.1 highlights, V2.2 notes, V2.3 SVG formatting
```

**Nominal boot** (`app.js`):

1. Read `?chapter=` from the URL.
2. Fetch `manifest.json` from the Chapter Package.
3. `LouComposition.buildReadingViewModel(manifest)` → seven views.
4. `buildNavigationFromViewModel(readingViewModel)` → tabs.
5. `renderComposedView(view, …)` per tab selection.

**Legacy fallback** (ADR-002): if `manifest.json` returns 404, the renderer switches to `01-learning/generated-assets/` and the hardcoded `TABS` registry in `config.js` — prototype chapters only. This path does **not** use Composition.

## The pedagogical block

Each view block is a sequence of pedagogical blocks (one per projected Blueprint element). See `IMPLEMENTATION_CONTRACT.md` Part B, C.7.

## Tests

```bash
cd demo/renderer
npm test           # unit tests
npm run test:smoke # Playwright browser smoke
npm run test:all   # both
```

## How chapters are loaded

```
index.html?chapter=cardio/234
```

- **Built chapter** (manifest present): Composition V1 path — seven Reader views.
- **Prototype chapter** (manifest 404): legacy `TABS` fallback with notice.
- **Manifest error** (invalid / network / server): explicit error — no silent fallback.

Legacy slug aliasing: `cardio/234-insuffisance-cardiaque` → `cardio/234`.

## Local launch

```bash
python3 -m http.server 8765
# http://localhost:8765/demo/renderer/index.html?chapter=cardio/234
```

## Adding content to a Reader view

Reader views are defined in `composition/corpus-composition-v1.json`. Chapter content is published via `lou-build` into the Chapter Package (projections, questions, scenarios). The renderer never registers tabs or labels locally.
