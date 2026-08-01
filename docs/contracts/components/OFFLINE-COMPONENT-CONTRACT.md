# Offline Component Contract

| | |
|---|---|
| **Type** | Contrat composant normatif |
| **Statut** | En vigueur |
| **Composant** | Mode hors ligne Reader (Offline) |
| **Décision produit** | [PDR-D2](../../governance/PRODUCT-DECISION-REGISTRY.md) |
| **ADR associé** | [ADR-006](../../adr/ADR-006-pedagogical-patrimony-and-edition-lineage.md) §6 |
| **Index** | [`../00-INDEX.md`](../00-INDEX.md) · [`00-INDEX.md`](00-INDEX.md) |

Ce document définit les **obligations durables** du **mode hors ligne** de Lou Médecine pour les Releases **installées**. Il spécialise [ADR-006](../../adr/ADR-006-pedagogical-patrimony-and-edition-lineage.md) et le [`LIBRARY-CATALOG-CONTRACT.md`](LIBRARY-CATALOG-CONTRACT.md). Il ne redéfinit pas le contenu médical d'une Release, ne spécifie pas de technologie de cache particulière et n'introduit aucune décision médicale nouvelle.

---

## 1. Objectif

Le mode hors ligne **DOIT** permettre à l'apprenant d'étudier une Release **installée** sans connexion réseau, à partir du patrimoine local déjà présent au catalogue.

L'**offline garanti** est une **propriété certifiée** d'une Release installée — distincte de tout remplissage opportuniste de cache.

En mode produit, les critères d'acceptation du mode hors ligne **DOIVENT** être évalués exclusivement sur une **bibliothèque installée** conforme au [`LIBRARY-CATALOG-CONTRACT.md`](LIBRARY-CATALOG-CONTRACT.md).

---

## 2. Périmètre

### 2.1 Inclus

| Domaine | Couverture |
|---|---|
| **Définition normative** | Offline garanti vs warm cache |
| **Architecture** | Responsabilités Bibliothèque, Package Access, Offline Manager, disponibilité locale certifiée, Reader |
| **Cycle de vie offline** | États, transitions, préparation asynchrone |
| **Granularité** | Périmètre offline d'une Release installée |
| **Identité** | Lien `release_id`, `content_digest`, cache, données apprenantes |
| **Mises à jour** | Installation, archivage, purge |
| **Comportements interdits** | Garanties offline invalides, scan, purge silencieuse |

### 2.2 Exclus

| Domaine | Autorité |
|---|---|
| Format et cycle de vie install du catalogue | [`LIBRARY-CATALOG-CONTRACT.md`](LIBRARY-CATALOG-CONTRACT.md) |
| Contenu médical, manifest, artefacts déclarés | [Contrat 04](../04-CHAPTER-PACKAGE.md), [contrat 08](../08-RELEASE-EDITORIAL-ARCHITECTURE.md) |
| Composition des vues cognitives | [`COMPOSITION-COMPONENT-CONTRACT.md`](COMPOSITION-COMPONENT-CONTRACT.md) |
| Présentation DOM, couche apprenant | [`RENDERER-COMPONENT-CONTRACT.md`](RENDERER-COMPONENT-CONTRACT.md), [contrat 06](../06-RENDERER-AND-LEARNER-LAYER.md) |
| Sauvegarde / restauration | [PDR-E5](../../governance/PRODUCT-DECISION-REGISTRY.md) — interface prévue §11 |
| Reprise de session | [PDR-D4](../../governance/PRODUCT-DECISION-REGISTRY.md) — interface prévue §11 |
| Préférences d'affichage | [PDR-D7](../../governance/PRODUCT-DECISION-REGISTRY.md) — interface prévue §11 |
| Sync multi-appareils | [PDR-D3](../../governance/PRODUCT-DECISION-REGISTRY.md) — hors V1 |
| Installation d'une Release depuis un réseau distant | Hors périmètre offline |

### 2.3 Mode développement

Un mode de développement **PEUT** exister sans garantie offline sur une bibliothèque installée. Ce mode **NE DOIT PAS** être présenté comme la cible produit ni invoqué pour valider le mode hors ligne garanti.

---

## 3. Définition normative de l'offline

### 3.1 Warm cache

Un **warm cache** est un remplissage **opportuniste** du stockage local déclenché par une navigation ou une requête antérieure en ligne.

Un warm cache **NE CONSTITUE PAS** une garantie offline. Aucun composant **NE DOIT** présenter un warm cache comme un mode hors ligne garanti.

### 3.2 Offline garanti

L'**offline garanti** est la propriété d'une Release **installée** dont le statut catalogue `offline_status` vaut **`offline_ready`**.

Pour une Release `offline_ready`, l'étude **DOIT** être intégralement possible sans connexion réseau, sans navigation préalable et sans remplissage opportuniste préalable du cache.

### 3.3 Offline = propriété d'une Release installée

| Règle | Énoncé |
|---|---|
| **Prérequis** | Seule une Release **présente au catalogue** (`library.json`) **PEUT** être `offline_ready`. |
| **Certification** | Seul `offline_ready` **GARANTIT** le fonctionnement hors ligne de cette Release. |
| **Binarité** | Une Release est offline-garantie ou non ; il **N'EXISTE PAS** d'état « partiellement offline » au sens produit. |
| **Contenu éditorial** | Les états `planned` ou absences déclarées d'une Release restent honnêtes offline ; ils **NE CONSTITUENT PAS** un échec offline. |

### 3.4 Périmètre fonctionnel offline garanti

Pour une Release `offline_ready`, sans connexion réseau, **DOIVENT** être disponibles localement :

1. le **manifest** publié de la Release ;
2. l'**intégralité** des artefacts déclarés par ce manifest (§6) ;
3. le **Reader shell** et les ressources statiques nécessaires à l'exécution du Reader sur cette Release ;
4. la **couche apprenante** locale déjà persistée pour cette `release_id`.

### 3.5 Disponibilité locale certifiée

L'obligation normative du mode hors ligne **EST** la **disponibilité locale certifiée** : chaque élément du §3.4 **DOIT** être accessible **sans connexion réseau** via **Package Access** — unique frontière d'accès du Reader au contenu publié.

| Règle | Énoncé |
|---|---|
| **Résultat, pas mécanisme** | Le contrat **NE FIXE PAS** comment la disponibilité locale est matérialisée. |
| **Pas de double copie imposée** | Aucune seconde copie des artefacts installés **N'EST REQUISE** pour satisfaire le contrat. |
| **Shell natif** | Une implémentation **PEUT** servir directement les packages installés sous `packages/<release_id>/`. |
| **Shell avec stockage runtime** | Une implémentation **PEUT** recourir à une couche de stockage local runtime distincte du tree installé. |
| **Équivalence** | Les deux approches **DOIVENT** produire le même résultat observable : accès offline complet via Package Access lorsque `offline_status` vaut `offline_ready`. |

La **couche de stockage local runtime** (§4) **EST** un **moyen d'implémentation optionnel** — jamais une obligation de double matérialisation.

---

## 4. Architecture

### 4.1 Chaîne obligatoire

```
Fabrique (lou-build)
        ↓  publication d'une Release valide
Bibliothèque locale (installation + catalogue)
        ↓  préparation offline asynchrone
Offline Manager
        ↓  certification de la disponibilité locale (§3.5)
[Couche de stockage local runtime — moyen d'implémentation optionnel]
        ↓
Package Access   ← unique frontière d'accès
        ↓
Reader (Composition → Reading View Model → Renderer)
```

### 4.2 Responsabilités

| Acteur | DOIT | NE DOIT PAS |
|---|---|---|
| **Bibliothèque** | Porter `offline_status` dans `library.json` ; déclencher la préparation offline après installation ; conserver les packages archivés | Gérer le rendu ; modifier les artefacts publiés ; inventer un second index offline |
| **Package Access** | Résoudre manifest et artefacts **déclarés** ; produire des références d'accès stables par `release_id` ; constituer l'**unique frontière d'accès** du Reader au contenu publié | Implémenter la préparation offline ; scanner `packages/` ; connaître la stratégie de matérialisation locale |
| **Offline Manager** | Orchestrer la préparation asynchrone ; énumérer les artefacts via Package Access ; vérifier l'intégrité ; certifier la disponibilité locale (§3.5) ; mettre à jour `offline_status` | Interpréter le médical ; composer des vues ; être consommé par la Composition |
| **Couche de stockage local runtime** *(optionnelle)* | **PEUT** matérialiser la disponibilité locale certifiée lorsqu'une implémentation le requiert | Lire `library.json` comme autorité catalogue ; modifier le package installé ; composer des vues ; devenir une seconde frontière d'accès |
| **Reader** | Consommer **uniquement** Package Access ; afficher des états honnêtes ; persister la couche apprenante | Accéder directement au stockage local ou au tree installé ; référencer `LIBRARY_ROOT` ; scanner `packages/` |

### 4.3 Frontières

| Frontière | Règle |
|---|---|
| **Reader ↔ contenu publié** | Le Reader **NE DOIT JAMAIS** accéder directement au tree installé, au stockage local runtime ou à toute matérialisation locale — **uniquement** via Package Access. |
| **Package Access ↔ préparation offline** | Package Access **NE DOIT PAS** implémenter la préparation offline ni choisir la stratégie de matérialisation locale. |
| **Bibliothèque ↔ Offline Manager** | La bibliothèque **DOIT** porter le statut ; l'Offline Manager **DOIT** exécuter la préparation et certifier la disponibilité locale. |
| **Composition ↔ offline** | La Composition **NE DOIT PAS** dépendre du statut offline ni du catalogue. |

---

## 5. Cycle de vie offline

### 5.1 États autorisés

Chaque entrée catalogue **DOIT** porter un champ `offline_status` avec **exactement** l'une des valeurs suivantes :

| Valeur | Signification |
|---|---|
| **`not_prepared`** | Release installée ; préparation offline non démarrée ou non terminée avec succès |
| **`preparing`** | Préparation offline en cours |
| **`offline_ready`** | Offline garanti actif pour cette Release |
| **`failed`** | Dernière préparation offline échouée ou invalidée |

Aucun autre état offline catalogue **N'EST PAS** autorisé.

L'archivage éditorial (`status: active` / `archived`) **RESTE** porté exclusivement par `library.json` conformément au [`LIBRARY-CATALOG-CONTRACT.md`](LIBRARY-CATALOG-CONTRACT.md). Il **NE DOIT PAS** être fusionné avec `offline_status`.

### 5.2 Transitions autorisées

| De | Vers | Condition |
|---|---|---|
| — | `not_prepared` | Installation réussie d'une Release |
| `not_prepared` | `preparing` | Début de préparation offline |
| `failed` | `preparing` | Nouvelle tentative de préparation |
| `preparing` | `offline_ready` | Préparation réussie (§7) |
| `preparing` | `failed` | Préparation interrompue ou invalide (§7) |
| `offline_ready` | `failed` | Invalidation par divergence d'intégrité |
| `offline_ready` | `preparing` | Reprise explicite de préparation (repair) |

Toute autre transition **DOIT** être rejetée ou normalisée vers l'un de ces états.

### 5.3 Source de vérité

`library.json` **EST** l'**unique** source de vérité opérationnelle du statut offline. Aucun fichier d'index offline parallèle **NE DOIT** exister.

---

## 6. Granularité — périmètre offline d'une Release

### 6.1 Contenu obligatoire

Une Release `offline_ready` **DOIT** inclure localement :

| Élément | Périmètre |
|---|---|
| **Manifest** | `manifest.json` de la Release installée |
| **Artefacts déclarés** | Exactement l'ensemble des chemins relatifs **déclarés** par le manifest publié — même périmètre que l'empreinte de publication `content_digest` ([`LIBRARY-CATALOG-CONTRACT.md`](LIBRARY-CATALOG-CONTRACT.md) §5.5, [contrat 04](../04-CHAPTER-PACKAGE.md)) |

### 6.2 Règles d'énumération

| Règle | Énoncé |
|---|---|
| **Manifest-only** | Seuls les artefacts **déclarés** par le manifest **SONT** éligibles à la préparation offline. |
| **Interdit scan** | Aucun scan libre de `packages/<release_id>/` **NE DOIT** compléter, remplacer ou contredire l'énumération manifest. |
| **Interdit partiel certifié** | Une Release **NE DOIT PAS** passer à `offline_ready` si un artefact déclaré manque à la **disponibilité locale certifiée** (§3.5). |

### 6.3 Reader shell

Le Reader shell et les ressources statiques nécessaires à son exécution **DOIVENT** être disponibles localement indépendamment de toute Release, avant toute session offline.

---

## 7. Préparation offline

### 7.1 Déclenchement

| Règle | Énoncé |
|---|---|
| **Asynchrone** | La préparation offline **DOIT** s'exécuter de façon **asynchrone** ; elle **NE DOIT PAS** bloquer la visibilité catalogue d'une installation réussie. |
| **Point d'ancrage** | La préparation offline **DOIT** être déclenchée à l'issue d'une installation réussie, ou par une opération explicite de retry. |
| **Interdit warm cache** | Le remplissage opportuniste du cache **NE DOIT PAS** être utilisé comme mécanisme de certification offline. |

### 7.2 Transition vers `offline_ready`

Une Release **NE DOIT** passer à `offline_ready` que lorsque **toutes** les conditions suivantes sont satisfaites :

1. l'entrée catalogue existe et pointe vers un package installé cohérent ;
2. le `content_digest` de publication recopié au catalogue **correspond** au contenu installé ;
3. **tous** les artefacts déclarés (§6) sont **disponibles localement sans connexion réseau** via Package Access ;
4. aucune erreur n'a interrompu la préparation.

### 7.3 Conditions d'échec — `failed`

`offline_status` **DOIT** valoir `failed` lorsque :

- la préparation est interrompue avant complétion ;
- un artefact déclaré est absent, inaccessible via Package Access, ou indisponible localement sans connexion réseau ;
- le `content_digest` ne correspond pas au contenu installé ;
- la matérialisation locale choisie par l'implémentation échoue de façon fatale (quota, corruption, autre erreur empêchant la disponibilité locale certifiée).

### 7.4 Interdiction de certification prématurée

| Interdit | Précision |
|---|---|
| **`offline_ready` sans préparation terminée** | Une Release **NE DOIT JAMAIS** être `offline_ready` pendant `preparing`. |
| **Ouverture offline non garantie** | Tant que `offline_status` ≠ `offline_ready`, aucune garantie offline **NE DOIT** être attribuée à la Release. |

---

## 8. Identité

### 8.1 Clé primaire de la disponibilité locale Release

La **disponibilité locale certifiée** d'une Release **DOIT** être indexée par **`release_id`**.

Elle **NE DOIT PAS** être indexée par `chapter` seul.

### 8.2 `content_digest`

| Règle | Énoncé |
|---|---|
| **Origine** | Le `content_digest` est une propriété de **publication** portée par le manifest ([`LIBRARY-CATALOG-CONTRACT.md`](LIBRARY-CATALOG-CONTRACT.md) §5.5). |
| **Vérification** | La préparation offline **DOIT** vérifier la cohérence du contenu installé avec ce digest. |
| **Invalidation** | Toute divergence **DOIT** empêcher `offline_ready` et **DOIT** conduire à `failed` si le statut était `offline_ready`. |
| **Non-substitution** | Le digest **NE DOIT PAS** remplacer `release_id` comme clé de la disponibilité locale certifiée. |

### 8.3 Données apprenantes

| Règle | Énoncé |
|---|---|
| **Ancrage** | Toute donnée apprenante persistante **DOIT** référencer une `release_id` (ou identité Release équivalente) — [contrat 02](../02-IDENTITY-AND-ANCHORS.md) §11.1, [ADR-006](../../adr/ADR-006-pedagogical-patrimony-and-edition-lineage.md) §3. |
| **Indépendance de la disponibilité locale Release** | Les données apprenantes **NE SONT PAS** des artefacts déclarés du manifest ; elles **NE DOIVENT PAS** être confondues avec la disponibilité locale du contenu publié. |
| **Disponibilité offline** | Les données apprenantes déjà persistées pour une `release_id` **DOIVENT** rester accessibles offline indépendamment de la préparation offline du contenu publié. |

### 8.4 Coexistence de Releases

Deux `release_id` distinctes **DOIVENT** disposer de disponibilités locales certifiées **distinctes**, même pour un même `chapter`.

---

## 9. Mises à jour, archivage et purge

### 9.1 Installation d'une nouvelle Release

| Règle | Énoncé |
|---|---|
| **Nouvelle identité** | L'installation d'une nouvelle `publication_version` **DOIT** produire une nouvelle entrée catalogue et une nouvelle `release_id`. |
| **Statut initial** | Toute Release nouvellement installée **DOIT** débuter à `not_prepared` ou `preparing` — jamais `offline_ready` sans préparation complète. |
| **Activation** | L'activation éditoriale d'une Release **NE DOIT PAS** supprimer la disponibilité locale certifiée d'une Release archivée. |

### 9.2 Archivage

| Règle | Énoncé |
|---|---|
| **Conservation** | L'archivage catalogue **DOIT** conserver le package installé et **DOIT** conserver la disponibilité locale certifiée associée à la `release_id` archivée. |
| **Statut offline** | Une Release archivée **PEUT** rester `offline_ready` pour consultation historique offline. |
| **Données apprenantes** | L'archivage **NE DOIT PAS** entraîner la perte silencieuse de données apprenantes ancrées à cette `release_id`. |

### 9.3 Purge

| Règle | Énoncé |
|---|---|
| **Explicite** | La suppression de la disponibilité locale certifiée d'une `release_id` — y compris toute matérialisation locale optionnelle au-delà du package installé — **DOIT** être une opération **explicite** et traçable. |
| **Interdit silencieux** | Aucune installation, archivage, mise à jour ou migration **NE DOIT** supprimer silencieusement la disponibilité locale d'une Release archivée. |
| **Orphelins** | Si des données apprenantes subsistent pour une `release_id` dont la disponibilité locale a été supprimée, elles **DOIVENT** être signalées — jamais supprimées silencieusement. |

---

## 10. Comportements interdits

| Interdit | Précision |
|---|---|
| **Warm cache présenté comme offline** | Interdit de qualifier une session ou une Release d'« offline garanti » sur la seule base d'un cache opportuniste. |
| **Cache partiel certifié offline** | Interdit de porter `offline_ready` si un artefact déclaré manque. |
| **Scan `packages/`** | Interdit d'inventorier ou de préparer offline par scan runtime de `packages/` — catalogue et manifest only. |
| **Modification des artefacts publiés** | Interdit d'altérer le manifest ou les artefacts médicaux installés lors de la préparation offline. |
| **Purge silencieuse** | Interdit de supprimer la disponibilité locale certifiée d'une Release sans opération explicite. |
| **Prérequis dépôt Git** | En mode produit, interdit de fonder la garantie offline sur l'arborescence de production du dépôt Git. |
| **Index offline parallèle** | Interdit de créer une seconde source de vérité du statut offline hors `library.json`. |
| **Reader ↔ accès direct** | Interdit au Reader d'accéder au contenu publié en dehors de Package Access ou d'implémenter directement la politique de disponibilité locale. |

---

## 11. Considérations futures

Ces interfaces sont **prévues** ; leur implémentation **N'EST PAS** définie ici.

### 11.1 PDR-E5 — Sauvegarde et restauration

Une sauvegarde patrimoniale **DOIT** pouvoir inclure `library.json` (y compris `offline_status`), les packages installés référencés et toute matérialisation locale optionnelle de la disponibilité offline, conjointement aux données apprenantes. La restauration **NE DOIT PAS** supprimer silencieusement des données apprenantes orphelines.

### 11.2 PDR-D4 — Reprise de session

La reprise de session offline **DOIT** s'appuyer sur une `release_id` et exiger que la Release concernée soit `offline_ready` pour garantir la continuité hors ligne du contenu publié.

### 11.3 PDR-D7 — Préférences d'affichage

Les préférences d'affichage persistées localement **DOIVENT** rester disponibles offline indépendamment du statut offline d'une Release ; leur restauration **NE DOIT PAS** exiger de connexion réseau.

---

## 12. Place dans la hiérarchie

### 12.1 Documents qui priment

En cas de conflit, priment dans cet ordre :

1. les ADR applicables, notamment [ADR-006](../../adr/ADR-006-pedagogical-patrimony-and-edition-lineage.md) ;
2. les contrats fondamentaux [01](../01-TRUST-AND-FIDELITY.md) à [09](../09-CLINICAL-SCENARIO.md), en particulier [04](../04-CHAPTER-PACKAGE.md), [06](../06-RENDERER-AND-LEARNER-LAYER.md) et [08](../08-RELEASE-EDITORIAL-ARCHITECTURE.md).

Ce contrat **NE DOIT PAS** contredire un document supérieur.

### 12.2 Documents sur lesquels il prime

Ce contrat **prime** sur :

- la documentation technique Reader relative au mode hors ligne ;
- les plans d'implantation et le code de préparation offline, de cache runtime et de tests offline ;
- toute description qui confondrait warm cache et offline garanti.

### 12.3 Relations avec les contrats composants voisins

| Contrat | Relation |
|---|---|
| [`LIBRARY-CATALOG-CONTRACT.md`](LIBRARY-CATALOG-CONTRACT.md) | Le catalogue porte `offline_status` ; ce contrat définit sa sémantique et les obligations offline. |
| [`RENDERER-COMPONENT-CONTRACT.md`](RENDERER-COMPONENT-CONTRACT.md) | Le Renderer consomme Package Access ; il **NE DOIT PAS** connaître le cache. |
| [`COMPOSITION-COMPONENT-CONTRACT.md`](COMPOSITION-COMPONENT-CONTRACT.md) | Indépendante du statut offline. |

Ce contrat **NE DOIT PAS** modifier la Composition Specification, le Composition Engine, le Reading View Model ni les obligations du [`COMPOSITION-COMPONENT-CONTRACT.md`](COMPOSITION-COMPONENT-CONTRACT.md).

---

## 13. Invariants

| ID | Invariant |
|---|---|
| **O-01** | Seul `offline_ready` garantit l'offline d'une Release installée. |
| **O-02** | `library.json` est l'unique source de vérité de `offline_status`. |
| **O-03** | Le périmètre offline Release = manifest + artefacts déclarés — jamais un scan libre. |
| **O-04** | La disponibilité locale certifiée d'une Release est indexée par `release_id`. |
| **O-05** | Le Reader accède au contenu publié uniquement via Package Access. |
| **O-06** | Aucune suppression silencieuse de la disponibilité locale certifiée d'une Release archivée. |
| **O-07** | En mode produit, la garantie offline ne dépend pas du dépôt Git. |
| **O-08** | Les données apprenantes référencent une `release_id`, jamais le seul `chapter`. |

---

## 14. Documents connexes

| Document | Rôle |
|---|---|
| [PDR-D2](../../governance/PRODUCT-DECISION-REGISTRY.md) | Décision produit — mode hors ligne intégral |
| [ADR-006](../../adr/ADR-006-pedagogical-patrimony-and-edition-lineage.md) | Patrimoine ; offline sur packages installés |
| [`LIBRARY-CATALOG-CONTRACT.md`](LIBRARY-CATALOG-CONTRACT.md) | Catalogue ; installation ; Package Access |
| [Contrat 04](../04-CHAPTER-PACKAGE.md) | Chapter Package / Release ; manifest ; digest |
| [Contrat 06](../06-RENDERER-AND-LEARNER-LAYER.md) | Renderer ; couche apprenant |
| [Contrat 08](../08-RELEASE-EDITORIAL-ARCHITECTURE.md) | Architecture éditoriale Release |
| [`RENDERER-COMPONENT-CONTRACT.md`](RENDERER-COMPONENT-CONTRACT.md) §7.2 | Package Access |
| [`COMPOSITION-COMPONENT-CONTRACT.md`](COMPOSITION-COMPONENT-CONTRACT.md) | Composition — indépendante du offline |

---

*Contrat composant Offline — Lot D2-A — en vigueur.*
