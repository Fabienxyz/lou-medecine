# Lou Médecine — Architecture pédagogique du Reader

| | |
|---|---|
| **Type** | Document d'architecture pédagogique |
| **Version** | 1.0 |
| **Statut** | **Baseline officielle — gelée** |
| **Dernière mise à jour** | 2026-07-28 |
| **Parent** | [README.md](./README.md) |
| **Complété par** | [`15-READER-FUNCTIONAL-SPECIFICATION.md`](./15-READER-FUNCTIONAL-SPECIFICATION.md) |
| **Gouverné par** | Contrats fondamentaux 01–06 ([`docs/contracts/`](../contracts/00-INDEX.md)) — ce document **ne les remplace pas** |

Ce document fixe la **vision pédagogique**, les **principes**, la **structure** et les **raisons** des choix du Reader Lou Médecine.

**Périmètre documentaire :**

| Ce document (14) | Document complémentaire (15) |
|---|---|
| Vision, principes, architecture en trois couches | Écrans, interactions, états, cas particuliers |
| Objectifs cognitifs par onglet | Comportement détaillé par écran |
| Principes de génération et de fidélité | Parcours utilisateur pas à pas |
| Glossaire, non-objectifs, évolutions candidates | QCM, Notes, navigation, couche apprenante |

**Ce document n'est pas :** un contrat d'implémentation, une spécification technique du renderer ([`04-TARGET_ARCHITECTURE.md`](./04-TARGET_ARCHITECTURE.md)), ni une modification des contrats fondamentaux ou du pipeline.

En cas de conflit sur une **obligation normative** (fidélité, immutabilité, couche apprenant), les contrats fondamentaux et ADR priment sur ce document.

---

## Documents connexes

| Document | Rôle |
|---|---|
| [`15-READER-FUNCTIONAL-SPECIFICATION.md`](./15-READER-FUNCTIONAL-SPECIFICATION.md) | Spécification fonctionnelle — comportements et interactions |
| [`16-CONTENT-TO-READER-ARCHITECTURE.md`](./16-CONTENT-TO-READER-ARCHITECTURE.md) | Frontière publication ↔ Reader — composition, identités |
| [`17-PUBLICATION-MODEL.md`](./17-PUBLICATION-MODEL.md) | Modèle de publication — état, garanties, La Fabrique |
| [`00-foundation/vision.md`](../../00-foundation/vision.md) | Vision produit globale |
| [`06-RENDERER-AND-LEARNER-LAYER.md`](../contracts/06-RENDERER-AND-LEARNER-LAYER.md) | Gouvernance renderer / couche apprenant |
| [`01-TRUST-AND-FIDELITY.md`](../contracts/01-TRUST-AND-FIDELITY.md) | Fidélité au Collège |
| [`LLM_STRATEGY.md`](../LLM_STRATEGY.md) | Usage des modèles |

---

# Objectif

## Vision du Reader

Le **Reader** est l'espace de travail Lou Médecine par lequel une étudiante **comprend, consolide et s'entraîne** sur un chapitre EDN — sans jamais devenir un éditeur du Collège ni une plateforme généraliste.

Il transforme le contenu officiel — acquis, structuré et généré par le pipeline Lou — en une **expérience guidée**, entre la **bibliothèque EDN** (Couche 1) et la **couche apprenante** (Couche 3).

## Objectifs pédagogiques

Le Reader couvre la **compréhension** et la **consolidation** du chapitre. Les **banques officielles EDN** restent une étape ultérieure, hors Reader ([`00-foundation/vision.md`](../../00-foundation/vision.md)).

| Phase | Objectif | Onglets Reader |
|---|---|---|
| **Carte mentale** | Savoir de quoi parle le chapitre et comment il s'organise | Amorçage cognitif, Modèle mental |
| **Compréhension profonde** | Comprendre chaque notion et son raisonnement clinique | Notions, Cas cliniques |
| **Consolidation** | Ancrer la source, s'auto-évaluer, structurer ses fiches | Collège officiel, QCM, Notes |
| **Mastery EDN** | Entraînement au format examen | **Banques officielles EDN** — hors Reader |

## Comprendre avant mémoriser

> **Comprendre avant mémoriser.**

La progression des onglets place la **logique** avant le par cœur. QCM et Notes interviennent **après** la compréhension — jamais en substitute de celle-ci.

Comportement détaillé du parcours : [`15-READER-FUNCTIONAL-SPECIFICATION.md`](./15-READER-FUNCTIONAL-SPECIFICATION.md) §2.

---

# Principes fondamentaux

Ces principes orientent toute décision sur le Reader. Ils complètent — sans remplacer — les contrats fondamentaux.

## Comprendre avant mémoriser

Structure, ordre des onglets et densité rédactionnelle privilégient **l'explication** sur la récupération mnémonique.

## Fidélité absolue au Collège

Le Collège est la **seule autorité curriculaire médicale** ([`01-TRUST-AND-FIDELITY.md`](../contracts/01-TRUST-AND-FIDELITY.md) §1). En cas de conflit entre clarté pédagogique et fidélité, **la fidélité l'emporte**.

## L'IA complète mais ne remplace jamais le Collège

L'IA **restructure** ou **complète** à partir du contenu officiel — jamais enseignement médical autonome. Tout apport IA est **visiblement identifié**. Le modèle propose ; la vérification déterministe tranche ([`LLM_STRATEGY.md`](../LLM_STRATEGY.md)).

## Réduction de la charge cognitive

Une **idée principale** par écran. Pas de tableau de bord, pas de métriques. Langage simple ; structure prévisible.

## Priorité aux bullet points

Les listes servent la clarté. La prose dense est réservée au **walkthrough** lorsque l'enchaînement causal l'exige.

## Un onglet = un objectif cognitif

| Onglet | Question mentale |
|---|---|
| Amorçage cognitif | « Où suis-je ? De quoi parle ce chapitre ? » |
| Modèle mental | « Comment l'ensemble s'organise-t-il ? » |
| Notions | « Comment fonctionne cette notion ? » |
| Cas cliniques | « Comment cela se manifeste et se raisonne-t-il ? » |
| Collège officiel | « Que dit le texte officiel du Collège ? » |
| QCM | « Est-ce que je maîtrise le chapitre à un niveau intermédiaire ? » |
| Notes | « Qu'est-ce que je veux retenir pour moi ? » |

Pas de numérotation des onglets dans l'interface — les **intitulés** portent le sens.

## La couche apprenante est indépendante

Tout ajout personnel (overlays) forme la **Couche 3**. Elle **superpose** l'affichage ; elle ne modifie jamais le contenu officiel ([`06-RENDERER-AND-LEARNER-LAYER.md`](../contracts/06-RENDERER-AND-LEARNER-LAYER.md) §4.2, §7). Comportements : doc 15 §5.

---

# Architecture générale

```
┌─────────────────────────────────────────────────────────┐
│  Couche 3 — Couche apprenante (overlays, locale)        │
├─────────────────────────────────────────────────────────┤
│  Couche 2 — Reader (contenu officiel généré, immuable)  │
├─────────────────────────────────────────────────────────┤
│  Couche 1 — Bibliothèque EDN (navigation, catalogue)    │
└─────────────────────────────────────────────────────────┘
```

## Couche 1 — Bibliothèque EDN

Permet d'**atteindre** un chapitre ; ce n'est pas le mode de lecture.

```
EDN → Spécialité → Item — Chapitre → Reader
```

| Écran | Rôle |
|---|---|
| **Bibliothèque EDN** | Choisir une spécialité |
| **Page spécialité** | Choisir un chapitre |

Principes : un chapitre à la fois (URL) ; découverte légère ; pas de progression globale en V1. Détail : doc 15 §4.1–4.2.

## Couche 2 — Reader

**Sept onglets** à objectif cognitif fixe, ordre pédagogique :

```
Amorçage cognitif → Modèle mental → Notions → Cas cliniques
        → Collège officiel → QCM → Notes
```

| Onglet | Rôle architectural | Spécification fonctionnelle |
|---|---|---|
| Amorçage cognitif | Cadre, prérequis, résumé ultra synthétique | doc 15 §4.3 |
| Modèle mental | Schéma général ; navigation vers les notions | doc 15 §4.4 |
| Notions | Approfondissement notion par notion ; TOC | doc 15 §4.5 |
| Cas cliniques | Application clinique ; contenu hybride officiel / IA | doc 15 §4.6 |
| Collège officiel | Lecture verbatim de la source acquisition | doc 15 §4.7 |
| QCM | Auto-évaluation intermédiaire (~50 questions) | doc 15 §4.8 |
| Notes | Fiches personnelles par catégories | doc 15 §4.9 |

### Structure d'une notion (Onglet Notions)

Chaque **notion** (élément Blueprint) combine :

```
Notion
├── Figure officielle   (si publiée)
├── Walkthrough         (guide de lecture canonique)
├── Développement       (claims traçables)
└── Points d'attention  (bullets)
```

La **figure officielle** est liée par identifiant d'élément — jamais par position ([contrat 05](../contracts/05-VISUAL-GRAMMAR.md)).

### Contenu hybride (Cas cliniques, QCM, pré-requis IA)

| Priorité | Source | Identification |
|---|---|---|
| 1 | Collège / artefacts officiels | Aucun badge |
| 2 | Génération IA | Badge ou libellé explicite obligatoire |

## Couche 3 — Couche apprenante

Transversale à tous les onglets où du contenu officiel est lisible ou annotable.

| Mécanisme | Nature |
|---|---|
| Surlignage, note inline, formatage figure | Overlays sur contenu officiel |
| Schéma personnel | Image ancrée à une notion |
| Notes (onglet) | Espace structuré séparé — **pas** un overlay |

Principe : superposition, immutabilité du fond, mécanismes distincts ([ADR-005](../adr/ADR-005-learner-layer-annotation-anchoring.md)). Détail : doc 15 §5.

---

# UX — principes de navigation

Règles structurelles ; interactions détaillées : doc 15 §3.

## Fil d'Ariane permanent

```
EDN  >  [Spécialité]  >  [Item — Chapitre]  >  [Onglet courant]
```

Chaque segment parent est cliquable ; l'onglet courant ne l'est pas. Clic sur le chapitre → Amorçage cognitif.

## Barre d'onglets

- Sept intitulés sémantiques, ordre fixe, pas de sous-onglets.
- Labels dérivés du manifest ([contrat 06](../contracts/06-RENDERER-AND-LEARNER-LAYER.md) §3).

## Navigation autorisée en V1

Breadcrumb · onglets · TOC (Notions uniquement) · scroll · clic schéma Modèle mental → Notions.

## Navigation exclue en V1

Recherche in-chapter · progression dashboard · numérotation d'étapes · navigation multi-niveaux complexe.

---

# Principes de génération

S'appliquent à tout contenu Lou affiché dans le Reader (Couche 2).

| Principe | Énoncé |
|---|---|
| Priorité au contenu officiel | Reprendre avant de générer |
| Restructurer plutôt que réécrire | Bullets, titres, ordre — pas de paraphrase médicale non groundée |
| IA identifiée | Badge dès qu'un passage n'est pas verbatim officiel |
| Validation éditoriale | Points clés, objectifs, messages importants comme contraintes |
| Traçabilité | Tout énoncé médical orienté apprenant résolu vers la source ([contrat 01](../contracts/01-TRUST-AND-FIDELITY.md) §3) |
| Incertitude honnête | Retenir, signaler ou marquer incertain — jamais fausse confiance |

---

# Évolutions candidates

Objets **non décidés** — n'engagent pas le pipeline ni les contrats.

## editorial_signals

| Statut | **Candidat** |

Métadonnées éditoriales (points clés, objectifs, notions indispensables, messages importants…) réutilisables comme **contraintes de génération** et **critères de validation**. Signaux visés : réflexes transversalité, points clés, notions indispensables / inacceptables, objectifs, à retenir, messages importants.

## key_concepts

| Statut | **Hypothèse de travail** |

Objet candidate pour les concepts structurants. **Aucune décision** : Blueprint et Inventory restent les structures canoniques ([contrat 04](../contracts/04-CHAPTER-PACKAGE.md) §2.1).

---

# Glossaire

Termes utilisés dans les documents Reader (14 et 15). Un concept = un seul terme.

| Terme | Définition |
|---|---|
| **Reader** | Couche 2 — espace de travail par chapitre (sept onglets + breadcrumb) |
| **Bibliothèque EDN** | Couche 1 — navigation EDN → spécialité → chapitre |
| **Couche apprenante** | Couche 3 — contributions personnelles locales, jamais fusionnées au package officiel |
| **Overlay** | Marque visuelle superposée au contenu officiel (surlignage, formatage figure…) sans le modifier en persistance |
| **Notion** | Unité pédagogique Blueprint ; bloc structurant du chapitre |
| **Walkthrough** | Guide de lecture canonique d'une notion — prose explicative officielle générée |
| **Figure officielle** | Visuel officiel lié à une notion par identifiant d'élément |
| **Schéma général** | Figure de vue d'ensemble du chapitre (Onglet Modèle mental) |
| **Schéma personnel** | Image importée ou photographiée par l'étudiante, ancrée à une notion |
| **Note inline** | Texte court ajouté dans le flux du walkthrough — overlay, distinct des Notes |
| **Note personnelle** | Entrée de l'onglet Notes — fiche structurée par catégorie |
| **Onglet Notes** | Espace de fiches personnelles — **pas** un overlay |
| **Points d'attention** | Bullets signalant pièges, confusions ou seuils — contenu Lou groundé |
| **Banque QCM** | ~50 questions persistantes par chapitre — entraînement intermédiaire |
| **Banques officielles EDN** | Ressources d'examen hors Reader |

---

# Non-objectifs

Le Reader **n'est pas** :

| Exclusion | Précision |
|---|---|
| **LMS** | Pas de cours, pas de classes, pas de parcours imposé par un enseignant |
| **Plateforme d'examen** | Le QCM Reader est intermédiaire ; les banques EDN officielles sont hors Reader |
| **Éditeur du Collège** | Aucune modification du texte ou des figures officielles |
| **Chatbot IA** | Pas de dialogue, pas de « explique-moi » à la volée dans le lecteur |
| **Logiciel de notes généraliste** | L'onglet Notes est scoped par chapitre et par catégories pédagogiques |
| **Outil collaboratif** | Pas de partage, pas de co-édition, pas de commentaires tuteur |
| **Tableau de bord d'apprentissage** | Pas de stats, streaks, gamification en V1 |

Voir aussi : doc 15 §7 (fonctionnalités différées) et [`12-NON_GOALS.md`](./12-NON_GOALS.md) pour le renderer technique.

---

# Hors périmètre V1

Fonctionnalités **exclues** de la première version — détail comportemental : doc 15 §7.

| Domaine | Exclusion |
|---|---|
| Progression / complétion | % lu, reprise avancée |
| Statistiques | Temps passé, analytics |
| Gamification | Badges, streaks, classements |
| Navigation avancée | Recherche globale, filtres cross-chapitres |
| Inter-EDN | Pré-requis transversaux (Amorçage) |
| Banques officielles EDN | Intégration dans le Reader |
| Sync cloud / collaboration | Comptes, multi-appareils, partage |
| IA intégrée au lecteur | Chat, résumé instantané |
| Éditeur riche / surlignage dans Notes | V1 Notes = texte libre + images |
| Dark mode | Ultérieur |

---

# Annexe — Correspondance vision / implémentation actuelle

*Informative — n'engage pas la baseline v1.0.*

| Onglet Reader (baseline) | Implémentation actuelle (Item 234) |
|---|---|
| Amorçage cognitif | Partiel (en-tête + objectifs) |
| Modèle mental | Partiel (Histoire + Vue d'ensemble) |
| Notions | Proche de « Pourquoi ? » |
| Cas cliniques | Proche de « Raisonnement clinique » |
| Collège officiel | Non implémenté |
| QCM | Non implémenté |
| Notes | Non implémenté |
| Breadcrumb | Non implémenté |

Convergence : plan de migration distinct — hors scope de ce document.

---

# Historique des versions

| Version | Date | Changement |
|---|---|---|
| 0.1 | 2026-07-28 | Vision initiale — trois couches, principes, génération |
| **1.0** | 2026-07-28 | **Baseline officielle** — sept onglets alignés avec doc 15 ; glossaire ; non-objectifs ; séparation 14/15 ; gel documentaire |

---

*Baseline officielle Reader Lou Médecine v1.0. Toute évolution substantielle requiert une révision de version explicite et, si nécessaire, un ADR.*
