# Lou Médecine — Handover agent IA

| | |
|---|---|
| **Type** | Point d'entrée opérationnel — **informatif** |
| **Statut** | Document d'accueil — 2026-08-03 (Annotation UI Freeze V1 ; Graphical Learning Layer V1 ouvert) |
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
| **Gel UI annotation** | tag `reader-ui-freeze-v1` — Annotation UI Freeze V1 |
| **Remote** | `origin/main` — voir HEAD courant dans [`PROJECT_STATE.md`](PROJECT_STATE.md) |
| **Tags de référence** | `reader-ui-freeze-v1` (UI annotation) · `reader-acceptance-v1` (RA V1) · `display-preferences-v1` (D7) · `local-search-v1` (D6) · `offline-certification-v1` (D2) · `reader-composition-v1` (Composition) |

**Exclusions volontaires :** `_Roadmap Opus - 27 Juillet 2026.docx` · `demo/renderer/docs/learner-session-d4-technical-design.md`

---

## 2. État actuel

> Synthèse de [`PROJECT_STATE.md`](PROJECT_STATE.md). Pour les valeurs à jour, **toujours** lire PROJECT_STATE.

| | |
|---|---|
| **Phase** | Execution Mode V1 — Reader Acceptance V1 **clôturé** ; **Annotation UI Freeze V1 prononcé** |
| **Phase opérationnelle active** | **Phase 2** — Amorçage cognitif (en attente) |
| **Dernier jalon publié** | **Annotation UI Freeze V1** — Product Polish V1 clôturé ; Product Review finale annotation **GO** (2026-08-03) |
| **Objectif actif** | **Graphical Learning Layer V1** — conception et architecture (SVG contenu pédagogique de première classe) |
| **Chantier actif** | **Graphical Learning Layer V1** — **conception uniquement** ; aucun lot d'implémentation ouvert |
| **Chantier RPC suivant** | **Phase 2** — Amorçage cognitif (package + vue Reader) |
| **Instance courante** | Package 234 Release `complete` ; Reader V1 accepté ; 7 vues alimentées ; **UI annotation gelée** |

**UI Reader gelée.** Les Product Reviews UI annotation sont **terminées** (GO). Aucun chantier UI ouvert — corrections réservées aux **bugs bloquants** uniquement.

**Deux références distinctes :**

| Rôle | Chapitre | Mission |
|---|---|---|
| **Reference Product Chapter** | **234** | **Laboratoire produit** — meilleur produit pour Lou ; coût **ne pilote pas** les choix |
| **Reference Production Chapter** | **224** | Reprend produit figé ; mesure coûts/temps/LLM ; optimise **méthode de production** |

**Acquis majeurs (publiés) :** gouvernance, pipeline lou-build, Composition V1, package 234, D1–D7, patrimoine E-A…E-D, Amorçage AP-A…AP-F, Reader Acceptance V1, **Product Polish V1 / Annotation UI Freeze V1**, modèle produit [`00-READER-V1-PRODUCT-MODEL.md`](renderer/00-READER-V1-PRODUCT-MODEL.md). **Lots D/AP clôturés** — ne pilotent plus la roadmap opérationnelle.

**Checklist implémentation :** [`docs/analysis/rpc-234-execution-audit.md`](analysis/rpc-234-execution-audit.md).

**Validations de référence :** Product Acceptance Suites [`TEST_ARCHITECTURE_V1.md`](testing/TEST_ARCHITECTURE_V1.md) · gate [`scripts/validate-reader-v1.sh`](../scripts/validate-reader-v1.sh) · Product Review manuelle

### Capacités Learner stabilisées (annotation — gelées)

| Capacité | État |
|---|---|
| Shell content-first | Gelé |
| Toolbar annotation unique | Gelée |
| Highlights V2 (mouseup, édition live, pas d'imbrication) | Gelés |
| Inline Notes (création, édition, reload) | Gelées |
| Préférences indépendantes highlight / note | Gelées |
| Modèle 1 couleur + 1 style exclusif | Gelé |
| Gomme highlight / note | Gelée |
| Édition objet entier (sélection partielle) | Gelée |
| Restauration complète après reload | Gelée |

---

## 3. Chemin critique

**Roadmap opérationnelle** ([`MASTER_ROADMAP.md`](MASTER_ROADMAP.md) · [`PROJECT_STATE.md`](PROJECT_STATE.md)) — pilotée par les **7 vues Reader**, pas par les lots D/AP.

```
Reader Acceptance V1 ✅
        ↓
Annotation UI Freeze V1 ✅
        ↓
Graphical Learning Layer V1 (conception)     ← ACTIF
        ↓
Phase 0 — Chaîne Fabrique → Reader           ← CLÔTURÉE
Phase 0.1 — Fiabiliser consommation          ← CLÔTURÉE
Phase 1 — Modèle mental                      ← CLÔTURÉE
        ↓
Phase 2 — Amorçage cognitif                  ← PROCHAINE (RPC 234)
        ↓
Phase 3 — Notions
        ↓
…
Phase 8 — Product Freeze
        ↓
Phase 9 — Reference Production Chapter (224)
```

**Prochain travail transversal Reader :** **Graphical Learning Layer V1** — figures SVG comme contenu pédagogique de première classe ; architecture et conception **uniquement**.

**Prochain jalon opérationnel RPC :** **Phase 2** — Amorçage cognitif.

**234** = découvrir le **meilleur produit**. **224** (Phase 9) = découvrir la **meilleure méthode industrielle**.

**Références :** [`docs/rpc/00-RPC-METHODOLOGY.md`](rpc/00-RPC-METHODOLOGY.md) · [`MASTER_ROADMAP.md` § Graphical Learning Layer V1](MASTER_ROADMAP.md#graphical-learning-layer-v1)

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
        ↓
Annotation UI (highlights · inline notes · toolbar) — GELÉE
```

**Prochaine couche transversale (conception) :** Graphical Learning Layer V1 — SVG pédagogiques.

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
| **Annotation UI (highlights · notes · toolbar)** | **Gelée** — Annotation UI Freeze V1 |
| **Critères d'acceptation** | **Prononcés** — 2026-08-02 |

**Tests renderer :** pilotage par **PAS** — gates **DEV** (`validate-dev.sh`) / **PAS** (§6) / **RELEASE** (`validate-reader-v1.sh`). Voir [`TEST_ARCHITECTURE_V1.md`](testing/TEST_ARCHITECTURE_V1.md).

**UI annotation :** ne pas ouvrir de lot fonctionnel sans instruction explicite du propriétaire — hors bug bloquant.

---

## 7. Chantiers recommandés

| Priorité | Chantier | Statut |
|---|---|---|
| **1** | **Graphical Learning Layer V1** — conception | **Actif** — architecture SVG ; pas d'implémentation |
| **2** | **Phase 2** — Amorçage cognitif (RPC 234) | **Prochaine** — package + vue Reader |
| — | Phase 3 — Notions | En attente |
| — | Phases 4–8 | En attente |
| — | Phase 9 — Reference Production Chapter (224) | En attente — après Product Freeze |

Ordre RPC = [`PROJECT_STATE.md` § Prochaines étapes](PROJECT_STATE.md#prochaines-étapes) = [`MASTER_ROADMAP.md` § Roadmap opérationnelle](MASTER_ROADMAP.md#roadmap-opérationnelle--reference-product-chapter-234).

---

## 8. Reprendre le projet

Lorsque le propriétaire dit *« On reprend le lot en cours »* :

1. Lire ce HANDOVER.
2. Lire [`PROJECT_STATE.md`](PROJECT_STATE.md) — **Graphical Learning Layer V1 actif** ; Phase 2 prochaine (RPC).
3. Lire [`MASTER_ROADMAP.md` § Graphical Learning Layer V1](MASTER_ROADMAP.md#graphical-learning-layer-v1).
4. **Ne pas modifier l'UI annotation** — gelée (`reader-ui-freeze-v1`) ; Product Reviews UI terminées.
5. Lire [`docs/rpc/00-RPC-METHODOLOGY.md`](rpc/00-RPC-METHODOLOGY.md) — Phases 0–9, produit vs production.
6. Lire [`renderer/00-READER-V1-PRODUCT-MODEL.md`](renderer/00-READER-V1-PRODUCT-MODEL.md).
7. **Validation :** [`docs/testing/TEST_ARCHITECTURE_V1.md`](testing/TEST_ARCHITECTURE_V1.md) — DEV / PAS / RELEASE.
8. **Product Review officielle :** [`docs/renderer/PRODUCT-REVIEW.md`](renderer/PRODUCT-REVIEW.md) — `./scripts/product-review-234.sh`.
9. **Chantier prioritaire transversal : Graphical Learning Layer V1** — SVG contenu pédagogique de première classe ; conception et architecture uniquement.
10. **Ne pas démarrer** Phase 9 (224) — conditionnée par Product Freeze (Phase 8).
11. **Ne pas présenter** le 230 comme prochaine étape — candidat futur non tranché.
12. **Ne pas rouvrir** de chantier UI annotation sans instruction explicite.

---

*Handover — 2026-08-03 — Annotation UI Freeze V1 ; Graphical Learning Layer V1 ouvert (conception) ; UI Reader gelée. Non normatif.*
