const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:2000";

const getHeaders = (isMultipart = false) => {
  const token = localStorage.getItem("token");
  const headers = {};
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }
  if (!isMultipart) {
    headers["Content-Type"] = "application/json";
  }
  return headers;
};

export const api = {
  // Auth API
  async login(username, password) {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.detail || "Login failed");
    }
    const data = await res.json();
    localStorage.setItem("token", data.access_token);
    localStorage.setItem("username", data.username);
    localStorage.setItem("role", data.role);
    return data;
  },

  async adminCreateStudent(username, email, password) {
    const res = await fetch(`${API_BASE}/admin/students`, {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify({ username, email, password }),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.detail || "Failed to create student account");
    }
    return await res.json();
  },

  logout() {
    localStorage.removeItem("token");
    localStorage.removeItem("username");
    localStorage.removeItem("role");
  },

  async getMe() {
    const res = await fetch(`${API_BASE}/auth/me`, {
      headers: getHeaders(),
    });
    if (!res.ok) {
      throw new Error("Failed to fetch user profile");
    }
    return await res.json();
  },

  // Domains API
  async getDomains() {
    const res = await fetch(`${API_BASE}/domains`, {
      headers: getHeaders(),
    });
    if (!res.ok) {
      throw new Error("Failed to load training domains");
    }
    return await res.json();
  },

  async createDomain(name, description) {
    const res = await fetch(`${API_BASE}/domains`, {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify({ name, description }),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.detail || "Failed to create domain");
    }
    return await res.json();
  },

  // Daily Updates API
  async createDailyUpdate(formData) {
    const res = await fetch(`${API_BASE}/updates/daily`, {
      method: "POST",
      headers: getHeaders(true), // Let browser set boundary automatically
      body: formData,
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.detail || "Failed to submit training update");
    }
    return await res.json();
  },

  async updateDailyUpdate(updateId, formData) {
    const res = await fetch(`${API_BASE}/updates/daily/${updateId}`, {
      method: "PUT",
      headers: getHeaders(true),
      body: formData,
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.detail || "Failed to update daily log");
    }
    return await res.json();
  },

  async deleteDailyUpdate(updateId) {
    const res = await fetch(`${API_BASE}/updates/daily/${updateId}`, {
      method: "DELETE",
      headers: getHeaders(),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.detail || "Failed to delete daily log");
    }
    return await res.json();
  },

  async getDailyUpdates() {
    const res = await fetch(`${API_BASE}/updates/daily`, {
      headers: getHeaders(),
    });
    if (!res.ok) {
      throw new Error("Failed to load your daily updates");
    }
    return await res.json();
  },

  // Admin API
  async getAdminUpdates({ studentId, domainId, startDate, endDate } = {}) {
    let url = `${API_BASE}/updates/admin/all?`;
    if (studentId) url += `student_id=${studentId}&`;
    if (domainId) url += `domain_id=${domainId}&`;
    if (startDate) url += `start_date=${startDate}&`;
    if (endDate) url += `end_date=${endDate}&`;

    const res = await fetch(url, {
      headers: getHeaders(),
    });
    if (!res.ok) {
      throw new Error("Failed to load admin updates log");
    }
    return await res.json();
  },

  async getStudents() {
    const res = await fetch(`${API_BASE}/admin/students`, {
      headers: getHeaders(),
    });
    if (!res.ok) {
      throw new Error("Failed to load student accounts");
    }
    return await res.json();
  },

  // Reports API
  async getMonthlyReport(month, studentId = null, startDate = null, endDate = null) {
    let url = `${API_BASE}/reports/monthly?`;
    if (month) url += `month=${month}&`;
    if (startDate) url += `start_date=${startDate}&`;
    if (endDate) url += `end_date=${endDate}&`;
    if (studentId) url += `student_id=${studentId}&`;

    const res = await fetch(url, {
      headers: getHeaders(),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.detail || "Failed to load monthly report");
    }
    return await res.json();
  },

  getFileUrl(urlPath) {
    if (!urlPath) return null;
    return `${API_BASE}${urlPath}`;
  },
};
