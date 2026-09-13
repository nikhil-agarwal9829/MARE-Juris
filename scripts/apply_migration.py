import os
import psycopg2
from dotenv import load_dotenv

load_dotenv()

DB_URL = os.environ.get("SUPABASE_DB_URL")
if not DB_URL:
    print("Missing SUPABASE_DB_URL in .env")
    exit(1)

# Sometimes connection strings need adjustments, but let's try direct connection
migration_path = os.path.join(os.path.dirname(__file__), "../supabase/migrations/20260913_legal_corpus.sql")

with open(migration_path, "r") as f:
    sql = f.read()

try:
    conn = psycopg2.connect(DB_URL)
    conn.autocommit = True
    cursor = conn.cursor()
    cursor.execute(sql)
    print("Successfully applied legal_corpus migration.")
    cursor.close()
    conn.close()
except Exception as e:
    print(f"Error applying migration: {e}")
