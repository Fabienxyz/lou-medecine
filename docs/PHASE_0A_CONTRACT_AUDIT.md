# Phase 0A — Audit des Contrats Fondamentaux

**Statut :** rapport d'audit — préparation à la rédaction des contrats  
**Date :** 2026-07-28  
**Périmètre :** inventaire, cartographie, redondances, contradictions, lacunes, organisation proposée  
**Hors périmètre :** aucune modification de code, pipeline, format ou spécification nouvelle

---

## Résumé exécutif

Le dépôt Lou Médecine possède déjà une **fondation contractuelle substantielle**, mais **dispersée** et **hétérogène en maturité**. Les contrats les plus stables et normatifs sont concentrés dans :

- la chaîne **gouvernance → ADR → contrats racine** ;
- **`IMPLEMENTATION_CONTRACT.md`** (contrat maître aval) ;
- **`VISUAL_GRAMMAR_CONTRACT.md`** + **ADR-001** (couche visuelle) ;
- **ADR-003 / ADR-004 / `SOURCE_OF_TRUTH.md`** (acquisition gelée) ;
- **Tool 01 / Tool 02 `CONTRACT.md`** (interface d'entrée) ;
- **`tools/lou-build`** (application partielle des contrats C.2–C.6).

**Constats principaux :**

1. **~45 contrats normatifs identifiables**, regroupables en **12 familles** sans perte de sens.
2. **Redondance élevée** sur SSOT, invariants pipeline, séparation officiel/généré, et traçabilité — souvent répétés dans 3 à 6 documents.
3. **Contradictions réelles mais localisées** : exemples FIL A dans le contrat maître ; troncature legacy SVG vs invariant I4 ; schéma visualSpec non gelé vs catalogue primitif gelé ; troisième mécanisme d'annotation (ADR-002) absent du contrat C.8/C.9.
4. **Écart implémentation ↔ contrat ratifié** : plusieurs obligations C.3/C.6 documentées mais **non appliquées** dans `lou-build` (selection sanity, subordination visuelle, badges édition).
5. **Trous normatifs réels** : schémas formels du chapter package, manifest, claim blocks, CI/reproductibilité, Tools 03–05, contrat Lecteur/`library.json` — aujourd'hui **implicites** ou **fragmentés**.

**Recommandation :** la Phase 0A doit produire **4 à 6 documents normatifs de niveau 1**, consolidant l'existant sans en inventer de nouveaux. Les rapports de qualification, la doc renderer et `REFERENCE_IMPLEMENTATION_DESIGN` restent **références**, pas contrats autonomes.

---

## 1. Inventaire des contrats existants

### Échelle de maturité utilisée

| Niveau | Signification |
|---|---|
| **Gelé** | ADR ou CONTRACT versionné ; changement = ADR ou bump de version |
| **Ratifié** | Décision actée, application partielle possible |
| **Appliqué** | Enforced dans `lou-build` ou tests |
| **Bootstrap** | Mécanisme provisoire documenté (allowlists, YAML persistés) |
| **Expérimental** | Comportement en code, schéma non gelé |
| **Phase-audit** | Validators spécifiques Item 234, hors gate générique |
| **Reporté** | Spécifié dans contrat maître, non implémenté |
| **Descriptif** | Documentation utile, non normative seule |

---

### 1.1 Gouvernance et pilotage

| Nom | Emplacement | Description | Maturité | Documents |
|---|---|---|---|---|
| **Mission et hors périmètre** | `docs/MASTER_ROADMAP.md` §1–2 | Ce que le projet vise et refuse (pas de SaaS, pas de chat médical, etc.) | Ratifié (pilotage) | Roadmap |
| **Principes fondateurs** | `docs/MASTER_ROADMAP.md` §3 | Fidélité Collège, SSOT, déterminisme, séparation officiel/généré | Ratifié | Roadmap, ADR-004 NP |
| **Invariants pipeline** | `docs/MASTER_ROADMAP.md` §4 | Pas de retouche manuelle des artefacts générés ; décision humaine = entrée versionnée | Ratifié | Roadmap, IMPLEMENTATION A.1 |
| **Canal décision humaine** | `docs/MASTER_ROADMAP.md` §4 | Exceptions machine → décision comptée, rejouable | Ratifié | Roadmap |
| **Hiérarchie documentaire** | `docs/MASTER_ROADMAP.md` en-tête | Roadmap pilote priorités ; contrats techniques pilotent implémentation | Ratifié | Roadmap |
| **État opérationnel** | `docs/PROJECT_STATE.md` | Phase active, jalons, risques — **non normatif** pour le comportement | Descriptif | PROJECT_STATE |
| **Stratégie LLM** | `docs/LLM_STRATEGY.md` | LLM propose, code vérifie ; répartition par étage | Ratifié (évolutif) | LLM_STRATEGY, ADR-004 NP-4 |

---

### 1.2 Architecture décisionnelle (racine dépôt)

| Nom | Emplacement | Description | Maturité | Documents |
|---|---|---|---|---|
| **Baseline architecture** | `FINAL_ARCHITECTURE.md` | Deux artefacts curated ; pipeline Source → Inventory → Blueprint → Projections → Package → Renderer | Ratifié (subordonné) | FINAL_ARCHITECTURE, IMPLEMENTATION |
| **Contrat d'implémentation maître** | `IMPLEMENTATION_CONTRACT.md` | Trust model, A.1–A.3, Part B–E, C.1–C.9 | **Ratifié — contrat supérieur aval** | Tout l'aval |
| **Design de référence Item 234** | `REFERENCE_IMPLEMENTATION_DESIGN.md` | Sérialisation concrète, layout cible, règles de build | Descriptif / référence | Subordonné à IMPLEMENTATION |
| **Audit factuel initial** | `ARCHITECTURE_AUDIT.md` | Baseline historique | Descriptif (archivé) | FINAL_ARCHITECTURE |

**Règle de suprématie :** `IMPLEMENTATION_CONTRACT.md` **gouverne** `FINAL_ARCHITECTURE.md` en cas de conflit (gates humaines médicales supprimées).

---

### 1.3 Acquisition et Single Source of Truth

| Nom | Emplacement | Description | Maturité | Documents |
|---|---|---|---|---|
| **SSOT permanent** | `docs/SOURCE_OF_TRUTH.md` §1 | Une seule autorité par donnée métier | Gelé | ADR-003, ADR-004 |
| **Chaîne FIL B** | `docs/SOURCE_OF_TRUTH.md` §2 | PDF → Tool 01 → MD → Tool 02 → chapitres | Gelé | ADR-003, ADR-004, PIPELINE |
| **FIL A legacy** | `docs/SOURCE_OF_TRUTH.md` §3 | Interdit pour nouveau travail | Gelé | ADR-003, PROJECT_STATE |
| **ADR-003 SSOT** | `docs/adr/ADR-003-single-source-of-truth.md` | Acte de gouvernance FIL B unique | Gelé | SOURCE_OF_TRUTH |
| **ADR-004 acquisition frozen** | `docs/adr/ADR-004-acquisition-architecture-frozen.md` | Gel Tool 01/02, NP-1–NP-6, politique modification A/B/C | Gelé | SOURCE_OF_TRUTH, releases |
| **Grille P1–P7** | `docs/SOURCE_PIPELINE_QUALIFICATION.md` | Suffisance aval, pas reproduction PDF | Gelé | ADR-004, rapports qualification |
| **Tool 01 downstream contract** | `01-learning/tools/01-pdf-to-canonical/CONTRACT.md` | Déterminisme, structure MD, pas d'interprétation médicale | Gelé v1.0.0 | ADR-004, DECISIONS.md |
| **Tool 02 downstream contract** | `01-learning/tools/02-chapter-splitter/CONTRACT.md` | Slices byte-déterministes, round-trip, manifest | Gelé v1.0.0 | ADR-004 |
| **Composition pipeline** | `01-learning/tools/PIPELINE.md` | Tool 01→05 ; Tools 03–05 **planifiés** | Partiellement gelé | industrialization-plan |

**Entrées / sorties acquisition :**

| Composant | Entrées | Sorties | Garanties |
|---|---|---|---|
| Tool 01 | PDF bytes | `official-college.md`, `manifest.json` | Byte-déterministe, provenance SHA |
| Tool 02 | `official-college.md` | `chapters/item-*.md`, manifest chapitres | Round-trip exact, pas de réécriture |
| Chapter slice (FIL B) | Tool 02 output | Texte officiel segmenté | Consommé via `source.meta.yaml` |

---

### 1.4 Exigences transverses (Part A — IMPLEMENTATION_CONTRACT)

| Nom | Emplacement | Description | Maturité | Enforcement |
|---|---|---|---|---|
| **A.1 Fidélité sans relecteur médical** | IMPLEMENTATION §A.1 | Correctness = traçabilité Collège | Ratifié | Partiel (reconciliation bootstrap, grounding partiel) |
| **Réconciliation indépendante** | IMPLEMENTATION §A.1 | Segments : represented / deferred / excluded / missed / ambiguous | Ratifié | Appliqué (persisted YAML) ; extraction Tool 03 absent |
| **Classes de claim** | IMPLEMENTATION §A.1 | `sourced` \| `scaffolding` \| `bridging` | Ratifié | Appliqué (claims + visualSpec) |
| **Fallback conservateur** | IMPLEMENTATION §A.1 | Omettre > fabriquer | Ratifié | Partiel |
| **A.2 Mises à jour d'édition** | IMPLEMENTATION §A.2 | Identités stables, diff KP, coherence check | Ratifié | **Reporté** (non implémenté) |
| **A.3 Exhaustif vs manageable** | IMPLEMENTATION §A.3 | Inventory exhaustif ; Blueprint sélectionne | Ratifié | Appliqué (dispositions) ; selection sanity **reporté** |

---

### 1.5 Mécanismes transverses (Part B — IMPLEMENTATION_CONTRACT)

| Nom | Emplacement | Description | Maturité | Enforcement |
|---|---|---|---|---|
| **Schéma d'identité** | IMPLEMENTATION §Part B, D | `cardio/234`, `KP-nnn`, `MEC-*`, etc. | Ratifié | Appliqué (inventory, blueprint, claims) |
| **Ancre source** | IMPLEMENTATION §Part B | `{ edition, section_path, quote }` | Ratifié / **gel partiel** | Appliqué (`anchors.js`) |
| **Claim block** | IMPLEMENTATION §Part B | Unité de traçabilité ; locators `{#cb-*}` | Ratifié | Appliqué (`claims.js`) |
| **Chaîne de traçabilité** | IMPLEMENTATION §Part B | anchor ← KP ← element ← claim | Ratifié | Appliqué (`traceability.json`) |
| **Bloc pédagogique** | IMPLEMENTATION §Part B | Question → Visual? → Walkthrough | Ratifié | Appliqué (projections + renderer) |
| **Asymétrie walkthrough / visual** | IMPLEMENTATION §Part B, VISUAL_GRAMMAR §5 | Walkthrough canonique ; visual subordonné | Ratifié | **Subordination non enforced** |
| **Couche apprenant (boundary)** | IMPLEMENTATION §Part B, C.8–C.9 | Jamais input génération ; immuable contenu officiel | Ratifié | Appliqué (renderer) ; annotations texte ADR-002 **hors contrat C.x** |

---

### 1.6 Contrats composants (Part C — IMPLEMENTATION_CONTRACT)

| Composant | Emplacement | Responsabilité | Entrées | Sorties | Maturité code |
|---|---|---|---|---|---|
| **C.1 Official Source** | IMPLEMENTATION §C.1 | Autorité médicale verbatim | PDF / chapitre FIL B | Texte adressable | Via FIL B gelé |
| **C.2 Knowledge Inventory** | IMPLEMENTATION §C.2 + `lib/inventory.js` | Exhaustivité, KP, dispositions, ancres | Source, édition | `inventory.yaml` | Appliqué |
| **C.3 Chapter Blueprint** | IMPLEMENTATION §C.3 + `lib/blueprint.js` | Plan pédagogique structuré | Inventory | `blueprint.md` | Appliqué ; selection sanity **reporté** |
| **C.4 Understanding Projections** | IMPLEMENTATION §C.4 + `lib/claims.js` | Explications claim-traced | Blueprint | `projections/**/*.md` | Appliqué |
| **C.5 Mastery Projections** | IMPLEMENTATION §C.5 | QCM, flashcards (futur) | Inventory (+ Blueprint contexte) | Non construit | Ratifié, **non implémenté** |
| **C.6 Chapter Package / Manifest** | IMPLEMENTATION §C.6 + `lib/package.js` | Index renderer ; états visuals | Tous artefacts | `manifest.json`, sidecars | Appliqué |
| **C.7 Renderer** | IMPLEMENTATION §C.7 + `docs/renderer/*` | Assemblage UX ; zéro contenu médical | Manifest + sidecars | Expérience apprenant | Appliqué (prototype) |
| **C.8 Personal Diagrams** | IMPLEMENTATION §C.8 | Photos dessins apprenant | Input apprenant | IndexedDB | Appliqué |
| **C.9 Inline Notes** | IMPLEMENTATION §C.9 | Notes marge sur claim blocks | Input apprenant | IndexedDB | Appliqué |

**Artefacts chapter package (norme ADR-004 §2 + lou-build README) :**

| Fichier | Rôle | Éditable humain ? |
|---|---|---|
| `source.meta.yaml` | Édition + index sections | Non (pointeur FIL B) |
| `inventory.yaml` | Curated #1 | Oui (pipeline) |
| `blueprint.md` | Curated #2 | Oui (pipeline) |
| `chapter.package.yaml` | Config package, allowlists | Oui (entrée pipeline) |
| `projections.yaml` | Registre projections | Oui |
| `projections/**/*.md` | Contenu généré | Non (regénéré) |
| `build/reconciliation.yaml` | Réconciliation persistée | Non |
| `build/grounding.yaml` | Verdicts grounding | Non |
| `build/traceability.json` | Graphe traçabilité | Non |
| `manifest.json` | Entrée renderer | Non |
| `figures/*.svg` | Visuels officiels | Non (regénéré) |

---

### 1.7 Couche visuelle

| Nom | Emplacement | Description | Maturité | Documents |
|---|---|---|---|---|
| **VISUAL_GRAMMAR_CONTRACT** | `VISUAL_GRAMMAR_CONTRACT.md` | 4 layers, invariants I1–I12 | Ratifié (schéma **non gelé**) | IMPLEMENTATION C.4, C.6 |
| **ADR-001 catalogue gelé** | `docs/adr/ADR-001-freeze-svg-grammar-catalogue.md` | `VISUAL_GRAMMAR_LIBRARY.md` autoritaire | Gelé (cardio) | VISUAL_GRAMMAR I10 |
| **visualSpec v0.1** | `tools/lou-build/lib/visual-spec.js` | IR sémantique, primitive `causal-graph` | Expérimental | Tests visual-spec |
| **Pipeline render V2** | `lib/visual-render.js`, layout, text-fit | Renderer sans vocabulaire médical | Appliqué | Tests A–O |
| **Pipeline legacy V1** | `lib/svg.js` | `process-flow` depuis Blueprint | Appliqué (transition) | Conflit I4 troncature |
| **Grounding visuel** | `lib/visual-ground.js` | Eligibility render | Appliqué | Tests visual-ground |

---

### 1.8 Renderer et lecteur

| Nom | Emplacement | Description | Maturité | Documents |
|---|---|---|---|---|
| **ADR-002 Renderer V2** | `docs/adr/ADR-002-renderer-v2-architecture.md` | `docs/renderer/` autoritaire ; immutabilité ; 3 mécanismes apprenant | Ratifié | IMPLEMENTATION C.7–C.9 |
| **Immutabilité contenu officiel** | `docs/renderer/02-PRODUCT_SPECIFICATION.md` | Pas d'édition projections | Ratifié | ADR-002 §3 |
| **Modèle de données apprenant** | `docs/renderer/08-DATA_MODEL.md` | IndexedDB, schémas annotations | Ratifié (impl.) | C.8, C.9 |
| **Non-goals renderer** | `docs/renderer/12-NON_GOALS.md` | Pas de CMS, pas d'IA médicale | Ratifié | ADR-002 |
| **Contrat tests renderer** | `demo/renderer/` + smoke reports | Conformité manifest-driven | Appliqué | Tests smoke |

---

### 1.9 Build, validation, tests

| Nom | Emplacement | Description | Maturité | Documents |
|---|---|---|---|---|
| **CLI lou-build** | `tools/lou-build/cli.js` | `validate` / `build` ; exit codes | Appliqué | README |
| **Orchestration package** | `lib/package.js` | Gates ; invalidation manifest si échec | Appliqué | slice.test.js |
| **Withheld visual policy** | `lib/package.js`, IMPLEMENTATION C.6 | Visual en échec n'empêche pas publication walkthrough | Ratifié + Appliqué | slice.test.js |
| **Bootstrap semantic grounding** | `lib/ground.js`, `chapter.package.yaml` | Allowlist bridging jusqu'à runtime LLM | Bootstrap | generic.test.js |
| **Validators phase 234** | `01-learning/chapters/cardio/234/build/validate-*.mjs` | Identités gelées phases 2c–4 | Phase-audit | Rapports qualification |
| **Régression OAP slice** | `test/slice.test.js` | Vertical slice 234 end-to-end | Appliqué | Item 234 |
| **Portabilité générique** | `test/generic.test.js` | Pas d'hypothèses OAP-only | Appliqué | Chapitre 330 |

---

### 1.10 Chapitres de référence (instances, pas contrats autonomes)

| Chapitre | Rôle contractuel | Maturité |
|---|---|---|
| **234** | Vertical slice OAP ; régression harness ; reconciliation slice | Référence production-hardened |
| **330** | Second archétype (tableaux) ; validation FIL B | Référence initial-v1 |

Ces packages **illustrent** les contrats ; leurs validators phase-specific **ne sont pas** des contrats projet.

---

## 2. Regroupement — familles de contrats

Douze familles couvrent l'ensemble du dépôt sans duplication conceptuelle :

| Famille | Contrats regroupés | Document canonique proposé |
|---|---|---|
| **F1 — Gouvernance produit** | Mission, hors périmètre, principes roadmap | `MASTER_ROADMAP.md` (pilotage) |
| **F2 — Trust & fidélité médicale** | A.1, claim classes, reconciliation, grounding, fallback | `IMPLEMENTATION_CONTRACT.md` Part A |
| **F3 — Identité & ancres** | Part B/D, section_path, KP/element IDs | `IMPLEMENTATION_CONTRACT.md` + gel 0A roadmap |
| **F4 — SSOT & acquisition** | ADR-003, ADR-004, SOURCE_OF_TRUTH, Tool 01/02, P1–P7 | ADR-004 + SOURCE_OF_TRUTH (index) |
| **F5 — Chapter package** | C.2–C.6, layout ADR-004, REFERENCE_IMPLEMENTATION | IMPLEMENTATION Part C + schéma à formaliser |
| **F6 — Projections & claim blocks** | C.4, Part B claim block, projections.yaml | IMPLEMENTATION + format à formaliser |
| **F7 — Visual grammar** | VISUAL_GRAMMAR, ADR-001, visualSpec, render | VISUAL_GRAMMAR_CONTRACT + ADR-001 |
| **F8 — Renderer & lecteur** | C.7–C.9, ADR-002, product spec, data model | ADR-002 + IMPLEMENTATION C.7–C.9 |
| **F9 — LLM & sémantique** | LLM_STRATEGY, bootstrap grounding, Tools 03–05 plan | LLM_STRATEGY + contrats Tools futurs |
| **F10 — Éditions & lifecycle** | A.2, provenance stamps, coherence check | IMPLEMENTATION A.2 (**à implémenter plus tard**) |
| **F11 — Build & CI** | lou-build gates, reproductibilité roadmap 0A | **Manquant comme contrat unique** |
| **F12 — Mastery & adaptivity** | C.5, future adaptive layer | IMPLEMENTATION C.5 (**futur**) |

### Redondances majeures (à éliminer lors de la rédaction)

| Thème | Occurrences | Recommandation |
|---|---|---|
| SSOT / FIL B unique | SOURCE_OF_TRUTH, ADR-003, ADR-004, MASTER_ROADMAP §3–4, PIPELINE | **Une section normative** ; les autres renvoient |
| Suffisance aval vs PDF | ADR-004 NP-1–3, SOURCE_PIPELINE_QUALIFICATION §0, qualification reports | **Conserver P1–P7** ; rappel bref ailleurs |
| Traçabilité anchor←KP←claim | IMPLEMENTATION Part B, ADR-004 NP-5, lou-build README, REFERENCE §1.4 | **Une définition** dans contrat identité |
| Séparation officiel / généré | MASTER_ROADMAP §3.7, IMPLEMENTATION C.7, renderer product spec, ADR-002 | **Une règle** dans contrat renderer |
| Deux curated structures | FINAL_ARCHITECTURE §1, IMPLEMENTATION, REFERENCE §1.1, ADR-004 §2 | **Une règle** dans contrat chapter package |
| Walkthrough canonique / visual optionnel | IMPLEMENTATION Part B, C.4, C.6, VISUAL_GRAMMAR §5 | **VISUAL_GRAMMAR + renvoi** depuis C.6 |
| Immutabilité contenu apprenant | IMPLEMENTATION C.7–C.9, ADR-002 §3, renderer 02, 12 | **ADR-002 + C.7** comme autorité |

---

## 3. Contradictions et écarts identifiés

### 3.1 Contradictions documentaires

| # | Sujet | Document A | Document B | Nature | Sévérité |
|---|---|---|---|---|---|
| **C-01** | Source exemple Item 234 | `IMPLEMENTATION_CONTRACT.md` Part E cite FIL A (`chapter-analysis/…`, édition `2024-SFC`) | ADR-003/004, PROJECT_STATE : 234 migré FIL B | **Décalage doc** — migration faite, contrat maître non aligné | Modéré |
| **C-02** | Extension modèle d'ancre | `MASTER_ROADMAP.md` §0A : types `table-cell`, `figure`, `section` | Code + IMPLEMENTATION : **quote-only** `{ edition, section_path, quote }` | **Roadmap anticipée** vs contrat actuel | Modéré (0A à trancher) |
| **C-03** | Troisième mécanisme apprenant | ADR-002 : annotations sur sélection texte | IMPLEMENTATION C.8/C.9 : deux mécanismes seulement | **Extension non intégrée** au contrat maître | Modéré |
| **C-04** | Catalogue vs extensibilité | ADR-001 : catalogue **gelé** | VISUAL_GRAMMAR I10 : grammaire **ouverte** avec preuve | **Réconciliable** : gel = baseline ; extension = ADR + validation | Faible |
| **C-05** | Layout chapitre | REFERENCE_IMPLEMENTATION `content/cardio/234/` | Repo réel `01-learning/chapters/cardio/234/` | **Design vs implémentation** — REFERENCE subordonné | Faible |
| **C-06** | Numérotation phases | MASTER_ROADMAP : Phase 0 **terminée** ; sous-section **0A** encore listée | Cette Phase 0A (audit contrats) | **Ambiguïté pilotage** — clarifier que 0A = sous-jalon contrats | Faible |

### 3.2 Écarts contrat ratifié ↔ code (`lou-build`)

| # | Obligation | Source | État code | Impact |
|---|---|---|---|---|
| **E-01** | Selection sanity (Blueprint omit → deferred/excluded) | IMPLEMENTATION C.3 | Non vérifié | Risque KP silencieusement absents du Blueprint |
| **E-02** | Subordination visuelle (KP visual ⊆ walkthrough) | IMPLEMENTATION Part B, C.6 | Non vérifié | Visual pourrait porter des faits hors walkthrough |
| **E-03** | Badges édition dérivés KP only | IMPLEMENTATION A.2, C.6 | Non dans manifest | Futur multi-édition |
| **E-04** | I4 pas de troncature | VISUAL_GRAMMAR I4 | `svg.js` `shortLabel` tronque à 48 chars | Legacy path seulement |
| **E-05** | Renderer ne lit pas Inventory/Blueprint | IMPLEMENTATION C.7 | Respecté côté renderer ; build OK | — |
| **E-06** | Grounding sémantique indépendant | IMPLEMENTATION A.1 | Bootstrap allowlist | Attendu jusqu'à Tool 05 / runtime LLM |
| **E-07** | Coherence check édition | IMPLEMENTATION A.2 | Absent | Phase future |
| **E-08** | Schéma visualSpec gelé | VISUAL_GRAMMAR §6.3 | v0.1 experimental | Attendu post-vertical-slice |

### 3.3 Tensions gouvernance roadmap vs audit

La section **0A de MASTER_ROADMAP** (modèle d'ancre étendu, CI byte-identique, purge littéraux 234) mélange **contrats fondamentaux** et **livraisons techniques**. L'audit Phase 0A (présent document) isole la couche **normative**. Les livrables techniques restent valides mais relèvent de **contrats F11 (Build & CI)** et **F3 (Identité & ancres)** à rédiger — pas de nouvelles fonctionnalités au-delà de ce qui est déjà annoncé.

---

## 4. Cartographie des contrats

```
                         ┌─────────────────────────────────────┐
                         │           PROJET LOU                │
                         │  Gouvernance (F1) · LLM (F9)        │
                         └─────────────────┬───────────────────┘
                                           │
              ┌────────────────────────────┼────────────────────────────┐
              │                            │                            │
              ▼                            ▼                            ▼
     ┌────────────────┐         ┌─────────────────┐         ┌──────────────────┐
     │  ACQUISITION   │         │  CHAPTER PACKAGE │         │    LECTEUR       │
     │  F4 (gelé)     │         │  F5–F6           │         │    F8            │
     └───────┬────────┘         └────────┬─────────┘         └────────▲─────────┘
             │                           │                            │
             │                           │                            │
 PDF ──► Tool 01 ──► official-college.md │                            │
             │                           │                            │
             └──► Tool 02 ──► item-*.md ─┼──► source.meta.yaml       │
                                         │                            │
                                         ▼                            │
                              inventory.yaml (C.2)                    │
                              [réconciliation → build/reconciliation] │
                                         │                            │
                                         ▼                            │
                              blueprint.md (C.3)                      │
                                         │                            │
                         ┌───────────────┴───────────────┐            │
                         ▼                               ▼            │
              projections.yaml + *.md (C.4)      visualSpec (F7)      │
              claim-trace / grounding            figures/*.svg        │
                         │                               │            │
                         └───────────────┬───────────────┘            │
                                         ▼                            │
                              lou-build validate/build (F11)          │
                                         │                            │
                                         ▼                            │
                              manifest.json + traceability (C.6) ─────┘
                                         │
                                         ▼
                              Renderer (C.7) + learner layer (C.8–C.9)
```

### Détail par étape

| Étape | Contrat existant | Propriétaire | Dépend de | Garanties |
|---|---|---|---|---|
| **PDF officiel** | ADR-004 R1, Tool 01 input | Éditeur EDN | — | Immuable, hashé |
| **Markdown source** | Tool 01 CONTRACT | Tool 01 | PDF | Byte-déterministe, provenance |
| **Chapitres Tool 02** | Tool 02 CONTRACT | Tool 02 | MD source | Round-trip, slices exactes |
| **source.meta.yaml** | C.1, ADR-004 section_path | Package chapter | FIL B chapter | Index sections, pointer source |
| **Inventory** | C.2, A.1, A.3 | Pipeline sémantique (bootstrap manuel) | Source + reconciliation | KP uniques, dispositions, ancres |
| **Reconciliation** | A.1, `reconcile.js` | Pass indépendant (bootstrap) | Source + Inventory | Segments dispositionnés ; `missed` bloque |
| **Blueprint** | C.3, A.3 | Pipeline sémantique | Inventory | Sequence, elements, uses_kp |
| **Projections** | C.4, Part B | Générateur + checker | Blueprint | Claim classes, claim-trace 1:1 |
| **visualSpec / figures** | VISUAL_GRAMMAR, C.4/C.6 | lou-build visual pipeline | Blueprint intent | I1–I12 (partiel) ; withhold OK |
| **Grounding** | A.1, Part B | lou-build | Projections + Inventory | Threshold déterministe ; bridging bootstrap |
| **Manifest** | C.6 | lou-build `package.js` | Tous | Registry, trace_index, visual states |
| **Renderer** | C.7, ADR-002 | `demo/renderer/` | Manifest only | Immutabilité ; pas de PDF |
| **Lecteur multi-chapitres** | Roadmap Phase 1 `library.json` | Non spécifié | Manifests | **Contrat manquant** |

---

## 5. Contrats manquants (trous réels, implicites aujourd'hui)

Seuls les manques **indispensables** à la stabilité multi-années sont listés. Aucune nouvelle fonctionnalité proposée.

| # | Contrat manquant | Justification | Où implicite aujourd'hui |
|---|---|---|---|
| **M-01** | **Schéma normatif du chapter package** (champs obligatoires, cardinalités, modes slice/full) | ADR-004 liste les fichiers ; enforcement éparpillé dans `lou-build` sans document unique | ADR-004 §2, README lou-build, REFERENCE §2 |
| **M-02** | **Schéma normatif du manifest.json** | Renderer et build divergeront sans spec stable | IMPLEMENTATION C.6, instances 234/330 |
| **M-03** | **Format normatif claim-trace** (YAML dans commentaire HTML, locators) | Gate critique ; format only in code | `claims.js`, projections 234/330 |
| **M-04** | **Schéma reconciliation.yaml** | Bootstrap until Tool 03 ; doit être contractuel | `reconcile.js`, instances |
| **M-05** | **Schéma grounding.yaml** | Publication gate ; allowlist rules mixed in code | `ground.js`, chapter.package.yaml |
| **M-06** | **Contrat Build & Reproductibilité (CI)** | Roadmap 0A exige `build` reproductible ; pas de doc normative | MASTER_ROADMAP §4, §0A, PROJECT_STATE risques |
| **M-07** | **Contrat Identité & Ancres consolidé** | Part D existe mais mélange avec exemples ; extension 0A non actée | IMPLEMENTATION Part D, roadmap 0A |
| **M-08** | **Contrat frontière Renderer** (entrées interdites, états visual, dégradation) | Dispersé C.7 + 6 docs renderer | IMPLEMENTATION, ADR-002, renderer/02 |
| **M-09** | **Contrat Tools 03–05** (interfaces aval) | PIPELINE.md planifie sans CONTRACT.md | PIPELINE.md § Tool 03–05 |
| **M-10** | **Contrat Lecteur / library.json** | Phase 1 exige multi-chapitres ; spec absente | MASTER_ROADMAP Phase 1 historique |
| **M-11** | **Index de suprématie documentaire** | Hiérarchie annoncée mais non centralisée | En-têtes multiples |
| **M-12** | **Contrat édition / lifecycle (A.2 opérationnel)** | Spécifié conceptuellement, zero implémentation | IMPLEMENTATION A.2 |

**Non manques** (déjà suffisamment couverts — ne pas réécrire) : philosophie SSOT, trust model A.1, séparation 4 layers visuels, Tool 01/02, gel acquisition ADR-004.

---

## 6. Proposition d'organisation documentaire

Objectif : **peu de documents**, normatifs, maintenables, sans duplication.

### Structure proposée (6 contrats + 1 index)

```
docs/contracts/
├── 00-INDEX.md                    # Suprématie, maturité, renvois — NON normatif sauf hiérarchie
├── 01-TRUST-AND-FIDELITY.md       # A.1, claim classes, reconciliation, grounding, fallback, canal humain
├── 02-IDENTITY-AND-ANCHORS.md     # Part B/D, IDs, ancres (quote + extensions actées en 0A)
├── 03-ACQUISITION-SSOT.md         # Index vers ADR-003/004, SOURCE_OF_TRUTH, Tool 01/02, P1–P7
├── 04-CHAPTER-PACKAGE.md          # C.2–C.6, schémas YAML/MD/JSON, modes slice/full-chapter
├── 05-VISUAL-GRAMMAR.md           # Index + amendements ; corps = VISUAL_GRAMMAR_CONTRACT (déplacé ou lié)
└── 06-RENDERER-AND-LEARNER-LAYER.md  # C.7–C.9, ADR-002, immutabilité, data model, non-goals
```

**Documents existants conservés tels quels (références, pas duplication) :**

| Document | Rôle après réorganisation |
|---|---|
| `IMPLEMENTATION_CONTRACT.md` | **Archive ratifiée** ou source fusionnée dans 01–04 — décision 0A |
| ADR-001 à ADR-004 | **Actes de gouvernance** immuables ; contrats 03/05/06 renvoient |
| Tool `CONTRACT.md` | **Contrats composants acquisition** ; inclus par renvoi dans 03 |
| `VISUAL_GRAMMAR_CONTRACT.md` | Corps de 05 ou document sibling avec statut identique |
| `docs/renderer/*` | **Guide produit/tech** ; 06 en extrait les obligations normatives |
| `REFERENCE_IMPLEMENTATION_DESIGN.md` | **Exemple de sérialisation** ; subordonné à 04 |
| Rapports `docs/acquisition/*` | **Preuves qualification** ; non normatifs |
| `MASTER_ROADMAP.md` | **Pilotage** ; ne duplique pas les contrats |
| `PROJECT_STATE.md` | **État** ; non normatif |

**Principe anti-duplication :** chaque règle vit **une fois** ; les autres documents utilisent des liens du type « voir Contract-04 §3.2 ».

---

## 7. Priorisation

### Niveau 1 — Fondations absolues

*Sans ces contrats, les phases 1–6 n'ont pas de socle stable.*

| ID | Contrat | Justification |
|---|---|---|
| **01** | Trust & Fidelity (A.1, classes, reconciliation, grounding, fallback) | Définit **pourquoi** le projet est sûr sans médecin relecteur — cœur du produit |
| **02** | Identity & Anchors | KP IDs **irréversibles** ; ancres = lien Collège ; erreur = dette permanente |
| **03** | Acquisition SSOT (index ADR-003/004 + Tools + P1–P7) | **Entrée gelée** ; toute l'aval en dépend |
| **04** | Chapter Package (Inventory, Blueprint, projections, manifest, build gates) | **Unité de production** industrialisée ; lou-build en est l'embryon |

### Niveau 2 — Fortement recommandés

*Stabilisent l'industrialisation et le lecteur ; peuvent être rédigés juste après le niveau 1.*

| ID | Contrat | Justification |
|---|---|---|
| **05** | Visual Grammar (invariants + catalogue + visualSpec lifecycle) | Visuels = zone à forte dérive ; ADR-001 et VISUAL_GRAMMAR déjà matures |
| **06** | Renderer & Learner Layer | Surface apprenant ; immutabilité et boundary C.8/C.9/annotations |
| **11** | Build & CI / Reproductibilité | Roadmap 0A et risque « SVG non byte-identique » ; gate confiance industrialisation |
| **09** | Tools 03–05 interfaces (stubs contractuels) | Industrialisation sémantique ; évite nouvelle dette bootstrap |

### Niveau 3 — Documentation utile, non normative seule

| Document | Justification |
|---|---|
| `REFERENCE_IMPLEMENTATION_DESIGN.md` | Exemple ; chemins divergent du repo |
| `docs/renderer/01-VISION`, `03-HISTORICAL`, migration plans | Contexte et historique |
| Rapports qualification Phase P, 0B, migration 234 | Preuves audit |
| `docs/acquisition/industrialization-plan.md` | Plan opérationnel Phase 1 |
| `ARCHITECTURE_AUDIT.md`, `FINAL_ARCHITECTURE.md` | Baseline historique ; supplantés par IMPLEMENTATION |
| Validators `234/build/validate-*.mjs` | Outils audit chapitre, pas loi projet |
| `LLM_STRATEGY.md` | Stratégie évolutive ; renvoie depuis 01 ou 09 |

---

## 8. Plan recommandé pour rédiger les contrats (Phase 0A suite)

Ce plan **ne rédige pas** les contrats ; il séquence le travail humain/decisionnel restant.

### Étape 0 — Clôture de cet audit

- [ ] Valider la liste des 12 familles et des manques M-01–M-12
- [ ] Trancher **C-02** : gel quote-only vs extension ancres (table-cell, figure) — décision de gouvernance 0A
- [ ] Trancher **C-03** : intégrer annotations texte (ADR-002) dans contrat apprenant ou ADR amendement
- [ ] Clarifier statut **IMPLEMENTATION_CONTRACT.md** post-consolidation (fusion vs archive vs index)

### Étape 1 — Niveau 1 (semaines 1–2)

1. Rédiger **01-TRUST-AND-FIDELITY** — extraire IMPLEMENTATION A.1, Part B (claim), canal humain roadmap
2. Rédiger **02-IDENTITY-AND-ANCHORS** — Part D + décision extension ancres + aligner Part E sur FIL B
3. Rédiger **03-ACQUISITION-SSOT** — index normatif ; **ne pas recopier** ADR-004
4. Rédiger **04-CHAPTER-PACKAGE** — formaliser schémas depuis `lou-build` + instances 234/330 ; documenter écarts E-01/E-02 comme « non encore enforced »

### Étape 2 — Niveau 2 (semaines 3–4)

5. Rédiger **05-VISUAL-GRAMMAR** — consolider VISUAL_GRAMMAR + ADR-001 ; statut visualSpec v0.1 ; plan retrait V1 `svg.js`
6. Rédiger **06-RENDERER-AND-LEARNER-LAYER** — obligations C.7–C.9 + ADR-002 + états manifest visual
7. Rédiger **contrat Build & CI** (section dans 04 ou doc 07) — critères reproductibilité roadmap 0A
8. Esquisser **Tool 03–05 CONTRACT stubs** — inputs/outputs/guarantees vides mais structurés

### Étape 3 — Alignement (semaine 5)

- Mettre à jour **IMPLEMENTATION_CONTRACT** ou le marquer **superseded by contracts/**
- Corriger **références FIL A** résiduelles (C-01) — documentation only
- Publier **00-INDEX.md** avec matrice suprématie :

```
Priorité conflit : ADR (gouvernance) > Contrats 01–06 > IMPLEMENTATION (legacy) > REFERENCE > Rapports
Acquisition : ADR-004 > Tool CONTRACT > SOURCE_OF_TRUTH
Visuel : VISUAL_GRAMMAR > ADR-001 > VISUAL_GRAMMAR_LIBRARY
Renderer : Contrat 06 > docs/renderer product spec > demo code
```

### Étape 4 — Critères de sortie Phase 0A (contrats)

Alignés sur MASTER_ROADMAP §0A, reformulés en termes contractuels :

| Critère | Mesure |
|---|---|
| Modèle d'ancre acté | Document 02 publié ; exemples 234 + 330 + type contrasté |
| Schéma package acté | Document 04 ; validate/build mappés clause par clause |
| Suprématie documentaire | Index 00 sans contradiction C-01–C-06 non résolue |
| CI contractuelle | Document Build : hash artefacts textuels ; policy withheld visual |
| Gel annoncé | Tag ou ADR-005 « Fundamental Contracts Frozen » — **hors scope audit** |

---

## 9. Synthèse pour décision

| Question | Réponse |
|---|---|
| **Quels contrats existent déjà ?** | ~45 règles normatives, dominées par IMPLEMENTATION_CONTRACT, ADR-003/004, VISUAL_GRAMMAR, Tool 01/02, lou-build |
| **Lesquels sont fondamentaux ?** | F2 Trust, F3 Identité, F4 Acquisition, F5 Chapter package, F7 Visual invariants, F8 Renderer boundary |
| **Lesquels sont redondants ?** | SSOT, traçabilité, deux curated, immutabilité — 3–6 copies each |
| **Lesquels sont implicites ?** | Schémas manifest/claim/reconciliation/grounding, CI, library.json, Tools 03–05 |
| **Quels documents rédiger en 0A ?** | 6 contrats proposés + index ; pas de nouveau concept |
| **Développement requis par cet audit ?** | **Aucun** |

---

## 10. Documents examinés

| Zone | Fichiers principaux |
|---|---|
| ADR | `docs/adr/ADR-001` … `ADR-004` |
| Gouvernance | `docs/MASTER_ROADMAP.md`, `docs/PROJECT_STATE.md`, `docs/SOURCE_OF_TRUTH.md`, `docs/SOURCE_PIPELINE_QUALIFICATION.md`, `docs/LLM_STRATEGY.md` |
| Contrats racine | `IMPLEMENTATION_CONTRACT.md`, `FINAL_ARCHITECTURE.md`, `REFERENCE_IMPLEMENTATION_DESIGN.md`, `VISUAL_GRAMMAR_CONTRACT.md` |
| Acquisition | `01-learning/tools/PIPELINE.md`, Tool 01/02 `CONTRACT.md`, `docs/acquisition/*`, `docs/releases/acquisition-rd-complete.md` |
| Build | `tools/lou-build/**`, tests `test/*.test.js` |
| Chapitres | `01-learning/chapters/cardio/234/**`, `330/**` |
| Renderer | `docs/renderer/**`, `docs/adr/ADR-002-renderer-v2-architecture.md`, `demo/renderer/` |
| Qualification | `benchmark/corpus/README.md`, rapports Phase P / 0B / final |

---

*Fin du rapport Phase 0A — Audit des Contrats Fondamentaux.*
