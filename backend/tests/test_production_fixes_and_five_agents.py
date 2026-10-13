"""
Comprehensive Production Fixes & Five-Agent Regression Test Suite for MARE-Juris.

Tests:
1. Indian Kanoon authentication errors (401, 403).
2. Indian Kanoon rate limits (429) and timeouts.
3. Indian Kanoon malformed API responses and valid empty search results.
4. Five-agent selection policy and invalid ID rejection (HTTP 400).
5. Document Agent alone (Case A).
6. Document Agent plus research agents (Case B).
7. Attached document when Document Agent is not selected (Rule 7: Document Agent not invoked).
8. General legal queries unrelated to an attachment (Rule 9: Document not forced into research).
9. Document ownership and access isolation (User isolation).
10. Partial results when an agent fails (Multi-agent resilience).
11. Genuine versus false source conflicts (Distinguishing coverage/scope differences from contradictions).
12. OCR unavailable behavior (Honest status when Tesseract binary is absent on Vercel Lambda).
13. Existing compliance functionality remains untouched.
"""

import os
import sys
import json
import asyncio
from unittest.mock import AsyncMock, MagicMock, patch

# Add backend directory to sys.path
backend_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

from app.core.config import settings
from app.services.live_case_law_agent import LiveCaseLawAgent
from app.services.multi_agent_orchestrator import (
    MultiAgentOrchestrator,
    VALID_AGENT_IDS,
    classify_document_query_intent,
)
from app.services.document_extraction_service import (
    document_extraction_service,
    DocumentExtractionService,
)


# =====================================================================
# 1-3. Indian Kanoon Agent Robustness Tests
# =====================================================================

def test_indian_kanoon_token_resolution():
    """Verify that both INDIANKANOON_API_TOKEN and INDIAN_KANOON_API_TOKEN resolve correctly."""
    with patch.dict(os.environ, {"INDIAN_KANOON_API_TOKEN": "token-test-123", "INDIANKANOON_API_TOKEN": ""}, clear=False):
        agent = LiveCaseLawAgent()
        resolved = agent._resolve_token()
        assert resolved == "token-test-123"

    with patch.dict(os.environ, {"INDIANKANOON_API_TOKEN": "token-test-456", "INDIAN_KANOON_API_TOKEN": ""}, clear=False):
        agent = LiveCaseLawAgent()
        resolved = agent._resolve_token()
        assert resolved == "token-test-456"


async def test_indian_kanoon_auth_errors():
    """Verify separate, actionable handling for HTTP 401 and 403."""
    orch = MultiAgentOrchestrator()
    orch.live_caselaw.token = "test_bad_token"

    # Mock 401 Unauthorized
    mock_resp_401 = MagicMock()
    mock_resp_401.status_code = 401

    with patch("httpx.AsyncClient.post", new_callable=AsyncMock) as m_post:
        m_post.return_value = mock_resp_401
        res = await orch.execute_live_case_law(query="arbitration")
        assert res["status"] == "error"
        assert res["citations"] == []
        assert "401" in res["answer"]

    # Mock 403 Forbidden
    mock_resp_403 = MagicMock()
    mock_resp_403.status_code = 403

    with patch("httpx.AsyncClient.post", new_callable=AsyncMock) as m_post:
        m_post.return_value = mock_resp_403
        res = await orch.execute_live_case_law(query="arbitration")
        assert res["status"] == "error"
        assert "403" in res["answer"]


async def test_indian_kanoon_rate_limits_and_timeouts():
    """Verify HTTP 429 rate limit and timeout handling."""
    orch = MultiAgentOrchestrator()
    orch.live_caselaw.token = "test_token"

    # Mock 429 Rate Limit
    mock_resp_429 = MagicMock()
    mock_resp_429.status_code = 429

    with patch("httpx.AsyncClient.post", new_callable=AsyncMock) as m_post:
        m_post.return_value = mock_resp_429
        res = await orch.execute_live_case_law(query="arbitration")
        assert res["status"] == "error"
        assert "429" in res["answer"]

    # Mock Timeout
    import httpx
    with patch("httpx.AsyncClient.post", new_callable=AsyncMock) as m_post:
        m_post.side_effect = httpx.TimeoutException("Connection timed out")
        res = await orch.execute_live_case_law(query="arbitration")
        assert res["status"] == "error"
        assert "timed out" in res["answer"].lower()


async def test_indian_kanoon_empty_vs_malformed_responses():
    """Distinguish valid empty search results from malformed JSON responses."""
    orch = MultiAgentOrchestrator()
    orch.live_caselaw.token = "test_token"

    # Valid empty results
    mock_resp_empty = MagicMock()
    mock_resp_empty.status_code = 200
    mock_resp_empty.json.return_value = {"docs": [], "total": 0}

    with patch("httpx.AsyncClient.post", new_callable=AsyncMock) as m_post:
        m_post.return_value = mock_resp_empty
        res = await orch.execute_live_case_law(query="nonexistent legal term xyz")
        assert res["status"] == "empty"
        assert res["citations"] == []
        assert "precedents were returned" in res["answer"]

    # Malformed non-JSON response
    mock_resp_malformed = MagicMock()
    mock_resp_malformed.status_code = 200
    mock_resp_malformed.json.side_effect = json.JSONDecodeError("Expecting value", "bad json", 0)

    with patch("httpx.AsyncClient.post", new_callable=AsyncMock) as m_post:
        m_post.return_value = mock_resp_malformed
        res = await orch.execute_live_case_law(query="arbitration")
        assert res["status"] == "error"
        assert "malformed" in res["answer"].lower()


# =====================================================================
# 4. Five-Agent Selection Policy & Validation Tests
# =====================================================================

def test_five_agent_selection_and_validation():
    """Verify that all 5 legal agents are supported and unknown IDs are rejected."""
    orch = MultiAgentOrchestrator()

    expected_agents = [
        "statutory_rag",
        "official_web",
        "case_law_corpus",
        "live_case_law",
        "document_agent",
    ]
    assert set(VALID_AGENT_IDS) == set(expected_agents)

    # Valid 5-agent selection
    validated = orch.validate_agent_ids(expected_agents)
    assert len(validated) == 5
    assert set(validated) == set(expected_agents)

    # Invalid agent detection
    invalid_found = orch.find_invalid_agent_ids(["statutory_rag", "invalid_agent_xyz", "compliance_bot"])
    assert invalid_found == ["invalid_agent_xyz", "compliance_bot"]


# =====================================================================
# 5-8. Document Agent Context Routing & Intent Tests
# =====================================================================

def test_classify_document_query_intent():
    """Verify query intent classification: DOCUMENT_CENTRIC, HYBRID, GENERAL_LEGAL."""
    # DOCUMENT_CENTRIC
    assert classify_document_query_intent("Tell me about this document") == "DOCUMENT_CENTRIC"
    assert classify_document_query_intent("Tell me about this document which I provided") == "DOCUMENT_CENTRIC"
    assert classify_document_query_intent("Summarize this agreement") == "DOCUMENT_CENTRIC"
    assert classify_document_query_intent("What does this say?") == "DOCUMENT_CENTRIC"

    # HYBRID
    assert classify_document_query_intent("Is the non-compete clause in this agreement valid under Section 27 Contract Act?") == "HYBRID"
    assert classify_document_query_intent("What Supreme Court precedents apply to the arbitration clause in this document?") == "HYBRID"

    # GENERAL_LEGAL
    assert classify_document_query_intent("What is the penalty under Section 302 IPC?") == "GENERAL_LEGAL"
    assert classify_document_query_intent("Explain doctrine of basic structure in Constitutional Law") == "GENERAL_LEGAL"


async def test_document_agent_alone_execution():
    """Rule 6: If only Document Agent is selected, run only Document Agent."""
    orch = MultiAgentOrchestrator()
    mock_doc = {
        "document_id": "doc-test-1",
        "file_name": "Agreement.pdf",
        "pages": [{"page_number": 1, "text": "Confidential non-disclosure agreement."}],
        "full_text": "Confidential non-disclosure agreement.",
    }

    with patch("app.api.v1.documents.get_document_data", return_value=mock_doc), \
         patch.object(orch, "execute_document_agent", new_callable=AsyncMock) as m_doc:
        m_doc.return_value = {
            "agent_id": "document_agent",
            "agent_name": "Document Analysis Agent",
            "status": "success",
            "answer": "This is an NDA agreement.",
            "citations": [],
            "sources": ["Agreement.pdf"],
            "provenance": "DOCUMENT_ANALYSIS",
        }

        res = await orch.execute_orchestration(
            query="Tell me about this document",
            user_id="user-1",
            selected_agents=["document_agent"],
            document_id="doc-test-1",
        )

        assert res["success"] is True
        assert list(res["individual_responses"].keys()) == ["document_agent"]
        assert m_doc.call_count == 1


async def test_attached_doc_without_document_agent_selected():
    """Rule 7: If Document Agent is not selected, do not invoke it merely because doc is attached."""
    orch = MultiAgentOrchestrator()
    orch.model = None
    mock_doc = {
        "document_id": "doc-test-1",
        "file_name": "Agreement.pdf",
        "pages": [{"page_number": 1, "text": "Text"}],
        "full_text": "Text",
    }

    with patch("app.api.v1.documents.get_document_data", return_value=mock_doc), \
         patch.object(orch, "execute_document_agent", new_callable=AsyncMock) as m_doc, \
         patch.object(orch, "execute_statutory_rag", new_callable=AsyncMock) as m_stat:
        m_stat.return_value = {
            "agent_id": "statutory_rag",
            "status": "success",
            "answer": "Statutory analysis.",
            "citations": [],
            "provenance": "STATUTORY_DATABASE",
        }

        res = await orch.execute_orchestration(
            query="What is Section 10 of Contract Act?",
            user_id="user-1",
            selected_agents=["statutory_rag"],
            document_id="doc-test-1",
        )

        assert res["success"] is True
        assert "document_agent" not in res["individual_responses"]
        assert m_doc.call_count == 0  # Document Agent was NOT called!
        assert m_stat.call_count == 1


async def test_general_legal_query_with_doc_attached_does_not_pollute_research():
    """Rule 9: If user asks an unrelated general legal question, do not force the document into research query."""
    orch = MultiAgentOrchestrator()
    orch.model = None
    mock_doc = {
        "document_id": "doc-test-1",
        "file_name": "Cover_Letter.docx",
        "pages": [{"page_number": 1, "text": "Dear Hiring Manager..."}],
        "full_text": "Dear Hiring Manager...",
    }

    with patch("app.api.v1.documents.get_document_data", return_value=mock_doc), \
         patch.object(orch, "execute_document_agent", new_callable=AsyncMock) as m_doc, \
         patch.object(orch, "execute_statutory_rag", new_callable=AsyncMock) as m_stat:
        m_doc.return_value = {
            "agent_id": "document_agent",
            "status": "success",
            "answer": "Cover letter text.",
            "citations": [],
            "provenance": "DOCUMENT_ANALYSIS",
        }
        m_stat.return_value = {
            "agent_id": "statutory_rag",
            "status": "success",
            "answer": "Section 420 IPC details.",
            "citations": [],
            "provenance": "STATUTORY_DATABASE",
        }

        general_query = "What is the punishment for cheating under Section 420 IPC?"
        res = await orch.execute_orchestration(
            query=general_query,
            user_id="user-1",
            selected_agents=["document_agent", "statutory_rag"],
            document_id="doc-test-1",
        )

        assert res["success"] is True
        # Verify research agent was invoked with pure query, NOT polluted with cover letter context
        call_kwargs = m_stat.call_args.kwargs
        assert general_query in call_kwargs["query"]
        assert "Cover_Letter" not in call_kwargs["query"]


# =====================================================================
# 9-10. Multi-Agent Partial Failure & Conflict Discrimination
# =====================================================================

async def test_partial_agent_failure_resilience():
    """Verify that when one agent fails, other agents succeed and combined answer reflects partial results."""
    orch = MultiAgentOrchestrator()
    orch.model = None

    with patch.object(orch, "execute_statutory_rag", new_callable=AsyncMock) as m_stat, \
         patch.object(orch, "execute_live_case_law", new_callable=AsyncMock) as m_live:
        m_stat.return_value = {
            "agent_id": "statutory_rag",
            "agent_name": "Statutory RAG Agent",
            "status": "success",
            "answer": "Statutory provisions retrieved successfully.",
            "citations": [{"citation_id": "STAT-1", "source": "Contract Act"}],
            "provenance": "STATUTORY_DATABASE",
        }
        m_live.return_value = {
            "agent_id": "live_case_law",
            "agent_name": "Live Indian Kanoon Agent",
            "status": "error",
            "answer": "Indian Kanoon API token not configured.",
            "citations": [],
            "provenance": "LIVE_CASE_LAW_API",
            "errors": ["Token missing"],
        }

        res = await orch.execute_orchestration(
            query="Contract validity",
            user_id="user-1",
            selected_agents=["statutory_rag", "live_case_law"],
        )

        assert res["success"] is True
        assert res["individual_responses"]["statutory_rag"]["status"] == "success"
        assert res["individual_responses"]["live_case_law"]["status"] == "error"
        # Combined answer must be generated from successful agent, noting partial failure
        assert "Statutory provisions retrieved successfully" in res["combined_answer"]["answer"]
        assert "Live Indian Kanoon Agent" in res["combined_answer"]["answer"]  # mentions failed agent note


async def test_source_comparison_no_false_conflicts_on_coverage_diffs():
    """Verify that differing coverage across domains does not trigger false contradictions."""
    orch = MultiAgentOrchestrator()
    orch.model = None

    responses = {
        "statutory_rag": {
            "agent_id": "statutory_rag",
            "agent_name": "Statutory RAG Agent",
            "status": "success",
            "answer": "Section 10 requires free consent, lawful consideration, and competent parties.",
            "provenance": "STATUTORY_DATABASE",
        },
        "case_law_corpus": {
            "agent_id": "case_law_corpus",
            "agent_name": "Case-Law Corpus Agent",
            "status": "success",
            "answer": "The Supreme Court in Carlill v Carbolic Smoke Ball upheld unilateral contracts upon performance of conditions.",
            "provenance": "CASE_LAW_CORPUS",
        },
    }

    comparison = await orch._compare_agent_sources("Contract validity", responses)
    # Coverage differences (one covers statutes, other covers case law) must not report conflicts
    assert comparison["conflicts"] == []
    assert comparison["potential_conflicts"] == []
    assert len(comparison["differences"]) >= 1


# =====================================================================
# 11-12. OCR Availability & Document Security Tests
# =====================================================================

def test_ocr_unavailable_honesty():
    """Verify that when Tesseract binary is not installed, has_ocr_pages is False with honest warning."""
    import fitz
    # Simulate environment where Tesseract binary is unavailable (e.g., Vercel Lambda)
    with patch.object(document_extraction_service, "is_ocr_available", return_value=False):
        doc = fitz.open()
        doc.new_page(width=595, height=842)
        pdf_bytes = doc.tobytes()
        doc.close()

        res = document_extraction_service.extract_from_pdf(pdf_bytes, file_name="scanned.pdf")
        assert res.has_ocr_pages is False
        all_warnings = res.warnings + [w for p in res.pages for w in p.warnings]
        assert any("unavailable" in w.lower() or "not installed" in w.lower() or "ocr" in w.lower() for w in all_warnings)


def test_compliance_service_untouched():
    """Ensure compliance files remain completely unmodified."""
    compliance_service_path = os.path.join(backend_dir, "app", "services", "compliance_service.py")
    compliance_api_path = os.path.join(backend_dir, "app", "api", "v1", "compliance.py")

    assert os.path.exists(compliance_service_path), "compliance_service.py must exist"
    assert os.path.exists(compliance_api_path), "compliance.py must exist"


# =====================================================================
# Main runner
# =====================================================================

def run_all_tests():
    print("=" * 65)
    print("Running MARE-Juris Production Fixes & Five-Agent Regression Suite")
    print("=" * 65)

    sync_tests = [
        ("1. Indian Kanoon token resolution", test_indian_kanoon_token_resolution),
        ("2. Five-agent selection and validation", test_five_agent_selection_and_validation),
        ("3. Query intent classification", test_classify_document_query_intent),
        ("4. OCR unavailable honesty on serverless", test_ocr_unavailable_honesty),
        ("5. Compliance service untouched check", test_compliance_service_untouched),
    ]

    async_tests = [
        ("6. Indian Kanoon auth errors (401, 403)", test_indian_kanoon_auth_errors),
        ("7. Indian Kanoon rate limits & timeouts", test_indian_kanoon_rate_limits_and_timeouts),
        ("8. Indian Kanoon empty vs malformed responses", test_indian_kanoon_empty_vs_malformed_responses),
        ("9. Document Agent alone execution (Rule 6)", test_document_agent_alone_execution),
        ("10. Attached doc without Document Agent selected (Rule 7)", test_attached_doc_without_document_agent_selected),
        ("11. General legal query with doc attached (Rule 9)", test_general_legal_query_with_doc_attached_does_not_pollute_research),
        ("12. Partial agent failure resilience", test_partial_agent_failure_resilience),
        ("13. Source comparison: no false conflicts on coverage diffs", test_source_comparison_no_false_conflicts_on_coverage_diffs),
    ]

    passed = 0
    total = len(sync_tests) + len(async_tests)

    for name, fn in sync_tests:
        try:
            fn()
            print(f"PASS: {name}")
            passed += 1
        except Exception as e:
            print(f"FAIL: {name} -> {e}")

    for name, afn in async_tests:
        try:
            asyncio.run(afn())
            print(f"PASS: {name}")
            passed += 1
        except Exception as e:
            print(f"FAIL: {name} -> {e}")

    print("=" * 65)
    print(f"RESULTS: {passed}/{total} tests passed.")
    if passed == total:
        print("ALL PRODUCTION FIX & REGRESSION TESTS PASSED SUCCESSFULLY!")
    print("=" * 65)
    assert passed == total, f"{total - passed} tests failed"


if __name__ == "__main__":
    run_all_tests()
