# Contrat 08 — Architecture éditoriale de la Release

| | |
|---|---|
| **Type** | Contrat fondamental normatif |
| **Statut** | En vigueur — 2026-07-31 |
| **Question unique** | Qu'est-ce qui rend une Release éditorialement cohérente, complète et publiable ? |
| **Index** | [`00-INDEX.md`](00-INDEX.md) |

Ce contrat définit l'**architecture éditoriale de la Release** — agrégat patrimonial publié identifié par `(chapitre, édition Collège, version de publication)` ([ADR-006](../adr/ADR-006-pedagogical-patrimony-and-edition-lineage.md)). **Release** et **Chapter Package publié** désignent le **même agrégat** — Release = point de vue éditorial ; Chapter Package = matérialisation ([contrat 04](04-CHAPTER-PACKAGE.md) §1.2). Il gouverne la **coexistence**, les **dépendances**, la **complétude**, les **états d'absence**, les **invariants éditoriaux** et les **critères de publication et de qualité** des **quatre familles d'objets publiés** ; jamais l'implémentation, les formats, le manifest, le pipeline ou le Reader.

En cas de conflit avec un document non listé dans les frontières documentaires, les sources consolidées, les ADR et les PDR applicables priment selon [`00-INDEX.md`](00-INDEX.md).

---

## Frontières documentaires

| Contrat / document | Ce qu'il définit — non recopié ici |
|---|---|
| [01 — Trust & Fidelity](01-TRUST-AND-FIDELITY.md) | Fidélité, grounding, classes de claim — **gates techniques** |
| [02 — Identity & Anchors](02-IDENTITY-AND-ANCHORS.md) | KP, élément pédagogique, identités, traçabilité |
| [04 — Chapter Package](04-CHAPTER-PACKAGE.md) | Structure package, cycle de vie, publication technique |
| [05 — Visual Grammar](05-VISUAL-GRAMMAR.md) | **Visuel officiel** — structure et subordination (objet) |
| [07 — Assessment Question](07-ASSESSMENT-QUESTION.md) | **Question d'évaluation** — structure et invariants (objet) |
| [09 — Clinical Scenario](09-CLINICAL-SCENARIO.md) | **Scénario clinique** — structure et invariants (objet) |
| [17-PUBLICATION-MODEL.md](../renderer/17-PUBLICATION-MODEL.md) | État « publié », garanties conceptuelles |
| [PDR-A3](../governance/PRODUCT-DECISION-REGISTRY.md) | Corpus d'évaluation chapitre ; volumes cibles |
| [PDR-A4](../governance/PRODUCT-DECISION-REGISTRY.md) | Texte Collège dans le package — **hors** les quatre familles ci-dessous |

**Ce contrat (08)** définit **exclusivement** comment les objets publiés **s'articulent entre eux** au sein d'une Release. Le détail de chaque objet relève de son contrat propre ou du [contrat 04](04-CHAPTER-PACKAGE.md) §8 (explication), [contrat 05](05-VISUAL-GRAMMAR.md) (visuel), [contrat 07](07-ASSESSMENT-QUESTION.md) (question).

**Terminologie.**

| Terme | Sens dans ce contrat |
|---|---|
| **Release** | Agrégat patrimonial éditorial publié d'un chapitre versionné — **= Chapter Package publié** ([contrat 04](04-CHAPTER-PACKAGE.md) §1.2) |
| **Narratif** | **Convention structurante** de scope des explications — identifiant de projection ([contrat 02](02-IDENTITY-AND-ANCHORS.md) §6) ; **pas** un objet éditorial |
| **Explication publiée** | Bloc d'explication de compréhension : prompt pédagogique + walkthrough + facettes claim ; ancré sur un **élément pédagogique** ; contenu **scoped** par **narratif** |
| **Visuel officiel** | Support graphique publié, subordonné au walkthrough du même élément ([contrat 05](05-VISUAL-GRAMMAR.md)) |
| **Question d'évaluation** | Épreuve QCM scorable ([contrat 07](07-ASSESSMENT-QUESTION.md)) |
| **Scénario clinique** | Épreuve narrative d'application clinique — disjointe de la Question |

**Hors périmètre de ce contrat :** Inventory, Blueprint, Manifest, Pipeline, Reader, données apprenant, Assessment, Mastery, Recall comme entité, Banque QCM, Published Resource.

---

## 1. Les objets publiés

Quatre familles — **aucune autre** entité éditoriale publiée au niveau Release.

### 1.1 Explication publiée

| | |
|---|---|
| **Responsabilité** | **Enseigner** — porter l'explication canonique d'un concept (walkthrough) |
| **Frontière** | Famille **compréhension** ; ne score pas ; ne raconte pas un cas clinique complet |
| **Identité** | **Élément pédagogique**, contenu adressé par `(narratif, élément)` dans la Release |
| **Indépendance** | **Publiable sans** Question, Scénario ni Visuel |
| **Dépendances éditoriales** | KP(s) via facettes claim ; élément pédagogique ; narratif (convention de regroupement) |

### 1.2 Visuel officiel

| | |
|---|---|
| **Responsabilité** | **Soutenir** la compréhension d'un élément déjà enseigné par une explication |
| **Frontière** | Support optionnel ; jamais artefact explicatif primaire ([contrat 05](05-VISUAL-GRAMMAR.md) §1) |
| **Identité** | **`visual_id`** local à la Release |
| **Indépendance** | **Non** — ne se substitue jamais à une explication ; ne porte jamais seul un savoir |
| **Dépendances éditoriales** | Élément pédagogique ; walkthrough du **même** bloc d'explication (subordination) |

### 1.3 Question d'évaluation

| | |
|---|---|
| **Responsabilité** | **Vérifier** — épreuve QCM scorable avec explications par option |
| **Frontière** | Famille **vérification** ; n'enseigne pas ; ne raconte pas un cas |
| **Identité** | **`question_id`** local à la Release ([contrat 07](07-ASSESSMENT-QUESTION.md)) |
| **Indépendance** | **Publiable sans** référence obligatoire à une explication ou un scénario |
| **Dépendances éditoriales** | **≥ 1 KP** obligatoire ; élément pédagogique **optionnel** |

### 1.4 Scénario clinique

| | |
|---|---|
| **Responsabilité** | **Appliquer** — épreuve narrative de raisonnement clinique |
| **Frontière** | Famille **vérification** ; disjoint des Questions ; multi-segments **internes** sans entités filles |
| **Identité** | **`scenario_id`** local à la Release |
| **Indépendance** | **Publiable sans** Question ni explication référencée obligatoirement |
| **Dépendances éditoriales** | **≥ 2 KP** ; élément pédagogique **optionnel** ; `kind` déclaré (standard, trap, synthesis, variant, station) |

---

## 2. Graphe minimal des dépendances

```
                         Release
                            │
         ┌──────────────────┼──────────────────┬─────────────────┐
         │                  │                  │                 │
         ▼                  ▼                  ▼                 ▼
   Explication         Visuel            Question          Scénario
   publiée             officiel          d'évaluation      clinique
         │                  │                  │                 │
         │    subordonné    │                  │                 │
         │◄─────────────────┘                  │                 │
         │                                     │                 │
         ▼                                     ▼                 ▼
   Élément pédagogique ◄─── (optionnel) ──────┴─────────────────┘
         │
         ▼
        KP ◄─────────── (obligatoire Questions ; obligatoire Scénarios)
         │
         ▼
   Ancre source (référence — pas objet publié éditorial)
```

**Absence de arêtes directes :**

- Explication ↔ Question : **aucune dépendance structurelle**
- Explication ↔ Scénario : **aucune dépendance structurelle**
- Question ↔ Scénario : **aucune dépendance structurelle**
- Visuel ↔ Question / Scénario : **aucune dépendance**

Les liens entre familles sont **sémantiques** (KP partagés, renvois optionnels) — **pas compositionnelles**.

---

## 3. Dépendances — obligatoire, recommandé, interdit

### 3.1 Explication publiée

| Cible | Statut | Règle |
|---|---|---|
| **KP** (via claims) | **Obligatoire** | Tout walkthrough groundé référence au moins un KP |
| **Élément pédagogique** | **Obligatoire** | Identité du bloc |
| **Narratif** | **Obligatoire** (convention) | Scope du contenu textuel |
| **Visuel officiel** | **Facultatif** | Peut exister sans visuel |
| **Question d'évaluation** | **Interdit** (dépendance) | Aucune explication ne requiert une Question |
| **Scénario clinique** | **Interdit** (dépendance) | Aucune explication ne requiert un Scénario |

### 3.2 Visuel officiel

| Cible | Statut | Règle |
|---|---|---|
| **Explication publiée** (walkthrough du même élément) | **Obligatoire** pour publication | Subordination : tout KP du visuel est porté par le walkthrough ([contrat 05](05-VISUAL-GRAMMAR.md), [contrat 04](04-CHAPTER-PACKAGE.md) §11) |
| **Élément pédagogique** | **Obligatoire** | Ancrage identitaire |
| **KP** | **Obligatoire** (via visualSpec / grounding) | Traçabilité |
| **Question / Scénario** | **Interdit** (dépendance) | Aucun lien structurel |

**Un visuel publié sans walkthrough valide du même élément : interdit.**

### 3.3 Question d'évaluation

| Cible | Statut | Règle |
|---|---|---|
| **KP** | **Obligatoire** (≥ 1) | [Contrat 07](07-ASSESSMENT-QUESTION.md) I-05 |
| **Explication publiée** | **Facultatif** | Renvoi pédagogique possible ; **jamais prérequis** |
| **Élément pédagogique** | **Facultatif** | Contexte séquentiel uniquement |
| **Scénario clinique** | **Interdit** (dépendance) | Familles disjointes |
| **Visuel officiel** | **Interdit** (dépendance) | Aucun lien structurel |

### 3.4 Scénario clinique

| Cible | Statut | Règle |
|---|---|---|
| **KP** | **Obligatoire** (≥ 2) | Application multi-notions |
| **Explication publiée** | **Facultatif** | Renvoi post-résolution possible ; **jamais prérequis** |
| **Question d'évaluation** | **Interdit** (dépendance) | Familles disjointes |
| **Élément pédagogique** | **Facultatif** | Contexte séquentiel |
| **Visuel officiel** | **Facultatif** | Facette media du scénario — **pas** entité Visuel officiel séparée sauf lien explicite par identité |

### 3.5 Ordre éditorial recommandé (non bloquant)

| Ordre | Règle |
|---|---|
| **Recommandé** | Explications publiées **avant** capitalisation massive Questions / Scénarios |
| **Recommandé** | Visuels **après** walkthrough du même élément |
| **Non requis** | Publication partielle compréhension seule — voir §4 |

L'ordre recommandé est une **discipline de production** — **pas** une dépendance structurelle bloquant la publication.

---

## 4. Complétude d'une Release

### 4.1 Niveaux

| Niveau | Contenu obligatoire | Usage |
|---|---|---|
| **Release minimale publiable** | Identité Release ; édition Collège ; **au moins une explication publiée** validée **ou** déclaration d'absence honnête de toute compréhension avec justification package | Prototypes, tranches qualifiées — **exceptionnel** |
| **Release compréhension** | **Release minimale** + corpus d'**explications publiées** couvrant les éléments pédagogiques retenus du Blueprint **ou** absences **prévues** / **retenues** / **non applicables** déclarées par narratif et par élément | Publication courante Phase compréhension ([contrat 04](04-CHAPTER-PACKAGE.md) §7.3) |
| **Release évaluation** | **Release compréhension** + **Questions d'évaluation** et **Scénarios cliniques** publiés **ou** absences déclarées au niveau chapitre (PDR-A3) | Auto-évaluation chapitre |
| **Release complète** (chapitre entier) | **Release évaluation** + volumes cibles PDR-A3 atteints ou écart **explicitement justifié** ; complémentarité éditoriale (§8) ; **aucune contradiction** interne ; **aucune absence silencieuse** | Golden master ; acceptation Reader V1 ([PDR-B1](../governance/PRODUCT-DECISION-REGISTRY.md)) |

### 4.2 Release complète — critères éditoriaux

Une Release est **éditorialement terminée** lorsque :

1. **Compréhension** — chaque élément pédagogique retenu possède une explication publiée **ou** un état d'absence déclaré (§5).
2. **Vérification** — le corpus Questions + Scénarios couvre le chapitre de manière **complémentaire** (PDR-A3 : ~30/50/70 Questions ; 3–5 Scénarios — **objectifs**, non quotas rigides).
3. **Priorité** — les KP en disposition `deferred-to-mastery` sont **prioritairement** couverts par Questions ou Scénarios **sans** remplacer les explications.
4. **Honnêteté** — tout écart aux objectifs PDR-A3 est **déclaré**, pas masqué.
5. **Cohérence** — aucune contradiction médicale ou pédagogique entre objets publiés (§6).

**Une Release complète n'exige pas** un visuel par élément — visuel **non applicable** est légitime ([contrat 04](04-CHAPTER-PACKAGE.md) §11).

---

## 5. États d'absence

**Référence normative unique** du vocabulaire d'absence éditoriale. Les autres documents **mappent** leurs libellés techniques sur ce tableau — ils **ne redéfinissent pas** ces états.

### 5.0 Table de correspondance

| État éditorial (contrat 08) | [doc 17](../renderer/17-PUBLICATION-MODEL.md) §5.2 | [contrat 04](04-CHAPTER-PACKAGE.md) §11 (visuels) |
|---|---|---|
| **Publié** | Publié | Visuel publié |
| **Prévu** | Absence connue | `planned-not-built` |
| **Retenu** | Retenu | `built-but-withheld` |
| **Non applicable** | — (absence légitime non planifiée) | `none planned` |
| **Absent** | — (à éviter non déclaré) | — |
| **Retiré** | — | Visuel retiré après production |
| **Supprimé** | — (archivage Release entière) | — |
| *(incohérence)* | Manquant ou invalide | Déclaré publié mais introuvable |

Les absences doivent être **explicites**, **localisables** (Release, famille, narratif, élément, ou objet) et **non ambiguës**.

| État | Signification éditoriale | Exemple |
|---|---|---|
| **Publié** | Objet existant, validé, consommable | Walkthrough groundé ; Question avec gates PASS |
| **Absent** | Rien de produit ; **pas encore** de décision de planification | Slot vide sans entrée de registre — **à éviter** en publication ; préférer *prévu* ou *non applicable* |
| **Prévu** | Planifié éditorialement, **non encore produit** | Visuel prévu au Blueprint ; QCM chapitre planifié mais non généré — **absence connue** (doc 17 §5.2) |
| **Retenu** | Produit mais **non publiable** (échec qualité, grounding, fidélité) | Question échouée aux gates ; visuel built-but-withheld |
| **Non applicable** | **Aucune intention** de produire pour ce slot | Élément sans intention visuelle ; narratif hors périmètre chapitre |
| **Retiré** | Était produit ou prévu ; **decision éditoriale** de ne plus publier dans cette Release | Visuel obsolète retiré après échec ; remplacé dans nouvelle Release |
| **Supprimé** | **Hors Release** — objet retiré du patrimoine actif par **archivage** de la Release entière (ADR-006) — **pas** suppression silencieuse d'un objet publié | Release N archivée lors de bascule Release N+1 |

### 5.1 Règles d'honnêteté

| Règle | Énoncé |
|---|---|
| **H-01** | **Absent** non déclaré là où du contenu est **attendu** = violation éditoriale |
| **H-02** | **Prévu** ≠ **Retenu** ≠ **Non applicable** — ne jamais confondre |
| **H-03** | **Retenu** n'invalide pas les objets **adjacents** valides de la même famille ou d'une autre |
| **H-04** | Déclarer **publié** un objet introuvable ou incohérent = **incohérence éditoriale grave** |
| **H-05** | **Publier honnêtement incomplet** vaut mieux que **publier silencieusement incomplet** (doc 17 §5.3) |

### 5.2 Granularité des déclarations

| Objet | Granularité d'absence |
|---|---|
| **Explication** | Par `(narratif, élément)` |
| **Visuel** | Par `(élément)` ou `visual_id` |
| **Question** | Par corpus chapitre ou par slot éditorial — **pas** d'absence silencieuse si évaluation attendue (PDR-A3) |
| **Scénario** | Par corpus chapitre ou par `scenario_id` planifié |
| **Famille entière** | Absence connue « évaluation non produite » légitime pour Release compréhension seule |

---

## 6. Invariants éditoriaux

Invariants **spécifiques à la coexistence** dans une Release — complètent les invariants par objet.

| # | Invariant |
|---|---|
| **R-01** | Une **Question d'évaluation ne remplace jamais** une **Explication publiée**. |
| **R-02** | Un **Visuel officiel ne porte jamais seul** un savoir médical : tout KP visuel est porté par le walkthrough du même élément. |
| **R-03** | Une **Release ne contient jamais** de contenu **contradictoire** entre objets publiés sur un même fait médical. |
| **R-04** | Une **Release n'enseigne jamais uniquement** par Questions ou Scénarios : la famille **compréhension** est **indispensable** à toute Release publiable durable (sauf Release minimale exceptionnelle §4.1). |
| **R-05** | Une **Release peut être publiée** avec des absences **explicitement déclarées** (§5). |
| **R-06** | **Question** et **Scénario** sont **disjoints** — aucun ne contient l'autre. |
| **R-07** | **Aucune entité** Assessment, Mastery, Banque ou Published Resource **n'apparaît** dans le modèle éditorial Release. |
| **R-08** | Les **données apprenant** **n'appartiennent pas** à la Release — ancrage externe (ADR-006). |
| **R-09** | **Comprendre avant vérifier** : ordre de **production** recommandé ; la vérification **complète** sans compréhension publiée correspondante sur les mêmes KP est une **dégradation éditoriale**, pas une interdiction de publication partielle. |
| **R-10** | **Recall** n'est **pas** une famille publiée : toute surface mémorisation est une **présentation de KP**, hors des quatre familles. |
| **R-11** | Le **texte Collège** ([PDR-A4](../governance/PRODUCT-DECISION-REGISTRY.md)) est **référence source** consommée avec la Release — **pas** une cinquième famille d'objets éditoriaux régissant la coexistence des quatre familles. |
| **R-12** | **Aucune modification silencieuse** d'un objet publié dans une Release active — toute évolution produit une **nouvelle Release** ou une bascule explicite (ADR-006). |

---

## 7. Critères de publication éditoriaux

Critères **éditoriaux** — distincts des gates techniques ([contrat 01](01-TRUST-AND-FIDELITY.md)). Une Release **publiable** satisfait **simultanément** :

| # | Critère |
|---|---|
| **P-01** | **Identité** — Release identifiée `(chapitre, édition, version_publication)`. |
| **P-02** | **Cohérence interne** — aucune contradiction entre objets publiés ; références KP et éléments résolues. |
| **P-03** | **Honnêteté des absences** — tout slot attendu est **publié**, **prévu**, **retenu**, **non applicable** ou **retiré** — jamais silencieux (§5). |
| **P-04** | **Fidélité éditoriale** — aucun objet publié n'introduit de fait **non groundé** ou contraire au Collège de l'édition. |
| **P-05** | **Complétude déclarée** — le **niveau** visé (§4) est **explicitement assumé** : compréhension seule, évaluation, ou complète. |
| **P-06** | **Subordination visuelle** — tout visuel publié respecte R-02. |
| **P-07** | **Disjointure évaluation** — Questions et Scénarios respectent leurs contrats objet sans fusion de responsabilités. |
| **P-08** | **Non-substitution** — le corpus Questions + Scénarios **ne se substitue pas** au corpus d'explications pour enseigner le chapitre (R-04). |

**Publication ≠ exhaustivité produit.** Une **Release compréhension** publiable **déclare** l'absence du corpus évaluation (PDR-A3) — **pas** une Release complète.

---

## 8. Critères de qualité d'une Release

Au-delà de la publiabilité — **excellence éditoriale** :

| Dimension | Exigence |
|---|---|
| **Complémentarité** | Explications, Questions et Scénarios **se complètent** — même KP abordé sous angles enseignement / item / application |
| **Absence de redondance** | Pas de doublons massifs (Questions quasi identiques ; walkthrough recopié en QCM) |
| **Progression pédagogique** | Éléments et narratifs ordonnés ; complexité croissante cohérente |
| **Équilibre compréhension / vérification** | Volume Questions ~ PDR-A3 ; Scénarios complémentaires (standard, piège, synthèse) ; compréhension jamais sacrifiée |
| **Couverture** | KPs `deferred-to-mastery` et cœur du chapitre couverts ; écarts assumés |
| **Lisibilité** | Formulations homogènes ; charge cognitive raisonnable par objet |
| **Honnêteté** | Écarts aux objectifs PDR-A3 documentés ; états *retenu* visibles ; pas de fausse exhaustivité |
| **Fidélité** | Une seule autorité médicale — Collège de l'édition ; traçabilité consultable |

---

## 9. Évolutivité

Ce contrat reste valide **sans modification** lorsque :

| Extension | Mécanisme |
|---|---|
| **Plusieurs Collèges** | Release scoped `(chapitre, édition)` — chapitre = borne |
| **Plusieurs éditions** | Coexistence de Releases ; diff inter-Release — hors objet unique |
| **360 chapitres** | Même quatre familles ; mêmes dépendances |
| **ECOS** | Scénario `kind=station` — **pas** nouvelle famille |
| **Nouveaux types de Questions** | Facettes et modèles de score ([contrat 07](07-ASSESSMENT-QUESTION.md) §8) — agrégat inchangé |
| **Nouveaux types de Visuels** | Extensions [contrat 05](05-VISUAL-GRAMMAR.md) — subordination R-02 inchangée |
| **Nouvelles familles de contenu** | **Hors contrat** — exigerait amendement explicite du contrat 08 |

**Point de rupture unique :** introduction d'une **cinquième famille** d'objets publiés — non couverte ici.

---

## 10. Décisions structurantes à figer

| # | Décision |
|---|---|
| **D1** | Une Release articule **exactement quatre familles** publiées : Explication, Visuel, Question, Scénario. |
| **D2** | Les dépendances **obligatoires** sont : KP ← (Explication, Question, Scénario) ; walkthrough ← Visuel publié. |
| **D3** | **Aucune dépendance structurelle** entre Explication, Question et Scénario. |
| **D4** | Quatre **niveaux de complétude** : minimale, compréhension, évaluation, complète — publication possible aux trois premiers si honnête. |
| **D5** | Sept **états d'absence** normalisés : publié, absent, prévu, retenu, non applicable, retiré, supprimé (archivage Release). |
| **D6** | **Comprendre avant vérifier** = discipline éditoriale ; **pas** gate bloquante de publication partielle. |
| **D7** | **Recall** et **Assessment** **absents** du modèle de coexistence. |
| **D8** | **Texte Collège** = référence source (PDR-A4) — **pas** famille de coexistence. |
| **D9** | **Excellence** = complémentarité + honnêteté + couverture — au-delà de la publiabilité minimale. |
| **D10** | Toute évolution d'un objet publié actif = **nouvelle Release** — jamais mutation silencieuse. |

---

## 11. Critères de conformité (observables)

Une Release est conforme à ce contrat lorsque :

1. Ses objets publiés appartiennent **exclusivement** aux quatre familles (§1).
2. Les dépendances **obligatoires, facultatives et interdites** (§3) sont **respectées**.
3. Son **niveau de complétude** (§4) est **déclaré** et **cohérent** avec son contenu réel.
4. Toute absence est **explicitement étiquetée** (§5) — aucune absence silencieuse sur contenu attendu.
5. Les invariants **R-01 à R-12** (§6) tiennent sur l'ensemble des objets co-publiés.
6. Les critères de publication éditoriaux **P-01 à P-08** (§7) sont satisfaits.
7. Aucune entité interdite (§6 R-07) n'est introduite pour organiser la coexistence.

---

## Documents connexes

| Document | Rôle |
|---|---|
| [ADR-006](../adr/ADR-006-pedagogical-patrimony-and-edition-lineage.md) | Patrimoine Release ; archivage |
| [Contrat 04](04-CHAPTER-PACKAGE.md) | Package ; publication technique |
| [Contrat 07](07-ASSESSMENT-QUESTION.md) | Question d'évaluation |
| [17-PUBLICATION-MODEL.md](../renderer/17-PUBLICATION-MODEL.md) | Garanties publication |
| [PDR-A3](../governance/PRODUCT-DECISION-REGISTRY.md) | Corpus évaluation |
| [PDR-B1](../governance/PRODUCT-DECISION-REGISTRY.md) | Acceptation Reader = Release complète |

---

## Amendements

| Version | Date | Effet |
|---|---|---|
| **1.0** | 2026-07-31 | Création — architecture éditoriale Release |
