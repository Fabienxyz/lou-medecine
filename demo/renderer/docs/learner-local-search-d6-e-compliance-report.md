# Rapport de conformité — Lot D6-E : Intégration Reader (D6-A → D6-D)

| | |
|---|---|
| **Lot** | D6-E — Reader Local Search |
| **Date** | 2026-08-01 |
| **Références** | D6-A, D6-B, D6-C, D6-D, RENDERER-COMPONENT-CONTRACT, COMPOSITION, PDR-D4, LEARNER-PATRIMONY |
| **Verdict** | **CONFORME — D6-E READY FOR D6-F** |

---

## 1. Méthode

Revue statique du diff D6-E + exécution `test/local-search-reader.test.js`, régression D6-C/D6-D, suite Renderer complète (478 tests).

---

## 2. Conformité D6-A (contrat)

| Exigence | Statut | Preuve |
|---|---|---|
| **§4.1 Reader consommateur** | ✅ | Aucune logique d'index/match dans Reader ; appels `runtime.search` uniquement |
| **§4.3 Reader ne reconstruit pas snippets** | ✅ | `renderSnippetHtml` applique `snippetMatchRanges` du hit ; pas de rebuild texte |
| **§4.3 Reader ne trie pas** | ✅ | Ordre `hits` Runtime conservé ; test ordre |
| **§4.3 Périmètre Release ouverte** | ✅ | Panneau visible mode produit + `setOpenRelease` ; refus mismatch |
| **§12 Session / Patrimoine** | ✅ | Aucune écriture store ; états UI non persistés |
| **Interdit recherche globale / fuzzy / historique** | ✅ | Non implémenté |

---

## 3. Conformité D6-B (ancres)

| Ancre | Statut | Preuve |
|---|---|---|
| `element_block` | ✅ | `resolveSearchAnchorTarget` + navigation test |
| `section_path` | ✅ | `decorateCollegeSectionPaths` + test clé `\u001f` |
| `question_id` | ✅ | Test DOM `[data-question-id]` |
| `scenario_scroll` | ✅ | `data-scenario-id` + test |
| `manifest_alt` | ✅ | Test bloc pédagogique |

---

## 4. Conformité D6-C / D6-D (non-régression)

| Composant | Statut | Preuve |
|---|---|---|
| Local Search Service | ✅ Inchangé | Diff limité au Reader |
| Local Search Runtime | ✅ Inchangé | 17/17 PASS |
| Cache IndexedDB | ✅ Inchangé | — |

---

## 5. Compatibilité D4

| Règle | Statut |
|---|---|
| Navigation SearchHit compatible kinds ResumePoint | ✅ |
| Aucune requête / résultat persisté | ✅ |
| Panneau non restauré | ✅ |
| Surbrillance recherche non restaurée | ✅ |
| Session Service ne manipule pas SearchHit | ✅ |

Navigation depuis recherche : `skipViewCommit: true` pour limiter les effets de bord session lors d'une exploration éphémère (autorisé par « peut suivre la politique normale »).

---

## 6. États UI demandés

| État | Statut |
|---|---|
| closed | ✅ |
| idle | ✅ |
| indexing | ✅ |
| searching | ✅ |
| results | ✅ |
| empty | ✅ |
| no-results | ✅ |
| error | ✅ |

---

## 7. Diagnostics utilisateur

| Cas | Statut |
|---|---|
| Indexation en cours | ✅ |
| Aucun résultat | ✅ |
| Erreur Runtime | ✅ |
| Cache reconstruit | ✅ message `cache-rebuilt` |
| Ancre introuvable | ✅ |
| Release incohérente | ✅ |

---

## 8. Package 234

Recherche `insuffisance` sur fixture `cardio__234__2022__1` : hits non vides, navigation premier hit OK (test E2E).

---

## 9. Verdict

**D6-E READY FOR D6-F**
