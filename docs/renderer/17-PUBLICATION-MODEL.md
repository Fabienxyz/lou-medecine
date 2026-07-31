# Lou Médecine — Modèle de publication

| | |
|---|---|
| **Type** | Document d'architecture de référence |
| **Version** | 1.0 |
| **Statut** | **Référence conceptuelle — en vigueur** |
| **Phase** | **La Fabrique** — point de départ |
| **Dernière mise à jour** | 2026-07-28 |
| **Parent** | [README.md](./README.md) |
| **Précède** | [`16-CONTENT-TO-READER-ARCHITECTURE.md`](./16-CONTENT-TO-READER-ARCHITECTURE.md) |
| **Gouverné par** | Contrats fondamentaux 01–09 ([`docs/contracts/`](../contracts/00-INDEX.md)) — ce document **ne les remplace pas** |

Ce document définit le **modèle de publication** d'un chapitre Lou Médecine.

Il répond à une seule question :

> **Quand un chapitre est déclaré « publié », qu'est-ce que cela signifie exactement ?**

**Périmètre :**

| Ce document (17) | Documents complémentaires |
|---|---|
| État, garanties et contrat de publication | Doc 16 — consommation par le Reader |
| Incomplétude honnête, évolution, rôle du manifest | Contrat 04 — structure et cycle de vie du package |
| Principes durables de La Fabrique | Docs 14–15 — Reader (aval de la publication) |

**Ce document n'est pas :** un document pipeline, une spécification de build, une implémentation, un contrat de génération, un manifest technique, ni un format de fichier. Il décrit uniquement le **modèle conceptuel de publication**.

En cas de conflit sur une **obligation normative**, les contrats fondamentaux et ADR priment sur ce document.

**Place dans la documentation.** Ce document ouvre la phase **La Fabrique**. Il précède le document [16](./16-CONTENT-TO-READER-ARCHITECTURE.md) : le doc 17 définit *ce qu'est* une publication ; le doc 16 définit *comment* une publication devient une expérience Reader. Les documents [14](./14-LOU-READER-ARCHITECTURE.md) et [15](./15-READER-FUNCTIONAL-SPECIFICATION.md) décrivent le produit aval — ils supposent qu'un chapitre publié existe déjà.

```
Production du chapitre
        ↓
   Validation métier
        ↓
═══════════════════════
   ÉTAT : PUBLIÉ
   (Chapter Package)
═══════════════════════
        ↓
  Consommation Reader
```

Schéma purement conceptuel : il ne représente ni les étapes internes de production, ni les artefacts, ni l'implémentation.

---

## Documents connexes

| Document | Rôle |
|---|---|
| [`16-CONTENT-TO-READER-ARCHITECTURE.md`](./16-CONTENT-TO-READER-ARCHITECTURE.md) | Frontière publication ↔ Reader |
| [`18-BUILD-ARCHITECTURE.md`](./18-BUILD-ARCHITECTURE.md) | Architecture de La Fabrique — transformations, validations |
| [`19-BUILD-PIPELINE.md`](./19-BUILD-PIPELINE.md) | Pipeline opérationnel — étapes, artefacts, gates |
| [`04-CHAPTER-PACKAGE.md`](../contracts/04-CHAPTER-PACKAGE.md) | Obligations normatives du package |
| [`01-TRUST-AND-FIDELITY.md`](../contracts/01-TRUST-AND-FIDELITY.md) | Fidélité et critères de publication |
| [`06-RENDERER-AND-LEARNER-LAYER.md`](../contracts/06-RENDERER-AND-LEARNER-LAYER.md) | Consommation aval — manifest-only |

---

# 1. La notion de publication

## 1.1 Un état, pas un dossier

Un chapitre **publié** n'est pas simplement un ensemble de fichiers produits par un build.

C'est un **état architectural** : la déclaration formelle qu'un chapitre identifié satisfait les garanties requises pour devenir **consommable** par un Reader — sans que l'aval ait à reconstruire, inférer ou compléter la vérité médicale.

La publication est le **moment de bascule** où la responsabilité passe du pipeline (production et validation) au Reader (composition et expérience).

## 1.2 Ce que la publication n'est pas

| La publication n'est pas… | Car… |
|---|---|
| Une simple fin de build | Un build peut échouer ; un état stale peut exister — seul un état **validé et déclaré** est publié |
| Une autorisation d'expérience | Le package publié ne décide pas de l'interface — voir doc 16 |
| Une immuabilité absolue du contenu | Une republication produit une **nouvelle Release** ; l'ancienne est **archivée**, jamais écrasée silencieusement — voir §6.3 et [ADR-006](../adr/ADR-006-pedagogical-patrimony-and-edition-lineage.md) |
| Une garantie d'exhaustivité produit | Un chapitre publié peut être **incomplet mais honnête** — voir §5 |

## 1.3 La publication comme contrat

Publier un chapitre, c'est contracter avec l'aval :

> *« Ce chapitre, identifié et versionné, expose un contenu officiel vérifiable ; tout ce qui est déclaré existe et est traçable ; tout ce qui est absent est déclaré comme tel. »*

Ce contrat est **conceptuel** — il existe indépendamment de la technologie qui le matérialise.

---

# 2. Les garanties d'un chapitre publié

Un chapitre publié offre des **garanties conceptuelles** à tout consommateur aval. Ce ne sont pas des promesses d'implémentation — ce sont des propriétés architecturales.

| Garantie | Énoncé |
|---|---|
| **Identité stable** | Le chapitre est identifiable de manière univoque ; ses entités internes (points de connaissance, éléments pédagogiques, blocs de claim) portent des identifiants stables au sein de la publication |
| **Traçabilité** | Tout énoncé médical orienté apprenant est résolvable jusqu'à la source officielle — la chaîne de référence est complète et consultable |
| **Fidélité** | Le contenu publié est cohérent avec la source officielle de l'édition déclarée ; aucune seconde autorité médicale n'a été introduite |
| **Reproductibilité** | À entrées de production identiques, la publication produit le même résultat vérifiable — la publication est une fonction déterministe de ses entrées |
| **Cohérence interne** | Les références internes se résolvent ; les liens déclarés (explication ↔ ressource, identité ↔ contenu) sont intacts ; le chapitre assemblé ne se contredit pas |
| **Version identifiable** | La publication porte une identité de version (édition source, révisions curatives, méthodologie) permettant de distinguer deux publications du même chapitre |

Ces garanties sont **établies avant** toute consommation Reader. L'aval n'a pas à les re-vérifier — il peut s'y appuyer.

---

# 3. Le Chapter Package comme unité publiée

## 3.1 Unité officielle

Le **Chapter Package** est l'**unique unité de publication** d'un chapitre Lou Médecine.

Il représente **un chapitre**, pour **une édition d'acquisition qualifiée**, dans un **état validé**.

## 3.2 Consommation par unité, jamais par fragment

Le Reader **ne consomme jamais** des artefacts isolés, des curatifs en cours de production, ou des sorties intermédiaires de build.

Il consomme **exclusivement** un package **publié** — un ensemble cohérent dont l'intégrité a été établie au moment de la publication.

Toute consommation aval qui contournerait cette unité créerait une seconde voie d'accès au contenu médical — non traçable, non validée, non reproductible.

## 3.3 Frontière amont / aval

```
        AMONT                              AVAL
  (production, curation)            (Reader, Renderer)

  curatifs, génération,              package publié
  validation, assemblage      →      comme seule entrée
```

Tout ce qui se trouve amont de la publication reste **hors périmètre de consommation** — même s'il est versionné, même s'il est accessible techniquement.

---

# 4. Ce qu'un package publié rend visible

Un package publié **expose** — de manière consultable par l'aval — les éléments suivants. Il s'agit de **catégories conceptuelles**, non de formats.

| Catégorie | Ce qu'elle rend disponible |
|---|---|
| **Contenu officiel** | Les unités d'explication publiées — questions, walkthroughs, claims — immuables pour l'apprenant |
| **Identités publiées** | Le vocabulaire d'identifiants stables : points de connaissance, éléments pédagogiques, blocs de claim, ressources officielles |
| **Relations déclarées** | Les liens entre identités : traçabilité, appartenance, dépendances, correspondances explication ↔ ressource |
| **Ressources officielles** | Les supports publiés liés par identité (visuels, références) — et leur état |
| **États de disponibilité** | Pour chaque ressource ou unité de contenu attendue : publiée, absente connue, retenue |
| **Métadonnées de publication** | Identité du chapitre, édition source, version, provenance agrégée, résultat des garanties |

Le package **rend visible** ; il ne **prescrit pas** comment l'aval doit présenter ces éléments.

---

# 5. Publication et incomplétude

## 5.1 Un chapitre publié peut être incomplet

La publication **n'exige pas** que tout contenu planifié soit produit. Elle exige que l'état réel soit **honnête**.

Un chapitre peut être publié avec des ressources ou des familles de contenu **absentes connues** — à condition que cette absence soit **déclarée**, pas masquée.

## 5.2 Quatre situations distinctes

L'aval — et le Reader — doivent pouvoir distinguer :

| Situation | Signification | Comportement attendu |
|---|---|---|
| **Publié** | Le contenu existe, est validé et disponible | Présentation normale |
| **Absence connue** | Le contenu est planifié ou attendu, mais déclaré comme non produit | Signal explicite — pas une erreur, pas un trou silencieux |
| **Retenu** | Le contenu a été produit mais n'a pas passé les garanties requises | Signal explicite — le contenu adjacent valide reste disponible si les garanties le permettent |
| **Manquant ou invalide** | Un contenu déclaré publié est introuvable ou inutilisable | Erreur localisée — la publication est incohérente avec sa propre déclaration |

**Absence connue ≠ erreur.** Une absence déclarée est une information légitime — le chapitre est incomplet mais honnête.

**Absence connue ≠ contenu inconnu.** L'absence est **déclarée par le package** — le Reader n'a pas à deviner.

**Absence connue ≠ non généré silencieux.** Un contenu non produit sans déclaration viole le contrat de publication.

**Vocabulaire normatif des absences éditoriales :** [contrat 08](../contracts/08-RELEASE-EDITORIAL-ARCHITECTURE.md) §5 — seule référence des états *Publié*, *Prévu*, *Retenu*, *Non applicable*, etc.

## 5.3 Principe

> **Publier honnêtement vaut mieux que publier silencieusement incomplet.**

---

# 6. Publication et évolution

## 6.1 Ce qui peut évoluer

Sans remettre en cause le modèle de publication :

| Élément évolutif | Exemple |
|---|---|
| **Organisation interne** | Regroupement, nommage ou découpage des artefacts de production |
| **Artefacts** | Nouvelles unités de contenu, nouvelles familles |
| **Projections** | Nouvelles vues dérivées du curatif — le package reste l'unité |
| **Implémentation** | Outils de build, technologies de stockage, format de l'index |

L'évolution amont **ne change pas** le contrat aval tant que la publication respecte les garanties.

## 6.2 Ce qui doit rester stable

| Élément stable | Raison |
|---|---|
| **Identité du chapitre** | Référence durable pour catalogues, URLs, données apprenant |
| **Identités internes publiées** | Ancrage traçabilité, couche apprenante, continuité entre publications |
| **Contrat de publication** | Les garanties du §2 — indépendantes de l'implémentation |
| **Frontière package ↔ aval** | Le Reader consomme un package publié — jamais autre chose |

## 6.3 Republication et bascule

Une **nouvelle publication** du même chapitre produit une **nouvelle Release** / un **nouveau Chapter Package** avec identité de version distincte. Elle devient la référence officielle **active** pour l'étude **uniquement** après **bascule atomique explicite** ([ADR-006](../adr/ADR-006-pedagogical-patrimony-and-edition-lineage.md) §2, §5).

La Release / le package précédemment actif est **archivé** et **conservé** — **jamais écrasé silencieusement**. Les données d'apprentissage créées sur l'ancienne version **restent attachées** à cette version. Les identités persistantes (KP, éléments pédagogiques) permettent à l'aval de réconcilier les contributions personnelles — sous réserve de la résolution des ancres ([doc 16](./16-CONTENT-TO-READER-ARCHITECTURE.md)).

Une republication **n'est pas** une modification in-place du contenu publié : c'est un **nouvel état** déclaré, avec sa propre version identifiable.

---

# 7. Le rôle du manifest

## 7.1 Index officiel de publication

Chaque package publié possède un **index de publication** — le **manifest**.

Le manifest est le **point d'entrée** autorisé pour toute consommation aval : il indique ce qui existe, sous quelle identité, dans quel état, avec quelles références.

## 7.2 Ce que le manifest est

| Propriété | Énoncé |
|---|---|
| **Index** | Il **déclare** et **référence** — il n'est pas le contenu médical auteur |
| **Agrégateur** | Il assemble les métadonnées de publication en un point d'accès unique |
| **Contrat de consommation** | Il expose les garanties du §2 sous une forme consultable |

## 7.3 Ce que le manifest n'est pas

| Le manifest n'est pas… | Car… |
|---|---|
| La publication elle-même | La publication est l'**état** du package entier — le manifest en est l'index |
| Une source de vérité médicale | Le contenu médical vit dans les artefacts publiés ; le manifest les référence |
| Une spécification d'interface | Il ne décide pas de la navigation, des écrans, des libellés de vues ou de la charge cognitive — voir Composition Specification ([`COMPOSITION-COMPONENT-CONTRACT.md`](../contracts/components/COMPOSITION-COMPONENT-CONTRACT.md)) |
| Un substitut à la traçabilité | La traçabilité détaillée peut être référencée — le manifest ne la remplace pas |

Le manifest **expose ce qui est publié**. Il ne **constitue** pas la publication à lui seul.

---

# 8. Responsabilités interdites

Les interdictions ci-dessous protègent le modèle de publication — indépendamment de l'implémentation.

## 8.1 Le package publié

| Interdit | Raison |
|---|---|
| Décider de l'expérience Reader | Autorité d'expérience — Reader (doc 16) |
| Fixer la navigation, les écrans, la charge cognitive | Autorité d'expérience — Reader |
| Prescrire les interactions utilisateur | Spécification fonctionnelle — doc 15 |
| Introduire du vocabulaire produit (labels, emojis, ordre d'affichage des vues, parcours) | Couplage présentation ↔ publication — [`COMPOSITION-COMPONENT-CONTRACT.md`](../contracts/components/COMPOSITION-COMPONENT-CONTRACT.md) §13 |

## 8.2 Le Reader et l'aval

| Interdit | Raison |
|---|---|
| Modifier un package publié | Immutabilité du contenu officiel |
| Contourner la publication pour accéder aux curatifs ou à la source | Manifest-only — contrat 06 |
| Reconstruire la vérité médicale en aval | Autorité médicale — pipeline |
| Fusionner des données apprenant dans le contenu officiel | Séparation des cycles de vie |

## 8.3 Le pipeline et l'amont

| Interdit | Raison |
|---|---|
| Contourner la publication pour servir du contenu à l'aval | Frontière package — seule voie de consommation |
| Publier sans établir les garanties du §2 | Contrat de publication |
| Masquer une absence non produite | Incomplétude honnête — §5 |
| Laisser un index de publication stale après un échec | Invalidation — une publication échouée n'est pas une publication |

---

# 9. Principes durables

| Principe | Énoncé |
|---|---|
| **La publication est une frontière** | Elle sépare production validée et consommation — rien ne la traverse sans garanties |
| **Le package est l'unité publiée** | Un chapitre se publie et se consomme en entier — jamais par fragment |
| **Le Reader consomme uniquement des publications** | Aucune voie parallèle vers le contenu médical |
| **Une publication possède une identité** | Chapitre, édition, version — distinguables et stables |
| **Une publication possède un contrat** | Garanties du §2 — établies avant consommation |
| **Publier honnêtement** | Une absence déclarée vaut mieux qu'un trou silencieux |
| **Le manifest indexe, il n'autorise pas** | Point d'entrée — pas source de vérité médicale |
| **L'implémentation est remplaçable** | Le modèle de publication survit à tout changement technique |

---

# 10. Synthèse

Publier un chapitre Lou Médecine, c'est **déclarer un état** :

- un **Chapter Package** identifié et versionné ;
- dont les **garanties** (identité, traçabilité, fidélité, reproductibilité, cohérence) ont été établies ;
- dont les **absences** sont déclarées honnêtement ;
- indexé par un **manifest** — point d'entrée unique pour l'aval ;
- **sans autorité** sur l'expérience Reader.

Ce modèle est le **contrat amont** de la phase **La Fabrique** : tout pipeline de production, tout outil de build, toute validation future doit converger vers cet état — indépendamment de l'implémentation choisie.

Le document [16](./16-CONTENT-TO-READER-ARCHITECTURE.md) prend le relais **après** cette frontière : comment une publication devient une expérience.

---

# Historique des versions

| Version | Date | Changement |
|---|---|---|
| **1.0** | 2026-07-28 | Référence initiale — modèle de publication, garanties, incomplétude, manifest |

---

*Référence conceptuelle Lou Médecine — modèle de publication. Point de départ de La Fabrique. Toute évolution substantielle requiert une révision de version explicite.*
