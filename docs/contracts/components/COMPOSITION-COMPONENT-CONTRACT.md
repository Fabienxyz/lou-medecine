# Composition Component Contract

| | |
|---|---|
| **Type** | Contrat composant normatif |
| **Statut** | En vigueur |
| **Composant** | Composition (Reader) |
| **Index** | [`../00-INDEX.md`](../00-INDEX.md) · [`00-INDEX.md`](00-INDEX.md) |

Ce document définit les **obligations durables** de la **couche de composition** du Reader. Il spécialise les ADR et les contrats fondamentaux pour ce composant. Il ne redéfinit pas l'architecture système, ne documente pas une implémentation particulière et n'introduit aucune décision médicale nouvelle.

Registre des décisions : [`COMPOSITION-DECISION-REGISTRY.md`](../../governance/COMPOSITION-DECISION-REGISTRY.md).

---

## 1. Statut et autorité

### 1.1 Statut normatif

Le présent document est un **contrat composant**. Ses obligations **MUST / DOIT** et **MUST NOT / NE DOIT PAS** sont normatives pour toute implémentation de la couche de composition.

### 1.2 Place dans la hiérarchie

```
ADR
  ↓
Contrats fondamentaux (01–06)
  ↓
Contrats composants (Composition, Renderer, …)   ← ce document
  ↓
Documentation technique Reader
  ↓
Code et tests
```

La composition et le Renderer sont **deux composants distincts** au même niveau hiérarchique. La composition **prime** sur le Renderer pour toute question de **sélection, agrégation ou ordonnancement des vues cognitives**. Le Renderer **prime** sur la composition pour toute question de **présentation DOM, immutabilité affichée et couche apprenant**.

### 1.3 Documents qui priment

En cas de conflit, priment dans cet ordre :

1. les ADR applicables ([ADR-001](../../adr/ADR-001-freeze-svg-grammar-catalogue.md) à [ADR-005](../../adr/ADR-005-learner-layer-annotation-anchoring.md)) ;
2. les contrats fondamentaux [01](../01-TRUST-AND-FIDELITY.md) à [06](../06-RENDERER-AND-LEARNER-LAYER.md).

Ce contrat **NE DOIT PAS** contredire un document supérieur.

### 1.4 Documents sur lesquels il prime

Ce contrat **prime** sur :

- [`16-CONTENT-TO-READER-ARCHITECTURE.md`](../../renderer/16-CONTENT-TO-READER-ARCHITECTURE.md) pour les obligations composant de la composition ;
- la documentation technique Reader (`docs/renderer/`, documentation d'implémentation versionnée) ;
- le code et les tests de la couche de composition ;
- toute description d'implémentation ou roadmap produit relative à la composition.

Une organisation de modules ou un format de fichier différent **n'invalide pas** ce contrat tant que les obligations et invariants sont respectés.

---

## 2. Responsabilité

### 2.1 Mission

La couche de composition **DOIT** transformer, de façon **déclarative** :

```
Manifest publié  +  Composition Specification applicable
                    ↓
             Reading View Model  +  diagnostics
```

Elle **traduit** les unités de production publiées en **unités d'expérience** du Reader — sans créer ni modifier de contenu médical.

### 2.2 Ce que la composition DOIT faire

| Domaine | Obligation |
|---|---|
| **Sélection** | Sélectionner des **identités publiées** et des **projections déclarées** selon la Composition Specification |
| **Groupement** | Grouper les identités sélectionnées en **vues cognitives** |
| **Présentation logique** | Déterminer libellés, ordre d'affichage des vues et politique de disponibilité |
| **Ordre pédagogique interne** | **Préserver** l'ordre pédagogique des éléments **tel que publié** — ne pas réordonner arbitrairement le sens médical |
| **Résolution des blocs** | Produire une séquence de blocs pédagogiques **déterministe** à partir des artefacts publiés et de règles explicites (§5) |
| **États** | Exposer explicitement les états d'absence, de retenue, de manque ou d'invalidité |
| **Diagnostics** | Produire des diagnostics vérifiables (§11) |

### 2.3 Ce que la composition NE DOIT PAS faire

La composition **NE DOIT PAS** :

- générer, reformuler, paraphraser ou enrichir du contenu médical ;
- créer une identité officielle ([contrat 02](../02-IDENTITY-AND-ANCHORS.md)) ;
- modifier le Chapter Package, le manifest ou tout artefact publié ;
- lire l'inventaire, le Blueprint, la source d'acquisition ou un visualSpec pour en **inférer** un sens médical ;
- dépendre des données apprenantes pour composer le contenu officiel ;
- produire directement du DOM ou du HTML de présentation ;
- imposer une relation obligatoire **une projection = une vue** ;
- effectuer un fallback silencieux susceptible de modifier le sens affiché.

---

## 3. Entrées autorisées

Les seules catégories d'entrées autoritaires pour la composition sont :

| Catégorie | Règle |
|---|---|
| **Manifest publié** | Point d'entrée du contenu officiel — registre, états, références, ordre pédagogique des projections |
| **Artefacts déclarés par le manifest** | Projections, figures publiées, sidecars de traçabilité référencés — **uniquement** pour résolution et assemblage |
| **Composition Specification applicable** | Règles de vue versionnées, propriété Reader (§4) |
| **Identifiant de chapitre** | Contexte de résolution (`specialty/item`) |
| **Configuration technique de résolution** | Chemins, politique de surcharge de spec, bornes de compatibilité — **sans sémantique médicale** |

La composition **NE DOIT PAS** accepter comme entrée autoritaire : inventaire, Blueprint, source d'acquisition, visualSpec sémantique, état de travail non publié, données apprenant, ou toute base métier parallèle au package publié.

---

## 4. Composition Specification

### 4.1 Propriétaire et nature

| Propriété | Énoncé |
|---|---|
| **Propriétaire** | Le **Reader** — jamais La Fabrique, jamais le Chapter Package médical |
| **Caractère** | Donnée **versionnée**, **auditable**, **déclarative** |
| **Autorité** | Autorité d'**expérience** uniquement — jamais autorité médicale |
| **Format** | **Non figé** par ce contrat — toute sérialisation respectant les concepts §4.3 est admise |

### 4.2 Niveaux de spécification

La Composition Specification **PEUT** être structurée en niveaux, résolus par surcharge décroissante :

| Niveau | Portée | Usage |
|---|---|---|
| **Défaut corpus** | Toutes les vues cognitives par défaut | Baseline produit — sept vues doc 14–15 |
| **Spécialité** | Surcharge optionnelle par spécialité | Variation d'agrégation ou de libellé sans toucher au package |
| **Chapitre** | Surcharge **exceptionnelle** | Chapitre atypique — **doit** être justifiée et diagnostiquée |

Une surcharge chapitre **NE DOIT PAS** devenir le mode normal de configuration produit.

### 4.3 Concepts minimaux

Structure conceptuelle — indépendante du format de sérialisation :

```
CompositionSpecification
├── version                          ← identifiant de version de la spec
├── views[]
│   ├── id                           ← identifiant stable de vue (produit, non médical)
│   ├── label                        ← libellé d'affichage (peut inclure emoji)
│   ├── displayOrder                 ← ordre d'affichage des vues — distinct de l'ordre pédagogique package
│   ├── intent                       ← objectif cognitif déclaratif (informatif pour audit)
│   ├── sources[]
│   │   ├── projectionId             ← identifiant de projection publiée ou attendue
│   │   └── elementSelector          ← optionnel — identité exacte, liste, ou motif déclaré
│   └── availabilityPolicy           ← comportement si source absente, retenue, vide ou invalide
└── diagnosticsPolicy                ← sévérité par défaut des diagnostics (§11)
```

### 4.4 Règles de résolution des sources

Pour chaque vue, la composition **DOIT** :

1. résoudre chaque `projectionId` contre le registre du manifest ;
2. appliquer chaque `elementSelector` contre les identités **déclarées** pour la projection ;
3. **préserver** l'ordre des éléments **tel que publié** dans la projection, sauf règle d'agrégation **explicitement déclarée** dans la spec ;
4. appliquer `availabilityPolicy` lorsque la source est absente, retenue, manquante, invalide ou vide après filtrage.

La composition **NE DOIT PAS** inventer une projection ou une identité non déclarée par le manifest.

### 4.5 Règles de surcharge

| Règle | Énoncé |
|---|---|
| **Précédence** | chapitre > spécialité > défaut corpus |
| **Non-destructive** | Une surcharge **remplace ou complète** une vue — elle ne supprime pas silencieusement une vue du défaut sans diagnostic |
| **Validation** | Toute spec **DOIT** être validable statiquement avant exécution (références, version, champs obligatoires) |

### 4.6 Validation de la spec

Avant composition, la spec **DOIT** être validée pour :

- un `version` reconnu ou géré explicitement ;
- des `id` de vue uniques ;
- des `displayOrder` uniques au sein d'une spec résolue ;
- des `projectionId` syntaxiquement valides ;
- des `availabilityPolicy` reconnues.

Une spec invalide **DOIT** produire une erreur **bloquante** — pas une composition partielle silencieuse.

---

## 5. Reading View Model

### 5.1 Nature

Le **Reading View Model** est une représentation **calculée**, **sans autorité propre**, produite par la composition à partir du manifest et de la spec.

| Propriété | Énoncé |
|---|---|
| **Autorité** | **Aucune** — arrangement d'identités et de contenus déjà publiés |
| **Publication** | **Non publié** par La Fabrique |
| **Persistance** | **Normalement non persisté** — recalculable à identiques entrées |
| **Interface** | Entrée logique **obligatoire** du Renderer pour le contenu officiel composé |

### 5.2 Structure conceptuelle minimale

```
ReadingViewModel
├── chapter
│   ├── id                           ← identifiant chapitre (contrat 02)
│   ├── title, edition, provenance   ← métadonnées publiées
│   └── publicationGuarantees          ← références aux garanties consultables
├── views[]
│   ├── id, label, displayOrder
│   ├── availability                 ← état agrégé de la vue (§6)
│   ├── blocks[]
│   │   ├── identity                 ← identifiant d'élément pédagogique officiel
│   │   ├── pedagogicalOrder         ← ordre dans la projection / vue — issu de la publication
│   │   ├── officialContent
│   │   │   ├── question             ← texte officiel immuable
│   │   │   └── walkthrough          ← flux textuel officiel — zone annotable
│   │   ├── visualState              ← état + référence figure (contrat 04 §11, contrat 05)
│   │   ├── learnerAffordances       ← zones annotables déclarées (§10)
│   │   └── traceReferences          ← références consultatives (lookup, pas interprétation)
│   └── viewDiagnostics[]            ← diagnostics propres à la vue
└── diagnostics[]                    ← diagnostics globaux de composition
```

Le schéma **NE DOIT PAS** introduire de nouvelle sémantique médicale. Toute identité **DOIT** être résolvable vers le manifest ou un artefact qu'il déclare.

### 5.3 Résolution des blocs pédagogiques

Conformément à la décision D5 ([registre](../../governance/COMPOSITION-DECISION-REGISTRY.md)) :

| Règle | Énoncé |
|---|---|
| **Baseline** | Les blocs **DOIVENT** être résolus selon une **convention de publication validée** — typiquement une gate de build vérifiant les frontières de bloc et les identités dans les artefacts Markdown publiés |
| **Déterminisme** | À manifest, spec et artefacts identiques, la séquence de blocs produite **DOIT** être identique |
| **Interdit** | Reconstruction **heuristique silencieuse** (inférence non validée de frontières ou d'identités) |
| **Évolution** | Un artefact structuré explicite de blocs **PEUT** être adopté ultérieurement par La Fabrique — la composition **DOIT** alors le consommer en priorité s'il est déclaré par le manifest |

La composition **NE DOIT PAS** devenir une seconde Fabrique de découpage pédagogique.

---

## 6. États de disponibilité

### 6.1 Réutilisation des états existants

La composition **DOIT** réutiliser la taxonomie de publication existante ([contrat 04](../04-CHAPTER-PACKAGE.md) §11, [doc 17](../../renderer/17-PUBLICATION-MODEL.md) §5.2) — **sans créer de taxonomie parallèle** pour le contenu officiel.

| État (contenu officiel) | Signification | Composition |
|---|---|---|
| **published** | Contenu validé et disponible | Inclus dans la vue selon la spec |
| **known_absent** | Absence déclarée par le package | Vue ou source signalée — **pas** une erreur de composition |
| **withheld** / **built-but-withheld** | Produite mais non publiée | Signal explicite — contenu adjacent valide conservé si applicable |
| **missing** | Déclaré publié mais introuvable | Erreur localisée |
| **invalid** | Présent mais inutilisable | Erreur localisée |

Pour les **visuels officiels**, la composition **DOIT** distinguer : **none planned**, **planned-not-built**, **published**, **withheld** — conformément au [contrat 04](../04-CHAPTER-PACKAGE.md) §11.

### 6.2 États au niveau vue

| Situation | Traitement attendu |
|---|---|
| **Projection de production absente** (`known_absent`) | Vue peut être `known_absent` selon `availabilityPolicy` |
| **Vue cognitive sans source résolue** | Diagnostic + état explicite — jamais vue vide silencieuse |
| **Vue vide après filtrage** (`elementSelector`) | État `empty-after-filter` ou équivalent — distinct de `known_absent` |
| **Erreur de composition** | Diagnostic bloquant ou vue en `invalid` — jamais contenu inventé |

### 6.3 Distinctions obligatoires

La composition **DOIT** permettre de distinguer :

- absence d'une **projection de production** ;
- absence d'une **vue cognitive** (non implémentée ou non mappée) ;
- **vue vide** après filtrage d'identités ;
- **erreur** de composition (spec, résolution, convention de blocs).

---

## 7. Règles d'identité

### 7.1 Principe

La composition **manipule uniquement** des identités **existantes** et **vérifiables** via le manifest ([contrat 02](../02-IDENTITY-AND-ANCHORS.md)).

### 7.2 Interdictions

La composition **NE DOIT PAS** :

- minter une identité officielle (chapitre, point de connaissance, élément pédagogique, bloc de claim) ;
- substituer silencieusement une identité par une autre ;
- masquer une identité **publiée et consommable** sans diagnostic ;
- produire un bloc sans **identité d'élément pédagogique** stable ;
- lier un visuel à un bloc par position ordinale — **uniquement par identifiant**.

### 7.3 Références non résolues

Toute référence non résolue **DOIT** être diagnostiquée selon `diagnosticsPolicy` — **jamais** ignorée silencieusement.

---

## 8. Règles d'ordre

### 8.1 Trois ordres distincts

| Ordre | Source | Responsable |
|---|---|---|
| **Ordre pédagogique** (éléments, projections) | Blueprint → registre → manifest (`order`) | **Publication** — La Fabrique |
| **Ordre d'affichage des vues** | `displayOrder` dans Composition Specification | **Composition** — Reader |
| **Ordre visuel local** (scroll, focus, animation) | Présentation runtime | **Renderer** — sans modifier la sémantique |

### 8.2 Contraintes

La composition **NE DOIT PAS** réordonner arbitrairement les éléments médicaux **à l'intérieur** d'une projection publiée.

La composition **PEUT** agréger des identités de **plusieurs projections** en une vue — l'ordre **au sein** de chaque projection reste celui publié ; l'ordre **entre** projections agrégées **DOIT** être déclaré dans la spec.

---

## 9. Interaction avec le Renderer

### 9.1 Frontière

Le **Reading View Model** est l'entrée logique **obligatoire** du Renderer pour le contenu officiel composé.

```
Composition Engine  →  Reading View Model  →  Renderer  →  DOM
```

### 9.2 Obligations du Renderer vis-à-vis de la composition

Le Renderer **NE DOIT PAS** :

- décider quelle projection alimente quelle vue cognitive ;
- inventer un libellé produit ;
- lire la Composition Specification ;
- reconstruire le Chapter Package ou inférer des identités absentes ;
- effectuer une sélection sémantique ou un filtrage d'éléments non déjà résolu dans le View Model.

Le Renderer **DOIT** :

- présenter le View Model tel que reçu — immuablement pour le contenu officiel ;
- signaler une incohérence entre View Model et rendu technique de façon localisée.

Détail des obligations Renderer : [`RENDERER-COMPONENT-CONTRACT.md`](RENDERER-COMPONENT-CONTRACT.md).

### 9.3 Pont de transition

Une implémentation **PEUT** temporairement composer en interne dans le Renderer **uniquement** si ce chemin est **identifiable**, **isolé** et **explicitement marqué comme dette** — conformément à [ADR-002](../../adr/ADR-002-renderer-v2-architecture.md). Ce pont **NE DOIT PAS** devenir l'architecture cible.

---

## 10. Interaction avec la couche apprenante

### 10.1 Séparation

La composition **PEUT** déclarer, par bloc ou zone, les **affordances apprenantes autorisées** (walkthrough annotable, diagramme personnel, etc.).

La composition **NE DOIT PAS** :

- lire le contenu local de l'apprenant ;
- modifier une règle de composition en fonction des annotations ;
- fusionner données apprenant et contenu officiel.

### 10.2 Ordre d'application

```
Composition  →  Reading View Model  →  Renderer (officiel)  →  Learner Layer (overlays)
```

Les notes, surlignages et diagrammes **restent des overlays** appliqués **après** composition et rendu officiel — [contrat 06](../06-RENDERER-AND-LEARNER-LAYER.md) §7–§8, [ADR-005](../../adr/ADR-005-learner-layer-annotation-anchoring.md).

---

## 11. Diagnostics

### 11.1 Diagnostics obligatoires

La composition **DOIT** être capable de produire au minimum :

| Code conceptuel | Situation |
|---|---|
| `identity-referenced-but-absent` | Identité référencée par la spec absente du manifest |
| `published-projection-unconsumed` | Projection publiée non consommée par aucune vue |
| `view-without-resolved-source` | Vue sans source résolue |
| `invalid-spec-override` | Surcharge chapitre ou spécialité invalide |
| `duplicate-identity-unauthorized` | Même identité assemblée deux fois sans règle explicite |
| `inconsistent-availability` | État déclaré incompatible avec le manifest |
| `pedagogical-order-violation` | Réordonnancement non autorisé détecté |
| `incompatible-spec-version` | Version de spec non supportée |
| `block-convention-violation` | Artefact publié ne respecte pas la convention validée |

### 11.2 Sévérités

| Sévérité | Traitement |
|---|---|
| **Bloquant** | Composition échoue ou vue marquée `invalid` — pas de contenu inventé |
| **Avertissement** | Composition continue — diagnostic visible (ex. projection non consommée) |
| **État normal** | Absence connue déclarée — **pas** une erreur |

La politique par défaut **PEUT** être surchargée par `diagnosticsPolicy` — jamais pour transformer une absence connue en erreur silencieuse.

---

## 12. Déterminisme et testabilité

### 12.1 Fonction de composition

La composition **DOIT** être une **fonction déterministe** de ses entrées versionnées :

```
compose(manifest, compositionSpecification) → { readingViewModel, diagnostics }
```

À entrées identiques, la sortie **DOIT** être identique.

### 12.2 Testabilité

La composition **DOIT** être testable :

- **sans navigateur** ;
- **sans DOM** ;
- **sans** données apprenant ;
- avec des manifest et specs **synthétiques**.

Le Renderer **DOIT** pouvoir être testé avec un Reading View Model **synthétique** — sans Chapter Package complet.

---

## 13. Interdits architecturaux

Liste normative — non exhaustive :

| # | Interdit |
|---|---|
| 1 | Contenu médical dans la Composition Specification |
| 2 | Vocabulaire produit (labels, emojis, ordre de vues) dans le package publié ou le manifest |
| 3 | Dépendance de La Fabrique envers le Reader ou sa spec de composition |
| 4 | Lecture des artefacts internes de production (inventaire, Blueprint, source) |
| 5 | Logique de composition cachée dans le Renderer |
| 6 | Dépendance aux données apprenantes pour la composition officielle |
| 7 | Fallback silencieux modifiant le sens affiché |
| 8 | Relation obligatoire une projection = une vue |
| 9 | Reconstruction heuristique non validée des blocs pédagogiques |
| 10 | Persistance du Reading View Model comme autorité officielle |

---

## 14. Critères d'acceptation

Le contrat est **correctement implémenté** lorsque :

1. **changer le libellé ou l'ordre d'une vue** ne nécessite **aucun rebuild médical** ;
2. **une vue peut agréger plusieurs projections** selon une règle explicite dans la spec ;
3. **une projection peut alimenter plusieurs vues** si la règle est explicite ;
4. **le Renderer peut être testé** à partir d'un Reading View Model synthétique ;
5. **la composition peut être testée** sans navigateur ;
6. **toute identité publiée non consommée** est diagnostiquée (au minimum en avertissement) ;
7. **aucune donnée apprenante** n'influence la composition officielle ;
8. **les garanties de publication** ([doc 17](../../renderer/17-PUBLICATION-MODEL.md) §2) restent intactes — la composition ne les re-vérifie pas et ne les affaiblit pas.

---

## 15. Architecture logique

Responsabilité logique unique — **NE DOIT PAS** être confondue avec un fichier ou module :

### 15.1 View Composition

| | |
|---|---|
| **Rôle** | Exécuter la Composition Specification contre le manifest publié |
| **Peut recevoir** | Manifest ; spec résolue ; identifiant chapitre ; configuration technique |
| **Peut produire** | Reading View Model ; diagnostics |
| **Ne peut pas absorber** | Rendu DOM ; persistance apprenant ; autorité médicale ; modification du package |

### 15.2 Relations autorisées

```
Bootstrap and Runtime Coordination
  → Package Access
  → View Composition
  → Renderer (Official Content Rendering, Navigation and Presentation State)

Learner Layer
  ↔ Renderer (overlay uniquement)

Diagnostics
  ← View Composition, Renderer, Package Access
```

### 15.3 Relations interdites

| Relation | Interdiction |
|---|---|
| View Composition → inventaire / Blueprint / source | **NE DOIT PAS** lire d'autorité médicale non publiée |
| View Composition → package | **NE DOIT PAS** modifier le Chapter Package |
| Renderer → Composition Specification | **NE DOIT PAS** lire la spec directement |
| View Composition → données apprenant | **NE DOIT PAS** composer à partir d'annotations |
| Composition Specification → La Fabrique | **NE DOIT PAS** être entrée du build médical |

---

## 16. Hors périmètre documentaire

Relèvent d'autres documents — **non tranchés ici** :

| Sujet | Document |
|---|---|
| Catalogue corpus / Bibliothèque | Futur contrat composant — doc 14 Couche 1 |
| Détail de la gate de convention de blocs | Pipeline — doc 19 |
| Format de sérialisation de la spec | Implémentation |
| CSS, toolbars, raccourcis | Spécification fonctionnelle — doc 15 |
| Algorithmes d'ancrage apprenant | ADR-005, contrat 06 |

---

## 17. Traçabilité normative

| Domaine | Source supérieure | Rôle de ce contrat |
|---|---|---|
| Identités | [Contrat 02](../02-IDENTITY-AND-ANCHORS.md) | Manipuler sans minter |
| Package / manifest | [Contrat 04](../04-CHAPTER-PACKAGE.md) | Consommer sans enrichir |
| Frontière Reader | [Doc 16](../../renderer/16-CONTENT-TO-READER-ARCHITECTURE.md) | Spécialiser en obligations composant |
| Publication | [Doc 17](../../renderer/17-PUBLICATION-MODEL.md) | Respecter garanties sans re-vérifier |
| Renderer | [RENDERER-COMPONENT-CONTRACT.md](RENDERER-COMPONENT-CONTRACT.md) | Définir l'interface View Model |
| Learner layer | [Contrat 06](../06-RENDERER-AND-LEARNER-LAYER.md) | Maintenir séparation overlays |

---

## Documents connexes

| Document | Usage |
|---|---|
| [`COMPOSITION-DECISION-REGISTRY.md`](../../governance/COMPOSITION-DECISION-REGISTRY.md) | Décisions D1–D6 |
| [`COMPOSITION-IMPLEMENTATION-DEBT.md`](../../governance/COMPOSITION-IMPLEMENTATION-DEBT.md) | Dette d'implémentation actuelle |
| [`16-CONTENT-TO-READER-ARCHITECTURE.md`](../../renderer/16-CONTENT-TO-READER-ARCHITECTURE.md) | Vision frontière publication ↔ Reader |
