import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import * as orderService from "../../services/orderService";
import { Badge, statusTone, Alert, Card } from "../../components/ui.jsx";

const OrderHistory = () => {
  const [orders, setOrders] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await orderService.getOrders();
        setOrders(res.data);
      } catch (err) {
        setError(err.response?.data?.message || "Failed to load orders");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  if (loading) return <p className="p-8 text-gray-500">Loading orders...</p>;

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="mb-4 text-2xl font-semibold">My Orders</h1>
      <Alert type="error">{error}</Alert>

      {orders.length === 0 ? (
        <p className="text-gray-500">You haven't placed any orders yet.</p>
      ) : (
        <div className="space-y-3">
          {orders.map((order) => (
            <Link key={order._id} to={`/buyer/orders/${order._id}`}>
              <Card className="flex items-center justify-between hover:border-brand-300">
                <div>
                  <p className="font-medium">Order #{order._id.slice(-8)}</p>
                  <p className="text-sm text-gray-500">
                    {new Date(order.createdAt).toLocaleDateString()} · {order.items.length} item(s)
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <Badge tone={statusTone(order.orderStatus)}>{order.orderStatus}</Badge>
                  <span className="font-semibold">${order.totalAmount.toFixed(2)}</span>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};

export default OrderHistory;
