# Jalon — R&D Acquisition terminée

**Date :** 2026-07-28  
**Statut :** jalon historique — référence normative de sortie de R&D  
**Décision :** [ADR-004 — Acquisition Architecture Frozen](../adr/ADR-004-acquisition-architecture-frozen.md)

---

## Contexte

Lou Médecine transforme les Collèges officiels EDN en supports d'étude traçables. Avant toute production à grande échelle, le projet devait répondre à une question structurante :

> **Comment acquérir le Collège de façon déterministe, reproductible et suffisante pour les artefacts métier aval ?**

Cette question relève de la **couche d'acquisition** — distincte du pipeline pédagogique (Inventory, Blueprint, projections, Renderer). La phase R&D correspondant à cette couche est **officiellement close** à la date du jalon.

---

## Portée du jalon

Ce jalon marque la **sortie de R&D** et l'**entrée en industrialisation** pour tout ce qui concerne :

- la gouvernance d'acquisition ;
- la chaîne FIL B (Single Source of Truth) ;
- Tool 01 et Tool 02 ;
- la qualification pipeline (grille P1–P7) ;
- le gel architectural (ADR-004).

**Hors portée.** Ce jalon ne clôt pas l'industrialisation des artefacts métier, la validation pédagogique, ni l'échelle multi-collèges — voir [`MASTER_ROADMAP.md`](../MASTER_ROADMAP.md) Phase 1.

---

## Composants désormais stables

Les composants suivants constituent le **socle officiel gelé** — fondation de tous les développements futurs :

| Composant | Version / référence |
|---|---|
| FIL B (chaîne SSOT) | [ADR-003](../adr/ADR-003-single-source-of-truth.md) |
| Tool 01 | `lou-pdf-to-canonical` v1.0.0 |
| Tool 02 | `lou-chapter-splitter` v1.0.0 |
| Markdown source | `official-college.md` |
| Chapter packaging | Structure normative package chapitre |
| Manifests | Tool 01, Tool 02, packages |
| Modèle `section_path` | Index sections dans `source.meta.yaml` |
| Modèle d'ancres | `{ edition, section_path, quote }` |
| Grille qualification | P1–P7 |

Toute modification de ces composants est soumise à la **Modification Policy** d'ADR-004 § 6.

---

## Principaux livrables validés

| Livrable | Preuve |
|---|---|
| Gouvernance acquisition | [`SOURCE_PIPELINE_QUALIFICATION.md`](../SOURCE_PIPELINE_QUALIFICATION.md), [`SOURCE_OF_TRUTH.md`](../SOURCE_OF_TRUTH.md) |
| Qualification Tool 01 | [`qualification-report-tool01-p1.md`](../acquisition/qualification-report-tool01-p1.md) |
| Qualification dérivation (Phase 0B) | [`qualification-report-phase-0b.md`](../acquisition/qualification-report-phase-0b.md) |
| Verdict GO final | [`qualification-report-acquisition-final.md`](../acquisition/qualification-report-acquisition-final.md) |
| Migration Item 234 FIL B | [`migration-report-234-fil-b.md`](../acquisition/migration-report-234-fil-b.md) |
| Vertical slice Item 330 | [`integration-notes-330.md`](../../01-learning/chapters/cardio/330/build/integration-notes-330.md) |
| Gel architectural | [ADR-004](../adr/ADR-004-acquisition-architecture-frozen.md) |

---

## Critères de sortie atteints

| Critère | État |
|---|---|
| FIL B = SSOT opérationnel | ✅ |
| Tool 01 qualifié *fit for purpose* | ✅ |
| Tool 02 qualifié (22 chapitres, manifests) | ✅ |
| Grille P1–P7 validée | ✅ |
| Item 234 entièrement migré FIL B | ✅ |
| Item 330 validé (archétype tableaux/posologies) | ✅ |
| Pipeline aval indépendant du PDF | ✅ |
| `lou-build validate` PASS sur 234 et 330 | ✅ |
| Tests lou-build 96/96 PASS | ✅ |

---

## Conséquences pour les développements futurs

1. **Mode maintenance.** La couche acquisition entre en maintenance — corrections de bugs (ADR-004 cas A) ou nouveaux formats source (cas B) uniquement.

2. **Interdictions.** Aucun chantier ne rouvre la R&D acquisition : pas d'optimisation esthétique PDF, pas de retouche manuelle du Markdown, pas de seconde chaîne parallèle.

3. **Phase active (historique).** Le projet entrait alors en industrialisation lou-build. *Séquencement courant :* Phase 3 Pipeline Migration **terminée** (`lou-build-pipeline-v1`) ; **Phase 3.5** active — voir [`PROJECT_STATE.md`](../PROJECT_STATE.md).

4. **Référence normative.** ADR-004 est la décision de gouvernance de référence pour toute question relative à la couche acquisition.

5. **Feuille de route.** Scale-out détaillé : [`industrialization-plan.md`](../acquisition/industrialization-plan.md).

---

## Documents connexes

| Document | Rôle |
|---|---|
| [ADR-004](../adr/ADR-004-acquisition-architecture-frozen.md) | Décision normative de gel |
| [`PROJECT_STATE.md`](../PROJECT_STATE.md) | État opérationnel courant |
| [`MASTER_ROADMAP.md`](../MASTER_ROADMAP.md) | Phases 0 (terminée) et 1 (active) |
