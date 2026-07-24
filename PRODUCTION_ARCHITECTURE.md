# Production Architecture — Lou Learning Companion

> A first-principles design of the architecture this repository should converge toward.
>
> This document treats `ARCHITECTURE_AUDIT.md` as the factual baseline and does not repeat it. It is a conceptual design: no code, no implementation tasks, no repository changes. Where it names a current file, it is only to anchor a concept, not to prescribe an edit.
>
> The organising question throughout is not "how do we fix what broke?" but "what is the smallest set of durable concepts that will still be right after 350 chapters, several languages, and years of AI-assisted regeneration?"

---

## 1. Executive Vision

Lou Learning Companion is not a content generator. It is a **compiler for medical understanding**.

The mental model that should drive every decision: the official medical college is *source code*; the learner experience is a *built artifact*; and everything in between is a deterministic-enough, re-runnable *build pipeline* whose inputs, transforms, and outputs are all explicit and traceable.

Three consequences follow immediately, and they are the spine of this architecture:

1. **Every generated artifact is disposable and reproducible.** Nothing generated is precious. If the pipeline, prompts, or visual system change, we can rebuild everything. This is what makes the project safe to evolve for years. The only irreplaceable things are the *official source* and the *human/curatorial decisions* layered on top of it.

2. **Understanding is a modelled domain, not a document layout.** The system's value is that it represents *how medicine is understood* — mechanisms, actors, causal chains, mental models — as first-class data, not as prose that happens to be shaped pedagogically. Prose and diagrams are *renderings* of that model.

3. **Traceability is a hard invariant, not a feature.** Every learner-facing claim must be attributable to an exact location in the official source. This is the trust contract with a real medical student sitting an exam. It cannot be bolted on later; it must be structural.

The system optimises, in priority order: fidelity to source → understanding before memorisation → reproducibility → adaptivity. When two of these conflict, the earlier one wins.

---

## 2. Guiding Principles

1. **Source is sacred; everything else is derived.** There is exactly one immutable input per chapter (the official college text). All else is a function of it plus explicit curatorial decisions.

2. **Separate the *knowledge model* from its *presentations*.** A mechanism exists as a concept with structure. Its Markdown explanation, its SVG, its flashcard, and its quiz are all *projections* of that concept. Never let a projection become the only place a fact lives.

3. **Traceability is a stored relationship, not a convention.** Links between artifacts must be explicit identifiers, never ordinal position or filename luck.

4. **Regeneration must be idempotent and layered.** Re-running any stage on unchanged inputs yields equivalent output. Human refinements live in a layer that regeneration respects rather than destroys.

5. **Pedagogy is data.** The sequence in which concepts are taught, the "why now," and the dependencies between ideas are structured information the system reasons over — not free text buried in a document.

6. **One concept, one owner, one source of truth.** Duplication is the enemy of a long-lived system. Overlap is resolved by choosing an owner and making everything else reference it.

7. **The learner experience is assembled, never authored directly.** No hand-written HTML pages of medical content. The experience is composed from modelled entities at view time.

8. **Design for the boring 350th chapter, not the exciting first one.** Any step that requires bespoke human judgement per chapter is a scaling liability and must be justified as genuinely irreducible.

9. **Prefer fewer, stronger entities over many weak ones.** Every entity must earn its place by being a real thing a medical educator would recognise, not an implementation artifact.

---

## 3. Domain Model

The audit revealed that the current "entities" are mostly *files and pipeline stages* masquerading as domain concepts (coverage, storyboard, five named assets). From first principles, the true domain is smaller and more conceptual.

### The core distinction

Entities fall into three tiers:

- **Anchor tier** — the immutable truth and its atomic knowledge. Never generated.
- **Understanding tier** — the modelled representation of *how* the medicine is understood. Curated + generated.
- **Presentation tier** — the projections learners actually consume. Always generated, always disposable.

Anything that is not clearly in one of these tiers is probably an implementation artifact.

### 3.1 Anchor tier

**Chapter (Item)**
- *Purpose:* the unit of curriculum. Corresponds to an official EDN item.
- *Lifecycle:* created once, effectively permanent; its official text is versioned when the college publishes a new edition.
- *Ownership:* the curriculum authority (the college); the system only ingests it.
- *Relationships:* contains Knowledge Units; is the scope for all Understanding- and Presentation-tier entities; links to sibling chapters (the "réflexes transversalité" in Item 234 are real cross-chapter edges).
- *Immutable:* yes, per edition.
- *Generated:* no.

**Source Passage**
- *Purpose:* an addressable location within the official text (a section, paragraph, table, or box). This is the *anchor for traceability* — the thing every claim points back to.
- *Lifecycle:* derived once from the source by segmentation; stable as long as the edition is stable.
- *Ownership:* system-owned index over source-owned text.
- *Relationships:* belongs to a Chapter; is referenced by Knowledge Units and by every claim in every projection.
- *Immutable:* yes (an addressing layer over immutable text).
- *Generated:* mechanically extracted, not pedagogically generated.

**Knowledge Unit**
- *Purpose:* the atomic examinable/learnable fact the college introduces (a definition, threshold, mechanism step, drug class, contraindication). This is the real concept behind the current `coverage.md` rows, and it is genuinely valuable.
- *Lifecycle:* extracted from the source; reviewed by a human once; then stable.
- *Ownership:* system-curated, human-validated.
- *Relationships:* anchored to one or more Source Passages; grouped into Mechanisms/Actors/Clinical Patterns; carries an EDN rank (rang A/B) which the source itself provides ("Hiérarchisation des connaissances").
- *Immutable:* the *inventory* is stable; individual units are corrected only when extraction was wrong.
- *Generated:* extracted (mechanical), then validated (human).

The Knowledge Unit is the **load-bearing entity of the whole system**: it is the granularity at which coverage is proven, at which assessment is targeted, and at which spaced repetition eventually schedules.

### 3.2 Understanding tier

These are the entities that make this project more than a summariser. They model *comprehension*.

**Mental Model (chapter-level)**
- *Purpose:* the single coherent "shape" of the chapter — the big picture a learner should hold before details. The `vue-ensemble` asset is a *projection* of this; the model itself is the connections between major concepts.
- *Lifecycle:* generated from the Knowledge Units and the pedagogical plan; refined by human.
- *Relationships:* references the major Mechanisms/Actors; is the root of the learning sequence.
- *Immutable:* no; regenerable.
- *Generated:* yes.

**Mechanism**
- *Purpose:* a causal/physiological process that answers one "why/how" question. This is the heart of "mechanism-based reasoning." It is a real domain concept and should be first-class.
- *Structure (why it must be modelled, not just prose):* an ordered set of steps/states, causal edges between them, the question it answers, its "delétère vs bénéfique" tensions, and the Knowledge Units it consumes. This structure is what a diagram, an explanation, and a quiz are all generated *from*.
- *Lifecycle:* generated + human-refined; stable identifier for life.
- *Relationships:* belongs to a Chapter; consumes Knowledge Units; involves Actors; may depend on other Mechanisms (prerequisite edges); is projected into explanation prose + visual + assessment.
- *Immutable:* identity yes, content regenerable.
- *Generated:* yes.

**Actor**
- *Purpose:* a participant in mechanisms (organ, cell, receptor, hormone, drug class, investigation). Answers "who/what is involved."
- *Relationships:* participates in Mechanisms; consumes Knowledge Units; projected into an actor card + visual.
- *Note:* Actor and Mechanism are the two orthogonal lenses on the same physiology — *processes* vs *participants*. Keeping both is correct; they cross-reference.

**Clinical Pattern**
- *Purpose:* the bridge from mechanism to the exam and the bedside — presentations, diagnostic reasoning, decision algorithms, therapeutic reasoning, "situations de départ." The current pipeline under-models this (it lives implicitly inside mechanisms and `pret`), but for an EDN system it deserves to be first-class: the exam tests clinical reasoning, not physiology recitation.
- *Relationships:* built on Mechanisms and Actors; anchored to Knowledge Units (signs, thresholds, red flags); the natural source for clinical-case assessment.
- *Generated:* yes.

**Learning Sequence / Pedagogical Plan**
- *Purpose:* the ordered dependency graph that decides *what is taught in what order and why now*. This is the true, de-implemented essence of "storyboard" (see Part 4).
- *Relationships:* orders Mechanisms, Actors, Clinical Patterns; expresses prerequisites; drives the Mental Model and the flow of the learner experience.
- *Generated:* proposed by AI, curated by human — the highest-judgement artifact in the system.

### 3.3 Presentation tier (projections)

All of these are **generated, disposable, and identified by the Understanding-tier entity they project**, never authored as standalone truth.

**Explanation** (Markdown prose for a Mechanism/Actor/Mental Model/Clinical Pattern), **Visual** (a diagram projecting a Mechanism's step graph or an Actor's role), **Assessment Item** (a question/QCM/clinical case targeting Knowledge Units and Clinical Patterns), **Memorisation Item** (flashcard/cloze derived from validated Knowledge Units).

- *Lifecycle:* regenerated freely; never the sole home of a fact.
- *Ownership:* system-generated; optionally human-overridden in an explicit override layer.
- *Immutable:* no. Fully disposable.

### 3.4 What disappears as a domain concept

- **"Coverage" is not an entity** — it is a *derived report/invariant*: "every Knowledge Unit is referenced by ≥1 Understanding entity." It becomes a computed guarantee, not a document to maintain.
- **The five fixed asset names** (`histoire`, `vue-ensemble`, `mecanismes`, `acteurs`, `pret`) are *presentation projections*, not domain entities. `histoire` is an intuition-building projection of the Mental Model; `pret` is an assessment projection of Clinical Patterns. Naming them as immutable pipeline stages over-fits to today's output.
- **"Figure/SVG" as a top-level artifact** disappears into *Visual = projection of a Mechanism/Actor*.

### Domain relationship sketch

```
Chapter ──contains──▶ Source Passage ◀──anchors── Knowledge Unit
   │                                                    │
   │                                        grouped into│
   ▼                                                    ▼
Learning Sequence ──orders──▶ Mechanism ◀─involves─ Actor ──▶ Clinical Pattern
   │                             │                              │
   ▼                             ▼ (projections)                ▼
Mental Model ───────────▶ Explanation · Visual · Assessment · Memorisation
```

---

## 4. Sources of Truth

The rule: **for each concept, exactly one owner; everything else references by identifier.** The audit's recurring failure (three visual docs, two storyboard schemas, colour SoT ambiguity, positional links) all reduce to violations of this rule.

| Concept | Single source of truth | Why it exists | Owner | Consumers | Why nothing else may duplicate it |
|---|---|---|---|---|---|
| Medical facts | **Official source text** (per chapter, per edition) | The trust anchor; the only medical authority | Curriculum authority (ingested) | Everything, transitively | Any duplicated medical fact can drift from the college → breaks the fidelity contract |
| Addressable locations | **Source Passage index** | Enables traceability | System | Knowledge Units, every claim | Two addressing schemes = ambiguous citations |
| Atomic knowledge | **Knowledge Unit inventory** | Coverage, assessment, and repetition all target it | System + human validation | Understanding entities, assessment, memorisation | Duplicated inventories diverge; coverage becomes unprovable |
| Teaching order & rationale | **Learning Sequence** | Encodes pedagogy as data | Human curator (AI-proposed) | Mental Model, learner flow, generators | If order is implied in multiple assets, they conflict (as `storyboard` vs assets do today) |
| Conceptual understanding | **Mechanism / Actor / Clinical Pattern models** | The modelled comprehension | System + human refinement | All projections | If prose *is* the model, regenerating prose loses the model |
| Visual language | **One design system** (tokens: colour, type, spacing, components) | Consistency across all visuals and UI | System | Visual generator, renderer, exports | The audit's three overlapping visual docs are exactly this violation |
| Diagram grammar | **Pattern + component library** (one, referenced by the design system) | How a concept becomes a shape | System | Visual generator | Two libraries = two visual dialects |
| Learner-facing metadata | **Chapter manifest** (derived) | Titles, objectives, reading order, projection registry | System (generated from models) | Renderer | Hand-maintained metadata drifts from content |
| Generation behaviour | **Prompt/methodology definitions** (versioned) | How each transform is performed | System | The pipeline | Divergent prompt copies produce inconsistent artifacts |

Two clarifications the audit makes necessary:

- **The design system owns visual tokens; the component library owns reusable shapes; patterns own the mapping from concept-type to shape.** These are three responsibilities but they must form a single authority chain (tokens ← components ← patterns), not three peers. The current `design-system.md` / `svg-style-guide-draft.md` / `svg/svg-style-guide.md` triad collapses into this one chain.
- **Coverage is not a source of truth.** It is a *verification query* against the Knowledge Unit inventory. Nothing should "own" a coverage file.

---

## 5. Learning Pipeline

Design goal: a directed, resumable pipeline where each stage has typed inputs/outputs, each edge is an explicit identifier relationship, and any stage can be re-run without corrupting human refinements downstream.

### 5.1 Stages, from source to learner

```
INGEST        Official source (per edition)
   │            → segmented Source Passages (addressable, immutable)
   ▼
EXTRACT       Knowledge Unit inventory (with EDN rank, passage anchors)
   │            → human validation gate  (the one mandatory human checkpoint upstream)
   ▼
MODEL         Understanding tier: Mechanisms, Actors, Clinical Patterns, Mental Model
   │            (AI-proposed structure; each element anchored to Knowledge Units)
   ▼
SEQUENCE      Learning Sequence (dependency graph + "why now")
   │            → human curation gate  (highest-judgement decision)
   ▼
PROJECT       Presentations: Explanations, Visuals, Assessments, Memorisation
   │            (all generated from the models; freely regenerable)
   ▼
ASSEMBLE      Chapter manifest + validated coverage + traceability graph
   ▼
EXPERIENCE    Renderer composes the learner experience from the manifest
   ▼
ADAPT         Learner interaction feeds scheduling/adaptivity (later)
```

### 5.2 Which of the audited stages survive, and why

- **Official College → survives, elevated.** Becomes formal *Ingest + Source Passage indexing*. Its immutability and addressability are promoted to first-class.
- **Coverage → survives as an invariant, not a stage.** Extraction of Knowledge Units is a real stage; "coverage" becomes a *proof* computed at Assemble time (every unit referenced ≥ once). The human validation of the inventory is the important part and is retained as a gate.
- **Storyboard → survives, reframed as Learning Sequence.** See Part 4. It moves from an unused document to the pipeline's decision core.
- **Learning Assets → survive as Projections, de-named.** The fixed five-asset list becomes a set of projection *types* over the model. New projection types (clinical cases, memorisation) can be added without changing the pipeline shape.
- **SVG Generation → survives, subordinated.** It is no longer a standalone stage producing orphan files; it is one projection type inside PROJECT, generated from a Mechanism/Actor's structured model and linked by identifier.
- **Renderer → survives, promoted.** From "markdown viewer" to "experience assembler" (Part 6).
- **New stage: MODEL.** The audit's deepest gap: there is currently *no representation of understanding* between raw knowledge and finished prose. Inserting an explicit modelling stage is the single most important structural change, because every downstream projection (diagram, quiz, flashcard) can then be derived from one coherent structure instead of re-interpreting prose each time.
- **New stage: ASSEMBLE.** Makes coverage-proof, manifest, and traceability graph first-class outputs rather than implicit.
- **New (later) stage: ADAPT.** Learner signals close the loop for spaced repetition and adaptivity. It reads Assessment/Memorisation results and Knowledge-Unit mastery; it never writes to the medical model.

### 5.3 Why this ordering is correct from first principles

- **Understanding precedes memorisation** is enforced *structurally*: memorisation items can only be projected from validated Knowledge Units that are already attached to a Mechanism/Clinical Pattern. You cannot generate a flashcard for a fact that hasn't been placed in a model.
- **Cause before consequence / one idea at a time** live in the Learning Sequence's dependency edges, so the same rule governs prose order, diagram order, and quiz progression.
- **Human judgement is concentrated at two gates** (inventory validation, sequence curation) — the two places where being wrong is expensive and where AI is least trustworthy — and removed from everywhere else, which is what makes 350 chapters feasible.

---

## 6. Storyboard — pedagogical role and future

Setting aside that it is currently unintegrated:

**What storyboard is *for*, educationally:** it is the answer to "in what order, and for what reason, should these ideas enter a mind that does not yet hold them?" That is the single most valuable and least automatable act in the whole system. A summariser can list facts; a *teacher* decides that you must understand the pump equation before compensations, and compensations before why they turn harmful, and that only *then* does OAP make sense. That ordering-with-rationale is the storyboard's essence.

**Should it remain?** Yes — but not as a document that mirrors the asset list. It should be reconceived as the **Learning Sequence**: a structured, curated dependency graph over the Understanding-tier entities, carrying for each node a learning goal and an explicit "why this comes now."

**How it should change:**
- From *prose template* → to *structured pedagogical graph* the system can reason over (order projections, gate memorisation, drive navigation, later drive adaptivity).
- From *bypassed* → to *the pivot of the pipeline*: it sits between MODEL and PROJECT, and every projection inherits its order and rationale from the sequence rather than re-deriving pedagogy independently (which is why today's assets each re-invent their own structure).
- From *one-schema-fits-all* → to a graph that can express prerequisites, optional depth, and multiple valid paths (foundational for adaptivity).

**Should something replace it?** No replacement — but a rename in spirit. "Storyboard" implies a fixed linear narrative; "Learning Sequence" (a dependency graph) better fits a system that will later personalise paths. The concept is essential; the linear-document framing is the accidental part to discard.

**Why this matters most:** if the Learning Sequence is data, then adaptivity, spaced repetition, and multi-path learning are natural extensions. If it stays prose, they are impossible without re-authoring every chapter.

---

## 7. Visual Architecture

The audited chain — Design System → Patterns → SVG Template → SVG Generator → Renderer — is **conceptually correct** and should be preserved in shape. Its problems are ownership and linkage, not structure. Restated as responsibilities:

- **Design System** — owns the *visual vocabulary*: colour tokens, typography, spacing, elevation, component definitions, accessibility rules. Single authority. Governs *both* diagrams and UI so they share one language. (Collapses the audit's three overlapping visual documents into one.)
- **Patterns** — own the *mapping from concept-type to visual structure*: a process-flow shape for a linear mechanism, a feedback-loop shape for a vicious circle, an actor-card for a participant, a comparison for two competing mechanisms. Patterns consume the design system; they do not redefine tokens.
- **Component Library** — owns *reusable, composable graphical parts* expressed in the design system's tokens. The generator composes from these; it never invents primitives.
- **Visual Generator** — a projection function: input is a *structured Mechanism/Actor model* (not prose), output is a Visual that selects a Pattern and composes Components. Because its input is structured, diagrams become consistent and re-derivable, resolving the audit's "no machine-readable mapping from Markdown to diagram."
- **Renderer** — displays Visuals as part of an assembled experience and resolves the *explicit* link between an explanation and its Visual by identifier (never by ordinal filename).

**The one required change in principle:** the visual generator's input must be the **Understanding-tier model**, not the finished Markdown. This is what makes visuals a true projection (regenerable, consistent, traceable) rather than a hand-interpretation of prose. Everything else in the chain stays.

Visuals must also carry their own **traceability and text alternative**: each Visual references the Mechanism/Actor it projects and the Knowledge Units it depicts, satisfying both the accessibility requirement and the fidelity contract.

---

## 8. Renderer Architecture

Reframe the renderer from "markdown-to-HTML viewer" to **experience assembler**: given a Chapter manifest and the learner's state, it composes an interactive learning experience from typed, addressable pieces.

Responsibilities (architecture, not frameworks):

1. **Resolve and assemble, don't author.** The renderer reads the manifest (which projections exist, in what sequence, with what metadata) and composes the view. It holds *zero* medical content of its own — the audit's legacy hard-coded HTML prototype is the anti-pattern to permanently reject.

2. **Understand projection *types*, not fixed tabs.** It renders by capability — prose, visual, interactive diagram, assessment, adaptive block — driven by the manifest, so new projection types appear without renderer surgery. (The current fixed `TABS` registry with a stale `pourquoi` and a missing `mecanismes` is the symptom of type-blind, hard-coded navigation.)

3. **Resolve embedded references by identifier.** Explanation-to-Visual, claim-to-Source-Passage, question-to-Knowledge-Unit are all resolved through explicit links, enabling "show me where this comes from in the college" and inline diagrams.

4. **Present only learner-facing content.** Generation scaffolding (purpose, progress, validation) is metadata, never rendered. The boundary between *content* and *content-about-content* is enforced at assembly.

5. **Own the learning-state interaction surface.** Navigation follows the Learning Sequence; progress, mastery, and answers are captured and emitted as events for the Adapt stage. The renderer is where the human loop is observed.

6. **Be projection-source-agnostic and mode-agnostic.** Preview, exam-prep, revision, and (later) AI-tutor conversation are modes over the *same* assembled model, not separate apps.

7. **Degrade honestly.** Missing/unbuilt projections are surfaced as known-absent states tied to the pipeline, not silent gaps.

The renderer is the *only* place the three tiers converge for a human, so its single architectural duty is faithful assembly with preserved traceability — never re-interpretation.

---

## 9. Scalability

Target: 350+ chapters, thousands of visuals, multiple languages, continuous AI regeneration, evolving curriculum. The architecture scales because of *what it refuses to do per chapter*, not because of any technology.

- **Per-chapter human cost is bounded and constant.** Only two human gates (Knowledge-Unit validation, Learning-Sequence curation). Everything else is generated. 350 chapters = 350 × (two bounded reviews), not 350 bespoke builds. Contrast the audited reality, where each asset re-invented its own structure — an O(chapters × assets) human burden.

- **Projections scale horizontally and independently.** Because every projection derives from the model by identifier, thousands of visuals/quizzes/flashcards are generated per-entity and in parallel. Regenerating the visual language re-derives all visuals mechanically; no chapter is touched by hand.

- **Regeneration is safe because generated = disposable.** Improving a prompt or the design system triggers a rebuild of affected projections. Nothing precious is lost because the *models and human refinements* live in a separate, referenced layer.

- **Languages are a projection axis, not a fork.** The Understanding tier (mechanisms, sequences, knowledge units) is largely language-independent structure; language becomes a rendering/projection parameter. One model → many localised presentations. This is only possible because meaning is modelled separately from prose.

- **Curriculum updates are diff-scoped.** A new college edition re-runs Ingest → Extract and produces a *diff of Knowledge Units*. Only affected Mechanisms/Sequences need re-validation; unaffected chapters are untouched. This requires the Source-Passage/Knowledge-Unit anchoring to be stable identifiers — which is why §3's anchor tier is non-negotiable.

- **Traceability scales because it is stored, not recomputed.** The link graph is built once at Assemble; "where does this come from" is a lookup, not a search.

**Where it could fail to scale, and the guard:** if any of coverage-proof, sequencing, or traceability were left as human prose (as today), cost becomes super-linear. The guard is Principle 8 — every per-chapter human step must be justified as irreducible; there are exactly two.

---

## 10. Versioning Strategy

The system has fundamentally different *rates of change* and *blast radii*, so versioning must be layered, not monolithic.

| Layer | Versioned? | Rate of change | Why | Rebuild consequence |
|---|---|---|---|---|
| Official source (per edition) | **Yes — immutable, editioned** | Rare (college republishes) | It is the anchor; must be able to say "as of edition X" | Triggers scoped re-extraction |
| Source Passage index | Tied to source edition | With source | Citations must remain valid per edition | Re-anchors changed passages |
| Knowledge Unit inventory | **Yes, with human-validation stamp** | Rare after validation | Coverage and assessment target it | Localised model review |
| Understanding models | **Yes** | Occasional (better pedagogy) | The curated comprehension | Re-projects affected presentations |
| Learning Sequence | **Yes** | Occasional | Pedagogy evolves | Re-orders experience; may reshuffle projections |
| Methodology / prompts | **Yes — the "compiler version"** | Frequent early, stabilising | Determines *how* everything is generated | Potential full rebuild of generated layer |
| Visual system (tokens/patterns/components) | **Yes** | Occasional | Global look; one change touches all visuals | Mechanical re-derivation of all Visuals |
| Generated projections | **Provenance-stamped, not hand-versioned** | Continuous | Disposable; identified by (model version × methodology version) | Regenerated, not merged |
| Renderer / experience | **Yes** | Independent | UI evolves separately from content | No content rebuild needed |
| Learning/adaptive model | **Yes, and per-learner state** | Continuous | Personal data with its own lifecycle | Never affects medical truth |

Principles:

1. **Version the compiler, stamp the output.** Prompts, methodology, and the visual system are versioned deliberately (they are the "how"). Generated artifacts are not hand-versioned; they carry *provenance* — which source edition, model version, and methodology version produced them — so any artifact is reproducible and its staleness is computable.

2. **Human decisions are versioned; machine output is regenerated.** The two human gates and any manual overrides are durable, first-class, and versioned. Everything downstream is a rebuild target.

3. **Reproducibility over storage.** Prefer being able to *rebuild* an artifact from (source edition + model + methodology) over preserving old generated files. This keeps the repository lean at 350 chapters.

4. **Separate content-truth versioning from experience versioning.** The renderer and adaptive model evolve on their own timelines and must never force medical re-validation.

5. **Learner state is sacred and isolated.** Personal progress/mastery is versioned and owned separately; regenerating content must never destroy a learner's history — mastery attaches to stable Knowledge-Unit identifiers, not to disposable projections.

---

## 11. Migration Principles

Guiding principles only — no checklist, no tasks.

### Fundamentally correct — preserve
- **Source-fidelity discipline** (official source as sole medical authority, immutability, no invention). This is the project's soul; keep it absolute.
- **The Knowledge-Unit idea** behind coverage — atomic, source-anchored, EDN-ranked facts. Preserve the *concept*; promote it from a checkbox document to the load-bearing entity.
- **Mechanism- and Actor-based framing** of physiology — these are real, durable domain concepts and already produce good pedagogy in the Item 234 assets.
- **The visual-authority chain** (design system → patterns → components → generator → renderer) — correct in shape.
- **A chapter-agnostic, content-free renderer shell** and the "assemble, don't author" instinct.
- **Prompt-as-methodology** — treating generation behaviour as explicit, reviewable specification.

### Should eventually disappear
- **Coverage and Storyboard as maintained documents** — become a computed invariant and a structured sequence respectively.
- **Fixed, named asset stages** as domain concepts — become projection types over the model.
- **Any positional/ordinal linkage** (filename-numbered figures, tab-index navigation) — replaced by identifier relationships.
- **Duplicated/overlapping authorities** (multiple visual docs, parallel coverage versions, hand-maintained header metadata) — collapse to single sources.
- **Hand-authored medical content in any presentation surface** — the legacy prototype pattern.

### Should evolve
- **Official College → Ingest + Source Passage index** (addressable, editioned).
- **Learning assets → projections derived from an explicit Understanding model.**
- **SVG generation → model-driven projection** (input = structured mechanism, not prose).
- **Renderer → experience assembler** with type-driven rendering and reference resolution.
- **Prompts → versioned compiler** with provenance stamping.

### Irreversible — handle with extra care
- **Identifier schemes for Chapter, Source Passage, Knowledge Unit, Mechanism, Actor.** Once learner mastery, spaced-repetition schedules, and the traceability graph attach to these IDs, changing them is catastrophic. Design them to survive edition changes and re-generation *before* any adaptive data exists.
- **The Knowledge-Unit granularity.** It fixes the resolution of coverage, assessment, and repetition; re-granulating later invalidates accumulated learner data.
- **The source-anchoring model for traceability.** The trust contract depends on it; retrofitting citations onto un-anchored content is effectively impossible at scale.
- **Separation of learner state from content.** If personal data ever entangles with generated artifacts, safe regeneration dies.

The through-line: **decisions about identity, granularity, and anchoring are the irreversible core; decisions about prose, layout, prompts, and tooling are all safely reversible.** Invest disproportionate care in the former and stay fearless about changing the latter.

---

*End of production architecture design. Conceptual only: no code, no implementation tasks, no repository modifications beyond creating this document.*
