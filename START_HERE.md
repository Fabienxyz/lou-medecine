# Start Here

If you are returning to the project after a break, read the following documents in order.

## 1. Project governance

Read in this order:

1. [`docs/contracts/00-INDEX.md`](docs/contracts/00-INDEX.md) — contrats fondamentaux 01–06, ADR et architecture de référence (§ 6)
2. [`docs/adr/README.md`](docs/adr/README.md) — index des Architecture Decision Records
3. [`docs/governance/DOCUMENT_ARCHITECTURE.md`](docs/governance/DOCUMENT_ARCHITECTURE.md) — organisation du pilotage documentaire
4. [`docs/MASTER_ROADMAP.md`](docs/MASTER_ROADMAP.md) — intention : objectifs, séquencement, critères de sortie
5. [`docs/PROJECT_STATE.md`](docs/PROJECT_STATE.md) — observation : état courant du projet (document vivant)
6. [`docs/governance/PRODUCT-DECISION-REGISTRY.md`](docs/governance/PRODUCT-DECISION-REGISTRY.md) — mémoire des arbitrages produit (audit 2026-07-30)
7. [`docs/renderer/README.md`](docs/renderer/README.md) — architecture de référence gelée v1 (docs 14–19)
8. [`IMPLEMENTATION_CONTRACT.md`](IMPLEMENTATION_CONTRACT.md) — contrat d'implémentation

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

**Objectif actif :** capitalisation d'un **package de référence complet** (Item 234 — édition Collège 2023) — voir [`docs/PROJECT_STATE.md`](docs/PROJECT_STATE.md) et [`docs/MASTER_ROADMAP.md`](docs/MASTER_ROADMAP.md).

**Chantiers parallèles :** Reader V1 (développement, acceptation conditionnée par le package complet), patrimoine pédagogique, CI. Le détail opérationnel est dans [`docs/PROJECT_STATE.md`](docs/PROJECT_STATE.md).

**Pour démarrer concrètement :** [`01-learning/chapters/cardio/234/`](01-learning/chapters/cardio/234/) (capitalisation), [`demo/renderer/`](demo/renderer/) (Reader), docs [14](docs/renderer/14-LOU-READER-ARCHITECTURE.md)–[15](docs/renderer/15-READER-FUNCTIONAL-SPECIFICATION.md).
