# Lou Médecine — État du projet

**Photographie opérationnelle** — document vivant.

**Version projet :** 0.1.0  
**Dernière mise à jour :** 2026-08-01 (publication tag `reader-composition-v1` ; phase active : Reader Acceptance V1)

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
| **Objectif actif** | [Acceptation Reader V1](MASTER_ROADMAP.md#acceptation-reader-v1) |
| **Livrable visé** | Reader local installable, 7 vues alimentées sur le package de capitalisation de référence ([PDR-B1](governance/PRODUCT-DECISION-REGISTRY.md), [PDR-B5](governance/PRODUCT-DECISION-REGISTRY.md)) |
| **Chemin critique** | **Reader Acceptance V1** — goulet principal avant validation pédagogique Lou et industrialisation |
| **Blocage structurant** | Critères d'**acceptation** Reader V1 non prononcés — infra offline **minimale** livrée (package autonome Collège, SW cache-first, usage après warm cache) ; **PDR-D2 complet ouvert** ; PDR-D1, patrimoine, reprise de session, recherche, CI, Amorçage ouverts |
| **Dernier jalon produit** | **Reader Composition V1 publiée** — tag `reader-composition-v1` (`65f8a55`) sur `origin/main` ; Lots A–F ; audit indépendant ✅ Conforme ; package 234 Release `complete` (81 QCM + 3 scénarios) |

**Constats factuels (acquis pipeline, non confondus avec la Fabrique productrice) :**

- Pipeline validateur lou-build en production — CLI unique `src/cli/build.ts` ; stages A–K ; tag `lou-build-pipeline-v1`.
- **Architecture éditoriale normative gelée** — contrats 07–09 ; tag `editorial-architecture-v1` publié sur `origin/main`.
- **Reader Composition V1 en production** — Spec → Engine → Reading View Model → Renderer ; manifests neutres ; couplage « 1 projection = 1 onglet » supprimé sur le chemin nominal ; legacy prototype isolé (manifest 404).
- Acquisition en mode maintenance ([ADR-004](adr/ADR-004-acquisition-architecture-frozen.md)).
- **Infra offline Reader minimale** — package autonome (Collège in-package), shell sans CDN, Service Worker cache-first ; fonctionnement hors ligne après warm cache ; **PDR-D2 complet et PDR-D1 restent ouverts** (cache SW ≠ bibliothèque installable).
- La **Fabrique productrice autonome** n'est **pas** opérationnelle — objectif forward ([PDR-C1](governance/PRODUCT-DECISION-REGISTRY.md)).

---

## Chantiers en cours

| Chantier | Objectif de rattachement | Focus actuel |
|---|---|---|
| **Reader Acceptance V1** | Acceptation Reader V1 | Phase **active** — critères PDR-B1/B5/D/E sur package 234 complet ; infra offline minimale livrée ; **PDR-D2 complet ouvert** ; PDR-D1, Amorçage, patrimoine, reprise de session, recherche ouverts |
| **Patrimoine & publication** | Patrimoine V1 ([ADR-006](adr/ADR-006-pedagogical-patrimony-and-edition-lineage.md)) | Modèle de publication, version package, persistance — en retard sur la spec ; co-vérification prévue à l'acceptation Reader |
| **CI & maintenabilité** | Maintenabilité et CI ([PDR-G6](governance/PRODUCT-DECISION-REGISTRY.md)) | Fixture sur package 234 complet ; CI non opérationnelle comme exigence de sortie |
| **Capitalisation Item 234** | Package de référence complet | **Clôturé** — Release `complete` ; extension optionnelle (7 KP mastery restants) |

---

## Livrables de référence — instances

| Rôle (roadmap) | Instance courante | État observé |
|---|---|---|
| **Package de capitalisation de référence** | Item **234** — Insuffisance cardiaque — édition Collège **2022** ([PDR-B2](governance/PRODUCT-DECISION-REGISTRY.md)) | Understanding + **évaluation complète** — 81 Questions + 3 Scénarios ; `editorial_completeness: complete` ; couverture understanding 91/91 ; validate/build PASS |
| **Fixture de non-régression** | — | **À établir** — package complet publié, CI à brancher |

---

## Blocages et risques ouverts

| Blocage / risque | Impact | Objectif ou chantier concerné |
|---|---|---|
| Package 234 — 7 KP mastery sans QCM (progressif) | N'empêche pas Release `complete` ; extension future possible | Capitalisation (extension optionnelle) |
| Fallback renderer legacy (`generated-assets/`, manifest 404) | Prototype historique isolé — hors chemin nominal Composition | Reader Acceptance V1 (extinction ADR-002 ultérieure) |
| Pipeline sémantique non automatisé | Bloque industrialisation aval (pas le golden master capitalisé manuellement) | Industrialisation Fabrique productrice |
| Build SVG non reproductible byte-identique | Bloque CI fiable | Maintenabilité et CI |
| Patrimoine non implémenté (version package, export/restauration) | Bloque critères V1 patrimoine + acceptation Reader | Patrimoine · Acceptation Reader V1 |
| PDR-D2 offline intégral non satisfait | Cache SW ≠ packages installés ([PDR-D1](governance/PRODUCT-DECISION-REGISTRY.md)) ; offline après warm cache seulement | Acceptation Reader V1 |
| F2 — ordre écriture sidecars G/H vs verdict I | Cohérence disque lou-build | Dette pipeline |
| Scale-out prématuré (tentation multi-chapitres partiels) | Dispersion — contredit [PDR-C2](governance/PRODUCT-DECISION-REGISTRY.md) | — (risque de pilotage) |
| Formats structurés EDN non évalués | Latent — nouveau pipeline si requis ([ADR-004](adr/ADR-004-acquisition-architecture-frozen.md) §6) | Couverture EDN |
| Portabilité hors cardio / hors PDF | Latent | Couverture EDN |

**Risques clos récemment :** incohérence manifest slice vs full-chapter (Étape 0) · SVG MM-pump orphelin dans `figures/` (relocated) · legacy lou-build · migration FIL A Item 234 · écart édition golden master (corrigé — **2022**, [PDR-B2](governance/PRODUCT-DECISION-REGISTRY.md)).

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
| **Reader Composition V1** | **Publiée** — tag `reader-composition-v1` ; Spec, Engine, ViewModel en production ; 249 unit + 61 smoke PASS | Audit indépendant ✅ Conforme |
| **Reader V1 — critères d'acceptation** | **Non prononcés** — phase Reader Acceptance V1 active | 1 vue `planned` (Amorçage) ; Collège officiel alimenté ; infra offline minimale livrée ; **PDR-D2 complet ouvert** ; PDR-D1, patrimoine, reprise de session, recherche, CI ouverts |
| **Effort humain / chapitre publié** | Non mesuré systématiquement | — |
| **Complétude source (234)** | Chapitre entier — 109 KPs, réconciliation v3 PASS | Évaluation : 81 QCM (91/91 KP understanding) + 3 scénarios |
| **Grounding déterministe** | Non consolidé au niveau projet | Facettes évaluation → KP → ancres inventaire (pas encore sidecar ground dédié) |
| **Reproductibilité du build en CI** | **Non** — CI non opérationnelle comme exigence | Voir risque SVG / CI |
| **Décisions humaines / chapitre** | Non suivi en production | — |
| lou-build validate PASS (packages FIL B) | **2** / 22 (234 full-chapter, 330) | 234 : validate + build PASS ; Release `complete` ; **1** package complet PDR-A3 |
| Tests lou-build | **117/117** PASS | 78 JS + 39 TS |
| Références FIL A opérationnelles | **0** | |

---

## Prochaines étapes

Ordre hérité de [`MASTER_ROADMAP.md` § Dépendances](MASTER_ROADMAP.md#dépendances) — **pas une repriorisation locale**.

1. **Reader Acceptance V1** — critères PDR-B1/B5/D/E sur package 234 complet (chantier actif).
2. **Patrimoine & publication** — avancement implémentation V1 (parallèle).
3. **CI** — fixture et non-régression sur package complet (parallèle).
4. **Validation pédagogique Lou** — package + Reader accepté.
5. **Extension optionnelle** — 7 KP mastery restants + scénarios variant/station si intérêt pédagogique.

---

## Historique récent

Fenêtre utile à la lecture immédiate. Détail antérieur → [`docs/releases/`](releases/) et historique Git.

| Date | Événement |
|---|---|
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
| Rapports de clôture | [`docs/releases/`](releases/) |
| Détail Reader Composition | [`renderer/READER-COMPOSITION-V1-FREEZE.md`](renderer/READER-COMPOSITION-V1-FREEZE.md) |
| Dette Composition (clôturée) | [`governance/COMPOSITION-IMPLEMENTATION-DEBT.md`](governance/COMPOSITION-IMPLEMENTATION-DEBT.md) |
| Détail migration Reader | [`renderer/10-MIGRATION_PLAN.md`](renderer/10-MIGRATION_PLAN.md) |
| Détail industrialisation (ultérieur) | [`acquisition/industrialization-plan.md`](acquisition/industrialization-plan.md) |

---

*Révision 2026-08-01 — infra offline Reader minimale ; phase active Reader Acceptance V1 (PDR-D2 complet ouvert).*
