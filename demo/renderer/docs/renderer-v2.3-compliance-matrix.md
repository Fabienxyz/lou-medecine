# Renderer V2.3 — Compliance matrix

> **Release tag:** `renderer-v2.3.0`  
> **Contract:** [renderer-v2.3-inline-formatting.md](./renderer-v2.3-inline-formatting.md) (`renderer-v2.3-architecture-frozen`)

Concise mapping from frozen requirements to implementation and tests. Status **OK** = implemented and covered; **EXT** = external prerequisite outside renderer.

| Exigence (contrat) | Module | API / fonction | Tests unitaires | Playwright | Statut | Limite |
|---|---|---|---|---|---|---|
| Une mise en forme par plage | `inline-formatting.js` | `_computeFinalRecords`, `applyFormat` | SP-01…10, IF-03 | SF-01 | OK | — |
| Palettes fermées couleurs | `learner-store.js` | `addSvgTextFormat` validation | SF-12, SF-13 | SF-01 | OK | — |
| StreamPosition UTF-16 | `inline-formatting.js` | `buildSvgTextStream`, `streamPositionFromPoint` | TS-03, TS-04 | — | OK | — |
| Normalisation exact/prefix/suffix | `inline-formatting.js` | `normalizeStreamText` | TS, LF, SF-14 | — | OK | — |
| Split sans chevauchement | `inline-formatting.js` | `_computeFinalRecords` | SP-01…10 | SF-01 (partiel) | OK | — |
| Fusion adjacente compatible | `inline-formatting.js` | `_mergeAdjacentRecords` | SP-08 | — | OK | — |
| Scope chapter × projection × element | `learner-store.js`, `inline-formatting.js` | `listSvgTextFormats`, `_replaceElementRecords` | SF-05, lifecycle M4 | SF-01 | OK | — |
| Loader async avant mount | `blocks.js`, `svg-loader.js` | `loadAllFigures`, pipeline §4.3 | PL-01…04 | — | OK | — |
| Sanitization SVG inbound | `svg-loader.js` | `sanitizeSvgMarkup` | ER-01…05 | — | OK | — |
| Sélection éligible / rejets | `inline-formatting.js` | `selectionToStreamRange`, toolbar | LF-01…06, TS | — | OK | — |
| Overlay learner distinct | `inline-formatting.js` | `_renderOverlaysForFigure` | IF-01, ER-02 | SF-01, SF-02 | OK | — |
| Restore idempotent | `inline-formatting.js` | `restore`, `mount` | RS-01…04 | SF-01 | OK | — |
| Rollback store reject | `inline-formatting.js` | `applyFormat` catch | ER-01 | — | OK | Atomicité logique |
| Immutabilité SVG officiel | `inline-formatting.js` | overlays `[data-learner]` only | IF-01, ER-02 | SF-01, SF-02 | OK | — |
| `data-official-text-id` requis | build + stream | `buildSvgTextStream` §5.4 | TS-07 | SF-01 | EXT | Générateur `lou-build` |
| SVG sans ids → non formatable | `svg-loader.js` | `_warnIfNoFormatableText` | PL-05 | — | OK | warn passif |
| Fallback `<img>` → pas formatage | `inline-formatting.js` | `_officialInlineSvg` | LF-02, RS-03 | — | OK | — |
| Write-before-confirm | `inline-formatting.js` | overlay provisoire puis confirmé | ER-01 | — | OK | — |
| Pas de format combiné | `learner-store.js` | record `format` scalaire | SF-03, IF | — | OK | Produit volontaire |
| Pas de notes formatting | — | aucune API | non-régression V2.2 | V2.1/V2.2 smoke | OK | V2.3+ milestone |
| Lifecycle mount idempotent | `inline-formatting.js` | `bindSelection`, `mount` | mount tests | LC-* (V2.1) | OK | — |
| IndexedDB CRUD formats | `learner-store.js` | `add/update/delete/listSvgTextFormat` | SF-01…16 | SF-01 | OK | — |
| Migration DB v3→v4 | `learner-store.js` | `open()` upgrade | SF-02 | ST-* (storage) | OK | — |
| Non-régression V2.1 highlights | `text-highlights.js` | — | renderer tests | 01–08 smoke | OK | — |
| Non-régression V2.2 notes | `inline-notes.js` | — | walkthrough tests | — | OK | — |

## Légende statut

| Statut | Signification |
|---|---|
| OK | Implémenté dans le renderer ; tests associés verts |
| EXT | Prérequis pipeline build / générateur SVG (hors périmètre renderer seul) |

## Verdict release (M5)

**B — RELEASE READY WITH EXTERNAL PREREQUISITE**

Le renderer V2.3 satisfait le contrat gelé. L’utilisation sur **toutes** les figures publiées exige que `lou-build` émette `data-official-text-id` de façon déterministe (`tools/lou-build/lib/svg.js`). La figure `mec-oap.svg` du chapitre démo est conforme manuellement pour validation production-like.
