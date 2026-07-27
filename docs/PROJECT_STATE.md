# Lou Médecine — État du projet

**Photographie opérationnelle du projet** — **document vivant** du projet Lou Médecine.  
**Version projet :** 0.1.0  
**Dernière mise à jour :** 2026-07-27

Ce document est mis à jour **lorsqu'un jalon important est franchi** (fin de phase, décision structurante, changement de risque majeur). Il **n'est pas mis à jour selon un calendrier fixe**. La roadmap ([`MASTER_ROADMAP.md`](MASTER_ROADMAP.md)) reste volontairement **stable** ; l'état opérationnel vit ici.

Pour le séquencement, les priorités et les critères de réussite stables, voir [`MASTER_ROADMAP.md`](MASTER_ROADMAP.md). Pour l'usage des modèles, voir [`LLM_STRATEGY.md`](LLM_STRATEGY.md). Pour l'implémentation, voir [`../IMPLEMENTATION_CONTRACT.md`](../IMPLEMENTATION_CONTRACT.md) et [`../FINAL_ARCHITECTURE.md`](../FINAL_ARCHITECTURE.md).

---

## Phase active

| | |
|---|---|
| **Phase** | Phase 0 — Le Socle |
| **Chantier actif** | 0B — Fidélité du Collège |
| **Prochain jalon** | Phase 1 — Lecteur du Collège cardio complet (contenu officiel, sans LLM) |
| **Prochaine action** | Récupération du Rang A/B ; extraction des figures ; validation structurelle des tableaux |

---

## Décisions récemment prises

| Date | Décision |
|---|---|
| 2026-07-27 | `docs/MASTER_ROADMAP.md` devient le document de pilotage officiel |
| 2026-07-27 | Phase 0 scindée en 0B (fidélité) puis 0A (contrats), en parallèle de la Phase 1 |
| 2026-07-27 | Schéma Inventory stable v1 pour Cardio V1 ; gel transversal après le 2ᵉ collège |
| 2026-07-27 | Décisions humaines = entrées du pipeline (`chapter.package.yaml`), jamais retouches d'artefacts |
| 2026-07-27 | Stratégie LLM extraite vers `docs/LLM_STRATEGY.md` |

---

## Principaux risques ouverts

| Risque | Statut | Bloque |
|---|---|---|
| Couche canonique infidèle (Rang A/B, figures, tableaux) | **Actif** | Phase 1 |
| Pipeline sémantique non automatisé | **Actif** | Phase 3 |
| Build non reproductible (`data-official-text-id` absent du pipeline) | **Actif** | Phase 2 |
| Généralisation pédagogique archétype-dépendante | **Ouvert** | Phase 4 (décision, pas architecture) |
| Portabilité Tool 01 hors cardio | **Latent** | Phase 5 |
| Tests mutent le chapitre canonique (234) | **Actif** | CI fiable (0A) |

---

## Décisions gelées

Aucune à ce jour. Entrent en vigueur :

- fin de **0A** : modèle d'ancre et identifiants ;
- fin de **Phase 3** : contrat du manifeste ;
- fin de **Phase 5** : schéma d'Inventory transversal.

---

## Prochains travaux

1. **0B** — Récupération Rang A/B dans Tool 01 ; extraction figures ; validateur d'intégrité tableaux/en-têtes ; rapport sur 22 chapitres cardio.
2. **0A** (en parallèle de Phase 1) — Modèle d'ancre ; CI ; isolation des tests ; câblage V2 ; `data-official-text-id`.
3. **Phase 1** — `library.json` ; manifestes `official.source` ; écran d'accueil et recherche.

---

## Tableau de bord (cibles opérationnelles)

*Les chiffres vivent ici, pas dans la roadmap.*

| Indicateur | Cible actuelle | Mesuré | Notes |
|---|---|---|---|
| Minutes humaines / chapitre publié | Phase 3 : faible ; Phase 5 : très faible | — | À mesurer en Phase 2 |
| Segments source avec disposition | Exhaustivité prouvée par code | — | |
| Claims sourcés vérifiés déterministiquement | Majorité | ~1 règle aujourd'hui | Extension en Phase 2 |
| Build textuel reproductible | Octet pour octet en CI | **Non** | `mec-oap.svg` diverge au rebuild |
| Décisions humaines / chapitre | Comptées, en décroissance | — | |
| Coût LLM / chapitre | Mesuré, stable | — | Première mesure en Phase 2 |

---

## Historique des jalons

| Date | Jalon |
|---|---|
| 2026-07 | Renderer V2.3 livré (annotation, formatage SVG inline) |
| 2026-07 | Item 234 — chapitre de référence (Inventory, Blueprint, Projections, manifest) |
| 2026-07 | Tool 01 (PDF → canonique) et Tool 02 (découpage chapitres) gelés v1.0.0 |
| 2026-07 | `lou-build` — validate/build pour chapitres packagés |
| 2026-07 | Audit architecture + Master Roadmap validée |
| — | Phase 0 — *non démarrée* |

---

## Documents de référence

| Document | Usage |
|---|---|
| [`MASTER_ROADMAP.md`](MASTER_ROADMAP.md) | Priorités et phases (stable) |
| [`LLM_STRATEGY.md`](LLM_STRATEGY.md) | Usage des modèles (évolutif) |
| `IMPLEMENTATION_CONTRACT.md` | Contrat d'implémentation |
