# Lou Médecine — Architecture de la Fabrique

| | |
|---|---|
| **Type** | Document d'architecture de référence |
| **Version** | 1.0 |
| **Statut** | **Référence conceptuelle — en vigueur** |
| **Phase** | **La Fabrique** |
| **Dernière mise à jour** | 2026-07-28 |
| **Parent** | [README.md](./README.md) |
| **S'appuie sur** | [`17-PUBLICATION-MODEL.md`](./17-PUBLICATION-MODEL.md) |
| **Précède** | [`16-CONTENT-TO-READER-ARCHITECTURE.md`](./16-CONTENT-TO-READER-ARCHITECTURE.md) |
| **Gouverné par** | Contrats fondamentaux 01–06 ([`docs/contracts/`](../contracts/00-INDEX.md)) — ce document **ne les remplace pas** |

Ce document décrit l'**architecture conceptuelle de la Fabrique** Lou Médecine — le système de transformation qui mène du Collège officiel au Chapter Package publié.

Il répond à une seule question :

> **Comment un Collège officiel devient-il un Chapter Package publié ?**

**Périmètre :**

| Ce document (18) | Documents complémentaires |
|---|---|
| Mission, responsabilités, frontières, invariants de fabrication | Doc 17 — ce qu'est une publication |
| Transformations, validations, convergence vers l'état publié | Doc 16 — consommation par le Reader |
| Principes durables de La Fabrique | Contrats 01–06 — obligations normatives |

**Ce document n'est pas :** un pipeline détaillé, un workflow d'implémentation, une spécification CI/CD, une documentation de scripts, une liste d'étapes techniques, ni une architecture logicielle. Il décrit uniquement l'**architecture conceptuelle de la fabrication** d'un chapitre.

En cas de conflit sur une **obligation normative**, les contrats fondamentaux et ADR priment sur ce document.

**Place dans la documentation.** Ce document ouvre véritablement la phase **La Fabrique**. Il s'appuie sur le [doc 17](./17-PUBLICATION-MODEL.md), qui définit *l'objectif* (l'état publié et ses garanties) ; le présent document décrit *le système de transformation* qui y converge. Le [doc 16](./16-CONTENT-TO-READER-ARCHITECTURE.md) décrit l'aval — ce qui se passe une fois la publication établie.

```
Collège officiel
        ↓
═══════════════════════
      LA FABRIQUE
  (transformations +
   validations)
═══════════════════════
        ↓
Chapter Package publié
        ↓
      Reader
```

Schéma purement conceptuel : il ne représente ni les outils, ni les étapes détaillées, ni l'implémentation.

---

## Documents connexes

| Document | Rôle |
|---|---|
| [`17-PUBLICATION-MODEL.md`](./17-PUBLICATION-MODEL.md) | Modèle de publication — objectif de la Fabrique |
| [`19-BUILD-PIPELINE.md`](./19-BUILD-PIPELINE.md) | Pipeline opérationnel — étapes, artefacts, gates |
| [`16-CONTENT-TO-READER-ARCHITECTURE.md`](./16-CONTENT-TO-READER-ARCHITECTURE.md) | Frontière publication ↔ Reader |
| [`03-ACQUISITION-SSOT.md`](../contracts/03-ACQUISITION-SSOT.md) | Interface acquisition amont |
| [`04-CHAPTER-PACKAGE.md`](../contracts/04-CHAPTER-PACKAGE.md) | Structure et cycle de vie du package aval |
| [`01-TRUST-AND-FIDELITY.md`](../contracts/01-TRUST-AND-FIDELITY.md) | Fidélité et validation |

---

# 1. La mission de la Fabrique

## 1.1 Définition

La **Fabrique** est le système chargé de transformer une **source officielle** (Collège) en une **publication conforme** au modèle défini dans le document [17](./17-PUBLICATION-MODEL.md).

Elle est la **seule transformation autorisée** entre l'autorité médicale immuable et le contenu consommable par un Reader.

## 1.2 Ce que la Fabrique produit

| La Fabrique produit… | La Fabrique ne produit pas… |
|---|---|
| Un **Chapter Package publié** | Une interface utilisateur |
| Un état validé, identifié, traçable | Une expérience d'apprentissage |
| Un contrat de consommation pour l'aval | Une décision de navigation ou de parcours |

La Fabrique **converge vers la publication** — elle ne la précède pas conceptuellement : chaque transformation qu'elle opère est orientée vers l'établissement des garanties du modèle de publication.

## 1.3 Ce que la Fabrique n'est pas

La Fabrique n'est pas le Reader, le Renderer, ni la couche apprenante. Elle n'existe pas pour servir une interface — elle existe pour **fabriquer** une publication fiable.

---

# 2. Les grandes responsabilités

La Fabrique se décompose en **familles de responsabilités** conceptuelles. Chacune répond à une question unique ; aucune ne se substitue à une autre.

| Responsabilité | Question | Rôle |
|---|---|---|
| **Acquisition** | *Quelle est la source officielle immuable ?* | Obtenir et qualifier le texte Collège — sans interprétation médicale |
| **Normalisation** | *Comment la source devient-elle une entrée fiable du pipeline ?* | Préparer une représentation stable, éditionnée, ancrable — sans altérer le sens médical |
| **Structuration** | *Qu'est-ce que le Collège contient, et comment l'organise-t-on pour la suite ?* | Produire les représentations curatives canoniques — exhaustivité et plan pédagogique |
| **Dérivation** | *Quelles vues groundées peut-on produire à partir de la structure ?* | Générer le contenu officiel publiable — projections, ressources, graphes de traçabilité |
| **Validation** | *Les garanties de publication sont-elles satisfaites ?* | Vérifier fidélité, cohérence, traçabilité — sans produire de contenu |
| **Publication** | *Le chapitre peut-il être déclaré publié ?* | Établir l'état publié ou retenir — assembler l'index de consommation |

Ces responsabilités sont **ordonnées logiquement** : chaque famille consomme les sorties validées des précédentes. Elles ne sont pas nécessairement linéaires dans l'implémentation — mais elles restent **conceptuellement distinctes**.

---

# 3. Les frontières

## 3.1 Amont — Collège officiel

L'**entrée unique** de la Fabrique est le **Collège officiel** — texte immuable, éditionné, acquis selon la chaîne qualifiée.

**Interdit en amont :** toute seconde source parallèle, toute relecture directe contournant l'acquisition, toute autorité médicale non officielle.

La Fabrique **ne crée pas** la source — elle la **consomme**.

## 3.2 Aval — Chapter Package publié

La **sortie unique** de la Fabrique est un **Chapter Package publié** — état validé conforme au modèle du document [17](./17-PUBLICATION-MODEL.md).

**Interdit en aval :** servir du contenu médical sans passer par cet état ; consommer des sorties intermédiaires non validées ; laisser l'aval reconstruire la vérité médicale.

## 3.3 La Fabrique comme couloir unique

```
        AMONT                    FABRIQUE                    AVAL
  Collège officiel    →    transformations validées    →    Publication
  (autorité immuable)      (seule voie autorisée)         (contrat aval)
```

Tout contenu médical orienté apprenant qui atteint un Reader **a traversé** la Fabrique — ou viole l'architecture.

---

# 4. Les invariants

Toute implémentation de la Fabrique — quelle qu'elle soit — doit respecter les invariants suivants. Ce ne sont pas des choix techniques : ce sont des **conditions d'existence** du système.

| Invariant | Énoncé |
|---|---|
| **Déterminisme** | À entrées identiques, la Fabrique produit un résultat identique et vérifiable |
| **Reproductibilité** | Une publication peut être refaite — la lignée est traçable, le résultat est comparable |
| **Traçabilité** | Tout énoncé médical dérivé est résolvable jusqu'à la source officielle — la chaîne est stockée, jamais recomputée à la volée en aval |
| **Absence de création médicale** | La Fabrique restructure, sélectionne, organise, vérifie — elle n'invente pas de savoir médical autonome |
| **Publication après validation** | Aucun état publié sans établissement préalable des garanties du modèle de publication |
| **Séparation production / consommation** | Rien n'est consommable tant qu'il n'a pas franchi la frontière de publication — voir doc 17 |
| **Immutabilité de la source** | Le Collège acquis n'est jamais réécrit pour des raisons pédagogiques ou de présentation |
| **Indépendance du Reader** | La Fabrique ne dépend pas du Renderer, de l'interface, ni des données apprenantes |

Un invariant violé n'est pas un défaut d'implémentation — c'est une **rupture architecturale**.

---

# 5. Les transformations

## 5.1 Principe général

La Fabrique opère par **transformations successives** : chaque étape convertit une **représentation** en une **autre représentation** — jamais directement en expérience utilisateur.

```
Représentation A  →  [transformation]  →  Représentation B
                              ↓
                        [validation]
                              ↓
                    B autorisée ou rejetée
```

## 5.2 Propriétés d'une transformation

Chaque transformation possède :

| Propriété | Exigence |
|---|---|
| **Responsabilité unique** | Une transformation ne mélange jamais acquisition, structuration, dérivation et validation |
| **Entrées explicites** | Ce qu'elle consomme est identifié — pas d'inférence silencieuse amont |
| **Sorties explicites** | Ce qu'elle produit est identifié — pas de résultat implicite |
| **Jetabilité des dérivés** | Les représentations générées peuvent être régénérées sans perte de vérité curative |

## 5.3 Deux familles de représentations

Sans nommer d'artefacts particuliers, la Fabrique distingue :

| Famille | Nature | Éditabilité |
|---|---|---|
| **Curative** | Décisions de structure médicale et pédagogique — exhaustivité, plan, intentions | Humaine, versionnée, autorité partagée avec le pipeline |
| **Générée** | Vues dérivées, vérifications, index de publication | Jamais éditée à la main — régénérée |

**Invariant structurant :** seules les représentations curatives portent l'autorité de structuration ; tout le reste en dérive.

## 5.4 Interdiction de mélange

Une transformation qui **produit du contenu** et **juge sa validité** dans la même passe mélange dérivation et validation — c'est un défaut de conception.

Une transformation qui **lit la source** pour **inférer de la structure** sans passer par la structuration curative contourne l'autorité canonique.

---

# 6. Les validations

## 6.1 Validation comme responsabilité à part entière

Dans la Fabrique, une transformation **n'est jamais considérée comme terminée** sans validation.

La validation n'est pas un **contrôle technique accessoire** — c'est une **responsabilité conceptuelle** : établir que les garanties requises à ce stade sont satisfaites avant d'autoriser l'étape suivante.

## 6.2 Ce que la validation vérifie

| Domaine | Question posée |
|---|---|
| **Fidélité** | Le contenu produit est-il traçable et cohérent avec la source ? |
| **Exhaustivité** | Rien d'important n'a-t-il été abandonné silencieusement ? |
| **Cohérence interne** | Les références se résolvent-elles ? L'assemblage se contredit-il ? |
| **Complétude de déclaration** | Les absences sont-elles honnêtement déclarées ? |

La validation **ne produit pas** de contenu médical. Elle **émet un verdict** — passage autorisé ou retenue.

## 6.3 Conséquence d'un échec

Un échec de validation **n'invalide pas silencieusement** une publication antérieure sans le déclarer — et **n'autorise pas** une publication partielle non déclarée.

Retenir est une **issue légitime** de la Fabrique. Publier mal est une **violation**.

---

# 7. La publication

## 7.1 Publication comme convergence, pas comme étape

La **publication** n'est pas une étape supplémentaire ajoutée à la fin du pipeline.

C'est la **conséquence logique** d'une chaîne de transformations validées : lorsque toutes les garanties du modèle de publication sont établies, l'état **publié** est atteint.

```
Acquisition → … → Dérivation → Validation finale → ÉTAT PUBLIÉ
```

La Fabrique **converge** vers cet état — elle ne le « déclenche » pas arbitrairement.

## 7.2 Assemblage de l'index

Atteindre l'état publié inclut l'établissement de l'**index de publication** — le point d'entrée unique pour l'aval (voir doc 17, §7).

L'index **déclare** ce qui est publié ; il n'est pas la publication elle-même.

## 7.3 Republication

Une nouvelle exécution de la Fabrique sur le même chapitre produit une **nouvelle publication** — identité de chapitre stable, version identifiable, remplacement explicite de l'état antérieur.

---

# 8. Responsabilités interdites

Les interdictions ci-dessous délimitent le périmètre de la Fabrique — indépendamment de l'implémentation.

## 8.1 La Fabrique ne décide jamais…

| Interdit | Responsabilité légitime |
|---|---|
| De l'expérience Reader | Reader — doc 16 |
| De la navigation, des écrans, de la charge cognitive | Reader — docs 14, 15 |
| Des interactions utilisateur | Spécification fonctionnelle — doc 15 |
| De la couche apprenante | Couche apprenante — contrat 06 |

## 8.2 La Fabrique ne produit jamais…

| Interdit | Raison |
|---|---|
| Directement une interface | Séparation fabrication / consommation |
| De contenu médical non groundé | Fidélité — contrat 01 |
| Une seconde autorité parallèle au Collège | SSOT — contrat 03 |

## 8.3 La Fabrique ne consomme jamais…

| Interdit | Raison |
|---|---|
| Les données apprenantes | Frontière apprenant — contrat 06 |
| Les retours d'expérience Reader comme entrée de génération | Indépendance production / consommation |

## 8.4 La Fabrique ne dépend jamais…

| Interdit | Raison |
|---|---|
| Du Renderer | Indépendance de versioning |
| D'une technologie d'affichage particulière | Remplaçabilité |
| D'une décision produit aval | Autorité amont / aval séparées |

---

# 9. Principes durables

| Principe | Énoncé |
|---|---|
| **Une transformation = une responsabilité** | Pas de mélange acquisition / structuration / dérivation / validation |
| **Une sortie validée = une nouvelle représentation** | Chaque étape autorise la suivante — jamais de saut |
| **La validation fait partie de la fabrication** | Vérifier n'est pas optionnel — c'est une étape à part entière |
| **La publication est l'objectif** | Toute transformation est orientée vers l'état publié |
| **Le Reader est hors périmètre** | La Fabrique s'arrête à la publication — l'aval est une autre responsabilité |
| **La source est sacrée** | Rien en aval ne rivalise avec le Collège officiel |
| **Le curatif prime sur le généré** | Les erreurs se corrigent en amont — jamais en retouche manuelle de sortie |
| **L'implémentation est remplaçable** | Ces principes survivent à tout changement d'outils |

---

# 10. Synthèse

La Fabrique Lou Médecine est le **système de transformation** qui mène du Collège officiel au Chapter Package publié.

Elle se compose de **responsabilités distinctes** — acquisition, normalisation, structuration, dérivation, validation — qui convergent vers un **état publié** conforme au modèle du document [17](./17-PUBLICATION-MODEL.md).

Elle respecte des **invariants** non négociables : déterminisme, traçabilité, absence de création médicale, séparation production / consommation.

Elle **s'arrête** à la frontière de publication. Au-delà, le Reader compose une expérience — voir document [16](./16-CONTENT-TO-READER-ARCHITECTURE.md).

Ce document est la **référence conceptuelle** avant toute conception détaillée du pipeline de build. Les choix d'outils, d'étapes et d'artefacts devront s'y conformer — sans le redéfinir.

---

# Historique des versions

| Version | Date | Changement |
|---|---|---|
| **1.0** | 2026-07-28 | Référence initiale — architecture conceptuelle de La Fabrique |

---

*Référence conceptuelle Lou Médecine — architecture de La Fabrique. Toute évolution substantielle requiert une révision de version explicite.*
