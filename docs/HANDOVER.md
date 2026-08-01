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
| **HEAD** | *(gouvernance D7 — voir commit `docs(governance): publish display preferences (PDR-D7)`)* |
| **Implémentation D7** | `49dde7a` — `feat(renderer): implement display preferences (PDR-D7)` |
| **Remote** | `origin/main` — publication D7 en cours |
| **Tags de référence** | `display-preferences-v1` (D7) · `local-search-v1` (D6) · `offline-certification-v1` (D2) · `reader-composition-v1` (Composition) |

**Exclusions volontaires :** `_Roadmap Opus - 27 Juillet 2026.docx` · `demo/renderer/docs/learner-session-d4-technical-design.md` (hors périmètre D7).

---

## 2. État actuel

> Synthèse de [`PROJECT_STATE.md`](PROJECT_STATE.md). Pour les valeurs à jour, **toujours** lire PROJECT_STATE.

| | |
|---|---|
| **Phase** | Execution Mode V1 — livraison roadmap V1 en cours |
| **Dernier jalon publié** | **D7** — préférences d'affichage Reader (gouvernance D7-G) |
| **Objectif actif** | **Reader Acceptance V1** — critères PDR-B1/B5/D/E sur package 234 complet |
| **Chantier actif** | **Amorçage cognitif** (1 vue `planned`) + prononcé d'acceptation Reader |
| **Instance courante** | Package 234 Release `complete` ; Composition V1 ; D1 ; D2 ; D4 ; D6 ; D7 ; patrimoine E-A…E-D ; **acceptation Reader non prononcée** |

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
- **PDR-D6** — recherche locale (contrat en vigueur, tag `local-search-v1`)
- **PDR-D7** — préférences d'affichage (contrat en vigueur ; tag `display-preferences-v1` recommandé)

**Validations D7 (locale, D7-F) :** 589/589 tests unitaires renderer PASS · 18/18 smoke Display Preferences PASS · 19/19 validation Node D7-F PASS.

---

## 3. Chemin critique

**Prochain jalon :** **Reader Acceptance V1**

**Étape immédiate :** **Amorçage cognitif** — alimenter la vue `planned` sur package 234.

**Critères restants :** Amorçage + prononcé d'acceptation Reader.

**Action recommandée :** committer l'implémentation D6 puis D7 sur `main` (code + tests) pour aligner origin avec l'état livré D6-F / D7-F.

**Points d'entrée code Display Preferences (D7, working tree local) :**

- `demo/renderer/display-preferences-service.js` — Service pur (D7-C)
- `demo/renderer/display-preferences-runtime.js` — Runtime + patrimoine (D7-D)
- `demo/renderer/display-preferences-apply.js` — callback visuel `data-dp-*` (D7-E)
- `demo/renderer/display-preferences-ui.js` — panneau Reader (D7-E)
- `demo/renderer/app.js` — boot `loadAndApply` avant reprise session
- Rapports : [`demo/renderer/docs/learner-display-preferences-d7-f-validation-report.md`](../demo/renderer/docs/learner-display-preferences-d7-f-validation-report.md)

---

## 4. Architecture stabilisée

Chaîne Display Preferences (D7) :

```
Display Preferences Service (pur)
        ↓
Display Preferences Runtime — store display_preferences (singleton global)
        ↓
LouLearnerStore / Learner Snapshot (export-import domaine)
        ↓
applyDisplayPreferences — attributs data-dp-* sur <html>
        ↓
Reader UI — 3 réglages + reset
```

**Décisions figées D7 :**

- Trois préférences V1 : thème, taille police, largeur lecture
- Singleton global — pas de scope Release / chapitre / vue
- Premier boot sans écriture patrimoniale tant qu'aucune modification utilisateur
- Orthogonalité Session (D4), Local Search (D6), Composition, Offline

Contrat faisant autorité : [`DISPLAY-PREFERENCES-COMPONENT-CONTRACT.md`](contracts/components/DISPLAY-PREFERENCES-COMPONENT-CONTRACT.md).

---

## 5. Contrats faisant autorité

| Document | Rôle |
|---|---|
| [`DISPLAY-PREFERENCES-COMPONENT-CONTRACT.md`](contracts/components/DISPLAY-PREFERENCES-COMPONENT-CONTRACT.md) | Préférences d'affichage — singleton global, Snapshot, boot |
| [`LOCAL-SEARCH-COMPONENT-CONTRACT.md`](contracts/components/LOCAL-SEARCH-COMPONENT-CONTRACT.md) | Recherche locale — périmètre Release, index, navigation |
| [`LEARNER-PATRIMONY-COMPONENT-CONTRACT.md`](contracts/components/LEARNER-PATRIMONY-COMPONENT-CONTRACT.md) | Patrimoine — persistance §7, export §8, import §9 |
| [`OFFLINE-COMPONENT-CONTRACT.md`](contracts/components/OFFLINE-COMPONENT-CONTRACT.md) | Offline — indépendance préférences |
| [`LIBRARY-CATALOG-CONTRACT.md`](contracts/components/LIBRARY-CATALOG-CONTRACT.md) | Identité Release catalogue |
| [PDR-D7](governance/PRODUCT-DECISION-REGISTRY.md) | Préférences d'affichage — critère Acceptation Reader V1 |

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
| **Amorçage cognitif** | Vue `planned` — **chantier actif** |
| **Critères d'acceptation** | **Non prononcés** |

**Tests renderer (D7-F, local) :** 589 PASS unit · 108 PASS smoke (71 + 19 LS-F + 18 DP-F) · 19 PASS Node D7-F.

---

## 7. Chantiers recommandés

1. **Amorçage cognitif** — alimenter la vue `planned` (chantier actif)
2. **Reader Acceptance V1** — prononcé d'acceptation (cadre global)

---

## 8. Reprendre le projet

Lorsque le propriétaire dit *« On reprend le lot en cours »* :

1. Lire ce HANDOVER.
2. Lire [`PROJECT_STATE.md`](PROJECT_STATE.md).
3. Chantier actif : **Amorçage cognitif** + acceptation Reader.
4. Lots D4, D6, D7 (gouvernance) et patrimoine E-A…E-D **clôturés**.

---

*Handover — 2026-08-01 — D7 publié ; chantier actif Amorçage. Non normatif.*
