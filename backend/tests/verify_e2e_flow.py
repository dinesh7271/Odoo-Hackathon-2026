import httpx
import json
import sys

BASE_URL = "http://127.0.0.1:8000"

def log(msg, status="INFO"):
    print(f"[{status}] {msg}")

def run_e2e_tests():
    log("Starting comprehensive E2E verification against live server...", "START")
    
    # 1. Health check
    res = httpx.get(f"{BASE_URL}/api/health")
    assert res.status_code == 200, f"Health check failed: {res.text}"
    log("Health Check OK: Server online with modules: " + str(res.json().get("modules")), "PASS")

    # 2. Employee Login (Alex)
    log("Testing Employee Login (alex@dayflow.com)...")
    res = httpx.post(f"{BASE_URL}/api/auth/login", json={"email": "alex@dayflow.com", "password": "Password123!"})
    assert res.status_code == 200, f"Employee login failed: {res.text}"
    alex_token = res.json()["access_token"]
    alex_headers = {"Authorization": f"Bearer {alex_token}"}
    log("Employee Login successful! Received JWT token.", "PASS")

    # 3. View Own Profile
    log("Testing GET /api/employees/me...")
    res = httpx.get(f"{BASE_URL}/api/employees/me", headers=alex_headers)
    assert res.status_code == 200, f"Get profile failed: {res.text}"
    profile = res.json()
    assert profile["email"] == "alex@dayflow.com"
    assert profile["salary"] is not None
    assert "Offer Letter" in str(profile.get("documents"))
    log(f"Profile Loaded: {profile['name']} ({profile['job_title']}, Salary: ${profile['salary']})", "PASS")

    # 4. Employee Edit Allowed Fields (Phone & Address)
    log("Testing Employee self-update (Phone & Address) via PUT /api/employees/me...")
    update_data = {
        "phone": "+1 (555) 777-8888",
        "address": "42 Innovation Hub, Silicon Valley, CA",
        "profile_picture": "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300"
    }
    res = httpx.put(f"{BASE_URL}/api/employees/me", json=update_data, headers=alex_headers)
    assert res.status_code == 200, f"Update profile failed: {res.text}"
    updated = res.json()
    assert updated["phone"] == "+1 (555) 777-8888"
    assert updated["address"] == "42 Innovation Hub, Silicon Valley, CA"
    log("Self-update succeeded for allowed fields (Phone & Address)", "PASS")

    # 5. Check-In Flow (using David Kim for fresh shift)
    log("Logging in as David Kim (david@dayflow.com) for fresh check-in/out...")
    res = httpx.post(f"{BASE_URL}/api/auth/login", json={"email": "david@dayflow.com", "password": "Password123!"})
    david_token = res.json()["access_token"]
    david_headers = {"Authorization": f"Bearer {david_token}"}

    log("Testing Attendance Check-in via POST /api/attendance/check-in...")
    res = httpx.post(f"{BASE_URL}/api/attendance/check-in", json={"notes": "David starting shift"}, headers=david_headers)
    assert res.status_code == 200, f"Check-in failed: {res.text}"
    checkin_res = res.json()
    assert checkin_res["status"] == "Present"
    assert checkin_res["check_in"] is not None
    log(f"Check-In Success! Status: {checkin_res['status']} at {checkin_res['check_in']}", "PASS")

    # 6. Check-Out Flow
    log("Testing Attendance Check-out via POST /api/attendance/check-out...")
    res = httpx.post(f"{BASE_URL}/api/attendance/check-out", json={"notes": "David completed shift"}, headers=david_headers)
    assert res.status_code == 200, f"Check-out failed: {res.text}"
    checkout_res = res.json()
    assert checkout_res["check_out"] is not None
    log(f"Check-Out Success! Work hours: {checkout_res['work_hours']} hrs, Status: {checkout_res['status']}", "PASS")

    # 7. Employee Weekly Attendance View
    log("Testing GET /api/attendance/me/weekly...")
    res = httpx.get(f"{BASE_URL}/api/attendance/me/weekly", headers=alex_headers)
    assert res.status_code == 200, f"Weekly attendance failed: {res.text}"
    weekly = res.json()
    assert "start_date" in weekly
    assert "records" in weekly
    log(f"Weekly Attendance OK: {len(weekly['records'])} daily records, {weekly['total_work_hours']} total hours", "PASS")

    # 8. Verify Employee Permission Boundary (Forbidden from HR Endpoints)
    log("Testing Employee Permission Boundaries (should get 403 Forbidden)...")
    res = httpx.get(f"{BASE_URL}/api/employees", headers=alex_headers)
    assert res.status_code == 403, f"Expected 403 for employee on /api/employees, got {res.status_code}"
    res = httpx.get(f"{BASE_URL}/api/attendance", headers=alex_headers)
    assert res.status_code == 403, f"Expected 403 for employee on /api/attendance, got {res.status_code}"
    log("Permission Boundary Verified: Regular employee cannot access HR-only routes", "PASS")

    # 9. HR Login (Eleanor Vance)
    log("Testing HR Login (hr@dayflow.com)...")
    res = httpx.post(f"{BASE_URL}/api/auth/login", json={"email": "hr@dayflow.com", "password": "Password123!"})
    assert res.status_code == 200, f"HR login failed: {res.text}"
    hr_token = res.json()["access_token"]
    hr_headers = {"Authorization": f"Bearer {hr_token}"}
    log("HR Login Successful! Role: hr", "PASS")

    # 10. HR View All Employees Directory
    log("Testing HR GET /api/employees...")
    res = httpx.get(f"{BASE_URL}/api/employees", headers=hr_headers)
    assert res.status_code == 200, f"HR get employees failed: {res.text}"
    all_emps = res.json()
    assert len(all_emps) >= 3
    log(f"HR Employee Directory: Retrieved {len(all_emps)} staff profiles", "PASS")

    # 11. HR Edit Any Employee (Update Salary & Job Title)
    log("Testing HR PUT /api/employees/{id}...")
    alex_emp_id = profile["id"]
    hr_edit_payload = {
        "job_title": "Lead Principal Architect",
        "salary": 140000.0,
        "department": "Engineering"
    }
    res = httpx.put(f"{BASE_URL}/api/employees/{alex_emp_id}", json=hr_edit_payload, headers=hr_headers)
    assert res.status_code == 200, f"HR edit employee failed: {res.text}"
    updated_by_hr = res.json()
    assert updated_by_hr["job_title"] == "Lead Principal Architect"
    assert updated_by_hr["salary"] == 140000.0
    log("HR Successfully modified employee job title & salary", "PASS")

    # 12. HR View All Attendance & Daily Summary
    log("Testing HR GET /api/attendance and /summary/daily...")
    res = httpx.get(f"{BASE_URL}/api/attendance", headers=hr_headers)
    assert res.status_code == 200, f"HR get attendance failed: {res.text}"
    att_records = res.json()
    assert len(att_records) > 0
    
    summary_res = httpx.get(f"{BASE_URL}/api/attendance/summary/daily", headers=hr_headers)
    assert summary_res.status_code == 200, f"HR get daily summary failed: {summary_res.text}"
    summary = summary_res.json()
    log(f"HR Attendance Logs: {len(att_records)} total records", "PASS")
    log(f"HR Daily Summary: Present={summary['present']}, Half-day={summary['half_day']}, Absent={summary['absent']}, Leave={summary['on_leave']}", "PASS")

    # 13. HR Manual Attendance Adjustment
    log("Testing HR POST /api/attendance/manual...")
    manual_payload = {
        "employee_id": all_emps[1]["id"],
        "date": "2026-08-20",
        "status": "Leave",
        "work_hours": 0.0,
        "notes": "Approved medical leave by HR"
    }
    res = httpx.post(f"{BASE_URL}/api/attendance/manual", json=manual_payload, headers=hr_headers)
    assert res.status_code == 200, f"Manual attendance failed: {res.text}"
    adjusted = res.json()
    assert adjusted["status"] == "Leave"
    log("HR Manual Attendance Adjustment Succeeded (Status: Leave)", "PASS")

    print("\n========================================================")
    log("ALL 13 END-TO-END FLOWS AND ROLE PERMISSIONS PASSED!", "SUCCESS")
    print("========================================================\n")

if __name__ == "__main__":
    try:
        run_e2e_tests()
    except Exception as e:
        log(f"Test failed with error: {e}", "ERROR")
        sys.exit(1)
