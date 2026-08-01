# Conception technique — Lot AP-B : Cognitive Priming (Reader Acceptance V1)

| | |
|---|---|
| **Lot** | AP-B — Conception technique Cognitive Priming |
| **Version document** | **V1** |
| **Décision produit** | [PDR-B5](../../../docs/governance/PRODUCT-DECISION-REGISTRY.md) · [PDR-B1](../../../docs/governance/PRODUCT-DECISION-REGISTRY.md) |
| **Contrat** | [`COGNITIVE-PRIMING-COMPONENT-CONTRACT.md`](../../../docs/contracts/components/COGNITIVE-PRIMING-COMPONENT-CONTRACT.md) — **seule autorité** |
| **Statut** | Conception V1 — phase exclusive, sans implémentation |
| **Date** | 2026-08-01 |
| **Prérequis publiés** | AP-A (contrat Cognitive Priming approuvé) ; Composition V1 ; PDR-D1 ; PDR-D2 ; PDR-D4 ; PDR-D6 ; PDR-D7 ; Patrimoine E-A…E-D |

**Mission :** spécification technique exclusive — aucun code, aucun pseudo-code exécutable, aucun commit, aucune modification de contrat, ADR, PDR ou gouvernance produit.

**Autorité :** le contrat [`COGNITIVE-PRIMING-COMPONENT-CONTRACT.md`](../../../docs/contracts/components/COGNITIVE-PRIMING-COMPONENT-CONTRACT.md) prime en cas de conflit. Ce document **fige** `schema_version = 1` et les constantes AP-B §2.

**Références informatives (non normatives pour AP-B) :** [`learner-local-search-d6-b-technical-design.md`](learner-local-search-d6-b-technical-design.md) (ViewBinding, index) ; [`learner-session-d4-technical-design.md`](learner-session-d4-technical-design.md) (ResumePoint, CE-04) ; [`corpus-composition-v1.json`](../composition/corpus-composition-v1.json) ; [`package.js`](../../../tools/lou-build/lib/package.js) (assembleManifest) ; fixture package 234.

---

## 1. Synthèse architecturale

### 1.1 Chaîne de bout en bout

```
build/cognitive-priming.source.yaml   (curatif build — jamais lu par Reader)
        ↓  Stage J — publishCognitivePriming()
build/cognitive-priming.v1.json       (artefact publié)
        ↓  assembleManifest()
manifest.cognitive_priming_path
        ↓  compose(manifest, spec)
ReadingViewModel.views[cognitive-priming].primingRef
        ↓  Package Access — resolveAsset(path)
Renderer — présentation Amorçage
        ↓  (optionnel) clic EDN → Library Catalog.getActiveRelease(chapter_id)
Navigation chapitre cible
```

### 1.2 Découpage lots implémentation

| Lot | Périmèche | Livrables code |
|---|---|---|
| **AP-C** | Fabrique + package 234 | `cognitive-priming.js` lou-build ; source YAML 234 ; gate validation ; `collectDeclaredArtifactPaths` ; manifest 234 régénéré |
| **AP-D** | Composition | `corpus-composition-v1.json` ; `composition-spec-schema.js` ; `composition-engine.js` ; `reading-view-model.js` ; tests Composition |
| **AP-E** | Renderer + intégrations | module rendu Amorçage ; navigation EDN ; extension Local Search ViewBinding ; styles ; `app.js` branchement ; tests Reader |
| **AP-F** | Validation E2E | smoke Playwright ; matrice conformité ; non-régression D4/D6/D7 |

Aucune décision structurante **hors** ce document ne doit être requise pour AP-C, AP-D ou AP-E.

### 1.3 Constantes figées AP-B

| Constante | Valeur V1 |
|---|---|
| `COGNITIVE_PRIMING_SCHEMA_VERSION` | `1` |
| `COGNITIVE_PRIMING_ARTIFACT_REL` | `build/cognitive-priming.v1.json` |
| `COGNITIVE_PRIMING_SOURCE_REL` | `build/cognitive-priming.source.yaml` |
| `COGNITIVE_PRIMING_MANIFEST_FIELD` | `cognitive_priming_path` |
| `COGNITIVE_PRIMING_SOURCE_KIND` | `"cognitive-priming"` |
| `COGNITIVE_PRIMING_SOURCE_REF` | `"manifest"` |
| `AI_COMPLEMENT_BADGE_V1` | `"Complément pédagogique (IA) — non issu du Collège"` |
| `PROFILE_STAR_MIN` / `PROFILE_STAR_MAX` | `1` / `5` |

---

## 2. Artefact publié

### 2.1 Emplacement et nommage

| Élément | Valeur |
|---|---|
| **Chemin publié figé V1** | `build/cognitive-priming.v1.json` |
| **Champ manifest** | `cognitive_priming_path: "build/cognitive-priming.v1.json"` |
| **Encodage** | UTF-8, JSON, fin de ligne `\n` en fin de fichier (convention lou-build) |

Le fichier **DOIT** résider sous le répertoire chapitre publié et **DOIT** être inclus dans `collectDeclaredArtifactPaths(manifest)` pour Package Access, offline, digest et install.

### 2.2 Entrée curative build (non publiée)

| Élément | Valeur |
|---|---|
| **Fichier source** | `build/cognitive-priming.source.yaml` |
| **Lecture** | **Uniquement** lou-build Stage J — **jamais** Reader, Composition, Package Access |
| **Publication** | **Non** copié tel quel dans le package ; seul le JSON généré est publié |

**Justification V1 :** capitalisation Item 234 — contenu Amorçage produit par le processus éditorial (Blueprint + métadonnées + restructuration Collège + compléments IA identifiés), matérialisé dans un curatif build versionné. La Fabrique **génère** le JSON ; le Reader **ne lit jamais** le YAML.

### 2.3 Schéma source YAML (build-only)

Structure logique alignée sur le contrat §4.4 — champs identiques au JSON cible :

| Racine | Contenu |
|---|---|
| `schema_version` | `1` |
| `profile.comprehension` | entier 1–5 |
| `profile.memorization` | entier 1–5 |
| `prerequisites.edn_references[]` | `reference_id`, `chapter_id`, `label`, `item_label?` |
| `prerequisites.inter_edn` | **absent** ou `[]` |
| `prerequisites.ai_complements[]` | `complement_id`, `sentence` (badge injecté à la génération) |
| `summary.bullets[]` | strings non vides |

| Règle | Énoncé |
|---|---|
| **Inter-EDN** | Présence d'entrées non vides dans `inter_edn` → **échec build** |
| **Badge IA** | **Non** saisi dans le YAML — injecté par le générateur avec `AI_COMPLEMENT_BADGE_V1` |
| **`chapter_id` artefact** | Injecté par le générateur depuis `inventory.chapter` — **pas** auteur dans le YAML |

### 2.4 Génération (Stage J)

**Module lou-build (AP-C) :** `tools/lou-build/lib/cognitive-priming.js`

| Fonction logique | Rôle |
|---|---|
| `loadCognitivePrimingSource(chapterDir)` | Lit `COGNITIVE_PRIMING_SOURCE_REL` si présent ; sinon retourne `null` |
| `buildCognitivePrimingRecord(source, inventory)` | Produit `CognitivePrimingRecord` complet |
| `validateCognitivePrimingRecord(record, manifestChapter)` | Applique V-CP-01…09 du contrat |
| `publishCognitivePriming(chapterDir, inventory, packageConfig)` | Écrit JSON ; retourne chemin relatif ou `null` |

**Algorithme `publishCognitivePriming` :**

1. Si `COGNITIVE_PRIMING_SOURCE_REL` absent :
   - si `editorial_completeness === "complete"` → **erreur bloquante** ;
   - sinon → retour `null` (package incomplet — Amorçage non publié).
2. Parser YAML → objet source.
3. Construire record JSON (`chapter_id` = `inventory.chapter` ; badge IA injecté).
4. Valider record (V-CP-01…09).
5. Écrire `COGNITIVE_PRIMING_ARTIFACT_REL`.
6. Retourner `COGNITIVE_PRIMING_ARTIFACT_REL`.

### 2.5 Contenu éditorial Item 234 (AP-C — hors AP-B)

AP-B **ne prescrit pas** le contenu médical du golden master. AP-C produit le YAML 234 conforme doc 15 §4.3. Sources éditoriales autorisées au build :

- profil : métadonnées Blueprint / décision capitalisation ;
- références EDN : Blueprint / registre chapitre ;
- compléments IA : génération identifiée, une phrase, tracée en capitalisation ;
- résumé : Collège restructuré / projections publiées — **sans** extraction runtime.

### 2.6 Déclaration manifest

**Extension `assembleManifest` (AP-C)** — après `publishCognitivePriming`, avant `attachReleaseIdentity` :

- si fichier artefact existe sur disque → `manifest.cognitive_priming_path = COGNITIVE_PRIMING_ARTIFACT_REL` ;
- sinon → champ **absent** (pas de `null` explicite).

**Neutralisation Reader :** le champ **NE DOIT PAS** apparaître dans `validateManifestReaderNeutral` comme vocabulaire produit — c'est une déclaration d'artefact, autorisée (parallèle `college_source_path`).

### 2.7 Cycle de vie

| Phase | État |
|---|---|
| **Build mutate** | Génération JSON + écriture manifest |
| **Build validate** | Vérification présence + validation si `complete` |
| **Install bibliothèque** | Artefact copié avec le package ; digest inclut bytes JSON |
| **Offline prepare** | Précache via `collectDeclaredArtifactPaths` |
| **Runtime Reader** | Lecture seule via Package Access |
| **Républication** | Nouveau `publication_version` ; contenu Amorçage immuable pour une Release donnée |

### 2.8 Comportement si absent

| Contexte | Comportement |
|---|---|
| Package legacy sans YAML ni JSON | Pas de `cognitive_priming_path` ; vue `planned` — **rétrocompatible** |
| Package `complete` golden master | **Interdit** après AP-C — gate build FAIL |
| Runtime manifest déclare path mais fichier manquant | Renderer : message erreur explicite (`projectionMissing` ou message dédié CP-ARTIFACT-MISSING) — **pas** de fallback contenu |

---

## 3. Pipeline lou-build

### 3.1 Principe de changement minimal

**Aucun nouveau stage A–K.** Extension **localisée** :

- **Stage J (packaging)** — génération artefact + écriture manifest ;
- **Stage I (validation)** — gate optionnelle si `complete` ;
- **Module lib** — validation réutilisable.

Pas de modification des stages E (blueprint), F (projections), G (visuals), H (grounding) pour AP-V1.

### 3.2 Ordre d'exécution Stage J (figé AP-B)

```
1. invalidatePublishableState (existant)
2. publishCollegeSource (existant)
3. publishCognitivePriming (NOUVEAU)
4. assembleManifest (étendu — cognitive_priming_path)
5. write manifest.json
```

**Dépendances :** inventory, sourceMeta, packageConfig, projections, reconciliation, visuals, evaluation — **inchangées**. Cognitive Priming **ne dépend pas** des projections publiées pour la **génération** V1 (contenu porté par source YAML).

### 3.3 Stage I — validation

**Extension validation (AP-C)** — dans `tools/lou-build/src/stages/validation.ts` ou module dédié appelé depuis I :

| Condition | Gate |
|---|---|
| `packageConfig.editorial_completeness === "complete"` | `COGNITIVE_PRIMING_SOURCE_REL` **DOIT** exister |
| idem | JSON **DOIT** exister et passer V-CP-01…09 |
| idem | `manifest.cognitive_priming_path` **DOIT** être présent post-packaging (vérif post-J en validate+build CI) |
| Mode `slice` / incomplet | Absence Amorçage **autorisée** — pas d'échec |

**Messages d'erreur build (figés AP-B) :**

| Code | Condition |
|---|---|
| `CP-BUILD-SOURCE-MISSING` | Release `complete` sans source YAML |
| `CP-BUILD-VALIDATION` | Record JSON invalide (détail règle V-CP-xx) |
| `CP-BUILD-ARTIFACT-MISSING` | Path déclaré mais fichier absent après génération |
| `CP-BUILD-INTER-EDN` | `inter_edn` non vide |

### 3.4 Extensions aux utilitaires existants

| Fichier | Modification AP-C |
|---|---|
| `tools/lou-build/lib/package.js` | `assembleManifest` — champ `cognitive_priming_path` |
| `tools/lou-build/lib/release-identity.js` | `collectDeclaredArtifactPaths` — add `cognitive_priming_path` |
| `demo/renderer/library/package-access-shared.js` | idem (miroir browser) |
| `tools/lou-build/src/stages/packaging.ts` | appel `publishCognitivePriming` |

**Critère succès build 234 :** `lou-build validate` + `lou-build build` PASS ; manifest contient `cognitive_priming_path` ; gate I PASS.

### 3.5 Tests lou-build (AP-C)

| Id | Fichier cible | Objet |
|---|---|---|
| T-LB-CP-01 | `tools/lou-build/test/cognitive-priming.test.js` | Validation record V-CP-01…09 |
| T-LB-CP-02 | idem | Génération JSON depuis YAML minimal valide |
| T-LB-CP-03 | idem | Rejet `inter_edn` non vide |
| T-LB-CP-04 | idem | Rejet badge IA incorrect si fourni dans record brut |
| T-LB-CP-05 | idem | Injection badge à la génération |
| T-LB-CP-06 | `college-source-publish.test.js` pattern | `assembleManifest` inclut path si fichier présent |
| T-LB-CP-07 | `release-identity.test.js` pattern | `collectDeclaredArtifactPaths` inclut cognitive priming |
| T-LB-CP-08 | intégration 234 | build chapitre complet — gate complete exige Amorçage |

---

## 4. Composition

### 4.1 Modification Composition Specification

**Fichier :** `demo/renderer/composition/corpus-composition-v1.json`

**Avant (V1 gelé actuel) :**

```json
{
  "viewId": "cognitive-priming",
  "availabilityPolicy": "always-planned",
  "sources": []
}
```

**Après (figé AP-B) :**

```json
{
  "viewId": "cognitive-priming",
  "label": "Amorçage cognitif",
  "displayOrder": 1,
  "availabilityPolicy": "default",
  "sources": [{ "kind": "cognitive-priming", "ref": "manifest" }]
}
```

| Règle | Énoncé |
|---|---|
| **Levée `always-planned`** | Obligatoire pour alimenter la vue quand manifest déclare l'artefact |
| **Source unique** | Une seule source `cognitive-priming` / `manifest` |
| **Pas de mergeOrder** | Kind non-projection — `mergeOrder` interdit |

### 4.2 Extension `composition-spec-schema.js` (AP-D)

| Changement | Détail |
|---|---|
| `ALLOWED_SOURCE_KINDS` | Ajouter `"cognitive-priming"` |
| Validation source | Si `kind === "cognitive-priming"` : `ref` **obligatoire** ; **`mergeOrder` interdit** |
| `ref` autorisé | `"manifest"` **seul** en V1 |

### 4.3 Résolution manifest — `composition-engine.js` (AP-D)

**Nouvelle branche `resolveSource`** — parallèle `college-source` :

| Entrée | Traitement |
|---|---|
| `kind === "cognitive-priming"` | Lire `manifest.cognitive_priming_path` (string non vide) |
| `ref !== "manifest"` | Diagnostic `error` — ref invalide |
| Path absent / vide | `resolved: false` ; `primingRef: null` |
| Path présent | `resolved: true` ; construire `primingRef` |

**Objet `primingRef` produit :**

| Champ | Valeur |
|---|---|
| `ref` | `"manifest"` |
| `path` | copie normalisée `/` de `cognitive_priming_path` |
| `schema_version` | `1` |
| `resolved` | `true` |

**Retour `resolveSource` :** `{ kind, resolved, blocks: [], questions: [], scenarios: [], collegeRef: null, primingRef }`.

**Diagnostics :**

| Code | Sévérité | Condition |
|---|---|---|
| `cognitive-priming-ref-invalid` | `error` | `ref` ≠ `"manifest"` |
| `identity-referenced-but-absent` | `warn` | path manifest absent pour vue cognitive-priming (réutilisation code existant) |

### 4.4 Agrégation vue `cognitive-priming`

Dans la boucle vue (AP-D) :

1. Agréger `primingRef` depuis sources résolues (une seule source V1).
2. **Politique availability spécifique** — **figée AP-B** :

```
si viewId === "cognitive-priming":
  availability = primingRef?.resolved === true ? "published" : "planned"
sinon:
  availability = availabilityFromPolicy(policy, anyResolved)  // inchangé
```

| Règle | Énoncé |
|---|---|
| **Contrat CP-6.1** | `primingRef.resolved` ⇒ `published` — appliqué **explicitement**, pas via heuristique `anyResolved` |
| **Transition** | Packages sans artefact → `planned` — comportement identique à l'existant |
| **Diagnostic `view-without-resolved-source`** | **Non émis** pour `cognitive-priming` quand path absent — état `planned` **attendu**, pas erreur |

3. Attacher `primingRef` au `viewEntry` si non null.

### 4.5 Extension Reading View Model — `reading-view-model.js` (AP-D)

| Changement | Détail |
|---|---|
| `VIEW_KEYS` | Ajouter `"primingRef"` |
| `PRIMING_REF_KEYS` | `ref`, `path`, `schema_version`, `resolved` |
| `validatePrimingRef()` | Parallèle `validateCollegeRef` |
| `FORBIDDEN_NESTED` | **Ne pas** ajouter champs artefact (profile, prerequisites, summary) |

**Invariant :** aucun contenu médical dans le View Model — CP-03, CP-04.

### 4.6 Tests Composition (AP-D)

| Id | Fichier | Objet |
|---|---|---|
| T-CP-COMP-01 | `composition-spec.test.js` | kind `cognitive-priming` accepté ; mergeOrder rejeté |
| T-CP-COMP-02 | idem | cognitive-priming source ref manifest obligatoire |
| T-CP-COMP-03 | `composition-engine.test.js` | manifest avec path → `published` + `primingRef.resolved` |
| T-CP-COMP-04 | idem | manifest sans path → `planned` + pas de primingRef |
| T-CP-COMP-05 | idem | ref invalide → diagnostic error |
| T-CP-COMP-06 | `composition-navigation.test.js` | onglet Amorçage `published` quand fixture manifest 234 AP-C |
| T-CP-COMP-07 | `reading-view-model` via engine | primingRef sans champs interdits |
| T-CP-COMP-08 | `compliance-nc.test.js` | planned views list **sans** cognitive-priming quand publié |

---

## 5. Renderer

### 5.1 Architecture module (AP-E)

**Nouveau module :** `demo/renderer/cognitive-priming-render.js`

| Export logique | Rôle |
|---|---|
| `parseCognitivePrimingArtifact(jsonText)` | Parse + validation structurelle V1 ; retour `{ record, diagnostics }` |
| `renderCognitivePriming(container, record, context)` | DOM presentation — **sans** fetch |
| `resolveEdnReferenceNavigability(chapterId, packageAccess)` | `{ navigable: boolean, releaseId?: string, reason?: string }` |

**Branchement `renderer.js` — `renderComposedView` :**

Ordre de dispatch **avant** `planned` early-return **uniquement si** availability published :

```
1. notes (existant)
2. questions (existant)
3. primingRef.resolved (NOUVEAU) → renderCognitivePrimingView(...)
4. blocks (existant)
5. scenarios (existant)
6. collegeRef (existant)
7. placeholder
```

**Note :** conserver le guard `availability === "planned"` en tête — message `viewPlanned` inchangé pour packages non alimentés.

### 5.2 Chargement artefact

| Étape | Responsable |
|---|---|
| 1 | `renderComposedView` reçoit `view.primingRef.path` |
| 2 | Package Access `resolveAsset(releaseId, path)` ou équivalent browser fetch `/library/releases/...` |
| 3 | `parseCognitivePrimingArtifact(text)` |
| 4 | Si `schema_version !== 1` → message erreur CP-RENDER-SCHEMA |
| 5 | Si `record.chapter_id !== manifest.chapter` → **warning** console + bandeau non bloquant CP-RENDER-CHAPTER-MISMATCH |
| 6 | `renderCognitivePriming(container, record, context)` |

| Interdit | Précision |
|---|---|
| Fetch Blueprint / inventaire | — |
| Fallback vers story / overview | — |
| Reformulation textes | — |

### 5.3 Ordre de rendu DOM (figé AP-B)

Structure sémantique — classes CSS AP-E, sans prescription visuelle figée :

1. **En-tête vue** — label onglet existant (navigation) ; contenu : titre chapitre depuis `chapter` meta ViewModel (déjà connu shell).
2. **Section Profil** — sous-titre « Profil du chapitre » ; deux lignes :
   - Compréhension : `{n}` étoiles pleines + `{5-n}` vides (présentation **directe** de l'entier publié — pas de calcul métier).
   - Mémorisation : idem.
   - Mention accessoire : « Repères pédagogiques » (texte statique Renderer — hors artefact).
3. **Section Pré-requis** — ordre **strict** contrat §4.5 :
   - **3a. Références EDN** — liste ; chaque item : `label` (+ `item_label` si présent).
   - **3b. Inter-EDN** — **non rendu** V1 (section absente si array vide).
   - **3c. Analyse IA** — liste ; chaque item : badge visible + `sentence`.
4. **Section Résumé** — liste à puces `summary.bullets` — ordre publié.

| Règle | Énoncé |
|---|---|
| **Une colonne** | Layout single-column — objectif doc 15 « tenir en un écran » via concision éditoriale, pas troncature |
| **Badges Collège** | Badge statique Reader onglet — catégorie 📘 Collège officiel (règle Renderer existante par viewId) |
| **Badge IA** | Texte **exact** `AI_COMPLEMENT_BADGE_V1` depuis artefact — pas de paraphrase |

### 5.4 Pré-requis EDN — présentation navigation

Pour chaque `EdnReference`, **au render** (pas au parse) :

1. Appeler `resolveEdnReferenceNavigability(chapter_id, packageAccess)`.
2. Si `navigable === true` :
   - élément cliquable (`button` ou `a` avec role) ;
   - `data-chapter-id` + `data-reference-id` ;
   - handler délégué shell Reader.
3. Si `navigable === false` :
   - texte seul + indication visuelle « non disponible » (classe CSS) ;
   - **pas** de handler ;
   - **pas** de message modal bloquant.

### 5.5 Compléments IA

- Affichage **non cliquable** V1.
- Badge obligatoire avant/après sentence selon maquette AP-E — **présence** obligatoire, position laissée à AP-E.
- Si `badge` ≠ valeur figée → traiter comme **erreur artefact** (ne devrait pas arriver post-build) ; afficher message CP-RENDER-BADGE ; **ne pas** afficher le complément.

### 5.6 États Renderer

| État | Condition | UI |
|---|---|---|
| **planned** | `availability !== "published"` | Message existant `viewPlanned` — **inchangé** |
| **loading** | fetch artefact en cours | Indicateur shell standard (si async) |
| **published OK** | parse + render réussis | Contenu §5.3 |
| **artifact missing** | fetch 404 / ASSET_MISSING | Message dédié CP-RENDER-ARTIFACT-MISSING |
| **schema unsupported** | `schema_version !== 1` | Message CP-RENDER-SCHEMA |
| **parse error** | JSON invalide | Message CP-RENDER-PARSE |

### 5.7 Styles (AP-E)

**Extension `styles.css` :** classes `.cp-profile`, `.cp-stars`, `.cp-prereq`, `.cp-edn-ref`, `.cp-edn-ref--unavailable`, `.cp-ai-complement`, `.cp-ai-badge`, `.cp-summary` — détail visuel **non normatif** AP-B.

### 5.8 Tests Renderer (AP-E)

| Id | Fichier | Objet |
|---|---|---|
| T-CP-RND-01 | `cognitive-priming-render.test.js` | parse valide / invalide |
| T-CP-RND-02 | idem | rejet schema_version ≠ 1 |
| T-CP-RND-03 | idem | render ordre sections |
| T-CP-RND-04 | idem | badge IA exact |
| T-CP-RND-05 | idem | inter_edn non rendu |
| T-CP-RND-06 | `renderer` integration | primingRef → fetch mock → DOM stars + bullets |
| T-CP-RND-07 | idem | planned → viewPlanned sans fetch |
| T-CP-RND-08 | idem | artifact missing → message erreur |

---

## 6. Navigation EDN

### 6.1 API shell (AP-E)

**Extension `app.js` ou module `chapter-navigation.js` :**

| Fonction | Signature logique |
|---|---|
| `navigateToChapterById(chapterId, options?)` | Ouvre Release active du chapitre ; options : `{ targetViewId: "cognitive-priming" }` par défaut pour lien EDN |

**Flux :**

```
Clic EDN reference
  → navigateToChapterById(ednRef.chapter_id)
       → packageAccess.getActiveRelease(chapterId)
            → succès : loadRelease(releaseId) ; applyResumePlan ou showTab(cognitive-priming)
            → UNKNOWN_CHAPTER : noop (déjà non cliquable)
```

### 6.2 Interaction Library Catalog

| Règle | Énoncé |
|---|---|
| **Autorité** | `library.json` → `active_by_chapter[chapter_id]` → `release_id` |
| **Package Access** | `getActiveRelease(chapter)` — comportement existant D1 |
| **Mode dev** | Sans bibliothèque : toutes références EDN **non navigables** — honnête |
| **Mode produit** | Navigation **uniquement** si Release installée **et** active |

### 6.3 Cas limites (implémentation AP-E)

| Cas | Comportement |
|---|---|
| Cible installée | Navigation ; CE-04 compatible si breadcrumb |
| Cible absente catalogue | Item rendu non cliquable à la construction |
| Même chapitre | Rechargement Release courante + onglet Amorçage — acceptable |
| Navigation pendant recherche D6 | Fermeture panneau search **non obligatoire** AP-B — comportement D6-E inchangé |
| Session D4 | Commit `INTERNAL_NAV_VALIDATED` ou équivalent cross-chapter **si** politique session étendue cross-release — **AP-E** : émettre événement navigation explicite ; persistance selon règles D4 existantes pour changement Release |

**Décision figée AP-B :** la navigation EDN **change de Release** — équivalent changement chapitre bibliothèque ; **DOIT** mettre à jour RestoreContext ; **NE DOIT PAS** réinitialiser Display Preferences (D7).

### 6.4 Tests navigation (AP-E / AP-F)

| Id | Objet |
|---|---|
| T-CP-NAV-01 | getActiveRelease mock → clic EDN declenche loadRelease |
| T-CP-NAV-02 | UNKNOWN_CHAPTER → élément non cliquable |
| T-CP-NAV-03 | smoke : package 234 → lien EDN vers chapitre fixture installé |

---

## 7. Intégrations voisins (sans modification comportement)

### 7.1 Session Resume (D4)

| Élément | Impact AP |
|---|---|
| `AMORCAGE_VIEW_ID` | Inchangé — `"cognitive-priming"` |
| ResumePoint `view_entry` | Inchangé |
| Fallback `planned` | **Disparaît** pour 234 post AP-C/D/E — reprise directe Amorçage |
| Tests | Mettre à jour `session-service.test.js` L04 — scénario published |

**Aucune modification Session Service** requise si availability devient `published` — comportement nominal D4.

### 7.2 Local Search (D6)

**Extension AP-E** — `local-search-runtime-shared.js` :

| Changement | Détail |
|---|---|
| `resolveSourceBinding` | Branche `kind === "cognitive-priming"` |
| `documentRefs` | `[manifest.cognitive_priming_path]` si path indexable |
| `sourceKind` | `"cognitive-priming"` |
| `inferDocumentKind` | Nouveau : `cognitive_priming_json` pour `.json` sous `build/` prefix cognitive |

**Extension AP-E** — `local-search-service.js` :

| Changement | Détail |
|---|---|
| Extraction texte JSON | Champs indexables : `label`, `item_label`, `sentence`, chaque `summary.bullets[]` — **pas** badge, **pas** reference_id |
| SearchHit ancre | `view_entry` + `viewId: cognitive-priming` — kind D4 compatible |

| Règle | Énoncé |
|---|---|
| Vue `planned` | **Aucun** hit — inchangé T-VIEW-01 |
| Orthogonalité D7 | Inchangée |

### 7.3 Offline (D2)

| Changement | Fichier |
|---|---|
| `collectDeclaredArtifactPaths` | Inclut `cognitive_priming_path` |

Offline Manager prépare l'artefact **automatiquement** — **aucun** changement certification.

### 7.4 Display Preferences (D7)

**Aucune modification** — héritage CSS global.

### 7.5 Patrimoine

**Aucune modification** — pas de store, pas de Snapshot domaine.

---

## 8. Compatibilité et migration

### 8.1 Packages existants

| Package | Comportement post AP-D/E |
|---|---|
| Sans `cognitive_priming_path` | Vue `planned` — **identique** à aujourd'hui |
| Avec path valide | Vue `published` |
| 234 golden master | **DOIT** avoir path après AP-C |

### 8.2 Rétrocompatibilité Reader

| Version Reader | Manifest ancien | Résultat |
|---|---|---|
| AP-E+ | sans path | planned — OK |
| Pré-AP-E | avec path | Ignoré (path non résolu Composition) — OK |

### 8.3 Migration Composition Spec

| Étape | Action |
|---|---|
| AP-D | Remplacer `always-planned` + sources `[]` par source `cognitive-priming` |
| Tests | Mettre à jour attentes `composition-engine.test.js` cognitive-priming |

**Pas de migration patrimoniale** — aucune donnée apprenant.

### 8.4 Fixture produit 234

| Fichier fixture | AP-C |
|---|---|
| `demo/renderer/test/fixtures/product-library/packages/cardio__234__2022__1/manifest.json` | Ajouter `cognitive_priming_path` + artefact JSON |
| Tests renderer / smoke | Consomment fixture post AP-C |

---

## 9. Plan de tests AP-F (validation end-to-end)

### 9.1 Matrice de couverture contrat

| Critère contrat | Test AP-F |
|---|---|
| C-CP-01 | Gate lou-build 234 + manifest fixture |
| C-CP-02 | composition-navigation + engine |
| C-CP-03 | smoke profil étoiles DOM |
| C-CP-04 | smoke ordre sections ; absence Inter-EDN |
| C-CP-05 | smoke badge IA texte |
| C-CP-06 | smoke bullets résumé |
| C-CP-07 | smoke navigation EDN + cas non cliquable |
| C-CP-08 | session resume test Amorçage published |
| C-CP-09 | local-search hit sur texte Amorçage |
| C-CP-10 | smoke offline fixture 234 |
| C-CP-11 | absence écriture patrimoine |

### 9.2 Suites par couche

| Suite | Nombre indicatif | Lot |
|---|---|---|
| lou-build cognitive-priming | 8+ | AP-C |
| Composition spec + engine + RVM | 8+ | AP-D |
| cognitive-priming-render unit | 8+ | AP-E |
| session / search non-régression | existant + 2 | AP-E/F |
| smoke `15-cognitive-priming-apf.spec.mjs` | 12–18 | AP-F |
| Node validation AP-F | 15–20 | AP-F |
| Renderer `npm test` full | non-régression globale | AP-F |

### 9.3 Scénarios smoke AP-F (figés AP-B)

| Id | Scénario |
|---|---|
| AP-F-01 | Package 234 — onglet Amorçage `published` visible |
| AP-F-02 | Profil Compréhension / Mémorisation affiché |
| AP-F-03 | Au moins une puce résumé |
| AP-F-04 | Références EDN listées |
| AP-F-05 | Complément IA avec badge exact si présent dans artefact |
| AP-F-06 | Pas de section Inter-EDN interactive |
| AP-F-07 | Local Search trouve texte du résumé |
| AP-F-08 | Reprise session vers Amorçage après reload |
| AP-F-09 | Breadcrumb chapitre → Amorçage (CE-04) |
| AP-F-10 | Display Preferences dark — Amorçage lisible |
| AP-F-11 | Offline warm — contenu Amorçage accessible |
| AP-F-12 | Package sans Amorçage (mock) — planned message |

---

## 10. Décisions figées par AP-B

| # | Décision | Valeur / règle |
|---|---|---|
| B1 | Chemin artefact publié | `build/cognitive-priming.v1.json` |
| B2 | Entrée build curative | `build/cognitive-priming.source.yaml` — non publiée |
| B3 | Stage producteur | **J uniquement** — pas de nouveau stage A–K |
| B4 | Gate complete | Source YAML + JSON valide obligatoires |
| B5 | Composition kind | `"cognitive-priming"` + ref `"manifest"` |
| B6 | Availability cognitive-priming | `primingRef.resolved ? published : planned` |
| B7 | View Model extension | `primingRef` — 4 champs, pas de contenu |
| B8 | Navigation EDN | `getActiveRelease(chapter_id)` — seule autorité |
| B9 | Local Search kind | `cognitive_priming_json` extraction champs texte |
| B10 | Offline / digest | `collectDeclaredArtifactPaths` étendu |
| B11 | Session / D7 / Patrimoine | Aucun changement composant |
| B12 | Badge IA | Injecté à la génération — non auteur YAML |

---

## 11. Paramètres laissés à l'implémentation (non architecturaux)

| Paramètre | Borne |
|---|---|
| Parser YAML (lib choisie) | Libre — équivalence structurelle exigée |
| Classes CSS et typographie étoiles | Libre — entiers 1–5 respectés |
| Async fetch vs sync | Libre — états loading §5.6 |
| Texte messages erreur CP-RENDER-* | Libre — sémantique équivalente |
| Placement badge IA (avant/après phrase) | Libre |

Aucun de ces paramètres **NE DOIT** modifier le schéma artefact, la disponibilité Composition, ou la logique navigation catalogue.

---

## 12. Hors périmètre AP-B

| Domaine | Lot / statut |
|---|---|
| Implémentation code | AP-C, AP-D, AP-E |
| Contenu médical YAML 234 | AP-C capitalisation |
| Clôture contrat En vigueur | AP-G gouvernance |
| Inter-EDN | Post-V1 |
| Génération automatique sans source YAML | Industrialisation post-V1 |
| Tests exécutés | AP-F |

---

## 13. Documents connexes

| Document | Rôle |
|---|---|
| [`COGNITIVE-PRIMING-COMPONENT-CONTRACT.md`](../../../docs/contracts/components/COGNITIVE-PRIMING-COMPONENT-CONTRACT.md) | Autorité normative AP-A |
| [`15-READER-FUNCTIONAL-SPECIFICATION.md`](../../../docs/renderer/15-READER-FUNCTIONAL-SPECIFICATION.md) | §4.3 fonctionnel |
| [`16-CONTENT-TO-READER-ARCHITECTURE.md`](../../../docs/renderer/16-CONTENT-TO-READER-ARCHITECTURE.md) | Frontière package ↔ Reader |
| [`COMPOSITION-COMPONENT-CONTRACT.md`](../../../docs/contracts/components/COMPOSITION-COMPONENT-CONTRACT.md) | Composition générale |
| [`LIBRARY-CATALOG-CONTRACT.md`](../../../docs/contracts/components/LIBRARY-CATALOG-CONTRACT.md) | Navigation EDN |
| [`LOCAL-SEARCH-COMPONENT-CONTRACT.md`](../../../docs/contracts/components/LOCAL-SEARCH-COMPONENT-CONTRACT.md) | Indexation |
| [`learner-local-search-d6-b-technical-design.md`](learner-local-search-d6-b-technical-design.md) | Modèle ViewBinding |
| [`learner-session-d4-technical-design.md`](learner-session-d4-technical-design.md) | Reprise Amorçage |

---

*Conception technique Lot AP-B — V1 — sans implémentation.*
