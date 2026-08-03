# Lou Médecine — Spécification fonctionnelle du Reader

| | |
|---|---|
| **Type** | Spécification fonctionnelle produit |
| **Version** | 1.0 |
| **Statut** | **Baseline officielle — gelée** |
| **Dernière mise à jour** | 2026-07-28 |
| **Parent** | [README.md](./README.md) |
| **Architecture** | [`14-LOU-READER-ARCHITECTURE.md`](./14-LOU-READER-ARCHITECTURE.md) |
| **Glossaire** | doc 14 § Glossaire |

Ce document décrit **ce que l'utilisateur voit et peut faire** dans le Reader — écrans, interactions, états et cas particuliers. Il complète l'architecture pédagogique (doc 14) sans la recopier.

**Ce document n'est pas :** un contrat technique, un document d'architecture, une spécification de pipeline, ni une décision d'implémentation.

En cas de conflit sur une **obligation normative**, les contrats fondamentaux 01–06 priment. En cas de conflit vision / comportement entre docs Reader, les deux documents v1.0 sont réputés cohérents ; une incohérence signalée requiert une révision de version explicite.

---

## Documents connexes

| Document | Rôle |
|---|---|
| [14-LOU-READER-ARCHITECTURE.md](./14-LOU-READER-ARCHITECTURE.md) | Vision, principes, structure, glossaire, non-objectifs |
| [16-CONTENT-TO-READER-ARCHITECTURE.md](./16-CONTENT-TO-READER-ARCHITECTURE.md) | Frontière publication ↔ Reader — composition, identités |
| [`COMPOSITION-COMPONENT-CONTRACT.md`](../contracts/components/COMPOSITION-COMPONENT-CONTRACT.md) | Contrat composant — Composition Specification, View Model, diagnostics |
| [17-PUBLICATION-MODEL.md](./17-PUBLICATION-MODEL.md) | Modèle de publication — état, garanties, La Fabrique |
| [02-PRODUCT_SPECIFICATION.md](./02-PRODUCT_SPECIFICATION.md) | Expérience renderer historique |
| [06-ANNOTATION_SYSTEM.md](./06-ANNOTATION_SYSTEM.md) | Philosophie des annotations texte |

---

# 1. Objectif

## Rôle du Reader

Espace de travail par chapitre : **lire, comprendre, consolider et s'auto-évaluer** sur un item EDN, en séparant strictement contenu officiel et contributions personnelles.

## Place dans Lou Médecine

Trois couches : **Bibliothèque EDN** (accès) → **Reader** (sept onglets) + **Couche apprenante** (overlays transverses). Voir doc 14 § Architecture générale.

## Philosophie et principes

Vision, principes fondamentaux et non-objectifs : **doc 14** (§ Objectif, § Principes fondamentaux, § Non-objectifs). Terminologie : **doc 14 § Glossaire**.

---

# 2. Parcours utilisateur

```
Bibliothèque EDN
        ↓
   Page spécialité
        ↓
    Chapitre (Reader)
        ↓
 Amorçage cognitif
        ↓
  Modèle mental
        ↓
     Notions
        ↓
  Cas cliniques
        ↓
 Collège officiel          (+ overlays : surlignage, notes inline…)
        ↓
       QCM
        ↓
      Notes
        ↓
 Banques officielles EDN   ← hors Reader
```

| Étape | Intention | Obligatoire |
|---|---|---|
| Bibliothèque → Chapitre | Atteindre le chapitre | Oui |
| Amorçage → Cas cliniques | Compréhension | Oui (parcours complet) |
| Collège officiel | Vérifier la source verbatim | Recommandée |
| QCM | Auto-évaluation intermédiaire | Optionnelle |
| Notes | Fiches personnelles | Optionnelle |
| Banques EDN | Format examen | Hors Reader |

Reprise de session : dernière position (onglet + ancre) — sans mesure de « compréhension ». Overlays disponibles sur les onglets à contenu officiel sélectionnable (Notions, Cas cliniques, Collège officiel, walkthrough Modèle mental).

---

# 3. Navigation

## Bibliothèque EDN

Entrée : accueil Lou ou lien direct. Liste des spécialités. Clic → Page spécialité.

## Page spécialité

Fil d'Ariane : `EDN > [Spécialité]`. Liste des chapitres (item, titre, temps de lecture). Clic chapitre → Reader (Amorçage ou dernière position).

## Fil d'Ariane (breadcrumb)

Permanent dans le chapitre :

```
EDN  >  [Spécialité]  >  [Item — Chapitre]  >  [Onglet courant]
```

| Segment | Clic |
|---|---|
| EDN | Bibliothèque EDN |
| Spécialité | Page spécialité |
| Item — Chapitre | Amorçage cognitif |
| Onglet courant | Non cliquable |

## Navigation entre onglets

Barre horizontale (menu compact sur petit écran). **Ordre fixe :**

Amorçage cognitif · Modèle mental · Notions · Cas cliniques · Collège officiel · QCM · Notes

Pas de numérotation. Changement d'onglet : rechargement contenu + restauration overlays de l'onglet. Pas de sous-onglet.

## Table des matières

**Uniquement** dans l'onglet **Notions** — liste des notions cliquables en tête ; clic → scroll + surbrillance temporaire.

## Navigation par clic sur le schéma général

Onglet **Modèle mental** : clic sur une zone du schéma **associée à une notion déclarée** → onglet **Notions**, ancrage sur la notion ; breadcrumb mis à jour. Si aucune notion n'est associée au nœud cliqué, **pas de navigation** (zoom ou lecture seule selon implémentation).

## Figures et images repliables

| Contexte | Défaut | Interaction |
|---|---|---|
| Figure officielle (Notions, Cas cliniques) | Taille lecture dans le flux | Clic → vue agrandie ; fermeture : bouton, Échap, clic extérieur |
| Image (onglet Notes) | Vignette compacte | Clic → agrandie ; second clic → repliée |
| Schéma général (Modèle mental) | Taille intégrée | Clic zone **avec lien notion** → navigation Notions ; sinon zoom éventuel sans navigation |

Overlays apprenant conservés en vue agrandie (formatage figure).

## Navigation générale

| Mécanisme | Disponibilité |
|---|---|
| Scroll | Tous onglets longs |
| Breadcrumb, barre d'onglets | Permanent dans le chapitre |
| TOC | Notions uniquement |
| Ancres internes | Notions ; Modèle mental → Notions *(liens déclarés uniquement)* |
| Recherche in-chapter | V1 — Release ouverte uniquement ([PDR-D6](../governance/PRODUCT-DECISION-REGISTRY.md)) ; panneau Ctrl/Cmd+K ; navigation vers ancre ; surbrillance éphémère ; état non persisté |
| Préférences d'affichage | V1 — thème clair/sombre, taille police, largeur lecture ([PDR-D7](../governance/PRODUCT-DECISION-REGISTRY.md)) ; globales à l'application ; persistées patrimoniale ; export/import Snapshot ; sans impact contenu médical |
| Historique navigateur | Natif |

Règles UX structurelles : doc 14 § UX.

---

# 4. Description détaillée de chaque écran

Trame : **objectif · contenu · interactions · données persistantes · origine des données · comportements particuliers · hors périmètre**.

---

## 4.1 Bibliothèque EDN

### Objectif

Choisir une **spécialité**.

### Contenu

Titre « EDN » ; liste des spécialités publiées. Aucun chapitre à ce niveau.

### Interactions

Clic spécialité → Page spécialité.

### Données persistantes

Aucune en V1.

### Origine des données

Catalogue spécialités (configuration produit / index global).

### Comportements particuliers

Pas de progression, stats, recommandations.

### Hors périmètre

Recherche globale ; chargement de tous les chapitres en mémoire.

---

## 4.2 Page spécialité

### Objectif

Choisir un **chapitre** (item EDN).

### Contenu

Breadcrumb `EDN > [Spécialité]` ; titre spécialité ; liste chapitres (item, titre, temps de lecture).

### Interactions

Clic chapitre → Reader ; clic EDN → Bibliothèque.

### Données persistantes

Aucune en V1 (pas de favoris, pas de progression).

### Origine des données

Index chapitres par spécialité ; métadonnées via `manifest.json` de chaque chapitre.

### Comportements particuliers

Chapitre non publié : absent ou « indisponible » — jamais de contenu non tracé sans avertissement.

### Hors périmètre

Progression % ; tri avancé ; filtres.

---

## 4.3 Amorçage cognitif

### Objectif

« Où suis-je ? De quoi parle ce chapitre ? » — sans entrer dans le détail. Voir doc 14 § Principes (question mentale).

### Contenu

1. **Profil du chapitre** — Compréhension et Mémorisation : ★☆☆☆☆ à ★★★★★ (repères pédagogiques, pas note étudiante).
2. **Pré-requis** (ordre fixe) :
   - Références EDN (officiel)
   - Inter-EDN — absent en V1
   - Analyse IA — une phrase par item ; badge *« Complément pédagogique (IA) — non issu du Collège »*
3. **Résumé du chapitre** — bullets, ultra synthétique, contenu officiel prioritaire.

### Interactions

Clic pré-requis EDN → chapitre lié si publié ; navigation onglets ; breadcrumb Couche 1. Overlays possibles si texte sélectionnable — non prioritaires.

### Données persistantes

Position si arrivée via breadcrumb chapitre.

### Origine des données

Profil : Blueprint / métadonnées ; références : Blueprint / manifest ; analyse IA : génération identifiée ; résumé : Collège restructuré.

### Comportements particuliers

Tenir en un écran ; aucun pré-requis IA en mini-cours.

### Hors périmètre

Inter-EDN actif ; QCM ; Notes ; progression.

---

## 4.4 Modèle mental

### Objectif

« Comment l'ensemble du chapitre s'organise-t-il ? »

### Contenu

1. **Schéma général** — carte cognitive minimale du chapitre.
2. **Walkthrough** court — comment lire le schéma.
3. **Blocs structurants MM** *(optionnels)* — synthèse par nœud du schéma ; **n'impliquent pas** qu'une notion dédiée existe pour chaque bloc.

### Interactions

Clic zone schéma **avec lien notion déclaré** → Notions (ancre) ; clic sans lien → pas de navigation vers Notions ; clic zone zoom → agrandissement ; scroll walkthrough. Overlays sur walkthrough.

### Données persistantes

Overlays apprenant (scope chapitre + onglet).

### Origine des données

Schéma : figure officielle ou avis d'absence ; walkthrough et blocs : **artefacts publiés** (projections de production, assemblés via Composition), éléments Blueprint.

### Comportements particuliers

Pas de détail mécanistique ; schéma absent → avis explicite (doc 14, contrat 06 §5).

### Hors périmètre

Édition du schéma ; TOC (réservée à Notions).

---

## 4.5 Notions

### Objectif

« Comment fonctionne cette notion ? »

### Contenu

**TOC** en tête. Pour chaque **notion** :

| Composant | Description |
|---|---|
| Titre / Question | Intitulé notion |
| Figure officielle | Si publiée ; sinon avis |
| Walkthrough | Prose explicative canonique |
| Développement | Claims traçables |
| Points d'attention | Bullets — pièges, confusions |

### Interactions

TOC → scroll + surbrillance ; sélection walkthrough → toolbar apprenant ; clic Source (claim) → panneau traçabilité Collège ; clic figure → agrandissement ; 📷 → schéma personnel ; scroll libre.

### Données persistantes

Overlays (surlignage, note inline, formatage figure, schéma personnel) ; ancre dernière notion.

### Origine des données

Structure : Blueprint + manifest ; walkthrough / développement : projections ; figure : manifest ; points d'attention : signaux éditoriaux groundés.

### Comportements particuliers

Contenu officiel immuable ; orphelins signalés en fin d'onglet — jamais supprimés silencieusement.

### Hors périmètre

Boutons notion préc./suiv. obligatoires ; repli des notions.

---

## 4.6 Cas cliniques

### Objectif

« Comment cela se manifeste et se raisonne-t-il cliniquement ? »

### Contenu

Cas typique · cas piège · variante (si pertinent). Badge IA si généré :

> *Cas clinique pédagogique (généré par IA à partir du contenu EDN)*

Priorité contenu officiel ; cas multi-notions favorisés si valeur pédagogique.

### Interactions

Scroll ; overlays (comme Notions) ; figure → agrandissement ; source → traçabilité.

### Données persistantes

Overlays apprenant.

### Origine des données

Officiel prioritaire ; sinon IA identifiée, contrainte EDN.

### Comportements particuliers

Un cas **applique** la compréhension — ne remplace pas le walkthrough.

### Hors périmètre

Simulateur patient ; diagnostic libre sans correction.

---

## 4.7 Collège officiel

### Objectif

Lire le **texte officiel verbatim** du Collège pour le chapitre.

### Contenu

Texte acquisition segmenté (titres, sections) ; chemin de section ; pas de réécriture Lou. Liens vers notions si mapping disponible (optionnel V1).

### Interactions

Scroll ; sélection → overlays apprenant (distincts des notes de l'onglet Notes) ; ancrage section si TOC Collège.

### Données persistantes

Overlays ; position scroll / section (best effort).

### Origine des données

Acquisition FIL B ([contrat 03](../contracts/03-ACQUISITION-SSOT.md)) — autorité verbatim.

### Comportements particuliers

Aucune édition par l'étudiante ; distinction visuelle nette vs contenu Lou des autres onglets.

### Hors périmètre

Édition source ; commentaires collaboratifs.

---

## 4.8 QCM

### Objectif

Entraînement **intermédiaire** — entre relecture et banques EDN officielles.

### Contenu

- Banque **persistante ~50 questions** / chapitre ; couverture complète des notions structurantes.
- Niveau intermédiaire ; questions **indépendantes**.
- Badge si généré : *« Banque QCM pédagogique (générée par IA à partir du contenu EDN) »*
- Une question active à la fois (ou liste avec une seule réponse à la fois).

**Barème officiel :**

| Réponse | Points |
|---|---|
| Correcte | 1,0 |
| Partiellement correcte | 0,5 |
| Erreur légère / incomplète | 0,2 |
| Incorrecte | 0 |

**Historique couleur** (dernière tentative, persistant) :

| Couleur | Signification |
|---|---|
| Vert | 1,0 |
| Orange / ambre | 0,5 ou 0,2 |
| Rouge | 0 |
| Neutre | Jamais répondue |

### Interactions

1. Cocher une proposition → active **Répondre** et **Répondre avec explication** (désactivés tant qu'aucune case cochée).
2. **Répondre** → score, couleur, question suivante.
3. **Répondre avec explication** → score + **overlay** :
   - explication de **chaque** proposition ;
   - référence précise vers Collège (section, citation, lien Notions / Collège officiel) ;
   - fermeture : clic extérieur, Fermer, Échap ;
   - après fermeture : même enregistrement que Répondre.

### Données persistantes

Banque ; dernière réponse et score par question ; couleurs historique. Ordre de passage libre.

### Origine des données

Questions et explications : IA **identifiée**, contrainte EDN ; barème : règle produit.

### Comportements particuliers

Pas de chronomètre ; pas de classement ; question obsolète → « à revoir » ou retrait avec avertissement.

### Hors périmètre

Banques EDN officielles ; examen blanc chronométré ; partage scores.

---

## 4.9 Notes

### Objectif

Fiches **personnelles** structurées par catégories — consolidation après lecture et QCM.

### Contenu

**Catégories par défaut :** Pièges · Exceptions · À retenir · À revoir.

Chaque **note personnelle** : texte libre (plain text V1) ; images optionnelles avec **titre** obligatoire — vignette par défaut.

### Interactions

Créer / éditer note ; renommer / créer / supprimer / réordonner catégories (confirmation avant suppression) ; ajouter image + titre ; clic image → agrandir / replier (toggle).

### Données persistantes

Notes, catégories (noms, ordre), images — local apprenant, scope chapitre.

### Origine des données

100 % apprenant ; catégories par défaut = modèle produit initial.

### Comportements particuliers

Label « Notes personnelles » ; distinct des **notes inline** (overlays walkthrough).

**Hors périmètre V1 (explicit) :** surlignage dans les notes personnelles ; annotations riches ; éditeur riche (gras, listes formatées…). V1 = texte libre + images titrées.

### Hors périmètre

Sync cloud ; export ; partage ; OCR / IA sur images.

---

# 5. Couche apprenante

Comportements sur les onglets à contenu officiel annotable (Notions, Cas cliniques, Collège officiel, walkthrough Modèle mental). Principes : doc 14 § Couche 3.

## 5.1 Surlignage

Sélection dans zone officielle → choix couleur (~5) → marquage visible, texte officiel lisible → suppression individuelle. Persistance : chapitre, onglet, notion, ancre texte.

## 5.2 Note inline

Ajout texte court au walkthrough (caret ou toolbar) — visuellement distinct, édition / suppression sur place. Distincte des **notes personnelles** (onglet Notes). Persistance : ancre caret + notion.

## 5.3 Formatage sur figure officielle

Sélection texte dans figure SVG inline → gras, italique, souligné, barré, couleurs (palette limitée) en overlay — nœuds officiels intouchés. Fallback image : pas de formatage.

## 5.4 Schéma personnel

Bouton 📷 par notion → import / photo → ancrage notion, indépendant de la figure officielle. Suppression par l'étudiante.

## 5.5 Extensions futures

Overlays graphiques SVG, etc. — même règle de superposition.

## 5.6 Hors couche overlay

| Élément | Nature |
|---|---|
| Onglet Notes | Espace structuré — pas overlay |
| Onglet QCM | Contenu généré Lou |
| Réponses QCM | Persistance performance — pas overlay |

---

# 6. Principes UX (application)

Les principes fondateurs : **doc 14 § Principes fondamentaux**. Application comportementale :

| Situation | Attente |
|---|---|
| Densité | Une intention par écran ; bullets prioritaires |
| Official vs personnel | Styles et labels distincts |
| IA | Badge sur tout contenu non verbatim Collège |
| Immutabilité | Pas d'édition du fond officiel |
| Structure notion | Question → figure → walkthrough → points d'attention |
| Position | Breadcrumb permanent |
| Absences | Signalées — jamais de trou silencieux |

Non-objectifs produit : **doc 14 § Non-objectifs**.

---

# 7. Fonctionnalités différées

Non spécifiées pour la V1 — aligné doc 14 § Hors périmètre V1 :

Progression · statistiques · gamification · navigation avancée · Inter-EDN · surlignage dans Notes · éditeur riche Notes · banques EDN dans Reader · sync cloud · collaboration · chat IA · dark mode · QCM chronométré format examen · repli blocs Notions · recommandation algorithmique.

---

# Annexe — État d'implémentation Item 234 (post Reader Acceptance V1)

*Informative — 2026-08-02. Les identifiants `story`, `overview`, `mechanisms`, `clinical-reasoning` sont des **artefacts de production**, pas des vues produit.*

| Vue Reader (baseline v1.0) | Item 234 — post-RA V1 | Statut |
|---|---|---|
| Amorçage cognitif | `cognitive-priming.v1.json` | Alimenté |
| Modèle mental | Composition — source production `story` | Alimenté |
| Notions | Composition — source production `mechanisms` | Alimenté |
| Cas cliniques | Composition — `clinical-reasoning` + scénarios | Alimenté |
| Collège officiel | Texte verbatim | Alimenté |
| QCM | Banque package | Alimenté |
| Notes | Couche apprenant | Alimenté |

Référence : [`releases/reader-acceptance-v1-publication.md`](../releases/reader-acceptance-v1-publication.md) · modèle produit [`00-READER-V1-PRODUCT-MODEL.md`](./00-READER-V1-PRODUCT-MODEL.md).

---

# Historique des versions

| Version | Date | Changement |
|---|---|---|
| 0.1 | 2026-07-28 | Spec initiale — parcours, écrans, QCM, Notes |
| **1.0** | 2026-07-28 | **Baseline officielle** — alignement sept onglets avec doc 14 ; déduplication ; terminologie ; renvois ; gel documentaire |
| **1.1** | 2026-08-02 | Annexe implémentation — post Reader Acceptance V1 ; terminologie projections = production |

---

*Baseline officielle Reader Lou Médecine v1.0 — comportement utilisateur. Évolutions substantielles : révision de version explicite + alignement doc 14.*
