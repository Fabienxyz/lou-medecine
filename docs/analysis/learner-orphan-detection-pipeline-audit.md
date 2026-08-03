# Audit — pipeline de détection des annotations orphelines (Learner V1)

**Date :** 3 août 2026  
**Périmètre :** couche Learner du Reader V1 — décision « orphelin » → panneau « Annotations personnelles non restaurables »  
**Contraintes respectées :** pas de modification Composition, Lou Build, packages, offline, session, shell, search, UI du panneau, schéma IndexedDB.

---

## 1. Symptôme Product Review

Des annotations **visibles dans le walkthrough** (surlignages ou notes inline restaurés) apparaissaient encore dans le panneau « Annotations personnelles non restaurables ». Le panneau ne doit lister que des annotations **réellement irrésolubles**.

---

## 2. Causes identifiées

### Cause A — double restauration (commit précédent `b5c82d3`)

`mountLearnerLayers()` appelait `restore()` par projection **puis** `mount()` relançait `restoreAll()`. Lors du second passage, une annotation déjà matérialisée dans le DOM pouvait échouer la résolution du sélecteur et être classée orpheline à tort.

**Correctif A :** un seul chemin de restauration via `mount()` → `restoreAll()`.

### Cause B — lignes fantômes dans le panneau (ce commit)

Même après correction de la logique de décision, le panneau **accumulait** des lignes `.learner-orphan-annotation` sans les purger au début d’un cycle de restauration :

1. Un premier passage (ou une restauration partielle) ajoutait une ligne orpheline.
2. Un second `mountLearnerLayers()` sur le **même host** (changement d’onglet, re-mount composition) satisfaisait l’annotation dans le DOM.
3. La déduplication par `data-orphan-id` empêchait les doublons **mais ne supprimait pas** la ligne stale.

Résultat : annotation visible + entrée persistante dans le panneau → incohérence Product Review.

**Correctif B :** `beginRestoreCycle(host)` purge les lignes `.learner-orphan-annotation` avant chaque cycle ; `filterOrphans()` rejette toute entrée dont le walkthrough est déjà satisfait avant `appendAnnotationOrphans()`.

---

## 3. Pipeline réel (restauration → orphelin)

```mermaid
flowchart TD
    A[LouBlocks.render / LouRenderer.mountLearnerLayers] --> B[beginRestoreCycle]
    B --> C[Purge .learner-orphan-annotation]
    C --> D[LouTextHighlights.mount]
    C --> E[LouInlineNotes.mount]
    D --> F[restoreAll → restore par projection]
    E --> G[restoreAll → restore par projection]
    F --> H{evaluateHighlight}
    G --> I{evaluateNote}
    H -->|restored| J[DOM mark / déjà satisfait]
    H -->|orphan| K[orphans[]]
    I -->|restored / skipped| L[DOM note / déjà satisfait]
    I -->|orphan| K
    K --> M[filterOrphans — gate finale]
    M -->|vide| N[Pas de panneau / clear rows]
    M -->|non vide| O[appendAnnotationOrphans]
    O --> P[Dédup data-orphan-id]
    P --> Q[Panneau .learner-orphans]
```

### Points d’entrée

| Étape | Fichier | Fonction |
|-------|---------|----------|
| Render complet | `blocks.js` | `render()` → `beginRestoreCycle` → `mount()` |
| Re-mount sans rebuild | `renderer.js` | `mountLearnerLayers()` → `beginRestoreCycle` |
| Restauration highlights | `text-highlights.js` | `mount()` → `restoreAll()` → `restore()` |
| Restauration notes | `inline-notes.js` | `mount()` → `restoreAll()` → `restore()` |
| Décision structurée | `learner-orphan-decision.js` | `evaluateHighlight()` / `evaluateNote()` |
| Gate finale | `learner-orphan-decision.js` | `filterOrphans()` |
| Affichage panneau | `blocks.js` | `appendAnnotationOrphans()` |

### Critères « restauré » vs « orphelin »

**Highlight** (`evaluateHighlight`) :

| Raison | Décision |
|--------|----------|
| `already_satisfied_in_dom` | restored — mark existant ou texte exact présent |
| `wrapped_from_selector` | restored — range résolu, mark créé |
| `range_already_highlighted` | restored |
| `block_not_found` | orphan |
| `walkthrough_not_found` | orphan |
| `selector_unresolved` | orphan |

**Note** (`evaluateNote`) :

| Raison | Décision |
|--------|----------|
| `note_id_already_in_dom` / `note_text_already_in_dom` | skipped (non orphelin) |
| `inserted_from_caret_anchor` | restored |
| `caret_anchor_unresolved` | orphan |
| `block_not_found` / `walkthrough_not_found` | orphan |

---

## 4. Instrumentation temporaire

Module `learner-orphan-decision.js` — trace opt-in :

- URL : `?learnerTrace=1`
- ou `localStorage.setItem('lou-learner-trace', '1')`

Chaque annotation émet un objet :

```
annotationId, type, releaseId, projectionId, elementId, selector,
blockFound, walkthroughFound, rangeFound, domCreated, alreadyPresent,
decision (restored | orphan | skipped), reason
```

Consultation : `window.__LouLearnerRestoreTrace` ou `LouLearnerOrphanDecision.getTraceLog()`.

---

## 5. Invariants prouvés

| ID | Invariant | Mécanisme | Test |
|----|-----------|-----------|------|
| A | créer → reload → visible → jamais orphelin | `evaluateHighlight` détecte `already_satisfied_in_dom` ; pas de second restore parasite | `learner-annotation-lifecycle.test.js`, smoke PE/LC |
| B | visible DOM → interdiction panneau | `filterOrphans` + `beginRestoreCycle` purge stale rows | `learner-orphan-decision.test.js` « stale orphan row cleared » |
| C | irrésolvable → orphelin → panneau | `block_not_found` / `selector_unresolved` | `learner-orphan-decision.test.js` « legitimate orphan » |
| D | aucune duplication | `appendAnnotationOrphans` dédup `data-orphan-id` | `learner-orphan-decision.test.js` « dedupes by annotation id » |
| E | aucune entrée fantôme | `beginRestoreCycle` + `filterOrphans` | `learner-orphan-decision.test.js` « filterOrphans drops satisfied » |

---

## 6. Fichiers modifiés

| Fichier | Rôle |
|---------|------|
| `demo/renderer/learner-orphan-decision.js` | **Nouveau** — décision traçable, purge cycle, filterOrphans |
| `demo/renderer/text-highlights.js` | Délègue à `evaluateHighlight` + `filterOrphans` |
| `demo/renderer/inline-notes.js` | Délègue à `evaluateNote` + `filterOrphans` |
| `demo/renderer/blocks.js` | `beginRestoreCycle` avant mount ; `filterOrphans` dans `appendAnnotationOrphans` |
| `demo/renderer/renderer.js` | `beginRestoreCycle` au début de `mountLearnerLayers` |
| `demo/renderer/index.html` | Chargement script |
| `demo/renderer/test/learner-orphan-decision.test.js` | **Nouveau** — 5 tests invariants |
| `demo/renderer/test/learner-annotation-lifecycle.test.js` | Charge le nouveau module |

---

## 7. Validations exécutées

### Tests unitaires (Node)

- `learner-orphan-decision.test.js` — 5/5
- `learner-annotation-lifecycle.test.js` — 9/9
- Total couche apprenante : **14/14**

### PAS Engineering (Playwright)

| Suite | Résultat |
|-------|----------|
| 01-creation | ✓ |
| 02-persistence | ✓ |
| 04-lifecycle | ✓ |
| 05-dom-integrity | ✓ |
| 06-selection | ✓ |
| 08-robustness | ✓ |

**Total engineering smokes exécutés : 37/37**

### PAS RELEASE

**Non exécuté** (conformément aux consignes).

---

## 8. Recommandations

1. **Product Review** : activer `?learnerTrace=1` sur une session problématique ; exporter `LouLearnerOrphanDecision.getTraceLog()` pour toute annotation encore listée à tort — la `reason` doit être explicite.
2. **Observabilité** : conserver le module de trace en production (coût négligeable, désactivé par défaut).
3. **Évolution** : si de nouveaux types d’annotations arrivent, étendre `evaluate*` et `filterOrphans` plutôt que dupliquer la logique dans les modules overlay.

---

## 9. Critères de réussite — statut

| Critère | Statut |
|---------|--------|
| Panneau uniquement pour annotations irrécupérables | ✓ (filterOrphans + purge cycle) |
| Annotation restaurée jamais classée orphan | ✓ |
| Annotation restaurée jamais dans le panneau | ✓ |
| Pas de double comptage | ✓ (dedup id) |
| Décision orphan jamais opaque | ✓ (trace + reason enum) |
