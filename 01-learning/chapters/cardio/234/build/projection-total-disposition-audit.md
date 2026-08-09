# Total Disposition — Audit Report (REPORT-ONLY)

**Mission:** TOTAL-DISPOSITION  
**Generated:** 2026-08-09  
**Corpus:** Golden 234 (`figures/` × `build/visual-specs/`)

---

## 1. Diagnostic avant Total Disposition

| Mécanisme | État avant |
|---|---|
| `consumes` (families.json) | Déclare chemins visualSpec **matérialisés** — implicitement MATERIALIZED |
| `classifyFactDisposition()` | Heuristique locale (PRIMARY/SECONDARY units, KNOWN_NON_PROJECTED) |
| Registre VCCK | 4 familles avec `consumes` ; aucune disposition explicite DERIVED/DISCARDED |
| Projection Verification | Multiplicité + dispositions **inférées** ; pas de comparaison déclaration/réalité |
| Fact types non couverts | `threshold-*`, `edge`, `relation-label` — UNKNOWN ou heuristique |

**Classification A/B/C/D :**

- **A — Déclaré explicitement :** `consumes` pour chain, dependent-sequence, two-pole, flat-concurrent
- **B — Inféré par heuristique :** DERIVED (low_band_meaning), DISCARDED (interpretation), MATERIALIZED (primary units)
- **C — Inconnu :** fact types sans consumes ni heuristique (N21/chain)
- **D — Implicitement perdu :** branch conditions reformatées (N09), subitems tronqués

---

## 2. Modèle retenu

Extension minimale du registre VCCK — clé **`fact_dispositions`** par famille :

```json
"fact_dispositions": {
  "node": { "disposition": "MATERIALIZED" },
  "threshold-fragment-low-band-meaning": {
    "disposition": "DERIVED",
    "derivedFrom": "node"
  },
  "threshold-fragment-interpretation": {
    "disposition": "DISCARDED",
    "discardReason": "OUT_OF_SCOPE_FOR_CAPABILITY"
  }
}
```

Module `total-disposition.js` : chargement, fusion multi-famille, comparaison déclaré vs observé, matrice d'audit.

**Justification simplicité :** réutilise le registre existant ; pas de FigurePlan ; pas de nouvelle couche ; REPORT-ONLY.

---

## 3. Discard reasons et frontière DERIVED / DISCARDED

| Raison | Usage |
|---|---|
| `OUT_OF_SCOPE_FOR_CAPABILITY` | Champ spec présent mais non projeté par design (ex. interpretation) |
| `NON_LEARNER_VISIBLE` | Topologie structurelle (edge, relation-label sans texte learner) |
| `LEGACY_UNSUPPORTED` | Réservé migration — non utilisé dans ce corpus |

**Frontière :** si l'information est portée par un autre fact canonique → **DERIVED** (avec `derivedFrom`). Si volontairement absent sans source → **DISCARDED**. `REPRESENTED_ELSEWHERE` **non retenu** — chevaucherait DERIVED.

---

## 4. Statistiques corpus

| Métrique | Valeur |
|---|---|
| Materialized (observé) | 46 |
| Derived | 1 |
| Discarded | 0 |
| Unknown | 8 |
| Disposition mismatches | 13 (+ 5 undeclared N21) |
| Duplicated | 6 |
| Missing | 8 |
| Orphan | 9 |

**Discard rate par capability :**

| Famille | declaredTotal | declaredDiscarded | discardRate |
|---|---|---|---|
| skip-level-branch | 6 | 1 | 16.7% |
| embedded-fragment | 11 | 2 | 18.2% |
| dependent-sequence | 6 | 1 | 16.7% |
| two-pole | 5 | 1 | 20.0% |
| chain | 0 | 0 | — (non migré) |

---

## 5. N09 — résultat détaillé

**Familles :** skip-level-branch + embedded-fragment  
**Faits :** 23 déclarés, 13 conformes, **10 mismatches**

| Type | Problème | Déclaré | Observé |
|---|---|---|---|
| branch (BNP/NT-proBNP) | condition absente (reformatée) | MATERIALIZED | UNKNOWN / missing |
| threshold-cutoff ×2 | duplication branch + callout | MATERIALIZED | duplicated |
| threshold-fragment-scale-line ×2 | duplication | MATERIALIZED | duplicated |
| threshold-fragment-context | duplication | MATERIALIZED | duplicated |
| low_band_meaning | — | DERIVED(node) | DERIVED ✓ |
| interpretation | — | DISCARDED | DISCARDED ✓ |

---

## 6. N13 / N20

**N13-2** (dependent-sequence) : 0 duplication ; 1 mismatch préexistant (branch « SAMU / hospitalisation » missing).  
**N20-1** (two-pole) : 0 missing ; 1 mismatch préexistant (pole « DAI » duplicated).  
**N18-1** : 0 mismatch — référence stable.

---

## 7. Proposition amendement ADR-008 (non activé)

**Remplacer §6.2 ligne 223 :**

> Un champ présent dans la visualSpec mais absent de `consumes` n'est pas une violation.

**Par (formulation cible pour Blocking Gate futur) :**

> Chaque type de fait learner-visible applicable à une capacité QUALIFIED doit posséder une entrée explicite dans `fact_dispositions` (MATERIALIZED, DERIVED avec source, ou DISCARDED avec raison fermée). Un fait sans disposition déclarée produit un signal UNKNOWN en mode migration. En mode qualification bloquante, l'absence de disposition déclarée constitue une violation de qualification. La clé `consumes` reste le contrat de matérialisation fidèle pour les champs MATERIALIZED.

**Non modifié dans cette mission** — mode report-only préservé.

---

*Rapport machine-readable : `projection-total-disposition-report.json`*
