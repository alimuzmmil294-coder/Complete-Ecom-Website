import { useEffect, useState } from "react";
import * as orderService from "../../services/orderService";
import { Select, Badge, statusTone, Alert, Card } from "../../components/ui.jsx";

const ORDER_STATUSES = ["PENDING", "PAID", "SHIPPED", "DELIVERED", "CANCELLED"];
const PAYMENT_STATUSES = ["PENDING", "PAID", "FAILED", "REFUNDED"];

const AdminOrders = () => {
  const [orders, setOrders] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState(null);

  const load = async () => {
    setLoading(true);
    try {
      const res = await orderService.getOrders();
      setOrders(res.data);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load orders");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleUpdate = async (orderId, payload) => {
    setError("");
    setSavingId(orderId);
    try {
      await orderService.updateOrderStatus(orderId, payload);
      load();
    } catch (err) {
      setError(err.response?.data?.message || "Could not update order");
    } finally {
      setSavingId(null);
    }
  };

  if (loading) return <p className="p-8 text-gray-500">Loading orders...</p>;

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <h1 className="mb-4 text-2xl font-semibold">All Orders</h1>
      <Alert type="error">{error}</Alert>

      <div className="space-y-3">
        {orders.map((order) => (
          <Card key={order._id}>
            <div className="mb-2 flex items-center justify-between">
              <div>
                <p className="font-medium">Order #{order._id.slice(-8)}</p>
                <p className="text-xs text-gray-500">
                  {new Date(order.createdAt).toLocaleDateString()} · ${order.totalAmount.toFixed(2)}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Badge tone={statusTone(order.orderStatus)}>{order.orderStatus}</Badge>
                <Badge tone={statusTone(order.paymentStatus)}>{order.paymentStatus}</Badge>
              </div>
            </div>
            <div className="flex gap-3 border-t pt-2">
              <div className="text-sm">
                <span className="mr-2 text-gray-500">Order status:</span>
                <Select
                  value={order.orderStatus}
                  disabled={savingId === order._id}
                  onChange={(e) => handleUpdate(order._id, { orderStatus: e.target.value })}
                  className="!w-36"
                >
                  {ORDER_STATUSES.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </Select>
              </div>
              <div className="text-sm">
                <span className="mr-2 text-gray-500">Payment:</span>
                <Select
                  value={order.paymentStatus}
                  disabled={savingId === order._id}
                  onChange={(e) => handleUpdate(order._id, { paymentStatus: e.target.value })}
                  className="!w-36"
                >
                  {PAYMENT_STATUSES.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </Select>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default AdminOrders;
