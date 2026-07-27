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

## 3. Cycle applyFormat

1. Vérifier `selectionRange`, `formatIntent`, SVG ready, `assetPath` dans `context.projection.visuals[element]`.
2. `listSvgTextFormats(chapter, projection, element)`.
3. `_computeFinalRecords` — algorithme split §6.1 + fusion adjacente compatible.
4. No-op strict si plage et format identiques → retour `{ noOp: true }`.
5. Overlay optimiste (`_renderOverlaysForFigure`) — write-before-confirm (I8).
6. `_replaceElementRecords` — delete all scope records puis re-create planifiés.
7. Re-render overlay avec IDs store définitifs.
8. En cas d'échec store : `_clearOverlayGroup` + `restore` depuis état persistant (I9).

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

Chaque fragment porte `data-format-id` et `data-learner="true"`. Contenu via `textContent` uniquement.

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

Échec partiel store :

1. Suppression overlay provisoire.
2. `restore(host, context)` depuis IndexedDB réel.
3. `console.warn` — le renderer continue.

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

Suite complète : **185 tests** verts (M1–M4 + non-régression V2.1/V2.2).

Mesure glyphe SVG simulée avec fallback en JSDOM ; smoke navigateur Playwright non requis pour ce jalon.

---

## 13. Limites connues

- Pas de transaction IndexedDB unique cross-API — atomicité logique via delete-all + rollback.
- Mesure glyphe en environnement sans API SVG native : rectangles fallback approximatifs (tests unitaires).
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
