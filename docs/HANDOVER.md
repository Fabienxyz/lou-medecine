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
| **HEAD** | `docs(governance): publish local search (PDR-D6)` — lot D6 publié sur `origin/main` |
| **Remote** | `origin/main` — aligné avec HEAD (après push D6-G) |
| **Tags de référence** | `local-search-v1` (D6) · `offline-certification-v1` (D2) · `reader-composition-v1` (Composition) |

**Commits Reader Acceptance récents :**

| Commit | Message |
|---|---|
| *(HEAD D6-G)* | `docs(governance): publish local search (PDR-D6)` |
| `47d7bb7` | `feat(renderer): implement session resume (PDR-D4)` (D4) |
| `c6821dc` | `feat(renderer): implement learner patrimony snapshot import` (E-D) |

**Working tree (hors commit D6-G) :** implémentation Reader D6 (code + tests + rapports `demo/renderer/docs/learner-local-search-d6-*`) **non commitée** — commit code distinct recommandé avant toute nouvelle évolution Reader.

**Fichiers non suivis hors périmètre** (ne pas committer sans instruction) :

- `_Roadmap Opus - 27 Juillet 2026.docx`

---

## 2. État actuel

> Synthèse de [`PROJECT_STATE.md`](PROJECT_STATE.md). Pour les valeurs à jour, **toujours** lire PROJECT_STATE.

| | |
|---|---|
| **Phase** | Execution Mode V1 — livraison roadmap V1 en cours |
| **Dernier jalon publié** | **D6** — recherche textuelle locale Reader (gouvernance + tag `local-search-v1`) |
| **Objectif actif** | **Reader Acceptance V1** — critères PDR-B1/B5/D/E sur package 234 complet |
| **Lot actif** | **D7** — préférences d'affichage de base ([PDR-D7](governance/PRODUCT-DECISION-REGISTRY.md)) |
| **Instance courante** | Package 234 Release `complete` ; Composition V1 ; D1 ; D2 ; D4 ; D6 ; patrimoine E-A…E-D ; **acceptation Reader non prononcée** |

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

**Validations D6 (locale, D6-F) :** 493/493 tests unitaires renderer PASS · 19/19 smoke Local Search PASS · 15/15 validation Node D6-F PASS.

---

## 3. Chemin critique

**Prochain jalon :** **Reader Acceptance V1**

**Étape immédiate :** **Lot D7** — préférences d'affichage ([PDR-D7](governance/PRODUCT-DECISION-REGISTRY.md)).

**Critères restants hors D7 :** Amorçage (1 vue `planned`), prononcé d'acceptation Reader.

**Action recommandée avant D7 :** committer l'implémentation D6 sur `main` (code + tests) pour aligner origin avec l'état livré D6-F.

**Points d'entrée code Local Search (D6, working tree local) :**

- `demo/renderer/local-search-service.js` — index, match, snippets (D6-C)
- `demo/renderer/library/local-search-runtime.js` — Runtime, cache (D6-D)
- `demo/renderer/local-search-ui.js` — panneau recherche (D6-E)
- `demo/renderer/search-navigation.js` — SearchHit → DOM (D6-E)
- `demo/renderer/app.js` — câblage mode produit
- Rapports : [`demo/renderer/docs/learner-local-search-d6-f-validation-report.md`](../demo/renderer/docs/learner-local-search-d6-f-validation-report.md)

---

## 4. Architecture stabilisée

Chaîne recherche locale (D6) :

```
Package Access (Release ouverte)
        ↓
Local Search Service — index déterministe
        ↓
Local Search Runtime — cache IDB lou-local-search-v1
        ↓
LouLocalSearchUI — panneau, requête, résultats
        ↓
LouSearchNavigation — showTab + scroll + surbrillance éphémère
```

**Décisions figées D6 :**

- Recherche limitée à la Release **ouverte** — pas de recherche globale bibliothèque
- Index et cache = données dérivées — purge à changement Release / digest stale
- Aucune persistance patrimoine ni session pour l'état recherche
- Offline : index reconstruit si cache absent ; navigation SearchHit fonctionnelle

Contrat faisant autorité : [`LOCAL-SEARCH-COMPONENT-CONTRACT.md`](contracts/components/LOCAL-SEARCH-COMPONENT-CONTRACT.md).

---

## 5. Contrats faisant autorité

| Document | Rôle |
|---|---|
| [`LOCAL-SEARCH-COMPONENT-CONTRACT.md`](contracts/components/LOCAL-SEARCH-COMPONENT-CONTRACT.md) | Recherche locale — périmètre Release, index, navigation |
| [`LEARNER-PATRIMONY-COMPONENT-CONTRACT.md`](contracts/components/LEARNER-PATRIMONY-COMPONENT-CONTRACT.md) | Patrimoine — persistance §7, export §8, import §9 |
| [`OFFLINE-COMPONENT-CONTRACT.md`](contracts/components/OFFLINE-COMPONENT-CONTRACT.md) | Offline — indépendance index recherche |
| [`LIBRARY-CATALOG-CONTRACT.md`](contracts/components/LIBRARY-CATALOG-CONTRACT.md) | Identité Release catalogue |
| [PDR-D6](governance/PRODUCT-DECISION-REGISTRY.md) | Recherche locale — critère Acceptation Reader V1 |

---

## 6. État exact du Reader V1

| Domaine | État |
|---|---|
| **Composition V1** | Publiée |
| **Bibliothèque (D1)** | Livré |
| **Offline (D2)** | Publié |
| **Patrimoine E-A…E-D** | Publié |
| **Reprise session (D4)** | Publié |
| **Recherche locale (D6)** | **Publié (gouvernance)** — implémentation validée localement ; **commit code en attente** |
| **Préférences (D7)** | Non implémenté — **lot actif** |
| **Critères d'acceptation** | **Non prononcés** |

**Tests renderer (D6-F, local) :** 493 PASS unit · 90 PASS smoke (71 + 19 LS-F) · 19 PASS Playwright Local Search.

---

## 7. Chantiers recommandés

1. **Commit code D6** — aligner `origin/main` avec implémentation livrée (hors périmètre D6-G)
2. **D7 — Préférences d'affichage** (lot actif)
3. **Amorçage** (vue `planned`)
4. **Reader Acceptance V1** (cadre global)

---

## 8. Reprendre le projet

Lorsque le propriétaire dit *« On reprend le lot en cours »* :

1. Lire ce HANDOVER.
2. Lire [`PROJECT_STATE.md`](PROJECT_STATE.md).
3. Lot actif : **D7 — préférences d'affichage**.
4. Lots D4, D6 (gouvernance) et patrimoine E-A…E-D **clôturés**.

---

*Handover — 2026-08-01 — D6 publié ; lot D7 ouvert. Non normatif.*
