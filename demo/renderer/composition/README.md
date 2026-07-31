# Reader Composition V1

Corpus-level Composition Specification and runtime for Reader V1.

**Authority:** [`docs/renderer/READER-COMPOSITION-V1-FREEZE.md`](../../docs/renderer/READER-COMPOSITION-V1-FREEZE.md)

**Status:** Migration **clôturée** (Lots A–F). Nominal Reader path:

```
Composition Specification → Composition Engine → Reading View Model → Renderer
```

## Files

| File | Role |
|---|---|
| `corpus-composition-v1.json` | Single flat spec — seven views, sources, mergeOrder |
| `composition-spec-schema.js` | Static validator |
| `composition-engine.js` | `compose(manifest, spec)` |
| `reading-view-model.js` | ViewModel validator |
| `navigation.js` | `buildNavigationFromViewModel()` |
| `bootstrap.mjs` | Browser bootstrap (`LouComposition`) |

## Validation

```bash
cd demo/renderer && npm test -- test/composition-*.test.js
```

## Acceptance fixture

Chapter `cardio/234` validates projection `ref` resolution against a published manifest. The spec is corpus-level (no chapter id).
