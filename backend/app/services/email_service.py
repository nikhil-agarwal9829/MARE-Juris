import resend
from app.core.config import settings


class EmailService:
    """
    Reusable Resend Transactional Email Service.
    Handles application-level notifications (document completion, compliance updates, alerts).
    Note: Auth emails (signup verification, password reset, OTP) are dispatched directly
    by Supabase Auth via custom SMTP.
    """

    def __init__(self):
        if settings.RESEND_API_KEY:
            resend.api_key = settings.RESEND_API_KEY
        self.from_address = f"{settings.RESEND_FROM_NAME} <{settings.RESEND_FROM_EMAIL}>"

    def send_email(self, to_email: str, subject: str, html_content: str, text_content: str | None = None) -> dict:
        """
        Sends a transactional application email using Resend API.
        """
        if not settings.RESEND_API_KEY:
            raise ValueError("RESEND_API_KEY is not configured in environment.")

        params = {
            "from": self.from_address,
            "to": [to_email],
            "subject": subject,
            "html": html_content,
        }

        if text_content:
            params["text"] = text_content

        response = resend.Emails.send(params)
        return response

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
