# Architecture de validation — Reader V1 (Phase T0)

| | |
|---|---|
| **Type** | Document de référence — **informatif** |
| **Statut** | En vigueur — 2026-08-03 |
| **Périmètre** | Toute validation du produit Reader V1 (moteur + consommation + expérience) |
| **Autorité** | Définit la hiérarchie des batteries ; ne remplace ni les contrats ni les ADR |
| **Fixture de référence** | Item **234** — Insuffisance cardiaque — édition Collège 2022 |

Ce document réaligne la chaîne de validation sur le **Reader V1 produit complet** — pas uniquement le moteur Composition. Il constitue la source unique pour :

- identifier quelle batterie valide quelle exigence ;
- prononcer un jalon Reader ;
- distinguer tests techniques, tests produit et Product Review.

**Documents connexes :**

- Product Review manuelle : [`docs/renderer/PRODUCT-REVIEW.md`](../renderer/PRODUCT-REVIEW.md)
- CI gate : [`.github/workflows/ci-234.yml`](../../.github/workflows/ci-234.yml)
- Script local : [`scripts/validate-reader-v1.sh`](../../scripts/validate-reader-v1.sh)

---

## 1. Résumé exécutif

### Problème résolu (Phase T0)

Avant T0, plusieurs centaines de tests passaient alors que la Product Review réelle pouvait échouer. Causes identifiées :

1. **Deux chemins d'exécution** — mode développement (`?chapter=…`) vs mode produit (`&product=1`) — seul le second représente le produit livré.
2. **Service Worker désactivé sous Playwright** pour la majorité des smokes historiques (V2.1 annotations).
3. **Doublons** entre smokes dev et smokes produit (offline, navigation).
4. **Absence de hiérarchie** entre tests techniques, tests produit et Product Review.

### Architecture cible — six familles officielles

| Famille | Autorité | Bloquant CI | Prononcé jalon |
|---|---|---|---|
| **Validation Fabrique** | Package publié conforme | Oui | Oui |
| **Validation Contrats** | Obligations composants | Oui | Oui |
| **Validation Reader technique** | Moteur, modules, dev bootstrap | Oui (unit) / Informatif (smoke dev) | Non seul |
| **Validation Reader Produit** | Chemin Fabrique → bibliothèque → Reader | Oui | **Oui** |
| **Product Review** | Observation humaine produit | Non (manuelle) | **Oui** (Phases 7–8) |
| **Validation CI** | Orchestration gate 234 | — | Agrège les familles bloquantes |

**Règle d'or :** un jalon Reader **ne peut pas** être prononcé sur la seule base des tests mode développement ou des tests unitaires isolés. Le gate produit (`test:smoke:product`) doit être vert.

---

## 2. Familles officielles

### 2.1 Validation Fabrique

**Responsabilité unique :** le package publié est valide, reproductible et installable.

| Élément | Emplacement | Fréquence |
|---|---|---|
| `lou-build validate` | `tools/lou-build` — stages B→I | CI, pre-commit éditorial, Product Review |
| `lou-build build` | stages B→K | Publication, Product Review |
| Tests pipeline JS | `tools/lou-build/test/*.test.js` (176 tests) | `npm run test:ci` |
| Tests pipeline TS | `pipeline-runner`, `pipeline-config`, `visuals-stage` (22 tests) | `npm run test:ci` |
| Test intégration slice | `tools/lou-build/test/slice.test.ts` (18 tests) | `npm run test:integration` — **hors gate CI** |
| Sync fixture Reader | `scripts/sync-reader-fixture.mjs` | CI, Product Review |
| Outils acquisition | `01-learning/tools/*/test/` | Maintenance acquisition — **hors gate CI** |

**Critères de réussite :** `validate` PASS sur le chapitre cible ; `test:ci` PASS ; fixture Reader synchronisée avec le digest du package source.

**Niveau d'autorité :** **bloquant** pour tout jalon impliquant un package.

---

### 2.2 Validation Contrats

**Responsabilité unique :** les composants respectent leurs contrats normatifs (`docs/contracts/components/`).

| Élément | Emplacement | Contrat couvert |
|---|---|---|
| `compliance-nc.test.js` | `demo/renderer/test/` | Renderer Component Contract (NC-1…3) |
| `composition-spec.test.js` | idem | Composition Component Contract |
| `composition-nominal-path.test.js` | idem | Pas de repli projection-tab sur chemin nominal |
| `browser-package-access.test.js` | idem | Package Access (D1-D) |
| `browser-offline-manager.test.js` | idem | Offline (D2) |
| `browser-offline-stale.test.js` | idem | Offline stale (D2-H) |
| `local-search-*-validation.test.js` | idem | Local Search (D6-F) |
| `display-preferences-*-validation.test.js` | idem | Display Preferences (D7-F) |
| `cognitive-priming-*.test.js` | idem | Cognitive Priming (AP) |
| `learner-*.test.js`, `session-*.test.js` | idem | Patrimoine, Session (D4, E) |
| `product-consumption.test.js` | idem | Chemin consommation Phase 0.1 (unit) |
| `product-bootstrap-errors.test.js` | idem | Diagnostics bootstrap produit |
| Tests lou-build lib | `library-install`, `package-access`, `offline-*`, `release-identity` | D1, D2, identité release |

**Critères de réussite :** tous les tests contrat PASS dans `npm test` (renderer) et `npm run test:ci` (lou-build).

**Niveau d'autorité :** **bloquant** CI.

---

### 2.3 Validation Reader technique

**Responsabilité unique :** le moteur Reader (Composition, rendu, annotations, modules) fonctionne en isolation ou en mode développement.

| Sous-famille | Emplacement | Mode | Autorité jalon |
|---|---|---|---|
| **Unit tests renderer** | `demo/renderer/test/*.test.js` (~651 tests) | Node + jsdom/fake-idb | Nécessaire, non suffisant |
| **Smoke engineering** | `demo/renderer/test/smoke/0[1-9]-*.spec.mjs`, `10-*`, `11-offline-dev` | Browser, `?chapter=` dev | **Informatif** |
| **Storage unit** | `demo/renderer/test/smoke/07-storage.unit.test.js` | Node | Bloquant CI (via `npm test`) |

**Smokes engineering — périmètre conservé :**

| Fichier | Scénarios | Raison de conservation |
|---|---|---|
| `01-creation` … `09-svg-formatting` | Annotations, sélection, DOM | Régression moteur annotations — chemin dev plus rapide |
| `10-composition-navigation` | CN-01…07 | Régression Composition en dev bootstrap |
| `11-offline-dev` | OF-DEV-01 | Dégradation college source en dev |

**Smokes engineering — supprimés (T0) :**

| Ancien test | Raison |
|---|---|
| `11-offline` OF-01…03 | Doublons de `12-offline-d2g` OF-D2-03/04 sur chemin produit |
| `11-offline` OF-05 | Déplacé vers `16-product-consumption` PC-04 |

**Critères de réussite :** `npm test` PASS ; `npm run test:smoke:engineering` PASS (informatif pour jalon, bloquant CI merge).

---

### 2.4 Validation Reader Produit

**Responsabilité unique :** le produit tel que consommé après publication — bibliothèque installée, mode `product=1`, offline, auto-repair.

| Fichier smoke | ID | Scénarios critiques |
|---|---|---|
| `12-offline-d2g.spec.mjs` | OF-D2 | Certification offline, SW, 7 vues offline, Package Access URLs |
| `13-local-search-d6f.spec.mjs` | LS-F | Recherche locale produit, offline, cache |
| `14-display-preferences-d7f.spec.mjs` | DP-F | Préférences affichage, persistance, offline |
| `15-cognitive-priming-apf.spec.mjs` | AP-F | Amorçage, session resume, recherche, offline |
| `16-product-consumption.spec.mjs` | PC | **Ouverture package publié**, republication même `release_id`, parcours complet |
| `17-product-composition-navigation.spec.mjs` | CN-P | **Navigation 7 vues** en mode produit (CN-07 planned → dev `10-composition-navigation`) |

**Commande autoritaire :**

```bash
cd demo/renderer && npm run test:smoke:product
```

**Critères de réussite :** 100 % PASS ; aucune requête vers `/01-learning/chapters/` en mode produit ; `offline_status` → `offline_ready` après bootstrap.

**Niveau d'autorité :** **bloquant CI** ; **suffisant** pour jalon technique Reader (hors Product Review éditoriale Phases 7–8).

---

### 2.5 Product Review

**Responsabilité unique :** observation humaine du produit publié dans les conditions réelles d'usage.

| Élément | Rôle |
|---|---|
| [`scripts/product-review-234.sh`](../../scripts/product-review-234.sh) | Procédure canonique : validate → build → install → serveur |
| URL officielle | `…/index.html?chapter=cardio/234-insuffisance-cardiaque&product=1` |
| Bibliothèque | `.local/product-review-library/` (gitignored) |
| Pré-vol automatisé | `scripts/validate-reader-v1.sh` (sans étape manuelle) |

**Relation avec les tests automatisés :**

```
Validation Fabrique + Contrats + Reader Produit (automatisé)
        ↓ gate vert
Product Review (humain, navigateur réel, pas webdriver)
        ↓ observation OK
Jalon éditorial (Phases 7–8)
```

**Critères de réussite :** URL officielle charge 7 vues ; republication sans changement de `release_id` réparée automatiquement ; diagnostics explicites en cas d'échec (`DIGEST_DIVERGENT`, etc.).

**Niveau d'autorité :** **suprême** pour les jalons éditoriaux (Phase 7 Product Review avec Lou, Phase 8 Product Freeze) ; **non automatisée** en CI.

---

### 2.6 Validation CI

**Responsabilité unique :** orchestrer les batteries bloquantes sur chaque push/PR `main`.

| Step CI | Famille | Bloquant |
|---|---|---|
| `lou-build validate — package 234` | Fabrique | Oui |
| `sync-reader-fixture.mjs` | Fabrique | Oui |
| `npm run test:ci` (lou-build) | Fabrique + Contrats | Oui |
| `npm test` (renderer) | Contrats + Reader technique | Oui |
| `npm run test:smoke:product` | Reader Produit | Oui |
| `npm run test:smoke:engineering` | Reader technique | Oui (merge) / Informatif (jalon) |

**Script local miroir :** [`scripts/validate-reader-v1.sh`](../../scripts/validate-reader-v1.sh)  
**Script CI historique :** [`scripts/ci-234.sh`](../../scripts/ci-234.sh) — aligné sur le workflow.

**Hors gate CI :** `npm run test:integration` (lou-build slice), outils acquisition, Product Review manuelle.

---

## 3. Cartographie des responsabilités

### 3.1 Exigences → batterie autoritaire

| Exigence | Batterie autoritaire | Doublons acceptés |
|---|---|---|
| Package 234 valide (PDR-B2) | `lou-build validate` | — |
| Pipeline build reproductible | `lou-build test:ci` | `test:integration` (slice, hors gate) |
| Identité release (`release_id`, digest) | `release-identity.test.js`, `composition-runtime-identity.test.js` | — |
| Installation bibliothèque atomique | `library-install.test.js`, `sync-reader-fixture.test.js` | — |
| Composition 7 vues | `17-product-composition-navigation` (produit), `composition-engine.test.js` (unit) | `10-composition-navigation` (dev, informatif) |
| Certification offline | `12-offline-d2g` (produit) | `browser-offline-manager.test.js` (unit) |
| Auto-repair digest / republication | `product-consumption.test.js` (unit, digest drift) ; `16-product-consumption` PC-02 (resync browser) | — |
| Service Worker bootstrap | `12-offline-d2g` OF-D2-10, `16-product-consumption` PC-01 | — |
| Recherche locale | `13-local-search-d6f` | `local-search-*.test.js` (unit) |
| Préférences affichage | `14-display-preferences-d7f` | `display-preferences-*.test.js` (unit) |
| Amorçage cognitif | `15-cognitive-priming-apf` | `cognitive-priming-*.test.js` (unit) |
| Reprise session | `15-cognitive-priming-apf` AP-F-08 | `session-*.test.js` (unit) |
| Annotations / surlignage | `01-creation` … `08-robustness` (engineering) | tests unit `walkthrough-notes-*`, `text-highlights` |
| Patrimoine export/import | `learner-snapshot*.test.js` | — |
| Diagnostics bootstrap produit | `product-bootstrap-errors.test.js` | — |
| Fallback legacy prototype | `compliance-nc.test.js` NC-3, `renderer.test.js` | **Hors chemin nominal** — ne pas confondre avec produit |
| Product Review réelle | `product-review-234.sh` | Pré-vol : `validate-reader-v1.sh` |

### 3.2 Zones sans couverture automatisée (acceptées)

| Scénario | Statut | Mitigation |
|---|---|---|
| Product Review visuelle / UX Lou | Manuel — Phase 7 | Script canonique |
| Multi-chapitres bibliothèque | N/A — un seul chapitre complet | Extension post-224 |
| Second chapitre smoke | N/A | Fixture 234 suffisante V1 |
| Build SVG byte-identique CI | Dette ouverte (PROJECT_STATE) | Hors périmètre T0 |

---

## 4. Scénarios critiques — couverture T0

| Scénario | Avant T0 | Après T0 |
|---|---|---|
| Product Review réelle (mode produit) | Script existant, non aligné CI | Gate produit + script + doc |
| Republication même `release_id` | Unit (`product-consumption.test.js`) + resync browser (`PC-02`) | **PC-02** resync + unit auto-repair |
| Bootstrap Service Worker | Partiel (OF-D2-10) | **PC-01**, OF-D2-10 |
| Parcours utilisateur complet | Fragmenté dev/produit | **PC-03** |
| Reprise session | AP-F-08 (Amorçage) | Inchangé — autoritaire |
| Recherche | LS-F-* | Inchangé — autoritaire |
| Préférences | DP-F-* | Inchangé — autoritaire |
| Navigation Reader 7 vues | CN-* dev seulement | **CN-P-*** produit |
| Transitions entre vues | CN-P, LS-F, AP-F | Couvert |
| Ouverture package publié | Non gate CI | **PC-01** |

---

## 5. Inventaire complet des suites

### 5.1 Synthèse quantitative (fixture 234)

| Suite | Commande | Tests | Gate CI |
|---|---|---:|---|
| lou-build JS | `npm run test:ci` (partie 1) | 176 | Oui |
| lou-build TS | `npm run test:ci` (partie 2) | 22 | Oui |
| lou-build integration | `npm run test:integration` | 18 | Non |
| Renderer unit | `npm test` | ~651 | Oui |
| Smoke product | `npm run test:smoke:product` | ~72 | Oui |
| Smoke engineering | `npm run test:smoke:engineering` | ~57 | Oui (informatif jalon) |
| **Total gate CI** | | **~978** | |

### 5.2 Scripts de validation

| Script | Usage |
|---|---|
| `scripts/validate-reader-v1.sh` | Gate locale complet — batteries autoritaires |
| `scripts/ci-234.sh` | Parité CI GitHub Actions |
| `scripts/product-review-234.sh` | Product Review manuelle |
| `scripts/sync-reader-fixture.mjs` | Sync package → fixture bibliothèque |

---

## 6. Critères de prononcé des jalons

### Jalon technique Reader (ex. clôture lot Dn)

1. `lou-build validate` PASS sur package concerné
2. `npm run test:ci` PASS
3. `npm test` PASS
4. `npm run test:smoke:product` PASS

### Jalon éditorial RPC 234 (Phases 7–8)

1. Critères techniques ci-dessus
2. Product Review via `./scripts/product-review-234.sh` — observation humaine OK
3. Pas de régression sur les 7 vues produit

### Merge `main` (CI)

Identique au jalon technique — engineering smokes inclus pour non-régression dev.

---

## 7. Changelog Phase T0

### Ajouté

| Élément | Description |
|---|---|
| `docs/testing/TEST_ARCHITECTURE_V1.md` | Ce document |
| `demo/renderer/test/smoke/16-product-consumption.spec.mjs` | PC-01…04 — chemin consommation produit |
| `demo/renderer/test/smoke/17-product-composition-navigation.spec.mjs` | CN-P-01…07 — navigation mode produit |
| `demo/renderer/test/smoke/product-helpers.mjs` | Helpers partagés mode produit |
| `demo/renderer/test/smoke/11-offline-dev.spec.mjs` | Remplace `11-offline` — scénario dev unique |
| `scripts/validate-reader-v1.sh` | Gate locale autoritaire |
| Playwright projects `product` / `engineering` | Séparation autorité |
| `npm run test:smoke:product` / `:engineering` | Commandes ciblées |

### Supprimé

| Élément | Raison |
|---|---|
| `11-offline.spec.mjs` OF-01…03 | Doublons `12-offline-d2g` |
| `11-offline.spec.mjs` OF-05 | Déplacé PC-04 |

### Modifié

| Élément | Changement |
|---|---|
| `10-composition-navigation.spec.mjs` | Marqué engineering ; CN-04 sans footer-nav legacy |
| `composition-runtime-identity.test.js` | Aligné — pas de footer-nav sur scénarios |
| `.github/workflows/ci-234.yml` | Steps nommés par famille ; gate produit explicite |
| `scripts/ci-234.sh` | Aligné validate-reader-v1 |
| `docs/PROJECT_STATE.md`, `docs/HANDOVER.md` | Référence architecture validation |

---

## 8. Maintenance

- Toute nouvelle exigence Reader doit être rattachée à **une** batterie autoritaire dans ce document.
- Toute suite smoke mode dev doit être justifiée dans §2.3 — sinon migrer vers mode produit.
- Les compteurs de tests dans `PROJECT_STATE.md` doivent refléter les commandes gate CI, pas les totaux spéculatifs.
- En cas de second chapitre complet : dupliquer la fixture, étendre les smokes produit — ne pas coder en dur 234 dans le Reader (déjà générique).
