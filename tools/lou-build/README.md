# Lou Build — OAP vertical slice

Minimal validation/build tool. Semantic reconciliation and bridging grounding are **bootstrap-backed** (persisted YAML + fixtures) until an LLM runtime is wired.

## Commands

```bash
cd tools/lou-build
npm install
npm test
node cli.js validate --chapter 01-learning/chapters/cardio/234
node cli.js build --chapter 01-learning/chapters/cardio/234
```

## Interfaces (automation-ready)

- `reconcile(source, sliceScope, inventory)` → loads `build/reconciliation.yaml` (bootstrap artifact)
- `ground(claims, inventory)` → deterministic threshold check + semantic bootstrap fixture

## Fully automated now

Anchor resolution, inventory/blueprint/claim-trace validation, traceability assembly, threshold grounding (`>25` vs `>30`), package gates, manifest generation on pass.
