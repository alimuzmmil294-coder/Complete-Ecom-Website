import api from "./api";

export const getCart = () => api.get("/cart").then((res) => res.data);

export const addToCart = (productId, quantity) =>
  api.post("/cart/add", { productId, quantity }).then((res) => res.data);

export const removeCartItem = (productId) =>
  api.delete(`/cart/item/${productId}`).then((res) => res.data);

export const clearCart = () => api.delete("/cart/clear").then((res) => res.data);
