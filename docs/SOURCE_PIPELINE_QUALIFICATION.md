# Lou Médecine — Qualification du pipeline d'acquisition

**Statut :** gouvernance — document normatif (Phase P **clôturée** — 2026-07-28)  
**Dernière mise à jour :** 2026-07-28 (révision critères — suffisance pipeline, post-P.1)

Ce document définit les critères et la philosophie de qualification du pipeline d'acquisition (Phase P, **terminée**). Il reste la **référence normative** de la grille **P1–P7** et des principes de suffisance aval. L'architecture gelée est actée par [ADR-004](../adr/ADR-004-acquisition-architecture-frozen.md).

**Chaîne officielle actée :** [`SOURCE_OF_TRUTH.md`](SOURCE_OF_TRUTH.md) — FIL B unique ; FIL A legacy en décommission.

Pour l'analyse comparative des formats source, voir [`SOURCE_FORMAT_COMPARATIVE.md`](SOURCE_FORMAT_COMPARATIVE.md).

---

## Terminologie

| Terme | Signification |
|---|---|
| **Source primaire** | Fichier publié par l'éditeur EDN (PDF aujourd'hui ; DOCX, HTML, XML… demain), immuable, archivé avec son hash dans `01-learning/full-edn/` |
| **Markdown source officiel** | Sortie de **Tool 01** (`official-college.md`) — **seule représentation textuelle officielle** du collège ; consommée par Tool 02 et le pipeline Lou |
| **Chapitres officiels** | Sorties de **Tool 02** (`chapters/item-*.md`) — seule découpe officielle autorisée |
| **Pipeline d'acquisition** | Chaîne déterministe source primaire → Markdown source (+ Tool 02 → chapitres) ; qualifié et gelé en Phase P |
| **FIL B** | Chaîne officielle : PDF → Tool 01 → Markdown source → Tool 02 → chapitres |
| **FIL A** | Artefact historique de transition — **non officiel**, en décommission (voir [`SOURCE_OF_TRUTH.md`](SOURCE_OF_TRUTH.md)) |
| **Information métier** | Fait examinable du Collège : définitions, mécanismes, posologies, seuils, classifications, exceptions, raisonnement clinique — tout ce qu'Inventory, Blueprint ou mastery doivent pouvoir ancrer |
| **Artefact intermédiaire** | Markdown source et chapitres — **entrée** du pipeline Lou, pas produit final ; qualité = suffisance aval |
| **Imperfection de représentation** | Écart de mise en forme, structure tabulaire, pastille Rang ou asset figure par rapport au PDF — **sans** perte du texte médical sous-jacent |

Pour une même donnée métier, **une seule source officielle** (règle SSOT). Les duplications (copie de travail, artefact historique, fichier généré) ne sont jamais une seconde autorité.

---

## 0. Philosophie de qualification (post-P.1)

### Objectif — pas la reproduction du PDF

L'objectif du projet **n'est pas** d'obtenir la reproduction parfaite du PDF.

L'objectif est de **préserver toute l'information nécessaire** à la génération fiable des artefacts métier. Le Markdown source est un **artefact intermédiaire** ; sa qualité est évaluée **uniquement** par sa capacité à alimenter correctement :

- **Inventory**
- **Blueprint**
- **projections pédagogiques**
- **Renderer**
- et les **futurs outils** du pipeline

### Question directrice

> **Les outils aval disposent-ils de toute l'information nécessaire pour fonctionner correctement ?**

Toute qualification Phase P doit répondre à cette question — pas à « le Markdown ressemble-t-il au PDF ? ».

### Principe des imperfections admises

> **Une imperfection de représentation ne constitue pas un défaut du pipeline tant qu'elle n'entraîne ni perte d'information métier, ni impossibilité de générer correctement les artefacts aval.**

### Fidélité visuelle ou structurelle PDF

Les critères de restitution visuelle, de structure tabulaire pixel-perfect, d'extraction des pastilles Rang ou d'assets figures raster ne sont retenus **que lorsqu'un impact est démontré** sur un artefact aval — voir critères **V1–V4** (§ 7).

### Définition officielle du succès — Phase P

> **La Phase P est réussie lorsque le pipeline d'acquisition qualifié produit un Markdown source (et des chapitres Tool 02) à partir duquel Inventory, Blueprint, projections pédagogiques et Renderer peuvent être générés de façon fiable — démontrée par pilote(s) sur le corpus de référence et, en clôture, sur le collège pilote — sans retouche manuelle du Markdown, et avec les invariants techniques (§ 7, P7) respectés.**

Analyses de référence : [`acquisition/hypothesis-pipeline-impact-p1.md`](acquisition/hypothesis-pipeline-impact-p1.md) ; rapport historique P.1 : [`acquisition/qualification-report-tool01-p1.md`](acquisition/qualification-report-tool01-p1.md) (grille PDF-centric, conservé pour trace).

---

## 1. Pourquoi cette phase existe

Les Collèges EDN sont aujourd'hui disponibles principalement en PDF. Le projet a démarré avec ce format par contrainte de disponibilité, **pas par choix architectural**. Demain, la même source officielle pourra être publiée en DOCX, EPUB, HTML, XML ou tout autre format structuré.

Lou Médecine ne doit **pas** être conçu autour du PDF. Il doit être conçu autour du **meilleur format source disponible** pour chaque collège et chaque édition.

La Phase P existe pour :

1. **Choisir** le format source à privilégier lorsque plusieurs sont disponibles ;
2. **Concevoir et valider** un pipeline d'acquisition reproductible : source primaire → Markdown source (Tool 01) → chapitres (Tool 02) ;
3. **Geler** ce pipeline une fois qualifié, avant d'investir dans la Phase 0 et le pipeline métier Lou.

Sans cette phase, le projet risque de consolider des compromis liés au PDF comme s'ils étaient des **exigences produit**, alors qu'ils ne le deviennent que si un **artefact aval** en a besoin.

---

## 2. Position dans le pipeline

### Pipeline cible (FIL B — chaîne officielle)

```
Source primaire (PDF aujourd'hui ; format variable demain)
        ↓
Tool 01 — lou-pdf-to-canonical    ← Phase P qualifie cet étage (PDF)
        ↓
Markdown source officiel (official-college.md)
        ↓
Tool 02 — lou-chapter-splitter
        ↓
Chapitres officiels (chapters/item-*.md)
        ↓
Pipeline Lou (Inventory → Blueprint → Projections → Renderer)
```

Emplacements et règles SSOT : [`SOURCE_OF_TRUTH.md`](SOURCE_OF_TRUTH.md).

### Pourquoi la Phase P précède la Phase 0

La qualité du Markdown source — et de tout le pipeline Lou — est bornée par la **suffisance pour les outils aval**. Qualifier la Phase 0 avant d'avoir stabilisé le pipeline d'acquisition reviendrait à valider un plafond artificiel.

La Phase P précède la Phase 0 parce que :

- **0B (Fidélité du Collège)** apporte des garanties complémentaires (figures, validateurs) — **après** qualification de la suffisance pipeline ;
- **0A (Contrats fondamentaux)** fige le modèle d'ancre ;
- optimiser la **reproduction PDF** du Markdown **avant** de prouver la génération Inventory/Blueprint gaspille l'effort sur le mauvais critère de succès.

### Hors périmètre médical

La Phase P **qualifie l'entrée** du pipeline. Elle ne produit pas d'Inventory, de Blueprint ni de Projections en clôture — mais elle **exige** la démonstration (pilote ou réconciliation) que ces artefacts **peuvent** être générés correctement à partir du Markdown produit.

---

## 3. Ce que la Phase P qualifie (et ce qu'elle ne qualifie pas)

| Qualifié | Non qualifié |
|---|---|
| Suffisance du Markdown pour Inventory, Blueprint, projections, Renderer | Qualité pédagogique des projections |
| Préservation de l'information métier (pas reproduction PDF) | Segmentation sémantique détaillée (Phase 2) |
| Segmentabilité, ancrabilité, réconciliation sans `missed` systématique | Rendu SVG ou UX du Lecteur |
| Pipeline reproductible, automatisé, tracé | Portabilité multi-collèges (Phase 5) |
| Découpage Tool 02 → chapitres officiels | Utilisation du FIL A legacy |

La Phase P ne répond **pas** à « quel modèle LLM produit le meilleur Markdown ? ». Elle répond : « le Markdown produit permet-il aux outils aval de fonctionner correctement, de façon reproductible et sans retouche manuelle ? »

Un LLM peut servir de **validateur échantillonné** (contrôle qualité), jamais de producteur du Markdown source. Voir [`LLM_STRATEGY.md`](LLM_STRATEGY.md).

---

## 4. Une seule qualification par type de source

Le pipeline d'acquisition se qualifie **une fois par couple (format source, éditeur/producteur)** — pas une fois par chapitre, pas une fois par collège.

| Type de source | Exemple | Qualification |
|---|---|---|
| PDF éditeur X | Collège cardio 2022, PDF officiel | 1 pipeline gelé |
| DOCX éditeur X | Même collège, export DOCX | Pipeline distinct, 1 qualification |
| HTML portail EDN | Publication web structurée | Pipeline distinct, 1 qualification |

Une fois qualifié, le pipeline s'applique **industriellement** à l'ensemble des chapitres du collège concerné. Les écarts constatés sur un chapitre signalent un défaut d'outil, une limite source, ou un **impact aval à démontrer** — pas une occasion de retouche manuelle du Markdown source.

---

## 5. Aucune hypothèse sur le format d'origine

Le projet **ne présuppose pas** que le PDF est la source, la meilleure source, ou le seul format futur.

Le Markdown source est le **contrat de sortie de Tool 01**. La Phase P documente les limites source (ex. pastilles Rang graphiques) dans `qualification-report.md` ; elle ne les transforme en exigences Tool 01 que si un critère **V** est activé par impact aval démontré.

---

## 6. Objectifs

1. **Inventorier** les formats disponibles pour le collège pilote (cardiologie 2022).
2. **Comparer** les formats selon [`SOURCE_FORMAT_COMPARATIVE.md`](SOURCE_FORMAT_COMPARATIVE.md).
3. **Sélectionner** le format source primaire lorsque plusieurs existent.
4. **Concevoir et exécuter** le pipeline d'acquisition sur le collège pilote.
5. **Mesurer** la suffisance pipeline (critères **P1–P7**, § 7) sur le corpus de référence.
6. **Démontrer** — pilote(s) Inventory/Blueprint et réconciliation — que les artefacts aval peuvent être générés sans retouche du Markdown.
7. **Documenter** limites et classes d'échec dans [`acquisition/`](acquisition/).
8. **Geler** le pipeline qualifié avec un numéro de version.

**Suspendu post-P.1 :** optimisations Tool 01 orientées reproduction PDF sans impact démontré sur les artefacts aval.

---

## 7. Critères de qualification (grille pipeline — post-P.1)

Évaluation sur le **corpus de référence** ([`benchmark/corpus/`](../../benchmark/corpus/README.md)) ; clôture Phase P sur l'**intégralité du collège pilote**.

### Critères obligatoires (P1–P7)

| # | Critère | Seuil |
|---|---|---|
| **P1** | **Préservation de l'information métier** | Aucune perte ni altération **systématique** de fait examinable (définition, mécanisme, posologie, seuil, score, unité, classification, exception). Métadonnées curriculum (pastille Rang) absentes du PDF texte ≠ perte métier si le corps du chapitre porte le contenu. |
| **P2** | **Segmentabilité** | Titres (`#`…`####`), listes et encadrés suffisants pour segmentation déterministe et `section_path`. |
| **P3** | **Ancrabilité** | Citations **verbatim** relocatables : `{ edition, section_path, quote }`. |
| **P4** | **Suffisance Inventory** | Pilote extraction + **réconciliation indépendante** : pas de segments source `missed` ou `ambiguous` **systématiques** imputables au Markdown ([`IMPLEMENTATION_CONTRACT.md`](../../IMPLEMENTATION_CONTRACT.md) A.1). |
| **P5** | **Suffisance Blueprint et projections** | Texte des sections cliniques complet pour le modèle pédagogique, sans relire le PDF. |
| **P6** | **Suffisance Renderer** | Texte officiel intégral par chapitre, affichable dans le Lecteur sans extraction PDF. |
| **P7** | **Invariants techniques** | **P7a** reproductibilité byte-identique ; **P7b** automatisation sans retouche manuelle ; **P7c** manifest (hash, version, date) ; **P7d** production sans LLM ; **P7e** stabilité des tranches chapitre entre exécutions. |

### Critères conditionnels — fidélité PDF / visuelle (V1–V4)

Évalués **uniquement si** un artefact aval exige la capacité **et** qu'un écart est **démontré**.

| # | Critère | Activé lorsque… |
|---|---|---|
| **V1** | Structure tabulaire exploitable automatiquement | Réconciliation ou extracteur signale des `missed` sur contenu **uniquement** porté par un tableau mal reconstruit. |
| **V2** | Pastilles Rang A/B extractibles | Produit exige filtres mastery par rang **avant** stratégie dédiée (0B, vision, source structurée). |
| **V3** | Assets figures raster traçables | Feature affichage pixel Collège ou grammaire `annotated-figure` activée en production. |
| **V4** | Restitution visuelle / ordre PDF pixel-perfect | Écart prouvé bloquant Renderer ou ancrage (ex. inversion de blocs médicalement significative). |

### Ancienne grille P.1 (référence historique)

La qualification **P.1** (Tool 01 seul) a utilisé **C1–C13** orientés reproduction PDF — voir [`qualification-report-tool01-p1.md`](acquisition/qualification-report-tool01-p1.md). **Ne gouverne plus** la Phase P à compter de cette révision.

| Ancien | Statut post-P.1 |
|---|---|
| C1 exhaustivité textuelle, C8 valeurs | → **P1** |
| C2 hiérarchie titres | → **P2** |
| C3 tableaux | → **V1** si impact Inventory |
| C4 figures assets | → **V3** si feature aval |
| C5 légendes | → **P1** / **P6** (texte, pas pixel) |
| C6 Rang A/B | → **V2** si produit l'exige ; sinon `rank: unknown` |
| C7 ordre de lecture | → **P1** / **V4** |
| C9–C13 | → **P7** |

---

## 8. Critères GO / NO GO

### Principe directeur — suffisance pipeline

> **Un pipeline est qualifié lorsque les outils aval disposent de toute l'information nécessaire pour fonctionner correctement — et que les invariants techniques sont respectés.**

La qualification repose sur la **préservation de l'information métier** et la **génération fiable des artefacts aval**, pas sur la ressemblance visuelle au PDF.

#### Jamais acceptables (NO GO immédiat)

| Violation | Exemple |
|---|---|
| Perte ou altération **systématique** d'information métier | Posologie « 75 mg » → « 7,5 mg » ; paragraphe clinique entier absent |
| Impossibilité **démontrée** de générer Inventory / Blueprint / Renderer | Réconciliation : segments `missed` systématiques ; pilote vertical slice en échec |
| Non-reproductibilité ou retouche manuelle | SHA différent entre runs ; correction à la main du Markdown |
| Production Markdown dépendante d'un LLM | Appel LLM dans la chaîne d'acquisition |

#### Non bloquant par défaut (sauf critère V activé)

- Colonne Rang vide, table hiérarchisation aplati, table mal classée — si **P1–P6** restent satisfaits ;
- Absence d'assets figures raster — si **P6** et Renderer Lou (SVG générés) suffisent ;
- Imperfections de mise en forme sans perte métier — principe § 0.

### GO — passage à la Phase 0

- **Question directrice** : réponse **oui**, démontrée (pilote + réconciliation sur corpus / collège pilote).
- **P1–P7** validés.
- Format source choisi et justifié ; pipeline versionné, exécutable en une commande.
- Dossier [`docs/acquisition/`](acquisition/) complet (§ 10).
- Décision GO dans `qualification-report.md` ; gel enregistré (§ 9).

### NO GO

- Violation d'un jamais acceptable ci-dessus ;
- P4–P6 en échec **démontré** ;
- Format source meilleur disponible non évalué (choix source) ;
- Dossier qualification incomplet.

En cas de NO GO : corriger le **pipeline** ou la **stratégie aval** — jamais retoucher le Markdown à la main.

---

## 9. Règles de gel du pipeline

1. **Version figée** — ex. `acquisition-pdf-v1.0.0` ; toute modification logique incrémente la version.
2. **Regénération, pas retouche** — amélioration = nouvelle exécution versionnée.
3. **Source immuable** — PDF/DOCX archivé avec hash.
4. **Limites explicites** — compromis listés dans `qualification-report.md` ; réouverture si limite **bloque un artefact aval** (pas pour fidélité PDF seule).
5. **Extension par ajout** — nouveau format = nouveau pipeline qualifié.
6. **Réouverture** — nouvelle édition ; format source supérieur ; limite acceptée bloque P4–P6 ou produit.

---

## 10. Livrables de la Phase P

### Dossier `docs/acquisition/`

```
docs/acquisition/
    pipeline.md
    benchmark.md
    qualification-report.md
```

| Fichier | Contenu attendu |
|---|---|
| **`pipeline.md`** | Format source ; version pipeline ; commandes ; hashes |
| **`benchmark.md`** | Formats évalués ; métriques **P1–P7** ; justification choix |
| **`qualification-report.md`** | Verdict GO/NO GO ; résultats P/V ; pilotes aval ; limites ; réouverture gel |

Rapports intermédiaires (ex. `qualification-report-tool01-p1.md`, `hypothesis-pipeline-impact-p1.md`) conservés pour trace.

### Autres livrables

| Livrable | Description |
|---|---|
| Pipeline versionné | Tool 01 + Tool 02, manifest, CI reproductibilité |
| Markdown source pilote | Collège cardio FIL B |
| Mise à jour `PROJECT_STATE.md` | Jalon, risques |

---

## 11. Documents connexes

| Document | Rôle |
|---|---|
| [`SOURCE_OF_TRUTH.md`](SOURCE_OF_TRUTH.md) | Chaîne FIL B, SSOT |
| [`adr/ADR-004-acquisition-architecture-frozen.md`](adr/ADR-004-acquisition-architecture-frozen.md) | Gel architecture — Phase P clôturée |
| [`releases/acquisition-rd-complete.md`](releases/acquisition-rd-complete.md) | Jalon sortie R&D |
| [`SOURCE_FORMAT_COMPARATIVE.md`](SOURCE_FORMAT_COMPARATIVE.md) | Formats source |
| [`acquisition/hypothesis-pipeline-impact-p1.md`](acquisition/hypothesis-pipeline-impact-p1.md) | Analyse impact aval post-P.1 |
| [`acquisition/qualification-report-tool01-p1.md`](acquisition/qualification-report-tool01-p1.md) | Rapport historique P.1 |
| [`MASTER_ROADMAP.md`](MASTER_ROADMAP.md) | Phases |
| [`PROJECT_STATE.md`](PROJECT_STATE.md) | État courant |
| [`LLM_STRATEGY.md`](LLM_STRATEGY.md) | Modèles |
