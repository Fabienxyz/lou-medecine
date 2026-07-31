# Contrat 04 — Chapter Package

| | |
|---|---|
| **Type** | Contrat fondamental normatif |
| **Statut** | Phase 0A — en vigueur |
| **Question unique** | Comment un chapitre Lou Médecine est-il construit, organisé et publié ? |
| **Index** | [`00-INDEX.md`](00-INDEX.md) |

Ce contrat consolide les invariants du **Chapter Package** — unité métier et **unique unité de publication** d'un chapitre. Il décrit la **structure**, les **relations** et le **cycle de vie** des artefacts ; jamais l'implémentation d'un outil de build ou d'un lecteur.

En cas de conflit avec un document non listé dans les sources consolidées, les sources consolidées et les ADR de gouvernance priment selon [`00-INDEX.md`](00-INDEX.md).

---

## Frontières documentaires

| Contrat | Ce qu'il définit — non recopié ici |
|---|---|
| [01 — Trust & Fidelity](01-TRUST-AND-FIDELITY.md) | Confiance, classes de claim, grounding, réconciliation, fallback, **critères de fidélité** bloquant la publication |
| [02 — Identity & Anchors](02-IDENTITY-AND-ANCHORS.md) | Identités, ancres source, chaîne de traçabilité, continuité entre éditions |
| [03 — Acquisition SSOT](03-ACQUISITION-SSOT.md) | Texte officiel segmenté, édition, provenance acquisition, index structurel |
| [05 — Visual Grammar](05-VISUAL-GRAMMAR.md) | Sémantique visuelle, visualSpec, moteur de rendu graphique (build) — détail : [`VISUAL_GRAMMAR_CONTRACT.md`](../../VISUAL_GRAMMAR_CONTRACT.md) |
| [06 — Renderer & Learner Layer](06-RENDERER-AND-LEARNER-LAYER.md) | Consommation du manifest ; expérience apprenant |

**Ce contrat (04)** définit les **objets métier** du chapitre, leurs relations, les **obligations de build** et les **conditions de publication** au niveau package. L'**architecture éditoriale de coexistence** des objets publiés relève du [contrat 08](08-RELEASE-EDITORIAL-ARCHITECTURE.md). Les **Questions d'évaluation** et **Scénarios cliniques** relèvent des [contrats 07](07-ASSESSMENT-QUESTION.md) et [09](09-CLINICAL-SCENARIO.md).

| Contrat | Ce qu'il définit — non recopié ici |
|---|---|
| [07 — Assessment Question](07-ASSESSMENT-QUESTION.md) | Question d'évaluation — structure et invariants |
| [08 — Release Editorial Architecture](08-RELEASE-EDITORIAL-ARCHITECTURE.md) | Coexistence des objets publiés ; états d'absence (référence normative) |
| [09 — Clinical Scenario](09-CLINICAL-SCENARIO.md) | Scénario clinique — structure et invariants |

---

## 1. Définition du Chapter Package

### 1.1 Unité de publication

Un **Chapter Package** est l'ensemble cohérent d'artefacts représentant **un chapitre** identifié ([contrat 02](02-IDENTITY-AND-ANCHORS.md)) pour une **édition d'acquisition qualifiée** ([contrat 03](03-ACQUISITION-SSOT.md)). C'est l'**unique unité de publication** du chapitre et l'**unique frontière** entre pipeline métier et consommation ([contrat 06](06-RENDERER-AND-LEARNER-LAYER.md)) — conditions de **publication** : §14.

### 1.2 Release et Chapter Package — même agrégat

| Terme | Point de vue | Énoncé |
|---|---|---|
| **Release** | **Éditorial** — contenu publié, coexistence des objets, complétude, absences ([contrat 08](08-RELEASE-EDITORIAL-ARCHITECTURE.md), [ADR-006](../adr/ADR-006-pedagogical-patrimony-and-edition-lineage.md)) | Identité `(chapitre, édition Collège, version de publication)` |
| **Chapter Package** | **Matérialisation** — artefacts, manifest, sidecars, cycle de build et de publication (ce contrat) | **Même agrégat patrimonial** que la Release lorsqu'il est **publié** |

**Règle.** *Release* et *Chapter Package publié* **désignent le même patrimoine** : la Release en est la **lecture éditoriale** ; le Chapter Package en est la **frontière technique et documentaire**. Aucun objet éditorial publié (explication, visuel, Question, Scénario) n'existe **hors** cet agrégat.

### 1.3 Réponse directrice

Un chapitre Lou Médecine comprend :

1. une **entrée source** officielle (acquisition) ;
2. **deux structures curatées canoniques** — inventaire et Blueprint ;
3. des **projections générées** et un **registre** qui les déclare ;
4. des **artefacts de build** (vérifications, traçabilité, figures éventuelles) ;
5. un **manifest** généré — point d'entrée du package publié (§10).

---

## 2. Couches d'artefacts

Tout artefact du package appartient à **exactement une** couche :

| Couche | Nature | Éditable humain ? | Rôle |
|---|---|---|---|
| **Entrée acquisition** | Texte officiel + métadonnées de source | Non | Autorité verbatim ; voir [contrat 03](03-ACQUISITION-SSOT.md) |
| **Curaté canonique** | inventaire + Blueprint | Oui (via pipeline ; re-curation) | Seules sources de structure médicale et pédagogique maintenues |
| **Configuration package** | Déclarations d'intention (scope, absences connues, entrées de décision) | Oui (entrées versionnées) | Pilote le build ; **n'est pas** une vérité médicale |
| **Généré** | projections, sidecars de vérification, figures, manifest | **Non** | Produit par le build ; régénéré |
| **Apprenant** | Hors package Git | — | [Contrat 06](06-RENDERER-AND-LEARNER-LAYER.md) |

La couche **Configuration package** ne contient que des **décisions versionnées** et des **intentions de build** ; elle n'est **jamais** une source de vérité médicale et **ne concurrence** ni l'inventaire ni le Blueprint.

**Interdit :** modifier manuellement un artefact **généré** pour corriger fidélité, grounding ou structure — on corrige les **outils** ou les **curatifs**, puis on **régénère** ([contrat 01](01-TRUST-AND-FIDELITY.md) §10.4).

### 2.1 Deux curatifs, tout le reste généré

**Invariant structurant :** seuls l'**inventaire** et le **Blueprint** sont les **deux structures curatées canoniques** du chapitre. Tout le reste — projections, vérifications, manifest — est **généré** ou **dérivé** à partir d'eux et de l'entrée acquisition.

---

## 3. Entrée source du package

Chaque package **consomme** pour son chapitre :

- le **texte officiel** du chapitre (tranche verbatim) ;
- l'**identifiant d'édition** du Collège ;
- un **index structurel de sections** permettant les ancres ;
- la **provenance** liant ces éléments à l'édition qualifiée.

**Interdit :** reconstituer une autorité parallèle en relisant le PDF ou en re-découpant le collège en dehors de l'interface acquisition ([contrat 03](03-ACQUISITION-SSOT.md)).

---

## 4. Knowledge Inventory

### 4.1 Responsabilité

L'inventaire est la **preuve structurée d'exhaustivité** : tout fait examinable important de la source pour ce chapitre y est capturé à la granularité future de la maîtrise et de la comparaison d'éditions.

**Il n'enseigne pas** : pas d'ordre pédagogique, pas d'analogies, pas d'explications.

### 4.2 Contenu minimal par point de connaissance

Chaque point de connaissance porte au minimum :

- une **identité** stable ([contrat 02](02-IDENTITY-AND-ANCHORS.md)) ;
- une **description** lisible ;
- une ou plusieurs **ancres source** ;
- une **disposition** déclarée ;
- un **historique d'édition** (classifications de changement, confiance, lignée).

Lorsque la source fournit un **rang EDN** (A/B), il est conservé.

### 4.3 Dispositions

Ce niveau porte sur chaque **point de connaissance** de l'inventaire. Il est **distinct** des dispositions des **segments source** en réconciliation ([contrat 01](01-TRUST-AND-FIDELITY.md) §5.1) : deux niveaux du pipeline, vocabulaires différents, logique analogue de couverture.

Chaque point de connaissance possède **exactement une** disposition :

| Disposition | Signification |
|---|---|
| **understanding** | Porté par l'expérience de compréhension via le Blueprint |
| **deferred-to-mastery** | Préservé pour la maîtrise future ; hors leçon immédiate |
| **excluded-with-justification** | Hors périmètre pédagogique du chapitre ; raison consignée |

Aucun point de connaissance sans disposition — la complétude est prouvable ([contrat 01](01-TRUST-AND-FIDELITY.md) §5.2).

### 4.4 Réconciliation de couverture (artefact)

Une **réconciliation de couverture** indépendante compare la source et l'inventaire **section par section**. Son résultat est **persisté** dans le package (artefact généré de build).

Règles de disposition des segments source et gates de publication : [contrat 01](01-TRUST-AND-FIDELITY.md) §5. Le package **déclare** le **périmètre** de réconciliation (chapitre entier ou tranche verticale qualifiée) via sa **configuration package** — sans redéfinir les dispositions.

### 4.5 Origine canonique des changements d'édition

Les classifications de changement, bandes de confiance et lignée entre éditions vivent **uniquement** sur les points de connaissance de l'inventaire ([contrat 02](02-IDENTITY-AND-ANCHORS.md) §4.3, §10).

Les badges apprenant (« nouveau », « mis à jour », « inchangé », « retiré ») sont **dérivés** au packaging — **jamais** maintenus à la main dans les projections ou le manifest.

---

## 5. Chapter Blueprint

### 5.1 Responsabilité

Le Blueprint est le **seul intermédiaire structuré** d'où dérivent les projections de compréhension : plan pédagogique **manageable** qui **sélectionne et organise** — sans reproduire chaque ligne de l'inventaire.

**Un seul Blueprint** par chapitre.

### 5.2 Sections structurelles

Le Blueprint contient les sections requises par les consommateurs aval — notamment :

| Section | Rôle |
|---|---|
| **Modèle mental** | Vue d'ensemble ; question canonique projetée |
| **Séquence d'apprentissage** | Ordre et dépendances pédagogiques |
| **Mécanismes** | Questions, étapes, liens causels, points de connaissance référencés |
| **Acteurs** | Rôles et participation aux mécanismes |
| **Raisonnement clinique** | Nœuds reliant mécanismes, présentations, seuils |
| **Dépendances conceptuelles** | Prérequis pour la séquence et les mises à jour |
| **Points de confusion** | Cibles de désambiguïsation |
| **Analogies** | Échafaudage pédagogique déclaré |
| **Intentions visuelles** | Quels éléments peuvent bénéficier d'un visuel officiel et de quelle forme |

Chaque nœud référencé par une projection ou un visuel porte un **identifiant d'élément pédagogique** et référence les **points de connaissance** sur lesquels il s'appuie ([contrat 02](02-IDENTITY-AND-ANCHORS.md)).

### 5.3 Invariants de sélection

- Tout **élément pédagogique** du Blueprint référence **au moins un** point de connaissance valide.
- **Sanité de sélection :** tout point de connaissance **omis** du Blueprint est en disposition **deferred-to-mastery** ou **excluded-with-justification** — jamais silencieusement absent ([contrat 01](01-TRUST-AND-FIDELITY.md) via lien exhaustif / manageable, §6).

### 5.4 Limites

Le Blueprint **ne possède pas** : prose finale apprenant, markup de diagramme, mise en page, fait absent de l'inventaire.

---

## 6. Exhaustif versus manageable

### 6.1 Deux rôles complémentaires

**Invariant structurant :** l'**inventaire** assure l'**exhaustivité** examinable ; le **Blueprint** assure une compréhension **manageable** — deux rôles complémentaires, jamais confondus.

| Artefact | Rôle | Granularité |
|---|---|---|
| **inventaire** | Exhaustivité examinable | Fine — cible future maîtrise, QCM, répétition |
| **Blueprint** | Compréhension cognitivement manageable | Sélection — concepts structurants |

Le détail exclu de l'expérience de **compréhension** n'est **jamais perdu** — il reste dans l'inventaire en **deferred-to-mastery**, donc prouvable et disponible pour la maîtrise future.

### 6.2 Deux familles de projections

| Famille | Source principale | Contexte Blueprint |
|---|---|---|
| **Compréhension** | inventaire **via** Blueprint | **Requis** |
| **Maîtrise** (future) | inventaire **direct** | **Utile** quand pertinent ; **non obligatoire** par élément |

Un item de maîtrise **doit** cibler au moins un point de connaissance ; il **peut** référencer un élément pédagogique pour le contexte séquentiel sans que chaque fait atomique soit un nœud du Blueprint.

**Comprendre avant mémoriser** s'applique au niveau du **concept**, pas de chaque fait isolé.

---

## 7. Projections et registre

### 7.1 Projections de compréhension

Les projections de compréhension sont des artefacts **générés** : story, vue d'ensemble, mécanismes, raisonnement clinique, etc. Chacune :

- possède un **type** et un **ordre** dans le registre ;
- projette des **identifiants d'éléments pédagogiques** ;
- porte des **blocs de claim** avec traçabilité ([contrat 02](02-IDENTITY-AND-ANCHORS.md)) et classes ([contrat 01](01-TRUST-AND-FIDELITY.md)) ;
- porte un **tampon de provenance de génération** ([contrat 02](02-IDENTITY-AND-ANCHORS.md) §9.3).

**Interdit :** générer une projection directement depuis la source brute ou depuis la prose d'une projection sœur.

### 7.2 Registre des projections

Le package maintient un **registre** déclaratif listant chaque projection publiée ou planifiée :

- identifiant de projection ;
- type et **famille** (`understanding` | `mastery`) ;
- ordre pédagogique ;
- références aux éléments projetés ;
- statut (publiée, absente connue, etc.).

Le registre **ne fixe pas** une liste fermée de types — de nouvelles projections apparaissent quand le manifest les déclare ([contrat 06](06-RENDERER-AND-LEARNER-LAYER.md)).

### 7.3 Projections de maîtrise (future)

Le contrat de maîtrise (QCM, flashcards, etc.) est **figé conceptuellement** mais **non construit** à ce stade. Les **Questions d'évaluation** sont normées par le [contrat 07](07-ASSESSMENT-QUESTION.md) ; les **Scénarios cliniques** par le [contrat 09](09-CLINICAL-SCENARIO.md). Un package **peut** déclarer des absences connues de maîtrise sans invalider la **publication** de compréhension.

### 7.4 Objets éditoriaux d'évaluation — dans la Release

Les **Questions d'évaluation** et **Scénarios cliniques** sont des **objets éditoriaux publiés** **composant la Release** — au même titre que les explications et visuels ([contrat 08](08-RELEASE-EDITORIAL-ARCHITECTURE.md) §1).

| Règle | Énoncé |
|---|---|
| **Appartenance** | Toute Question (`question_id`) et tout Scénario (`scenario_id`) appartient à **exactement une** Release / Chapter Package publié |
| **Registre** | Le manifest **déclare** les Questions et Scénarios publiés, retenus ou absents — il ne les place **pas** hors package |
| **Famille** | Le tag technique `mastery` sur une entrée de registre **n'est pas** une entité métier — il classe des objets **déjà** dans la Release |
| **Interdit** | Traiter QCM ou cas cliniques comme artefacts aval, parallèles ou « hors Release » |

**Frontière :** structure et invariants de chaque objet — [contrats 07](07-ASSESSMENT-QUESTION.md) et [09](09-CLINICAL-SCENARIO.md) ; coexistence — [contrat 08](08-RELEASE-EDITORIAL-ARCHITECTURE.md).

---

## 8. Blocs pédagogiques

### 8.1 Structure

Une projection de compréhension est une séquence de **blocs pédagogiques** — un par élément pédagogique projeté, dans l'ordre du Blueprint.

Chaque bloc comprend :

| Composant | Obligation |
|---|---|
| **Prompt pédagogique** | Requis — origine canonique : élément pédagogique du Blueprint ; **ne pas confondre** avec une **Question d'évaluation** ([contrat 07](07-ASSESSMENT-QUESTION.md)) |
| **walkthrough guidé** | Requise — explication **canonique** de l'élément pédagogique |
| **Visuel officiel** | Optionnel — support pédagogique, jamais l'artefact explicatif primaire |

Le bloc pédagogique **n'introduit pas** d'espace d'identifiants propre — il partage l'identité de l'**élément pédagogique** ([contrat 02](02-IDENTITY-AND-ANCHORS.md) §5.2).

### 8.2 Walkthrough canonique

Le **walkthrough** est l'**artefact explicatif principal**. Il n'est ni un résumé de chapitre, ni une légende de figure, ni une réécriture simplifiée du Collège.

**Interdit :** qu'un fait n'existe **uniquement** dans un visuel ou ailleurs hors walkthrough + traçabilité ([contrat 01](01-TRUST-AND-FIDELITY.md), [contrat 05](05-VISUAL-GRAMMAR.md) — subordination au packaging).

---

## 9. Artefacts générés de build

Produits à chaque build (ou régénération partielle), **jamais édités à la main** :

| Artefact | Rôle |
|---|---|
| **Réconciliation persistée** | Résultat section par section de la couverture ([contrat 01](01-TRUST-AND-FIDELITY.md)) |
| **Grounding** | Verdicts de vérification par bloc de claim |
| **Index de traçabilité** | Graphe stocké anchor ← KP ← élément ← claim ([contrat 02](02-IDENTITY-AND-ANCHORS.md)) |
| **Figures officielles** | Dérivées des intentions visuelles validées ([contrat 05](05-VISUAL-GRAMMAR.md)) |
| **Cohérence de chapitre** | Verdict après mise à jour d'édition (§15.3) |
| **manifest** | Index de publication (§10) |

Les sidecars peuvent être **référencés** par le manifest plutôt qu'inlinés — le manifest déclare l'autorité.

---

## 10. Manifest — index de publication

### 10.1 Rôle

**Invariant structurant :** le **manifest** est l'**unique point d'entrée** du package **publié**.

Il est **généré** — jamais maintenu à la main comme source de vérité médicale. Il rend explicites : contenu existant, ordre, familles, liens explication↔visuel par **identifiant**, édition, provenance agrégée, **statuts** de vérification et d'absence.

### 10.2 Contenu minimal

Le manifest (directement ou via sidecars déclarés) expose au minimum :

- **registre des projections** et ordre d'apprentissage ;
- **famille** de chaque projection ;
- **Questions d'évaluation** et **Scénarios cliniques** publiés ou absents (§7.4) ;
- **graphe de traçabilité** ou référence authoritative ;
- **édition source** et tampons de provenance ;
- **résultats** de réconciliation et de grounding ;
- **badges d'édition** dérivés de l'inventaire ;
- **marqueurs d'absence connue** (projection ou visuel planifié non construit) ;
- **états des visuels officiels** (§11).

### 10.3 Interdictions

**Interdit au manifest :**

- dupliquer manuellement un statut d'édition ;
- introduire un identifiant médical nouveau ;
- servir de stockage de contenu médical auteur ;
- porter du **vocabulaire produit** — libellés d'interface, emojis, ordre d'affichage des vues, nomenclature de navigation ([`16-CONTENT-TO-READER-ARCHITECTURE.md`](../renderer/16-CONTENT-TO-READER-ARCHITECTURE.md) §6.3 ; [`COMPOSITION-COMPONENT-CONTRACT.md`](components/COMPOSITION-COMPONENT-CONTRACT.md) §13).

**Distinction d'ordre :** le registre **peut** exposer un **ordre pédagogique** des projections et des éléments — propriété du Blueprint et du pipeline. Il **ne prescrit pas** l'ordre d'affichage des **vues cognitives** du Reader ; celui-ci relève de la Composition Specification ([`COMPOSITION-COMPONENT-CONTRACT.md`](components/COMPOSITION-COMPONENT-CONTRACT.md) §8).

**Interdit au lecteur** de reconstruire le package en relisant inventaire, Blueprint ou source — [contrat 06](06-RENDERER-AND-LEARNER-LAYER.md).

---

## 11. Visuels officiels — frontière package

Les visuels relèvent du [contrat 05](05-VISUAL-GRAMMAR.md). Au niveau package, trois **états** doivent être **distincts** dans le manifest — vocabulaire technique mappé sur les **états d'absence éditoriaux** du [contrat 08](08-RELEASE-EDITORIAL-ARCHITECTURE.md) §5.0 :

| État (package) | État éditorial (contrat 08) | Signification |
|---|---|---|
| **none planned** | **Non applicable** | Aucun visuel prévu — issue légitime et fréquente |
| **planned-not-built** | **Prévu** | Prévu par le Blueprint, non encore produit |
| **built-but-withheld** | **Retenu** | Produite mais non publiée (échec validation, grounding ou éligibilité de rendu) |
| *(visuel publié)* | **Publié** | Visuel validé et disponible |

**Publication partielle :** l'échec d'un visuel officiel **n'invalide pas** un walkthrough par ailleurs valide — sous réserve que l'échec soit **rapporté**, tout visuel obsolète **retiré**, traçabilité et verdicts **préservés** ([contrat 01](01-TRUST-AND-FIDELITY.md) §10.3).

**Subordination :** tout point de connaissance porté par un visuel publié est aussi porté par le walkthrough du même bloc — vérification au packaging ([contrat 05](05-VISUAL-GRAMMAR.md)).

---

## 12. Pipeline métier interne

Ordre logique des dépendances **à l'intérieur** du package :

```
Entrée acquisition (contrat 03)
        ↓
inventaire (curatif)
        ↓
Réconciliation de couverture (généré, persisté)
        ↓
Blueprint (curatif)
        ↓
projections + figures (générés)
        ↓
grounding + traçabilité (générés)
        ↓
manifest (généré)
        ↓
Publication → Lecteur (contrat 06)
```

Aucune étape aval ne **contourne** une étape amont pour établir une autorité médicale parallèle.

---

## 13. Build

### 13.1 Fonction de build

Le build est une **fonction** de ses **entrées versionnées** :

- entrée acquisition ;
- inventaire et Blueprint (révisions de contenu) ;
- configuration package ;
- registre des projections ;
- version de méthodologie de génération et de vérification.

**Invariant structurant :** le build est une **fonction déterministe** de ses entrées versionnées — à entrées identiques, il **doit** produire le même résultat publiable (reproductibilité).

### 13.2 Obligations de build

| Obligation | Énoncé |
|---|---|
| **Validation avant publication** | Toutes les gates de structure, réconciliation, grounding et cohérence applicables **passent** ou le package est **retenu** |
| **Invalidation** | Un build **échoué** **invalide** le manifest publiable précédent — jamais laisser un index stale |
| **Persistance des échecs** | Les verdicts d'échec sont **consignés** dans les sidecars, pas effacés |
| **Pas de retouche manuelle** | Les sorties générées ne sont corrigées que par **régénération** |

Les **critères de fidélité** détaillés : [contrat 01](01-TRUST-AND-FIDELITY.md) §9–§10.

### 13.3 Entrées humaines

Une **décision humaine** n'est admise que comme **entrée versionnée** du package (**configuration package**) — jamais comme retouche de sortie **générée**. Elle référence une **exception machine**, est **justifiée**, **comptée** et **rejouable** ([contrat 01](01-TRUST-AND-FIDELITY.md) §11).

---

## 14. Publication et retenue

### 14.1 Publication autorisée

**Invariant fondamental :** aucune **publication** au lecteur **hors** d'un Chapter Package **complet et validé**.

Un chapitre est **publiable** lorsque :

- la réconciliation de couverture est **valide** ;
- les gates de grounding applicables **passent** ([contrat 01](01-TRUST-AND-FIDELITY.md) §10) ;
- la traçabilité est **complète et stockée** ;
- les références du registre **résolvent** ;
- la subordination visuelle **tient** si un visuel est publié ;
- après mise à jour d'édition, la **cohérence globale** du chapitre **passe** (§15).

Le manifest publié **matérialise** cet état.

### 14.2 Retenue

Le package est **retenu** (non publié) si une gate de [contrat 01](01-TRUST-AND-FIDELITY.md) §10.2 **échoue** — notamment segment **missed**, ambiguïté non résolue, grounding du walkthrough en échec, référence cassée.

**Exception visuelle :** seule l'**option** visuelle bénéficie du régime §11 — pas les autres gates.

---

## 15. Mises à jour d'édition et republication

### 15.1 Principe

Lors d'une **nouvelle édition** du Collège qualifiée, le package est mis à jour **de façon ciblée** lorsque la confiance le permet ; **élargie** lorsque la confiance est insuffisante ([contrat 02](02-IDENTITY-AND-ANCHORS.md) §10).

### 15.2 Propagation

Une modification sur un point de connaissance déclenche re-vérification ou régénération **uniquement** des artefacts **atteints** le long de la chaîne de traçabilité — éléments pédagogiques, projections, visuels, items de maîtrise futurs concernés.

Un tampon de provenance **inchangé** prouve la **lignée**, pas la **validité courante** du chapitre assemblé.

### 15.3 Cohérence globale

Après toute mise à jour partielle, une **vérification de cohérence au niveau chapitre** demande si l'**ensemble assemblé** reste globalement consistent avec la nouvelle source.

- **Échec ou incertitude** → élargir le périmètre régénéré ou **retenir** le chapitre ;
- **Succès** → **nouvelle Release** / nouveau Chapter Package publié via nouveau manifest — l'ancienne Release active est **archivée**, jamais écrasée ([ADR-006](../adr/ADR-006-pedagogical-patrimony-and-edition-lineage.md) §2, §5).

Les classifications et confiances d'identité : [contrat 02](02-IDENTITY-AND-ANCHORS.md) §10 — non redéfinies ici.

### 15.4 Règle de prudence

Si le périmètre affecté d'un changement **ne peut être déterminé avec confiance**, le pipeline **privilégie une reconstruction plus large** (re-réconciliation, re-analyse du Blueprint, re-projection) plutôt qu'un patch chirurgical risqué.

---

## 16. Limites du Chapter Package

Ce contrat **ne définit pas** :

| Sujet | Contrat |
|---|---|
| Modèle de confiance, grounding, réconciliation (règles) | [01](01-TRUST-AND-FIDELITY.md) |
| Identités, ancres, chaîne | [02](02-IDENTITY-AND-ANCHORS.md) |
| Acquisition | [03](03-ACQUISITION-SSOT.md) |
| visualSpec, moteur de rendu graphique (build), sémantique visuelle | [05](05-VISUAL-GRAMMAR.md) |
| Lecteur, couche apprenant | [06](06-RENDERER-AND-LEARNER-LAYER.md) |
| Décisions ADR historiques | [ADR-003](../adr/ADR-003-single-source-of-truth.md), [ADR-004](../adr/ADR-004-acquisition-architecture-frozen.md) |

---

## Sources consolidées

| Document | Apport consolidé |
|---|---|
| [`IMPLEMENTATION_CONTRACT.md`](../../IMPLEMENTATION_CONTRACT.md) | A.2 (mises à jour, cohérence, badges dérivés) ; A.3 (exhaustif/manageable, familles de projections) ; C.2–C.6 ; bloc pédagogique (Part B) |
| [ADR-003](../adr/ADR-003-single-source-of-truth.md) | SSOT — une autorité par chapitre packagé |
| [ADR-004](../adr/ADR-004-acquisition-architecture-frozen.md) | Frontière acquisition / package métier ; consommateurs |
| [`VISUAL_GRAMMAR_CONTRACT.md`](../../VISUAL_GRAMMAR_CONTRACT.md) | États visuels, subordination, I8 — frontières avec le package (§11) |
| [`PHASE_0A_CONTRACT_AUDIT.md`](../PHASE_0A_CONTRACT_AUDIT.md) | Périmètre contrat 04 ; artefact set ; gates build/reproductibilité |
