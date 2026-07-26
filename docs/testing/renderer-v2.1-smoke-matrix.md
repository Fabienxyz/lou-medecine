# Renderer V2.1 — Functional Smoke Matrix

> Branch: `test/renderer-v2.1-smoke-suite`  
> Fixture chapter: `cardio/234` (only built chapter in repository)  
> Automation entry point: `demo/renderer/` → `npm run test:all`

This matrix is the permanent validation contract for Renderer V2.1. Every future renderer version (V2.2, V2.3, …) must execute this suite before merge.

**In scope:** renderer lifecycle, projections, walkthrough rendering, text selection, highlight creation/persistence/restoration, learner storage, DOM integrity.

**Out of scope:** Selection Notes (V2.2), Personal Diagrams, Inline Notes, SVG editing, future features.

---

## Legend

| Automation | Meaning |
|---|---|
| **Browser** | Playwright spec in `demo/renderer/test/smoke/` |
| **Unit** | Node `--test` in `demo/renderer/test/` or `test/smoke/*.unit.test.js` |
| **Manual** | Requires human verification; not automated |
| **N/A** | Not applicable with current repository content |

| Risk | Meaning |
|---|---|
| **Critical** | Data loss, wrong projection, broken restore, corrupted DOM |
| **High** | Visible defect on common student workflow |
| **Medium** | Edge case or secondary workflow |
| **Low** | Rare scenario or cosmetic |

---

## 1. Creation

| ID | Scenario | Objective | Rationale | Risk | Automation |
|---|---|---|---|---|---|
| CR-01 | One highlight | Single selection saves and wraps one mark | Baseline happy path | Critical | Browser `01-creation` |
| CR-02 | Multiple highlights, different paragraphs | Three marks in three `<p>` survive creation | Original V2.1 repro scenario | Critical | Browser `01-creation` |
| CR-03 | Multiple highlights, same paragraph | Adjacent/non-overlapping marks in one `<p>` | Text-node split boundary risk | High | Browser `01-creation` |
| CR-04 | Near beginning of paragraph | Range starts at paragraph open | Offset boundary at start | Medium | Browser `01-creation` |
| CR-05 | Near end of paragraph | Range ends before paragraph close | Offset boundary at end | Medium | Browser `01-creation` |
| CR-06 | Punctuation (`et/ou`) | Selector stores punctuation faithfully | TextQuoteSelector fidelity | Medium | Browser `01-creation` |
| CR-07 | Accented characters (`décompense`) | French diacritics round-trip | Locale/content fidelity | Medium | Browser `01-creation` |
| CR-08 | Long highlight (>80 chars) | Multi-word sentence span wraps cleanly | `surroundContents` vs extract fallback | Medium | Browser `01-creation` |
| CR-09 | Short highlight (5 chars) | Minimal span still visible | Empty/thin mark regression | Medium | Browser `01-creation` |
| CR-10 | Second block same projection | Highlight in `MEC-oap` block | Multi-block per projection | High | Browser `01-creation` |

---

## 2. Persistence

| ID | Scenario | Objective | Rationale | Risk | Automation |
|---|---|---|---|---|---|
| PE-01 | Single reload | Stored highlights restore after one reload | Core V2.1 exit criterion | Critical | Browser `02-persistence` |
| PE-02 | Multiple reloads | Three consecutive reloads keep one highlight | Idempotent restore under repeat load | High | Browser `02-persistence` |
| PE-03 | Browser restart | IndexedDB survives process exit | Real student session continuity | Critical | Browser `02-persistence` |
| PE-04 | Create after reload | Fourth highlight added post-reload survives next reload | Incremental study session | Critical | Browser `02-persistence` |
| PE-05 | Multiple create/reload cycles | Interleaved create + reload accumulates correctly | Longitudinal study pattern | High | Browser `02-persistence` |
| PE-06 | Walkthrough text unchanged | `textContent` identical before/after restore | Overlay must not alter prose | High | Browser `02-persistence` |

---

## 3. Projections

Published projections for `cardio/234`: **Story**, **Overview**, **Mechanisms**, **Clinical reasoning**.

`manifest.known_absent`: **Actors**, **Readiness**, **Mastery** — no tabs/content yet.

| ID | Scenario | Objective | Rationale | Risk | Automation |
|---|---|---|---|---|---|
| PR-01 | Projection scoping | Highlight visible only on owning projection | Storage keyed by `projection` id | Critical | Browser `03-projections` |
| PR-02 | Tab switch preserves storage | Switching tabs does not delete stored rows | Navigation must not mutate IDB | Critical | Browser `03-projections` |
| PR-03 | Rapid multi-projection switching | Four projections × two rounds restore correctly | Stress tab lifecycle | High | Browser `03-projections` |
| PR-04 | Reload + per-projection verify | Each projection restores independently after reload | Cross-projection isolation | Critical | Browser `03-projections` |
| PR-05 | Story walkthrough official | `[data-official="true"]` on story block | Selection boundary | High | Browser `03-projections` |
| PR-06 | Overview walkthrough official | Official container present | Selection boundary | High | Browser `03-projections` |
| PR-07 | Mechanisms walkthrough official | Official container present | Selection boundary | High | Browser `03-projections` |
| PR-08 | Clinical reasoning walkthrough official | Official container present | Selection boundary | High | Browser `03-projections` |
| PR-09 | Actors projection | Highlights scoped when projection exists | Future chapter readiness | Medium | **N/A** (known_absent) |
| PR-10 | Readiness projection | Highlights scoped when projection exists | Future chapter readiness | Medium | **N/A** (known_absent) |

---

## 4. Renderer lifecycle

| ID | Scenario | Objective | Rationale | Risk | Automation |
|---|---|---|---|---|---|
| LC-01 | Repeated tab switches | Five round-trips story↔mechanisms preserve mark | `renderProjection()` churn | High | Browser `04-lifecycle` |
| LC-02 | DOM rebuilt on switch | Walkthrough content differs across projections | Confirms full re-render | Medium | Browser `04-lifecycle` |
| LC-03 | Listener not duplicated | `_boundHost` stable; single toolbar | `bindSelection` guard | High | Browser `04-lifecycle` + Unit ST-U05 |
| LC-04 | Restore idempotent | Double `restore()` → no nested marks | Regression from highlight-restore fix | Critical | Browser `04-lifecycle` |
| LC-05 | Restore on tab return | Leave projection and return restores marks | `mount()` in `blocks.render()` finally | High | Browser `04-lifecycle` |
| LC-06 | `restore()` exactly once per mount | Counter hook confirms single pass | Prevent double-wrap | High | **Manual** (no prod hook) |

---

## 5. DOM integrity

| ID | Scenario | Objective | Rationale | Risk | Automation |
|---|---|---|---|---|---|
| DI-01 | No nested marks | No `<mark>` inside `<mark>` | Thin-line visual defect | Critical | Browser `05-dom-integrity` |
| DI-02 | No empty marks | Every mark has `textContent.length > 0` | Empty overlay regression | Critical | Browser `05-dom-integrity` |
| DI-03 | No `<br>` inside marks | Marks contain text nodes only | Unexpected layout breaks | Medium | Browser `05-dom-integrity` |
| DI-04 | Paragraph count preserved | Same `<p>` count before/after restore | Structure integrity | High | Browser `05-dom-integrity` |
| DI-05 | Highlight text exact | Restored text matches stored `exact` | Selector fidelity | Critical | Browser `05-dom-integrity` |
| DI-06 | Marks inside paragraphs | Parent chain includes `<p>` | Block layout preserved | Medium | Browser `05-dom-integrity` |
| DI-07 | No thin vertical geometry | `getBoundingClientRect().width > 4` | User-visible restore defect | Critical | Browser (via `assertHealthyMarks`) |

---

## 6. Selection

| ID | Scenario | Objective | Rationale | Risk | Automation |
|---|---|---|---|---|---|
| SE-01 | Official walkthrough selectable | Toolbar appears on walkthrough text | Core affordance | Critical | Browser `06-selection` |
| SE-02 | Block question not selectable | No toolbar on `.block-question` | Scope boundary | High | Browser `06-selection` |
| SE-03 | Preamble h1 not selectable | No toolbar on preamble heading | Non-official content | High | Browser `06-selection` |
| SE-04 | Inside existing highlight rejected | No toolbar when selecting marked text | Prevents nested creation | High | Browser `06-selection` |
| SE-05 | Selection after reload | Toolbar on fresh text post-restore | Post-restore interactivity | High | Browser `06-selection` |
| SE-06 | Selection after projection change | Toolbar after tab round-trip | Lifecycle + selection | High | Browser `06-selection` |
| SE-07 | Affordance chrome not selectable | Note button text rejected | Non-prose boundary | Medium | Browser `06-selection` |
| SE-08 | Real mouse drag selection | User drag → toolbar → click Surligner | End-to-end UI path | High | **Manual** (fragile in CI) |
| SE-09 | Escape dismisses toolbar | Keyboard dismiss | UX contract | Low | **Manual** |

---

## 7. Learner storage

| ID | Scenario | Objective | Rationale | Risk | Automation |
|---|---|---|---|---|---|
| ST-U01 | Empty IndexedDB | `listTextHighlights` returns `[]` | Clean install | High | Unit `07-storage` |
| ST-U02 | Multiple projections same chapter | Rows filtered by projection id | Schema contract | Critical | Unit `07-storage` |
| ST-U03 | Chapter isolation | Different chapter ids do not leak | Multi-chapter safety | Critical | Unit `07-storage` |
| ST-U04 | TextQuoteSelector shape | `type`, `exact`, `prefix`, `suffix`, `kind` | Storage contract | Critical | Unit `07-storage` |
| ST-U05 | bindSelection idempotence | Same host skips rebind | Listener duplication guard | High | Unit `07-storage` |
| ST-B01 | Existing highlights on load | Browser restore from populated IDB | Integration | Critical | Browser `02-persistence` |
| ST-B02 | Second chapter in browser | Highlights isolated across chapters | Needs second built chapter | High | **N/A** (single chapter) |

---

## 8. Robustness

| ID | Scenario | Objective | Rationale | Risk | Automation |
|---|---|---|---|---|---|
| RO-01 | Rapid sequential creation | Six highlights without error | Race / ordering | Medium | Browser `08-robustness` |
| RO-02 | Many highlights multi-block | Five highlights across blocks + reload | Scale within one projection | High | Browser `08-robustness` |
| RO-03 | Long study session | All projections, reload, re-verify | Combined workflow stress | High | Browser `08-robustness` |
| RO-04 | 20+ highlights one block | Performance / DOM size | Upper bound exploration | Low | **Manual** |
| RO-05 | IndexedDB quota exceeded | Graceful degradation | Storage failure path | Medium | **Manual** |

---

## 9. Existing contract tests (retained)

| Suite | File | Count | Role |
|---|---|---:|---|
| Chapter path resolution | `test/renderer.test.js` | 5 | Config/path contract |
| Pedagogical blocks + learner layer | `test/renderer.test.js` | 16 | Block structure, V2.1 highlight restore |
| Learner storage robustness | `test/renderer.test.js` | 5 | IDB failure isolation |
| Highlight restore regressions | `test/renderer.test.js` | 4 | Boundary + idempotence regressions |

Run with: `npm test`

---

## 10. Execution

```bash
# From demo/renderer/
npm install
npx playwright install chromium

# Unit + contract tests
npm test

# Browser smoke suite (starts or reuses HTTP server on :8765)
npm run test:smoke

# Full V2.1 validation
npm run test:all
```

Results JSON: `demo/renderer/test/smoke/results.json`

---

## 11. Bug registry

Failures discovered during suite construction are recorded in `docs/testing/renderer-v2.1-smoke-report.md` (generated after each full run). **Do not fix production code on this branch** — document only.

---

## 12. Testability recommendations

1. Expose `data-testid` on `.block-walkthrough`, `.highlight-toolbar`, and projection tabs for stable selectors.
2. Add `?projection=mechanisms` URL parameter to `app.js` for direct projection load in tests.
3. Add optional `LouTextHighlights._restoreCount` debug counter behind a test flag.
4. Build a second minimal chapter (`cardio/999-fixture`) for cross-chapter browser tests.
5. Publish Actors/Readiness projections on a fixture chapter to activate PR-09/PR-10.
6. Consolidate `browser-highlight-repro.mjs` into the Playwright suite (superseded by `02-persistence` PE-01).

---

## 13. Automation status (2026-07-26)

All **Browser** and **Unit** scenarios in sections 1–8 are implemented and **passing** (80/80 total via `npm run test:all`).

**Manual / N/A** scenarios: PR-09, PR-10, ST-B02, LC-06, SE-08, SE-09, RO-04, RO-05.

See [`renderer-v2.1-smoke-report.md`](./renderer-v2.1-smoke-report.md) for run results and potential product risks.
