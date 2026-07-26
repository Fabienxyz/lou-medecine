# Renderer V2.2 — Walkthrough notes store (commit 2)

> **Status:** Implemented — storage layer only  
> **Commit:** `feat(store): add walkthrough_notes store`  
> **Module:** `learner-store.js` → `window.LouLearnerStore` (extended)  
> **Parent:** [architecture-principles.md](./architecture-principles.md)  
> **Target spec:** [renderer-v2.2-walkthrough-notes.md](./renderer-v2.2-walkthrough-notes.md) §4

This document describes **only what is implemented today** after commit 2. It is not the full V2.2 contract and not a Git changelog. No renderer code consumes this store yet.

---

## 1. Objectif du commit

Introduire la **persistance IndexedDB** des Walkthrough Notes avant toute UI, tout DOM et tout module `inline-notes.js`.

Pourquoi ce commit existe :

- Séparer **stockage** et **rendu** — le store peut être testé et versionné indépendamment du pipeline renderer.
- Préparer le champ `anchor` (CaretAnchor) et `text` sans impacter V2.1 highlights ni Personal Diagrams.
- Appliquer la migration v2 → v3 (nouveau store, retrait du legacy Claim Notes store).

Ce commit **n'introduit aucune fonctionnalité utilisateur**. L'apprenant ne voit et n'utilise rien de nouveau.

---

## 2. Séparation stockage / renderer

```
learner-store.js          ← commit 2 (this document)
  walkthrough_notes CRUD

blocks.js                 ← unchanged
text-highlights.js        ← unchanged
renderer.js / app.js      ← unchanged
index.html                ← unchanged
```

| Couche | État après commit 2 |
|---|---|
| IndexedDB `walkthrough_notes` | **Existe** — CRUD disponible |
| Lecture du store au render | **Absente** |
| Injection DOM de notes | **Absente** |
| Menu contextuel / édition | **Absente** |

**Invariant :** le renderer se comporte **exactement** comme après commit 1 (suppression C.9). Seuls les tests unitaires du store (ST-01 … ST-03) observent le nouveau code.

---

## 3. Architecture IndexedDB

### Base existante étendue

| Property | Value |
|---|---|
| Database | `lou-learner` (inchangé) |
| `DB_VERSION` | **3** (était 2) |
| Stores actifs | `personal_diagrams`, `text_annotations`, **`walkthrough_notes`** |

Trois object stores distincts — pas de colonne `kind` unique. Chaque mécanisme learner (diagrammes, highlights, notes) a son propre store, conformément à [architecture-principles.md §7](./architecture-principles.md).

### Store `walkthrough_notes`

| Property | Value |
|---|---|
| Constant | `WALKTHROUGH_NOTES = "walkthrough_notes"` |
| Key | `id` — `keyPath: "id"`, `autoIncrement: true` |

---

## 4. Migration v2 → v3

Exécutée dans `onupgradeneeded` :

| Step | Action |
|---|---|
| 1 | Créer `walkthrough_notes` si absent |
| 2 | Supprimer `inline_notes` **si** `db.objectStoreNames.contains("inline_notes")` |
| 3 | Laisser `personal_diagrams` et `text_annotations` inchangés |

Décisions :

- **Aucune migration de données** depuis Claim Notes (C.9) — abandon accepté (contrat V2.2 §4.2, risque R11).
- `deleteObjectStore` est **protégé** par `objectStoreNames.contains` — pas d'appel sur un store inexistant.
- `LEGACY_INLINE_NOTES = "inline_notes"` — constante interne, utilisée uniquement à l'upgrade.

Robustesse héritée V2.1 (inchangée) :

- `_invalidateConnection`, `_attachConnectionHandlers`, `db.onversionchange`
- `request.onblocked` → warning console

---

## 5. WalkthroughNoteRecord

Structure persistée par `addWalkthroughNote` :

| Field | Type | Set by | Description |
|---|---|---|---|
| `id` | number | IndexedDB | Auto-generated key |
| `chapter` | string | caller | e.g. `"cardio/234"` |
| `projection` | string | caller | Manifest projection id |
| `element` | string | caller | Blueprint element id (block) |
| `anchor` | object | caller | CaretAnchor — **opaque pour le store** à ce stade |
| `text` | string | caller | Note body — non vide en base |
| `created` | string | store | ISO-8601 à l'insertion |
| `updated` | string | store | ISO-8601 — **absent** à la création ; renseigné par `updateWalkthroughNote` |

Le store **ne valide pas** la forme du CaretAnchor (commit 3 fournit les primitives ; consommation future dans `inline-notes.js`).

---

## 6. API publique (nouveau)

| Method | Signature | Behaviour |
|---|---|---|
| `addWalkthroughNote` | `(chapter, projection, element, anchor, text) → Promise<id>` | Insert record ; rejette si `text` vide ou whitespace-only |
| `updateWalkthroughNote` | `(id, text) → Promise<void>` | Get → mutate `text` + `updated` → put ; rejette texte vide ; rejette si id inconnu |
| `deleteWalkthroughNote` | `(id) → Promise<void>` | Delete by id |
| `listWalkthroughNotes` | `(chapter, projection) → Promise<WalkthroughNoteRecord[]>` | `_listForChapter` + filtre strict `row.projection === projection` |

### Sémantique `updateWalkthroughNote`

Pattern **get → mutate → put** sur l'enregistrement complet :

- Seuls `text` et `updated` sont modifiés.
- `chapter`, `projection`, `element`, `anchor`, `created`, `id` sont **conservés**.

---

## 7. Invariants du store

| ID | Invariant |
|---|---|
| S1 | Walkthrough notes dans un store **séparé** de `text_annotations` et `personal_diagrams` |
| S2 | Toute lecture liste filtre par `(chapter, projection)` |
| S3 | `text` non vide en base — `add` et `update` rejettent le vide |
| S4 | `created` immuable après insertion |
| S5 | `updated` absent à la création ; présent après toute mise à jour réussie |
| S6 | Aucun code renderer n'appelle ces méthodes (commit 2) |
| S7 | V2.1 highlights et Personal Diagrams — API et comportement **inchangés** |
| S8 | Connection IndexedDB — même robustesse que V2.1 |

---

## 8. Responsabilités du module

| Module | Rôle vis-à-vis de walkthrough_notes (commit 2) |
|---|---|
| **`learner-store.js`** | CRUD `walkthrough_notes`, migration DB v3 — **owner** |
| **`caret-anchor.js`** | Non chargé par le renderer ; non utilisé par le store |
| **`blocks.js`** | Aucun hook notes |
| **`text-highlights.js`** | Inchangé — V2.1 frozen behaviour |
| **`renderer.js` / `app.js`** | Aucune référence au store notes |
| **`index.html`** | Aucun script V2.2 notes |

---

## 9. Ce qui reste volontairement absent

| Absent | Raison |
|---|---|
| `inline-notes.js` | Commit ultérieur |
| Chargement de `caret-anchor.js` dans `index.html` | Commit 3 module autonome, pas branché |
| `mount` / `restore` notes dans `blocks.js` | Après primitives + UI |
| Styles `.walkthrough-note` | Commit style dédié |
| Menu contextuel, éditeur inline | Commits interaction |
| Validation du CaretAnchor dans le store | Responsabilité du module notes futur |
| Tests d'intégration renderer | WT-06+ — pas encore |

---

## 10. État du renderer après ce commit

Fonctionnellement **identique à post-commit 1** :

- Highlights V2.1 : création, restauration, toolbar — inchangés.
- Personal Diagrams : inchangés.
- Claim Notes C.9 : toujours absentes.

Différence observable **uniquement** :

- `DB_VERSION === 3` au prochain `open()`.
- Store `walkthrough_notes` créé (et `inline_notes` supprimé si présent).
- API CRUD callable depuis le code — **personne ne l'appelle** dans le renderer.

Tests : 34 unit tests passent (31 renderer + 3 store ST-01 … ST-03).

---

## 11. Stratégie de tests

Fichier : `demo/renderer/test/smoke/07-storage.unit.test.js` — describe `walkthrough_notes store (unit)`.

| ID | Scenario | Vérifie |
|---|---|---|
| ST-01 | `addWalkthroughNote` + `listWalkthroughNotes` | Filtrage strict `chapter` + `projection` ; champs record |
| ST-02 | `updateWalkthroughNote` | `text` mis à jour ; `created` inchangé ; `updated` ISO-8601 |
| ST-03 | `deleteWalkthroughNote` | Liste vide après suppression |

Aucun autre test ajouté pour ce commit. Suite V2.1 renderer et smoke matrix : non-régression requise, comportement inchangé.

---

## 12. Limites connues (commit 2)

| Limite | Note |
|---|---|
| Store sans consommateur | Records persistables manuellement ou en test ; pas de round-trip UI |
| Anchor non validé | Objet opaque — forme CaretAnchor non vérifiée à l'écriture |
| Pas de `listWalkthroughNotes(chapter)` sans projection | Filtre projection obligatoire — aligné highlights V2.1 |
| Perte données C.9 | Acceptée — pas de migration `inline_notes` → `walkthrough_notes` |

---

## 13. Décisions architecturales (commit 2)

| Decision | Rationale |
|---|---|
| Commit storage seul | Une responsabilité ; testable sans DOM |
| `DB_VERSION` 3 | Distinct de v2 (highlights + diagrams only) |
| Drop `inline_notes` si présent | Nettoyage legacy ; pas de migration |
| Reject empty text on add/update | Aligné contrat V2.2 — pas de record vide en base |
| Get-mutate-put on update | Préserve anchor et metadata |
| Pas de touch renderer | Non-régression V2.1 absolue |

---

## 14. Prochaine étape (hors scope commit 2)

Voir [renderer-v2.2-03-caret-anchor.md](./renderer-v2.2-03-caret-anchor.md) (commit 3 — implémenté) et [renderer-v2.2-walkthrough-notes.md](./renderer-v2.2-walkthrough-notes.md) pour la suite (`inline-notes.js`, mount, UI).
