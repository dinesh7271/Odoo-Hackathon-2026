import sys
import os
from datetime import date
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

# Setup test DB (SQLite in-memory with foreign key support for fast isolated testing)
from app.core.database import Base, get_db
from app.main import app

TEST_DATABASE_URL = "sqlite:///:memory:"

engine = create_engine(
    TEST_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def override_get_db():
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()

app.dependency_overrides[get_db] = override_get_db

# Create all database tables
Base.metadata.create_all(bind=engine)

client = TestClient(app)

def run_tests():
    print("=" * 60)
    print("DAYFLOW HRMS - PHASE 1 LEAVE MANAGEMENT TEST SUITE")
    print("=" * 60)

    # 1. Health Check
    res = client.get("/api/health")
    assert res.status_code == 200, f"Health check failed: {res.text}"
    print(" [PASS] 1. API Health Check passed")

    # 2. Register Employee
    emp_payload = {
        "email": "sarah.connor@dayflow.local",
        "password": "Password123!",
        "role": "employee"
    }
    res = client.post("/api/auth/register", json=emp_payload)
    assert res.status_code == 201, f"Employee registration failed: {res.text}"
    print(" [PASS] 2. Employee registered successfully")

    # 3. Login Employee
    res = client.post("/api/auth/login", json={"email": "sarah.connor@dayflow.local", "password": "Password123!"})
    assert res.status_code == 200, f"Employee login failed: {res.text}"
    emp_token = res.json()["access_token"]
    emp_headers = {"Authorization": f"Bearer {emp_token}"}
    print(" [PASS] 3. Employee authenticated, JWT token acquired")

    # 4. Register HR
    hr_payload = {
        "email": "hr.manager@dayflow.local",
        "password": "AdminPassword123!",
        "role": "hr"
    }
    res = client.post("/api/auth/register", json=hr_payload)
    assert res.status_code == 201, f"HR registration failed: {res.text}"
    print(" [PASS] 4. HR user registered successfully")

    # 5. Login HR
    res = client.post("/api/auth/login", json={"email": "hr.manager@dayflow.local", "password": "AdminPassword123!"})
    assert res.status_code == 200, f"HR login failed: {res.text}"
    hr_token = res.json()["access_token"]
    hr_headers = {"Authorization": f"Bearer {hr_token}"}
    print(" [PASS] 5. HR authenticated, JWT token acquired")

    # 6. Test Employee Apply for Leaves (Paid, Sick, Unpaid)
    # 6a. Paid leave
    paid_leave_payload = {
        "leave_type": "Paid",
        "start_date": "2026-09-01",
        "end_date": "2026-09-05",
        "remarks": "Annual family vacation to the mountains"
    }
    res = client.post("/api/leaves", json=paid_leave_payload, headers=emp_headers)
    assert res.status_code == 201, f"Apply paid leave failed: {res.text}"
    paid_leave = res.json()
    assert paid_leave["leave_type"] == "Paid"
    assert paid_leave["status"] == "Pending"
    assert paid_leave["remarks"] == "Annual family vacation to the mountains"
    paid_leave_id = paid_leave["id"]
    print(f" [PASS] 6a. Employee applied for Paid Leave (ID: {paid_leave_id}, Status: Pending)")

    # 6b. Sick leave
    sick_leave_payload = {
        "leave_type": "Sick",
        "start_date": "2026-09-10",
        "end_date": "2026-09-11",
        "remarks": "Dental surgery and recovery"
    }
    res = client.post("/api/leaves", json=sick_leave_payload, headers=emp_headers)
    assert res.status_code == 201, f"Apply sick leave failed: {res.text}"
    sick_leave = res.json()
    assert sick_leave["leave_type"] == "Sick"
    assert sick_leave["status"] == "Pending"
    sick_leave_id = sick_leave["id"]
    print(f" [PASS] 6b. Employee applied for Sick Leave (ID: {sick_leave_id}, Status: Pending)")

    # 6c. Unpaid leave
    unpaid_leave_payload = {
        "leave_type": "Unpaid",
        "start_date": "2026-09-20",
        "end_date": "2026-09-22",
        "remarks": "Personal sabbatical days"
    }
    res = client.post("/api/leaves", json=unpaid_leave_payload, headers=emp_headers)
    assert res.status_code == 201, f"Apply unpaid leave failed: {res.text}"
    unpaid_leave_id = res.json()["id"]
    print(f" [PASS] 6c. Employee applied for Unpaid Leave (ID: {unpaid_leave_id}, Status: Pending)")

    # 7. Test Validation Constraints
    # Invalid end_date < start_date
    invalid_date_payload = {
        "leave_type": "Paid",
        "start_date": "2026-09-10",
        "end_date": "2026-09-01",
        "remarks": "Invalid dates"
    }
    res = client.post("/api/leaves", json=invalid_date_payload, headers=emp_headers)
    assert res.status_code == 422, f"Expected 422 for invalid dates, got: {res.status_code}"
    print(" [PASS] 7a. Validation correctly rejected end_date before start_date (422 Unprocessable Entity)")

    # Invalid leave type
    invalid_type_payload = {
        "leave_type": "Maternity",
        "start_date": "2026-09-01",
        "end_date": "2026-09-05",
        "remarks": "Invalid leave type"
    }
    res = client.post("/api/leaves", json=invalid_type_payload, headers=emp_headers)
    assert res.status_code == 422, f"Expected 422 for invalid leave type, got: {res.status_code}"
    print(" [PASS] 7b. Validation correctly rejected invalid leave type (422 Unprocessable Entity)")

    # 8. Employee Views Own Leaves (/api/leaves/me)
    res = client.get("/api/leaves/me", headers=emp_headers)
    assert res.status_code == 200, f"Get my leaves failed: {res.text}"
    my_leaves = res.json()
    assert len(my_leaves) == 3, f"Expected 3 leaves, got {len(my_leaves)}"
    assert all(l["status"] == "Pending" for l in my_leaves)
    print(" [PASS] 8. Employee successfully viewed 3 own leave requests with Pending status")

    # 9. Test Role-Based Access Control (RBAC Permissions)
    # Employee attempting HR endpoint: GET /api/leaves -> Forbidden 403
    res = client.get("/api/leaves", headers=emp_headers)
    assert res.status_code == 403, f"Expected 403 for employee calling GET /api/leaves, got {res.status_code}"
    print(" [PASS] 9a. RBAC: Employee blocked from accessing all leaves (403 Forbidden)")

    # Employee attempting to approve leave -> Forbidden 403
    res = client.patch(f"/api/leaves/{paid_leave_id}/approve", json={"hr_comments": "Hacked"}, headers=emp_headers)
    assert res.status_code == 403, f"Expected 403 for employee approving leave, got {res.status_code}"
    print(" [PASS] 9b. RBAC: Employee blocked from approving leave (403 Forbidden)")

    # Employee attempting to reject leave -> Forbidden 403
    res = client.patch(f"/api/leaves/{sick_leave_id}/reject", json={"hr_comments": "Hacked"}, headers=emp_headers)
    assert res.status_code == 403, f"Expected 403 for employee rejecting leave, got {res.status_code}"
    print(" [PASS] 9c. RBAC: Employee blocked from rejecting leave (403 Forbidden)")

    # Unauthenticated access -> 401 Unauthorized / 403
    res = client.get("/api/leaves/me")
    assert res.status_code in [401, 403], f"Expected 401/403 for unauthenticated, got {res.status_code}"
    print(" [PASS] 9d. Security: Unauthenticated request rejected (401/403)")

    # 10. HR Views All Leaves (/api/leaves)
    res = client.get("/api/leaves", headers=hr_headers)
    assert res.status_code == 200, f"HR get all leaves failed: {res.text}"
    all_leaves = res.json()
    assert len(all_leaves) == 3, f"Expected 3 leaves, got {len(all_leaves)}"
    # Check employee info is included
    assert all_leaves[0]["employee"] is not None
    assert all_leaves[0]["employee"]["name"] == "Sarah Connor"
    print(f" [PASS] 10. HR successfully fetched all {len(all_leaves)} leaves with employee details")

    # 11. HR Approves Leave #1 with Comments
    approve_comment = "Approved! Enjoy your well-deserved vacation."
    res = client.patch(
        f"/api/leaves/{paid_leave_id}/approve",
        json={"hr_comments": approve_comment},
        headers=hr_headers
    )
    assert res.status_code == 200, f"HR approve failed: {res.text}"
    approved_leave = res.json()
    assert approved_leave["status"] == "Approved"
    assert approved_leave["hr_comments"] == approve_comment
    print(f" [PASS] 11. HR approved Leave ID {paid_leave_id} with comment: '{approve_comment}'")

    # 12. HR Rejects Leave #2 with Comments
    reject_comment = "Rejected due to critical deployment release during this window. Please reschedule."
    res = client.patch(
        f"/api/leaves/{sick_leave_id}/reject",
        json={"hr_comments": reject_comment},
        headers=hr_headers
    )
    assert res.status_code == 200, f"HR reject failed: {res.text}"
    rejected_leave = res.json()
    assert rejected_leave["status"] == "Rejected"
    assert rejected_leave["hr_comments"] == reject_comment
    print(f" [PASS] 12. HR rejected Leave ID {sick_leave_id} with comment: '{reject_comment}'")

    # 13. Verify Immediate Reflection in Employee's Leave View
    res = client.get("/api/leaves/me", headers=emp_headers)
    assert res.status_code == 200
    updated_leaves = {l["id"]: l for l in res.json()}
    
    assert updated_leaves[paid_leave_id]["status"] == "Approved"
    assert updated_leaves[paid_leave_id]["hr_comments"] == approve_comment

    assert updated_leaves[sick_leave_id]["status"] == "Rejected"
    assert updated_leaves[sick_leave_id]["hr_comments"] == reject_comment

    assert updated_leaves[unpaid_leave_id]["status"] == "Pending"
    assert updated_leaves[unpaid_leave_id]["hr_comments"] is None

    print(" [PASS] 13. Employee /api/leaves/me immediately reflects updated statuses and HR comments!")

    # 14. Test HR Status Filter
    res = client.get("/api/leaves?status=Approved", headers=hr_headers)
    assert res.status_code == 200
    filtered_approved = res.json()
    assert len(filtered_approved) == 1
    assert filtered_approved[0]["id"] == paid_leave_id
    print(" [PASS] 14. HR query filter ?status=Approved works accurately")

    print("=" * 60)
    print("ALL 14 TESTS IN PHASE 1 PASSED WITH 100% SUCCESS!")
    print("=" * 60)

if __name__ == "__main__":
    run_tests()
