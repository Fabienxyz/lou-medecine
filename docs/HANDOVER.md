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

## 1. Photographie Git (publication PDR-D2)

| | |
|---|---|
| **Branche** | `main` |
| **HEAD** | Voir commit documentaire final ci-dessous (post-publication) |
| **Remote** | `origin/main` — doit être identique à HEAD après publication |
| **Tag de référence** | `offline-certification-v1` — *Offline certification complete — PDR-D2 closed* |
| **Commits locaux non poussés avant publication** | 17 (PDR-D2 intégral + clôture gouvernance D2-I) |

**Commits principaux PDR-D2** (du plus ancien au plus récent, depuis clôture D1) :

| Commit | Message |
|---|---|
| `05c11f4` | `docs(contract): define offline contract` (D2-A) |
| `d4b7537` | `docs(contract): clarify offline availability semantics` |
| `56c0b2f` | `feat(library): add offline state model` (D2-B) |
| `6291658` | `feat(library): implement offline preparation manager` (D2-C) |
| `b19f1a5` | `feat(reader): implement browser package access` (D2-D) |
| `5e92aa9` | `feat(reader): implement release-scoped offline runtime` (D2-E) |
| `918b774` | `feat(library): auto-trigger offline prepare after install` (D2-F) |
| `047ee5e` | `refactor(library): decouple Node offline prepare from certification` (D2-F) |
| `95afec8` | `feat(reader): integrate offline product certification` (D2-G) |
| `df1a7f3` | `feat(reader): implement offline repair lifecycle` (D2-H) |
| `f7aa731` | `docs(contract): clarify offline lifecycle semantics` (D2-H) |
| `766f6a0` | `docs(governance): close PDR-D2 offline implementation` (D2-I) |

**Fichiers non suivis hors périmètre publication** (ne pas committer sans instruction) :

- `_Roadmap Opus - 27 Juillet 2026.docx` — document Word local
- `demo/renderer/test/fixtures/product-library/` — fixture générée locale pour tests offline produit

---

## 2. État actuel

> Synthèse de [`PROJECT_STATE.md`](PROJECT_STATE.md). Pour les valeurs à jour, **toujours** lire PROJECT_STATE.

| | |
|---|---|
| **Phase** | Execution Mode V1 — livraison roadmap V1 en cours |
| **Dernier jalon publié** | **PDR-D2** — mode hors ligne intégral ; tag `offline-certification-v1` |
| **Objectif actif** | **Reader Acceptance V1** — critères PDR-B1/B5/D/E sur package 234 complet |
| **Instance courante** | Package 234 Release `complete` ; Composition V1 publiée ; bibliothèque installable (D1) ; offline certifié (D2) ; **acceptation Reader non prononcée** |

**Acquis majeurs (publiés) :**

- Gouvernance et contrats fondamentaux 01–09
- Pipeline validateur lou-build (tag `lou-build-pipeline-v1`)
- Architecture éditoriale V1 (tag `editorial-architecture-v1`)
- Reader Composition V1 (tag `reader-composition-v1`)
- Package 234 Release `complete` (81 QCM + 3 scénarios)
- PDR-D1 — bibliothèque installable (D1-A…D)
- **PDR-D2 — offline intégral** (D2-A…I ; tag `offline-certification-v1`)

**Non confondre :** PDR-D2 publié ≠ Reader V1 accepté ; Composition V1 publiée ≠ acceptation Reader V1.

---

## 3. Chemin critique

**Prochain jalon :** **Reader Acceptance V1** — prononcer l'acceptation Reader sur le package 234 complet.

**Étape immédiate :** satisfaire les critères restants du domaine D/E — patrimoine (PDR-E5), reprise de session (PDR-D4), recherche locale (PDR-D6), Amorçage (1 vue `planned`), sauvegarde/restauration.

**Pourquoi c'est le goulet :** le package de référence est publié ; D1 et D2 sont livrés. Le goulet est l'**acceptation produit** du Reader :

| Bloqué à l'acceptation |
|---|
| Validation pédagogique Lou |
| Industrialisation Fabrique productrice |

**Outcome attendu :** Reader V1 accepté sur package 234 → débloque validation Lou et modèle pour l'industrialisation.

**Points d'entrée code :**

- Reader : [`demo/renderer/`](../demo/renderer/) — mode produit `?product=1`
- Package de référence : [`01-learning/chapters/cardio/234/`](../01-learning/chapters/cardio/234/)
- Bibliothèque / offline : `demo/renderer/library/`, `tools/lou-build/lib/library-*.js`, `tools/lou-build/lib/offline-*.js`

---

## 4. Architecture stabilisée (PDR-D2)

Chaîne d'autorité offline (contrat D2-A) :

```
Fabrique → installPublishedRelease → library.json (SSOT offline_status)
  → Browser Offline Manager (seule certification offline_ready/failed)
  → Runtime Browser (matérialisation Cache API)
  → Browser Package Access (seule frontière Reader ↔ contenu)
  → Reader (Composition → RVM → Renderer)
```

**Décisions figées :**

- `library.json` = unique SSOT catalogue et `offline_status`
- Browser Offline Manager = seule autorité de certification produit
- Offline Manager Node = préparation auxiliaire post-install, **sans certification**
- Runtime = matérialisation et service, jamais certification
- Package Access = lecture seule, manifest-only
- Composition = indépendante du offline et du catalogue

**Tags de référence architecture :**

| Tag | Périmètre |
|---|---|
| `editorial-architecture-v1` | Contrats 07–09 |
| `reader-composition-v1` | Composition V1 |
| `offline-certification-v1` | PDR-D2 complet |

---

## 5. Contrats faisant autorité

Consulter **selon le besoin** — pas de lecture systématique.

| Document | Rôle |
|---|---|
| [ADR-006](adr/ADR-006-pedagogical-patrimony-and-edition-lineage.md) | Patrimoine ; identité Release ; offline sur packages installés |
| [`LIBRARY-CATALOG-CONTRACT.md`](contracts/components/LIBRARY-CATALOG-CONTRACT.md) | Catalogue ; installation ; Package Access |
| [`OFFLINE-COMPONENT-CONTRACT.md`](contracts/components/OFFLINE-COMPONENT-CONTRACT.md) | Offline garanti ; cycle de vie `offline_status` |
| [`COMPOSITION-COMPONENT-CONTRACT.md`](contracts/components/COMPOSITION-COMPONENT-CONTRACT.md) | Composition — indépendante offline |
| [`RENDERER-COMPONENT-CONTRACT.md`](contracts/components/RENDERER-COMPONENT-CONTRACT.md) | Renderer ; Package Access |
| [`contracts/04`](contracts/04-CHAPTER-PACKAGE.md)–[`09`](contracts/09-CLINICAL-SCENARIO.md) | Obligations package / éditorial |
| [`PRODUCT-DECISION-REGISTRY.md`](governance/PRODUCT-DECISION-REGISTRY.md) | Arbitrages produit (PDR-D1…D7, E5, etc.) |
| [`OFFLINE-IMPLEMENTATION-PLAN.md`](governance/OFFLINE-IMPLEMENTATION-PLAN.md) | Plan D2-A…I — **clôturé** (historique) |

Docs Reader [14](renderer/14-LOU-READER-ARCHITECTURE.md)–[15](renderer/15-READER-FUNCTIONAL-SPECIFICATION.md) : propagation différée — les contrats composants Offline et Catalogue font autorité pour le comportement normatif.

---

## 6. État exact du Reader V1

| Domaine | État |
|---|---|
| **Composition V1** | Publiée — 7 vues via Spec → Engine → RVM → Renderer |
| **Bibliothèque installable (D1)** | Livré — `lou-library install`, Package Access Node/Browser |
| **Offline intégral (D2)** | Publié — mode produit `?product=1` ; certification Browser Offline Manager ; 9 tests OF-D2-* PASS |
| **7 vues alimentées** | 6 opérationnelles + 1 `planned` (Amorçage) |
| **Patrimoine (PDR-E5)** | Non implémenté — bloque critère acceptation |
| **Reprise de session (PDR-D4)** | Non implémenté |
| **Recherche locale (PDR-D6)** | Non implémenté |
| **Sauvegarde/restauration** | Non implémenté |
| **Critères d'acceptation** | **Non prononcés** |

**Tests :** 180/180 PASS (`test:ci`) ; intégration slice hors gate (`test:integration`) ; fixture CI 234 validée sur GitHub Actions.

---

## 7. Dette volontaire restante

| Dette | Impact |
|---|---|
| Reliquat FIL A (`chapter-analysis/…/official-college.md`) | À supprimer après CI |
| F2 sidecars G/H vs verdict I | Cohérence disque lou-build |
| SVG V1 vs moteur grammaire cible (PDR-F4) | Latent |
| Fallback renderer legacy (`generated-assets/`, manifest 404) | Prototype isolé — hors chemin nominal |
| Build SVG non byte-identique | CI fiable à long terme |
| Homonymie Offline Manager Node / Browser | Clarification documentaire — pas de dette d'autorité |
| Docs Reader 14–15 vs contrats composants D1/D2 | Propagation différée |

Composition Engine : **clôturée** (Lots A–F).

---

## 8. Chantiers recommandés

Ordre hérité de [`MASTER_ROADMAP.md`](MASTER_ROADMAP.md) § Dépendances :

1. **Reader Acceptance V1** — critères PDR-B1/B5/D/E (chantier actif)
2. **Patrimoine & publication** — implémentation V1 (parallèle)
3. **CI** — non-régression package 234 (parallèle)
4. **Validation pédagogique Lou** — après acceptation Reader
5. Extension optionnelle — 7 KP mastery restants (234)

**Hors périmètre immédiat :** industrialisation Fabrique productrice (PDR-C1), scale multi-chapitres (PDR-C2), sync auto (PDR-D3 post-V1).

---

## 9. Mode d'exécution

Résumé de [`governance/EXECUTION_MODE_V1.md`](governance/EXECUTION_MODE_V1.md) — le document source fait autorité.

| | |
|---|---|
| **Propriétaire** | Décisions produit, architecture, roadmap |
| **Agent** | Implémentation, qualité, tests ; tient PROJECT_STATE à jour |

- **Roadmap** = intention → [`MASTER_ROADMAP.md`](MASTER_ROADMAP.md)
- **PROJECT_STATE** = observation → état courant, blocages, indicateurs
- Ne pas modifier gouvernance stabilisée sans instruction explicite
- PDR-D2 est **clôturé et publié** — ne pas rouvrir sans décision propriétaire

---

## 10. Reprendre le projet

Lorsque le propriétaire dit *« On reprend le projet »* :

1. Lire ce HANDOVER — vue d'ensemble.
2. Lire [`PROJECT_STATE.md`](PROJECT_STATE.md) — valeurs à jour.
3. Confirmer le chemin critique : **Reader Acceptance V1**.
4. Consulter les contrats pertinents à la tâche — pas toute la gouvernance.
5. Mettre à jour PROJECT_STATE si l'avancement change.

**Formulation minimale :** *« On reprend le lot en cours. »*

---

## Documents de référence

| Document | Rôle |
|---|---|
| [`MASTER_ROADMAP.md`](MASTER_ROADMAP.md) | Intention V1, séquencement, critères de sortie |
| [`PROJECT_STATE.md`](PROJECT_STATE.md) | Journal de bord opérationnel |
| [`governance/EXECUTION_MODE_V1.md`](governance/EXECUTION_MODE_V1.md) | Comportement agents |
| [`contracts/00-INDEX.md`](contracts/00-INDEX.md) | Index obligations techniques |
| [`renderer/READER-COMPOSITION-V1-FREEZE.md`](renderer/READER-COMPOSITION-V1-FREEZE.md) | Gel Composition V1 |
| [`governance/OFFLINE-IMPLEMENTATION-PLAN.md`](governance/OFFLINE-IMPLEMENTATION-PLAN.md) | Plan D2 clôturé |
| [`START_HERE.md`](../START_HERE.md) | Parcours humain |

---

*Handover — 2026-08-01 — publication PDR-D2 (`offline-certification-v1`) ; phase active Reader Acceptance V1. Non normatif.*
