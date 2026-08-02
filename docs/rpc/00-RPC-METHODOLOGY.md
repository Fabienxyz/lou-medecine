# Reference Product Chapter — Méthodologie

| | |
|---|---|
| **Type** | Documentation RPC — **pilotage produit** |
| **Statut** | En vigueur — pilotage actif |
| **Autorité** | **Informatif** — ne remplace ni PDR, ni ADR, ni contrats |
| **Point d'entrée** | Ce document, puis les boucles numérotées |

Ce dossier (`docs/rpc/`) documente la **référence produit** et les **choix éditoriaux** associés. L'**industrialisation de la production** (coûts, prompts, pipelines) relève du **Reference Production Chapter** (Item **224**) — documenté séparément, **après** le Product Freeze du 234.

Les audits et investigations ponctuelles restent dans [`docs/analysis/`](../analysis/).

---

## Deux références distinctes

| Rôle | Chapitre | Mission |
|---|---|---|
| **Reference Product Chapter (RPC)** | **234** | **Laboratoire produit** — construire le **meilleur produit possible** pour Lou : toutes vues, notions, figures utiles, walkthroughs complets ; Product Review ; Product Freeze |
| **Reference Production Chapter** | **224** | Reprendre le **produit figé** du 234 ; produire le chapitre entièrement ; **mesurer** temps humain, appels LLM et coûts ; **optimiser la méthode de production** (prompts, pipelines, standards réutilisables) — **pas le produit** |

**Le chapitre 234 ne sert pas à optimiser la méthode de production.** C'est le rôle du 224. Le **coût ne pilote pas** les choix éditoriaux du 234.

---

## Le 234 comme laboratoire produit

Le Reference Product Chapter est un **laboratoire produit** : c'est là que le projet **découvre** ce que Lou doit offrir à l'apprenant.

| Principe | Application sur 234 |
|---|---|
| **Objectif** | Meilleur produit pédagogique possible — pas la méthode la moins chère |
| **Périmètre** | Toutes les vues Reader prévues ; toutes les notions ; toutes les figures **pédagogiquement utiles** ; walkthroughs complets |
| **Surproduction** | Légère surproduction **volontaire et assumée** — pour observer ce qui apporte de la valeur |
| **Coût** | **Ne pilote pas** les choix ; ne pas écarter une idée pertinente par crainte du coût |
| **Prompts / pipeline** | **Ne pas** calibrer la production industrielle sur le 234 |

La **méthode industrielle** est **découverte sur le 224** — après Product Freeze — en reprenant le produit figé.

---

## Qu'est-ce qu'un Reference Product Chapter ?

Un **Reference Product Chapter (RPC)** est un chapitre EDN **existant**, recertifié pour devenir la **référence produit** du projet — l'instance où l'on finalise ce que Lou doit offrir à l'apprenant.

Le RPC répond à une question : *le chapitre satisfait-il l'expérience Reader V1 dans son intégralité pédagogique — contenu, figures, walkthroughs, 7 vues ?*

---

## Pourquoi le RPC existe

| Motif | Énoncé |
|---|---|
| **Produit avant Fabrique** | Finaliser l'expérience utilisateur sur une instance réelle avant d'industrialiser |
| **Référence gelable** | Aboutir à un Product Freeze — référence produit figée |
| **Observer d'abord** | Capitaliser sur le 234 avant de généraliser la production sur le 224 |

---

## Ce que le RPC n'est pas

| Le RPC n'est **pas** | Précision |
|---|---|
| Un chantier d'optimisation du coût marginal | → Reference Production Chapter (224) |
| Un statut normatif immédiat | Les décisions deviennent standards **après Product Freeze** |
| Une refonte from scratch | **Recertification** : conserver, adapter ou remplacer artefact par artefact |
| Une évolution Reader / pipeline / contrats | Le RPC consomme l'existant |
| Le Reference Production Chapter | Le 224 industrialise ; le 234 produit |
| La Validation Corpus | Qualification Fabrique — **après** validation complète du 224 |

---

## Philosophie : Observer d'abord. Généraliser ensuite.

```
Reference Product Chapter (234) — laboratoire produit
        ↓
Product Review (usage réel Lou) → Product Freeze
        ↓
Reference Production Chapter (224) — industrialisation (méthode, pas produit)
        ↓
Capitalisation industrielle
        ↓
Validation Corpus V1
        ↓
Choix des chapitres suivants (230 ou autre)
        ↓
Validation pédagogique Lou → Industrialisation EDN
```

| Principe | Application |
|---|---|
| **Observer d'abord** | Découvrir le produit sur 234 avant d'industrialiser la méthode sur 224 |
| **Product Review** | Lou utilise **réellement** le chapitre dans le Reader ; décide ce qui apporte de la valeur pédagogique ; prépare le Product Freeze — **pas** mesure du coût de production |
| **Product Freeze** | Fige la référence produit ; ouvre le chantier Reference Production Chapter (224) |

---

## Les étapes du cycle (pilotage)

| Étape | Nature | Question directrice |
|---|---|---|
| **Recertification RPC (234)** | Laboratoire produit | Le chapitre produit-il le meilleur produit Lou — toutes vues, notions, figures utiles, walkthroughs complets ? |
| **Product Review** | Utilisation réelle Lou | Lou a-t-il **étudié** le chapitre dans le Reader ? Ce qui apporte-t-il **réellement** comme valeur pédagogique ? |
| **Product Freeze** | Gel produit | Le Reference Product Chapter 234 est-il **figé** comme référence produit ? |
| **Reference Production Chapter (224)** | Industrialisation | La méthode **reproduit-elle** le produit figé avec coûts mesurés et standards de **production** réutilisables ? |
| **Capitalisation industrielle** | Enseignements Fabrique | Quels standards de production tirer du 224 ? |
| **Validation Corpus V1** | Qualification Fabrique | La Fabrique reproduit-elle la méthode sur d'autres archétypes ? |
| **Industrialisation EDN** | Scale-out | Déploiement systématique |

**Séquence officielle** (détail : [`MASTER_ROADMAP.md`](../MASTER_ROADMAP.md)) :

```
Reader Acceptance V1 ✅
        ↓
Reference Product Chapter (234)  ← actif — laboratoire produit
        ↓
Product Review (usage réel Lou) → Product Freeze
        ↓
Reference Production Chapter (224) — industrialisation
        ↓
Capitalisation industrielle
        ↓
Validation Corpus V1
        ↓
Choix des chapitres suivants (230 ou autre)
        ↓
Validation pédagogique Lou
        ↓
Industrialisation EDN
```

La **recertification** opère par verdict artefact : **conserver**, **adapter** ou **remplacer**.

---

## Arborescence `docs/rpc/`

| Document | Statut | Contenu |
|---|---|---|
| **`00-RPC-METHODOLOGY.md`** | En vigueur | Ce document — référence produit |
| **`10-BOUCLE-1-COMPREHENSION.md`** | En vigueur (provisoire) | Cibles produit Boucle 1 — choix éditoriaux RPC |
| `20-BOUCLE-2-…` | *À créer* | Cas cliniques · Collège |
| `30-BOUCLE-3-…` | *À créer* | QCM · Scénarios |
| `40-REFERENCE-PRODUCTION-CHAPTER.md` | *À créer post-freeze* | Méthode industrielle — Item 224 |
| Registre de décisions RPC | *À créer post-freeze* | Décisions figées → standards |
| Capitalisation produit | *À créer post-freeze* | Enseignements produit du 234 |

---

## Modèle produit de référence

La méthode RPC raisonne exclusivement avec le **Reader V1 — 7 vues** :

[`docs/renderer/00-READER-V1-PRODUCT-MODEL.md`](../renderer/00-READER-V1-PRODUCT-MODEL.md)

| Boucle | Vues Reader | Document |
|---|---|---|
| **1 — Compréhension** | Amorçage cognitif · Modèle mental · Notions | [`10-BOUCLE-1-COMPREHENSION.md`](10-BOUCLE-1-COMPREHENSION.md) |
| **2 — *(à venir)*** | Cas cliniques · Collège officiel | — |
| **3 — *(à venir)*** | QCM · Scénarios | — |

---

## Documents connexes

| Document | Rôle |
|---|---|
| [`MASTER_ROADMAP.md`](../MASTER_ROADMAP.md) | Séquencement et critères de sortie |
| [`PROJECT_STATE.md`](../PROJECT_STATE.md) | État opérationnel courant |
| [`docs/analysis/`](../analysis/) | Audits temporaires — hors méthode officielle |
