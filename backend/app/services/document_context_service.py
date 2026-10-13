"""
Document Context Synthesis Service for MARE-Juris.

Synthesizes query-relevant context from extracted legal documents:
1. Understands user's question about the document.
2. Identifies relevant clauses, facts, parties, obligations, dates, amounts, and legal issues.
3. Produces compact, structured, query-relevant context for multi-agent co-retrieval.
4. Preserves exact supporting excerpts and 1-indexed page references.
5. Identifies unresolved questions and missing evidence.
6. Verifies cited excerpts against the source text to prevent hallucinated citations.
"""

import json
import logging
from typing import Dict, List, Any, Optional, Tuple
from datetime import datetime, timezone

from pydantic import BaseModel, Field
import google.generativeai as genai

from app.core.config import settings

logger = logging.getLogger("mare_juris.document_context_service")


class ClauseExcerpt(BaseModel):
    clause_title: str = Field(description="Name or heading of the clause/provision, e.g. 'Clause 4: Indemnification'")
    page_number: int = Field(description="1-indexed page number where the clause appears")
    excerpt: str = Field(description="Verbatim text excerpt from the document supporting this clause")
    relevance: str = Field(description="Brief note on why this clause is relevant to the user's query")


class DocumentContextPackage(BaseModel):
    query: str
    document_title: str
    relevant_facts: List[str] = Field(default_factory=list, description="Key factual premises extracted from the document")
    relevant_clauses: List[ClauseExcerpt] = Field(default_factory=list, description="Key clauses cited verbatim with page numbers")
    parties: List[str] = Field(default_factory=list, description="Identified legal entities or parties")
    obligations: List[str] = Field(default_factory=list, description="Key rights, liabilities, and obligations")
    dates_and_amounts: List[str] = Field(default_factory=list, description="Crucial dates, deadlines, and financial amounts")
    issues_requiring_external_research: List[str] = Field(
        default_factory=list,
        description="Legal issues or statutory questions that require external verification (statutory/case-law)"
    )
    search_keywords_for_agents: List[str] = Field(
        default_factory=list,
        description="Focused legal keywords/sections for Statutory RAG and Case-Law Corpus agents"
    )
    uncertainty_warnings: List[str] = Field(
        default_factory=list,
        description="Any ambiguities, illegible/OCR issues, or missing clauses"
    )
    direct_answer_summary: str = Field(
        description="Direct, concise answer to the user's inquiry based strictly on the document text"
    )


class DocumentContextService:
    """Extracts structured legal intelligence and query-focused context from documents."""

    def __init__(self):
        self.model = None
        if settings.GEMINI_API_KEY:
            try:
                genai.configure(api_key=settings.GEMINI_API_KEY)
                self.model = genai.GenerativeModel("gemini-3.5-flash-lite")
            except Exception as e:
                logger.warning(f"[DOC_CONTEXT] Gemini initialization warning: {e}")

    def _now_iso(self) -> str:
        return datetime.now(timezone.utc).isoformat()

    def select_relevant_pages(
        self,
        pages: List[Dict[str, Any]],
        query: str,
        max_chars: int = 18000,
    ) -> List[Dict[str, Any]]:
        """
        For long documents, selects the most relevant pages using keyword overlap and section cues.
        For short documents (under max_chars), returns all pages.
        """
        total_len = sum(len(p.get("text", "")) for p in pages)
        if total_len <= max_chars:
            return pages

        query_terms = set(re_term.lower() for re_term in query.split() if len(re_term) > 2)

        scored_pages = []
        for p in pages:
            text_lower = p.get("text", "").lower()
            score = sum(text_lower.count(term) for term in query_terms)
            # Give slight weight to first 2 pages (definitions, parties) and last page (signatures)
            if p.get("page_number", 0) in (1, 2, len(pages)):
                score += 1
            scored_pages.append((score, p))

        # Sort by score descending, then reconstruct in natural page order
        scored_pages.sort(key=lambda x: x[0], reverse=True)
        selected = []
        accumulated_chars = 0
        for _, p in scored_pages:
            p_len = len(p.get("text", ""))
            if accumulated_chars + p_len <= max_chars or not selected:
                selected.append(p)
                accumulated_chars += p_len
            if accumulated_chars >= max_chars:
                break

        # Re-sort into ascending page order
        selected.sort(key=lambda x: x.get("page_number", 0))
        return selected

    def verify_excerpts_in_source(
        self,
        clauses: List[ClauseExcerpt],
        full_document_text: str,
        pages: List[Dict[str, Any]],
    ) -> Tuple[List[ClauseExcerpt], List[str]]:
        """
        Grounding verification: Checks if cited excerpts exist in the source document.
        Flags hallucinations and corrects page numbers if excerpt appears on a different page.
        """
        verified_clauses: List[ClauseExcerpt] = []
        warnings: List[str] = []
        normalized_full = full_document_text.lower().replace("\n", " ")

        for c in clauses:
            clean_excerpt = c.excerpt.strip()
            if not clean_excerpt:
                continue

            # Check normalized substring
            clean_norm = clean_excerpt.lower().replace("\n", " ")
            # Take a 30-char slice in case of minor whitespace mismatch
            search_anchor = clean_norm[:40] if len(clean_norm) >= 40 else clean_norm

            if search_anchor in normalized_full:
                # Excerpt exists in source; verify page number
                actual_page = c.page_number
                for p in pages:
                    p_text_norm = p.get("text", "").lower().replace("\n", " ")
                    if search_anchor in p_text_norm:
                        actual_page = p.get("page_number", c.page_number)
                        break

                verified_clauses.append(
                    ClauseExcerpt(
                        clause_title=c.clause_title,
                        page_number=actual_page,
                        excerpt=clean_excerpt,
                        relevance=c.relevance,
                    )
                )
            else:
                warnings.append(
                    f"Excerpt under '{c.clause_title}' could not be verbatim matched against the document text (possible LLM paraphrase)."
                )
                verified_clauses.append(c)

        return verified_clauses, warnings

    async def synthesize_document_context(
        self,
        query: str,
        document_name: str,
        pages: List[Dict[str, Any]],
        full_text: str,
        ocr_warnings: Optional[List[str]] = None,
    ) -> DocumentContextPackage:
        """
        Synthesizes structured, query-relevant context using Gemini.
        Falls back gracefully if LLM is offline or quota is exceeded.
        """
        relevant_pages = self.select_relevant_pages(pages, query)
        page_snippets = []
        for p in relevant_pages:
            page_snippets.append(f"--- [PAGE {p.get('page_number', 1)}] ---\n{p.get('text', '')}")

        document_context_block = "\n\n".join(page_snippets)

        prompt = f"""You are a specialized legal document analysis engine in MARE-Juris.
Analyze the following uploaded legal document to address the user's specific inquiry.

DOCUMENT NAME: "{document_name}"
USER INQUIRY: "{query}"

EXTRACTED DOCUMENT PAGES:
{document_context_block}

INSTRUCTIONS:
1. Identify factual premises, parties, clauses, obligations, dates, and financial figures relevant to the inquiry.
2. For EVERY clause cited, provide the EXACT VERBATIM excerpt from the document and the accurate 1-indexed PAGE NUMBER.
3. Formulate specific legal issues that would require statutory verification (e.g. Indian Contract Act, Arbitration Act, Companies Act) or case-law research.
4. Extract 3-5 focused search keywords/provisions that research agents can search for.
5. Provide a direct, concise answer summarizing what the document states regarding the query.
6. Return strictly valid JSON adhering to the following schema:
{{
    "query": "{query}",
    "document_title": "{document_name}",
    "relevant_facts": ["fact 1", "fact 2"],
    "relevant_clauses": [
        {{
            "clause_title": "Clause Name",
            "page_number": 1,
            "excerpt": "Verbatim quote from text...",
            "relevance": "Why relevant"
        }}
    ],
    "parties": ["Party A", "Party B"],
    "obligations": ["Obligation 1", "Obligation 2"],
    "dates_and_amounts": ["Effective date: ...", "Fee: ..."],
    "issues_requiring_external_research": ["Whether limitation applies...", "Enforceability under Section 27"],
    "search_keywords_for_agents": ["Section 27 Indian Contract Act restraint of trade", "arbitration clause notice"],
    "uncertainty_warnings": [],
    "direct_answer_summary": "Direct summary..."
}}
"""

        raw_json = None
        if self.model:
            try:
                response = self.model.generate_content(
                    prompt,
                    generation_config={"response_mime_type": "application/json"}
                )
                raw_json = response.text.strip()
            except Exception as e:
                logger.warning(f"[DOC_CONTEXT] Gemini synthesis call failed ({e}); using heuristic fallback.")

        pkg = None
        if raw_json:
            try:
                data = json.loads(raw_json)
                pkg = DocumentContextPackage(**data)
            except Exception as parse_err:
                logger.warning(f"[DOC_CONTEXT] Failed to parse JSON ({parse_err}); falling back.")

        if not pkg:
            pkg = self._fallback_context_synthesis(query, document_name, pages, full_text)

        # Append any existing OCR warnings
        if ocr_warnings:
            pkg.uncertainty_warnings.extend(ocr_warnings)

        # Grounding verification of clause excerpts
        verified_clauses, excerpt_warns = self.verify_excerpts_in_source(
            pkg.relevant_clauses, full_text, pages
        )
        pkg.relevant_clauses = verified_clauses
        if excerpt_warns:
            pkg.uncertainty_warnings.extend(excerpt_warns)

        return pkg

    def _fallback_context_synthesis(
        self,
        query: str,
        document_name: str,
        pages: List[Dict[str, Any]],
        full_text: str,
    ) -> DocumentContextPackage:
        """
        Deterministic heuristic fallback when LLM is unavailable or quota exhausted.
        """
        facts = []
        clauses = []
        first_page = pages[0].get("text", "") if pages else ""

        # Extract basic parties or headings
        lines = [line.strip() for line in first_page.split("\n") if line.strip()]
        if lines:
            facts.append(f"Document header: {lines[0][:150]}")

        # Check for clause numbers
        for p in pages[:5]:
            p_text = p.get("text", "")
            p_num = p.get("page_number", 1)
            for m in ["clause", "section", "article", "agreement", "party"]:
                if m in p_text.lower():
                    # Extract sample paragraph
                    paras = p_text.split("\n\n")
                    for para in paras:
                        if m in para.lower() and len(para.strip()) > 30:
                            clauses.append(
                                ClauseExcerpt(
                                    clause_title=f"Referenced {m.title()}",
                                    page_number=p_num,
                                    excerpt=para.strip()[:250],
                                    relevance="Contains relevant operational terms matching query context.",
                                )
                            )
                            break
                    if len(clauses) >= 3:
                        break

        summary = (
            f"Extracted document '{document_name}' contains {len(pages)} pages. "
            f"Text analysis was conducted for query: '{query}'."
        )

        return DocumentContextPackage(
            query=query,
            document_title=document_name,
            relevant_facts=facts or [f"Document contains {len(pages)} pages of text."],
            relevant_clauses=clauses,
            parties=[],
            obligations=[],
            dates_and_amounts=[],
            issues_requiring_external_research=[
                f"Statutory enforceability of terms in {document_name} regarding '{query}'"
            ],
            search_keywords_for_agents=[query],
            uncertainty_warnings=[
                "Generated using deterministic extraction fallback due to LLM rate/quota status."
            ],
            direct_answer_summary=summary,
        )


document_context_service = DocumentContextService()
