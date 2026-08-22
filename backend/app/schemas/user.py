from pydantic import BaseModel, ConfigDict
from datetime import datetime

class UserBase(BaseModel):
    email: str
    role: str

class UserCreate(UserBase):
    password: str

class UserResponse(UserBase):
    id: int
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
