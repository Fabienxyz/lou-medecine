# Reader V1 — Modèle produit (référence unique)

| | |
|---|---|
| **Type** | Référence produit — **point d'entrée Reader** |
| **Statut** | **En vigueur** — post Reader Acceptance V1 (2026-08-02) |
| **Autorité** | Modèle produit utilisateur ; complète les docs 14–16 sans les remplacer |
| **Audience** | Propriétaire, agents IA, contributeurs — **avant toute mission Reader ou package** |

Ce document décrit **exclusivement** l'expérience Reader V1 du point de vue **utilisateur et produit**. Il ne décrit pas la Fabrique, les fichiers de production, ni l'implémentation JavaScript.

**Règle terminologique absolue :** les identifiants techniques `story`, `overview`, `mechanisms`, `clinical-reasoning` désignent des **artefacts internes de production** (projections). Ils **ne sont pas** des vues, des onglets, ni des écrans du produit.

---

## 1. Chaîne de bout en bout

```
Chapter Package publié
        ↓
Projections (artefacts internes — production uniquement)
        ↓
Composition Specification
        ↓
Composition Engine   compose(manifest, spec)
        ↓
Reading View Model
        ↓
Renderer
        ↓
7 vues Reader (modèle produit)
        ↓
Couche apprenant (overlays, Notes)
```

| Étape | Rôle | Visible apprenant ? |
|---|---|---|
| **Package** | Publie le contenu officiel (texte, figures, QCM, scénarios, amorçage) | Non (sauf contenu affiché) |
| **Projections** | Unités de **production** Fabrique ; markdown généré par type | **Non** — jamais des onglets |
| **Composition** | Déclare comment les artefacts alimentent les **7 vues** | Non |
| **Reading View Model** | Entrée logique du Renderer pour le contenu officiel composé | Non |
| **Renderer** | Présente les vues ; fetch via Package Access | Oui |
| **7 vues** | Expérience produit | **Oui** |

Références : [`READER-COMPOSITION-V1-FREEZE.md`](./READER-COMPOSITION-V1-FREEZE.md) · [`16-CONTENT-TO-READER-ARCHITECTURE.md`](./16-CONTENT-TO-READER-ARCHITECTURE.md) · [`../contracts/components/COMPOSITION-COMPONENT-CONTRACT.md`](../contracts/components/COMPOSITION-COMPONENT-CONTRACT.md).

---

## 2. Les sept vues Reader (modèle produit officiel)

Ordre d'affichage figé (`displayOrder` 1–7). Identifiants techniques stables (`viewId`).

| displayOrder | viewId | Label produit | Question pédagogique |
|---:|---|---|---|
| 1 | `cognitive-priming` | **Amorçage cognitif** | Où suis-je ? De quoi parle ce chapitre ? |
| 2 | `mental-model` | **Modèle mental** | Comment l'ensemble du chapitre s'organise-t-il ? |
| 3 | `notions` | **Notions** | Comment fonctionne cette notion ? |
| 4 | `clinical-cases` | **Cas cliniques** | Comment cela se manifeste et se raisonne-t-il cliniquement ? |
| 5 | `college-official` | **Collège officiel** | Que dit le texte officiel du Collège ? |
| 6 | `qcm` | **QCM** | Puis-je m'auto-évaluer sur ce chapitre ? |
| 7 | `notes` | **Notes** | Quelles fiches personnelles ai-je consolidées ? |

### 2.1 Amorçage cognitif

- Profil pédagogique (Compréhension / Mémorisation).
- Prérequis EDN.
- Compléments IA badgés (non Collège).
- Résumé ultra-synthétique du chapitre.
- **Un écran** — pas de détail mécanistique.

### 2.2 Modèle mental

- **Schéma général** du chapitre (figure centrale ou avis d'absence) — carte cognitive **minimale**.
- Walkthrough **court** expliquant comment lire le schéma.
- Blocs structurants MM **optionnels** (synthèse par nœud du schéma) — **sans** obligation qu'un bloc MM produise une notion.
- Liens vers Notions **uniquement** lorsqu'une notion associée a été déclarée en production (passe 1).
- Le schéma est le **cœur** de la vue ; le walkthrough l'accompagne.

### 2.3 Notions

- TOC des notions en tête de vue.
- Par notion : question, figure officielle (si publiée), walkthrough, développement traçable, points d'attention.
- **Certaines notions n'ont pas de lien entrant depuis le Modèle mental** (passe 2 éditoriale — légitime).
- Le walkthrough **explique** la figure lorsqu'elle existe.

### 2.4 Cas cliniques

- Cas typiques, pièges, variantes ; raisonnement clinique.
- Le cas **applique** les notions — il ne les remplace pas.

### 2.5 Collège officiel

- Texte **verbatim** du Collège — aucune réécriture Lou.

### 2.6 QCM

- Auto-évaluation intermédiaire (~50 questions par chapitre cible).
- Le contenu pédagogique prime sur les limitations d'interface.

### 2.7 Notes

- Zone **personnelle** apprenant — hors contenu officiel du package.

---

## 3. Terminologie — ce qui est interdit en produit

| Terme | Statut produit | Usage autorisé |
|---|---|---|
| `story`, `overview`, `mechanisms`, `clinical-reasoning` | **Artefacts internes** | Fabrique, manifest, pipeline, tests — **jamais** comme nom de vue |
| « Histoire », « Vue d'ensemble », « Pourquoi ? », « Raisonnement clinique » (onglets) | **Obsolète** (pré-Composition) | Historique uniquement — voir [`03-HISTORICAL_ARCHITECTURE.md`](./03-HISTORICAL_ARCHITECTURE.md) |
| « 1 projection = 1 onglet » | **Abrogé** | [`READER-COMPOSITION-V1-FREEZE.md`](./READER-COMPOSITION-V1-FREEZE.md) §1 |
| `projection` (générique) | Terme **production** | Registre package, ordre pédagogique — pas navigation Reader |

**Distinction normative** ([contrat 02](../contracts/02-IDENTITY-AND-ANCHORS.md)) : le **Narratif** (identifiant de projection) ≠ **onglet / vue Reader**.

---

## 4. Chemins de lecture recommandés

### Agent IA — mission Reader ou package 234

1. **Ce document** (`00-READER-V1-PRODUCT-MODEL.md`)
2. [`docs/HANDOVER.md`](../HANDOVER.md) + [`docs/PROJECT_STATE.md`](../PROJECT_STATE.md)
3. [`15-READER-FUNCTIONAL-SPECIFICATION.md`](./15-READER-FUNCTIONAL-SPECIFICATION.md) — interactions par vue
4. [`READER-COMPOSITION-V1-FREEZE.md`](./READER-COMPOSITION-V1-FREEZE.md) — mapping technique Composition (référence **implémentation**, pas produit utilisateur)
5. [`14-LOU-READER-ARCHITECTURE.md`](./14-LOU-READER-ARCHITECTURE.md) — principes et glossaire

**Ne pas utiliser** pour la navigation produit : [`02-PRODUCT_SPECIFICATION.md`](./02-PRODUCT_SPECIFICATION.md) § navigation historique (pré-Composition) · annexes obsolètes non mises à jour · [`COMPOSITION-IMPLEMENTATION-DEBT.md`](../governance/COMPOSITION-IMPLEMENTATION-DEBT.md) §1–§10 (archive baseline).

### Agent IA — mission Fabrique (production)

1. Contrats 04, 08, 17–19 — projections comme **unités de production**
2. Package chapitre sous `01-learning/chapters/`
3. **Revenir aux 7 vues** via ce document avant toute conclusion sur l'expérience apprenant

---

## 5. Documents connexes par rôle

| Besoin | Document |
|---|---|
| **Produit — 7 vues (ce document)** | `00-READER-V1-PRODUCT-MODEL.md` |
| Vision et principes | `14-LOU-READER-ARCHITECTURE.md` |
| Écrans et interactions | `15-READER-FUNCTIONAL-SPECIFICATION.md` |
| Gel Composition + mapping sources | `READER-COMPOSITION-V1-FREEZE.md` |
| Frontière package ↔ Reader | `16-CONTENT-TO-READER-ARCHITECTURE.md` |
| Contrat Renderer | `../contracts/06-RENDERER-AND-LEARNER-LAYER.md` |
| Historique pre-Composition | `03-HISTORICAL_ARCHITECTURE.md` |
| Clôture Reader Acceptance | `../releases/reader-acceptance-v1-publication.md` |

---

## Historique

| Version | Date | Changement |
|---|---|---|
| **1.0** | 2026-08-02 | Création — point d'entrée produit Reader V1 ; nettoyage documentaire post-audit |

---

*Reader V1 — modèle produit. Les projections restent des artefacts de production ; seules les sept vues ci-dessus constituent le produit.*
