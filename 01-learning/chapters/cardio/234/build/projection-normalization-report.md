# VisualSpec Projection Normalization — Rapport

**Mission:** Normalisation VisualSpec v0.2 — une source canonique par fait  
**Date:** 2026-08-09  
**Mode:** REPORT-ONLY pour Projection Foundation / Total Disposition (modules inchangés)

---

## 1. Normalisation retenue

### Règle architecturale

Lorsqu'une branche porte `threshold_fragment`, les **seuils numériques** sont canoniques **uniquement** dans `threshold_fragment.scales`.  
`branch.condition` doit rester **qualitatif** (ex. « Seuils bas ») — jamais une reprise verbatim des seuils.

### Mécanismes

| Couche | Changement |
|---|---|
| **Validation** | Rejet si `condition` duplique les sémantiques du fragment |
| **Claim units** | Fait canonique par échelle : `threshold-fragment-scale-line` ; `cutoff_label` = substrat d'auteur, pas fait learner séparé |
| **Pipeline render** | `normalizeVisualSpecForProjection()` avant rendu V02 |
| **Claim enumeration** | Normalisation appliquée dans `visualSpecClaimUnits()` |

### Représentations

| Fait | Avant | Après |
|---|---|---|
| Seuils BNP/NT-proBNP | `branch.condition` + `threshold-cutoff` + `scale-line` | `scale-line` (callout) + `condition` qualitative |
| Branch label | Texte complet des seuils | « Seuils bas » (qualitatif) |
| Callout gris | context + scale lines | Inchangé (source canonique) |
| `low_band_meaning` | DERIVED depuis node | Inchangé |

---

## 2. Fichiers modifiés

**Nouveau :**
- `tools/lou-build/lib/visual-spec-projection-normalize.js`
- `tools/lou-build/test/visual-spec-projection-normalize.test.js`
- `01-learning/chapters/cardio/234/build/projection-normalization-report.md`
- `01-learning/chapters/cardio/234/build/projection-total-disposition-report-before-normalization.json`
- `01-learning/chapters/cardio/234/build/projection-total-disposition-report-after-normalization.json`

**Modifiés :**
- `tools/lou-build/lib/visual-spec-v02-lotb.js` — validation + claim units
- `tools/lou-build/lib/visual-spec.js` — normalisation dans claim units
- `tools/lou-build/lib/vcck/render-bridge.js` — normalisation avant rendu V02
- `01-learning/chapters/cardio/234/build/visual-specs/n09-diagnostic-algorithm.yaml`
- `tools/lou-build/vcck/specs/234-w2a/n09-diagnostic-algorithm.yaml`
- `01-learning/chapters/cardio/234/build/review/n09-diagnostic-algorithm-enriched-prototype.yaml`
- `tools/lou-build/test/projection-verification.test.js`
- SVG régénérés : N09, N13, N20 (official + review)

**Non modifiés :** Visual Grammar, Runtime, Theme, renderers (logique layout), Projection Foundation, Total Disposition.

---

## 3. Diff conceptuel

### Avant

**Modèle :** `branch.condition` pouvait recopier les seuils du `threshold_fragment` → deux sources canoniques pour un même fait.

**Projection :** 2× `threshold-cutoff` + 2× `scale-line` + branch label = duplication mesurée (6 duplicated corpus-wide).

### Après

**Modèle :** Seuils dans `threshold_fragment.scales` uniquement ; `condition` qualitative ; une échelle = un fait `threshold-fragment-scale-line`.

**Projection :** Duplication BNP/NT-proBNP éliminée ; branch label découplé des seuils.

---

## 4. Métriques avant / après

| Métrique | Avant | Après | Δ |
|---|---|---|---|
| totalFacts | 55 | 53 | −2 (cutoff facts retirés) |
| duplicated | 6 | 2 | **−4** |
| missing | 8 | 7 | −1 |
| exactlyOnce | 41 | 44 | +3 |
| N09 duplicated | 5 | 1 | **−4** |
| N09 mismatches | 10 | 5 | **−5** |

Duplication N09 restante : `threshold-fragment-context` « hors urgence » — substring de « Parcours hors urgence » (autre branche), pas duplication de modèle seuils.

---

## 5. Review SVG

### N09 enriched

| Slot | Bytes | Changement |
|---|---|---|
| old | 8709 | Seuils dans branch label (legacy) |
| prev | 10579 | +data-official-text-id, branch seuils complets |
| current | 10887 | Branch « Seuils bas » ; seuils dans callout uniquement |

### N13 / N20 enriched

- **N20 :** byte-identique old/prev/current (pas de changement spec)
- **N13 :** spec inchangée ; triplet reconstitué (prev/old absents avant mission)

---

## 6. Limites restantes

1. Contexte « hors urgence » — collision substring inter-branches (verification, pas modèle)
2. Branches missing N09 (reformatage renderer) — hors périmètre normalisation
3. N20 pole « DAI » duplicated — préexistant, non lié à cette mission
4. Registre `fact_dispositions` déclare encore `threshold-cutoff` MATERIALIZED — alignement registre = mission future

---

*Généré en mode report-only — aucun gate bloquant.*
