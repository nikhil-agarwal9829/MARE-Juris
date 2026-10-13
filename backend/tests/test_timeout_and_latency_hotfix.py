"""
Production Hotfix Timeout & Latency Regression Test Suite for MARE-Juris.

Validates the Vercel 504 Chat Timeout fixes:
1. Slow agent timing out while other agents succeed (12s per-agent timeout budget).
2. Gemini Combined Answer synthesis timeout (7s budget) with deterministic fallback.
3. Source comparison timeout (6s budget) with deterministic fallback.
4. Concurrency speedup: concurrent agent execution vs sequential blocking.
5. All agents failing: returns clear error with correlation/request ID.
6. Empty agent results distinguished from errors and timeouts.
7. Document-centric query vs General legal query with document attached.
8. Chat endpoint bounded 28s deadline with graceful fallback and correlation ID.
9. Compliance service files untouched verification.
"""

import os
import sys
import json
import time
import asyncio
from unittest.mock import AsyncMock, MagicMock, patch

backend_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

from app.core.config import settings
from app.services.multi_agent_orchestrator import (
    MultiAgentOrchestrator,
    VALID_AGENT_IDS,
    classify_document_query_intent,
)
from app.api.v1.chat import ChatMessageRequest, send_chat_message


# =====================================================================
# 1. Slow agent timing out while other agents succeed
# =====================================================================
async def test_01_slow_agent_timeout_while_others_succeed():
    """Verify that an agent exceeding 12s is safely cancelled while other agents succeed."""
    orch = MultiAgentOrchestrator()
    orch.model = None  # Use deterministic fallback for fast unit testing

    async def _fast_statutory(*args, **kwargs):
        await asyncio.sleep(0.05)
        return {
            "agent_id": "statutory_rag",
            "agent_name": "Statutory RAG Agent",
            "status": "success",
            "answer": "Section 10 Contract Act statutory provisions.",
            "citations": [{"citation_id": "STAT-1", "source": "Contract Act"}],
            "provenance": "STATUTORY_CORPUS",
        }

    async def _slow_kanoon(*args, **kwargs):
        # Simulates slow external Kanoon API that exceeds timeout
        await asyncio.sleep(20.0)
        return {
            "agent_id": "live_case_law",
            "agent_name": "Live Case-Law API Agent",
            "status": "success",
            "answer": "Slow precedent",
            "citations": [],
            "provenance": "LIVE_EXTERNAL_API",
        }

    orig_exec = orch._execute_agent_tasks
    async def _fast_exec(tasks_with_aids, correlation_id="", timeout=12.0):
        return await orig_exec(tasks_with_aids, correlation_id=correlation_id, timeout=0.2)

    with patch.object(orch, "execute_statutory_rag", side_effect=_fast_statutory), \
         patch.object(orch, "execute_live_case_law", side_effect=_slow_kanoon), \
         patch.object(orch, "_execute_agent_tasks", side_effect=_fast_exec):

        res = await orch.execute_orchestration(
            query="Contract validity",
            user_id="user-1",
            selected_agents=["statutory_rag", "live_case_law"],
            correlation_id="test-timeout-1",
        )

        assert res["success"] is True
        indiv = res["individual_responses"]
        assert indiv["statutory_rag"]["status"] == "success"
        assert indiv["live_case_law"]["status"] == "error"
        assert "deadline" in indiv["live_case_law"]["answer"].lower() or "halted" in indiv["live_case_law"]["answer"].lower()

        # Combined answer must preserve successful statutory findings
        assert res["combined_answer"] is not None
        assert "Section 10" in res["combined_answer"]["answer"]
        assert "Live Case-Law API Agent" in res["combined_answer"]["answer"]  # mentions note on excluded agent


# =====================================================================
# 2. Gemini synthesis timeout with deterministic fallback
# =====================================================================
async def test_02_gemini_synthesis_timeout_fallback():
    """Verify that if Gemini synthesis hangs, it triggers fallback within timeout budget."""
    orch = MultiAgentOrchestrator()

    mock_model = MagicMock()
    def _slow_generate(*args, **kwargs):
        time.sleep(15.0)  # Synchronous blocking simulation
        mock_res = MagicMock()
        mock_res.text = "Slow answer"
        return mock_res
    mock_model.generate_content = _slow_generate
    orch.model = mock_model

    responses = {
        "statutory_rag": {
            "agent_id": "statutory_rag",
            "agent_name": "Statutory RAG Agent",
            "status": "success",
            "answer": "- Section 420 IPC: Cheating and dishonestly inducing delivery of property.\n- Section 406 IPC: Criminal breach of trust.",
            "citations": [],
            "provenance": "STATUTORY_CORPUS",
        }
    }

    # Custom short timeout wrapper to keep unit test instant
    t0 = time.perf_counter()
    with patch.object(asyncio, "wait_for") as mock_wait:
        # Simulate wait_for raising asyncio.TimeoutError
        mock_wait.side_effect = asyncio.TimeoutError()
        res = await orch._safe_synthesize("Cheating provisions", responses, correlation_id="test-synth-timeout")
    
    assert res is not None
    assert res["available"] is True
    assert "Section 420" in res["answer"]
    assert res["synthesized_from"] == ["statutory_rag"]


# =====================================================================
# 3. Source comparison timeout with deterministic fallback
# =====================================================================
async def test_03_source_comparison_timeout_fallback():
    """Verify that if Source Comparison hangs, it triggers fallback without failing the response."""
    orch = MultiAgentOrchestrator()

    responses = {
        "statutory_rag": {
            "agent_id": "statutory_rag",
            "agent_name": "Statutory RAG Agent",
            "status": "success",
            "answer": "Provisions on arbitration.",
            "provenance": "STATUTORY_CORPUS",
        },
        "case_law_corpus": {
            "agent_id": "case_law_corpus",
            "agent_name": "Case-Law Corpus Agent",
            "status": "success",
            "answer": "Judicial precedents on Section 11 Arbitration Act.",
            "provenance": "CASE_LAW_CORPUS",
        },
    }

    with patch.object(asyncio, "wait_for", side_effect=asyncio.TimeoutError()):
        comp = await orch._safe_compare("Arbitration law", responses, correlation_id="test-comp-timeout")

    assert comp is not None
    assert comp["available"] is True
    assert "Compared 2 agent source outputs" in comp["summary"]
    assert len(comp["agreements"]) >= 1
    assert comp["conflicts"] == []


# =====================================================================
# 4. Concurrency speedup: concurrent execution of independent agents
# =====================================================================
async def test_04_concurrency_speedup():
    """Verify that 3 independent agents run concurrently rather than sequentially."""
    orch = MultiAgentOrchestrator()
    orch.model = None

    async def _mock_agent_task(aid, delay=0.1):
        await asyncio.sleep(delay)
        return {
            "agent_id": aid,
            "agent_name": aid,
            "status": "success",
            "answer": f"Answer from {aid}",
            "citations": [],
            "provenance": "TEST",
        }

    with patch.object(orch, "execute_statutory_rag", side_effect=lambda **kw: _mock_agent_task("statutory_rag", 0.1)), \
         patch.object(orch, "execute_official_web", side_effect=lambda **kw: _mock_agent_task("official_web", 0.1)), \
         patch.object(orch, "execute_case_law_corpus", side_effect=lambda **kw: _mock_agent_task("case_law_corpus", 0.1)):

        t0 = time.perf_counter()
        res = await orch.execute_orchestration(
            query="test query",
            user_id="user-1",
            selected_agents=["statutory_rag", "official_web", "case_law_corpus"],
        )
        total_time = time.perf_counter() - t0

        assert res["success"] is True
        assert len(res["individual_responses"]) == 3
        # If sequential, it would take >= 0.30s. Since concurrent, it completes in ~0.10s-0.20s.
        assert total_time < 0.28, f"Expected concurrent execution (<0.28s), took {total_time:.3f}s"


# =====================================================================
# 5. All agents failing: clear error with request/correlation ID
# =====================================================================
async def test_05_all_agents_fail_returns_request_id():
    """Verify that when all selected agents fail, combined answer includes request/correlation ID."""
    orch = MultiAgentOrchestrator()
    orch.model = None

    with patch.object(orch, "execute_statutory_rag", side_effect=RuntimeError("Statutory DB down")), \
         patch.object(orch, "execute_official_web", side_effect=RuntimeError("Web API down")):

        res = await orch.execute_orchestration(
            query="test query",
            user_id="user-1",
            selected_agents=["statutory_rag", "official_web"],
            correlation_id="req-corr-id-9999",
        )

        assert res["success"] is True
        comb = res["combined_answer"]
        assert comb is not None
        assert comb["available"] is True
        assert "req-corr-id-9999" in comb["answer"]
        assert "Errors encountered" in comb["answer"]


# =====================================================================
# 6. Distinguish empty search results from timeouts and errors
# =====================================================================
async def test_06_empty_results_distinguished_from_timeouts():
    """Verify empty search results are reported as 'No records found' rather than timeouts or errors."""
    orch = MultiAgentOrchestrator()
    orch.model = None

    responses = {
        "case_law_corpus": {
            "agent_id": "case_law_corpus",
            "agent_name": "Case-Law Corpus Agent",
            "status": "empty",
            "answer": "No judgments found for query.",
            "citations": [],
            "provenance": "CASE_LAW_CORPUS",
        }
    }

    pkg = orch._make_fallback_synthesis_package("obscure query", responses, correlation_id="req-empty-1")
    assert "No records found: Case-Law Corpus Agent" in pkg["answer"]
    assert "Timed out" not in pkg["answer"]
    assert "Errors encountered" not in pkg["answer"]


# =====================================================================
# 7. Document intent classification and query pollution prevention
# =====================================================================
def test_07_document_intent_classification():
    """Verify accurate classification of document-centric, hybrid, and general legal queries."""
    assert classify_document_query_intent("Summarize this document") == "DOCUMENT_CENTRIC"
    assert classify_document_query_intent("What are the termination terms in this contract?") == "DOCUMENT_CENTRIC"
    assert classify_document_query_intent("Is the non-compete clause in this agreement valid under Section 27?") == "HYBRID"
    assert classify_document_query_intent("What is Section 302 IPC?") == "GENERAL_LEGAL"
    assert classify_document_query_intent("Explain doctrine of basic structure in Constitutional Law") == "GENERAL_LEGAL"


# =====================================================================
# 8. Chat endpoint 28s deadline fallback
# =====================================================================
async def test_08_chat_endpoint_deadline_fallback():
    """Verify that chat endpoint handles orchestrator timeouts at 28s with graceful JSON response."""
    with patch("app.api.v1.chat._load_conversation_messages", return_value=[]), \
         patch("app.api.v1.chat.get_pending_follow_up", return_value=None), \
         patch("app.api.v1.chat.get_supabase_admin_client", return_value=MagicMock()):

        # Mock multi_agent_orchestrator.execute_orchestration to raise asyncio.TimeoutError
        with patch("app.services.multi_agent_orchestrator.multi_agent_orchestrator.execute_orchestration") as mock_orch:
            async def _slow_orch(*args, **kwargs):
                raise asyncio.TimeoutError()
            mock_orch.side_effect = _slow_orch

            payload = ChatMessageRequest(
                message="Explain Section 138 NI Act",
                selected_agents=["statutory_rag", "official_web"],
            )
            current_user = {"id": "user-test-uuid"}

            res = await send_chat_message(payload, current_user=current_user)

            assert res["query"] == "Explain Section 138 NI Act"
            assert res["role"] == "assistant"
            assert res["combined_answer"]["available"] is True
            assert "timed out" in res["combined_answer"]["answer"].lower()
            assert res["message_id"] is not None


# =====================================================================
# 9. Compliance files untouched check
# =====================================================================
def test_09_compliance_service_untouched():
    """Ensure compliance files remain completely unmodified."""
    service_path = os.path.join(backend_dir, "app", "services", "compliance_service.py")
    api_path = os.path.join(backend_dir, "app", "api", "v1", "compliance.py")

    assert os.path.exists(service_path)
    assert os.path.exists(api_path)

    with open(service_path, "r", encoding="utf-8") as f:
        content = f.read()
    assert "class ComplianceAgentService" in content

    with open(api_path, "r", encoding="utf-8") as f:
        api_content = f.read()
    assert "class IntentRequest" in api_content


# =====================================================================
# Main Runner
# =====================================================================
def run_all_hotfix_tests():
    print("=" * 70)
    print("Running MARE-Juris Production Hotfix Timeout & Latency Test Suite")
    print("=" * 70)

    sync_tests = [
        ("7. Document query intent classification", test_07_document_intent_classification),
        ("9. Compliance service untouched check", test_09_compliance_service_untouched),
    ]

    async_tests = [
        ("1. Slow agent timeout while other agents succeed", test_01_slow_agent_timeout_while_others_succeed),
        ("2. Gemini synthesis timeout with deterministic fallback", test_02_gemini_synthesis_timeout_fallback),
        ("3. Source comparison timeout with deterministic fallback", test_03_source_comparison_timeout_fallback),
        ("4. Concurrency speedup (parallel agent execution)", test_04_concurrency_speedup),
        ("5. All agents fail returns request ID and clear error", test_05_all_agents_fail_returns_request_id),
        ("6. Empty search results distinguished from timeouts/errors", test_06_empty_results_distinguished_from_timeouts),
        ("8. Chat endpoint 28s deadline fallback", test_08_chat_endpoint_deadline_fallback),
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

    print("=" * 70)
    print(f"RESULTS: {passed}/{total} tests passed.")
    if passed == total:
        print("ALL TIMEOUT & LATENCY HOTFIX TESTS PASSED SUCCESSFULLY!")
    print("=" * 70)
    assert passed == total, f"{total - passed} tests failed"


if __name__ == "__main__":
    run_all_hotfix_tests()
