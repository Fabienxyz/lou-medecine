# Reader V1 — Architecture du Shell

| | |
|---|---|
| **Type** | Spécification d'architecture produit — **référence unique d'implémentation Shell** |
| **Version** | 1.1 |
| **Statut** | **En vigueur — gel d'architecture Shell V1** |
| **Date** | 2026-08-03 |
| **Dernière révision** | 2026-08-03 — principes de conception, Shell State, incrément S1 |
| **Contexte** | Décision propriétaire : *« Reader V1 désigne le produit complet, pas uniquement le moteur »* |
| **Autorité** | Complète les docs 00, 14, 15 et les contrats composants ; **ne les remplace pas** |
| **Périmètre** | Shell applicatif Reader V1 exclusivement |
| **Hors périmètre** | Composition V1, Renderer contenu, Offline, Session, Patrimoine, Recherche, Préférences — **comportements gelés** ; cette spec ne définit que leur **cadre d'intégration Shell** |

**Règle de lecture :** pour le **produit utilisateur** (7 vues, parcours) → [`00-READER-V1-PRODUCT-MODEL.md`](./00-READER-V1-PRODUCT-MODEL.md), [`14-LOU-READER-ARCHITECTURE.md`](./14-LOU-READER-ARCHITECTURE.md), [`15-READER-FUNCTIONAL-SPECIFICATION.md`](./15-READER-FUNCTIONAL-SPECIFICATION.md). Pour la **Composition** → [`READER-COMPOSITION-V1-FREEZE.md`](./READER-COMPOSITION-V1-FREEZE.md), [`COMPOSITION-COMPONENT-CONTRACT.md`](../contracts/components/COMPOSITION-COMPONENT-CONTRACT.md). Pour le **Renderer contenu** → [`RENDERER-COMPONENT-CONTRACT.md`](../contracts/components/RENDERER-COMPONENT-CONTRACT.md). **Ce document** fixe le **cadre applicatif** (navigation, chrome, écrans Couche 1) dans lequel ces composants s'exécutent.

En cas de conflit sur une **obligation normative** (fidélité, immutabilité, composition), les contrats fondamentaux et ADR priment sur ce document.

---

## Table des matières

1. [Mission et frontières des couches](#1-mission-et-frontières-des-couches)
   - [1.5 Principes de conception du Shell](#15-principes-de-conception-du-shell)
   - [1.6 Shell State](#16-shell-state)
2. [Audit du shell actuel](#2-audit-du-shell-actuel)
3. [Architecture cible du Shell Reader V1](#3-architecture-cible-du-shell-reader-v1)
4. [Navigation complète](#4-navigation-complète)
5. [Composants permanents](#5-composants-permanents)
6. [Composants contextuels](#6-composants-contextuels)
7. [Cartographie documentation → composants](#7-cartographie-documentation--composants)
8. [Suppressions obligatoires](#8-suppressions-obligatoires)
9. [Critères d'acceptation du Shell V1](#9-critères-dacceptation-du-shell-v1)
10. [Guide d'implémentation mécanique](#10-guide-dimplémentation-mécanique)

---

# 1. Mission et frontières des couches

## 1.1 Définition — Shell Reader V1

Le **Shell Reader V1** est le **cadre applicatif** de Lou Médecine : structure HTML/CSS, navigation entre écrans, chrome persistant, points d'ancrage des overlays transverses, et orchestration **non pédagogique** du cycle de vie (bootstrap produit, routing, reprise de session au niveau écran/onglet).

Le Shell **n'est pas** le moteur de rendu du contenu officiel. Il **n'est pas** la Composition. Il **héberge** le Renderer dans une zone de contenu dédiée.

## 1.2 Responsabilités par couche

| Couche | Responsabilités | Ne fait **jamais** |
|---|---|---|
| **Shell Reader V1** | Routing Couche 1 → Reader ; chrome (header, breadcrumb, barre 7 vues, actions globales) ; montage des panneaux transverses (recherche, préférences) ; affichage métadonnées **non médicales** de navigation (titre chapitre, spécialité, temps de lecture en page spécialité) ; coordination reprise (écran + onglet + ancre) ; états vides / erreur bootstrap au niveau application | Lire ou interpréter le contenu pédagogique (markdown, JSON amorçage, questions QCM) ; décider quelles vues existent ; agréger des projections ; parser des artefacts ; appliquer des règles médicales ; modifier le package |
| **Composition Engine** | `compose(manifest, compositionSpec)` → Reading View Model + diagnostics ; labels, ordre, disponibilité des 7 vues ; agrégation déclarative des sources | DOM ; Shell ; fetch runtime ; reformulation médicale ; lecture Inventory/Blueprint ; persistance |
| **Reading View Model** | Interface **unique** entre Composition et consommateurs aval ; expose `views[]` (viewId, label, displayOrder, availability, refs, blocs légers) ; identité chapitre | Autorité médicale ; persistance ; décision de présentation DOM ; connaissance du Shell |
| **Renderer (contenu)** | Présenter une vue à partir du ViewModel ; fetch artefacts via Package Access ; règles UI statiques par `viewId` (TOC Notions, badges) ; montage couche apprenante sur contenu officiel | Choisir l'existence ou l'ordre des vues ; lire Composition Specification ; lire registre projections pour navigation ; posséder le chrome Shell |
| **Contrôleur d'application** *(module distinct du Shell DOM)* | Boot : product bootstrap, appel Composition, init Session/Recherche/Préférences, wiring événements ; expose API interne (`showTab`, `navigateToChapter`) | Définir la structure visuelle du chrome (responsabilité Shell) |

### 1.2.1 Invariants de frontière

1. **Shell ⊥ contenu pédagogique** — Le Shell ne parse, ne transforme, ni n'affiche de contenu médical. Il consomme uniquement des **métadonnées de navigation** : `viewId`, `label`, `displayOrder`, `availability`, identifiants chapitre/spécialité, temps de lecture catalogue.
2. **Composition ⊥ Shell** — La Composition ne connaît pas les écrans Bibliothèque, le breadcrumb, ni les panneaux. Elle ne reçoit que manifest + spec.
3. **ViewModel = interface unique** — Shell et Renderer consomment le **même** Reading View Model. Le Shell lit la liste `views` pour la barre d'onglets ; le Renderer lit la vue active pour le fetch. Aucun canal parallèle (pas de re-lecture du manifest pour les onglets).
4. **Couche apprenante ⊥ Shell** — Overlays (surlignage, inline notes, formatage figure) appartiennent au Renderer + Learner Layer. Le Shell ne gère pas la sélection texte.
5. **Couche 1 ⊆ Shell** — Bibliothèque EDN et Page spécialité sont des **écrans Shell**, pas des vues Composition.

## 1.3 Schéma d'architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│  SHELL READER V1                                                        │
│  ┌───────────────────────────────────────────────────────────────────┐  │
│  │ Couche 1 — Bibliothèque EDN │ Page spécialité                    │  │
│  └───────────────────────────────────────────────────────────────────┘  │
│  ┌───────────────────────────────────────────────────────────────────┐  │
│  │ Chrome Reader — breadcrumb │ actions globales │ barre 7 vues      │  │
│  ├───────────────────────────────────────────────────────────────────┤  │
│  │ Zone contenu (#reader-content)                                    │  │
│  │   ┌─────────────────────────────────────────────────────────────┐ │  │
│  │   │ RENDERER — vue active (ViewModel.views[i])                  │ │  │
│  │   │   + Couche apprenante (overlays)                            │ │  │
│  │   └─────────────────────────────────────────────────────────────┘ │  │
│  └───────────────────────────────────────────────────────────────────┘  │
│  Overlays Shell : recherche locale │ préférences affichage               │
└─────────────────────────────────────────────────────────────────────────┘
         ↑ Reading View Model (interface unique)
┌────────┴────────┐
│ Composition     │  compose(manifest, spec)
└────────┬────────┘
         ↑ manifest via Package Access ← Bibliothèque (PDR-D1)
```

## 1.4 Chaîne documentaire de référence

| Besoin | Document |
|---|---|
| 7 vues, terminologie produit | `00-READER-V1-PRODUCT-MODEL.md` |
| Vision trois couches, non-objectifs | `14-LOU-READER-ARCHITECTURE.md` |
| Écrans, interactions, parcours | `15-READER-FUNCTIONAL-SPECIFICATION.md` |
| Gel Composition, répartition | `READER-COMPOSITION-V1-FREEZE.md` §4 |
| Contrat Composition | `COMPOSITION-COMPONENT-CONTRACT.md` |
| Contrat Renderer | `RENDERER-COMPONENT-CONTRACT.md` |
| Bibliothèque installable | `LIBRARY-CATALOG-CONTRACT.md`, PDR-D1 |
| Recherche locale | `LOCAL-SEARCH-COMPONENT-CONTRACT.md`, PDR-D6 |
| Préférences affichage | `DISPLAY-PREFERENCES-COMPONENT-CONTRACT.md`, PDR-D7 |
| Reprise session | PDR-D4, contrats Session |
| **Shell V1 (ce document)** | `20-READER-V1-SHELL-ARCHITECTURE.md` |

---

## 1.5 Principes de conception du Shell

Ces principes **gouvernent toute implémentation Shell** et ne peuvent être contredits par un raccourci de développement.

| # | Principe | Énoncé |
|---|---|---|
| P-S1 | **Shell ⊥ contenu pédagogique** | Le Shell ne connaît **aucun** contenu pédagogique : pas de markdown, pas de JSON amorçage, pas de walkthrough, pas de question QCM, pas de scénario clinique. |
| P-S2 | **Composition ⊥ Shell** | La Composition ne connaît **jamais** le Shell : pas d'import Shell, pas de référence DOM, pas de routing, pas d'écran Bibliothèque. |
| P-S3 | **ViewModel = interface unique** | Le **Reading View Model** est l'**unique** interface entre Shell (barre 7 vues) et Renderer (contenu vue). Aucun canal parallèle via manifest pour la navigation inter-vues. |
| P-S4 | **Orchestration sans rendu pédagogique** | Le Shell orchestre **emplacement**, **navigation** et **overlays** transverses ; il **ne rend jamais** directement le contenu pédagogique. |
| P-S5 | **Aucune logique médicale** | Aucune logique médicale, éditoriale ou métier chapitre dans le Shell — y compris heuristiques de « progression », objectifs affichés ou badges IA. |
| P-S6 | **Agnosticisme chapitre** | Aucun composant Shell ne dépend de l'identifiant `cardio/234` ni d'un chapitre golden master ; toute donnée affichée provient du catalogue ou du manifest **générique**. |
| P-S7 | **Chrome non pédagogique** | Le chrome permanent ne contient **pas** d'information pédagogique : pas d'objectifs, pas de résumé, pas de profil Compréhension/Mémorisation, pas de faux dashboard. |
| P-S8 | **Transverses pilotées par état** | Recherche, préférences, zoom figure (signal Renderer → Shell State), bootstrap et mode écran sont pilotés par un **état Shell explicite** — pas par inspection DOM ad hoc. |
| P-S9 | **Dev ≠ produit** | Le mode développement (`?chapter=` sans `product=1`, fallback legacy) **ne dicte pas** le produit final ; le Shell produit (`product=1`) est la référence UX. |

### 1.5.1 Métadonnées hors chrome — S1

| Donnée | Statut S1 | Destination future |
|---|---|---|
| **Objectifs chapitre** (`manifest.objectives` ou équivalent) | **Retirés du chrome** ; **conservés dans le manifest/package** | Amorçage cognitif (doc 15 §4.3) ou fiche chapitre Couche 1 |
| **Temps de lecture** (`read_time`, etc.) | **Retiré du header Reader** ; **conservé dans le manifest/catalogue** | Page spécialité (doc 15 §4.2) |

**S1 = suppression du chrome legacy, pas suppression des métadonnées utiles.**

---

## 1.6 Shell State

Le **Shell State** est distinct du **Reading View Model**. Il modélise l'**expérience applicative** (écran, overlays, bootstrap) — jamais le contenu médical.

### 1.6.1 Schéma

```typescript
/** État Shell — aucun champ médical */
interface ShellState {
  screenMode: "library" | "specialty" | "reader" | "bootstrap-error";
  activeSpecialtyId: string | null;
  activeChapterId: string | null;
  activeViewId: string | null;       // viewId Composition — pas label produit
  searchOpen: boolean;
  preferencesOpen: boolean;          // panneau inline ouvert (si applicable)
  figureZoomOpen: boolean;           // signalé par Renderer / figure-zoom
  bootstrapStatus: "idle" | "pending" | "ready" | "error";
  bootstrapError: string | null;     // code diagnostic — pas message médical
}
```

### 1.6.2 Propriétaire

| Responsable | Rôle |
|---|---|
| **Contrôleur d'application** (`app.js` ou successeur) | **Propriétaire unique** du Shell State ; mutations centralisées |
| **Shell UI modules** *(futurs `shell/*`)* | Lisent l'état ; émettent intentions (`OPEN_SEARCH`, `SELECT_VIEW`, …) |
| **Reading View Model** | **Ne fait pas partie** du Shell State ; consommé séparément après Composition |
| **Renderer / figure-zoom** | Peut **signaler** `figureZoomOpen` via callback — ne possède pas le Shell State |

### 1.6.3 Transitions autorisées

```
                    ┌─────────────┐
         boot ─────►│   pending   │
                    └──────┬──────┘
                           │
              ┌────────────┼────────────┐
              ▼            ▼            ▼
        bootstrap-error  reader    library/specialty
              │            │            │
              └────────────┴────────────┘
                      (navigation utilisateur)
```

| De | Vers | Déclencheur |
|---|---|---|
| `*` | `pending` | Début bootstrap produit |
| `pending` | `reader` | Bootstrap OK + `chapter` résolu + ViewModel produit |
| `pending` | `bootstrap-error` | Échec bootstrap |
| `pending` | `library` | Boot sans `chapter` *(S3+)* |
| `library` | `specialty` | Clic spécialité *(S3+)* |
| `specialty` | `reader` | Clic chapitre |
| `reader` | `specialty` | Breadcrumb spécialité *(S2+)* |
| `reader` | `library` | Breadcrumb EDN *(S2+)* |
| `bootstrap-error` | `library` | Action retour *(S3+)* |

**S1 :** seules les transitions vers `reader` (direct `?chapter=`) et `bootstrap-error` sont implémentées ; `screenMode` vaut `reader` ou `bootstrap-error`.

### 1.6.4 Persistance

| Champ | Persistant ? | Mécanisme |
|---|---|---|
| `screenMode`, `activeSpecialtyId`, `activeChapterId` | Non | URL + boot |
| `activeViewId` | Oui (indirect) | Session Service (PDR-D4) — **pas** dans Shell State persistant |
| `searchOpen` | Non | Éphémère |
| `preferencesOpen` | Non | Éphémère |
| `figureZoomOpen` | Non | Éphémère |
| `bootstrapStatus`, `bootstrapError` | Non | Cycle de vie page |

### 1.6.5 Invariants Shell State

1. **Jamais de contenu médical** — pas de markdown, pas de claim, pas de question, pas d'objectif pédagogique dans l'état.
2. **ViewModel reste la seule source des 7 vues** — `activeViewId` référence un `viewId` du ViewModel ; le Shell ne invente pas de vues.
3. **`activeViewId` cohérent** — si `screenMode !== "reader"`, alors `activeViewId === null`.
4. **Overlays mutuellement gérables** — `searchOpen` et `figureZoomOpen` peuvent coexister ; le Shell gère focus trap recherche uniquement.

### 1.6.6 Implémentation S1

En S1, le Shell State n'est **pas encore matérialisé** en module dédié. L'état implicite actuel (`chapter`, `currentTab`, bootstrap success/failure) **convergera** vers ce schéma en S2–S3 sans ambiguïté produit.

---

# 2. Audit du shell actuel

**Point d'entrée exécuté aujourd'hui :** `demo/renderer/index.html` — unique HTML du renderer. **Orchestration :** `demo/renderer/app.js`. **Chrome statique + métadonnées :** header HTML + `renderer.applyHeaderMetadata()`.

## 2.1 Inventaire des composants visibles

| # | Composant | Rôle actuel | Origine | Statut cible |
|---|---|---|---|---|
| S01 | `.badge` « Preview » | Marqueur environnement dev/demo | Prototype Gen 2/3 (`index.html:19`) | **Supprimer** |
| S02 | `.header-eyebrow` « Lou Learning Companion » | Branding prototype | Prototype Gen 1–3 | **Supprimer** du chrome Reader ; **Conserver** comme titre application global si écran accueil |
| S03 | `#specialty` (`h1`) | Affiche spécialité manifest | Manifest-driven Gen 3 | **Déplacer** — breadcrumb segment, pas titre principal Reader |
| S04 | `#chapter-line` | Item + identifiant chapitre | Manifest Gen 3 | **Refondre** → segment breadcrumb « Item — Chapitre » cliquable |
| S05 | `#chapter-title` | Titre long chapitre | Manifest Gen 3 | **Supprimer** du header Reader — redondant avec breadcrumb ; titre disponible en Amorçage |
| S06 | `.objectives` + `#objectives-list` | Objectifs « À la fin de cette page… » | Prototype pédagogique Gen 2 | **Supprimer** — non spécifié doc 15 écran Reader ; contenu Amorçage couvre le cadrage |
| S07 | `.philosophy` | Tagline « Comprendre avant de mémoriser » | Prototype Gen 1 | **Supprimer** du chrome — principe doc 14, pas widget header |
| S08 | `#read-time` dans header | Temps de lecture | Manifest Gen 3 | **Déplacer** → Page spécialité (doc 15 §4.2) |
| S09 | `#local-search-trigger` | Ouvre panneau recherche | Reader Acceptance D6 | **Conserver** — repositionner barre actions globales |
| S10 | `#display-preferences-root` | Contrôles thème/taille/largeur | Reader Acceptance D7 | **Conserver** — repositionner barre actions globales |
| S11 | `.progression` (Comprendre/Mémoriser/S'entraîner/Valider) | Faux indicateur progression | Prototype Gen 2 — **absent docs normatifs** | **Supprimer** — contradictoire doc 14 § Non-objectifs, PDR-D5 |
| S12 | `#tabs` (`.tab` × N) | Barre 7 vues Composition | Composition V1 (`app.js` `buildTabs`) | **Conserver** — refondre styling ; labels depuis ViewModel |
| S13 | `#content` | Zone rendu Renderer | Gen 3 | **Conserver** — renommer `#reader-content` (implémentation) |
| S14 | `#local-search-root` | Panneau recherche overlay | D6 | **Conserver** |
| S15 | `.footer-nav` (Concept préc./suiv.) | Navigation séquentielle onglets | Prototype Gen 2 (`renderer.js` `footerNavNode`) | **Supprimer** — non doc 15 ; remplacé par barre 7 vues |
| S16 | `.legacy-notice` | Avertissement contenu prototype | Fallback manifest 404 | **Supprimer** du Shell produit — mode dev uniquement |
| S17 | `bindBreadcrumbAmorçage()` | Clic chapter-line → Amorçage | Reader Acceptance D4 (partiel) | **Refondre** → breadcrumb complet doc 15 §3 |
| S18 | — *(absent)* | Bibliothèque EDN | Doc 15 §4.1 | **Créer** |
| S19 | — *(absent)* | Page spécialité | Doc 15 §4.2 | **Créer** |
| S20 | `<title>Lou Learning Companion</title>` | Titre document | Prototype | **Refondre** → titre dynamique par écran |

## 2.2 Héritages prototype — synthèse

| Génération | Source | Éléments encore visibles | Verdict |
|---|---|---|---|
| Gen 1 — Legacy 221 | `03-HISTORICAL_ARCHITECTURE.md` § Gen 1 | Rythme card/blocs (CSS), philosophie tagline | CSS transitoire acceptable ; tagline **supprimer** du chrome |
| Gen 2 — Assets AI / tabs fixes | § Gen 2 | Footer navigation, progression macro, TABS legacy `config.js` | **Supprimer** en produit ; legacy dev fallback isolé |
| Gen 3 — Manifest demo | § Gen 3 | Header metadata massif, Preview, objectifs | **Refondre** vers Shell cible |
| Composition V1 | `READER-COMPOSITION-V1-FREEZE.md` | 7 onglets depuis ViewModel | **Conserver** — cœur navigation Reader |
| Reader Acceptance V1 | `reader-acceptance-v1-publication.md` | Recherche, prefs, amorçage nav partielle, offline bootstrap | **Conserver** capacités ; **refondre** intégration chrome |

## 2.3 Dette identifiée (informatif — hors scope correction)

| Type | Description |
|---|---|
| Dette UX | Chrome prototype visible en Product Review |
| Dette produit | Couche 1 absente ; parcours direct `?chapter=` |
| Dette technique | `app.js` mélange Shell, orchestration, legacy fallback |
| Dette documentaire | Doc 14 § Hors périmètre « dark mode ultérieur » vs PDR-D7 — **PDR-D7 prime** pour le Shell |

---

# 3. Architecture cible du Shell Reader V1

## 3.1 Structure générale

Trois **modes d'écran** exclusifs gérés par le Shell :

| Mode | `screen` *(param URL)* | Contenu Shell |
|---|---|---|
| **Bibliothèque EDN** | `library` *(défaut si absent `chapter`)* | Liste spécialités |
| **Page spécialité** | `specialty` | Liste chapitres |
| **Reader chapitre** | `reader` *(implicite si `chapter` présent)* | Chrome Reader + zone contenu |

```
┌──────────────────────────────────────────────────────────────┐
│ APP HEADER (persistant toutes screens)                       │
│  [Lou Médecine]                    [Recherche*] [Affichage*] │
│  * Recherche/Affichage visibles uniquement en mode Reader    │
├──────────────────────────────────────────────────────────────┤
│ BREADCRUMB (persistant — contenu varie par screen)           │
├──────────────────────────────────────────────────────────────┤
│ [ MODE LIBRARY │ MODE SPECIALTY │ MODE READER ]              │
│                                                              │
│  library/specialty : contenu propre Shell                    │
│  reader : BARRE 7 VUES + #reader-content                     │
└──────────────────────────────────────────────────────────────┘
│ OVERLAYS : #local-search-root (Reader only)                  │
└──────────────────────────────────────────────────────────────┘
```

## 3.2 App Header

| Propriété | Valeur |
|---|---|
| **Raison d'exister** | Identité application ; actions globales Reader |
| **Contenu permanent** | Marque « Lou Médecine » (clic → Bibliothèque EDN) |
| **Contenu conditionnel** | Bouton Recherche ; contrôles Préférences — **mode Reader uniquement**, Release ouverte |
| **Interdit** | Badge Preview ; indicateur progression ; objectifs chapitre ; tagline philosophie |
| **Référence** | Doc 15 §3 (recherche, prefs) ; PDR-D6, PDR-D7 |

## 3.3 Fil d'Ariane (breadcrumb)

Permanent dans **tous** les modes sauf Bibliothèque racine (segment EDN seul non répété comme fil complet).

### Mode Bibliothèque EDN

```
EDN
```

*(EDN = titre page, pas de fil supplémentaire)*

### Mode Page spécialité

```
EDN  >  [Spécialité]
```

| Segment | Clic |
|---|---|
| EDN | Bibliothèque EDN |
| Spécialité | — *(courant, non cliquable)* |

### Mode Reader chapitre

```
EDN  >  [Spécialité]  >  [Item — Chapitre]  >  [Onglet courant]
```

| Segment | Clic | Effet |
|---|---|---|
| EDN | Oui | → Bibliothèque EDN |
| Spécialité | Oui | → Page spécialité |
| Item — Chapitre | Oui | → Amorçage cognitif (viewId `cognitive-priming`) |
| Onglet courant | Non | — |

**Données :**

| Segment | Provenance |
|---|---|
| Spécialité | `manifest.specialty` ou entrée catalogue |
| Item — Chapitre | `manifest.chapterLine` ou équivalent (`chapter` + identifiant item) |
| Onglet courant | `views[active].label` depuis Reading View Model |

**Référence :** doc 15 §3 « Fil d'Ariane » ; doc 14 § UX.

## 3.4 Navigation — barre des 7 vues

| Propriété | Valeur |
|---|---|
| **Visibilité** | Mode Reader uniquement |
| **Position** | Sous breadcrumb, au-dessus de `#reader-content` |
| **Orientation** | Horizontale ; défilement horizontal si viewport étroit |
| **Labels** | Depuis ViewModel — ordre `displayOrder` 1–7 |
| **Ordre figé** | Amorçage cognitif · Modèle mental · Notions · Cas cliniques · Collège officiel · QCM · Notes |
| **État actif** | Un seul onglet actif ; classe visuelle distincte |
| **Onglet indisponible** | Affiché si présent dans ViewModel avec `availability` ≠ `available` ; clic → message honnête Renderer (pas de masquage) |
| **Numérotation** | **Interdite** (doc 14 § Un onglet = un objectif cognitif) |
| **Sous-onglets** | **Interdits** |

**Référence :** `00-READER-V1-PRODUCT-MODEL.md` §2 ; PDR-B5.

## 3.5 Zone contenu Reader

| Propriété | Valeur |
|---|---|
| **Élément** | `#reader-content` (successeur sémantique de `#content`) |
| **Responsable rendu** | Renderer exclusivement |
| **Shell** | Fournit le conteneur vide ; ne injecte pas de HTML pédagogique |
| **Transitions** | Changement d'onglet → vidage + rendu vue ; restauration overlays par Renderer/Learner Layer |

## 3.6 Overlays Shell

| Overlay | Déclencheur | Modal | Scope |
|---|---|---|---|
| Recherche locale | Bouton header ; Ctrl/Cmd+K | Oui (`role="dialog"`) | Release ouverte |
| Préférences affichage | Contrôles header (selects + reset) | Non — panneau inline header | Application globale |

Les overlays **Shell** ne couvrent pas : zoom figure (Renderer), walkthrough scroll (contenu), toolbar sélection texte (Learner Layer).

## 3.7 Footer

| Décision | **Aucun footer navigation** en Reader V1 |
|---|---|
| **Justification** | Doc 15 ne prévoit pas « Concept précédent/suivant » ; navigation = breadcrumb + 7 vues + TOC Notions + ancres |
| **Exception** | Aucune |

## 3.8 Panneaux latéraux

| Décision | **Aucun panneau latéral permanent** |
|---|---|
| **Justification** | Doc 14 — barre d'onglets horizontale ; TOC intégré vue Notions (Renderer) |

## 3.9 Comportements persistants Shell

| Comportement | Description |
|---|---|
| **Routing** | Historique navigateur natif ; paramètres URL stables |
| **Reprise session** | Au boot Reader : onglet + ancre depuis Session Service ; breadcrumb synchronisé |
| **Préférences affichage** | Appliquées avant premier paint contenu si possible ; classes sur `<html>` ou `<body>` |
| **Mode produit** | `product=1` ou bibliothèque installée — jamais chemins dépôt Git (PDR-D1) |
| **Erreur bootstrap** | Shell affiche écran d'erreur **sans** chrome Reader trompeur (pas de barre 7 vues vide + faux header prototype) |

---

# 4. Navigation complète

## 4.1 Parcours utilisateur nominal

```
Bibliothèque EDN
        ↓  (clic spécialité)
   Page spécialité
        ↓  (clic chapitre)
    Reader — Amorçage cognitif  ← défaut entrée chapitre
        ↓  (onglets / liens internes)
  Modèle mental → Notions → Cas cliniques → Collège → QCM → Notes
        ↓
 Banques EDN officielles  ← HORS Reader (doc 15 §2)
```

## 4.2 Navigation principale

| Action | Mécanisme | Résultat |
|---|---|---|
| Ouvrir Lou (installé) | URL racine / `?product=1` sans `chapter` | Bibliothèque EDN |
| Choisir spécialité | Clic liste | Page spécialité ; URL `?screen=specialty&specialty=<id>&product=1` |
| Choisir chapitre | Clic liste | Reader ; URL `?chapter=<id>&product=1` ; vue = reprise ou Amorçage |
| Changer d'onglet | Clic barre 7 vues | Renderer charge vue ; commit session ; breadcrumb segment 4 mis à jour |
| Retour EDN | Breadcrumb EDN | Bibliothèque |
| Retour spécialité | Breadcrumb Spécialité | Page spécialité |
| Retour Amorçage | Breadcrumb Item — Chapitre | Onglet Amorçage |

## 4.3 Navigation secondaire

| Mécanisme | Scope | Owner |
|---|---|---|
| TOC Notions | Vue Notions | Renderer |
| Clic schéma → Notion | Modèle mental → Notions | Renderer + Shell (`showTab`) |
| Pré-requis EDN (Amorçage) | Chapitre lié si installé | Shell (`navigateToChapterById`) |
| Recherche locale → résultat | Release ouverte | Shell recherche + Renderer ancre |
| Historique navigateur | Tous écrans | Natif |
| Ancres hash | Intra-vue | Renderer |

## 4.4 Changements d'onglets

Séquence obligatoire :

1. Shell reçoit clic onglet (index ou viewId).
2. Session : `flushViewLeave` si applicable (PDR-D4).
3. Shell met à jour état actif barre + breadcrumb segment 4.
4. Shell invoque Renderer `renderComposedView(view, ...)`.
5. Session : `onViewChanged` si changement effectif.
6. Recherche : `onContextChange` si panneau ouvert.

**Interdit :** navigation séquentielle « concept précédent/suivant » au niveau Shell.

## 4.5 Reprise

| Cas | Comportement Shell |
|---|---|
| Première visite chapitre | Amorçage cognitif |
| Visite ultérieure | Dernier onglet + ancre session (PDR-D4) |
| Chapitre lié pré-requis absent | Message honnête ; pas de navigation silencieuse |
| Release non installée / offline bloqué | Écran blocked ; breadcrumb conservé si contexte connu |
| Param `view=<viewId>` (lien interne) | Consommé une fois ; navigation vers vue puis retiré de l'URL |

## 4.6 Recherche

| Propriété | Valeur |
|---|---|
| Disponibilité | Mode Reader, Release ouverte, index prêt |
| Raccourci | Ctrl/Cmd+K |
| Résultat | Shell active onglet cible + Renderer scroll ancre + surbrillance éphémère |
| État panneau | Non persisté en session |

## 4.7 Notes

| Aspect | Shell | Renderer / Learner |
|---|---|---|
| Onglet Notes | Shell : onglet barre 7 vues | Renderer : UI fiches (doc 15 §4.9) |
| Notes inline | — | Learner Layer overlay |
| Focus Notes | Shell : commit `onNotesFocusChanged` | — |

## 4.8 Paramètres URL — convention gelée

| Paramètre | Requis | Description |
|---|---|---|
| `product` | Mode produit | `1` = bibliothèque installée |
| `chapter` | Mode Reader | Identifiant chapitre (`cardio/234`) |
| `screen` | Couche 1 | `library` \| `specialty` |
| `specialty` | Page spécialité | Identifiant spécialité |
| `view` | Deep link | viewId consommé une fois à l'entrée |

**Règle :** si `chapter` présent → mode Reader prime sur `screen`.

## 4.9 Écrans Couche 1 — contenu

### Bibliothèque EDN (doc 15 §4.1)

- Titre « EDN »
- Liste spécialités publiées (depuis catalogue)
- Aucun chapitre à ce niveau
- Aucune progression, stats, recommandation

### Page spécialité (doc 15 §4.2)

- Breadcrumb `EDN > [Spécialité]`
- Titre spécialité
- Liste chapitres : item, titre, **temps de lecture**
- Chapitre non publié : absent ou « indisponible »
- Clic → Reader

**Source données :** `library.json` + métadonnées manifest recopiées catalogue ([`LIBRARY-CATALOG-CONTRACT.md`](../contracts/components/LIBRARY-CATALOG-CONTRACT.md)).

---

# 5. Composants permanents

## 5.1 Liste et fiches

### C01 — App Header

| | |
|---|---|
| **Raison d'exister** | Identité ; accès Bibliothèque ; actions globales Reader |
| **Données affichées** | Marque application |
| **Provenance** | Constante produit |
| **Interactions** | Clic marque → Bibliothèque EDN |
| **Dépendances** | Router Shell |

### C02 — Breadcrumb

| | |
|---|---|
| **Raison d'exister** | Orientation permanente ; retour Couche 1 |
| **Données affichées** | Segments selon mode (§3.3) |
| **Provenance** | Router + ViewModel (onglet) + manifest/catalogue |
| **Interactions** | Clic segments parents |
| **Dépendances** | Session (optionnel), ViewModel |

### C03 — Barre 7 vues

| | |
|---|---|
| **Raison d'exister** | Navigation inter-vues Reader |
| **Données affichées** | `views[].label`, état actif, `availability` |
| **Provenance** | Reading View Model exclusivement |
| **Interactions** | Clic → changement vue |
| **Dépendances** | Composition (amont), Renderer (aval), Session |

### C04 — Zone `#reader-content`

| | |
|---|---|
| **Raison d'exister** | Conteneur Renderer |
| **Données affichées** | — *(vide avant rendu)* |
| **Provenance** | — |
| **Interactions** | Délégation Renderer |
| **Dépendances** | Renderer |

### C05 — Bouton Recherche

| | |
|---|---|
| **Raison d'exister** | Accès recherche locale (PDR-D6) |
| **Données affichées** | Label « Rechercher » ; état `aria-expanded` |
| **Provenance** | — |
| **Interactions** | Ouvre C14 ; Ctrl/Cmd+K |
| **Dépendances** | Local Search Runtime, mode Reader |

### C06 — Contrôles Préférences affichage

| | |
|---|---|
| **Raison d'exister** | Thème, taille, largeur (PDR-D7) |
| **Données affichées** | Valeurs courantes prefs |
| **Provenance** | Display Preferences Runtime |
| **Interactions** | Patch prefs ; reset |
| **Dépendances** | Learner Store, Display Preferences Runtime |

### C07 — Écran Bibliothèque EDN

| | |
|---|---|
| **Raison d'exister** | Couche 1 — choix spécialité |
| **Données affichées** | Liste spécialités |
| **Provenance** | `library.json` agrégé |
| **Interactions** | Clic → Page spécialité |
| **Dépendances** | Library Catalog, Package Access |

### C08 — Écran Page spécialité

| | |
|---|---|
| **Raison d'exister** | Couche 1 — choix chapitre |
| **Données affichées** | Chapitres : item, titre, read-time |
| **Provenance** | Entrées catalogue filtrées par spécialité |
| **Interactions** | Clic → Reader ; breadcrumb EDN |
| **Dépendances** | Library Catalog |

### C09 — Écran Erreur Bootstrap

| | |
|---|---|
| **Raison d'exister** | Échec product bootstrap sans chrome trompeur |
| **Données affichées** | Code diagnostic + message ([`product-bootstrap-errors.js`](../../demo/renderer/library/product-bootstrap-errors.js)) |
| **Provenance** | Product bootstrap |
| **Interactions** | Retour Bibliothèque si possible |
| **Dépendances** | Product bootstrap |

### C10 — Titre document `<title>`

| | |
|---|---|
| **Raison d'exister** | Accessibilité ; onglet navigateur |
| **Données affichées** | « Lou Médecine » + contexte (spécialité/chapitre/vue) |
| **Provenance** | Router |
| **Interactions** | — |
| **Dépendances** | — |

---

# 6. Composants contextuels

## 6.1 C11 — Panneau Recherche locale

| | |
|---|---|
| **Raison d'exister** | Recherche in-chapter Release (PDR-D6) |
| **Données affichées** | Input, statut, liste résultats (snippet, vue, ancre) |
| **Provenance** | Local Search Runtime |
| **Interactions** | Saisie ; clic résultat → navigation ; Échap ferme |
| **Dépendances** | C05, C03, Renderer, Search Navigation |
| **Owner implémentation actuelle** | `local-search-ui.js` — **comportement gelé** ; Shell fournit mount points |

## 6.2 C12 — Zoom figure SVG

| | |
|---|---|
| **Raison d'exister** | Lecture figure agrandie (doc 15 §3 Figures) |
| **Owner** | **Renderer** (`figure-zoom.js`) — **pas Shell** |
| **Shell** | Aucune responsabilité |

## 6.3 C13 — Walkthroughs et TOC Notions

| | |
|---|---|
| **Owner** | **Renderer** |
| **Shell** | Reçoit demande navigation si changement d'onglet requis |

## 6.4 C14 — Overlays couche apprenante

| Overlay | Owner | Shell |
|---|---|---|
| Surlignage | Learner Layer | — |
| Note inline | Learner Layer | — |
| Formatage figure | Learner Layer | — |
| Schéma personnel | Learner Layer | — |
| Traceabilité (popup) | Renderer | — |

## 6.5 C15 — Vue QCM / Vue Notes (contenu onglet)

| | |
|---|---|
| **Chrome onglet** | Shell (C03) |
| **Contenu onglet** | Renderer |
| **Spec cible contenu** | Doc 15 §4.8 (QCM interactif) ; §4.9 (Notes structurées) |
| **Note** | L'implémentation Renderer actuelle (coques) est **hors périmètre Shell** — le Shell expose l'onglet ; le Renderer doit converger vers doc 15 indépendamment |

---

# 7. Cartographie documentation → composants

| Document normatif | Section | Composant Shell | Écart implémentation actuelle |
|---|---|---|---|
| `00-READER-V1-PRODUCT-MODEL.md` | §2 — 7 vues | C03 | Conforme si bootstrap OK |
| `14-LOU-READER-ARCHITECTURE.md` | § Couche 1 | C07, C08 | **Absent** |
| `14-LOU-READER-ARCHITECTURE.md` | § UX breadcrumb | C02 | **Partiel** (chapter-line seulement) |
| `14-LOU-READER-ARCHITECTURE.md` | § Non-objectifs dashboard | — | S11 progression **non conforme** |
| `15-READER-FUNCTIONAL-SPECIFICATION.md` | §2 Parcours | C07→C08→C03 | Entrée directe `?chapter=` |
| `15-READER-FUNCTIONAL-SPECIFICATION.md` | §3 Breadcrumb | C02 | **Non conforme** |
| `15-READER-FUNCTIONAL-SPECIFICATION.md` | §3 Barre onglets | C03 | Conforme |
| `15-READER-FUNCTIONAL-SPECIFICATION.md` | §3 Recherche | C05, C11 | Conforme (Reader) |
| `15-READER-FUNCTIONAL-SPECIFICATION.md` | §3 Préférences | C06 | Conforme (Reader) |
| `15-READER-FUNCTIONAL-SPECIFICATION.md` | §4.1 Bibliothèque | C07 | **Absent** |
| `15-READER-FUNCTIONAL-SPECIFICATION.md` | §4.2 Page spécialité | C08 | **Absent** ; read-time mal placé (S08) |
| `PDR-D1` | App installable | Routing produit | Infra OK ; UI Couche 1 absente |
| `PDR-D5` | Pas d'indicateur progression V1 | — | S11 **contradictoire** |
| `PDR-D6` | Recherche locale | C05, C11 | Conforme |
| `PDR-D7` | Préférences + thème | C06 | Conforme |
| `PDR-B5` | 7 vues gelées | C03 | Conforme |
| `LIBRARY-CATALOG-CONTRACT.md` | Catalogue | C07, C08 | Données OK ; UI absente |
| `READER-COMPOSITION-V1-FREEZE.md` | §4 Renderer ≠ vues | C03 vs Renderer | Séparation OK ; chrome mélangé |
| `RENDERER-COMPONENT-CONTRACT.md` | Présentation contenu | C04 | Footer S15 **hors Renderer cible** |

---

# 8. Suppressions obligatoires

Éléments dont la **disparition du Shell produit** est requise pour conformité Reader V1 complet.

| ID | Élément | Justification |
|---|---|---|
| X01 | Badge « Preview » | Absent toute doc normative ; marqueur dev |
| X02 | Bloc `.progression` (Comprendre/Mémoriser/…) | Doc 14 § Non-objectifs « tableau de bord » ; PDR-D5 diffère indicateur progression |
| X03 | Footer `.footer-nav` Concept préc./suiv. | Absent doc 15 ; navigation remplacée par C03 |
| X04 | Bloc `.objectives` header | Non spec doc 15 Reader chrome ; redondant Amorçage §4.3 |
| X05 | `.philosophy` tagline header | Principe doc 14 — pas widget chrome |
| X06 | `#chapter-title` en header Reader | Remplacé par breadcrumb segment |
| X07 | `#specialty` comme `h1` dominant Reader | Remplacé par breadcrumb |
| X08 | `#read-time` en header Reader | Doc 15 §4.2 — appartient Page spécialité |
| X09 | `.header-eyebrow` « Lou Learning Companion » en Reader | Remplacé par C01 App Header unifié |
| X10 | Chrome Reader complet en échec bootstrap | Faux positif produit ; remplacer par C09 |

**Non supprimé (explicitement conservé) :**

| Élément | Motif |
|---|---|
| Fallback legacy `config.TABS` | Mode dev manifest 404 — **isolé** ; jamais visible mode `product=1` |
| `.legacy-notice` | Mode dev uniquement |
| Barre 7 vues | Composition V1 — cœur produit |
| Recherche / Préférences | PDR-D6, D7 |

### 8.1 Incrément S1 — périmètre de suppression

S1 retire **uniquement le chrome visible legacy** listé ci-dessous. **Ne supprime pas** les métadonnées manifest (`objectives`, `read_time`, etc.) — elles restent disponibles pour Amorçage et Couche 1.

| Livré S1 | Différé S2+ |
|---|---|
| X01 Preview | X06 repositionnement titre (breadcrumb) |
| X02 Progression | X07 specialty → breadcrumb |
| X03 Footer legacy | Couche 1 complète |
| X04 Objectives header | X10 écran bootstrap dédié |
| X05 Philosophy | |
| X08 read-time header | |
| X09 Lou Learning Companion | Remplacé par « Lou Médecine » |

---

# 9. Critères d'acceptation du Shell V1

Critères **falsifiables** — chacun vérifiable par inspection DOM, URL, ou scénario smoke dédié Shell.

## 9.1 Héritage et chrome

| ID | Critère | Vérification |
|---|---|---|
| SA-01 | Aucun élément X01–X10 visible en mode `product=1` | Audit DOM sur Product Review |
| SA-02 | Aucun texte « Preview », « Lou Learning Companion » dans chrome Reader | grep DOM |
| SA-03 | Aucun footer « Concept précédent/suivant » | grep DOM / smoke |
| SA-04 | Aucun bloc progression macro (4 phases emoji) | grep DOM |

## 9.2 Couche 1

| ID | Critère | Vérification |
|---|---|---|
| SA-05 | URL sans `chapter` ouvre Bibliothèque EDN | Navigation manuelle |
| SA-06 | Liste spécialités alimentée depuis catalogue installé | Données `library.json` |
| SA-07 | Page spécialité affiche chapitres + read-time | doc 15 §4.2 |
| SA-08 | Clic chapitre → Reader avec bootstrap Composition | 7 onglets visibles |

## 9.3 Navigation Reader

| ID | Critère | Vérification |
|---|---|---|
| SA-09 | Breadcrumb 4 segments en mode Reader conforme §3.3 | Inspection |
| SA-10 | Clic EDN / Spécialité / Chapitre → écrans corrects | Scénario E2E |
| SA-11 | Barre 7 vues : labels et ordre depuis ViewModel | Compare ViewModel vs DOM |
| SA-12 | Changement onglet met à jour segment 4 breadcrumb | Scénario |
| SA-13 | Pas de numérotation onglets | Inspection |

## 9.4 Frontières architecture

| ID | Critère | Vérification |
|---|---|---|
| SA-14 | Shell ne fetch pas artefacts pédagogiques pour affichage | Revue code Shell modules |
| SA-15 | Onglets construits exclusivement depuis ViewModel post-Composition | Pas de `config.TABS` en product=1 |
| SA-16 | Composition module n'importe aucun module Shell | Revue dépendances |
| SA-17 | Échec bootstrap → C09 sans C03 | Scénario bootstrap failure |

## 9.5 Transverses (intégration Shell)

| ID | Critère | Vérification |
|---|---|---|
| SA-18 | Recherche accessible header Reader ; Ctrl/Cmd+K | Smoke LS-* |
| SA-19 | Préférences accessibles header Reader | Smoke DP-* |
| SA-20 | Reprise session restaure onglet + breadcrumb | Smoke CE-* |
| SA-21 | `<title>` reflect contexte | Inspection |

## 9.6 Non-régression produit

| ID | Critère | Vérification |
|---|---|---|
| SA-22 | Suites Composition, Renderer, Offline, Session, Patrimoine, Search, Prefs — **PASS sans modification contrats** | CI existante |
| SA-23 | Product Review script ouvre parcours Bibliothèque → 234 → 7 vues | `scripts/product-review-234.sh` étendu |

---

# 10. Guide d'implémentation mécanique

## 10.1 Découpage modules recommandé

*(Recommandation d'architecture — n'impose pas de rename immédiat)*

| Module | Responsabilité |
|---|---|
| `shell/router.mjs` | Résolution mode screen ; sync URL ↔ état |
| `shell/library-screen.mjs` | C07 |
| `shell/specialty-screen.mjs` | C08 |
| `shell/reader-chrome.mjs` | C02, C03, C01 (partie Reader) |
| `shell/bootstrap-error-screen.mjs` | C09 |
| `app.js` *(ou `application-controller.mjs`)* | Boot, wiring, appels Composition/Session — **sans HTML chrome** |
| `renderer.js` | Inchangé périmètre contenu ; retirer `footerNavNode` |
| `composition/*` | **Inchangé** |
| `library/*`, `session-*`, `local-search-*`, `display-preferences-*` | **Inchangé** |

## 10.2 Séquence boot mode produit

```
1. Router résout screen
2. Si library/specialty → render écran Couche 1 ; STOP
3. Si reader :
   a. Product bootstrap (gelé)
   b. Composition → ViewModel (gelé)
   c. Shell render chrome Reader (C01–C03)
   d. Init prefs (gelé)
   e. Session restore → showTab (gelé)
   f. Init search (gelé)
   g. Renderer renderComposedView (gelé)
4. SW registration — après bootstrap OK (alignement architecture SW étudiée séparément)
```

## 10.3 Ordre d'implémentation suggéré

| Phase | Livrable | Critères |
|---|---|---|
| **S1** ✅ | Suppressions X01–X05, X08, X09, X03 ; shell minimal | SA-02–04, SA-11, SA-18–19, SA-22 ; tests `shell-s1-*` |
| **S2** | C02 breadcrumb complet ; retrait S15 | SA-09–10, SA-03 |
| **S3** | C07 Bibliothèque + C08 Spécialité | SA-05–08 |
| **S4** | C01 header unifié ; reposition C05/C06 | SA-18–19 |
| **S5** | Router URL ; `<title>` ; Product Review | SA-21, SA-23 |
| **S6** | Tests smoke Shell dédiés | SA-01–23 |

## 10.4 Fichiers impactés *(prévision — hors scope cette mission)*

| Fichier | Nature changement |
|---|---|
| `demo/renderer/index.html` | Structure Shell |
| `demo/renderer/styles.css` | Chrome ; retrait progression/footer |
| `demo/renderer/app.js` | Extraction Shell vs orchestration |
| `demo/renderer/renderer.js` | Retrait footerNav |
| `scripts/product-review-234.sh` | URL entrée Bibliothèque |
| Nouveaux `demo/renderer/shell/*` | Écrans Couche 1 |

**Gel explicite — ne pas modifier :** `composition/**`, `library/offline-*`, `session-*`, `learner-*`, `local-search-*`, `display-preferences-*`, packages, Fabrique.

## 10.5 Instructions agent implémentation

Pour piloter l'implémentation sans nouvel arbitrage produit :

1. Lire **ce document** intégralement avant tout code.
2. Traiter SA-01–SA-23 comme Definition of Done.
3. Toute UI non listée §5–§6 → **refusée** sauf ADR/PDR nouveau.
4. En cas de doute produit → doc 15 > doc 14 > PDR > ce document.
5. Ne pas étendre Composition ni Renderer contenu sous prétexte Shell.
6. Conserver tests existants PASS ; ajouter suite `shell-s1-*.test.js`.

## 9.8 Validation critères SA — post S1

| ID | Statut après S1 | Commentaire |
|---|---|---|
| SA-01 | **Partiel** | X01–X05, X08, X09, X03 livrés ; X10 (écran bootstrap dédié) → S3 |
| SA-02 | **PASS** | « Lou Médecine » remplace « Lou Learning Companion » |
| SA-03 | **PASS** | Footer legacy supprimé |
| SA-04 | **PASS** | Bloc progression supprimé |
| SA-05 – SA-08 | **Non applicable** | Couche 1 → S3 |
| SA-09 – SA-10 | **Non applicable** | Breadcrumb → S2 |
| SA-11 | **PASS** | 7 vues ViewModel inchangées |
| SA-12 – SA-13 | **Non applicable** | Breadcrumb → S2 |
| SA-14 – SA-17 | **Partiel / différé** | Revue code ; SA-17 → S3 |
| SA-18 – SA-19 | **PASS** | Recherche et Préférences conservées |
| SA-20 – SA-21 | **PASS / partiel** | Session inchangée ; titre `<title>` partiel |
| SA-22 | **PASS** | CI existante |
| SA-23 | **Différé** | Product Review parcours Bibliothèque → S5 |

---

## Documents connexes

| Document | Rôle |
|---|---|
| [`00-READER-V1-PRODUCT-MODEL.md`](./00-READER-V1-PRODUCT-MODEL.md) | Modèle produit 7 vues |
| [`14-LOU-READER-ARCHITECTURE.md`](./14-LOU-READER-ARCHITECTURE.md) | Vision trois couches |
| [`15-READER-FUNCTIONAL-SPECIFICATION.md`](./15-READER-FUNCTIONAL-SPECIFICATION.md) | Interactions utilisateur |
| [`03-HISTORICAL_ARCHITECTURE.md`](./03-HISTORICAL_ARCHITECTURE.md) | Origine héritages |
| [`READER-COMPOSITION-V1-FREEZE.md`](./READER-COMPOSITION-V1-FREEZE.md) | Gel moteur — ne pas modifier |
| [`docs/analysis/`](../analysis/) | Audits préalables (shell actuel vs cible) |

---

## Historique

| Version | Date | Changement |
|---|---|---|
| **1.0** | 2026-08-03 | Création — gel architecture Shell Reader V1 ; décision « Reader V1 = produit complet » |
| **1.1** | 2026-08-03 | Principes de conception §1.5 ; Shell State §1.6 ; incrément S1 §8.1 ; validation SA §9.8 |

---

*Reader V1 Shell Architecture v1.0 — référence unique d'implémentation du cadre applicatif. Le moteur Composition/Renderer reste gelé ; seul le Shell est refondu.*
