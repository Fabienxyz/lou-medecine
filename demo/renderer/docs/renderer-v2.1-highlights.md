# Renderer V2.1 — Text selection highlights

> **Status:** Frozen implementation contract  
> **Tag:** `renderer-v2.1.0`  
> **Module:** `text-highlights.js` → `window.LouTextHighlights`  
> **Parent:** [architecture-principles.md](./architecture-principles.md)

This document is reconstructed from the code at tag `renderer-v2.1.0`. It describes **only** the text highlight system. It is the implementation contract for V2.1.

---

## 1. Objectif fonctionnel

Permettre à l'apprenant de **surligner** un passage sélectionné dans le texte officiel d'un walkthrough, de le **persister** localement, et de le **restaurer** automatiquement au rechargement ou au changement d'onglet (projection).

Caractéristiques :

- Sélection de texte → toolbar flottante → action « Surligner »
- Overlay visuel via `<mark class="learner-highlight">` — pas de modification du markdown source
- Scope : conteneurs `[data-official="true"]` uniquement
- Persistance : IndexedDB, clé `(chapter, projection, element, selector)`
- Un highlight ne peut pas être créé **à l'intérieur** d'un highlight existant (pas de nesting)

---

## 2. Architecture générale

```
app.js
  └─ loadTabContent → renderer.renderProjection(html, context)
        └─ blocks.js render(host, html, context)
              ├─ assemble (Official Layer)
              ├─ hydrate (other learner artifacts — separate concern)
              └─ finally: LouTextHighlights.mount(host, context)
                    ├─ restore()
                    └─ bindSelection()
```

Highlights are a **second pass** over an already assembled official DOM. They are not part of markdown parsing.

---

## 3. Responsabilités des modules

| Module | Rôle vis-à-vis des highlights |
|---|---|
| **`text-highlights.js`** | Restore, selection UI, TextQuoteSelector, DOM wrap — **owner** |
| **`blocks.js`** | Orchestration : calls `LouTextHighlights.mount` in `finally` after hydrate |
| **`learner-store.js`** | CRUD `text_annotations` store |
| **`renderer.js`** | Delegates to `LouBlocks.render` — no highlight logic |
| **`app.js`** | Builds `context` (chapter, projection, store) per tab |
| **`index.html`** | Loads `text-highlights.js` before `blocks.js` |
| **`styles.css`** | `.highlight-toolbar`, `mark.learner-highlight` |

---

## 4. Lifecycle — `LouTextHighlights.mount`

```
mount(host, context)
  try
    await restore(host, context)
  catch err
    console.warn — restore failed; binding continues
  finally
    bindSelection(host, context)
```

**Invariant :** selection binding always runs, even if restore or upstream hydrate failed.

---

## 5. Lifecycle — création

```
mouseup on #content (requestAnimationFrame)
  → _onSelectionChange(host, _bindContext)
      → validate selection (non-collapsed, inside official walkthrough)
      → reject if _selectionInsideHighlight
      → store _selectionContext { host, context, walkthrough, element, range clone }
      → _showToolbar(range)

click "Surligner"
  → _applyCurrentSelection()
      → selectorFromRange(walkthrough, range)
      → wrapRangeInMark(range)
      → store.addTextHighlight(chapter, projection, element, selector)
          → .then: dismissToolbar()
          → .catch: wrapped.remove(); dismissToolbar()
```

**Invariant :** toolbar dismisses only **after** IndexedDB write succeeds (or DOM rollback on failure).

---

## 6. Lifecycle — `bindSelection`

```
bindSelection(host, context)
  _bindContext = context                    // ALWAYS updated (even if host unchanged)
  if _boundHost === host: return            // listener already attached
  _boundHost = host
  dismissToolbar()
  attach host mouseup → _onSelectionChange(host, _bindContext)
  attach document keydown Escape → dismissToolbar
  attach document mousedown → dismissToolbar (unless click on toolbar)
```

**Invariant :** `_bindContext` must reflect the **current** projection on every mount, because `#content` is stable across tab switches but `context.projection` changes.

---

## 7. Pipeline render — ordre des passes

Within `blocks.js` `render()` at `renderer-v2.1.0`:

| Step | Action |
|---|---|
| 1 | `assemble(html, context)` — official pedagogical blocks |
| 2 | `host.innerHTML = ""`; append fragment |
| 3 | Other learner affordances / hydration (same function, prior steps) |
| 4 | `try { await hydrate(...) } catch { warn }` |
| 5 | **`finally { await LouTextHighlights.mount(host, context) }`** |

Highlights always mount **last** among steps in this `render()` function.

---

## 8. Modèle IndexedDB

| Property | Value |
|---|---|
| Database | `lou-learner` |
| `DB_VERSION` | `2` |
| Store | `text_annotations` |
| Key | `id` (autoIncrement) |

### Record shape (highlight)

| Field | Type | Description |
|---|---|---|
| `id` | number | Auto-generated |
| `chapter` | string | e.g. `"cardio/234"` |
| `projection` | string | Manifest projection id |
| `element` | string | Blueprint element id (block) |
| `selector` | TextQuoteSelector | See §9 |
| `kind` | `"highlight"` | Record discriminator |
| `created` | string | ISO-8601 |

### API (`learner-store.js`)

| Method | Behaviour |
|---|---|
| `addTextHighlight(chapter, projection, element, selector)` | Insert record |
| `listTextHighlights(chapter, projection)` | Filter by chapter + projection |

At V2.1.0, `listTextHighlights` filters `row.projection === projection` (all rows in store for that projection).

### Connection robustness

- `_invalidateConnection`, `_attachConnectionHandlers`, `db.onversionchange`
- `request.onblocked` logs warning

---

## 9. Modèle TextQuoteSelector

```typescript
interface TextQuoteSelector {
  type: "TextQuoteSelector";
  exact: string;      // selected text
  prefix?: string;    // up to 32 chars before exact
  suffix?: string;    // up to 32 chars after exact
}
```

Built by `selectorFromRange(root, range)`:

1. Map range boundaries to global offsets via `_textOffset`
2. `full = root.textContent`
3. `exact = full.slice(start, end)`
4. `prefix = full.slice(max(0, start - 32), start)`
5. `suffix = full.slice(end, min(full.length, end + 32))`

Resolved by `findRangeForSelector(root, selector)`:

1. Scan `full.indexOf(exact)` with advancing `idx`
2. At each candidate, verify `prefix` and `suffix` match
3. Return `_rangeFromTextOffsets(root, pos, pos + exact.length)` on first full match

---

## 10. Espace de coordonnées texte

At V2.1, the coordinate space is **`walkthrough.textContent`** equivalently produced by `_forEachTextNode`:

- TreeWalker `SHOW_TEXT` over the walkthrough subtree
- **All** text nodes included — including text inside `<mark class="learner-highlight">`
- No filtering of learner wrappers
- Cumulative offset `[nodeStart, nodeStart + nodeLen)` per node

This space is shared convention for offset arithmetic and selector prefix/suffix.

---

## 11. Algorithme de restauration

```
restore(host, context)
  rows = listTextHighlights(chapter, projection.id)
  for each record:
    block = host.querySelector([data-element=record.element])
    walkthrough = block.querySelector(.block-walkthrough)
    range = findRangeForSelector(walkthrough, record.selector)
    if range && !_rangeAlreadyHighlighted(range):
      wrapRangeInMark(range)
```

### `_rangeAlreadyHighlighted(range)`

Returns true if `range.commonAncestorContainer` (or its parent element) has ancestor `.learner-highlight`.

**Purpose :** idempotent restore — double mount does not nest marks.

---

## 12. Half-open ranges — `_rangeFromTextOffsets`

Global offsets use **half-open** semantics `[start, end)`:

```
for each text node [nodeStart, nodeEnd):
  if !startSet && start < nodeEnd:
    setStart(node, max(0, start - nodeStart)); startSet = true
  if end > nodeStart && end <= nodeEnd:
    setEnd(node, end - nodeStart); endSet = true
```

**Why :** after `wrapRangeInMark` splits text nodes, `end === nodeStart` of a later node must not overwrite `setEnd` incorrectly.

Returns `null` if `!startSet || !endSet || range.collapsed`.

---

## 13. Gestion des wrappers `<mark>`

### Creation — `wrapRangeInMark(range)`

1. Create `<mark class="learner-highlight" data-learner="true">`
2. Try `range.surroundContents(mark)`
3. On failure (partial selection across block boundaries):  
   `extractContents` → if empty text, return `null`  
   else append fragment to mark, `range.insertNode(mark)`

### Transparent wrapper

- Mark adds **no characters** to `textContent` — official text length unchanged (PE-06)
- Text inside mark remains in coordinate space for future selectors

### Nesting

- **Creation :** prevented by `_selectionInsideHighlight` (toolbar not shown)
- **Restore :** prevented by `_rangeAlreadyHighlighted`

---

## 14. Invariants

| ID | Invariant |
|---|---|
| H1 | Highlights apply only inside `[data-official="true"]` walkthroughs |
| H2 | Official markdown / storage never mutated |
| H3 | Records scoped by `(chapter, projection)` |
| H4 | Restore is idempotent (no nested marks) |
| H5 | Half-open offset mapping on fragmented text nodes |
| H6 | `walkthrough.textContent` length unchanged by highlight restore |
| H7 | Every mark has non-empty `textContent` (healthy mark) |
| H8 | `_bindContext` updated every mount — projection always current |
| H9 | DOM rollback if `addTextHighlight` rejects after wrap |
| H10 | Toolbar dismiss after persist completes (success or rollback) |
| H11 | Selection inside existing highlight rejected for **new** highlights |
| H12 | `mount` runs in `finally` — not blocked by hydrate failure |

---

## 15. Interactions avec `blocks.js`

- **Single hook :** `LouTextHighlights.mount(host, context)` in `render()` `finally`
- **Context passed through :** `{ chapter, projection, manifest, config, renderer, store }` — highlights use `chapter`, `projection.id`, `store`
- **DOM host :** `#content` element — stable across tab switches; inner HTML rebuilt each render

---

## 16. Interactions avec `learner-store.js`

- Store name constant: `HIGHLIGHTS = "text_annotations"`
- Separate from other learner stores
- `_listForChapter` + projection filter

---

## 17. Interactions avec `renderer.js` / `app.js`

- `app.js` → `renderer.renderProjection(html, context)` on tab load
- `renderer.js` → `LouBlocks.render` only
- Tab switch → full re-render → `mount` → `restore` + `bindSelection`

---

## 18. Stratégie de tests

### Unit tests (`demo/renderer/test/renderer.test.js`)

- Highlight restore after re-render from stored selectors
- `bindSelection runs when highlight restore rejects`
- `selection mount runs when hydrate rejects`
- `healthy highlight restore behaviour is unchanged`
- **`renderer — text highlight restore regressions`** describe block:
  - Three highlights in different paragraphs survive reload
  - New highlight after reload survives next reload
  - `restore()` idempotent when called twice
  - `_rangeFromTextOffsets uses half-open boundaries on split text nodes`

### Browser smoke (`demo/renderer/test/smoke/`)

Documented in `docs/testing/renderer-v2.1-smoke-matrix.md` at tag `renderer-v2.1.0`:

| Suite | Covers |
|---|---|
| `01-creation` | CR-01 … CR-10 |
| `02-persistence` | PE-01 … PE-06 |
| `03-projections` | PR-01 … PR-M01-UI |
| `04-lifecycle` | LC-01 … LC-05 |
| `05-dom-integrity` | DI-01 … DI-07 |
| `06-selection` | SE-01 … SE-04 |

### Investigation tooling

`demo/renderer/test/investigate/` — projection-binding traces (read-only instrumentation, tag `renderer-v2.1.0`).

---

## 19. Risques techniques connus

| Risk | Mitigation in V2.1 |
|---|---|
| Text-node fragmentation after multiple wraps | Half-open `_rangeFromTextOffsets` |
| Double restore nests marks | `_rangeAlreadyHighlighted` |
| Stale projection in mouseup closure | `_bindContext` refreshed each `bindSelection` |
| Persist fails after DOM wrap | Remove mark on catch |
| Toolbar dismiss before persist completes | Dismiss in Promise `.then` / `.catch` |
| `surroundContents` throws on complex ranges | extractContents fallback; empty fragment → null |
| Selection inside mark | Toolbar suppressed (SE-04) |
| Wrong projection stored | PR-M01 / PR-M01-UI smoke tests |
| Hydrate failure blocks highlights | `finally` mount in `blocks.render` |

---

## 20. Décisions architecturales finales (V2.1)

| Decision | Rationale |
|---|---|
| Separate module `text-highlights.js` | Isolate second-pass overlay logic |
| Separate store `text_annotations` | Independent persistence (architecture-principles §7) |
| TextQuoteSelector with prefix/suffix | Survive minor content shifts; W3C-aligned pattern |
| `root.textContent` coordinate space | Stable, testable; marks are transparent |
| Half-open `[start, end)` | Correctness on split text nodes |
| `_boundHost` + `_bindContext` split | One listener per host; fresh projection context |
| `mount` = restore then bind, in `finally` upstream | Resilience + guaranteed interactivity |
| Reject selection inside highlight | Prevent nesting; distinct from "transparent wrapper" semantics |
| No highlight editing/removal UI in V2.1 | Creation-only scope |

---

## 21. Public surface (frozen)

| Export | Purpose |
|---|---|
| `mount(host, context)` | Entry point |
| `restore(host, context)` | Callable independently; usually via mount |
| `bindSelection(host, context)` | Callable independently; usually via mount |

Internal methods (`_rangeFromTextOffsets`, `selectorFromRange`, etc.) are **not** a public API — but unit tests may invoke them for regression.

---

## 22. CSS classes (frozen)

| Class | Element | Role |
|---|---|---|
| `learner-highlight` | `<mark>` | Highlight overlay |
| `highlight-toolbar` | `<div role="toolbar">` | Floating UI |
| `highlight-toolbar-btn` | `<button>` | Apply highlight |

Official walkthrough marker: `[data-official="true"]` on `.block-walkthrough`.

---

## 23. Stability rules for future versions

1. **Do not modify `text-highlights.js`** when adding V2.2+ layers — mount them after highlights.
2. Run full V2.1 smoke matrix before merging any renderer change.
3. New text layers must document coordinate space relative to §10.
4. Extraction of shared anchoring code requires proven non-regression on V2.1 gate.

See [renderer-v2.2-walkthrough-notes.md](./renderer-v2.2-walkthrough-notes.md) for the next layer.
