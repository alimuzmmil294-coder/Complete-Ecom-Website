import axios from "axios";

// withCredentials is required so the browser sends the HTTP-only "token"
// cookie with every request. The JWT is never touched directly in JS —
// there is nothing to store in localStorage.
const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || "/api/v1",
  withCredentials: true,
});

export default api;
