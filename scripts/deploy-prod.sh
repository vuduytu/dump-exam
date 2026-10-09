#!/usr/bin/env bash
# Deploy to production: migrate + seed TiDB first, then push main (Vercel builds on push).
# Order matters: new code needs the new schema; migrations are additive so old code keeps working.
set -euo pipefail
cd "$(dirname "$0")/.."

[ "$(git branch --show-current)" = main ] || { echo "Not on main"; exit 1; }
[ -z "$(git status --porcelain)" ] || { echo "Working tree not clean"; exit 1; }
[ -f .env.prod ] || { echo "Missing .env.prod"; exit 1; }

set -a; source .env.prod; set +a

echo "==> db:migrate"; npm run db:migrate
echo "==> db:seed";    npm run db:seed
echo "==> git push";   git push origin main
echo "Done. Vercel is building; check the deployment in ~3 minutes."
