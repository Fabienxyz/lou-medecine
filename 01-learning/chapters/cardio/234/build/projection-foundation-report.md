# Projection Foundation — Rapport de mission

**Date :** 2026-08-09  
**Mission :** PROJECTION FOUNDATION (P0a + checkpoint + P0b)  
**Mode :** REPORT-ONLY — aucun gate bloquant introduit

---

## 1. Résultat P0a

Baseline datée : `build/projection-foundation-baseline-p0a.json`

| Métrique corpus (6 figures) | Valeur |
|---|---|
| Facts (projection-visible) | 52 |
| Exactly once | 36 |
| Missing | 13 |
| Duplicated | 3 |
| Orphan marks | 10 |

Mesure implémentée :
- Multiplicité (0 / 1 / >1) via comptage exact post-normalisation (`normalizeForMatch`)
- Réconciliation forward : VisualSpec facts → artefact
- Réconciliation reverse : marques textuelles learner-visible → facts connus
- Exclusion prudente des éléments structurels (`edge` sans texte learner-visible)

---

## 2. Fact enumeration autoritaire retenue

**Source unique :** `visualSpecClaimUnits()` dans `tools/lou-build/lib/visual-spec.js`

**Chaîne de délégation :**
- v0.2 → `visualSpecClaimUnitsV02()` → `visualSpecClaimUnitsLotB()` pour decision-algorithm / threshold-scale
- v0.1 → énumération inline nodes/edges/relation-label

**Justification :**
- Déjà utilisée par `visual-ground.js`, traceability, render-bridge
- Aucune énumération parallèle créée
- Projection verification filtre uniquement les unités structurelles non textuelles (`edge`) via `enumerateProjectionFacts()` — sans redéfinir les faits

---

## 3. Baseline corpus P0a

Répartition par type :

| Type | Total | Exactly once | Missing | Duplicated |
|---|---:|---:|---:|---:|
| node | 19 | 18 | 1 | 0 |
| subitem | 4 | 3 | 1 | 0 |
| branch | 12 | 7 | 5 | 0 |
| threshold-cutoff | 2 | 0 | 0 | 2 |
| annotation | 1 | 1 | 0 | 0 |
| pole | 2 | 1 | 0 | 1 |
| dimension | 3 | 0 | 3 | 0 |
| matrix-cell | 6 | 6 | 0 | 0 |
| edge | 3 | 0 | 3 | 0 |

*Note P0a : `dimension` missing et `edge` missing étaient en partie des faux signaux (classe CSS `vg-dim` non couverte ; edges structurels comptés comme facts). Corrigés en P0b.*

---

## 4. Résultat spécifique N09

| Métrique | P0a | P0b |
|---|---:|---:|
| Total facts | 19 | 23 |
| Exactly once | 12 | 13 |
| Missing | 5 | 5 |
| Duplicated | 2 | 5 |
| Orphans | 4 | 3 |

**Duplication détectée mécaniquement (sans règle N09-specific) :**
- `threshold-cutoff` `< 35 pg/mL` — occurrenceCount: 2 (branch label + callout)
- `threshold-cutoff` `< 125 pg/mL` — occurrenceCount: 2
- Après P0b : `threshold-fragment-scale-line` duplique également (BNP / NT-proBNP)

**`low_band_meaning` :**
- Absent de la spine en P0a → signalé comme gap d'énumération
- Ajouté en P0b (`threshold-fragment-low-band-meaning`, texte « IC peu probable »)
- Non rendu séparément dans le callout (texte présent via nœud `n09-unlikely`) — ambiguïté documentée, non corrigée

**Missing réels conservés (non réparés) :**
- Labels de branches tronqués / reformatés vs condition authored (ex. « BNP < 35 pg/mL ou NT-proBNP < 125 pg/mL »)
- Subitem / node non matérialisés tels quels

---

## 5. Checkpoint P0a → P0b

**Verdict : PASS**

**Catégories de lacunes identifiées :**
- `question`
- `threshold-fragment-context`
- `threshold-fragment-low-band-meaning`
- `threshold-fragment-scale-line`
- `subitem` (missing réels, non résolus)

**Justification :** lacunes limitées, extensibles via `visualSpecClaimUnitsLotB` / `visualSpecClaimUnitsV02` sans nouvelle couche ni FigurePlan.

---

## 6. Résultats P0b

### Catégories ajoutées à la fact spine

| Catégorie | Unit type | Source champ |
|---|---|---|
| Question | `question` | `spec.question` |
| Contexte fragment | `threshold-fragment-context` | `threshold_fragment.context` |
| Signification bande basse | `threshold-fragment-low-band-meaning` | `threshold_fragment.low_band_meaning` |
| Interprétation fragment | `threshold-fragment-interpretation` | `threshold_fragment.interpretation` |
| Ligne seuil rendue | `threshold-fragment-scale-line` | `${analyte} ${cutoff_label}` |

### Identités de matérialisation

Ride-along sur `visual-decision-svg.js` (chemin V02) :
- `data-official-text-id` ajouté sur title, branch labels, fragment lines, node labels, subitems, annotations
- Convention : `officialTextId(spec.element, suffix)` — alignée W1 / causal-graph
- **Aucun changement de layout, texte, ou style**

Baseline P0b : `build/projection-foundation-baseline-p0b.json`

| Métrique corpus | P0a | P0b |
|---|---:|---:|
| Total facts | 52 | 55 |
| Missing | 13 | 8 |
| Duplicated | 3 | 6 |
| Orphans | 10 | 9 |

Améliorations d'inventaire (sans masquer les défauts réels) :
- `dimension` N20 : PASS (classe `vg-dim` reconnue)
- `edge` N21 : exclus de la projection (structurels)
- `question` : inventorié (N21 title line-break → missing résiduel)

N09 duplication : **conservée et renforcée** (5 duplicated post-P0b).

---

## 7. Fichiers modifiés / créés (mission)

**Créés :**
- `tools/lou-build/lib/projection-verification.js`
- `tools/lou-build/test/projection-verification.test.js`
- `tools/lou-build/scripts/run-projection-baseline.mjs`
- `01-learning/chapters/cardio/234/build/projection-foundation-baseline-p0a.json`
- `01-learning/chapters/cardio/234/build/projection-foundation-baseline-p0b.json`
- `01-learning/chapters/cardio/234/build/projection-foundation-report.md`

**Modifiés (mission) :**
- `tools/lou-build/lib/visual-spec-v02-lotb.js` — extension fact spine
- `tools/lou-build/lib/visual-spec-v02.js` — question fact
- `tools/lou-build/lib/visual-spec.js` — question fact v0.1
- `tools/lou-build/lib/visual-decision-svg.js` — `data-official-text-id` ride-along
- `tools/lou-build/test/visual-spec.test.js` — count question
- `tools/lou-build/test/visual-ground.test.js` — count 17 units
- `01-learning/chapters/cardio/234/build/visual-grounding-review.yaml` — verdict question + digest refresh ride-along

---

## 8. Validations exécutées

```bash
node --test test/projection-verification.test.js   # 14/14 PASS
node --test test/visual-spec.test.js               # PASS
node --test test/visual-ground.test.js             # PASS
node --test test/capability-coverage.test.js       # PASS
node --test test/visual-spec-v02-lotb.test.js      # PASS
node scripts/run-projection-baseline.mjs --phase p0a
node scripts/run-projection-baseline.mjs --phase p0b
```

---

## 9. Confirmations explicites

- ✅ Aucune VisualSpec modifiée
- ✅ Aucun contenu médical modifié
- ✅ Aucun défaut N09 corrigé (duplication toujours exposée)
- ✅ Aucun gate bloquant introduit
- ✅ Aucune figure SVG du corpus régénérée (mesure sur artefacts existants)
- ✅ Renderer V02 : seuls attributs `data-official-text-id` ajoutés (ride-along)

---

## 10. Difficultés rencontrées

1. **Branch conditions vs rendu** : conditions multi-lignes dans le SVG ne matchent pas toujours le texte authored → missing légitimes.
2. **`low_band_meaning` vs node label** : même texte « IC peu probable » pour deux facts distincts → projection par texte ne distingue pas l'origine.
3. **Digests grounding MM** : review YAML stale (migration `NODE_KINDS` préexistante) — refresh ride-along nécessaire pour tests grounding.
4. **Artefacts corpus vs renderer courant** : layout N09 diffère (viewBox) — hors scope ; baseline mesure les SVG publiés, pas une regénération.

---

## 11. Risques / questions ouvertes (Total Disposition)

1. **Identité fact vs identité matérialisation** : `data-official-text-id` n'encode pas encore le fact id (`cb-vis-…`) — liaison par convention suffix, pas 1:1 garanti.
2. **Facts partageant le même texte** : comptage global ne résout pas l'attribution (low_band_meaning / node).
3. **Branch condition** : normalisation non faite — missing bruyants jusqu'à chantier dédié.
4. **Total Disposition** : `materialized / derived / discarded` reste hors scope — cette baseline fournit la mesure brute pour l'alimenter.

---

## 12. Recommandations pour reprise ChatGPT

1. **Activer Projection Ledger en CI report-only** : `node scripts/run-projection-baseline.mjs` sur corpus 234, publier JSON.
2. **Prioriser Total Disposition** sur N09 duplicated (classifier derived vs materialized, pas supprimer).
3. **Envisager `data-fact-id`** ou mapping official-text-id → fact id si le Highlight Bridge requiert lien direct.
4. **Ne pas ratchet** tant que branch-condition normalization n'est pas arbitrée.
5. **Checkpoint PASS** — poursuite vers ADR-008 amendment possible sans FigurePlan.

---

## 13. État Git

| | |
|---|---|
| Branche | `main` |
| HEAD | `d315f83e08e1bda04459cde3e80cb772c4311521` |
| origin/main | `d6dd100fbce5a3d7d83600e44ca05b31c0fcc9f4` |
| Ahead/behind | behind origin (non pushé) |
| Working tree | nombreuses modifications préexistantes + fichiers mission ci-dessus |

**Fichiers mission (distincts du bruit préexistant) :** voir §7.
