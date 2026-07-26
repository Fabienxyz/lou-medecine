# Renderer V2.2 — Walkthrough Notes

> **Status:** Approved implementation contract — **not yet implemented**  
> **Baseline:** `renderer-v2.1.0` (highlights frozen)  
> **Module:** `inline-notes.js` → `window.LouInlineNotes`  
> **Store:** `walkthrough_notes`  
> **Parent:** [architecture-principles.md](./architecture-principles.md) · [renderer-v2.1-highlights.md](./renderer-v2.1-highlights.md)

Design version: **2.2.0-design-final**

This document is the authoritative contract for V2.2 implementation. All architectural decisions are closed.

---

## 0. Contexte

### 0.1 Objectif

Introduire les **Walkthrough Notes** : notes textuelles personnelles, inline, ancrées par **Caret Anchor** dans le texte officiel d'une projection.

### 0.2 Périmètre

| In scope V2.2 | Out of scope V2.2 |
|---|---|
| Clic droit → Add note | Factorisation anchoring (`text-anchoring.js`) |
| Édition inline (dblclick, blur) | Modification de `text-highlights.js` |
| Suppression (clic droit) | Text formatting (V2.3) |
| Persistance `walkthrough_notes` | SVG overlays (V2.4) |
| Restore après reload / tab switch | Panneau orphans pour notes perdues |
| Non-régression smoke V2.1 | Sync cloud / export |

### 0.3 Prérequis (commit 0)

Avant tout code V2.2 :

1. Branche alignée sur tag **`renderer-v2.1.0`**
2. Retrait expérimentation Selection Notes (HEAD post-v2.1.0)
3. Retrait pipeline Claim Notes / C.9 (affordances, hydrate, store `inline_notes`, tests)

### 0.4 Terminologie

| Terme | Usage |
|---|---|
| **Walkthrough Note** | Concept métier |
| **WalkthroughNoteRecord** | Record IndexedDB |
| **`walkthrough_notes`** | Object store |
| **`inline-notes.js`** | Module implémentation |

Éviter : Claim Note, C.9, `inline_notes`, Selection Note.

---

## 1. Principes Learner Layer

### 1.1 Reconstructibilité

Les Walkthrough Notes constituent une **Learner Layer**. Elles ne modifient jamais le contenu officiel.

Le DOM des notes est **entièrement reconstructible** à partir de :

- le document officiel (walkthrough `[data-official="true"]`)
- les données persistées (`walkthrough_notes`)

Aucune information note ne doit être dérivée du DOM d'une autre Learner Layer.

### 1.2 Indépendance des Learner Layers

Chaque Learner Layer doit être :

| Propriété | Signification |
|---|---|
| **Indépendante** | Pas de dépendance runtime à une autre layer |
| **Reconstructible** | Restore = official DOM + propres records |
| **Supprimable** | Retirer module + store ne casse pas l'official |

**Graphe de dépendances (données uniquement) :**

```
Official DOM
    ↑
    ├── Highlights ← text_annotations
    ├── Walkthrough Notes ← walkthrough_notes
    ├── Personal Diagrams ← personal_diagrams
    └── SVG overlays (future) ← own store
```

Les Highlights **ne dépendent pas** des Notes.  
Les Notes **ne dépendent pas** des SVG.  
Les SVG **ne dépendront pas** des Highlights.

Chaque couche ne dépend que du **document officiel** et de **ses propres données persistées**.

Composition DOM (ordre de mount) ≠ dépendance de données.

---

## 2. Architecture générale

```
app.js / renderer.js
        │
        ▼
   blocks.js
        │  assemble (Official Layer)
        │  hydrate (Personal Diagrams)
        │
        ├──► LouTextHighlights.mount     [V2.1 GELÉ — inchangé]
        │       restore + bindSelection
        │           ▼
        │       IndexedDB.text_annotations
        │
        └──► LouInlineNotes.mount        [V2.2 NOUVEAU]
                restore + bind
                    ▼
                IndexedDB.walkthrough_notes
```

### 2.1 Séparation des responsabilités

| Module | Rôle |
|---|---|
| **`inline-notes.js`** | Caret Anchor, DOM `.walkthrough-note`, contextmenu, édition — **owner** |
| **`text-highlights.js`** | **Inchangé** — V2.1 gelé |
| **`blocks.js`** | Orchestration : mount notes **after** highlights |
| **`learner-store.js`** | CRUD `walkthrough_notes` |
| **`renderer.js`**, **`app.js`** | Aucune modification V2.2 |

### 2.2 Principes non négociables

1. **`text-highlights.js` inchangé** — smoke V2.1 verte avant merge V2.2
2. **Pas de factorisation** anchoring V2.2 — duplication locale assumée
3. **Espace de coordonnées** aligné V2.1 (§5) + exclusion additifs
4. **Third pass** — notes après highlights
5. **Projection-scoped** — `(chapter, projection)` sur chaque record
6. **Un seul concept métier** — Walkthrough Note

### 2.3 Factorisation future (documentation seulement)

| Primitive | V2.1 | V2.2 | Factorisable quand |
|---|---|---|---|
| TreeWalker + offset | `_forEachTextNode` | `_walkOfficialTextNodes` | ≥2 implémentations stables |
| Offset → Range half-open | `_rangeFromTextOffsets` | `_caretRangeFromOffset` | Tests croisés non-régression |
| Prefix/suffix 32 chars | `CONTEXT_CHARS` | `_CONTEXT_CHARS` | Unification Range/Caret |
| `_bindContext` / `_boundHost` | `bindSelection` | `bind` | Module lifecycle commun |

**Ne pas extraire en V2.2.**

---

## 3. Modèle de données

### 3.1 WalkthroughNoteRecord

| Champ | Type | Obligatoire | Description |
|---|---|---|---|
| `id` | number | auto | Clé IndexedDB |
| `chapter` | string | oui | ex. `"cardio/234"` |
| `projection` | string | oui | ex. `"mechanisms"` |
| `element` | string | oui | Blueprint element id |
| `anchor` | CaretAnchor | oui | Position dans flux officiel (§5) |
| `text` | string | oui | Non vide en base |
| `created` | string | oui | ISO-8601 |
| `updated` | string | non | ISO-8601 après ré-édition |

### 3.2 CaretAnchor

Mot « caret » réservé aux **primitives privées** du module.

| Champ | Type | Description |
|---|---|---|
| `type` | `"CaretAnchor"` | Constante versionnage |
| `offset` | number | Entier ≥ 0 dans flux officiel |
| `prefix` | string | ≤ 32 caractères avant offset |
| `suffix` | string | ≤ 32 caractères après offset |

### 3.3 Attributs DOM

| Attribut | Élément | Rôle |
|---|---|---|
| `class="walkthrough-note"` | `<span>` | CSS, queries, exclusion additif |
| `data-learner="true"` | `<span>` | Marqueur learner layer |
| `data-note-id` | `<span>` | Lien record après persistance |

Pas d'attribut DOM pour offset/anchor.

### 3.4 Contexte runtime

Consomme le `context` existant : `chapter`, `projection.id`, `store`.

---

## 4. Store `walkthrough_notes`

### 4.1 IndexedDB

| Property | Value |
|---|---|
| Database | `lou-learner` |
| `DB_VERSION` | **3** (bump) |
| Store | `walkthrough_notes` |
| Key | `id`, autoIncrement |

### 4.2 Migration v2 → v3

- Créer `walkthrough_notes` si absent
- **Pas de migration** depuis `inline_notes` (Claim Notes abandonnées)
- Store `inline_notes` : supprimé du code actif (drop si API le permet)

### 4.3 API `learner-store.js`

| Method | Signature | Comportement |
|---|---|---|
| `addWalkthroughNote` | `(chapter, projection, element, anchor, text) → Promise<id>` | Insert ; text non vide |
| `updateWalkthroughNote` | `(id, text) → Promise<void>` | Update + `updated` ; refuse vide |
| `deleteWalkthroughNote` | `(id) → Promise<void>` | Delete |
| `listWalkthroughNotes` | `(chapter, projection) → Promise<WalkthroughNoteRecord[]>` | Filtre strict |

### 4.4 API supprimées

`addInlineNote`, `listInlineNotes`, `deleteInlineNote`, store `inline_notes`.

### 4.5 Robustesse (héritée V2.1)

Conserver `_invalidateConnection`, `onversionchange`, `onblocked` depuis `renderer-v2.1.0`.

---

## 5. Flux texte officiel (invariant)

### 5.1 Définition normative

> **Flux texte officiel** = concaténation depth-first (TreeWalker `SHOW_TEXT`) de tous les nœuds texte dans `.block-walkthrough[data-official="true"]`, **sauf** ceux dont un ancêtre est `.walkthrough-note`.

### 5.2 Classification des nœuds

| Catégorie | Critère | Traitement |
|---|---|---|
| Texte structurel | `p`, `strong`, `em`, … | **Inclus** |
| Wrapper transparent | `mark.learner-highlight` | Traverser ; texte **inclus** |
| Chrome walkthrough | `.claim-trace-link`, boutons | **Inclus** (aligné V2.1 `textContent`) |
| Ajout additif | `.walkthrough-note` | Sous-arbre **exclu** |

### 5.3 Règle `[data-learner="true"]`

**Ne pas** exclure globalement par `[data-learner="true"]`.

- `mark.learner-highlight` → transparent  
- `span.walkthrough-note` → additif, exclu

### 5.4 Conventions offsets (identiques V2.1)

| Convention | Règle |
|---|---|
| Espace | Entiers sur flux officiel §5.1 |
| Sémantique | Half-open `[start, end)` ; point = `[offset, offset)` |
| Fragmentation | Offsets stables malgré splits (marks, notes) |
| Context | 32 chars — `_CONTEXT_CHARS` |
| Projection | Toute persistance inclut `projection` |

### 5.5 Différences Highlights vs Walkthrough Notes

| Aspect | Highlights V2.1 | Walkthrough Notes V2.2 |
|---|---|---|
| Ancrage | Range (TextQuoteSelector) | Point (CaretAnchor) |
| DOM | `<mark>` wrap | `<span>` insert |
| Stream | `root.textContent` (sans notes additifs en pratique V2.1) | Flux §5.1 exclut `.walkthrough-note` |
| Interaction | Sélection + toolbar | Clic droit + édition inline |

---

## 6. Module `inline-notes.js`

### 6.1 Surface publique

| Function | Responsibility |
|---|---|
| `mount(host, context)` | `restore` then `bind` ; idempotent |
| `restore(host, context)` | Inject notes from store |
| `bind(host, context)` | Attach event listeners |

### 6.2 État interne

| State | Role |
|---|---|
| `_boundHost` | One listener set per `#content` |
| `_bindContext` | Current projection — **updated every bind** |
| `_contextMenuEl` | Reused context menu |
| `_activeEditNote` | Max one note editing |
| `_committing` | Anti double-blur |
| `_createAnchors` | `WeakMap<HTMLElement, { walkthrough, offset }>` |

### 6.3 Constantes

| Name | Value |
|---|---|
| `_NOTE_CLASS` | `"walkthrough-note"` |
| `_CONTEXT_CHARS` | `32` |
| `_MENU_ADD_LABEL` | `"Add note"` |
| `_MENU_DELETE_LABEL` | `"Supprimer la note"` |

### 6.4 Primitives — flux officiel

| Primitive | Responsibility |
|---|---|
| `_isAdditiveNode(node)` | Ancestor `.walkthrough-note` |
| `_walkOfficialTextNodes(walkthrough, fn)` | TreeWalker ; skip additifs |
| `_officialStreamLength` | Stream length |
| `_officialStreamSlice` | Prefix/suffix extraction |
| `_caretOffsetFromDomPoint` | DOM position → offset |
| `_caretOffsetFromPoint` | Click → offset |
| `_caretRangeFromOffset` | Offset → collapsed Range ; half-open ; **allows start === end** |
| `_anchorFromOffset` | Build CaretAnchor |
| `_resolveAnchor` | Anchor → offset ; `-1` if fail |

**Ne pas** appeler `LouTextHighlights._rangeFromTextOffsets` (rejects collapsed).

### 6.5 Primitives — DOM

| Primitive | Responsibility |
|---|---|
| `_walkthroughFromTarget` | `[data-official="true"]` in host |
| `_blockElementFromWalkthrough` | `dataset.element` |
| `_createNoteElement` | `<span.walkthrough-note>` |
| `_insertNoteAtRange` | `range.insertNode` on collapsed range |
| `_noteFromElement` | Ancestor lookup |
| `_enterEditMode` / `_exitEditMode` | contenteditable toggle |
| `_commitOnBlur` | Persist / delete / rollback |

**Insertion inside highlight : autorisée.** Pas de garde « inside mark → abort ».

### 6.6 Primitives — persistance

| Primitive | Responsibility |
|---|---|
| `_persistNote` | `addWalkthroughNote` + `data-note-id` |
| `_updateNote` | `updateWalkthroughNote` |
| `_deleteNote` | Store + DOM |
| `_rollbackNote` | DOM only |

### 6.7 Primitives — UI

| Primitive | Responsibility |
|---|---|
| `_showContextMenu` / `_hideContextMenu` | Positioned menu, not modal |
| `_onContextMenu` | Dispatch create / delete |
| `_onCreateNote` / `_onDeleteNote` | User flows |

### 6.8 Événements DOM

| Event | Target | Phase | Role |
|---|---|---|---|
| `contextmenu` | `host` | capture | Intercept ; preventDefault |
| `click` | menu | bubble | Menu actions |
| `mousedown` | document | bubble | Close menu |
| `scroll` | window | — | Close menu |
| `dblclick` | `host` | bubble (delegate) | Edit |
| `blur` | note editing | bubble | Commit |
| `keydown` | note editing | bubble | Escape → blur |

**Excluded :** `mouseup`, `selectionchange` (highlights V2.1).

### 6.9 Pattern lifecycle (miroir V2.1)

**`mount`:**

```
try { await restore() } catch { warn } finally { bind() }
```

**`bind`:**

```
_bindContext = context   // ALWAYS first
if _boundHost === host: return
_boundHost = host
attach listeners reading _bindContext
```

---

## 7. Lifecycle complet

### 7.1 Création

```
contextmenu on official text
  → preventDefault
  → offset = _caretOffsetFromPoint
  → if offset < 0: abort
  → range = _caretRangeFromOffset
  → noteEl = _createNoteElement() (no id)
  → _insertNoteAtRange (inside mark OK)
  → _createAnchors.set(noteEl, { walkthrough, offset })
  → _enterEditMode
```

DOM only — not yet in IndexedDB.

### 7.2 Premier blur

```
blur → _commitOnBlur
  text = trim
  if empty: remove DOM ; clear WeakMap
  else: anchor = _anchorFromOffset(fixed offset)
        id = await addWalkthroughNote
        data-note-id = id
  await store BEFORE _exitEditMode
  on reject: _rollbackNote
```

### 7.3 Affichage

Non-editable ; CSS §9 ; `data-note-id` if persisted.

### 7.4 Ré-édition

```
dblclick → stopPropagation
  if other note editing: blur it first
  _enterEditMode
```

### 7.5 Blur ré-édition

```
empty → deleteWalkthroughNote + remove DOM
else → updateWalkthroughNote
await store ; rollback on fail
```

### 7.6 Suppression

```
contextmenu on .walkthrough-note
  → "Supprimer la note"
  → immediate delete (store + DOM, no confirm)
```

### 7.7 Tab switch / rerender

`host.innerHTML = ""` → full restore from store for active projection only.

### 7.8 Édition unique

Max one note in edit mode ; programmatic blur on switch.

---

## 8. Pipeline de restauration

### 8.1 Algorithme

```
records = listWalkthroughNotes(chapter, projection.id)
for each record:
  block = query [data-element=record.element]
  walkthrough = .block-walkthrough
  if [data-note-id=record.id] exists: skip     // idempotence
  offset = _resolveAnchor(walkthrough, record.anchor)
  if offset < 0: skip silent
  range = _caretRangeFromOffset(walkthrough, offset)
  noteEl = _createNoteElement(record)
  _insertNoteAtRange(range, noteEl)    // inside mark OK
```

Order: any — offsets stable because additive notes excluded from stream.

### 8.2 Idempotence

Skip if `data-note-id` already in DOM (mirror `_rangeAlreadyHighlighted`).

### 8.3 Ancrage perdu

Skip silent V2.2.0 — no orphan panel.

### 8.4 Notes multiples même offset

Allowed ; DOM order = reverse insertion order at same point.

---

## 9. Interactions avec `blocks.js`

### 9.1 Suppressions

Remove entirely: Claim Notes affordances, hydrate notes, `_noteCard`, `_notesContainer`, note orphans, related LABELS.

### 9.2 Pipeline `render()` final

```
assemble
host.innerHTML = ""; append fragment
try { await hydrate(host, context) }    // diagrams only
catch { warn }
finally {
  if (LouTextHighlights) await LouTextHighlights.mount(host, context)
  if (LouInlineNotes)    await LouInlineNotes.mount(host, context)
}
```

### 9.3 Ordre impératif

1. Official DOM  
2. Personal Diagrams hydrate  
3. **Highlights** mount  
4. **Walkthrough Notes** mount  

### 9.4 `index.html`

```html
<script src="learner-store.js"></script>
<script src="text-highlights.js"></script>
<script src="inline-notes.js"></script>
<script src="blocks.js"></script>
```

Remove `selection-annotations.js` if present.

### 9.5 `app.js` / `renderer.js`

No changes.

---

## 10. Présentation (`styles.css`)

### 10.1 Additions — `.walkthrough-note`

- `font-family: inherit`
- `font-size: inherit`
- `line-height: inherit`
- `color`: discrete blue (e.g. `#4A6FA5`)
- No border, background, hover, icon
- Minimal focus outline when editing (a11y)

### 10.2 Removals

All Claim Notes styles: `.inline-notes`, `.inline-note`, `.note-affordance`, `.note-editor`, etc.

Remove Selection Notes styles if present: `.selection-note*`.

### 10.3 Unchanged

`mark.learner-highlight`, `.highlight-toolbar*`.

---

## 11. Stratégie de tests

### 11.1 Non-régression V2.1 (obligatoire)

Full smoke matrix from [renderer-v2.1-highlights.md § Tests](./renderer-v2.1-highlights.md#18-stratégie-de-tests) — must pass unchanged before V2.2 merge.

### 11.2 Unit tests — store

| ID | Scenario |
|---|---|
| ST-01 | add / list filters projection |
| ST-02 | update sets `updated` |
| ST-03 | delete |

### 11.3 Unit tests — stream / anchor

| ID | Scenario |
|---|---|
| WT-01 | Offset includes text inside mark |
| WT-02 | Offset excludes `.walkthrough-note` text |
| WT-03 | `_caretRangeFromOffset` half-open on fragmented DOM |
| WT-04 | Collapsed range (`start === end`) |
| WT-05 | `_resolveAnchor` prefix/suffix disambiguation |

### 11.4 Unit tests — integration

| ID | Scenario |
|---|---|
| WT-06 | Restore after renderProjection |
| WT-07 | Note inside highlight create + restore |
| WT-08 | Multiple notes same walkthrough |
| WT-09 | Double restore → no duplicates |
| WT-10 | Blur empty → no IDB record |
| WT-11 | Blur with text → IDB record |
| WT-12 | IDB reject → DOM rollback |
| WT-13 | restore fail → bind still runs |
| WT-14 | hydrate fail → notes mount |
| WT-15 | Highlights + notes coexist reload |
| WT-16 | Projection A note invisible on B |
| WT-17 | `_bindContext` updated after switch |

### 11.5 Browser smoke — `07-walkthrough-notes.spec.mjs`

| ID | Scenario |
|---|---|
| WN-01 | Contextmenu → empty note → immediate edit |
| WN-02 | Blur empty → gone |
| WN-03 | Blur text → reload → restored |
| WN-04 | Dblclick edit → blur update |
| WN-05 | Contextmenu delete |
| WN-06 | Note inside highlight |
| WN-07 | Projection scope |
| WN-08 | Tab switch ×5 |
| WN-09 | Real `dispatchEvent('contextmenu')` after projection switch |
| WN-10 | V2.1 highlights pass with active notes |

### 11.6 Tests removed

All Claim Notes / C.9 tests ; Selection Notes tests ; `inline_notes` store tests.

---

## 12. Risques techniques

| Risk | Mitigation |
|---|---|
| R1 Wrong stream (exclude marks) | §5 — marks transparent |
| R2 Reuse `_rangeFromTextOffsets` for caret | `_caretRangeFromOffset` local |
| R3 Text-node fragmentation | Half-open ; WT-03 |
| R4 Stale projection closure | `_bindContext` each bind |
| R5 Blur before IDB completes | Await store ; rollback |
| R6 Double blur | `_committing` |
| R7 Hydrate blocks notes | `finally` in blocks.render |
| R8 Insert inside mark breaks highlight | `insertNode` only ; WN-06 |
| R9 Additive text shifts offsets | Exclude `.walkthrough-note` ; fixed offset at create |
| R10 HEAD ≠ v2.1.0 | Commit 0 baseline tag |
| R11 C.9 data loss | Accepted — no migration |

---

## 13. Plan de commits atomiques

| # | Commit | Content |
|---|---|---|
| 0 | `chore(renderer): align to renderer-v2.1.0 baseline` | Restore frozen highlights ; remove Selection Notes |
| 1 | `refactor(renderer): remove claim notes pipeline` | Remove C.9 code, styles, tests, `inline_notes` |
| 2 | `feat(store): add walkthrough_notes store and CRUD` | DB v3 |
| 3 | `feat(inline-notes): official text stream and caret anchor primitives` | §6.4 |
| 4 | `feat(inline-notes): restore walkthrough notes` | §8 |
| 5 | `feat(inline-notes): context menu create flow` | §7.1–7.2 |
| 6 | `feat(inline-notes): edit and delete interactions` | §7.4–7.6 |
| 7 | `style(renderer): walkthrough note appearance` | §10 |
| 8 | `feat(blocks): mount walkthrough notes after highlights` | §9 |
| 9 | `test(renderer): walkthrough notes smoke suite` | §11.5 |
| 10 | `test(renderer): V2.1 regression with walkthrough notes active` | §11.1 |

Commit 0 before all. Revert commit 8 disables feature without touching store.

---

## 14. Workflow utilisateur

### Création

- Clic droit dans texte officiel du walkthrough
- Menu : **Add note**
- Note vide au point exact du clic
- Édition immédiate
- Blur vide → suppression (pas de record)

### Édition

- Double-clic sur note
- Édition inline
- Blur → sauvegarde auto

### Suppression

- Clic droit sur note → **Supprimer la note**
- Immédiat, sans confirmation

### Affichage

- Même police, taille, interligne que le document
- Bleu discret
- Pas de bordure, fond, hover, icône, popup, dialogue

### Persistance

- Par projection
- Restore automatique au mount
- Indépendant des highlights

---

## 15. Décisions fermées

| # | Decision | Status |
|---|---|---|
| D1 | Abandon total Claim Notes / C.9 | Closed |
| D2 | Single concept: Walkthrough Note | Closed |
| D3 | Store `walkthrough_notes` | Closed |
| D4 | Module `inline-notes.js`, class `.walkthrough-note` | Closed |
| D5 | `text-highlights.js` unchanged | Closed |
| D6 | No anchoring factorisation V2.2 | Closed |
| D7 | Official stream: marks transparent, notes additive excluded | Closed |
| D8 | Insertion inside highlight allowed | Closed |
| D9 | Mount order: highlights → notes | Closed |
| D10 | CaretAnchor: offset + prefix + suffix, 32 chars | Closed |
| D11 | `_bindContext` + `_boundHost` | Closed |
| D12 | mount try/finally restore/bind | Closed |
| D13 | Async persist before exit edit | Closed |
| D14 | No C.9 migration | Closed |
| D15 | Lost anchor → silent skip V2.2.0 | Closed |
| D16 | Baseline = `renderer-v2.1.0` | Closed |
| D17 | Learner Layer reconstructible (§1.1) | Closed |
| D18 | Learner Layer independence (§1.2) | Closed |

**No open architectural decisions.**

---

## 16. Checklist pré-implémentation

- [ ] Branch from `renderer-v2.1.0`
- [ ] V2.1 smoke executable as gate
- [ ] C.9 removal scope accepted (no migration)
- [ ] Terminology Walkthrough Note in commits
- [ ] This document accepted as implementation contract
