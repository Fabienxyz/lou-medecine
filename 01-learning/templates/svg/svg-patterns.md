# SVG Patterns

## Purpose

This document defines the standard diagram patterns used throughout the Lou Learning Companion.

Its purpose is to help the SVG generator choose the simplest visual structure for each learning objective.

It does **not** define:

- colours
- typography
- spacing
- shadows
- graphical components

These are defined elsewhere.

---

# Inputs

The SVG generator has access to:

- storyboard.md
- vue-ensemble.md
- mecanismes.md
- acteurs.md

It must select the most appropriate pattern before composing the SVG.

---

# Fundamental principles

## 1. One diagram = one idea

Each SVG should communicate one central learning objective.

Avoid mixing unrelated concepts.

---

## 2. Prefer simplicity

Always choose the simplest pattern that communicates the idea.

Do not add visual complexity without educational value.

---

## 3. Show relationships

A diagram should primarily communicate relationships:

- sequence
- causality
- hierarchy
- comparison
- transformation
- feedback

rather than isolated information.

---

## 4. Reuse patterns

Use the standard patterns below.

Do not invent new layouts unless none of the existing patterns adequately represents the concept.

---

# Standard patterns

---

## Pattern 1 — Process Flow

### Best suited for

- physiological mechanisms
- pathological progression
- diagnostic reasoning
- treatment sequence

### Structure

```
Step

↓

Step

↓

Step

↓

Outcome
```

### Typical assets

- overview
- mechanisms

---

## Pattern 2 — Cause → Consequence

### Best suited for

- physiopathology
- complications
- chain reactions

### Structure

```
Cause

↓

Mechanism

↓

Consequence
```

---

## Pattern 3 — Comparison

### Best suited for

- differential diagnosis
- classification
- normal vs pathological
- two competing mechanisms

### Structure

```
          Topic

      ↙         ↘

 Version A   Version B
```

---

## Pattern 4 — Decision Tree

### Best suited for

- diagnostic algorithms
- therapeutic choices

### Structure

```
Question

↙      ↘

Yes     No
```

---

## Pattern 5 — Hierarchy

### Best suited for

- classifications
- taxonomies
- families

### Structure

```
Category

↓

Subcategory

↓

Element
```

---

## Pattern 6 — Feedback Loop

### Best suited for

- vicious circles
- positive feedback
- negative feedback

### Structure

```
A

↓

B

↓

C

↺
```

---

## Pattern 7 — Timeline

### Best suited for

- chronological events
- disease evolution
- natural history

### Structure

```
Start → Stage → Stage → End
```

---

## Pattern 8 — Anatomy

### Best suited for

- organs
- anatomical structures
- localisation

### Structure

One central anatomical element with labelled regions or surrounding structures.

---

## Pattern 9 — Actor Card

### Best suited for

- organs
- biomarkers
- drugs
- receptors
- medical devices
- investigations

### Structure

```
Actor

↓

Role

↓

Key points
```

Usually used for actor SVGs.

---

# Pattern selection rules

When several patterns are possible:

1. Prefer Process Flow.
2. Otherwise choose the simplest pattern.
3. Avoid combining patterns.
4. Use branching only when the reasoning genuinely branches.
5. Never use a complex layout to impress; use it only when required for understanding.

---

# Composition rules

Once the pattern has been selected:

- compose the diagram using `diagram-template.svg`
- respect `svg-style-guide.md`
- respect `design-system.md`

Never recreate graphical elements from scratch.

---

# Self-audit

Before generating a diagram, verify that:

- the selected pattern matches the learning objective
- a simpler pattern would not communicate the concept equally well
- the diagram communicates one main idea
- unnecessary branches have been removed
- the diagram remains readable in a few seconds