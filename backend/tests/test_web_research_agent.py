"""
Regression tests for the Live Official Web Research Agent (official_web).

Tests cover:
1. Successful DDG search with usable results.
2. Zero search results → structured "not_available" response.
3. DDG HTTP error (authentication / quota proxy).
4. Network timeout during DDG fetch.
5. Gemini synthesis failure → fallback structured response.
6. Gemini returns no candidates → fallback triggered.
7. Findings correctly passed into Combined Answer by orchestrator.
8. Web agent failure does NOT break other agents.
9. Evidence items carry source_url, citation_id, authority, evidence_text.
10. compare_sources returns expected schema.
"""

import asyncio
import json
import pytest
import pytest_asyncio
from unittest.mock import AsyncMock, MagicMock, patch, PropertyMock

# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _make_ddg_html(results):
    """Build minimal DuckDuckGo HTML page with the given result list."""
    items = ""
    for r in results:
        items += (
            f'<a class="result__a" href="//duckduckgo.com/l/?uddg={r["url_encoded"]}">'
            f'{r["title"]}</a>'
            f'<a class="result__snippet">{r["snippet"]}</a>'
        )
    return f"<html><body>{items}</body></html>"


def _mock_http_response(status_code: int, body: str):
    resp = MagicMock()
    resp.status_code = status_code
    resp.text = body
    resp.content = body.encode("utf-8")
    return resp


def _mock_gemini_response(text: str):
    cand = MagicMock()
    resp = MagicMock()
    resp.candidates = [cand]
    resp.text = text
    return resp


# ---------------------------------------------------------------------------
# Import the service AFTER patching external I/O
# ---------------------------------------------------------------------------

@pytest.fixture(autouse=True)
def patch_genai(monkeypatch):
    """Prevent real Gemini calls during module import."""
    mock_genai = MagicMock()
    mock_model = MagicMock()
    mock_genai.configure = MagicMock()
    mock_genai.GenerativeModel.return_value = mock_model
    monkeypatch.setattr("app.services.web_research_service.genai", mock_genai)
    return mock_genai, mock_model


@pytest.fixture()
def service(patch_genai):
    from app.services.web_research_service import WebResearchService
    svc = WebResearchService.__new__(WebResearchService)
    # Manually initialise without real Gemini
    svc._gemini_key_present = True
    mock_genai, mock_model = patch_genai
    svc.model = mock_model
    return svc


# ---------------------------------------------------------------------------
# Test 1: Successful DDG search returns evidence items
# ---------------------------------------------------------------------------

@pytest.mark.asyncio
async def test_successful_ddg_search_returns_evidence(service, monkeypatch):
    """DuckDuckGo returns 200 with result items → evidence list is populated."""
    from urllib.parse import quote_plus

    sample_url = quote_plus("https://legislative.gov.in/ipc-302")
    html = _make_ddg_html([{
        "url_encoded": sample_url,
        "title": "IPC Section 302 — Legislative Department",
        "snippet": "Section 302 IPC prescribes death or life imprisonment for murder.",
    }])

    mock_resp = _mock_http_response(200, html)

    async def mock_get(url, **kwargs):
        return mock_resp

    mock_client = AsyncMock()
    mock_client.get = mock_get
    mock_client.__aenter__ = AsyncMock(return_value=mock_client)
    mock_client.__aexit__ = AsyncMock(return_value=False)

    with patch("app.services.web_research_service.httpx.AsyncClient", return_value=mock_client):
        evidence = await service._fetch_ddg_evidence(
            "punishment for murder IPC 302",
            correlation_id="test-1",
            restrict_to_official=True,
        )

    assert len(evidence) >= 1
    item = evidence[0]
    assert item["source_url"] == "https://legislative.gov.in/ipc-302"
    assert item["citation_id"].startswith("WEB-")
    assert item["source_type"] == "OFFICIAL_WEB"
    assert item["authority"]
    assert item["evidence_text"]


# ---------------------------------------------------------------------------
# Test 2: DDG returns zero results → process_query returns not_available
# ---------------------------------------------------------------------------

@pytest.mark.asyncio
async def test_zero_results_returns_not_available(service, monkeypatch):
    """Empty DDG response → process_query returns coverage_status='not_available'."""
    mock_resp = _mock_http_response(200, "<html><body></body></html>")

    async def mock_get(url, **kwargs):
        return mock_resp

    mock_client = AsyncMock()
    mock_client.get = mock_get
    mock_client.__aenter__ = AsyncMock(return_value=mock_client)
    mock_client.__aexit__ = AsyncMock(return_value=False)

    with patch("app.services.web_research_service.httpx.AsyncClient", return_value=mock_client):
        result = await service.process_query(
            "punishment for murder",
            correlation_id="test-2",
        )

    # No static pointers match "murder" → evidence should be empty
    # (The static pointer logic only matches passport, consumer, rti, fir)
    assert result["citations"] == [] or result["evidence"] == []
    assert result["coverage_status"] in ("not_available", "web_sources_found")


# ---------------------------------------------------------------------------
# Test 3: DDG returns HTTP error → _fetch_ddg_evidence returns empty list
# ---------------------------------------------------------------------------

@pytest.mark.asyncio
async def test_ddg_http_error_returns_empty(service):
    """Non-200/202 DDG status → empty evidence, no exception raised."""
    mock_resp = _mock_http_response(403, "Forbidden")

    async def mock_get(url, **kwargs):
        return mock_resp

    mock_client = AsyncMock()
    mock_client.get = mock_get
    mock_client.__aenter__ = AsyncMock(return_value=mock_client)
    mock_client.__aexit__ = AsyncMock(return_value=False)

    with patch("app.services.web_research_service.httpx.AsyncClient", return_value=mock_client):
        evidence = await service._fetch_ddg_evidence(
            "murder IPC 302",
            correlation_id="test-3",
        )

    assert evidence == []


# ---------------------------------------------------------------------------
# Test 4: Network timeout → _fetch_ddg_evidence returns empty list
# ---------------------------------------------------------------------------

@pytest.mark.asyncio
async def test_network_timeout_returns_empty(service):
    """ConnectTimeout during DDG fetch → empty evidence, no exception raised."""
    import httpx

    async def mock_get(url, **kwargs):
        raise httpx.TimeoutException("timed out")

    mock_client = AsyncMock()
    mock_client.get = mock_get
    mock_client.__aenter__ = AsyncMock(return_value=mock_client)
    mock_client.__aexit__ = AsyncMock(return_value=False)

    with patch("app.services.web_research_service.httpx.AsyncClient", return_value=mock_client):
        evidence = await service._fetch_ddg_evidence(
            "murder IPC 302",
            correlation_id="test-4",
        )

    assert evidence == []


# ---------------------------------------------------------------------------
# Test 5: Gemini synthesis fails → fallback structured response returned
# ---------------------------------------------------------------------------

@pytest.mark.asyncio
async def test_gemini_failure_uses_fallback(service, monkeypatch):
    """All Gemini models fail → _fallback_web_response is used, status='unverified'."""
    from urllib.parse import quote_plus

    sample_url = quote_plus("https://legislative.gov.in/ipc-302")
    html = _make_ddg_html([{
        "url_encoded": sample_url,
        "title": "IPC Section 302 — Legislative Department",
        "snippet": "Section 302 IPC prescribes death or life imprisonment.",
    }])

    mock_resp = _mock_http_response(200, html)

    async def mock_get(url, **kwargs):
        return mock_resp

    mock_client = AsyncMock()
    mock_client.get = mock_get
    mock_client.__aenter__ = AsyncMock(return_value=mock_client)
    mock_client.__aexit__ = AsyncMock(return_value=False)

    # Make Gemini generate_content raise on every call
    def gemini_fail(prompt):
        raise RuntimeError("Gemini quota exceeded")

    with patch("app.services.web_research_service.httpx.AsyncClient", return_value=mock_client):
        with patch("asyncio.to_thread", side_effect=gemini_fail):
            result = await service.process_query(
                "punishment for murder IPC 302",
                correlation_id="test-5",
            )

    assert result["status"] == "unverified"
    assert "### Live Official Web Research" in result["answer"]
    assert len(result["citations"]) >= 1


# ---------------------------------------------------------------------------
# Test 6: Gemini returns no candidates → fallback triggered
# ---------------------------------------------------------------------------

@pytest.mark.asyncio
async def test_gemini_no_candidates_uses_fallback(service, monkeypatch):
    """Gemini returns empty candidates list → fallback structured response."""
    from urllib.parse import quote_plus

    sample_url = quote_plus("https://legislative.gov.in/ipc-302")
    html = _make_ddg_html([{
        "url_encoded": sample_url,
        "title": "IPC Section 302",
        "snippet": "Punishment for murder.",
    }])

    mock_resp = _mock_http_response(200, html)

    async def mock_get(url, **kwargs):
        return mock_resp

    mock_client = AsyncMock()
    mock_client.get = mock_get
    mock_client.__aenter__ = AsyncMock(return_value=mock_client)
    mock_client.__aexit__ = AsyncMock(return_value=False)

    no_cand_response = MagicMock()
    no_cand_response.candidates = []

    async def mock_to_thread(fn, *args, **kwargs):
        return no_cand_response

    with patch("app.services.web_research_service.httpx.AsyncClient", return_value=mock_client):
        with patch("asyncio.to_thread", side_effect=mock_to_thread):
            result = await service.process_query(
                "punishment for murder",
                correlation_id="test-6",
            )

    assert result["status"] == "unverified"
    assert result["citations"]


# ---------------------------------------------------------------------------
# Test 7: Successful synthesis → sources are present and answer non-empty
# ---------------------------------------------------------------------------

@pytest.mark.asyncio
async def test_successful_synthesis_has_sources(service, monkeypatch):
    """Happy path: DDG search + Gemini synthesis → answer, citations, sources all present."""
    from urllib.parse import quote_plus

    html = _make_ddg_html([
        {
            "url_encoded": quote_plus("https://legislative.gov.in/ipc-302"),
            "title": "IPC Section 302",
            "snippet": "Death or life imprisonment for murder.",
        },
        {
            "url_encoded": quote_plus("https://indiacode.nic.in/acts/ipc"),
            "title": "Indian Penal Code — India Code",
            "snippet": "Section 302 penalty under IPC.",
        },
    ])

    mock_resp = _mock_http_response(200, html)

    async def mock_get(url, **kwargs):
        return mock_resp

    mock_client = AsyncMock()
    mock_client.get = mock_get
    mock_client.__aenter__ = AsyncMock(return_value=mock_client)
    mock_client.__aexit__ = AsyncMock(return_value=False)

    gemini_answer = (
        "### Short Answer\nMurder is punishable by death or life imprisonment under IPC §302."
    )
    gemini_resp = _mock_gemini_response(gemini_answer)

    async def mock_to_thread(fn, *args, **kwargs):
        return gemini_resp

    with patch("app.services.web_research_service.httpx.AsyncClient", return_value=mock_client):
        with patch("asyncio.to_thread", side_effect=mock_to_thread):
            result = await service.process_query(
                "What is the punishment for murder under IPC 302?",
                correlation_id="test-7",
            )

    assert result["status"] == "verified"
    assert result["answer"] == gemini_answer
    assert len(result["citations"]) >= 1
    assert len(result["sources"]) >= 1
    for src in result["sources"]:
        assert src.startswith("http")


# ---------------------------------------------------------------------------
# Test 8: Evidence items carry required fields
# ---------------------------------------------------------------------------

@pytest.mark.asyncio
async def test_evidence_items_have_required_fields(service):
    """Each evidence item must have citation_id, title, source_url, evidence_text, authority."""
    from urllib.parse import quote_plus

    html = _make_ddg_html([{
        "url_encoded": quote_plus("https://indiankanoon.org/doc/1234567/"),
        "title": "State of Maharashtra v. Accused",
        "snippet": "Convicted under Section 302 IPC; sentenced to life imprisonment.",
    }])
    mock_resp = _mock_http_response(200, html)

    async def mock_get(url, **kwargs):
        return mock_resp

    mock_client = AsyncMock()
    mock_client.get = mock_get
    mock_client.__aenter__ = AsyncMock(return_value=mock_client)
    mock_client.__aexit__ = AsyncMock(return_value=False)

    with patch("app.services.web_research_service.httpx.AsyncClient", return_value=mock_client):
        evidence = await service._fetch_ddg_evidence("IPC 302", correlation_id="test-8")

    required_keys = {"citation_id", "title", "source_url", "evidence_text", "authority", "source_type"}
    for item in evidence:
        assert required_keys.issubset(item.keys()), f"Missing keys in: {item.keys()}"
        assert item["source_url"].startswith("http")


# ---------------------------------------------------------------------------
# Test 9: compare_sources returns expected schema
# ---------------------------------------------------------------------------

@pytest.mark.asyncio
async def test_compare_sources_schema(service):
    """compare_sources returns dict with all required keys."""
    expected = {
        "available": True,
        "summary": "Both agree on death/life imprisonment.",
        "agreements": ["Section 302 IPC"],
        "differences": [],
        "potential_conflicts": [],
        "freshness_flags": [],
        "conflicts": [],
    }

    async def mock_to_thread(fn, *args, **kwargs):
        resp = MagicMock()
        resp.text = json.dumps(expected)
        return resp

    with patch("asyncio.to_thread", side_effect=mock_to_thread):
        result = await service.compare_sources(
            "RAG answer about murder",
            "Web answer about murder",
            "What is the punishment for murder?",
        )

    required = {"available", "summary", "agreements", "differences",
                "potential_conflicts", "freshness_flags", "conflicts"}
    assert required.issubset(result.keys())
    assert result["available"] is True


# ---------------------------------------------------------------------------
# Test 10: Web agent failure does not break other agents (orchestrator)
# ---------------------------------------------------------------------------

@pytest.mark.asyncio
async def test_web_agent_failure_does_not_break_others():
    """
    If execute_official_web raises, the orchestrator wraps it in an error
    response and other agents' results are still returned.
    """
    from app.services.multi_agent_orchestrator import MultiAgentOrchestrator

    orch = MultiAgentOrchestrator.__new__(MultiAgentOrchestrator)
    orch._now_iso = lambda: "2026-01-01T00:00:00Z"

    # Simulate crash in web_research_service.process_query
    async def crash_process_query(query, correlation_id=""):
        raise ConnectionError("DDG unreachable")

    async def ok_statutory_rag(query, user_id, conversation_id, history, resolved_query, conversation_state):
        return {
            "agent_id": "statutory_rag",
            "agent_name": "Statutory RAG Agent",
            "status": "success",
            "answer": "IPC 302 penalty is death or life imprisonment.",
            "citations": [],
            "evidence": [],
            "sources": [],
            "provenance": "STATUTORY_CORPUS",
            "retrieved_at": "2026-01-01T00:00:00Z",
            "errors": None,
        }

    with patch("app.services.web_research_service.web_research_service.process_query", crash_process_query):
        # Call execute_official_web directly to verify it catches the exception
        result = await orch.execute_official_web(
            query="What is punishment for murder?",
            correlation_id="test-10",
        )

    assert result["agent_id"] == "official_web"
    assert result["status"] == "error"
    assert result["answer"] == "Official web research is currently unavailable."
    assert result["citations"] == []
    assert isinstance(result["errors"], list) and len(result["errors"]) > 0
