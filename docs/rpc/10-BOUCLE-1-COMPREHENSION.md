# RPC — Boucle 1 Compréhension

| | |
|---|---|
| **Type** | Documentation RPC — **cibles produit et choix éditoriaux** |
| **Statut** | En vigueur (provisoire — validation Product Review requise sur D2–D5) |
| **Périmètre** | **Amorçage cognitif** · **Modèle mental** · **Notions** |
| **Méthodologie** | [`00-RPC-METHODOLOGY.md`](00-RPC-METHODOLOGY.md) |
| **Autorité produit** | [`docs/renderer/00-READER-V1-PRODUCT-MODEL.md`](../renderer/00-READER-V1-PRODUCT-MODEL.md) |

Ce document définit **ce que la Boucle 1 doit livrer** sur le Reference Product Chapter et les **choix éditoriaux provisoires** associés.

Le 234 est un **laboratoire produit** : viser le meilleur produit pour Lou. Le **coût ne pilote pas** les choix éditoriaux ici. La mesure de coûts, l'optimisation des prompts et la validation industrielle relèvent du **Reference Production Chapter (224)** — **après** Product Freeze.

Les choix marqués « Product Review : Oui » sont **provisoires** jusqu'à validation par Lou via **utilisation réelle** du Reader.

---

## Périmètre

| Vue Reader | Question apprenant | Livrable principal |
|---|---|---|
| **Amorçage cognitif** | Où suis-je ? De quoi parle ce chapitre ? | `cognitive-priming.v1.json` publié |
| **Modèle mental** | Comment le chapitre s'organise-t-il ? | Figure centrale + walkthrough court + blocs structurants |
| **Notions** | Comment fonctionne cette notion ? | TOC + blocs (question, figure si utile, walkthrough, développement, points d'attention) |

**Hors périmètre :** Cas cliniques, Collège, QCM, Scénarios — Boucles 2 et 3.

**Règle terminologique :** les registres `story`, `overview`, `mechanisms` sont des **artefacts internes de production**. Ils alimentent la Composition ; ils ne sont **pas** des vues Reader.

**Principe produit :** produire **toutes** les figures jugées **pédagogiquement utiles** — ne pas réduire artificiellement le périmètre visuel sur le 234.

---

## Ordre de production

```
Blueprint + Inventory (amont chapitre)
        ↓
Figure Modèle mental → Walkthrough MM → Blocs structurants
        ↓
Amorçage cognitif (parallélisable avec la figure MM)
        ↓
Par notion (ordre Blueprint) : figure si utile → walkthrough → grounding
        ↓
Manifest + validate/build
```

**Règle figure-first :** aucun walkthrough (MM ou Notion) n'est finalisé tant que la décision figure est tranchée pour ce bloc.

---

## Choix éditoriaux (Reference Product Chapter)

Cinq arbitrages pour finaliser la Boucle 1 sur le RPC. La **Product Review** (usage réel Lou dans le Reader) tranche la **valeur pédagogique** ; l'**optimisation de la méthode** est validée sur le 224.

### D1 — Amorçage cognitif

| | |
|---|---|
| **Décision** | Comment produire le contenu publié de l'Amorçage ? |
| **Choix retenu (provisoire)** | Fichier curatif `cognitive-priming.source.yaml` : profil et prérequis EDN **dérivés du Blueprint** ; résumé (~5 bullets) et compléments IA (1 phrase/item) par **1 passe LLM** ; assemblage **déterministe** Stage build → `cognitive-priming.v1.json`. |
| **Justification** | Contrat Amorçage et Reader V1 ; haute reproductibilité. |
| **Product Review** | **Non** — méthode héritée du Reader Acceptance V1 ; en recertification, **conserver** l'artefact sauf correction ciblée. |

---

### D2 — Figure du Modèle mental

| | |
|---|---|
| **Décision** | Comment produire et publier la figure centrale du Modèle mental ? |
| **Choix retenu (provisoire)** | **visual-spec contraint** (LLM intermédiaire, 1 + retry) → **rendu SVG déterministe** (Stage G, sans LLM). Publier la figure MM **avant** tout walkthrough. En recertification : **adapter** la spec existante plutôt que recréer. |
| **Justification** | La spec produit Reader exige un schéma central. |
| **Product Review** | **Oui** — qualité visuelle, primitive graphique, niveau de détail du schéma MM. |

---

### D3 — Walkthrough du Modèle mental

| | |
|---|---|
| **Décision** | Comment produire le texte de lecture du schéma MM ? |
| **Choix retenu (provisoire)** | **Recertification :** adapter/compresser le contenu existant (artefacts production `story` + `overview`) en walkthrough **court**, calé sur la figure publiée. **Chapitres neufs :** rédaction premium **1 passe / élément MM**, **après** publication de la figure. |
| **Justification** | Respecte figure-first ; privilégie la qualité produit sur le RPC. |
| **Product Review** | **Oui** — longueur, clarté « comment lire le schéma », absence de mécanismes détaillés. |

---

### D4 — Figures des Notions

| | |
|---|---|
| **Décision** | Quelles figures publier dans Notions ? |
| **Choix retenu (provisoire)** | **Figure MM obligatoire** + **toutes les figures** jugées **pédagogiquement utiles** pour chaque notion (entrées `visual_plan` actives du Blueprint). Pas de réduction artificielle du périmètre visuel sur le 234 — une légère surproduction est assumée. |
| **Justification** | Le laboratoire produit observe ce qui apporte de la valeur ; la Product Review tranche ensuite. |
| **Product Review** | **Oui** — quelles figures **apportent réellement** de la valeur à l'étude ? |

---

### D5 — Walkthroughs des Notions

| | |
|---|---|
| **Décision** | Comment produire le walkthrough de chaque notion ? |
| **Choix retenu (provisoire)** | **Recertification :** **conserver et adapter** les walkthroughs existants (artefact production `mechanisms`) ; regénérer premium si (a) une figure Notions vient d'être publiée, ou (b) échec grounding / claim non traçable, ou (c) qualité insuffisante pour le produit visé. |
| **Justification** | Priorité à la qualité du contenu ; compléter pour atteindre walkthroughs complets sur toutes les notions. |
| **Product Review** | **Oui** — lien walkthrough ↔ figure, séparation développement / points d'attention, qualité par notion. |

---

## Livrables sans arbitrage

Méthode fixe — pas de Product Review dédiée :

| Livrable | Méthode | Source |
|---|---|---|
| Questions des notions | Déterministe | Blueprint `question` |
| TOC Notions | Déterministe | Séquence Blueprint |
| Blocs structurants MM | Déterministe | Séquence Blueprint (notions Boucle 1) |
| Claims / grounding | Pipeline lou-build | Grounding déterministe + bridging LLM |
| Manifest / validate | Déterministe | Stages build documentés |

---

## Synthèse des décisions

| # | Domaine | Choix provisoire | Product Review |
|---:|---|---|---|
| D1 | Amorçage | Curatif YAML + LLM (résumé/IA) + build | Non |
| D2 | Figure MM | visual-spec + SVG déterministe ; adapter spec existante | **Oui** |
| D3 | Walkthrough MM | Adapter/compresser (recert.) ; premium post-figure (neufs) | **Oui** |
| D4 | Figures Notions | MM + **toutes figures pédagogiquement utiles** | **Oui** |
| D5 | Walkthroughs Notions | Conserver/adapter ; regen si figure, grounding ou qualité | **Oui** |

**Règles transverses :**

- Boucle 1 = 3 vues Reader (gel V1).
- Recertification, pas recréation from scratch.
- Figure-first : figure MM avant walkthroughs.
- **Coût ne pilote pas** les choix sur le 234.
- Standards de **production** et mesure coût/méthode → **224**, après Product Freeze.

---

## Arbitrages ouverts (Product Review)

| # | Question | Impact |
|---:|---|---|
| ARB-1 | Quelles figures Notions apportent **réellement** de la valeur à l'étude ? | Qualité visuelle Boucle 1 |
| ARB-2 | Walkthrough MM : adaptation suffisante ou regen ? | Qualité Modèle mental |
| ARB-3 | Walkthroughs Notions : qualité suffisante par notion ? | Qualité Notions |
| ARB-4 | Primitive SVG MM (`causal-graph` vs `process-flow`) | Qualité schéma MM |
| ARB-5 | Analogie scaffolding `ANA-*` : Amorçage IA, MM ou suppression | Clarté UX |

**Rôle Product Review :** Lou utilise le chapitre **réellement** dans le Reader ; ces arbitrages sont tranchés sur la **valeur pédagogique observée**, pas sur le coût de production.

---

## Reference Production Chapter (224) — hors périmètre 234

La mesure des coûts (temps humain, appels LLM), l'optimisation des prompts et la reproductibilité de la Boucle 1 seront **étudiées sur le Item 224** — en reprenant le **produit figé** du 234. Le 234 **ne sert pas** à calibrer la production industrielle.

---

## Références

| Document | Rôle |
|---|---|
| [`00-RPC-METHODOLOGY.md`](00-RPC-METHODOLOGY.md) | Méthode RPC — laboratoire produit vs industrialisation |
| [`00-READER-V1-PRODUCT-MODEL.md`](../renderer/00-READER-V1-PRODUCT-MODEL.md) | Modèle produit 7 vues |
| [`15-READER-FUNCTIONAL-SPECIFICATION.md`](../renderer/15-READER-FUNCTIONAL-SPECIFICATION.md) §4.3–4.5 | Spec fonctionnelle Boucle 1 |
| [`MASTER_ROADMAP.md`](../MASTER_ROADMAP.md) | Séquencement officiel |
