# Final Architecture — Lou Learning Companion

> The convergence decision. Builds on `ARCHITECTURE_AUDIT.md` (factual baseline) and `PRODUCTION_ARCHITECTURE.md` (first-principles design). This document decides; it does not survey.
>
> Conceptual only: no code, no implementation roadmap, no repository changes beyond creating this file.
>
> Optimisation order, fixed for every decision below: **medical fidelity → understanding-before-memorisation → low human maintenance → reproducible regeneration → scale → adaptivity.** When two conflict, the earlier wins.

---

## 1. Executive Decision

Adopt a **two-curated-artifact architecture**:

```
Official Source  →  Knowledge Inventory  →  Chapter Blueprint  →  Projections  →  Chapter Package  →  Renderer   (→ Adaptive, later)
                     [curated]              [curated]             [generated]     [generated]
```

The decisive move is to **collapse Architecture B's six persistent layers** (Source Passages, Knowledge Units, four Understanding entities, Learning Sequence) into **exactly two curated artifacts per chapter**:

1. **Knowledge Inventory** — proves fidelity: every important thing the college says has been captured, ranked, and anchored to the source.
2. **Chapter Blueprint** — the merged Storyboard + Learning Model: one structured intermediate holding *both* the pedagogical plan (order, dependencies, confusion points, visual intent) *and* the structured understanding (mechanisms, actors, clinical reasoning) that every projection is generated from.

Everything else is either the immutable source, a disposable generated output, or a computed guarantee.

Two principles make this both simple and durable:

- **One structured intermediate, not many entities.** Mechanisms, actors, and clinical patterns are *structured content inside the Blueprint*, scoped to a chapter, not global domain entities. We get the benefit of "all projections derive from one understanding" without building a medical ontology.
- **Chapter-local stable IDs, not a global graph.** Knowledge points, mechanisms, and actors get identifiers that are stable *within a chapter's life*. This is the minimum needed for traceability and future spaced repetition — and it deliberately stops short of cross-chapter entity management.

This preserves Architecture B's structural correctness while keeping Architecture A's simplicity of operation: a human touches only two artifacts per chapter, both small and high-value.

---

## 2. Why Architecture A Is Insufficient

Architecture A (College → Coverage → Storyboard → Assets → SVG → Renderer) is not merely broken in practice (the audit covers that); it is **structurally unable to reach the project's goals**, for reasons that would remain even with a perfect implementation:

- **No structured intermediate.** Each asset is generated directly as prose from the source. Prose becomes the only home of structure, so a diagram, a QCM, and a flashcard about the same mechanism must each *re-interpret* the source independently. They will drift. This single gap blocks consistent regeneration, QCM, flashcards, and spaced repetition.
- **Traceability stops at the chapter.** Nothing below chapter level is addressable, so "where in the college does this come from?" cannot be answered for a specific claim, and future spaced repetition has nothing stable to attach to.
- **Coverage is a checkbox, not a proof.** As a hand-maintained document it cannot guarantee completeness and rots (audit: 0% forever).
- **Storyboard is undefined.** Its pedagogical role is real but the architecture gives it no structured form, so it is either bypassed or a linear prose stub.
- **Fixed five assets + SVG-from-prose** hard-code today's output shape and make new projection types and consistent visuals structurally awkward.

A is the right *silhouette* (source → understanding → learner) but missing the load-bearing middle.

## 3. Why Architecture B Is Right in Spirit but Too Heavy in Form

Architecture B's **invariants are correct and must be kept**: a structured understanding that projections derive from; source anchoring; stable IDs; disposable, regenerable projections; provenance-based versioning; adaptivity reading isolated learner state.

But B's **form is over-built for this project's reality** (one learner, EDN preparation, AI-assisted regeneration):

- **Too many persistent entities.** Six layers, of which four (Mechanism, Actor, Clinical Pattern, Mental Model) are proposed as canonical persisted domain entities. Each persistent entity multiplies generation, validation, versioning, and migration cost. Most of that cost buys a capability — cross-chapter reuse and a queryable ontology — that is **premature** and not on the near path.
- **Source Passages as a separate layer** is heavier than needed; source anchoring is a *reference field*, not a materialised entity layer.
- **Knowledge Units as global first-class entities** imply a validation and lifecycle burden ("curate hundreds of atomic entities per chapter") that the brief explicitly warns against and that does not scale to 350 chapters with one human.
- **Learning Sequence separate from the Understanding Model** splits two artifacts that are authored together and reference each other constantly, creating sync burden for no benefit at this scale.

B is not wrong; it is a *later* architecture. It answers "how do we run a multi-author medical ontology platform," when the question is "how do we help one student deeply learn 350 chapters." The convergence keeps B's invariants and discards B's entity proliferation.

---

## 4. Final Minimal Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│  OFFICIAL SOURCE            immutable · editioned · the only medical truth │
└─────────────────────────────────────────────────────────────────────────┘
        │  AI extract  +  HUMAN fidelity review (gate 1)
        ▼
┌─────────────────────────────────────────────────────────────────────────┐
│  KNOWLEDGE INVENTORY        curated · chapter-local IDs · source anchors · │
│                             EDN rank · coverage state                      │
│                             (this is "Coverage", promoted from checkbox    │
│                              to a structured, anchored, ID'd inventory)    │
└─────────────────────────────────────────────────────────────────────────┘
        │  AI structuring  +  HUMAN pedagogical curation (gate 2)
        ▼
┌─────────────────────────────────────────────────────────────────────────┐
│  CHAPTER BLUEPRINT          curated · THE single structured intermediate   │
│   = Storyboard  +  Learning Model                                          │
│   • pedagogy: teaching order, dependencies, key questions, confusion       │
│     points, analogy opportunities, visual intent                           │
│   • understanding: mechanisms (question + ordered steps + causal links),   │
│     actors (role), clinical reasoning links — all chapter-scoped,          │
│     each referencing Knowledge Inventory IDs and source anchors            │
└─────────────────────────────────────────────────────────────────────────┘
        │  AI generation, per projection type (all derive from the Blueprint)
        ▼
┌─────────────────────────────────────────────────────────────────────────┐
│  PROJECTIONS                generated · disposable · open-ended set        │
│   story · overview · mechanism explanations · actor explanations ·         │
│   clinical reasoning · readiness · visuals · (later) QCM · flashcards ·    │
│   animations                                                               │
└─────────────────────────────────────────────────────────────────────────┘
        │  assemble
        ▼
┌─────────────────────────────────────────────────────────────────────────┐
│  CHAPTER PACKAGE / MANIFEST generated · projection registry + metadata +   │
│                             traceability graph + provenance stamps         │
└─────────────────────────────────────────────────────────────────────────┘
        │
        ▼
┌─────────────────────────────────────────────────────────────────────────┐
│  RENDERER                   assembles the learner experience from the      │
│                             manifest; holds no medical content             │
└─────────────────────────────────────────────────────────────────────────┘
        │  learner events (later)
        ▼
      ADAPTIVE LEARNING        future · reads events · attaches to Inventory
                               IDs · never writes to the medical model
```

Count of things a human maintains per chapter: **two** (Inventory, Blueprint). Count of persistent global domain entities: **one** (the Chapter itself). Everything else is generated-and-disposable or a field/reference.

---

## 5. Layer-by-Layer Responsibilities

### Official Source
1. **Why:** the sole medical authority; the trust anchor.
2. **Owns:** the verbatim college text, per edition.
3. **Must NOT own:** any pedagogy, interpretation, structure, or generated content.
4. **Type:** immutable source.
5. **Consumed by:** Knowledge Inventory (extraction), and cited by everything transitively.
6. **Stable IDs:** yes — chapter identity + an addressing scheme for citation (section/paragraph locator). Anchoring is a *reference format*, not a materialised layer.
7. **Human validation:** none of the text (it is ingested as-is).

### Knowledge Inventory
1. **Why:** turns "coverage" from an unprovable checkbox into a structured, anchored proof that all important source content is captured; the granularity that assessment and spaced repetition will later target.
2. **Owns:** the list of knowledge points, each with a chapter-local ID, source anchor(s), EDN rank, topic, and coverage state.
3. **Must NOT own:** explanations, teaching order, or any pedagogy. It is an inventory, not a lesson.
4. **Type:** curated artifact (AI-extracted, human-validated).
5. **Consumed by:** the Blueprint (which references its IDs), coverage verification, future assessment/flashcards.
6. **Stable IDs:** yes — chapter-local, must survive edition updates where the underlying fact is unchanged.
7. **Human validation:** **required — gate 1 (fidelity).** Bounded: review a single ~80-row list, not hundreds of separate objects.

### Chapter Blueprint
1. **Why:** the one structured intermediate so that prose, diagrams, QCM, and flashcards derive from the *same* understanding and the *same* pedagogical plan instead of re-interpreting the source. This is where the project's educational value is actually encoded.
2. **Owns:** (a) pedagogy — teaching sequence, prerequisite/dependency edges, key questions, confusion/misconception points, analogy opportunities, visual intent; (b) structured understanding — mechanisms (the question answered, ordered steps, causal links, involved actors), actors (role), clinical reasoning links; each element carries chapter-local IDs and references Inventory IDs + source anchors.
3. **Must NOT own:** finished learner prose, final diagram markup, rendering/layout, or anything a projection produces. It is the model, not the presentation.
4. **Type:** curated artifact (AI-structured, human-curated).
5. **Consumed by:** every projection generator; the renderer's navigation/sequence.
6. **Stable IDs:** yes — chapter-local IDs for mechanisms/actors so projections and the manifest can reference them precisely.
7. **Human validation:** **required — gate 2 (pedagogy).** The highest-judgement review: is the order right, are the confusion points real, is the mental model sound.

### Projections
1. **Why:** the artifacts learners actually consume; kept separate and disposable so the system can regenerate freely.
2. **Owns:** their own presentation content only, each stamped with provenance (which source edition, Blueprint version, methodology version produced it) and references back to the Blueprint element and Inventory IDs it presents.
3. **Must NOT own:** any fact or structure not already in the Blueprint/Inventory. A projection may never be the sole home of a medical fact.
4. **Type:** generated artifact (disposable).
5. **Consumed by:** the Chapter Package/renderer.
6. **Stable IDs:** no — addressed by (type × the Blueprint element they project). Regenerating replaces them.
7. **Human validation:** none by default; optional spot-check or explicit override for a specific fix (override lives in a declared layer, not by editing generated files in place).

### Chapter Package / Manifest
1. **Why:** the renderer's contract; makes coverage-proof, traceability graph, and available projections explicit rather than implicit.
2. **Owns:** the registry of projections, learner-facing metadata (title, objectives, reading order from the Blueprint), the traceability graph, and provenance stamps.
3. **Must NOT own:** medical content or pedagogy (it references them).
4. **Type:** generated artifact.
5. **Consumed by:** the renderer.
6. **Stable IDs:** references existing IDs; not a new ID space.
7. **Human validation:** none (generated; correctness is guaranteed by the pipeline, e.g. coverage invariant must pass).

### Renderer
1. **Why:** assemble the experience; be the single place the tiers converge for a human.
2. **Owns:** assembly logic, navigation (driven by the Blueprint sequence via the manifest), reference resolution (explanation↔visual, claim↔source, question↔knowledge point), and learner-interaction capture.
3. **Must NOT own:** any medical content of its own (the legacy hard-coded-HTML pattern is permanently rejected), and must not re-interpret the model.
4. **Type:** application (generated content-free).
5. **Consumed by:** the learner.
6. **Stable IDs:** consumes them; defines none.
7. **Human validation:** UI/UX review only — never medical.

### Adaptive Learning (future)
1. **Why:** close the loop for spaced repetition and personalised paths.
2. **Owns:** learner state (mastery, schedule, history), isolated from content.
3. **Must NOT own / write:** the medical model; it only reads it.
4. **Type:** separate system with its own lifecycle.
5. **Consumed by:** the renderer (to choose paths/scheduling).
6. **Stable IDs:** attaches to chapter-local Inventory IDs.
7. **Human validation:** none (behavioural, not medical).

Layers deliberately **not** present (and why): a separate Source-Passage layer (anchoring is a field), a global Knowledge-Unit entity store (inventory rows suffice), separate persisted Mechanism/Actor/Clinical-Pattern/Mental-Model entities (structured content inside the Blueprint), and a separate Learning-Sequence artifact (merged into the Blueprint).

---

## 6. Minimal Domain Model

Persistent, addressable things, ranked by durability:

- **Chapter** — the only global first-class entity. Stable ID. Immutable per edition.
- **Knowledge point** — a row in a chapter's Knowledge Inventory. Chapter-local stable ID, source anchor, rank, coverage state. Curated.
- **Blueprint element** (mechanism / actor / clinical-reasoning node / mental-model node) — structured content *inside* a chapter's Blueprint. Chapter-local stable ID. Curated. **Not** a global entity, **not** independently versioned, **not** cross-chapter — yet.
- **Projection** — generated, disposable, provenance-stamped, references a Blueprint element.
- **Chapter Package** — generated bundle referencing all of the above.

Everything else named in Architectures A/B is either one of these under a different label, a field on one of these (source anchor, rank), a computed guarantee (coverage), or a future concern (learner state, cross-chapter concept registry).

Cross-chapter reuse of a mechanism/concept is **intentionally not modelled now**. The clean path is preserved (Blueprint elements are already structured and ID'd, so a shared-concept registry can be introduced later by promotion + reference) but building it now would be premature ontology.

---

## 7. Structured vs Free-form Boundaries

Avoid both extremes: not "everything is free-form Markdown with implicit relationships" and not "everything is a database/ontology." The rule: **structure exactly the relationships the machine must traverse; leave everything else free-form.**

**Must be structured (machine-traversable):**
- *Knowledge Inventory:* IDs, source anchors, rank, coverage state, topic. (The rows' human-readable descriptions are prose; the fields around them are structured.)
- *Blueprint:* ordered sequence, prerequisite/dependency edges, per-element IDs, references to Inventory IDs and source anchors, mechanism step ordering and causal links, actor↔mechanism involvement, declared visual intent, declared confusion points. These are the relationships diagrams/QCM/navigation depend on.
- *Chapter Package:* projection registry, reference/traceability graph, provenance.

**Should stay free-form (human/AI prose):**
- The actual explanatory text of a knowledge point or mechanism step.
- The wording of questions, analogies, story prose.
- Anything whose only consumer is a human reading it.

**Firm consequence:** the Blueprint is structured *enough to parse* (explicit lists, ordering, references) but remains human-readable and human-editable — it is a structured document, not a schema-locked database. Projections are free-form outputs constrained by templates. The Inventory is a structured list of mostly-prose rows.

---

## 8. Traceability and Identity

**Identity model (the irreversible core — get this right first):**
- **Chapter ID:** global, stable, human-meaningful, survives editions. (e.g. specialty + item number.)
- **Chapter-local IDs** for knowledge points and Blueprint elements: stable within the chapter's life, meaningful across edition updates where the underlying concept is unchanged, and never reused/recycled.
- **No global sub-chapter IDs now.** Cross-chapter linking is deferred; the ID scheme should simply not *forbid* future promotion to a shared reference.

**Traceability chain (a hard invariant, stored not recomputed):**
```
source anchor  ←  knowledge point  ←  Blueprint element  ←  projection
```
Every learner-facing claim resolves, by stored reference, back to a knowledge point and thence to an exact source location. The Chapter Package materialises this graph so "show me where this comes from" is a lookup. This is the trust contract; it is structural, not a feature.

Spaced repetition and mastery later attach to **knowledge-point IDs** — which is exactly why those IDs must be stable and their granularity must be right before any learner data exists.

---

## 9. Human Validation Model

Design constraint: 350+ chapters, one human. Human effort must be **concentrated, bounded, and high-value** — never per-atomic-entity data management.

| Work | Who | Cost per chapter |
|---|---|---|
| Extract knowledge points from source | AI | 0 human |
| **Validate the Knowledge Inventory (fidelity)** | **Human — gate 1** | Bounded: read one anchored list; confirm nothing important is missing/invented, ranks are sane |
| Structure the Blueprint (mechanisms, actors, draft sequence) | AI | 0 human |
| **Curate the Blueprint (pedagogy)** | **Human — gate 2** | Highest value: confirm order, dependencies, confusion points, mental-model soundness |
| Generate all projections (prose, visuals, later QCM/flashcards) | AI | 0 human |
| Assemble Chapter Package, verify coverage invariant | Pipeline | 0 human |
| Fix a specific projection when needed | Human (rare, via explicit override) | Occasional, opt-in |

**Two gates, both on small structured artifacts, both high-leverage.** A human reviews *the inventory* and *the plan*, not hundreds of entities and not the generated output. This is the mechanism that makes 350 chapters tractable while keeping medical fidelity (gate 1) and pedagogical quality (gate 2) under human control.

Projections are trusted by default because they are derived from human-validated structure and are cheap to regenerate; a bad projection is a regeneration, not a curation crisis.

---

## 10. Generation and Regeneration Model

- **Everything below the two curated artifacts is generated from them and disposable.** Improving a prompt, the visual system, or a projection template triggers regeneration; nothing precious is lost because the Inventory and Blueprint (plus any explicit overrides) are the durable layer.
- **Regeneration is idempotent and scoped.** Re-running a projection type on an unchanged Blueprint yields equivalent output. Changing the Blueprint re-projects only that chapter; changing the visual system re-derives only visuals; changing the source edition re-runs extraction and scopes review to changed knowledge points.
- **Provenance over preservation.** Each generated artifact carries (source edition × Blueprint version × methodology version). Reproducibility replaces archiving old outputs, keeping the repository lean at scale.
- **Human refinements survive regeneration** because they live in the curated layer or an explicit override layer, never as in-place edits to generated files.
- **Visuals and assessments generate from the Blueprint, not from prose.** This is what makes them consistent and re-derivable.

---

## 11. Future Capability Test

| Future capability | Supported without major redesign? | Why |
|---|---|---|
| Regenerate all diagrams after visual redesign | ✅ | Visuals derive from Blueprint + visual system; re-run projection |
| Regenerate explanations after better prompts | ✅ | Re-project prose from the Blueprint |
| Add QCM later | ✅ | New projection type over Blueprint + Inventory; no structural change |
| Add flashcards later | ✅ | Projection from validated knowledge points |
| Add spaced repetition later | ✅ | Attaches to stable chapter-local knowledge-point IDs; learner state isolated |
| Multiple languages | ✅ | Blueprint structure is largely language-independent; projections regenerate per language (source edition per language) |
| New official edition | ✅ | Re-extract Inventory, diff, re-validate only changed points, re-project; stable IDs preserve learner data |
| Source traceability | ✅ | Stored anchor→point→element→projection graph in the Package |
| Personalise learning path | ✅ | Blueprint carries dependency graph; adaptive layer selects paths |
| Reuse a mechanism across chapters | ⚠️ Clean path, not built now | Blueprint elements are structured + ID'd; a shared-concept registry can be added later by promotion. Intentionally deferred to avoid premature ontology |

Every capability except deliberate cross-chapter reuse is reachable by *adding a projection type or an isolated layer*, not by restructuring. The one deferred capability has a preserved, non-blocking path.

---

## 12. Irreversible vs Reversible Decisions

**Irreversible — must be correct before scaling (invest heavily):**
- Chapter identity scheme.
- Source-anchoring format (how a claim references a source location).
- Chapter-local ID scheme and **granularity** for knowledge points and Blueprint elements (fixes the resolution of coverage, assessment, and spaced repetition; re-granulating later invalidates learner data).
- The generated-vs-curated boundary (which two artifacts humans own).
- Provenance/versioning model.
- **The existence of a single structured intermediate (the Blueprint) from which all projections derive.**

**Reversible — keep flexible, do not over-design:**
- Exact Markdown/format of the Blueprint and projections.
- Number and names of projection types (five is a starting point, not a contract).
- Renderer UI, tabs, navigation specifics.
- Prompt wording and methodology internals.
- SVG file naming and layout.
- Visual design tokens (regenerable).
- Implementation technology throughout.

The through-line: **identity, granularity, anchoring, and the existence of the structured intermediate are the irreversible core; prose, formats, prompts, counts, and tooling are all safely reversible.**

---

## 13. Explicit Answers to the 15 Architecture Questions

1. **Should Coverage remain?** Not as a separate stage or document. It is promoted into the **Knowledge Inventory** (coverage state per row) and enforced as a **computed invariant** at packaging. The function survives; the artifact disappears.

2. **Should Storyboard remain?** **Yes**, as a concept — merged into the **Chapter Blueprint** as its pedagogical layer. It is the primary human-judgement artifact, not a linear prose stub.

3. **Should Knowledge Units be first-class persistent entities?** **No** — not as global domain entities. They exist as **structured rows in a per-chapter Knowledge Inventory** with chapter-local IDs and source anchors. Lightweight, not an ontology.

4. **Should Mechanisms be first-class persistent entities?** **No** — they are **structured content inside the Blueprint**, chapter-scoped, with chapter-local IDs. Not global, not independently versioned.

5. **Should Actors be first-class persistent entities?** **No** — same treatment as mechanisms.

6. **Should Clinical Patterns be first-class persistent entities?** **No** — structured content inside the Blueprint (clinical-reasoning nodes). Important for EDN, still chapter-scoped, not global entities.

7. **Should there be a Learning Model?** **Yes** — but **merged into the Blueprint**, not a separate persisted layer. The Blueprint *is* the structured learning model plus the pedagogical plan.

8. **What is the smallest useful Learning Model?** A chapter-scoped structure containing: the mental-model shape; an ordered set of mechanisms (each with the question it answers, ordered steps, causal links, involved actors); actors (role); clinical-reasoning links; and the teaching sequence with dependencies, confusion points, and visual intent — every element referencing Inventory IDs and source anchors. Nothing more.

9. **Should learning assets remain five fixed files?** **No** — they become an **open-ended set of projection types** derived from the Blueprint. Five is a fine initial set; the architecture must not hard-code the number.

10. **Should SVG generation read Markdown or structured learning data?** **Structured learning data (the Blueprint).** Firmly, not prose.

11. **Do we need stable IDs below chapter level now?** **Yes — but only chapter-local IDs** (knowledge points, mechanisms, actors). **Not** global cross-chapter IDs. This is the minimum for traceability and future spaced repetition without an ontology.

12. **Do we need a manifest?** **Yes** — a **generated** Chapter Package/manifest (projection registry, metadata, traceability graph, provenance). Never hand-authored.

13. **What exactly should be versioned?** The **source** (editioned); the **two curated artifacts** (Inventory, Blueprint) with human-approval stamps; the **compiler** (prompts/methodology and the visual system). Projections carry **provenance**, not hand-versioning. Renderer and learner/adaptive state are versioned independently.

14. **Where should human decisions live?** In the **two curated artifacts only** — the Knowledge Inventory (fidelity) and the Chapter Blueprint (pedagogy) — plus an **explicit override layer** for occasional projection fixes. Nowhere else; never in generated files.

15. **What is the single biggest architectural mistake to avoid?** **Generating each learner artifact directly from the source/prose with no structured intermediate** (equivalently, letting prose be the source of truth for structure). This is the one mistake that blocks consistent regeneration, QCM, flashcards, spaced repetition, multilingual, and traceability all at once. The opposite ditch — building a global medical ontology of persistent atomic entities — is the second-worst; the Blueprint is the deliberate middle path between them.

---

## 14. Final Architecture Diagram

```
                              IMMUTABLE
        ┌───────────────────────────────────────────────────┐
        │                 OFFICIAL SOURCE                    │
        │        (per edition · sole medical authority)      │
        └───────────────────────────────────────────────────┘
                              │
                 AI extract ──┤── HUMAN GATE 1: fidelity
                              ▼
        ┌───────────────────────────────────────────────────┐   CURATED
        │              KNOWLEDGE INVENTORY                   │   (proves coverage;
        │  knowledge points · chapter-local IDs · source     │    anchors + rank +
        │  anchors · EDN rank · coverage state               │    coverage state)
        └───────────────────────────────────────────────────┘
                              │
              AI structure ───┤── HUMAN GATE 2: pedagogy
                              ▼
        ┌───────────────────────────────────────────────────┐   CURATED
        │               CHAPTER BLUEPRINT                    │   (Storyboard +
        │  pedagogy: order · dependencies · questions ·      │    Learning Model,
        │  confusion points · analogies · visual intent      │    merged — the ONE
        │  understanding: mechanisms · actors · clinical      │    structured
        │  reasoning  (chapter-local IDs → Inventory/anchors) │    intermediate)
        └───────────────────────────────────────────────────┘
                              │
              AI generate ────┤   (all projections derive from the Blueprint)
                              ▼
        ┌───────────────────────────────────────────────────┐   GENERATED
        │                   PROJECTIONS                      │   (disposable ·
        │  story · overview · mechanisms · actors · clinical  │    provenance-
        │  reasoning · readiness · visuals · QCM* · cards*    │    stamped)
        └───────────────────────────────────────────────────┘   *added later
                              │
                     assemble ▼
        ┌───────────────────────────────────────────────────┐   GENERATED
        │            CHAPTER PACKAGE / MANIFEST              │
        │  projection registry · metadata · traceability     │
        │  graph · provenance · coverage invariant PASS      │
        └───────────────────────────────────────────────────┘
                              │
                              ▼
        ┌───────────────────────────────────────────────────┐
        │                    RENDERER                        │
        │   assembles experience · resolves references ·      │
        │   holds NO medical content                          │
        └───────────────────────────────────────────────────┘
                              │  learner events
                              ▼
        ┌───────────────────────────────────────────────────┐   FUTURE
        │               ADAPTIVE LEARNING                    │   (isolated learner
        │  reads events · attaches to knowledge-point IDs ·  │    state; never
        │  never writes the medical model                    │    writes content)
        └───────────────────────────────────────────────────┘

  Human touchpoints per chapter: 2 (Inventory, Blueprint)
  Global persistent entity: 1 (Chapter)
  Irreversible core: chapter identity · source anchoring · chapter-local ID granularity ·
                     curated/generated boundary · provenance · the Blueprint's existence
```

---

*End of convergence decision. This is the architecture Lou Learning Companion should adopt: two curated artifacts, one structured intermediate, disposable projections, chapter-local identity, two concentrated human gates. Conceptual only — no code, no roadmap, no repository changes beyond this document.*
