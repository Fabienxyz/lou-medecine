# Renderer V2.2 — Walkthrough Note creation (commit 5)

> **Status:** **Implemented — frozen** (commit 5)  
> **Commit:** `feat(renderer): create walkthrough notes` (`3eae4bb`)  
> **Tag:** `renderer-v2.2-create-stable`  
> **Frozen:** 2026-07-26  
> **Module:** `inline-notes.js` → `window.LouInlineNotes` (extended)  
> **Parent:** [architecture-principles.md](./architecture-principles.md)  
> **Target spec:** [renderer-v2.2-walkthrough-notes.md](./renderer-v2.2-walkthrough-notes.md) §7.1–7.2  
> **Depends on:** [renderer-v2.2-02-store.md](./renderer-v2.2-02-store.md), [renderer-v2.2-03-caret-anchor.md](./renderer-v2.2-03-caret-anchor.md), restore (commit 4 — [target spec §8](./renderer-v2.2-walkthrough-notes.md#8-pipeline-de-restauration))

This document is the **implementation contract** for the creation commit only. It is not a changelog. Edit, delete, and CSS are explicitly deferred.

---

## 1. Objectif du commit

Permettre à l'apprenant de **créer** une Walkthrough Note depuis le walkthrough officiel :

1. Clic droit dans le texte officiel → menu contextuel **Add note**
2. Insertion d'un `<span.walkthrough-note>` vide au point exact du clic
3. Entrée **immédiate** en mode édition (`contenteditable`)
4. Premier **blur** :
   - texte vide → suppression DOM, **aucun** record IndexedDB
   - texte non vide → persistance via `addWalkthroughNote`, attribution `data-note-id`

Après ce commit, le cycle **création → persistance → restore au reload** est complet pour les nouvelles notes. L'apprenant ne peut pas encore ré-éditer (dblclick) ni supprimer (menu sur note) — commits suivants.

**Invariant préservé :** le Official Text Stream reste inchangé pendant et après la création (note additive exclue du flux).

---

## 2. Hors périmètre (explicitement exclu)

| Exclu | Commit prévu |
|---|---|
| Ré-édition double-clic | Commit 6 (§7.4–7.5) |
| `updateWalkthroughNote` | Commit 6 |
| Suppression menu « Supprimer la note » | Commit 6 (§7.6) |
| `deleteWalkthroughNote` depuis l'UI | Commit 6 |
| Styles `.walkthrough-note` (apparence bleue, etc.) | Commit 7 (§10) |
| Smoke navigateur WN-04 … WN-10 complets | Commit smoke dédié |
| Modification de `text-highlights.js` | Interdit V2.2 |
| Modification de `caret-anchor.js` (sauf bugfix bloquant) | Interdit — déléguer |
| Modification de `learner-store.js` | Interdit — API existante |
| Modification de `blocks.js` (déjà câblé au commit restore) | Interdit sauf bugfix mount order |
| Modification de `renderer.js` / `app.js` | Interdit |
| Factorisation anchoring partagée avec highlights | Interdit V2.2 (D6) |
| Migration / orphan panel ancres perdues | Interdit V2.2.0 (D15) |
| Toolbar, modal, dialogue de confirmation | Interdit |

---

## 3. UX complète (commit 5)

### Déclencheur

- **Événement :** `contextmenu` (clic droit) ou équivalent platform sur `#content`
- **Zone valide :** point de clic résolvable dans un conteneur `[data-official="true"]` du walkthrough, **hors** sous-arbre `.walkthrough-note`
- **Zone invalide (silencieux, pas de menu) :** hors walkthrough officiel, inside note existante, chrome non-prose si non résolvable

### Menu contextuel

| Propriété | Valeur |
|---|---|
| Type | Menu positionné près du curseur — **pas** modal natif |
| Entrée unique (commit 5) | **Add note** (`_MENU_ADD_LABEL`) |
| Fermeture | Clic ailleurs (`mousedown` document), scroll fenêtre, action menu |
| Sur une note existante (commit 5) | **Pas** d'entrée delete — menu create-only ou pas de menu (voir §11 Q1) |

### Action « Add note »

1. Menu se ferme
2. Span note vide inséré au point du clic (insertion inside `<mark.learner-highlight>` **autorisée** — D8)
3. Span passe en `contenteditable="true"`
4. Focus immédiat dans le span — curseur prêt à saisir
5. Aucun record IndexedDB tant que le blur n'a pas validé un texte non vide

### Premier blur

| Contenu après `trim()` | Comportement |
|---|---|
| Vide | Retrait du span du DOM ; rien en IndexedDB |
| Non vide | `addWalkthroughNote` ; `data-note-id` posé ; sortie du mode édition |

### Affichage post-blur (sans CSS dédié)

- Span non-éditable, texte visible (style navigateur par défaut jusqu'au commit CSS)
- Note persistée reloadable via restore existant

---

## 4. Cycle de vie — note transitoire (pending note)

Ce commit introduit une **troisième catégorie** d'existence pour une Walkthrough Note, distincte des notes persistées (commit 4 restore) et de l'absence totale :

| Catégorie | Nom interne | Description |
|---|---|---|
| Absente | — | Aucun span, aucun record |
| **Transitoire (pending)** | **pending note** | Span DOM en édition ; **pas** en IndexedDB |
| Persistée (stable) | persisted note | Record IndexedDB + `data-note-id` |

Le menu contextuel (§3) n'est **pas** une note — c'est un état UI éphémère du module, sans span walkthrough.

### 4.1 Diagramme d'ensemble

```
[0] Absente
      │  contextmenu + « Add note »
      ▼
[P] Pending — span inséré, contenteditable, CaretAnchor en WeakMap
      │
      ├─ blur + texte vide ──► [0] Absente
      │
      ├─ re-render sans blur ──► [0] Absente (pending abandonné — §4.5)
      │
      └─ blur + texte non vide
              ▼
         [S] Persistée — data-note-id + record IndexedDB
              │  re-render / reload
              ▼
         [R] Restaurée — même sémantique [S], réinjectée par restore()
```

**Fin du cycle couvert par ce commit :** de [0] à [S], plus reload [R] via restore existant.

### 4.2 États détaillés

#### État 0 — Absente

| Aspect | Valeur |
|---|---|
| DOM | Aucun `<span.walkthrough-note>` à l'emplacement |
| IndexedDB | Aucun record pour cette note |
| `_pendingAnchors` | Aucune entrée pour un span inexistant |
| `_activeEditNote` | `null` |
| Visible par `restore()` | Non — rien à restaurer |
| **Source de vérité** | IndexedDB (liste vide pour cette note) + DOM (pas de span) |

**Invariants État 0 :**

- Le Official Text Stream ne contient pas de texte additif de note à cette position.
- Aucun `data-note-id` orphelin ne traîne dans le walkthrough pour une note en cours de création.

---

#### État P — Pending (note transitoire)

Point d'entrée : succès de « Add note » jusqu'au blur (non inclus).

| Aspect | Valeur |
|---|---|
| DOM | `<span class="walkthrough-note" data-learner="true">` — **sans** `data-note-id` |
| `contenteditable` | `"true"` — l'apprenant saisit le texte |
| IndexedDB | **Aucun write** — la note n'existe pas pour le store |
| `_pendingAnchors` | **Entrée active** : `{ walkthrough, element, anchor, context }` |
| `_activeEditNote` | Référence vers ce span |
| Visible par `restore()` | **Non** — `restore()` ne connaît que les records IndexedDB ; un pending n'a pas de `data-note-id` et ne doit pas être doublonné |
| **Source de vérité (position)** | **`PendingCreate.anchor`** capturé au clic — pas le DOM courant |
| **Source de vérité (texte)** | **`noteEl.textContent`** — contenu éditable non encore commité |
| **Source de vérité (scope)** | **`PendingCreate.context`** — chapter + projection figés au clic |

**Invariants État P :**

- P1 — La note est **uniquement UI** : sa disparition (blur vide) ne laisse aucune trace en base.
- P2 — Le texte saisi dans le span **n'entre pas** dans le Official Text Stream (sous-arbre `.walkthrough-note` exclu par TreeWalker).
- P3 — L'Official Text Stream du walkthrough est **identique** à ce qu'il était juste avant l'insertion du span (les caractères officiels sous-jacents ne sont pas modifiés).
- P4 — **`restore()` ne recrée jamais** un pending — voir §4.5.
- P5 — **`data-note-id` absent** est le marqueur discriminant pending vs persistée.
- P6 — Une seule pending en édition à la fois (`_activeEditNote`).
- **P7 — Tout re-render invalide les notes pending** — pas de commit implicite, pas de write IndexedDB, pas de transfert ; voir §4.5.

**Ce qu'un pending n'est pas :**

- Ce n'est **pas** un record `WalkthroughNoteRecord` partiel en IndexedDB.
- Ce n'est **pas** visible au reload tant qu'il n'a pas transité vers État S.
- Ce n'est **pas** ancré par une adresse DOM — l'ancre logique est le `CaretAnchor` en WeakMap.

---

#### Transition P → 0 — Blur texte vide (discard)

| Aspect | Avant | Après |
|---|---|---|
| DOM | Span présent | Span **retiré** (`remove()`) |
| IndexedDB | Inchangé (vide) | Inchangé — **aucun write** |
| `_pendingAnchors` | Entrée présente | **`delete(noteEl)`** |
| `_activeEditNote` | span | `null` |

**Source de vérité finale :** IndexedDB + DOM absents — comme État 0.

**Invariant :** aucun appel `addWalkthroughNote` ; aucun effet sur le flux officiel (le span additif disparaît).

---

#### État S — Persistée (stable, post-blur réussi)

Point d'entrée : blur avec texte non vide + `addWalkthroughNote` résolu.

| Aspect | Valeur |
|---|---|
| DOM | `<span.walkthrough-note data-note-id="{id}">` — `contenteditable="false"` |
| IndexedDB | Record complet : `{ id, chapter, projection, element, anchor, text, created }` |
| `_pendingAnchors` | **Entrée supprimée** — le pending a été consommé |
| `_activeEditNote` | `null` |
| Visible par `restore()` | **Oui** — `listWalkthroughNotes` retourne le record ; restore idempotent via `data-note-id` |
| **Source de vérité (données)** | **IndexedDB** — le DOM est une projection reconstructible |
| **Source de vérité (position)** | **`record.anchor`** (CaretAnchor) — plus le WeakMap |
| **Source de vérité (texte)** | **`record.text`** — le DOM doit correspondre après persist |

**Invariants État S :**

- S1 — **`data-note-id` présent** ⟺ record existant en base (après blur réussi).
- S2 — Le texte en base est le `trim()` du contenu saisi au blur.
- S3 — L'ancre persistée est celle capturée en État P (pas recalculée au blur).
- S4 — `restore()` peut reconstruire le span à partir du record seul (commit 4).

---

#### État R — Restaurée (après re-render)

Sémantiquement identique à **État S** pour l'apprenant. Différence interne : le span a été **détruit** puis **réinjecté** par `restore()`, pas conservé en continu.

| Aspect | Valeur |
|---|---|
| Source de vérité | **IndexedDB uniquement** — le DOM est jetable |
| Pending | Impossible — pas de WeakMap, pas de `contenteditable` |

**Invariant :** `restore()` ne crée jamais de pending ; il ne restaure que des records avec texte non vide.

---

### 4.3 Tableau — source de vérité par étape

| Question | État 0 | État P (pending) | État S / R (persistée) |
|---|---|---|---|
| Où est le **texte** ? | — | DOM (`textContent` éditable) | IndexedDB `record.text` |
| Où est la **position** ? | — | WeakMap `PendingCreate.anchor` | IndexedDB `record.anchor` |
| Où est l'**identité** ? | — | Aucune (pas d'id) | IndexedDB `record.id` → `data-note-id` |
| Que fait **`restore()`** ? | Rien | Rien (ignore les pending) | Réinjecte depuis IndexedDB |
| Write IndexedDB ? | Non | **Non** | Oui (une fois, au blur) |
| Official Text Stream ? | Référence | **Inchangé** vs avant insert | **Inchangé** (texte note exclu) |

### 4.4 Quand une note devient visible par `restore()`

| Moment | Visible par restore ? |
|---|---|
| Pendant État P (édition en cours) | **Non** |
| Après blur vide | **Non** |
| Après blur + persist réussi (État S) | **Oui** — au prochain mount |
| Après reload sans avoir blur (edge) | **Non** — pending abandonné au re-render (§4.5) |

**Règle normative :** seul un **record IndexedDB** rend une note eligible à `restore()`. Le DOM seul ne suffit jamais.

### 4.5 Re-render pendant une note pending — règle normative

#### Énoncé (décision fermée)

> **La note pending est abandonnée.**

Si un `renderProjection()` / `blocks.render()` survient alors qu'une note est en **État P** (span inséré, `contenteditable` actif, blur non encore survenu) :

| Action | Autorisé ? |
|---|---|
| Span pending disparaît avec le re-render | **Oui** — conséquence normale |
| `addWalkthroughNote()` | **Non** |
| Write IndexedDB | **Non** |
| Sauvegarde implicite du texte saisi | **Non** |
| Transfert / repositionnement de la note | **Non** |
| Entrée `_pendingAnchors` conservée | **Non** — abandonnée |
| `restore()` ne restaure que les records persistés | **Oui** |

**Séparation normative :**

```
pending   = état UI purement temporaire
persisted = état durable (IndexedDB)
```

Le renderer **ne provoque jamais un commit implicite**. Seul un blur explicite avec texte non vide déclenche `addWalkthroughNote`.

#### Scénario déclencheur

```
Utilisateur : « Add note » → État P (édition en cours, texte partiel possible)
      │
      │  renderProjection() — changement d'onglet, reload, refresh, etc.
      ▼
blocks.render()
  host.innerHTML = ""          ← span pending détruit
  … assemble, hydrate …
  LouInlineNotes.mount()
      _activeEditNote = null   ← abandon explicite état module
      restore()                ← uniquement records IndexedDB
      bind()
      │
      ▼
État 0 pour la note abandonnée — aucun record créé
```

#### Responsabilités par composant

| Composant | Rôle dans l'abandon pending |
|---|---|
| **`blocks.js`** | **Déclenche le re-render** : `host.innerHTML = ""` détruit l'intégralité du DOM sous `#content`, **incluant le span pending**. Ne connaît pas les notes pending. N'appelle jamais `addWalkthroughNote`. |
| **`inline-notes.js` — `mount()`** | **Abandon explicite de l'état module** : en tête de `mount()`, remettre `_activeEditNote = null` et `_committing = false` **sans** appeler `_commitOnBlur`. Puis `restore()` — **lecture seule** IndexedDB. **Ne tente pas** de sauvegarder le pending. |
| **`inline-notes.js` — `restore()`** | Réinjecte **uniquement** les records persistés (État S). Ignore les pending — aucun `data-note-id` absent n'est recréé. |
| **`inline-notes.js` — `_pendingAnchors`** | Entrée liée au span : lorsque le span est retiré du DOM et qu'aucune référence forte ne subsiste (`_activeEditNote` remis à `null`), la clé WeakMap devient **eligible GC** — pas de fuite, pas de `clear()` global requis. |
| **`learner-store.js`** | **Aucune participation** — aucun write n'est déclenché par un re-render. |
| **`caret-anchor.js`** | **Aucune participation** — pas de recalcul d'ancre au re-render. |

**Qui supprime le span pending ?** `blocks.js` via `host.innerHTML = ""` — pas un `remove()` explicite dans `inline-notes.js`. C'est une **destruction structurelle** du host, pas une finalisation métier.

**Qui nettoie `_pendingAnchors` ?** Abandon combiné : (1) span détruit → clé WeakMap sans référence forte ; (2) `mount()` remet `_activeEditNote = null` pour ne pas retenir le nœud ; (3) aucune entrée pending ne survit au cycle mount suivant.

#### Transition normative : P → 0 via re-render (abandon)

Distincte de **P → 0 via blur vide** (§4.2) :

| Aspect | Blur vide | Re-render mid-edit |
|---|---|---|
| Déclencheur | Utilisateur (blur) | `blocks.render()` |
| `remove()` explicite | Oui (`inline-notes.js`) | Non — destruction `innerHTML` |
| `_pendingAnchors.delete` | Oui, explicite | Abandon / GC |
| Texte saisi perdu | Oui (intentionnel) | Oui (intentionnel) |
| Write IndexedDB | Non | Non |

#### Justification — pourquoi pas de sauvegarde automatique ?

| Alternative écartée | Problème |
|---|---|
| Auto-`addWalkthroughNote` au re-render si texte non vide | **Commit implicite** — l'utilisateur n'a pas blur ; viole le contrat « store après validation blur » (§7.2) |
| Conserver le pending en mémoire et réinjecter après render | Mélange pending/persisted ; complexifie mount ; risque de doublons avec restore ; pending deviendrait semi-durable |
| Migrer le span pending vers le nouveau DOM | Repositionnement DOM fragile ; ancrage dépendant du tree — contraire à « IndexedDB = vérité durable, DOM = projection » |
| Bloquer le re-render si pending | Inacceptable — tab switch et reload ne peuvent pas être refusés |

**Décision retenue :** pending = **jetable sans ambiguïté**. L'utilisateur perd le brouillon non validé — comportement prévisible, implémentation simple, invariants N9/P7 préservés, aligné avec le principe Learner Layer reconstructible (seul IndexedDB compte après blur).

#### Conséquence UX (commit 5)

Changer d'onglet ou recharger **sans blur** fait disparaître la note en cours de saisie. Accepté. Pas de toast, pas de warn — abandon silencieux (symétrique au blur vide).

---

## 5. États internes du module (`inline-notes.js`)

Introduits à ce commit (module cesse d'être entièrement stateless) :

| État | Type | Rôle |
|---|---|---|
| `_boundHost` | `HTMLElement \| null` | Host `#content` — listeners attachés une seule fois |
| `_bindContext` | object \| null | Contexte courant — **mis à jour à chaque `bind()`** même si host identique (D11, miroir V2.1) |
| `_contextMenuEl` | `HTMLElement \| null` | Menu réutilisé, créé lazily |
| `_activeEditNote` | `HTMLElement \| null` | Note en cours d'édition — max **une** (§7.8) |
| `_committing` | `boolean` | Anti double-blur / re-entrancy pendant await store (D13, R6) |
| `_pendingAnchors` | `WeakMap<HTMLElement, PendingCreate>` | Ancrage figé entre création DOM et blur persist |

### `PendingCreate` (WeakMap value)

| Champ | Type | Description |
|---|---|---|
| `walkthrough` | `HTMLElement` | Conteneur walkthrough |
| `element` | `string` | Blueprint element id (`block.dataset.element`) |
| `anchor` | `CaretAnchor` | Capturé **avant** insertion via `LouCaretAnchor.createCaretAnchor` |
| `context` | object | Snapshot `{ chapter, projection }` au moment de la création |

Voir **§5.1** pour la justification architecture complète de `_pendingAnchors`.

### 5.1 Justification architecture — `_pendingAnchors`

Cette section explique **pourquoi** le stockage temporaire existe, pas seulement **comment** il est utilisé.

#### Pourquoi un stockage temporaire est-il nécessaire ?

Entre l'insertion du span (État P) et le blur (commit ou discard), il existe un **décalage temporal** entre :

1. **Où** la note sera ancrée (point dans le flux officiel — décision prise au clic)
2. **Ce que** la note contient (texte saisi — décision prise au blur)
3. **Si** la note existera en base (blur vide → aucun record)

IndexedDB n'accepte pas un record sans texte non vide (`addWalkthroughNote` rejette le vide). Le contrat V2.2 (§7.1–7.2) impose : **DOM d'abord, store seulement après validation utilisateur**.

Il faut donc **retenir l'ancre** entre ces deux moments sans l'écrire en base. `_pendingAnchors` est ce tampon **strictement in-memory**, lié au span pending.

#### Pourquoi ne pas recalculer le CaretAnchor au blur ?

**Interdit architecturalement** pour trois raisons convergentes :

| Raison | Explication |
|---|---|
| **API publique** | `LouCaretAnchor.createCaretAnchor(walkthrough, container, offsetInContainer)` exige un **point DOM**. Au blur, le caret est **inside** le span `.walkthrough-note`. Or le texte d'une note est **exclu** du flux officiel — `createCaretAnchor` depuis l'intérieur du span retourne `null`. |
| **Pas d'offset-only public** | Reconstruire l'ancre au blur via offset seul appellerait une primitive interne (`_anchorFromOffset`) ou dupliquerait la logique du flux officiel dans `inline-notes.js` — violerait N2/N3. |
| **Invariant R9** | L'offset de création est défini **avant** l'existence du span additif. Recalculer après insertion pourrait, selon l'état du DOM (fragmentation, saisie), produire une ambiguïté de point — la capture **au clic** fige la décision d'ancrage au moment où le flux officiel est encore non perturbé par cette note. |

**Conclusion :** l'ancre est une **decision log snapshot** prise au clic ; le blur ne fait que **consommer** ce snapshot avec le texte final.

#### Pourquoi un WeakMap ?

| Propriété WeakMap | Bénéfice |
|---|---|
| Clé = objet DOM (`noteEl`) | Lookup O(1) dans `_commitOnBlur(noteEl)` sans sérialiser |
| Clés faiblement référencées | Si le span est retiré du DOM et plus référencé ailleurs, **GC collecte** l'entrée — pas de registre global à nettoyer manuellement en cas d'oubli |
| Pas enumerable | Pas de fuite de métadonnées dans le DOM inspectable ; pas de pollution `dataset` |

Le WeakMap n'est **pas** choisi pour cacher des secrets — il lie naturellement la métadonnée de création à la **durée de vie du nœud pending**.

#### Qui crée l'entrée ?

**`_onCreateNote`** (ou primitive équivalente), **immédiatement après** :

1. `LouCaretAnchor.createCaretAnchor(...)` réussi — capturé **avant** que le span n'existe dans le tree
2. `_insertNoteAtRange(range, noteEl)`
3. `_pendingAnchors.set(noteEl, pendingCreate)`

**Créateur unique :** le flux « Add note ». Aucun autre code path n'écrit dans `_pendingAnchors` au commit 5.

#### Qui consomme l'entrée ?

**`_commitOnBlur(noteEl)`** — branche texte non vide :

- Lit `pending = _pendingAnchors.get(noteEl)`
- Passe `pending.anchor` à `addWalkthroughNote`
- Passe `pending.context` et `pending.element` pour le record

Si `pending` absent au blur avec texte : comportement défensif — retirer le span, abort silencieux (état incohérent).

#### Qui détruit l'entrée ?

| Événement | Action |
|---|---|
| Blur texte vide | `_pendingAnchors.delete(noteEl)` puis `noteEl.remove()` |
| Blur texte non vide + store OK | `delete` après `data-note-id` posé |
| Blur texte non vide + store fail | `delete` dans rollback (span retiré) |
| Span retiré sans blur propre (edge) | Entrée **eligible GC** via WeakMap si plus de référence forte |

**Pas de `clear()` global** — chaque pending a un cycle de vie explicite ou GC.

#### Durée de vie exacte

```
T0  createCaretAnchor (clic)
T1  insertNode(span)
T2  _pendingAnchors.set(noteEl, ...)     ← naissance entrée
T3  … utilisateur édite (État P) …
T4  blur → _commitOnBlur
T5  delete(noteEl) ou GC                  ← mort entrée
```

Durée typique : **secondes** (session d'édition). Maximum théorique : tant que l'utilisateur laisse le span focused sans blur — une seule entrée active grâce à `_activeEditNote`.

#### Peut-il exister plusieurs entrées simultanément ?

**Non en État P actif** — invariant N11 / `_activeEditNote` :

- Une seule note en édition à la fois.
- Si l'utilisateur lance une **deuxième** création (« Add note ») pendant qu'une pending est en édition : **`_commitOnBlur` sur la première** est déclenché d'abord (programmatique ou blur) — la première transite vers 0 ou S avant que la seconde n'entre en P.

**Conséquence :** au plus **une** entrée WeakMap **active** en pratique. Une entrée orpheline (span retiré sans delete explicite) est théoriquement GC-able — pas d'accumulation.

#### Que se passe-t-il si plusieurs créations sont lancées avant le blur de la première ?

Séquence normative (§6.4) :

```
_onCreateNote (2e)
  → if _activeEditNote: commit/blur 1re note d'abord
  → puis création 2e pending
```

Cas limites :

| Cas | Résultat |
|---|---|
| 1re blur vide, 2e create | 1re → État 0 ; 2e → État P — une entrée WeakMap |
| 1re blur persist, 2e create | 1re → État S ; 2e → État P — une entrée WeakMap |
| Re-render mid-edit (tab switch, reload) | Pending abandonné — pas de write store ; `_activeEditNote` reset au mount (§4.5) ; abandon silencieux |

#### Risque de fuite mémoire ?

| Risque | Mitigation |
|---|---|
| Entrée WeakMap survit au span | WeakMap — clé collectée avec le nœud DOM |
| `_activeEditNote` stale | Remis à `null` à chaque sortie de blur / rollback |
| Listeners blur par note | Détachés à `_exitEditMode` / `remove` (§11 Q7) |
| Menu DOM | Réutilisé (`_contextMenuEl`) — singleton, pas par note |

**Verdict :** risque faible ; WeakMap + une seule pending active + delete explicite aux transitions.

#### Pourquoi ne pas stocker l'ancre directement sur le span ?

Exemples écartés : `data-anchor='{"offset":…}'`, propriété expando `noteEl._anchor`.

| Approche | Problème |
|---|---|
| `data-*` JSON | Sérialisation / désérialisation ; risque d'inspection / mutation DOM ; ancre n'est **pas** un attribut UI (contrat §3.3 — pas d'attribut DOM pour offset/anchor) |
| Expando `noteEl._anchor` | Survit tant que le nœud existe — OK, mais mélange métadonnées module et nœud DOM ; tests et restore path pourraient lire des ancres stale ; violation séparation « DOM = projection, store = vérité » |
| Recalcul au blur | Voir ci-dessus — **impossible** depuis l'intérieur du span |

**Décision :** WeakMap externe au nœud — métadonnée **module-owned**, non persistée dans le HTML, non visible par `restore()`, supprimée à la transition P → S ou P → 0. Aligné avec le principe : le DOM pending est **jetable** ; seul le record IndexedDB (post-blur) est durable.

#### Synthèse pour un nouveau développeur

> Au clic, on décide **où** la note vivra (CaretAnchor).  
> Pendant l'édition, seul le **texte** est mutable.  
> Au blur, on décide **si** la note existe en base.  
> `_pendingAnchors` retient la décision « où » entre clic et blur, parce qu'on ne peut ni écrire en base sans texte, ni recalculer l'ancre depuis l'intérieur du span.  
> WeakMap lie cette décision au span pending sans polluer le DOM ni IndexedDB.

---

## 6. Séquence détaillée des appels

### 6.1 Boot (inchangé + bind)

```
blocks.render()
  finally:
    LouTextHighlights.mount(host, context)
    LouInlineNotes.mount(host, context)
      _activeEditNote = null              ← abandon pending (§4.5) — NO commit
      _committing = false
      try:
        restore(host, context)          ← commit 4, inchangé — persisted only
      catch:
        console.warn (échec global restore)
      finally:
        bind(host, context)             ← NOUVEAU commit 5
```

### 6.2 `bind(host, context)`

```
bind(host, context)
  _bindContext = context                 ← ALWAYS first
  if _boundHost === host: return
  _boundHost = host
  host.addEventListener("contextmenu", capture → _onContextMenu)
  document.addEventListener("mousedown", → _hideContextMenu si hors menu)
  window.addEventListener("scroll", → _hideContextMenu)
  // PAS de dblclick au commit 5
```

### 6.3 Clic droit → menu

```
Utilisateur: contextmenu sur #content
  ↓
LouInlineNotes._onContextMenu(event)
  ↓
_walkthroughFromTarget(event.target, host)
  → null si hors [data-official="true"] : abort silencieux
  ↓
_noteFromElement(event.target)
  → non-null si inside .walkthrough-note : abort silencieux (commit 5)
  ↓
event.preventDefault()
  ↓
_hideContextMenu() si déjà ouvert
  ↓
_showContextMenu(event.clientX, event.clientY, { kind: "create", walkthrough, ... })
  → menu DOM avec bouton « Add note »
```

**Responsabilités :** `inline-notes.js` uniquement. Pas de store, pas de CaretAnchor encore.

### 6.4 Clic « Add note »

```
Utilisateur: click sur entrée menu
  ↓
LouInlineNotes._onCreateNote(pendingClickContext)
  ↓
_hideContextMenu()
  ↓
Si _activeEditNote: _commitOnBlur() ou blur programmatique d'abord
  ↓
_caretRangeFromClick(walkthrough, event)    ← privé inline-notes
  → document.caretRangeFromPoint / Range collapsed
  → rejette si point dans .walkthrough-note
  ↓
LouCaretAnchor.createCaretAnchor(
  walkthrough,
  range.startContainer,
  range.startOffset
)
  → null : abort silencieux
  ↓
_createNoteElement()                         ← span sans id, texte vide
  ↓
_insertNoteAtRange(range, noteEl)            ← range.insertNode
  ↓
_pendingAnchors.set(noteEl, { walkthrough, element, anchor, context })
  ↓
_enterEditMode(noteEl)
  → contenteditable = true
  → _activeEditNote = noteEl
  → noteEl.focus()
  ↓
attach blur listener (once ou délégué) → _commitOnBlur
attach keydown Escape → noteEl.blur()
```

**IndexedDB : aucune écriture à cette étape.**

Correspondance modules :

| Étape | Module |
|---|---|
| Menu / DOM note / edit mode | `inline-notes.js` |
| `createCaretAnchor` | `caret-anchor.js` |
| `restoreCaretAnchor` | **non utilisé** à la création |
| Store | **non utilisé** à la création |

### 6.5 Premier blur → persist ou discard

```
Utilisateur: blur du span (ou Escape → blur)
  ↓
LouInlineNotes._commitOnBlur(noteEl)
  ↓
if _committing: return
  ↓
text = noteEl.textContent.trim()
  ↓
[Branche vide]
  noteEl.remove()
  _pendingAnchors.delete(noteEl)
  _activeEditNote = null
  _exitEditMode (no-op si déjà retiré)
  → FIN (pas de store)
  ↓
[Branche non vide]
  pending = _pendingAnchors.get(noteEl)
  → absent : remove noteEl ; abort
  ↓
_committing = true
  ↓
LouLearnerStore.addWalkthroughNote(
  pending.context.chapter,
  pending.context.projection.id,
  pending.element,
  pending.anchor,                            ← CaretAnchor figé à la création
  text
)
  ↓
.then(id):
  noteEl.setAttribute("data-note-id", String(id))
  _pendingAnchors.delete(noteEl)
  _exitEditMode(noteEl)                      ← contenteditable false — APRÈS store OK (D13)
  _activeEditNote = null
  _committing = false
  ↓
.catch(err):
  _rollbackNote(noteEl)                      ← remove DOM
  _pendingAnchors.delete(noteEl)
  _activeEditNote = null
  _committing = false
  → pas de console.warn (échec utilisateur local) ; optionnel console.debug
```

**Ordre impératif (D13) :** await `addWalkthroughNote` **avant** `_exitEditMode`. Échec store → rollback DOM, pas de `data-note-id`.

### 6.6 Reload après création réussie

```
render / mount
  ↓
restore()                                  ← commit 4, inchangé
  ↓
listWalkthroughNotes → restoreCaretAnchor → insertNode (idempotent)
```

---

## 7. Répartition stricte des responsabilités

### `blocks.js`

| Fait | Ne fait pas |
|---|---|
| Orchestration render ; `host.innerHTML = ""` **détruit le span pending** au re-render ; `finally` appelle `LouInlineNotes.mount` **après** highlights | Logique notes, menu, anchoring, store ; commit implicite pending ; détection explicite des pending |
| Passe `context` inchangé | Écoute d'événements notes ; nettoyage `_pendingAnchors` |

### `inline-notes.js`

| Fait | Ne fait pas |
|---|---|
| `restore` (commit 4) ; `bind` + listeners (commit 5) ; menu ; création DOM ; edit mode ; `_commitOnBlur` ; `addWalkthroughNote` au premier blur ; idempotence restore ; **reset `_activeEditNote` en tête de `mount()`** (abandon pending §4.5) | Calcul du flux officiel ; offsets ; `createCaretAnchor` / `restoreCaretAnchor` (délègue) ; `updateWalkthroughNote` ; delete UI ; CSS ; commit implicite au re-render |
| Convertit clic → Range → appelle CaretAnchor | Modifie le texte officiel in-place |

### `caret-anchor.js`

| Fait | Ne fait pas |
|---|---|
| `createCaretAnchor(walkthrough, container, offsetInContainer)` | UI, store, insertion DOM, listeners |
| `restoreCaretAnchor` (utilisé par restore, pas par create flow sauf tests) | Écriture IndexedDB |

### `learner-store.js`

| Fait | Ne fait pas |
|---|---|
| `addWalkthroughNote(chapter, projection, element, anchor, text)` — appelé au blur | DOM, anchoring, UI ; validation sémantique du CaretAnchor |

---

## 8. Gestion des erreurs

| Situation | Comportement | Log |
|---|---|---|
| Clic droit hors walkthrough officiel | Pas de menu | Silencieux |
| Clic droit inside `.walkthrough-note` | Pas de menu | Silencieux |
| `createCaretAnchor` → null | Pas de note créée | Silencieux |
| Blur texte vide | Span retiré | Silencieux |
| `addWalkthroughNote` rejette (texte vide — ne devrait pas arriver post-trim) | Rollback DOM | Silencieux ou debug |
| `addWalkthroughNote` rejette (IDB error) | Rollback DOM ; span retiré | Silencieux (pas warn) ; debug optionnel |
| `listWalkthroughNotes` échoue au mount (restore) | Warn unique ; bind exécuté quand même | `console.warn` `[LouInlineNotes] Note restore failed.` |
| Exception inattendue dans restore | Warn ; bind continue | warn |
| Exception inattendue dans create flow | Rollback DOM si span partiel ; pas de crash renderer | debug |
| Re-render pendant État P (sans blur) | Pending abandonné ; span détruit par `innerHTML` ; pas de store write | Silencieux (§4.5) |

**Principe commit 5 :** les dégradations **par interaction utilisateur** (point invalide, blur vide) sont silencieuses. Seul l'échec **global** de `restore` au mount conserve le warn existant.

---

## 9. Invariants (doivent rester vrais)

| ID | Invariant |
|---|---|
| N1 | **Official Text Stream immuable** — création n'ajoute que span exclu ; texte officiel non réécrit |
| N2 | **CaretAnchor = seule source d'ancrage** — offsets via `LouCaretAnchor` uniquement |
| N3 | **Aucun offset calculé dans inline-notes** — pas de TreeWalker local |
| N4 | **Ancre figée à la création** — `PendingCreate.anchor` capturé avant insertion additif (R9) |
| N5 | **Restore idempotent** — commit 4 inchangé ; `data-note-id` guard |
| N6 | **Couche additive uniquement** — `insertNode`, pas de mutation `#text` officiel |
| N7 | **Mount après highlights** — ordre blocks.js |
| N8 | **Scope projection** — `addWalkthroughNote` inclut `projection.id` du `_bindContext` courant |
| N9 | **Pas de record vide en base** — blur vide → pas d'appel store |
| N10 | **Persist before exit edit** (D13) — await store avant `contenteditable=false` |
| N11 | **Une note en édition max** — nouvelle création blur l'édition en cours |
| N12 | **text-highlights.js frozen** — pas de `mouseup` / `selectionchange` sur notes |
| N13 | **Insertion inside highlight autorisée** — pas de garde anti-mark |
| N14 | **Non-régression V2.1** — smoke matrix verte |
| N15 | **Pas de commit implicite au re-render** — pending abandonné ; seul blur explicite persist (§4.5, P7) |

---

## 10. Tests

### Intégration unitaire (`test/walkthrough-notes-create.test.js`)

| ID | Scénario | Vérifie |
|---|---|---|
| **WT-10** | Create → blur sans saisie | Pas de span ; `listWalkthroughNotes` vide |
| **WT-11** | Create → saisie → blur | Record en store ; `data-note-id` ; texte |
| **WT-12** | `addWalkthroughNote` rejette après saisie | Span retiré ; pas de `data-note-id` ; pas de record |
| **WT-17** | Tab switch simulé (re-bind context projection B) | `_bindContext.projection` à jour ; création utilise projection B |
| **WT-CR-01** | `contextmenu` sur texte officiel | Menu visible avec « Add note » |
| **WT-CR-02** | `contextmenu` inside `.walkthrough-note` | Pas de menu (ou pas d'action create) |
| **WT-CR-03** | `contextmenu` hors walkthrough | Pas de menu |
| **WT-CR-04** | Add note → `contenteditable` + focus | Édition immédiate |
| **WT-CR-05** | Create inside `mark.learner-highlight` | Note insérée ; highlight intact |
| **WT-CR-06** | Blur avec texte → reload → restore | Round-trip create + restore commit 4 |
| **WT-CR-07** | Official stream inchangé après create + persist | `_officialStreamText` before === after |
| **WT-CR-08** | Deuxième create pendant édition | Première note commit ou discard avant seconde |
| **WT-CR-09** | Escape → blur → comportement identique blur | Vide → gone |
| **WT-CR-10** | Mount restore fail + bind | Listeners actifs ; create still works |
| **WT-CR-11** | Pending sans `data-note-id` invisible à `restore()` | Seuls records IDB restaurés |
| **WT-CR-12** | `_pendingAnchors` delete après blur vide | Pas d'entrée orpheline |
| **WT-CR-13** | Create → saisie partielle → `renderProjection()` sans blur | Span pending absent ; `listWalkthroughNotes` vide ; `_activeEditNote === null` après mount ; **aucun** write store |

### Smoke navigateur (reporté en partie — minimum si infra prête)

| ID | Scénario | Commit |
|---|---|---|
| **WN-01** | Contextmenu → note vide → édition immédiate | 5 |
| **WN-02** | Blur empty → gone | 5 |
| **WN-03** | Blur text → reload → restored | 5 (+ restore 4) |

**Exclus commit 5 :** WN-04 (dblclick), WN-05 (delete), WN-06+.

### Non-régression obligatoire

- Suite unitaire complète (**113** tests au gel V2.2) — verte
- Smoke matrix V2.1 — verte

---

## 11. Questions d'architecture (décisions fermées)

### Q1 — Menu sur une note existante (commit 5)

Le contrat cible §7.6 place « Supprimer la note » au commit interaction. **Proposition commit 5 :** `contextmenu` on `.walkthrough-note` → **pas de menu** (abort silencieux). Delete arrive au commit 6.

**Alternative :** menu avec entrée disabled / absent — comportement identique observable.

### Q2 — CSS minimal pour l'édition sans commit 7

Sans styles, `contenteditable` est peu visible. **Proposition :** commit 5 sans CSS ; focus natif suffit pour tests jsdom. Si UX Preview inacceptable, autoriser **une** règle minimale `[contenteditable="true"] { outline: … }` — à valider explicitement (sinon commit 7 strict).

### Q3 — API publique `create()` vs privé `_onCreateNote`

L'exemple de séquence mentionnait `LouInlineNotes.create()`. **Proposition :** pas de méthode publique `create` — flux entièrement driven par événements via `_onCreateNote`. `restore` reste publique pour tests ; create testée via DOM events ou `_onCreateNote` en test.

### Q4 — `caret-anchor.js` : ancre à la création vs à la blur

**Décision fermée (voir §5.1) :** capturer `CaretAnchor` complet via `createCaretAnchor` **au clic**, stocker dans `_pendingAnchors`, utiliser tel quel au blur. Pas de recalcul au blur. Pas de nouvelle API publique `createAnchorFromOffset`.

### Q5 — `document.caretRangeFromPoint` en jsdom

Peut être absent ou approximatif. **Proposition tests :** helper test qui appelle `_onCreateNote` avec Range pré-construit, ou mock `caretRangeFromPoint`. Smoke Playwright pour WN-01 avec vrai `dispatchEvent('contextmenu')`.

### Q6 — Projection au moment du blur vs du clic

**Décision fermée :** `PendingCreate.context` fige chapter/projection **au clic** ; blur utilise ce snapshot — la note appartient à la projection où elle a été créée (aligné persistance V2.2).

**Interaction avec §4.5 :** si l'utilisateur change d'onglet ou déclenche un re-render **sans blur**, le pending est **abandonné** — la question projection au blur ne se pose pas. Le snapshot reste pertinent uniquement lorsque blur survient **avant** tout re-render.

### Q7 — Listeners blur : par note ou délégué

**Proposition :** listener `blur` attaché à la note à `_enterEditMode` ; retiré à `_exitEditMode` / remove — évite leak, simple pour une seule `_activeEditNote`.

### Q8 — Re-render mid-edit (DECISION FERMÉE)

**Décision :** pending abandonné — §4.5, P7, N15, WT-CR-13. Pas de sauvegarde automatique. Pas de question ouverte.

---

## 12. Fichiers touchés

| Fichier | Modification |
|---|---|
| `inline-notes.js` | `bind`, menu, create flow, edit mode, commit blur, état interne |
| `test/walkthrough-notes-create.test.js` | WT-10, WT-11, WT-12, WT-CR-* |
| `demo/renderer/docs/renderer-v2.2-04-note-creation.md` | Contrat milestone commit 5 |

**Non modifiés :** `blocks.js`, `index.html`, `caret-anchor.js`, `learner-store.js`, `text-highlights.js`, `styles.css`, `renderer.js`, `app.js`.

---

## 13. Critère de réussite

| Oui | Non |
|---|---|
| Clic droit → Add note → édition immédiate | dblclick edit |
| Blur vide → pas de record | update / delete |
| Blur texte → record + reload restore | CSS dédié |
| Re-render mid-edit → pending abandonné sans write | Sauvegarde implicite au re-render |
| Inside highlight OK | Modification CaretAnchor / store |
| V2.1 smoke green | |

---

## 14. Références

| Document | Lien |
|---|---|
| Target spec création §7.1–7.2 | [renderer-v2.2-walkthrough-notes.md](./renderer-v2.2-walkthrough-notes.md) |
| Restore (commit 4) | [target spec §8](./renderer-v2.2-walkthrough-notes.md#8-pipeline-de-restauration) ; `test/walkthrough-notes-restore.test.js` |
| Edit/delete (commit 6) | [renderer-v2.2-05-walkthrough-note-edit-delete.md](./renderer-v2.2-05-walkthrough-note-edit-delete.md) |
| CaretAnchor | [renderer-v2.2-03-caret-anchor.md](./renderer-v2.2-03-caret-anchor.md) |
| Store | [renderer-v2.2-02-store.md](./renderer-v2.2-02-store.md) |
| Tag jalon create | `renderer-v2.2-create-stable` |
