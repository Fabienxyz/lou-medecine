# Visual Grammar Runtime

| | |
|---|---|
| **Type** | Documentation d'architecture — module exécutable |
| **Statut** | G4 — runtime minimal gelé (Option A) |
| **Date** | 2026-08-09 |
| **Référence** | [Visual Grammar v0.1](./VISUAL-GRAMMAR-V0.1.md) · [Graphical Architecture](./GRAPHICAL-ARCHITECTURE.md) · [Projection Foundation](./PROJECTION-FOUNDATION.md) |

---

## Position

Le **Visual Grammar Runtime** est la projection exécutable minimale du Visual Grammar v0.1. Il répond aux questions sémantiques dont les renderers ont besoin, sans dupliquer le document d'architecture ni empiéter sur les autres couches.

```
Visual Grammar v0.1 (document)
  ↓ projection fidèle
Visual Grammar Runtime (module JS)
  ↓ consommé par
Theme loader + renderers (matérialisation)
```

| Couche | Responsabilité |
|---|---|
| **Visual Grammar (doc)** | Langage graphique prescriptif — forme, trait, hiérarchie perceptive |
| **Visual Grammar Runtime** | Tables et fonctions sémantiques dérivées du doc (`nodeShape`, `hierarchyLevel`, …) |
| **Theme (`svg-graphic-language-v1.yaml`)** | Valeurs mesurables — couleurs, épaisseurs, dash patterns, espacements |
| **Renderer** | Layout + sérialisation SVG — aucune inférence de rôle |
| **VCCK / VisualSpec** | Composition, validation, contenu éditorial |
| **Projection Foundation** | Vérification report-only de la projection VisualSpec → artefact ([doc](./PROJECTION-FOUNDATION.md)) |

---

## Ce que le runtime n'est pas

Le runtime **ne doit jamais devenir** :

- un renderer ;
- un moteur de layout ;
- un moteur de composition ;
- un Theme ;
- un moteur de Product Language.

Il ne contient **aucune** valeur graphique mesurable (hex, px, coordonnées), **aucune** logique SVG, **aucune** heuristique, **aucun** texte médical.

---

## API exposée

Module : [`tools/lou-build/lib/visual-grammar-runtime.js`](../../tools/lou-build/lib/visual-grammar-runtime.js)

| Fonction | Question sémantique |
|---|---|
| `nodeShape(kind)` | `rect` ou `diamond` |
| `hierarchyLevel(kind)` | Niveau perçu 2–6 (VG §3) |
| `strokeIntent(kind)` | `solid`, `solid-reinforced`, `dashed`, `dashed-attenuated` |
| `chromaticFamily(kind)` | Famille chromatique qualitative |
| `cognitiveRole(kind)` | Identifiant de rôle cognitif |
| `isDecision(kind)` | Bifurcation algorithmique |
| `isTerminal(kind)` | `conclusion` ou `dead-end` |
| `isStructural(kind)` | `entry`, `decision`, `conclusion` |
| `isDashedStroke(kind)` | Trait pointillé (test, dead-end) |
| `isReinforcedStroke(kind)` | Trait renforcé (decision, conclusion) |
| `grammarCatalog()` | Catalogue read-only des signatures (kind → copie) |
| `compositionRules(scope)` | Règles de composition VG §8 (copie read-only) |
| `branchingPattern(fromKind, outgoingCount)` | Pattern de branchement (§8.2, §8.5, §8.10) |
| `BRANCHING_PATTERNS` | Identifiants canoniques des patterns |
| `isVerticalDescentFanOut(pattern)` / `isDecisionLateralFanOut(pattern)` | Prédicats sur pattern |
| `branchLabelAnchorMode(pattern)` | Ancrage libellé de branche (§8.7) |
| `supportsMultiOutputFan(fromKind)` / `supportsDecisionLateralSplit(fromKind)` | Rôles signature, pas comparaison de kind |
| `calloutPlacementPriority()` | Priorités placement callout / fragment seuil (§8.3, §8.9) |
| `branchLabelIsNotNode()` / `requiresOrthogonalBranchGeometry()` | Règles §8.6–§8.7 |
| `decisionLateralSeparationClass()` | Classe qualitative de séparation latérale (§8.5) |
| `requiresStrictTextContainment(kind)` | Losange — contenu strict (§8.1) |

Le vocabulaire `kind` canonique reste déclaré dans [`kind-vocabulary.js`](../../tools/lou-build/lib/kind-vocabulary.js) ; le runtime vérifie au chargement la cohérence bidirectionnelle avec `GRAMMAR_SIGNATURES`.

---

## Règles de composition (VG §8)

Le runtime projette également les **Composition Rules** :

- losanges : contenu strict, padding généreux, proportions légèrement larges (§8.1) ;
- multi-sorties depuis kind `test` (`role.multiOutputFan`) : éventail vertical (§8.2) ;
- multi-sorties depuis kind `decision` (`role.lateralSplit`) : corridor latéral (§8.5) ;
- branches : géométrie orthogonale, une transition par connecteur (§8.6) ;
- libellés de branche : subordonnés, ancrage cible ou segment (§8.7) ;
- callouts / fragments de seuil : non-occlusion, priorités de placement (§8.3, §8.9) ;
- flux : descente verticale prioritaire (§8.10 — partiellement délégué au renderer).

Les renderers **interrogent** ces règles ; ils **calculent** la géométrie avec les paramètres Theme via `compositionLayoutMetrics(cfg)` (mapping qualitatif → mesurable, côté renderer uniquement).

---

## Kind inconnu — comportement strict

Le runtime **ne fallback jamais** silencieusement vers `entry` ou une autre signature.

| Situation | Comportement |
|---|---|
| `kind` absent de `GRAMMAR_SIGNATURES` | `VisualGrammarUnknownKindError` — message incluant le kind fautif |
| Désalignement vocabulaire ↔ signatures au chargement | `Error` explicite (kind manquant ou entry orpheline) |
| Sonde de vocabulaire (`isVisualGrammarKind`, …) sur kind inconnu | `false` (pas d'inférence grammaticale) |

**Justification :** un kind non répertorié signale une dérive entre VisualSpec, vocabulaire ou Theme — le masquer produirait un rendu incorrect sans signal. Les renderers ne reçoivent que des kinds validés en amont ; l'exception protège le développement et les tests.

Exception dédiée : `VisualGrammarUnknownKindError` (exportée par le module).

---

## Source de vérité unique

Toutes les réponses sémantiques proviennent de `GRAMMAR_SIGNATURES` :

- forme, hiérarchie, trait, famille chromatique → champs directs ;
- `isDecision`, `isTerminal`, `isStructural` → flags `role.*` dans la signature ;
- `isDashedStroke`, `isReinforcedStroke` → dérivés de `strokeIntent` ;
- `isVisualGrammarKind`, `isChainKind`, `isDecisionExtendedKind` → champ `vocabulary`.

Aucune comparaison `kind === "…"` en dehors de la table.

---

## API — alias déprécié

| Nom actuel | Statut |
|---|---|
| `grammarCatalog()` | **Préféré** — catalogue read-only des signatures |
| `listGrammarSignatures()` | Alias interne de `listVisualGrammarSignatures()` |

Le vocabulaire `kind` reste centralisé dans [`kind-vocabulary.js`](../../tools/lou-build/lib/kind-vocabulary.js).

---

## Connaissances déplacées depuis les renderers

| Avant (emplacement) | Après (runtime) |
|---|---|
| `GRAMMAR_NODE_SHAPES` dans `svg-graphic-language.js` | `nodeShape(kind)` |
| `style.shape === "diamond"` dans `visual-decision-svg.js` | `nodeShape(kind) === "diamond"` |
| `fromNode?.kind === "decision"` (routage connecteur) | `isDecision(fromNode?.kind)` |
| `shape: "diamond"` / `shape: "rect"` dans `role-graphic-language.js` VARIANTS | Forme héritée du Theme loader → runtime (plus de duplication dans l'overlay review) |

**Non déplacé (hors périmètre renderer sémantique graphique) :**

- Validations VCCK (`w1-contracts.js`, `signature-analyzer.js`) — règles de composition, pas signatures visuelles ;
- `visual-spec-v02-lotb.js` — validation de spec ;
- Paramètres Theme YAML — inchangés.

---

## Consommateurs

| Module | Usage |
|---|---|
| `svg-graphic-language.js` | `nodeShape(kind)` lors de `materializeNodeKindStyle` |
| `visual-decision-svg.js` | `nodeShape`, `isDecision` pour géométrie et routage |
| `role-graphic-language.js` | Ne surcharge plus la forme — overlay couleurs uniquement |

---

## Validation

- Tests unitaires : `tools/lou-build/test/visual-grammar-runtime.test.js`
- Régression visuelle : `node scripts/vcck-verify-snapshots.mjs` (8/8 hashes inchangés)
- Tests existants : `kind-vocabulary.test.js`, `svg-graphic-language.test.js`

---

## Évolution

Toute modification du Visual Grammar v0.1 (document) doit être reflétée dans le runtime avant adaptation du Theme ou des renderers. Le runtime reste **volontairement petit** : une table de signatures + fonctions de requête, sans logique dérivée complexe.

**Statut gelé (2026-08-09)** — polish final : strictness, source de vérité unique, documentation interne. Extensions futures via évolution documentaire VG puis mise à jour de `GRAMMAR_SIGNATURES` uniquement.
