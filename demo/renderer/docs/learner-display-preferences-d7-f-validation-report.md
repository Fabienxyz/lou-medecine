# Rapport de validation — Lot D7-F : Display Preferences end-to-end

| | |
|---|---|
| **Lot** | D7-F — Validation Display Preferences |
| **Date** | 2026-08-01 |
| **Autorité** | D7-A → D7-E, PATRIMONY, RENDERER, D4, D6, OFFLINE, COMPOSITION |
| **Verdict** | **D7-F READY FOR D7-G** |

---

## 1. Objectif

Valider de bout en bout les trois préférences d'affichage V1 (thème, taille de police, largeur de lecture) dans le Reader, en mode produit sur le package **234** (`cardio__234__2022__1`), avec persistance patrimoniale, export/import Snapshot, rechargement, reset, diagnostics et orthogonalité D4/D6 — sans rouvrir l'architecture D7-C/D7-D/D7-E.

---

## 2. Fichiers produits / modifiés

| Fichier | Action |
|---|---|
| [`test/smoke/display-preferences-helpers.mjs`](../test/smoke/display-preferences-helpers.mjs) | **Créé** — helpers Playwright D7-F |
| [`test/smoke/14-display-preferences-d7f.spec.mjs`](../test/smoke/14-display-preferences-d7f.spec.mjs) | **Créé** — 18 tests E2E acceptance |
| [`test/display-preferences-d7-f-validation.test.js`](../test/display-preferences-d7-f-validation.test.js) | **Créé** — 19 tests Node (Snapshot, D4/D6, diagnostics, I/O) |
| [`display-preferences-ui.js`](../display-preferences-ui.js) | **Modifié** — navigation clavier explicite (`ArrowUp`/`ArrowDown`) + déduplication `input`/`change` |
| [`docs/learner-display-preferences-d7-f-validation-report.md`](learner-display-preferences-d7-f-validation-report.md) | Ce rapport |
| [`docs/learner-display-preferences-d7-f-compliance-matrix.md`](learner-display-preferences-d7-f-compliance-matrix.md) | Matrice D7-A → D7-E |

**Non modifiés :** `display-preferences-service.js`, `display-preferences-runtime.js`, `display-preferences-apply.js`, contrats, Session Service, Local Search, Offline core, Composition, Patrimoine (hors corrections d'intégration).

---

## 3. Correction minimale produit (justifiée)

| Fichier | Motif |
|---|---|
| `display-preferences-ui.js` | Les tests D7-F §10 et le parcours clavier réel exigent que `ArrowUp`/`ArrowDown` sur les `<select>` déclenchent `applyPatch`. Playwright (comme certains navigateurs headless) ne met pas à jour la valeur native ni ne déclenche `change`/`input` de façon fiable. Handler `keydown` explicite avec `preventDefault`, mise à jour `selectedIndex` et déduplication anti double-patch — périmètre autorisé « défauts d'accessibilité liés aux contrôles D7 ». |

Aucune modification D7-C (Service) ni D7-D (Runtime).

---

## 4. Parcours produit package 234 (Playwright)

| ID | Scénario | Résultat |
|---|---|---|
| DP-F-01 | Premier boot — défauts `light/medium/standard`, aucun record, domaine Snapshot `records: []` | PASS |
| DP-F-02 | Changement thème `dark` + reload — persistance | PASS |
| DP-F-03 | Changement taille `large` + reload | PASS |
| DP-F-04 | Changement largeur `narrow` + reload | PASS |
| DP-F-05 | Séquence successive + singleton unique (`display-preferences-v1`) | PASS |
| DP-F-06 | Reset — suppression record, défauts, Snapshot vide | PASS |
| DP-F-07 | Export Snapshot — 1 record sans `release_id` / DOM | PASS |
| DP-F-08 | Import idempotent + `loadAndApply({ source: "import" })` | PASS |
| DP-F-09 | Import domaine vide — record local conservé | PASS |
| DP-F-10 | Préférences globales — pas de `release_id` / `chapter` | PASS |
| DP-F-11 | Boot — `wasDisplayPreferencesLoaded()` avant reprise session | PASS |
| DP-F-12 | SearchHit ordre + snippets identiques light/dark | PASS |
| DP-F-13 | Reading ViewModel inchangé après prefs + reset | PASS |
| DP-F-14 | `offline_status` inchangé | PASS |
| DP-F-15 | Effet observable taille police small vs large | PASS |
| DP-F-16 | Effet observable largeur narrow vs wide | PASS |
| DP-F-17 | Focus clavier, `ArrowDown` thème, reset `Enter` | PASS |
| DP-F-18 | Thème sombre appliqué au shell | PASS |

Attributs vérifiés : `data-dp-theme`, `data-dp-font-size`, `data-dp-reading-width` sur `<html>`.

---

## 5. Validation Node (D7-F)

| ID | Scénario | Résultat |
|---|---|---|
| DP-F-N01 | Défauts effectifs sans enregistrement persisté | PASS |
| DP-F-N02 | Premier patch → singleton, même `record_id` | PASS |
| DP-F-N03 | Séquence dark → large → narrow → light → wide | PASS |
| DP-F-N04 | Reset supprime record | PASS |
| DP-F-N05 | Export store vide — domaine explicite `records: []` | PASS |
| DP-F-N06 | Export 1 record sans scope Release | PASS |
| DP-F-N07 | Round-trip export → import → export idempotent | PASS |
| DP-F-N08 | Import domaine vide — local conservé | PASS |
| DP-F-N09 | `domain_schema_version` incompatible — rejet E-D | PASS |
| DP-F-N10 | Valeur persistée invalide — normalisation + diagnostic | PASS |
| DP-F-N11 | `schema_version > 1` — `DP-SCHEMA-STALE` | PASS |
| DP-F-N12 | Doublons persistés — résolution singleton déterministe | PASS |
| DP-F-N13 | Erreur lecture store — propagation | PASS |
| DP-F-N14 | Erreur écriture store — propagation | PASS |
| DP-F-N15 | ResumePlan inchangé par préférences | PASS |
| DP-F-N16 | SearchHit identiques light/dark (Runtime) | PASS |
| DP-F-N17 | ViewModel Composition inchangé par callback apply | PASS |
| DP-F-N18 | `loadAndApply` terminé avant étape reprise session | PASS |
| DP-F-N19 | Snapshot body — pas de fuite domaines Search | PASS |

---

## 6. Non-régression

| Suite | Résultat |
|---|---|
| D7-C Service (41 tests) | **41/41 PASS** |
| D7-D Runtime (11 tests) | **11/11 PASS** |
| D7-D Snapshot (10 tests) | **10/10 PASS** |
| D7-E Reader (15 tests) | **15/15 PASS** |
| D7-F Node (19 tests) | **19/19 PASS** |
| D7-F Playwright (18 tests) | **18/18 PASS** |
| Suite Renderer complète `npm test` | **589/589 PASS** |

Tests amont D4, D6, Patrimoine E-B/E-C/E-D : inclus dans la suite Renderer — **0 échec**.

---

## 7. Critères de sortie D7-F

| Critère | Statut |
|---|---|
| Trois préférences appliquées de bout en bout | ✅ |
| Persistance + restauration au reload | ✅ |
| Premier boot sans écriture patrimoniale | ✅ |
| Reset supprime record + défauts | ✅ |
| Snapshot export/import conforme et idempotent | ✅ |
| Préférences globales (hors Release) | ✅ |
| D4, D6, Offline, Composition inchangés | ✅ |
| Tests ciblés + non-régression PASS | ✅ |

---

## 8. Écarts résiduels (non bloquants)

| Écart | Gravité |
|---|---|
| DP-F-10 vérifie la globalité via reload, pas un changement de Release explicite (couvert par DP-F-N06/N02 et absence de `release_id` dans le record) | ⚠ documenté |
| DP-F-17 ne parcourt pas les trois `<select>` au clavier — focus + thème + reset validés ; labels/focus couverts par T-UI-A11Y-01 (D7-E) | ⚠ documenté |
| Pas d'audit graphique exhaustif (hors périmètre mission §9) | — attendu |

---

## Verdict

**D7-F READY FOR D7-G**
