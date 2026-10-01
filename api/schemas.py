from pydantic import BaseModel, EmailStr, Field
from datetime import datetime
from typing import Optional


class ContactCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    email: EmailStr
    major: Optional[str] = Field(None, max_length=255)
    message: Optional[str] = Field(None, max_length=2000)
    source: Optional[str] = Field("website", max_length=50)


class ContactOut(BaseModel):
    id: str
    name: str
    email: str
    major: Optional[str]
    message: Optional[str]
    source: str
    created_at: datetime

    class Config:
        from_attributes = True


class RsvpCreate(BaseModel):
    event_slug: str = Field(..., min_length=1, max_length=120, pattern=r"^[a-z0-9-]+$")
    event_name: str = Field(..., min_length=1, max_length=255)
    event_date: Optional[str] = Field(None, max_length=40)
    name: str = Field(..., min_length=1, max_length=255)
    email: EmailStr
    major: Optional[str] = Field(None, max_length=255)


class RsvpOut(BaseModel):
    id: str
    event_slug: str
    event_name: str
    event_date: Optional[str]
    name: str
    email: str
    major: Optional[str]
    created_at: datetime
    already_registered: bool = False

    class Config:
        from_attributes = True
