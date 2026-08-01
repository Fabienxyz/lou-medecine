# Rapport d'implémentation — Lot D6-C : Local Search Service

| | |
|---|---|
| **Lot** | D6-C — Local Search Service |
| **Date** | 2026-08-01 |
| **Autorité** | D6-A (contrat) + D6-B (spec index/normalisation) |
| **Statut** | Implémentation Service pure — **sans Runtime (D6-D)** |

---

## 1. Objectif

Implémenter le **Local Search Service** : composant **100 % pur**, sans I/O, sans dépendance navigateur, consommable par le Runtime (D6-D) et testable unitairement.

---

## 2. Livrables produits

| Fichier | Rôle |
|---|---|
| [`local-search-normalize.js`](../local-search-normalize.js) | `normText`, `normQuery`, tokenisation, constantes V1, diagnostics |
| [`local-search-extract.js`](../local-search-extract.js) | Extraction markdown (projections, Collège), YAML (questions, scénarios), `manifest_alt` |
| [`local-search-service.js`](../local-search-service.js) | API publique : `buildSearchIndex`, `searchLocalIndex`, `validateSearchCache` |
| [`test/local-search-service.test.js`](../test/local-search-service.test.js) | 44 tests — jeux D6-B T-NORM … T-REPRO |
| Ce rapport | Implémentation |
| [`learner-local-search-d6-c-compliance-report.md`](learner-local-search-d6-c-compliance-report.md) | Conformité D6-A / D6-B |

---

## 3. API publique

### 3.1 `buildSearchIndex(input)`

**Entrée :**

| Champ | Description |
|---|---|
| `context` | `SearchIndexContext` — `release_id`, `content_digest`, `index_schema_version`, `viewBindings` |
| `artifacts[]` | Artefacts pré-chargés : `documentRef`, `documentKind`, `content`, `publicationStatus`, ids optionnels |
| `manifestVisuals[]` | Entrées `visuals[]` pour indexation `alt` |

**Sortie :** `{ index, diagnostics }`

### 3.2 `searchLocalIndex(index, query)`

**Sortie :** `{ hits: SearchHit[], diagnostics }`

### 3.3 `validateSearchCache(cacheRecord, context)`

**Sortie :** `{ status: 'valid' | 'stale' | 'missing', diagnostics }`

### 3.4 Exports utilitaires

`INDEX_SCHEMA_VERSION`, `DIAGNOSTICS`, `normText`, `normQuery`, `tokenizeQuery` — testables indépendamment.

---

## 4. Architecture interne

```text
buildSearchIndex
  → résolution jobs (viewBindings publiées, ordre displayOrder → projectionOrder → documentRef)
  → extraction par documentKind
  → normText sur passages
  → passageId + documentOffsetBase
  → SearchIndex

searchLocalIndex
  → normQuery + tokenize
  → matching sous-chaîne (mono : toutes occurrences ; multi : AND)
  → snippets + snippetMatchRanges
  → tri 7 niveaux (D6-B §6.1)
  → SearchHit[]
```

**Modules :** séparation normalisation / extraction / orchestration — aucune dépendance externe (pas de `marked`, pas de parser YAML général).

---

## 5. Décisions d'implémentation (non architecturales)

| Choix | Justification |
|---|---|
| Modules ES (`import`/`export`) | Aligné `package.json` `"type": "module"` ; tests Node natifs |
| Parser YAML ciblé | Champs V1 fermés §3.3–§3.4 D6-B — pas de dépendance tierce |
| `TextEncoder` pour tri UTF-8 | Disponible Node ≥11 ; comportement D6-B §6.1 |
| Extraction MD ligne-à-ligne | Suffisante pour corpus V1 ; ancres `{#cb-*}` préservées avant nettoyage inline |

Aucune de ces décisions ne modifie matching, snippets ou `sortKey`.

---

## 6. Tests

```bash
cd demo/renderer && node --test test/local-search-service.test.js
```

**Résultat :** 44/44 pass — T-NORM, T-EXTRACT-*, T-MATCH, T-SNIPPET, T-SORT, T-VIEW, T-SVG, T-D4-ANCHOR, T-HIT-GOLDEN, T-REPRO, cache, diagnostics build.

Fixture package 234 utilisée ponctuellement (MD/Q/SC) — pas de dépendance runtime au package complet.

---

## 7. Hors périmètre (non livré — D6-D+)

- Local Search Runtime (I/O Package Access)
- Cache persistant / IndexedDB
- Intégration Reader / UI / surbrillance
- Tests Playwright offline (D6-F)

---

## 8. Prochaine étape

**D6-D** — Runtime : résolution `SearchIndexContext`, lecture artefacts, cache persistant, câblage Reader.

---

*Rapport Lot D6-C — Local Search Service — 2026-08-01*
