#!/bin/sh
# All-in-one Railway entrypoint: prepare data dirs, render the nginx
# config, then hand the process tree to supervisord.
#
# Railway healthchecks use the PORT env variable to decide which port to probe.
# We default nginx to 80 so it doesn't collide with the Nest server (3000).
# If you override PORT in Railway, also set NGINX_PORT to match, or leave
# PORT=80 in railway.toml so the public entrypoint stays on 80.
set -e

mkdir -p /data/keydb /data/minio

NGINX_PORT="${NGINX_PORT:-80}" envsubst '${NGINX_PORT}' \
  < /etc/nginx/templates/app.conf.template \
  > /etc/nginx/conf.d/app.conf

exec /usr/bin/supervisord -c /etc/supervisor/conf.d/stack.conf
