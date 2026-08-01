# Lou Médecine — État du projet

**Photographie opérationnelle** — document vivant.

**Version projet :** 0.1.0  
**Dernière mise à jour :** 2026-08-01 (E-C publié sur `origin/main` ; lot E-D — import / restauration patrimoniale — ouvert)

Ce document répond à une seule question : **où en est le projet aujourd'hui, et qu'est-ce qui empêche ou conditionne la progression ?**

Pour l'intention, le séquencement et les critères de sortie → [`MASTER_ROADMAP.md`](MASTER_ROADMAP.md).  
Pour l'organisation du pilotage → [`governance/DOCUMENT_ARCHITECTURE.md`](governance/DOCUMENT_ARCHITECTURE.md).  
Pour les arbitrages et leur justification → [`governance/PRODUCT-DECISION-REGISTRY.md`](governance/PRODUCT-DECISION-REGISTRY.md).  
Pour les obligations techniques → [`contracts/00-INDEX.md`](contracts/00-INDEX.md).

Mis à jour lorsqu'un jalon est franchi, qu'un blocage apparaît ou disparaît, ou qu'une mesure change.

---

## Situation

| | |
|---|---|
| **Objectif actif** | [Acceptation Reader V1](MASTER_ROADMAP.md#acceptation-reader-v1) — critères PDR-B1/B5/D/E sur package 234 complet |
| **Livrable visé** | Reader local installable, 7 vues alimentées sur le package de capitalisation de référence ([PDR-B1](governance/PRODUCT-DECISION-REGISTRY.md), [PDR-B5](governance/PRODUCT-DECISION-REGISTRY.md)) |
| **Chemin critique** | **Reader Acceptance V1** — goulet principal avant validation pédagogique Lou et industrialisation |
| **Blocage structurant** | Critères d'**acceptation** Reader V1 non prononcés — patrimoine, reprise de session, recherche, CI, Amorçage ouverts |
| **Dernier jalon produit** | **E-C publié** — export Learner Snapshot / LP-05 (`0d7ba1d` sur `origin/main`) ; persistance E-B (`9abd4ba`) ; contrat E-A en vigueur depuis `aaed24c` |

**Constats factuels (acquis pipeline, non confondus avec la Fabrique productrice) :**

- Pipeline validateur lou-build en production — CLI unique `src/cli/build.ts` ; stages A–K ; tag `lou-build-pipeline-v1`.
- **Architecture éditoriale normative gelée** — contrats 07–09 ; tag `editorial-architecture-v1` publié sur `origin/main`.
- **Reader Composition V1 en production** — Spec → Engine → Reading View Model → Renderer ; manifests neutres ; couplage « 1 projection = 1 onglet » supprimé sur le chemin nominal ; legacy prototype isolé (manifest 404).
- Acquisition en mode maintenance ([ADR-004](adr/ADR-004-acquisition-architecture-frozen.md)).
- **PDR-D1 — bibliothèque installable clôturé** — D1-A (Library Catalog Contract) · D1-B (identité Release) · D1-C (installation atomique) · D1-D (Package Access) ; socle catalogue + install + frontière Reader ↔ bibliothèque opérationnel.
- **PDR-D2 — mode hors ligne intégral clôturé** — contrat offline (D2-A) ; certification produit `offline_ready` via Browser Offline Manager (D2-G) ; repair/purge/stale (D2-H) ; lots D2-A…I livrés ([plan](governance/OFFLINE-IMPLEMENTATION-PLAN.md)).
- La **Fabrique productrice autonome** n'est **pas** opérationnelle — objectif forward ([PDR-C1](governance/PRODUCT-DECISION-REGISTRY.md)).

---

## Chantiers en cours

| Chantier | Objectif de rattachement | Focus actuel |
|---|---|---|
| **Reader Acceptance V1** | Acceptation Reader V1 | Phase **active** — critères PDR-B1/B5/D/E sur package 234 complet ; PDR-D1 et PDR-D2 **publiés** ; Amorçage, patrimoine, reprise, recherche ouverts |
| **Patrimoine & publication** | Patrimoine V1 ([ADR-006](adr/ADR-006-pedagogical-patrimony-and-edition-lineage.md)) | **E-D ouvert** — import / restauration patrimoniale ; **E-C publié** — Learner Snapshot (LP-05, PDR-E5 export §8) ; E-B publié |
| **CI & maintenabilité** | Maintenabilité et CI ([PDR-G6](governance/PRODUCT-DECISION-REGISTRY.md)) | **Fixture 234 branchée** — workflow GitHub Actions configuré ; script local [`scripts/ci-234.sh`](../scripts/ci-234.sh) ; extension future (packages additionnels) |

---

## Livrables de référence — instances

| Rôle (roadmap) | Instance courante | État observé |
|---|---|---|
| **Package de capitalisation de référence** | Item **234** — Insuffisance cardiaque — édition Collège **2022** ([PDR-B2](governance/PRODUCT-DECISION-REGISTRY.md)) | Understanding + **évaluation complète** — 81 Questions + 3 Scénarios ; `editorial_completeness: complete` ; couverture understanding 91/91 ; validate/build PASS |
| **Fixture de non-régression** | Item **234** — workflow [`.github/workflows/ci-234.yml`](../.github/workflows/ci-234.yml) | **Validée** — gate `test:ci` (hors `slice.test.ts`) ; run GitHub Actions [#30689638119](https://github.com/Fabienxyz/lou-medecine/actions/runs/30689638119) PASS (~3 min) ; intégration slice via `npm run test:integration` ; script local [`scripts/ci-234.sh`](../scripts/ci-234.sh) |

---

## Blocages et risques ouverts

| Blocage / risque | Impact | Objectif ou chantier concerné |
|---|---|---|
| Package 234 — 7 KP mastery sans QCM (progressif) | N'empêche pas Release `complete` ; extension future possible | Capitalisation (extension optionnelle) |
| Fallback renderer legacy (`generated-assets/`, manifest 404) | Prototype historique isolé — hors chemin nominal Composition | Reader Acceptance V1 (extinction ADR-002 ultérieure) |
| Pipeline sémantique non automatisé | Bloque industrialisation aval (pas le golden master capitalisé manuellement) | Industrialisation Fabrique productrice |
| Build SVG non reproductible byte-identique | Bloque CI fiable | Maintenabilité et CI |
| Patrimoine apprenant — export / restauration | **Export (E-C) publié** — Learner Snapshot / LP-05 livré ; **import E-D ouvert** ; acceptation Reader non prononcée | Patrimoine · Acceptation Reader V1 |
| F2 — ordre écriture sidecars G/H vs verdict I | Cohérence disque lou-build | Dette pipeline |
| Scale-out prématuré (tentation multi-chapitres partiels) | Dispersion — contredit [PDR-C2](governance/PRODUCT-DECISION-REGISTRY.md) | — (risque de pilotage) |
| Formats structurés EDN non évalués | Latent — nouveau pipeline si requis ([ADR-004](adr/ADR-004-acquisition-architecture-frozen.md) §6) | Couverture EDN |
| Portabilité hors cardio / hors PDF | Latent | Couverture EDN |

**Risques clos récemment :** PDR-D2 offline intégral (lots D2-A…I livrés — certification produit, repair/purge/stale, clôture gouvernance D2-I) · incohérence manifest slice vs full-chapter (Étape 0) · SVG MM-pump orphelin dans `figures/` (relocated) · legacy lou-build · migration FIL A Item 234 · écart édition golden master (corrigé — **2022**, [PDR-B2](governance/PRODUCT-DECISION-REGISTRY.md)).

---

## Dette ouverte

| Dette | État | Référence |
|---|---|---|
| Reliquat FIL A — `chapter-analysis/…/official-college.md` | À supprimer après CI | Migration FIL A |
| Composition Engine (7 vues) | **Clôturée** (Lots A–F) | [`governance/COMPOSITION-IMPLEMENTATION-DEBT.md`](governance/COMPOSITION-IMPLEMENTATION-DEBT.md) |
| SVG V1 en production (Stage G) vs moteur grammaire cible | Ouverte | [PDR-F4](governance/PRODUCT-DECISION-REGISTRY.md) |
| F2 sidecars G/H | Ouverte | Risques ci-dessus |

---

## Indicateurs

Valeurs courantes — définitions dans [`MASTER_ROADMAP.md` § Indicateurs structurels](MASTER_ROADMAP.md#indicateurs-structurels).

| Indicateur | Mesuré | Notes |
|---|---|---|
| **Package de référence complet** | **Oui** — Release `complete` PDR-A3 | 81 QCM + 3 scénarios ; 91/91 KP understanding ; 9/16 deferred mastery |
| **Reader Composition V1** | **Publiée** — tag `reader-composition-v1` ; Spec, Engine, ViewModel en production ; 249 unit + **70 smoke PASS** (9 OF-D2-*) | Audit indépendant ✅ Conforme |
| **PDR-D2 — Offline intégral** | **Publié** — tag `offline-certification-v1` ; lots D2-A…I livrés ; Browser Offline Manager seul certifiant ; 9 tests Playwright OF-D2-* PASS | Contrat [`OFFLINE-COMPONENT-CONTRACT.md`](contracts/components/OFFLINE-COMPONENT-CONTRACT.md) en vigueur |
| **Reader V1 — critères d'acceptation** | **Non prononcés** — phase Reader Acceptance V1 active | 1 vue `planned` (Amorçage) ; Collège officiel alimenté ; **PDR-D1 clôturé** ; **PDR-D2 clôturé** ; patrimoine, reprise de session, recherche ouverts ; fixture CI branchée, validation GitHub Actions après push |
| **Effort humain / chapitre publié** | Non mesuré systématiquement | — |
| **Complétude source (234)** | Chapitre entier — 109 KPs, réconciliation v3 PASS | Évaluation : 81 QCM (91/91 KP understanding) + 3 scénarios |
| **Grounding déterministe** | Non consolidé au niveau projet | Facettes évaluation → KP → ancres inventaire (pas encore sidecar ground dédié) |
| **Reproductibilité du build en CI** | **Validée** — gate fixture 234 PASS sur GitHub Actions (`test:ci`, sans suite slice OAP) | Run [#30689638119](https://github.com/Fabienxyz/lou-medecine/actions/runs/30689638119) ; intégration slice hors gate via `npm run test:integration` (~3–5 min) |
| **Décisions humaines / chapitre** | Non suivi en production | — |
| lou-build validate PASS (packages FIL B) | **2** / 22 (234 full-chapter, 330) | 234 : validate + build PASS ; Release `complete` ; **1** package complet PDR-A3 |
| Tests lou-build | **180/180** PASS | 159 JS + 21 TS (test:ci) ; intégration slice 18 (test:integration) ; 3 tests Browser Offline Manager (D2-G) |
| Références FIL A opérationnelles | **0** | |

---

## Prochaines étapes

Ordre hérité de [`MASTER_ROADMAP.md` § Dépendances](MASTER_ROADMAP.md#dépendances) — **pas une repriorisation locale**.

1. **Reader Acceptance V1** — critères PDR-B1/B5/D/E sur package 234 complet (cadre global).
2. **Patrimoine & publication** — avancement implémentation V1 (parallèle).
3. **CI** — fixture et non-régression sur package complet (parallèle).
4. **Validation pédagogique Lou** — package + Reader accepté.
5. **Extension optionnelle** — 7 KP mastery restants + scénarios variant/station si intérêt pédagogique.

---

## Historique récent

Fenêtre utile à la lecture immédiate. Détail antérieur → [`docs/releases/`](releases/) et historique Git.

| Date | Événement |
|---|---|
| 2026-08-01 | **Publication E-C** — `0d7ba1d` `feat(renderer): implement learner patrimony snapshot export` sur `origin/main` ; LP-05 satisfait ; 333 tests PASS ; PDR-E5 export §8 livré — import E-D ouvert |
| 2026-08-01 | **Ouverture lot E-C** — export Learner Snapshot (PDR-E5 §8, contrat E-A §8) ; persistance E-B publiée sur `origin/main` |
| 2026-08-01 | **Publication E-B** — `9abd4ba` `feat(renderer): implement release-scoped learner patrimony` sur `origin/main` ; 313 tests PASS |
| 2026-08-01 | **E-B — persistance Release-scoped** — `learner-patrimony.js`, migration IndexedDB v5, corrections audit E1–E6 |
| 2026-08-01 | **E-A — Learner Patrimony Component Contract** — [`LEARNER-PATRIMONY-COMPONENT-CONTRACT.md`](contracts/components/LEARNER-PATRIMONY-COMPONENT-CONTRACT.md) en vigueur ; PDR-E1…E6 ; index contrats mis à jour |
| 2026-08-01 | **Publication PDR-D2** — tag `offline-certification-v1` sur `origin/main` ; commit `docs(governance): finalize PDR-D2 publication state` ; handover synchronisé |
| 2026-08-01 | **D2-I — clôture PDR-D2** — propagation gouvernance ; lots D2-A…I livrés ; objectif actif → Acceptation Reader V1 ; commit `docs(governance): close PDR-D2 offline implementation` |
| 2026-08-01 | **D2-H — clarifications contractuelles** — purge administrative hors graphe §5.2 ; détection stale non automatique à l'ouverture Reader ; `offline_ready` = dernier état certifié ; commit `docs(contract): clarify offline lifecycle semantics` |
| 2026-08-01 | **D2-H — Update / Repair / Archive** — `repair`, `purge`, `detectStale`, `invalidateIfStale` dans Browser Offline Manager ; archivage sans reset offline ; 8 tests unit D2-H PASS |
| 2026-08-01 | **D2-G — Browser Integration & Offline Certification** — Reader mode produit (`?product=1`) via Browser Package Access ; Browser Offline Manager seul certifiant `offline_ready`/`failed` ; 9 tests Playwright OF-D2-* + 3 unit Browser Offline Manager PASS |
| 2026-08-01 | **D2-F — Préparation automatique après installation (refactor)** — hook post-install → `OfflineManager.prepare` (Runtime Node interne) ; **sans certification** `offline_ready`/`failed` ; `offline_status` reste `not_prepared` jusqu'à D2-G ; 11 tests adaptés |
| 2026-08-01 | **D2-F — Préparation automatique après installation** — hook post-install → `OfflineManager.prepare` ; Runtime Node (filesystem) ; ~~transitions via `transitionCatalogOfflineStatus`~~ (retiré — certification réservée D2-G) |
| 2026-08-01 | **D2-E — Runtime Offline** — `offline-runtime.js` : precache shell, namespace `lou-offline-<release_id>-v1`, préparation transactionnelle, routage `/library/releases/…` ; bridge Offline Manager ; SW module ; 17 tests dédiés |
| 2026-08-01 | **D2-C — Offline Manager** — `offline-manager.js` : énumération artefacts via Package Access, vérif digest, préparation runtime Node ; **ne certifie plus** `offline_status` (D2-G) ; 19 tests dédiés |
| 2026-08-01 | **Harmonisation lots PDR-D2** — séquence officielle D2-A…I ; [`OFFLINE-IMPLEMENTATION-PLAN.md`](governance/OFFLINE-IMPLEMENTATION-PLAN.md) |
| 2026-08-01 | **D2-B — Offline State Model** — `offline-state.js` : machine à états, validation transitions, persistance `offline_status` dans `library.json` ; migration legacy → `not_prepared` ; 13 tests dédiés |
| 2026-08-01 | **D2-A — Offline Component Contract** — [`OFFLINE-COMPONENT-CONTRACT.md`](contracts/components/OFFLINE-COMPONENT-CONTRACT.md) en vigueur ; `offline_status` porté par `library.json` ; index contrats mis à jour |
| 2026-08-01 | **Clôture PDR-D1** — bibliothèque installable : D1-A Library Catalog Contract · D1-B identité Release · D1-C installation atomique · D1-D Package Access ; objectif actif → PDR-D2 |
| 2026-08-01 | **D1-D — Package Access** — `createPackageAccess` : catalogue, manifest, artefacts déclarés ; lecture seule ; frontière Reader ↔ bibliothèque |
| 2026-08-01 | **D1-C — Installation atomique** — `lou-library install` → `LIBRARY_ROOT` + `library.json` ; activation / archivage ; vérif `content_digest` |
| 2026-08-01 | **D1-B — Identité Release** — `publication_version`, `release_id`, `content_digest` portés par le manifest publié (lou-build) |
| 2026-08-01 | **D1-A — Library Catalog Contract** — [`LIBRARY-CATALOG-CONTRACT.md`](contracts/components/LIBRARY-CATALOG-CONTRACT.md) en vigueur ; index contrats mis à jour |
| 2026-08-01 | **Fixture CI 234 validée** — run GitHub Actions [#30689638119](https://github.com/Fabienxyz/lou-medecine/actions/runs/30689638119) PASS (~3 min) ; Lot 1 clôturé |
| 2026-08-01 | **Fixture CI 234** — scission `test:ci` / `test:integration` (`slice.test.ts` hors gate, timeout CI) ; workflow + script local alignés |
| 2026-08-01 | **Fixture CI 234 branchée** — workflow GitHub Actions `ci-234.yml` + script local `scripts/ci-234.sh` ; première run GitHub Actions timeout `slice.test.ts` |
| 2026-08-01 | **Infra offline Reader minimale** — package autonome Collège, shell sans CDN, SW cache-first, offline après warm cache ; 5 tests Playwright offline ; 249 unit + 61 smoke PASS — **PDR-D2 complet non satisfait** |
| 2026-08-01 | **Publication Reader Composition V1** — commits `08546b3` (code) + `65f8a55` (gouvernance) ; tag `reader-composition-v1` sur `origin/main` ; phase active Reader Acceptance V1 |
| 2026-07-31 | **Clôture Reader Composition V1** (Lots A–F) — Spec, Engine, ViewModel en production ; manifests neutres ; `buildProjectionTabs` supprimé ; audit indépendant ✅ Conforme |
| 2026-07-31 | **Capitalisation évaluation 234 tranche 2** — 81 Questions (`q-234-01`…`81`) ; couverture understanding 91/91 ; 9 Q mastery ; Release `complete` ; audit `build/evaluation-editorial-audit.md` ; validate/build PASS |
| 2026-07-31 | **Capitalisation évaluation 234 tranche 1** — 15 Questions + 3 Scénarios (standard/trap/synthesis) ; registres + wiring manifest lou-build |
| 2026-07-31 | **Tag `editorial-architecture-v1`** — gel officiel architecture éditoriale publié sur `origin/main` (commit `54c3054`) |
| 2026-07-31 | **Réconciliation architecture éditoriale** — Release = Chapter Package ; Questions/Scénarios dans Release ; vocabulaire absences (contrat 08 §5) ; triple ancrage apprenant ; ADR-006 / doc 17 alignés sur archivage et bascule atomique |
| 2026-07-31 | **Contrat 09** — spécification normative Scénario clinique |
| 2026-07-31 | **Contrat 08** — architecture éditoriale Release (coexistence, complétude, absences) |
| 2026-07-31 | **Contrat 07** — spécification normative Question d'évaluation (QCM) |
| 2026-07-31 | Étape 0 — baseline canonique Item 234 : manifest full-chapter régénéré, MM-pump SVG hors `figures/`, hook test slice → rebuild ; validate/build + 117/117 tests PASS |
| 2026-07-31 | Phase 6 capitalisation 234 — réconciliation chapitre complet (`reconciliation-full-v3.yaml`), mode `full-chapter`, validate/build PASS ; tranche OAP archivée (`reconciliation-oap-slice.yaml`) |
| 2026-07-31 | Correction golden master — édition Collège **2022** ([PDR-B2](governance/PRODUCT-DECISION-REGISTRY.md), [PDR-C7](governance/PRODUCT-DECISION-REGISTRY.md)) ; levée blocage alignement éditorial |
| 2026-07-30 | Migration pilotage — [`DOCUMENT_ARCHITECTURE.md`](governance/DOCUMENT_ARCHITECTURE.md), [`MASTER_ROADMAP.md`](MASTER_ROADMAP.md) A.7, [`PROJECT_STATE.md`](PROJECT_STATE.md) A.8 ; capitalisation [ADR-006](adr/ADR-006-pedagogical-patrimony-and-edition-lineage.md), [PRODUCT-DECISION-REGISTRY](governance/PRODUCT-DECISION-REGISTRY.md) |
| 2026-07-28 | Phase 3.5 close — cutover production lou-build ([`releases/phase-3.5-completion-report.md`](releases/phase-3.5-completion-report.md)) |
| 2026-07-28 | Phase 3 close — Pipeline Engine v1 ; tag `lou-build-pipeline-v1` |

---

## Points d'entrée

| Besoin | Document |
|---|---|
| Intention et séquencement | [`MASTER_ROADMAP.md`](MASTER_ROADMAP.md) |
| Pourquoi une décision | [`PRODUCT-DECISION-REGISTRY.md`](governance/PRODUCT-DECISION-REGISTRY.md) |
| Organisation du pilotage | [`DOCUMENT_ARCHITECTURE.md`](governance/DOCUMENT_ARCHITECTURE.md) |
| Obligations techniques | [`contracts/00-INDEX.md`](contracts/00-INDEX.md) |
| Plan lots PDR-D2 (offline) | [`governance/OFFLINE-IMPLEMENTATION-PLAN.md`](governance/OFFLINE-IMPLEMENTATION-PLAN.md) |
| Rapports de clôture | [`docs/releases/`](releases/) |
| Détail Reader Composition | [`renderer/READER-COMPOSITION-V1-FREEZE.md`](renderer/READER-COMPOSITION-V1-FREEZE.md) |
| Dette Composition (clôturée) | [`governance/COMPOSITION-IMPLEMENTATION-DEBT.md`](governance/COMPOSITION-IMPLEMENTATION-DEBT.md) |
| Détail migration Reader | [`renderer/10-MIGRATION_PLAN.md`](renderer/10-MIGRATION_PLAN.md) |
| Détail industrialisation (ultérieur) | [`acquisition/industrialization-plan.md`](acquisition/industrialization-plan.md) |

---

*Révision 2026-08-01 — E-C publié (Learner Snapshot / LP-05) ; lot E-D ouvert ; PDR-E5 partiellement satisfait (export livré, import ouvert) ; objectif actif : Acceptation Reader V1 — non prononcée.*
