# Lot E-C — Rapport technique : Learner Snapshot (LP-05)

| | |
|---|---|
| **Lot** | E-C — Export patrimonial Learner Snapshot |
| **Contrat** | [`LEARNER-PATRIMONY-COMPONENT-CONTRACT.md`](../../../docs/contracts/components/LEARNER-PATRIMONY-COMPONENT-CONTRACT.md) §8 |
| **Statut** | Implémentation terminée — en attente d'audit / commit |
| **Date** | 2026-08-01 |
| **Commit** | Aucun (mission explicite) |

---

## 1. Architecture retenue

### 1.1 Séparation logique / moteur (LP-10)

| Module | Rôle |
|---|---|
| `learner-patrimony.js` | Identité Release-scoped (E-B) — inchangé |
| `learner-store.js` | Persistance IndexedDB — lecture agrégée ajoutée (`listAllPatrimonialRecords`) |
| `learner-snapshot.js` | **Projection patrimoniale + canonicalisation + enveloppe + digest** — aucune dépendance IndexedDB dans le modèle exporté |

```
LouLearnerStore.listAllPatrimonialRecords()   ← source physique (lecture seule)
        ↓
LouLearnerSnapshot.buildBodyFromStoreGroups() ← projection par domaine §4
        ↓
LouLearnerSnapshot.canonicalizeBody()         ← ordre déterministe
        ↓
LouLearnerSnapshot.computeBodyDigest()        ← SHA-256 sur body canonique
        ↓
LouLearnerSnapshot.exportSnapshot()           ← enveloppe complète
```

L'export **ne modifie pas** le magasin source (§8.1 non-destructif).

### 1.2 Enveloppe `LearnerSnapshot` v1

| Section | Contenu |
|---|---|
| `snapshot_format_version` | `1` — version du **format** snapshot |
| `export_metadata` | `exported_at`, `exporter_component` |
| `integrity` | `algorithm: sha256-canonical-v1`, `digest` (hex) |
| `summary` | `record_count_total`, `record_count_by_domain`, `release_ids_referenced` |
| `body.domains[]` | 9 domaines §4 (4 avec données E-B + 5 vides explicites) |
| `diagnostics` | **Optionnel**, hors digest — jamais dans le body (A1) |

Le digest est calculé **uniquement** sur le `body` canonique. `exported_at` et `diagnostics` n'influencent pas l'intégrité patrimoniale.

### 1.3 Domaines exportés

| `domain_id` | Source E-B | Présence E-C |
|---|---|---|
| `walkthrough_annotations` | `text_annotations` | Données |
| `walkthrough_notes` | `walkthrough_notes` | Données |
| `svg_text_formats` | `svg_text_formats` | Données |
| `personal_diagrams` | `personal_diagrams` | Données (blob → `binary_base64`) |
| `assessment_history` | — | **Vide explicite** |
| `scenario_progress` | — | **Vide explicite** |
| `concept_mastery` | — | **Vide explicite** |
| `session_resume` | — | **Vide explicite** |
| `display_preferences` | — | **Vide explicite** |

Chaque domaine porte `domain_schema_version: 1`.

### 1.4 Enregistrement logique exporté

Champs obligatoires par record (§8.2) :

- `record_id` — identité **logique** stable : `{domain_id}::{release_id}::{seq}` (A2)
- `release_id`, `schema_version`, `domain`, `chapter`
- `orphan_status` — `none` ou `legacy_unresolved` (préfixe `__legacy__*`)
- `payload` — contenu métier sans clé `id` ni référence moteur

Le champ IndexedDB `id` n'est **jamais** exporté. Il sert uniquement à dériver la composante `seq` opaque du `record_id` logique.

### 1.5 Canonicalisation

1. Domaines dans l'ordre fixe `ALL_DOMAIN_IDS` (9 entrées)
2. Records triés par `(release_id, record_id)` lexicographique
3. Sérialisation JSON canonique (`stableStringify`) — clés triées récursivement
4. Digest SHA-256 du body canonique

Invariant : même patrimoine local → même body → même digest, indépendamment de l'ordre de lecture `getAll()` et de `exported_at`.

### 1.6 API publique

```javascript
// Export complet du patrimoine local
const snapshot = await LouLearnerSnapshot.exportSnapshot({
  exportedAt: "2026-08-01T12:00:00.000Z", // optionnel
  diagnostics: { /* hors patrimoine */ },  // optionnel (A1)
  store: LouLearnerStore,                  // optionnel, défaut global
});
```

Fonctions exposées pour tests et E-D futur : `buildBodyFromStoreGroups`, `canonicalizeBody`, `computeBodyDigest`, `deriveLogicalRecordId`, `resolveOrphanStatus`.

**Hors périmètre** : import, fusion, restauration, UI, CLI, archive, chiffrement, bundle patrimonial.

---

## 2. Ajustements de conception intégrés

| Ajustement | Implémentation |
|---|---|
| **A1 — source_persistence** | Absent du modèle patrimonial. `diagnostics` optionnel en top-level, **exclu** du digest. |
| **A2 — record_id** | Format logique `{domain}::{release_id}::{seq}` — jamais de champ `id` IndexedDB exporté. |
| **A3 — autonomie catalogue** | Aucune consultation Library Catalog. `orphan_status` dérivé uniquement de `__legacy__*` via `LouLearnerPatrimony.isLegacyReleaseId`. Snapshot valide sans catalogue. |

---

## 3. Écarts avec la conception initiale

| Point conception | Écart / décision impl |
|---|---|
| Q2 — consultation catalogue pour `release_not_installed` | **Non implémenté** (A3). Seul `legacy_unresolved` est marqué à l'export. |
| `source_persistence` dans `export_metadata` | **Supprimé** du modèle patrimonial (A1). Disponible uniquement via `diagnostics` explicite. |
| `orphans_registry` domaine séparé | **Non retenu** — `orphan_status` par record (Q5). |
| `installation_fingerprint` | **Non implémenté** V1 — réservé sync future. |
| Blobs via IndexedDB en tests Node | `fake-indexeddb` ne préserve pas les `Blob` ; encodage binaire vérifié via projection directe (LP-E12). Comportement navigateur réel non affecté. |

Aucun contrat modifié. Aucune évolution D1, D2, D4, D6, D7.

---

## 4. Fichiers modifiés / créés

| Fichier | Action |
|---|---|
| `demo/renderer/learner-snapshot.js` | **Créé** — projection, canonicalisation, digest, API export |
| `demo/renderer/learner-store.js` | `listAllPatrimonialRecords()` — lecture agrégée read-only |
| `demo/renderer/index.html` | Chargement `learner-snapshot.js` |
| `demo/renderer/library/offline-runtime-shared.js` | `SHELL_URLS` — precache offline (E1) |
| `demo/renderer/test/learner-snapshot.test.js` | **Créé** — 13 tests LP-E01…LP-E12 + shell E1 |

---

## 5. Couverture des tests

| Test | Invariant démontré |
|---|---|
| E1 shell precache | Régression offline D2 évitée |
| LP-E01 | Export vide valide, digest stable malgré `exported_at` différent |
| LP-E02 | Multi-Releases, 4 domaines actifs, futurs vides |
| LP-E03 | Legacy `__legacy__*` exporté, `legacy_unresolved`, jamais promu |
| LP-E04 | Pas de `id` IndexedDB ; `record_id` logique structuré |
| LP-E05 | Ordre physique `getAll()` n'affecte pas le digest |
| LP-E06 | Digest recomputable depuis le body |
| LP-E07 | Absence Library/Offline/catalog/`content_digest`/`patrimony_meta` dans le body |
| LP-E08 | `diagnostics.source_persistence` hors intégrité (A1) |
| LP-E09 | LP-05 — complétude : tout row store → snapshot |
| LP-E10 | Export sans contexte catalogue (A3) |
| LP-E11 | Champs contrat §8.2 sur chaque record |
| LP-E12 | Encodage binaire diagramme à la projection |

**Résultat suite :** 326 tests PASS (`npm test`).

---

## 6. Conformité LP-05 et §8

| Obligation | Statut |
|---|---|
| **LP-05** — snapshot couvre tout le patrimoine protégé §4 local | ✅ 4 domaines E-B + 5 slots vides explicites |
| **§8.1** — indépendance moteur | ✅ Modèle logique sans IndexedDB |
| **§8.1** — non-destructif | ✅ Lecture seule |
| **§8.2** — complétude relative | ✅ LP-E09 |
| **§8.2** — identité (`record_id`, `release_id`, `schema_version`) | ✅ LP-E11 |
| **§8.2** — intégrité détectable | ✅ Digest SHA-256 canonique |
| **§8.2** — versionnement format | ✅ `snapshot_format_version: 1` |
| **LP-07** — orphelins/legacy conservés | ✅ LP-E03 |
| **LP-10** — indépendance persistance | ✅ Projection masque le moteur |
| **LP-04** — pas de `content_digest` patrimonial | ✅ LP-E07, LP-E11 |
| Frontière Library/Offline | ✅ LP-E07, A3 |
| Bundle patrimonial §8.3 | ❌ Hors périmètre E-C (volontaire) |
| Import §9 | ❌ Lot E-D |

---

## 7. Intégration Reader / Offline

- `index.html` charge `learner-snapshot.js` après `learner-store.js`
- `SHELL_URLS` inclut le script pour le runtime offline D2
- Aucun câblage UI — export headless via API uniquement
- Compatibilité Reader préservée (aucune modification renderer/composition)

---

*Lot E-C — Learner Snapshot export — 2026-08-01 — prêt pour audit indépendant avant commit.*
