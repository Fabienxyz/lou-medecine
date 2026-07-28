# Jalon — Phase 3.4 : Clôture de la migration Pipeline Lou-Build

**Date :** 2026-07-28  
**Statut :** jalon historique — Phase 3 (Pipeline Migration) **close**  
**Périmètre :** `tools/lou-build/`  
**Tag proposé (non créé) :** `lou-build-pipeline-v1`

---

## 1. Objectif initial de la Phase 3

Porter Lou-Build d’une orchestration monolithique (`lib/package.js` + `cli.js`) vers :

1. un **Pipeline Engine v1** générique et figé ;
2. un **BuildContext** simple conteneur de données ;
3. **onze stages typés** A → K sous `src/stages/` ;
4. une **parité comportementale** avec des wrappers legacy conservés ;
5. une CLI typée (`src/cli/build.ts`) comme chemin par défaut.

La Phase 3 **ne** comprend **pas** la suppression du legacy (réservée à la Phase 3.5).

### Sous-phases

| Sous-phase | Contenu |
|---|---|
| **3.1** | Engine freeze + Stage A (Acquisition) |
| **3.2** | Stage B (Package Input) |
| **3.3** | Stages C → F (Inventory → Projections) |
| **3.4** | Stages G → K + audit + correctif F1 + clôture |

---

## 2. Pipeline Engine v1

**Statut : figé.**

| Composant | Rôle |
|---|---|
| `src/pipeline/runner.ts` | Orchestration, dépendances, parallélisme, fail-fast |
| `src/pipeline/validate-config.ts` | Cycles, deps inconnues, `parallelWith` symétrique/transitif |
| `src/pipeline/pipeline.ts` | Composition `FULL` / `CHAPTER` / `VALIDATE` / `BUILD` |
| `src/pipeline/stage.ts` | Contrats `Stage`, `StageId`, `StageResult` |

Responsabilités **exclusives** du moteur : orchestration, résolution des dépendances, exécution parallèle (F ∥ G), fail-fast, validation de configuration.

**Aucune logique métier chapitre** dans le moteur.

---

## 3. BuildContext

**Statut : stabilisé.**

Champs uniquement :

- `chapterDir`
- `command` (`validate` | `build`)
- `results` (`Map<StageId, StageResult>`)
- `mutate` (`true` en build)
- `workspace` (`Record<string, unknown>`)

Pas de méthodes métier. Conteneur de données conforme à l’architecture figée.

---

## 4. Migration A → K

Chaque stage dispose d’une implémentation typée et d’une référence legacy de parité :

| Stage | Typé | Legacy |
|---|---|---|
| A — Acquisition | `src/stages/acquisition.ts` | `lib/acquisition.js` |
| B — Package Input | `src/stages/package-input.ts` | `lib/package-input.js` |
| C — Inventory | `src/stages/inventory.ts` | `lib/inventory-stage.js` |
| D — Reconciliation | `src/stages/reconciliation.ts` | `lib/reconciliation.js` |
| E — Blueprint | `src/stages/blueprint.ts` | `lib/blueprint-stage.js` |
| F — Projections | `src/stages/projections.ts` | `lib/projections.js` |
| G — Visuals | `src/stages/visuals.ts` | `lib/visuals.js` |
| H — Grounding | `src/stages/grounding.ts` | `lib/grounding.js` |
| I — Validation | `src/stages/validation.ts` | `lib/validation.js` |
| J — Packaging | `src/stages/packaging.ts` | `lib/packaging-stage.js` |
| K — Publication | `src/stages/publication.ts` | `lib/publication.js` |

La logique métier partagée reste dans les modules `lib/` historiques (`claims.js`, `ground.js`, `svg.js`, helpers `package.js`, etc.).

---

## 5. Wrappers legacy

- Conservés comme **implémentations de référence** pour les tests de parité.
- `cli.js` + `npm run validate:legacy` / `build:legacy` toujours disponibles.
- **Non supprimés** — prérequis de la Phase 3.5.

---

## 6. Tests de parité

- Helpers : `test/stage-parity-helpers.ts`, `test/stage-seed-helpers.ts`
- Une suite `*-stage.test.ts` par stage A → K
- Tests moteur : `pipeline-runner.test.ts`, `pipeline-config.test.ts`
- Exécution TS séquentielle (`--test-concurrency=1`) pour éviter les courses sur fixtures live

**Résultat de validation Phase 3.4 :**

| Suite | Résultat |
|---|---|
| Typecheck | PASS |
| Legacy tests | 96 / 96 PASS |
| Pipeline + parity TS | 92 / 92 PASS |
| **Total** | **188 / 188 PASS** |

**Démonstration Item 234 :**

- `VALIDATE PASS`
- `BUILD PASS — manifest.json written`

---

## 7. Audit indépendant (avant clôture)

Verdict : **GO avec réserves**.

Findings principaux :

| ID | Gravité | Synthèse | Traitement |
|---|---|---|---|
| **F1** | Critique | Build typé n’invalidait le manifest qu’au Stage J → manifest stale possible après `BUILD FAIL` | **Corrigé** |
| **F2** | Majeur | Écritures G/H sous `mutate` avant verdict I (ordre différent du legacy) | **Reporté** Phase 3.5 |
| F3 | Majeur | Risque de faux positifs sur tests d’artefacts octet-identiques | Documenté ; isolation fixtures différée |
| F4 | Majeur (hygiène) | Livrable Phase 3 encore untracked | **Traité** par ce commit de clôture |
| F5–F8 | Mineurs | Commentaire VALIDATE, `dependsOn` A→B, slice `from`/`to`, fixtures live | Acceptés / Phase 3.5 |
| F9 | Suggestion | Ne pas supprimer `lib/` en bloc en 3.5 | Contrainte Phase 3.5 |

---

## 8. Finding F1 — détail et correction

### Problème

- Legacy `lib/package.js::runBuild` : `invalidatePublishableState(paths)` **au démarrage**.
- CLI typée : invalidation uniquement dans le Stage J (après PASS de I).
- Scénario confirmé empiriquement : échec bloquant avant J → `manifest.json` précédent **toujours présent**.

Violation de l’invariant doc 19 / contrat 04 §13.2.

### Correctif (minimal)

Fichier unique : `src/cli/build.ts`

```ts
if (command === "build") {
  invalidatePublishableState(chapterPaths(chapterDir));
}
```

avant `runPipeline(BUILD_PIPELINE, …)`.

Aucun changement du Pipeline Engine, du BuildContext, ni des stages.

### Preuve

Après correctif, même scénario d’échec → manifest absent (`f1Fixed: true`).  
Validate/build Item 234 verts après correctif.

---

## 9. Justification du report de F2

F2 concerne l’**ordre d’écriture** des sidecars/figures (G/H peuvent écrire sous `mutate` avant I), distinct de l’invalidation du manifest.

Le correctif F1 ne le résout pas naturellement. Le traiter exigerait de revoir le modèle `mutate` / stages — hors périmètre de clôture.

**Reporté explicitement à la Phase 3.5** (ou mission ciblée ultérieure).

---

## 10. État final des risques

| Risque | État |
|---|---|
| Manifest stale après build échoué (F1) | **Fermé** |
| Ordre d’écriture sidecars avant verdict (F2) | Ouvert — non bloquant pour clôture Phase 3 |
| Suppression naïve de `lib/` en 3.5 | Mitigé par consignes (wrappers seulement) |
| Fixtures live / isolation tests | Ouvert — non bloquant |
| Parité twin-copy ≠ oracle e2e legacy monolithique | Accepté ; legacy CLI conserve le filet |

---

## 11. État du pipeline (clôture)

| Stage | Statut |
|---|---|
| A — Acquisition | ✅ Migré |
| B — Package Input | ✅ Migré |
| C — Inventory | ✅ Migré |
| D — Reconciliation | ✅ Migré |
| E — Blueprint | ✅ Migré |
| F — Projections | ✅ Migré |
| G — Visuals | ✅ Migré |
| H — Grounding | ✅ Migré |
| I — Validation | ✅ Migré |
| J — Packaging | ✅ Migré |
| K — Publication | ✅ Migré |

Pipeline Engine v1 : **figé**.  
Migration métier : **complète**.  
Legacy : **conservé** pour Phase 3.5.

---

## 12. Phase suivante

**Phase 3.5 — Legacy Removal** (mission distincte)

- suppression progressive des **wrappers** de stage uniquement ;
- conservation des modules métier partagés sous `lib/` jusqu’à relocalisation ;
- ne pas supprimer `lib/` en bloc ;
- éventuellement traiter F2 ;
- conservation des tests métier ; retraite progressive des parity tests.

---

## Documents connexes

| Document | Rôle |
|---|---|
| [`19-BUILD-PIPELINE.md`](../renderer/19-BUILD-PIPELINE.md) | Spécification des étapes A–K |
| [`18-BUILD-ARCHITECTURE.md`](../renderer/18-BUILD-ARCHITECTURE.md) | Architecture de build |
| [`17-PUBLICATION-MODEL.md`](../renderer/17-PUBLICATION-MODEL.md) | Published / withheld |
| [`PROJECT_STATE.md`](../PROJECT_STATE.md) | État opérationnel courant |
