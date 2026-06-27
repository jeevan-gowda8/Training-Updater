from pydantic import BaseModel, EmailStr
from typing import Optional, List
from datetime import date, datetime

# --- User Schemas ---
class UserBase(BaseModel):
    username: str
    email: EmailStr

class UserCreate(UserBase):
    password: str

class UserResponse(UserBase):
    id: int
    role: str
    created_at: datetime

    class Config:
        from_attributes = True

# --- Auth Schemas ---
class LoginRequest(BaseModel):
    username: str
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str
    role: str
    username: str

class TokenData(BaseModel):
    username: Optional[str] = None
    role: Optional[str] = None
    user_id: Optional[int] = None

# --- Domain Schemas ---
class DomainBase(BaseModel):
    name: str
    description: Optional[str] = None

class DomainCreate(DomainBase):
    pass

class DomainResponse(DomainBase):
    id: int

    class Config:
        from_attributes = True

# --- Daily Update Schemas ---
class DailyUpdateResponse(BaseModel):
    id: int
    user_id: int
    username: str
    domain_id: int
    domain_name: str
    date: date
    task_title: str
    description: str
    media_url: Optional[str] = None
    media_type: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True

# --- Report Schemas ---
class DomainSummary(BaseModel):
    domain_name: str
    count: int

class MonthlyReportResponse(BaseModel):
    user_id: int
    username: str
    email: str
    start_date: date
    end_date: date
    total_updates: int
    domain_breakdown: List[DomainSummary]
    updates: List[DailyUpdateResponse]
    completion_rate: float # Percentage of days with updates in the month range (e.g., 20/30 updates = 66.7%)

    class Config:
        from_attributes = True
