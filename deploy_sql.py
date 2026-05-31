#!/usr/bin/env python3
"""Deploy SQL migration to Supabase"""

import subprocess
import sys

# Read the SQL migration file
with open('supabase/migrations/018_search_analytics.sql', 'r') as f:
    sql_queries = f.read().split(';')

# Filter empty queries
sql_queries = [q.strip() for q in sql_queries if q.strip()]

# Use supabase CLI to push migrations
print("📊 Deploying search analytics migration...")
result = subprocess.run(
    ['supabase', 'db', 'push', '--include-all-migrations'],
    env={
        'SUPABASE_URL': 'https://ebbuobnltsrvqxayrulk.supabase.co',
        'SUPABASE_SERVICE_ROLE_KEY': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImViYnVvYm5sdHNydnF4YXlydWxrIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3ODMwMjQ2NCwiZXhwIjoyMDkzODc4NDY0fQ.P4n2xso1wyHGmR13VgAnjFU-8zZyeniB2Do0-X2Dba0'
    }
)

if result.returncode == 0:
    print("✅ SQL migration deployed successfully!")
    sys.exit(0)
else:
    print("❌ Failed to deploy SQL migration")
    sys.exit(1)
