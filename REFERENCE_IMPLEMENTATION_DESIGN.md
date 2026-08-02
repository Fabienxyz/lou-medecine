# Reference Implementation Design — Item 234

> Turns the **frozen** architecture (`ARCHITECTURE_AUDIT.md` → `FINAL_ARCHITECTURE.md` → `IMPLEMENTATION_CONTRACT.md`) into a concrete, testable implementation design, using **Item 234 — Insuffisance cardiaque** (`cardio/234`) as the canonical reference chapter.
>
> This document is **design only**. It writes no application code, performs no migration, modifies no existing repository file, and does not re-open the architecture. Where it and the frozen documents ever conflict, the frozen documents govern. Every Item 234 *medical fact* below is drawn from files already in the repository (`coverage.md`, `mecanismes.md`, `official-college.md`, etc.); none is invented. Illustrative structural values (KP ID numbers, and anchor `quote` strings other than those cited verbatim from the source) are placeholders showing the shape of the format, not final data.
>
> Inherited priority order (earlier wins): **1. fidelity to the College source → 2. understanding before memorisation → 3. no dependency on an expert medical reviewer → 4. manageable cognitive load → 5. exhaustive detail preserved for mastery → 6. safe edition updates → 7. reproducibility/traceability → 8. simplicity across 350+ chapters.**

---

## 1. Implementation Design Principles

These principles constrain every decision that follows. They are consequences of the contract, restated as build rules.

1. **Two canonical curated structures, everything else generated or immutable.** The Knowledge Inventory and the Chapter Blueprint are the two *canonical curated structures* of a chapter. "Curated" here means **canonical and maintained within the pipeline** — they may be AI-generated and AI-maintained, and are only *optionally* human-refined; **no human is required to certify medical correctness** (contract A.1). Source is immutable; projections, visuals, reconciliation reports, checks, and the manifest are all disposable/regenerable outputs. The load-bearing boundary is **canonical (source / Inventory / Blueprint) vs disposable generated (projections and everything downstream)** — not a claim that only two files can ever be edited (an explicit projection override may exist when needed, §2).
2. **Prose is never the source of structure.** Machine-traversable relationships (IDs, anchors, sequence, dependency edges, mechanism step graphs, references) live in structured fields. Explanatory wording lives in prose. A diagram, a QCM, and a flashcard about the same fact all read the *same* structured Blueprint element, never each other's Markdown.
3. **Identity is durable and opaque; order is data.** Knowledge-point IDs are opaque and permanent; teaching order lives in the Blueprint, never in the IDs. Re-sequencing a chapter changes no ID.
4. **Correctness ≡ traceability to source.** No component asserts medical truth. Every learner-facing claim block resolves, by stored reference, to `source anchor ← knowledge point ← Blueprint element (where applicable) ← claim block`.
5. **Generation and checking are different processes.** A generator may never certify its own output (the exact failure the audit found: `✅ 100%` / "consistent with the storyboard" on assets with no storyboard). Checking is a separate pass with authority to fail the build.
6. **Deterministic checks and AI-semantic checks are separated and labelled.** Anything a script can verify (references resolve, IDs unique, dispositions present) is deterministic and gates hard. Anything requiring judgement (grounding, reconciliation) is an AI pass whose *uncertainty* is a first-class output.
7. **Conservative by default.** When a statement cannot be supported, prefer omission → explicit pedagogical framing → quoting the source. Never manufacture certainty.
8. **Files in Git, no database, stable diffs.** One chapter is one directory of small text files. Formats are chosen so a one-line medical change is a one-line diff.
9. **Formats are reversible; the relationships are not.** Per contract §12, serialization is free to change. What is contractual is *which* relationships exist and are machine-traversable.

---

## 2. Target Artifact Set

The smallest artifact set for one production chapter. Proposed target directory (layout is reversible; §14 maps the current repository onto it):

```
content/cardio/234/
├── source/
│   ├── official-college.md          # verbatim College text (as-is)
│   └── source.meta.yaml             # edition + coarse section index (sidecar, does not touch text)
├── inventory.yaml                   # Knowledge Inventory (canonical curated structure #1)
├── blueprint.md                     # Chapter Blueprint (canonical curated structure #2): frontmatter graph + prose
├── projections/
│   └── understanding/
│       ├── overview.md              # only the projection types the chapter needs exist
│       ├── mechanisms.md            # per-element sections keyed by Blueprint ID
│       └── …                        # story / clinical-reasoning / actors / readiness — optional (§8)
├── figures/
│   └── mec-oap.svg, mec-congestion.svg, cr-algo-dg.svg …   # named by Blueprint element ID
├── build/                           # all generated, never hand-edited
│   ├── reconciliation.yaml          # independent coverage reconciliation report
│   ├── grounding.yaml               # projection grounding/consistency results
│   ├── traceability.json            # chapter-level trust/trace index (claim block → element → KP → anchor),
│   │                                #   loaded on demand — ONE candidate representation; see §10 (slice decides)
│   └── coherence.yaml               # (edition updates only) final chapter-level coherence result
├── overrides.yaml                   # optional, rare, explicit projection fix directives
└── manifest.json                    # Chapter Package (GENERATED); renderer entry point
```

| Artifact | Purpose | Source / Curated / Generated | Human-editable? | Generated by | Consumed by | Versioned or regenerated |
|---|---|---|---|---|---|---|
| `source/official-college.md` | Sole medical authority, verbatim | Source (immutable) | No (transcription fixes only) | Ingestion | Inventory extraction, reconciliation | Versioned by **edition** |
| `source/source.meta.yaml` | Edition tag + section-path index for anchors | Source-adjacent | No (regenerated from source) | Ingestion | Anchor resolver, manifest | Regenerated per edition |
| `inventory.yaml` | Exhaustive, anchored proof of completeness; mastery/SR target granularity | **Canonical curated #1** | Optional refinement | AI-generated/maintained; optionally human-refined | Blueprint, reconciliation, mastery, manifest badges | **Versioned** (content revision + per-KP edition history) |
| `blueprint.md` | The one structured intermediate: pedagogy + structured understanding | **Canonical curated #2** | Optional refinement | AI-generated/maintained; optionally human-refined | Every projection, visuals, manifest navigation | **Versioned** (content revision) |
| `projections/understanding/*.md` | Learner-facing comprehension content | Generated (disposable) | No (change via curated layer / override) | Projection generators from Blueprint | Manifest, renderer | Regenerated; carries provenance |
| `build/reconciliation.yaml` | Section-by-section source↔Inventory dispositions | Generated | No | Reconciliation pass | Package validation, manifest status | Regenerated on Inventory/source change |
| `build/grounding.yaml` | Grounding/consistency verdicts per claim block | Generated | No | Grounding checker | Package validation, manifest status | Regenerated on projection change |
| `build/traceability.json` | Chapter-level trust/trace index: claim block → Blueprint element → KP → anchor, loaded on demand. **Representation reversible** — the slice may instead keep this adjacent to projections (§10) | Generated | No | Package assembler | Renderer "where from?", package validation | Regenerated on any build |
| `build/coherence.yaml` | Whole-chapter coherence verdict after an edition update | Generated | No | Coherence check | Package validation, manifest status | Regenerated per edition update |
| `figures/*.svg` | Diagrams generated from Blueprint step graphs | Generated (disposable) | No | SVG generator from Blueprint + visual system | Manifest, renderer | Regenerated; carries its own provenance |
| `overrides.yaml` | Rare explicit projection fixes | Curated (opt-in) | Yes (rare) | Human | Projection generators | Versioned (usually absent) |
| `manifest.json` | Renderer discovery/assembly contract (not a medical-truth or provenance store, §11) | Generated | No | Package assembler | Renderer | Regenerated on any build |

**Deliberately absent** (and why): no separate storyboard file (merged into `blueprint.md`); no separate coverage checklist (promoted into `inventory.yaml` + `reconciliation.yaml`); no `coverage-v0.md` (superseded); no per-mechanism/per-actor Markdown files (one file with keyed sections diffs better); no global ontology; no per-sentence ID files; **no mandated per-projection trace sidecar** (claim-block traceability representation is deliberately left open for the slice, §10); and **no learner artifacts** — Personal Diagrams and Inline Notes (contract C.8/C.9) are learner-owned, live outside `content/`, and are never stored in Git alongside medical content. Personal Diagrams are binary; keeping them out preserves the "files in Git, stable diffs" principle (§1.8) and keeps personal data out of the medical repository. The storage mechanism is reversible; the boundary is not.

---

## 3. File / Serialization Decisions

For each artifact, the chosen representation and the reason, optimising for human readability, AI editability, machine validation, stable Git diffs, simplicity, low maintenance.

| Artifact | Representation | Why this and not the alternatives |
|---|---|---|
| Official source | **Markdown, as-is** | It is verbatim text; nothing should reformat it. Line numbers are volatile, so nothing depends on them (anchors use quotes). |
| `source.meta.yaml` | **YAML sidecar** | A tiny structured record (`edition`, publisher, date, ordered section index). Kept *out* of the source file so the verbatim text is never edited to carry metadata. |
| Knowledge Inventory | **YAML** (`inventory.yaml`), one list, one compact mapping per KP | Needs nested structure (multiple anchors, edition history, lineage) that a Markdown table (today's `coverage.md`) cannot hold cleanly. YAML gives machine validation and line-oriented diffs; the KP `label` stays prose. Chosen over JSON for human editability (comments, no brace noise); over Markdown because the current `coverage.md` table already proved unable to record anchors/dispositions (its `Destination` column stayed empty). Kept compact per contract ("avoid making each KP a large object"). |
| Chapter Blueprint | **Markdown + YAML frontmatter (hybrid)** | The one artifact that must be simultaneously AI-editable, machine-traversable, *and* pedagogically compressed. Frontmatter holds the graph the machine traverses (element registry, IDs, ordered sequence, and — **only where a downstream consumer needs them** — dependency edges, step graphs, KP refs, visual intent; §6). The Markdown body holds the prose only a human reads (mental-model narrative, confusion-point notes, analogy notes), keyed by the same element IDs. This is the deliberate "structured document, not a database" of `FINAL_ARCHITECTURE.md` §7 — kept **sparse**, not a rich universal schema. |
| Understanding projections | **Markdown + minimal YAML frontmatter** | The learner-facing body must be clean Markdown (the renderer already runs `marked`). Frontmatter carries only `type`, projected element IDs, and provenance. Chosen over embedding heavy metadata inline (the audit's "scaffolding leaks into learner output" problem). |
| Claim-block trace | **Reversible for the slice (§10)** — either lightweight metadata adjacent to claim blocks, or one generated chapter-level index (`build/traceability.json`) | What is fixed is the *relationship* `claim block → Blueprint element (where applicable) → KP → anchor`, **not** its file layout. The slice compares the two options and picks the simpler reliable one; the design does **not** pre-commit to a per-projection sidecar (avoids prose↔metadata sync risk and artifact proliferation). |
| Figures | **SVG files**, named by Blueprint element ID | SVG is already the working format and is self-contained/accessible. Naming by ID (not ordinal) kills the positional-fragility class of bugs the audit found. |
| Reconciliation / grounding / coherence | **YAML** under `build/` | Generated reports; YAML so a human can *read* a flagged exception without tooling, and a script can gate on it. |
| Manifest | **JSON** (`manifest.json`) | Machine-consumed by the renderer, which already expects `manifest.json` (`demo/renderer/config.js` `MANIFEST_FILENAME`). JSON over YAML here because it is the renderer's native parse and is never hand-edited. |

No database is introduced; every artifact is a file in Git.

---

## 4. Knowledge Inventory Design

The Inventory is the exhaustive, anchored proof of completeness. Item 234's current `coverage.md` already lists ~88 knowledge units (13 major sections + the unit rows); those become the seed KPs. The new format adds IDs, anchors, rank, disposition, and edition history to each.

**Minimum per-KP structure** (compact — no KP is a large object):

```yaml
# inventory.yaml  (excerpt — labels are real coverage.md units; IDs illustrative;
#                  KP-041's quote is verbatim from the source, other quotes are illustrative placeholders)
chapter: cardio/234
revision: r1                      # content revision of this curated artifact
kps:
  - id: KP-007
    label: "Formules hémodynamiques : DC = VES × FC ; VES = VTD − VTS ; FE = VES/VTD"
    rank: A
    anchors:
      - { section_path: "I. Généralités > Physiopathologie > fonction pompe",
          quote: "Le débit cardiaque (DC) est le produit du volume d'éjection systolique (VES) par la fréquence cardiaque" }
    disposition: understanding

  - id: KP-041
    label: "Seuil PPC > 25 mmHg → transsudat → OAP cardiogénique ; opposé à l'OAP lésionnel (exsudat)"
    rank: A
    anchors:
      - { section_path: "I. Généralités > Physiopathologie > conséquences du dysfonctionnement",
          quote: "pression capillaire pulmonaire au-delà d'un certain seuil (en général au moins > 25 mmHg)" }
    disposition: understanding

  - id: KP-052
    label: "Peptides natriurétiques : seuils de rule-out non aigu BNP < 35, NT-proBNP < 125 pg/mL"
    rank: A
    anchors:
      - { section_path: "II. Diagnostic > Examens complémentaires > peptides natriurétiques",
          quote: "NT-proBNP < 125 pg/mL" }
    disposition: deferred-to-mastery      # exact threshold: mastery; the *role* of BNP is understanding (KP-051)

  - id: KP-061
    label: "Médicaments contre-indiqués dans l'IC systolique : vérapamil, diltiazem, flécaïnide, AINS"
    rank: A
    anchors:
      - { section_path: "VI. Traitement de l'IC chronique > médicaments contre-indiqués",
          quote: "diltiazem et vérapamil (contre-indiqués dans l'insuffisance cardiaque systolique)" }
    disposition: understanding

  - id: KP-072
    label: "CHAMPIT : causes traitables d'IC aiguë (Coronaire, HTA, Arythmie, Mécanique, EP, Infection, Tamponnade)"
    rank: B
    anchors:
      - { section_path: "VII. Traitement de l'IC aiguë > facteurs déclenchants",
          quote: "CHAMPIT" }
    disposition: understanding

  - id: KP-085
    label: "Transplantation cardiaque : CI dont HTAP fixée avec RAP > 5 unités Wood"
    rank: B
    anchors:
      - { section_path: "VI. Traitement de l'IC chronique > transplantation",
          quote: "résistances pulmonaires > 5 unités Wood" }
    disposition: deferred-to-mastery

  - id: KP-090
    label: "Épreuve d'effort avec VO2 : capacité fonctionnelle, pronostic, indication de greffe"
    rank: B
    anchors:
      - { section_path: "II. Diagnostic > examens spécialisés > épreuve d'effort",
          quote: "pic de VO2" }
    disposition: deferred-to-mastery

  - id: KP-093
    label: "Régime hyposodé 5–6 g/j ; pesée quotidienne ; alerte si +2–3 kg en 2–3 jours"
    rank: A
    anchors:
      - { section_path: "VI. Traitement de l'IC chronique > mesures hygiénodiététiques",
          quote: "régime pauvre en sel" }
    disposition: understanding
```

These eight are real Item 234 content: KP-007 is `coverage.md` line 96 ("Formules hémodynamiques…"); KP-041 is `coverage.md` line 98 and the `mecanismes.md` §11 threshold; KP-052/KP-051 come from `coverage.md` line 121 and `mecanismes.md` §13; KP-061 from `coverage.md` line 160; KP-072 from `coverage.md` line 173; KP-085 from `coverage.md` line 164; KP-090 from `coverage.md` line 127; KP-093 from `coverage.md` line 150.

**Only the fields that earn their place.** No per-KP prose explanation (that is the Blueprint/projection job). `reconciliation` and `verification` state are **not** stored on the KP — they live in `build/reconciliation.yaml` keyed by KP ID, so re-running the check never dirties the curated file.

**Edition history** is added to a KP only once a second edition exists (keeps r1 clean):

```yaml
    editions:
      - { edition: 2024-SFC, change: new }
      - { edition: 2027-SFC, change: modified, confidence: high, note: "threshold value revised" }
```

### ID allocation rules

- **Form:** `cardio/234#KP-nnn`; within the file the local `KP-nnn` suffices.
- **Opaque, not semantic.** The numeric suffix carries no meaning; meaning lives in `label`. KPs are numerous and churn during extraction, so a semantic ID would constantly want renaming — opacity prevents that.
- **Minted once, at creation.** Allocate the next unused integer. **Gaps are allowed and expected** (a retired KP leaves a hole). IDs are **never reused, never renumbered, never positional.**
- **Ordering independence.** The Inventory list may be reordered freely (e.g. to group by section) with zero identity impact, because order is not encoded in the ID and teaching order lives only in the Blueprint sequence.
- **Split/merge lineage** is recorded on the KP, never by editing an old ID:

```yaml
  - id: KP-104            # a 2027 split child
    label: "NT-proBNP rule-out threshold, age < 75"
    lineage: { from: [KP-052], kind: split }
  # KP-052 is retired, not deleted:
  - id: KP-052
    retired_as_of: 2027-SFC
    lineage: { into: [KP-104, KP-105], kind: split }
```

- **Never manually renumber** anything. The only human edits are to `label`, `rank`, `anchors`, `disposition`, and (rarely) confirming a machine-proposed `lineage`. A deterministic check fails the build on any duplicate or reused ID.

---

## 5. Source Anchor Design

An anchor answers "where in the College does this come from?" and must survive line renumbering, Markdown reformatting, and minor source movement.

**Concrete representation** (the contract's `{edition, section_path, quote}` made minimal):

```yaml
{ edition: 2024-SFC,
  section_path: "I. Généralités > Physiopathologie > conséquences du dysfonctionnement",
  quote: "pression capillaire pulmonaire au-delà d'un certain seuil (en général au moins > 25 mmHg)",
  line_hint: 265 }          # optional convenience only; never the identity
```

- **`edition`** — matches `source.meta.yaml`; two editions of the same fact are two anchors.
- **`section_path`** — a coarse `>`-joined path built from the source's own structure. Item 234's top level is fixed and stable: `I. Généralités`, `II. Diagnostic`, `III. Diagnostic étiologique`, `IV. Formes cliniques`, `V. Évolution, complications, pronostic`, `VI. Traitement de l'IC chronique`, `VII. Traitement de l'IC aiguë`, plus `Situations de départ`, `Hiérarchisation des connaissances`, `Points-clés`. These headings are the durable coordinates.
- **`quote`** — a verbatim phrase long enough to relocate the fact within its edition. The anchor is an **edition-specific evidence pointer**: `{edition, section_path, quote}` together locate the fact *in that edition*. The quote is **not** a cross-edition identity — **semantic continuity across College editions belongs to the KP identity and the edition-reconciliation process (§13), never to an unchanged quote.** A reworded 2027 edition can carry a different quote for the same durable KP.
- **`line_hint`** — an integer, **convenience metadata only**, refreshed automatically, never compared for identity.

**How an anchor is created.** During extraction the AI copies a verbatim phrase from the segment it is capturing and records the enclosing section path; a script fills `line_hint` by locating the quote.

**How an anchor is resolved (currently declared edition).** The resolver searches `official-college.md` for `quote` within the subtree named by `section_path`. Exactly one hit → resolved; `line_hint` refreshed. **For the currently declared source edition, every anchor must resolve reliably** — this is a hard build gate. Used by the "where does this come from?" feature and by the grounding checker.

**Refresh after a new edition.** Re-run resolution against the new source. If the quote still occurs once under a matching/renamed section path → anchor auto-refreshed (the `moved/reformatted`, high-confidence path of A.2). **Failure of an old edition's quote to resolve against a *new* edition is NOT a build error**; it triggers semantic reconciliation / anchor refresh / broader re-analysis (§13), and the KP is carried forward by its identity, its anchor updated to the new edition's evidence. The old quote is never treated as the KP's identity.

**If the evidence text occurs multiple times.** Resolution is *not* silently first-match. The pipeline: (a) narrows by `section_path` — usually reduces to one; (b) if still ambiguous, the anchor is rejected at creation and the extractor must **lengthen the quote** until it is unique within its section; (c) a genuinely repeated phrase records an `occurrence` ordinal as a last resort. A deterministic check fails the build on any anchor that resolves to zero or (unqualified) multiple locations **in the currently declared edition**; resolution failures against a *newer* edition are reconciliation triggers, not build errors.

**Line numbers** are stored only as convenience. The contract's Part E example already treats lines 265–267 as a pointer while the quote carries identity; e.g. `mecanismes.md` §11 restates exactly this fact:

```144:148:01-learning/generated-assets/cardio/234-insuffisance-cardiaque/mecanismes.md
## 11. Comment la congestion pulmonaire mène-t-elle à l'OAP ?

**Question :** Pourquoi le patient « s'étouffe » avec un cœur malade ?

Augmentation de la pression télédiastolique du VG → transmission aux veines et capillaires pulmonaires. Au-delà d'un seuil (souvent **PPC > 25 mmHg**), passage d'un **transsudat** dans les alvéoles → **œdème aigu pulmonaire cardiogénique**.
```

---

## 6. Chapter Blueprint Design

One `blueprint.md` per chapter: **YAML frontmatter** for everything a machine traverses, **Markdown body** for prose only a human reads.

**Every structure below is OPTIONAL and appears only where a concrete downstream consumer requires it.** The Blueprint is a *cognitively compressed* intermediate, not a miniature ontology: the default is the **smallest structured representation** the consumers actually need. A chapter with only linear mechanisms carries no `causal_links`; a chapter that never reuses an actor identity carries no `actors` registry; explicit `dependencies` appear only where sequence/adaptivity/update analysis needs an edge that cannot be trivially inferred from `sequence`. Do **not** impose a rich universal schema on every chapter or every element.

**Minimum viable Blueprint** = `mental_model` + `sequence` + one or more `mechanisms` (each: `id`, `question`, ordered `steps`, `uses_kp`). Everything in the table below is added only on demand.

| Section | Location | Include only when a downstream consumer needs it |
|---|---|---|
| Mental model *(core)* | body prose + `mental_model:` (`id` + `question`) | `overview` projection root; renderer "big picture first". Projected as a pedagogical block like any other element, so it carries a learner-facing `question` — the single canonical origin of that question, from which a visualSpec's `question` is derived |
| Learning sequence *(core)* | frontmatter `sequence:` (ordered element IDs) | manifest reading order; renderer navigation; adaptivity gating |
| Mechanisms *(core)* | frontmatter `mechanisms:` (id, question, ordered `steps`, `uses_kp`) | `mechanisms` projection **and** SVG generator (reads the step graph, not prose) |
| `causal_links` on a mechanism *(optional)* | inside a `mechanisms[*]` entry | Only for **non-linear/branching** step graphs; a linear `steps` list already *is* the graph (order = causality) |
| `visual_intent` on a mechanism *(optional)* | inside a `mechanisms[*]` entry | Only for elements that will actually get a diagram, to fix its shape (process-flow / feedback-loop / comparison) |
| Actors *(optional)* | frontmatter `actors:` (id, role KP ref, `in_mechanisms`) | Only where an actor **identity is reused** across mechanisms/projections downstream |
| Clinical reasoning *(optional)* | frontmatter `clinical_reasoning:` (id, inputs, decision, `uses_kp`) | Only where a `clinical-reasoning` projection or future clinical QCM will consume it |
| Conceptual dependencies *(optional)* | frontmatter `dependencies:` (edges) | Only where sequence/adaptivity/update ripple needs an edge **not** inferable from `sequence` |
| Confusion points *(optional)* | frontmatter `confusion:` (id, the two things confused, refs) | Only where a disambiguating explanation or "trap" QCM materially reduces misunderstanding |
| Analogies *(optional)* | frontmatter `analogies:` (id, target element) + body prose | Only where an analogy is used, so a projection knows the content is pedagogical-scaffolding (claim class 2) |

**Blueprint excerpt (real Item 234 content):**

```markdown
---
chapter: cardio/234
revision: r1
mental_model:
  id: MM-pump-decompensation
  question: "Comment une cardiopathie devient-elle une insuffisance cardiaque qui se décompense ?"
sequence: [MM-pump-decompensation, MEC-output-basics, MEC-compensation,
           MEC-remodelling, MEC-congestion, MEC-oap, CR-diagnosis, CR-treat-hfref]
# No `dependencies:` block here: for this thread the prerequisite order is already the `sequence`
# order, so explicit edges would be redundant. Add `dependencies:` only for a non-sequential edge
# (e.g. a later concept that also depends on an earlier, non-adjacent one).
mechanisms:
  - id: MEC-oap
    question: "Comment la congestion pulmonaire mène-t-elle à l'OAP ?"
    steps:                            # linear → the ordered list IS the causal graph; no causal_links
      - "pression télédiastolique VG ↑"
      - "transmission OG → veines/capillaires pulmonaires"
      - "franchissement du seuil (KP-041)"
      - "transsudat alvéolaire → OAP cardiogénique"
    uses_kp: [KP-041]
    confusion: [CONF-transsudat-exsudat]   # present only because this boundary matters here
    visual_intent: process-flow            # present only because this element gets a diagram
confusion:
  - id: CONF-transsudat-exsudat
    a: "OAP cardiogénique = transsudat (pression)"
    b: "OAP lésionnel = exsudat (membrane alvéolo-capillaire)"
    uses_kp: [KP-041]
# No `actors:` registry and no `dependencies:` block in this excerpt — neither has a downstream
# consumer for this thread, so neither is authored. They appear only when something needs them.
---

## MM-pump-decompensation — Le cœur comme pompe qui se décompense
Une cardiopathie abîme la pompe → débit insuffisant et/ou pressions de remplissage
élevées → compensations utiles puis délétères → congestion et décompensations aiguës.
(Prose kept short; the full narrative is *projected* into `overview.md`, not stored here.)
```

**Smallest useful mechanism** (linear, no branching, no reused actors, no diagram planned yet) — the default shape:

```yaml
mechanisms:
  - id: MEC-congestion
    question: "Pourquoi les pressions de remplissage montent-elles en amont ?"
    steps: ["dysfonction VG", "pression télédiastolique ↑", "transmission en amont"]
    uses_kp: [KP-040]
# That is the whole element: no causal_links, no actors, no visual_intent, no confusion —
# each of those is added later ONLY if a concrete consumer (diagram, QCM, adaptivity) requires it.
```

The `MM-pump-decompensation` node captures the intuition already carried by `histoire.md` ("La ville et sa pompe") — and a chapter that uses that analogy would add an `analogies:` entry (e.g. `ANA-ville-pompe`), which this thread's excerpt omits because nothing here consumes it. `MEC-oap` is `mecanismes.md` §11; `CONF-transsudat-exsudat` is the `mecanismes.md` §11 contrast and the `vue-ensemble.md` connections table. The Blueprint **selects and structures** these; it does not restate them — and it stays sparse: an element carries only the fields its consumers use.

**What the Blueprint must not own:** finished prose, final SVG markup, layout, or any fact not already an anchored KP.

---

## 7. Cognitive Compression Rules

Item 234's Inventory has ~88 KPs. The current `mecanismes.md` already compresses these into 24 "why/how" questions — but it overloads one file with physiology (§1–11), clinical exam and diagnosis (§12–15), etiology (§16), acute care (§17), prognosis (§18), and treatment (§19–24). Compression rules decide what enters the Blueprint, at what depth, and where the rest goes. **No universal numeric limit**; decision rules instead:

1. **Group details under one causal model.** The four compensation KPs — tachycardie (`coverage.md` l.102), vasoconstriction (l.103), rétention hydrosodée (l.104), activation neurohormonale (l.105) — collapse into **one** Blueprint mechanism `MEC-compensation` ("Pourquoi le corps aide-t-il d'abord, puis aggrave-t-il ?"), matching `mecanismes.md` §3–6.
2. **One learner-facing mechanism per meaningful why/how question.** If two KPs answer the same question, they share one mechanism element.
3. **Keep exact thresholds/details in mastery unless needed to *understand* the mechanism.** `PPC > 25 mmHg` (KP-041) is kept in understanding because the mechanism is unintelligible without a threshold to cross. The age-banded NT-proBNP values (KP-052) are **deferred-to-mastery**; understanding only needs "BNP rises with myocyte stretch and helps rule IC in/out" (KP-051).
4. **Expose a confusion boundary only when it materially reduces misunderstanding.** Item 234 warrants exactly a few: FE diminuée vs préservée (`mecanismes.md` §8), transsudat vs exsudat / cardiogénique vs lésionnel (§11), IC droite vs gauche. Fine distinctions among diuretics are *not* confusion points.
5. **Progressive disclosure.** Supporting detail (drug dose ranges, full ESC biological work-up list in `coverage.md` l.124) stays Inventory-only and surfaces later via mastery, not in the Blueprint.
6. **No duplicate explanations across projections.** `overview.md` states the mental model once; `mechanisms.md` explains the *why*; neither re-derives the other. The Blueprint's `mental_model` is the single upstream both read.

**Determination guide (with Item 234 examples):**

| Bucket | Rule | Item 234 example |
|---|---|---|
| **In the Blueprint** | Needed to build the mental model or answer a core why/how | `MEC-oap`, `MEC-compensation`, FE diminuée/préservée distinction |
| **Inventory-only** | Examinable but not needed to *understand* the model now | Full ESC 2021 biology panel; transplant CI list detail |
| **Understanding-core** | A KP whose omission breaks a mechanism | `PPC > 25 mmHg` (KP-041); DC = VES × FC (KP-007) |
| **Supporting understanding** | Adds nuance to a core concept; progressive disclosure | inhomogeneity of compensatory vasoconstriction |
| **Deferred to mastery** | High-specificity detail for later QCM/flashcards | NT-proBNP age thresholds (KP-052); RAP > 5 UW (KP-085); pic VO2 (KP-090) |

**The coverage invariant is about *disposition*, not Blueprint membership.** Every Inventory KP must carry an explicit disposition (`understanding` / `deferred-to-mastery` / `excluded:<reason>`) — nothing is ever silently dropped. But a KP with `disposition: understanding` **need not have its own Blueprint element**: many detailed KPs are compressed into one concept (the four compensation KPs above all map to the single `MEC-compensation`; `KP-007`'s three formulas sit inside `MEC-output-basics`). Understanding KPs must be **represented or contextualised somewhere in the understanding architecture where the learner needs them** — but Blueprint omission alone does **not** imply `deferred-to-mastery`, and there is explicitly **no one-KP → one-Blueprint-element rule** (that would re-inflate the Blueprint into the ontology this design rejects). This is the seam that links completeness (A.1) to manageability (A.3): completeness is proven by *disposition + independent reconciliation*, not by forcing every KP into a Blueprint node.

---

## 8. Understanding Projection Design

### 8.0 The pedagogical block (the body shape of every understanding projection)

A projection body is a sequence of **pedagogical blocks** (contract Part B), one per projected Blueprint element, in `sequence` order. The block is a *guided understanding unit*; its identity is the Blueprint-element ID, so it introduces no new identifier space.

```
Question              ← the element's `question:`                             REQUIRED
Official Visual       ← figures/<element>.svg, bound by element ID            OPTIONAL
  📷 Personal Diagram ← learner layer, every block, 0..n (contract C.8)
Guided Walkthrough    ← the canonical explanation                             REQUIRED
  📝 Inline Notes     ← learner layer, 0..n (contract C.9)
```

Both shapes are valid and complete: `Question → Official Visual → Guided Walkthrough`, and `Question → Guided Walkthrough`. Nothing else is authored into a block — no "short answer", no "why it matters", no per-block summary. The sub-headings that used to structure a section (`### Réponse courte`, `### Mécanisme pas à pas`, `### Pourquoi c'est important`, and the `Si… / Alors…` decision tables of `clinical-reasoning.md`) are superseded by the single walkthrough. A table survives only where the comparison *is* the content — a confusion boundary, a phenotype contrast — and the walkthrough must then explain how to read it.

**The Chapter Overview is one block, not many.** It projects the `mental_model` and its walkthrough traverses the whole causal chain once, so it acts as the chapter map. The elements it traverses keep their own blocks in the mechanism and clinical-reasoning projections, where the canonical explanation of each one lives; the overview's claim blocks trace to those elements without duplicating their depth. Its Official Visual, when built, is the one overview diagram.

**The Guided Walkthrough is the canonical explanation** of its element. With a visual present it walks the learner through that visual — what each element represents, why it appears, why it connects to the preceding one, why a branch exists, why the relationship matters, how the mechanism progresses end to end. With no visual present it walks through the reasoning itself, in the same order and to the same depth. Mechanically it is ordinary generated prose: ordinary claim blocks, ordinary claim classes, ordinary `uses_kp` inheritance from the projected element. It introduces **no new traceability unit**, and it is **generated** — never assembled by the renderer, which holds no medical content (§12).

**The Official Visual is optional support and never the primary explanatory artifact.** Two consequences the build enforces:

- **Subordination.** Every KP referenced by a published visual's semantic units must also be referenced by that block's walkthrough (scaffolding units carry no KP and are excluded). This is the existing "never the only place a fact lives" rule one level down; it is a set-containment check in pass F (§9), computable from visualSpec `nodes[].kp`/`edges[].kp` against the walkthrough's claim trace.
- **Publication.** A visual that fails validation, grounding or render-eligibility **does not block publication** of an otherwise valid walkthrough; the block publishes visual-less, the failure is reported, and any stale asset is removed (§9, §12).

Where the walkthrough anchors the two learner mechanisms, note the durability difference: a Personal Diagram anchors to the **element ID** (irreversible core, §4/§6) and survives regeneration robustly; an Inline Note anchors to a **claim-block boundary** and survives while that claim block persists, degrading to element level otherwise. This is why claim-block identifiers now carry a durability obligation they did not before (§19).

### 8.1 Projection types

**Projection types are candidate capabilities, not a required initial standard.** The architecture explicitly allows projection types to be added dynamically (`FINAL_ARCHITECTURE.md` §12); no chapter is obliged to carry all of them. Classifying the candidates against Item 234:

| Candidate | Classification | Reason (Item 234) |
|---|---|---|
| overview | **Strong initial core** | `vue-ensemble.md` projects the mental model + the 5 blocks; the "big picture first" surface. |
| mechanisms | **Strong initial core** | The workhorse; `mecanismes.md` §1–11 physiology; the one type that exercises the step-graph→visual path. |
| clinical reasoning | **Likely useful where the chapter supports it** | Item 234 clearly supports it (`mecanismes.md` §12–24: NYHA, diagnostic algorithm, acute triage, treatment decisions); a flatter chapter might not need it. Gives future clinical QCM a clean target. |
| story / intuition | **Optional — justify by need** | `histoire.md` "ville et sa pompe" is high-value *here*; not every chapter warrants a narrative. |
| actors | **Optional — justify by need** | Only where actor identity is reused; render as a light glossary keyed to Blueprint actor elements, never 36 hero pages. |
| readiness | **Optional — justify by need** | `pret.md` competency self-check is useful but not architecture-proving. |
| comparisons | **Not a type** | Comparisons (FE diminuée/préservée, transsudat/exsudat) are claim-block structures inside mechanisms/overview + confusion points, not a standalone projection. |
| Official Visuals | **Cross-cutting capability** | Generated from Blueprint structure for any element declared in `visual_plan` and activated by `visual_intent`; not a "tab", and never a projection of its own. A category, not a diagram type: causal and process diagrams now, and — if the asset-referenced mode is ever built — anatomical illustrations, radiological images and ECGs (`VISUAL_GRAMMAR_CONTRACT.md` §7). |

**Do not standardise a fixed initial family set before implementation evidence** from Item 234 and later structurally different chapters. The *minimum needed to prove the architecture* (§17) is just **one overview block + one mechanism projection**; the rest are added when a concrete pedagogical/downstream need justifies them. (The count and names are reversible per contract §12; the *derive-from-Blueprint* rule is not.)

For each candidate type, its shape **when present**:

| Type | Reads (Blueprint) | File granularity | Claim blocks ref KPs via | Official Visual referenced by | Provenance |
|---|---|---|---|---|---|
| story | `mental_model`, `analogies` | one/chapter | mostly class-2 scaffolding; few sourced blocks | rarely | frontmatter stamp |
| overview | `mental_model`, `sequence` | one/chapter | overview claim blocks → KP via claim-block trace (§10) | overview diagram by element ID | frontmatter stamp |
| mechanisms | `mechanisms[*]` | one/chapter, **section per `MEC-*`** | each section inherits `uses_kp`; high-specificity sentences pinned | `VIS(MEC-*)` by ID | frontmatter stamp |
| clinical-reasoning | `clinical_reasoning[*]`, `confusion` | one/chapter, section per `CR-*` | per-node `uses_kp` | `VIS(CR-*)` (e.g. algorithm) | frontmatter stamp |
| actors | `actors[*]` | one/chapter, section per `ACT-*` | per-actor role KP | optional | frontmatter stamp |
| readiness | `sequence`, elements | one/chapter | competency ↔ element/KP | none | frontmatter stamp |
| Official Visuals | `mechanisms[*].steps`, `visual_plan` + `visual_intent` | **one asset per element** | inherits element `uses_kp`; must be a subset of its block's walkthrough KPs (§8.0) | is the visual | manifest entry |

**Scaffolding stays out of learner content.** The audit found `> Purpose`, `# Progress`, `# Final validation`, `# Notes` rendered to the learner. In the target, generation directives live in prompts, provenance lives in frontmatter, and the projection body is **learner content only** — that is, blocks and nothing else. Example projection, showing both valid block shapes:

```markdown
---
type: understanding.mechanisms
projects: [MEC-congestion, MEC-oap, …]
provenance: { source_edition: 2024-SFC, blueprint_revision: r1, methodology_version: m1 }
---

## Comment la congestion pulmonaire mène-t-elle à l'OAP ? {#MEC-oap}

<!-- Official Visual: figures/mec-oap.svg, injected by the renderer from the manifest by
     element ID. Optional support; the walkthrough below is the canonical explanation. -->

La montée des pressions en amont du ventricule gauche se transmet à l'oreillette puis au réseau
capillaire pulmonaire. {#cb-mecoap-transmission}
Tant que la pression capillaire reste sous un certain seuil, le poumon reste sec ; au-delà de
**25 mmHg**, le liquide franchit la barrière et un **transsudat** gagne les alvéoles, ce qui
définit l'**OAP cardiogénique**. {#cb-mecoap-threshold}
C'est pourquoi le même cœur peut être asymptomatique au repos et se décompenser brutalement :
la relation n'est pas progressive, elle est à seuil. {#cb-mecoap-why-threshold}

## Pourquoi les pressions de remplissage montent-elles en amont ? {#MEC-congestion}

<!-- No Official Visual for this element: the causal chain is short and linear, so structure adds
     no cognitive value (VISUAL_GRAMMAR_CONTRACT I8). The block remains complete. -->

Le ventricule qui se remplit mal ou s'éjecte mal conserve un volume résiduel plus élevé en fin de
diastole… {#cb-meccong-transmission}
```

Two things to read from this. The heading is the element's Blueprint `question`, carrying the **element ID** as its anchor so the manifest can bind an Official Visual to it by identifier rather than by ordinal position. And the second block has no visual and needs no apology for it — the walkthrough carries the explanation either way.

---

## 9. Automated Fidelity Assurance Pipeline

The contract's assurance model as the **smallest set of distinct passes** that avoids self-validation. Passes are labelled **[D]** deterministic (a script) or **[AI]** semantic (a model invocation whose uncertainty is an output). Generation and checking are always different processes; the reconciler ideally uses a different prompt/model from the extractor.

| Pass | Kind | Inputs | Output | PASS | WARNING / UNCERTAIN | BLOCKED | Next on failure |
|---|---|---|---|---|---|---|---|
| **A. Source ingestion** | [D] | `official-college.md`, `source.meta.yaml` | validated source + section index | every `section_path` in meta resolves; text stored | — | section missing / index unresolved | fix ingestion; never proceed |
| **B. Inventory extraction** | [AI] | source | `inventory.yaml` candidate | produced with anchors + rank + disposition | KP with weak/uncertain anchor flagged | — (extraction does not gate; C gates) | curate; re-extract |
| **C. Coverage reconciliation** | [AI, independent] | source **+** `inventory.yaml`, section-by-section | `build/reconciliation.yaml`: each source segment → `represented` / `deferred` / `excluded-with-reason` / `missed` / `ambiguous` | **no `missed` relevant segment** (every relevant segment is represented/deferred/excluded-with-reason); `ambiguous` handled conservatively | `ambiguous` segments listed for closer-to-source wording, withheld interpretation, or broader re-analysis | **any** genuinely `missed` relevant segment (**no numeric tolerance**) | broaden re-analysis / re-extract until the segment is represented/deferred/excluded/reclassified; hold chapter until then |
| **D. Blueprint consistency** | [D]+[AI] | `blueprint.md`, `inventory.yaml`, source anchors | verdict | [D] every element refs valid KP; every referenced KP exists; **every Inventory KP has an explicit disposition** (no requirement that a KP be a Blueprint element — many KPs may map to one, or to none where contextualised elsewhere). [AI] structured understanding grounded in anchors; **no unsupported medical content** introduced | [AI] an element weakly grounded | [D] dangling KP ref / KP with no disposition; [AI] element asserts a fact with no KP | regenerate/refine Blueprint; re-run |
| **E. Projection grounding** | [AI, separate] | projection `.md` + claim-block trace (§10), referenced KP anchors | `build/grounding.yaml`: per claim block `pass` / `downgrade` / `fail` | sourced claims supported; bridging inferences entailed; numbers/thresholds/classifications match KP | bridging inference not clearly entailed → downgrade | sourced claim unsupported; threshold mismatch | conservative fallback (omit / reframe / quote); regenerate |
| **F. Package validation** | [D] | Blueprint, Inventory, projections, `reconciliation.yaml`, `grounding.yaml` | `manifest.json` or build failure | all references resolve; coverage invariant holds (every KP disposed, no relevant segment `missed`); every explanation↔visual link resolves by ID; **visual subordination holds** (a published visual's KPs ⊆ its block's walkthrough KPs, §8.0); no `fail`/`blocked` content published; edition status not duplicated | a failed **Official Visual** is withheld and reported, and its block publishes visual-less | any invariant broken; **any** genuinely `missed` relevant segment; any unresolved `fail` **on a walkthrough** | do not publish; report |

**An optional Official Visual fails soft; everything else fails hard.** Because the walkthrough is the canonical explanation (§8.0), a visual that fails validation, grounding or render-eligibility must not withhold the walkthrough from the learner. The block publishes in its visual-less form, and the failure stays fully visible: pass F **reports** it, the stale asset is **removed** rather than left pretending to be current, and traceability and all validation/grounding results are **preserved**. This is A.1's conservative fallback applied to visuals — omitting an unverified visual publishes nothing unverified. It weakens no other gate: a failed walkthrough grounding check, a `missed` source segment, a dangling reference or a broken subordination check all still block publication.

**Separation summary.** Deterministic gates (A, D-structural, F) are cheap and absolute. AI gates (B, C, D-semantic, E) produce *graded* verdicts feeding the conservative fallback. The **completeness proof** is C (source→Inventory, section-by-section) cross-checking B; the **grounding proof** is E checking each claim block against its KP's quote — never the generator checking itself.

**Item 234 illustration.** Pass C walks `official-college.md` section `I. Généralités > Physiopathologie` and finds the OAP-threshold segment (lines 265–267); it must map to a KP (`KP-041`) → `represented`. Pass E takes the `mecanismes.md` §11 threshold claim block, class `sourced`, and checks "PPC > 25 mmHg → transsudat → OAP" against `KP-041`'s quote → `pass`. If a future projection said "> 30 mmHg", E returns `fail` and F blocks publication.

---

## 10. Claim-Block Traceability Design

**The fixed requirement** (architectural, not reversible) is the stored relationship:

```
claim block → Blueprint element (where applicable) → KP ID(s) → source anchor(s)
```

**The storage representation is deliberately left reversible for the first vertical slice.** The slice compares the two simplest reliable options and picks one on evidence — it does **not** pre-commit to a per-projection sidecar (which risks prose↔metadata drift and artifact proliferation):

- **Option A — lightweight metadata adjacent to the claim block / projection structure.** A claim block carries a short kramdown-style id (`{#cb-mecoap-threshold}`, nearly invisible and renderer-friendly), and its class + KP IDs sit in a small structured block near the content (e.g. in the projection's own frontmatter). Best locality during authoring/checking; more places to keep in sync.
- **Option B — one generated chapter-level index.** A single `build/traceability.json` maps every claim-block id → class + Blueprint element + KP IDs (+ resolved anchor), generated at package time. One artifact, loaded on demand by the renderer; no per-file sidecars. Best against proliferation; the index is regenerated, never hand-edited.

```yaml
# Illustrative claim-block entries (representation-neutral — same data whether stored as
# adjacent metadata (A) or folded into build/traceability.json (B)):
- id: cb-mecoap
  class: bridging          # the arrow-chain framing, entailed by MEC-oap steps
  element: MEC-oap
  kp: [KP-041]
- id: cb-mecoap-threshold
  class: sourced           # high-specificity threshold → pinned at sentence level
  kp: [KP-041]
```

Most blocks inherit their KP set from the projected Blueprint element, so either representation stays small; only high-specificity sentences are pinned individually.

How each unit references KPs, using this one mechanism:

| Unit | Where the id lives | Example (Item 234) |
|---|---|---|
| Paragraph | `{#cb-…}` on the paragraph | overview congestion paragraph → `KP-041` |
| Mechanism step | `{#cb-mecoap-s3}` on the step, or inherit from element | step "franchissement du seuil" → `KP-041` |
| Table row | id on the row's leading cell | FE diminuée/préservée row → `KP` for that distinction |
| Diagram node | node `id` inside the SVG = element id | `mec-oap.svg` node → `MEC-oap` → `KP-041` |
| QCM explanation (later) | id in the mastery item's trace | OAP threshold QCM → `KP-041` |
| Flashcard answer (later) | id in the mastery item's trace | "> 25 mmHg" answer → `KP-041` |

A generated trust index (Option B's `build/traceability.json`, or the aggregate of Option A's adjacent metadata) — **not the manifest itself** (§11) — materialises these into the traceability graph so "where does this come from?" is a lookup, never a positional guess.

---

## 11. Manifest Design

One generated `manifest.json` per chapter — **the renderer's discovery/assembly contract, and nothing more.** Its job is to let the renderer determine: chapter metadata, which projections exist and their type/family/display order, their paths, visual relationships by ID, high-level publishability/status, and the source-edition info useful to the learner. It **references**; it never authors, and it does **not** duplicate the full trust graph.

Minimum realistic Item 234 example (abridged to the OAP thread) — deliberately small:

```json
{
  "chapter": "cardio/234",
  "slug": "234-insuffisance-cardiaque",
  "title": "Insuffisance cardiaque de l'adulte",
  "source_edition": "2024-SFC",
  "projections": [
    { "id": "overview", "type": "understanding.overview", "family": "understanding",
      "order": 1, "path": "projections/understanding/overview.md", "status": "published" },
    { "id": "mechanisms", "type": "understanding.mechanisms", "family": "understanding",
      "order": 2, "path": "projections/understanding/mechanisms.md",
      "elements": ["MEC-output-basics", "MEC-compensation", "MEC-oap"],
      "visuals": { "MEC-oap": "figures/mec-oap.svg" }, "status": "published" }
  ],
  "visuals": [
    { "id": "mec-oap", "element": "MEC-oap", "path": "figures/mec-oap.svg",
      "alt": "Congestion pulmonaire → seuil → transsudat → OAP cardiogénique" }
  ],
  "edition_status": { "MEC-oap": "unchanged" },
  "coverage_invariant": "pass",
  "coherence_check": null,
  "known_absent": ["mastery"],
  "trace_index": "build/traceability.json"
}
```

**The manifest is NOT a source of medical truth and NOT the canonical provenance store.** Detailed `claim block → element → KP → anchor` traceability lives in the **separate generated trust index** (`build/traceability.json`, §10), loaded by the renderer only when the learner asks "where does this come from?". Canonical **provenance** stays on each artifact (projection frontmatter); canonical **reconciliation and grounding** reports stay under `build/` — the manifest copies none of them wholesale, carrying only a high-level `status`/`coverage_invariant` flag. `edition_status` is **derived** from `inventory.yaml` KP histories at build; `coherence_check` is `null` until an edition update writes `build/coherence.yaml`; `known_absent` lets the renderer degrade honestly instead of silently hiding unbuilt families (the audit's four-of-five-silently-missing failure).

---

## 12. Renderer Target Contract

> **Mise à jour documentaire (2026-08-02) :** la navigation produit est fixée à **7 vues Reader** via Composition V1 — voir [`docs/renderer/00-READER-V1-PRODUCT-MODEL.md`](docs/renderer/00-READER-V1-PRODUCT-MODEL.md) et [`docs/renderer/READER-COMPOSITION-V1-FREEZE.md`](docs/renderer/READER-COMPOSITION-V1-FREEZE.md). Les paragraphes ci-dessous sur la découverte dynamique par `manifest.projections` décrivent la **consommation des artefacts publiés**, pas des onglets produit. Le modèle « 1 projection = 1 onglet » est **abrogé**.

Based on the published chapter package (manifest + declared artefacts) and the **Composition Specification**, the renderer must:

- **Compose learner-visible views** via `compose(manifest, spec)` → **Reading View Model** — navigation from `viewModel.views` ordered by `displayOrder` (seven fixed Reader views). **Not** one tab per manifest projection.
- **Resolve production artefacts** declared in `manifest.projections` (ordered by pedagogical `order`) as **inputs to composition**, not as product navigation labels.
- **Render projection types by capability** when a view aggregates understanding artefacts. It maps a `type` (e.g. `understanding.mechanisms`) to a render capability; an unknown type renders as a generic Markdown projection rather than breaking.
- **Render pedagogical blocks, and present generated content as non-editable.** One block per projected element (§8.0): question, optional Official Visual, Guided Walkthrough. No editing affordance exists over any of the three.
- **Inject the Official Visual by explicit ID relationship.** For each projection, read `visuals: { ELEMENT: path }` and place the asset at the element's anchor — never by matching `mechanism-01.svg` to the first `##`.
- **Report an unavailable Official Visual; never hide it.** The three states are distinct and must not be collapsed: **none planned** renders a visual-less block with no implication of a gap (a correct outcome, `VISUAL_GRAMMAR_CONTRACT.md` I8); **planned, not built** renders as known-absent; **built but withheld** states explicitly that visual support is *temporarily unavailable*, tied to the pipeline result.
- **Expose the two learner affordances, separately and unconditionally.** A Personal Diagram affordance on **every** block, whether or not an Official Visual exists (contract C.8), and an Inline Notes affordance within the walkthrough (C.9). Learner content is visually distinct from generated content; an artifact whose anchor no longer resolves is shown as orphaned, never discarded.
- **Expose source traceability on request.** Using the **trust index** (`build/traceability.json`, referenced by `manifest.trace_index` and loaded on demand — *not* the manifest body), a "where does this come from?" affordance resolves a claim block → Blueprint element → KP → the `2024-SFC` quote.
- **Distinguish understanding vs future mastery** via `family`, and show `known_absent: ["mastery"]` as an explicit "not built yet" state.
- **Surface edition badges** from `edition_status` ("updated in 2027", "unchanged") where useful.
- **Own no medical content** and assume **seven fixed Reader views** at the product layer (Composition), while remaining extensible at the **production** projection registry.

**What the renderer does NOT need to understand:** the College source, the Inventory, the Blueprint, claim classes, grounding verdicts, reconciliation, provenance semantics, or how IDs are minted. It consumes IDs and paths; it never interprets the medical model. In particular it **never composes learner-visible medical text**: it may not assemble, paraphrase or summarise a Guided Walkthrough, and it may not author a visual's text alternative (`VISUAL_GRAMMAR_CONTRACT.md` I1; the alt text comes from the manifest, which derives it from the specification). **No frontend framework is selected here**; the existing static shell (`demo/renderer/`, clean separation, chapter-agnostic, path-sanitized, offline `marked`) is sufficient to grow into this contract, and the choice stays reversible.

---

## 13. Edition Update Design

**Where each concept is stored** (the contract's four-way separation, made file-concrete):

| Concept | Stored in | Field |
|---|---|---|
| Source edition | `source/source.meta.yaml`; per-KP `editions[].edition` | `edition: 2024-SFC` |
| KP change type | `inventory.yaml` KP `editions[].change` | `unchanged / moved / modified / new / removed / split / merged` |
| Reconciliation confidence | `inventory.yaml` KP `editions[].confidence` | `high / medium / low` |
| Split/merge lineage | `inventory.yaml` KP `lineage` | `{from|into, kind}` |
| Last-seen edition | `inventory.yaml` KP `editions[]` (latest) + `retired_as_of` | — |
| Projection provenance | projection frontmatter (**canonical**); manifest carries only high-level `status`, not the provenance stamp | `{source_edition, blueprint_revision, methodology_version}` |
| Final coherence status | `build/coherence.yaml` → `manifest.coherence_check` | `pass / uncertain / fail` |

Change information has **one canonical origin**: the KP in `inventory.yaml`. Learner badges are derived from it; nothing else stores edition status.

**Flow: 2024 Item 234 → 2027 source** (mechanics only; no fabricated numbers, per the contract's BNP example):

1. **Ingest + extract** the 2027 `official-college.md`; produce a candidate Inventory.
2. **Structural/semantic comparison** against `inventory.yaml` r1 → per-KP `change` + `confidence`. E.g. the NT-proBNP threshold KP (`KP-052`, from `mecanismes.md` §13 / `coverage.md` l.121) is classified `modified`, `high` (same peptide, same role, value moved) → identity continued, anchor + content revised, `editions[]` gains `{2027-SFC, modified, high}`.
3. **Inventory reconciliation** (pass C) re-runs section-by-section on the 2027 source so no new segment is `missed`.
4. **Impacted Blueprint elements**: walk the chain in reverse — `KP-052` is referenced by `MEC-bnp`/`CR-diagnosis`; only those are marked stale.
5. **Impacted projections**: only projections/visuals referencing those elements or that KP (the BNP mechanism section, the diagnostic-algorithm visual, later BNP QCM/flashcards).
6. **Selective regeneration** of just those, re-grounded (pass E).
7. **Final chapter-level coherence check** → `build/coherence.yaml`: does the assembled 2027 chapter still hang together (does the diagnostic narrative survive the moved threshold)? If uncertain/fail, **expand scope** (re-reconcile, re-curate more of the Blueprint, re-project) until it holds or the chapter is held.
8. **Updated manifest/package**: `edition_status` shows "updated in 2027" on BNP content, "unchanged" elsewhere.

**What stays untouched and why.** The OAP thread (`MEC-oap` / `KP-041`), compensation, remodelling, treatment classes: their provenance still matches the prior build, proving *lineage* (not touched by this diff). Currency of the whole chapter is asserted only by the passing coherence check, never by provenance alone. **Confidence gates identity continuation**: a `medium`/`low` classification (e.g. uncertainty whether the rule split into age bands) forces broader re-analysis before any stable ID is continued. Everything is file-based; a diff is a Git diff.

---

## 14. Item 234 Current → Target Mapping

Design only — **no action is executed here.**

| Current artifact | Classification | Rationale |
|---|---|---|
| `chapter-analysis/…/official-college.md` | **KEEP AS-IS** (relocate under `source/`) | The immutable medical authority; only add the `source.meta.yaml` sidecar (edition `2024-SFC`, section index). Transcription artifacts in the "Hiérarchisation" table are fidelity fixes, not medical edits. |
| `chapter-analysis/…/coverage.md` | **TRANSFORM → `inventory.yaml`** | Its ~88 knowledge units are the seed KPs; transform adds IDs, anchors, rank, disposition, edition history. Its `Covered`/`Destination` columns (never filled) are replaced by disposition + `build/reconciliation.yaml`. |
| `chapter-analysis/…/coverage-v0.md` | **ARCHIVE** | Superseded 849-line variant, unreferenced. Keep out of the build; retain in history only. |
| `chapter-analysis/…/storyboard.md` | **DELETE (as artifact) / REGENERATE (as concept)** | The unfilled template is not upstream of anything; its *role* is absorbed into `blueprint.md`. No content to salvage. |
| `generated-assets/…/histoire.md` | **REGENERATE** (content salvageable as scaffolding) | Strong intuition ("ville et sa pompe") becomes the `ANA-ville-pompe` analogy + `story` projection; regenerated from the Blueprint, scaffolding sections dropped. |
| `generated-assets/…/vue-ensemble.md` | **REGENERATE** | Excellent mental model + 5-block structure seeds `MM-*` and the `overview` projection; the fenced ASCII diagram is replaced by an ID-linked SVG. |
| `generated-assets/…/mecanismes.md` | **TRANSFORM → Blueprint mechanisms + REGENERATE projections** | §1–11 seed `MEC-*` mechanisms; §12–24 seed `CR-*` clinical-reasoning. Content is the best evidence the concept works; it is re-expressed as structured Blueprint elements, then re-projected. |
| `generated-assets/…/acteurs.md` | **TRANSFORM (lighter) → Blueprint actors + `actors` glossary** | 36 actors become Blueprint `ACT-*` elements with mechanism cross-links; projection is a light glossary, not 36 hero pages. |
| `generated-assets/…/pret.md` | **REGENERATE** | 35 competency questions seed the `readiness` projection; regenerate from Blueprint sequence so competencies map to elements. |
| `generated-assets/…/figures/*.svg` (61) | **REGENERATE** | Visually excellent, but ordinally named and prose-derived. Regenerate from Blueprint step graphs, renamed by element ID (`mec-oap.svg`), linked by manifest. The visual *system* is preserved; these instances are re-derived. |
| `generated-assets/…/svg-generation-review.md` | **ARCHIVE** | Valuable integration-test record; its concrete issues (paths, missing links, ordinal fragility) are resolved by this design. Keep as history, not in the build. |
| `templates/design-system.md`, `svg/diagram-template.svg`, `svg/svg-patterns.md`, `svg/svg-style-guide.md` | **KEEP AS-IS** | The visual SoT and component library; the SVG generator reads these. (Resolve the colour-SoT ambiguity and the `svg-style-guide-draft.md` duplication as flexible follow-ups, §19.) |
| `demo/renderer/` (config/app) | **TRANSFORM** | Keep the clean shell; replace the hard-coded `TABS` (incl. legacy `pourquoi`) with manifest-driven discovery and add SVG injection by ID + a traceability affordance. |

---

## 15. Item 234 Reference Build Sequence

Precise enough to become tasks without reopening architecture. Each step: inputs → outputs, validation, failure behaviour.

| Step | Inputs | Outputs | Validation | Failure behaviour |
|---|---|---|---|---|
| **1. Source** | published 2024-SFC text | `source/official-college.md`, `source.meta.yaml` | **A** [D]: section index resolves; text verbatim | fix ingestion; halt |
| **2. Inventory** | source | `inventory.yaml` (KPs, anchors, rank, disposition) | **B** [AI]: every KP has ≥1 resolving anchor + disposition; **[D]** unique/non-reused IDs | regenerate/refine; re-extract |
| **3. Reconciliation** | source + `inventory.yaml` | `build/reconciliation.yaml` | **C** [AI, independent]: **no genuinely `missed` relevant segment** (any real miss blocks); `ambiguous` handled conservatively | broaden re-analysis; hold until every missed segment is represented/deferred/excluded/reclassified |
| **4. Blueprint** | `inventory.yaml`, source anchors | `blueprint.md` (sparse frontmatter graph + prose) | authoring completeness: `sequence` non-empty, mechanisms have question + steps | regenerate/refine |
| **5. Blueprint validation** | `blueprint.md`, `inventory.yaml` | verdict | **D** [D]: refs valid, **every KP has a disposition** (no one-KP→one-element rule); [AI]: grounded, no unsupported content | regenerate/refine; re-run |
| **6. Understanding projections** | `blueprint.md` | only the projection types the chapter needs (minimum: `overview` + one `mechanisms`) + claim-block trace (representation per §10) | frontmatter present; every claim block has class + (if sourced) KP | regenerate |
| **7. Visuals** | Blueprint `steps` + `visual_intent`, visual system | `figures/<element>.svg` | [D] well-formed XML, `title`/`desc`/`role`, ids unique; node ids = element ids | regenerate figure |
| **8. Grounding** | projections + claim-block trace + KP anchors | `build/grounding.yaml` | **E** [AI]: sourced supported, bridging entailed, numbers match | conservative fallback; regenerate |
| **9. Package** | all above | `manifest.json` (+ `build/traceability.json`) | **F** [D]: refs resolve, coverage invariant, visual links resolve, no `fail` published | do not publish; report |
| **10. Renderer preview** | `manifest.json` + files | rendered chapter | manifest loads; projections render; visuals inject; traceability resolves | fix renderer/manifest; no medical impact |

Human involvement is **optional and non-medical**: after steps 4–6, Lou/owner may give clarity/cognitive-load/usefulness/visual-quality feedback (triggering regeneration/refinement of the canonical artifact); the build **never** blocks waiting for a human to vouch for medical correctness.

---

## 16. Future Mastery Interface Only

No QCM/flashcard/spaced-repetition system is designed now. Only the **attachment contract** future mastery must satisfy is fixed (because KP identity/granularity are irreversible once learner data attaches):

- A mastery item **must** reference **≥1 KP ID** (`targets_kp: [KP-041]`) — Inventory grounding is the requirement.
- It **may** reference a **Blueprint element** for context (`context_element: MEC-oap`) so adaptivity can sequence it after its parent concept — but this is **optional**; a mastery-only KP with no Blueprint element (e.g. `KP-052` NT-proBNP thresholds) is still fully addressable.
- It carries source anchors **transitively** via its KP (no new anchor space).
- It carries a **provenance stamp** like any generated artifact.
- Learner state (mastery level, schedule, history) is **not** stored in the item; it belongs to the future Adaptive layer, keyed by KP ID.

No adaptive algorithm, no spaced-repetition schema, no question-bank architecture is specified. The Item 234 seam already exists: `KP-041` supports a future OAP-threshold flashcard/QCM directly; `KP-052` supports NT-proBNP mastery items directly, with `MEC-bnp` as optional context.

---

## 17. First Vertical Slice

**The slice: the pulmonary-congestion → OAP thread, end to end.** Small, but it exercises every joint the audit found broken.

Scope (real Item 234 content only):

- **Source:** `official-college.md` `I. Généralités > Physiopathologie`, the OAP-threshold segment (lines 265–267).
- **Inventory:** ~3 KPs — `KP-007` (hemodynamic formulas), `KP-040` (filling-pressure transmission), `KP-041` (PPC > 25 mmHg → transsudat → OAP) — each anchored, ranked, disposed.
- **Blueprint:** 2 sparse elements — `MEC-congestion` and `MEC-oap` — each with `steps` + `uses_kp` (linear, so no `causal_links`); `MEC-oap` adds `visual_intent: process-flow` and `CONF-transsudat-exsudat` because those specific consumers exist.
- **Projections (minimum to prove the architecture):** **two pedagogical blocks** (§8.0) — `MEC-oap` *with* an Official Visual, and `MEC-congestion` *without* one — each with its question and Guided Walkthrough. Claim-block traceability is recorded per §10, and the slice **compares the two candidate representations** (adjacent metadata vs a chapter-level `build/traceability.json`) and picks the simpler reliable one.
- **Official Visual:** one SVG, `figures/mec-oap.svg`, generated from `MEC-oap`'s step graph (not prose), with node ids = element ids.
- **Learner layer:** one Inline Note anchored inside the `MEC-oap` walkthrough, and one Personal Diagram on the visual-less `MEC-congestion` block — the latter proving the affordance does not depend on a visual existing.
- **Manifest + trust index:** a small `manifest.json` for discovery/assembly, plus the trust index tying claim block ↔ element ↔ KP ↔ anchor.
- **Renderer:** loads the manifest, renders the section, injects `mec-oap.svg` by ID, offers "where does this come from?" → resolves `KP-041` → the 2024-SFC quote.
- **Checks:** reconciliation marks the OAP segment `represented`; grounding checks the threshold claim block against `KP-041` → `pass`.

**What success proves:**

1. The **canonical/generated boundary** works — two canonical curated structures (Inventory subset, Blueprint subset; AI-generated, optionally human-refined, no medical sign-off) drive everything else.
2. **Prose is not the source of structure** — the SVG is generated from the step graph, and the same `KP-041` grounds prose, diagram, and (later) a QCM.
3. **Traceability is stored, not positional** — the visual↔explanation link and the claim↔source link resolve by ID, killing the ordinal-filename fragility.
4. **Checking can fail** — flipping the projection to "> 30 mmHg" makes grounding `fail` and package validation block, demonstrating the anti-self-validation guarantee.
5. **The renderer holds no medical content** and discovers this content purely from the manifest.
6. **The block survives its visual** — a deliberately ineligible `MEC-oap` visual leaves the walkthrough published, the stale SVG removed, and the failure reported as *temporarily unavailable* rather than hidden (§9, §12). This is the acceptance test for "optional support" being real rather than nominal.
7. **The learner layer is durable and inert** — both learner artifacts survive one regeneration of their projection, and no pipeline pass reads either of them.

If this slice builds and the deliberate-error case blocks correctly, the architecture is validated for scale-out; if any joint needs prose parsing or positional matching, the flaw surfaces here, cheaply.

---

## 18. Deliverable Note

This file, `REFERENCE_IMPLEMENTATION_DESIGN.md`, is the single deliverable. It writes no application code, modifies no existing repository file, performs no migration, and does not re-open the frozen architecture.

---

## 19. Decisions Still Flexible

Per contract §12/Part F, these are reversible and deliberately not over-fixed here:

- **Exact serialization** of each artifact (YAML vs frontmatter vs JSON) — the chosen set (§3) is a starting point.
- **Claim-block traceability representation** (§10) — adjacent metadata vs a chapter-level `build/traceability.json` index. The *relationship* is fixed; the storage is chosen on slice evidence. **The identifier now carries a durability obligation** it did not before: Inline Notes anchor to claim-block boundaries (contract C.9), so a regeneration that needlessly re-cuts stable claim blocks costs the learner her notes. The representation stays reversible; gratuitous churn in the identifiers does not.
- **The learner layer's storage mechanism** (contract C.8/C.9) — browser-local, a sidecar outside the content tree, or a service. Personal Diagrams are binary, so whatever is chosen sits outside `content/` and outside Git (§2). Only the boundary is contractual.
- **Whether the asset-referenced Official Visual mode is built at all** — anatomical illustrations, radiological images and ECGs remain recorded and unimplemented (`VISUAL_GRAMMAR_CONTRACT.md` §7). Deferring costs little, because a block is complete without a visual.
- **Projection type count and names** — projection types are dynamic **candidates**, not a required set. Strong initial core: overview + mechanisms; clinical-reasoning likely where the chapter supports it; story/actors/readiness optional. Standardise more only on implementation evidence (§8).
- **Directory layout** (`content/…` vs today's split `chapter-analysis/` + `generated-assets/`) — mapping (§14) works either way.
- **SVG file naming and internal layout**, and resolution of the colour-SoT ambiguity (design-system vs diagram-template) and the `svg-style-guide-draft.md` duplication.
- **Renderer UI/tabs/navigation** and whether to keep the vanilla static shell or adopt a framework.
- **Prompt wording** and the generator/checker/reconciler **model choices** (only their *separation* is fixed).
- **Operational confidence cut-offs** for semantic reconciliation, and the conservative handling of `ambiguous` content, may stay flexible. **There is no numeric tolerance for genuinely `missed` relevant source content** — any real miss blocks publication (§9); only *ambiguous* handling and the qualitative confidence bands are tunable.
- **KP granularity calibration** — Item 234's ~88 rows are a reasonable calibration to *ratify deliberately* before learner data exists (this is irreversible once ratified, but the exact number is still open now).

---

## 20. Ready for Implementation Planning?

**Yes, for the understanding-first scope.** This design fixes, concretely and against real Item 234 content, every irreversible decision the contract flagged:

- **Identity:** opaque permanent `KP-nnn`, semantic stable Blueprint slugs, gap-tolerant, never renumbered/reused (§4).
- **Source anchoring:** `{edition, section_path, quote}` as an **edition-specific evidence pointer** (not a cross-edition identity), line numbers as convenience only, plus resolution/refresh/ambiguity rules (§5).
- **Canonical/generated boundary:** two **canonical curated structures** (Inventory, Blueprint) — AI-generated and optionally human-refined — versus disposable generated projections; not a literal two-editable-files rule (§1–2).
- **Sparse, capability-driven Blueprint** as the one structured intermediate all projections derive from, kept compressed, never ontology-like (§6).
- **Coverage invariant by disposition, not Blueprint membership** — every KP disposed, many KPs may map to one element or none, no one-KP→one-element inflation (§7, §9).
- **Claim-block + claim-class + separate grounding check** with authority to block; traceability *relationship* fixed, storage representation reversible (§9–10).
- **Completeness invariant** proven by an independent section-by-section reconciliation with **no numeric tolerance for missed relevant content** (§9).
- **Edition model:** four-way separation, single canonical origin, confidence-gated identity continuation, final coherence check (§13).
- **Manifest = renderer discovery/assembly contract**, not a medical-truth or provenance store; detailed trust graph lives in a separate on-demand index (§11).

What remains open is the reversible list in §19 — formats, projection candidates, trace representation, confidence cut-offs, tooling — none of which is blocked on a medical-expert judgement, consistent with the contract's no-mandatory-human-medical-gate model.

**After these corrections, the project is ready to move to IMPLEMENTATION PLANNING → FIRST OAP VERTICAL SLICE — not another architecture or design cycle.** Build the §17 vertical slice on the real pulmonary-congestion → OAP thread: it is small enough to complete quickly and representative enough to expose any architectural flaw before the full Item 234 conversion or any second chapter. The deliberate incorrect-threshold test (change `> 25 mmHg` to `> 30 mmHg` and confirm grounding `fail` blocks packaging) remains the acceptance test proving the pipeline can fail safely. Once the slice builds and that test blocks, an implementation plan can turn §15's ten-step sequence into concrete tasks without reopening this design.

*End of reference implementation design. Conceptual/design only — no application code, no migration, no changes to existing repository files, no redesign of the frozen architecture.*
