# Rapport d'implémentation — Lot D6-E : Intégration Reader de la recherche locale

| | |
|---|---|
| **Lot** | D6-E — Reader Local Search |
| **Date** | 2026-08-01 |
| **Autorité** | D6-A, D6-B, D6-C, D6-D (Runtime inchangé) |
| **Statut** | Intégration Reader terminée |

---

## 1. Objectif

Intégrer la recherche locale dans le Reader : panneau UI éphémère, consommation exclusive du Runtime D6-D, affichage des SearchHit, navigation vers ancres, surbrillance temporaire, tests et diagnostics.

**Non modifiés :** Local Search Service (D6-C), Runtime/cache (D6-D), Patrimoine, Session Service, Composition, Offline, Library, contrats.

---

## 2. Fichiers produits / modifiés

| Fichier | Action |
|---|---|
| [`search-navigation.js`](../search-navigation.js) | **Créé** — adaptateur SearchHit → DOM, surbrillance éphémère, `decorateCollegeSectionPaths` |
| [`local-search-ui.js`](../local-search-ui.js) | **Créé** — panneau, états UI, consommation Runtime |
| [`test/local-search-reader.test.js`](../test/local-search-reader.test.js) | **Créé** — 21 tests D6-E |
| [`app.js`](../app.js) | **Modifié** — boot Runtime produit, câblage UI, purge surbrillance au changement de vue |
| [`index.html`](../index.html) | **Modifié** — shell panneau + scripts |
| [`styles.css`](../styles.css) | **Modifié** — panneau, résultats, surbrillance `.search-hit-highlight` |
| [`renderer.js`](../renderer.js) | **Modifié** — `data-section-path` Collège, `data-scenario-id` scénarios |
| [`docs/learner-local-search-d6-e-implementation-report.md`](learner-local-search-d6-e-implementation-report.md) | Ce rapport |
| [`docs/learner-local-search-d6-e-compliance-report.md`](learner-local-search-d6-e-compliance-report.md) | Conformité D6-A → D6-D |

---

## 3. Architecture Reader

```text
index.html (panneau + trigger)
        ↓
local-search-ui.js (états UI éphémères)
        ↓
createBrowserLocalSearchRuntime (D6-D) — seul point d'entrée recherche
        ↓
SearchHit[] (ordre Runtime, snippets inchangés)
        ↓
search-navigation.js → showTab → ancre DOM → surbrillance temporaire
```

---

## 4. États UI

| État | Déclencheur |
|---|---|
| `closed` | Par défaut ; Escape ; clic overlay |
| `idle` | Panneau ouvert, index prêt, requête vide |
| `indexing` | Premier `ensureIndex` à l'ouverture |
| `searching` | Requête ≥ 2 caractères en cours |
| `results` | `hits.length > 0` |
| `empty` | Requête trop courte |
| `no-results` | Requête valide, 0 hit |
| `error` | Échec Runtime / Release incohérente |

Aucun état UI n'est écrit dans Patrimoine, Snapshot, Session Service ni `session_resume`.

---

## 5. Navigation SearchHit

| Ancre | Résolution DOM |
|---|---|
| `element_block` | `#elementId`, `[data-element-id]`, `.pedagogical-block[data-element]`, `{#cb-…}` via `.claim-trace-link[data-claim]` |
| `section_path` | `[data-section-path]` (clé `\u001f`, alignée D6-B) |
| `question_id` | `[data-question-id]` (liste QCM) |
| `scenario_scroll` | `[data-scenario-id]` ou scroll vue |
| `manifest_alt` | bloc pédagogique de l'élément visuel |

Vérifications : `release_id` du hit = Release ouverte ; vue présente dans les onglets ; ancre introuvable → diagnostic explicite, pas de navigation approximative.

---

## 6. Surbrillance

- Classe CSS `.search-hit-highlight` sur l'élément cible (non patrimoniale).
- `<mark class="search-hit-mark">` dans les snippets résultats (plages `snippetMatchRanges` du Runtime).
- Suppression : nouvelle recherche, fermeture panneau, changement de vue (`onContextChange`).

---

## 7. Raccourcis

| Raccourci | Action |
|---|---|
| `Ctrl/Cmd+K` | Ouvrir / fermer le panneau |
| `↑` / `↓` | Sélection résultat |
| `Enter` | Naviguer vers le hit sélectionné |
| `Escape` | Fermer le panneau |

---

## 8. Tests exécutés

| Suite | Résultat |
|---|---|
| `test/local-search-reader.test.js` (D6-E) | **21/21 PASS** |
| `test/local-search-service.test.js` (D6-C) | **44/44 PASS** |
| `test/local-search-runtime.test.js` (D6-D) | **17/17 PASS** |
| Suite Renderer complète (`npm test`) | **478/478 PASS** |

Smoke Playwright : non relancés dans ce lot (inchangés par D6-E côté spec existante).

---

## 9. Verdict

**D6-E READY FOR D6-F**
