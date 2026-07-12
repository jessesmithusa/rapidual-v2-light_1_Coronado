#!/usr/bin/env bash
# Build an EAS development client for one app. Runs against YOUR Expo account.
#   APP=consumer|driver  PLATFORM=ios|android  MAPBOX_DOWNLOAD_TOKEN=sk.xxx  ./scripts/build-dev.sh
set -euo pipefail

APP="${APP:-consumer}"
PLATFORM="${PLATFORM:-ios}"

need() { command -v "$1" >/dev/null 2>&1 || { echo "✗ '$1' not found. Run: npm i -g eas-cli"; exit 1; }; }
need eas

[ -d "apps/$APP" ] || { echo "✗ apps/$APP does not exist (use APP=consumer or APP=driver)."; exit 1; }
eas whoami >/dev/null 2>&1 || { echo "✗ Not logged in. Run: eas login"; exit 1; }

cd "apps/$APP"

# Ensure an EAS project exists (init is a no-op once the real projectId is set).
if grep -q '0000-0000-0000-0000' app.config.ts 2>/dev/null; then
  echo "→ No EAS project yet — running eas init for $APP"
  eas init
fi

if [ -n "${MAPBOX_DOWNLOAD_TOKEN:-}" ]; then
  echo "→ Registering MAPBOX_DOWNLOAD_TOKEN as a build secret"
  eas env:create --name MAPBOX_DOWNLOAD_TOKEN --value "$MAPBOX_DOWNLOAD_TOKEN" --visibility secret --non-interactive || true
fi

echo "→ Building development client ($APP / $PLATFORM)"
eas build --profile development --platform "$PLATFORM"

echo "✓ Build submitted. When it finishes, install it, then: npx expo start --dev-client"
