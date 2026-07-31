# Contrat 07 — Question d'évaluation

| | |
|---|---|
| **Type** | Contrat fondamental normatif |
| **Statut** | En vigueur — 2026-07-31 |
| **Question unique** | Qu'est-ce qu'une Question d'évaluation dans Lou Médecine, et quelles obligations lui incombent ? |
| **Index** | [`00-INDEX.md`](00-INDEX.md) |

Ce contrat définit l'objet éditorial **Question d'évaluation** — unité publiée de vérification QCM au sein d'une **Release** ([ADR-006](../adr/ADR-006-pedagogical-patrimony-and-edition-lineage.md), [contrat 04](04-CHAPTER-PACKAGE.md)). Il décrit la **structure éditoriale**, les **invariants**, les **critères de qualité**, les **gates de validation**, le **cycle de vie** et les **relations** ; jamais l'implémentation d'un outil de build, d'un format de fichier, d'un manifest ou d'un lecteur.

En cas de conflit avec un document non listé dans les frontières documentaires, les sources consolidées, les ADR et les PDR applicables priment selon [`00-INDEX.md`](00-INDEX.md).

---

## Frontières documentaires

| Contrat / document | Ce qu'il définit — non recopié ici |
|---|---|
| [01 — Trust & Fidelity](01-TRUST-AND-FIDELITY.md) | Classes de claim, grounding, fidélité, fallback conservateur |
| [02 — Identity & Anchors](02-IDENTITY-AND-ANCHORS.md) | Identités KP, élément pédagogique, bloc de claim, chaîne de traçabilité |
| [03 — Acquisition SSOT](03-ACQUISITION-SSOT.md) | Texte officiel Collège, édition, ancres source |
| [04 — Chapter Package](04-CHAPTER-PACKAGE.md) | Release, publication chapitre, registre projections, cycle de vie package |
| [05 — Visual Grammar](05-VISUAL-GRAMMAR.md) | Visuels officiels — hors périmètre Question sauf extension media (§8) |
| [06 — Renderer & Learner Layer](06-RENDERER-AND-LEARNER-LAYER.md) | Consommation aval ; persistance tentatives QCM apprenant |
| [PDR-A3](../governance/PRODUCT-DECISION-REGISTRY.md) | Corpus d'évaluation au niveau chapitre ; volumes cibles QCM/cas |
| [PDR-D9](../governance/PRODUCT-DECISION-REGISTRY.md) | Barème EDN V1 ; extensibilité moteur de score |

**Ce contrat (07)** définit **exclusivement** la Question d'évaluation : définition normative, structure éditoriale, invariants, qualité, validation, cycle de vie, relations et extensions autorisées.

**Terminologie.** Dans ce contrat :

- **Question d'évaluation** — objet éditorial publié de vérification QCM ; **ne pas confondre** avec le **prompt pédagogique** du bloc d'explication de compréhension ([contrat 04](04-CHAPTER-PACKAGE.md) §8).
- **Option** — constituant de la Question ; **pas** une entité éditoriale autonome.
- **Tier de score** — coefficient de barème EDN attaché à une option (PDR-D9).
- **Facette de claim** — unité de traçabilité orientée apprenant portée par l'énoncé, une option ou une explication d'option ; **pas** un objet éditorial autonome ([contrat 02](02-IDENTITY-AND-ANCHORS.md) §7).

---

## 1. Définition normative

### 1.1 Objet

Une **Question d'évaluation** est l'**agrégat éditorial publié** par lequel une Release propose **une épreuve scorable et rejouable** : l'apprenant lit un énoncé, sélectionne une option, reçoit un score et un retour pédagogique immédiat par option.

C'est l'**unité atomique de vérification QCM** dans la couche **Publication** — distincte de la Connaissance (KP), de la Compréhension (explication publiée) et de l'Apprentissage (données apprenant).

### 1.2 Responsabilité unique

| Responsabilité | Énoncé |
|---|---|
| **Vérifier** | Permettre à l'apprenant de **tester** sa maîtrise de un ou plusieurs faits médicaux déjà modélisés comme points de connaissance |
| **Scorer** | Produire un **résultat chiffré** conforme au modèle de score déclaré (V1 : barème EDN — PDR-D9) |
| **Expliquer** | Fournir, **pour chaque option**, une explication groundée justifiant le tier de score obtenu |

La Question d'évaluation **ne possède aucune autre responsabilité légitime**.

### 1.3 Frontières

| La Question d'évaluation est | La Question d'évaluation n'est pas |
|---|---|
| Un objet publié dans une Release | Un walkthrough, une leçon, un résumé |
| Une épreuve à item unique (V1) | Un scénario clinique, un ECOS, un récit multi-étapes |
| Groundée sur au moins un KP | Une source autonome de vérité médicale |
| Identifiée dans une Release | Une identité durable cross-Release (invariant V1) |
| Consommable sans génération dynamique (PDR-A3) | Une banque régénérée à chaque lecture |

### 1.4 Pourquoi existe-t-elle

Lou Médecine sépare **comprendre** et **vérifier**. La compréhension est publiée sous forme d'**explications** (famille compréhension). La vérification intermédiaire chapitre — auto-évaluation proche des conditions EDN — exige un objet dédié, scorable, historisable par l'apprenant, groundé indépendamment du walkthrough.

Sans Question d'évaluation, une Release publie la compréhension mais **ne publie pas** la vérification atomique requise par le produit (PDR-A3, [doc 14](../renderer/14-LOU-READER-ARCHITECTURE.md)).

### 1.5 Pourquoi ni walkthrough ni scénario clinique

| Objet | Rôle | Raison de la séparation |
|---|---|---|
| **Explication publiée (walkthrough)** | **Enseigner** — explication canonique d'un concept | Pas de barème ; pas de distracteurs ; pas d'historique de tentatives par item |
| **Scénario clinique** | **Appliquer** — raisonnement clinique narratif multi-segments | Parcours, pas item scorable unique ; lifecycle et validation distincts |
| **Question d'évaluation** | **Vérifier** — item QCM scorable | Structure, scoring et explications par option propres à l'épreuve |

**Invariant de disjointure :** une Question d'évaluation **n'est jamais** un scénario clinique ; un scénario clinique **n'est jamais** une Question d'évaluation. Aucun agrégat parent « épreuve » ne les unifie.

---

## 2. Structure éditoriale

Une Question d'évaluation est un **agrégat unique**. Ses parties ne possèdent **pas** d'identité éditoriale autonome ni de cycle de vie indépendant.

### 2.1 Constituants obligatoires

| Constituant | Description éditoriale | Obligation |
|---|---|---|
| **Identité** | Identifiant stable **`question_id`** **local à la Release** `(chapitre, édition Collège, version de publication)` | Requis |
| **Énoncé** | Texte de l'épreuve (*stem*) — ce que l'apprenant doit trancher | Requis ; non vide |
| **Facettes de claim de l'énoncé** | Découpage traçable de l'énoncé vers un ou plusieurs KP | Requis sur tout énoncé orienté apprenant porteur de sens médical |
| **Références KP** | Liste de **un ou plusieurs** points de connaissance que la Question vérifie | **≥ 1** ; chaque référence doit résoudre vers un KP valide du chapitre |
| **Options** | Liste ordonnée de **deux options ou plus** | Requis ; **≥ 2** |
| **Libellé d'option** | Texte de chaque option proposée à l'apprenant | Requis par option ; non vide |
| **Facettes de claim du libellé** | Traçabilité du libellé de chaque option | Requis sur tout libellé porteur de sens médical |
| **Tier de score** | Coefficient de barème attaché à chaque option — V1 : `{1 ; 0,5 ; 0,2 ; 0}` (PDR-D9) | Requis par option ; **exactement un tier par option** |
| **Explication d'option** | Texte justifiant le tier de score de **cette** option | **Obligatoire pour chaque option** (PDR-D9) |
| **Facettes de claim de l'explication** | Traçabilité de chaque explication d'option | Requis sur toute explication porteuse de sens médical |
| **Modèle de score** | Déclaration du barème applicable — V1 : **`edn_v1`** | Requis |

### 2.2 Constituants optionnels

| Constituant | Description | Contrainte |
|---|---|---|
| **Références élément pédagogique** | Identifiants d'éléments pédagogiques du Blueprint — **contexte séquentiel ou renvoi pédagogique uniquement** | **0..*** ; jamais prérequis logique à la résolution de la Question |
| **Métadonnées éditoriales** | Difficulté, rang EDN, tags internes de curation | Ne créent pas d'identité ; n'introduisent pas de vérité médicale |
| **Référence croisée vers explication** | Renvoi explicite vers un élément pédagogique ou une formulation de walkthrough | **Référence** ; pas inclusion du walkthrough |

### 2.3 Structure des options

Chaque **option** est un **constituant** de l'agrégat Question. Elle comprend **exactement** :

1. un **libellé** ;
2. un **tier de score** ;
3. une **explication** ;
4. les **facettes de claim** associées au libellé et à l'explication.

**Interdit :** modéliser une option, un distracteur ou une explication d'option comme entité éditoriale séparée avec identité propre.

### 2.4 Variantes de forme (V1)

Les formes suivantes sont des **variantes éditoriales** de la même Question d'évaluation — **pas** des types d'objets distincts :

| Variante | Contrainte V1 |
|---|---|
| QCM classique (une bonne réponse) | Au moins une option tier **1** ; les autres tiers inférieurs |
| Vrai / Faux | Exactement **deux** options |
| « Laquelle est fausse ? » | Énoncé explicite ; une option tier **1** (la réponse attendue à la formulation) ; barème conforme PDR-D9 |

Le modèle conceptuel **ne change pas** ; seules les règles de curation et de gate de cohérence du barème s'adaptent.

### 2.5 Ce que la Question ne contient pas

**Interdit** dans une Question d'évaluation :

- un walkthrough ou une leçon ;
- un arc narratif clinique multi-segments ;
- un fait médical sans facette de claim résolvable vers KP → ancre source ;
- des données apprenant (tentatives, couleurs, progression) ;
- du vocabulaire ou de l'ordre d'affichage propres au Reader ;
- une référence obligatoire à un élément pédagogique pour être soluble ;
- un agrégat « banque », « assessment » ou « maîtrise ».

---

## 3. Invariants

Les règles ci-dessous **ne doivent jamais être invalidées** par une évolution du projet sans amendement explicite de ce contrat.

### 3.1 Nature et responsabilité

| # | Invariant |
|---|---|
| I-01 | Une Question d'évaluation est **toujours** une **épreuve scorable** : une sélection principale par tentative (V1) produit un score. |
| I-02 | Une Question d'évaluation **n'enseigne jamais** : elle vérifie ; l'enseignement relève de l'explication publiée. |
| I-03 | Une Question d'évaluation **ne raconte jamais** un cas clinique : le récit d'application relève du scénario clinique. |
| I-04 | Une Question d'évaluation **ne porte jamais seule** une vérité médicale durable : le KP est l'identité de savoir ; la Question la **teste**. |

### 3.2 Structure et contenu

| # | Invariant |
|---|---|
| I-05 | Toute Question d'évaluation référence **au moins un KP** valide. |
| I-06 | Toute Question d'évaluation possède **au moins deux options**. |
| I-07 | **Chaque option** possède **exactement un tier de score** et **une explication** — obligation PDR-D9. |
| I-08 | **Aucun** énoncé, libellé d'option ou explication orienté apprenant porteur de sens médical n'est publié **sans** facette de claim groundée ([contrat 01](01-TRUST-AND-FIDELITY.md)). |
| I-09 | L'**option** est un **constituant** de la Question ; elle n'a **pas** d'identité éditoriale autonome. |
| I-10 | La **facette de claim** est un mécanisme de traçabilité ; elle n'est **pas** un objet éditorial autonome. |

### 3.3 Identité et patrimoine

| # | Invariant |
|---|---|
| I-11 | L'identité **`question_id`** est **stable au sein d'une Release publiée** et **locale à cette Release**. |
| I-12 | Un **`question_id` retiré ou remplacé** dans une Release **n'est pas réutilisé** pour un contenu différent au sein de la même Release. |
| I-13 | Les données d'apprentissage (tentatives, historique QCM) **n'appartiennent pas** à la Question ni à la Release éditoriale : elles sont **rattachées** à `(apprenant, Release, question_id)` ([contrat 06](06-RENDERER-AND-LEARNER-LAYER.md), ADR-006). |
| I-14 | **Aucune modification silencieuse** d'une Question dans une Release **déjà publiée et active** : toute évolution produit une **nouvelle Release** ou une **bascule explicite** (ADR-006). |

### 3.4 Relations

| # | Invariant |
|---|---|
| I-15 | La relation Question ↔ KP est **N:M** : une Question peut cibler plusieurs KP ; un KP peut apparaître dans plusieurs Questions. |
| I-16 | La référence à un **élément pédagogique** est **optionnelle** et **non structuralle**. |
| I-17 | La Question d'évaluation et le **scénario clinique** sont **disjoints** — aucun ne contient l'autre. |
| I-18 | La Question d'évaluation est **publiée sans génération dynamique** au Reader (PDR-A3). |

### 3.5 Priorité fidélité

| # | Invariant |
|---|---|
| I-19 | En cas de conflit entre qualité pédagogique perçue et **fidélité au Collège**, la **fidélité au Collège l'emporte** ([contrat 01](01-TRUST-AND-FIDELITY.md) § priorité absolue). |

---

## 4. Critères de qualité éditoriale

Les critères ci-dessous distinguent une Question **acceptable** d'une Question **insuffisante**. Ils complètent — ne remplacent pas — les gates de validation (§5).

### 4.1 Non-ambiguïté

| Critère | Exigence |
|---|---|
| **Clarté de l'énoncé** | Une seule interprétation défendable de ce que l'apprenant doit trancher |
| **Unicité de la réponse attendue (V1)** | Au regard de l'énoncé et du barème EDN V1, les tiers sont **justifiables sans arbitrage subjectif** |
| **Absence de double négation abusive** | Formulations qui induisent erreur par grammaire, non par médecine — à éviter |

Une Question **ambiguë** est **retenue** jusqu'à reformulation, même si techniquement groundée.

### 4.2 Qualité des options

| Critère | Exigence |
|---|---|
| **Plausibilité des options non maximales** | Les options tier &lt; 1 représentent des **erreurs crédibles** d'étudiants, pas des absurdités |
| **Homogénéité de grain** | Les options sont comparables ( même niveau de précision, même type de formulation ) |
| **Distracteurs médicalement distincts** | Une option fausse est **clairement fausse une fois expliquée** — pas « presque vraie » sans signal dans l'explication |
| **Économie** | Pas de options redondantes ou synonymes |

**Note :** le terme *distracteur* désigne **rôle pédagogique** d'une option tier &lt; 1 — **pas** une entité.

### 4.3 Couverture du chapitre

| Critère | Exigence |
|---|---|
| **Corpus chapitre** | L'ensemble des Questions d'une Release **couvre** le chapitre de manière **complémentaire** — objectifs indicatifs PDR-A3 : ~30 / ~50 / ~70 selon densité |
| **Priorité aux KP `deferred-to-mastery`** | Les KP en disposition `deferred-to-mastery` ([contrat 04](04-CHAPTER-PACKAGE.md) §6) sont **prioritaires** — sans exclusivité |
| **Absence de redondance massive** | Éviter plusieurs Questions quasi identiques testant le même fait sous la même forme |

Un KP **sans** Question dédiée reste **légitime**.

### 4.4 Complémentarité avec la compréhension

| Critère | Exigence |
|---|---|
| **Pas de paraphrase du walkthrough** | La Question **vérifie** ; elle ne republie pas l'explication canonique |
| **Pas de prérequis implicite** | Soluble sans avoir mémorisé une formulation exacte du walkthrough |
| **Renvoi utile** | Les explications d'option **peuvent** orienter vers un élément pédagogique — sans recopier le walkthrough |

### 4.5 Calibration EDN

| Critère | Exigence |
|---|---|
| **Niveau adapté** | Difficulté cohérente avec le rang et la densité du chapitre |
| **Barème EDN V1** | Tiers conformes PDR-D9 ; pas de contournement du barème par formulation |
| **Formulation proche de l'EDN** | Style d'épreuve reconnaissable — sans prétendre reproduire une annale officielle |

### 4.6 Fidélité au Collège

| Critère | Exigence |
|---|---|
| **Exactitude** | Aucune option ou explication ne contredit le Collège de l'édition de la Release |
| **Pas d'invention** | Aucun fait testé absent de la chaîne KP → ancre source |
| **Conservatisme** | En cas de doute, **retenir** la Question plutôt que publier un item douteux ([contrat 01](01-TRUST-AND-FIDELITY.md) fallback) |

---

## 5. Validation — gates conceptuels

Les gates ci-dessous sont des **exigences normatives**. Leur mise en œuvre technique relève des outils de build et de validation — hors ce contrat.

Une Question **publiée** a **passé** ou **hérite** de la validation de sa Release. Une Question **retenue** a **échoué** au moins un gate bloquant.

### 5.1 Gate — Grounding

| Exigence | Énoncé |
|---|---|
| **Couverture claim** | Tout énoncé, libellé d'option et explication d'option porteur de sens médical possède une facette de claim **groundée** |
| **Chaîne complète** | Chaque facette se résout : claim → KP → ancre source conforme ([contrat 02](02-IDENTITY-AND-ANCHORS.md) §9) |
| **Échec** | Question **retenue** si au moins une facette requise est non groundée |

### 5.2 Gate — Fidélité

| Exigence | Énoncé |
|---|---|
| **Cohérence Collège** | Aucun fait contredit la source officielle de l'édition déclarée |
| **Classes de claim** | Respect des classes `sourced`, `scaffolding`, `bridging` ([contrat 01](01-TRUST-AND-FIDELITY.md)) |
| **Échec** | Question **retenue** en cas de violation de fidélité |

### 5.3 Gate — Cohérence du barème

| Exigence | Énoncé |
|---|---|
| **Modèle déclaré** | Le modèle de score est **`edn_v1`** en V1 |
| **Tiers valides** | Chaque option porte un tier ∈ `{1 ; 0,5 ; 0,2 ; 0}` |
| **Cohérence V1** | Pour une Question à réponse unique classique : **au moins une** option tier **1** ; les tiers sont **mutuellement exclusifs** pour une même sélection ( une option choisie → un score ) |
| **Variantes V/F** | Deux options ; tiers cohérents avec l'énoncé |
| **Échec** | Question **retenue** si barème incohérent |

### 5.4 Gate — Exhaustivité des explications

| Exigence | Énoncé |
|---|---|
| **Par option** | Chaque option possède une explication **non vide** |
| **Justification du tier** | L'explication rend compte du tier de score — pourquoi 1, 0,5, 0,2 ou 0 |
| **Échec** | Question **retenue** si une option manque d'explication |

### 5.5 Gate — Références KP

| Exigence | Énoncé |
|---|---|
| **Présence** | ≥ 1 KP référencé |
| **Validité** | Chaque KP existe dans l'inventaire du chapitre de la Release |
| **Cohérence** | Les KP référencés sont **pertinents** par rapport à l'énoncé et aux options — gate de cohérence éditoriale |
| **Échec** | Question **retenue** si référence KP absente ou invalide |

### 5.6 Gate — Identité et intégrité

| Exigence | Énoncé |
|---|---|
| **Unicité** | `question_id` unique au sein de la Release |
| **Complétude structurelle** | Énoncé, options, tiers, explications, modèle de score présents |
| **Échec** | Question **retenue** ou Release **non publiable** selon gravité |

### 5.7 Gate — Qualité (non-ambiguïté)

| Exigence | Énoncé |
|---|---|
| **Revue éditoriale** | Absence d'ambiguïté résiduelle au sens §4.1 |
| **Nature** | Gate **éditorial** — peut relever de revue humaine ou critères automatisables futurs |
| **Échec** | Question **retenue** recommandée ; blocage publication Release si politique package l'exige |

---

## 6. Cycle de vie

### 6.1 États

```
                    ┌─────────────────┐
                    │    [Absente]    │  ← aucune Question produite pour ce slot
                    └────────┬────────┘
                             │ production
                             ▼
                    ┌─────────────────┐
              ┌────│   Candidat      │  ← produite ; validation en cours
              │    └────────┬────────┘
              │             │ gates PASS
              │             ▼
              │    ┌─────────────────┐
              │    │   Validée       │  ← tous gates bloquants PASS
              │    └────────┬────────┘
              │             │ inclusion Release + publication
              │             ▼
              │    ┌─────────────────┐
              │    │   Publiée       │  ← fait partie d'une Release active
              │    └────────┬────────┘
              │             │ archivage Release (ADR-006)
              │             ▼
              │    ┌─────────────────┐
              │    │   Archivée      │  ← Release archivée ; Question figée patrimonialement
              │    └────────┬────────┘
              │             │ nouvelle Release
              │             ▼
              │    ┌─────────────────┐
              └───►│  Remplacée      │  ← nouvelle Question (nouveau question_id) dans nouvelle Release
                   └─────────────────┘
                             │
              gates FAIL ────┘ (depuis Candidat ou Validée)
                             ▼
                    ┌─────────────────┐
                    │   Retenue       │  ← produite ; non publiée ; échec explicite consigné
                    └─────────────────┘
```

### 6.2 Règles de transition

| Transition | Règle |
|---|---|
| **Absente → Candidat** | Production à partir des KP et du contexte chapitre |
| **Candidat → Validée** | Tous les gates bloquants (§5.1–§5.6) **PASS** |
| **Validée → Publiée** | Inclusion dans une Release **publiée** après validation intégrale du package ([contrat 04](04-CHAPTER-PACKAGE.md) §14) |
| **Candidat / Validée → Retenue** | Échec d'un gate bloquant — **verdict explicite**, jamais silencieux |
| **Publiée → Archivée** | Archivage de la Release (ADR-006) — pas de suppression par défaut |
| **Publiée → Remplacée** | **Nouvelle Release** ; nouvelle Question ; ancienne reste **archivée** avec son historique apprenant |
| **Retenue → Candidat** | Régénération ou correction amont — **nouveau candidat**, pas modification d'une Question publiée |

### 6.3 Interdictions de cycle de vie

**Interdit :**

- modifier le contenu d'une Question **publiée** in-place dans une Release active ;
- remplacer silencieusement une Question publiée par un build incomplet ;
- supprimer une Question publiée sans archivage de la Release ;
- publier une Question **retenue** ;
- recycler un `question_id` pour un contenu différent dans la même Release.

### 6.4 Continuité cross-Release

Un **mapping éditorial** `(question_id@Release_A → question_id@Release_B)` est **autorisé** comme outil de continuité — **non invariant V1**, jamais requis pour la persistance apprenant.

---

## 7. Relations

### 7.1 Question d'évaluation ↔ Release

| | |
|---|---|
| **Cardinalité** | Release **1** — Question **0..*** |
| **Nature** | Composition : la Question **n'existe pas** comme objet publié hors Release |
| **Pourquoi** | ADR-006 — patrimoine versionné ; ancrage `(chapitre, édition, version_publication)` |

### 7.2 Question d'évaluation ↔ KP

| | |
|---|---|
| **Cardinalité** | Question **N** — KP **M** ; **≥ 1 KP** par Question |
| **Nature** | La Question **cible** des KP — elle ne les possède pas |
| **Pourquoi** | Le KP est l'identité durable du savoir ; la Question **vérifie** ce savoir ; le diff éditorial et la SR conceptuelle s'ancrent sur le KP |

**Règle :** la maîtrise conceptuelle durable (spaced repetition, stats par notion) s'ancre sur **KP + Release** — **pas** sur `question_id` seul.

### 7.3 Question d'évaluation ↔ Élément pédagogique

| | |
|---|---|
| **Cardinalité** | Question **N** — Élément **0..*** (optionnel) |
| **Nature** | **Contexte séquentiel** ou renvoi pédagogique post-tentative |
| **Pourquoi** | Les items de maîtrise **peuvent** référencer un élément pour le fil pédagogique ([contrat 04](04-CHAPTER-PACKAGE.md) §6.2) — **sans** exiger qu'un KP soit enseigné via un nœud Blueprint |

**Interdit :** rendre la résolution de la Question **conditionnelle** à la lecture préalable d'un walkthrough.

### 7.4 Question d'évaluation ↔ Explication publiée

| | |
|---|---|
| **Cardinalité** | **Aucune composition** ; lien **faible** par KP partagés ou référence croisée optionnelle |
| **Nature** | Couches **Publication** distinctes : compréhension (enseigner) vs vérification (tester) |
| **Pourquoi** | Ordre produit : compréhension avant vérification ([doc 14](../renderer/14-LOU-READER-ARCHITECTURE.md)) ; pas de duplication du walkthrough |

Une explication d'option **peut** renvoyer vers un élément pédagogique — **sans** inclure le walkthrough.

### 7.5 Question d'évaluation ↔ Scénario clinique

| | |
|---|---|
| **Cardinalité** | **Aucune relation directe** |
| **Nature** | Objets **disjoints** au sein de la même Release |
| **Pourquoi** | Responsabilités orthogonales : item scorable vs récit d'application ; éviter la fusion « mini-scénario » |

Un chapitre publie **both** Questions et Scénarios (PDR-A3) — **sans** lien structurel entre eux.

---

## 8. Extensions futures autorisées

Les extensions ci-dessous **ne modifient pas** le cœur conceptuel (agrégat Question, KP obligatoire, option = constituant, explication par option). Elles s'ajoutent par **facettes**, **modèles de score** ou **variantes de forme**.

| Extension | Mécanisme autorisé | Ce qui ne change pas |
|---|---|---|
| **Image ou média dans l'énoncé** | Facette **media** attachée à l'énoncé — ECG, imagerie, etc. | Question reste agrégat ; KP obligatoire ; grounding requis sur tout sens médical |
| **Appariement (matching)** | Variante de **présentation des options** — pas nouvelle entité | Tiers et explications par option |
| **Réponses multiples** | Nouveau **modèle de score** (`edn_v2`, etc.) — PDR-D9 | Structure agrégat ; explication par option |
| **Réponse partiellement correcte avancée** | Évolution du modèle de score | KP ; grounding ; disjointure scénario |
| **Métadonnées enrichies** | Tags, statistiques éditoriales, difficulté calibrée | Pas d'identité ni de vérité médicale autonome |
| **Mapping cross-Release** | Outil éditorial de continuité | Identité locale Release inchangée |
| **Station ECOS** | **Scénario clinique** `kind=station` — **pas** extension Question | Disjointure I-17 |

**Interdit comme extension :**

- créer une entité **Distracteur**, **Banque QCM**, **Assessment**, **Recall** ;
- transformer la Question en **scénario** par accumulation de segments narratifs ;
- ancrer la persistance SR **uniquement** sur `question_id` sans KP.

---

## 9. Critères de conformité (observables)

Un composant ou un contenu est conforme à ce contrat lorsque :

1. Chaque Question d'évaluation publiée est un **agrégat** avec identité `question_id` locale à la Release.
2. Chaque Question référence **≥ 1 KP** valide et **≥ 2 options** avec tier et explication **chaque**.
3. Aucun énoncé, libellé ou explication porteur de sens médical n'est publié sans **facette de claim groundée**.
4. Le modèle de score **edn_v1** et les tiers PDR-D9 sont **respectés** pour toute Question V1.
5. Aucune Question publiée n'enseigne, ne raconte un cas clinique, ni ne duplique un walkthrough comme contenu principal.
6. Aucune Question publiée active n'est **modifiée silencieusement** — toute évolution passe par cycle de vie §6.
7. Les données apprenant restent **hors** l'objet Question — ancrage `(apprenant, Release, question_id)`.
8. Aucune entité interdite (§2.5, §8) n'est introduite.

---

## Documents connexes

| Document | Rôle |
|---|---|
| [Contrat 08](08-RELEASE-EDITORIAL-ARCHITECTURE.md) | Coexistence des objets dans la Release ; états d'absence |
| [Contrat 09](09-CLINICAL-SCENARIO.md) | Scénario clinique — disjoint de la Question |
| [ADR-006](../adr/ADR-006-pedagogical-patrimony-and-edition-lineage.md) | Patrimoine Release ; ancrage données apprenant |
| [PDR-A3](../governance/PRODUCT-DECISION-REGISTRY.md) | Corpus chapitre ; volumes cibles |
| [PDR-D9](../governance/PRODUCT-DECISION-REGISTRY.md) | Barème EDN V1 |
| [17-PUBLICATION-MODEL.md](../renderer/17-PUBLICATION-MODEL.md) | État publié ; garanties Release |
| [Contrat 04 §7.3](04-CHAPTER-PACKAGE.md) | Projections de maîtrise — Questions au niveau package |

---

## Amendements

| Version | Date | Effet |
|---|---|---|
| **1.0** | 2026-07-31 | Création — modèle conceptuel Question d'évaluation figé |
