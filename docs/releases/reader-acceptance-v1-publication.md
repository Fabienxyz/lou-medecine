# Publication — Reader Acceptance V1

| | |
|---|---|
| **Jalon** | Reader Acceptance V1 — prononcé officiel |
| **Date** | 2026-08-02 |
| **Décisions produit** | [PDR-B1](../governance/PRODUCT-DECISION-REGISTRY.md) · [PDR-B5](../governance/PRODUCT-DECISION-REGISTRY.md) · [PDR-D1](../governance/PRODUCT-DECISION-REGISTRY.md)–[PDR-D7](../governance/PRODUCT-DECISION-REGISTRY.md) · [PDR-E5](../governance/PRODUCT-DECISION-REGISTRY.md) |
| **Tag** | `reader-acceptance-v1` |
| **Commit technique de clôture** | `f2801de05501738b9075a482c73aec0b7b9341b0` — AP-F (Local Search CP, smoke, offline shell) |

---

## 1. Prononcé officiel

**Reader Acceptance V1 est prononcé.**

Le Reader Lou Médecine satisfait les critères d'acceptation V1 sur le package de capitalisation de référence **Item 234** (Insuffisance cardiaque — édition Collège 2022, Release `complete`) :

| Critère | Référence | État |
|---|---|---|
| Reader local installable, autonome, hors dépôt Git | PDR-D1 | ✅ |
| 7 vues alimentées sur package 234 | PDR-B5 | ✅ — incluant **Amorçage cognitif** (AP-A…AP-F) |
| Mode hors ligne intégral | PDR-D2 | ✅ |
| Reprise de session | PDR-D4 | ✅ |
| Sauvegarde et restauration patrimoniale | PDR-E5 | ✅ |
| Recherche textuelle locale | PDR-D6 | ✅ — incluant indexation Amorçage (C-CP-09, AP-F-LS) |
| Préférences d'affichage de base | PDR-D7 | ✅ |
| Architecture sync-ready | PDR-D3, PDR-G5 | ✅ (sync automatique différée post-V1) |

**Verdict validation AP-F :** **632/632** tests Node PASS · **14/14** smoke AP-F PASS · aucune régression D6 constatée.

---

## 2. Lots Cognitive Priming publiés (AP-A … AP-F)

| Lot | SHA (origin/main) | Livrable |
|---|---|---|
| AP-A | `7434f13` | Contrat [`COGNITIVE-PRIMING-COMPONENT-CONTRACT.md`](../contracts/components/COGNITIVE-PRIMING-COMPONENT-CONTRACT.md) |
| AP-B | `f9acc98` | Conception technique |
| AP-C | `a8bd191` | Fabrique / package 234 |
| AP-D | `cf74751` | Composition |
| AP-E | `a110a4e` | Renderer + navigation EDN explicite (AP-EF) |
| AP-F | `f2801de` | Local Search CP (C-CP-09) · smoke AP-F-01…12 · precache offline shell |

---

## 3. Documents modifiés (clôture gouvernance)

| Document | Action |
|---|---|
| [`PROJECT_STATE.md`](../PROJECT_STATE.md) | Reader Acceptance prononcé ; chantier actif → Validation pédagogique Lou |
| [`MASTER_ROADMAP.md`](../MASTER_ROADMAP.md) | Jalon Reader Acceptance V1 clôturé |
| [`HANDOVER.md`](../HANDOVER.md) | Handover agent — reprise post-acceptation |
| [`PRODUCT-DECISION-REGISTRY.md`](../governance/PRODUCT-DECISION-REGISTRY.md) | Matrice propagation — prononcé Reader Acceptance |
| [`reader-acceptance-v1-publication.md`](reader-acceptance-v1-publication.md) | Ce rapport |

**Non modifiés (hors périmètre clôture) :** contrats composants (promotion CP → AP-G ultérieur) ; code ; tests ; packages.

---

## 4. Tests de référence (état AP-F)

| Suite | Résultat |
|---|---|
| Renderer `npm test` | 632/632 PASS |
| `15-cognitive-priming-apf.spec.mjs` (Playwright) | 14/14 PASS |
| `cognitive-priming-local-search.test.js` | 9/9 PASS |
| Non-régression D4 / D6 / D7 / Patrimoine | Inclus suite Renderer — 0 échec |

---

## 5. Prochain jalon

**Validation pédagogique Lou** — Lou confirme la compréhension du chapitre 234 via le Reader accepté ([PDR-B4](../governance/PRODUCT-DECISION-REGISTRY.md)).

---

## 6. Écarts résiduels (hors périmètre, non bloquants)

| Écart | Gravité |
|---|---|
| Smoke CN-07 (`10-composition-navigation.spec.mjs`) — Amorçage désormais `published` en mode dev | Mineur — mise à jour smoke recommandée |
| Smoke PE-03 — flaky intermittent | Mineur |
| Contrat Cognitive Priming statut « Proposé » (AP-A) | Attendu — promotion « En vigueur » = lot AP-G gouvernance |
| Golden master édition Collège 2023 vs dépôt 2022 ([PDR-B2](../governance/PRODUCT-DECISION-REGISTRY.md)) | Différé — n'empêche pas l'acceptation Reader |

---

*Rapport de clôture Reader Acceptance V1 — 2026-08-02.*
