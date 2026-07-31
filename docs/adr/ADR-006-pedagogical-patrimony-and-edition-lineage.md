# ADR-006 — Patrimoine pédagogique et lignée éditoriale

## Statut

**Accepted**

## Date

2026-07-30

---

## Contexte

L'audit système du projet a révélé un principe de gouvernance plus large que les garanties déjà actées par les ADR existants.

Les ADR antérieurs couvrent des domaines distincts et complémentaires :

| ADR | Domaine acté |
|---|---|
| **ADR-001** | Gel du catalogue sémantique des primitives visuelles |
| **ADR-002** | Architecture Renderer V2 ; immutabilité du contenu officiel *à l'affichage* |
| **ADR-003** | Single Source of Truth des **sources** officielles en entrée (FIL B) |
| **ADR-004** | Gel de l'architecture d'**acquisition** (Tool 01/02) |
| **ADR-005** | Modèle d'**ancrage** des annotations apprenant (CaretAnchor) |

Aucun de ces ADR ne formalise toutefois :

1. le **caractère patrimonial** des Chapter Packages **publiés** — distincts des sources de production ;
2. le fait qu'une **régénération** par La Fabrique produit un **nouvel objet**, même médicalement équivalent ;
3. l'obligation d'**ancrer les données d'apprentissage de l'apprenant** à une **version précise** d'un package publié ;
4. la **conservation** et la **comparaison** des éditions successives du Collège pour un même chapitre ;
5. la protection des **trois patrimoines** comme ensemble cohérent : sources de production, packages publiés, données d'apprentissage.

ADR-005 mentionne que la restauration des notes caret peut échouer après régénération majeure du walkthrough. ADR-006 **généralise et structure** cette constatation : ce n'est pas un cas limite d'ancrage, c'est une **conséquence architecturale** de l'identité propre des packages publiés.

Le registre informatif [`PRODUCT-DECISION-REGISTRY.md`](../governance/PRODUCT-DECISION-REGISTRY.md) consigne l'ensemble des arbitrages produit issus de l'audit. Le présent ADR ne reprend que les **invariants architecturaux** transversaux qui en découlent.

Dans le contexte actuel du projet, Lou en est la première utilisatrice ; les invariants ci-dessous s'appliquent néanmoins au système dans son ensemble.

---

## Problème

Comment gouverner la **préservation** et l'**identité** des artefacts pédagogiques sur tout le cycle de vie — de la production à l'étude par l'apprenant — sans :

- traiter un Chapter Package publié comme un cache régénérable à volonté ;
- perdre silencieusement le travail d'apprentissage lors d'une mise à jour éditoriale ou d'une évolution de La Fabrique ;
- confondre les **sources de production** (reconstruisibles), les **packages publiés** (référence d'étude) et les **données d'apprentissage** (non reproductibles).

---

## Décision

### 1. Trois patrimoines distincts

Le système Lou Médecine reconnaît **trois catégories de patrimoine pédagogique**, chacune soumise à des règles de préservation propres mais **cohérentes entre elles** :

| Patrimoine | Nature | Reproductibilité | Rôle |
|---|---|---|---|
| **Sources de production** | Collège acquis, inventory, blueprint, artefacts curatifs, configurations Fabrique | Reconstruisibles par La Fabrique (avec coût) | Alimentent la fabrication |
| **Chapter Packages publiés** | Artefacts validés par les gates et **publiés** pour consommation | Régénérables en *nouvelle version*, jamais « identiques par défaut » | Référence d'étude et de traçabilité |
| **Données d'apprentissage** | Annotations, notes, surlignages, historique QCM, reprise de session, préférences, marqueurs de progression | **Non reproductibles** depuis les sources | Travail personnel de l'apprenant |

> **Principe central.** Les trois patrimoines possèdent des **cycles de vie distincts** et ne doivent **jamais être confondus**.

> **Règle.** Aucune évolution logicielle, documentaire ou éditoriale ne doit entraîner la **perte silencieuse** d'un élément de l'un de ces trois patrimoines.

### 2. Identité propre des Chapter Packages publiés

Un Chapter Package **publié** possède une **identité propre**, distincte de ses sources de production.

| Propriété | Règle |
|---|---|
| **Identité** | Chaque publication possède une identité stable `(chapter, edition, publication_version)` — **Release** (point de vue éditorial) = **Chapter Package publié** (matérialisation) ; détail : [contrat 04](../contracts/04-CHAPTER-PACKAGE.md) §1.2, [contrat 08](../contracts/08-RELEASE-EDITORIAL-ARCHITECTURE.md) |
| **Régénération** | Une nouvelle exécution de La Fabrique produit un **nouveau candidat** ; ce n'est pas le même objet que le package précédemment publié, même si médicalement équivalent |
| **Écrasement** | Aucun package **publié et actif** ne peut être remplacé ou supprimé **silencieusement** par un build incomplet, échoué ou non validé |
| **Patrimoine** | Un package publié validé fait partie du **patrimoine pédagogique du projet** et doit être **conservé** (archivage, pas suppression par défaut) |

Cette règle **complète** ADR-003 : ADR-003 garantit l'unicité des **sources** en entrée ; ADR-006 garantit l'**identité et la conservation** des **sorties publiées**.

### 3. Ancrage des données d'apprentissage à une version de package

Les données d'apprentissage de l'apprenant sont **structurellement liées** à la **version précise** du Chapter Package sur laquelle elles ont été créées.

| Règle | Contenu |
|---|---|
| **Clé d'appartenance** | Toute donnée apprenante référence `(chapter, edition, publication_version)` — ou empreinte équivalente du manifest publié ; détail des cibles (KP, `question_id`, `scenario_id`, élément) : [contrat 02](../contracts/02-IDENTITY-AND-ANCHORS.md) §11.1 |
| **Changement d'édition** | Une nouvelle édition ou une nouvelle publication produit un **nouveau package** ; les données existantes restent attachées à l'ancienne version |
| **Orphelins** | Si le contenu ne peut plus être résolu, la donnée est **signalée**, jamais supprimée silencieusement (cohérent ADR-005) |
| **Sync future** | Les identifiants et schémas de persistance doivent être **compatibles** avec une synchronisation multi-appareils ultérieure — sans imposer de technologie ici |

ADR-005 décide **comment** ancrer une note dans le texte (CaretAnchor). ADR-006 décide **à quel package publié** toutes les données d'apprentissage appartiennent.

### 4. Lignée éditoriale

Le système doit supporter la **coexistence** de plusieurs éditions d'un même chapitre et la **comparaison** entre elles.

| Règle | Contenu |
|---|---|
| **Conservation** | Les packages publiés des éditions antérieures sont **conservés** lorsqu'une nouvelle édition est publiée |
| **Diff éditorial** | La Fabrique est responsable de produire un **artefact de comparaison** fiable entre deux éditions d'un même chapitre — schéma détaillé hors ADR (contrats 04, doc 17, doc 19) |
| **Consommation** | Le Reader **consomme** cet artefact ; il ne calcule pas le diff à la volée à partir de sources non publiées |

Cette règle **n'ouvre pas** l'acquisition (ADR-004 reste gelée) : elle gouverne la **publication**, la **conservation** et la **consommation** des packages multi-éditions.

### 5. Implications Fabrique (invariants)

| Invariant | Énoncé |
|---|---|
| **Publication atomique** | Un package n'est **actif** pour le Reader qu'après validation intégrale des gates et bascule explicite |
| **Candidat vs actif** | Un build échoué ou incomplet ne remplace jamais un package actif |
| **Archivage** | L'action normale sur retrait est **archiver**, pas supprimer — détail opérationnel hors ADR |
| **Traçabilité** | Les opérations de publication, archivage et bascule laissent une trace auditable — détail hors ADR |
| **Sources ≠ publié** | La Fabrique peut **reconstruire** depuis les sources ; le contenu pédagogique étudié provient du **publié** |

### 6. Implications Reader (invariants)

| Invariant | Énoncé |
|---|---|
| **Contenu pédagogique** | Le contenu pédagogique étudié par le Reader provient **exclusivement** de Chapter Packages **publiés** — cohérent ADR-002 §3 |
| **Bibliothèque** | Les packages installés forment une bibliothèque locale **versionnée** — détail hors ADR |
| **Offline** | L'étude hors ligne porte sur des packages **installés**, pas sur une régénération distante |
| **Préservation des données** | Les données d'apprentissage doivent pouvoir être **sauvegardées et restaurées sans perte** |
| **Migrations** | Aucune migration de schéma de persistance ne supprime silencieusement des données apprenantes |

Le présent ADR **ne spécifie pas** les onglets, la UX, la recherche, les thèmes ou les mécanismes de sync — voir registre produit et docs 14–15.

### 7. Rapport avec la régénération et la fidélité médicale

| Situation | Conséquence |
|---|---|
| Nouvelle exécution Fabrique sur mêmes sources | Produit un **nouveau** package candidat ; fidélité médicale vérifiable indépendamment |
| Package médicalement équivalent, structurellement différent | **Nouvelle identité** ; données d'apprentissage de l'ancienne version restent sur l'ancienne version |
| Mise à jour prompts / modèles LLM | Ne justifie pas l'écrasement silencieux d'un package publié |

La **fidélité au Collège** (contrat 01) s'applique à **chaque** publication. La **conservation du patrimoine** (ADR-006) s'applique **entre** publications.

---

## Alternatives rejetées

### Traiter le package publié comme un cache régénérable

**Rejetée.** Les sources de production sont reconstruisibles ; le package publié est la **référence d'étude** de l'apprenant. Confondre les deux provoque des orphelins silencieux et détruit la traçabilité du travail d'apprentissage.

### Écrasement in-place à chaque rebuild réussi

**Rejetée.** Violerait la conservation du patrimoine et empêcherait la comparaison éditoriale. Seule une **bascule atomique** explicite est admise.

### Ancrer les données d'apprentissage au slug chapitre seul

**Rejetée.** Insuffisant dès qu'une nouvelle édition ou une republication modifie le contenu. Les données doivent référencer une **version publiée**.

### Calcul du diff éditorial côté Reader

**Rejetée.** Le diff est un **artefact de publication** produit par La Fabrique, consommé par le Reader — cohérent avec le principe que le contenu pédagogique provient du publié.

### Regrouper les trois patrimoines sous ADR-003 (SSOT)

**Rejetée.** ADR-003 porte sur l'**unicité des sources en entrée**. Les packages publiés et les données d'apprentissage ont des cycles de vie et des règles de conservation **distincts**.

---

## Cohérence avec les ADR existants

| ADR | Relation avec ADR-006 |
|---|---|
| **001** | **Indépendant** — les visuels officiels publiés dans un package patrimonial respectent le catalogue gelé |
| **002** | **Complété** — §3 immutabilité à l'affichage ; ADR-006 étend au patrimoine des packages publiés et des données d'apprentissage |
| **003** | **Complété** — SSOT *sources* vs patrimoine *publié* ; pas de contradiction |
| **004** | **Complété** — acquisition gelée en entrée ; ADR-006 gouverne la sortie publiée multi-éditions |
| **005** | **Complété** — CaretAnchor + obligation de version package ; dégradation honnête renforcée |

**Aucun ADR 001–005 n'est superseded** par ADR-006.

---

## ADR supersedés / amendés

| Document | Effet |
|---|---|
| ADR-001 à ADR-005 | **Aucun supersession** — complétés où indiqué ci-dessus |
| Contrats 02, 04, 06 | **Amendement requis** — détail hors présent ADR |
| Docs 17, 18 | **Amendement requis** — modèle de publication et lignée |

---

## Conséquences

### Positives

- Gouvernance explicite du cycle de vie **publication → étude → mise à jour éditoriale**
- Protection du travail de l'apprenant contre les évolutions de La Fabrique
- Fondation architecturale pour la comparaison entre éditions successives
- Clarification sources / publié / données d'apprentissage

### Coûts / contraintes

- Stockage de multiples versions de packages par chapitre
- Identité de version obligatoire dans manifest et persistance apprenante
- Amendements contractuels et évolution du modèle de publication
- Sauvegarde, restauration et migrations sans perte à concevoir

### Neutres

- La technologie de sync multi-appareils reste **non tranchée** — seule l'exigence **sync-ready** est actée
- Le détail des artefacts (QCM, diff, texte source) relève des contrats, pas de cet ADR

---

## Documents connexes

| Document | Rôle |
|---|---|
| [`PRODUCT-DECISION-REGISTRY.md`](../governance/PRODUCT-DECISION-REGISTRY.md) | Arbitrages produit audit — informatif |
| [`ADR-003-single-source-of-truth.md`](ADR-003-single-source-of-truth.md) | SSOT sources en entrée |
| [`ADR-004-acquisition-architecture-frozen.md`](ADR-004-acquisition-architecture-frozen.md) | Gel acquisition |
| [`ADR-005-learner-layer-annotation-anchoring.md`](ADR-005-learner-layer-annotation-anchoring.md) | Ancrage CaretAnchor |
| [`docs/contracts/04-CHAPTER-PACKAGE.md`](../contracts/04-CHAPTER-PACKAGE.md) | À amender |
| [`docs/contracts/06-RENDERER-AND-LEARNER-LAYER.md`](../contracts/06-RENDERER-AND-LEARNER-LAYER.md) | À amender |
| [`docs/renderer/17-PUBLICATION-MODEL.md`](../renderer/17-PUBLICATION-MODEL.md) | À amender |

---

## Critères de conformité (observables)

Un composant est conforme à ADR-006 lorsque :

1. Les trois patrimoines (sources de production, Chapter Packages publiés, données d'apprentissage) sont traités comme distincts et ne sont jamais confondus dans le cycle de vie, le stockage ou la persistance.
2. Aucun package publié actif n'est remplacé sans bascule explicite et conservation de la version précédente.
3. Toute donnée apprenante persistante référence une version identifiée du package publié.
4. Aucune migration de schéma ne supprime silencieusement des données d'apprentissage ou des packages archivés.
5. Une nouvelle édition produit un nouveau package distinct, pas un écrasement de l'édition antérieure.
6. Le contenu pédagogique affiché par le Reader provient de packages publiés installés, sans régénération à la volée.
