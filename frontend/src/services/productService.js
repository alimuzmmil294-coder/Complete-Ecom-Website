import api from "./api";

export const getProducts = (params = {}) =>
  api.get("/products", { params }).then((res) => res.data);

export const getProductById = (productId) =>
  api.get(`/products/${productId}`).then((res) => res.data);

export const createProduct = (payload) =>
  api.post("/products", payload).then((res) => res.data);

export const updateProduct = (productId, payload) =>
  api.put(`/products/${productId}`, payload).then((res) => res.data);

export const deleteProduct = (productId) =>
  api.delete(`/products/${productId}`).then((res) => res.data);
