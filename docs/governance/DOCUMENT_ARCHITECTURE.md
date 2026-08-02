# Architecture documentaire du pilotage

| | |
|---|---|
| **Type** | Doctrine de gouvernance — **informatif** |
| **Statut** | Accepté — 2026-07-30 |
| **Contexte** | Capitalisation Phase A.6 — réflexion d'architecture documentaire du pilotage |
| **Autorité** | Aucune sur le comportement du système — ne remplace ni ADR, ni contrats, ni specs |
| **Documents pilotés** | [`MASTER_ROADMAP.md`](../MASTER_ROADMAP.md) · [`PROJECT_STATE.md`](../PROJECT_STATE.md) |

Ce document définit **comment organiser et maintenir** les documents de pilotage du projet. Il ne fixe ni priorités produit, ni obligations techniques.

**Règle de lecture :** pour savoir **ce qui doit être vrai** → ADR, contrats, specs ; pour savoir **dans quel ordre et à quelle condition** → [`MASTER_ROADMAP.md`](../MASTER_ROADMAP.md) ; pour savoir **où en est-on** → [`PROJECT_STATE.md`](../PROJECT_STATE.md) ; pour savoir **comment tenir ces documents** → ce document.

---

## 1. Objectifs

L'architecture documentaire du pilotage vise à :

1. **Empêcher la dérive** — les documents de pilotage ne doivent pas se contredire entre eux, ni contredire la couche normative.
2. **Séparer l'intention de l'observation** — ce que le projet cherche à atteindre et ce qu'il a effectivement atteint ne vivent pas au même endroit.
3. **Respecter le principe SSOT** — une information métier ou de pilotage n'a qu'une seule source officielle ; les autres documents renvoient.
4. **Tenir dans le temps** — la structure doit rester pertinente au-delà du premier chapitre, du premier collège et de la première édition.
5. **Rendre la propagation auditable** — lorsqu'une décision est actée, sa traduction dans le pilotage doit être traçable et vérifiable.

Ces objectifs découlent de l'audit de cohérence Phase A.5 : le pilotage pré-audit mélangeait des informations de taux de variation différents, ce qui a produit des contradictions structurelles avec les décisions actées (registre produit, ADR-006).

---

## 2. Position dans la hiérarchie documentaire

Le pilotage s'inscrit **en parallèle** de la hiérarchie normative, sans en faire partie :

```
Doctrine normative
  ADR → contrats fondamentaux 01–09 → contrats composants → specs techniques → code

Mémoire de décision
  Registres produit et domaine (PDR, Composition, …)

Pilotage                          ← ce document en définit l'organisation
  MASTER_ROADMAP (intention)
  PROJECT_STATE (observation)
  docs/rpc/ (Reference Product Chapter — méthode produit)
  docs/analysis/ (audits temporaires)

Traçabilité historique
  Rapports de clôture, docs/releases/, tags Git, historique Git

Exécution
  Plans de domaine (industrialisation, migration renderer, …)
```

**Arbitrage en cas de conflit** — règle existante, conservée telle quelle ([`contracts/00-INDEX.md`](../contracts/00-INDEX.md) §1) :

| Nature du conflit | Autorité |
|---|---|
| Priorités et séquencement produit | [`MASTER_ROADMAP.md`](../MASTER_ROADMAP.md) |
| Comportement, obligation, invariant | Hiérarchie normative (ADR → contrats → specs) |
| Fait observé à un instant donné | [`PROJECT_STATE.md`](../PROJECT_STATE.md) |

**Corollaire :** la roadmap **ordonne** ; elle **n'oblige pas**. Elle ne crée ni invariant, ni interdiction technique. Lorsqu'une règle est nécessaire au pilotage, elle est soit **référencée** depuis la couche normative, soit **promue** en ADR ou contrat avant d'être citée.

**Modèle produit Reader (hors pilotage, couche normative produit) :** [`docs/renderer/00-READER-V1-PRODUCT-MODEL.md`](../renderer/00-READER-V1-PRODUCT-MODEL.md) — sept vues ; les projections sont des artefacts de production, pas des onglets.

---

## 3. Principes directeurs

Neuf principes. Chacun est **testable** : toute ligne ajoutée à un document de pilotage doit pouvoir être classée comme conforme ou non conforme.

### P1 — Séparation par taux de variation

Deux informations qui ne changent pas au même rythme ne cohabitent pas dans le même document.

*Test :* « Cette ligne change-t-elle si le projet avance de deux semaines sans qu'aucune décision ne soit prise ? » Si oui → observation (`PROJECT_STATE`). Si non → intention (`MASTER_ROADMAP`) ou couche plus lente.

### P2 — Une information, une source

Aucune information n'est présente à deux endroits — même partiellement. Le second endroit **référence** le premier.

*Test :* « Si cette information change, combien de fichiers dois-je éditer ? » La réponse doit être **un**.

Extension du principe SSOT (ADR-003, contrats) au **corpus documentaire** lui-même.

### P3 — La roadmap ne porte aucun statut mutable

La roadmap déclare des objectifs et leurs **critères de sortie**. Elle ne déclare jamais si un critère est atteint.

Les constats d'avancement vivent dans [`PROJECT_STATE.md`](../PROJECT_STATE.md). Les événements datés de clôture vivent dans la traçabilité historique (rapports, releases, Git).

*Conséquence :* pas de colonne « Statut », pas de marqueur d'avancement, pas de date de clôture dans la roadmap vivante. Les objectifs clos y figurent comme **acquis** — avec renvoi vers la preuve de clôture —, pas comme lignes dont le statut évolue.

### P4 — Autorité par nature

Trois natures d'autorité, jamais confondues : **priorité** (roadmap), **comportement** (norme), **fait** (état).

### P5 — Pilotage descriptif, jamais normatif

La roadmap et l'état ne recopient pas d'invariants, d'interdictions techniques ni de définitions contractuelles. Elles **référencent** la couche normative.

### P6 — Rôles et instances

La roadmap nomme des **rôles** (« package de référence de capitalisation », « fixture de non-régression »). L'**instance courante** d'un rôle (ex. Item 234, édition 2023) est enregistrée dans [`PROJECT_STATE.md`](../PROJECT_STATE.md).

*Motivation :* une roadmap qui nomme une instance devra être réécrite à chaque nouveau collège ou édition ; une roadmap qui nomme un rôle reste stable.

### P7 — Critère de sortie falsifiable

Tout objectif porte un critère vérifiable par observation. Un critère qui repose sur un jugement humain (ex. validation pédagogique) spécifie **qui prononce**, **sur quel matériel** et **sous quelle forme** (décision écrite et datée).

### P8 — Historique borné

L'historique détaillé ne vit pas dans les documents de pilotage vivants. Il est **compressé** en une ligne par objectif clos, avec renvoi vers le rapport de clôture. Le récit détaillé appartient à la couche de traçabilité historique.

### P9 — Règle d'éviction

Toute rubrique d'un document vivant possède une condition de sortie connue. Sans règle d'éviction, un document d'état devient un dépôt sédimentaire.

---

## 4. Responsabilités respectives

### 4.1 Formulation duale

| Document | Question unique |
|---|---|
| [`MASTER_ROADMAP.md`](../MASTER_ROADMAP.md) | **Que cherche-t-on à obtenir, dans quel ordre, et à quelle condition saura-t-on que c'est obtenu ?** |
| [`PROJECT_STATE.md`](../PROJECT_STATE.md) | **Où en est-on à cet instant, et qu'est-ce qui empêche d'avancer ?** |

La roadmap est un document d'**engagement** — il ne se périme pas tout seul. L'état est un document de **constat** — il se périme dès qu'il est écrit.

### 4.2 MASTER_ROADMAP — ce qui lui appartient

| Contenu | Nature |
|---|---|
| Mission, vision produit, philosophie de décision | Intention durable |
| Périmètre et exclusions | Intention durable |
| Objectifs du projet | Intention |
| Critères de sortie par objectif | Intention |
| Rôles des livrables de référence et leurs consommateurs | Intention |
| Dépendances entre objectifs et livrables | Intention |
| Définition des indicateurs (sans valeur) | Intention |
| Acquis — une ligne par objectif clos, avec renvoi | Archive compressée |
| Référentiel normatif — table de renvois uniquement | Index |

### 4.3 PROJECT_STATE — ce qui lui appartient

| Contenu | Nature |
|---|---|
| Objectif actif et livrable visé | Constat |
| Chantiers en cours | Constat |
| Blocages et risques ouverts | Constat |
| Instances courantes des livrables de référence | Constat |
| Valeurs des indicateurs | Constat |
| Prochaines étapes — sélection courante, ordre hérité de la roadmap | Constat |
| Dette ouverte — ou renvoi vers registres de dette par domaine | Constat |

### 4.4 Ce qui n'appartient à aucun des deux

| Contenu | Document maître |
|---|---|
| Invariants, obligations, schémas | ADR, contrats, specs |
| Justification des arbitrages produit | [`PRODUCT-DECISION-REGISTRY.md`](PRODUCT-DECISION-REGISTRY.md) |
| Architecture gelée — liste des documents | [`contracts/00-INDEX.md`](../contracts/00-INDEX.md) §6 |
| Récit détaillé de clôture | [`docs/releases/`](../releases/) |
| Tâches, lots, étapes techniques | Plans de domaine |
| Chronologie transverse des jalons | Traçabilité historique (releases, Git) |

---

## 5. Modèle de pilotage

### 5.1 Quatre types d'entités

Le projet est piloté par un **modèle hybride** : les **objectifs** forment la colonne vertébrale ; trois autres types complètent la représentation.

| Type | Question | Document | Durée de vie |
|---|---|---|---|
| **Objectif** | Que cherche-t-on, et quand est-ce atteint ? | roadmap | années ; clos, jamais supprimé |
| **Livrable de référence** | Quel artefact durable est produit et réutilisé ? | roadmap (rôle) + état (instance) | permanent, versionné |
| **Chantier** | Sur quoi travaille-t-on en ce moment ? | état | semaines à mois ; clos, retiré |
| **Jalon** | Qu'a-t-on franchi, et quand ? | traçabilité historique | permanent, immuable |

**Règle de non-recouvrement :** un objectif ne porte pas de date de clôture mutable ; un jalon ne porte pas de critère de sortie ; un chantier ne survit pas à sa clôture ; un livrable de référence n'a pas de statut d'avancement dans la roadmap.

### 5.2 Livrables de référence — nœuds de convergence

Un livrable de référence n'est **pas** une phase du projet. C'est un **artefact structurant** vers lequel convergent plusieurs chantiers, et à partir duquel se débloquent plusieurs validations.

Exemple actuel : le **Reference Product Chapter** — Item **234** (Insuffisance cardiaque, édition Collège **2022**, Release `complete`). **Laboratoire produit** : y est découvert le meilleur produit pédagogique pour Lou — toutes vues, notions, figures utiles, walkthroughs complets ; surproduction légère assumée. Documentation : [`docs/rpc/`](../rpc/00-RPC-METHODOLOGY.md).

Le **Reference Production Chapter** — Item **224** — démarre **uniquement après Product Freeze 234** : reprend le **produit figé** ; mesure temps humain, appels LLM et coûts ; optimise **méthode de production** (prompts, pipelines, standards réutilisables) — **pas le produit**.

Il sert simultanément de :

- référence d'acceptation du Reader (✅ clôturée) ;
- **laboratoire produit** (234 — finalisation en cours) ;
- support futur de la validation pédagogique ;
- fixture de non-régression ;
- base de la lignée éditoriale (ADR-006, PDR-C7).

**Principe :** *Observer d'abord. Généraliser ensuite.* — le **produit** se découvre sur **234** ; la **méthode industrielle** se découvre sur **224** ; Validation Corpus V1 **après validation complète du 224** ; chapitres suivants (230 ou autre) **non tranchés**.

### 5.3 Dépendances — deux natures

| Nature | Signification | Conséquence |
|---|---|---|
| **Blocage de démarrage** | le travail ne peut pas commencer | pas d'effort affecté |
| **Blocage d'acceptation** | le travail peut avancer, mais son critère de sortie ne peut pas être prononcé | effort autorisé, clôture bloquée |

Cette distinction permet de représenter le parallélisme réel du projet — par exemple le développement du Reader V1 pendant la capitalisation du package 234 — sans relinéariser à tort le chemin critique.

Le **chemin critique** est une **conséquence** des dépendances et de l'objectif actif. Il ne se maintient pas comme une ligne indépendante dans la roadmap.

### 5.4 Objectifs répétables

Pour tenir au-delà du premier chapitre, les objectifs portent une **nature** :

| Nature | Exemple | Rejouabilité |
|---|---|---|
| Fondation unique | poser la gouvernance, qualifier l'acquisition | une fois |
| Capitalisation répétable | produire un package de référence complet | par archétype, par collège |
| Extension répétable | diff éditorial, montée en charge | par édition, par périmètre |
| Maintenance permanente | régime éditorial, CI, patrimoine | continue |

Un nouveau collège ou une nouvelle édition **instancie** un objectif existant — il n'ajoute pas une phase numérotée.

---

## 6. Règles de répartition des informations

| Information | Roadmap | État | Ailleurs |
|---|---|---|---|
| Mission, vision | ✅ | — | — |
| Périmètre, exclusions | ✅ | — | PDR/ADR pour le motif |
| Principes, invariants | référence | — | ✅ contrats, ADR |
| Objectifs | ✅ | — | — |
| Critères de sortie | ✅ | — | — |
| Rôles des livrables de référence | ✅ | — | — |
| Instance courante d'un livrable | — | ✅ | — |
| Dépendances | ✅ | — | — |
| Objectif actif | — | ✅ | — |
| Chantiers en cours | — | ✅ | plans de domaine pour le détail |
| Risques, blocages | — | ✅ | — |
| Définition des indicateurs | ✅ | — | — |
| Valeurs des indicateurs | — | ✅ | — |
| Jalons franchis | — | fenêtre courte | ✅ releases, Git |
| Justification des décisions | référence | référence | ✅ PDR, ADR |
| Architecture gelée (liste) | référence | référence | ✅ index contrats |

---

## 7. Règles de non-duplication

Quatre familles d'information ne doivent **jamais** être dupliquées entre documents de pilotage ou entre pilotage et norme.

| Famille | Dommage si dupliquée |
|---|---|
| **Énoncés normatifs** | contradiction sur ce qui est obligatoire |
| **Statut d'avancement** | deux récits divergents sur « où en est-on » |
| **Justification d'une décision** | le registre cesse d'être la mémoire |
| **Listes d'architecture** | maintenance en plusieurs exemplaires |

**Patron correct déjà en place :** la définition des indicateurs vit dans la roadmap ; leurs valeurs vivent dans l'état. Ce patron doit être **généralisé** à toutes les rubriques.

**Patron incorrect observé avant capitalisation :** le bloc « Architecture v1 — GELÉE » recopié dans la roadmap et l'état alors que [`contracts/00-INDEX.md`](../contracts/00-INDEX.md) §6 en est déjà le propriétaire.

---

## 8. Granularité

Quatre niveaux de grain. Chaque frontière est une règle, pas une convention.

| Niveau | Contenu | Document |
|---|---|---|
| **Intention** | objectif + critère de sortie | roadmap |
| **Observation** | chantier + mesure + blocage | état |
| **Exécution** | tâches, lots, étapes techniques | plans de domaine |
| **Norme** | obligation, invariant, schéma | ADR, contrats, specs |

*Test de frontière intention / exécution :* « Est-ce que cela change si l'implémentation change sans changement de décision ? » Si oui → trop fin pour la roadmap.

*Test de frontière observation / exécution :* « Est-ce que cela change plusieurs fois par semaine ? » Si oui → trop fin pour l'état ; le détail appartient au plan de domaine ou au code.

---

## 9. Principes de maintenance documentaire

### 9.1 Déclencheurs de modification

| Document | Se modifie lorsque… |
|---|---|
| **Roadmap** | une décision change l'intention, le séquencement ou un critère de sortie |
| **État** | un jalon est franchi, un blocage apparaît ou disparaît, une mesure change |
| **Traçabilité historique** | un événement daté mérite d'être conservé — append-only |

Un diff de la roadmap est un **signal** : une décision a été prise ou une intention a changé.

### 9.2 Traçabilité des modifications

Toute modification substantielle de la roadmap référence la décision qui la motive (ADR, entrée PDR, ou rapport de clôture). Cette règle rend la propagation auditable et complète l'annexe C du registre produit.

### 9.3 Non-régression documentaire

Avant toute publication d'un document de pilotage, vérifier qu'aucune information ajoutée n'existe déjà ailleurs comme source officielle.

### 9.4 Éviction

| Rubrique (état) | Condition de sortie |
|---|---|
| Chantier | clôturé ou abandonné |
| Risque | résolu — la résolution part en traçabilité historique |
| Prochaine étape | remplacée à la prochaine mise à jour |
| Décision récente | migrée vers registre ou historique après fenêtre de lecture |

---

## 10. Propagation des décisions

La propagation suit la hiérarchie existante, complétée par cette architecture.

```
Décision actée (PDR, ADR)
        ↓
Couche normative si comportement ou invariant en jeu
        ↓
MASTER_ROADMAP si intention, séquencement ou critère de sortie
        ↓
PROJECT_STATE si constat immédiat (objectif actif, instance, blocage)
        ↓
Traçabilité historique si événement daté de clôture
```

**Suivi :** l'annexe C de [`PRODUCT-DECISION-REGISTRY.md`](PRODUCT-DECISION-REGISTRY.md) recense les documents cibles et le statut de propagation. Un audit de cohérence ultérieur s'appuiera sur [`PRODUCT-DECISION-PROPAGATION-AUDIT.md`](PRODUCT-DECISION-PROPAGATION-AUDIT.md) *(à produire)*.

**Règle :** une décision **acceptée** n'est réellement intégrée au projet que lorsqu'elle est **propagée** dans les documents concernés — y compris le pilotage lorsque l'annexe C le prévoit.

**Ce document ne reçoit pas de propagation PDR directe** : il définit le **cadre** dans lequel la propagation vers le pilotage s'effectue. Sa révision relève d'une décision de gouvernance documentaire explicite.

---

## 11. Évolutivité

### 11.1 Test de tenue

Toute révision de la roadmap ou de l'état doit survivre, sans restructuration, à :

- un deuxième collège ;
- une troisième édition du même item ;
- plusieurs livrables de référence coexistants ;
- plusieurs années de maintenance.

*Test pratique :* toute rubrique qui nomme une **instance** (Item 234, édition 2023) plutôt qu'un **rôle** échoue au test de tenue dans la roadmap.

### 11.2 Critères d'évolution de cette architecture

La présente doctrine peut être révisée lorsque l'un des seuils suivants est atteint. La révision est **explicite** — pas une dérive par accumulation.

| Seuil | Évolution envisageable |
|---|---|
| **Second livrable de référence** ou seconde édition du même item | registre de lignée des artefacts publiés |
| **Plusieurs chantiers simultanés** tenus par plusieurs personnes | identifiants stables pour objectifs et chantiers |
| **Historique des jalons** difficile à retrouver dans releases/Git | document journal append-only dédié |
| **Contradiction récurrente** entre pilotage et norme malgré l'application de P2–P5 | renforcement des contrôles de non-régression documentaire |

L'absence de seuil atteint **n'est pas** un motif de complexifier l'architecture.

---

## 12. Première implémentation — simplifications conscientes

La réflexion Phase A.6 proposait des mécanismes destinés au long terme. La **première application** de cette doctrine — lors de la réécriture prochaine de la roadmap et de l'état — adopte les simplifications suivantes, **sans remettre en cause** les principes ni le modèle.

| Mécanisme A.6 | Première implémentation | Motif |
|---|---|---|
| Identifiants stables (`OBJ-*`, `REF-*`, `CH-*`) | **Non introduits** | projet tenu par une seule personne ; lisibilité immédiate prioritaire |
| Document journal append-only dédié | **Non créé** | [`docs/releases/`](../releases/), rapports de clôture, tags Git et historique Git suffisent pour la traçabilité actuelle |
| Registre de lignée des livrables de référence | **Différé** | une seule instance aujourd'hui ; déclencheur = second artefact de référence ou seconde édition |
| Schéma dérivé des dépendances | **Non imposé** | la table de dépendances en roadmap suffit ; tout schéma reste dérivé, jamais source de vérité |

Ces simplifications sont **documentées ici comme choix conscients**. Leur retrait future suivra les critères du §11.2.

---

## 13. Changement de paradigme — contexte

L'audit Phase A.5 a établi que le pilotage pré-audit ne se limitait pas à un mauvais ordre de priorités : il reflétait un **déplacement de centre de gravité** non acté.

| | Avant l'audit | Après l'audit |
|---|---|---|
| **Organisation** | autour du développement progressif du Reader | autour de la production du premier Chapter Package complet |
| **Artefact central** | prototype Reader multi-chapitres | Golden Master — livrable structurant et pivot |
| **Reader** | phase active, moteur du pilotage | chantier parallèle ; acceptation conditionnée par le livrable de référence |
| **Fabrique** | supposée terminée | validateur clos ; production autonome à industrialiser |

Cette doctrine encode structurellement ce changement : la roadmap organise l'intention autour des **objectifs** et des **livrables de référence**, pas autour d'une phase « Reader » ou « Fabrique » dont le statut mutable dériverait.

---

## Documents connexes

| Document | Rôle |
|---|---|
| [`MASTER_ROADMAP.md`](../MASTER_ROADMAP.md) | Intention — objectifs, critères, dépendances |
| [`PROJECT_STATE.md`](../PROJECT_STATE.md) | Observation — état courant, chantiers, mesures |
| [`PRODUCT-DECISION-REGISTRY.md`](PRODUCT-DECISION-REGISTRY.md) | Mémoire des arbitrages produit ; annexe C — propagation |
| [`contracts/00-INDEX.md`](../contracts/00-INDEX.md) | Hiérarchie normative ; §1 arbitrage priorités / comportement |
| [`adr/README.md`](../adr/README.md) | Index des ADR |
| [`OFFLINE-IMPLEMENTATION-PLAN.md`](OFFLINE-IMPLEMENTATION-PLAN.md) | Plan d'exécution PDR-D2 (lots D2-A…I — clôturé) |
| [`docs/releases/`](../releases/) | Rapports de clôture et jalons datés |
| [`COMPOSITION-IMPLEMENTATION-DEBT.md`](COMPOSITION-IMPLEMENTATION-DEBT.md) | Modèle de registre de dette par domaine |

---

*Doctrine acceptée le 2026-07-30 — capitalisation Phase A.6.*
