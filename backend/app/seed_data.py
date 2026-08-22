import json
from datetime import date, datetime, timedelta, timezone
from app.core.database import SessionLocal, engine, Base
from app.core.security import get_password_hash
from app.models.user import User
from app.models.employee import Employee
from app.models.attendance import Attendance

def seed():
    # Ensure tables exist
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()

    try:
        print("[INFO] Seeding database with initial users and employee records...")

        # 1. Demo HR User
        hr_user = db.query(User).filter(User.email == "hr@dayflow.com").first()
        if not hr_user:
            hr_user = User(
                email="hr@dayflow.com",
                password_hash=get_password_hash("Password123!"),
                role="hr"
            )
            db.add(hr_user)
            db.flush()

            hr_docs = json.dumps([
                {"title": "HR Leadership Certification", "type": "pdf", "date": "2025-01-10", "size": "1.2 MB"},
                {"title": "Employment Contract", "type": "pdf", "date": "2024-03-01", "size": "2.4 MB"}
            ])

            hr_emp = Employee(
                user_id=hr_user.id,
                employee_id="HR001",
                name="Eleanor Vance",
                email="hr@dayflow.com",
                phone="+1 (555) 019-2834",
                address="742 Evergreen Terrace, Springfield, OR",
                job_title="Head of People & Culture",
                department="Human Resources",
                salary=95000.0,
                profile_picture="https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=300&h=300&fit=crop&crop=face",
                documents=hr_docs
            )
            db.add(hr_emp)
            print("   Created HR User: hr@dayflow.com (Eleanor Vance)")

        # 2. Demo Employees
        employees_data = [
            {
                "email": "alex@dayflow.com",
                "employee_id": "EMP101",
                "name": "Alex Morgan",
                "phone": "+1 (555) 012-3456",
                "address": "123 Innovation Way, Tech Park, CA",
                "job_title": "Senior Frontend Engineer",
                "department": "Engineering",
                "salary": 110000.0,
                "profile_picture": "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&h=300&fit=crop&crop=face",
                "documents": json.dumps([
                    {"title": "Offer Letter", "type": "pdf", "date": "2024-06-10", "size": "850 KB"},
                    {"title": "Tax Form W-4", "type": "pdf", "date": "2025-01-05", "size": "420 KB"}
                ])
            },
            {
                "email": "sarah@dayflow.com",
                "employee_id": "EMP102",
                "name": "Sarah Jenkins",
                "phone": "+1 (555) 014-7890",
                "address": "456 Pine Creek Blvd, Seattle, WA",
                "job_title": "Lead Product Designer",
                "department": "Design",
                "salary": 98000.0,
                "profile_picture": "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=300&h=300&fit=crop&crop=face",
                "documents": json.dumps([
                    {"title": "Design NDA Agreement", "type": "pdf", "date": "2024-08-12", "size": "1.8 MB"}
                ])
            },
            {
                "email": "david@dayflow.com",
                "employee_id": "EMP103",
                "name": "David Kim",
                "phone": "+1 (555) 018-9922",
                "address": "888 Skyline Avenue, Austin, TX",
                "job_title": "Staff Backend Architect",
                "department": "Engineering",
                "salary": 125000.0,
                "profile_picture": "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&h=300&fit=crop&crop=face",
                "documents": json.dumps([
                    {"title": "Security Clearance", "type": "pdf", "date": "2023-11-20", "size": "650 KB"}
                ])
            }
        ]

        created_employees = []
        for ed in employees_data:
            user = db.query(User).filter(User.email == ed["email"]).first()
            if not user:
                user = User(
                    email=ed["email"],
                    password_hash=get_password_hash("Password123!"),
                    role="employee"
                )
                db.add(user)
                db.flush()

                emp = Employee(
                    user_id=user.id,
                    employee_id=ed["employee_id"],
                    name=ed["name"],
                    email=ed["email"],
                    phone=ed["phone"],
                    address=ed["address"],
                    job_title=ed["job_title"],
                    department=ed["department"],
                    salary=ed["salary"],
                    profile_picture=ed["profile_picture"],
                    documents=ed["documents"]
                )
                db.add(emp)
                db.flush()
                created_employees.append(emp)
                print(f"   Created Employee: {ed['email']} ({ed['name']})")
            else:
                emp = db.query(Employee).filter(Employee.user_id == user.id).first()
                if emp:
                    created_employees.append(emp)

        # 3. Seed historical attendance records for the past 7 days
        all_emps = db.query(Employee).all()
        today = date.today()

        for emp in all_emps:
            for day_offset in range(1, 8):
                att_date = today - timedelta(days=day_offset)
                # Skip weekends
                if att_date.weekday() >= 5:
                    continue

                existing = db.query(Attendance).filter(
                    Attendance.employee_id == emp.id,
                    Attendance.date == att_date
                ).first()

                if not existing:
                    # Variation in attendance
                    if day_offset == 3 and emp.employee_id == "EMP102":
                        # Sarah took Leave on day 3
                        att = Attendance(
                            employee_id=emp.id,
                            date=att_date,
                            status="Leave",
                            work_hours=0.0,
                            notes="Approved medical leave"
                        )
                    elif day_offset == 4 and emp.employee_id == "EMP103":
                        # David had a Half-day on day 4
                        c_in = datetime.combine(att_date, datetime.min.time(), tzinfo=timezone.utc).replace(hour=9, minute=0)
                        c_out = datetime.combine(att_date, datetime.min.time(), tzinfo=timezone.utc).replace(hour=13, minute=30)
                        att = Attendance(
                            employee_id=emp.id,
                            date=att_date,
                            check_in=c_in,
                            check_out=c_out,
                            work_hours=4.5,
                            status="Half-day",
                            notes="Half-day afternoon dentist appointment"
                        )
                    else:
                        # Full day present
                        c_in = datetime.combine(att_date, datetime.min.time(), tzinfo=timezone.utc).replace(hour=9, minute=0)
                        c_out = datetime.combine(att_date, datetime.min.time(), tzinfo=timezone.utc).replace(hour=17, minute=30)
                        att = Attendance(
                            employee_id=emp.id,
                            date=att_date,
                            check_in=c_in,
                            check_out=c_out,
                            work_hours=8.5,
                            status="Present",
                            notes="Standard workday shift"
                        )
                    db.add(att)

        db.commit()
        print("[SUCCESS] Database seeding completed successfully!")

    except Exception as e:
        db.rollback()
        print(f"[ERROR] Error during database seeding: {e}")
        raise e
        raise e
    finally:
        db.close()

if __name__ == "__main__":
    seed()
