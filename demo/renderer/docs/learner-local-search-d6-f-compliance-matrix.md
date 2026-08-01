# Matrice de conformité D6-F — Local Search (D6-A → D6-E)

| | |
|---|---|
| **Lot** | D6-F — Matrice de validation |
| **Date** | 2026-08-01 |
| **Verdict global** | **CONFORME — D6-F READY FOR D6-G** |

---

## Légende

| Symbole | Signification |
|---|---|
| ✅ | Validé par test D6-F |
| ◻ | Couvert par lot amont (D6-C/D/D6-E), non re-testé D6-F |
| ⚠ | Écart résiduel documenté, non bloquant |

---

## D6-A — LOCAL-SEARCH-COMPONENT-CONTRACT

| Exigence | Statut | Preuve D6-F |
|---|---|---|
| Recherche limitée Release ouverte | ✅ | LS-F-01, LS-F-13 |
| Index dérivé non patrimonial | ✅ | LS-F-02/03/04, tests cache Node |
| Runtime seul point d'entrée I/O | ◻ | D6-D |
| Reader ne reconstruit pas snippets/tri | ✅ | LS-F-01 ordre identique Runtime |
| SearchHit navigation vers ancres D4 | ✅ | LS-F-07…11 |
| Pas de persistance requête/résultats | ✅ | LS-F-15, tests Node D4 |
| Pas de multi-release | ✅ | LS-F-13, test isolation Node |
| Offline ≠ cache recherche | ✅ | LS-F-05 purge cache recherche seul |

---

## D6-B — Modèle index / normalisation

| Exigence | Statut | Preuve |
|---|---|---|
| `index_schema_version = 1` | ◻ | D6-D tests |
| `section_path` clé `\u001f` | ✅ | LS-F-08 Collège |
| Ancres D4 (5 kinds) | ✅ | LS-F-07…11 |
| Diagnostics QUERY_TOO_SHORT | ✅ | LS-F-17 empty state |

---

## D6-C — Local Search Service

| Exigence | Statut | Preuve |
|---|---|---|
| Pureté (pas d'I/O) | ◻ | D6-C 44 tests |
| Matching déterministe | ◻ | D6-C |
| Ordonnancement 7 niveaux | ✅ | LS-F-01 |
| SearchHit complet | ✅ | LS-F-01 hits structure |

---

## D6-D — Runtime + cache

| Exigence | Statut | Preuve |
|---|---|---|
| Lazy build | ✅ | LS-F-02 |
| Cache IDB réutilisé | ✅ | LS-F-03 |
| Rebuild après purge/corrupt/stale | ✅ | LS-F-04 + tests Node |
| `setOpenRelease` scope | ✅ | LS-F-13, test Node scope |
| Diagnostics manifest inaccessible | ✅ | test Node |

---

## D6-E — Reader integration

| Exigence | Statut | Preuve |
|---|---|---|
| Panneau états UI | ✅ | LS-F-17 |
| Surbrillance temporaire | ✅ | LS-F-07…11, LS-F-14 |
| Navigation adaptateur | ✅ | LS-F-07…11 |
| Ancre introuvable | ✅ | LS-F-12 |
| Ctrl/Cmd+K | ✅ | LS-F-17 |
| Package 234 E2E | ✅ | Tous LS-F-* |

---

## OFFLINE-COMPONENT-CONTRACT

| Exigence | Statut | Preuve |
|---|---|---|
| Recherche sur Release offline_ready | ✅ | LS-F-05/06 |
| Index build sans cache recherche préexistant | ✅ | LS-F-05 |
| Cache recherche ≠ certification offline | ✅ | Design + LS-F-05 |
| Artefacts via SW / Runtime offline | ✅ | LS-F-05 manifest fetch ok |

---

## LEARNER-PATRIMONY / D4

| Exigence | Statut | Preuve |
|---|---|---|
| Snapshot sans Search | ✅ | LS-F-16 |
| Import Snapshot sans effet Search | ✅ | test Node |
| Session Service sans SearchHit | ◻ | D6-E + test Node ResumePlan |
| Reprise D4 sans panneau/requête | ✅ | LS-F-15 |

---

## RENDERER / COMPOSITION

| Exigence | Statut | Preuve |
|---|---|---|
| `data-section-path` Collège | ✅ | LS-F-08 |
| `data-scenario-id` scénarios | ✅ | LS-F-10 |
| Vues composées navigation | ✅ | LS-F-07…11 |

---

## Synthèse

Tous les critères de sortie D6-F sont **PASS**. Écarts résiduels R1–R3 documentés dans le rapport de validation — **non bloquants**.

**D6-F READY FOR D6-G**
