#!/usr/bin/env bash
# Product Review — package 234 (Item Insuffisance cardiaque)
# Starts the dev library server with package 234 installed for product mode.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
PORT="${LOU_LIBRARY_SERVER_PORT:-8765}"

echo "==> lou-build validate — package 234"
(cd "$ROOT/tools/lou-build" && npm run validate -- --chapter 01-learning/chapters/cardio/234)

echo "==> Renderer dependencies"
(cd "$ROOT/demo/renderer" && npm ci)

echo ""
echo "Product Review — URLs (server on port ${PORT}):"
echo ""
echo "  Mode développement (CHAPTERS_ROOT direct):"
echo "    http://127.0.0.1:${PORT}/demo/renderer/index.html?chapter=cardio/234"
echo ""
echo "  Mode produit (bibliothèque installée, offline, recherche locale):"
echo "    http://127.0.0.1:${PORT}/demo/renderer/index.html?chapter=cardio/234&product=1"
echo ""
echo "  Ctrl+C pour arrêter le serveur."
echo ""

cd "$ROOT/demo/renderer"
exec node test/library-server.mjs
