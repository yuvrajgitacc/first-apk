// Use Render Backend for Production (APK/Deployment), Localhost for Development
// Forcing Render Backend even in Development to test the live connection
export const API_URL = "https://flow-state-focus-9ufp.onrender.com";

export const authFetch = async (endpoint: string, options: RequestInit = {}) => {
  const token = localStorage.getItem("authToken");
  
  const headers = new Headers(options.headers || {});
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }
  
  const config = {
    ...options,
    headers,
  };
  
  const res = await fetch(`${API_URL}${endpoint}`, config);
  if (res.status === 401) {
    // Handle unauthorized - potentially clear token and redirect to login
    localStorage.removeItem("authToken");
    localStorage.removeItem("currentUser");
    window.location.href = '/login';
  }
  return res;
};

