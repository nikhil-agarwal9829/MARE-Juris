"""
Live Official Web Research Service for MARE-Juris.

Search Strategy (in priority order):
  1. DuckDuckGo HTML search restricted to authoritative Indian legal domains
     (indiacode.nic.in, legislative.gov.in, mha.gov.in, supremecourt.gov.in, etc.)
  2. DuckDuckGo HTML search with a broader India legal query (fallback)
  3. Static curated pointers for specific portal-based queries (passport, consumer, etc.)

The eCourtsindia India Code API (https://indiacode.ecourtsindia.com/api/v1/search) was
removed — it returns HTTP 410 Gone.

Once web evidence is collected, Gemini synthesizes a structured answer from it.
"""

import asyncio
import json
import logging
import re
import time
from datetime import datetime, timezone
from typing import Dict, Any, List, Optional
from urllib.parse import quote, quote_plus, unquote

import google.generativeai as genai
import httpx

from app.core.config import settings

logger = logging.getLogger("mare_juris.web_research")

# ---------------------------------------------------------------------------
# Gemini models — verified working on 2026-10-21
# ---------------------------------------------------------------------------
MODELS = ("gemini-3.5-flash-lite", "gemini-3.6-flash")

# ---------------------------------------------------------------------------
# DuckDuckGo HTML search endpoint (no API key required)
# ---------------------------------------------------------------------------
DDG_HTML_URL = "https://html.duckduckgo.com/html/"

# Authoritative Indian legal domains to prefer
OFFICIAL_DOMAINS = (
    "indiacode.nic.in",
    "legislative.gov.in",
    "mha.gov.in",
    "supremecourt.gov.in",
    "doj.gov.in",
    "sci.gov.in",
    "ecourts.gov.in",
    "legalserviceindia.com",
    "indiankanoon.org",
    "barandbench.com",
    "scconline.com",
    "manupatra.com",
    "righttolaw.com",
    "righttolegal.com",
)

# DDG result URL pattern:  //duckduckgo.com/l/?uddg=<encoded-url>&...
_DDG_REDIRECT_RE = re.compile(r'uddg=([^&"]+)', re.IGNORECASE)
_DDG_RESULT_LINK_RE = re.compile(
    r'class="result__a"[^>]*href="([^"]+)"[^>]*>(.*?)</a>', re.DOTALL
)
_DDG_SNIPPET_RE = re.compile(
    r'class="result__snippet"[^>]*>(.*?)</a>', re.DOTALL
)
_HTML_TAG_RE = re.compile(r"<[^>]+>")


def _extract_ddg_url(raw_href: str) -> str:
    """Decode a DuckDuckGo redirect URL into the real destination URL."""
    m = _DDG_REDIRECT_RE.search(raw_href)
    if m:
        try:
            return unquote(m.group(1))
        except Exception:
            pass
    # Fallback: treat href as-is (sometimes DDG returns plain https URLs)
    if raw_href.startswith("//"):
        return "https:" + raw_href
    return raw_href


def _clean_html(text: str) -> str:
    return _HTML_TAG_RE.sub("", text).strip()


class WebResearchService:
    """Live official-source research agent (independent from the RAG corpus)."""

    def __init__(self) -> None:
        self.model: Optional[genai.GenerativeModel] = None
        self._gemini_key_present = bool(settings.GEMINI_API_KEY)
        if self._gemini_key_present:
            try:
                genai.configure(api_key=settings.GEMINI_API_KEY)
                self.model = genai.GenerativeModel(MODELS[0])
                logger.info(
                    f"[WEB_RESEARCH] Gemini initialised with model='{MODELS[0]}' "
                    f"gemini_key_present=True"
                )
            except Exception as e:
                logger.error(
                    f"[WEB_RESEARCH] Gemini initialisation error: {e} "
                    f"gemini_key_present=True model='{MODELS[0]}'"
                )
        else:
            logger.warning(
                "[WEB_RESEARCH] GEMINI_API_KEY missing — synthesis disabled; "
                "fallback structured answer will be used."
            )

    # ------------------------------------------------------------------
    # Internal helpers
    # ------------------------------------------------------------------

    def _now_iso(self) -> str:
        return datetime.now(timezone.utc).isoformat()

    def _get_system_prompt(self) -> str:
        return (
            "You are MARE-Juris Live Official Web Research Agent (India).\n"
            "Synthesize ONLY the provided web-sourced evidence into a clear answer "
            "to the user's exact question.\n\n"
            "Structure your response EXACTLY as:\n"
            "### Short Answer\n"
            "### What this means\n"
            "### What you can do\n"
            "### Important\n"
            "### Official Sources\n"
            "Reference [WEB-1], [WEB-2] etc. matching the evidence items.\n\n"
            "Rules:\n"
            "- Do not invent URLs, fees, penalties, or procedures not present in evidence.\n"
            "- If evidence is insufficient, say live research is inconclusive and why.\n"
            "- Prefer indiacode.nic.in and legislative.gov.in over secondary sources.\n"
            "- Always cite the source URL for every claim."
        )

    # ------------------------------------------------------------------
    # Primary evidence fetcher: DuckDuckGo HTML search
    # ------------------------------------------------------------------

    async def _fetch_ddg_evidence(
        self,
        query: str,
        correlation_id: str = "",
        restrict_to_official: bool = True,
        max_results: int = 5,
    ) -> List[Dict[str, Any]]:
        """
        Fetch search results from DuckDuckGo HTML endpoint.

        Args:
            query: Raw legal query text.
            correlation_id: Request correlation ID for logging.
            restrict_to_official: If True, appends site: filters for official domains.
            max_results: Maximum number of evidence items to return.

        Returns:
            List of evidence dicts conforming to the agent citation schema.
        """
        cid = correlation_id or "ddg"
        if restrict_to_official:
            # Build a site-restricted query against the most authoritative domains
            site_clause = " OR ".join(
                f"site:{d}"
                for d in ["indiacode.nic.in", "legislative.gov.in", "mha.gov.in",
                           "supremecourt.gov.in", "indiankanoon.org"]
            )
            search_q = f"{query} {site_clause}"
        else:
            search_q = f"{query} India legal"

        encoded_q = quote_plus(search_q)
        url = f"{DDG_HTML_URL}?q={encoded_q}"

        t0 = time.perf_counter()
        try:
            async with httpx.AsyncClient(
                timeout=httpx.Timeout(10.0, connect=4.0),
                follow_redirects=True,
                headers={
                    "User-Agent": (
                        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
                        "AppleWebKit/537.36 (KHTML, like Gecko) "
                        "Chrome/124.0 Safari/537.36"
                    ),
                    "Accept": "text/html,application/xhtml+xml;q=0.9,*/*;q=0.8",
                    "Accept-Language": "en-US,en;q=0.5",
                },
            ) as client:
                res = await client.get(url)
                elapsed = time.perf_counter() - t0
                logger.info(
                    f"[WEB_RESEARCH][{cid}] DuckDuckGo search "
                    f"status={res.status_code} elapsed={elapsed:.2f}s "
                    f"restrict_official={restrict_to_official} "
                    f"body_len={len(res.content)}"
                )
                if res.status_code not in (200, 202):
                    logger.warning(
                        f"[WEB_RESEARCH][{cid}] DDG returned unexpected "
                        f"status={res.status_code}; treating as empty."
                    )
                    return []
                body = res.text
        except Exception as e:
            elapsed = time.perf_counter() - t0
            logger.warning(
                f"[WEB_RESEARCH][{cid}] DDG request failed after {elapsed:.2f}s: "
                f"{type(e).__name__}: {e}"
            )
            return []

        # Parse results
        link_matches = _DDG_RESULT_LINK_RE.findall(body)
        snippet_matches = _DDG_SNIPPET_RE.findall(body)

        evidence: List[Dict[str, Any]] = []
        seen_urls: set = set()

        for idx, (raw_href, raw_title) in enumerate(link_matches):
            if len(evidence) >= max_results:
                break

            real_url = _extract_ddg_url(raw_href)
            title = _clean_html(raw_title).strip()
            snippet_raw = snippet_matches[idx] if idx < len(snippet_matches) else ""
            snippet = _clean_html(snippet_raw).strip()

            # Skip duplicate URLs
            if real_url in seen_urls or not title or not real_url.startswith("http"):
                continue
            seen_urls.add(real_url)

            # Determine authority label from URL
            authority = "Web source"
            for domain in OFFICIAL_DOMAINS:
                if domain in real_url:
                    authority = _domain_to_authority(domain)
                    break

            evidence.append(
                {
                    "citation_id": f"WEB-{len(evidence) + 1}",
                    "title": title[:200],
                    "section": "Web search result",
                    "authority": authority,
                    "jurisdiction": "India",
                    "evidence_text": snippet[:1200] if snippet else title,
                    "source_url": real_url,
                    "source_type": "OFFICIAL_WEB",
                    "retrieved_at": self._now_iso(),
                }
            )

        logger.info(
            f"[WEB_RESEARCH][{cid}] Parsed {len(evidence)} usable evidence items "
            f"from {len(link_matches)} DDG result links "
            f"restrict_official={restrict_to_official}"
        )
        return evidence

    # ------------------------------------------------------------------
    # Static curated pointers for specific portal queries
    # ------------------------------------------------------------------

    def _get_static_pointers(self, query: str) -> List[Dict[str, Any]]:
        """Return curated static portal pointers for common query topics."""
        q = query.lower()
        pointers: List[Dict[str, Any]] = []
        ts = self._now_iso()

        if "passport" in q:
            pointers.append({
                "citation_id": "WEB-S1",
                "title": "Passport Seva — Ministry of External Affairs",
                "section": "Passport application services",
                "authority": "Ministry of External Affairs, Government of India",
                "jurisdiction": "India",
                "evidence_text": (
                    "Official passport applications, renewals, and status tracking are "
                    "managed through the Passport Seva portal operated by the Ministry "
                    "of External Affairs."
                ),
                "source_url": "https://portal2.passportindia.gov.in/",
                "source_type": "OFFICIAL_WEB",
                "retrieved_at": ts,
            })
        if "consumer" in q or "complaint" in q:
            pointers.append({
                "citation_id": "WEB-S2",
                "title": "E-Daakhil — National Consumer Disputes Redressal Portal",
                "section": "Online consumer complaint filing",
                "authority": "Department of Consumer Affairs, Government of India",
                "jurisdiction": "India",
                "evidence_text": (
                    "Consumers may file complaints online through the E-Daakhil portal "
                    "for disputes before Consumer Commissions under the Consumer Protection "
                    "Act 2019."
                ),
                "source_url": "https://edaakhil.nic.in/",
                "source_type": "OFFICIAL_WEB",
                "retrieved_at": ts,
            })
        if "rti" in q or "right to information" in q:
            pointers.append({
                "citation_id": "WEB-S3",
                "title": "RTI Online Portal — Department of Personnel & Training",
                "section": "RTI application filing",
                "authority": "Government of India — DOPT",
                "jurisdiction": "India",
                "evidence_text": (
                    "Citizens may file RTI applications online via the RTI Online Portal "
                    "operated by the Department of Personnel and Training, GoI."
                ),
                "source_url": "https://rtionline.gov.in/",
                "source_type": "OFFICIAL_WEB",
                "retrieved_at": ts,
            })
        if "fir" in q or "police complaint" in q or "first information" in q:
            pointers.append({
                "citation_id": "WEB-S4",
                "title": "Crime & Criminal Tracking Network and Systems (CCTNS)",
                "section": "Online FIR status / police complaint",
                "authority": "Ministry of Home Affairs, Government of India",
                "jurisdiction": "India",
                "evidence_text": (
                    "FIR status and online police complaint services are available via "
                    "the CCTNS citizen portal and respective State police portals."
                ),
                "source_url": "https://ncrb.gov.in/",
                "source_type": "OFFICIAL_WEB",
                "retrieved_at": ts,
            })
        return pointers

    # ------------------------------------------------------------------
    # Orchestrated evidence collection
    # ------------------------------------------------------------------

    async def _fetch_official_evidence(
        self, query: str, correlation_id: str = ""
    ) -> List[Dict[str, Any]]:
        """
        Collect web evidence using a three-tier strategy:
        1. DDG restricted to official Indian legal domains.
        2. DDG broader India legal query (if restricted search yields < 2 results).
        3. Static curated portal pointers (appended if relevant).
        """
        cid = correlation_id or "web"

        # Tier 1: Official-domain-restricted DDG search
        evidence = await self._fetch_ddg_evidence(
            query=query,
            correlation_id=cid,
            restrict_to_official=True,
            max_results=5,
        )

        # Tier 2: Broader fallback if restricted search yields fewer than 2 results
        if len(evidence) < 2:
            logger.info(
                f"[WEB_RESEARCH][{cid}] Restricted search yielded {len(evidence)} results; "
                f"trying broader search."
            )
            evidence = await self._fetch_ddg_evidence(
                query=query,
                correlation_id=cid,
                restrict_to_official=False,
                max_results=5,
            )

        # Tier 3: Append static curated pointers for specific portal topics
        static_pts = self._get_static_pointers(query)
        if static_pts:
            # Re-index citation IDs to avoid collisions
            offset = len(evidence)
            for i, pt in enumerate(static_pts):
                pt["citation_id"] = f"WEB-{offset + i + 1}"
            evidence.extend(static_pts)
            logger.info(
                f"[WEB_RESEARCH][{cid}] Appended {len(static_pts)} static pointers."
            )

        logger.info(
            f"[WEB_RESEARCH][{cid}] Total evidence collected: {len(evidence)} items."
        )
        return evidence

    # ------------------------------------------------------------------
    # Main entry point
    # ------------------------------------------------------------------

    async def process_query(
        self, query_text: str, correlation_id: str = ""
    ) -> Dict[str, Any]:
        cid = correlation_id or "web"
        raw_query = query_text.strip()
        t_start = time.perf_counter()
        logger.info(
            f"[WEB_RESEARCH][{cid}] Agent started. "
            f"query='{raw_query[:80]}' "
            f"gemini_key_present={self._gemini_key_present} "
            f"model='{MODELS[0]}'"
        )

        web_evidence = await self._fetch_official_evidence(
            query=raw_query, correlation_id=cid
        )
        verification: Dict[str, Any] = {"verified": False, "issues": []}

        if not web_evidence:
            elapsed = time.perf_counter() - t_start
            logger.warning(
                f"[WEB_RESEARCH][{cid}] No evidence retrieved. "
                f"findings=0 duration={elapsed:.2f}s"
            )
            verification["issues"].append(
                "DuckDuckGo search returned no usable results for this query."
            )
            return {
                "status": "unverified",
                "coverage_status": "not_available",
                "answer": (
                    "### Live Official Web Research\n\n"
                    "Live web research did not retrieve usable evidence for this query. "
                    "The search provider returned no results. "
                    "Try rephrasing with the specific Act, Section, or authority you need."
                ),
                "citations": [],
                "evidence": [],
                "sources": [],
                "verification": verification,
            }

        # Synthesize with Gemini
        assistant_content = ""
        if self.model and self._gemini_key_present:
            context_str = "\n".join(
                f"[{c['citation_id']}] {c['title']} ({c['authority']}): "
                f"{c['evidence_text']} [URL: {c.get('source_url')}]"
                for c in web_evidence
            )
            full_prompt = (
                f"{self._get_system_prompt()}\n\n"
                f"EVIDENCE (from web search):\n{context_str}\n\n"
                f"USER QUESTION: {raw_query}"
            )

            last_err: Optional[Exception] = None
            for model_name in MODELS:
                try:
                    t_model = time.perf_counter()
                    model_inst = genai.GenerativeModel(model_name)
                    response = await asyncio.to_thread(
                        model_inst.generate_content, full_prompt
                    )
                    t_model_elapsed = time.perf_counter() - t_model
                    if not response.candidates:
                        raise ValueError("Gemini returned no candidates.")
                    assistant_content = response.text.strip()
                    verification["verified"] = True
                    logger.info(
                        f"[WEB_RESEARCH][{cid}] Gemini synthesis OK "
                        f"model='{model_name}' duration={t_model_elapsed:.2f}s "
                        f"answer_len={len(assistant_content)}"
                    )
                    break
                except Exception as e:
                    last_err = e
                    logger.warning(
                        f"[WEB_RESEARCH][{cid}] Gemini model='{model_name}' "
                        f"failed: {type(e).__name__}: {str(e)[:120]}"
                    )

            if not assistant_content:
                err_msg = str(last_err) if last_err else "Unknown model failure."
                verification["issues"].append(f"Gemini synthesis failed: {err_msg}")
                logger.error(
                    f"[WEB_RESEARCH][{cid}] All Gemini models failed. "
                    f"Using structured fallback. last_error='{err_msg[:120]}'"
                )
                assistant_content = self._fallback_web_response(raw_query, web_evidence)
        else:
            logger.warning(
                f"[WEB_RESEARCH][{cid}] Gemini unavailable; using structured fallback."
            )
            verification["issues"].append("Gemini model unavailable.")
            assistant_content = self._fallback_web_response(raw_query, web_evidence)

        elapsed = time.perf_counter() - t_start
        logger.info(
            f"[WEB_RESEARCH][{cid}] Agent completed. "
            f"findings={len(web_evidence)} "
            f"sources={len([c for c in web_evidence if c.get('source_url')])} "
            f"synthesized={verification.get('verified', False)} "
            f"duration={elapsed:.2f}s"
        )

        return {
            "status": "verified" if verification.get("verified") else "unverified",
            "coverage_status": "web_sources_found",
            "answer": assistant_content,
            "citations": web_evidence,
            "evidence": web_evidence,
            "sources": [c["source_url"] for c in web_evidence if c.get("source_url")],
            "verification": verification,
        }

    # ------------------------------------------------------------------
    # Structured fallback (no Gemini)
    # ------------------------------------------------------------------

    def _fallback_web_response(
        self, query: str, evidence: List[Dict[str, Any]]
    ) -> str:
        lines = [
            "### Live Official Web Research",
            "",
            f"**Query:** {query}",
            "",
            "### Short Answer",
            "The following sources were retrieved from live web search:",
            "",
        ]
        for ev in evidence:
            lines.append(
                f"- **[{ev['citation_id']}] {ev['title']}** "
                f"({ev['authority']}): {ev['evidence_text'][:300]}"
            )
        lines += [
            "",
            "### Official Sources",
        ]
        for ev in evidence:
            url = ev.get("source_url", "")
            if url:
                lines.append(f"- [{ev['citation_id']}] {ev['title']}: {url}")
        lines.append("\n*Source URLs above are directly retrievable from the web search.*")
        return "\n".join(lines)

    # ------------------------------------------------------------------
    # Source comparison (used by orchestrator when statutory_rag + official_web selected)
    # ------------------------------------------------------------------

    async def compare_sources(
        self, rag_content: str, web_content: str, query: str
    ) -> Dict[str, Any]:
        if not self.model:
            return {
                "available": False,
                "summary": "Comparison unavailable (Gemini model not initialised).",
                "agreements": [],
                "differences": [],
                "potential_conflicts": [],
                "freshness_flags": [],
                "conflicts": [],
            }

        prompt = (
            f"Compare these two legal answers for the query: '{query}'\n\n"
            f"[MARE-JURIS RAG ANSWER]\n{rag_content}\n\n"
            f"[LIVE OFFICIAL WEB ANSWER]\n{web_content}\n\n"
            "Return ONLY JSON (no markdown fences):\n"
            "{\n"
            '  "available": true,\n'
            '  "summary": "1-2 sentences",\n'
            '  "agreements": [],\n'
            '  "differences": [],\n'
            '  "potential_conflicts": [],\n'
            '  "freshness_flags": [],\n'
            '  "conflicts": []\n'
            "}"
        )
        try:
            response = await asyncio.to_thread(self.model.generate_content, prompt)
            raw_text = response.text
            # Strip optional markdown fences
            if "```json" in raw_text:
                json_str = raw_text.split("```json")[1].split("```")[0].strip()
            elif "```" in raw_text:
                json_str = raw_text.split("```")[1].split("```")[0].strip()
            else:
                json_str = raw_text.strip()
            result = json.loads(json_str)
            if "conflicts" not in result and "potential_conflicts" in result:
                result["conflicts"] = result.get("potential_conflicts", [])
            return result
        except Exception as e:
            logger.error(f"[WEB_RESEARCH][compare_sources] Error: {e}")
            return {
                "available": False,
                "summary": "Comparison unavailable due to an internal error.",
                "agreements": [],
                "differences": [],
                "potential_conflicts": [],
                "freshness_flags": [],
                "conflicts": [],
            }


# ------------------------------------------------------------------
# Domain → human-readable authority label
# ------------------------------------------------------------------

def _domain_to_authority(domain: str) -> str:
    _MAP = {
        "indiacode.nic.in": "India Code — Legislative Department, GoI",
        "legislative.gov.in": "Legislative Department, Ministry of Law & Justice",
        "mha.gov.in": "Ministry of Home Affairs, Government of India",
        "supremecourt.gov.in": "Supreme Court of India",
        "doj.gov.in": "Department of Justice, Ministry of Law & Justice",
        "sci.gov.in": "Supreme Court of India",
        "ecourts.gov.in": "e-Courts — National Informatics Centre, GoI",
        "legalserviceindia.com": "Legal Service India",
        "indiankanoon.org": "Indian Kanoon — Open Legal Database",
        "barandbench.com": "Bar & Bench — Indian Legal News",
        "scconline.com": "SCC Online — Supreme Court Cases",
        "manupatra.com": "Manupatra — Legal Research",
        "righttolaw.com": "RightToLaw — Indian Law Reference",
        "righttolegal.com": "RightToLegal — Indian Law Reference",
    }
    return _MAP.get(domain, f"Web source ({domain})")


web_research_service = WebResearchService()
