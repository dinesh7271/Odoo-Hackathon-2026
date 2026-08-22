const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

function getAuthHeaders(token) {
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  };
}

export async function apiApplyLeave(token, leaveData) {
  const response = await fetch(`${API_BASE_URL}/api/leaves`, {
    method: 'POST',
    headers: getAuthHeaders(token),
    body: JSON.stringify(leaveData),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    const errorMessage = Array.isArray(errorData.detail)
      ? errorData.detail.map((e) => e.msg).join(', ')
      : errorData.detail || 'Failed to submit leave request';
    throw new Error(errorMessage);
  }

  return response.json();
}

export async function apiGetMyLeaves(token) {
  const response = await fetch(`${API_BASE_URL}/api/leaves/me`, {
    headers: getAuthHeaders(token),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.detail || 'Failed to fetch personal leave requests');
  }

  return response.json();
}

export async function apiGetAllLeaves(token, { status = '', leave_type = '', employee_id = '' } = {}) {
  const params = new URLSearchParams();
  if (status) params.append('status', status);
  if (leave_type) params.append('leave_type', leave_type);
  if (employee_id) params.append('employee_id', employee_id);

  const queryString = params.toString() ? `?${params.toString()}` : '';
  const response = await fetch(`${API_BASE_URL}/api/leaves${queryString}`, {
    headers: getAuthHeaders(token),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.detail || 'Failed to fetch leave requests');
  }

  return response.json();
}

export async function apiApproveLeave(token, leaveId, hrComments = '') {
  const response = await fetch(`${API_BASE_URL}/api/leaves/${leaveId}/approve`, {
    method: 'PATCH',
    headers: getAuthHeaders(token),
    body: JSON.stringify({ hr_comments: hrComments || null }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.detail || 'Failed to approve leave request');
  }

  return response.json();
}

export async function apiRejectLeave(token, leaveId, hrComments = '') {
  const response = await fetch(`${API_BASE_URL}/api/leaves/${leaveId}/reject`, {
    method: 'PATCH',
    headers: getAuthHeaders(token),
    body: JSON.stringify({ hr_comments: hrComments || null }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.detail || 'Failed to reject leave request');
  }

  return response.json();
}
