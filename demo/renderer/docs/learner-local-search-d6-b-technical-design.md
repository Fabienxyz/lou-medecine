# Conception technique — Lot D6-B : Modèle d'index et normalisation (PDR-D6)

| | |
|---|---|
| **Lot** | D6-B — Modèle d'index et normalisation |
| **Version document** | **V1** |
| **Décision produit** | [PDR-D6](../../../docs/governance/PRODUCT-DECISION-REGISTRY.md) |
| **Contrat** | [`LOCAL-SEARCH-COMPONENT-CONTRACT.md`](../../../docs/contracts/components/LOCAL-SEARCH-COMPONENT-CONTRACT.md) — **seule autorité** |
| **Statut** | Conception V1 — phase exclusive, sans implémentation |
| **Date** | 2026-08-01 |
| **Prérequis publiés** | D6-A (contrat Local Search approuvé) ; Composition V1 ; PDR-D1 ; PDR-D2 ; PDR-D4 |

**Mission :** spécification technique exclusive — aucun code, aucun commit, aucune modification de contrat, ADR, PDR ou composant voisin.

**Autorité :** le contrat [`LOCAL-SEARCH-COMPONENT-CONTRACT.md`](../../../docs/contracts/components/LOCAL-SEARCH-COMPONENT-CONTRACT.md) prime en cas de conflit. Ce document **fige** `index_schema_version = 1`.

**Références informatives (non normatives pour D6-B) :** [`learner-session-d4-technical-design.md`](learner-session-d4-technical-design.md) §5.2 (ResumePoint) ; [`corpus-composition-v1.json`](../composition/corpus-composition-v1.json) ; fixture package 234.

---

## 1. Modèle logique de l'index

### 1.1 Principes

Le modèle est **logique** — indépendant de toute structure mémoire, format de cache ou API de stockage. Un même jeu d'entrées produit le même index logique et les mêmes SearchHit (LS-14).

L'index **n'est pas** une autorité de contenu (LS-03). Il est reconstruit depuis les artefacts déclarés lus via Package Access.

### 1.2 Entités et relations

```
SearchIndexContext
  └── SearchIndex
        └── IndexedDocument[]
              └── IndexedUnit[]
                    └── IndexedPassage[]
                          └── Occurrence[]   (matérialisées à la requête, pas stockées obligatoirement)

Requête normalisée + SearchIndex → SearchHit[]
```

| Entité | Rôle | Identité stable |
|---|---|---|
| **SearchIndexContext** | Périmètre d'indexation | `(release_id, content_digest, index_schema_version)` |
| **SearchIndex** | Corpus searchable dérivé | Contexte + liste ordonnée de documents |
| **IndexedDocument** | Artefact déclaré indexable | `documentRef` (chemin relatif manifest) |
| **IndexedUnit** | Unité de contenu navigable | `(documentRef, unitType, unitId)` |
| **IndexedPassage** | Fragment textuel searchable | `(documentRef, passageId)` |
| **Occurrence** | Correspondance dans un passage | `(passageId, start, length)` offsets dans texte normalisé du passage |
| **SearchHit** | Résultat de requête | Projection d'une Occurrence + métadonnées navigation |

**Relations :**

- Un **IndexedDocument** appartient à une **Release** et est lié à une ou plusieurs **vues publiées** via `ViewBinding`.
- Un **IndexedUnit** appartient à un **IndexedDocument** ; porte l'**ancre de navigation** D4-compatible.
- Un **IndexedPassage** appartient à un **IndexedUnit** ; porte le **texte normalisé** searchable et le `fieldPath` source.
- Une **Occurrence** référence un **IndexedPassage** ; plusieurs Occurrences par passage sont autorisées si non chevauchantes ou listées par ordre d'apparition.
- Un **SearchHit** référence une Occurrence, une vue, une projection (si applicable), et inclut `snippet` + `matchRanges`.

### 1.3 SearchIndexContext

| Champ | Type logique | Obligation |
|---|---|---|
| `release_id` | string | Obligatoire |
| `content_digest` | string (`sha256:…`) | Obligatoire |
| `index_schema_version` | entier positif | **Valeur figée V1 : `1`** |
| `compositionSpecVersion` | string | Obligatoire — ex. `"1.0"` de la Composition Specification applicable |
| `viewBindings` | `ViewBinding[]` | Ordre = `displayOrder` croissant |

### 1.4 ViewBinding

Décrit quelles sources alimentent quelle vue **publiée**.

| Champ | Obligation |
|---|---|
| `viewId` | Identifiant gelé Composition |
| `displayOrder` | Entier Composition |
| `availability` | `"published"` \| `"planned"` \| `"known_absent"` — seule `"published"` indexe |
| `sources` | Liste ordonnée de sources résolues |

Chaque **source résolue** :

| Champ | Description |
|---|---|
| `sourceKind` | `projection` \| `college-source` \| `questions` \| `scenarios` \| `manifest-alt` |
| `projectionId` | Si projection — identifiant manifest |
| `projectionOrder` | Entier `order` du manifest pour cette projection ; `mergeOrder` Composition si vue fusionne plusieurs projections |
| `documentRefs` | Chemins artefacts concernés, ordre stable |

**Règle :** vue `availability !== "published"` → **aucun** IndexedDocument / SearchHit pour cette vue.

### 1.5 IndexedDocument

| Champ | Obligation |
|---|---|
| `documentRef` | Chemin relatif manifest — clé unique dans l'index |
| `documentKind` | `projection_markdown` \| `college_markdown` \| `question_yaml` \| `scenario_yaml` \| `manifest_alt` |
| `publicationStatus` | `"published"` obligatoire pour indexation |
| `viewIds` | Vues publiées consommatrices (≥1) |
| `projectionId` | Si applicable ; sinon absent |
| `units` | Liste ordonnée d'`IndexedUnit` |

**Documents exclus du corpus indexable** (présents au manifest mais non texte de lecture V1) : `trace_index`, sidecars grounding/réconciliation, chemins SVG, tout artefact non listé §6.1 du contrat D6-A.

### 1.6 IndexedUnit

| Champ | Obligation |
|---|---|
| `unitType` | Voir §1.6.1 |
| `unitId` | Identifiant officiel stable |
| `anchor` | `SearchAnchor` — navigation Reader / compatibilité D4 |
| `passages` | Liste ordonnée d'`IndexedPassage` |

#### 1.6.1 Typologie `unitType` (V1)

| unitType | unitId | documentKind | Vue(s) typique(s) |
|---|---|---|---|
| `element` | ID élément pédagogique (`MEC-*`, `CR-*`, …) | `projection_markdown` | `mental-model`, `notions`, `clinical-cases` |
| `content_block` | Ancre `{#cb-*}` | `projection_markdown` | idem |
| `college_section` | `section_path` sérialisé (§1.7) | `college_markdown` | `college-official` |
| `question` | `question_id` | `question_yaml` | `qcm` |
| `scenario` | `scenario_id` | `scenario_yaml` | `clinical-cases` |
| `scenario_segment` | `{scenario_id}/{segment_id}` | `scenario_yaml` | `clinical-cases` |
| `figure_alt` | `{visual_id}` ou `{element}` manifest | `manifest_alt` | vue liée à la projection du visuel |

### 1.7 SearchAnchor (navigation)

Structure **polymorphe** — le Reader exécute la navigation sans réinterpréter le corpus.

| `anchor.kind` | Champs | ResumePoint D4 compatible |
|---|---|---|
| `element_block` | `elementId` ; `blockAnchor` optionnel (`cb-*`) | `mental-model`, `notions` — kind `element_block` |
| `section_path` | `path` : string[] titres hiérarchiques | `college-official` — kind `section_path` |
| `question_id` | `questionId` | `qcm` — kind `question_id` |
| `scenario_scroll` | `scenarioId` ; `segmentId` optionnel | `clinical-cases` — kind `view_scroll` (Reader scroll best-effort) |
| `manifest_alt` | `elementId` ; `visualId` | `element_block` si vue projection ; sinon scroll vue |

**Règle D4 :** le SearchHit **DOIT** porter un `anchor` convertible par le Reader en action de navigation ; il **NE DOIT PAS** supposer que le Session Service consomme le SearchHit.

### 1.8 IndexedPassage

| Champ | Obligation |
|---|---|
| `passageId` | Identifiant déterministe (§6 tie-break) |
| `fieldPath` | Chemin logique du champ source (§3.4) |
| `normalizedText` | Texte après pipeline `normText` (§3) |
| `sourceOrdinal` | Entier ≥0 — ordre d'extraction dans le document |
| `documentOffsetBase` | Offset inclus du début de ce passage dans le **texte normalisé document** (§1.10) |

`passageId` V1 = concaténation stable :

```text
{documentRef}#/{unitId}#/{fieldPath}#/{sourceOrdinal}
```

(séparateur `#/` literal, sans URL encoding)

### 1.9 Occurrence

| Champ | Description |
|---|---|
| `passageId` | Référence passage |
| `start` | Offset inclus dans `normalizedText` du passage |
| `length` | Longueur ≥1 |

**Règle :** `start` et `length` sont mesurés en **unités UTF-16 code units** du texte normalisé du passage — convention explicite V1 pour stabilité inter-tests JavaScript. Toute évolution incompatible **DOIT** incrémenter `index_schema_version`.

### 1.10 Texte normalisé document

Pour satisfaire l'ordonnancement contractuel « offset dans le document normalisé » (D6-A §10.2), chaque **IndexedDocument** possède un flux logique `documentNormalizedText` :

1. Parcourir les unités dans l'ordre d'extraction (§2.3) ;
2. Parcourir les passages de chaque unité par `sourceOrdinal` croissant ;
3. Concaténer chaque `normalizedText` ;
4. Insérer le séparateur U+001E (`RECORD SEPARATOR`) entre deux passages consécutifs.

`documentOffsetBase` d'un passage = longueur cumulée du préfixe (textes + séparateurs) avant ce passage.

**Offset document d'une Occurrence** = `documentOffsetBase + start` (§1.10).

### 1.11 SearchHit

Superset des champs contractuels D6-A §9.2 :

| Champ | Obligation |
|---|---|
| `release_id` | Du contexte |
| `viewId` | Vue publiée |
| `projectionId` | string ou `""` si non applicable |
| `documentRef` | Artefact déclaré |
| `unitType`, `unitId` | Unité indexée |
| `anchor` | `SearchAnchor` |
| `fieldPath` | Provenance passage |
| `passageId` | Passage source |
| `matchRanges` | `{ start, length }[]` relatifs au **passage normalisé**, ordre croissant par `start` |
| `documentOffset` | Offset dans `documentNormalizedText` (§1.10) — clé de tri niveau 4 |
| `snippet` | Extrait affichable (§5) |
| `snippetMatchRanges` | Plages relatives au **snippet**, même ordre que correspondances |
| `navigation` | Métadonnées suffisantes pour changement de vue + ancrage + surbrillance |

Le Reader **affiche** `snippet` tel quel ; la surbrillance utilise `snippetMatchRanges` — **sans** reconstruire le snippet (LS-07).

---

## 2. Pipeline logique

### 2.1 Vue d'ensemble

```text
Manifest publié
        ↓
Package Access (lecture octets artefacts déclarés)
        ↓
Résolution ViewBinding (Composition + manifest + disponibilités vues)
        ↓
Extraction (par documentKind)
        ↓
Normalisation normText (§3)
        ↓
Construction IndexedDocument / Unit / Passage
        ↓
Assemblage SearchIndex
        ↓
[Requête utilisateur]
        ↓
Normalisation requête normQuery (§3.5)
        ↓
Matching (§4)
        ↓
Génération SearchHit + snippets (§5)
        ↓
Ordonnancement (§6)
        ↓
Reader (affichage + navigation)
```

### 2.2 Étapes normatives

| Étape | Acteur logique | Entrée | Sortie |
|---|---|---|---|
| **1. Résolution contexte** | Runtime | `release_id`, manifest, catalogue digest, Reading View Model | `SearchIndexContext` |
| **2. Énumération** | Runtime | manifest | Liste triée `documentRef` éligibles texte V1 |
| **3. Lecture** | Runtime via Package Access | `documentRef` | Octets / texte brut |
| **4. Filtrage publication** | Service | manifest registry entry | Skip si statut ≠ `published` |
| **5. Extraction** | Service | brut + `documentKind` | Arborescence unités + textes bruts |
| **6. Normalisation** | Service | textes bruts | `normalizedText` par passage |
| **7. Index build** | Service | documents | `SearchIndex` |
| **8. Cache validate** | Service | cache record + contexte | `valid` \| `stale` \| `missing` |
| **9. Query** | Service | `normQuery` + index | Occurrences |
| **10. Hit assembly** | Service | Occurrences | `SearchHit[]` ordonnés |

**Pureté :** étapes 4–10 **DOIVENT** être réalisables dans le Local Search Service sans I/O (LS-11).

### 2.3 Ordre de traitement des documents

Pour un index déterministe, l'ordre de construction des `IndexedDocument` **DOIT** être :

1. Par `viewId` — `displayOrder` croissant (vues publiées uniquement) ;
2. Par `projectionOrder` croissant au sein de la vue ;
3. Par `documentRef` — ordre lexicographique octets UTF-8.

Cet ordre est **indépendant** de l'ordre retourné par `collectDeclaredArtifactPaths` (qui inclut des non-indexables).

### 2.4 Échec partiel

Si un artefact **déclaré et indexable** est **absent** ou **illisible** :

- l'index **PEUT** être construit pour les autres documents ;
- un diagnostic `LS-BUILD-PARTIAL` **DOIT** être émis ;
- aucun SearchHit **NE DOIT** être inventé pour le document manquant.

---

## 3. Normalisation — `index_schema_version = 1`

### 3.1 Fonction `normText` (corpus et snippets)

Appliquée identiquement à tout texte extrait avant indexation.

| Étape | Règle | Exemple |
|---|---|---|
| **N1 — Encodage** | Interpréter l'artefact comme UTF-8 ; rejeter document si invalide (`LS-DOC-INVALID`) | — |
| **N2 — Unicode** | Normalisation **NFC** | `e\u0301` → `é` |
| **N3 — Fin de ligne** | Remplacer `\r\n` et `\r` par `\n` | — |
| **N4 — Tabulations** | Remplacer `\t` par espace U+0020 | — |
| **N5 — Espaces de fin** | Supprimer espaces et tab en fin de chaque ligne | `"texte  \n"` → `"texte\n"` |
| **N6 — Lignes vides multiples** | Réduire ≥3 `\n` consécutifs à exactement `\n\n` | — |
| **N7 — Casse ASCII** | Remplacer `A`–`Z` par `a`–`z` ; **aucune** autre modification de casse | `Insuffisance` → `insuffisance` ; `Été` inchangé |
| **N8 — Trim global** | Supprimer espaces / `\n` en tête et fin du texte | — |

**Interdit V1 :** dé-accentuation, translittération, stemming, correction orthographique.

### 3.2 Extraction Markdown (projections, Collège)

Appliquée **avant** `normText` sur le texte extrait.

| Élément | Règle d'extraction |
|---|---|
| **Frontmatter YAML** | Bloc initial `---` … `---` : **exclu intégralement** |
| **Commentaires HTML** | `<!-- … -->` : exclus |
| **Images** | `![…](…)` : exclues (pas de texte searchable) |
| **Liens** | `[texte](url)` → conserver `texte` ; `[texte][ref]` → conserver `texte` |
| **Emphase** | Supprimer marqueurs `**`, `__`, `*`, `_` autour du texte conservé |
| **Code inline** | `` `code` `` → conserver `code` |
| **Blocs code** | ``` … ``` : **exclus** intégralement |
| **Titres ATX** | `#`…`######` + texte ; retirer `#` ; **capturer** `{#id}` comme ancre avant retrait |
| **Ancres inline `{#id}`** | Retirer de la prose ; enregistrer comme ancre de bloc si motif `cb-` ou élément |
| **Listes** | Conserver texte ; retirer préfixes `-`, `*`, `+`, `\d+.` + espace |
| **Tableaux** | Lignes `\|` : cellules séparées par espace ; retirer `\|` et lignes séparateurs `---` |
| **Blockquotes** | Retirer `>` en début de ligne |

**Collège — sections :**

- Chaque titre ATX ouvre une **unité** `college_section`.
- `section_path` = liste des titres normalisés (N2–N5 seulement, **sans** N7) depuis racine jusqu'au titre courant.
- `section_path_key` = `section_path.join("\u001f")` (unit separator) — utilisé comme `unitId`.

**Projections — éléments et blocs :**

- Titre ATX avec `{#ElementId}` → unité `element` ; `unitId = ElementId`.
- Ligne ou segment contenant `{#cb-…}` → unité `content_block` ; `unitId = cb-…`.
- Prose sous un titre jusqu'au prochain titre de niveau ≤ courant → passages rattachés à l'unité courante.

### 3.3 Extraction YAML — Questions (contrat 07)

**Prérequis :** entrée manifest `questions[].status === "published"`.

| fieldPath | Source YAML | Unité |
|---|---|---|
| `stem.text` | `stem.text` | `question` / `question_id` |
| `options[i].label` | i = ordre fichier 0…n-1 | idem |
| `options[i].explanation` | idem | idem |

**Exclus :** `claim_facets*`, `kp_refs`, `score_model`, `editorial`, `status`, identifiants facettes, clés techniques.

Texte bloc YAML (`|`, `>`) : déplier en prose avec `\n` préservés ; puis `normText`.

### 3.4 Extraction YAML — Scénarios (contrat 09)

**Prérequis :** entrée manifest `scenarios[].status === "published"`.

| fieldPath | Source | Unité |
|---|---|---|
| `title` | racine | `scenario` |
| `situation.text` | racine | `scenario` |
| `segments[i].prompt` | segment `type: decision` | `scenario_segment` |
| `segments[i].choices[j].label` | idem | idem |
| `segments[i].choices[j].feedback` | idem | idem |
| `segments[i].text` | segment `type: narrative` | idem |

`unitId` segment = `{scenario_id}/{segment.id}`. Ordre segments = ordre fichier.

**Types segment V1 indexables :** `decision`, `narrative` uniquement. Autres types : ignorés sans diagnostic fatal.

### 3.5 Extraction `manifest_alt`

Pour chaque entrée `visuals[]` avec `alt` non vide :

- `documentRef` = `"manifest:visuals/{visual.id}"` (identifiant logique interne — **pas** un artefact filesystem supplémentaire).
- `unitId` = `visual.id` ou `visual.element`.
- Texte = `alt` uniquement.

### 3.6 Normalisation requête — `normQuery`

| Étape | Règle |
|---|---|
| **Q1** | NFC |
| **Q2** | Fin de ligne → espace |
| **Q3** | Tab → espace |
| **Q4** | Casse ASCII (identique N7) |
| **Q5** | Réduire toute suite d'espaces à un seul espace |
| **Q6** | Trim |

**Résultat `normQuery` :**

| Cas | Comportement matching |
|---|---|
| Chaîne vide après Q6 | **Aucun** SearchHit ; liste vide |
| Longueur 1 | **Aucun** SearchHit ; liste vide |
| Longueur ≥2 | Matching autorisé |

### 3.7 Tokenisation requête

Après `normQuery` :

- Découper sur espace U+0020 ;
- Tokens vides exclus ;
- Chaque token doit avoir longueur ≥2 caractères ;
- Si aucun token restant → **aucun** SearchHit.

---

## 4. Matching

### 4.1 Modèle

- **Type :** sous-chaîne contiguë (**pas** fuzzy, **pas** stemming, **pas** IA).
- **Champ :** `normalizedText` de chaque `IndexedPassage` indexé.
- **Casse :** déjà neutralisée par N7 / Q4.

### 4.2 Requête mono-token

Le token `t` **matche** un passage si `normalizedText` contient `t` comme sous-chaîne.

Chaque occurrence non chevauchante **PEUT** produire un SearchHit distinct si la politique V1 retient **toutes** les occurrences — **V1 retient toutes les occurrences** (pas seulement la première).

### 4.3 Requête multi-tokens

Soit `{ t1, t2, …, tn }` après tokenisation.

Un passage **matche** si et seulement si **chaque** token apparaît comme sous-chaîne dans `normalizedText` (**sémantique ET**).

L'ordre des tokens est **indifférent**. Les tokens **NE DOIVENT PAS** être requis adjacents.

### 4.4 Occurrences multiples

Pour chaque token en mono-token : énumérer toutes les positions `start` en parcours gauche-droite greedy : chercher `indexOf(token, from)` avec `from = prevStart + 1` après chaque match.

Pour multi-token : une Occurrence **logique** par passage matchant ; `matchRanges` **DOIT** lister une plage par token — une plage par token la **première** occurrence gauche-droite de ce token dans le passage.

### 4.5 Requête vide / sans résultat

| Situation | Résultat |
|---|---|
| `normQuery` vide ou longueur 1 | `[]` |
| Aucun passage ne matche | `[]` |
| Vue `planned` | Aucun passage indexé — contribue `[]` |

**Interdit :** message d'erreur global ; fallback inventé ; recherche globale.

---

## 5. Snippets

### 5.1 Responsabilité

Le Local Search Service **DOIT** produire `snippet` et `snippetMatchRanges` (LS-07). Le Reader **NE RECONSTRUIT PAS**.

### 5.2 Paramètres V1 figés

| Paramètre | Valeur |
|---|---|
| `SNIPPET_MAX_LEN` | 160 caractères (code units UTF-16 du texte **non normalisé affiché**) |
| `SNIPPET_CONTEXT_BEFORE` | 60 |
| `SNIPPET_CONTEXT_AFTER` | 60 |
| Ellipse | `…` (U+2026) |

### 5.3 Algorithme

Entrée : `normalizedText` du passage, `matchRanges` (première plage primaire = première plage de la première token matched en mono ; en multi = plage du token le plus à gauche).

1. Choisir **fenêtre centrée** sur la plage primaire : `[start - BEFORE, end + AFTER]` clampée aux bornes.
2. Si fenêtre > `SNIPPET_MAX_LEN` : réduire symétriquement autour du centre de la plage primaire.
3. Ajuster aux **limites de mot** (espace U+0020) si coupure interne — reculer ou avancer au espace le plus proche (recherche linéaire, fenêtre max 50 caractères depuis le bord).
4. Construire `snippet` depuis le **texte normalisé** (casse ASCII foldée — affichage V1 accepte cette forme).
5. Préfixer `…` si fenêtre tronquée à gauche ; suffixer si tronquée à droite.
6. Calculer `snippetMatchRanges` par translation des offsets passage → snippet.

**Stabilité :** à passage, plages et paramètres identiques → snippet identique (tests T-SNIPPET).

### 5.4 Mise en évidence

Le contrat UI de surbrillance **n'est pas** D6-B. Le SearchHit **DOIT** porter `snippetMatchRanges` suffisantes pour surbrillance **sans** parsing libre du snippet.

---

## 6. Ordonnancement

### 6.1 Clé composite (LS-08)

Chaque SearchHit reçoit une clé de tri `sortKey` :

| Niveau | Champ | Règle |
|---|---|---|
| 1 — Vue | `viewSort` | Entier `displayOrder` de la vue |
| 2 — Projection | `projectionSort` | Entier `projectionOrder` manifest ; si non applicable → `9999` ; tie interne : `projectionId` lexicographique UTF-8 |
| 3 — Document | `documentRef` | Lexicographique octets UTF-8 |
| 4 — Offset | `documentOffset` | Offset document de l'Occurrence (§1.10) — première plage |
| 5 — Passage | `passageId` | Lexicographique UTF-8 |
| 6 — Plage | `matchRangeIndex` | Index 0…n-1 dans `matchRanges` |
| 7 — Unité | `unitId` | Lexicographique UTF-8 |

Comparaison **lexicographique niveau par niveau** ; aucun tri externe non spécifié.

### 6.2 Projection order

- Source : `manifest.projections[].order` pour `projectionId`.
- Vue `mental-model` : deux projections — trier par `mergeOrder` Composition puis `order` manifest.
- Questions / scénarios : `projectionSort = 9998` (registre) ; ordre intra-vue par `documentRef`.

### 6.3 Tie-break

Les niveaux 5–7 **DOIVENT** garantir l'absence d'ordre indéfini. Égalité totale impossible si `passageId` inclut `sourceOrdinal` unique.

---

## 7. Diagnostics

Codes logiques — **sans** prescription UI.

| Code | Signification | Émetteur |
|---|---|---|
| `LS-CACHE-VALID` | Cache réutilisable | Service |
| `LS-CACHE-STALE` | Digest, schema ou bindings obsolètes | Service |
| `LS-CACHE-MISSING` | Aucun cache | Service |
| `LS-SCHEMA-INCOMPATIBLE` | Cache `index_schema_version` ≠ courant | Service |
| `LS-DOC-MISSING` | Artefact indexable absent (Package Access) | Runtime |
| `LS-DOC-INVALID` | UTF-8 invalide ou YAML illisible | Service |
| `LS-ANCHOR-INVALID` | Ancre extraite non conforme identifiants officiels | Service |
| `LS-VIEW-SKIPPED` | Vue non publiée — exclus index | Service |
| `LS-ARTIFACT-SKIPPED` | Entrée registry non `published` | Service |
| `LS-BUILD-PARTIAL` | Index partiel — au moins un doc indexable en échec | Service |
| `LS-QUERY-TOO-SHORT` | Requête vide ou longueur 1 après normQuery | Service |
| `LS-SCOPE-REFUSED` | `release_id` ≠ Release ouverte | Runtime |

**Règle :** diagnostics **NE DOIT PAS** bloquer l'affichage des hits valides déjà indexés sauf `LS-SCOPE-REFUSED`.

---

## 8. Jeux de tests (référence D6-C)

### 8.1 Principes

- Tests **purs** sur Local Search Service — sans I/O, sans DOM.
- Entrées : artefacts texte inline ou fixtures minimales + `SearchIndexContext` synthétique.
- Sorties : comparaison **égalité stricte** JSON normalisé des SearchHit et listes diagnostics.

### 8.2 Jeux obligatoires

| Id | Objectif | Méthode |
|---|---|---|
| **T-NORM-01…20** | Stabilité `normText` / `normQuery` | Chaînes golden — NFC, casse, espaces, markdown |
| **T-EXTRACT-MD-01…10** | Extraction projections | Fixture markdown réduite → unités + passages attendus |
| **T-EXTRACT-COL-01…05** | Sections Collège | Titres imbriqués → `section_path` |
| **T-EXTRACT-Q-01…05** | Questions YAML | Champs inclus / exclus |
| **T-EXTRACT-SC-01…05** | Scénarios YAML | decision + narrative |
| **T-MATCH-01…15** | Matching | Mono/multi-token ; AND ; aucun hit |
| **T-SNIPPET-01…10** | Snippets | Longueur, ellipses, `snippetMatchRanges` stables |
| **T-SORT-01…10** | Ordonnancement | Clé composite ; tie-break |
| **T-HIT-GOLDEN-01…05** | Bout en bout Service | Index miniature + requête → SearchHit[] golden |
| **T-REPRO-01** | Reproductibilité | Double exécution — égalité bit-à-bit résultats |
| **T-VIEW-01…03** | Disponibilité vues | `planned` → 0 hit ; `published` → hits |
| **T-SVG-01** | Invariant LS-05 | SVG ignoré ; seul `alt` manifest indexé |
| **T-D4-ANCHOR-01…05** | Compatibilité ancres | Chaque `anchor.kind` mappe vers kind ResumePoint autorisé |

### 8.3 Fixture de référence

Le package **234** (`cardio__234__2022__1`) **PEUT** servir de fixture d'intégration Runtime (hors scope tests unitaires Service purs). Les golden unitaires **DOIVENT** rester **minimalistes** — pas de dépendance au package complet pour T-NORM / T-MATCH.

### 8.4 Critère de passage D6-C

D6-C **NE PEUT** être déclaré conforme Service que si **100 %** des jeux T-NORM, T-MATCH, T-SNIPPET, T-SORT, T-HIT-GOLDEN, T-REPRO passent avec `index_schema_version = 1`.

---

## 9. Hors périmètre D6-B

Relèvent d'autres lots — **non spécifiés ici** :

| Domaine | Lot / responsable |
|---|---|
| Implémentation mémoire, structures runtime | D6-C / D6-D |
| Cache persistant, format sérialisé | D6-D |
| Optimisation, index préchauffé, perf chapitre 234 | Post-V1 / D6-D+ |
| UI panneau recherche, raccourcis, accessibilité | Reader / D6-E |
| Intégration Package Access I/O | D6-D |
| Build-time index Fabrique | D6 contrat §16.2 |
| Recherche globale multi-Release | PDR-G4 |
| Commit session après navigation recherche | Reader — politique D4 |
| Tests Playwright offline | D6-F |

---

## 10. Décisions figées par D6-B

| # | Décision | Valeur V1 |
|---|---|---|
| F1 | `index_schema_version` | `1` |
| F2 | Normalisation texte | NFC + fin ligne + casse **ASCII** uniquement |
| F3 | Matching | Sous-chaîne ; AND multi-token ; toutes occurrences |
| F4 | Longueur requête minimale | 2 caractères après `normQuery` |
| F5 | Offsets | UTF-16 code units |
| F6 | Snippet max | 160 ; ellipse U+2026 |
| F7 | Tri | 7 niveaux §6.1 |
| F8 | Champs YAML indexables | Listes fermées §3.3–§3.4 |
| F9 | SVG | Exclu sauf `alt` manifest |
| F10 | Vue `planned` | Index vide |
| F11 | `passageId` | Formule §1.8 |
| F12 | Ancres SearchHit | Typologie §1.7 compatible D4 |

---

## 11. Paramètres laissés à l'implémentation (non architecturaux)

| Paramètre | Borne |
|---|---|
| Représentation interne de l'index en mémoire | Libre — équivalence comportementale exigée |
| Format sérialisation cache | Libre — invalidation par triplet contexte |
| Algorithme `indexOf` / recherche sous-chaîne | Libre — résultat identique exigé |
| Regroupement Occurrences chevauchantes | Libre si SearchHit identiques |

Aucun de ces paramètres **NE DOIT** modifier sortKey, snippets, ou matching.

---

## 12. Documents connexes

| Document | Rôle |
|---|---|
| [`LOCAL-SEARCH-COMPONENT-CONTRACT.md`](../../../docs/contracts/components/LOCAL-SEARCH-COMPONENT-CONTRACT.md) | Autorité normative D6-A |
| [`learner-session-d4-technical-design.md`](learner-session-d4-technical-design.md) | ResumePoint — compatibilité ancres |
| [`corpus-composition-v1.json`](../composition/corpus-composition-v1.json) | viewId, displayOrder, sources |
| [`package-access-shared.js`](../library/package-access-shared.js) | Énumération artefacts déclarés (informatif) |

---

*Conception technique Lot D6-B — V1 — proposé.*
