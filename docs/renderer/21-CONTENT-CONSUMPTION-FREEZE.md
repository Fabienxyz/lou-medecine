# Reader V1 — Content Consumption Freeze

| | |
|---|---|
| **Type** | Gel d'architecture — consommation des vues |
| **Date** | 2026-08-03 |
| **Statut** | **Normatif** — référence unique de consommation des 7 vues Reader |
| **Autorité** | Complète [`00-READER-V1-PRODUCT-MODEL.md`](./00-READER-V1-PRODUCT-MODEL.md) et [`READER-COMPOSITION-V1-FREEZE.md`](./READER-COMPOSITION-V1-FREEZE.md) sur le **runtime** ; ne remplace ni contrats, ni ADR, ni MASTER_ROADMAP |
| **Périmètre** | Audit + règles définitives — **aucune modification fonctionnelle** |
| **Chapitre de référence audité** | Item **234** — `01-learning/chapters/cardio/234/` |
| **Niveau de validation** | DEV — cohérence documentaire uniquement |

**Mission.** Figer définitivement la chaîne de consommation du Reader avant toute PAS-SHELL S3 ou production éditoriale. Ce document répond à : *chaque vue consomme-t-elle exactement ce qu'elle doit consommer, et rien d'autre ?*

**Documents connexes :**

- Modèle produit 7 vues : [`00-READER-V1-PRODUCT-MODEL.md`](./00-READER-V1-PRODUCT-MODEL.md)
- Gel Composition (mapping spec) : [`READER-COMPOSITION-V1-FREEZE.md`](./READER-COMPOSITION-V1-FREEZE.md)
- Frontière package ↔ Reader : [`16-CONTENT-TO-READER-ARCHITECTURE.md`](./16-CONTENT-TO-READER-ARCHITECTURE.md)
- Invariants AAI : [`../testing/TEST_ARCHITECTURE_V1.md`](../testing/TEST_ARCHITECTURE_V1.md) §6.2
- Audit Fabrique (contexte incident Product Review) : [`../analysis/reader-fabrique-chain-architecture-audit.md`](../analysis/reader-fabrique-chain-architecture-audit.md)

---

## 1. Chaîne de consommation nominale

```
Chapter Package (manifest.json + artefacts)
        ↓
Composition Specification (corpus-composition-v1.json)
        ↓
Composition Engine — compose(manifest, spec) → ReadingViewModel
        ↓
Package Access — resolveAssetPath(chapter, artefact)
        ↓
Renderer — renderComposedView(view) → fetch + présentation
        ↓
Learner Layer (overlays — hors package officiel)
```

**Modules runtime impliqués (nominal) :**

| Couche | Fichiers |
|---|---|
| Boot | `demo/renderer/app.js`, `demo/renderer/config.js`, `demo/renderer/product-bootstrap.mjs` |
| Composition | `demo/renderer/composition/bootstrap.mjs`, `composition-engine.js`, `navigation.js`, `corpus-composition-v1.json` |
| Package Access | `demo/renderer/library/browser-package-access.js` (mode produit) ; `config.resolveAssetPath` (dev) |
| Rendu | `demo/renderer/renderer.js`, `blocks.js`, `markdown.js`, `cognitive-priming-render.js`, `svg-loader.js` |
| Apprenant | `inline-notes.js`, `text-highlights.js`, `inline-formatting.js`, `learner-store.js` |
| Recherche | `library/local-search-runtime-shared.js` *(indexation transverse — pas affichage)* |

**Chemin alternatif (legacy — manifest 404 uniquement) :** voir §5. Ce chemin est **mutuellement exclusif** avec la chaîne nominale.

---

## 2. Règles normatives par vue

Pour chaque vue : responsabilité pédagogique, artefacts autorisés/interdits, modules responsables.

### 2.1 Amorçage cognitif (`cognitive-priming`)

| Dimension | Règle |
|---|---|
| **Responsabilité pédagogique** | Où suis-je ? De quoi parle ce chapitre ? Profil, prérequis EDN, compléments IA badgés, résumé ultra-synthétique. **Un écran** — pas de détail mécanistique. |
| **Artefact principal autorisé** | `manifest.cognitive_priming_path` → typiquement `build/cognitive-priming.v1.json` |
| **Artefacts secondaires autorisés** | Métadonnées manifest (`title`, `chapter`) pour le titre ; navigation EDN via Package Access (mode produit) |
| **Projections autorisées** | **Aucune** |
| **SVG autorisés** | **Aucun** |
| **Modules Renderer** | `renderer.js` (`renderCognitivePrimingView`), `cognitive-priming-render.js`, `config.js` |
| **Couche apprenant** | **Interdite** — pas de walkthrough, surlignage, notes inline |

**Interdit explicitement :**

- Projection `story`, `overview` ou tout markdown narratif
- Ancien contenu prototype (`generated-assets/`, onglet « Histoire »)
- Guide de lecture legacy, duplication du modèle mental
- SVG package ou legacy
- Toute consommation hors `cognitive_priming_path`

**Binding Composition (figé) :** `{ kind: "cognitive-priming", ref: "manifest" }` — `corpus-composition-v1.json:5-9`

---

### 2.2 Modèle mental (`mental-model`)

| Dimension | Règle |
|---|---|
| **Responsabilité pédagogique** | Schéma général du chapitre, walkthrough court, blocs structurants (une ligne par notion), navigation vers Notions. |
| **Artefact principal autorisé** | Projections `story` (mergeOrder 1) + `overview` (mergeOrder 2) |
| **Artefacts secondaires autorisés** | `manifest.visuals[]` pour alt text ; SVG via `projection.visuals` |
| **Projections autorisées** | `story`, `overview` uniquement |
| **SVG autorisés** | Uniquement via `manifest.projections[].visuals` ou `manifest.visuals[]` — ex. `figures/mm-pump-decompensation.svg` |
| **Modules Renderer** | `renderer.js` (`renderComposedBlocks`), `blocks.js`, `markdown.js`, `svg-loader.js`, `figure-zoom.js`, couche apprenant |
| **Couche apprenant** | Walkthrough notes, surlignages, diagrammes personnels sur blocs `[data-official="true"]` |

**Interdit explicitement :**

- `build/cognitive-priming.v1.json` (canal Amorçage)
- Projections `mechanisms`, `clinical-reasoning`
- SVG depuis `generated-assets/` ou arbres legacy
- Onglets prototype (« Vue d'ensemble », « Histoire »)
- Deuxième modèle mental concurrent (un seul schéma central par chapitre)

**Binding Composition (figé) :** `story` + `overview` — `corpus-composition-v1.json:12-19`

---

### 2.3 Notions (`notions`)

| Dimension | Règle |
|---|---|
| **Responsabilité pédagogique** | TOC des notions ; par notion : question, figure officielle, walkthrough, développement traçable, points d'attention. |
| **Artefact principal autorisé** | Projection `mechanisms` → `projections/understanding/mechanisms.md` |
| **Artefacts secondaires autorisés** | `manifest.visuals[]` ; statuts `known_absent` / planned-not-built pour éléments sans figure |
| **Projections autorisées** | `mechanisms` uniquement |
| **SVG autorisés** | Via `mechanisms.visuals` — ex. `figures/mec-oap.svg` pour `MEC-oap` |
| **Modules Renderer** | `renderer.js`, `blocks.js`, `markdown.js`, `svg-loader.js`, couche apprenant |
| **Couche apprenant** | Complète (walkthrough, surlignage, diagrammes) |

**Interdit explicitement :**

- Contenu Modèle mental (`story`, `overview`, `MM-*` en dehors du bloc notion concerné)
- Amorçage cognitif JSON
- Texte Collège verbatim
- SVG legacy ou hors manifest

**Binding Composition (figé) :** `{ kind: "projection", ref: "mechanisms" }` — `corpus-composition-v1.json:22-26`

---

### 2.4 Cas cliniques (`clinical-cases`)

| Dimension | Règle |
|---|---|
| **Responsabilité pédagogique** | Cas typiques, pièges, variantes ; raisonnement clinique ; scénarios cliniques. |
| **Artefact principal autorisé** | Projection `clinical-reasoning` + registre `scenarios` du manifest |
| **Artefacts secondaires autorisés** | Fichiers YAML scénarios (`scenarios/*.yaml`) — **cible normative** ; statuts planned-not-built pour éléments CR-* / CONF-* |
| **Projections autorisées** | `clinical-reasoning` uniquement |
| **SVG autorisés** | Aucun publié en 234 ; notices d'absence autorisées |
| **Modules Renderer** | `renderer.js` (`renderComposedBlocks`, `createScenariosSection`), `blocks.js`, couche apprenant sur blocs projection |
| **Couche apprenant** | Sur blocs projection uniquement — pas sur la liste scénarios |

**Interdit explicitement :**

- Projections `story`, `overview`, `mechanisms`
- QCM (`questions/`)
- Texte Collège
- Contenu prototype legacy

**Binding Composition (figé) :** `clinical-reasoning` + `scenarios:registry` — `corpus-composition-v1.json:29-36`

**Écart actuel (voir §4) :** scénarios YAML résolus en ViewModel mais affichés en shell (IDs seulement).

---

### 2.5 Collège officiel (`college-official`)

| Dimension | Règle |
|---|---|
| **Responsabilité pédagogique** | Texte **verbatim** du Collège — aucune réécriture Lou. |
| **Artefact principal autorisé** | `manifest.college_source_path` → `source/official-college.md` |
| **Artefacts secondaires autorisés** | `manifest.source_edition` pour badge édition |
| **Projections autorisées** | **Aucune** |
| **SVG autorisés** | **Aucun** |
| **Modules Renderer** | `renderer.js` (`renderCollegeOfficial`), `markdown.js`, `search-navigation.js` (ancres section) |
| **Couche apprenant** | **Non fonctionnelle en V1** — pas de blocs walkthrough ; surlignage/notes requièrent `.pedagogical-block` |

**Interdit explicitement :**

- Toute projection Lou (`story`, `mechanisms`, etc.)
- Réécriture, résumé ou synthèse Lou
- Amorçage, QCM, scénarios
- SVG

**Binding Composition (figé) :** `{ kind: "college-source", ref: "source_edition" }` — `corpus-composition-v1.json:39-44`

---

### 2.6 QCM (`qcm`)

| Dimension | Règle |
|---|---|
| **Responsabilité pédagogique** | Auto-évaluation intermédiaire (~50 questions cible). |
| **Artefact principal autorisé** | Registre `manifest.questions[]` → fichiers `questions/q-*.yaml` |
| **Artefacts secondaires autorisés** | Aucun contenu narratif |
| **Projections autorisées** | **Aucune** |
| **SVG autorisés** | **Aucun** |
| **Modules Renderer** | `renderer.js` (`showViewQcmList`) — shell liste IDs en V1 |
| **Couche apprenant** | **Interdite** |

**Interdit explicitement :**

- Projections narratives (`story`, `mechanisms`, `clinical-reasoning`)
- Amorçage cognitif
- Texte Collège
- Dépendance à un walkthrough ou figure

**Binding Composition (figé) :** `{ kind: "questions", ref: "registry" }` — `corpus-composition-v1.json:46-51`

**Écart actuel (voir §4) :** YAML indexés en recherche locale mais non rendus à l'écran.

---

### 2.7 Notes (`notes`)

| Dimension | Règle |
|---|---|
| **Responsabilité pédagogique** | Zone personnelle apprenant — fiches consolidées. |
| **Artefact principal autorisé** | **Aucun** artefact package |
| **Artefacts secondaires autorisés** | Patrimoine apprenant (IndexedDB, scoping `release_id`) |
| **Projections autorisées** | **Aucune** |
| **SVG autorisés** | **Aucun** (diagrammes personnels = couche apprenant, pas package) |
| **Modules Renderer** | `renderer.js` (`showViewNotesShell`) |
| **Couche apprenant** | Patrimoine ; notes inline vivent sur les **autres vues** |

**Interdit explicitement :**

- Tout contenu officiel du package
- Projections, QCM, Collège, amorçage
- Shell prototype « Suis-je prêt ? »

**Binding Composition (figé) :** `{ kind: "none" }`, policy `always-published-for-shell` — `corpus-composition-v1.json:53-57`

---

## 3. Cartographie runtime actuelle (Item 234)

Matrice observée au **2026-08-03** sur le chemin nominal (`manifest.json` présent — dev ou `product=1`).

| Vue | Artefacts réellement lus | Origine | Version / identité | Legacy ? | Conforme ? |
|---|---|---|---|---|---|
| **Amorçage cognitif** | `build/cognitive-priming.v1.json` | Package Lou Build stage J | schema `cognitive-priming.v1` | Non | ✅ Oui |
| **Modèle mental** | `projections/understanding/story.md`, `overview.md` ; `figures/mm-pump-decompensation.svg` | Package projections + figures | Build 234 2022 | Non | ✅ Oui |
| **Notions** | `projections/understanding/mechanisms.md` ; `figures/mec-oap.svg` ; notices planned-not-built (3 éléments) | Package | Build 234 2022 | Non | ✅ Oui |
| **Cas cliniques** | `clinical-reasoning.md` (rendu complet) ; 3 scénarios YAML (**IDs shell seulement**) | Package | Build 234 2022 | Non | ⚠️ Partiel — scénarios non rendus |
| **Collège officiel** | `source/official-college.md` (verbatim) | Package source copy | Édition 2022 | Non | ✅ Oui *(couche apprenant morte — voir §4)* |
| **QCM** | 81× `questions/q-234-*.yaml` (**IDs shell seulement**) | Package registry | Build 234 2022 | Non | ⚠️ Partiel — YAML non rendus |
| **Notes** | Aucun package ; message shell | Renderer statique | — | Non | ✅ Oui (shell V1 attendu) |

**Référence manifest :** `01-learning/chapters/cardio/234/manifest.json` — projections `:10-79`, visuals `:81-93`, college `:95`, cognitive priming `:96`, questions `:224-629`, scenarios `:631-649`.

### 3.1 Détail consommation par artefact (234)

| Artefact package | Vue consommatrice | Module fetch | Affiché ? |
|---|---|---|---|
| `build/cognitive-priming.v1.json` | Amorçage | `renderer.js:586-588` → `cognitive-priming-render.js` | Oui |
| `story.md` | Modèle mental | `renderer.js:487-491` → `blocks.js` | Oui |
| `overview.md` | Modèle mental | idem | Oui |
| `mechanisms.md` | Notions | idem | Oui |
| `clinical-reasoning.md` | Cas cliniques | idem | Oui |
| `figures/mm-pump-decompensation.svg` | Modèle mental | `svg-loader.js:63-95` | Oui (inline ou img fallback) |
| `figures/mec-oap.svg` | Notions | idem | Oui |
| `source/official-college.md` | Collège | `renderer.js:668` | Oui |
| `questions/q-234-*.yaml` (×81) | QCM | Composition résout ; Renderer liste IDs | **Non** (shell) |
| `scenarios/*.yaml` (×3) | Cas cliniques | Composition résout ; Renderer liste IDs | **Non** (shell) |
| `build/traceability.json` | *(transverse)* | Session / trace panel | Indirect |

### 3.2 Recherche locale vs affichage

| Artefact indexé | Vue index | Affiché dans la vue ? | Écart |
|---|---|---|---|
| Projections markdown | MM, Notions, Cas | Oui | — |
| `official-college.md` | Collège | Oui | — |
| `cognitive-priming.v1.json` | Amorçage | Oui | — |
| `questions/*.yaml` (contenu) | QCM | **Non** | Search > Display |
| `scenarios/*.yaml` (contenu) | Cas cliniques | **Non** | Search > Display |
| `manifest.visuals[].alt` | Vue propriétaire | Alt oui ; corps SVG non indexé | Accepté |

Source : `demo/renderer/library/local-search-runtime-shared.js`.

---

## 4. Héritages détectés

Consommations héritées ou ambiguës — **rien n'est supprimé par ce gel**.

| ID | Héritage | Pourquoi | Phase d'origine | Doit disparaître ? | PAS cible |
|---|---|---|---|---|---|
| **H-01** | **Chemin legacy 5 onglets** (`generated-assets/`, `config.TABS`) coexiste avec Composition 7 vues | Fallback pré-architecture pour manifest 404 | Pré-Composition (D1) | Oui — chemin mort dès manifest publié | **PAS-CONSUME** *(nouvelle)* + PAS-SHELL S3 |
| **H-02** | **Dualité amorçage** : CP JSON + narrative `story` (canaux distincts, contenu éditorial potentiellement redondant) | CP ajouté Phase 2 AP ; `story` reste projection MM | Phase 1 MM + Phase 2 AP | Non (by design) — mais **isolation stricte** requise | PAS-AP + PAS-MM |
| **H-03** | **QCM shell** : registry complet en ViewModel, affichage IDs seulement | Renderer V1 minimal avant implémentation interactive QCM | Composition Lot C | Oui — rendu YAML requis | **PAS-QCM** *(extension)* |
| **H-04** | **Scénarios shell** : YAML résolus, liste IDs seulement | Idem — capacité display reportée | Composition Lot C | Oui — rendu scénario requis | **PAS-CLINICAL** *(extension)* |
| **H-05** | **Collège + mountLearnerLayers** sans blocs walkthrough | Intégration anticipée couche apprenant | D4 session | Oui — retirer mount mort ou ajouter blocs | PAS-COLLEGE |
| **H-06** | **Patrimoine `__legacy__*`** en mode dev sans catalog release | Dev bootstrap sans `release_id` catalogue | Lot E-B patrimoine | Oui en product=1 ; toléré en dev | PAS-OFFLINE + PAS-NOTES |
| **H-07** | **Cache SW shell/runtime** peut servir anciennes générations UI/package | Architecture offline V1 (corrigée PAS-OFFLINE 2) | D2 offline | Atténué — convergence auto | PAS-OFFLINE *(clôturé)* |
| **H-08** | **SVG inline vs `<img>` fallback** — même path, rendus différents | Robustesse chargement | SVG experience | Non — fallback autorisé | — |
| **H-09** | **`renderProjection()` deprecated** encore appelé chemin legacy | Prototype historique | Pré-Composition | Oui avec H-01 | PAS-CONSUME |
| **H-10** | **Outillage review/CI câblé 234** (`library-server.mjs`, fixture) | Chapitre laboratoire RPC | RPC-234 | Non (outillage) — pas consommation runtime | PAS-LIBRARY |
| **H-11** | **Overview réutilise élément `MM-pump-decompensation`** de story | Agrégation intentionnelle mergeOrder | Composition V1 | Non — agrégation déclarée | — |
| **H-12** | **HR stripping `---`** dans blocks.js | Règle markdown historique | Pré-walkthrough | Documenter ; pas mélange génération | PAS-NOTIONS *(doc)* |

---

## 5. Chemin legacy (hors gel nominal)

Activé **uniquement** si `manifest.json` retourne 404 en mode dev (`app.js:682-685`).

| Onglet prototype | Fichier legacy | Équivalent Composition |
|---|---|---|
| Histoire | `generated-assets/.../histoire.md` | Modèle mental + Amorçage |
| Pourquoi ? | *(non implémenté)* | Notions |
| Vue d'ensemble | `vue-ensemble.md` | Modèle mental |
| Les acteurs | `acteurs.md` | Notions |
| Suis-je prêt ? | `pret.md` | QCM |

**Règle freeze :** en mode produit (`product=1`), le legacy est **jamais** activé (`app.js:646`, `useLegacy: false`). Voir AAI-CONSUME-02.

---

## 6. Invariants AAI — consommation

Registre autoritaire complet : [`TEST_ARCHITECTURE_V1.md`](../testing/TEST_ARCHITECTURE_V1.md) §6.2.

Invariants **nouveaux** introduits par ce gel :

| ID | PAS | Invariant |
|---|---|---|
| **AAI-CONSUME-01** | PAS-CONSUME | Toute entrée de registre (`questions`, `scenarios`) référencée dans le ReadingViewModel est **rendue** ou **explicitement déclarée shell-only** dans ce document |
| **AAI-CONSUME-02** | PAS-CONSUME | Mode produit **n'active jamais** `useLegacyContentRoot()` ni ne fetch `generated-assets/` |
| **AAI-AP-02** | PAS-AP | Amorçage **ne consomme jamais** de projection (`story`, `overview`, etc.) |
| **AAI-MM-02** | PAS-MM | Modèle mental **ne consomme jamais** `cognitive_priming_path` |
| **AAI-NOT-02** | PAS-NOTIONS | Notions **n'affiche jamais** de contenu Modèle mental (projections `story`/`overview`) |
| **AAI-QCM-02** | PAS-QCM | QCM **ne dépend jamais** d'un contenu narratif (projection ou amorçage) |
| **AAI-LEGACY-01** | PAS-CONSUME | Legacy 5 onglets **ne coexiste jamais** avec un ReadingViewModel dans la même session |
| **AAI-SVG-01** | PAS-CONSUME | Chemins SVG runtime **uniquement** via `manifest.projections[].visuals` ou `manifest.visuals[]` |
| **AAI-LEARNER-01** | PAS-CONSUME | Couche apprenant ne monte que sur hôtes avec walkthrough officiel (`[data-official="true"]`) |
| **AAI-PATRIMONY-01** | PAS-NOTES | Mode produit : écritures patrimoine **scopées** au `release_id` catalogue — jamais `__legacy__*` |
| **AAI-SEARCH-DISPLAY-01** | PAS-CONSUME | Index recherche locale ⊆ refs affichables, ou écart documenté par vue |
| **AAI-COMPOSITION-01** | PAS-CONSUME | Toute projection publiée est consommée par **exactement une** vue |

---

## 7. Écarts classés P0 / P1 / P2

### P0 — Mélanges de générations

| ID | Écart | Impact | Action recommandée |
|---|---|---|---|
| **E-P0-01** | Legacy 5 onglets vs Composition 7 vues — même renderer, branches exclusives mais cohabitent dans le code | Product Review sur profil dev/manifest absent : interface prototype | PAS-CONSUME : garde AAI-LEGACY-01 ; retirer chemin legacy ou le confiner au mode dev explicite |
| **E-P0-02** | Cache SW peut servir shell/package d'une génération antérieure | « Ancienne interface » observée en Product Review | Atténué PAS-OFFLINE 2 ; valider profil persistant |
| **E-P0-03** | Recherche indexe QCM/scénarios YAML non affichés | L'utilisateur trouve du contenu qu'il ne peut pas voir dans la vue | PAS-CONSUME + PAS-QCM + PAS-CLINICAL |

### P1 — Consommations ambiguës

| ID | Écart | Impact | Action recommandée |
|---|---|---|---|
| **E-P1-01** | Dualité CP JSON + `story` — deux canaux d'amorçage sémantique | Redondance éditoriale possible | Verrou AAI-AP-02 / AAI-MM-02 ; revue éditoriale 234 |
| **E-P1-02** | QCM/scénarios : ViewModel complet, Renderer shell | PAS marquées Couvert alors que display partiel | AAI-CONSUME-01 ; étendre Renderer ou reclasser statut shell |
| **E-P1-03** | Collège : `mountLearnerLayers` sans effet | Code mort, confusion architecture | AAI-LEARNER-01 ; retirer mount ou implémenter |
| **E-P1-04** | Patrimoine `__legacy__*` en dev | Annotations dev ≠ product | AAI-PATRIMONY-01 ; warning dev explicite |
| **E-P1-05** | CP `chapter_id` mismatch — warning seulement | Traçabilité affaiblie | Durcir en diagnostic Composition |

### P2 — Dette historique sans impact utilisateur immédiat

| ID | Écart | Impact | Action recommandée |
|---|---|---|---|
| **E-P2-01** | `renderProjection()` deprecated | Code mort nominal | Supprimer avec H-01 |
| **E-P2-02** | HR stripping historique blocks.js | Comportement markdown | Documenter ; test régression |
| **E-P2-03** | SVG inline vs img fallback | Rendu visuel légèrement différent | Accepté — AAI-SVG-01 suffit |
| **E-P2-04** | Outillage 234-only | Pas de consommation runtime | PAS-LIBRARY |
| **E-P2-05** | Diagnostic `published-projection-unconsumed` = warn | Non bloquant | Promouvoir en error post-freeze (AAI-COMPOSITION-01) |

---

## 8. Recommandations — PAS de nettoyage de consommation

**PAS proposée : PAS-CONSUME** — Content Consumption Cleanup (à ouvrir **avant** PAS-SHELL S3).

| Étape | Action | AAI | Priorité |
|---|---|---|---|
| 1 | Ajouter tests AAI-CONSUME-02, AAI-LEGACY-01 (product=1 jamais legacy ; pas de `generated-assets/`) | CONSUME-02, LEGACY-01 | P0 |
| 2 | Aligner recherche locale sur affichage QCM/scénarios **ou** marquer shell-only dans spec | SEARCH-DISPLAY-01, CONSUME-01 | P0 |
| 3 | Retirer `mountLearnerLayers` mort sur Collège | LEARNER-01 | P1 |
| 4 | Garde statique : Amorçage n'importe pas projections ; MM n'importe pas CP | AP-02, MM-02 | P1 |
| 5 | Promouvoir `published-projection-unconsumed` warn → error | COMPOSITION-01 | P2 |
| 6 | Confiner ou supprimer chemin legacy 5 onglets | LEGACY-01 | P0 *(decision produit)* |

**Ordre suggéré pour ChatGPT / agent suivant :**

1. Lire ce document + §6.2–6.4 de `TEST_ARCHITECTURE_V1.md`
2. Créer PAS-CONSUME dans le registre (sans modifier les PAS existantes — extension)
3. Implémenter smokes `18-content-consumption-freeze.spec.mjs` couvrant AAI-CONSUME-02, AAI-LEGACY-01, AAI-SEARCH-DISPLAY-01
4. **Ne pas** ouvrir PAS-SHELL S3 avant clôture PAS-CONSUME P0
5. Extensions QCM/Clinical Renderer → PAS-QCM / PAS-CLINICAL existantes

---

## 9. Critères de réussite du gel

| Critère | Statut |
|---|---|
| Document 21 = référence unique consommation | ✅ |
| Chaque vue : responsabilité + autorisé + interdit | ✅ §2 |
| Consommations legacy identifiées | ✅ §4–§5 |
| Mélanges de générations recensés | ✅ §7 P0 |
| AAI définis | ✅ §6 + TEST_ARCHITECTURE §6.2 |
| Aucun code fonctionnel modifié | ✅ |
| Aucune PAS modifiée | ✅ |
| Aucun comportement utilisateur modifié | ✅ |

---

## Historique

| Version | Date | Changement |
|---|---|---|
| **1.0** | 2026-08-03 | Gel initial — audit runtime 7 vues, cartographie 234, AAI consommation, écarts P0/P1/P2 |

---

*Reader V1 — Content Consumption Freeze. Les projections restent des unités de production ; seules les sept vues et leurs artefacts autorisés constituent la consommation normative.*
