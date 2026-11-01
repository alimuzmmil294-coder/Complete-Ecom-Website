import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useCart } from "../../context/CartContext.jsx";
import { Button, Alert, Card, ProductImage } from "../../components/ui.jsx";

const Cart = () => {
  const { cart, loading, updateQuantity, removeFromCart, clearCart } = useCart();
  const [error, setError] = useState("");
  const [actionInProgress, setActionInProgress] = useState(null);
  const navigate = useNavigate();

  const handleQuantityChange = async (productId, currentQuantity, delta) => {
    const newQuantity = currentQuantity + delta;
    setError("");
    setActionInProgress(productId);
    try {
      if (newQuantity <= 0) {
        await removeFromCart(productId);
      } else {
        await updateQuantity(productId, newQuantity);
      }
    } catch (err) {
      setError(err.response?.data?.message || "Could not update quantity");
    } finally {
      setActionInProgress(null);
    }
  };

  const handleRemove = async (productId) => {
    setError("");
    setActionInProgress(productId);
    try {
      await removeFromCart(productId);
    } catch (err) {
      setError(err.response?.data?.message || "Could not remove item");
    } finally {
      setActionInProgress(null);
    }
  };

  const handleClear = async () => {
    if (!window.confirm("Are you sure you want to clear your cart?")) return;
    setError("");
    try {
      await clearCart();
    } catch (err) {
      setError(err.response?.data?.message || "Could not clear cart");
    }
  };

  if (loading && (!cart.items || cart.items.length === 0)) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-8">
        <p className="text-gray-500">Loading your cart...</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="mb-4 text-2xl font-semibold">Your Cart</h1>
      <Alert type="error">{error}</Alert>

      {!cart.items || cart.items.length === 0 ? (
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
              <Card key={item.product} className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="h-16 w-16 overflow-hidden rounded bg-gray-100">
                    <ProductImage
                      src={item.image}
                      alt={item.name}
                      className="h-16 w-16 rounded object-cover"
                    />
                  </div>
                  <div>
                    <Link
                      to={`/buyer/products/${item.product}`}
                      className="font-medium hover:text-brand-600"
                    >
                      {item.name}
                    </Link>
                    <p className="text-sm text-gray-500">${item.price?.toFixed(2)} each</p>
                  </div>
                </div>

                <div className="flex items-center gap-6">
                  {/* Quantity Stepper */}
                  <div className="flex items-center rounded border border-gray-200">
                    <button
                      type="button"
                      disabled={actionInProgress === item.product}
                      onClick={() => handleQuantityChange(item.product, item.quantity, -1)}
                      className="px-2.5 py-1 text-sm font-semibold text-gray-600 hover:bg-gray-100 disabled:opacity-50"
                      aria-label="Decrease quantity"
                    >
                      −
                    </button>
                    <span className="min-w-[28px] text-center text-sm font-medium text-gray-800">
                      {item.quantity}
                    </span>
                    <button
                      type="button"
                      disabled={actionInProgress === item.product || item.quantity >= item.stock}
                      onClick={() => handleQuantityChange(item.product, item.quantity, 1)}
                      className="px-2.5 py-1 text-sm font-semibold text-gray-600 hover:bg-gray-100 disabled:opacity-50"
                      aria-label="Increase quantity"
                    >
                      +
                    </button>
                  </div>

                  <span className="min-w-[70px] text-right font-semibold">
                    ${item.subtotal?.toFixed(2)}
                  </span>

                  <Button
                    variant="danger"
                    disabled={actionInProgress === item.product}
                    onClick={() => handleRemove(item.product)}
                  >
                    Remove
                  </Button>
                </div>
              </Card>
            ))}
          </div>

          <Card className="mt-4 flex flex-wrap items-center justify-between gap-3">
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
