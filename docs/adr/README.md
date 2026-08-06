# Lou Médecine — Architecture Decision Records

**Type :** index documentaire — **informatif**  
**Dernière mise à jour :** 2026-08-06

Ce document recense les ADR du projet. Il ne remplace aucun ADR et n'énonce aucune règle métier.

Pour la hiérarchie d'autorité, voir [`docs/contracts/00-INDEX.md`](../contracts/00-INDEX.md) §2 :

```
ADR → contrats fondamentaux 01–09 → contrats composants → documentation technique → code
```

Les ADR évoluent lentement et capturent les **décisions architecturales fondatrices** du projet. Ils ne constituent ni un journal des évolutions fonctionnelles, ni une roadmap, ni une documentation d'implémentation.

---

## Registre des ADR

| # | Titre | Statut | Date | Rôle |
|---|---|---|---|---|
| [001](ADR-001-freeze-svg-grammar-catalogue.md) | Freeze SVG Grammar Catalogue | **Accepted** | 2026-07-26 | Gel du catalogue sémantique des primitives visuelles (Cardiologie) |
| [002](ADR-002-renderer-v2-architecture.md) | Renderer V2 Architecture | **Accepted** (§4 partiellement superseded) | 2026-07-26 | Évolution documentaire et invariants Renderer ; baseline produit = docs 14–15 |
| [003](ADR-003-single-source-of-truth.md) | Single Source of Truth — sources officielles | **Accepted** | 2026-07-28 | FIL B = unique chaîne d'acquisition ; principe SSOT en entrée |
| [004](ADR-004-acquisition-architecture-frozen.md) | Acquisition Architecture Frozen | **Accepted** | 2026-07-28 | Gel Tool 01/02 ; mode maintenance acquisition |
| [005](ADR-005-learner-layer-annotation-anchoring.md) | Learner-layer annotation anchoring | **Accepted** | 2026-07-28 | CaretAnchor pour notes walkthrough ; supersede ADR-002 §4 |
| [006](ADR-006-pedagogical-patrimony-and-edition-lineage.md) | Patrimoine pédagogique et lignée éditoriale | **Accepted** | 2026-07-30 | Patrimoine sources / packages publiés / données d'apprentissage ; lignée éditoriale |
| [007](ADR-007-visual-centrality-for-mental-models-and-notions.md) | Centralité visuelle des Modèles mentaux et des Notions | **Accepted** | 2026-08-05 | Visuel obligatoire et central ; walkthrough canonique médical ; accès dégradé distinct de la complétude |
| [008](ADR-008-vcck-industrial-composition-pipeline.md) | Pipeline industriel de composition visuelle (VCCK) | **Accepted** | 2026-08-06 | Capacités, reconnaissance, composition abstraite ; pipeline éditorial → artefact |

---

## Supersessions et relations

| ADR | Relation |
|---|---|
| **002 §4** | **Superseded** par **005** pour l'ancrage des notes walkthrough (claim-block → CaretAnchor) |
| **002** (reste) | **En vigueur** — immutabilité contenu officiel, mécanismes apprenant distincts, anti-rewrite |
| **003** | **006 étend le périmètre de 003** — SSOT des *sources* vs patrimoine des *artefacts publiés* |
| **004** | **006 complète architecturalement 004** — acquisition en entrée vs identité des packages publiés consommés ; Release = Chapter Package publié ([contrat 04](../contracts/04-CHAPTER-PACKAGE.md) §1.2) |
| **005** | **006 étend 005** — ancrage caret + obligation de lier les données d'apprentissage à une *version* de package |
| **006** | **Complète 003–005** — triple ancrage apprenant détaillé : [contrat 02](../contracts/02-IDENTITY-AND-ANCHORS.md) §11.1 |
| **001** | **Indépendant** — grammaire visuelle ; cohérent avec 006 (visuels dans packages patrimoniaux) |
| **007** | **Supersède** pour les MM et Notions le régime « visuel optionnel / bloc complet sans visuel » issu de l'amendement du 2026-07-25 ; conserve grounding, traçabilité et états techniques de dégradation |
| **008** | **Complète 001 et 007** — couche composition (capacités, reconnaissance) en aval du catalogue de primitives ; opérationnalise l'obligation de centralité visuelle ; complète **006** (I16 traçabilité de production) ; renforce **002** (surfaces non décisionnelles) |

---

## Quand créer un nouvel ADR

Un ADR est approprié lorsqu'une décision :

- fige un **principe architectural fondamental** ou un **invariant durable** ;
- **supersede** une décision antérieure ;
- s'applique **transversalement** (Fabrique + Reader + persistance) ;
- ne relève pas d'un seul contrat composant ou d'une spec fonctionnelle détaillée ;
- introduit un **invariant architectural durable** qui ne peut raisonnablement pas être porté par un contrat, un contrat composant ou une spécification technique.

Les arbitrages produit détaillés (audit Q1–Q24′) sont consignés dans le registre informatif [`PRODUCT-DECISION-REGISTRY.md`](../governance/PRODUCT-DECISION-REGISTRY.md), pas dans les ADR.

---

## Documents connexes

| Document | Rôle |
|---|---|
| [`docs/contracts/00-INDEX.md`](../contracts/00-INDEX.md) | Hiérarchie documentaire |
| [`docs/governance/PRODUCT-DECISION-REGISTRY.md`](../governance/PRODUCT-DECISION-REGISTRY.md) | Mémoire des arbitrages audit (informatif) |
| [`docs/governance/COMPOSITION-DECISION-REGISTRY.md`](../governance/COMPOSITION-DECISION-REGISTRY.md) | Décisions couche de composition (informatif) |
| [`docs/governance/DOCUMENT_ARCHITECTURE.md`](../governance/DOCUMENT_ARCHITECTURE.md) | Organisation du pilotage documentaire |
| [`docs/MASTER_ROADMAP.md`](../MASTER_ROADMAP.md) | Intention — objectifs, séquencement, critères de sortie |
| [`docs/PROJECT_STATE.md`](../PROJECT_STATE.md) | Observation — état courant du projet |
