# Contrat 01 — Trust & Fidelity

| | |
|---|---|
| **Type** | Contrat fondamental normatif |
| **Statut** | Phase 0A — en vigueur |
| **Question unique** | Comment le système garantit-il que tout contenu produit reste fidèle à la source officielle ? |
| **Index** | [`00-INDEX.md`](00-INDEX.md) |

Ce contrat consolide les invariants de confiance et de fidélité déjà ratifiés. Il ne redéfinit pas l'architecture. En cas de conflit avec un document non listé dans les sources consolidées, les sources consolidées et les ADR de gouvernance priment selon [`00-INDEX.md`](00-INDEX.md).

**Priorité absolue :** en cas de conflit entre fidélité au Collège et tout autre objectif pédagogique ou technique, **la fidélité au Collège l'emporte.**

---

## 1. Modèle de confiance

### 1.1 Principe

Aucun médecin ne relit les chapitres produits. Les apprenants et le responsable du projet ne sont pas qualifiés pour certifier la justesse médicale d'un contenu généré.

Le système **ne définit donc pas** la correction médicale comme « un humain a confirmé que c'est vrai ».

Il la définit comme **fidélité à la source officielle du Collège** : le texte du Collège est la **seule autorité curriculaire médicale** ; tout énoncé médical présenté à l'apprenant n'est digne de confiance **que dans la mesure où il est traçable vers cette source et cohérent avec elle**.

### 1.2 Conséquence

La fiabilité médicale du projet repose entièrement sur un **processus automatisé d'assurance de fidélité à la source** — pas sur une relecture humaine du fond médical.

---

## 2. Autorité et périmètre de la fidélité

### 2.1 Source officielle

Toute garantie de fidélité part du **contenu officiel du Collège**, acquis selon la chaîne unique définie dans le [contrat 03 — Acquisition SSOT](03-ACQUISITION-SSOT.md) et [ADR-004](../adr/ADR-004-acquisition-architecture-frozen.md).

**Interdit :** introduire une seconde autorité sur le contenu officiel ; corriger manuellement le texte source pour des raisons de formatage ou d'esthétique ([ADR-004](../adr/ADR-004-acquisition-architecture-frozen.md) NP-6).

**Règle SSOT :** pour une même donnée métier, une seule source officielle ([ADR-003](../adr/ADR-003-single-source-of-truth.md), [`SOURCE_OF_TRUTH.md`](../SOURCE_OF_TRUTH.md)).

### 2.2 Suffisance, pas reproduction

La couche d'acquisition et, plus largement, le pipeline, préservent l'**information métier examinable** du Collège. Elles n'ont pas pour mission de reproduire la mise en page ou l'apparence du document éditeur ([ADR-004](../adr/ADR-004-acquisition-architecture-frozen.md) NP-1 à NP-3 ; [`SOURCE_PIPELINE_QUALIFICATION.md`](../SOURCE_PIPELINE_QUALIFICATION.md) §0).

Une imperfection de représentation **n'est pas un défaut de fidélité** tant qu'elle n'entraîne ni perte d'information métier, ni impossibilité démontrée de produire correctement les artefacts aval.

### 2.3 Contenu couvert

Ce contrat s'applique à **tout contenu généré** destiné à l'apprenant — projections de compréhension, contenus de maîtrise futurs, unités sémantiques visuelles officielles — dès lors qu'il porte ou paraît porter un sens médical.

**Hors champ :** contenu strictement apprenant (couche locale, non générée) — voir [contrat 06 — Renderer & Learner Layer](06-RENDERER-AND-LEARNER-LAYER.md).

---

## 3. Cinq obligations de fidélité

Chaque obligation est vérifiable **sans expertise médicale**.

| Obligation | Énoncé |
|---|---|
| **Complétude** | Aucune information source importante n'est abandonnée silencieusement. |
| **Grounding** | Tout énoncé médical généré est étayé par la source. |
| **Traçabilité** | Tout bloc de claim orienté apprenant se résout jusqu'à un passage source identifié. |
| **Cohérence** | Aucune projection ne contredit la source ni le contenu curaté dont elle dérive. |
| **Incertitude** | Tout contenu non étayable de façon fiable est traité sans fausse confiance. |

La **traçabilité** repose sur une chaîne de références stockée — jamais recomputée à la volée, jamais positionnelle. Sa structure et ses identifiants relèvent du [contrat 02 — Identity & Anchors](02-IDENTITY-AND-ANCHORS.md). Sa matérialisation au packaging relève du [contrat 04 — Chapter Package](04-CHAPTER-PACKAGE.md).

---

## 4. Assurance automatisée de fidélité à la source

La fidélité ne repose **jamais** sur une seule passe de génération. Trois processus distincts, exécutables indépendamment :

### 4.1 Extraction

Une passe produit l'inventaire des faits examinables à partir de la source officielle — chaque fait ancré vers la source.

*Artefact et schéma :* [contrat 04](04-CHAPTER-PACKAGE.md).

### 4.2 Réconciliation de couverture

Une passe **séparée** prend la source officielle **et** l'inventaire produit, et assigne **section par section** à chaque segment source pertinent **exactement une disposition** (§5).

Cette passe doit pouvoir **contredire** l'extraction : idéalement par un processus indépendant (prompt, modèle ou méthode distincts).

**Objectif :** la complétude est une propriété **réconciliée**, pas une auto-déclaration de l'extracteur.

### 4.3 Assurance de grounding

Tout contenu généré structuré (projections, et le cas échéant unités sémantiques visuelles) reste rattaché à des preuves source via la chaîne de traçabilité (§3).

Tout contenu qui ne peut être rattaché à une ancre source, ou dont le rattachement est ambigu, est **signalé** — jamais accepté silencieusement.

---

## 5. Réconciliation de couverture

### 5.1 Dispositions des segments source

Ce niveau porte sur les **segments source** lors de la réconciliation. Il est **distinct** des dispositions des **points de connaissance** dans l'inventaire ([contrat 04](04-CHAPTER-PACKAGE.md) §4.3) : deux niveaux du pipeline, vocabulaires différents, logique analogue de couverture.

Chaque segment source pertinent reçoit **une et une seule** disposition :

| Disposition | Signification |
|---|---|
| **represented** | Un point de connaissance couvre le segment. |
| **intentionally-deferred** | Capturé mais routé vers la maîtrise (hors expérience de compréhension immédiate). |
| **excluded-with-justification** | Hors périmètre ; raison consignée. |
| **missed** | Aucun point de connaissance ne couvre le segment — **défaut de fidélité**. |
| **ambiguously-mapped** | Correspondance candidate, confiance insuffisante de la passe de réconciliation. |

### 5.2 Invariants

- Tout segment pertinent possède une disposition explicite.
- Tout point de connaissance possède une disposition déclarée (compréhension, report maîtrise, ou exclusion justifiée) — voir [contrat 04](04-CHAPTER-PACKAGE.md) §4.3.
- Une disposition **missed** non résolue **interdit** la publication (§10).
- Une disposition **ambiguously-mapped** non résolue au-delà du seuil du chapitre **interdit** la publication (§10).

### 5.3 Persistance

Les résultats de réconciliation sont **persistés** et **relus** au packaging. Ils ne sont pas une opinion éphémère du générateur.

---

## 6. Classes de claims

### 6.1 Unité porteuse

L'unité qui porte une classe et une référence de traçabilité est le **bloc de claim** — pas chaque phrase isolée. Définition structurelle : [contrat 02](02-IDENTITY-AND-ANCHORS.md).

Tout bloc de claim de **contenu généré** porte **exactement une** des trois classes suivantes, **explicitement déclarée**.

### 6.2 Les trois classes

| Classe | Règle |
|---|---|
| **sourced** | Reformulation du Collège. Doit référencer au moins un point de connaissance et **passer** le grounding (§7). |
| **scaffolding** | Analogie, cadrage ou simplification pédagogique. **Non** attribuée au Collège ; présentable comme intuition. **Non** vérifiée comme un fait ; **ne doit pas** contredire un claim `sourced`. |
| **bridging** | Lien causal ou explicatif non verbatim dans la source. **Autorisé** seulement si le grounding juge l'inférence **entraînée** par les points de connaissance référencés. Sinon : reclassification ou suppression (§8). |

**Interdit :** une quatrième classe implicite ; présenter un claim non sourcé comme `sourced`.

---

## 7. Grounding et cohérence

### 7.1 Séparation génération / vérification

La génération produit le contenu à partir du plan pédagogique curaté ([contrat 04](04-CHAPTER-PACKAGE.md)).

La **vérification** est une passe **distincte**, exécutée **après** la génération, disposant des ancres source et habilitée à **faire échouer** le packaging.

**Interdit :** qu'un générateur certifie sa propre sortie comme fidèle.

### 7.2 Jugements de la passe de vérification

Pour chaque bloc de claim, sa classe, et les citations source de ses points de connaissance référencés, la passe rend un verdict :

- un claim **sourced** est-il étayé par la citation ?
- un claim **bridging** est-il entraîné par les citations ?
- les nombres, seuils et classifications correspondent-ils entre prose et source ?

**Sorties possibles :** succès ; reclassification (downgrade) ; échec — alimentant le fallback (§8).

Un bloc regroupant plusieurs phrases est vérifié **comme unité**. Lorsqu'une phrase isolée porte un fait à haute spécificité (seuil exact, classification, recommandation), elle constitue son propre bloc de claim ([contrat 02](02-IDENTITY-AND-ANCHORS.md)).

---

## 8. Fallback conservateur

Lorsqu'un énoncé requis ne peut être étayé de façon fiable, le pipeline applique **dans l'ordre** :

1. **Omettre** l'énoncé.
2. **Le reformuler** en cadrage pédagogique ouvert, clairement non attribué au Collège.
3. **Citer la source** verbatim et s'arrêter d'interpréter.

**Interdit :** émettre une interprétation non étayée comme un fait `sourced` ; fabriquer de la certitude.

**Principe :** préférer une lacune honnête à une fabrication confiante.

### 8.1 Comportement face à l'ambiguïté non résolue

Face à un segment **missed** ou **ambiguously-mapped**, ou à un échec de grounding, le système **ne manufacture pas de certitude**. Il privilégie, avant échec définitif :

- un rapprochement vers la formulation source ;
- une re-analyse élargie (re-extraction, re-réconciliation, re-curation du périmètre affecté) ;
- une explicitation de l'incertitude ;
- la suppression du contenu interprétatif concerné.

---

## 9. Gestion des ambiguïtés

### 9.1 Ambiguïté de couverture

Segment **ambiguously-mapped** : la réconciliation signale une correspondance incertaine. Tant que l'ambiguïté persiste au-delà du seuil du chapitre, le chapitre est **retenu** (§10).

### 9.2 Ambiguïté de grounding

Contenu généré dont le lien source est incertain : **signalé**, jamais publié comme fait établi.

### 9.3 Seuil de chapitre

Lorsque les dispositions **missed** / **ambiguously-mapped** non résolues, ou les échecs de grounding, **dépassent le seuil défini pour le chapitre**, le packaging **échoue** et le chapitre est **retenu** plutôt qu'expédié.

Le seuil est une **entrée déclarée** du package chapitre — pas une décision ad hoc sur la sortie ([`IMPLEMENTATION_CONTRACT.md`](../../IMPLEMENTATION_CONTRACT.md) Part A.1).

---

## 10. Critères de publication

### 10.1 Publication autorisée

Un chapitre n'est publiable que si :

- la réconciliation de couverture est **valide** (§5) ;
- tout bloc de claim requis passe le grounding applicable, ou est traité par fallback (§8) ;
- la chaîne de traçabilité est **complète et stockée** pour le contenu publié ;
- les invariants de cohérence numérique et classification sont **satisfaits**.

Les détails de packaging, manifest et sidecars : [contrat 04](04-CHAPTER-PACKAGE.md).

### 10.2 Retenue obligatoire

**Bloque** la publication :

- segment source **missed** non résolu ;
- ambiguïté de couverture ou de grounding **non résolue** au-delà du seuil ;
- échec de grounding sur un **walkthrough** ou tout contenu canonique requis ;
- référence de traçabilité **cassée** ;
- contradiction vérifiable avec la source ou l'inventaire curaté.

### 10.3 Exception — contenu visuel officiel optionnel

L'échec d'un **visuel officiel optionnel** — validation, grounding ou éligibilité de rendu — **n'invalide pas** la publication d'un walkthrough par ailleurs valide.

**Conditions cumulatives :**

- l'échec est **rapporté** et persiste dans l'état du package ;
- tout contenu visuel obsolète ou non vérifié est **retiré** — jamais laissé en place comme s'il était courant ;
- la traçabilité et les résultats de vérification **restent intacts**.

Règles visuelles détaillées : [contrat 05 — Visual Grammar](05-VISUAL-GRAMMAR.md).

### 10.4 Artefacts générés

**Interdit :** modifier manuellement un artefact produit par le pipeline pour corriger une fidélité ou un grounding. On corrige les **outils** et on **régénère** ([`IMPLEMENTATION_CONTRACT.md`](../../IMPLEMENTATION_CONTRACT.md) Part A.1).

---

## 11. Canal de décision humaine

### 11.1 Ce qu'un humain ne décide jamais

**Interdit** de conditionner la publication à :

- une certification que le contenu est médicalement vrai ;
- une attestation qu'aucun fait important n'a été omis ;
- une validation de rang ou de classification EDN.

Le build **n'attend pas** qu'un humain garantisse la correction médicale.

### 11.2 Exceptions machine

Lorsque le pipeline **lève lui-même** une exception (conflit source, segment ambigu, grounding indécidable), une décision humaine n'est admise **que si** :

1. elle référence l'**identifiant d'exception** levé par la machine ;
2. elle est **relue** par le build (régénération à entrées identiques = même résultat) ;
3. elle est **justifiée par écrit** et limitée à ce que les humains peuvent juger ;
4. elle est **comptabilisée**.

Une décision humaine est une **entrée versionnée** du pipeline — jamais une retouche de sa sortie ([`IMPLEMENTATION_CONTRACT.md`](../../IMPLEMENTATION_CONTRACT.md) Part A.1).

Si une **même classe d'exception** se répète sur plusieurs chapitres, c'est un **défaut d'outil** — pas une décision à multiplier au niveau du corpus.

### 11.3 Feedback humain borné

Le feedback humain porte sur la **clarté**, la **charge cognitive**, l'**utilité** et le caractère **confus** des explications ou diagrammes — jamais sur la correction médicale.

Les humains **peuvent** inspecter les exceptions signalées par la machine et donner un feedback de clarté ; ils **ne sont pas tenus** de certifier le fond médical.

Le feedback déclenche **régénération, re-réconciliation ou re-curation** — pas d'édition in place des faits médicaux dans les artefacts générés.

---

## 12. Hors périmètre de ce contrat

Ce contrat **ne définit pas** :

| Sujet | Contrat propriétaire |
|---|---|
| Identifiants, ancres, blocs de claim (structure) | [02 — Identity & Anchors](02-IDENTITY-AND-ANCHORS.md) |
| Chaîne d'acquisition, Tools, grille P1–P7 | [03 — Acquisition SSOT](03-ACQUISITION-SSOT.md) |
| Inventory, Blueprint, projections, manifest, build | [04 — Chapter Package](04-CHAPTER-PACKAGE.md) |
| Grammaire visuelle, visualSpec, rendu | [05 — Visual Grammar](05-VISUAL-GRAMMAR.md) |
| Renderer, couche apprenant | [06 — Renderer & Learner Layer](06-RENDERER-AND-LEARNER-LAYER.md) |
| Mises à jour d'édition (identités, diff, cohérence globale) | [02](02-IDENTITY-AND-ANCHORS.md) et [04](04-CHAPTER-PACKAGE.md) |
| Distinction exhaustif (inventaire) / manageable (blueprint) | [04 — Chapter Package](04-CHAPTER-PACKAGE.md) |

---

## Sources consolidées

| Document | Apport consolidé |
|---|---|
| [`IMPLEMENTATION_CONTRACT.md`](../../IMPLEMENTATION_CONTRACT.md) | Part A.1 ; mécanismes de claim, grounding et fallback (Part B, extrait fidélité) ; publication visuelle optionnelle (C.6, extrait gates) |
| [`ADR-003`](../adr/ADR-003-single-source-of-truth.md) | Principe SSOT |
| [`ADR-004`](../adr/ADR-004-acquisition-architecture-frozen.md) | NP-1 à NP-6 (fidélité information métier, traçabilité, primauté contenu) |
| [`SOURCE_OF_TRUTH.md`](../SOURCE_OF_TRUTH.md) | Règle SSOT permanente |
| [`SOURCE_PIPELINE_QUALIFICATION.md`](../SOURCE_PIPELINE_QUALIFICATION.md) | Philosophie suffisance aval (§0) |
| [`IMPLEMENTATION_CONTRACT.md`](../../IMPLEMENTATION_CONTRACT.md) | Part A.1 — invariants pipeline et canal de décision humaine (consolidés §10–§11) |
| [`PHASE_0A_CONTRACT_AUDIT.md`](../PHASE_0A_CONTRACT_AUDIT.md) | Périmètre contrat 01 vs 02–06 |
