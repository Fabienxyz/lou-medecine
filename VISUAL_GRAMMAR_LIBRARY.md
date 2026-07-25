# Visual Grammar Library

| | |
|---|---|
| **Type** | Architectural design proposal — analysis and specification only |
| **Status** | PROPOSAL. Nothing here is ratified. Nothing here authorises implementation |
| **Scope** | Project-wide (Lou Médecine), all chapters and specialties |
| **Testbed** | Item 234 (`cardio/234`) — first and representative case, not the subject |
| **Governance** | Subordinate to `IMPLEMENTATION_CONTRACT.md`, `FINAL_ARCHITECTURE.md`, `VISUAL_GRAMMAR_CONTRACT.md`. Where this document proposes to change a ratified statement, it says so explicitly and labels it an amendment proposal |
| **Evidence base** | `01-learning/chapters/cardio/234/{blueprint.md, inventory.yaml, projections.yaml, projections/understanding/*.md}`, the four root contracts, `05-research/VISUAL_GRAMMAR_AUDIT.md`, `VISUAL_SPEC_V0_1_EXPERIMENT.md`, and the implemented `tools/lou-build/lib/visual-*.js` |
| **Date** | 2026-07-25 |

---

# 0. How to read this document, and what it is for

## 0.1 The question this document answers

Not *"what diagrams should Item 234 have?"* but *"what is the smallest set of semantic structures that a medical curriculum needs in order to be drawable at all?"*

Item 234 is treated throughout as a **probe**, not a subject. Every primitive proposed must justify itself twice: once against a real, traceable pedagogical need in Item 234, and once against the structure of the French EDN curriculum as a whole. A primitive that only Item 234 needs is a defect in this document.

## 0.2 Statement labels

This document reuses the label vocabulary of `VISUAL_GRAMMAR_CONTRACT.md` §0.3 so that its statements can be promoted into that contract without translation.

| Label | Meaning here |
|---|---|
| **PROPOSED CORE** | Recommended for the ratified CORE set. Argued from Item 234 evidence *and* cross-EDN structure |
| **PROPOSED AMENDMENT** | Would change or extend an already-ratified statement. Names the statement it touches |
| **RESERVED** | Specified deliberately, but its implementation is blocked by a named external condition |
| **REJECTED** | Considered and refused, with the reason and the trigger that would reopen it |
| **OPEN** | Genuinely undecided. Recorded so silence is not mistaken for agreement |

## 0.3 What is deliberately not in this document

No schema is frozen here. No field name is normative. No code is proposed. Per-primitive **data contracts** are given at the level of *required semantic structure*, because that is what has to be stable for years; the exact YAML key spelling is a v0.x implementation matter and `VISUAL_GRAMMAR_CONTRACT.md` §6.3 correctly refuses to freeze it.

## 0.4 The three constraints that shaped every decision below

These are already ratified and they do more work in this design than any aesthetic judgement.

1. **I8 — a visual exists only because structure adds cognitive value.** Absence is a legitimate and frequently correct outcome. The working test — no arrow, no axis, no meaning-bearing adjacency, therefore not a diagram — eliminated roughly half of the candidates considered below.
2. **§5.1 — the Guided Walkthrough is canonical; the Official Visual is optional support.** This is the single most consequential constraint. It means a visual's job is never *to explain*. Its job is to make **non-linear structure** apprehensible in one glance — branching, cycles, parallelism, partition, simultaneity, non-monotonicity. Prose is excellent at linear sequence and terrible at all six. That asymmetry, not taste, decides which elements get a visual.
3. **I9 — SVG, HTML, tables and structured text are all first-class outcomes.** A grammar that can only emit diagrams will be used to emit diagrams where none belong. Two of the nine primitives below exist specifically so that "this is a set, not a sequence" is an *authorable, validated, grounded artifact* rather than a hole in the language.

---

# 1. Phase 1 — Independent analysis of Item 234's visual needs

## 1.1 Method

Derived from `blueprint.md` (22 elements + the mental model), `inventory.yaml` (109 Knowledge Points, of which the `understanding` disposition set is the in-scope population), the four published projections, and the pedagogical intent recorded in `IMPLEMENTATION_CONTRACT.md` Part B and `VISUAL_GRAMMAR_CONTRACT.md` §5.1.

Three questions were asked of every element, in this order, and the third was only asked when the first two produced an answer:

1. **What must the learner be able to do afterwards that she cannot do now?**
2. **What is the shape of the thing she must hold in her head?**
3. **Does that shape survive being written as a sentence?** If yes, there is no visual. If no, the shape *is* the visual's content.

One methodological decision matters and should be recorded. **The published projections were read as evidence, not as output.** They were written after the Blueprint by an author who had to make the reasoning work in prose, and where that author reached for structure the prose could not carry, that reach is a demand signal independent of any prior visual plan. Seven such reaches exist: `mechanisms.md` contains four Markdown tables, `clinical-reasoning.md` two, `overview.md` one. Two of them contain arrows *inside table cells* (`CONF-left-right`: "VG → OG → capillaires pulmonaires"), which is an author drawing a path because no path primitive was available. That is the same class of signal as the hand-drawn ASCII triage the audit found.

A second decision: **the walkthroughs' own explicit statements about visuals were treated as findings.** Three are load-bearing:

- `MEC-congestion`: *"Ce bloc n'a pas de visuel officiel : la chaîne est courte et strictement linéaire, une phrase suffit à la tenir."* — I8 applied correctly by the author, and a correct negative result.
- `MEC-oap`: *"la relation n'est pas progressive, elle est à seuil."* — a direct statement that the currently-built visual for this element has the wrong shape.
- `MEC-compensation`: *"Referme maintenant la boucle, car c'est elle qu'il faut pouvoir redessiner."* — an explicit statement that the learner must be able to reproduce a cyclic structure, which is the strongest possible warrant for a visual under §5.1.

## 1.2 Element-by-element derivation

Ordered by Blueprint sequence. "Cognitive function" is what the visual does that the walkthrough cannot; "mental model" is the structure the learner must end up holding.

| # | Element | Cognitive function of a visual | Mental model the learner must build | Visual warranted? | Structure discovered |
|---|---|---|---|---|---|
| 1 | `ANA-ville-pompe` | Hold a cross-domain correspondence so the medical vocabulary lands on an existing intuition | Six paired roles: pump↔heart, downstream shortfall↔low output, upstream flooding↔congestion, city's measures↔compensation, water in the lungs↔OAP, "not one valve"↔multi-target treatment | Optional, low value | **Correspondence between two poles across shared roles** — all units scaffolding |
| 2 | `MM-pump-decompensation` | Make the chapter *reconstructable*: show the divergence and the loop, which prose can only assert | One damaged pump → two simultaneous consequences → compensation that returns onto the pump → congestion and acute events | **Yes — highest value in the chapter** | **Directed typed influence with fan-out, fan-in and one reinforcing cycle** |
| 3 | `MEC-output-basics` | Show that FE is a *ratio* whose numerator and denominator both move, so "same FE, different patient" becomes obvious rather than memorised | DC = VES × FC; VES = VTD − VTS; FE = VES/VTD; VES ← {precharge, postcharge, contractility}; and two consequences | Yes, compact | **A quantity and its algebraic determinants — identity, not causation** |
| 4 | `MEC-compensation` | Close the circle. The walkthrough explicitly asks the learner to be able to redraw it | Four parallel compensations converge on "output maintained", which converges on overload, which returns to the failing pump | **Yes** | Same as #2 at finer granularity — **fan-in plus back-edge** |
| 5 | `MEC-remodeling` | (a) two morphologies of one structure; (b) why a smaller fraction of a bigger volume gives the same stroke volume; (c) sequential vs simultaneous wall contraction | Laplace: stress = P × r / e. Two geometric answers. VTD 100→200 with FE 60→30 leaves VES at 60 | (a) **blocked**; (b) yes; (c) marginal | (a) **shape is the lesson — needs base artwork**; (b) the quantity model of #3 evaluated at two states; (c) timing comparison |
| 6 | `MEC-ef-phenotypes` | Restore HFmrEF from footnote to band. Show that the object is one continuum with two cut-offs, not a binary with an exception | One FE axis; cut-offs at 40 % and 50 %; three bands each carrying a different dominant defect and a different therapeutic logic | **Yes** | **Continuum partitioned by cut-offs, whose bands carry attributes** |
| 7 | `CONF-ef-types` | Prevent the collapse into a binary | The trap is not ignoring two columns; it is believing there are only two | Yes — **served by #6, no separate asset** | Same object as #6, read for its error mode |
| 8 | `MEC-arrhythmia` | Show that the reasoning runs both ways: consequence *and* aggravator | HF → atrial dilatation → AF → loss of atrial systole → HF (a return arc); and HF → VT/VF → sudden death → device rationale | Yes, compact | Same as #2 — **a second, independent cycle in the chapter** |
| 9 | `MEC-congestion` | — | LV filling pressure transmits to LA, pulmonary veins, pulmonary capillaries | **No** (author's own I8 finding; correct) | Strictly linear three-link chain |
| 10 | `MEC-systemic-congestion` | — | RV diastolic pressures → RA → systemic veins → hepatic and jugular stasis | No, alone | Mirror of #9 |
| 11 | `CONF-left-right` | Show that the two circuits are *parallel and rank-aligned*, so the mirror is visible and the sign locations cannot be swapped | Two routes with corresponding stations (VG↔VD, OG↔OD, pulmonary capillaries↔systemic veins) and different terminal manifestations; right usually secondary to left | **Yes** | **Two or more ordered routes with aligned station ranks** |
| 12 | `MEC-oap` | Show that the relation is a *state change at a value*, not a progression — which is why a patient can be near-asymptomatic then abruptly critical | Pulmonary capillary pressure crosses a threshold (generally at least > 25 mmHg) → transudate into alveoli → cardiogenic OAP | **Yes** | **Continuum with one qualified cut-off, bands = qualitatively different states** |
| 13 | `CONF-transsudat-exsudat` | Keep two identical-looking emergencies separated by the one dimension that separates them | Two poles; dimensions = mechanism and fluid; the *mechanism* is the sole discriminator | Yes, cheap | **Poles × shared dimensions with a marked discriminator** |
| 14 | `CR-recognize` | Three separate objects hide here — see §1.3 | NYHA I–IV as an ordered grading; findings split between the two branches of the spine; findings of unequal discriminating power | Partly | **Ordinal graded scale** + poles × dimensions + a plain table |
| 15 | `CR-diagnose` | Restore the branch, which *is* the teaching content, and keep two different threshold sets from contaminating each other | Suspicion → NP → rule-out branch or echo → typing by FE; plus a grey zone where the numbers stop being valid | **Yes** | **Conditional branching with threshold-gated edges** |
| 16 | `CR-etiology` | Guarantee exhaustive recall of a search list ordered by frequency and urgency, without asserting sequence | Ischaemia first, then HTA, myocardium, valves, rhythm, pericardium, right-sided; plus the inversion (right HF is usually caused by left HF) | Yes, **as a set, not a diagram** | **Exhaustive set with ordering semantics and one level of grouping** |
| 17 | `CR-acute` | Show that two questions are asked *at the same time*, not one after the other | Congestion × hypoperfusion → three named trajectories; the fourth combination is not named by the source | **Yes** | **Simultaneous classification on two independent axes, with a legitimately empty cell** |
| 18 | `CONF-bb-chronic-vs-acute` | Make the selector visible: the discriminator is the context, not the patient's state | Two contexts, two opposite instructions, no universal rule | Yes | Poles × dimensions where **poles are contexts** |
| 19 | `CR-treat-hfref` | Two objects: the four classes are *concurrent*, and they are concurrent *because* they block the neurohormonal axis of #4 | A set of four mortality-reducing classes, plus a diuretic with a different purpose; each acting on the loop | **Yes ×2** | **Exhaustive unordered set with purpose-grouping** + **intervention nodes inhibiting a mechanism** |
| 20 | `CR-treat-hfpef` | Show that a diagnosis is a conjunction where no single element suffices | Symptoms/signs **and** FE ≥ 50 % **and** NP ↑ **and** filling/HVG/LA-dilatation arguments | Yes, as a set | Exhaustive set with **all-of** logic |
| 21 | `CONF-ccb-fe-source` | Preserve an irreducible ambiguity, and prevent a future author from resolving it | Three distinct source anchors say three different things; there is no rule to learn, only a method | **Yes — and it must never be a diagram** | Poles × dimensions where **poles are source anchors** and the result is declared unresolved |
| 22 | `CR-followup` | Show a non-monotonic trajectory. "Ce n'est pas une pente régulière, ce sont des paliers ponctués de crises" cannot be drawn by any arrow chain | Asymptomatic dysfunction → declared HF → oscillation between stability and decompensation; reverse remodelling possible; death by sudden arrhythmia or refractory HF | **Yes** | **Ordered phases over time with non-monotonic trajectory and events** |

## 1.3 Three findings the element-by-element pass produced that were not visible from the Blueprint alone

**(a) `CR-recognize` contains a graded ordinal scale that nothing in the current plan accounts for.** KP-019 carries all four NYHA classes with four separate verbatim anchors — *"efforts habituels"*, *"montée des escaliers (≥ 2 étages)"*, *"montée des escaliers (< 2 étages)"*, *"repos ou efforts minimes"*. This is the same cognitive object as the FE partition (an ordered partition whose bands carry meaning) but the cut-offs are **criteria, not numbers**. Any threshold primitive that only admits numeric cut-offs will fail to represent NYHA, and NYHA is the single most reused shape in the entire EDN curriculum: Glasgow, Child-Pugh, GOLD, CKD stages, mRS, Killip, ASA, NIHSS, TNM, Ann Arbor, ADL — every severity classification in medicine is this object.

**(b) Item 234 answers a question the visualSpec experiment deferred as hypothetical.** `VISUAL_SPEC_V0_1_EXPERIMENT.md` §6A deferred `kind: intervention` and effect polarity to "the chapter that needs it", treating pharmacology as a future domain. But `CR-treat-hfref`'s walkthrough already makes the claim: *"ces classes bloquent précisément l'axe neurohormonal dont l'activation prolongée aggrave la maladie."* That is an intervention node with an **inhibitory** edge into the cycle of `MEC-compensation`. The evidence is in this chapter, not a hypothetical one, and it is the pedagogical payload of the whole treatment block — the difference between understanding the four classes and memorising them.

**(c) The chapter contains at least three independent cycles, not one.** `MM-pump-decompensation` (compensation → overload → pump), `MEC-arrhythmia` (AF → loss of atrial systole → HF → atrial dilatation → AF), and the Starling edge the experiment identified and could not add (`filling-pressure → compensation`) because v0.1 permits one cycle per spec. Per-spec that budget is survivable; but it means the *chapter* teaches reinforcement three times and the grammar can currently show it once. This is `OPEN` question 2 of the experiment, confirmed with a second and third instance.

## 1.4 Deliberate non-visuals, and why recording them matters

Six elements should have **no** Official Visual, and in three cases that is a positive pedagogical assertion rather than an absence of need.

| Element | Verdict | Reason |
|---|---|---|
| `MEC-congestion` | No visual | Strictly linear, three links. I8. One sentence holds it |
| `MEC-systemic-congestion` | No visual of its own | Second route of `CONF-left-right`'s asset |
| `CONF-ef-types` | No visual of its own | Served by `MEC-ef-phenotypes`' partition; a separate two-pole asset would *cause* the error the block exists to prevent |
| `CR-recognize` (discriminating power) | Table, not diagram | The source does not quantify sensitivity or specificity. An axis would fabricate precision the source refuses to give |
| `CONF-ccb-fe-source` | **Must not be diagrammed** | A diagram implies a resolved rule. The unresolved conflict *is* the teaching point |
| `MEC-remodeling` (morphology) | Blocked, not absent | Ventricular geometry cannot be rendered from a specification without base artwork |

The distinction between "no visual needed" and "a visual is forbidden here" is currently inexpressible. `visual_plan` can only declare presence; the manifest's `none planned` state is inferred from silence. Silence therefore conflates *decided against* with *not yet considered*, and nothing prevents a future author from adding a diagram to `CONF-ccb-fe-source` and destroying the block. §7.3 proposes the fix.

## 1.5 The nine distinct cognitive structures Item 234 actually requires

Collapsing §1.2 by structure rather than by element:

| Structure | Item 234 instances |
|---|---|
| Directed typed influence, with divergence, convergence, reinforcement, and intervention | 4 (spine, compensation, arrhythmia, treatment→axis) |
| Continuum partitioned by cut-offs into meaning-bearing bands | ≥6 (FE phenotypes, OAP pressure, NYHA, NP rule-out ×2 contexts, shock criteria, weight-gain alert) |
| Poles compared across shared dimensions | 5 (transudate/exudate, left/right tableaux, BB contexts, CCB source anchors, analogy mapping) |
| Exhaustive set whose membership and non-ordering is the lesson | ≥7 (four classes, CHAMPIT, etiologies, differentials, contraindications, HFpEF criteria, device criteria, general measures) |
| Conditional branching toward an action | 1–2 (ESC diagnostic path; acute treatment paths) |
| Simultaneous classification on two independent axes | 1 (acute triage) |
| Quantity and its algebraic determinants | 2 (output identities; remodelling worked example) |
| Ordered phases over time, non-monotonic | 1 (natural history) |
| Ordered routes with rank-aligned parallel lanes | 1 (left/right circuits) |

Nine structures. Four are exercised repeatedly inside this one chapter; five are exercised once and must therefore earn their place on cross-EDN grounds in Phase 3, exactly as `VISUAL_GRAMMAR_CONTRACT.md` §4.1 requires.

---

# 2. Phase 1b — Comparison with the current `visual_plan`

The plan, as declared in `blueprint.md`, is nine entries using four intent values: `process-flow`, `feedback-loop`, `comparison`, `algorithm`.

## 2.1 The root diagnosis: the plan's vocabulary predates the grammar

Before listing individual mismatches, the structural finding: **four of the nine entries are misclassified, and not one of them is an authoring error.** The intent vocabulary `{process-flow, feedback-loop, comparison, algorithm}` is inherited from `01-learning/templates/svg/svg-patterns.md` and `REFERENCE_IMPLEMENTATION_DESIGN.md` §6. It **cannot express** `threshold-scale`, `profile-matrix`, `transmission-path`, `timeline`, `quantity-model` or a set. An author who correctly perceives that `MEC-ef-phenotypes` is a partitioned continuum has no word for it, and `comparison` is the nearest available. An author who perceives that the four therapeutic classes are concurrent has no word for a set, and `algorithm` is the nearest available.

This is the same failure the audit documented in the legacy corpus, one layer higher up. There, a selection rule that said *"prefer Process Flow"* collapsed 61 assets into three topologies. Here, a four-word vocabulary collapses nine distinct structures into four labels. The lesson generalises: **the Blueprint's intent vocabulary is part of the grammar, and a lossy vocabulary produces medically wrong visuals no renderer can correct.**

`VISUAL_SPEC_V0_1_EXPERIMENT.md` question 5 already identified this and left migration out of scope, correctly noting it should be done for the whole vocabulary at once. Its trigger has since fired: `package.js` now reads `visual_plan` to derive the `planned-not-built` state.

## 2.2 Misclassified — four entries

| Entry | Declared | Should be | Consequence of the mismatch |
|---|---|---|---|
| `MEC-oap` (**active, shipping**) | `process-flow` | Continuum with one qualified cut-off | **The built visual teaches the opposite of the walkthrough.** The walkthrough says *"la relation n'est pas progressive, elle est à seuil"*; a four-box chain says it is progressive. The threshold is rendered as a step, so the state change that explains sudden decompensation is invisible. This is a live medical misrepresentation, not a cosmetic issue |
| `MEC-ef-phenotypes` | `comparison` | Partitioned continuum | A two-or-three column comparison detaches the bands from the axis. The audit measured the legacy result: HFmrEF demoted to an afterthought card. `CONF-ef-types` exists precisely to prevent that, and the intent label reintroduces it |
| `CR-acute` | `algorithm` | Two independent axes | An algorithm sequentialises the two questions the walkthrough says are asked *"en parallèle, et non l'une après l'autre"*. This is the exact `mechanism-17` error the audit measured |
| `CR-treat-hfref` | `algorithm` | Exhaustive unordered set (+ a causal graph for the mechanism link) | "Algorithm" implies conditional ordering among the four classes. The audit already recorded this as the corpus's worst medical error: numbering concurrent pillars 1→2→3→4 teaches a sequence that does not exist |

Two further entries are labelled with words the grammar has already retired rather than misclassified: `MM-pump-decompensation` is declared `process-flow` while its validated specification is `causal-graph`, and `MEC-compensation` is declared `feedback-loop`, which `VISUAL_GRAMMAR_CONTRACT.md` §3.3 merged into `causal-graph` as a typed back-edge. Both are inert vocabulary drift rather than wrong shapes.

## 2.3 Correctly classified — three entries

`CONF-transsudat-exsudat` (`comparison`), `CONF-bb-chronic-vs-acute` (`comparison`) and `CR-diagnose` (`algorithm`) are right. Both `comparison` entries need a variant the current vocabulary lacks — a marked discriminator in the first, a context selector in the second — but the primitive choice is correct.

## 2.4 Missing — six needs the plan does not declare

| Missing | Why it matters | Why it is missing |
|---|---|---|
| `CONF-left-right` two-route circuit | The audit rated it Essential. The projection author drew arrows inside table cells because no primitive existed | No vocabulary word for a route |
| `CR-followup` trajectory | Non-monotonic oscillation is the one thing an arrow chain cannot represent, and the walkthrough says so | `timeline` sits in §7 as deferred |
| `MEC-output-basics` quantity model | "Same FE, different patient" is a structural insight, not a fact | No vocabulary word for an identity |
| `CR-recognize` NYHA grading | The most reused shape in EDN, fully anchored in KP-019, entirely unrepresented | No vocabulary word for an ordinal scale |
| The set-shaped elements — `CR-etiology`, `CR-treat-hfpef`, CHAMPIT, contraindications, device criteria | These are where authors reach for `process-flow` when nothing better exists. The hole *is* the risk | The grammar has no set primitive at all; the audit routed them to "render as HTML" without a primitive to name |
| Negative declarations, especially `CONF-ccb-fe-source` | "Must not be diagrammed" is a pedagogical decision worth enforcing | `visual_plan` can only declare presence |

## 2.5 Unnecessary or redundant — one, conditionally

Nothing in the plan is unnecessary. One entry carries a redundancy risk: **`MEC-compensation`'s visual overlaps the spine's cycle.** The validated `MM-pump-decompensation` specification already contains `compensation → overload → pump-failure`. A second asset that redraws the same loop at finer granularity is justified only if it adds the *fan-in* of the four parallel compensations, which is a genuinely different lesson ("one mechanism, not four isolated facts", per the Blueprint's own note). It is defensible as a drill-down, and indefensible as a restatement. §7.2 proposes the mechanism that makes the difference explicit.

## 2.6 Where several planned visuals are one primitive

| Planned as | Count | Actually |
|---|---|---|
| `process-flow` + `feedback-loop` | 2 | Both **causal-graph**, differing only by granularity and one edge relation |
| `comparison` ×3 | 3 | Two are **poles × dimensions**; the third (`MEC-ef-phenotypes`) is a **partitioned continuum** and belongs to a different primitive |
| `algorithm` ×3 | 3 | One is a **decision algorithm**; one is a **two-axis matrix**; one is a **set**. "Algorithm" is functioning as a catch-all for clinical-reasoning content, exactly as "process-flow" functioned as a catch-all for mechanism content in the legacy corpus |

**Nine declared intents resolve to nine distinct semantic structures, but the four-word vocabulary maps them onto four labels with a 4/9 error rate.** The mapping is not merely lossy; the losses fall specifically on the structures where the wrong shape is medically misleading rather than merely uninformative.

## 2.7 Two architectural gaps this comparison exposed

**Gap 1 — the plan cannot express "and this one must not exist."** Covered in §1.4 and §7.3.

**Gap 2 — the plan cannot express sharing, though the contract requires it.** `VISUAL_GRAMMAR_CONTRACT.md` §5.3 ratifies that one visual may serve several elements and frequently should. `REFERENCE_IMPLEMENTATION_DESIGN.md` §8.1 states "one asset per element". `CONF-left-right`'s single dual-route asset serves three elements (`MEC-congestion`, `MEC-systemic-congestion`, `CONF-left-right`), and `MEC-ef-phenotypes`' partition serves two. The manifest's `visuals: { ELEMENT: path }` map can express this — several keys, one path — but nothing in the Blueprint declares it, and the subordination rule (a visual's KPs ⊆ its block's walkthrough KPs) becomes ambiguous when a visual has several blocks. §7.4 records this as `OPEN` with a proposed reading.

---

# 3. Phase 2 — The minimal grammar

## 3.1 Clustering

The nine structures of §1.5 map one-to-one onto nine primitives. That is not a coincidence to be proud of; it is what happens when clustering is done on *data contract plus learner question* rather than on appearance. The work of this section is therefore not the clustering but the **merges that were attempted and the ones that were refused**, because a grammar is defined by its boundaries.

| # | Primitive | Learner question | Technology |
|---|---|---|---|
| 1 | `causal-graph` | Why does this happen, and what makes it worse? | SVG |
| 2 | `threshold-scale` | At what value, or which grade, does the meaning change? | SVG (standalone **and** embeddable fragment) |
| 3 | `comparison-matrix` | What distinguishes these, and which one am I looking at? | HTML |
| 4 | `enumeration-set` | What is the complete set, and does order matter? | HTML |
| 5 | `decision-algorithm` | What do I do next, and when does the decision change? | SVG |
| 6 | `profile-matrix` | Which situation am I in, given two things at once? | HTML |
| 7 | `timeline` | What happens over time, and is the course steady? | SVG |
| 8 | `quantity-model` | What is this quantity made of, and what moves it? | HTML |
| 9 | `transmission-path` | Where does it go, by which route, and how do two routes differ? | SVG |
| — | `annotated-figure` | Where is it, and what am I looking at? | **RESERVED** |

## 3.2 Merges performed

**`feedback-loop` into `causal-graph`.** Already ratified (§3.3). Confirmed by evidence: the same data contract, one edge relation apart, and the v0.1 implementation proves a `feeds_back` relation carries the meaning. Item 234's three independent cycles are three specifications, not three primitives.

**`contrast-pair` broadened into `comparison-matrix`.** PROPOSED AMENDMENT to §3.1. Three of Item 234's five instances have poles that are not medical entities: `CONF-bb-chronic-vs-acute`'s poles are **clinical contexts**, `CONF-ccb-fe-source`'s poles are **source anchors**, and `ANA-ville-pompe`'s poles are **two domains** in an analogy. "Contrast pair" names a two-entity comparison and would push all three toward the escape hatch or toward distortion. The generalisation costs one field (what the poles *are*) and absorbs three needs.

**`entity-card` permanently into `comparison-matrix`.** PROPOSED AMENDMENT to §7. A set of entity cards is a degenerate comparison matrix — entities as poles, salient facts as dimensions — rendered one pole at a time. The audit measured the cost of the card form directly: 36 assets, 36 internal content duplications, 30 mid-sentence truncations. The card form is not a primitive; it is a layout of a comparison whose alignment has been thrown away, and throwing away the alignment is what makes 36 cards teach less than one table. Recommending this merge *now*, rather than leaving `entity-card` in §7 as a deferred candidate, closes the single largest proliferation vector in the grammar.

**`signalling-cascade` into `causal-graph`.** Receptor → transduction → effect is typed nodes and typed edges. The `intervention` node kind and `inhibits` relation that Item 234 already requires (§1.3b) cover the pharmacological case as well.

**`procedure-sequence` split between two existing primitives.** This merge deserves its reasoning recorded, because "ordered steps" is common and retiring `process-flow` leaves it apparently homeless. Two different things wear the same clothes. Where step *N* is merely *prioritised* over step *N+1* — "position assise, diurétique, nitrés selon la PA, oxygène" — arrows would assert a dependency the source does not claim, and the correct home is `enumeration-set` with declared ordering. Where step *N+1* genuinely *requires* step *N* — a titration protocol, a resuscitation sequence — the dependency is real and the correct home is `decision-algorithm` with unconditional transitions. The distinguishing question is: *if you did them in the other order, would it be wrong, or merely worse?* This is a better rule than any primitive would be, because it forces the author to know which claim the source is making.

**`imaging-annotation`, `anatomical-schematic` and ECG traces into one `annotated-figure`.** All three are the same architectural object: annotation whose semantics are specifiable over base pixels that are not. Keeping them as three §7 entries triples the appearance of the gap without tripling its content.

## 3.3 Merges refused, with the argument

Three refusals matter. Each is a boundary a future maintainer will be tempted to cross.

### `profile-matrix` stays out of `comparison-matrix`

The temptation is strong: both render as grids, `profile-matrix` has exactly one Item 234 instance, and §4.3's own test would let it in as a variant if the contracts matched.

They do not match, and the deciding evidence is **what an empty cell means**. In a comparison matrix, a missing value is a *coverage defect* — the author failed to state what pole B does on dimension 3, and the validator must fail. In a profile matrix, a missing cell is a *medical fact* — Item 234's acute triage names three trajectories on two binary axes, and the fourth combination is simply not something the source names. There, filling the cell is the defect, and the validator must accept the emptiness and forbid invention.

**Two primitives that require opposite validator verdicts for the same structural absence are two primitives.** Merging them would force one of the two rules to be expressed as an instance-level flag, and an instance-level flag that changes whether emptiness is legal is exactly the kind of self-permission the v0.1 experiment removed when it deleted instance-declared budgets.

Secondary argument: the cell semantics differ. In a comparison, a cell is *an attribute of a pole*. In a profile, a cell is *the situation that emerges when two conditions hold simultaneously* — a conjunction, not an attribute. That is the difference between "what distinguishes them" and "which one am I in", and it is precisely what the legacy corpus destroyed when it rendered a two-axis triage as a chain.

### `transmission-path` stays out of `causal-graph`

This remains, as the contract records, the least-confident boundary in the set, and this document does not resolve it. What it can add is one concrete criterion the audit did not state: **rank alignment across parallel routes.**

`CONF-left-right`'s lesson is not merely that two routes exist. It is that station *k* of the left route corresponds to station *k* of the right route — VG↔VD, OG↔OD, pulmonary capillaries↔systemic veins — and that the terminal manifestations therefore differ in *location* while the mechanism is identical. That correspondence is horizontal adjacency carrying meaning, which is the definition of a spatial relationship under I8. A causal graph can express the two chains; it cannot express that the *k*-th elements correspond, except by abusing a grouping field into a layout instruction, which is an I3 violation in semantic clothing.

So the boundary is retained on a sharper basis than "WHERE versus WHY": **a transmission path is warranted when parallel routes must be read across, not merely along.** A single route with no counterpart to align against is a weak instance and should probably be a causal graph or nothing. This gives the future merge review a testable question instead of an aesthetic one, and it predicts that the merge should happen if a second chapter's paths turn out to be single-route.

### `enumeration-set` stays out of both `comparison-matrix` and prose

The objection is that a set has no arrow, no axis and no meaning-bearing adjacency, so by I8's own working test it is not a diagram, and I9 already permits a table.

That objection is correct and is not the point. `enumeration-set` is not proposed as a diagram; it is proposed as a **named, validated, grounded, traceable artifact whose declared meaning is "these items form a set, and the set is what you must hold."** Its value is threefold and none of it is visual:

1. **It gives the author a correct target.** The audit's two worst measured errors — `mechanism-19` numbering four concurrent classes, and `mechanism-16` compressing seven etiology categories into three boxes with arrows — happened because the author had no word for a set. A grammar without a set primitive does not prevent sets from being drawn; it guarantees they are drawn as sequences.
2. **It makes exhaustiveness checkable.** A set can be validated against the Knowledge Points it claims to enumerate. "Four classes" can be checked to contain four. A paragraph cannot.
3. **It makes absence auditable.** Under §5.1 a block is complete without a visual, which is right — but it also means the grammar currently has nothing to say about the seven or more set-shaped elements in this chapter. They fall out of the visual layer entirely and back into prose, where their structure is unverifiable.

The data contract also genuinely differs: one dimension with membership logic, versus two or more poles with shared dimensions. A one-pole comparison matrix is not a thing.

## 3.4 The minimality claim, stated honestly

Nine buildable primitives cover every structure Item 234 requires, with one exception: the **morphological** content of `MEC-remodeling`, which is `RESERVED` because it cannot be generated from a specification. Under §5.1 that block remains complete without a visual, so the gap costs understanding nothing today.

Every one of the nine is exercised by Item 234. Four are exercised repeatedly within it; five are exercised once and are carried by irreducibility plus cross-EDN recurrence, per §4.1's *either/or* rule. No primitive in this set is justified by anticipation alone.

---

# 4. Phase 3 — Generalisation beyond Item 234

## 4.1 Method

Each of the nine was tested against the structure of the EDN curriculum by asking: *in how many of the ~370 items would this shape appear at least once, and would its absence force distortion?* Then the reverse: *what shape recurs across many specialties that the nine cannot express?*

The second question produced six candidates. One was reserved, five were rejected. The rejections are the more useful output, because each names a shape a future author will want to add and explains which existing primitive already owns it.

## 4.2 Cross-specialty structural survey

| Domain | Dominant shapes | Covered by |
|---|---|---|
| **Cardiology** | Haemodynamic cascades; classification cut-offs; ECG-based decisions; drug-class sets; risk scores | 1, 2, 3, 4, 5, 8 |
| **Pneumology** | Obstruction/restriction partition (FEV1/FVC, GOLD stages); acid-base two-axis profiles; ventilation cascades; exacerbation trajectories | 2, 6, 1, 7 |
| **Nephrology** | eGFR stages; acid-base and volume-status profiles; nephron transport routes; drug-adjustment thresholds; anion-gap identities | 2, 6, 9, 8 |
| **Neurology** | Lesion → tract → deficit; localisation; Glasgow and mRS grading; stroke time windows; branching work-up | 9, 2, 7, 5, **+ RESERVED** |
| **Endocrinology** | Feedback axes (HPT, HPA, gonadal) — the single most cycle-dense domain in the curriculum; hormone identities; diagnostic thresholds; dynamic-test algorithms | 1, 2, 5, 8 |
| **Infectious diseases** | Transmission chains; incubation → invasion → convalescence phases; empirical-therapy sets; severity scores; isolation decision trees | 9, 7, 4, 2, 5 |
| **Haematology** | MCV/reticulocyte two-axis classification; coagulation cascade; blast-percentage cut-offs; classification groupings; treatment-line sequences | 6, 1, 2, 4 |
| **Gastroenterology / hepatology** | Portal versus systemic routes; Child-Pugh and MELD grading; transudate/exudate contrasts; endoscopic decision paths | 9, 2, 3, 5 |
| **Obstetrics** | Gestational timelines dominate the specialty; screening-window decisions; blood-pressure and proteinuria thresholds | 7, 5, 2 |
| **Paediatrics** | Growth-curve percentile bands; developmental-milestone timelines; weight-based dosing; vaccination schedules | 2, 7, 8, 4 |
| **Oncology** | TNM staging as an ordered grading; metastatic routes; treatment-modality sets; survival trajectories | 2, 9, 4, 7 |
| **Psychiatry** | Criterion conjunctions (DSM-style: *n* of *m* criteria); duration thresholds; differential contrasts | 4, 2, 3 |
| **Emergency / ICU** | Triage profiles; resuscitation sequences with real dependencies; shock-type contrasts; numeric alert thresholds | 6, 5, 3, 2 |
| **Pharmacology (transversal)** | Drug → target → desired and adverse effects; class sets; interaction contrasts; dose-response | 1, 4, 3, **+ REJECTED curve** |
| **Public health / screening** | Sensitivity/specificity profiles; screening algorithms; prevalence thresholds | 6, 5, 2 |

Two observations from this survey shape the roadmap.

**`enumeration-set` and `threshold-scale` are the two highest-frequency primitives in the curriculum, and neither is currently implemented.** Every specialty grades severity and every specialty enumerates a set that must be recalled completely. Between them they plausibly account for more than half of all EDN visual needs.

**Endocrinology will stress `causal-graph`'s cycle budget harder than cardiology does.** A hypothalamic-pituitary axis is two or three interlocking loops with a symmetric negative-feedback arc, and `VISUAL_SPEC_V0_1_EXPERIMENT.md` §6B already identified that rule J's "every cycle must contain a `feeds_back` edge" encodes a spine-with-return-arc assumption. Item 234's three independent cycles (§1.3c) are the first evidence; endocrinology is where the rule will break.

## 4.3 Candidates considered and refused

| Candidate | Verdict | Reasoning | Reopening trigger |
|---|---|---|---|
| `physiological-curve` | **REJECTED as a primitive; accepted as a `quantity-model` variant** | Item 234 exercises it once (Starling: stretch increases inotropy *up to a limit*), and the non-monotonicity is genuinely the lesson. But the EDN almost never requires reading a curve quantitatively, and curve point data is not a sourced medical claim the Inventory can anchor. The qualitative content — "these two quantities are related, and the relation reverses" — is expressible as a `relation_shape` on a `quantity-model` dependency | A chapter where numeric curve reading is examinable, *and* a decision on where curve data is anchored |
| `hierarchy` / classification tree | **REJECTED** | Nearly every EDN "classification" is two levels deep (family → member), which `enumeration-set`'s single grouping level absorbs. Deeper cases usually turn out to be `decision-algorithm` (anaemia by MCV then reticulocytes) or `profile-matrix` in disguise | A chapter with three or more *genuine* nesting levels where grouped enumeration demonstrably loses meaning |
| `entity-card` | **REJECTED permanently** | A degenerate `comparison-matrix` with the alignment discarded. See §3.2 | None. If actor elements return, they are comparison-matrix poles |
| `pedigree` | **REJECTED** | Genuinely irreducible notation, but near-zero reuse outside genetics. This is the obscure edge case the brief excludes. Escape hatch | A genetics-dominant chapter, and even then the hatch may be the right permanent answer |
| Quantitative charts (bars, pies, survival curves) | **REJECTED, as a scope statement** | The grammar teaches *structure*, not *magnitude*. "Prevalence 1–2 %", "mortality ~50 % at 5 years", "ischaemia is the leading cause" are a threshold band, a timeline point, and an ordering attribute respectively. Admitting data visualisation would import a chart library and an axis-scaling problem in exchange for facts prose states better | None foreseen. Recorded so the exclusion is deliberate |
| `annotated-figure` | **RESERVED** | Specified in §5.10 and unbuildable. It has the highest cross-EDN value of anything not in CORE and the highest cost, and it breaks four ratified statements at once (`VISUAL_GRAMMAR_CONTRACT.md` §7.1) | A chapter whose understanding genuinely depends on a real image, *and* resolved decisions on sourcing, licensing, durability class, and how an image-borne claim is grounded |

## 4.4 The library

**Nine buildable primitives, one reserved.** Ten named structures, inside the 8–15 target. The count is derived, not aimed at: nine is what Item 234 requires with no distortion, and the cross-EDN survey added nothing to it — which is itself the strongest available evidence that the nine are structural rather than cardiological.

---

# 5. Complete per-primitive specifications

Each specification is written to become an implementation contract. Field names are indicative; the *required semantic structure* is the normative part. Frequency estimates are the share of EDN items expected to contain at least one instance, and are reasoned rather than measured — they are stated so they can be falsified by the third and fourth chapters.

---

## 5.1 `causal-graph`

**Status:** PROPOSED CORE (already a ratified CURRENT CORE CANDIDATE). Implemented at v0.1.

**Pedagogical objective.** Let the learner reconstruct *why* a state produces another, and see the three things prose cannot hold at once: that one cause has several simultaneous consequences, that several causes converge, and that a consequence can return onto its own cause.

**Cognitive pattern represented.** Directed, typed influence between states, events, responses and interventions. Divergence, convergence, and self-reinforcement.

**When to use.** Pathophysiological cascades where the branching or the loop is the lesson. Vicious circles. Multi-organ interaction. Treatment derived from mechanism (intervention nodes acting on a named mechanism). Whenever the learner is expected to be able to *redraw* a mechanism from memory.

**When NOT to use.**
- When the chain is linear and short — `MEC-congestion` is the reference negative case. Three links in a row is a sentence.
- For **temporal succession**. Phases follow each other in time; they do not cause each other. Use `timeline`. `VISUAL_GRAMMAR_CONTRACT.md` §7 records this as semantically wrong, not merely suboptimal.
- For **algebraic identity**. `DC = VES × FC` is not causation. Use `quantity-model`.
- For **unordered sets**. Four concurrent drug classes are not a cascade. Use `enumeration-set`.
- For **propagation through places** where parallel routes must be read across. Use `transmission-path`.
- For **conditional action**. Use `decision-algorithm`.

**Required input structure.** Nodes, each with a stable identifier, a semantic kind, a learner-visible label, a claim class, and Knowledge Point references (or an explicit scaffolding class, with none). Edges, each with source, target, a semantic relation, a claim class and its own Knowledge Point references — **an asserted causal link is itself a medical claim and is grounded independently.** Plus the specification-level frame: primitive, chapter, element, and the learner question derived from the Blueprint.

**Optional inputs.** None at v0.1, deliberately. Two extensions are proposed on Item 234 evidence rather than anticipation:

| Extension | Evidence | PROPOSED AMENDMENT to |
|---|---|---|
| `kind: intervention` | `CR-treat-hfref`: the four classes act on the neurohormonal axis | v0.1 `NODE_KINDS` |
| `relation: inhibits` | Same. "Bloquent l'axe neurohormonal" is not `causes` | v0.1 `EDGE_RELATIONS` |
| A machine-readable rationale on `bridging` units | Experiment question 7; currently a YAML comment no validator can read | v0.1 node/edge keys |

**Expected visual behaviour.** Deterministic layered layout computed from topology, never from a coordinate table. Text measured, wrapped, never truncated; overflow widens the canvas or fails the build. Node styling derived from `kind` and edge styling from `relation`, at **equal stroke weight** — line weight reads as confidence, and relation kind is orthogonal to grounding strength (a defect already found and fixed in round 3 of the experiment). Reinforcing edges are visually distinguishable as returning, not merely dashed. Byte-identical output on re-render. Every node and edge group carries its stable claim identifier as an attribute.

**Allowed variants.** Granularity variants of the same mechanism (chapter spine versus zoomed mechanism), expressed as separate specifications sharing node identifiers — see §7.2. No stylistic variants.

**Common implementation mistakes.**
- Hard-coded coordinate or colour arrays, which cap node count and impose one chapter's palette on all future ones. Measured in the legacy `svg.js`.
- Any medical string in renderer source. Measured: `"OAP cardiogénique"` emitted by a build tool.
- Silent label truncation. Measured twice, in two independent implementations.
- Budgeting *enumerated cycles* instead of *declared feedback relations* — one back-edge over a fan-out plus fan-in produces two simple cycles while asserting one feedback relationship. Already found and corrected; recorded here because the next primitive with a cycle rule will meet it again.
- Requiring every cycle to contain a `feeds_back` edge, which asserts primacy in symmetric relationships such as cardio-renal or hypothalamic crosstalk.

**Pedagogical anti-patterns.**
- **Arrows that assert unsourced causation.** The experiment removed `congestion → acute-decompensation` for exactly this: the source attributes acute HF to pump-function alteration, and attributes only the OAP subtype to a pressure rise. Per-edge grounding is what caught it, and is why edges must be claims.
- **Collapsing distinct mechanisms into one node** to keep the graph pretty. The `compensation` node initially cited Starling while the graph drew no Starling edge — a node claiming a Knowledge Point the topology never expressed.
- **Adding a node or edge for symmetry.** One candidate edge in the experiment was rejected specifically because it would have produced a satisfying second convergence with no anchor behind it.
- **Folding another element's content in** to make the graph look complete. Remodelling was correctly kept out of the spine.

**Item 234 examples.** `MM-pump-decompensation` (8 nodes, 8 edges, one cycle — validated, grounded and render-eligible). `MEC-compensation` (fan-in of four compensations plus back-edge). `MEC-arrhythmia` (fan-out with a return arc from AF). `CR-treat-hfref` (intervention nodes inhibiting the compensation axis).

**Expected EDN reuse.** Very high, and highest in endocrinology, where every axis is a feedback loop; also nephrology (RAAS, tubuloglomerular feedback), haematology (coagulation), immunology, pneumology (hypoxic vasoconstriction), and pharmacology (mechanism → effects).

**Estimated frequency.** ~70 % of items contain at least one instance. The most-used SVG primitive.

---

## 5.2 `threshold-scale`

**Status:** PROPOSED CORE (already a ratified CURRENT CORE CANDIDATE, with substantial proposed broadening). Not implemented.

**Pedagogical objective.** Let the learner see that a continuum is cut into regions whose *meaning* differs, and that crossing a cut-off changes the clinical situation qualitatively rather than gradually.

**Cognitive pattern represented.** Ordered partition of a continuum — numeric or ordinal — into named bands, each carrying meaning.

**When to use.** Classification cut-offs. Rule-out thresholds. Severity gradings. Staging boundaries. Device or treatment eligibility values. Alert values. Any situation where the learner must remember *where* the meaning changes, and any situation where the source explicitly says the relation is non-progressive.

**When NOT to use.**
- Categorical distinctions with no underlying continuum. Transudate versus exudate is a mechanism dichotomy, not a partition of a quantity — use `comparison-matrix`.
- When the ordering exists but the source refuses to quantify it. `CR-recognize`'s discriminating power is the reference negative case: an axis would fabricate precision the College does not give.
- As a decoration on a value the source does not treat as a decision point.

**Required input structure.** The quantity and its unit (or, for ordinal scales, the graded dimension). Cut-offs, each with a value, a comparator, Knowledge Point references, and **a verbatim source anchor** — this is the primitive that carries the highest medical risk in the grammar and I6 applies to every cut-off. Bands, each with a label, its range, its Knowledge Point references, and the meaning it carries.

**Optional inputs — four proposed on Item 234 evidence.** Each of these exists because the chapter contains a case that is *wrong* without it.

| Input | Item 234 evidence | Why it is semantic, not cosmetic |
|---|---|---|
| **Cut-off qualifier** | KP-041's anchor reads *"au-delà d'un certain seuil (en général au moins > 25 mmHg)"* | Rendering a bare `25 mmHg` line **strengthens** the source's claim. The hedge is part of the medical content |
| **Context scope** | Two different NP rule-out sets: BNP < 100 / NT-proBNP < 300 in acute dyspnoea (KP-036), BNP < 35 / NT-proBNP < 125 in the non-urgent ESC path (KP-043) | A threshold shown without its context is a memorisation trap. Conflating these two sets is a classic examination error |
| **Validity confounders** | KP-038: age, renal failure and AF raise the peptides; obesity lowers them; a grey zone exists where clinical judgement resumes | A scale that shows the number and hides the confounders teaches a number the source says can be wrong |
| **Criterion-defined (ordinal) bands** | KP-019: NYHA I–IV, four bands defined by four verbatim descriptive criteria, not by numbers | Without this, the most reused shape in EDN is inexpressible |

**Expected visual behaviour.** A single oriented axis with cut-off markers and labelled bands, whose visual extent is proportional to nothing — this is an *ordinal* rendering of a partition, not a measured scale, and pretending otherwise would imply quantitative claims about band width. Cut-off labels carry their qualifier verbatim. Confounders and context render as attached annotations, never as footnotes that can be visually detached from the value. Two rendering modes: standalone, and **embedded fragment** attached to a node of another primitive.

**Allowed variants.**
- `numeric` — cut-offs are values with comparators.
- `ordinal` — bands are defined by criteria; there are no numeric cut-offs.
- `rate` — the quantity is a change over time (weight gain of 2–3 kg in 2–3 days, KP-075).
- `fragment` — embedded in a `decision-algorithm` branch condition, a `profile-matrix` cell, or as the pole ordering of a `comparison-matrix`.

**Common implementation mistakes.**
- Rendering the axis to scale, which implies the band widths mean something.
- Dropping the comparator, turning `≤ 40 %` into `40 %`.
- Dropping the qualifier, turning "generally at least > 25 mmHg" into "> 25 mmHg".
- Treating an axis tick as a sourced claim, or a sourced cut-off as a tick. I6 distinguishes them and the specification must make the distinction explicit.
- Allowing a cut-off whose value does not appear character-for-character in its anchor. The audit measured what happens without this check: a QRS threshold given as `> 120 ms` in one asset and `≥ 130 ms` in another.

**Pedagogical anti-patterns.**
- **Collapsing three bands into two.** `MEC-ef-phenotypes` is the reference case, and `CONF-ef-types` exists solely to prevent it. The intermediate band is the clinically interesting one.
- **Showing a threshold as a step in a chain**, which converts a state change into a progression. This is what the currently-built `MEC-oap` visual does, against its own walkthrough.
- **Showing a rule-out threshold as a rule-in threshold.** A negative predictive value is not a positive one, and the visual grammar must not make them look alike.

**Item 234 examples.** `MEC-ef-phenotypes` (40 % and 50 %, three bands, each with a dominant defect and a therapeutic logic). `MEC-oap` (one qualified cut-off, two qualitatively different states). `CR-recognize` NYHA (ordinal, four criterion-defined bands). `CR-diagnose` NP rule-out (two context-scoped sets with confounders — as a fragment inside the algorithm). Cardiogenic shock criteria (PAS < 90 mmHg, oliguria < 20 mL/h — as a fragment inside a profile-matrix cell). Weight-gain alert (rate variant).

**Expected EDN reuse.** Universal. Every specialty grades severity and every specialty has rule-in/rule-out values: eGFR stages, GOLD, Child-Pugh, MELD, Glasgow, TNM, Ann Arbor, growth percentiles, HbA1c, troponin, D-dimer, CD4, INR, platelet counts, gestational age windows.

**Estimated frequency.** ~85 % of items. Probably the single most-used primitive in the grammar, and currently unbuilt.

---

## 5.3 `comparison-matrix`

**Status:** PROPOSED CORE. PROPOSED AMENDMENT to §3.1 — renames and broadens the ratified `contrast-pair`. Not implemented.

**Pedagogical objective.** Prevent the conflation of things that are easy to confuse, by holding them side by side on exactly the dimensions that separate them — and by making visible *which* dimension does the separating.

**Cognitive pattern represented.** Two or more poles compared across shared dimensions. Poles may be **entities**, **contexts**, or **source anchors**.

**When to use.** Confusable diagnoses. Competing mechanisms. Normal versus pathological. Context-dependent rules where the discriminator is the situation and not the disease. Unresolved source conflicts. Analogy mappings (all-scaffolding). Entity descriptions, which are this primitive rendered one pole at a time.

**When NOT to use.**
- When the poles are bands of a continuum — the axis is load-bearing and dropping it is a medical loss. Use `threshold-scale`, optionally with this primitive layered on its bands (§7.1).
- When there is one dimension and many items. Use `enumeration-set`.
- When a cell means "the situation arising from two simultaneous conditions" rather than "an attribute of a pole". Use `profile-matrix`.
- Beyond about four poles, where side-by-side reading fails.
- When the *shape* of the objects is what differs. That is `annotated-figure`, reserved.

**Required input structure.** Poles, each with an identifier, a label and a **pole type** (entity / context / source-anchor). Dimensions, each with a label, a value per pole, and Knowledge Point references per value — a comparison cell is a claim. Plus the specification frame.

**Optional inputs.**
- **Discriminator marking** on the dimension that alone separates the poles. `CONF-transsudat-exsudat`'s walkthrough is explicit: *"Ce qui sépare les deux colonnes est donc le mécanisme, et lui seul."*
- **Non-merge assertion** — a statement that the poles must not be collapsed, with the reason.
- **Two distinct flags that must not be conflated:**

| Flag | Meaning | Item 234 case |
|---|---|---|
| `context-dependent` | Both poles are true, in different scopes. There is no conflict, only a selector | `CONF-bb-chronic-vs-acute` — chronic decompensation versus acute OAP, source-conflict id `seg-ambig-bb-stop` |
| `unresolved-conflict` | The source is internally inconsistent. There is no correct answer to display | `CONF-ccb-fe-source` — source-conflict id `seg-ambig-fe-ci-notions` |

The audit proposed a single `unresolved_conflict` flag. That would render a context-dependent rule as a source defect, which is both wrong and pedagogically corrosive: it teaches the learner that the College is confused where in fact the College is precise about scope.

**Expected visual behaviour.** Semantic HTML — a table with real table semantics, so screen readers, reflow, text selection and translation all work for free and truncation is structurally impossible. Aligned rows so a dimension can be read across. The discriminator dimension visually marked. A `context-dependent` matrix leads with its selector question. An `unresolved-conflict` matrix renders an explicit unresolved marker and **must not** render a synthesised rule — that includes never emitting a "summary" row.

**Allowed variants.** `entity-poles` · `context-poles` · `source-anchor-poles` · `single-pole` (an entity description; poles rendered one at a time, alignment preserved in the data) · `scaffolding` (analogy mapping, no Knowledge Points, excluded from grounding as sourced content).

**Common implementation mistakes.**
- Emitting non-semantic `<div>` grids, losing assistive-technology table semantics.
- Rendering as SVG. This is the primitive where SVG buys nothing and costs reflow, selection and wrapping.
- Filling a missing cell with an empty string rather than failing. In *this* primitive, absence is a coverage defect.
- Allowing pole count to grow past readability instead of failing the budget.

**Pedagogical anti-patterns.**
- **Resolving an unresolved conflict.** The highest-severity anti-pattern in the grammar: it silently converts "the source disagrees with itself, and you must anchor your answer to context" into a false rule.
- **Two poles where there are three.** A binary comparison of reduced versus preserved EF *is* the error `CONF-ef-types` exists to prevent.
- **Symmetric presentation of asymmetric facts.** `CONF-left-right`'s poles are not equally likely — right HF is usually secondary to left. Equal columns without that asymmetry recorded teach a false equivalence.
- **Card proliferation.** Rendering a many-pole comparison as many single-pole cards destroys the alignment that carries the whole lesson. Measured cost: 36 legacy assets teaching less than one table would have.

**Item 234 examples.** `CONF-transsudat-exsudat` (2 entity poles × 2 dimensions, mechanism marked as discriminator). `CONF-bb-chronic-vs-acute` (2 context poles, context-dependent). `CONF-ccb-fe-source` (3 source-anchor poles, unresolved-conflict). `CONF-left-right` tableaux (entity poles, though the route content belongs to `transmission-path`). `ANA-ville-pompe` (2 domain poles, scaffolding). `MEC-ef-phenotypes` attributes, layered on the threshold scale's bands.

**Expected EDN reuse.** Universal. Differential diagnosis is the central cognitive act of the entire curriculum, and every differential is this shape. Plus: drug-class contrasts, transudate/exudate everywhere, benign versus malignant, type 1 versus type 2, upper versus lower, central versus peripheral, and every context-dependent management rule.

**Estimated frequency.** ~90 % of items. The most-used primitive overall, and the cheapest to build, since the `CONF-*` elements already supply their poles as machine-readable data.

---

## 5.4 `enumeration-set`

**Status:** PROPOSED CORE — new. Not present in the ratified CORE set or in §7's extended candidates. Not implemented.

**Pedagogical objective.** Let the learner hold a **complete** set and know what its completeness means: that the members are concurrent rather than sequential, or that they must all hold, or that any one suffices. Its second objective is defensive: to give authors a correct target so that sets are never drawn as flows.

**Cognitive pattern represented.** Membership in a set, with declared logic and declared ordering semantics. One dimension, many items.

**When to use.** Therapeutic classes acting concurrently. Diagnostic criteria that must be conjoined. Aetiology search lists. Differential-diagnosis lists. Contraindication lists. Mnemonics. Complication lists. General-measure checklists. Prioritised (but not dependent) action lists. Eligibility criteria that are conjunctions of thresholds.

**When NOT to use.**
- When step *N+1* genuinely **requires** step *N*. Then the dependency is real; use `decision-algorithm` with unconditional transitions. The test: *if you did them in the other order, would it be wrong, or merely worse?*
- When there are two or more poles with shared dimensions. Use `comparison-matrix`.
- When branching on a condition. Use `decision-algorithm`.
- As a dumping ground for content that has no structure at all. A set of one is prose; an ungrouped set of twenty is a failure to analyse.

**Required input structure.** The set's identity and the question it answers. Items, each with a label and Knowledge Point references. **Membership logic** — `all-of` (a conjunction the learner must satisfy), `any-of`, or `concurrent-set` (all members apply simultaneously and independently). **Ordering semantics** — `none`, `priority`, or `frequency`. Plus the specification frame.

**Optional inputs.** One level of grouping, with a group label and the *purpose* that distinguishes the groups. Per-item conditions. Per-item embedded `threshold-scale` fragments. A declared expected cardinality, so "four classes" can be validated to contain four. A mnemonic key when the source supplies one.

**Expected visual behaviour.** Semantic HTML list or table. **No arrows, ever, under any variant** — this is the primitive's defining constraint and the reason it exists. Concurrent sets render with visually equal weight and no numbering. `all-of` sets render their conjunction explicitly, so "none of these suffices alone" is visible rather than implied. Ordered variants render their ordering *basis* alongside the order, so priority is not mistaken for dependency. Groups are visually separated by purpose.

**Allowed variants.** `concurrent-set` · `criteria-all-of` · `criteria-any-of` · `prioritised` · `frequency-ordered` · `grouped` (composable with any of the above) · `mnemonic`.

**Common implementation mistakes.**
- Adding arrows or numbers to a concurrent set — the single mistake this primitive exists to prevent.
- Compressing a set to fit a layout. Measured: seven aetiology categories compressed into three boxes.
- Treating a grouping level as a hierarchy and nesting further, which turns a set into an unread tree.
- Losing the ordering basis while keeping the order, so that a frequency ordering reads as a protocol.

**Pedagogical anti-patterns.**
- **Numbering concurrent items.** The audit's most severe measured medical error: numbering the four mortality-reducing classes 1→2→3→4 teaches a sequence that does not exist. Two of them were also merged into one box to fit four slots, losing a class outright.
- **Silent incompleteness.** A set that drops a member is worse than prose, because its visual form claims exhaustiveness. Declared cardinality is the defence.
- **Mixing purposes in one undifferentiated set.** The four classes reduce mortality; the diuretic treats congestion. Listing five items flatly erases the distinction that makes the four memorable.
- **Turning an `all-of` into an `any-of`.** HFpEF's diagnostic criteria are a cluster where *"aucun de ces éléments ne suffit seul"*. A bullet list without the conjunction marked invites exactly the wrong reading.

**Item 234 examples.** `CR-treat-hfref` four classes (`concurrent-set`, grouped by purpose against the diuretic, cardinality 4). CHAMPIT (`mnemonic`). `CR-etiology` (`frequency-ordered`, grouped, with the right-HF inversion recorded). Acute dyspnoea differentials (`concurrent-set`). Systolic-HF contraindications with the dihydropyridine allowance (`concurrent-set` with per-item conditions). `CR-treat-hfpef` diagnostic criteria (`criteria-all-of`). CRT and ICD eligibility (`criteria-all-of` with embedded threshold fragments). `CR-treat-hfref` general measures (`concurrent-set`). Telemonitoring parameters (`concurrent-set`).

**Expected EDN reuse.** Universal, and the highest raw instance count of any primitive. Every item has criteria, a differential, a set of causes, a set of complications, or a set of contraindications. Psychiatry is almost entirely `criteria-all-of` and `criteria-any-of`. Infectious diseases run on empirical-therapy sets. Pharmacology runs on class sets.

**Estimated frequency.** ~95 % of items, with multiple instances each. Cheapest to build and highest defensive value.

---

## 5.5 `decision-algorithm`

**Status:** PROPOSED CORE (already a ratified CURRENT CORE CANDIDATE). Not implemented.

**Pedagogical objective.** Let the learner see what to do next given what is currently known — and, more importantly, see *where the decision changes*, because the branch is the teaching content and it is the first thing prose loses.

**Cognitive pattern represented.** Conditional branching from an entry state, through tests and decisions, toward actions or conclusions.

**When to use.** Diagnostic pathways. Emergency management sequences with genuine dependencies. Therapeutic escalation. Screening protocols. Rule-out logic. Any content the source itself presents as an algorithm.

**When NOT to use.**
- Simultaneous classification on independent axes. Use `profile-matrix`. Sequentialising parallel questions is the reference error, measured as `mechanism-17`.
- Unordered or merely prioritised sets. Use `enumeration-set`. This is the misuse to guard hardest against, because "algorithm" is an attractive label for any clinical-reasoning content — Item 234's own plan uses it for a concurrent drug set.
- Linear mechanism chains with no condition. That is a causal graph, or nothing.
- Where the source gives no branch. Inventing one fabricates guidance.

**Required input structure.** An entry condition. Nodes with kinds (decision, test, action, conclusion, dead-end), labels, claim classes and Knowledge Point references. Branches, each with a source, a **condition**, a target, and its own Knowledge Point references — a branch condition is a claim, and frequently the most examinable one on the page.

**Optional inputs.** Embedded `threshold-scale` fragments on branch conditions, with their context scope and confounders. A guideline reference and year (`CR-diagnose` is explicitly the ESC 2021 non-urgent pathway; an algorithm without its provenance ages invisibly). Urgency marking. Explicit dead-ends — "diagnosis unlikely, look elsewhere" is a real outcome and dropping it makes the algorithm look like it always confirms.

**Expected visual behaviour.** Rooted directed layout with branch labels always visible — an unlabelled branch is an untraceable claim. Threshold fragments render inline at their branch, carrying comparator, qualifier and context. Dead-ends render as terminal and are visually distinct from confirmations. Deterministic and byte-reproducible.

**Allowed variants.** `diagnostic` · `management` · `unconditional-sequence` (genuinely dependent steps, no branches — the home for procedural sequences, per §3.2) · `compact` (a reduced form for a Chapter Overview block, which must be a *subset* of the full algorithm's claims, never a separate simplification).

**Common implementation mistakes.**
- Rendering a branching algorithm as a linear chain, erasing the branch. Measured: `mechanism-14`.
- Unlabelled branches.
- Embedding a threshold without its context scope, so the acute and non-urgent NP rule-out values become interchangeable.
- Dropping dead-ends.
- Numbering steps in a way that skips after a branch. Measured in three legacy assets.

**Pedagogical anti-patterns.**
- **Inventing a branch the source does not give**, which manufactures clinical guidance.
- **Presenting a rule-out pathway as a rule-in pathway.** The NP logic is explicitly built on negative predictive value, and an algorithm whose arrows only move toward confirmation inverts it.
- **Omitting the grey zone.** KP-038 says the numeric value stops deciding in defined situations and clinical judgement resumes. An algorithm that hides this teaches over-reliance on a number.
- **Presenting a guideline pathway without its edition**, so a superseded algorithm looks timeless.

**Item 234 examples.** `CR-diagnose` (ESC 2021 non-urgent: risk factors with symptoms/signs or abnormal ECG → natriuretic peptides → rule-out branch or echocardiography → FE typing, with the grey zone as a labelled exit). `CR-acute` per-trajectory management (OAP: sitting position, diuretic, nitrates conditional on blood pressure, oxygen, no beta-blocker introduction — an `unconditional-sequence` with one conditional branch).

**Expected EDN reuse.** Very high. Diagnostic and management algorithms are the standard form in which every specialty publishes its reasoning: chest pain, dyspnoea, coma, shock, anaemia, thyroid nodule, screening pathways, antibiotic choice, obstetric surveillance.

**Estimated frequency.** ~65 % of items.

---

## 5.6 `profile-matrix`

**Status:** PROPOSED CORE (already a ratified CURRENT CORE CANDIDATE). Not implemented.

**Pedagogical objective.** Let the learner classify a case on two questions asked **at the same time**, and see that the answer is the conjunction rather than a sequence of two answers.

**Cognitive pattern represented.** Cartesian product of two independent axes into named situations. The cell is an emergent situation, not an attribute.

**When to use.** Triage on two independent clinical axes. Pre-test probability × test result. Risk × urgency. Any classification the source presents as two simultaneous questions.

**When NOT to use.**
- When a cell is an attribute of a pole. Use `comparison-matrix` — see §3.3 for why these must stay apart.
- When the two questions are genuinely sequential. Use `decision-algorithm`.
- Three or more independent axes. That is not readable; decompose or use the escape hatch.
- When the axes are not actually independent, which makes the grid a lie about the clinical space.

**Required input structure.** Exactly two axes, each with a label and ordered levels. Cells, each keyed by a coordinate pair, and each either **named** (with a label, its implication, and Knowledge Point references) or **explicitly declared empty**. Plus the specification frame.

**Optional inputs.** Embedded `threshold-scale` fragments defining an axis level (cardiogenic shock's PAS < 90 mmHg is what makes the hypoperfusion axis operational). An independence assertion for the axes. Emphasis on the cell that is the emergency.

**Expected visual behaviour.** Semantic HTML grid with real table semantics and both axes labelled at their levels. **Empty cells render as explicitly, visibly empty** — not blank, and never inferred. Threshold fragments render at their axis level. Each cell's implication reads as an implication, not as a title.

**Allowed variants.** `binary-2x2` · `ordinal-nxm`. No stylistic variants.

**Common implementation mistakes.**
- **Fabricating a label for an undeclared cell to complete the grid.** This is the primitive's cardinal defect and the reason it is separate from `comparison-matrix`: here, invention is a medical-safety failure, and the validator must forbid it rather than require completeness.
- Rendering as a sequence, which destroys the simultaneity that is the whole point.
- Non-semantic grid markup.
- Axis levels that overlap or leave gaps, so a real patient fits two cells or none.

**Pedagogical anti-patterns.**
- **Implying the grid is exhaustive of clinical reality** when the source names only some cells. Item 234's source names three trajectories on two binary axes; the fourth combination is simply not named, and a visual that names it invents medicine.
- **Sequentialising the axes**, which is what the current plan's `algorithm` label would do, against a walkthrough that says the two questions are asked *"en parallèle, et non l'une après l'autre"*.
- **Losing the implication.** A cell that names a situation without saying what it implies is a label, not a teaching object.

**Item 234 examples.** `CR-acute` triage — congestion × hypoperfusion, three named trajectories (cardiogenic OAP; global flare without frank OAP; cardiogenic shock), the fourth combination declared unnamed, with shock's numeric criteria embedded as a threshold fragment on the hypoperfusion axis.

**Expected EDN reuse.** High. Acid-base disturbance (pH × pCO₂/bicarbonate), anaemia (MCV × reticulocytes), volume status (volume × sodium), pleural fluid (protein × LDH), thyroid function (TSH × free T4), test interpretation (pre-test probability × result), risk stratification grids.

**Estimated frequency.** ~35 % of items. Lower frequency than the rest, carried by irreducibility rather than recurrence.

---

## 5.7 `timeline`

**Status:** PROPOSED CORE. PROMOTION from `VISUAL_GRAMMAR_CONTRACT.md` §7, where it is the named most-likely first promotion. Not implemented.

**Pedagogical objective.** Let the learner see a course over time — and specifically see that it is **not** a straight line, because "it gets worse" and "it oscillates between plateaus and crises" are different prognoses that require different follow-up.

**Cognitive pattern represented.** Ordered phases along a time axis, with events, and with a trajectory that may be non-monotonic.

**When to use.** Natural history of a chronic disease. Incubation and phases of an infection. Gestational and developmental timelines. Post-operative course. Treatment-line sequences over time. Screening and vaccination schedules. Any content where a phase's *position in time* is the fact, and any content where the course is explicitly described as irregular.

**When NOT to use.**
- **Never substitute `causal-graph`.** Phases succeed one another; they do not cause one another. This is recorded in the contract as semantically wrong, and confirmed twice by the audit's stress test.
- For an ordered list with no real time axis. Use `enumeration-set` with `prioritised`.
- For a procedure whose steps are dependent but not time-anchored. Use `decision-algorithm` with `unconditional-sequence`.
- To imply a prognosis for an individual from a population trajectory.

**Required input structure.** A time axis with its unit and whether it is scaled or ordinal. Phases, each with a label, an ordinal position, Knowledge Point references, and optionally a duration. Plus the specification frame.

**Optional inputs.** Events at points on the axis (a decompensation, a hospitalisation, a diagnosis). A **trajectory shape** per phase — `stable`, `progressive`, `oscillating`, `reversible` — which is the field that makes this primitive irreducible: `CR-followup`'s whole lesson is that the course is *"des paliers ponctués de crises"* rather than a slope. Reversibility markers (reverse remodelling under treatment, KP-066). Branch outcomes at the terminal phase (sudden death versus refractory HF, KP-067). Monitoring points, for content where surveillance is the lesson.

**Expected visual behaviour.** A single horizontal time axis. Phases as ordered spans. Trajectory shape rendered as shape — an oscillating phase must *look* oscillating, since that is the entire content. Events as marks on the axis, distinguishable from phases. Where the axis is ordinal rather than scaled, span widths must not imply duration. Terminal branches render as branches.

**Allowed variants.** `natural-history` · `phase-sequence` (infection-style, with durations) · `schedule` (calendar-anchored: vaccination, screening, gestational surveillance) · `monitoring` (surveillance points and their alert thresholds, composing with `threshold-scale` fragments).

**Common implementation mistakes.**
- Rendering it as a left-to-right arrow chain, which is `causal-graph` with a rotated layout and asserts causation.
- Scaling the axis when durations are not sourced, implying quantitative claims.
- Rendering a trajectory shape as decoration rather than as content, so the oscillation becomes a texture instead of a claim.
- Dropping the terminal branch, which makes every course look like it ends the same way.

**Pedagogical anti-patterns.**
- **Making an oscillating course look monotonic.** Measured: `mechanism-18` rendered the natural history as a three-box chain, and the audit's verdict was that "oscillation is the whole point and is invisible".
- **Attaching an unanchored statistic to a phase.** The same legacy asset carried a mortality figure absent from the canonical model. Population outcome statistics are not phase properties.
- **Implying inevitability.** KP-066 records that reverse remodelling under treatment is possible; a one-way timeline erases the reason to treat.

**Item 234 examples.** `CR-followup` — asymptomatic dysfunction → declared heart failure → oscillation between stability and decompensation, with hospitalisation events, reverse remodelling marked as reversible, and a terminal branch into sudden death or refractory heart failure. The telemonitoring content composes as a `monitoring` variant with weight, blood pressure and heart rate alert thresholds.

**Expected EDN reuse.** Very high, and it is the *only* primitive for several whole specialties. Obstetrics is a timeline discipline end to end. Infectious diseases need incubation and phase structure in nearly every item. Paediatrics needs developmental milestones. Oncology needs survival and treatment-line trajectories. Every chronic disease has a natural history.

**Estimated frequency.** ~55 % of items, concentrated but very high where present.

---

## 5.8 `quantity-model`

**Status:** PROPOSED CORE. PROMOTION and broadening of `quantity-decomposition` from `VISUAL_GRAMMAR_CONTRACT.md` §7. Not implemented.

**Pedagogical objective.** Let the learner see what a quantity is *made of*, so that a number stops being a fact to memorise and becomes a thing with moving parts. The target insight is of the form: *two patients with the same ejection fraction can be in very different states* — which is not memorisable, only derivable.

**Cognitive pattern represented.** A quantity and its determinants: algebraic identity, and functional dependency. Explicitly **not** causation.

**When to use.** Physiological identities. Ratios whose numerator and denominator both move. Quantities with named determinants the learner must be able to reason over. Worked examples that show a quantity changing while another stays constant.

**When NOT to use.**
- Where the relation is causal rather than definitional. Use `causal-graph`.
- For a formula the learner only needs to recall, not to reason with. Prose or a formula line is better; a structure implies reasoning that isn't required.
- For quantitative curve reading — rejected from the grammar (§4.3), though a qualitative relation shape is admitted as an optional input below.

**Required input structure.** A target quantity with its unit. Determinants, each with a label, a **relation type** (`identity-product`, `identity-difference`, `identity-ratio`, `depends-on`), and Knowledge Point references. Plus the specification frame. The relation type is what keeps this primitive out of `causal-graph`: the difference between "is defined as" and "influences" is precisely the distinction the audit found violated when three algebraic identities were connected by causal arrows.

**Optional inputs.** Nested decomposition, where a determinant is itself decomposed. **Two evaluated states**, so a worked example can show what moves and what does not. A **relation shape** on a `depends-on` determinant — `monotonic-increasing`, `monotonic-decreasing`, `increases-to-a-limit` — which absorbs the qualitative content of the physiological curves rejected in §4.3. A derived-insight statement, sourced.

**Expected visual behaviour.** Semantic HTML with genuine mathematical structure — a ratio rendered as a ratio, so that the numerator and denominator are visibly separable. **No arrows between identities.** `depends-on` determinants render as dependencies, visually distinct from identity terms. The two-state variant aligns the states so that the constant term is visibly constant. Relation shapes render as a short qualitative annotation, never as a plotted curve.

**Allowed variants.** `identity` · `determinant-tree` · `two-state` (a worked example) · `composed` (identity plus determinants on one of its terms, which is Item 234's actual case).

**Common implementation mistakes.**
- Arrows between identity terms, which assert causality between three definitions.
- Flattening a ratio into an inline string, losing the separability that carries the insight.
- Rendering as SVG boxes, which is what turned this content into a four-step chain in the legacy corpus.
- Treating a determinant as a cause and drawing it in a causal graph.

**Pedagogical anti-patterns.**
- **Presenting the formulas as things to recite.** The walkthrough is explicit: *"Ces formules ne sont pas là pour être récitées."* A visual that reproduces them as a list adds nothing and confirms the wrong reading.
- **Hiding that the ejection fraction is a proportion.** *"donc une proportion, pas une quantité"* is the whole content of the block, and it is visible only if the ratio is visible as a ratio.
- **Losing the constant term in the worked example.** KP-009's example — end-diastolic volume 100 → 200 mL while ejection fraction falls 60 → 30 %, stroke volume staying at 60 mL — is unintelligible unless the invariance is visible.

**Item 234 examples.** `MEC-output-basics` (`composed`: DC = VES × FC; VES = VTD − VTS; FE = VES/VTD; with VES depending on preload, afterload and contractility). `MEC-remodeling` (`two-state`: the KP-009 worked example; plus Laplace stress = P × r / e as a second identity, and Starling as a `depends-on` with `increases-to-a-limit`).

**Expected EDN reuse.** High and transversal. Nephrology (creatinine clearance, anion gap, fractional excretion, corrected calcium), pneumology (FEV1/FVC, PaO₂/FiO₂, alveolar gas equation), cardiology (mean arterial pressure, oxygen delivery, valve gradients), endocrinology (axis ratios, free-hormone indices), paediatrics (weight-based dosing, growth velocity), haematology (reticulocyte index), biology (osmolarity, corrected sodium). Every "and how do you compute it" is this shape.

**Estimated frequency.** ~45 % of items.

---

## 5.9 `transmission-path`

**Status:** PROPOSED CORE (already a ratified CURRENT CORE CANDIDATE). Retained with a sharpened boundary and the lowest confidence in the set. Not implemented.

**Pedagogical objective.** Let the learner follow *where* something goes, through which named places, and — the part no other primitive provides — see that two parallel routes **correspond station by station**, so their consequences differ in location while their mechanism is identical.

**Cognitive pattern represented.** Propagation of one quantity or agent through ordered stations, along one or more parallel, rank-aligned routes.

**When to use.** Two or more anatomical or compartmental routes that must be read *across* as well as along. Left versus right circulation. Ascending versus descending tracts. Portal versus systemic drainage. Metastatic routes. Transmission chains with alternative pathways.

**When NOT to use.**
- **For a single route with no counterpart to align against.** This is the sharpened boundary of §3.3: without cross-route alignment, the primitive degenerates into a linear chain and either `causal-graph` or nothing is correct. `MEC-congestion` alone is the reference negative case, and its walkthrough says so.
- For causation. Stations do not cause each other; the same thing arrives at each.
- For decision-making, or for temporal phases.

**Required input structure.** Routes, each with a label and ordered stations carrying labels and Knowledge Point references. A direction. **Cross-route rank alignment** — the correspondence between station *k* of each route — which is the primitive's reason to exist.

**Optional inputs.** Terminal manifestations per route (the clinical signs each route produces, which is what makes it examinable). Cross-links between routes. A relative-frequency or dependency assertion between routes: right heart failure is usually secondary to left, and equal-looking routes without this teach a false symmetry. The propagated quantity itself.

**Expected visual behaviour.** Parallel routes rendered so that corresponding stations align horizontally — the alignment is the content, so a layout that lets routes drift out of rank is a semantic failure, not a cosmetic one. Direction unambiguous. Terminal manifestations rendered as terminal, distinct from stations. Asymmetry between routes rendered as asymmetry.

**Allowed variants.** `dual-route` (the canonical form) · `multi-route` · `branching-route` (one route that splits, with rank alignment maintained across the split).

**Common implementation mistakes.**
- Losing rank alignment under auto-layout, which discards the whole lesson while looking fine.
- Rendering stations as causal nodes with `causes` edges.
- Atomising the stations into separate assets. Measured: nine connected anatomical structures rendered as nine disconnected text cards, described by the audit as the clearest single example of atomisation destroying the relationship that mattered.
- Rendering a single route and calling it a path.

**Pedagogical anti-patterns.**
- **Symmetric rendering of asymmetric routes.** KP-057 says left heart failure is the most frequent cause of right heart failure. Two equal lanes teach that the two are equally likely to occur in isolation.
- **Dropping the terminal manifestations**, which turns an examinable clinical mapping into an anatomy recitation. The point of the left/right distinction is that it predicts *where you will find the signs*.
- **Implying anatomical geography.** A path states a topological sequence, not a spatial position. Spatial localisation is `annotated-figure`, reserved.

**Item 234 examples.** `CONF-left-right` — left route (LV → LA → pulmonary veins → pulmonary capillaries, terminal manifestations: dyspnoea, orthopnoea, OAP) aligned rank for rank against the right route (RV → RA → systemic veins, terminal manifestations: jugular distension, congestive liver, oedema), with the left-causes-right asymmetry recorded. Serves three Blueprint elements.

**Expected EDN reuse.** High but concentrated: neurology (ascending sensory versus descending motor tracts, and the crossing levels that make the alignment essential), hepatology and gastroenterology (portal versus systemic, portosystemic shunts), infectious diseases (transmission routes), oncology (lymphatic versus haematogenous spread), nephrology (nephron segments), cardiology (conduction pathways).

**Estimated frequency.** ~30 % of items. The least frequent primitive in the library and the one whose boundary is least settled — which is why §9 sequences it last.

---

## 5.10 `annotated-figure` — RESERVED

**Status:** RESERVED. Specification recorded so the architecture need not be redesigned when the blocking conditions are met. **Implementation is blocked.** Consolidates `anatomical-schematic`, `imaging-annotation` and ECG traces from `VISUAL_GRAMMAR_CONTRACT.md` §7 into one primitive with variants.

**Pedagogical objective.** Let the learner see *where* something is, and what a real image or trace looks like — the two things no specification-generated primitive can provide, because both are irreducibly pictorial.

**Cognitive pattern represented.** Semantic annotation over base artwork that is not derivable from a specification. Spatial localisation and adjacency; interpretation of a real image.

**When to use.** Only when understanding genuinely depends on shape, position or the appearance of a real image: morphology, anatomical localisation, dermatological distribution, radiological pattern, an ECG trace.

**When NOT to use.** As a decoration. As an anatomical illustration where a topological path suffices (`transmission-path` covers routes; this covers positions). Wherever any of the four blocking conditions below is unresolved.

**Required input structure.** A reference to a base asset, with its licence and provenance. Annotations, each with a label, a region reference, and Knowledge Point references. Note the layer split this forces: **the specification owns the annotation; it can never own the pixels.**

**Optional inputs.** A region vocabulary per anatomical area. Comparison to a normal reference. Trace measurement markers.

**Expected visual behaviour.** Base asset with deterministically placed annotations. Every learner-visible label originates in the specification. The base asset carries its own attribution.

**Allowed variants.** `schematic` (curated line artwork) · `radiograph` · `trace` (ECG and similar).

**Four blocking conditions**, each of which breaks a ratified statement and each of which needs its own answer before anything ships:

| Ratified statement | What an imported asset does to it |
|---|---|
| §1.2 canonical flow | A renderer reads a validated specification *and nothing else*. An asset must enter through the specification, never by the renderer fetching an image |
| §1.3 artifact durability | Rendered assets are "generated, disposable derivatives". A sourced image is neither, and is therefore a fourth artifact class with its own lifecycle |
| I3 geometry exclusion | An image **is** geometry. Only the annotation over it can be specified |
| I6 numeric verification | An assertion carried by an image cannot be verified against a verbatim quote. The grounding model for image-borne claims is unresolved |

Plus the licensing path. **Promotion trigger:** a chapter whose understanding genuinely depends on a real image, *and* resolved decisions on sourcing, licensing, durability class, and image-borne grounding.

**Item 234 examples.** `MEC-remodeling` morphology — eccentric dilatation versus concentric hypertrophy as two answers to Laplace's law. The audit's judgement stands: *"ventricular geometry cannot be taught with rectangles"*. This is Item 234's only unmet need, and under §5.1 the block is complete without it.

**Expected EDN reuse.** Very high in principle — neurology, radiology, dermatology, anatomy, cardiology (ECG), obstetrics (ultrasound) — which is exactly why the cost discipline matters. Admitting it without resolving asset sourcing would import an unbounded commitment.

**Estimated frequency if built.** ~50 % of items would use it. It is deliberately not built.

---

# 6. Estimated EDN coverage

## 6.1 Coverage estimate

| Primitive | Est. share of items with ≥1 instance | Est. share of *all* visual needs served |
|---|---|---|
| `comparison-matrix` | ~90 % | ~22 % |
| `enumeration-set` | ~95 % | ~20 % |
| `threshold-scale` | ~85 % | ~16 % |
| `causal-graph` | ~70 % | ~13 % |
| `decision-algorithm` | ~65 % | ~10 % |
| `timeline` | ~55 % | ~7 % |
| `quantity-model` | ~45 % | ~5 % |
| `profile-matrix` | ~35 % | ~4 % |
| `transmission-path` | ~30 % | ~3 % |
| **Buildable total** | | **~89 %** |
| `annotated-figure` (RESERVED) | ~50 % | ~8 % |
| Escape hatch / genuinely bespoke | | ~3 % |

**~89 % of EDN visual needs with the nine buildable primitives; ~97 % with the reserved one.** For Item 234 specifically: **100 % of specification-generable needs**, with one gap (`MEC-remodeling`'s morphology) that is `RESERVED` rather than unmet, and whose block remains complete without it under §5.1.

## 6.2 How these estimates could be wrong

Stated so they can be falsified rather than defended.

- **They are reasoned, not measured.** The only measured corpus is one chapter's 61 legacy assets, and the audit established that corpus reflects generation experience rather than pedagogical validation. The percentages should be re-derived after chapters three and four, in specialties structurally unlike cardiology — endocrinology (cycle-dense) and obstetrics (timeline-dense) would be the most informative pair.
- **The two HTML primitives may be over-credited.** `comparison-matrix` and `enumeration-set` together carry ~42 % of the estimate, and they are the two easiest to over-apply. If measurement shows them at 60 %, that is not success; it is evidence that content with no structure is being pushed into the visual layer.
- **`transmission-path` may not survive.** At ~30 %, single-instance in Item 234, and holding the least-confident boundary in the grammar, it is the most likely retirement candidate under §4.4.
- **The residual is not uniformly distributed.** Genetics, and any content whose examinable object is a real image, concentrate the residual. A pedigree-shaped chapter has a much larger gap than 3 %.

---

# 7. Language-level features the grammar needs beyond primitives

Four features that are properties of the *grammar*, not of any primitive. Each is cheap, and each closes a hole that would otherwise be filled by distortion.

## 7.1 Fragment mode — embedding one primitive inside another

`threshold-scale` appears in Item 234 in four different host positions: standalone (`MEC-ef-phenotypes`, `MEC-oap`), inside a `decision-algorithm` branch condition (`CR-diagnose`), inside a `profile-matrix` cell (shock criteria), inside `enumeration-set` items (CRT and ICD eligibility), and as the pole ordering of a `comparison-matrix` (the phenotype attributes layered on the FE bands).

**PROPOSED:** `threshold-scale` is the one primitive that is both a standalone visual and an embeddable fragment. Fragments keep their own claim identifiers and are grounded independently of the host, so a threshold does not inherit its host's grounding status. No other primitive needs this, and giving it to others would produce arbitrarily nested visuals.

This resolves a question the audit left implicit and the experiment raised as its question 4: whether `transmits` in a `causal-graph` illegitimately overlaps `transmission-path`. The general answer is that **compression of one primitive's content into a single unit of another is legitimate when it is declared**, and fragment mode is how it gets declared.

## 7.2 Drill-down — the same structure at two granularities

The spine's `compensation` node expands into `MEC-compensation`'s four-way fan-in. `MEC-oap`'s upstream state is `MEC-congestion`'s terminal station.

**PROPOSED:** a node in one specification may declare that it is expanded by another specification, by shared node identifier. No new primitive; a cross-reference. This makes the §2.5 redundancy question decidable — a second asset that redraws the same loop is a duplicate, whereas one that expands a declared node is a zoom — and it gives the learner surface a possible navigation affordance without the specification knowing anything about presentation.

## 7.3 Negative declarations — "and this one must not exist"

`CONF-ccb-fe-source` must not be diagrammed; `MEC-congestion` needs no diagram; `CR-recognize`'s discriminating power must not be given an axis. None of these three decisions is currently expressible. Silence conflates *decided against* with *not yet considered*, and nothing stops a future author from adding a diagram that destroys the block.

**PROPOSED:** `visual_plan` admits entries with no primitive plus a rationale and a severity — `not-needed` (I8: structure adds nothing) or `forbidden` (a visual would misrepresent). A `forbidden` declaration fails the build if a visual is ever produced for that element. This turns a pedagogical judgement into an enforced invariant at essentially zero cost, and it makes the manifest's existing `none planned` state meaningful rather than inferred.

## 7.4 Sharing — one visual, several blocks

**OPEN.** `VISUAL_GRAMMAR_CONTRACT.md` §5.3 ratifies that one visual may serve several elements; `REFERENCE_IMPLEMENTATION_DESIGN.md` §8.1 says "one asset per element"; the manifest can express many-elements-to-one-path. What is genuinely unresolved is how the **subordination rule** reads for a shared visual: a published visual's Knowledge Points must be a subset of *its block's* walkthrough's, and a shared visual has several blocks.

Proposed reading, recorded for decision rather than asserted: the visual declares one **primary element** whose walkthrough must cover all of its Knowledge Points, and any number of **secondary elements** where it also appears. Under that reading `CONF-left-right` is primary for the dual-route path and `MEC-congestion`/`MEC-systemic-congestion` are secondary, which matches the pedagogy — the confusion-boundary block is where the two routes are actually taught together.

---

# 8. Governance deltas

Every difference between this library and the ratified `VISUAL_GRAMMAR_CONTRACT.md` §3 and §7, stated as an amendment proposal so nothing changes by drift.

| Delta | Type | Touches | Rationale |
|---|---|---|---|
| `contrast-pair` → `comparison-matrix` | Rename + broaden | §3.1 | Three of five Item 234 instances have poles that are contexts, source anchors, or analogy domains |
| `enumeration-set` added to CORE | New primitive | §3.1 | Irreducible (single dimension with membership logic), highest instance count in EDN, and the grammar's principal defence against sets-drawn-as-sequences |
| `timeline` promoted to CORE | Promotion | §7 row 1 | Irreducible (`causal-graph` asserts causation where only succession exists), exercised by `CR-followup`, and the only primitive for several whole specialties |
| `quantity-decomposition` → `quantity-model`, promoted to CORE | Promotion + broaden | §7 row 4 | Exercised twice within Item 234; identity-versus-causation distinction is a medical-correctness requirement, not a nicety |
| `anatomical-schematic` + `imaging-annotation` + ECG → one `annotated-figure`, RESERVED | Consolidation | §7 rows 2, 10, §7.1 | One architectural problem, not three. Blocking conditions unchanged |
| `entity-card` retired permanently | Rejection | §7 row 3 | A degenerate `comparison-matrix`. Closes the largest proliferation vector |
| `signalling-cascade` retired | Rejection | §7 row 7 | `causal-graph` node kinds and relations |
| `procedure-sequence` retired | Rejection | §7 row 9 | Split by the dependency test between `enumeration-set` and `decision-algorithm` |
| `hierarchy` retained as deferred, trigger sharpened | Amendment | §7 row 6 | Promote only on ≥3 genuine levels *and* demonstrated insufficiency of one grouping level |
| `physiological-curve` retained as deferred; qualitative content absorbed | Amendment | §7 row 5 | `relation_shape` on a `quantity-model` dependency covers Starling |
| `pedigree` retained as deferred | Unchanged | §7 row 8 | Low cross-specialty reuse; escape hatch is likely the permanent answer |
| Quantitative data visualisation excluded | New scope statement | — | The grammar teaches structure, not magnitude |
| `causal-graph`: add `kind: intervention`, `relation: inhibits` | Extension | v0.1 schema | Required by `CR-treat-hfref`; evidence is in-chapter, not anticipated |
| `threshold-scale`: qualifiers, context scope, confounders, ordinal bands | Extension | §3.4 (deferred contracts) | Each corresponds to an Item 234 case that is medically wrong without it |
| Fragment mode, drill-down, negative declarations | New grammar features | §5, §8 | See §7 |
| Blueprint intent vocabulary retired in favour of primitive names | Amendment | `blueprint.md`, `REFERENCE_IMPLEMENTATION_DESIGN.md` §6 | The vocabulary causes a 4/9 misclassification rate by construction. Experiment question 5's trigger has fired |

---

# 9. Recommended implementation roadmap

## 9.1 What is already built, and what that changes

Wave 0 of the audit's plan is **done**, and it changes the sequencing logic materially. The persisted, validated, grounded semantic specification exists; `causal-graph` is implemented end to end with deterministic layout, real text measurement, a no-truncation guarantee, digest-bound independent grounding verdicts, a computed render-eligibility gate, and a non-medical fixture proving the renderer is a grammar rather than a chapter-shaped tool. Sixty-nine tests pass in about 200 ms.

The consequence: **every remaining primitive is now an incremental addition — one schema contract, one renderer — not an architectural change.** The roadmap below is therefore ordered by *risk retired per unit of work*, not by dependency.

## 9.2 Wave 0.5 — retire the intent vocabulary (prerequisite, no new primitives)

Replace `visual_plan`'s four intent words with primitive names across the whole vocabulary at once, and reclassify the four misclassified entries of §2.2. Add negative declarations (§7.3).

*Why first:* while the Blueprint speaks `process-flow`/`feedback-loop`/`comparison`/`algorithm`, four of nine declarations are wrong **by construction** and every downstream stage inherits the error. This is a documentation and vocabulary change with near-zero implementation cost and the highest correctness leverage in the roadmap. Doing any renderer before it means building a correct renderer for a wrongly-declared intent.

## 9.3 Wave 1 — correctness: `threshold-scale`, then `comparison-matrix`

`threshold-scale` first, for three converging reasons. It retires a **live, shipping medical misrepresentation** — `MEC-oap` is the only active visual and it teaches progression where its own walkthrough teaches a state change. It carries the highest-risk content class in the grammar (exact numbers) and therefore establishes the I6 verbatim-anchor discipline before any other primitive can be built without it. And it is the highest-frequency SVG primitive across the EDN at ~85 %.

`comparison-matrix` second because it is the cheapest primitive in the library — the `CONF-*` elements already carry machine-readable poles — it is HTML with no geometry engine, it serves five Item 234 instances, and it establishes two disciplines nothing else will: the non-merge assertion, and the distinction between context-dependence and unresolved conflict.

*Wave 1 exit criterion:* the phenotype partition renders with three bands and its intermediate band intact; the OAP threshold renders with its qualifier verbatim; NYHA renders as an ordinal scale; the CCB source conflict renders as unresolved with no synthesised rule.

## 9.4 Wave 2 — defence: `enumeration-set`

*Why here and not later:* it is the cheapest primitive to build and it closes the hole through which the audit's two worst measured medical errors entered. Until it exists, every set-shaped element in every chapter has no correct target, and the historical evidence is unambiguous about what authors do then. Building it early is buying insurance before the exposure grows to a second and third chapter.

*Exit criterion:* the four mortality-reducing classes render as four concurrent, unnumbered, un-arrowed items grouped apart from the diuretic, with declared cardinality validated.

## 9.5 Wave 3 — clinical reasoning: `decision-algorithm`, `profile-matrix`

Both serve the clinical-reasoning projection, which contains the two strongest independent demand signals in the repository: a hand-drawn ASCII triage, and a walkthrough that says outright *"Ce bloc n'a pas encore de visuel officiel : l'algorithme de triage sera produit par le pipeline quand la primitive correspondante existera."*

`decision-algorithm` needs `threshold-scale`'s fragment mode, which Wave 1 delivers — a diagnostic algorithm without its threshold conditions is not the ESC pathway, it is a flowchart. `profile-matrix` is small and is the first test of the empty-cell rule that justifies its separateness (§3.3).

## 9.6 Wave 4 — structure: `timeline`, `quantity-model`

Both are irreducible and both are needed by Item 234, but neither retires a live defect, and their blocks are complete without them under §5.1. `timeline` should come first of the two: it is the higher-frequency primitive, and it is the one whose absence forces an actively wrong representation (a phase chain asserting causation), whereas `quantity-model`'s absence merely leaves content in prose.

## 9.7 Wave 5 — the contested boundary: `transmission-path`, with a merge review

Deliberately last, and this is a design decision rather than a scheduling one. It holds the least-confident boundary in the grammar. By the time it is reached, chapters two and three will have produced the evidence that decides it, and the question is now testable rather than aesthetic: **do that chapter's paths have parallel, rank-aligned routes?** If they are single-route, merge into `causal-graph` and retire the primitive. If they align across, the split is confirmed.

Building it earlier would spend the evidence rather than gather it.

## 9.8 Never, unless a condition is met

`annotated-figure`: blocked on four ratified statements and a licensing path. `physiological-curve`, `hierarchy`, `pedigree`: triggers named in §4.3. `entity-card`, `signalling-cascade`, `procedure-sequence`: retired, with the primitive that owns their content named.

---

# 10. Priority order

Single ordered list, with the reason each position is where it is.

| # | Item | Type | Primary justification |
|---|---|---|---|
| 1 | Retire the Blueprint intent vocabulary; reclassify the four misclassified entries | Vocabulary | Near-zero cost; without it, 4/9 declarations are wrong by construction |
| 2 | Negative declarations (`not-needed` / `forbidden`) | Grammar feature | Protects `CONF-ccb-fe-source` and makes I8 decisions durable and enforceable |
| 3 | `threshold-scale` (numeric + ordinal + qualifier + context + confounders) | Primitive | Retires the only live medical misrepresentation; establishes I6 discipline; highest-frequency SVG primitive |
| 4 | `comparison-matrix` | Primitive | Cheapest; poles already authored; establishes the conflict-versus-context distinction |
| 5 | `enumeration-set` | Primitive | Cheapest to build, highest defensive value, closes the hole that produced the worst measured errors |
| 6 | `threshold-scale` fragment mode | Grammar feature | Prerequisite for a truthful `decision-algorithm` |
| 7 | `decision-algorithm` | Primitive | Two explicit demand signals; restores the branch that prose loses |
| 8 | `profile-matrix` | Primitive | Small; first test of the empty-cell rule |
| 9 | `causal-graph`: `intervention` kind, `inhibits` relation | Extension | Unlocks treatment-derived-from-mechanism, the pedagogical payload of `CR-treat-hfref` |
| 10 | `timeline` | Primitive | Irreducible; absence forces an actively wrong representation |
| 11 | Drill-down cross-reference | Grammar feature | Makes the spine/compensation redundancy question decidable |
| 12 | `quantity-model` | Primitive | Irreducible; absence leaves content in prose rather than misrepresenting it |
| 13 | Revisit the cycle rules (multi-loop, symmetric feedback) | Extension | Item 234 already shows three cycles; endocrinology will break rule J |
| 14 | `transmission-path` **and** the `causal-graph` merge review, together | Primitive + decision | Deliberately last, so the boundary is decided on second-chapter evidence |
| — | `annotated-figure` | RESERVED | Blocked |

A single principle explains the ordering: **retire wrongness before adding capability, and add cheap defences before expensive ones.** Positions 1–5 are almost entirely correctness and insurance; capability starts at 7.

---

# 11. Risks, trade-offs and future extensions

## 11.1 Risks this design introduces

| Risk | Why plausible | Mitigation |
|---|---|---|
| **`enumeration-set` becomes a dumping ground** | It is the easiest primitive to satisfy, and any list can be poured into it. It would then reintroduce the wall-of-content problem in a new wrapper | Declared cardinality; required membership logic and ordering basis; report instance counts per chapter and treat a rising share as a signal that content is being pushed into the visual layer rather than analysed |
| **HTML primitives are treated as second-class** | Four of nine primitives are HTML, and the pull toward "make it a diagram" is strong and documented | I9 is already ratified. Report SVG-versus-HTML ratio per chapter; a rising SVG share is a warning, not progress |
| **The `comparison-matrix` / `profile-matrix` boundary erodes** | Both are grids; the distinction is semantic, not visual | The empty-cell validator rule makes the boundary mechanically enforced rather than a matter of judgement (§3.3) |
| **Grounding cost scales with unit count** | Every band, cell, item and station becomes a claim block. A twelve-item set is twelve claims; the spine alone produced sixteen | Structural budgets are cost controls as well as pedagogical ones. Test the experiment's own hypothesis that a visual's bridging unit and its walkthrough's corresponding bridging claim are the *same* inference, adjudicated once |
| **Nine primitives is more surface than six** | Three more schemas, three more renderers, three more validators | Two of the three additions are HTML with no geometry engine. And the count reflects the content: nine structures were found, so a six-primitive grammar does not have less surface — it has the same surface plus distortion |
| **Fragment mode invites nesting** | Once one primitive embeds in another, everything will want to | Only `threshold-scale` may be a fragment. Enforce it in the schema, not by convention |
| **Cross-EDN frequency estimates are wrong** | They are reasoned from curriculum structure, not measured | Re-derive after chapters three and four, chosen to be structurally unlike cardiology. Publish the delta |

## 11.2 Trade-offs deliberately accepted

**Nine primitives instead of six.** The brief asked for the minimum. Nine is the minimum that expresses Item 234 without distortion; six would require forcing sets into flows, thresholds into steps, and trajectories into causal chains — the three specific errors the audit measured. The added surface is the price of not repeating them, and it is paid mostly in HTML.

**`transmission-path` retained despite low confidence.** Retaining a primitive that may merge is a real cost. The alternative — merging now — would destroy the rank-alignment semantics before there is evidence about whether they recur, and I11 is explicit that content must never be bent to the closest primitive.

**`annotated-figure` specified but not built.** This leaves a genuine pedagogical gap in `MEC-remodeling`. Accepted because §5.1 makes the block complete without a visual, so the cost is bounded, whereas admitting the asset pipeline imports an unbounded commitment.

**Quantitative data visualisation excluded.** Some content genuinely benefits from a bar or a survival curve. Accepted, because admitting magnitude would import a charting subsystem and an axis-scaling problem in exchange for facts prose states better.

**Ratified names are proposed for change.** Renaming `contrast-pair` costs churn in a document already ratified. Accepted because the name actively misdescribes three of five real instances, and a name that misdescribes its content will keep producing wrong classifications for years.

## 11.3 Future extensions, in likely order

1. **Cycle-rule revision** for multi-loop and symmetric feedback. Item 234 already supplies three cycles; endocrinology will force it. The change is to the *rules*, not the schema.
2. **Effect polarity** on `causal-graph` — desired versus adverse, therapeutic versus harmful. Deferred by the experiment awaiting `CR-treat-hfref`, which Wave 3 reaches. The shape (node valence, edge valence, or relation kind) should be decided then, on real content.
3. **`relation_shape`** on `quantity-model`, absorbing the qualitative content of physiological curves.
4. **`hierarchy`**, if and only if a chapter needs three genuine levels and grouped enumeration demonstrably loses meaning.
5. **`annotated-figure`**, when and only when the four blocking conditions and the licensing path are each answered.
6. **Retirement of `transmission-path`**, if second- and third-chapter paths turn out to be single-route.

## 11.4 What would falsify this design

Named in advance, so the design can be tested rather than defended.

- **A second chapter needs a tenth primitive.** Would show the nine are cardiology-shaped, not structural. The escape-hatch count is the instrument: if a chapter uses it more than once for the same shape, this document was wrong.
- **`enumeration-set` exceeds ~35 % of a chapter's visual artifacts.** Would show it is absorbing unstructured content rather than representing sets, and that it should be narrowed or retired.
- **Specifications are hand-edited routinely.** Already named in §6.4 of the contract as the signal that primitives are insufficient. If hand-edit frequency does not fall as primitives are added, the primitives are the wrong ones.
- **Two chapters' `transmission-path` instances are single-route.** Would confirm the merge and retire a primitive.
- **`profile-matrix` is never selected in three chapters.** §4.4 makes it a retirement candidate. It is the second-most-likely retirement after `transmission-path`.
- **Learners cannot reconstruct a chapter from its visuals.** The deepest falsification, and the only one that matters pedagogically. If `MM-pump-decompensation`'s graph plus the phenotype scale plus the dual-route path do not let a learner redraw the chapter, the problem is not the primitive set but the premise that structure compresses better than prose — and §5.1's amendment shows this project is willing to overturn a ratified premise on learner evidence.

---

# 12. Open questions

Recorded so silence is not mistaken for agreement. Numbering is local to this document.

1. **Where does a visual's composition role live?** `MM-pump-decompensation`'s node budget may reasonably differ between a dominant Overview visual and a compact supporting one, but the specification deliberately does not know its own composition role (§1.1 assigns that to the projection) and the experiment removed `semantic_role` for exactly that reason. Unresolved: whether budgets should be projection-supplied at validation time.
2. **How does subordination read for a shared visual?** §7.4's primary/secondary proposal is a proposal.
3. **Are the cycle rules protecting readability or suppressing accurate models?** Three cycles in one chapter, and endocrinology ahead.
4. **Is `enumeration-set` one primitive or two?** A criteria conjunction is a *test* and a pillar set is an *inventory*. They share a data contract and differ by one field, so §4.3's rule makes them variants. If practice shows authors systematically confusing them, the rule was wrong here.
5. **Is generation reproducible?** The experiment's own largest untested assumption, and no amount of validator strictness addresses it. Nine primitives multiply the exposure by nine.
6. **Is one adversarial reviewer enough?** The experiment's question 12 stands, and it now applies to nine schemas rather than one.
7. **What is the right budget for a `comparison-matrix`'s poles, and for an `enumeration-set`'s items?** Item 234 supplies 2–3 poles and up to about seven items. Whether those are principled ceilings or this chapter's sizes is unknown — the same question the experiment recorded for the node budget, and it will need the same answer.

---

# 13. Provenance

- Analysis performed 2026-07-25, read-only. No existing file was created or modified; this document is the only artifact produced.
- **Phase 1 method.** The 22 Blueprint elements and the mental model were derived independently from `blueprint.md`, `inventory.yaml` (109 Knowledge Points with verbatim anchors), `projections.yaml`, and the four published understanding projections, before the existing `visual_plan` was compared. The legacy SVG corpus was not consulted; the audit's Section 5 conclusions were read only after the independent pass, and the two derivations are compared in §2.
- **Independent convergences worth recording**, since they are the strongest available evidence that these structures are in the content rather than in the analyst: `MEC-congestion` needs no visual; `MEC-ef-phenotypes` is a partitioned continuum, not a comparison; `CR-acute` is a two-axis classification, not an algorithm; `CR-treat-hfref` is a concurrent set, not a sequence; `CONF-ccb-fe-source` must not be diagrammed.
- **Independent divergences from the audit**, each argued above: `enumeration-set` proposed as CORE where the audit routed set-shaped content to "render as HTML" with no primitive; `timeline` and `quantity-model` promoted from EXTENDED on in-chapter evidence; `entity-card` retired permanently rather than deferred; `MEC-oap` reclassified from a causal chain with a threshold gate to a threshold partition; `contrast-pair` broadened because three of five instances have non-entity poles; NYHA identified as an unrepresented ordinal scale.
- Governance: this document proposes; `VISUAL_GRAMMAR_CONTRACT.md` decides. Every delta is enumerated in §8 as an amendment proposal. Nothing here authorises implementation.
