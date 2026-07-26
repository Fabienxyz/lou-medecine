# Renderer V2.3 — Inline formatting on official SVG text

> **Status:** **Frozen — architecture contract** (V2.3)  
> **Tag:** `renderer-v2.3-architecture-frozen`  
> **Frozen:** 2026-07-27  
> **Milestone:** `renderer-v2.3-inline-formatting`  
> **Baseline:** `renderer-v2.2-edit-delete-stable` (walkthrough notes frozen)  
> **Module (planned):** `inline-formatting.js` → `window.LouInlineFormatting`  
> **Loader (planned):** `svg-loader.js` → `window.LouSvgLoader`  
> **Store (planned):** `svg_text_formats`  
> **Parent:** [architecture-principles.md](./architecture-principles.md) · [renderer-v2.1-highlights.md](./renderer-v2.1-highlights.md) · [renderer-v2.2-walkthrough-notes.md](./renderer-v2.2-walkthrough-notes.md)  
> **Product context:** [docs/renderer/05-SVG_EXPERIENCE.md](../../../docs/renderer/05-SVG_EXPERIENCE.md)

Design version: **2.3.0-design-final**

This document is the authoritative **architecture contract** for Renderer V2.3. It is **not** an implementation guide and contains **no code**.

**Principe fondateur :** le renderer est un **lecteur annotable**, pas un éditeur de texte. Le texte officiel du Collège reste **strictement immuable**. Le renderer ajoute uniquement une **couche personnelle de présentation** par-dessus les labels SVG officiels.

All decisions marked **(fermé)** are normative and closed.

---

## 0. Contexte

### 0.1 Objectif

Permettre à l'apprenant d'appliquer **une mise en forme inline** à une **plage de texte sélectionnée** dans le texte officiel rendu à l'intérieur des **figures SVG** (Official Visuals), sans modifier les fichiers SVG sources du build.

| Propriété | Règle |
|---|---|
| Cible | Texte officiel `<text>` / `<tspan>` dans inline SVG DOM |
| Persistance | IndexedDB store dédié |
| Restore | Reconstruction overlay après reload / tab switch |
| Indépendance | Aucune dépendance de données aux autres Learner Layers |

### 0.2 Périmètre — V2.3 vs autres milestones

| Milestone | Cible | Statut |
|---|---|---|
| V2.1 | Surlignage walkthrough HTML | **Gelé** — `renderer-v2.1.0` |
| V2.2 | Walkthrough Notes | **Gelé** — `renderer-v2.2-edit-delete-stable` |
| **V2.3 (ce document)** | Mise en forme inline — **texte officiel SVG uniquement** | **Ce contrat** |
| V2.4 (planifié) | Overlays graphiques SVG (traits, flèches) | Hors V2.3 |
| Emphase walkthrough HTML | Prose officielle `[data-official="true"]` | **Hors V2.3** — futur milestone |
| **Formatage walkthrough notes** | Texte des notes utilisateur | **Hors V2.3** — candidat milestone indépendant futur ; non requis V2.4 ni première production |

V2.3 **ne modifie pas** `text-highlights.js`, `inline-notes.js`, ni `caret-anchor.js`.

### 0.3 Prérequis

1. Tag baseline **`renderer-v2.2-edit-delete-stable`**
2. Suite V2.1 + V2.2 **verte** avant merge V2.3
3. Official Visuals publiés via manifest
4. Pipeline visual : **`data-official-text-id` obligatoire** sur tout nœud textuel SVG formatable (§5.5)

### 0.4 Terminologie

| Terme | Usage |
|---|---|
| **Official Visual** | Figure SVG liée à un Blueprint element id |
| **Official SVG** | Fichier SVG build — **immutable** sur disque |
| **Inline SVG DOM** | SVG fetché, sanitizé, injecté — jetable à chaque re-render |
| **SVG Text Stream** | Flux texte officiel concaténé — définition normative §5 |
| **SvgTextRangeAnchor** | Ancrage half-open `[start, end)` dans le SVG Text Stream |
| **FormatRecord** | Record IndexedDB — une plage, une mise en forme |
| **Presentation overlay** | Groupe `<g class="learner-svg-formats">` — ne modifie pas les nœuds officiels |

---

## 1. Scope — formats et périmètre fermé

### 1.1 Philosophie (fermé)

| Règle | Détail |
|---|---|
| **Lecteur annotable** | Pas d'édition du contenu officiel ; overlay presentation uniquement |
| **Immutabilité officielle** | Caractères et attributs des nœuds officiels SVG **jamais** modifiés |
| **Palette fermée** | Couleurs texte et fond — ensembles finis §3.4 ; **aucune** couleur libre |
| **Neutralité sémantique** | Le renderer n'attache **aucune** signification métier |
| **Conventions utilisateur** | « important », « définition », « mécanisme », « piège », « exception » — **inconnues du renderer** |

### 1.2 Formats supportés (fermé)

| Format | V2.3 | Valeur `format` |
|---|---|---|
| Gras | **Supporté** | `bold` |
| Italique | **Supporté** | `italic` |
| Souligné | **Supporté** | `underline` |
| Barré | **Supporté** | `strike` |
| Couleur de texte | **Supporté** — palette §3.4 | `textColor` |
| Couleur de fond / surlignage | **Supporté** — palette §3.4 | `backgroundColor` |

### 1.3 Formats et comportements exclus (fermé)

| Exclu | Statut |
|---|---|
| Formats combinés sur une plage | **Interdit** — §1.4 |
| Exposant / indice | Reporté milestone ultérieur |
| Code / monospace / police / taille | **Exclu** |
| Liens hypertexte | **Exclu** |
| `<textPath>` | **Non supporté** — hors périmètre permanent V2.3 |
| Modification fichier `.svg` source | **Interdit** |
| Modification nœuds officiels DOM | **Interdit** |
| Emphase prose walkthrough HTML | Hors V2.3 — §0.2 |
| **Formatage walkthrough notes** | **Hors V2.3** — §0.2 |
| Overlays graphiques SVG | V2.4 |
| Couleur libre (hors palette) | **Exclu V2.3** |

### 1.4 Règle centrale — une mise en forme par plage (fermé)

Une plage formatée porte **exactement une** mise en forme :

```
bold | italic | underline | strike | textColor | backgroundColor
```

| Action | Comportement |
|---|---|
| Format sur plage non formatée | Création `FormatRecord` |
| Format **différent** sur plage déjà formatée (même étendue) | **Remplacement** — update record |
| **Même** format, même plage, même style couleur | **No-op** |
| Format chevauchant plage existante | Split §6.1 puis application |
| Remove | Delete record + overlay |

Pas de `formats[]`. Champ unique `format`.

### 1.5 Surface éligible (fermé)

| Éligible | Non éligible |
|---|---|
| Sélection dans `.official-visual svg[data-inline="true"]` | Figure `<img>` fallback |
| Nœuds avec `data-official-text-id` | Nœuds sans id |
| Plage dans un seul `<text>` root (multi-`<tspan>` OK) | Plage traversant plusieurs `<text>` roots |
| | `<textPath>` |
| | Nœuds `[data-learner="true"]` |
| | Prose walkthrough HTML |
| | Walkthrough notes |

### 1.6 Inclus / exclus V2.3

**Inclus :** inline SVG loading, sanitize, sélection, toolbar, overlay, persistance, restore, split, non-régression V2.1/V2.2.

**Exclus :** tout formatage hors texte officiel SVG ; modification modules gelés ; undo global ; export/sync.

---

## 2. Objectifs et architecture

### 2.1 Objectifs normatifs

| # | Objectif |
|---|---|
| O1 | Fichier SVG source **jamais** écrit |
| O2 | Caractères officiels SVG **inchangés** |
| O3 | Attributs nœuds officiels **immutables** |
| O4 | Persistance après accept store (pattern V2.1) |
| O5 | Restore depuis IndexedDB seul |
| O6 | V2.1 + V2.2 **non régressés** |
| O7 | Une mise en forme par plage |
| O8 | Neutralité sémantique |

### 2.2 Modules et responsabilités (fermé)

| Module | Rôle | Modifié ? |
|---|---|---|
| **`svg-loader.js`** | Fetch, sanitize, inject inline SVG ; signal « prêt » ; fallback `<img>` | **Nouveau** |
| **`inline-formatting.js`** | SVG Text Stream, sélection, toolbar, overlay, restore | **Nouveau** |
| **`blocks.js`** | Orchestration pipeline §4 ; mount hook | **Oui** — orchestration |
| **`learner-store.js`** | CRUD `svg_text_formats` ; DB v4 | **Oui** — store |
| **`text-highlights.js`** | Inchangé | **Non** |
| **`inline-notes.js`** | Inchangé | **Non** |
| **`caret-anchor.js`** | Inchangé | **Non** |

### 2.3 Ordre de composition Learner Layers (fermé)

1. Official DOM assemble
2. **Inline SVG load** (§4) — par figure
3. Personal Diagrams hydrate
4. Highlights mount (V2.1)
5. Walkthrough Notes mount (V2.2)
6. **Inline formatting mount** (V2.3) — **uniquement après** SVG inline prêt (§4)

---

## 3. Modèle de données

### 3.1 Store IndexedDB (fermé)

| Property | Value |
|---|---|
| Database | `lou-learner` |
| `DB_VERSION` | **4** |
| Store | `svg_text_formats` |
| Index | `[chapter, projection]` ; `[chapter, projection, element]` |

Aucun index `noteId`. Aucun champ `target`. Store **exclusivement** SVG officiel.

### 3.2 FormatRecord (fermé)

| Champ | Type | Obligatoire | Description |
|---|---|---|---|
| `id` | number | auto | Clé IndexedDB |
| `chapter` | string | oui | |
| `projection` | string | oui | |
| `element` | string | oui | Blueprint element id (figure parent) |
| `assetPath` | string | oui | Chemin manifest relatif |
| `format` | FormatKind | oui | Une valeur §3.4 |
| `style` | FormatStyle | cond. | Si `textColor` ou `backgroundColor` |
| `anchor` | SvgTextRangeAnchor | oui | §3.3 |
| `created` | string | oui | ISO-8601 |
| `updated` | string | non | ISO-8601 |

**Validation store :**

- `format` ∈ enum §3.4
- `anchor.exact` non vide après normalize (§5.7)
- `anchor.start.position < anchor.end.position` (ordre stream §5.6)
- `style.color` ∈ palette si `format === "textColor"`
- `style.backgroundColor` ∈ palette si `format === "backgroundColor"`

### 3.3 SvgTextRangeAnchor (fermé)

| Champ | Type | Description |
|---|---|---|
| `type` | `"SvgTextRangeAnchor"` | Discriminant |
| `start` | StreamPosition | Inclus |
| `end` | StreamPosition | Exclus — half-open `[start, end)` |
| `exact` | string | Texte plage normalisé |
| `prefix` | string | ≤ 32 car. avant `exact` dans stream |
| `suffix` | string | ≤ 32 car. après `exact` dans stream |

#### StreamPosition (fermé)

| Champ | Type | Description |
|---|---|---|
| `position` | number | Offset entier ≥ 0 dans **SVG Text Stream** (§5) |

**Résolution :** `position` mappe via la table §5.3 vers `(textNodeId, offsetInNode)`. Les champs `textNodeId` / offset nœud **ne sont pas persistés** — dérivés à la volée depuis `position` + DOM courant + ids build.

**Justification :** une seule coordonnée stream pour split, comparaison, validation — pas d'ambiguïté multi-nœud.

### 3.4 FormatKind et palettes (fermé)

| `format` | Rendu overlay |
|---|---|
| `bold` | `font-weight="bold"` |
| `italic` | `font-style="italic"` |
| `underline` | `text-decoration="underline"` |
| `strike` | `text-decoration="line-through"` |
| `textColor` | `fill` = `style.color` |
| `backgroundColor` | `<rect>` fond = `style.backgroundColor` |

**Palette texte (6) :** `#c0392b`, `#2980b9`, `#27ae60`, `#8e44ad`, `#d35400`, `#1a1a1a`

**Palette fond (5) :** `#fff3bf`, `#d3f9d8`, `#cfe8ff`, `#ffe0ef`, `#ffe8cc`

Toute couleur hors palette → **rejet store**.

### 3.5 Projection overlay (fermé)

```xml
<g class="learner-svg-formats" data-learner="true">
  <!-- un fragment overlay par FormatRecord -->
</g>
```

| # | Règle |
|---|---|
| P1 | Aucune mutation nœuds `<text>`/`<tspan>` officiels |
| P2 | Overlay = substring exact de la plage |
| P3 | Position via mesure glyphes officiels (`position` → nœud + offset) |
| P4 | Groupe = **dernier enfant** du `<svg>` root |
| P5 | `pointer-events: none` sur overlay (sauf mode remove si implémenté) |

---

## 4. Pipeline SVG — synchronisation async (fermé)

### 4.1 Problème

`LouSvgLoader` fetch est **async**. `LouInlineFormatting.restore()` **ne doit jamais** s'exécuter avant que le SVG inline de la figure soit **complètement disponible** dans le DOM.

### 4.2 Propriétaire (fermé)

| Étape | Owner |
|---|---|
| Fetch + sanitize + inject | **`svg-loader.js`** |
| Attente fin chargement **toutes** figures du host | **`blocks.js`** (`render`) |
| Restore formats | **`inline-formatting.js`** — **après** signal prêt |
| Signal « SVG prêt » | Attribut `data-inline-ready="true"` sur `<svg data-inline="true">` |

### 4.3 Pipeline normatif (fermé)

```
blocks.render(host, html, context):
  1. assemble(html) → fragment avec <figure> placeholders ou <img> sync
  2. host.innerHTML = ""; append fragment
  3. await hydrate(host, context)                    // diagrams
  4. await LouSvgLoader.loadAllFigures(host, context)
       pour chaque .official-visual[data-element]:
         if manifest relPath:
           try fetch → sanitize → inject <svg data-inline="true">
           svg.setAttribute("data-inline-ready", "true")
         catch:
           inject <img> fallback
           figure.setAttribute("data-inline-fallback", "true")
  5. finally:
       await LouTextHighlights.mount(host, context)
       await LouInlineNotes.mount(host, context)
       await LouInlineFormatting.mount(host, context)
```

**Invariant pipeline :** étape 4 **terminée** (succès ou fallback par figure) **avant** étape 5.

### 4.4 Comportements par mode figure (fermé)

| Mode | Attributs | Formatage |
|---|---|---|
| Inline SVG succès | `svg[data-inline="true"][data-inline-ready="true"]` | **Autorisé** |
| Fallback `<img>` | `figure[data-inline-fallback="true"]` | **Interdit** — pas toolbar ; pas store write |
| Parse / fetch échec | fallback `<img>` | Idem |
| Visual withheld / absent | N/A | N/A |

### 4.5 restore() — garde (fermé)

```
LouInlineFormatting.restore(host, context):
  for each figure with svg[data-inline-ready="true"]:
    records = listSvgTextFormats(chapter, projection, element)
    ...
  // Figures data-inline-fallback="true" → skip silent
  // Figures sans data-inline-ready → skip silent (jamais atteint si pipeline respecté)
```

**Invariant :** restore ne tente **jamais** de résoudre une ancre sur une figure non prête.

### 4.6 mount() (fermé)

```
LouInlineFormatting.mount(host, context):
  try: await restore(host, context)
  catch: console.warn "[LouInlineFormatting] Format restore failed."
  finally: bindSelection(host, context)
```

Précondition mount : pipeline §4.3 étape 4 complète (responsabilité **`blocks.js`**, pas du module formatting).

---

## 5. SVG Text Stream — définition normative (fermé)

### 5.1 Purpose

Fournir un **espace de coordonnées unique** pour ancrage, validation, split, restore et comparaison. Toutes les opérations V2.3 **doivent** utiliser ce flux — aucune autre représentation de position.

### 5.2 Scope par figure

Un SVG Text Stream est défini **par figure** (Blueprint `element` id), sur le `<svg data-inline-ready="true">` courant.

### 5.3 Parcours DOM (fermé)

```
buildSvgTextStream(svgRoot):
  stream = ""
  positions = []   // positions[i] = StreamPosition mapping for stream index i
  for each node in svgRoot in DOCUMENT ORDER (TreeWalker):
    if node is not eligible (§5.4): continue
    append node.textContent code units to stream
    record mapping streamOffset ↔ (textNodeId, offsetInNode)
  return { stream, map }
```

**TreeWalker filter :** nœuds `TEXT_NODE` dont le parent éligible est `<text>` ou `<tspan>` officiel.

### 5.4 Éléments éligibles (fermé)

| Condition | Éligible |
|---|---|
| Ancêtre `<svg data-inline="true">` | Requis |
| Élément `<text>` ou `<tspan>` avec `data-official-text-id` | Oui |
| Descendant de `[data-learner="true"]` | **Non** |
| `<textPath>` | **Non** |
| Sans `data-official-text-id` | **Non** — ignoré |

### 5.5 Rôle `data-official-text-id` (fermé)

- **Obligatoire** sur tout nœud textuel formatable (build pipeline).
- Unique **au sein d'une figure** (`element`).
- Stable entre sessions pour une version de figure (`assetPath` constant).
- Sert à résoudre `position` → nœud au restore si structure `<tspan>` inchangée.
- **Aucun fallback** XPath / index arbre.

### 5.6 Positions et comparaison (fermé)

| Concept | Définition |
|---|---|
| **Stream length** | `stream.length` (UTF-16 code units) |
| **StreamPosition** | Entier `p` avec `0 ≤ p ≤ length` |
| **Plage** | Half-open `[start.position, end.position)` |
| **Valide** | `0 ≤ start.position < end.position ≤ length` |
| **Comparaison** | Ordre numérique sur `position` |
| **Chevauchement** | `[a,b)` ∩ `[c,d)` ≠ ∅ ⟺ `a < d && c < b` |

### 5.7 Normalisation texte (fermé)

`normalizeStreamText(s)` — appliqué à `exact`, prefix, suffix, comparaisons no-op :

1. Remplacer runs whitespace (space, tab, LF, CR) par U+0020
2. `trim()` bords

**Espaces dans stream brut :** le stream est construit depuis `textContent` **sans** normalisation intermédiaire. La normalisation s'applique à la **sélection utilisateur** avant persist, pas au stream entier.

**Sélection utilisateur :** extraire substring stream `[start, end)` ; `exact = normalizeStreamText(substring)` ; ajuster `[start, end)` si trim modifie les bords (recalcul positions).

### 5.8 Multi-`<tspan>` (fermé)

| Cas | Règle |
|---|---|
| Plage dans un seul nœud | Standard |
| Plage couvrant plusieurs `<tspan>` **même `<text>` parent** | **Autorisé** — une plage stream continue |
| Plage traversant **deux `<text>` roots** | **Rejet** — sélection invalidée silencieusement |
| `<textPath>` | **Rejet** — hors scope permanent |

### 5.9 Résolution ancre au restore (fermé)

```
resolveAnchor(svgRoot, anchor):
  1. Rebuild stream + map (§5.3)
  2. If anchor.exact not found in stream (quote disambiguation prefix/suffix): return null
  3. Verify stream.substring(start, end) normalizes to anchor.exact
  4. Map (start, end) → glyph ranges via map
  5. return ranges or null
```

Échec → skip silencieux (record conservé en IDB, pas d'overlay).

---

## 6. Cas limites

### 6.1 Split et remplacement (fermé)

**Invariant :** aucun chevauchement entre records actifs sur même `element`.

**Algorithme `applyFormat(element, [s,e), newFormat)` :**

```
1. overlapping = { R | R.element == element && rangesOverlap(R.anchor, [s,e)) }
2. for each R in overlapping:
     delete R (store + overlay)
3. for each R in overlapping (saved copy):
     if R.anchor.start.position < s: create [R.anchor.start.position, s) with R.format, R.style
     if R.anchor.end.position > e:   create [e, R.anchor.end.position) with R.format, R.style
4. if sameFormatNoOp([s,e), newFormat): return
5. create [s, e) with newFormat
6. persist ; render overlays
```

Positions = **stream positions** §5.6.

**Exemples :**

```
Existant: [0,10) bold
Action:   [5,15) italic
→ [0,5) bold + [5,15) italic

Existant: [0,10) bold
Action:   [3,7) textColor red
→ [0,3) bold + [3,7) textColor:red + [7,10) bold

Existant: [0,10) bold
Action:   [0,10) italic
→ [0,10) italic   (remplacement)
```

### 6.2 Sélection

| Cas | Comportement |
|---|---|
| Range collapsed | No toolbar |
| Intersecte `[data-learner="true"]` | Rejet |
| Multi-`<text>` root | Rejet |
| `<textPath>` | Rejet |
| Sans `data-official-text-id` | Rejet |
| Figure fallback `<img>` | Rejet |
| Sélection inverse | Normaliser start/end positions |

### 6.3 Restore / re-render

| Cas | Comportement |
|---|---|
| Anchor résolu | Overlay rendu |
| Anchor fail | Skip silencieux |
| `assetPath` mismatch | Skip silencieux |
| viewBox change | Mesure live si ancré ; sinon skip |
| `host.innerHTML = ""` | Overlays détruits ; restore au prochain mount |
| Double restore | Idempotent — `data-format-id` guard |

### 6.4 Suppression

Remove toolbar → delete record + overlay.

### 6.5 Interdits

Édition texte officiel ; formats combinés ; couleur hors palette ; innerHTML utilisateur ; mutation nœuds officiels.

---

## 7. Interactions

### 7.1 LearnerStore

| API | Rôle |
|---|---|
| `addSvgTextFormat(record)` | Create |
| `listSvgTextFormats(chapter, projection)` | List |
| `listSvgTextFormats(chapter, projection, element)` | List by figure |
| `updateSvgTextFormat(id, partial)` | Update |
| `deleteSvgTextFormat(id)` | Delete |

Aucune API liée aux notes. Aucune cascade cross-store.

### 7.2 Highlights, Walkthrough Notes, CaretAnchor

**Aucune interaction de données.** V2.3 ne lit ni n'écrit `walkthrough_notes`, `text_annotations`, CaretAnchor.

Sélection native : walkthrough HTML ou SVG — **mutuellement exclusif** par le navigateur.

**Non-régression :** suites V2.1 et V2.2 **vertes** après merge V2.3.

### 7.3 Sélection et toolbar

Toolbar : B, I, U, S ; swatches palette texte ; swatches palette fond ; Remove.

Pendant write store : toolbar **désactivée**.

Pattern V2.1 : overlay optimiste autorisé ; rollback si store reject.

### 7.4 XSS (fermé)

| Règle | Détail |
|---|---|
| Contenu overlay | `textContent` uniquement |
| Attributs overlay | Whitelist : `class`, `data-format-id`, `data-learner`, `fill`, `font-weight`, `font-style`, `text-decoration` |
| Couleurs | Valeurs palette uniquement |
| Sanitize SVG inbound | Whitelist éléments : `svg`, `g`, `text`, `tspan`, `rect`, `line`, `path`, `circle`, `ellipse`, `polygon`, `polyline`, `defs`, `use` (href interne `#id` seulement) |
| Supprimé | `script`, `foreignObject`, handlers `on*`, `javascript:`, `iframe`, `embed` |

---

## 8. Invariants architecturaux

| ID | Invariant |
|---|---|
| I1 | Texte officiel SVG — caractères intacts |
| I2 | Fichier SVG source jamais écrit |
| I3 | Attributs nœuds officiels immutables |
| I4 | SVG Text Stream — construction déterministe §5 |
| I5 | Une mise en forme par plage par record |
| I6 | Restore idempotent |
| I7 | Ordre stable restore : tri `(element, start.position, id)` |
| I8 | Write-before-confirm UI |
| I9 | Rollback overlay si store reject |
| I10 | restore **après** `data-inline-ready="true"` |
| I11 | V2.1 + V2.2 non régressés |
| I12 | mount formatting indépendant — warn seul si restore fail |
| I13 | Projection-scoped |
| I14 | Lecteur annotable — jamais éditeur |

---

## 9. Tests architecturaux

Fichier : `demo/renderer/test/svg-inline-formatting.test.js`

### 9.1 Invariants

| ID | Scénario |
|---|---|
| IF-01 | Bold → official SVG textContent unchanged |
| IF-02 | Format → asset file hash unchanged |
| IF-03 | Official node attributes unchanged |
| IF-04 | Double restore idempotent |
| IF-05 | One format per record |
| IF-06 | Store reject → overlay removed |
| IF-07 | Palette color accepted ; out-of-palette rejected |

### 9.2 Sélection

| ID | Scénario |
|---|---|
| LF-01 | Select SVG text → toolbar |
| LF-02 | `<img>` fallback → no toolbar |
| LF-03 | Multi-`<text>` root → rejected |
| LF-04 | `<textPath>` → rejected |
| LF-05 | Missing `data-official-text-id` → rejected |
| LF-06 | Multi-`<tspan>` same parent → allowed |
| LF-07 | Intersect `[data-learner="true"]` → rejected |

### 9.3 Split / remplacement

| ID | Scénario |
|---|---|
| SP-01 | [0,10) bold + [5,15) italic → split correct |
| SP-02 | [0,10) bold + [3,7) red → three segments |
| SP-03 | [0,10) bold + [0,10) italic → replacement |
| SP-04 | No overlapping records after any apply |

### 9.4 Pipeline async

| ID | Scénario |
|---|---|
| PL-01 | restore runs only after `data-inline-ready="true"` |
| PL-02 | Slow fetch → formats appear after load completes |
| PL-03 | Fetch fail → `<img>` fallback ; no format affordance |
| PL-04 | mount formatting after loadAllFigures completes |

### 9.5 Restore / re-render

| ID | Scénario |
|---|---|
| RS-01 | Apply → reload → restore |
| RS-02 | renderProjection → restore |
| RS-03 | Invalid anchor → skip silent |
| RS-04 | assetPath mismatch → skip |
| RS-05 | restore fail → bindSelection still runs |

### 9.6 Sécurité

| ID | Scénario |
|---|---|
| ER-01 | `<script>` stripped from inbound SVG |
| ER-02 | `foreignObject` stripped |
| ER-03 | Overlay uses textContent not innerHTML |

### 9.7 Régressions

| ID | Scénario |
|---|---|
| RG-01 | V2.1 full suite green |
| RG-02 | V2.2 full suite green |
| RG-03 | 113+ tests green |

---

## 10. Décisions architecturales fermées

| # | Décision |
|---|---|
| Q1 | Loader dédié `svg-loader.js` ; `loadAllFigures` avant mount formatting |
| Q2 | XSS — §7.4 |
| Q3 | Split — §6.1 |
| Q4 | `<textPath>` — non supporté permanent V2.3 |
| Q5 | `data-official-text-id` — obligatoire |
| Q6 | Toolbar disabled during write |
| Q7 | Emphase HTML prose — hors V2.3 ; futur milestone |
| Q8 | **Walkthrough note formatting — hors V2.3** ; futur milestone indépendant |
| Q9 | Positions = **stream offsets** uniquement ; pas de persist per-node |
| Q10 | Couleurs = **palette fermée** uniquement |

---

## 11. Revue critique finale

### 11.1 Contradictions

| Zone | Statut |
|---|---|
| Notes vs SVG-only | **Résolu** — notes retirées |
| Formats combinés | **Interdit** — §1.4 |
| Couleur libre vs palette | **Résolu** — palette seule Q10 |
| Async timing | **Résolu** — §4 pipeline |
| Stream vs per-node offsets | **Résolu** — §5 stream positions Q9 |
| Auto-revue précédente | **Remplacée** — §11 |

**Aucune contradiction interne identifiée.**

### 11.2 Oublis

| Sujet | Statut |
|---|---|
| Pipeline async owner | §4 — `blocks.js` + `svg-loader.js` |
| SVG Text Stream definition | §5 |
| Fallback `<img>` | §4.4 |
| V2.2 integration | Non-régression RG-02 uniquement |
| Note formatting | Explicitement hors scope Q8 |

### 11.3 Ambiguïtés

**Aucune ambiguïté architecturale bloquante.**

Détails implémentation (mesure glyphe exacte, UI toolbar layout) — hors gel.

### 11.4 Complexité

| Élément | Évaluation |
|---|---|
| Une mise en forme / plage | Minimal |
| Stream positions uniques | Simplifie split |
| Pas de surface notes | Supprime C1/C2 revue |
| Pipeline async explicite | Nécessaire et fermé |
| Store `svg_text_formats` | Minimal |

---

## **CONTRACT FROZEN**

Contrat gelé le 2026-07-27 (`renderer-v2.3-architecture-frozen`). Toute évolution fonctionnelle ou architecturale requiert un **nouveau milestone** — pas de modification de ce document.

**Milestones d'implémentation suggérés (informationnel) :**

1. Store `svg_text_formats` + DB v4  
2. `svg-loader.js` + pipeline §4 dans `blocks.js`  
3. SVG Text Stream + sélection + toolbar  
4. Overlay + restore + split  
5. Tests §9 + non-régression  

---

## 12. Références

| Document | Lien |
|---|---|
| Principes | [architecture-principles.md](./architecture-principles.md) |
| Highlights V2.1 | [renderer-v2.1-highlights.md](./renderer-v2.1-highlights.md) |
| Walkthrough Notes V2.2 | [renderer-v2.2-walkthrough-notes.md](./renderer-v2.2-walkthrough-notes.md) |
| Baseline | `renderer-v2.2-edit-delete-stable` |
| SVG experience | [docs/renderer/05-SVG_EXPERIENCE.md](../../../docs/renderer/05-SVG_EXPERIENCE.md) |
