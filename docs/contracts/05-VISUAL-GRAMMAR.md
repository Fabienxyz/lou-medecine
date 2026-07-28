# Contrat 05 — Visual Grammar

| | |
|---|---|
| **Type** | Contrat fondamental normatif |
| **Statut** | Phase 0A — en vigueur |
| **Question unique** | Comment un visuel officiel est-il représenté dans Lou Médecine ? |
| **Index** | [`00-INDEX.md`](00-INDEX.md) |

Ce contrat consolide les **invariants architecturaux** des **visuels officiels** — leur place, leurs responsabilités et leur sémantique. Il ne décrit jamais le SVG, le HTML, les primitives graphiques, les algorithmes de layout ni le détail d'implémentation du **moteur de rendu graphique** (build) ni du **renderer lecteur** ([contrat 06](06-RENDERER-AND-LEARNER-LAYER.md)).

En cas de conflit avec un document non listé dans les sources consolidées, les sources consolidées et les ADR de gouvernance priment selon [`00-INDEX.md`](00-INDEX.md). Pour les invariants techniques détaillés (I1–I12), schémas de primitives et cycle de vie d'implémentation, [`VISUAL_GRAMMAR_CONTRACT.md`](../../VISUAL_GRAMMAR_CONTRACT.md) reste la **spécification détaillée de référence** ; ce contrat n'en extrait que la gouvernance permanente.

---

## Frontières documentaires

| Contrat | Ce qu'il définit — non recopié ici |
|---|---|
| [01 — Trust & Fidelity](01-TRUST-AND-FIDELITY.md) | Grounding, classes de claim, fallback conservateur, gates de fidélité |
| [02 — Identity & Anchors](02-IDENTITY-AND-ANCHORS.md) | Identités, ancres, chaîne de traçabilité, élément pédagogique, bloc pédagogique |
| [03 — Acquisition SSOT](03-ACQUISITION-SSOT.md) | Texte officiel segmenté, édition, provenance acquisition |
| [04 — Chapter Package](04-CHAPTER-PACKAGE.md) | Structure du package, manifest, états de publication des visuels, build |
| [06 — Renderer & Learner Layer](06-RENDERER-AND-LEARNER-LAYER.md) | **Renderer lecteur** — présentation au manifest ; immutabilité ; couche apprenant |

**Ce contrat (05)** définit le **modèle conceptuel** d'un visuel officiel : ce qu'il est, à quoi il se rattache, ce que le **visualSpec** décrit, et quelles propriétés sémantiques sont non négociables.

---

## 1. Définition du visuel officiel

### 1.1 Terme et statut

Un **visuel officiel** (*Official Visual*) est un artefact **généré** du pipeline, **optionnel** au sein d'un **bloc pédagogique**, lié par **identifiant** à un **élément pédagogique** du Blueprint ([contrat 02](02-IDENTITY-AND-ANCHORS.md), [contrat 04](04-CHAPTER-PACKAGE.md) §8).

C'est une **catégorie architecturale**, pas un type de diagramme : aujourd'hui des représentations sémantiques produites à partir d'un visualSpec ; demain, le mode « référence d'asset » (illustration anatomique, imagerie, ECG) reste **hors périmètre actuel** tant qu'il n'est pas explicitement ratifié ([`VISUAL_GRAMMAR_CONTRACT.md`](../../VISUAL_GRAMMAR_CONTRACT.md) §7.1).

### 1.2 Réponse directrice

Un visuel officiel Lou Médecine :

1. **soutient** la compréhension d'un élément pédagogique déjà modélisé dans le Blueprint ;
2. **exprime** des relations sémantiques et médicales via un **visualSpec** auditable ;
3. **ne remplace jamais** le **walkthrough** comme explication canonique ;
4. **ne porte jamais seul** un savoir médical absent du walkthrough du même bloc ;
5. **peut être absent** sans invalider le bloc ;
6. **peut être retenu** (non publié) sans invalider un walkthrough par ailleurs valide — sous les conditions du [contrat 04](04-CHAPTER-PACKAGE.md) §11.

---

## 2. Séparation des responsabilités

Quatre questions distinctes ; **aucune couche ne répond à la place d'une autre** ([`VISUAL_GRAMMAR_CONTRACT.md`](../../VISUAL_GRAMMAR_CONTRACT.md) §1.1).

**Terminologie.** Dans ce contrat, **moteur de rendu graphique** désigne le composant de **build** qui produit une **représentation graphique** à partir d'un visualSpec validé. Le **renderer lecteur** — consommation du manifest publié — relève exclusivement du [contrat 06](06-RENDERER-AND-LEARNER-LAYER.md). Ce ne sont **pas** le même composant.

| Couche | Question | Responsabilité |
|---|---|---|
| **Blueprint** | *Un visuel est-il utile, et quelle forme sémantique convient ?* | **Intention visuelle** — déclaration pédagogique curatée ; jamais le contenu sémantique ni la géométrie |
| **visualSpec** | *Que représente le visuel ?* | Relations sémantiques et médicales, traçabilité vers les points de connaissance ou classes d'échafaudage explicites ; **zéro géométrie de rendu** |
| **Projection / bloc** | *Où le visuel apparaît-il dans l'expérience ?* | Placement dans la projection de compréhension, ordre du bloc pédagogique ([contrat 04](04-CHAPTER-PACKAGE.md) §8) |
| **Moteur de rendu graphique** | *Comment produire la figure ?* | **Représentation graphique** à partir du visualSpec validé ; **aucun contenu médical auteur** ([`VISUAL_GRAMMAR_CONTRACT.md`](../../VISUAL_GRAMMAR_CONTRACT.md) §1.1) |

**Invariant structurant :** seul le **visualSpec** porte le **sens médical** du visuel ; seul le **moteur de rendu graphique** produit la **représentation graphique** (build). Toute cible de rendu n'est qu'une **implémentation possible** satisfaisant un visualSpec validé. La **présentation** au lecteur relève du **renderer lecteur** ([contrat 06](06-RENDERER-AND-LEARNER-LAYER.md)).

### 2.1 Flux canonique (conceptuel)

```
Blueprint (intention visuelle)
        ↓
visualSpec (sémantique + traçabilité)
        ↓
validation sémantique + grounding
        ↓
représentation graphique générée (jetable)   ← moteur de rendu graphique (build)
        ↓
manifest / bloc pédagogique (liaison par identifiant)
        ↓
renderer lecteur (contrat 06)
```

Aucune étape ne **contourne** la précédente pour établir une autorité sémantique parallèle. En particulier, le **moteur de rendu graphique** **ne lit pas** le Blueprint, l'inventaire ni la source — uniquement un visualSpec validé. Le **renderer lecteur** **ne lit pas** le visualSpec pour en inférer du sens médical ; il consomme les **figures officielles** déjà matérialisées dans le package ([contrat 06](06-RENDERER-AND-LEARNER-LAYER.md) §2.2).

---

## 3. Relation avec l'élément pédagogique et le walkthrough

### 3.1 Ancrage obligatoire

**Invariant structurant :** tout visuel officiel est **subordonné** à exactement un **élément pédagogique** identifié. Le lien est **par identifiant stable**, jamais par position ordinale, nom de fichier ou ordre de titre ([contrat 02](02-IDENTITY-AND-ANCHORS.md), [contrat 04](04-CHAPTER-PACKAGE.md) §10).

Un visuel **n'introduit pas** d'espace d'identifiants propre.

### 3.2 Asymétrie walkthrough / visuel

**Invariant fondamental :** le **walkthrough** est l'**artefact explicatif canonique** du bloc ; le visuel officiel est un **support pédagogique optionnel**, jamais l'artefact explicatif primaire ([contrat 04](04-CHAPTER-PACKAGE.md) §8, [`VISUAL_GRAMMAR_CONTRACT.md`](../../VISUAL_GRAMMAR_CONTRACT.md) §5.1).

| Propriété | walkthrough | visuel officiel |
|---|---|---|
| Obligation | **Requis** | **Optionnel** |
| Complétude du bloc | Suffit seul | Ne suffit jamais seul |
| Contenu médical nouveau | Interdit hors traçabilité | **Interdit** s'il n'est pas aussi porté par le walkthrough |
| Absence | — | Issue **légitime** et **fréquente** (valeur cognitive insuffisante) |

**Subordination vérifiable :** tout point de connaissance référencé par une unité sémantique du visuel publié est aussi référencé par le walkthrough du même bloc — les unités d'échafaudage explicites en sont exclues. Vérification au **packaging** ([contrat 04](04-CHAPTER-PACKAGE.md) §11).

**Interdit :** qu'un fait n'existe **uniquement** dans un visuel ([contrat 01](01-TRUST-AND-FIDELITY.md)).

### 3.3 Absence et échec

- **Absence** : lorsqu'aucune **intention visuelle** ne requiert de **figure officielle** — bloc complet ([contrat 04](04-CHAPTER-PACKAGE.md) §11).
- **Échec** : le **visuel officiel** peut être **retenu** sans invalider un **walkthrough** valide — [contrat 04](04-CHAPTER-PACKAGE.md) §11, [contrat 01](01-TRUST-AND-FIDELITY.md) §10.3.

Le visuel n'a pas besoin de « permission » du walkthrough pour être omis ; le walkthrough n'a pas besoin d'un visuel pour être publié.

---

## 4. Intention visuelle et visualSpec

### 4.1 Intention visuelle (Blueprint)

La section **intentions visuelles** du Blueprint déclare **quels** éléments pédagogiques peuvent bénéficier d'un visuel et **quelle forme sémantique** est appropriée — sans décrire le contenu des nœuds, des arêtes ou la mise en page ([contrat 04](04-CHAPTER-PACKAGE.md) §5.2).

Le Blueprint **décide si** et **quelle primitive sémantique** ; il **ne possède pas** la représentation graphique ni le visualSpec.

### 4.2 visualSpec — source auditable du sens

**Invariant structurant :** le **visualSpec** est l'**unique source auditable** du sens médical d'un visuel officiel. La **figure officielle** est un **dérivé jetable** : sa suppression et sa régénération ne doivent pas effacer le sens revu ([`VISUAL_GRAMMAR_CONTRACT.md`](../../VISUAL_GRAMMAR_CONTRACT.md) §1.3).

Propriétés permanentes du visualSpec :

| Propriété | Énoncé |
|---|---|
| **Généré** | Produit par le pipeline à partir du Blueprint et de l'inventaire — pas une saisie manuelle de routine |
| **Persisté** | Artefact durable, diffable, versionné avec le package |
| **Déclaratif** | Décrit *ce qui est représenté*, pas *comment c'est dessiné* |
| **Indépendant du moteur de rendu graphique** | Ne présuppose aucune cible de rendu ; **plusieurs représentations graphiques** peuvent satisfaire le même visualSpec |
| **Traçable** | Chaque unité sémantique visible porte des références de traçabilité ou une classe d'échafaudage explicite ([contrat 02](02-IDENTITY-AND-ANCHORS.md)) |

**Interdit dans un visualSpec :** tout ce qui relève de la **présentation** plutôt que du **sens** — voir [`VISUAL_GRAMMAR_CONTRACT.md`](../../VISUAL_GRAMMAR_CONTRACT.md).

Le schéma formel du visualSpec **n'est pas gelé** par ce contrat ; son gel relève de la gouvernance de la spécification détaillée ([`VISUAL_GRAMMAR_CONTRACT.md`](../../VISUAL_GRAMMAR_CONTRACT.md) §6.3).

### 4.3 Distinction intention / spécification / figure

| Objet | Nature | Durabilité |
|---|---|---|
| **intention visuelle** (Blueprint) | Curatif — déclaration d'utilité et de forme | Révisé avec le Blueprint |
| visualSpec | Généré — sémantique et traçabilité | Persisté ; autorité du sens |
| figure officielle | Généré — **représentation graphique** | Jetable ; régénérable à identité de spec |

Un changement de **style** ne modifie pas le visualSpec. Un changement de **sens médical** apparaît dans le visualSpec.

---

## 5. Invariants sémantiques

[`VISUAL_GRAMMAR_CONTRACT.md`](../../VISUAL_GRAMMAR_CONTRACT.md) porte l'ensemble des invariants techniques détaillés. Au niveau gouvernance, **quatre principes** sont **non négociables** :

1. **Sens dans le spec, figure dans le build** — tout sens médical du visuel **provient** du visualSpec ; le **moteur de rendu graphique** n'autorise aucun contenu médical auteur (la **présentation** relève du renderer lecteur — [contrat 06](06-RENDERER-AND-LEARNER-LAYER.md)).
2. **Traçabilité obligatoire** — toute unité sémantique porte une référence ou un échafaudage explicite ([contrat 02](02-IDENTITY-AND-ANCHORS.md)) ; la fidélité aux ancres relève du [contrat 01](01-TRUST-AND-FIDELITY.md).
3. **Valeur cognitive avant couverture** — un **visuel officiel** n'existe que si une structure relationnelle ou spatiale aide la compréhension ; son **absence** est une issue légitime et fréquente.
4. **Validation sémantique, pas esthétique** — on juge ce que le visuel *représente* et sa fidélité, jamais la qualité graphique de la **représentation graphique**.

Évolution de la grammaire, intégrité textuelle, débordement et multi-cibles de rendu : [`VISUAL_GRAMMAR_CONTRACT.md`](../../VISUAL_GRAMMAR_CONTRACT.md) — non redéfinis ici.

---

## 6. Validation et grounding

### 6.1 Objet de la validation

La validation d'un **visuel officiel** porte sur le **visualSpec** et ses liens — intégrité référentielle, **grounding** des unités sémantiques porteuses de sens médical ([contrat 01](01-TRUST-AND-FIDELITY.md)), **subordination** au **walkthrough** du bloc (§3.2). Les mécanismes détaillés relèvent de [`VISUAL_GRAMMAR_CONTRACT.md`](../../VISUAL_GRAMMAR_CONTRACT.md) et du [contrat 04](04-CHAPTER-PACKAGE.md).

**Invariant structurant :** la justesse médicale d'un visuel se **revoit** via le **visualSpec** et ses verdicts — **sans** inspecter la **représentation graphique**.

### 6.2 Séparation proposition / vérification

La **sémantique** du visuel peut être **proposée** (typiquement assistée) ; elle est **vérifiée** indépendamment. La **représentation graphique** est produite de façon **déterministe** à partir d'un visualSpec validé — jamais l'inverse. Frontière détaillée : [`VISUAL_GRAMMAR_CONTRACT.md`](../../VISUAL_GRAMMAR_CONTRACT.md) §6.5.

---

## 7. Visuels et Chapter Package

Les règles de **build**, de **manifest** et de **publication** des visuels relèvent du [contrat 04](04-CHAPTER-PACKAGE.md) §9–§11. Ce contrat ne les redéfinit pas.

Rappel des dépendances conceptuelles :

- les **figures officielles** sont des artefacts **générés** de build, produites à partir de **visualSpecs** validés ;
- le **manifest** déclare disponibilité et liaisons explication↔visuel **par identifiant** ([contrat 04](04-CHAPTER-PACKAGE.md) §10–§11) ;
- la **subordination** et le **grounding** sont des gates de **publication** au niveau package — échec du visuel optionnel ≠ retenue du **walkthrough** valide.

Un chapitre **publiable** sans aucun visuel construit est une issue **normale** lorsque les intentions visuelles sont absentes ou non encore satisfaites.

---

## 8. Catalogue et évolution

La grammaire visuelle est **gouvernée** : un **catalogue** constitue la **baseline officielle** en vigueur ; son **évolution** — promotion, fusion ou retrait — n'est admise que selon la **gouvernance prévue** ([`VISUAL_GRAMMAR_CONTRACT.md`](../../VISUAL_GRAMMAR_CONTRACT.md) §4 ; [ADR-001](../adr/ADR-001-freeze-svg-grammar-catalogue.md)).

Ce contrat **ne définit ni le catalogue, ni les primitives, ni leurs spécifications techniques**.

---

## 9. Limites du contrat

Ce contrat **ne définit pas** :

| Sujet | Document |
|---|---|
| Fidélité, grounding, fallback | [01](01-TRUST-AND-FIDELITY.md) |
| Identités, ancres, chaîne | [02](02-IDENTITY-AND-ANCHORS.md) |
| Acquisition | [03](03-ACQUISITION-SSOT.md) |
| Package, manifest, build, republication | [04](04-CHAPTER-PACKAGE.md) |
| Présentation lecteur, immutabilité | [06](06-RENDERER-AND-LEARNER-LAYER.md) |
| Invariants I1–I12 détaillés, primitives CORE, schéma visualSpec | [`VISUAL_GRAMMAR_CONTRACT.md`](../../VISUAL_GRAMMAR_CONTRACT.md) |
| Catalogue par primitive, rendu SVG | [`VISUAL_GRAMMAR_LIBRARY.md`](../../VISUAL_GRAMMAR_LIBRARY.md), [ADR-001](../adr/ADR-001-freeze-svg-grammar-catalogue.md) |
| Diagrammes personnels, notes inline | [06](06-RENDERER-AND-LEARNER-LAYER.md) — couche apprenant ; **jamais** des visuels officiels |

**Frontière apprenant :** un diagramme personnel ou une note inline **ne remplace, ne modifie et ne surcharge jamais** un visuel officiel ni un walkthrough ([contrat 06](06-RENDERER-AND-LEARNER-LAYER.md)).

---

## Sources consolidées

| Document | Apport consolidé |
|---|---|
| [`VISUAL_GRAMMAR_CONTRACT.md`](../../VISUAL_GRAMMAR_CONTRACT.md) | Séparation des quatre couches ; flux canonique ; invariants I1–I12 (référence) ; asymétrie walkthrough–visuel §5.1 ; statut et modèle du visualSpec §6 ; frontière déterminisme §6.5 ; grammaire ouverte §4 |
| [`IMPLEMENTATION_CONTRACT.md`](../../IMPLEMENTATION_CONTRACT.md) | Part B (bloc pédagogique, asymétrie walkthrough / visuel, subordination) ; C.3 (intentions visuelles) ; C.4 (Official Visual) ; renvois C.6/C.7 (non recopiés) |
| [ADR-001](../adr/ADR-001-freeze-svg-grammar-catalogue.md) | Gel du catalogue sémantique comme baseline ; critères d'évolution documentée |
| [`PHASE_0A_CONTRACT_AUDIT.md`](../PHASE_0A_CONTRACT_AUDIT.md) | Périmètre contrat 05 ; séparation 4 layers ; schéma visualSpec non gelé ; réconciliation catalogue gelé / grammaire ouverte |
