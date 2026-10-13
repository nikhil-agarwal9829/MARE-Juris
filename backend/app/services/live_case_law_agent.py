"""
Agent 4: Live Case-Law API Research Agent.

Isolated backend service that searches external legal APIs (Indian Kanoon primary,
IndiaCode secondary) to retrieve real-time and recent Indian court judgments.

Features:
- Primary: Indian Kanoon API (https://api.indiankanoon.org/documentation/)
  - /search/?formInput=<query>&pagenum=<pagenum>
  - /doc/<docid>/ for full text retrieval
- Optional Secondary: IndiaCode / eCourts reported judgments
- Strictly isolated from Agent 3 (Supabase Case-Law corpus) and statutory RAG.
- Authenticates securely via backend settings.INDIANKANOON_API_TOKEN.
- Never prints, logs, or exposes credentials.
- Parameter filtering: query, court (doctypes), from_date, to_date, page.
- Distinguishes live API judgments from Agent 3 corpus.
- Date distinction: Maps API publishdate to publication_date; marks decision_date
  as null unless verified from judgment text.
- Handles rate-limits, timeouts, missing fields, pagination, malformed JSON, and empty results.
"""

import re
import logging
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional
from urllib.parse import quote

import httpx
from bs4 import BeautifulSoup

from app.core.config import settings

logger = logging.getLogger("mare_juris.live_caselaw")

IK_API_BASE = "https://api.indiankanoon.org"
INDIA_CODE_SEARCH = "https://indiacode.ecourtsindia.com/api/v1/search"

# Supported doctype court mappings for Indian Kanoon
IK_COURT_MAPPINGS = {
    "supreme_court": "supremecourt",
    "delhi_high_court": "delhi",
    "bombay_high_court": "bombay",
    "calcutta_high_court": "kolkata",
    "madras_high_court": "chennai",
    "allahabad_high_court": "allahabad",
    "kerala_high_court": "kerala",
    "karnataka_high_court": "karnataka",
    "high_courts": "highcourts",
    "tribunals": "tribunals",
    "judgments": "judgments"
}


def _clean_html_snippet(raw_html: str) -> str:
    """Strips HTML formatting and scripts while preserving text content."""
    if not raw_html:
        return ""
    try:
        soup = BeautifulSoup(raw_html, "html.parser")
        for tag in soup(["script", "style", "noscript"]):
            tag.decompose()
        text = soup.get_text(" ", strip=True)
    except Exception:
        text = re.sub(r"<[^>]+>", " ", raw_html)
    text = re.sub(r"\s+", " ", text).strip()
    return text


_DEFAULT_TOKEN = object()


class LiveCaseLawAgent:
    """Agent 4: Live Case-Law API Research Agent."""

    def __init__(self, token: Any = _DEFAULT_TOKEN, timeout: float = 20.0):
        if token is _DEFAULT_TOKEN:
            self.token = settings.INDIANKANOON_API_TOKEN
        else:
            self.token = token
        self.timeout = timeout

    def _now_iso(self) -> str:
        return datetime.now(timezone.utc).isoformat()

    def _build_search_query(
        self,
        query: str,
        court: Optional[str] = None,
        from_date: Optional[str] = None,
        to_date: Optional[str] = None,
        title_only: bool = False
    ) -> str:
        parts = []
        clean_q = query.strip()
        if title_only:
            parts.append(f'title: "{clean_q}"')
        else:
            parts.append(clean_q)

        if court:
            court_key = court.strip().lower().replace(" ", "_")
            ik_doctype = IK_COURT_MAPPINGS.get(court_key, court.strip())
            parts.append(f"doctypes:{ik_doctype}")

        if from_date:
            parts.append(f"fromdate:{from_date}")
        if to_date:
            parts.append(f"todate:{to_date}")

        return " ".join(parts)

    async def search_live_cases(
        self,
        query: str,
        court: Optional[str] = None,
        from_date: Optional[str] = None,
        to_date: Optional[str] = None,
        page: int = 0,
        max_results: int = 5,
        include_secondary_ecourts: bool = False
    ) -> Dict[str, Any]:
        """
        Executes live legal judgment research across external public APIs.
        Returns a normalized dictionary with metadata, case items, and provenance.
        """
        retrieval_ts = self._now_iso()
        results: List[Dict[str, Any]] = []
        errors: List[str] = []
        sources_queried = []

        # 1. Primary Source: Indian Kanoon API
        if not self.token:
            errors.append("INDIANKANOON_API_TOKEN is not configured in backend environment.")
        else:
            sources_queried.append("Indian Kanoon API")
            ik_results, ik_err = await self._search_indian_kanoon(
                query=query,
                court=court,
                from_date=from_date,
                to_date=to_date,
                page=page,
                max_results=max_results,
                retrieval_ts=retrieval_ts
            )
            if ik_err:
                errors.append(f"Indian Kanoon: {ik_err}")
            results.extend(ik_results)

        # 2. Supplementary Source: IndiaCode / eCourts (Optional)
        if include_secondary_ecourts:
            sources_queried.append("IndiaCode/eCourts Public API")
            ic_results, ic_err = await self._search_indiacode_judgments(
                query=query,
                max_results=max_results,
                retrieval_ts=retrieval_ts
            )
            if ic_err:
                errors.append(f"IndiaCode: {ic_err}")
            results.extend(ic_results)

        # Deduplicate cases by (source_provider, source_document_id) or source_url
        seen = set()
        deduped: List[Dict[str, Any]] = []
        for r in results:
            doc_id = r.get("source_document_id")
            source_url = r.get("source_url")
            provider = r.get("source_provider")
            key = (provider, doc_id) if doc_id else (provider, source_url)
            
            if key not in seen and key != (None, None):
                seen.add(key)
                deduped.append(r)
            elif not doc_id and not source_url:
                deduped.append(r)

        return {
            "query": query,
            "page": max(0, page),
            "retrieved_at": retrieval_ts,
            "agent": "Agent 4: Live Case-Law API Research",
            "provenance": "LIVE_EXTERNAL_API",
            "sources_queried": sources_queried,
            "total_candidates_found": len(deduped),
            "has_more": len(deduped) >= max_results,
            "judgments": deduped[:max_results],
            "errors": errors if errors else None,
            "date_field_note": "Dates returned from Indian Kanoon search reflect publication/indexing dates (publication_date). Actual judgment decision dates are marked null unless verified from full text.",
            "exhaustiveness_disclaimer": "Results represent external search matches from queried public APIs and are not guaranteed to be exhaustive or precedentially verified without human review."
        }

    async def _search_indian_kanoon(
        self,
        query: str,
        court: Optional[str],
        from_date: Optional[str],
        to_date: Optional[str],
        page: int,
        max_results: int,
        retrieval_ts: str
    ) -> tuple[List[Dict[str, Any]], Optional[str]]:
        formatted_query = self._build_search_query(query, court=court, from_date=from_date, to_date=to_date)
        url = f"{IK_API_BASE}/search/"
        headers = {
            "Authorization": f"Token {self.token}",
            "Accept": "application/json"
        }
        params = {
            "formInput": formatted_query,
            "pagenum": max(0, page)
        }

        try:
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                res = await client.post(url, headers=headers, params=params)

                if res.status_code == 403:
                    return [], "HTTP 403 Forbidden: Invalid or unauthorized API token."
                elif res.status_code == 429:
                    return [], "HTTP 429: Rate limit exceeded on Indian Kanoon API."
                elif res.status_code != 200:
                    return [], f"HTTP {res.status_code} error from API."

                try:
                    data = res.json()
                except Exception:
                    return [], "Malformed JSON response received from Indian Kanoon API."

        except httpx.TimeoutException:
            return [], "Request timed out connecting to Indian Kanoon."
        except Exception as e:
            logger.warning(f"[AGENT4] Indian Kanoon search error: {e}")
            return [], f"Request error: {str(e)}"

        if not isinstance(data, dict):
            return [], "Unexpected response format from Indian Kanoon API."

        docs = data.get("docs", [])
        if not isinstance(docs, list):
            docs = []

        parsed: List[Dict[str, Any]] = []

        for item in docs:
            if not isinstance(item, dict):
                continue

            raw_tid = item.get("tid") or item.get("docid") or item.get("id")
            doc_id = str(raw_tid).strip() if raw_tid is not None and str(raw_tid).strip() != "" else None
            
            raw_title = item.get("title")
            title = _clean_html_snippet(raw_title) if raw_title else None
            
            raw_headline = item.get("headline")
            headline = _clean_html_snippet(raw_headline) if raw_headline else None
            
            citation = item.get("citation") or None
            item_court = item.get("docsource") or item.get("court") or None
            
            # The search API provides publishdate (the date the document was uploaded/published to IK)
            # It does NOT guarantee the date of judgment delivery.
            publication_date = item.get("publishdate") or item.get("date") or None
            decision_date = None  # Unavailable from search results; kept null per instructions

            source_url = f"https://indiankanoon.org/doc/{doc_id}/" if doc_id else None

            parsed.append({
                "case_title": title or "Untitled Document",
                "court": item_court,
                "decision_date": decision_date,
                "publication_date": publication_date,
                "citation": citation,
                "summary_or_snippet": headline if headline else None,
                "source_document_id": doc_id,
                "source_url": source_url,
                "source_provider": "Indian Kanoon",
                "provenance": "LIVE_EXTERNAL_API",
                "retrieved_at": retrieval_ts,
                "official_source_verified": False,
                "full_text_verified": False
            })

        return parsed, None

    async def get_document_full_text(self, doc_id: str) -> Dict[str, Any]:
        """
        Retrieves the complete document text from Indian Kanoon via /doc/<docid>/
        as specified in the official documentation.
        """
        retrieval_ts = self._now_iso()

        if not self.token:
            return {
                "doc_id": doc_id,
                "case_title": None,
                "court": None,
                "decision_date": None,
                "publication_date": None,
                "full_text": None,
                "cite_list": [],
                "cited_by_list": [],
                "source_url": None,
                "source_provider": "Indian Kanoon",
                "provenance": "LIVE_EXTERNAL_API",
                "retrieved_at": retrieval_ts,
                "official_source_verified": False,
                "full_text_verified": False,
                "error": "INDIANKANOON_API_TOKEN is not configured in backend environment."
            }

        url = f"{IK_API_BASE}/doc/{quote(str(doc_id).strip())}/"
        headers = {
            "Authorization": f"Token {self.token}",
            "Accept": "application/json"
        }

        try:
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                res = await client.post(url, headers=headers)

                if res.status_code == 403:
                    return self._build_doc_error_response(doc_id, retrieval_ts, "HTTP 403 Forbidden: Invalid or unauthorized API token.")
                elif res.status_code == 404:
                    return self._build_doc_error_response(doc_id, retrieval_ts, "HTTP 404: Document not found on Indian Kanoon.")
                elif res.status_code == 429:
                    return self._build_doc_error_response(doc_id, retrieval_ts, "HTTP 429: Rate limit exceeded on Indian Kanoon API.")
                elif res.status_code != 200:
                    return self._build_doc_error_response(doc_id, retrieval_ts, f"HTTP {res.status_code} error from API.")

                try:
                    data = res.json()
                except Exception:
                    return self._build_doc_error_response(doc_id, retrieval_ts, "Malformed JSON response received from Indian Kanoon API.")

        except httpx.TimeoutException:
            return self._build_doc_error_response(doc_id, retrieval_ts, "Request timed out connecting to Indian Kanoon.")
        except Exception as e:
            logger.warning(f"[AGENT4] Full document retrieval error: {e}")
            return self._build_doc_error_response(doc_id, retrieval_ts, f"Request error: {str(e)}")

        if not isinstance(data, dict):
            return self._build_doc_error_response(doc_id, retrieval_ts, "Unexpected response format from Indian Kanoon API.")

        raw_doc_html = data.get("doc", "")
        clean_text = _clean_html_snippet(raw_doc_html) if raw_doc_html else None
        title = _clean_html_snippet(data.get("title", "")) or None
        publication_date = data.get("publishdate") or data.get("date") or None
        court = data.get("court") or data.get("docsource") or None
        cite_list = data.get("citeList", []) if isinstance(data.get("citeList"), list) else []
        cited_by_list = data.get("citedbyList", []) if isinstance(data.get("citedbyList"), list) else []

        return {
            "doc_id": str(doc_id),
            "case_title": title or "Untitled Document",
            "court": court,
            "decision_date": None,  # Not independently guaranteed without legal bench extraction
            "publication_date": publication_date,
            "full_text": clean_text,
            "cite_list": cite_list,
            "cited_by_list": cited_by_list,
            "source_url": f"https://indiankanoon.org/doc/{doc_id}/",
            "source_provider": "Indian Kanoon",
            "provenance": "LIVE_EXTERNAL_API",
            "retrieved_at": retrieval_ts,
            "official_source_verified": False,
            "full_text_verified": False,
            "error": None
        }

    def _build_doc_error_response(self, doc_id: str, retrieval_ts: str, error_msg: str) -> Dict[str, Any]:
        return {
            "doc_id": str(doc_id),
            "case_title": None,
            "court": None,
            "decision_date": None,
            "publication_date": None,
            "full_text": None,
            "cite_list": [],
            "cited_by_list": [],
            "source_url": f"https://indiankanoon.org/doc/{doc_id}/",
            "source_provider": "Indian Kanoon",
            "provenance": "LIVE_EXTERNAL_API",
            "retrieved_at": retrieval_ts,
            "official_source_verified": False,
            "full_text_verified": False,
            "error": error_msg
        }

    async def _search_indiacode_judgments(
        self,
        query: str,
        max_results: int,
        retrieval_ts: str
    ) -> tuple[List[Dict[str, Any]], Optional[str]]:
        url = f"{INDIA_CODE_SEARCH}?q={quote(query)}&limit={max_results}"
        try:
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                res = await client.get(url, headers={"Accept": "application/json"})
                if res.status_code != 200:
                    return [], f"HTTP {res.status_code}"
                try:
                    data = res.json()
                except Exception:
                    return [], "Malformed JSON from IndiaCode"
        except Exception as e:
            return [], str(e)

        items = data.get("results", []) if isinstance(data, dict) else []
        parsed = []
        for it in items:
            if not isinstance(it, dict):
                continue
            if it.get("kind") == "judgment":
                parsed.append({
                    "case_title": it.get("title") or "eCourts Case",
                    "court": it.get("act") or "Supreme Court of India",
                    "decision_date": None,
                    "publication_date": None,
                    "citation": None,
                    "summary_or_snippet": it.get("snippet"),
                    "source_document_id": it.get("ref"),
                    "source_url": it.get("url"),
                    "source_provider": "IndiaCode / eCourts",
                    "provenance": "LIVE_EXTERNAL_API",
                    "retrieved_at": retrieval_ts,
                    "official_source_verified": True,
                    "full_text_verified": False
                })
        return parsed, None
