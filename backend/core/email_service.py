import os
import json
import urllib.request
import urllib.error
import logging

logger = logging.getLogger(__name__)

RESEND_API_URL = "https://api.resend.com/emails"


def get_resend_api_key():
    return os.environ.get("RESEND_API_KEY", "").strip()


def get_resend_from_email():
    return os.environ.get("RESEND_FROM_EMAIL", "pingbud.us <onboarding@resend.dev>").strip()


def send_email_via_resend(to, subject, html_content, text_content=None):
    """
    Sends an email using the Resend API (https://resend.com).
    If RESEND_API_KEY is not configured in the environment,
    it logs cleanly and returns a simulated success result so local dev / demos work seamlessly.
    """
    api_key = get_resend_api_key()
    from_email = get_resend_from_email()

    if isinstance(to, str):
        to_list = [to]
    else:
        to_list = list(to)

    payload = {
        "from": from_email,
        "to": to_list,
        "subject": subject,
        "html": html_content,
    }
    if text_content:
        payload["text"] = text_content

    if not api_key:
        logger.info(f"[Resend Email Simulated] To: {to_list} | Subject: '{subject}' | (Set RESEND_API_KEY to send live emails via Resend)")
        return {
            "ok": True,
            "id": f"sim_{os.urandom(6).hex()}",
            "simulated": True,
            "message": f"Email prepared for {', '.join(to_list)} (Resend simulation mode). Set RESEND_API_KEY in settings to send live."
        }

    data = json.dumps(payload).encode("utf-8")
    req = urllib.request.Request(
        RESEND_API_URL,
        data=data,
        headers={
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json",
            "User-Agent": "pingbud.us-Mailer/1.0"
        },
        method="POST"
    )

    try:
        with urllib.request.urlopen(req, timeout=12) as resp:
            body = resp.read().decode("utf-8")
            res_data = json.loads(body)
            logger.info(f"[Resend Email Dispatched] ID: {res_data.get('id')} to {to_list}")
            return {
                "ok": True,
                "id": res_data.get("id"),
                "simulated": False,
                "message": f"Email successfully delivered to {', '.join(to_list)} via Resend."
            }
    except urllib.error.HTTPError as e:
        err_body = e.read().decode("utf-8", errors="ignore")
        logger.error(f"[Resend Email Error] HTTP {e.code}: {err_body}")
        try:
            err_json = json.loads(err_body)
            err_msg = err_json.get("message", str(e))
        except Exception:
            err_msg = err_body or str(e)
        return {
            "ok": False,
            "error": f"Resend API error: {err_msg}",
            "code": e.code
        }
    except Exception as e:
        logger.error(f"[Resend Email Exception] {e}")
        return {
            "ok": False,
            "error": str(e)
        }
