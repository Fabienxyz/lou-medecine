# Rapport d'implémentation — Lot D6-D : Local Search Runtime et cache persistant

| | |
|---|---|
| **Lot** | D6-D — Local Search Runtime |
| **Date** | 2026-08-01 |
| **Autorité** | D6-A, D6-B, D6-C (Service inchangé) |
| **Statut** | Implémentation Runtime — **sans UI (D6-E)** |

---

## 1. Objectif

Implémenter le **Local Search Runtime** : orchestration I/O (Package Access), construction paresseuse de l'index, cache persistant dérivé, façade pour le futur Reader D6-E.

Le **Local Search Service (D6-C) n'a pas été modifié** — seule correction indirecte via `inferDocumentKind` dans le module Runtime partagé (adaptation artefacts, hors Service).

---

## 2. Fichiers produits / modifiés

| Fichier | Action |
|---|---|
| [`library/local-search-runtime-shared.js`](../library/local-search-runtime-shared.js) | **Créé** — ViewBindings, contexte, chemins indexables |
| [`library/local-search-cache.js`](../library/local-search-cache.js) | **Créé** — stockage cache (mémoire + IndexedDB) |
| [`library/local-search-runtime.js`](../library/local-search-runtime.js) | **Créé** — Runtime pur orchestrateur |
| [`library/browser-local-search-runtime.js`](../library/browser-local-search-runtime.js) | **Créé** — factory navigateur |
| [`test/local-search-runtime.test.js`](../test/local-search-runtime.test.js) | **Créé** — 17 tests D6-D + régression D6-C |
| [`docs/learner-local-search-d6-d-implementation-report.md`](learner-local-search-d6-d-implementation-report.md) | Ce rapport |
| [`docs/learner-local-search-d6-d-compliance-report.md`](learner-local-search-d6-d-compliance-report.md) | Conformité |

**Non modifiés :** D6-C Service, Patrimoine, Offline, Library, Composition, contrats.

---

## 3. Architecture

```text
Reader (D6-E, futur)
        ↓
createBrowserLocalSearchRuntime / createLocalSearchRuntime
        ↓
Package Access (manifest + artefacts déclarés)
        ↓
buildViewBindings + resolveSearchIndexContext
        ↓
buildSearchIndex (D6-C Service)
        ↓
SearchIndexCache (IndexedDB lou-local-search-v1)
        ↓
searchLocalIndex (D6-C Service)
```

---

## 4. Cache persistant

| Propriété | Valeur |
|---|---|
| **Base IndexedDB** | `lou-local-search-v1` |
| **Object store** | `index_cache` |
| **Key** | `release_id` |
| **Clé logique invalidation** | `(release_id, content_digest, index_schema_version, viewBindings)` |
| **Patrimoine** | **Aucune** interaction avec `lou-learner` |
| **Snapshot E-C/E-D** | **Exclu** |
| **offline_status** | **Non modifié** |

---

## 5. API Runtime

```javascript
const runtime = createLocalSearchRuntime({ packageAccess, cacheStorage, compose, compositionSpec, fetchFn });

runtime.setOpenRelease({ releaseId, contentDigest, chapter });
await runtime.ensureIndex();           // lazy build
const { hits, diagnostics } = await runtime.search("insuffisance");
await runtime.invalidate(releaseId);
await runtime.purge(releaseId);
runtime.getStatus();
```

Factory navigateur : `createBrowserLocalSearchRuntime({ libraryBaseUrl })`.

---

## 6. Construction paresseuse

Au premier `search()` ou `ensureIndex()` :

1. Résolution manifest via Package Access
2. Composition → Reading View Model → ViewBindings
3. Validation cache (`valid` / `stale` / `missing` / corrupt)
4. Lecture artefacts déclarés indexables uniquement
5. `buildSearchIndex` (Service)
6. Persistance cache
7. `searchLocalIndex`

Pas de préchauffage systématique au boot chapitre.

---

## 7. Tests

```bash
cd demo/renderer
node --test test/local-search-runtime.test.js test/local-search-service.test.js
```

**Résultat : 61/61 PASS** (17 D6-D + 44 D6-C)

Couverture D6-D : lazy build, cache valide, invalidation digest/schema, cache corrompu, purge, isolation Releases, scope refused, Package Access only, pas de scan FS, pas de Patrimoine, offline_status inchangé, fetch local, diagnostics D6-C.

---

## 8. Hors périmètre (D6-E+)

- Panneau recherche, raccourcis, surbrillance, navigation SearchHit
- Câblage Reader `app.js`
- Tests Playwright offline recherche (D6-F)

---

*Rapport Lot D6-D — 2026-08-01*
