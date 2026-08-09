# Visual Grammar v0.1

| | |
|---|---|
| **Type** | Document d'architecture produit |
| **Statut** | v0.1 — proposition de référence (review graphique) |
| **Date** | 2026-08-09 |
| **Périmètre** | Langage graphique officiel des VisualSpecs enrichies — rôles cognitifs, primitives de composition, hiérarchie perceptive, typographie, connecteurs, palette |
| **Autorité** | Prescriptive pour les futurs renderers ; **non normative** au sens des contrats 01–09 |

---

## Position dans l'architecture documentaire

Ce document se situe **entre** la sémantique éditoriale et l'implémentation technique. Il ne contient **aucune valeur d'implémentation** (couleur hexadécimale, épaisseur en pixels, taille de police, espacement numérique). Ces valeurs relèvent exclusivement du **Theme**.

### Chaîne de responsabilités

```
VisualSpec enrichie
  │  porte le sens : entités, kind, relations, libellés
  ↓
Visual Grammar v0.1                    ← ce document
  │  porte le langage graphique : formes, traits, hiérarchie, rythme, règles de composition
  ↓
Visual Grammar Runtime
  │  projection exécutable du Visual Grammar — signatures, prédicats, règles de composition
  ↓
Theme (configuration graphique)
  │  porte les paramètres concrets : teintes, épaisseurs, espacements, rayons
  ↓
Renderer (layout + sérialisation)
     calcule la géométrie et matérialise le SVG — ne réinvente pas les règles du langage
```

| Couche | Question à laquelle elle répond |
|---|---|
| **VisualSpec** | *Que représente ce visuel ? Quel rôle joue chaque entité ?* |
| **Visual Grammar** | *Comment ce rôle se signifie-t-il visuellement ? Comment se composent les objets du graphe ?* |
| **Visual Grammar Runtime** | *Quelles règles sémantiques le code peut-il interroger sans les dupliquer ?* |
| **Theme** | *Quelles valeurs concrètes (couleurs, mesures) incarnent cette signature ?* |
| **Renderer** | *Comment produire l'artefact SVG à partir du plan de composition ?* |

| Document | Rôle dans la chaîne |
|---|---|
| [Contrat 05](../contracts/05-VISUAL-GRAMMAR.md) | Sémantique de la visualSpec, primitives, claims |
| **Visual Grammar v0.1** | Langage graphique produit |
| [SVG Graphic Language V1](../contracts/components/SVG-GRAPHIC-LANGUAGE-V1.md) | Spécification du Theme SVG |
| [Vision VLLR](../contracts/components/VISION.md) | Philosophie produit — pourquoi des visuels |

**Ce document ne décrit pas** l'implémentation, une figure particulière, le pipeline VCCK, ni le renderer lecteur.

**Relation aux contrats existants :** en cas de conflit avec un contrat fondamental ou une ADR, la couche normative prime. Ce document est une **proposition de référence produit** ; il ne modifie aucun contrat en vigueur.

**Frontière Theme :** toute mention de « bleu accent », « trait renforcé » ou « contraste modéré » dans ce document est une **intention graphique**. Le Theme choisit les valeurs mesurables qui la satisfont.

---

# 1. Vision

### Objectif

Le **Visual Grammar** est un **langage graphique** : un vocabulaire de signes visuels doté de règles de combinaison. Il donne une **signification visuelle stable** aux éléments déclarés dans les VisualSpecs enrichies. Chaque `kind`, chaque relation de flux et chaque pattern de composition possède une traduction prévisible, reconnaissable en moins d'une seconde, et cohérente d'une figure à l'autre.

### Ambition pédagogique

Réduire la charge cognitive de **décodage visuel** pour libérer l'attention sur le **contenu médical**. Le lecteur ne doit jamais se demander « pourquoi ce bloc est en pointillé ? » ou « ce losange veut dire quoi ? » — la grammaire répond avant la lecture du libellé.

Le Visual Grammar est **transverse à tous les chapitres et spécialités**. Un étudiant qui maîtrise le langage sur un domaine doit le retrouver intact ailleurs.

---

# 2. Principes fondateurs

Ces principes s'appliquent à toute VisualSpec enrichie, indépendamment du Theme en vigueur.

### P1 — Une fonction cognitive = une représentation graphique

Chaque rôle sémantique (`kind`) correspond à **exactement une** signature visuelle. Deux rôles différents ne partagent jamais la même signature. Deux occurrences du même rôle sont toujours visuellement homogènes.

### P2 — La forme prime sur la couleur

La distinction entre un point de décision et une étape d'action repose d'abord sur la **géométrie** (losange vs rectangle), ensuite sur le trait (plein vs pointillé), enfin sur la teinte. Un daltonien doit pouvoir distinguer les rôles sans s'appuyer exclusivement sur la couleur.

### P3 — La couleur renforce le sens, ne le porte jamais seule

La teinte accentue une fonction déjà portée par la forme. Aucune information pédagogique n'est véhiculée **uniquement** par une couleur.

### P4 — Cohérence inter-figures

Les conventions d'un algorithme décisionnel, d'une séquence d'actions ou d'une comparaison binaire utilisent le **même vocabulaire** de formes, traits et rythmes. La variété stylistique entre chapitres est interdite.

### P5 — Hiérarchie visuelle alignée sur la hiérarchie pédagogique

Ce que l'auteur considère comme titre de phase, liste d'actions ou critère de décision doit se refléter dans la **densité visuelle** : graisse typographique, séparateurs, espacement relatif — pas dans des effets décoratifs.

### P6 — Simplicité avant décoration

Aucun pictogramme, ombre, dégradé ou animation n'ajoute de l'information. Si un traitement graphique ne répond pas à une question pédagogique identifiée, il est exclu.

### P7 — Séparation stricte langage / paramètres

Le Visual Grammar définit **quoi signifier** ; le Theme définit **comment le mesurer**. Aucun paramètre numérique n'appartient au Visual Grammar.

### P8 — Un objet graphique = un rôle cognitif

Chaque primitive graphique (nœud, branche, label, annotation…) porte **exactement un** rôle cognitif. Aucun objet ne cumule les signatures de plusieurs primitives — la confusion visuelle entre elles est une erreur de langage.

---

# 3. Hiérarchie perceptive

Avant toute lecture des libellés, l'œil parcourt la figure selon une **hiérarchie de saillance** prévisible. Cette hiérarchie est normative : le Theme et le renderer la respectent sans la redéfinir.

### Niveaux de priorité visuelle

| Niveau | Élément | Rôle perçu |
|---|---|---|
| **1** | Titre global de la figure | Ancrage — « de quoi parle ce visuel ? » |
| **2** | Entry · Decision · Conclusion | Structure du raisonnement — phases et aboutissements |
| **3** | Action | Opérationnalité — « que faire ? » |
| **4** | Test (examen) | Objectivation — « que mesurer ou prescrire ? » |
| **5** | Dead-end | Atténuation — voie fermée ou improbable |
| **6** | Annotations · Callouts | Contexte — hors flux principal |

### Principes de guidage du regard

1. **Le titre global domine** en taille et en position ; il n'est jamais rivalisé par un nœud interne.
2. **Les rôles structurants** (entry, decision, conclusion) se détachent des rôles opérationnels (action) par la forme et le contraste, pas par la seule position.
3. **Les actions** restent lisibles mais ne dominent pas les phases structurantes.
4. **Les examens** (test) se signifient par un traitement atténué — pointillé, contraste réduit — pour indiquer une étape de mesure, non une décision de parcours.
5. **Les dead-end** reculent visuellement ; ils ne doivent jamais attirer l'œil avant une conclusion.
6. **Les annotations et callouts** restent en retrait du cœur algorithmique.

Cette hiérarchie est **indépendante du layout** : elle s'applique quelle que soit la disposition géométrique choisie par le moteur de composition.

---

# 4. Lexique graphique

Le Visual Grammar distingue **deux niveaux** :

1. **Primitives de composition** (§4.1) — objets graphiques transversaux : nœud, connecteur, branche, label, annotation…
2. **Rôles cognitifs des nœuds** (§4.2) — vocabulaire fermé des `kind` et leurs signatures

Les primitives répondent à *« qu'est-ce que cet objet dans le graphe ? »* ; les `kind` répondent à *« quel rôle clinique cette étape joue-t-elle ? »*

### Tableau de différenciation

| Primitive | Question du lecteur | Porte un `kind` ? | Fait partie du flux principal ? |
|---|---|---|---|
| **Node** | « Quelle étape ? » | Oui | Oui |
| **Connector** | « Où vais-je ensuite ? » | Non | Oui (guide) |
| **Branch** | « Quel chemin si… ? » | Non | Oui |
| **Branch Label** | « Sous quelle condition ? » | Non | Non (annoté sur le flux) |
| **Flow** | « Quel est le fil directeur ? » | — | Oui |
| **Split** | « Où le parcours se divise ? » | — | Oui |
| **Merge** | « Où les voies rejoignent ? » | — | Oui |
| **Annotation** | « Quel contexte global ? » | Non | Non |
| **Callout** | « Quel détail local ? » | Non | Non |

---

## 4.1 Primitives de composition

Structure de chaque entrée :

```
rôle cognitif  →  rôle dans la lecture  →  signature conceptuelle  →  interdits
```

---

### Node (nœud)

| | |
|---|---|
| **Rôle cognitif** | Unité du raisonnement — étape, phase, examen, bifurcation ou aboutissement |
| **Rôle dans la lecture** | Point d'ancrage du regard ; lu comme une **étape** du parcours |
| **Signature conceptuelle** | Forme et trait déterminés par le `kind` (§4.2) — rectangle ou losange, jamais ambigu |
| **VisualSpec** | Entrée `nodes[]` avec `kind` et `label` |
| **Ne représente jamais** | Une condition de transition, une note de contexte, un connecteur, un libellé de branche |

**Qu'est-ce qu'un nœud ?** L'unique primitive qui porte un `kind` et constitue une étape du raisonnement.

---

### Connector (connecteur)

| | |
|---|---|
| **Rôle cognitif** | Lien orienté de transition entre deux éléments du graphe |
| **Rôle dans la lecture** | Guide visuel — indique la **direction** du flux sans être lu comme une étape |
| **Signature conceptuelle** | Trait avec flèche · couleur connecteur neutre · subordonné aux nœuds · jamais plus saillant qu'un nœud |
| **VisualSpec** | Géométrie dérivée des `branches[]` — pas d'entité autonome |
| **Ne représente jamais** | Une étape clinique, un libellé, une décision en soi |

---

### Branch (branche)

| | |
|---|---|
| **Rôle cognitif** | Chemin conditionnel orienté d'un nœud source vers un nœud cible |
| **Rôle dans la lecture** | Alternative ou suite du parcours — *« si cette condition, aller là »* |
| **Signature conceptuelle** | Connecteur + **Branch Label** associé · une branche = une transition déclarée |
| **VisualSpec** | Entrée `branches[]` (`from`, `to`, `condition`) |
| **Ne représente jamais** | Un nœud intermédiaire sans `kind` · une annotation · une étape autonome |

**Qu'est-ce qu'une branche ?** Une transition orientée dans le graphe, matérialisée par un connecteur portant éventuellement un label de condition.

---

### Branch Label (libellé de branche)

| | |
|---|---|
| **Rôle cognitif** | Condition ou critère de la transition — *« sous quelle condition emprunter cette branche ? »* |
| **Rôle dans la lecture** | Lu **sur** ou **le long du** connecteur · jamais comme une étape du parcours |
| **Signature conceptuelle** | Texte en graisse régulière · **sans signature de nœud** (pas de losange, pas de rectangle de `kind`, pas de trait de contour de nœud) · rapporté visuellement à son segment de branche · fond de lisibilité discret autorisé, distinct de l'encadrement d'un nœud |
| **VisualSpec** | Champ `condition` d'une branche |
| **Ne représente jamais** | Une étape clinique · un examen · une décision · un nœud implicite |

**Pourquoi un Branch Label n'est-il pas un nœud ?** Parce qu'il ne porte pas de `kind`, ne constitue pas une étape du raisonnement, et ne participe pas à la progression verticale du flux — il **qualifie** une transition déjà déclarée.

---

### Flow (flux)

| | |
|---|---|
| **Rôle cognitif** | Ensemble cohérent du parcours principal — enchaînement causal ou temporel |
| **Rôle dans la lecture** | Fil directeur que l'œil suit de haut en bas (ou de gauche à droite selon le pattern) |
| **Signature conceptuelle** | Suite de nœuds reliés par des connecteurs de **flux principal** · progression par **couches** perceptives |
| **Ne représente jamais** | Une note en marge · un chemin d'annotation · un raccourci non déclaré |

---

### Split (bifurcation)

| | |
|---|---|
| **Rôle cognitif** | Point de division du flux en plusieurs branches sortantes |
| **Rôle dans la lecture** | Interruption du fil linéaire — *« le raisonnement se divise ici »* |
| **Signature conceptuelle** | Géométrie divergente visible · losange (`decision`) ou éventail depuis un `test` · **Split** n'est pas un `kind` — c'est une **configuration** d'un nœud à sorties multiples |
| **Ne représente jamais** | Une annotation · un merge · une étape supplémentaire non déclarée |

---

### Merge (convergence)

| | |
|---|---|
| **Rôle cognitif** | Rejoindre plusieurs branches vers un nœud cible commun |
| **Rôle dans la lecture** | Reprise d'un fil unique après exploration de voies parallèles |
| **Signature conceptuelle** | Même connecteur que le flux principal · géométrie de convergence · pas de style distinct par branche |
| **Ne représente jamais** | Un nœud de type « merge » implicite · une nouvelle étape non déclarée dans la VisualSpec |

---

### Annotation

| | |
|---|---|
| **Rôle cognitif** | Information contextuelle, périmètre, mise en garde ou note de méthode |
| **Rôle dans la lecture** | Niveau 6 perceptive (§3) — lu **après** le cœur du graphe ou en marge |
| **Signature conceptuelle** | Texte atténué · **sans connecteur entrant ni sortant** du flux principal · placement hors couche algorithmique |
| **VisualSpec** | Entrée `annotations[]` |
| **Ne représente jamais** | Une étape du parcours · une condition de branche · un doublon d'information déjà portée par le flux |

**Pourquoi une annotation n'appartient-elle pas au flux ?** Parce qu'elle documente le parcours sans en faire partie — la supprimer ne change pas la topologie du raisonnement.

---

### Callout (encadré périphérique)

| | |
|---|---|
| **Rôle cognitif** | Détail local rattaché à une branche ou un nœud — contexte, exception, rappel de condition, seuil numérique |
| **Rôle dans la lecture** | Cognitifement **secondaire** · complète un élément sans le remplacer |
| **Signature conceptuelle** | Encadré discret atténué · subordonné à son élément de rattachement · **ne masque jamais** connecteur, label ou nœud · placement hors corridor de flux |
| **VisualSpec** | `threshold_fragment` sur une branche · extensions futures (exception, précision) |
| **Ne représente jamais** | Un nœud · une branche autonome · une étape du parcours · un doublon du Branch Label |

**Différence Annotation / Callout :** l'**annotation** porte sur la **figure** ou le parcours en général ; le **callout** est **rattaché localement** à une branche ou un nœud précis.

---

## 4.2 Rôles cognitifs des nœuds (`kind`)

Le Visual Grammar possède un **vocabulaire fermé** de six rôles cognitifs de nœuds, chacun avec une signature graphique et un objectif pédagogique.

### Structure d'une entrée du lexique

Pour chaque rôle :

```
fonction cognitive  →  signature graphique  →  objectif pédagogique
     (kind)              (forme + trait)         (effet sur le lecteur)
```

Les rôles sont lus **exclusivement** depuis le champ `kind` de la visualSpec. Le renderer ne déduit jamais un rôle à partir du libellé, de la position dans le graphe ou du contenu médical.

---

### Entry

| | |
|---|---|
| **Fonction cognitive** | Point de départ, contexte initial, phase d'ouverture |
| **`kind` VisualSpec** | `entry` |
| **Signature graphique** | Rectangle · fond primaire léger · contour primaire · trait plein · contraste modéré |
| **Objectif pédagogique** | Ancrer le lecteur : « où commence le raisonnement ? » Peut porter des subitems (signes, critères d'appel) |

---

### Action

| | |
|---|---|
| **Fonction cognitive** | Étape opérationnelle intermédiaire, conduite à tenir |
| **`kind` VisualSpec** | `action` |
| **Signature graphique** | Rectangle · fond neutre chaud · contour accent opérationnel · trait **plein** · jamais pointillé |
| **Objectif pédagogique** | Signaler immédiatement « que faire maintenant » — distinct de l'examen et de la décision |

---

### Test (examen)

| | |
|---|---|
| **Fonction cognitive** | Examen, mesure, critère objectivable (biologie, imagerie, exploration) |
| **`kind` VisualSpec** | `test` |
| **Signature graphique** | Rectangle · fond neutre atténué · contour secondaire · trait **pointillé** · contraste modéré |
| **Objectif pédagogique** | Distinguer l'objectivation de l'action et de la décision — « que mesurer ou prescrire comme examen ? » |

---

### Decision

| | |
|---|---|
| **Fonction cognitive** | Bifurcation, arbitrage clinique, seuil de probabilité |
| **`kind` VisualSpec** | `decision` |
| **Signature graphique** | **Losange** · fond clair · contour primaire · trait plein · contour **renforcé** · proportions lisibles au libellé |
| **Objectif pédagogique** | Interrompre le flux linéaire : « ici, le raisonnement se divise » — identifiable par la forme avant toute couleur |

---

### Conclusion

| | |
|---|---|
| **Fonction cognitive** | Aboutissement, caractérisation, issue du parcours |
| **`kind` VisualSpec** | `conclusion` |
| **Signature graphique** | Rectangle · fond primaire **renforcé** · contour primaire · trait plein · contour renforcé |
| **Objectif pédagogique** | Marquer visuellement l'aboutissement — plus « achevé » qu'une entry, sans confondre avec une action |

---

### Dead-end

| | |
|---|---|
| **Fonction cognitive** | Voie terminale négative, exclusion, improbabilité |
| **`kind` VisualSpec** | `dead-end` |
| **Signature graphique** | Rectangle · fond atténué · contour tertiaire · trait pointillé fin · **saturation réduite** · opacité de groupe légèrement diminuée |
| **Objectif pédagogique** | Indiquer une fermeture de voie sans rivaliser avec une conclusion — le regard s'y attarde peu |

---

### Synthèse du lexique

| `kind` | Forme clé | Trait clé | Famille chromatique |
|---|---|---|---|
| entry | Rectangle | Plein | Primaire (structure) |
| action | Rectangle | Plein | Opérationnelle (accent chaud) |
| test | Rectangle | Pointillé | Neutre atténuée |
| decision | Losange | Plein renforcé | Primaire (structure) |
| conclusion | Rectangle | Plein renforcé | Primaire renforcée |
| dead-end | Rectangle | Pointillé atténué | Neutre reculée |

Aucun rôle supplémentaire n'est introduit par ce document.

---

# 5. Hiérarchie interne des blocs

Conventions pour les nœuds portant un **titre de phase** et des **subitems** (listes). Les rapports d'espacement sont normatifs ; les mesures relèvent du Theme.

### Structure cible

```
[Titre de phase — graisse renforcée]
────────────────────────────────────
• première idée
• deuxième idée
  continuation alignée si retour ligne
```

### Principes

| Élément | Convention | Raisonnement |
|---|---|---|
| **Titre de phase** | Libellé principal du nœud, graisse renforcée | Distingué des items de liste ; lu en premier dans le bloc |
| **Séparateur horizontal** | Trait fin discret, rattaché visuellement au titre | Marque la frontière titre / contenu ; espace titre→séparateur **inférieur** à séparateur→liste |
| **Liste** | Puces avec retrait suspendu pour les continuations | Chaque puce = une unité cognitive déclarée dans la visualSpec |
| **Padding interne** | Symétrique, légèrement généreux pour les blocs à subitems | Évite l'effet « texte tassé » sans diluer la figure |
| **Interligne** | Rythme vertical distinct entre titre et items | Les items respirent plus que le titre |

### Règles architecturales

1. Espace(titre → séparateur) **<** espace(séparateur → première puce).
2. Le séparateur **ne flotte pas** entre le titre et la liste.
3. La hauteur du bloc est **conséquence du contenu**, pas d'un padding arbitraire.

---

# 6. Typographie

Conventions de lisibilité pour listes et libellés. Les graisses et tailles concrètes relèvent du Theme ; les **rapports** ci-dessous sont normatifs.

### Principes

| Principe | Énoncé |
|---|---|
| **Une puce = une idée** | Chaque item de liste correspond à une unité cognitive autonome, déclarée dans la visualSpec — jamais découpée par le renderer |
| **Continuation alignée** | Les lignes de retour à la ligne d'un même item s'alignent sous le texte, pas sous la puce (retrait suspendu) |
| **Pas d'orphelins** | Le wrapping évite les lignes finales d'un seul mot court ou d'un fragment isolé |
| **Unités insécables** | Comparateur + valeur + unité restent groupés lors du retour à la ligne |
| **Gradation de graisse** | Titre de phase en graisse dominante ; items de liste et libellés de branche en graisse régulière |

### Listes dans les cellules de comparaison

Lorsqu'une cellule porte **plusieurs items** ordonnés, chaque item devient une puce distincte avec les mêmes règles de retrait. Un item unique reste centré sans puce.

### Wrapping

Le wrapping est **générique** : il ne connaît aucun terme médical. Il applique des règles structurelles (cohésion numérique, anti-orphelin, ponctuation forte) pour produire des lignes naturelles à la lecture.

---

# 7. Connecteurs

Les **connecteurs** sont la matérialisation visuelle de la primitive **Connector** (§4.1). Les familles ci-dessous décrivent leurs intentions — pas leurs paramètres mesurables.

### Familles en usage

| Famille | Rôle cognitif | Signature graphique | Contexte |
|---|---|---|---|
| **Flux principal** | Enchaînement causal ou temporel | Flèche pleine, trait standard, couleur connecteur neutre | Séquences, algorithmes |
| **Branche secondaire** | Condition de transition | Connecteur identique ; libellé sur fond discret semi-opaque | Algorithmes décisionnels |
| **Convergence** | Reprise d'un flux après bifurcation | Même connecteur ; géométrie de layout, pas de style distinct | Algorithmes multi-voies |
| **Comparaison transversale** | Lien entre deux pôles d'une dimension | Trait horizontal discret, pointillé léger | Matrices two-pole |

### Principes

- Les connecteurs ne portent **jamais** seuls une information médicale absente de la visualSpec.
- Le trait des connecteurs reste **subordonné** aux nœuds : il guide sans rivaliser.
- Aucun connecteur ne change de style en fonction du contenu du libellé de branche.

### Extensions futures (non définies)

- boucle de retour / feedback
- branchement skip-level
- lien de contribution ou de déclenchement enrichi
- connecteur de reprise de surveillance

---

# 8. Composition Rules

Règles **qualitatives et transversales** de composition du langage graphique. Elles complètent les primitives (§4.1), le lexique des `kind` (§4.2) et les connecteurs (§7) : elles disent **comment combiner** formes, flux et éléments périphériques pour produire une figure lisible.

### Répartition des responsabilités

| Couche | Responsabilité vis-à-vis des Composition Rules |
|---|---|
| **Visual Grammar** (ce document) | Source de vérité prescriptive — définit les règles conceptuelles |
| **Visual Grammar Runtime** | Projection exécutable — expose les règles que le code peut interroger |
| **Theme** | Paramètres mesurables uniquement — couleurs, épaisseurs, espacements, dash patterns |
| **Renderer** | Calcul géométrique et sérialisation SVG — **ne réinvente pas** les règles du langage |

**Frontière :** ces règles décrivent des **intentions de composition** — jamais des pixels, des algorithmes de placement, ni des constantes Theme.

---

### 8.1 Géométrie des losanges (`decision`)

| Règle | Énoncé |
|---|---|
| **Contenu intérieur strict** | Tout libellé du nœud reste **entièrement contenu** dans le losange — aucune ligne ne déborde sur les arêtes ou les sommets |
| **Dimensionnement adaptatif** | La boîte englobante s'**agrandit automatiquement** avec le texte — jamais l'inverse |
| **Padding minimal interne** | Marge intérieure **généreuse** entre le libellé et les arêtes — le texte ne touche jamais le contour |
| **Équilibre visuel** | Proportions **légèrement plus larges que hautes** — le losange reste lisible, jamais aplati ni effilé |
| **Forme seule** | Le losange ne se transforme jamais en rectangle pour accommoder le texte — c'est la taille qui s'adapte |

---

### 8.2 Branchement d'un `test` à sorties multiples

Un nœud `test` **reste un rectangle pointillé** — il ne devient jamais un losange, même s'il conditionne plusieurs issues.

| Règle | Énoncé |
|---|---|
| **Sorties naturelles** | Un `test` peut produire **plusieurs sorties** sans bifurcation supplémentaire |
| **Descente verticale d'abord** | Le flux quitte le `test` par le **bas**, verticalement |
| **Éventail symétrique** | Les sorties se **séparent horizontalement** après la descente — chaque branche reste distincte |
| **Raccordement lisible** | Chaque sortie rejoint son nœud cible par une descente verticale dédiée |
| **Harmonie des issues sœurs** | Les nœuds cibles d'un même `test` partagent le **même niveau de couche** et un **traitement layout symétrique** — la différence visuelle entre eux provient uniquement du **contenu** et du **`kind`** déclaré, jamais d'un style arbitraire |

---

### 8.3 Callouts et fragments de seuil (`threshold_fragment`)

Les fragments de seuil sont un **cas de Callout** rattaché à une branche.

| Règle | Énoncé |
|---|---|
| **Subordination** | Le callout est **périphérique** — il complète une branche, il ne la remplace pas |
| **Condition qualitative** | Quand `threshold_fragment` est présent, `branch.condition` est **qualitative** ; les seuils numériques vivent dans `scales` et sont matérialisés via le callout (`threshold-fragment-scale-line`) |
| **Non-occlusion** | Le callout **ne masque jamais** un connecteur, un Branch Label ou un nœud |
| **Priorité de placement** | 1) sous le Branch Label · 2) latéralement dégagé · 3) sous le corridor de flux — toujours hors chemin principal |

---

### 8.4 Convergence et flux

| Règle | Énoncé |
|---|---|
| **Convergence** | La reprise d'un flux après bifurcation utilise le **même connecteur** — seule la géométrie diffère |
| **Descente par couche** | Le regard suit une **progression verticale** de couche en couche, sauf branche latérale explicite depuis un `decision` |
| **Lisibilité des libellés** | Les Branch Labels restent **lisibles** et **rapportés** à leur segment de connecteur |
| **Pas de boîte dominante** | Aucun élément périphérique (callout, annotation) ne doit donner l'impression de **masquer** une branche active |

---

### 8.5 Bifurcation depuis un `decision`

| Règle | Énoncé |
|---|---|
| **Losange intact** | Le point de décision reste un **losange** — les branches partent de ses sommets ou de sa base selon la géométrie |
| **Branches latérales** | Lorsque les cibles sont sur la **même couche**, le routage emprunte un **corridor latéral** — le flux ne traverse pas le losange |

---

### 8.6 Branches

| Règle | Énoncé |
|---|---|
| **Branche principale identifiable** | Le flux vertical dominant reste lisible — les branches secondaires ne le masquent pas |
| **Séparation naturelle** | Les branches sortantes d'un même nœud se **séparent** visuellement — jamais superposées de façon ambiguë |
| **Angles simples** | Privilégier descente verticale, segment horizontal, descente verticale — éviter les trajets tortueux |
| **Pas de croisement inutile** | Les connecteurs ne se croisent que lorsque la topologie l'exige — jamais par défaut esthétique |
| **Une branche = une transition** | Chaque entrée `branches[]` produit exactement un chemin orienté from → to |

---

### 8.7 Branch Labels

| Règle | Énoncé |
|---|---|
| **Appartenance** | Un Branch Label appartient à **une seule** branche — il qualifie sa condition, pas une étape |
| **Pas un nœud** | Jamais la signature graphique d'un nœud (`kind`) — pas de losange, pas de rectangle de rôle |
| **Pas d'étape implicite** | Le lecteur ne doit jamais interpréter un label comme une étape intermédiaire du parcours |
| **Rattachement au connecteur** | Le label reste **rapporté** au segment de branche qu'il qualifie — pas flottant sans ancrage |
| **Lisibilité sans dominance** | Lisible, mais visuellement **subordonné** aux nœuds adjacents |

---

### 8.8 Annotations

| Règle | Énoncé |
|---|---|
| **Hors flux principal** | Une annotation **n'appartient jamais** au flux — pas de connecteur entrant/sortant du cœur algorithmique |
| **Retrait visuel** | Traitement atténué (niveau 6 perceptive, §3) — ne rivalise pas avec entry, decision ou conclusion |
| **Pas de duplication** | Une annotation ne **répète jamais** une condition déjà portée par un Branch Label ou un nœud |
| **Documentation, pas progression** | Elle contextualise la figure — sa suppression ne change pas la topologie du graphe |

---

### 8.9 Callouts

| Règle | Énoncé |
|---|---|
| **Rôle secondaire** | Contexte local, exception, rappel de condition — toujours **cognitivement subordonné** |
| **Rattachement local** | Visuellement lié à une branche ou un nœud — jamais autonome dans le flux |
| **Non-occlusion** | Ne masque jamais connecteur, Branch Label ou nœud (cf. §8.3 pour les fragments de seuil) |
| **Pas de doublon** | Ne reproduit pas le Branch Label ni le libellé du nœud cible |
| **Pas d'étape** | Un callout n'ajoute pas une étape implicite au parcours |

---

### 8.10 Arbre décisionnel — règles de composition

Synthèse pour le pattern **decision-algorithm** (§10.2) :

1. **Flow** vertical dominant — entry en tête, progression par couches.
2. **Split** aux points `decision` (losange) et aux `test` multi-sorties (éventail, §8.2).
3. Chaque **Branch** porte un **Branch Label** distinct — jamais confondu avec un nœud.
4. **Merge** implicite lorsque plusieurs branches convergent vers un même nœud cible — connecteur uniforme.
5. **Annotations** en marge ou pied de figure — jamais entre deux nœuds du flux.
6. **Callouts** (fragments de seuil) adjacents à leur branche — hors corridor de flux.
7. Issues sœurs d'un même split : **même couche**, différenciation par `kind` et contenu uniquement.

---

# 9. Palette

La palette est **sémantique mais subordonnée à la forme**. Trois familles chromatiques suffisent au Visual Grammar v0.1. Les teintes exactes relèvent du Theme.

| Famille | Rôle cognitif | Rôles / éléments concernés |
|---|---|---|
| **Primaire (structure)** | Confiance, phases structurantes, comparaison CRT | Entry, decision, conclusion, en-tête de pôle primaire |
| **Opérationnelle (accent chaud)** | Action, conduite à tenir | Nœuds `action` |
| **Neutre atténuée** | Examen, voie fermée, connecteurs, séparateurs | Test, dead-end, connecteurs, traits internes |

### Règles

1. La teinte primaire **ne suffit pas** à distinguer entry de conclusion — la densité de fond et le poids du contour participent à la différenciation.
2. L'accent opérationnel est **réservé** à l'action ; il n'alerte pas (pas de rouge d'alarme), il oriente.
3. Le neutre atténué **recule** visuellement sans disparaître.
4. Aucune couleur n'est assignée à une spécialité médicale ou à un chapitre.

### Priorité forme > couleur

Un nœud `decision` reste identifiable **sans couleur** grâce au losange. Un nœud `test` reste identifiable grâce au pointillé. La couleur accélère la reconnaissance ; elle ne la remplace pas.

---

# 10. Patterns de composition

Patterns actuellement présents dans le corpus enrichi. Chaque pattern combine des entrées du lexique selon une **grammaire de composition** propre.

### 10.1 Dependent-sequence

| | |
|---|---|
| **Objectif** | Séquence de phases ordonnées avec contenu détaillé par phase |
| **Quand l'utiliser** | Parcours linéaire, protocole chronologique, enchaînement domicile → transfert → aboutissement |
| **Rôles autorisés** | `entry`, `action`, `conclusion` |
| **Structure** | Nœuds empilés verticalement, connecteurs de flux principal, subitems par phase |

```
        [ Titre figure ]

            Entry
              │
              ▼
            Action
              │
              ▼
            Action
              │
              ▼
          Conclusion
```

---

### 10.2 Decision-algorithm

| | |
|---|---|
| **Objectif** | Algorithme de décision avec bifurcations, examens et voies terminales |
| **Quand l'utiliser** | Confirmation diagnostique, arbres de probabilité, parcours avec seuils |
| **Rôles autorisés** | `entry`, `decision`, `test`, `dead-end`, `conclusion` |
| **Structure** | Graphe orienté — primitives §4.1 · règles §8.10 · `kind` §4.2 |

```
        [ Titre figure ]

            Entry
              │
              ▼
          ◇ Decision ◇
           ╱         ╲
          ▼           ▼
        Test        Test
          │           │
    ┌─────┴─────┐     │
    ▼           ▼     ▼
 Dead-end   Conclusion  ...
```

---

### 10.3 Two-pole comparison

| | |
|---|---|
| **Objectif** | Comparer deux entités selon des dimensions communes |
| **Quand l'utiliser** | Choix thérapeutique, comparaison d'indications, tableaux décisionnels binaires |
| **Rôles autorisés** | Structure par **pôles** et **cellules** — pas de `kind` nœud classique |
| **Structure** | Deux colonnes, bandes de dimension, cellules comparables, séparateur central discret |

```
        [ Titre figure ]

      [ Pôle A ]  ←→  [ Pôle B ]
      ───────────────────────────
      Dimension 1
      [ cellule ]  |  [ cellule ]
      ───────────────────────────
      Dimension 2
      [ cellule ]  |  [ cellule ]
      ───────────────────────────
      ...
```

#### Rôles structurels two-pole

| Élément | Signification |
|---|---|
| En-tête de pôle | Entité comparée (colonne) — pôle primaire vs secondaire |
| Bande de dimension | Critère de comparaison commun |
| Cellule | Valeur ou liste d'items pour un pôle × dimension |

---

# 11. Éléments périphériques — renvoi

Les **annotations** et **callouts** sont désormais définis comme primitives de composition (§4.1) avec leurs règles (§8.8, §8.9, §8.3).

| Type VisualSpec | Primitive VG | Section |
|---|---|---|
| `annotations[]` | Annotation | §4.1 · §8.8 |
| `threshold_fragment` | Callout | §4.1 · §8.3 · §8.9 |
| Exception / précision (futur) | Callout | §4.1 · §8.9 |

Les extensions `exception` et `précision` restent **reconnues conceptuellement** ; leur signature détaillée relèvera d'une évolution ultérieure du Visual Grammar.

---

# 12. Anti-patterns

Erreurs de langage graphique à **proscrire**. Chaque anti-pattern viole au moins une primitive (§4.1) ou une Composition Rule (§8).

| Anti-pattern | Violation | Conséquence perceptive |
|---|---|---|
| **Branch Label rendu comme un nœud** | §4.1 Branch Label · §8.7 | Le lecteur croit à une étape supplémentaire |
| **Annotation dupliquant un Branch Label** | §8.8 · §8.9 | Redondance — charge cognitive accrue |
| **Annotation intégrée au flux** | §4.1 Annotation · §8.8 | Faux parcours — topologie trompeuse |
| **Callout masquant une branche** | §8.3 · §8.9 | Branche active illisible ou ambiguë |
| **Texte dépassant d'un losange** | §8.1 | Signature `decision` illisible — forme ≠ bifurcation |
| **Losange trop plat** | §8.1 | Perte de lisibilité — géométrie non équilibrée |
| **Branche ambiguë** | §8.6 | Le lecteur ne sait pas quel chemin suivre |
| **Objet cumulant plusieurs rôles** | P8 | Impossible de décoder la primitive — langage cassé |
| **`test` transformé en losange** | §8.2 · §4.2 | Confusion decision / examen |
| **Callout doublonnant un nœud cible** | §8.9 | Impression d'une étape fantôme |

---

# 13. Hors périmètre

| Élément | Raison d'exclusion |
|---|---|
| **Product Language** | Couche éditoriale amont — vocabulaire, pas graphisme |
| **Theme et paramètres mesurables** | Couleurs hex, px, rayons, espacements — document Theme dédié |
| **Animations** | Hors matérialisation statique SVG build |
| **Interactions Reader** | Couche présentation lecteur ([contrat 06](../contracts/06-RENDERER-AND-LEARNER-LAYER.md)) |
| **Icônes et pictogrammes** | Principe P6 — simplicité avant décoration |
| **Accessibilité avancée** | Contrat composant dédié (Reader) |
| **Thèmes et modes d'affichage** | Display preferences — hors build |
| **Algorithmes de layout** | Calcul géométrique — renderer, guidé par le Runtime |
| **Règles de composition** | **Incluses** dans ce document (§8) — projection Runtime |
| **Heuristiques de contenu** | Interdites — le renderer ne devient pas « intelligent » |
| **Couleurs par domaine médical** | Palette transverse uniquement |
| **Nouveaux rôles (`kind`)** | Nécessitent évolution du schéma et du contrat 05 |

---

## Prochaines étapes suggérées

1. **Validation produit** du Visual Grammar v0.1 enrichi (primitives + Composition Rules).
2. **Évolution du Visual Grammar Runtime** — projection des primitives §4.1 et des règles §8.6–§8.10.
3. **Alignement renderer** — consommation exclusive du Runtime pour les règles de composition.
4. **Spécification v0.2** — extensions `exception`, `précision`, hors cœur visuel.
5. **Alignement VMG** lorsque la dette Visual Modeling Guide sera levée.

---

## Références internes (non normatives)

| Document | Lien |
|---|---|
| Contrat 05 — sémantique visualSpec | [`docs/contracts/05-VISUAL-GRAMMAR.md`](../contracts/05-VISUAL-GRAMMAR.md) |
| Vision VLLR | [`docs/contracts/components/VISION.md`](../contracts/components/VISION.md) |
| Theme SVG (paramètres) | [`docs/contracts/components/SVG-GRAPHIC-LANGUAGE-V1.md`](../contracts/components/SVG-GRAPHIC-LANGUAGE-V1.md) |
| Visual Grammar Runtime | [`docs/architecture/VISUAL-GRAMMAR-RUNTIME.md`](./VISUAL-GRAMMAR-RUNTIME.md) |
| ADR-008 — pipeline VCCK | [`docs/adr/ADR-008-vcck-industrial-composition-pipeline.md`](../adr/ADR-008-vcck-industrial-composition-pipeline.md) |

---

*Visual Grammar v0.1 — document d'architecture produit. Langage graphique uniquement. Paramètres concrets → Theme. Règles exécutables → Runtime. Matérialisation → Renderer.*
