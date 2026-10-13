"""
Mocked test suite for Agent 4: Live Case-Law API Research Agent.
Verifies external API normalization, parameter handling, error tolerance,
date distinctions, full-text retrieval, and provenance without consuming live API quota.
"""

import asyncio
import os
import sys
from unittest.mock import AsyncMock, MagicMock, patch

# Ensure backend directory is in sys.path
backend_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

import httpx

from app.services.live_case_law_agent import LiveCaseLawAgent


async def test_successful_search_parsing():
    agent = LiveCaseLawAgent(token="mock_valid_token")

    mock_resp = MagicMock()
    mock_resp.status_code = 200
    mock_resp.json.return_value = {
        "found": 1,
        "docs": [
            {
                "tid": 1058291,
                "title": "State of Maharashtra v. <b>Union of India</b>",
                "headline": "The court considered the <font color='red'>interstate water</font> disputes...",
                "docsource": "Supreme Court of India",
                "publishdate": "2023-04-15",
                "citation": "2023 INSC 120"
            }
        ]
    }

    with patch("httpx.AsyncClient.post", new_callable=AsyncMock) as mock_post:
        mock_post.return_value = mock_resp

        result = await agent.search_live_cases(query="water dispute", court="supreme_court", max_results=5)

        assert result["provenance"] == "LIVE_EXTERNAL_API"
        assert len(result["judgments"]) == 1
        j = result["judgments"][0]
        assert j["case_title"] == "State of Maharashtra v. Union of India"
        assert "<font" not in (j["summary_or_snippet"] or "")
        assert j["source_document_id"] == "1058291"
        assert j["source_url"] == "https://indiankanoon.org/doc/1058291/"
        assert j["court"] == "Supreme Court of India"
        assert j["publication_date"] == "2023-04-15"
        assert j["decision_date"] is None
        assert j["official_source_verified"] is False
        assert j["full_text_verified"] is False
    print("PASS: test_successful_search_parsing")


async def test_search_query_filter_formatting():
    agent = LiveCaseLawAgent(token="mock_valid_token")

    q = agent._build_search_query(
        query="right to privacy",
        court="supreme_court",
        from_date="01-01-2020",
        to_date="31-12-2023"
    )

    assert "right to privacy" in q
    assert "doctypes:supremecourt" in q
    assert "fromdate:01-01-2020" in q
    assert "todate:31-12-2023" in q
    print("PASS: test_search_query_filter_formatting")


async def test_missing_token_handling():
    agent = LiveCaseLawAgent(token=None)

    result = await agent.search_live_cases(query="habeas corpus")
    assert result["errors"] is not None
    assert any("not configured" in err for err in result["errors"])
    assert len(result["judgments"]) == 0
    print("PASS: test_missing_token_handling")


async def test_http_403_forbidden_handling():
    agent = LiveCaseLawAgent(token="mock_invalid_token")

    mock_resp = MagicMock()
    mock_resp.status_code = 403

    with patch("httpx.AsyncClient.post", new_callable=AsyncMock) as mock_post:
        mock_post.return_value = mock_resp

        result = await agent.search_live_cases(query="arbitration")
        assert result["errors"] is not None
        assert any("403 Forbidden" in err for err in result["errors"])
        assert len(result["judgments"]) == 0
    print("PASS: test_http_403_forbidden_handling")


async def test_http_429_rate_limit_handling():
    agent = LiveCaseLawAgent(token="mock_rate_limited_token")

    mock_resp = MagicMock()
    mock_resp.status_code = 429

    with patch("httpx.AsyncClient.post", new_callable=AsyncMock) as mock_post:
        mock_post.return_value = mock_resp

        result = await agent.search_live_cases(query="insolvency")
        assert result["errors"] is not None
        assert any("429" in err for err in result["errors"])
    print("PASS: test_http_429_rate_limit_handling")


async def test_provenance_distinction():
    agent = LiveCaseLawAgent(token="mock_token")

    mock_resp = MagicMock()
    mock_resp.status_code = 200
    mock_resp.json.return_value = {"docs": [{"tid": 11, "title": "Test Case", "publishdate": "2021-01-01"}]}

    with patch("httpx.AsyncClient.post", new_callable=AsyncMock) as mock_post:
        mock_post.return_value = mock_resp
        result = await agent.search_live_cases(query="test")
        assert result["provenance"] == "LIVE_EXTERNAL_API"
        assert result["judgments"][0]["provenance"] == "LIVE_EXTERNAL_API"
        assert result["judgments"][0]["official_source_verified"] is False
    print("PASS: test_provenance_distinction")


async def test_pagination():
    agent = LiveCaseLawAgent(token="mock_token")

    mock_resp = MagicMock()
    mock_resp.status_code = 200
    mock_resp.json.return_value = {
        "docs": [
            {"tid": 101, "title": "Page 2 Case 1", "publishdate": "2022-01-01"},
            {"tid": 102, "title": "Page 2 Case 2", "publishdate": "2022-01-02"}
        ]
    }

    with patch("httpx.AsyncClient.post", new_callable=AsyncMock) as mock_post:
        mock_post.return_value = mock_resp
        result = await agent.search_live_cases(query="contracts", page=2, max_results=2)

        # Assert pagenum=2 was passed to the API
        called_args, called_kwargs = mock_post.call_args
        params = called_kwargs.get("params", {})
        assert params.get("pagenum") == 2
        assert result["page"] == 2
        assert len(result["judgments"]) == 2
        assert result["has_more"] is True
    print("PASS: test_pagination")


async def test_duplicate_results_deduplication():
    agent = LiveCaseLawAgent(token="mock_token")

    mock_resp = MagicMock()
    mock_resp.status_code = 200
    mock_resp.json.return_value = {
        "docs": [
            {"tid": 999, "title": "Duplicate Judgment", "publishdate": "2020-05-01"},
            {"tid": 999, "title": "Duplicate Judgment Again", "publishdate": "2020-05-01"},
            {"tid": 1000, "title": "Unique Judgment", "publishdate": "2020-05-02"}
        ]
    }

    with patch("httpx.AsyncClient.post", new_callable=AsyncMock) as mock_post:
        mock_post.return_value = mock_resp
        result = await agent.search_live_cases(query="dedup test")

        assert len(result["judgments"]) == 2
        ids = [j["source_document_id"] for j in result["judgments"]]
        assert ids == ["999", "1000"]
    print("PASS: test_duplicate_results_deduplication")


async def test_missing_fields_handling():
    agent = LiveCaseLawAgent(token="mock_token")

    mock_resp = MagicMock()
    mock_resp.status_code = 200
    # Response contains docs with missing title, docsource, dates, tid, or headline
    mock_resp.json.return_value = {
        "docs": [
            {},  # completely empty doc item
            {"tid": None, "title": None, "docsource": None},
            {"tid": 555, "docsource": "Delhi High Court"}  # missing headline and publishdate
        ]
    }

    with patch("httpx.AsyncClient.post", new_callable=AsyncMock) as mock_post:
        mock_post.return_value = mock_resp
        result = await agent.search_live_cases(query="sparse data")

        assert result["errors"] is None
        assert len(result["judgments"]) == 3
        # Check first sparse item
        assert result["judgments"][0]["case_title"] == "Untitled Document"
        assert result["judgments"][0]["decision_date"] is None
        assert result["judgments"][0]["publication_date"] is None
        assert result["judgments"][0]["court"] is None
        # Check third item
        assert result["judgments"][2]["source_document_id"] == "555"
        assert result["judgments"][2]["court"] == "Delhi High Court"
    print("PASS: test_missing_fields_handling")


async def test_timeout_handling():
    agent = LiveCaseLawAgent(token="mock_token")

    with patch("httpx.AsyncClient.post", new_callable=AsyncMock) as mock_post:
        mock_post.side_effect = httpx.TimeoutException("Connection timed out")

        result = await agent.search_live_cases(query="timeout test")
        assert result["errors"] is not None
        assert any("timed out" in err.lower() for err in result["errors"])
        assert len(result["judgments"]) == 0
    print("PASS: test_timeout_handling")


async def test_malformed_json_handling():
    agent = LiveCaseLawAgent(token="mock_token")

    mock_resp = MagicMock()
    mock_resp.status_code = 200
    mock_resp.json.side_effect = ValueError("Invalid JSON content")

    with patch("httpx.AsyncClient.post", new_callable=AsyncMock) as mock_post:
        mock_post.return_value = mock_resp

        result = await agent.search_live_cases(query="malformed json test")
        assert result["errors"] is not None
        assert any("Malformed JSON" in err for err in result["errors"])
        assert len(result["judgments"]) == 0
    print("PASS: test_malformed_json_handling")


async def test_get_document_full_text_success():
    agent = LiveCaseLawAgent(token="mock_token")

    mock_resp = MagicMock()
    mock_resp.status_code = 200
    mock_resp.json.return_value = {
        "tid": "45678",
        "title": "Kesavananda Bharati v. State of Kerala",
        "doc": "<div><p>This is the <b>full text</b> of the landmark basic structure judgment.</p></div>",
        "publishdate": "1973-04-24",
        "court": "Supreme Court of India",
        "citeList": [{"tid": 1, "title": "Golak Nath"}],
        "citedbyList": [{"tid": 2, "title": "Minerva Mills"}]
    }

    with patch("httpx.AsyncClient.post", new_callable=AsyncMock) as mock_post:
        mock_post.return_value = mock_resp
        doc_res = await agent.get_document_full_text(doc_id="45678")

        assert doc_res["error"] is None
        assert doc_res["doc_id"] == "45678"
        assert doc_res["case_title"] == "Kesavananda Bharati v. State of Kerala"
        assert "This is the full text of the landmark basic structure judgment." in doc_res["full_text"]
        assert "<p>" not in doc_res["full_text"]
        assert doc_res["publication_date"] == "1973-04-24"
        assert doc_res["decision_date"] is None
        assert len(doc_res["cite_list"]) == 1
        assert len(doc_res["cited_by_list"]) == 1
        assert doc_res["provenance"] == "LIVE_EXTERNAL_API"
        assert doc_res["full_text_verified"] is False
    print("PASS: test_get_document_full_text_success")


async def test_get_document_full_text_errors():
    agent = LiveCaseLawAgent(token="mock_token")

    # Test 404
    mock_404 = MagicMock()
    mock_404.status_code = 404
    with patch("httpx.AsyncClient.post", new_callable=AsyncMock) as mock_post:
        mock_post.return_value = mock_404
        doc_res = await agent.get_document_full_text(doc_id="9999999")
        assert "404" in doc_res["error"]

    # Test 403
    mock_403 = MagicMock()
    mock_403.status_code = 403
    with patch("httpx.AsyncClient.post", new_callable=AsyncMock) as mock_post:
        mock_post.return_value = mock_403
        doc_res = await agent.get_document_full_text(doc_id="9999999")
        assert "403" in doc_res["error"]

    # Test timeout
    with patch("httpx.AsyncClient.post", new_callable=AsyncMock) as mock_post:
        mock_post.side_effect = httpx.TimeoutException("Timeout")
        doc_res = await agent.get_document_full_text(doc_id="9999999")
        assert "timed out" in doc_res["error"].lower()

    # Test malformed JSON
    mock_malformed = MagicMock()
    mock_malformed.status_code = 200
    mock_malformed.json.side_effect = ValueError("Bad JSON")
    with patch("httpx.AsyncClient.post", new_callable=AsyncMock) as mock_post:
        mock_post.return_value = mock_malformed
        doc_res = await agent.get_document_full_text(doc_id="9999999")
        assert "Malformed JSON" in doc_res["error"]

    print("PASS: test_get_document_full_text_errors")


async def test_publication_vs_decision_date_distinction():
    agent = LiveCaseLawAgent(token="mock_token")

    mock_resp = MagicMock()
    mock_resp.status_code = 200
    mock_resp.json.return_value = {
        "docs": [
            {
                "tid": 789,
                "title": "Date Test Judgment",
                "publishdate": "2021-11-10"
            }
        ]
    }

    with patch("httpx.AsyncClient.post", new_callable=AsyncMock) as mock_post:
        mock_post.return_value = mock_resp
        result = await agent.search_live_cases(query="date test")

        j = result["judgments"][0]
        # publishdate must map to publication_date, decision_date must NOT be invented
        assert j["publication_date"] == "2021-11-10"
        assert j["decision_date"] is None
        assert "publication_date" in result["date_field_note"]
    print("PASS: test_publication_vs_decision_date_distinction")


async def run_all_tests():
    print("Running comprehensive mocked tests for Agent 4...")
    await test_successful_search_parsing()
    await test_search_query_filter_formatting()
    await test_missing_token_handling()
    await test_http_403_forbidden_handling()
    await test_http_429_rate_limit_handling()
    await test_provenance_distinction()
    await test_pagination()
    await test_duplicate_results_deduplication()
    await test_missing_fields_handling()
    await test_timeout_handling()
    await test_malformed_json_handling()
    await test_get_document_full_text_success()
    await test_get_document_full_text_errors()
    await test_publication_vs_decision_date_distinction()
    print("\nALL 14 MOCKED AGENT 4 TESTS PASSED SUCCESSFULLY!")


if __name__ == "__main__":
    asyncio.run(run_all_tests())
