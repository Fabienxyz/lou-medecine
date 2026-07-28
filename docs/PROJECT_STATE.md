# Lou Médecine — État du projet

**Photographie opérationnelle du projet** — **document vivant** du projet Lou Médecine.  
**Version projet :** 0.1.0  
**Dernière mise à jour :** 2026-07-28 (clôture Phase 3.5 — production cutover lou-build)

Ce document est mis à jour **lorsqu'un jalon important est franchi** (fin de phase, décision structurante, changement de risque majeur). La roadmap ([`MASTER_ROADMAP.md`](MASTER_ROADMAP.md)) reste volontairement **stable** ; l'état opérationnel vit ici.

Pour le séquencement, les priorités et les critères de réussite stables, voir [`MASTER_ROADMAP.md`](MASTER_ROADMAP.md). Pour l'usage des modèles, voir [`LLM_STRATEGY.md`](LLM_STRATEGY.md). Pour la **gouvernance fondamentale**, voir [`contracts/00-INDEX.md`](contracts/00-INDEX.md). Pour l'**architecture de référence gelée** (docs 14–19), voir [`renderer/README.md`](renderer/README.md). Pour l'implémentation détaillée, voir [`../IMPLEMENTATION_CONTRACT.md`](../IMPLEMENTATION_CONTRACT.md) et [`../FINAL_ARCHITECTURE.md`](../FINAL_ARCHITECTURE.md).

---

## Architecture v1 — GELÉE

Les documents suivants constituent désormais l'architecture officielle de Lou Médecine :

- Contrats fondamentaux 01–06 ([`contracts/00-INDEX.md`](contracts/00-INDEX.md))
- [Reader Architecture](renderer/14-LOU-READER-ARCHITECTURE.md)
- [Reader Functional Specification](renderer/15-READER-FUNCTIONAL-SPECIFICATION.md)
- [Publication ↔ Reader](renderer/16-CONTENT-TO-READER-ARCHITECTURE.md)
- [Publication Model](renderer/17-PUBLICATION-MODEL.md)
- [Build Architecture](renderer/18-BUILD-ARCHITECTURE.md)
- [Build Pipeline](renderer/19-BUILD-PIPELINE.md)

Cette architecture est désormais considérée comme **stable**.

Toute évolution future devra être motivée par un besoin démontré pendant l'implémentation.

Toute modification substantielle nécessitera une nouvelle révision explicite.

**Chaîne documentaire :** contrats 01–06 → 14 → 15 → 17 → 18 → 19 → 16.

---

## Changement de statut — 2026-07-28

**La Fabrique est terminée.** Pipeline Engine v1, stages typés A→K, CLI typée et cutover production (Phase 3.5) sont **clos**. Jalon : [`releases/phase-3.5-completion-report.md`](releases/phase-3.5-completion-report.md).

**Migration A→K définitivement achevée.** Wrappers legacy, `cli.js`, orchestration `runValidation`/`runBuild` et tests de parité retirés. Modules métier partagés conservés sous `lib/` comme bibliothèques internes.

**Phase active :** **Le Lecteur** (production — expérience apprenant, `demo/renderer/` → lecteur multi-chapitres conforme docs 14–15).

**Phase 0A — Gouvernance fondamentale terminée.** Les six contrats fondamentaux (`docs/contracts/01–06`) sont rédigés, audités transversalement et **gelés** (maintenance documentaire uniquement). Rapport de clôture : [`governance/PHASE_0A_COMPLETION.md`](governance/PHASE_0A_COMPLETION.md).

La **R&D Acquisition est terminée**. La couche d'acquisition (FIL B, Tool 01, Tool 02, qualification P1–P7) est **gelée** et entre en **mode maintenance** : seules les évolutions définies par [ADR-004](adr/ADR-004-acquisition-architecture-frozen.md) § 6 (bug bloquant, nouveau format source, nouvel ADR) sont autorisées. Jalon historique : [`releases/acquisition-rd-complete.md`](releases/acquisition-rd-complete.md).

---

## Phase active

| | |
|---|---|
| **Phase** | **Le Lecteur — production** |
| **Chantier actif** | Lecteur multi-chapitres, `library.json`, retrait progressif des fallbacks legacy renderer (ADR-002) |
| **Jalon précédent** | Phase 3.5 close — production cutover lou-build ([`releases/phase-3.5-completion-report.md`](releases/phase-3.5-completion-report.md)) |
| **Fabrique (lou-build)** | ✅ **Terminée** — chemin unique : `npm run validate` / `build` → `src/cli/build.ts` |
| **Après Lecteur** | Validation pédagogique (Phase 4) · scale-out industriel ([`acquisition/industrialization-plan.md`](acquisition/industrialization-plan.md)) |

**Acquisition :** mode maintenance (ADR-004). **Architecture v1 :** gelée — docs 14–19 stables. **Pipeline Engine v1 :** figé — unique pipeline de production. **Aucun** travail R&D sur Tool 01/Tool 02 sauf bug bloquant démontré.

---

## La Fabrique — statut final

| Composant | Statut |
|---|---|
| Pipeline Engine v1 (`src/pipeline/`) | ✅ Gelé — production |
| Stages typés A→K (`src/stages/`) | ✅ Gelés — migration définitive |
| CLI typée (`src/cli/build.ts`) | ✅ **Unique point d'entrée** |
| Wrappers legacy / `cli.js` / parité | ✅ Retirés (Phase 3.5) |
| Modules métier `lib/*.js` | ✅ Conservés — bibliothèques internes |
| `lib/package.js` | ✅ Résidu métier : `assembleManifest`, `invalidatePublishableState` |

Tag historique migration : **`lou-build-pipeline-v1`**. Tag production cutover proposé : **`lou-build-production-v1`** (voir rapport Phase 3.5).

---

## État de la gouvernance

| | |
|---|---|
| **Phase 0A** | ✅ **Terminée** — 2026-07-28 |
| **Architecture v1 (docs 14–19)** | ✅ **Gelée** — 2026-07-28 |
| **Phase 3 — Pipeline Migration** | ✅ **Terminée** — tag `lou-build-pipeline-v1` |
| **Phase 3.5 — Production Cutover** | ✅ **Terminée** — 2026-07-28 |
| **La Fabrique** | ✅ **Terminée** |
| **Contrats fondamentaux** | **01–06 gelés** — référence normative de gouvernance ([`contracts/00-INDEX.md`](contracts/00-INDEX.md)) |
| **Audit transversal** | ✅ Terminé — corrections de cohérence appliquées |
| **Maintenance autorisée** | Amendements documentaires explicites ; pas de modification d'invariants sans ADR |

**Prochaines étapes gouvernance :** les évolutions futures (contrats composants, implémentation Lecteur, industrialisation) doivent **préserver la cohérence** des contrats 01–06. Toute rupture d'invariant passe par un **ADR** et une mise à jour contractuelle explicite.

---

## Décisions récemment prises

| Date | Décision |
|---|---|
| 2026-07-28 | **Phase 3.5 close** — cutover production lou-build ; La Fabrique terminée |
| 2026-07-28 | **Legacy lou-build retiré** — wrappers, CLI legacy, orchestration monolithique |
| 2026-07-28 | **Phase 3 close** — Pipeline Engine v1 + stages A–K ; tag `lou-build-pipeline-v1` |
| 2026-07-28 | **F1 corrigé** — invalidation manifest en début de build sur CLI typée ; F2 reporté |
| 2026-07-28 | **Architecture v1 gelée** — docs 14–19 stables ; phases 0–2 clôturées |
| 2026-07-28 | **Phase 0A — Gouvernance fondamentale terminée** — contrats 01–06 gelés |
| 2026-07-28 | **ADR-004 — Architecture acquisition gelée** — fin R&D acquisition ; mode maintenance |
| 2026-07-28 | **R&D acquisition terminée — GO final** — 234 + 330 FIL B |
| 2026-07-28 | **FIL B = unique chaîne SSOT** · grille P1–P7 actée |

---

## Principaux risques ouverts

| Risque | Statut | Bloque |
|---|---|---|
| F2 — ordre écriture sidecars avant verdict I | **Ouvert** | Cohérence disque (chantier ciblé) |
| Renderer fallback legacy (`generated-assets/`) | **Actif** | Lecteur production |
| Scale-out 20 chapitres — curation / automatisation | **Actif** | Industrialisation aval |
| Pipeline sémantique non automatisé | **Actif** | Inventory / Blueprint Factory |
| Build SVG non reproductible byte-identique | **Actif** | CI fiable |
| SVG V1 en production (Stage G) | **Actif** | Branchement V2 (chantier distinct) |
| Formats structurés EDN non évalués | **Latent** | Nouveau pipeline (ADR-004 cas B) |
| Portabilité hors cardio / hors PDF | **Latent** | EDN Scale-out |

**Clos :** Legacy lou-build (wrappers / CLI / orchestration) · R&D acquisition · qualification chaîne · migration FIL A opérationnelle Item 234 · **Pipeline Migration Phase 3** · **Production Cutover Phase 3.5** · **La Fabrique** · F1 manifest stale.

---

## Décisions gelées

| Décision | Date | Référence |
|---|---|---|
| Production cutover lou-build | 2026-07-28 | [`releases/phase-3.5-completion-report.md`](releases/phase-3.5-completion-report.md) |
| Pipeline Engine v1 / stages A–K | 2026-07-28 | Tag `lou-build-pipeline-v1`, [`releases/phase-3.4-batch-migration-g-k.md`](releases/phase-3.4-batch-migration-g-k.md) |
| Architecture v1 (docs 14–19) | 2026-07-28 | [`contracts/00-INDEX.md`](contracts/00-INDEX.md) § 6, [`renderer/README.md`](renderer/README.md) |
| Contrats fondamentaux 01–06 | 2026-07-28 | [`contracts/00-INDEX.md`](contracts/00-INDEX.md) |
| Architecture acquisition gelée | 2026-07-28 | [ADR-004](adr/ADR-004-acquisition-architecture-frozen.md) |
| FIL B = chaîne officielle unique | 2026-07-28 | [ADR-003](adr/ADR-003-single-source-of-truth.md) |
| Tool 01 v1.0.0 | 2026-07-28 | [`SOURCE_OF_TRUTH.md`](SOURCE_OF_TRUTH.md) |
| Tool 02 v1.0.0 | 2026-07-28 | Idem |
| Grille P1–P7 | 2026-07-28 | [`SOURCE_PIPELINE_QUALIFICATION.md`](SOURCE_PIPELINE_QUALIFICATION.md) |
| R&D acquisition terminée | 2026-07-28 | [`releases/acquisition-rd-complete.md`](releases/acquisition-rd-complete.md) |

---

## Migration FIL A — reliquats

| Composant | Statut |
|---|---|
| Item 234 package | ✅ Migré FIL B |
| Tests / paths génériques | ✅ Mis à jour |
| Fichier legacy `chapter-analysis/…/official-college.md` | ⬜ Suppression après CI (hors lou-build) |
| Rapports historiques Phase 2–3 (234) | Trace — hors pipeline |

---

## Prochains travaux

1. **Le Lecteur — production** — `library.json`, lecteur multi-chapitres, retrait fallbacks renderer (specs gelées : docs 14–15, ADR-002)
2. **Scale-out industriel** — Inventory / Blueprint / Projection Factory ([`acquisition/industrialization-plan.md`](acquisition/industrialization-plan.md))
3. **Validation pédagogique** — Phase 4 ([`MASTER_ROADMAP.md`](MASTER_ROADMAP.md))
4. **Build reproductible & CI** — en parallèle si non bloquant
5. **F2** — ordre écriture sidecars G/H vs verdict I — chantier ciblé si pertinent

---

## Tableau de bord

| Indicateur | Cible | Mesuré | Notes |
|---|---|---|---|
| Chapitres packagés FIL B | 22 | **2** (234, 330) | 9 % — scale-out post-Fabrique |
| lou-build validate PASS | 22 | **2** | CLI typée unique |
| Références FIL A opérationnelles | 0 | **0** | |
| Tests lou-build | PASS | **117/117** | 78 JS + 39 TS pipeline/slice |
| Pipeline production | Cutover | **✅ Phase 3.5 close** | Stages A→K ; legacy retiré |
| Couche acquisition | Maintenance | **Gelée** | ADR-004 |

---

## Historique des jalons

| Date | Jalon |
|---|---|
| 2026-07-28 | **Phase 3.5 close** — production cutover lou-build ; La Fabrique terminée |
| 2026-07-28 | **Phase 3 close** — Pipeline Engine v1 ; tag `lou-build-pipeline-v1` |
| 2026-07-28 | **Architecture v1 gelée** — docs 14–19 ; phases 0–2 clôturées |
| 2026-07-28 | **Phase 0A — Gouvernance fondamentale terminée** — contrats 01–06 gelés |
| 2026-07-28 | **R&D acquisition terminée** — ADR-004 ; Phase 0 close |
| 2026-07-28 | GO final qualification — 234+330 FIL B |
| 2026-07-28 | Migration 234 FIL B · vertical slice 330 |
| 2026-07-28 | FIL B SSOT · Phase 0B · grille P1–P7 |
| 2026-07 | Tool 01/02 v1.0.0 · Renderer V2.3 |

---

## Documents de référence

| Document | Usage |
|---|---|
| [`contracts/00-INDEX.md`](contracts/00-INDEX.md) | **Gouvernance fondamentale** — contrats 01–06 ; § 6 architecture de référence |
| [`renderer/README.md`](renderer/README.md) | **Architecture de référence gelée** — docs 14–19 |
| [`renderer/19-BUILD-PIPELINE.md`](renderer/19-BUILD-PIPELINE.md) | Pipeline opérationnel — implémenté et en production |
| [`releases/phase-3.5-completion-report.md`](releases/phase-3.5-completion-report.md) | **Jalon Phase 3.5** — production cutover close |
| [`releases/phase-3.4-batch-migration-g-k.md`](releases/phase-3.4-batch-migration-g-k.md) | Jalon Phase 3 — Pipeline Migration close |
| [`governance/PHASE_0A_COMPLETION.md`](governance/PHASE_0A_COMPLETION.md) | Clôture officielle Phase 0A |
| [ADR-004](adr/ADR-004-acquisition-architecture-frozen.md) | Gel acquisition — **normatif** |
| [`acquisition/industrialization-plan.md`](acquisition/industrialization-plan.md) | Feuille de route scale-out |
| [`MASTER_ROADMAP.md`](MASTER_ROADMAP.md) | Phases 0–3.5 ✅ · **Le Lecteur** actif |
