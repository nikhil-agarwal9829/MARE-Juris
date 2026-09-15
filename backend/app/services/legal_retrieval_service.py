import json
import logging
import math
import re
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple

import google.generativeai as genai

from app.core.config import settings
from app.db.supabase import get_supabase_admin_client
from app.services.rag_retrieval_config import (
    BM25_TOP_K,
    FINAL_EVIDENCE_K,
    MIN_RELEVANCE_FULL,
    MIN_RELEVANCE_PARTIAL,
    RERANK_TOP_K,
    VECTOR_MIN_RAW_SIMILARITY,
    VECTOR_TOP_K,
)

logger = logging.getLogger("mare_juris.legal_retrieval")

REPO_ROOT = Path(__file__).resolve().parents[3]
CORPUS_DIR = REPO_ROOT / "legal-documents"
EMBED_DIM = 768

# Synonym expansion for tenant/lease terminology (retrieval only)
TENANT_SYNONYMS = (
    "tenant lessee lease lessor landlord rent possession termination notice rights of lessee",
)


class LegalRetrievalService:
    """Hybrid retrieval: Supabase pgvector + BM25 + query expansion + rerank."""

    def __init__(self) -> None:
        self._chunk_cache: Optional[List[Dict[str, Any]]] = None
        if settings.GEMINI_API_KEY:
            genai.configure(api_key=settings.GEMINI_API_KEY)

    def _now_iso(self) -> str:
        return datetime.now(timezone.utc).isoformat()

    def _tokenize(self, text: str) -> List[str]:
        return re.findall(r"[a-z0-9]+", text.lower())

    def _expand_queries(self, query: str, retrieval_concepts: Optional[List[str]] = None) -> List[str]:
        queries = [query.strip()]
        if retrieval_concepts:
            queries.extend([c.strip() for c in retrieval_concepts if c and c.strip()])
        q_lower = query.lower()
        if any(k in q_lower for k in ("tenant", "landlord", "rent", "lease", "evict")):
            queries.append(TENANT_SYNONYMS)
        return list(dict.fromkeys(queries))[:12]

    def _bm25_score(self, query_tokens: List[str], doc_tokens: List[str], avg_dl: float, df: Dict[str, int], n_docs: int) -> float:
        if not query_tokens or not doc_tokens:
            return 0.0
        k1, b = 1.2, 0.75
        dl = len(doc_tokens)
        tf_map: Dict[str, int] = {}
        for t in doc_tokens:
            tf_map[t] = tf_map.get(t, 0) + 1
        score = 0.0
        for term in set(query_tokens):
            if term not in tf_map:
                continue
            tf = tf_map[term]
            idf = math.log(1 + (n_docs - df.get(term, 0) + 0.5) / (df.get(term, 0) + 0.5))
            denom = tf + k1 * (1 - b + b * (dl / max(avg_dl, 1)))
            score += idf * (tf * (k1 + 1)) / max(denom, 1e-9)
        return score

    def _load_corpus_chunks(self) -> List[Dict[str, Any]]:
        if self._chunk_cache is not None:
            return self._chunk_cache

        chunks: List[Dict[str, Any]] = []
        if not CORPUS_DIR.exists():
            self._chunk_cache = chunks
            return chunks

        try:
            from pypdf import PdfReader
        except ImportError:
            logger.warning("[RETRIEVAL] pypdf not installed; BM25 corpus scan skipped.")
            self._chunk_cache = chunks
            return chunks

        for folder in CORPUS_DIR.iterdir():
            if not folder.is_dir():
                continue
            meta_path = folder / "metadata.json"
            pdf_path = folder / "source.pdf"
            if not meta_path.exists() or not pdf_path.exists():
                continue
            try:
                with open(meta_path, "r", encoding="utf-8") as f:
                    meta = json.load(f)
                reader = PdfReader(str(pdf_path))
                text = "\n".join((page.extract_text() or "") for page in reader.pages)
                parts = [p.strip() for p in text.split("\n\n") if len(p.strip()) > 80]
                if not parts:
                    parts = [text.strip()] if text.strip() else []
                for idx, part in enumerate(parts[:250]):
                    chunks.append(
                        {
                            "chunk_id": f"{folder.name}-{idx}",
                            "document_title": meta.get("title", folder.name),
                            "act": meta.get("title", folder.name),
                            "section_number": meta.get("section_number", ""),
                            "section_title": "",
                            "content": part[:4000],
                            "source_url": meta.get("source_url", ""),
                            "authority": meta.get("authority", "Government of India"),
                            "jurisdiction": meta.get("jurisdiction", "India"),
                        }
                    )
            except Exception as e:
                logger.warning(f"[RETRIEVAL] Failed loading {folder.name}: {e}")

        self._chunk_cache = chunks
        logger.info(f"[RETRIEVAL] Loaded {len(chunks)} local corpus chunks.")
        return chunks

    def _bm25_retrieve(self, query: str, top_k: int = BM25_TOP_K) -> List[Dict[str, Any]]:
        chunks = self._load_corpus_chunks()
        if not chunks:
            return []

        query_tokens = self._tokenize(query)
        doc_tokens_list = [self._tokenize(c["content"]) for c in chunks]
        n_docs = len(doc_tokens_list)
        avg_dl = sum(len(d) for d in doc_tokens_list) / max(n_docs, 1)
        df: Dict[str, int] = {}
        for tokens in doc_tokens_list:
            for term in set(tokens):
                df[term] = df.get(term, 0) + 1

        scored: List[Tuple[float, Dict[str, Any]]] = []
        for chunk, tokens in zip(chunks, doc_tokens_list):
            score = self._bm25_score(query_tokens, tokens, avg_dl, df, n_docs)
            if score > 0:
                scored.append((score, chunk))

        scored.sort(key=lambda x: x[0], reverse=True)
        return [{**chunk, "score": float(score), "retrieval_method": "bm25"} for score, chunk in scored[:top_k]]

    def _embed_query(self, query: str) -> Optional[List[float]]:
        if not settings.GEMINI_API_KEY:
            return None
        try:
            result = genai.embed_content(
                model="models/text-embedding-004",
                content=query,
                task_type="retrieval_query",
            )
            emb = result.get("embedding")
            if emb and len(emb) == EMBED_DIM:
                return emb
        except Exception as e:
            logger.warning(f"[RETRIEVAL] Embedding failed: {e}")
        return None

    def _vector_retrieve(self, query: str, top_k: int = VECTOR_TOP_K) -> List[Dict[str, Any]]:
        embedding = self._embed_query(query)
        if not embedding:
            return []
        admin = get_supabase_admin_client()
        try:
            res = admin.rpc(
                "match_legal_chunks",
                {"query_embedding": embedding, "match_count": top_k, "filter": {}},
            ).execute()
            rows = res.data or []
        except Exception as e:
            logger.warning(f"[RETRIEVAL] Vector search failed: {e}")
            return []

        results: List[Dict[str, Any]] = []
        for row in rows:
            sim = float(row.get("similarity") or 0)
            if sim <= VECTOR_MIN_RAW_SIMILARITY:
                continue
            try:
                doc_res = (
                    admin.table("legal_documents")
                    .select("title, source_url, authority, jurisdiction")
                    .eq("id", row["document_id"])
                    .limit(1)
                    .execute()
                )
                doc = (doc_res.data or [{}])[0]
            except Exception:
                doc = {}
            results.append(
                {
                    "chunk_id": str(row.get("id")),
                    "document_title": doc.get("title", "Legal Document"),
                    "act": doc.get("title", "Legal Document"),
                    "section_number": row.get("section_number") or "",
                    "section_title": row.get("section_title") or "",
                    "content": row.get("content") or "",
                    "source_url": doc.get("source_url", ""),
                    "authority": doc.get("authority", "Government of India"),
                    "jurisdiction": doc.get("jurisdiction", "India"),
                    "score": sim,
                    "retrieval_method": "vector",
                }
            )
        return results

    @staticmethod
    def _normalize_scores(hits: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        if not hits:
            return hits
        scores = [h.get("score", 0) for h in hits]
        lo, hi = min(scores), max(scores)
        span = max(hi - lo, 1e-9)
        for h in hits:
            h["norm_score"] = (h.get("score", 0) - lo) / span
        return hits

    def _merge_hybrid(self, vector_hits: List[Dict[str, Any]], bm25_hits: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        vector_hits = self._normalize_scores(vector_hits)
        bm25_hits = self._normalize_scores(bm25_hits)

        merged: Dict[str, Dict[str, Any]] = {}
        for hit in vector_hits:
            key = str(hit.get("chunk_id") or hit.get("content", "")[:160])
            merged[key] = {**hit, "vector_norm": hit.get("norm_score", 0), "bm25_norm": 0.0}
        for hit in bm25_hits:
            key = str(hit.get("chunk_id") or hit.get("content", "")[:160])
            if key in merged:
                merged[key]["bm25_norm"] = hit.get("norm_score", 0)
                merged[key]["score"] = max(merged[key].get("score", 0), hit.get("score", 0))
            else:
                merged[key] = {**hit, "vector_norm": 0.0, "bm25_norm": hit.get("norm_score", 0)}

        reranked: List[Dict[str, Any]] = []
        for hit in merged.values():
            rerank = 0.55 * hit.get("vector_norm", 0) + 0.45 * hit.get("bm25_norm", 0)
            hit["rerank_score"] = rerank
            reranked.append(hit)

        reranked.sort(key=lambda h: h.get("rerank_score", 0), reverse=True)
        return reranked[:RERANK_TOP_K]

    def _to_citation(self, hit: Dict[str, Any], index: int) -> Dict[str, Any]:
        evidence = (hit.get("content") or "")[:1200]
        return {
            "citation_id": f"RAG-{index + 1}",
            "chunk_id": hit.get("chunk_id"),
            "document": hit.get("document_title"),
            "document_title": hit.get("document_title"),
            "act": hit.get("act"),
            "section": hit.get("section_number") or hit.get("section_title") or "Corpus excerpt",
            "subsection": hit.get("section_title") or "",
            "authority": hit.get("authority"),
            "jurisdiction": hit.get("jurisdiction", "India"),
            "evidence_text": evidence,
            "evidence": evidence,
            "source_url": hit.get("source_url"),
            "source_type": "RAG",
            "retrieved_at": self._now_iso(),
            "relevance_score": hit.get("rerank_score", hit.get("score")),
            "retrieval_method": hit.get("retrieval_method"),
        }

    def _decide_coverage(self, hits: List[Dict[str, Any]]) -> str:
        if not hits:
            return "NOT_SUPPORTED"
        top = hits[0].get("rerank_score", 0)
        if top >= MIN_RELEVANCE_FULL:
            return "FULLY_SUPPORTED"
        if top >= MIN_RELEVANCE_PARTIAL or len(hits) >= 2:
            return "PARTIALLY_SUPPORTED"
        return "NOT_SUPPORTED"

    def retrieve_evidence(
        self,
        query: str,
        retrieval_concepts: Optional[List[str]] = None,
        top_k: int = FINAL_EVIDENCE_K,
    ) -> Tuple[List[Dict[str, Any]], str]:
        search_queries = self._expand_queries(query, retrieval_concepts)
        all_vector: List[Dict[str, Any]] = []
        all_bm25: List[Dict[str, Any]] = []

        for q in search_queries:
            all_vector.extend(self._vector_retrieve(q, top_k=VECTOR_TOP_K))
            all_bm25.extend(self._bm25_retrieve(q, top_k=BM25_TOP_K))

        merged = self._merge_hybrid(all_vector, all_bm25)
        coverage = self._decide_coverage(merged)

        if coverage == "NOT_SUPPORTED":
            logger.info(f"[RETRIEVAL] No sufficient evidence for query='{query[:80]}'")
            return [], coverage

        citations = [self._to_citation(h, i) for i, h in enumerate(merged[:top_k])]
        logger.info(
            f"[RETRIEVAL] query='{query[:60]}' coverage={coverage} hits={len(citations)} top={merged[0].get('rerank_score')}"
        )
        return citations, coverage


legal_retrieval_service = LegalRetrievalService()
