# visualSpec v0.1 — First Vertical Slice Experiment

| | |
|---|---|
| **Type** | Implementation experiment report |
| **Status** | EXPERIMENTAL — schema not ratified |
| **Scope** | `causal-graph` primitive only, one Blueprint element |
| **Slice** | Item 234 · `MM-pump-decompensation` |
| **Governs nothing** | `VISUAL_GRAMMAR_CONTRACT.md` remains unchanged by this experiment |
| **Date** | 2026-07-24 |

**Round 1** designed the schema, built the spec, and implemented structural
validation. **Round 2** ran an independent semantic grounding pass, which changed
the graph, and added the render-eligibility gate. This document reflects the state
after round 2; §5 records what the independent pass overturned.

---

## 0. What this experiment was for

The contract ratified the *need* for a semantic intermediate representation between
Blueprint and renderer, and deliberately refused to freeze its schema until a real
slice had been built. This is that slice.

No SVG was rendered. No renderer was written. The question under test is narrow:

> Can a renderer-independent semantic specification carry the chapter's central
> causal model with per-unit source traceability, and can a deterministic validator
> catch the failure modes the audit identified — *before* any pixel exists?

Short answer: yes, with one budget correction and three genuinely open questions.

---

## 1. Schema decisions tested

The audit sketched an illustrative schema. Every field in it was re-derived from
scratch and had to justify itself against one test: *is this required for semantic
meaning, traceability, validation, or safe extensibility?* Four proposed fields
failed that test and were removed.

### 1.1 Fields kept

| Field | Level | Why it survived |
|---|---|---|
| `spec_version` | spec | Lets the validator refuse specs written against a schema it does not understand. Essential while the schema is unstable |
| `primitive` | spec | The discriminator. Selects both the renderer and the structural contract |
| `chapter` | spec | KP identifiers are chapter-local; without this, a spec could silently reference another chapter's `KP-001` |
| `element` | spec | Binds the visual to the Blueprint element that authorised it |
| `question` | spec | The learner question the visual answers. A reviewer cannot audit a graph without knowing what it claims to answer |
| `provenance` | spec | Matches the existing projection convention. Detects a spec generated against a stale Blueprint revision |
| `id`, `kind`, `label`, `class`, `kp` | node | Stable identity, semantic type, learner-visible text, and grounding |
| `from`, `to`, `relation`, `class`, `kp` | edge | Topology, semantic relation, and independent grounding |

### 1.2 Fields deliberately rejected

| Rejected | Reason |
|---|---|
| `semantic_role` (e.g. `chapter-spine`) | This describes composition role, which contract §1.1 assigns to the **projection**, not the spec. Keeping it would have leaked a layer boundary on day one |
| `budget` / `max_nodes` on the instance | A spec that declares its own limits can raise them and self-approve. Budgets moved into `PRIMITIVE_CONTRACTS` in the validator, where the instance cannot reach them |
| `traceability: { all_nodes_traced: true }` | A self-asserted compliance flag. The validator computes this; a spec asserting its own correctness is worse than useless |
| `takeaway` | A learner-visible sentence is a claim needing its own grounding, and duplicates what the projection prose already does |
| node `emphasis`, edge `label` | Neither was needed to express this graph. The relation vocabulary carried the meaning. Shipping unexercised optional fields is how schemas rot |

**v0.1 therefore has zero optional fields.** Every field in the schema is used by
the one spec that exists. That is a deliberate result, not an accident.

### 1.3 Vocabularies

`class` reuses the existing claim-block vocabulary verbatim — `sourced`,
`bridging`, `scaffolding` — rather than inventing a visual-only equivalent. This
is what made the grounding adapter in §4 a twenty-line function instead of a
parallel subsystem.

Enum values were restricted to those the slice actually uses:

- `kind`: `state`, `event`, `response`
- `relation`: `causes`, `transmits`, `feeds_back`

`triggers` was dropped as a synonym of `causes`. `amplifies` and `intervention`
were dropped as unexercised.

### 1.4 Geometry exclusion

The validator uses **strict unknown-key rejection** at spec, node, and edge level.
That alone forbids geometry, but a bare "unknown field" message invites an author
to think the field merely needs registering. So 74 known geometry and style keys
(`x`, `width`, `fill`, `font_size`, `layout`, `svg`, `transform`, …) produce a
specific error naming contract invariant I3 instead.

---

## 2. The MM-pump-decompensation graph

Derived from `blueprint.md` and `inventory.yaml`. The legacy SVG corpus was not
consulted.

Shown after the round-2 grounding pass.

```
        cardiac-abnormality  "Anomalie cardiaque (structure/fonction)"
                 │ causes ......................................... bridging
                 ▼
    ┌──────► pump-failure     "Pompe cardiaque défaillante"
    │            ├── causes ──► low-output        "Débit insuffisant"
    │            │                   │ causes ................... bridging
    │            │                   ▼
    │            │              compensation      "Compensations neurohormonales (sympathique, SRAA)"
    │            │                   │ causes
    │            │                   ▼
    └── feeds_back ───────────── overload         "Surcharge de travail, effets délétères"
                 │                                 ......................... bridging
                 ├── causes ──► filling-pressure  "Pressions de remplissage ↑"
                 │                   │ transmits
                 │                   ▼
                 │              congestion        "Congestion pulmonaire et systémique"
                 │
                 └── causes ──► acute-decompensation  "Décompensation aiguë"
```

8 nodes, 8 edges, exactly one cycle:
`pump-failure → low-output → compensation → overload → pump-failure`.

### 2.1 Grounding, unit by unit

All 16 semantic units resolve to real College anchors through the existing
`anchorForKp()` path. Thirteen are `sourced` and pass deterministically; three
edges are `bridging` and carry independent verdicts.

| Unit | Class | KPs |
|---|---|---|
| node `cardiac-abnormality` | sourced | KP-002 |
| node `pump-failure` | sourced | KP-001, KP-006 |
| node `low-output` | sourced | KP-001, KP-006 |
| node `filling-pressure` | sourced | KP-001, KP-006, KP-040 |
| node `compensation` | sourced | KP-008, KP-011, KP-012 |
| node `overload` | sourced | KP-008, KP-011, KP-012 |
| node `congestion` | sourced | KP-040, KP-007 |
| node `acute-decompensation` | sourced | KP-059, KP-068 |
| edge `cardiac-abnormality → pump-failure` | **bridging** | KP-002, KP-001 |
| edge `pump-failure → low-output` | sourced | KP-006, KP-001 |
| edge `pump-failure → filling-pressure` | sourced | KP-006, KP-001 |
| edge `pump-failure → acute-decompensation` | sourced | KP-059 |
| edge `low-output → compensation` | **bridging** | KP-008, KP-011, KP-012 |
| edge `compensation → overload` | sourced | KP-008, KP-011, KP-012 |
| edge `overload → pump-failure` | **bridging** | KP-008, KP-011, KP-012 |
| edge `filling-pressure → congestion` | sourced | KP-040, KP-007 |

Each bridging edge carries a rationale comment in the spec and an adjudicated
verdict in `build/visual-grounding-review.yaml`.

---

## 3. Deterministic validation implemented

`tools/lou-build/lib/visual-spec.js`. All rules fail loudly; none warn.

| | Rule | Implementation |
|---|---|---|
| A | Schema validity | Required fields, types, strict unknown-key rejection at three levels, `spec_version` gate |
| B | Primitive discriminator | Must be present and in `SUPPORTED_PRIMITIVES` |
| C | Unique node IDs | Plus lowercase kebab-case enforcement, so IDs are safe as DOM attribute values later |
| D | Edge endpoints exist | Dangling `from`/`to` named explicitly; self-loops rejected; duplicate edges rejected |
| E | KP references resolve | Against canonical `inventory.yaml`, when an inventory is supplied |
| F | Node grounding | `sourced`/`bridging` require ≥1 KP; `scaffolding` must carry none |
| G | Edge grounding | Same rule, applied independently — an edge is a claim |
| H | No geometry | 74 named geometry/style keys rejected with a contract-citing message |
| I | Structural budget | ≤8 nodes, ≤12 edges, ≤6 words per label |
| J | Cycle discipline | ≤1 declared `feeds_back` relation, **and** every cycle must contain a `feeds_back` edge (see round 3 correction, §3.2) |
| K | No orphan content | Every node must participate in at least one edge |

Two rules were added beyond the brief because the slice showed they were needed:

**Label word budget (part of I).** A paragraph in a node means the relationship was
never actually modelled — it was pasted. This is the defect that produced the
legacy corpus's text-stacks, and it is cheap to prevent structurally.

**Undeclared-cycle rejection (part of J).** A cycle formed entirely of `causes`
edges teaches reinforcement the author never asserted. Requiring a `feeds_back`
edge in every cycle makes the feedback claim explicit and auditable.

Referential checks (E, and Blueprint element existence) run only when an inventory
or Blueprint is supplied, so structural validation stays pure and unit tests stay
fast.

### 3.1 Negative tests

`tools/lou-build/test/visual-spec.test.js` — 28 tests. With
`tools/lou-build/test/visual-ground.test.js` (12 tests covering the grounding legs
and the eligibility gate) and `tools/lou-build/test/visual-render.test.js` (29 tests
covering layout, text fitting, traceability, accessibility and determinism),
**69 tests, all passing, ~200 ms**.

Every rejection the brief required is proven, plus several the slice suggested:

| Negative case | Result |
|---|---|
| Unknown KP reference | rejected — `unknown KP reference KP-404` |
| Dangling edge endpoint | rejected — `dangling edge endpoint "to: ghost"` |
| Ungrounded medical node | rejected — `ungrounded node` |
| Ungrounded medical edge (both endpoints grounded) | rejected — `ungrounded edge` |
| Missing class entirely | rejected — `missing class` |
| Scaffolding claiming KP grounding | rejected |
| Forbidden geometry on node / edge / spec (`x`, `stroke`, `layout`) | rejected, citing I3 |
| Unknown non-geometry field (`takeaway`) | rejected, not ignored |
| Excessive node budget (11 nodes) | rejected |
| Paragraph-like label | rejected — `label exceeds 6 words` |
| Multiple feedback relations | rejected — `2 feedback relations exceeds … budget of 1` |
| One feedback relation over a fan-in (2 simple cycles) | **accepted** — see §3.2 |
| Undeclared cycle (all `causes`) | rejected — `contains no feeds_back relation` |
| Self-loop | rejected |
| Duplicate node IDs | rejected |
| Orphan node | rejected |
| Wrong primitive / unknown relation | rejected |
| Unsupported `spec_version` | rejected |
| Element absent from Blueprint | rejected |

### 3.2 Round-3 correction: rule J counted the wrong thing

The renderer round exposed a defect in rule J. As originally written, the budget
was `≤ 1` **enumerated simple cycle**. That is not the same quantity as "one
feedback relationship", and the difference is not academic:

> A single `feeds_back` edge that closes over a fan-out followed by a fan-in
> produces **two** simple cycles while asserting **one** feedback relationship.

The non-medical fixture built to prove renderer generality (`A → B`, `A → C`,
`B → D`, `C → D`, `D → A feeds_back`) is exactly that shape, and the validator
rejected it with `2 cycles exceeds causal-graph budget of 1`. The shape is one the
grammar is explicitly meant to express — the audit lists fan-in as a required
`causal-graph` topology — so the rule, not the fixture, was wrong.

`MM-pump-decompensation` passed only by accident: its loop
(`pump-failure → low-output → compensation → overload → pump-failure`) contains no
fan-in, so path count and relation count happen to coincide at 1. Any future spec
that routes two contributing mechanisms into a single overload node would have been
rejected for a defect it did not have.

**Classification.** Not a missing semantic field, and not a layout or style need.
This is a **validation-rule defect**: the implementation diverged from the rule's
own stated intent. The fix therefore does not broaden the schema — no field was
added, relaxed, or removed, and the set of expressible semantics is unchanged:

- the budget now counts `feeds_back` edges;
- the undeclared-cycle rule is untouched, so a cycle made only of `causes` edges is
  still rejected, however many paths it spans;
- `stats` now reports `feedbackRelations` alongside `cycles` and `cyclePaths`, so
  the distinction is visible to an auditor.

Cycle enumeration is retained: it is what detects undeclared feedback, and its
`cyclePaths` output remains the useful diagnostic. It is simply no longer the
quantity being budgeted.

---

## 4. Grounding integration

**Status: integrated. The spec is render-eligible behind a computed gate.**

`visualSpecClaimUnits(spec)` projects a spec onto the existing claim-block shape.
It was verified end to end against the real `assembleTraceability()` with no
changes to that function: 16 units in, 16 traceability entries out, every one
carrying resolved College anchors.

- **A node becomes an addressable claim** as `cb-vis-<element-slug>-n-<node-id>`,
  e.g. `cb-vis-mm-pump-decompensation-n-pump-failure`.
- **An edge becomes an addressable claim** as
  `cb-vis-<element-slug>-e-<from>-to-<to>`.
- **KP provenance is unchanged.** The units carry `kp: []` and flow through
  `anchorForKp()` exactly as prose claims do. No visual-only provenance format.
- **Rendered elements keep stable semantic IDs** because these identifiers derive
  from author-chosen node IDs, never from ordinal position (contract I7). A future
  renderer emits them as `data-claim` attributes; reordering the graph cannot
  change them.
- **Grounding failures would block the build** once wired: the units join
  `allClaims` before `mergeSemanticGrounding()`, which already returns
  `ok: false` for any `bridging` or `scaffolding` claim lacking an independent
  verdict.

### 4.1 The independent review record

Round 1 deferred wiring because the only way to pass three `bridging` edges was
the bootstrap allowlist — a mechanism designed to prevent exactly that kind of
hand-waving. Round 2 resolved it properly, without touching the allowlist.

`build/visual-grounding-review.yaml` records the independent pass: for each
judgement-class unit, the claim in plain language, the anchors weighed, the
reasoning, and a verdict. Two properties keep it from decaying into an auto-pass
list:

- **Every verdict is bound to a `unit_digest`** — a hash over the unit's id, kind,
  label, class, relation, and KP set. Change any of them and the verdict stops
  applying; the unit reverts to `unresolved`, which blocks rendering. An allowlist
  grants standing to an *identifier*; this grants standing to a *specific claim*.
- **Every verdict states its evidence and reasoning**, so it can be contested
  rather than merely trusted.

A test proves the staleness property directly: adding one KP to the feedback edge
of the real spec, without re-review, turns it `unresolved` and makes the chapter
ineligible.

### 4.2 The two-leg grounding model

`groundVisualSpec()` in `lib/visual-ground.js` reuses the claim IDs, the class
vocabulary, the `{ok, errors, verdicts, status}` result model, and the
`writeGroundingYaml()` writer from `ground.js` — which is imported, not modified.

| Class | Leg | Rule |
|---|---|---|
| `sourced` | deterministic | Every cited KP must resolve to an anchor with a non-empty quote. An independent `fail` still overrides |
| `bridging` | judgement | Requires an independent verdict with a matching digest and `status: pass` |
| `scaffolding` | judgement | Same requirement. Asserting that something carries *no* medical claim is itself a judgement, and the existing prose pipeline already treats scaffolding this way |

Anything missing, stale, failed, or not-passed becomes `unresolved` or `fail`, and
both block.

### 4.3 The render-eligibility gate

`renderEligibility({ validation, grounding })` returns `{ eligible, reasons,
blocking }`. A spec is eligible only when structural validation passes, verdicts
exist, and every single verdict is `pass`.

It is deliberately **a computed function, never a persisted flag**. A stored
`eligible: true` would be a self-certifying artifact that outlives the facts
justifying it — the same reason `traceability.all_nodes_traced` was cut from the
schema in round 1. `build/visual-grounding.yaml` therefore persists the 16
verdicts, which are auditable per node and per edge, but not the verdict *about*
the verdicts.

Current state, from `build/generate-visual-grounding.mjs`:

```
✓ MM-pump-decompensation: render-eligible (16 semantic units)
```

The generator exits non-zero when any spec is blocked, so it can gate a build
without any renderer existing yet.

---

## 5. Independent semantic audit of the graph

### 5.0 What the round-2 independent pass changed

Round 1's audit reasoned from the Inventory labels and quotes that the spec was
generated from — which is close to self-certification. Round 2 re-read the primary
College text (`official-college.md`) around each cited anchor. That pass overturned
three of the eight edges:

| Edge | Round 1 | Round 2 | Why |
|---|---|---|---|
| `cardiac-abnormality → pump-failure` | bridging | **bridging** (confirmed, PASS) | Entailed by substitution: KP-002 asserts the abnormality causes insufficient output, KP-001 defines pump failure as exactly that inability |
| `overload → pump-failure` | bridging | **bridging** (confirmed, PASS) | Entailed: catecholamine myocyte toxicity plus added workload on a failing heart *is* deterioration of the pump. "Délétère" in KP-008 has no other referent |
| `low-output → compensation` | sourced | **downgraded to bridging** (PASS) | The College frames compensation as a response to cardiac dysfunction as a whole — "En cas de dysfonctionnement cardiaque, l'organisme réagit". Only KP-012 gives an explicit trigger, and it runs via renal perfusion, not output |
| `congestion → acute-decompensation` | bridging | **REMOVED** | Too strong. See below |
| `pump-failure → acute-decompensation` | — | **added, sourced** | KP-059 defines acute HF as rapid symptoms "en rapport avec une altération de la fonction de la pompe cardiaque" |

**The removed edge is the substantive finding.** The spec claimed congestion causes
acute decompensation. The College does not say that. It attributes acute HF to
pump-function alteration (line 725), and attributes only the *OAP subtype* to a
marked rise in pulmonary capillary pressure (line 732) — a threshold that belongs
to `MEC-oap`, not to the chapter spine. Elsewhere the source describes congestive
signs as *accompanying* a decompensation ("associée à l'apparition ou l'aggravation
de signes congestifs"), which is association, not causation. Chronic congestion
without acute decompensation is ordinary. The claim was an over-generalisation from
one subtype to the category, so it was removed and replaced with the relation the
source actually asserts.

Note that no new relation kind was invented to weaken the edge. Restructuring
expressed the source faithfully within the existing vocabulary, so v0.1 was not
broadened.

One thing the pass found but could **not** act on: the College's opening sentence
("Toutes les pathologies cardiovasculaires… peuvent conduire à l'IC") and its
clinical definition ("ce dysfonctionnement peut être d'origine myocardique,
valvulaire, péricardique…") would make the first edge directly `sourced`. Neither
sentence is carried by any KP. The Inventory, not the raw source, is the canonical
layer, so the edge stays `bridging` and the gap is logged in §7.

> **Does every arrow express a real supported relationship?**

Now yes. Five edges are asserted within the anchor text of a cited KP. Three are
inferences joining KPs, declared `bridging`, and each carries an independent
verdict with recorded reasoning. The one edge that expressed an unsupported
relationship was removed rather than reclassified.

> **Did we accidentally convert temporal succession into causation?**

We had, once, and it has been fixed. `congestion → acute-decompensation` was
precisely that error: decompensation follows congestion in time, and round 1
mistook the OAP mechanism for a general causal warrant. Removing it is the clearest
evidence that separating generation from grounding does real work — the same
reasoning that produced the edge was not going to catch it.

> **Did we collapse distinct mechanisms too aggressively?**

One real defect was found and fixed. The `compensation` node initially cited
KP-010 (Starling) and named Starling in its label, while the graph drew no
preload → inotropy edge. The node was claiming a Knowledge Point the graph never
expressed. It is now scoped to the neurohormonal responses KP-012 itself calls
"les plus importants", and KP-010 was removed.

Notably, adding the missing Starling edge (`filling-pressure → compensation`)
would create a **second** cycle, which v0.1 forbids. See §7, question 2.

Remodelling (KP-009) was deliberately kept out. It is its own Blueprint element
with its own visual, and folding it into an `overload` node would be exactly the
collapse this question warns about.

> **Does the feedback relationship genuinely represent the chapter model?**

Yes. `overload → pump-failure` is the chapter's central teaching: compensation
becomes the disease. The Blueprint states the loop explicitly. The Inventory
supplies the components — increased cardiac work (KP-008, KP-011), proarrhythmic
effects and direct catecholamine myocyte toxicity (KP-012) — but never closes the
loop back onto the pump in a single anchor. `bridging` is the correct and honest
classification, and this is the single most important edge to adjudicate.

> **Can Lou reconstruct the chapter's central logic from the spec alone?**

Yes. Reading only the eight nodes and eight edges: a cardiac abnormality produces a
failing pump; the failing pump produces both inadequate output and elevated filling
pressures; the output deficit recruits neurohormonal compensation; compensation
imposes overload that feeds back onto the pump; the pressure side transmits upstream
into congestion, which decompensates acutely. That is the chapter spine, and the
loop is the insight.

> **Is anything important missing?**

Three deliberate absences, each with a reason:

- **EF phenotype (HFrEF / HFmrEF / HFpEF)** — belongs to `threshold-scale`, a
  different primitive. Forcing a continuum into causal nodes would misrepresent it,
  which is the specific error the legacy corpus made.
- **Remodelling** — separate Blueprint element, as above.
- **Mortality (KP-067)** — an outcome statement, not a mechanism. A causal node
  would imply the spine *produces* a statistic. Better served by prose.

The debatable one is mortality: the Blueprint's own description of the mental model
mentions "high hospitalization and mortality burden", and only hospitalisation
(KP-068) made it in. Recorded as an open question.

> **Is anything present only because it makes the graph visually convenient?**

No node was added for symmetry, and no edge was drawn to close a shape. One
candidate edge (`overload → acute-decompensation`) was considered and rejected: it
would have given the diagram a satisfying second convergence, but no anchor
supports it.

---

## 6. Cross-domain stress check

Conceptual only; nothing implemented.

### A. Pharmacology — drug → target/mechanism → desired + adverse effect

**Mostly expressible.** Topology is a plain fan-out, well within budget, and needs
no cycle.

*Genuinely required:* one new `kind` value — `intervention`. A drug is not a
`state`, an `event`, or a `response`. This is the only field-level gap the entire
stress check produced.

*Should NOT be added yet:* effect polarity (desired vs adverse). The schema
currently cannot distinguish a therapeutic branch from a harm branch, which for a
pharmacology chapter is central. But Item 234's spine does not need it, and the
right shape is unclear — node valence, edge valence, or edge `kind` as the audit
proposed for mortality-modifying versus symptomatic treatment effects. `CR-treat-hfref`
will force this question properly in Wave 2. Deciding now, from a hypothetical,
would be guessing.

*Marginal:* `acts_on` as a relation distinct from `causes`. Workable without it.

### B. Multi-system feedback — organ A ⇄ organ B → systemic consequence

**Expressible, but it breaks a v0.1 rule.** Two edges A→B and B→A form exactly one
simple cycle, within budget. Additional edges to a systemic-consequence node add no
cycles.

The problem is rule J's requirement that every cycle contain a `feeds_back` edge.
In cardio-renal crosstalk, neither direction is the "return arc" — the relationship
is symmetric. Forcing one edge to be `feeds_back` would assert a primacy the
medicine does not have. This rule encodes a spine-with-return-arc assumption that
happens to fit Item 234 and will not fit mutual organ crosstalk.

*Should NOT be added yet:* a `bidirectional: true` edge flag. That is a rendering
shortcut for two edges and would hide one of the two claims from grounding.

### C. Non-medical causal example

Tested against a pure cycle with no acyclic entry: understaffing → overtime →
burnout → attrition → understaffing.

**Fully expressible with zero schema changes.** All units classify as
`scaffolding`, carry no KPs, and validate cleanly. This is a good signal: the
schema's *structure* is not medicine-specific, only its grounding vocabulary is,
and that vocabulary already has a correct escape for non-medical content.

Note that structural validity is not eligibility: under §4.2, scaffolding still
requires an independent verdict confirming it carries no medical claim, so a
non-medical graph is not waved through to rendering either.

One observation: a graph consisting solely of a cycle, with no root node, passes
validation. That seems right for scaffolding but is untested for medical content.

### Stress-check summary

| Change | Verdict |
|---|---|
| `kind: intervention` | Genuinely required by domain A. Not required by Item 234 — **defer to the chapter that needs it** |
| Rule J's `feeds_back` requirement | Needs revision before domain B. Correct for the current slice |
| Effect polarity / valence | **Do not add.** Wait for `CR-treat-hfref` |
| `acts_on` relation | **Do not add.** `causes` suffices |
| `bidirectional` edge flag | **Do not add.** Hides a claim |
| Node `emphasis`, edge `label`, `lane`/`group` | **Do not add.** Unexercised |

Nothing in the stress check requires broadening the implementation now.

---

## 7. Unresolved questions

1. **Node budget.** The audit hypothesised ≤7 nodes for a dominant Overview visual.
   The spine genuinely needs 8: dropping either the origin (`cardiac-abnormality`)
   or the titular concept (`acute-decompensation`) loses something the chapter
   teaches. The budget was raised to 8 rather than distorting the content — but
   whether 8 is a principled ceiling or simply this graph's size is unknown, and
   the right budget may depend on composition role (dominant spine versus compact
   supporting visual), which the spec deliberately does not know.

2. **One cycle, or one cycle *per primitive role*?** The Starling edge and the
   organ-crosstalk case both bump against `maxCycles: 1`. Real physiology has
   intertwined loops sharing edges. Is the limit protecting readability, or
   suppressing accurate models?

3. **`feeds_back` in symmetric relationships.** As §6B shows, the rule assumes an
   asymmetric spine. Needs a symmetric-aggravation concept, or relaxation.

4. **`transmits` overlaps the `transmission-path` primitive.** Here it compresses a
   whole anatomical pathway into a single edge, which is the right handoff for a
   spine. But the same relation is the entire subject of another CORE primitive.
   Keep it as a deliberate compression, or forbid it in `causal-graph`?

5. **Blueprint vocabulary is out of date, but inert.** `blueprint.md` declares
   `intent: process-flow` for this element under `visual_plan`. Round 2 checked
   whether this needs migrating and found that **`visual_plan` has no code
   consumers at all** — only `visual_intent`, on `mechanisms` and
   `clinical_reasoning` entries, is read (by `blueprint.js`, `package.js`,
   `svg.js`). `MM-pump-decompensation` is a `mental_model` element and carries no
   `visual_intent` field. Its `visual_plan` entry is documentation.

   The renderer prototype will consume the spec's `primitive: causal-graph`, so no
   Blueprint change is required and none was made. Migration becomes necessary when
   `visual_plan` gains a consumer, or when a mechanism with a live `visual_intent`
   needs a non-`process-flow` primitive — at which point it should be done for the
   whole vocabulary at once, not element by element.

6. **Where does `question` come from for mental-model elements?** `mechanisms` and
   `clinical_reasoning` entries have a `question:` field; `mental_model` does not.
   The question in this spec had to be authored during spec generation. Either the
   Blueprint gains a question for mental-model elements, or spec generation owns it
   — but then it is authored learner-visible text with no Blueprint provenance.

7. **Machine-readable rationale for `bridging` units.** The three inferences are
   currently explained in YAML comments, which no validator or grounder can read. A
   `note:` field on bridging units is the strongest v0.2 candidate. It was left out
   because v0.1 was kept at zero optional fields.

8. **Should mortality (KP-067) be in the spine?** See §5.

9. **Generation reproducibility is untested.** This spec was derived by reasoning
   over the Blueprint and Inventory. Whether that derivation is reproducible — and
   how much a second pass would differ — is the largest untested assumption in the
   whole approach, and no amount of validator strictness addresses it.

10. **The Inventory does not carry the College's own causal opening.** Two sentences
    that would promote the first edge to `sourced` are unanchored by any KP (§5.0).
    This is an Inventory coverage gap surfaced by visual work, not a visual problem,
    and Inventory changes were out of scope.

11. **Review-record maintenance cost is unmeasured.** Digest binding is what stops
    the review from becoming an allowlist, but it means any edit to a bridging unit
    forces re-adjudication. With three units that is trivial; across a chapter's
    worth of visuals it may not be. No evidence yet either way.

12. **The independent pass is only partly independent.** Round 2 re-read primary
    source rather than Inventory labels and overturned three of eight edges, so it
    was not a rubber stamp. But it was performed by the same kind of agent that
    generated the spec. A genuinely adversarial reviewer — a different model, or a
    human — remains untested.

### 7.1 Status after the 2026-07-25 pedagogical decisions

The pedagogical block, the walkthrough–visual asymmetry and the learner layer
(`IMPLEMENTATION_CONTRACT.md` Part B, C.4, C.8/C.9) change the standing of four of
these questions. Numbering is unchanged.

- **Q6 — resolved.** `blueprint.md` now carries `mental_model: { id, question }`, and
  the Blueprint is the single canonical origin of that question; a spec's `question`
  is derived from it. The feared outcome — authored learner-visible text with no
  Blueprint provenance — is closed off, because the mental model is projected as a
  pedagogical block like any other element and every block needs a question anyway.

- **Q5 — trigger fired, migration still not done.** `visual_plan` now *has* a code
  consumer: `package.js` reads it to derive the `planned-not-built` availability
  state, and `blueprint.md` names it the canonical declaration of which elements
  warrant an Official Visual. Q5's own condition ("migration becomes necessary when
  `visual_plan` gains a consumer") is therefore met. The consumer only reports the
  declared intent and never dispatches on it, so nothing is broken today — but
  `MM-pump-decompensation` is still declared `intent: process-flow` while its
  validated spec is `causal-graph`. Per Q5's own instruction the vocabulary should be
  migrated **for the whole `visual_plan` at once**, not element by element, and that
  was deliberately left out of scope here.

- **Q11 — cost profile worsened; a mitigation appeared.** Every Blueprint element now
  carries a Guided Walkthrough, and walkthroughs are dense in bridging claims —
  "why this connects to that" is precisely what a walkthrough says. Review-record
  maintenance therefore scales with elements, not with visuals, which is the larger
  number. The mitigation to test in the slice: a visual's bridging unit and its
  walkthrough's corresponding bridging claim are usually the *same inference*, so one
  adjudication should be able to serve both. Untested.

- **Q1 — less load-bearing.** The node-budget question was defending against visual
  overload in a visual-first Overview. With the walkthrough canonical and visuals
  optional (`VISUAL_GRAMMAR_CONTRACT.md` §5.1, §5.2), a graph that will not fit
  legibly is now allowed to not exist. The budget still matters for the visuals that
  do exist; it no longer has to carry the chapter's comprehension.

---

## 8. Verdict

**v0.1 should remain EXPERIMENTAL, and is recommended for provisional adoption as
the input contract for a renderer prototype.**

What worked:

- The layer boundary held. Nothing in the spec touches geometry, and removing
  `semantic_role` and `budget` caught two boundary leaks before they shipped.
- Reusing the existing claim vocabulary made grounding integration nearly free.
  Sixteen semantic units flow through the untouched traceability assembler and the
  untouched `writeGroundingYaml()`, and resolve to real College anchors.
- Per-edge grounding earned its cost twice over. Treating edges as claims is what
  exposed the feedback edge as an inference rather than a quotation in round 1, and
  what exposed `congestion → acute-decompensation` as unsupported in round 2.
- **Separating generation from grounding did real work.** The round-2 pass changed
  three of eight edges, including removing one outright. A pipeline where the
  generator also certifies itself would have shipped that edge.
- Digest-bound verdicts give a workable answer to "how do you accept an inference
  without creating an auto-pass allowlist", and the staleness behaviour is proven
  by test rather than asserted.
- Validation caught a real defect in the first spec ever written (the Starling
  citation), which is the strongest available evidence that the check is worth
  having.
- The audit's central thesis is supported: with typed nodes and edges available, a
  renderer no longer needs to guess semantics from prose, which is what forced the
  hard-coded medical strings in `svg.js`.

What should change before ratification:

- Resolve questions 1–3 (budget and cycle rules), which are the constraints most
  likely to distort content.
- Add `note:` on bridging units (question 7) — round 2 made this more pressing, since
  the review record now duplicates rationale that arguably belongs on the unit.
- Decide where the learner question lives (question 6).
- Get one genuinely adversarial review (question 12).

None of these blocks a renderer prototype, because none of them changes the
node/edge core the renderer would consume.

The Blueprint `visual_intent` migration is no longer on this list: round 2
established that `visual_plan` is inert (question 5), so it is a documentation
cleanup, not a prerequisite.

### GO / NO-GO — deterministic `causal-graph` renderer prototype

**GO.** `MM-pump-decompensation` is render-eligible: structural validation passes,
all 13 sourced units are deterministically grounded, and all 3 bridging edges hold
independent digest-bound `pass` verdicts. The canonical order is satisfied — nothing
has been rendered, and nothing can be until the gate is consulted.

Four conditions:

1. The renderer consumes the spec and nothing else. No chapter file, no Blueprint
   prose, no fallback string may reach its output — the failure mode in `svg.js`
   today.
2. **The renderer calls `renderEligibility()` and refuses to emit when it returns
   false.** The gate exists; it is only worth anything if rendering is downstream of
   it. Eligibility must be recomputed, never read from a file.
3. The renderer computes all geometry from the graph, including text measurement.
   Overflow fails or adapts deterministically; it never truncates (contract I4/I5).
4. Rendered node and edge groups carry the `cb-vis-*` identifiers from §4 as stable
   attributes, so a visual element remains addressable as a claim.

The renderer prototype should also be treated as a test *of the schema*: if it
needs any field the spec does not carry, that is a schema finding, not a licence to
add a field to the instance.

---

## 9. Round 3 — what the renderer proved about the schema

The prototype renderer (`lib/text-fit.js`, `lib/visual-layout.js`,
`lib/visual-render.js`) consumes `mm-pump-decompensation.yaml` and nothing else, and
all four GO conditions above were met. What matters for the schema:

**No semantic field was missing.** The renderer needed exactly `primitive`,
`question`, node `id`/`kind`/`label`, edge `from`/`to`/`relation`, and the `class`
and `kp` fields it echoes as traceability attributes. Every field in v0.1 was used;
none was insufficient. This is the strongest evidence so far that the node/edge core
is right, since a renderer is the least forgiving consumer of an under-specified
schema.

**The three fields rejected in round 1 stayed rejected, and were not missed:**

| Rejected field | Where the need actually landed |
|---|---|
| `emphasis` | Derived from `kind` via a design token. A node does not need to be told how loud to be. |
| `budget` | The renderer's own `LAYOUT` constants. Purely a layout concern. |
| `traceability.all_nodes_traced` | Recomputed by the gate on every render. |

**Three needs arose and were classified rather than absorbed into the schema:**

| Need | Class | Resolution |
|---|---|---|
| Node width, row order, gutter position, wrap points | **B — layout** | `visual-layout.js`. Nothing persisted; recomputed every run. |
| Fill, stroke, dash pattern, marker shape per `kind`/`relation` | **C — style** | `TOKENS` in `visual-render.js`, sourced from `design-system.md`. |
| Human-readable connective per relation kind, for the text alternative | **C — style/grammar** | One word per schema enum member, in the renderer. Grammar-level vocabulary, identical for every chapter — not chapter content. |

**One validation rule was wrong and was corrected** — see §3.2. The generic fixture
found it, which is precisely why the fixture exists.

**Layer separation held under the hardest test.** The renderer contains zero medical
strings, enforced by an assertion over a 35-term deny list across all three renderer
modules. The same code renders a non-medical fixture (staffing → overtime and
deferred maintenance → incidents → back to staffing) with no change, confirming that
`causal-graph` is a grammar and not a chapter-shaped renderer.

**Two style decisions worth recording**, because both were defects caught by looking
at the rendered output rather than at the tests:

- Relation kinds were initially distinguished partly by dash density, which made a
  `sourced` `transmits` edge look fainter than a `bridging` `causes` edge. Line
  weight reads as confidence, and relation kind is orthogonal to grounding strength.
  Kinds are now separated by marker shape at equal stroke weight.
- The heading obeys the same no-truncation rule as a node label: it wraps, widens
  the canvas if needed, and fails loudly rather than overflowing.

This does not change the ratification recommendation. v0.1 remains EXPERIMENTAL;
questions 1–3, 6, 7 and 12 are still open, and none of them was resolved by
rendering.
