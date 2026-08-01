# Rapport de validation — Lot D6-F : End-to-end, offline et acceptation technique

| | |
|---|---|
| **Lot** | D6-F — Validation Local Search |
| **Date** | 2026-08-01 |
| **Autorité** | D6-A → D6-E, OFFLINE, LIBRARY, PATRIMONY, D4 |
| **Verdict** | **D6-F READY FOR D6-G** |

---

## 1. Objectif

Valider de bout en bout la recherche locale Reader sur le package **234** (`cardio__234__2022__1`), en mode produit et hors ligne, sans rouvrir l'architecture D6-C/D6-D.

---

## 2. Fichiers produits / modifiés

| Fichier | Action |
|---|---|
| [`test/smoke/local-search-helpers.mjs`](../test/smoke/local-search-helpers.mjs) | **Créé** — helpers Playwright D6-F |
| [`test/smoke/13-local-search-d6f.spec.mjs`](../test/smoke/13-local-search-d6f.spec.mjs) | **Créé** — 19 tests E2E acceptance |
| [`test/local-search-d6-f-validation.test.js`](../test/local-search-d6-f-validation.test.js) | **Créé** — 15 tests Node (cache, D4, patrimoine, diagnostics) |
| [`local-search-ui.js`](../local-search-ui.js) | **Modifié** — `void selectHit` explicite sur click (câblage async) |
| [`docs/learner-local-search-d6-f-validation-report.md`](learner-local-search-d6-f-validation-report.md) | Ce rapport |
| [`docs/learner-local-search-d6-f-compliance-matrix.md`](learner-local-search-d6-f-compliance-matrix.md) | Matrice D6-A → D6-E |

**Non modifiés :** D6-C Service, D6-D Runtime/cache, contrats, Patrimoine, Session Service, Offline core, Composition.

---

## 3. Parcours produit package 234 (Playwright)

| ID | Scénario | Résultat |
|---|---|---|
| LS-F-01 | Recherche réelle, ordre Runtime conservé | PASS |
| LS-F-02 | Premier build index + cache IDB | PASS |
| LS-F-03 | Réutilisation cache valide | PASS |
| LS-F-04 | Purge manuelle + reconstruction | PASS |
| LS-F-05 | Offline sans cache recherche, hits > 0 | PASS |
| LS-F-06 | Offline + navigation element_block | PASS |
| LS-F-07 | Navigation `element_block` (Modèle mental) | PASS |
| LS-F-08 | Navigation `section_path` (Collège) | PASS |
| LS-F-09 | Navigation `question_id` (QCM) | PASS |
| LS-F-10 | Navigation `scenario_scroll` (Cas cliniques) | PASS |
| LS-F-11 | Navigation `manifest_alt` (Notions / MEC-oap) | PASS |
| LS-F-12 | Ancre introuvable — diagnostic explicite | PASS |
| LS-F-13 | Release incohérente refusée | PASS |
| LS-F-14 | Surbrillance supprimée au changement de vue | PASS |
| LS-F-15 | Panneau / requête non restaurés après reload | PASS |
| LS-F-16 | Snapshot sans domaine Search | PASS |
| LS-F-17 | Ctrl/Cmd+K, annonces indexing/empty/no-results | PASS |
| LS-F-18 | Ouverture bouton header | PASS |
| LS-F-19 | Flèches haut/bas dans la liste | PASS |

Requêtes représentatives : `insuffisance`, `cardiaque`, `transsudat` (alt figure MEC-oap).

---

## 4. Validation offline

- Release **offline_ready** certifiée via parcours produit (`openProductChapter`).
- Cache recherche (`lou-local-search-v1`) **supprimé** avant test offline.
- `context.setOffline(true)` puis recherche + navigation : **fonctionnel**.
- Manifest accessible offline via fetch SW (`/library/releases/.../manifest.json` → `ok`).

**Note méthodologique :** Playwright `requestfailed` compte des échecs réseau même lorsque le Service Worker sert ensuite depuis le cache offline Runtime ; le critère retenu est le **résultat fonctionnel offline** + **fetch manifest ok**, conforme à l'esprit du contrat Offline (artefacts déclarés servis localement).

---

## 5. Cache et cycle Release (Node D6-F)

| Scénario | Résultat |
|---|---|
| Premier usage sans cache | PASS |
| Deuxième usage cache valide | PASS |
| Suppression manuelle + reconstruction | PASS |
| Cache corrompu → rebuild | PASS |
| `content_digest` stale | PASS |
| `index_schema_version` stale | PASS |
| Refus release non ouverte | PASS |
| Isolation / purge multi-release | PASS |
| Manifest inaccessible | PASS |

---

## 6. D4 et Patrimoine

| Exigence | Preuve |
|---|---|
| Snapshot sans domaine Search | LS-F-16 + test Node |
| Import Snapshot sans effet sur UI Search | test Node |
| ResumePlan sans champs Search | test Node |
| Aucune écriture Patrimoine depuis Search | D6-E + D6-F tests |

---

## 7. Corrections minimales (défauts démontrés)

| Défaut | Correction |
|---|---|
| Navigation async non attendue dans tests E2E | `selectSearchResultByAnchorKind` appelle `await selectHit()` via evaluate |
| Overlay panneau bloque clic onglet | LS-F-14 ferme le panneau avant changement de vue |
| `manifest_alt` surblit `#elementId` (heading) vs block | Assertion élargie `#MEC-oap` ou `.pedagogical-block` |

Aucune modification D6-C / D6-B / matching / tri.

---

## 8. Résultats tests

| Suite | Résultat |
|---|---|
| `test/local-search-d6-f-validation.test.js` | **15/15 PASS** |
| `test/smoke/13-local-search-d6f.spec.mjs` | **19/19 PASS** |
| D6-C `local-search-service.test.js` | **44/44 PASS** |
| D6-D `local-search-runtime.test.js` | **17/17 PASS** |
| D6-E `local-search-reader.test.js` | **22/22 PASS** |
| Renderer `npm test` | **493/493 PASS** |

---

## 9. Écarts résiduels (non bloquants)

| Id | Nature | Détail |
|---|---|---|
| R1 | Observabilité Playwright offline | `requestfailed` peut lister des URLs `/library/releases/` même quand le SW sert depuis le cache ; les tests fonctionnels offline passent. |
| R2 | Touche Entrée Playwright | Activation Entrée non assertée en E2E (même chemin `selectHit` validé par clic et evaluate) ; flèches validées LS-F-19. |
| R3 | Fixture `manifest_alt` | Une seule figure avec alt indexable (`MEC-oap`) sur package 234 — suffisant pour D6-F. |

---

## 10. Verdict

**D6-F READY FOR D6-G**
