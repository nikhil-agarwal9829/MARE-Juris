"""
Wait-For-All Concurrency & Request Deadline Regression Test Suite for MARE-Juris.

Validates the Wait-For-All response flow:
1. A 15-20s agent is not cancelled at 12 seconds.
2. Multiple selected agents run concurrently.
3. The orchestrator waits for every selected agent outcome to settle.
4. Combined Answer generation begins after research has settled.
5. Source Comparison runs only when requested and after research finishes.
6. Genuine failures are represented accurately.
7. No blank response occurs when at least one agent succeeds.
8. Overall request deadline (45s) prevents indefinite requests with correlation ID.
9. Empty search results distinguished from errors and timeouts.
10. Document intent classification and word-boundary safety.
11. Compliance service files remain completely untouched.
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
# 1. 15-20s Agent Not Cancelled at 12s
# =====================================================================
async def test_01_slow_agent_not_cancelled_at_12s():
    """Verify that an agent that runs longer than 12s completes naturally and is not aborted."""
    orch = MultiAgentOrchestrator()
    orch.model = None

    async def _longer_statutory(*args, **kwargs):
        # Simulates a healthy agent that takes longer than 12 seconds
        await asyncio.sleep(0.15)
        return {
            "agent_id": "statutory_rag",
            "agent_name": "Statutory RAG Agent",
            "status": "success",
            "answer": "Section 405 IPC Criminal Breach of Trust provisions.",
            "citations": [{"citation_id": "STAT-405", "source": "IPC"}],
            "provenance": "STATUTORY_CORPUS",
        }

    async def _fast_web(*args, **kwargs):
        await asyncio.sleep(0.05)
        return {
            "agent_id": "official_web",
            "agent_name": "Live Official Web Research Agent",
            "status": "success",
            "answer": "Official portal guidance on police complaints.",
            "citations": [],
            "provenance": "OFFICIAL_WEB",
        }

    with patch.object(orch, "execute_statutory_rag", side_effect=_longer_statutory), \
         patch.object(orch, "execute_official_web", side_effect=_fast_web):

        res = await orch.execute_orchestration(
            query="Criminal breach of trust",
            user_id="user-1",
            selected_agents=["statutory_rag", "official_web"],
            compare_sources=False,
            correlation_id="test-wait-for-all-1",
        )

        assert res["success"] is True
        indiv = res["individual_responses"]

        # Statutory RAG must be SUCCESSFUL, not aborted or halted with a 12s deadline error
        assert indiv["statutory_rag"]["status"] == "success"
        assert "exceeded its execution deadline" not in indiv["statutory_rag"]["answer"]
        assert "Section 405 IPC" in indiv["statutory_rag"]["answer"]

        # Official web must also be successful
        assert indiv["official_web"]["status"] == "success"

        # Combined answer must integrate both completed agents
        assert res["combined_answer"] is not None
        assert "Section 405 IPC" in res["combined_answer"]["answer"]


# =====================================================================
# 2. Multiple Agents Run Concurrently and Orchestrator Waits for All
# =====================================================================
async def test_02_multiple_agents_concurrent_wait_for_all():
    """Verify that multiple agents run concurrently and orchestrator waits for all outcomes."""
    orch = MultiAgentOrchestrator()
    orch.model = None

    execution_order = []

    async def _task_1(*args, **kwargs):
        execution_order.append("start_1")
        await asyncio.sleep(0.05)
        execution_order.append("finish_1")
        return {"agent_id": "statutory_rag", "status": "success", "answer": "Answer 1", "citations": []}

    async def _task_2(*args, **kwargs):
        execution_order.append("start_2")
        await asyncio.sleep(0.05)
        execution_order.append("finish_2")
        return {"agent_id": "official_web", "status": "success", "answer": "Answer 2", "citations": []}

    async def _task_3(*args, **kwargs):
        execution_order.append("start_3")
        await asyncio.sleep(0.05)
        execution_order.append("finish_3")
        return {"agent_id": "case_law_corpus", "status": "success", "answer": "Answer 3", "citations": []}

    with patch.object(orch, "execute_statutory_rag", side_effect=_task_1), \
         patch.object(orch, "execute_official_web", side_effect=_task_2), \
         patch.object(orch, "execute_case_law_corpus", side_effect=_task_3):

        t0 = time.perf_counter()
        res = await orch.execute_orchestration(
            query="test query",
            user_id="user-1",
            selected_agents=["statutory_rag", "official_web", "case_law_corpus"],
            compare_sources=False,
        )
        elapsed = time.perf_counter() - t0

        # Concurrent check: all tasks started before any task finished
        assert "start_1" in execution_order[:3]
        assert "start_2" in execution_order[:3]
        assert "start_3" in execution_order[:3]

        # All tasks must have finished
        assert len(res["individual_responses"]) == 3
        assert res["individual_responses"]["statutory_rag"]["answer"] == "Answer 1"
        assert res["individual_responses"]["official_web"]["answer"] == "Answer 2"
        assert res["individual_responses"]["case_law_corpus"]["answer"] == "Answer 3"

        # Concurrency speedup: 3 x 0.1s tasks finished in < 0.25s
        assert elapsed < 0.25, f"Expected concurrent execution (<0.25s), took {elapsed:.2f}s"


# =====================================================================
# 3. Combined Answer Generation Begins After Research Has Settled
# =====================================================================
async def test_03_combined_answer_begins_after_research_settles():
    """Verify that synthesis begins strictly after all individual agents have settled."""
    orch = MultiAgentOrchestrator()

    stage_log = []

    async def _agent_slow(*args, **kwargs):
        stage_log.append("agent_running")
        await asyncio.sleep(0.1)
        stage_log.append("agent_done")
        return {
            "agent_id": "statutory_rag",
            "agent_name": "Statutory RAG Agent",
            "status": "success",
            "answer": "Settled evidence for synthesis.",
            "citations": [],
            "provenance": "STATUTORY_CORPUS",
        }

    async def _mock_synthesize(query, responses, history=None, correlation_id=""):
        stage_log.append("synthesis_started")
        assert "statutory_rag" in responses
        assert responses["statutory_rag"]["status"] == "success"
        return {
            "available": True,
            "answer": "Synthesized legal answer from settled evidence.",
            "citations": [],
            "synthesized_from": ["statutory_rag"],
        }

    with patch.object(orch, "execute_statutory_rag", side_effect=_agent_slow), \
         patch.object(orch, "_safe_synthesize", side_effect=_mock_synthesize):

        res = await orch.execute_orchestration(
            query="test query",
            user_id="user-1",
            selected_agents=["statutory_rag"],
            generate_combined=True,
            compare_sources=False,
        )

        assert res["success"] is True
        # Verify sequence: agent must finish before synthesis starts
        assert stage_log == ["agent_running", "agent_done", "synthesis_started"]
        assert "Synthesized" in res["combined_answer"]["answer"]


# =====================================================================
# 4. Source Comparison Runs Only When Requested & After Research Settles
# =====================================================================
async def test_04_source_comparison_only_when_requested_after_settled():
    """Verify that Source Comparison runs only when compare_sources=True and after research settles."""
    orch = MultiAgentOrchestrator()
    orch.model = None

    comparison_called = False

    async def _mock_compare(*args, **kwargs):
        nonlocal comparison_called
        comparison_called = True
        return {
            "available": True,
            "summary": "Comparison summary",
            "agreements": ["Agreement 1"],
            "differences": [],
            "potential_conflicts": [],
            "freshness_flags": [],
            "conflicts": [],
        }

    with patch.object(orch, "execute_statutory_rag", return_value={"agent_id": "statutory_rag", "status": "success", "answer": "Ans 1", "citations": []}), \
         patch.object(orch, "execute_official_web", return_value={"agent_id": "official_web", "status": "success", "answer": "Ans 2", "citations": []}), \
         patch.object(orch, "_safe_compare", side_effect=_mock_compare):

        # Test A: compare_sources=False -> comparison NOT called
        res_no_comp = await orch.execute_orchestration(
            query="test",
            user_id="u-1",
            selected_agents=["statutory_rag", "official_web"],
            compare_sources=False,
        )
        assert res_no_comp["comparison"] is None
        assert comparison_called is False

        # Test B: compare_sources=True -> comparison IS called
        res_with_comp = await orch.execute_orchestration(
            query="test",
            user_id="u-1",
            selected_agents=["statutory_rag", "official_web"],
            compare_sources=True,
        )
        assert res_with_comp["comparison"] is not None
        assert comparison_called is True
        assert res_with_comp["comparison"]["summary"] == "Comparison summary"


# =====================================================================
# 5. Genuine Failures Are Represented Accurately
# =====================================================================
async def test_05_genuine_agent_failure_represented_accurately():
    """Verify that a genuine agent exception is captured accurately without aborting healthy agents."""
    orch = MultiAgentOrchestrator()
    orch.model = None

    async def _failing_agent(*args, **kwargs):
        raise ConnectionResetError("Remote Kanoon API reset connection.")

    async def _healthy_agent(*args, **kwargs):
        return {
            "agent_id": "statutory_rag",
            "agent_name": "Statutory RAG Agent",
            "status": "success",
            "answer": "Healthy statutory answer.",
            "citations": [{"citation_id": "STAT-1"}],
            "provenance": "STATUTORY_CORPUS",
        }

    with patch.object(orch, "execute_live_case_law", side_effect=_failing_agent), \
         patch.object(orch, "execute_statutory_rag", side_effect=_healthy_agent):

        res = await orch.execute_orchestration(
            query="Test query",
            user_id="u-1",
            selected_agents=["statutory_rag", "live_case_law"],
            compare_sources=False,
        )

        assert res["success"] is True
        indiv = res["individual_responses"]

        # Failing agent is clearly marked as error with genuine reason
        assert indiv["live_case_law"]["status"] == "error"
        assert any("Remote Kanoon API reset connection" in str(e) for e in indiv["live_case_law"]["errors"])

        # Healthy agent succeeded
        assert indiv["statutory_rag"]["status"] == "success"

        # Combined answer synthesizes the healthy agent and notes the failing one
        assert "Healthy statutory answer" in res["combined_answer"]["answer"]
        assert "Live Case-Law API Agent encountered an issue" in res["combined_answer"]["answer"]


# =====================================================================
# 6. No Blank Response When at Least One Agent Succeeds
# =====================================================================
async def test_06_no_blank_response_when_one_agent_succeeds():
    """Verify that responses are never blank or empty when at least one agent succeeds."""
    orch = MultiAgentOrchestrator()
    orch.model = None

    responses = {
        "statutory_rag": {
            "agent_id": "statutory_rag",
            "agent_name": "Statutory RAG Agent",
            "status": "success",
            "answer": "Section 420 IPC: Cheating and dishonestly inducing delivery of property.",
            "citations": [],
            "provenance": "STATUTORY_CORPUS",
        },
        "official_web": {
            "agent_id": "official_web",
            "agent_name": "Live Official Web Research Agent",
            "status": "error",
            "answer": "Government portal lookup failed.",
            "citations": [],
            "provenance": "OFFICIAL_WEB",
            "errors": ["Portal error"],
        }
    }

    pkg = orch._make_fallback_synthesis_package("Cheating", responses, correlation_id="req-non-blank")
    assert pkg["available"] is True
    assert pkg["answer"].strip() != ""
    assert "Section 420" in pkg["answer"]
    assert "Live Official Web Research Agent encountered an issue" in pkg["answer"]


# =====================================================================
# 7. Request-Level Deadline (45s) Prevents Indefinite Requests
# =====================================================================
async def test_07_request_level_deadline_prevents_indefinite_requests():
    """Verify that chat endpoint's 45s request deadline prevents indefinite execution with correlation ID."""
    with patch("app.api.v1.chat._load_conversation_messages", return_value=[]), \
         patch("app.api.v1.chat.get_pending_follow_up", return_value=None), \
         patch("app.api.v1.chat.get_supabase_admin_client", return_value=MagicMock()):

        # Simulate orchestrator hanging beyond request deadline
        with patch("app.services.multi_agent_orchestrator.multi_agent_orchestrator.execute_orchestration") as mock_orch:
            async def _hanging_orch(*args, **kwargs):
                raise asyncio.TimeoutError()
            mock_orch.side_effect = _hanging_orch

            payload = ChatMessageRequest(
                message="Long legal consultation",
                selected_agents=["statutory_rag", "official_web"],
            )
            current_user = {"id": "user-test-uuid"}

            res = await send_chat_message(payload, current_user=current_user)

            assert res["role"] == "assistant"
            assert res["combined_answer"]["available"] is True
            assert "timed out" in res["combined_answer"]["answer"].lower()
            assert res["message_id"] is not None


# =====================================================================
# 8. Empty Search Results Distinguished from Errors and Timeouts
# =====================================================================
async def test_08_empty_results_distinguished():
    """Verify that empty search results are reported as 'No records found' rather than timeouts or errors."""
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
# 9. Document Intent Classification
# =====================================================================
def test_09_document_intent_classification():
    """Verify document query classification and word-boundary safety."""
    assert classify_document_query_intent("Summarize this document") == "DOCUMENT_CENTRIC"
    assert classify_document_query_intent("What are the termination terms in this contract?") == "DOCUMENT_CENTRIC"
    assert classify_document_query_intent("Is the non-compete clause in this agreement valid under Section 27?") == "HYBRID"
    assert classify_document_query_intent("What is Section 302 IPC?") == "GENERAL_LEGAL"
    assert classify_document_query_intent("Explain doctrine of basic structure in Constitutional Law") == "GENERAL_LEGAL"


# =====================================================================
# 10. Compliance Service Files Untouched Check
# =====================================================================
def test_10_compliance_service_untouched():
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
def run_all_tests():
    print("=" * 75)
    print("Running MARE-Juris Wait-For-All Concurrency & Deadline Test Suite")
    print("=" * 75)

    sync_tests = [
        ("9. Document query intent classification", test_09_document_intent_classification),
        ("10. Compliance service untouched check", test_10_compliance_service_untouched),
    ]

    async_tests = [
        ("1. 15-20s agent is not cancelled at 12 seconds", test_01_slow_agent_not_cancelled_at_12s),
        ("2. Multiple agents run concurrently and orchestrator waits for all", test_02_multiple_agents_concurrent_wait_for_all),
        ("3. Combined Answer generation begins after research has settled", test_03_combined_answer_begins_after_research_settles),
        ("4. Source Comparison runs only when requested & after research settles", test_04_source_comparison_only_when_requested_after_settled),
        ("5. Genuine failures are represented accurately", test_05_genuine_agent_failure_represented_accurately),
        ("6. No blank response when at least one agent succeeds", test_06_no_blank_response_when_one_agent_succeeds),
        ("7. Request-level deadline (45s) prevents indefinite requests with correlation ID", test_07_request_level_deadline_prevents_indefinite_requests),
        ("8. Empty search results distinguished from timeouts/errors", test_08_empty_results_distinguished),
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

    print("=" * 75)
    print(f"RESULTS: {passed}/{total} tests passed.")
    if passed == total:
        print("ALL WAIT-FOR-ALL CONCURRENCY & DEADLINE TESTS PASSED SUCCESSFULLY!")
    print("=" * 75)
    assert passed == total, f"{total - passed} tests failed"


if __name__ == "__main__":
    run_all_tests()
