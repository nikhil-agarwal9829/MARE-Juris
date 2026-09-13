# MARE-Juris Initial Legal Corpus

This directory is intended to store the official PDF binaries for the MARE-Juris RAG pipeline.

According to the implementation architecture, the initial verified corpus must consist of the following 10 curated official legal documents:

1. **Constitution of India, 1950**
2. **Consumer Protection Act, 2019**
3. **Digital Personal Data Protection Act, 2023**
4. **Information Technology Act, 2000**
5. **Transfer of Property Act, 1882**
6. **Indian Contract Act, 1872**
7. **Bharatiya Nyaya Sanhita, 2023 (BNS)**
8. **Bharatiya Nagarik Suraksha Sanhita, 2023 (BNSS)**
9. **Protection of Women from Domestic Violence Act, 2005**
10. **Sexual Harassment of Women at Workplace (Prevention, Prohibition and Redressal) Act, 2013 (POSH Act)**

## How to source these files:
To ensure strict evidence grounding and avoid hallucination, you must download the official PDF versions of these acts exclusively from **India Code** (https://www.indiacode.nic.in) or respective Ministry websites.

*Note: Once you download the PDFs, place them in this folder. The backend RAG ingestion pipeline will process, chunk, and embed these PDFs into the Supabase `legal_documents` and `legal_chunks` tables.*
