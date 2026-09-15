import os, json, pathlib, hashlib

CORPUS_DIR = pathlib.Path(r"C:\Users\Nikhil Agarwal\Desktop\MARE-Juris\legal-documents")

docs = []

# Structured sub-directories
for folder in sorted(CORPUS_DIR.iterdir()):
    if not folder.is_dir():
        continue
    meta_path = folder / "metadata.json"
    pdf_path  = folder / "source.pdf"
    m = {}
    if meta_path.exists():
        m = json.loads(meta_path.read_text(encoding="utf-8"))
    size = pdf_path.stat().st_size if pdf_path.exists() else 0
    chk = ""
    if pdf_path.exists():
        chk = hashlib.md5(pdf_path.read_bytes()).hexdigest()[:12]
    docs.append({
        "source": "subdirectory",
        "name": folder.name,
        "title": m.get("title", folder.name),
        "year":  m.get("year", "?"),
        "type":  m.get("document_type", "?"),
        "authority": m.get("authority", "Government of India"),
        "source_url": m.get("source_url", ""),
        "size_bytes": size,
        "checksum": chk,
        "has_pdf":  pdf_path.exists(),
        "has_meta": meta_path.exists(),
    })

# Root-level PDFs
for f in sorted(CORPUS_DIR.iterdir()):
    if f.is_file() and f.suffix.lower() == ".pdf":
        chk = hashlib.md5(f.read_bytes()).hexdigest()[:12]
        docs.append({
            "source": "root_pdf",
            "name": f.stem,
            "title": f.stem,
            "year": "?",
            "type": "Act",
            "authority": "Government of India",
            "source_url": "",
            "size_bytes": f.stat().st_size,
            "checksum": chk,
            "has_pdf": True,
            "has_meta": False,
        })

total_size = sum(d["size_bytes"] for d in docs)
sub_docs   = [d for d in docs if d["source"] == "subdirectory"]
root_pdfs  = [d for d in docs if d["source"] == "root_pdf"]

print("=" * 70)
print("MARE-JURIS LEGAL CORPUS — LOCAL FILE MEASUREMENT")
print("=" * 70)
print(f"Structured sub-directory documents : {len(sub_docs)}")
print(f"Root-level PDF documents           : {len(root_pdfs)}")
print(f"Total PDF sources on disk          : {len(docs)}")
print(f"Total disk size                    : {total_size / 1024:.1f} KB  ({total_size / (1024*1024):.2f} MB)")
print()
print("DOCUMENT INVENTORY:")
print(f"{'#':<4} {'Title':<60} {'Year':<6} {'Size KB':<10} {'Source':<14} {'Checksum'}")
print("-" * 110)
for i, d in enumerate(docs, 1):
    sz = d["size_bytes"] / 1024
    print(f"{i:<4} {d['title'][:58]:<60} {str(d['year']):<6} {sz:<10.1f} {d['source']:<14} {d['checksum']}")

print()
# Try to estimate page counts using pypdf
try:
    from pypdf import PdfReader
    total_pages = 0
    print("PAGE COUNTS (measured via pypdf):")
    for d in docs:
        # find actual PDF
        if d["source"] == "subdirectory":
            pdf_path = CORPUS_DIR / d["name"] / "source.pdf"
        else:
            pdf_path = CORPUS_DIR / (d["name"] + ".pdf")
        if pdf_path.exists():
            try:
                r = PdfReader(str(pdf_path))
                pages = len(r.pages)
                total_pages += pages
                print(f"  {d['title'][:55]:<55} : {pages} pages")
            except Exception as e:
                print(f"  {d['title'][:55]:<55} : ERROR ({e})")
    print(f"\nTotal pages (all documents) : {total_pages}")
except ImportError:
    print("pypdf not installed — page counts NOT AVAILABLE")

print()
# BM25 chunk estimation (same logic as legal_retrieval_service.py)
try:
    from pypdf import PdfReader
    total_chunks = 0
    MIN_CHUNK = 80
    MAX_CHUNK_IDX = 250
    print("BM25 CHUNK ESTIMATES (mirror of legal_retrieval_service._load_corpus_chunks):")
    for d in docs:
        if d["source"] == "subdirectory":
            pdf_path = CORPUS_DIR / d["name"] / "source.pdf"
        else:
            pdf_path = CORPUS_DIR / (d["name"] + ".pdf")
        if pdf_path.exists():
            try:
                r = PdfReader(str(pdf_path))
                text = "\n".join((p.extract_text() or "") for p in r.pages)
                parts = [p.strip() for p in text.split("\n\n") if len(p.strip()) > MIN_CHUNK]
                n = min(len(parts), MAX_CHUNK_IDX)
                total_chunks += n
                avg_len = sum(len(p) for p in parts[:n]) / max(n, 1)
                print(f"  {d['title'][:55]:<55} : {n} chunks (avg {avg_len:.0f} chars)")
            except Exception as e:
                print(f"  {d['title'][:55]:<55} : ERROR ({e})")
    print(f"\nTotal BM25 chunks (local corpus) : {total_chunks}")
except ImportError:
    print("pypdf not installed — chunk counts NOT AVAILABLE")
