import sys
import os

# Add the parent directory to sys.path so we can import app modules properly
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.core.database import SessionLocal, engine
from app.models import Base
from app.models.user import User
from app.models.employee import Employee
from app.core.security import hash_password

def seed_db():
    print("Seeding database...")
    Base.metadata.create_all(bind=engine)
    
    db = SessionLocal()
    try:
        # 1. Seed HR User
        hr_user = db.query(User).filter(User.email == "hr@dayflow.com").first()
        if not hr_user:
            hr_user = User(
                email="hr@dayflow.com",
                password_hash=hash_password("hr123"),
                role="hr"
            )
            db.add(hr_user)
            db.commit()
            db.refresh(hr_user)
            print("Created HR user account: hr@dayflow.com")
        else:
            print("HR user account already exists.")

        # Seed HR Employee details
        hr_employee = db.query(Employee).filter(Employee.user_id == hr_user.id).first()
        if not hr_employee:
            hr_employee = Employee(
                user_id=hr_user.id,
                employee_id="EMP000",
                name="Sarah Jenkins",
                email="hr@dayflow.com",
                phone="+1-555-0100",
                address="123 Corporate Blvd, Metropolis",
                job_title="HR Director",
                department="Human Resources",
                salary=8500.0
            )
            db.add(hr_employee)
            db.commit()
            print("Created HR Employee details: Sarah Jenkins (EMP000)")
        else:
            print("HR Employee details already exist.")

        # 2. Seed Standard Employee User
        emp_user = db.query(User).filter(User.email == "employee@dayflow.com").first()
        if not emp_user:
            emp_user = User(
                email="employee@dayflow.com",
                password_hash=hash_password("emp123"),
                role="employee"
            )
            db.add(emp_user)
            db.commit()
            db.refresh(emp_user)
            print("Created Employee user account: employee@dayflow.com")
        else:
            print("Employee user account already exists.")

        # Seed Employee details
        emp_employee = db.query(Employee).filter(Employee.user_id == emp_user.id).first()
        if not emp_employee:
            emp_employee = Employee(
                user_id=emp_user.id,
                employee_id="EMP001",
                name="John Doe",
                email="employee@dayflow.com",
                phone="+1-555-0101",
                address="456 Oak Lane, Springfield",
                job_title="Senior Software Engineer",
                department="Engineering",
                salary=6000.0
            )
            db.add(emp_employee)
            db.commit()
            print("Created Employee details: John Doe (EMP001)")
        else:
            print("Employee details already exist.")
            
        print("Database seeding completed successfully!")
    except Exception as e:
        print(f"Error seeding database: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    seed_db()
