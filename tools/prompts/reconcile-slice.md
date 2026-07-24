# Bootstrap: independent reconciliation for OAP slice

Produce `build/reconciliation.yaml` only.

Inputs: official-college.md (in-scope lines 254–261, 265–270), inventory.yaml, declared slice_scope.

Rules:
- Do NOT modify inventory.yaml
- Do NOT disposition out-of-scope chapter content
- Every in-scope segment: represented | deferred | excluded-with-justification | missed | ambiguous
- Any missed in-scope segment → status: fail

Output: YAML matching existing reconciliation.yaml structure.
