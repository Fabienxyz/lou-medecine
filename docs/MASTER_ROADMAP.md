# Lou Médecine — Master Roadmap

Document de pilotage officiel — **intention et séquencement produit**.

**Dernière révision :** 2026-07-30 — migration conforme à [`governance/DOCUMENT_ARCHITECTURE.md`](governance/DOCUMENT_ARCHITECTURE.md), décisions audit ([`PRODUCT-DECISION-REGISTRY.md`](governance/PRODUCT-DECISION-REGISTRY.md), [ADR-006](adr/ADR-006-pedagogical-patrimony-and-edition-lineage.md)).

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

Toute proposition qui entre dans les exclusions ci-dessus est **hors roadmap**, même si elle paraît séduisante techniquement.

---

## Référentiel normatif

Ce document **ordonne** ; il n'**oblige** pas. Pour savoir ce qui doit être vrai :

| Besoin | Document maître |
|---|---|
| Décisions architecturales fondatrices | [Index ADR](adr/README.md) |
| Obligations métier durables | [Contrats fondamentaux 01–06](contracts/00-INDEX.md) |
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

### Package de capitalisation de référence

Premier **Chapter Package complet** publié et versionné, produit par capitalisation contrôlée (gates satisfaits, réconciliation exhaustive, contenu d'évaluation au chapitre).

**Consommateurs :**

- acceptation Reader V1 ([PDR-B1](governance/PRODUCT-DECISION-REGISTRY.md)) ;
- validation pédagogique de la méthode ([PDR-B4](governance/PRODUCT-DECISION-REGISTRY.md)) ;
- fixture de non-régression Fabrique et CI ([PDR-B2](governance/PRODUCT-DECISION-REGISTRY.md), [PDR-G6](governance/PRODUCT-DECISION-REGISTRY.md)) ;
- modèle de publication pour l'industrialisation ([PDR-C1](governance/PRODUCT-DECISION-REGISTRY.md), [PDR-C2](governance/PRODUCT-DECISION-REGISTRY.md)) ;
- base de la lignée éditoriale ([ADR-006](adr/ADR-006-pedagogical-patrimony-and-edition-lineage.md), [PDR-C7](governance/PRODUCT-DECISION-REGISTRY.md)).

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

**Plan d'exécution détaillé :** [`renderer/13-ROADMAP.md`](renderer/13-ROADMAP.md), [`renderer/10-MIGRATION_PLAN.md`](renderer/10-MIGRATION_PLAN.md).

---

### Validation pédagogique de la méthode

| | |
|---|---|
| **Nature** | Fondation unique (validation produit unique — non rejouée par chapitre) |
| **Question directrice** | La méthode enseigne-t-elle réellement mieux, sur le premier package complet ? |
| **Décisions** | [PDR-B4](governance/PRODUCT-DECISION-REGISTRY.md) |

**Critère de sortie :**

- Lou confirme la compréhension du chapitre étudié via le Reader sur le package de capitalisation de référence ;
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
| **Décisions** | [PDR-C1](governance/PRODUCT-DECISION-REGISTRY.md), [PDR-C2](governance/PRODUCT-DECISION-REGISTRY.md), [PDR-C3](governance/PRODUCT-DECISION-REGISTRY.md), [PDR-C5](governance/PRODUCT-DECISION-REGISTRY.md) |

**Critère de sortie (première étape) :**

- au moins un chapitre suivant produit de bout en bout via runtime LLM avec gates automatiques, sans capitalisation manuelle intégrale ;
- coût et effort humain par chapitre **mesurés** ;
- le modèle de publication du package de capitalisation de référence est reproduit.

**Hors périmètre immédiat :** scale-out massif avant clôture du package de référence et validation de la méthode.

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
| Capitalisation package de référence | alignement source éditoriale si requis ([PDR-B2](governance/PRODUCT-DECISION-REGISTRY.md)) | — | acceptation Reader ; validation Lou ; fixture CI ; modèle industrialisation ; diff éditorial |
| Développement Reader V1 | — | — | (prépare l'acceptation) |
| Acceptation Reader V1 | — | package de référence publié | validation Lou en conditions réelles |
| Validation pédagogique Lou | — | package de référence + Reader V1 accepté | industrialisation ; scale cardio |
| Patrimoine V1 | — | co-vérifié à l'acceptation Reader | confiance données long terme |
| Premier diff éditorial | package de référence validé | — | régime éditorial |
| Industrialisation Fabrique | package de référence + validation méthode | — | scale cardio |
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
| Capitalisation gouvernance post-audit (ADR-006, registre produit) | [ADR-006](adr/ADR-006-pedagogical-patrimony-and-edition-lineage.md), [`PRODUCT-DECISION-REGISTRY.md`](governance/PRODUCT-DECISION-REGISTRY.md) |
| Quelles obligations techniques ? | [`contracts/00-INDEX.md`](contracts/00-INDEX.md) |
| Détail industrialisation | [`acquisition/industrialization-plan.md`](acquisition/industrialization-plan.md) |
| Détail migration Reader | [`renderer/10-MIGRATION_PLAN.md`](renderer/10-MIGRATION_PLAN.md) |
| Rapports de clôture | [`docs/releases/`](releases/) |

---

*Révision 2026-07-30 — migration Phase A.7 ; motive : capitalisation audit système, ADR-006, [`DOCUMENT_ARCHITECTURE.md`](governance/DOCUMENT_ARCHITECTURE.md).*
