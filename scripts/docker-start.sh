#!/bin/sh
# Single-container entrypoint: push schema, then run the API (:8000) and the
# Next web app (:3000) together. The web app reverse-proxies /trpc, /api/auth,
# /submit, /docs, etc. to the API on localhost:8000 (single origin).
set -e

echo "☕ ChaiForm — applying database schema (drizzle push)…"
pnpm --filter @repo/database exec drizzle-kit push --force || echo "⚠️  schema push failed; continuing (DB may already be current)"

echo "🚀 starting API on :8000…"
PORT=8000 pnpm --filter @repo/api start &
API_PID=$!

# Give the API a moment so the web app's proxy + healthcheck succeed on boot.
sleep 2

echo "🌐 starting web on :3000…"
PORT=3000 pnpm --filter web start &
WEB_PID=$!

# If either process exits, tear the container down so Kamal restarts it.
wait -n 2>/dev/null || wait "$API_PID" "$WEB_PID"
echo "⚠️  a process exited — shutting down container."
kill "$API_PID" "$WEB_PID" 2>/dev/null || true
exit 1
