import uuid
import json
import logging
from datetime import datetime, timezone
from typing import Dict, Any, List, Optional
from urllib.parse import quote

import google.generativeai as genai
import httpx

from app.core.config import settings

logger = logging.getLogger("mare_juris.web_research")

MODELS = ("gemini-3.5-flash-lite", "gemini-3.6-flash")
INDIA_CODE_SEARCH = "https://indiacode.ecourtsindia.com/api/v1/search"


class WebResearchService:
    """Live official-source research (independent from RAG corpus)."""

    def __init__(self):
        self.model = None
        if settings.GEMINI_API_KEY:
            try:
                genai.configure(api_key=settings.GEMINI_API_KEY)
                self.model = genai.GenerativeModel(MODELS[0])
            except Exception as e:
                logger.error(f"[WEB_RESEARCH] Gemini initialization error: {e}")

    def _now_iso(self) -> str:
        return datetime.now(timezone.utc).isoformat()

    def _get_system_prompt(self) -> str:
        return """You are MARE-Juris Live Official Web Research (India).
Synthesize ONLY the provided official-source evidence into a clear answer to the user's exact question.

Structure:
### Short Answer
### What this means
### What you can do
### Important
### Official Sources
Reference [WEB-1], [WEB-2] matching evidence items.

Do not invent URLs, fees, or procedures not supported by evidence.
If evidence is insufficient, say live research is inconclusive and why."""

    async def _fetch_india_code_results(self, query: str) -> List[Dict[str, Any]]:
        url = f"{INDIA_CODE_SEARCH}?q={quote(query)}"
        try:
            async with httpx.AsyncClient(timeout=20.0) as client:
                res = await client.get(url, headers={"Accept": "application/json"})
                if res.status_code != 200:
                    return []
                data = res.json()
        except Exception as e:
            logger.warning(f"[WEB_RESEARCH] India Code API failed: {e}")
            return []

        items = data if isinstance(data, list) else data.get("results") or data.get("data") or []
        evidence: List[Dict[str, Any]] = []
        for idx, item in enumerate(items[:5]):
            if not isinstance(item, dict):
                continue
            title = item.get("title") or item.get("act_name") or item.get("name") or "India Code result"
            snippet = item.get("snippet") or item.get("description") or item.get("summary") or str(item)[:500]
            link = item.get("url") or item.get("link") or item.get("source_url") or "https://www.indiacode.nic.in/"
            evidence.append(
                {
                    "citation_id": f"WEB-{idx + 1}",
                    "title": title,
                    "section": item.get("section") or item.get("chapter") or "Search result",
                    "authority": "India Code / Legislative Department",
                    "jurisdiction": "India",
                    "evidence_text": snippet[:1200],
                    "source_url": link,
                    "source_type": "OFFICIAL_WEB",
                    "retrieved_at": self._now_iso(),
                }
            )
        return evidence

    async def _fetch_official_evidence(self, query: str) -> List[Dict[str, Any]]:
        evidence = await self._fetch_india_code_results(query)
        if evidence:
            return evidence

        # Secondary official pointers when API returns empty (still query-specific labels, not legal conclusions)
        q = query.lower()
        pointers: List[Dict[str, Any]] = []
        if "passport" in q:
            pointers.append(
                {
                    "citation_id": "WEB-1",
                    "title": "Passport Seva — Ministry of External Affairs",
                    "section": "Passport application services",
                    "authority": "Ministry of External Affairs, Government of India",
                    "jurisdiction": "India",
                    "evidence_text": "Official passport applications and status are handled through the Passport Seva portal operated by MEA.",
                    "source_url": "https://portal2.passportindia.gov.in/",
                    "source_type": "OFFICIAL_WEB",
                    "retrieved_at": self._now_iso(),
                }
            )
        if "consumer" in q or "complaint" in q:
            pointers.append(
                {
                    "citation_id": "WEB-1",
                    "title": "E-Daakhil — National Consumer Helpline",
                    "section": "Online consumer complaint filing",
                    "authority": "Department of Consumer Affairs",
                    "jurisdiction": "India",
                    "evidence_text": "Consumers may file complaints through the official E-Daakhil / consumer grievance channels.",
                    "source_url": "https://edaakhil.nic.in/",
                    "source_type": "OFFICIAL_WEB",
                    "retrieved_at": self._now_iso(),
                }
            )
        return pointers

    async def process_query(self, query_text: str) -> Dict[str, Any]:
        raw_query = query_text.strip()
        logger.info(f"[WEB_RESEARCH] Processing live web query: '{raw_query}'")

        web_evidence = await self._fetch_official_evidence(raw_query)
        verification: Dict[str, Any] = {"verified": False, "issues": []}

        if not web_evidence:
            verification["issues"].append("No sufficient official web evidence retrieved.")
            return {
                "status": "unverified",
                "coverage_status": "not_available",
                "answer": (
                    "### Live Official Research\n\n"
                    "Live official-source research did not retrieve sufficient evidence for this query. "
                    "Try rephrasing with the specific Act, authority, or procedure you need."
                ),
                "citations": [],
                "evidence": [],
                "sources": [],
                "verification": verification,
            }

        assistant_content = ""
        if self.model and settings.GEMINI_API_KEY:
            context_str = "\n".join(
                f"[{c['citation_id']}] {c['title']} ({c['authority']}): {c['evidence_text']} [URL: {c.get('source_url')}]"
                for c in web_evidence
            )
            full_prompt = f"{self._get_system_prompt()}\n\nOFFICIAL EVIDENCE:\n{context_str}\n\nUSER QUESTION: {raw_query}"
            last_err = None
            for model_name in MODELS:
                try:
                    model = genai.GenerativeModel(model_name)
                    response = model.generate_content(full_prompt)
                    assistant_content = response.text.strip()
                    verification["verified"] = True
                    break
                except Exception as e:
                    last_err = e
            if not assistant_content:
                verification["issues"].append(str(last_err) if last_err else "Model failed.")
                assistant_content, _ = self._fallback_web_response(raw_query, web_evidence)
        else:
            assistant_content, _ = self._fallback_web_response(raw_query, web_evidence)
            verification["issues"].append("Model unavailable.")

        return {
            "status": "verified" if verification.get("verified") else "unverified",
            "coverage_status": "official_sources_found",
            "answer": assistant_content,
            "citations": web_evidence,
            "evidence": web_evidence,
            "sources": [c.get("source_url") for c in web_evidence if c.get("source_url")],
            "verification": verification,
        }

    def _fallback_web_response(self, query: str, evidence: List[Dict[str, Any]]):
        content = f"### Live Official Research\n\nAnswer context for: **{query}**\n\n"
        for ev in evidence:
            content += f"- **[{ev['citation_id']}] {ev['title']}**: {ev['evidence_text']}\n"
        content += "\n*See official source links below.*"
        return content, evidence

    async def compare_sources(self, rag_content: str, web_content: str, query: str) -> Dict[str, Any]:
        if not self.model:
            return {
                "available": False,
                "summary": "Comparison unavailable.",
                "agreements": [],
                "differences": [],
                "potential_conflicts": [],
                "freshness_flags": [],
                "conflicts": [],
            }

        prompt = f"""Compare these two legal answers for the query: '{query}'

[MARE-JURIS RAG ANSWER]
{rag_content}

[LIVE OFFICIAL WEB ANSWER]
{web_content}

Return ONLY JSON:
{{
  "available": true,
  "summary": "1-2 sentences",
  "agreements": [],
  "differences": [],
  "potential_conflicts": [],
  "freshness_flags": [],
  "conflicts": []
}}"""
        try:
            response = self.model.generate_content(prompt)
            raw_text = response.text
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
            logger.error(f"[COMPARE_SOURCES] Error: {e}")
            return {
                "available": False,
                "summary": "Comparison unavailable due to error.",
                "agreements": [],
                "differences": [],
                "potential_conflicts": [],
                "freshness_flags": [],
                "conflicts": [],
            }


web_research_service = WebResearchService()
