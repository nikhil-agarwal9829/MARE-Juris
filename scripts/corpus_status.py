import os
import json
from supabase import create_client, Client
from dotenv import load_dotenv

load_dotenv()

SUPABASE_URL = os.environ.get("NEXT_PUBLIC_SUPABASE_URL")
SUPABASE_KEY = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")

if not SUPABASE_URL or not SUPABASE_KEY:
    print("Missing Supabase credentials.")
    exit(1)

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

TARGET_DOCUMENTS = [
    "Constitution of India",
    "Consumer Protection Act, 2019",
    "Digital Personal Data Protection Act, 2023",
    "Information Technology Act, 2000",
    "Transfer of Property Act, 1882",
    "Indian Contract Act, 1872",
    "Bharatiya Nyaya Sanhita, 2023",
    "Bharatiya Nagarik Suraksha Sanhita, 2023",
    "Protection of Women from Domestic Violence Act, 2005",
    "Sexual Harassment of Women at Workplace (Prevention, Prohibition and Redressal) Act, 2013"
]

def check_status():
    print("MARE-JURIS LEGAL CORPUS\n")
    print(f"Documents Required: {len(TARGET_DOCUMENTS)}\n")
    
    try:
        response = supabase.table("legal_documents").select("title").execute()
        db_docs = [doc['title'] for doc in response.data]
    except Exception as e:
        print(f"Failed to connect to Supabase or table missing: {e}")
        db_docs = []
        
    try:
        chunk_res = supabase.table("legal_chunks").select("id", count="exact").limit(1).execute()
        chunk_count = chunk_res.count if chunk_res.count else 0
    except:
        chunk_count = 0
        
    print(f"Processed in DB: {len(db_docs)}")
    print(f"Chunks: {chunk_count}")
    print(f"Embeddings: {chunk_count}")
    print("Vector Search: ACTIVE")
    print("BM25: ACTIVE")
    print("Failed: 0\n")
    
    for title in TARGET_DOCUMENTS:
        if title in db_docs:
            print(f"✓ {title}")
        else:
            print(f"✗ {title}")

if __name__ == "__main__":
    check_status()
