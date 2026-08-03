# Reader Composition V1 — Architecture Freeze

## Statut

| | |
|---|---|
| **Type** | Gel d'implémentation — périmètre V1 |
| **Date** | 2026-07-31 |
| **Statut** | **Implémenté et clôturé** — Lots A–F (2026-07-31) ; simplification artefact unique par vue (2026-08-03) |
| **Autorité** | Complète les documents normatifs ; ne les remplace pas |
| **Portée** | Reader Composition V1 — chapitre de référence `cardio/234` |
| **Point d'entrée** | Gel d'architecture — référence obligatoire ; tag `reader-composition-v1` en attente |

### Documents faisant autorité

En cas de conflit, priment dans cet ordre :

1. ADR applicables ;
2. contrats fondamentaux 01–06 et contrats composants (07–09) ;
3. [`COMPOSITION-COMPONENT-CONTRACT.md`](../contracts/components/COMPOSITION-COMPONENT-CONTRACT.md) ;
4. docs Reader 14–16 ;
5. **ce document** — périmètre d'implémentation V1 uniquement.

[`COMPOSITION-COMPONENT-CONTRACT.md`](../contracts/components/COMPOSITION-COMPONENT-CONTRACT.md) reste la **référence contractuelle** de la couche Composition.

Ce document **ne définit pas** la Composition. Il **fige uniquement** les choix retenus pour l'implémentation V1, issus des revues d'architecture.

---

## 1. Principes gelés

Les invariants suivants sont **définitifs** pour Reader Composition V1 :

- Inventory est indépendant du Reader.
- Blueprint est indépendant du Reader.
- Les projections (`story`, `mechanisms`, `clinical-reasoning`, etc.) restent les unités de production de La Fabrique. *(La projection `overview` n'est plus publiée ni consommée en V1 — voir §2.)*
- Les ids techniques des projections ne sont pas renommés.
- Le Chapter Package publie des identités et des artefacts de production — **jamais** de vues Reader.
- Le manifest ne porte jamais de libellés, emojis, ordre d'affichage ni nomenclature produit Reader.
- Les vues Reader sont définies **exclusivement** par la Composition Specification.
- Le modèle « 1 projection = 1 vue Reader » est **aboli**.
- La frontière Fabrique ↔ Reader est la **Composition**.
- Le Renderer ne construit jamais les vues.
- Le Renderer ne lit jamais la Composition Specification.
- Le Renderer ne lit jamais le registre projections pour la navigation.
- Le Reading View Model est l'**unique entrée** du Renderer pour le contenu officiel composé.
- La Composition ne crée, ne reformule et ne modifie jamais de contenu médical.
- La Composition ne lit jamais Inventory, Blueprint ni source d'acquisition.
- Les notes et annotations appartiennent à la Learner Layer — pas au package ni à la Composition.
- Les questions d'évaluation et les scénarios cliniques restent des objets Release distincts des projections.

---

## 2. Architecture retenue

```
Chapter Package (manifest + artefacts)
        ↓
Composition Specification
        ↓
Composition Engine          compose(manifest, compositionSpec) → { readingViewModel, diagnostics }
        ↓
Reading View Model
        ↓
Renderer
        ↓
Learner Layer
```

**Aucun autre composant** n'est introduit pour Reader Composition V1.

### Sept vues Reader — ids produit figés

| displayOrder | viewId | Label |
|---|---|---|
| 1 | `cognitive-priming` | Amorçage cognitif |
| 2 | `mental-model` | Modèle mental |
| 3 | `notions` | Notions |
| 4 | `clinical-cases` | Cas cliniques |
| 5 | `college-official` | Collège officiel |
| 6 | `qcm` | QCM |
| 7 | `notes` | Notes |

### Mapping Item 234 — figé (2026-08-03 : un artefact principal par vue)

| Vue | Artefact éditorial principal | Source Composition |
|---|---|---|
| Amorçage cognitif | `build/cognitive-priming.v1.json` | `cognitive-priming` / manifest |
| Modèle mental | `projections/understanding/story.md` | `projection: story` |
| Notions | `projections/understanding/mechanisms.md` | `projection: mechanisms` |
| Cas cliniques | `projections/understanding/clinical-reasoning.md` + scénarios | `clinical-reasoning` + `scenarios: registry` |
| Collège officiel | `source/official-college.md` | `college-source` |
| QCM | `questions/*.yaml` | `questions: registry` |
| Notes | patrimoine apprenant | `kind: none` |

**Suppression 2026-08-03 :** la projection `overview` et `overview.md` sont retirées — le walkthrough MM est porté exclusivement par `story.md` (voir [`overview-consumer-audit.md`](../analysis/overview-consumer-audit.md)).

**Découplage MM ↔ Notions (2026-08-03) :** Composition assemble `story` et `mechanisms` comme **vues indépendantes** — aucune correspondance 1:1 bloc MM / notion n'est encodée au runtime. Les liens MM → Notion relèvent de la **production éditoriale** (optionnels). Voir [`mm-notions-editorial-relationship-audit.md`](../analysis/mm-notions-editorial-relationship-audit.md).

### Mapping Item 234 — historique (2026-07-31 → 2026-08-02)

| Vue | Sources V1 (abrogé) |
|---|---|
| Modèle mental | ~~`projection: story` + `projection: overview`~~ |

---

## 3. Décisions V1

### Fonctionnalités retenues

| Décision | Énoncé |
|---|---|
| ✓ | Spec plate unique (un fichier, pas de surcharge) |
| ✓ | Engine minimal — `compose(manifest, compositionSpec)` déterministe |
| ✓ | Reading View Model minimal (identités, refs, ordre — pas de markdown pré-parsé) |
| ✓ | `mergeOrder` pour agrégation N projections → 1 vue |
| ✓ | Sources via `kind` + `ref` |
| ✓ | `kind` : `projection`, `questions`, `scenarios`, `college-source`, `none` |
| ✓ | `version`, `label`, `displayOrder` par vue |
| ✓ | `availabilityPolicy` au niveau vue uniquement |
| ✓ | `blocks[]` légers : `{ elementId, sourceProjectionId, pedagogicalOrder, artifactRef }` |
| ✓ | `questions[]`, `scenarios[]`, `collegeRef` dans le ViewModel (ids + paths) |
| ✓ | Diagnostics minimaux hardcodés (4 codes, sévérités fixes) |
| ✓ | 7 `viewId` stables (table §2) |
| ✓ | Navigation Renderer depuis `viewModel.views` — rupture `buildProjectionTabs` |
| ✓ | Badges et TOC : responsabilité Renderer (règles statiques par `viewId`) |
| ✓ | Package Access séparé pour le fetch des artefacts |
| ✓ | Neutralisation manifest (`label`, `known_absent` recentré production) — après branchement Renderer |

### Fonctionnalités reportées

| Décision | Énoncé |
|---|---|
| ✗ | Héritage corpus / spécialité / chapitre |
| ✗ | `inherits`, résolveur de surcharge spec |
| ✗ | `elementSelector` (1 projection → N vues) |
| ✗ | Scission `story` entre Amorçage et Modèle mental |
| ✗ | Hydratation markdown (`officialContent` pré-parsé dans ViewModel) |
| ✗ | `badgePolicy` dans la spec |
| ✗ | `intent`, `specId` dans la spec |
| ✗ | `diagnosticsPolicy` configurable |
| ✗ | `availabilityPolicy` par source |
| ✗ | Navigation enrichie dans ViewModel |
| ✗ | Métadonnées debug ViewModel (`composedAt`, `manifestFingerprint`) |
| ✗ | Gate build convention blocs (pipeline) — parallèle, non bloquant navigation |
| ✗ | Catalogue corpus / Library |
| ✗ | Persistance du View Model |
| ✗ | Composition permanente dans le Renderer |
| ✗ | Toute fonctionnalité non indispensable à Reader V1 |

**Règle :** toute fonctionnalité non listée dans les fonctionnalités retenues est considérée comme **hors périmètre V1**.

---

## 4. Répartition des responsabilités

| Couche | Responsabilités | Ne fait jamais |
|---|---|---|
| **Package** | Publie projections, questions, scénarios, figures, traçabilité, ordre pédagogique, absences de production, références source Collège | Libellés vues, ordre d'affichage vues, agrégation, mapping projection→vue, états vue Reader |
| **Composition Specification** | Déclare les 7 vues, labels, displayOrder, sources (`kind`+`ref`), mergeOrder, availabilityPolicy vue | Contenu médical, modification manifest, lecture Inventory/Blueprint, exécution runtime |
| **Composition Engine** | `compose()` ; résout sources ; agrège projections ; produit ViewModel minimal et diagnostics ; calcule availability par vue | DOM, reformulation médicale, fetch artefacts, lecture apprenant, modification package, heuristique markdown |
| **Reading View Model** | Expose chapitre, 7 vues ordonnées, blocs/refs, questions/scenarios/collegeRef, diagnostics | Autorité médicale, persistance officielle, décision de présentation DOM |
| **Renderer** | Présente le ViewModel ; fetch via Package Access ; règles UI statiques (TOC Notions, badges) ; immutabilité contenu officiel | Choisir vues, lire spec, lire registre projections pour onglets, filtrer éléments non listés dans ViewModel, reformuler contenu |
| **Learner Layer** | Overlays (surlignage, annotations) ; persistance Notes ; diagrammes personnels | Influencer la composition officielle ; devenir source de vérité médicale |

---

## 5. Invariants

Ces invariants **ne doivent jamais être violés** pendant l'implémentation :

1. Aucune vue n'est déduite directement des projections.
2. Aucune responsabilité Reader ne retourne dans le Chapter Package.
3. Aucune reformulation médicale dans la Composition.
4. Les projections restent les unités de production ; les vues restent les unités d'expérience.
5. Le Renderer ne décide jamais quelles vues existent ni dans quel ordre.
6. Une vue peut agréger plusieurs projections — uniquement si déclaré dans la spec (`mergeOrder`).
7. Questions et scénarios ne deviennent jamais des projections.
8. Le ViewModel est la seule entrée officielle du Renderer.
9. `compose()` est déterministe : mêmes entrées → même sortie.
10. Toute projection publiée non consommée produit un diagnostic explicite.
11. Aucun fallback silencieux modifiant le sens affiché.

---

## 6. Hors périmètre V1

Réponse normative : **« ce n'est pas prévu dans la V1 »** pour :

- héritage ou surcharge de spec multi-niveaux ;
- filtrage d'éléments par projection (`elementSelector`) ;
- contenu Amorçage cognitif alimenté par le package ;
- pré-parsing markdown dans l'Engine ;
- badges ou politiques d'affichage dans la spec ;
- configuration des sévérités de diagnostics ;
- métadonnées debug ou cache dans le ViewModel ;
- navigation avancée déclarée dans le ViewModel ;
- gate pipeline convention blocs Markdown ;
- catalogue bibliothèque multi-chapitres ;
- persistance ou publication du View Model ;
- renommage des projections ou ids techniques ;
- modification Inventory, Blueprint ou contrats existants ;
- contenu médical ou éditorial ;
- Inter-EDN, progression, gamification, banques EDN dans le Reader ;
- sync cloud, collaboration, chat IA.

---

## 7. Ouverture de l'implémentation

**L'architecture Reader Composition V1 est gelée et implémentée.** Le chantier Lots A–F est **clôturé**. La phase active est **Reader Acceptance V1** — voir [`PROJECT_STATE.md`](../PROJECT_STATE.md).

Les décisions de ce document ne doivent plus être rediscutées pendant l'implémentation.

Toute évolution fonctionnelle ou architecturale devra faire l'objet d'une **nouvelle décision d'architecture** après la V1.

**Premier lot autorisé :** Composition Specification plate unique (`version` + 7 vues + mapping Item 234).

**Signature figée :**

```
compose(manifest, compositionSpec) → { readingViewModel, diagnostics }
```

---

## Documents connexes

| Document | Rôle |
|---|---|
| [`COMPOSITION-COMPONENT-CONTRACT.md`](../contracts/components/COMPOSITION-COMPONENT-CONTRACT.md) | Contrat composant — obligations durables Composition |
| [`COMPOSITION-DECISION-REGISTRY.md`](../governance/COMPOSITION-DECISION-REGISTRY.md) | Décisions D1–D6 (informatif) |
| [`COMPOSITION-IMPLEMENTATION-DEBT.md`](../governance/COMPOSITION-IMPLEMENTATION-DEBT.md) | Dette d'implémentation actuelle |
| [14-LOU-READER-ARCHITECTURE.md](./14-LOU-READER-ARCHITECTURE.md) | Vision Reader — sept vues |
| [15-READER-FUNCTIONAL-SPECIFICATION.md](./15-READER-FUNCTIONAL-SPECIFICATION.md) | Spécification fonctionnelle — comportement utilisateur |
| [16-CONTENT-TO-READER-ARCHITECTURE.md](./16-CONTENT-TO-READER-ARCHITECTURE.md) | Frontière publication ↔ Reader |
