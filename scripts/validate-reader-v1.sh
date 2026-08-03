#!/usr/bin/env bash
# RELEASE gate — validation complète package 234 (docs/testing/TEST_ARCHITECTURE_V1.md §2.4)
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
export CI="${CI:-true}"

echo "==> [Fondation] Lou Build validate — package 234"
(cd "$ROOT/tools/lou-build" && npm ci && npm run validate -- --chapter 01-learning/chapters/cardio/234)

echo "==> [Fondation] Sync Reader fixture from package"
node "$ROOT/scripts/sync-reader-fixture.mjs"

echo "==> [Contrats] Lou Build tests (gate — excludes test:integration)"
(cd "$ROOT/tools/lou-build" && npm run test:ci)

echo "==> [Fondation] Renderer unit tests"
(cd "$ROOT/demo/renderer" && npm ci && npm test)

echo "==> [PAS] Product smoke tests — all implemented PAS (authoritative)"
(cd "$ROOT/demo/renderer" && \
  if [ "${CI:-}" = "true" ]; then npx playwright install chromium --with-deps; else npx playwright install chromium; fi && \
  npm run test:smoke:product)

echo "==> [DEV] Engineering smoke tests (non-regression dev path)"
(cd "$ROOT/demo/renderer" && npm run test:smoke:engineering)

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  RELEASE gate — PASS"
echo ""
echo "  PAS vertes (Product Smokes) :"
echo "    PAS-OFFLINE      — couverture forte"
echo "    PAS-SHELL        — couverture partielle (S1)"
echo "    PAS-MM           — couverture partielle"
echo "    PAS-AP           — couverture forte (Reader)"
echo "    PAS-NOTIONS      — couverture partielle"
echo "    PAS-CLINICAL     — couverture partielle"
echo "    PAS-COLLEGE      — couverture partielle"
echo "    PAS-QCM          — couverture partielle"
echo "    PAS-NOTES        — couverture partielle"
echo "    PAS-LIBRARY      — non couverte (réservée)"
echo ""
echo "  Product Review (humain) : ./scripts/product-review-234.sh"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
