# Kind vocabulary — registre canonique (clôturé)

| | |
|---|---|
| **Type** | Documentation d'architecture — vocabulaire `kind` |
| **Statut** | **Clôturé** — incorporé dans Theme v1 et Visual Grammar v0.1 |
| **Date** | 2026-08-09 |
| **Référence** | [Graphical Architecture](./GRAPHICAL-ARCHITECTURE.md) · [Visual Grammar v0.1](./VISUAL-GRAMMAR-V0.1.md) |

---

## Objectif

Aligner Visual Grammar, Theme YAML, contrat SVG Graphic Language et renderers sur un **vocabulaire `kind` unique**, sans modifier les VisualSpecs officielles ni le rendu SVG du corpus de production.

---

## Vocabulaire canonique

### Lexique Visual Grammar v0.1 (actif)

| `kind` | Statut | Familles / primitives |
|---|---|---|
| `entry` | Canonique | decision-algorithm, dependent-sequence |
| `action` | Canonique — **signature Theme propre (G3)** | decision-algorithm, dependent-sequence |
| `test` | Canonique | decision-algorithm, dependent-sequence |
| `decision` | Canonique | decision-algorithm |
| `conclusion` | Canonique | decision-algorithm, dependent-sequence |
| `dead-end` | Canonique | decision-algorithm |

### Lexique chain / causal-graph (actif)

| `kind` | Statut | Familles / primitives |
|---|---|---|
| `state` | Canonique | chain, causal-graph |
| `event` | Canonique | chain, causal-graph |
| `response` | Canonique | chain, causal-graph |

### Extensions visualSpec v0.2 (actif, hors lexique VG v0.1 fermé)

| `kind` | Statut | Notes |
|---|---|---|
| `continuation` | Extension — entrée Theme dédiée | Paramètres = `test` (voie surveillance, spec n22) |
| `human-review` | Extension | Entrée Theme dédiée |
| `resume` | Extension | Entrée Theme dédiée |

---

## Tableau avant / après

| `kind` | Avant (Theme YAML) | Avant (renderers) | Après |
|---|---|---|---|
| `entry` | `entry` | direct | `entry` |
| `action` | **absent** | alias → `conclusion` (decision) ; fallback → `test` (W1) | `action` (Theme dédié ; G1 = paramètres `conclusion`) |
| `test` | `test` | direct | `test` |
| `decision` | `decision` | direct | `decision` |
| `conclusion` | `conclusion` | direct | `conclusion` |
| `dead-end` | `dead_end` (snake_case) | normalisation `dead-end` → `dead_end` | `dead-end` (hyphenated) |
| `continuation` | **absent** | alias → `test` | `continuation` (G1 = paramètres `test`) |
| `human-review` | `human_review` | normalisation | `human-review` |
| `resume` | `resume` | direct | `resume` |
| `state` | `state` | direct | `state` |
| `event` | `event` | direct | `event` |
| `response` | `response` | direct | `response` |

### Clés YAML retirées

- `dead_end` → renommé `dead-end`
- `human_review` → renommé `human-review`

---

## Module de référence

[`tools/lou-build/lib/kind-vocabulary.js`](../../tools/lou-build/lib/kind-vocabulary.js) — source de vérité code pour les ensembles canoniques.

---

## G3 — Alignement Theme (2026-08-09)

### `action` — signature propre

| Paramètre | Valeur Theme | Référence review |
|---|---|---|
| fill | `#fffbeb` | Famille opérationnelle — variante B |
| stroke | `#d97706` | Accent chaud |
| stroke_width | `2` | Trait plein |

**Plus d'équivalence avec `conclusion`.** Le kind reste canonique et distinct sémantiquement et visuellement.

### Formes sémantiques retirées du Theme

`shape: diamond` retiré de `node_kinds.decision`. Appliqué par le loader depuis Visual Grammar (`GRAMMAR_NODE_SHAPES`).

### Kinds extensions v0.2 — décisions G3

| Kind | Décision | Justification |
|---|---|---|
| `continuation` | **Entrée Theme dédiée** | Utilisé dans spec n22 ; paramètres identiques à `test` (voie non-alerte) — duplication explicite, pas alias |
| `human-review` | **Entrée Theme dédiée** | Style orange distinct ; spec n22 |
| `resume` | **Entrée Theme dédiée** | Style vert pointillé ; spec n22 |

### Structure `families.*` (G3.4)

Préfixes explicites dans le YAML :

| Préfixe | Responsabilité | Cible migration |
|---|---|---|
| `theme_*` | Paramètres graphiques Theme | Reste dans YAML |
| `layout_*` | Géométrie moteur (gaps, min/max width) | G4 → renderer |

Métadonnées `profile: complex` retirées (non consommées).

---

## Statut transitoire de `action` (G1 — clos en G3)

**Historique G1 :** `action` reprenait provisoirement les paramètres de `conclusion`. **G3 clôt cette transitoire** — voir section G3 ci-dessus.

Même logique documentée pour `continuation` : duplication explicite de paramètres `test`, pas équivalence architecturale entre kinds.

---

## Compatibilité rendu (G1 + G3)

- **Corpus officiel chapitre 234 (N09–N21)** : aucun nœud `action` → rendu inchangé (snapshots 8/8 PASS, N09 hash identique).
- **n22 (w2a)** : `action` affiche désormais la signature opérationnelle G3 (attendu).

Aucune VisualSpec officielle modifiée.

---

## Hors périmètre (chantiers suivants)

- ~~**G3 — Purification du Theme**~~ → **réalisé**
- **G4 — Externalisation layout** : déplacer `families.*.layout_*` et constantes loader vers renderer
- Externalisation des constantes renderers restantes (`subitemTitleToSeparator`, etc.)

---

*G1 — vocabulaire uniquement. Paramètres graphiques inchangés sur le corpus de production.*
