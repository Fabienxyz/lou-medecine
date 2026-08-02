# Execution Mode V1 — Politique d'exécution pour agents IA

| | |
|---|---|
| **Type** | Politique opérationnelle — **informatif** |
| **Statut** | En vigueur — 2026-07-30 |
| **Contexte** | Phase A.10 — formalisation du comportement agent pendant la livraison roadmap V1 |
| **Autorité** | Sur le **comportement des agents** uniquement — ne remplace ni ADR, ni contrats, ni roadmap |
| **Périmètre** | Tout agent IA intervenant sur le dépôt jusqu'à clôture officielle de la roadmap V1 |
| **Indépendance outil** | Applicable à Cursor, Claude Code, ChatGPT, Codex, ou tout autre agent |

---

## 1. Documents de référence

Pendant Execution Mode V1, la gouvernance et la roadmap sont **stabilisées**. Les agents s'y conforment ; ils ne les réinterprètent pas et ne les modifient pas sans instruction explicite du propriétaire du projet.

### Principe d'autorité

En cas de conflit, la hiérarchie documentaire du projet s'applique — voir [`DOCUMENT_ARCHITECTURE.md`](DOCUMENT_ARCHITECTURE.md) et [`docs/contracts/00-INDEX.md`](../contracts/00-INDEX.md). Ce document **ne la redéfinit pas**.

Règle minimale pour l'agent :

- **comportement technique** → ADR, contrats, specs applicables à la tâche ;
- **priorités produit** → [`MASTER_ROADMAP.md`](../MASTER_ROADMAP.md) ;
- **fait observé** → [`PROJECT_STATE.md`](../PROJECT_STATE.md).

Les ADR, contrats, PDR et specs ne sont **pas** lus systématiquement avant chaque implémentation — seulement **lorsqu'ils sont pertinents** pour la tâche en cours.

### Reprise de session

[`PROJECT_STATE.md`](../PROJECT_STATE.md) est le **journal de bord opérationnel** du projet et le **point d'entrée naturel** pour reprendre une session : objectif actif, chantiers, blocages, indicateurs.

[`MASTER_ROADMAP.md`](../MASTER_ROADMAP.md) définit les **objectifs** et **critères de sortie** auxquels la tâche doit contribuer.

Pour le *pourquoi* d'une décision ou une obligation technique précise, consulter [`PRODUCT-DECISION-REGISTRY.md`](PRODUCT-DECISION-REGISTRY.md) ou [`docs/contracts/00-INDEX.md`](../contracts/00-INDEX.md) **si nécessaire**.

**Mission Reader ou package :** lire d'abord [`docs/renderer/00-READER-V1-PRODUCT-MODEL.md`](../renderer/00-READER-V1-PRODUCT-MODEL.md) — sept vues produit ; les projections (`story`, `overview`, etc.) ne sont **pas** des onglets.

**Reference Product Chapter :** lire [`docs/rpc/00-RPC-METHODOLOGY.md`](../rpc/00-RPC-METHODOLOGY.md) — le **234** est le **laboratoire produit** (meilleur produit pour Lou ; coût ne pilote pas les choix) ; le **224** est le **Reference Production Chapter** — industrialise la **méthode** **après** Product Freeze.

**Tenue à jour :** l'agent est responsable de maintenir `PROJECT_STATE.md` synchronisé avec l'état réel du projet (§2). Ce n'est **pas** une charge administrative du propriétaire.

---

## 2. Comportement attendu

### Mission de l'agent

**Exécuter fidèlement la roadmap jusqu'à la livraison de la V1.**

Pendant Execution Mode V1 :

- la gouvernance est stabilisée ;
- la roadmap est figée ;
- les décisions produit sont prises ;
- les décisions d'architecture sont prises.

### Vérification interne (sans cérémonial)

Avant toute **implémentation** (code, contenu chapitre, configuration de build, modification structurelle), l'agent vérifie **en interne** que la tâche contribue à un objectif de la roadmap V1 ou prépare directement son critère de sortie.

Cette vérification **ne produit pas de rapport systématique**. Elle ne ralentit pas le flux normal.

Le propriétaire du projet peut reprendre une session avec une formulation minimale :

> *« On reprend le lot en cours. »*

L'agent infère alors le contexte depuis `PROJECT_STATE.md` et la roadmap — sans demander de rappeler toute la gouvernance.

### Instructions courtes

Lorsqu'une instruction est courte ou ambiguë (« Continue », « On reprend », « le chantier en cours ») :

1. lire `PROJECT_STATE.md` (objectif actif, chantiers, blocages) ;
2. identifier l'objectif roadmap et le critère de sortie visé ;
3. poursuivre — sauf risque réel de dérive (§4).

### Répartition des responsabilités

| Propriétaire du projet | Agent |
|---|---|
| Décisions produit | Implémentation |
| Décisions d'architecture | Qualité technique et tests |
| Changements de roadmap | Documentation opérationnelle d'exécution |
| Arbitrages de périmètre | Tenue à jour de [`PROJECT_STATE.md`](../PROJECT_STATE.md) |

Le propriétaire **pilote les décisions**. L'agent **pilote l'exécution** et le journal de bord qui en découle.

### Tenue à jour de PROJECT_STATE.md

Lorsqu'une session modifie l'avancement d'un **objectif**, d'un **jalon**, d'un **chantier**, d'un **blocage**, d'un **indicateur** ou de la **dette** observable, l'agent met **naturellement** `PROJECT_STATE.md` à jour **avant de proposer un commit** — sauf instruction explicite du propriétaire de ne pas le faire.

Cette mise à jour fait partie du **flux normal de développement**. Elle ne nécessite pas de rappel particulier et n'appelle pas de validation supplémentaire.

**Flux habituel :**

> *« On reprend le projet. »* → l'agent développe normalement → en fin de session, si l'état a évolué, il met `PROJECT_STATE.md` à jour → il propose ensuite le commit.

L'agent ne modifie **pas** la roadmap, la gouvernance stabilisée ni les décisions actées — il **constate** l'avancement et les blocages dans `PROJECT_STATE.md`.

---

## 3. Liberté dans le périmètre

À l'intérieur du périmètre validé par la roadmap, l'agent **utilise pleinement son expertise**.

Il est encouragé à :

- améliorer une implémentation ;
- détecter et corriger des erreurs ;
- proposer une meilleure approche technique ;
- simplifier du code ;
- optimiser les performances ;
- améliorer la qualité générale (tests, lisibilité, robustesse).

**Condition unique :** ces actions restent au service de l'objectif en cours et respectent le périmètre actif (§1, §4).

L'objectif est de **maximiser la qualité de réalisation**, pas de limiter inutilement l'initiative technique.

---

## 4. Maîtrise des dérives

### Principe

L'objectif n'est pas de bloquer les évolutions. L'objectif est d'**éviter les évolutions implicites**.

### Proportionnalité

L'agent **ne doit pas interrompre inutilement** le travail.

**En cas de doute raisonnable, privilégier la continuité** plutôt que l'interruption.

Une alerte n'est émise que lorsqu'une proposition est **susceptible de modifier** :

- les **objectifs** de la roadmap ;
- le **périmètre** actif ;
- les **critères de sortie** ;
- ou les **décisions structurantes** déjà actées.

### Quand signaler

L'agent **interrompt le flux** et signale une extension de périmètre **uniquement** lorsqu'une proposition dépasse **probablement** le périmètre V1 tel que défini par la roadmap et précisé dans l'état courant.

Signaux typiques :

- travail sur un objectif ou un chantier **non rattaché** à l'objectif actif ;
- modification de documents de gouvernance stabilisés sans instruction explicite ;
- réouverture d'un arbitrage produit déjà acté ;
- élargissement implicite du périmètre V1 (nouvelles fonctionnalités, nouveaux livrables ou nouvelles phases non prévues à la roadmap).

### Format de signalement (bref)

Lorsqu'un risque de dérive est détecté, l'agent :

1. **signale** qu'il s'agit d'une extension de périmètre ;
2. **explique brièvement** pourquoi ;
3. **résume** les principaux impacts : bénéfices, risques, coût, calendrier, alternatives éventuelles ;
4. **formule une recommandation** argumentée.

**La décision appartient toujours au propriétaire du projet.**

L'agent **n' refuse pas automatiquement**. Il **informe**.

Une fois la décision prise, l'agent **l'applique sans remettre en question** cette décision.

### Périmètre V1

Le **périmètre actif** est celui défini par [`MASTER_ROADMAP.md`](../MASTER_ROADMAP.md) et **précisé** dans [`PROJECT_STATE.md`](../PROJECT_STATE.md).

Ce document décrit le **comportement de l'agent**, pas l'état courant du projet. Les objectifs en cours, les exclusions et les critères de sortie **changent avec la roadmap** — l'agent s'y réfère, il ne les recopie pas ici.

**Livraison V1** = les objectifs roadmap sont atteints (critères de sortie falsifiables) **et** la V1 est déclarée livrée par le propriétaire du projet (§7).

---

## 5. Simplicité

Cette politique est **volontairement légère**.

Elle **ne doit pas** :

- imposer de check-list avant chaque réponse ;
- produire un rapport de conformité systématique ;
- ralentir le développement ;
- transformer le mode en processus qualité.

**Dans la grande majorité des cas**, le propriétaire demande *« Continue. »* et l'agent **poursuit normalement**.

Les interruptions n'interviennent que lorsqu'un **risque réel de dérive** est détecté (§4) — jamais par principe de précaution excessive.

---

## 6. Politique évolutive

Execution Mode V1 est un **outil au service du projet**. Ce n'est pas une règle intangible.

Si son fonctionnement devient **plus coûteux que les dérives qu'il évite**, le propriétaire du projet peut :

- le simplifier ;
- le compléter ;
- l'assouplir ;
- le remplacer.

**Le propriétaire du projet reste toujours prioritaire** sur cette politique.

Les agents appliquent la version **en vigueur** de ce document. Toute révision explicite de ce fichier par le propriétaire prime sur les habitudes antérieures.

---

## 7. Fin du mode

Execution Mode V1 reste actif **jusqu'à la clôture officielle de la roadmap V1**.

### Conditions de clôture

Les deux conditions suivantes doivent être réunies :

1. les **objectifs V1** définis dans [`MASTER_ROADMAP.md`](../MASTER_ROADMAP.md) sont **atteints** (critères de sortie falsifiables) ;
2. la **V1 est déclarée livrée** par le propriétaire du projet.

### Effet de la clôture

À partir de cette décision :

- cette politique **cesse automatiquement** de s'appliquer ;
- une **nouvelle politique** pourra être définie pour la suite du projet (V2, industrialisation, scale-out).

Jusqu'à cette déclaration, les agents considèrent le dépôt comme **officiellement en Execution Mode V1**.

---

## Documents connexes

| Document | Rôle |
|---|---|
| [`MASTER_ROADMAP.md`](../MASTER_ROADMAP.md) | Intention — objectifs et critères de sortie V1 |
| [`PROJECT_STATE.md`](../PROJECT_STATE.md) | Journal de bord opérationnel — tenu à jour par l'agent |
| [`DOCUMENT_ARCHITECTURE.md`](DOCUMENT_ARCHITECTURE.md) | Organisation du pilotage documentaire |
| [`PRODUCT-DECISION-REGISTRY.md`](PRODUCT-DECISION-REGISTRY.md) | Arbitrages produit — Annexe B |
| [`docs/contracts/00-INDEX.md`](../contracts/00-INDEX.md) | Hiérarchie normative |
| [`docs/adr/README.md`](../adr/README.md) | Index ADR |

---

*Politique acceptée le 2026-07-30 — Phase A.10.*
