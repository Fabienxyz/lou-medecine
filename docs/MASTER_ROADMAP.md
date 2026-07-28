# Lou Médecine — Master Roadmap

Document de pilotage officiel du projet.  
**Dernière mise à jour :** 2026-07-28

Ce document est la **référence officielle pour le pilotage** du projet. Il définit les objectifs, le séquencement, les priorités et les critères de réussite.

Les documents d'architecture et les contrats techniques (`IMPLEMENTATION_CONTRACT.md`, `FINAL_ARCHITECTURE.md`, `VISUAL_GRAMMAR_CONTRACT.md`, etc.) définissent les **comportements attendus** de l'implémentation.

En cas de divergence : **la roadmap pilote les priorités** ; **les contrats techniques pilotent l'implémentation**. Ce document n'est pas une spécification technique.

L'état opérationnel courant (phase active, métriques, risques) est maintenu dans [`PROJECT_STATE.md`](PROJECT_STATE.md).

---

## 1. Mission

### Objectif du projet

Transformer les Collèges officiels EDN en supports d'étude qui permettent de **comprendre avant de mémoriser**, sans jamais altérer le contenu médical source.

### Vision long terme

Lou ouvre un renderer moderne et accède à **n'importe quel chapitre de l'ensemble des Collèges EDN**. Pour chaque chapitre, elle retrouve :

- le contenu officiel ;
- une vue d'ensemble ;
- les explications nécessaires à la compréhension ;
- les schémas ;
- les guides de lecture ;
- les points d'attention ;
- ses annotations personnelles ;
- toutes les fonctionnalités du renderer.

Le tout est **généré industriellement**, à partir des Collèges officiels, avec un effort humain minimal par chapitre.

### Principe « Comprendre avant de mémoriser »

La couche de compréhension (Inventory → Blueprint → Projections) vient **après** et **en plus** du contenu officiel. Elle ne le remplace pas. L'Inventory porte l'exhaustivité examinable ; le Blueprint porte l'ordre pédagogique ; les Projections portent l'explication.

Ce principe est **archétype-dépendant** : il produit le plus de valeur sur les chapitres mécanistiques et normatifs complexes. Sur d'autres archétypes (catalogues thérapeutiques, reconnaissance de formes), le projet accepte un **profil de projections allégé** plutôt qu'un échafaudage artificiel.

### Industrialisation du pipeline

Le pipeline doit produire un chapitre **sans intervention manuelle sur les artefacts générés**. L'effort humain par chapitre doit être **minimal et mesuré** — voir [`PROJECT_STATE.md`](PROJECT_STATE.md).

---

## 2. Hors périmètre

Lou Médecine ne cherche **pas** à :

- **créer un nouveau contenu médical** — le Collège reste l'autorité ; le projet n'ajoute que de la pédagogie traçable ;
- **remplacer le Collège officiel** — la couche officielle est toujours présente, distincte et complète ;
- **construire un assistant conversationnel médical généraliste** — pas de chat libre ; chaque énoncé généré est ancré et vérifiable ;
- **devenir un SaaS** — le projet sert Lou ; pas de multi-tenant, pas de comptes publics, pas de support utilisateur ;
- **optimiser les coûts au détriment de la fidélité** — un pipeline bon marché qui enseigne faux est un échec ;
- **ajouter des fonctionnalités qui n'améliorent pas réellement l'apprentissage** — QCM, gamification, statistiques sociales attendent une validation pédagogique explicite (Phase 4).

Toute proposition qui entre dans ces catégories est **hors roadmap**, même si elle paraît séduisante techniquement.

---

## 3. Principes fondateurs

1. **Fidélité absolue au Collège officiel.** Le Collège est la seule source de vérité médicale. Toute garantie de qualité repose sur la traçabilité vers cette source, pas sur une relecture humaine du fond médical.

2. **Généralisation à l'ensemble des EDN.** Chaque décision doit tenir à l'échelle de l'ensemble des collèges et chapitres EDN. Ce qui fonctionne sur un prototype ne suffit pas.

3. **Réduction du temps humain par chapitre.** Lou et le propriétaire jugent la clarté, la charge cognitive et l'utilité — jamais la correction médicale. Le pipeline ne doit pas attendre une validation humaine du fond.

4. **Priorité aux traitements déterministes.** PDF officiel → Markdown source (Tool 01) → chapitres (Tool 02), puis segmentation, validation, rendu SVG, règles de grounding : autant que possible, sans LLM. Chaîne officielle gelée : [`SOURCE_OF_TRUTH.md`](SOURCE_OF_TRUTH.md), [ADR-004](adr/ADR-004-acquisition-architecture-frozen.md).

5. **LLM au strict nécessaire.** Le projet privilégie systématiquement les traitements déterministes et limite l'utilisation des LLM au strict nécessaire. Détail opérationnel : [`LLM_STRATEGY.md`](LLM_STRATEGY.md).

6. **Code permanent, LLM temporaire.** Le code est un actif permanent ; un appel LLM est une dépendance temporaire. Toute amélioration durable doit viser à **remplacer** un appel LLM par une règle déterministe, pas à augmenter la dépendance aux modèles.

7. **Séparation stricte officiel / généré.** Le contenu officiel et le contenu produit par Lou Médecine sont visuellement et structurellement distincts. Lou doit toujours savoir ce qui vient du Collège et ce qui est une interprétation pédagogique.

8. **Ordre d'irréversibilité.** Les décisions coûteuses à changer sont prises tôt (modèle d'ancre, schéma d'Inventory). Le reste reste évolutif.

9. **Single Source of Truth.** Pour une même donnée métier, une seule source officielle. Voir [`SOURCE_OF_TRUTH.md`](SOURCE_OF_TRUTH.md).

---

## 4. Invariants

Ces règles ne se négocient pas entre les phases.

| Invariant | Règle |
|---|---|
| Source de vérité | Le Collège officiel est la seule source de vérité médicale. |
| SSOT acquisition | **Une seule chaîne officielle** : PDF → Tool 01 → Markdown source → Tool 02 → chapitres. Aucune duplication ne devient une seconde autorité. Voir [`SOURCE_OF_TRUTH.md`](SOURCE_OF_TRUTH.md). |
| Artefacts générés | **Aucune modification manuelle** d'un artefact produit par le pipeline. |
| Décision humaine | Une décision humaine est une **entrée** du pipeline (`chapter.package.yaml`), jamais une retouche de sa **sortie**. Elle doit être versionnée, rejouable, justifiée et comptabilisée. |
| Build reproductible | Le build est une fonction pure de ses entrées versionnées (voir § Tableau de bord). |
| Amélioration | On corrige les **outils** (prompts, validateurs, code), jamais les chapitres à la main. |
| Traçabilité | Chaque claim pédagogique porte une classe (`sourced` \| `bridging` \| `scaffolding`) et des ancres vers la source. |
| Géométrie | La sémantique visuelle (visualSpec) ne porte aucune géométrie ; le renderer seul possède la mise en page. |
| Troncature | Aucun raccourcissement silencieux du sens (texte, labels, tableaux). |

### Canal de décision humaine

Lorsque le pipeline **lève lui-même** une exception (conflit de source, segment ambigu, grounding indécidable), une décision humaine est admise **uniquement** si :

1. elle référence l'identifiant d'exception levé par la machine ;
2. elle est relue par le build (régénération = même résultat) ;
3. elle est justifiée par écrit et limitée à ce que Lou et le propriétaire peuvent juger ;
4. elle est **comptée**.

Si une **même classe d'exception** se répète sur plusieurs chapitres, c'est un défaut d'outil — pas une décision à prendre à l'échelle du corpus.

---

## 5. Vue d'ensemble

| Phase | Statut | Objectif | Principal livrable |
|---|---|---|---|
| **0 — Architecture & Acquisition** | ✅ **Terminée** | Fondations : gouvernance, SSOT, acquisition qualifiée et gelée | Chaîne FIL B + ADR-004 |
| **1 — Industrialisation** | **Active** | Produire les artefacts métier à l'échelle | Collège cardio complet + pipeline automatisé |
| **2 — Validation pédagogique** | À venir | Prouver que la méthode enseigne mieux | Décision écrite Phase 4 |
| **3 — Échelle EDN** | À venir | Multi-collèges | Production EDN |
| **4 — Régime permanent** | À venir | Maintenance éditions | Système auto-maintenu |

**Chemin critique actuel :** Phase 1 (Industrialisation) → Phase 2 → Phase 3 → Phase 4.

> **Changement de cap (2026-07-28).** La R&D acquisition est **clôturée** ([ADR-004](adr/ADR-004-acquisition-architecture-frozen.md)). Le projet ne travaille plus sur les fondations d'acquisition mais sur leur **industrialisation**. Détail opérationnel : [`PROJECT_STATE.md`](PROJECT_STATE.md).

---

## 6. Les phases

### Phase 0 — Architecture & Acquisition ✅ TERMINÉE

**Objectif.** Établir et valider les fondations immuables du projet : gouvernance, source de vérité, pipeline d'acquisition, qualification et gel architectural.

**Statut.** **Terminée** — 2026-07-28. Référence historique : [`releases/acquisition-rd-complete.md`](releases/acquisition-rd-complete.md).

| Jalon | Statut | Référence |
|---|---|---|
| Gouvernance projet | ✅ | [`MASTER_ROADMAP.md`](MASTER_ROADMAP.md), [`PROJECT_STATE.md`](PROJECT_STATE.md) |
| Single Source of Truth (FIL B) | ✅ | [ADR-003](adr/ADR-003-single-source-of-truth.md), [`SOURCE_OF_TRUTH.md`](SOURCE_OF_TRUTH.md) |
| Tool 01 v1.0.0 qualifié | ✅ | [`qualification-report-tool01-p1.md`](acquisition/qualification-report-tool01-p1.md) |
| Tool 02 v1.0.0 qualifié | ✅ | Manifest Tool 02, 22 chapitres |
| Phase P — qualification P1–P7 | ✅ | [`qualification-report-acquisition-final.md`](acquisition/qualification-report-acquisition-final.md) |
| Phase 0B — dérivation Collège | ✅ | [`qualification-report-phase-0b.md`](acquisition/qualification-report-phase-0b.md) |
| Double vertical slice (234 + 330) | ✅ | Migration 234 FIL B ; package 330 FIL B |
| Architecture Frozen | ✅ | [ADR-004](adr/ADR-004-acquisition-architecture-frozen.md) |

**Mode maintenance.** La couche acquisition est **gelée**. Évolutions limitées aux cas ADR-004 § 6 (bug bloquant, nouveau format source, nouvel ADR).

**⛔ Gel acté — ADR-004**

> Tool 01 v1.0.0 · Tool 02 v1.0.0 · FIL B · modèle d'ancres · grille P1–P7 — **socle officiel immuable**.

---

### Phase 1 — Industrialisation *(phase active)*

**Objectif.** Transformer le prototype validé en chaîne capable de produire l'ensemble des chapitres EDN — sans retravailler l'acquisition.

**Pourquoi.** Les fondations sont stables ; le goulot d'étranglement est désormais la **production industrielle** des artefacts métier (Inventory, Blueprint, projections, Renderer) à partir du chapter package FIL B.

**Grands chantiers.**

| Chantier | Objectif | État |
|---|---|---|
| **Inventory Factory** | Extraction, réconciliation et validation Inventory reproductibles par chapitre | 2/22 chapitres (234, 330) |
| **Blueprint Factory** | Génération et validation Blueprint à partir de l'Inventory | 2/22 chapitres |
| **Projection Factory** | Projections pédagogiques ancrées, grounding automatisé | 2/22 chapitres |
| **Renderer Production** | Lecteur multi-chapitres, `library.json`, contenu officiel + compréhension | Prototype Item 234 |
| **EDN Scale-out** | Collège cardio complet → 2ᵉ collège → production EDN | Non démarré |

Feuille de route détaillée : [`acquisition/industrialization-plan.md`](acquisition/industrialization-plan.md).

**Critères de sortie Phase 1.**

- 22 chapitres cardio packagés — `lou-build validate` PASS sur FIL B.
- Pipeline sémantique exécutable sans transcription manuelle systématique.
- Lecteur opérationnel pour le Collège cardio complet.
- Effort humain et coût LLM **mesurés** par chapitre — [`PROJECT_STATE.md`](PROJECT_STATE.md).

**Ne pas faire.** Rouvrir la R&D acquisition ; optimiser Tool 01/02 sans bug bloquant ADR-004 ; retoucher le Markdown source à la main.

---

### Détail historique — sous-phases d'industrialisation

Les sections ci-dessous conservent le **détail opérationnel** des chantiers prévus avant la restructuration Phase 0/1. Elles restent valides comme sous-chantiers de la **Phase 1 — Industrialisation**.

---

### Phase P — Qualification du pipeline d'acquisition ✅ *(composante Phase 0 — terminée)*

> **Statut :** terminée — 2026-07-28. Verdict **GO**. Ce bloc est conservé comme référence historique.

**Objectif.** Valider que la chaîne FIL B produit un Markdown source **suffisant pour les artefacts métier** (Inventory, Blueprint, projections, Renderer) — **pas** une reproduction parfaite du PDF.

**Pourquoi.** Le Markdown est un artefact intermédiaire. Qualifier la ressemblance PDF avant de prouver que Inventory et Blueprint peuvent être générés gaspille l'effort. Le format source (PDF aujourd'hui, autre demain) doit être choisi et gelé avant la Phase 0. Débloque la Phase 0.

**Hors périmètre.** La Phase P ne fait **pas partie du pipeline médical Lou**. Elle ne produit ni Inventory, ni Blueprint, ni Projections. Elle ne qualifie pas un LLM — elle qualifie un pipeline reproductible, déterministe et versionné.

**Pipeline cible (chaîne officielle FIL B).**

```
PDF officiel → Tool 01 → Markdown source → Tool 02 → Chapitres → Pipeline Lou
```

Détail et emplacements : [`SOURCE_OF_TRUTH.md`](SOURCE_OF_TRUTH.md).

La Phase P qualifie l'étage **d'acquisition** (aujourd'hui Tool 01 pour le PDF). Elle est réalisée **une seule fois par type de source** (ex. PDF éditeur X, DOCX éditeur X), puis appliquée industriellement à l'ensemble des chapitres.

**Livrables.**

- Inventaire des formats disponibles pour le collège pilote.
- Analyse comparative et choix du format source primaire ([`SOURCE_FORMAT_COMPARATIVE.md`](SOURCE_FORMAT_COMPARATIVE.md)).
- Pipeline d'acquisition versionné, exécutable en une commande.
- Dossier [`docs/acquisition/`](acquisition/) : `pipeline.md`, `benchmark.md`, `qualification-report.md`.
- Markdown source du collège cardio produit par le pipeline qualifié.

**Critères de sortie.** Voir [`SOURCE_PIPELINE_QUALIFICATION.md`](SOURCE_PIPELINE_QUALIFICATION.md) — question directrice (suffisance aval), critères **P1–P7**, décision GO/NO GO.

**⛔ Gel — fin de Phase P**

> **Le pipeline d'acquisition est figé par type de source.** Toute modification de logique d'extraction incrémente la version. Le Markdown source est un artefact dérivé — jamais retouché à la main.

**Ne pas faire.** Qualifier un LLM comme producteur de Markdown source ; étendre le pipeline PDF sans avoir vérifié les formats structurés disponibles ; commencer 0B sur une source non qualifiée ; retoucher le Markdown source ou les chapitres produits ; utiliser le FIL A legacy ([`SOURCE_OF_TRUTH.md`](SOURCE_OF_TRUTH.md)) ; **optimiser Tool 01 pour la reproduction PDF sans impact démontré sur les artefacts aval**.

---

### Phase 0 — Le Socle

Deux chantiers séquencés différemment parce qu'ils débloquent des phases différentes.

#### 0B — Fidélité du Collège ✅ *(qualification acquisition — terminée)* · enrichissements canoniques — à venir

**Objectif.** Rendre la couche canonique **vraie** et vérifiable.

**Pourquoi.** Sans Markdown source **suffisant pour les artefacts aval** (FIL B), toute la traçabilité garantit la fidélité à une entrée inutilisable. Débloque la Phase 1. S'appuie sur Tool 01 et Tool 02 après qualification Phase P (grille P1–P7).

**Livrables.**

- Récupération du Rang A/B (pastilles ou marqueurs de hiérarchisation → colonne de rang).
- Extraction des figures (`Fig. N` → fichiers image référencés).
- Validation bloquante des tableaux et des en-têtes (Tool 01).
- Rapport d'intégrité sur le Collège cardio.

**Critères de sortie.**

- Aucun tableau malformé ; aucun en-tête fabriqué.
- Quasi-totalité des lignes de hiérarchisation portent un rang.
- Toutes les références de figures résolues vers un fichier image.
- Rapport d'intégrité publié — détail des métriques dans [`PROJECT_STATE.md`](PROJECT_STATE.md).

**Ne pas faire.** Réécrire le pipeline d'acquisition (Phase P) ; viser l'OCR ; commencer le contenu généré du chapitre 2.

---

#### 0A — Contrats fondamentaux *(en parallèle de la Phase 1)*

**Objectif.** Poser les contrats irréversibles et rendre le build fiable.

**Pourquoi.** Débloque la Phase 2. La décision sur le modèle d'ancre se prend **après 0B**, une fois les figures extraites et nommées.

**Livrables.**

- Modèle d'ancre : `quote`, `table-cell`, `figure`, `section` (chemin désambiguïsé).
- Identifiants à portée globale (`cardio/234:KP-041`).
- CI ; tests isolés (plus de mutation du chapitre canonique).
- Purge des littéraux item 234 dans le code générique.
- V2 (visualSpec) câblé dans `runBuild()` ; V1 supprimé ; `data-official-text-id` émis par le renderer SVG.

**Critères de sortie.**

- `lou-build build` reproduit les artefacts textuels publiés (test en CI).
- Document d'une page fixant le modèle d'ancre avec un exemple par type, sur plusieurs chapitres contrastés.

**⛔ Gel — fin de 0A**

> **Le modèle d'ancre et le schéma d'identifiants sont figés.** Extensible par **ajout** de type d'ancre uniquement — jamais par modification d'un type existant.

**Ne pas faire.** Perfectionner le renderer ; geler le schéma d'Inventory (trop tôt — voir Phase 2).

---

### Phase 1 (historique) — Le Lecteur → *Renderer Production*

> **Remapping Phase 1 Industrialisation :** ce chantier correspond au pilier **Renderer Production**.

**Objectif.** Donner à Lou un lecteur du Collège de cardiologie **meilleur que le PDF**, sans une ligne générée par LLM.

**Pourquoi.** Usage quotidien immédiat ; contrôle qualité humain sur la couche canonique ; exercice du renderer multi-chapitres.

**Livrables.**

- `library.json` (collèges → chapitres, rangs, situations de départ).
- Un `manifest.json` par chapitre (`official.source` uniquement).
- Écran d'accueil, recherche plein texte, figures inline, annotations existantes.

**Critères de sortie.**

- Collège cardio entier accessible ; recherche fonctionnelle ; annotations isolées par chapitre.
- Lou préfère le lecteur au PDF pour chercher, naviguer et annoter.
- Au moins un défaut de fidélité rapporté par Lou et corrigé en 0B.

**Ne pas faire.** Mettre du contenu généré dans le Lecteur ; QCM / répétition espacée ; refonte esthétique ; approfondir l'annotation.

---

### Phase 2 (historique) — La Fabrique → *Inventory / Blueprint / Projection Factory*

> **Remapping Phase 1 Industrialisation :** ce chantier correspond aux piliers **Inventory Factory**, **Blueprint Factory** et **Projection Factory**.

**Objectif.** Transformer le pipeline sémantique en **code exécutable, reproductible et instrumenté**. Le prouver sur 330, 232, 233.

**Pourquoi.** Trois étages sur huit sont exécutables aujourd'hui ; le cœur sémantique est une transcription manuelle. Les chapitres 330, 232, 233 testent les archétypes non mécanistiques.

**Livrables.**

- Segmentation déterministe de la source (unités adressables, hashées).
- Runtime LLM (prompts versionnés, cache, comptage, retry piloté par validateur).
- Grounding réel (règles déterministes + juge d'entailment léger sur `bridging`).
- Extension du vocabulaire d'éléments si requis (`AGENT`, `SCORE`, `RULE`, `PATTERN`, `ALGORITHM`).
- Primitives visuelles `algorithm` et `comparison` si requis par les trois chapitres.
- Chapitres 330, 232, 233 produits **de bout en bout sans intervention manuelle**.

**Critères de sortie.**

- Stabilité : deux exécutions produisent le même inventaire (mêmes KP, mêmes IDs).
- Complétude : tous les segments portent une disposition ; taux de `missed` publié.
- Première mesure réelle du coût LLM et du temps humain par chapitre — dans [`PROJECT_STATE.md`](PROJECT_STATE.md).
- Pour chaque archétype test : le résultat apporte-t-il plus qu'une bonne présentation du contenu officiel ?

**Inventory — statut à la fin de Phase 2**

- `inventory_schema_version: 1` — schéma **stable** pour Cardio V1.
- Évolutions **additives et rattrapables** (nouveau champ avec défaut, nouveau membre d'énumération) : permises, n'incrémentent pas la version.
- Évolutions **sémantiques ou non rattrapables** : incrémentent la version, justification écrite obligatoire.

**Ne pas faire.** Générer au-delà des 3 chapitres tests ; interface d'administration ; scripts `build/*.mjs` par chapitre ; optimiser les coûts avant de les mesurer ; perfectionner la pédagogie des chapitres tests (régénération en Phase 3).

---

### Phase 3 (historique) — Cardio V1 → *EDN Scale-out (cardio)*

> **Remapping Phase 1 Industrialisation :** ce chantier correspond au pilier **EDN Scale-out** (périmètre cardio).

**Objectif.** Produire le Collège de cardiologie complet avec couche de compréhension, industriellement.

**Pourquoi.** Objectif immédiat déclaré ; premier test d'échelle réel.

**Livrables.**

- Tous les chapitres cardio publiés (projections, visuels, traçabilité).
- Renderer complet : officiel + compréhension + schémas + annotations.
- Liens inter-chapitres ; discipline terminologique minimale.

**Critères de sortie.**

- Effort humain par chapitre **minimal** — mesuré dans [`PROJECT_STATE.md`](PROJECT_STATE.md).
- Coût par chapitre **mesuré et stable**.
- Lou révise le cardio dans l'outil, pas dans le Collège papier.

**⛔ Gel — fin de Phase 3**

> **Le contrat du manifeste est figé.** Toute rupture impose une migration explicite.

**Ne pas faire.** Corriger un artefact à la main ; commencer un 2ᵉ collège ; couche de maîtrise ; nouvelles primitives sans double demande inter-chapitres.

---

### Phase 4 (historique) — L'Épreuve → *Phase 2 roadmap*

> **Remapping :** devient **Phase 2 — Validation pédagogique** dans la vue d'ensemble § 5.

**Objectif.** Répondre : **la méthode enseigne-t-elle réellement mieux ?**

**Pourquoi.** Dernier moment où la réponse peut changer la direction avant l'échelle.

**Livrables.** Réponse écrite et datée à quatre questions : compréhension ; archétypes à faible valeur ; usage des projections ; manque-t-il la récupération active ?

**Critères de sortie.** Décision explicite : *poursuivre* / *poursuivre avec modification nommée* / *modifier la méthode avant l'échelle*.

**Ne pas faire.** Refonte ; sauter la phase parce que le pipeline fonctionne ; corriger tout ce que Lou signale (ne retenir que ce qui se répète).

---

### Phase 5 (historique) — L'Échelle → *EDN Scale-out (multi-collèges)*

> **Remapping :** extension du pilier **EDN Scale-out** ; devient **Phase 3 — Échelle EDN** dans la vue d'ensemble § 5.

**Objectif.** Prouver la portabilité hors cardio ; produire l'ensemble des collèges EDN.

**Pourquoi.** Le pipeline d'acquisition n'a été qualifié que pour un format et un collège ; les autres collèges ont d'autres mises en page, parfois d'autres formats source, et d'autres archétypes de connaissance.

**Livrables.**

- 2ᵉ collège (dissemblance maximale avec la cardio) produit de bout en bout.
- Production des collèges restants.
- Renderer multi-collèges avec recherche transversale.

**Critères de sortie.**

- 2ᵉ collège produit avec effort humain **minimal**, **sans modification du schéma d'Inventory**.
- Métriques dans [`PROJECT_STATE.md`](PROJECT_STATE.md).

**⛔ Gel transversal — fin de Phase 5 (après 2ᵉ collège validé)**

> **Schéma d'Inventory gelé.** Plus aucune évolution non rattrapable.

**Ne pas faire.** Lancer plusieurs collèges en parallèle avant validation du 2ᵉ ; CMS ; ouverture à d'autres utilisateurs.

---

### Phase 6 (historique) — Régime permanent → *Phase 4 roadmap*

> **Remapping :** devient **Phase 4 — Régime permanent** dans la vue d'ensemble § 5.

**Objectif.** Le projet cesse d'être un projet ; il devient un système auto-maintenu.

**Livrables.**

- Mises à jour d'édition incrémentales (diff de segments, régénération ciblée, badges nouveau/modifié).
- Couche de maîtrise **si et seulement si** la Phase 4 l'a exigée.
- Réduction de la dette (code mort, primitives inutilisées).

**Ne pas faire.** Plateforme médicale généraliste ; tuteur conversationnel en chat (casserait la traçabilité).

---

## 7. Tableau de bord

Cinq indicateurs structurels. Les **cibles numériques** et les **mesures courantes** sont maintenues dans [`PROJECT_STATE.md`](PROJECT_STATE.md).

| Indicateur | Ce qui est suivi |
|---|---|
| **Effort humain / chapitre publié** | Minutes d'intervention humaine (exceptions machine uniquement) |
| **Complétude source** | Segments avec disposition prouvée par code |
| **Grounding déterministe** | Part des claims sourcés vérifiés sans LLM |
| **Reproductibilité du build** | Artefacts textuels : égalité binaire en CI |
| **Décisions humaines / chapitre** | Compteur, tendance décroissante |

### Reproductibilité du build

Le build est une fonction pure de ses entrées versionnées :

- **Binaire (défaut)** — JSON, YAML, Markdown, SVG. Test : égalité octet pour octet.
- **Canonique (exception)** — artefacts feuilles dépendant d'outils externes (images rastérisées). Test : forme canonique déclarée en code (région source + hash perceptuel). Un artefact n'est feuille que si aucun étage aval ne consomme ses octets.

---

## 8. État actuel

**Ne pas maintenir l'état opérationnel dans ce document.**

La photographie vivante du projet — phase active, chantier, risques, métriques, jalons — est dans **[`PROJECT_STATE.md`](PROJECT_STATE.md)**, mis à jour régulièrement.

Ce roadmap reste **stable** ; l'état du projet **évolue**.

---

## 9. Philosophie du projet

Lou Médecine progresse par **suppression des risques**, pas par accumulation de code.

Chaque phase retire une classe de risque dans l'ordre où l'ignorer coûterait le plus cher. Le renderer est en avance ; la couche canonique et le pipeline sémantique sont en retard. C'est l'ordre correct : la partie qui demandait de l'intelligence est faite ; celle qui demande de la discipline reste à faire.

Le succès se mesure à une question :

> **Est-ce que cette décision rapproche Lou d'un outil exceptionnel tout en réduisant le coût de construction et de maintenance ?**

Si la réponse est non, la décision attend.

---

## Documents connexes

| Document | Rôle |
|---|---|
| [`PROJECT_STATE.md`](PROJECT_STATE.md) | État courant, métriques, risques — **document vivant** |
| [`LLM_STRATEGY.md`](LLM_STRATEGY.md) | Usage des modèles — **stratégie évolutive** |
| [`SOURCE_OF_TRUTH.md`](SOURCE_OF_TRUTH.md) | Chaîne officielle FIL B, SSOT, statut FIL A legacy |
| [`adr/ADR-004-acquisition-architecture-frozen.md`](adr/ADR-004-acquisition-architecture-frozen.md) | Gel architecture acquisition — fin R&D |
| [`releases/acquisition-rd-complete.md`](releases/acquisition-rd-complete.md) | Jalon historique sortie R&D acquisition |
| [`acquisition/industrialization-plan.md`](acquisition/industrialization-plan.md) | Feuille de route Phase 1 Industrialisation |
| [`SOURCE_PIPELINE_QUALIFICATION.md`](SOURCE_PIPELINE_QUALIFICATION.md) | Grille P1–P7 (Phase P clôturée) |
| [`SOURCE_FORMAT_COMPARATIVE.md`](SOURCE_FORMAT_COMPARATIVE.md) | Analyse comparative des formats source EDN |
| [`acquisition/`](acquisition/) | Dossier de qualification rejouable — produit en Phase P |
| `IMPLEMENTATION_CONTRACT.md` | Contrat d'implémentation détaillé |
| `FINAL_ARCHITECTURE.md` | Architecture de référence |
| `VISUAL_GRAMMAR_CONTRACT.md` | Contrat visuel normatif |
| `00-foundation/principles.md` | Principes immuables |

Les contrats techniques précisent l'implémentation ; **ce roadmap pilote les priorités**.
