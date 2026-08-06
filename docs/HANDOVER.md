# Lou Médecine — Handover agent IA

| | |
|---|---|
| **Type** | Point d'entrée opérationnel — **informatif** |
| **Statut** | 2026-08-06 — architecture VCCK **stabilisée** (ADR-008 + contrat 05) ; **E2 active** (production industrielle visualSpecs) ; E1 clôturée |
| **Autorité** | **Aucune** — renvoie vers les sources ; ADR et contrats font foi en cas de conflit |
| **Transition** | Reprise avec **ChatGPT / Codex** (pilotage éditorial) + **Cursor** (implémentation sur autorisation) |

---

## 1. Lire en premier

| Ordre | Document | Pourquoi |
|---|---|---|
| **1** | **Ce fichier** (`HANDOVER.md`) | État le plus à jour pour la reprise (2026-08-06) |
| **2** | [`PROJECT_STATE.md`](PROJECT_STATE.md) | État observé — synchronisé 2026-08-06 |
| **3** | [`editorial-industrialization/v0/chapters/234/execution-roadmap.yaml`](../editorial-industrialization/v0/chapters/234/execution-roadmap.yaml) | Séquence industrielle E0–E8 |
| **4** | [`MASTER_ROADMAP.md`](MASTER_ROADMAP.md) | Intention globale — Product Freeze 234, Phase 9 (224) |
| **5** | [`governance/EXECUTION_MODE_V1.md`](governance/EXECUTION_MODE_V1.md) | Comportement agent en Execution Mode V1 |

**Normes architecture visuelle (gelées) :**

| Document | Rôle |
|---|---|
| [ADR-008](adr/ADR-008-vcck-industrial-composition-pipeline.md) | **Autorité de composition** — pipeline VCCK, capacités, reconnaissance |
| [Contrat 05](contracts/05-VISUAL-GRAMMAR.md) | **Référence canonique visualSpec** — sémantique, primitives, frontière ADR-008 |
| [ADR-001](adr/ADR-001-freeze-svg-grammar-catalogue.md) | Catalogue gelé des primitives |
| [ADR-007](adr/ADR-007-visual-centrality-for-mental-models-and-notions.md) | Centralité visuelle MM/Notions |

**Normes (si tâche technique) :** [`contracts/00-INDEX.md`](contracts/00-INDEX.md) · [`renderer/00-READER-V1-PRODUCT-MODEL.md`](renderer/00-READER-V1-PRODUCT-MODEL.md).

**Si reprise CMM / qualification VCCK :** contrat R3 + rapport E1 —  
[`CMM-R3-PERCEPTUAL-COMPOSITION-CONTRACT.md`](../editorial-industrialization/v0/composition-contracts/CMM-R3-PERCEPTUAL-COMPOSITION-CONTRACT.md) ·  
[`cmm-qualification-report.md`](../tools/lou-build/vcck/reports/cmm-qualification-report.md).

**Stratégie VCCK (implémentation) :** [`D-VCCK-STACK-EXTENSION-STRATEGY.md`](../tools/lou-build/vcck/decisions/D-VCCK-STACK-EXTENSION-STRATEGY.md) — extension des piles par primitive ; extraction progressive ; pas de noyau global immédiat.

---

## 2. Objectif actif et livrable

### Horizon produit (macro — inchangé)

| | |
|---|---|
| **Chantier macro** | **Phase 1A** — prototypage éditorial hors Reader |
| **Objectif macro** | Valider avec Lou le contrat éditorial cible MM · Notions · Cas sur le chapitre **234** |
| **Livrable macro** | Prototypes Word mobile-first · Product Review Lou · puis Product Freeze 234 |

### Architecture VCCK — gelée (ne pas rouvrir)

| Couche | Référence | Statut |
|---|---|---|
| Primitives | [ADR-001](adr/ADR-001-freeze-svg-grammar-catalogue.md) | Gel catalogue |
| visualSpec | [Contrat 05](contracts/05-VISUAL-GRAMMAR.md) | **Canonique** — autorité sémantique |
| Composition industrielle | [ADR-008](adr/ADR-008-vcck-industrial-composition-pipeline.md) | **Accepted** — autorité de composition |
| Package / Reader | Contrats 04 et 06 | Inchangés |

**Chantier d'architecture VCCK : terminé.** Ne pas réécrire ADR-008 ni le contrat 05 sans instruction explicite. Le modèle historique « primitive → renderer → figure » est **abrogé**.

### Chantier opérationnel immédiat (micro)

| | |
|---|---|
| **Mission active** | **E2** — **production industrielle** des visualSpecs : rédaction des **29 restantes** + audit des **30** ; signature calculée par spec |
| **Owner** | **Codex / ChatGPT** |
| **Nature du projet** | **Industrialisation éditoriale** (architecture stabilisée) |
| **Dépendance** | E0 (paquet éditorial V0) ; **E1 clôturée** (famille `chapter-master-map` qualifiée) |
| **Exit cible** | `30_SEMANTIC_SPECS_READY` (signature vérifiée par spec) |
| **Prochaine qualification VCCK** | **W2** (`grouped-concurrent`, `three-pole-reflow`) — **après** jalon pré-W2 (audit surface + interfaces de preuve) |
| **En parallèle** | E3 devient consolidation de la matrice d'admission (signatures déjà produites en E2) |
| **Interdit sans instruction** | Générer le MM-1 réel 234 · nouvelle pile autonome pour familles sœurs · modifier Reader / packages publiés · commit sans accord |

**Baseline Git tags utiles :** `baseline-phase-0-2026-08-04` · `svg-highlight-bridge-v1` · `reader-acceptance-v1`.

**Travail local non commité :** paquet `editorial-industrialization/v0/`, harnais CMM-0.3, rapports VCCK, analyses 234 — vérifier `git status` avant toute action.

---

## 3. Séquence industrielle 234 — où en est-on

```text
[ ARCHITECTURE VCCK — TERMINÉE ]
  ADR-008 + contrat 05 + ADR-001 + contrats 04/06

E0  Geler paquet éditorial V0           [Codex — largement fait]
E1  Qualifier chapter-master-map        [CLÔTURÉE — 2026-08-06]
E2  Production industrielle visualSpecs [Codex — ACTIVE ; 29 + audit 30 ; signature/spec]
    ↳ PRE-W2  Audit surface + interfaces  [Cursor — avant W2 ; jalon implémentation]
E3  Consolider matrice admission 30/30  [Cursor — après E2]
E4  Qualifier familles par vagues W2→W5  [Cursor — extension piles existantes]
E5  Rendre 30 contributions             [Cursor]
E6  Walkthroughs                        [Codex]
E7  Assemblage Word/Reader              [Cursor]
E8  Product Review Lou                  [Codex/Lou]
```

### Stratégie VCCK révisée (2026-08-06)

Décision durable : [`D-VCCK-STACK-EXTENSION-STRATEGY.md`](../tools/lou-build/vcck/decisions/D-VCCK-STACK-EXTENSION-STRATEGY.md).

| Règle | Contenu |
|---|---|
| **Pas de noyau global immédiat** | Les piles `w1-*` et `cmm-*` divergent ; seule `surface` est candidat à extraction mécanique |
| **Extension par primitive** | Familles sœurs étendent la pile ancre (`grouped-concurrent` ← `flat-concurrent`, etc.) |
| **Pas de pile autonome sœur** | Aucun préfixe `w2-*` complet pour une famille sœur |
| **Extraction progressive** | Couche commune extraite seulement après convergence de ≥ 2 implémentations réelles |
| **CMM gelée** | Pile exceptionnelle pour primitive nouvelle ; non réplicable ; non rouverte |
| **Prochaine vague** | **W2** : `grouped-concurrent`, `three-pole-reflow` |
| **Prérequis W2** | Audit ciblé couche `surface` + standardisation interfaces gates/verdict/rapport |

### E1 — acquis (ne pas rouvrir)

| Élément | Résultat |
|---|---|
| **CMM-R3** | Contrat perceptuel implémenté (CMM-0.3) |
| **Tests** | 17/17 PASS |
| **Gates R3** | 11/11 blocking PASS |
| **Verdict technique** | `READY_FOR_CHAPTER_MASTER_MAP_CODEX_VISUAL_REAUDIT` |
| **Audit indépendant** | **`PASS_WITH_MINOR_RECOMMENDATIONS`** |
| **Famille** | `chapter-master-map` **qualifiée V1** pour industrialisation |
| **Gel famille** | Autorisé — résidus non bloquants (placement grille vs couches topologiques ; embranchement mobile 2-col ; densité corridors ; whitespace Word) |
| **Rapport** | [`tools/lou-build/vcck/reports/cmm-qualification-report.md`](../tools/lou-build/vcck/reports/cmm-qualification-report.md) |

### Séquence CMM (historique court)

| Itération | Résultat | Statut |
|---|---|---|
| **CMM-0.1** | Arêtes radiales + progression diagonale | Échec perceptuel |
| **CMM-0.2** | Cadre + bande de progression | Redesign requis (`CMM_COMPOSITION_REDESIGN_REQUIRED`) |
| **CMM-R3** | Spec perceptuelle figée | Autorité composition |
| **CMM-0.3** | Implémentation R3 + qualification E1 | **Clôturée** |

---

## 4. Gouvernance Codex / Cursor

| Rôle | Responsabilités |
|---|---|
| **Codex / ChatGPT** | visualSpecs, audits perceptuels, walkthroughs, décisions éditoriales, pilotage E2 |
| **Cursor** | Renderers, validateurs, harnais VCCK, signatures E3+, génération industrielle, Git sur autorisation |

**ADR-007** (centralité visuelle MM/Notions) — **Accepted**.  
**ADR-008** (pipeline composition VCCK) — **Accepted** — référence normative composition ; **ne pas modifier**.  
**Contrat 05** (visualSpec) — **référence canonique sémantique** — aligné ADR-008.  
**Execution Mode V1** — en vigueur.

---

## 5. Autorisé / interdit (mission E2)

| Autorisé | Interdit |
|---|---|
| Rédiger / auditer visualSpecs des 29 contributions restantes ; calculer signature par spec | Modifier le renderer CMM-R3 sans instruction (famille gelée) |
| Consolider le paquet éditorial V0 (cartes, contrats éditoriaux non normatifs Reader) | Générer le **MM-1 réel** du chapitre 234 |
| Préparer le brief consolidation E3 (matrice depuis signatures E2) | Créer une **nouvelle pile autonome** pour familles sœurs (W2+) |
| | Implémenter qualification W2 **avant** jalon pré-W2 (audit surface + interfaces) |
| | Modifier assets 234 gelés, baselines protégées, Reader, packages publiés |
| | Commit / push sans instruction explicite du propriétaire |
| | Phase 2 migration technique (**bloquée**) |
| | UI annotation Reader (gelée) hors bug bloquant |

---

## 6. Fichiers clés

| Rôle | Chemin |
|---|---|
| **ADR-008 — composition VCCK** | `docs/adr/ADR-008-vcck-industrial-composition-pipeline.md` |
| **Contrat 05 — visualSpec** | `docs/contracts/05-VISUAL-GRAMMAR.md` |
| Roadmap industrielle 234 | `editorial-industrialization/v0/chapters/234/execution-roadmap.yaml` |
| Paquet industriel V0 | `editorial-industrialization/v0/README.md` |
| Cartes de production | `editorial-industrialization/v0/chapters/234/production-cards.yaml` |
| Contrat CMM-R3 (réf.) | `editorial-industrialization/v0/composition-contracts/CMM-R3-*.md` / `.yaml` |
| Harnais CMM qualifié | `tools/lou-build/lib/vcck/cmm-*.js` |
| Rapport qualification E1 | `tools/lou-build/vcck/reports/cmm-qualification-report.md` |
| Stratégie VCCK (extension piles) | `tools/lou-build/vcck/decisions/D-VCCK-STACK-EXTENSION-STRATEGY.md` |
| État projet | `docs/PROJECT_STATE.md` |

---

## 7. Acquis historiques (ne pas rouvrir sans instruction)

Reader Acceptance V1 · Composition V1 · D1–D7 · Patrimoine E-A…E-D · Annotation UI Freeze · SVG Highlight Bridge V1 · RPC Phases 0–0.1 · RPC Phase 1 MM (baseline historique) · **ADR-008 publié** · **contrat 05 réaligné** · **CMM-R3 implémenté** · **`chapter-master-map` qualifiée V1** · audit E1 `PASS_WITH_MINOR_RECOMMENDATIONS`.

**Suspendu :** RPC Phase 2 Amorçage · Phases 3–4 linéaires · Phase 2 migration technique.

---

## 8. Références rapides

| Besoin | Document |
|---|---|
| Plan Phase 1A (macro) | [`plans/editorial-prototyping-and-migration-plan.md`](plans/editorial-prototyping-and-migration-plan.md) |
| Analyse MM/Notions 234 | [`analysis/phase1a-234-mm-notions-design.md`](analysis/phase1a-234-mm-notions-design.md) |
| Capability map VCCK 234 | [`analysis/chapter-234-vcck-capability-map.md`](analysis/chapter-234-vcck-capability-map.md) |
| Gate Phase 0 / réserves | [`analysis/phase-0-baseline-gate-2026-08-04.md`](analysis/phase-0-baseline-gate-2026-08-04.md) |
| Intention RPC Phases 0–9 | [`rpc/00-RPC-METHODOLOGY.md`](rpc/00-RPC-METHODOLOGY.md) |
| Validation (DEV/PAS/RELEASE) | [`testing/TEST_ARCHITECTURE_V1.md`](testing/TEST_ARCHITECTURE_V1.md) |
| Registre ADR | [`adr/README.md`](adr/README.md) |

---

## 9. Reprendre le projet

**ChatGPT / Codex (pilotage) :** lire §1–§3 ; architecture VCCK **gelée** — ne pas rouvrir ADR-008 ; enchaîner sur **E2** (production industrielle visualSpecs : 29 + audit 30, signature par spec) ; préparer consolidation E3 ; **ne pas lancer W2** avant jalon pré-W2.

**Cursor (implémentation) :** jalon pré-W2 (audit surface + interfaces) puis qualification **W2** sur instruction ; ne pas créer de pile autonome pour familles sœurs ; ne pas régénérer MM réel 234 ; ne pas rouvrir CMM ; pas de commit sans accord.

*« On reprend le lot en cours »* → **E2 (production industrielle visualSpecs)** est le lot actif.

---

*Handover — 2026-08-06 — architecture VCCK stabilisée (ADR-008 + contrat 05) · E2 micro actif · industrialisation éditoriale. Non normatif.*
