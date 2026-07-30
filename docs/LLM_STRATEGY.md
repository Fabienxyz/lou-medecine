# Lou Médecine — Stratégie LLM

**Statut :** stratégie évolutive — susceptible d'évoluer avec les modèles disponibles.  
**Dernière mise à jour :** 2026-07-27

Ce document précise **comment** le projet utilise les LLM. Il ne définit pas les priorités du projet : pour le séquencement et les objectifs, voir [`MASTER_ROADMAP.md`](MASTER_ROADMAP.md).

---

## Principe directeur

Le modèle propose ; le code déterministe vérifie ; l'échec relance.

Le LLM ne doit jamais être ce qui **garantit** la correction. Il produit des propositions vérifiables. Toute amélioration durable doit viser à **remplacer** un appel LLM par une règle déterministe, pas à empiler des modèles.

> **Le code est un actif permanent ; un appel LLM est une dépendance temporaire.**

---

## Profil par phase

| Phase | Déterministe | LLM |
|---|---|---|
| **0** | Tout | Aucun |
| **1** | Tout | Aucun |
| **2–3** | Segmentation, validation, rendu SVG, grounding déterministe | Voir § Répartition par étage |
| **4** | Tout | Aucun |
| **5** | Idem 2–3 ; premium réduit aux archétypes inédits | Idem 2–3 |
| **6** | Presque tout | Diff d'édition uniquement |

---

## Répartition par étage (Phases 2–5)

| Étage | Nature | Modèle visé | Passes | Notes |
|---|---|---|---|---|
| Segmentation source | **Déterministe** | — | — | Code uniquement ; base de la complétude prouvable |
| Extraction Inventory | Proposition vérifiable | Économique | 1 par segment, parallèle | Citation verbatim re-vérifiée par code ; retry si échec |
| Réconciliation | Classification | Économique | 1 par segment, indépendante | Prompt et invocation distincts de l'extraction |
| **Blueprint** | Acte créatif global | **Premium** | 1 par chapitre | Seul endroit où la puissance du modèle détermine fortement la qualité |
| **Projections** | Rédaction pédagogique | **Premium** | 1 par élément | Contexte réduit à l'élément + citations KP |
| visualSpec | Sortie contrainte | Intermédiaire | 1 + retry | Schéma validé par machine |
| Grounding déterministe | **Déterministe** | — | — | Nombres, seuils, unités, énumérations, classifications |
| Grounding sémantique | Jugement d'entailment | Économique | 2–3 indépendantes | Uniquement sur claims `bridging` ; contexte minuscule |
| Rendu SVG | **Déterministe** | — | — | Aucun LLM |

### Exception Phase 0

Un modèle *vision* bon marché peut servir de **validateur échantillonné** (comparer un échantillon de tableaux reconstruits à l'image source). Usage de contrôle, jamais de production.

---

## Grounding : deux familles

**Vérifiables déterministiquement** — seuils, unités, bornes, énumérations, noms de molécules, valeurs de classification. Objectif : couvrir la majorité des claims `sourced` sans LLM. Chaque nouvelle règle **remplace** un futur appel d'entailment.

**Non vérifiables mécaniquement** — claims `bridging` et `scaffolding`. Juge d'entailment léger recevant uniquement le claim et les citations de ses KP, sans contexte de chapitre. Plusieurs passes indépendantes ; accord requis pour publier les claims `bridging`.

---

## Évolution de la stratégie

Cette stratégie **n'est pas gelée**. Elle évolue lorsque :

- une règle déterministe remplace un appel LLM (préféré) ;
- les modèles disponibles changent de rapport qualité/coût ;
- la Phase 2 produit des mesures réelles (distribution par chapitre, taux de retry, volume de `bridging`).

Les mesures opérationnelles (coût par chapitre, temps humain, taux de grounding déterministe) sont suivies dans [`PROJECT_STATE.md`](PROJECT_STATE.md), pas ici.

### Règle de révision du premium

Après Cardio V1, le premium sur Blueprint peut être réduit aux **archétypes inédits** si des exemplaires validés suffisent pour guider un modèle intermédiaire. Test : régénération aveugle de chapitres déjà validés ; si Lou ne distingue pas, le premium cède place à l'économique pour cet archétype.

---

## Documents connexes

| Document | Rôle |
|---|---|
| [`MASTER_ROADMAP.md`](MASTER_ROADMAP.md) | Pilotage : objectifs, séquencement, critères de sortie |
| [`PROJECT_STATE.md`](PROJECT_STATE.md) | État courant et métriques mesurées |
| [`governance/DOCUMENT_ARCHITECTURE.md`](governance/DOCUMENT_ARCHITECTURE.md) | Organisation du pilotage documentaire |
| `IMPLEMENTATION_CONTRACT.md` | Contrat de fidélité et de grounding |
