# Start Here

If you are returning to the project after a break, read the following documents in order.

## 1. Project governance

Read in this order:

1. [`docs/contracts/00-INDEX.md`](docs/contracts/00-INDEX.md) — contrats fondamentaux 01–09, ADR et architecture de référence (§ 6)
2. [`docs/adr/README.md`](docs/adr/README.md) — index des Architecture Decision Records
3. [`docs/governance/DOCUMENT_ARCHITECTURE.md`](docs/governance/DOCUMENT_ARCHITECTURE.md) — organisation du pilotage documentaire
4. [`docs/MASTER_ROADMAP.md`](docs/MASTER_ROADMAP.md) — intention : objectifs, séquencement, critères de sortie
5. [`docs/PROJECT_STATE.md`](docs/PROJECT_STATE.md) — observation : état courant du projet (document vivant)
6. [`docs/governance/PRODUCT-DECISION-REGISTRY.md`](docs/governance/PRODUCT-DECISION-REGISTRY.md) — mémoire des arbitrages produit (audit 2026-07-30)
7. [`docs/renderer/00-READER-V1-PRODUCT-MODEL.md`](docs/renderer/00-READER-V1-PRODUCT-MODEL.md) — **modèle produit Reader V1** (7 vues — avant toute mission Reader)
8. [`docs/renderer/README.md`](docs/renderer/README.md) — architecture de référence gelée v1 (docs 14–19)
9. [`IMPLEMENTATION_CONTRACT.md`](IMPLEMENTATION_CONTRACT.md) — contrat d'implémentation

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

**Objectif actif :** **Reference Product Chapter (234)** — **Phase 0 active** (compléter la chaîne Fabrique → Reader) ; voir [`docs/PROJECT_STATE.md`](docs/PROJECT_STATE.md), [`docs/rpc/00-RPC-METHODOLOGY.md`](docs/rpc/00-RPC-METHODOLOGY.md) et [`docs/MASTER_ROADMAP.md` § Roadmap opérationnelle](docs/MASTER_ROADMAP.md#roadmap-opérationnelle--reference-product-chapter-234).

**Reader V1 :** accepté (tag `reader-acceptance-v1`) — **7 vues** ; modèle produit [`00-READER-V1-PRODUCT-MODEL.md`](docs/renderer/00-READER-V1-PRODUCT-MODEL.md). Lots D/AP **clôturés** — ne pilotent plus la roadmap opérationnelle.

**Roadmap opérationnelle :** Phases 0–9 — pilotage par les **7 vues Reader** ; audit [`rpc-234-execution-audit.md`](docs/analysis/rpc-234-execution-audit.md) = checklist d'implémentation.

**Reference Production Chapter (224) :** **Phase 9** — démarre **après Product Freeze** (Phase 8) ; reprend produit figé ; mesure coûts ; optimise **méthode**, pas produit.

**Validation Corpus V1 :** **après Phase 9 (224)** — le 230 n'est pas la prochaine étape officielle.

**Principe pilotage :** *Observer d'abord. Généraliser ensuite.* — produit découvert sur **234** (Phases 0–8) ; méthode industrielle découvrte sur **224** (Phase 9).

**Pour démarrer concrètement :** [`docs/analysis/rpc-234-execution-audit.md`](docs/analysis/rpc-234-execution-audit.md) (Phase 0), [`01-learning/chapters/cardio/234/`](01-learning/chapters/cardio/234/), [`docs/rpc/00-RPC-METHODOLOGY.md`](docs/rpc/00-RPC-METHODOLOGY.md), [`demo/renderer/`](demo/renderer/) (Reader).
