# Lou Médecine — État du projet

**Photographie opérationnelle** — document vivant.

**Version projet :** 0.1.0  
**Dernière mise à jour :** 2026-08-03 (Phase T0 — architecture validation ; Phase 0.1 clôturée)

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
| **Objectif actif** | [Reference Product Chapter (234)](MASTER_ROADMAP.md#reference-product-chapter-234) — **laboratoire produit** |
| **Phase opérationnelle active** | **Phase 2** — Amorçage cognitif ([roadmap opérationnelle](MASTER_ROADMAP.md#roadmap-opérationnelle--reference-product-chapter-234)) — en attente de démarrage |
| **Livrable visé** | Amorçage cognitif exploitable dans le Reader — voir Phase 2 |
| **Chemin critique** | **Phases 2→8 (234)** → **Phase 9 (224)** → capitalisation industrielle → Validation Corpus V1 → Industrialisation EDN |
| **Blocage structurant** | Reference Production Chapter 224 **non démarré** — Phase 9, après Product Freeze |
| **Dernier jalon produit** | **Phase 0.1** — chemin de consommation Fabrique → Reader stabilisé (Product Review canonique, auto-repair digest) ; 2026-08-03 |

**Chaîne de consommation Fabrique → Reader (Phase 0.1 clôturée).** La Phase 0.1 a fiabilisé le chemin entre publication du package et observation dans le Reader, sans modifier les contrats Fabrique ni Composition V1. La chaîne de consommation est désormais **considérée comme stabilisée** pour poursuivre les phases éditoriales (Phase 2 et suivantes).

**Décisions d'architecture en vigueur :**

- **`release_id` stable** pendant toute la construction éditoriale d'un chapitre — pas d'incrément automatique de `publication_version` à chaque build intermédiaire.
- **`content_digest` = vérité matérielle** du contenu publié.
- **Auto-réparation Reader** — au bootstrap produit, le Reader détecte toute divergence de digest ou de runtime (`detectStale()`), exécute `repair()` si nécessaire, recertifie, puis poursuit — sans vidage manuel de cache ni changement de `release_id`.
- **Product Review officielle** — procédure exclusive : [`scripts/product-review-234.sh`](../scripts/product-review-234.sh) en mode produit (`?product=1`) ; bibliothèque d'exécution `.local/product-review-library/` (gitignored). Détail : [`docs/renderer/PRODUCT-REVIEW.md`](renderer/PRODUCT-REVIEW.md).

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
| **Reference Product Chapter (234)** | **Laboratoire produit** — Phases 2–8 | **Phase 0.1 clôturée** — Product Review canonique ; auto-repair `content_digest` au bootstrap ; **Phase 2** (Amorçage) prête à démarrer |
| **Reference Production Chapter (224)** | Industrialisation production — Phase 9 | **Non démarré** — après Product Freeze 234 ; reprend produit figé ; mesure coûts/temps/LLM ; optimise **méthode**, pas produit |
| **Validation Corpus V1 (Fabrique)** | Qualification corpus Fabrique V1 | **Différée** — **après validation complète du 224** ; chapitres suivants (230 ou autre) **non tranchés** ([PDR-C8](governance/PRODUCT-DECISION-REGISTRY.md)) |
| **Validation pédagogique Lou** | Validation pédagogique de la méthode | **En attente** — conditionnée par Validation Corpus V1 ([PDR-B4](governance/PRODUCT-DECISION-REGISTRY.md), [PDR-C8](governance/PRODUCT-DECISION-REGISTRY.md)) |
| **Patrimoine & publication** | Patrimoine V1 ([ADR-006](adr/ADR-006-pedagogical-patrimony-and-edition-lineage.md)) | **E-D publié** — import / restauration patrimoniale (LP-06, PDR-E5 §8–§9) ; E-C export ; E-B persistance ; lots E-A…E-D **clôturés** |
| **CI & maintenabilité** | Maintenabilité et CI ([PDR-G6](governance/PRODUCT-DECISION-REGISTRY.md)) | **Phase T0 clôturée** — architecture validation [`TEST_ARCHITECTURE_V1.md`](testing/TEST_ARCHITECTURE_V1.md) ; gate produit `test:smoke:product` ; workflow [`.github/workflows/ci-234.yml`](../.github/workflows/ci-234.yml) |

---

## Livrables de référence — instances

| Rôle (roadmap) | Instance courante | État observé |
|---|---|---|
| **Reference Product Chapter (234)** | Item **234** — Insuffisance cardiaque — édition Collège **2022** | Release `complete` ; **laboratoire produit** — finalisation en cours ; coût **ne pilote pas** les choix éditoriaux |
| **Reference Production Chapter (224)** | Item **224** — HTA — édition Collège **2022** | **Non démarré** — industrialisation complète **après** Product Freeze 234 |
| **Package de capitalisation de référence (normatif)** | Item **234** ([PDR-B2](governance/PRODUCT-DECISION-REGISTRY.md)) | Understanding + **évaluation complète** — 81 Questions + 3 Scénarios ; `editorial_completeness: complete` ; couverture understanding 91/91 ; validate/build PASS |
| **Fixture de non-régression** | Item **234** — workflow [`.github/workflows/ci-234.yml`](../.github/workflows/ci-234.yml) | Gate : validate + `test:ci` + unit + `test:smoke:product` (authoritative) + `test:smoke:engineering` ; script [`scripts/validate-reader-v1.sh`](../scripts/validate-reader-v1.sh) |

---

## Blocages et risques ouverts

| Blocage / risque | Impact | Objectif ou chantier concerné |
|---|---|---|
| Package 234 — 7 KP mastery sans QCM (progressif) | N'empêche pas Release `complete` ; extension future possible | Capitalisation (extension optionnelle) |
| Fallback renderer legacy (`generated-assets/`, manifest 404) | Prototype historique isolé — hors chemin nominal Composition | Reader Acceptance V1 (extinction ADR-002 ultérieure) |
| Pipeline sémantique non automatisé | Bloque industrialisation aval (pas le golden master capitalisé manuellement) | Industrialisation Fabrique productrice |
| Build SVG non reproductible byte-identique | Bloque CI fiable | Maintenabilité et CI |
| Patrimoine apprenant — export / restauration | **E-D publié** — export (E-C) + import (E-D) ; LP-05 et LP-06 satisfaits ; **PDR-E5 livré** ; Reader Acceptance V1 **prononcé** | Patrimoine · Validation pédagogique Lou |
| F2 — ordre écriture sidecars G/H vs verdict I | Cohérence disque lou-build | Dette pipeline |
| Scale-out prématuré (tentation multi-chapitres partiels) | Dispersion — contredit la séquence RPC 234 → Freeze → RPC 224 → Corpus | — (risque de pilotage) |
| Formats structurés EDN non évalués | Latent — nouveau pipeline si requis ([ADR-004](adr/ADR-004-acquisition-architecture-frozen.md) §6) | Couverture EDN |
| Portabilité hors cardio / hors PDF | Latent | Couverture EDN |

**Risques clos récemment :** Phase 0.1 — Product Review fiable (auto-repair digest, procédure canonique, diagnostics explicites) · smoke CN-07 obsolète post-AP-D (CI-01) · PDR-D2 offline intégral · incohérence manifest slice vs full-chapter (Étape 0) · SVG MM-pump orphelin (relocated) · legacy lou-build · migration FIL A Item 234 · écart édition golden master (corrigé — **2022**, [PDR-B2](governance/PRODUCT-DECISION-REGISTRY.md)).

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
| **Reader Composition V1** | **Publiée** — tag `reader-composition-v1` ; Spec, Engine, ViewModel en production ; **651 unit PASS** | Audit indépendant ✅ Conforme |
| **PDR-D2 — Offline intégral** | **Publié** — tag `offline-certification-v1` ; lots D2-A…I livrés ; Browser Offline Manager seul certifiant ; 9 tests Playwright OF-D2-* PASS | Contrat [`OFFLINE-COMPONENT-CONTRACT.md`](contracts/components/OFFLINE-COMPONENT-CONTRACT.md) en vigueur |
| **PDR-D6 — Recherche locale** | **Publié** — tag `local-search-v1` ; contrat [`LOCAL-SEARCH-COMPONENT-CONTRACT.md`](contracts/components/LOCAL-SEARCH-COMPONENT-CONTRACT.md) en vigueur ; lots D6-A…G ; indexation Amorçage (C-CP-09, AP-F) | Implémentation Reader validée |
| **PDR-D7 — Préférences d'affichage** | **Publié** — tag `display-preferences-v1` ; contrat [`DISPLAY-PREFERENCES-COMPONENT-CONTRACT.md`](contracts/components/DISPLAY-PREFERENCES-COMPONENT-CONTRACT.md) en vigueur ; lots D7-A…G |
| **Reader V1 — critères d'acceptation** | **Prononcés** — 2026-08-02 ; tag `reader-acceptance-v1` ; **7 vues alimentées** sur package 234 | Acquis clôturé — **Phase 2** = prochain jalon opérationnel |
| **Effort humain / chapitre publié** | Non mesuré systématiquement | — |
| **Complétude source (234)** | Chapitre entier — 109 KPs, réconciliation v3 PASS | Évaluation : 81 QCM (91/91 KP understanding) + 3 scénarios |
| **Grounding déterministe** | Non consolidé au niveau projet | Facettes évaluation → KP → ancres inventaire (pas encore sidecar ground dédié) |
| **Reproductibilité du build en CI** | **Validée** — gate 234 sur `main` | validate + `test:ci` + unit + smoke product (authoritative) + smoke engineering ; slice hors gate via `npm run test:integration` |
| **Architecture validation Reader V1** | **Publiée** — Phase T0 | [`docs/testing/TEST_ARCHITECTURE_V1.md`](testing/TEST_ARCHITECTURE_V1.md) — six familles ; Product Review alignée |
| **Décisions humaines / chapitre** | Non suivi en production | — |
| lou-build validate PASS (packages FIL B) | **2** / 22 (234 full-chapter, 330) | 234 : validate + build PASS ; Release `complete` ; **1** package complet PDR-A3 |
| Tests lou-build | **180/180** PASS | 159 JS + 21 TS (test:ci) ; intégration slice 18 (test:integration) ; 3 tests Browser Offline Manager (D2-G) |
| Références FIL A opérationnelles | **0** | |

---

## Prochaines étapes

Ordre hérité de [`MASTER_ROADMAP.md` § Roadmap opérationnelle](MASTER_ROADMAP.md#roadmap-opérationnelle--reference-product-chapter-234) — **pas une repriorisation locale**.

**Pilotage :** produit et **7 vues Reader**. Les lots Reader Acceptance (D1, D2, D4, D6, AP-A…AP-F) sont **clôturés** — acquis, pas chemin critique. L'audit [`docs/analysis/rpc-234-execution-audit.md`](analysis/rpc-234-execution-audit.md) = **checklist d'implémentation**.

| Phase | Intitulé | Statut |
|---|---|---|
| **0** | Compléter la chaîne Fabrique → Reader | **Clôturée** |
| **0.1** | Fiabiliser le chemin de consommation Fabrique → Reader | **Clôturée** |
| **1** | Modèle mental | **Clôturée** |
| **2** | Amorçage cognitif | **Prochaine** |
| **3** | Notions (11 notions, figures, walkthroughs, développements, points d'attention) | En attente |
| **4** | Cas cliniques | En attente |
| **5** | Collège officiel + Notes | En attente |
| **6** | Validation intégrée | En attente |
| **7** | Product Review avec Lou | En attente |
| **8** | Corrections + Product Freeze | En attente |
| **9** | Reference Production Chapter (224) | En attente — après Phase 8 |

**Après Phase 9 :** capitalisation industrielle → Validation Corpus V1 ([PDR-C8](governance/PRODUCT-DECISION-REGISTRY.md)) → choix chapitres suivants (230 ou autre) → validation pédagogique Lou → industrialisation EDN.

**Parallèle (non bloquant Phases 0–8) :** patrimoine & publication · CI & fixture 234.

---

## Historique récent

Fenêtre utile à la lecture immédiate. Détail antérieur → [`docs/releases/`](releases/) et historique Git.

| Date | Événement |
|---|---|
| 2026-08-03 | **Phase 0.1 clôturée** — Product Review canonique (`scripts/product-review-234.sh`) ; bibliothèque `.local/` gitignored ; `ensureReleaseReady()` auto-repair digest ; diagnostics bootstrap explicites ; tests consommation |
| 2026-08-03 | **Phase 1 clôturée** — figure `MM-pump-decompensation` publiée via Stage G ; walkthrough figure-first ; zoom Reader |
| 2026-08-03 | **Phase 0 clôturée** — sync fixture Reader ; Stage G `mental_model`/`confusion` + branchement `visual-spec` ; assainissement moteur SVG V1 ; build/regenerate automatiques |
| 2026-08-03 | **Roadmap opérationnelle Phases 0–9** — pilotage par les 7 vues Reader ; lots D/AP = acquis ; audit 234 = checklist implémentation ; Phase 0 active |
| 2026-08-02 | **Nettoyage documentaire Reader V1** publié (`e479e78`) — modèle 7 vues ; doc `00-READER-V1-PRODUCT-MODEL.md` |
| 2026-08-02 | **234 = laboratoire produit** — surproduction légère assumée ; Product Review = usage réel Lou ; coût étudié sur 224 uniquement |
| 2026-08-02 | **Séparation produit / production** — 234 = Reference Product Chapter ; 224 = Reference Production Chapter ; Validation Corpus V1 après validation complète du 224 ; 230 = candidat futur |
| 2026-08-02 | **Pivot pilotage RPC 234** — finalisation produit ; *Observer d'abord. Généraliser ensuite.* |
| 2026-08-02 | **CI-01 clôturé** — realignement smoke CN-07 post-Reader Acceptance V1 ; commit `691dd6f` ; **122/122 smoke PASS** ; CI — Fixture 234 run [#22](https://github.com/Fabienxyz/lou-medecine/actions/runs/30732680037) SUCCESS |
| 2026-08-02 | **Reader Acceptance V1 prononcé** — gouvernance ; commit `27aa870` ; AP-A…AP-F ; tag `reader-acceptance-v1` |
| 2026-08-01 | **Publication AP-E** — Renderer Cognitive Priming + navigation EDN explicite (`a110a4e`) |
| 2026-08-01 | **Publication AP-D** — Composition Cognitive Priming (`cf74751`) |
| 2026-08-01 | **Publication AP-C** — Fabrique / package 234 Amorçage (`a8bd191`) |
| 2026-08-01 | **Publication D7** — clôture documentaire D7-G ; [`DISPLAY-PREFERENCES-COMPONENT-CONTRACT.md`](contracts/components/DISPLAY-PREFERENCES-COMPONENT-CONTRACT.md) en vigueur ; lots D7-A…G ; **589 unit + 18 smoke DP-F PASS** |
| 2026-08-01 | **Publication D6** — `docs(governance): publish local search (PDR-D6)` sur `origin/main` ; [`LOCAL-SEARCH-COMPONENT-CONTRACT.md`](contracts/components/LOCAL-SEARCH-COMPONENT-CONTRACT.md) en vigueur ; tag `local-search-v1` ; lots D6-A…G ; **589 unit + 19 smoke LS-F PASS** |
| 2026-08-01 | **Publication D4** — `feat(renderer): implement session resume (PDR-D4)` sur `origin/main` ; ResumePlan · Session Service · store `session_resume` (IndexedDB v7) · RestoreContext · CE-01…CE-08 ; shell offline inclut `restore-catalog-facts.js` ; **396 unit + 71 smoke PASS** |
| 2026-08-01 | **Publication E-D** — `c6821dc` `feat(renderer): implement learner patrimony snapshot import` sur `origin/main` ; LP-06 satisfait ; 351 tests PASS ; PDR-E5 export + import livré — lot D4 ouvert |
| 2026-08-01 | **Publication E-C** — `0d7ba1d` `feat(renderer): implement learner patrimony snapshot export` sur `origin/main` ; LP-05 satisfait ; 333 tests PASS ; PDR-E5 export §8 livré — import E-D ouvert |
| 2026-08-01 | **Ouverture lot E-C** — export Learner Snapshot (PDR-E5 §8, contrat E-A §8) ; persistance E-B publiée sur `origin/main` |
| 2026-08-01 | **Publication E-B** — `9abd4ba` `feat(renderer): implement release-scoped learner patrimony` sur `origin/main` ; 313 tests PASS |
| 2026-08-01 | **E-B — persistance Release-scoped** — `learner-patrimony.js`, migration IndexedDB v5, corrections audit E1–E6 |
| 2026-08-01 | **E-A — Learner Patrimony Component Contract** — [`LEARNER-PATRIMONY-COMPONENT-CONTRACT.md`](contracts/components/LEARNER-PATRIMONY-COMPONENT-CONTRACT.md) en vigueur ; PDR-E1…E6 ; index contrats mis à jour |
| 2026-08-01 | **Publication PDR-D2** — tag `offline-certification-v1` sur `origin/main` ; commit `docs(governance): finalize PDR-D2 publication state` ; handover synchronisé |
| 2026-08-01 | **D2-I — clôture PDR-D2** — propagation gouvernance ; lots D2-A…I livrés ; objectif actif → Acceptation Reader V1 ; commit `docs(governance): close PDR-D2 offline implementation` |
| 2026-08-01 | **D2-H — clarifications contractuelles** — purge administrative hors graphe §5.2 ; détection stale **branchée au bootstrap produit** (Phase 0.1) ; `offline_ready` = dernier état certifié |
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
| Détail Reference Product Chapter | [`docs/rpc/00-RPC-METHODOLOGY.md`](rpc/00-RPC-METHODOLOGY.md) |
| Détail industrialisation (ultérieur) | [`acquisition/industrialization-plan.md`](acquisition/industrialization-plan.md) |

---

*Révision 2026-08-03 — Phase 0.1 clôturée ; chaîne de consommation stabilisée ; Phase 2 prochaine ; lots D/AP clôturés.*
