# Lou Médecine — État du projet

**Photographie opérationnelle du projet** — **document vivant** du projet Lou Médecine.  
**Version projet :** 0.1.0  
**Dernière mise à jour :** 2026-07-28 (gel architecture v1)

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

**Architecture v1 gelée.** Les phases Fondations (0), Le Lecteur (1) et La Fabrique — Architecture (2) sont **clôturées**. Le projet entre en **Phase 3 — Implémentation de lou-build**. Index : [`contracts/00-INDEX.md`](contracts/00-INDEX.md) § 6 · pilotage : [`MASTER_ROADMAP.md`](MASTER_ROADMAP.md) § 5.

**Phase 0A — Gouvernance fondamentale terminée.** Les six contrats fondamentaux (`docs/contracts/01–06`) sont rédigés, audités transversalement et **gelés** (maintenance documentaire uniquement). Rapport de clôture : [`governance/PHASE_0A_COMPLETION.md`](governance/PHASE_0A_COMPLETION.md).

La **R&D Acquisition est terminée**. La couche d'acquisition (FIL B, Tool 01, Tool 02, qualification P1–P7) est **gelée** et entre en **mode maintenance** : seules les évolutions définies par [ADR-004](adr/ADR-004-acquisition-architecture-frozen.md) § 6 (bug bloquant, nouveau format source, nouvel ADR) sont autorisées. Jalon historique : [`releases/acquisition-rd-complete.md`](releases/acquisition-rd-complete.md).

---

## Phase active

| | |
|---|---|
| **Phase** | **Phase 3 — Implémentation de lou-build** |
| **Chantier actif** | Inventory / Blueprint / Projection Factory ; scale-out packages chapitre (20/22 restants) |
| **Prochain jalon** | Corpus `corpus-v1.0.0` gelé ; package archétype textuel (221) |
| **Prochaine action** | Industrialiser l'extraction Inventory sur chapitres simples FIL B conformément au [doc 19](renderer/19-BUILD-PIPELINE.md) |

**Acquisition :** mode maintenance (ADR-004). **Architecture v1 :** gelée — docs 14–19 stables. **Aucun** travail R&D sur Tool 01/Tool 02 sauf bug bloquant démontré.

---

## État de la gouvernance

| | |
|---|---|
| **Phase 0A** | ✅ **Terminée** — 2026-07-28 |
| **Architecture v1 (docs 14–19)** | ✅ **Gelée** — 2026-07-28 |
| **Contrats fondamentaux** | **01–06 gelés** — référence normative de gouvernance ([`contracts/00-INDEX.md`](contracts/00-INDEX.md)) |
| **Audit transversal** | ✅ Terminé — corrections de cohérence appliquées |
| **Maintenance autorisée** | Amendements documentaires explicites ; pas de modification d'invariants sans ADR |

**Prochaines étapes gouvernance :** les évolutions futures (contrats composants, implémentation, industrialisation) doivent **préserver la cohérence** des contrats 01–06. Toute rupture d'invariant passe par un **ADR** et une mise à jour contractuelle explicite.

---

## Décisions récemment prises

| Date | Décision |
|---|---|
| 2026-07-28 | **Architecture v1 gelée** — docs 14–19 stables ; phases 0–2 clôturées ; Phase 3 lou-build active |
| 2026-07-28 | **Phase 0A — Gouvernance fondamentale terminée** — contrats 01–06 gelés |
| 2026-07-28 | **ADR-004 — Architecture acquisition gelée** — fin R&D acquisition ; mode maintenance |
| 2026-07-28 | **Phase 0 terminée** — fondations validées ; Phase 1 Industrialisation active |
| 2026-07-28 | **R&D acquisition terminée — GO final** — 234 + 330 FIL B |
| 2026-07-28 | **Item 234 migré FIL B** — vertical slice officiel |
| 2026-07-28 | **Item 330 vertical slice FIL B** — 54 KPs, validate/build PASS |
| 2026-07-28 | **FIL B = unique chaîne SSOT** · grille P1–P7 actée |

---

## Principaux risques ouverts

| Risque | Statut | Bloque |
|---|---|---|
| Scale-out 20 chapitres — curation / automatisation | **Actif** | Phase 3 |
| Pipeline sémantique non automatisé | **Actif** | Inventory / Blueprint Factory |
| Build SVG non reproductible byte-identique | **Actif** | CI fiable |
| Formats structurés EDN non évalués | **Latent** | Nouveau pipeline (ADR-004 cas B) |
| Portabilité hors cardio / hors PDF | **Latent** | EDN Scale-out |

**Clos :** R&D acquisition · qualification chaîne · migration FIL A opérationnelle Item 234 · hypothèse suffisance aval · **gouvernance fondamentale Phase 0A** · **audit de cohérence inter-contrats**.

---

## Décisions gelées

| Décision | Date | Référence |
|---|---|---|
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
| Fichier legacy `chapter-analysis/…/official-college.md` | ⬜ Suppression après CI |
| Rapports historiques Phase 2–3 (234) | Trace — hors pipeline |

---

## Prochains travaux (Phase 3 — Implémentation lou-build)

1. **Inventory Factory** — scale-out chapitres FIL B ; voir [`acquisition/industrialization-plan.md`](acquisition/industrialization-plan.md) et [`renderer/19-BUILD-PIPELINE.md`](renderer/19-BUILD-PIPELINE.md)
2. **Blueprint Factory** / **Projection Factory** — automatisation pipeline sémantique
3. **Renderer Production** — `library.json`, Lecteur multi-chapitres (specs gelées : docs 14–15)
4. **Build reproductible & CI** — alignement implémentation sur les invariants gelés (en parallèle)

---

## Tableau de bord

| Indicateur | Cible Phase 3 | Mesuré | Notes |
|---|---|---|---|
| Chapitres packagés FIL B | 22 | **2** (234, 330) | 9 % |
| lou-build validate PASS | 22 | **2** | |
| Références FIL A opérationnelles | 0 | **0** | |
| Tests lou-build | PASS | **96/96** | |
| Couche acquisition | Maintenance | **Gelée** | ADR-004 |

---

## Historique des jalons

| Date | Jalon |
|---|---|
| 2026-07-28 | **Architecture v1 gelée** — docs 14–19 ; phases 0–2 clôturées ; Phase 3 lou-build active |
| 2026-07-28 | **Phase 0A — Gouvernance fondamentale terminée** — contrats 01–06 gelés |
| 2026-07-28 | **R&D acquisition terminée** — ADR-004 ; Phase 0 close ; Phase 1 active |
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
| [`renderer/19-BUILD-PIPELINE.md`](renderer/19-BUILD-PIPELINE.md) | Pipeline opérationnel cible de l'implémentation lou-build |
| [`governance/PHASE_0A_COMPLETION.md`](governance/PHASE_0A_COMPLETION.md) | Clôture officielle Phase 0A |
| [ADR-004](adr/ADR-004-acquisition-architecture-frozen.md) | Gel acquisition — **normatif** |
| [`releases/acquisition-rd-complete.md`](releases/acquisition-rd-complete.md) | Jalon sortie R&D |
| [`acquisition/industrialization-plan.md`](acquisition/industrialization-plan.md) | Feuille de route implémentation lou-build |
| [`acquisition/qualification-report-acquisition-final.md`](acquisition/qualification-report-acquisition-final.md) | Verdict GO |
| [`SOURCE_OF_TRUTH.md`](SOURCE_OF_TRUTH.md) | Chaîne FIL B |
| [`MASTER_ROADMAP.md`](MASTER_ROADMAP.md) | Phases 0–2 ✅ / Phase 3 active |
