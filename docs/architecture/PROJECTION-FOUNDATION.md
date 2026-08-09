# Projection Foundation

| | |
|---|---|
| **Type** | Document d'architecture |
| **Statut** | Référence — brique officielle de la chaîne graphique |
| **Date** | 2026-08-09 |
| **Périmètre** | Responsabilité architecturale — sans implémentation ni API |

**Documents voisins :** [Graphical Architecture](./GRAPHICAL-ARCHITECTURE.md) · [Visual Grammar Runtime](./VISUAL-GRAMMAR-RUNTIME.md)

---

## 1. Objectif

**Projection Foundation** existe pour garantir qu'aucun fait learner-visible défini dans un VisualSpec ne soit perdu, dupliqué ou matérialisé sans origine identifiable lors du passage vers l'artefact SVG.

Elle fournit une **mesure et une description** de la projection — pas une transformation du contenu éditorial. Elle répond à la question : *« chaque fait autorisé par le VisualSpec est-il présent, une seule fois, et traçable dans l'artefact ? »*

---

## 2. Architecture

Projection Foundation est composée de **quatre briques** :

| Brique | Rôle |
|---|---|
| **Fact Spine** | Énumération autoritaire des faits learner-visible issus du VisualSpec (`visualSpecClaimUnits`). Une seule définition de ce qu'est un « fait » dans le système. |
| **Materialization Identity** | Identités stables et déterministes reliant une marque textuelle de l'artefact au fait qu'elle porte (`data-official-text-id` et conventions associées). Sert à la vérification et au Reader — n'influence ni layout, ni Theme, ni sélection de renderer. |
| **Projection Disposition** | Déclaration explicite par capability/famille (`fact_dispositions` dans le registre VCCK) de ce que le pipeline fait de chaque type de fait : MATERIALIZED, DERIVED (avec source), ou DISCARDED (avec raison fermée). UNKNOWN n'est jamais une disposition cible — uniquement un signal de migration. |
| **Projection Verification** | Réconciliation bidirectionnelle report-only : multiplicité (absent / une fois / plusieurs), orphelins, dispositions observées, et **comparaison déclaration vs comportement** (Total Disposition). Ne bloque jamais la production. |

**VisualSpec normalisée (phase 1)** — lorsqu'une branche porte `threshold_fragment`, les seuils numériques sont canoniques dans `threshold_fragment.scales` ; le fait learner par échelle est `threshold-fragment-scale-line`. `branch.condition` reste qualitative. `cutoff_label` est substrat d'auteur, pas un fait learner séparé. Voir `visual-spec-projection-normalize.js`.

---

## 3. Position dans la chaîne

```
VisualSpec
  ↓
Projection Foundation
  ↓
Visual Grammar
  ↓
Runtime
  ↓
Theme
  ↓
Renderer
  ↓
SVG
```

Projection Foundation s'intercale **immédiatement après** le VisualSpec et **avant** toute couche de langage graphique ou de rendu. Elle observe le couple VisualSpec + artefact ; elle n'est jamais un input du renderer.

---

## 4. Frontières

Projection Foundation :

- **ne génère** rien ;
- **ne transforme** rien ;
- **ne décide** rien (pas de gate, pas de correction automatique) ;
- **décrit et vérifie** uniquement.

Elle ne remplace ni le Visual Grammar, ni le Theme, ni le Renderer, ni le VCCK.

**Total Disposition** — la disposition reste une **déclaration de capability** dans le registre VCCK (`fact_dispositions`). Elle ne devient jamais un input du renderer, ne détermine pas le layout, ne transforme pas la VisualSpec et ne génère pas le contenu. Projection Foundation **vérifie** ; elle ne **construit** pas.

---

## 5. Hors périmètre

Ce document ne couvre pas :

- FigurePlan
- Display Profiles
- Product Language
- Gates futurs ou ratchets CI
- Implémentation, modules, APIs

Ces sujets relèvent d'autres chantiers ou de la documentation opérationnelle du build.

---

*Projection Foundation — architecture. Chaîne globale → [Graphical Architecture](./GRAPHICAL-ARCHITECTURE.md).*
