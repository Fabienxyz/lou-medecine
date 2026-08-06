# Lou Médecine — État du projet

**Photographie opérationnelle** — document vivant.

**Version projet :** 0.1.0  
**Dernière mise à jour :** 2026-08-06 (architecture VCCK stabilisée — ADR-008 + contrat 05 ; **E2** chantier actif)

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
| **Objectif actif** | **Phase 1A** — validation du contrat éditorial cible sur le chapitre 234 ([plan](plans/editorial-prototyping-and-migration-plan.md)) |
| **Phase opérationnelle active** | **Phase 1A** — prototypage produit hors Reader — MM · Notions · Cas **conjoints** |
| **Micro-chantier industriel V0** | **E2 active** — production industrielle des visualSpecs 234 : rédaction des 29 restantes + audit des 30 ([roadmap](../editorial-industrialization/v0/chapters/234/execution-roadmap.yaml)) ; **E1 clôturée** ; **architecture VCCK terminée** |
| **Livrable visé** | Prototypes Word mobile-first consultables par Lou (MM, Notions pilotes, Cas pilotes) |
| **Chemin critique** | **Phase 1A → 1B → … → Product Freeze 234** → Phase 9 (224) → capitalisation → Corpus V1 |
| **Blocage structurant** | Reference Production Chapter 224 **non démarré** — Phase 9, après Product Freeze |
| **Blocage migration technique** | **Phase 2 intégration/migration bloquée** — gate Phase 0 migration ([`analysis/phase-0-baseline-gate-2026-08-04.md`](analysis/phase-0-baseline-gate-2026-08-04.md)) |
| **Dernier jalon architectural** | **ADR-008 publié** — architecture industrielle VCCK stabilisée ; contrat 05 = référence canonique visualSpec ; 2026-08-06 |
| **Dernier jalon qualification VCCK** | **E1 / CMM-0.3** — famille `chapter-master-map` **qualifiée V1** (CMM-R3) ; audit `PASS_WITH_MINOR_RECOMMENDATIONS` ; 2026-08-06 |
| **Dernier jalon produit Reader** | **SVG Highlight Bridge V1** — highlights SVG opérationnels sur RPC 234 ; tag `svg-highlight-bridge-v1` ; 2026-08-03 |
| **Baseline migration Phase 0** | Commit `5734832…` — tag `baseline-phase-0-2026-08-04` ; Phase 1A/1B autorisées ; Phase 2 migration **bloquée** |

**SVG Highlight Bridge V1 clôturé (2026-08-03).** Les **highlights sur texte SVG** sont disponibles sur le chapitre de référence **234** (création, changement de couleur, effacement, restauration) via le moteur **Highlight V2** unique et le backend **LouInlineFormatting**. L'UI annotation est **stabilisée** : toolbar unique — couleurs + gomme sur SVG ; G/S/B masqués en contexte SVG ; walkthrough HTML inchangé.

**UI Reader V1 — Annotation UI Freeze V1 (2026-08-03).** La couche annotation Learner HTML reste **gelée** hors bug bloquant. **Chantier macro actif : Phase 1A** — prototypage éditorial hors Reader ([plan](plans/editorial-prototyping-and-migration-plan.md)).

**Architecture VCCK stabilisée (2026-08-06).** [ADR-008](adr/ADR-008-vcck-industrial-composition-pipeline.md) **Accepted** — pipeline industriel : contrat éditorial → visualSpec → signature → reconnaissance → capacité → composition abstraite → surface → artefact. [Contrat 05](contracts/05-VISUAL-GRAMMAR.md) refondu — **visualSpec = autorité sémantique** ; **ADR-008 = autorité de composition**. Quatre couches gelées : Primitives ([ADR-001](adr/ADR-001-freeze-svg-grammar-catalogue.md)) · visualSpec (contrat 05) · Composition VCCK (ADR-008) · Chapter Package / Reader (contrats 04 et 06). **Chantier d'architecture VCCK clôturé** — le principal risque architectural (couche composition sous-spécifiée) est **levé**. Le projet bascule de **l'architecture en construction** vers **l'industrialisation éditoriale**.

**Industrialisation éditoriale V0 — E2 active (2026-08-06).** Famille `chapter-master-map` qualifiée (E1 / CMM-R3) — rapport : [`cmm-qualification-report.md`](../tools/lou-build/vcck/reports/cmm-qualification-report.md). **Chantier actif : E2** — Codex — 29 visualSpecs restantes + audit des 30, signature par spec. **Prochain jalon implémentation VCCK : pré-W2** (audit couche `surface` + standardisation interfaces de preuve) avant qualification **W2**. Stratégie d'extension : [`D-VCCK-STACK-EXTENSION-STRATEGY.md`](../tools/lou-build/vcck/decisions/D-VCCK-STACK-EXTENSION-STRATEGY.md). Aucune génération MM-1 réel 234 tant que la séquence E2–E5 ne l'autorise pas.

**Chaîne de consommation Fabrique → Reader (Phase 0.1 clôturée).** Acquis technique stabilisé. **Prochaine intégration Reader** conditionnée par validation du contrat éditorial Phase 1A.

**Gate prototypage éditorial et migration — Phase 0 clôturée avec réserves (2026-08-04).** Tag `baseline-phase-0-2026-08-04`. **Phase 1A autorisée** · **Phase 1B conception autorisée** · **Phase 2 migration bloquée** ([gate](analysis/phase-0-baseline-gate-2026-08-04.md)). **RPC Phase 2 Amorçage** et **Phases 3–4 linéaires** : **suspendues** — remplacées par conception conjointe Phase 1A.

**Décisions d'architecture en vigueur :**

- **`release_id` stable** pendant toute la construction éditoriale d'un chapitre — pas d'incrément automatique de `publication_version` à chaque build intermédiaire.
- **`content_digest` = vérité matérielle** du contenu publié.
- **Auto-réparation Reader** — au bootstrap produit, le Reader détecte toute divergence de digest ou de runtime (`detectStale()`), exécute `repair()` si nécessaire, recertifie, puis poursuit — sans vidage manuel de cache ni changement de `release_id`.
- **Product Review officielle** — procédure exclusive : [`scripts/product-review-234.sh`](../scripts/product-review-234.sh) en mode produit (`?product=1`) ; bibliothèque d'exécution `.local/product-review-library/` (gitignored). Détail : [`docs/renderer/PRODUCT-REVIEW.md`](renderer/PRODUCT-REVIEW.md).

**Stratégie VCCK révisée (2026-08-06) — [`D-VCCK-STACK-EXTENSION-STRATEGY.md`](../tools/lou-build/vcck/decisions/D-VCCK-STACK-EXTENSION-STRATEGY.md) :**

- **Pas d'extraction immédiate** d'un grand noyau VCCK global — les piles `w1-*` et `cmm-*` divergent ; seule la couche `surface` est candidate à extraction mécanique après audit.
- **Extension des piles par primitive** — familles sœurs étendent la pile ancre qualifiée (`grouped-concurrent` ← `flat-concurrent`, `three-pole-reflow` ← `two-pole`, `fan-out` ← `chain`, etc.) ; **aucune nouvelle pile autonome** pour familles sœurs.
- **Extraction progressive** — couche commune extraite uniquement après convergence observée de ≥ 2 implémentations réelles ; similitude de nom insuffisante.
- **Rigueur des preuves inchangée** — contrat perceptuel, fixtures, budgets, responsive, déterminisme, mutants, audit perceptuel pour chaque qualification.
- **CMM gelée** — pile exceptionnelle pour primitive nouvelle ; non réplicable ; non migrée sans bénéfice démontré.
- **Signatures en E2** — calculées et vérifiées par visualSpec ; E3 devient consolidation de la matrice d'admission.
- **Vagues de qualification** — W2 → W3 → W4 → W5 ; réévaluation extraction `pipeline` après W2, `plan/serialize/validate` après W3.

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
| **Prototypage éditorial (Phase 1A)** | Validation contrat MM/Notions/Cas — chapitre 234 | **Actif (macro)** — Word mobile-first ; Product Review Lou ; voir [plan](plans/editorial-prototyping-and-migration-plan.md) |
| **Industrialisation éditoriale V0 (234)** | Paquet `editorial-industrialization/v0` — séquence E0–E8 | **Architecture VCCK terminée** (ADR-008 + contrat 05) · **E1 clôturée** · **E2 active** (production industrielle visualSpecs) · jalon **pré-W2** avant qualification W2 |
| **Reference Product Chapter (234)** | Laboratoire produit — Phases 2–8 (intention RPC) | **Intégration Reader suspendue** — RPC Phase 1 MM = baseline historique ; Amorçage Phase 2 **suspendu** |
| **Reference Production Chapter (224)** | Industrialisation production — Phase 9 | **Non démarré** — après Product Freeze 234 ; reprend produit figé ; mesure coûts/temps/LLM ; optimise **méthode**, pas produit |
| **Validation Corpus V1 (Fabrique)** | Qualification corpus Fabrique V1 | **Différée** — **après validation complète du 224** ; chapitres suivants (230 ou autre) **non tranchés** ([PDR-C8](governance/PRODUCT-DECISION-REGISTRY.md)) |
| **Validation pédagogique Lou** | Validation pédagogique de la méthode | **En attente** — conditionnée par Validation Corpus V1 ([PDR-B4](governance/PRODUCT-DECISION-REGISTRY.md), [PDR-C8](governance/PRODUCT-DECISION-REGISTRY.md)) |
| **Patrimoine & publication** | Patrimoine V1 ([ADR-006](adr/ADR-006-pedagogical-patrimony-and-edition-lineage.md)) | **E-D publié** — import / restauration patrimoniale (LP-06, PDR-E5 §8–§9) ; E-C export ; E-B persistance ; lots E-A…E-D **clôturés** |
| **CI & maintenabilité** | Maintenabilité et CI ([PDR-G6](governance/PRODUCT-DECISION-REGISTRY.md)) | **Framework validation consolidé — stable** — DEV / PAS / RELEASE [`TEST_ARCHITECTURE_V1.md`](testing/TEST_ARCHITECTURE_V1.md) §2.4 |

**Chantiers UI Reader — aucun ouvert.** Annotation UI Freeze V1 : corrections UI annotation réservées aux **bugs bloquants** uniquement. **SVG Highlight Bridge V1 clôturé** — pas de lot d'implémentation SVG highlight ouvert.

### Acquis annotation Learner (Product Polish V1 — clôturé)

| Capacité | État |
|---|---|
| Shell content-first | Stabilisé |
| Toolbar annotation unique | Stabilisé |
| Highlights Interaction V2 | Stabilisé — création mouseup, édition live, pas d'imbrication |
| Inline Notes | Stabilisées — création, édition, restauration après reload |
| Préférences indépendantes highlight / note | Stabilisées |
| Modèle **1 couleur + 1 style exclusif** (Normal · Gras · Souligné · Barré) | Stabilisé |
| Gomme highlight / note | Stabilisée |
| Workflow édition (sélection partielle → objet entier) | Stabilisé |
| Restauration complète (couleur, style, reload) | Stabilisée |
| Gras highlight — rendu robuste | Stabilisé — Highlight Bold Visibility Hardening |

### Acquis SVG Highlight Bridge V1 (clôturé — 2026-08-03)

| Capacité | État |
|---|---|
| Bridge Highlight V2 HTML ↔ SVG (moteur unique) | Livré — chapitre 234 |
| Backend SVG — LouInlineFormatting (backgroundColor) | Livré |
| Émission `data-official-text-id` (Fabrique Stage G) | Livré — package 234 régénéré |
| Highlights SVG — création mouseup | Livré |
| Highlights SVG — changement de couleur live | Livré |
| Highlights SVG — effacement (gomme) | Livré |
| Highlights SVG — restauration après reload | Livré |
| Résolution SVG live (remplacement DOM figure) | Livré |
| Paint order overlays SVG | Livré |
| UI toolbar contextuelle — G/S/B masqués sur SVG | Livré |
| Non-régression HTML (walkthrough) | Validée |

---

## Livrables de référence — instances

| Rôle (roadmap) | Instance courante | État observé |
|---|---|---|
| **Reference Product Chapter (234)** | Item **234** — Insuffisance cardiaque — édition Collège **2022** | Release `complete` ; **laboratoire produit** — finalisation en cours ; coût **ne pilote pas** les choix éditoriaux |
| **Tranche understanding (330)** | Item **330** — Antithrombotiques — édition Collège **2022** | **Tranche éditoriale uniquement** — sans `publication_version` / `release_id` / `content_digest` ; **non publiable** ; matériau partiel MM/Notions/Collège ; **non** contre-épreuve des 7 vues ; décision compléter vs autre chapitre **différée** |
| **Reference Production Chapter (224)** | Item **224** — HTA — édition Collège **2022** | **Non démarré** — industrialisation complète **après** Product Freeze 234 |
| **Package de capitalisation de référence (normatif)** | Item **234** ([PDR-B2](governance/PRODUCT-DECISION-REGISTRY.md)) | Understanding + **évaluation complète** — 81 Questions + 3 Scénarios ; `editorial_completeness: complete` ; couverture understanding 91/91 ; validate/build PASS |
| **Fixture de non-régression** | Item **234** — workflow [`.github/workflows/ci-234.yml`](../.github/workflows/ci-234.yml) | Gate automatisé — PAS via Product Smokes ; voir [`TEST_ARCHITECTURE_V1.md`](testing/TEST_ARCHITECTURE_V1.md) §5–§6 |

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
| **Phase 2 migration technique** | Bloquée — gate Phase 0 ; Product Review / smokes / 330 release | Prototypage éditorial et migration ([gate](analysis/phase-0-baseline-gate-2026-08-04.md)) |
| **Item 330 — identité release absente** | Non publiable ; non utilisable comme second package produit complet | Migration corpus — compléter 330 ou autre chapitre post-234 |
| Formats structurés EDN non évalués | Latent — nouveau pipeline si requis ([ADR-004](adr/ADR-004-acquisition-architecture-frozen.md) §6) | Couverture EDN |
| Portabilité hors cardio / hors PDF | Latent | Couverture EDN |

**Risques clos récemment :** **Architecture VCCK sous-spécifiée** — ADR-008 publié + contrat 05 réaligné (2026-08-06) · Phase 0.1 — Product Review fiable · smoke CN-07 obsolète post-AP-D (CI-01) · PDR-D2 offline intégral · incohérence manifest slice vs full-chapter (Étape 0) · SVG MM-pump orphelin (relocated) · legacy lou-build · migration FIL A Item 234 · écart édition golden master (corrigé — **2022**, [PDR-B2](governance/PRODUCT-DECISION-REGISTRY.md)).

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
| **Reader Composition V1** | **Publiée** — tag `reader-composition-v1` ; Spec, Engine, ViewModel en production | Audit indépendant ✅ Conforme |
| **PDR-D2 — Offline intégral** | **Publié** — tag `offline-certification-v1` ; lots D2-A…I livrés ; Browser Offline Manager seul certifiant ; 9 tests Playwright OF-D2-* PASS | Contrat [`OFFLINE-COMPONENT-CONTRACT.md`](contracts/components/OFFLINE-COMPONENT-CONTRACT.md) en vigueur |
| **PDR-D6 — Recherche locale** | **Publié** — tag `local-search-v1` ; contrat [`LOCAL-SEARCH-COMPONENT-CONTRACT.md`](contracts/components/LOCAL-SEARCH-COMPONENT-CONTRACT.md) en vigueur ; lots D6-A…G ; indexation Amorçage (C-CP-09, AP-F) | Implémentation Reader validée |
| **PDR-D7 — Préférences d'affichage** | **Publié** — tag `display-preferences-v1` ; contrat [`DISPLAY-PREFERENCES-COMPONENT-CONTRACT.md`](contracts/components/DISPLAY-PREFERENCES-COMPONENT-CONTRACT.md) en vigueur ; lots D7-A…G |
| **Reader V1 — critères d'acceptation** | **Prononcés** — 2026-08-02 ; tag `reader-acceptance-v1` ; **7 vues alimentées** sur package 234 | Acquis clôturé — **Phase 1A** = chantier opérationnel actif |
| **Reader V1 — UI annotation** | **Gelée** — Annotation UI Freeze V1 ; tag `reader-ui-freeze-v1` ; Product Polish V1 clôturé ; Product Review finale annotation **GO** | Aucun chantier UI ouvert |
| **Reader V1 — highlights SVG (GLL annotations MVP)** | **Publié** — SVG Highlight Bridge V1 ; tag `svg-highlight-bridge-v1` ; RPC 234 ; Highlight V2 + LouInlineFormatting | Non-régression HTML validée |
| **Effort humain / chapitre publié** | Non mesuré systématiquement | — |
| **Complétude source (234)** | Chapitre entier — 109 KPs, réconciliation v3 PASS | Évaluation : 81 QCM (91/91 KP understanding) + 3 scénarios |
| **Grounding déterministe** | Non consolidé au niveau projet | Facettes évaluation → KP → ancres inventaire (pas encore sidecar ground dédié) |
| **Reproductibilité du build en CI** | **Validée** — gate 234 sur `main` | Pyramide T0 : Lou Build → unit/contrats → Product Smoke (authoritative) ; slice hors gate |
| **Architecture validation Reader V1** | **Stable — framework consolidé** | [`docs/testing/TEST_ARCHITECTURE_V1.md`](testing/TEST_ARCHITECTURE_V1.md) — DEV / PAS / RELEASE, cartographie §6 |
| **Décisions humaines / chapitre** | Non suivi en production | — |
| lou-build validate PASS (packages produit FIL B) | **1** / 22 — **234** full-chapter uniquement | 234 : validate + build PASS ; Release `complete` ; **1** package produit complet PDR-A3 ; **330** : tranche understanding **sans identité release** — `validate` **FAIL** au 2026-08-04 (absence `publication_version`, `release_id`, `content_digest`) — **non** second package validé |
| Tests lou-build | **180/180** PASS | 159 JS + 21 TS (test:ci) ; intégration slice 18 (test:integration) ; 3 tests Browser Offline Manager (D2-G) |
| Références FIL A opérationnelles | **0** | |

---

## Prochaines étapes

**Chantier macro :** [`plans/editorial-prototyping-and-migration-plan.md`](plans/editorial-prototyping-and-migration-plan.md) — **Phase 1A**.

**Micro-chantier industriel (actif) :** [`execution-roadmap.yaml`](../editorial-industrialization/v0/chapters/234/execution-roadmap.yaml) — **E2**.

| # | Étape industrielle V0 | Owner | Statut |
|---|---|---|---|
| E0 | Geler paquet éditorial V0 | Codex | Largement fait |
| E1 | Qualifier `chapter-master-map` (CMM-R3 / CMM-0.3) | Cursor | **Clôturée** — 2026-08-06 |
| E2 | Rédiger 29 visualSpecs restantes + auditer les 30 ; signature par spec | Codex | **Active — prochaine** |
| PRE-W2 | Audit couche `surface` + standardisation interfaces de preuve | Cursor | **Prochain jalon architecture** — avant W2 |
| E3 | Consolider matrice d'admission 30/30 (signatures produites en E2) | Cursor | En attente (après E2) |
| E4 | Qualifier familles par vagues W2→W5 (extension piles existantes) | Cursor | En attente (après PRE-W2 + E3) |

| # | Étape Phase 1A (macro) | Statut |
|---|---|---|
| 1 | Modélisation globale du chapitre 234 | En cours (via industrialisation V0) |
| 2 | Cartographie MM → Notions → Cas | En attente |
| 3 | Variantes MM (1 à 3 SVG) | En attente — **pas de MM-1 réel avant autorisation séquence E** |
| 4 | Notions pilotes (Lot 2) | En attente |
| 5 | Cas cliniques pilotes (Lot 3) | En attente |
| 6 | Product Review Lou (Word iPhone) | En attente (E8) |
| 7 | Consolidation contrat éditorial | En attente |

**Suspendu** tant que contrat non validé : RPC Phase 2 Amorçage · intégration Reader Phases 3–4 linéaires · Phase 2 migration technique ([gate](analysis/phase-0-baseline-gate-2026-08-04.md)).

**Intention RPC Phases 5–9** (Collège, validation intégrée, Product Review, Freeze, 224) : [`MASTER_ROADMAP.md`](MASTER_ROADMAP.md#roadmap-opérationnelle--reference-product-chapter-234) — sans statut mutable ici.

**Parallèle (non bloquant) :** patrimoine & publication · CI & fixture 234.

---

## Historique récent

Fenêtre utile à la lecture immédiate. Détail antérieur → [`docs/releases/`](releases/) et historique Git.

| Date | Événement |
|---|---|
| 2026-08-06 | **ADR-008 publié — architecture industrielle VCCK stabilisée** — visualSpec = autorité sémantique (contrat 05) ; ADR-008 = autorité de composition ; chantier architecture clôturé ; **E2** = chantier actif (production industrielle visualSpecs 234) |
| 2026-08-06 | **Stratégie VCCK révisée — D-VCCK-STACK-EXTENSION** — pas de noyau global immédiat ; extension piles par primitive ; extraction progressive ; signatures en E2 ; jalon pré-W2 avant qualification W2 ; CMM gelée non réplicable |
| 2026-08-06 | **E1 clôturée — `chapter-master-map` qualifiée V1** — CMM-0.3 / CMM-R3 ; 17/17 tests · 11 gates PASS · audit `PASS_WITH_MINOR_RECOMMENDATIONS` · gel famille autorisé ; prochain micro-lot **E2** (29 visualSpecs + audit 30) |
| 2026-08-04 | **Phase 1A prototypage éditorial activée** — plan autoritaire [`editorial-prototyping-and-migration-plan.md`](plans/editorial-prototyping-and-migration-plan.md) ; conception conjointe MM/Notions/Cas ; RPC Amorçage **suspendu** ; MM RPC Phase 1 = baseline historique |
| 2026-08-04 | **Phase 0 migration clôturée avec réserves** — tag `baseline-phase-0-2026-08-04` — [`phase-0-baseline-gate-2026-08-04.md`](analysis/phase-0-baseline-gate-2026-08-04.md) |
| 2026-08-03 | **SVG Highlight Bridge V1 clôturé** — highlights SVG opérationnels sur RPC 234 ; bridge Highlight V2 + LouInlineFormatting ; Fabrique `data-official-text-id` ; package 234 régénéré ; UI toolbar contextuelle (G/S/B masqués SVG) ; tag `svg-highlight-bridge-v1` ; prochain jalon → Phase 2 Amorçage cognitif |
| 2026-08-03 | **Annotation UI Freeze V1 prononcé** — Product Polish V1 clôturé ; Product Review finale annotation **GO** ; UI Reader V1 stabilisée ; tag `reader-ui-freeze-v1` |
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
| Gate Phase 0 migration (baseline) | [`analysis/phase-0-baseline-gate-2026-08-04.md`](analysis/phase-0-baseline-gate-2026-08-04.md) |
| **Plan chantier macro — Phase 1A** | [`plans/editorial-prototyping-and-migration-plan.md`](plans/editorial-prototyping-and-migration-plan.md) |
| **Roadmap industrielle V0 (E0–E8)** | [`../editorial-industrialization/v0/chapters/234/execution-roadmap.yaml`](../editorial-industrialization/v0/chapters/234/execution-roadmap.yaml) |
| **Qualification E1 CMM** | [`../tools/lou-build/vcck/reports/cmm-qualification-report.md`](../tools/lou-build/vcck/reports/cmm-qualification-report.md) |
| **Stratégie VCCK (extension piles)** | [`../tools/lou-build/vcck/decisions/D-VCCK-STACK-EXTENSION-STRATEGY.md`](../tools/lou-build/vcck/decisions/D-VCCK-STACK-EXTENSION-STRATEGY.md) |
| **ADR-008 — pipeline composition VCCK** | [`adr/ADR-008-vcck-industrial-composition-pipeline.md`](adr/ADR-008-vcck-industrial-composition-pipeline.md) |
| **Contrat 05 — visualSpec (canonique)** | [`contracts/05-VISUAL-GRAMMAR.md`](contracts/05-VISUAL-GRAMMAR.md) |
| Reprise agent | [`HANDOVER.md`](HANDOVER.md) |
| Détail industrialisation (ultérieur) | [`acquisition/industrialization-plan.md`](acquisition/industrialization-plan.md) |

---

*Révision 2026-08-06 — ADR-008 publié ; contrat 05 réaligné ; architecture VCCK stabilisée ; E2 chantier actif ; industrialisation éditoriale ; jalon implémentation pré-W2 avant W2.*
