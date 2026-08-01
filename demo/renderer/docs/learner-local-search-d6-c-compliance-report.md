# Rapport de conformité — Lot D6-C : Local Search Service

| | |
|---|---|
| **Lot** | D6-C — Local Search Service |
| **Date** | 2026-08-01 |
| **Références** | [`LOCAL-SEARCH-COMPONENT-CONTRACT.md`](../../../docs/contracts/components/LOCAL-SEARCH-COMPONENT-CONTRACT.md) (D6-A) ; [`learner-local-search-d6-b-technical-design.md`](learner-local-search-d6-b-technical-design.md) (D6-B) |
| **Verdict** | **CONFORME — Service D6-C prêt pour D6-D** |

---

## 1. Méthode

Revue statique code + exécution tests unitaires (`test/local-search-service.test.js`, 44 cas) contre exigences D6-A §4 (pureté), §8–§10 (modèle, SearchHit, ordonnancement), D6-B §1–§8.

---

## 2. Conformité D6-A (contrat)

| Exigence | Statut | Preuve |
|---|---|---|
| **LS-11 — Pureté Service** | ✅ | Aucun `fetch`, `window`, `IndexedDB`, filesystem dans les 3 modules |
| **LS-03 — Index dérivé** | ✅ | `buildSearchIndex` reconstruit depuis artefacts entrée |
| **LS-05 — SVG exclu** | ✅ | Seul `manifest_alt` indexé ; test T-SVG-01 |
| **LS-06 — Vues publiées** | ✅ | `availability !== published` → skip ; T-VIEW-01 |
| **LS-07 — Snippets Service** | ✅ | `snippet` + `snippetMatchRanges` produits ; T-SNIPPET-* |
| **LS-08 — Ordonnancement déterministe** | ✅ | Clé 7 niveaux ; T-SORT-* |
| **LS-14 — Reproductibilité** | ✅ | T-REPRO-01 |
| **§9.2 SearchHit minimal** | ✅ | Tous champs obligatoires présents ; T-HIT-GOLDEN-01 |
| **§10.2 Tri Vue → Projection → Document → Offset** | ✅ | `compareSortKey` + `documentOffset` |
| **§11.3 Cache versionné** | ✅ | `validateSearchCache` — valid/stale/missing |
| **§12.3 index_schema_version** | ✅ | Constante `1` ; rejet schema incompatible |
| **Interdit fuzzy/stemming/IA** | ✅ | `indexOf` sous-chaîne uniquement |
| **Interdit I/O Service** | ✅ | Artefacts fournis en entrée par appelant |

---

## 3. Conformité D6-B (spec technique)

| Section D6-B | Statut | Tests |
|---|---|---|
| §1 Modèle logique | ✅ | Structures index / unit / passage / SearchHit |
| §3 normText / normQuery V1 | ✅ | T-NORM-01…10 |
| §3.2 Extraction MD | ✅ | T-EXTRACT-MD-* |
| §3.3 Questions YAML | ✅ | T-EXTRACT-Q-* |
| §3.4 Scénarios YAML | ✅ | T-EXTRACT-SC-01 |
| §3.5 manifest_alt | ✅ | T-SVG-01 |
| §4 Matching | ✅ | T-MATCH-01…08 |
| §5 Snippets | ✅ | T-SNIPPET-01…02 |
| §6 Ordonnancement + tie-break | ✅ | T-SORT-01…02 |
| §7 Diagnostics | ✅ | Cache + BUILD_PARTIAL + QUERY_TOO_SHORT |
| §8 Jeux référence D6-C | ✅ | 44/44 pass |
| §1.7 Ancres D4 | ✅ | T-D4-ANCHOR-01…05 |

---

## 4. Écarts / réserves

| Id | Nature | Détail | Impact |
|---|---|---|---|
| — | Aucun écart bloquant | — | — |

**Note informative :** parser YAML V1 couvre les champs prescrits et le format fixture 234 ; YAML arbitraire hors contrat peut échouer avec `LS-DOC-INVALID` — comportement attendu V1.

---

## 5. Invariants vérifiés

- Même entrée → même index → mêmes SearchHit (ordre, snippets, plages).
- Requête vide ou longueur 1 → `[]` + `LS-QUERY-TOO-SHORT`.
- Build partiel possible avec `LS-BUILD-PARTIAL` si artefact manquant.
- Accents préservés ; casse ASCII neutralisée uniquement.

---

## 6. Verdict

| Question | Réponse |
|---|---|
| Service 100 % pur ? | **Oui** |
| Conforme D6-A ? | **Oui** |
| Conforme D6-B (`index_schema_version = 1`) ? | **Oui** |
| D6-D peut démarrer ? | **Oui** — sans clarification supplémentaire sur le Service |

---

*Rapport de conformité Lot D6-C — 2026-08-01*
