#!/usr/bin/env bash
# Bundle the extension into a zip for Chrome Web Store upload.
# Usage: ./bundle.sh

set -euo pipefail

ROOT="$(cd "$(dirname "$0")" && pwd)"
VERSION=$(grep '"version"' "$ROOT/extension/manifest.json" | head -1 | sed 's/.*: *"\(.*\)".*/\1/')
BUILD="$ROOT/build"
OUT="$BUILD/no-prime-v${VERSION}.zip"

mkdir -p "$BUILD"
rm -f "$OUT"
cd "$ROOT/extension"
zip -r "$OUT" . -x '.*' '__MACOSX/*'

echo "✓ $OUT ($(du -h "$OUT" | cut -f1))"
