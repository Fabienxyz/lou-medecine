# Lou Médecine — État du projet

**Photographie opérationnelle** — document vivant.

**Version projet :** 0.1.0  
**Dernière mise à jour :** 2026-07-31 (réconciliation architecture éditoriale ; contrats 07–09)

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
| **Objectif actif** | [Capitalisation d'un package de référence complet](MASTER_ROADMAP.md#capitalisation-dun-package-de-référence-complet) |
| **Livrable visé** | Package de capitalisation de référence — première instance [PDR-B2](governance/PRODUCT-DECISION-REGISTRY.md) |
| **Chemin critique** | Convergence vers la **publication du package complet** — goulet principal avant acceptation Reader, validation Lou et industrialisation |
| **Blocage structurant** | Package **incomplet** (tranche verticale historique) — bloque l'**acceptation** Reader V1, pas le développement Reader en parallèle |
| **Blocage amont potentiel** | Écart édition source : dépôt en **2022**, cible golden master **édition Collège 2023** ([PDR-B2](governance/PRODUCT-DECISION-REGISTRY.md)) — qualification/import à trancher |
| **Dernier jalon produit** | Cutover pipeline validateur lou-build — [`releases/phase-3.5-completion-report.md`](releases/phase-3.5-completion-report.md) (2026-07-28) |

**Constats factuels (acquis pipeline, non confondus avec la Fabrique productrice) :**

- Pipeline validateur lou-build en production — CLI unique `src/cli/build.ts` ; stages A–K ; tag `lou-build-pipeline-v1`.
- Acquisition en mode maintenance ([ADR-004](adr/ADR-004-acquisition-architecture-frozen.md)).
- La **Fabrique productrice autonome** n'est **pas** opérationnelle — objectif forward ([PDR-C1](governance/PRODUCT-DECISION-REGISTRY.md)).

---

## Chantiers en cours

| Chantier | Objectif de rattachement | Focus actuel |
|---|---|---|
| **Capitalisation Item 234** | Package de référence complet | Complétion du Chapter Package (inventaire, blueprint, projections, QCM/cas, gates, réconciliation) — remplacement de la tranche POC ([PDR-B3](governance/PRODUCT-DECISION-REGISTRY.md)) |
| **Reader V1 — développement** | Acceptation Reader V1 | Prototype `demo/renderer/` — architecture 7 vues, retrait fallbacks legacy ; **acceptation bloquée** tant que le package complet n'est pas publié ([PDR-B1](governance/PRODUCT-DECISION-REGISTRY.md)) |
| **Patrimoine & publication** | Patrimoine V1 ([ADR-006](adr/ADR-006-pedagogical-patrimony-and-edition-lineage.md)) | Modèle de publication, version package, persistance — en retard sur la spec ; co-vérification prévue à l'acceptation Reader |
| **CI & maintenabilité** | Maintenabilité et CI ([PDR-G6](governance/PRODUCT-DECISION-REGISTRY.md)) | Préparation fixture sur tranche puis package complet ; CI non opérationnelle comme exigence de sortie |

---

## Livrables de référence — instances

| Rôle (roadmap) | Instance courante | État observé |
|---|---|---|
| **Package de capitalisation de référence** | Item **234** — Insuffisance cardiaque — édition Collège **2023** ([PDR-B2](governance/PRODUCT-DECISION-REGISTRY.md)) | **Partiel** — tranche verticale migrée FIL B ; package **non complet** ; gates non clos sur un package complet |
| **Fixture de non-régression** | — | **Non établie** — en attente du package complet publié |

---

## Blocages et risques ouverts

| Blocage / risque | Impact | Objectif ou chantier concerné |
|---|---|---|
| Package 234 incomplet (tranche POC) | Bloque **acceptation** Reader V1, validation Lou, fixture CI | Capitalisation · Acceptation Reader V1 |
| Écart édition 2022 (dépôt) / 2023 (cible) | Peut bloquer **démarrage** capitalisation sur le bon référentiel | Capitalisation |
| Fallback renderer legacy (`generated-assets/`) | Retarde conformité Reader V1 | Reader V1 — développement |
| Pipeline sémantique non automatisé | Bloque industrialisation aval (pas le golden master capitalisé manuellement) | Industrialisation Fabrique productrice |
| Build SVG non reproductible byte-identique | Bloque CI fiable | Maintenabilité et CI |
| Patrimoine non implémenté (version package, export/restauration) | Bloque critères V1 patrimoine + acceptation Reader | Patrimoine · Acceptation Reader V1 |
| F2 — ordre écriture sidecars G/H vs verdict I | Cohérence disque lou-build | Dette pipeline |
| Scale-out prématuré (tentation multi-chapitres partiels) | Dispersion — contredit [PDR-C2](governance/PRODUCT-DECISION-REGISTRY.md) | — (risque de pilotage) |
| Formats structurés EDN non évalués | Latent — nouveau pipeline si requis ([ADR-004](adr/ADR-004-acquisition-architecture-frozen.md) §6) | Couverture EDN |
| Portabilité hors cardio / hors PDF | Latent | Couverture EDN |

**Risques clos récemment :** legacy lou-build (wrappers, CLI, orchestration) · migration FIL A opérationnelle Item 234 · F1 manifest stale · R&D acquisition.

---

## Dette ouverte

| Dette | État | Référence |
|---|---|---|
| Reliquat FIL A — `chapter-analysis/…/official-college.md` | À supprimer après CI | Migration FIL A |
| Composition Engine (7 vues) — implémentation absente | Ouverte | [`governance/COMPOSITION-IMPLEMENTATION-DEBT.md`](governance/COMPOSITION-IMPLEMENTATION-DEBT.md) |
| SVG V1 en production (Stage G) vs moteur grammaire cible | Ouverte | [PDR-F4](governance/PRODUCT-DECISION-REGISTRY.md) |
| F2 sidecars G/H | Ouverte | Risques ci-dessus |

---

## Indicateurs

Valeurs courantes — définitions dans [`MASTER_ROADMAP.md` § Indicateurs structurels](MASTER_ROADMAP.md#indicateurs-structurels).

| Indicateur | Mesuré | Notes |
|---|---|---|
| **Package de référence complet** | **Non** — tranche partielle | Métrique pivot — remplace « chapitres packagés » comme progrès vers l'objectif |
| **Reader V1 — critères d'acceptation** | **Partiel** — prototype slice (~3 vues utiles sur tranche) | Acceptation bloquée par package complet |
| **Effort humain / chapitre publié** | Non mesuré systématiquement | — |
| **Complétude source (234)** | Partielle — tranche seulement | Package complet non évalué |
| **Grounding déterministe** | Non consolidé au niveau projet | — |
| **Reproductibilité du build en CI** | **Non** — CI non opérationnelle comme exigence | Voir risque SVG / CI |
| **Décisions humaines / chapitre** | Non suivi en production | — |
| lou-build validate PASS (packages FIL B) | **2** / 22 (234 tranche, 330) | Dont **0** package complet conforme jalon Reader |
| Tests lou-build | **117/117** PASS | 78 JS + 39 TS |
| Références FIL A opérationnelles | **0** | |

---

## Prochaines étapes

Ordre hérité de [`MASTER_ROADMAP.md` § Dépendances](MASTER_ROADMAP.md#dépendances) — **pas une repriorisation locale**.

1. Trancher l'alignement **édition Collège 2023** pour Item 234 si requis ([PDR-B2](governance/PRODUCT-DECISION-REGISTRY.md)).
2. **Capitalisation** du package de référence complet (Item 234).
3. **Reader V1** — poursuite développement architecture (parallèle ; acceptation bloquée).
4. **Patrimoine & publication** — avancement implémentation V1 (parallèle).
5. **CI** — préparation fixture et non-régression (parallèle).
6. **Acceptation Reader V1** — lorsque le package complet est publié.
7. **Validation pédagogique Lou** — package + Reader accepté.
8. Premier **diff éditorial**, puis **industrialisation** — voir roadmap.

---

## Historique récent

Fenêtre utile à la lecture immédiate. Détail antérieur → [`docs/releases/`](releases/) et historique Git.

| Date | Événement |
|---|---|
| 2026-07-31 | **Réconciliation architecture éditoriale** — Release = Chapter Package ; Questions/Scénarios dans Release ; vocabulaire absences (contrat 08 §5) ; triple ancrage apprenant ; ADR-006 / doc 17 alignés sur archivage et bascule atomique |
| 2026-07-31 | **Contrat 09** — spécification normative Scénario clinique |
| 2026-07-31 | **Contrat 08** — architecture éditoriale Release (coexistence, complétude, absences) |
| 2026-07-31 | **Contrat 07** — spécification normative Question d'évaluation (QCM) |
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
| Détail Reader | [`renderer/10-MIGRATION_PLAN.md`](renderer/10-MIGRATION_PLAN.md) |
| Détail industrialisation (ultérieur) | [`acquisition/industrialization-plan.md`](acquisition/industrialization-plan.md) |

---

*Révision 2026-07-30 — migration Phase A.8 ; alignement [`DOCUMENT_ARCHITECTURE.md`](governance/DOCUMENT_ARCHITECTURE.md) et [`MASTER_ROADMAP.md`](MASTER_ROADMAP.md).*
