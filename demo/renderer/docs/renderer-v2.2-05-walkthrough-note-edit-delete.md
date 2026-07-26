# Renderer V2.2 — Walkthrough Note edit & delete (commit 6)

> **Status:** **Implemented — frozen** (commit 6)  
> **Commit:** `feat(renderer): edit and delete walkthrough notes` (`13f5210`)  
> **Tag:** `renderer-v2.2-edit-delete-stable`  
> **Frozen:** 2026-07-27  
> **Module:** `inline-notes.js` → `window.LouInlineNotes` (extended)  
> **Parent:** [architecture-principles.md](./architecture-principles.md)  
> **Target spec:** [renderer-v2.2-walkthrough-notes.md](./renderer-v2.2-walkthrough-notes.md) §7.4–7.6  
> **Depends on:** [renderer-v2.2-02-store.md](./renderer-v2.2-02-store.md), [renderer-v2.2-03-caret-anchor.md](./renderer-v2.2-03-caret-anchor.md), [renderer-v2.2-04-note-creation.md](./renderer-v2.2-04-note-creation.md), restore (commit 4 — [target spec §8](./renderer-v2.2-walkthrough-notes.md#8-pipeline-de-restauration))

This document is the **implementation contract** for the edit/delete commit only. It is not a changelog. CSS and smoke navigateur complets are explicitly deferred.

---

## 1. Scope

### 1.1 Objectif du commit

Compléter le cycle de vie des Walkthrough Notes **persistées** (État S/R du commit 5) :

1. **Ré-édition** — double-clic sur une note existante → mode édition inline
2. **Sauvegarde** — blur avec texte non vide → `updateWalkthroughNote`
3. **Suppression implicite à l'édition** — blur avec texte vide sur une note persistée → `deleteWalkthroughNote` + retrait DOM
4. **Suppression explicite** — clic droit sur une note → menu « Supprimer la note » → delete immédiat store + DOM

Après ce commit, le cycle **créer → éditer → supprimer → reload restore** est complet pour les notes persistées.

**Invariant préservé :** le Official Text Stream reste inchangé pendant et après édition/suppression (note additive exclue du flux ; ancrage inchangé à l'édition).

### 1.2 Inclus

| Fonctionnalité | Détail |
|---|---|
| Entrée en édition | `dblclick` délégué sur `#content` → note `.walkthrough-note[data-note-id]` |
| Sortie édition | `blur`, `Escape → blur`, clic extérieur (blur natif) |
| Persistance édition | `updateWalkthroughNote(id, trimmedText)` |
| Suppression blur vide | `deleteWalkthroughNote(id)` + `remove()` |
| Suppression menu | `contextmenu` on note → entrée delete unique |
| Extension `_commitOnBlur` | Branche **persistée** distincte de la branche **pending** (commit 5) |
| Extension `_onContextMenu` | Dispatch create (officiel) vs delete (on note) |
| Extension `bind` | Listener `dblclick` délégué sur host |
| Rollback DOM | Échec `updateWalkthroughNote` / `deleteWalkthroughNote` |
| Sérialisation async | File unique des commits acceptés — `_commitInFlight` / `_waitForCommitIdle` (§8.4) |
| Re-render mid-edit | Règle normative §8.1 ; intents vs commits acceptés §8.2–8.3 |

### 1.3 Hors périmètre (explicitement exclu)

| Exclu | Commit / raison |
|---|---|
| Text formatting (gras, italique, etc.) | Renderer V2.3 |
| SVG overlays / annotations visuelles | Hors V2.2 |
| Repositionnement / déplacement d'une note | Interdit V2.2 |
| Modification de l'ancre (`record.anchor`) à l'édition | Interdit — seul le **texte** est mutable |
| `caret-anchor.js` (sauf bugfix bloquant) | Interdit — déléguer |
| `learner-store.js` | Interdit — API existante |
| `blocks.js` | Interdit sauf bugfix mount order |
| `text-highlights.js` | Interdit V2.2 |
| Styles `.walkthrough-note` dédiés | Commit 7 (§10 target spec) |
| Dialogue de confirmation suppression | Interdit |
| Toolbar, modal | Interdit |
| Migration / orphan panel ancres perdues | Interdit V2.2.0 |
| Smoke navigateur WN-06+ complets | Commit smoke dédié |
| Commit sur **Enter** | Interdit — seul blur valide (aligné commit 5) |
| Nouveau mécanisme d'ancrage | Interdit §9 |

---

## 2. Architecture générale

### 2.1 Composants existants — rôles inchangés

| Composant | Rôle commit 6 | Modifié ? |
|---|---|---|
| **`learner-store.js`** | `updateWalkthroughNote(id, text)`, `deleteWalkthroughNote(id)` — appelés depuis `inline-notes.js` | **Non** |
| **`caret-anchor.js`** | `createCaretAnchor` (create only), `restoreCaretAnchor` (restore only) — **aucune participation à l'édition de texte** | **Non** |
| **`inline-notes.js`** | Extension : `dblclick`, menu delete, branche edit dans `_commitOnBlur`, `_onDeleteNote` | **Oui** — seul fichier code |
| **`blocks.js`** | Orchestration render ; `finally` → `LouInlineNotes.mount` | **Non** |

### 2.2 Pourquoi aucune responsabilité ne change

| Principe | Application commit 6 |
|---|---|
| **IndexedDB = vérité durable** | Seuls blur validé et delete explicite écrivent en base |
| **DOM = projection reconstructible** | Le texte affiché est resynchronisé depuis le store après restore ; rollback DOM en cas d'échec write |
| **CaretAnchor = ancrage immuable post-création** | L'édition ne modifie que `record.text` ; l'ancre reste celle capturée à la création |
| **Official Text Stream immuable** | Édition/suppression de notes additifs n'affecte pas le flux officiel |
| **Couche additive** | Pas de mutation du texte officiel in-place |
| **Mount order** | Notes après highlights — inchangé |

L'édition est une **mutation de métadonnées apprenant** (texte additif), pas une refonte du pipeline render/store/anchor.

### 2.3 Extension minimale de `inline-notes.js`

Commit 5 a introduit : `bind`, menu create, `_pendingAnchors`, `_commitOnBlur` (create), `_enterEditMode` / `_exitEditMode`, `_commitInFlight`.

Commit 6 **étend** ces primitives — ne les remplace pas :

```
_commitOnBlur(noteEl)
  ├─ branche pending (sans data-note-id)     ← commit 5, inchangée
  └─ branche persistée (avec data-note-id)   ← NOUVEAU commit 6

_onContextMenu(event, host)
  ├─ target inside .walkthrough-note         ← NOUVEAU : menu delete
  └─ target in walkthrough officiel          ← commit 5 : menu create

bind(host, context)
  ├─ contextmenu                             ← commit 5
  └─ dblclick (délégué)                      ← NOUVEAU commit 6
```

---

## 3. Lifecycle

### 3.1 Catégories d'existence (rappel commit 5 + commit 6)

| Catégorie | Nom | `data-note-id` | IndexedDB |
|---|---|---|---|
| Absente | — | — | — |
| Pending (create) | pending | absent | absent |
| **Persistée stable** | **persisted** | présent | record complet |
| **Persistée en édition** | **editing persisted** | présent | record **non modifié** jusqu'au blur |
| Restaurée | restored | présent | record (réinjecté par restore) |

Commit 6 ajoute la transition **persisted ↔ editing persisted** et **persisted → absent** (delete).

### 3.2 Diagramme — édition

```
[S] Persistée — contenteditable=false, data-note-id, texte = record.text
      │
      │  dblclick
      ▼
[E] Editing — contenteditable=true, data-note-id, texte éditable en DOM
      │
      ├─ blur + texte vide (normalisé) ──► [0] Absente (deleteWalkthroughNote + remove)
      │
      ├─ blur + texte non vide + inchangé (§6.0) ──► [S] Persistée (pas de write store)
      │
      ├─ blur + texte non vide + modifié ──► [S] Persistée (updateWalkthroughNote)
      │       └─ échec store ──► [S] Persistée (rollback texte DOM → snapshot)
      │
      ├─ Escape ──► blur ──► (mêmes branches que blur)
      │
      ├─ re-render sans blur ──► [R] Restaurée depuis IndexedDB (édition abandonnée — §8)
      │
      └─ menu « Supprimer la note » ──► [0] Absente (delete explicite — §7)
```

### 3.3 Diagramme — suppression explicite

```
[S] ou [E] Persistée (stable ou en édition)
      │
      │  contextmenu sur note + « Supprimer la note »
      ▼
[0] Absente — span retiré ; record supprimé en IndexedDB
      │
      └─ échec delete store ──► [S] Persistée (span conservé ; rollback silencieux)
```

### 3.4 Transitions normatives — tableau complet

| De | Événement | Vers | Store | DOM |
|---|---|---|---|---|
| S | dblclick | E | inchangé | contenteditable=true |
| E | blur, texte vide | 0 | delete | remove |
| E | blur, texte non vide, **identique** au snapshot | S | **aucun write** | contenteditable=false |
| E | blur, texte non vide, **modifié** | S | update | texte normalisé ; contenteditable=false |
| E | blur, texte modifié, store **échoue** | S | inchangé (rollback) | texte = snapshot |
| E | re-render sans blur | R | inchangé | réinjecté par restore |
| S | contextmenu + delete | 0 | delete | remove |
| E | contextmenu + delete | 0 | delete | remove (commit edit en cours abandonné) |
| S/E | delete store **échoue** | S/E | inchangé | span conservé |
| P | dblclick sur note persistée B (pending A en édition) | E sur B après commit A | selon A | voir §3.5 |
| P | *(autres — commit 5)* | — | — | inchangé |

### 3.5 Interaction pending ↔ persisted ↔ edit

#### Pending + dblclick sur une note persistée — séquence normative

Ce cas **est possible** et **doit** être sérialisé. Ce n'est **pas** une impossibilité.

```
État P — pending A en édition (sans data-note-id)
      │
      │  dblclick sur note persistée B (data-note-id présent)
      ▼
_onNoteDblClick(B)
      │
      ├─ await _waitForCommitIdle()
      ├─ _activeEditNote === A  →  await _commitOnBlur(A)
      │       ├─ texte A non vide  →  addWalkthroughNote  →  A passe en S
      │       └─ texte A vide      →  remove A            →  A passe en 0
      ├─ await _waitForCommitIdle()
      ├─ _editSnapshots.set(B, normalize(B.textContent))
      └─ _enterEditMode(B)  →  État E sur B
```

**Règle :** le dblclick sur B **ne crée jamais** une seconde note pending concurrente. La pending A est **toujours** finalisée (commit ou abandon selon le texte au blur programmatique) **avant** l'entrée en édition de B.

**Invariant :** une seule `_activeEditNote` à la fin de la séquence ; au plus une transition P → S ou P → 0, puis S → E sur B.

#### Autres interactions

| Situation | Comportement |
|---|---|
| Pending + delete menu | N/A — commit 5 : pas de menu sur pending (create abort) ; inchangé |
| Pending + dblclick sur pending A (même note) | No-op — `_activeEditNote === noteEl` → return (§5.2) |
| Persisted editing + « Add note » | `_onCreateNote` commit/blur la note en édition **d'abord** (commit 5 + sérialisation §6) |
| Deux notes persistées en édition | **Interdit** — `_activeEditNote` unique ; blur programmatique avant nouvelle édition |

---

## 4. Source of truth

### 4.1 Par état

| Question | S (persistée stable) | E (editing persisted) | 0 (absente) |
|---|---|---|---|
| **Texte — où ?** | IndexedDB `record.text` ; DOM miroir | DOM `textContent` éditable | — |
| **Texte — vérité** | **IndexedDB** (DOM reconstructible) | **DOM** jusqu'au blur ; IndexedDB figée | — |
| **Position — où ?** | IndexedDB `record.anchor` | **Inchangée** — pas recalculée | — |
| **Identité — où ?** | `data-note-id` ↔ `record.id` | `data-note-id` conservé | — |
| **Write IndexedDB ?** | Non (stable) | **Non** jusqu'au blur | Non |
| **Official Text Stream ?** | Inchangé | Inchangé | Inchangé |

### 4.2 Quand IndexedDB est mise à jour

| Moment | Opération | Condition |
|---|---|---|
| Blur édition, texte modifié non vide | `updateWalkthroughNote(id, text)` | texte normalisé ≠ snapshot normalisé (§6.0) |
| Blur édition, texte vide | `deleteWalkthroughNote(id)` | `normalize(text) === ""` (§6.0) |
| Menu delete | `deleteWalkthroughNote(id)` | Action utilisateur |
| Re-render mid-edit (brouillon, intent non acceptée) | **Aucun write** | §8.1 |
| Re-render pendant intent en cours **avant acceptation** | **Aucun write** — intent invalidée | §8.2 |
| Re-render pendant **commit accepté en vol** | Settlement store **se poursuit** ; convergence §8.3 | §8.3 |
| Escape → blur | Même règles que blur | Pas de traitement spécial |

### 4.3 Quand le DOM devient « officiel »

Le DOM n'est **jamais** source de vérité durable. Après succès store :

1. Le span reflète le texte commité (`textContent` = texte normalisé saisi — §6.0).
2. `contenteditable="false"`.
3. Au prochain re-render, le DOM est **jetable** — `restore()` reconstruit depuis IndexedDB.

En cas d'échec store : le DOM est **restauré** au snapshot d'entrée en édition (§6).

---

## 5. Enter edit mode

### 5.1 Déclencheur

| Propriété | Valeur |
|---|---|
| Événement | `dblclick` délégué sur `#content` (attaché dans `bind`) |
| Cible valide | `.walkthrough-note[data-note-id]` — note **persistée** uniquement |
| Cible invalide (silencieux) | Walkthrough officiel sans note, pending sans id, chrome |

### 5.2 Séquence normative

```
Utilisateur: dblclick sur span.walkthrough-note[data-note-id]
  ↓
LouInlineNotes._onNoteDblClick(event, host)
  ↓
noteEl = _noteFromElement(event.target)
  → absent ou sans data-note-id : abort silencieux
  ↓
event.stopPropagation()
  ↓
await _waitForCommitIdle()
  ↓
Si _activeEditNote && _activeEditNote !== noteEl:
  await _commitOnBlur(_activeEditNote)    ← commit ou discard l'autre note
await _waitForCommitIdle()
  ↓
Si _activeEditNote === noteEl: return     ← déjà en édition sur cette note
  ↓
_editSnapshots.set(noteEl, normalize(noteEl.textContent))   ← snapshot normalisé (§6.0)
  ↓
_enterEditMode(noteEl)                    ← commit 5, réutilisé tel quel
  → contenteditable = true
  → _activeEditNote = noteEl
  → listeners blur + Escape
  → focus()
```

### 5.3 Focus et sélection

| Aspect | Comportement |
|---|---|
| Focus | Immédiat dans le span (`noteEl.focus()`) |
| Sélection | **Comportement natif du navigateur** pour dblclick inside contenteditable — pas de `selectAll()` programmatique |
| Curseur | Prêt à éditer ; pas de modification du Official Text Stream |

### 5.4 Unicité de l'édition

- **Une seule** note en mode édition à la fois (`_activeEditNote`).
- Si une autre note (pending ou persisted) est déjà en édition : `_commitOnBlur` sur celle-ci **avant** d'entrer en édition sur la nouvelle.
- Sérialisation via `_waitForCommitIdle()` — même invariant que commit 5 (N11).

### 5.5 Distinction pending vs persisted à l'entrée

| Type | Entrée édition commit 6 ? |
|---|---|
| Pending (sans `data-note-id`) | **Non** — déjà en édition depuis create (commit 5) ; dblclick ignoré ou no-op |
| Persisted (avec `data-note-id`) | **Oui** — seul cas d'entrée via dblclick |

---

## 6. Save

### 6.0 Normalisation du texte — règle architecturale unique

Toute comparaison ou persistance de texte de note utilise la **même représentation normalisée** :

```
normalize(raw) = String(raw).trim()
```

| Usage | Règle |
|---|---|
| Texte au blur (persisted) | `text = normalize(noteEl.textContent)` |
| Snapshot à l'entrée dblclick | `snapshot = normalize(noteEl.textContent)` — **stocké normalisé** dans `_editSnapshots` |
| Comparaison no-op | `text === snapshot` — **les deux opérandes déjà normalisés** |
| Write store | `updateWalkthroughNote(id, text)` reçoit `text` normalisé |
| Branche vide | `text === ""` après normalisation |

**Garantie (E10) :** un changement **purement cosmétique** (espaces / retours ajoutés ou retirés en bordure, sans modification du contenu significatif) **ne provoque pas** d'écriture IndexedDB inutile.

**Exemple :** snapshot `"hello"` ; utilisateur laisse `"  hello  "` sans autre changement → `normalize` → `"hello"` → **pas de write**.

**Hors scope :** normalisation Unicode, collapse de whitespace interne, strip de newlines — seul `trim()` de bordure.

### 6.1 Extension de `_commitOnBlur`

`_commitOnBlur(noteEl)` devient un **dispatcher** :

```
_commitOnBlur(noteEl)
  if !noteEl: return
  text = normalize(noteEl.textContent)

  if !noteEl.hasAttribute("data-note-id"):
    → branche PENDING (commit 5) — inchangée ; utilise déjà trim() + file §8.4

  → branche PERSISTED (commit 6)
  if _committing: return                        ← garde reentrancy même handler uniquement
  await _waitForCommitIdle()                    ← file §8.4 avant toute branche write
  → ci-dessous §6.2
```

### 6.2 Branche persisted — blur

```
text = normalize(noteEl.textContent)
snapshot = _editSnapshots.get(noteEl)    ← déjà normalisé à l'entrée dblclick (§6.0)

[Branche vide — text === ""]
  → point d'acceptation (§8.2)
  _commitInFlight = commitWork ; invoke deleteWalkthroughNote(id)
  → succès, nœud connecté: remove DOM, delete snapshot, _activeEditNote = null
  → succès, nœud détaché: aucune mutation DOM ; convergence §8.3
  → échec, nœud connecté: conserver span ; restaurer texte depuis snapshot ; _exitEditMode
  → échec, nœud détaché: aucune mutation DOM ; IDB inchangée
  finally: _commitInFlight = null

[Branche non vide, text === snapshot]
  _exitEditMode(noteEl)
  _editSnapshots.delete(noteEl)
  _activeEditNote = null
  → FIN — aucun write store (no-op)

[Branche non vide, text !== snapshot]
  → point d'acceptation (§8.2)                  ← immédiatement avant invoke store
  _commitInFlight = commitWork ; invoke updateWalkthroughNote(id, text)
  → succès, nœud encore connecté: _exitEditMode ; delete snapshot ; _activeEditNote = null
  → succès, nœud détaché (mount intercalé): aucune mutation DOM ; convergence §8.3
  → échec, nœud connecté: noteEl.textContent = snapshot ; _exitEditMode ; ...
  → échec, nœud détaché: aucune mutation DOM ; IDB inchangée
  finally: _commitInFlight = null
```

**Ordre impératif (D13, étendu) :** await store **avant** `_exitEditMode` sur les branches update et delete — **uniquement si le nœud est encore connecté** au DOM courant.

**Interdit :** revert compensatoire vers snapshot en IndexedDB après succès d'un commit accepté (§8.5).

### 6.3 Comportements par interaction

| Interaction | Effet | Commit store ? |
|---|---|---|
| **Blur** (Tab, clic extérieur, focus ailleurs) | `_commitOnBlur` | Selon branches §6.2 |
| **Enter** | Comportement contenteditable natif inline — **pas de commit** ; pas de listener Enter dédié | Non |
| **Escape** | `noteEl.blur()` (listener commit 5) → `_commitOnBlur` | Selon branches §6.2 |
| **Clic extérieur** | Blur natif → `_commitOnBlur` | Selon branches §6.2 |

**Décision fermée :** Escape **ne restaure pas** silencieusement le snapshot sans blur — il déclenche blur, donc commit ou delete selon le texte final. Aligné target spec §7.5 et commit 5 Q7.

### 6.4 Rollback — échec `updateWalkthroughNote`

| Aspect | Comportement |
|---|---|
| DOM | `noteEl.textContent` restauré au snapshot normalisé |
| IndexedDB | Inchangée (write rejeté) |
| `data-note-id` | Conservé |
| `contenteditable` | `false` après `_exitEditMode` |
| Log | Silencieux (pas `console.warn`) ; `console.debug` optionnel |
| `_activeEditNote` | `null` |

### 6.5 Rollback — échec `deleteWalkthroughNote` (blur vide)

| Aspect | Comportement |
|---|---|
| DOM | Span **conservé** ; `textContent` restauré au **snapshot normalisé** ; `_exitEditMode` |
| IndexedDB | Record **conservé** |
| Log | Silencieux |

**Justification :** en cas d'échec delete, DOM et IndexedDB restent alignés sur le texte persisté (snapshot), pas sur un span vide orphelin.

### 6.6 `_editSnapshots` — rôle au save

| Événement | Action |
|---|---|
| Entrée dblclick | `set(noteEl, normalize(textContent))` |
| Blur succès (update/delete/no-op) | `delete(noteEl)` |
| Blur échec update (nœud connecté) | `delete(noteEl)` après restauration DOM |
| Blur succès, nœud détaché post-mount | `delete(noteEl)` ; pas de restauration DOM |
| Re-render mid-edit (intent non acceptée) | Abandon / GC — pas de write |

---

## 7. Delete

### 7.1 Suppression via menu contextuel

| Propriété | Valeur |
|---|---|
| Déclencheur | `contextmenu` avec cible inside `.walkthrough-note[data-note-id]` |
| Entrée menu | **Supprimer la note** (`_MENU_DELETE_LABEL`) — entrée **unique** sur note (pas de « Add note ») |
| Confirmation | **Aucune** — suppression immédiate |
| Fermeture menu | Identique commit 5 |

### 7.2 Séquence normative — `_onDeleteNote`

```
Utilisateur: click « Supprimer la note »
  ↓
LouInlineNotes._onDeleteNote(menuContext)
  ↓
_hideContextMenu()
  ↓
await _waitForCommitIdle()
  ↓
noteEl = menuContext.noteEl
id = noteEl.getAttribute("data-note-id")
  → absent : abort silencieux
  ↓
Si _activeEditNote === noteEl: _activeEditNote = null   ← abandon edit sans commit
_editSnapshots.delete(noteEl)
  ↓
→ point d'acceptation (§8.2)
_committing = true ; _commitInFlight = deleteWork
  ↓
await deleteWalkthroughNote(id)
  → succès, nœud connecté: _exitEditMode(noteEl) si needed ; noteEl.remove()
  → succès, nœud détaché: aucune mutation DOM ; convergence §8.3
  → échec, nœud connecté: span conservé
  → échec, nœud détaché: aucune mutation DOM
  finally: _commitInFlight = null ; _committing = false
```

### 7.3 Suppression via blur texte vide (édition)

Lors de la ré-édition d'une note persistée, si l'utilisateur efface tout le texte (après normalisation §6.0) et blur :

→ **`deleteWalkthroughNote(id)`** + `remove()` — **pas** de record vide en base.

#### Justification — contrainte LearnerStore (primordiale)

Ce comportement n'est **pas** un choix UX isolé. Il découle du **contrat store existant** ([renderer-v2.2-02-store.md](./renderer-v2.2-02-store.md)) :

| Fait store | Conséquence architecture edit |
|---|---|
| `updateWalkthroughNote(id, text)` **rejette** si `text` vide ou whitespace-only | L'alternative « blur vide → save `""` » est **impossible** sans modifier le store — hors périmètre commit 6 |
| `addWalkthroughNote` rejette déjà le vide (commit 5, N9) | Règle uniforme : **aucun record sans texte non vide** |
| `deleteWalkthroughNote(id)` existe | Seule opération valide pour faire disparaître une note persistée |

**Conclusion :** « texte vide → delete » est l'**alignement naturel** de l'édition sur la contrainte store, cohérent avec create (blur vide → pas de record) et avec la target spec §7.5.

#### Justification UX (secondaire)

Effacer entièrement le contenu d'une note persistée exprime l'intention de **supprimer** la note, pas de conserver un conteneur vide — cohérent avec le modèle métier V2.2.

### 7.4 Rollback — échec suppression IndexedDB

| Chemin | Comportement |
|---|---|
| Menu delete, store échoue | Span **conservé** en DOM ; record **conservé** en IDB ; pas de warn |
| Blur vide, store échoue | Span conservé ; record conservé ; sortie edit mode |

### 7.5 Synchronisation DOM / store après succès

| Opération | DOM | IndexedDB |
|---|---|---|
| Delete succès | Span absent | Record absent |
| Update succès | Texte = commité ; non-éditable | `record.text` = commité ; `updated` ISO |
| Delete blur vide succès | Span absent | Record absent |

`restore()` au reload ne voit plus la note supprimée ; voit le texte mis à jour pour les notes conservées.

---

## 8. Re-render, intents et commits acceptés

### 8.1 Re-render pendant édition — brouillon non commité

> **L'édition en cours d'une note persistée est abandonnée au re-render — sans write implicite du brouillon.**

Symétrique au pending (commit 5 §4.5). Tant qu'**aucun commit accepté** (§8.2) n'a été lancé, le brouillon DOM est jetable.

```
Utilisateur : dblclick → État E (édition, texte partiellement modifié)
      │
      │  renderProjection() — blur non survenu
      ▼
blocks.render()
  host.innerHTML = ""              ← span détruit
  LouInlineNotes.mount()
    _hideContextMenu()
    _activeEditNote = null
    restore()                      ← réinjecte depuis IndexedDB (dernier état persisté)
    bind()
      ▼
État R — texte = record.text (pas le brouillon d'édition)
```

| État au re-render (sans commit accepté) | Write IndexedDB ? | DOM après mount |
|---|---|---|
| Pending create (P) | **Non** | Absent |
| Editing persisted (E) | **Non** | Restauré si record existe |
| Persisted stable (S) | **Non** | Restauré |

**E7 —** Tout re-render invalide l'édition en cours — pas de commit implicite des modifications non blur ; pas d'appel store au mount.

---

### 8.2 Point d'acceptation et vocabulaire

#### Point d'acceptation (identique create / update / delete)

Un **commit est accepté** au moment **immédiatement précédant** la première invocation de :

- `addWalkthroughNote`
- `updateWalkthroughNote`
- `deleteWalkthroughNote`

| Phase | Nom | Store invoqué ? | Annulable par mount() ? |
|---|---|---|---|
| Handler blur / delete / create en cours | **Intent de commit** | **Non** | **Oui** — intent **invalidée** |
| Après point d'acceptation, avant settlement | **Commit accepté en vol** | **Oui** | **Non** — le store CRUD n'est pas annulable |

#### Intent invalidée (terme A)

Une **intent de commit** est **invalidée** si `LouInlineNotes.mount()` s'exécute **avant** le point d'acceptation.

| Effet | Résultat |
|---|---|
| Appel store | **Aucun** |
| Mutation de l'ancien nœud DOM | **Aucune** |
| IndexedDB | Inchangée (état au moment du `restore()` du mount) |
| Brouillon utilisateur | Perdu (comme §8.1) |

#### Commit accepté en vol (terme B)

Un **commit accepté** est une opération store **déjà invoquée**. Un `mount()` intercalé **ne l'invalide pas**.

| Effet | Résultat |
|---|---|
| Settlement store | **Se poursuit** jusqu'à résolution |
| Revert compensatoire (snapshot → IDB) | **Interdit** |
| Mutation du nœud DOM de l'**ancien** mount | **Interdite** |
| IndexedDB après settlement réussi | Reflète l'opération acceptée |
| DOM du **nouveau** mount | Convergence §8.3 |

**Ne plus employer « commit obsolète »** pour désigner un commit accepté en vol. Ce terme est réservé à la sémantique abandonnée (§8.3 ancien contrat).

---

### 8.3 Re-render pendant un commit accepté en vol

Scénario : blur ou delete **après** point d'acceptation, store en cours, re-render intercalé.

```
blur / delete menu / create blur
      │
      ▼
point d'acceptation
      │
      ▼
invoke LearnerStore (Promise en cours)
      │
      ▼
renderProjection() → mount() → restore()     ← DOM neuf ; ancien nœud détaché
      │
      ▼
settlement du commit (succès ou échec)
      │
      ▼
convergence §8.3
```

#### État pendant la Promise

| Aspect | Règle |
|---|---|
| `_commitInFlight` | **Conserve** la Promise du commit accepté — mount **ne l'écrase pas** |
| Sérialisation | Le commit reste **premier** dans la file ; aucun nouveau write avant settlement |
| Ancien nœud DOM | **Détaché** — aucune mutation autorisée après mount |
| Nouveau DOM après `restore()` | Reflète IndexedDB **au moment du restore** (peut être pré-settlement) |

#### Règle de convergence (décision fermée — option A)

> **Après settlement réussi d'un commit accepté en vol, le renderer du mount courant converge immédiatement vers l'état durable IndexedDB produit par ce commit.**

| Opération acceptée | IndexedDB après settlement | Convergence attendue (DOM mount courant) |
|---|---|---|
| **update** succès | `record.text` mis à jour | Texte visible = valeur commitée |
| **delete** succès | record absent | Note absente du DOM |
| **add** succès | nouveau record | Note présente (réinjectée selon record) |
| **échec** store | Inchangée ou partiellement inchangée | Reste l'état du `restore()` post-mount |

**Périmètre :** le contrat prescrit le **comportement observable** de convergence, pas la technique (`restore()` partiel, second passage, mutation ciblée, etc.).

**Option B (rejetée) :** convergence uniquement au prochain `restore()` explicitement déclenché — incompatible avec la vérité durable immédiate attendue quand IndexedDB a déjà changé.

#### Conséquences

- Un write IndexedDB **peut** se produire **après** un mount intercalé — c'est **normal** pour un commit accepté ; ce n'est **pas** une violation du contrat.
- Le brouillon DOM de l'ancien mount est **perdu** ; la vérité utilisateur finale est celle d'IndexedDB **après settlement + convergence**.
- **Aucune** compensation post-succès ne réécrit IndexedDB depuis un snapshot DOM.
- Si la **convergence** échoue **après** un settlement store réussi, le commit reste **réussi** : IndexedDB durable inchangée, `_commitInFlight` libéré, file disponible pour le commit suivant ; `console.warn` `[LouInlineNotes] Note converge failed.` (§14).

---

### 8.4 Sérialisation — file unique des commits acceptés

#### Règle centrale

Toute opération pouvant invoquer le store passe par une **file logique unique** sérialisée via `_commitInFlight` / `_waitForCommitIdle()`.

| # | Règle |
|---|---|
| S1 | Un commit **accepté** reste valide — mount ne l'annule pas |
| S2 | `mount()` **n'écrase jamais** `_commitInFlight` ni ne libère artificiellement un commit accepté en vol |
| S3 | **Aucun** nouveau point d'acceptation tant que la file n'est pas idle |
| S4 | Les interactions post-mount qui nécessitent un write **attendent** `_waitForCommitIdle()` |
| S5 | **Aucun** revert compensatoire IndexedDB après succès d'un commit accepté |
| S6 | Après settlement : **aucune** mutation sur nœud DOM **détaché** |

#### `mount()` et état module

```
mount(host, context)
  _hideContextMenu()
  _activeEditNote = null              ← références d'édition UI invalidées
  _pendingMenuContext = null
  → _commitInFlight : CONSERVÉ si commit accepté en vol
  → intents non acceptées : abandonnées implicitement (pas de invoke store)
  restore(host, context)
  bind(host, context)
  → convergence si settlement en cours ou vient de terminer (§8.3)
```

**Interdit au mount :** reset de `_commitInFlight` ; reset permettant un second write concurrent ; lancement d'un write au mount.

#### Chemins soumis à la file

| Chemin | Attend idle avant acceptation ? |
|---|---|
| `_commitOnBlur` (pending / persisted) | **Oui** |
| `_onDeleteNote` | **Oui** (existant) |
| `_onCreateNote` | **Oui** (existant) |
| `_onNoteDblClick` (commit autre note) | **Oui** (existant) |
| blur natif post-mount pendant commit en vol | Doit **attendre** ou **no-op** si intent invalidée — jamais concurrent |

#### Priorité et ordre (anti-ABA)

| Règle | Énoncé |
|---|---|
| P1 | Les commits **acceptés** s'appliquent dans l'**ordre d'acceptation** |
| P2 | **Aucun** commit antérieur ne peut effectuer un revert IndexedDB après un commit plus récent accepté |
| P3 | **Aucun** snapshot DOM n'est utilisé pour réécrire IndexedDB **après succès** store |
| P4 | L'ordre durable en base = ordre d'acceptation sérialisé — **pas** l'ordre accidentel de résolution si des invokes étaient sérialisés |

---

### 8.5 Create / update / delete — tableau unifié

| Opération | Intent invalidée (mount avant acceptation) | Commit accepté en vol + mount intercalé |
|---|---|---|
| **update** (blur modifié) | Pas de write ; pas de mutation ancien DOM | Settlement continue ; convergence update ; pas de revert snapshot |
| **delete** (blur vide) | Pas de write ; pas de remove | Settlement continue ; convergence absence note |
| **delete** (menu) | Pas de write | Idem |
| **add** (pending blur) | Pas de write ; pending abandonné | Settlement continue ; convergence note créée |
| **no-op** (text === snapshot) | N/A — jamais de point d'acceptation | N/A |

**Interdit pour tous les chemins :** recréer ou resupprimer un record en compensation ; `updateWalkthroughNote(id, snapshot)` après succès d'un autre commit.

---

### 8.6 Responsabilités (identiques commit 5)

| Composant | Rôle |
|---|---|
| `blocks.js` | Détruit le DOM incluant le span en édition |
| `inline-notes.js mount()` | Invalide intents et refs DOM ; **ne annule pas** commits acceptés ; `restore()` ; convergence |
| `learner-store.js` | CRUD uniquement — aucune participation à la sérialisation renderer |

---

## 9. CaretAnchor

### 9.1 Principe

L'édition d'une note persistée **ne modifie pas** sa position. Seul `record.text` change via `updateWalkthroughNote`.

### 9.2 API autorisées — rappel strict

| API | Usage commit 6 |
|---|---|
| `LouCaretAnchor.createCaretAnchor()` | **Create only** (commit 5) — **pas** à l'édition |
| `LouCaretAnchor.restoreCaretAnchor()` | **Restore only** (commit 4) — **pas** à l'édition |
| Calcul d'offset dans `inline-notes.js` | **Interdit** (N3) |

### 9.3 Vérification

| Question | Réponse |
|---|---|
| Nouveau mécanisme d'ancrage ? | **Non** |
| Recalcul d'ancre au blur édition ? | **Non** — ancre immuable post-création |
| Déplacement DOM de la note à l'édition ? | **Non** — le span reste en place |
| `updateWalkthroughNote` modifie l'ancre ? | **Non** — store get-mutate-put préserve `anchor` (§02-store) |

---

## 10. Temporary state

### 10.1 États existants (commit 5) — réutilisés

| État | Rôle commit 6 | Créateur | Consommateur | Destruction |
|---|---|---|---|---|
| `_activeEditNote` | Note en édition (pending **ou** persisted) | `_enterEditMode` | `_commitOnBlur`, `_onDeleteNote`, `mount` | Blur, delete, mount reset |
| `_committing` | Anti double-commit (intent) | `_commitOnBlur`, `_onDeleteNote` | Garde entrée | `finally` |
| `_commitInFlight` | File sérialisée des commits acceptés | Tous chemins write | `_waitForCommitIdle`, mount **conserve** si en vol | `finally` après settlement |
| `_pendingAnchors` | Ancre create pending | `_onCreateNote` | `_commitOnBlur` branche pending | Blur, rollback, GC |
| `_pendingMenuContext` | Clic menu en cours | `_showContextMenu` | `_onCreateNote`, `_onDeleteNote` | `_hideContextMenu`, mount |
| `_contextMenuEl` | Menu DOM singleton | `_ensureContextMenu` | UI | Persistant module |

### 10.2 Nouvel état (commit 6)

| État | Type | Rôle |
|---|---|---|
| `_editSnapshots` | `WeakMap<HTMLElement, string>` | Texte **normalisé** au dblclick — rollback DOM ; détection no-op (§6.0) |

#### `_editSnapshots` — cycle de vie

| Événement | Action |
|---|---|
| dblclick enter edit | `set(noteEl, normalize(textContent))` |
| blur, texte inchangé | `delete(noteEl)` |
| blur, update succès | `delete(noteEl)` |
| blur, update échec (nœud connecté) | restaure DOM depuis snapshot ; `delete(noteEl)` |
| blur, update succès nœud détaché | `delete(noteEl)` ; pas de restauration DOM (§8.3) |
| blur, delete vide succès (nœud connecté) | `delete(noteEl)` (span removed) |
| blur, delete vide succès (nœud détaché) | `delete(noteEl)` ; convergence §8.3 |
| menu delete | `delete(noteEl)` avant remove (nœud connecté) |
| blur, intent invalidée (mount avant acceptation) | Abandon / GC — pas de write |
| re-render mid-edit (intent non acceptée) | Abandon / GC — pas de restauration snapshot |

**Créateur unique :** `_onNoteDblClick`.  
**Pas d'entrée** pour pending create — pending n'utilise pas `_editSnapshots`.

#### 10.2.1 Justification architecture — `_editSnapshots`

**Question :** pourquoi un WeakMap module-owned, et pas une relecture IndexedDB ou autre ?

| Approche | Avantages | Inconvénients |
|---|---|---|
| **`_editSnapshots` WeakMap** (retenu) | Rollback **sync** au fail sans round-trip IDB ; no-op **sync** au blur ; clé liée au nœud — GC avec le span ; symétrie `_pendingAnchors` (commit 5) ; pas de pollution DOM | État module supplémentaire ; snapshot = vérité DOM normalisée, pas re-fetch IDB explicite |
| **Relecture IndexedDB à chaque blur** | Vérité toujours depuis store ; pas de WeakMap edit | Async systématique ; latence ; no-op exige get + compare ; rollback update fail trivial (re-fetch) mais **no-op et chemin heureux alourdis** |
| **Relecture IDB uniquement à l'entrée dblclick** | Snapshot = `record.text` garanti aligné store | Async à l'entrée edit ; DOM et IDB supposés identiques en S de toute façon ; complexité sans gain si invariant S respecté |
| **Expando DOM `noteEl._editOriginalText`** | Simple | Métadonnées inspectables / mutables ; mélange couche UI et nœud ; rejeté Q5 |
| **Pas de snapshot — toujours write** | Minimal | Violation E10 ; writes IDB cosmétiques ; pas de rollback cheap |

**Pourquoi pas « IndexedDB seul » ?**

L'édition ne modifie **que le texte** — contrairement à la création, l'ancre n'a pas besoin d'être retenue en WeakMap. Le texte **pourrait** être rechargé depuis le store. Cependant :

1. **No-op detection** est sur le chemin chaud blur — doit rester **sans async obligatoire**.
2. **Rollback update fail** doit restaurer le DOM **immédiatement** — le snapshot local évite un get IDB under failure.
3. En état S, **invariant** : `normalize(noteEl.textContent) === record.text` (DOM miroir du store post-restore). Le snapshot DOM normalisé est donc **équivalent** au `record.text` tant que S est valide.

**Décision retenue :** `_editSnapshots` WeakMap stocke `normalize(textContent)` au dblclick — **tampon textuel minimal**, distinct de `_pendingAnchors` (tampon **ancre** irremplaçable sans recalcul). Justification **plus forte** que la seule symétrie commit 5 : rollback sync + no-op sync + pas de lecture IDB sur le chemin blur.

**Lisibilité dans six mois :** pending WeakMap = « où » (CaretAnchor) ; edit WeakMap = « texte d'origine » (rollback/no-op) — deux raisons différentes, même pattern technique.

### 10.3 Nouvel état absent — justification

| État envisagé | Pourquoi absent |
|---|---|
| `_pendingEditAnchor` | L'ancre ne change pas à l'édition |
| `_editNoteId` séparé | `data-note-id` sur le span suffit |
| Flag `_isEditingPersisted` | Discriminant = présence `data-note-id` + `_editSnapshots.has(noteEl)` |

---

## 11. Invariants

### 11.1 Invariants architecturaux (commit 6)

| ID | Invariant |
|---|---|
| E1 | **Official Text Stream immuable** — édition/suppression ne modifie pas le flux officiel |
| E2 | **CaretAnchor immuable post-création** — seul `record.text` est mutable |
| E3 | **Aucun offset calculé dans inline-notes** — délégation CaretAnchor inchangée |
| E4 | **Une seule note en édition** — `_activeEditNote` unique (pending ou persisted) |
| E5 | **Aucune édition concurrente** — blur/commit de l'autre note avant nouvelle édition |
| E6 | **Aucune note persistée sans `data-note-id`** en état S/R |
| E7 | **Re-render mid-edit → abandon sans write** — intent non acceptée ; brouillon perdu ; restore depuis IDB (§8.1) |
| E8 | **Persist before exit edit** (D13) — await store avant `contenteditable=false` **si nœud connecté** |
| E9 | **Pas de record vide en base** — blur vide sur persisted → delete, pas update |
| E10 | **Pas de write si texte normalisé inchangé** — `text === snapshot` après §6.0 |
| E11 | **Pas de commit implicite au re-render** — symétrique N15 ; intent invalidée avant acceptation uniquement |
| E12 | **Sérialisation file unique** — `_commitInFlight` / `_waitForCommitIdle` sur tous chemins write ; mount ne libère pas un commit accepté en vol |
| E13 | **Menu masqué au mount** — pas de menu persistant après re-render |
| E14 | **Cohérence durable après settlement** — DOM du mount courant converge vers IndexedDB selon l'ordre d'acceptation sérialisé (§8.3, §8.4 P1–P4) |
| E15 | **Delete menu uniquement on note** — create menu uniquement off note (commit 5) |
| E16 | **Intent invalidée vs commit accepté en vol** — mount avant acceptation : aucun invoke store ; mount après acceptation : settlement + convergence, pas de revert compensatoire (§8.2–8.3) |

### 11.2 Invariants hérités (non-régression)

N1–N15 du commit 5 restent vrais sur les chemins create/restore. Les branchements edit/delete ne les affaiblissent pas.

---

## 12. Tests

### 12.1 Fichier

`demo/renderer/test/walkthrough-notes-edit-delete.test.js` — **41 tests** (suite commit 6).

### 12.2 Tests d'édition

| ID | Scénario | Vérifie |
|---|---|---|
| **WT-18** | dblclick sur note persistée → `contenteditable=true` | Entrée edit mode |
| **WT-19** | dblclick → modifier texte → blur | `updateWalkthroughNote` ; DOM ; store |
| **WT-20** | dblclick → blur sans modification | Pas de write store ; `contenteditable=false` |
| **WT-21** | dblclick → effacer tout → blur | `deleteWalkthroughNote` ; span absent |
| **WT-22** | `updateWalkthroughNote` rejette | Rollback texte DOM ; record inchangé |
| **WT-23** | `deleteWalkthroughNote` rejette (blur vide) | Span conservé ; record conservé |
| **WT-24** | dblclick note A → dblclick note B | A commitée ou abandonnée avant B ; une seule edit active |
| **WT-25** | Edit → reload → restore | Texte mis à jour visible |
| **WT-ED-01** | Official stream inchangé après edit + persist | `_officialStreamText` before === after |
| **WT-ED-02** | dblclick sur pending (sans id) | Pas de double edit / pas de régression create |
| **WT-ED-03** | Escape → blur → update | Comportement identique blur explicite |
| **WT-ED-04** | Edit → re-render sans blur | Texte = dernier persisté ; intent invalidée ; pas de write (E7) |
| **WT-ED-05** | Edit avec update en cours + dblclick autre note | Sérialisation — seconde edit après fin commit |
| **WT-ED-12** | Pending A en édition + dblclick note persistée B | A commitée/abandonnée ; B en edit ; une seule `_activeEditNote` |
| **WT-ED-13** | Edit → blur modifié → mount **avant** point d'acceptation | Intent invalidée ; **aucun** invoke store ; restore = dernier persisté |
| **WT-ED-14** | Edit → ajout espaces bordure seulement → blur | Pas de write ; no-op (§6.0) |
| **WT-ED-15** | Blur update → acceptation → mount → settlement succès | Convergence immédiate ; texte = valeur commitée ; pas de mutation ancien DOM (E16) |
| **WT-ED-16** | Menu delete → acceptation → mount → settlement succès | Convergence ; note absente ; pas de revert compensatoire |
| **WT-ED-17** | Pending create blur → acceptation → mount → settlement succès | Convergence ; note créée visible ; pas de double record |
| **WT-ED-18** | Commit A accepté (update) → interaction B (blur/delete) avant settlement A | B **attend** `_waitForCommitIdle` ; ordre acceptation A puis B |
| **WT-ED-19** | A accepté puis B accepté ; A settle après B | **Aucun** revert de A n'écrase B ; IDB = ordre acceptation (anti-ABA) |
| **WT-ED-20** | Commit A en vol → plusieurs mount successifs | `_commitInFlight` conservé ; un seul write ; convergence unique post-settlement |
| **WT-ED-21** | Commit A accepté → mount → settlement **échec** | Pas de mutation ancien DOM ; DOM courant = état restore post-mount ; IDB inchangée |
| **WT-ED-22** | Edit → blur no-op (text === snapshot) | Pas de point d'acceptation ; pas de write ; `_commitInFlight` inchangé |
| **WT-ED-23** | Pending create → saisie → mount **avant** point d'acceptation | Intent create abandonnée ; **aucun** invoke `addWalkthroughNote` |
| **WT-ED-24** | `data-note-id` invalide (`""`, `"abc"`, `"NaN"`, etc.) → blur | **Aucun** invoke store |
| **WT-ED-25** | Normalisation bordures / newlines / `<br>` nested | Pas de write si texte normalisé inchangé ; record = texte normalisé |
| **WT-ED-26** | Double blur rapide sur edit | Un seul write concurrent max ; pas de file parallèle |
| **WT-ED-27** | Menu delete → acceptation → mount → settlement succès | Convergence ; note absente du DOM courant post-settlement |

### 12.2.1 Tests sérialisation, mount et convergence (E14, E16)

| # | ID | Scénario contractuel |
|---|---|---|
| 1 | **WT-ED-13** | Intent update abandonnée avant store |
| 2 | **WT-ED-15** | Update accepté → mount → settlement |
| 3 | **WT-ED-16** | Delete accepté → mount |
| 4 | **WT-ED-17** | Create accepté → mount |
| 5–6 | **WT-ED-18** | Commit A accepté puis interaction B ; B attend A |
| 7 | **WT-ED-19** | Aucun revert de A n'écrase B (anti-ABA) |
| 8 | **WT-ED-20** | Plusieurs mount pendant A |
| 9 | **WT-ED-21** | Échec store de A après mount |
| 10 | **WT-ED-14** / **WT-ED-22** | No-op sans write |
| 11 | **WT-ED-27** | Delete menu accepté → mount → convergence |

### 12.2.2 Tests anti-ABA et résilience convergence

| ID | Scénario | Vérifie |
|---|---|---|
| **WT-ED-ABA** | A accepté → mount → A settlement → B accepté → B settlement (Promises contrôlées) | **Aucun** revert compensatoire ; IDB final = B ; jamais de réécriture de l'ancienne valeur ; exactement 2 writes `[A, B]` |
| **WT-ED-ABA** | Convergence échoue après write store réussi → second commit | IDB = premier write ; `_commitInFlight` libéré ; second commit progresse ; warn convergence (§14) |

### 12.3 Tests de suppression

| ID | Scénario | Vérifie |
|---|---|---|
| **WT-26** | contextmenu on note → menu « Supprimer la note » | Menu delete visible |
| **WT-27** | Delete menu → confirm implicit | Span absent ; store vide pour id |
| **WT-28** | Delete menu, store rejette | Span conservé ; record conservé |
| **WT-29** | Delete note en cours d'édition | Pas de commit préalable ; span absent après succès |
| **WT-ED-06** | contextmenu on note → pas d'entrée « Add note » | Menu delete-only |
| **WT-ED-07** | contextmenu off note → pas d'entrée delete | Create-only (commit 5 préservé) |

### 12.4 Tests intégration / non-régression

| ID | Scénario | Vérifie |
|---|---|---|
| **WT-ED-08** | Create (commit 5) still works after edit bind | Pas de régression |
| **WT-ED-09** | Restore idempotent avec notes éditées | Pas de doublons |
| **WT-ED-10** | Mount hide menu after edit contextmenu open | `_pendingMenuContext === null` ; menu hidden |
| **WT-ED-11** | Highlights + edited note coexist reload | Coexistence couche additive |

### 12.5 Smoke navigateur (reporté)

| ID | Scénario | Commit |
|---|---|---|
| **WN-04** | Dblclick edit → blur update | 6 |
| **WN-05** | Contextmenu delete | 6 |

### 12.6 Non-régression obligatoire

- Suite unitaire complète (**113** tests au gel V2.2) — verte
- Smoke matrix V2.1 — verte
- Tests commit 5 (`walkthrough-notes-create.test.js`) — verts sans modification de comportement

---

## 13. Séquences d'appels (référence implémentation)

### 13.1 Boot — extension bind

```
bind(host, context)
  _bindContext = context
  if _boundHost === host: return (contextmenu + dblclick déjà attachés)
  _boundHost = host
  host.addEventListener("contextmenu", ...)
  host.addEventListener("dblclick", self._onNoteDblClick)    ← NOUVEAU
  document/window listeners (inchangés)
```

### 13.2 `_onContextMenu` — dispatch étendu

```
_onContextMenu(event, host)
  noteEl = _noteFromElement(event.target)
  if noteEl && noteEl.hasAttribute("data-note-id"):
    → menu delete ; return
  walkthrough = _walkthroughFromTarget(...)
  if !walkthrough: return
  if _noteFromElement (pending): return
  → menu create (commit 5)
```

### 13.3 Constante menu

```javascript
_MENU_DELETE_LABEL: "Supprimer la note"
```

---

## 14. Gestion des erreurs

| Situation | Comportement | Log |
|---|---|---|
| dblclick hors note persistée | No-op | Silencieux |
| Blur edit, texte inchangé | Exit edit, no store | Silencieux |
| Blur edit, update échoue | Rollback DOM snapshot | Silencieux / debug |
| Blur edit vide, delete échoue | Span conservé | Silencieux |
| Menu delete, store échoue | Span conservé | Silencieux |
| Re-render mid-edit (intent non acceptée) | Abandon brouillon ; restore IDB | Silencieux (§8.1) |
| Intent invalidée (mount avant acceptation) | Aucun invoke store ; restore IDB | Silencieux (§8.2) |
| Commit accepté en vol + mount intercalé | Settlement continue ; convergence §8.3 ; pas de mutation ancien DOM | Silencieux |
| Commit accepté en vol + settlement échec | Pas de mutation ancien DOM ; IDB inchangée | Silencieux |
| Convergence échoue après settlement store **réussi** | Commit **réussi** ; IDB durable conservée ; file libérée ; commits suivants non bloqués ; pas de rollback ni write compensatoire | `console.warn` `[LouInlineNotes] Note converge failed.` |
| `updateWalkthroughNote` texte vide | Ne devrait pas arriver post-branche vide §6.2 | N/A |

---

## 15. Fichiers touchés

| Fichier | Modification |
|---|---|
| `inline-notes.js` | dblclick, menu delete, `_editSnapshots`, branche persisted dans `_commitOnBlur`, `_onDeleteNote`, `_onNoteDblClick`, `_runStoreCommit`, `_convergeAfterCommit` |
| `test/walkthrough-notes-edit-delete.test.js` | WT-18 … WT-29, WT-ED-01 … WT-ED-27, WT-ED-ABA |
| `demo/renderer/docs/renderer-v2.2-05-walkthrough-note-edit-delete.md` | Contrat milestone commit 6 |

**Non modifiés :** `blocks.js`, `caret-anchor.js`, `learner-store.js`, `text-highlights.js`, `styles.css`, `index.html`, `renderer.js`, `app.js`.

---

## 16. Critère de réussite

| Oui | Non |
|---|---|
| dblclick → edit → blur update | Repositionnement |
| blur vide → delete record | Modification ancre |
| menu delete → gone | CSS dédié |
| rollback store fail | text formatting V2.3 |
| re-render mid-edit → restore IDB | Commit implicite ; revert compensatoire IDB (interdit — E16) |
| commit accepté en vol → convergence IDB | Mount intercalé + settlement + convergence immédiate (§8.3) |
| create flow commit 5 intact | Factorisation highlights |

---

## 17. Questions d'architecture (décisions fermées)

### Q1 — Escape : cancel ou commit ?

**Décision :** Escape → `blur()` → `_commitOnBlur` avec texte courant. Pas de restauration silencieuse du snapshot sans passer par blur.

### Q2 — Blur texte inchangé : write ou skip ?

**Décision :** skip — pas d'appel `updateWalkthroughNote` si `normalize(text) === snapshot` (§6.0).

### Q3 — Delete d'une note en édition

**Décision :** delete immédiat sans commit préalable du brouillon — l'action delete prime.

### Q4 — Re-render mid-edit persisted

**Décision :** abandon brouillon si intent non acceptée ; restore depuis IndexedDB — symétrique pending (E7/E11). Si commit déjà accepté en vol, settlement + convergence (§8.3).

### Q5 — `_editSnapshots` vs alternatives

**Décision :** WeakMap module-owned stockant le texte **normalisé** — voir §10.2.1 pour comparaison avec relecture IndexedDB et expando DOM.

### Q6 — Re-render pendant commit accepté en vol

**Décision :** distinguer **intent invalidée** (mount avant acceptation — aucun invoke store) et **commit accepté en vol** (settlement obligatoire ; convergence immédiate vers IDB post-succès — option A §8.3). **Interdit :** revert compensatoire snapshot → IndexedDB ; mutation du nœud DOM détaché après settlement.

---

## 18. Références

| Document | Lien |
|---|---|
| Target spec §7.4–7.6 | [renderer-v2.2-walkthrough-notes.md](./renderer-v2.2-walkthrough-notes.md) |
| Create (commit 5) | [renderer-v2.2-04-note-creation.md](./renderer-v2.2-04-note-creation.md) |
| Restore (commit 4) | [target spec §8](./renderer-v2.2-walkthrough-notes.md#8-pipeline-de-restauration) ; `test/walkthrough-notes-restore.test.js` |
| CaretAnchor | [renderer-v2.2-03-caret-anchor.md](./renderer-v2.2-03-caret-anchor.md) |
| Store | [renderer-v2.2-02-store.md](./renderer-v2.2-02-store.md) |
| Tag jalon restore | `renderer-v2.2-restore-stable` |
| Tag jalon create | `renderer-v2.2-create-stable` |
| Tag jalon edit/delete | `renderer-v2.2-edit-delete-stable` |
