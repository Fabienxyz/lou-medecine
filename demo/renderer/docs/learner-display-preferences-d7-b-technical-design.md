# Conception technique — Lot D7-B : Display Preferences (PDR-D7)

| | |
|---|---|
| **Lot** | D7-B — Conception technique Display Preferences |
| **Version document** | **V1** |
| **Décision produit** | [PDR-D7](../../../docs/governance/PRODUCT-DECISION-REGISTRY.md) |
| **Contrat** | [`DISPLAY-PREFERENCES-COMPONENT-CONTRACT.md`](../../../docs/contracts/components/DISPLAY-PREFERENCES-COMPONENT-CONTRACT.md) — **seule autorité** |
| **Statut** | Conception V1 — phase exclusive, sans implémentation |
| **Date** | 2026-08-01 |
| **Prérequis publiés** | D7-A (contrat Display Preferences approuvé) ; Patrimoine E-A…E-D ; D4 Session Resume ; D6 Local Search ; Composition V1 ; PDR-D1 ; PDR-D2 |

**Mission :** spécification technique exclusive — aucun code, aucun pseudo-code, aucun commit, aucune modification de contrat, ADR, PDR ou gouvernance.

**Autorité :** le contrat [`DISPLAY-PREFERENCES-COMPONENT-CONTRACT.md`](../../../docs/contracts/components/DISPLAY-PREFERENCES-COMPONENT-CONTRACT.md) prime en cas de conflit. Ce document **fige** `schema_version = 1`.

**Références informatives (non normatives pour D7-B) :** [`learner-session-d4-technical-design.md`](learner-session-d4-technical-design.md) (boot, IA-10) ; [`learner-local-search-d6-b-technical-design.md`](learner-local-search-d6-b-technical-design.md) (Service pur / Runtime) ; [`learner-patrimony-e-c-technical-report.md`](learner-patrimony-e-c-technical-report.md) (Snapshot).

---

## 1. Modèle logique

### 1.1 Principes

Le modèle est **logique** — indépendant de IndexedDB, du DOM, du CSS et du format physique Snapshot. Pour un même enregistrement brut ou une même absence d'enregistrement, la normalisation V1 produit **toujours** le même `DisplayPreferences` effectif et la même liste de diagnostics (DP-07, déterminisme).

Display Preferences **n'est pas** une autorité de contenu (DP-02). Il ne porte **aucune** `release_id` en V1.

### 1.2 Entités et relations

```
DisplayPreferencesDefaults (figé V1)
        ↓ merge
DisplayPreferencesRecord? (0 ou 1 en persistance)
        ↓ normalize + migrate
DisplayPreferences (effectif — toujours complet)
        ↓ apply (Reader)
PresentationState (observable — hors patrimoine)
```

| Entité | Rôle | Identité |
|---|---|---|
| **DisplayPreferencesDefaults** | Valeurs V1 lorsque persistance absente ou champ manquant | Singleton logique — non persisté obligatoirement |
| **DisplayPreferencesRecord** | Enregistrement patrimonial persisté | `record_id` stable |
| **DisplayPreferences** | Objet **effectif** appliqué au Reader | Toujours complet après normalisation |
| **PresentationState** | État visuel observable post-application | Éphémère — **non** patrimonial |

**Relations :**

- Un installation V1 possède **au plus un** `DisplayPreferencesRecord` actif.
- Toute lecture (boot, export, tests Service) produit un `DisplayPreferences` **complet** — jamais partiel.
- `PresentationState` **NE DOIT PAS** être persisté ni exporté.

### 1.3 DisplayPreferences (effectif)

Objet normalisé — sortie canonique du Service.

| Champ | Type logique | Valeurs V1 | Obligation |
|---|---|---|---|
| `schema_version` | entier positif | **`1`** (figé D7-B) | Toujours présent après normalisation |
| `theme` | énumération | `"light"` \| `"dark"` | Toujours présent |
| `fontSize` | énumération | `"small"` \| `"medium"` \| `"large"` | Toujours présent |
| `readingWidth` | énumération | `"narrow"` \| `"standard"` \| `"wide"` | Toujours présent |

**Invariant DP-04 :** les trois champs `theme`, `fontSize`, `readingWidth` sont **toujours** présents après normalisation.

### 1.4 DisplayPreferencesDefaults V1 (figé)

| Champ | Valeur par défaut V1 |
|---|---|
| `schema_version` | `1` |
| `theme` | `"light"` |
| `fontSize` | `"medium"` |
| `readingWidth` | `"standard"` |

**Règle :** `DisplayPreferencesDefaults` est **identique** pour toute installation V1 n'ayant pas encore d'enregistrement persisté modifié par l'utilisateur.

### 1.5 Énumérations figées V1

| Domaine | Constante logique | Valeurs autorisées |
|---|---|---|
| Thème | `THEME_VALUES` | `["light", "dark"]` |
| Taille police | `FONT_SIZE_VALUES` | `["small", "medium", "large"]` |
| Largeur lecture | `READING_WIDTH_VALUES` | `["narrow", "standard", "wide"]` |

Toute autre valeur **DOIT** être traitée selon la politique unique §1.7 — **sans** erreur bloquante.

### 1.6 DisplayPreferencesRecord (persisté)

Enregistrement patrimonial **application-scoped** — store `display_preferences`.

| Champ | Type logique | Obligation |
|---|---|---|
| `record_id` | string | **Figé V1 :** `"display-preferences-v1"` |
| `logical_record_id` | string | **Figé V1 :** identique à `record_id` (singleton — idempotence import) |
| `schema_version` | entier positif | `1` pour V1 |
| `theme` | string | Valeur énumérée ou invalide (normalisée à la lecture) |
| `fontSize` | string | idem |
| `readingWidth` | string | idem |
| `updated_at` | string ISO-8601 **ou** absent | **Optionnel V1** — fourni par Runtime à l'écriture ; **ignoré** par le Service |

| Interdit sur l'enregistrement V1 | Précision |
|---|---|
| `release_id` | **Absent** — données globales §5.2 Patrimoine |
| `chapter` | **Absent** — pas de scope chapitre |
| `viewId` | **Absent** — pas de scope vue |

**Règle singleton :** une installation **NE DOIT PAS** posséder plus d'un enregistrement actif V1. Le Runtime **DOIT** traiter toute duplication résiduelle comme anomalie recoverable (conserver le plus récent par `updated_at` si présent, sinon premier ordre stable) — avec diagnostic `DP-DUPLICATE-RESOLVED` ; **sans** erreur bloquante.

### 1.7 Politique de validation V1 (figée)

Pour **chaque** champ énuméré (`theme`, `fontSize`, `readingWidth`) :

1. Si la clé est **absente** → valeur par défaut du domaine ; diagnostic **`DP-NORMALIZED`** (champ manquant).
2. Si la valeur est **hors énumération** → **remplacement** par la valeur par défaut du domaine ; diagnostic **`DP-INVALID-VALUE`** (précisant champ + valeur reçue).
3. **Aucune erreur bloquante** — le chargement et l'application **DOIVENT** continuer.

Pour `schema_version` :

| Cas | Action V1 | Diagnostic |
|---|---|---|
| Absent | Traiter comme `1` | `DP-NORMALIZED` |
| `1` | Accepter | — |
| `> 1` (futur) | Émettre `DP-SCHEMA-STALE` ; conserver les champs reconnus valides ; remplacer invalides/absents par défauts V1 ; ignorer champs inconnus ; sortie `schema_version = 1` | `DP-SCHEMA-STALE` |
| `< 1` ou non entier | Remplacer par `1` | `DP-INVALID-VALUE` |

**Règle déterministe :** à entrée identique, normalisation identique — ordre des diagnostics stable (tri lexicographique par code puis par champ).

### 1.8 Migration V1

**V1 ne définit aucune migration intermédiaire** — seule `schema_version = 1` est supportée.

| Opération logique | Comportement V1 |
|---|---|
| `migrateToCurrent(raw)` | Si `schema_version === 1` → passthrough puis `normalize` ; sinon voir §1.7 |
| Évolution future | **DOIT** incrémenter `schema_version` et ajouter une table de migration explicite — hors D7-B |

---

## 2. Cycle de vie

### 2.1 Vue d'ensemble

```
[Premier boot] → defaults effectifs (sans persistance obligatoire)
       ↓
[Boot suivant sans modification utilisateur] → defaults effectifs (toujours sans enregistrement)
       ↓
[Modification utilisateur] → normalize → persist record → apply
       ↓
[Boot suivant] → load record → normalize → apply
       ↓
[Export Snapshot] → domaine vide ou 1 record
       ↓
[Import Snapshot] → upsert record (idempotent)
       ↓
[Suppression explicite utilisateur] → remove record → apply defaults (hors D7-C minimal — voir §2.8)
```

### 2.2 Premier boot produit

| Condition | Comportement |
|---|---|
| Aucun enregistrement `display_preferences` | Produire `DisplayPreferences` = **Defaults V1** ; **appliquer** ; **ne pas persister** |
| Diagnostic | **`DP-MISSING`** |

Conforme contrat §6.2 et Patrimoine §8 — domaine vide admis.

### 2.3 Lecture (boot ou rechargement)

| Étape | Responsable | Action |
|---|---|---|
| 1 | Runtime | Lire 0 ou 1 enregistrement store |
| 2 | Service | `normalize(raw)` → `DisplayPreferences` + diagnostics |
| 3 | Runtime | Conserver `DisplayPreferences` effectif en mémoire session |
| 4 | Reader | `apply(DisplayPreferences)` |

| Source | Diagnostic principal |
|---|---|
| Enregistrement présent | **`DP-PERSISTED`** |
| Absence | **`DP-MISSING`** |

### 2.4 Normalisation

Toujours via **Display Preferences Service** — jamais inline Reader.

Entrée : objet partiel, enregistrement brut, ou `{}`.  
Sortie : `DisplayPreferences` complet §1.3.

### 2.5 Application

| Moment | Obligation |
|---|---|
| Boot | Avant le **premier rendu interactif principal** du contenu chapitre |
| Changement utilisateur | Immédiat — sans rechargement page |
| Import snapshot | Après upsert patrimonial — réapplication immédiate |
| Changement Release | **Aucune** réapplication spécifique — préférences inchangées |

### 2.6 Modification utilisateur

Séquence **obligatoire** :

1. Reader reçoit intention utilisateur (patch partiel : un ou plusieurs champs).
2. Service : `mergeAndNormalize(currentEffective, patch)` → nouvel effectif + diagnostics.
3. Runtime : **persister** enregistrement (création si absent).
4. Reader : **réappliquer** nouvel effectif.
5. Diagnostic Runtime : **`DP-SAVED`** si persistance réussie.

**Règle :** la **première** modification utilisateur **crée** l'enregistrement persisté.

### 2.7 Persistance

| Événement | Écriture store |
|---|---|
| Premier boot sans modification | **Non** |
| Modification utilisateur | **Oui** — upsert singleton |
| Import snapshot avec record | **Oui** — via pipeline import patrimonial |
| Normalisation boot | **Non** — lecture seule |

### 2.8 Export Snapshot

| État local | Domaine `display_preferences` exporté |
|---|---|
| Aucun enregistrement | Domaine **vide explicite** (`records: []`) |
| Enregistrement présent | **Un** record projeté — non vide |

Conforme C-DP-06 et Patrimoine §11.7.

### 2.9 Import Snapshot

| Règle | Énoncé |
|---|---|
| Domaine vide | **Aucun effet** sur enregistrement local existant — **sauf** politique import globale Patrimoine §9 (hors D7-B — délégué E-D) |
| Domaine avec 1 record valide | Upsert idempotent par `record_id` / `logical_record_id` |
| Record invalide après normalisation | Valeurs corrigées par Service ; persistance de l'enregistrement normalisé ; diagnostics |
| `release_id` présente dans payload | **Ignorée** — rejet logique du champ (non copié) |

Après import réussi avec record : **réapplication** immédiate.

### 2.10 Suppression

| Cas | Comportement |
|---|---|
| Action utilisateur explicite « réinitialiser / défauts » | Supprimer enregistrement ; appliquer Defaults V1 ; **ne pas** recréer enregistrement |
| Import ne contenant pas le domaine | **Ne supprime pas** silencieusement l'enregistrement local (Patrimoine §9.1) |

**Hors V1 minimal :** UI de reset — **PEUT** être reportée si non exigée par C-DP ; la **capacité logique** de suppression reste définie pour cohérence Patrimoine.

### 2.11 Restauration (rechargement page)

Identique §2.3 — dernier enregistrement persisté **ou** defaults si absent.

---

## 3. Display Preferences Service

### 3.1 Rôle

Composant **pur** — validation, normalisation, fusion, migration logique, production de diagnostics.

**Ne réalise jamais d'I/O** (DP-07).

### 3.2 Entrées

| Opération | Entrée logique |
|---|---|
| `buildDefaults()` | *(aucune)* |
| `normalize(raw)` | Objet arbitraire ou `null` / `undefined` |
| `mergeAndNormalize(current, patch)` | `DisplayPreferences` courant + patch partiel (1–3 champs) |
| `migrateToCurrent(raw)` | Enregistrement brut persisté ou snapshot |
| `equals(a, b)` | Deux `DisplayPreferences` normalisés — comparaison test |

**Interdit en entrée :** `release_id`, faits catalogue, ViewModel, SearchHit, ResumePoint.

### 3.3 Sorties

| Opération | Sortie |
|---|---|
| `buildDefaults()` | `DisplayPreferences` |
| `normalize(raw)` | `{ preferences: DisplayPreferences, diagnostics: Diagnostic[] }` |
| `mergeAndNormalize(current, patch)` | `{ preferences: DisplayPreferences, diagnostics: Diagnostic[] }` |
| `migrateToCurrent(raw)` | `{ preferences: DisplayPreferences, diagnostics: Diagnostic[] }` |
| `equals(a, b)` | boolean |

**Diagnostic** (structure logique — representation interne libre) :

| Champ | Obligation |
|---|---|
| `code` | Code §9 |
| `field` | Optionnel — nom du champ concerné |
| `received` | Optionnel — valeur reçue invalide |
| `applied` | Optionnel — valeur appliquée |

### 3.4 Validation

Implémentée **exclusivement** via la politique §1.7 — pas de branche alternative.

### 3.5 Normalisation

Algorithme logique V1 (déterministe) :

1. Initialiser `preferences` depuis `buildDefaults()`.
2. Si `raw` est objet : pour chaque clé reconnue (`schema_version`, `theme`, `fontSize`, `readingWidth`), fusionner.
3. Appliquer politique §1.7 champ par champ.
4. Retourner objet gelé logiquement (immutabilité recommandée — paramètre implémentation).

### 3.6 Merge avec défauts

`mergeAndNormalize(current, patch)` :

1. Partir de `current` (déjà normalisé).
2. Pour chaque clé de `patch` : si clé ∈ {`theme`, `fontSize`, `readingWidth`}, remplacer.
3. Ignorer clés inconnues — diagnostic **`DP-UNKNOWN-FIELD`** (non bloquant).
4. Re-normaliser le résultat ( garantit énumérations valides ).

`schema_version` du patch **NE DOIT PAS** être modifiable via UI V1 — ignoré si présent avec diagnostic `DP-UNKNOWN-FIELD`.

### 3.7 Migration schema_version

V1 : `migrateToCurrent` ≡ `normalize`.

Post-V1 : table explicite `{ fromVersion, toVersion, transform }` — hors scope.

### 3.8 Pureté — interdictions absolues

DOM ; IndexedDB ; localStorage ; fetch ; `release_id` ; Reading View Model ; Composition ; Session Service ; Local Search ; horloge système non injectée.

---

## 4. Runtime (Display Preferences Runtime)

### 4.1 Rôle

**Seul orchestrateur I/O** autorisé pour Display Preferences — lecture et écriture patrimoniale, coordination avec le Reader.

Analogie : Local Search Runtime (D6-D) — **sans** index ni cache dérivé.

### 4.2 Responsabilités

| Responsabilité | Détail |
|---|---|
| **Lecture patrimoine** | Lire store `display_preferences` — 0 ou 1 record |
| **Appel Service** | Déléguer normalisation / merge |
| **Écriture patrimoine** | Upsert / delete sur modification utilisateur, import, reset |
| **Application Reader** | Invoker callback d'application fourni par le Reader |
| **État session** | Conserver `DisplayPreferences` effectif courant (mémoire) |

### 4.3 Opérations Runtime

| Opération | Séquence |
|---|---|
| **`loadAndApply()`** | read store → Service.normalize → apply → retour `{ preferences, diagnostics }` |
| **`applyPatch(patch)`** | mergeAndNormalize → upsert store → apply → `{ preferences, diagnostics }` |
| **`applyImportedRecord(record)`** | Service.migrateToCurrent → upsert → apply |
| **`resetToDefaults()`** | delete store → Service.buildDefaults → apply |

### 4.4 Frontière Patrimoine

| Règle | Énoncé |
|---|---|
| **Store** | `display_preferences` — **application-scoped** |
| **API** | Réutiliser `LouLearnerStore` — **pas** de magasin parallèle |
| **Scope** | **Aucune** `release_id` à l'écriture |

Extension store : ajouter `display_preferences` à `APPLICATION_SCOPED_STORES` — lot D7-D (hors D7-C Service pur).

### 4.5 Frontière Reader

Runtime **NE MODIFIE PAS** le DOM directement — invoque une **fonction d'application** registrée par le Reader :

```
applyDisplayPreferences(preferences: DisplayPreferences) → void
```

Effet **observable** : changement presentation-only sur shell Reader (contrat §7.2).

---

## 5. Application Reader

### 5.1 Principe

Le Reader est le **seul applicateur visuel** des préférences (contrat §5.1). L'application **NE DOIT PAS** altérer le Reading View Model, les ancres, les SearchHit, les snippets ni les ResumePoint (DP-09, contrat §9).

### 5.2 Moment d'application

| Moment | Obligation observable |
|---|---|
| **Boot** | Préférences effectives appliquées **avant** `runSessionRestore` / premier `showTab` produit |
| **Modification live** | Effet visible **immédiat** sur shell et contenu déjà rendu |
| **Post-import** | Réapplication **avant** interaction utilisateur |

### 5.3 Ordre d'application (présentation)

L'application **DOIT** être **atomique** du point de vue observable :

1. Thème (`theme`)
2. Taille police (`fontSize`)
3. Largeur lecture (`readingWidth`)

Ordre fixe V1 — garantit reproductibilité tests.

### 5.4 Réapplication

| Événement | Réapplication |
|---|---|
| Changement préférence | Oui — cible complète ou patch (effet identique) |
| `showTab` / navigation | **Non** — héritage shell global |
| Reprise session D4 | **Non** — préférences **NE DOIVENT PAS** être réinitialisées |
| Nouvelle Release | **Non** |

### 5.5 Événements Reader (logiques)

| Événement | Émetteur | Consommateur |
|---|---|---|
| **`DP-APPLY-REQUESTED`** | Runtime | Reader — applique preferences |
| **`DP-USER-PATCH`** | UI réglages | Runtime.applyPatch |
| **`DP-APPLIED`** | Reader (optionnel) | Diagnostics / tests — confirmation observable |

**Non-persistés :** ouverture/fermeture panneau réglages (contrat §7.3).

### 5.6 UI réglage V1 (comportement observable)

| Exigence | Comportement |
|---|---|
| Point d'entrée | Contrôle accessible — thème, police, largeur |
| Trois énumérations | Exactement 3 choix par dimension |
| Feedback | Changement visible sans reload |
| Valeurs affichées | Reflètent `DisplayPreferences` effectif courant |

**Hors D7-B :** libellés, icônes, placement — implémentation Reader (D7-E).

---

## 6. Persistance

### 6.1 Store

| Propriété | Valeur V1 |
|---|---|
| **Nom store** | `display_preferences` |
| **Scope** | Application — **pas** Release-scoped |
| **Cardinalité** | 0 ou 1 enregistrement actif |
| **Autorité** | [`LEARNER-PATRIMONY-COMPONENT-CONTRACT.md`](../../../docs/contracts/components/LEARNER-PATRIMONY-COMPONENT-CONTRACT.md) §5.2, §11.7 |

### 6.2 Identifiants

| Identifiant | Valeur figée V1 |
|---|---|
| `record_id` | `"display-preferences-v1"` |
| `logical_record_id` | `"display-preferences-v1"` |
| `schema_version` (record) | `1` |

### 6.3 Contenu persisté

Minimum :

| Champ | Obligation |
|---|---|
| `record_id` | Oui |
| `logical_record_id` | Oui — recommandé pour idempotence E-D |
| `schema_version` | Oui |
| `theme` | Oui |
| `fontSize` | Oui |
| `readingWidth` | Oui |
| `updated_at` | Optionnel — écrit par Runtime |

### 6.4 Relations Snapshot

| Relation | Règle |
|---|---|
| Store → domaine Snapshot | `display_preferences` |
| Projecteur export | À ajouter lot D7-D — payload `{ theme, fontSize, readingWidth }` |
| `release_id` dans record Snapshot | **Absente** |
| Domaine vide | Export explicite si 0 record local |

### 6.5 Indépendance Release

| Interdit | Précision |
|---|---|
| Clé composite incluant `release_id` | Non |
| Préférences différentes par chapitre | Non V1 |
| Invalidation préférences sur archivage Release | Non |

---

## 7. Snapshot

### 7.1 Export

| Condition | Résultat domaine `display_preferences` |
|---|---|
| 0 record store | `{ domain_id, domain_schema_version: 1, records: [] }` |
| 1 record store | `{ domain_id, domain_schema_version: 1, records: [ projected ] }` |

**Record projeté** (forme logique Snapshot) :

| Champ | Contenu |
|---|---|
| `record_id` | `"display-preferences-v1"` |
| `schema_version` | `1` |
| `domain` | `"display_preferences"` |
| `payload.theme` | Valeur persistée |
| `payload.fontSize` | Valeur persistée |
| `payload.readingWidth` | Valeur persistée |

**Absents :** `release_id`, `orphan_status` (non applicable — global).

### 7.2 Import

| Cas | Comportement |
|---|---|
| Domaine absent du fichier | Ignorer — pas d'erreur |
| Domaine vide | Pas d'upsert — **ne supprime pas** local |
| 1 record valide | Upsert ; normalisation Service ; réapplication |
| `domain_schema_version !== 1` | Refus import — erreur patrimoniale existante E-D |
| Record `display_preferences` dans `FUTURE_DOMAIN_IDS` | **DOIT** être retiré de FUTURE à l'activation D7-D — sinon import bloqué |

### 7.3 Absence du domaine

Conforme Patrimoine §479 — catégorie vide admise tant qu'aucune modification utilisateur.

### 7.4 Compatibilité versions

| Niveau | Version V1 |
|---|---|
| `snapshot_format_version` | Inchangé — géré E-C |
| `domain_schema_version` | `1` |
| `schema_version` (record) | `1` |

Évolution : incrémenter **les deux** si breaking — hors V1.

### 7.5 Migration

Import V1 : record snapshot → `migrateToCurrent` → upsert.  
Pas de migration multi-étapes V1.

### 7.6 Idempotence

| Scénario | Résultat attendu |
|---|---|
| Réimport snapshot identique | Même effectif ; pas de duplication record |
| Import même `record_id` | Upsert — remplace contenu |
| Export → import → export | Égalité fonctionnelle des préférences effectives |

Clé idempotence : `logical_record_id` = `"display-preferences-v1"`.

---

## 8. Ordre de démarrage

### 8.1 Objectif

Garantir :

- préférences appliquées **avant** rendu interactif principal ;
- **aucun conflit** avec D4 (RestoreContext, ResumePlan, IA-10) ;
- **aucune** lecture préférences par Session Service ;
- Composition **terminée avant** application — ViewModel **inchangé**.

### 8.2 Séquence boot produit (figée D7-B)

```
1. renderer.init(shell)
2. Résolution chapitre / URL
3. product-bootstrap.initProductMode(chapter)
       · manifest, releaseId, offlineStatus
       · LouLearnerStore disponible
4. LouLearnerStore.setReleaseContext({ releaseId, chapter })
5. Composition.buildReadingViewModel(manifest)   ← ViewModel — SANS préférences
6. buildNavigationFromViewModel → tabs
7. buildTabs() — structure DOM onglets
8. ★ DisplayPreferencesRuntime.loadAndApply()    ← D7 — AVANT session restore
9. sessionResume.createCommitController(...)
10. runSessionRestore()
       · buildRestoreContext(facts)
       · SessionService.buildResumePlan(context)
       · applyResumePlan → showTab → ancre → overlays  (IA-10)
11. initLocalSearch() — inchangé D6
12. Premier rendu interactif principal atteint
```

### 8.3 Règles de non-conflit D4

| Règle | Énoncé |
|---|---|
| **DP-BOOT-01** | `loadAndApply` **NE DOIT PAS** appeler `buildResumePlan` |
| **DP-BOOT-02** | Session Service **NE DOIT PAS** lire le store `display_preferences` |
| **DP-BOOT-03** | RestoreContext **NE CONTIENT PAS** de faits Display Preferences |
| **DP-BOOT-04** | ResumePlan **NE CONTIENT PAS** de champs Display Preferences |
| **DP-BOOT-05** | IA-10 reste **Vue → Ancre → Overlays** — Display Preferences **hors** cette séquence |
| **DP-BOOT-06** | `loadAndApply` **PEUT** s'exécuter en parallèle de étapes 5–7 **si** terminé avant étape 10 |

### 8.4 Premier paint

Runtime **DOIT** tenter de compléter `loadAndApply` **avant** le premier `showTab` de `applyResumePlan`.

Si lecture asynchrone patrimoine : appliquer defaults synchrones immédiatement, puis **réappliquer** après lecture si record présent — sans second `buildResumePlan`.

### 8.5 Mode non-produit

Même séquence logique **si** store patrimonial disponible ; sinon defaults + diagnostic `DP-MISSING`.

---

## 9. Diagnostics

Codes logiques V1 — **sans** prescription de représentation interne.

| Code | Signification | Émetteur |
|---|---|---|
| **`DP-MISSING`** | Aucun enregistrement — defaults appliqués | Service / Runtime |
| **`DP-PERSISTED`** | Enregistrement lu et normalisé | Runtime |
| **`DP-NORMALIZED`** | Champ manquant complété par défaut | Service |
| **`DP-INVALID-VALUE`** | Valeur hors énumération remplacée | Service |
| **`DP-UNKNOWN-FIELD`** | Clé patch ou raw ignorée | Service |
| **`DP-SCHEMA-STALE`** | `schema_version` > supporté V1 | Service |
| **`DP-MIGRATED`** | Migration explicite appliquée (réservé post-V1 ; inactif V1) | Service |
| **`DP-SAVED`** | Persistance upsert réussie | Runtime |
| **`DP-DELETED`** | Enregistrement supprimé (reset) | Runtime |
| **`DP-APPLIED`** | Reader a confirmé application | Reader / Runtime |
| **`DP-DUPLICATE-RESOLVED`** | Plus d'un record — résolution singleton | Runtime |
| **`DP-IMPORT-APPLIED`** | Import snapshot a mis à jour effectif | Runtime |

**Règle :** diagnostics **NE DOIVENT PAS** bloquer application — sauf erreur I/O patrimoniale hors scope Service (Runtime propage erreur store — traitement D7-D).

Ordre stable : tri par `code` lexicographique, puis `field`.

---

## 10. Jeux de tests D7-C

### 10.1 Principes

- Tests **purs** sur Display Preferences Service — **sans** I/O, sans DOM.
- Tests Runtime **avec** store mocké — lot D7-D.
- Comparaison **égalité stricte** sur `DisplayPreferences` normalisés.
- Diagnostics : ensemble ordonné comparé en golden.

### 10.2 Jeux obligatoires — Service (D7-C)

| Id | Objectif | Cas |
|---|---|---|
| **T-DEFAULT-01** | Defaults V1 figés | `buildDefaults()` → golden complet |
| **T-DEFAULT-02** | Stabilité | Deux appels identiques |
| **T-NORMALIZE-01…08** | Normalisation | `{}`, null, champs manquants, combinaisons partielles |
| **T-INVALID-01…06** | Politique §1.7 | Valeur invalide par champ → défaut + `DP-INVALID-VALUE` |
| **T-NORMALIZE-09…12** | Clés inconnues | Ignorées ; defaults conservés |
| **T-MERGE-01…06** | mergeAndNormalize | Patch single-field, multi-field, patch vide |
| **T-MERGE-07** | Patch `schema_version` | Ignoré V1 |
| **T-MIGRATION-01** | migrateToCurrent V1 | Record valide → identique normalize |
| **T-MIGRATION-02** | schema_version absent | Traité comme 1 |
| **T-REPRO-01** | Déterminisme | Double normalize — égalité bit-à-bit |
| **T-REPRO-02** | Ordre diagnostics | Stable pour entrée complexe |
| **T-EQUALS-01…03** | equals() | Reflexive, distinct fields |
| **T-ENUM-01** | Exhaustivité | Chaque valeur autorisée acceptée sans diagnostic invalid |

### 10.3 Jeux obligatoires — Snapshot (D7-D)

| Id | Objectif |
|---|---|
| **T-SNAPSHOT-EXPORT-01** | 0 record → domaine vide |
| **T-SNAPSHOT-EXPORT-02** | 1 record → 1 projected record |
| **T-SNAPSHOT-IMPORT-01** | Import record → effectif mis à jour |
| **T-SNAPSHOT-IMPORT-02** | Domaine vide → local inchangé |
| **T-SNAPSHOT-IDEM-01** | Double import identique |

### 10.4 Jeux obligatoires — Runtime (D7-D)

| Id | Objectif |
|---|---|
| **T-RUNTIME-LOAD-01** | Store vide → defaults + DP-MISSING |
| **T-RUNTIME-LOAD-02** | Store record valide → DP-PERSISTED |
| **T-RUNTIME-SAVE-01** | Premier patch → création record |
| **T-RUNTIME-SAVE-02** | Patch suivant → upsert même record_id |
| **T-RUNTIME-RESET-01** | resetToDefaults → delete + defaults |

### 10.5 Jeux orthogonalité (D7-E / D7-F)

| Id | Objectif |
|---|---|
| **T-D4-ORTHOGONAL-01** | buildResumePlan indépendant des préférences actives |
| **T-D4-ORTHOGONAL-02** | applyResumePlan ne modifie pas effectif DisplayPreferences |
| **T-D6-ORTHOGONAL-01** | Même SearchHit[] quelle que soit theme active (golden Service Search inchangé) |
| **T-D6-ORTHOGONAL-02** | Snippets identiques — pas de reformatage |
| **T-OFFLINE-01** | Préférences applicables sans `offline_ready` |
| **T-BOOT-ORDER-01** | loadAndApply invoqué avant runSessionRestore (spy ordre) |
| **T-COMPOSITION-01** | Reading View Model identique avant/après apply |

### 10.6 Critère de passage D7-C

D7-C **NE PEUT** être déclaré conforme Service que si **100 %** des jeux **T-DEFAULT**, **T-NORMALIZE**, **T-INVALID**, **T-MERGE**, **T-MIGRATION**, **T-REPRO**, **T-EQUALS**, **T-ENUM** passent avec `schema_version = 1`.

---

## 11. Décisions figées par D7-B

| # | Décision | Valeur V1 |
|---|---|---|
| **F1** | `schema_version` | `1` |
| **F2** | `record_id` / `logical_record_id` | `"display-preferences-v1"` |
| **F3** | Defaults | §1.4 |
| **F4** | Énumérations | §1.5 |
| **F5** | Politique invalide | Remplacement par défaut — jamais bloquant §1.7 |
| **F6** | Premier boot | Defaults sans persistance obligatoire §2.2 |
| **F7** | Première persistance | Au premier changement utilisateur §2.6 |
| **F8** | Singleton | Max 1 record actif §1.6 |
| **F9** | Scope | Application — jamais `release_id` |
| **F10** | Boot order | `loadAndApply` avant `runSessionRestore` §8.2 |
| **F11** | IA-10 | Préférences hors séquence Vue→Ancre→Overlays §8.3 |
| **F12** | ViewModel | Inchangé par Display Preferences — DP-09 |
| **F13** | Export snapshot | Domaine vide si 0 record §7.1 |
| **F14** | Ordre application presentation | theme → fontSize → readingWidth §5.3 |
| **F15** | Local Search | Index et SearchHit indépendants des préférences |

---

## 12. Paramètres laissés à l'implémentation (non architecturaux)

| Paramètre | Borne |
|---|---|
| Mécanisme CSS / attributs / variables shell | Libre — effet observable équivalent exigé |
| Emplacement UI réglages | Libre — contrat §7.3 |
| Sync vs async lecture store au boot | Libre — §8.4 defaults-then-reapply admis |
| Format exact row IndexedDB | Libre — champs §6.3 minimum |
| Nom module Service / Runtime | Libre |
| `updated_at` horodatage | Optionnel — Runtime |
| Stratégie duplicate records | Libre — résultat observable §1.6 |
| Libellés i18n | Libre |

Aucun de ces paramètres **NE DOIT** modifier énumérations, defaults, politique §1.7, boot order §8.2, ni orthogonalité D4/D6.

---

## 13. Hors périmètre D7-B

| Domaine | Lot |
|---|---|
| Implémentation Service | D7-C |
| Store IndexedDB, projecteur Snapshot | D7-D |
| UI réglages, câblage `app.js` | D7-E |
| Tests Playwright acceptance | D7-F |
| Thème système `prefers-color-scheme` | Post-V1 |
| Reset UI utilisateur | D7-E (capacité logique définie §2.10) |
| Propagation doc 14/15, indexes contrats | D7-G |

---

## 14. Documents connexes

| Document | Rôle |
|---|---|
| [`DISPLAY-PREFERENCES-COMPONENT-CONTRACT.md`](../../../docs/contracts/components/DISPLAY-PREFERENCES-COMPONENT-CONTRACT.md) | Autorité normative D7-A |
| [`LEARNER-PATRIMONY-COMPONENT-CONTRACT.md`](../../../docs/contracts/components/LEARNER-PATRIMONY-COMPONENT-CONTRACT.md) | Persistance §5.2, Snapshot §8–§9 |
| [`learner-session-d4-technical-design.md`](learner-session-d4-technical-design.md) | Boot, IA-10, RestoreContext |
| [`learner-local-search-d6-b-technical-design.md`](learner-local-search-d6-b-technical-design.md) | Pattern Service / Runtime |
| [`LOCAL-SEARCH-COMPONENT-CONTRACT.md`](../../../docs/contracts/components/LOCAL-SEARCH-COMPONENT-CONTRACT.md) | Orthogonalité SearchHit |
| [`COMPOSITION-COMPONENT-CONTRACT.md`](../../../docs/contracts/components/COMPOSITION-COMPONENT-CONTRACT.md) | ViewModel inchangé §9 |

---

## 15. Verdict final

**D7-C PEUT démarrer immédiatement** sans clarification architecturale supplémentaire.

Toutes les décisions requises pour implémenter le **Display Preferences Service pur** sont figées : modèle §1, politique validation §1.7, opérations Service §3, diagnostics §9, jeux de tests §10.2.

Les lots **D7-D** (Runtime + store + Snapshot) et **D7-E** (Reader + boot) héritent des sections §4, §6, §7, §8 — **sans** nouvelle décision d'architecture.

---

*Conception technique Lot D7-B — V1 — 2026-08-01.*
