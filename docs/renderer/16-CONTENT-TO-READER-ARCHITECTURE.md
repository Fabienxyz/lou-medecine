# Lou Médecine — De la publication au Reader

| | |
|---|---|
| **Type** | Document d'architecture de référence |
| **Version** | 1.0 |
| **Statut** | **Référence conceptuelle — en vigueur** |
| **Dernière mise à jour** | 2026-07-28 |
| **Parent** | [README.md](./README.md) |
| **Complète** | [`14-LOU-READER-ARCHITECTURE.md`](./14-LOU-READER-ARCHITECTURE.md) · [`15-READER-FUNCTIONAL-SPECIFICATION.md`](./15-READER-FUNCTIONAL-SPECIFICATION.md) |
| **Gouverné par** | Contrats fondamentaux 01–06 ([`docs/contracts/`](../contracts/00-INDEX.md)) — ce document **ne les remplace pas** |

Ce document formalise la **frontière** entre le **Chapter Package publié** et le **Reader v1.0**.

Il répond à une seule question :

> **Comment un Chapter Package publié devient-il une expérience Reader ?**

**Périmètre :**

| Ce document (16) | Documents complémentaires |
|---|---|
| Responsabilités des couches, frontière publication ↔ expérience | Doc 14 — vision pédagogique et principes Reader |
| Identités comme contrat d'intégration | Doc 15 — écrans, interactions, parcours |
| Composition déclarative, interdictions, principes durables | Contrats 04 et 06 — obligations normatives |

**Ce document n'est pas :** un contrat d'implémentation, un ADR, une spécification fonctionnelle, un document pipeline, ni une proposition de refonte. Il décrit des **responsabilités** et des **interactions** — indépendamment de toute technologie ou organisation de fichiers particulière.

En cas de conflit sur une **obligation normative** (fidélité, immutabilité, manifest-only, couche apprenant), les contrats fondamentaux et ADR priment sur ce document.

**Place dans la documentation.** Ce document complète les documents [14](./14-LOU-READER-ARCHITECTURE.md) et [15](./15-READER-FUNCTIONAL-SPECIFICATION.md) : ceux-ci décrivent *ce qu'est* le Reader (vision, principes, écrans, interactions) ; le présent document décrit *comment* le contenu publié devient une expérience Reader — la frontière entre production et expérience.

```
Official College
        ↓
     Pipeline
        ↓
Chapter Package
═══════════════════════
 Frontière de publication
═══════════════════════
        ↓
      Reader
        ↓
     Renderer
        ↓
  Learning Layer
```

Schéma purement conceptuel : il ne représente ni le pipeline interne, ni les artefacts, ni l'implémentation.

---

## Documents connexes

| Document | Rôle |
|---|---|
| [`14-LOU-READER-ARCHITECTURE.md`](./14-LOU-READER-ARCHITECTURE.md) | Vision Reader, trois couches, objectifs cognitifs par onglet |
| [`15-READER-FUNCTIONAL-SPECIFICATION.md`](./15-READER-FUNCTIONAL-SPECIFICATION.md) | Comportements utilisateur détaillés |
| [`17-PUBLICATION-MODEL.md`](./17-PUBLICATION-MODEL.md) | Modèle de publication — La Fabrique |
| [`18-BUILD-ARCHITECTURE.md`](./18-BUILD-ARCHITECTURE.md) | Architecture de La Fabrique |
| [`04-CHAPTER-PACKAGE.md`](../contracts/04-CHAPTER-PACKAGE.md) | Structure et cycle de vie du package |
| [`06-RENDERER-AND-LEARNER-LAYER.md`](../contracts/06-RENDERER-AND-LEARNER-LAYER.md) | Gouvernance renderer et couche apprenant |
| [`02-IDENTITY-AND-ANCHORS.md`](../contracts/02-IDENTITY-AND-ANCHORS.md) | Modèle d'identités et d'ancres |
| [`FINAL_ARCHITECTURE.md`](../../FINAL_ARCHITECTURE.md) | Architecture système — deux curatifs, dérivation |

---

# 1. Le problème architectural identifié

## 1.1 Une coïncidence historique, pas un principe

Au cours du développement du prototype, une **correspondance implicite** s'est installée entre deux granularités qui n'ont aucune raison structurelle de coïncider :

```
Une unité de production publiée  ≈  un onglet affiché
```

Cette équivalence n'a jamais été posée comme principe d'architecture. Elle est apparue parce que le produit, à un stade précoce, **n'avait pas encore d'architecture de l'information propre** : l'interface affichait ce que le pipeline savait produire, dans l'ordre où il le produisait.

Tant que produit et pipeline partageaient la même taxonomie par défaut, la frontière entre « contenu publié » et « expérience utilisateur » restait invisible — et donc non problématique.

## 1.2 Ce que change le Reader v1.0

Le Reader v1.0 possède désormais une **architecture de l'information autonome**, fondée sur des **objectifs cognitifs** — et non sur des types de génération.

Cette autonomie fait disparaître **naturellement** la correspondance implicite : le produit organise l'apprentissage selon ce que l'étudiante doit comprendre à chaque étape ; le pipeline organise la production selon ce qui doit être fidèle, traçable et régénérable.

Les deux découpages obéissent à des forces différentes. Leur alignement initial était une **coïncidence** ; leur divergence future est **normale**.

## 1.3 Le diagnostic correct

La divergence entre onglets Reader et unités de production **n'est pas** un signal de fondations cassées.

C'est le signal qu'il manquait — et qu'il faut désormais expliciter — un **niveau d'indirection** entre :

- ce que le pipeline **publie** (contenu identifié, groundé, immuable) ;
- ce que le Reader **compose** (expérience d'apprentissage, navigation, charge cognitive).

Ce document formalise cette indirection.

---

# 2. Les responsabilités fondamentales

Lou Médecine repose sur **quatre responsabilités** distinctes, chacune répondant à une question unique.

| Couche | Question | Responsabilité |
|---|---|---|
| **Pipeline** | *Que dit le Collège, comment le prouver, comment le structurer ?* | Produire un contenu **fidèle**, **traçable** et **reproductible** |
| **Reader** | *Comment l'étudiante progresse-t-elle dans sa compréhension ?* | Construire une **expérience d'apprentissage** à partir du contenu publié |
| **Renderer** | *Comment le contenu publié s'affiche-t-il ?* | **Présenter** le contenu officiel tel que composé — sans décision pédagogique |
| **Couche apprenante** | *Comment l'étudiante s'approprie-t-elle le contenu ?* | **Personnaliser** l'affichage par des contributions locales — sans modifier l'officiel |

## 2.1 Pourquoi ces responsabilités doivent rester indépendantes

**Indépendance de versioning.** Le lecteur et le pipeline évoluent à des rythmes différents. Une évolution d'interface ne doit pas imposer de re-validation médicale ; une régénération de contenu ne doit pas imposer de refonte produit.

**Indépendance de granularité.** L'unité de production optimale pour le grounding (exhaustivité, traçabilité) n'est pas l'unité de présentation optimale pour l'apprentissage (charge cognitive, objectif par écran). Confondre les deux rend l'une otage de l'autre.

**Indépendance d'autorité.** Chaque couche ne possède qu'une forme d'autorité légitime. Le pipeline détient l'autorité **médicale** ; le Reader détient l'autorité **d'expérience** ; le Renderer n'en détient aucune ; la couche apprenante n'en détient aucune sur le contenu officiel.

**Remplaçabilité.** Un composant remplaçable est un composant dont les obligations sont explicites et dont les entrées sont bornées. Le mélange des responsabilités rend le remplacement coûteux et l'audit impossible.

---

# 3. Le Chapter Package publié

## 3.1 Ce qu'il est

Le **Chapter Package publié** est l'**unique frontière** entre le pipeline métier et la consommation humaine.

Il matérialise l'état **validé** d'un chapitre : ce qui existe, sous quelle identité, avec quelle traçabilité, dans quel état de disponibilité.

Son **index de publication** — le manifest — est le **point d'entrée** autorisé pour toute consommation aval.

## 3.2 Ce qu'il publie

Le package publie des **artefacts identifiés** :

- des **unités de contenu officiel** (explications, claims, visuels publiés) ;
- des **identités stables** (points de connaissance, éléments pédagogiques, blocs de claim) ;
- des **liens déclarés** entre ces identités (traçabilité, explication ↔ visuel) ;
- des **états de disponibilité** (publié, absent connu, retenu) ;
- des **métadonnées de provenance** (édition, tampons de génération).

Chaque artefact publié porte ou référence des **identités** — jamais une position ordinale comme autorité.

## 3.3 Ce qu'il ne décide jamais

Le Chapter Package **ne possède pas** l'autorité d'expérience. Il ne décide jamais :

- de la **navigation** (ordre des écrans, fil d'Ariane, onglets) ;
- de l'**organisation des écrans** (regroupements, découpage par écran) ;
- de la **charge cognitive** (densité, progressivité, une idée par écran) ;
- de l'**expérience utilisateur** (labels produit, parcours, affordances).

Tout vocabulaire de **présentation** qui remonterait dans le package créerait une seconde autorité produit — non versionnée, non auditable, couplée à la production médicale.

Le package répond à la question *« qu'est-ce qui est publié, identifié et vérifiable ? »* — pas *« comment l'étudiante le parcourt ? »*

---

# 4. Le Reader

## 4.1 Au-delà du consommateur passif

Le Reader **n'est pas** un simple consommateur linéaire d'unités de production.

Il est une **couche de composition** : il construit une expérience pédagogique à partir d'artefacts publiés, selon une architecture de l'information qui lui est propre.

Cette composition peut :

- **combiner** plusieurs artefacts publiés pour un même écran ;
- **présenter différemment** le même contenu identifié (regroupement, ordre, mise en forme) ;
- **adresser** des identités stables indépendamment de l'organisation des artefacts sources ;
- **signaler** honnêtement les absences déclarées par le package.

## 4.2 Ce que le Reader ne crée jamais

La composition n'est **pas** la création. Le Reader ne crée jamais :

- de **nouveau contenu** médical ;
- de **nouveaux faits** ;
- de **nouvelles connaissances** ;
- de **nouvelles identités** médicales.

Tout énoncé visible dans le Reader provient du contenu officiel publié ou est explicitement identifié comme contribution apprenante ou contenu généré auxiliaire (hors périmètre du package — voir doc 15).

Si un fait n'existe pas dans le package publié, le Reader **ne l'invente pas** — il signale l'absence ou s'abstient.

## 4.3 Relation avec les autres couches

```
Chapter Package publié
        ↓  (identités, contenu, états)
     Reader          ← composition, navigation, objectifs cognitifs
        ↓  (vue de lecture déclarée)
     Renderer         ← affichage, immutabilité, traçabilité consultative
        ↑
Couche apprenante    ← overlays locaux, jamais fusionnés à l'officiel
```

Le Reader **orchestre** ; la **composition** traduit le publié en vues cognitives ; le Renderer **exécute** la présentation à partir du **Reading View Model** ; la couche apprenante **superpose**.

Contrat normatif composant : [`COMPOSITION-COMPONENT-CONTRACT.md`](../contracts/components/COMPOSITION-COMPONENT-CONTRACT.md).

## 4.4 Objets de la couche de composition

| Objet | Rôle |
|---|---|
| **Composition Specification** | Donnée versionnée, propriété Reader — déclare vues, libellés, ordre d'affichage, sources, agrégation, politique d'absence |
| **Composition Engine** | Exécute `compose(manifest, spec)` — fonction déterministe, testable sans navigateur |
| **Reading View Model** | Résultat calculé sans autorité — interface logique Reader → Renderer ; normalement non persisté |

```
Composition Specification  +  Manifest publié
              ↓
       Composition Engine
              ↓
       Reading View Model
              ↓
          Renderer
```

---

# 5. Les identités — contrat d'intégration

## 5.1 Principe central

Les **identités** constituent le **contrat d'intégration** entre le Chapter Package et le Reader.

| Règle | Énoncé |
|---|---|
| **Adressage par identité** | Le Reader adresse le contenu par **identifiant stable** — jamais par fichier, chemin ou position |
| **Stabilité** | Les identités survivent à la réorganisation des artefacts, à la refonte des projections, à l'évolution du Reader |
| **Partage** | Pipeline, package, Reader et couche apprenante partagent le **même vocabulaire d'identités** — aucun espace d'identifiants parallèle |
| **Ancrage apprenant** | Les contributions personnelles s'ancrent sur des identités **déjà définies** par le package — jamais sur des identités inventées à l'affichage |

## 5.2 Ce que les identités relient

Les identités relient des **responsabilités**, pas des **fichiers** :

- un **point de connaissance** relie le Collège à l'inventaire ;
- un **élément pédagogique** relie le Blueprint au contenu publié ;
- un **bloc de claim** relie l'explication affichée à la source ;
- un **visuel officiel** relie une figure à un élément pédagogique.

Le Reader compose des **vues** en assemblant des identités. Les artefacts qui portent ces identités peuvent être fusionnés, scindés ou réorganisés sans rompre le contrat — tant que les identités et leur traçabilité restent résolues.

## 5.3 Conséquence architecturale

Si l'unité de vérité est l'**identité**, alors :

- redécouper une unité de production est un **non-événement** pour la fidélité ;
- recomposer des identités en vues Reader est un **non-événement** pour le grounding ;
- faire évoluer l'expérience sans régénérer le contenu devient **architecturalement légitime**.

---

# 6. Le principe de composition

## 6.1 Pourquoi la composition appartient au Reader

La composition appartient au Reader parce que seul le produit connaît :

- l'**objectif cognitif** de chaque écran ;
- la **progression** souhaitée (comprendre avant mémoriser) ;
- la **charge cognitive** acceptable ;
- la **séparation** entre contenu officiel, contenu auxiliaire et contributions personnelles.

Ces décisions relèvent de l'**expérience d'apprentissage** — domaine du Reader, jamais du pipeline.

## 6.2 La contrainte essentielle : composition déclarative

Le Reader ne doit **jamais** devenir une nouvelle **autorité pédagogique**.

| Exigence | Énoncé |
|---|---|
| **Déclaratif** | Les règles de composition (quel écran assemble quelles identités, dans quel ordre) sont des **données versionnées** — pas une logique métier cachée dans le code |
| **Sans création** | La composition **assemble** ; elle ne **génère** ni ne **reformule** |
| **Auditable** | Un observateur externe peut lire la règle de composition et prédire ce qui s'affichera — sans lire le code du Renderer |
| **Remplaçable** | Changer de Reader ou de Renderer ne change pas le contenu publié ; changer la composition ne change pas le grounding |

**Composition déclarative** signifie : le Reader est un **exécutant** de règles de vue — pas un **auteur** de structure médicale.

Si les règles de composition vivent uniquement dans le code, le Reader devient une seconde source de vérité pédagogique — non versionnée, non auditable, et le Renderer cesse d'être remplaçable.

**Norme composant :** [`COMPOSITION-COMPONENT-CONTRACT.md`](../contracts/components/COMPOSITION-COMPONENT-CONTRACT.md) — obligations durables, critères d'acceptation, interdits architecturaux.

## 6.3 Frontière étanche dans les deux sens

```
        AMONT                              AVAL
  (pipeline / package)              (Reader / Renderer)

  ✓ identités                        ✓ vues de lecture
  ✓ contenu groundé                  ✓ navigation
  ✓ traçabilité                      ✓ charge cognitive
  ✓ états de disponibilité           ✓ labels produit

  ✗ labels produit                   ✗ faits médicaux
  ✗ ordre d'affichage                ✗ identités nouvelles
  ✗ notion d'onglet                  ✗ reformulation
  ✗ charge cognitive                 ✗ paraphrase
```

Aucun vocabulaire de présentation ne remonte en amont du point de publication. Aucune sémantique médicale ne descend en aval du contenu publié.

---

# 7. Responsabilités explicitement interdites

Les interdictions ci-dessous sont **permanentes**. Elles protègent la séparation des responsabilités — indépendamment de l'implémentation.

## 7.1 Pipeline et Chapter Package

| Interdit | Raison |
|---|---|
| Décider de l'interface ou de la navigation | Autorité d'expérience — Reader |
| Fixer la charge cognitive ou l'organisation des écrans | Autorité d'expérience — Reader |
| Porter du vocabulaire produit (labels d'onglets, parcours) | Couplage présentation ↔ production |
| Créer une seconde autorité médicale parallèle au Collège | Fidélité — contrat 01 |

## 7.2 Reader

| Interdit | Raison |
|---|---|
| Créer du contenu médical | Autorité médicale — pipeline |
| Reformuler ou paraphraser le contenu officiel | Immutabilité — contrat 06 |
| Inventer des identités médicales | Identité — contrat 02 |
| Lire directement les curatifs ou la source pour en inférer du sens | Manifest-only — contrat 06 |
| Fusionner contenu officiel et données apprenantes en persistance | Séparation des cycles de vie |

## 7.3 Renderer

| Interdit | Raison |
|---|---|
| Prendre des décisions pédagogiques | Autorité d'expérience — Reader |
| Reconstruire la connaissance médicale | Autorité médicale — pipeline |
| Modifier le contenu officiel | Immutabilité — contrat 06 |
| Lier un visuel à un bloc par position ordinale | Identité — contrat 02, 05 |

## 7.4 Grammaire visuelle et moteur de rendu graphique

| Interdit | Raison |
|---|---|
| Décider de la pédagogie ou de l'ordre d'apprentissage | Autorité pédagogique — Blueprint |
| Remplacer le walkthrough comme explication canonique | Subordination visuelle — contrat 05 |
| Porter seul un savoir absent du walkthrough du même bloc | Fidélité — contrat 01, 05 |

## 7.5 Couche apprenante

| Interdit | Raison |
|---|---|
| Modifier le contenu officiel publié | Immutabilité — contrat 06 |
| Devenir une entrée du pipeline (génération, grounding, packaging) | Frontière apprenant — contrat 06 |
| Créer des identités médicales | Identité — contrat 02 |

## 7.6 Principe transversal

> **Le contenu médical ne dépend jamais du Reader.**

La validité, la fidélité et la traçabilité d'un chapitre sont établies **avant** et **indépendamment** de toute décision d'expérience. Le Reader consomme un état déjà validé ; il ne le certifie pas.

---

# 8. Principes architecturaux durables

Ces principes restent valides quelle que soit l'évolution future du pipeline, du Reader ou du Renderer.

| Principe | Énoncé |
|---|---|
| **Une responsabilité = une couche** | Chaque couche répond à une question unique ; le mélange des responsabilités est un défaut d'architecture |
| **Une connaissance = une identité** | Tout fait, élément ou claim addressable porte un identifiant stable — jamais une position |
| **Une identité = un contrat** | Le vocabulaire d'identités est l'interface d'intégration entre production et expérience |
| **Une vue n'est jamais une vérité** | Les unités de production et les écrans Reader sont des vues — jetables, recomposables, indépendantes |
| **Contenu ⊥ présentation** | Le contenu officiel est indépendant de la manière dont il est présenté |
| **Présentation ⊥ implémentation graphique** | L'expérience Reader est indépendante du moteur d'affichage (Renderer, technologie) |
| **Évolution permise, immutabilité préservée** | Le Reader, le Renderer et le pipeline peuvent évoluer séparément ; le contenu officiel publié reste immuable pour l'apprenant |
| **Composition déclarative, jamais implicite** | L'assemblage contenu → expérience est explicite, versionné et auditable |
| **Publication = frontière** | Rien n'est consommé en aval sans passer par l'état publié et validé du package |

---

# 9. Synthèse

Le Reader v1.0 **ne remet pas en cause** les fondations du pipeline.

La chaîne **Collège → exhaustivité → structure pédagogique → contenu groundé → publication** reste conceptuellement juste. Chaque étape répond à une question que nulle autre ne peut prendre en charge.

Ce que le Reader introduit, c'est une **couche de composition** entre la publication et l'expérience — rendue nécessaire dès que le produit possède sa propre architecture de l'information.

La correction architecturale n'est pas une refonte des fondations. C'est l'**explicitation d'une frontière** :

```
Pipeline          →  produit du contenu identifié, fidèle, publié
Chapter Package   →  index de ce contenu — sans autorité d'expérience
Reader            →  compose l'expérience — sans autorité médicale
Renderer          →  affiche — sans décision pédagogique
Couche apprenante →  personnalise — sans modifier l'officiel
```

Toute évolution future — du pipeline, des unités de production, des onglets Reader, du Renderer — doit respecter cette frontière pour rester compatible avec les invariants du projet.

---

# Historique des versions

| Version | Date | Changement |
|---|---|---|
| **1.0** | 2026-07-28 | Référence initiale — frontière publication ↔ Reader, identités, composition déclarative |

---

*Référence conceptuelle Lou Médecine — de la publication au Reader. Toute évolution substantielle requiert une révision de version explicite.*
