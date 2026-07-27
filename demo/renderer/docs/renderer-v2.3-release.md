# Renderer V2.3 — Release notes

> **Tag:** `renderer-v2.3.0`  
> **Verdict:** **B — RELEASE READY WITH EXTERNAL PREREQUISITE**  
> **Contract:** [renderer-v2.3-inline-formatting.md](./renderer-v2.3-inline-formatting.md)

---

## 1. Objectif

Permettre à l’apprenant d’appliquer **une mise en forme inline** sur une plage de texte sélectionnée dans les figures SVG officielles, sans modifier les fichiers sources du build ni le contenu officiel du DOM.

---

## 2. Périmètre livré

| Inclus | Exclu |
|---|---|
| Store `svg_text_formats` (IndexedDB) | Formatage des walkthrough notes |
| Chargement SVG inline async + sanitize | Formats combinés |
| SVG Text Stream + sélection + toolbar | Couleurs libres |
| Apply / split / remove / restore | Overlays graphiques V2.4 |
| Overlays learner `[data-learner="true"]` | Mutation SVG officiel |
| Persistance scope chapter × projection × element | textPath, multi-figure |

---

## 3. Architecture finale

```
Official Layer (immutable)
  └── <figure.official-visual> → <svg data-inline-ready="true">
        └── <text|tspan data-official-text-id>  … contenu officiel

Learner Layer V2.3
  └── <g class="learner-svg-formats" data-learner="true">
        └── overlays (text/tspan/rect) par FormatRecord
```

**Modules ajoutés ou étendus :**

| Module | Rôle V2.3 |
|---|---|
| `learner-store.js` | CRUD `svg_text_formats` (M1) |
| `svg-loader.js` | Fetch, sanitize, inject inline SVG (M2) |
| `inline-formatting.js` | Stream, sélection, apply, restore (M3–M4) |
| `blocks.js` | Pipeline async : loader → highlights → notes → formatting |

**Script order (`index.html`) :** … → `svg-loader.js` → `inline-formatting.js` → `blocks.js`

---

## 4. Pipeline runtime

```
blocks.render:
  1. assemble HTML
  2. await hydrate (diagrams)
  3. await LouSvgLoader.loadAllFigures
  4. await LouTextHighlights.mount
  5. await LouInlineNotes.mount
  6. await LouInlineFormatting.mount  → restore + bindSelection
```

---

## 5. APIs publiques

### LouLearnerStore (M1)

- `addSvgTextFormat(record)`
- `updateSvgTextFormat(id, partial)`
- `deleteSvgTextFormat(id)`
- `listSvgTextFormats(chapter, projection, element?)`

### LouSvgLoader (M2)

- `loadAllFigures(host, context)`
- `loadFigure(figure, context)`
- `sanitizeSvgMarkup(markup)`

### LouInlineFormatting (M3–M4)

- `mount(host, context)`
- `restore(host, context)`
- `applyFormat(host, context, selectionRange, formatIntent)`
- `removeFormat(host, context, selectionRange)`
- `buildSvgTextStream(svgRoot)` (+ helpers stream/sélection M3)

---

## 6. Modèle de données

Un **FormatRecord** = une plage `[start, end)` + un seul `FormatKind` + ancre `SvgTextRangeAnchor`.

Formats : `bold`, `italic`, `underline`, `strike`, `textColor`, `backgroundColor`.

Couleurs : palettes fermées (`SVG_TEXT_COLOR_PALETTE`, `SVG_BACKGROUND_COLOR_PALETTE`).

---

## 7. Prérequis SVG (`data-official-text-id`)

**Contrat gelé §5.5 :** tout nœud textuel formatable (`<text>` ou `<tspan>`) doit porter un attribut `data-official-text-id` unique **au sein de la figure**, émis par le **pipeline de build** — pas par le renderer.

Le renderer :

- **n’invente pas** ces identifiants ;
- **ne les dérive pas** du texte ;
- **ne les injecte pas** après chargement ;
- **n’utilise pas** l’ordre DOM comme identifiant persistant.

Comportement passif si absent : figure affichable, texte non formatable, `console.warn` depuis `LouSvgLoader._warnIfNoFormatableText`.

**Démonstration production-like :** `01-learning/chapters/cardio/234/figures/mec-oap.svg` — 14 ids conformes (patch M5 ; à reproduire dans `tools/lou-build/lib/svg.js`).

---

## 8. Comportements utilisateur

1. Sélectionner du texte SVG éligible → toolbar (B/I/U/S, swatches, Remove).
2. Choisir un format → overlay provisoire → persistance → overlay confirmé avec `data-format-id`.
3. Reload / changement d’onglet → restore depuis IndexedDB.
4. Remove sur sélection → split + suppression de la plage couverte.

---

## 9. Limites connues

### Produit volontaire (contrat)

- Une mise en forme par plage ; pas de cumul.
- Pas de formatage des notes walkthrough.
- Pas de couleur hors palette.
- Pas de textPath ; pas de sélection multi-`<text>` root.
- Pas d’overlays graphiques (V2.4).

### Dette technique renderer

- Atomicité **logique** (delete-all + rollback) — pas de transaction IDB unique cross-API.
- Records non résolubles : ignorés visuellement, conservés en store.

### Prérequis intégration externe

- **`lou-build`** doit émettre `data-official-text-id` pour chaque figure formatable. Handoff : `tools/lou-build/lib/svg.js` → `renderProcessFlowSvg()` et futurs renderers V2.

---

## 10. Tests

| Suite | Commande | Résultat attendu M5 |
|---|---|---|
| Unit tests | `npm test` | 186 tests (incl. PL-05) |
| Playwright smoke | `npm run test:smoke` | 48 tests (incl. SF-01, SF-02) |
| Complet | `npm run test:all` | Les deux ci-dessus |

Matrice détaillée : [renderer-v2.3-compliance-matrix.md](./renderer-v2.3-compliance-matrix.md).

---

## 11. Procédure de vérification manuelle

Chapitre : `?chapter=cardio/234` → onglet **Pourquoi ?** → bloc **MEC-oap**.

| # | Action | Attendu |
|---|---|---|
| 1 | Attendre `svg[data-inline-ready="true"]` | SVG inline visible |
| 2 | Sélectionner « PPC > 25 mmHg » | Toolbar formatage |
| 3 | Appliquer chaque FormatKind | Overlay learner ; officiel intact |
| 4 | Recharger | Formats restaurés |
| 5 | Remove | Overlay et record supprimés |
| 6 | Changer d’onglet puis revenir | Formats scope projection conservés |

---

## 12. Compatibilité V2.1 / V2.2

V2.3 n’altère pas : highlights prose, notes walkthrough, CaretAnchor, Personal Diagrams, stores existants. Migration IndexedDB v3→v4 additive (`svg_text_formats`).

---

## 13. Jalons et tags intermédiaires

| Jalon | Tag |
|---|---|
| M1 Store | `renderer-v2.3-store-stable` |
| M2 Loader | `renderer-v2.3-loader-stable` |
| M3 Selection | `renderer-v2.3-selection-stable` |
| M4 Formatting | `renderer-v2.3-formatting-stable` |
| **Release** | **`renderer-v2.3.0`** |

Contrat architecture : `renderer-v2.3-architecture-frozen`.

---

## 14. Déféré

- V2.4 overlays graphiques SVG
- Formatage inline des notes walkthrough
- Emphase HTML prose
- Transaction IndexedDB unifiée multi-store
