from datetime import date, datetime, timezone, timedelta
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import desc
from app.core.database import get_db
from app.core.security import get_current_user, require_role
from app.models.user import User
from app.models.employee import Employee
from app.models.attendance import Attendance
from app.schemas.attendance import (
    AttendanceCheckIn,
    AttendanceCheckOut,
    AttendanceManualCreate,
    AttendanceResponse,
    AttendanceDailyStats,
    WeeklyAttendanceSummary
)

router = APIRouter(prefix="/api/attendance", tags=["Attendance Management"])

def _to_attendance_response(att: Attendance) -> AttendanceResponse:
    emp = att.employee
    return AttendanceResponse(
        id=att.id,
        employee_id=att.employee_id,
        employee_name=emp.name if emp else None,
        employee_code=emp.employee_id if emp else None,
        department=emp.department if emp else None,
        date=att.date,
        check_in=att.check_in,
        check_out=att.check_out,
        work_hours=att.work_hours or 0.0,
        status=att.status,
        notes=att.notes,
        created_at=att.created_at,
        updated_at=att.updated_at
    )

def _get_current_employee(user: User, db: Session) -> Employee:
    emp = db.query(Employee).filter(Employee.user_id == user.id).first()
    if not emp:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Employee profile not associated with this user"
        )
    return emp

@router.post("/check-in", response_model=AttendanceResponse)
def check_in(
    payload: AttendanceCheckIn = AttendanceCheckIn(),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Record check-in timestamp for the currently logged-in employee for today's date.
    Sets status to 'Present'.
    """
    emp = _get_current_employee(current_user, db)
    today = date.today()
    now_utc = datetime.now(timezone.utc)

    # Check if attendance record already exists for today
    att = db.query(Attendance).filter(
        Attendance.employee_id == emp.id,
        Attendance.date == today
    ).first()

    if att:
        if att.check_in and not att.check_out:
            # Already checked in today, update notes if provided
            if payload.notes:
                att.notes = (att.notes or "") + f" [Check-in note: {payload.notes}]"
                db.commit()
                db.refresh(att)
            return _to_attendance_response(att)
        elif att.check_in and att.check_out:
            # Already completed today's shift
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="You have already checked out for today. Contact HR to adjust attendance."
            )
        else:
            # Record exists (e.g. created by HR as Absent/Leave), update with check-in
            att.check_in = now_utc
            att.status = "Present"
            if payload.notes:
                att.notes = payload.notes
            db.commit()
            db.refresh(att)
            return _to_attendance_response(att)

    # Create new attendance record
    att = Attendance(
        employee_id=emp.id,
        date=today,
        check_in=now_utc,
        status="Present",
        work_hours=0.0,
        notes=payload.notes
    )
    db.add(att)
    db.commit()
    db.refresh(att)
    return _to_attendance_response(att)

@router.post("/check-out", response_model=AttendanceResponse)
def check_out(
    payload: AttendanceCheckOut = AttendanceCheckOut(),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Record check-out timestamp for the currently logged-in employee for today's date.
    Calculates work hours and updates status (Present / Half-day).
    """
    emp = _get_current_employee(current_user, db)
    today = date.today()
    now_utc = datetime.now(timezone.utc)

    att = db.query(Attendance).filter(
        Attendance.employee_id == emp.id,
        Attendance.date == today
    ).first()

    if not att or not att.check_in:
        # Auto-create check-in with now if employee forgot to check in
        if not att:
            att = Attendance(
                employee_id=emp.id,
                date=today,
                check_in=now_utc,
                status="Present"
            )
            db.add(att)
            db.flush()
        else:
            att.check_in = now_utc

    if att.check_out:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You have already checked out for today."
        )

    att.check_out = now_utc

    # Calculate work hours
    # Make check_in aware of UTC if it is naive
    check_in_dt = att.check_in
    if check_in_dt.tzinfo is None:
        check_in_dt = check_in_dt.replace(tzinfo=timezone.utc)
    
    total_seconds = max(0, (now_utc - check_in_dt).total_seconds())
    hours = round(total_seconds / 3600.0, 2)
    att.work_hours = hours

    # Determine status if not Leave
    if att.status != "Leave":
        if hours >= 7.0:
            att.status = "Present"
        elif hours >= 3.5:
            att.status = "Half-day"
        else:
            # If less than 3.5 hours, mark Half-day (or Present if freshly created)
            att.status = "Half-day" if hours > 0.1 else "Present"

    if payload.notes:
        existing_notes = att.notes or ""
        att.notes = f"{existing_notes} [Check-out note: {payload.notes}]".strip()

    db.commit()
    db.refresh(att)
    return _to_attendance_response(att)

@router.get("/me", response_model=List[AttendanceResponse])
def get_my_attendance(
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    limit: int = Query(default=30, le=100),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Employee views ONLY their own attendance history.
    """
    emp = _get_current_employee(current_user, db)
    query = db.query(Attendance).filter(Attendance.employee_id == emp.id)

    if start_date:
        query = query.filter(Attendance.date >= start_date)
    if end_date:
        query = query.filter(Attendance.date <= end_date)

    records = query.order_by(desc(Attendance.date)).limit(limit).all()
    return [_to_attendance_response(r) for r in records]

@router.get("/me/weekly", response_model=WeeklyAttendanceSummary)
def get_my_weekly_attendance(
    target_date: Optional[date] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get weekly summary and daily records for the current employee for a specific week.
    """
    emp = _get_current_employee(current_user, db)
    ref_date = target_date or date.today()
    # Calculate Monday of the week
    start_of_week = ref_date - timedelta(days=ref_date.weekday())
    end_of_week = start_of_week + timedelta(days=6)

    records = db.query(Attendance).filter(
        Attendance.employee_id == emp.id,
        Attendance.date >= start_of_week,
        Attendance.date <= end_of_week
    ).order_by(Attendance.date.asc()).all()

    total_hours = sum(r.work_hours or 0.0 for r in records)
    days_present = sum(1 for r in records if r.status == "Present")
    days_half = sum(1 for r in records if r.status == "Half-day")
    days_absent = sum(1 for r in records if r.status == "Absent")
    days_leave = sum(1 for r in records if r.status == "Leave")

    return WeeklyAttendanceSummary(
        start_date=start_of_week,
        end_date=end_of_week,
        total_work_hours=round(total_hours, 2),
        days_present=days_present,
        days_half_day=days_half,
        days_absent=days_absent,
        days_leave=days_leave,
        records=[_to_attendance_response(r) for r in records]
    )

@router.get("", response_model=List[AttendanceResponse])
def get_all_attendance(
    target_date: Optional[date] = Query(default=None, alias="date"),
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    department: Optional[str] = None,
    employee_id: Optional[int] = None,
    status_filter: Optional[str] = Query(default=None, alias="status"),
    limit: int = Query(default=100, le=500),
    current_user: User = Depends(require_role(["hr"])),
    db: Session = Depends(get_db)
):
    """
    HR only: View attendance records of ALL employees with comprehensive filters.
    """
    query = db.query(Attendance).join(Employee, Attendance.employee_id == Employee.id)

    if target_date:
        query = query.filter(Attendance.date == target_date)
    else:
        if start_date:
            query = query.filter(Attendance.date >= start_date)
        if end_date:
            query = query.filter(Attendance.date <= end_date)

    if department:
        query = query.filter(Employee.department == department)
    if employee_id:
        query = query.filter(Attendance.employee_id == employee_id)
    if status_filter:
        query = query.filter(Attendance.status.ilike(status_filter))

    records = query.order_by(desc(Attendance.date), Employee.name.asc()).limit(limit).all()
    return [_to_attendance_response(r) for r in records]

@router.get("/summary/daily", response_model=AttendanceDailyStats)
def get_daily_attendance_summary(
    target_date: Optional[date] = Query(default=None, alias="date"),
    current_user: User = Depends(require_role(["hr"])),
    db: Session = Depends(get_db)
):
    """
    HR only: Summary counts of daily attendance (Present, Half-day, Absent, Leave).
    """
    check_date = target_date or date.today()
    total_employees = db.query(Employee).count()
    
    records = db.query(Attendance).filter(Attendance.date == check_date).all()
    
    present = sum(1 for r in records if r.status == "Present")
    half_day = sum(1 for r in records if r.status == "Half-day")
    leave = sum(1 for r in records if r.status == "Leave")
    recorded_absent = sum(1 for r in records if r.status == "Absent")
    
    # Implicit absent = total employees - (present + half_day + leave + recorded_absent)
    unrecorded = max(0, total_employees - (present + half_day + leave + recorded_absent))
    absent = recorded_absent + unrecorded

    return AttendanceDailyStats(
        date=check_date,
        total_employees=total_employees,
        present=present,
        half_day=half_day,
        absent=absent,
        on_leave=leave
    )

@router.post("/manual", response_model=AttendanceResponse)
def create_or_update_manual_attendance(
    payload: AttendanceManualCreate,
    current_user: User = Depends(require_role(["hr"])),
    db: Session = Depends(get_db)
):
    """
    HR only: Manually record or adjust attendance status (e.g. mark Leave or Absent).
    """
    att = db.query(Attendance).filter(
        Attendance.employee_id == payload.employee_id,
        Attendance.date == payload.date
    ).first()

    if not att:
        att = Attendance(
            employee_id=payload.employee_id,
            date=payload.date,
            check_in=payload.check_in,
            check_out=payload.check_out,
            work_hours=payload.work_hours or 0.0,
            status=payload.status.value,
            notes=payload.notes
        )
        db.add(att)
    else:
        if payload.check_in is not None:
            att.check_in = payload.check_in
        if payload.check_out is not None:
            att.check_out = payload.check_out
        if payload.work_hours is not None:
            att.work_hours = payload.work_hours
        att.status = payload.status.value
        if payload.notes is not None:
            att.notes = payload.notes

    db.commit()
    db.refresh(att)
    return _to_attendance_response(att)
