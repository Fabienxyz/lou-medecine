# Renderer V2.3 — SVG loader and async pipeline (M2)

> **Status:** Implemented — official SVG loading only  
> **Tag:** `renderer-v2.3-loader-stable`  
> **Module:** `svg-loader.js` → `window.LouSvgLoader`  
> **Parent:** [renderer-v2.3-inline-formatting.md](./renderer-v2.3-inline-formatting.md) §4  
> **Baseline store:** `renderer-v2.3-store-stable`

This document describes **only what is implemented** at milestone M2. No SVG Text Stream, no selection, no formatting, no restore.

---

## 1. Objectif du jalon

Matérialiser les **Official Visuals** publiés en DOM inline async, avec sanitization et fallback `<img>`, et ordonner le pipeline `blocks.render` conformément au contrat gelé §4.3.

Ce jalon **n'introduit aucune fonctionnalité de formatage**. V2.1 highlights et V2.2 walkthrough notes restent inchangés fonctionnellement.

---

## 2. Séparation des responsabilités

```
svg-loader.js           ← M2 (this document)
  fetch, sanitize, inject, fallback

blocks.js               ← orchestration pipeline async
  _officialVisual shell + await loadAllFigures

inline-formatting.js    ← absent (M3+)
learner-store.js        ← inchangé depuis M1
```

`LouSvgLoader` ne dépend pas du LearnerStore, des highlights, des notes, ni des Personal Diagrams.

---

## 3. API publique

| Method | Signature | Behaviour |
|---|---|---|
| `loadAllFigures` | `(host, context) → Promise<{ success, fallback, skipped }>` | Charge toutes les `.official-visual[data-element]` en parallèle ; ne rejette pas globalement |
| `loadFigure` | `(figure, context) → Promise<"ready"\|"fallback"\|"skipped">` | Charge une figure ; idempotent |
| `sanitizeSvgMarkup` | `(markup) → SVGElement` | Parse + sanitize ; rejette si parse/root invalide |

---

## 4. Pipeline async (`blocks.render`)

```
1. assemble(html) → fragment
2. host.innerHTML = ""; append fragment
3. await hydrate(host, context)              // Personal Diagrams
4. await LouSvgLoader.loadAllFigures(host, context)
5. finally:
     await LouTextHighlights.mount(host, context)
     await LouInlineNotes.mount(host, context)
```

**Invariant :** étape 4 **terminée** (succès ou fallback par figure) **avant** étape 5.

`_officialVisual` produit une **coque `<figure class="official-visual">` vide** — plus de `<img>` sync.

---

## 5. Sanitization inbound (§7.4)

**Éléments autorisés :** `svg`, `g`, `text`, `tspan`, `rect`, `line`, `path`, `circle`, `ellipse`, `polygon`, `polyline`, `defs`, `use`

**Supprimés :** `script`, `foreignObject`, `iframe`, `embed`, éléments hors whitelist

**Attributs :** suppression de tout `on*` ; rejet de `javascript:` ; `use` href interne `#id` uniquement (sinon élément retiré)

**Injection :** jamais de `innerHTML` non sanitizé — `DOMParser` → sanitize in-place → `importNode`

---

## 6. États DOM

| État | Marqueurs | Contenu |
|---|---|---|
| **Ready** | `svg[data-inline="true"][data-inline-ready="true"]` | SVG inline sanitizé ; `role="img"` + `aria-label` depuis manifest |
| **Fallback** | `figure[data-inline-fallback="true"]` | `<img>` avec src manifest + alt manifest |
| **Skipped** | — | Figure sans chemin manifest dans la projection active |

**Idempotence :** second appel sur figure ready ou fallback → no-op, pas de double fetch ni duplication DOM.

**Échec :** pas de SVG partiel — fallback remplace entièrement le contenu de la figure.

---

## 7. Gestion des erreurs

- Échec fetch / parse / sanitize sur **une** figure → fallback local + `console.warn`
- Les autres figures continuent
- `loadAllFigures` attend **toutes** les figures (`Promise.all`)
- Retour `{ success, fallback, skipped }` pour diagnostic
- Mount V2.1/V2.2 exécuté même si toutes les figures échouent

---

## 8. Intégration scripts

`index.html` :

```html
<script src="svg-loader.js"></script>
<script src="blocks.js"></script>
```

---

## 9. Stratégie de tests

Fichier : `demo/renderer/test/svg-loader.test.js`

| ID | Scenario |
|---|---|
| PL-01 | Valid SVG fetched, sanitized, injected inline |
| PL-02 | Slow fetch — learner layers mount only after loader completes |
| PL-03 | Fetch failure → img fallback |
| PL-04 | Multiple figures — individual failure does not block others |
| ER-01 | `<script>` stripped |
| ER-02 | `foreignObject` stripped |
| ER-03 | `on*` attributes removed |
| ER-04 | `javascript:` rejected |
| ER-05 | `use` href internal only |

Suite complète : **142 tests** (129 + 13 loader).

---

## 10. Volontairement absent (M3+)

| Absent | Milestone |
|---|---|
| `inline-formatting.js` | M3–M4 |
| SVG Text Stream | M3 |
| Sélection / toolbar | M3 |
| Overlay / restore / split | M4 |
| Appels `svg_text_formats` store | M4 |
| `LouInlineFormatting.mount` hook | M4 |

---

## 11. Limites connues (M2)

| Limite | Note |
|---|---|
| Pas de consommation store formats | Store M1 callable en test uniquement |
| `data-official-text-id` build pipeline | Prérequis externe pour formatage futur |
| Zoom / responsive CSS | Milestone SVG experience ultérieur |
