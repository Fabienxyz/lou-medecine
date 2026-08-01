# Lou Médecine — Handover agent IA

| | |
|---|---|
| **Type** | Point d'entrée opérationnel — **informatif** |
| **Statut** | Document d'accueil — 2026-08-01 |
| **Autorité** | **Aucune** — vue synthétique uniquement |
| **En cas de conflit** | [`MASTER_ROADMAP.md`](MASTER_ROADMAP.md), [`PROJECT_STATE.md`](PROJECT_STATE.md), [`governance/EXECUTION_MODE_V1.md`](governance/EXECUTION_MODE_V1.md), ADR et contrats font foi |

Ce document permet à un agent IA de reprendre le projet **immédiatement** après une interruption. Il **ne crée aucune règle** et **ne remplace aucun document normatif**.

**Tenue à jour :** lorsque les sections 2 à 5 ne reflètent plus [`PROJECT_STATE.md`](PROJECT_STATE.md), mettre à jour HANDOVER **en même temps** que PROJECT_STATE.

---

## 1. Photographie Git

| | |
|---|---|
| **Branche** | `main` |
| **HEAD** | `feat(renderer): implement session resume (PDR-D4)` — lot D4 publié sur `origin/main` |
| **Remote** | `origin/main` — aligné avec HEAD |
| **Tags de référence** | `offline-certification-v1` (D2) · `reader-composition-v1` (Composition) · pas de tag D4 |

**Commits Reader Acceptance récents :**

| Commit | Message |
|---|---|
| `c6821dc` | `feat(renderer): implement learner patrimony snapshot import` (E-D) |
| *(HEAD)* | `feat(renderer): implement session resume (PDR-D4)` (D4) |

**Fichiers non suivis hors périmètre** (ne pas committer sans instruction) :

- `_Roadmap Opus - 27 Juillet 2026.docx`
- `demo/renderer/test/fixtures/product-library/`
- `demo/renderer/docs/learner-session-d4-technical-design.md` (spécification V4 — référence locale, non modifiée)

---

## 2. État actuel

> Synthèse de [`PROJECT_STATE.md`](PROJECT_STATE.md). Pour les valeurs à jour, **toujours** lire PROJECT_STATE.

| | |
|---|---|
| **Phase** | Execution Mode V1 — livraison roadmap V1 en cours |
| **Dernier jalon publié** | **D4** — reprise de session Reader sur `origin/main` |
| **Objectif actif** | **Reader Acceptance V1** — critères PDR-B1/B5/D/E sur package 234 complet |
| **Lot actif** | **D6** — recherche textuelle locale ([PDR-D6](governance/PRODUCT-DECISION-REGISTRY.md)) |
| **Instance courante** | Package 234 Release `complete` ; Composition V1 ; D1 ; D2 ; D4 ; patrimoine E-A…E-D ; **acceptation Reader non prononcée** |

**Acquis majeurs (publiés) :**

- Gouvernance et contrats fondamentaux 01–09
- Pipeline validateur lou-build (tag `lou-build-pipeline-v1`)
- Architecture éditoriale V1 (tag `editorial-architecture-v1`)
- Reader Composition V1 (tag `reader-composition-v1`)
- Package 234 Release `complete`
- PDR-D1 — bibliothèque installable
- PDR-D2 — offline intégral (tag `offline-certification-v1`)
- Patrimoine E-A…E-D — contrat, persistance, export, import
- **PDR-D4** — reprise de session (ResumePlan, Session Service, store `session_resume`)

**Validations D4 :** 396/396 tests unitaires PASS · 71/71 smoke PASS (dont 10 OF-D2-*).

---

## 3. Chemin critique

**Prochain jalon :** **Reader Acceptance V1**

**Étape immédiate :** **Lot D6** — recherche textuelle locale au chapitre ouvert ([PDR-D6](governance/PRODUCT-DECISION-REGISTRY.md)).

**Critères restants hors D6 :** Amorçage (1 vue `planned`), préférences D7 si requis avant acceptation.

**Points d'entrée code session D4 :**

- `demo/renderer/session-service.js` — `buildResumePlan`, pureté Service
- `demo/renderer/session-resume.js` — persistance `session_resume`, `applyResumePlan`
- `demo/renderer/library/restore-catalog-facts.js` — faits catalogue RestoreContext
- `demo/renderer/app.js` — boot produit, Commit Events CE-02…CE-05, ordre IA-10
- `demo/renderer/learner-store.js` — IndexedDB v7, store `session_resume`
- Rapport : [`learner-session-d4-implementation-report.md`](../demo/renderer/docs/learner-session-d4-implementation-report.md)

---

## 4. Architecture stabilisée

Chaîne reprise de session (D4 publié) :

```
Boot produit → RestoreContext (catalog facts + release_id)
        ↓
Session Service.buildResumePlan → ResumePlan (gelé)
        ↓
Reader.applyResumePlan → showTab → applyResumePoint → flush overlays
        ↕
LouLearnerStore.session_resume (IndexedDB v7)
        ↕
Patrimoine E-B (highlights, notes, SVG — inchangé)
```

**Décisions figées D4 :**

- Session Service sans DOM / IndexedDB / horloge — Reader seul persiste
- Reader exécuteur strict — plan incomplet ou vue absente → erreur explicite
- Ordre IA-10 : vue → ancre → overlays (`deferLearnerLayers`)
- Shell offline inclut tous les imports statiques de `product-bootstrap.mjs`

---

## 5. Contrats faisant autorité

| Document | Rôle |
|---|---|
| [`LEARNER-PATRIMONY-COMPONENT-CONTRACT.md`](contracts/components/LEARNER-PATRIMONY-COMPONENT-CONTRACT.md) | Patrimoine — persistance §7, export §8, import §9 |
| [ADR-006](adr/ADR-006-pedagogical-patrimony-and-edition-lineage.md) | Trois patrimoines ; ancrage Release |
| [`LIBRARY-CATALOG-CONTRACT.md`](contracts/components/LIBRARY-CATALOG-CONTRACT.md) | Identité Release catalogue |
| [`OFFLINE-COMPONENT-CONTRACT.md`](contracts/components/OFFLINE-COMPONENT-CONTRACT.md) | Indépendance patrimoine / offline |
| [PDR-D4](governance/PRODUCT-DECISION-REGISTRY.md) | Reprise de session — critère Acceptation Reader V1 |

---

## 6. État exact du Reader V1

| Domaine | État |
|---|---|
| **Composition V1** | Publiée |
| **Bibliothèque (D1)** | Livré |
| **Offline (D2)** | Publié |
| **Patrimoine E-A…E-D** | Publié |
| **Reprise session (D4)** | **Publié** — ResumePlan · Session Service · session_resume |
| **Recherche locale (D6)** | Non implémenté — **lot actif** |
| **Critères d'acceptation** | **Non prononcés** |

**Tests renderer :** 396 PASS unit · 71 PASS smoke (`demo/renderer/`).

---

## 7. Chantiers recommandés

1. **D6 — Recherche textuelle locale** (lot actif)
2. **Reader Acceptance V1** (cadre global)
3. Amorçage (vue `planned`) · D7 préférences (selon roadmap)

---

## 8. Reprendre le projet

Lorsque le propriétaire dit *« On reprend le lot en cours »* :

1. Lire ce HANDOVER.
2. Lire [`PROJECT_STATE.md`](PROJECT_STATE.md).
3. Lot actif : **D6 — recherche textuelle locale**.
4. Lots D4 et patrimoine E-A…E-D **clôturés**.

---

*Handover — 2026-08-01 — D4 publié ; lot D6 ouvert. Non normatif.*
