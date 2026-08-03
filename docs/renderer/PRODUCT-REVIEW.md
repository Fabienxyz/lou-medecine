# Product Review — Reference Product Chapter 234

**Phase 0.1-A** — procédure canonique pour observer le package publié dans le Reader.

## Principe

La Product Review n'est **pas** le mode développement (`?chapter=…` sans `product=1`).  
Elle consomme la **bibliothèque installée** — même chemin que la CI smoke en mode produit — avec :

- `release_id` stable pendant la construction éditoriale ;
- `content_digest` comme vérité matérielle du contenu ;
- **auto-repair** au bootstrap si le digest ou le runtime diverge (Phase 0.1-B).

## Lancement officiel (seule entrée valide)

```bash
./scripts/product-review-234.sh
```

Le script enchaîne : `validate` → `build` → installation bibliothèque → serveur local.

**URL affichée** (unique) :

```
http://127.0.0.1:8765/demo/renderer/index.html?chapter=cardio/234-insuffisance-cardiaque&product=1
```

La bibliothèque d'exécution est `.local/product-review-library/` (gitignored) — le navigateur peut y écrire (`offline_status`) sans salir la fixture de non-régression.

## Modes — hiérarchie

| Mode | URL | Usage |
|---|---|---|
| **Product Review** (officiel) | `…&product=1` via script ci-dessus | Vérifier le produit publié après build |
| Développement Reader | `?chapter=cardio/234` (sans `product=1`) | Ingénierie Reader / CHAPTERS_ROOT direct |
| Fixture CI | `npm run test:smoke` | Non-régression automatisée (fixture versionnée) |

## Republication (même `release_id`, nouveau digest)

1. Modifier le package et exécuter `lou-build build`.
2. Relancer `./scripts/product-review-234.sh` (réinstalle si digest changé).
3. Ouvrir l'URL officielle — le Reader détecte la divergence et appelle `repair()` automatiquement.

Aucun vidage manuel de cache. Aucun changement de `release_id`.

## Diagnostics (Phase 0.1-C)

En cas d'échec bootstrap, le message affiche un code explicite (`DIGEST_DIVERGENT`, `ASSET_MISSING`, …) — plus de « Erreur réseau » générique pour les erreurs produit.

## Références

- [`demo/renderer/product-bootstrap.mjs`](../../demo/renderer/product-bootstrap.mjs)
- [`demo/renderer/library/browser-offline-manager.js`](../../demo/renderer/library/browser-offline-manager.js) — `ensureReleaseReady()`
- [`scripts/sync-reader-fixture.mjs`](../../scripts/sync-reader-fixture.mjs)
- Audit : [`docs/analysis/reader-fabrique-chain-architecture-audit.md`](../analysis/reader-fabrique-chain-architecture-audit.md)
