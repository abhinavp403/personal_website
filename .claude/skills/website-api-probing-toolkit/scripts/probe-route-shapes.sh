#!/usr/bin/env bash
# probe-route-shapes.sh
#
# Before/after tool for upgrades: hits every local API route and prints the
# top-level keys of each JSON response. Run once before a dependency/route
# change, once after, and diff the output — any key that appears/disappears
# is a contract change consumers will feel.
#
# Requires: a running dev server (npm run dev → localhost:3000) and jq.
#   Usage: bash scripts/probe-route-shapes.sh [base_url]   (default http://localhost:3000)
#
# Route list snapshot 2026-07-06 — source of truth is src/app/api/*/route.ts.
# NOTE: /api/spotify and /api/cricket need keys from .env.local to return
# real data; without keys they still return JSON (empty/fallback shape),
# which is itself worth recording.

set -u
BASE="${1:-http://localhost:3000}"
ROUTES=(atp-schedule cricket fact games spotify tennis wordofday)

if ! curl -sf -o /dev/null --max-time 5 "$BASE" ; then
  echo "ERROR: no server reachable at $BASE — start it with: npm run dev" >&2
  exit 1
fi

echo "# Route shape probe — $BASE — $(date +%Y-%m-%d)"
for r in "${ROUTES[@]}"; do
  body=$(curl -s --max-time 30 "$BASE/api/$r")
  keys=$(printf '%s' "$body" | jq -c 'keys' 2>/dev/null) \
    || keys="NOT-JSON (first 80 chars: $(printf '%s' "$body" | head -c 80))"
  printf '/api/%-14s -> %s\n' "$r" "$keys"
done
