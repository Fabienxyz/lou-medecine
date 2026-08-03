#!/usr/bin/env bash
# Validation Reader V1 — gate locale alignée sur docs/testing/TEST_ARCHITECTURE_V1.md
# Exécute les batteries autoritaires pour prononcer un jalon Reader.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
export CI="${CI:-true}"

echo "==> [Fabrique] lou-build validate — package 234"
(cd "$ROOT/tools/lou-build" && npm ci && npm run validate -- --chapter 01-learning/chapters/cardio/234)

echo "==> [Fabrique] sync Reader fixture from package"
node "$ROOT/scripts/sync-reader-fixture.mjs"

echo "==> [Fabrique] lou-build tests (gate — excludes test:integration)"
(cd "$ROOT/tools/lou-build" && npm run test:ci)

echo "==> [Contrats + Reader technique] Renderer unit tests"
(cd "$ROOT/demo/renderer" && npm ci && npm test)

echo "==> [Reader Produit] smoke tests — product mode (authoritative)"
(cd "$ROOT/demo/renderer" && npx playwright install chromium && npm run test:smoke:product)

echo "==> [Reader technique] smoke tests — engineering mode (informative)"
(cd "$ROOT/demo/renderer" && npm run test:smoke:engineering)

echo ""
echo "Validation Reader V1 — PASS"
echo "Product Review manuelle (si requise) : ./scripts/product-review-234.sh"
