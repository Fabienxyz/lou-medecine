# Audit — Capacités Learner (récupération)

| | |
|---|---|
| **Date** | 2026-08-03 |
| **Type** | Audit Phases A/B/C — lecture seule + validation DEV unitaire |
| **Objectif** | Inventorier les capacités Learner existantes, diagnostiquer les régressions, produire une roadmap de récupération |
| **Contraintes respectées** | Aucune modification fonctionnelle ; aucun commit de réparation |
| **Validation DEV** | Tests unitaires Node (`145` tests learner-related — verts) ; Playwright non exécuté (browsers absents) |
| **Références** | [`06-RENDERER-AND-LEARNER-LAYER.md`](../contracts/06-RENDERER-AND-LEARNER-LAYER.md), [`21-CONTENT-CONSUMPTION-FREEZE.md`](../renderer/21-CONTENT-CONSUMPTION-FREEZE.md), [`TEST_ARCHITECTURE_V1.md`](../testing/TEST_ARCHITECTURE_V1.md), [`reader-fabrique-chain-architecture-audit.md`](./reader-fabrique-chain-architecture-audit.md) |

---

## Synthèse exécutive

Le dépôt contient une **couche apprenant complète et testée en unitaire** (surlignage, notes inline CaretAnchor, diagrammes personnels, formatage SVG, patrimoine IndexedDB, session D4, préférences D7, recherche D6, snapshot export/import). Le câblage bootstrap (`index.html` → `renderer.js` → `app.js`) est **intact**.

Les Product Reviews ont surtout révélé trois familles de problèmes — **aucune ne justifie une réécriture** :

1. **Problèmes d'intégration runtime / opérationnels** (cache Service Worker, mauvais mode de lancement, bootstrap produit en échec) — features présentes mais session non atteignant le bon état.
2. **Régression ciblée post-MM Cleanup** (`e7c9b6a`) — patrimoine lié à la projection `overview` plus restauré sur la vue Modèle mental.
3. **Attentes produit vs périmètre V1 gelé** — onglet Notes (agrégation), Collège annotable, QCM interactif : jamais implémentés ou explicitement exclus du gel consommation — **pas des régressions de code existant**.

**Verdict global :** récupération prioritaire = **reconnexion et correction de câblage**, pas nouveau développement.

---

## Phase A — Inventaire exhaustif

Légende état :

| État | Signification |
|---|---|
| **Fonctionnelle** | Code implémenté, câblé, tests verts |
| **Cassée** | Implémentée mais régression runtime identifiée |
| **Partielle** | Implémentée mais gated, placeholder ou périmètre incomplet |
| **Non connectée** | Module chargé, API sans UI ou sans appel runtime |
| **Code mort** | Appel sans effet ou branche unreachable |
| **Supprimée** | Retirée du dépôt |
| **Inconnue** | Statut non vérifiable sans browser E2E |

### Tableau principal

| # | Capacité | Module(s) propriétaire(s) | Bootstrap / câblage | Tests | État |
|---|---|---|---|---|---|
| A1 | **Patrimoine identity (release scoping)** | `learner-patrimony.js`, `learner-store.js` | `index.html` ; `app.js:setReleaseContext` post-manifest | `learner-patrimony-store.test.js`, `07-storage.unit` | **Fonctionnelle** |
| A2 | **IndexedDB — 6 stores** | `learner-store.js` | Auto à la première écriture | `07-storage.unit`, stores dédiés | **Fonctionnelle** |
| A3 | **Surlignage texte — création** | `text-highlights.js` | `LouRenderer.mountLearnerLayers` → `mount` → `bindSelection` | Engineering smoke `01`, `renderer.test.js` | **Fonctionnelle** *(unit)* ; **Inconnue** *(E2E browser)* |
| A4 | **Surlignage — suppression** | `text-highlights.js` | Toolbar + clic mark | `04-lifecycle`, `08-robustness` | **Fonctionnelle** *(unit)* |
| A5 | **Surlignage — restauration** | `text-highlights.js` | `restore` dans `mountLearnerLayers` | `02-persistence`, `composition-runtime-identity` | **Cassée** *(patrimoine `overview` post-`e7c9b6a`)* ; OK sinon |
| A6 | **Notes inline — création (CaretAnchor)** | `caret-anchor.js`, `inline-notes.js` | `mountLearnerLayers` ; menu contextuel intégré | `walkthrough-notes-create.test.js`, `caret-anchor.test.js` | **Fonctionnelle** |
| A7 | **Notes inline — édition** | `inline-notes.js` | `dblclick` délégué | `walkthrough-notes-edit-delete.test.js` | **Fonctionnelle** |
| A8 | **Notes inline — suppression** | `inline-notes.js` | Menu contextuel | idem | **Fonctionnelle** |
| A9 | **Notes inline — restauration** | `inline-notes.js` | `restore` par `projectionIdsToRestore` | `walkthrough-notes-restore.test.js` | **Cassée** *(patrimoine `overview` post-`e7c9b6a`)* ; OK sinon |
| A10 | **Ancres CaretAnchor** | `caret-anchor.js` | Primitives pures | `caret-anchor.test.js` (41+) | **Fonctionnelle** |
| A11 | **Menu contextuel notes** | `inline-notes.js` (`.inline-notes-context-menu`) | `contextmenu` sur `#content` | Tests edit/delete | **Fonctionnelle** |
| A12 | **Sélection texte → toolbar surlignage** | `text-highlights.js` (`.highlight-toolbar`) | `mouseup` sur host | `06-selection`, `01-creation` | **Fonctionnelle** *(requiert `.block-walkthrough[data-official=true]`)* |
| A13 | **Diagrammes personnels — ajout 📷** | `blocks.js` | `hydrate` + `_diagramSlot` | `renderer.test.js` | **Fonctionnelle** |
| A14 | **Diagrammes personnels — suppression** | `blocks.js`, `learner-store.js` | Bouton sur carte | `renderer.test.js` | **Fonctionnelle** |
| A15 | **Diagrammes personnels — restauration** | `blocks.js` | `hydrate` | `renderer.test.js`, snapshot tests | **Partielle** *(ambiguïté multi-projection en Composition si élément dupliqué — résolu sur MM post-cleanup)* |
| A16 | **Formatage SVG inline** | `inline-formatting.js`, `svg-loader.js` | `mountLearnerLayers` après figures | `svg-inline-formatting*.test.js`, smoke `09` | **Fonctionnelle** |
| A17 | **Overlays SVG (`g.learner-svg-formats`)** | `inline-formatting.js` | DOM overlay post-restore | `svg-text-formats-store.test.js` | **Fonctionnelle** |
| A18 | **Dégradation honnête — orphelins** | `blocks.js`, overlays | `appendAnnotationOrphans`, `appendDiagramOrphans` | restore tests, smoke `05-dom-integrity` | **Fonctionnelle** |
| A19 | **Persistance locale (toutes annotations)** | `learner-store.js` | Scoping `release_id` via patrimony | `learner-patrimony-store.test.js` | **Fonctionnelle** |
| A20 | **Restauration après reload** | store + overlays + `mountLearnerLayers` | Tab load / flush pending | `02-persistence`, session tests | **Partielle** *(voir A5/A9 + session defer)* |
| A21 | **Session resume (D4)** | `session-service.js`, `session-resume.js` | `app.js:runSessionRestore` ; defer/flush layers | `session-*.test.js`, smoke `15` AP-F-08 | **Fonctionnelle** |
| A22 | **Préférences affichage (D7)** | `display-preferences-*.js` | `initDisplayPreferences` avant session | smoke `14`, D7-F tests | **Fonctionnelle** |
| A23 | **Recherche locale (D6)** | `local-search-*.js`, `search-navigation.js` | `initLocalSearch` — **`product=1` only** | smoke `13` | **Partielle** *(absente en mode dev)* |
| A24 | **Snapshot export/import patrimoine** | `learner-snapshot.js` | Chargé globalement ; **pas de UI** | `learner-snapshot*.test.js` | **Non connectée** *(API programmatique)* |
| A25 | **Import → display preferences** | `display-preferences-runtime.js` | `applyImportedRecord` | `display-preferences-snapshot.test.js` | **Fonctionnelle** *(chemin import partiel)* |
| A26 | **Onglet Notes (7e vue)** | `renderer.js:showViewNotesShell` | Composition `kind:none` | smoke `10`, `17` CN-P-06 | **Partielle** — **placeholder shell** ; jamais agrégateur |
| A27 | **Walkthrough interactif** | N/A | — | — | **Supprimée / jamais livrée** — hors périmètre V1 |
| A28 | **Réponses QCM persistées** | N/A | Session prévoit `question_id` resume point | `session-resume-store.test.js` (structure seule) | **Non connectée** — QCM = shell liste IDs |
| A29 | **Surlignage Collège officiel** | `renderer.js:renderCollegeOfficial` | `mountLearnerLayers` appelé | — | **Code mort** — pas de `.pedagogical-block` (H-05) |
| A30 | **Annotations vue Amorçage** | — | `renderCognitivePrimingView` **sans** `mountLearnerLayers` | smoke `15` | **By design** — pas de walkthrough (freeze §2.1) |
| A31 | **Figure zoom** | `figure-zoom.js` | `renderComposedBlocks` | smoke `09` indirect | **Fonctionnelle** *(officiel, pas patrimoine)* |
| A32 | **Defer / flush learner layers** | `renderer.js`, `session-resume.js`, `search-navigation.js` | Session restore + navigation recherche | `session-d4-audit-corrections.test.js` | **Fonctionnelle** |
| A33 | **Legacy dev namespace `__legacy__*`** | `learner-patrimony.js` | Dev sans catalogue | `learner-patrimony-store.test.js` | **Partielle** — patrimoine dev ≠ product |
| A34 | **Composition runtime identity** | `blocks.js` (`data-source-projection`) | Tous blocs composés | `composition-runtime-identity.test.js` | **Fonctionnelle** |

### Stores IndexedDB (`lou-learner`, v8)

| Store | Scope | Capacité |
|---|---|---|
| `personal_diagrams` | Release | A13–A15 |
| `text_annotations` | Release | A3–A5 |
| `walkthrough_notes` | Release | A6–A9 |
| `svg_text_formats` | Release | A16–A17 |
| `session_resume` | Application | A21 |
| `display_preferences` | Application | A22 |

### Vues Reader × couche apprenant (gel consommation)

| Vue | Walkthrough host | Overlays montés | Statut annotable |
|---|---|---|---|
| Amorçage cognitif | Non | Non | Interdit (by design) |
| Modèle mental | Oui (`story`) | Oui | **Annotable** |
| Notions | Oui | Oui | **Annotable** |
| Cas cliniques | Oui | Oui | **Annotable** |
| Collège officiel | Non | mount mort | Non fonctionnel V1 |
| QCM | Non | Non | Interdit |
| Notes | Non | Non | Shell patrimoine futur |

### Chaîne bootstrap (cartographie modules)

```
index.html
  ├── learner-patrimony.js → learner-store.js → learner-snapshot.js
  ├── session-service.js → session-resume.js
  ├── text-highlights.js ← caret-anchor.js → inline-notes.js
  ├── svg-loader.js → inline-formatting.js
  ├── blocks.js (diagrammes + assemble)
  └── renderer.js
        mountLearnerLayers(host, context)
          ├── LouTextHighlights.restore + mount + bindSelection
          ├── LouInlineNotes.restore + mount + bind
          └── LouInlineFormatting.mount
app.js
  ├── setReleaseContext(releaseId, chapter)
  ├── initDisplayPreferences()
  ├── runSessionRestore() [deferLearnerLayers → flushPending]
  └── initLocalSearch() [product=1 + content_digest]
```

---

## Phase B — Diagnostic des capacités non fonctionnelles

### B1 — Infrastructure / opérationnel (impact transversal)

| ID | Symptôme observé PR | Module | Cause | Première révision | Nature |
|---|---|---|---|---|---|
| **REG-OPS-01** | « Ancienne interface », features absentes | `sw.js`, cache shell | Service Worker sert shell/package périmés ; dev warm cache non borné | Pré-Shell V1 ; aggravé par évolutions Shell (`3d03c33`, `14ea85f`) | Bootstrap / cache |
| **REG-OPS-02** | Reader ne charge pas / pas d'annotations | `app.js`, `product-bootstrap.mjs` | Lancement mode dev (`?chapter=` sans `product=1`) vs mode produit — chemins, SW, bibliothèque différents | `08546b3` Composition V1 | Routing / bootstrap |
| **REG-OPS-03** | Bootstrap produit échoue, écran d'erreur | `product-bootstrap.mjs`, offline | `offline_status: failed` sur fixture library ; certification interrompue | Incident PR 2026-08-03 | Bootstrap |
| **REG-OPS-04** | Recherche locale invisible | `app.js:initLocalSearch` | Gate `config.isProductMode() && libraryBaseUrl && content_digest` | `9f1cbfe` D6 | Bootstrap |
| **REG-OPS-05** | Patrimoine « disparu » entre sessions | `learner-patrimony.js` | Dev `manifest.release_id` vs product `catalog.release_id` — namespaces IndexedDB distincts | `9abd4ba` Lot E-B | Persistance / scoping |
| **REG-OPS-06** | Atterrissage Amorçage sans overlays | `session-service.js` | Cold boot → `fallback_amorçage` ; CP sans walkthrough | `47d7bb7` D4 | Session / UX |

**Preuve REG-OPS-01 :** [`reader-fabrique-chain-architecture-audit.md`](./reader-fabrique-chain-architecture-audit.md) §3.2, §7.1 — cache SW figé, CI n'enregistre pas le SW (`app.js:577-579`).

**Preuve REG-OPS-06 :** `buildResumePlan` sans session retourne `buildFallbackAmorçage` → onglet 0 ; `renderCognitivePrimingView` ne appelle pas `mountLearnerLayers`.

### B2 — Régression code MM Cleanup

| ID | Symptôme | Module | Cause | Première révision | Nature |
|---|---|---|---|---|---|
| **REG-MM-01** | Surlignages/notes créés sur bloc `overview` invisibles sur MM | `renderer.js:createViewRenderContext` | `renderComposedBlocks` passe `renderView` normalisé (story seul) à `createViewRenderContext` → `projectionIdsToRestore` n'inclut plus `overview` | **`e7c9b6a`** (2026-08-03) | Intégration renderer |
| **REG-MM-02** | DOM `overview` absent — restore impossible même si ID listé | `renderer.js:normalizeMentalModelBlocks` | Blocs overview exclus du rendu MM | **`e7c9b6a`** | DOM |

**Mécanisme REG-MM-01 :**

```javascript
// renderer.js — renderComposedBlocks
const renderView = view.viewId === "mental-model"
  ? Object.assign({}, view, { blocks: renderBlocks })  // story only
  : view;
const context = this.createViewRenderContext(renderView, ...);  // ← overview absent
await this.mountLearnerLayers(host, context);
```

Patrimoine stocké sous `projection=overview` + `element=MM-pump-decompensation` existe (période pré-cleanup où deux blocs MM coexistaient). Tests `composition-runtime-identity.test.js` valident le scoping story/overview sur DOM dual-block — mais le DOM produit n'a plus le bloc overview.

### B3 — Code mort / by design (non régression)

| ID | Capacité | Module | Cause | Révision | Nature |
|---|---|---|---|---|---|
| **REG-DEAD-01** | Surlignage Collège | `renderer.js:756` | `mountLearnerLayers` sur `.college-official-body` sans `.pedagogical-block` | D4 session (`47d7bb7`) | Code mort |
| **REG-DEAD-02** | Export/import UI patrimoine | `learner-snapshot.js` | Lot E-C — API volontairement sans UI | `c6821dc` | Non connectée (jamais livrée) |
| **REG-DEAD-03** | Onglet Notes agrégateur | `showViewNotesShell` | PAS-NOTES Phase 5 — shell V1 seulement | `08546b3` | Partielle by design |
| **REG-DEAD-04** | QCM réponses / interaction | `showViewQcmList` | Renderer shell — YAML non rendu | `08546b3` | Non implémentée |
| **REG-DEAD-05** | Walkthrough interactif guidé | — | Hors périmètre V1 (`12-NON_GOALS.md`) | — | Supprimée / jamais existée |

### B4 — Lacunes de validation (masquent les régressions)

| Lacune | Impact |
|---|---|
| Engineering smokes `01`–`08` non exécutés en CI product (Playwright project `engineering` séparé) | Régressions browser non détectées en gate PAS |
| Pas de smoke Playwright walkthrough notes | Régression notes invisible en CI |
| SW désactivé en tests Playwright default | REG-OPS-01 non reproduit en CI |
| Pas de test « MM restore overview patrimoine post-normalization » | REG-MM-01 non couvert |

---

## Phase C — Roadmap de récupération

### Priorisation

#### P0 — Fonctions développées, intégration cassée (1–2 jours)

| ID | Action | Module | Difficulté | Risque | Dépendances | PAS |
|---|---|---|---|---|---|---|
| **REC-P0-01** | **`projectionIdsToRestore` depuis RVM complet** (pas `renderView` normalisé) ; restore overview patrimoine même si bloc non affiché → orphelins honnêtes | `renderer.js` | Faible | Faible | Aucune | PAS-MM, Engineering `02` |
| **REC-P0-02** | Valider convergence cache SW en parcours Product Review ; documenter procédure hard refresh / resync fixture | `sw.js`, `product-review-234.sh` | Faible | Moyen | REC-OPS doc | PAS-OFFLINE, PAS-SHELL |
| **REC-P0-03** | Checklist lancement : **`product=1` obligatoire** pour valider D6 + patrimoine catalogue ; onglets annotables (MM/Notions/Cas) | docs procédure | Trivial | Faible | — | Transverse |
| **REC-P0-04** | Test de non-régression REG-MM-01 : patrimoine overview → orphan panel ou restore si politique produit | test Node + smoke | Faible | Faible | REC-P0-01 | PAS-MM |

#### P1 — Reconnexion incomplète (2–3 jours)

| ID | Action | Module | Difficulté | Risque | Dépendances | PAS |
|---|---|---|---|---|---|---|
| **REC-P1-01** | Retirer `mountLearnerLayers` mort sur Collège **ou** documenter explicitement indisponibilité | `renderer.js` | Trivial | Faible | Gel §2.5 | PAS-COLLEGE, AAI-LEARNER-01 |
| **REC-P1-02** | Alerte dev si `release_id` dev ≠ catalogue lors bascule product=1 | `app.js`, `learner-patrimony.js` | Moyen | Moyen | — | PAS-NOTES |
| **REC-P1-03** | Smoke Playwright notes inline (create/edit/delete) sur Notions | nouveau spec | Moyen | Faible | Playwright install | Engineering |
| **REC-P1-04** | Vérifier `flushPendingLearnerLayers` après navigation recherche locale en product mode | `search-navigation.js` | Faible | Faible | — | PAS-D6 |
| **REC-P1-05** | Diagrammes : exiger ancre projection dans store si élément dupliqué (migration douce) | `learner-store.js`, `blocks.js` | Moyen | Moyen | — | PAS-NOTIONS |

#### P2 — Code mort supprimable (0.5–1 jour)

| ID | Action | Module | Note |
|---|---|---|---|
| **REC-P2-01** | Supprimer branche `mountLearnerLayers` Collège | `renderer.js` | Aligné H-05 / AAI-LEARNER-01 |
| **REC-P2-02** | Retirer alias smoke legacy `PROJECTIONS` si fully migrated | `fixtures.mjs` | Cosmétique |
| **REC-P2-03** | `test/browser-highlight-repro.mjs` — intégrer ou archiver | test/ | Investigation manuelle |

#### P3 — Dette technique (backlog)

| ID | Sujet | Note |
|---|---|---|
| **REC-P3-01** | UI export/import patrimoine | Lot E — API prête ; UI jamais spec V1 |
| **REC-P3-02** | Onglet Notes agrégateur | PAS-NOTES Phase 5 — pas une récupération |
| **REC-P3-03** | QCM interactif + persistance réponses | PAS-QCM — nouveau rendu requis |
| **REC-P3-04** | Collège annotable | Contradiction spec fonctionnelle §5 vs gel §2.5 — décision produit |
| **REC-P3-05** | Engineering smokes en gate product | TEST_ARCHITECTURE — pyramide |
| **REC-P3-06** | SW testé sous Playwright | AAI couverture offline |

### Ordre recommandé — Lot 1 pour pilotage immédiat

```
1. REC-P0-01  Fix projectionIdsToRestore (REG-MM-01)     ← 1 fichier, test dédié
2. REC-P0-04  Test non-régression associé
3. REC-P0-03  Procédure validation manuelle PR
4. REC-P0-02  Vérifier SW convergence post-2f71b3c
5. REC-P1-01  Nettoyer mount mort Collège
6. REC-P1-03  Smoke notes E2E
```

### Estimation chantier global

| Priorité | Effort | Calendrier indicatif |
|---|---|---|
| **P0** | 1–2 j dev | Lot 1 — immédiat |
| **P1** | 2–3 j dev | Lot 2 — semaine suivante |
| **P2** | 0.5–1 j | Lot 2–3 |
| **P3** | Hors récupération | Roadmap Phases 4–7 |

**Total récupération (P0+P1)** : **3–5 jours développeur**, sans nouvelle fonctionnalité.

### Critères de succès Lot 1

- [ ] Surlignage + note inline créés/restaurés sur MM (story), Notions, Cas cliniques en `product=1`
- [ ] Patrimoine overview pré-existant : orphelin signalé ou restauré (politique REC-P0-01)
- [ ] Reload navigateur restaure annotations
- [ ] Parcours PR reproductible sans cache stale
- [ ] Tests unitaires + smoke `01` CR-01 vert (après `npx playwright install`)

---

## État Git (2026-08-03)

```
Branche : main (ahead origin/main de 13 commits)
HEAD    : a4945b5 refactor(composition): simplify editorial artifact model

Working tree :
  M  (aucun — clean)
  ?? _Roadmap Opus - 27 Juillet 2026.docx
  ?? demo/renderer/docs/learner-session-d4-technical-design.md
  ?? docs/analysis/cardio-chapters-inventory.md
  ?? docs/analysis/cardio-pedagogical-coverage-matrix.md
  ?? docs/analysis/cardio-validation-corpus.md
  ?? docs/analysis/reader-fabrique-chain-architecture-audit.md
  ?? docs/analysis/rpc-234-execution-audit.md
  ?? docs/analysis/learner-capabilities-recovery-audit.md  ← ce document

Commits récents impactant Learner :
  e7c9b6a refactor(reader): clean mental model consumption      ← REG-MM-01
  2f71b3c fix(reader): shell updates converge across caches     ← REG-OPS-01 partiel
  3d03c33 feat(reader): establish Shell V1 foundation           ← chrome / header
  08546b3 feat(reader): implement Reader Composition V1        ← 7 vues, data-source-projection
  47d7bb7 feat(reader): implement session resume (PDR-D4)       ← defer/flush layers
  9abd4ba feat(renderer): release-scoped learner patrimony      ← release_id scoping
```

**Aucun commit de réparation effectué dans le cadre de cet audit.**

---

## Validation DEV exécutée

| Suite | Résultat |
|---|---|
| `walkthrough-notes-*.test.js`, `caret-anchor.test.js` | 145/145 pass |
| `composition-runtime-identity.test.js`, `mental-model-consumption.test.js` | pass |
| `learner-snapshot*.test.js`, `session-service.test.js` | pass |
| `renderer.test.js`, `07-storage.unit.test.js`, `svg-inline-formatting.test.js` | pass |
| Playwright `01-creation CR-01` | **Non exécuté** — browsers Playwright absents |

---

## Annexe — Mapping contrat 06 ↔ implémentation

| Contrat §8 | Implémentation | Store |
|---|---|---|
| §8.1 Diagrammes personnels | `blocks.js` | `personal_diagrams` |
| §8.2 Notes walkthrough (CaretAnchor) | `caret-anchor.js` + `inline-notes.js` | `walkthrough_notes` |
| §8.3 Surlignages | `text-highlights.js` | `text_annotations` |
| §9 Persistance | `learner-store.js` + `learner-patrimony.js` | IndexedDB |
| Extensions (hors contrat 06) | SVG formats, session, prefs, search, snapshot | stores dédiés |

---

---

## Addendum — Certification cycle annotation (2026-08-03)

### Cause racine identifiée

**Double restauration** dans `mountLearnerLayers` :

1. Boucle `restore()` par `projectionIdsToRestore`
2. Puis `mount()` rappelait `restore()` une seconde fois (projection primaire)

Lorsqu'une annotation venait d'être créée (mark/note déjà visible dans le DOM) mais que la seconde passe de `findRangeForSelector` / `restoreCaretAnchor` échouait (DOM modifié, nœuds texte splittés), l'enregistrement était classé **orphelin** → panneau « Annotations personnelles non restaurables » à tort.

### Correction appliquée

| Fichier | Changement |
|---|---|
| `renderer.js` | `mountLearnerLayers` délègue uniquement à `mount()` — suppression de la boucle restore redondante |
| `text-highlights.js` | `restoreAll()` parcourt `projectionIdsToRestore` ; `_isSelectorSatisfiedInWalkthrough()` avant orphan |
| `inline-notes.js` | `restoreAll()` ; `_isNoteRecordSatisfiedInWalkthrough()` avant orphan |
| `blocks.js` | Déduplication orphan panel par `data-orphan-id` |
| `test/learner-annotation-lifecycle.test.js` | **9 tests** — cycle complet composition V1 |

### Validations PAS exécutées

- Unit : `learner-annotation-lifecycle.test.js` + suites learner connexes — **105+ pass**
- Engineering smokes : `01-creation`, `02-persistence`, `04-lifecycle`, `05-dom-integrity`, `06-selection`, `08-robustness` — **pass**

*Cycle certifié cohérent avec Composition V1 (story seul MM, overview absent du DOM).*

