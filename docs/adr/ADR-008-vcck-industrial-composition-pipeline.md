# ADR-008 — Pipeline industriel de composition visuelle (VCCK)

## Statut

**Accepted**

## Date

2026-08-06

---

## Contexte

Lou Médecine doit produire, pour chaque Modèle mental et chaque Notion autonome, une **représentation visuelle centrale** congruente avec le walkthrough canonique ([ADR-007](ADR-007-visual-centrality-for-mental-models-and-notions.md)). Cette obligation est **éditoriale** : elle fixe ce que le produit doit offrir à l'apprenant.

Parallèlement, le projet a gelé un **catalogue de primitives sémantiques** ([ADR-001](ADR-001-freeze-svg-grammar-catalogue.md)) : un vocabulaire fermé de types de structures cognitives (graphe causal, algorithme décisionnel, matrice de comparaison, etc.). Une visualSpec exprime le sens médical dans le cadre d'une primitive ; elle ne porte ni géométrie ni layout.

Entre ces deux pôles — **besoin éditorial** et **primitive sémantique** — un vide architectural subsistait :

| Lacune | Conséquence sans VCCK |
|---|---|
| Aucune couche intermédiaire entre primitive et matérialisation | Chaque visuel risque d'être traité comme un cas particulier |
| Aucune règle d'admission structurelle | Un moteur de layout général promet ce qu'il ne peut pas garantir |
| Aucun cycle de qualification générique | La preuve de composition reste ad hoc, bloc par bloc |
| Aucune frontière production / évolution | La production éditoriale et l'évolution des surfaces de rendu se confondent |

**VCCK** (*Visual Composition Conformance Kit*) comble ce vide. Son **objet gouverné** est la **capacité** : une unité de composition générique qualifiée, réutilisable et prouvée. VCCK ne décide pas du contenu médical, ne choisit pas la primitive éditoriale, ne remplace pas le walkthrough et ne confère aucune autorité au renderer.

---

## Décision

### 1. Rupture architecturale

VCCK introduit une **évolution fondamentale** de l'architecture visuelle du projet. Elle ne remplace ni ADR-001 ni le contrat sémantique du visuel ; elle **insère** une couche normative entre la primitive et la figure.

### 1.1 Ancien modèle implicite

Avant VCCK, la chaîne dominante était :

```text
primitive sémantique
→ renderer
→ figure
```

Ce modèle supposait implicitement que :

- choisir une primitive suffisait à garantir une représentation acceptable ;
- le renderer portait à la fois la **décision de forme** et la **matérialisation** ;
- la preuve de qualité était localisée sur la figure produite, non sur une capacité réutilisable.

Cette implicite a produit une industrialisation non transposable : chaque visuel dépendait du comportement du renderer du moment, sans admission structurelle ni registre de capacités.

### 1.2 Nouveau modèle acté par VCCK

La chaîne architecturale devient :

```text
contrat éditorial
→ visualSpec
→ signature calculée
→ reconnaissance
→ capacité qualifiée
→ composition abstraite
→ surface de matérialisation (renderer)
→ artefact publié
```

| Étape | Domaine | Nature |
|---|---|---|
| Contrat éditorial → visualSpec | Éditorial | Intention et sémantique médicale |
| Signature → reconnaissance → capacité | Composition | **Admission structurelle** — cœur de VCCK |
| Composition abstraite | Composition | Plan de layout **indépendant** du format de sortie |
| Surface de matérialisation → artefact | Exécution | Projection technique **non décisionnelle** |

La **reconnaissance** n'est pas une étape technique accessoire : c'est le **seuil architectural** qui lie une structure sémantique à une capacité qualifiée. Sans reconnaissance explicite, aucune composition n'est produite.

Le **renderer** n'est plus une étape décisionnelle. Il matérialise une composition abstraite déjà admise — en SVG, HTML, Word ou tout format futur — sans choisir de capacité, sans réparer une inadmissibilité, sans créer de sens.

---

## 3. Pipeline canonique

Le pipeline VCCK est la colonne vertébrale de l'architecture. Il est **identique** pour tout bloc pédagogique, toute primitive, toute surface de matérialisation :

```text
VisualSpec
→ Signature calculée
→ Reconnaissance
→ Capacité qualifiée
→ Composition abstraite
→ Renderer (surface de matérialisation)
→ Artefact publié
```

**Propriétés du pipeline :**

- **Unidirectionnel** — aucun lien ascendant (le renderer ne remonte jamais une décision éditoriale ou compositionnelle).
- **Déterministe en admission** — à visualSpec et registre de capacités stables, la reconnaissance produit le même verdict.
- **Interruptible** — l'absence de capacité reconnue **arrête** le pipeline avant toute composition ou matérialisation.
- **Indépendant du format** — la composition abstraite précède le choix de surface (SVG, HTML, Word, etc.).

La visualSpec est l'entrée ; l'artefact publié est la sortie. Tout ce qui se passe entre les deux relève du domaine composition (signature, reconnaissance, capacité, composition) ou de l'exécution pure (matérialisation).

---

## 4. Limites du modèle fondé uniquement sur les primitives

ADR-001 a correctement gelé la **couche sémantique** : quels types de structures cognitives existent, quelles relations sont expressibles, quelles distorsions sont interdites. Ce gel est nécessaire et reste en vigueur.

Il ne suffit pas pour l'industrialisation pour trois raisons structurelles :

### 4.1 Une primitive accepte plusieurs topologies distinctes

Une même primitive sémantique peut se manifester par des signatures structurelles différentes. Confondre « primitive » et « forme composée » force soit à élargir la primitive (violation du gel catalogue), soit à déléguer la décision de forme au renderer (violation du §1).

### 4.2 Le layout arbitraire n'est pas une garantie

Les contraintes perceptuelles (hiérarchie, reflow, lisibilité multi-surface, absence de collision) ne se déduisent pas du seul schéma sémantique. Sans **capacités** bornées et qualifiées, chaque visuel devient un cas de test unique.

### 4.3 La qualification ne peut pas être implicite

ADR-001 fixe *ce que* l'on peut dire ; il ne fixe pas *comment* l'on prouve qu'une capacité rend correctement toutes les structures qu'elle accepte. Sans cycle de qualification explicite, la confiance repose sur l'inspection répétée — non transposable à l'échelle visée.

**Conséquence :** les primitives restent l'autorité sémantique ; VCCK gouverne les **capacités** en aval — sans rouvrir le catalogue ADR-001.

### 4.4 Gouvernance — escalade catalogue (ADR-001)

*Règle de gouvernance — non un invariant.*

Si une visualSpec est **légitime éditorialement**, mais qu'**aucune primitive** du catalogue ADR-001 ne permet de produire une capacité admissible :

1. **VCCK ne crée jamais** une primitive — la décision relève exclusivement d'ADR-001 et de son processus de validation documentée.
2. Une **étude de validation du catalogue** est ouverte selon les critères ADR-001.
3. La **production VCCK reste suspendue** pour cette visualSpec jusqu'à décision actée sur le catalogue.
4. Aucune improvisation au renderer, aucune capacité ad hoc, aucun contournement du registre.

---

## 5. Trois domaines séparés

L'architecture repose sur une séparation stricte de trois domaines. Aucun domaine ne possède l'autorité d'un autre.

```text
┌─────────────────────────────────────────────────────────────────┐
│  DOMAINE ÉDITORIAL                                              │
│  Source · Inventory · contrat éditorial · visualSpec ·          │
│  walkthrough · gates de congruence                              │
│  Autorité : contenu médical, intention pédagogique, couverture  │
└────────────────────────────┬────────────────────────────────────┘
                             │ visualSpec validée (sémantique seule)
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│  DOMAINE COMPOSITION (VCCK)                                     │
│  Signature · RECONNAISSANCE · capacité · contrat perceptuel ·   │
│  composition abstraite · preuves · registre des capacités       │
│  Autorité : admission structurelle, conformité perceptuelle     │
│  Objet gouverné : la CAPACITÉ                                   │
└────────────────────────────┬────────────────────────────────────┘
                             │ composition abstraite admise
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│  DOMAINE EXÉCUTION                                              │
│  Surfaces de matérialisation · sérialisation · déterminisme ·   │
│  artefact publié · consommation Reader                          │
│  Autorité : projection fidèle sans création de sens             │
└─────────────────────────────────────────────────────────────────┘
```

| Domaine | Question centrale | Ce qu'il ne fait pas |
|---|---|---|
| **Éditorial** | *Que doit comprendre l'apprenant, et avec quelles garanties médicales ?* | Calculer une signature ; reconnaître une capacité ; choisir un layout |
| **Composition** | *Quelle capacité qualifiée admet cette structure, et quelle composition abstraite en résulte ?* | Créer du contenu médical ; imposer une capacité à l'auteur ; matérialiser |
| **Exécution** | *Comment projeter la composition abstraite en artefact sans altérer le sens ?* | Décider de l'admissibilité ; réécrire la visualSpec ; valider la congruence éditoriale |

---

## 6. La capacité — objet gouverné par VCCK

VCCK ne gouverne pas directement les primitives (ADR-001), ni les renderers (domaine exécution), ni les blocs éditoriaux. Il gouverne les **capacités**.

### 6.1 Quatre notions distinctes

| Notion | Définition | Rôle dans VCCK |
|---|---|---|
| **Primitive sémantique** | Slot du catalogue gelé ([ADR-001](ADR-001-freeze-svg-grammar-catalogue.md)) — type de structure cognitive | Contexte sémantique de la visualSpec ; **non gouverné** par VCCK |
| **Famille** | Description structurelle fermée rattachée à une primitive — enveloppe de signatures admissibles | **Candidate** à la qualification ; objet de conception, pas d'usage industriel |
| **Capacité** | Famille **qualifiée** — contrat perceptuel, preuves, verdict, statut QUALIFIED | **Unité gouvernée** : admission, registre, réutilisation, immutabilité en production |
| **Composition instanciée** | Plan abstrait produit pour **une** visualSpec via **une** capacité reconnue | Produit jetable du cycle de production ; entrée des surfaces de matérialisation |

**Relations :**

```text
Primitive (1) ──< (N) Familles [descriptions structurelles]
Famille (1) ──< (0..1) Capacité qualifiée   [après cycle de qualification]
Capacité (1) ──< (N) Compositions instanciées   [en production]
```

Une **famille** décrit *ce qu'une structure peut être*. Une **capacité** atteste *qu'une famille est prouvée pour usage industriel*. Seule une capacité peut être **reconnue** lors de la production.

### 6.2 Registre des capacités

Le registre des capacités qualifiées est le **seul point de convergence** entre le cycle de qualification (§9.1) et le cycle de production (§9.2). La reconnaissance consulte exclusivement ce registre. Aucune production ne contourne le registre.

---

## 7. Reconnaissance — principe architectural

La **reconnaissance** est un **invariant fondateur** de VCCK, au même titre que la séparation des domaines ou l'interdiction de fallback.

### 7.1 Définition et verdicts

La reconnaissance est l'opération **déterministe** qui, à partir d'une **signature calculée** et du **registre des capacités qualifiées**, produit exactement l'un des verdicts suivants :

| Verdict | Signification |
|---|---|
| **ADMITTED** | Une capacité qualifiée reconnaît la signature et satisfait toutes les contraintes ; la composition peut être instanciée |
| **REJECTED** | Au moins une capacité reconnaît la signature mais viole une contrainte explicite (enveloppe, budget, contrat perceptuel, mutant) — ou ambiguïté non résolue |
| **UNRECOGNIZED** | Aucune capacité qualifiée ne reconnaît la signature ; génération interdite |

**REJECTED** et **UNRECOGNIZED** sont **mutuellement exclusifs**.

### 7.2 Domaine d'entrée

La reconnaissance s'effectue **exclusivement** à partir de la **signature calculée** et du **registre des capacités qualifiées**.

- Elle **n'est jamais limitée**, filtrée ni pré-ordonnée par une **primitive déclarée** par l'éditeur dans la visualSpec.
- La **primitive** est une **propriété de la capacité reconnue**, pas un paramètre d'entrée de la reconnaissance.
- Une primitive déclarée dans une visualSpec **ne peut jamais imposer ni biaiser** la reconnaissance — ni restreindre le registre consulté, ni favoriser une capacité, ni court-circuiter le calcul de signature.

Cette règle rend impossible deux implémentations divergentes selon la primitive déclarée.

### 7.3 Ordre déterministe des verdicts

**Étape 1 — Reconnaissance structurelle**

Parcourir le registre des capacités qualifiées à partir de la signature calculée seule.

- Si **aucune** capacité ne reconnaît la signature → verdict **UNRECOGNIZED** — fin du pipeline.
- Si **au moins une** capacité reconnaît la signature → étape 2.

**Étape 2 — Vérification des contraintes**

Pour chaque capacité candidate reconnue à l'étape 1, vérifier les enveloppes structurelles, les budgets et les contrats perceptuels applicables.

- Si **toute** capacité candidate viole au moins une contrainte → verdict **REJECTED** — fin du pipeline.
- Si **exactement une** capacité satisfait toutes les contraintes → verdict **ADMITTED** — composition autorisée.
- Si **plusieurs** capacités satisfont toutes les contraintes → politique de résolution à acter (Points différés §1) ; en l'absence de politique actée, verdict **REJECTED** (ambiguïté non résolue).

### 7.4 Propriétés non négociables

- La reconnaissance **ne modifie jamais** la visualSpec.
- La reconnaissance **ne consulte jamais** un renderer pour trancher.
- La reconnaissance **n'accepte jamais** une déclaration d'auteur à la place du calcul structurel.
- La reconnaissance **n'applique jamais** de fallback silencieux vers une capacité voisine.
- La reconnaissance est **répétable** : même visualSpec, même registre → même verdict.

### 7.5 Position dans l'architecture

Sans reconnaissance explicite, le pipeline §3 est **rompu**. Produire une figure sans verdict ADMITTED est une violation architecturale, indépendamment de la qualité perceptuelle du résultat.

La reconnaissance est le mécanisme par lequel VCCK **refuse** plutôt que dégrader : une visualSpec légitime sans capacité reconnue retourne à l'autorité éditoriale ou déclenche une nouvelle qualification — jamais une improvisation au renderer.

---

## 8. Composition abstraite et surfaces de matérialisation

VCCK produit une **composition abstraite** : un plan de layout, de routage et de contraintes perceptuelles **indépendant** du format de sortie.

### 8.1 Ce qu'est la composition abstraite

- Entrées : visualSpec admise + capacité reconnue.
- Sortie : plan instancié — géométrie logique, hiérarchie, reflow, budgets — **sans** engagement sur SVG, HTML ou autre.
- Autorité : domaine composition uniquement.
- Interdiction : inventer nœuds, relations ou claims absents de la visualSpec.

### 8.2 Ce que sont les surfaces de matérialisation

Les **renderers** (SVG, HTML, Word, formats futurs) sont des **surfaces de matérialisation** :

| Propriété | Règle |
|---|---|
| Rôle | Projenner la composition abstraite en artefact sérialisé |
| Autorité | Aucune — exécution pure |
| Décision | **Interdite** — pas de choix de capacité, pas de réparation, pas de fallback |
| Remplaçabilité | Une capacité qualifiée peut être matérialisée par plusieurs surfaces, sous preuve |

Une même capacité peut exiger des preuves sur plusieurs surfaces (viewport mobile, document paginé, etc.). Les surfaces sont interchangeables **sous** la composition abstraite ; elles ne la remplacent pas.

### 8.3 Conséquence pour ADR-002

ADR-002 distingue déjà le renderer lecteur (consommation) du pipeline de build. Cette décision **renforce** cette séparation : même dans le build, le renderer n'est plus un composant décisionnel — c'est une surface soumise à une composition déjà admise.

---

## 9. Deux cycles indépendants

VCCK distingue deux cycles de vie qui ne partagent ni autorité, ni calendrier, ni critères de sortie.

### 9.1 Cycle de qualification d'une capacité

**Objet :** transformer une **famille** (description structurelle) en **capacité qualifiée**.

**Entrées :** contrat perceptuel ; enveloppe structurelle ; fixtures génériques ; budgets ; mutants.

**Sortie :** capacité **QUALIFIED** inscrite au registre.

**Propriétés :**

- Conduit **par capacité**, jamais par chapitre ni par bloc.
- Antérieur ou parallèle à toute production qui en dépend.
- Immuable pendant un run de production (invariant I11).
- Évolue par **nouvelle campagne de qualification**, jamais par retouche en production.

```text
famille (description structurelle)
→ contrat perceptuel
→ fixtures génériques (positives, négatives, stress)
→ preuves (responsive, déterminisme, mutants, audit perceptuel)
→ verdict de qualification
→ capacité QUALIFIED → registre
```

### 9.2 Cycle de production d'un bloc pédagogique

**Objet :** un bloc pédagogique (Modèle mental ou Notion autonome) obtient son visuel central et atteint la congruence exigée par ADR-007.

**Entrées :** contrat éditorial ; visualSpec ; registre des capacités qualifiées.

**Sortie :** artefact publié, walkthrough congruent, bloc éligible à la complétude.

**Propriétés :**

- Conduit **par bloc**, dans le cadre d'un chapitre.
- Ne modifie jamais le registre en cours de run.
- Échoue proprement si la reconnaissance ne produit pas ADMITTED (§10).
- La signature est vérifiée **au moment de la visualSpec**.

```text
contrat éditorial
→ visualSpec
→ signature calculée
→ reconnaissance → [ADMITTED | REJECTED | UNRECOGNIZED]
→ [si ADMITTED] composition abstraite instanciée
→ matérialisation (surface de rendu)
→ artefact + preuves de run
→ walkthrough congruent
→ bloc complet
```

**Règle d'indépendance :** le cycle de qualification **ne consomme pas** de contenu médical réel ; le cycle de production **ne crée pas** de capacité nouvelle. Le croisement se limite au **registre** et à la **reconnaissance**.

---

## 10. Règles de refus

VCCK est conçu pour **refuser explicitement** plutôt que dégrader silencieusement.

### 10.1 Cas principal — reconnaissance sans capacité admissible

| Étape | Comportement |
|---|---|
| Signature calculée | Depuis la visualSpec seule |
| Reconnaissance | Verdict **UNRECOGNIZED** ou **REJECTED** |
| Composition | **Non produite** |
| Matérialisation | **Interdite** |
| Suite | Retour éditorial **ou** ouverture d'une campagne de qualification de capacité |

### 10.2 Interdictions associées

- Pas de fallback vers une capacité voisine sans reconnaissance ADMITTED explicite.
- Pas de contournement du registre.
- Pas de retouche isolée d'un artefact pour masquer un défaut de capacité.
- Pas de modification d'une surface de matérialisation pendant un run de production pour absorber une exception.

### 10.3 Distinction refus compositionnel / refus éditorial

| Nature | Responsable | Issue |
|---|---|---|
| Signature non reconnue par aucune capacité qualifiée | Composition | Nouvelle capacité ou revision visualSpec |
| Structure admise mais incongrue avec le contrat éditorial | Éditorial | Revision contrat, visualSpec ou walkthrough |
| Structure admise, composition produite, rejet perceptuel humain | Composition + revue | Revision contrat perceptuel ou capacité |

---

## 11. Responsabilités des entités

| Entité | Domaine | Responsabilité | Interdictions |
|---|---|---|---|
| **Source officielle** | Éditorial | Texte Collège immuable, traçabilité vers l'édition | Interpréter une structure visuelle ; choisir une primitive |
| **Inventory** | Éditorial | Points de connaissance, dispositions, couverture | Modéliser une composition ; produire une figure |
| **Contrat éditorial** | Éditorial | Question canonique, périmètre KP, exclusions, rôle cognitif | Déclarer une capacité ; fixer une géométrie |
| **VisualSpec** | Éditorial | Structure sémantique, relations médicales, traçabilité ; **zéro géométrie** | Imposer une capacité ; contenir du layout |
| **Signature** | Composition | Empreinte structurelle **calculée** depuis la visualSpec | Être déclarée par l'auteur ; remplacer la validation sémantique |
| **Reconnaissance** | Composition | Verdict ADMITTED / REJECTED / UNRECOGNIZED depuis signature + registre | Forcer une admission ; modifier la visualSpec ; consulter un renderer |
| **Famille** | Composition | Description structurelle candidate — enveloppe, budgets théoriques | Être confondue avec une capacité ; porter une autorité médicale |
| **Capacité** | Composition | Famille qualifiée — contrat perceptuel, preuves, statut QUALIFIED | Être choisie par l'auteur ; être qualifiée par chapitre |
| **Contrat perceptuel** | Composition | Hiérarchie visuelle, références, interdits multi-surface | Décider du fond médical ; remplacer la visualSpec |
| **Composition abstraite** | Composition | Plan instancié pour une visualSpec admise via une capacité reconnue | Inventer des nœuds, relations ou claims |
| **Surface de matérialisation** | Exécution | Projeter la composition abstraite en artefact (SVG, HTML, Word, …) | Décider de l'admission ; altérer le sens ; choisir une capacité |
| **Artefact publié** | Exécution | Figure officielle liée par identifiant au bloc ; consommable par le Reader | Devenir une autorité éditoriale ; porter des annotations apprenant |

**Chaîne d'autorité descendante (sens médical) :**

```text
Source → Inventory → Contrat éditorial → VisualSpec → Walkthrough
```

**Chaîne de transformation descendante (représentation) — pipeline canonique §3 :**

```text
VisualSpec → Signature → Reconnaissance → Capacité → Composition abstraite → Surface → Artefact
```

---

## 12. Principes de séparation

### 12.1 Aucune contrainte technique ne réduit le besoin éditorial

Si une visualSpec exprime légitimement une structure au sens du contrat éditorial et de la primitive, l'absence de capacité reconnue **ne justifie pas** de simplifier, fusionner ou reclasser le bloc pour entrer dans une capacité existante. Le refus est **propre** (§10).

### 12.2 Aucune surface de matérialisation ne décide

Les renderers projettent une composition abstraite admise. Ils ne choisissent pas de capacité, ne réparent pas une incompatibilité, n'appliquent pas de fallback. Toute correction structurelle appartient au domaine composition (nouvelle capacité) ou éditorial (revision de la visualSpec).

### 12.3 Aucune capacité ne devient une autorité médicale

Une capacité encode une **forme prouvée**, pas un sens clinique. Les labels visibles proviennent de la visualSpec ; leur interprétation relève du walkthrough.

### 12.4 Aucune composition ne crée un nouveau savoir

La composition arrange des éléments déjà présents dans la visualSpec validée. Toute entité, relation ou claim absent est une **fuite architecturale**.

### 12.5 Stabilité patrimoniale de la visualSpec

Une visualSpec **validée** conserve son **identité sémantique** indépendamment :

- des capacités qualifiées ultérieurement ;
- des surfaces de matérialisation futures ;
- des évolutions du kit VCCK.

L'évolution de VCCK — nouvelles capacités, nouvelles preuves, nouvelles surfaces — **ne modifie jamais rétroactivement** la sémantique éditoriale d'une visualSpec déjà validée. Une régénération ultérieure peut produire un **nouvel artefact** ([ADR-006](ADR-006-pedagogical-patrimony-and-edition-lineage.md)) ; elle ne requalifie pas silencieusement le sens de la visualSpec source.

---

## 13. Relation opérationnelle avec ADR-007

### 13.1 Ce qu'ADR-007 exige et que VCCK opérationnalise

ADR-007 établit l'obligation de visuel central et de congruence bloc ↔ question ↔ périmètre ↔ visuel ↔ walkthrough. VCCK établit **comment** une visualSpec devient une figure prouvée, via reconnaissance et capacité, sans que :

- une contrainte de layout réduise le périmètre éditorial ;
- un PASS de matérialisation masque une non-reconnaissance ;
- une capacité soit imposée par l'auteur.

### 13.2 Limite de portée désormais explicite

Avant VCCK, la chaîne « visualSpec → figure » était sous-spécifiée. Cette ADR acte que :

- le **contrat 05** ([Visual Grammar](../contracts/05-VISUAL-GRAMMAR.md)) reste valide pour la sémantique du visuel ;
- la **couche composition** — gouvernée par les **capacités** — est une responsabilité transversale distincte, non couverte par ADR-001 seul ;
- la **reconnaissance** est le seuil d'admission architectural, non négociable.

---

## Relation avec les ADR existants

Cette ADR ne remplace aucun ADR antérieur. Elle explicite le pipeline industriel absent lors de leur rédaction.

| ADR | Statut vis-à-vis de VCCK | Complément ou limite explicite |
|---|---|---|
| **001 — Freeze SVG Grammar Catalogue** | **Inchangé** — autorité des primitives | VCCK gouverne les **capacités** en aval ; ne rouvre pas le catalogue |
| **002 — Renderer V2 Architecture** | **Complété** — frontière build / Reader | Surfaces de matérialisation **non décisionnelles** ; composition abstraite précède tout renderer ; Reader consomme l'artefact sans inférer de sens |
| **003 — Single Source of Truth** | **Inchangé** — sources officielles | VCCK opère en aval ; visualSpec ancrée dans l'inventaire |
| **004 — Acquisition Architecture Frozen** | **Inchangé** — Tool 01/02 gelés | VCCK n'introduit aucune seconde autorité sur le Collège |
| **005 — Learner-layer annotation anchoring** | **Inchangé** — CaretAnchor, overlays | Artefacts VCCK = contenu officiel immuable ; annotations = couche apprenant |
| **006 — Patrimoine pédagogique et lignée** | **Complété** — identité packages publiés | Figures VCCK dans le package publié ; visualSpec stable (§12.5) ; traçabilité I16 ; régénération = nouvel objet |
| **007 — Centralité visuelle MM/Notions** | **Complété** — obligation éditoriale | VCCK opérationnalise la représentation centrale ; refus propre si aucune capacité reconnue |

---

## Invariants durables VCCK

Règles qui survivent à toute implémentation, toute surface de matérialisation et toute évolution du kit.

| # | Invariant |
|---|---|
| **I1** | La visualSpec est l'unique porteuse de sens médical du visuel |
| **I2** | La signature est **calculée**, jamais déclarée autoritairement par l'auteur |
| **I3** | La **reconnaissance** est le seuil d'admission obligatoire entre signature et capacité — jamais contournée, jamais déléguée au renderer, jamais biaisée par une primitive déclarée |
| **I4** | La **capacité** est l'unité gouvernée par VCCK — qualification, registre, admission et réutilisation opèrent sur les capacités, pas sur les familles ni les primitives |
| **I5** | Une **famille** est une description structurelle ; une **capacité** est une famille qualifiée — les deux ne sont jamais confondues |
| **I6** | Verdict de reconnaissance ≠ ADMITTED → **pas de composition, pas de matérialisation** |
| **I7** | VCCK produit une **composition abstraite** indépendante du format de sortie |
| **I8** | Les surfaces de matérialisation (SVG, HTML, Word, futurs formats) **ne décident pas** et **ne créent pas** de contenu |
| **I9** | Le contrat perceptuel **précède** la qualification d'une capacité nouvelle |
| **I10** | Les preuves (responsive, déterminisme, mutants, audit perceptuel) sont **requises** pour le statut QUALIFIED |
| **I11** | Pendant un run de production, le **registre des capacités** est immuable |
| **I12** | Un défaut en publication corrige la couche la plus basse partagée — jamais un artefact isolé |
| **I13** | Le walkthrough reste l'autorité médicale ; l'artefact est le cœur pédagogique visuel |
| **I14** | Le Reader consomme l'artefact publié sans relire la visualSpec pour inférer du sens |
| **I15** | **Stabilité patrimoniale sémantique** — une visualSpec validée conserve son identité éditoriale indépendamment des capacités, surfaces ou évolutions VCCK futures |
| **I16** | **Traçabilité de production** — un artefact publié conserve l'identité de la **capacité** ayant produit la composition et la **version du contrat perceptuel** associé, permettant l'audit post-publication |
| **I17** | **Neutralité de domaine** — aucune capacité, composition ou surface ne dépend d'un chapitre, d'une spécialité, d'identifiants KP, d'un inventaire ou d'un contenu médical particulier ; VCCK reste totalement indépendant du domaine médical |

## Conséquences

### Positives

- Pipeline industriel explicite entre obligation éditoriale (ADR-007) et catalogue sémantique (ADR-001).
- Reconnaissance déterministe — ordre des verdicts (§7.3), indépendance vis-à-vis de la primitive déclarée (§7.2).
- Capacité comme unité de réutilisation inter-chapitres et inter-spécialités (I17).
- Traçabilité de production auditable des années après publication (I16, complète ADR-006).
- Séparation nette composition abstraite / surfaces de matérialisation.

### Coûts et contraintes

- Qualification de capacité requise avant production industrielle à l'échelle.
- Refus propre si non-reconnaissance — pas de contournement par le renderer.
- Amendements futurs des contrats 04, 05 et 08 nécessaires pour intégrer formellement la couche composition.
- Points différés ci-dessous à trancher.

---

## Points différés

Points **réellement non arbitrés** — à trancher dans des contrats ou décisions dérivées.

### 1 Cardinalité Signature ↔ Capacité

**Question :** une signature structurelle correspond-elle toujours à **une et une seule** capacité admissible ?

**Enjeu :** unicité de la reconnaissance vs coexistence de capacités voisines aux frontières proches.

**État :** ordre déterministe acté (§7.3) ; défaut = REJECTED en cas d'ambiguïté ; politique explicite **non actée**.

### 2 Compositions de périmètre chapitre

**Question :** les visuels représentant l'organisation cognitive d'un chapitre entier (carte maîtresse, navigation inter-territoires) relèvent-ils d'une primitive existante ou d'une primitive / capacité dédiée ?

**Enjeu :** ADR-007 exige un visuel maître ; la structure « scope chapitre » dépasse le profil des primitives classiques.

**État :** besoin reconnu ; qualification comme **capacité générique distincte** candidate — non spécifiée ici.

### 3 Versionnement des capacités qualifiées

**Question :** comment versionner une capacité QUALIFIED lorsque son contrat perceptuel évolue sans changer l'enveloppe de signature ?

**Enjeu :** compatibilité des régénérations, lignée des packages ([ADR-006](ADR-006-pedagogical-patrimony-and-edition-lineage.md)). *Note : la stabilité de la visualSpec est actée (I15) ; seule l'évolution de la capacité reste ouverte.*

**État :** immutabilité du registre pendant un run actée (I11) ; politique inter-versions **non actée**.

### 4 Statut normatif du registre des capacités

**Question :** le registre est-il un artefact normatif (contrat, schéma) ou une projection des preuves de qualification ?

**Enjeu :** gouvernance de l'admission, auditabilité, séparation production / évolution.

**État :** registre **conceptuellement requis** (§6.2) ; forme normative exacte **différée**.

---


## Documents connexes

| Document | Rôle |
|---|---|
| [`VISUAL_GRAMMAR_LIBRARY.md`](../../VISUAL_GRAMMAR_LIBRARY.md) | Catalogue des primitives (ADR-001) |
| [`VISUAL-COMPOSITION-CONFORMANCE-KIT.md`](../../VISUAL-COMPOSITION-CONFORMANCE-KIT.md) | Spécification opérationnelle VCCK — complète cette ADR, non substitut |
| [`docs/contracts/05-VISUAL-GRAMMAR.md`](../contracts/05-VISUAL-GRAMMAR.md) | Contrat sémantique du visuel officiel |
| [`docs/adr/ADR-007-visual-centrality-for-mental-models-and-notions.md`](ADR-007-visual-centrality-for-mental-models-and-notions.md) | Obligation éditoriale que VCCK opérationnalise |
| [`docs/governance/DOCUMENT_ARCHITECTURE.md`](../governance/DOCUMENT_ARCHITECTURE.md) | Organisation du pilotage documentaire |
| [`docs/architecture/DR-008-vcck-industrial-composition-pipeline.md`](../architecture/DR-008-vcck-industrial-composition-pipeline.md) | Design Record source — remplacé par cette ADR |

---

*ADR-008 — 2026-08-06 — Pipeline industriel VCCK — Accepted.*
