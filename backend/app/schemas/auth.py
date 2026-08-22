from pydantic import BaseModel, EmailStr, ConfigDict
from typing import Optional
from app.schemas.user import UserResponse
from app.schemas.employee import EmployeeResponse

class LoginRequest(BaseModel):
    email: str
    password: str

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse
    employee: Optional[EmployeeResponse] = None

class AuthMeResponse(BaseModel):
    user: UserResponse
    employee: Optional[EmployeeResponse] = None
