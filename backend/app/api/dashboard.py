from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.core.database import get_db
from app.api.auth import get_current_user, require_role
from app.models.user import User
from app.models.employee import Employee

router = APIRouter(prefix="/api/dashboard", tags=["Dashboards"])

@router.get("/employee")
def get_employee_dashboard(
    current_user: User = Depends(require_role(["employee"])),
    db: Session = Depends(get_db)
):
    """
    Returns dashboard statistics and metrics for the logged-in employee.
    Includes profile details, mock attendance tracking, leave applications, and payroll.
    """
    # Fetch linked employee profile
    employee = db.query(Employee).filter(Employee.user_id == current_user.id).first()
    if not employee:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Employee profile not found"
        )

    # Return profile info along with rich mock statistics for attendance, leaves, and payroll
    return {
        "profile": {
            "id": employee.id,
            "employee_id": employee.employee_id,
            "name": employee.name,
            "email": employee.email,
            "phone": employee.phone or "Not provided",
            "address": employee.address or "Not provided",
            "job_title": employee.job_title or "Software Developer",
            "department": employee.department or "Engineering",
            "salary": employee.salary or 5000.0,
            "profile_picture": employee.profile_picture
        },
        "attendance": {
            "checked_in_today": True,
            "check_in_time": "09:05 AM",
            "check_out_time": None,
            "total_hours_this_week": 38.5,
            "attendance_rate": "96%",
            "recent_history": [
                {"date": "2026-08-21", "check_in": "08:58 AM", "check_out": "05:02 PM", "status": "Present"},
                {"date": "2026-08-20", "check_in": "09:02 AM", "check_out": "06:15 PM", "status": "Present"},
                {"date": "2026-08-19", "check_in": "09:15 AM", "check_out": "05:00 PM", "status": "Present"},
                {"date": "2026-08-18", "check_in": "08:45 AM", "check_out": "05:30 PM", "status": "Present"},
                {"date": "2026-08-17", "check_in": "09:00 AM", "check_out": "05:00 PM", "status": "Present"}
            ]
        },
        "leave": {
            "casual_leave_remaining": 8,
            "medical_leave_remaining": 5,
            "pending_applications": 1,
            "approved_leaves_ytd": 12,
            "recent_applications": [
                {"start_date": "2026-09-01", "end_date": "2026-09-03", "type": "Casual Leave", "status": "Pending", "reason": "Family visit"},
                {"start_date": "2026-07-10", "end_date": "2026-07-11", "type": "Medical Leave", "status": "Approved", "reason": "Dental surgery"}
            ]
        },
        "payroll": {
            "base_salary": employee.salary or 5000.0,
            "allowances": 450.0,
            "deductions": 220.0,
            "net_salary": (employee.salary or 5000.0) + 450.0 - 220.0,
            "last_payout_date": "2026-07-31",
            "last_payout_amount": (employee.salary or 5000.0) + 450.0 - 220.0,
            "payment_status": "Paid"
        },
        "recent_activity": [
            {"time": "Today, 09:05 AM", "event": "Checked in successfully"},
            {"time": "Yesterday, 05:02 PM", "event": "Checked out successfully"},
            {"time": "Aug 20, 11:30 AM", "event": "Submitted Casual Leave request for Sept 1-3"}
        ]
    }

@router.get("/hr")
def get_hr_dashboard(
    current_user: User = Depends(require_role(["hr"])),
    db: Session = Depends(get_db)
):
    """
    Returns dashboard statistics and metrics for HR/Admin users.
    Includes employee counts, attendance overview, pending leaves, and payroll metrics.
    """
    # Calculate actual statistics from the database
    total_employees = db.query(Employee).count()
    
    # Calculate sum of salaries
    total_salary = db.query(func.sum(Employee.salary)).scalar() or 0.0
    # Add a mock default base if there are no employee salaries in DB yet
    if total_employees == 0:
        total_salary_payout = 0.0
    else:
        total_salary_payout = total_salary if total_salary > 0 else (total_employees * 5000.0)

    return {
        "stats": {
            "total_employees": total_employees,
            "attendance_today": "94%" if total_employees > 0 else "0%",
            "pending_leaves": 3,
            "total_payroll": total_salary_payout
        },
        "pending_leaves_list": [
            {"id": 1, "employee_name": "John Doe", "department": "Engineering", "type": "Casual Leave", "duration": "3 days", "start_date": "2026-09-01", "status": "Pending"},
            {"id": 2, "employee_name": "Jane Smith", "department": "Marketing", "type": "Medical Leave", "duration": "1 day", "start_date": "2026-08-25", "status": "Pending"},
            {"id": 3, "employee_name": "Bob Johnson", "department": "HR", "type": "Casual Leave", "duration": "5 days", "start_date": "2026-09-10", "status": "Pending"}
        ],
        "attendance_overview": {
            "present_today": int(total_employees * 0.94) if total_employees > 0 else 0,
            "absent_today": total_employees - int(total_employees * 0.94) if total_employees > 0 else 0,
            "recent_check_ins": [
                {"employee_name": "Alice Cooper", "time": "08:52 AM", "status": "On Time"},
                {"employee_name": "John Doe", "time": "09:05 AM", "status": "Late"},
                {"employee_name": "Jane Smith", "time": "08:45 AM", "status": "On Time"}
            ]
        },
        "payroll_overview": {
            "last_cycle_payout": total_salary_payout,
            "next_cycle_date": "2026-08-31",
            "currency": "USD",
            "department_payouts": [
                {"department": "Engineering", "payout": total_salary_payout * 0.6 if total_employees > 0 else 0.0},
                {"department": "Marketing", "payout": total_salary_payout * 0.2 if total_employees > 0 else 0.0},
                {"department": "HR", "payout": total_salary_payout * 0.2 if total_employees > 0 else 0.0}
            ]
        }
    }
