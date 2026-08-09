# Graphical Architecture — Responsabilités de la chaîne graphique

| | |
|---|---|
| **Type** | Document d'architecture produit |
| **Statut** | Référence — fige les frontières entre couches |
| **Date** | 2026-08-09 |
| **Périmètre** | Chaîne graphique complète (VisualSpec → Renderer) — responsabilités et frontières, sans règle graphique détaillée |
| **Autorité** | Prescriptive pour l'architecture ; **non normative** au sens des contrats 01–09 |

**Documents voisins :** [Contrat 05](../contracts/05-VISUAL-GRAMMAR.md) (sémantique) · [Visual Grammar v0.1](./VISUAL-GRAMMAR-V0.1.md) (langage graphique) · [Projection Foundation](./PROJECTION-FOUNDATION.md) (vérification de projection) · [SVG Graphic Language V1](../contracts/components/SVG-GRAPHIC-LANGUAGE-V1.md) (contrat Theme) · Theme officiel [`svg-graphic-language-v1.yaml`](../../tools/lou-build/config/svg-graphic-language-v1.yaml)

---

# 1. Objectif

Ce document fige les **responsabilités de la chaîne graphique** du projet Lou :

VisualSpec → Visual Grammar → Theme → Renderer

([Projection Foundation](./PROJECTION-FOUNDATION.md) intercale la vérification de projection entre VisualSpec et Visual Grammar.)

Il définit le rôle de **chaque couche**, les frontières entre elles, le statut du Theme officiel et les chantiers futurs de réalignement. Il ne duplique ni le Visual Grammar (règles graphiques détaillées), ni le contrat SVG (invariants normatifs du Theme), ni le contenu du fichier YAML.

Le **Theme** y occupe une place centrale : c'est la couche de paramètres graphiques concrets située entre le langage graphique et les renderers. Mais l'objet du document est l'**architecture d'ensemble**, pas la spécification du Theme seul.

---

# 2. Architecture

```
VisualSpec
  │  porte le sens éditorial et sémantique
  ↓
Projection Foundation
  │  inventorie les faits, vérifie la projection (report-only)
  ↓
Visual Grammar
  │  porte le langage graphique : signatures, hiérarchie, patterns
  ↓
Theme
  │  porte les paramètres concrets qui incarnent ce langage
  ↓
Renderer
     matérialise le SVG à partir du plan de composition
```

**VisualSpec** — Source de vérité sémantique. Déclare entités, `kind`, relations, libellés et claims. Ne fixe ni couleur, ni layout, ni style. Les branches avec `threshold_fragment` séparent condition qualitative (branch label) et seuils canoniques (fragment callout).

**Projection Foundation** — Inventaire des faits learner-visible, vérification report-only, dispositions déclarées (`fact_dispositions`). Ne transforme pas le contenu éditorial ; observe VisualSpec normalisée + artefact.

**Visual Grammar** — Langage graphique produit transverse. Signatures par `kind`, hiérarchie perceptive, patterns de composition, principes connecteurs. Intentions uniquement — jamais de mesures.

**Theme** — Configuration graphique unique du projet.

**Renderer** — Moteur de layout et de sérialisation SVG. Consomme VisualSpec, plan de composition VCCK et Theme. Calcule la géométrie et émet l'artefact.

---

# 3. Responsabilités

| Couche | Responsabilité | Ne contient jamais |
|---|---|---|
| **VisualSpec** | Sens : entités, `kind`, relations, libellés, claims, structure éditoriale | Couleurs, mesures, layout, signatures visuelles, heuristiques de rendu |
| **Projection Foundation** | Inventaire des faits learner-visible, vérification de projection, dispositions descriptives | Génération SVG, règles graphiques, gates bloquants, transformation éditoriale |
| **Visual Grammar** | Conventions graphiques : signatures par `kind`, hiérarchie perceptive, lexique, patterns, principes connecteurs/palette | Valeurs hex, px, espacements numériques, chemins SVG, logique de layout |
| **Theme** | Paramètres graphiques : couleurs, typographie mesurée, épaisseurs, rayons, espacements, mappings kind→style concret, profils par famille | Rôle pédagogique d'un bloc, forme sémantique (losange = decision), règles de composition, contenu médical |
| **Renderer** | Matérialisation : layout géométrique, wrapping, sérialisation SVG, consommation du Theme | Constantes graphiques en dur, inférence de `kind`, décisions esthétiques hors Theme, règles pédagogiques |

---

# 4. Frontières

### Le Theme contient

- couleurs concrètes (hex, rgba)
- tailles de police et interlignes (px)
- espacements, marges, paddings (px)
- épaisseurs de trait (px)
- rayons de bordure (px)
- motifs de pointillé, opacités
- markers et connecteurs (dimensions, paths)
- mappings **valeurs** kind → fill / stroke / stroke-width / dash
- profils de paramètres par famille de composition

### Le Theme ne contient pas

- « decision = losange » (forme sémantique → Visual Grammar)
- hiérarchie perceptive (niveaux 1–6 → Visual Grammar)
- rôle pédagogique d'un bloc (→ VisualSpec + Visual Grammar)
- règles pédagogiques ou contraintes éditoriales (→ VisualSpec / contrats)
- algorithmes de layout (→ Renderer / VCCK)
- alias ou inférence de `kind` (→ interdit dans Renderer)

### Le Visual Grammar contient

- signatures visuelles (forme + trait + famille chromatique)
- hiérarchie perceptive et lexique des rôles
- patterns de composition conceptuels
- principes typographiques et connecteurs (intentions, rapports)

### Le Visual Grammar ne contient jamais

- des hex
- des px
- des noms de fichiers de configuration
- des détails de sérialisation SVG

**Règle de tranchage :** en cas de doute, la question « *quelle valeur mesurable ?* » → Theme ; « *quelle signification visuelle ?* » → Visual Grammar ; « *que représente-t-on ?* » → VisualSpec.

---

# 5. Statut du Theme (YAML)

Le fichier

[`tools/lou-build/config/svg-graphic-language-v1.yaml`](../../tools/lou-build/config/svg-graphic-language-v1.yaml)

est reconnu comme le **Theme officiel** du projet Lou.

Il constitue le point de configuration unique pour toute modification graphique post-Product Review (couleurs, espacements, épaisseurs, profils famille).

**État actuel :** le fichier remplit déjà ce rôle de facto, mais contient encore des éléments qui relèvent d'autres couches (signatures grammaticales explicites, constantes de layout, vocabulaire `kind` élargi). Une **purification progressive** est attendue afin qu'il ne contienne plus que des paramètres graphiques et leurs mappings de valeurs — conformément aux frontières définies en §4.

Le contrat [SVG Graphic Language V1](../contracts/components/SVG-GRAPHIC-LANGUAGE-V1.md) documente le Theme et ses invariants de consommation ; il ne remplace pas ce document ni le Visual Grammar.

---

# 6. Chantiers futurs

Quatre chantiers identifiés par l'audit d'architecture. Aucune implémentation n'est prescrite ici — seulement le cadrage.

| # | Chantier | Objectif |
|---|---|---|
| 1 | **Purification du Theme** | Retirer du YAML les décisions grammaticales (formes sémantiques, règles de hiérarchie) et les constantes de layout propres au moteur |
| 2 | **Purification du contrat SVG Graphic Language** | ~~Recentrer le contrat sur le Theme~~ → **G2 réalisé** |
| 3 | **Externalisation des constantes des renderers** | Éliminer les valeurs graphiques encore en dur dans les modules de layout et sérialisation |
| 4 | **Réconciliation du vocabulaire `kind`** | ~~Aligner lexique `kind`~~ → **G1 réalisé** |

---

*Graphical Architecture — responsabilités de la chaîne graphique. Langage → [Visual Grammar v0.1](./VISUAL-GRAMMAR-V0.1.md). Theme → [`svg-graphic-language-v1.yaml`](../../tools/lou-build/config/svg-graphic-language-v1.yaml).*
