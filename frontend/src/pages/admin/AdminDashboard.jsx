import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import * as userService from "../../services/userService";
import * as productService from "../../services/productService";
import * as orderService from "../../services/orderService";
import { Card, Alert } from "../../components/ui.jsx";

const AdminDashboard = () => {
  const [stats, setStats] = useState({ users: 0, products: 0, orders: 0 });
  const [error, setError] = useState("");

  useEffect(() => {
    const load = async () => {
      try {
        const [usersRes, productsRes, ordersRes] = await Promise.all([
          userService.getUsers("all"),
          productService.getProducts({ limit: 100 }),
          orderService.getOrders(),
        ]);
        setStats({
          users: usersRes.count,
          products: productsRes.total,
          orders: ordersRes.count,
        });
      } catch (err) {
        setError(err.response?.data?.message || "Failed to load dashboard");
      }
    };
    load();
  }, []);

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <h1 className="mb-6 text-2xl font-semibold">Admin Dashboard</h1>
      <Alert type="error">{error}</Alert>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card>
          <p className="text-sm text-gray-500">Total Users</p>
          <p className="mt-1 text-3xl font-bold">{stats.users}</p>
          <Link to="/admin/users" className="mt-2 inline-block text-sm text-brand-600">
            Manage users →
          </Link>
        </Card>
        <Card>
          <p className="text-sm text-gray-500">Total Products</p>
          <p className="mt-1 text-3xl font-bold">{stats.products}</p>
          <Link to="/admin/products" className="mt-2 inline-block text-sm text-brand-600">
            Manage products →
          </Link>
        </Card>
        <Card>
          <p className="text-sm text-gray-500">Total Orders</p>
          <p className="mt-1 text-3xl font-bold">{stats.orders}</p>
          <Link to="/admin/orders" className="mt-2 inline-block text-sm text-brand-600">
            Manage orders →
          </Link>
        </Card>
      </div>
    </div>
  );
};

export default AdminDashboard;
