# Plan d'implémentation — PDR-D2 Offline complet

| | |
|---|---|
| **Type** | Plan d'exécution — **informatif** |
| **Statut** | En vigueur — 2026-08-01 |
| **Décision produit** | [PDR-D2](PRODUCT-DECISION-REGISTRY.md) |
| **Contrat** | [`OFFLINE-COMPONENT-CONTRACT.md`](../contracts/components/OFFLINE-COMPONENT-CONTRACT.md) (D2-A) |
| **Autorité** | Séquencement des lots d'implémentation uniquement — ne remplace ni le contrat, ni la roadmap |

Ce document porte la **numérotation opérationnelle unique** des lots PDR-D2. Les contrats et le code référencent ces identifiants ; seul l'ordre des identifiants est normé ici — le contenu normatif relève du contrat Offline (D2-A).

---

## Séquence officielle

| Lot | Intitulé | Statut |
|---|---|---|
| **D2-A** | Contrat Offline | **Livré** |
| **D2-B** | Offline State Model | **Livré** |
| **D2-C** | Offline Manager | **Livré** |
| **D2-D** | Package Access Browser | **Livré** |
| **D2-E** | Runtime Offline (routage local) | **Livré** |
| **D2-F** | Préparation automatique après installation | **Livré** |
| **D2-G** | Acceptation Offline | À venir |
| **D2-H** | Update / Repair / Archive | À venir |
| **D2-I** | Propagation documentaire / clôture | À venir |

---

## Lots atomiques

| Lot | Objectif | Dépendances | Critère de sortie |
|---|---|---|---|
| **D2-A — Contrat Offline** | Contrat composant ; extension `LIBRARY-CATALOG-CONTRACT` §11.1 ; index contrats | D1 clôturé | [`OFFLINE-COMPONENT-CONTRACT.md`](../contracts/components/OFFLINE-COMPONENT-CONTRACT.md) en vigueur |
| **D2-B — Offline State Model** | États, machine à transitions, `offline_status` dans `library.json`, API interne | D2-A ; D1 clôturé | Schéma validé ; tests unit états / transitions / persistance |
| **D2-C — Offline Manager** | Offline Manager appelle Package Access (Node) pour liste declared paths + digest | D2-B | 234 → liste = `collectDeclaredArtifactPaths` ; digest match |
| **D2-D — Package Access Browser** | URLs `/library/releases/<release_id>/…` ; Reader quitte `CHAPTERS_ROOT` en mode produit | D1-D, D2-B | Smoke : manifest 234 via URL logique |
| **D2-E — Runtime Offline** | Precache shell ; cache namespace par release_id ; routing fetch | D2-C, D2-D, B3 | Shell offline froid ; `/library/releases/<release_id>/…` servi depuis Cache API |
| **D2-F — Préparation automatique après installation** | Hook post-install → prepare Node (interne) ; vérif digest ; **sans flip `offline_ready`** | D2-E, B1 | Install 234 → `not_prepared` ; runtime Node matérialisé |
| **D2-G — Acceptation Offline** | Runtime navigateur + SW ; certification `offline_ready` ; 7 vues offline froid | D2-F | Suite Playwright OF-D2-* PASS ; CI 234 |
| **D2-H — Update / Repair / Archive** | Conserver cache archived ; stale detection ; repair | D2-F | Install v2 → v1 cache intact ; stale → repair |
| **D2-I — Propagation documentaire / clôture** | PROJECT_STATE ; critère roadmap ; clôture gouvernance PDR-D2 | D2-G | PDR-D2 clôturé gouvernance |

**Ordre critique :** D2-A → D2-B → D2-C ∥ D2-D → D2-E → D2-F → D2-G ; D2-H après D2-F ; D2-I clôture.

**Hors lots D2 :** wiring UI bibliothèque riche, Tauri, purge auto quota, install depuis cloud.

---

## Correspondance de renumérotation (2026-08-01)

Harmonisation documentaire uniquement — contenu des lots inchangé, identifiants seuls mis à jour :

| Ancien identifiant | Nouvel identifiant |
|---|---|
| D2-A — Modèle offline | **D2-B** — Offline State Model |
| D2-B — Énumération artefacts | **D2-C** — Offline Manager |
| D2-C — Package Access browser | **D2-D** — Package Access Browser |
| D2-D — SW release-scoped | **D2-E** — Runtime Offline |
| D2-E — Prepare à l'install | **D2-F** — Préparation automatique après installation |
| D2-F — Tests acceptation D2 | **D2-G** — Acceptation Offline |
| D2-G — Update & archive | **D2-H** — Update / Repair / Archive |
| D2-H — Contrat + docs | **D2-A** (contrat, livré) · **D2-I** (propagation / clôture) |

---

## Documents connexes

| Document | Rôle |
|---|---|
| [`OFFLINE-COMPONENT-CONTRACT.md`](../contracts/components/OFFLINE-COMPONENT-CONTRACT.md) | Obligations normatives offline (D2-A) |
| [`LIBRARY-CATALOG-CONTRACT.md`](../contracts/components/LIBRARY-CATALOG-CONTRACT.md) | Catalogue ; champ `offline_status` |
| [`PROJECT_STATE.md`](../PROJECT_STATE.md) | État courant et jalons livrés |

---

*Plan d'implémentation PDR-D2 — numérotation harmonisée 2026-08-01.*
