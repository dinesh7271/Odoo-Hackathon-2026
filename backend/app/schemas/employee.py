from pydantic import BaseModel, ConfigDict
from typing import Optional

class EmployeeBase(BaseModel):
    employee_id: str
    name: str
    email: str
    phone: Optional[str] = None
    address: Optional[str] = None
    job_title: Optional[str] = None
    department: Optional[str] = None
    salary: Optional[float] = None
    profile_picture: Optional[str] = None
    documents: Optional[str] = None

class EmployeeCreate(EmployeeBase):
    user_id: int

class EmployeeUpdateMe(BaseModel):
    """Fields that regular employees are allowed to update for themselves."""
    phone: Optional[str] = None
    address: Optional[str] = None
    profile_picture: Optional[str] = None

class EmployeeUpdateHR(BaseModel):
    """Fields that HR is allowed to update for any employee."""
    name: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    address: Optional[str] = None
    job_title: Optional[str] = None
    department: Optional[str] = None
    salary: Optional[float] = None
    profile_picture: Optional[str] = None
    documents: Optional[str] = None

class EmployeeResponse(EmployeeBase):
    id: int
    user_id: int
    role: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)

