# Cognitive Priming Component Contract

| | |
|---|---|
| **Type** | Contrat composant normatif |
| **Statut** | **Proposé** — Lot AP-A (approbation requise avant mise en vigueur) |
| **Composant** | Amorçage cognitif Reader (Cognitive Priming) |
| **Décision produit** | [PDR-B5](../../governance/PRODUCT-DECISION-REGISTRY.md) · [PDR-B1](../../governance/PRODUCT-DECISION-REGISTRY.md) |
| **Spécification fonctionnelle** | [`15-READER-FUNCTIONAL-SPECIFICATION.md`](../../renderer/15-READER-FUNCTIONAL-SPECIFICATION.md) §4.3 |
| **ADR associé** | — |
| **Index** | [`../00-INDEX.md`](../00-INDEX.md) · [`00-INDEX.md`](00-INDEX.md) |

Ce document définit les **obligations durables** de l'**Amorçage cognitif** (`viewId` : `cognitive-priming`) dans le Reader Lou Médecine. Il spécialise [PDR-B5](../../governance/PRODUCT-DECISION-REGISTRY.md) et [`15-READER-FUNCTIONAL-SPECIFICATION.md`](../../renderer/15-READER-FUNCTIONAL-SPECIFICATION.md) §4.3. Il ne redéfinit pas le contenu médical d'une Release, ne spécifie pas de technologie DOM particulière et n'introduit **aucune décision produit nouvelle** au-delà de l'acceptation Reader V1 déjà actée.

---

## 1. Objectif

Le composant Cognitive Priming **DOIT** fournir à l'apprenant une **vue d'amorçage** répondant à la question : *« Où suis-je ? De quoi parle ce chapitre ? »* — **sans entrer dans le détail** du chapitre.

| Règle | Énoncé |
|---|---|
| **Consommation pure** | Cognitive Priming **CONSOMME** un artefact **publié** par le Chapter Package ; il **NE PRODUIT JAMAIS** de contenu médical, pédagogique ou éditorial au runtime. |
| **Immutabilité du publié** | Cognitive Priming **NE MODIFIE JAMAIS** le Chapter Package, le manifest, les artefacts déclarés ni le catalogue. |
| **Manifest-only** | Toute information affichée **DOIT** provenir d'un artefact **déclaré** par le manifest publié — jamais d'une lecture directe de l'inventaire, du Blueprint, de la source d'acquisition ou d'un sidecar de build non publié ([contrat 04](../04-CHAPTER-PACKAGE.md) §10, [`COMPOSITION-COMPONENT-CONTRACT.md`](COMPOSITION-COMPONENT-CONTRACT.md) §2.3). |
| **Composition intermédiaire** | La Composition **ASSEMBLE** une référence structurée dans le Reading View Model ; le Renderer **PRÉSENTE** le contenu résolu — sans calcul métier. |

En mode produit, les critères de conformité **DOIVENT** être évalués sur une **bibliothèque installée** conforme au [`LIBRARY-CATALOG-CONTRACT.md`](LIBRARY-CATALOG-CONTRACT.md), avec une Release **ouverte** identifiée par `release_id`.

---

## 2. Périmètre

### 2.1 Inclus (V1)

| Domaine | Couverture |
|---|---|
| **Profil pédagogique** | Repères Compréhension et Mémorisation — échelle ★☆☆☆☆ à ★★★★★ (1–5) |
| **Pré-requis EDN** | Références officielles ordonnées ; navigation vers chapitre cible **si publié et installé** |
| **Analyse IA limitée** | Une phrase par item ; badge obligatoire *« Complément pédagogique (IA) — non issu du Collège »* |
| **Résumé du chapitre** | Liste de bullets ultra synthétiques — contenu officiel prioritaire |
| **Artefact publié** | Identité, emplacement, schéma logique V1, validation, publication, absence |
| **Reading View Model** | Référence `primingRef` et disponibilité vue `cognitive-priming` |
| **Frontières** | lou-build, Package, Composition, Renderer, Patrimoine, Session (D4), Local Search (D6), Offline (D2), Display Preferences (D7) |

### 2.2 Exclus (V1)

| Domaine | Autorité / statut |
|---|---|
| **Inter-EDN actif** | [`15-READER-FUNCTIONAL-SPECIFICATION.md`](../../renderer/15-READER-FUNCTIONAL-SPECIFICATION.md) §4.3 — hors V1 |
| **Mini-cours IA** | Aucun pré-requis IA développé en contenu long — une phrase par item uniquement |
| **Enrichissement dynamique runtime** | Interdit — pas de génération, paraphrase ni complétion à l'affichage |
| **Personnalisation apprenant** | Contenu Amorçage non modifiable par la couche apprenante |
| **Scoring / progression / recommandations** | [PDR-D5](../../governance/PRODUCT-DECISION-REGISTRY.md), [PDR-D8](../../governance/PRODUCT-DECISION-REGISTRY.md), [PDR-G1](../../governance/PRODUCT-DECISION-REGISTRY.md) — hors V1 |
| **Recherche globale / multi-packages** | [PDR-G4](../../governance/PRODUCT-DECISION-REGISTRY.md) |
| **Sync cloud / collaboration** | [PDR-G5](../../governance/PRODUCT-DECISION-REGISTRY.md) |
| **QCM, Notes, progression %** | [`15-READER-FUNCTIONAL-SPECIFICATION.md`](../../renderer/15-READER-FUNCTIONAL-SPECIFICATION.md) §4.3 — hors vue Amorçage |

### 2.3 Mode développement

Un mode de développement **PEUT** charger une Release hors bibliothèque installée. Ce mode **NE DOIT PAS** être invoqué pour valider la conformité Cognitive Priming V1 produit.

---

## 3. Chaîne d'autorité

```
Inventaire + Blueprint + source (curatifs — hors runtime Reader)
        ↓
lou-build (génération, validation, gates)
        ↓
Artefact CognitivePriming publié + déclaration manifest
        ↓
Manifest publié (point d'entrée package)
        ↓
Composition Engine + Composition Specification
        ↓
Reading View Model (primingRef, availability)
        ↓
Renderer (fetch artefact via Package Access, présentation)
        ↓
Apprenant
```

| Règle | Énoncé |
|---|---|
| **Autorité médicale** | L'artefact publié et le manifest — jamais le View Model, jamais le Renderer. |
| **Non-lecture Blueprint** | Le Reader, la Composition et le Renderer **NE DOIVENT JAMAIS** lire `blueprint.md`, l'inventaire ou la source d'acquisition pour produire ou compléter l'Amorçage. |
| **Déterminisme Composition** | `compose(manifest, spec)` **DOIT** produire le même View Model pour les mêmes entrées — sans fetch du contenu de l'artefact ([`COMPOSITION-COMPONENT-CONTRACT.md`](COMPOSITION-COMPONENT-CONTRACT.md) §9). |

---

## 4. Artefact CognitivePriming V1

### 4.1 Identité

| Élément | Valeur normative V1 |
|---|---|
| **Identifiant logique** | `CognitivePriming` |
| **Rôle** | Porteur unique du contenu Amorçage cognitif d'une Release |
| **Nature** | Artefact **généré** par lou-build — **non** curatif maintenu à la main comme source de vérité médicale ([contrat 04](../04-CHAPTER-PACKAGE.md) §2) |
| **Couche package** | Généré / publié — consommé exclusivement via manifest |

### 4.2 Emplacement et déclaration manifest

| Règle | Énoncé |
|---|---|
| **Chemin relatif** | L'artefact **DOIT** résider **dans** le Chapter Package publié — chemin relatif stable déclaré par le manifest. |
| **Champ manifest V1** | Le manifest **DOIT** déclarer `cognitive_priming_path` (string non vide) lorsque l'Amorçage est **publié** pour la Release. |
| **Statut publication** | L'absence de `cognitive_priming_path` **ÉQUIVAUT** à un Amorçage **non publié** pour la Release — la vue reste non alimentée. |
| **Interdiction vocabulaire produit** | Le manifest **NE DOIT PAS** porter de libellés d'interface, d'emoji ou d'ordre de vues ([contrat 04](../04-CHAPTER-PACKAGE.md) §10.3). |

**Convention de chemin recommandée V1** (non bloquante si autre chemin explicitement déclaré) :

```
build/cognitive-priming.v1.json
```

### 4.3 Format et versionnement

| Règle | Énoncé |
|---|---|
| **Format physique V1** | JSON UTF-8 — sérialisation structurée, parseable sans heuristique. |
| **`schema_version`** | Entier positif obligatoire — **`1`** figé pour V1. |
| **Évolution** | Toute évolution de schéma **DOIT** incrémenter `schema_version` ; les implémentations V1 **DOIVENT** rejeter ou migrer explicitement les versions non reconnues — jamais de fallback silencieux modifiant le sens affiché. |

### 4.4 Schéma logique V1

Objet racine **`CognitivePrimingRecord`** :

| Champ | Type logique | Obligation V1 | Sémantique |
|---|---|---|---|
| `schema_version` | entier | **Obligatoire** — valeur `1` | Version du schéma |
| `chapter_id` | string | **Obligatoire** | Identité chapitre ([contrat 02](../02-IDENTITY-AND-ANCHORS.md)) — **DOIT** correspondre à `manifest.chapter` |
| `profile` | objet | **Obligatoire** | Profil pédagogique du chapitre |
| `profile.comprehension` | entier 1–5 | **Obligatoire** | Repère Compréhension — **pas** une note étudiante |
| `profile.memorization` | entier 1–5 | **Obligatoire** | Repère Mémorisation — **pas** une note étudiante |
| `prerequisites` | objet | **Obligatoire** | Pré-requis — ordre d'affichage **fixe** §4.5 |
| `prerequisites.edn_references` | array | **Obligatoire** — **PEUT** être `[]` | Références EDN officielles |
| `prerequisites.inter_edn` | array | **Interdit non vide V1** — **DOIT** être absent ou `[]` | Inter-EDN — hors V1 |
| `prerequisites.ai_complements` | array | **Obligatoire** — **PEUT** être `[]` | Compléments IA — une phrase par item |
| `summary` | objet | **Obligatoire** | Résumé ultra synthétique |
| `summary.bullets` | array de strings | **Obligatoire** — ≥ 1 entrée non vide pour Release **complete** acceptée | Bullets — contenu officiel prioritaire à la production |

**Entrée `EdnReference` V1** (élément de `prerequisites.edn_references`) :

| Champ | Type | Obligation | Sémantique |
|---|---|---|---|
| `reference_id` | string | **Obligatoire** | Identifiant stable **interne au package** — clé de liste, non médicale |
| `chapter_id` | string | **Obligatoire** | Identité chapitre cible ([contrat 02](../02-IDENTITY-AND-ANCHORS.md)) — ex. `cardio/123` |
| `label` | string | **Obligatoire** | Libellé affichable — produit par la Fabrique, immuable à l'affichage |
| `item_label` | string | Optionnel | Item EDN affichable si distinct du libellé chapitre |

| Règle | Énoncé |
|---|---|
| **Stabilité `reference_id`** | Stable pour une Release publiée — permet résolution catalogue et tests de non-régression. |
| **Stabilité `chapter_id`** | **NE DOIT PAS** être dérivée au runtime — figée à la publication. |
| **Ordre array** | L'ordre dans `edn_references` **EST** l'ordre d'affichage V1. |

**Entrée `AiComplement` V1** (élément de `prerequisites.ai_complements`) :

| Champ | Type | Obligation | Sémantique |
|---|---|---|---|
| `complement_id` | string | **Obligatoire** | Identifiant stable interne au package |
| `sentence` | string | **Obligatoire** — une seule phrase | Complément pédagogique IA — **non** issu du Collège |
| `badge` | string | **Obligatoire** — valeur figée V1 | **`"Complément pédagogique (IA) — non issu du Collège"`** |

| Règle | Énoncé |
|---|---|
| **Badge figé** | Toute autre valeur **DOIT** être rejetée à la validation build — pas de paraphrase au Renderer. |
| **Une phrase** | `sentence` **NE DOIT PAS** contenir de structure multi-paragraphe ni de mini-cours. |

### 4.5 Ordre d'affichage des pré-requis (V1)

Ordre **normatif et fixe** — conforme doc 15 §4.3 :

1. **Références EDN** (`prerequisites.edn_references`)
2. **Inter-EDN** — section **absente ou vide** en V1 ; **aucune** interaction
3. **Analyse IA** (`prerequisites.ai_complements`)

Le Renderer **NE DOIT PAS** réordonner ces sections.

### 4.6 Validation (lou-build)

Avant publication d'une Release **complete** visant l'acceptation Reader V1 ([PDR-B5](../../governance/PRODUCT-DECISION-REGISTRY.md)) :

| Id | Règle |
|---|---|
| V-CP-01 | `schema_version === 1` |
| V-CP-02 | `chapter_id` === identité chapitre du manifest |
| V-CP-03 | `profile.comprehension` et `profile.memorization` ∈ {1, 2, 3, 4, 5} |
| V-CP-04 | `prerequisites.inter_edn` absent ou array vide |
| V-CP-05 | Chaque `EdnReference` possède `reference_id`, `chapter_id`, `label` non vides |
| V-CP-06 | Chaque `AiComplement` possède `complement_id`, `sentence` non vide, `badge` exact §4.4 |
| V-CP-07 | `summary.bullets` contient ≥ 1 string non vide |
| V-CP-08 | `cognitive_priming_path` déclaré et fichier résolvable dans le package |
| V-CP-09 | JSON parseable — échec **bloquant** au gate build |

### 4.7 Publication et compatibilité

| État | Comportement |
|---|---|
| **Publié valide** | `cognitive_priming_path` présent ; artefact présent ; validation V-CP-01…09 PASS |
| **Non publié** | `cognitive_priming_path` absent — vue `cognitive-priming` **non alimentée** (`planned` ou équivalent Composition) |
| **Déclaré mais fichier absent** | Erreur package — gate build **DOIT** échouer ; si observé runtime : diagnostic explicite, **pas** de contenu inventé |
| **Publié schéma inconnu** | Rejet explicite — pas de fallback partiel silencieux |

### 4.8 Comportement si absent

| Couche | Obligation |
|---|---|
| **Package complet accepté** | **Interdit** — PDR-B5 exige la vue alimentée sur le golden master |
| **Composition (Release incomplète / dev)** | Vue `cognitive-priming` **DOIT** rester `planned` ou équivalent explicite — jamais vue vide silencieuse si policy l'exige ([`COMPOSITION-COMPONENT-CONTRACT.md`](COMPOSITION-COMPONENT-CONTRACT.md) §6) |
| **Renderer** | **NE DOIT PAS** synthétiser profil, pré-requis ou résumé depuis d'autres projections |

---

## 5. Responsabilités par couche

### 5.1 lou-build (Fabrique)

| DOIT | NE DOIT PAS |
|---|---|
| Générer `CognitivePrimingRecord` à partir des curatifs (Blueprint, métadonnées, registre) | Lire ou dépendre du Reader, de la Composition ou du Renderer |
| Valider le schéma V1 (§4.6) | Publier un artefact invalide ou partiel sur une Release `complete` |
| Déclarer `cognitive_priming_path` dans le manifest généré | Porter du vocabulaire produit Reader dans le manifest |
| Faire échouer le gate si Release `complete` sans Amorçage valide | Inférer au runtime la disponibilité d'un chapitre cible dans la bibliothèque |
| Produire `reference_id` / `complement_id` stables par Release | Modifier le sens médical à la génération sans grounding conforme [contrat 01](../01-TRUST-AND-FIDELITY.md) |

### 5.2 Chapter Package (publication)

| DOIT | NE DOIT PAS |
|---|---|
| Porter l'artefact comme fichier publié immuable | Exposer inventaire ou Blueprint au Reader |
| Exposer `cognitive_priming_path` comme seule porte d'entrée Amorçage | Dupliquer le contenu Amorçage inline dans le manifest |
| Respecter [contrat 04](../04-CHAPTER-PACKAGE.md) §10 | Servir de stockage de contenu auteur non généré |

### 5.3 Composition

| DOIT | NE DOIT PAS |
|---|---|
| Résoudre une source `kind: "cognitive-priming"` déclarée dans la Composition Specification | Lire Blueprint, inventaire ou source d'acquisition |
| Produire `primingRef` dans le View Model pour la vue `cognitive-priming` | Parser le JSON de l'artefact pour en extraire du sens médical |
| Calculer `availability` : `published` si `cognitive_priming_path` résolu ; sinon politique explicite | Reformuler, résumer ou enrichir le contenu Amorçage |
| Émettre un diagnostic si déclaration manifest incohérente | Fetch l'artefact — résolution de **chemin** uniquement |
| Préserver le `viewId` gelé `cognitive-priming` | Introduire une taxonomie parallèle de vues |

**Source Composition V1 (figée AP-A)** :

```json
{ "kind": "cognitive-priming", "ref": "manifest" }
```

La résolution **DOIT** lire `manifest.cognitive_priming_path` — absence ⇒ source non résolue.

### 5.4 Renderer

| DOIT | NE DOIT PAS |
|---|---|
| Consommer **exclusivement** le Reading View Model + artefact fetché via Package Access | Lire Blueprint, inventaire ou manifest hors View Model pour compléter l'Amorçage |
| Afficher profil, pré-requis (ordre §4.5), résumé **tels que publiés** | Calculer étoiles, générer résumé, paraphraser ou traduire |
| Appliquer le badge IA figé tel quel | Afficher un pré-requis Inter-EDN actif en V1 |
| Déléguer la résolution de navigation EDN au catalogue bibliothèque | Décider seul qu'un chapitre cible « existe » sans consulte catalogue |
| Signaler honnêtement cible absente ou non installée | Simuler un lien actif vers un chapitre non publié |
| Respecter [`RENDERER-COMPONENT-CONTRACT.md`](RENDERER-COMPONENT-CONTRACT.md) — immutabilité affichée | Modifier le contenu officiel affiché |

---

## 6. Reading View Model

### 6.1 Extension V1 — `primingRef`

Chaque entrée de vue **`cognitive-priming`** **PEUT** porter un objet **`primingRef`** — référence logique vers l'artefact, **sans** contenu pré-parsé.

| Champ | Type logique | Obligation | Sémantique |
|---|---|---|---|
| `ref` | string | **Obligatoire** | Référence source Composition — ex. `"manifest"` |
| `path` | string | Présent si résolu | Chemin relatif artefact — copie déclarative de `cognitive_priming_path` |
| `schema_version` | entier | **Recommandé** — `1` si résolu | Version attendue de l'artefact |
| `resolved` | boolean | **Obligatoire** | `true` si `path` non vide et déclaration manifest cohérente |

| Règle | Énoncé |
|---|---|
| **Interdit contenu médical** | `primingRef` **NE DOIT PAS** porter `profile`, `prerequisites`, `summary`, markdown, HTML ni texte officiel pré-extrait ([`COMPOSITION-COMPONENT-CONTRACT.md`](COMPOSITION-COMPONENT-CONTRACT.md) §5, [`reading-view-model.js`](../../../demo/renderer/composition/reading-view-model.js) invariants). |
| **Parallèle `collegeRef`** | Même niveau d'abstraction que `collegeRef` — chemin + métadonnées de résolution, pas de hydratation. |
| **Disponibilité vue** | Si `primingRef.resolved === true` ⇒ `availability` **DOIT** être `published` ; sinon politique spec (`planned` en transition V1). |

### 6.2 Obligations Composition (View Model)

| Id | Obligation |
|---|---|
| O-CP-C01 | La vue `cognitive-priming` apparaît **exactement une fois** dans les 7 vues ordonnées. |
| O-CP-C02 | `displayOrder` conforme à la Composition Specification gelée. |
| O-CP-C03 | `primingRef` produit **uniquement** par résolution manifest — déterministe. |
| O-CP-C04 | Aucun `blocks[]`, `questions[]`, `scenarios[]` requis pour alimenter l'Amorçage V1. |

### 6.3 Obligations Renderer (consommation)

| Id | Obligation |
|---|---|
| O-CP-R01 | Fetch artefact via Package Access en utilisant `primingRef.path`. |
| O-CP-R02 | Valider `schema_version` supportée avant affichage — erreur explicite si incompatible. |
| O-CP-R03 | Vérifier cohérence `chapter_id` artefact / Release ouverte — warning diagnostic si écart, **pas** de correction silencieuse. |
| O-CP-R04 | Présenter l'écran sur **un scroll principal** — objectif « tenir en un écran » doc 15 (mise en page Renderer, sans troncature de contenu publié). |

---

## 7. Navigation — pré-requis EDN

### 7.1 Déclencheur

Un clic utilisateur sur une **référence EDN** (`EdnReference`) **DOIT** tenter une **navigation explicite** vers le chapitre identifié par `chapter_id`.

### 7.2 Résolution cible

| Étape | Responsable | Règle |
|---|---|---|
| 1 | Renderer | Transmet `chapter_id` au shell Reader / Library |
| 2 | Library Catalog | Recherche Release **installée** et **publiée** pour `chapter_id` |
| 3 | Reader | Ouvre la Release retenue sur la vue Amorçage ou selon politique session |

| Règle | Énoncé |
|---|---|
| **Catalogue seule autorité disponibilité** | La disponibilité d'un chapitre cible **NE DOIT JAMAIS** être inférée depuis le package courant seul. |
| **Stabilité** | `chapter_id` **NE DOIT PAS** changer entre publication source et consommation — identité [contrat 02](../02-IDENTITY-AND-ANCHORS.md). |
| **Pas de navigation Inter-EDN V1** | Aucune action sur `inter_edn`. |

### 7.3 Cas limites

| Cas | Comportement normatif V1 |
|---|---|
| **Cible installée et publiée** | Navigation autorisée — ouverture Reader sur le chapitre cible |
| **Cible absente du catalogue** | Affichage **honnête** — libellé non cliquable ou message explicite ; **pas** d'erreur silencieuse |
| **Chapitre connu mais non publié / non installé** | **Pas** de navigation ; indication visuelle de non-disponibilité |
| **`chapter_id` mal formé dans artefact** | Gate build **DOIT** empêcher publication ; si fuite runtime : diagnostic, pas de navigation |
| **Même chapitre (auto-référence)** | Navigation **autorisée** vers Amorçage du même chapitre — comportement explicite acceptable |

### 7.4 Compléments IA

| Règle | Énoncé |
|---|---|
| **Non navigables V1** | `AiComplement` **NE DOIT PAS** produire de lien chapitre en V1. |
| **Badge obligatoire** | Affichage visible du badge figé §4.4 — distinct du contenu Collège. |

---

## 8. Frontières composants

### 8.1 Patrimoine ([`LEARNER-PATRIMONY-COMPONENT-CONTRACT.md`](LEARNER-PATRIMONY-COMPONENT-CONTRACT.md))

| Règle | Énoncé |
|---|---|
| **Indépendance totale** | Le contenu Cognitive Priming **N'APPARTIENT PAS** au patrimoine apprenant. |
| **Non-export** | Aucun domaine Snapshot V1 pour l'Amorçage — contenu **reconstructible** depuis le package. |
| **Overlays** | Overlays apprenant sur texte sélectionnable **PEUVENT** exister doc 15 — **non prioritaires** V1 ; **NE DOIVENT PAS** modifier l'artefact officiel. |

### 8.2 Session Resume ([PDR-D4](../../governance/PRODUCT-DECISION-REGISTRY.md))

| Règle | Énoncé |
|---|---|
| **`viewId` stable** | `cognitive-priming` **DOIT** rester la cible des commits explicites Amorçage (ex. breadcrumb chapitre — CE-04). |
| **`ResumePoint`** | Kind autorisé : `view_entry` pour sommet de vue Amorçage — **sans** ancre contenu obligatoire. |
| **Reprise** | Si dernière session pointait vers `cognitive-priming` **publié** ⇒ reprise **DOIT** restaurer la vue ; si `planned` ⇒ fallback session existant ([PDR-D4](../../governance/PRODUCT-DECISION-REGISTRY.md)). |
| **Non-ingérence** | Session Service **NE DOIT PAS** lire ni écrire l'artefact CognitivePriming. |

### 8.3 Local Search ([PDR-D6](../../governance/PRODUCT-DECISION-REGISTRY.md), [`LOCAL-SEARCH-COMPONENT-CONTRACT.md`](LOCAL-SEARCH-COMPONENT-CONTRACT.md))

| Règle | Énoncé |
|---|---|
| **Indexation autorisée** | Lorsque la vue est `published`, le texte de l'artefact **PEUT** entrer le corpus indexable Release ouverte. |
| **Exclusion vue `planned`** | Vue non publiée **NE DOIT PAS** produire de SearchHit. |
| **Orthogonalité** | Local Search **NE DOIT PAS** modifier l'artefact ni la disponibilité Amorçage. |
| **`viewId`** | SearchHit **DOIT** utiliser `cognitive-priming` — id gelé Composition. |

### 8.4 Offline ([PDR-D2](../../governance/PRODUCT-DECISION-REGISTRY.md), [`OFFLINE-COMPONENT-CONTRACT.md`](OFFLINE-COMPONENT-CONTRACT.md))

| Règle | Énoncé |
|---|---|
| **Artefact offline** | L'artefact déclaré **DOIT** être préparé comme les autres artefacts textuels de la Release lors de la certification offline. |
| **Indépendance** | `offline_status` **NE DOIT PAS** alterer le contenu Amorçage — seulement sa **disponibilité locale**. |
| **Non-certification Amorçage** | Cognitive Priming **NE CERTIFIE PAS** l'offline — Offline Manager reste seul certifiant. |

### 8.5 Display Preferences ([PDR-D7](../../governance/PRODUCT-DECISION-REGISTRY.md))

| Règle | Énoncé |
|---|---|
| **Orthogonalité** | Thème, police et largeur **DOIVENT** s'appliquer à la vue Amorçage comme aux autres vues. |
| **Non-ingérence** | Display Preferences **NE DOIT JAMAIS** modifier `primingRef`, la disponibilité vue ni le contenu artefact. |

### 8.6 Composition ([`COMPOSITION-COMPONENT-CONTRACT.md`](COMPOSITION-COMPONENT-CONTRACT.md))

| Règle | Énoncé |
|---|---|
| **Spécialisation** | Ce contrat **spécialise** la vue `cognitive-priming` — ne remplace pas les invariants Composition généraux. |
| **Kind additionnel V1** | `cognitive-priming` **EST** un `kind` de source autorisé **en plus** de `projection`, `questions`, `scenarios`, `college-source`, `none`. |

---

## 9. Comportements interdits

| Interdit | Précision |
|---|---|
| **Lecture Blueprint runtime** | Toute couche Reader — interdit. |
| **Inférence pédagogique Composition** | Calcul de profil, résumé ou pré-requis — interdit. |
| **Génération runtime** | LLM, paraphrase, complétion — interdit. |
| **Inter-EDN V1** | Affichage ou navigation Inter-EDN — interdit. |
| **Mini-cours IA** | Contenu autre qu'une phrase + badge — interdit. |
| **Personnalisation Amorçage** | Persistance apprenant modifiant le contenu officiel — interdit. |
| **Scoring / progression Amorçage** | Étoiles **NE SONT PAS** une note étudiante — interdit de les traiter comme score persisté. |
| **Fallback silencieux** | Inventer profil ou résumé depuis `story` / Collège — interdit. |
| **Hydratation View Model** | Pré-parser markdown ou JSON artefact dans le View Model — interdit. |
| **Navigation sans catalogue** | Lien actif sans Release installée — interdit. |
| **Double autorité** | Deux artefacts Amorçage concurrents — interdit ; un seul `cognitive_priming_path` par manifest. |

---

## 10. Invariants

| Id | Invariant |
|---|---|
| CP-01 | Toute information Amorçage affichée provient d'un artefact publié déclaré par le manifest. |
| CP-02 | Le Reader ne lit jamais Blueprint, inventaire ni source d'acquisition pour l'Amorçage. |
| CP-03 | La Composition ne dérive jamais de contenu pédagogique — résolution de chemin uniquement. |
| CP-04 | Le Renderer ne fait aucun calcul métier sur profil, pré-requis ou résumé. |
| CP-05 | `schema_version = 1` fige le schéma logique §4.4 pour V1. |
| CP-06 | `viewId` **`cognitive-priming`** est stable et gelé. |
| CP-07 | Inter-EDN reste absent ou vide en V1. |
| CP-08 | Badge IA V1 est la chaîne figée §4.4. |
| CP-09 | Patrimoine apprenant et artefact Amorçage sont totalement indépendants. |
| CP-10 | Session, Search, Offline et Display Preferences restent orthogonaux au contenu Amorçage. |
| CP-11 | PDR-B5 reste l'autorité produit — 7 vues alimentées incluant Amorçage sur golden master. |

---

## 11. Critères de conformité V1

| Id | Critère |
|---|---|
| C-CP-01 | Release `complete` golden master possède `cognitive_priming_path` et artefact valide V-CP-01…09. |
| C-CP-02 | Vue `cognitive-priming` en `availability: published` lorsque `primingRef.resolved`. |
| C-CP-03 | Renderer affiche profil 1–5 Compréhension et Mémorisation sans transformation. |
| C-CP-04 | Pré-requis affichés dans l'ordre §4.5 ; Inter-EDN absent. |
| C-CP-05 | Chaque complément IA : une phrase + badge figé. |
| C-CP-06 | Résumé : bullets publiés sans reformulation Renderer. |
| C-CP-07 | Clic pré-requis EDN → navigation si Release cible installée ; sinon état honnête non cliquable. |
| C-CP-08 | Reprise session vers Amorçage publié compatible D4. |
| C-CP-09 | Local Search indexe l'Amorçage publié ; ignore si `planned`. |
| C-CP-10 | Mode offline certifié : artefact Amorçage accessible localement. |
| C-CP-11 | Aucune écriture patrimoniale depuis Cognitive Priming. |

---

## 12. Place dans la hiérarchie

### 12.1 Documents qui priment

En cas de conflit, priment dans cet ordre :

1. les ADR applicables ;
2. les contrats fondamentaux [01](../01-TRUST-AND-FIDELITY.md) à [09](../09-CLINICAL-SCENARIO.md), en particulier [04](../04-CHAPTER-PACKAGE.md) et [06](../06-RENDERER-AND-LEARNER-LAYER.md) ;
3. [PDR-B5](../../governance/PRODUCT-DECISION-REGISTRY.md) — critère 7 vues alimentées ;
4. [`COMPOSITION-COMPONENT-CONTRACT.md`](COMPOSITION-COMPONENT-CONTRACT.md) ;
5. [`RENDERER-COMPONENT-CONTRACT.md`](RENDERER-COMPONENT-CONTRACT.md).

Ce contrat **NE DOIT PAS** contredire un document supérieur.

### 12.2 Documents sur lesquels il prime

Ce contrat **prime** sur :

- [`15-READER-FUNCTIONAL-SPECIFICATION.md`](../../renderer/15-READER-FUNCTIONAL-SPECIFICATION.md) §4.3 pour les obligations composant Amorçage ;
- la documentation technique Reader (`docs/renderer/`, rapports AP-B…) ;
- le code et les tests du composant Cognitive Priming.

---

## 13. Considérations futures (hors V1)

| Évolution | Statut |
|---|---|
| Inter-EDN actif | Différé — doc 15 §4.3 |
| Navigation depuis compléments IA | Hors V1 |
| Enrichissement artefact ( métadonnées additionnelles ) | Nécessite `schema_version` > 1 |
| Personnalisation repères profil | Hors V1 |

---

## 14. Hors périmètre documentaire

Ce contrat **NE SPÉCIFIE PAS** : stages lou-build exacts, sélecteurs DOM, structure HTML des étoiles, implémentation Package Access, détail des gates CI — réservés à la documentation technique et au code subordonnés (lots AP-B…AP-F).

---

## 15. Documents connexes

| Document | Usage |
|---|---|
| [PDR-B5](../../governance/PRODUCT-DECISION-REGISTRY.md) | Décision produit — 7 vues alimentées à l'acceptation |
| [PDR-B1](../../governance/PRODUCT-DECISION-REGISTRY.md) | Acceptation Reader — package complet |
| [`15-READER-FUNCTIONAL-SPECIFICATION.md`](../../renderer/15-READER-FUNCTIONAL-SPECIFICATION.md) | §4.3 Amorçage cognitif |
| [`16-CONTENT-TO-READER-ARCHITECTURE.md`](../../renderer/16-CONTENT-TO-READER-ARCHITECTURE.md) | Frontière package ↔ Reader |
| [`COMPOSITION-COMPONENT-CONTRACT.md`](COMPOSITION-COMPONENT-CONTRACT.md) | Composition — View Model, kinds |
| [`RENDERER-COMPONENT-CONTRACT.md`](RENDERER-COMPONENT-CONTRACT.md) | Présentation DOM, immutabilité |
| [Contrat 04](../04-CHAPTER-PACKAGE.md) | Manifest, publication |
| [`LIBRARY-CATALOG-CONTRACT.md`](LIBRARY-CATALOG-CONTRACT.md) | Résolution navigation chapitre cible |
| [`LOCAL-SEARCH-COMPONENT-CONTRACT.md`](LOCAL-SEARCH-COMPONENT-CONTRACT.md) | Indexation vue publiée |
| [`LEARNER-PATRIMONY-COMPONENT-CONTRACT.md`](LEARNER-PATRIMONY-COMPONENT-CONTRACT.md) | Indépendance patrimoine |
| [`OFFLINE-COMPONENT-CONTRACT.md`](OFFLINE-COMPONENT-CONTRACT.md) | Préparation artefact offline |
| [`DISPLAY-PREFERENCES-COMPONENT-CONTRACT.md`](DISPLAY-PREFERENCES-COMPONENT-CONTRACT.md) | Orthogonalité préférences |
| [PDR-D4](../../governance/PRODUCT-DECISION-REGISTRY.md) | Reprise session |

---

*Contrat composant Cognitive Priming — Lot AP-A — proposé.*
