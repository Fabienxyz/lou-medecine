# Item 234 — Independent Full-Chapter Re-Reconciliation (v2)

**Chapter:** cardio/234 — Insuffisance cardiaque  
**Edition:** 2024-SFC  
**Methodology:** `independent-source-to-inventory-v2`  
**Artifact:** `build/reconciliation-full-v2.yaml`  
**Status:** **FAIL**

Fidelity-assurance only. Canonical `inventory.yaml`, `official-college.md`, Blueprint, projections, SVGs, and renderer were **not** modified. Historical Phase 3 FAIL artifacts (`reconciliation-full.yaml` / report) were **not** overwritten. OAP slice fixture left intact.

Primary pass was SOURCE → Inventory from scratch. Historical Phase 3 / 3B conclusions were read only after v2 findings were frozen.

---

## 1. Totals

| Metric | Count |
|---|---:|
| Fresh source segments reconciled | **83** |
| Inventory KPs (canonical) | **109** |
| Reverse-check mapped | **109 / 109** |
| Orphan KPs | **0** |

## 2. Counts by disposition

| Disposition | Count |
|---|---:|
| represented | 58 |
| deferred | 16 |
| excluded-with-justification | 5 |
| missed | **2** |
| ambiguous | **2** |

Segment granularity is coarser than Phase 3 v1 (83 vs 134): semantic units, not 1:1 with prior segment IDs. Disposition honesty is independent of segment count.

## 3. Overall status

**FAIL**

Drivers:
1. Two genuine medically relevant `missed` segments in VI.B.1 Régime hyposodé (blocking).
2. Two `ambiguous` segments documenting the FE/CCB source conflict (safely preserved; not forced into a fake settled fact).

---

## 4. All missed facts

| ID | Section | Evidence | Why missed |
|---|---|---|---|
| `SEG-061b` | VI.B.1 Régime hyposodé | Régime sans sel peut être **nuisible** → dénutrition ; aide diététicien ; éviter sels de régime riches en K⁺ ; utiliser des épices | KP-074 only carries the ≤5–6 g/j target. KP-075 covers progressive weight loss as severity/prognosis, not diet-induced denutrition from overly strict salt restriction. |
| `SEG-061c` | VI.B.1 Régime hyposodé | Après écart de régime → augmenter la dose de diurétiques le jour même, voire le lendemain | Patient self-management rule absent from KP-074 / KP-075 / KP-084. |

No other genuine medically relevant misses identified on this pass.

---

## 5. Ambiguities

### 5.1 `SEG-AMB-01` / `SEG-102` — diltiazem / vérapamil vs FE phenotype

| Pole | Locus | Wording |
|---|---|---|
| CI systolique | VI.C.8 | diltiazem / vérapamil **contre-indiqués dans l’IC systolique** |
| Allow HFpEF | VI.F ABCDEFG « A » | **inhibiteur calcique ralentisseur** usable for rate control / diastolic filling |
| CI FE préservée | Notions inacceptables | CI **dans l’IC à FE préservée** (vérapamil / diltiazem / flécaïne) |

- **Type:** source-internal wording conflict (not OCR-obvious).
- **Inventory handling:** KP-089 anchors systolique CI and notes Notions conflict; KP-096 covers HFpEF ABCDEFG without normalizing; no invented universal HFpEF CCB rule.
- **Blocking for learner claim:** yes (must not assert a single settled FE-préservée CCB rule).
- **Blocking for Inventory fidelity:** no, if contradiction remains explicit and unsettled (**safely preserved**).

### 5.2 Beta-blockers continue vs stop/reduce — **not ambiguous after contextual reading**

| Pole | Locus | Rule |
|---|---|---|
| Continue | VI.C.2 | Hospitalisation pour décompensation : **ne pas arrêter** le BB sauf échec thérapeutique ou choc cardiogénique → **KP-081** |
| Stop/↓ | VII.A OAP | Ne pas introduire ; si déjà sous BB → **généralement arrêté ou ↓ posologie** → **KP-103** |

Context resolves the apparent contradiction. Inventory preserves both section-scoped rules. Do **not** collapse to always-continue or always-stop. Recorded as `SEG-AMB-02` with disposition **represented** (documentation of the dual-context check).

---

## 6. Reverse check (109/109)

| Check | Result |
|---|---|
| Orphan KP | **none** |
| Duplicate semantic KP | **none** |
| Over-broad KP | none flagged as fidelity-blocking on this pass |
| Insufficient anchor support | **KP-076** (contraception in label, no contraception quotes); **KP-096** (ABCDEFG without explicit rate-slowing CCB quote); **KP-100** (morphine caveat anchored but absent from label) |
| Disposition inconsistency | none (understanding / deferred-to-mastery / excluded rows match segment dispositions) |
| KP-040 / KP-041 / KP-042 | **preserved** |
| CAND IDs | **none** |

---

## 7. Secondary comparison (after freeze)

Compared against:
- `build/reconciliation-full.yaml` + `reconciliation-full-report.md` (Phase 3 FAIL, 12 missed / 3 ambiguous, 108 KPs)
- `build/inventory-phase3b-corrections.yaml` (enriched 10 KPs + minted KP-109 → 109 KPs)

### 7.1 Previous 12 Phase 3 misses — now resolved?

| Phase 3 ID | Topic | v2 verdict |
|---|---|---|
| M1 | NYHA stage criteria | **Resolved** — KP-019 enriched |
| M2 | NP non-acute dosing gate | **Resolved** — KP-043 enriched |
| M3 | NP unavailable → echo | **Resolved** — KP-043 enriched |
| M4 | Revascularization decision | **Resolved** — KP-045 enriched |
| M5 | OAP troponin semantics | **Resolved** — KP-060 enriched |
| M6 | OAP GDS hypoxie/hypocapnie | **Resolved** — KP-060 enriched |
| M7 | SCA + IC dual management | **Resolved** — **KP-109** minted |
| M8 | Weight loss without edema | **Resolved** — KP-075 enriched |
| M9 | IEC Enc. 18.3 surveillance | **Resolved** — KP-078 enriched |
| M10 | BB post-IDM asymptomatic | **Resolved** — KP-081 enriched |
| M11 | BB Enc. 18.4 CI | **Resolved** — KP-081 enriched |
| M12 | VI.C keep-on-BB rule | **Resolved** — KP-081 + KP-103 dual-anchored |

**All 12 previous misses are adequately represented in the current 109-KP Inventory.**

### 7.2 New missed facts (not in Phase 3’s 12)

Yes — **2 new misses** (SEG-061b, SEG-061c) in régime hyposodé caveats / self-management. Phase 3 did not flag these; Phase 3B did not introduce them as regressions — they are residual gaps relative to the official source.

### 7.3 Ambiguities: old vs new

| Topic | Phase 3 | v2 |
|---|---|---|
| FE / diltiazem-vérapamil | unresolved (2 related ambiguous segments) | **remains** — safely preserved (`SEG-AMB-01` / `SEG-102`) |
| BB continue vs stop | left as unresolved contradiction | **contextually clarified** — both poles represented (KP-081 / KP-103); not blocking |

### 7.4 KP-109

Correctly source-mapped to IV.A.2 (« il faut à la fois prendre en charge le syndrome coronarien et traiter la poussée d’IC »). Disposition understanding. Segment `SEG-042`.

### 7.5 Phase 3B regressions

No regression of the prior 12 corrections. BB dual-anchoring improved fidelity. Residual régime-hyposodé gaps were not created by 3B; they remain unaddressed.

---

## 8. Critical conclusions

### Beta-blockers
Context-dependent dual rule, both inventory-represented:
- **VI.C hospitalization for decompensation:** continue unless failure/shock (**KP-081**).
- **VII.A OAP:** do not introduce; if already on BB, generally stop or reduce (**KP-103**).

### Diltiazem / vérapamil
Source conflict across VI.C.8 (CI systolique), VI.F (rate-slowing CCB allowed in FE préservée), and Notions inacceptables (CI in FE préservée). Safely preserved as unresolved; KP-089 documents the conflict.

### KP-109
Mapped and adequate.

---

## 9. GO / NO-GO for Blueprint

**NO-GO** for Blueprint construction.

Reasons:
1. Two genuine `missed` facts remain (blocking FAIL).
2. FE/CCB ambiguity must stay explicit if any later projection touches calcium-channel blockers / HFpEF CI claims.

Recommended next fidelity step (out of scope here): enrich Inventory for SEG-061b/c only — do not start Blueprint until missed = 0.

---

## 10. Files created

| File | Action |
|---|---|
| `build/reconciliation-full-v2.yaml` | **created** |
| `build/reconciliation-full-v2-report.md` | **created** |
| `build/validate-reconciliation-full-v2.mjs` | **created** |

Not modified: `inventory.yaml`, `official-college.md`, historical `reconciliation-full.*`, OAP `reconciliation.yaml`, Blueprint, projections, figures, renderer.
