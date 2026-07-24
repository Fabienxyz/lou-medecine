# Phase 2A — Inventory Extraction Report (Item 234)

**Status:** review candidate only  
**Source:** `01-learning/chapter-analysis/cardio/234-insuffisance-cardiaque/official-college.md` (2024-SFC)  
**Artifact:** `build/inventory-candidate.yaml`  
**Canonical slice inventory untouched:** `chapters/cardio/234/inventory.yaml`

---

## 1. Total candidate KP count

**99** knowledge points (including 2 explicitly excluded navigation items).

- Medical propositional KPs: **97**
- Excluded-with-justification: **2** (Situations de départ list; Réflexes transversalité)

No predetermined count (~80–95) was used as a target.

---

## 2. Count by major source section

| Major section | Candidate KPs |
|---|---:|
| I. Généralités | 20 |
| II. Diagnostic | 26 |
| III. Diagnostic étiologique | 10 |
| IV. Formes cliniques | 7 |
| V. Évolution, complications, pronostic | 6 |
| VI. Traitement de l’insuffisance cardiaque chronique | 22 |
| VII. Traitement de l’insuffisance cardiaque aiguë | 6 |
| Situations de départ | 1 (excluded) |
| Réflexes transversalité | 1 (excluded) |
| **Total** | **99** |

Hiérarchisation des connaissances and Points-clés / Notions were used only as cross-checks for emphasis; they did **not** mint separate KPs when they merely restated body content.

---

## 3. Count by disposition

| Disposition | Count |
|---|---:|
| understanding | 85 |
| deferred-to-mastery | 12 |
| excluded-with-justification | 2 |

Deferred examples: detailed biological workup list, age-banded BNP rule-in thresholds, IRM/Holter/VO2/cath detail clusters, 2nd-line drugs, anticoagulation scoring detail, clip mitral, ECMO/destination therapy detail, advanced physical signs (pouls alternant/cachexie), IC à débit augmenté list.

---

## 4. Anchors

| Pattern | Count |
|---|---:|
| One anchor | 36 |
| Multiple anchors | 63 |
| Unresolved / missing anchors | **0** |

Every candidate quote was checked to resolve uniquely (after whitespace normalization) against `official-college.md`.

---

## 5. Rank distribution and uncertainties

| Rank | Count |
|---|---:|
| A | 3 (KP-040, KP-041, KP-042 only — preserved from validated slice) |
| B | 0 |
| unknown | 96 |

**Reason:** the source “Hiérarchisation des connaissances” table is OCR/layout-corrupted (columns mashed; Rang values not reliably readable). Per contract, ranks were **not invented**. New candidates carry `rank: unknown` with an explicit note.

---

## 6. Important granularity decisions (Pass B)

1. **Merged** DC / VES / FE formulas into one KP (`CAND-005`) — one functional hemodynamic unit.
2. **Split** pump consequences (low output vs filling-pressure rise) from VG pulmonary transmission (`CAND-006` vs frozen `KP-040`).
3. **Preserved** `KP-040` / `KP-041` / `KP-042` exactly; added separate VD systemic transmission (`CAND-007`).
4. **Split** FE diminuée / préservée / légèrement diminuée into three KPs (independently examinable thresholds + mechanisms).
5. **Merged** short-term beneficial / long-term deleterious framing of compensations (`CAND-008`), then split cardiac remodeling, Starling/tachycardia, and extra-cardiac neurohormonal axes.
6. **Merged** orthopnée + DPN as one “more specific respiratory symptoms” KP; kept NYHA with effort dyspnea.
7. **Split** acute rule-out BNP thresholds from non-acute thresholds and from age-banded rule-in thresholds (mastery).
8. **Kept** ETT as one “key exam” KP rather than one KP per measured parameter.
9. **Grouped** CMD causes under one KP with familial ~25% called out; did not atomize every etiology bullet.
10. **Split** FA consequences from ventricular arrhythmia / sudden death / DAI rationale.
11. **Kept** OAP clinical emergency separate from physiological PPC threshold (`KP-041`) and from hospital treatment protocol.
12. **Kept** CHAMPIT as its own examinable checklist KP.
13. **Grouped** four mortality-reducing drug classes as one umbrella KP, then split each class (and contraindications) for independent testing.
14. **Merged** hygiène measures beyond salt/weight (alcohol/tobacco/exercise/vaccines/contraception) into one understanding KP to avoid list explosion.
15. **Deferred** full ESC biology panel as one mastery list KP.
16. **Did not** mint KPs from Situations de départ codes or transversalité item numbers.
17. **Did not** duplicate Points-clés / Notions indispensables as new KPs when they recapitulate body facts.
18. **Split** CRT vs DAI indications (different criteria and exam traps).
19. **Kept** IC FE préservée diagnostic criteria (including HVG/AG index cut-offs) as one multi-anchor KP.
20. **CMH definition paragraph is duplicated in the source** — used a unique later quote (obstruction / sudden death) rather than the duplicated definition sentence.

---

## 7. Important merge decisions

- Hemodynamic formulas + FE definition → `CAND-005`
- Extra-cardiac compensations (vasoconstriction + Na retention + SRAA) → `CAND-011`
- Lifestyle cluster beyond salt/weight → `CAND-070`
- 2nd-intention drugs cluster → `CAND-079`
- Prognostic factor list → `CAND-065` (deferred)

---

## 8. Important split decisions

- FE ≤40 / ≥50 / 41–49
- BNP acute rule-out / non-acute rule-out / age-banded rule-in
- OAP physiology (`KP-041`) vs OAP clinical form (`CAND-055`) vs OAP treatment (`CAND-089/090`)
- IEC vs ARA2/ARNI vs BB vs ARM vs SGLT2 vs diuretics vs contraindications
- CRT vs DAI

---

## 9. Facts requiring multiple anchors

63 KPs use ≥2 anchors (definitions spanning clinical + ESC box; multi-step mechanisms; multi-criteria diagnoses; multi-drug statements).

Notable: `KP-040` (two transmission quotes), `CAND-060` (FE préservée criteria + HVG + AG volume), `CAND-058` (choc definition + PAS + oligurie), `CAND-071` (four classes + diuretics).

---

## 10. Unresolved source / OCR issues

1. **Hiérarchisation table** heavily corrupted — cannot safely assign A/B for new KPs.
2. **Duplicated paragraphs** in source (e.g. CMD/CMH etiology blocks appear twice) — required longer/unique quotes.
3. **Line-broken hyphenation** (e.g. `Cheyne-\nStokes`) — quotes chosen to avoid fragile cross-break matches.
4. Heading typography inconsistent (`I Généralités` vs TOC `I. Généralités`) — section_path uses readable structural paths aligned with body headings.

---

## 11. Preservation of KP-040 / KP-041 / KP-042

Confirmed:

- Each appears **exactly once**
- Semantic identity unchanged vs validated OAP slice
- Labels/anchors compatible with existing slice inventory
- No renumbering; other IDs use `CAND-nnn` only

---

## 12. Blind extraction confirmation

- **`coverage.md` was NOT inspected or used**
- **`coverage-v0.md` was NOT inspected or used**
- **`storyboard.md` was NOT inspected or used**
- **Legacy `generated-assets/` pedagogical files / SVGs were NOT used**
- Approximate legacy KP counts (~88 / ~80–95) were **not** used as targets

---

## 13. Validation performed

Dedicated non-publishing script:

`node 01-learning/chapters/cardio/234/build/validate-inventory-candidate.mjs`

Checks: unique IDs; frozen IDs once each; no other `KP-*`; disposition present; non-empty labels; every quote unique-resolves in official source.

Result: **PASS** (99 KPs, 0 errors).

Canonical `inventory.yaml` and chapter publish path were **not** modified or pointed at this candidate.
