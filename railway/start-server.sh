#!/bin/sh
# Boot the NestJS server once the in-container infrastructure reports ready.
# All defaults mirror infra.compose.yml for a zero-config test deployment;
# every value can be re-pointed via Railway variables (managed Postgres,
# Ollama Cloud, Serper, etc.). PORT/ADDRESS stay pinned so nginx owns the
# public port alone.
set -e

export PORT=3000
export ADDRESS=127.0.0.1
export POSTGRES_URL="${POSTGRES_URL:-postgres://triplef:triplef@localhost:5432/triplef?sslmode=disable}"
export BULLMQ_HOST="${BULLMQ_HOST:-localhost}"
export BULLMQ_PORT="${BULLMQ_PORT:-6379}"
export BULLMQ_USER="${BULLMQ_USER:-default}"
export BULLMQ_PASS="${BULLMQ_PASS:-redis}"
export MINIO_ENDPOINT="${MINIO_ENDPOINT:-localhost}"
export MINIO_PORT="${MINIO_PORT:-9000}"
export MINIO_USE_SSL="${MINIO_USE_SSL:-false}"
export MINIO_ACCESS_KEY="${MINIO_ACCESS_KEY:-minioadmin}"
export MINIO_SECRET_KEY="${MINIO_SECRET_KEY:-minioadmin}"
export MINIO_BUCKET="${MINIO_BUCKET:-failed-jobs}"
export BODY_LIMIT="${BODY_LIMIT:-104857600}"

wait_for_tcp() {
  until node -e "require('net').connect($2,'$1').on('connect',()=>process.exit(0)).on('error',()=>process.exit(1))" 2>/dev/null; do
    echo "waiting for $3 ..."
    sleep 1
  done
}

wait_for_tcp 127.0.0.1 5432 postgres
wait_for_tcp 127.0.0.1 6379 keydb
until curl -sf http://127.0.0.1:9000/minio/health/live >/dev/null 2>&1; do
  echo "waiting for minio ..."
  sleep 1
done

# Idempotent local database bootstrap. Skipped when POSTGRES_URL was
# re-pointed away from the in-container database.
if [ "$POSTGRES_URL" = "postgres://triplef:triplef@localhost:5432/triplef?sslmode=disable" ]; then
  su -s /bin/sh postgres -c "psql -tAc \"SELECT 1 FROM pg_roles WHERE rolname='triplef'\"" 2>/dev/null | grep -q 1 \
    || su -s /bin/sh postgres -c "psql -qAc \"CREATE ROLE triplef LOGIN SUPERUSER PASSWORD 'triplef'\"" || true
  su -s /bin/sh postgres -c "psql -tAc \"SELECT 1 FROM pg_database WHERE datname='triplef'\"" 2>/dev/null | grep -q 1 \
    || su -s /bin/sh postgres -c "createdb -O triplef triplef" || true
fi

# Schema sync via the server's own Prisma script. POSTGRES_URL is already
# exported above (and respected by dotenv-cli because dotenv doesn't
# override existing env vars). We pass the plain-ESM deploy config
# explicitly because the global prisma CLI in the runtime image cannot
# resolve the workspace's `prisma.config.ts` which imports `prisma/config`.
cd /app/server
pnpm db:push -- --config ./prisma.config.mjs

exec node dist/main
