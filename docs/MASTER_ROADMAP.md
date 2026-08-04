# Lou Médecine — Master Roadmap

Document de pilotage officiel — **intention et séquencement produit**.

**Dernière révision :** 2026-08-04 — validation du contrat éditorial MM/Notions/Cas sur le chemin Product Freeze 234 ; plan [`editorial-prototyping-and-migration-plan.md`](plans/editorial-prototyping-and-migration-plan.md) ; chantier courant → [`PROJECT_STATE.md`](PROJECT_STATE.md).

Ce document répond à une seule question : **que cherche-t-on à obtenir, dans quel ordre, et à quelle condition saura-t-on que c'est obtenu ?**

Il ne porte **aucun statut d'avancement** — voir [`PROJECT_STATE.md`](PROJECT_STATE.md). Il ne recopie **aucune obligation technique** — voir le [référentiel normatif](#référentiel-normatif) ci-dessous.

**Organisation du pilotage :** [`governance/DOCUMENT_ARCHITECTURE.md`](governance/DOCUMENT_ARCHITECTURE.md)

**Arbitrage documentaire** ([`contracts/00-INDEX.md`](contracts/00-INDEX.md) §1) : en cas de conflit de **priorités**, ce document prime ; en cas de conflit de **comportement**, la hiérarchie normative (ADR → contrats → specs) prime.

---

## Mission et vision

### Objectif du projet

Transformer les Collèges officiels EDN en supports d'étude qui permettent de **comprendre avant de mémoriser**, sans jamais altérer le contenu médical source.

### Vision long terme

Lou ouvre une application de lecture locale et accède à **n'importe quel chapitre de l'ensemble des Collèges EDN**. Pour chaque chapitre, elle retrouve le contenu officiel, la couche de compréhension, les schémas, les guides de lecture, les points d'attention, ses annotations personnelles et l'ensemble des fonctionnalités du Reader.

À terme, le contenu pédagogique est **produit industriellement** à partir des Collèges officiels, avec un effort humain minimal par chapitre — voir objectif [Industrialisation de la Fabrique productrice](#industrialisation-de-la-fabrique-productrice) et [`LLM_STRATEGY.md`](LLM_STRATEGY.md).

### Principe directeur

La couche de compréhension (Inventory → Blueprint → Projections) vient **après** et **en plus** du contenu officiel. Elle ne le remplace pas. Ce principe est **archétype-dépendant** : il produit le plus de valeur sur les chapitres mécanistiques et normatifs complexes ; sur d'autres archétypes, le projet accepte un profil de projections allégé plutôt qu'un échafaudage artificiel.

Les obligations de fidélité, de traçabilité et de séparation officiel / généré sont définies dans les [contrats fondamentaux](contracts/00-INDEX.md) et les [ADR](adr/README.md).

---

## Progression V1

Synthèse des jalons structurants — détail opérationnel dans [`PROJECT_STATE.md`](PROJECT_STATE.md).

| Jalon | Statut |
|---|---|
| Gouvernance et contrats fondamentaux | ✅ Clôturé |
| La Fabrique (pipeline validateur lou-build) | ✅ Clôturé — tag `lou-build-pipeline-v1` |
| Reader Composition V1 (Lots A–F) | ✅ Clôturé — audit indépendant ✅ Conforme ; tag `reader-composition-v1` |
| **Reader Acceptance V1** | ✅ **Clôturé** — prononcé 2026-08-02 ; tag `reader-acceptance-v1` |
| **Product Polish V1 / Annotation UI Freeze V1** | ✅ **Clôturé** — prononcé 2026-08-03 ; tag `reader-ui-freeze-v1` ; UI annotation gelée |
| **SVG Highlight Bridge V1** | ✅ **Clôturé** — prononcé 2026-08-03 ; tag `svg-highlight-bridge-v1` ; highlights SVG RPC 234 |
| **Graphical Learning Layer V1 (annotations SVG — MVP)** | ✅ **Livré** — highlights SVG via Highlight V2 + LouInlineFormatting ; UI toolbar contextuelle |
| **Graphical Learning Layer V1 (conception élargie)** | ⏸ **En attente** — figures SVG contenu de première classe (hors annotations MVP) |
| **Reference Product Chapter (234)** — contrat éditorial cible | ⏳ En attente — validation Lou (MM · Notions · Cas conjoints) avant poursuite intégration éditoriale — [plan](plans/editorial-prototyping-and-migration-plan.md) |
| **Product Review 234** (Phase 7) | ⏳ En attente — chapitre utilisable ; **usage réel Lou** dans le Reader |
| **Product Freeze 234** (Phase 8) | ⏳ En attente — après Product Review |
| **Reference Production Chapter (224)** (Phase 9) | ⏳ En attente — **après Product Freeze 234** |
| **Capitalisation industrielle (post-224)** | ⏳ En attente — après Reference Production Chapter 224 |
| **Validation Corpus V1 (Fabrique)** | ⏳ En attente — **après validation complète du 224** |
| **Choix chapitres suivants (230 ou autre)** | ⏳ En attente — après Validation Corpus V1 |
| **Validation pédagogique Lou** | ⏳ En attente — conditionnée par Validation Corpus V1 |
| **Industrialisation EDN** | ⏳ En attente |

**Distinction obligatoire :** la clôture **Reader Composition V1** ne signifiait **pas** que le Reader était terminé. L'objectif [Acceptation Reader V1](#acceptation-reader-v1) est **clôturé** depuis le 2026-08-02.

**Principe de pilotage post-acceptation :** *Observer d'abord. Généraliser ensuite.* — le Item **234** est le **laboratoire produit**. **Dépendance éditoriale :** la validation du contrat cible MM · Notions · Cas avec Lou **précède** toute poursuite de l'intégration éditoriale du 234 — [`plans/editorial-prototyping-and-migration-plan.md`](plans/editorial-prototyping-and-migration-plan.md). **Intention RPC Phases 0–9 :** [§ Roadmap opérationnelle](#roadmap-opérationnelle--reference-product-chapter-234) · [`docs/rpc/`](rpc/00-RPC-METHODOLOGY.md). **Activité courante :** [`PROJECT_STATE.md`](PROJECT_STATE.md).

### Séquence produit cible (post-Reader Acceptance)

```
Reader Acceptance V1 ✅
        ↓
Product Polish V1 / Annotation UI Freeze V1 ✅
        ↓
SVG Highlight Bridge V1 ✅
        ↓
Phase 0 migration — baseline et gate              ← prérequis ([gate](analysis/phase-0-baseline-gate-2026-08-04.md))
        ↓
Validation contrat éditorial (MM · Notions · Cas) ← avant intégration éditoriale 234
        ↓
Conception modèle technique cible               ← après gate sortie prototypage
        ↓
Intégration éditoriale Reader (RPC Phases 2–6)    ← après contrat validé
        ↓
Product Review (Phase 7) → Product Freeze (Phase 8)
        ↓
Reference Production Chapter (224) — Phase 9
        ↓
Capitalisation industrielle → Validation Corpus V1 → …
```

**Migration technique** (chaîne parallèle, bascule) : **conditionnée** par les gates Phase 0 — [`phase-0-baseline-gate-2026-08-04.md`](analysis/phase-0-baseline-gate-2026-08-04.md). **Lots et gates détaillés :** [`plans/editorial-prototyping-and-migration-plan.md`](plans/editorial-prototyping-and-migration-plan.md).

Le chemin critique effectif et la **phase courante** sont constatés dans [`PROJECT_STATE.md`](PROJECT_STATE.md).

---

## Roadmap opérationnelle — Reference Product Chapter (234)

**Intention** Phases 0–9 — séquencement historique RPC vers [Product Freeze 234](#product-freeze-234). **Lots détaillés :** [`plans/editorial-prototyping-and-migration-plan.md`](plans/editorial-prototyping-and-migration-plan.md). **Activité et blocages :** [`PROJECT_STATE.md`](PROJECT_STATE.md). **Réserves baseline :** [`phase-0-baseline-gate-2026-08-04.md`](analysis/phase-0-baseline-gate-2026-08-04.md).

### Dépendances éditoriales (prototypage et migration)

Sur le chemin du Product Freeze, le contrat éditorial cible (Modèle mental · Notions · Cas cliniques, **conçus conjointement**) doit être **validé avec Lou** avant toute poursuite de l'intégration éditoriale du 234 dans le Reader.

| Élément | Règle (intention) |
|---|---|
| **Plan d'exécution** | [`plans/editorial-prototyping-and-migration-plan.md`](plans/editorial-prototyping-and-migration-plan.md) — lots, gates, ordre prototypage |
| **MM intégré (RPC Phase 1)** | Acquis technique **baseline historique** — **non** contrat éditorial cible validé |
| **Intégration RPC Phases 2–4** | **Conditionnée** par validation du contrat global MM/Notions/Cas |
| **Migration technique** | **Conditionnée** par satisfaction des gates Phase 0 ([gate](analysis/phase-0-baseline-gate-2026-08-04.md)) |

### Principes de pilotage

| Principe | Application |
|---|---|
| **Produit avant technique** | Le projet est piloté par le **produit** et les **7 vues Reader**, pas par les anciens lots Reader Acceptance (D1, D2, D4, D6, AP-A…AP-F). Ces lots sont **clôturés** — acquis historiques, **plus le chemin critique opérationnel**. |
| **234 = laboratoire produit** | Découvrir le **meilleur produit** pour Lou ; le coût **ne pilote pas** les choix éditoriaux. |
| **224 = laboratoire industriel** | Découvrir la **meilleure méthode industrielle** — Phase 9 uniquement, après Product Freeze. |
| **Audit = checklist** | Les constats de [`docs/analysis/rpc-234-execution-audit.md`](analysis/rpc-234-execution-audit.md) servent de **checklist d'implémentation**, pas de roadmap. |

### Phases 0–9

| Phase | Intitulé | Focus | Vues Reader concernées |
|---|---|---|---|
| **0** | Compléter la chaîne Fabrique → Reader | Build entièrement automatique ; aucun manifest manuel ; aucun copier/coller ; aucun traitement spécifique au 234 ; fixture synchronisée ; Stage G compatible `mental_model` / `visual-spec` | Transversal — prérequis toutes vues |
| **1** | Modèle mental | Figure ; walkthrough ; UX minimale ; navigation | Modèle mental — acquis RPC Phase 1 = **baseline historique** ; contrat cible soumis à validation Lou |
| **2** | Amorçage cognitif | Contenu et expérience Amorçage | Amorçage cognitif — intégration **après** validation contrat vues prioritaires |
| **3** | Notions | 11 notions ; figures ; walkthroughs ; développements ; points d'attention | Notions — conception **conjointe** avec MM et Cas (prototypage) |
| **4** | Cas cliniques | Scénarios cliniques jouables | Cas cliniques — conception **conjointe** avec MM et Notions (prototypage) |
| **5** | Collège officiel + Notes | Texte source officiel ; notes apprenant | Collège officiel · Notes |
| **6** | Validation intégrée | validate/build ; parcours complet 7 vues ; fixture CI | Les 7 vues |
| **7** | Product Review avec Lou | Usage **réel** dans le Reader ; retour valeur pédagogique | Les 7 vues |
| **8** | Corrections + Product Freeze | Itérations ciblées ; gel produit 234 | — |
| **9** | Reference Production Chapter (224) | Reprend produit figé ; mesure coûts/temps/LLM ; optimise **méthode**, pas produit | — |

**Séquence RPC historique** (intention — prototypage MM/Notions/Cas : [plan](plans/editorial-prototyping-and-migration-plan.md)) :

```
Phase 0 — Fabrique → Reader                    ← clôturée (acquis)
        ↓
Phase 1 — Modèle mental (intégration Reader)   ← clôturée — baseline historique
        ↓
Phase 2 — Amorçage cognitif
        ↓
Phase 3 — Notions
        ↓
Phase 4 — Cas cliniques
        ↓
Phase 5 — Collège officiel + Notes
        ↓
Phase 6 — Validation intégrée
        ↓
Phase 7 — Product Review avec Lou
        ↓
Phase 8 — Corrections + Product Freeze
        ↓
Phase 9 — Reference Production Chapter (224)
        ↓
Capitalisation industrielle → Validation Corpus V1 → …
```

**Modèle produit de référence :** [`renderer/00-READER-V1-PRODUCT-MODEL.md`](renderer/00-READER-V1-PRODUCT-MODEL.md) · **Plan d'exécution prototypage :** [`plans/editorial-prototyping-and-migration-plan.md`](plans/editorial-prototyping-and-migration-plan.md).

---

## Graphical Learning Layer V1

| | |
|---|---|
| **Nature** | Couche transversale Reader V1 — figures pédagogiques SVG |
| **Question directrice** | Comment traiter les **SVG comme contenu pédagogique de première classe** — production, consommation, zoom, intégration walkthrough — sans dégrader la chaîne Fabrique → Reader ? |
| **Statut** | **Annotations SVG MVP livré** (SVG Highlight Bridge V1) ; **conception élargie en attente** |
| **Positionnement** | Bridge annotations clôturé après [Annotation UI Freeze V1](#acquis) ; le périmètre figures/zoom/walkthrough reste à concevoir avant tout lot d'implémentation supplémentaire |

**Livré (MVP annotations — SVG Highlight Bridge V1) :**

- highlights sur texte SVG via moteur Highlight V2 unique ;
- backend LouInlineFormatting (`backgroundColor`) ;
- toolbar contextuelle (couleurs + gomme ; G/S/B masqués sur SVG) ;
- validation RPC 234 — création, couleur, effacement, restauration ; non-régression HTML.

**Périmètre V1 restant (conception — non ouvert) :**

- modèle conceptuel des figures pédagogiques dans le Reader ;
- relation figures ↔ walkthroughs ↔ projections ;
- contraintes de production (Stage G, grammaire SVG) ;
- critères de qualité et de non-régression visuelle ;
- frontières avec l'UI annotation (gelée) et Composition V1.

**Hors périmètre immédiat :**

- refonte toolbar ou annotation HTML (gelée) ;
- nouvelles vues Reader ;
- migration patrimoine apprenant ;
- formats SVG typographiques G/S/B (non implémentés — masqués dans l'UI).

**Critère de sortie (conception élargie) :**

- architecture documentée et validée par le propriétaire ;
- décisions de conception traçables ;
- lots d'implémentation **non ouverts** tant que la conception n'est pas clôturée.

**Plan d'exécution :** voir [`PROJECT_STATE.md`](PROJECT_STATE.md) § Chantiers en cours.

---

## Périmètre et exclusions

Lou Médecine ne cherche **pas** à :

| Exclusion | Référence |
|---|---|
| Créer un nouveau contenu médical — le Collège reste l'autorité | Contrat 01, [ADR-003](adr/ADR-003-single-source-of-truth.md) |
| Remplacer le Collège officiel | Contrat 01, Contrat 06 |
| Construire un assistant conversationnel médical généraliste | [PDR-A1](governance/PRODUCT-DECISION-REGISTRY.md) |
| Devenir un SaaS ou une plateforme multi-utilisateurs | [PDR-G2](governance/PRODUCT-DECISION-REGISTRY.md) |
| Optimiser les coûts au détriment de la fidélité | Contrat 01 |
| Introduire la répétition espacée ou la gamification sociale en Reader V1 | [PDR-G1](governance/PRODUCT-DECISION-REGISTRY.md), [PDR-G2](governance/PRODUCT-DECISION-REGISTRY.md) |
| Exporter en PDF en V1 | [PDR-D10](governance/PRODUCT-DECISION-REGISTRY.md) |

**Inclus dans le périmètre Reader V1 et du package de référence :** QCM et cas cliniques au niveau chapitre ([PDR-A3](governance/PRODUCT-DECISION-REGISTRY.md), [PDR-B5](governance/PRODUCT-DECISION-REGISTRY.md)) — distincts de la répétition espacée différée.

**Qualification Fabrique V1 ([PDR-C8](governance/PRODUCT-DECISION-REGISTRY.md)) :** Validation Corpus V1 qualifie la Fabrique pour les chapitres pathologiques à **dominante mécanistique** uniquement. **Hors périmètre V1 :** contenus normatifs, interprétatifs et interventionnels — relèvent d'un futur Validation Corpus V2 multi-collèges.

Toute proposition qui entre dans les exclusions ci-dessus est **hors roadmap**, même si elle paraît séduisante techniquement.

---

## Référentiel normatif

Ce document **ordonne** ; il n'**oblige** pas. Pour savoir ce qui doit être vrai :

| Besoin | Document maître |
|---|---|
| Décisions architecturales fondatrices | [Index ADR](adr/README.md) |
| Obligations métier durables | [Contrats fondamentaux 01–09](contracts/00-INDEX.md) |
| Architecture éditoriale gelée (contrats 07–09) | [Contrats 07–09](contracts/00-INDEX.md), tag `editorial-architecture-v1` |
| Obligations composants (Tool, Composition, Renderer, …) | [Contrats composants](contracts/components/00-INDEX.md) |
| Architecture Reader et Fabrique (specs gelées) | [`contracts/00-INDEX.md` §6](contracts/00-INDEX.md) → docs [14–19](renderer/README.md) |
| Mémoire des arbitrages produit (audit 2026-07-30) | [`PRODUCT-DECISION-REGISTRY.md`](governance/PRODUCT-DECISION-REGISTRY.md) |
| Patrimoine, packages publiés, lignée éditoriale | [ADR-006](adr/ADR-006-pedagogical-patrimony-and-edition-lineage.md) |
| Stratégie LLM | [`LLM_STRATEGY.md`](LLM_STRATEGY.md) |
| Chaîne d'acquisition officielle | [`SOURCE_OF_TRUTH.md`](SOURCE_OF_TRUTH.md), [ADR-004](adr/ADR-004-acquisition-architecture-frozen.md) |
| Organisation du pilotage documentaire | [`DOCUMENT_ARCHITECTURE.md`](governance/DOCUMENT_ARCHITECTURE.md) |

---

## Livrables de référence

Un livrable de référence n'est **pas** une phase du projet. C'est un **artefact structurant** — nœud de convergence vers lequel plusieurs chantiers convergent, et à partir duquel plusieurs validations se débloquent.

L'**instance courante** de chaque rôle est enregistrée dans [`PROJECT_STATE.md`](PROJECT_STATE.md). La première instance du package de capitalisation est actée dans [PDR-B2](governance/PRODUCT-DECISION-REGISTRY.md).

### Package de capitalisation de référence → Reference Product Chapter (234)

Premier **Chapter Package complet** publié et versionné (Item **234** — Insuffisance cardiaque, édition Collège 2022, Release `complete`), produit par capitalisation contrôlée.

**Évolution de pilotage (2026-08-02) :** ce package reste l'instance technique de référence ([PDR-B2](governance/PRODUCT-DECISION-REGISTRY.md)). Le projet le traite comme **Reference Product Chapter** — **laboratoire produit** : produire toutes les vues, toutes les notions et toutes les figures pédagogiquement utiles ; viser le meilleur produit pour Lou. **L'optimisation de la production** (coûts, prompts, pipelines, standards) relève exclusivement du **Reference Production Chapter (224)**, après Product Freeze.

**Consommateurs (inchangés sur le plan normatif) :**

- acceptation Reader V1 ([PDR-B1](governance/PRODUCT-DECISION-REGISTRY.md)) ;
- référence produit figée post-freeze ;
- validation pédagogique de la méthode ([PDR-B4](governance/PRODUCT-DECISION-REGISTRY.md)) ;
- fixture de non-régression Fabrique et CI ([PDR-B2](governance/PRODUCT-DECISION-REGISTRY.md), [PDR-G6](governance/PRODUCT-DECISION-REGISTRY.md)) ;
- base de la lignée éditoriale ([ADR-006](adr/ADR-006-pedagogical-patrimony-and-edition-lineage.md), [PDR-C7](governance/PRODUCT-DECISION-REGISTRY.md)).

### Reference Production Chapter (224)

Item **224** — Hypertension artérielle — édition Collège 2022. **Premier chapitre produit entièrement par la méthode industrielle** — démarre **uniquement après** le Product Freeze du 234.

**Mission :** reprendre le **produit figé** du 234 ; produire le chapitre 224 entièrement ; **mesurer** temps humain, appels LLM et coûts ; **optimiser la méthode de production** (prompts, pipelines, standards réutilisables) — **pas le produit**.

### Fixture de non-régression

Artefact dérivé du package de capitalisation de référence, utilisé pour garantir que les évolutions de La Fabrique et du Reader ne dégradent pas un package publié conforme.

---

## Objectifs du projet

Chaque objectif porte une **nature** qui détermine sa rejouabilité. Les critères de sortie sont **falsifiables** ; l'atteinte effective est constatée dans [`PROJECT_STATE.md`](PROJECT_STATE.md).

### Capitalisation d'un package de référence complet

| | |
|---|---|
| **Nature** | Capitalisation répétable (première instance = pilote cardiologie) |
| **Question directrice** | Comment produire le premier Chapter Package complet de référence, conforme aux gates, par capitalisation contrôlée ? |
| **Décisions** | [PDR-B2](governance/PRODUCT-DECISION-REGISTRY.md), [PDR-B3](governance/PRODUCT-DECISION-REGISTRY.md), [PDR-C2](governance/PRODUCT-DECISION-REGISTRY.md) |

**Critère de sortie :**

- Chapter Package **complet** publié et versionné (inventaire, blueprint, projections, QCM/cas, texte source, priming, visuels requis) ;
- tous les gates lou-build en succès sur ce package ;
- réconciliation exhaustive documentée ;
- tranche verticale historique remplacée comme jalon produit — la tranche reste un support de développement, pas un jalon d'acceptation ([PDR-B3](governance/PRODUCT-DECISION-REGISTRY.md)).

**Hors périmètre de cet objectif :** automatisation runtime complète de la production (objectif ultérieur) ; acceptation Reader (objectif distinct, bloquée à l'acceptation) ; réutilisation du corpus SVG legacy pour de nouveaux packages publiés ([PDR-F1](governance/PRODUCT-DECISION-REGISTRY.md), [ADR-001](adr/ADR-001-freeze-svg-grammar-catalogue.md)).

**Plan d'exécution détaillé :** voir [`PROJECT_STATE.md`](PROJECT_STATE.md) et les plans de domaine.

---

### Acceptation Reader V1

| | |
|---|---|
| **Nature** | Fondation unique (première version produit Reader) |
| **Question directrice** | Le Reader permet-il à Lou d'étudier un Chapter Package complet dans des conditions d'usage réelles ? |
| **Décisions** | [PDR-B1](governance/PRODUCT-DECISION-REGISTRY.md), [PDR-B5](governance/PRODUCT-DECISION-REGISTRY.md), [PDR-D1](governance/PRODUCT-DECISION-REGISTRY.md)–[PDR-D7](governance/PRODUCT-DECISION-REGISTRY.md), [PDR-D9](governance/PRODUCT-DECISION-REGISTRY.md) |

**Critère de sortie :**

- Reader **local installable**, autonome, hors dépôt Git ([PDR-D1](governance/PRODUCT-DECISION-REGISTRY.md)) ;
- **7 vues alimentées** par le package de capitalisation de référence — pas de Reader V1 fonctionnellement réduit ([PDR-B5](governance/PRODUCT-DECISION-REGISTRY.md)) ;
- mode **hors ligne** intégral sur les packages installés ([PDR-D2](governance/PRODUCT-DECISION-REGISTRY.md)) ;
- **reprise de session** opérationnelle ([PDR-D4](governance/PRODUCT-DECISION-REGISTRY.md)) ;
- **sauvegarde et restauration** des données d'apprentissage ([PDR-E5](governance/PRODUCT-DECISION-REGISTRY.md)) ;
- recherche textuelle locale au chapitre ouvert ([PDR-D6](governance/PRODUCT-DECISION-REGISTRY.md)) ;
- préférences d'affichage de base ([PDR-D7](governance/PRODUCT-DECISION-REGISTRY.md)) ;
- architecture **sync-ready** ; sync automatique différée post-V1 ([PDR-D3](governance/PRODUCT-DECISION-REGISTRY.md), [PDR-G5](governance/PRODUCT-DECISION-REGISTRY.md)).

**Hors périmètre V1 :** répétition espacée, recherche globale bibliothèque, export PDF, sync automatique, indicateur de progression élaboré ([PDR-D5](governance/PRODUCT-DECISION-REGISTRY.md), [PDR-G1](governance/PRODUCT-DECISION-REGISTRY.md), [PDR-G4](governance/PRODUCT-DECISION-REGISTRY.md)).

**Plan d'exécution détaillé :** [`releases/reader-acceptance-v1-publication.md`](releases/reader-acceptance-v1-publication.md).

---

### Reference Product Chapter (234)

| | |
|---|---|
| **Nature** | Finalisation produit — première instance |
| **Question directrice** | Le chapitre **234 existant** offre-t-il la **meilleure expérience produit** possible — contenu pédagogique, figures, walkthroughs, 7 vues Reader, UX ? |
| **Statut normatif** | **Aucun** avant Product Freeze — pilotage [`docs/rpc/`](rpc/00-RPC-METHODOLOGY.md) |

**Méthodologie :** recertification artefact par artefact — **conserver**, **adapter** ou **remplacer**. Le 234 est un **laboratoire produit** : le coût **ne pilote pas** les choix éditoriaux.

**Principes de production (234) :**

- produire **toutes les vues** Reader prévues ;
- produire **toutes les notions** prévues, avec walkthroughs complets ;
- produire **toutes les figures** jugées pédagogiquement utiles ;
- accepter une **légère surproduction** pour observer ce qui apporte de la valeur ;
- ne **pas** calibrer prompts ni pipeline sur le 234.

**Critère de sortie (pilotage) :**

- Item **234** recertifié selon la vision produit des **7 vues Reader** ([`00-READER-V1-PRODUCT-MODEL.md`](renderer/00-READER-V1-PRODUCT-MODEL.md)) ;
- écarts produit traités (contenu éditorial, figures, schémas, walkthroughs) avec traçabilité des décisions ;
- chapitre **réellement utilisable** par Lou dans le Reader — prêt pour **Product Review**.

**Hors périmètre :** mesure de coûts, optimisation prompts/pipelines, standards industriels — → Reference Production Chapter (224).

**Plan d'exécution détaillé :** [`plans/editorial-prototyping-and-migration-plan.md`](plans/editorial-prototyping-and-migration-plan.md) · [Roadmap opérationnelle RPC 234](#roadmap-opérationnelle--reference-product-chapter-234) · [`PROJECT_STATE.md`](PROJECT_STATE.md).

---

### Product Review 234

| | |
|---|---|
| **Nature** | Validation produit — **utilisation réelle** par Lou |
| **Question directrice** | Le Reference Product Chapter, utilisé **réellement** dans le Reader, apporte-t-il la **valeur pédagogique** attendue ? |

**Déclencheur :** le chapitre est **réellement utilisable** dans le Reader (7 vues alimentées, parcours d'étude possible).

**Critère de sortie :**

- Lou a **étudié** le chapitre 234 recertifié via le Reader (session(s) réelle(s)) ;
- retour explicite sur ce qui **apporte de la valeur** pédagogique — et ce qui ne justifie pas sa place ;
- décision propriétaire : *valider pour Product Freeze* / *itérer* (périmètre nommé).

**Rôle :** préparer le **Product Freeze** — pas mesurer le coût de production (réservé au 224).

**Bloquant pour :** [Product Freeze 234](#product-freeze-234).

---

### Product Freeze 234

| | |
|---|---|
| **Nature** | Gel produit unique (première instance RPC) |
| **Question directrice** | Le Reference Product Chapter 234 est-il **figé** comme référence produit du projet ? |

**Critère de sortie :**

- verdict **Product Freeze** prononcé par le propriétaire ;
- enseignements produit capitalisés ;
- **seulement alors** : ouverture du **Reference Production Chapter (224)**.

**Principe :** *Observer d'abord. Généraliser ensuite.* — le produit se fige sur 234 ; l'industrialisation démarre sur 224.

**Bloquant pour :** [Reference Production Chapter (224)](#reference-production-chapter-224).

---

### Reference Production Chapter (224)

| | |
|---|---|
| **Nature** | Industrialisation production — première instance mesurée |
| **Question directrice** | La méthode **reproduit-elle** le produit figé du 234 sur un chapitre entier, avec coûts et temps **mesurés**, et génère-t-elle des **standards de production** réutilisables ? |

**Positionnement :** **uniquement après** [Product Freeze 234](#product-freeze-234). Item **224** — Hypertension artérielle — archétype de production industrielle.

**Critère de sortie :**

- chapitre 224 produit de bout en bout à partir du **produit figé** du 234 ;
- coûts réels, temps humains et consommation LLM **documentés** ;
- prompts, pipelines et stratégies de génération **optimisés** (méthode, pas contenu) ;
- standards de **production** réutilisables identifiés pour les futurs chapitres.

**Bloquant pour :** [Capitalisation industrielle (post-224)](#capitalisation-industrielle-post-224).

---

### Capitalisation industrielle (post-224)

| | |
|---|---|
| **Nature** | Capitalisation Fabrique — première instance |
| **Question directrice** | Quels enseignements de **production** tirer du Reference Production Chapter 224 ? |

**Critère de sortie :**

- synthèse documentée des coûts, patterns et standards observés sur 224 ;
- entrées actionnables pour Validation Corpus V1 ;
- **sans** créer de nouvelle norme avant qualification Fabrique.

**Positionnement :** immédiatement après validation complète du 224 ; avant Validation Corpus V1.

---

### Capitalisation produit (post-freeze 234)

| | |
|---|---|
| **Nature** | Capitalisation produit — première instance |
| **Question directrice** | Quels enseignements **produit** tirer du Reference Product Chapter figé ? |

**Critère de sortie :**

- synthèse documentée des décisions, écarts et patterns produit observés sur 234 ;
- entrées pour le Reference Production Chapter 224.

**Positionnement :** immédiatement après Product Freeze 234 ; en parallèle de l'ouverture du chantier 224.

---

### Qualification corpus Fabrique V1 (Validation Corpus V1)

| | |
|---|---|
| **Nature** | Capitalisation répétable (par archétype — pilote cardiologie mécanistique) |
| **Question directrice** | La Fabrique produit-elle de manière reproductible des chapitres archétypés représentatifs, au-delà du Reference Product Chapter figé et du Reference Production Chapter validé ? |
| **Décisions** | [PDR-C8](governance/PRODUCT-DECISION-REGISTRY.md), [PDR-C2](governance/PRODUCT-DECISION-REGISTRY.md) |

**Positionnement :** **uniquement après validation complète du Reference Production Chapter (224)**. Le Item 234 reste la référence **produit** figée ; le 224 valide la **méthode de production**. Les chapitres suivants (dont **230**) seront choisis **après** retour d'expérience — **aucune décision officielle sur 230 à ce stade**.

**Critère de sortie :**

- Item **234** demeure le Reference Product Chapter figé ;
- Item **224** valide la reproductibilité de production ([PDR-C8](governance/PRODUCT-DECISION-REGISTRY.md)) ;
- qualification Fabrique prononcée pour la portée mécanistique ;
- choix explicite des chapitres suivants (230 ou autre).

**Hors périmètre :** familles normative, interprétative et interventionnelle (Validation Corpus V2) ; validation pédagogique Lou (objectif distinct, ultérieur).

**Plan d'exécution détaillé :** [`acquisition/industrialization-plan.md`](acquisition/industrialization-plan.md) § Phase A.0 — **séquence pilotage** : voir diagramme § Progression V1.

---

### Validation pédagogique de la méthode

| | |
|---|---|
| **Nature** | Fondation unique (validation produit unique — non rejouée par chapitre) |
| **Question directrice** | La méthode enseigne-t-elle réellement mieux, sur un **corpus qualifié** par Validation Corpus V1 ? |
| **Décisions** | [PDR-B4](governance/PRODUCT-DECISION-REGISTRY.md), [PDR-C8](governance/PRODUCT-DECISION-REGISTRY.md) |

**Critère de sortie :**

- Validation Corpus V1 **prononcée** ([PDR-C8](governance/PRODUCT-DECISION-REGISTRY.md)) ;
- Lou confirme la compréhension via le Reader sur le corpus qualifié ;
- décision écrite et datée : *poursuivre* / *poursuivre avec modification nommée* / *modifier la méthode avant l'échelle* ;
- les sept vues ont été utilisées ; QCM et cas ont été expérimentés.

**Hors périmètre :** validation humaine systématique de chaque chapitre produit — la production courante repose sur les gates automatiques ([PDR-C3](governance/PRODUCT-DECISION-REGISTRY.md)).

---

### Patrimoine, publication et données d'apprentissage

| | |
|---|---|
| **Nature** | Maintenance permanente (transversal) |
| **Question directrice** | Comment garantir zéro perte et une identité stable des packages publiés et des données d'apprentissage ? |
| **Décisions** | [ADR-006](adr/ADR-006-pedagogical-patrimony-and-edition-lineage.md), [PDR-E1](governance/PRODUCT-DECISION-REGISTRY.md)–[PDR-E6](governance/PRODUCT-DECISION-REGISTRY.md) |

**Critère de sortie (V1) :**

- les trois patrimoines gouvernés selon leurs règles respectives ([PDR-E2](governance/PRODUCT-DECISION-REGISTRY.md), [ADR-006](adr/ADR-006-pedagogical-patrimony-and-edition-lineage.md) §1) ;
- identité versionnée des packages ; publication atomique ; ancrage des données à une version de package ([PDR-E3](governance/PRODUCT-DECISION-REGISTRY.md), [PDR-E4](governance/PRODUCT-DECISION-REGISTRY.md), [ADR-006](adr/ADR-006-pedagogical-patrimony-and-edition-lineage.md) §2–§3) ;
- sauvegarde et restauration sans perte ; aucune opération destructive silencieuse ([PDR-E1](governance/PRODUCT-DECISION-REGISTRY.md), [PDR-E5](governance/PRODUCT-DECISION-REGISTRY.md)).

Cet objectif avance **en parallèle** de la capitalisation et du Reader ; ses critères V1 sont vérifiés conjointement à l'acceptation Reader.

---

### Premier diff éditorial

| | |
|---|---|
| **Nature** | Extension répétable (première instance = même item, nouvelle édition Collège) |
| **Question directrice** | Comment industrialiser la comparaison entre deux éditions successives d'un même chapitre ? |
| **Décisions** | [PDR-C7](governance/PRODUCT-DECISION-REGISTRY.md), [PDR-G3](governance/PRODUCT-DECISION-REGISTRY.md) |

**Critère de sortie (première instance) :**

- package de la nouvelle édition publié ;
- artefact de comparaison fiable produit par La Fabrique ;
- Reader consomme la comparaison (UI simple — pas de comparaison avancée initialement).

---

### Industrialisation de la Fabrique productrice

| | |
|---|---|
| **Nature** | Fondation unique puis extension répétable |
| **Question directrice** | Comment produire des chapitres suivants via une chaîne largement autonome, sans capitalisation manuelle intégrale ? |
| **Décisions** | [PDR-C1](governance/PRODUCT-DECISION-REGISTRY.md), [PDR-C2](governance/PRODUCT-DECISION-REGISTRY.md), [PDR-C3](governance/PRODUCT-DECISION-REGISTRY.md), [PDR-C5](governance/PRODUCT-DECISION-REGISTRY.md), [PDR-C8](governance/PRODUCT-DECISION-REGISTRY.md) |

**Décision d'industrialisation :** verdict explicite du propriétaire du projet — **après** Validation Corpus V1 et validation pédagogique Lou — de passer ou non au runtime autonome et à la montée en charge.

**Critère de sortie (première étape) :**

- au moins un chapitre suivant produit de bout en bout via runtime LLM avec gates automatiques, sans capitalisation manuelle intégrale ;
- coût et effort humain par chapitre **mesurés** ;
- le modèle de publication du package de capitalisation de référence est reproduit.

**Hors périmètre immédiat :** scale-out massif avant clôture Validation Corpus V1 et validation de la méthode ([PDR-C8](governance/PRODUCT-DECISION-REGISTRY.md), [PDR-B4](governance/PRODUCT-DECISION-REGISTRY.md)).

**Plan d'exécution détaillé :** [`acquisition/industrialization-plan.md`](acquisition/industrialization-plan.md).

---

### Couverture Cardio complète

| | |
|---|---|
| **Nature** | Extension répétable (premier collège pilote) |
| **Question directrice** | Comment produire l'ensemble du Collège de cardiologie avec couche de compréhension, industriellement ? |
| **Décisions** | [PDR-C4](governance/PRODUCT-DECISION-REGISTRY.md) (périmètre pilote) |

**Critère de sortie :**

- tous les chapitres cardio publiés (projections, visuels, traçabilité) ;
- effort humain par chapitre **minimal** — mesuré ;
- coût par chapitre **mesuré et stable** ;
- Lou révise le cardio dans l'outil, pas dans le Collège papier.

---

### Couverture EDN

| | |
|---|---|
| **Nature** | Extension répétable |
| **Question directrice** | Comment porter la méthode à l'ensemble du programme EDN (~360 items) ? |
| **Décisions** | [PDR-C4](governance/PRODUCT-DECISION-REGISTRY.md) |

**Critère de sortie (première étape) :**

- un **second collège** (dissemblance maximale avec la cardio) produit de bout en bout ;
- effort humain **minimal**, schéma d'Inventory stable — conforme [`04-CHAPTER-PACKAGE.md`](contracts/04-CHAPTER-PACKAGE.md) et objectif [Industrialisation de la Fabrique productrice](#industrialisation-de-la-fabrique-productrice) ;
- métriques publiées dans [`PROJECT_STATE.md`](PROJECT_STATE.md).

**Hors périmètre :** lancer plusieurs collèges en parallèle avant validation du second.

---

### Interface Admin et exploitabilité Fabrique

| | |
|---|---|
| **Nature** | Fondation unique (première interface opérateur) |
| **Question directrice** | Comment permettre au mainteneur d'exploiter La Fabrique sans commandes ad hoc ? |
| **Décisions** | [PDR-C6](governance/PRODUCT-DECISION-REGISTRY.md) |

**Critère de sortie :**

- interface Admin légère, client des interfaces officielles Lou Build ;
- périmètre : import Collège, lancement fabrication, suivi stages, publication, archivage/restauration ;
- CLI conservée comme interface de secours et CI.

**Positionnement :** post-package de référence, avant montée en charge des chapitres cardio suivants ([PDR-C6](governance/PRODUCT-DECISION-REGISTRY.md)).

---

### Régime éditorial permanent

| | |
|---|---|
| **Nature** | Maintenance permanente |
| **Question directrice** | Comment maintenir le corpus à jour lors des nouvelles éditions Collège, sans repasser en mode projet ? |
| **Décisions** | [PDR-G3](governance/PRODUCT-DECISION-REGISTRY.md), [ADR-006](adr/ADR-006-pedagogical-patrimony-and-edition-lineage.md) |

**Critère de sortie :**

- mises à jour d'édition incrémentales opérationnelles (diff de segments, régénération ciblée, signalement nouveau/modifié) ;
- dette technique résiduelle réduite (code mort, primitives inutilisées).

---

### Maintenabilité et CI

| | |
|---|---|
| **Nature** | Maintenance permanente (transversal) |
| **Question directrice** | Comment garantir qu'une évolution ne casse pas silencieusement un package publié conforme ? |
| **Décisions** | [PDR-G6](governance/PRODUCT-DECISION-REGISTRY.md) |

**Critère de sortie :**

- CI opérationnelle avec tests sur le package de capitalisation de référence ;
- build reproductible des artefacts textuels vérifié en CI — définition normative : contrats et [`renderer/19-BUILD-PIPELINE.md`](renderer/19-BUILD-PIPELINE.md).

Cet objectif avance **en parallèle** dès la capitalisation ; il devient bloquant avant toute montée en charge industrielle.

---

## Dépendances

Deux natures de dépendance coexistent ([`DOCUMENT_ARCHITECTURE.md`](governance/DOCUMENT_ARCHITECTURE.md) §5.3) :

| Nature | Effet |
|---|---|
| **Blocage de démarrage** | le travail ne peut pas commencer |
| **Blocage d'acceptation** | le travail peut avancer, mais son critère de sortie ne peut pas être prononcé |

| Élément | Bloqué au démarrage par | Bloqué à l'acceptation par | Débloque (à la clôture) |
|---|---|---|---|
| Capitalisation package de référence | — | — | acceptation Reader ; RPC 234 ; fixture CI ; diff éditorial |
| Reader Composition V1 | — | — | (architecture Composition en production — clôturée) |
| Reader Acceptance V1 | package de référence publié | critères PDR-B1/B5/D/E | Reference Product Chapter 234 |
| Reference Product Chapter 234 | — | Reader Acceptance V1 | Product Review 234 |
| Product Review 234 | Reference Product Chapter 234 | — | Product Freeze 234 |
| Product Freeze 234 | Product Review 234 | — | capitalisation produit ; Reference Production Chapter 224 |
| Reference Production Chapter 224 | Product Freeze 234 | — | capitalisation industrielle |
| Capitalisation industrielle (post-224) | Reference Production Chapter 224 | — | Validation Corpus V1 |
| Validation Corpus V1 (Fabrique) | validation complète 224 | Reader Acceptance V1 | choix chapitres suivants ; validation pédagogique Lou |
| Choix chapitres suivants (230 ou autre) | Validation Corpus V1 | — | extension corpus |
| Validation pédagogique Lou | — | Validation Corpus V1 prononcée + Reader V1 accepté | industrialisation EDN |
| Patrimoine V1 | — | co-vérifié à l'acceptation Reader | confiance données long terme |
| Premier diff éditorial | package de référence validé | — | régime éditorial |
| Industrialisation EDN | Validation Corpus V1 + validation Lou | — | scale cardio |
| Couverture Cardio | industrialisation opérationnelle | — | couverture EDN |
| Couverture EDN | cardio stabilisé + second collège validé | — | régime permanent |
| Interface Admin | package de référence | — | exploitabilité scale |
| CI / maintenabilité | — | co-requis avant scale industriel | non-régression durable |

**Lecture :** plusieurs chantiers (capitalisation contenu, Reader, patrimoine, CI) avancent **en parallèle** ; le package de capitalisation de référence est le **nœud de convergence** — pas la première étape d'une chaîne purement linéaire.

Le chemin critique effectif est constaté dans [`PROJECT_STATE.md`](PROJECT_STATE.md), en fonction de l'objectif actif et des blocages réels.

---

## Indicateurs structurels

Cinq indicateurs suivis sur la durée du projet. Les **cibles numériques** et **mesures courantes** vivent exclusivement dans [`PROJECT_STATE.md`](PROJECT_STATE.md).

| Indicateur | Ce qui est suivi |
|---|---|
| **Effort humain / chapitre publié** | Minutes d'intervention humaine (exceptions machine uniquement) |
| **Complétude source** | Segments avec disposition prouvée par code |
| **Grounding déterministe** | Part des claims sourcés vérifiés sans LLM |
| **Reproductibilité du build** | Artefacts textuels : égalité en CI — voir contrats et pipeline |
| **Décisions humaines / chapitre** | Compteur ; tendance décroissante attendue à l'industrialisation |

---

## Acquis

Objectifs clos — une ligne par acquis, renvoi vers la preuve de clôture. Le détail opérationnel appartient aux rapports et à l'historique Git.

| Acquis | Preuve de clôture |
|---|---|
| Fondations, gouvernance et contrats fondamentaux | [`governance/PHASE_0A_COMPLETION.md`](governance/PHASE_0A_COMPLETION.md), [`contracts/00-INDEX.md`](contracts/00-INDEX.md) |
| Qualification et gel de l'acquisition (FIL B, Tool 01/02, P1–P7) | [`releases/acquisition-rd-complete.md`](releases/acquisition-rd-complete.md), [ADR-004](adr/ADR-004-acquisition-architecture-frozen.md) |
| Architecture Reader v1 (spec) | Docs [14](renderer/14-LOU-READER-ARCHITECTURE.md)–[15](renderer/15-READER-FUNCTIONAL-SPECIFICATION.md) |
| Architecture Fabrique v1 (spec) | Docs [16](renderer/16-CONTENT-TO-READER-ARCHITECTURE.md)–[19](renderer/19-BUILD-PIPELINE.md), [`contracts/00-INDEX.md` §6](contracts/00-INDEX.md) |
| Pipeline validateur lou-build (stages A–K, cutover production) | [`releases/phase-3.4-batch-migration-g-k.md`](releases/phase-3.4-batch-migration-g-k.md), [`releases/phase-3.5-completion-report.md`](releases/phase-3.5-completion-report.md), tag `lou-build-pipeline-v1` |
| Architecture éditoriale v1 (contrats 07–09, réconciliation ADR-006) | [`07`](contracts/07-ASSESSMENT-QUESTION.md)–[`09`](contracts/09-CLINICAL-SCENARIO.md), commit `54c3054`, tag `editorial-architecture-v1` |
| Reader Composition V1 (Spec, Engine, ViewModel, branchement Renderer, neutralisation manifests) | [`READER-COMPOSITION-V1-FREEZE.md`](renderer/READER-COMPOSITION-V1-FREEZE.md), [`COMPOSITION-IMPLEMENTATION-DEBT.md`](governance/COMPOSITION-IMPLEMENTATION-DEBT.md) § Clôture migration ; audit indépendant ✅ Conforme |
| Package de capitalisation de référence (Item 234, Release `complete`) | [`PROJECT_STATE.md`](PROJECT_STATE.md) § Livrables de référence |
| Bibliothèque locale installable ([PDR-D1](governance/PRODUCT-DECISION-REGISTRY.md)) | [`LIBRARY-CATALOG-CONTRACT.md`](contracts/components/LIBRARY-CATALOG-CONTRACT.md) — D1-A…D livrés ; clôture 2026-08-01 |
| Mode hors ligne intégral — packages installés ([PDR-D2](governance/PRODUCT-DECISION-REGISTRY.md)) | [`OFFLINE-COMPONENT-CONTRACT.md`](contracts/components/OFFLINE-COMPONENT-CONTRACT.md), [`OFFLINE-IMPLEMENTATION-PLAN.md`](governance/OFFLINE-IMPLEMENTATION-PLAN.md) — lots D2-A…I livrés ; tag `offline-certification-v1` |
| Reprise de session Reader V1 ([PDR-D4](governance/PRODUCT-DECISION-REGISTRY.md)) | `session-service.js`, `session-resume.js`, store `session_resume` ; ResumePlan · RestoreContext · CE-01…CE-08 ; shell offline complet ; 396 unit + 71 smoke PASS ; clôture 2026-08-01 |
| Recherche textuelle locale Reader V1 ([PDR-D6](governance/PRODUCT-DECISION-REGISTRY.md)) | [`LOCAL-SEARCH-COMPONENT-CONTRACT.md`](contracts/components/LOCAL-SEARCH-COMPONENT-CONTRACT.md) — lots D6-A…G ; Service · Runtime · Reader · validation E2E ; tag `local-search-v1` ; clôture 2026-08-01 |
| Préférences d'affichage Reader V1 ([PDR-D7](governance/PRODUCT-DECISION-REGISTRY.md)) | [`DISPLAY-PREFERENCES-COMPONENT-CONTRACT.md`](contracts/components/DISPLAY-PREFERENCES-COMPONENT-CONTRACT.md) — lots D7-A…G ; Service · Runtime · Patrimoine · Reader · validation E2E ; clôture 2026-08-01 |
| Acceptation Reader V1 ([PDR-B1](governance/PRODUCT-DECISION-REGISTRY.md), [PDR-B5](governance/PRODUCT-DECISION-REGISTRY.md)) | [`releases/reader-acceptance-v1-publication.md`](releases/reader-acceptance-v1-publication.md) — 7 vues alimentées package 234 ; lots AP-A…AP-F ; tag `reader-acceptance-v1` ; clôture 2026-08-02 |
| Product Polish V1 / Annotation UI Freeze V1 | Product Review finale annotation **GO** ; micro-lots PRODUCT POLISH V1 · Toolbar V1.1 · Highlight Interaction V2 · Formatting Simplification · Preferences · UX Finalization · Notes restore · Bold Visibility Hardening ; tag `reader-ui-freeze-v1` ; clôture 2026-08-03 |
| SVG Highlight Bridge V1 | Bridge Highlight V2 HTML ↔ SVG ; LouInlineFormatting backend ; Fabrique `data-official-text-id` ; package 234 régénéré ; paint order + résolution SVG live ; UI toolbar contextuelle ; tag `svg-highlight-bridge-v1` ; clôture 2026-08-03 |

> **Note terminologique.** Le **pipeline validateur** lou-build est un acquis. La **Fabrique productrice autonome** reste un objectif forward ([PDR-C1](governance/PRODUCT-DECISION-REGISTRY.md)) — ne pas confondre « cutover lou-build » avec « production autonome de contenu ».

---

## Philosophie de décision

Lou Médecine progresse par **suppression des risques**, pas par accumulation de code.

Chaque décision retire une classe de risque dans l'ordre où l'ignorer coûterait le plus cher. Le centre de gravité du projet est la **production du premier Chapter Package complet de référence** — livrable structurant à partir duquel Reader, validation, CI et industrialisation s'alignent ([`DOCUMENT_ARCHITECTURE.md`](governance/DOCUMENT_ARCHITECTURE.md) §13, [PDR-C2](governance/PRODUCT-DECISION-REGISTRY.md)).

Le succès se mesure à une question :

> **Est-ce que cette décision rapproche Lou d'un outil exceptionnel tout en réduisant le coût de construction et de maintenance ?**

Si la réponse est non, la décision attend.

---

## Points d'entrée documentaires

| Besoin | Document |
|---|---|
| Où en est-on ? | [`PROJECT_STATE.md`](PROJECT_STATE.md) |
| Pourquoi cette décision ? | [`PRODUCT-DECISION-REGISTRY.md`](governance/PRODUCT-DECISION-REGISTRY.md) |
| Comment organiser le pilotage ? | [`DOCUMENT_ARCHITECTURE.md`](governance/DOCUMENT_ARCHITECTURE.md) |
| Plan prototypage éditorial et migration (Phase 1A) | [`plans/editorial-prototyping-and-migration-plan.md`](plans/editorial-prototyping-and-migration-plan.md) |
| Reference Product Chapter — méthode produit | [`docs/rpc/00-RPC-METHODOLOGY.md`](rpc/00-RPC-METHODOLOGY.md) |
| Capitalisation gouvernance post-audit (ADR-006, registre produit) | [ADR-006](adr/ADR-006-pedagogical-patrimony-and-edition-lineage.md), [`PRODUCT-DECISION-REGISTRY.md`](governance/PRODUCT-DECISION-REGISTRY.md) |
| Quelles obligations techniques ? | [`contracts/00-INDEX.md`](contracts/00-INDEX.md) |
| Détail industrialisation | [`acquisition/industrialization-plan.md`](acquisition/industrialization-plan.md) |
| Détail migration Reader | [`renderer/10-MIGRATION_PLAN.md`](renderer/10-MIGRATION_PLAN.md) |
| Rapports de clôture | [`docs/releases/`](releases/) |

---

*Révision 2026-08-04 — contrat éditorial MM/Notions/Cas sur chemin Product Freeze ; plan editorial-prototyping-and-migration-plan.md.*
