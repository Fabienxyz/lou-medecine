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

**Architecture v1 gelée** (2026-07-28). Phases Fondations, Le Lecteur et La Fabrique — Architecture sont **terminées**.

**Phase active :** implémentation de **lou-build** — production industrielle des artefacts métier (Inventory, Blueprint, projections, packages chapitre) conformément au pipeline défini dans [`docs/renderer/19-BUILD-PIPELINE.md`](docs/renderer/19-BUILD-PIPELINE.md).

État opérationnel : [`docs/PROJECT_STATE.md`](docs/PROJECT_STATE.md) · pilotage : [`docs/MASTER_ROADMAP.md`](docs/MASTER_ROADMAP.md).

---

## Project Documentation

Read in this order:

1. **[Contrats fondamentaux](docs/contracts/00-INDEX.md)** — gouvernance normative (01–06) et index de l'architecture de référence
2. **Architecture de référence (gelée v1)** — [`docs/renderer/README.md`](docs/renderer/README.md) · docs [14](docs/renderer/14-LOU-READER-ARCHITECTURE.md)–[19](docs/renderer/19-BUILD-PIPELINE.md)
3. **[Master Roadmap](docs/MASTER_ROADMAP.md)** — séquencement produit et phases
4. **[Project State](docs/PROJECT_STATE.md)** — état courant et métriques (document vivant)
5. **Implémentation (lou-build)** — [`tools/lou-build/`](tools/lou-build/) · [`IMPLEMENTATION_CONTRACT.md`](IMPLEMENTATION_CONTRACT.md)

Entry point for new contributors: [START_HERE.md](START_HERE.md).
