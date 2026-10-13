"""
Agent 3: Case-Law Corpus Research Agent for MARE-Juris.

Isolated service that queries the existing Supabase case-law vector index
(public.case_law_documents and public.case_law_chunks via match_case_law_chunks RPC).

Strict Isolation:
- Does not modify statutory legal_documents or legal_chunks.
- Uses models/gemini-embedding-001 with task_type='retrieval_query' and dim=768.
- Marks provenance strictly as CASE_LAW_CORPUS.
- Handles quota limits or missing embeddings gracefully.
"""

import asyncio
import json
import logging
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional

import google.generativeai as genai

from app.core.config import settings
from app.db.supabase import get_supabase_admin_client

logger = logging.getLogger("mare_juris.case_law_corpus_agent")

EMBED_MODEL = "models/gemini-embedding-001"
EMBED_DIM = 768


class CaseLawCorpusAgent:
    """Agent 3: Retrieves authoritative precedents from the curated Supabase case-law corpus."""

    def __init__(self):
        self.gemini_key = settings.GEMINI_API_KEY
        if self.gemini_key:
            try:
                genai.configure(api_key=self.gemini_key)
            except Exception as e:
                logger.warning(f"[AGENT3] Gemini configuration warning: {e}")

    def _now_iso(self) -> str:
        return datetime.now(timezone.utc).isoformat()

    def generate_query_embedding(self, query: str) -> Optional[List[float]]:
        if not self.gemini_key:
            logger.warning("[AGENT3] GEMINI_API_KEY is not configured.")
            return None
        try:
            res = genai.embed_content(
                model=EMBED_MODEL,
                content=query.strip(),
                task_type="retrieval_query",
                output_dimensionality=EMBED_DIM,
            )
            return res.get("embedding")
        except Exception as e:
            logger.warning(f"[AGENT3] Query embedding failed (e.g. quota exhausted): {e}")
            return None

    async def search_corpus_judgments(
        self,
        query: str,
        match_count: int = 5,
        filter_court: Optional[str] = None,
        filter_year: Optional[int] = None,
    ) -> Dict[str, Any]:
        """
        Executes vector search against public.match_case_law_chunks in Supabase.
        Returns normalized agent response with citations, evidence snippets, and provenance.
        """
        retrieval_ts = self._now_iso()
        citations: List[Dict[str, Any]] = []
        errors: List[str] = []

        q_emb = await asyncio.to_thread(self.generate_query_embedding, query)
        if q_emb is None:
            # When embedding quota is exhausted or unavailable, attempt text fallback on case-law documents
            try:
                def _do_text_search():
                    admin = get_supabase_admin_client()
                    return (
                        admin.table("case_law_documents")
                        .select("id, case_id, title, court, decision_year, decision_date, citation, official_source_url, source_url")
                        .or_(f"title.ilike.%{query}%,citation.ilike.%{query}%")
                        .limit(match_count)
                        .execute()
                    )
                text_res = await asyncio.to_thread(_do_text_search)
                docs = text_res.data or []
                for idx, doc in enumerate(docs):
                    citations.append({
                        "citation_id": f"CASE-{idx + 1}",
                        "case_id": doc.get("case_id"),
                        "case_title": doc.get("title") or "Unknown Case",
                        "court": doc.get("court"),
                        "decision_date": str(doc.get("decision_date")) if doc.get("decision_date") else None,
                        "decision_year": doc.get("decision_year"),
                        "citation": doc.get("citation"),
                        "paragraph_reference": "Catalog record",
                        "evidence_text": f"Precedent from {doc.get('court')} ({doc.get('decision_year') or 'N/A'}). Citation: {doc.get('citation') or 'N/A'}.",
                        "source_url": doc.get("official_source_url") or doc.get("source_url"),
                        "source_provider": "MARE-Juris Case-Law Corpus",
                        "provenance": "CASE_LAW_CORPUS",
                        "official_source_verified": bool(doc.get("official_source_verified", False)),
                        "full_text_verified": bool(doc.get("full_text_verified", False)),
                        "retrieved_at": retrieval_ts,
                    })
                if not citations:
                    errors.append("Embedding generation unavailable and no direct title matches found in corpus.")
            except Exception as db_err:
                errors.append(f"Case-law search error: {str(db_err)}")
        else:
            try:
                def _do_rpc():
                    admin = get_supabase_admin_client()
                    rpc_params = {
                        "query_embedding": q_emb,
                        "match_count": match_count,
                        "filter_court": filter_court,
                        "filter_year": filter_year,
                    }
                    return admin.rpc("match_case_law_chunks", rpc_params).execute()
                rpc_res = await asyncio.to_thread(_do_rpc)
                chunks = rpc_res.data or []

                for idx, c in enumerate(chunks):
                    citations.append({
                        "citation_id": f"CASE-{idx + 1}",
                        "case_id": c.get("case_id"),
                        "case_title": c.get("case_title") or "Unknown Case",
                        "court": c.get("court"),
                        "decision_date": str(c.get("decision_date")) if c.get("decision_date") else None,
                        "citation": c.get("citation"),
                        "chunk_index": c.get("chunk_index"),
                        "paragraph_reference": c.get("paragraph_reference"),
                        "similarity": c.get("similarity"),
                        "evidence_text": c.get("content", "").strip(),
                        "source_url": f"https://indiankanoon.org/doc/{c.get('source_document_id')}/" if c.get("source_document_id") else None,
                        "source_provider": "MARE-Juris Case-Law Corpus",
                        "provenance": "CASE_LAW_CORPUS",
                        "official_source_verified": False,
                        "full_text_verified": False,
                        "retrieved_at": retrieval_ts,
                    })
            except Exception as e:
                logger.error(f"[AGENT3] RPC match_case_law_chunks failed: {e}")
                errors.append(f"RPC vector search failed: {str(e)}")

        # Construct synthesised answer text
        if citations:
            answer_lines = [
                "### Case-Law Precedent Analysis (Curated Corpus)",
                "",
                f"Retrieved **{len(citations)}** relevant judicial authority chunk(s) from the MARE-Juris case-law repository:",
                "",
            ]
            for cit in citations:
                para = f" ({cit['paragraph_reference']})" if cit.get("paragraph_reference") else ""
                sim_str = f" [Similarity: {cit['similarity']:.2f}]" if cit.get("similarity") is not None else ""
                answer_lines.append(f"- **[{cit['citation_id']}] {cit['case_title']}** — *{cit.get('court') or 'Court'}* ({cit.get('decision_date') or cit.get('decision_year') or 'Date N/A'}){para}{sim_str}")
                snippet = cit['evidence_text'][:350].replace("\n", " ")
                answer_lines.append(f"  > \"{snippet}...\"")
                if cit.get("citation"):
                    answer_lines.append(f"  *Citation: {cit['citation']}*")
            answer = "\n".join(answer_lines)
            status = "success"
        else:
            answer = "No matching precedents found in the current MARE-Juris Case-Law corpus for this query."
            status = "empty" if not errors else "error"

        return {
            "agent_id": "case_law_corpus",
            "agent_name": "Case-Law Corpus Agent",
            "status": status,
            "answer": answer,
            "citations": citations,
            "evidence": citations,
            "sources": [c["source_url"] for c in citations if c.get("source_url")],
            "provenance": "CASE_LAW_CORPUS",
            "errors": errors if errors else None,
            "retrieved_at": retrieval_ts,
        }


case_law_corpus_agent = CaseLawCorpusAgent()
