import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import * as cartService from "../../services/cartService";
import { Button, Alert, Card } from "../../components/ui.jsx";

const Cart = () => {
  const [cart, setCart] = useState({ items: [], cartTotal: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const load = async () => {
    setLoading(true);
    try {
      const res = await cartService.getCart();
      setCart(res.data);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load cart");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleRemove = async (productId) => {
    setError("");
    try {
      await cartService.removeCartItem(productId);
      load();
    } catch (err) {
      setError(err.response?.data?.message || "Could not remove item");
    }
  };

  const handleClear = async () => {
    setError("");
    try {
      await cartService.clearCart();
      load();
    } catch (err) {
      setError(err.response?.data?.message || "Could not clear cart");
    }
  };

  if (loading) return <p className="p-8 text-gray-500">Loading cart...</p>;

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="mb-4 text-2xl font-semibold">Your Cart</h1>
      <Alert type="error">{error}</Alert>

      {cart.items.length === 0 ? (
        <Card>
          <p className="text-gray-500">Your cart is empty.</p>
          <Link to="/buyer/products">
            <Button className="mt-4">Browse products</Button>
          </Link>
        </Card>
      ) : (
        <>
          <div className="space-y-3">
            {cart.items.map((item) => (
              <Card key={item.product} className="flex items-center justify-between">
                <div>
                  <p className="font-medium">{item.name}</p>
                  <p className="text-sm text-gray-500">
                    {item.quantity} × ${item.price?.toFixed(2)}
                  </p>
                </div>
                <div className="flex items-center gap-4">
                  <span className="font-semibold">${item.subtotal?.toFixed(2)}</span>
                  <Button variant="danger" onClick={() => handleRemove(item.product)}>
                    Remove
                  </Button>
                </div>
              </Card>
            ))}
          </div>

          <Card className="mt-4 flex items-center justify-between">
            <span className="text-lg font-semibold">Total: ${cart.cartTotal?.toFixed(2)}</span>
            <div className="flex gap-3">
              <Button variant="outline" onClick={handleClear}>
                Clear cart
              </Button>
              <Button onClick={() => navigate("/buyer/checkout")}>Checkout</Button>
            </div>
          </Card>
        </>
      )}
    </div>
  );
};

export default Cart;
