# Renderer V2.3 — Apply, split, overlay and restore (M4)

> **Status:** Implemented — full apply / remove / restore cycle  
> **Tag:** `renderer-v2.3-formatting-stable`  
> **Module:** `inline-formatting.js` → `window.LouInlineFormatting`  
> **Parent:** [renderer-v2.3-inline-formatting.md](./renderer-v2.3-inline-formatting.md) §6–§7  
> **Baseline selection:** `renderer-v2.3-selection-stable`

This document describes **only what is implemented** at milestone M4.

---

## 1. Objectif du jalon

Relier sélection, toolbar, store IndexedDB et overlays learner pour produire le cycle complet :

```
sélection SVG → intention de format → split → persistance → overlay → restore idempotent
```

Hors scope M4 : formatage des notes, formats combinés, couleurs libres, active recall, overlays graphiques V2.4, mutation du SVG officiel.

---

## 2. API publique

| Method | Signature | Behaviour |
|---|---|---|
| `mount` | `(host, context) → Promise<void>` | `restore` puis `bindSelection` (§4.6 contrat) |
| `restore` | `(host, context) → Promise<void>` | Reconstruit overlays depuis IndexedDB |
| `applyFormat` | `(host, context, selectionRange, formatIntent) → Promise<result>` | Split + store + overlay |
| `removeFormat` | `(host, context, selectionRange) → Promise<result>` | Split sans nouveau format |
| `dismissToolbar` | `(clearSelection?)` | Ferme toolbar ; réactive les boutons |

`formatIntent` : `{ format, style? }` — un seul `FormatKind` par record.

Formats supportés : `bold`, `italic`, `underline`, `strike`, `textColor`, `backgroundColor`, `remove` (interne à `removeFormat`).

---

## 3. Cycle applyFormat — ordre exact

| Étape | Action | Overlay |
|---|---|---|
| 1 | Valider `selectionRange`, SVG ready, `assetPath` | — |
| 2 | `listSvgTextFormats(chapter, projection, element)` | — |
| 3 | `_computeFinalRecords` (split + fusion) en mémoire | — |
| 4 | No-op strict → `{ noOp: true }` | — |
| 5 | **`_renderOverlaysForFigure(plan.records)`** | **Provisoire** — sans `data-format-id` (IDs store absents) |
| 6 | `_replaceElementRecords` (delete-all → recreate IndexedDB) | — |
| 7 | **`_renderOverlaysForFigure(result.records)`** | **Confirmé** — avec `data-format-id` persistés |
| 8 | Échec store → `_clearOverlayGroup` + `restore` | Rollback depuis IndexedDB réel |

**Overlay provisoire vs confirmé**

- **Provisoire** (étape 5) : rendu optimiste write-before-confirm (I8). Fragments learner sans `data-format-id` tant que l’ID store n’existe pas.
- **Confirmé** (étape 7) : re-render complet depuis les records relus après écriture store ; chaque fragment porte `data-format-id=<id>`.

En cas d’échec entre 5 et 7 : le provisoire est retiré, `restore` ne recrée que ce qui existe réellement en IndexedDB — **aucun** `data-format-id="undefined"`, **aucun** groupe `learner-svg-formats` vide.

---

## 4. Algorithme de split (§6.1)

Pour une nouvelle plage `N = [nStart, nEnd)` et chaque record `R = [rStart, rEnd)` du même scope :

| Cas | Action |
|---|---|
| Aucun chevauchement | `R` conservé |
| `N` couvre totalement `R` | `R` supprimé |
| `N` chevauche la droite de `R` | Conserver `[rStart, nStart)` |
| `N` chevauche la gauche de `R` | Conserver `[nEnd, rEnd)` |
| `N` strictement incluse dans `R` | Deux fragments `[rStart, nStart)` et `[nEnd, rEnd)` |
| `R` et `N` identiques (même format) | No-op strict |
| `R` et `N` identiques (format différent) | Remplacement |

Fragments recalculent `exact`, `prefix`, `suffix` via le stream courant.

---

## 5. Fusion adjacente

Deux records adjacents fusionnent **uniquement** si :

- même `chapter`, `projection`, `element`
- même `FormatKind` et même valeur couleur le cas échéant
- `end` du premier === `start` du second

Pas de fusion à travers un caractère non formaté. Pas de fusion entre formats différents.

---

## 6. Persistance

API exclusive : `addSvgTextFormat`, `deleteSvgTextFormat`, `listSvgTextFormats`.

Scope : `chapter × projection × element`.

Stratégie par figure : delete-all puis recreate (atomicité logique avec rollback en mémoire).

`learner-store.js` inchangé depuis M1.

---

## 7. Overlays SVG

Structure :

```xml
<svg data-inline="true" data-inline-ready="true">
  <!-- contenu officiel intact -->
  <g class="learner-svg-formats" data-learner="true" pointer-events="none">
    <!-- fragments overlay par record -->
  </g>
</svg>
```

| FormatKind | Rendu learner |
|---|---|
| `bold` | `<text>`/`<tspan>` overlay `font-weight="bold"` |
| `italic` | `font-style="italic"` |
| `underline` | `text-decoration="underline"` |
| `strike` | `text-decoration="line-through"` |
| `textColor` | overlay `fill` = palette |
| `backgroundColor` | `<rect>` mesuré derrière la plage |

Ordre de rendu : backgrounds d'abord, puis formats texte.

Chaque fragment confirmé porte `data-format-id` (ID store) et `data-learner="true"`. Les fragments provisoires n’ont pas de `data-format-id`. Contenu via `textContent` uniquement.

Record non résoluble → skip silencieux (overlay absent, record IDB conservé).

---

## 8. Restore

`restore(host, context)` :

1. Pour chaque `.official-visual[data-element]` non fallback.
2. Skip si pas de `svg[data-inline-ready="true"]`.
3. `listSvgTextFormats(chapter, projection, element)`.
4. Supprime l'ancien `g.learner-svg-formats`.
5. Reconstruit overlays valides.

Propriétés : idempotent, ordre `(start.position, id)`, tolérant aux ancres invalides.

---

## 9. Toolbar → apply

Au clic format / swatch / Remove :

1. Copie de l'ancre normalisée depuis `_selectionContext` (avant dismiss).
2. Toolbar désactivée (`_writing`).
3. `applyFormat` ou `removeFormat`.
4. `dismissToolbar` en finally.

`_lastFormatIntent` conservé pour diagnostic.

---

## 10. Rollback

Échec partiel store (entre overlay provisoire et confirmation) :

1. `_clearOverlayGroup(svgRoot)` — retire tout overlay provisoire ou partiellement confirmé.
2. `restore(host, context)` — relit IndexedDB et reconstruit uniquement les records persistés.
3. `console.warn` — le renderer continue.

Invariants post-rollback :

- Aucun `[data-format-id="undefined"]`
- Aucun `g.learner-svg-formats` orphelin vide (si zero record scope, pas de groupe)
- DOM overlay = état IndexedDB relu

Pas de mutation du SVG officiel lors du rollback.

---

## 11. Cas ignorés

| Cas | Comportement |
|---|---|
| Figure fallback | Pas d'écriture ni restore |
| SVG sans `data-inline-ready` | Skip |
| `textPath`, multi-text root, learner layer | Pas de toolbar / pas d'apply |
| Ancre invalide au restore | Skip silencieux |
| Remove sur zone non formatée | No-op |

---

## 12. Tests

| Fichier | Groupes |
|---|---|
| `test/svg-inline-formatting.test.js` | TS, LF, toolbar apply (M3 + connexion M4) |
| `test/svg-inline-formatting-m4.test.js` | SP, IF, RS, ER, lifecycle, immutabilité |
| `test/smoke/09-svg-formatting.spec.mjs` | **Playwright** — cycle navigateur Chromium |

### Couverture Playwright (`09-svg-formatting.spec.mjs`)

Fixture : `test/smoke/fixtures/mec-oap-formatting.svg` (même figure `MEC-oap`, injectée via route Playwright — prérequis `data-official-text-id` pour le smoke).

| ID | Scénario |
|---|---|
| SF-01 | backgroundColor : sélection native → toolbar → overlay → mesures SVG natives → reload → restore → remove → second reload |
| SF-02 | bold : overlay texte + APIs SVG natives |

Vérifications navigateur : immutabilité `textContent`/attributs officiels, `x/y/width/height > 0` sur `<rect>`, rejet du fallback JSDOM (`x=0,y=0,width=8×n`).

Suite unitaire Node : **185 tests**.

---

## 13. Limites connues

- Pas de transaction IndexedDB unique cross-API — atomicité logique via delete-all + rollback.
- Mesure glyphe en JSDOM : fallback approximatif (`8px`/caractère) — **non représentatif** ; validé en Chromium via Playwright SF-01/SF-02.
- Figure source `figures/mec-oap.svg` du build : `data-official-text-id` requis par le pipeline build (fixture smoke uniquement pour l’instant).
- Pas de fusion inter-formats ; pas de formats combinés (contrat gelé).
- V2.4 overlays graphiques hors scope.

---

## 14. Non-régression

Inchangés depuis jalons stables :

- `learner-store.js` (M1)
- `svg-loader.js` (M2)
- Stream / sélection M3 (hors connexion apply)
- `text-highlights.js`, `inline-notes.js`, `caret-anchor.js`
- Contrat gelé `renderer-v2.3-inline-formatting.md`
