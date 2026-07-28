# Contrat 03 — Acquisition SSOT

| | |
|---|---|
| **Type** | Contrat fondamental normatif |
| **Statut** | Phase 0A — en vigueur |
| **Question unique** | Que garantit l'acquisition au reste du système ? |
| **Index** | [`00-INDEX.md`](00-INDEX.md) |

Ce contrat consolide les **obligations permanentes de l'interface de sortie de l'acquisition**. Il décrit ce que les couches aval **peuvent considérer comme garanti** — jamais comment l'acquisition est implémentée.

En cas de conflit avec un document non listé dans les sources consolidées, les sources consolidées et les ADR de gouvernance priment selon [`00-INDEX.md`](00-INDEX.md).

---

## Frontières documentaires

| Document | Rôle |
|---|---|
| [ADR-004](../adr/ADR-004-acquisition-architecture-frozen.md) | Décisions de gouvernance ayant gelé l'architecture d'acquisition — contexte, preuves, politique de modification |
| **Ce contrat (03)** | Obligations permanentes de la couche acquisition vis-à-vis de l'aval |
| [Contrats composants Tool](../../01-learning/tools/01-pdf-to-canonical/CONTRACT.md) | Implémentation des garanties par outil — ne définissent pas l'interface projet seuls |
| [Contrat 04 — Chapter Package](04-CHAPTER-PACKAGE.md) | Consomme les résultats de cette interface ; **ne dépend pas** de l'implémentation interne des Tools |

**Frontière aval :** l'acquisition fournit le **texte officiel segmenté**, l'**édition**, la **provenance** et un **index structurel** suffisant pour l'ancrage ([contrat 02](02-IDENTITY-AND-ANCHORS.md)). Elle ne fournit pas l'inventaire, le blueprint, les projections ni le manifest de chapitre métier.

---

## 1. Source of Truth officielle

### 1.1 Règle permanente

Pour une même **donnée métier** relative au Collège officiel, **une seule source autoritaire** existe dans le système ([ADR-003](../adr/ADR-003-single-source-of-truth.md), [`SOURCE_OF_TRUTH.md`](../SOURCE_OF_TRUTH.md)).

Toute duplication est explicitement :

- une **copie de travail temporaire** ;
- un **artefact historique** ;
- ou un **fichier généré**.

**Interdit :** qu'une duplication devienne une **seconde autorité**.

### 1.2 Source primaire

La **source primaire immuable** est le document publié par l'éditeur EDN (PDF aujourd'hui ; autre format demain uniquement via nouvelle qualification — voir §9).

Aucune couche aval ne peut rivaliser avec cette autorité en relisant directement le PDF lorsque les artefacts textuels officiels de l'acquisition existent déjà.

### 1.3 Artefacts historiques

Les fils d'acquisition **non officiels** ou **legacy** ne sont **pas** des sources pour un nouveau développement, une qualification ou un ancrage. Ils restent des traces de transition jusqu'à décommission explicite ([`SOURCE_OF_TRUTH.md`](../SOURCE_OF_TRUTH.md) §3).

---

## 2. Chaîne d'acquisition officielle unique

### 2.1 Principe

Le projet reconnaît **une seule chaîne d'acquisition officielle** par édition de Collège qualifiée. Toute consommation du contenu officiel par le pipeline métier **passe par les sorties de cette chaîne**.

**Interdit :**

- maintenir en parallèle une seconde chaîne non documentée ;
- produire une seconde découpe officielle du Collège ;
- extraire du contenu médical depuis le PDF lorsque le markdown source ou les chapitres officiels existent.

### 2.2 Étages de l'interface (rôles, pas implémentations)

L'interface se compose de **trois livrables successifs**, chacun normatif pour l'étage suivant :

```
Source primaire (document éditeur archivé)
        ↓
Markdown source officiel du collège (représentation textuelle unique de l'édition)
        ↓
Chapitres officiels (découpe déterministe du markdown source)
        ↓
Pipeline métier Lou
```

Les **contrats composants** décrivent comment chaque étage est implémenté aujourd'hui ; ils **n'altèrent pas** les obligations ci-dessus.

### 2.3 Déterminisme et absence de LLM

La chaîne d'acquisition **déterministe** (conversion et découpage) **ne dépend pas d'un LLM** pour produire ou valider le texte officiel ([ADR-004](../adr/ADR-004-acquisition-architecture-frozen.md) NP-4).

**Interprétation médicale, inventaire, blueprint ou pédagogie :** hors périmètre de l'acquisition — pipeline métier aval.

---

## 3. Livrables de l'interface

### 3.1 Par édition de Collège

L'acquisition qualifiée expose, pour chaque édition archivée :

| Livrable | Obligation |
|---|---|
| **Source primaire archivée** | Document éditeur immuable, identifié par empreinte cryptographique |
| **Markdown source officiel** | **Seule** représentation textuelle officielle de l'édition entière |
| **Manifeste d'édition** | Provenance : empreintes, version du convertisseur, métadonnées d'édition et spécialité, résultat de validation, avertissements éventuels |

### 3.2 Par chapitre officiel

Pour chaque chapitre détecté dans le markdown source :

| Livrable | Obligation |
|---|---|
| **Fichier chapitre officiel** | Tranche **exacte** du markdown source pour ce chapitre ; texte **non réécrit** |
| **Manifeste de découpe** | Index des chapitres : ordre, identifiant d'item EDN si présent dans le titre, titre officiel, empreinte, bornes dans le document source |
| **Métadonnées de source chapitre** | Édition, lien vers le fichier chapitre, empreinte, **index structurel de sections** pour construire les `section_path` des ancres ([contrat 02](02-IDENTITY-AND-ANCHORS.md)) |

### 3.3 Provenance

Tout livrable de l'interface est **traçable** vers :

- la source primaire archivée ;
- la version des outils de conversion et de découpe ayant produit la sortie ;
- les empreintes permettant de vérifier l'intégrité et la reproductibilité.

**Interdit :** un timestamp de génération **dans** le markdown source officiel faussant la reproductibilité byte-à-byte.

---

## 4. Garanties offertes aux couches aval

Les composants aval (pipeline métier, build, lecteur) **peuvent considérer comme garanti** ce qui suit, **à version d'outil et bytes d'entrée fixes**.

### 4.1 Intégrité et reproductibilité

- Regénération **byte-identique** du markdown source à partir de la même source primaire et de la même version de convertisseur.
- Regénération **byte-identique** de chaque fichier chapitre à partir des mêmes bytes de markdown source et de la même version de segmenteur.
- **Round-trip exact** : concaténer les chapitres dans l'ordre du manifeste reconstitue le markdown source **sans altération**.

### 4.2 Contenu textuel préservé

- Encodage texte UTF-8.
- Ordre des chapitres et des paragraphes/listes conforme à l'ordre de lecture du document source (dans les limites de la couche texte).
- Titres de chapitres et niveaux de titres exploitables pour la navigation structurelle.
- Légendes de figures et de tableaux présentes **comme texte** lorsqu'elles existent dans la couche texte.
- Information métier examinable **préservée** — définitions, mécanismes, posologies, seuils, classifications, exceptions, raisonnement clinique — dans la mesure requise par les artefacts aval.

### 4.3 Structure utilisable sans PDF

- Un fichier chapitre commence par son titre officiel de premier niveau.
- Le manifeste de découpe énumère **tous** les chapitres ; le décompte annoncé correspond au nombre de fichiers.
- L'index structurel de sections permet de construire des **ancres source** sans relire le PDF.

### 4.4 Non-interprétation

- L'acquisition **ne produit pas** de points de connaissance, de blueprint, de projections, de classes de claim ni de contenu pédagogique généré.
- L'acquisition **n'attribue pas** de sens médical au-delà de la transcription structurée.

Les règles de fidélité sur le contenu produit aval relèvent du [contrat 01](01-TRUST-AND-FIDELITY.md).

---

## 5. Limites explicites de l'interface

Les couches aval **ne doivent pas supposer** :

| Limite | Conséquence pour l'aval |
|---|---|
| Reproduction visuelle ou tabulaire pixel-perfect du PDF | Non garanti ; non requis comme critère de succès (§6) |
| Mise en page multi-colonnes, décorations, assets figures raster | Peuvent être absents du texte officiel acquis |
| Contenu exclusivement graphique dans le PDF | Peut être absent du markdown |
| Interprétation, rang EDN inféré, ou normalisation sémantique par l'acquisition | Interdit côté acquisition ; hors périmètre |
| Stabilité byte-à-byte du markdown **entre versions majeures** du convertisseur | Non garantie ; nouvelle qualification requise |
| Stabilité des noms de fichiers chapitre **entre versions majeures** du segmenteur si les règles de titre changent | Non garantie |
| Exactitude sémantique des numéros d'item EDN au-delà de l'extraction fidèle du titre | Non garantie |

Une **imperfection de représentation** n'invalide pas l'interface tant qu'elle n'entraîne ni perte d'information métier démontrée, ni impossibilité de produire correctement les artefacts aval ([ADR-004](../adr/ADR-004-acquisition-architecture-frozen.md) NP-2).

---

## 6. Critère de suffisance

### 6.1 Question directrice

L'acquisition est **suffisante** lorsque les outils aval disposent de **toute l'information nécessaire** pour fonctionner correctement — pas lorsque le texte acquis **ressemble** au PDF.

### 6.2 Artefact intermédiaire

Le markdown source et les chapitres officiels sont des **artefacts intermédiaires**. Leur qualité se juge par la **capacité** à alimenter :

- l'inventaire et l'ancrage ;
- le blueprint ;
- les projections ;
- le lecteur ;

— conformément à la grille de qualification **P1–P7** ([`SOURCE_PIPELINE_QUALIFICATION.md`](../SOURCE_PIPELINE_QUALIFICATION.md)).

### 6.3 Primauté du contenu

L'**information métier prime sur le formatage**. Un écart de mise en forme Markdown **n'autorise jamais** une correction manuelle du texte source ; toute amélioration passe par une **nouvelle exécution versionnée** du pipeline d'acquisition ([ADR-004](../adr/ADR-004-acquisition-architecture-frozen.md) NP-6).

---

## 7. Édition d'acquisition qualifiée

### 7.1 Définition

Une **édition d'acquisition qualifiée** est une édition de Collège pour laquelle :

1. la chaîne officielle unique a été exécutée sur la source primaire archivée ;
2. les livrables de l'interface (§3) sont complets et accompagnés de provenance ;
3. la grille **P1–P7** a produit un verdict **GO** sur le corpus de référence applicable ;
4. l'architecture d'acquisition est en **mode maintenance** gelée ([ADR-004](../adr/ADR-004-acquisition-architecture-frozen.md)).

Seule une édition ainsi qualifiée est une **entrée normative** du pipeline métier.

### 7.2 Consommation par chapitre

Pour un chapitre métier (`specialty/item`, [contrat 02](02-IDENTITY-AND-ANCHORS.md)), l'interface d'acquisition fournit :

- le **texte officiel** du chapitre (tranche verbatim) ;
- l'**identifiant d'édition du Collège** ;
- l'**index structurel** des sections ;
- la **provenance** reliant le chapitre à l'édition qualifiée.

Le [contrat 04](04-CHAPTER-PACKAGE.md) assemble ces entrées avec les artefacts curatifs et générés — sans recréer une autorité parallèle sur le texte officiel.

---

## 8. Séparation acquisition / pipeline métier

### 8.1 Responsabilités de l'acquisition

L'acquisition **garantit** :

- texte officiel segmenté et adressable ;
- édition et provenance ;
- index structurel pour l'ancrage ;
- déterminisme et traçabilité de la chaîne textuelle.

### 8.2 Hors acquisition (pipeline métier)

Les domaines suivants **évoluent** selon leurs propres contrats — ils **ne redéfinissent pas** l'interface d'acquisition :

- inventaire, réconciliation métier, blueprint, projections ;
- grounding et publication ([contrat 01](01-TRUST-AND-FIDELITY.md)) ;
- package chapitre et manifest ([contrat 04](04-CHAPTER-PACKAGE.md)) ;
- grammaire visuelle ([contrat 05](05-VISUAL-GRAMMAR.md)) ;
- lecteur ([contrat 06](06-RENDERER-AND-LEARNER-LAYER.md)).

### 8.3 Interdiction de contournement

**Interdit** à tout composant aval :

- de lire le PDF pour extraire du contenu lorsque l'interface textuelle existe ;
- de produire une découpe ou un « official-college » parallèle non qualifié ;
- d'introduire une seconde autorité sur le contenu officiel du Collège.

---

## 9. Stabilité et évolution de l'interface

### 9.1 Gel

L'interface d'acquisition décrite par ce contrat est **gelée**. Elle entre en **mode maintenance** : corrections de bugs ou nouveaux formats source — pas de recherche exploratoire orientée ressemblance PDF.

Le contexte et la politique de modification détaillée : [ADR-004](../adr/ADR-004-acquisition-architecture-frozen.md) §6.

### 9.2 Évolution autorisée

L'interface **ne peut évoluer** que dans l'un des cas suivants :

| Cas | Exigence |
|---|---|
| **Bug bloquant** | Impact démontré sur génération ou traçabilité aval ; incrément de version ; re-qualification P1–P7 |
| **Nouveau format source éditeur** | Nouveau pipeline qualifié P1–P7 ; pipeline PDF gelé inchangé rétroactivement |
| **Nouvel ADR** | Décision explicite remplaçant ou étendant ADR-004 |

**Insuffisant** pour modifier l'interface : esthétique du markdown, ressemblance PDF, optimisations sans impact P4–P6 démontré ([ADR-004](../adr/ADR-004-acquisition-architecture-frozen.md) §6).

### 9.3 Compatibilité

Tout changement autorisé **incrémente la version** du composant concerné et **re-qualifie** l'édition sur le corpus de référence. Les garanties §4 s'appliquent **à la version qualifiée**, pas implicitement à toute version future.

Les politiques de compatibilité par outil : contrats composants respectifs — non recopiés ici.

---

## 10. Hors périmètre de ce contrat

| Sujet | Contrat ou document |
|---|---|
| Fidélité, grounding, réconciliation, publication | [01 — Trust & Fidelity](01-TRUST-AND-FIDELITY.md) |
| Identités, ancres source, chaîne de traçabilité | [02 — Identity & Anchors](02-IDENTITY-AND-ANCHORS.md) |
| Structure du chapter package, manifest métier | [04 — Chapter Package](04-CHAPTER-PACKAGE.md) |
| Grammaire visuelle | [05 — Visual Grammar](05-VISUAL-GRAMMAR.md) |
| Renderer | [06 — Renderer & Learner Layer](06-RENDERER-AND-LEARNER-LAYER.md) |
| Décisions historiques et preuves de qualification | [ADR-004](../adr/ADR-004-acquisition-architecture-frozen.md), rapports `docs/acquisition/` |
| Détail des garanties par outil | [`01-pdf-to-canonical/CONTRACT.md`](../../01-learning/tools/01-pdf-to-canonical/CONTRACT.md), [`02-chapter-splitter/CONTRACT.md`](../../01-learning/tools/02-chapter-splitter/CONTRACT.md) |

---

## Sources consolidées

| Document | Apport consolidé |
|---|---|
| [ADR-004](../adr/ADR-004-acquisition-architecture-frozen.md) | Gel, NP-1 à NP-6, interface de sortie, séparation aval, politique d'évolution |
| [ADR-003](../adr/ADR-003-single-source-of-truth.md) | SSOT, chaîne unique, statut legacy |
| [`SOURCE_OF_TRUTH.md`](../SOURCE_OF_TRUTH.md) | Règles SSOT, chaîne officielle, interdictions legacy |
| [`IMPLEMENTATION_CONTRACT.md`](../../IMPLEMENTATION_CONTRACT.md) | C.1 Official Source — rôle et limites de la source officielle |
| [`01-pdf-to-canonical/CONTRACT.md`](../../01-learning/tools/01-pdf-to-canonical/CONTRACT.md) | Garanties aval convertisseur (reformulées en obligations d'interface §4–5) |
| [`02-chapter-splitter/CONTRACT.md`](../../01-learning/tools/02-chapter-splitter/CONTRACT.md) | Garanties aval segmenteur (idem) |
| [`SOURCE_PIPELINE_QUALIFICATION.md`](../SOURCE_PIPELINE_QUALIFICATION.md) | Critère de suffisance P1–P7 (renvoi §6) |
| [`PHASE_0A_CONTRACT_AUDIT.md`](../PHASE_0A_CONTRACT_AUDIT.md) | Périmètre contrat 03 vs 01–02 et 04–06 ; frontière acquisition gelée |
