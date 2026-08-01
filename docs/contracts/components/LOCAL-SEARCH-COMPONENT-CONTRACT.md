# Local Search Component Contract

| | |
|---|---|
| **Type** | Contrat composant normatif |
| **Statut** | **En vigueur** — clôture D6-G (2026-08-01) |
| **Composant** | Recherche locale Reader (Local Search) |
| **Décision produit** | [PDR-D6](../../governance/PRODUCT-DECISION-REGISTRY.md) |
| **ADR associé** | — |
| **Index** | [`../00-INDEX.md`](../00-INDEX.md) · [`00-INDEX.md`](00-INDEX.md) |

Ce document définit les **obligations durables** de la **recherche textuelle locale** de Lou Médecine sur la Release **ouverte**. Il spécialise [PDR-D6](../../governance/PRODUCT-DECISION-REGISTRY.md) et les contrats fondamentaux pour ce composant. Il ne redéfinit pas le contenu médical d'une Release, ne spécifie pas de technologie de moteur de recherche particulière et n'introduit aucune décision médicale nouvelle.

---

## 1. Objectif

Le composant Local Search **DOIT** fournir une **recherche textuelle locale**, **déterministe** et **reproductible**, limitée à la Release **actuellement ouverte** dans le Reader.

| Règle | Énoncé |
|---|---|
| **Consommation** | Local Search **CONSOMME** le contenu publié ; il **NE PRODUIT JAMAIS** de contenu médical, pédagogique ou éditorial. |
| **Immutabilité** | Local Search **NE MODIFIE JAMAIS** le Chapter Package, le manifest, les artefacts déclarés ni le catalogue. |
| **Hors édition** | Local Search **NE PARTICIPE JAMAIS** à l'édition, à la publication, à la validation médicale ni à la composition des vues. |
| **Autonomie locale** | Local Search **DOIT** fonctionner sans serveur distant, sans service cloud et sans appel réseau pour indexer ou interroger le contenu publié d'une Release dont les artefacts sont accessibles localement via Package Access. |

En mode produit, les critères de conformité de la recherche locale **DOIVENT** être évalués exclusivement sur une **bibliothèque installée** conforme au [`LIBRARY-CATALOG-CONTRACT.md`](LIBRARY-CATALOG-CONTRACT.md), avec une Release **ouverte** identifiée par `release_id`.

---

## 2. Périmètre

### 2.1 Inclus

| Domaine | Couverture |
|---|---|
| **Définition normative** | Index dérivé vs autorité ; périmètre Release ouverte |
| **Architecture** | Local Search Service (pur), Local Search Runtime, frontières Reader / Package Access |
| **Corpus indexable** | Artefacts textuels publiés déclarés par le manifest |
| **Unités de recherche** | Vues publiées, projections, documents, ancres, identifiants officiels |
| **Modèle de résultat** | SearchHit — identifiants, ancre, navigation, plages, snippet |
| **Ordonnancement** | Tri entièrement déterministe |
| **Cycle de vie index** | Construction paresseuse V1, cache versionné, invalidation, purge |
| **Frontières** | Séparation Library, Offline, Patrimoine, Composition, Session Service |
| **Comportements interdits** | Recherche globale, sémantique, IA, scan, autorité parallèle |

### 2.2 Exclus

| Domaine | Autorité |
|---|---|
| Recherche multi-packages / globale bibliothèque | [PDR-G4](../../governance/PRODUCT-DECISION-REGISTRY.md) — hors V1 |
| Recherche sémantique, IA, assistant conversationnel | [PDR-A1](../../governance/PRODUCT-DECISION-REGISTRY.md), [PDR-D6](../../governance/PRODUCT-DECISION-REGISTRY.md) |
| Patrimoine apprenant, notes personnelles, overlays | [`LEARNER-PATRIMONY-COMPONENT-CONTRACT.md`](LEARNER-PATRIMONY-COMPONENT-CONTRACT.md) |
| Inventaire, Blueprint, sources d'acquisition, visualSpec | [Contrat 04](../04-CHAPTER-PACKAGE.md), [`RENDERER-COMPONENT-CONTRACT.md`](RENDERER-COMPONENT-CONTRACT.md) §10 |
| Sidecars et artefacts de build non textuels de lecture | [Contrat 04](../04-CHAPTER-PACKAGE.md) §9 — hors corpus V1 sauf textes explicitement publiés indexables |
| Certification offline, `offline_status` | [`OFFLINE-COMPONENT-CONTRACT.md`](OFFLINE-COMPONENT-CONTRACT.md) |
| Catalogue, installation, Package Access | [`LIBRARY-CATALOG-CONTRACT.md`](LIBRARY-CATALOG-CONTRACT.md) |
| Composition des vues cognitives | [`COMPOSITION-COMPONENT-CONTRACT.md`](COMPOSITION-COMPONENT-CONTRACT.md) |
| Présentation DOM, surbrillance visuelle, parcours utilisateur détaillé | [`RENDERER-COMPONENT-CONTRACT.md`](RENDERER-COMPONENT-CONTRACT.md), documentation technique |
| Persistance de l'historique de recherche | Donnée dérivée / temporaire — hors patrimoine |
| Choix de bibliothèque technique (IndexedDB, tokenisation interne) | Implémentation — hors contrat sauf invariants |

### 2.3 Mode développement

Un mode de développement **PEUT** indexer une Release hors bibliothèque installée ou sans contexte catalogue complet. Ce mode **NE DOIT PAS** être présenté comme la cible produit ni invoqué pour valider la conformité recherche locale V1.

---

## 3. Autorité et nature de l'index

### 3.1 Chaîne obligatoire

```
Manifest publié
        ↓
Package Access
        ↓
Artefacts déclarés (lecture seule)
        ↓
Local Search (extraction → index dérivé)
        ↓
SearchHit[] (résultats de requête)
        ↓
Reader (navigation et présentation)
```

L'index de recherche **N'EST JAMAIS** une source d'autorité. Seuls le **manifest publié** et les **artefacts qu'il déclare** font autorité pour le contenu indexé ([contrat 04](../04-CHAPTER-PACKAGE.md) §10, [`LIBRARY-CATALOG-CONTRACT.md`](LIBRARY-CATALOG-CONTRACT.md) §3.3).

### 3.2 Index dérivé

| Règle | Énoncé |
|---|---|
| **Statut** | L'index **EST** une donnée **dérivée**, **reconstructible** et **non patrimoniale** ([`LEARNER-PATRIMONY-COMPONENT-CONTRACT.md`](LEARNER-PATRIMONY-COMPONENT-CONTRACT.md) §5.4). |
| **Non-autorité** | Aucune décision médicale, éditoriale ou de navigation produit **NE DOIT** reposer sur l'index seul en dehors du contenu publié sous-jacent. |
| **Régénération** | L'index **DOIT** pouvoir être entièrement reconstruit à partir des artefacts déclarés accessibles via Package Access, sans lecture du patrimoine apprenant. |
| **Indépendance offline** | L'index **N'EST PAS** un artefact de certification offline ; sa présence ou son absence **NE DOIT PAS** être interprétée comme une garantie offline ([`OFFLINE-COMPONENT-CONTRACT.md`](OFFLINE-COMPONENT-CONTRACT.md) §3.1). |

### 3.3 Index vs warm cache

Un **cache d'index** persistant **EST** un remplissage **dérivé** du contenu publié — distinct du warm cache offline (§3.1 [`OFFLINE-COMPONENT-CONTRACT.md`](OFFLINE-COMPONENT-CONTRACT.md)).

| Règle | Énoncé |
|---|---|
| **Non-certifiant** | Un cache d'index **NE CONSTITUE PAS** une garantie offline ni une seconde copie autoritaire du package. |
| **Invalidation** | Un cache d'index **DOIT** être invalidé lorsque `content_digest` ou `index_schema_version` ne correspond plus au contexte courant. |
| **Reconstruction** | L'absence de cache **NE DOIT PAS** empêcher la recherche si les artefacts déclarés sont accessibles localement. |

---

## 4. Architecture

### 4.1 Composants logiques

| Composant | Nature | Rôle |
|---|---|---|
| **Local Search Service** | **Pur** — sans I/O, sans DOM, sans horloge système non injectée | Construction logique de l'index ; interrogation ; validation de cache ; production des SearchHit |
| **Local Search Runtime** | Orchestration I/O | Lecture des artefacts via Package Access ; persistance du cache dérivé ; délégation au Service pur |
| **Reader** | Consommateur | UI de recherche ; exécution de la navigation vers un SearchHit ; surbrillance à l'affichage |

Le Local Search Service **NE DOIT PAS** accéder directement au système de fichiers, au stockage persistant, au catalogue, au DOM ni à un réseau.

### 4.2 Responsabilités

| Acteur | DOIT | NE DOIT PAS |
|---|---|---|
| **Local Search Service** | Produire un index déterministe ; répondre aux requêtes ; valider un cache logiquement ; produire SearchHit complets incluant snippets | Effectuer des I/O ; modifier des packages ; lire le patrimoine apprenant ; inventer du contenu |
| **Local Search Runtime** | Orchestrer build/query ; lire artefacts via Package Access ; gérer le cache dérivé versionné ; signaler diagnostics localisés | Devenir une frontière d'accès au package ; certifier l'offline ; persister des données apprenantes |
| **Package Access** | Fournir manifest et artefacts **déclarés** en lecture seule | Indexer ; interpréter médicalement ; scanner `packages/` |
| **Bibliothèque** | Porter identité Release installée (`release_id`, `content_digest`) | Construire ou posséder l'index recherche ; déclencher la recherche |
| **Browser Offline Manager** | Certifier la disponibilité locale des artefacts déclarés | Construire, certifier ou posséder l'index recherche |
| **Composition** | Produire Reading View Model avec `viewId` et disponibilités | Alimenter l'index ; dépendre de la recherche |
| **Session Service** | Calculer ResumePlan ([PDR-D4](../../governance/PRODUCT-DECISION-REGISTRY.md)) | Persister requêtes ou résultats de recherche ; consommer ou manipuler des SearchHit |
| **Patrimoine apprenant** | Rappeler l'indépendance des données dérivées | Être requis pour indexer ; porter l'index |
| **Reader** | Présenter UI recherche ; naviguer vers SearchHit ; surligner à l'affichage | Reconstruire snippets ; indexer ; modifier le package ; agréger multi-Releases |

### 4.3 Frontières

| Frontière | Règle |
|---|---|
| **Reader ↔ Local Search** | Le Reader **DOIT** consommer les SearchHit produits par Local Search ; il **NE DOIT PAS** reconstruire les snippets ni réimplémenter la logique d'ordonnancement des résultats. |
| **Local Search ↔ Package Access** | Local Search **DOIT** lire le contenu publié **uniquement** via Package Access — jamais par scan libre de `packages/`. |
| **Local Search ↔ Patrimoine** | Local Search **NE DOIT PAS** lire ni exiger le patrimoine apprenant pour indexer ou interroger. |
| **Local Search ↔ Offline** | Local Search **NE DOIT PAS** modifier `offline_status` ; l'offline **NE DOIT PAS** posséder l'index recherche. |
| **Local Search ↔ Composition** | Local Search **PEUT** consommer des métadonnées de disponibilité des vues issues du Reading View Model ou d'une projection équivalente déterministe ; la Composition **NE DOIT PAS** dépendre de Local Search. |
| **Local Search ↔ Session Service** | La navigation exécutée par le Reader à partir d'un SearchHit **DOIT** rester compatible avec les kinds de `ResumePoint` autorisés par le modèle D4 ; le Session Service **NE CONSOMME PAS** de SearchHit. L'état UI éphémère de recherche **NE DOIT PAS** être persisté par Session Service ni patrimoine. |

---

## 5. Périmètre fonctionnel de la recherche

### 5.1 Release ouverte

| Règle | Énoncé |
|---|---|
| **Unicité** | Toute recherche V1 **DOIT** être limitée à la **Release ouverte** — identifiée par `release_id` — dans le contexte d'étude courant du Reader. |
| **Interdit multi-Release** | Local Search **NE DOIT PAS** agréger, fusionner ou interroger plusieurs Releases, y compris d'autres Releases installées pour le même `chapter`. |
| **Interdit globale** | Local Search **NE DOIT PAS** utiliser `library.json` comme corpus de recherche multi-entrées ([PDR-G4](../../governance/PRODUCT-DECISION-REGISTRY.md)). |

### 5.2 Manifest-only

| Règle | Énoncé |
|---|---|
| **Énumération** | Seuls les artefacts **déclarés** par le manifest publié de la Release ouverte **SONT** éligibles à l'indexation — même périmètre d'énumération que la disponibilité offline des artefacts ([`OFFLINE-COMPONENT-CONTRACT.md`](OFFLINE-COMPONENT-CONTRACT.md) §6, [`LIBRARY-CATALOG-CONTRACT.md`](LIBRARY-CATALOG-CONTRACT.md) §9.4). |
| **Interdit scan** | Aucun scan libre de `packages/<release_id>/` **NE DOIT** compléter, remplacer ou contredire l'énumération manifest. |
| **Interdit autorités parallèles** | Local Search **NE DOIT PAS** lire inventaire, Blueprint, sources d'acquisition brutes, visualSpec sémantique, réconciliation persistée, grounding ou trace_index comme corpus textuel de recherche V1. |

### 5.3 Contenu publié uniquement

| Règle | Énoncé |
|---|---|
| **Statut publication** | Seuls les contenus **publiés** ou explicitement déclarés accessibles au Reader **PEUVENT** produire des SearchHit. |
| **Absences honnêtes** | Une projection, question, scénario ou vue **non publiée**, **planned** ou **known_absent** **NE DOIT PAS** produire de résultat — jamais de contenu inventé. |

---

## 6. Corpus indexable

### 6.1 Types d'artefacts éligibles (V1)

Local Search **DOIT** pouvoir indexer le texte extrait des catégories suivantes lorsqu'elles sont **déclarées** par le manifest et **publiées** :

| Catégorie | Source autoritaire | Champs ou zones textuelles |
|---|---|---|
| **Projections de compréhension** | Fichiers markdown déclarés (`projections.*.path`) | Prose, titres, prompts, walkthrough, points d'attention — **hors** frontmatter non affiché |
| **Source Collège officielle** | `college_source_path` | Texte verbatim publié — titres, paragraphes, listes, cellules de tableaux |
| **Questions d'évaluation** | Fichiers YAML déclarés ([contrat 07](../07-ASSESSMENT-QUESTION.md)) | `stem.text`, `options[].label`, `options[].explanation` |
| **Scénarios cliniques** | Fichiers YAML déclarés ([contrat 09](../09-CLINICAL-SCENARIO.md)) | `title`, `situation.text`, textes des segments interactifs publiés (`prompt`, `label`, `feedback`, et équivalents déclarés) |
| **Texte alternatif de figure** | Entrées `visuals[]` du manifest | Champ `alt` lorsqu'il est présent et non vide |

L'extraction **DOIT** respecter les identifiants officiels déjà portés par le package ([contrat 02](../02-IDENTITY-AND-ANCHORS.md)) — éléments pédagogiques, `question_id`, `scenario_id`, ancres de contenu.

### 6.2 Exclusions explicites du corpus

| Exclusion | Précision |
|---|---|
| **Patrimoine apprenant** | Notes personnelles, surlignages, notes CaretAnchor, diagrammes personnels, historique QCM, préférences |
| **Données de build** | Grounding, réconciliation, trace_index JSON, sidecars de vérification — sauf texte de lecture explicitement publié ailleurs |
| **Inventaire / Blueprint** | Non présents comme autorité Reader |
| **Métadonnées pures** | Identifiants, statuts, scores, `claim_facets`, références KP non accompagnées de texte indexable dans les champs autorisés |
| **Vocabulaire produit** | Libellés d'onglets, ordre des vues — relèvent de la Composition Specification, pas du package |

### 6.3 SVG — invariant verrouillé

| Règle | Énoncé |
|---|---|
| **Interdit extraction SVG** | Les fichiers **SVG publiés** **NE CONSTITUENT JAMAIS** une source textuelle d'autorité pour l'index — ni par lecture DOM, ni par parse interne du markup vectoriel, ni par OCR. |
| **Seule exception** | Le texte **`alt` déclaré dans le manifest** pour une figure officielle **PEUT** être indexé comme métadonnée publiée explicite. |
| **Interdit inférence** | Local Search **NE DOIT PAS** inférer un contenu searchable depuis un visuel officiel absent de texte publié indexable. |

---

## 7. Vues cognitives et disponibilité

### 7.1 Principe

Seules les **vues cognitive effectivement publiées** dans le contexte de la Release ouverte **PEUVENT** produire des SearchHit.

Local Search **DOIT** respecter la disponibilité des vues telle qu'établie par la Composition pour la Release ouverte — notamment via le Reading View Model ou des métadonnées équivalentes deterministes fournies au Runtime.

### 7.2 Règles normatives

| Disponibilité | Comportement obligatoire |
|---|---|
| **`published`** (ou équivalent résolu) | Indexation et résultats **autorisés** pour les sources de la vue |
| **`planned`** | **Aucun** SearchHit — index vide pour cette vue |
| **`known_absent`** | **Aucun** SearchHit — pas d'erreur de recherche globale ; absence honnête |
| **Vue sans source résolue** | **Aucun** SearchHit |

### 7.3 Identifiants de vues

Les `viewId` **DOIVENT** être ceux produits par la Composition Specification gelée ([`COMPOSITION-COMPONENT-CONTRACT.md`](COMPOSITION-COMPONENT-CONTRACT.md)). Local Search **NE DOIT PAS** introduire une taxonomie parallèle de vues.

---

## 8. Unités de recherche

### 8.1 Hiérarchie logique

| Niveau | Identifiant | Rôle |
|---|---|---|
| **Release** | `release_id` | Périmètre unique de l'index et de toute requête |
| **Vue cognitive** | `viewId` | Groupement primaire des résultats |
| **Projection** | `projection.id` | Provenance éditoriale lorsque applicable |
| **Document** | Référence d'artefact déclaré (chemin relatif manifest) | Ordre intra-vue |
| **Unité de contenu** | Élément pédagogique, `question_id`, `scenario_id`, section Collège, segment de scénario, ou ancre de bloc | Granularité du SearchHit |
| **Ancre** | Identifiant stable de navigation — ancre markdown `{#…}`, chemin de section, `question_id`, etc. | Cible de navigation Reader |
| **Occurrence** | Offset et longueur dans le texte normalisé du document | Plage de correspondance et snippet |

### 8.2 Compatibilité reprise de session

Les ancres portées par un SearchHit **DOIVENT** être **compatibles** avec les kinds de `ResumePoint` autorisés par la Release ouverte ([PDR-D4](../../governance/PRODUCT-DECISION-REGISTRY.md)) — sans imposer que toute navigation recherche mette à jour la session patrimoniale.

---

## 9. Modèle SearchHit

### 9.1 Nature

Un **SearchHit** est l'unité normative de résultat produite par Local Search. Il **EST** une projection de correspondance textuelle sur le contenu publié — **pas** une autorité de contenu.

### 9.2 Contenu minimal obligatoire

Chaque SearchHit **DOIT** porter au minimum :

| Champ conceptuel | Obligation |
|---|---|
| **`release_id`** | Identité de la Release indexée |
| **`viewId`** | Vue cognitive cible |
| **Identifiants de unité** | Selon le type — élément pédagogique, `question_id`, `scenario_id`, section, etc. |
| **`anchor`** | Point de navigation stable vers l'occurrence |
| **Métadonnées de navigation** | Informations suffisantes pour que le Reader exécute changement de vue, scroll et surbrillance sans réinterpréter le corpus |
| **`matchRanges`** | Plages de correspondance dans le texte normalisé indexé — ordre stable |
| **`snippet`** | Extrait affichable **déjà calculé** par Local Search |

### 9.3 Snippet — responsabilité exclusive

| Règle | Énoncé |
|---|---|
| **Production** | La logique de génération des extraits **APPARTIENT** au composant Local Search — via le Local Search Service. |
| **Interdit Reader** | Le Reader **NE DOIT PAS** reconstruire les snippets à partir du corpus brut ; il **DOIT** présenter le `snippet` fourni. |
| **Non-autorité** | Le snippet **NE DOIT PAS** être persisté comme contenu officiel ni fusionné au package. |

---

## 10. Ordonnancement des résultats

### 10.1 Déterminisme obligatoire

Pour une Release, un `content_digest`, un `index_schema_version`, une requête normalisée et un index identique, Local Search **DOIT** produire une liste de SearchHit **identique** — même ordre, mêmes plages, mêmes snippets.

| Interdit | Précision |
|---|---|
| **Comportement non spécifié** | Aucun ordonnancement **NE DOIT** dépendre d'un comportement non prescrit par ce contrat — parallélisme, ordre d'insertion arbitraire ou locale non figée par `index_schema_version` inclus. |
| **Hasard** | Aucun facteur aléatoire **N'EST** autorisé. |

### 10.2 Ordre logique normatif

Les SearchHit **DOIVENT** être triés strictement selon la clé composite suivante, comparée lexicographiquement niveau par niveau :

1. **`viewId`** — selon `displayOrder` croissant des vues dans la Composition Specification applicable ;
2. **`projection.id`** — selon l'ordre manifest des projections référencées par la vue, puis chaîne vide si non applicable ;
3. **`documentRef`** — chemin d'artefact déclaré, ordre lexicographique stable UTF-8 ;
4. **`offset`** — position croissante de l'occurrence dans le document normalisé.

En cas d'égalité parfaite sur cette clé, l'ordre **DOIT** être stable et reproductible — défini par l'`index_schema_version` et documenté dans la spécification technique subordonnée.

### 10.3 Normalisation de requête

La requête **DOIT** être normalisée selon des règles **figées** par `index_schema_version` avant matching. Ces règles **DOIVENT** être pures, déterministes et indépendantes du runtime navigateur hors locale explicitement prescrite.

---

## 11. Index — construction, cache et versioning

### 11.1 Construction V1 — paresseuse

| Règle | Énoncé |
|---|---|
| **Déclenchement V1** | En V1, l'index **DOIT** être construit de façon **paresseuse** — au **premier usage** de la recherche sur la Release ouverte, ou lors d'une validation de cache concluant à `missing` ou `stale`. |
| **Préchauffage futur** | Une implémentation **PEUT** ultérieurement **préchauffer** l'index à l'ouverture du chapitre ou après installation — **sans** modifier les invariants, les API conceptuelles ni l'obligation de reconstruction déterministe. |
| **Pureté** | La construction logique de l'index **DOIT** être réalisée par le Local Search Service à partir d'artefacts fournis en entrée — sans I/O interne. |

### 11.2 Propriétés obligatoires de l'index

| Propriété | Énoncé |
|---|---|
| **Dérivé** | Reconstruit depuis le publié — jamais source d'autorité |
| **Déterministe** | Mêmes artefacts et règles → même index logique |
| **Reconstructible** | Suppression du cache **NE DOIT PAS** empêcher la recherche |
| **Versionné** | Porte `index_schema_version` identifiable |
| **Indépendant patrimoine** | Aucune lecture patrimoniale requise |
| **Indépendant offline certifié** | Existence de l'index **NE CONDITIONNE PAS** `offline_status` |

### 11.3 Cache persistant (V1)

| Règle | Énoncé |
|---|---|
| **Autorisé** | Un cache persistant versionné **PEUT** être utilisé pour accélérer les requêtes. |
| **Non patrimonial** | Ce cache **NE DOIT PAS** résider dans le magasin patrimonial apprenant ni figurer dans le Learner Snapshot. |
| **Clé logique** | Le cache **DOIT** être invalidé si `(release_id, content_digest, index_schema_version)` ne correspond plus au contexte courant. |
| **Séparation** | Aucun second index catalogue **NE DOIT** être créé dans `library.json` ou le manifest. |

### 11.4 Validation de cache

Le Local Search Service **DOIT** pouvoir conclure de façon pure à l'une des validations suivantes :

| Verdict | Signification |
|---|---|
| **`valid`** | Cache réutilisable pour la Release et le contexte d'index courant |
| **`stale`** | Cache présent mais incohérent — rebuild requis |
| **`missing`** | Aucun cache exploitable — build requis |

---

## 12. Identité et versioning

### 12.1 `release_id`

| Règle | Énoncé |
|---|---|
| **Clé primaire** | Tout index et toute requête **DOIVENT** être scoped par `release_id`. |
| **Origine** | La `release_id` **DOIT** provenir du catalogue installé ou du manifest publié — jamais inventée par Local Search. |
| **Interdit chapitre seul** | Local Search **NE DOIT PAS** indexer ni interroger au seul `chapter` sans `release_id`. |

### 12.2 `content_digest`

| Règle | Énoncé |
|---|---|
| **Rôle** | Empreinte d'intégrité de **publication** — invalidation du cache dérivé ([`LIBRARY-CATALOG-CONTRACT.md`](LIBRARY-CATALOG-CONTRACT.md) §5.5). |
| **Obligation** | Local Search **DOIT** associer l'index au `content_digest` courant de la Release ouverte. |
| **Interdit clé patrimoniale** | Local Search **NE DOIT PAS** utiliser `content_digest` comme clé d'appartenance de données apprenantes. |

### 12.3 `index_schema_version`

| Règle | Énoncé |
|---|---|
| **Rôle** | Version **sémantique** des règles d'extraction, de normalisation, de tokenisation et d'ordonnancement. |
| **Migration** | Toute évolution incompatible **DOIT** incrémenter `index_schema_version` et invalider les caches antérieurs. |
| **Déterminisme** | À version fixe, le comportement **DOIT** être reproductible en tests. |

---

## 13. Cycle de vie et invalidation

### 13.1 Événements déclencheurs

| Événement | Action obligatoire |
|---|---|
| **Premier usage recherche** (V1) | Build si cache `missing` ou `stale` |
| **Changement de `content_digest`** | Invalidation ; rebuild au prochain usage |
| **Changement de `index_schema_version`** | Invalidation ; rebuild au prochain usage |
| **Désinstallation / purge Release** | Purge du cache index associé à la `release_id` |
| **Import patrimoine** | **Aucun effet** sur l'index |
| **Certification / échec offline** | **Aucun effet direct** sur l'existence ou la validité logique de l'index |

### 13.2 Installation et bibliothèque

| Règle | Énoncé |
|---|---|
| **Hors Library** | L'installation d'une Release **NE DOIT PAS** imposer à la Bibliothèque de construire l'index recherche. |
| **Pas de rebuild** | La Bibliothèque **NE DOIT PAS** régénérer de contenu pédagogique ni produire d'index recherche ([`LIBRARY-CATALOG-CONTRACT.md`](LIBRARY-CATALOG-CONTRACT.md) §10). |

### 13.3 Offline

| Règle | Énoncé |
|---|---|
| **Prérequis contenu** | Hors ligne, la recherche **DOIT** pouvoir s'exécuter lorsque les artefacts déclarés sont accessibles via Package Access — typiquement Release `offline_ready`. |
| **Indépendance statut** | L'absence de cache index **NE DOIT PAS** empêcher une tentative de build offline si les artefacts sont localement lisibles. |
| **Non-certification** | Local Search **NE DOIT PAS** présenter la présence d'un cache index comme preuve d'offline garanti. |

---

## 14. Interfaces conceptuelles

Ces interfaces décrivent des **obligations de frontière** — pas des signatures techniques.

### 14.1 Reader

| Interface | Obligation |
|---|---|
| **Consommation** | Le Reader **DOIT** interroger Local Search pour la Release ouverte ; il **NE DOIT PAS** dupliquer l'indexation. |
| **Snippets** | Le Reader **DOIT** afficher les snippets fournis — sans reconstruction. |
| **Navigation** | Le Reader **DOIT** exécuter la navigation vers le SearchHit sélectionné — changement de vue, ancrage, surbrillance. |
| **État éphémère** | Requête courante, panneau ouvert, focus clavier **NE DOIVENT PAS** être persistés patrimonialement. |
| **Session** | Une navigation recherche validée **PEUT** émettre un Commit Event compatible [PDR-D4](../../governance/PRODUCT-DECISION-REGISTRY.md) — sans obligation de persistance de l'acte de recherche lui-même. |

### 14.2 Local Search Runtime

| Interface | Obligation |
|---|---|
| **Orchestration** | Seul interlocuteur I/O autorisé du Local Search Service vers Package Access et cache dérivé. |
| **Diagnostics** | **DOIT** signaler artefact manquant, index stale, échec de build — visiblement et localisé. |
| **Scope** | **DOIT** refuser toute requête dont `release_id` ≠ Release ouverte. |

### 14.3 Local Search Service

| Interface | Obligation |
|---|---|
| **Pureté** | **DOIT** rester sans I/O, sans DOM, sans dépendance catalogue directe. |
| **Entrées** | Artefacts bruts + métadonnées manifest + disponibilités de vues + contexte `(release_id, content_digest, index_schema_version)`. |
| **Sorties** | Index logique, SearchHit[], verdicts cache, diagnostics purs. |

### 14.4 Package Access

| Interface | Obligation |
|---|---|
| **Lecture seule** | Local Search **DOIT** obtenir manifest et contenus via Package Access uniquement. |
| **Séparation** | Package Access **NE DOIT PAS** indexer ni répondre aux requêtes de recherche. |

### 14.5 Library Catalog

| Interface | Obligation |
|---|---|
| **Faits d'identité** | Local Search Runtime **PEUT** consommer `release_id` et `content_digest` depuis le catalogue — pour validation cache. |
| **Séparation** | La Bibliothèque **NE DOIT PAS** indexer, requêter ni posséder le cache recherche. |

### 14.6 Browser Offline Manager

| Interface | Obligation |
|---|---|
| **Indépendance** | Offline Manager **NE DOIT PAS** construire ni certifier l'index recherche. |
| **Effet indirect** | La certification offline **PEUT** rendre les artefacts lisibles hors ligne — facilitant le build d'index sans en devenir l'autorité. |

### 14.7 Learner Patrimony

| Interface | Obligation |
|---|---|
| **Non-ingérence** | Le patrimoine **NE DOIT PAS** être requis pour indexer ([`LEARNER-PATRIMONY-COMPONENT-CONTRACT.md`](LEARNER-PATRIMONY-COMPONENT-CONTRACT.md) §11.6). |
| **Non-export** | L'index **NE DOIT PAS** figurer dans le Learner Snapshot. |
| **Compatibilité** | Le modèle Release-scoped patrimonial **NE DOIT PAS** empêcher la recherche locale sur la Release ouverte. |

### 14.8 Session Service

| Interface | Obligation |
|---|---|
| **Orthogonalité** | Session Service **NE DOIT PAS** persister requêtes, résultats ni panneau recherche. |
| **Compatibilité D4** | La navigation issue d'un SearchHit, lorsqu'elle est validée par le Reader, **DOIT** rester compatible avec les kinds de `ResumePoint` autorisés — sans que le Session Service consomme ni manipule des SearchHit. |

### 14.9 Composition

| Interface | Obligation |
|---|---|
| **Indépendance** | La Composition **NE DOIT PAS** dépendre de Local Search pour produire le Reading View Model. |
| **Disponibilité vues** | Local Search **DOIT** respecter les disponibilités de vues établies par la Composition. |
| **viewId stables** | Les `viewId` utilisés dans les SearchHit **DOIVENT** être ceux de la Composition gelée. |

---

## 15. Comportements interdits

| Interdit | Précision |
|---|---|
| **Recherche multi-Release** | Interdit d'interroger ou fusionner plusieurs Releases — y compris via le catalogue. |
| **Recherche globale** | Interdit d'indexer `library.json` ou l'ensemble des packages installés ([PDR-G4](../../governance/PRODUCT-DECISION-REGISTRY.md)). |
| **Recherche sémantique / IA** | Interdit d'invoquer LLM, embeddings, ranking probabiliste ou reformulation de requête. |
| **Scan `packages/`** | Interdit d'énumérer le filesystem pour découvrir du contenu searchable. |
| **SVG comme corpus** | Interdit d'extraire du texte searchable depuis le markup SVG publié — invariant §6.3. |
| **Patrimoine requis** | Interdit d'exiger notes, historique ou préférences pour indexer le publié. |
| **Modification package** | Interdit d'écrire dans manifest, artefacts ou catalogue lors d'un build d'index. |
| **Index autoritaire** | Interdit de traiter l'index comme source de vérité médicale ou éditoriale. |
| **Patrimonialisation index** | Interdit d'inclure l'index dans le Learner Snapshot ou magasin protégé. |
| **Offline certifié par index** | Interdit de déduire `offline_ready` de la présence d'un cache recherche. |
| **Snippet reconstruit Reader** | Interdit au Reader de recalculer les snippets affichés. |
| **Tri non déterministe** | Interdit de produire un ordre de résultats dépendant du runtime non spécifié. |
| **Résultat sur vue non publiée** | Interdit de produire un SearchHit pour vue `planned` ou `known_absent`. |
| **Invention de contenu** | Interdit de compléter silencieusement un corpus manquant par inférence ou génération. |
| **Index parallèle catalogue** | Interdit de porter l'index recherche dans `library.json` ou le manifest. |

---

## 16. Considérations futures

Ces interfaces sont **prévues** ; leur implémentation **N'EST PAS** définie ici.

### 16.1 Préchauffage de l'index

Une implémentation **PEUT** construire ou rafraîchir l'index à l'ouverture du chapitre, après installation, ou en tâche de fond — **sans** modifier les invariants de pureté du Service, le modèle SearchHit, l'ordonnancement ni le périmètre Release ouverte.

### 16.2 Index build-time (Fabrique)

La Fabrique **PEUT** un jour produire un sidecar d'index déclaré par le manifest. Tant qu'il n'est pas normé par [contrat 04](../04-CHAPTER-PACKAGE.md), Local Search **NE DOIT PAS** en dépendre en V1. Une future norme **DEVRA** préserver le déterminisme et le manifest comme autorité.

### 16.3 PDR-G4 — Recherche globale

Une recherche multi-Releases **POURRA** s'appuyer sur `library.json` comme inventaire — hors périmètre V1 ; **NE DOIT PAS** être implémentée comme extension implicite de Local Search V1.

---

## 17. Place dans la hiérarchie

### 17.1 Documents qui priment

En cas de conflit, priment dans cet ordre :

1. les ADR applicables ;
2. les contrats fondamentaux [01](../01-TRUST-AND-FIDELITY.md) à [09](../09-CLINICAL-SCENARIO.md), en particulier [04](../04-CHAPTER-PACKAGE.md), [06](../06-RENDERER-AND-LEARNER-LAYER.md) et [08](../08-RELEASE-EDITORIAL-ARCHITECTURE.md) ;
3. [PDR-D6](../../governance/PRODUCT-DECISION-REGISTRY.md).

Ce contrat **NE DOIT PAS** contredire un document supérieur.

### 17.2 Documents sur lesquels il prime

Ce contrat **prime** sur :

- la documentation technique Reader relative à la recherche locale ;
- les plans d'implantation et le code d'indexation, de cache et de requête ;
- toute description qui confondrait index dérivé et contenu publié, ou recherche locale et recherche globale.

### 17.3 Relations avec les contrats composants voisins

| Contrat | Relation |
|---|---|
| [`LIBRARY-CATALOG-CONTRACT.md`](LIBRARY-CATALOG-CONTRACT.md) | Identité Release ; Package Access ; pas d'index recherche catalogue |
| [`OFFLINE-COMPONENT-CONTRACT.md`](OFFLINE-COMPONENT-CONTRACT.md) | Artefacts disponibles offline ; indépendance certification / index recherche |
| [`LEARNER-PATRIMONY-COMPONENT-CONTRACT.md`](LEARNER-PATRIMONY-COMPONENT-CONTRACT.md) | Index dérivé non patrimonial ; §11.6 |
| [`RENDERER-COMPONENT-CONTRACT.md`](RENDERER-COMPONENT-CONTRACT.md) | Reader consomme SearchHit ; ne reconstruit pas snippets |
| [`COMPOSITION-COMPONENT-CONTRACT.md`](COMPOSITION-COMPONENT-CONTRACT.md) | Indépendante ; fournit `viewId` et disponibilités |

Ce contrat **NE DOIT PAS** modifier la Composition Specification, le Composition Engine, le Reading View Model, `library.json`, le graphe offline stabilisé, ni les obligations patrimoniales stabilisées.

---

## 18. Invariants

| ID | Invariant |
|---|---|
| **LS-01** | Toute recherche V1 est limitée à la Release ouverte identifiée par `release_id`. |
| **LS-02** | Seuls les artefacts déclarés par le manifest publié sont indexables — jamais un scan libre. |
| **LS-03** | L'index est dérivé, reconstructible et jamais source d'autorité. |
| **LS-04** | Local Search ne produit, ne modifie ni n'édite jamais de contenu publié. |
| **LS-05** | Les SVG publiés ne sont jamais une source textuelle d'autorité pour l'index. |
| **LS-06** | Seules les vues effectivement publiées produisent des SearchHit. |
| **LS-07** | Les SearchHit incluent snippets calculés par Local Search — le Reader ne les reconstruit pas. |
| **LS-08** | L'ordonnancement des résultats est entièrement déterministe selon Vue → Projection → Document → Offset. |
| **LS-09** | Local Search ne dépend pas du patrimoine apprenant pour indexer ou interroger. |
| **LS-10** | L'index recherche n'est ni patrimonial ni certifiant pour l'offline. |
| **LS-11** | Le Local Search Service reste pur — sans I/O ni DOM. |
| **LS-12** | Local Search accède au contenu publié uniquement via Package Access. |
| **LS-13** | Aucune recherche multi-Release, globale, sémantique ou IA n'est autorisée en V1. |
| **LS-14** | À entrées identiques, index et résultats sont reproductibles. |

---

## 19. Critères de conformité

Un composant Local Search est conforme à ce contrat lorsque :

1. **Périmètre Release** — toute requête est scoped par `release_id` de la Release ouverte ; aucune agrégation multi-Release.
2. **Manifest-only** — l'indexation s'appuie exclusivement sur artefacts déclarés lus via Package Access.
3. **Pureté Service** — construction d'index, requête, validation cache et production SearchHit sont testables sans I/O dans le Local Search Service.
4. **Déterminisme** — ordonnancement Vue → Projection → Document → Offset ; reproductibilité vérifiable en tests.
5. **SVG** — aucune extraction textuelle depuis SVG ; seul `alt` manifest autorisé.
6. **Vues** — aucun SearchHit pour vues non publiées.
7. **Snippets** — extraits produits par Local Search ; Reader consommateur passif.
8. **Patrimoine** — index absent du Learner Snapshot ; pas de dépendance aux données apprenant.
9. **Offline** — recherche exécutable sans réseau lorsque artefacts localement accessibles ; index non confondu avec certification offline.
10. **Interdits** — aucune recherche globale, sémantique, IA, scan filesystem, ni modification de package.
11. **Indépendance technique** — les critères 1–10 restent vérifiables sans supposer IndexedDB, un format de cache particulier ou une bibliothèque de surlignage.

---

## 20. Hors périmètre documentaire

Relèvent d'autres documents — **non tranchés ici** :

- algorithmes détaillés de tokenisation et normalisation Unicode ;
- structure binaire ou JSON du cache IndexedDB ;
- design UI du panneau de recherche, raccourcis clavier, accessibilité détaillée ;
- politique exacte de commit session après navigation recherche ;
- index build-time Fabrique ;
- tests de performance et budgets temps sur chapitre 234 ;
- propagation doc 14 / doc 15.

---

## 21. Documents connexes

| Document | Rôle |
|---|---|
| [PDR-D6](../../governance/PRODUCT-DECISION-REGISTRY.md) | Décision produit — recherche textuelle locale V1 |
| [PDR-G4](../../governance/PRODUCT-DECISION-REGISTRY.md) | Recherche globale — hors V1 |
| [Contrat 04](../04-CHAPTER-PACKAGE.md) | Chapter Package ; manifest ; artefacts déclarés |
| [Contrat 06](../06-RENDERER-AND-LEARNER-LAYER.md) | Renderer ; immutabilité ; couche apprenant |
| [Contrat 07](../07-ASSESSMENT-QUESTION.md) | Questions indexables |
| [Contrat 09](../09-CLINICAL-SCENARIO.md) | Scénarios indexables |
| [`LIBRARY-CATALOG-CONTRACT.md`](LIBRARY-CATALOG-CONTRACT.md) | Catalogue ; Package Access ; identité Release |
| [`OFFLINE-COMPONENT-CONTRACT.md`](OFFLINE-COMPONENT-CONTRACT.md) | Offline ; périmètre artefacts ; indépendance index |
| [`LEARNER-PATRIMONY-COMPONENT-CONTRACT.md`](LEARNER-PATRIMONY-COMPONENT-CONTRACT.md) | Données dérivées §5.4 ; interface §11.6 |
| [`RENDERER-COMPONENT-CONTRACT.md`](RENDERER-COMPONENT-CONTRACT.md) | Reader ; Package Access ; présentation |
| [`COMPOSITION-COMPONENT-CONTRACT.md`](COMPOSITION-COMPONENT-CONTRACT.md) | Vues cognitives ; disponibilité |
| [PDR-D4](../../governance/PRODUCT-DECISION-REGISTRY.md) | Reprise session — compatibilité ancres |

---

*Contrat composant Local Search — en vigueur depuis clôture D6-G (2026-08-01).*
