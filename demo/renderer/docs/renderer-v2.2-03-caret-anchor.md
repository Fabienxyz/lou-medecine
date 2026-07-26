# Renderer V2.2 — CaretAnchor primitives (commit 3)

> **Status:** Implemented — anchoring layer only  
> **Commit:** `feat(anchor): implement CaretAnchor primitives`  
> **Module:** `caret-anchor.js` → `window.LouCaretAnchor`  
> **Parent:** [architecture-principles.md](./architecture-principles.md)  
> **Target spec:** [renderer-v2.2-walkthrough-notes.md](./renderer-v2.2-walkthrough-notes.md) §5–§6.4

This document describes **only what is implemented today** after commit 3. It is not the full V2.2 contract. No UI, no persistence wiring, no Walkthrough Note DOM exists yet.

---

## 1. Objectif du commit

Fournir les **primitives d'ancrage** permettant de :

1. **Créer** un CaretAnchor depuis une position de curseur dans le texte officiel d'un walkthrough.
2. **Restaurer** cette position sous forme de `Range` collapsed sur un DOM reconstruit.

Pourquoi ce commit existe :

- Les Walkthrough Notes ancrent un **point** (caret), pas un intervalle — distinct du `TextQuoteSelector` des highlights V2.1.
- L'espace de coordonnées doit **exclure** le texte additif des notes tout en **incluant** les wrappers transparents (highlights).
- Ces primitives doivent exister **avant** `inline-notes.js`, testables sans IndexedDB ni renderer.

Ce commit **n'introduit aucune fonctionnalité utilisateur**. `caret-anchor.js` n'est **pas** chargé dans `index.html`.

---

## 2. Philosophie du CaretAnchor

### Point logique, pas adresse DOM

Un CaretAnchor ne stocke **aucune** information structurelle HTML :

| Absent du record | |
|---|---|
| XPath, CSS selector | |
| Node index, child index | |
| Node id, `data-offset` | |
| Référence DOM, WeakMap | |

Il stocke uniquement :

- Une **position entière** dans le Official Text Stream (`offset`).
- Un **contexte textuel local** (`prefix`, `suffix` — jusqu'à 32 caractères).

Même principe que le `TextQuoteSelector` V2.1 : survivre à la reconstruction DOM et à la fragmentation des nœuds texte.

### Différence avec les highlights V2.1

| Aspect | Highlights V2.1 | CaretAnchor V2.2 |
|---|---|---|
| Géométrie | Intervalle `[start, end)` avec `exact` | Point `[offset, offset)` |
| Espace texte | `walkthrough.textContent` (équivalent TreeWalker sans filtre additif) | Official Text Stream §3 — **exclut** `.walkthrough-note` |
| Module | `text-highlights.js` | `caret-anchor.js` — **pas de factorisation** V2.2 |
| Restauration | `_rangeFromTextOffsets` — rejette collapsed | `_caretRangeFromOffset` — **accepte** collapsed |

---

## 3. Official Text Stream

### Définition (implémentée)

> Concaténation depth-first (TreeWalker `SHOW_TEXT`) de tous les nœuds texte dans un élément walkthrough, **sauf** ceux dont un ancêtre porte `.walkthrough-note`.

### Construction

```
_walkOfficialTextNodes(walkthrough, fn)
  TreeWalker(walkthrough, SHOW_TEXT, acceptNode)
    if _isAdditiveNode(node):  // ancestor .walkthrough-note
      return FILTER_REJECT
    return FILTER_ACCEPT
  for each accepted text node:
    fn(node, cumulativeOffset, nodeLength)
    cumulativeOffset += nodeLength
```

### Classification des nœuds

| Catégorie | Traitement dans le flux |
|---|---|
| Texte structurel (`p`, `strong`, …) | **Inclus** |
| `mark.learner-highlight` | **Transparent** — traversé ; texte enfant **inclus** |
| `.walkthrough-note` | **Additif** — sous-arbre entier **exclu** (`FILTER_REJECT`) |
| `[data-learner="true"]` seul | **Pas de filtre global** — seule `.walkthrough-note` est exclue |

### Invariant central (architecture V2)

> L'ajout, l'édition ou la suppression d'une Walkthrough Note **ne modifie jamais** le Official Text Stream.

Le texte d'une note vit dans un sous-arbre exclu. Visuellement la note apparaît dans le walkthrough ; logiquement son texte n'existe pas dans la chaîne `full` utilisée pour les offsets.

**Exemple :** officiel `abc` + `def`, note `"note"` entre les deux → flux `"abcdef"`, **pas** `"abcnotedef"`.

Aucun recalcul manuel des offsets « après coup » — exclusion faite **pendant** le parcours TreeWalker unique.

---

## 4. Structure JSON du CaretAnchor

Retournée par `createCaretAnchor()` :

```json
{
  "type": "CaretAnchor",
  "offset": 42,
  "prefix": "...up to 32 chars before offset...",
  "suffix": "...up to 32 chars after offset..."
}
```

| Field | Type | Description |
|---|---|---|
| `type` | `"CaretAnchor"` | Discriminant constant (`ANCHOR_TYPE`) |
| `offset` | number | Entier ≥ 0, ≤ longueur du flux ; point half-open `[offset, offset)` |
| `prefix` | string | Caractères immédiatement avant `offset` (≤ `CONTEXT_CHARS` = 32) |
| `suffix` | string | Caractères immédiatement après `offset` (≤ 32) |

Stabilité : tant que le **contenu officiel** du walkthrough est inchangé, le flux et les offsets restent identiques indépendamment de la fragmentation DOM ou de la présence de notes additives ailleurs.

---

## 5. API publique

| Export | Signature | Returns |
|---|---|---|
| `createCaretAnchor` | `(walkthrough, container, offsetInContainer)` | `CaretAnchor \| null` |
| `restoreCaretAnchor` | `(walkthrough, anchor)` | `Range \| null` (collapsed) |

### Constantes exposées

| Name | Value |
|---|---|
| `ANCHOR_TYPE` | `"CaretAnchor"` |
| `ADDITIVE_CLASS` | `"walkthrough-note"` |
| `CONTEXT_CHARS` | `32` |

Les méthodes `_walkOfficialTextNodes`, `_resolveAnchor`, etc. sont **internes** — invoquables en tests de régression, pas un contrat public stable.

---

## 6. `createCaretAnchor()` — algorithme

```
createCaretAnchor(walkthrough, container, offsetInContainer)
  offset = _caretOffsetFromDomPoint(walkthrough, container, offsetInContainer)
  if offset < 0: return null
  if offset > _officialStreamLength(walkthrough): return null
  return _anchorFromOffset(walkthrough, offset)
```

### `_caretOffsetFromDomPoint`

1. Rejeter si le point est dans un sous-arbre additif (`.walkthrough-note`).
2. Normaliser : si `container` est un élément, `Range.setStart` + collapse → nœud texte + offset local.
3. Parcourir le flux officiel ; trouver le nœud texte correspondant → `start + offsetInContainer`.

### `_anchorFromOffset`

Construit `{ type, offset, prefix, suffix }` via `_officialStreamSlice`.

---

## 7. `restoreCaretAnchor()` — algorithme

Deux phases : **résolution de l'offset**, puis **matérialisation DOM**.

### Phase A — `_resolveAnchor(walkthrough, anchor)`

1. Valider `anchor.type === "CaretAnchor"` — sinon `-1`.
2. Reconstruire `full` = chaîne du flux officiel courant.
3. **Tentative directe** à `anchor.offset` : vérifier que `prefix` et `suffix` correspondent (`_contextMatchesAt`).
4. Si échec : **scan linéaire** de `idx = 0 … full.length` (sauf `anchor.offset` déjà testé) ; première position où prefix/suffix matchent.
5. Si aucune correspondance → `-1`.

Vérification prefix/suffix à une position `pos` :

- `before` = `full[pos - prefix.length : pos]`
- `after` = `full[pos : pos + suffix.length]`
- Match si `before === prefix && after === suffix`

### Phase B — `_caretRangeFromOffset(walkthrough, offset)`

1. Parcourir les nœuds texte officiels avec offsets cumulés `[nodeStart, nodeEnd]`.
2. Premier nœud où `offset >= nodeStart && offset <= nodeEnd` → `Range` collapsed à `local = offset - nodeStart`.
3. Si aucun nœud → `null`.

### Retour `null`

| Condition |
|---|
| Anchor absent ou type incorrect |
| `_resolveAnchor` → `-1` (contexte introuvable — contenu officiel modifié) |
| Offset résolu mais hors limites du flux courant |

**Note :** échec de restauration quand le **texte officiel généré** a changé — pas quand des notes additives sont ajoutées ou supprimées (flux inchangé).

---

## 8. Wrappers transparents et couches additives

### `mark.learner-highlight`

- Aucune règle d'exclusion dans le TreeWalker.
- Le texte à l'intérieur d'un highlight **compte** dans le flux.
- Un offset créé dans un highlight reste valide après restauration du highlight (fragmentation en multiples `#text` — WT-03).

### `.walkthrough-note`

- Exclusion par `FILTER_REJECT` sur tout le sous-arbre.
- `createCaretAnchor` depuis un point **à l'intérieur** d'une note existante → `null`.
- Présence de notes voisines : **n'affecte pas** les offsets du flux officiel.

Compatibilité future : lorsque `inline-notes.js` insérera des `<span class="walkthrough-note">`, les primitives commit 3 restent valides sans modification.

---

## 9. Invariants

| ID | Invariant |
|---|---|
| C1 | Offsets définis **uniquement** par le Official Text Stream |
| C2 | Aucune donnée DOM persistée dans le CaretAnchor |
| C3 | `.walkthrough-note` exclu du flux — texte additif invisible aux offsets |
| C4 | `mark.learner-highlight` transparent — texte inclus |
| C5 | Ajout / édition / suppression de notes **ne change pas** le flux (si notes conformes §8) |
| C6 | Sémantique half-open : point = `[offset, offset)` |
| C7 | `CONTEXT_CHARS` = 32 — aligné highlights V2.1 |
| C8 | Module sans dépendance UI, IndexedDB, renderer |
| C9 | Pas d'appel à `LouTextHighlights._rangeFromTextOffsets` (rejette collapsed) |
| C10 | `caret-anchor.js` non chargé dans `index.html` (commit 3) |

---

## 10. Limitations connues

| Limite | Description |
|---|---|
| Désambiguïsation | Si plusieurs positions partagent le même couple prefix/suffix, le scan retourne la **première** alternative (pas la plus proche de `offset` mémorisé) |
| Frontière entre nœuds | Offset à la jointure de deux `#text` est matérialisé sur le **premier** nœud couvrant la position (ordre TreeWalker) |
| Échec si contenu officiel change | Réédition chapitre — prefix/suffix ne matchent plus → `null` (dégradation honnête) |
| Pas de consommateur renderer | Module testé en isolation ; store commit 2 accepte anchor opaque sans validation |
| Pas de factorisation avec V2.1 | Duplication assumée — pas d'extraction `text-anchoring.js` en V2.2 |

---

## 11. Responsabilités et absences

| Présent (commit 3) | Absent (commits futurs) |
|---|---|
| `caret-anchor.js` | `inline-notes.js` |
| Tests WT-01 … WT-05 + cas limites | Mount dans `blocks.js` |
| Official Text Stream walker | Menu contextuel, édition |
| | CSS `.walkthrough-note` |
| | Persistance via store au render |
| | Chargement script dans `index.html` |

Modules **non modifiés** : `learner-store.js`, `blocks.js`, `text-highlights.js`, `renderer.js`, `styles.css`, `index.html`.

---

## 12. État du renderer après ce commit

Fonctionnellement **identique à post-commit 2** pour l'utilisateur :

- Highlights V2.1 : inchangés.
- Personal Diagrams : inchangés.
- Walkthrough Notes : **invisibles** — pas de DOM, pas de store consommé.

Différence dans le dépôt :

- Fichier `caret-anchor.js` existe.
- Tests unitaires dédiés (`test/caret-anchor.test.js`).
- Module **non branché** au boot renderer.

Tests : 42 unit tests passent (34 post-commit 2 + 8 CaretAnchor).

---

## 13. Stratégie de tests

Fichier : `demo/renderer/test/caret-anchor.test.js`

| ID | Scenario | Vérifie |
|---|---|---|
| WT-01 | Offset inclut texte dans `mark.learner-highlight` | Wrapper transparent |
| WT-02 | Flux exclut `.walkthrough-note` ; création dans note → `null` | Couche additive |
| WT-03 | DOM fragmenté (split + mark) | Round-trip offset via restore |
| WT-04 | Range restaurée | `collapsed === true`, `start === end` |
| WT-05 | Prefix/suffix disambiguation | Offset stale → retrouvé par scan |
| — | Offset 0 (début du flux) | Round-trip |
| — | Offset === length (fin du flux) | Round-trip |
| — | Anchors invalides | `null`, wrong type, prefix mismatch |

Tests **indépendants** des Walkthrough Notes, du store et du renderer — DOM minimal en JSDOM, chargement de `caret-anchor.js` seul.

---

## 14. Décisions architecturales (commit 3)

| Decision | Rationale |
|---|---|
| Module dédié `caret-anchor.js` | Séparation anchoring / UI / persistence |
| Official Text Stream avec exclusion additive | Offsets stables malgré notes présentes (invariant V2) |
| Pas de filtre global `[data-learner="true"]` | Highlights restent transparents |
| CaretAnchor = offset + prefix + suffix | Indépendance DOM ; pattern éprouvé V2.1 |
| `_caretRangeFromOffset` local | `_rangeFromTextOffsets` rejette collapsed |
| Commit sans brancher renderer | Non-régression V2.1 ; primitives testables seules |

---

## 15. Relation avec commit 2 et suite V2.2

| Layer | Document | Status |
|---|---|---|
| Store | [renderer-v2.2-02-store.md](./renderer-v2.2-02-store.md) | Implemented |
| Anchoring | This document | Implemented |
| Full feature | [renderer-v2.2-walkthrough-notes.md](./renderer-v2.2-walkthrough-notes.md) | Target spec — not fully implemented |

Prochaines étapes (hors scope commit 3) : `inline-notes.js` consommera `LouCaretAnchor` + `LouLearnerStore`, mount après highlights, UI — voir contrat §6–§10.
