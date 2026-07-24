# Phase 3C — Inventory correction audit (Item 234)

**Date:** 2026-07-24  
**Prior reconciliation:** `build/reconciliation-full-v2.yaml` (FAIL, 2 misses)  
**Canonical inventory revision:** `phase-3c-corrected`  
**Blueprint / projections:** NOT started

---

## Executive summary

| Metric | Before | After |
|--------|--------|-------|
| Canonical KP count | 109 | 109 |
| reconciliation-full-v2 missed segments | 2 | 0 (known misses resolved) |
| New permanent KPs | — | 0 |
| GO for Blueprint | NO | **YES** |

Phase 3C closed the two residual misses from independent reconciliation v2 by enriching **KP-074** (same hyposodé clinical unit). Anchor-support gaps on **KP-076**, **KP-096**, and **KP-100** were corrected without architectural change. The diltiazem/vérapamil FE phenotype conflict remains explicitly unsettled.

---

## TASK 1 — SEG-061b / SEG-061c

### SEG-061b — Régime sans sel nuisible, diététicien, K⁺, épices

| Field | Value |
|-------|-------|
| **Action** | enriched |
| **KP** | KP-074 |
| **Source** | VI.B.1 Régime hyposodé |
| **Disposition** | understanding → understanding |
| **Permanent identity changed** | yes (label extended; same ID) |

**Reason:** Cautions belong to the same examinable hyposodé education unit as the ≤5–6 g/j target. Splitting or a new KP would fragment one clinical decision bundle.

### SEG-061c — Écart de régime → ↑ diurétiques jour J ou J+1

| Field | Value |
|-------|-------|
| **Action** | enriched |
| **KP** | KP-074 |
| **Source** | VI.B.1 Régime hyposodé |
| **Disposition** | understanding → understanding |
| **Permanent identity changed** | yes (label extended; same ID) |

**Reason:** Patient self-management after dietary lapse is co-located with hyposodé counseling in the College source; enrichment preferred over KP-084 (diuretic pharmacology) or a new KP.

---

## TASK 2 — KP audits

### KP-076 — Contraception / mesures générales

| Check | Result |
|-------|--------|
| Label vs anchors (before) | Label cited contraception/grossesse; anchors omitted §7 Contraception and §3 tabac |
| Correction | Added anchors: tabac impératif ; grossesse à risque ; contraceptifs minidosés / DIU |
| Action | enriched |
| Split needed? | No |
| Permanent identity changed | no (label unchanged; anchor support restored) |

### KP-096 — CCB / ABCDEFG / FE conflict

| Check | Result |
|-------|--------|
| Label vs anchors (before) | Label cited ABCDEFG; VI.F rate-slowing CCB clause unanchored |
| Correction | Added VI.F anchor for inhibiteur calcique ralentisseur ; refined label to cite A-clause with explicit conflict pointer ; added `source_conflict: seg-ambig-fe-ci-notions` |
| Action | ambiguity-preserved + enriched |
| FE/CCB ambiguity | **Preserved unsettled** — three poles: VI.C.8 (KP-089 systolique CI), VI.F allowance (KP-096), Notions inacceptables CI in FE préservée |
| Permanent identity changed | yes (label + conflict metadata) |

No universal HFpEF CCB rule was invented.

### KP-100 — Morphine in hospital OAP bundle

| Check | Result |
|-------|--------|
| Label vs anchors (before) | Morphine caveat anchored but absent from label |
| Correction | Label refined to include « morphine IV non recommandée sauf anxiété/douleur » |
| Action | refined |
| Split needed? | No — morphine belongs to the same hospital OAP treatment bundle |
| Permanent identity changed | yes (label only) |

---

## TASK 3 — Correction artifact

Machine-readable audit: `build/inventory-phase3c-corrections.yaml`

Covers: SEG-061b, SEG-061c, KP-076 (via SEG-063), KP-096 (via SEG-084), KP-100 (via SEG-091).

---

## TASK 4 — Targeted reconciliation

**Artifact:** `build/reconciliation-phase3c-targeted.yaml`  
**Validator:** `build/validate-reconciliation-phase3c-targeted.mjs`  
**Result:** PASS

Verified:

1. SEG-061b and SEG-061c → represented on KP-074  
2. KP-076 contraception neighborhood honestly anchored  
3. KP-096 CCB clause anchored with conflict preserved  
4. KP-100 label/anchor alignment for morphine  
5. No new unsupported claims  
6. SEG-AMB-01 remains ambiguous (not silently resolved)

---

## TASK 5 — Fast global consistency

**Validator:** `build/validate-phase3c-global-consistency.mjs`  
**Result:** PASS

Deterministic checks: unique IDs, 109 KPs, zero CAND-*, frozen KP-040/041/042, all anchors resolve, understanding/deferred KPs anchored, v2 misses resolved, FE/CCB ambiguity tracked, OAP >25 mmHg on KP-041 unchanged.

Full 109-KP anchor validation run once after corrections stabilized (via Phase 3C inventory validator).

---

## TASK 6 — Regression tests

Run order:

1. Phase 3C targeted reconciliation validator  
2. Phase 3C inventory validator  
3. Phase 3C global consistency  
4. Full `lou-build` test suite (OAP slice regression)

---

## New KP IDs

None. Enrichment of KP-074 was sufficient for SEG-061b/c.

---

## Remaining ambiguities

| ID | Status | Handling |
|----|--------|----------|
| seg-ambig-fe-ci-notions | unresolved | KP-089 (systolique CI) + KP-096 (VI.F allowance + source_conflict) + Notions wording |
| seg-ambig-bb-stop | dual-anchored-contextual | KP-081 vs KP-103 (unchanged from Phase 3B) |

These are **non-blocking for Inventory fidelity** per reconciliation-full-v2; blocking only for learner claims that assert a single universal rule.

---

## Files created / modified

| File | Action |
|------|--------|
| `inventory.yaml` | modified (Phase 3C corrections) |
| `build/inventory-phase3c-corrections.yaml` | created |
| `build/inventory-phase3c-report.md` | created |
| `build/validate-inventory-phase3c.mjs` | created |
| `build/reconciliation-phase3c-targeted.yaml` | created |
| `build/validate-reconciliation-phase3c-targeted.mjs` | created |
| `build/validate-phase3c-global-consistency.mjs` | created |

**Not modified:** `official-college.md`, frozen architecture docs, `reconciliation-full-v2.yaml`, Blueprint, projections.

---

## GO / NO-GO

**GO FOR BLUEPRINT**

- Zero known misses from reconciliation-full-v2 remain after Phase 3C  
- No new unrelated misses discovered in targeted scope  
- Structural mapping reliable under fast global check  
- If a future full independent pass surfaces new unrelated misses, automate the convergence loop before manual full-chapter cycles
