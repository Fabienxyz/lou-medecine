# Renderer V2.1 — Smoke Suite Report

> Branch: `test/renderer-v2.1-smoke-suite`  
> Run date: 2026-07-26  
> Command: `cd demo/renderer && npm run test:all`

## Executive summary

| Layer | Tests | Result |
|---|---:|---|
| Contract + unit (`npm test`) | 35 | **35 pass** |
| Browser smoke (`npm run test:smoke`) | 45 | **45 pass** |
| **Total** | **80** | **80 pass** |

No failing tests remain. No production code was modified on this branch.

During suite construction, several failures were traced to **test infrastructure** (async tab switching, shared element ids between Story/Overview, fixture phrase mismatches, headless selection geometry). Those were corrected in test code only. One **potential product risk** was observed during development (see bugs section).

---

## 1. Functional coverage achieved

### Automated (browser — Playwright)

| Area | Scenarios | Spec file |
|---|---|---|
| Creation | CR-01 … CR-10 | `01-creation.spec.mjs` |
| Persistence | PE-01 … PE-06 | `02-persistence.spec.mjs` |
| Projections | PR-01 … PR-08 | `03-projections.spec.mjs` |
| Renderer lifecycle | LC-01 … LC-05 | `04-lifecycle.spec.mjs` |
| DOM integrity | DI-01 … DI-06 | `05-dom-integrity.spec.mjs` |
| Selection | SE-01 … SE-07 | `06-selection.spec.mjs` |
| Robustness | RO-01 … RO-03 | `08-robustness.spec.mjs` |

### Automated (unit — Node/JSDOM)

| Area | Scenarios | File |
|---|---|---|
| Learner storage | ST-U01 … ST-U05 | `07-storage.unit.test.js` |
| Block contract + highlight regressions | 25 scenarios | `renderer.test.js` |

### Documented but not automated

| ID | Scenario | Reason |
|---|---|---|
| PR-09, PR-10 | Actors, Readiness projections | `manifest.known_absent` for cardio/234 |
| ST-B02 | Second chapter browser isolation | Only one built chapter in repository |
| LC-06 | Restore call-count hook | No test seam in production code |
| SE-08 | Real mouse drag → toolbar → click | Fragile in CI; covered indirectly via `_onSelectionChange` |
| SE-09 | Escape dismisses toolbar | Manual UX check |
| RO-04 | 20+ highlights performance | Manual / profiling |
| RO-05 | IndexedDB quota exceeded | Manual / destructive |

Full matrix: [`renderer-v2.1-smoke-matrix.md`](./renderer-v2.1-smoke-matrix.md)

---

## 2. Discovered bugs

### No open failing tests

All automated scenarios pass against current production code on `cardio/234`.

### Potential product risks (observed during suite development, not failing)

#### BUG-V21-001 — Overlapping highlight creation without selection guard

| Field | Detail |
|---|---|
| **Severity** | Medium |
| **Suspected subsystem** | `wrapRangeInMark()` / highlight creation path |
| **Reproduction** | Programmatically create two highlights where phrase B overlaps phrase A in the same paragraph **without** going through selection UI (e.g. duplicate stored rows, future import, or API misuse) |
| **Expected** | Second wrap rejected or merged; no nested `<mark>` |
| **Observed (during dev)** | Nested `learner-highlight` mark when `sameParagraphPhrases` overlapped `threeParagraphPhrases` ("volume d'éjection systolique" created twice in one session without reload) |
| **Mitigation today** | Selection UI rejects re-highlighting inside existing marks (SE-04 passes). Normal student workflow is protected. |
| **Recommendation** | Add creation-path guard mirroring `_rangeAlreadyHighlighted` before `wrapRangeInMark` in `_applyCurrentSelection` |

#### BUG-V21-002 — Story/Overview share Blueprint element id (testability)

| Field | Detail |
|---|---|
| **Severity** | Low (testability / ambiguity, not user-visible data loss) |
| **Suspected subsystem** | Chapter content model + tab switching |
| **Reproduction** | Rapid tab switch between Story and Overview before async `loadTabContent` completes |
| **Expected** | DOM always reflects active projection |
| **Observed (during dev)** | Stale Story walkthrough text caused wrong phrase lookups when tests waited only on `[data-element="MM-pump-decompensation"]` |
| **Status** | Tests now wait on projection-specific `contentMarker` strings. No user report of wrong highlights cross-loading. |

---

## 3. Scenarios impractical to automate

1. **Real mouse drag selection + toolbar positioning** — Playwright headless returns zero-width `getBoundingClientRect` for programmatic ranges; `_showToolbar` bails. Smoke suite calls `_onSelectionChange` directly for selection logic (SE-01–SE-07).

2. **Actors / Readiness / Mastery projections** — Not published for the only built chapter.

3. **Multi-chapter browser isolation** — Repository contains one manifest (`cardio/234`). Unit test ST-U03 covers chapter id filtering in storage.

4. **IndexedDB quota / corruption recovery** — Destructive; manual only.

5. **`restore()` invoked exactly once** — Would require a production test hook (`_restoreCount`).

6. **Long-session performance (20+ highlights)** — Covered lightly by RO-01/RO-02/RO-03; exhaustive perf is manual.

---

## 4. Recommendations for future testability

1. **`?projection=mechanisms` URL param** — Load projection directly without tab index fragility.

2. **`data-testid` attributes** — Stable selectors for tabs, walkthroughs, toolbar.

3. **Optional test hook** — `LouTextHighlights._restoreCount` behind `window.__LOU_TEST__`.

4. **Fixture chapter `cardio/999-smoke`** — Minimal second chapter for cross-chapter browser tests.

5. **Unique element ids per projection** — Or namespace DOM queries by projection to avoid Story/Overview collision on `MM-pump-decompensation`.

6. **Creation-path idempotence** — Reuse `_rangeAlreadyHighlighted` in `_applyCurrentSelection` before wrapping.

---

## 5. How to run

```bash
cd demo/renderer
npm install
npx playwright install chromium   # first time only
npm run test:all
```

Results JSON: `demo/renderer/test/smoke/results.json`

---

## 6. Files added (test-only branch)

```
docs/testing/renderer-v2.1-smoke-matrix.md
docs/testing/renderer-v2.1-smoke-report.md
demo/renderer/playwright.config.js
demo/renderer/test/smoke/fixtures.mjs
demo/renderer/test/smoke/helpers.mjs
demo/renderer/test/smoke/01-creation.spec.mjs
demo/renderer/test/smoke/02-persistence.spec.mjs
demo/renderer/test/smoke/03-projections.spec.mjs
demo/renderer/test/smoke/04-lifecycle.spec.mjs
demo/renderer/test/smoke/05-dom-integrity.spec.mjs
demo/renderer/test/smoke/06-selection.spec.mjs
demo/renderer/test/smoke/07-storage.unit.test.js
demo/renderer/test/smoke/08-robustness.spec.mjs
demo/renderer/package.json          (scripts + devDependencies only)
```
