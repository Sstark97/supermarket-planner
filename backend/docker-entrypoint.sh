#!/usr/bin/env bash

set -euo pipefail

DB_HOST="${DB_HOST:-database}"
DB_PORT="${DB_PORT:-5432}"
DB_USER="${POSTGRES_USER:-postgres}"

echo "[backend] Waiting for PostgreSQL at ${DB_HOST}:${DB_PORT}..."
until pg_isready -h "${DB_HOST}" -p "${DB_PORT}" -U "${DB_USER}" >/dev/null 2>&1; do
	sleep 1
done

echo "[backend] PostgreSQL is ready. Running prisma migrate deploy..."
if pnpm prisma migrate deploy; then
	echo "[backend] Migrations applied."
else
	echo "[backend] prisma migrate deploy failed (likely non-empty schema). Falling back to prisma db push..."
	pnpm prisma db push
fi

echo "[backend] Starting API..."
exec node dist/index.js
