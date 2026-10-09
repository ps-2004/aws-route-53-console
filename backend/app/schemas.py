from typing import Optional, List
from datetime import datetime
from pydantic import BaseModel, Field

# User schemas
class UserLogin(BaseModel):
    email: str
    password: str

class UserResponse(BaseModel):
    id: int
    email: str
    name: str

    class Config:
        from_attributes = True

class LoginResponse(BaseModel):
    success: bool
    token: str
    user: UserResponse

# Record schemas
class RecordBase(BaseModel):
    name: str
    type: str
    ttl: int = 300
    value: str
    priority: Optional[int] = None
    weight: Optional[int] = None
    port: Optional[int] = None
    target: Optional[str] = None
    flags: Optional[int] = None
    tag: Optional[str] = None
    routing_policy: str = "Simple"

class RecordCreate(RecordBase):
    pass

class RecordUpdate(BaseModel):
    name: Optional[str] = None
    ttl: Optional[int] = None
    value: Optional[str] = None
    priority: Optional[int] = None
    weight: Optional[int] = None
    port: Optional[int] = None
    target: Optional[str] = None
    flags: Optional[int] = None
    tag: Optional[str] = None
    routing_policy: Optional[str] = None

class RecordResponse(RecordBase):
    id: int
    hosted_zone_id: int
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class RecordPaginationResponse(BaseModel):
    items: List[RecordResponse]
    page: int
    limit: int
    total: int
    total_pages: int

# Hosted Zone schemas
class HostedZoneBase(BaseModel):
    name: str
    description: Optional[str] = ""
    zone_type: str = "Public"
    private_zone: Optional[bool] = False

class HostedZoneCreate(HostedZoneBase):
    pass

class HostedZoneUpdate(BaseModel):
    description: Optional[str] = None
    zone_type: Optional[str] = None
    private_zone: Optional[bool] = None

class HostedZoneResponse(BaseModel):
    id: int
    name: str
    zone_id: str
    zone_type: str
    description: Optional[str] = ""
    private_zone: int
    record_count: Optional[int] = 0
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class HostedZonePaginationResponse(BaseModel):
    items: List[HostedZoneResponse]
    page: int
    limit: int
    total: int
    total_pages: int
