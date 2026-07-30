# Lou Learning Companion

An AI-assisted learning companion designed to help Lou prepare for the EDN.

The project automates the transformation of the official medical colleges into personalized learning materials while preserving complete fidelity to the original content.

The goal is simple:

> Spend less time preparing to study.
>
> Spend more time understanding, memorizing and mastering medicine.

---

## Repository Philosophy

The project is built around four ideas:

- The official college is the only source of medical knowledge.
- Medical knowledge is never modified.
- AI may generate pedagogical aids, but they remain clearly separated from the official content.
- The platform adapts to Lou's learning style rather than imposing a single methodology.

---

## Repository Structure

00-foundation/
Immutable project principles.

01-learning/
Learning methodology and user journey.

02-product/
Product definition and functional specifications.

03-architecture/
Technical architecture.

04-decisions/
Important decisions.

05-research/
Research, observations and experiments.

---

## Current Status

**Objectif actif :** capitalisation d'un **package de référence complet** (Item 234 — Insuffisance cardiaque — édition Collège 2023).

**Pipeline validateur lou-build :** acquis — tag historique [`lou-build-pipeline-v1`](docs/releases/phase-3.4-batch-migration-g-k.md) ; cutover : [`phase-3.5-completion-report.md`](docs/releases/phase-3.5-completion-report.md).

**Chantiers en cours :** capitalisation Item 234, développement Reader V1 (acceptation conditionnée par le package complet), patrimoine pédagogique, CI.

État opérationnel : [`docs/PROJECT_STATE.md`](docs/PROJECT_STATE.md) · intention et séquencement : [`docs/MASTER_ROADMAP.md`](docs/MASTER_ROADMAP.md) · organisation du pilotage : [`docs/governance/DOCUMENT_ARCHITECTURE.md`](docs/governance/DOCUMENT_ARCHITECTURE.md).

---

## Project Documentation

Read in this order:

1. **[Contrats fondamentaux](docs/contracts/00-INDEX.md)** — gouvernance normative (01–06), ADR et index de l'architecture de référence
2. **[ADR](docs/adr/README.md)** — décisions architecturales fondatrices
3. **[Organisation du pilotage](docs/governance/DOCUMENT_ARCHITECTURE.md)** — doctrine documentaire roadmap / état
4. **[Master Roadmap](docs/MASTER_ROADMAP.md)** — intention : objectifs, séquencement, critères de sortie
5. **[Project State](docs/PROJECT_STATE.md)** — observation : état courant et métriques (document vivant)
6. **[Product Decision Registry](docs/governance/PRODUCT-DECISION-REGISTRY.md)** — mémoire des arbitrages produit
7. **Architecture de référence (gelée v1)** — [`docs/renderer/README.md`](docs/renderer/README.md) · docs [14](docs/renderer/14-LOU-READER-ARCHITECTURE.md)–[19](docs/renderer/19-BUILD-PIPELINE.md)
8. **Implémentation (lou-build)** — [`tools/lou-build/`](tools/lou-build/) · [`IMPLEMENTATION_CONTRACT.md`](IMPLEMENTATION_CONTRACT.md)

Entry point for new contributors: [START_HERE.md](START_HERE.md).
