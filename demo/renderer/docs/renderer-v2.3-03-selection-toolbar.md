# Renderer V2.3 — SVG Text Stream, selection and toolbar (M3)

> **Status:** Implemented — stream + selection + toolbar intent only  
> **Tag:** `renderer-v2.3-selection-stable`  
> **Module:** `inline-formatting.js` → `window.LouInlineFormatting`  
> **Parent:** [renderer-v2.3-inline-formatting.md](./renderer-v2.3-inline-formatting.md) §5–§7  
> **Baseline loader:** `renderer-v2.3-loader-stable`

This document describes **only what is implemented** at milestone M3. No store writes, no overlays, no restore, no split.

---

## 1. Objectif du jalon

Implémenter le **SVG Text Stream normatif**, la **sélection SVG → positions stream**, et la **toolbar d'intention de format** — sans persistance ni mutation du SVG officiel.

---

## 2. API publique

| Method | Signature | Behaviour |
|---|---|---|
| `mount` | `(host, context) → Promise<void>` | Bind sélection + toolbar ; pas de restore M3 |
| `buildSvgTextStream` | `(svgRoot) → StreamData \| null` | Stream + table de mapping |
| `selectionToStreamRange` | `(selection, svgRoot) → RangeData \| null` | Sélection native → ancre temporaire |
| `rangeToStreamRange` | `(range, svgRoot) → RangeData \| null` | Idem depuis `Range` |
| `streamPositionFromPoint` | `(streamData, node, offset) → number \| null` | Local → global |
| `streamPointFromPosition` | `(streamData, position) → { node, offset } \| null` | Global → local |
| `normalizeStreamText` | `(value) → string` | Normalisation §5.7 |
| `dismissToolbar` | `()` | Ferme toolbar + efface sélection |

État testable interne : `_lastFormatIntent` (dernier choix toolbar — pas de store).

---

## 3. SVG Text Stream

Construit sur `<svg data-inline="true"[data-inline-ready="true"]>` dans une figure non fallback.

| Règle | Implémentation |
|---|---|
| Parcours | `TreeWalker` `SHOW_TEXT`, document order |
| Éligibilité | Parent `<text>` ou `<tspan>` avec `data-official-text-id` |
| Exclusions | `[data-learner="true"]`, `textPath`, sans id |
| Positions | UTF-16 code units — `stream.length` |
| Mapping | `WeakMap` textNode → `{ start, end }` |

Retour :

```javascript
{ stream, length, nodeOffsets, svgRoot }
```

---

## 4. Sélection valide / rejets

| Cas | Résultat |
|---|---|
| Single text / multi-`<tspan>` même `<text>` root | Accepté |
| Collapsed | Rejet silencieux |
| Hors SVG inline ready | Rejet |
| Figure `data-inline-fallback` | Rejet |
| Multi-`<text>` root | Rejet |
| `textPath` | Rejet |
| `[data-learner="true"]` | Rejet |
| Sans `data-official-text-id` | Rejet |
| Positions non résolues | Rejet |

Ancre temporaire produite :

```javascript
{
  type: "SvgTextRangeAnchor",
  start: { position },
  end: { position },
  exact,   // normalisé §5.7
  prefix,  // ≤ 32 car. stream brut
  suffix   // ≤ 32 car. stream brut
}
```

**Non persistée** en M3.

---

## 5. Toolbar

Affichée uniquement pour sélection SVG valide.

| Contrôle | Formats |
|---|---|
| B / I / U / S | `bold`, `italic`, `underline`, `strike` |
| Swatches texte | `LouLearnerStore.SVG_TEXT_COLOR_PALETTE` |
| Swatches fond | `LouLearnerStore.SVG_BACKGROUND_COLOR_PALETTE` |

Clic format → `_lastFormatIntent` → toolbar fermée. **Aucun** appel store, **aucun** overlay.

CSS : `.svg-format-toolbar` dans `styles.css`.

---

## 6. Lifecycle

- `mount` idempotent — un seul `_boundHost`
- Listeners document (Escape, mousedown extérieur) attachés une fois
- Toolbar disparaît : sélection invalide, clic extérieur, Escape, remount host
- **Aucune mutation** `textContent` / attributs SVG officiels

---

## 7. Intégration pipeline

```
await LouSvgLoader.loadAllFigures
finally:
  await LouTextHighlights.mount
  await LouInlineNotes.mount
  await LouInlineFormatting.mount   ← M3
```

Script : `inline-formatting.js` après `svg-loader.js`, avant `blocks.js`.

---

## 8. Tests

Fichier : `demo/renderer/test/svg-inline-formatting.test.js`

| Groupe | IDs |
|---|---|
| Stream | TS-01 … TS-07 |
| Sélection | LF-03 … LF-07, collapsed |
| Ancre | AN-01, AN-02 |
| Toolbar | LF-01, LF-02, intent, palette, idempotent mount |
| Pipeline | mount order loader → highlights → notes → formatting |

Suite : **164 tests** (142 + 22 M3).

---

## 9. Volontairement absent (M4)

| Absent | Milestone |
|---|---|
| `addSvgTextFormat` / store writes | M4 |
| Overlay `learner-svg-formats` | M4 |
| Split / restore | M4 |
| Remove format | M4 |
