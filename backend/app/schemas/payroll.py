from pydantic import BaseModel, ConfigDict
from datetime import date

class PayrollBase(BaseModel):
    basic_salary: float = 0.0
    allowances: float = 0.0
    deductions: float = 0.0
    effective_date: date

class PayrollCreate(PayrollBase):
    employee_id: str

class PayrollUpdate(BaseModel):
    basic_salary: float | None = None
    allowances: float | None = None
    deductions: float | None = None
    effective_date: date | None = None

class PayrollResponse(PayrollBase):
    id: int
    employee_id: str
    net_salary: float

    model_config = ConfigDict(from_attributes=True)
