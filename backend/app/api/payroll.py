from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from datetime import date
from app.core.database import get_db
from app.core.security import get_employee_user, get_hr_user
from app.models.user import User
from app.models.employee import Employee
from app.models.payroll import Payroll
from app.schemas.payroll import PayrollResponse, PayrollUpdate

router = APIRouter(prefix="/api/payroll", tags=["Payroll"])

@router.get("/me", response_model=PayrollResponse)
def get_my_payroll(current_user: User = Depends(get_employee_user), db: Session = Depends(get_db)):
    """
    Allow logged-in employee to retrieve their own payroll details (read-only).
    """
    employee = current_user.employee
    if not employee:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Employee profile details not found for current user"
        )
    
    payroll = db.query(Payroll).filter(Payroll.employee_id == employee.employee_id).first()
    if not payroll:
        # Auto-initialize payroll record from Employee's base salary field
        salary_val = employee.salary if employee.salary is not None else 0.0
        payroll = Payroll(
            employee_id=employee.employee_id,
            basic_salary=salary_val,
            allowances=0.0,
            deductions=0.0,
            net_salary=salary_val,
            effective_date=date.today()
        )
        db.add(payroll)
        db.commit()
        db.refresh(payroll)
        
    return payroll

@router.get("", response_model=list[PayrollResponse])
def get_all_payrolls(current_user: User = Depends(get_hr_user), db: Session = Depends(get_db)):
    """
    HR only. Retrieve payroll list of all employees.
    """
    employees = db.query(Employee).all()
    payrolls = []
    
    for emp in employees:
        payroll = db.query(Payroll).filter(Payroll.employee_id == emp.employee_id).first()
        if not payroll:
            # Auto-initialize payroll record if it doesn't exist
            salary_val = emp.salary if emp.salary is not None else 0.0
            payroll = Payroll(
                employee_id=emp.employee_id,
                basic_salary=salary_val,
                allowances=0.0,
                deductions=0.0,
                net_salary=salary_val,
                effective_date=date.today()
            )
            db.add(payroll)
            db.commit()
            db.refresh(payroll)
        payrolls.append(payroll)
        
    return payrolls

@router.put("/{employee_id}", response_model=PayrollResponse)
def update_employee_salary(
    employee_id: str,
    payload: PayrollUpdate,
    current_user: User = Depends(get_hr_user),
    db: Session = Depends(get_db)
):
    """
    HR only. Update salary components for an employee. 
    Recalculates net_salary automatically and updates the cache in Employee.salary.
    """
    # 1. Verify employee exists
    employee = db.query(Employee).filter(Employee.employee_id == employee_id).first()
    if not employee:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Employee with ID {employee_id} not found"
        )
    
    # 2. Get or initialize payroll record
    payroll = db.query(Payroll).filter(Payroll.employee_id == employee_id).first()
    if not payroll:
        payroll = Payroll(
            employee_id=employee_id,
            basic_salary=0.0,
            allowances=0.0,
            deductions=0.0,
            net_salary=0.0,
            effective_date=date.today()
        )
        db.add(payroll)
        
    # 3. Update salary fields if provided
    if payload.basic_salary is not None:
        payroll.basic_salary = payload.basic_salary
    if payload.allowances is not None:
        payroll.allowances = payload.allowances
    if payload.deductions is not None:
        payroll.deductions = payload.deductions
    if payload.effective_date is not None:
        payroll.effective_date = payload.effective_date
        
    # 4. Correctly calculate net salary
    payroll.net_salary = payroll.basic_salary + payroll.allowances - payroll.deductions
    
    # 5. Keep Employee.salary cache in sync
    employee.salary = payroll.net_salary
    
    db.commit()
    db.refresh(payroll)
    return payroll
