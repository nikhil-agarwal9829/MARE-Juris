import httpx
from app.core.config import settings


class EmailService:
    """
    Reusable Brevo Transactional Email Service.
    Handles application-level notifications (document completion, compliance updates, alerts)
    via Brevo REST API v3.
    Note: Supabase Auth emails (signup verification, password reset, OTP) are dispatched directly
    by Supabase Auth via Brevo Custom SMTP.
    """

    def __init__(self):
        self.api_url = "https://api.brevo.com/v3/smtp/email"
        self.headers = {
            "accept": "application/json",
            "api-key": settings.BREVO_API_KEY,
            "content-type": "application/json"
        }

    def send_email(self, to_email: str, subject: str, html_content: str, text_content: str | None = None) -> dict:
        """
        Sends a transactional application email using Brevo REST API v3.
        """
        if not settings.BREVO_API_KEY:
            raise ValueError("BREVO_API_KEY is not configured in environment.")

        payload = {
            "sender": {
                "name": settings.BREVO_FROM_NAME,
                "email": settings.BREVO_FROM_EMAIL
            },
            "to": [{"email": to_email}],
            "subject": subject,
            "htmlContent": html_content
        }

        if text_content:
            payload["textContent"] = text_content

        with httpx.Client(timeout=10.0) as client:
            response = client.post(self.api_url, json=payload, headers=self.headers)
            response.raise_for_status()
            return response.json()

    def send_document_analysis_completed_notification(self, user_email: str, document_title: str) -> dict:
        """
        Notifies user when legal document analysis completes.
        """
        subject = f"Document Analysis Completed: {document_title}"
        html_content = f"""
        <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
            <h2>Document Analysis Ready</h2>
            <p>Your document <strong>{document_title}</strong> has been successfully processed and indexed by MARE-Juris.</p>
            <p>You can now view evidence citations, grounded claims, and compliance insights in your dashboard.</p>
            <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
            <p style="font-size: 12px; color: #777;">MARE-Juris Legal Decision Support Platform</p>
        </div>
        """
        return self.send_email(to_email=user_email, subject=subject, html_content=html_content)

    def send_compliance_update_notification(self, user_email: str, compliance_title: str, status_summary: str) -> dict:
        """
        Notifies user regarding a compliance check update.
        """
        subject = f"Compliance Update: {compliance_title}"
        html_content = f"""
        <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
            <h2>Compliance Assessment Update</h2>
            <p>The compliance evaluation <strong>{compliance_title}</strong> has new findings:</p>
            <blockquote style="background: #f9f9f9; padding: 10px; border-left: 4px solid #0056b3;">
                {status_summary}
            </blockquote>
            <p>Log in to MARE-Juris to review full details and mitigation guidance.</p>
        </div>
        """
        return self.send_email(to_email=user_email, subject=subject, html_content=html_content)


email_service = EmailService()
