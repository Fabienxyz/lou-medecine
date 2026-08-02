# Lou Médecine — Handover agent IA

| | |
|---|---|
| **Type** | Point d'entrée opérationnel — **informatif** |
| **Statut** | Document d'accueil — 2026-08-02 (Vague A gouvernance) |
| **Autorité** | **Aucune** — vue synthétique uniquement |
| **En cas de conflit** | [`MASTER_ROADMAP.md`](MASTER_ROADMAP.md), [`PROJECT_STATE.md`](PROJECT_STATE.md), [`governance/EXECUTION_MODE_V1.md`](governance/EXECUTION_MODE_V1.md), ADR et contrats font foi |

Ce document permet à un agent IA de reprendre le projet **immédiatement** après une interruption. Il **ne crée aucune règle** et **ne remplace aucun document normatif**.

**Tenue à jour :** lorsque les sections 2 à 5 ne reflètent plus [`PROJECT_STATE.md`](PROJECT_STATE.md), mettre à jour HANDOVER **en même temps** que PROJECT_STATE.

---

## 1. Photographie Git

| | |
|---|---|
| **Branche** | `main` |
| **HEAD** | `923f638063dce40ff3d8256f34a29d08fea808df` — Vague A gouvernance (Validation Corpus V1) |
| **Gouvernance RA V1** | `27aa870` — prononcé Reader Acceptance V1 ; tag `reader-acceptance-v1` |
| **Gouvernance Corpus V1** | `923f638` — séquence Validation Corpus V1 propagée ([PDR-C8](governance/PRODUCT-DECISION-REGISTRY.md)) |
| **Remote** | `origin/main` — aligné sur HEAD |
| **Tags de référence** | `reader-acceptance-v1` (RA V1) · `display-preferences-v1` (D7) · `local-search-v1` (D6) · `offline-certification-v1` (D2) · `reader-composition-v1` (Composition) |

**Exclusions volontaires :** `_Roadmap Opus - 27 Juillet 2026.docx` · `demo/renderer/docs/learner-session-d4-technical-design.md`

---

## 2. État actuel

> Synthèse de [`PROJECT_STATE.md`](PROJECT_STATE.md). Pour les valeurs à jour, **toujours** lire PROJECT_STATE.

| | |
|---|---|
| **Phase** | Execution Mode V1 — Reader Acceptance V1 **clôturé** |
| **Dernier jalon publié** | **Reader Acceptance V1** — prononcé 2026-08-02 |
| **Objectif actif** | **Validation Corpus V1 (Fabrique)** — qualification archétypes 234 · 224 · 230 ([PDR-C8](governance/PRODUCT-DECISION-REGISTRY.md)) |
| **Chantier actif** | **Validation Corpus V1 (Fabrique)** — production 224 **non démarrée** |
| **Instance courante** | Package 234 Release `complete` (référence archétype A) ; Reader V1 accepté ; 7 vues alimentées ; D1 · D2 · D4 · D6 · D7 · patrimoine E-A…E-D · AP-A…AP-F |

**Acquis majeurs (publiés) :**

- Gouvernance et contrats fondamentaux 01–09
- Pipeline validateur lou-build (tag `lou-build-pipeline-v1`)
- Architecture éditoriale V1 (tag `editorial-architecture-v1`)
- Reader Composition V1 (tag `reader-composition-v1`)
- Package 234 Release `complete`
- PDR-D1 — bibliothèque installable
- PDR-D2 — offline intégral (tag `offline-certification-v1`)
- Patrimoine E-A…E-D — contrat, persistance, export, import
- PDR-D4 — reprise de session
- PDR-D6 — recherche locale (tag `local-search-v1`)
- PDR-D7 — préférences d'affichage (tag `display-preferences-v1`)
- **Amorçage cognitif** — AP-A…AP-F (contrat AP-A, implémentation AP-C…AP-F)
- **Reader Acceptance V1** — prononcé (tag `reader-acceptance-v1`)

**Validations de référence :** 632/632 tests unitaires renderer PASS · 122/122 smoke PASS (CI — Fixture 234 run [#22](https://github.com/Fabienxyz/lou-medecine/actions/runs/30732680037)) · 14/14 smoke AP-F PASS.

---

## 3. Chemin critique

**Séquence officielle** ([PDR-C8](governance/PRODUCT-DECISION-REGISTRY.md)) :

```
Reader Acceptance V1 ✅
        ↓
Validation Corpus V1 (Fabrique)  ← prochain jalon
        ↓
Validation pédagogique Lou
        ↓
Décision d'industrialisation
```

**Prochain jalon :** **Validation Corpus V1 (Fabrique)**

**Étape immédiate :** qualification Fabrique — ordre officiel 234 (référence capitalisée) → 224 → 230. **Production Item 224 non démarrée.**

**Références :** [PDR-C8](governance/PRODUCT-DECISION-REGISTRY.md) · [`acquisition/industrialization-plan.md`](acquisition/industrialization-plan.md) § Phase A.0

---

## 4. Architecture stabilisée

Chaîne Reader V1 (acceptée) — **modèle produit :** [`renderer/00-READER-V1-PRODUCT-MODEL.md`](renderer/00-READER-V1-PRODUCT-MODEL.md) (7 vues ; projections = production uniquement).

```
Library Catalog (D1) → Package Access → Browser Offline Manager (D2)
        ↓
Composition V1 → Reading View Model → Renderer (7 vues, dont Amorçage)
        ↓
Session Resume (D4) · Local Search (D6) · Display Preferences (D7)
        ↓
Learner Patrimony (E-A…E-D)
```

**Décisions figées Reader Acceptance :**

- 7 vues alimentées sur package 234 — PDR-B5 satisfait
- Amorçage via artefact `build/cognitive-priming.v1.json` — manifest-only
- Navigation EDN inter-chapitres avec `view=cognitive-priming` explicite (AP-EF)
- Local Search indexe champs texte Amorçage publié — C-CP-09
- Offline shell inclut `cognitive-priming-render.js` — AP-F-11

Rapport faisant autorité : [`releases/reader-acceptance-v1-publication.md`](releases/reader-acceptance-v1-publication.md).

---

## 5. Contrats faisant autorité

| Document | Rôle |
|---|---|
| [`COGNITIVE-PRIMING-COMPONENT-CONTRACT.md`](contracts/components/COGNITIVE-PRIMING-COMPONENT-CONTRACT.md) | Amorçage — statut Proposé (AP-A) ; promotion En vigueur = AP-G |
| [`DISPLAY-PREFERENCES-COMPONENT-CONTRACT.md`](contracts/components/DISPLAY-PREFERENCES-COMPONENT-CONTRACT.md) | Préférences d'affichage — En vigueur |
| [`LOCAL-SEARCH-COMPONENT-CONTRACT.md`](contracts/components/LOCAL-SEARCH-COMPONENT-CONTRACT.md) | Recherche locale — En vigueur |
| [`LEARNER-PATRIMONY-COMPONENT-CONTRACT.md`](contracts/components/LEARNER-PATRIMONY-COMPONENT-CONTRACT.md) | Patrimoine — En vigueur |
| [`OFFLINE-COMPONENT-CONTRACT.md`](contracts/components/OFFLINE-COMPONENT-CONTRACT.md) | Offline — En vigueur |
| [`LIBRARY-CATALOG-CONTRACT.md`](contracts/components/LIBRARY-CATALOG-CONTRACT.md) | Identité Release catalogue |

---

## 6. État exact du Reader V1

| Domaine | État |
|---|---|
| **Composition V1** | Publiée |
| **Bibliothèque (D1)** | Livré |
| **Offline (D2)** | Publié |
| **Patrimoine E-A…E-D** | Publié |
| **Reprise session (D4)** | Publié |
| **Recherche locale (D6)** | Publié |
| **Préférences (D7)** | Publié |
| **Amorçage cognitif (AP-A…AP-F)** | Publié — package 234 |
| **Critères d'acceptation** | **Prononcés** — 2026-08-02 |

**Tests renderer (référence) :** 632 PASS unit · 122 PASS smoke (CI #22) · 14 PASS smoke AP-F.

---

## 7. Chantiers recommandés

1. **Validation Corpus V1 (Fabrique)** — qualification archétypes 234 · 224 · 230 (prochain jalon — production 224 non démarrée)
2. **Validation pédagogique Lou** — en attente ; conditionnée par Validation Corpus V1 ([PDR-B4](governance/PRODUCT-DECISION-REGISTRY.md))
3. **AP-G gouvernance** — promotion contrat Cognitive Priming « En vigueur » (optionnel, post-RA)

---

## 8. Reprendre le projet

Lorsque le propriétaire dit *« On reprend le lot en cours »* :

1. Lire ce HANDOVER.
2. Lire [`PROJECT_STATE.md`](PROJECT_STATE.md).
3. **Mission Reader ou package :** lire [`renderer/00-READER-V1-PRODUCT-MODEL.md`](renderer/00-READER-V1-PRODUCT-MODEL.md) **avant** d'explorer `projections/` ou le manifest.
4. Prochain jalon : **Validation Corpus V1 (Fabrique)** — production 224 non démarrée.
5. Reader Acceptance V1 et lots AP-A…AP-F **clôturés**.
6. Validation pédagogique Lou **en attente** (après Corpus V1).

---

*Handover — 2026-08-02 — Vague A gouvernance ; chemin critique Validation Corpus V1 ; production 224 non démarrée. Non normatif.*
