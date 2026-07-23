# Lou Learning Companion — Design System

Version: 1.0

Status: Stable

> Purpose
>
> This document defines the permanent visual language of the Lou Learning Companion.
>
> It is the single source of truth for every learner-facing visual asset, including:
>
> - HTML renderer
> - SVG diagrams
> - Future PDF exports
> - Future mobile applications
>
> Every visual asset must comply with this Design System.

---

# Philosophy

The Lou Learning Companion is designed around one principle:

**Understanding always comes before memorisation.**

The interface should feel like reading a beautifully designed textbook rather than using exam preparation software.

Every visual decision should reduce cognitive load.

Core principles:

- Explain before impressing.
- One idea at a time.
- Soft structure.
- Strong hierarchy.
- Generous whitespace.
- Calm visual rhythm.
- Premium editorial feel.
- Progressive disclosure.

---

# Typography

## Typeface

Primary font:

Inter

Fallback:

Inter → system-ui → -apple-system → sans-serif

---

## Typography principles

- generous line height
- short line lengths
- strong visual hierarchy
- no decorative typography
- no serif fonts

---

## Type scale

| Role | Size | Weight | Colour | Notes |
|------|------|--------|--------|-------|
| Specialty title (h1) | 28px (24px mobile) | 700 | `#1d1d1f` | Often prefixed with emoji |
| Chapter title | 26px (22px mobile) | 700 | `#1d1d1f` | Second-level headline |
| Section heading (h2) | 19px | 600 | `#1d1d1f` | Tab content sections |
| Body text | 15px | 400 | `#3a3a3c` | Primary reading size |
| Tab labels | 14px | 600 | varies | Includes emoji |
| Chapter line / meta value | 15px | 500 | grey / dark | Secondary information |
| Eyebrow / progression steps | 13px | 600 / 500 | `#86868b` | Navigation context |
| Philosophy tagline | 12px | 400 | `#aeaeb2` | Centred, subdued |
| Uppercase labels | 11px | 600 | `#86868b` | Badge, meta labels, progression title |
| Table header cells | 12px | 600 | `#6e6e73` | Uppercase |

---

# Colour palette

## Foundation

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

## Accent

| Name | Hex | Usage |
|------|-----|-------|
| Brand blue | `#2563eb` | Primary accent |
| Blue hover | `#1d4ed8` | Hover state |
| Blue tint | `#f0f6ff` | Information blocks |
| Diagram highlight | `#edf5ff` | Highlight cards |

## Neutral surfaces

| Name | Hex | Usage |
|------|-----|-------|
| Inactive tab | `#f2f2f2` |
| Badge background | `#f2f2f7` |
| Button hover | `#f5f5f7` |
| Table header | `#f9f9fb` |
| Divider | `#eee` |
| Divider soft | `#f0f0f0` |
| Border | `#e5e5ea` |
| Border light | `#ebebeb` |
| Row divider | `#f0f0f2` |

## Semantic colours

| Name | Hex | Meaning |
|------|-----|---------|
| Neutral | `#f5f7fa` | Context |
| Success | `#dcfce7` | Stable / favourable |
| Progress | `#fef3c7` |
| Progress alt | `#fde7c7` |
| Danger | `#fee2e2` |
| Connector | `#9ca3af` |
| Card border | `#e5e7eb` |
| Step circle | `#f3f4f6` |

---

# Shadows

## Application

```
0 10px 40px rgba(0,0,0,0.08)
```

## Diagram cards

```
0 4px 7px rgba(0,0,0,0.05)
```

Only one elevation level should be used.

---

# Radius scale

| Token | Value |
|-------|------|
| Pill | 999px |
| XL | 18px |
| L | 16px |
| M | 14px |
| S | 12px |

---

# Borders

Hairline:

```
1px
```

Accent:

```
4px
```

Highlight:

```
2.5px
```

Connectors:

```
3px
```

---

# Spacing system

The interface follows a 4px base grid.

## Main spacing

| Usage | Value |
|------|------|
| Page margin | 40px |
| Header padding | 35×45px |
| Content padding | 45px |
| Reading width | 800px |
| Container width | 1000px |

## Common spacing tokens

3 · 8 · 10 · 12 · 14 · 16 · 20 · 24 · 28 · 32 · 36 · 40 · 52 px

---

# Layout system

The application follows a centred editorial layout.

Hierarchy:

1. Header
2. Tabs
3. Reading content
4. Footer navigation

Rules:

- Single reading column
- Centred layout
- Responsive scaling
- No sidebars
- No visual clutter

---

# Components

## Cards

Rounded white containers used for structured information.

Variants:

- Application card
- Objectives card
- Diagram card
- Summary card

## Tables

Rounded bordered tables.

Header row uses a light grey background.

## Blockquotes

Blue left border.

Light blue background.

Reserved for important insights.

## Buttons

Primary

- blue background
- white text

Secondary

- white background
- grey border

## Tabs

Rounded pills.

Active state uses the primary blue.

## Header

Contains:

- chapter identity
- objectives
- philosophy
- metadata
- progression

## Footer navigation

Previous button (secondary)

Next button (primary)

---

# Information hierarchy

| Level | Usage |
|------|------|
| L1 | Specialty / Chapter title |
| L2 | Navigation |
| L3 | Section headings |
| L4 | Body |
| L5 | Supporting information |
| L6 | Ambient information |

Principle:

> Every page must have one obvious focal point.

---

# Content conventions

Markdown should use:

- headings
- paragraphs
- ordered lists
- unordered lists
- tables
- blockquotes

Each pattern has a semantic purpose.

Never style content purely for decoration.

---

# Emoji conventions

Emoji are part of the navigation system.

Use them only to improve orientation.

Never replace medical terminology with emoji.

---

# Accessibility

Requirements:

- semantic headings
- accessible SVGs
- sufficient contrast
- readable typography
- colour is never the only carrier of meaning
- diagrams require text alternatives

---

# Responsive behaviour

Desktop-first.

Single breakpoint.

Only proportional reductions.

Do not redesign the interface on mobile.

---

# Permanent design rules

1. One elevated page container.
2. One primary accent colour.
3. Understanding before decoration.
4. Emoji support navigation only.
5. One visual focus per page.
6. Tables compare.
7. Lists explain sequences.
8. Blockquotes highlight key ideas.
9. Diagrams remain schematic.
10. Navigation is always consistent.
11. Reading width remains limited.
12. Shadows stay subtle.
13. Typography uses Inter everywhere.
14. SVGs reuse the same visual language.
15. Summary always closes the learning sequence.

---

# Scope

This document defines the permanent visual language of the Lou Learning Companion.

It intentionally does not define:

- SVG construction rules
- diagram grammar
- SVG generation prompts
- renderer implementation

These topics are specified in their dedicated documents.

---

# Related documents

- `svg/svg-style-guide.md`
- `svg/svg-patterns.md`
- `svg/diagram-template.svg`
- `prompt/generate-svg.md`

---

This document is the official Design System of the Lou Learning Companion.

All learner-facing visual assets must comply with this specification.