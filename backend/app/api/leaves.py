from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session, joinedload

from app.core.database import get_db
from app.core.security import get_current_user, require_role
from app.models.user import User
from app.models.employee import Employee
from app.models.leave import LeaveRequest
from app.schemas.leave import (
    LeaveCreate,
    LeaveAction,
    LeaveResponse,
    LeaveStatus
)

router = APIRouter(prefix="/api/leaves", tags=["Leaves & Time-Off"])


@router.post("", response_model=LeaveResponse, status_code=status.HTTP_201_CREATED)
def apply_leave(
    leave_in: LeaveCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Employee submits a new leave request.
    Validates employee profile existence and dates.
    """
    # Retrieve the linked employee record for the current user
    employee = db.query(Employee).filter(Employee.user_id == current_user.id).first()
    if not employee:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Employee profile not found for this account. Only registered employees can apply for leave."
        )

    # Instantiate leave request with default Pending status
    new_leave = LeaveRequest(
        employee_id=employee.id,
        leave_type=leave_in.leave_type,
        start_date=leave_in.start_date,
        end_date=leave_in.end_date,
        remarks=leave_in.remarks.strip() if leave_in.remarks else None,
        status=LeaveStatus.PENDING.value
    )
    db.add(new_leave)
    db.commit()
    db.refresh(new_leave)
    return new_leave


@router.get("/me", response_model=List[LeaveResponse])
def get_my_leaves(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Returns all leave requests submitted by the authenticated employee.
    """
    employee = db.query(Employee).filter(Employee.user_id == current_user.id).first()
    if not employee:
        return []

    leaves = (
        db.query(LeaveRequest)
        .options(joinedload(LeaveRequest.employee))
        .filter(LeaveRequest.employee_id == employee.id)
        .order_by(LeaveRequest.applied_at.desc())
        .all()
    )
    return leaves


@router.get("", response_model=List[LeaveResponse])
def get_all_leaves(
    status_filter: Optional[str] = Query(None, alias="status", description="Filter by status (Pending, Approved, Rejected)"),
    leave_type_filter: Optional[str] = Query(None, alias="leave_type", description="Filter by leave type (Paid, Sick, Unpaid)"),
    employee_id_filter: Optional[int] = Query(None, alias="employee_id", description="Filter by employee ID"),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["hr"]))
):
    """
    HR only: Retrieves all leave requests across the company with employee details.
    Supports filtering by status, leave type, or specific employee.
    """
    query = db.query(LeaveRequest).options(joinedload(LeaveRequest.employee))

    if status_filter:
        query = query.filter(LeaveRequest.status.ilike(status_filter.strip()))
    
    if leave_type_filter:
        query = query.filter(LeaveRequest.leave_type.ilike(leave_type_filter.strip()))

    if employee_id_filter:
        query = query.filter(LeaveRequest.employee_id == employee_id_filter)

    leaves = query.order_by(LeaveRequest.applied_at.desc()).all()
    return leaves


@router.patch("/{leave_id}/approve", response_model=LeaveResponse)
def approve_leave(
    leave_id: int,
    action_in: Optional[LeaveAction] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["hr"]))
):
    """
    HR only: Approves a leave request with optional HR comments.
    Changes immediately reflect in the employee's leave status.
    """
    leave = (
        db.query(LeaveRequest)
        .options(joinedload(LeaveRequest.employee))
        .filter(LeaveRequest.id == leave_id)
        .first()
    )
    if not leave:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Leave request with ID {leave_id} not found"
        )

    leave.status = LeaveStatus.APPROVED.value
    leave.reviewed_by = current_user.id
    if action_in and action_in.hr_comments is not None:
        leave.hr_comments = action_in.hr_comments.strip()

    db.commit()
    db.refresh(leave)
    return leave


@router.patch("/{leave_id}/reject", response_model=LeaveResponse)
def reject_leave(
    leave_id: int,
    action_in: Optional[LeaveAction] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["hr"]))
):
    """
    HR only: Rejects a leave request with optional HR comments.
    Changes immediately reflect in the employee's leave status.
    """
    leave = (
        db.query(LeaveRequest)
        .options(joinedload(LeaveRequest.employee))
        .filter(LeaveRequest.id == leave_id)
        .first()
    )
    if not leave:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Leave request with ID {leave_id} not found"
        )

    leave.status = LeaveStatus.REJECTED.value
    leave.reviewed_by = current_user.id
    if action_in and action_in.hr_comments is not None:
        leave.hr_comments = action_in.hr_comments.strip()

    db.commit()
    db.refresh(leave)
    return leave
