# SVG Style Guide

Version: 1.0

Status: Stable

---

# Purpose

This document defines the rules for every SVG generated for the Lou Learning Companion.

It complements the Design System.

The Design System defines the visual language.

This document defines how that visual language is applied to educational diagrams.

Every generated SVG must comply with this guide.

---

# Philosophy

SVGs are educational diagrams.

They are not illustrations.

Their purpose is to make complex concepts immediately understandable.

Every SVG should support exactly one learning objective.

If a diagram does not significantly improve understanding, it should not exist.

Prefer clarity over completeness.

---

# SVG categories

Three diagram families are supported.

## Overview

Filename

```
overview.svg
```

Purpose

Represent the entire chapter in a single diagram.

The learner should understand the overall chapter in less than one minute.

---

## Mechanism

Filename

```
mechanism-01.svg
mechanism-02.svg
mechanism-03.svg
...
```

Purpose

Explain one mechanism.

Rules

- One SVG per mechanism.
- Numbering follows the order of `mecanismes.md`.
- Once assigned, a number should never be reused.
- If a new mechanism is introduced later, append it whenever possible rather than renumbering the existing sequence.

---

## Actor

Filename

```
actor-01.svg
actor-02.svg
actor-03.svg
...
```

Purpose

Represent one important actor.

Rules

- One SVG per actor.
- Numbering follows the order of `acteurs.md`.
- Once assigned, a number should never be reused.
- If a new actor is introduced later, append it whenever possible rather than renumbering the existing sequence.

---

# SVG naming convention

SVGs are referenced from Markdown using placeholders.

Examples

```
[[SVG:overview]]

[[SVG:mechanism-01]]

[[SVG:mechanism-07]]

[[SVG:actor-03]]
```

The renderer resolves these placeholders automatically.

---

# Stability principle

SVG filenames are part of the public contract between the learning pipeline and the renderer.

Changing an existing filename should be avoided.

Whenever possible, extend the sequence rather than renumber existing diagrams.

---

# Diagram philosophy

Prefer

- flow
- causality
- comparison
- transformation
- progression

Avoid

- decoration
- realism
- anatomical drawings
- unnecessary icons
- visual clutter

---

# Complexity budget

Maximum per SVG

- one learning objective
- 10 process boxes
- 2 branching levels
- 30 text nodes
- 5 semantic colours

If these limits are exceeded, split the content into multiple SVGs.

---

# Visual grammar

Use the Design System for:

- typography
- colours
- spacing
- cards
- borders
- shadows

SVG-specific rules

- vertical reading flow by default
- centred composition
- orthogonal connectors
- rounded cards
- one highlighted concept only
- summary always at the bottom

---

# Technical requirements

Every SVG must be

- SVG 1.1 compliant
- responsive
- based on a mandatory `viewBox`
- transparent background
- self-contained

Do not use

- raster images
- embedded fonts
- external CSS
- JavaScript
- animations

Only subtle inline shadows are allowed if defined directly inside the SVG.

---

# Renderer compatibility

Every SVG must

- display correctly inside an HTML `<img>` element
- scale to 100% width
- preserve its aspect ratio
- work independently
- require no external resources

---

# Accessibility

Every SVG must contain

- `<title>`
- `<desc>`
- `role="img"`

Text must remain readable.

Colour must never be the only carrier of meaning.

---

# Output rules

Generate only the SVG files required by the chapter.

Do not combine multiple diagrams into a single SVG.

Do not generate placeholder diagrams.

Only generate diagrams that genuinely improve understanding.

---

# Related documents

- `design-system.md`
- `generate-svg.md`