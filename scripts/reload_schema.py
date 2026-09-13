import psycopg2, os
from dotenv import load_dotenv
load_dotenv('.env')
conn = psycopg2.connect(os.environ.get('SUPABASE_DB_URL'))
conn.autocommit = True
conn.cursor().execute("NOTIFY pgrst, 'reload schema'")
print("Reloaded schema cache")
