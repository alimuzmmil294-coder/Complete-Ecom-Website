import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import * as orderService from "../../services/orderService";
import { Button, Badge, statusTone, Alert, Card } from "../../components/ui.jsx";

const CANCELLABLE = ["PENDING", "PAID"];

const OrderDetails = () => {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(false);

  const load = async () => {
    try {
      const res = await orderService.getOrderById(orderId);
      setOrder(res.data);
    } catch (err) {
      setError(err.response?.data?.message || "Order not found");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orderId]);

  const handleCancel = async () => {
    setError("");
    setCancelling(true);
    try {
      await orderService.cancelOrder(orderId);
      load();
    } catch (err) {
      setError(err.response?.data?.message || "Could not cancel order");
    } finally {
      setCancelling(false);
    }
  };

  if (loading) return <p className="p-8 text-gray-500">Loading...</p>;
  if (error && !order) return <div className="p-8"><Alert type="error">{error}</Alert></div>;
  if (!order) return null;

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <Button variant="outline" className="mb-4" onClick={() => navigate(-1)}>
        ← Back
      </Button>

      <Alert type="error">{error}</Alert>

      <Card>
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold">Order #{order._id.slice(-8)}</h1>
            <p className="text-sm text-gray-500">
              Placed {new Date(order.createdAt).toLocaleString()}
            </p>
          </div>
          <div className="flex gap-2">
            <Badge tone={statusTone(order.orderStatus)}>{order.orderStatus}</Badge>
            <Badge tone={statusTone(order.paymentStatus)}>{order.paymentStatus}</Badge>
          </div>
        </div>

        <div className="space-y-2 border-t pt-3">
          {order.items.map((item) => (
            <div key={item._id} className="flex items-center justify-between text-sm">
              <span>
                {item.name} × {item.quantity}
              </span>
              <div className="flex items-center gap-2">
                <Badge tone={statusTone(item.itemStatus)}>{item.itemStatus}</Badge>
                <span>${item.subtotal.toFixed(2)}</span>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-3 flex justify-between border-t pt-3 font-semibold">
          <span>Total</span>
          <span>${order.totalAmount.toFixed(2)}</span>
        </div>

        <div className="mt-4 rounded bg-gray-50 p-3 text-sm text-gray-600">
          <p className="font-medium text-gray-800">Shipping to:</p>
          <p>{order.shippingAddress.fullName} · {order.shippingAddress.phone}</p>
          <p>
            {order.shippingAddress.addressLine1}
            {order.shippingAddress.addressLine2 ? `, ${order.shippingAddress.addressLine2}` : ""}
          </p>
          <p>
            {order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.postalCode}
          </p>
          <p>{order.shippingAddress.country}</p>
        </div>

        {CANCELLABLE.includes(order.orderStatus) && (
          <Button variant="danger" className="mt-4" onClick={handleCancel} disabled={cancelling}>
            {cancelling ? "Cancelling..." : "Cancel order"}
          </Button>
        )}
      </Card>
    </div>
  );
};

export default OrderDetails;
