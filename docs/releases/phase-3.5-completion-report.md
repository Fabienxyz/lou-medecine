# Jalon — Phase 3.5 : Clôture Production Cutover Lou-Build

**Date :** 2026-07-28  
**Statut :** jalon historique — Phase 3.5 (Legacy Removal / Production Cutover) **close**  
**Périmètre :** `tools/lou-build/` — cutover pipeline uniquement  
**Commits :** `ca5782c` (Lot 1) · `575fc51` (Lot 2) · `bb711c7` (Lot 3)

---

## 1. Objectifs de la Phase 3.5

Retirer le filet legacy conservé volontairement à la clôture de la Phase 3 et basculer **définitivement** sur le pipeline typé comme unique chemin de production, sans modifier l'architecture gelée ni le Pipeline Engine v1.

**Hors périmètre (chantiers distincts) :** Renderer fallback, `generated-assets/`, prototypes `demo/legacy/`, reliquats FIL A, migration SVG V1→V2.

---

## 2. Travaux réalisés

| Domaine | Action |
|---|---|
| Wrappers de stage | Suppression des 11 modules `lib/*-stage.js` (référence legacy A→K) |
| Infra de parité | Suppression des tests dual-runner et helpers associés |
| CLI legacy | Suppression de `cli.js` et des scripts `validate:legacy` / `build:legacy` |
| Orchestration monolithique | Suppression de `runValidation` / `runBuild` dans `lib/package.js` |
| Tests e2e chapitre | Migration de `slice.test.js` → `slice.test.ts` sur le runner typé |
| Modules métier partagés | **Conservés** sous `lib/` (anchors, blueprint, claims, ground, inventory, paths, reconcile, chapter-config, svg, etc.) |
| Helpers manifest | **Conservés** : `assembleManifest`, `invalidatePublishableState` |

---

## 3. Lots exécutés

### Lot 1 — Wrappers et parité (`ca5782c`)

- 11 wrappers de stage supprimés
- 13 fichiers test/helpers de parité supprimés
- Script `npm test` ajusté (retrait des tests parité)

### Lot 2 — Cutover CLI (`575fc51`)

- `tools/lou-build/cli.js` supprimé
- Scripts npm `validate:legacy` / `build:legacy` retirés

### Lot 3 — Orchestration monolithique (`bb711c7`)

- `runValidation` / `runBuild` et code mort associé retirés de `lib/package.js`
- `slice.test.ts` : exécution via `createContext` + `runPipeline` (`VALIDATE_PIPELINE` / `BUILD_PIPELINE`)

Chaque lot a été validé indépendamment : `typecheck`, `npm test`, `validate` (234, 330), `build` (234).

---

## 4. Validations finales

| Commande | Résultat |
|---|---|
| `npm run typecheck` | PASS |
| `npm test` | **117/117 PASS** (78 JS + 39 TS) |
| `npm run validate -- --chapter …/234` | PASS |
| `npm run validate -- --chapter …/330` | PASS |
| `npm run build -- --chapter …/234` | PASS — `manifest.json` écrit |
| Parité manifest 234 | Champs fonctionnels identiques au build pré-cutover (projections, visuals, invariants slice) |

---

## 5. État final du pipeline

**Point d'entrée unique :**

```bash
cd tools/lou-build
npm run validate -- --chapter <path>
npm run build    -- --chapter <path>
```

→ `tsx src/cli/build.ts` → Pipeline Engine v1 → stages typés A→K.

**Composition :**

| Pipeline | Stages | Usage |
|---|---|---|
| `VALIDATE_PIPELINE` | B→I | Lecture seule, pas d'écriture manifest |
| `BUILD_PIPELINE` | B→K | Fabrication complète + packaging + publication |

**`lib/package.js` (résidu métier) :** uniquement `assembleManifest` et `invalidatePublishableState` — plus d'orchestration monolithique.

---

## 6. Architecture obtenue

```
Tool 01 / Tool 02 (amont, gelés ADR-004)
        ↓
src/cli/build.ts
        ↓
Pipeline Engine v1 (src/pipeline/) — GELÉ
        ↓
Stages typés A→K (src/stages/) — GELÉS
        ↓
Modules métier lib/*.js — bibliothèques internes partagées
        ↓
manifest.json + sidecars (chapters/<specialty>/<item>/)
```

La migration A→K est **achevée**. Il n'existe plus de chemin parallèle legacy dans lou-build.

---

## 7. Risques reportés (hors clôture)

| Risque | Statut |
|---|---|
| F2 — ordre écriture sidecars G/H vs verdict I | Ouvert — chantier ciblé si nécessaire |
| SVG V1 (`lib/svg.js`) en production Stage G | Actif — branchement V2 = chantier distinct |
| Scale-out 22 chapitres | Actif — voir [`industrialization-plan.md`](../acquisition/industrialization-plan.md) |

---

## 8. Conclusion

**La Fabrique est terminée.**

Les phases Fondations (0), Le Lecteur — Architecture (1), La Fabrique — Architecture (2), l'implémentation lou-build (3) et le production cutover (3.5) constituent un socle de build **stable, typé et unique**.

La prochaine priorité produit est **Le Lecteur** (production / expérience apprenant), conformément à [`MASTER_ROADMAP.md`](../MASTER_ROADMAP.md).
