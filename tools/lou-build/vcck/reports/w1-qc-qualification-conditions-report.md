# VCCK-P1/W1-QC — Rapport de clôture des conditions de qualification

## 1. Verdict d'entrée

| Champ | Valeur |
|-------|--------|
| Entrée | `INDEPENDENT_W1_PASS_WITH_CONDITIONS` |
| Commit audité | `d1f4329740fc43ad5fccf0e89066892020f88a7f` |
| Sortie | **`READY_FOR_VCCK_W1_QUALIFICATION_DECISION`** |

Les quatre familles restent **`EXPERIMENTAL`** — aucune `QUALIFIED`, aucune `FROZEN`.

## 2. Fermeture des trois conditions

| # | Condition | Statut |
|---|-----------|--------|
| 1 | `.gitignore` effectif (motifs relatifs à `vcck/`) | **PASS** |
| 2 | Négatif topologique authentique (`UNSUPPORTED_TOPOLOGY` strict) | **PASS** |
| 3 | Clipping nœuds SVG indépendant du plan | **PASS** |

## 3. Preuves `git check-ignore`

Motifs corrigés dans `tools/lou-build/vcck/.gitignore` — préfixe erroné `vcck/` retiré.

| Chemin | Attendu | Règle observée |
|--------|---------|----------------|
| `vcck/output/chain/chain-short/artifact.svg` | ignoré | `.gitignore:2:output/` |
| `vcck/gallery/index.html` | ignoré | `.gitignore:3:gallery/` |
| `vcck/reports/w1-candidate-hashes.json` | ignoré | `.gitignore:4:reports/w1-candidate-hashes.json` |
| `vcck/reports/qualification-matrix.md` | ignoré | `.gitignore:6:reports/qualification-matrix.md` |
| `vcck/reports/w1-stress-surfaces-report.json` | ignoré | `.gitignore:11:reports/w1-stress-surfaces-report.json` |
| `vcck/reports/w1-approved-png-hashes.json` | **non ignoré** | (exit 1) |
| `vcck/approvals/w1-perceptual-approval.json` | **non ignoré** | (exit 1) |
| `vcck/snapshots/render-hashes.json` | **non ignoré** | (exit 1) |

Vérification automatisée : `node scripts/vcck-w1-verify-gitignore.mjs` + `test/vcck-w1-gitignore.test.js`.

## 4. Quatre négatifs topologiques

Preuve via `evaluateTopoNegative()` — code issu exclusivement de `enforceFamilyContract`, pas de `gateBeforeRender` budgétaire.

| Famille | Fixture | Code contrat | Budget OK | Renderer bloqué | Résultat |
|---------|---------|--------------|-----------|-----------------|----------|
| chain | chain-topo-negative.yaml | `UNSUPPORTED_TOPOLOGY` | — | oui | PASS |
| dependent-sequence | dependent-sequence-topo-negative.yaml | `UNSUPPORTED_TOPOLOGY` | — | oui | PASS |
| two-pole | two-pole-topo-negative.yaml | `UNSUPPORTED_TOPOLOGY` | — | oui (validation) | PASS |
| flat-concurrent | flat-concurrent-topo-negative.yaml | `UNSUPPORTED_TOPOLOGY` | **oui** | oui (contract) | PASS |

**flat-concurrent-topo-negative** corrigé : un seul groupe, budgets dans l'enveloppe (`maxGroups: 1`, `maxItems: 3`), violation structurelle par **cardinalité incompatible** (`set.expected_cardinality: 5`, 3 items observés) — `reason: cardinality mismatch`, non confondue avec `BUDGET_EXCEEDED`.

Mutant budget : `chain-cardinal-plus1.yaml` évalué comme topo-negative → `FAIL` (`BUDGET_EXCEEDED`, non accepté).

## 5. Mutants clipping nœuds SVG

Validateur indépendant `validateW1ArtifactNodeClip` — sans consultation du `CompositionPlan`.

| Mutant | Diagnostic exact |
|--------|------------------|
| `node-bottom-out` | `artifact: node delivery extends below viewBox` |
| `node-right-out` | `artifact: node delivery extends right of viewBox` |
| `viewbox-halved` | contient `extends below viewBox` (multi-nœuds) |
| `node-nonpositive-box` | `artifact: node delivery has non-positive box dimensions` |
| `node-missing` | `artifact: zero observable nodes in serialized SVG` |

Nominal : `chain-short` et `dependent-sequence-short` → PASS. Contrôle titre indépendant conservé.

Liste autoritaire : `NODE_CLIP_MUTANT_IDS` (5 entrées).

## 6. Tests

```bash
cd tools/lou-build
node scripts/vcck-w1-verify-candidates.mjs   # exit 0
node scripts/vcck-verify-snapshots.mjs         # exit 0
node scripts/vcck-w1-verify-gitignore.mjs      # exit 0
node --test test/vcck-w1-*.test.js test/vcck-p0.test.js \
  test/vcck-pipeline.test.js test/vcck-signature.test.js \
  test/vcck-anti-specialization.test.js
```

| Métrique | Résultat |
|----------|----------|
| Tests Node | **215/215 PASS** |
| SKIP | **0** |
| Nouveaux tests QC | gitignore (2), topo-negative (7), node-clip (4) |

Preuves W1.6.1 héritées (non regénérées) : stress **20/20**, responsive **60/60** via `vcck-w1-responsive-blocking.test.js` et gate `stress-surfaces`.

## 7. Snapshots et PNG

| Preuve | Résultat |
|--------|----------|
| PNG approuvés | **40/40** inchangés — pas de `PENDING_CODEX_VISUAL_REAPPROVAL` |
| Snapshots artefact | **8/8 PASS** |
| Huit PNG approuvés | non modifiés |

## 8. Fichiers modifiés (W1-QC, non commités)

| Fichier | Rôle |
|---------|------|
| `vcck/.gitignore` | motifs relatifs corrigés |
| `lib/vcck/w1-budget-coverage.js` | `evaluateTopoNegative` strict |
| `lib/vcck/w1-validate-artifact.js` | clipping nœuds + mutants |
| `vcck/fixtures/w1/flat-concurrent/flat-concurrent-topo-negative.yaml` | violation structurelle authentique |
| `scripts/generate-vcck-w1-fixtures.mjs` | alignement générateur |
| `scripts/vcck-w1-verify-gitignore.mjs` | vérification read-only |
| `test/vcck-w1-gitignore.test.js` | régression gitignore |
| `test/vcck-w1-topo-negative.test.js` | topo-negative + mutant budget |
| `test/vcck-w1-artifact-node-clip.test.js` | mutants clipping nœuds |

## 9. État Git

```
HEAD = d1f4329740fc43ad5fccf0e89066892020f88a7f (inchangé)
Working tree = modifications W1-QC non commitées
Aucun commit, aucun push
```

## 10. Dettes hors périmètre

- **P0 global** : `VCCK_P0_BLOCKED` — isolé, hors clôture QC W1
- **identity** : hors W1
- **Promotion familiale** : aucune — décision Codex requise
- **Rapports régénérables** : toujours gitignorés, non versionnés

---

*Mission VCCK-P1/W1-QC — clôture conditions PASS indépendant.*
