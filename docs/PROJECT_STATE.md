# Lou Médecine — État du projet

**Photographie opérationnelle du projet** — **document vivant** du projet Lou Médecine.  
**Version projet :** 0.1.0  
**Dernière mise à jour :** 2026-07-28

Ce document est mis à jour **lorsqu'un jalon important est franchi** (fin de phase, décision structurante, changement de risque majeur). La roadmap ([`MASTER_ROADMAP.md`](MASTER_ROADMAP.md)) reste volontairement **stable** ; l'état opérationnel vit ici.

Pour le séquencement, les priorités et les critères de réussite stables, voir [`MASTER_ROADMAP.md`](MASTER_ROADMAP.md). Pour l'usage des modèles, voir [`LLM_STRATEGY.md`](LLM_STRATEGY.md). Pour l'implémentation, voir [`../IMPLEMENTATION_CONTRACT.md`](../IMPLEMENTATION_CONTRACT.md) et [`../FINAL_ARCHITECTURE.md`](../FINAL_ARCHITECTURE.md).

---

## Changement de statut — 2026-07-28

La **R&D Acquisition est terminée**. La couche d'acquisition (FIL B, Tool 01, Tool 02, qualification P1–P7) est **gelée** et entre en **mode maintenance** : seules les évolutions définies par [ADR-004](adr/ADR-004-acquisition-architecture-frozen.md) § 6 (bug bloquant, nouveau format source, nouvel ADR) sont autorisées. Le projet bascule en **Phase 1 — Industrialisation** : production à l'échelle des artefacts métier (Inventory, Blueprint, projections, Renderer) à partir du chapter package FIL B. Jalon historique : [`releases/acquisition-rd-complete.md`](releases/acquisition-rd-complete.md).

---

## Phase active

| | |
|---|---|
| **Phase** | **Phase 1 — Industrialisation** |
| **Chantier actif** | Scale-out packages chapitre (20/22 restants) ; Inventory / Blueprint / Projection Factory |
| **Prochain jalon** | Corpus `corpus-v1.0.0` gelé ; package archétype textuel (221) |
| **Prochaine action** | Industrialiser l'extraction Inventory sur chapitres simples FIL B |

**Acquisition :** mode maintenance (ADR-004). **Aucun** travail R&D sur Tool 01/Tool 02 sauf bug bloquant démontré.

---

## Décisions récemment prises

| Date | Décision |
|---|---|
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
| Scale-out 20 chapitres — curation / automatisation | **Actif** | Phase 1 |
| Pipeline sémantique non automatisé | **Actif** | Inventory / Blueprint Factory |
| Build SVG non reproductible byte-identique | **Actif** | CI fiable |
| Formats structurés EDN non évalués | **Latent** | Nouveau pipeline (ADR-004 cas B) |
| Portabilité hors cardio / hors PDF | **Latent** | EDN Scale-out |

**Clos :** R&D acquisition · qualification chaîne · migration FIL A opérationnelle Item 234 · hypothèse suffisance aval.

---

## Décisions gelées

| Décision | Date | Référence |
|---|---|---|
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

## Prochains travaux (Phase 1 — Industrialisation)

1. **Inventory Factory** — scale-out chapitres FIL B ; voir [`acquisition/industrialization-plan.md`](acquisition/industrialization-plan.md)
2. **Blueprint Factory** / **Projection Factory** — automatisation pipeline sémantique
3. **Renderer Production** — `library.json`, Lecteur multi-chapitres
4. **Contrats 0A** — CI, modèle d'ancre étendu, build reproductible (en parallèle)

---

## Tableau de bord

| Indicateur | Cible Phase 1 | Mesuré | Notes |
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
| 2026-07-28 | **R&D acquisition terminée** — ADR-004 ; Phase 0 close ; Phase 1 active |
| 2026-07-28 | GO final qualification — 234+330 FIL B |
| 2026-07-28 | Migration 234 FIL B · vertical slice 330 |
| 2026-07-28 | FIL B SSOT · Phase 0B · grille P1–P7 |
| 2026-07 | Tool 01/02 v1.0.0 · Renderer V2.3 |

---

## Documents de référence

| Document | Usage |
|---|---|
| [ADR-004](adr/ADR-004-acquisition-architecture-frozen.md) | Gel acquisition — **normatif** |
| [`releases/acquisition-rd-complete.md`](releases/acquisition-rd-complete.md) | Jalon sortie R&D |
| [`acquisition/industrialization-plan.md`](acquisition/industrialization-plan.md) | Phase 1 Industrialisation |
| [`acquisition/qualification-report-acquisition-final.md`](acquisition/qualification-report-acquisition-final.md) | Verdict GO |
| [`SOURCE_OF_TRUTH.md`](SOURCE_OF_TRUTH.md) | Chaîne FIL B |
| [`MASTER_ROADMAP.md`](MASTER_ROADMAP.md) | Phases 0 ✅ / 1 active |
