# Phase 0A — Clôture officielle de la gouvernance fondamentale

**Type :** rapport de clôture de phase  
**Date de clôture :** 2026-07-28  
**Statut :** Phase 0A **terminée**

Ce document constitue le **rapport officiel de clôture** de la Phase 0A — Gouvernance fondamentale. Il ne remplace aucun contrat ; il enregistre le résultat obtenu et les principes désormais considérés comme stables.

**Documents connexes :** [`contracts/00-INDEX.md`](../contracts/00-INDEX.md) · [`PHASE_0A_CONTRACT_AUDIT.md`](../PHASE_0A_CONTRACT_AUDIT.md) · [`PROJECT_STATE.md`](../PROJECT_STATE.md) · [`MASTER_ROADMAP.md`](../MASTER_ROADMAP.md)

---

## Objectif de la Phase 0A

Lou Médecine repose sur des obligations durables — fidélité au Collège, identités stables, pipeline traçable, package publiable, visuels officiels, expérience apprenant — dispersées entre ADR, contrats historiques, documentation technique et code.

La Phase 0A existait pour **consolider** ces obligations en **contrats fondamentaux** lisibles, non redondants et auditables, **sans inventer de nouvelle architecture**. L'objectif était de poser une **gouvernance normative stable** avant l'industrialisation à l'échelle (Phase 1) et les phases suivantes.

---

## Résultat obtenu

Six contrats fondamentaux, chacun répondant à **une question unique**, sont **en vigueur** et **gelés** (maintenance documentaire uniquement).

| Contrat | Question | Résumé |
|---|---|---|
| **01 — Trust & Fidelity** | Comment garantir la fidélité au Collège ? | Classes de claim, réconciliation des segments source, grounding, fallback conservateur et gates de publication. |
| **02 — Identity & Anchors** | Comment identifier durablement les artefacts ? | Identités chapitre / point de connaissance / éléments pédagogiques ; modèle d'ancres et chaîne de traçabilité. |
| **03 — Acquisition SSOT** | Quelles garanties pour l'acquisition ? | Chaîne FIL B, Tools 01/02 gelés, grille P1–P7, frontière acquisition / package métier. |
| **04 — Chapter Package** | Comment construire et publier un chapitre ? | Inventaire, Blueprint, projections, build, manifest — **unique unité de publication** et frontière pipeline / consommation. |
| **05 — Visual Grammar** | Comment représenter un visuel officiel ? | visualSpec comme source sémantique ; **moteur de rendu graphique** (build) distinct du **renderer lecteur** (contrat 06). |
| **06 — Renderer & Learner Layer** | Comment présenter le package à l'apprenant ? | Renderer lecteur manifest-only ; immutabilité du contenu officiel ; couche apprenant séparée. |

Un **audit transversal** a vérifié la cohérence inter-contrats ; les corrections documentaires identifiées ont été appliquées (terminologie renderer, dispositions à deux niveaux, renvois internes, index).

---

## Gouvernance obtenue

La gouvernance documentaire est désormais organisée selon une hiérarchie explicite :

```
Décisions de gouvernance (ADR)
        ↓
Contrats fondamentaux (docs/contracts/01–06)
        ↓
Contrats composants (Tool 01/02 CONTRACT.md, futurs Tool 03–05)
        ↓
Documentation technique détaillée
        (IMPLEMENTATION_CONTRACT, VISUAL_GRAMMAR_CONTRACT, docs/renderer/, …)
        ↓
Code et tests
```

**Règle de résolution :** en cas de conflit sur une **obligation métier**, le contrat fondamental applicable prime sur la documentation technique détaillée. Un ADR prime sur un contrat ; un nouveau ADR est requis pour contredire un ADR existant.

**Références détaillées conservées :** `IMPLEMENTATION_CONTRACT.md` et `VISUAL_GRAMMAR_CONTRACT.md` restent des spécifications détaillées ; ils ne remplacent pas les contrats 01–06 pour la gouvernance.

---

## Principes désormais considérés comme gelés

Les grands invariants suivants sont **stables** et **non négociables** sans ADR explicite :

- **Une seule source de vérité** — le Collège officiel est l'autorité médicale ; une seule chaîne d'acquisition qualifiée (FIL B).
- **Identités stables** — chapitre, points de connaissance et éléments pédagogiques portent des identifiants durables ; les ancres relient tout fait à la source.
- **Acquisition indépendante** — la couche acquisition est gelée (ADR-004) ; le package métier ne redéfinit pas les garanties d'acquisition.
- **Chapter Package canonique** — inventaire, Blueprint, projections, build et manifest forment l'unique unité de publication d'un chapitre.
- **visualSpec indépendant du moteur de rendu graphique** — la sémantique visuelle vit dans le visualSpec ; le build produit une figure jetable ; le renderer lecteur ne lit pas le visualSpec pour inférer du sens médical.
- **Manifest comme point d'entrée du lecteur** — le renderer lecteur consomme exclusivement le manifest publié et les artefacts qu'il déclare.
- **Séparation stricte contenu officiel / données apprenant** — le contenu généré officiel est immuable ; les annotations, notes et diagrammes personnels sont locaux et superposés.

Cette liste résume ; le détail normatif est dans les contrats 01–06.

---

## Décisions importantes

- **Gouvernance par question unique** — chaque contrat fondamental couvre une responsabilité ; pas de chevauchement normatif.
- **Une règle définie une seule fois** — chaque obligation vit dans un seul contrat ; les autres documents renvoient.
- **Renvois plutôt que duplication** — consolidation depuis l'existant (IMPLEMENTATION, VISUAL_GRAMMAR, ADR, contrats Tool) sans recopie.
- **Séparation permanente gouvernance / implémentation** — les contrats décrivent des invariants et des garanties ; le code, les schémas détaillés et les exemples restent en documentation technique et en tests.

---

## Ce que la Phase 0A ne couvre volontairement pas

La Phase 0A **ne clôt pas** l'industrialisation ni l'implémentation complète du pipeline. Les éléments suivants relèvent des **phases suivantes** :

- **Contrats composants** — Tools 03–05 et futurs contrats d'interface entre composants.
- **Implémentation** — alignement complet du code sur tous les invariants (build reproductible byte-identique, CI étendue, modèle d'ancre étendu).
- **Outils** — Inventory Factory, Blueprint Factory, Projection Factory, Renderer Production.
- **Détails techniques** — schémas visualSpec, primitives graphiques, APIs renderer, IndexedDB apprenant.

Ces chantiers continuent sous **Phase 3 — Implémentation de lou-build**, en respect des contrats fondamentaux et de l'architecture gelée (docs 14–19).

---

## Critère de clôture

La **gouvernance fondamentale** est désormais considérée comme **stable**.

Les six contrats 01–06 constituent la **référence normative** du projet pour les obligations durables. Les évolutions futures — industrialisation, nouveaux outils, scale-out EDN — devront **préserver la cohérence** de ces contrats. Toute modification d'invariant fondamental requiert un **ADR** et une mise à jour contractuelle explicite.

**Phase 0A : terminée.**  
**Phase active du projet :** voir [`PROJECT_STATE.md`](../PROJECT_STATE.md) (Phase 3 — Implémentation lou-build ; architecture v1 gelée).
