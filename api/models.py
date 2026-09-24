from sqlalchemy import Column, String, Text, DateTime, func
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
