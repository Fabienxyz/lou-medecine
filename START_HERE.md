# Start Here

If you are returning to the project after a break, read the following documents in order.

## 1. Project governance

Read in this order:

1. [`docs/contracts/00-INDEX.md`](docs/contracts/00-INDEX.md) — contrats fondamentaux 01–06 et architecture de référence (§ 6)
2. [`docs/renderer/README.md`](docs/renderer/README.md) — architecture de référence gelée v1 (docs 14–19)
3. [`docs/MASTER_ROADMAP.md`](docs/MASTER_ROADMAP.md) — pilotage : objectifs, phases, priorités
4. [`docs/PROJECT_STATE.md`](docs/PROJECT_STATE.md) — état courant du projet (document vivant)
5. [`IMPLEMENTATION_CONTRACT.md`](IMPLEMENTATION_CONTRACT.md) — contrat d'implémentation

For LLM usage (evolving strategy), see [`docs/LLM_STRATEGY.md`](docs/LLM_STRATEGY.md).

> **Note:** `FINAL_ARCHITECTURE.md` reste la baseline système historique ; l'architecture produit gelée est portée par les docs [`14–19`](docs/renderer/README.md). `CURRENT_PRIORITIES.md` is deprecated and kept for historical reference only.

---

## 2. Foundation

00-foundation/

Read:

1. vision.md
2. principles.md

These documents define the project's mission and immutable principles.

---

## 3. Research

05-research/

Read:

- README.md
- RESEARCH_PROTOCOL.md
- RESEARCH_LOG.md

These documents explain the current research and discoveries.

---

## 4. Continue

Only after reading the documents above should new product or implementation work begin.

**La Fabrique terminée** — Phase 3 + 3.5 close ([jalon migration](docs/releases/phase-3.4-batch-migration-g-k.md) · [jalon cutover](docs/releases/phase-3.5-completion-report.md)).

**Phase active :** **Le Lecteur (production)**. Start with [`docs/PROJECT_STATE.md`](docs/PROJECT_STATE.md), [`demo/renderer/`](demo/renderer/), docs [14](docs/renderer/14-LOU-READER-ARCHITECTURE.md)–[15](docs/renderer/15-READER-FUNCTIONAL-SPECIFICATION.md), and [`docs/renderer/13-ROADMAP.md`](docs/renderer/13-ROADMAP.md).
