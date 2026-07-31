# Contrat 09 — Scénario clinique

| | |
|---|---|
| **Type** | Contrat fondamental normatif |
| **Statut** | En vigueur — 2026-07-31 |
| **Question unique** | Qu'est-ce qu'un Scénario clinique dans Lou Médecine, et quelles obligations lui incombent ? |
| **Index** | [`00-INDEX.md`](00-INDEX.md) |

Ce contrat définit l'objet éditorial **Scénario clinique** — unité publiée d'application clinique au sein d'une **Release** ([ADR-006](../adr/ADR-006-pedagogical-patrimony-and-edition-lineage.md), [contrat 08](08-RELEASE-EDITORIAL-ARCHITECTURE.md)). Il décrit la **structure éditoriale**, les **invariants**, les **critères de qualité**, les **gates de validation**, le **cycle de vie** et les **relations** ; jamais l'implémentation d'un outil de build, d'un format de fichier, d'un manifest ou d'un lecteur.

En cas de conflit avec un document non listé dans les frontières documentaires, les sources consolidées, les ADR et les PDR applicables priment selon [`00-INDEX.md`](00-INDEX.md).

---

## Frontières documentaires

| Contrat / document | Ce qu'il définit — non recopié ici |
|---|---|
| [01 — Trust & Fidelity](01-TRUST-AND-FIDELITY.md) | Classes de claim, grounding, fidélité, fallback conservateur |
| [02 — Identity & Anchors](02-IDENTITY-AND-ANCHORS.md) | Identités KP, élément pédagogique, bloc de claim, chaîne de traçabilité |
| [03 — Acquisition SSOT](03-ACQUISITION-SSOT.md) | Texte officiel Collège, édition, ancres source |
| [04 — Chapter Package](04-CHAPTER-PACKAGE.md) | Release, publication chapitre, cycle de vie package |
| [07 — Assessment Question](07-ASSESSMENT-QUESTION.md) | **Question d'évaluation** — objet disjoint |
| [08 — Release Editorial Architecture](08-RELEASE-EDITORIAL-ARCHITECTURE.md) | Coexistence des objets publiés dans une Release |
| [PDR-A3](../governance/PRODUCT-DECISION-REGISTRY.md) | Corpus d'évaluation chapitre ; 3–5 cas complémentaires |

**Ce contrat (09)** définit **exclusivement** le Scénario clinique : définition normative, structure éditoriale, invariants, qualité, validation, cycle de vie, relations et extensions autorisées.

**Terminologie.** Dans ce contrat :

- **Scénario clinique** — objet éditorial publié d'**application** clinique ; **ne pas confondre** avec une **Question d'évaluation** ni un **walkthrough**.
- **Segment** — constituant ordonné du Scénario (narratif, décision ou transition) ; **pas** une entité éditoriale autonome.
- **Point de décision** — segment où l'apprenant tranche entre options **à l'intérieur** du Scénario ; **pas** une Question d'évaluation.
- **Facette de claim** — unité de traçabilité ; **pas** un objet éditorial autonome ([contrat 02](02-IDENTITY-AND-ANCHORS.md) §7).
- **`kind`** — discriminant éditorial du Scénario : `standard`, `trap`, `synthesis`, `variant`, `station` — **pas** un type d'objet distinct.

---

## 1. Définition normative

### 1.1 Objet

Un **Scénario clinique** est l'**agrégat éditorial publié** par lequel une Release propose **une épreuve narrative d'application** : l'apprenant suit une situation clinique cohérente, exerce un raisonnement séquentiel, prend des décisions contextualisées et accède à une résolution commentée.

C'est l'**unité atomique d'application clinique** dans la couche **Publication** — distincte de la Connaissance (KP), de la Compréhension (explication publiée), de la vérification QCM (Question d'évaluation) et de l'Apprentissage (données apprenant).

### 1.2 Responsabilité unique

| Responsabilité | Énoncé |
|---|---|
| **Appliquer** | Mettre l'apprenant en situation de **raisonner cliniquement** en enchaînant faits, hypothèses et décisions sur **plusieurs KP** |
| **Narrer** | Porter un **fil clinique cohérent** — situation, évolution, résolution — **non réductible** à des items QCM isolés |
| **Résoudre** | Clore le parcours par une **résolution explicite** et une **explication finale** groundée, rendant compte du raisonnement attendu |

Le Scénario clinique **ne possède aucune autre responsabilité légitime**.

### 1.3 Frontières

| Le Scénario clinique est | Le Scénario clinique n'est pas |
|---|---|
| Un objet publié dans une Release | Un walkthrough, une leçon, un cours |
| Une épreuve narrative d'application | Une Question d'évaluation, un QCM, un item barémé EDN isolé |
| Groundé sur ≥ 2 KP | Une source autonome de vérité médicale |
| Identifié dans une Release | Une identité durable cross-Release (invariant V1) |
| Consommable sans génération dynamique (PDR-A3) | Une banque régénérée à chaque lecture |
| Complémentaire au corpus QCM | Un substitut aux Questions ou aux explications |

### 1.4 Pourquoi existe-t-il

Lou Médecine sépare **comprendre**, **vérifier** (QCM) et **appliquer**. Les Questions testent des faits de manière atomique et scorable ; elles **ne suffisent pas** à vérifier l'enchaînement du raisonnement clinique sur un cas.

Sans Scénario clinique, une Release publie la compréhension et le QCM mais **ne publie pas** l'application intégrée requise par le produit (PDR-A3 : 3–5 cas complémentaires par chapitre dense).

### 1.5 Pourquoi ni walkthrough ni Question d'évaluation

| Objet | Rôle | Raison de la séparation |
|---|---|---|
| **Explication publiée (walkthrough)** | **Enseigner** — explication canonique structurée d'un concept | Pas de situation clinique simulée ; pas de parcours décisionnel ; pas de piège pédagogique intégré au récit |
| **Question d'évaluation** | **Vérifier** — item QCM scorable (PDR-D9) | Item unique ; barème par option ; pas de fil narratif obligatoire |
| **Scénario clinique** | **Appliquer** — raisonnement clinique contextualisé | Récit multi-segments ; ≥ 2 KP ; résolution synthétique |

**Invariant de disjointure :** un Scénario clinique **n'est jamais** une Question d'évaluation ; une Question **n'est jamais** un Scénario. Aucun agrégat parent « épreuve » ne les unifie ([contrat 07](07-ASSESSMENT-QUESTION.md) §1.5, [contrat 08](08-RELEASE-EDITORIAL-ARCHITECTURE.md) R-06).

---

## 2. Structure éditoriale

Un Scénario clinique est un **agrégat unique**. Ses segments et points de décision ne possèdent **pas** d'identité éditoriale autonome ni de cycle de vie indépendant.

### 2.1 Constituants obligatoires

| Constituant | Description éditoriale | Obligation |
|---|---|---|
| **Identité** | Identifiant stable **`scenario_id`** **local à la Release** `(chapitre, édition Collège, version de publication)` | Requis |
| **`kind`** | Discriminant éditorial : `standard` \| `trap` \| `synthesis` \| `variant` \| `station` | Requis |
| **Intitulé éditorial** | Titre court identifiant le cas pour la curation — **pas** une identité médicale | Requis ; non vide |
| **Situation clinique** | Présentation initiale : contexte patient, données disponibles, problème posé | Requis ; non vide ; facettes claim sur tout contenu médical |
| **Progression du raisonnement** | Séquence ordonnée d'**au moins un segment** (§2.3) entre situation et résolution | Requis ; **≥ 1** segment |
| **Résolution** | Déroulement attendu, conduite à tenir ou issue clinique du cas | Requis ; non vide ; groundée |
| **Explication finale** | Synthèse pédagogique commentée : raisonnement, pièges évités, liens aux KP | Requis ; non vide ; groundée |
| **Références KP** | Points de connaissance mobilisés par le cas | **≥ 2** ; chaque référence résout vers un KP valide du chapitre |
| **Facettes de claim** | Sur situation, segments, résolution, explication finale, libellés et retours des points de décision | Requis sur tout contenu orienté apprenant porteur de sens médical |

### 2.2 Constituants optionnels

| Constituant | Description | Contrainte |
|---|---|---|
| **Références élément pédagogique** | Identifiants d'éléments du Blueprint — contexte ou renvoi post-cas | **0..*** ; jamais prérequis logique |
| **Références croisées** | Renvoi vers explication publiée ou Question — **référence** uniquement | **0..*** ; pas d'inclusion |
| **Métadonnées éditoriales** | Difficulté, tags, durée indicative (ex. station ECOS) | Ne créent pas d'identité |
| **Facette media** | ECG, imagerie, résultats paracliniques — attachée à un segment | Grounding requis ; **pas** entité Visuel officiel sauf référence explicite par identité |

### 2.3 Segments — constituants de la progression

La **progression du raisonnement** est une séquence ordonnée de **segments**. Chaque segment est un **constituant** — **pas** une entité publiée.

| Type de segment | Rôle éditorial | Contenu minimal |
|---|---|---|
| **Narratif** | Fait évoluer le cas (nouvelle donnée, examen, évolution) | Texte + facettes claim si médical |
| **Décision** | Demande à l'apprenant de trancher **dans le fil du cas** | Énoncé de décision ; **≥ 2** choix ; retour groundé **par choix** |
| **Transition** | Liaison explicite entre étapes — optionnelle si le narratif suffit | Texte bref ou implicite dans enchaînement |

**Règles des points de décision :**

- Un point de décision **n'est pas** une Question d'évaluation — pas de `question_id`, pas de barème EDN (PDR-D9).
- Chaque choix possède un **retour pédagogique groundé** (justification clinique) — analogue fonctionnel à l'explication d'option, **sans** tier de score obligatoire.
- Les décisions **servent le récit** — pas une suite de QCM déguisés.

### 2.4 Variantes par `kind` (V1)

| `kind` | Intention éditoriale | Contrainte V1 |
|---|---|---|
| **`standard`** | Application directe du cours sur un cas représentatif | Cas « fil rouge » du chapitre |
| **`trap`** | Mettre en évidence une **erreur fréquente** ou un piège clinique | Piège **explicité** dans l'explication finale — jamais arbitraire |
| **`synthesis`** | Intégrer **plusieurs notions** du chapitre dans un cas unique | **≥ 3** KP recommandés |
| **`variant`** | Variante de présentation, de sévérité ou de contexte sur une notion du chapitre | Complète un cas `standard` ou `trap` |
| **`station`** | Forme **ECOS** — station structurée, checklist, contraintes de temps possibles en métadonnées | Même agrégat Scénario ; contraintes = **facettes**, pas nouvelle entité |

Le modèle conceptuel **ne change pas** entre kinds — seules les règles de curation diffèrent.

### 2.5 Ce que le Scénario ne contient pas

**Interdit** dans un Scénario clinique :

- un walkthrough ou une leçon substituant à l'explication publiée ;
- une **liste de Questions d'évaluation** référencées ou embarquées comme substitut au récit ;
- un fait médical sans facette de claim résolvable vers KP → ancre source ;
- des données apprenant ;
- du vocabulaire ou de l'ordre d'affichage propres au Reader ;
- une référence obligatoire à une explication pour être soluble ;
- un agrégat « banque », « assessment » ou « maîtrise » ;
- des entités **Segment**, **Décision** ou **Piège** avec identité propre.

---

## 3. Invariants

Les règles ci-dessous **ne doivent jamais être invalidées** sans amendement explicite de ce contrat.

### 3.1 Nature et responsabilité

| # | Invariant |
|---|---|
| S-01 | Un Scénario clinique **raconte toujours** une situation clinique **cohérente** de bout en bout. |
| S-02 | Un Scénario clinique **applique** un raisonnement — il **ne se réduit jamais** à une mémorisation de faits isolés sans fil clinique. |
| S-03 | Un Scénario clinique **n'enseigne jamais** à la place du walkthrough : il **met en situation** ; l'enseignement canonique reste l'explication publiée. |
| S-04 | Un Scénario clinique **ne se réduit jamais** à une succession de Questions d'évaluation indépendantes. |
| S-05 | Un Scénario clinique **ne porte jamais seul** une vérité médicale durable : le KP est l'identité de savoir ; le Scénario **mobilise** ces savoirs. |

### 3.2 Structure et contenu

| # | Invariant |
|---|---|
| S-06 | Tout Scénario clinique référence **au moins deux KP** valides. |
| S-07 | Tout Scénario clinique possède une **situation clinique**, une **progression**, une **résolution** et une **explication finale** — tous non vides. |
| S-08 | **Aucun** contenu orienté apprenant porteur de sens médical n'est publié **sans** facette de claim groundée ([contrat 01](01-TRUST-AND-FIDELITY.md)). |
| S-09 | Les **segments** et **points de décision** sont des **constituants** ; ils n'ont **pas** d'identité éditoriale autonome. |
| S-10 | Un **`kind`** est **obligatoire** et appartient à l'ensemble clos §2.4 (extensions futures = amendement contrat). |

### 3.3 Identité et patrimoine

| # | Invariant |
|---|---|
| S-11 | L'identité **`scenario_id`** est **stable au sein d'une Release publiée** et **locale à cette Release**. |
| S-12 | Un **`scenario_id` retiré ou remplacé** n'est **pas réutilisé** pour un contenu différent au sein de la même Release. |
| S-13 | Les données d'apprentissage (complétion, tentatives de parcours) **n'appartiennent pas** au Scénario : ancrage `(apprenant, Release, scenario_id)` (ADR-006, [contrat 06](06-RENDERER-AND-LEARNER-LAYER.md)). |
| S-14 | **Aucune modification silencieuse** d'un Scénario dans une Release **déjà publiée et active** (ADR-006). |

### 3.4 Relations

| # | Invariant |
|---|---|
| S-15 | Scénario ↔ KP : **N:M** ; **≥ 2 KP** par Scénario. |
| S-16 | Référence à un **élément pédagogique** : **optionnelle**, **non structuralle**. |
| S-17 | Scénario et **Question d'évaluation** sont **disjoints** — aucun ne contient l'autre. |
| S-18 | Scénario publié **sans génération dynamique** au Reader (PDR-A3). |

### 3.5 Priorité fidélité

| # | Invariant |
|---|---|
| S-19 | En cas de conflit entre effet pédagogique (piège, surprise) et **fidélité au Collège**, la **fidélité l'emporte** ([contrat 01](01-TRUST-AND-FIDELITY.md)). |

---

## 4. Critères de qualité éditoriale

### 4.1 Crédibilité clinique

| Critère | Exigence |
|---|---|
| **Cohérence du cas** | Signes, antécédents, examens et évolution **compatibles** entre eux |
| **Granularité réaliste** | Niveau de détail adapté à un étudiant en médecine — ni trivial ni sur-spécialisé hors chapitre |
| **Plausibilité** | Présentation reconnaissable comme situation clinique **crédible**, pas comme puzzle artificiel |

### 4.2 Progression logique

| Critère | Exigence |
|---|---|
| **Fil conducteur** | Chaque segment **fait avancer** le raisonnement — pas de digressions gratuites |
| **Enchaînement** | Les décisions **découlent** des informations déjà exposées — pas de donnée decisive cachée arbitrairement |
| **Résolution earned** | La résolution **clôt** le fil ouvert par la situation — pas de rupture narrative |

### 4.3 Pertinence pédagogique

| Critère | Exigence |
|---|---|
| **Alignement chapitre** | Le cas **mobilise** des KP du chapitre — pas un hors-sujet |
| **`kind` assumé** | Un cas `trap` expose un piège **documenté** ; un cas `synthesis` **intègre** réellement plusieurs notions |
| **Charge cognitive** | Un cas parcourable en une session d'étude — ni exhaustif ni anecdotique |

### 4.4 Complémentarité avec les QCM

| Critère | Exigence |
|---|---|
| **Non-redondance** | Le Scénario **n'est pas** un QCM long : il teste l'**enchaînement**, pas seulement des faits isolés |
| **Complémentarité** | Couvre des KP ou des angles **différents** ou **plus intégrés** que le corpus Questions |
| **Corpus chapitre** | L'ensemble des Scénarios d'une Release est **complémentaire** — objectif PDR-A3 : **3–5** cas (standard, piège, synthèse, + variantes selon intérêt) |

### 4.5 Fidélité au Collège

| Critère | Exigence |
|---|---|
| **Exactitude** | Aucune résolution ou retour de décision ne contredit le Collège de l'édition |
| **Pas d'invention** | Aucun fait clinique déterminant absent de la chaîne KP → ancre source |
| **Conservatisme** | En cas de doute, **retenir** le Scénario ([contrat 01](01-TRUST-AND-FIDELITY.md) fallback) |

### 4.6 Absence de pièges artificiels

| Critère | Exigence |
|---|---|
| **Piège pédagogique, pas caprice** | Un cas `trap` illustre une **erreur clinique réelle** — pas un trick de formulation |
| **Données loyales** | Toute information nécessaire à la décision juste est **présente ou accessible** dans le fil du cas |
| **Explication du piège** | L'explication finale **nomme** le piège et le corrige explicitement |

---

## 5. Validation — gates conceptuels

Une Scénario **publié** a passé les gates bloquants. Une Scénario **retenu** a échoué au moins un gate bloquant.

### 5.1 Gate — Grounding

| Exigence | Énoncé |
|---|---|
| **Couverture claim** | Situation, segments, résolution, explication finale, libellés et retours de décision — facettes groundées où requis |
| **Chaîne complète** | claim → KP → ancre source ([contrat 02](02-IDENTITY-AND-ANCHORS.md) §9) |
| **Échec** | Scénario **retenu** si facette requise non groundée |

### 5.2 Gate — Cohérence clinique

| Exigence | Énoncé |
|---|---|
| **Cohérence interne** | Signes, chronologie, décisions et résolution **non contradictoires** |
| **Cohérence du fil** | La progression **relie** situation et résolution sans rupture majeure |
| **Échec** | Scénario **retenu** si incohérence clinique ou narrative |

### 5.3 Gate — Fidélité

| Exigence | Énoncé |
|---|---|
| **Collège** | Aucun fait contredit l'édition déclarée |
| **Classes de claim** | Respect `sourced`, `scaffolding`, `bridging` ([contrat 01](01-TRUST-AND-FIDELITY.md)) |
| **Échec** | Scénario **retenu** en cas de violation |

### 5.4 Gate — Couverture KP

| Exigence | Énoncé |
|---|---|
| **Présence** | **≥ 2** KP référencés |
| **Validité** | KP existants dans l'inventaire du chapitre |
| **Pertinence** | KP **mobilisés** par le cas — pas de référence décorative |
| **Échec** | Scénario **retenu** si &lt; 2 KP ou référence invalide |

### 5.5 Gate — Non-déguisement QCM

| Exigence | Énoncé |
|---|---|
| **Structure narrative** | Présence d'une **situation** et d'une **résolution** liées par progression — pas une liste d'items autonomes |
| **Interdiction** | Références à des `question_id` comme **substitut** au contenu du Scénario |
| **Échec** | Scénario **retenu** s'il se réduit à une succession de Questions |

### 5.6 Gate — Identité et intégrité

| Exigence | Énoncé |
|---|---|
| **Unicité** | `scenario_id` unique dans la Release |
| **Complétude** | `kind`, intitulé, situation, progression, résolution, explication finale, KP refs |
| **Échec** | Scénario **retenu** ou Release non publiable selon gravité |

### 5.7 Gate — Qualité éditoriale

| Exigence | Énoncé |
|---|---|
| **Revue** | Critères §4 — crédibilité, progression, pièges |
| **Nature** | Gate **éditorial** — revue humaine ou critères futurs |
| **Échec** | Scénario **retenu** recommandé |

---

## 6. Cycle de vie

### 6.1 États

```
                    ┌─────────────────┐
                    │    [Absente]    │
                    └────────┬────────┘
                             │ production
                             ▼
                    ┌─────────────────┐
              ┌────│   Candidat      │
              │    └────────┬────────┘
              │             │ gates PASS
              │             ▼
              │    ┌─────────────────┐
              │    │   Validée       │
              │    └────────┬────────┘
              │             │ publication Release
              │             ▼
              │    ┌─────────────────┐
              │    │   Publiée       │
              │    └────────┬────────┘
              │             │ archivage Release
              │             ▼
              │    ┌─────────────────┐
              │    │   Archivée      │
              │    └────────┬────────┘
              │             │ nouvelle Release
              │             ▼
              │    ┌─────────────────┐
              └───►│  Remplacée      │
                   └─────────────────┘
                             │
              gates FAIL ────┘
                             ▼
                    ┌─────────────────┐
                    │   Retenue       │
                    └─────────────────┘
```

### 6.2 Règles de transition

| Transition | Règle |
|---|---|
| **Absente → Candidat** | Production à partir des KP et du contexte chapitre |
| **Candidat → Validée** | Gates bloquants §5.1–§5.6 **PASS** |
| **Validée → Publiée** | Inclusion dans Release publiée ([contrat 04](04-CHAPTER-PACKAGE.md) §14) |
| **Candidat / Validée → Retenue** | Échec gate — verdict **explicite** |
| **Publiée → Archivée** | Archivage Release (ADR-006) |
| **Publiée → Remplacée** | Nouvelle Release ; nouveau `scenario_id` ; ancien patrimoine conservé |
| **Retenue → Candidat** | Régénération — **nouveau candidat** |

### 6.3 Interdictions

**Interdit :** modification in-place d'un Scénario publié ; publication d'un Scénario retenu ; recyclage de `scenario_id` ; suppression silencieuse.

### 6.4 Continuité cross-Release

Mapping éditorial `(scenario_id@A → scenario_id@B)` **autorisé** — **non invariant V1**.

---

## 7. Relations

### 7.1 Scénario clinique ↔ Release

| | |
|---|---|
| **Cardinalité** | Release **1** — Scénario **0..*** |
| **Nature** | Composition — n'existe pas hors Release |
| **Statut** | **Obligatoire** pour Release *évaluation* / *complète* — ou absence **prévue** déclarée ([contrat 08](08-RELEASE-EDITORIAL-ARCHITECTURE.md) §4) |

### 7.2 Scénario clinique ↔ KP

| | |
|---|---|
| **Cardinalité** | Scénario **N** — KP **M** ; **≥ 2 KP** par Scénario |
| **Nature** | Le Scénario **mobilise** des KP — ne les possède pas |
| **Statut** | **Obligatoire** (≥ 2) |

### 7.3 Scénario clinique ↔ Élément pédagogique

| | |
|---|---|
| **Cardinalité** | **0..*** |
| **Nature** | Contexte ou renvoi post-cas |
| **Statut** | **Facultatif** — jamais prérequis |

### 7.4 Scénario clinique ↔ Explication publiée

| | |
|---|---|
| **Cardinalité** | **Aucune composition** |
| **Nature** | Lien **faible** — KP partagés ; renvoi optionnel dans explication finale |
| **Statut** | **Facultatif** — **interdit** comme prérequis structural |

### 7.5 Scénario clinique ↔ Question d'évaluation

| | |
|---|---|
| **Cardinalité** | **Aucune relation directe** |
| **Nature** | **Disjoints** — complémentaires dans la Release |
| **Statut** | **Interdit** : embarquer des Questions ; convertir le Scénario en liste de Questions |

---

## 8. Extensions futures autorisées

| Extension | Mécanisme | Invariant préservé |
|---|---|---|
| **`kind` additionnel** | Amendement contrat | Agrégat Scénario |
| **Station ECOS enrichie** | Métadonnées station ; checklist en facettes | `kind=station` |
| **Media clinique** | Facette media sur segment | Grounding ; pas Visuel officiel implicite |
| **Décisions multiples / branches** | Segments supplémentaires | Pas entité ; pas Question |
| **Scoring de parcours** | Facette scoring optionnelle — **distinct** PDR-D9 | Pas barème EDN par défaut |
| **Mapping cross-Release** | Outil éditorial | Identité locale Release |

**Interdit :** entité Segment, Piège, Banque cas ; fusion Scénario ↔ Question ; ECOS comme nouvelle entité.

---

## 9. Critères de conformité (observables)

1. Chaque Scénario publié est un **agrégat** avec `scenario_id` local à la Release.
2. Chaque Scénario référence **≥ 2 KP** ; possède situation, progression, résolution, explication finale, `kind`.
3. Tout contenu médical orienté apprenant porte des **facettes claim groundées**.
4. Aucun Scénario publié n'enseigne à la place du walkthrough ni ne se réduit à des Questions.
5. Scénario et Question restent **disjoints**.
6. Aucune modification silencieuse d'un Scénario publié actif.
7. Données apprenant **hors** Scénario — ancrage `(apprenant, Release, scenario_id)`.

---

## Documents connexes

| Document | Rôle |
|---|---|
| [Contrat 07](07-ASSESSMENT-QUESTION.md) | Question d'évaluation — disjointe |
| [Contrat 08](08-RELEASE-EDITORIAL-ARCHITECTURE.md) | Coexistence Release |
| [PDR-A3](../governance/PRODUCT-DECISION-REGISTRY.md) | 3–5 cas ; types complémentaires |
| [ADR-006](../adr/ADR-006-pedagogical-patrimony-and-edition-lineage.md) | Patrimoine Release |

---

## Amendements

| Version | Date | Effet |
|---|---|---|
| **1.0** | 2026-07-31 | Création — Scénario clinique |
