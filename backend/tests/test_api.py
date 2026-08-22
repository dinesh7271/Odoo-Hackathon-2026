import pytest
from datetime import date
from fastapi.testclient import TestClient
from app.main import app
from app.core.database import SessionLocal, Base, engine
from app.seed_data import seed

client = TestClient(app)

@pytest.fixture(scope="session", autouse=True)
def setup_test_db():
    Base.metadata.drop_all(bind=engine)
    seed()

def get_tokens():
    # HR Login
    hr_res = client.post("/api/auth/login", json={"email": "hr@dayflow.com", "password": "Password123!"})
    assert hr_res.status_code == 200, f"HR login failed: {hr_res.text}"
    hr_token = hr_res.json()["access_token"]

    # Employee Login (Alex)
    emp_res = client.post("/api/auth/login", json={"email": "alex@dayflow.com", "password": "Password123!"})
    assert emp_res.status_code == 200, f"Employee login failed: {emp_res.text}"
    emp_token = emp_res.json()["access_token"]

    # Employee Login (Sarah)
    sarah_res = client.post("/api/auth/login", json={"email": "sarah@dayflow.com", "password": "Password123!"})
    assert sarah_res.status_code == 200, f"Sarah login failed: {sarah_res.text}"
    sarah_token = sarah_res.json()["access_token"]

    return {
        "hr": hr_token,
        "emp": emp_token,
        "sarah": sarah_token
    }

def test_auth_login_invalid():
    res = client.post("/api/auth/login", json={"email": "alex@dayflow.com", "password": "WrongPassword"})
    assert res.status_code == 401

def test_get_employee_profile_me():
    tokens = get_tokens()
    headers = {"Authorization": f"Bearer {tokens['emp']}"}
    
    res = client.get("/api/employees/me", headers=headers)
    assert res.status_code == 200
    data = res.json()
    assert data["email"] == "alex@dayflow.com"
    assert data["name"] == "Alex Morgan"
    assert data["job_title"] == "Senior Frontend Engineer"
    assert data["salary"] == 110000.0
    assert "Offer Letter" in str(data["documents"])

def test_update_employee_profile_me_allowed_fields():
    tokens = get_tokens()
    headers = {"Authorization": f"Bearer {tokens['emp']}"}

    update_payload = {
        "phone": "+1 (555) 999-8888",
        "address": "999 Updated Boulevard, Silicon Valley, CA",
        "profile_picture": "https://images.unsplash.com/photo-custom"
    }
    res = client.put("/api/employees/me", json=update_payload, headers=headers)
    assert res.status_code == 200
    data = res.json()
    assert data["phone"] == "+1 (555) 999-8888"
    assert data["address"] == "999 Updated Boulevard, Silicon Valley, CA"

def test_employee_cannot_edit_forbidden_fields_via_me():
    tokens = get_tokens()
    headers = {"Authorization": f"Bearer {tokens['emp']}"}

    # Attempt to send salary or job_title in body
    payload = {
        "phone": "+1 (555) 111-2222",
        "salary": 999999.0,
        "job_title": "Chief Technology Officer"
    }
    res = client.put("/api/employees/me", json=payload, headers=headers)
    assert res.status_code == 200
    data = res.json()
    # Salary and job title should NOT have changed
    assert data["salary"] == 110000.0
    assert data["job_title"] == "Senior Frontend Engineer"

def test_hr_can_view_all_employees():
    tokens = get_tokens()
    hr_headers = {"Authorization": f"Bearer {tokens['hr']}"}

    res = client.get("/api/employees", headers=hr_headers)
    assert res.status_code == 200
    employees = res.json()
    assert len(employees) >= 3

def test_regular_employee_forbidden_from_viewing_all_employees():
    tokens = get_tokens()
    emp_headers = {"Authorization": f"Bearer {tokens['emp']}"}

    res = client.get("/api/employees", headers=emp_headers)
    assert res.status_code == 403

def test_hr_can_update_any_employee():
    tokens = get_tokens()
    hr_headers = {"Authorization": f"Bearer {tokens['hr']}"}
    emp_headers = {"Authorization": f"Bearer {tokens['emp']}"}

    # Get Alex's profile ID
    me_res = client.get("/api/employees/me", headers=emp_headers)
    alex_id = me_res.json()["id"]

    hr_update_payload = {
        "job_title": "Principal Lead Architect",
        "department": "Core Platform",
        "salary": 135000.0
    }
    res = client.put(f"/api/employees/{alex_id}", json=hr_update_payload, headers=hr_headers)
    assert res.status_code == 200
    data = res.json()
    assert data["job_title"] == "Principal Lead Architect"
    assert data["department"] == "Core Platform"
    assert data["salary"] == 135000.0

def test_attendance_check_in_and_check_out():
    tokens = get_tokens()
    emp_headers = {"Authorization": f"Bearer {tokens['emp']}"}

    # Check-in
    check_in_res = client.post("/api/attendance/check-in", json={"notes": "Starting morning shift"}, headers=emp_headers)
    assert check_in_res.status_code == 200
    in_data = check_in_res.json()
    assert in_data["status"] == "Present"
    assert in_data["check_in"] is not None

    # Check-out
    check_out_res = client.post("/api/attendance/check-out", json={"notes": "Shift ended"}, headers=emp_headers)
    assert check_out_res.status_code == 200
    out_data = check_out_res.json()
    assert out_data["check_out"] is not None
    assert out_data["work_hours"] >= 0.0

def test_employee_attendance_me():
    tokens = get_tokens()
    emp_headers = {"Authorization": f"Bearer {tokens['emp']}"}

    res = client.get("/api/attendance/me", headers=emp_headers)
    assert res.status_code == 200
    records = res.json()
    assert isinstance(records, list)
    assert len(records) > 0

def test_employee_cannot_view_all_attendance():
    tokens = get_tokens()
    emp_headers = {"Authorization": f"Bearer {tokens['emp']}"}

    res = client.get("/api/attendance", headers=emp_headers)
    assert res.status_code == 403

def test_hr_can_view_all_attendance_and_daily_summary():
    tokens = get_tokens()
    hr_headers = {"Authorization": f"Bearer {tokens['hr']}"}

    res = client.get("/api/attendance", headers=hr_headers)
    assert res.status_code == 200
    records = res.json()
    assert isinstance(records, list)
    assert len(records) > 0

    summary_res = client.get("/api/attendance/summary/daily", headers=hr_headers)
    assert summary_res.status_code == 200
    summary = summary_res.json()
    assert "total_employees" in summary
    assert "present" in summary
