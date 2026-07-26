# Renderer V2 — Technology Strategy

> Parent: [README.md](./README.md)  
> Architecture: [04-TARGET_ARCHITECTURE.md](./04-TARGET_ARCHITECTURE.md)

---

## Priorities (ordered)

1. **Simplicity** — minimal moving parts, readable by one maintainer
2. **Maintainability** — conventions over configuration; match existing repo patterns
3. **Zero commercial dependency** — no paid APIs, no SaaS lock-in
4. **Long-term sustainability** — browser-native where practical; MIT/Apache dependencies only
5. **Reversibility** — choices that can be undone without medical content migration

---

## Recommended stack

| Layer | Choice | Rationale |
|---|---|---|
| **Application** | Vanilla JavaScript (ES modules when adopted) | Generation 3 proves viability; no framework tax on 350-chapter static app |
| **Markup** | Static HTML shell | No SSR needed; chapters fetched as static artefacts |
| **Markdown** | `marked` (vendored) | Already integrated; offline; MIT license |
| **Styling** | CSS custom properties + single stylesheet | Matches `design-system.md` token pattern; no preprocessor required |
| **Storage** | IndexedDB via native API | Already used; no wrapper library needed |
| **Text anchoring** | `dom-anchor-text-quote` | MIT; W3C Web Annotation selectors; battle-tested |
| **Testing** | Node built-in test runner + jsdom | Already in `demo/renderer/package.json` |
| **Serving (dev)** | `python3 -m http.server` | Zero config; any static server works |
| **Serving (prod)** | Static host (nginx, GitHub Pages, S3) | Renderer is static files |

---

## Explicitly rejected (for now)

| Option | Why rejected |
|---|---|
| **React / Vue / Svelte** | Overhead for read-mostly app; global state minimal; reversible later if complexity demands |
| **Vite / Webpack bundler** | Not required until ES module split justifies it; vendored marked works |
| **TypeScript** | Optional future adoption; JS sufficient for current team size |
| **ProseMirror / Tiptap** | Editor frameworks — wrong model for read-only + overlay |
| **Hypothesis full client** | Collaborative assumptions; too heavy |
| **Firebase / Supabase** | Commercial/cloud dependency; learner data local-first |
| **PDF.js** | Not rendering PDFs — rendering markdown + SVG |
| **D3 in renderer** | Layout belongs in build pipeline, not browser |

---

## Dependency justification

### Runtime dependencies (browser)

| Package | License | Purpose | Alternatives considered |
|---|---|---|---|
| `marked` | MIT | Markdown → HTML | markdown-it (heavier API); remark (pipeline overhead) |
| `dom-anchor-text-quote` | MIT | TextQuoteSelector anchoring | Manual Range serialization (fragile); Annotator.js (dead) |

**Total runtime dependencies: 2.** Both MIT.

### Dev dependencies

| Package | License | Purpose |
|---|---|---|
| `jsdom` | MIT | DOM simulation in tests |
| `fake-indexeddb` | MIT | IndexedDB in tests |

### Browser-native APIs (no dependency)

| API | Use |
|---|---|
| `fetch` | Load manifest, projections, traceability |
| `IndexedDB` | Learner layer persistence |
| `Selection` / `Range` | Text selection capture |
| CSS Custom Highlight API | Highlight rendering without DOM mutation |
| `URL` / `URLSearchParams` | Chapter routing |
| `crypto.randomUUID()` | Annotation IDs |

---

## Trade-offs

### Vanilla JS vs framework

| | Vanilla JS | Framework |
|---|---|---|
| Bundle size | Minimal | +40–150 KB |
| Learning curve for contributors | DOM APIs | Framework conventions |
| Component isolation | Manual modules | Built-in |
| Long-term risk | Manual discipline | Framework churn |

**Decision:** Stay vanilla through V2.1–V2.3. Revisit if projection type proliferation creates unmaintainable UI state.

### CSS Custom Highlights vs DOM wrappers

| | Custom Highlights | DOM `<mark>` wrappers |
|---|---|---|
| DOM mutation | None | Inserts nodes |
| Browser support | Chrome 105+, Safari 17.2+, Firefox pending | Universal |
| Emphasis types | Background colour only | Bold, italic, strike |

**Decision:** Dual approach — Custom Highlights for background; lightweight overlay spans for emphasis types on unsupported browsers.

### `<img>` vs inline SVG for figures

| | `<img>` | Inline SVG |
|---|---|---|
| DOM access to nodes | No | Yes |
| Caching | Browser default | In document |
| Overlay annotations | Stacked overlay SVG | Direct overlay |
| Simplicity | Higher | Lower |

**Decision:** Default `<img>`; inline SVG opt-in when overlay or zoom requires viewBox access.

### IndexedDB vs file-based learner storage

| | IndexedDB | Sidecar JSON files |
|---|---|---|
| Setup | Browser only | Requires export/import UX |
| Git separation | Automatic | Automatic if outside repo |
| Query | Indexed | Manual parse |

**Decision:** IndexedDB (contract allows reversible storage mechanism; IndexedDB is simplest for browser app).

---

## Security considerations

| Concern | Mitigation |
|---|---|
| XSS from markdown | `marked` sanitisation options; no raw HTML in projections by convention |
| Path traversal in chapter param | Sanitise `chapter` URL param — existing `config.js` discipline |
| Blob URL leaks | Revoke object URLs on tab change — existing `blocks.js` pattern |
| Third-party script | No CDN; vendored libs only |

---

## Accessibility technology

- Semantic HTML from markdown
- ARIA on toolbar and source panel
- Focus management in modals
- `prefers-reduced-motion` media query
- Manifest alt text — never renderer-generated

---

## Internationalisation

UI chrome is French (existing labels). Medical content language follows projections (French). Renderer i18n infrastructure is **not** a V2 priority — single learner, single locale.

---

## When to introduce a bundler

Triggers for Vite or similar:

- ES module count exceeds ~10 files with circular import risk
- TypeScript adoption decided
- CSS modules or PostCSS required
- Tree-shaking needed for optional features

Until then, script load order in `index.html` remains sufficient.

---

## Alignment with build pipeline technology

The browser renderer and `tools/lou-build` share **no runtime code**. They may share:

- Design tokens (documented in `design-system.md`, not imported as code)
- Test fixture manifests
- Chapter ID conventions

SVG generation stays in Node.js build tooling — never in the browser.
