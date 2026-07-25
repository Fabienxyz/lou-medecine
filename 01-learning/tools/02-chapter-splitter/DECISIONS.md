# Tool 02 — Architectural Decision Log

**Tool:** `lou-chapter-splitter`  
**Release:** v1.0.0 (frozen)

Single authoritative record of architectural decisions for Tool 02.

Future architectural decisions must be appended here rather than duplicated elsewhere.

| Document | Responsibility |
|---|---|
| `README.md` | What the tool does and how to use it |
| `CONTRACT.md` | Behavioural guarantees for downstream tools |
| `CHANGELOG.md` | What changed over time |
| `DECISIONS.md` | Why the architecture is the way it is |

---

# ADR-001

**Title**

Exact Markdown slices — no rewriting

**Status**

Accepted

**Date**

2026-07-25

**Context**

Tool 02 sits between Tool 01’s canonical Markdown and later semantic tools. Any rewrite would corrupt the textual source of truth.

**Decision**

Chapter files are exact slices of `official-college.md`. No formatting changes, normalization, summarization, or in-file metadata.

**Rationale**

Fidelity and determinism require byte-preserving extraction. Interpretation belongs downstream.

**Consequences**

Positive: round-trip equality is enforceable; Tool 01 guarantees remain intact.  
Trade-off: imperfect Tool 01 artifacts are passed through unchanged.  
Future impact: Tool 03+ must not expect cleaned chapter prose from Tool 02.

---

# ADR-002

**Title**

Chapter boundaries from Markdown H1 structure only

**Status**

Accepted

**Date**

2026-07-25

**Context**

Tool 01 emits chapters as ATX H1 headings. Hardcoding titles or specialty lists would break generality.

**Decision**

Chapters are detected solely as ATX level-1 headings (`# …`). No specialty-, chapter-, or vocabulary-specific boundary rules.

**Rationale**

Structural Markdown is the stable contract from Tool 01. Semantic guessing is forbidden.

**Consequences**

Positive: generic across Colleges; fail-closed when H1s are missing or ambiguous.  
Trade-off: documents without H1 chapters cannot be split.  
Future impact: Tool 01 H1 chapter emission remains a hard dependency.

---

# ADR-003

**Title**

Filenames derived only from document heading content

**Status**

Accepted

**Date**

2026-07-25

**Context**

Downstream tools need stable filesystem names. Catalogs of EDN items or College-specific rename tables would couple Tool 02 to a specialty.

**Decision**

Filenames are derived only from the chapter H1 text: optional numeric identifier found in that text + slug of the remaining title. No external EDN/College filename maps.

**Rationale**

Content-derived names stay generic and auditable. The filename becomes a validation artifact of detection.

**Consequences**

Positive: deterministic, portable naming; collisions fail closed.  
Trade-off: odd heading punctuation yields long slugs; missing numbers omit the `item-` prefix.  
Future impact: renaming for pedagogy is out of scope.

---

# ADR-004

**Title**

Mandatory round-trip property

**Status**

Accepted

**Date**

2026-07-25

**Context**

Silent line loss or overlap would poison Tool 03.

**Decision**

Validation must prove that concatenating chapter files in order reconstructs the original Markdown exactly. Failure aborts the run.

**Rationale**

Round-trip is the strongest mechanical proof of coverage (no missing, duplicated, or overlapping lines).

**Consequences**

Positive: high confidence for downstream consumers.  
Trade-off: newline boundary handling must be precise.  
Future impact: any future split strategy must preserve this property.

---

# ADR-005

**Title**

Fail closed — never guess boundaries

**Status**

Accepted

**Date**

2026-07-25

**Context**

Ambiguous headings, empty chapters, duplicates, or preamble-before-H1 cannot be resolved without semantics.

**Decision**

On ambiguous or invalid structure, Tool 02 aborts with an explicit error. No silent repair.

**Rationale**

Guessing would violate determinism and Tool 01’s fidelity chain.

**Consequences**

Positive: unsafe outputs never ship.  
Trade-off: imperfect upstream Markdown must be fixed in Tool 01, not patched here.  
Future impact: Tool 02 stays a pure splitter.

---

# ADR-006

**Title**

No semantic interpretation in Tool 02

**Status**

Accepted

**Date**

2026-07-25

**Context**

Lou separates conversion (Tool 01), splitting (Tool 02), and knowledge work (Tool 03+).

**Decision**

Tool 02 must never summarize, interpret, classify medical concepts, or use AI/LLMs.

**Rationale**

Keeps Tool 02 a frozen deterministic building block.

**Consequences**

Positive: narrow scope; stable dependency for Tool 03.  
Trade-off: title quality equals Tool 01 heading quality.  
Future impact: semantic enrichment is explicitly Tool 03+ territory.
