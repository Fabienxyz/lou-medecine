# Renderer V2.3 — SVG text formats store (M1)

> **Status:** Implemented — storage layer only  
> **Tag:** `renderer-v2.3-store-stable`  
> **Module:** `learner-store.js` → `window.LouLearnerStore` (extended)  
> **Parent:** [architecture-principles.md](./architecture-principles.md)  
> **Contract:** [renderer-v2.3-inline-formatting.md](./renderer-v2.3-inline-formatting.md) §3, §7.1

This document describes **only what is implemented** at milestone M1. No renderer UI, no SVG loader, no inline formatting module.

---

## 1. Objectif du jalon

Introduire la **persistance IndexedDB** des formats inline SVG (`svg_text_formats`) avant toute UI, tout DOM SVG et tout module `inline-formatting.js` / `svg-loader.js`.

Ce jalon **n'introduit aucune fonctionnalité utilisateur**. Le renderer se comporte exactement comme V2.2.

---

## 2. Séparation stockage / renderer

```
learner-store.js          ← M1 (this document)
  svg_text_formats CRUD + validation

blocks.js                 ← unchanged
text-highlights.js        ← unchanged
inline-notes.js           ← unchanged
caret-anchor.js           ← unchanged
svg-loader.js             ← absent (M2)
inline-formatting.js      ← absent (M3+)
```

---

## 3. Architecture IndexedDB

| Property | Value |
|---|---|
| Database | `lou-learner` (inchangé) |
| `DB_VERSION` | **4** (était 3) |
| Store | `svg_text_formats` |
| Key | `id` — `keyPath: "id"`, `autoIncrement: true` |
| Index | `chapter_projection` → `[chapter, projection]` |
| Index | `chapter_projection_element` → `[chapter, projection, element]` |

Stores existants inchangés : `personal_diagrams`, `text_annotations`, `walkthrough_notes`.

---

## 4. Migration v3 → v4

Exécutée dans `onupgradeneeded` :

| Step | Action |
|---|---|
| 1 | Créer `svg_text_formats` si absent |
| 2 | Créer les deux index composés |
| 3 | Laisser tous les autres stores inchangés |

Aucune migration de données depuis d'autres stores.

---

## 5. FormatRecord

Structure persistée par `addSvgTextFormat` :

| Field | Type | Set by | Description |
|---|---|---|---|
| `id` | number | IndexedDB | Auto-generated key |
| `chapter` | string | caller | Chapter id |
| `projection` | string | caller | Manifest projection id |
| `element` | string | caller | Blueprint element id (figure parent) |
| `assetPath` | string | caller | Manifest-relative SVG path |
| `format` | FormatKind | caller | `bold` \| `italic` \| `underline` \| `strike` \| `textColor` \| `backgroundColor` |
| `style` | object | caller / store | Required for color formats only |
| `anchor` | SvgTextRangeAnchor | caller / store | Normalized on write |
| `created` | string | store | ISO-8601 at insert |
| `updated` | string | store | ISO-8601 — absent at create ; set by `updateSvgTextFormat` |

### SvgTextRangeAnchor

| Field | Validation |
|---|---|
| `type` | Must be `"SvgTextRangeAnchor"` |
| `start.position` | Integer ≥ 0 |
| `end.position` | Integer ≥ 0, exclusive bound |
| `exact` | Non-empty after `normalizeStreamText` (§5.7 contract) |
| `prefix` | String, max 32 characters |
| `suffix` | String, max 32 characters |

Half-open range invariant : `start.position < end.position`.

### Palettes (fermées)

- **Texte :** `#c0392b`, `#2980b9`, `#27ae60`, `#8e44ad`, `#d35400`, `#1a1a1a`
- **Fond :** `#fff3bf`, `#d3f9d8`, `#cfe8ff`, `#ffe0ef`, `#ffe8cc`

---

## 6. API publique (nouveau)

| Method | Signature | Behaviour |
|---|---|---|
| `addSvgTextFormat` | `(record) → Promise<id>` | Validate → insert ; set `created` |
| `updateSvgTextFormat` | `(id, partial) → Promise<void>` | Get → merge → validate → put ; set `updated` |
| `deleteSvgTextFormat` | `(id) → Promise<void>` | Delete by id |
| `listSvgTextFormats` | `(chapter, projection[, element]) → Promise<FormatRecord[]>` | Filter by chapter + projection ; optional element filter |

Validation rejects :

- Invalid `format` kind
- Missing required fields
- Invalid anchor type or range
- Empty `exact` after normalization
- `prefix` / `suffix` longer than 32 characters
- Color formats without palette-compliant `style`
- `style` on non-color formats

---

## 7. Invariants du store

| ID | Invariant |
|---|---|
| SF-S1 | Formats dans un store **séparé** des autres Learner Layers |
| SF-S2 | Toute lecture filtre par `(chapter, projection)` ; filtre `element` optionnel |
| SF-S3 | `created` immuable après insertion |
| SF-S4 | `updated` absent à la création ; présent après update réussie |
| SF-S5 | Aucun code renderer n'appelle ces méthodes (M1) |
| SF-S6 | V2.1 + V2.2 — API et comportement **inchangés** |

---

## 8. Stratégie de tests

Fichier : `demo/renderer/test/svg-text-formats-store.test.js`

| ID | Scenario |
|---|---|
| SF-01 | DB v4 creates store + compound indexes |
| SF-02 | Migration v3 → v4 preserves existing data |
| SF-03 | `addSvgTextFormat` persists FormatRecord shape |
| SF-04 | List filters chapter + projection |
| SF-05 | List filters by element |
| SF-06 | `updateSvgTextFormat` sets `updated` |
| SF-07 | `deleteSvgTextFormat` |
| SF-08 | Persistence across reconnect |
| SF-09 | Rejects invalid format |
| SF-10 | Rejects empty exact after normalization |
| SF-11 | Rejects invalid stream range |
| SF-12 | Palette textColor accepted / out-of-palette rejected |
| SF-13 | Palette backgroundColor / missing style rejected |
| SF-14 | Normalizes exact whitespace on write |
| SF-15 | Rejects prefix/suffix > 32 chars |
| SF-16 | Update rejects unknown id |

Suite complète : **129 tests** (113 existants + 16 store).

---

## 9. Volontairement absent (M2+)

| Absent | Milestone |
|---|---|
| `svg-loader.js` | M2 |
| `inline-formatting.js` | M3–M4 |
| Toolbar, sélection, overlay, restore | M3–M4 |
| Pipeline async dans `blocks.js` | M2 |
| Consommation store au render | M4 |
