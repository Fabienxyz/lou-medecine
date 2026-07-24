# Blueprint Phase 4 Report — Item 234 Insuffisance cardiaque

**Date:** 2026-07-24  
**Scope:** Complete pedagogical Blueprint from canonical 109-KP Inventory  
**Inventory revision:** `phase-3c-corrected`  
**Blueprint revision:** `phase-4-blueprint`  
**Verdict:** **GO** for generating the four learner projections (Story / Overview / Mechanisms / Clinical reasoning)

Projections were **not** generated in this phase.

---

## 1. Total Blueprint element count

**22 elements**

| Type | Count | IDs |
|---|---:|---|
| Mental model | 1 | `MM-pump-decompensation` |
| Analogy (scaffolding) | 1 | `ANA-ville-pompe` |
| Mechanisms | 8 | `MEC-output-basics`, `MEC-compensation`, `MEC-remodeling`, `MEC-ef-phenotypes`, `MEC-arrhythmia`, `MEC-congestion`, `MEC-systemic-congestion`, `MEC-oap` |
| Clinical reasoning | 7 | `CR-recognize`, `CR-diagnose`, `CR-etiology`, `CR-acute`, `CR-treat-hfref`, `CR-treat-hfpef`, `CR-followup` |
| Confusion boundaries | 5 | `CONF-ef-types`, `CONF-left-right`, `CONF-transsudat-exsudat`, `CONF-bb-chronic-vs-acute`, `CONF-ccb-fe-source` |

Compression ratio (understanding KPs → elements): **91 → 22** (~4.1 KPs/element average; not uniform by design).

---

## 2. Count by element type

See table above. No actors registry, no explicit `dependencies:` block (prerequisite order is carried by `sequence`).

---

## 3. Learning sequence

Cognitive progression (not College chapter order):

1. `ANA-ville-pompe` — intuition / scaffolding  
2. `MM-pump-decompensation` — whole-chapter mental model  
3. `MEC-output-basics` — what HF is + hemodynamic fundamentals  
4. `MEC-compensation` — short-term help → long-term harm  
5. `MEC-remodeling` — structural / electrical transformation  
6. `MEC-ef-phenotypes` — HFrEF / HFmrEF / HFpEF  
7. `CONF-ef-types` — do not collapse phenotypes  
8. `MEC-arrhythmia` — FA / VA interactions  
9. `MEC-congestion` — pulmonary congestion substrate (OAP thread)  
10. `MEC-systemic-congestion` — right / systemic congestion  
11. `CONF-left-right` — left vs right congestion  
12. `MEC-oap` — PPC threshold → cardiogenic OAP  
13. `CONF-transsudat-exsudat` — cardiogenic vs lesional  
14. `CR-recognize` — clinical recognition  
15. `CR-diagnose` — NP / imaging / echo / ESC path  
16. `CR-etiology` — cause hunt  
17. `CR-acute` — acute triage & treatment logic  
18. `CONF-bb-chronic-vs-acute` — contextual beta-blocker rules  
19. `CR-treat-hfref` — chronic HFrEF strategy  
20. `CR-treat-hfpef` — HFpEF strategy  
21. `CONF-ccb-fe-source` — FE/CCB source conflict  
22. `CR-followup` — natural history, pathway, remote monitoring  

Treatment reasoning appears only after the mechanisms needed to understand *why* the strategies work.

---

## 4. KP coverage statistics

Inventory totals: **109 KPs** (91 understanding / 16 deferred-to-mastery / 2 excluded-with-justification).

| Classification | Count | Notes |
|---|---:|---|
| Understanding KPs **directly mapped** (`uses_kp`) | **91 / 91** | Every understanding KP appears on ≥1 Blueprint element |
| Understanding KPs **contextually represented** only | **0** | Not needed; direct mapping complete without Inventory mirror |
| Understanding KPs **intentionally not promoted** | **0** | — |
| Understanding KPs **missed** | **0** | Required for GO |

Many-to-many is used where pedagogically honest (e.g. KP-041 on `MEC-oap` + `CONF-transsudat-exsudat`; KP-081/KP-103 on treatment CR + `CONF-bb-chronic-vs-acute`).

Deterministic audit: `build/validate-blueprint-phase4.mjs` → `verdict: GO`.

---

## 5. Deferred-to-mastery KPs intentionally not promoted

These remain Inventory/mastery detail and do **not** become standalone Blueprint elements:

| ID | Why kept out of Blueprint |
|---|---|
| KP-031 | Extreme/terminal physical signs — mastery nuance under recognition |
| KP-037 | Age-banded high BNP rule-in thresholds — exact numbers for mastery |
| KP-044 | Full ESC biology panel list |
| KP-046 | CMR indications detail |
| KP-047 | Holter / VO₂ test minutiae |
| KP-048 | Isotope FE / viability detail |
| KP-049 | Right-heart cath normal values / RAP thresholds |
| KP-058 | High-output HF etiologies list |
| KP-070 | Full prognostic factor laundry list |
| KP-086 | Second-line drugs (ivabradine, digoxin, vericiguat…) |
| KP-088 | Antiplatelet/anticoagulant scoring detail |
| KP-093 | Secondary MR clip criteria |
| KP-094 | Transplant CI detail (incl. RAP > 5 UW) |
| KP-095 | Durable VAD strategy detail |
| KP-101 | OAP+FA rapid — digoxin IV dosing context |
| KP-102 | OAP hypertensive — nicardipine infusion range |

They may later surface under the nearest understanding element during mastery generation, without inflating the Blueprint.

Excluded navigation KPs (not learner mental structures): **KP-107**, **KP-108**.

---

## 6. Confusion boundaries

| ID | Boundary | Why it earns a node |
|---|---|---|
| `CONF-ef-types` | HFrEF vs HFpEF (with HFmrEF as therapeutic middle) | Different dominant mechanism + different treatment logic |
| `CONF-left-right` | Pulmonary vs systemic congestion | Different clinical picture; global HF common |
| `CONF-transsudat-exsudat` | Cardiogenic transudate vs lesional exudate | Validated OAP thread; trap for exams |
| `CONF-bb-chronic-vs-acute` | Continue BB (chronic/hospital) vs stop/reduce (OAP VII.A) | Source conflict — must not be universalized |
| `CONF-ccb-fe-source` | Systolic CI for diltiazem/verapamil vs HFpEF ABCDEFG rate-slowing CCB vs Notions wording | Source conflict — must stay explicit |

Not every distinction became a CONF (e.g. IEC vs ARA2 is treatment detail inside `CR-treat-hfref`).

---

## 7. Visual intent list

### Active `visual_intent` (tooling-consumed now)

| Element | Intent | Status |
|---|---|---|
| `MEC-oap` | `process-flow` | **Active** — required by OAP slice package; SVG exists |

Only `process-flow` is currently supported by `lou-build` SVG rendering. Declaring unsupported intents as active `visual_intent` would break package validation.

### Planned visuals (`visual_plan` in Blueprint frontmatter)

| Element | Planned intent | Rationale |
|---|---|---|
| `MM-pump-decompensation` | process-flow | Whole-chapter causal cascade |
| `MEC-compensation` | feedback-loop | Help → harm neurohormonal loop |
| `MEC-ef-phenotypes` | comparison | EF phenotype comparison |
| `MEC-oap` | process-flow | PPC → transudate → OAP (active) |
| `CONF-transsudat-exsudat` | comparison | Transudate vs exudate |
| `CR-diagnose` | algorithm | ESC non-urgent diagnostic path |
| `CR-acute` | algorithm | OAP / flare / shock triage |
| `CR-treat-hfref` | algorithm | Four classes + diuretic + devices |
| `CONF-bb-chronic-vs-acute` | comparison | Contextual BB rules |

**9** high-value visuals planned (target band 8–10). SVGs not generated in this phase.

---

## 8. Known ambiguities preserved

1. **FE / calcium-channel blocker conflict** — `CONF-ccb-fe-source`  
   - VI.C.8: diltiazem/verapamil contraindicated in systolic HF (KP-089)  
   - Dihydropyridines usable if associated indication (KP-090)  
   - VI.F ABCDEFG allows rate-slowing CCB in HFpEF logic (KP-096)  
   - “Notions inacceptables” conflicting wording about FE préservée  
   - **Not** normalized into one universal learner rule.

2. **Beta-blocker contextual distinction** — `CONF-bb-chronic-vs-acute`  
   - KP-081: generally continue in chronic/hospital decompensation unless failure/shock  
   - KP-103: in acute OAP (VII.A), do not introduce; if already on BB → generally stop or reduce  
   - **Not** collapsed into one universal rule.

No new unresolved medical contradiction requiring Inventory change was found.

---

## 9. Major compression decisions

| Decision | Compression | Why |
|---|---|---|
| Definition + hemodynamics | KP-001/002/005/006 → `MEC-output-basics` | One “what is pump failure” question |
| Compensation suite | KP-008/010/011/012 → `MEC-compensation` | One feedback-loop mechanism |
| Remodeling + dyssynchrony | KP-009/013 → `MEC-remodeling` | Shared structural/electrical transformation |
| EF phenotypes | KP-014/015/016 → `MEC-ef-phenotypes` + `CONF-ef-types` | Related but must stay distinguishable |
| Recognition signs/symptoms | KP-003/004/019–030 → `CR-recognize` | One recognition scaffold; epi as framing |
| Diagnostic toolkit | KP-032–036/038/039/043 → `CR-diagnose` | One confirmation pathway |
| Etiology hunt | KP-045/050–057/072/073 → `CR-etiology` | One cause-finding structure |
| Acute cascade | KP-059–063/099/100/103–106/109 → `CR-acute` | Triage + emergency treatment logic |
| HFrEF strategy | KP-064/074–085/087/089–092 → `CR-treat-hfref` | Strategy node; doses/lists stay mastery |
| HFpEF kept separate | KP-065/096 → `CR-treat-hfpef` | Must not merge into HFrEF treatment |
| Follow-up / prognosis | KP-066–069/071/097/098 → `CR-followup` | Longitudinal disease management |
| OAP thread kept atomic | KP-040 / KP-041 / KP-042 | Preserve validated identities and >25 mmHg |
| Right congestion separate | KP-007 → `MEC-systemic-congestion` | Different reasoning from pulmonary congestion |

Avoided Inventory-like 1:1 mapping and avoided giant unrelated bags (largest CR is HFrEF treatment strategy — coherent therapeutic family).

---

## 10. Concerns that should block projection generation

**None identified.**

Non-blocking notes for the next phase:

- Chapter package remains in **slice mode** (`chapter.package.yaml`) with OAP-only published projections. Projection generation for the full chapter will need package/projection registry updates — that is a projection-phase concern, not a Blueprint blocker.
- Planned non-`process-flow` visuals need renderer support before activation as `visual_intent`.
- Understanding count is **91** (not 90); Inventory is authoritative.

---

## Validation run

| Check | Result |
|---|---|
| `build/validate-blueprint-phase4.mjs` | **PASS / GO** — 91/91 understanding mapped; 0 missed; OAP intact; ambiguities present |
| `tools/lou-build` tests | **26/26 PASS** (OAP slice regression preserved) |
| Dangling KP refs | none |
| CAND-* IDs | none |
| Duplicate Blueprint IDs | none |
| Sequence prerequisite pairs | pass |

---

## Files created / modified

| File | Action |
|---|---|
| `01-learning/chapters/cardio/234/blueprint.md` | **Upgraded** OAP slice → complete Item 234 Blueprint |
| `01-learning/chapters/cardio/234/build/blueprint-phase4-report.md` | **Created** (this report) |
| `01-learning/chapters/cardio/234/build/validate-blueprint-phase4.mjs` | **Created** deterministic audit helper |
| `01-learning/chapters/cardio/234/build/blueprint-phase4-validation.json` | **Generated** by validator |

Not modified: official College source, frozen architecture docs, Inventory KP identities, learner projections, SVGs (except whatever OAP slice tests restore), mastery/QCM/flashcards.

---

## Final GO / NO-GO

**GO** — complete Blueprint is ready as the upstream for generating Story, Overview, Mechanisms, and Clinical-reasoning projections.

Do **not** start projection generation until explicitly requested.
