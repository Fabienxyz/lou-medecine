# Lou Médecine — Handover agent IA

| | |
|---|---|
| **Type** | Point d'entrée opérationnel — **informatif** |
| **Statut** | Document d'accueil — 2026-08-03 (roadmap opérationnelle Phases 0–9 ; Phase 0 active) |
| **Autorité** | **Aucune** — vue synthétique uniquement |
| **En cas de conflit** | [`MASTER_ROADMAP.md`](MASTER_ROADMAP.md), [`PROJECT_STATE.md`](PROJECT_STATE.md), [`governance/EXECUTION_MODE_V1.md`](governance/EXECUTION_MODE_V1.md), ADR et contrats font foi |

Ce document permet à un agent IA de reprendre le projet **immédiatement** après une interruption. Il **ne crée aucune règle** et **ne remplace aucun document normatif**.

**Tenue à jour :** lorsque les sections 2 à 5 ne reflètent plus [`PROJECT_STATE.md`](PROJECT_STATE.md), mettre à jour HANDOVER **en même temps** que PROJECT_STATE.

---

## 1. Photographie Git

| | |
|---|---|
| **Branche** | `main` |
| **HEAD** | voir [`PROJECT_STATE.md`](PROJECT_STATE.md) |
| **Gouvernance RA V1** | `27aa870` — prononcé Reader Acceptance V1 ; tag `reader-acceptance-v1` |
| **Remote** | `origin/main` — voir HEAD courant dans [`PROJECT_STATE.md`](PROJECT_STATE.md) |
| **Tags de référence** | `reader-acceptance-v1` (RA V1) · `display-preferences-v1` (D7) · `local-search-v1` (D6) · `offline-certification-v1` (D2) · `reader-composition-v1` (Composition) |

**Exclusions volontaires :** `_Roadmap Opus - 27 Juillet 2026.docx` · `demo/renderer/docs/learner-session-d4-technical-design.md`

---

## 2. État actuel

> Synthèse de [`PROJECT_STATE.md`](PROJECT_STATE.md). Pour les valeurs à jour, **toujours** lire PROJECT_STATE.

| | |
|---|---|
| **Phase** | Execution Mode V1 — Reader Acceptance V1 **clôturé** |
| **Phase opérationnelle active** | **Phase 0** — Compléter la chaîne Fabrique → Reader |
| **Dernier jalon publié** | **Reader Acceptance V1** — prononcé 2026-08-02 |
| **Objectif actif** | **Reference Product Chapter (234)** — **laboratoire produit** (Phases 0–8) |
| **Chantier actif** | **Phase 0** — build automatique, fixture synchronisée, Stage G `mental_model` / `visual-spec` |
| **Chantier suivant (bloqué)** | **Phase 9 — Reference Production Chapter (224)** — **après Product Freeze** (Phase 8) |
| **Instance courante** | Package 234 Release `complete` ; Reader V1 accepté ; 7 vues alimentées |

**Deux références distinctes :**

| Rôle | Chapitre | Mission |
|---|---|---|
| **Reference Product Chapter** | **234** | **Laboratoire produit** — meilleur produit pour Lou ; coût **ne pilote pas** les choix |
| **Reference Production Chapter** | **224** | Reprend produit figé ; mesure coûts/temps/LLM ; optimise **méthode de production** |

**Acquis majeurs (publiés) :** gouvernance, pipeline lou-build, Composition V1, package 234, D1–D7, patrimoine E-A…E-D, Amorçage AP-A…AP-F, Reader Acceptance V1, modèle produit [`00-READER-V1-PRODUCT-MODEL.md`](renderer/00-READER-V1-PRODUCT-MODEL.md). **Lots D/AP clôturés** — ne pilotent plus la roadmap opérationnelle.

**Checklist implémentation :** [`docs/analysis/rpc-234-execution-audit.md`](analysis/rpc-234-execution-audit.md).

**Validations de référence :** 632/632 tests unitaires renderer PASS · 122/122 smoke PASS · 14/14 smoke AP-F PASS.

---

## 3. Chemin critique

**Roadmap opérationnelle** ([`MASTER_ROADMAP.md`](MASTER_ROADMAP.md) · [`PROJECT_STATE.md`](PROJECT_STATE.md)) — pilotée par les **7 vues Reader**, pas par les lots D/AP.

```
Phase 0 — Fabrique → Reader                    ← ACTIVE
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

**Prochain jalon opérationnel :** **Phase 0** — compléter la chaîne Fabrique → Reader.

**234** = découvrir le **meilleur produit**. **224** (Phase 9) = découvrir la **meilleure méthode industrielle**.

**Références :** [`docs/rpc/00-RPC-METHODOLOGY.md`](rpc/00-RPC-METHODOLOGY.md) · [`docs/analysis/rpc-234-execution-audit.md`](analysis/rpc-234-execution-audit.md) (checklist, pas roadmap)

---

## 4. Architecture stabilisée

Chaîne Reader V1 (acceptée) — **modèle produit :** [`renderer/00-READER-V1-PRODUCT-MODEL.md`](renderer/00-READER-V1-PRODUCT-MODEL.md) (7 vues ; projections = production uniquement).

```
Library Catalog (D1) → Package Access → Browser Offline Manager (D2)
        ↓
Composition V1 → Reading View Model → Renderer (7 vues, dont Amorçage)
        ↓
Session Resume (D4) · Local Search (D6) · Display Preferences (D7)
        ↓
Learner Patrimony (E-A…E-D)
```

---

## 5. Contrats faisant autorité

| Document | Rôle |
|---|---|
| [`COGNITIVE-PRIMING-COMPONENT-CONTRACT.md`](contracts/components/COGNITIVE-PRIMING-COMPONENT-CONTRACT.md) | Amorçage — statut Proposé (AP-A) |
| [`DISPLAY-PREFERENCES-COMPONENT-CONTRACT.md`](contracts/components/DISPLAY-PREFERENCES-COMPONENT-CONTRACT.md) | Préférences d'affichage — En vigueur |
| [`LOCAL-SEARCH-COMPONENT-CONTRACT.md`](contracts/components/LOCAL-SEARCH-COMPONENT-CONTRACT.md) | Recherche locale — En vigueur |
| [`LEARNER-PATRIMONY-COMPONENT-CONTRACT.md`](contracts/components/LEARNER-PATRIMONY-COMPONENT-CONTRACT.md) | Patrimoine — En vigueur |
| [`OFFLINE-COMPONENT-CONTRACT.md`](contracts/components/OFFLINE-COMPONENT-CONTRACT.md) | Offline — En vigueur |
| [`LIBRARY-CATALOG-CONTRACT.md`](contracts/components/LIBRARY-CATALOG-CONTRACT.md) | Identité Release catalogue |

---

## 6. État exact du Reader V1

| Domaine | État |
|---|---|
| **Composition V1** | Publiée |
| **Bibliothèque (D1)** | Livré |
| **Offline (D2)** | Publié |
| **Patrimoine E-A…E-D** | Publié |
| **Reprise session (D4)** | Publié |
| **Recherche locale (D6)** | Publié |
| **Préférences (D7)** | Publié |
| **Amorçage cognitif (AP-A…AP-F)** | Publié — package 234 |
| **Critères d'acceptation** | **Prononcés** — 2026-08-02 |

**Tests renderer (référence) :** 632 PASS unit · 122 PASS smoke · 14 PASS smoke AP-F.

---

## 7. Chantiers recommandés

Ordre = [`PROJECT_STATE.md` § Prochaines étapes](PROJECT_STATE.md#prochaines-étapes) = [`MASTER_ROADMAP.md` § Roadmap opérationnelle](MASTER_ROADMAP.md#roadmap-opérationnelle--reference-product-chapter-234).

| Phase | Intitulé | Statut |
|---|---|---|
| **0** | Compléter la chaîne Fabrique → Reader | **Active** |
| **1** | Modèle mental | En attente |
| **2** | Amorçage cognitif | En attente |
| **3** | Notions | En attente |
| **4** | Cas cliniques | En attente |
| **5** | Collège officiel + Notes | En attente |
| **6** | Validation intégrée | En attente |
| **7** | Product Review avec Lou | En attente |
| **8** | Corrections + Product Freeze | En attente |
| **9** | Reference Production Chapter (224) | En attente — après Phase 8 |

---

## 8. Reprendre le projet

Lorsque le propriétaire dit *« On reprend le lot en cours »* :

1. Lire ce HANDOVER.
2. Lire [`PROJECT_STATE.md`](PROJECT_STATE.md) — **Phase 0 active**.
3. Lire [`docs/rpc/00-RPC-METHODOLOGY.md`](rpc/00-RPC-METHODOLOGY.md) — Phases 0–9, produit vs production.
4. Lire [`docs/analysis/rpc-234-execution-audit.md`](analysis/rpc-234-execution-audit.md) — **checklist d'implémentation** Phase 0.
5. Lire [`renderer/00-READER-V1-PRODUCT-MODEL.md`](renderer/00-READER-V1-PRODUCT-MODEL.md).
6. **Chantier prioritaire : Phase 0** — chaîne Fabrique → Reader automatique (**extensions partagées**, pas de traitement spécifique au 234).
7. **Ne pas démarrer** Phase 9 (224) — conditionnée par Product Freeze (Phase 8).
8. **Ne pas présenter** le 230 comme prochaine étape — candidat futur non tranché.
9. **Product Review** (Phase 7) — uniquement quand les 7 vues sont utilisables ; Lou étudie via le Reader.

---

*Handover — 2026-08-03 — roadmap opérationnelle Phases 0–9 ; Phase 0 active ; lots D/AP = acquis. Non normatif.*
