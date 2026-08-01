# Learner Patrimony Component Contract

| | |
|---|---|
| **Type** | Contrat composant normatif |
| **Statut** | En vigueur |
| **Composant** | Patrimoine des données apprenantes (Learner Patrimony) |
| **Décisions produit** | [PDR-E1](../../governance/PRODUCT-DECISION-REGISTRY.md)–[PDR-E6](../../governance/PRODUCT-DECISION-REGISTRY.md) |
| **ADR associé** | [ADR-006](../../adr/ADR-006-pedagogical-patrimony-and-edition-lineage.md) §1, §3, §6 |
| **Index** | [`../00-INDEX.md`](../00-INDEX.md) · [`00-INDEX.md`](00-INDEX.md) |

Ce document définit les **obligations durables** du **patrimoine des données apprenantes** de Lou Médecine : persistance locale, ancrage à une Release, export, import et conservation des orphelins. Il spécialise [ADR-006](../../adr/ADR-006-pedagogical-patrimony-and-edition-lineage.md) et les contrats fondamentaux pour ce composant. Il ne redéfinit pas le contenu médical d'une Release, ne spécifie pas de technologie de stockage particulière et n'introduit aucune décision médicale nouvelle.

---

## 1. Objectif

Le patrimoine apprenant **DOIT** garantir la **préservation**, l'**identité** et la **portabilité** des données d'apprentissage de l'apprenant — distinctes des sources de production et des Chapter Packages publiés.

Les données d'apprentissage **NE SONT PAS** reproductibles depuis les sources éditoriales. Leur perte **EST** inacceptable ([PDR-E1](../../governance/PRODUCT-DECISION-REGISTRY.md), [ADR-006](../../adr/ADR-006-pedagogical-patrimony-and-edition-lineage.md) §1).

En mode produit, toute donnée patrimoniale liée à un acte d'étude sur contenu publié **DOIT** référencer une **Release identifiée** — jamais le seul identifiant de chapitre ([contrat 02](../02-IDENTITY-AND-ANCHORS.md) §11.1, [ADR-006](../../adr/ADR-006-pedagogical-patrimony-and-edition-lineage.md) §3).

---

## 2. Périmètre

### 2.1 Inclus

| Domaine | Couverture |
|---|---|
| **Patrimoine protégé** | Catégories de données apprenantes soumises aux règles E1–E6 |
| **Portée** | Release-scoped, globale application, dérivée, temporaire |
| **Identité** | `release_id`, `record_id`, `schema_version` |
| **Persistance locale** | Obligations de conservation, séparation des cycles de vie |
| **Export** | Learner Snapshot — rôle et garanties |
| **Import** | Obligations de non-perte silencieuse, traçabilité, idempotence |
| **Orphelins** | Statut normatif et conservation |
| **Frontières** | Séparation Library Catalog, Offline, Composition, Renderer |
| **Interfaces conceptuelles** | Reader, bibliothèque, offline, reprise de session, préférences |

### 2.2 Exclus

| Domaine | Autorité |
|---|---|
| Catalogue, installation, Package Access | [`LIBRARY-CATALOG-CONTRACT.md`](LIBRARY-CATALOG-CONTRACT.md) |
| Mode hors ligne, `offline_status`, disponibilité locale certifiée | [`OFFLINE-COMPONENT-CONTRACT.md`](OFFLINE-COMPONENT-CONTRACT.md) |
| Composition des vues cognitives | [`COMPOSITION-COMPONENT-CONTRACT.md`](COMPOSITION-COMPONENT-CONTRACT.md) |
| Présentation DOM, immutabilité affichée, mécanismes d'ancrage CaretAnchor | [`RENDERER-COMPONENT-CONTRACT.md`](RENDERER-COMPONENT-CONTRACT.md), [contrat 06](../06-RENDERER-AND-LEARNER-LAYER.md) |
| Contenu médical, manifest, artefacts déclarés | [Contrat 04](../04-CHAPTER-PACKAGE.md), [contrat 08](../08-RELEASE-EDITORIAL-ARCHITECTURE.md) |
| Intégrité de publication (`content_digest`) | [`LIBRARY-CATALOG-CONTRACT.md`](LIBRARY-CATALOG-CONTRACT.md) §5.5, [contrat 04](../04-CHAPTER-PACKAGE.md) |
| Sync multi-appareils automatique | [PDR-D3](../../governance/PRODUCT-DECISION-REGISTRY.md) — hors V1 |
| Recherche globale multi-packages | [PDR-G4](../../governance/PRODUCT-DECISION-REGISTRY.md) — hors V1 |
| Format physique du Learner Snapshot, moteur de stockage, schéma de persistance | Documentation technique et implémentation |
| Politique de fusion à l'import, résolution de conflits, parcours utilisateur | Implémentation — hors contrat |

### 2.3 Mode développement

Un mode de développement **PEUT** persister des données apprenantes sans contexte Release complet. Ce mode **NE DOIT PAS** être présenté comme la cible produit ni invoqué pour valider la conformité patrimoniale V1.

En mode produit, la conformité **DOIT** être évaluable exclusivement lorsque le Reader opère sur une bibliothèque installée conforme au [`LIBRARY-CATALOG-CONTRACT.md`](LIBRARY-CATALOG-CONTRACT.md).

---

## 3. Architecture générale

### 3.1 Chaîne obligatoire

```
Fabrique → Release publiée
        ↓  installation
Bibliothèque locale (catalogue + packages installés)
        ↓  Package Access
Reader (Composition → Reading View Model → Renderer)
        ↕  persistance / restauration
Patrimoine apprenant (données d'apprentissage locales)
```

Le patrimoine apprenant **NE PARTICIPE PAS** à la chaîne d'accès au contenu publié. Il **SE SUPERPOSE** à l'expérience d'étude ([contrat 06](../06-RENDERER-AND-LEARNER-LAYER.md) §9).

### 3.2 Responsabilités

| Acteur | DOIT | NE DOIT PAS |
|---|---|---|
| **Patrimoine apprenant** | Persister, ancrer, exporter, importer et conserver les données d'apprentissage ; signaler les orphelins ; garantir zéro perte silencieuse | Modifier le contenu médical ; certifier l'offline ; composer des vues ; résoudre manifest ou artefacts |
| **Bibliothèque** | Porter l'identité Release installée ; conserver les packages publiés | Persister les données apprenantes ; définir leur schéma |
| **Offline** | Certifier la disponibilité locale du contenu publié | Posséder les données apprenantes ; ancrer les tentatives QCM |
| **Package Access** | Résoudre manifest et artefacts déclarés | Lire ou écrire le patrimoine apprenant |
| **Composition** | Produire le Reading View Model | Persister la couche apprenante |
| **Renderer** | Restaurer et fusionner les données apprenantes **à l'affichage** ; déclencher persistance via le patrimoine apprenant | Devenir l'autorité du stockage ; modifier le package publié ; confondre affichage et autorité officielle |
| **Fabrique** | Produire et identifier les Releases publiées | Écrire ou restaurer des données apprenantes |

### 3.3 Trois patrimoines

Conformément à [ADR-006](../../adr/ADR-006-pedagogical-patrimony-and-edition-lineage.md) §1 et [PDR-E2](../../governance/PRODUCT-DECISION-REGISTRY.md) :

| Patrimoine | Nature | Autorité composant |
|---|---|---|
| **Sources de production** | Reconstruisibles | Hors périmètre |
| **Chapter Packages publiés** | Référence d'étude versionnée | [`LIBRARY-CATALOG-CONTRACT.md`](LIBRARY-CATALOG-CONTRACT.md) |
| **Données d'apprentissage** | Non reproductibles | **Ce contrat** |

Ces trois catégories **NE DOIVENT JAMAIS** être confondues dans le cycle de vie, le stockage ou la persistance.

---

## 4. Patrimoine protégé

Les catégories suivantes **APPARTIENNENT** au patrimoine utilisateur protégé ([PDR-E6](../../governance/PRODUCT-DECISION-REGISTRY.md)) :

| Catégorie | Rôle patrimonial |
|---|---|
| **Annotations de walkthrough** | Surlignages, notes CaretAnchor, formatage inline sur texte officiel |
| **Diagrammes personnels** | Schémas ou images ancrés à un élément pédagogique |
| **Historique QCM** | Tentatives, réponses et états visuels par item d'évaluation ([contrat 07](../07-ASSESSMENT-QUESTION.md) I-13) |
| **Progression de scénarios cliniques** | Complétion et historique de parcours par scénario ([contrat 09](../09-CLINICAL-SCENARIO.md) S-13) |
| **Maîtrise conceptuelle** | Marqueurs de progression ancrés à un point de connaissance dans une Release ([contrat 02](../02-IDENTITY-AND-ANCHORS.md) §11.1) |
| **Reprise de session** | Dernier contexte d'étude restaurable ([PDR-D4](../../governance/PRODUCT-DECISION-REGISTRY.md)) |
| **Préférences d'affichage** | Paramètres de confort persistés ([PDR-D7](../../governance/PRODUCT-DECISION-REGISTRY.md)) |
| **Orphelins** | Enregistrements dont la Release ou l'ancrage structurel ne résout plus — **conservés**, jamais effacés silencieusement |

Les catégories futures compatibles avec [PDR-E6](../../governance/PRODUCT-DECISION-REGISTRY.md) et [ADR-006](../../adr/ADR-006-pedagogical-patrimony-and-edition-lineage.md) §6 **PEUVENT** être ajoutées par amendement explicite de ce contrat — jamais par extension implicite de l'implémentation.

---

## 5. Portée des données

### 5.1 Données liées à une Release

Toute donnée décrivant un **acte d'étude** ou une **trace d'interaction** avec le contenu publié d'une Release **DOIT** être **Release-scoped** : elle **DOIT** référencer une `release_id` identifiant la version précise du Chapter Package publié sur laquelle la donnée a été créée ou s'applique.

S'appliquent notamment : annotations, historique QCM, progression de scénarios, maîtrise conceptuelle.

| Règle | Énoncé |
|---|---|
| **Nouvelle Release** | Une nouvelle publication produit une **nouvelle** `release_id` ; les données existantes **RESTENT** attachées à la Release d'origine ([ADR-006](../../adr/ADR-006-pedagogical-patrimony-and-edition-lineage.md) §3). |
| **Archivage catalogue** | L'archivage d'une Release **NE DOIT PAS** entraîner la perte silencieuse de ses données apprenantes. |
| **Coexistence** | Plusieurs Releases d'un même chapitre **DOIVENT** disposer d'espaces patrimoniaux **distincts**. |

### 5.2 Données globales à l'application

Les données décrivant l'**apparence** ou le **comportement du Reader** indépendamment d'une Release **PEUVENT** être globales.

S'appliquent notamment : préférences d'affichage ([PDR-D7](../../governance/PRODUCT-DECISION-REGISTRY.md)).

| Règle | Énoncé |
|---|---|
| **Indépendance offline** | Les préférences persistées **DOIVENT** rester disponibles sans connexion réseau, indépendamment du statut offline d'une Release ([`OFFLINE-COMPONENT-CONTRACT.md`](OFFLINE-COMPONENT-CONTRACT.md) §11.3). |
| **Non-médical** | Les préférences **NE DOIVENT PAS** modifier le contenu pédagogique officiel. |

### 5.3 Données hybrides

La **reprise de session** ([PDR-D4](../../governance/PRODUCT-DECISION-REGISTRY.md)) **DOIT** être persistée comme contexte **global** **pointant vers** une `release_id`, une vue cognitive et un point de reprise dans le contenu — sans fusionner session et contenu publié.

| Règle | Énoncé |
|---|---|
| **Pointeur Release** | La reprise **DOIT** identifier la Release étudiée par `release_id`. |
| **Continuité offline** | La reprise offline du **contenu publié** **DOIT** s'appuyer sur une Release dont la disponibilité locale est certifiée lorsque l'étude hors ligne est requise ([`OFFLINE-COMPONENT-CONTRACT.md`](OFFLINE-COMPONENT-CONTRACT.md) §11.2). |
| **Store session** | Le magasin de reprise **RESTE** local et indépendant de la certification offline. |

### 5.4 Données dérivées

Les index, caches ou structures **reconstruisibles** à partir du contenu publié d'une Release installée **NE SONT PAS** patrimoniales.

| Exemple | Statut |
|---|---|
| Index de recherche locale sur le chapitre ouvert ([PDR-D6](../../governance/PRODUCT-DECISION-REGISTRY.md)) | Dérivé — régénérable |
| Warm cache navigateur | Hors patrimoine — [`OFFLINE-COMPONENT-CONTRACT.md`](OFFLINE-COMPONENT-CONTRACT.md) §3.1 |

Le patrimoine apprenant **NE DOIT PAS** être requis pour reconstruire un index dérivé.

### 5.5 Données temporaires

L'état UI **éphémère** de session — modales, focus, scroll non commité comme point de reprise — **N'APPARTIENT PAS** au patrimoine protégé ([PDR-D4](../../governance/PRODUCT-DECISION-REGISTRY.md)).

| Règle | Énoncé |
|---|---|
| **Non-persistance implicite** | Aucun état temporaire **NE DOIT** être promu patrimonial sans obligation explicite de ce contrat ou d'un contrat fondamental. |
| **Distinction affichage** | La fusion à l'affichage **NE DOIT PAS** devenir une autorité officielle persistée ([contrat 06](../06-RENDERER-AND-LEARNER-LAYER.md) §9.2). |

---

## 6. Identité

### 6.1 `release_id`

| Règle | Énoncé |
|---|---|
| **Rôle** | Identité **canonique d'appartenance** de toute donnée patrimoniale Release-scoped. |
| **Origine** | Portée par le manifest publié et le catalogue installé ([`LIBRARY-CATALOG-CONTRACT.md`](LIBRARY-CATALOG-CONTRACT.md) §5). |
| **Obligation** | Toute écriture patrimoniale Release-scoped **DOIT** référencer une `release_id` valide au sens catalogue. |
| **Interdit** | Ancrer patrimonialement au seul identifiant de chapitre, slug ou chemin de package. |

### 6.2 `record_id`

| Règle | Énoncé |
|---|---|
| **Rôle** | Identité **intrinsèque** d'un enregistrement patrimonial au sein d'une installation. |
| **Stabilité** | Un `record_id` **DOIT** rester stable tant que l'enregistrement existe. |
| **Import** | L'import **DOIT** pouvoir reconnaître un enregistrement par son `record_id` pour garantir l'idempotence (§8.3). |

### 6.3 `schema_version`

| Règle | Énoncé |
|---|---|
| **Rôle** | Version **sémantique** d'un enregistrement ou du magasin patrimonial — compatibilité et évolution. |
| **Migration** | Toute évolution de schéma **DOIT** préserver les données compatibles ; aucune migration **NE DOIT** supprimer silencieusement des enregistrements patrimoniaux ([PDR-E1](../../governance/PRODUCT-DECISION-REGISTRY.md)). |

### 6.4 Identifiants pédagogiques secondaires

Selon la nature de la donnée, des identifiants structurels **complètent** — sans remplacer — la `release_id` ([contrat 02](../02-IDENTITY-AND-ANCHORS.md) §11.1) :

| Nature | Ancrage secondaire |
|---|---|
| Annotations walkthrough | Élément pédagogique ; ancre textuelle |
| Historique QCM | `question_id` |
| Scénario clinique | `scenario_id` |
| Maîtrise conceptuelle | Identifiant de point de connaissance |

### 6.5 `content_digest` — hors patrimoine apprenant

| Règle | Énoncé |
|---|---|
| **Rôle exclusif** | Empreinte d'**intégrité de publication** du Chapter Package publié. |
| **Autorité** | Fabrique, manifest, vérification bibliothèque et offline. |
| **Interdit** | Utiliser `content_digest` comme clé d'appartenance, d'ancrage ou de regroupement des données apprenantes. |
| **Divergence** | Une divergence de digest **NE DOIT PAS** réassigner silencieusement les données apprenantes à une autre identité Release. |

### 6.6 Champs dénormalisés

Des champs tels que le slug de chapitre **PEUVENT** être conservés à des fins de commodité. Ils **NE DOIVENT PAS** remplacer la `release_id` comme autorité patrimoniale.

---

## 7. Persistance locale

### 7.1 Séparation des cycles de vie

| Donnée | Cycle de vie | Autorité |
|---|---|---|
| **Contenu officiel (Release)** | Versionné ; archivage explicite ; jamais écrasé silencieusement | Bibliothèque / Fabrique |
| **Données apprenantes** | Propres à l'apprenant ; ancrées Release + cible | **Patrimoine apprenant** |

### 7.2 Obligations de conservation

| Règle | Énoncé |
|---|---|
| **Zéro perte silencieuse** | Aucune opération patrimoniale — persistance, migration, import, purge — **NE DOIT** supprimer silencieusement un enregistrement protégé ([PDR-E1](../../governance/PRODUCT-DECISION-REGISTRY.md)). |
| **Indépendance offline** | Les données apprenantes déjà persistées pour une `release_id` **DOIVENT** rester accessibles indépendamment du statut offline du contenu publié ([`OFFLINE-COMPONENT-CONTRACT.md`](OFFLINE-COMPONENT-CONTRACT.md) §8.3). |
| **Non-fusion officielle** | Aucune donnée apprenante persistée **NE DEVIENT** une autorité du contenu médical officiel. |

### 7.3 Restauration à l'affichage

Le Reader **DOIT** restaurer les données apprenantes depuis le patrimoine local et les **fusionner à l'affichage** avec le contenu officiel courant ([contrat 06](../06-RENDERER-AND-LEARNER-LAYER.md) §9.2).

Le patrimoine apprenant **FOURNIT** la persistance ; le Renderer **NE DEVIENT PAS** l'autorité du magasin.

---

## 8. Export — Learner Snapshot

### 8.1 Existence et rôle

Un **Learner Snapshot** **DOIT** exister comme artefact d'**export patrimonial** des données d'apprentissage locales ([PDR-E5](../../governance/PRODUCT-DECISION-REGISTRY.md)).

| Règle | Énoncé |
|---|---|
| **Rôle** | Filet de sécurité, portabilité entre installations et pont vers une synchronisation future — sans imposer de sync V1. |
| **Périmètre minimal** | Le Learner Snapshot **DOIT** couvrir l'intégralité du patrimoine apprenant protégé (§4) présent localement. |
| **Indépendance** | Le snapshot **DOIT** être défini indépendamment de tout moteur de persistance particulier. |
| **Non-destructif** | L'export **NE DOIT PAS** supprimer ni altérer le patrimoine source. |

### 8.2 Garanties

| Garantie | Énoncé |
|---|---|
| **Complétude relative** | Tout enregistrement patrimonial local exportable **DOIT** être représenté dans le snapshot. |
| **Identité préservée** | Chaque enregistrement exporté **DOIT** porter au minimum `record_id`, `release_id` lorsque applicable, et `schema_version`. |
| **Intégrité détectable** | Le snapshot **DOIT** permettre de détecter une corruption ou troncature du fichier exporté. |
| **Versionnement** | Le snapshot **DOIT** porter une version de format identifiable — évolution sans ambiguïté. |

### 8.3 Bundle patrimonial étendu

Une sauvegarde patrimoniale **PEUT** coordonner le Learner Snapshot avec le catalogue, les packages installés et la matérialisation offline ([`LIBRARY-CATALOG-CONTRACT.md`](LIBRARY-CATALOG-CONTRACT.md) §11.2, [`OFFLINE-COMPONENT-CONTRACT.md`](OFFLINE-COMPONENT-CONTRACT.md) §11.1).

| Règle | Énoncé |
|---|---|
| **Frontière** | Le Learner Snapshot **RESTE** l'artefact du patrimoine apprenant ; le catalogue et les packages **RESTENT** sous autorité bibliothèque. |
| **Coordination** | Aucun composant **NE DOIT** confondre export learner et export catalogue. |

Le format physique du snapshot et d'un bundle étendu **N'APPARTIENT PAS** à ce contrat.

---

## 9. Import

### 9.1 Obligations générales

| Obligation | Énoncé |
|---|---|
| **Absence de perte silencieuse** | L'import **NE DOIT PAS** supprimer silencieusement des enregistrements patrimoniaux déjà présents localement ([PDR-E1](../../governance/PRODUCT-DECISION-REGISTRY.md), [PDR-E5](../../governance/PRODUCT-DECISION-REGISTRY.md)). |
| **Traçabilité** | Toute opération d'import **DOIT** produire un résultat observable — succès, refus ou avertissements — sans effet invisible. |
| **Idempotence** | Réimporter un snapshot identique **NE DOIT PAS** corrompre ni dupliquer irréversiblement le patrimoine local. |

### 9.2 Release absente

| Règle | Énoncé |
|---|---|
| **Conservation** | Les enregistrements importés référencant une `release_id` non installée **DOIVENT** être conservés — jamais rejetés silencieusement. |
| **Orphelins** | L'absence de Release installée **PEUT** conduire au statut orphelin (§10) — pas à la suppression. |

### 9.3 Contenu publié évolutif

| Règle | Énoncé |
|---|---|
| **Stabilité Release** | Les enregistrements **RESTENT** attachés à la `release_id` d'origine. |
| **Résolution honnête** | Si une ancre structurelle ne résout plus à l'affichage, l'enregistrement **DOIT** être signalé — conformément au §10 — jamais effacé silencieusement ([contrat 06](../06-RENDERER-AND-LEARNER-LAYER.md), [ADR-005](../../adr/ADR-005-learner-layer-annotation-anchoring.md)). |

La politique de fusion, de priorité entre versions concurrentes et de parcours utilisateur **RELEVANT** de l'implémentation — **PAS** de ce contrat.

---

## 10. Orphelins

### 10.1 Définition

Un **orphelin** est un enregistrement patrimonial dont :

- la `release_id` référencée n'est plus installée ou accessible au catalogue ; **ou**
- l'ancrage structurel au contenu publié ne peut plus être résolu à l'affichage ; **ou**
- la Release référencée existe mais le contenu ne permet plus la restitution honnête de l'artefact.

### 10.2 Statut normatif

| Règle | Énoncé |
|---|---|
| **Conservation** | Un orphelin **DOIT** être **conservé** — jamais supprimé silencieusement ([ADR-006](../../adr/ADR-006-pedagogical-patrimony-and-edition-lineage.md) §3, [contrat 02](../02-IDENTITY-AND-ANCHORS.md) §10.5). |
| **Signalisation** | Un orphelin **DOIT** être **signalé** à l'apprenant ou à un diagnostic explicite — jamais masqué comme succès nominal. |
| **Réversibilité** | L'installation ultérieure de la Release référencée **DOIT** permettre la promotion de l'enregistrement vers un état actif, sous réserve de résolution d'ancrage. |
| **Indépendance représentation** | Ce contrat **NE FIXE PAS** la structure interne du registre d'orphelins. |

### 10.3 Purge et opérations destructives

Toute suppression explicite d'un enregistrement patrimonial — orphelin ou actif — **DOIT** être une **opération explicite** traçable, jamais un effet de bord d'import, de migration ou d'archivage catalogue.

---

## 11. Interfaces conceptuelles

Ces interfaces décrivent des **obligations de frontière** — pas des signatures techniques.

### 11.1 Reader

| Interface | Obligation |
|---|---|
| **Persistance** | Le Reader **DOIT** déléguer la persistance patrimoniale au composant Patrimoine apprenant — ne pas implémenter un magasin parallèle non gouverné. |
| **Restauration** | Le Reader **DOIT** consommer le patrimoine pour restaurer les overlays apprenants à l'affichage. |
| **Contexte Release** | En mode produit, toute écriture Release-scoped **DOIT** recevoir la `release_id` du contexte d'étude courant. |

### 11.2 Bibliothèque (Library Catalog)

| Interface | Obligation |
|---|---|
| **Identité Release** | Le patrimoine apprenant **DOIT** utiliser les `release_id` portées par le catalogue installé — jamais les inventer. |
| **Séparation** | La bibliothèque **NE DOIT PAS** écrire dans le patrimoine apprenant. |
| **Bundle étendu** | Une restauration catalogue **PEUT** être coordonnée avec un import Learner Snapshot — sans fusion des autorités. |

### 11.3 Offline

| Interface | Obligation |
|---|---|
| **Indépendance** | Le statut `offline_status` **NE CONDITIONNE PAS** la persistance ni la lecture du patrimoine apprenant déjà local. |
| **Reprise offline** | La reprise de session sur contenu publié **DOIT** respecter les exigences offline lorsque l'étude hors ligne est requise (§5.3). |
| **Ancrage commun** | Offline et patrimoine apprenant **PARTAGENT** l'exigence `release_id` — sans partager de magasin. |

### 11.4 Composition

| Interface | Obligation |
|---|---|
| **Indépendance** | La Composition **NE DOIT PAS** dépendre du patrimoine apprenant pour produire le Reading View Model. |
| **Identifiants de vues** | La reprise de session **PEUT** référencer les identifiants de vues cognitives produits par la Composition — sans couplage de persistance. |

### 11.5 Reprise de session (PDR-D4)

| Interface | Obligation |
|---|---|
| **Persistance** | Le patrimoine apprenant **DOIT** porter le contexte de reprise : Release, vue, point de reprise. |
| **Exclusion** | L'état UI éphémère **NE DOIT PAS** être confondu avec la reprise patrimoniale. |

### 11.6 Recherche locale (PDR-D6)

| Interface | Obligation |
|---|---|
| **Non-ingérence** | Le patrimoine apprenant **NE DOIT PAS** être requis pour indexer le contenu publié d'une Release ouverte. |
| **Compatibilité** | Le modèle Release-scoped **NE DOIT PAS** empêcher une recherche locale limitée au chapitre ouvert. |

### 11.7 Préférences d'affichage (PDR-D7)

| Interface | Obligation |
|---|---|
| **Persistance globale** | Le patrimoine apprenant **DOIT** porter les préférences d'affichage V1. |
| **Export / import** | Les préférences **DOIVENT** être incluses dans le Learner Snapshot. |

---

## 12. Comportements interdits

| Interdit | Précision |
|---|---|
| **Patrimoine sans Release** | Interdit de persister patrimonialement une donnée d'étude sur contenu publié sans `release_id` en mode produit. |
| **Suppression silencieuse** | Interdit de supprimer, fusionner ou écraser des enregistrements protégés sans traçabilité explicite. |
| **Confusion patrimoines** | Interdit de stocker des données apprenantes dans le catalogue, le manifest ou les artefacts publiés. |
| **Digest comme clé learner** | Interdit d'ancrer ou regrouper le patrimoine apprenant par `content_digest`. |
| **Chapitre seul** | Interdit de faire du slug de chapitre l'autorité patrimoniale unique. |
| **Reader = autorité stockage** | Interdit au Renderer de devenir le magasin patrimonial sans composant gouverné. |
| **Offline = learner store** | Interdit au composant Offline de posséder ou certifier des données apprenantes. |
| **Export destructif** | Interdit à l'export d'altérer le patrimoine source. |
| **Import aveugle** | Interdit à l'import de produire un état local sans résultat observable. |
| **Orphelin effacé** | Interdit de supprimer silencieusement un orphelin lors d'archivage, purge offline ou import. |
| **Dérivé patrimonialisé** | Interdit de traiter un index reconstruisible comme patrimoine protégé obligatoire. |

---

## 13. Place dans la hiérarchie

### 13.1 Documents qui priment

En cas de conflit, priment dans cet ordre :

1. les ADR applicables, notamment [ADR-006](../../adr/ADR-006-pedagogical-patrimony-and-edition-lineage.md) ;
2. les contrats fondamentaux [01](../01-TRUST-AND-FIDELITY.md) à [09](../09-CLINICAL-SCENARIO.md), en particulier [02](../02-IDENTITY-AND-ANCHORS.md) §11.1, [06](../06-RENDERER-AND-LEARNER-LAYER.md) §9, [07](../07-ASSESSMENT-QUESTION.md) I-13 et [09](../09-CLINICAL-SCENARIO.md) S-13.

Ce contrat **NE DOIT PAS** contredire un document supérieur.

### 13.2 Documents sur lesquels il prime

Ce contrat **prime** sur :

- la documentation technique Reader relative à la persistance apprenante ;
- les plans d'implantation et le code du magasin local, de l'export et de l'import ;
- toute description qui confondrait patrimoine packages et patrimoine apprenant.

### 13.3 Relations avec les contrats composants voisins

| Contrat | Relation |
|---|---|
| [`LIBRARY-CATALOG-CONTRACT.md`](LIBRARY-CATALOG-CONTRACT.md) | Identité Release installée ; bundle patrimonial étendu optionnel |
| [`OFFLINE-COMPONENT-CONTRACT.md`](OFFLINE-COMPONENT-CONTRACT.md) | Partage l'exigence `release_id` ; indépendance du magasin learner |
| [`RENDERER-COMPONENT-CONTRACT.md`](RENDERER-COMPONENT-CONTRACT.md) | Renderer consomme et affiche ; patrimoine persiste |
| [`COMPOSITION-COMPONENT-CONTRACT.md`](COMPOSITION-COMPONENT-CONTRACT.md) | Indépendante du patrimoine apprenant |

Ce contrat **NE DOIT PAS** modifier la Composition Specification, le Composition Engine, le Reading View Model, le catalogue `library.json`, ni les obligations offline stabilisées par [`OFFLINE-COMPONENT-CONTRACT.md`](OFFLINE-COMPONENT-CONTRACT.md).

---

## 14. Invariants

| ID | Invariant |
|---|---|
| **LP-01** | Toute donnée patrimoniale liée à un acte d'étude sur contenu publié référence une `release_id` — jamais le seul chapitre. |
| **LP-02** | Aucune suppression silencieuse d'enregistrement patrimonial protégé. |
| **LP-03** | Les trois patrimoines (sources, packages publiés, données apprenantes) restent distincts dans le cycle de vie et le stockage. |
| **LP-04** | `content_digest` n'est jamais une clé patrimoniale apprenante. |
| **LP-05** | Un Learner Snapshot exportable couvre l'intégralité du patrimoine apprenant local protégé. |
| **LP-06** | L'import est traçable, idempotent sur snapshot identique, et sans perte silencieuse du patrimoine local. |
| **LP-07** | Les orphelins sont conservés et signalés — jamais effacés silencieusement. |
| **LP-08** | Les données apprenantes restent accessibles indépendamment du statut offline du contenu publié. |
| **LP-09** | Aucune donnée apprenante persistée ne devient autorité du contenu médical officiel. |
| **LP-10** | Le patrimoine apprenant est indépendant du moteur de persistance et du format physique du snapshot. |

---

## 15. Critères de conformité

Un composant est conforme à ce contrat lorsque :

1. **Séparation** — le patrimoine apprenant est distinct du catalogue, de l'offline et du contenu publié ; aucune donnée protégée n'est stockée dans le manifest ou les artefacts déclarés.
2. **Ancrage Release** — en mode produit, toute écriture Release-scoped porte une `release_id` catalogue ; aucun ancrage patrimonial au seul chapitre.
3. **Couverture E6** — les catégories §4 sont persistables, exportables et restaurables via le Learner Snapshot — catégories vides admises si non encore produites par l'UI, dès lors que le schéma les accueille sans contournement.
4. **Export** — un Learner Snapshot complet, versionné et vérifiable peut être produit sans altérer le magasin source.
5. **Import** — un import produit un résultat observable ; ne supprime pas silencieusement le patrimoine local ; réimporter un snapshot identique ne corrompt pas le magasin.
6. **Orphelins** — les enregistrements non résolus sont conservés et signalés ; l'installation ultérieure de la Release référencée permet leur réactivation.
7. **Préférences et session** — D7 et D4 sont persistés conformément aux §5.2 et §5.3 ; préférences globales ; reprise pointant vers une `release_id`.
8. **Frontières** — le Renderer délègue la persistance ; la Composition reste indépendante ; l'Offline ne possède pas le patrimoine apprenant.
9. **Digest** — aucune clé patrimoniale n'utilise `content_digest`.
10. **Indépendance technique** — les critères 1–9 restent vérifiables sans supposer IndexedDB, un format JSON particulier ou une structure de collection imposée par ce contrat.

---

## 16. Documents connexes

| Document | Rôle |
|---|---|
| [PDR-E1](../../governance/PRODUCT-DECISION-REGISTRY.md)–[PDR-E6](../../governance/PRODUCT-DECISION-REGISTRY.md) | Décisions produit — patrimoine et données |
| [PDR-D4](../../governance/PRODUCT-DECISION-REGISTRY.md), [PDR-D7](../../governance/PRODUCT-DECISION-REGISTRY.md) | Reprise session ; préférences — interfaces §11 |
| [ADR-006](../../adr/ADR-006-pedagogical-patrimony-and-edition-lineage.md) | Trois patrimoines ; ancrage Release ; sauvegarde |
| [ADR-005](../../adr/ADR-005-learner-layer-annotation-anchoring.md) | Ancrage CaretAnchor ; dégradation honnête |
| [Contrat 02](../02-IDENTITY-AND-ANCHORS.md) §11.1 | Ancrage des données d'apprentissage |
| [Contrat 06](../06-RENDERER-AND-LEARNER-LAYER.md) §9 | Persistance locale ; restauration à l'affichage |
| [Contrat 07](../07-ASSESSMENT-QUESTION.md) I-13 | Historique QCM |
| [Contrat 09](../09-CLINICAL-SCENARIO.md) S-13 | Progression scénarios |
| [`LIBRARY-CATALOG-CONTRACT.md`](LIBRARY-CATALOG-CONTRACT.md) | Catalogue ; identité Release ; bundle étendu §11.2 |
| [`OFFLINE-COMPONENT-CONTRACT.md`](OFFLINE-COMPONENT-CONTRACT.md) | Offline ; indépendance learner §8.3 ; interfaces §11 |
| [`RENDERER-COMPONENT-CONTRACT.md`](RENDERER-COMPONENT-CONTRACT.md) | Renderer ; couche apprenant |
| [`COMPOSITION-COMPONENT-CONTRACT.md`](COMPOSITION-COMPONENT-CONTRACT.md) | Composition — indépendante |

---

*Contrat composant Learner Patrimony — Lot E-A — en vigueur.*
