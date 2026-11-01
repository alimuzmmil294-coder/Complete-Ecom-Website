import { createContext, useContext, useEffect, useState, useCallback, useMemo } from "react";
import * as cartService from "../services/cartService";
import { useAuth } from "./AuthContext.jsx";

const CartContext = createContext(null);

const emptyCart = { items: [], cartTotal: 0 };

export const CartProvider = ({ children }) => {
  const { user } = useAuth();
  const [cart, setCart] = useState(emptyCart);
  const [loading, setLoading] = useState(false);

  const isBuyer = user?.role === "BUYER";

  const refreshCart = useCallback(
    async (silent = false) => {
      if (!isBuyer) {
        setCart(emptyCart);
        return;
      }
      if (!silent) setLoading(true);
      try {
        const res = await cartService.getCart();
        setCart(res.data || emptyCart);
      } catch (err) {
        if (err.response?.status === 401 || err.response?.status === 403) {
          setCart(emptyCart);
        }
      } finally {
        if (!silent) setLoading(false);
      }
    },
    [isBuyer]
  );

  useEffect(() => {
    if (isBuyer) {
      refreshCart(false);
    } else {
      setCart(emptyCart);
    }
  }, [isBuyer, refreshCart]);

  const cartCount = useMemo(() => {
    if (!cart.items || !Array.isArray(cart.items)) return 0;
    return cart.items.reduce((acc, item) => acc + (Number(item.quantity) || 0), 0);
  }, [cart.items]);

  const addToCart = async (productId, quantity = 1) => {
    const res = await cartService.addToCart(productId, quantity);
    await refreshCart(true);
    return res;
  };

  const updateQuantity = async (productId, quantity) => {
    const prevCart = cart;
    const numQty = Number(quantity);

    // Optimistic UI update
    if (numQty <= 0) {
      const filtered = (cart.items || []).filter((i) => i.product !== productId);
      const newTotal = filtered.reduce((acc, i) => acc + (i.subtotal || 0), 0);
      setCart({ ...cart, items: filtered, cartTotal: Math.round(newTotal * 100) / 100 });
    } else {
      const updatedItems = (cart.items || []).map((i) => {
        if (i.product === productId) {
          const subtotal = Math.round(Number(i.price) * numQty * 100) / 100;
          return { ...i, quantity: numQty, subtotal };
        }
        return i;
      });
      const newTotal = updatedItems.reduce((acc, i) => acc + (i.subtotal || 0), 0);
      setCart({ ...cart, items: updatedItems, cartTotal: Math.round(newTotal * 100) / 100 });
    }

    try {
      if (numQty <= 0) {
        await cartService.removeCartItem(productId);
      } else {
        await cartService.updateCartItem(productId, numQty);
      }
      await refreshCart(true);
    } catch (err) {
      setCart(prevCart);
      throw err;
    }
  };

  const removeFromCart = async (productId) => {
    const prevCart = cart;

    // Optimistic UI update
    const filtered = (cart.items || []).filter((i) => i.product !== productId);
    const newTotal = filtered.reduce((acc, i) => acc + (i.subtotal || 0), 0);
    setCart({ ...cart, items: filtered, cartTotal: Math.round(newTotal * 100) / 100 });

    try {
      await cartService.removeCartItem(productId);
      await refreshCart(true);
    } catch (err) {
      setCart(prevCart);
      throw err;
    }
  };

  const clearCart = async () => {
    setCart(emptyCart);
    try {
      await cartService.clearCart();
    } catch (err) {
      await refreshCart(true);
      throw err;
    }
  };

  return (
    <CartContext.Provider
      value={{
        cart,
        cartCount,
        loading,
        refreshCart,
        addToCart,
        updateQuantity,
        removeFromCart,
        clearCart,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within a CartProvider");
  return ctx;
};
