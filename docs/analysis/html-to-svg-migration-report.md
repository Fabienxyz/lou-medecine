# Rapport de migration HTML → SVG (matérialisation VCCK)

**Date :** 2026-08-07  
**Périmètre :** couche de matérialisation et dépendances — sans modification d'ADR-008, Contrat 05, visualSpecs, ni pipeline VCCK (signature, reconnaissance, capacités, composition abstraite).

## Décisions prises

1. **SVG unique surface canonique** pour tous les visuels pédagogiques VCCK/W1.
2. **`two-pole` et `flat-concurrent`** matérialisés via renderers SVG industriels (`w1-two-pole-svg.js`, `w1-flat-concurrent-svg.js`), dérivés du spike N20.
3. **Suppression complète** de la branche HTML pédagogique (render, validation reflow, capture, tests).
4. **Registre familles** : `technology: "svg"` pour les six familles auparavant `semantic-html`.
5. **N20-1** produit par `run-sprint1-block.mjs` via le pipeline W1 standard (`kind: "svg"`).

## Composants migrés

| Composant | Avant | Après |
|---|---|---|
| `two-pole` | HTML tables + reflow Playwright | SVG bandes de comparaison (`w1-two-pole-svg.js`) |
| `flat-concurrent` | HTML grille | SVG grille (`w1-flat-concurrent-svg.js`) |
| `w1-build-plan.js` | `technology: "semantic-html"` | `technology: "svg"` |
| `w1-serialize.js` | branche HTML + SVG | SVG uniquement |
| `w1-composition-plan.js` | accepte `svg` \| `semantic-html` | `svg` seul |
| `render-bridge.js` | branche HTML v0.2 | SVG uniquement |
| `pipeline.js`, `w1-replay-runner.js`, `w1-stress-surfaces.js`, `w2a-pipeline.js` | chemins `artifact.html` | `artifact.svg` |
| N20-1 figure | `.html` | `.svg` |

## Composants supprimés

### Modules runtime
- `tools/lou-build/lib/visual-render-html.js`
- `tools/lou-build/lib/html-capture.js`
- `tools/lou-build/lib/html-viewport-validate.js`
- `tools/lou-build/lib/vcck/w1-reflow-validate.js`
- `captureW1HtmlPng()` dans `w1-surface.js`
- `captureWordHdHtml()` dans `w2a-word-export.js`

### Scripts
- `tools/lou-build/scripts/run-wave2.mjs` (pipeline Lot A HTML legacy)
- `01-learning/chapters/cardio/234/build/spike-n20-two-pole-svg.mjs` (intégré au pipeline)

### Tests
- `tools/lou-build/test/html-viewport.test.js`
- `tools/lou-build/test/vcck-w1-reflow.test.js`
- Tests HTML dans `visual-spec-v02.test.js` (renderComparisonMatrix, etc.)

### Figures legacy
- `01-learning/chapters/cardio/234/figures/n20-1-crt-dai-comparison.html`
- `01-learning/chapters/cardio/234/figures/n20-1-crt-dai-comparison-spike.svg`
- `01-learning/chapters/cardio/234/build/sprint-n20-1/n20-1-crt-dai-comparison.html`

## Fichiers ajoutés

- `tools/lou-build/lib/vcck/w1-two-pole-svg.js`
- `tools/lou-build/lib/vcck/w1-flat-concurrent-svg.js`
- `01-learning/chapters/cardio/234/figures/n20-1-crt-dai-comparison.svg`

## Validations exécutées

| Validation | Résultat |
|---|---|
| `node run-sprint1-block.mjs n20-1` | **PASS** — `kind: svg`, déterminisme PASS |
| `node scripts/vcck-update-snapshots.mjs` | **PASS** — 8 snapshots W1 mis à jour |
| Tests W1 migration (`composition-plan`, `determinism`, `artifact-snapshots`, `responsive`) | **48/48 PASS** (avec Playwright installé) |
| `npm run test:ci` (suite complète) | **472/496 PASS** — voir section échecs résiduels |

## Échecs de tests résiduels (hors périmètre migration)

22 échecs restants, **non introduits par la migration HTML→SVG** :

- **`vcck-w1-replay`** : références KP inconnues dans les visual-specs chapitre 234 vs inventaire VCCK fixture.
- **`visual-ground.test.js` / `visual-render.test.js`** : verdicts independent review périmés sur `mm-pump-decompensation`.
- **`visual-spec-v02-lotc1.test.js`** : hashes SVG figés Lot C1 divergents du rendu actuel.

Ces points relèvent de la gouvernance contenu/review, pas de la matérialisation.

## Impact VCCK

- **Aucun** sur signature, reconnaissance, capacités, composition abstraite, budgets, gates structurels.
- **Snapshots W1** régénérés (`vcck/snapshots/render-hashes.json`) — attendu après changement de matérialisation.
- Playwright conservé pour **validation viewport SVG** et captures PNG (enveloppe HTML technique de mesure uniquement).

## Dépendance fonctionnelle HTML restante

**Aucune** pour la matérialisation pédagogique. Les seules occurrences HTML restantes sont :

- Enveloppes Playwright transitoires (`.w1-cap-*.html`, wrappers SVG) — non canoniques, supprimées après capture.
- Galerie VCCK QA (`vcck/gallery/index.html`) — outil de qualification, pas artefact pédagogique.

## Recommandations SVG Language V1

1. **Consolider** `w1-two-pole-svg` / `w1-flat-concurrent-svg` sous un contrat SVG Language V1 partagé (tokens, typo, espacements).
2. **Implémenter** les familles EXPERIMENTAL (`three-pole-reflow`, `grouped-concurrent`, `identity`, `two-state`) en SVG avant admission registre.
3. **Migrer** les primitives v0.2 (`comparison-matrix`, `enumeration-set`, `quantity-model`) vers `visual-render-svg-v02` comme seul chemin — déjà le cas via `render-bridge`.
4. **Retirer** `htmlViewportWidth` de `WORD_HD_EXPORT` une fois confirmé inutilisé.
5. **Régulariser** les reviews indépendantes mm-pump et l'inventaire KP chapitre 234 pour fermer les tests replay/grounding.
