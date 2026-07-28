# Lou Médecine — Master Roadmap

Document de pilotage officiel du projet.  
**Dernière mise à jour :** 2026-07-28 (clôture Phase 3.5 — La Fabrique terminée)

Ce document est la **référence officielle pour le pilotage** du projet. Il définit les objectifs, le séquencement, les priorités et les critères de réussite.

Les documents d'architecture et les contrats techniques (`IMPLEMENTATION_CONTRACT.md`, `FINAL_ARCHITECTURE.md`, `VISUAL_GRAMMAR_CONTRACT.md`, etc.) définissent les **comportements attendus** de l'implémentation. Les **contrats fondamentaux** [`docs/contracts/01–06`](contracts/00-INDEX.md) constituent la **référence normative de gouvernance** du projet depuis la clôture de la Phase 0A (2026-07-28). Toute évolution future doit préserver leur cohérence ; toute rupture d'invariant passe par un ADR explicite.

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

### Architecture v1 — GELÉE

Les documents suivants constituent désormais l'architecture officielle de Lou Médecine :

- Contrats fondamentaux 01–06 ([`contracts/00-INDEX.md`](contracts/00-INDEX.md))
- [Reader Architecture](renderer/14-LOU-READER-ARCHITECTURE.md)
- [Reader Functional Specification](renderer/15-READER-FUNCTIONAL-SPECIFICATION.md)
- [Publication ↔ Reader](renderer/16-CONTENT-TO-READER-ARCHITECTURE.md)
- [Publication Model](renderer/17-PUBLICATION-MODEL.md)
- [Build Architecture](renderer/18-BUILD-ARCHITECTURE.md)
- [Build Pipeline](renderer/19-BUILD-PIPELINE.md)

Cette architecture est désormais considérée comme **stable**.

Toute évolution future devra être motivée par un besoin démontré pendant l'implémentation.

Toute modification substantielle nécessitera une nouvelle révision explicite.

**Chaîne documentaire :** contrats 01–06 → 14 → 15 → 17 → 18 → 19 → 16.

### Séquencement produit

| Phase | Intitulé | Statut | Objectif | Principal livrable |
|---|---|---|---|---|
| **0 — Fondations** | Contrats, acquisition, gouvernance | ✅ **Terminée** | Fondations immuables | Chaîne FIL B + contrats 01–06 + ADR-004 |
| **1 — Le Lecteur** | Architecture Reader v1 | ✅ **Terminée** | Vision et spec fonctionnelle du Reader | Docs [14](renderer/14-LOU-READER-ARCHITECTURE.md)–[15](renderer/15-READER-FUNCTIONAL-SPECIFICATION.md) |
| **2 — La Fabrique — Architecture** | Publication et build | ✅ **Terminée** | Modèle de publication, architecture et pipeline | Docs [16](renderer/16-CONTENT-TO-READER-ARCHITECTURE.md)–[19](renderer/19-BUILD-PIPELINE.md) |
| **3 — Implémentation de lou-build** | Pipeline Migration | ✅ **Terminée** | Engine v1 + stages typés A–K | Tag [`lou-build-pipeline-v1`](releases/phase-3.4-batch-migration-g-k.md) |
| **3.5 — Legacy Removal / Cutover** | Production cutover | ✅ **Terminée** | Retrait legacy, cutover production | [`phase-3.5-completion-report.md`](releases/phase-3.5-completion-report.md) |
| **— La Fabrique (ensemble)** | Architecture + build + cutover | ✅ **Terminée** | Pipeline unique de production | Phases 2 + 3 + 3.5 |
| **1 — Le Lecteur (production)** | Expérience apprenant | **Active** | Lecteur multi-chapitres, retrait fallbacks | Docs [14](renderer/14-LOU-READER-ARCHITECTURE.md)–[15](renderer/15-READER-FUNCTIONAL-SPECIFICATION.md) |
| **4 — Validation pédagogique** | Preuve pédagogique | À venir | Prouver que la méthode enseigne mieux | Décision écrite Phase 4 |
| **5 — Échelle EDN** | Multi-collèges | À venir | Production EDN | Production EDN |
| **6 — Régime permanent** | Maintenance éditions | À venir | Système auto-maintenu | Système auto-maintenu |

**Chemin critique actuel :** **Le Lecteur (production)** → Phase 4 → Phase 5 → Phase 6.

> **Jalon (2026-07-28).** **La Fabrique terminée** — Phases 2 + 3 + 3.5 close ; pipeline typé unique en production.  
> **Jalon (2026-07-28).** Prochaine priorité : **Le Lecteur**. Détail : [`PROJECT_STATE.md`](PROJECT_STATE.md) · [`releases/phase-3.5-completion-report.md`](releases/phase-3.5-completion-report.md).

---

## 6. Les phases

### Phase 0 — Fondations ✅ TERMINÉE

> **Ancien intitulé :** Phase 0 — Architecture & Acquisition.

**Objectif.** Établir et valider les fondations immuables du projet : gouvernance, source de vérité, pipeline d'acquisition, qualification et gel architectural.

**Statut.** **Terminée** — 2026-07-28. Référence historique : [`releases/acquisition-rd-complete.md`](releases/acquisition-rd-complete.md).

| Jalon | Statut | Référence |
|---|---|---|
| **Phase 0A — Contrats fondamentaux** | ✅ | [`contracts/00-INDEX.md`](contracts/00-INDEX.md), [`governance/PHASE_0A_COMPLETION.md`](governance/PHASE_0A_COMPLETION.md) |
| Gouvernance projet | ✅ | [`MASTER_ROADMAP.md`](MASTER_ROADMAP.md), [`PROJECT_STATE.md`](PROJECT_STATE.md) |
| Single Source of Truth (FIL B) | ✅ | [ADR-003](adr/ADR-003-single-source-of-truth.md), [`SOURCE_OF_TRUTH.md`](SOURCE_OF_TRUTH.md) |
| Tool 01 v1.0.0 qualifié | ✅ | [`qualification-report-tool01-p1.md`](acquisition/qualification-report-tool01-p1.md) |
| Tool 02 v1.0.0 qualifié | ✅ | Manifest Tool 02, 22 chapitres |
| Phase P — qualification P1–P7 | ✅ | [`qualification-report-acquisition-final.md`](acquisition/qualification-report-acquisition-final.md) |
| Phase 0B — dérivation Collège | ✅ | [`qualification-report-phase-0b.md`](acquisition/qualification-report-phase-0b.md) |
| Double vertical slice (234 + 330) | ✅ | Migration 234 FIL B ; package 330 FIL B |
| Architecture Frozen (acquisition) | ✅ | [ADR-004](adr/ADR-004-acquisition-architecture-frozen.md) |

**Mode maintenance.** La couche acquisition est **gelée**. Évolutions limitées aux cas ADR-004 § 6 (bug bloquant, nouveau format source, nouvel ADR).

**⛔ Gel acté — ADR-004**

> Tool 01 v1.0.0 · Tool 02 v1.0.0 · FIL B · modèle d'ancres · grille P1–P7 — **socle officiel immuable**.

---

### Phase 1 — Le Lecteur ✅ TERMINÉE

**Objectif.** Définir l'architecture et la spécification fonctionnelle du Reader v1.0 — vision pédagogique, principes, écrans et parcours.

**Statut.** **Terminée** — 2026-07-28.

| Jalon | Statut | Référence |
|---|---|---|
| Reader Architecture v1.0 | ✅ | [`renderer/14-LOU-READER-ARCHITECTURE.md`](renderer/14-LOU-READER-ARCHITECTURE.md) |
| Reader Functional Specification v1.0 | ✅ | [`renderer/15-READER-FUNCTIONAL-SPECIFICATION.md`](renderer/15-READER-FUNCTIONAL-SPECIFICATION.md) |

---

### Phase 2 — La Fabrique — Architecture ✅ TERMINÉE

**Objectif.** Définir le modèle de publication, l'architecture conceptuelle de La Fabrique, le pipeline opérationnel et la frontière publication ↔ Reader.

**Statut.** **Terminée** — 2026-07-28.

| Jalon | Statut | Référence |
|---|---|---|
| Publication Model | ✅ | [`renderer/17-PUBLICATION-MODEL.md`](renderer/17-PUBLICATION-MODEL.md) |
| Build Architecture | ✅ | [`renderer/18-BUILD-ARCHITECTURE.md`](renderer/18-BUILD-ARCHITECTURE.md) |
| Build Pipeline | ✅ | [`renderer/19-BUILD-PIPELINE.md`](renderer/19-BUILD-PIPELINE.md) |
| Content → Reader | ✅ | [`renderer/16-CONTENT-TO-READER-ARCHITECTURE.md`](renderer/16-CONTENT-TO-READER-ARCHITECTURE.md) |

---

### Phase 3 — Implémentation de lou-build ✅ TERMINÉE *(Pipeline Migration)*

> **Remapping :** correspond à l'ancienne **Phase 1 — Industrialisation** pour la partie **outil de build**. Le scale-out industriel (22 chapitres, factories) reste planifié **post-Fabrique**.

**Objectif (atteint).** Porter lou-build d'une orchestration monolithique vers un **Pipeline Engine v1** générique, un **BuildContext** figé, et **onze stages typés A–K**, avec parité legacy et CLI typée par défaut.

**Statut.** **Terminée** — 2026-07-28. Tag : `lou-build-pipeline-v1`. Jalon : [`releases/phase-3.4-batch-migration-g-k.md`](releases/phase-3.4-batch-migration-g-k.md).

| Sous-phase | Contenu | Statut |
|---|---|---|
| **3.1** | Engine freeze + Stage A | ✅ |
| **3.2** | Stage B (Package Input) | ✅ |
| **3.3** | Stages C → F | ✅ |
| **3.4** | Stages G → K + audit + correctif F1 + clôture | ✅ |

**Livrables gelés.**

- Pipeline Engine v1 (`src/pipeline/`) — figé
- BuildContext — figé
- Stages A–K typés (`src/stages/`)
- Legacy retiré en Phase 3.5 (wrappers, CLI legacy, orchestration monolithique)
- Tests : 117/117 PASS post-cutover · validate/build Item 234+330 PASS
- Invalidation manifest en début de build (F1) restaurée sur la CLI typée

**Ne pas faire.** Modifier le Pipeline Engine sans révision explicite ; rouvrir la migration A→K ; rouvrir la R&D acquisition ; modifier l'architecture gelée (docs 14–19) sans révision explicite.

---

### Phase 3.5 — Legacy Removal / Production Cutover ✅ TERMINÉE

**Objectif (atteint).** Retirer le filet legacy et basculer définitivement sur la CLI typée / stages `src/` comme unique chemin de production.

**Statut.** **Terminée** — 2026-07-28. Jalon : [`releases/phase-3.5-completion-report.md`](releases/phase-3.5-completion-report.md). Commits : `ca5782c` · `575fc51` · `bb711c7`.

| Lot | Contenu | Statut |
|---|---|---|
| **Lot 1** | Wrappers de stage + tests de parité | ✅ |
| **Lot 2** | `cli.js` + scripts `*:legacy` | ✅ |
| **Lot 3** | `runValidation`/`runBuild` + migration `slice.test.ts` | ✅ |

**Critères de sortie — atteints.**

- Chemin unique : `npm run validate` / `build` → `src/cli/build.ts`
- Legacy d'orchestration retiré ; modules métier `lib/` conservés
- Tests métier verts sans dépendance aux wrappers de parité

**La Fabrique est terminée** (Phases 2 architecture + 3 implémentation + 3.5 cutover).

---

### Le Lecteur — production *(phase active)*

**Objectif.** Porter `demo/renderer/` vers un lecteur de production multi-chapitres conforme aux specs gelées (docs 14–15), avec retrait progressif des fallbacks legacy (ADR-002).

**Référence.** [`PROJECT_STATE.md`](PROJECT_STATE.md) · [`renderer/13-ROADMAP.md`](renderer/13-ROADMAP.md) · [`renderer/10-MIGRATION_PLAN.md`](renderer/10-MIGRATION_PLAN.md).

**Hors périmètre immédiat.** Scale-out industriel 22 chapitres (Inventory / Blueprint Factory) — voir [`acquisition/industrialization-plan.md`](acquisition/industrialization-plan.md).

---

### Détail historique — sous-phases d'industrialisation

Les sections ci-dessous conservent le **détail opérationnel** des chantiers prévus avant la restructuration Phase 0–3. Elles restent valides comme sous-chantiers d'industrialisation **après** la clôture de La Fabrique (Phase 3.5).

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

#### 0A — Contrats fondamentaux ✅ TERMINÉE

**Objectif.** Consolider les obligations durables du projet en contrats fondamentaux irréversibles — fidélité, identité, acquisition, chapter package, grammaire visuelle, renderer lecteur.

**Statut.** **Terminée** — 2026-07-28. Rapport de clôture : [`governance/PHASE_0A_COMPLETION.md`](governance/PHASE_0A_COMPLETION.md).

**Livrables réalisés.**

- Six contrats fondamentaux (`docs/contracts/01–06`) — chacun répond à **une question unique**.
- Index documentaire et hiérarchie de gouvernance ([`contracts/00-INDEX.md`](contracts/00-INDEX.md)).
- Audit transversal de cohérence et corrections documentaires ([`PHASE_0A_CONTRACT_AUDIT.md`](PHASE_0A_CONTRACT_AUDIT.md)).

**Critères de sortie — atteints.**

- Gouvernance fondamentale **stable** et **gelée** (maintenance documentaire uniquement).
- Hiérarchie explicite : ADR → contrats fondamentaux → contrats composants → documentation technique → code.
- Aucune duplication normative entre contrats ; renvois anti-duplication en place.

**⛔ Gel — fin de Phase 0A**

> **Les contrats fondamentaux 01–06 sont la référence normative de gouvernance.** `IMPLEMENTATION_CONTRACT.md` et `VISUAL_GRAMMAR_CONTRACT.md` restent des références détaillées, subordonnées aux contrats 01–06 pour les règles métier.

**Ne pas faire.** Modifier un invariant fondamental sans ADR ; dupliquer une règle déjà définie dans un contrat 01–06 ; confondre gouvernance et implémentation.

**Hors périmètre Phase 0A (volontaire).** Contrats composants Tool 03–05, build reproductible byte-identique, CI — relèvent des phases post-Fabrique (Lecteur, industrialisation).

---

#### 0A (historique) — Contrats fondamentaux *(détail opérationnel initial — conservé)*

> **Statut :** remplacé par la section ci-dessus. Ce bloc conserve le cadrage initial des livrables techniques prévus en parallèle de l'industrialisation.

**Objectif initial.** Poser les contrats irréversibles et rendre le build fiable.

**Livrables techniques restants (Phase 1).**

- Modèle d'ancre étendu : `quote`, `table-cell`, `figure`, `section` (chemin désambiguïsé).
- CI ; tests isolés (plus de mutation du chapitre canonique).
- Purge des littéraux item 234 dans le code générique.
- Build reproductible des artefacts textuels en CI.

**⛔ Gel — modèle d'ancre (inchangé)**

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
| [`contracts/00-INDEX.md`](contracts/00-INDEX.md) | **Contrats fondamentaux 01–06** — gouvernance normative ; § 6 architecture de référence |
| [`renderer/README.md`](renderer/README.md) | **Architecture de référence gelée** — docs 14–19 |
| [`renderer/19-BUILD-PIPELINE.md`](renderer/19-BUILD-PIPELINE.md) | Pipeline opérationnel cible de lou-build |
| [`governance/PHASE_0A_COMPLETION.md`](governance/PHASE_0A_COMPLETION.md) | Clôture officielle Phase 0A |
| [`PROJECT_STATE.md`](PROJECT_STATE.md) | État courant, métriques, risques — **document vivant** |
| [`LLM_STRATEGY.md`](LLM_STRATEGY.md) | Usage des modèles — **stratégie évolutive** |
| [`SOURCE_OF_TRUTH.md`](SOURCE_OF_TRUTH.md) | Chaîne officielle FIL B, SSOT, statut FIL A legacy |
| [`adr/ADR-004-acquisition-architecture-frozen.md`](adr/ADR-004-acquisition-architecture-frozen.md) | Gel architecture acquisition — fin R&D |
| [`releases/acquisition-rd-complete.md`](releases/acquisition-rd-complete.md) | Jalon historique sortie R&D acquisition |
| [`releases/phase-3.4-batch-migration-g-k.md`](releases/phase-3.4-batch-migration-g-k.md) | Jalon Phase 3 — Pipeline Migration close (`lou-build-pipeline-v1`) |
| [`acquisition/industrialization-plan.md`](acquisition/industrialization-plan.md) | Feuille de route scale-out industriel (post-Fabrique) |
| [`SOURCE_PIPELINE_QUALIFICATION.md`](SOURCE_PIPELINE_QUALIFICATION.md) | Grille P1–P7 (Phase P clôturée) |
| [`SOURCE_FORMAT_COMPARATIVE.md`](SOURCE_FORMAT_COMPARATIVE.md) | Analyse comparative des formats source EDN |
| [`acquisition/`](acquisition/) | Dossier de qualification rejouable — produit en Phase P |
| `IMPLEMENTATION_CONTRACT.md` | Contrat d'implémentation détaillé |
| `FINAL_ARCHITECTURE.md` | Architecture de référence |
| `VISUAL_GRAMMAR_CONTRACT.md` | Contrat visuel normatif |
| `00-foundation/principles.md` | Principes immuables |

Les contrats techniques précisent l'implémentation ; **ce roadmap pilote les priorités**.
