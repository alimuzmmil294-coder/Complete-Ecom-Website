import api from "./api";

export const createOrder = (payload) => api.post("/orders", payload).then((res) => res.data);

export const getOrders = () => api.get("/orders").then((res) => res.data);

export const getOrderById = (orderId) => api.get(`/orders/${orderId}`).then((res) => res.data);

export const updateOrderStatus = (orderId, payload) =>
  api.put(`/orders/${orderId}/status`, payload).then((res) => res.data);

export const cancelOrder = (orderId) =>
  api.post(`/orders/${orderId}/cancel`).then((res) => res.data);
