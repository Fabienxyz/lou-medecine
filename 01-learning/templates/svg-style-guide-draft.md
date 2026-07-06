# Lou Learning Companion — Visual Design System (Draft)

> Extracted from the legacy prototype `demo/legacy/221/`.
>
> This document describes the **visual language only**. It is intended to become the permanent reference for learner-facing assets, including future SVG diagrams.

---

## 1. Overall design philosophy

The prototype follows a **calm, editorial, Apple-influenced** aesthetic adapted for medical learning.

Core principles:

- **Comprehension before memorisation** — the interface should feel like reading a well-designed article, not a clinical dashboard or exam prep cram sheet.
- **One idea at a time** — generous whitespace, a single central reading column, and clear sectional breaks prevent cognitive overload.
- **Soft structure, strong hierarchy** — boundaries are suggested through spacing, light borders, and tinted surfaces rather than heavy chrome or dense UI controls.
- **Warm neutrality with a single accent** — the palette is mostly grey and white; one confident blue carries all interactive and emphasis weight.
- **Approachable seriousness** — emoji and plain language signal friendliness; typography and spacing preserve credibility.
- **Progressive disclosure** — chapter context lives in a rich header; learning content unfolds in tabs with gentle transitions between views.

The overall impression: a **premium study companion** — clean, readable, reassuring, and focused.

---

## 2. Typography

### Typeface

- **Primary family:** Inter
- **Weights used:** 400 (regular), 500 (medium), 500 on meta values), 600 (semibold), 700 (bold)
- **Fallback stack (in diagrams):** Inter → system-ui → -apple-system → sans-serif
- **Rendering:** Antialiased text on all surfaces

### Typographic character

- Body copy is **comfortable and airy** (`line-height: 1.65`).
- Headings use **tight negative letter-spacing** (−0.02em on large titles, −0.01em on section headings) for a modern editorial feel.
- Labels and metadata use **positive letter-spacing** (+0.03em to +0.05em) with uppercase transformation for quiet authority.
- No decorative or serif typefaces. No all-caps body text.

### Type scale

| Role | Size | Weight | Colour | Notes |
|------|------|--------|--------|-------|
| Specialty title (h1) | 28px (24px mobile) | 700 | `#1d1d1f` | Often prefixed with emoji |
| Chapter title | 26px (22px mobile) | 700 | `#1d1d1f` | Second-level headline |
| Section heading (h2) | 19px | 600 | `#1d1d1f` | Tab content sections |
| Body text | 15px (inherits) | 400 | `#3a3a3c` | Primary reading size |
| Tab labels | 14px | 600 | varies | Includes emoji |
| Chapter line / meta value | 15px | 500 | grey / dark | Secondary information |
| Eyebrow / progression steps | 13px | 600 / 500 | `#86868b` | Navigation context |
| Philosophy tagline | 12px | 400 | `#aeaeb2` | Centred, subdued |
| Uppercase labels | 11px | 600 | `#86868b` | Badge, meta labels, progression title |
| Table header cells | 12px | 600 | `#6e6e73` | Uppercase |

### Content typography conventions

- Section titles in tab content **repeat the tab emoji** (e.g. `📖 Histoire`, `❓ Pourquoi ?`).
- Subsections use plain `h2` headings without emoji.
- Blockquotes use **italic** body at the same size as paragraphs.
- Lists use standard bullets or ordered numerals with comfortable item spacing.

---

## 3. Colour palette

### Foundation

| Name | Hex | Usage |
|------|-----|-------|
| Page background | `#f5f7fb` | Outer canvas behind the main card |
| Surface white | `#ffffff` | Main card, buttons, diagram canvas |
| Primary text | `#1d1d1f` | Headings, active states, key values |
| Body text | `#3a3a3c` | Paragraphs, list items, table cells |
| Secondary text | `#86868b` | Eyebrows, inactive progression, muted labels |
| Tertiary text | `#aeaeb2` | Philosophy line, lowest-priority copy |
| Mid grey | `#6e6e73` | Table header text |
| Button label grey | `#48484a` | Secondary button text |

### Accent — primary blue

| Name | Hex | Usage |
|------|-----|-------|
| Brand / active blue | `#2563eb` | Active tab, primary button, blockquote accent, diagram emphasis border |
| Blue hover | `#1d4ed8` | Primary button hover |
| Blue tint — objectives | `#f0f6ff` | Objectives card background |
| Blue tint — blockquote | `#f5f9ff` | Blockquote background |
| Blue tint — diagram highlight | `#edf5ff` | Key diagram stage (SVG) |

### Neutral surfaces and borders

| Name | Hex | Usage |
|------|-----|-------|
| Inactive tab | `#f2f2f2` | Default tab background |
| Badge background | `#f2f2f7` | Preview badge |
| Button hover | `#f5f5f7` | Secondary button hover |
| Table header bg | `#f9f9fb` | Table thead |
| Divider strong | `#eee` | Header bottom, tab bar bottom |
| Divider soft | `#f0f0f0` | Header internal sections |
| Border default | `#e5e5ea` | Tables, buttons, horizontal rules |
| Border light | `#ebebeb` | Footer navigation separator |
| Row divider | `#f0f0f2` | Table body row borders |

### Semantic tints (diagrams and future assets)

Used in the overview SVG to encode **process stage** without alarm:

| Name | Hex | Meaning |
|------|-----|---------|
| Neutral card | `#f5f7fa` | Context, summary, outcome grouping |
| Early / stable green | `#dcfce7` | Initial or favourable states |
| Progression amber | `#fef3c7` / `#fde7c7` | Intermediate inflammatory steps |
| Danger red | `#fee2e2` | Rupture, thrombosis, acute harm |
| Arrow grey | `#9ca3af` | Flow connectors |
| SVG border grey | `#e5e7eb` | Card outlines, badge outlines |
| Step circle | `#f3f4f6` | Numbered step indicators |

### Emoji status colours (progression)

- Active step: 🟢 (green circle emoji)
- Inactive steps: ⚪ (white circle emoji)

These are **not hex colours** but form part of the visual vocabulary for learning journey status.

---

## 4. Card styles

### Main application card

- Full-width white surface centred on the page background
- Large corner radius (18px desktop, 14px mobile)
- Single soft drop shadow (see §6)
- `overflow: hidden` — interior sections align flush to card edges

### Objectives card (header)

- Tinted blue background (`#f0f6ff`)
- 14px corner radius
- Internal padding ~24–28px
- No border; colour alone defines the block
- Bulleted objectives with checkmark prefix (`✓`) instead of native list markers

### Content cards (diagram wrapper)

- White background on white/content area
- 18px corner radius
- Minimal padding (8px) acting as a frame around embedded diagrams
- No visible border; diagram provides its own internal structure

### Diagram internal cards (SVG convention)

- Rounded rectangles, **16px radius** for standard steps
- **12px radius** for smaller outcome tiles
- **18px radius** for inline badge/pill elements inside cards
- 1px stroke `#e5e7eb`; highlight card uses **2.5px `#2563eb`** stroke
- Optional soft drop shadow on all diagram cards
- Step number in small grey circle (11px radius) at card edge

### Tables as cards

- Full-width rounded container (12px radius)
- 1px outer border `#e5e5ea`
- Header row on `#f9f9fb` with uppercase labels
- Body rows separated by hairline `#f0f0f2` dividers
- No zebra striping; whitespace and header tint provide structure

### Blockquotes as cards

- Left accent bar: 4px solid `#2563eb`
- Background `#f5f9ff`
- Asymmetric radius: 0 on left, 12px on right
- Generous vertical margin (32px) to isolate key ideas

---

## 5. Borders and corner radius

### Radius scale

| Token | Value | Usage |
|-------|-------|-------|
| Pill | 999px | Preview badge |
| XL | 18px | Main container, diagram frame |
| L | 16px | SVG process cards |
| M | 14px | Objectives block; mobile container |
| S | 12px | Tabs, buttons, tables, blockquote, SVG outcome tiles |
| Badge pill | 18px height / full radius | Inline diagram tags |

### Border weights

- **Hairline (1px):** section dividers, table borders, inactive controls, SVG card outlines
- **Accent (4px):** blockquote left bar only
- **Emphasis (2.5px):** key diagram stage outline in brand blue
- **Flow connectors (3px):** SVG vertical/horizontal arrows

### Border colour rule

Prefer `#eee`, `#f0f0f0`, or `#e5e5ea` for UI chrome. Reserve `#2563eb` borders for **one focal element per diagram** (the conceptual climax).

---

## 6. Shadows

### Application shell

- **Container shadow:** `0 10px 40px rgba(0, 0, 0, 0.08)`
- Subtle, diffuse, slightly downward — lifts the card without dramatic depth

### Diagram cards

- **Card shadow:** vertical offset 4px, blur ~7px, black at **5% opacity**
- Applied uniformly to diagram cards for gentle layering
- Never stacked multiply; one shadow level only

### What does not use shadow

- Tabs, buttons, tables, blockquotes, header elements
- Text never carries shadow
- Hover states change **background colour**, not elevation

---

## 7. Spacing system

The prototype uses an **implicit 4px base grid** with recurring intervals.

### Macro spacing

| Context | Value |
|---------|-------|
| Page margin (container to viewport) | 40px vertical, auto horizontal (16px / 12px mobile) |
| Header padding | 35×45px (28×24px mobile) |
| Tab bar padding | 20×30px (14×20px mobile) |
| Content padding | 45px (28×24px mobile) |
| Content min-height | 600px |

### Recurring internal gaps

| Value | Usage |
|-------|-------|
| 3px | Label-to-value gap in meta items |
| 8px | Tab gap (mobile), diagram frame padding |
| 10px | Tab gap (desktop), list item rhythm in objectives |
| 12px | Button gap, list item spacing, mobile progression gap |
| 14px | Philosophy margin-top |
| 16px | Objectives title margin, progression step gap |
| 20px | Section heading bottom margin |
| 22px | Paragraph bottom margin |
| 24–28px | Block vertical separation in header zones |
| 32px | Header-meta gap, blockquote vertical margin, diagram margin |
| 36px | Second-level heading top margin |
| 40px | Horizontal rule vertical margin |
| 52px | Footer nav top margin |

### Content measure

- Main card max width: **1000px**
- Reading column max width: **800px** centred inside content area
- Diagrams span full content width (`100%`)

---

## 8. Grid and layout rules

### Page structure (top to bottom)

1. **Header** — chapter identity, objectives, philosophy, metadata, progression
2. **Tab bar** — horizontal, wrapping on narrow screens
3. **Content** — centred reading column
4. **Footer navigation** — right-aligned (full-width buttons on mobile)

### Layout principles

- **Single-column reading** — no sidebars, no multi-panel layouts
- **Centred composition** — main card and content column are horizontally centred
- **Full-bleed internal sections** — header, tabs, and content share the same card width; only the text measure is narrowed
- **Flexbox for horizontal groups** — tabs, meta items, progression steps, footer buttons, diagram outcome row
- **Wrap allowed** — tabs and progression steps wrap gracefully on small screens

### Diagram layout (SVG)

- **Vertical cascade** as default narrative flow — top to bottom
- **Centred alignment** on a single axis for sequential steps
- **Branching** shown with horizontal connector + two downward arrows (bifurcation pattern)
- **Outcome row** — equal-width tiles in a horizontal group
- **Summary panel** — full-width closing card at bottom

### Responsive breakpoint

- Single breakpoint at **640px**
- Proportionally reduced padding, font sizes, and corner radii
- Footer buttons expand to equal width

---

## 9. Buttons

### Secondary button (default)

- White background, 1px border `#e5e5ea`
- 12px corner radius
- Padding ~10×20px
- 14px medium (500) text in `#48484a`
- Hover: background `#f5f5f7`
- Used for « Concept précédent »

### Primary button

- Filled `#2563eb`, border matches fill
- White text, same size and radius as secondary
- Hover: `#1d4ed8`
- Used for forward navigation (« Concept suivant → »)
- Always positioned to the **right** in the footer group

### Button conventions

- Arrow glyphs in label text (`←` `→`), not icon components
- No pill shape; moderate 12px radius matches tabs
- Short transition on background (~150–200ms ease)
- No outline/focus ring styled in prototype (see §15)

---

## 10. Tabs

### Visual form

- Rounded rectangles (12px radius), not underlined text tabs
- Inactive: `#f2f2f2` background, dark text
- Active: `#2563eb` background, white text
- 10×18px padding (slightly smaller on mobile)
- 14px semibold (600) label
- 10px gap between tabs

### Tab labelling

Each tab combines **emoji + French label**:

| Tab | Label pattern |
|-----|---------------|
| Story | 📖 Histoire |
| Why | ❓ Pourquoi ? |
| Overview | 🗺️ Vue d'ensemble |
| Actors | 🔬 Les acteurs |
| Readiness | 🎯 Suis-je prêt ? |

### Tab bar container

- Separated from header and content by 1px `#eee` bottom border
- Padding creates breathing room above/below tab pills
- Tabs wrap to multiple lines if needed

### Content transition

- Tab switch triggers a brief **fade-and-rise** animation on content (opacity 0→1, 5px upward travel, ~300ms)

---

## 11. Header

### Information layers (top to bottom)

1. **Preview badge** — absolute top-right; uppercase « Preview »
2. **Eyebrow** — « Lou Learning Companion »
3. **Specialty** — large h1 with emoji (e.g. ❤️ Cardiologie)
4. **Chapter line** — muted metadata (Chapitre • Item)
5. **Chapter title** — second headline, nearly as prominent as specialty
6. **Objectives card** — tinted block with learning outcomes
7. **Philosophy line** — centred whisper: « Comprendre avant de mémoriser. Une idée à la fois. »
8. **Meta row** — label/value pairs (e.g. Lecture / 3 min)
9. **Progression** — four-step learning journey with emoji status

### Header visual treatment

- White background continuous with main card
- Bottom border `1px #eee` separates from tabs
- Badge floats in top-right corner without affecting text flow
- Internal sections separated by `1px #f0f0f0` top borders (meta, progression)
- No hero image or illustration in header

### Badge

- Pill shape, `#f2f2f7` fill
- 11px uppercase semibold `#86868b`
- Signals non-production / preview context

---

## 12. Information hierarchy

### Priority levels

| Level | Elements | Visual treatment |
|-------|----------|------------------|
| L1 — Identity | Specialty, chapter title | Largest, boldest, darkest |
| L2 — Wayfinding | Tabs, progression active step | Brand blue or dark emphasis |
| L3 — Section | h2 in content, objectives title | 19px semibold |
| L4 — Body | Paragraphs, lists | 15px regular, `#3a3a3c` |
| L5 — Supporting | Chapter line, meta, inactive progression | Medium grey |
| L6 — Ambient | Philosophy, preview badge | Smallest, lightest grey |

### Content patterns for hierarchy

- **Key insight** → blockquote with blue accent
- **Structured comparison** → table
- **Sequential explanation** → ordered list
- **Enumeration** → unordered list
- **Major topic shift** → horizontal rule (`<hr>`) with 40px vertical margin
- **Diagram** → full-width visual between explanatory paragraphs
- **Self-check** → numbered questions under dedicated h2

### Navigation hierarchy

- Tabs define **macro structure** (asset type)
- Footer buttons define **micro sequence** (concept-to-concept within chapter)
- Primary action is always forward (blue, right-aligned)

---

## 13. Icons and emoji usage

### No icon library

The prototype does **not** use SVG icons or an icon font. Visual shorthand is entirely **Unicode emoji**.

### Emoji roles

| Role | Examples |
|------|----------|
| Specialty identifier | ❤️ Cardiologie |
| Tab identifiers | 📖 ❓ 🗺️ 🔬 🎯 |
| Progression status | 🟢 active, ⚪ inactive |
| Objective completion | ✓ prefix on list items |
| Diagram actors/tags | 🚬 🩸 🍬 🧈 |
| Clinical outcomes | ❤️ Infarctus, 🧠 AVC, 🦵 AOMI |
| Step numbering (SVG) | ① ② ③ circled numerals |

### Emoji rules

- One emoji per tab label, placed **before** the text
- Emoji in h2 **match the active tab** for instant orientation
- Diagram emoji are **semantic**, not decorative — they identify risk factors or outcomes
- Do not mix emoji with icon sets; emoji **are** the icon system
- Prefer standard, widely-rendered emoji (no custom illustrations)

---

## 14. Diagram style

Derived from `cardio-221-overview.svg` and its inline presentation wrapper.

### Format

- SVG, portrait orientation, white canvas
- Full width of content column; height scales proportionally
- Accessible: `<title>` and `<desc>` elements present

### Composition

- **Title block** centred at top: main title (32px bold), subtitle (20px semibold), caption (14px grey)
- Short **blue accent line** (2px, centred) under caption as section divider
- **Vertical flowchart** of rounded cards connected by downward arrows
- **Branching** for divergent paths (stable vs unstable)
- **Closing summary card** with 2–3 lines of takeaway text

### Diagram typography (SVG)

| Class | Size | Weight | Colour |
|-------|------|--------|--------|
| Title main | 32px | 700 | `#111827` |
| Title sub | 20px | 600 | `#111827` |
| Card title | 15px | 600 | `#111827` |
| Card title large | 19px | 700 | `#111827` |
| Body | 13px | 400 | `#6b7280` |
| Body dark | 13px | 400 | `#374151` |
| Step number | 11px | 600 | `#6b7280` |
| Badge text | 12px | 500 | `#374151` |

### Connectors

- 3px grey lines (`#9ca3af`), round caps
- Triangular arrowheads filled `#9ca3af`
- Strictly orthogonal routing: vertical drops, horizontal splits

### Colour coding in diagrams

- **Neutral grey** — context, risk factors, summaries
- **Green tint** — early or stable physiology
- **Amber tint** — active pathological progression
- **Blue tint + blue border** — central concept / pivotal stage
- **Red tint** — acute complication pathway
- **White nested tiles** — clinical outcomes inside a grouping card

### Diagram content rules

- One concept per card; title centred
- Supporting detail as 1–3 centred lines below title
- Numbered steps use circled numerals in grey dot badges
- Inline tag pills for parallel items (risk factors)
- No photographs, no anatomical realism, no 3D — **schematic and typographic**
- Minimal decoration; clarity through layout and colour alone

---

## 15. Accessibility considerations

### Present in the prototype

- `lang="fr"` on document
- SVG `role="img"` with title and description
- `alt` text on embedded diagram image
- Semantic heading structure (h1 header, h2 content sections)
- Sufficient size for body text (15px minimum in UI)
- Strong contrast on primary text (`#1d1d1f` on white ≈ AAA)
- Active tab uses white on blue (high contrast)

### Gaps and risks

- **Colour-only progression** — active step uses 🟢 vs ⚪ without non-colour differentiation beyond weight
- **Emoji reliance** — meaning may be unclear to screen readers; tab labels should remain readable without emoji
- **No visible focus styles** on tabs and buttons in the visual spec
- **Blockquote** distinguished by border and background but not by semantic styling beyond italics
- **Tables** lack explicit scope attributes in the visual pattern
- **Motion** — fade-in on tab change may affect users sensitive to animation; no reduced-motion alternative defined
- **Diagram text** at 13px is below UI body size — acceptable for illustrations but should not go smaller

### Recommended permanent rules (inherited from gaps)

- Always pair colour coding in diagrams with **text labels**
- Tab labels must remain meaningful with emoji removed
- Provide text alternatives for all diagrams
- Maintain 15px minimum for interactive UI; 13px minimum inside diagrams only

---

## 16. Recurring visual conventions → permanent design rules

1. **One card to rule the page** — all learning happens inside a single elevated white container on a soft grey page.
2. **One blue** — `#2563eb` is the only interactive accent; never introduce a second primary colour.
3. **Tint, don't border** — informational blocks (objectives, blockquotes) use background colour; borders are for structure and tables only.
4. **Emoji as wayfinding** — emoji identify tabs, specialties, and diagram categories; they never replace medical precision in body copy.
5. **Section = h2 + whitespace** — new topics get a semibold 19px heading and generous margin; never compress sections.
6. **Tables for comparison, lists for sequence, blockquotes for insight** — each pattern has a fixed visual form.
7. **Horizontal rules mark major transitions** — `<hr>` signals a shift in narrative mode (story → chronology, theory → practice).
8. **Forward is blue, back is white** — navigation affordances always follow this pattern.
9. **Diagrams are schematic flowcharts** — vertical cascade, rounded cards, grey arrows, semantic pastel fills, centred text, no clipart.
10. **Preview badge always visible** in prototype contexts — uppercase pill, top-right, never confused with learner content.
11. **Philosophy line always centred and subdued** — the product mantra sits between objectives and metadata.
12. **Progression tracker always shows four stages** — Comprendre → Mémoriser → S'entraîner → Valider; only one active at a time.
13. **Reading measure never exceeds 800px** — even inside a 1000px card.
14. **Shadows are whisper-quiet** — one level on the shell and diagram cards; never on controls.
15. **Inter everywhere** — UI and SVG text use the same family for visual continuity.
16. **French typography conventions** — curly apostrophes, spaced punctuation where appropriate, informal « tu » address in learner copy.
17. **Checkmarks in objectives** — use `✓` character prefix, not custom icons or checkbox UI.
18. **Chapter metadata uses bullet separator** — « Chapitre 1 • Item 221 » pattern for chapter line.
19. **Diagram climax gets the blue border** — only the most important card in a flowchart receives `#2563eb` stroke emphasis.
20. **Summary always last in diagrams** — grey neutral card, titled « À retenir », 2–3 short centred sentences.

---

## Source reference

| Asset | Role |
|-------|------|
| `demo/legacy/221/index.html` | Shell layout, header, CSS design tokens |
| `demo/legacy/221/app.js` | Tab labels, content patterns, diagram wrapper |
| `demo/legacy/assets/svg/cardio-221-overview.svg` | Diagram colour system, card grammar, typography |

---

*Draft status — extracted for pipeline use. Not yet approved as final `svg-style-guide.md`.*
