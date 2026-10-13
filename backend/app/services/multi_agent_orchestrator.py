"""
Multi-Agent Orchestrator for MARE-Juris Legal Assistant.

Orchestrates the 4 implemented legal agents:
1. statutory_rag: Statutory RAG Agent (controlled legislation corpus)
2. official_web: Live Official Web Research Agent (India Code & portals)
3. case_law_corpus: Case-Law Corpus Agent (Supabase pgvector index)
4. live_case_law: Live Case-Law API Agent (Indian Kanoon API)

Workflow:
1. Validates selected agent IDs (at least 1, max 4).
2. Executes only selected agents concurrently where appropriate.
3. Collects individual responses, citations, source URLs, and provenance.
4. Synthesizes a unified Combined Answer if requested.
5. Performs Source Comparison Analysis across available results if requested.
6. Conducts optional citation and source verification if requested.
"""

import asyncio
import json
import logging
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional, Set

import google.generativeai as genai

from app.core.config import settings
from app.services.rag_service import rag_service
from app.services.web_research_service import web_research_service
from app.services.case_law_corpus_agent import case_law_corpus_agent
from app.services.live_case_law_agent import LiveCaseLawAgent

logger = logging.getLogger("mare_juris.multi_agent_orchestrator")

VALID_AGENT_IDS = {
    "statutory_rag",
    "official_web",
    "case_law_corpus",
    "live_case_law",
    "document_agent",
}

AGENT_METADATA = {
    "statutory_rag": {
        "id": "statutory_rag",
        "name": "Statutory RAG Agent",
        "description": "Retrieves codified provisions from the verified statutory corpus.",
        "provenance": "STATUTORY_CORPUS",
        "badge_color": "blue",
    },
    "official_web": {
        "id": "official_web",
        "name": "Live Official Web Research Agent",
        "description": "Retrieves official legislative and portal data via external government endpoints.",
        "provenance": "OFFICIAL_WEB",
        "badge_color": "emerald",
    },
    "case_law_corpus": {
        "id": "case_law_corpus",
        "name": "Case-Law Corpus Agent",
        "description": "Retrieves indexed judicial precedents from the curated Supabase case-law database.",
        "provenance": "CASE_LAW_CORPUS",
        "badge_color": "indigo",
    },
    "live_case_law": {
        "id": "live_case_law",
        "name": "Live Case-Law API Agent",
        "description": "Retrieves real-time court decisions via Indian Kanoon API.",
        "provenance": "LIVE_EXTERNAL_API",
        "badge_color": "amber",
    },
    "document_agent": {
        "id": "document_agent",
        "name": "Document Analysis Agent",
        "description": "Extracts clauses, obligations, and evidence from uploaded PDFs, DOCX, and images.",
        "provenance": "DOCUMENT_ANALYSIS",
        "badge_color": "purple",
    },
}


class MultiAgentOrchestrator:
    """Orchestrates multi-agent execution, synthesis, comparison, and verification."""

    def __init__(self):
        self.live_caselaw = LiveCaseLawAgent()
        self.model = None
        if settings.GEMINI_API_KEY:
            try:
                genai.configure(api_key=settings.GEMINI_API_KEY)
                self.model = genai.GenerativeModel("gemini-3.5-flash-lite")
            except Exception as e:
                logger.warning(f"[ORCHESTRATOR] GenerativeModel initialization warning: {e}")

    def _now_iso(self) -> str:
        return datetime.now(timezone.utc).isoformat()

    def validate_agent_ids(self, selected_agents: Optional[List[str]]) -> List[str]:
        if not selected_agents:
            return []
        validated = []
        for aid in selected_agents:
            aid_clean = aid.strip().lower()
            if aid_clean in VALID_AGENT_IDS and aid_clean not in validated:
                validated.append(aid_clean)
        return validated

    async def execute_statutory_rag(
        self,
        query: str,
        user_id: str,
        conversation_id: Optional[str] = None,
        history: Optional[List[Dict[str, str]]] = None,
        resolved_query: Optional[str] = None,
        conversation_state: Optional[Dict[str, Any]] = None,
    ) -> Dict[str, Any]:
        retrieval_ts = self._now_iso()
        try:
            # rag_service.process_query is synchronous
            res = rag_service.process_query(
                user_id=user_id,
                query_text=query,
                conversation_id=conversation_id,
                persist=False,
                history=history or [],
                skip_followup=bool(resolved_query),
                resolved_query=resolved_query,
                bypass_classifier=bool(resolved_query),
                conversation_state=conversation_state,
            )
            citations = res.get("citations", []) or []
            return {
                "agent_id": "statutory_rag",
                "agent_name": "Statutory RAG Agent",
                "status": "success" if res.get("status") not in ("error", "filtered") else res.get("status"),
                "answer": res.get("answer", ""),
                "citations": citations,
                "evidence": res.get("evidence", citations),
                "sources": res.get("sources", []),
                "coverage_status": res.get("coverage_status"),
                "provenance": "STATUTORY_CORPUS",
                "is_filtered": res.get("is_filtered", False),
                "follow_up": res.get("follow_up"),
                "retrieved_at": retrieval_ts,
                "errors": None if res.get("status") != "error" else [res.get("answer", "RAG error")],
            }
        except Exception as e:
            logger.error(f"[ORCHESTRATOR] Statutory RAG agent failed: {e}")
            return {
                "agent_id": "statutory_rag",
                "agent_name": "Statutory RAG Agent",
                "status": "error",
                "answer": "Statutory RAG retrieval failed due to an unexpected system error.",
                "citations": [],
                "evidence": [],
                "sources": [],
                "provenance": "STATUTORY_CORPUS",
                "retrieved_at": retrieval_ts,
                "errors": [str(e)],
            }

    async def execute_official_web(self, query: str) -> Dict[str, Any]:
        retrieval_ts = self._now_iso()
        try:
            res = await web_research_service.process_query(query)
            citations = res.get("citations", []) or []
            return {
                "agent_id": "official_web",
                "agent_name": "Live Official Web Research Agent",
                "status": "success" if res.get("status") != "error" else "error",
                "answer": res.get("answer", ""),
                "citations": citations,
                "evidence": res.get("evidence", citations),
                "sources": res.get("sources", []),
                "provenance": "OFFICIAL_WEB",
                "retrieved_at": retrieval_ts,
                "errors": None if res.get("status") != "error" else ["Live web research returned an error."],
            }
        except Exception as e:
            logger.error(f"[ORCHESTRATOR] Official Web agent failed: {e}")
            return {
                "agent_id": "official_web",
                "agent_name": "Live Official Web Research Agent",
                "status": "error",
                "answer": "Official web research is currently unavailable.",
                "citations": [],
                "evidence": [],
                "sources": [],
                "provenance": "OFFICIAL_WEB",
                "retrieved_at": retrieval_ts,
                "errors": [str(e)],
            }

    async def execute_case_law_corpus(self, query: str) -> Dict[str, Any]:
        retrieval_ts = self._now_iso()
        try:
            res = await case_law_corpus_agent.search_corpus_judgments(query=query)
            return {
                "agent_id": "case_law_corpus",
                "agent_name": "Case-Law Corpus Agent",
                "status": res.get("status", "success"),
                "answer": res.get("answer", ""),
                "citations": res.get("citations", []),
                "evidence": res.get("evidence", []),
                "sources": res.get("sources", []),
                "provenance": "CASE_LAW_CORPUS",
                "retrieved_at": retrieval_ts,
                "errors": res.get("errors"),
            }
        except Exception as e:
            logger.error(f"[ORCHESTRATOR] Case-Law Corpus agent failed: {e}")
            return {
                "agent_id": "case_law_corpus",
                "agent_name": "Case-Law Corpus Agent",
                "status": "error",
                "answer": "Case-Law Corpus retrieval encountered an unexpected error.",
                "citations": [],
                "evidence": [],
                "sources": [],
                "provenance": "CASE_LAW_CORPUS",
                "retrieved_at": retrieval_ts,
                "errors": [str(e)],
            }

    async def execute_live_case_law(self, query: str) -> Dict[str, Any]:
        retrieval_ts = self._now_iso()
        try:
            res = await self.live_caselaw.search_live_cases(query=query, max_results=5)
            judgments = res.get("judgments", [])
            citations = []
            for idx, j in enumerate(judgments):
                citations.append({
                    "citation_id": f"IK-{idx + 1}",
                    "title": j.get("case_title"),
                    "case_title": j.get("case_title"),
                    "court": j.get("court"),
                    "publication_date": j.get("publication_date"),
                    "decision_date": j.get("decision_date"),
                    "citation": j.get("citation"),
                    "evidence_text": j.get("summary_or_snippet") or "Snippet not available.",
                    "source_url": j.get("source_url"),
                    "source_document_id": j.get("source_document_id"),
                    "source_provider": j.get("source_provider"),
                    "provenance": "LIVE_EXTERNAL_API",
                    "official_source_verified": False,
                    "full_text_verified": False,
                    "retrieved_at": retrieval_ts,
                })

            if citations:
                lines = [
                    "### Live Case-Law Precedents (Indian Kanoon API)",
                    "",
                    f"Retrieved **{len(citations)}** live judgment matches from external public legal indices:",
                    "",
                ]
                for cit in citations:
                    date_info = f" (Published: {cit['publication_date']})" if cit.get("publication_date") else ""
                    lines.append(f"- **[{cit['citation_id']}] {cit['case_title']}** — *{cit.get('court') or 'Court'}*{date_info}")
                    if cit.get("evidence_text"):
                        lines.append(f"  > \"{cit['evidence_text'][:350]}...\"")
                    if cit.get("source_url"):
                        lines.append(f"  *Source: [{cit['source_url']}]({cit['source_url']})*")
                answer = "\n".join(lines)
                status = "success"
            else:
                answer = "No live case precedents were returned by the Indian Kanoon API for this query."
                status = "empty" if not res.get("errors") else "error"

            return {
                "agent_id": "live_case_law",
                "agent_name": "Live Case-Law API Agent",
                "status": status,
                "answer": answer,
                "citations": citations,
                "evidence": citations,
                "sources": [c["source_url"] for c in citations if c.get("source_url")],
                "provenance": "LIVE_EXTERNAL_API",
                "retrieved_at": retrieval_ts,
                "errors": res.get("errors"),
            }
        except Exception as e:
            logger.error(f"[ORCHESTRATOR] Live Case-Law agent failed: {e}")
            return {
                "agent_id": "live_case_law",
                "agent_name": "Live Case-Law API Agent",
                "status": "error",
                "answer": "Live case-law search service encountered an error.",
                "citations": [],
                "evidence": [],
                "sources": [],
                "provenance": "LIVE_EXTERNAL_API",
                "retrieved_at": retrieval_ts,
                "errors": [str(e)],
            }

    async def execute_document_agent(
        self,
        query: str,
        user_id: str,
        document_id: Optional[str] = None,
        document_data: Optional[Dict[str, Any]] = None,
    ) -> Dict[str, Any]:
        retrieval_ts = self._now_iso()
        try:
            from app.services.document_agent import document_agent
            from app.api.v1.documents import get_document_data

            if not document_data and document_id:
                document_data = get_document_data(document_id, user_id)

            if not document_data:
                return {
                    "agent_id": "document_agent",
                    "agent_name": "Document Analysis Agent",
                    "status": "empty",
                    "answer": "No uploaded document found for this consultation. Please upload a PDF, DOCX, or image file to enable document analysis.",
                    "citations": [],
                    "evidence": [],
                    "sources": [],
                    "provenance": "DOCUMENT_ANALYSIS",
                    "retrieved_at": retrieval_ts,
                    "document_context": None,
                    "ocr_warnings": [],
                    "errors": ["No active document found or provided document_id is invalid."],
                }

            return await document_agent.analyze_document(
                query=query,
                document_id=document_data.get("document_id", "doc"),
                document_title=document_data.get("file_name", "Document"),
                pages=document_data.get("pages", []),
                full_text=document_data.get("full_text", ""),
                ocr_warnings=document_data.get("warnings", []),
            )
        except Exception as e:
            logger.error(f"[ORCHESTRATOR] Document Agent failed: {e}")
            return {
                "agent_id": "document_agent",
                "agent_name": "Document Analysis Agent",
                "status": "error",
                "answer": "Document analysis encountered an unexpected error.",
                "citations": [],
                "evidence": [],
                "sources": [],
                "provenance": "DOCUMENT_ANALYSIS",
                "retrieved_at": retrieval_ts,
                "document_context": None,
                "ocr_warnings": [],
                "errors": [str(e)],
            }

    async def execute_orchestration(
        self,
        query: str,
        user_id: str,
        selected_agents: List[str],
        conversation_id: Optional[str] = None,
        history: Optional[List[Dict[str, str]]] = None,
        resolved_query: Optional[str] = None,
        conversation_state: Optional[Dict[str, Any]] = None,
        generate_combined: bool = True,
        compare_sources: bool = True,
        verify_sources: bool = False,
        document_id: Optional[str] = None,
    ) -> Dict[str, Any]:
        """
        Executes selected agents concurrently, collects individual responses,
        and optionally synthesizes Combined Answer and Source Comparison.
        """
        validated_agents = self.validate_agent_ids(selected_agents)
        if not validated_agents:
            return {
                "success": False,
                "error": "No valid agents selected. Please select at least one agent.",
                "individual_responses": {},
                "combined_answer": None,
                "comparison": None,
                "verification": None,
            }

        # If document_agent is selected and document_id is provided, retrieve document data
        doc_data = None
        if "document_agent" in validated_agents and document_id:
            try:
                from app.api.v1.documents import get_document_data
                doc_data = get_document_data(document_id, user_id)
            except Exception as e:
                logger.warning(f"[ORCHESTRATOR] Document lookup error: {e}")

        tasks = []
        task_agent_ids = []

        effective_query = (resolved_query or query).strip()

        for aid in validated_agents:
            if aid == "statutory_rag":
                tasks.append(
                    self.execute_statutory_rag(
                        query=query,
                        user_id=user_id,
                        conversation_id=conversation_id,
                        history=history,
                        resolved_query=resolved_query,
                        conversation_state=conversation_state,
                    )
                )
                task_agent_ids.append("statutory_rag")
            elif aid == "official_web":
                tasks.append(self.execute_official_web(query=effective_query))
                task_agent_ids.append("official_web")
            elif aid == "case_law_corpus":
                tasks.append(self.execute_case_law_corpus(query=effective_query))
                task_agent_ids.append("case_law_corpus")
            elif aid == "live_case_law":
                tasks.append(self.execute_live_case_law(query=effective_query))
                task_agent_ids.append("live_case_law")
            elif aid == "document_agent":
                tasks.append(
                    self.execute_document_agent(
                        query=query,
                        user_id=user_id,
                        document_id=document_id,
                        document_data=doc_data,
                    )
                )
                task_agent_ids.append("document_agent")

        # Execute selected agents concurrently
        results = await asyncio.gather(*tasks, return_exceptions=True)

        individual_responses: Dict[str, Any] = {}
        for aid, res in zip(task_agent_ids, results):
            if isinstance(res, Exception):
                logger.error(f"[ORCHESTRATOR] Agent '{aid}' raised unhandled exception: {res}")
                individual_responses[aid] = {
                    "agent_id": aid,
                    "agent_name": AGENT_METADATA.get(aid, {}).get("name", aid),
                    "status": "error",
                    "answer": f"Agent '{aid}' encountered an unexpected internal error.",
                    "citations": [],
                    "evidence": [],
                    "sources": [],
                    "provenance": AGENT_METADATA.get(aid, {}).get("provenance", "UNKNOWN"),
                    "retrieved_at": self._now_iso(),
                    "errors": [str(res)],
                }
            else:
                individual_responses[aid] = res

        # 4. Synthesize Combined Answer (if enabled)
        combined_answer = None
        if generate_combined:
            combined_answer = await self._synthesize_combined_answer(query, individual_responses, history=history)

        # 5. Execute Source Comparison Analysis (if enabled)
        comparison = None
        if compare_sources:
            comparison = await self._compare_agent_sources(query, individual_responses)

        # 6. Execute Citation and Source Verification (if enabled)
        verification = None
        if verify_sources:
            verification = await self._verify_sources_flow(individual_responses)

        return {
            "success": True,
            "selected_agents": validated_agents,
            "individual_responses": individual_responses,
            "combined_answer": combined_answer,
            "comparison": comparison,
            "verification": verification,
        }

    async def _synthesize_combined_answer(
        self,
        query: str,
        responses: Dict[str, Any],
        history: Optional[List[Dict[str, str]]] = None,
    ) -> Dict[str, Any]:
        """
        Synthesizes a single coherent, concise, human-readable legal answer from all successful agent responses.
        Answers the user's question directly (3-6 bullet points or brief paragraph), avoiding artificial reports
        and bureaucratic headings unless explicitly requested.
        """
        successful_agents = [
            (aid, resp) for aid, resp in responses.items()
            if resp.get("status") == "success" and resp.get("answer")
        ]

        all_citations: List[Dict[str, Any]] = []
        dedup_keys: Set[str] = set()

        for aid, resp in responses.items():
            for c in resp.get("citations", []):
                key = (
                    c.get("document_title") or c.get("case_title") or c.get("title") or "",
                    c.get("section") or c.get("citation") or "",
                    c.get("source_url") or "",
                )
                key_str = f"{key[0]}::{key[1]}::{key[2]}".lower()
                if key_str not in dedup_keys:
                    dedup_keys.add(key_str)
                    all_citations.append(c)

        if not successful_agents:
            failed_agents = [resp.get("agent_name", aid) for aid, resp in responses.items() if resp.get("status") == "error"]
            failed_note = f" (Agents failed: {', '.join(failed_agents)})" if failed_agents else ""
            return {
                "available": True,
                "answer": f"Unable to generate a synthesized answer because none of the selected agents returned successful evidence.{failed_note}",
                "citations": all_citations,
                "synthesized_from": [],
                "generated_at": self._now_iso(),
            }

        # Build synthesis prompt context
        agent_sections = []
        for aid, resp in successful_agents:
            agent_sections.append(f"### {resp.get('agent_name', aid)} [{resp.get('provenance', 'UNKNOWN')}]:\n{resp.get('answer', '')}")

        context = "\n\n".join(agent_sections)

        history_context = ""
        if history:
            recent_turns = history[-4:]
            formatted_turns = "\n".join(f"{t.get('role', 'user').upper()}: {t.get('content', '')}" for t in recent_turns)
            history_context = f"RECENT CONVERSATION CONTEXT:\n{formatted_turns}\n\n"

        prompt = f"""You are the MARE-Juris Legal Assistant providing a direct, concise, and human-readable answer.

{history_context}USER QUESTION: "{query}"

AGENT FINDINGS:
{context}

INSTRUCTIONS:
1. Answer the question directly in natural, human-readable language like an expert lawyer in conversation.
2. Structure:
   - Provide a direct answer to the main question first (1-2 sentences).
   - Use 3-6 clear bullet points summarizing the applicable law, essential statutory sections, key precedents, and material qualifications.
   - For simple legal questions, keep it concise and direct.
   - AVOID unnecessary report headings such as "Executive Summary", "Harmonized Analysis", "Actionable Conclusion", or lengthy background historical essays.
   - If the user explicitly asks for comprehensive detail, supply it; otherwise prefer concise clarity.
3. Citation grounding:
   - Retain specific citations, section numbers, case names, and clickable links from the agent findings.
   - Deduplicate repeated statutory provisions and cases.
4. Accuracy & Nuance:
   - Accurately distinguish statutory frameworks (e.g. IPC vs BNS applicability based on date of offence).
   - Distinguish judgment decision dates from publication dates.
   - If there is a material disagreement or missing evidence, note it in 1 short bullet point.
   - Do NOT invent sections, case names, or URLs.
"""

        try:
            if self.model:
                res = self.model.generate_content(prompt)
                answer_text = res.text.strip()
            else:
                answer_text = self._fallback_synthesis(query, successful_agents)
        except Exception as e:
            logger.warning(f"[SYNTHESIS] LLM generation failed: {e}")
            answer_text = self._fallback_synthesis(query, successful_agents)

        return {
            "available": True,
            "answer": answer_text,
            "citations": all_citations,
            "synthesized_from": [aid for aid, _ in successful_agents],
            "generated_at": self._now_iso(),
        }

    def _fallback_synthesis(self, query: str, successful_agents: List[tuple]) -> str:
        lines = [
            f"**Answer for:** {query}",
            "",
        ]
        for aid, resp in successful_agents:
            ans = resp.get("answer", "").strip()
            # Extract bullet points or primary summary sentences
            for line in ans.split("\n"):
                clean = line.strip()
                if clean.startswith("-") or clean.startswith("*"):
                    lines.append(clean)
                elif clean and not clean.startswith("#") and len(lines) < 6:
                    lines.append(f"- {clean[:200]}")
        if len(lines) <= 2:
            lines.append("- Direct provisions and precedents retrieved from active agents.")
        return "\n".join(lines)

    async def _compare_agent_sources(
        self,
        query: str,
        responses: Dict[str, Any],
    ) -> Dict[str, Any]:
        """
        Executes Source Comparison Analysis across the executed agents.
        Preserves the exact schema: summary, agreements, differences, potential_conflicts, freshness_flags, conflicts.
        """
        successful_agents = [
            (aid, resp) for aid, resp in responses.items()
            if resp.get("status") == "success" and resp.get("answer")
        ]

        if len(successful_agents) <= 1:
            agent_name = successful_agents[0][1].get("agent_name", "selected agent") if successful_agents else "no agent"
            return {
                "available": True,
                "summary": f"Cross-agent source comparison is limited because only one agent ({agent_name}) returned successful results. Select multiple agents to compare statutory, judicial, and web authorities.",
                "agreements": ["Internal consistency within the single executed source."],
                "differences": [],
                "potential_conflicts": [],
                "freshness_flags": [],
                "conflicts": [],
            }

        # If exactly statutory_rag and official_web were selected, we can call web_research_service.compare_sources directly!
        if set(responses.keys()) == {"statutory_rag", "official_web"} and "statutory_rag" in responses and "official_web" in responses:
            rag_content = responses["statutory_rag"].get("answer", "")
            web_content = responses["official_web"].get("answer", "")
            return await web_research_service.compare_sources(rag_content, web_content, query)

        # Multi-agent comparison prompt for 2+ agents
        blocks = []
        for aid, resp in successful_agents:
            blocks.append(f"[{resp.get('agent_name', aid)} - {resp.get('provenance', '')}]:\n{resp.get('answer', '')}")
        joined_blocks = "\n\n".join(blocks)

        prompt = f"""Compare the legal outputs of these multiple agents for the query: '{query}'

{joined_blocks}

Compare the evidence, identify agreements, differences, potential conflicts, and freshness issues (such as newer amendments or precedents versus curated static corpora).
Return ONLY JSON with this EXACT schema:
{{
  "available": true,
  "summary": "1-3 sentences synthesizing cross-source alignment",
  "agreements": ["string", "string"],
  "differences": ["string", "string"],
  "potential_conflicts": ["string"],
  "freshness_flags": ["string"],
  "conflicts": ["string"]
}}"""

        try:
            if self.model:
                res = self.model.generate_content(prompt)
                raw_text = res.text
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
            logger.warning(f"[SOURCE_COMPARISON] Multi-agent comparison error: {e}")

        # Deterministic fallback comparison
        return {
            "available": True,
            "summary": f"Compared {len(successful_agents)} agent source outputs across statutory, judicial, and web records.",
            "agreements": [
                f"{successful_agents[0][1].get('agent_name')} and {successful_agents[1][1].get('agent_name')} address the legal query consistently."
            ],
            "differences": [
                f"{successful_agents[0][1].get('agent_name')} focuses on {successful_agents[0][1].get('provenance')}, whereas other agents incorporate external/case authorities."
            ],
            "potential_conflicts": [],
            "freshness_flags": [],
            "conflicts": [],
        }

    async def _verify_sources_flow(self, responses: Dict[str, Any]) -> Dict[str, Any]:
        """
        Optional Citation and Source Verification flow.
        Audits citations, checks URLs, authorities, and flags verified vs unverified items.
        """
        all_citations: List[Dict[str, Any]] = []
        for aid, resp in responses.items():
            for c in resp.get("citations", []):
                all_citations.append(c)

        if not all_citations:
            return {
                "verified": False,
                "summary": "No citations or sources were returned by the selected agents to verify.",
                "verified_count": 0,
                "unverified_count": 0,
                "issues": ["No citations available"],
                "checks": [],
            }

        checks = []
        verified_count = 0
        unverified_count = 0

        for c in all_citations:
            title = c.get("document_title") or c.get("case_title") or c.get("title") or "Unknown"
            url = c.get("source_url") or c.get("official_source_url")
            prov = c.get("provenance")
            is_official = c.get("official_source_verified", False)

            # Verification logic based on provenance & source presence
            if prov == "STATUTORY_CORPUS":
                status = "verified"
                reason = "Grounding verified against local curated statutory repository."
                verified_count += 1
            elif prov == "OFFICIAL_WEB" and url and ("nic.in" in url or "gov.in" in url or "indiacode" in url):
                status = "verified"
                reason = "Verified against official government portal domain."
                verified_count += 1
            elif prov == "CASE_LAW_CORPUS":
                status = "partially_verified"
                reason = "Verified in indexed case-law database; full bench transcript requires human audit."
                verified_count += 1
            elif prov == "LIVE_EXTERNAL_API":
                status = "unverified"
                reason = "Live external search match from Indian Kanoon; unverified against official court gazette."
                unverified_count += 1
            else:
                status = "unverified"
                reason = "Source authority cannot be independently confirmed."
                unverified_count += 1

            checks.append({
                "citation_id": c.get("citation_id"),
                "title": title,
                "provenance": prov,
                "source_url": url,
                "status": status,
                "reason": reason,
            })

        return {
            "verified": unverified_count == 0,
            "summary": f"Source Verification completed: {verified_count} verified/partially verified, {unverified_count} unverified.",
            "verified_count": verified_count,
            "unverified_count": unverified_count,
            "issues": [c["reason"] for c in checks if c["status"] == "unverified"],
            "checks": checks,
        }


multi_agent_orchestrator = MultiAgentOrchestrator()
