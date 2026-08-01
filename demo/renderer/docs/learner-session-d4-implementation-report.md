# Lot D4 — Rapport technique d'implémentation (post-audit)

**Date :** 2026-08-01  
**Référence normative :** `learner-session-d4-technical-design.md` (V4, inchangée)  
**Verdict audit initial :** GO APRÈS CORRECTIONS  
**Statut lot :** prêt pour contre-audit indépendant

---

## 1. B1 / M4 — Faits catalogue réels

### Problème corrigé
`app.js` injectait `releaseInstalled: true` et `installedReleaseIds: [releaseId]`, faussant la détection orphan vs superseded.

### Implémentation
- Nouveau module pur `library/restore-catalog-facts.js` — `buildRestoreCatalogFacts()`.
- Réexport depuis `product-bootstrap.mjs` pour le mode produit.
- `app.js` — `resolveRestoreCatalogFacts()` au boot :
  - **Mode produit :** `listReleases()` → toutes les entrées avec `installed_at` ; `getActiveRelease(chapter)` ; `offline_status` réel.
  - **Mode dev :** `installedReleaseIds` = `[manifest.release_id]` si présent ; pas d'invention.
- `buildRestoreContext()` n'infère plus `installedReleaseIds` depuis la seule release active ; le tableau vide reste vide si non fourni.

### Comportement attendu validé
| Cas | Résultat |
|-----|----------|
| Session sur Release N installée, N+1 active | `superseded_release` → `fallback_amorçage`, pas `orphan_signal` |
| Release session absente du catalogue installé | `orphan_signal` |
| Faits non hardcodés | `buildRestoreCatalogFacts` testé contre fixture `library.json` |

Le Session Service ne lit jamais le catalogue ; il consomme uniquement `RestoreContext`.

---

## 2. M1 — Ordre IA-10 (vue → ancre → overlays)

### Problème corrigé
`mountLearnerLayers` s'exécutait dans `showTab` / `renderComposedView` avant `applyResumePoint`.

### Implémentation
- `renderer.js` : `deferLearnerLayers`, `flushPendingLearnerLayers`, `clearPendingLearnerLayers`.
- `renderComposedBlocks` / `renderCollegeOfficial` : option `renderOptions.deferLearnerLayers`.
- `app.js` : `loadTabContent` / `loadComposedViewContent` propage `deferLearnerLayers`.
- `session-resume.js` — `applyResumePlan` :
  1. `showTab(index, { fromResumePlan: true, deferLearnerLayers: true })`
  2. `applyResumePoint` (dégradation mécanique `orphan_anchor`)
  3. `flushPendingLearnerLayers`

Hors restauration D4, le comportement overlay reste inchangé (montage immédiat).

---

## 3. M2 — Reader exécuteur strict

### Problème corrigé
Fallbacks Reader : plan incomplet → Amorçage ; `targetViewId` absent → index 0.

### Implémentation
- Plan incomplet (`validateResumePlanCompleteness` false) → `throw Error` explicite, cycle aborté.
- `targetViewId` absent des onglets → `throw Error` explicite, aucun index substitut.
- Cas `orphan_anchor` : vue conservée, warning affiché, overlays montés ensuite ; pas de second `buildResumePlan`.

---

## 4. M3 — Session Commit Events

| CE | Statut | Câblage |
|----|--------|---------|
| CE-01 VIEW_CHANGED | ✅ existant | `showTab` |
| CE-02 NOTION_CHANGED | ✅ ajouté | Clic `.pedagogical-block[data-element]` en vue `notions` uniquement (V4) |
| CE-03 QCM_QUESTION_CHANGED | ✅ ajouté | Clic `.view-qcm-item[data-question-id]` ; liste QCM enrichie |
| CE-04 INTERNAL_NAV_VALIDATED | ✅ ajouté | Clic `#chapter-line` (breadcrumb chapitre) → Amorçage |
| CE-05 NOTES_FOCUS_CHANGED | ✅ ajouté | Entrée vue Notes → catégorie `"shell"` (granularité V1) |
| CE-06 VIEW_LEAVE | ✅ existant | Changement d'onglet |
| CE-07 PAGEHIDE | ✅ existant | Lifecycle |
| CE-08 VISIBILITY_HIDDEN | ✅ existant | Lifecycle |
| CE-09 READER_CLOSE | ⚪ non applicable | Aucune UI de fermeture Reader distincte de pagehide/visibility ; non inventée |

Événements interdits (scroll libre, focus, modales, overlays E-B) : non câblés.

---

## 5. m1 à m4 — Corrections locales

### m1 — Pureté Session Service
- Suppression de la dépendance `global.LouLearnerPatrimony.deriveLogicalRecordId`.
- `deriveLogicalRecordId` local et déterministe dans `session-service.js`.

### m2 — Immutabilité profonde
- `deepFreeze`, `normalizeSessionRecord`, `cloneResumePoint` dans `session-resume.js`.
- `RestoreContext` et `CommitContext` gelés profondément avant usage Service.

### m3 — Migration v6 → v7
- Test automatisé : base v6 pré-remplie (highlights, notes, meta) → ouverture v7 → `session_resume` créé → données E-B intactes → réouverture stable.

### m4 — Déterminisme `firstPublishedViewId`
- Suppression du fallback `Object.keys(map)` et de l'invention d'ordre.
- Sans `viewOrder` explicite : `null` → dégradation `no_published_view` vers `fallback_amorçage`.

---

## 6. Fichiers modifiés

| Fichier | Nature |
|---------|--------|
| `library/restore-catalog-facts.js` | **Nouveau** — faits catalogue purs |
| `product-bootstrap.mjs` | Réexport catalog facts |
| `app.js` | Faits réels, IA-10, CE-02/03/04/05 |
| `session-service.js` | m1, m4, pureté |
| `session-resume.js` | M2, M1, m2, CE handlers |
| `renderer.js` | defer/flush overlays, QCM `data-question-id` |
| `test/session-d4-audit-corrections.test.js` | **Nouveau** — suite post-audit |
| `docs/learner-session-d4-implementation-report.md` | **Ce rapport** |

Documents normatifs (V4, contrats, ADR, gouvernance) : **non modifiés**.

---

## 7. Tests ajoutés ou renforcés

Fichier `test/session-d4-audit-corrections.test.js` (15 tests) :

- Catalog facts depuis fixture catalogue
- Superseded vs orphan
- Reader strict (plan incomplet, targetViewId inconnu)
- IA-10 ordre vue → ancre → overlays
- orphan_anchor single-pass
- CE-02, CE-03, CE-04, CE-05
- Pureté Service sans global patrimony
- Immutabilité RestoreContext
- Migration v6 → v7 avec données préexistantes

---

## 8. Résultat suite complète

```
tests 393 | pass 393 | fail 0
```

Commande : `npm test` dans `demo/renderer/`.

---

## 9. Conformité IA-01 à IA-25 (après correction)

| IA | Statut | Commentaire |
|----|--------|-------------|
| IA-01 à IA-04 | ✅ | Séparation Reader / Service / Patrimoine |
| IA-05 | ✅ | Déterminisme RestoreContext → ResumePlan |
| IA-06 à IA-09 | ✅ | Reader n'altère plus le plan métier |
| IA-10 | ✅ | Ordre vue → ancre → overlays |
| IA-11 à IA-13 | ✅ | Service sans DOM/IDB/horloge |
| IA-14 à IA-18 | ✅ | Commit Events conformes V4 |
| IA-19 | ✅ | Déterminisme CommitContext → SessionState |
| IA-20 | ✅ | Single pass buildResumePlan |
| IA-21 à IA-24 | ✅ | Persistance Reader-side (IA-25) |
| IA-25 | ✅ | Reader seul persiste session_resume |

---

## 10. Dettes restantes (hors périmètre)

- **CE-09 READER_CLOSE** : non applicable tant qu'aucune UI de fermeture explicite n'existe.
- **CE-02 navigation bloc précédent/suivant intra-vue** : le footer `data-nav` change d'onglet (CE-01) ; pas de navigation intra-vue Notions distincte dans le runtime actuel.

---

## Correction finale (contre-audit)

- **CE-02** : déclenchement restreint à `viewId === "notions"` ; `mental-model` exclu pour éviter une réécriture incorrecte de SessionState.
- **Vue Amorçage `planned`** : toujours non rendue ; fallback vers première vue publiée inchangé (hors scope audit).
- **Tests smoke Playwright** : non relancés dans ce lot (suite Node uniquement).

---

## Conclusion

- **Aucun commit effectué.**
- **Aucun tag créé.**
- **Aucun push effectué.**
- **Lot D4 prêt pour un contre-audit indépendant.**
