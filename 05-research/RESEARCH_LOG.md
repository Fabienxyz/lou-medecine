# Research Log

This journal records every research session.

The objective is to document discoveries, uncertainties and methodological decisions throughout the project.

---

# Session 001

**Date**

2026-07-02

## Objective

Define the research methodology before analysing the corpus.

## Decisions

- Treat the project as a research programme rather than a software project.
- The corpus is the only source of truth.
- Architecture will emerge from evidence rather than assumptions.

## Open Questions

- What are the recurring structures within the cardiology college?
- What types of knowledge actually exist?
- Which pedagogical transformations are universally applicable?

## Next Session

Begin Pass 1: Structural Analysis.

---

# Session 002

**Date**

2026-07-25

## Objective

Test the understanding-first learner experience with Lou on generated Item 234 content, and decide the shape of the pedagogical unit she actually reads.

## Scope and evidence limits

This entry records decisions validated during live testing with Lou. The session transcript is **not** held in the repository, so the only verbatim learner statement recorded here is the one below. Statements not quoted are reported as validated outcomes, not as evidence; anything requiring quotation should be re-derived from the session before being promoted into `PATTERNS.md`, whose threshold is evidence from at least two conversations.

Recorded learner statement, motivating the Personal Diagram affordance:

> "When I do not fully understand a mechanism, I redraw it in my own way."

## Decisions

- **The pedagogical block is the unit of the understanding experience.** One block per Blueprint element: question → optional Official Visual → Personal Diagram affordance → Guided Walkthrough → Inline Notes affordance.
- **The Guided Walkthrough is the canonical explanation** of a Blueprint element. It accompanies the learner through a mechanism; it is not a chapter summary, a figure caption, an additional explanation, or a simplified rewrite of the College.
- **The Official Visual is optional pedagogical support and is never the primary explanatory artifact.** This *reverses* the visual-first composition rule previously ratified in `VISUAL_GRAMMAR_CONTRACT.md` §5.1, which held that text is subordinate to and explanatory of the visuals. That statement was relabelled and rewritten on the evidence of this session.
- **A block without an Official Visual is fully valid.** Where no visual is present, the walkthrough explains the reasoning itself rather than walking through a figure.
- **The visual is a category, not a diagram type.** Causal and process diagrams, anatomical illustrations, radiological images and ECGs are all Official Visuals. Only specification-generated visuals are in scope for V1; asset-referenced visuals remain recorded and unimplemented.
- **Two separate learner mechanisms, deliberately not unified.** Personal Diagrams answer the redrawing behaviour quoted above and are available on every block. Inline Notes answer annotating an explanation while reading it. They differ in payload, anchor and durability, and must not be generalised into one attachment system.
- **Generated content is immutable.** Personal understanding is expressed only through the two learner mechanisms, which never modify, replace or feed back into generated content.
- **Memorisation stays out of scope for the understanding projection family** — not out of scope for the product. Phase 3 mastery (`00-foundation/vision.md`) is unchanged.

## Open Questions

- At what granularity may an Inline Note be anchored so that it survives regeneration? Claim-block boundaries are durable; finer anchoring is not.
- Does the two-leg grounding model's independent-adjudication cost stay manageable once every Blueprint element carries a walkthrough? (`VISUAL_SPEC_V0_1_EXPERIMENT.md` §7 Q11.)
- Do Personal Diagrams and Inline Notes change how Lou revises over weeks, and does either ever *need* to be visible to the system? V1 answers "no" deliberately.

## Next Session

Observe Lou using real pedagogical blocks — with and without an Official Visual — and check whether the walkthrough alone carries the explanation as intended.
