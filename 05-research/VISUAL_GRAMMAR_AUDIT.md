# Visual Grammar Discovery & Audit

| | |
|---|---|
| **Type** | Research / evidence |
| **Status** | Complete — evidence base, not normative architecture |
| **Owner** | Product |
| **Scope** | Project-wide (Lou Médecine), evidenced primarily from Item 234 |
| **Last updated** | 2026-07-24 |

---

# How to read this document

This is **research output**. It records what was found, measured, and reasoned — it does not by itself govern implementation.

The normative decisions derived from this audit live in `VISUAL_GRAMMAR_CONTRACT.md` at the repository root. Where this document and the contract appear to differ, **the contract governs**; this document explains why the contract says what it says.

Nothing in this document should be treated as permanent architecture merely because it appears here. Several recommendations recorded below were deliberately *not* ratified — see the contract's "Deliberately not frozen" section.

## Method and evidence provenance

The audit used three independent sources of evidence, kept conceptually separate:

- **A — Observed.** Reverse-engineering of the legacy Item 234 SVG corpus, by parsing the SVG source of all 61 files (structure, text nodes, topology signatures, fills) rather than reading filenames.
- **B — Current pedagogical need.** An independent pass over all 22 elements of the canonical `blueprint.md`, asking "if no legacy visual existed, what representation would best teach this?" — performed *before* comparing against the legacy taxonomy.
- **C — Forward-looking EDN need.** Reasoning from the structure of medical knowledge across specialties, to identify grammars Item 234 does not exercise.

Every primitive proposed is classified as `OBSERVED`, `INFERRED`, or `ANTICIPATED` (or a combination).

All quantitative claims in Sections 2, 3, and 4 were measured programmatically against the files, not estimated.

---

# 1. Executive verdict

**The legacy corpus is not 61 diagrams. It is one diagram template instantiated 61 times.** All 61 SVGs are variants of a single vertical card-stack: header block, N rounded rectangles connected by downward arrows, summary band. Only three topologies exist across the entire corpus, and 36 of the 61 files contain no relationship at all — they are text cards rendered as SVG.

The consequence is the real problem: **the legacy template made cognitively different relationships visually identical.** A causal mechanism (`mechanism-11`), a therapeutic set (`mechanism-19`), and a diagnostic algorithm (`mechanism-14`) are rendered as the same numbered vertical stack. In `mechanism-19` this is not merely uninformative but medically misleading: the four mortality-reducing classes are concurrent pillars, and numbering them 1→2→3→4 with arrows teaches a sequence that does not exist.

**The deeper structural finding is that the current canonical model contains no semantic graph.** Blueprint `steps:` is a list of prose sentences. Inventory `label:` is a prose sentence. There are no nodes, no edges, no typed relations anywhere in the pipeline. This fully explains why the *new* pipeline independently reinvented the *same* vertical text stack: given only ordered strings, a renderer can only stack them.

It also explains a live defect. `tools/lou-build/lib/svg.js` compensates for the missing semantics by hard-coding chapter-specific medical content into what is named a generic renderer:

```js
// tools/lou-build/lib/svg.js — renderProcessFlowSvg()
const cardY = [160, 248, 376, 504];
const cardH = [56, 96, 96, 94];
const cardFill = ["#F5F7FA", "#FDE7C7", "#FEE2E2", "#F5F7FA"];

for (let i = 0; i < Math.min(4, steps.length); i++) {
  const sub =
    i === 1 && thresholdLabel
      ? `<text class="body">${escapeXml(thresholdLabel)}</text>`
      : i === 2
        ? `<text class="body">OAP cardiogénique</text>`
        : "";
```

The string `"OAP cardiogénique"` is medical content authored by the renderer, not traceable to any Knowledge Point. That is the anti-pattern the whole architecture exists to prevent, and it is currently shipping.

**Is a reusable Visual Grammar feasible? Yes — but not by adding renderers.** Adding `feedback-loop` and `comparison` to `SUPPORTED_VISUAL_INTENTS` would produce differently-shaped text stacks under the same hard-coding pressure. The missing layer is an explicit, persisted **semantic specification** carrying typed nodes and edges with per-node source traceability. Once that exists, deterministic renderers become straightforward and the grammar is genuinely reusable across EDN.

**Recommended direction:** six CORE primitives (four SVG, two HTML), driven by a generated-but-committed semantic specification, with all geometry owned by the renderer and all medical content owned by the specification. Implement a subset first, solely to make the Overview visual-first.

---

# 2. Exact legacy visual inventory

**Count: exactly 61 SVG files**, all in one directory:

`01-learning/generated-assets/cardio/234-insuffisance-cardiaque/figures/`

| Group | Files | Count | Size range |
|---|---|---|---|
| Overview | `overview.svg` | 1 | 8.6 KB |
| Mechanisms | `mechanism-01.svg` … `mechanism-24.svg` | 24 | 5.1–6.1 KB |
| Actors | `actor-01.svg` … `actor-36.svg` | 36 | 4.8–5.0 KB |

Four other SVGs exist in the repository but are **not** part of the legacy Item 234 corpus:

- `demo/legacy/assets/svg/cardio-221-overview.svg` — a different item
- `01-learning/templates/svg/diagram-template.svg` — the component-library showcase
- `01-learning/chapters/cardio/234/figures/mec-oap.svg` — the new pipeline's single proof

## 2.1 Usage analysis — all 61 are orphaned

This is a load-bearing finding. **No file in the repository references any of the 61 SVGs**, other than the legacy self-review that reports having generated them.

- Zero `[[SVG:…]]` markers in `vue-ensemble.md`, `mecanismes.md`, `acteurs.md`, `histoire.md`, `pret.md`. The marker contract is defined in templates and prompts but never honoured.
- Zero Markdown image embeds, zero `<img>` tags, zero inline SVG in any legacy asset.
- `demo/renderer/config.js` contains no reference to `figures`, `.svg`, or `visuals`.
- The only link between prose section *N* and `mechanism-NN.svg` was ordinal position, undocumented in the assets themselves.

**Unused assets: 61 of 61.**

This substantially changes how the corpus should be weighted as evidence: it represents *generation* experience, not *validated pedagogical* experience. No learner has ever benefited from these files, so no learner value is at risk in discarding them.

## 2.2 Structural census (measured)

Every file shares an identical `<defs>` block, identical seven-class typography stylesheet, identical `#FFFFFF` background rect, identical header (title / subtitle / caption / blue rule), and an identical bottom summary band.

| Topology signature (rects, lines, arrowheads, circles) | Files | Structure |
|---|---|---|
| `4, 3, 2, 1` | 36 | Identity card → "Rôle" card → "Points clés" band |
| `5, 4, 3, 3` | 16 | Linear 3-step chain + summary |
| `6, 5, 4, 4` | 5 | Linear 4-step chain + summary |
| `5, 7, 4, 1` | 3 | Two side-by-side cards → merge → one card + summary |
| `10, 12, 9, 6` | 1 | Linear chain with one split-and-merge (`overview.svg`) |

**Three distinct topologies across 61 assets.**

The declared pattern library (`01-learning/templates/svg/svg-patterns.md`) offers nine patterns — process flow, cause→consequence, comparison, decision tree, hierarchy, feedback loop, timeline, anatomy, actor card. Only three were ever used, and the selection rule inside that same document explains why:

> 1. Prefer Process Flow. 2. Otherwise choose the simplest pattern. 3. Avoid combining patterns.

The library instructed the generator to collapse everything into a chain.

## 2.3 Measured defects

| Defect | Files affected | Evidence |
|---|---|---|
| Content duplicated verbatim within the file — the "Rôle" body text is byte-identical to the "Points clés" summary text | 36 / 36 actors | Measured |
| Text terminates mid-sentence (no wrapping / overflow handling) | 30 actors | e.g. `actor-01`: *"augmentation des pressions télédiastoliques —"*; `actor-36`: *"La rupture de"* |
| Literal Markdown `**` emphasis rendered as visible asterisks | 11 actors | `actor-02, 03, 04, 07, 09, 10, 13, 16, 17, 21, 32` |
| Step numbering starts at "2" after a branch | 3 (`mechanism-07, 08, 10`) | Measured; confirmed in the legacy self-review |
| Unanchored numeric medical claims | ≥3 | `mechanism-18` "Mortalité ~50 % à 5 ans" (absent from the canonical Blueprint); `mechanism-20` "QRS ≥ 130 ms" vs `actor-13` "QRS > 120 ms"; `mechanism-21` "ABCDEF" vs Blueprint "ABCDEFG" |

The truncation defect is **not historical**. It is reproduced today by the new renderer's `shortLabel()` (48-character hard cut), visibly producing `"pression capillaire pulmonaire ↑ (suite de ME…"` in `figures/mec-oap.svg`. The same root cause — no text measurement in the layout engine — has now been implemented twice.

## 2.4 Corroboration from the legacy self-review

`01-learning/generated-assets/cardio/234-insuffisance-cardiaque/svg-generation-review.md` independently reported, at generation time:

- *Issue 6* — no `[[SVG:…]]` placeholders in any learning Markdown; prose↔diagram link is implicit.
- *Issue 8* — no wrapping or truncation rules; "some role text still truncates mid-sentence."
- *Issue 9* — the feedback-loop pattern has no template component, so "the generator approximated with a linear cause→consequence flow, which weakens the pedagogical pattern match."
- *Issue 10* — branching/merge layout underspecified; step numbering skips after a branch.
- *Issue 18* — 61 hand-composed SVGs with no generator, snippet library, or layout helpers.

The audit's independent measurements agree with all five.

---

# 3. Complete audit matrix

Every one of the 61 files is accounted for. The 36 actor cards are audited as one block because they are structurally and semantically identical; their individual contents are listed so nothing is hidden.

## 3.1 Overview (1 file)

| SVG | Legacy context | Learner question | Cognitive job | Semantic topology | Quality | Problems | Candidate primitive | Migration |
|---|---|---|---|---|---|---|---|---|
| `overview.svg` | `vue-ensemble.md` | What is the whole chapter? | Provide the chapter mental model | Linear chain, one split rejoining | **Genuinely useful** — best asset in the corpus; its spine is close to the correct model | 1202 px tall so never above the fold; step 3 missing from numbering; compensation loop drawn as a straight line; terminal node collapses diagnosis + etiology + treatment + follow-up into one box | `causal-graph` | **KEEP AS REFERENCE** |

## 3.2 Mechanisms (24 files)

| SVG | Learner question | Cognitive job | Topology | Quality verdict | Problems | Primitive | Migration |
|---|---|---|---|---|---|---|---|
| `mechanism-01` | What is HF? | Definition | 3-chain | Mostly decorative | Definition restated as boxes; no relationship | none | **DROP** |
| `mechanism-02` | How is cardiac output produced? | Quantitative dependency | 4-chain | Too text-heavy; wrong shape | Formulas are a *determinant tree*, not a sequence; arrows assert false causality between three identities | `quantity-decomposition` (EXTENDED) | **RENDER AS HTML** |
| `mechanism-03` | Why compensate? | Compensation helps then harms | 3-chain | Useful but duplicative | Loop drawn as a line — the vicious circle is invisible | `causal-graph` (cycle) | **MERGE** |
| `mechanism-04` | Why tachycardia? | Same contract as 03 | 3-chain | Too atomized | One instance of the same loop | `causal-graph` | **MERGE** |
| `mechanism-05` | Why vasoconstriction? | Same contract as 03 | 3-chain | Too atomized | Same | `causal-graph` | **MERGE** |
| `mechanism-06` | Why salt/water retention? | Same contract as 03 | 3-chain | Too atomized | Same | `causal-graph` | **MERGE** |
| `mechanism-07` | What is remodeling? | Two geometric transformations | split-pair | Unsuitable as text | Ventricular geometry cannot be taught with rectangles; text describes shape instead of showing it | *reveals* `anatomical-schematic` | **SPECIAL CASE** |
| `mechanism-08` | Reduced or preserved EF? | Phenotype partition | split-pair | Useful but medically distorting | Binary split demotes the intermediate phenotype to an afterthought card; the underlying object is a continuum with two cut-offs | `threshold-scale` | **SUBSUME** |
| `mechanism-09` | How does desynchronisation worsen HF? | Causal + therapeutic hook | 3-chain | Too atomized | Three boxes; belongs inside remodeling | `causal-graph` | **MERGE** |
| `mechanism-10` | How do arrhythmias complicate HF? | Two parallel consequence branches | split-pair | Genuinely useful shape | Correct fan-out, but arbitrary third card appended | `causal-graph` (fan-out) | **SUBSUME** |
| `mechanism-11` | How does congestion cause OAP? | Causal chain crossing a threshold | 3-chain | Genuinely useful | Threshold is plain text in a box, not a visual event | `causal-graph` + `threshold-scale` | **SUBSUME** |
| `mechanism-12` | How to recognise HF clinically? | Findings with unequal discriminating power | 3-chain | Better as a table | Arrows between symptom categories assert causality that does not exist | none | **RENDER AS HTML** |
| `mechanism-13` | How does BNP help? | One arm of the diagnostic path | 3-chain | Duplicative | Fragment of the ESC algorithm | `decision-algorithm` | **MERGE** |
| `mechanism-14` | Why is echo central? | **Diagnostic algorithm** | 4-chain | **Wrong grammar** | An algorithm with rule-out branches rendered as a linear chain — the branch, which is the actual teaching content, is erased | `decision-algorithm` | **MERGE** |
| `mechanism-15` | What completes the work-up? | Same as 13/14 | 3-chain | Duplicative | Fragment | `decision-algorithm` | **MERGE** |
| `mechanism-16` | What are the etiologies? | Category enumeration | 3-chain | Lossy | Seven Blueprint etiology categories compressed into 3 boxes; arrows imply ordering | none | **RENDER AS HTML** |
| `mechanism-17` | What is acute HF? | Triage on two axes | 4-chain | **Wrong grammar** | Two independent axes rendered as a sequence | `profile-matrix` | **SUBSUME** |
| `mechanism-18` | How does HF evolve? | Temporal trajectory with oscillations | 3-chain | **Wrong grammar** | Oscillation is the whole point and is invisible; also carries an unanchored mortality figure | *reveals* `timeline` | **SPECIAL CASE** |
| `mechanism-19` | How to treat HFrEF? | Concurrent therapeutic pillars | 4-chain | **Medically misleading** | Numbered arrows teach a sequence that does not exist; also merges two classes into one box to fit four slots | `causal-graph` (fan-out) | **SUBSUME** |
| `mechanism-20` | When CRT or DAI? | Indication criteria | 3-chain | Better as a table | Criteria are conjunctions of thresholds, not steps | `threshold-scale` in a table | **RENDER AS HTML** |
| `mechanism-21` | How to treat HFpEF? | Loose management list | 3-chain | Better as a table | No relationships; also contradicts the Blueprint mnemonic | none | **RENDER AS HTML** |
| `mechanism-22` | How to manage OAP urgently? | Conditional emergency actions | 4-chain | Duplicative of 23 | Conditions drawn as linear steps rather than branches | `decision-algorithm` | **MERGE** |
| `mechanism-23` | How to treat cardiogenic shock? | Same triage as 17/22 | 3-chain | Duplicative | Third arm of one algorithm | `decision-algorithm` | **MERGE** |
| `mechanism-24` | What applies to all HF patients? | Checklist | 3-chain | Mostly decorative | Arrows between unrelated care categories | none | **RENDER AS HTML** |

## 3.3 Actors (36 files) — audited as one block

All 36 share topology `4, 3, 2, 1`, contain zero semantic relationships, and duplicate their own body text verbatim in the summary band.

- **Learner question:** "What is X and what is its role in heart failure?"
- **Cognitive job:** Entity identity + role + salient facts.
- **Semantic topology:** None. Two arrows connect a title to its own description.
- **Quality:** Uniformly *better represented as semantic HTML/CSS*. There is nothing spatial, relational, or temporal to draw.
- **Problems:** 36/36 duplicate content internally; 30/36 truncate mid-sentence; 11/36 leak literal `**`. The class as a whole is textbook actor-card proliferation.
- **Candidate primitive:** `entity-card` (HTML, EXTENDED).
- **Migration:** **RENDER AS HTML**, all 36.

Contents, for completeness:

| Sub-group | Files |
|---|---|
| Anatomical / cellular | 01 VG, 02 VD, 03 oreillettes + circulation pulmonaire, 04 circulation veineuse systémique, 05 myocyte, 10 capillaires pulmonaires, 11 poumons, 12 foie, 13 système de conduction |
| Neurohormonal systems / organ | 06 sympathique, 07 SRAA, 08 rein |
| Biomarker | 09 BNP / NT-proBNP |
| Investigations | 14 ECG, 15 radiographie, 16 ETT, 17 coronarographie, 18 IRM, 19 cathétérisme |
| Clinical tool | 20 NYHA |
| Etiologies | 21 ischémique, 22 HTA, 23 valvulopathies, 24 cardiomyopathies, 25 FA |
| Drugs | 26 diurétiques, 27 IEC/ARA2/ARNI, 28 bêtabloquants, 29 antialdostérones, 30 gliflozines, 31 nitrés, 32 inotropes |
| Devices | 33 DAI, 34 CRT, 35 greffe / assistance |
| Person | 36 patient |

Actors 01–05 and 10–13 are the exact anatomical entities a genuine `transmission-path` visual would place as *stations on a circuit*. The legacy system atomised nine connected anatomical structures into nine disconnected text cards — the clearest single example of atomisation destroying the relationship that mattered.

---

# 4. Legacy pattern clustering

## 4.1 Patterns actually found

| Pattern | Count | Files |
|---|---|---|
| Actor text card (no relationship) | 36 | `actor-01` … `actor-36` |
| Linear vertical chain, 3 steps | 16 | `mechanism-01, 03, 04, 05, 06, 09, 11, 12, 13, 15, 16, 18, 20, 21, 23, 24` |
| Linear vertical chain, 4 steps | 5 | `mechanism-02, 14, 17, 19, 22` |
| Split-pair with merge | 3 | `mechanism-07, 08, 10` |
| Chain with one embedded split | 1 | `overview.svg` |

## 4.2 Looked different, semantically identical (must merge)

- **`mechanism-03, 04, 05, 06`** — presented as four separate mechanisms. All four instantiate one contract: *a compensatory response that maintains output short-term and increases load long-term.* The canonical Blueprint already treats them as one element, whose own note reads "One mechanism, not four isolated facts." The legacy corpus produced exactly the four isolated facts. **4 → 1.**
- **`mechanism-13, 14, 15`** — three fragments of a single diagnostic pathway. **3 → 1.**
- **`mechanism-17, 22, 23`** — three fragments of one acute triage. **3 → 1.**
- **All 36 actor cards** — one contract, 36 instantiations. **36 → 1 component.**

## 4.3 Looked similar, semantically distinct (must stay distinct)

This is the corpus's defining failure. These files are visually near-identical and cognitively unrelated:

| Files | Apparent shape | Actual semantics |
|---|---|---|
| `mechanism-11` | 3-box vertical chain | Causal chain crossing a physical threshold |
| `mechanism-19` | 4-box vertical chain | Set membership — concurrent, non-ordered treatment pillars |
| `mechanism-14` | 4-box vertical chain | Conditional algorithm with rule-out branches |
| `mechanism-02` | 4-box vertical chain | Algebraic decomposition of a quantity |
| `mechanism-18` | 3-box vertical chain | Temporal trajectory with oscillation |

A learner shown all five learns the same visual lesson — "things follow each other downward" — from five relationships of which only one is actually sequential.

**This single observation is the strongest argument in the audit for a semantic grammar over a visual style library.**

## 4.4 Overlaps

`mechanism-11` (OAP causal chain) also appears as the `overview.svg` congestion branch, as `actor-10` text, and as the new pipeline's `mec-oap.svg`. One relationship, four assets.

---

# 5. Independent Blueprint-first findings

Performed by reading `01-learning/chapters/cardio/234/blueprint.md` and asking, for each of the 22 elements, "if no legacy visual existed, what is the cognitively optimal representation?" — **before** consulting the legacy taxonomy.

| # | Element | Cognitive job | Visual materially helps? | Ideal representation | Priority | Projection |
|---|---|---|---|---|---|---|
| 1 | `ANA-ville-pompe` | Prime intuition before any medical claim | No (optional) | Structured prose; at most one *non-medical* illustration, excluded from grounding | Optional | story |
| 2 | `MM-pump-decompensation` | Hold the whole chapter in one image | **Yes — highest value in the chapter** | **Causal graph** with fan-out and one feedback edge | **Essential** | overview (dominant) |
| 3 | `MEC-output-basics` | Make output and ejection fraction measurable | Marginal | HTML formula card: quantity ← determinants. Not a flow | Useful | overview + mechanisms |
| 4 | `MEC-compensation` | Show help→harm becoming a circle | **Yes** | **Causal graph containing a cycle**; the return edge *is* the lesson | **Essential** | overview (folded into spine) + mechanisms |
| 5 | `MEC-remodeling` | Geometry becomes durable damage | Yes, but needs *shape* | Anatomical / geometric schematic. Text cannot do this | Useful | mechanisms |
| 6 | `MEC-ef-phenotypes` | Three phenotypes on one continuum | **Yes** | **Threshold scale**: one axis, two cut-offs, three named bands | **Essential** | overview |
| 7 | `CONF-ef-types` | Prevent collapsing two logics | Yes | **Contrast pair** (HTML) — Blueprint already supplies `a`/`b` | Useful | mechanisms |
| 8 | `MEC-arrhythmia` | Consequence *and* aggravator | Marginal | Causal-graph fan-out, or two lines of prose | Optional | mechanisms |
| 9 | `MEC-congestion` | Where the pressure goes | **Yes** | **Transmission path**, left-sided lane | **Essential** | overview + mechanisms |
| 10 | `MEC-systemic-congestion` | Mirror circuit on the right | **Yes — same visual** | Second lane of the same transmission path | **Essential** | overview + mechanisms |
| 11 | `CONF-left-right` | Never confuse the two circuits | **Yes** | *The dual-lane transmission path answers this directly — no separate asset* | **Essential** | overview + mechanisms |
| 12 | `MEC-oap` | Threshold crossing produces catastrophe | Yes | Causal graph with a **threshold gate** annotation | Useful | mechanisms |
| 13 | `CONF-transsudat-exsudat` | Same emergency, different mechanism | Yes | **Contrast pair** (HTML) | Useful | overview (compact) + mechanisms |
| 14 | `CR-recognize` | Findings have unequal weight | No | Table with a discriminating-power column | Unnecessary as diagram | clinical reasoning |
| 15 | `CR-diagnose` | Move from suspicion to confirmation | **Yes** | **Decision algorithm** with rule-out thresholds | **Essential** | overview (mini) + clinical reasoning |
| 16 | `CR-etiology` | Systematic cause hunt | No | Ordered checklist / table | Unnecessary as diagram | clinical reasoning |
| 17 | `CR-acute` | Triage on two independent axes | **Yes** | **2-axis profile matrix** | **Essential** | clinical reasoning |
| 18 | `CONF-bb-chronic-vs-acute` | Two contexts, two rules | Yes | **Contrast pair** (HTML), context-keyed | Useful | clinical reasoning |
| 19 | `CR-treat-hfref` | Concurrent pillars + a symptomatic branch | **Yes** | **Causal-graph fan-out** with edge typing | **Essential** | clinical reasoning |
| 20 | `CR-treat-hfpef` | Less codified logic | No | Short prose + table | Unnecessary | clinical reasoning |
| 21 | `CONF-ccb-fe-source` | Preserve an unresolved source conflict | No | Table with three distinct anchors and an explicit conflict marker | **Unnecessary — and must not be diagrammed** | clinical reasoning |
| 22 | `CR-followup` | Oscillating long trajectory | Yes | **Timeline / trajectory** — a chain cannot show oscillation | Useful | clinical reasoning |

## 5.1 Comparison with the legacy taxonomy

**Where legacy pattern and ideal representation agree** — three cases only: `MM-pump-decompensation` (the `overview.svg` spine is broadly correct), `MEC-oap` (`mechanism-11` is a correct causal chain), `MEC-arrhythmia` (`mechanism-10` fan-out is right).

**Where a legacy visual exists but is unnecessary** — 46 files: all 36 actors, plus `mechanism-01, 12, 16, 20, 21, 24` (belong in tables or prose), plus `mechanism-04, 05, 06, 09` (atomised fragments).

**Where the Blueprint requires a grammar absent from legacy** — six, and these are the important ones:

1. **Feedback loop.** `MEC-compensation` is explicitly a loop; the Blueprint declares the intent; the legacy review admits the generator approximated it with a linear flow. Never rendered.
2. **Threshold scale.** `MEC-ef-phenotypes` is a partitioned continuum. Legacy forced it into a binary split.
3. **Transmission path.** `MEC-congestion` + `MEC-systemic-congestion` + `CONF-left-right` form a two-lane circuit. Legacy has no such visual and instead atomised the circuit's stations into disconnected actor cards.
4. **Decision algorithm.** `CR-diagnose` and `CR-acute`. Legacy rendered `mechanism-14` as a chain, erasing the branch.
5. **Profile matrix.** `CR-acute`'s two triage axes. Absent.
6. **Timeline.** `CR-followup`'s oscillating natural history. Absent.

**Where a better representation than the legacy SVG exists** — 42 files should be HTML rather than SVG (Section 7), and `mechanism-08` should become a threshold scale, which is not merely nicer but *more medically faithful*, since it restores the intermediate phenotype to its position as a band on a continuum rather than a footnote.

## 5.2 Two corroborating signals independent of the legacy corpus

**A hand-drawn ASCII diagram already exists in the projections.** `projections/understanding/clinical-reasoning.md` contains a fenced code block drawing a two-axis triage by hand. The projection author needed a structure the grammar had none for, and drew one in text. That is a demand signal arising entirely independently of the legacy corpus.

**The `CONF-*` elements already carry machine-readable relational data.** They are the only Blueprint elements with explicit `a:` and `b:` poles. A `contrast-pair` component therefore needs no new authoring whatsoever, making it the cheapest available primitive.

---

# 6. Proposed CORE Visual Grammar V1

Six primitives. This number is derived, not targeted. Two deliberate merges and two deliberate splits are argued below.

> Status note: in `VISUAL_GRAMMAR_CONTRACT.md` these are ratified as **CURRENT CORE CANDIDATES**, not as a closed or final taxonomy.

## CORE-1 · `causal-graph` — SVG

- **Evidence origin:** OBSERVED (21 legacy chains + `overview.svg`) + INFERRED (chapter spine, compensation cycle, treatment fan-out)
- **Cognitive job:** Show why a state produces another, including divergence, convergence, and self-reinforcement.
- **Learner question:** *Why does this happen? What makes it worse?*
- **Semantic relationship:** Directed, typed causal influence between states. Cycles permitted (at most one, emphasised).
- **Topology:** DAG with fan-out / fan-in, plus optional single back-edge.
- **Mandatory data:** `nodes[{id, label, kind, kp[]}]`, `edges[{from, to, kind, kp[]}]`
- **Optional data:** `edge.label`, `node.emphasis`, `groups[]`, threshold-gate reference, `takeaway`
- **Rendering technology:** SVG
- **Good for:** pathophysiological cascades, vicious circles, treatment→outcome fan-out, multi-organ interaction
- **Bad for:** ordered procedures, pure enumerations, anything where arrows would assert causality that does not exist — the most common legacy error
- **Legacy examples:** `overview`, `mechanism-01, 03, 04, 05, 06, 09, 10, 11, 19, 23`
- **Blueprint examples:** `MM-pump-decompensation`, `MEC-compensation`, `MEC-oap`, `MEC-arrhythmia`, `CR-treat-hfref`
- **Legacy SVGs subsumed:** ~13
- **Estimated EDN reuse:** Very high — pathophysiology exists in every chapter
- **Confidence:** High

> **Deliberate merge.** `feedback-loop` is *not* a separate primitive. It is a `causal-graph` containing one back-edge. The data contract is identical and the renderer differs by one routing path; separating them would create precisely the "primitive that is actually a visual style" anti-pattern. The counter-argument is real — "what creates a vicious circle?" is a different learner question — and is answered by edge typing and emphasis rather than a second contract. Revisit if a chapter needs multiple interacting loops.

## CORE-2 · `transmission-path` — SVG

- **Evidence origin:** INFERRED (three Blueprint elements) + ANTICIPATED (infectious spread, neural tracts, lymphatic drainage) + OBSERVED-as-failure (nine stations atomised into nine actor cards)
- **Cognitive job:** Show *where* something propagates, through which named stations, in which direction.
- **Learner question:** *Where does it go? Which route? How do two routes differ?*
- **Semantic relationship:** Propagation of one quantity or agent through an ordered sequence of anatomical or compartmental stations.
- **Topology:** One or two parallel lanes of ordered stations, optionally cross-linked.
- **Mandatory data:** `lanes[{id, label, stations[{id, label, kp[]}]}]`, `direction`
- **Optional data:** `lane_cross_links[]`, `terminal_manifestations[]`, `emphasis`
- **Rendering technology:** SVG
- **Good for:** left vs right circulation, ascending/descending neural pathways, pathogen transmission chains, portal/systemic circulation, metastatic routes
- **Bad for:** causation (the stations do not cause each other), decision-making
- **Legacy examples:** None — the corpus's largest gap
- **Blueprint examples:** `MEC-congestion`, `MEC-systemic-congestion`, `CONF-left-right`
- **Legacy SVGs subsumed:** 0 directly; restores the relationship lost across 9 actor cards
- **Estimated EDN reuse:** High — neurology, infectious disease, hepatology, oncology
- **Confidence:** Medium-high

> **Deliberate split.** Kept distinct from `causal-graph` because the learner question differs (WHERE vs WHY), the nodes are *places* rather than *states*, the edge means "the same thing moves onward" rather than "this causes that", and parallel-lane reading is structural rather than stylistic. **This is the merge decision held with least confidence**; it should be re-examined after the second chapter.

## CORE-3 · `decision-algorithm` — SVG

- **Evidence origin:** INFERRED (two Blueprint elements) + ANTICIPATED (pervasive across EDN) + OBSERVED-as-failure (`mechanism-14` rendered an algorithm as a chain)
- **Cognitive job:** Show what to do next given what is currently known.
- **Learner question:** *What do I do next? When does the decision change?*
- **Semantic relationship:** Conditional branching on test results, thresholds, or clinical findings.
- **Topology:** Rooted tree/DAG of decision, test, action, and outcome nodes with labelled branches.
- **Mandatory data:** `entry`, `nodes[{id, kind, label, kp[]}]`, `branches[{from, condition, to, kp[]}]`
- **Optional data:** threshold references, guideline reference, urgency, dead ends
- **Rendering technology:** SVG
- **Good for:** diagnostic pathways, emergency triage, therapeutic escalation, screening protocols
- **Bad for:** simultaneous classification on independent axes (use CORE-6); genuine checklists
- **Legacy examples:** `mechanism-13, 14, 15, 17, 22, 23` — all mis-rendered as chains
- **Blueprint examples:** `CR-diagnose`, `CR-acute`
- **Legacy SVGs subsumed:** 6
- **Estimated EDN reuse:** Very high
- **Confidence:** High

## CORE-4 · `threshold-scale` — SVG (standalone **and** embeddable annotation)

- **Evidence origin:** INFERRED (three Blueprint elements) + ANTICIPATED (staging, eGFR, scores, dose bands)
- **Cognitive job:** Show that a continuous quantity is partitioned by named cut-offs into bands carrying different meaning.
- **Learner question:** *At what value does the meaning change?*
- **Semantic relationship:** Ordered partition of a continuum.
- **Topology:** One axis, N−1 cut-offs, N labelled bands; or a single gate marker attached to a node in CORE-1 / CORE-3.
- **Mandatory data:** `quantity`, `unit`, `cutoffs[{value, comparator, kp[], anchor_quote_verbatim}]`, `bands[{label, range, kp[]}]`
- **Optional data:** typical range, confounders, `attach_to`
- **Rendering technology:** SVG, embeddable
- **Good for:** classification cut-offs, rule-out thresholds, staging boundaries, device-eligibility criteria
- **Bad for:** categorical distinctions with no underlying continuum
- **Legacy examples:** `mechanism-08, 11, 20` — all as plain text in boxes
- **Blueprint examples:** `MEC-ef-phenotypes`, `MEC-oap`, `CR-diagnose`
- **Legacy SVGs subsumed:** 3
- **Estimated EDN reuse:** Very high
- **Confidence:** High

> This primitive carries the highest medical risk in the grammar — exact numbers. Its verbatim-anchor field must be validated deterministically, character for character. That check alone would have caught the legacy QRS-threshold inconsistency.

## CORE-5 · `contrast-pair` — semantic HTML/CSS

- **Evidence origin:** OBSERVED (`mechanism-07, 08, 10`) + INFERRED (all five `CONF-*` elements)
- **Cognitive job:** Prevent conflation of two things that are easy to confuse.
- **Learner question:** *What distinguishes A from B, and why does it matter?*
- **Semantic relationship:** N poles (usually 2) compared across shared discriminating dimensions.
- **Topology:** Side-by-side columns, aligned rows.
- **Mandatory data:** `poles[{id, label}]`, `dimensions[{label, values_by_pole{}, kp[]}]`
- **Optional data:** `never_merge_note`, `unresolved_conflict`, `context_key`
- **Rendering technology:** HTML/CSS. No geometry is required; HTML gives free reflow, selectable text, table semantics for assistive technology, and zero truncation risk.
- **Good for:** confusable pairs, competing mechanisms, normal vs pathological, differential diagnoses
- **Bad for:** more than ~4 poles; comparisons where the *shape* of the objects is the lesson
- **Legacy examples:** `mechanism-07, 08, 10`
- **Blueprint examples:** all five `CONF-*`
- **Legacy SVGs subsumed:** 3
- **Estimated EDN reuse:** Very high
- **Confidence:** Very high

> The `unresolved_conflict` flag matters where a source text is internally inconsistent. The component must be able to display "the source disagrees with itself" rather than silently picking a side.

## CORE-6 · `profile-matrix` — semantic HTML/CSS

- **Evidence origin:** INFERRED (the hand-drawn ASCII triage is direct proof of demand) + ANTICIPATED (risk grids, likelihood × severity, test-performance grids)
- **Cognitive job:** Classify a case simultaneously on two independent axes.
- **Learner question:** *Which situation am I in, and what does that imply?*
- **Semantic relationship:** Cartesian product of two independent binary or ordinal axes into named cells.
- **Topology:** 2×2 or n×m grid.
- **Mandatory data:** `axes[2]{label, levels[]}`, `cells[{coords, label, implication, kp[]}]`
- **Optional data:** `empty_cells_note`, `emphasis`
- **Rendering technology:** HTML/CSS grid
- **Good for:** two-axis triage, risk × urgency, pre-test probability × test result
- **Bad for:** three or more independent axes; sequential decisions
- **Legacy examples:** `mechanism-17` — mis-rendered as a chain
- **Blueprint examples:** `CR-acute`
- **Legacy SVGs subsumed:** 1
- **Estimated EDN reuse:** High
- **Confidence:** Medium-high

## 6.1 Summary

| Primitive | Tech | Origin | Legacy subsumed | Blueprint elements served | Confidence |
|---|---|---|---|---|---|
| `causal-graph` | SVG | OBSERVED + INFERRED | ~13 | 5 | High |
| `transmission-path` | SVG | INFERRED + ANTICIPATED | 0 | 3 | Medium-high |
| `threshold-scale` | SVG | INFERRED + ANTICIPATED | 3 | 3 | High |
| `contrast-pair` | HTML | OBSERVED + INFERRED | 3 | 5 | Very high |
| `decision-algorithm` | SVG | INFERRED + ANTICIPATED | 6 | 2 | High |
| `profile-matrix` | HTML | INFERRED + ANTICIPATED | 1 | 1 | Medium-high |

Four SVG primitives and two HTML components cover 19 of 22 Blueprint elements' visual needs and subsume the cognitive jobs of the legacy mechanism diagrams. The remaining 42 legacy files needed no diagram at all.

---

# 7. Extended candidate grammar

Ordered by likelihood of promotion. **None should be implemented on current evidence.**

| # | Candidate | Evidence | Expected EDN frequency | Why wait | Promotion trigger |
|---|---|---|---|---|---|
| 1 | **`timeline` / natural-history trajectory** | INFERRED (`CR-followup`, `mechanism-18`) + ANTICIPATED (exposed twice in the stress test) | High | Item 234 exercises it once, in the least-visited projection; CORE must first fix the Overview | First infectious-disease, obstetric, or oncology chapter — any domain where phases *are* the content |
| 2 | **`anatomical-schematic`** | INFERRED (`MEC-remodeling`) + ANTICIPATED (neurology, spatial localisation) | High | **Not deterministically generable.** Requires a curated base-artwork library per anatomical region — an asset-pipeline problem wearing a grammar problem's clothes | First anatomy-dominant chapter, *and* only after a base-artwork sourcing decision is made separately |
| 3 | **`entity-card`** | OBSERVED (36 legacy actors) + ANTICIPATED (drugs, pathogens, receptors) | Very high | **It has no consumer today.** The canonical 22-element Blueprint contains zero actor elements | Reintroduction of actors into the Blueprint. Ruling in advance: **HTML, never SVG** |
| 4 | **`quantity-decomposition`** | INFERRED (`MEC-output-basics`) | Medium | An HTML formula card covers the current case adequately | A chapter where a determinant tree is genuinely multi-level |
| 5 | **`physiological-curve`** | INFERRED (Starling relationship) + ANTICIPATED (dose–response, pressure–volume, dissociation curves) | Medium-high | Requires curve equations or curated point data, neither of which the Inventory carries | First pharmacology or respiratory-physiology chapter |
| 6 | **`hierarchy` / classification tree** | ANTICIPATED (staging systems, taxonomies) | Medium | The only Item 234 candidate is a flat list better served by a table | A chapter with genuine ≥3-level nesting |
| 7 | **`signalling-cascade`** | ANTICIPATED (receptor → transduction → effect) | Medium | Arguably `causal-graph` with different node kinds; needs evidence the contract truly differs | First immunology or endocrinology chapter |
| 8 | **`pedigree`** | ANTICIPATED (inheritance) | Low-medium | Highly specialised notation, near-zero reuse outside genetics | First genetics chapter |
| 9 | **`procedure-sequence`** | ANTICIPATED (technical gestures) | Medium | Genuinely ordered steps — but distinctness from a branch-free `decision-algorithm` is unproven | First surgical / procedural chapter |
| 10 | **`imaging-annotation`** | ANTICIPATED | Medium | Requires licensed images; a rights problem before a grammar problem | Radiology-heavy chapter with a resolved image-licensing path |

**Extensibility requirement.** The architecture must let a future chapter introduce a genuinely new primitive without redesign. This is satisfied if the semantic specification is a discriminated union keyed on primitive name, the manifest treats visuals as an open list, and the validator dispatches by primitive. Adding a primitive should then mean adding one schema plus one renderer, touching nothing else.

---

# 8. Non-SVG component recommendations

**42 of the 61 legacy SVGs should never have been SVG.** SVG buys exactly one thing: control of spatial relationships. Where there is no spatial relationship to control, SVG only costs — no text wrapping, no reflow, no selectable text, no responsive behaviour, truncation bugs, and a duplicated `<defs>` block per file.

| Cognitive pattern | Recommended technology | Rationale | Item 234 instances |
|---|---|---|---|
| Entity identity + role + key facts | Semantic HTML/CSS card | Zero relationships to draw; text wraps naturally; solves 30 truncation defects at a stroke | 36 actors |
| Two-pole discriminating comparison | Semantic HTML/CSS | Aligned columns are a layout problem CSS solves better than SVG; contract already exists as `a`/`b` | 5 `CONF-*`, `mechanism-07, 08, 10` |
| Two-axis classification | Semantic HTML/CSS grid | A 2×2 is a table with meaning | `CR-acute`, `mechanism-17` |
| Findings with unequal discriminating power | Table | The content is a mapping, not a topology; arrows would assert false causality | `CR-recognize`, `mechanism-12` |
| Flat category enumeration | Table or ordered list | The legacy 3-box compression was lossy | `CR-etiology`, `mechanism-16` |
| Criteria conjunctions | Table with inline threshold chips | Conjunctions of thresholds, not steps | `mechanism-20` |
| Unresolved source conflicts | Table with explicit conflict marker | **Must not be diagrammed.** A diagram implies a resolved rule; the ambiguity is the teaching point | `CONF-ccb-fe-source` |
| Care checklists, general measures | Structured text | No relationships | `mechanism-21, 24` |
| Algebraic identities | Formula card (HTML) | Arrows between identities assert causality that does not exist | `MEC-output-basics`, `mechanism-02` |
| Narrative metaphor | Optional illustration, outside the grammar | Must be classed as scaffolding, excluded from grounding, never adjacent to sourced claims | `ANA-ville-pompe` |

**A design rule falls out of this:** if a visual contains no arrow, no axis, and no spatial adjacency that carries meaning, it is not a diagram. Applying that rule to the legacy corpus eliminates 42 of 61 files immediately.

---

# 9. Item 234 Blueprint visual map

Optimised for cognitive compression, not coverage. **Ten distinct visual artifacts serve 22 elements** — several elements deliberately share one visual, and eight need none.

| # | Element | Visual? | Primitive / component | Priority | Projection | Legacy evidence? | New representation preferable? |
|---|---|---|---|---|---|---|---|
| 1 | `ANA-ville-pompe` | Optional | Illustration (outside grammar) | Optional | story | No | — |
| 2 | `MM-pump-decompensation` | **Yes** | `causal-graph` — **the spine** | Essential | overview (dominant) | Yes (`overview.svg`) | Yes — add the feedback edge, fix numbering, halve the height |
| 3 | `MEC-output-basics` | Compact | HTML formula card | Useful | overview + mechanisms | Yes (`mechanism-02`) | Yes — HTML, not a false flow |
| 4 | `MEC-compensation` | **Yes** | *folded into the spine as the cycle* | Essential | overview + mechanisms | Yes ×4 | Yes — 4 → 0 new assets |
| 5 | `MEC-remodeling` | Deferred | *(EXTENDED `anatomical-schematic`)* | Useful | mechanisms | Yes (`mechanism-07`) | Yes — but not yet buildable |
| 6 | `MEC-ef-phenotypes` | **Yes** | `threshold-scale` | Essential | overview | Yes (`mechanism-08`) | Yes — restores the intermediate band |
| 7 | `CONF-ef-types` | Yes | *served by the scale + `contrast-pair`* | Useful | mechanisms | Partial | Yes |
| 8 | `MEC-arrhythmia` | No | *(fan-out inside the spine, or prose)* | Optional | mechanisms | Yes (`mechanism-10`) | Merge |
| 9 | `MEC-congestion` | **Yes** | `transmission-path`, lane A | Essential | overview + mechanisms | No | Yes — new grammar |
| 10 | `MEC-systemic-congestion` | **Yes** | *same asset, lane B* | Essential | overview + mechanisms | No | Yes |
| 11 | `CONF-left-right` | **Yes** | *the dual-lane path answers it — no separate asset* | Essential | overview + mechanisms | No | Yes |
| 12 | `MEC-oap` | Yes | `causal-graph` + threshold gate | Useful | mechanisms | Yes (`mechanism-11`, `mec-oap.svg`) | Yes — fix truncation, remove hard-coded strings |
| 13 | `CONF-transsudat-exsudat` | Yes | `contrast-pair` | Useful | overview (compact) + mechanisms | No | Yes |
| 14 | `CR-recognize` | No | Table | Unnecessary | clinical reasoning | Yes (`mechanism-12`) | Table is better |
| 15 | `CR-diagnose` | **Yes** | `decision-algorithm` (+ compact overview variant) | Essential | overview (mini) + clinical reasoning | Yes ×3, mis-rendered | Yes — 3 → 1, restores the branch |
| 16 | `CR-etiology` | No | Table | Unnecessary | clinical reasoning | Yes (`mechanism-16`) | Table is better |
| 17 | `CR-acute` | **Yes** | `profile-matrix` + `decision-algorithm` | Essential | clinical reasoning | Yes ×3, mis-rendered | Yes — 3 → 2 |
| 18 | `CONF-bb-chronic-vs-acute` | Yes | `contrast-pair` | Useful | clinical reasoning | No | Yes |
| 19 | `CR-treat-hfref` | **Yes** | `causal-graph` fan-out, typed edges | Essential | clinical reasoning | Yes (`mechanism-19`) | Yes — **corrects a medical error** (parallel, not sequential) |
| 20 | `CR-treat-hfpef` | No | Short prose + table | Unnecessary | clinical reasoning | Yes (`mechanism-21`) | Table is better |
| 21 | `CONF-ccb-fe-source` | **No — deliberately** | Table with conflict marker | Unnecessary | clinical reasoning | No | A diagram would falsely resolve the conflict |
| 22 | `CR-followup` | Deferred | *(EXTENDED `timeline`)* | Useful | clinical reasoning | Yes (`mechanism-18`) | Yes — but not yet |

**Net: 61 legacy assets → 10 visual artifacts + ~6 tables/cards.**

---

# 10. Item 234 Overview redesign

## 10.1 What the Overview should cognitively do

Not summarise the chapter. **Give the learner a structure she can re-derive the chapter from.**

The current page (`projections/understanding/overview.md`, 8 numbered sections, 3 tables, ~60 lines) is a compressed textbook: faithful, well-traced, and requiring linear reading. Learner feedback that it is *"not limpide"* is the predictable result — a summary compresses *volume*; a mental model compresses *structure*. Only the second lets someone reconstruct.

## 10.2 Answers to the nine design questions

1. **Within ~30 seconds** — one sentence and one image: a damaged pump produces two consequences at once, and the body's compensation is what turns this into a chronic, decompensating disease. Everything else in the chapter hangs off that.
2. **After ~2–3 minutes** — she should be able to redraw the spine from memory, name the two congestion circuits and which side each belongs to, place the three phenotypes on an axis with their cut-offs, and state the diagnostic path in three moves.
3. **Above the fold** — the spine, and only the spine. This requires a landscape aspect ratio; the legacy `overview.svg` at 1200×1202 was structurally incapable of being above the fold.
4. **One dominant model or several?** **One dominant, three subordinate.** The dominant visual must be visually larger and typographically louder so the hierarchy is unmistakable. Several co-equal visuals would recreate the current problem in pictures.
5. **Which concepts merge?** Four merges — the mental model and the compensation loop merge into the spine (the loop *is* an edge, not a separate figure); the two congestion mechanisms and their confusion boundary merge into one dual-lane path; the phenotypes and their confusion boundary merge into one scale; the OAP threshold and its confusion boundary merge into one compact contrast.
6. **What stays as text or table?** The two definitional lines, the haemodynamic formulas as a single inline line, and one four-row treatment-logic table. That is all.
7. **What moves out?** To *Pourquoi ?*: remodeling detail, arrhythmia detail, the step-by-step OAP mechanism. To *Raisonnement clinique*: functional grading, trigger mnemonics, context-dependent drug rules, source conflicts, etiology enumeration, follow-up and monitoring. Roughly half the current page's prose leaves.
8. **Progressive disclosure** — three layers. Layer 1 is the spine alone, with each node anchored to the corresponding section of another projection. Layer 2 is the three compact visuals. Layer 3 is the residual text and single table. Disclosure should be *navigational* (the visual is the table of contents) rather than accordion-based, so nothing important hides behind an interaction.
9. **How many visuals?** **Four** — one dominant plus three compact. Fewer loses the phenotype partition and the left/right distinction, both pure-recall failure points. More recreates the wall-of-content problem in a new medium.

> This "1 dominant + up to ~3 compact" figure is an Item 234 **design hypothesis**, not a proposed universal EDN cap. See the contract.

## 10.3 Proposed page composition

```
┌──────────────────────────────────────────────────────────────┐
│  H1 + one orienting sentence                    (2 lines)    │
├──────────────────────────────────────────────────────────────┤
│  ▓▓ DOMINANT — causal-graph, landscape, <=7 nodes ▓▓         │
│     spine with one feedback edge and one fan-out             │
│     [nodes link into Pourquoi ? / Raisonnement clinique]     │
├──────────────────────────────────────────────────────────────┤
│  Definition lines + formulas inline             (3 lines)    │
├───────────────────────┬──────────────────────────────────────┤
│ threshold-scale       │ transmission-path (2 lanes)          │
│ phenotype bands       │ left circuit / right circuit         │
├───────────────────────┴──────────────────────────────────────┤
│ contrast-pair (compact)                                      │
├──────────────────────────────────────────────────────────────┤
│ Treatment logic — 4-row table                                │
└──────────────────────────────────────────────────────────────┘
```

The mini diagnostic algorithm is deliberately excluded from the first wave. Until `decision-algorithm` exists, that section stays as existing text; adding a fourth SVG primitive to serve one compact figure would delay the fix learners are actually waiting for.

## 10.4 Expected cognitive progression

| Time | What the learner gets | Surface |
|---|---|---|
| ~30 s | The spine | Dominant visual only |
| ~2–3 min | Spine + which circuit produces which signs + where the cut-offs fall + why the two edema mechanisms differ | Dominant + three compact visuals |
| Deeper | Causal detail, algorithms, drug rules, source conflicts | Follows a spine node link into another projection |

## 10.5 Constraints on the dominant visual

Maximum 7 nodes. Maximum 6 words per node. **Zero sentences.** Landscape aspect ratio. No embedded "À retenir" band — the takeaway belongs in the page's HTML, where it is selectable, translatable, and independently traceable. Every node carries its KP references and links to its element anchor.

---

# 11. Cross-specialty scalability stress test

Structural test only; no medical content invented.

| Case | Structure | CORE primitives that suffice | Composition | Gap exposed | Verdict |
|---|---|---|---|---|---|
| **A. Infectious disease** — pathogen → transmission → host response → manifestations | Propagation + cascade + phases | `transmission-path`, `causal-graph`, `decision-algorithm`, `contrast-pair` | Path feeds the entry node of the graph | **Incubation / phase timeline** | Mostly covered; timeline → EXTENDED #1 |
| **B. Neurology** — lesion location → pathway → deficit | Spatial route + spatial localisation | `transmission-path` (tract as lanes — its strongest cross-domain payoff), `causal-graph` | Path lanes annotated with lesion levels | **Spatial localisation on a body/brain map.** A path can state a relationship but cannot show *where* | Partly covered; `anatomical-schematic` → EXTENDED #2 |
| **C. Diagnostic reasoning** — symptom → red flags → tests → branches → diagnosis | Branching + cut-offs + competing hypotheses | `decision-algorithm`, `threshold-scale` (embedded at test nodes), `contrast-pair`, `profile-matrix` | Scale embeds in branch conditions | **None** | **Fully covered** |
| **D. Pharmacology** — drug → target → mechanism → desired + adverse effects | Cascade with divergent outcomes | `causal-graph` with typed fan-out | Single graph, two outcome groups | **Dose–response curve**; **entity-card** | Mostly covered; both EXTENDED |
| **E. Multi-system disease** — organ A ↔ organ B → systemic consequences | Bidirectional causation | `causal-graph` (bidirectional = two typed edges) | Single graph with a cycle | **None** | **Fully covered** |
| **F. Temporal course** — exposure → phases → complications → recovery/chronicity | Time as the primary axis | `causal-graph` can list phases but *asserts causation between them*, which is wrong — phases succeed each other in time, they do not cause each other | — | **Timeline.** Second independent exposure | **Not covered** |
| **G. Anatomical/spatial** — location → neighbours → lesion → signs | Adjacency in space | `transmission-path` handles routes but not adjacency | — | **Anatomical schematic.** Second independent exposure | **Not covered** |

## 11.1 Findings

The six CORE primitives fully cover cases C and E, and substantially cover A, B, and D. Two gaps are exposed by two independent cases each — **timeline** (A, F) and **anatomical-schematic** (B, G) — which is exactly the evidence pattern that should later trigger promotion.

The most important structural finding concerns anatomy. `anatomical-schematic` is *categorically different* from the other candidates: every other primitive can be rendered deterministically from a semantic specification, but anatomy requires curated base artwork per region. Keeping it out of CORE is a deliberate scope defence.

A useful negative result also emerged: case F shows that using `causal-graph` for temporal phases is not merely suboptimal but *semantically wrong*, because it asserts causation where only succession exists. That is the same class of error as legacy `mechanism-19`, confirming the timeline gap is real rather than cosmetic.

---

# 12. visualSpec / architecture recommendation

> Status note: the **need** for an explicit semantic intermediate is ratified in the contract. The **schema below is illustrative** and deliberately not frozen; it must be validated by a first vertical slice before becoming normative.

## 12.1 Recommended data flow

```
Official College source
   └─> inventory.yaml               [curated]     KPs + verbatim anchors
        └─> reconciliation          [AI + gate]
             └─> blueprint.md       [curated]     elements, steps, visual intent   <- WHETHER + WHICH
                  ├─> projections/*.md                      [generated]
                  └─> semantic visual specification         [generated, COMMITTED] <- WHAT
                       ├─> deterministic validation
                       ├─> grounding (each semantic unit = a claim block)
                       └─> deterministic renderer                                  <- HOW
                            ├─> SVG                          [generated, disposable]
                            └─> HTML components              [generated, disposable]
                                 └─> manifest -> renderer (by ID, never ordinal)
```

## 12.2 Should the specification be persisted, or in-memory only?

**Persist it, as a generated-but-committed artifact — the lockfile model.** Today it is in-memory (`buildVisualSpec` returns an object that is never written), and the costs are concrete:

- **Auditability.** A reviewer can read a specification and judge whether the medical relationships are right. Nobody can review an SVG path.
- **Grounding.** Node-level claims must be checkable *before* rendering. The implementation contract already defines "one diagram node" as a claim block, but with no persisted artifact there is nothing for the grounding pass to attach to.
- **Reproducibility and versioning.** A committed specification produces meaningful diffs — "the threshold node changed" rather than "1,400 SVG characters changed."
- **Regeneration.** A visual-system restyle regenerates rendered assets from unchanged specifications, with zero medical-content risk.
- **Testability.** Renderers can be tested against fixture specifications without the Blueprint.

**Challenging the recommendation.** Persisting the specification risks creating exactly the manual bottleneck the architecture is trying to avoid. Three mitigations make it acceptable: the specification is **generated, never hand-authored**; human overrides live in a separate small file diffed against the generated output so drift is visible; and regeneration is cheap and idempotent. If the team finds itself hand-editing specifications routinely, that is a signal the primitives are insufficient, and it should be measured rather than tolerated.

## 12.3 Where should visual intent live?

| Question | Owner | Status today |
|---|---|---|
| *Should this element have a visual, and which primitive?* | **Blueprint** — pedagogy, human-curatable, one line | Exists as `visual_plan`; 9 declared, 1 active |
| *What are the nodes, edges, thresholds, and their KPs?* | **Semantic specification** — generated, validated, committed | Missing |
| *Where does it appear, at what prominence?* | **Projection** | Exists as `visual_elements` in `projections.yaml` |
| *What are the coordinates?* | **Renderer**, exclusively | Currently leaks into `svg.js` as hard-coded arrays |

## 12.4 How much layout belongs in each layer?

**Blueprint: zero. Specification: zero coordinates. Renderer: all of it.**

The specification may express *semantic* ordering, grouping, lanes, and prominence — none of which are geometry. A useful bright-line test: **if a field's value is a number in pixels, it is a bug.** By that test the current `cardY = [160, 248, 376, 504]` is correctly *placed* (inside the renderer) but wrongly *shaped* — a fixed table that caps the primitive at four steps and forces one chapter's colour sequence onto every future diagram. Layout must be computed from content, including real text measurement, which is the missing capability behind every truncation defect in this audit.

## 12.5 How should traceability attach?

Uniformly, at the finest addressable unit, reusing the existing claim-block machinery rather than a parallel one:

| Element | Carries | Emitted as |
|---|---|---|
| Node | KP references, or an explicit scaffolding class | `data-node-id`, `data-kp` |
| Edge | KP references — an asserted causal link is itself a claim | `data-edge-id`, `data-kp` |
| Threshold | KP references **plus** a verbatim anchor quote | `data-kp`, `data-anchor` |
| Band / cell | KP references | `data-kp` |
| Annotation | KP references, or scaffolding class | `data-kp` / `data-class` |
| Alt text | Derived from the specification, never hand-written | `<desc>` |

Each becomes a claim block in `build/grounding.yaml`, so **visual claims pass through the same gate as prose claims**. This is the main reason the specification must be persisted.

## 12.6 How should visuals be validated?

1. **[D] Schema** — conforms to its primitive's contract; unknown fields rejected.
2. **[D] Referential** — every KP reference resolves; no orphan nodes; no dangling edges.
3. **[D] Threshold verbatim** — every numeric cut-off appears character-for-character in its anchor quote. *This check alone would have caught the legacy QRS inconsistency and the unanchored mortality figure.*
4. **[D] Structural budget** — node count within the primitive maximum; label length within measured width; cycle count within limit; DAG-ness where required.
5. **[D] Render** — well-formed XML, unique IDs, accessibility attributes present, **no text overflow** (measured, not guessed), and **byte-identical output on re-render**.
6. **[AI] Grounding** — each label is supported by its declared KPs, and nothing appears in the rendered visual that is absent from the specification.

## 12.7 How do we prevent visuals introducing unsupported medical claims?

- **The renderer must contain zero medical strings.** Today `svg.js` emits a literal disease-specific label and constructs a threshold sentence. Both are medical content authored by a build tool. Enforceable mechanically: lint renderer source for any learner-visible string not sourced from the specification.
- **Every visible token traces or is marked.** A label either carries KP references or is classed as scaffolding. There is no third state; the validator fails on absence.
- **Exact numbers are verbatim-checked** against anchor quotes.
- **The renderer must never truncate.** `shortLabel()` silently cuts at 48 characters, which can invert meaning by removing a qualifying clause. Overflow must fail validation or trigger deterministic layout adaptation, never silent semantic truncation.

## 12.8 How should visuals compose into projections?

| Projection | Composition rule |
|---|---|
| **Overview** | Visual-first. One dominant model, a small number of compact supporting visuals. Text is subordinate to and explanatory of the visuals |
| **Pourquoi ?** | Selective causal visuals only — loops and paths where the relationship is the lesson. Explicitly *not* one visual per section |
| **Raisonnement clinique** | Algorithms and decision structures — one algorithm per genuine decision point, plus matrices and contrast pairs |
| **Histoire** | Narrative. At most one non-medical scaffolding illustration, excluded from grounding, never adjacent to sourced claims |

Two rules apply across all four: a visual may serve several Blueprint elements, and a projection-level budget is the most effective structural defence against one-visual-per-section proliferation.

## 12.9 Direct from Blueprint, or via an explicit specification?

**Via the specification — and the current code is the evidence, not merely an argument.** Without an intermediate, the renderer receives prose strings and must infer semantics; unable to, it hard-codes. A second chapter using the existing intent today would inherit one disease's colours, one disease's four-step cap, and one disease's threshold sentence.

The honest counter-argument is that an extra artifact adds pipeline surface and another thing to keep in sync. That cost is real but bounded: the specification is generated in the same pass as projections, validated by the same gates, and never hand-maintained.

## 12.10 How do we avoid a per-chapter custom-authoring bottleneck?

- **Coverage target:** CORE primitives should serve the large majority of declared visual intents. Measure and report this per chapter.
- **Human input is one line per element** — the intent value. Everything downstream is generated.
- **A quarantined escape hatch.** A chapter may declare a bespoke visual, but such visuals are counted, listed in the manifest, and excluded from the reuse metric. Repeated use within one chapter is a signal to add a primitive, not to keep authoring one-offs. Without this valve, teams either distort content to fit the grammar or silently fork the renderer.
- **Restyling never touches content.** A design-token change regenerates all rendered assets from unchanged specifications.

## 12.11 What should be deterministic versus AI-generated?

| Stage | Mode |
|---|---|
| Choosing the primitive / intent | AI proposes, human may override |
| Extracting nodes and edges from Blueprint steps | AI — the genuinely hard part |
| Assigning KP references | AI, deterministically verified |
| Threshold extraction | AI proposes, deterministic verbatim verification |
| Alt text | Derived from the specification, never free-written |
| Layout, sizing, text measurement, colour, ordering | **Deterministic — no AI at render time, ever** |
| SVG / HTML emission | Deterministic, byte-reproducible |
| Validation | Deterministic, except grounding, which is AI |

## 12.12 Illustrative specification shape (NOT frozen)

```yaml
primitive: causal-graph          # discriminator — enables open extension
element: <BLUEPRINT-ELEMENT-ID>
question: "<the learner question this answers>"
semantic_role: chapter-spine
nodes:
  - { id: n1, kind: cause,  label: "...", kp: [KP-0xx] }
  - { id: n2, kind: state,  label: "...", kp: [KP-0xx] }
  - { id: n3, kind: state,  label: "...", kp: [KP-0xx], emphasis: pivot }
edges:
  - { from: n1, to: n2, kind: causes,     kp: [KP-0xx] }
  - { from: n3, to: n2, kind: feeds_back, label: "...", kp: [KP-0xx] }
budget: { max_nodes: 7, max_label_words: 6 }
traceability: { all_nodes_traced: true, scaffolding_nodes: [] }
```

Mandatory across every primitive: primitive discriminator, element reference, learner question, and per-unit KP references or an explicit scaffolding class. Never permitted: any coordinate, dimension, colour, or font. Renderer-determined: all geometry, styling, text fitting, and arrow routing.

---

# 13. Legacy migration matrix

Classification only. This audit moved and modified nothing.

| Recommendation | Count | Files |
|---|---|---|
| **KEEP AS REFERENCE** | 1 | `overview.svg` |
| **MERGE** | 11 | `mechanism-03, 04, 05, 06` → one compensation cycle · `mechanism-09` → into remodeling · `mechanism-13, 14, 15` → one diagnostic algorithm · `mechanism-22, 23` → one acute algorithm · plus the spine content of `overview.svg`, regenerated |
| **SUBSUME** | 5 | `mechanism-08` (→ `threshold-scale`) · `mechanism-10` (→ `causal-graph` fan-out) · `mechanism-11` (→ `causal-graph` + threshold) · `mechanism-17` (→ `profile-matrix`) · `mechanism-19` (→ `causal-graph` fan-out, correcting the sequence error) |
| **RENDER AS HTML** | 42 | `actor-01` … `actor-36` (36) · `mechanism-02` (formula card) · `mechanism-12` (findings table) · `mechanism-16` (etiology table) · `mechanism-20` (criteria table) · `mechanism-21` (management table) · `mechanism-24` (checklist) |
| **DROP** | 1 | `mechanism-01` — a definition restated as boxes; zero relationships |
| **SPECIAL CASE** | 2 | `mechanism-07` → reveals `anatomical-schematic` · `mechanism-18` → reveals `timeline` |
| **Total** | **61** | ✓ |

`overview.svg` is marked KEEP AS REFERENCE rather than MERGE because its spine is genuinely close to the correct chapter model and should inform the new dominant visual — but it must be regenerated from grammar, not migrated. Both SPECIAL CASE files point at EXTENDED primitives rather than CORE gaps, which is the desired outcome: the escape hatch points at real future work rather than at an oversight.

**Traceability caveat.** No legacy SVG's medical content may be carried forward as authoritative. Three measured discrepancies against the canonical model show the corpus drifted from the source. Every regenerated visual must be re-derived from Inventory KPs.

---

# 14. Proposed implementation waves

> Status note: wave *contents* are ratified only as an implementation hypothesis. Wave 0 is the prerequisite; wave boundaries may change after the first vertical slice.

## Wave 0 — the enabling change (prerequisite, no new primitives)

Introduce the persisted semantic specification, its deterministic validators, and node-level grounding integration. Refactor the existing single supported intent to run through it, producing an equivalent rendered asset while removing the hard-coded medical string, the fixed four-step coordinate table, and silent truncation.

*Why first:* every subsequent wave depends on it, and it converts a live medical-content defect into a validated path. Doing any renderer before this guarantees the hard-coding recurs.

## Wave 1 — make the Overview genuinely visual-first

`causal-graph` · `threshold-scale` · `transmission-path` · `contrast-pair`

*Why these four:* they produce exactly the four Overview artifacts identified in Section 10, and nothing else. `causal-graph` subsumes the largest share of the legacy corpus and serves the most Blueprint elements, giving the best evidence-to-effort ratio. `contrast-pair` is nearly free because the `CONF-*` elements already supply their two poles. `threshold-scale` establishes the verbatim-anchor discipline for numeric claims, the highest-risk content class.

*Deliberately excluded:* the mini diagnostic algorithm.

## Wave 2 — Pourquoi ? and Raisonnement clinique

`decision-algorithm` · `profile-matrix`

*Why second:* both serve the clinical-reasoning projection, which currently contains a hand-drawn ASCII triage proving the demand. `decision-algorithm` also corrects the corpus's worst grammar error and subsumes six legacy files. Neither is needed for the Overview.

## Wave 3 — high-confidence cross-EDN extensions only

Promote `timeline` first. Then reassess, using real second-chapter evidence, whether `transmission-path` and `causal-graph` should merge, and whether `entity-card` has acquired a Blueprint consumer.

*Why last:* every wave-3 item is justified by anticipated rather than demonstrated need. `anatomical-schematic` does not enter wave 3 until base-artwork sourcing is answered separately.

---

# 15. Risks and anti-patterns

## 15.1 Realised in the legacy corpus

| Risk | Evidence | Mitigation |
|---|---|---|
| One SVG per section | 24 mechanism SVGs for 8 Blueprint mechanisms | Per-projection visual budgets enforced at packaging |
| Atomisation | Four SVGs for one Blueprint element | Visuals bind to Blueprint elements, never to prose headings |
| Actor-card proliferation | 36 relationship-free text cards | `entity-card` is HTML and deferred; SVG requires a demonstrated spatial or relational payload |
| Prose embedded in SVG | 30 files truncate mid-sentence; every actor duplicates its own text | Label budgets in the specification; overflow **fails validation** |
| Diagrams that restate text | `mechanism-01, 12, 24` | The no-arrow/no-axis/no-adjacency rule |
| Semantically wrong grammar | `mechanism-19` teaches a nonexistent sequence; `mechanism-14` erases a branch | Primitive choice is a reviewable Blueprint field; edges are typed |
| Untraceable visual claims | Three measured discrepancies against the canonical model | Per-unit KP references plus verbatim threshold checking |
| Orphaned assets | 61 of 61 unreferenced | Manifest-driven, ID-based binding; packaging fails on unreferenced generated visuals |

## 15.2 Live in the current pipeline

| Risk | Evidence | Mitigation |
|---|---|---|
| The renderer authors medical content | Disease-specific label and threshold sentence emitted from `svg.js` | Zero medical strings in renderer source; lint it |
| Chapter-specific renderer with a generic name | Fixed coordinate/colour tables; four-step cap | Content-driven layout; fixture-test every primitive against two unrelated chapters before declaring it generic |
| Truncation reimplemented | `shortLabel()` cuts at 48 chars, visible in the current output | Real text measurement; overflow fails the build |
| Build strings shown to learners | A build-process sentence rendered as the takeaway | All learner-visible text originates in the specification |
| Declared-but-unbuilt intents | 9 intents declared, 1 supported | Surface declared-vs-supported coverage explicitly at packaging |

## 15.3 Risks of the proposed direction

| Risk | Why plausible | Mitigation |
|---|---|---|
| The specification becomes a manual bottleneck | The failure mode most likely to kill this design | Generated, never hand-authored; overrides isolated and diffed; hand-edit frequency measured as a health metric |
| Primitive proliferation | Every awkward case will feel like a new primitive | Evolution rule plus a counted escape hatch |
| Primitives that are really styles | The merge/split boundary is genuinely hard | Test: different learner question **and** different data contract. `feedback-loop` failed this test and was merged |
| Over-engineering speculative EDN needs | Ten EXTENDED candidates are easy to justify on paper | None built until a real chapter demands it; promotion triggers named in advance |
| Overfitting to cardiology | Item 234 is the only evidence base | Two of six CORE primitives were derived from cross-EDN reasoning; every primitive must pass at least two stress cases |
| Excessive determinism removing pedagogical flexibility | A rigid grammar can block a genuinely better bespoke visual | The escape hatch exists precisely for this and is deliberately not forbidden — only counted |
| Forcing all knowledge into diagrams | 42 of 61 legacy files show how strong this pull is | HTML, tables, and text are first-class outcomes, not fallbacks |
| Visual overload | Solving "too much text" with "too many pictures" | Per-projection composition discipline |
| Layout instability across regenerations | Auto-layout can reorder nodes and produce noisy diffs | Deterministic layout must be byte-reproducible, asserted in tests |
| Restyling silently changing medical content | Token changes touching content | A token change must produce zero specification diffs |

## 15.4 Additional risks identified

- **Silent semantic drift when the grammar is too small.** If no primitive fits, authors will pick the closest one and the visual will teach a wrong relationship — exactly how `mechanism-19` arrived. Mitigation: intent mismatch must be reviewable, and the escape hatch must always be available so "closest fit" is never the only option.
- **Accessibility regressions from SVG-first thinking.** The 42 HTML migrations are also accessibility wins. Future pressure to "make it a diagram" should be weighed against that.
- **Grounding cost scaling with node count.** Each node becomes a claim block, so node budgets are a cost control as well as a pedagogical one.
- **`anatomical-schematic` smuggling an unbounded art commitment into the grammar.** It looks like a primitive and behaves like an asset pipeline.

---

# 16. GO / NO-GO conclusions

## Verdict: GO — conditionally scoped

**GO** on the persisted semantic specification, its validators, and a first subset of primitives. The evidence is strong on all three axes: the legacy corpus demonstrates what fails and why, the canonical Blueprint demonstrates six specific grammars it needs, and the learner problem — an Overview that cannot be mentally reconstructed — is concrete and directly addressed.

**NO-GO** on building all six primitives at once, on any EXTENDED primitive, and on `anatomical-schematic` in any form until base-artwork sourcing is resolved separately.

**NO-GO** on migrating any legacy SVG. All 61 are unreferenced and three carry measured medical drift from the canonical Inventory. Regenerate; do not migrate.

## Proposed first implementation task (not executed; not yet ratified as a work order)

Define the semantic specification for the `causal-graph` primitive and produce the validated specification for the chapter mental-model element, **with no renderer changes**.

Deliverables would be: the schema with a primitive discriminator and the full `causal-graph` contract, explicitly forbidding every coordinate, dimension, colour, and font field; one authored specification for the chapter spine within the node and label budgets; a deterministic validator implementing schema, referential, and structural-budget checks; and a note specifying how each semantic unit enters `build/grounding.yaml` as a claim block, reusing the existing mechanism.

Acceptance would be: the validator passes; every node and edge resolves to a real KP; the specification contains zero geometry; and a reviewer can judge the medical correctness of the chapter's central mental model by reading the specification alone, without rendering anything.

*Why this and not a renderer:* it forces the semantic contract to be settled before any layout code exists, which is the single decision that prevents a second chapter-hardcoded renderer. It also puts the chapter's most important visual under review as *data* before a single pixel is committed to it.

---

# 17. Provenance

- Audit performed 2026-07-24, read-only.
- Evidence base: 61 legacy SVGs parsed programmatically; `blueprint.md` (22 elements); `inventory.yaml`; the four published understanding projections; `projections.yaml`; `tools/lou-build/lib/svg.js` and `package.js`; `01-learning/templates/svg/svg-patterns.md`; the legacy `svg-generation-review.md`; and the five root architecture documents.
- No file was created or modified during the audit itself.
- Normative outcome: `VISUAL_GRAMMAR_CONTRACT.md` (repository root).
