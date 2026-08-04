import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import * as productService from "../../services/productService";
import * as orderService from "../../services/orderService";
import { Card, Alert } from "../../components/ui.jsx";
import { useAuth } from "../../context/AuthContext.jsx";

const SellerDashboard = () => {
  const { user } = useAuth();
  const [productCount, setProductCount] = useState(0);
  const [lowStockCount, setLowStockCount] = useState(0);
  const [orderCount, setOrderCount] = useState(0);
  const [error, setError] = useState("");

  useEffect(() => {
    const load = async () => {
      try {
        const [productsRes, ordersRes] = await Promise.all([
          productService.getProducts({ limit: 100 }),
          orderService.getOrders(),
        ]);
        setProductCount(productsRes.total);
        setLowStockCount(productsRes.data.filter((p) => p.stock <= 5).length);
        setOrderCount(ordersRes.count);
      } catch (err) {
        setError(err.response?.data?.message || "Failed to load dashboard");
      }
    };
    load();
  }, []);

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <h1 className="mb-1 text-2xl font-semibold">Welcome back, {user?.shopName || user?.username}</h1>
      <p className="mb-6 text-gray-500">Here's how your shop is doing.</p>
      <Alert type="error">{error}</Alert>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card>
          <p className="text-sm text-gray-500">Products</p>
          <p className="mt-1 text-3xl font-bold">{productCount}</p>
          <Link to="/seller/products" className="mt-2 inline-block text-sm text-brand-600">
            Manage products →
          </Link>
        </Card>
        <Card>
          <p className="text-sm text-gray-500">Low stock (≤ 5)</p>
          <p className="mt-1 text-3xl font-bold">{lowStockCount}</p>
        </Card>
        <Card>
          <p className="text-sm text-gray-500">Orders with your items</p>
          <p className="mt-1 text-3xl font-bold">{orderCount}</p>
          <Link to="/seller/orders" className="mt-2 inline-block text-sm text-brand-600">
            View orders →
          </Link>
        </Card>
      </div>
    </div>
  );
};

export default SellerDashboard;
