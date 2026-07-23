#!/bin/sh
# Exit immediately if a command exits with a non-zero status
set -e

echo "=== STARTING DATABASE BOOTSTRAP ==="

echo "Waiting for PostgreSQL to be ready..."
until pg_isready -h db -U postgres; do
  echo "PostgreSQL is unavailable - sleeping..."
  sleep 2
done

echo "PostgreSQL is up! Waiting for GoTrue migrations to create the 'auth' schema and 'users' table..."
until PGPASSWORD=postgres psql -h db -U postgres -d postgres -c "SELECT 1 FROM auth.users LIMIT 1;" >/dev/null 2>&1; do
  echo "auth.users table does not exist yet (GoTrue is initializing) - sleeping..."
  sleep 2
done

echo "GoTrue migrations complete. auth.users table is ready!"
echo "Applying custom VoxAgent schema (schema.sql)..."

PGPASSWORD=postgres psql -h db -U postgres -d postgres -f /supabase/schema.sql

echo "VoxAgent schema applied successfully!"
echo "=== BOOTSTRAP COMPLETE ==="
