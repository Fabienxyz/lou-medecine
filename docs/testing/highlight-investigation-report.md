# Highlight pipeline investigation report

> Date: 2026-07-26  
> Branch: `test/renderer-v2.1-smoke-suite`  
> **No production code was modified.** Instrumentation lives in `demo/renderer/test/investigate/`.  
> Raw traces: `demo/renderer/test/investigate/output/investigation-raw.json`

---

## Executive summary

Both manual bugs are **reproduced under instrumentation** using the real production mouseup path (not the PR-M01-UI test shortcut).

The **first point of divergence** from expected behaviour is:

**`LouTextHighlights.bindSelection()` returns early on every projection switch after the first**, leaving the `#content` `mouseup` listener bound to the **Story** `context` closure. All subsequent highlight creations therefore call `addTextHighlight(..., projection: "story", ...)` even when the active tab is Overview.

This is **not** a `restore()` defect. Scenario A without any intermediate reload reproduces the disappearance (mark visible immediately after creation, gone after tab round-trip). `restore()` behaves correctly: it loads `listTextHighlights(chapter, "overview")`, finds zero rows, and applies zero marks.

PR-M01-UI **passes** because it **never enters the production mouseup listener**; it calls `_onSelectionChange(host, freshContext)` directly with `projection.id: "overview"`.

---

## Instrumentation method

Test-only wrappers installed via `page.evaluate()` in `trace-instrumentation.mjs` intercept:

| Production function | What is logged |
|---|---|
| `LouTextHighlights.mount` | enter/exit, projection id |
| `LouTextHighlights.bindSelection` | **`skipped: true/false`**, projection id passed vs `_boundHost` |
| `LouTextHighlights.restore` | rows loaded per projection, mark count after |
| `LouTextHighlights._onSelectionChange` | **`context.projection.id`**, Selection, Range |
| `LouTextHighlights._applyCurrentSelection` | projection, element, range |
| `LouTextHighlights.wrapRangeInMark` | range before, mark created, DOM snapshots |
| `LouLearnerStore.addTextHighlight` | **projection written to IndexedDB** |

**Manual path simulation:** set DOM Selection → dispatch `mouseup` on `#content` → wait `requestAnimationFrame` → click `.highlight-toolbar-btn`. This enters the same listener registered by the first `bindSelection` call.

**PR-M01-UI path:** set DOM Selection → call `_onSelectionChange(host, { projection: { id }, ... })` directly → click toolbar.

Run: `node demo/renderer/test/investigate/run-investigation.mjs` (requires `python3 -m http.server 8765` from repo root).

---

## Bug #1 — Scenario A (with reload)

### Steps executed

1. Story → 3 highlights (real mouseup path)  
2. Reload → Story marks restored (3)  
3. Overview → 1 highlight  
4. Reload → Story opens (3 marks)  
5. Switch to Overview  

### Observed (automated, matches manual)

| Checkpoint | DOM marks on Overview block | IndexedDB `overview` rows | IndexedDB `story` rows |
|---|---:|---:|---:|
| After 3 Story highlights | 3 (Story tab) | 0 | 3 |
| After reload (Story) | 3 | 0 | 3 |
| After Overview highlight created | **1** | **0** | **4** |
| After 2nd reload (Story) | 3 (4th record not restorable on Story text) | 0 | 4 |
| **Final Overview visit** | **0** | **0** | 4 |

The Overview phrase `"Sur le plan physiopathologique"` is stored as:

```json
{
  "id": 4,
  "projection": "story",
  "element": "MM-pump-decompensation",
  "selector": { "exact": "Sur le plan physiopathologique" }
}
```

`listTextHighlights(chapter, "overview")` returns `[]` at every Overview mount.

### Creation pipeline trace (Overview highlight, manual path)

| Stage | Evidence |
|---|---|
| selectionchange fired | ✓ `selectionchange` event logged |
| current Selection | `"Sur le plan physiopathologique"` |
| Range | single `#text` node, offsets 41–71 (Overview walkthrough) |
| toolbar shown | ✓ `toolbarVisible: true` |
| highlight command | ✓ `_applyCurrentSelection` entered |
| wrapRangeInMark() | ✓ mark created, text preserved inside `<mark>` |
| DOM before → after | text length unchanged (4913); 1 mark inserted |
| saved record | **`projection: "story"`** ← divergence |
| IndexedDB | 4 rows under `story`, 0 under `overview` |

Trace excerpt — `_onSelectionChange` while Overview tab is active:

```
selectionchange.projectionId = "story"   ← stale closure, not "overview"
addTextHighlight.projection = "story"    ← written to wrong bucket
```

Trace excerpt — Overview mount after final tab switch:

```
bindSelection: { projectionId: "overview", skipped: true }
restore.rows:   { projectionId: "overview", rowCount: 0 }
restore.exit:   { markCount: 0 }
```

### Bug #1 — Scenario A variant (no reload)

| Checkpoint | Overview DOM marks |
|---|---:|
| Immediately after Overview highlight | **1** |
| After Story → Overview round-trip | **0** |

IndexedDB: Overview highlight still under `story`, `overview` bucket empty.

**Conclusion:** disappearance happens on projection switch because (1) DOM is rebuilt (`host.innerHTML = ""` in `LouBlocks.render`), and (2) `restore()` correctly finds no Overview rows. Reload is not required.

---

## Bug #2 — Scenario B (clear site, Overview first highlight)

### Steps executed

1. Clear IndexedDB  
2. Boot (Story loads first — `showTab(0)` in `app.js`)  
3. Click Overview tab  
4. Create first highlight via real mouseup path  

### Observed

| Check | Result |
|---|---|
| wrapRangeInMark | ✓ mark created |
| Text inside mark | ✓ `"Sur le plan physiopathologique"` |
| Walkthrough `textContent` still contains phrase | ✓ `phraseStillInText: true` |
| IndexedDB projection | **`story`** (not `overview`) |
| `_onSelectionChange` projectionId | **`story`** while Overview tab active |

Under this instrumentation run, **text did not vanish from the DOM** — it was wrapped in a `<mark>`. The record was persisted under the wrong projection.

### Reconciling “words disappear” with trace evidence

Two distinct observations, same root cause family:

1. **Immediate tab navigation (same session):** mark is visible on Overview until DOM rebuild; after leaving and returning, mark is gone (Bug #1 mechanism). This matches “highlight disappeared” without requiring text loss at creation time.

2. **Possible creation-time text loss (not triggered in this run):** `wrapRangeInMark` fallback path (`extractContents` → empty `fragment.textContent` → return `null`) would remove text without inserting a mark. See `text-highlights.js` lines 266–268. Not observed in Scenario B with a clean in-paragraph selection; remains a separate failure mode for irregular ranges.

---

## Projection change pipeline

### Before leaving Overview (after highlight created)

```
DOM: 1 × mark.learner-highlight ("Sur le plan physiopathologique")
IDB story:    [{ exact: "Sur le plan physiopathologique", projection: "story" }]
IDB overview: []
```

### Tab switch to Story

```
mount(projection: "story")
  restore(story) → 3 original marks restored (4th phrase not in Story walkthrough text → skipped)
  bindSelection(story context) → skipped: true
DOM rebuilt; Overview mark destroyed
```

### Tab switch back to Overview

```
mount(projection: "overview")
  restore(overview) → rowCount: 0
  bindSelection(overview context) → skipped: true
DOM: 0 marks
```

---

## Reload pipeline

After Scenario A second reload (landing on Story):

- `restore(story)` loads 4 IndexedDB rows for `story`
- Only 3 produce DOM marks (`findRangeForSelector` fails for `"Sur le plan physiopathologique"` on Story prose — phrase exists only in Overview markdown)
- Overview bucket remains empty throughout

The 4th record **survives in IndexedDB but is ignored on both projections** after reload.

---

## Path comparison: PR-M01-UI vs real browser

| Step | PR-M01-UI (Playwright helper) | Real browser / manual path |
|---|---|---|
| Selection set | `window.getSelection().addRange(range)` | User drag or test `mouseup` dispatch |
| Enter selection handler | **`_onSelectionChange(host, { projection: { id: "overview" } })` direct call** | **`#content` mouseup listener** from first `bindSelection` |
| `_onSelectionChange` context | Fresh per call (`overview` on Overview tab) | **Frozen Story context** from boot |
| `bindSelection` on Overview mount | Called, **`skipped: true`** | Same |
| `_applyCurrentSelection` | ✓ entered | ✓ entered |
| `wrapRangeInMark` | ✓ entered | ✓ entered |
| `addTextHighlight` projection | **`overview`** | **`story`** |
| `restore` on return to Overview | rowCount: **1**, mark restored | rowCount: **0**, no mark |

### Functions entered vs skipped

| Function | PR-M01-UI | Manual path |
|---|---|---|
| `mount` | ✓ each tab | ✓ each tab |
| `restore` | ✓ (correct rows) | ✓ (empty for overview) |
| `bindSelection` body | **skipped** after 1st | **skipped** after 1st |
| `mouseup` listener | **skipped** (never used for Overview create) | **✓ used** |
| `_onSelectionChange` | ✓ direct, fresh context | ✓ via listener, **stale context** |
| `_applyCurrentSelection` | ✓ | ✓ |
| `wrapRangeInMark` | ✓ | ✓ |
| `addTextHighlight` | ✓ `overview` | ✓ **`story`** |

**First functional divergence:** `_onSelectionChange(host, context)` receives different `context.projection.id` values because PR-M01-UI bypasses the mouseup listener whose closure captured Story context at boot.

Production code responsible (read-only reference):

```28:43:demo/renderer/text-highlights.js
    bindSelection(host, context) {
        const self = this;
        if (this._boundHost === host) {
            return;
        }
        this._boundHost = host;
        // ...
        host.addEventListener("mouseup", function (event) {
            // ...
                self._onSelectionChange(host, context);
```

`mount()` passes a fresh `context` on every tab, but `bindSelection` does not re-bind when `_boundHost === host` (always `#content`).

---

## DOM validation (Overview highlight creation, manual path)

| Check | Before wrap | After wrap |
|---|---|---|
| Walkthrough text length | 4913 | 4913 |
| Text node count | unchanged | unchanged |
| Mark inserted | — | `<mark class="learner-highlight" data-learner="true">` |
| Mark text | — | `"Sur le plan physiopathologique"` |
| Parent of mark | — | `#text` node replaced by mark wrapping same text |
| Phrase in plain textContent | yes | yes (inside mark) |

No empty text nodes or missing phrase observed in Scenario B creation step.

---

## Storage validation

### After Overview highlight (manual path)

| id | projection | exact | survives tab switch? | survives reload? |
|---:|---|---|---|---|
| 1–3 | story | Story phrases | ✓ (Story tab) | ✓ |
| 4 | **story** | Sur le plan physiopathologique | ✗ on Overview (wrong bucket + DOM rebuild) | ✗ (selector not found in Story prose) |

Record **does not disappear** from IndexedDB. It **does not change**. It is **ignored** by Overview `restore()` because `projection !== "overview"`, and ignored by Story `restore()` because `findRangeForSelector` returns null for Overview-only text.

---

## Why PR-M01 / PR-M01-UI pass in the smoke suite

PR-M01-UI calls `_onSelectionChange` with an explicit `projectionId` argument, **never exercising the stale mouseup closure**. Storage receives `projection: "overview"`, so `restore()` on Overview tab finds the row and re-applies the mark.

PR-M01 (programmatic API) writes the projection parameter directly to `addTextHighlight`, same effect.

Neither test reflects real student interaction after visiting Story first.

---

## First divergence point (required deliverable)

| Order | Location | Expected | Observed (manual path) |
|---:|---|---|---|
| **1** | `bindSelection()` line 30–32 | Re-bind listener with current projection context on each mount | **`return` early** — listener not updated |
| **2** | `#content` mouseup → `_onSelectionChange` | `context.projection.id === activeTabProjection` | **`"story"` while Overview active** |
| **3** | `addTextHighlight` | `projection: "overview"` | **`projection: "story"`** |
| 4 | Tab switch / DOM rebuild | mark persisted under active projection | mark destroyed, nothing to restore for overview |
| 5 | `restore(overview)` | re-apply mark | correctly finds 0 rows — **not a restore bug** |

---

## Artifacts

| File | Purpose |
|---|---|
| `demo/renderer/test/investigate/trace-instrumentation.mjs` | Test-only API wrappers |
| `demo/renderer/test/investigate/run-investigation.mjs` | Scenario runner |
| `demo/renderer/test/investigate/output/investigation-raw.json` | Full event + DOM + IDB traces |

Re-run investigation:

```bash
python3 -m http.server 8765   # repo root
node demo/renderer/test/investigate/run-investigation.mjs
```

Expected console output (2026-07-26 run):

```
Scenario A bug reproduced: true
Scenario A no-reload bug reproduced: true
Scenario B bug reproduced: false   # DOM wrap OK; wrong projection in IDB
PR-M01-UI bug reproduced: false
```

---

## Not in scope (per instructions)

No fixes proposed. No production files modified.
