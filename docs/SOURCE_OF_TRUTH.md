# Lou Médecine — Source de vérité (acquisition)

**Statut :** gouvernance — règle permanente  
**Dernière mise à jour :** 2026-07-28  
**Décision actée :** 2026-07-28 — FIL B = unique chaîne d'acquisition officielle ; architecture gelée ([ADR-004](adr/ADR-004-acquisition-architecture-frozen.md))

Ce document définit la **chaîne d'acquisition officielle** du projet et la règle de **Single Source of Truth** (SSOT). Il complète [`MASTER_ROADMAP.md`](MASTER_ROADMAP.md) et [`SOURCE_PIPELINE_QUALIFICATION.md`](SOURCE_PIPELINE_QUALIFICATION.md).

**Mode maintenance.** À compter d'ADR-004, la couche d'acquisition est **gelée**. Toute évolution est limitée aux cas A/B/C définis dans ADR-004 § 6.

**Qualification Phase P :** le Markdown produit par cette chaîne est un **artefact intermédiaire** ; sa qualité se juge par la **suffisance pour les artefacts aval** (Inventory, Blueprint, projections, Renderer) — pas par la reproduction du PDF. Voir [`SOURCE_PIPELINE_QUALIFICATION.md`](SOURCE_PIPELINE_QUALIFICATION.md) § 0.

Les contrats techniques (`01-learning/tools/01-pdf-to-canonical/CONTRACT.md`, etc.) décrivent le comportement des outils ; **ce document désigne quelle chaîne est autoritaire** pour le projet.

---

## 1. Règle permanente — Single Source of Truth

> **Pour une même donnée métier, il ne peut exister qu'une seule source officielle.**

> **Toute duplication doit être explicitement identifiée comme :**
> - **copie de travail temporaire** ;
> - **artefact historique** ;
> - **ou fichier généré**.
>
> **Une duplication ne peut jamais devenir une seconde source d'autorité.**

Cette règle s'applique à l'acquisition du Collège, aux ancres, aux manifests et à tout artefact dont la fidélité médicale est garantie par traçabilité vers la source.

---

## 2. Chaîne officielle — FIL B

À compter du **2026-07-28**, le **FIL B** est l'**unique chaîne d'acquisition officielle** du projet Lou Médecine.

### Pipeline

```
Source primaire (PDF officiel)
        ↓
Tool 01 — lou-pdf-to-canonical v1.0.0
        ↓
Markdown source officiel (official-college.md)
        ↓
Tool 02 — lou-chapter-splitter v1.0.0
        ↓
Chapitres officiels (chapters/item-*.md)
        ↓
Pipeline Lou (Inventory, Blueprint, Projections, renderer…)
```

### Règles

| # | Règle |
|---|---|
| R1 | Le **PDF officiel** est la **seule source primaire** immuable. |
| R2 | **Tool 01** est le **seul pipeline autorisé** aujourd'hui pour produire le Markdown source à partir du PDF. |
| R3 | **Tool 02** est le **seul pipeline autorisé** pour produire les fichiers chapitre à partir du Markdown source. |
| R4 | Toute évolution future de l'acquisition doit **s'appuyer exclusivement** sur ces artefacts ou sur un **nouveau pipeline qualifié** (P1–P7) — jamais en parallèle non documenté. Modifications : voir [ADR-004](adr/ADR-004-acquisition-architecture-frozen.md) § 6. |
| R5 | Aucun composant aval ne doit lire le PDF pour extraire du contenu lorsque le Markdown source ou les chapitres existent. |

### Emplacements normatifs (cardiologie 2022 — collège pilote)

| Artefact | Chemin |
|---|---|
| Source primaire | `01-learning/full-edn/cardiology/edition-2022/official-college.pdf` |
| Markdown source | `01-learning/full-edn/cardiology/edition-2022/official-college.md` |
| Manifest Tool 01 | `01-learning/full-edn/cardiology/edition-2022/manifest.json` |
| Chapitres | `01-learning/full-edn/cardiology/edition-2022/chapters/item-*.md` |
| Manifest Tool 02 | `01-learning/full-edn/cardiology/edition-2022/chapters/manifest.json` |

Pattern général : `01-learning/full-edn/<specialty>/edition-<year>/`.

### Outils

| Tool | Chemin | Documentation |
|---|---|---|
| Tool 01 | `01-learning/tools/01-pdf-to-canonical/` | [`README.md`](../01-learning/tools/01-pdf-to-canonical/README.md), [`PIPELINE.md`](../01-learning/tools/PIPELINE.md) |
| Tool 02 | `01-learning/tools/02-chapter-splitter/` | Idem |

---

## 3. FIL A — legacy en décommission

Le **FIL A** n'est **plus une source officielle**. Il est reclassé **artefact historique de transition**.

| | FIL A (legacy) | FIL B (officiel) |
|---|---|---|
| **Fichier pivot** | `01-learning/chapter-analysis/cardio/234-insuffisance-cardiaque/official-college.md` | `01-learning/full-edn/…/official-college.md` + chapitres Tool 02 |
| **Périmètre** | Item 234 seul | Collège complet (22 chapitres) |
| **Provenance** | Méthode non documentée (2026-07-05) | Tool 01 + Tool 02, manifests, SHA-256 |
| **Statut** | **Legacy — décommission en cours** | **Source officielle unique** |

### Règles FIL A

- **Ne pas** utiliser le FIL A pour de nouveaux développements, benchmarks Phase P, ni qualification d'acquisition.
- **Ne pas** corriger, enrichir ou étendre le FIL A ; il est **gelé** en l'état.
- **Conserver** le FIL A **uniquement** le temps de la suppression de l'artefact legacy après validation CI.
- **Supprimer** le FIL A lorsque la décommission technique sera validée (Item 234 migré FIL B — voir [`PROJECT_STATE.md`](PROJECT_STATE.md)).

### Écosystème FIL A concerné par la migration (hors périmètre de ce document)

Le dossier `01-learning/chapter-analysis/cardio/234-insuffisance-cardiaque/` (coverage, storyboard) et les références hardcodées dans `01-learning/chapters/cardio/234/` restent des **artefacts historiques ou de travail** jusqu'à migration — voir [`PROJECT_STATE.md`](PROJECT_STATE.md), section « Migration FIL A ».

---

## 4. Relation avec la qualification (Phase P — clôturée)

La Phase P a **qualifié** le pipeline d'acquisition sur le **FIL B** (corpus : [`benchmark/corpus/`](../benchmark/corpus/README.md)). Verdict final : **GO** — voir [`acquisition/qualification-report-acquisition-final.md`](acquisition/qualification-report-acquisition-final.md).

**Critère de succès :** suffisance pour Inventory, Blueprint, projections et Renderer — voir [`SOURCE_PIPELINE_QUALIFICATION.md`](SOURCE_PIPELINE_QUALIFICATION.md) § 0. Pas la reproduction parfaite du PDF.

Pour le PDF cardiologie 2022, le pipeline qualifié et **gelé** est Tool 01 v1.0.0 + Tool 02 v1.0.0. Optimisations orientées fidélité PDF restent **interdites** sauf cas ADR-004 § 6.

---

## 5. Documents connexes

| Document | Rôle |
|---|---|
| [`MASTER_ROADMAP.md`](MASTER_ROADMAP.md) | Pilotage, invariants SSOT |
| [`PROJECT_STATE.md`](PROJECT_STATE.md) | Décision actée, migration en cours |
| [`SOURCE_PIPELINE_QUALIFICATION.md`](SOURCE_PIPELINE_QUALIFICATION.md) | Critères Phase P |
| [`adr/ADR-004-acquisition-architecture-frozen.md`](adr/ADR-004-acquisition-architecture-frozen.md) | Architecture acquisition gelée — mode maintenance |
| [`acquisition/qualification-report-acquisition-final.md`](acquisition/qualification-report-acquisition-final.md) | Verdict GO final Phase P |
| [`SOURCE_FORMAT_COMPARATIVE.md`](SOURCE_FORMAT_COMPARATIVE.md) | Choix format source |
| [`benchmark/corpus/README.md`](../benchmark/corpus/README.md) | Corpus de référence FIL B |
| [`01-learning/tools/PIPELINE.md`](../01-learning/tools/PIPELINE.md) | Architecture Tool 01 → Tool 02 |
