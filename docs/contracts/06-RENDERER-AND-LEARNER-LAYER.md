# Contrat 06 — Renderer & Learner Layer

| | |
|---|---|
| **Type** | Contrat fondamental normatif |
| **Statut** | Phase 0A — en vigueur |
| **Question unique** | Comment un Chapter Package est-il présenté à l'apprenant ? |
| **Index** | [`00-INDEX.md`](00-INDEX.md) |

Ce contrat consolide les **responsabilités permanentes du lecteur** : le **renderer** (présentation du contenu officiel publié) et la **couche apprenant** (données personnelles locales). Il ne décrit jamais le HTML, le CSS, le JavaScript, les APIs de stockage ni l'implémentation du renderer actuel.

En cas de conflit avec un document non listé dans les sources consolidées, les sources consolidées et les ADR de gouvernance priment selon [`00-INDEX.md`](00-INDEX.md). Les détails d'expérience et d'implémentation restent dans [`docs/renderer/`](../../docs/renderer/) — ce contrat n'en extrait que la gouvernance.

---

## Frontières documentaires

| Contrat | Ce qu'il définit — non recopié ici |
|---|---|
| [01 — Trust & Fidelity](01-TRUST-AND-FIDELITY.md) | Grounding, fidélité, fallback, critères de publication |
| [02 — Identity & Anchors](02-IDENTITY-AND-ANCHORS.md) | Identités, ancres, élément pédagogique, bloc pédagogique, bloc de claim |
| [03 — Acquisition SSOT](03-ACQUISITION-SSOT.md) | Texte officiel, édition, provenance acquisition |
| [04 — Chapter Package](04-CHAPTER-PACKAGE.md) | Structure du package, manifest, build, états de publication |
| [05 — Visual Grammar](05-VISUAL-GRAMMAR.md) | visualSpec, sémantique visuelle, moteur de rendu graphique (build), subordination au walkthrough |

**Ce contrat (06)** définit comment le **contenu officiel publié** est **présenté**, comment la **couche apprenant** s'y superpose sans le modifier, et quelles **frontières** séparent données officielles et données personnelles.

---

## 1. Séparation des responsabilités

| Couche | Responsabilité | Ne possède pas |
|---|---|---|
| **Chapter Package** | Artefacts métier d'un chapitre — curatifs et générés ([contrat 04](04-CHAPTER-PACKAGE.md)) | L'expérience apprenant ; les données personnelles |
| **Manifest publié** | Index de ce qui est **publié** : ordre pédagogique, registre, liens, statuts, références aux sidecars | Contenu médical auteur ; données apprenant ; vocabulaire produit |
| **Composition (Reader)** | **Traduction déclarative** des artefacts publiés en vues cognitives — manifest + Composition Specification → Reading View Model ([`COMPOSITION-COMPONENT-CONTRACT.md`](components/COMPOSITION-COMPONENT-CONTRACT.md)) | Contenu médical auteur ; modification du package ; persistance apprenant |
| **Renderer** | **Présentation** du contenu officiel à partir du Reading View Model | Contenu médical auteur ; modification du package ; persistance apprenant ; sélection sémantique des vues |
| **Couche apprenant** | **Annotations personnelles** superposées à l'affichage | Autorité médicale ; entrée du pipeline de génération |
| **Stockage local** | **Persistance** des seules données apprenant | Artefacts du package ; versions officielles modifiées |

**Invariant structurant :** la composition **assemble les vues** à partir du publié ; le renderer **présente** le View Model composé. Aucun tier aval **ne reconstruit jamais** le métier du chapitre en relisant inventaire, Blueprint ou source ([contrat 04](04-CHAPTER-PACKAGE.md) §10.3).

---

## 2. Le renderer

### 2.1 Rôle

Le **renderer** est le point de convergence **humain** des tiers aval : il transforme un **Chapter Package publié** en expérience de lecture navigable. Il **ne détient aucun contenu médical auteur** — aucune chaîne visible qu'il compose lui-même, aucune paraphrase de **walkthrough**, aucun texte alternatif de **visuel officiel** inventé à la présentation ([`IMPLEMENTATION_CONTRACT.md`](../../IMPLEMENTATION_CONTRACT.md) C.7).

### 2.2 Entrées autorisées

**Invariant fondamental :** le renderer consomme le **Chapter Package publié** via **Package Access** — manifest, artefacts déclarés, Composition Specification — et produit l'expérience à partir du **Reading View Model** composé.

| Entrée | Usage |
|---|---|
| **Manifest publié** | Index des artefacts publiés ; ordre pédagogique ; registre projections ; sidecars |
| **Composition Specification** | Déclaration des **7 vues** Reader et agrégation des sources |
| **Artefacts autoritaires** | Projections, figures, QCM, scénarios, amorçage — chemins déclarés par le manifest |

**Navigation produit :** exclusivement depuis **`viewModel.views`** (ordre `displayOrder`) — voir [`00-READER-V1-PRODUCT-MODEL.md`](../renderer/00-READER-V1-PRODUCT-MODEL.md). Les identifiants de projection (`story`, `overview`, `mechanisms`, `clinical-reasoning`, …) ne sont **pas** des vues utilisateur.

**Interdit :** lire directement l'inventaire, le Blueprint, la source acquisition, ou un **visualSpec** pour en **inférer** du sens médical — la sémantique visuelle est déjà matérialisée dans les artefacts publiés ([contrat 05](05-VISUAL-GRAMMAR.md) §2.1, [contrat 04](04-CHAPTER-PACKAGE.md)).

### 2.3 Remplaçabilité

Le lecteur Lou Médecine est **remplaçable** : toute implémentation respectant ces invariants est interchangeable. Le renderer est **versionné indépendamment** du contenu médical — un changement d'interface **n'impose pas** de re-validation médicale ([`IMPLEMENTATION_CONTRACT.md`](../../IMPLEMENTATION_CONTRACT.md) C.7).

---

## 3. Consommation du manifest et composition

Le manifest expose ce dont la chaîne Reader a besoin — directement ou via sidecars référencés ([contrat 04](04-CHAPTER-PACKAGE.md) §10) :

- **registre des projections** (artefacts de **production**) et ordre pédagogique ;
- **famille** de chaque projection ;
- liens explication↔**visuel officiel** **par identifiant** ;
- graphe de **traçabilité** ou référence authoritative ;
- badges d'édition **dérivés** (affichés, jamais recalculés) ;
- marqueurs d'**absence connue** ;
- **états** de disponibilité des visuels officiels ;
- références aux artefacts éditoriaux (QCM, scénarios, amorçage, Collège verbatim).

La **Composition Specification** traduit ces artefacts en **sept vues** (`viewId`, `displayOrder`, sources) — [`COMPOSITION-COMPONENT-CONTRACT.md`](components/COMPOSITION-COMPONENT-CONTRACT.md). Le renderer **ne découvre pas** la navigation en parcourant `manifest.projections` comme liste d'onglets.

**Interdit :** exposer une projection comme onglet produit ; lier un visuel à un bloc par position ordinale, index de fichier ou ordre de titre — uniquement par **identifiant** ([contrat 02](02-IDENTITY-AND-ANCHORS.md), [contrat 05](05-VISUAL-GRAMMAR.md)).

---

## 4. Rendu du contenu composé

### 4.1 Structure (artefacts de compréhension)

Les vues qui agrègent des **projections de compréhension** (artefacts internes) présentent une séquence de **blocs pédagogiques** — un par **élément pédagogique**, dans l'ordre déclaré ([contrat 04](04-CHAPTER-PACKAGE.md) §8) :

| Composant | Présentation |
|---|---|
| **Question** | Toujours affichée |
| **Visuel officiel** | Si publié — sinon état explicite ou absence légitime (§5) |
| **walkthrough** | Toujours affiché — artefact explicatif canonique |
| Affordances apprenant | Distinctes du contenu officiel (§7) |

### 4.2 Immutabilité du contenu officiel

**Invariant structurant :** le contenu officiel généré — question, **visuel officiel**, **walkthrough** — est **immuable** pour l'apprenant : aucune édition, réécriture ou version modifiée stockée comme officielle ([ADR-002](../adr/ADR-002-renderer-v2-architecture.md) §3 ; [`docs/renderer/02-PRODUCT_SPECIFICATION.md`](../renderer/02-PRODUCT_SPECIFICATION.md)).

La couche apprenant se **superpose à l'affichage** ; elle **ne fusionne jamais** dans une copie persistée du contenu officiel.

### 4.3 Traçabilité à la demande

Lorsque le manifest ou les projections exposent la traçabilité, le renderer permet de consulter l'origine d'un **bloc de claim** — citation, chemin de section, identifiants — par **lookup** sur les données déclarées. Il **n'interprète pas** le fond médical ([contrat 01](01-TRUST-AND-FIDELITY.md) reste en amont).

---

## 5. Visuels officiels côté lecteur

Le renderer **présente** les **figures officielles** référencées par le manifest. Il **ne produit pas** la sémantique visuelle ([contrat 05](05-VISUAL-GRAMMAR.md)).

Trois raisons d'absence de figure doivent rester **distinctes** à l'affichage ([contrat 04](04-CHAPTER-PACKAGE.md) §11) :

| Situation | Comportement attendu |
|---|---|
| Aucune **intention visuelle** | Bloc sans figure — **sans** implication de lacune |
| Visuel **planifié, non construit** | Avis explicite d'absence connue |
| Visuel **retenu** après échec | Avis explicite de support visuel temporairement indisponible |

**Interdit :** masquer silencieusement un visuel retenu ou planifié. **Autorisé :** publier le **walkthrough** seul lorsque le visuel optionnel a échoué — voir [contrat 01](01-TRUST-AND-FIDELITY.md) §10.3.

---

## 6. Dégradation honnête

Le renderer **signale** les états pipeline — jamais un trou silencieux :

- projection **absente connue** : état explicite lié au package, pas un espace vide ;
- **visuel officiel** retenu ou non construit : §5 ;
- artefact apprenant **orphelin** (ancre non résolue) : signalé, **jamais** effacé silencieusement ([`IMPLEMENTATION_CONTRACT.md`](../../IMPLEMENTATION_CONTRACT.md) Part B).

Si aucun manifest publiable n'existe pour un chapitre, le lecteur **avertit** explicitement — il ne sert pas de contenu non tracé sans avertissement ([`docs/renderer/02-PRODUCT_SPECIFICATION.md`](../renderer/02-PRODUCT_SPECIFICATION.md)).

---

## 7. Couche apprenant — frontière commune

Trois **mécanismes distincts** permettent à l'apprenant d'**approprier** l'explication sans la modifier ([`IMPLEMENTATION_CONTRACT.md`](../../IMPLEMENTATION_CONTRACT.md) C.8 ; [ADR-002](../adr/ADR-002-renderer-v2-architecture.md) — séparation des mécanismes ; [ADR-005](../adr/ADR-005-learner-layer-annotation-anchoring.md) — ancrage des notes). Ils **ne doivent pas** être fusionnés en un système générique d'édition ou d'annotation.

**Frontière commune — non négociable :**

| Règle | Énoncé |
|---|---|
| **Propriété apprenant** | Contenu saisi par l'apprenant ; jamais généré par le pipeline |
| **Hors traçabilité médicale** | Pas de classe de claim, pas de provenance, pas de place dans le graphe officiel |
| **Jamais une entrée** | Aucune génération, vérification, grounding, packaging ou personnalisation ne **lit** ces données — y compris aucune IA, vision ou OCR sur un diagramme personnel |
| **Jamais une modification** | Ne remplace, ne fusionne, ne réécrit jamais le contenu officiel |
| **Hors package** | Non versionné avec le chapitre ; non stocké dans le dépôt du contenu médical |
| **Ancrage existant** | Aucun espace d'identifiants nouveau — ancres sur identifiants déjà définis ([contrat 02](02-IDENTITY-AND-ANCHORS.md)) |

**Invariant fondamental :** aucune donnée apprenante **ne modifie** le **Chapter Package publié** ni n'y est écrite.

---

## 8. Mécanismes de la couche apprenant

### 8.1 Diagrammes personnels

Répond au comportement : *redessiner un mécanisme pour soi*.

- **Ancre :** identifiant d'**élément pédagogique** — **pas** le **visuel officiel** ;
- **Cardinalité :** zéro à n par bloc ;
- **Disponibilité :** affordance sur **chaque** bloc, qu'un **visuel officiel** existe ou non ;
- **Durabilité :** robuste aux changements du visuel officiel ([`IMPLEMENTATION_CONTRACT.md`](../../IMPLEMENTATION_CONTRACT.md) C.8).

### 8.2 Notes de walkthrough (notes inline)

Répond au comportement : *noter au fil du texte officiel en lisant*.

- **Ancre :** identifiant d'**élément pédagogique** déjà défini, plus **position de caret** dans le flux textuel officiel du **walkthrough** (**modèle CaretAnchor** — [ADR-005](../adr/ADR-005-learner-layer-annotation-anchoring.md)) ; **pas** la paire (élément, bloc de claim) ;
- **Cardinalité :** zéro à n par walkthrough ;
- **Durabilité :** restauration tentée tant que le passage textuel officiel permet de résoudre l'ancre ; sinon **dégradation honnête** — artefact signalé comme non résolu / orphelin, **jamais** effacé silencieusement ([contrat 02](02-IDENTITY-AND-ANCHORS.md) §10.5 ; [ADR-005](../adr/ADR-005-learner-layer-annotation-anchoring.md)).

### 8.3 Surlignages et annotations textuelles

Répond au comportement : *surligner, marquer ou noter une portion de texte en lisant* ([ADR-002](../adr/ADR-002-renderer-v2-architecture.md) ; [ADR-005](../adr/ADR-005-learner-layer-annotation-anchoring.md)).

- **Ancre :** sélection textuelle **dans** le **walkthrough** officiel — mécanisme **distinct** des notes de walkthrough (§8.2) ;
- **Nature :** surlignage, emphase visuelle ou courte note liée à la sélection ;
- **Superposition :** overlay à l'affichage — le texte officiel **reste inchangé** en persistance ([`docs/renderer/06-ANNOTATION_SYSTEM.md`](../renderer/06-ANNOTATION_SYSTEM.md)).

Les trois mécanismes **coexistent** ; aucun ne se substitue aux autres.

---

## 9. Persistance locale et cycles de vie

### 9.1 Séparation des données

| Donnée | Cycle de vie | Stockage |
|---|---|---|
| **Contenu officiel (Release / Chapter Package)** | Versionné ; identité `(chapitre, édition, version de publication)` ; **jamais écrasé silencieusement** ([ADR-006](../adr/ADR-006-pedagogical-patrimony-and-edition-lineage.md)) | Package publié |
| **Données apprenant** | Propres à l'apprenant ; ancrées sur Release + cible ([contrat 02](02-IDENTITY-AND-ANCHORS.md) §11.1) | **Stockage local** uniquement |

**Invariant structurant :** les données officielles et apprenantes ont des **cycles de vie distincts**. Une **nouvelle Release** devient la référence officielle **active** après **bascule explicite** ; la Release précédente est **archivée** — les données apprenant **restent attachées** à la Release sur laquelle elles ont été créées ([ADR-006](../adr/ADR-006-pedagogical-patrimony-and-edition-lineage.md) §3).

### 9.2 Restauration

Le lecteur **restaure** les données apprenant depuis le stockage local et les **fusionne à l'affichage** avec le contenu officiel courant. Aucune fusion persistée ne devient une nouvelle autorité officielle.

Détails de schéma et de support de stockage : [`docs/renderer/08-DATA_MODEL.md`](../renderer/08-DATA_MODEL.md) — non normatifs pour ce contrat.

### 9.3 Événements et retour utilisateur

Le renderer **peut émettre** des événements d'interaction et un retour de clarté ou d'utilité ([contrat 01](01-TRUST-AND-FIDELITY.md)) — signaux pour régénération ou couche adaptive future. Ces signaux **ne modifient pas** le package et **ne remplacent pas** le grounding médical.

---

## 10. Limites du lecteur

Ce contrat **ne définit pas** :

| Sujet | Document |
|---|---|
| Fidélité, grounding | [01](01-TRUST-AND-FIDELITY.md) |
| Identités, ancres | [02](02-IDENTITY-AND-ANCHORS.md) |
| Acquisition | [03](03-ACQUISITION-SSOT.md) |
| Package, manifest (contenu et build) | [04](04-CHAPTER-PACKAGE.md) |
| visualSpec, grammaire visuelle | [05](05-VISUAL-GRAMMAR.md) |
| Spécification produit détaillée, migration, non-objectifs | [`docs/renderer/`](../renderer/) |
| Éditeur, CMS, IA médicale, collaboration | [`docs/renderer/12-NON_GOALS.md`](../renderer/12-NON_GOALS.md) |

**Hors périmètre permanent du renderer** ([`docs/renderer/12-NON_GOALS.md`](../renderer/12-NON_GOALS.md)) : édition du contenu officiel, auteur de projections, génération médicale en direct, moteur de maîtrise propriétaire, sync cloud imposée, interprétation des diagrammes personnels.

---

## Sources consolidées

| Document | Apport consolidé |
|---|---|
| [`IMPLEMENTATION_CONTRACT.md`](../../IMPLEMENTATION_CONTRACT.md) | Part B (frontière couche apprenant) ; C.7 (renderer, immutabilité, manifest-only, dégradation) ; C.8 (diagrammes personnels) — ancrage notes C.9 **supersedé** par [ADR-005](../adr/ADR-005-learner-layer-annotation-anchoring.md) |
| [ADR-002](../adr/ADR-002-renderer-v2-architecture.md) | Immutabilité absolue ; séparation des mécanismes apprenant ; renderer consommateur read-only du package — §4 claim-block Inline Notes **supersedé** par ADR-005 pour l'ancrage des notes |
| [ADR-005](../adr/ADR-005-learner-layer-annotation-anchoring.md) | Ancrage des notes de walkthrough (CaretAnchor + élément pédagogique) ; distinction notes caret / sélection textuelle |
| [`docs/renderer/02-PRODUCT_SPECIFICATION.md`](../renderer/02-PRODUCT_SPECIFICATION.md) | Invariant d'immutabilité ; modèle officiel / apprenant / affichage ; navigation par manifest ; états visuels ; dégradation |
| [`docs/renderer/06-ANNOTATION_SYSTEM.md`](../renderer/06-ANNOTATION_SYSTEM.md) | Philosophie overlays ; distinction des mécanismes apprenant — détail technique subordonné à ADR-005 / ce contrat |
| [`docs/renderer/08-DATA_MODEL.md`](../renderer/08-DATA_MODEL.md) | Principes de séparation et d'ancrage — schémas d'implémentation non recopiés |
| [`docs/renderer/12-NON_GOALS.md`](../renderer/12-NON_GOALS.md) | Limites permanentes du renderer |
| [`PHASE_0A_CONTRACT_AUDIT.md`](../PHASE_0A_CONTRACT_AUDIT.md) | Périmètre contrat 06 ; F8 Renderer & lecteur ; frontière manifest-only — historique Phase 0A ; ancrage notes actualisé par ADR-005 |
