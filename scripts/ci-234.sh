#!/usr/bin/env bash
# Local parity with .github/workflows/ci-234.yml — golden master Item 234 gate.
# On GitHub Actions, port 8765 is free. Locally, ensure nothing listens on 8765.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
export CI="${CI:-true}"

echo "==> lou-build validate — package 234"
(cd "$ROOT/tools/lou-build" && npm ci && npm run validate -- --chapter 01-learning/chapters/cardio/234)

echo "==> sync Reader fixture from package"
node "$ROOT/scripts/sync-reader-fixture.mjs"

echo "==> lou-build tests (gate — excludes test:integration)"
(cd "$ROOT/tools/lou-build" && npm run test:ci)

echo "==> Renderer unit tests"
(cd "$ROOT/demo/renderer" && npm ci && npm test)

echo "==> Renderer smoke tests (fixture cardio/234)"
(cd "$ROOT/demo/renderer" && npx playwright install chromium && npm run test:smoke)

echo "CI fixture 234 — PASS"
