from datetime import date, datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict, field_validator, model_validator
from enum import Enum

class LeaveType(str, Enum):
    PAID = "Paid"
    SICK = "Sick"
    UNPAID = "Unpaid"

class LeaveStatus(str, Enum):
    PENDING = "Pending"
    APPROVED = "Approved"
    REJECTED = "Rejected"

class LeaveEmployeeSummary(BaseModel):
    id: int
    employee_id: str
    name: str
    email: str
    department: Optional[str] = None
    job_title: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)

class LeaveCreate(BaseModel):
    leave_type: str
    start_date: date
    end_date: date
    remarks: Optional[str] = None

    @field_validator("leave_type")
    @classmethod
    def validate_leave_type(cls, v: str) -> str:
        cleaned = v.strip().capitalize()
        valid_types = {t.value for t in LeaveType}
        if cleaned not in valid_types:
            raise ValueError(f"Invalid leave type '{v}'. Allowed types are: {', '.join(valid_types)}")
        return cleaned

    @model_validator(mode="after")
    def validate_dates(self):
        if self.start_date and self.end_date:
            if self.end_date < self.start_date:
                raise ValueError("End date cannot be before start date.")
        return self

class LeaveAction(BaseModel):
    hr_comments: Optional[str] = None

class LeaveResponse(BaseModel):
    id: int
    employee_id: int
    leave_type: str
    start_date: date
    end_date: date
    remarks: Optional[str] = None
    status: str
    hr_comments: Optional[str] = None
    reviewed_by: Optional[int] = None
    applied_at: datetime
    updated_at: datetime
    employee: Optional[LeaveEmployeeSummary] = None

    model_config = ConfigDict(from_attributes=True)
