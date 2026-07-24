# Bootstrap: independent full-chapter reconciliation (Item 234)

Produce `build/reconciliation.yaml` only.

## Inputs

- `official-college.md` (verbatim College source for Item 234)
- `inventory.yaml` (chapter Knowledge Inventory — independent extraction output)
- `source.meta.yaml` (`sections[]` structural index — traversal guide, not a coverage claim)

## Task

Perform an **independent** section-by-section reconciliation pass:

1. Traverse every relevant source segment listed in `source.meta.yaml` sections (and sub-segments within long sections as needed).
2. Assign each segment exactly one disposition:
   - `represented` — covered by one or more KPs (list `kp: [KP-…]`)
   - `intentionally-deferred` — captured in Inventory, routed to mastery (note required)
   - `excluded-with-justification` — out of understanding scope with recorded reason
   - `missed` — no KP covers an important segment (**blocks publication**)
   - `ambiguous` — uncertain mapping (requires `note`; unresolved blocks publication)
3. Set `status: pass` **only if** there are zero genuinely `missed` relevant segments and no unresolved `ambiguous` segments.

## Output artifact contract

```yaml
chapter: cardio/234
scope: full-chapter-understanding-v1
reconciliation_scope: "<human-readable chapter scope string>"
required_segment_ids:
  - seg-...
  # every segment ID that must appear under segments[]
methodology: bootstrap-cursor-v2
status: pass | fail

segments:
  - id: seg-...
    label: ...
    section_path: ...
    disposition: represented | intentionally-deferred | excluded-with-justification | missed | ambiguous
    kp: [KP-...]   # when represented
    note: ...     # when deferred/excluded/ambiguous
```

## Rules

- Do **NOT** modify `inventory.yaml`.
- Do **NOT** fake coverage with keyword matching.
- Do **NOT** populate out-of-scope Item 234 content as fake exclusions to pad the artifact.
- `status: pass` alone is insufficient — every ID in `required_segment_ids` must be present with an allowed disposition.
- Any `missed` relevant segment → `status: fail`.
- This artifact proves **declared chapter reconciliation scope** completeness, not learner pedagogy.

## Independence

Use a different prompt/model invocation from Inventory extraction. The reconciler must be able to **disagree** with the extractor.
