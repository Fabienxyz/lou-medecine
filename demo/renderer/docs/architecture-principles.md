# Renderer — Architecture principles

Permanent invariants for the Lou chapter renderer. This document is **version-independent**. It describes rules that every renderer generation must respect.

Specific implementations are documented in version contracts (`renderer-v2.x-*.md`).

---

## 1. Two layers: Official and Learner

The renderer composes two distinct layers:

| Layer | Owner | Source | Mutable by learner |
|---|---|---|---|
| **Official Layer** | Build pipeline | Markdown projections, manifest, figures | **Never** |
| **Learner Layers** | Browser / learner | IndexedDB per origin | **Yes** (personal artifacts only) |

Official content is **read-only** in the browser. Learner Layers are **overlays and additions** applied after official DOM is built.

Learner Layers never modify the persisted chapter package (Git, manifest, projection markdown).

---

## 2. Immutability of official content

- No editing affordance on generated prose, questions, or walkthroughs.
- No mutation of official markdown in storage.
- No learner mechanism may rewrite official text nodes in place.
- Annotations attach via DOM overlay (wrap, insert sibling/inline) or separate containers — never by editing the source artifact.

If official content changes (regeneration), learner artifacts **degrade or fail to restore** rather than corrupting official DOM.

---

## 3. Projection-scoped learner artifacts

Text-level learner artifacts (highlights, walkthrough notes, future formatting) are scoped to:

```
(chapterId, projectionId, elementId, anchor…)
```

Switching tabs (projections) rebuilds DOM and restores **only** artifacts belonging to the active projection.

Artifacts stored for other projections remain in IndexedDB untouched.

---

## 4. Renderer rebuildability

On every navigation event (tab switch, reload), the renderer:

1. Discards the previous DOM (`host.innerHTML = ""` or equivalent).
2. Rebuilds official content from markdown + manifest.
3. Re-applies each Learner Layer from its **own** persisted data.

The composed view is always **derivable** from:

```
Official DOM  +  Learner Layer A data  +  Learner Layer B data  +  …
```

No Learner Layer may rely on DOM state left behind by another layer from a previous render.

---

## 5. Independence of Learner Layers

Each Learner Layer must be:

| Property | Meaning |
|---|---|
| **Independent** | No runtime dependency on another layer's DOM or in-memory state |
| **Reconstructible** | Restore pass needs only official DOM + its own store records |
| **Removable** | Deleting the layer's module hook and store leaves official content intact |

Examples (current and planned):

| Layer | Depends on | Must not depend on |
|---|---|---|
| Highlights | Official walkthrough, `text_annotations` | Walkthrough Notes, SVG overlays, Personal Diagrams |
| Walkthrough Notes | Official walkthrough, `walkthrough_notes` | Highlights, SVG overlays |
| SVG overlays (future) | Official figure, own store | Highlights, Notes |
| Personal Diagrams | Blueprint element id, `personal_diagrams` | Text anchors in walkthrough |

Cross-layer visual stacking order may be defined (see §7) — that is **composition order**, not **data dependency**.

---

## 6. Layer ordering (composition)

When multiple Learner Layers touch the same walkthrough, apply them in a fixed **composition order** documented in each version contract.

Rule of thumb:

1. Official DOM first (blocks assembly).
2. Non-text learner artifacts that live outside walkthrough prose (e.g. diagrams).
3. Text overlays that wrap official text (highlights).
4. Text additions anchored in prose (walkthrough notes).
5. Future: emphasis formatting, SVG overlays on figures.

Later layers must tolerate DOM produced by earlier layers (e.g. transparent wrappers).

---

## 7. Independent persistence

Each Learner Layer uses its **own** IndexedDB object store (or equivalent isolated namespace).

- Separate stores — not a single `kind` column standing in for separate mechanisms.
- Separate CRUD APIs in `learner-store.js`.
- Failure to read/write one store must not block mount of another layer (use `try` / `finally` at orchestration level).

---

## 8. No official markdown mutation

Learner data never flows back into:

- Projection `.md` files
- `manifest.json`
- Build pipeline inputs

Export/sync of learner data (if ever added) is a **copy** operation — not a merge into official content.

---

## 9. Coordinate stability

Text anchoring uses a **linear text coordinate space** over the walkthrough container:

- Offsets are integers on a defined text stream (see version contracts for exact stream definition).
- Range semantics are **half-open** `[start, end)`.
- Prefix/suffix context (typically 32 characters) disambiguates anchors after minor content shifts.
- DOM text-node fragmentation (from wraps and inserts) must not break offset resolution when algorithms follow half-open rules.

New layers must document whether they use the same stream as existing layers or a documented variant (e.g. excluding additive learner text).

---

## 10. Transparent vs additive learner DOM

Learner modifications fall into two classes:

| Class | Example | Text in official stream |
|---|---|---|
| **Transparent wrapper** | `<mark class="learner-highlight">` | Official text **included** — wrapper only |
| **Additive insertion** | `<span class="walkthrough-note">` | Learner-authored text **excluded** from official stream |

Do not classify by `[data-learner="true"]` alone — that attribute marks learner ownership, not stream membership.

---

## 11. Factorisation policy

**Do not extract shared anchoring modules until multiple implementations are stable.**

- Duplicate locally when duplication preserves stability of a frozen version.
- Extract only after at least two layers share proven algorithms and non-regression tests exist for both.
- Never refactor a frozen tag's module to serve a new layer without a compatibility proof (full smoke gate).

Candidate extractions are listed in version contracts as **future** notes — not implementation tasks.

---

## 12. Architecture driven by invariants, not optimisations

Prefer:

- Explicit composition order over implicit coupling
- Rebuild + restore over incremental DOM patching
- Skip silently (or honest degradation) over corrupt placement
- Async persist with DOM rollback over optimistic UI without confirmation
- Idempotent restore over one-shot mutation assumptions

Optimisations (single walker, shared toolbar, unified store) are rejected if they violate §5 or §9.

---

## 13. Scope boundaries

The renderer is **not**:

- A collaborative editor
- A markdown authoring environment
- An AI input surface for learner annotations
- A source of truth for medical content

It reproduces reading-time annotation behaviours (highlight, note, sketch) on generated explanations.

---

## 14. Testing philosophy

- Each frozen version has a **non-regression gate** (smoke matrix + unit tests).
- New versions run **prior gates unchanged** before merge.
- Tests exercise real module boundaries (`mount`, `restore`, store CRUD) — not only internal helpers.

---

## 15. Documentation hierarchy

| Question | Answer in |
|---|---|
| What must never change across versions? | This document |
| What exactly does V2.1 implement? | `renderer-v2.1-highlights.md` |
| What will V2.2 implement? | `renderer-v2.2-walkthrough-notes.md` |
| Why does the product exist? | `docs/renderer/` at repository root |
