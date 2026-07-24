# Lou Build — chapter-capable validation/build tool

Semantic reconciliation and bridging grounding are **bootstrap-backed** (persisted YAML + explicit allowlists) until an LLM runtime is wired.

## Commands

```bash
cd tools/lou-build
npm install
npm test
node cli.js validate --chapter 01-learning/chapters/cardio/234
node cli.js build --chapter 01-learning/chapters/cardio/234
```

## Chapter artifacts

| File | Role |
|---|---|
| `inventory.yaml` | Canonical Knowledge Inventory |
| `blueprint.md` | Canonical Chapter Blueprint |
| `chapter.package.yaml` | Manifest metadata, reconciliation scope, bootstrap grounding allowlist |
| `projections.yaml` | Published projection registry (paths, order, visuals) |
| `source.meta.yaml` | Edition + structural section index |
| `build/reconciliation.yaml` | Independent reconciliation artifact (scope + required segments) |

## Interfaces

- `reconcile({ reconciliationPath, scopeExpected?, requiredSegmentIds? })` — validates persisted reconciliation YAML
- `groundDeterministic({ projectionResults, inventory, sourceMeta })` — deterministic high-specificity checks
- `mergeSemanticGrounding(...)` — bootstrap allowlist only; other bridging claims block publication

## Fully automated now

Anchor resolution, inventory/blueprint/claim-trace validation, traceability assembly, threshold grounding (`>25` vs `>30` regression), publication invalidation on failed build, data-driven manifest assembly.
