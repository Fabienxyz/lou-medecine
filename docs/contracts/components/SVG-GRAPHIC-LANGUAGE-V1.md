# Contrat Theme SVG V1 — SVG Graphic Language

| | |
|---|---|
| **Identifiant** | `SVG-GRAPHIC-LANGUAGE-V1` |
| **Statut** | **PROPOSÉ** — contrat Theme officiel |
| **Date** | 2026-08-09 |
| **Périmètre** | Theme officiel SVG (build) — structure, invariants, consommation renderer |
| **Configuration** | [`tools/lou-build/config/svg-graphic-language-v1.yaml`](../../../tools/lou-build/config/svg-graphic-language-v1.yaml) |

---

## 1. Position dans l'architecture

Ce contrat spécifie le **Theme SVG** : le fichier de configuration unique et les invariants de consommation par les renderers build.

Il **ne définit pas** le langage graphique. Les signatures visuelles, la hiérarchie perceptive, les patterns de composition et la palette sémantique relèvent du [Visual Grammar v0.1](../../architecture/VISUAL-GRAMMAR-V0.1.md). Les frontières entre couches relèvent de [Graphical Architecture](../../architecture/GRAPHICAL-ARCHITECTURE.md).

```
Contrat 05 (sémantique VisualSpec)
        ↓
Projection Foundation (vérification report-only)
        ↓
Visual Grammar v0.1 (langage graphique)
        ↓
Contrat Theme SVG V1  ← ce document
        ↓
svg-graphic-language-v1.yaml (paramètres concrets)
        ↓
Renderers SVG (layout + sérialisation)
        ↓
Figures officielles (.svg)
```

**Subordonné à :** [ADR-008](../../adr/ADR-008-vcck-industrial-composition-pipeline.md), [Contrat 05](../05-VISUAL-GRAMMAR.md).

**Hors périmètre :** Visual Grammar, VisualSpecs, VCCK, renderer lecteur, walkthrough, Product Review éditoriale.

| Document | Rôle |
|---|---|
| [Visual Grammar v0.1](../../architecture/VISUAL-GRAMMAR-V0.1.md) | Significations visuelles, lexique, patterns |
| [Graphical Architecture](../../architecture/GRAPHICAL-ARCHITECTURE.md) | Frontières VisualSpec → Grammar → Theme → Renderer |
| **Ce contrat** | Theme : YAML, invariants, consommation |
| [`svg-graphic-language-v1.yaml`](../../../tools/lou-build/config/svg-graphic-language-v1.yaml) | Valeurs concrètes |

---

## 2. Règle centrale

> **Aucun renderer SVG ne DOIT contenir de constante graphique en dur lorsque cette constante relève du Theme.**

Les paramètres communs — couleurs, typographie mesurée, épaisseurs, rayons, espacements, markers — **DOIVENT** être lus depuis :

[`tools/lou-build/config/svg-graphic-language-v1.yaml`](../../../tools/lou-build/config/svg-graphic-language-v1.yaml)

**Objectif produit :** après Product Review graphique, un changement de couleur, rayon, police ou espacement **DOIT** pouvoir se faire en modifiant uniquement ce fichier, sans toucher aux VisualSpecs, au Visual Grammar ni aux règles VCCK.

---

## 3. Vocabulaire canonique des node kinds

Les clés de `node_kinds` **DOIVENT** utiliser le vocabulaire canonique (forme hyphenated du VisualSpec). Référence : [`kind-vocabulary.js`](../../../tools/lou-build/lib/kind-vocabulary.js), [KIND-VOCABULARY-MIGRATION.md](../../architecture/KIND-VOCABULARY-MIGRATION.md).

| Groupe | Kinds |
|---|---|
| **Visual Grammar v0.1** | `entry`, `action`, `test`, `decision`, `conclusion`, `dead-end` |
| **Chain / causal-graph** | `state`, `event`, `response` |
| **Extensions visualSpec v0.2** | `continuation`, `human-review`, `resume` |

Les renderers **NE DOIVENT PAS** appliquer d'alias implicites entre kinds. Chaque kind canonique **DOIT** posséder une entrée `node_kinds` explicite.

### Signature `action` (G3)

**`action` est un kind canonique** avec entrée Theme dédiée : fill `#fffbeb`, stroke `#d97706`, trait plein (famille opérationnelle — aligné review variante B). Distinct de `conclusion`.

### Formes sémantiques (Visual Grammar)

Les formes (`decision` = losange) **NE SONT PAS** dans le Theme YAML. Le loader applique `GRAMMAR_NODE_SHAPES` depuis Visual Grammar v0.1.

---

## 4. Structure du fichier YAML

Le Theme **DOIT** exposer les sections suivantes (loader : [`svg-graphic-language.js`](../../../tools/lou-build/lib/svg-graphic-language.js)) :

| Section | Contenu Theme |
|---|---|
| `canvas` | Fond de surface |
| `typography` | Pile de police, tailles, graisses, couleurs de texte par rôle typographique |
| `colors` | Palette concrète (accent, connecteur, surfaces, texte) |
| `stroke` | Épaisseurs de trait par contexte |
| `radius` | Rayons de bordure par élément |
| `dash` | Motifs de pointillé |
| `opacity` | Opacités (backdrop branche, dividers comparaison, etc.) |
| `connectors` | Markers SVG (dimensions, paths, fill) |
| `spacing` | Marges, paddings, gaps |
| `node_kinds` | Mapping kind → fill / stroke / stroke-width / dash / shape |
| `families` | Profils de paramètres par famille de composition |
| `density` | Seuils numériques indicatifs (revue graphique) |

**Règle :** les sections **DOIVENT** rester plates (pas d'héritage de tokens). Les profils `families.*` surchargent les constantes communes pour une famille donnée.

**Langage graphique :** la signification de chaque kind et la forme sémantique (`decision` = losange, etc.) **NE SONT PAS** définies ici → [Visual Grammar v0.1 §4](../../architecture/VISUAL-GRAMMAR-V0.1.md).

---

## 5. Invariants Theme

### 5.1 Surface et accessibilité SVG

| Règle | Formulation |
|---|---|
| S1 | Le canvas **DOIT** lire `canvas.background` du Theme. |
| S2 | Le SVG **DOIT** exposer `role="img"`, un `<title>` et, si applicable, un `<desc>`. |
| S3 | Le SVG **DOIT** porter `data-primitive`, `data-family` (si applicable) et `data-element`. |
| S4 | Aucun renderer **NE DOIT** introduire couleur, icône ou motif absent du Theme sans mise à jour de ce contrat et du YAML. |

### 5.2 Typographie

| Règle | Formulation |
|---|---|
| TY1 | La pile de police **DOIT** être lue depuis `typography.font_stack`. |
| TY2 | Tailles, graisses, interlignes et couleurs **DOIVENT** être lues depuis `typography.*` ou `families.*.title|label|…`. |
| TY3 | Les seuils `max_label_lines` et `max_title_lines` **DOIVENT** être lus depuis `density` ou `families.*`. |

**Hiérarchie perceptive, dominance du titre, graisse des labels :** intentions graphiques → [Visual Grammar v0.1 §3 et §6](../../architecture/VISUAL-GRAMMAR-V0.1.md).

### 5.3 Connecteurs et markers

| Règle | Formulation |
|---|---|
| CO1 | Couleurs, épaisseurs et markers **DOIVENT** être lus depuis `colors.connector`, `stroke.*` et `connectors.*`. |
| CO2 | Les renderers **NE DOIVENT PAS** dupliquer les définitions de markers en dur. |

**Rôle cognitif des connecteurs** (flux, branche, comparaison) → [Visual Grammar v0.1 §7](../../architecture/VISUAL-GRAMMAR-V0.1.md).

### 5.4 Styles par kind

| Règle | Formulation |
|---|---|
| NK1 | Chaque kind déclaré dans une VisualSpec **DOIT** résoudre un style via `node_kinds.<kind>`. |
| NK2 | Le renderer **NE DOIT PAS** réécrire, fusionner ou substituer un kind vers un autre. |
| NK3 | Les valeurs fill / stroke / dash **DOIVENT** provenir du Theme. Les **formes** (`decision` = losange) **DOIVENT** être appliquées par le loader depuis Visual Grammar — jamais depuis le YAML. |

### 5.5 Profils famille

| Règle | Formulation |
|---|---|
| F1 | Chaque famille VCCK reconnue **DOIT** disposer d'un profil dans `families.*`. |
| F2 | Les clés `theme_*` **DOIVENT** porter les paramètres graphiques ; les clés `layout_*` les paramètres moteur (cible G4). |

**Patterns de composition, kinds autorisés par famille, layout conceptuel :** → [Visual Grammar v0.1 §9](../../architecture/VISUAL-GRAMMAR-V0.1.md) et VCCK.

---

## 6. Consommation par les renderers

| Exigence | Formulation |
|---|---|
| R1 | Les renderers **DOIVENT** charger le Theme via `loadSvgGraphicLanguage()` — jamais de duplication locale des constantes Theme. |
| R2 | La résolution kind → style **DOIT** passer par `getDecisionNodeKindStyle()` / `getW1DependentSequenceNodeStyle()` ou équivalent centralisé. |
| R3 | Le renderer **NE DOIT PAS** inférer un `kind` à partir du libellé, de la position ou du contenu médical. |
| R4 | Les markers SVG **DOIVENT** être émis via `markerSvg()` à partir de `connectors` du Theme. |
| R5 | Toute constante graphique encore en dur dans un renderer **DOIT** être externalisée vers le Theme (chantier G4). |

**Loader de référence :** [`svg-graphic-language.js`](../../../tools/lou-build/lib/svg-graphic-language.js).

---

## 7. Corpus de validation

Le Theme a été calibré sur les six visuels de production du chapitre 234 :

| Visuel | Famille | Primitive |
|---|---|---|
| **N09** | — | `decision-algorithm` |
| **N13-2** | `dependent-sequence` | `decision-algorithm` |
| **N15-1** | `dependent-sequence` | `decision-algorithm` |
| **N18-1** | `dependent-sequence` | `decision-algorithm` |
| **N20-1** | `two-pole` | `comparison-matrix` |
| **N21-1** | `chain` | `causal-graph` |

Toute modification du YAML **DOIT** être validée par une passe Product Review sur ce corpus minimum (grille éditoriale — hors périmètre de ce contrat).

---

## 8. Ce que ce contrat n'est pas

| Exclu | Document de référence |
|---|---|
| Langage graphique (signatures, hiérarchie, patterns) | [Visual Grammar v0.1](../../architecture/VISUAL-GRAMMAR-V0.1.md) |
| Frontières entre couches | [Graphical Architecture](../../architecture/GRAPHICAL-ARCHITECTURE.md) |
| Sémantique VisualSpec | [Contrat 05](../05-VISUAL-GRAMMAR.md) |
| Système de thèmes multiples / mode sombre | Hors périmètre V1 |
| Layout engine / géométrie de composition | VCCK + renderers |

---

## 9. Évolution

| Version | Changement autorisé sans ADR |
|---|---|
| V1.x | Paramètres dans le YAML ; clarifications de ce contrat Theme |
| V2 | Rupture de structure YAML ou nouvelle famille Theme → ADR ou amendement |

---

## 10. Tableau des responsabilités

| Couche | Responsabilité | Document / artefact |
|---|---|---|
| **Visual Grammar** | Significations visuelles : signatures par `kind`, hiérarchie perceptive, lexique, patterns, connecteurs (intentions) | [VISUAL-GRAMMAR-V0.1.md](../../architecture/VISUAL-GRAMMAR-V0.1.md) |
| **Contrat Theme SVG V1** | Invariants Theme, structure YAML, consommation renderer, vocabulaire `kind` | **Ce document** |
| **Theme YAML** | Valeurs concrètes : couleurs, px, espacements, `node_kinds`, profils `families` | [`svg-graphic-language-v1.yaml`](../../../tools/lou-build/config/svg-graphic-language-v1.yaml) |
| **Renderer** | Layout géométrique, sérialisation SVG, lecture Theme sans inférence | `tools/lou-build/lib/` (visual-decision-svg, w1-serialize, etc.) |

---

## 11. Références

| Document | Lien |
|---|---|
| Theme YAML | [`tools/lou-build/config/svg-graphic-language-v1.yaml`](../../../tools/lou-build/config/svg-graphic-language-v1.yaml) |
| Graphical Architecture | [`docs/architecture/GRAPHICAL-ARCHITECTURE.md`](../../architecture/GRAPHICAL-ARCHITECTURE.md) |
| Visual Grammar v0.1 | [`docs/architecture/VISUAL-GRAMMAR-V0.1.md`](../../architecture/VISUAL-GRAMMAR-V0.1.md) |
| Kind vocabulary G1 | [`docs/architecture/KIND-VOCABULARY-MIGRATION.md`](../../architecture/KIND-VOCABULARY-MIGRATION.md) |
| Contrat 05 | [`docs/contracts/05-VISUAL-GRAMMAR.md`](../05-VISUAL-GRAMMAR.md) |
| ADR-008 | [`docs/adr/ADR-008-vcck-industrial-composition-pipeline.md`](../../adr/ADR-008-vcck-industrial-composition-pipeline.md) |
| Loader Theme | [`tools/lou-build/lib/svg-graphic-language.js`](../../../tools/lou-build/lib/svg-graphic-language.js) |

---

*Contrat Theme SVG V1 — paramètres et consommation uniquement. Langage graphique → Visual Grammar v0.1. Architecture → Graphical Architecture.*
