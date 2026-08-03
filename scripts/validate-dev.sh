#!/usr/bin/env bash
# DEV gate — développement courant Reader (docs/testing/TEST_ARCHITECTURE_V1.md §2.4)
# Ne prononce pas une PAS — feedback rapide moteur + mode dev.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
export CI="${CI:-true}"

echo "==> [DEV] Renderer unit tests"
(cd "$ROOT/demo/renderer" && npm ci && npm test)

echo "==> [DEV] Engineering smoke tests (mode dev — informatif)"
(cd "$ROOT/demo/renderer" && npx playwright install chromium && npm run test:smoke:engineering)

echo ""
echo "DEV gate — PASS"
echo "Pour prononcer une PAS : voir docs/testing/TEST_ARCHITECTURE_V1.md §6"
echo "Gate publication (RELEASE) : ./scripts/validate-reader-v1.sh"
