# Publication — Préférences d'affichage Reader V1 (PDR-D7)

| | |
|---|---|
| **Lot** | D7-G — clôture documentaire et publication |
| **Date** | 2026-08-01 |
| **Décision produit** | [PDR-D7](../governance/PRODUCT-DECISION-REGISTRY.md) |
| **Contrat** | [`DISPLAY-PREFERENCES-COMPONENT-CONTRACT.md`](../contracts/components/DISPLAY-PREFERENCES-COMPONENT-CONTRACT.md) — **En vigueur** |
| **Tag recommandé** | `display-preferences-v1` (à poser lors du commit de publication gouvernance) |

---

## 1. Verdict

**D7 PUBLIÉ**

Lots D7-A … D7-F clôturés. Contrat composant en vigueur. Propagation gouvernance effectuée. Aucune modification fonctionnelle dans D7-G.

---

## 2. Audit Git

| Élément | Valeur |
|---|---|
| **Branche** | `main` |
| **HEAD local** | `9f1cbfed2e95561cebc4bd02acc3934e65a6d2fd` |
| **Message HEAD** | `feat(renderer): publish local search (PDR-D6)` |
| **origin/main** | `9f1cbfed2e95561cebc4bd02acc3934e65a6d2fd` — **aligné** |
| **Ahead / behind** | 0 / 0 (remote publié = HEAD) |
| **Working tree** | Modifications **non commitées** : implémentation D6 + D7 (code, tests, rapports) + **gouvernance D7-G** (ce lot) |
| **Conflits** | Aucun |
| **Tag** | `display-preferences-v1` — **non posé** (recommandé au commit D7-G) |

---

## 3. Documents modifiés (D7-G)

| Document | Action |
|---|---|
| [`DISPLAY-PREFERENCES-COMPONENT-CONTRACT.md`](../contracts/components/DISPLAY-PREFERENCES-COMPONENT-CONTRACT.md) | Statut → **En vigueur** |
| [`contracts/components/00-INDEX.md`](../contracts/components/00-INDEX.md) | Entrée Display Preferences |
| [`contracts/00-INDEX.md`](../contracts/00-INDEX.md) | Entrée Display Preferences |
| [`RENDERER-COMPONENT-CONTRACT.md`](../contracts/components/RENDERER-COMPONENT-CONTRACT.md) | Renvoi contrat Display Preferences |
| [`14-LOU-READER-ARCHITECTURE.md`](../renderer/14-LOU-READER-ARCHITECTURE.md) | Navigation V1 — préférences d'affichage |
| [`15-READER-FUNCTIONAL-SPECIFICATION.md`](../renderer/15-READER-FUNCTIONAL-SPECIFICATION.md) | Préférences d'affichage V1 |
| [`PRODUCT-DECISION-REGISTRY.md`](../governance/PRODUCT-DECISION-REGISTRY.md) | Matrice propagation D7 |
| [`PROJECT_STATE.md`](../PROJECT_STATE.md) | D7 publié ; indicateurs ; chantier actif Amorçage |
| [`MASTER_ROADMAP.md`](../MASTER_ROADMAP.md) | Acquis D7 ; chantier actif Amorçage |
| [`HANDOVER.md`](../HANDOVER.md) | Handover agent |
| [`display-preferences-v1-publication.md`](display-preferences-v1-publication.md) | Ce rapport |

**Non modifiés :** ADR, PDR (décisions), D4, D6, Patrimoine, Offline, code applicatif.

---

## 4. Résumé des changements

- Contrat [`DISPLAY-PREFERENCES-COMPONENT-CONTRACT.md`](../contracts/components/DISPLAY-PREFERENCES-COMPONENT-CONTRACT.md) promu **En vigueur** (D7-A → D7-F validés).
- Index contrats (`00-INDEX`, `components/00-INDEX`) : entrée Display Preferences ajoutée.
- Specs Reader 14/15 : préférences d'affichage V1 documentées (thème, police, largeur ; global ; Snapshot).
- [`RENDERER-COMPONENT-CONTRACT.md`](../contracts/components/RENDERER-COMPONENT-CONTRACT.md) : renvoi PDR-D7.
- [`PRODUCT-DECISION-REGISTRY.md`](../governance/PRODUCT-DECISION-REGISTRY.md) : propagation D7 marquée faite.
- [`PROJECT_STATE.md`](../PROJECT_STATE.md) / [`MASTER_ROADMAP.md`](../MASTER_ROADMAP.md) : D7 aux acquis ; chantier actif → **Amorçage cognitif** + acceptation Reader.
- [`HANDOVER.md`](../HANDOVER.md) : reprise agent — D7 publié, prochaine étape Amorçage.

---

## 5. Publication

| Élément | État |
|---|---|
| **Commit D7-G** | **En attente** — working tree local (documentation uniquement) |
| **SHA publication** | — (à renseigner après commit `docs(governance): publish display preferences (PDR-D7)`) |
| **Push** | **Non effectué** — hors périmètre automatique D7-G |
| **Tag** | `display-preferences-v1` recommandé sur le commit gouvernance |

**Note :** l'implémentation Reader D7 (D7-C … D7-F) reste en working tree non commitée — commit code distinct recommandé (`feat(renderer): implement display preferences (PDR-D7)`).

---

## 6. Tests de référence (état D7-F)

| Suite | Résultat |
|---|---|
| `display-preferences-service.test.js` (D7-C) | 41/41 PASS |
| `display-preferences-runtime.test.js` (D7-D) | 11/11 PASS |
| `display-preferences-snapshot.test.js` (D7-D) | 10/10 PASS |
| `display-preferences-reader.test.js` (D7-E) | 15/15 PASS |
| `display-preferences-d7-f-validation.test.js` (D7-F Node) | 19/19 PASS |
| `14-display-preferences-d7f.spec.mjs` (Playwright) | 18/18 PASS |
| Renderer `npm test` | 589/589 PASS |
| Non-régression D4 / D6 / Patrimoine | Inclus suite Renderer — 0 échec |

---

## 7. Écarts résiduels (hors périmètre D7-G)

| Écart | Gravité |
|---|---|
| Implémentation D7 non commitée sur `origin/main` | Attendu — commit code distinct hors D7-G |
| Tag `display-preferences-v1` non posé | Attendu — à la publication Git |
| DP-F-10 : globalité vérifiée par reload, pas changement Release explicite | Non bloquant — couvert Node |
| Amorçage cognitif (1 vue `planned`) | Chantier actif Reader Acceptance — hors D7 |
| Prononcé d'acceptation Reader V1 | Non prononcé — hors D7 |

---

## Périmètre livré (D7-A … D7-F)

| Lot | Livrable |
|---|---|
| D7-A | Contrat composant Display Preferences |
| D7-B | Conception technique |
| D7-C | Display Preferences Service pur |
| D7-D | Runtime + Patrimoine + Snapshot |
| D7-E | Intégration Reader |
| D7-F | Validation end-to-end package 234 |

**Verdict validation :** D7-F **READY FOR D7-G** — voir [`demo/renderer/docs/learner-display-preferences-d7-f-validation-report.md`](../../demo/renderer/docs/learner-display-preferences-d7-f-validation-report.md).

---

## Prochain chantier Reader Acceptance

**Amorçage cognitif** — alimenter la vue `planned` sur package 234.

Critères restants avant acceptation Reader V1 : Amorçage + prononcé d'acceptation.

---

*Rapport de clôture D7-G — 2026-08-01.*
