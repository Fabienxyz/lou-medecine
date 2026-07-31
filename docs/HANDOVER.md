# Lou Médecine — Handover agent IA

| | |
|---|---|
| **Type** | Point d'entrée opérationnel — **informatif** |
| **Statut** | Document d'accueil — 2026-07-31 |
| **Autorité** | **Aucune** — vue synthétique uniquement |
| **En cas de conflit** | [`MASTER_ROADMAP.md`](MASTER_ROADMAP.md), [`PROJECT_STATE.md`](PROJECT_STATE.md), [`governance/EXECUTION_MODE_V1.md`](governance/EXECUTION_MODE_V1.md), ADR et contrats font foi |

Ce document accélère la reprise du projet par un agent IA (Cursor, Claude Code, ChatGPT, Codex, etc.) après une interruption. Il **ne crée aucune règle** et **ne remplace aucun document normatif**.

**Tenue à jour :** lorsque les sections 2 à 4 ne reflètent plus [`PROJECT_STATE.md`](PROJECT_STATE.md), mettre à jour HANDOVER **en même temps** que PROJECT_STATE — ou signaler l'écart au propriétaire.

---

## 1. Présentation du projet

**Lou Médecine** transforme les Collèges officiels EDN en supports d'étude personnels pour Lou. L'objectif pédagogique : **comprendre avant de mémoriser**, sans jamais altérer le contenu médical source. Le Collège reste l'autorité ; Lou Médecine ajoute une couche de compréhension (structure, projections, schémas, guides de lecture, évaluation).

**Philosophie :** progresser par suppression des risques, pas par accumulation de code. Chaque livraison doit rapprocher Lou d'un outil d'étude exceptionnel tout en réduisant le coût de construction et de maintenance.

**Fidélité :** traçabilité source → claim → projection ; réconciliation documentée ; gates automatiques avant publication. Aucune invention médicale ; fallback conservateur si doute.

**Architecture générale (trois piliers) :**

| Pilier | Rôle | Emplacement typique |
|---|---|---|
| **La Fabrique** | Produit et valide les Chapter Packages (pipeline `lou-build`, stages A–K) | `tools/lou-build/`, `01-learning/chapters/` |
| **Chapter Package** | Unité publiée : source officielle + inventory + blueprint + projections + QCM/cas + visuels | ex. `01-learning/chapters/cardio/234/` |
| **Reader V1** | Application locale de lecture et d'étude (7 vues, annotations, offline) | `demo/renderer/` (spec : `docs/renderer/14–19`) |

La **Fabrique productrice autonome** (runtime LLM de bout en bout) est un objectif **ultérieur** — distinct du pipeline validateur déjà en production.

---

## 2. État actuel

> Résumé de [`PROJECT_STATE.md`](PROJECT_STATE.md) au 2026-07-31. Pour les valeurs à jour, **toujours** lire PROJECT_STATE.

| | |
|---|---|
| **Phase** | Execution Mode V1 — livraison roadmap V1 en cours |
| **Dernier jalon atteint** | **Reader Composition V1 clôturée** (Lots A–F) — audit indépendant ✅ Conforme ; package 234 Release `complete` (81 QCM + 3 scénarios) |
| **Objectif actif** | **Reader Acceptance V1** — critères d'acceptation sur package 234 complet ([PDR-B1](governance/PRODUCT-DECISION-REGISTRY.md), [PDR-B5](governance/PRODUCT-DECISION-REGISTRY.md)) |
| **Instance courante** | Package 234 **complet** ; Composition en production ; **le Reader n'est pas terminé** |

**Acquis majeurs (terminés) :** gouvernance et contrats fondamentaux 01–09 · architecture éditoriale V1 gelée · acquisition FIL B gelée · pipeline validateur lou-build · **Reader Composition V1** (Spec → Engine → ViewModel → Renderer ; manifests neutres) · package 234 Release `complete`.

**Non confondre :** clôture **Composition V1** ≠ Reader terminé ; clôture **Composition V1** ≠ acceptation Reader V1.

---

## 3. Chemin critique

**Prochain jalon :** **Reader Acceptance V1** — prononcer l'acceptation Reader sur le package 234 complet.

**Étape immédiate :** satisfaire les critères [PDR-B1](governance/PRODUCT-DECISION-REGISTRY.md)/[PDR-B5](governance/PRODUCT-DECISION-REGISTRY.md) et domaine D/E — 7 vues alimentées, offline, patrimoine, recherche, sauvegarde/restauration.

**Pourquoi c'est le goulet :** le package de capitalisation de référence est **publié** (Release `complete`). Le goulet est désormais l'**acceptation produit** du Reader :

| Bloqué à l'acceptation |
|---|
| Validation pédagogique Lou |
| Fixture CI de non-régression (co-requis) |
| Industrialisation Fabrique productrice |

**Outcome attendu :** Reader V1 accepté sur package 234 → débloque validation Lou, fixture CI, modèle pour l'industrialisation.

**Points d'entrée code :** [`demo/renderer/`](../../demo/renderer/) (Reader) · [`01-learning/chapters/cardio/234/`](../../01-learning/chapters/cardio/234/) (package de référence)

---

## 4. Chantiers parallèles

Ces chantiers sont **officiellement autorisés en parallèle** du chemin critique. Le package de référence étant publié, l'acceptation Reader reste le critère bloquant pour validation Lou et industrialisation.

| Chantier | Focus actuel | Limite |
|---|---|---|
| **Reader Acceptance V1** | Phase **active** — critères acceptation sur package 234 ; alimentation 7 vues, offline, patrimoine | **Le Reader n'est pas terminé** — acceptation non prononcée ([PDR-B1](governance/PRODUCT-DECISION-REGISTRY.md)) |
| **Patrimoine & publication V1** | Modèle publication, version package, persistance ([ADR-006](adr/ADR-006-pedagogical-patrimony-and-edition-lineage.md)) | Co-vérifié à l'acceptation Reader |
| **CI & maintenabilité** | Fixture package 234 ; non-régression pipeline ([PDR-G6](governance/PRODUCT-DECISION-REGISTRY.md)) | CI non opérationnelle comme exigence de sortie |
| **Capitalisation Item 234** | Release `complete` (81 QCM + 3 cas) | **Clôturé** — extension optionnelle (7 KP mastery) |
| ~~Reader Composition V1~~ | ~~Lots A–F~~ | **Clôturé** — voir [`READER-COMPOSITION-V1-FREEZE.md`](renderer/READER-COMPOSITION-V1-FREEZE.md) |

**Risque de dérive à éviter :** scale-out (multi-chapitres partiels), repriorisation locale du Reader ou de l'industrialisation avant **acceptation Reader V1** ([PDR-C2](governance/PRODUCT-DECISION-REGISTRY.md)).

---

## 5. Mode d'exécution

Résumé de [`governance/EXECUTION_MODE_V1.md`](governance/EXECUTION_MODE_V1.md) — le document source fait autorité.

| | |
|---|---|
| **Propriétaire** | Décisions produit, architecture, roadmap, arbitrages de périmètre |
| **Agent** | Implémentation, qualité, tests ; tient [`PROJECT_STATE.md`](PROJECT_STATE.md) à jour |

- **Roadmap** = intention (objectifs, ordre, critères de sortie) → [`MASTER_ROADMAP.md`](MASTER_ROADMAP.md)
- **PROJECT_STATE** = observation (où en est-on, blocages, indicateurs)
- Avant toute implémentation : vérifier **en interne** que la tâche sert l'objectif actif — sans rapport systématique
- **Signaler une dérive** uniquement si une proposition modifierait objectifs, périmètre V1, critères de sortie ou décisions actées — puis attendre la décision du propriétaire
- **Ne jamais** modifier roadmap, gouvernance stabilisée ou décisions actées sans instruction explicite
- En fin de session : mettre PROJECT_STATE à jour si l'avancement a changé, **avant** de proposer un commit

---

## 6. Documents de référence

Consulter **selon le besoin** — pas de lecture systématique avant chaque tâche.

| Document | Rôle |
|---|---|
| [`MASTER_ROADMAP.md`](MASTER_ROADMAP.md) | Intention : objectifs V1, séquencement, critères de sortie, dépendances |
| [`PROJECT_STATE.md`](PROJECT_STATE.md) | État courant : objectif actif, chantiers, blocages, indicateurs — **journal de bord** |
| [`governance/EXECUTION_MODE_V1.md`](governance/EXECUTION_MODE_V1.md) | Comportement attendu des agents pendant la livraison V1 |
| [`governance/DOCUMENT_ARCHITECTURE.md`](governance/DOCUMENT_ARCHITECTURE.md) | Organisation du pilotage ; hiérarchie documentaire |
| [`governance/PRODUCT-DECISION-REGISTRY.md`](governance/PRODUCT-DECISION-REGISTRY.md) | Mémoire des arbitrages produit — le *pourquoi* d'une décision |
| [`contracts/00-INDEX.md`](contracts/00-INDEX.md) | Index des obligations techniques (contrats 01–09, composants) |
| [`contracts/04-CHAPTER-PACKAGE.md`](contracts/04-CHAPTER-PACKAGE.md) | Obligations d'un Chapter Package publié |
| [`contracts/07-ASSESSMENT-QUESTION.md`](contracts/07-ASSESSMENT-QUESTION.md) | Question d'évaluation (QCM) — architecture éditoriale V1 |
| [`contracts/08-RELEASE-EDITORIAL-ARCHITECTURE.md`](contracts/08-RELEASE-EDITORIAL-ARCHITECTURE.md) | Release, complétude, absences, republication |
| [`contracts/09-CLINICAL-SCENARIO.md`](contracts/09-CLINICAL-SCENARIO.md) | Scénario clinique — architecture éditoriale V1 |
| [`renderer/16-CONTENT-TO-READER-ARCHITECTURE.md`](renderer/16-CONTENT-TO-READER-ARCHITECTURE.md) | Frontière package publié ↔ Reader ; composition des 7 vues |
| [`adr/README.md`](adr/README.md) | Index des Architecture Decision Records |
| [`renderer/READER-COMPOSITION-V1-FREEZE.md`](renderer/READER-COMPOSITION-V1-FREEZE.md) | Gel architecture Composition V1 — clôturée |
| [`governance/COMPOSITION-IMPLEMENTATION-DEBT.md`](governance/COMPOSITION-IMPLEMENTATION-DEBT.md) | Dette Composition — clôturée (Lots A–F) |
| [`renderer/10-MIGRATION_PLAN.md`](renderer/10-MIGRATION_PLAN.md) | Plan de migration Reader — détail d'exécution |
| [`START_HERE.md`](../START_HERE.md) | Parcours de lecture humain / approfondissement gouvernance |

---

## 7. Reprendre le projet

Lorsque le propriétaire dit *« On reprend le projet »* (ou *« Continue »*, *« le lot en cours »*) :

1. **Lire ce HANDOVER** — vue d'ensemble en une passe.
2. **Lire [`PROJECT_STATE.md`](PROJECT_STATE.md)** — valeurs à jour, blocages réels, prochaines étapes.
3. **Identifier le chemin critique** — objectif actif et premier blocage (section 3 ci-dessus ; confirmer dans PROJECT_STATE).
4. **Reprendre l'exécution** — contribuer à l'objectif actif ou à un chantier parallèle autorisé, sans repriorisation locale.
5. **Consulter les docs normatifs pertinents** à la tâche (contrat, ADR, spec) — pas toute la gouvernance.
6. **Proposer des alternatives** uniquement si elles relèvent d'une **décision du propriétaire** (changement de périmètre, roadmap, arbitrage produit).
7. **Mettre à jour PROJECT_STATE** si l'avancement, un blocage ou un indicateur a changé — puis proposer commit si demandé.

**Formulation minimale côté propriétaire :** *« On reprend le lot en cours. »* — l'agent infère le contexte sans redemander toute la gouvernance.

**Après la V1 :** séquence post-livraison (diff éditorial, industrialisation, scale cardio/EDN) → [`MASTER_ROADMAP.md`](MASTER_ROADMAP.md) § Objectifs du projet.

---

## Maintenabilité — sections synchronisables

Sans implémenter d'automatisation, les sections suivantes **risquent de diverger** si PROJECT_STATE évolue sans mise à jour de HANDOVER :

| Section HANDOVER | Source naturelle | Recommandation |
|---|---|---|
| §2 État actuel | `PROJECT_STATE` § Situation, § Acquis | Resynthétiser à chaque jalon majeur |
| §3 Chemin critique | `PROJECT_STATE` § Situation, § Prochaines étapes (étapes 1–2) | Mettre à jour quand objectif actif ou blocage change |
| §4 Chantiers parallèles | `PROJECT_STATE` § Chantiers en cours | Mettre à jour quand un chantier démarre, close ou change de focus |

Les sections **§1, §5, §6, §7** restent stables ; seuls des liens ou renvois ponctuels peuvent changer.

**Règle simple :** si tu modifies PROJECT_STATE pour un jalon, blocage ou chantier → vérifier en 2 minutes que HANDOVER §2–§4 restent cohérents.

---

*Handover initial — 2026-07-30 ; synchronisé 2026-07-31 (clôture Reader Composition V1 ; phase active Reader Acceptance V1). Non normatif.*
