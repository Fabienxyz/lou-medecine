#!/usr/bin/env bash
# Local parity with .github/workflows/ci-234.yml — see docs/testing/TEST_ARCHITECTURE_V1.md
set -euo pipefail

exec "$(cd "$(dirname "$0")" && pwd)/validate-reader-v1.sh"
