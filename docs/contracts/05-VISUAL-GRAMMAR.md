# Contrat 05 — Visual Grammar

| | |
|---|---|
| **Type** | Contrat fondamental normatif |
| **Statut** | Phase 0A — en vigueur |
| **Question unique** | Qu'est-ce qu'une **visualSpec**, que porte-t-elle, et où s'arrête la responsabilité sémantique d'un visuel officiel ? |
| **Index** | [`00-INDEX.md`](00-INDEX.md) |

Ce contrat est le **contrat canonique de la visualSpec** et des **invariants sémantiques** des visuels officiels Lou Médecine. Il définit ce qu'un visuel **représente**, à quoi il se rattache, et quelles propriétés médicales et éditoriales sont non négociables.

Il ne décrit **jamais** : la reconnaissance, les capacités, les contrats perceptuels, la composition abstraite, les surfaces de matérialisation, les preuves VCCK, le SVG, le HTML, les algorithmes de layout, ni le détail d'implémentation du pipeline de composition ([ADR-008](../adr/ADR-008-vcck-industrial-composition-pipeline.md)) ni du **renderer lecteur** ([contrat 06](06-RENDERER-AND-LEARNER-LAYER.md)).

En cas de conflit avec un document non listé dans les sources consolidées, les sources consolidées et les ADR de gouvernance priment selon [`00-INDEX.md`](00-INDEX.md). Pour les invariants techniques détaillés (I1–I12), schémas de primitives et cycle de vie d'implémentation, [`VISUAL_GRAMMAR_CONTRACT.md`](../../VISUAL_GRAMMAR_CONTRACT.md) reste la **spécification détaillée de référence** ; ce contrat n'en extrait que la gouvernance permanente.

---

## Frontières documentaires

| Contrat / ADR | Ce qu'il définit — non recopié ici |
|---|---|
| [01 — Trust & Fidelity](01-TRUST-AND-FIDELITY.md) | Grounding, classes de claim, fallback conservateur, gates de fidélité |
| [02 — Identity & Anchors](02-IDENTITY-AND-ANCHORS.md) | Identités, ancres, chaîne de traçabilité, élément pédagogique, bloc pédagogique |
| [03 — Acquisition SSOT](03-ACQUISITION-SSOT.md) | Texte officiel segmenté, édition, provenance acquisition |
| [04 — Chapter Package](04-CHAPTER-PACKAGE.md) | Structure du package, manifest, états de publication des visuels, build |
| [06 — Renderer & Learner Layer](06-RENDERER-AND-LEARNER-LAYER.md) | **Renderer lecteur** — présentation au manifest ; immutabilité ; couche apprenant |
| [ADR-008 — Pipeline industriel VCCK](../adr/ADR-008-vcck-industrial-composition-pipeline.md) | Signature, reconnaissance, capacité, composition abstraite, surfaces de matérialisation, registre, preuves |

**Ce contrat (05)** définit le **modèle sémantique** d'un visuel officiel : la **visualSpec**, les **primitives**, les obligations éditoriales, et la frontière avec la couche composition (ADR-008).

---

## 1. Définition du visuel officiel

### 1.1 Terme et statut

Un **visuel officiel** (*Official Visual*) est un artefact **généré** du pipeline, lié par **identifiant** à un **élément pédagogique** du Blueprint ([contrat 02](02-IDENTITY-AND-ANCHORS.md), [contrat 04](04-CHAPTER-PACKAGE.md) §8). Il est **obligatoire** pour tout Modèle mental et toute Notion autonome conformément à [ADR-007](../adr/ADR-007-visual-centrality-for-mental-models-and-notions.md).

C'est une **catégorie architecturale**, pas un type de diagramme : aujourd'hui des représentations sémantiques produites à partir d'une visualSpec validée, puis composées et matérialisées selon [ADR-008](../adr/ADR-008-vcck-industrial-composition-pipeline.md) ; demain, le mode « référence d'asset » (illustration anatomique, imagerie, ECG) reste **hors périmètre actuel** tant qu'il n'est pas explicitement ratifié ([`VISUAL_GRAMMAR_CONTRACT.md`](../../VISUAL_GRAMMAR_CONTRACT.md) §7.1).

### 1.2 Réponse directrice

Un visuel officiel Lou Médecine :

1. **structure** la compréhension d'un élément pédagogique déjà modélisé dans le Blueprint ;
2. **exprime** des relations sémantiques et médicales via une **visualSpec** auditable ;
3. **ne remplace jamais** le **walkthrough** comme explication canonique ;
4. **ne porte jamais seul** un savoir médical absent du walkthrough du même bloc ;
5. est le **cœur pédagogique obligatoire** d'un MM ou d'une Notion autonome ;
6. peut être retenu techniquement tout en laissant le walkthrough accessible, mais le bloc MM/Notion reste **incomplet** — sous les conditions du [contrat 04](04-CHAPTER-PACKAGE.md) §11.

La **figure officielle** publiée est un **dérivé** de la visualSpec validée. Elle n'est **pas** l'autorité du sens médical.

---

## 2. La visualSpec — contrat canonique

### 2.1 Définition

La **visualSpec** est l'**unique source auditable** du sens médical d'un visuel officiel. C'est l'objet normatif central de ce contrat.

Elle exprime *ce qui est représenté* — entités sémantiques, relations médicales, labels visibles, traçabilité — dans le cadre d'une **primitive sémantique** du catalogue gelé ([ADR-001](../adr/ADR-001-freeze-svg-grammar-catalogue.md)). Elle ne prescrit *ni comment* la structure est composée, *ni comment* elle est dessinée.

### 2.2 Ce qu'elle contient

| Catégorie | Énoncé |
|---|---|
| **Structure sémantique** | Entités, relations, cardinalités et contraintes expressibles dans la primitive déclarée |
| **Contenu visible** | Labels et libellés portés par le visuel — tous traçables ou explicitement échafaudés |
| **Primitive déclarée** | Référence à un slot du catalogue ADR-001 — cadre sémantique éditorial, non directive de composition |
| **Traçabilité** | Références vers les points de connaissance ou classes d'échafaudage explicites ([contrat 02](02-IDENTITY-AND-ANCHORS.md)) |
| **Identité et version** | Identifiant stable, lien à l'élément pédagogique, versionnement avec le package |

Propriétés permanentes :

| Propriété | Énoncé |
|---|---|
| **Générée** | Produite par le pipeline à partir du Blueprint et de l'inventaire — pas une saisie manuelle de routine |
| **Persistée** | Artefact durable, diffable, versionné avec le package |
| **Déclarative** | Décrit le sens représenté, pas la géométrie ni le layout |
| **Indépendante de l'exécution** | Ne présuppose aucune capacité, surface de matérialisation ni format de sortie |
| **Traçable** | Chaque unité sémantique visible porte des références de traçabilité ou une classe d'échafaudage explicite |

### 2.3 Ce qu'elle ne contient jamais

**Invariant structurant :** une visualSpec ne porte **aucune** responsabilité de composition ni d'exécution.

Il est **interdit** dans une visualSpec :

| Interdit | Raison |
|---|---|
| Coordonnées, positions, dimensions, ordre spatial imposé | Relève de la composition (ADR-008) |
| Choix ou mention d'une **capacité**, d'une **famille** qualifiée ou d'un algorithme de layout | Relève de la reconnaissance (ADR-008) |
| **Signature** structurelle déclarée autoritairement | La signature est **calculée** en aval (ADR-008) |
| Contrat perceptuel, budgets de composition, règles de reflow | Relève de VCCK |
| Directives au **renderer** ou à une surface de matérialisation | Relève de l'exécution |
| Tout contenu médical absent de la traçabilité autorisée | Violation du grounding ([contrat 01](01-TRUST-AND-FIDELITY.md)) |

Le schéma formel de la visualSpec **n'est pas gelé** par ce contrat ; son gel relève de la gouvernance de la spécification détaillée ([`VISUAL_GRAMMAR_CONTRACT.md`](../../VISUAL_GRAMMAR_CONTRACT.md) §6.3).

### 2.4 Responsabilités et autorité

| Question | Réponse — portée visualSpec |
|---|---|
| *Que représente le visuel ?* | Relations sémantiques et médicales, dans le cadre de la primitive déclarée |
| *D'où provient le sens médical visible ?* | Exclusivement de la visualSpec validée |
| *Qui valide la justesse médicale ?* | Gates sémantiques et éditoriales — **sans** inspecter la figure |
| *La visualSpec décide-elle de la forme composée ?* | **Non** — voir §9 |
| *La visualSpec impose-t-elle une capacité ?* | **Non** — voir §9 |

**Autorité :** la visualSpec est l'autorité **sémantique** du visuel. Elle n'est pas l'autorité **compositionnelle**, **perceptuelle** ni **d'exécution**.

### 2.5 Invariants de la visualSpec

1. **Sens dans le spec** — tout sens médical du visuel **provient** de la visualSpec ; aucune couche aval n'en crée.
2. **Zéro géométrie de rendu** — la visualSpec ne fixe ni layout ni projection graphique.
3. **Traçabilité obligatoire** — toute unité sémantique porte une référence ou un échafaudage explicite ([contrat 02](02-IDENTITY-AND-ANCHORS.md)).
4. **Subordination au walkthrough** — tout KP référencé par le visuel publié l'est aussi par le walkthrough du bloc (§5).
5. **Stabilité patrimoniale sémantique** — une visualSpec **validée** conserve son **identité éditoriale** indépendamment des capacités qualifiées, des surfaces de matérialisation ou des évolutions VCCK futures ([ADR-008](../adr/ADR-008-vcck-industrial-composition-pipeline.md) I15). Une régénération ultérieure peut produire un **nouvel artefact** ([ADR-006](../adr/ADR-006-pedagogical-patrimony-and-edition-lineage.md)) ; elle ne requalifie pas silencieusement le sens de la visualSpec source.

### 2.6 Distinction intention / spécification / figure

| Objet | Nature | Durabilité | Contrat |
|---|---|---|---|
| **intention visuelle** (Blueprint) | Curatif — déclaration d'utilité et de forme sémantique | Révisé avec le Blueprint | §6 |
| **visualSpec** | Générée — sémantique et traçabilité | Persistée ; **autorité du sens** | **Ce contrat** |
| **figure officielle** | Générée — représentation matérialisée | Jetable ; régénérable sans perte de sens spec | [contrat 04](04-CHAPTER-PACKAGE.md), ADR-008 |

Un changement de **style** ou de **capacité** ne modifie pas la visualSpec. Un changement de **sens médical** apparaît dans la visualSpec.

---

## 3. Primitives sémantiques

### 3.1 Rôle dans la visualSpec

Une **primitive sémantique** est un slot du **catalogue gelé** ([ADR-001](../adr/ADR-001-freeze-svg-grammar-catalogue.md), [`VISUAL_GRAMMAR_LIBRARY.md`](../../VISUAL_GRAMMAR_LIBRARY.md)) : un type de structure cognitive (graphe causal, algorithme décisionnel, matrice de comparaison, etc.) avec un contrat d'entrée et des frontières sémantiques.

Dans une visualSpec, la primitive déclarée :

- **cadre** le vocabulaire relationnel admissible ;
- ** borne** les distorsions sémantiques interdites ;
- ** trace** l'intention éditoriale vers le catalogue.

La primitive **ne détermine pas** une figure, **ne sélectionne pas** une capacité, **ne garantit pas** une représentation acceptable. Choisir une primitive correcte est une condition **nécessaire** de validité sémantique, **non suffisante** pour produire un visuel.

### 3.2 Ce que la primitive n'est pas

| Notion | Périmètre | Document |
|---|---|---|
| **Primitive** | Vocabulaire sémantique gelé | Ce contrat, ADR-001 |
| **Famille** | Description structurelle candidate à qualification | ADR-008 — **hors contrat 05** |
| **Capacité** | Famille qualifiée, prouvée, réutilisable | ADR-008 — **hors contrat 05** |
| **Composition** | Plan abstrait instancié pour une visualSpec admise | ADR-008 — **hors contrat 05** |

Aucune confusion entre ces niveaux n'est admise. Ce contrat ne définit ni famille ni capacité.

### 3.3 Catalogue et évolution

La grammaire visuelle est **gouvernée** : un **catalogue** constitue la **baseline officielle** en vigueur ; son **évolution** — promotion, fusion ou retrait — n'est admise que selon la **gouvernance prévue** ([`VISUAL_GRAMMAR_CONTRACT.md`](../../VISUAL_GRAMMAR_CONTRACT.md) §4 ; [ADR-001](../adr/ADR-001-freeze-svg-grammar-catalogue.md)).

Ce contrat **ne définit ni le catalogue complet, ni les spécifications techniques par primitive**. Si une visualSpec est légitime éditorialement mais qu'aucune primitive du catalogue ne permet d'exprimer le sens sans distorsion, la décision relève d'**ADR-001** — VCCK ne crée jamais de primitive ([ADR-008](../adr/ADR-008-vcck-industrial-composition-pipeline.md) §4.4).

---

## 4. Séparation des responsabilités

Cinq questions distinctes ; **aucune couche ne répond à la place d'une autre**.

**Terminologie.** Dans ce contrat :

- **VCCK** (*Visual Composition Conformance Kit*) désigne la couche de **composition** gouvernée par [ADR-008](../adr/ADR-008-vcck-industrial-composition-pipeline.md) — reconnaissance, capacités, composition abstraite.
- **Surface de matérialisation** désigne un composant de **build** qui projette une composition abstraite admise en artefact sérialisé (SVG, HTML, Word, …).
- **Renderer lecteur** — consommation du manifest publié — relève exclusivement du [contrat 06](06-RENDERER-AND-LEARNER-LAYER.md).

Ce ne sont **pas** le même composant ni le même domaine.

| Couche | Domaine | Question | Responsabilité |
|---|---|---|---|
| **Blueprint / contrat éditorial** | Éditorial | *Un visuel est-il requis, et quelle question canonique doit-il porter ?* | Intention visuelle, congruence bloc, couverture KP |
| **visualSpec** | Éditorial | *Que représente le visuel ?* | Sémantique, traçabilité, primitive déclarée ; **zéro géométrie** |
| **VCCK** | Composition | *Quelle capacité admet cette structure, et quelle composition en résulte ?* | Signature calculée, reconnaissance, capacité, composition abstraite — **voir ADR-008** |
| **Surface de matérialisation** | Exécution | *Comment sérialiser la composition admise ?* | Projection fidèle ; **aucune décision** de forme ni de sens |
| **Renderer lecteur** | Exécution | *Comment présenter l'artefact publié ?* | Consommation du manifest ; immutabilité — **voir contrat 06** |

**Invariant structurant :** seule la **visualSpec** porte le **sens médical** ; seule la **composition abstraite admise** (via VCCK) porte la **décision de forme** ; seule la **surface de matérialisation** produit la **représentation graphique** sérialisée.

### 4.1 Flux canonique (conceptuel)

```
contrat éditorial
        ↓
intention visuelle (Blueprint)
        ↓
visualSpec (sémantique + traçabilité + primitive déclarée)     ← contrat 05
        ↓
validation sémantique + grounding
        ↓
[ ADR-008 — VCCK ]
signature calculée → reconnaissance → capacité → composition abstraite
        ↓
surface de matérialisation (build) → artefact sérialisé (jetable)
        ↓
manifest / bloc pédagogique (liaison par identifiant)          ← contrat 04
        ↓
renderer lecteur (contrat 06)
```

Aucune étape ne **contourne** la précédente pour établir une autorité parallèle.

- Le **renderer lecteur** **ne lit pas** la visualSpec pour en inférer du sens médical ; il consomme les **figures officielles** déjà matérialisées ([contrat 06](06-RENDERER-AND-LEARNER-LAYER.md) §2.2).
- Aucune **surface de matérialisation** ne **contourne** VCCK pour produire une figure directement depuis la visualSpec.
- La **primitive déclarée** ne **court-circuite** jamais la reconnaissance — voir §9.

**Modèle historique abrogé :** la chaîne implicite « primitive → renderer → figure » n'est **plus** l'architecture de référence. La primitive fixe le **cadre sémantique** ; VCCK fixe l'**admission structurelle** ; le renderer **projette** une composition déjà admise.

---

## 5. Relation avec l'élément pédagogique et le walkthrough

### 5.1 Ancrage obligatoire

**Invariant structurant :** tout visuel officiel est **subordonné** à exactement un **élément pédagogique** identifié. Le lien est **par identifiant stable**, jamais par position ordinale, nom de fichier ou ordre de titre ([contrat 02](02-IDENTITY-AND-ANCHORS.md), [contrat 04](04-CHAPTER-PACKAGE.md) §10).

Un visuel **n'introduit pas** d'espace d'identifiants propre.

### 5.2 Complémentarité walkthrough / visuel

**Invariant fondamental :** le **walkthrough** est l'artefact **médicalement canonique** du bloc ; le visuel officiel est le **cœur pédagogique obligatoire** de tout MM et de toute Notion autonome. Le walkthrough guide la lecture du visuel, explicite son raisonnement et porte tous ses KP. Aucun des deux ne suffit seul à qualifier le bloc comme complet ([ADR-007](../adr/ADR-007-visual-centrality-for-mental-models-and-notions.md)).

| Propriété | walkthrough | visuel officiel |
|---|---|---|
| Obligation MM/Notion | **Requis** | **Requis** |
| Complétude du bloc | Nécessaire, non suffisant seul | Nécessaire, non suffisant seul |
| Contenu médical nouveau | Interdit hors traçabilité | **Interdit** s'il n'est pas aussi porté par le walkthrough |
| Absence | Bloc invalide | Fusion/reclassification ou bloc incomplet |

**Subordination vérifiable :** tout point de connaissance référencé par une unité sémantique du visuel publié est aussi référencé par le walkthrough du même bloc — les unités d'échafaudage explicites en sont exclues. Vérification au **packaging** ([contrat 04](04-CHAPTER-PACKAGE.md) §11).

**Interdit :** qu'un fait n'existe **uniquement** dans un visuel ([contrat 01](01-TRUST-AND-FIDELITY.md)).

### 5.3 Absence et échec

- **Absence d'intention graphique pour une Notion candidate** : fusion ou reclassification obligatoire ; elle ne reste pas une Notion autonome.
- **Absence du visuel d'un MM ou d'une Notion** : bloc incomplet et Release non qualifiable.
- **Échec technique de composition ou matérialisation** : le walkthrough peut rester accessible en état dégradé, sans produire de PASS éditorial — [contrat 04](04-CHAPTER-PACKAGE.md) §11, [contrat 01](01-TRUST-AND-FIDELITY.md) §10.3.
- **Non-reconnaissance VCCK** (UNRECOGNIZED / REJECTED) : pas de figure ; retour éditorial ou qualification de capacité — [ADR-008](../adr/ADR-008-vcck-industrial-composition-pipeline.md) §10. Ce refus **ne justifie pas** de simplifier la visualSpec pour entrer dans une capacité existante.
- **Complément secondaire différé** : autorisé seulement si le contrat éditorial démontre que le visuel maître ou central satisfait déjà la question canonique.

---

## 6. Intention visuelle (Blueprint)

La section **intentions visuelles** du Blueprint déclare **quels** éléments pédagogiques peuvent bénéficier d'un visuel et **quelle forme sémantique** (primitive) est appropriée — sans décrire le contenu des nœuds, des arêtes ou la mise en page ([contrat 04](04-CHAPTER-PACKAGE.md) §5.2).

Le Blueprint **décide si** et **quelle primitive sémantique** ; il **ne possède pas** la visualSpec ni la figure.

La **projection / placement** dans l'expérience apprenant relève du bloc pédagogique et du manifest ([contrat 04](04-CHAPTER-PACKAGE.md) §8) — hors périmètre sémantique de ce contrat.

---

## 7. Invariants sémantiques

[`VISUAL_GRAMMAR_CONTRACT.md`](../../VISUAL_GRAMMAR_CONTRACT.md) porte l'ensemble des invariants techniques détaillés. Au niveau gouvernance, **quatre principes** sont **non négociables** :

1. **Sens dans le spec, figure dans l'exécution** — tout sens médical du visuel **provient** de la visualSpec ; ni VCCK ni la surface de matérialisation n'autorisent de contenu médical auteur (la **présentation** relève du renderer lecteur — [contrat 06](06-RENDERER-AND-LEARNER-LAYER.md)).
2. **Traçabilité obligatoire** — toute unité sémantique porte une référence ou un échafaudage explicite ([contrat 02](02-IDENTITY-AND-ANCHORS.md)) ; la fidélité aux ancres relève du [contrat 01](01-TRUST-AND-FIDELITY.md).
3. **Valeur cognitive avant couverture** — un **visuel officiel** n'existe que si une structure relationnelle ou spatiale aide la compréhension ; son **absence** est une issue légitime et fréquente.
4. **Validation sémantique, pas esthétique** — on juge ce que le visuel *représente* et sa fidélité via la visualSpec, jamais la qualité graphique de la **figure matérialisée**.

Évolution de la grammaire, intégrité textuelle, débordement et multi-cibles de rendu : [`VISUAL_GRAMMAR_CONTRACT.md`](../../VISUAL_GRAMMAR_CONTRACT.md) — non redéfinis ici.

---

## 8. Validation et grounding

### 8.1 Objet de la validation

La validation d'un **visuel officiel** porte sur la **visualSpec** et ses liens — intégrité référentielle, **grounding** des unités sémantiques porteuses de sens médical ([contrat 01](01-TRUST-AND-FIDELITY.md)), **subordination** au **walkthrough** du bloc (§5.2), **conformité** à la primitive déclarée ([ADR-001](../adr/ADR-001-freeze-svg-grammar-catalogue.md)). Les mécanismes détaillés relèvent de [`VISUAL_GRAMMAR_CONTRACT.md`](../../VISUAL_GRAMMAR_CONTRACT.md) et du [contrat 04](04-CHAPTER-PACKAGE.md).

**Invariant structurant :** la justesse médicale d'un visuel se **revoit** via la **visualSpec** et ses verdicts — **sans** inspecter la **figure matérialisée**.

La validation **compositionnelle** (reconnaissance, capacité, contrat perceptuel) relève d'**ADR-008** — distincte de la validation sémantique définie ici.

### 8.2 Séparation proposition / vérification

La **sémantique** du visuel peut être **proposée** (typiquement assistée) ; elle est **vérifiée** indépendamment au niveau visualSpec. La **matérialisation** n'intervient qu'**après** validation sémantique **et** admission compositionnelle VCCK — jamais l'inverse. Frontière détaillée : [`VISUAL_GRAMMAR_CONTRACT.md`](../../VISUAL_GRAMMAR_CONTRACT.md) §6.5.

---

## 9. Frontière avec ADR-008 (VCCK)

[ADR-008](../adr/ADR-008-vcck-industrial-composition-pipeline.md) prend une **visualSpec validée** comme **entrée** du pipeline industriel de composition. Ce contrat définit cette entrée ; ADR-008 définit tout ce qui se passe **entre** la visualSpec et l'artefact publié.

### 9.1 Interface d'entrée

| Élément | Fourni par le contrat 05 | Consommé par ADR-008 |
|---|---|---|
| visualSpec validée (sémantique + traçabilité) | Oui | Oui — **seule entrée éditoriale** |
| Primitive déclarée | Oui — cadre sémantique | Contexte uniquement ; **ne filtre pas** la reconnaissance |
| Contrat éditorial / congruence bloc | Oui — amont | Vérifié en amont ; hors pipeline VCCK |

### 9.2 Ce que la visualSpec ne connaît jamais

Une visualSpec **ne contient**, **ne référence** et **ne présuppose** jamais :

- une **signature** structurelle (calculée par VCCK) ;
- une **reconnaissance** ou un verdict ADMITTED / REJECTED / UNRECOGNIZED ;
- une **capacité** qualifiée ou une **famille** structurelle ;
- un **contrat perceptuel** ;
- une **composition abstraite** ;
- une **surface de matérialisation** ou un renderer ;
- une preuve VCCK, un mutant ou un budget de composition.

Ces notions appartiennent **exclusivement** au domaine composition ([ADR-008](../adr/ADR-008-vcck-industrial-composition-pipeline.md)). Leur absence dans la visualSpec garantit que le **sens éditorial** reste stable lorsque VCCK évolue (nouvelles capacités, nouvelles surfaces, nouvelles preuves).

### 9.3 Conséquences de frontière

- VCCK **ne modifie jamais** la visualSpec pour forcer une admission.
- L'échec de reconnaissance **ne remet pas en cause** la validité sémantique intrinsèque d'une visualSpec — il signale un **décalage compositionnel** à résoudre ([ADR-008](../adr/ADR-008-vcck-industrial-composition-pipeline.md) §10.3).
- La **traçabilité de production** (capacité retenue, version du contrat perceptuel sur l'artefact publié) relève d'ADR-008 (I16) et du [contrat 04](04-CHAPTER-PACKAGE.md) — pas de la visualSpec.

---

## 10. Visuels et Chapter Package

Les règles de **build**, de **manifest** et de **publication** des visuels relèvent du [contrat 04](04-CHAPTER-PACKAGE.md) §9–§11. Ce contrat ne les redéfinit pas.

Rappel des dépendances conceptuelles :

- les **visualSpecs** validées sont des artefacts **persistés** du package ;
- les **figures officielles** sont des artefacts **générés** de build, produits **via VCCK** à partir de visualSpecs validées ;
- le **manifest** déclare disponibilité et liaisons explication↔visuel **par identifiant** ([contrat 04](04-CHAPTER-PACKAGE.md) §10–§11) ;
- la **subordination**, le **grounding**, la **centralité** et la **congruence** sont des gates de publication au niveau package ;
- l'échec du visuel n'annule pas la fidélité du walkthrough, mais bloque la complétude du bloc MM/Notion.

Un chapitre comprenant des MM ou des Notions ne peut être qualifié ni publié comme complet sans leurs visuels maîtres ou centraux construits, validés et congruents.

---

## 11. Limites du contrat

Ce contrat **ne définit pas** :

| Sujet | Document |
|---|---|
| Fidélité, grounding, fallback | [01](01-TRUST-AND-FIDELITY.md) |
| Identités, ancres, chaîne | [02](02-IDENTITY-AND-ANCHORS.md) |
| Acquisition | [03](03-ACQUISITION-SSOT.md) |
| Package, manifest, build, republication | [04](04-CHAPTER-PACKAGE.md) |
| Présentation lecteur, immutabilité | [06](06-RENDERER-AND-LEARNER-LAYER.md) |
| Signature, reconnaissance, capacité, famille, composition abstraite, contrats perceptuels, registre, preuves VCCK | [ADR-008](../adr/ADR-008-vcck-industrial-composition-pipeline.md) |
| Invariants I1–I12 détaillés, primitives CORE, schéma visualSpec | [`VISUAL_GRAMMAR_CONTRACT.md`](../../VISUAL_GRAMMAR_CONTRACT.md) |
| Catalogue par primitive, spécifications techniques | [`VISUAL_GRAMMAR_LIBRARY.md`](../../VISUAL_GRAMMAR_LIBRARY.md), [ADR-001](../adr/ADR-001-freeze-svg-grammar-catalogue.md) |
| Diagrammes personnels, notes inline | [06](06-RENDERER-AND-LEARNER-LAYER.md) — couche apprenant ; **jamais** des visuels officiels |

**Frontière apprenant :** un diagramme personnel ou une note inline **ne remplace, ne modifie et ne surcharge jamais** un visuel officiel ni un walkthrough ([contrat 06](06-RENDERER-AND-LEARNER-LAYER.md)).

---

## Sources consolidées

| Document | Apport consolidé |
|---|---|
| [`VISUAL_GRAMMAR_CONTRACT.md`](../../VISUAL_GRAMMAR_CONTRACT.md) | Séparation des couches ; invariants I1–I12 (référence) ; asymétrie walkthrough–visuel §5.1 ; statut et modèle du visualSpec §6 ; frontière déterminisme §6.5 ; grammaire ouverte §4 |
| [`IMPLEMENTATION_CONTRACT.md`](../../IMPLEMENTATION_CONTRACT.md) | Part B (bloc pédagogique, asymétrie walkthrough / visuel, subordination) ; C.3 (intentions visuelles) ; C.4 (Official Visual) ; renvois C.6/C.7 (non recopiés) |
| [ADR-001](../adr/ADR-001-freeze-svg-grammar-catalogue.md) | Gel du catalogue sémantique ; primitives comme cadre de la visualSpec |
| [ADR-007](../adr/ADR-007-visual-centrality-for-mental-models-and-notions.md) | Obligation visuelle MM/Notion ; congruence bloc |
| [ADR-008](../adr/ADR-008-vcck-industrial-composition-pipeline.md) | Pipeline composition en aval de la visualSpec ; frontière §9 |
| [`PHASE_0A_CONTRACT_AUDIT.md`](../PHASE_0A_CONTRACT_AUDIT.md) | Périmètre contrat 05 ; séparation des layers ; schéma visualSpec non gelé ; réconciliation catalogue gelé / grammaire ouverte |
