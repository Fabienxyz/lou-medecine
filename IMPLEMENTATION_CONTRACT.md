# Implementation Contract — Lou Learning Companion

> The pre-implementation contract. Builds directly on `FINAL_ARCHITECTURE.md` (the architectural baseline), which in turn rests on `ARCHITECTURE_AUDIT.md` (facts) and `PRODUCTION_ARCHITECTURE.md` (first principles). This document does not re-open the architecture; it makes it *precise enough to build* by fixing the minimum obligations of each component and by settling the requirements the baseline left underspecified.
>
> **Where this contract and the baseline conflict, this contract governs.** In particular it supersedes the baseline's two mandatory *human* validation gates (the "fidelity" gate on the Knowledge Inventory and the "pedagogy" gate on the Blueprint) wherever they imply a human must certify medical correctness. No physician reviews chapters, Lou is a medical student, and the project owner is not medically qualified; the architecture therefore must not depend on any human being able to judge whether medical content is correct, whether an important medical fact was missed, or whether a classification/rank is sane. Medical reliability is achieved by an **automated source-fidelity assurance** process (A.1); the human role is reduced to what Lou and the owner can actually judge — clarity, cognitive load, usefulness, confusing material, and inspection of machine-flagged exceptions.
>
> Conceptual only: no application code, no repository changes beyond creating this file, no implementation roadmap.
>
> Priority order, fixed for every rule below and inherited from the baseline:
> **1. fidelity to the official College source → 2. deep understanding before memorisation → 3. no dependency on unavailable expert medical reviewers → 4. manageable cognitive load → 5. exhaustive detail preserved for later mastery → 6. safe handling of new College editions → 7. reproducibility and traceability → 8. simplicity across 350+ chapters.** When two conflict, the earlier wins.

Illustrative structured fragments in this document use a compact key/value form only to make relationships unambiguous. **The exact serialization (Markdown front-matter, YAML, JSON, headings) is deliberately left reversible** per `FINAL_ARCHITECTURE.md` §12. What is contractual is *which relationships must exist and be machine-traversable*, not their syntax.

---

## Part A — The three governing requirements

These three requirements cut across every component. They are stated once here and then referenced by the component contracts in Part C.

### A.1 Medical reliability without an expert reviewer

**The trust model.** No physician reviews generated chapters, and neither Lou nor the project owner can validate medical correctness. Therefore the system may not define correctness as "a human confirmed it is medically true." It defines correctness as **faithfulness to the official College source**: the College text is the sole curricular medical authority, and every medical statement the learner sees is trustworthy *exactly to the degree it is traceable to, and consistent with, that source.* This reframing is what makes the project safe without a doctor: we are not asking anyone to judge medicine, only to preserve a source.

Five obligations follow, each assigned to a component and each checkable without medical expertise:

- **Completeness** — no important source information is silently dropped. Enforced by the Knowledge Inventory (every examinable fact becomes a row) *and by an independent coverage reconciliation* (below) that works section-by-section, plus a packaging invariant: every knowledge point must have a declared disposition (projected into understanding, deferred to mastery, or explicitly excluded with a reason), and every relevant source segment must have an explicit disposition (represented / deferred / excluded-with-justification / missed / ambiguously-mapped). A missing disposition, or an unresolved *missed*/*ambiguous* disposition above threshold, fails the build. Completeness is thus *proven by construction and cross-checked by an independent pass*, not attested by a human checkbox.
- **Grounding** — every generated medical statement is supported by the source. Enforced by requiring each understanding claim block (Part B) to reference at least one knowledge point, and by a **separate grounding check** (Part B) that compares the generated claim block against that knowledge point's quoted source anchor. Unsupported or ambiguous content is flagged rather than silently accepted.
- **Traceability** — every learner-facing claim block resolves back to an exact source location. Enforced by the stored reference chain `source anchor ← knowledge point ← Blueprint element (where applicable) ← projection claim block`, materialised in the manifest (never recomputed, never positional).
- **Consistency** — no projection contradicts the source or the curated chapter content. Enforced by a checker that verifies numbers, thresholds, and classifications in a projection match the referenced knowledge point (e.g. a threshold in prose equals the threshold in its knowledge point).
- **Uncertainty** — content that cannot be reliably supported is never presented with false confidence. Enforced by an explicit **claim class** on generated claim blocks (below) and a conservative fallback (below).

**Automated source-fidelity assurance (this replaces any human fidelity gate).** Because no qualified human can certify medical correctness, fidelity is assured by a two-direction, machine-run process that never relies on a single generation pass:

1. **Independent extraction.** `Official Source → Knowledge Inventory` is one pass: extract every examinable fact into anchored knowledge points.
2. **Independent coverage reconciliation.** A *separate* pass takes `Official Source + the generated Knowledge Inventory` and, **section-by-section**, assigns every relevant source segment exactly one disposition: **represented** (a knowledge point covers it), **intentionally deferred** (captured but routed to mastery), **excluded with justification** (out of scope, reason recorded), **missed** (no knowledge point covers it — a fidelity defect), or **ambiguously mapped** (a candidate mapping exists but the reconciliation pass is not confident). This pass ideally uses a different prompt/model from extraction, so it can disagree with the extractor. The goal is that *every relevant source segment has an explicit disposition* — completeness becomes a reconciled property, not a self-declared one.
3. **Grounding assurance.** Generated structured knowledge and projections must stay traceable to source evidence (the traceability chain, Part B). Content that cannot be tied to a source anchor, or whose mapping is ambiguous, is **flagged**, never silently accepted.

**When no qualified human can resolve an ambiguity, the system behaves conservatively.** For a *missed* or *ambiguous* disposition, or a failed grounding check, the pipeline prefers — in order — closer-to-source wording, broader re-analysis (re-run extraction/reconciliation or re-curate the affected Blueprint scope), explicit statement of uncertainty, or withholding the interpretation entirely. It must never manufacture certainty. If unresolved *missed*/*ambiguous* dispositions or grounding failures exceed a chapter threshold, packaging fails and the chapter is held rather than shipped.

**Generation and checking are separate processes.** The generator's job is to produce a projection from the Blueprint. A distinct checking pass — different prompt, ideally a different model invocation, run *after* generation and given the source anchors — judges grounding and consistency. A generator marking its own work as correct is not evidence (this is exactly the failure the audit found: assets that declared `✅ 100%` and "consistent with the storyboard" when no storyboard existed). Checking must be able to *fail* and block packaging.

**Claim classes (the uncertainty mechanism).** The unit that carries a class and a traceability reference is the **claim block** (defined in Part B), *not* every individual sentence. Every claim block in an understanding projection is one of exactly three classes, and the class is explicit:

1. **Sourced** — a restatement of College content; must carry a knowledge-point reference and pass the grounding check.
2. **Pedagogical scaffolding** — an analogy, framing, or simplification introduced to aid understanding (e.g. the "ville et sa pompe" analogy in `histoire.md`). It is *not* attributed to the College, is clearly presentable as intuition, and is never grounding-checked as if it were a fact — but it also may not contradict a sourced claim.
3. **Bridging inference** — a causal or explanatory link the learner needs but the source does not state verbatim (e.g. "therefore the ventricle ejects against a higher afterload"). Allowed only when the grounding check judges it entailed by the referenced knowledge points. If not entailed, it is downgraded.

**Conservative fallback (contractual).** When a needed statement cannot be reliably supported by the source, the pipeline must, in order of preference: (a) **omit** it; (b) **restate it as an explicit open/pedagogical framing** clearly not attributed to the College; or (c) **fall back to quoting the source** and stop interpreting. It must never emit an unsupported interpretation as a sourced fact. If grounding failures exceed a threshold for a chapter, packaging fails and the chapter is held rather than shipped. **Prefer omission and honest gaps over confident fabrication.**

**Human feedback is bounded to what Lou and the owner can actually judge, and is never a medical gate.** Feedback is captured on *clarity, cognitive load, usefulness, confusing explanations, and usefulness of diagrams* — never on medical correctness. Lou and the owner may additionally **inspect machine-flagged exceptions** (missed/ambiguous dispositions, grounding flags) and give *clarity* feedback on them, but they are **not required to certify** that a fact is medically true, that nothing important was missed, or that a rank is sane. Feedback attaches to projection or Blueprint-element identifiers and triggers **regeneration, re-reconciliation, or Blueprint re-curation**, not in-place edits of medical facts. It is a projection-quality signal, not a medical-authority signal, and the build never blocks waiting for a human to vouch for correctness.

This is the whole QA system, and it is deliberately small: an inventory that captures completeness, an *independent coverage reconciliation* that cross-checks it section-by-section, a claim-block discipline that prevents false confidence, one separate checking pass for grounding/consistency, a stored traceability chain, and a conservative fallback. No ontology, no external reviewer, no mandatory human medical validation, no correctness oracle beyond the College text.

### A.2 Updating chapters when a new College edition appears

The system must ingest successive College editions where usually only part of a chapter changes, and update **only the affected parts** when that can be done safely.

**Four concepts are kept strictly distinct** (this separation is the core of safe updates):

| Concept | What it is | Changes when | Lives where |
|---|---|---|---|
| **Stable identity** | The durable name of a chapter and of each knowledge point / Blueprint element | *Never* (identities are permanent, never reused) | Chapter ID; chapter-local KP and Blueprint IDs |
| **College edition** | Which published edition of the source text a fact came from | The College republishes | A field on the source and on each knowledge point's edition history |
| **Content revision** | A revision of *our* curated artifacts (Inventory, Blueprint) | We re-curate after an edition diff, or improve pedagogy | Version stamp on Inventory and Blueprint |
| **Generation provenance** | Which (source edition × Blueprint revision × methodology version) produced a given projection | Any regeneration | Provenance stamp on every projection and in the manifest |

A knowledge point therefore keeps **one identity for life** while its *content* may carry several editions of source text and several content revisions. This is what lets learner data (mastery, spaced-repetition schedules) survive edition changes: it attaches to the identity, not to the edition.

**The edition-diff is expressed as a per-knowledge-point change type.** When a new edition is ingested, extraction produces a candidate inventory that is diffed against the current one. Each knowledge point receives exactly one change classification:

- **unchanged** — meaning identical; keep identity, keep content, bump the edition-seen field only.
- **moved / reformatted** — meaning unchanged but location or wording of the source changed; keep identity and meaning, update the source anchor.
- **modified** — meaning changed; keep identity, revise content, mark dependents for re-check.
- **new** — no prior identity; mint a new identity.
- **removed** — present before, absent now; retire the identity (never delete or reuse it; mark retired-as-of-edition).
- **split** — one prior point becomes several; the original identity is retired and its lineage recorded on the new points, OR one child keeps the identity and siblings are new (the diff records the lineage either way).
- **merged** — several prior points become one; lineage from all predecessors is recorded on the survivor.

**Every classification carries a confidence, because semantic mapping between editions is not always certain.** The change type answers *what* changed; the confidence answers *how sure the automated reconciliation is that identity continues*. Three bands (deliberately qualitative — no over-designed numeric thresholds):

- **High confidence** — identical or near-identical meaning; safe to continue the stable ID; typically `unchanged` or `moved/reformatted`.
- **Medium confidence** — likely the same underlying knowledge point but wording or scope has changed; requires deeper automated reconciliation before the ID is continued.
- **Low / ambiguous** — a possible split/merge, a substantially changed scope, or otherwise uncertain identity continuity; requires **broader re-analysis** before any identity decision.

**The load-bearing invariant:** *stable identity must never be preserved merely because two passages look similar.* Identity continuity must reflect **semantic** continuity. When confidence is insufficient (medium/low), the pipeline prefers **broader Inventory reconciliation, Blueprint re-analysis, and wider regeneration** over forcing a surgical stable-ID continuation. Automatic ID continuation is allowed only at high confidence.

**Scoped update follows the traceability chain, in reverse.** A change to a knowledge point →
identifies which Blueprint elements reference that knowledge point (and which mastery items reference the KP directly, A.3) →
identifies which projections (explanations, visuals, QCM/flashcards) reference those elements or that KP →
**only those outputs are re-checked or regenerated.** Everything the changed point does not reach is left untouched. **Provenance proves lineage, not currency** — an unchanged provenance stamp shows an output was produced from a given (edition × revision × methodology) and was not touched by *this* diff; it does **not** by itself prove the assembled chapter is still valid as a whole. Currency of the whole chapter is established by the final coherence check below.

**Safety rule (contractual).** If the affected scope of a change cannot be determined with confidence — a medium/low-confidence classification, a modification whose ripple through the Blueprint is ambiguous, or a structural split/merge that reshapes the mental model — the pipeline **prefers a broader rebuild** (re-reconcile the Inventory, re-analyse/re-curate the Blueprint, re-project the chapter) over a risky surgical patch. Narrow updates are an optimisation, never an obligation.

**Final chapter-level coherence check (a safety net, not a default full regeneration).** Selective regeneration alone is not enough: a change to one part of a chapter can have an *indirect* conceptual consequence that no explicit dependency reference captures. So after any partial edition update the pipeline runs, in order:

```
changed source → Inventory diff (with confidence) → impacted Blueprint/projections updated
             → selective regeneration → FINAL CHAPTER-LEVEL COHERENCE CHECK against the new edition
```

The final check asks a single question: does the **assembled chapter as a whole** remain globally consistent with the new official source? It is run once per updated chapter, not per fact, and it is *not* another full regeneration by default. **If it fails or remains uncertain,** the pipeline expands the affected scope — re-analyse more of the Blueprint/chapter and regenerate more broadly — until coherence holds or the chapter is held. Provenance proves lineage; this check is what supports confidence that the partially updated chapter is still valid.

**One canonical origin for change information.** The change type, its **confidence band**, the edition-seen history, and the lineage of each knowledge point live **only on that knowledge point in the Knowledge Inventory**. Learner-facing badges — "new in the 2027 edition", "updated in the 2027 edition", "unchanged", "removed from the latest edition" — are **derived** from that single field at packaging time and surfaced through the manifest. No projection file and no manifest hand-maintains edition status; duplicating it anywhere is forbidden.

### A.3 Exhaustive medical content versus manageable understanding

This is the load-bearing distinction of the whole learner experience, and it maps onto two different artifacts with two different jobs.

**The Knowledge Inventory is exhaustive.** It must preserve *all* important examinable content from the source: definitions, mechanisms, thresholds, classifications, exceptions, Rank A/B tags, and enough granularity to later support detailed QCM, flashcards, memorisation, spaced repetition, and edition comparison. It may contain many detailed rows (Item 234 already has ~88). That is acceptable **because the Inventory is not the primary lesson.** Its job is fidelity and completeness, not teachability.

**The Chapter Blueprint is cognitively manageable.** Its job is to build understanding: the global mental model, why things happen, the main causal mechanisms, the most important actors, key distinctions and confusion boundaries, clinical reasoning, useful analogies, and visual intent. It **selects and organises** — it must *not* reproduce every Inventory row. A chapter with 88 knowledge points should still be teachable through a *reasonable number of well-structured concepts* (Item 234's 24 mechanisms already do this: 88 facts organised into 24 "why/how" questions). Selection is the pedagogy.

**Two projection families derive from two different sources, and this is deliberate:**

- **Understanding projections** (built now): story/intuition, overview, major mechanisms, important actors, comparisons, clinical reasoning, diagrams. Path: `Knowledge Inventory → selected/organised through the Chapter Blueprint → Understanding Projections`. These **require Blueprint context** and **deliberately control cognitive load** — they derive from the Blueprint's *selected* concepts, not from the full Inventory.
- **Mastery projections** (built later): QCM, flashcards, exact thresholds, classifications, exceptions, fine distinctions, memorisation, spaced repetition. Path: `Knowledge Inventory → Mastery Projections`, **with Blueprint context used where useful**. These may work at the **full Inventory granularity**, much finer than the Blueprint.

**The grounding rule (removes the old contradiction that mastery required a Blueprint element).** A mastery item **requires Knowledge-Inventory grounding** — it must target at least one anchored knowledge point — and it **uses Blueprint context when relevant**, but the Blueprint is **not a mandatory intermediary**. A mastery item may therefore derive **directly from a knowledge point even when that point is not represented as a separate Blueprint element.** Concretely:

- understanding projections **require Blueprint context**;
- mastery projections **require Knowledge-Inventory grounding**;
- mastery projections **use Blueprint context when relevant** (conceptual context, prerequisite relationships, confusion boundaries, mechanism or clinical-reasoning context);
- **some detailed, mastery-only knowledge points may remain outside the compressed Blueprint** entirely — this is expected, not a defect, and is exactly why the Blueprint stays manageable.

**How this still preserves "understanding before memorisation."** The order is enforced at the level of the *concept*, not of every atomic fact. A detailed threshold can be **deferred to mastery** while the broader mechanism it belongs to is understood first through the Blueprint; the system expresses that "belongs-to" relationship (the mastery KP references the Blueprint mechanism as context) **without forcing the threshold itself to become a Blueprint node.** Sequencing/adaptivity can still gate a fine mastery fact behind its parent concept using that context reference — but the Blueprint is never obliged to inflate to hold every atomic detail, which would defeat its purpose.

**The invariant that ties them together:** **detail excluded from the understanding experience is never lost** — it remains in the Knowledge Inventory, disposition-tagged as "deferred to mastery," and is therefore both provably preserved (completeness invariant, A.1) and available the moment mastery projections are built. Understanding projections read a curated subset via the Blueprint; mastery projections read the exhaustive Inventory directly (with Blueprint context where useful); both trace to the same knowledge points.

---

## Part B — Cross-cutting mechanisms (defined once)

**Identity scheme (irreversible core — see Part D):**
- **Chapter ID** = `specialty/item`, e.g. `cardio/234`. Human-meaningful, stable, survives editions. The slug (`234-insuffisance-cardiaque`) is a display alias, not the identity.
- **Knowledge-point ID** = chapter-local, e.g. `cardio/234#KP-047`. Assigned once at creation, never renumbered, never reused, never positional. Carries a human label for readability but the ID is the identity.
- **Blueprint-element ID** = chapter-local, minted *only where a downstream process must reference the element*, e.g. `cardio/234#MEC-oap`, `#ACT-sraa`. Not every paragraph gets an ID — only mechanisms/actors/reasoning nodes that projections, visuals, or navigation point at.

**Source anchor (must survive reformatting and line-number changes):** an anchor is *not* a line number. It is the tuple
`{ edition, section_path, quote }` — the College edition, a coarse structural locator (e.g. `"I. Généralités > Physiopathologie > conséquences du dysfonctionnement"`), and a **verbatim quoted phrase** long enough to relocate the fact if formatting shifts. A line number may be stored as a convenience pointer but is never the anchor's identity. When an edition reflows the text, the quote and section path relocate the fact; the line number is simply refreshed.

**Claim block (the default traceability unit).** A claim block is the **smallest meaningful learner-facing factual unit that needs independent traceability** — *not* every sentence. Depending on the projection it may be one paragraph, one mechanism step, one table row, one comparison statement, one diagram node, one QCM explanation, one flashcard answer, or one exact-threshold statement. A claim block **may contain several sentences** when they form one coherent sourced idea. This is the default so that traceability stays proportionate across 350+ chapters; the pipeline does not mint an ID for prose merely to have an ID.

**Sentence-level traceability remains available where precision genuinely requires it** — where a single sentence carries a high-specificity fact whose grounding must be pinned exactly: exact thresholds, classifications, contraindications, treatment recommendations, and similar. In those cases a sentence *is* its own claim block.

**The traceability chain (stored, not recomputed):**
```
source anchor  ←  knowledge point(s)  ←  Blueprint element (where applicable)  ←  projection claim block
```
The Blueprint element is present for understanding projections and for any mastery item that uses Blueprint context; it is *optional* for a mastery claim block that grounds directly in a knowledge point (A.3, C.5). Every learner-facing claim block resolves left along this chain by stored identifier reference. The manifest materialises the whole graph so "where does this come from?" is a lookup.

**The grounding/consistency check (the separate checking process of A.1):** given a projection *claim block*, its claim class, and the source quotes of its referenced knowledge point(s), an independent pass judges: is a *sourced* claim supported by the quote? does a *bridging inference* follow from the quotes? do numbers/thresholds/classifications match? Output is pass / downgrade / fail, feeding the conservative fallback. A claim block that bundles several sentences is checked as a unit; a high-specificity sentence is checked on its own.

**Provenance stamp (on every generated artifact):** `{ source_edition, blueprint_revision, methodology_version }`. Staleness is computable by comparison; reproducibility replaces archiving old outputs.

---

## Part C — Component contracts

Each component is specified by eight fields: **purpose, minimum required information, references/identifiers, inputs, outputs, provenance, quality checks, what it must not own.**

### C.1 Official Source

- **Purpose.** The sole curricular medical authority and the trust anchor. Correctness of everything downstream is *defined* as fidelity to this text.
- **Minimum required information.** The verbatim College text for one chapter, tagged with its **edition** identifier (e.g. `2024-SFC`, from the source header "Collège National de Cardiologie / SFC / 07/11/2024"). A coarse structural map of the chapter (the sections `I…VII`, "Situations de départ", "Hiérarchisation des connaissances", "Points-clés") sufficient to build section-path anchors.
- **References/identifiers.** Owns the Chapter ID's binding to real curriculum; owns edition identifiers. Provides the `section_path` used by source anchors. Defines no sub-chapter IDs of its own.
- **Inputs.** The published College text (ingested as-is). Nothing else.
- **Outputs.** An addressable, editioned, immutable body of text that anchors can point into.
- **Provenance.** Is the *origin* of provenance (the `source_edition` field). Carries none itself beyond its edition tag.
- **Quality checks.** Ingestion fidelity only: the stored text matches the publication (the audit noted OCR/paste artifacts in the "Hiérarchisation" table — cleanup is transcription faithfulness, never medical editing). No interpretation is applied.
- **Must not own.** Any pedagogy, interpretation, structure, IDs below chapter level, or generated content. It is text, editioned, and nothing more.

### C.2 Knowledge Inventory

- **Purpose.** Turn "coverage" from an unprovable checkbox into a structured, anchored **proof of completeness**, and hold the **exhaustive** examinable detail (A.3) at the granularity future assessment and spaced repetition will target.
- **Minimum required information.** A list of knowledge points; each row carries: a chapter-local **KP ID**; a human-readable description (prose); one or more **source anchors**; **EDN rank** (A/B) where the source's "Hiérarchisation" provides it; a **disposition** (`understanding` | `deferred-to-mastery` | `excluded:<reason>`); and an **edition history** (per-edition: edition seen + change type from A.2 + lineage for split/merge).
- **References/identifiers.** Defines KP IDs (durable, non-positional). References source anchors. Is referenced *by* the Blueprint. Owns the canonical edition/change data (A.2).
- **Inputs.** The Official Source (for extraction) and, on updates, the previous Inventory revision (for the edition diff).
- **Outputs.** The curated inventory; the completeness proof (every KP has a disposition); the per-KP change classification consumed by scoped updates and by learner-facing "new/updated/unchanged/removed" badges.
- **Provenance.** Content revision stamp. Each row's edition history records which edition each fact was seen in. (No human-validation stamp: fidelity is assured automatically, not certified by a person.)
- **Quality checks.** **Automated source-fidelity assurance (A.1), not a human fidelity gate:** an independent coverage-reconciliation pass compares the Official Source against this Inventory section-by-section and assigns every relevant source segment a disposition (represented / deferred / excluded-with-justification / missed / ambiguous); *missed* and *ambiguous* segments are flagged for broader re-analysis. Machine checks: every KP has ≥1 source anchor; every KP has a disposition; no duplicate or reused IDs. Lou/the owner *may* inspect flagged exceptions and comment on clarity, but are never required to confirm that content is medically correct, complete, or correctly ranked.
- **Must not own.** Explanations, teaching order, analogies, or any pedagogy. It is an inventory, not a lesson (that is the Blueprint's job, and keeping them separate is what lets the Inventory be exhaustive while the lesson stays manageable).

### C.3 Chapter Blueprint

- **Purpose.** The **one structured intermediate** from which every projection derives, so prose, diagrams, and future QCM/flashcards share a single understanding and a single pedagogical plan instead of re-interpreting the source (the audit's core failure). It encodes the *manageable* model (A.3): it selects and organises, deliberately not reproducing the Inventory.
- **Minimum required information.** Exactly one Blueprint per chapter, internally sectioned. Each section exists because a **named downstream consumer needs it** (justifications below):

  | Section | Why a downstream process needs it |
  |---|---|
  | **Mental model** | Root of the overview projection and of navigation's "big picture first"; the thing `vue-ensemble` projects. |
  | **Learning sequence** (ordered, with dependency edges) | Drives reading order in the manifest/renderer and lets adaptivity sequence a mastery fact *after* the concept it belongs to is understood — **by context reference, not by requiring the fact to be a Blueprint element** (A.3). Without stored order, every projection re-invents pedagogy (the audit's symptom). |
  | **Mechanisms** (each: the question it answers, ordered steps, causal links, referenced KP IDs + anchors) | The generation input for mechanism explanations *and* for diagrams — a diagram is generated from the step graph, not from prose. This is what makes visuals consistent and re-derivable. |
  | **Actors** (role, which mechanisms they participate in) | The generation input for actor projections and for cross-links between a mechanism and its participants. |
  | **Clinical reasoning** (nodes linking mechanisms/actors to presentations, thresholds, decisions) | The generation input for clinical-reasoning projections and the natural target for future clinical-case QCM. |
  | **Conceptual dependencies** | Lets the sequence express prerequisites and lets scoped updates and adaptivity reason about ripple. |
  | **Confusion points / boundaries** | Explicit targets for disambiguating explanations and for future "trap" QCM (e.g. FE diminuée vs préservée; transsudat vs exsudat). |
  | **Analogies** | Declared pedagogical-scaffolding (A.1 class 2) so a projection knows what is intuition vs sourced fact. |
  | **Visual intent** | Declares *which* concepts warrant a diagram and *what shape* (process flow, feedback loop, comparison), so visuals are planned, not guessed by ordinal filename. |

  Each mechanism/actor/reasoning node that a projection or visual will point at carries a **Blueprint-element ID** and references the **KP IDs + source anchors** it is built on.
- **References/identifiers.** Defines Blueprint-element IDs. References KP IDs and source anchors. Is referenced by every projection and by the manifest's navigation.
- **Inputs.** The Knowledge Inventory (selects from it) and the Official Source (for anchor verification).
- **Outputs.** A human-readable, machine-parsable structured document: prose content inside explicit structure (ordered lists, dependency edges, references). Structured *enough to parse*, not a schema-locked database.
- **Provenance.** Content revision stamp. (No medical human-validation stamp; see below.)
- **Quality checks.** **Optional human pedagogy/clarity feedback (not a mandatory medical gate).** Lou and the owner *may* review the Blueprint for what they can actually judge — is the teaching order clear, is cognitive load manageable, are the confusion points ones they recognise, is any explanation confusing — and this feedback triggers **re-curation or regeneration**. They are *not* asked to certify that the mental model is medically correct, and the build does not block waiting for their sign-off. Machine checks (which *do* gate the build): every Blueprint element references ≥1 valid KP ID; every referenced KP exists; grounding of the Blueprint's structured understanding against source anchors (A.1); **selection sanity** (the Blueprint references a coherent subset, and every KP it omits is `deferred-to-mastery` or `excluded`, never silently dropped — this links completeness A.1 to manageability A.3).
- **Must not own.** Finished learner prose, final diagram markup, layout/rendering, or any fact not already in the Inventory. It is the model and the plan, not the presentation, and never the sole home of a medical fact.

### C.4 Understanding Projections

- **Purpose.** The comprehension-first artifacts the learner actually consumes now (A.3): story, overview, mechanism explanations, actor explanations, comparisons, clinical reasoning, diagrams. They deliberately control cognitive load.
- **Minimum required information.** Each projection carries: its **type**; the **Blueprint-element ID(s)** it projects; the **KP ID(s)** and thus source anchors behind each sourced **claim block** (Part B); a **claim class** discipline over its claim blocks (sourced / scaffolding / bridging, A.1), applied at claim-block granularity by default and at sentence granularity only for high-specificity facts; and a **provenance stamp**.
- **References/identifiers.** Holds no new ID space. Addressed by (type × Blueprint element projected). References Blueprint-element IDs and KP IDs. A visual additionally references the mechanism/actor it depicts and the KPs it shows (satisfying both traceability and its text-alternative/accessibility need).
- **Inputs.** The Chapter Blueprint (and, transitively, the KP anchors it references). **Never the raw source directly, never prose from a sibling projection.** Visuals take the *structured* mechanism/actor model as input, not finished Markdown.
- **Outputs.** Disposable learner-facing content (prose, diagram markup) with references intact and claim classes marked.
- **Provenance.** Full stamp `{source_edition, blueprint_revision, methodology_version}`; staleness computable against the current Blueprint and edition.
- **Quality checks.** The **separate checking pass** (A.1/Part B): grounding of sourced claims and bridging inferences against anchors; consistency of numbers/thresholds/classifications with referenced KPs; conservative-fallback enforcement (downgrade or omit the unsupportable). No default human medical review; optional human feedback on clarity/load/usefulness only, which triggers regeneration.
- **Must not own.** Any fact or structure not in the Blueprint/Inventory; edition status (derived from the KP); pedagogy of its own (inherited from the Blueprint). It may never be the only place a fact lives.

### C.5 Future Mastery Projections

- **Purpose.** Detailed, exhaustive learning built later (A.3): QCM, flashcards, exact thresholds, classifications, exceptions, fine distinctions, memorisation, spaced repetition. They may operate at full Inventory granularity.
- **Minimum required information.** Each item carries: its **type**; the **KP ID(s)** it targets (mastery attaches to knowledge points, which is why KP IDs and their granularity are irreversible); optionally the **Blueprint element** giving pedagogical context; and a **provenance stamp**. Spaced-repetition scheduling and mastery state are *learner data*, held by the future Adaptive layer, keyed by KP ID — **not** stored in the projection.
- **References/identifiers.** References KP IDs (primary) and optionally Blueprint-element IDs. Introduces no medical ID space.
- **Inputs.** The Knowledge Inventory (**primary** — the exhaustive set) and the Blueprint (for context/sequencing **where relevant**). A flashcard or QCM can be generated for a fact **because that fact is an anchored, grounded knowledge point** — the Inventory grounding is the requirement (A.3). The knowledge point **need not be represented as a separate Blueprint element**; when a Blueprint mechanism/actor/reasoning node *does* give it context, the item references that node so adaptivity can sequence it after the parent concept. "Understanding before memorisation" is preserved at the concept level (the parent mechanism is understood first), **not** by forcing every atomic detail into the Blueprint.
- **Outputs.** Disposable assessment/memorisation items, each traceable to a KP and thus to the source.
- **Provenance.** Full stamp; regenerate rather than hand-version.
- **Quality checks.** Same separate checking pass: a QCM's correct answer and its distractors' incorrectness must be grounded in the targeted KP's source anchor; a flashcard's answer must match its KP. Human feedback limited to clarity/usefulness.
- **Must not own.** Learner state (that is the Adaptive layer's, isolated); any fact not already an anchored KP; edition status (derived). Not built now — but the contract above is fixed now because KP identity and granularity are irreversible once learner data attaches.

### C.6 Chapter Package / Manifest

- **Purpose.** The renderer's contract and the materialised trust graph: make explicit what content exists, in what order, understanding vs mastery, how content links to visuals and sources, which edition, what provenance, and what status.
- **Minimum required information.**
  - **Projection registry** — every projection that exists, its type, and its Blueprint-element/KP references (so the renderer discovers content instead of assuming a fixed set of tabs or assets).
  - **Learning order** — the Blueprint's sequence, so navigation follows pedagogy.
  - **Family tag** — each projection marked `understanding` or `mastery` (A.3).
  - **Traceability graph** — the stored `anchor ← KP ← element (where applicable) ← projection claim block` edges (Part B; the Blueprint element is present for understanding and absent for a mastery claim block grounded directly in a KP), including explicit **explanation↔visual** links by identifier (never ordinal filename).
  - **Source edition** and **provenance** stamps.
  - **Content status** — derived per item: coverage/reconciliation invariant PASS/FAIL, grounding-check results, and edition badges (`new` / `updated` / `unchanged` / `removed`) **derived from the KP edition history**, plus honest **known-absent** markers for planned-but-unbuilt projections. After an edition update, the chapter also carries the **final coherence-check** result (A.2); an unchanged provenance stamp records lineage but is not by itself a currency claim.
- **References/identifiers.** Introduces no new ID space; references existing Chapter/KP/Blueprint/projection IDs.
- **Inputs.** The Blueprint (order, elements), the Inventory (coverage, edition status), the projections (registry, provenance), the checker results.
- **Outputs.** One generated manifest per chapter that the renderer consumes wholesale.
- **Provenance.** Generated; carries the chapter's aggregate provenance, the coverage/reconciliation and grounding invariant results, and (after an edition update) the final coherence-check result.
- **Quality checks.** Generated, so correctness is a pipeline guarantee: coverage/reconciliation invariant must pass (every KP disposed, every relevant source segment dispositioned); every projection reference must resolve; every explanation↔visual link must resolve by ID; no edition status duplicated (it is derived); after an edition update, the final coherence check must pass (or the chapter is held).
- **Must not own.** Medical content, pedagogy, or any authored (hand-maintained) metadata. It references; it never authors. Edition status is derived, never stored twice.

### C.7 Renderer

- **Purpose.** Assemble the learner experience from the manifest; be the single place the tiers converge for a human, holding zero medical content.
- **Minimum required information (that it may rely on).** Only the manifest: the projection registry, learning order, family tags, traceability/visual links, edition badges, and known-absent markers.
- **References/identifiers.** Consumes IDs; defines none.
- **Inputs.** The Chapter Package/manifest and (later) learner state.
- **Outputs.** The assembled, navigable experience; captured **learner-interaction events** and **clarity/load/usefulness feedback** (A.1), emitted for regeneration and the future Adaptive layer.
- **Provenance.** Versioned independently of content; forces no medical re-validation when the UI changes.
- **Quality checks.** UI/UX review only, never medical. Must **degrade honestly**: a planned-but-unbuilt projection is shown as a known-absent state tied to the pipeline, not a silent gap (the audit found four of five assets silently missing or placeholdered).
- **Must not own.** Any medical content of its own (the legacy hard-coded-HTML pattern is permanently rejected); a fixed number of tabs or assets; any assumption about which projection types exist (it renders by capability, driven by the manifest); re-interpretation of the model; ordinal filename linking (`mechanism-01.svg` = first `##`) — links come from the manifest by identifier.

---

## Part D — Identity and source references (the durable minimum)

Restating the irreversible core precisely, because these decisions must be right before any learner data exists:

- **Chapter identity** — `specialty/item` (`cardio/234`). Stable, human-meaningful, survives every edition. Slug is a display alias.
- **Chapter-local knowledge-point identifiers** — `cardio/234#KP-nnn`. Minted once, never reused, never positional, meaningful across editions where the underlying fact is unchanged. Mastery and spaced repetition will attach here; granularity is fixed now (A.3, `PRODUCTION_ARCHITECTURE.md` §11).
- **Chapter-local Blueprint identifiers, where needed** — `cardio/234#MEC-*`, `#ACT-*`, `#CR-*`. Minted only for elements a projection/visual/navigation references. Not every sentence gets one.
- **References back to the official source** — the `{edition, section_path, quote}` anchor of Part B, resilient to reformatting and line-number drift because the durable part is the verbatim quote plus a coarse structural locator.

**Stable identity vs changing edition** — the point to hold onto: identity is permanent and edition-independent; the source *text* a knowledge point points at is editioned and may change; our curation of that point is separately revisioned. One identity, many editions of source, many content revisions, computable provenance. No global sub-chapter or cross-chapter ID space is introduced now; the scheme simply does not forbid later promotion to a shared reference.

---

## Part E — Item 234 worked example (repository content only)

A single concrete thread — **pulmonary congestion → cardiogenic pulmonary oedema (OAP)** — traced end to end. No medical fact below is invented; each is drawn from the repository files cited.

**1 — Official Source.** `01-learning/chapter-analysis/cardio/234-insuffisance-cardiaque/official-college.md`, edition `2024-SFC`, section `I. Généralités > Physiopathologie`, lines 265–267:

```265:267:01-learning/chapter-analysis/cardio/234-insuffisance-cardiaque/official-college.md
L’augmentation de la pression capillaire pulmonaire au-delà d’un certain seuil (en
général au moins > 25 mmHg) peut entraîner un passage de liquide (transsudat) des capillaires
vers les alvéoles pulmonaires à l’origine de l’œdème aigu pulmonaire cardiogénique.
```

**2 — Knowledge Inventory.** This becomes one exhaustive, anchored row (the fact already appears as a `coverage.md` row: "Œdème pulmonaire cardiogénique vs lésionnel : transsudat/exsudat, seuil PPC > 25 mmHg…"). In contract form:

```text
KP-041
  label:       Seuil de pression capillaire pulmonaire (> 25 mmHg) → transsudat → OAP cardiogénique;
               opposition avec l'OAP lésionnel (exsudat)
  rank:        A            # from the source "Hiérarchisation des connaissances"
  anchor:      { edition: 2024-SFC,
                 section_path: "I. Généralités > Physiopathologie > conséquences du dysfonctionnement",
                 quote: "pression capillaire pulmonaire au-delà d'un certain seuil (en général au moins > 25 mmHg)" }
  disposition: understanding
  editions:    [ { edition: 2024-SFC, change: new } ]
```

**3 — Chapter Blueprint.** The Blueprint *selects* this as one mechanism (Item 234's `mecanismes.md` §11 already frames it as a single "why" question), giving it an ID, an ordered step graph, causal links, referenced KPs, and a visual intent — the diagram's true input:

```text
MEC-oap  (mental-model position: after MEC-congestion; before clinical/aiguë block)
  question:  "Comment la congestion pulmonaire mène-t-elle à l'OAP ?"
  steps:     [ pression télédiastolique VG ↑
               → transmission OG → veines/capillaires pulmonaires
               → franchissement du seuil (KP-041)
               → transsudat alvéolaire → OAP cardiogénique ]
  contrast:  OAP lésionnel = exsudat (confusion-point ref: CONF-transsudat-exsudat)
  uses_KP:   [ KP-041, KP-... ]
  visual_intent: process-flow, threshold-crossing emphasised
```

**4 — Understanding explanation.** Generated *from `MEC-oap`* (this is `mecanismes.md` §11 in the current repository):

```144:150:01-learning/generated-assets/cardio/234-insuffisance-cardiaque/mecanismes.md
## 11. Comment la congestion pulmonaire mène-t-elle à l'OAP ?

**Question :** Pourquoi le patient « s'étouffe » avec un cœur malade ?

Augmentation de la pression télédiastolique du VG → transmission aux veines et capillaires pulmonaires. Au-delà d'un seuil (souvent **PPC > 25 mmHg**), passage d'un **transsudat** dans les alvéoles → **œdème aigu pulmonaire cardiogénique**.
```

Claim blocks here: the threshold statement "PPC > 25 mmHg → transsudat → OAP cardiogénique" is one **sourced** claim block — and because it carries an exact threshold, it is pinned at sentence granularity (references `KP-041`, passes grounding against the quote); the surrounding arrow-chain framing is a **bridging inference** claim block (entailed by the step graph); no analogy is used in this one. The paragraph is not decomposed into per-sentence IDs beyond the one high-specificity threshold that warrants it.

**5 — Visual.** Generated from `MEC-oap`'s *step graph*, not from the prose. The chapter's `figures/overview.svg` already renders this branch — "Pressions de remplissage ↑ → Congestion pulmonaire" flowing into "Symptômes et décompensations aiguës (OAP…)":

```62:64:01-learning/generated-assets/cardio/234-insuffisance-cardiaque/figures/overview.svg
  <text x="900" y="454" text-anchor="middle" class="card-title">Pressions de remplissage ↑</text>
  <text x="900" y="482" text-anchor="middle" class="body-dark">Congestion pulmonaire</text>
  <text x="900" y="504" text-anchor="middle" class="body-dark">Stase veineuse</text>
```

Under the contract the mechanism-level diagram is `VIS(MEC-oap)`, linked to the explanation **by identifier** in the manifest, not by the filename `mechanism-11.svg` matching the 11th `##`.

**6 — Manifest.** One generated entry ties the thread together:

```text
projection: mechanisms/MEC-oap
  type: understanding.mechanism
  projects: MEC-oap
  visual: VIS(MEC-oap)                 # explanation↔visual link by ID
  traces_to_KP: [ KP-041, ... ]
  order: 11
  family: understanding
  edition_status: derived-from KP-041.editions   # → "unchanged" until an edition changes KP-041
  provenance: { source_edition: 2024-SFC, blueprint_revision: r1, methodology_version: m1 }
  grounding_check: pass
```

**7 — Renderer.** Reads the manifest, places `MEC-oap` at sequence position 11, renders the explanation, injects `VIS(MEC-oap)` via the manifest link, and (later) offers "where does this come from?" resolving `KP-041 → the 2024-SFC quote`. It hard-codes none of this content and assumes no fixed tab set.

### E.1 The same knowledge, later, as mastery

Nothing new is authored medically; a mastery projection is generated **from the same `KP-041`**:

- **Flashcard** — front: "Seuil de pression capillaire pulmonaire au-delà duquel apparaît l'OAP cardiogénique ?" back: "> 25 mmHg (passage d'un transsudat vers les alvéoles)." `targets_KP: KP-041`; answer grounding-checked against the same source quote.
- **QCM** — stem: "Un OAP cardiogénique survient lorsque la pression capillaire pulmonaire dépasse environ :" correct option "25 mmHg" (grounded in `KP-041`); the distractor's *incorrectness* and the "transsudat vs exsudat" trap draw on `CONF-transsudat-exsudat`. Spaced-repetition scheduling attaches to `KP-041` in the Adaptive layer, never to the QCM file.

Because `KP-041` is anchored and grounded, the mastery item is derivable and traceable with zero new medical authoring. Here `KP-041` *happens* to also sit inside Blueprint mechanism `MEC-oap`, so the mastery item references `MEC-oap` as context and adaptivity can present it after the OAP mechanism is understood — the concept-level expression of "understanding before memorisation." Had `KP-041` been a mastery-only detail with **no** dedicated Blueprint element (e.g. a fine numeric exception not worth a mechanism node), the flashcard/QCM would still be generated directly from the knowledge point; the Blueprint would supply only whatever parent-concept context exists, and would not be inflated to hold the detail.

### E.2 A new-edition example (process only; no invented fact)

Suppose the College publishes a `2027` edition and, among other changes, **revises the non-acute NT-proBNP rule-out threshold** (a value the College owns; the current source states `< 125 pg/mL`, reflected in `mecanismes.md` §13). The real revised value would come only from that edition; here we trace the *mechanics*, not a fabricated number.

1. **Ingest + extract** the 2027 source; diff against the current Inventory.
2. **Classify the affected knowledge point, with confidence.** The BNP/NT-proBNP threshold KP is classified **modified** (meaning changed) at **high confidence** (same peptide, same diagnostic role, only the numeric threshold moved), so its stable identity is safely continued: identity kept, content and anchor revised, edition history gains `{ edition: 2027, change: modified, confidence: high }`. This is the **one canonical origin** of the change. (Had the reconciliation been *medium/low* — e.g. unsure whether the rule had split into separate age-banded thresholds — the pipeline would broaden re-analysis before continuing the ID.)
3. **Walk the traceability chain in reverse.** The modified KP is referenced by Blueprint element `MEC-bnp` ("Comment le BNP aide-t-il au diagnostic ?", `mecanismes.md` §13) and by the clinical-reasoning node for the diagnostic algorithm, and is targeted directly by BNP mastery items. Only outputs referencing those elements or that KP are marked stale by provenance: the BNP mechanism explanation, any BNP/diagnostic-algorithm visual, and BNP QCM/flashcards.
4. **Re-check or regenerate only those.** The mechanism explanation and its visual are regenerated from the revised Blueprint element and re-grounded; the affected flashcard/QCM are regenerated. **Left untouched:** the OAP thread (`MEC-oap`/`KP-041`), remodelling, compensations, treatment classes — their provenance still matches, which proves they were not touched by this diff (lineage), *not* on its own that the chapter is still coherent.
5. **Safety fallback.** If the change turned out to also reshape the diagnostic sequence (e.g. reordering peptides-then-echo), or if the classification were medium/low confidence, the pipeline would **re-reconcile the Inventory and re-curate/re-project more of the chapter** rather than patch narrowly.
6. **Final chapter-level coherence check.** With the BNP content regenerated, the pipeline checks the **assembled chapter as a whole** against the 2027 edition — does the diagnostic narrative still hang together now that the threshold moved? If it does, currency is established; if it is uncertain (say the new threshold subtly changes how BNP and echo are sequenced in the reasoning node), the scope is expanded and more of the chapter re-analysed until coherence holds.
7. **Learner-facing badges are derived,** not authored: the manifest reads the KP's edition history and surfaces "updated in the 2027 edition" on the BNP content and "unchanged" elsewhere. Learner mastery on that KP survives because it attached to the stable KP ID, not to the edition or the projection.

---

## Part F — Ready for implementation?

**Is the architecture now precise enough to implement?** **Yes, for the understanding-first scope** — the Official Source, Knowledge Inventory, Chapter Blueprint, Understanding Projections, Chapter Package/Manifest, and Renderer are specified to the level of *which relationships must exist, who owns them, and what each may not own*. The three governing requirements (reliability *without any mandatory human medical validation*, edition updates, exhaustive-vs-manageable) now have concrete, checkable mechanisms rather than aspirations. Mastery Projections and the Adaptive layer are specified enough at their *interface* (they ground directly in KP IDs, using Blueprint context where useful) to be safely deferred.

**Is any truly irreversible decision still unresolved?** **No.** The four corrections in this pass closed the remaining architectural contradictions: medical reliability no longer depends on a human fidelity/correctness gate (it is now automated source-fidelity assurance, A.1); traceability defaults to the claim block rather than the sentence (Part B); mastery grounds directly in the Inventory rather than requiring a Blueprint element (A.3/C.5); and edition reconciliation is confidence-aware with a final chapter-level coherence check (A.2). None of these introduces a new architectural layer, and none is blocked on a decision only a qualified physician could make. The architecture can be **frozen** and implementation design can proceed using Item 234 as the reference chapter. What remains to settle are *calibrations and formats*, listed below — all reversible.

**Decisions that MUST be settled before writing any code** (they are irreversible once learner data or many chapters exist):

1. **Knowledge-point granularity.** How finely a chapter is cut into KPs fixes the resolution of completeness, assessment, and spaced repetition. Item 234's ~88 rows are a reasonable calibration to ratify deliberately, because re-granulating later invalidates learner data.
2. **KP and Blueprint ID scheme** — the exact durable form (Part B/D) and the rule that IDs are never reused, including the split/merge lineage rule *and the confidence requirement that identity is continued only on semantic (not surface) continuity* (A.2).
3. **Source-anchor format** — `{edition, section_path, quote}` and the decision that the verbatim quote (not the line number) is the durable part.
4. **The claim-class + claim-block + grounding-check contract** — the three classes, the claim block as the default traceability unit (with sentence-level pinning for high-specificity facts), and the fact that checking is a *separate* pass with authority to fail the build. This is the load-bearing reliability decision.
5. **The completeness + reconciliation invariant** — that every KP must carry a disposition, that every relevant source segment must receive a disposition from the independent reconciliation pass, and that packaging fails otherwise.
6. **The edition model's four-way separation** (identity / edition / content revision / provenance), the single-canonical-origin rule for change status, the confidence band on each classification, and the final chapter-level coherence check as the currency test (provenance alone proves only lineage).

**Decisions that should deliberately remain flexible** (reversible; do not over-design):

- The exact serialization of every artifact (Markdown front-matter vs YAML vs JSON), the Blueprint's internal section formatting, and projection templates.
- The number and names of projection types (Item 234's five/`mecanismes` count is a starting point, not a contract).
- Prompt wording, methodology internals, and the generator/checker/reconciler model choices (only their *separation* is fixed).
- Renderer UI, tabs, navigation, and visual design tokens.
- SVG file naming and layout (linking is by manifest ID, so filenames are free).
- The specific grounding-failure and missed/ambiguous-disposition thresholds that block packaging, and the qualitative confidence bands' operational cut-offs (tune empirically; do not over-formalise numerically).

No implementation roadmap is proposed here, per the brief. The contract above is the stable, **frozen** target; the reversible list above is where implementation is free to learn and change. Next step: implementation design against Item 234.

*End of implementation contract. Conceptual only — no code, no roadmap, no repository changes beyond this document.*
