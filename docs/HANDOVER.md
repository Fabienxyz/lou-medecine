# Lou Médecine — Handover agent IA

| | |
|---|---|
| **Type** | Point d'entrée opérationnel — **informatif** |
| **Statut** | 2026-08-04 — Phase 1A prototypage éditorial actif |
| **Autorité** | **Aucune** — renvoie vers les sources ; ADR et contrats font foi en cas de conflit |

---

## 1. Lire en premier

| Ordre | Document | Pourquoi |
|---|---|---|
| **1** | [`plans/editorial-prototyping-and-migration-plan.md`](plans/editorial-prototyping-and-migration-plan.md) | **Plan d'exécution actif** — lots, gates, ordre Phase 1A |
| **2** | [`PROJECT_STATE.md`](PROJECT_STATE.md) | État observé — chantier, blocages, prochaine étape |
| **3** | [`MASTER_ROADMAP.md`](MASTER_ROADMAP.md) | Intention globale — Product Freeze 234, Phase 9 (224) |
| **4** | [`governance/EXECUTION_MODE_V1.md`](governance/EXECUTION_MODE_V1.md) | Comportement agent en Execution Mode V1 |

**Normes (si tâche technique) :** [`contracts/00-INDEX.md`](contracts/00-INDEX.md) · [`renderer/00-READER-V1-PRODUCT-MODEL.md`](renderer/00-READER-V1-PRODUCT-MODEL.md) (7 vues — projections ≠ onglets).

---

## 2. Objectif actif et livrable

| | |
|---|---|
| **Chantier** | **Phase 1A** — prototypage éditorial hors Reader |
| **Objectif** | Valider avec Lou le **contrat éditorial cible** MM · Notions · Cas (conçus **conjointement**) |
| **Livrable immédiat** | Prototypes **Word mobile-first** (iPhone) — MM (1–3 SVG), Notions pilotes, Cas pilotes |
| **Prochaine étape** | Modélisation globale du chapitre **234** → cartographie MM → Notions → Cas |

**Baseline Git :** `5734832…` · tags `baseline-phase-0-2026-08-04` · `svg-highlight-bridge-v1`.

---

## 3. Autorisé / interdit (Phase 1A)

| Autorisé | Interdit |
|---|---|
| Prototypage contenu Word pour Lou | Modifier Reader, packages publiés, contrats normatifs |
| Conception conjointe MM / Notions / Cas | Intégration Reader ou build/package mutant |
| Phase 1B conception (sans intégration) | Phase 2 migration technique (**bloquée**) |
| Analyses éditoriales hors dépôt | Reprendre RPC Phase 2 Amorçage comme chantier autonome |
| | Présenter le **330** comme package produit ou contre-épreuve 7 vues |
| | Modifier UI annotation (gelée) hors bug bloquant |
| | Formaliser le contrat éditorial comme norme avant validation Lou |

---

## 4. Acquis historiques (ne pas rouvrir sans instruction)

Reader Acceptance V1 · Composition V1 · D1–D7 · Patrimoine E-A…E-D · Annotation UI Freeze · **SVG Highlight Bridge V1** · RPC Phases 0–0.1 · **RPC Phase 1 MM** (figure intégrée = **baseline historique**, pas contrat cible validé).

**Suspendu :** RPC Phase 2 Amorçage · Phases 3–4 linéaires Notions/Cas — remplacés par Phase 1A.

---

## 5. Références rapides

| Besoin | Document |
|---|---|
| Plan détaillé chantier | [`plans/editorial-prototyping-and-migration-plan.md`](plans/editorial-prototyping-and-migration-plan.md) |
| État et blocages | [`PROJECT_STATE.md`](PROJECT_STATE.md) |
| Gate Phase 0 / réserves | [`analysis/phase-0-baseline-gate-2026-08-04.md`](analysis/phase-0-baseline-gate-2026-08-04.md) |
| Intention RPC Phases 0–9 | [`rpc/00-RPC-METHODOLOGY.md`](rpc/00-RPC-METHODOLOGY.md) |
| Validation (DEV/PAS/RELEASE) | [`testing/TEST_ARCHITECTURE_V1.md`](testing/TEST_ARCHITECTURE_V1.md) |
| Product Review Reader (post-intégration) | [`renderer/PRODUCT-REVIEW.md`](renderer/PRODUCT-REVIEW.md) |
| Export Word (consultation **non autoritaire**) | `Lou Médecine — Plan de prototypage… post-audit Opus.docx` |

---

## 6. Reprendre le projet

*« On reprend le lot en cours »* → lire §1 dans l'ordre ; exécuter la **prochaine étape** dans [`PROJECT_STATE.md` § Prochaines étapes](PROJECT_STATE.md#prochaines-etapes) ; respecter §3.

---

*Handover — 2026-08-04 — Phase 1A. Non normatif.*
