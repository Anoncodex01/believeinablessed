#!/usr/bin/env bash
# Deploy BelieveinaBlessed on the production server.
# Usage (on server): cd /root/believeinablessed && ./deploy/deploy.sh

set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

git pull origin main

docker compose up -d --build

# Update nginx upload limit without wiping SSL (do not overwrite full site config if certbot managed it)
if grep -q 'client_max_body_size' /etc/nginx/sites-enabled/believeinablessed 2>/dev/null; then
  sed -i 's/client_max_body_size .*/client_max_body_size 50m;/' /etc/nginx/sites-enabled/believeinablessed
else
  sed -i '/server_name believeinablessed.com/a\    client_max_body_size 50m;' /etc/nginx/sites-enabled/believeinablessed
fi

nginx -t
systemctl reload nginx

# Re-apply SSL if port 443 is not listening (e.g. config was replaced with HTTP-only)
if ! ss -tlnp | grep -q ':443'; then
  certbot --nginx -d www.believeinablessed.com -d believeinablessed.com --non-interactive --redirect
  nginx -t && systemctl reload nginx
fi

docker compose ps
