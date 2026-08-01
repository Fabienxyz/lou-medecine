# Rapport d'implémentation — Lot D7-D : Display Preferences Runtime, persistance et Snapshot

| | |
|---|---|
| **Lot** | D7-D |
| **Date** | 2026-08-01 |
| **Autorité** | D7-A, D7-B, D7-C |
| **Statut** | Implémentation terminée |

---

## 1. Périmètre livré

- Display Preferences Runtime (orchestration I/O, callback Reader)
- Store patrimonial `display_preferences` (application-scoped, singleton)
- Export / import Snapshot domaine `display_preferences`
- Tests Runtime (11) et Snapshot (10)
- Synchronisation D7-B §1.7 (`schema_version > 1`)

**Hors périmètre (D7-E) :** UI réglages, CSS/DOM, câblage `app.js`, boot Reader.

---

## 2. Fichiers créés

| Fichier | Rôle |
|---|---|
| `demo/renderer/display-preferences-runtime.js` | Runtime — `createDisplayPreferencesRuntime()` |
| `demo/renderer/test/display-preferences-runtime.test.js` | Tests Runtime (11) |
| `demo/renderer/test/display-preferences-snapshot.test.js` | Tests Snapshot domaine (10) |
| `demo/renderer/docs/learner-display-preferences-d7-d-implementation-report.md` | Ce rapport |
| `demo/renderer/docs/learner-display-preferences-d7-d-compliance-report.md` | Matrice conformité D7-A/B/C |

---

## 3. Fichiers modifiés

| Fichier | Modification |
|---|---|
| `demo/renderer/learner-store.js` | DB v8, store `display_preferences`, CRUD singleton |
| `demo/renderer/learner-snapshot.js` | Projecteurs export/import, ACTIVE domain, validation sans `release_id` |
| `demo/renderer/learner-patrimony.js` | `STORE_TO_DOMAIN.display_preferences` |
| `demo/renderer/docs/learner-display-preferences-d7-b-technical-design.md` | §1.7 `schema_version > 1` aligné D7-C |
| `demo/renderer/test/learner-patrimony-store.test.js` | DB version 8 |
| `demo/renderer/test/learner-snapshot-import.test.js` | DB version 8 |
| `demo/renderer/test/svg-text-formats-store.test.js` | DB version 8 |
| `demo/renderer/test/session-d4-audit-corrections.test.js` | Migration v6→v8 + store `display_preferences` |

---

## 4. Display Preferences Runtime

### API

`createDisplayPreferencesRuntime({ storage, applyDisplayPreferences, nowIso? })`

| Méthode | Comportement |
|---|---|
| `loadAndApply({ source? })` | Lit store → normalise (Service) → apply callback ; `DP-MISSING` ou `DP-PERSISTED` |
| `applyPatch(patch)` | mergeAndNormalize → upsert → apply ; `DP-SAVED` |
| `applyImportedRecord(record)` | migrateToCurrent → upsert → apply ; `DP-IMPORT-APPLIED` |
| `resetToDefaults()` | delete store → defaults → apply ; `DP-DELETED` |
| `getCurrentPreferences()` | Effectif courant ou defaults |
| `getStatus()` | `{ status, diagnostics, preferences }` |

### Règles implémentées

- Premier boot : defaults, `DP-MISSING`, aucune écriture
- Normalisation boot : lecture seule
- Doublons : résolution stable (`RECORD_ID` prioritaire, sinon `updated_at` desc)
- Erreurs I/O propagées
- Aucune manipulation DOM

---

## 5. Store patrimonial

| Propriété | Valeur |
|---|---|
| Nom | `display_preferences` |
| Scope | Application |
| DB version | **8** |
| Cardinalité | 0 ou 1 actif |
| Identifiants | `"display-preferences-v1"` |

---

## 6. Tests

| Suite | Tests | Résultat |
|---|---|---|
| D7-C Service | 41 | PASS |
| D7-D Runtime | 11 | PASS |
| D7-D Snapshot | 10 | PASS |
| Suite complète Renderer | **555** | **PASS** |

---

## 7. Verdict

**D7-D READY FOR D7-E**
