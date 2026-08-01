# Lot E-B — Rapport technique : persistance Release-scoped

| | |
|---|---|
| **Lot** | E-B — Modèle de persistance Release-scoped |
| **Contrat** | [`LEARNER-PATRIMONY-COMPONENT-CONTRACT.md`](../../../docs/contracts/components/LEARNER-PATRIMONY-COMPONENT-CONTRACT.md) |
| **Statut** | Implémentation terminée — en attente d'audit / commit |
| **Date** | 2026-08-01 |

---

## 1. Architecture retenue

### 1.1 Séparation logique / moteur

| Module | Rôle |
|---|---|
| `learner-patrimony.js` | Logique pure d'identité patrimoniale : résolution `release_id`, estampillage `schema_version`, filtrage de portée, migration ligne à ligne. **Aucune dépendance IndexedDB.** |
| `learner-store.js` | Composant de persistance existant (IndexedDB en implémentation courante). Applique les invariants E-A sur toutes les écritures et lectures Release-scoped. |

Cette séparation satisfait **LP-10** : le patrimoine apprenant est indépendant du moteur de persistance.

### 1.2 Schéma de base (IndexedDB v5)

- **Version DB** : 4 → **5**
- **Magasin meta** : `patrimony_meta` — journal de migration idempotente (`migration_v5`)
- **Magasins Release-scoped** (inchangés dans leur rôle) :
  - `personal_diagrams`
  - `text_annotations`
  - `walkthrough_notes`
  - `svg_text_formats`
- **Champs obligatoires sur chaque enregistrement patrimonial** :
  - `release_id` — autorité d'appartenance
  - `schema_version` — version sémantique enregistrement (= `1`)
  - `chapter` — dénormalisé UX uniquement (§6.6 contrat E-A)

Index ajouté sur `svg_text_formats.release_id` (complément des index chapter/projection existants).

### 1.3 Contexte Release actif

API exposée sur `LouLearnerStore` :

```javascript
setReleaseContext({ releaseId, chapter })
getReleaseContext()
clearReleaseContext()
```

**Câblage Reader** (`app.js`) : après chargement manifeste réussi, le contexte est posé depuis :

- mode produit → `LouConfig._releaseId` (Package Access / catalogue)
- mode dev → `manifest.release_id` (manifest publié cardio/234 : `cardio__234__2022__1`)

### 1.4 Résolution `release_id` (priorité)

1. Contexte explicite (`setReleaseContext`) si le chapitre correspond
2. Mode produit (`LouConfig._releaseId`)
3. Table de convenance dev `KNOWN_CHAPTER_RELEASE_IDS` (`cardio/234` → `cardio__234__2022__1`)
4. Fallback dev §2.3 : `__legacy__<chapter>` (ex. `__legacy__demo__unknown`)

Le chapitre seul **n'est jamais** l'autorité patrimoniale en écriture.

---

## 2. Stratégie de migration v4 → v5

### 2.1 Objectifs

- Conservation intégrale des enregistrements existants
- Aucune suppression silencieuse
- Idempotence (re-ouverture sans double transformation)
- Absence de régression fonctionnelle Reader

### 2.2 Mécanisme

1. **`onupgradeneeded`** (v4→v5) : création `patrimony_meta`, index `release_id` sur `svg_text_formats`
2. **Migration différée post-ouverture** (`_ensurePatrimonyMigrationComplete`) :
   - Parcours cursoriel de chaque magasin Release-scoped
   - Pour chaque ligne sans `release_id` ou `schema_version` : estampillage via `LouLearnerPatrimony.migratePatrimonyRow`
   - Écriture meta `{ completed: true }` une fois terminé
3. **Idempotence** : lignes déjà migrées ignorées ; meta `completed` court-circuite les passes suivantes

### 2.3 Attribution Release sur données legacy

Les enregistrements v4 ne portaient que `chapter`. La migration assigne la `release_id` selon la même chaîne de résolution que les écritures courantes — pour `cardio/234`, cela produit `cardio__234__2022__1`, garantissant la continuité avec le comportement post-migration sans action utilisateur.

---

## 3. Impacts

| Zone | Impact |
|---|---|
| **Reader UI** | Aucun changement visible — highlights, notes walkthrough, formatage SVG, diagrammes personnels |
| **API publique store** | Signatures inchangées (`addTextHighlight(chapter, …)`, etc.) ; champs `release_id` / `schema_version` ajoutés en persistance |
| **Mode produit** | Contexte Release posé via bootstrap existant + `setReleaseContext` |
| **Mode dev** | Contexte depuis `manifest.release_id` ou fallback legacy |
| **Contrats D1/D2/Offline/Composition** | Non modifiés |
| **Service Worker shell (D2-E)** | `learner-patrimony.js` ajouté à `index.html` — cache shell offline à rafraîchir lors d'une prochaine évolution D2 (hors périmètre E-B) |

---

## 4. Couverture de tests

**Suite renderer** : **304 tests PASS** (dont 7 nouveaux Lot E-B).

| Test | Vérification |
|---|---|
| `learner-patrimony-store.test.js` LP-E01 | Écritures portent `release_id` + `schema_version` |
| LP-E02 | Migration v4→v5 — zéro perte (highlights, notes, diagrammes) |
| LP-E03 | Migration idempotente |
| LP-E04 | Isolation par `release_id` — pas de fuite inter-Release |
| LP-E05 | Chapitre inconnu → `__legacy__*` conservé |
| LP-E06 | `listRecordsForRelease` agrège par Release |
| LP-E07 | `chapter` ≠ autorité patrimoniale |
| Tests existants (304 total) | Non-régression highlights, walkthrough, SVG formats, lifecycle |

Tous les fichiers de test chargeant `learner-store.js` incluent désormais `learner-patrimony.js`.

---

## 5. Conformité aux invariants LP-01…LP-10

| Invariant | Statut E-B | Commentaire |
|---|---|---|
| **LP-01** | ✅ | Toute écriture Release-scoped référence `release_id` |
| **LP-02** | ✅ | Migration sans suppression ; deletes explicites API inchangés |
| **LP-03** | ✅ | Patrimoine learner séparé du contenu publié et des sources |
| **LP-04** | ✅ | Aucun usage de `content_digest` comme clé patrimoniale |
| **LP-05** | ⏳ | Concept snapshot requis — export E-C hors périmètre |
| **LP-06** | ⏳ | Import E-D hors périmètre |
| **LP-07** | ✅ | Données legacy et chapitres inconnus conservés (`__legacy__*`) — pas d'effacement silencieux |
| **LP-08** | ✅ | Données persistées accessibles indépendamment du statut offline |
| **LP-09** | ✅ | Aucune écriture learner ne modifie le contenu officiel |
| **LP-10** | ✅ | Logique patrimoniale extraite du moteur IndexedDB |

---

## 6. Hors périmètre respecté

Non implémenté (conformément au cahier des charges) :

- Export Learner Snapshot (E-C)
- Import / restauration (E-D)
- Reprise de session (D4)
- Recherche locale (D6)
- Préférences (D7)
- Synchronisation
- Modification des contrats, D1, D2, Composition, Library Catalog, Offline

---

## 7. Fichiers livrés

| Fichier | Action |
|---|---|
| `demo/renderer/learner-patrimony.js` | **Créé** |
| `demo/renderer/learner-store.js` | **Modifié** — v5, migration, estampillage |
| `demo/renderer/app.js` | **Modifié** — `setReleaseContext` au boot |
| `demo/renderer/index.html` | **Modifié** — script patrimony |
| `demo/renderer/test/learner-patrimony-store.test.js` | **Créé** |
| `demo/renderer/test/*.test.js` (12 fichiers) | **Adaptés** — chargement `learner-patrimony.js` |
| `demo/renderer/test/svg-text-formats-store.test.js` | **Adapté** — assertions v5 / release_id |

---

## 8. Prochaines étapes (post E-B)

1. Audit indépendant + commit / publication
2. Lot E-C — export Learner Snapshot
3. Lot E-D — import / restauration
4. Rafraîchissement cache shell SW pour `learner-patrimony.js` (lot D2 ultérieur si requis)

---

*Lot E-B — persistance Release-scoped — 2026-08-01.*
