# Phase 5 — Independent Projection Audit (Item 234)

**Auditor role:** separate from generation. This pass judges Blueprint coverage, KP surface, cognitive roles, conflicts, and OAP regression. It does **not** re-certify medical truth beyond Inventory/Blueprint grounding constraints.

**Inputs audited:**
- `blueprint.md` (phase-4-blueprint)
- `inventory.yaml` (109 KPs; 91 understanding)
- four understanding projections + `projections.yaml`
- machine check: `build/projection-phase5-validation.json`

**Verdict: GO** for Lou renderer testing of understanding v1.

---

## A. Blueprint coverage — 22/22

| Element | Primary projection(s) | Role |
|---|---|---|
| ANA-ville-pompe | story | intuition scaffolding |
| MM-pump-decompensation | story, overview | chapter mental model |
| MEC-output-basics | overview (compressed), mechanisms | definition / pump failure |
| MEC-compensation | overview (compressed), mechanisms | help → harm loop |
| MEC-remodeling | mechanisms | structural damage |
| MEC-ef-phenotypes | overview (table), mechanisms | FE phenotypes |
| CONF-ef-types | mechanisms | at FE phenotype moment |
| MEC-arrhythmia | overview (1 line), mechanisms | FA / sudden death |
| MEC-congestion | overview, mechanisms | pulmonary congestion chain |
| MEC-systemic-congestion | mechanisms | right-sided stasis |
| CONF-left-right | mechanisms | left vs right congestion |
| MEC-oap | overview (bridge claim), mechanisms | PPC → transudate → OAP |
| CONF-transsudat-exsudat | mechanisms (+ overview OAP bridge) | cardiogenic vs lesional |
| CR-recognize | overview (compressed), clinical-reasoning | recognition |
| CR-diagnose | overview (compressed), clinical-reasoning | NP / echo / ESC path |
| CR-etiology | clinical-reasoning | cause hunt |
| CR-acute | clinical-reasoning | acute triage |
| CONF-bb-chronic-vs-acute | clinical-reasoning | BB context split |
| CR-treat-hfref | overview (1 line), clinical-reasoning | HFrEF logic |
| CR-treat-hfpef | overview (1 line), clinical-reasoning | HFpEF logic |
| CONF-ccb-fe-source | clinical-reasoning | FE/CCB source conflict |
| CR-followup | clinical-reasoning | monitoring / pathway |

**Unexplained Blueprint misses:** none.

---

## B. Understanding KP coverage — 91/91

Machine claim-trace surface: **91/91 understanding KPs** referenced in at least one claim block.

Classification used for this audit:
- **Directly surfaced:** KP appears in claim-trace metadata attached to learner-facing locators → **91**
- **Contextually compressed:** many of those 91 are taught as short tables / IF-THEN rows rather than full Inventory labels (expected and desirable)
- **Unexplained gaps:** **0**

Deferred-to-mastery (16): not flooded into core understanding. No deferred KP is required for v1 coherence beyond optional later mastery.

Excluded-with-justification (2): correctly absent from projections.

---

## C. Projection-role purity

| Projection | Intended job | Audit |
|---|---|---|
| story | intuition | PASS — analogy only; medical bridge short; no doses/criteria dump |
| overview | orientation / compression | PASS — 8-question mental map; tables; points to Pourquoi / Raisonnement |
| mechanisms | causal WHY | PASS — MEC-* sections with chains; not a diagnostic checklist |
| clinical-reasoning | decision logic | PASS — IF/THEN and triage; physiology not re-taught in full |

No section found that turns Histoire into a textbook, Overview into an encyclopedia, Mechanisms into a clinical checklist, or Clinical reasoning into physiology repetition.

---

## D. Duplication

Intentional cross-projection echoes (different cognitive jobs):
- Congestion / OAP: overview one-liner + mechanisms full chain + clinical OAP triage
- FE phenotypes: overview table + mechanisms CONF table
- HFrEF/HFpEF treatment: overview one-line place + clinical decision logic

**Removed / avoided vs legacy slice:**
- Replaced slice-only overview OAP paragraph as sole overview content with full mental map (kept `cb-overview-oap` for regression)
- Expanded mechanisms beyond MEC-oap-only without copying clinical algorithms into Pourquoi

No substantial identical paragraph copied across three projections.

---

## E. Cognitive load

Flags reviewed:
- Long unstructured paragraphs: not dominant; hierarchy + tables used
- Giant flat lists: avoided; CHAMPIT / 4 classes kept as compact decision frames
- Mastery detail: drug doses, transplant RAP, rare thresholds deferred
- Clinical-reasoning is the longest file (~13.5 KB) but sectioned by clinical question — acceptable for its job

---

## F. Confusion boundaries — 5/5

| CONF | Where surfaced |
|---|---|
| CONF-ef-types | mechanisms (after FE phenotypes) |
| CONF-left-right | mechanisms (after systemic congestion) |
| CONF-transsudat-exsudat | mechanisms (after MEC-oap); overview OAP bridge |
| CONF-bb-chronic-vs-acute | clinical-reasoning (after acute triage) |
| CONF-ccb-fe-source | clinical-reasoning (after HFpEF) |

---

## G. Source conflicts

### FE / CCB (`CONF-ccb-fe-source`)
Preserved explicitly in clinical-reasoning:
- VI.C.8 systolic CI for diltiazem/verapamil (+ DHP usable if indicated)
- VI.F ABCDEFG HFpEF rate-slowing CCB allowance
- Notions inacceptables conflict called out — **no universal resolution invented**

### Beta-blockers (`CONF-bb-chronic-vs-acute`)
Both poles preserved:
- chronic/hospital (non-OAP): generally continue unless failure/shock
- acute OAP: do not introduce; if already on BB → stop/reduce

No “always continue” / “always stop” statements.

---

## H. OAP regression — PASS

Preserved:
- `MEC-congestion`, `MEC-oap`, `CONF-transsudat-exsudat`
- Claim IDs: `cb-oap-bridge`, `cb-oap-threshold`, `cb-oap-contrast`, `cb-overview-oap`
- KPs: KP-040 / KP-041 / KP-042
- Threshold wording: **PPC > 25 mmHg**
- Deterministic grounding: pass (expected 25, found 25)

Existing visual kept: `figures/mec-oap.svg`.

---

## I. High-specificity grounding

| Claim family | Status |
|---|---|
| PPC > 25 mmHg | deterministic PASS vs KP-041 |
| FE ≤40 / 41–49 / ≥50 | sourced to KP-014/015/016 |
| Acute NP rule-out BNP <100 / NT-proBNP <300 | sourced to KP-036 |
| ESC non-urgent NP path | sourced to KP-043 (role, not dose minutiae) |
| CHAMPIT | sourced to KP-106 |
| Four HFrEF classes | sourced to KP-077 (+ related class KPs) |
| CCB / BB contextual rules | sourced; conflicts explicit |

No invented numeric thresholds observed. Deferred mastery numbers (e.g. KP-037 high rule-in bands, transplant RAP) not promoted.

Semantic grounding: only pre-existing bootstrap allowlist (`cb-oap-bridge`, `cb-overview-oap`). New medical claims are `sourced` — no fake PASS fixtures added.

---

## J. Claim-trace / traceability

- Claim-trace completeness: OK (89 claim blocks; locator ↔ metadata 1:1)
- Unknown KP refs: none
- Assembler path claim → KP → Inventory anchor → College remains intact
- `build/traceability.json` regenerated by successful build

---

## K. Visual recommendations (next phase — not implemented)

| Blueprint element | Recommended intent | Why |
|---|---|---|
| MM-pump-decompensation | process-flow / cascade | whole-chapter mental model |
| MEC-compensation | feedback-loop | short-term help → long-term harm |
| MEC-ef-phenotypes / CONF-ef-types | comparison | HFrEF vs HFmrEF vs HFpEF |
| MEC-oap | process-flow (**exists**) | PPC → transudate → OAP |
| CONF-transsudat-exsudat | comparison | cardiogenic vs lesional |
| CONF-left-right | comparison | pulmonary vs systemic congestion |
| CR-diagnose | algorithm | ESC NP → echo path |
| CR-acute | algorithm | OAP / global flare / shock triage |
| CR-treat-hfref | algorithm | 4 classes + diuretic + devices |
| CONF-bb-chronic-vs-acute | comparison | continue vs stop/reduce by context |

Do **not** expand to 8–10 SVGs in this phase; MEC-oap remains the only active rendered visual.

---

## L. Tests / build

| Check | Result |
|---|---|
| `lou-build` npm test | 26/26 PASS |
| Claim-trace completeness | PASS |
| Deterministic OAP threshold grounding | PASS |
| Chapter validate / build | PASS when chapter artifacts not mid-corruption by concurrent tests |
| Manifest projections order | story → overview → mechanisms → clinical-reasoning |

Note: package mode remains `slice` with OAP-scoped reconciliation invariant (architectural hold from prior phases). Understanding projections are full-chapter; publication gate still uses the validated OAP reconciliation scope.

---

## M. Final gate

**GO** for Lou renderer testing of the four understanding projections.

Stop conditions not triggered:
- no major Blueprint element missing
- no unexplained understanding KP gap
- Inventory semantics / permanent KP IDs unchanged
- source conflicts not silently resolved
- claim traceability maintained
- OAP regression intact
- no fake semantic PASS for new bridging claims

**Out of scope (correctly not started):** visual expansion phase, mastery, QCM, flashcards, readiness, adaptive learning.
