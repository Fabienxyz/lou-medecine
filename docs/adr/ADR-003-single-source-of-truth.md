# ADR-003 — Single Source of Truth pour les sources officielles

## Statut

**Accepted**

## Date

2026-07-28

---

## Contexte

Au moment de cette décision, le dépôt Lou Médecine comportait **deux fils d'acquisition concurrents** pour le contenu officiel du Collège de cardiologie :

### FIL A (historique)

- **Pivot :** `01-learning/chapter-analysis/cardio/234-insuffisance-cardiaque/official-college.md` (~1 352 lignes).
- **Périmètre :** Item 234 seul.
- **Introduction :** commit `f378c68` (2026-07-05) ; méthode de production non documentée dans le dépôt.
- **Usage :** référence opérationnelle pour le vertical slice Item 234 — `source.meta.yaml`, scripts de build, Inventory, Traceability, `lou-build`.

### FIL B (structuré)

- **Pivot :** `01-learning/full-edn/cardiology/edition-2022/`.
- **Chaîne :** PDF officiel → Tool 01 (`lou-pdf-to-canonical` v1.0.0) → `official-college.md` (~13 724 lignes) → Tool 02 (`lou-chapter-splitter` v1.0.0) → 22 chapitres `chapters/item-*.md`.
- **Introduction :** commits `3644e10` et `e2def52` (2026-07-25) ; manifests et SHA-256 ; regénération Tool 01 vérifiée byte-identique au fichier commité.
- **Source primaire archivée :** `official-college.pdf`.

### Situation

La **même donnée métier** (contenu officiel EDN, au moins pour l'Item 234) existait donc en **deux emplacements distincts**, avec des différences structurelles mesurées (hiérarchie, tableaux, label d'édition `2024-SFC` vs `2022`).

Cette duplication créait un risque concret de :

- **divergence** entre consommateurs pointant vers l'un ou l'autre fil ;
- **maintenance** sur deux bases (corrections, ancres, validation) ;
- **erreurs** lors de nouveaux développements ou de la qualification Phase P si la chaîne de référence n'était pas explicitement unique.

La Phase P (qualification du pipeline d'acquisition) et la gouvernance projet (`docs/SOURCE_OF_TRUTH.md`, `docs/MASTER_ROADMAP.md`) exigeaient de trancher avant d'investir davantage.

---

## Décision

À compter du **2026-07-28**, les règles suivantes sont **actées et permanentes** :

### Chaîne officielle unique — FIL B

| Règle | Contenu |
|---|---|
| Chaîne | Le **FIL B** est l'**unique chaîne d'acquisition officielle** du projet Lou Médecine. |
| Source primaire | Le **PDF officiel** archivé dans `01-learning/full-edn/` est la **seule source primaire** immuable. |
| Markdown source | **Tool 01** (`lou-pdf-to-canonical`) est le **seul pipeline autorisé** pour produire le Markdown source (`official-college.md`). |
| Chapitres | **Tool 02** (`lou-chapter-splitter`) est le **seul pipeline autorisé** pour produire les fichiers chapitre. |
| Évolution | Toute évolution future de l'acquisition doit s'appuyer **exclusivement** sur ces artefacts ou sur un pipeline qualifié en Phase P qui les remplace ou les étend — jamais en parallèle non documenté. |

Pipeline normatif :

```
PDF officiel → Tool 01 → Markdown source → Tool 02 → Chapitres → Pipeline Lou
```

### FIL A — artefact historique de transition

Le **FIL A** (`chapter-analysis/…/official-college.md`) est reclassé **artefact historique de transition**. Il **ne constitue plus une source officielle**. Il est conservé uniquement le temps nécessaire à la migration des composants qui en dépendent, puis **supprimé** lorsque cette migration sera validée.

### Principe permanent — Single Source of Truth

> **Pour une même donnée métier, il ne peut exister qu'une seule source officielle.**

> **Toute duplication doit être explicitement identifiée comme :**
> - copie de travail temporaire ;
> - artefact historique ;
> - fichier généré.
>
> **Une duplication ne peut jamais devenir une seconde source d'autorité.**

Ce principe s'applique à l'acquisition du Collège, aux ancres, aux manifests et à tout artefact dont la fidélité médicale repose sur la traçabilité vers la source.

---

## Conséquences

### Positives

- **Gouvernance simplifiée** — une seule chaîne désignée comme autoritative ; fin de l'ambiguïté FIL A / FIL B dans les documents de pilotage.
- **Reproductibilité** — PDF + Tool 01 + Tool 02 + manifests ; regénération vérifiable par hash.
- **Réduction des ambiguïtés** — les nouveaux travaux (Phase P, 0B, extensions multi-chapitres) s'ancrent sur `full-edn/`.
- **Qualification Phase P** — benchmark et GO/NO GO sur **une seule chaîne** (`benchmark/corpus/` ancré FIL B).
- **Maintenance** — corrections et évolutions concentrées sur Tool 01 / Tool 02, pas sur deux pivots Markdown.
- **Disparition progressive du FIL A** — objectif explicite de décommission après migration.

### Différé volontairement

La **migration technique** des consommateurs encore ancrés sur le FIL A (Item 234 : `source.meta.yaml`, scripts build, `lou-build`, ancres Inventory, contrats techniques) est **volontairement différée** à une phase ultérieure. Cette ADR fige la **décision de gouvernance** ; elle n'impose pas la bascule immédiate du code ni des artefacts métier.

---

## Plan de transition

1. **Qualification du pipeline FIL B (Phase P)** — corpus gelé, dossier `docs/acquisition/`, verdict GO/NO GO sur Tool 01 + Tool 02.
2. **Migration des consommateurs du FIL A** — `source.meta.yaml`, scripts `chapters/cardio/234/build/`, `lou-build`, tests.
3. **Revalidation des ancres et de la traçabilité** — Inventory et `traceability.json` Item 234 sur chapitre FIL B (`full-edn/…/chapters/item-234-*.md`).
4. **Mise à jour des contrats** — `IMPLEMENTATION_CONTRACT.md`, `ARCHITECTURE_AUDIT.md`, `REFERENCE_IMPLEMENTATION_DESIGN.md` et citations FIL A.
5. **Suppression définitive du FIL A** — retrait de `chapter-analysis/cardio/234-insuffisance-cardiaque/official-college.md` après validation de la migration.

Détail opérationnel : [`docs/PROJECT_STATE.md`](../PROJECT_STATE.md), section « Migration FIL A ».

---

## Alternatives étudiées

### Conserver les deux fils en parallèle

**Rejetée.** Maintient la duplication, la divergence possible et l'ambiguïté pour Phase P, les ancres et les nouveaux contributeurs. Contredit le principe SSOT.

### Migration immédiate (bascule code + suppression FIL A)

**Rejetée.** Scope trop large pour une décision de gouvernance seule ; risque de régression sur le vertical slice Item 234 (Inventory, Traceability, CI) sans revalidation préalable des ancres sur FIL B. La migration technique mérite un chantier dédié.

### Migration progressive (décision actée, exécution différée)

**Retenue.** Acter FIL B comme unique autorité **immédiatement** ; conserver FIL A gelé comme artefact historique le temps de migrer les consommateurs ; supprimer après validation. Alignée avec la roadmap (Phase P → 0B → migration Item 234).

---

## Cohérence avec les ADR existantes

| ADR | Relation |
|---|---|
| **ADR-001** (grammaire SVG) | Cohérent — la validation Cardiologie s'appuie sur les 22 chapitres Tool 02 (FIL B). |
| **ADR-002** (Renderer V2) | Cohérent sur le principe d'immutabilité du contenu officiel ; le vertical slice Item 234 reste temporairement câblé FIL A jusqu'à l'étape 2 du plan de transition. |

## Conflits de gouvernance détectés (non résolus par cette ADR)

| Conflit | Nature | Résolution prévue |
|---|---|---|
| `IMPLEMENTATION_CONTRACT.md` cite encore le FIL A (ex. lignes Item 234) | Contrat technique vs gouvernance acquisition | Étape 4 du plan de transition |
| Composants Item 234 (`source.meta.yaml`, build scripts, `lou-build`) pointent FIL A | Implémentation vs décision SSOT | Étape 2 du plan de transition |
| Label d'édition `2024-SFC` (FIL A) vs `2022` (FIL B) | Métadonnées divergentes | Harmonisation lors de la migration |
| Phase P non close (GO/NO GO absent, `docs/acquisition/` incomplet) | Gouvernance acquisition en cours vs chaîne déjà désignée officielle | La chaîne FIL B est actée ; la qualification formelle reste à produire |

Aucun conflit avec ADR-001 ou ADR-002 sur le fond architectural (grammaire visuelle, renderer). Les conflits listés concernent l'**alignement implémentation / contrats** avec la nouvelle règle SSOT — attendus et couverts par le plan de transition.

---

## Références

| Document | Rôle |
|---|---|
| [`docs/SOURCE_OF_TRUTH.md`](../SOURCE_OF_TRUTH.md) | Spécification opérationnelle SSOT et chemins FIL B |
| [`docs/MASTER_ROADMAP.md`](../MASTER_ROADMAP.md) | Invariants et Phase P |
| [`docs/PROJECT_STATE.md`](../PROJECT_STATE.md) | Décision actée, migration FIL A |
| [`docs/SOURCE_PIPELINE_QUALIFICATION.md`](../SOURCE_PIPELINE_QUALIFICATION.md) | Gouvernance Phase P |
| [`benchmark/corpus/README.md`](../../benchmark/corpus/README.md) | Corpus de qualification FIL B |
| [`01-learning/tools/PIPELINE.md`](../../01-learning/tools/PIPELINE.md) | Architecture Tool 01 → Tool 02 |
| [`adr/ADR-004-acquisition-architecture-frozen.md`](../adr/ADR-004-acquisition-architecture-frozen.md) | Gel architecture acquisition |

---

## Mise à jour post-ADR-004 (2026-07-28)

Les éléments suivants, prévus comme différés dans le plan de transition ci-dessus, sont **accomplis** :

- Migration opérationnelle Item 234 vers FIL B (`source.meta.yaml`, ancres, `lou-build validate` PASS).
- Qualification formelle Phase P — verdict **GO** ([`qualification-report-acquisition-final.md`](../acquisition/qualification-report-acquisition-final.md)).
- Double vertical slice 234 + 330 sur FIL B exclusif.

La **décision de gouvernance** (FIL B = SSOT, FIL A = legacy) reste inchangée. ADR-004 acte le **gel** de l'architecture et la **fin de la R&D acquisition**. La décommission physique du fichier FIL A legacy est le seul reliquat technique — voir [`PROJECT_STATE.md`](../PROJECT_STATE.md).
