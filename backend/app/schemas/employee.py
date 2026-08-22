from pydantic import BaseModel, ConfigDict

class EmployeeBase(BaseModel):
    employee_id: str
    name: str
    email: str
    phone: str | None = None
    address: str | None = None
    job_title: str | None = None
    department: str | None = None
    salary: float | None = None
    profile_picture: str | None = None

class EmployeeCreate(EmployeeBase):
    user_id: int

class EmployeeResponse(EmployeeBase):
    id: int
    user_id: int

    model_config = ConfigDict(from_attributes=True)
