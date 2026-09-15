"""Central retrieval tuning for Ask MARE-Juris RAG (single source of truth)."""

VECTOR_TOP_K = 20
BM25_TOP_K = 20
RERANK_TOP_K = 12
FINAL_EVIDENCE_K = 8

# After score normalization + rerank (0–1 scale)
MIN_RELEVANCE_PARTIAL = 0.15
MIN_RELEVANCE_FULL = 0.38

VECTOR_MIN_RAW_SIMILARITY = 0.02
