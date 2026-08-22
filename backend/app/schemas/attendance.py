from datetime import date, datetime
from typing import Optional, List
from enum import Enum
from pydantic import BaseModel, ConfigDict

class AttendanceStatusEnum(str, Enum):
    PRESENT = "Present"
    ABSENT = "Absent"
    HALF_DAY = "Half-day"
    LEAVE = "Leave"

class AttendanceCheckIn(BaseModel):
    notes: Optional[str] = None

class AttendanceCheckOut(BaseModel):
    notes: Optional[str] = None

class AttendanceManualCreate(BaseModel):
    employee_id: int
    date: date
    check_in: Optional[datetime] = None
    check_out: Optional[datetime] = None
    work_hours: Optional[float] = None
    status: AttendanceStatusEnum = AttendanceStatusEnum.PRESENT
    notes: Optional[str] = None

class AttendanceResponse(BaseModel):
    id: int
    employee_id: int
    employee_name: Optional[str] = None
    employee_code: Optional[str] = None
    department: Optional[str] = None
    date: date
    check_in: Optional[datetime] = None
    check_out: Optional[datetime] = None
    work_hours: Optional[float] = 0.0
    status: str
    notes: Optional[str] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)

class AttendanceDailyStats(BaseModel):
    date: date
    total_employees: int
    present: int
    half_day: int
    absent: int
    on_leave: int

class WeeklyAttendanceSummary(BaseModel):
    start_date: date
    end_date: date
    total_work_hours: float
    days_present: int
    days_half_day: int
    days_absent: int
    days_leave: int
    records: List[AttendanceResponse]
