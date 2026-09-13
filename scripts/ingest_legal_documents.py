import os
import json
import hashlib
import datetime
import psycopg2
from pypdf import PdfReader
from dotenv import load_dotenv
from google import genai

load_dotenv()

DB_URL = os.environ.get("SUPABASE_DB_URL")
GEMINI_API_KEY = os.environ.get("GEMINI_API_KEY")

if not DB_URL or not GEMINI_API_KEY:
    print("Missing DB or API credentials in .env")
    exit(1)

client = genai.Client(api_key=GEMINI_API_KEY)
LEGAL_DOCS_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "legal-documents")

def get_embedding(text):
    # Dummy embedding for mock pipeline
    import random
    return [random.random() for _ in range(768)]

def process_and_ingest():
    if not os.path.exists(LEGAL_DOCS_DIR):
        print("legal-documents directory not found.")
        return

    conn = psycopg2.connect(DB_URL)
    conn.autocommit = True
    cursor = conn.cursor()

    for entry in os.listdir(LEGAL_DOCS_DIR):
        folder_path = os.path.join(LEGAL_DOCS_DIR, entry)
        if os.path.isdir(folder_path):
            meta_path = os.path.join(folder_path, "metadata.json")
            pdf_path = os.path.join(folder_path, "source.pdf")

            if os.path.exists(meta_path) and os.path.exists(pdf_path):
                with open(meta_path, "r") as f:
                    meta = json.load(f)
                
                print(f"Ingesting: {meta.get('title')}")

                cursor.execute("SELECT id FROM legal_documents WHERE title = %s", (meta['title'],))
                existing = cursor.fetchone()
                
                if existing:
                    doc_id = existing[0]
                    print("  -> Already exists in DB. Deleting old chunks...")
                    cursor.execute("DELETE FROM legal_chunks WHERE document_id = %s", (doc_id,))
                else:
                    year_val = meta.get('year')
                    if year_val == "Unknown":
                        year_val = None
                    else:
                        try:
                            year_val = int(year_val)
                        except:
                            year_val = None

                    cursor.execute("""
                        INSERT INTO legal_documents 
                        (title, year, document_type, authority, jurisdiction, source_url, checksum)
                        VALUES (%s, %s, %s, %s, %s, %s, %s) RETURNING id
                    """, (
                        meta['title'], 
                        year_val, 
                        meta.get('document_type'), 
                        meta.get('authority'), 
                        meta.get('jurisdiction'), 
                        meta.get('source_url'), 
                        meta.get('checksum')
                    ))
                    doc_id = cursor.fetchone()[0]

                text_content = ""
                try:
                    reader = PdfReader(pdf_path)
                    for page in reader.pages:
                        text_content += page.extract_text() + "\n"
                except:
                    with open(pdf_path, "r") as f:
                        text_content = f.read()

                chunks = [c.strip() for c in text_content.split('\n\n') if c.strip()]
                if not chunks:
                    chunks = [text_content.strip()]
                
                print(f"  -> Generated {len(chunks)} chunks. Embedding...")

                for i, chunk in enumerate(chunks):
                    embedding = get_embedding(chunk)
                    cursor.execute("""
                        INSERT INTO legal_chunks 
                        (document_id, chunk_index, content, section_number, section_title, embedding)
                        VALUES (%s, %s, %s, %s, %s, %s)
                    """, (doc_id, i, chunk, f"Mock-Sec-{i+1}", "Mock Section", embedding))
                print("  -> Done.")
                
    cursor.close()
    conn.close()

if __name__ == "__main__":
    print("Starting Ingestion to Supabase via psycopg2...")
    process_and_ingest()
    print("Ingestion Complete.")
