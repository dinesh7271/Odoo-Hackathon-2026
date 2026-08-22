from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.security import verify_password, create_access_token, get_current_user
from app.models.user import User
from app.models.employee import Employee
from app.schemas.auth import LoginRequest, TokenResponse, AuthMeResponse
from app.schemas.user import UserResponse
from app.schemas.employee import EmployeeResponse

router = APIRouter(prefix="/api/auth", tags=["Authentication"])

def _format_employee_response(emp: Employee | None) -> EmployeeResponse | None:
    if not emp:
        return None
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

@router.post("/login", response_model=TokenResponse)
def login(login_data: LoginRequest, db: Session = Depends(get_db)):
    """Authenticate user with email and password, returning JWT access token."""
    user = db.query(User).filter(User.email == login_data.email.strip().lower()).first()
    if not user or not verify_password(login_data.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # Generate JWT token with user id and role
    access_token = create_access_token(data={"sub": str(user.id), "role": user.role, "email": user.email})

    emp_data = _format_employee_response(user.employee)

    return TokenResponse(
        access_token=access_token,
        token_type="bearer",
        user=UserResponse.model_validate(user),
        employee=emp_data
    )

@router.post("/token", response_model=TokenResponse, include_in_schema=False)
def login_for_access_token(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    """Swagger UI standard OAuth2 password flow endpoint."""
    user = db.query(User).filter(User.email == form_data.username.strip().lower()).first()
    if not user or not verify_password(form_data.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    access_token = create_access_token(data={"sub": str(user.id), "role": user.role, "email": user.email})
    emp_data = _format_employee_response(user.employee)

    return TokenResponse(
        access_token=access_token,
        token_type="bearer",
        user=UserResponse.model_validate(user),
        employee=emp_data
    )

@router.get("/me", response_model=AuthMeResponse)
def get_me(current_user: User = Depends(get_current_user)):
    """Get authenticated user and associated employee profile info."""
    emp_data = _format_employee_response(current_user.employee)
    return AuthMeResponse(
        user=UserResponse.model_validate(current_user),
        employee=emp_data
    )
