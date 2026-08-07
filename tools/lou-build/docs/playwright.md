# Playwright (SVG viewport validation & PNG capture)

`tools/lou-build` uses Playwright locally for SVG viewport checks and PNG surface proofs — no external service.

Pedagogical visuals are materialized exclusively as **SVG**. Playwright wraps SVG in a minimal HTML shell only for browser measurement and capture (not a canonical artifact surface).

## Setup

```bash
cd tools/lou-build
npm install
npm run playwright:install   # only if Chromium is not already available
```

Chromium is **not** downloaded automatically by `npm install`. Run `playwright:install` once per machine/CI image when captures or viewport tests fail with « Executable doesn't exist ».

## Commands

| Command | Purpose |
|---|---|
| `npm run test:ci` | Full unit/integration suite including SVG viewport tests |
| `node scripts/vcck-update-snapshots.mjs` | Refresh W1 artifact hash snapshots after intentional renderer changes |

VCCK pipeline outputs live under `tools/lou-build/vcck/output/`.
