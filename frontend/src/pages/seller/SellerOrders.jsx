import { useEffect, useState } from "react";
import * as orderService from "../../services/orderService";
import { Button, Select, Badge, statusTone, Alert, Card } from "../../components/ui.jsx";

const ITEM_STATUSES = ["PENDING", "SHIPPED", "DELIVERED", "CANCELLED"];

const SellerOrders = () => {
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

  const handleStatusChange = async (orderId, itemStatus) => {
    setError("");
    setSavingId(orderId);
    try {
      await orderService.updateOrderStatus(orderId, { itemStatus });
      load();
    } catch (err) {
      setError(err.response?.data?.message || "Could not update status");
    } finally {
      setSavingId(null);
    }
  };

  if (loading) return <p className="p-8 text-gray-500">Loading orders...</p>;

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <h1 className="mb-4 text-2xl font-semibold">Orders</h1>
      <Alert type="error">{error}</Alert>

      {orders.length === 0 ? (
        <p className="text-gray-500">No orders yet for your products.</p>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <Card key={order._id}>
              <div className="mb-2 flex items-center justify-between">
                <p className="font-medium">Order #{order._id.slice(-8)}</p>
                <span className="text-xs text-gray-500">
                  {new Date(order.createdAt).toLocaleDateString()}
                </span>
              </div>
              <div className="space-y-2 border-t pt-2">
                {order.items.map((item) => (
                  <div key={item._id} className="flex items-center justify-between text-sm">
                    <span>
                      {item.name} × {item.quantity} — ${item.subtotal.toFixed(2)}
                    </span>
                    <div className="flex items-center gap-2">
                      <Badge tone={statusTone(item.itemStatus)}>{item.itemStatus}</Badge>
                      <Select
                        value={item.itemStatus}
                        disabled={savingId === order._id}
                        onChange={(e) => handleStatusChange(order._id, e.target.value)}
                        className="!w-32"
                      >
                        {ITEM_STATUSES.map((s) => (
                          <option key={s} value={s}>
                            {s}
                          </option>
                        ))}
                      </Select>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default SellerOrders;
