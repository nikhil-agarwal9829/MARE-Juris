from typing import Dict, Any
import re


class LegalQueryClassifier:
    """
    Semantic Legal Query Relevance Classifier for MARE-Juris.
    Evaluates intent before sending queries to the RAG retrieval and answer-generation pipeline.
    """

    AMBIGUOUS_TERMS = {
        "notice": "Could you clarify what type of legal notice you mean? For example, a rental notice, employment notice, legal notice, or court notice?",
        "420": "Are you referring to Section 420 of IPC / Section 318 of BNS (Cheating) or another legal reference?",
        "court": "Could you specify which court or legal proceeding you are asking about (e.g. Supreme Court, High Court, Civil Court, or FIR procedure)?",
        "landlord": "Could you describe the legal issue involving your landlord (e.g. eviction notice, security deposit refund, or tenancy agreement dispute)?",
        "rent": "Could you specify the tenancy or rent dispute issue you are facing?",
        "bail": "Could you clarify the offense or legal proceeding for which you are inquiring about bail?",
        "fir": "Could you clarify if you are asking about the procedure to file an FIR, quashing an FIR, or zero FIR?",
    }

    NON_INDIAN_JURISDICTIONS = ["uk", "united kingdom", "us", "usa", "united states", "canada", "australia", "singapore", "dubai", "uae"]

    OFF_TOPIC_PATTERNS = [
        r"^kya\s+hua\s*.*",
        r"^(hi|hello|hey|greetings|hola|wassup|sup)\s*!*$",
        r".*tell\s+me\s+a\s+joke.*",
        r".*what('s|\s+is)\s+the\s+weather.*",
        r".*who\s+won.*cricket.*",
        r".*who\s+won.*match.*",
        r".*write\s+me\s+a\s+poem.*",
        r".*sing\s+a\s+song.*",
        r".*who\s+are\s+you.*",
        r".*recipe\s+for.*",
        r".*how\s+to\s+cook.*",
    ]

    LEGAL_KEYWORDS = [
        "law", "act", "section", "article", "court", "rights", "tenant", "landlord",
        "eviction", "notice", "contract", "agreement", "fir", "police", "bail", "bns",
        "ipc", "crpc", "bnss", "bsa", "constitution", "gst", "company", "incorporation",
        "compliance", "consumer", "complaint", "divorce", "cheating", "fraud", "property",
        "lease", "rent", "labour", "employment", "cyber", "defamation", "affidavit",
        "power of attorney", "will", "probate", "injunction", "appeal", "high court",
        "supreme court", "highcourt", "supremecourt", "tribunal", "nclt", "rbi", "sebi"
    ]

    def classify(self, query: str) -> Dict[str, Any]:
        raw_query = query.strip()
        query_lower = raw_query.lower()

        # 1. Check for Ambiguous Short Queries
        clean_word = re.sub(r'[^\w\s]', '', query_lower).strip()
        if clean_word in self.AMBIGUOUS_TERMS:
            return {
                "is_legal": False,
                "confidence": 0.95,
                "category": "ambiguous",
                "jurisdiction": "India",
                "requires_rag": False,
                "response": self.AMBIGUOUS_TERMS[clean_word]
            }

        # 2. Check for Non-Indian Jurisdiction Queries
        for jur in self.NON_INDIAN_JURISDICTIONS:
            if re.search(r'\b' + jur + r'\b', query_lower):
                return {
                    "is_legal": False,
                    "confidence": 0.98,
                    "category": "non_indian_jurisdiction",
                    "jurisdiction": jur.upper(),
                    "requires_rag": False,
                    "response": "MARE-Juris currently focuses on Indian law. I can help with Indian legal provisions, statutes, and court precedents, but I cannot reliably apply foreign jurisdiction law."
                }

        # 3. Check for Explicit Off-Topic Queries
        for pattern in self.OFF_TOPIC_PATTERNS:
            if re.match(pattern, query_lower):
                return {
                    "is_legal": False,
                    "confidence": 0.99,
                    "category": "off_topic",
                    "jurisdiction": "India",
                    "requires_rag": False,
                    "response": "MARE-Juris is designed to help with Indian legal information, laws, rights, regulations, court procedures, and compliance-related questions. Please ask a question related to law or a legal matter."
                }

        # 4. Check for Semantic Legal Match
        has_legal_keyword = any(kw in query_lower for kw in self.LEGAL_KEYWORDS)
        
        # Additional heuristic: If words indicate legal dispute/issue
        has_legal_structure = any(w in query_lower for w in [
            "claim", "sue", "legal", "right", "illegal", "prohibited", "punishment",
            "penalty", "duty", "obligation", "dispute", "owner", "bill", "agreement",
            "evict", "eviction", "case", "lawyer", "advocate", "judge", "judgment"
        ])

        if has_legal_keyword or has_legal_structure or len(raw_query.split()) >= 4:
            # High probability legal query
            return {
                "is_legal": True,
                "confidence": 0.95,
                "category": "legal_query",
                "jurisdiction": "India",
                "requires_rag": True,
                "response": None
            }

        # 5. Default Fallback for Unrecognized Off-Topic Short Queries
        return {
            "is_legal": False,
            "confidence": 0.90,
            "category": "off_topic",
            "jurisdiction": "India",
            "requires_rag": False,
            "response": "MARE-Juris is designed to help with Indian legal information, laws, rights, regulations, court procedures, and compliance-related questions. Please ask a question related to law or a legal matter."
        }


legal_classifier = LegalQueryClassifier()
