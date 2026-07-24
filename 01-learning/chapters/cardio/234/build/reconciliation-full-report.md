# Phase 3 — Full-Chapter Independent Reconciliation Report

**Chapter:** cardio/234 — Insuffisance cardiaque  
**Edition:** 2024-SFC  
**Methodology:** independent-source-to-inventory-v1  
**Artifact:** `build/reconciliation-full.yaml`  
**Status:** **FAIL**

This pass is SOURCE → Inventory only. Pedagogical assets were not used. Canonical `inventory.yaml` was not modified. OAP slice `build/reconciliation.yaml` was left untouched.

---

## 1. Totals

| Metric | Count |
|---|---:|
| Source segments reconciled | **134** |
| Inventory KPs accounted (reverse check) | **108 / 108** |
| Orphan KPs | **0** |

## 2. Counts by disposition

| Disposition | Count |
|---|---:|
| represented | 97 |
| deferred | 17 |
| excluded-with-justification | 5 |
| missed | **12** |
| ambiguous | **3** |

## 3. Overall status

**FAIL**

Drivers:
1. Twelve medically relevant `missed` segments (blocking; no numeric tolerance).
2. Three unresolved `ambiguous` segments, including the known FE wording conflict and an internal BB keep-vs-stop contradiction.
3. Several KP label/anchor support problems that would make learner output unsafe if projected as sole truth (notably KP-103).

---

## 4. All `missed` findings

| ID | Section | Evidence (abbrev.) | Why no adequate KP | Suggested correction |
|---|---|---|---|---|
| `seg-II-A1-nyha-stages` | II.A.1 / Tableau 18.1 | NYHA I–IV stage criteria (effort thresholds, rest symptoms) | KP-019 names NYHA only | Enrich KP-019 with Tableau 18.1 anchors |
| `seg-II-E-indication-dosage` | II.E | Risk factors + symptoms/signs/abnormal ECG → dose NP | Not in KP-043 | Enrich KP-043 |
| `seg-II-E-np-indisponible` | II.E | NP unavailable → echocardiography | Not in KP-043 | Enrich KP-043 |
| `seg-II-H-revasc` | II.H | Stenosis + ischemia/viability → discuss revascularization | KP-045 covers coro indication/CMD orientation only | Enrich KP-045 |
| `seg-IV-A1-troponine` | IV.A.1 | Moderate troponin rise possible without ACS | KP-060 urgency/clinical only | Enrich KP-060 or mint OAP workup KP |
| `seg-IV-A1-gds` | IV.A.1 | GDS: hypoxie/hypocapnie | Same | Bundle with OAP workup enrichment |
| `seg-IV-A2-sca-dual` | IV.A.2 | Acute HF during SCA requires dual SCA + HF management | KP-062/106 list SCA as trigger/checklist only | Mint understanding KP |
| `seg-VI-B2-poids-perte` | VI.B.2 | Progressive weight loss without edema = malnutrition / poor prognosis | KP-075 covers gain alert only | Enrich KP-075 |
| `seg-VI-C1-iec-encadre` | VI.C.1 Enc. 18.3 | Creatinine >20–30% stop/↓; avoid simultaneous IEC+ARM start | KP-078 has indication/CI only | Enrich KP-078 (or deferred procedural KP) |
| `seg-VI-C2-bb-postidm` | VI.C.2 | BB also post-IDM if FE low even without IC symptoms | Absent from KP-081 | Enrich KP-081 |
| `seg-VI-C2-bb-encadre` | VI.C.2 Enc. 18.4 | BB CI: severe asthma/COPD, symptomatic bradycardia/hypotension, BAV2/3 | Absent from KP-081 | Enrich KP-081 |
| `seg-VI-C2-bb-ne-pas-arreter` | VI.C.2 | Do **not** stop BB on decompensation hospitalization except non-response/shock | Unrepresented; conflicts with KP-103 | Dual-anchor with VII pole; do not absorb into KP-103 |

---

## 5. All `ambiguous` findings

### 5.1 `seg-ambig-fe-ci-notions` — FE préservée vs IC systolique (CI calcium antagonists)

Three College poles:

| Pole | Exact locus | Wording |
|---|---|---|
| Body VI.C.8 | Traitements contre-indiqués | diltiazem / vérapamil **contre-indiqués dans l’IC systolique** |
| Body VI.F | HFpEF ABCDEFG « A » | allows **inhibiteur calcique ralentisseur** for rate control / diastolic filling |
| Notions inacceptables | Terminal meta | CI **dans l’IC à FE préservée** (vérapamil / diltiazem / flécaïne) |

Assessment:
- This is a **genuine wording conflict**, not silently resolvable.
- Not clearly OCR corruption (readable French in all three places).
- Body treatment sections are more mutually coherent if CI applies to systolic/HFrEF while rate-slowing CCB may be used in HFpEF; Notions reverse the phenotype for the CI.
- Related KPs: KP-089 (body-faithful, notes conflict), KP-090 (dihydropyridines), KP-096 (HFpEF treatment / ABCDEFG).
- Conservative handling: keep KP-089 anchored to IC systolique; do **not** mint a settled CI-in-HFpEF KP from Notions alone; flag Notions + VI.F CCB clause as unresolved.

### 5.2 `seg-VI-F-ccb-hfpef`

Same conflict cluster from the VI.F CCB-allowance pole; KP-096 does not specifically anchor the CCB clause.

### 5.3 `seg-ambig-bb-stop` — BB already on board during acute decompensation

| Pole | Exact wording | Locus |
|---|---|---|
| Keep | « il n’est pas recommandé d’arrêter le bêtabloquant sauf en cas de difficulté de réponse au traitement ou de choc cardiogénique » | VI.C.2 |
| Stop/↓ | « si le patient est déjà sous bêtabloquant, il est généralement arrêté ou sa posologie est diminuée » | VII.A |

Inventory currently encodes only VII.A via KP-103 → chapter-wide overclaim. Both poles must remain dual-anchored as ambiguous until the College edition clarifies.

---

## 6. KP anchor-support problems

| KP | Issue |
|---|---|
| KP-019 | Claims NYHA I–IV without Tableau 18.1 criteria |
| KP-033 | Misplaced unilateral XR-forms anchor (belongs with KP-034) |
| KP-043 | Label claims full non-acute algorithm; anchors only thresholds |
| KP-044 | Full biology panel listed; thin single intro anchor |
| KP-060 | Over-broad « clinique typique » hides troponin/GDS facts |
| KP-076 | Over-broad lifestyle/work/contraception bundle (mostly anchored) |
| KP-081 | Under-anchored vs body (post-IDM, Enc. 18.4 CI, VI.C keep-rule) |
| KP-089 | Correct non-normalization of FE conflict; incomplete vs VI.F CCB allowance |
| KP-096 | ABCDEFG without CCB-rate-slower anchor; conflict-linked |
| KP-103 | Presents stop/↓ as the rule; unsafe vs VI.C keep-rule |

---

## 7. Orphan / duplicate KPs

- **Orphans:** none (all 108 KPs mapped from ≥1 segment, including excluded meta rows KP-107/108).
- **True duplicates:** none.
- Near-neighbors kept intentionally distinct: KP-022 vs KP-060 (OAP manifestation vs emergency form); KP-041 vs KP-060 (physiology vs clinic).

---

## 8. Disposition mismatches

| KP | Issue |
|---|---|
| KP-101 | `deferred-to-mastery` while Notions require OAP management to be perfectly known (FA precipitant protocol) |
| KP-102 | Same for nicardipine IV hypertensive surge |
| KP-103 | Understanding OK for VII pole alone; unsafe as sole chapter truth given VI.C contradiction |

---

## 9. Highest-complexity source sections

1. **VI.C treatment of HFrEF** — dense drug/device rules + Encadrés + BB keep-rule conflicting with VII.
2. **II.E BNP / ESC non-acute pathway** — multi-branch thresholds; Inventory incomplete.
3. **IV.A acute HF / OAP** — clinical form + workup semantics + SCA dual care.
4. **VI.F HFpEF + terminal Notions** — FE CI conflict cluster.
5. **Hiérarchisation** — OCR-corrupted meta table (excluded; ranks remain unknown).

---

## 10. FE préservée / IC systolique conflict — conclusion

Unresolved source conflict. Body VI.C.8 CI in **IC systolique** vs Notions CI in **IC à FE préservée**, further tensioned by VI.F allowing rate-slowing CCB in HFpEF. Phase 2C stance (no silent normalization; KP-089 body-anchored) is confirmed. Reconciliation disposition: **ambiguous** (blocking for fidelity certification together with misses).

---

## 11. Recommended Inventory corrections (do not apply yet)

Priority 1:
- Enrich KP-075 (weight-loss / malnutrition / prognosis).
- Enrich KP-081 (post-IDM asymptomatic; Enc. 18.4 CI; surface VI.C keep-rule).
- Dual-anchor BB keep vs stop/↓ (KP-103 + new/paired ambiguous handling).
- Enrich/mint OAP workup (troponin, GDS).
- Mint SCA+IC dual-management KP.
- Enrich KP-019 (NYHA stages).

Priority 2:
- Enrich KP-043, KP-045, KP-078.
- Anchor hygiene KP-033/034.
- Conflict-flag KP-089/KP-096 for FE wording.

Priority 3:
- Review disposition of KP-101/KP-102 (possibly promote to understanding).

Identity guidance:
- Prefer enrich over casual split/merge for KP-019/043/045/075/078/081.
- Preserve frozen KP-040/041/042.
- If minting, allocate IDs after KP-108 with lineage; do not mint settled CI-in-HFpEF from Notions alone.

---

## 12. Validation

```text
node 01-learning/chapters/cardio/234/build/validate-reconciliation-full.mjs
→ VALIDATION PASS
   status: fail
   total_segments: 134
   missed: 12
   ambiguous: 3
   mapped_kps: 108/108
```

OAP slice reconciliation artifact unchanged. No `chapter_reconciliation_invariant: pass` claimed for full chapter.

---

## 13. GO / NO-GO for next phase

**NO-GO** for Chapter Blueprint construction.

**GO** only for a subsequent **Inventory correction** phase that:
1. clears medically relevant misses (or explicitly defers with justification),
2. dual-anchors unresolved source ambiguities without inventing medical truth,
3. repairs unsafe overclaims (especially KP-103),
4. re-runs full-chapter reconciliation to a non-fail status.

Do not start Blueprint, projections, SVGs, or publishing until Inventory correction + re-reconciliation succeed.
