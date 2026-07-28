# Migration Item 234 — FIL A → FIL B

**Date :** 2026-07-28  
**Statut :** terminé — vertical slice exclusivement sur FIL B  
**Verdict :** **VALIDATE PASS** · **BUILD PASS**

---

## Objectif

Faire de l'Item 234 la référence officielle de la chaîne FIL B, sans dépendance au legacy `chapter-analysis/`.

---

## Travaux réalisés

### 1. Source officielle

| Champ | Avant (FIL A) | Après (FIL B) |
|---|---|---|
| `source_file` | `chapter-analysis/…/official-college.md` | `full-edn/…/chapters/item-234-insuffisance-cardiaque-de-ladulte.md` |
| `edition` | `2024-SFC` | `2022` |
| SHA | `0650a527…` | `f4ea7b117d1f6a607a146041bd5bbcd65028c2a31f0c7720355c3ee1e83c5df2` |

Fichier : `01-learning/chapters/cardio/234/source.meta.yaml`

### 2. Édition harmonisée

Remplacement `2024-SFC` → `2022` dans :

- `inventory.yaml` (109 KPs, 232 ancres)
- `manifest.json`, `build/reconciliation*.yaml`
- projections `understanding/*.md`
- `build/visual-specs/mm-pump-decompensation.yaml`

### 3. Scripts de build

Chemins FIL B mis à jour dans 8 scripts `build/validate-*.mjs` et `integrate-inventory-phase2c.mjs`.

### 4. Ancres encadrés (8 quotes)

**Cause :** Tool 01 encode les encadrés en blockquotes Markdown (`> • …`). La normalisation whitespace ne supprimait pas les préfixes `>`, cassant 8 quotes sur 232.

**Correction :** `tools/lou-build/lib/anchors.js` — `normalizeWhitespace` supprime désormais les préfixes blockquote (`^>\s?`). Bug bloquant FIL B, pas une optimisation Tool 01.

**Résultat :** 232/232 ancres résolues sur FIL B.

### 5. Index sections

`source.meta.yaml` — marqueurs de titres mis à jour pour la structure Tool 02 (`## I Généralités`, etc.).

### 6. Validation pipeline

```
node tools/lou-build/cli.js validate --chapter 01-learning/chapters/cardio/234  → PASS
node tools/lou-build/cli.js build   --chapter 01-learning/chapters/cardio/234  → PASS
tools/lou-build npm test                                                       → 96/96 PASS
```

Artefacts régénérés : `manifest.json`, `build/traceability.json`, `build/grounding.yaml` — tous en édition `2022`.

---

## Preuve SSOT

| Vérification | Résultat |
|---|---|
| Aucune référence opérationnelle à FIL A dans le package 234 | ✅ |
| `lou-build validate` charge le chapitre FIL B | ✅ |
| Ancres verbatim résolues dans le chapitre Tool 02 | ✅ 232/232 |
| Inventory inchangé sémantiquement (109 KPs) | ✅ |
| Blueprint / projections / reconciliation slice OAP | ✅ inchangés |

---

## Fichiers legacy (historique, non opérationnels)

Les artefacts Phase 2–3 (`inventory-candidate.yaml`, `reconciliation-full-v2.yaml`, rapports intermédiaires) conservent des mentions FIL A / `2024-SFC` — trace historique uniquement, non consommés par `lou-build`.

---

## Documents connexes

- [`qualification-report-acquisition-final.md`](qualification-report-acquisition-final.md)
- [`qualification-report-phase-0b.md`](qualification-report-phase-0b.md)
