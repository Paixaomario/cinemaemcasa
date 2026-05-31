#!/usr/bin/env python3
import json
import subprocess
from pathlib import Path

# Read migration SQL
migration_path = Path('supabase/migrations/018_search_analytics.sql')
with open(migration_path) as f:
    sql = f.read()

# Split by semicolon and filter empty
queries = [q.strip() for q in sql.split(';') if q.strip()]

print(f"📊 Found {len(queries)} SQL statements to execute")
print(f"✅ Migration file: {migration_path}")
print(f"✅ Supabase URL: https://ebbuobnltsrvqxayrulk.supabase.co")
print("\n💡 Next steps:")
print("1. Go to https://app.supabase.com/project/ebbuobnltsrvqxayrulk/sql/new")
print("2. Paste the SQL from supabase/migrations/018_search_analytics.sql")
print("3. Execute all statements")
print("4. Verify with: SELECT COUNT(*) FROM search_analytics;")
