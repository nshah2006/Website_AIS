import os
import httpx
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import insert

from api.database import get_db
from api.models import ContactSubmission
from api.schemas import ContactCreate, ContactOut

router = APIRouter(prefix="/api", tags=["contact"])

RESEND_API_KEY = os.getenv("RESEND_API_KEY")
NOTIFY_EMAIL = os.getenv("NOTIFY_EMAIL", "utdallasais@gmail.com")


@router.post("/contact", response_model=ContactOut, status_code=status.HTTP_201_CREATED)
async def create_contact(contact: ContactCreate, db: AsyncSession = Depends(get_db)):
    """
    Create a new contact submission and send email notification.
    """
    # Insert into database
    stmt = insert(ContactSubmission).values(
        name=contact.name,
        email=contact.email,
        major=contact.major,
        message=contact.message,
        source=contact.source,
    ).returning(ContactSubmission)

    result = await db.execute(stmt)
    await db.commit()
    submission = result.scalar_one()

    # Send email notification via Resend
    if RESEND_API_KEY:
        try:
            await _send_notification_email(submission)
        except Exception as e:
            print(f"Error sending email: {e}")
            # Don't fail the request if email fails — data is already saved

    return ContactOut.model_validate(submission)


async def _send_notification_email(submission: ContactSubmission):
    """Send an email notification to the organization."""
    async with httpx.AsyncClient() as client:
        message = f"""
New interest submission from AIS UTD website:

Name: {submission.name}
Email: {submission.email}
Major: {submission.major or "Not specified"}
Source: {submission.source}
Submitted: {submission.created_at}

Message:
{submission.message or "No message provided"}
"""

        response = await client.post(
            "https://api.resend.com/emails",
            headers={
                "Authorization": f"Bearer {RESEND_API_KEY}",
                "Content-Type": "application/json",
            },
            json={
                "from": "noreply@resend.dev",
                "to": NOTIFY_EMAIL,
                "subject": f"New AIS UTD Interest: {submission.name}",
                "text": message,
            },
        )
        response.raise_for_status()
