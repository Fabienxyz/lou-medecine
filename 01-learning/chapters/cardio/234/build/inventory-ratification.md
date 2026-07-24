# Phase 2B — Inventory Ratification Proposal (Item 234)

**Status:** proposal only — do **not** apply to canonical `inventory.yaml`  
**Authority:** `official-college.md` (2024-SFC)  
**Compared:** `build/inventory-candidate.yaml` (Phase 2A, n=99) vs `coverage.md` (88 knowledge-unit rows)  
**Companion diff:** `build/inventory-diff.yaml`  
**Frozen identities:** KP-040, KP-041, KP-042 — preserved  
**Permanent IDs:** none minted (CAND-* retained until post-acceptance allocation)

This is **not** formal full-chapter reconciliation (Phase 3). No `chapter_reconciliation_invariant: pass` claim is made.

---

## A. Proposed final KP count

**106** knowledge points (recommended ratification structure)

| Class | Count |
|---|---:|
| Propositional medical KPs | 104 |
| Excluded-with-justification | 2 |
| **Total** | **106** |

Derivation from candidate 99:

| Change | Δ |
|---|---:|
| Split CAND-010, CAND-022, CAND-073, CAND-080, CAND-088 | +5 |
| Add scintigraphie isotopique | +1 |
| Add dihydropyridines effet neutre | +1 |
| Removals | 0 |
| **Net** | **+7 → 106** |

Enrichments that do **not** mint new KPs (label/anchor fixes) are listed in §E/§C notes.

Optional owner-only extras (not in the 106):

- Split CAND-011 extracardiac compensations into 2–3 units → **+1 to +2**
- Defer transplant CI list while keeping indication understanding → **0 net** if split; or disposition-only change

---

## B. Candidate KPs to KEEP unchanged

Keep semantic identity, disposition, and anchors as in Phase 2A (minor wording polish allowed at integration):

**Frozen**

- KP-040, KP-041, KP-042

**Definitions / hemodynamics / compensations (kept)**

- CAND-001, CAND-002, CAND-003, CAND-004, CAND-005, CAND-006, CAND-007, CAND-008, CAND-009*, CAND-012  
  \*CAND-009 kept as one unit but **enrich** Laplace numerical example (see §E)

**FE / arrhythmias**

- CAND-013, CAND-014, CAND-015, CAND-016, CAND-017

**Clinic / exam**

- CAND-018, CAND-019, CAND-020, CAND-021, CAND-023, CAND-024, CAND-025, CAND-026, CAND-027, CAND-028, CAND-029, CAND-030, CAND-031*, CAND-032, CAND-033, CAND-034, CAND-035*, CAND-036, CAND-037, CAND-038, CAND-039, CAND-040*, CAND-041, CAND-042*, CAND-043  
  \*enrichments only (see §E); CAND-042 neighbor gets new scintigraphy KP rather than forced merge

**Etiology / forms / evolution**

- CAND-044 … CAND-066 (all kept; enrich CAND-047, CAND-067 where noted)

**Treatment (kept without merge/split)**

- CAND-068, CAND-069, CAND-070*, CAND-071, CAND-072, CAND-074, CAND-075*, CAND-076*, CAND-077, CAND-078, CAND-079, CAND-081*, CAND-082, CAND-083*, CAND-084, CAND-085†, CAND-086, CAND-087*, CAND-089, CAND-090*, CAND-091*, CAND-092, CAND-093, CAND-094  
  \*enrichments; †disposition contested (see §G / §H)

**Excluded (keep as excluded rows)**

- CAND-095 (Situations de départ)  
- CAND-096 (Réflexes transversalité)

---

## C. Candidate KPs to MERGE

**None required.**

Rationale: coverage mega-rows that look like “merge targets” are mostly **coverage over-coarse** (class D), not candidate over-split (class B). Forced merges would erase independently examinable thresholds (FE bands, BNP contexts, CRT vs DAI, OAP home vs hospital).

Explicit non-merges:

| Do not merge | Why |
|---|---|
| KP-040 / KP-041 / KP-042 with neighbors | Frozen validated OAP-slice identities |
| CAND-013/014/015 | Independent FE thresholds + mechanisms |
| CAND-034/035/036 | Different decision contexts (acute / non-acute / rule-in) |
| CAND-082/083 | Different device criteria |
| CAND-089/090 | Different care settings / thresholds |

---

## D. Candidate KPs to SPLIT

### D1. CAND-010 → two units

| Resulting semantic identity | Disposition |
|---|---|
| Loi de Starling : précharge ↑ → inotropie jusqu’à une limite de dilatation | understanding |
| Tachycardie compensatrice sympathique maintenant le DC ; effets délétères (travail / VO₂) | understanding |

**Reason:** independently examinable mechanisms; bundling is candidate under-split (coverage correctly separated COV-012/013).

### D2. CAND-022 → two units

| Resulting semantic identity | Disposition |
|---|---|
| Autres symptômes d’IC : fatigue, prise de poids/œdèmes, faiblesse musculaire, palpitations | understanding |
| Manifestations d’IC sévère/terminale : SAS/Cheyne-Stokes, confusion, troubles digestifs | understanding |

**Reason:** severe/terminal cluster is independently examinable; currently fused with common symptoms.

### D3. CAND-073 → two units

| Resulting semantic identity | Disposition |
|---|---|
| ARA2 : alternative si intolérance aux IEC (moins de toux) | understanding |
| Sacubitril/valsartan (ARNI) : supérieur à énalapril ; remplacement IEC/ARA2 si restant symptomatique sous traitement optimal | understanding |

**Reason:** different indication logic; common exam trap if fused.

### D4. CAND-080 → two units + disposition change

| Resulting semantic identity | Disposition |
|---|---|
| Amiodarone : seul antiarythmique utilisable si FEVG diminuée | **understanding** (was deferred as part of cluster) |
| Antiagrégants / anticoagulants dans l’IC (aspirine, DAPT, AOD, CHA₂DS₂-VASc, HAS-BLED, thrombus, AVC embolique) | deferred-to-mastery |

**Reason:** amiodarone exclusivity is a core decision boundary; scoring/antithrombotic detail is mastery-shaped.

### D5. CAND-088 → two units

| Resulting semantic identity | Disposition |
|---|---|
| Parcours de soins post-hospitalisation : risque de réhospitalisation, éducation pluridisciplinaire, IPA/protocole de coopération, réadaptation SSR, soins palliatifs/support | understanding |
| Télésurveillance de l’IC : programmes remboursés ; paramètres PA/FC/poids ; alertes algorithmiques ; dépistage précoce de décompensation | understanding |

**Reason:** télésurveillance is a distinct source subsection with examinable operational facts; currently only a clause inside parcours.

### Optional (owner) — CAND-011

Keep as one extracardiac-compensation family **or** split into:

1. Vasoconstriction compensatrice (inhomogène)  
2. Rétention hydrosodée (SRAA / congestion)  
3. Activation neurohormonale délétère (sympathique + SRAA)

Coverage fragmented these (COV-014–016); candidate cluster is defensible either way. **Default recommendation: keep CAND-011 unsplit** to avoid compensation-list explosion; enrich label for deleterious neurohormonal effects.

---

## E. KPs to ADD (candidate missed source knowledge)

### E1. New KP — Scintigraphie isotopique

- **Semantic identity:** Scintigraphie isotopique : mesure FE (patients non échogènes, rarement) ; évaluation ischémie / viabilité  
- **Disposition:** deferred-to-mastery  
- **Source:** II. Diagnostic > H Autres examens complémentaires — « La scintigraphie isotopique peut… »  
- **Why add:** present in source and coverage (COV-038); absent from CAND-042 (Holter+VO₂ only)

### E2. New KP — Dihydropyridines effet neutre

- **Semantic identity:** Dihydropyridines (félodipine, amlodipine) : effet neutre sur la mortalité ; utilisables si indication associée (angor, HTA) — contrast with diltiazem/vérapamil CI  
- **Disposition:** understanding  
- **Source:** VI.C.8 Traitements contre-indiqués  
- **Why add:** exam confusion boundary with CI calcium-channel blockers; missing from CAND-081

### E3. Enrichments (no new permanent/CAND identity yet — apply at integration)

| Target | Missing source fact | Disposition impact |
|---|---|---|
| CAND-009 | Exemple numérique remodelage (VTD 100→200, FE 60→30%, VES 60 mL) | none |
| CAND-031 / CAND-032 | Épanchements pleuraux : formes unilatérales trompeuses | none |
| CAND-035 | Nommer explicitement l’algorithme diagnostique ESC hors urgence / typage FEVG | none |
| CAND-040 | Revascularisation si ischémie/viabilité ; réseau normal → orientation CMD | none |
| CAND-047 | Maladie de Fabry parmi causes / diagnostics différentiels CMH | none |
| CAND-067 | Statines, diabète/gliflozines en prévention, obésité, sédentarité | none |
| CAND-070 | Travail / réinsertion / invalidité / réadaptation cardiaque | none (detail can stay understanding within lifestyle) |
| CAND-075 | Éplérénone post-IDM étendu / cadre BASIC | none |
| CAND-076 | Protection rénale ; effets secondaires des gliflozines | none |
| CAND-083 | Complications DAI : infections de sonde, chocs inappropriés | none |
| CAND-087 | Traitement spécifique amylose cardiaque à transthyrétine disponible | none |
| CAND-090 | Morphine IV non recommandée (sauf anxiété importante / douleur thoracique) ; HBPM already implied | none |
| CAND-091 | Si déjà sous bêtabloquant : arrêt ou ↓ posologie (pas seulement « ne pas introduire ») | none |
| CAND-090 / neighbor | Traitement des déclencheurs à l’hôpital (digoxine IV + anticoagulation si FA rapide ; nicardipine IV si poussée hypertensive) | prefer **deferred detail** inside hospital OAP KP |

---

## F. KPs to REMOVE

**No propositional candidate KP should be removed.**

Do **not** promote these coverage rows into Inventory KPs (navigation / recapitulation):

| Coverage | Action |
|---|---|
| COV-001 Item title | ignore |
| COV-003 Hiérarchisation table | ignore as KP (ranks stay unknown until OCR recoverable) |
| COV-073 ESC treatment algorithm figure | do not mint — packaging of existing therapy KPs |
| COV-085 Points-clés | do not mint — recapitulation |
| COV-086 Notions indispensables | do not mint — maps to existing KPs |
| COV-087 Notions inacceptables | do not mint — maps to CAND-081 + CAND-068; see §H wording issue |

Keep CAND-095 / CAND-096 as **excluded-with-justification** (not silent deletion).

---

## G. Disposition changes

### Before (Phase 2A)

| Disposition | Count |
|---|---:|
| understanding | 85 |
| deferred-to-mastery | 12 |
| excluded-with-justification | 2 |

### After (recommended 106-KP structure)

| Disposition | Count |
|---|---:|
| understanding | 91 |
| deferred-to-mastery | 13 |
| excluded-with-justification | 2 |

### Explicit changes

| ID / change | From → To | Reason |
|---|---|---|
| Amiodarone half of CAND-080 split | deferred-to-mastery → **understanding** | High-specificity clinical rule defining what may be prescribed in reduced-FE HF; needed for first-pass therapeutic reasoning / exam traps |
| Antithrombotic half of CAND-080 | remains **deferred-to-mastery** | Scores, DAPT durations, AOD preference — mastery detail |
| New scintigraphie KP | — → **deferred-to-mastery** | Specialized adjunct imaging list |
| New dihydropyridines KP | — → **understanding** | Confusion boundary with CI non-dihydropyridine CCBs |
| Splits of CAND-010/022/073/088 | understanding → understanding (children) | No demotion |

### Keep deferred (confirmed correct)

CAND-029, CAND-036, CAND-039, CAND-041, CAND-042 (+ scintigraphy neighbor), CAND-043, CAND-053, CAND-065, CAND-079, CAND-084, CAND-086

### Keep understanding despite being numerical (confirmed correct)

- KP-041 PPC > 25 mmHg  
- CAND-034 / CAND-035 BNP rule-out thresholds (decision pathway)  
- CAND-068 / CAND-069 salt & weight alert  
- CAND-089 / CAND-090 OAP dose/PAS thresholds  

These define clinical decision boundaries for the first-pass model — not “mastery trivia.”

### Contested (owner)

| Item | Options |
|---|---|
| CAND-085 transplantation | Keep whole KP understanding **or** split indication (understanding) vs CI/complication list (deferred) |
| Exact BB/IEC trial doses | Remain inside understanding KPs as optional deferred sub-detail **or** mint separate deferred dose KPs (not recommended now) |

---

## H. Unresolved decisions requiring owner ratification

1. **CAND-011 extracardiac compensations:** keep one cluster vs split into 2–3 KPs.  
2. **CAND-085 transplant:** whole understanding vs indication/CI split.  
3. **Notions inacceptables wording conflict:** source notions say CI drugs « dans l’IC à **FE préservée** », body text says diltiazem/vérapamil CI dans l’IC **systolique**. Inventory must not invent a resolution — pick quote/label strategy explicitly.  
4. **Whether to mint any “notions / points-clés” emphasis KP** (proposal: no).  
5. **Hospital OAP precipitant micro-protocol** (digoxine IV + anticoagulation FA ; nicardipine IV): fold as deferred detail into CAND-090 vs separate deferred KP.  
6. **Optional CAND-011 / dose-table granularity** if owner prefers coverage-like fragmentation for mastery flashcards later (Blueprint can still compress).

---

## I. Double-missed source facts (both decompositions weak)

See `inventory-diff.yaml` → `double_missed_source_facts`:

1. Already-on-BB stop/reduce during OAP (enrich CAND-091)  
2. Hospital precipitant-specific treatments (FA / hypertensive surge)  
3. Normal right-heart cath reference pressures (fold into deferred CAND-043)

No claim of exhaustiveness — Phase 3 reconciliation remains required.

---

## J. Preservation confirmation

| ID | Preserved? |
|---|---|
| KP-040 | Yes — semantic identity unchanged; not merged |
| KP-041 | Yes |
| KP-042 | Yes |

Neighbor adaptations only: CAND-006 / CAND-007 remain the non-frozen companions.

---

## K. Integration readiness (without performing it)

**Conditional GO** for integrating a ratified full Inventory into canonical `inventory.yaml` **after owner acceptance** of:

- final count **106** (or owner-adjusted variant),  
- the five splits + two additions,  
- disposition change for amiodarone,  
- enrichment list,  
- unresolved items in §H.

**NO-GO right now** for silent overwrite of `inventory.yaml`, Blueprint authoring, projections, or full reconciliation.

---

## L. Files

| File | Role |
|---|---|
| `build/inventory-diff.yaml` | Coverage↔candidate mapping + double-missed |
| `build/inventory-ratification.md` | This proposal |

Canonical `inventory.yaml`, Blueprint, projections, architecture docs: **untouched**.
