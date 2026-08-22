from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.security import get_current_user, require_role
from app.models.user import User
from app.models.employee import Employee
from app.schemas.employee import (
    EmployeeResponse,
    EmployeeUpdateMe,
    EmployeeUpdateHR,
    EmployeeCreate
)

router = APIRouter(prefix="/api/employees", tags=["Employee Profile"])

def _to_employee_response(emp: Employee) -> EmployeeResponse:
    return EmployeeResponse(
        id=emp.id,
        user_id=emp.user_id,
        employee_id=emp.employee_id,
        name=emp.name,
        email=emp.email,
        phone=emp.phone,
        address=emp.address,
        job_title=emp.job_title,
        department=emp.department,
        salary=emp.salary,
        profile_picture=emp.profile_picture,
        documents=emp.documents,
        role=emp.user.role if emp.user else None
    )

@router.get("/me", response_model=EmployeeResponse)
def get_my_profile(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get profile of the currently logged-in employee.
    Includes Personal details, Job details, Salary information, Documents, and Profile Picture.
    """
    emp = db.query(Employee).filter(Employee.user_id == current_user.id).first()
    if not emp:
        # If user exists (e.g. HR Admin created directly) but no employee record, provide a fallback or 404
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Employee profile not found for current user"
        )
    return _to_employee_response(emp)

@router.put("/me", response_model=EmployeeResponse)
def update_my_profile(
    payload: EmployeeUpdateMe,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Regular employees can edit ONLY:
    - Address
    - Phone
    - Profile picture
    """
    emp = db.query(Employee).filter(Employee.user_id == current_user.id).first()
    if not emp:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Employee profile not found for current user"
        )

    # Strictly update only the allowed fields
    if payload.phone is not None:
        emp.phone = payload.phone.strip()
    if payload.address is not None:
        emp.address = payload.address.strip()
    if payload.profile_picture is not None:
        emp.profile_picture = payload.profile_picture.strip()

    db.commit()
    db.refresh(emp)
    return _to_employee_response(emp)

@router.get("", response_model=List[EmployeeResponse])
def get_all_employees(
    department: Optional[str] = None,
    search: Optional[str] = None,
    current_user: User = Depends(require_role(["hr"])),
    db: Session = Depends(get_db)
):
    """
    HR only: Get list of all employees in the organization.
    Supports filtering by department or search term.
    """
    query = db.query(Employee)
    if department:
        query = query.filter(Employee.department == department)
    if search:
        search_fmt = f"%{search.strip().lower()}%"
        query = query.filter(
            (Employee.name.ilike(search_fmt)) |
            (Employee.email.ilike(search_fmt)) |
            (Employee.employee_id.ilike(search_fmt)) |
            (Employee.job_title.ilike(search_fmt))
        )
    
    employees = query.order_by(Employee.id.asc()).all()
    return [_to_employee_response(emp) for emp in employees]

@router.get("/{id}", response_model=EmployeeResponse)
def get_employee_by_id(
    id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get employee profile by ID.
    Accessible by HR, or by the employee themselves if this is their profile.
    """
    emp = db.query(Employee).filter(Employee.id == id).first()
    if not emp:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Employee with ID {id} not found"
        )

    # Permission check: HR or the employee themselves
    is_hr = (current_user.role or "").lower() == "hr"
    is_self = (emp.user_id == current_user.id)

    if not (is_hr or is_self):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have permission to view this employee profile"
        )

    return _to_employee_response(emp)

@router.put("/{id}", response_model=EmployeeResponse)
def update_employee_by_hr(
    id: int,
    payload: EmployeeUpdateHR,
    current_user: User = Depends(require_role(["hr"])),
    db: Session = Depends(get_db)
):
    """
    HR only: Full edit of employee information (job details, salary, personal info, etc.).
    """
    emp = db.query(Employee).filter(Employee.id == id).first()
    if not emp:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Employee with ID {id} not found"
        )

    # HR can update all fields
    if payload.name is not None:
        emp.name = payload.name.strip()
    if payload.email is not None:
        emp.email = payload.email.strip().lower()
        if emp.user:
            emp.user.email = emp.email
    if payload.phone is not None:
        emp.phone = payload.phone.strip()
    if payload.address is not None:
        emp.address = payload.address.strip()
    if payload.job_title is not None:
        emp.job_title = payload.job_title.strip()
    if payload.department is not None:
        emp.department = payload.department.strip()
    if payload.salary is not None:
        emp.salary = payload.salary
    if payload.profile_picture is not None:
        emp.profile_picture = payload.profile_picture.strip()
    if payload.documents is not None:
        emp.documents = payload.documents

    db.commit()
    db.refresh(emp)
    return _to_employee_response(emp)
