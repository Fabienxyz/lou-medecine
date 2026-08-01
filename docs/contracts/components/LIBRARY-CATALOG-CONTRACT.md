# Library Catalog Contract

| | |
|---|---|
| **Type** | Contrat composant normatif |
| **Statut** | En vigueur |
| **Composant** | Bibliothèque locale installable (Library Catalog) |
| **Décision produit** | [PDR-D1](../../governance/PRODUCT-DECISION-REGISTRY.md) |
| **ADR associé** | [ADR-006](../../adr/ADR-006-pedagogical-patrimony-and-edition-lineage.md) §6 |
| **Index** | [`../00-INDEX.md`](../00-INDEX.md) · [`00-INDEX.md`](00-INDEX.md) |

Ce document définit les **obligations durables** de la **bibliothèque locale installable** de Lou Médecine : catalogue, identité des Releases installées, installation, et frontière Package Access. Il spécialise [ADR-006](../../adr/ADR-006-pedagogical-patrimony-and-edition-lineage.md) et les contrats fondamentaux pour ce composant. Il ne redéfinit pas le contenu médical d'une Release, ne spécifie pas d'implémentation particulière et n'introduit aucune décision médicale nouvelle.

---

## 1. Objectif

La bibliothèque locale **DOIT** permettre à l'apprenant d'étudier des Chapter Packages **publiés** hors de l'arborescence de production (dépôt Git), sans serveur comme prérequis et sans confondre :

- les **sources de production** (Fabrique) ;
- les **packages publiés installés** (patrimoine étudiable) ;
- les **données d'apprentissage** (couche apprenant).

Elle **DOIT** constituer la **seule source opérationnelle** de découverte des Releases installées pour le Reader en mode produit.

---

## 2. Périmètre

### 2.1 Inclus

| Domaine | Couverture |
|---|---|
| **Catalogue** | Format et invariants de `library.json` |
| **Identité installée** | `chapter`, `edition`, `publication_version`, `release_id` |
| **Cycle de vie install** | Installation, activation, archivage |
| **Organisation** | Disposition logique des packages sous la racine bibliothèque |
| **Package Access** | Obligations d'accès aux artefacts d'une Release installée |
| **Frontières** | Séparation Fabrique / Bibliothèque / Reader |

### 2.2 Exclus

| Domaine | Autorité |
|---|---|
| Contenu médical, gates de build, structure interne du package publié | [Contrat 04](../04-CHAPTER-PACKAGE.md), [contrat 08](../08-RELEASE-EDITORIAL-ARCHITECTURE.md) |
| Composition des vues cognitives | [`COMPOSITION-COMPONENT-CONTRACT.md`](COMPOSITION-COMPONENT-CONTRACT.md) |
| Présentation DOM, immutabilité affichée, couche apprenant | [`RENDERER-COMPONENT-CONTRACT.md`](RENDERER-COMPONENT-CONTRACT.md), [contrat 06](../06-RENDERER-AND-LEARNER-LAYER.md) |
| Mode hors ligne (mécanismes de cache) | [`OFFLINE-COMPONENT-CONTRACT.md`](OFFLINE-COMPONENT-CONTRACT.md) |
| Sauvegarde / restauration des données apprenantes | [PDR-E5](../../governance/PRODUCT-DECISION-REGISTRY.md) — interface prévue §11 |
| Recherche globale multi-packages | [PDR-G4](../../governance/PRODUCT-DECISION-REGISTRY.md) — interface prévue §11 |
| Sync multi-appareils | [PDR-D3](../../governance/PRODUCT-DECISION-REGISTRY.md) — hors V1 |
| Choix technologique du shell installable | Hors contrat |

### 2.3 Mode développement

Un mode de développement qui lit encore des packages depuis l'arborescence de production **PEUT** exister. Il **NE DOIT PAS** être présenté comme la cible produit. En mode produit, les chemins du dépôt Git **NE DOIVENT PAS** être un prérequis d'étude.

---

## 3. Architecture générale

### 3.1 Chaîne obligatoire

La consommation pédagogique **DOIT** respecter la chaîne :

```
Fabrique (lou-build)
        ↓  publication d'une Release valide
Bibliothèque locale (installation + catalogue)
        ↓  Package Access
Reader (Composition → Reading View Model → Renderer)
```

### 3.2 Responsabilités

| Acteur | DOIT | NE DOIT PAS |
|---|---|---|
| **Fabrique** | Produire une Release autonome validée ; porter l'identité et le `content_digest` de publication dans le manifest publié | Dépendre de la bibliothèque pour valider ; écrire `library.json` comme vérité médicale |
| **Bibliothèque** | Installer, indexer, activer, archiver ; exposer le catalogue ; **vérifier** le `content_digest` de publication | Rebuild ; modifier le contenu médical ; inventer une Release ; redéfinir l'identité ou le digest comme nouvelle vérité |
| **Package Access** | Résoudre manifest et artefacts **déclarés** pour une `release_id` | Scanner `packages/` ; lire inventaire, Blueprint ou sources d'acquisition |
| **Reader** | Découvrir via le catalogue ; ouvrir via Package Access | Traiter le dépôt Git comme bibliothèque produit |

### 3.3 Sources de vérité

| Artefact | Autorité | Portée |
|---|---|---|
| **`manifest.json`** (dans le package installé) | Source de vérité du **package publié** — contenu, registre, édition, `publication_version`, `content_digest` de publication | Patrimoine Release ([contrat 04](../04-CHAPTER-PACKAGE.md) §10) |
| **`library.json`** | Source de vérité **opérationnelle** de la bibliothèque — ce qui est installé, actif, archivé, où ; recopie non autoritaire du `content_digest` de publication | Découverte et cycle de vie install |
| **`package.meta.json`** | **Interdit** | — |

Le catalogue **PEUT** recopier des métadonnées non médicales du manifest (titre, specialty, complétude) pour la découverte. En cas de divergence sur l'**identité Release** ou le contenu médical, le **manifest du package installé** prime pour le contenu ; une divergence d'index **DOIT** être traitée comme corruption catalogue (réparation admin), jamais comme autorité médicale parallèle.

---

## 4. Organisation de la bibliothèque

### 4.1 Racine

Il existe une **racine bibliothèque** (`LIBRARY_ROOT`) distincte de l'arborescence de production du projet. Son emplacement concret est une décision d'implantation ; ce contrat n'en fixe pas le chemin.

### 4.2 Disposition logique

Sous `LIBRARY_ROOT`, la bibliothèque **DOIT** exposer au minimum :

| Élément | Rôle |
|---|---|
| `library.json` | Catalogue opérationnel |
| `packages/` | Conteneur des Releases installées |
| `packages/<release_id>/` | Racine d'une Release installée |
| `packages/<release_id>/manifest.json` | Point d'entrée du package publié |

Le shell Reader (application) **NE DOIT PAS** résider dans `packages/`.

### 4.3 Contenu d'une Release installée

Une Release installée **DOIT** être une copie fidèle d'une Release publiée autonome : manifest et artefacts que le manifest **déclare**. L'installation **NE DOIT PAS** y ajouter un fichier `package.meta.json`. L'installation **NE DOIT PAS** y laisser des chemins relatifs pointant hors de la racine du package installé pour les artefacts nécessaires à l'étude.

---

## 5. Format normatif de `library.json`

### 5.1 Objet racine

`library.json` **DOIT** être un objet JSON avec les champs suivants :

| Champ | Obligation | Sémantique |
|---|---|---|
| `schema_version` | **DOIT** | Entier positif identifiant la révision du schéma catalogue. Valeur initiale : `1`. |
| `library_id` | **DOIT** | Identifiant stable de l'instance de bibliothèque (chaîne non vide). |
| `updated_at` | **DOIT** | Horodatage de dernière mise à jour réussie du catalogue (forme ISO-8601). |
| `entries` | **DOIT** | Tableau des entrées installées (§5.2). |
| `active_by_chapter` | **DOIT** | Objet mapant chaque `chapter` ayant une Release active vers exactement une `release_id` (§5.3). |

### 5.2 Entrée de catalogue

Chaque élément de `entries` **DOIT** comporter :

| Champ | Obligation | Sémantique |
|---|---|---|
| `release_id` | **DOIT** | Identifiant filesystem et API (§7.4), égal à la dérivation depuis l'identité. |
| `chapter` | **DOIT** | Identifiant chapitre, identique au manifest. |
| `edition` | **DOIT** | Édition Collège, identique au `source_edition` / édition du manifest. |
| `publication_version` | **DOIT** | Version de publication (§7.3), identique au manifest. |
| `status` | **DOIT** | Exactement l'une des valeurs : `active`, `archived`. |
| `installed_at` | **DOIT** | Horodatage d'installation réussie (ISO-8601). |
| `root` | **DOIT** | Chemin relatif à `LIBRARY_ROOT` vers la racine du package (`packages/<release_id>`). |
| `manifest` | **DOIT** | Chemin relatif à `LIBRARY_ROOT` vers le manifest installé. |
| `content_digest` | **DOIT** | Empreinte de **publication** de la Release (§5.5) — valeur identique à celle du manifest publié, jamais une empreinte inventée à l'install. |
| `offline_status` | **DOIT** | Statut offline de la Release — sémantique et valeurs : [`OFFLINE-COMPONENT-CONTRACT.md`](OFFLINE-COMPONENT-CONTRACT.md) §5.1. |
| `slug` | **PEUT** | Copie non autoritaire depuis le manifest. |
| `title` | **PEUT** | Copie non autoritaire depuis le manifest. |
| `specialty` | **PEUT** | Copie non autoritaire depuis le manifest. |
| `editorial_completeness` | **PEUT** | Copie non autoritaire depuis le manifest. |

### 5.3 Activation par chapitre

- `active_by_chapter` **DOIT** associer un `chapter` à au plus une `release_id`.
- Toute `release_id` présente dans `active_by_chapter` **DOIT** figurer dans `entries` avec `status` égal à `active`.
- Pour un `chapter` donné, il **NE DOIT PAS** exister deux entrées `status: active` distinctes.

### 5.4 Interdictions de contenu catalogue

`library.json` **NE DOIT PAS** contenir :

- de vocabulaire produit Reader (libellés d'onglets, emojis, ordre des vues cognitives) ;
- de contenu médical auteur ;
- de chemins absolus du dépôt de production comme prérequis produit ;
- de deuxième autorité médicale parallèle au manifest.

### 5.5 `content_digest` — empreinte de publication

Le `content_digest` est une **propriété de la Release publiée**, pas une vérité créée par la bibliothèque.

| Règle | Énoncé |
|---|---|
| **Origine** | Le digest **DOIT** être **calculé par la Fabrique** lors de la publication de la Release et **porté par le manifest publié**. |
| **Nature** | Il désigne l'empreinte du contenu de cette publication — **digest de publication**. |
| **Installation** | L'installation **DOIT** **vérifier** que le contenu copié correspond à ce digest de publication (ou signaler une **corruption** / échec d'intégrité). |
| **Catalogue** | L'entrée catalogue **DOIT** recopier le digest de publication **sans le redéfinir**. |
| **Interdit** | L'installation **NE DOIT PAS** recalculer un digest pour en faire une **nouvelle vérité** d'identité ou de contenu. Un recalcul local n'est admis que comme **moyen de vérification** contre le digest de publication déjà fixé. |
| **Identité** | Le digest **NE DOIT PAS** remplacer ni modifier le triplet `(chapter, edition, publication_version)`. L'installation **ne redéfinit jamais** l'identité du package. |

---

## 6. Invariants

| ID | Invariant |
|---|---|
| **L-01** | En mode produit, toute étude porte sur une Release **installée** référencée par le catalogue. |
| **L-02** | `library.json` est la **seule** source opérationnelle de découverte des Releases pour le Reader. |
| **L-03** | Le manifest installé est la **seule** source de vérité du contenu publié d'une Release. |
| **L-04** | Aucun fichier `package.meta.json` n'existe dans une Release installée ni comme autorité catalogue. |
| **L-05** | L'identité d'une Release installée est le triplet `(chapter, edition, publication_version)` ([ADR-006](../../adr/ADR-006-pedagogical-patrimony-and-edition-lineage.md)). |
| **L-06** | `release_id` est une fonction **déterministe et injective** de ce triplet (§7.4). |
| **L-07** | Une Release **active** n'est jamais remplacée par écrasement silencieux ; une nouvelle publication produit une nouvelle entrée (archivage de la précédente si elle cède l'activation). |
| **L-08** | Le Reader en fonctionnement normal **ne scanne pas** `packages/`. |
| **L-09** | Package Access ne résout que des artefacts **déclarés** par le manifest de la Release ouverte. |
| **L-10** | Les données d'apprentissage référencent une Release par son identité (ou empreinte équivalente), jamais le seul `chapter` ([ADR-006](../../adr/ADR-006-pedagogical-patrimony-and-edition-lineage.md) §3). |

---

## 7. Règles d'identité

### 7.1 `chapter`

- **DOIT** être l'identifiant chapitre du package publié (ex. `cardio/234`).
- **DOIT** être identique entre manifest installé et entrée catalogue.

### 7.2 `edition`

- **DOIT** désigner l'édition Collège de la Release (entier d'année ou forme équivalente déjà portée par le manifest, ex. `2022`).
- **DOIT** être identique entre manifest installé et entrée catalogue.

### 7.3 `publication_version`

- **DOIT** être un entier strictement positif.
- **DOIT** être **relative au couple** `(chapter, edition)` : la première publication d'une édition pour un chapitre **DOIT** utiliser `1` ; chaque republication **de la même édition** **DOIT** incrémenter ce compteur.
- Un changement d'édition Collège **DOIT** démarrer une nouvelle lignée : la première publication de la nouvelle édition **DOIT** utiliser `publication_version = 1` pour ce nouveau couple `(chapter, edition)`.
- **DOIT** figurer dans le **manifest publié** comme partie de l'identité Release.
- **DOIT** être recopié sans altération dans l'entrée catalogue.

### 7.4 `release_id`

`release_id` **DOIT** être dérivé exclusivement de `(chapter, edition, publication_version)` selon la règle suivante :

1. Soit `chapter_fs` la chaîne `chapter` dans laquelle chaque caractère `/` est remplacé par la séquence `__`.
2. Soit `edition_s` et `publication_version_s` les représentations décimales sans préfixe de `edition` et `publication_version`.
3. Alors :

```text
release_id = chapter_fs + "__" + edition_s + "__" + publication_version_s
```

Exemple normatif : `(cardio/234, 2022, 1)` → `cardio__234__2022__1`.

- La dérivation **DOIT** être stable dans le temps pour un triplet donné.
- Deux triplets distincts **NE DOIVENT PAS** produire le même `release_id`.
- Le répertoire installé **DOIT** être nommé exactement `packages/<release_id>/`.
- Deux Releases présentant le même `release_id` **SONT RÉPUTÉES** représenter **exactement la même identité Release** (même triplet).
- Le `release_id` **reste un dérivé** : il **N'EST JAMAIS** la source de vérité de l'identité. La source de vérité de l'identité **DOIT** demeurer le triplet `(chapter, edition, publication_version)` porté par le manifest publié.

---

## 8. Règles d'installation

### 8.1 Préconditions

L'installation **DOIT** partir d'une Release **publiée valide** (gates satisfaites — [contrat 04](../04-CHAPTER-PACKAGE.md)). L'installation **NE DOIT PAS** publier un candidat de build échoué.

### 8.2 Copie atomique

L'installation **DOIT** rendre le package visible au catalogue seulement lorsque la copie sous `packages/<release_id>/` est **complète et cohérente**. Une interruption **NE DOIT PAS** laisser une entrée catalogue pointant vers un arbre partiel.

L'atomicité garantie par ce contrat est une **atomicité de visibilité opérationnelle**, non une transaction atomique globale :

- la Release **NE DOIT PAS** être référencée dans `library.json` avant la publication complète du répertoire installé sous `packages/<release_id>/` ;
- cette publication **DOIT** reposer sur un **renommage atomique** au sein du **même système de fichiers local** (typiquement depuis un répertoire de staging vers `packages/<release_id>/`) ;
- l'installation **N'EST PAS** une transaction filesystem unique couvrant simultanément l'arbre du package et `library.json`.

Conséquences normatives :

- un crash entre le renommage du package et la persistance de `library.json` **PEUT** laisser un package **orphelin** non catalogué ; cette situation est **acceptable** au regard du présent contrat (le package reste invisible au Reader, qui ne découvre que via `library.json`) ;
- en revanche, une entrée catalogue pointant vers un package **partiel** ou incohérent est **interdite**.

Les garanties de ce paragraphe concernent les systèmes de fichiers locaux officiellement ciblés (**APFS**, **NTFS**, **ext4**). Elles **ne couvrent pas** les volumes réseau (SMB/NFS), FAT/exFAT, ni les montages cloud.

### 8.3 Mise à jour du catalogue

Après copie réussie, l'installation **DOIT** :

1. lire le `content_digest` de **publication** depuis le manifest de la Release ;
2. **vérifier** l'intégrité du contenu installé contre ce digest (échec = corruption — pas de nouvelle empreinte autoritaire) ;
3. ajouter ou mettre à jour l'entrée correspondante dans `entries`, en y recopiant ce même digest de publication ;
4. mettre à jour `updated_at` ;
5. persister `library.json` de façon à ce qu'un lecteur concurrent ne voie pas un catalogue tronqué.

### 8.4 Activation

- L'installation d'une Release **PEUT** la désigner comme active pour son `chapter`.
- Lorsqu'une Release devient active pour un `chapter`, toute Release précédemment active pour ce `chapter` **DOIT** passer à `status: archived` (conservation) et être retirée de `active_by_chapter` au profit de la nouvelle.
- L'activation **NE DOIT PAS** supprimer les fichiers de l'ancienne Release.

### 8.5 Archivage

- L'archivage **DOIT** conserver le package installé et l'entrée catalogue avec `status: archived`.
- La suppression définitive **NE DOIT PAS** être le comportement par défaut.
- Aucune opération d'installation, d'activation ou d'archivage **NE DOIT** entraîner la perte silencieuse de données d'apprentissage attachées à une Release ([ADR-006](../../adr/ADR-006-pedagogical-patrimony-and-edition-lineage.md) §3, §6).

### 8.6 Idempotence

Réinstaller strictement le même triplet identité avec le même contenu **DOIT** être sûr (pas de seconde lignée fantôme). Un contenu différent pour le même `release_id` **DOIT** être rejeté ou traité comme corruption — jamais fusionné silencieusement.

---

## 9. Package Access

### 9.1 Mission

Package Access **DOIT** fournir au Reader (Composition, Renderer) un accès en **lecture seule** au manifest et aux artefacts **déclarés** par le manifest d'une Release installée.

### 9.2 Entrées

Package Access **DOIT** accepter au minimum :

- une `release_id` présente au catalogue, ou
- un `chapter` résolu via `active_by_chapter` vers une `release_id` active.

### 9.3 Sorties

Package Access **DOIT** pouvoir :

- résoudre le chemin/URL du manifest ;
- résoudre un artefact relatif **déclaré** par ce manifest ;
- signaler une absence, une corruption d'accès ou un chemin interdit.

### 9.4 Obligations

| Obligation | Énoncé |
|---|---|
| **Catalogue d'abord** | La résolution d'une Release **DOIT** s'appuyer sur `library.json` (entrée `root` / `manifest`), pas sur un inventaire runtime de `packages/`. |
| **Manifest-only pour le contenu** | Seuls les artefacts que le manifest déclare (ou les sidecars qu'il référence de façon autoritaire) **SONT** accessibles. |
| **Chemins sûrs** | Toute résolution **DOIT** rejeter les segments `..` et tout chemin s'échappant de `packages/<release_id>/`. |
| **Immuabilité** | Package Access **NE DOIT PAS** modifier le package installé ni le manifest. |
| **Pas d'autorités parallèles** | Package Access **NE DOIT PAS** lire inventaire, Blueprint, sources d'acquisition ou visualSpec sémantique comme entrée d'étude. |

### 9.5 Relation Composition

La Composition **NE DOIT PAS** dépendre du catalogue. Elle consomme le **manifest** fourni par Package Access. Le catalogue des chapitres **reste exclu** du contrat de composition ([`COMPOSITION-DECISION-REGISTRY.md`](../../governance/COMPOSITION-DECISION-REGISTRY.md)).

---

## 10. Comportements interdits

| Interdit | Précision |
|---|---|
| **Scan runtime `packages/`** | Le Reader en fonctionnement normal **NE DOIT PAS** découvrir des Releases en listant le système de fichiers. |
| **Scan d'administration comme vérité** | Un scan éventuel **PEUT** exister uniquement comme **outil de diagnostic ou de réparation**. Il **NE DEVIENT JAMAIS** une source de vérité. Il **NE DOIT JAMAIS** remplacer `library.json` pendant le fonctionnement normal du Reader. |
| **Modification du manifest installé** | Aucun composant bibliothèque ou Reader **NE DOIT** altérer le manifest ou les artefacts médicaux installés. |
| **Suppression silencieuse** | Interdit d'effacer une Release active ou archivée, ou des données apprenantes liées, sans opération explicite et traçable. |
| **Écrasement silencieux** | Interdit de remplacer le contenu d'une `release_id` existante par un autre contenu sans nouvelle identité. |
| **Duplication de la vérité** | Interdit d'introduire `package.meta.json` ou toute troisième autorité d'identité / contenu. |
| **Catalogue = vérité médicale** | Interdit de fonder une décision médicale ou éditoriale sur les seuls champs optionnels du catalogue. |
| **Prérequis dépôt Git** | En mode produit, interdit d'exiger l'arborescence de production pour ouvrir une Release installée. |
| **Rebuild dans la bibliothèque** | La bibliothèque **NE DOIT PAS** exécuter la Fabrique ni régénérer du contenu pédagogique. |

---

## 11. Considérations futures

Ces interfaces sont **prévues** ; leur implémentation n'est **pas** définie ici.

### 11.1 PDR-D2 — Offline

Les mécanismes hors ligne **DOIVENT** porter sur des packages **déjà installés** (présents au catalogue). L'événement d'installation est le point d'ancrage de la préparation offline. Le détail normatif relève du [`OFFLINE-COMPONENT-CONTRACT.md`](OFFLINE-COMPONENT-CONTRACT.md) — notamment le graphe de certification §5.2, la purge administrative §9.3 et la détection stale §9.4. Chaque entrée catalogue **DOIT** porter un champ `offline_status` défini par ce contrat.

### 11.2 PDR-E5 — Sauvegarde et restauration

Une sauvegarde patrimoniale **DOIT** pouvoir inclure le catalogue et les packages installés référencés, conjointement aux données d'apprentissage ancrées par identité Release. La restauration **NE DOIT PAS** supprimer silencieusement des données apprenantes orphelines.

### 11.3 PDR-G4 — Recherche globale

La recherche à l'échelle de tous les packages installés **POURRA** s'appuyer sur `library.json` comme inventaire des Releases. Elle reste hors périmètre V1.

---

## 12. Place dans la hiérarchie

### 12.1 Documents qui priment

En cas de conflit, priment dans cet ordre :

1. les ADR applicables, notamment [ADR-006](../../adr/ADR-006-pedagogical-patrimony-and-edition-lineage.md) ;
2. les contrats fondamentaux [01](../01-TRUST-AND-FIDELITY.md) à [09](../09-CLINICAL-SCENARIO.md), en particulier [04](../04-CHAPTER-PACKAGE.md), [06](../06-RENDERER-AND-LEARNER-LAYER.md) et [08](../08-RELEASE-EDITORIAL-ARCHITECTURE.md).

Ce contrat **NE DOIT PAS** contredire un document supérieur.

### 12.2 Documents sur lesquels il prime

Ce contrat **prime** sur :

- la documentation technique Reader relative à la bibliothèque et à Package Access ;
- les plans d'implantation et le code des outils d'installation et du catalogue ;
- toute description qui confondrait dépôt de production et bibliothèque produit.

### 12.3 Composition V1

Ce contrat **NE DOIT PAS** modifier la Composition Specification, le Composition Engine, le Reading View Model ni les obligations du [`COMPOSITION-COMPONENT-CONTRACT.md`](COMPOSITION-COMPONENT-CONTRACT.md). La frontière catalogue ↔ composition reste celle déjà actée : le catalogue est **hors** composition.

---

## 13. Documents connexes

| Document | Rôle |
|---|---|
| [PDR-D1](../../governance/PRODUCT-DECISION-REGISTRY.md) | Décision produit — app installable et bibliothèque locale |
| [ADR-006](../../adr/ADR-006-pedagogical-patrimony-and-edition-lineage.md) | Patrimoine ; identité `(chapter, edition, publication_version)` |
| [Contrat 04](../04-CHAPTER-PACKAGE.md) | Chapter Package / Release ; manifest |
| [Contrat 08](../08-RELEASE-EDITORIAL-ARCHITECTURE.md) | Architecture éditoriale Release |
| [Contrat 02](../02-IDENTITY-AND-ANCHORS.md) §11.1 | Ancrage des données d'apprentissage à une Release |
| [Contrat 06](../06-RENDERER-AND-LEARNER-LAYER.md) | Renderer ; consommation du publié |
| [`RENDERER-COMPONENT-CONTRACT.md`](RENDERER-COMPONENT-CONTRACT.md) §7.2 | Package Access (composant Renderer) |
| [`COMPOSITION-COMPONENT-CONTRACT.md`](COMPOSITION-COMPONENT-CONTRACT.md) | Composition — indépendante du catalogue |
| [`OFFLINE-COMPONENT-CONTRACT.md`](OFFLINE-COMPONENT-CONTRACT.md) | Mode hors ligne — statut `offline_status` |

---

*Contrat composant Library Catalog — Lot D1-A — en vigueur.*
