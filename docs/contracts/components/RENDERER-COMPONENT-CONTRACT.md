# Renderer Component Contract

| | |
|---|---|
| **Type** | Contrat composant normatif |
| **Statut** | En vigueur |
| **Composant** | Renderer (lecteur) |
| **Index** | [`../00-INDEX.md`](../00-INDEX.md) |

Ce document définit les **obligations durables** du composant Renderer. Il spécialise les ADR et les contrats fondamentaux pour ce composant. Il ne redéfinit pas l'architecture système, ne documente pas une implémentation particulière et n'introduit aucune décision d'architecture nouvelle.

---

## 1. Statut et autorité

### 1.1 Statut normatif

Le présent document est un **contrat composant**. Ses obligations **MUST / DOIT** et **MUST NOT / NE DOIT PAS** sont normatives pour toute implémentation du Renderer.

### 1.2 Place dans la hiérarchie

```
ADR
  ↓
Contrats fondamentaux (01–06)
  ↓
Renderer Component Contract   ← ce document
  ↓
Documentation technique Renderer
  ↓
Code et tests
```

### 1.3 Documents qui priment

En cas de conflit, priment dans cet ordre :

1. les ADR applicables ([ADR-001](../../adr/ADR-001-freeze-svg-grammar-catalogue.md) à [ADR-005](../../adr/ADR-005-learner-layer-annotation-anchoring.md)) ;
2. les contrats fondamentaux [01](../01-TRUST-AND-FIDELITY.md) à [06](../06-RENDERER-AND-LEARNER-LAYER.md).

Ce contrat **NE DOIT PAS** contredire un document supérieur. Pour l'ancrage des notes de walkthrough, [ADR-005](../../adr/ADR-005-learner-layer-annotation-anchoring.md) **prime** sur toute formulation claim-block héritée.

### 1.4 Documents sur lesquels il prime

Ce contrat **prime** sur :

- la documentation technique Renderer (`docs/renderer/`, documentation d'implémentation versionnée du lecteur) ;
- le code et les tests du Renderer ;
- toute description d'implémentation, guide de migration ou roadmap produit relative au lecteur.

Une organisation de modules ou une technologie navigateur différente **n'invalide pas** ce contrat tant que les obligations et invariants sont respectés.

---

## 2. Mission

Le Renderer **DOIT** présenter le **Reading View Model** produit par la couche de composition ([`COMPOSITION-COMPONENT-CONTRACT.md`](COMPOSITION-COMPONENT-CONTRACT.md)) en expérience de lecture interactive navigable.

Il **DOIT** présenter le contenu officiel tel que composé et publié, et **PEUT** superposer une couche apprenant locale.

Il **NE DOIT PAS** altérer le contenu officiel, reconstruire la connaissance médicale, ni produire une nouvelle vérité médicale.

---

## 3. Frontière du composant

### 3.1 Dans le périmètre

Le Renderer **DOIT** assumer, lorsqu'elles s'appliquent au package consommé :

| Domaine | Obligation |
|---|---|
| Chargement | Charger un package publié via son point d'entrée autoritaire |
| Manifeste | Interpréter le manifeste publié et les artefacts qu'il déclare |
| Projections | Résoudre les projections selon les états déclarés |
| Rendu officiel | Présenter le contenu officiel publié (questions, walkthroughs, figures publiées, métadonnées déclarées) |
| Navigation | Permettre l'accès cohérent aux projections publiées |
| Honnêteté d'état | Présenter distinctement les contenus présents, absents connus, manquants ou invalides |
| Traçabilité consultative | Exposer la traçabilité déclarée par lookup, sans interprétation médicale |
| Couche apprenant | Monter les overlays apprenant distincts autorisés |
| Persistance locale | Persister et restaurer uniquement les données apprenant |
| Erreurs de lecture | Signaler les erreurs de chargement, résolution ou restauration de façon visible et localisée |
| Compatibilité temporaire | Appliquer uniquement les ponts legacy explicitement autorisés par [ADR-002](../../adr/ADR-002-renderer-v2-architecture.md), de façon isolée et identifiable |

### 3.2 Hors du périmètre

Le Renderer **NE DOIT PAS** :

- acquérir des sources officielles ;
- extraire, réconcilier, grounder ou valider médicalement un contenu ;
- générer un Knowledge Inventory, un Blueprint, des projections ou des figures officielles ;
- produire, modifier ou republier un Chapter Package ;
- lire l'inventaire, le Blueprint, la source d'acquisition ou un visualSpec pour en **inférer** un sens médical ;
- synchroniser des données apprenant vers un cloud comme comportement architectural obligatoire ;
- créer des identifiants médicaux ;
- reconstruire, paraphraser ou enrichir un contenu médical manquant ;
- servir d'éditeur de contenu officiel, de CMS, de moteur de maîtrise ou d'IA médicale.

Ces responsabilités relèvent des couches amont, des contrats fondamentaux applicables, ou sont explicitement hors objectifs du lecteur.

---

## 4. Entrées architecturales

Les seules catégories d'entrées autorisées sont :

| Catégorie | Règle |
|---|---|
| **Reading View Model** | Représentation composée produite par la couche de composition — entrée logique obligatoire pour le contenu officiel |
| **Chapter Package publié** | Accès aux artefacts officiels **uniquement** via Package Access — jamais pour sélection de vues ou libellés produit |
| **Manifeste et artefacts déclarés** | Résolution technique des contenus référencés par le View Model |
| **Données locales de la couche apprenant** | Données personnelles, hors package |
| **Événements d'interaction utilisateur** | Navigation, sélection, saisie apprenant, consultation de traçabilité |
| **Configuration purement technique** | Résolution de chemins, options d'affichage non médicales, bornes de compatibilité legacy |

Le Renderer **NE DOIT PAS** accepter comme entrée autoritaire pour la **composition des vues** : le manifest seul, une Composition Specification, l'inventaire, le Blueprint, la source d'acquisition, un visualSpec sémantique, ou toute base métier parallèle au package publié. Ces entrées relèvent de la couche de composition ou de Package Access — voir [`COMPOSITION-COMPONENT-CONTRACT.md`](COMPOSITION-COMPONENT-CONTRACT.md).

---

## 5. Sorties architecturales

| Sortie | Nature |
|---|---|
| Représentation de lecture | Contenu officiel présenté dans le navigateur |
| Navigation et états visibles | Accès aux projections et indication de leur disponibilité |
| Overlays apprenant | Affichage superposé des données personnelles |
| État local persistant | Persistance des seules données apprenant |
| Diagnostics et erreurs | États d'erreur, d'absence ou d'indisponibilité honnêtes et localisés |
| Signaux d'interaction | Événements ou retours d'usage **PEUVENT** être émis ; ils **NE DOIVENT PAS** modifier le package ni remplacer le grounding médical |

Le Renderer **NE DOIT PAS** produire une nouvelle vérité médicale.

Le Renderer **NE DOIT PAS** modifier aucun artefact officiel du Chapter Package.

---

## 6. Responsabilités normatives

### 6.1 Chargement

Le Renderer **DOIT** :

- charger uniquement un package publié ;
- prendre le manifeste publié comme point d'entrée ;
- ne résoudre que les artefacts déclarés par ce manifeste (ou sidecars qu'il référence de façon autoritaire).

Le Renderer **NE DOIT PAS** :

- déduire silencieusement des artefacts non déclarés ;
- servir un contenu non tracé sans avertissement explicite lorsqu'aucun manifeste publiable n'existe ;
- échouer de façon opaque lorsqu'une entrée obligatoire est absente ou invalide — l'échec **DOIT** être visible et explicable.

### 6.2 Résolution des projections

Le Renderer **DOIT** interpréter les états déclarés par le manifeste et distinguer au moins :

| État | Comportement obligatoire |
|---|---|
| **Présente** | Présenter le contenu publié |
| **Absence connue (`known_absent` / marqueur d'absence connue)** | État explicite lié au package — **pas** une erreur de chargement |
| **Manquante** | Artefact attendu non trouvé — erreur ou indisponibilité localisée, explicite |
| **Invalide** | Artefact présent mais non utilisable — erreur localisée, explicite |

Le Renderer **NE DOIT PAS** :

- présenter une absence connue comme une panne de chargement ;
- inventer un contenu de remplacement médical ;
- masquer silencieusement une projection ou un visuel planifié, retenu ou déclaré absent.

Pour les **visuels officiels**, les trois situations du [contrat 04](../04-CHAPTER-PACKAGE.md) §11 et du [contrat 06](../06-RENDERER-AND-LEARNER-LAYER.md) §5 **DOIVENT** rester distinctes à l'affichage : aucune intention visuelle ; planifié non construit ; construit mais retenu.

### 6.3 Rendu officiel

Le Renderer **DOIT** :

- préserver le sens et l'ordre publiés des blocs pédagogiques ;
- présenter question, walkthrough et, le cas échéant, figure officielle publiée, sans les réécrire ;
- respecter la grammaire visuelle officielle **applicable au rendu affiché**, sans la redéfinir ([ADR-001](../../adr/ADR-001-freeze-svg-grammar-catalogue.md), [contrat 05](../05-VISUAL-GRAMMAR.md)).

Le Renderer **NE DOIT PAS** :

- modifier le contenu officiel ;
- fusionner contenu officiel et données apprenant dans une copie persistée ;
- lier un visuel à un contenu par position ordinale, index de fichier ou ordre de titre — uniquement par **identifiant** ;
- inventer un texte alternatif médical pour une figure absente.

### 6.4 Navigation

Le Renderer **DOIT** :

- découvrir les projections via le manifeste — jamais via un catalogue métier codé en dur comme source d'autorité ;
- permettre l'accès cohérent aux projections publiées selon l'ordre déclaré ;
- représenter honnêtement les projections indisponibles.

Le Renderer **NE DOIT PAS** construire une seconde taxonomie métier parallèle au registre publié.

### 6.5 Couche apprenant

La couche apprenant **DOIT** rester un **overlay strictement séparé** du contenu officiel.

Elle **DOIT** utiliser uniquement des identifiants officiels déjà autorisés ([contrat 02](../02-IDENTITY-AND-ANCHORS.md)).

Elle **DOIT** respecter [ADR-005](../../adr/ADR-005-learner-layer-annotation-anchoring.md) pour les notes de walkthrough.

Les mécanismes suivants **DOIVENT** rester **distincts** :

| Mécanisme | Ancrage normatif |
|---|---|
| Notes de walkthrough | Identifiant d'élément pédagogique + **CaretAnchor** dans le flux textuel officiel du walkthrough |
| Annotations / surlignages par sélection textuelle | Ancrage par **sélection textuelle** dans le walkthrough officiel |
| Diagrammes personnels | Identifiant d'**élément pédagogique** uniquement — jamais le visuel officiel |

Le Renderer **NE DOIT PAS** :

- unifier ces mécanismes en un éditeur générique ou un système unique d'attachment ;
- écrire dans le package officiel ;
- introduire de nouveaux identifiants médicaux ;
- faire participer les données apprenant à la chaîne de traçabilité médicale ;
- utiliser les données apprenant comme entrée d'une génération, d'un grounding ou d'une personnalisation médicale.

### 6.6 Persistance et restauration

Le Renderer **DOIT** :

- persister uniquement les données apprenant ;
- restaurer ces données sans altérer le contenu officiel ;
- préserver l'isolation entre chapitres, projections et éléments pédagogiques selon les contrats applicables ;
- représenter honnêtement les données non restaurables (orpheline / ancre non résolue).

Le Renderer **NE DOIT PAS** :

- supprimer silencieusement des données apprenant lorsqu'une ancre ne peut plus être résolue ;
- persister une version modifiée du contenu officiel ;
- fusionner durablement officiel et apprenant en une nouvelle autorité.

Le support de stockage concret n'est **pas** spécifié par ce contrat.

### 6.7 Gestion des erreurs

Doctrine obligatoire :

| Situation | Traitement |
|---|---|
| **Absence connue** | État explicite ; **pas** une erreur de chargement |
| **Artefact manquant** | Erreur ou indisponibilité localisée, visible |
| **Artefact invalide** | Erreur localisée ; pas de contenu inventé |
| **Erreur de chargement** | Échec visible et explicable du périmètre concerné |
| **Donnée apprenant orpheline** | Signalée ; **jamais** effacée silencieusement |
| **Compatibilité legacy** | Bornée, identifiable, temporaire ([ADR-002](../../adr/ADR-002-renderer-v2-architecture.md)) — **jamais** une seconde norme |

Le Renderer **DOIT** privilégier un échec **visible, localisé et explicable** plutôt qu'un fallback silencieux susceptible de modifier le sens médical.

Une erreur locale **NE DOIT PAS** altérer les autres projections valides déjà résolues.

---

## 7. Architecture logique

Les responsabilités suivantes sont **logiques**. Elles **NE DOIVENT PAS** être confondues avec des fichiers, modules ou fonctions d'une implémentation.

### 7.1 Bootstrap and Runtime Coordination

| | |
|---|---|
| **Rôle** | Amorcer le runtime lecteur, coordonner le cycle de vie de lecture, orchestrer les autres responsabilités |
| **Peut recevoir** | Identifiant de chapitre demandé, configuration technique, événements de cycle de vie |
| **Peut produire** | Session de lecture coordonnée, transitions de cycle de vie |
| **Ne peut pas absorber** | Autorité médicale ; génération de contenu ; persistance du package |

### 7.2 Package Access

| | |
|---|---|
| **Rôle** | Accéder au package publié et aux artefacts déclarés |
| **Peut recevoir** | Référence de chapitre / package ; manifeste ; artefacts déclarés |
| **Peut produire** | Artefacts officiels bruts prêts à résolution ; diagnostics d'accès |
| **Ne peut pas absorber** | Lecture d'autorités alternatives (inventaire, Blueprint, source, visualSpec sémantique) ; modification du package |

### 7.3 Projection Resolution

| | |
|---|---|
| **Rôle** | Interpréter les états de disponibilité des contenus référencés par le View Model |
| **Peut recevoir** | Reading View Model ; métadonnées d'état déjà résolues par la composition |
| **Peut produire** | Confirmation de présentation ; diagnostics de rendu localisés |
| **Ne peut pas absorber** | Invention de contenu ; création d'une taxonomie métier parallèle ; sélection de vues |

### 7.4 View Composition

| | |
|---|---|
| **Rôle** | Exécuter la Composition Specification contre le manifest publié |
| **Peut recevoir** | Manifest ; spec applicable ; identifiant chapitre ; configuration technique |
| **Peut produire** | Reading View Model ; diagnostics de composition |
| **Ne peut pas absorber** | Rendu DOM ; persistance apprenant ; autorité médicale ; modification du package |

Détail normatif : [`COMPOSITION-COMPONENT-CONTRACT.md`](COMPOSITION-COMPONENT-CONTRACT.md).

### 7.5 Official Content Rendering

| | |
|---|---|
| **Rôle** | Présenter le contenu officiel publié dans le navigateur |
| **Peut recevoir** | Reading View Model ; artefacts officiels résolus pour rendu |
| **Peut produire** | Représentation officielle immuable à l'affichage |
| **Ne peut pas absorber** | Écriture apprenant dans les artefacts ; enrichissement médical ; redéfinition de la grammaire visuelle ; lecture de la Composition Specification |

### 7.6 Navigation and Presentation State

| | |
|---|---|
| **Rôle** | Gérer la navigation entre vues composées et l'état de présentation visible |
| **Peut recevoir** | Reading View Model ; interactions de navigation |
| **Peut produire** | Vue active ; états visibles de disponibilité |
| **Ne peut pas absorber** | Création de vérité métier ; remplacement du registre publié ; agrégation de projections |

### 7.7 Learner Layer

| | |
|---|---|
| **Rôle** | Superposer les mécanismes apprenant distincts sur le contenu officiel affiché |
| **Peut recevoir** | Contenu officiel affiché (en lecture) ; interactions apprenant ; données apprenant restaurées |
| **Peut produire** | Overlays ; créations / mises à jour / suppressions de données apprenant |
| **Ne peut pas absorber** | Modification du package ; unification des mécanismes ; mintage d'identifiants médicaux |

### 7.8 Local Persistence

| | |
|---|---|
| **Rôle** | Persister et restituer les seules données apprenant |
| **Peut recevoir** | Enregistrements apprenant ; clés d'isolation (chapitre, projection, élément, ancre) |
| **Peut produire** | État local restaurable ; signalement d'enregistrements non résolus |
| **Ne peut pas absorber** | Contenu officiel ; suppression silencieuse des orphelins ; sync cloud obligatoire |

### 7.9 Diagnostics and Compatibility Boundary

| | |
|---|---|
| **Rôle** | Agréger diagnostics, erreurs honnêtes et frontière de compatibilité legacy |
| **Peut recevoir** | Signaux d'échec ou d'état de toutes les responsabilités |
| **Peut produire** | Diagnostics visibles ; activation bornée de ponts legacy autorisés |
| **Ne peut pas absorber** | Seconde architecture permanente ; fallback médical inventif |

---

## 8. Relations architecturales autorisées

### 8.1 Flux autorisés

```
Bootstrap and Runtime Coordination
  → Package Access
  → View Composition
  → Official Content Rendering
  → Navigation and Presentation State

Learner Layer
  ↔ Official Content Rendering   (overlay uniquement ; jamais écriture dans le package)
  ↔ Local Persistence

Diagnostics and Compatibility Boundary
  ← toutes les responsabilités logiques
```

### 8.2 Relations interdites

| Relation | Interdiction |
|---|---|
| Learner Layer → package | **NE DOIT PAS** modifier le Chapter Package |
| Renderer → acquisition | **NE DOIT PAS** dépendre du pipeline d'acquisition |
| Renderer → génération | **NE DOIT PAS** générer projections, inventory, Blueprint ou figures |
| Local Persistence → contenu officiel | **NE DOIT PAS** stocker ni versionner le contenu officiel |
| Navigation → vérité métier | **NE DOIT PAS** créer une autorité métier parallèle |
| Renderer → Composition Specification | **NE DOIT PAS** lire la spec pour composer des vues |
| Legacy → architecture permanente | Un pont legacy **NE DOIT PAS** devenir une seconde norme |

---

## 9. Dépendances autorisées

Sous réserve des contrats fondamentaux et des ADR, le Renderer **PEUT** dépendre de :

- APIs navigateur ;
- un moteur de rendu Markdown **sans logique médicale auteur** ;
- capacités de présentation SVG / figures publiées ;
- stockage local navigateur pour la couche apprenant ;
- bibliothèques techniques sans logique métier médicale ;
- ponts de compatibilité legacy **temporaires**, **isolés** et **explicitement autorisés** par [ADR-002](../../adr/ADR-002-renderer-v2-architecture.md).

---

## 10. Dépendances interdites

Le Renderer **NE DOIT PAS** dépendre directement de :

- pipeline d'acquisition ;
- outils de génération (Inventory, Blueprint, projections, moteur de rendu graphique de build) ;
- Knowledge Inventory comme source alternative de contenu ;
- Blueprint comme source alternative de contenu ;
- moteurs de reconciliation ou grounding ;
- sources officielles brutes (PDF ou équivalent) lorsque le package publié existe ;
- services d'enrichissement médical en direct ;
- état de travail non publié ;
- une base de données métier parallèle au Chapter Package.

---

## 11. Invariants

Les exigences suivantes sont **normatives** et **vérifiables** :

1. Le Chapter Package consommé est **immuable** pour le Renderer.
2. Le Renderer **consomme** ; il **ne génère pas** de contenu médical.
3. Le contenu officiel et la couche apprenant restent **séparés** — fusion à l'affichage uniquement, jamais en autorité persistée.
4. Toute donnée apprenant reste **non médicale** au sens de la traçabilité officielle et locale au rôle d'annotation / appropriation.
5. Aucun nouvel identifiant médical n'est créé par le Renderer.
6. Les mécanismes apprenant restent **distincts** (notes caret, sélection textuelle, diagrammes personnels).
7. [ADR-005](../../adr/ADR-005-learner-layer-annotation-anchoring.md) gouverne l'ancrage des notes de walkthrough (**CaretAnchor** + élément pédagogique).
8. Les absences connues sont représentées **honnêtement**, distinctes des erreurs de chargement.
9. Aucun fallback **NE DOIT** inventer ou enrichir un contenu officiel.
10. Une erreur locale **NE DOIT PAS** altérer les autres projections valides.
11. Le Renderer **NE DOIT PAS** dépendre de l'organisation interne du pipeline métier.
12. Une réécriture technique **NE DOIT PAS** changer les garanties normatives du présent contrat.
13. Le legacy reste une **frontière temporaire et identifiable**, jamais une seconde norme.
14. Les données apprenant non restaurables **NE DOIVENT PAS** être silencieusement détruites.
15. À package publié, configuration technique et état apprenant identiques, le **contenu officiel présenté** **DOIT** être **équivalent** — même sens, même ordre, mêmes artefacts officiels résolus. Cet invariant ne prétend pas à un déterminisme bit-à-bit du runtime navigateur.

---

## 12. Compatibilité et legacy

Conformément à [ADR-002](../../adr/ADR-002-renderer-v2-architecture.md) uniquement :

| Règle | Énoncé |
|---|---|
| **Rôle temporaire** | Les ponts legacy existent pour la transition, pas comme architecture cible |
| **Isolation** | Ils **DOIVENT** être identifiables et séparés du chemin autoritaire manifeste / package |
| **Interdiction** | Ils **NE DOIVENT PAS** devenir une deuxième architecture permanente |
| **Extinction** | Leur suppression ou extinction est **pilotée** par la gouvernance et le plan de migration existants |

Ce contrat **ne crée aucun calendrier** nouveau.

---

## 13. Sécurité et intégrité

Garanties architecturales obligatoires :

| Garantie | Énoncé |
|---|---|
| Non-injection | Le contenu apprenant **NE DOIT PAS** être injecté dans les artefacts officiels du package |
| Non-promotion | Une donnée apprenant **NE DOIT PAS** être présentée comme vérité officielle |
| Isolation des erreurs | Une défaillance locale **NE DOIT PAS** corrompre le reste de la session de lecture valide |
| Validation des entrées | Les entrées **DOIVENT** être suffisamment validées avant rendu pour éviter un affichage trompeur |
| Pas d'exécution métier du package | Le Renderer **NE DOIT PAS** exécuter une logique métier médicale embarquée dans le package comme programme |

Ce contrat ne définit pas une politique de cybersécurité complète.

---

## 14. Critères de conformité

### 14.1 Conformité normative

Une implémentation Renderer **NE PEUT** être déclarée **conformément normative** que si :

- elle respecte [ADR-001](../../adr/ADR-001-freeze-svg-grammar-catalogue.md) à [ADR-005](../../adr/ADR-005-learner-layer-annotation-anchoring.md) ;
- elle respecte les contrats fondamentaux [01](../01-TRUST-AND-FIDELITY.md) à [06](../06-RENDERER-AND-LEARNER-LAYER.md) ;
- elle respecte toutes les obligations **MUST / DOIT** et **MUST NOT / NE DOIT PAS** du présent contrat ;
- elle ne contient aucune dépendance interdite (§10) ;
- les états absence connue, manquant et invalide sont distingués ;
- le package officiel reste immuable ;
- les données apprenant restent isolées ;
- les modèles d'ancrage sont conformes ([ADR-005](../../adr/ADR-005-learner-layer-annotation-anchoring.md), [contrat 02](../02-IDENTITY-AND-ANCHORS.md), [contrat 06](../06-RENDERER-AND-LEARNER-LAYER.md)) ;
- les erreurs ne provoquent ni enrichissement ni fallback médical silencieux ;
- les tests couvrent les invariants critiques (§11).

### 14.2 Conformité fonctionnelle

La conformité fonctionnelle désigne la couverture des capacités de lecture et d'appropriation attendues par le produit, **sans** contredire la conformité normative. Une capacité absente **PEUT** constituer une dette produit ; elle **NE DOIT PAS** être compensée par une violation normative.

### 14.3 Dette technique non bloquante

Sont **non bloquantes** pour la conformité normative, dès lors que les responsabilités et invariants sont respectés :

- une organisation de fichiers différente ;
- une autre découpe de modules ;
- une autre technologie navigateur ;
- un pont legacy encore présent mais isolé, identifiable et conforme à [ADR-002](../../adr/ADR-002-renderer-v2-architecture.md).

---

## 15. Hors périmètre documentaire

Relèvent d'autres documents — **non tranchés ici** :

- formats de données détaillés ;
- APIs d'implémentation ;
- structure de stockage local concrète ;
- choix de fichiers et modules ;
- CSS et design visuel détaillé ;
- toolbars et raccourcis clavier ;
- algorithmes d'ancrage détaillés ;
- plans de migration et de refactoring ;
- stratégie de tests détaillée ;
- **formatage de texte dans les SVG** — non ratifié au niveau ADR / contrats fondamentaux ; la documentation d'implémentation versionnée ne constitue pas une décision de gouvernance supérieure ;
- roadmap produit.

---

## 16. Traçabilité normative

| Domaine | Source supérieure | Rôle du Renderer Component Contract |
|---|---|---|
| Grammaire SVG (catalogue sémantique) | [ADR-001](../../adr/ADR-001-freeze-svg-grammar-catalogue.md) | Appliquer sans redéfinir |
| Architecture Renderer | [ADR-002](../../adr/ADR-002-renderer-v2-architecture.md) | Spécialiser les responsabilités du composant ; legacy borné |
| SSOT | [ADR-003](../../adr/ADR-003-single-source-of-truth.md) | Consommer uniquement la chaîne publiée autoritaire |
| Acquisition gelée | [ADR-004](../../adr/ADR-004-acquisition-architecture-frozen.md) | Maintenir une frontière stricte avec l'acquisition |
| Ancrage apprenant | [ADR-005](../../adr/ADR-005-learner-layer-annotation-anchoring.md) | Imposer les modèles d'ancrage applicables (CaretAnchor pour notes de walkthrough) |
| Fidélité / non-interprétation médicale | [Contrat 01](../01-TRUST-AND-FIDELITY.md) | Présenter sans grounder ni reconstruire la fidélité |
| Identités et ancres | [Contrat 02](../02-IDENTITY-AND-ANCHORS.md) | Appliquer dans le contexte du Renderer |
| Interface acquisition | [Contrat 03](../03-ACQUISITION-SSOT.md) | Interdire toute dépendance d'entrée |
| Package publié / manifeste / `known_absent` | [Contrat 04](../04-CHAPTER-PACKAGE.md) | Définir les obligations de consommation et de distinction d'états |
| Visuels officiels (présentation) | [Contrat 05](../05-VISUAL-GRAMMAR.md) | Présenter les figures publiées ; ne pas inférer depuis visualSpec |
| Learner layer / immutabilité lecteur | [Contrat 06](../06-RENDERER-AND-LEARNER-LAYER.md) | Détailler les obligations du composant sans les redéfinir |
| Composition / View Model | [COMPOSITION-COMPONENT-CONTRACT.md](COMPOSITION-COMPONENT-CONTRACT.md) | Recevoir le View Model ; ne pas composer ni lire la spec |

---

## Documents connexes (non normatifs pour ce contrat)

| Document | Usage |
|---|---|
| [`LOCAL-SEARCH-COMPONENT-CONTRACT.md`](LOCAL-SEARCH-COMPONENT-CONTRACT.md) | Recherche textuelle locale — Release ouverte ([PDR-D6](../../governance/PRODUCT-DECISION-REGISTRY.md)) |
| [`docs/renderer/`](../../renderer/) | Spécification produit et architecture technique du lecteur |
| [`PHASE_0A_COMPLETION.md`](../../governance/PHASE_0A_COMPLETION.md) | Clôture de gouvernance fondamentale |
| Documentation d'implémentation versionnée du lecteur | Détail technique subordonné |
