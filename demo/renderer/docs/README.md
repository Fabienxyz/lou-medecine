# Renderer — Architecture documentation

Versioned architecture contracts for the Lou Learning Companion chapter renderer (`demo/renderer/`).

These documents describe **what is implemented** (frozen tags) or **what is specified for implementation** (approved designs). They are the official references for future renderer evolution.

## Principles (timeless)

| Document | Scope |
|---|---|
| [architecture-principles.md](./architecture-principles.md) | Permanent invariants — Official Layer, Learner Layers, rebuildability, independence |

Read this first. It applies to every renderer version.

## Version contracts

| Document | Tag / status | Feature |
|---|---|---|
| [renderer-v2.1-highlights.md](./renderer-v2.1-highlights.md) | `renderer-v2.1.0` — **frozen** | Text selection highlights |
| [renderer-v2.2-walkthrough-notes.md](./renderer-v2.2-walkthrough-notes.md) | Design approved — **target spec** | Walkthrough Notes (full V2.2) |
| [renderer-v2.3-inline-formatting.md](./renderer-v2.3-inline-formatting.md) | `renderer-v2.3-architecture-frozen` — **frozen** | Inline formatting on official SVG text |

### V2.2 implementation milestones

Documented incrementally as commits land. Each file describes **only what is implemented** at that step — not the full target spec above.

| Document | Status | Commit scope |
|---|---|---|
| [renderer-v2.2-02-store.md](./renderer-v2.2-02-store.md) | **Implemented** | `walkthrough_notes` IndexedDB store + CRUD |
| [renderer-v2.2-03-caret-anchor.md](./renderer-v2.2-03-caret-anchor.md) | **Implemented** | CaretAnchor primitives + Official Text Stream |
| [renderer-v2.2-walkthrough-notes.md §8](./renderer-v2.2-walkthrough-notes.md#8-pipeline-de-restauration) | `renderer-v2.2-restore-stable` — **frozen** | Restore walkthrough notes from IndexedDB |
| [renderer-v2.2-04-note-creation.md](./renderer-v2.2-04-note-creation.md) | `renderer-v2.2-create-stable` — **frozen** | Context menu create flow |
| [renderer-v2.2-05-walkthrough-note-edit-delete.md](./renderer-v2.2-05-walkthrough-note-edit-delete.md) | `renderer-v2.2-edit-delete-stable` — **frozen** | Edit and delete interactions |

Each version contract is additive. Later versions must not regress earlier frozen contracts unless explicitly superseded.

V2.2 walkthrough notes (commits 2–6) are **complete** at `renderer-v2.2-edit-delete-stable`. CSS (commit 7) and browser smoke (commits 9–10) remain in the [target spec](./renderer-v2.2-walkthrough-notes.md) only.

### V2.3 implementation milestones

| Document | Status | Commit scope |
|---|---|---|
| [renderer-v2.3-01-store.md](./renderer-v2.3-01-store.md) | **Implemented** — `renderer-v2.3-store-stable` | `svg_text_formats` IndexedDB store + CRUD |

## Planned (not written yet)

| Document | Planned feature |
|---|---|
| `renderer-v2.4-svg-overlays.md` | SVG figure annotations |
| `renderer-v2-production.md` | Production hardening, packaging, deployment |

Do not create these files until the corresponding design is approved.

## Relationship to other docs

| Location | Role |
|---|---|
| `demo/renderer/docs/` (this folder) | **Implementation contracts** — tied to code and tags |
| `docs/renderer/` (repository root) | Product vision, roadmap, migration plan |
| `IMPLEMENTATION_CONTRACT.md` | Cross-cutting product contract (Blueprint, blocks) |

When code and this folder disagree, **the frozen tag wins** for shipped versions; **the approved design wins** for versions not yet implemented.

## Validation

| Version | Gate before merge |
|---|---|
| V2.1 | Full smoke matrix — see [renderer-v2.1-highlights.md § Tests](./renderer-v2.1-highlights.md#stratégie-de-tests) |
| V2.2 | V2.1 smoke (non-regression) + Walkthrough Notes suite — see [renderer-v2.2-walkthrough-notes.md § Tests](./renderer-v2.2-walkthrough-notes.md#stratégie-de-tests) |

Run from `demo/renderer/`:

```bash
npm test          # unit tests
npm run test:all  # unit + browser smoke (when configured)
```
