from sqlalchemy import Column, String, Text, DateTime, UniqueConstraint, func
from sqlalchemy.orm import declarative_base
from uuid import uuid4

Base = declarative_base()


class ContactSubmission(Base):
    __tablename__ = "contact_submissions"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid4()))
    name = Column(String(255), nullable=False)
    email = Column(String(255), nullable=False)
    major = Column(String(255), nullable=True)
    message = Column(Text, nullable=True)
    source = Column(String(50), nullable=True, default="website")
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)


class EventRSVP(Base):
    __tablename__ = "event_rsvps"
    __table_args__ = (UniqueConstraint("event_slug", "email", name="uq_event_rsvps_event_email"),)

    id = Column(String(36), primary_key=True, default=lambda: str(uuid4()))
    event_slug = Column(String(120), nullable=False, index=True)
    event_name = Column(String(255), nullable=False)
    event_date = Column(String(40), nullable=True)
    name = Column(String(255), nullable=False)
    email = Column(String(255), nullable=False)
    major = Column(String(255), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
