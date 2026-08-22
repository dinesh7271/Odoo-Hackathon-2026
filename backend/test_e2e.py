import sys
import os
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.core.database import Base, get_db
from app.main import app

# Isolated in-memory SQLite database
TEST_DB_URL = "sqlite:///:memory:"
engine = create_engine(
    TEST_DB_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def override_get_db():
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()

app.dependency_overrides[get_db] = override_get_db
Base.metadata.create_all(bind=engine)

client = TestClient(app)

def run_e2e_verification():
    print("=" * 70)
    print("DAYFLOW HRMS - END-TO-END VERIFICATION SUITE")
    print("=" * 70)

    # 1. Register & Login Employee 1
    emp1_res = client.post("/api/auth/register", json={
        "email": "alex.chen@dayflow.local",
        "password": "Password123!",
        "role": "employee"
    })
    assert emp1_res.status_code == 201
    
    emp1_login = client.post("/api/auth/login", json={
        "email": "alex.chen@dayflow.local",
        "password": "Password123!"
    })
    assert emp1_login.status_code == 200
    emp1_token = emp1_login.json()["access_token"]
    emp1_headers = {"Authorization": f"Bearer {emp1_token}"}
    print(" [OK] 1. Employee 1 registered and authenticated")

    # 2. Register & Login Employee 2
    emp2_res = client.post("/api/auth/register", json={
        "email": "maria.garcia@dayflow.local",
        "password": "Password123!",
        "role": "employee"
    })
    assert emp2_res.status_code == 201
    
    emp2_login = client.post("/api/auth/login", json={
        "email": "maria.garcia@dayflow.local",
        "password": "Password123!"
    })
    assert emp2_login.status_code == 200
    emp2_token = emp2_login.json()["access_token"]
    emp2_headers = {"Authorization": f"Bearer {emp2_token}"}
    print(" [OK] 2. Employee 2 registered and authenticated")

    # 3. Register & Login HR Admin
    hr_res = client.post("/api/auth/register", json={
        "email": "hr.lead@dayflow.local",
        "password": "AdminPassword123!",
        "role": "hr"
    })
    assert hr_res.status_code == 201
    
    hr_login = client.post("/api/auth/login", json={
        "email": "hr.lead@dayflow.local",
        "password": "AdminPassword123!"
    })
    assert hr_login.status_code == 200
    hr_token = hr_login.json()["access_token"]
    hr_headers = {"Authorization": f"Bearer {hr_token}"}
    print(" [OK] 3. HR Admin registered and authenticated")

    # 4. Employee 1 applies for Paid Leave & Sick Leave
    paid_leave = client.post("/api/leaves", json={
        "leave_type": "Paid",
        "start_date": "2026-09-01",
        "end_date": "2026-09-05",
        "remarks": "Annual family travel"
    }, headers=emp1_headers).json()
    paid_id = paid_leave["id"]
    assert paid_leave["status"] == "Pending"

    sick_leave = client.post("/api/leaves", json={
        "leave_type": "Sick",
        "start_date": "2026-09-12",
        "end_date": "2026-09-13",
        "remarks": "Eye checkup"
    }, headers=emp1_headers).json()
    sick_id = sick_leave["id"]
    assert sick_leave["status"] == "Pending"
    print(" [OK] 4. Employee 1 applied for Paid & Sick leaves")

    # 5. Employee 2 applies for Unpaid Leave
    unpaid_leave = client.post("/api/leaves", json={
        "leave_type": "Unpaid",
        "start_date": "2026-10-01",
        "end_date": "2026-10-10",
        "remarks": "Study leave for certification"
    }, headers=emp2_headers).json()
    unpaid_id = unpaid_leave["id"]
    assert unpaid_leave["status"] == "Pending"
    print(" [OK] 5. Employee 2 applied for Unpaid leave")

    # 6. Employee 1 Views Own Leaves
    emp1_leaves = client.get("/api/leaves/me", headers=emp1_headers).json()
    assert len(emp1_leaves) == 2
    assert all(l["employee_id"] == paid_leave["employee_id"] for l in emp1_leaves)
    print(" [OK] 6. Employee 1 views ONLY their 2 leave requests")

    # 7. Employee 2 Views Own Leaves
    emp2_leaves = client.get("/api/leaves/me", headers=emp2_headers).json()
    assert len(emp2_leaves) == 1
    assert emp2_leaves[0]["id"] == unpaid_id
    print(" [OK] 7. Employee 2 views ONLY their 1 leave request")

    # 8. Strict RBAC Verification
    assert client.get("/api/leaves", headers=emp1_headers).status_code == 403
    assert client.patch(f"/api/leaves/{paid_id}/approve", json={}, headers=emp1_headers).status_code == 403
    assert client.patch(f"/api/leaves/{paid_id}/reject", json={}, headers=emp1_headers).status_code == 403
    print(" [OK] 8. RBAC: Employee blocked from all HR actions (403 Forbidden)")

    # 9. HR Views All Leaves (with Employee Info)
    all_leaves = client.get("/api/leaves", headers=hr_headers).json()
    assert len(all_leaves) == 3
    # Verify Employee info populated
    for req in all_leaves:
        assert req["employee"] is not None
        assert "name" in req["employee"]
        assert "email" in req["employee"]
        assert "employee_id" in req["employee"]
    print(" [OK] 9. HR views all 3 requests with embedded employee details")

    # 10. HR Approves Leave #1 with Comment
    approve_res = client.patch(
        f"/api/leaves/{paid_id}/approve",
        json={"hr_comments": "Approved. Enjoy your time off!"},
        headers=hr_headers
    )
    assert approve_res.status_code == 200
    assert approve_res.json()["status"] == "Approved"
    assert approve_res.json()["hr_comments"] == "Approved. Enjoy your time off!"
    print(" [OK] 10. HR approved Leave #1 with comments")

    # 11. HR Rejects Leave #2 with Comment
    reject_res = client.patch(
        f"/api/leaves/{sick_id}/reject",
        json={"hr_comments": "Please provide medical certificate for multi-day sick leave."},
        headers=hr_headers
    )
    assert reject_res.status_code == 200
    assert reject_res.json()["status"] == "Rejected"
    assert reject_res.json()["hr_comments"] == "Please provide medical certificate for multi-day sick leave."
    print(" [OK] 11. HR rejected Leave #2 with comments")

    # 12. Employee 1 verifies instant status update reflection
    emp1_updated = client.get("/api/leaves/me", headers=emp1_headers).json()
    emp1_map = {l["id"]: l for l in emp1_updated}
    assert emp1_map[paid_id]["status"] == "Approved"
    assert emp1_map[paid_id]["hr_comments"] == "Approved. Enjoy your time off!"
    assert emp1_map[sick_id]["status"] == "Rejected"
    assert emp1_map[sick_id]["hr_comments"] == "Please provide medical certificate for multi-day sick leave."
    print(" [OK] 12. Status changes immediately reflected in Employee 1 portal")

    # 13. HR Filter Tests
    pending_only = client.get("/api/leaves?status=Pending", headers=hr_headers).json()
    assert len(pending_only) == 1
    assert pending_only[0]["id"] == unpaid_id

    approved_only = client.get("/api/leaves?status=Approved", headers=hr_headers).json()
    assert len(approved_only) == 1
    assert approved_only[0]["id"] == paid_id

    rejected_only = client.get("/api/leaves?status=Rejected", headers=hr_headers).json()
    assert len(rejected_only) == 1
    assert rejected_only[0]["id"] == sick_id
    print(" [OK] 13. HR query filters (Pending/Approved/Rejected) working perfectly")

    print("=" * 70)
    print("ALL END-TO-END AND SECURITY TESTS PASSED WITH 100% SUCCESS!")
    print("=" * 70)

if __name__ == "__main__":
    run_e2e_verification()
