# Reference Product Chapter — Méthodologie

| | |
|---|---|
| **Type** | Documentation RPC — **pilotage produit** |
| **Statut** | En vigueur — intention RPC ; **exécution éditoriale courante** → [`plans/editorial-prototyping-and-migration-plan.md`](../plans/editorial-prototyping-and-migration-plan.md) |
| **Autorité** | **Informatif** — ne remplace ni PDR, ni ADR, ni contrats |
| **Point d'entrée** | Ce document, puis la roadmap opérationnelle Phases 0–9 |

Ce dossier (`docs/rpc/`) documente la **référence produit** et les **choix éditoriaux** associés. L'**industrialisation de la production** (coûts, prompts, pipelines) relève du **Reference Production Chapter** (Item **224**, Phase 9) — documenté séparément, **après** le Product Freeze du 234.

Les audits et investigations ponctuelles restent dans [`docs/analysis/`](../analysis/) — **checklist d'implémentation**, pas roadmap.

**Roadmap opérationnelle :** [`MASTER_ROADMAP.md`](../MASTER_ROADMAP.md#roadmap-opérationnelle--reference-product-chapter-234) · [`PROJECT_STATE.md`](../PROJECT_STATE.md) (activité courante) · [`plans/editorial-prototyping-and-migration-plan.md`](../plans/editorial-prototyping-and-migration-plan.md) (lots détaillés).

> **Pilotage éditorial :** le prototypage MM/Notions/Cas conjoints (hors Reader) précède la reprise de la séquence linéaire RPC Phases 2–4. RPC Phase 1 (MM intégré) = baseline historique — non contrat cible validé. **Ne pas** reprendre Amorçage comme chantier autonome sans lire [`PROJECT_STATE.md`](../PROJECT_STATE.md).

---

## Deux références distinctes

| Rôle | Chapitre | Mission |
|---|---|---|
| **Reference Product Chapter (RPC)** | **234** | **Laboratoire produit** — découvrir le **meilleur produit** pour Lou : 7 vues, notions, figures utiles, walkthroughs complets ; Product Review ; Product Freeze |
| **Reference Production Chapter** | **224** (Phase 9) | Reprendre le **produit figé** du 234 ; produire le chapitre entièrement ; **mesurer** temps humain, appels LLM et coûts ; **optimiser la méthode de production** — **pas le produit** |

**Le chapitre 234 ne sert pas à optimiser la méthode de production.** C'est le rôle du 224. Le **coût ne pilote pas** les choix éditoriaux du 234.

---

## Principes de pilotage

| Principe | Application |
|---|---|
| **Produit avant technique** | Pilotage par le **produit** et les **7 vues Reader** — pas par les lots Reader Acceptance (D1, D2, D4, D6, AP-A…AP-F), **clôturés** et hors chemin critique opérationnel. |
| **234 = laboratoire produit** | Découvrir le meilleur produit ; surproduction légère assumée. |
| **224 = laboratoire industriel** | Découvrir la meilleure méthode — Phase 9 uniquement. |
| **Audit = checklist** | [`docs/analysis/rpc-234-execution-audit.md`](../analysis/rpc-234-execution-audit.md) — constats techniques pour l'implémentation, **pas** séquencement. |

---

## Roadmap opérationnelle — Phases 0–9

Une seule roadmap opérationnelle existe. Détail canonique : [`MASTER_ROADMAP.md`](../MASTER_ROADMAP.md#roadmap-opérationnelle--reference-product-chapter-234).

```
Phase 0 — Compléter la chaîne Fabrique → Reader     ← active
        ↓
Phase 1 — Modèle mental
        ↓
Phase 2 — Amorçage cognitif
        ↓
Phase 3 — Notions
        ↓
Phase 4 — Cas cliniques
        ↓
Phase 5 — Collège officiel + Notes
        ↓
Phase 6 — Validation intégrée
        ↓
Phase 7 — Product Review avec Lou
        ↓
Phase 8 — Corrections + Product Freeze
        ↓
Phase 9 — Reference Production Chapter (224)
        ↓
Capitalisation industrielle → Validation Corpus V1 → …
```

### Détail par phase

| Phase | Intitulé | Focus | Vues Reader |
|---|---|---|---|
| **0** | Compléter la chaîne Fabrique → Reader | Build entièrement automatique ; aucun manifest manuel ; aucun copier/coller ; aucun traitement spécifique au 234 ; fixture synchronisée ; Stage G compatible `mental_model` / `visual-spec` | Transversal |
| **1** | Modèle mental | Figure ; walkthrough ; UX minimale ; navigation | Modèle mental |
| **2** | Amorçage cognitif | Contenu et expérience Amorçage | Amorçage cognitif |
| **3** | Notions | 11 notions ; figures ; walkthroughs ; développements ; points d'attention | Notions |
| **4** | Cas cliniques | Scénarios cliniques jouables | Cas cliniques |
| **5** | Collège officiel + Notes | Texte source ; notes apprenant | Collège · Notes |
| **6** | Validation intégrée | validate/build ; parcours 7 vues ; fixture CI | Les 7 vues |
| **7** | Product Review avec Lou | Usage **réel** ; retour valeur pédagogique | Les 7 vues |
| **8** | Corrections + Product Freeze | Itérations ; gel produit 234 | — |
| **9** | Reference Production Chapter (224) | Méthode industrielle ; coûts mesurés | — |

La **recertification** (Phases 1–5) opère par verdict artefact : **conserver**, **adapter** ou **remplacer**.

---

## Le 234 comme laboratoire produit

Le Reference Product Chapter est un **laboratoire produit** : c'est là que le projet **découvre** ce que Lou doit offrir à l'apprenant.

| Principe | Application sur 234 |
|---|---|
| **Objectif** | Meilleur produit pédagogique possible — pas la méthode la moins chère |
| **Périmètre** | Les 7 vues Reader ; toutes les notions ; toutes les figures **pédagogiquement utiles** ; walkthroughs complets |
| **Surproduction** | Légère surproduction **volontaire et assumée** |
| **Coût** | **Ne pilote pas** les choix |
| **Prompts / pipeline** | **Ne pas** calibrer la production industrielle sur le 234 |

---

## Qu'est-ce qu'un Reference Product Chapter ?

Un **Reference Product Chapter (RPC)** est un chapitre EDN **existant**, recertifié pour devenir la **référence produit** du projet.

Le RPC répond à une question : *le chapitre satisfait-il l'expérience Reader V1 dans son intégralité pédagogique — contenu, figures, walkthroughs, 7 vues ?*

---

## Pourquoi le RPC existe

| Motif | Énoncé |
|---|---|
| **Produit avant Fabrique** | Finaliser l'expérience utilisateur sur une instance réelle avant d'industrialiser |
| **Référence gelable** | Aboutir à un Product Freeze (Phase 8) — référence produit figée |
| **Observer d'abord** | Capitaliser sur le 234 avant de généraliser la production sur le 224 (Phase 9) |

---

## Ce que le RPC n'est pas

| Le RPC n'est **pas** | Précision |
|---|---|
| Un chantier d'optimisation du coût marginal | → Phase 9 — Reference Production Chapter (224) |
| Un statut normatif immédiat | Les décisions deviennent standards **après Product Freeze** |
| Une refonte from scratch | **Recertification** : conserver, adapter ou remplacer artefact par artefact |
| Piloté par les lots D/AP | Lots **clôturés** — la roadmap opérationnelle est pilotée par les **7 vues** |
| Le Reference Production Chapter | Le 224 industrialise ; le 234 produit |
| La Validation Corpus | Qualification Fabrique — **après** Phase 9 |

**Note Phase 0 :** compléter la chaîne Fabrique → Reader (build automatique, Stage G, fixture) est un **prérequis transversal** — extensions de code **partagées**, jamais de traitement spécifique au 234.

---

## Philosophie : Observer d'abord. Généraliser ensuite.

| Principe | Application |
|---|---|
| **Observer d'abord** | Phases 0–8 sur 234 — découvrir le produit |
| **Product Review** (Phase 7) | Lou utilise **réellement** le chapitre ; décide ce qui apporte de la valeur — **pas** mesure du coût |
| **Product Freeze** (Phase 8) | Fige la référence produit ; ouvre Phase 9 (224) |
| **Généraliser ensuite** | Phase 9 — méthode industrielle sur 224 |

---

## Modèle produit de référence

La méthode RPC raisonne exclusivement avec le **Reader V1 — 7 vues** :

[`docs/renderer/00-READER-V1-PRODUCT-MODEL.md`](../renderer/00-READER-V1-PRODUCT-MODEL.md)

| Boucle | Vues Reader | Phases | Document |
|---|---|---|---|
| **1 — Compréhension** | Amorçage · Modèle mental · Notions | 1–3 | [`10-BOUCLE-1-COMPREHENSION.md`](10-BOUCLE-1-COMPREHENSION.md) |
| **2 — *(à venir)*** | Cas cliniques · Collège officiel | 4–5 | — |
| **3 — *(à venir)*** | QCM · Scénarios · Notes | 4–5 | — |

---

## Arborescence `docs/rpc/`

| Document | Statut | Contenu |
|---|---|---|
| **`00-RPC-METHODOLOGY.md`** | En vigueur | Ce document — référence produit |
| **`10-BOUCLE-1-COMPREHENSION.md`** | En vigueur (provisoire) | Cibles produit Phases 1–3 — choix éditoriaux RPC |
| `20-BOUCLE-2-…` | *À créer* | Phases 4–5 — Cas cliniques · Collège · Notes |
| `30-BOUCLE-3-…` | *À créer* | QCM · Scénarios |
| `40-REFERENCE-PRODUCTION-CHAPTER.md` | *À créer post-freeze* | Phase 9 — méthode industrielle Item 224 |
| Registre de décisions RPC | *À créer post-freeze* | Décisions figées → standards |
| Capitalisation produit | *À créer post-freeze* | Enseignements produit du 234 |

---

## Documents connexes

| Document | Rôle |
|---|---|
| [`MASTER_ROADMAP.md`](../MASTER_ROADMAP.md) | Roadmap opérationnelle Phases 0–9 — séquencement et critères de sortie |
| [`PROJECT_STATE.md`](../PROJECT_STATE.md) | Phase active, blocages, prochaines étapes |
| [`docs/analysis/rpc-234-execution-audit.md`](../analysis/rpc-234-execution-audit.md) | Checklist d'implémentation Phase 0 et au-delà |
| [`docs/analysis/`](../analysis/) | Audits temporaires — hors méthode officielle |

---

*Révision 2026-08-03 — roadmap opérationnelle Phases 0–9 ; pilotage 7 vues Reader ; audit = checklist.*
