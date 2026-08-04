import api from "./api";

export const signup = (payload) => api.post("/auth/signup", payload).then((res) => res.data);
export const login = (payload) => api.post("/auth/login", payload).then((res) => res.data);
export const logout = () => api.post("/auth/logout").then((res) => res.data);
export const fetchMe = () => api.get("/auth/me").then((res) => res.data);
export const updateMyProfile = (payload) => api.put("/users/me", payload).then((res) => res.data);
