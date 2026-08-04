import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import * as cartService from "../../services/cartService";
import * as orderService from "../../services/orderService";
import { Button, Input, Alert, Card } from "../../components/ui.jsx";

const emptyAddress = {
  fullName: "",
  phone: "",
  addressLine1: "",
  addressLine2: "",
  city: "",
  state: "",
  postalCode: "",
  country: "",
};

const Checkout = () => {
  const [cart, setCart] = useState({ items: [], cartTotal: 0 });
  const [address, setAddress] = useState(emptyAddress);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const load = async () => {
      try {
        const res = await cartService.getCart();
        setCart(res.data);
      } catch (err) {
        setError(err.response?.data?.message || "Failed to load cart");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const handleChange = (e) => setAddress({ ...address, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      const res = await orderService.createOrder({
        shippingAddress: address,
        paymentMethod: "COD",
      });
      navigate(`/buyer/orders/${res.data._id}`, { replace: true });
    } catch (err) {
      setError(err.response?.data?.message || "Checkout failed");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <p className="p-8 text-gray-500">Loading...</p>;

  if (cart.items.length === 0) {
    return (
      <div className="mx-auto max-w-xl px-4 py-8">
        <Alert type="info">Your cart is empty. Add products before checking out.</Alert>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <h1 className="mb-4 text-2xl font-semibold">Checkout</h1>
      <Alert type="error">{error}</Alert>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <Card>
          <h2 className="mb-3 font-medium">Shipping address</h2>
          <form id="checkout-form" onSubmit={handleSubmit} className="space-y-3">
            <Input label="Full name" name="fullName" value={address.fullName} onChange={handleChange} required />
            <Input label="Phone" name="phone" value={address.phone} onChange={handleChange} required />
            <Input
              label="Address line 1"
              name="addressLine1"
              value={address.addressLine1}
              onChange={handleChange}
              required
            />
            <Input
              label="Address line 2 (optional)"
              name="addressLine2"
              value={address.addressLine2}
              onChange={handleChange}
            />
            <div className="grid grid-cols-2 gap-3">
              <Input label="City" name="city" value={address.city} onChange={handleChange} required />
              <Input label="State" name="state" value={address.state} onChange={handleChange} required />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Input
                label="Postal code"
                name="postalCode"
                value={address.postalCode}
                onChange={handleChange}
                required
              />
              <Input label="Country" name="country" value={address.country} onChange={handleChange} required />
            </div>
          </form>
        </Card>

        <Card>
          <h2 className="mb-3 font-medium">Order summary</h2>
          <div className="space-y-2">
            {cart.items.map((item) => (
              <div key={item.product} className="flex justify-between text-sm">
                <span>
                  {item.name} × {item.quantity}
                </span>
                <span>${item.subtotal?.toFixed(2)}</span>
              </div>
            ))}
          </div>
          <div className="mt-3 flex justify-between border-t pt-3 font-semibold">
            <span>Total</span>
            <span>${cart.cartTotal?.toFixed(2)}</span>
          </div>
          <p className="mt-2 text-xs text-gray-500">Payment method: Cash on Delivery</p>
          <Button
            form="checkout-form"
            type="submit"
            className="mt-4 w-full"
            disabled={submitting}
          >
            {submitting ? "Placing order..." : "Place order"}
          </Button>
        </Card>
      </div>
    </div>
  );
};

export default Checkout;
