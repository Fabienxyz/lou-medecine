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
| **HEAD** | `0d7ba1d` — `feat(renderer): implement learner patrimony snapshot export` (E-C) |
| **Remote** | `origin/main` — aligné avec HEAD (`0d7ba1d`) |
| **Tags de référence** | `offline-certification-v1` (D2) · `reader-composition-v1` (Composition) · pas de tag E-B |

**Commits patrimoine récents :**

| Commit | Message |
|---|---|
| `aaed24c` | `docs(contract): define learner patrimony contract` (E-A) |
| `9abd4ba` | `feat(renderer): implement release-scoped learner patrimony` (E-B) |
| `0d7ba1d` | `feat(renderer): implement learner patrimony snapshot export` (E-C) |

**Fichiers non suivis hors périmètre** (ne pas committer sans instruction) :

- `_Roadmap Opus - 27 Juillet 2026.docx`
- `demo/renderer/test/fixtures/product-library/`

---

## 2. État actuel

> Synthèse de [`PROJECT_STATE.md`](PROJECT_STATE.md). Pour les valeurs à jour, **toujours** lire PROJECT_STATE.

| | |
|---|---|
| **Phase** | Execution Mode V1 — livraison roadmap V1 en cours |
| **Dernier jalon publié** | **E-C** — export Learner Snapshot / LP-05 sur `origin/main` |
| **Objectif actif** | **Reader Acceptance V1** — critères PDR-B1/B5/D/E sur package 234 complet |
| **Lot patrimoine actif** | **E-D** — import / restauration patrimoniale (contrat E-A §9) |
| **Instance courante** | Package 234 Release `complete` ; Composition V1 ; D1 ; D2 ; contrat patrimoine E-A ; persistance E-B ; **Learner Snapshot E-C publié** ; **acceptation Reader non prononcée** |

**Acquis majeurs (publiés) :**

- Gouvernance et contrats fondamentaux 01–09
- Pipeline validateur lou-build (tag `lou-build-pipeline-v1`)
- Architecture éditoriale V1 (tag `editorial-architecture-v1`)
- Reader Composition V1 (tag `reader-composition-v1`)
- Package 234 Release `complete`
- PDR-D1 — bibliothèque installable
- PDR-D2 — offline intégral (tag `offline-certification-v1`)
- **E-A** — contrat Learner Patrimony en vigueur
- **E-B** — persistance Release-scoped (IndexedDB v5, `learner-patrimony.js`)
- **E-C** — export Learner Snapshot (`learner-snapshot.js`, LP-05)

---

## 3. Chemin critique

**Prochain jalon :** **Reader Acceptance V1**

**Étape immédiate (patrimoine) :** **Lot E-D** — implémenter l'import / restauration patrimoniale conforme au contrat E-A §9.

**Critères restants hors E-D :** reprise session D4, recherche D6, Amorçage (1 vue `planned`).

**Points d'entrée code patrimoine :**

- `demo/renderer/learner-patrimony.js` — logique identité Release
- `demo/renderer/learner-store.js` — persistance IndexedDB v5
- `demo/renderer/learner-snapshot.js` — export Learner Snapshot (LP-05)
- Contrat : [`LEARNER-PATRIMONY-COMPONENT-CONTRACT.md`](contracts/components/LEARNER-PATRIMONY-COMPONENT-CONTRACT.md) §9

---

## 4. Architecture stabilisée

Chaîne patrimoine (E-A / E-B / E-C publiés) :

```
Manifest / Package Access → release_id (catalogue)
        ↓ setReleaseContext (app.js)
LouLearnerPatrimony (identité, scope, legacy __legacy__*)
        ↓
LouLearnerStore (IndexedDB v5 — highlights, notes, SVG, diagrammes)
        ↓
LouLearnerSnapshot (export patrimonial — contrat §8, LP-05)
        ↕  [E-D à implémenter]
Import / restauration patrimoniale (contrat §9)
```

**Décisions figées E-B :**

- `release_id` = autorité patrimoniale (jamais inventée par le composant)
- `__legacy__*` = conservation hors domaine actif (pas d'identité catalogue)
- Mode produit = écriture refusée sans contexte catalogue chapitre-matching
- Shell offline inclut `learner-patrimony.js`

---

## 5. Contrats faisant autorité

| Document | Rôle |
|---|---|
| [`LEARNER-PATRIMONY-COMPONENT-CONTRACT.md`](contracts/components/LEARNER-PATRIMONY-COMPONENT-CONTRACT.md) | Patrimoine — persistance §7, export §8 (E-C), import §9 (E-D) |
| [ADR-006](adr/ADR-006-pedagogical-patrimony-and-edition-lineage.md) | Trois patrimoines ; ancrage Release |
| [`LIBRARY-CATALOG-CONTRACT.md`](contracts/components/LIBRARY-CATALOG-CONTRACT.md) | Identité Release catalogue |
| [`OFFLINE-COMPONENT-CONTRACT.md`](contracts/components/OFFLINE-COMPONENT-CONTRACT.md) | Indépendance patrimoine / offline |

---

## 6. État exact du Reader V1

| Domaine | État |
|---|---|
| **Composition V1** | Publiée |
| **Bibliothèque (D1)** | Livré |
| **Offline (D2)** | Publié |
| **Patrimoine — contrat E-A** | En vigueur |
| **Patrimoine — persistance E-B** | **Publié** (`9abd4ba`) |
| **Patrimoine — export E-C** | **Publié** (`0d7ba1d`) — Learner Snapshot / LP-05 |
| **Patrimoine — import E-D** | Non implémenté |
| **Reprise session (D4)** | Non implémenté |
| **Recherche locale (D6)** | Non implémenté |
| **Critères d'acceptation** | **Non prononcés** |

**Tests renderer :** 333 PASS (`demo/renderer/npm test`).

---

## 7. Chantiers recommandés

1. **E-D — Import / restauration patrimoniale** (lot actif patrimoine)
2. **Reader Acceptance V1** (cadre global)
3. D4 reprise · D6 recherche (après E-D ou en parallèle selon roadmap)

---

## 8. Reprendre le projet

Lorsque le propriétaire dit *« On reprend le lot en cours »* :

1. Lire ce HANDOVER.
2. Lire [`PROJECT_STATE.md`](PROJECT_STATE.md).
3. Lot actif patrimoine : **E-D — import / restauration patrimoniale**.
4. Contrat §9 fait autorité pour E-D.

---

*Handover — 2026-08-01 — E-C publié ; lot E-D ouvert. Non normatif.*
