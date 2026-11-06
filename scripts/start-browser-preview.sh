#!/usr/bin/env bash
set -euo pipefail

# Run inside the Codespace, never on the visitor's computer.
export NODE_ENV=development
if [[ -n "${HTTPS_PROXY:-}${HTTP_PROXY:-}${https_proxy:-}${http_proxy:-}" ]]; then
  export NODE_USE_ENV_PROXY=1
fi
export BETTER_AUTH_URL="$(node scripts/preview-origin.mjs)"
if curl --fail --silent --max-time 5 http://127.0.0.1:3000/ > /dev/null; then
  echo "Port 3000 is already running. Open the Lumen entry in the Ports tab."
  exit 0
fi

umask 077
mkdir -p .data
nohup setsid --fork npm run dev -- --port 3000 > .data/browser-preview.log 2>&1 < /dev/null &
echo "Lumen is starting at ${BETTER_AUTH_URL}"
echo "Open port 3000 in the Ports tab if a browser tab does not open automatically."
echo "Startup log: .data/browser-preview.log"

for attempt in {1..40}; do
  if curl --fail --silent --max-time 1 http://127.0.0.1:3000/ > /dev/null; then
    echo "Lumen is ready."
    exit 0
  fi
  sleep 0.5
done
echo "Lumen did not become ready. Check .data/browser-preview.log." >&2
exit 1
