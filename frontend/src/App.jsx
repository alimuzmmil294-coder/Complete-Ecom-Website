import { Routes, Route, Navigate } from "react-router-dom";
import Navbar from "./components/Navbar.jsx";
import ProtectedRoute from "./routes/ProtectedRoute.jsx";
import { useAuth } from "./context/AuthContext.jsx";

import Home from "./pages/Home.jsx";
import Profile from "./pages/Profile.jsx";
import { Unauthorized, NotFound } from "./pages/StatusPages.jsx";

import Login from "./pages/auth/Login.jsx";
import Signup from "./pages/auth/Signup.jsx";

import ProductCatalog from "./pages/buyer/ProductCatalog.jsx";
import ProductDetails from "./pages/buyer/ProductDetails.jsx";
import Cart from "./pages/buyer/Cart.jsx";
import Checkout from "./pages/buyer/Checkout.jsx";
import OrderHistory from "./pages/buyer/OrderHistory.jsx";
import OrderDetails from "./pages/buyer/OrderDetails.jsx";

import SellerDashboard from "./pages/seller/SellerDashboard.jsx";
import MyProducts from "./pages/seller/MyProducts.jsx";
import ProductForm from "./pages/seller/ProductForm.jsx";
import SellerOrders from "./pages/seller/SellerOrders.jsx";

import AdminDashboard from "./pages/admin/AdminDashboard.jsx";
import AdminUsers from "./pages/admin/AdminUsers.jsx";
import AdminProducts from "./pages/admin/AdminProducts.jsx";
import AdminOrders from "./pages/admin/AdminOrders.jsx";

const roleHome = {
  BUYER: "/buyer/products",
  SELLER: "/seller/dashboard",
  ADMIN: "/admin/dashboard",
};

// Sends an already-authenticated user straight to their dashboard instead
// of showing the public landing / login / signup pages.
const RedirectIfAuthed = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (user) return <Navigate to={roleHome[user.role] || "/"} replace />;
  return children;
};

function App() {
  return (
    <>
      <Navbar />
      <Routes>
        <Route path="/" element={<RedirectIfAuthed><Home /></RedirectIfAuthed>} />
        <Route path="/login" element={<RedirectIfAuthed><Login /></RedirectIfAuthed>} />
        <Route path="/signup" element={<RedirectIfAuthed><Signup /></RedirectIfAuthed>} />
        <Route path="/unauthorized" element={<Unauthorized />} />

        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <Profile />
            </ProtectedRoute>
          }
        />

        {/* Buyer routes */}
        <Route
          path="/buyer/products"
          element={
            <ProtectedRoute allowedRoles={["BUYER"]}>
              <ProductCatalog />
            </ProtectedRoute>
          }
        />
        <Route
          path="/buyer/products/:productId"
          element={
            <ProtectedRoute allowedRoles={["BUYER"]}>
              <ProductDetails />
            </ProtectedRoute>
          }
        />
        <Route
          path="/buyer/cart"
          element={
            <ProtectedRoute allowedRoles={["BUYER"]}>
              <Cart />
            </ProtectedRoute>
          }
        />
        <Route
          path="/buyer/checkout"
          element={
            <ProtectedRoute allowedRoles={["BUYER"]}>
              <Checkout />
            </ProtectedRoute>
          }
        />
        <Route
          path="/buyer/orders"
          element={
            <ProtectedRoute allowedRoles={["BUYER"]}>
              <OrderHistory />
            </ProtectedRoute>
          }
        />
        <Route
          path="/buyer/orders/:orderId"
          element={
            <ProtectedRoute allowedRoles={["BUYER"]}>
              <OrderDetails />
            </ProtectedRoute>
          }
        />

        {/* Seller routes */}
        <Route
          path="/seller/dashboard"
          element={
            <ProtectedRoute allowedRoles={["SELLER"]}>
              <SellerDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/seller/products"
          element={
            <ProtectedRoute allowedRoles={["SELLER"]}>
              <MyProducts />
            </ProtectedRoute>
          }
        />
        <Route
          path="/seller/products/new"
          element={
            <ProtectedRoute allowedRoles={["SELLER"]}>
              <ProductForm />
            </ProtectedRoute>
          }
        />
        <Route
          path="/seller/products/:productId/edit"
          element={
            <ProtectedRoute allowedRoles={["SELLER"]}>
              <ProductForm />
            </ProtectedRoute>
          }
        />
        <Route
          path="/seller/orders"
          element={
            <ProtectedRoute allowedRoles={["SELLER"]}>
              <SellerOrders />
            </ProtectedRoute>
          }
        />

        {/* Admin routes */}
        <Route
          path="/admin/dashboard"
          element={
            <ProtectedRoute allowedRoles={["ADMIN"]}>
              <AdminDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/users"
          element={
            <ProtectedRoute allowedRoles={["ADMIN"]}>
              <AdminUsers />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/products"
          element={
            <ProtectedRoute allowedRoles={["ADMIN"]}>
              <AdminProducts />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/orders"
          element={
            <ProtectedRoute allowedRoles={["ADMIN"]}>
              <AdminOrders />
            </ProtectedRoute>
          }
        />

        <Route path="*" element={<NotFound />} />
      </Routes>
    </>
  );
}

export default App;
