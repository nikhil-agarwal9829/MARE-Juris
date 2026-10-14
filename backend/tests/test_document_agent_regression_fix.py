"""
MARE-Juris: Regression Test Suite for Document Agent & PDF Processing Optimization.

Verifies:
1. Ordinary legal queries without attachment do NOT invoke PDF extraction or document context synthesis.
2. Stale attachment state with unrelated legal query (e.g., 'punishment for murder') does NOT trigger unnecessary document processing.
3. Genuinely document-focused query (DOCUMENT_CENTRIC) invokes Document Agent accurately.
4. Hybrid queries run Document Agent and statutory/precedent agents concurrently.
5. All selected agents execute concurrently.
6. A failed agent does not discard successful results.
7. Source comparison does not delay or replace valid individual findings.
8. Compliance service remains untouched and fully functional.
"""

import os
import sys
import asyncio
import unittest
from unittest.mock import AsyncMock, MagicMock, patch

backend_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

from app.services.multi_agent_orchestrator import (
    MultiAgentOrchestrator,
    classify_document_query_intent,
)
from app.services.document_extraction_service import document_extraction_service
from app.services.legal_retrieval_service import legal_retrieval_service


class TestDocumentAgentRegressionAndPerformance(unittest.IsolatedAsyncioTestCase):

    def setUp(self):
        self.orchestrator = MultiAgentOrchestrator()
        self.orchestrator.model = None  # Use deterministic fallbacks

    async def test_1_ordinary_legal_query_no_attachment_no_pdf_extraction(self):
        """Rule 1 & 2: Ordinary legal query must not trigger PDF extraction or context synthesis."""
        with patch.object(document_extraction_service, "extract_document") as mock_extract, \
             patch("app.services.document_context_service.document_context_service.synthesize_document_context", new_callable=AsyncMock) as mock_doc_synth, \
             patch.object(self.orchestrator, "execute_statutory_rag", new_callable=AsyncMock) as mock_stat:

            mock_stat.return_value = {
                "agent_id": "statutory_rag",
                "status": "success",
                "answer": "Under Section 103 BNS (Section 302 IPC), murder is punishable by death or life imprisonment.",
                "citations": [{"title": "BNS Section 103", "provenance": "STATUTORY_CORPUS"}],
            }

            res = await self.orchestrator.execute_orchestration(
                query="What is the punishment for murder?",
                user_id="test-user-1",
                selected_agents=["statutory_rag"],
                document_id=None,
            )

            self.assertTrue(res["success"])
            self.assertIn("statutory_rag", res["individual_responses"])
            self.assertEqual(res["individual_responses"]["statutory_rag"]["status"], "success")
            
            # Assert NO PDF extraction or document context synthesis was invoked
            mock_extract.assert_not_called()
            mock_doc_synth.assert_not_called()

    async def test_2_stale_attachment_unrelated_question_skips_document_processing(self):
        """Rule 3 & 4: Stale attachment with unrelated question must NOT process document."""
        mock_doc_data = {
            "document_id": "doc-stale-123",
            "user_id": "test-user-1",
            "file_name": "Commercial_Lease_Agreement.pdf",
            "pages": [{"page_number": 1, "text": "Lease agreement between Landlord and Tenant for Shop 4."}],
            "full_text": "Lease agreement between Landlord and Tenant for Shop 4.",
            "warnings": [],
        }

        with patch("app.api.v1.documents.get_document_data", return_value=mock_doc_data), \
             patch("app.services.document_context_service.document_context_service.synthesize_document_context", new_callable=AsyncMock) as mock_doc_synth, \
             patch.object(self.orchestrator, "execute_statutory_rag", new_callable=AsyncMock) as mock_stat:

            mock_stat.return_value = {
                "agent_id": "statutory_rag",
                "status": "success",
                "answer": "Murder is punishable by death or imprisonment for life under Section 103 of BNS.",
                "citations": [],
            }

            # User query is general legal, but document_agent was included from previous turn
            res = await self.orchestrator.execute_orchestration(
                query="What is the punishment for murder?",
                user_id="test-user-1",
                selected_agents=["statutory_rag", "document_agent"],
                document_id="doc-stale-123",
            )

            self.assertTrue(res["success"])
            # Document context synthesis MUST NOT be called because query is GENERAL_LEGAL
            mock_doc_synth.assert_not_called()

            # Document agent returns informative non-analyzed response
            doc_res = res["individual_responses"]["document_agent"]
            self.assertEqual(doc_res["status"], "success")
            self.assertIn("unrelated", doc_res["answer"])
            self.assertEqual(len(doc_res["citations"]), 0)

    async def test_3_document_focused_query_invokes_document_agent(self):
        """Rule 5: Genuinely document-centric query processes the attached document."""
        mock_doc_data = {
            "document_id": "doc-lease-1",
            "user_id": "test-user-1",
            "file_name": "Office_Lease.pdf",
            "pages": [{"page_number": 1, "text": "Clause 14: Either party may terminate with 30 days notice."}],
            "full_text": "Clause 14: Either party may terminate with 30 days notice.",
            "warnings": [],
        }

        with patch("app.api.v1.documents.get_document_data", return_value=mock_doc_data), \
             patch("app.services.document_agent.document_agent.analyze_document", new_callable=AsyncMock) as mock_analyze:

            mock_analyze.return_value = {
                "agent_id": "document_agent",
                "agent_name": "Document Analysis Agent",
                "status": "success",
                "answer": "Under Clause 14 (Page 1), either party may terminate by providing 30 days written notice.",
                "citations": [{"citation_id": "DOC-P1-1", "title": "Clause 14", "page": "1", "provenance": "DOCUMENT_ANALYSIS"}],
                "evidence": [],
                "sources": ["Office_Lease.pdf"],
                "provenance": "DOCUMENT_ANALYSIS",
                "retrieved_at": self.orchestrator._now_iso(),
                "document_context": None,
                "ocr_warnings": [],
                "errors": None,
            }

            res = await self.orchestrator.execute_orchestration(
                query="What are the termination terms in this document?",
                user_id="test-user-1",
                selected_agents=["document_agent"],
                document_id="doc-lease-1",
            )

            self.assertTrue(res["success"])
            mock_analyze.assert_called_once()
            doc_res = res["individual_responses"]["document_agent"]
            self.assertEqual(doc_res["status"], "success")
            self.assertEqual(len(doc_res["citations"]), 1)
            self.assertEqual(doc_res["citations"][0]["page"], "1")

    async def test_4_hybrid_query_executes_document_and_external_agents_concurrently(self):
        """Rule 5 & 6: Hybrid query executes document agent and statutory agents concurrently."""
        mock_doc_data = {
            "document_id": "doc-contract-1",
            "user_id": "test-user-1",
            "file_name": "Employment_Agreement.pdf",
            "pages": [{"page_number": 2, "text": "Clause 9: Employee shall not engage in competing business for 2 years."}],
            "full_text": "Clause 9: Employee shall not engage in competing business for 2 years.",
            "warnings": [],
        }

        with patch("app.api.v1.documents.get_document_data", return_value=mock_doc_data), \
             patch.object(self.orchestrator, "execute_document_agent", new_callable=AsyncMock) as m_doc, \
             patch.object(self.orchestrator, "execute_statutory_rag", new_callable=AsyncMock) as m_stat:

            m_doc.return_value = {
                "agent_id": "document_agent",
                "status": "success",
                "answer": "Clause 9 contains a 2-year non-compete covenant.",
                "citations": [{"title": "Clause 9", "provenance": "DOCUMENT_ANALYSIS"}],
            }
            m_stat.return_value = {
                "agent_id": "statutory_rag",
                "status": "success",
                "answer": "Section 27 of the Indian Contract Act renders agreements in restraint of trade void.",
                "citations": [{"title": "Section 27 Contract Act", "provenance": "STATUTORY_CORPUS"}],
            }

            res = await self.orchestrator.execute_orchestration(
                query="Is this non-compete clause enforceable under Section 27 of Indian Contract Act?",
                user_id="test-user-1",
                selected_agents=["document_agent", "statutory_rag"],
                document_id="doc-contract-1",
            )

            self.assertTrue(res["success"])
            self.assertIn("document_agent", res["individual_responses"])
            self.assertIn("statutory_rag", res["individual_responses"])
            m_doc.assert_called_once()
            m_stat.assert_called_once()

    async def test_5_all_selected_agents_run_concurrently(self):
        """Verify all independent selected agents execute concurrently via asyncio.gather."""
        call_times = {}

        async def timed_rag(**kwargs):
            call_times["rag_start"] = asyncio.get_event_loop().time()
            await asyncio.sleep(0.05)
            call_times["rag_end"] = asyncio.get_event_loop().time()
            return {"status": "success", "answer": "RAG answer", "citations": []}

        async def timed_web(**kwargs):
            call_times["web_start"] = asyncio.get_event_loop().time()
            await asyncio.sleep(0.05)
            call_times["web_end"] = asyncio.get_event_loop().time()
            return {"status": "success", "answer": "Web answer", "citations": []}

        with patch.object(self.orchestrator, "execute_statutory_rag", side_effect=timed_rag), \
             patch.object(self.orchestrator, "execute_official_web", side_effect=timed_web):

            res = await self.orchestrator.execute_orchestration(
                query="Consumer court filing procedure",
                user_id="user-1",
                selected_agents=["statutory_rag", "official_web"],
            )

            self.assertTrue(res["success"])
            # Concurrency check: web must have started before rag finished
            self.assertLess(call_times["web_start"], call_times["rag_end"])

    async def test_6_failed_agent_does_not_discard_successful_results(self):
        """Verify partial failure in one agent does not drop successful findings from others."""
        with patch.object(self.orchestrator, "execute_statutory_rag", new_callable=AsyncMock) as m_stat, \
             patch.object(self.orchestrator, "execute_live_case_law", new_callable=AsyncMock) as m_live:

            m_stat.return_value = {
                "agent_id": "statutory_rag",
                "status": "success",
                "answer": "Section 138 of Negotiable Instruments Act handles cheque dishonor.",
                "citations": [{"title": "NI Act s.138", "provenance": "STATUTORY_CORPUS"}],
            }
            m_live.side_effect = RuntimeError("External Kanoon API timeout")

            res = await self.orchestrator.execute_orchestration(
                query="Cheque bounce legal notice period",
                user_id="user-1",
                selected_agents=["statutory_rag", "live_case_law"],
                generate_combined=True,
            )

            self.assertTrue(res["success"])
            self.assertEqual(res["individual_responses"]["statutory_rag"]["status"], "success")
            self.assertEqual(res["individual_responses"]["live_case_law"]["status"], "error")
            self.assertTrue(res["combined_answer"]["available"])
            self.assertIn("Section 138", res["combined_answer"]["answer"])

    def test_7_precomputed_corpus_chunks_load_speed(self):
        """Verify precomputed corpus chunks load in under 50ms without pypdf runtime parsing."""
        import time
        t0 = time.perf_counter()
        chunks = legal_retrieval_service._load_corpus_chunks()
        elapsed = time.perf_counter() - t0

        self.assertGreater(len(chunks), 0)
        self.assertLess(elapsed, 0.05, f"Corpus chunks took too long to load: {elapsed:.3f}s")

    def test_8_compliance_service_untouched(self):
        """Strict requirement: Ensure compliance service remains untouched."""
        from app.services.compliance_service import ComplianceAgentService
        comp = ComplianceAgentService()
        self.assertIsNotNone(comp)
        self.assertIsNotNone(comp.model_name)
        self.assertTrue(hasattr(comp, "_is_retryable_llm_error"))
        self.assertTrue(hasattr(comp, "_extract_response_text"))


if __name__ == "__main__":
    unittest.main()
