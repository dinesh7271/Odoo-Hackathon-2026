const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000';

async function request(endpoint, options = {}) {
  const token = localStorage.getItem('dayflow_token');
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };

  const url = `${API_BASE}${endpoint}`;
  try {
    const res = await fetch(url, {
      ...options,
      headers,
    });

    if (res.status === 401) {
      // Don't auto-redirect if login itself failed with 401
      if (!endpoint.includes('/api/auth/login')) {
        localStorage.removeItem('dayflow_token');
        localStorage.removeItem('dayflow_user');
      }
    }

    const data = await res.json().catch(() => null);

    if (!res.ok) {
      const errorMsg = data?.detail || `Request failed with status ${res.status}`;
      throw new Error(errorMsg);
    }

    return data;
  } catch (err) {
    console.error(`API Error on ${endpoint}:`, err);
    throw err;
  }
}

export const api = {
  // Authentication
  auth: {
    login: (email, password) =>
      request('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      }),
    getMe: () => request('/api/auth/me'),
  },

  // Employees
  employees: {
    getMyProfile: () => request('/api/employees/me'),
    updateMyProfile: (data) =>
      request('/api/employees/me', {
        method: 'PUT',
        body: JSON.stringify(data),
      }),
    getAll: (params = {}) => {
      const query = new URLSearchParams();
      if (params.department) query.append('department', params.department);
      if (params.search) query.append('search', params.search);
      const qs = query.toString() ? `?${query.toString()}` : '';
      return request(`/api/employees${qs}`);
    },
    getById: (id) => request(`/api/employees/${id}`),
    updateByHR: (id, data) =>
      request(`/api/employees/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      }),
  },

  // Attendance
  attendance: {
    checkIn: (notes = '') =>
      request('/api/attendance/check-in', {
        method: 'POST',
        body: JSON.stringify({ notes }),
      }),
    checkOut: (notes = '') =>
      request('/api/attendance/check-out', {
        method: 'POST',
        body: JSON.stringify({ notes }),
      }),
    getMyAttendance: (params = {}) => {
      const query = new URLSearchParams();
      if (params.startDate) query.append('start_date', params.startDate);
      if (params.endDate) query.append('end_date', params.endDate);
      if (params.limit) query.append('limit', params.limit);
      const qs = query.toString() ? `?${query.toString()}` : '';
      return request(`/api/attendance/me${qs}`);
    },
    getMyWeekly: (targetDate) => {
      const qs = targetDate ? `?target_date=${targetDate}` : '';
      return request(`/api/attendance/me/weekly${qs}`);
    },
    getAll: (params = {}) => {
      const query = new URLSearchParams();
      if (params.date) query.append('date', params.date);
      if (params.startDate) query.append('start_date', params.startDate);
      if (params.endDate) query.append('end_date', params.endDate);
      if (params.department) query.append('department', params.department);
      if (params.employeeId) query.append('employee_id', params.employeeId);
      if (params.status) query.append('status', params.status);
      const qs = query.toString() ? `?${query.toString()}` : '';
      return request(`/api/attendance${qs}`);
    },
    getDailySummary: (dateStr) => {
      const qs = dateStr ? `?date=${dateStr}` : '';
      return request(`/api/attendance/summary/daily${qs}`);
    },
    manual: (data) =>
      request('/api/attendance/manual', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
  },
};
