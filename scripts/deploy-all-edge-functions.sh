#!/usr/bin/env bash
# Deploy every edge function under supabase/functions/ (except _shared).
set -euo pipefail

PROJECT_REF="${SUPABASE_PROJECT_REF:-axsudmhjpfzffcicfvuj}"

if [ -z "${SUPABASE_ACCESS_TOKEN:-}" ]; then
  echo "ERROR: Set SUPABASE_ACCESS_TOKEN before running."
  echo "  export SUPABASE_ACCESS_TOKEN=sbp_..."
  exit 1
fi

cd "$(dirname "$0")/.."

for dir in supabase/functions/*/; do
  name="$(basename "$dir")"
  if [ "$name" = "_shared" ]; then
    continue
  fi
  echo "==> Deploying $name"
  npx supabase functions deploy "$name" --project-ref "$PROJECT_REF"
done

echo "All edge functions deployed."
