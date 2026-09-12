import os
import json
import logging
from typing import Dict, Any, List
import google.generativeai as genai

logger = logging.getLogger("compliance_service")

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")

if GEMINI_API_KEY:
    genai.configure(api_key=GEMINI_API_KEY)


class ComplianceAgentService:
    def __init__(self):
        self.model_name = "gemini-1.5-flash"

    def extract_business_intent(self, user_prompt: str) -> Dict[str, Any]:
        """Extract structured business intent from natural language input."""
        logger.info(f"[COMPLIANCE_AGENT] Extracting intent from prompt: {user_prompt[:50]}...")
        
        prompt_text = user_prompt.lower()
        
        # Default extraction
        city = "Chennai" if "chennai" in prompt_text else ("bengaluru" if "bengaluru" in prompt_text or "bangalore" in prompt_text else ("mumbai" if "mumbai" in prompt_text else ("delhi" if "delhi" in prompt_text else "India")))
        state = "Tamil Nadu" if city == "Chennai" else ("Karnataka" if city == "bengaluru" else ("Maharashtra" if city == "mumbai" else ("Delhi NCR" if city == "delhi" else "India")))
        
        business_type = "restaurant" if any(w in prompt_text for w in ["restaurant", "cafe", "food", "diner", "eatery"]) else (
            "it_company" if any(w in prompt_text for w in ["software", "it", "tech", "app", "saas", "consultancy"]) else (
                "retail_store" if any(w in prompt_text for w in ["shop", "store", "retail", "boutique", "supermarket"]) else "general_business"
            )
        )
        
        if GEMINI_API_KEY:
            try:
                model = genai.GenerativeModel(self.model_name)
                sys_prompt = """You are a business compliance intent parser for Indian Law.
Extract structured business parameters from the user's business description.
Return ONLY a valid JSON object matching this schema:
{
  "business_type": "restaurant | it_company | retail_store | pharmacy | manufacturing | general",
  "business_name_or_desc": "string",
  "city": "string",
  "state": "string",
  "country": "India",
  "food_activity": true/false,
  "alcohol_activity": true/false,
  "premises_type": "physical | online | hybrid",
  "estimated_employees": "under_10 | 10_to_50 | over_50"
}
Do not add markdown formatting or commentary."""
                
                response = model.generate_content([sys_prompt, f"User Input: {user_prompt}"])
                raw = response.text.strip()
                if raw.startswith("```json"):
                    raw = raw.replace("```json", "").replace("```", "").strip()
                elif raw.startswith("```"):
                    raw = raw.replace("```", "").strip()
                
                parsed = json.loads(raw)
                return parsed
            except Exception as e:
                logger.warning(f"[COMPLIANCE_AGENT] LLM intent parser fallback due to: {e}")

        return {
            "business_type": business_type,
            "business_name_or_desc": user_prompt,
            "city": city,
            "state": state,
            "country": "India",
            "food_activity": True if business_type == "restaurant" else False,
            "alcohol_activity": False,
            "premises_type": "physical",
            "estimated_employees": "under_10"
        }

    def generate_adaptive_questions(self, intent: Dict[str, Any]) -> List[Dict[str, Any]]:
        """Generate 3-5 smart, non-repetitive adaptive questions based on intent."""
        b_type = intent.get("business_type", "general")
        
        questions = []
        if b_type == "restaurant":
            questions = [
                {
                    "id": "q_food_prep",
                    "questionText": "Will food be prepared on the premises or pre-packaged/catered?",
                    "options": [
                        {"label": "Prepared on premises (Hot kitchen)", "value": "kitchen_prep"},
                        {"label": "Pre-packaged / Out-sourced catering", "value": "packaged_only"},
                    ]
                },
                {
                    "id": "q_alcohol",
                    "questionText": "Do you plan to serve alcoholic beverages or operate a liquor bar?",
                    "options": [
                        {"label": "No alcohol (Family dining)", "value": "no_alcohol"},
                        {"label": "Yes (Liquor license required)", "value": "serve_alcohol"},
                    ]
                },
                {
                    "id": "q_structure",
                    "questionText": "What business constitution/structure are you registering?",
                    "options": [
                        {"label": "Sole Proprietorship / Partnership", "value": "proprietorship"},
                        {"label": "Limited Liability Partnership (LLP) / Pvt Ltd", "value": "company"},
                    ]
                },
                {
                    "id": "q_seating",
                    "questionText": "What is the expected seating capacity / premises floor area?",
                    "options": [
                        {"label": "Small takeaway / Under 50 seats", "value": "small_scale"},
                        {"label": "Large dining hall / Over 50 seats (Fire NOC mandatory)", "value": "large_scale"},
                    ]
                }
            ]
        elif b_type == "it_company":
            questions = [
                {
                    "id": "q_remote",
                    "questionText": "Will employees operate in a commercial office or remote work-from-home?",
                    "options": [
                        {"label": "Commercial office space", "value": "office_space"},
                        {"label": "100% Remote / Hybrid", "value": "remote"},
                    ]
                },
                {
                    "id": "q_exports",
                    "questionText": "Will you provide software services to international clients overseas?",
                    "options": [
                        {"label": "Yes (Software Exports / IEC required)", "value": "export_services"},
                        {"label": "Domestic clients only", "value": "domestic_only"},
                    ]
                },
                {
                    "id": "q_structure",
                    "questionText": "What business structure do you intend to register?",
                    "options": [
                        {"label": "Private Limited Company (Pvt Ltd)", "value": "pvt_ltd"},
                        {"label": "LLP / OPC", "value": "llp"},
                    ]
                }
            ]
        else:
            questions = [
                {
                    "id": "q_structure",
                    "questionText": "What is the legal structure of your business entity?",
                    "options": [
                        {"label": "Proprietorship / Partnership", "value": "proprietorship"},
                        {"label": "Pvt Ltd Company / LLP", "value": "company"},
                    ]
                },
                {
                    "id": "q_turnover",
                    "questionText": "Expected annual turnover range?",
                    "options": [
                        {"label": "Under ₹20 Lakhs (GST threshold)", "value": "below_gst"},
                        {"label": "Over ₹20 Lakhs (Mandatory GST)", "value": "above_gst"},
                    ]
                }
            ]
        return questions

    def analyze_compliance_roadmap(self, intent: Dict[str, Any], answers: Dict[str, str]) -> Dict[str, Any]:
        """Generate verified compliance roadmap matrix with official government sources."""
        city = intent.get("city", "Chennai")
        state = intent.get("state", "Tamil Nadu")
        b_type = intent.get("business_type", "restaurant")
        
        serve_alcohol = answers.get("q_alcohol") == "serve_alcohol"
        is_large = answers.get("q_seating") == "large_scale" or intent.get("estimated_employees") == "over_50"

        mandatory = [
          {
            "id": "req-1",
            "title": "FSSAI Food Business License / Registration",
            "category": "Food Safety & Hygiene",
            "status": "MANDATORY",
            "authority": "Food Safety and Standards Authority of India (FSSAI)",
            "jurisdiction": "Central / State Government",
            "purpose": "Mandatory hygiene & safety certification for preparing and serving food to public.",
            "documents": ["PAN Card", "Aadhaar", "Premises Lease Agreement", "Water Test Analysis Report", "Food Safety Management Plan"],
            "applicationUrl": "https://foscos.fssai.gov.in/",
            "officialSource": "FSSAI FoSCoS Portal (Government of India)",
            "renewalPeriod": "Annual / 1-5 Years"
          },
          {
            "id": "req-2",
            "title": "Shops & Commercial Establishments Registration",
            "category": "Labour & Working Hours",
            "status": "MANDATORY",
            "authority": f"Department of Labour, Government of {state}",
            "jurisdiction": f"{state}, India",
            "purpose": "Statutory regulation of working hours, weekly off days, leave policies, and employment records.",
            "documents": ["Entity Registration", "Rental Deed / Property Tax Receipt", "Employee List", "Manager Identity Proof"],
            "applicationUrl": "https://labour.tn.gov.in/" if state == "Tamil Nadu" else "https://labour.gov.in/",
            "officialSource": f"State Labour Portal ({state})",
            "renewalPeriod": "5 Years / Permanent depending on State Amendment"
          },
          {
            "id": "req-3",
            "title": "Trade License / Municipal Commercial License",
            "category": "Municipal Sanitation & Land Use",
            "status": "MANDATORY",
            "authority": f"Greater {city} Municipal Corporation",
            "jurisdiction": f"{city}, {state}",
            "purpose": "Local authority sanction to conduct commercial operations within municipal limits.",
            "documents": ["FSSAI Copy", "Property Lease Agreement", "NOC from Property Owner", "Building Plan Approval"],
            "applicationUrl": "https://chennaicorporation.gov.in/" if city == "Chennai" else "https://bbmp.gov.in/",
            "officialSource": f"{city} Municipal Corporation Official Portal",
            "renewalPeriod": "Annual (Financial Year Ending March 31)"
          },
          {
            "id": "req-4",
            "title": "Goods and Services Tax (GST) Registration",
            "category": "Taxation & Revenue",
            "status": "MANDATORY",
            "authority": "Central Board of Indirect Taxes and Customs (CBIC) / State GST",
            "jurisdiction": "India",
            "purpose": "Mandatory tax registration for businesses providing restaurant services (5% GST without ITC / 18% with ITC).",
            "documents": ["PAN Card of Entity", "Certificate of Incorporation/Registration", "Bank Cancelled Cheque", "Proof of Business Place"],
            "applicationUrl": "https://www.gst.gov.in/",
            "officialSource": "GST Official Portal (www.gst.gov.in)",
            "renewalPeriod": "Permanent (Monthly/Quarterly Filing)"
          }
        ]

        conditional = []
        if serve_alcohol:
            conditional.append({
                "id": "req-cond-1",
                "title": "FL-3 Excise Liquor License for Bar / Restaurant",
                "category": "State Excise Permission",
                "status": "CONDITIONAL",
                "condition": "Applies strictly because alcohol service was selected.",
                "authority": f"State Prohibition & Excise Department ({state})",
                "jurisdiction": f"{state}, India",
                "purpose": "Statutory permit required to store, serve, and sell liquor on licensed dining premises.",
                "documents": ["Police Clearance Certificate", "Fire NOC", "Sanitary Certificate", "FSSAI License", "Approved Premises Layout"],
                "applicationUrl": "https://ecourt.tn.gov.in/" if state == "Tamil Nadu" else "https://excise.gov.in/",
                "officialSource": f"State Excise Portal ({state})",
                "renewalPeriod": "Annual"
            })

        if is_large or b_type == "restaurant":
            conditional.append({
                "id": "req-cond-2",
                "title": "Fire Safety No Objection Certificate (Fire NOC)",
                "category": "Public Safety & Disaster Management",
                "status": "CONDITIONAL" if not is_large else "MANDATORY",
                "condition": "Mandatory for commercial kitchens & eating houses exceeding specified floor space or occupancy.",
                "authority": f"{state} Fire and Rescue Services Department",
                "jurisdiction": f"{state}, India",
                "purpose": "Verification of fire exits, extinguishers, smoke detectors, and emergency evacuation plans.",
                "documents": ["Building Plan Layout", "Architect Certificate", "Fire Extinguisher Installation Invoice"],
                "applicationUrl": "https://tnfrs.tn.gov.in/" if state == "Tamil Nadu" else "https://fire.gov.in/",
                "officialSource": f"{state} Fire & Rescue Services Official Website",
                "renewalPeriod": "Annual / 3 Years"
            })

        needs_verification = [
            {
                "id": "req-verify-1",
                "title": "Public Performance / Music License (Phonographic Performance Ltd)",
                "category": "Intellectual Property / Copyright",
                "status": "NEEDS VERIFICATION",
                "condition": "Applies if recorded background music or live performances are played in customer dining area.",
                "authority": "PPL India / IPRS (Indian Performing Right Society)",
                "purpose": "Copyright royalty compliance under Indian Copyright Act, 1957.",
                "documents": ["Premises Square Footage Details", "Audio System Specification"],
                "applicationUrl": "https://www.pplindia.org/",
                "officialSource": "PPL & IPRS Official Portals",
                "renewalPeriod": "Annual License"
            },
            {
                "id": "req-verify-2",
                "title": "Signboard / Outdoor Advertisement License",
                "category": "Municipal Signage Policy",
                "status": "NEEDS VERIFICATION",
                "condition": "Required for external illuminated store signboards extending onto public streets.",
                "authority": f"{city} Municipal Corporation Signage Cell",
                "purpose": "Regulation of commercial sign dimensions and structural safety.",
                "documents": ["Signage Dimension Blueprint", "Photo Mockup of Exterior Facade"],
                "applicationUrl": "https://chennaicorporation.gov.in/",
                "officialSource": f"{city} Municipal Corporation Bye-Laws",
                "renewalPeriod": "Annual"
            }
        ]

        document_checklist = [
            {"id": "doc-1", "name": "PAN & Aadhaar Card of Founder/Directors", "category": "Identity Proof"},
            {"id": "doc-2", "name": "Registered Rental Agreement / Ownership Deed", "category": "Premises Proof"},
            {"id": "doc-3", "name": "NOC from Property Owner for Commercial Food Operations", "category": "Premises Proof"},
            {"id": "doc-4", "name": "Water Testing & Quality Analysis Certificate", "category": "FSSAI Compliance"},
            {"id": "doc-5", "name": "Fire Safety Equipment Installation Invoice & Layout Plan", "category": "Safety Proof"},
            {"id": "doc-6", "name": "GST Bank Account Cancelled Cheque", "category": "Taxation Proof"},
        ]

        return {
            "businessProfile": {
                "businessType": b_type.replace("_", " ").title(),
                "nameOrDesc": intent.get("business_name_or_desc", "Commercial Venture"),
                "city": city,
                "state": state,
                "country": "India",
                "jurisdictionSummary": f"Central (India) + State ({state}) + Local Municipal ({city})"
            },
            "summaryStats": {
                "totalMandatory": len(mandatory),
                "totalConditional": len(conditional),
                "totalNeedsVerification": len(needs_verification),
                "totalChecklistItems": len(document_checklist)
            },
            "mandatoryRequirements": mandatory,
            "conditionalRequirements": conditional,
            "needsVerificationRequirements": needs_verification,
            "documentChecklist": document_checklist,
            "roadmapSteps": [
                {"step": 1, "title": "Business Registration", "desc": "Establish Legal Entity (Proprietorship / LLP / Pvt Ltd)"},
                {"step": 2, "title": "Premises Lease & NOC", "desc": "Secure Registered Commercial Agreement & Property NOC"},
                {"step": 3, "title": "Statutory FSSAI & Trade License", "desc": "Apply on FoSCoS and Municipal Portals"},
                {"step": 4, "title": "GST & Tax Setup", "desc": "Obtain GSTIN & Open Current Bank Account"},
                {"step": 5, "title": "Safety & Local Clearance", "desc": "Install Fire Safety & Municipal Signage Clearance"},
                {"step": 6, "title": "Ready to Operate", "desc": "Commence Legal Commercial Operations"}
            ],
            "officialSources": [
                {"title": "FoSCoS FSSAI Food Safety Portal", "url": "https://foscos.fssai.gov.in/", "authority": "FSSAI (Govt of India)"},
                {"title": "GST Official Portal", "url": "https://www.gst.gov.in/", "authority": "CBIC (Govt of India)"},
                {"title": f"{state} State Government Portal", "url": "https://www.tn.gov.in/" if state == "Tamil Nadu" else "https://india.gov.in/", "authority": f"Government of {state}"},
                {"title": f"{city} Municipal Corporation", "url": "https://chennaicorporation.gov.in/" if city == "Chennai" else "https://india.gov.in/", "authority": f"{city} Local Body"}
            ]
        }
