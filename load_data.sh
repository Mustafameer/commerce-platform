#!/bin/bash

# load_data.sh - Load database backup on Railway startup

DATABASE_URL="postgresql://postgres:yQOzKdveBhDOEKrDYHOFkkUptQQLmFBQ@postgres.railway.internal:5432/railway"

echo "🔍 Checking if database has data..."

# Check table count
TABLE_COUNT=$(PGPASSWORD="yQOzKdveBhDOEKrDYHOFkkUptQQLmFBQ" psql -h postgres.railway.internal -U postgres -d railway -t -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema='public';" 2>/dev/null || echo "0")

echo "📊 Tables found: $TABLE_COUNT"

if [ "$TABLE_COUNT" -gt 0 ]; then
  # Check if stores has data
  STORE_COUNT=$(PGPASSWORD="yQOzKdveBhDOEKrDYHOFkkUptQQLmFBQ" psql -h postgres.railway.internal -U postgres -d railway -t -c "SELECT COUNT(*) FROM stores;" 2>/dev/null || echo "0")
  echo "🏪 Stores found: $STORE_COUNT"
  
  if [ "$STORE_COUNT" -gt 0 ]; then
    echo "✅ Database already has data, skipping restore"
    exit 0
  fi
fi

echo "📂 Loading database backup..."

# Import the backup
if [ -f "database_backup.sql" ]; then
  PGPASSWORD="yQOzKdveBhDOEKrDYHOFkkUptQQLmFBQ" psql -h postgres.railway.internal -U postgres -d railway -f database_backup.sql 2>&1 | head -20
  echo "✅ Database backup loaded!"
else
  echo "⚠️  database_backup.sql not found"
fi
