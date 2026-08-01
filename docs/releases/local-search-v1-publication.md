# Publication — Recherche textuelle locale Reader V1 (PDR-D6)

| | |
|---|---|
| **Lot** | D6-G — clôture documentaire et publication |
| **Date** | 2026-08-01 |
| **Décision produit** | [PDR-D6](../governance/PRODUCT-DECISION-REGISTRY.md) |
| **Contrat** | [`LOCAL-SEARCH-COMPONENT-CONTRACT.md`](../contracts/components/LOCAL-SEARCH-COMPONENT-CONTRACT.md) — **En vigueur** |
| **Tag** | `local-search-v1` |

---

## 1. Périmètre livré (D6-A … D6-F)

| Lot | Livrable |
|---|---|
| D6-A | Contrat composant Local Search |
| D6-B | Conception technique |
| D6-C | Local Search Service (`local-search-service.js`, normalize, extract) |
| D6-D | Local Search Runtime + cache IndexedDB `lou-local-search-v1` |
| D6-E | Intégration Reader (panneau, navigation SearchHit, surbrillance éphémère) |
| D6-F | Validation end-to-end package 234 — offline, cache, D4, patrimoine |

**Verdict validation :** D6-F **READY FOR D6-G** — voir [`demo/renderer/docs/learner-local-search-d6-f-validation-report.md`](../../demo/renderer/docs/learner-local-search-d6-f-validation-report.md).

---

## 2. Gouvernance publiée (D6-G)

| Document | Action |
|---|---|
| [`LOCAL-SEARCH-COMPONENT-CONTRACT.md`](../contracts/components/LOCAL-SEARCH-COMPONENT-CONTRACT.md) | Statut → **En vigueur** |
| [`contracts/components/00-INDEX.md`](../contracts/components/00-INDEX.md) | Entrée Local Search |
| [`contracts/00-INDEX.md`](../contracts/00-INDEX.md) | Entrée Local Search |
| [`RENDERER-COMPONENT-CONTRACT.md`](../contracts/components/RENDERER-COMPONENT-CONTRACT.md) | Renvoi contrat Local Search |
| [`14-LOU-READER-ARCHITECTURE.md`](../renderer/14-LOU-READER-ARCHITECTURE.md) | Navigation V1 — recherche locale |
| [`15-READER-FUNCTIONAL-SPECIFICATION.md`](../renderer/15-READER-FUNCTIONAL-SPECIFICATION.md) | Recherche in-chapter V1 |
| [`PRODUCT-DECISION-REGISTRY.md`](../governance/PRODUCT-DECISION-REGISTRY.md) | Matrice propagation D6 |
| [`PROJECT_STATE.md`](../PROJECT_STATE.md) | D6 publié ; indicateurs |
| [`MASTER_ROADMAP.md`](../MASTER_ROADMAP.md) | Acquis D6 ; lot actif D7 |
| [`HANDOVER.md`](../HANDOVER.md) | Handover agent |

---

## 3. Tests de référence (état D6-F)

| Suite | Résultat |
|---|---|
| `local-search-d6-f-validation.test.js` | 15/15 PASS |
| `13-local-search-d6f.spec.mjs` (Playwright) | 19/19 PASS |
| Renderer `npm test` | 493/493 PASS |

---

## 4. Prochain lot Reader Acceptance

**D7** — préférences d'affichage de base ([PDR-D7](../governance/PRODUCT-DECISION-REGISTRY.md)).

Critères restants avant acceptation Reader V1 : Amorçage (1 vue `planned`), D7, prononcé d'acceptation.

---

*Rapport de clôture D6-G — 2026-08-01.*
