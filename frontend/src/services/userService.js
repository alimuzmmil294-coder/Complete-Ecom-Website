import api from "./api";

export const getUsers = (userStatus = "all") =>
  api.get("/users", { params: { userStatus } }).then((res) => res.data);

export const createUser = (payload) => api.post("/users", payload).then((res) => res.data);

export const updateUser = (userId, payload) =>
  api.put(`/users/${userId}`, payload).then((res) => res.data);

export const deleteUser = (userId) => api.delete(`/users/${userId}`).then((res) => res.data);
