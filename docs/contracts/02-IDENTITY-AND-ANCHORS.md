# Contrat 02 — Identity & Anchors

| | |
|---|---|
| **Type** | Contrat fondamental normatif |
| **Statut** | Phase 0A — en vigueur |
| **Question unique** | Comment une information est-elle identifiée de manière stable dans Lou Médecine ? |
| **Index** | [`00-INDEX.md`](00-INDEX.md) |

Ce contrat consolide les invariants d'**identité** et de **référence vers la source**. Il décrit la **structure** de ces mécanismes — jamais leur validation (voir [contrat 01 — Trust & Fidelity](01-TRUST-AND-FIDELITY.md)).

En cas de conflit avec un document non listé dans les sources consolidées, les sources consolidées et les ADR de gouvernance priment selon [`00-INDEX.md`](00-INDEX.md).

**Terminologie.** Dans ce contrat, les termes *identité*, *ancre source*, *point de connaissance*, *élément pédagogique*, *bloc pédagogique*, *bloc de claim*, *projection*, *édition* (du Collège), *révision* (de contenu) et *provenance* (de génération) sont employés au sens défini ici. Les autres contrats reprennent ces définitions et ne les redéfinissent pas.

---

## 1. Principe

Tout objet métier adressable — chapitre, point de connaissance, élément pédagogique, projection, bloc de claim — possède une **identité stable**, **opaque** et **non positionnelle**.

Tout lien vers le Collège officiel passe par une **ancre source** résistante au reformatage du texte.

Tout contenu généré orienté apprenant se résout le long d'une **chaîne de traçabilité stockée** — jamais recomputée à la volée, jamais fondée sur un ordre de fichier ou un numéro de ligne.

**Frontière :** ce contrat ne définit pas si un contenu est fidèle ou publiable — seulement **comment il est nommé et référencé**.

---

## 2. Quatre concepts distincts

Quatre notions ne doivent **jamais** être confondues :

| Concept | Définition | Évolue quand | Portée |
|---|---|---|---|
| **Identité stable** | Nom durable d'un chapitre, d'un point de connaissance ou d'un élément pédagogique | **Jamais** — identités permanentes, jamais réutilisées | Identifiants de chapitre, de points de connaissance et d'éléments pédagogiques |
| **Édition du Collège** | Édition publiée du texte source dont provient un fait | Le Collège republie | Champ sur la source et historique par point de connaissance |
| **Révision de contenu** | Révision des artefacts curatés (inventaire, Blueprint) | Re-curation après diff d'édition ou amélioration pédagogique | Tampon de révision sur inventaire et Blueprint |
| **Provenance de génération** | Triplet édition du Collège × révision de contenu (Blueprint) × version de méthodologie ayant produit une projection | Toute régénération | Tampon sur chaque artefact généré |

**Invariant :** l'identité est **permanente et indépendante de l'édition** ; le texte source qu'un point de connaissance cite est **éditionné** et peut changer ; la curation porte une **révision** propre.

Les données apprenant futures (maîtrise, répétition espacée) s'attachent à l'**identité**, pas à l'édition.

---

## 3. Identifiants de chapitre

### 3.1 Forme

L'identité d'un chapitre est `specialty/item` — par exemple `cardio/234`.

**Propriétés :**

- stable et lisible pour un humain ;
- survit à toutes les éditions du Collège ;
- **ne dépend pas** d'un slug, d'un titre affiché ou d'un chemin de fichier.

### 3.2 Alias

Un slug ou titre d'affichage (ex. `234-insuffisance-cardiaque`) est un **alias de présentation**, pas une identité.

**Interdit :** utiliser un alias comme clé de traçabilité ou de persistance apprenant.

---

## 4. Identifiants de points de connaissance (KP)

### 4.1 Forme

Identifiant **local au chapitre**, opaque, minté **une seule fois** à la création — par exemple `KP-047` ou, en forme qualifiée, `cardio/234#KP-047`.

### 4.2 Invariants

| Règle | Énoncé |
|---|---|
| **Unicité** | Aucun doublon ni réutilisation d'un identifiant retiré. |
| **Non-positionnalité** | L'identité ne encode pas un rang, un ordre de leçon ou une position dans un fichier. |
| **Permanence** | Un point de connaissance conserve **une identité à vie**. |
| **Granularité figée** | La granularité des points de connaissance est un choix **irréversible** dès qu'une donnée apprenant peut s'y attacher. |

Un libellé humain peut accompagner l'identifiant ; il **n'est pas** l'identité.

### 4.3 Historique d'édition (structure)

Chaque point de connaissance porte l'**historique canonique** des changements d'édition qui le concernent : type de changement, bande de confiance, éditions vues, lignée en cas de scission ou fusion (§10).

**Interdit :** dupliquer ces informations ailleurs comme source d'autorité (badges apprenant dérivés au packaging — voir [contrat 04](04-CHAPTER-PACKAGE.md)).

---

## 5. Identifiants d'éléments pédagogiques

### 5.1 Forme

Identifiants **locaux au chapitre**, mintés **uniquement** lorsqu'un processus aval doit référencer l'élément pédagogique — projections, visuels officiels, navigation.

Préfixes conventionnels (non exhaustifs) : `MM-*` (modèle mental), `MEC-*` (mécanisme), `CR-*` (raisonnement clinique), `CONF-*` (confusion), `ANA-*` (analogie), `ACT-*` (acteur).

Forme qualifiée : `cardio/234#MEC-oap`.

### 5.2 Invariants

| Règle | Énoncé |
|---|---|
| **Mintage minimal** | Tout paragraphe ou section **n'obtient pas** d'identifiant par défaut. |
| **Permanence** | Même règle de non-réutilisation que les points de connaissance. |
| **Bloc pédagogique** | Unité d'expérience présentée à l'apprenant (question, visuel officiel optionnel, walkthrough). **N'introduit pas** d'espace d'identifiants supplémentaire : partage l'identité de l'**élément pédagogique** issu du Blueprint. |

---

## 6. Identifiants de projections

### 6.1 Registre de projection

Chaque projection publiée possède dans le registre du chapitre :

- un **identifiant de projection** stable dans le chapitre ;
- un **type** (famille sémantique — ex. compréhension, maîtrise future) ;
- un **ordre** pédagogique relatif aux autres projections.

L'identifiant de projection **n'est pas** un identifiant médical global.

### 6.2 Adressage du contenu

Le contenu d'une projection de compréhension s'adresse par la **combinaison** du type de projection et des **identifiants d'éléments pédagogiques** qu'elle projette — pas par position ordinale dans un fichier.

**Interdit :** lier une explication ou un visuel à un contenu par index de tableau, numéro de fichier ou ordre de titre seul ([contrat 05](05-VISUAL-GRAMMAR.md) pour le cas visuel).

---

## 7. Blocs de claim

### 7.1 Définition

Le **bloc de claim** est la plus petite unité orientée apprenant qui requiert une **traçabilité indépendante** — pas chaque phrase isolée.

Selon la projection, un bloc peut être : un paragraphe, une étape de mécanisme, une ligne de tableau, une comparaison, un nœud sémantique visuel, une réponse de QCM, une flashcard, un seuil exact, etc.

Un bloc **peut contenir plusieurs phrases** lorsqu'elles forment une idée cohérente sourçable.

### 7.2 Granularité sentence-level

Lorsqu'une **phrase seule** porte un fait à haute spécificité (seuil exact, classification, contre-indication, recommandation thérapeutique), cette phrase **constitue** son propre bloc de claim.

### 7.3 Identifiant de bloc

Chaque bloc de claim généré porte un **identifiant de bloc de claim** stable et non positionnel au sein de sa projection (locator de claim).

**Frontière :** les **classes** de claim (`sourced`, `scaffolding`, `bridging`) et leur vérification relèvent du [contrat 01](01-TRUST-AND-FIDELITY.md).

---

## 8. Ancres source

### 8.1 Modèle

Une ancre source **n'est pas** un numéro de ligne. C'est le triplet :

```
{ edition, section_path, quote }
```

| Composant | Rôle |
|---|---|
| **edition** | Identifiant de l'édition du Collège (ex. année ou label éditeur). |
| **section_path** | Localisateur structurel grossier dans le chapitre (chemin de sections). |
| **quote** | Citation **verbatim** assez longue pour relocaliser le fait si la mise en forme change. |

([ADR-004](../adr/ADR-004-acquisition-architecture-frozen.md) NP-5 ; modèle `section_path` gelé avec l'acquisition — détail d'acquisition : [contrat 03](03-ACQUISITION-SSOT.md).)

### 8.2 Invariants

| Règle | Énoncé |
|---|---|
| **Résilience** | En cas de reflow du texte, `quote` et `section_path` relocalisent le fait ; un numéro de ligne éventuel n'est qu'un **pointeur de commodité**, jamais l'identifiant de l'ancre source. |
| **Verbatim** | La citation reproduit le texte source sans paraphrase dans le rôle d'ancre source. |
| **SSOT** | Pour une même donnée métier source, **une seule** chaîne d'autorité textuelle ([ADR-003](../adr/ADR-003-single-source-of-truth.md)). |

### 8.3 Portée

Tout point de connaissance référence **au moins une** ancre source.

Tout fait porté par un artefact métier **doit** pouvoir se résoudre, par identifiants stockés, vers une **ancre source** conforme au modèle du §8.1.

**Frontière :** la **résolution** et la **vérification** des ancres (unicité, présence dans le texte) relèvent du [contrat 01](01-TRUST-AND-FIDELITY.md) et du [contrat 04](04-CHAPTER-PACKAGE.md) — pas de ce contrat.

---

## 9. Chaîne de traçabilité structurelle

### 9.1 Enchaînement

Tout bloc de claim orienté apprenant se résout **vers la gauche** le long de la chaîne suivante, par **références d'identifiants stockées** :

```
ancre source  ←  point(s) de connaissance  ←  élément pédagogique (si applicable)  ←  bloc de claim de projection
```

| Maillon | Présence |
|---|---|
| **Ancre source** | Toujours, via le(s) point(s) de connaissance référencé(s). |
| **Point de connaissance** | Toujours pour un bloc de claim généré porteur de sens médical. |
| **Élément pédagogique** | Requis pour les projections de **compréhension** ; **optionnel** pour un item de maîtrise ancré directement sur un point de connaissance. |
| **Bloc de claim** | Extrémité orientée apprenant. |

### 9.2 Stockage

La chaîne complète est **matérialisée et persistée** au packaging — jamais recomputée à l'affichage à partir de heuristiques de position.

**Frontière :** le **format** et l'**emplacement** du graphe stocké relèvent du [contrat 04](04-CHAPTER-PACKAGE.md). L'**exploitation** à l'affichage relève du [contrat 06](06-RENDERER-AND-LEARNER-LAYER.md).

### 9.3 Provenance de génération

Tout artefact généré porte un tampon de **provenance de génération** :

```
{ source_edition, blueprint_revision, methodology_version }
```

Ce tampon prouve la **lignée** de production ; il ne prouve pas à lui seul la **validité courante** du chapitre assemblé après une mise à jour d'édition (règles de republication : [contrat 04](04-CHAPTER-PACKAGE.md)).

---

## 10. Continuité d'identité entre éditions

### 10.1 Principe

Lorsqu'une nouvelle édition du Collège est ingérée, chaque point de connaissance reçoit **exactement une** classification de changement — plus une **bande de confiance** sur la continuité sémantique de l'identité.

**Invariant load-bearing :** l'identité stable **ne se préserve jamais** parce que deux passages **se ressemblent**. La continuité d'identité reflète une continuité **sémantique**.

### 10.2 Classifications de changement

| Type | Signification structurelle |
|---|---|
| **unchanged** | Sens identique ; conserver identité et contenu ; mettre à jour l'édition vue. |
| **moved / reformatted** | Sens inchangé ; localisation ou formulation source modifiée ; mettre à jour l'ancre source. |
| **modified** | Sens modifié ; conserver identité ; réviser contenu ; marquer les dépendants. |
| **new** | Aucune identité antérieure ; mintage d'une nouvelle identité. |
| **removed** | Présent avant, absent maintenant ; **retirer** l'identité (jamais supprimer ni réutiliser). |
| **split** | Un point de connaissance devient plusieurs ; l'identité d'origine est retirée et la lignée consignée — ou un enfant conserve l'identité, les autres sont nouveaux. |
| **merged** | Plusieurs points de connaissance deviennent un ; la lignée de tous les prédécesseurs est consignée sur le survivant. |

### 10.3 Bandes de confiance

| Bande | Signification |
|---|---|
| **High** | Sens identique ou quasi identique ; continuation automatique de l'identité admise — typiquement `unchanged` ou `moved/reformatted`. |
| **Medium** | Probablement le même fait sous-jacent ; réconciliation approfondie requise avant de continuer l'identité. |
| **Low / ambiguous** | Scission, fusion ou changement de portée possible ; **re-analyse élargie** avant toute décision d'identité. |

**Interdit :** continuer automatiquement une identité lorsque la confiance est medium ou low.

### 10.4 Propagation le long de la chaîne

Une modification sur un point de connaissance se propage **à l'envers** le long de la chaîne de traçabilité (§9) :

point de connaissance → éléments pédagogiques référencés → projections et visuels qui les référencent.

Seuls les artefacts **atteints** par le changement sont concernés par une re-vérification ou une régénération.

**Frontière :** les **critères de retenue ou de publication** après mise à jour relèvent du [contrat 04](04-CHAPTER-PACKAGE.md) et du [contrat 01](01-TRUST-AND-FIDELITY.md).

### 10.5 Retrait d'identité

Une identité **retirée** est marquée comme telle (`retired-as-of-edition` ou équivalent sémantique) — **jamais** effacée ni réassignée.

Même discipline pour les artefacts apprenant dont la **référence structurelle** ne résout plus : état **orphelin** visible — jamais suppression silencieuse ([contrat 06](06-RENDERER-AND-LEARNER-LAYER.md)).

---

## 11. Références apprenant (structure uniquement)

Les contenus strictement apprenant (non générés) **n'introduisent pas** d'espace d'identifiants médicaux. Ils s'ancrent aux identifiants **existants** :

| Mécanisme | Ancrage structurel |
|---|---|
| Diagramme personnel | Identifiant d'**élément pédagogique**. |
| Note inline | Paire **(identifiant d'élément pédagogique, identifiant de bloc de claim)**. |
| Surlignages / annotations textuelles | Ancrage dans le **walkthrough** officiel — mécanisme et règles : [contrat 06](06-RENDERER-AND-LEARNER-LAYER.md) §8.3. |

**Frontière :** règles de couche apprenant, immutabilité et affichage — [contrat 06](06-RENDERER-AND-LEARNER-LAYER.md). Ces références **ne participent pas** à la chaîne de traçabilité médicale (§9).

---

## 12. Limites du schéma d'identité

### 12.1 Pas d'espace global inter-chapitres

Aucun identifiant médical global transversal (ontologie, entités partagées entre chapitres) n'est introduit à ce stade.

Le schéma **n'interdit pas** une promotion ultérieure vers un référentiel partagé par décision de gouvernance explicite.

### 12.2 Pas de validation ici

Ce contrat **ne définit pas** :

| Sujet | Contrat |
|---|---|
| Classes de claims, grounding, réconciliation, publication | [01 — Trust & Fidelity](01-TRUST-AND-FIDELITY.md) |
| Chaîne d'acquisition, Tools | [03 — Acquisition SSOT](03-ACQUISITION-SSOT.md) |
| Inventaire, Blueprint, registre de projections, manifest, gates build | [04 — Chapter Package](04-CHAPTER-PACKAGE.md) |
| Identifiants et trace des unités visuelles | [05 — Visual Grammar](05-VISUAL-GRAMMAR.md) |
| Lecture du graphe de traçabilité par le lecteur | [06 — Renderer & Learner Layer](06-RENDERER-AND-LEARNER-LAYER.md) |

---

## Sources consolidées

| Document | Apport consolidé |
|---|---|
| [`IMPLEMENTATION_CONTRACT.md`](../../IMPLEMENTATION_CONTRACT.md) | Part B (schéma d'identité, ancre, bloc de claim, chaîne de traçabilité, tampon de provenance, bloc pédagogique) ; Part D ; Part A.2 (quatre concepts, classifications d'édition, confiance, lignée, origine canonique sur KP) |
| [`ADR-003`](../adr/ADR-003-single-source-of-truth.md) | SSOT appliqué aux ancres et autorités source |
| [`ADR-004`](../adr/ADR-004-acquisition-architecture-frozen.md) | Modèle d'ancre `{ edition, section_path, quote }` (NP-5) ; modèle `section_path` |
| [`SOURCE_OF_TRUTH.md`](../SOURCE_OF_TRUTH.md) | Règle SSOT sur ancres et manifests |
| [`PHASE_0A_CONTRACT_AUDIT.md`](../PHASE_0A_CONTRACT_AUDIT.md) | Périmètre contrat 02 vs 01 et 04–06 ; frontières claim block / identité |
