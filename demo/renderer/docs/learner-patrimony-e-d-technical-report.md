# Lot E-D — Rapport technique : Import / restauration patrimoniale (LP-06)

| | |
|---|---|
| **Lot** | E-D — Import / restauration Learner Snapshot |
| **Contrat** | [`LEARNER-PATRIMONY-COMPONENT-CONTRACT.md`](../../../docs/contracts/components/LEARNER-PATRIMONY-COMPONENT-CONTRACT.md) §9 |
| **Statut** | Implémentation terminée — en attente d'audit / commit |
| **Date** | 2026-08-01 |
| **Commit** | Aucun (mission explicite) |

---

## 1. Architecture réalisée

### 1.1 Chaîne d'import (symétrique E-C)

```
LearnerSnapshot (artefact logique)
        ↓
[1] validateSnapshotStructure()
        ↓
[2] verifySnapshotIntegrity() — recalcul digest body canonique
        ↓
[3] buildImportPlan() — projection inverse + comparaison locale
        ↓
[4] applyPatrimonialImportPlan() — transaction IndexedDB globale
        ↓
[5] ImportResult observable
```

| Module | Rôle E-D |
|---|---|
| `learner-patrimony.js` | `deriveLogicalRecordId`, `STORE_TO_DOMAIN`, préservation `logical_record_id` |
| `learner-store.js` | Migration v6, index `logical_record_id`, upsert transactionnel |
| `learner-snapshot.js` | Validation, digest, projection inverse, `importSnapshot()`, `ImportResult` |

Aucune écriture Library / Offline / Catalogue. Le catalogue ne sert qu'à des **warnings optionnels** (`catalogReleaseIds`).

### 1.2 Politique d'import — upsert additif

| Situation | Comportement |
|---|---|
| Record snapshot nouveau | `inserted` |
| Record identique (comparaison payload) | `unchanged` |
| Record existant, payload différent | `updated` + entrée `conflicts` |
| Record local absent du snapshot | **conservé** (LP-02) |
| Domaines futurs vides | ignorés |
| Snapshot invalide / digest mismatch | refus total, rollback |

### 1.3 Politique de conflit (A1)

**Snapshot wins, but never silently.**

- Le payload snapshot est appliqué (`update`).
- Chaque conflit apparaît dans `ImportResult.conflicts` avec `resolution: "snapshot_wins"`.
- Aucune suppression implicite de records locaux absents du snapshot.

### 1.4 Atomicité

- Plan calculé **avant** toute écriture (validation + digest + comparaison).
- Application dans **une transaction IndexedDB** couvrant tous les magasins touchés (`applyPatrimonialImportPlan`).
- Tout échec applicatif dans `applyPatrimonialImportPlan` appelle **`tx.abort()`** avant le `reject` — aucune mutation du plan ne survit.
- Échec pré-apply (validation, digest, plan) → store inchangé ; échec apply → rollback IndexedDB réel + `ImportResult.rollback` explicite.

### 1.5 Invariants LP-06

| Invariant | Mécanisme |
|---|---|
| **Round-trip** (A5) | export → import (store vide) → export → même body canonique et digest |
| **Idempotence** | upsert par `logical_record_id` ; réimport identique → `unchanged` uniquement (`conflicts=0`, `updated=0`) |
| **A→B→A** (A6) | imports successifs ; état stable, pas de doublons, records A conformes |
| **Diagrammes** (C2) | refus si `binary_base64` absent, vide ou non décodable |
| **Release absente** (§9.2) | import accepté ; warning catalogue optionnel uniquement |
| **Legacy** (LP-07) | `__legacy__*` importé tel quel, jamais promu |

---

## 2. Migration v6

### 2.1 Changements IndexedDB

| Élément | Détail |
|---|---|
| **Version** | 5 → **6** |
| **Champ** | `logical_record_id` (string) sur chaque record patrimonial |
| **Index** | `logical_record_id` unique par magasin (4 stores Release-scoped) |
| **Meta** | `patrimony_meta.migration_v6` — marqueur idempotent |

### 2.2 Backfill

Pattern identique à E-B (`migration_v5`) :

1. `onupgradeneeded` v6 : création des index.
2. Migration différée post-`open()` : backfill `logical_record_id = deriveLogicalRecordId(domain, release_id, id)`.
3. Idempotence : `v5 → v6 → v6 → v6` produit le même état ; meta `completed: true` skip les rewrites.

### 2.3 Écritures courantes

`_addPatrimonyRecord()` : `add` → assignation `logical_record_id` → `put` dans la même transaction.

Aucune donnée existante supprimée.

---

## 3. ImportResult

Structure retournée par `importSnapshot()` :

| Catégorie | Contenu |
|---|---|
| `success` | booléen global |
| `inserted` | `{ record_id, store, id }[]` |
| `updated` | `{ record_id, store, id }[]` |
| `unchanged` | `{ record_id, store, id }[]` |
| `conflicts` | `{ record_id, domain, resolution, local_store, local_id }[]` |
| `warnings` | ex. `{ code: "release_not_in_catalog", release_id }` |
| `refused` | `{ reason }[]` |
| `rollback` | `{ reason, detail? }` ou `null` |

Aucune API publique imposée au-delà de cette structure interne au module.

---

## 4. Fichiers

### 4.1 Créés

| Fichier | Rôle |
|---|---|
| `demo/renderer/test/learner-snapshot-import.test.js` | 17 tests LP-I01…LP-I17 |
| `demo/renderer/docs/learner-patrimony-e-d-technical-report.md` | Ce rapport |

### 4.2 Modifiés

| Fichier | Changements |
|---|---|
| `demo/renderer/learner-patrimony.js` | `deriveLogicalRecordId`, `STORE_TO_DOMAIN`, préservation identité étendue |
| `demo/renderer/learner-store.js` | DB v6, migration v6, index, `_addPatrimonyRecord`, `applyPatrimonialImportPlan` |
| `demo/renderer/learner-snapshot.js` | Pipeline import complet, export enrichi (`logical_record_id` persisté) |
| `demo/renderer/test/learner-patrimony-store.test.js` | E6 logical_record_id, DB v6 |
| `demo/renderer/test/learner-snapshot.test.js` | diagnostics store_version 6 |
| `demo/renderer/test/svg-text-formats-store.test.js` | SF-01 DB v6 + index logical_record_id |
| `demo/renderer/test/walkthrough-notes-create.test.js` | WT-CR-08 attente async (add+put v6) |

---

## 5. Couverture de tests

### 5.1 Suite E-D (`learner-snapshot-import.test.js`)

| Test | Couverture |
|---|---|
| LP-I01 | Import nominal 4 domaines |
| LP-I02 | Digest invalide → refus + rollback |
| LP-I03 | Idempotence stricte réimport (`unchanged` only) |
| LP-I04 | Conflit snapshot gagne + tracé |
| LP-I05 | Record local conservé (snapshot vide) |
| LP-I06 | Legacy round-trip |
| LP-I07 | Release absente → warning catalogue optionnel |
| LP-I08 | Succès sans catalogue |
| LP-I09 | Diagramme base64 invalide → refus |
| LP-I10 | Round-trip export→import→export |
| LP-I11 | Scénario A→B→A |
| LP-I12 | Migration v6 idempotente |
| LP-I13 | Erreur pré-apply → store inchangé |
| LP-I14 | Pas de duplication répétée |
| LP-I15 | Diagramme blob absent → refus |
| LP-I16 | Soft-fail mid-apply → `tx.abort()`, aucune écriture partielle |
| LP-I17 | Migration v5 → v6 → backfill → réouverture idempotente |

### 5.2 Régression

```
cd demo/renderer && npm test
# tests 351 | pass 351 | fail 0
```

(+18 tests vs baseline E-C à 333 tests)

---

## 6. Conformité LP-06 / §9

| Obligation | Statut |
|---|---|
| LP-02 — pas de perte silencieuse | ✅ upsert additif ; local absent conservé |
| LP-06 — traçabilité | ✅ ImportResult complet |
| LP-06 — idempotence | ✅ upsert `logical_record_id` ; réimport strict LP-I03 |
| LP-04 — pas de content_digest | ✅ aucune utilisation |
| LP-07 — legacy conservé | ✅ |
| LP-10 — identité logique | ✅ `logical_record_id` ≠ clé physique |
| §9.2 Release absente | ✅ import + warning optionnel |
| Atomicité | ✅ transaction globale + `tx.abort()` sur échec apply |
| Frontière catalogue (A2) | ✅ diagnostics optionnels uniquement |

---

## 7. Dettes restantes

| Dette | Nature |
|---|---|
| **UI restauration** | Hors E-D — pas de parcours utilisateur |
| **CLI / bundle patrimonial** | Hors périmètre V1 |
| **Import partiel / multi-release sélectif** | Hors V1 — snapshot complet uniquement |
| **Persistance ImportResult** | Non V1 — retour opération suffit |
| **Domaines futurs (5 vides)** | Mécanisme prêt ; implémentation domaine par domaine |
| **Promotion orphelin → actif** | Signalisation Reader post-import — hors magasin |
| **Optimisation gros snapshots** | Acceptable V1 ; indexation suffisante |

---

## 8. Prêt pour audit

Le lot E-D est implémenté, testé (351/351), documenté. Aucune modification de contrat, ADR ou gouvernance.

- **Aucun commit effectué.**
- **Aucun tag créé.**
- **Aucun push effectué.**
