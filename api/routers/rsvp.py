import os
import httpx
from fastapi import APIRouter, Depends, Response, status
from sqlalchemy import insert, select
from sqlalchemy.ext.asyncio import AsyncSession

from api.database import get_db
from api.models import EventRSVP
from api.schemas import RsvpCreate, RsvpOut

router = APIRouter(prefix="/api", tags=["rsvp"])

RESEND_API_KEY = os.getenv("RESEND_API_KEY")
NOTIFY_EMAIL = os.getenv("NOTIFY_EMAIL", "utdallasais@gmail.com")


@router.post("/rsvp", response_model=RsvpOut, status_code=status.HTTP_201_CREATED)
async def create_rsvp(rsvp: RsvpCreate, response: Response, db: AsyncSession = Depends(get_db)):
    """
    RSVP to an event. Idempotent per (event, email): a repeat RSVP returns the
    existing record with 200 instead of creating a duplicate.
    """
    email = rsvp.email.strip().lower()

    existing = (
        await db.execute(
            select(EventRSVP).where(EventRSVP.event_slug == rsvp.event_slug, EventRSVP.email == email)
        )
    ).scalar_one_or_none()
    if existing:
        response.status_code = status.HTTP_200_OK
        out = RsvpOut.model_validate(existing)
        out.already_registered = True
        return out

    result = await db.execute(
        insert(EventRSVP)
        .values(
            event_slug=rsvp.event_slug,
            event_name=rsvp.event_name,
            event_date=rsvp.event_date,
            name=rsvp.name.strip(),
            email=email,
            major=rsvp.major,
        )
        .returning(EventRSVP)
    )
    await db.commit()
    row = result.scalar_one()

    if RESEND_API_KEY:
        try:
            await _send_notification_email(row)
        except Exception as e:
            print(f"Error sending email: {e}")
            # Don't fail the request if email fails — the RSVP is already saved

    return RsvpOut.model_validate(row)


async def _send_notification_email(row: EventRSVP):
    """Tell the organization someone RSVP'd."""
    async with httpx.AsyncClient() as client:
        response = await client.post(
            "https://api.resend.com/emails",
            headers={
                "Authorization": f"Bearer {RESEND_API_KEY}",
                "Content-Type": "application/json",
            },
            json={
                "from": "noreply@resend.dev",
                "to": NOTIFY_EMAIL,
                "subject": f"New RSVP: {row.event_name} — {row.name}",
                "text": (
                    f"New RSVP from the AIS UTD website:\n\n"
                    f"Event: {row.event_name} ({row.event_date or 'date TBA'})\n"
                    f"Name: {row.name}\n"
                    f"Email: {row.email}\n"
                    f"Major: {row.major or 'Not specified'}\n"
                ),
            },
        )
        response.raise_for_status()
