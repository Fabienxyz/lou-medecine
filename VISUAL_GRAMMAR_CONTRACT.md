# Visual Grammar Contract

| | |
|---|---|
| **Type** | Normative architecture contract |
| **Status** | Ratified — partial. Schema deliberately not frozen |
| **Scope** | Project-wide (Lou Médecine), all chapters and specialties |
| **Owner** | Product |
| **Ratified** | 2026-07-24 |
| **Amended** | 2026-07-25 — §5.1 visual-first rule withdrawn and replaced by the walkthrough–visual asymmetry; §7.1 added. Evidence: `05-research/RESEARCH_LOG.md` Session 002 |
| **Evidence base** | `05-research/VISUAL_GRAMMAR_AUDIT.md`, `05-research/RESEARCH_LOG.md` |

---

# 0. Purpose, governance, and how to read this document

## 0.1 Purpose

This document defines how Lou Médecine produces learner-facing visuals: who decides *whether* a visual exists, who decides *what it means*, who decides *how it looks*, and what may never be true of any visual the system emits.

It exists because the audit established that visuals cannot be made reusable by adding renderers. They become reusable only when the *semantic relationship* a visual expresses is represented explicitly, separately from its appearance.

## 0.2 Governance

This contract is subordinate to `IMPLEMENTATION_CONTRACT.md` and `FINAL_ARCHITECTURE.md`, and specialises them for the visual layer. Where it appears to conflict with either, those documents govern and this one must be amended.

It is superior to any visual-related statement in `05-research/VISUAL_GRAMMAR_AUDIT.md`, `REFERENCE_IMPLEMENTATION_DESIGN.md`, `01-learning/templates/svg/svg-patterns.md`, or `01-learning/templates/svg/svg-style-guide.md`. Those documents describe evidence, prior design, or a prior pattern library; this document states the decision.

Nothing here authorises implementation. It states what implementation must satisfy when it is authorised.

## 0.3 Statement labels

Every substantive statement in this contract carries one of four labels. **The labels are part of the contract.** A statement's weight is defined by its label, not by its presence in this file.

| Label | Meaning | Changing it requires |
|---|---|---|
| **RATIFIED PRINCIPLE** | Decided now. Binding on all implementation. Holds across all chapters and specialties | An explicit amendment to this document, with recorded rationale |
| **CURRENT CORE CANDIDATE** | The best-evidenced starting set. Binding as a *starting point*, not as a closed taxonomy | Ordinary evolution under §4 |
| **IMPLEMENTATION HYPOTHESIS** | A working assumption to be tested by implementation. Not binding. Expected to change | New evidence from a vertical slice or a real chapter |
| **DEFERRED / REQUIRES EVIDENCE** | Deliberately not decided. Must not be treated as agreed | The named trigger occurring |

A reader who needs to know "is this settled?" should read the label first and the prose second.

---

# 1. Pipeline responsibilities

## 1.1 Separation of concerns — **RATIFIED PRINCIPLE**

Four layers exist. Each answers exactly one question and must not answer another's.

| Layer | Answers | Owns | Must never own |
|---|---|---|---|
| **Blueprint** | **WHETHER** a concept materially benefits from a visual, and **WHICH** semantic primitive is appropriate | Pedagogical intent. Human-curatable, minimal — an intent declaration per element | Node/edge content; any geometry; any styling |
| **visualSpec** | **WHAT** semantic and medical relationships are represented | Nodes, edges, lanes, stations, thresholds, bands, cells, poles, emphasis, grouping — and the traceability of each to Knowledge Points or to an explicit scaffolding class | Coordinates, dimensions, colours, fonts, or any renderer-specific geometry |
| **Projection** | **WHERE** the visual appears, and its **prominence / composition role** | Placement, ordering, dominance, and the surrounding text | The visual's semantic content; its appearance |
| **Renderer** | **HOW** it is laid out and styled | All geometry, layout, text measurement, styling, arrow routing, and emission | Any medical content whatsoever |

The single sentence form: **Blueprint decides whether and which; visualSpec decides what; projection decides where; renderer decides how — and only the renderer touches geometry, while only the visualSpec touches medical meaning.**

## 1.2 Canonical flow — **RATIFIED PRINCIPLE**

```
Official source
   -> Inventory                  (knowledge points + verbatim anchors)
   -> Reconciliation             (independent fidelity pass)
   -> Blueprint                  (elements; WHETHER + WHICH primitive)
   -> visualSpec                 (WHAT: semantic relationships + traceability)
   -> validation + grounding     (deterministic checks; semantic-unit grounding)
   -> deterministic renderer     (HOW: geometry and style only)
   -> SVG or semantic HTML       (generated, disposable)
   -> manifest / learner surface (bound by stable ID)
```

No stage may be skipped, and no stage may reach backwards past its immediate predecessor. In particular, a renderer may not read the Blueprint, the Inventory, or the source; it reads a validated visualSpec and nothing else.

## 1.3 Artifact durability — **RATIFIED PRINCIPLE**

| Artifact | Durability | Auditable source of visual meaning? |
|---|---|---|
| Blueprint intent declaration | Curated, durable | Partially — it states intent, not content |
| visualSpec | Generated, persisted, committed | **Yes — this is the auditable source** |
| Rendered SVG / HTML component | Generated, disposable derivative | No |

Rendered assets may be deleted and regenerated at any time. A visual's *meaning* is reviewed by reading its specification, never by reading its rendered output.

---

# 2. Non-negotiable invariants

All statements in this section are **RATIFIED PRINCIPLE**. They bind every primitive, every renderer, and every chapter, present and future.

### I1 — Renderers contain zero authored medical content

No renderer may emit any learner-visible string that does not originate in the visualSpec. Renderers must not contain medical vocabulary, disease names, thresholds, units bound to clinical meaning, or explanatory sentences. This is mechanically enforceable and must be enforced.

### I2 — Every learner-visible semantic unit traces or is explicitly scaffolding

Each node, edge, lane, station, threshold, band, cell, pole, label, and annotation must carry either one or more Knowledge Point references, or an explicit scaffolding class. There is no third state. Absence of both is a validation failure, not a default.

Scaffolding units are pedagogical aids, are never presented as sourced medical knowledge, and must remain visually and structurally distinguishable from sourced content.

### I3 — visualSpec contains zero geometry

No coordinate, pixel dimension, colour, font, stroke, spacing value, or renderer-specific layout directive may appear in a visualSpec. Semantic ordering, semantic grouping, semantic lanes, and semantic emphasis are permitted because they express meaning, not appearance.

Working test: **if a field's value is a number in pixels, it is a defect.**

### I4 — Renderers must never silently truncate learner-visible text

Silent truncation can invert medical meaning by removing a qualifying clause. It is prohibited unconditionally.

### I5 — Overflow fails validation or triggers deterministic layout adaptation

When content does not fit, the system must either fail validation with an actionable message, or adapt layout deterministically (reflow, rescale, re-lane, re-wrap). It must never resolve overflow by discarding semantic content. Layout adaptation must be deterministic and reproducible.

### I6 — Exact medical thresholds and numbers require deterministic source-anchor verification

Where a visual asserts an exact numeric value carrying medical meaning, that value must be verified deterministically against a source anchor. This check is mechanical, not judgemental, and gates the build.

Where a numeric value is not a sourced medical claim (an axis tick, an ordinal index), this requirement does not apply, and the specification must make the distinction explicit.

### I7 — Visuals bind by stable ID, never by ordinal position

Binding a visual to content by filename ordinal, array index, or heading order is prohibited. All binding is by stable identifier through the manifest.

### I8 — Visuals exist because structure adds cognitive value

A visual is generated because spatial or relational structure materially improves understanding — never because a section exists, and never because a chapter should "have diagrams." Absence of a visual is a legitimate and frequently correct outcome.

Working test: if a proposed visual contains no arrow, no axis, and no spatial adjacency that carries meaning, it is not a diagram.

### I9 — SVG, HTML/CSS, tables, and structured text are all first-class outcomes

The system produces a *visual grammar*, not an SVG pipeline. Choosing semantic HTML, a table, or plain structured text is a full success of the grammar, not a fallback from it. Rendering technology is a property of each primitive, decided on cognitive and accessibility grounds.

### I10 — The grammar is open and extensible

The CORE set is a starting point, not a closed EDN taxonomy. The architecture must allow a future chapter to introduce a genuinely new primitive by adding one schema and one renderer, without redesign of the pipeline, the manifest, or the validation model.

### I11 — Content is never forced into the closest primitive

If no primitive represents a relationship without semantic distortion, the content must not be bent to fit. A quarantined `special` / custom escape hatch must remain available.

Escape-hatch use must be **measurable**: recorded in the manifest, counted, reported per chapter, and excluded from reuse metrics. It is a signal, not a failure — but an unmeasured escape hatch is prohibited.

### I12 — Rendered assets are disposable; specifications are the auditable source

Regeneration is always permitted and must be idempotent. A change to visual styling must produce zero specification diffs. A change to medical meaning must appear as a specification diff.

---

# 3. Initial CORE V1 candidates

## 3.1 Status — **CURRENT CORE CANDIDATE**

The following six are ratified as the current evidence-backed CORE candidates. They are the starting set for implementation.

| Primitive | Cognitive job | Learner question | Rendering technology |
|---|---|---|---|
| `causal-graph` | Directed, typed causal influence between states, including divergence, convergence, and self-reinforcement | *Why does this happen? What makes it worse?* | SVG |
| `transmission-path` | Propagation of one quantity or agent through ordered stations, optionally along parallel routes | *Where does it go? Which route? How do two routes differ?* | SVG |
| `threshold-scale` | Partition of a continuum by named cut-offs into bands with different meaning | *At what value does the meaning change?* | SVG, standalone or embedded |
| `contrast-pair` | Discriminating comparison of poles across shared dimensions | *What distinguishes A from B, and why does it matter?* | Semantic HTML/CSS |
| `decision-algorithm` | Conditional branching toward an action or conclusion | *What do I do next? When does the decision change?* | SVG |
| `profile-matrix` | Simultaneous classification on two independent axes | *Which situation am I in, and what does that imply?* | Semantic HTML/CSS |

## 3.2 Explicit limitation — **RATIFIED PRINCIPLE**

**These six are not claimed to cover all EDN visual needs.** They are the smallest set the current evidence supports, drawn from one chapter's legacy corpus, one chapter's canonical Blueprint, and structural reasoning across specialties. The audit's own stress test found relationships they do not cover.

Any statement that the grammar is "complete" is out of contract.

## 3.3 Recorded merge and split decisions — **IMPLEMENTATION HYPOTHESIS**

Two boundary decisions are recorded so they can be revisited deliberately rather than rediscovered.

- **`feedback-loop` is merged into `causal-graph`**, as a back-edge with an edge kind, on the grounds that the data contract is identical. Revisit if a chapter requires multiple interacting loops.
- **`transmission-path` is kept separate from `causal-graph`**, on the grounds that the learner question, the node semantics (places, not states), and the edge semantics (movement, not causation) all differ. This is the least-confident boundary in the set and should be re-examined after a second chapter.

Both are hypotheses to be tested, not settled architecture.

## 3.4 Per-primitive data contracts — **DEFERRED / REQUIRES EVIDENCE**

The mandatory and optional fields for each primitive are not frozen by this contract. See §6.

---

# 4. Primitive evolution rule

## 4.1 The rule — **RATIFIED PRINCIPLE**

A new CORE primitive should be introduced when **either** condition holds:

1. **Recurrence** — the relationship is demonstrated across multiple chapters or domains; **or**
2. **Irreducibility** — a cognitively distinct relationship cannot be represented by an existing primitive without semantic distortion.

These are alternatives, not cumulative requirements. **"Must appear in two chapters" is explicitly not an absolute rule.** A single, clearly irreducible relationship is sufficient grounds on its own.

## 4.2 Role of the escape hatch — **RATIFIED PRINCIPLE**

The `special` escape hatch (I11) exists specifically to prevent semantic distortion while evidence accumulates. It is the correct response to an unmet need: use it, count it, and let the count inform promotion. It is never correct to distort content into the closest primitive because no better one exists yet.

## 4.3 Tests to apply before promoting — **IMPLEMENTATION HYPOTHESIS**

A candidate is a genuine primitive, rather than a visual style of an existing one, when it has **both** a different learner question **and** a different data contract. A candidate that shares a data contract and differs only in appearance must be expressed as a variant of the existing primitive.

## 4.4 Retirement — **RATIFIED PRINCIPLE**

Primitives may also be retired or merged. A primitive that is never selected across a meaningful number of chapters, or that is always co-selected with another, is a candidate for removal. Grammar growth is not one-directional.

---

# 5. Composition principles

## 5.1 The walkthrough–visual asymmetry — **RATIFIED PRINCIPLE**

**Amendment 2026-07-25.** This section previously ratified a **visual-first** composition rule, whose operative clause read: *"Text is subordinate to and explanatory of the visuals."* Live testing with Lou established the opposite ordering, and that clause is **withdrawn**. Evidence: `05-research/RESEARCH_LOG.md` Session 002. The pairing the old rule anticipated was right; its assignment of primacy was wrong.

Every learner-facing visual belongs to a **pedagogical block** (`IMPLEMENTATION_CONTRACT.md` Part B) and the relationship inside that block is deliberately asymmetric:

- **The Guided Walkthrough is the canonical explanation** of a Blueprint element, and is complete on its own.
- **The Official Visual is optional pedagogical support, and is never the primary explanatory artifact.** It may not carry explanatory content absent from the walkthrough of the same block.

Two consequences bind implementation. **Absence is not a defect:** a block with no visual is complete and valid, and the walkthrough then explains the reasoning itself rather than walking through a figure — this is I8 applied to composition. **Failure is not fatal:** a visual that fails validation, grounding or render-eligibility is withheld and reported, and does not withhold the walkthrough from the learner (`IMPLEMENTATION_CONTRACT.md` C.6/C.7).

**"Official Visual" is the architectural term, and it is a category rather than a diagram type.** It covers the specification-generated primitives of §3 today, and would cover anatomical illustrations, radiological images and ECGs if the asset-referenced mode of §7 were ever built. The pedagogical model must not be coupled to the word "diagram"; a diagram is one implementation of an Official Visual.

| Projection | Composition role |
|---|---|
| **Overview** | One dominant Official Visual for the chapter's mental model, optionally with a small number of compact supporting visuals. Visuals compress structure; they never decorate prose. The walkthrough remains canonical |
| **Pourquoi ?** | Selective mechanism and causal visuals, where the relationship itself is the lesson. Explicitly **not** one visual per section, and explicitly not one per block |
| **Raisonnement clinique** | Algorithms, matrices, and contrasts where decision structure benefits from being shown rather than described |
| **Histoire** | Primarily narrative. Optional scaffolding illustration only where useful; never adjacent to sourced medical claims; excluded from grounding |

## 5.2 Numeric budgets — **IMPLEMENTATION HYPOTHESIS**

**No universal numeric visual caps are frozen by this contract.**

For the first validation chapter, "one dominant visual plus up to roughly three compact supporting visuals" in the Overview is adopted as a **design hypothesis** to be tested against a real learner. It is not an EDN-wide invariant, and it must not be cited as one.

Chapters of different size, density, or structure may reasonably need different compositions. If a durable numeric rule emerges from evidence, it should be ratified then — not now.

**Reframed 2026-07-25.** The §5.1 amendment reduces the pressure these budgets were defending against. Once a pedagogical block is complete without a visual, nothing structural pushes toward manufacturing one per section; the question becomes *which elements warrant a visual at all*, which is I8's question and already ratified. The numeric hypothesis is therefore less load-bearing than when it was written. It stays a hypothesis — neither promoted nor discarded.

## 5.3 Sharing and reuse — **RATIFIED PRINCIPLE**

One visual may serve several Blueprint elements, and frequently should. Element count is not a target for visual count. Cognitive compression, not coverage, is the objective.

## 5.4 Composition budgets as a structural defence — **IMPLEMENTATION HYPOTHESIS**

Enforcing a per-projection budget at packaging time is the most promising structural defence against one-visual-per-section proliferation. Whether the budget should be a hard gate or a reported metric is not yet decided.

Given §5.1, a **reported metric** is now the more likely correct answer: a hard gate would have to refuse a visual that a block does not need in the first place, and the block's completeness without a visual already removes the incentive to inflate. Still undecided; recorded so the reasoning is not lost.

---

# 6. visualSpec status

## 6.1 The architectural need is ratified — **RATIFIED PRINCIPLE**

An explicit semantic intermediate representation between the Blueprint and the renderer is **required**. Generating visuals directly from Blueprint prose is rejected, on evidence: without an intermediate, a renderer must infer semantics it cannot see, and compensates by hard-coding chapter-specific content — which is what the current implementation does.

## 6.2 The intended model — **RATIFIED PRINCIPLE**

The visualSpec is:

- **Generated** — produced by the pipeline from the Blueprint and Inventory, never hand-authored as routine practice;
- **Persisted and committed** — a durable, diffable, reviewable artifact, on the lockfile model;
- **Machine-validated** — schema, referential integrity, structural budgets, and anchor verification all gate the build deterministically;
- **Grounded at fine-grained semantic-unit level** — each node, edge, threshold, band, cell, and label enters the existing claim-block grounding mechanism rather than a parallel one;
- **Renderer-independent** — the same specification must be renderable to more than one target, and must contain nothing that presumes a target.

## 6.3 The schema is NOT frozen — **DEFERRED / REQUIRES EVIDENCE**

**This contract deliberately does not define the visualSpec schema.**

Field names, structure, file layout, file granularity (one file per element versus one per chapter), serialisation format, versioning scheme, and per-primitive contracts are all open. Any schema sketch appearing in the audit is illustrative only and carries no normative weight.

**Trigger for freezing:** the schema becomes normative only after it has been validated by a first vertical implementation slice that exercises at least one primitive end to end — specification, validation, grounding, deterministic rendering, and manifest binding. Whatever survives that slice is ratified by amendment to this document.

## 6.4 Human override channel — **IMPLEMENTATION HYPOTHESIS**

Human correction of a generated specification is expected to be possible but exceptional, and is expected to live in a separate, diffable override channel rather than by editing generated output in place, so that drift stays visible. The mechanism is not yet specified.

Routine hand-editing of specifications is a warning sign that the primitives are insufficient. Hand-edit frequency should be measured, not merely tolerated.

**Not to be confused with the learner layer.** This channel is for *authoring* — a human correcting generated specification content, which then feeds generation. It is entirely distinct from the two learner mechanisms of `IMPLEMENTATION_CONTRACT.md` C.8/C.9. A **Personal Diagram** is a photograph of the learner's own drawing kept beside an Official Visual; it never replaces, edits or overrides the Official Visual, and no pipeline pass reads it. **Inline Notes** annotate a Guided Walkthrough and likewise never modify it. Implementing either as an override channel would break the immutability of generated content and must not be done.

## 6.5 Determinism boundary — **RATIFIED PRINCIPLE**

| Concern | Mode |
|---|---|
| Choosing whether a visual is warranted, and which primitive | AI proposes; human may override |
| Extracting semantic units and their relationships | AI, deterministically verified |
| Assigning traceability references | AI, deterministically verified |
| Exact medical numbers | AI proposes; deterministic anchor verification gates |
| Layout, text measurement, styling, geometry, emission | **Deterministic. No AI at render time, ever** |
| Validation | Deterministic, except grounding, which is an AI pass whose uncertainty is a first-class output |

A generator may never self-certify its own output.

---

# 7. Extended candidates — recorded, not implemented

**Status: DEFERRED / REQUIRES EVIDENCE** for every entry below. Recording a candidate here is not a commitment to build it, and confers no priority.

| Candidate | Cognitive job | Trigger that would justify promotion |
|---|---|---|
| `timeline` / natural-history trajectory | Succession of phases over time, including non-monotonic trajectories | A chapter where temporal phases are the primary content. Currently the most likely first promotion |
| `anatomical-schematic` | Spatial localisation and adjacency | An anatomy-dominant chapter, **and** a separately resolved decision on curated base artwork. Not deterministically generable from a specification alone |
| `entity-card` | Entity identity, role, and salient facts | Reintroduction of actor-type elements into the Blueprint. **Advance ruling: HTML, never SVG** |
| `quantity-decomposition` | A quantity and its determinants | A genuinely multi-level determinant tree |
| `physiological-curve` | Continuous non-linear relationships | A chapter requiring curve data the Inventory does not currently carry |
| `hierarchy` / classification tree | Genuine multi-level nesting | Nesting of three or more real levels |
| `signalling-cascade` | Receptor → transduction → effect | Evidence that its contract genuinely differs from `causal-graph` |
| `pedigree` | Inheritance patterns | A genetics chapter |
| `procedure-sequence` | Ordered technical steps | Evidence that it differs from a branch-free `decision-algorithm` |
| `imaging-annotation` | Interpretation of a real image | A resolved image-licensing path |

Two structural cautions are recorded with these:

- `anatomical-schematic` and `imaging-annotation` are **asset-pipeline problems** as much as grammar problems. Admitting either to CORE without resolving asset sourcing would import an unbounded commitment.
- Using `causal-graph` to represent temporal succession is **semantically wrong**, not merely suboptimal, because it asserts causation where only succession exists. Until `timeline` exists, temporal content should use the escape hatch or non-diagram representations.

## 7.1 Asset-referenced Official Visuals — **DEFERRED / REQUIRES EVIDENCE**

The Official Visual category (§5.1) admits kinds that are **not derivable from a specification**: anatomical illustrations, radiological images, ECG traces. These are recorded here, and **not implemented**. Only the specification-generated mode is in scope.

The reason is not squeamishness about scope; it is that an imported asset breaks four ratified statements at once, and each break needs its own answer before any such visual may ship:

| Statement | What an imported asset does to it |
|---|---|
| §1.2 canonical flow | A renderer reads a validated visualSpec *and nothing else*. An external asset must therefore enter *through* the specification, never by the renderer fetching an image |
| §1.3 artifact durability | The rendered asset is a "generated, disposable derivative". A sourced image is neither generated nor disposable — it is a fourth artifact class with its own lifecycle |
| I3 geometry exclusion | An image *is* geometry. What the specification can own is the annotation over it, not the pixels |
| I6 numeric verification | Medical assertions carried by an image cannot be verified deterministically against a verbatim source quote. The grounding model for image-borne claims is unresolved |

Plus the unresolved licensing path already noted for `imaging-annotation` above.

**Promotion trigger:** a chapter whose understanding genuinely depends on a real image, **and** a resolved decision on asset sourcing, licensing, durability class, and how an image-borne claim is grounded.

**Why deferring is cheap.** Under §5.1 a pedagogical block is complete without any visual. A chapter that would benefit from an ECG still has its canonical explanation in the Guided Walkthrough, so deferring costs understanding nothing and avoids importing the unbounded commitment cautioned against above.

---

# 8. Deliberately not frozen

This section exists so that silence is not later mistaken for agreement. Each item is **DEFERRED / REQUIRES EVIDENCE**.

| Not frozen | Why | What would settle it |
|---|---|---|
| The visualSpec schema | Must survive contact with implementation before becoming normative | A first end-to-end vertical slice |
| Per-primitive mandatory/optional field sets | Same | Same |
| Persistence granularity and file layout | No evidence favours one arrangement | The vertical slice |
| Universal numeric visual caps | One chapter is not enough to generalise | Learner testing across several chapters |
| Whether composition budgets are hard gates or reported metrics | Unknown which produces better behaviour | Observation over several chapters |
| Whether `transmission-path` and `causal-graph` remain distinct | The least-confident boundary in the CORE set | A structurally different second chapter |
| Wave contents and ordering beyond the enabling prerequisite | Sequencing is an implementation hypothesis | The vertical slice |
| The human override mechanism | Not yet needed | First real need for an override |
| The fate of the existing 61 legacy assets | Classified in the audit, not actioned | A separate, explicit decision |
| Whether the legacy pattern library and style guides are superseded or amended | Out of scope for this contract | A follow-up documentation decision |
| Whether the asset-referenced Official Visual mode is built at all (§7.1) | Four ratified statements and a licensing path would each need an answer first, and a block is complete without a visual | A chapter whose understanding genuinely depends on a real image, plus a resolved asset-sourcing decision |

---

# 9. First validation case

**Status: IMPLEMENTATION HYPOTHESIS.** Not authorised by this document.

Item 234 (`cardio/234`) is designated the first validation case for this contract, because it is the only chapter with a complete canonical Inventory, Blueprint, projections, and grounding.

The intended first experiment, when authorised separately, is:

```
MM-pump-decompensation
   -> causal-graph visualSpec
   -> validation + grounding
   -> deterministic rendering
   -> Overview integration
```

Its purpose is to test the *contract*, not to produce a diagram. The slice succeeds if it demonstrates that a semantic specification can be generated, reviewed for medical correctness without rendering, validated deterministically, grounded at semantic-unit level, and rendered without any medical content residing in the renderer.

**No chapter-specific medical content belongs in this contract.** The element identifier above is a pipeline reference, not a medical claim. Anything specific to heart failure lives in the chapter, and the evidence for it lives in the audit.

---

# 10. Amendment

**RATIFIED PRINCIPLE.** This contract is amended by editing this document, changing the affected statement's label, and recording the evidence that justified the change.

Recorded amendments:

- **2026-07-25 — §5.1.** The visual-first composition rule was withdrawn on learner evidence and replaced by the walkthrough–visual asymmetry; §5.2 and §5.4 were reframed in consequence and §7.1 was added. This is the first instance of the label-weakening path below, and it went as intended: a ratified statement met contrary evidence and was rewritten rather than defended.

Expected amendment points, in likely order:

1. Freezing the visualSpec schema after the first vertical slice (§6.3).
2. Promoting or retiring CORE candidates under the evolution rule (§4).
3. Ratifying or discarding the composition budget hypotheses (§5.2, §5.4).
4. Resolving the `transmission-path` / `causal-graph` boundary (§3.3).

A label may be strengthened (hypothesis → ratified) only with recorded evidence. A label may be weakened (ratified → hypothesis) whenever evidence contradicts it; discovering that a ratified principle was wrong is a normal outcome and must not be resisted for consistency's sake.
