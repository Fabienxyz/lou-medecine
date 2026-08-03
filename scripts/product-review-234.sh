#!/usr/bin/env bash
# Product Review — Reference Product Chapter 234 (Phase 0.1-A)
#
# Canonical procedure to observe the published package in the Reader.
# Dev mode (CHAPTERS_ROOT direct) is NOT Product Review — use only for Reader engineering.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
PORT="${LOU_LIBRARY_SERVER_PORT:-8765}"
CHAPTER="${LOU_PRODUCT_REVIEW_CHAPTER:-01-learning/chapters/cardio/234}"
LIBRARY_ROOT="${LOU_LIBRARY_ROOT:-$ROOT/.local/product-review-library}"
SLUG="${LOU_PRODUCT_REVIEW_SLUG:-cardio/234-insuffisance-cardiaque}"

echo "==> Product Review — Phase 0.1 canonical path"
echo "    chapter:  ${CHAPTER}"
echo "    library:  ${LIBRARY_ROOT} (gitignored — browser writes allowed)"
echo ""

echo "==> lou-build validate"
(cd "$ROOT/tools/lou-build" && npm run validate -- --chapter "$CHAPTER")

echo "==> lou-build build"
(cd "$ROOT/tools/lou-build" && npm run build -- --chapter "$CHAPTER")

echo "==> install package into Product Review library"
node "$ROOT/scripts/sync-reader-fixture.mjs" --chapter "$CHAPTER" --library "$LIBRARY_ROOT"

echo "==> Renderer dependencies"
(cd "$ROOT/demo/renderer" && npm ci)

OFFICIAL_URL="http://127.0.0.1:${PORT}/demo/renderer/index.html?chapter=${SLUG}&product=1"

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  PRODUCT REVIEW — URL officielle (seule entrée valide)"
echo ""
echo "  ${OFFICIAL_URL}"
echo ""
echo "  Mode: product (bibliothèque installée + offline + auto-repair digest)"
echo "  Ctrl+C pour arrêter le serveur."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "  Note: le mode développement (?chapter=… sans &product=1) sert au"
echo "  travail Reader uniquement — ce n'est PAS une Product Review."
echo ""

export LOU_LIBRARY_ROOT="$LIBRARY_ROOT"
cd "$ROOT/demo/renderer"
exec node test/library-server.mjs
