import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

const roleHome = {
  BUYER: "/buyer/products",
  SELLER: "/seller/dashboard",
  ADMIN: "/admin/dashboard",
};

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  return (
    <nav className="border-b bg-white">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        <Link to={user ? roleHome[user.role] : "/"} className="text-lg font-bold text-brand-600">
          MarketPlace
        </Link>

        <div className="flex items-center gap-4 text-sm">
          {user?.role === "BUYER" && (
            <>
              <Link to="/buyer/products" className="hover:text-brand-600">Shop</Link>
              <Link to="/buyer/cart" className="hover:text-brand-600">Cart</Link>
              <Link to="/buyer/orders" className="hover:text-brand-600">Orders</Link>
            </>
          )}

          {user?.role === "SELLER" && (
            <>
              <Link to="/seller/dashboard" className="hover:text-brand-600">Dashboard</Link>
              <Link to="/seller/products" className="hover:text-brand-600">My Products</Link>
              <Link to="/seller/orders" className="hover:text-brand-600">Orders</Link>
            </>
          )}

          {user?.role === "ADMIN" && (
            <>
              <Link to="/admin/dashboard" className="hover:text-brand-600">Dashboard</Link>
              <Link to="/admin/users" className="hover:text-brand-600">Users</Link>
              <Link to="/admin/products" className="hover:text-brand-600">Products</Link>
              <Link to="/admin/orders" className="hover:text-brand-600">Orders</Link>
            </>
          )}

          {user && (
            <>
              <Link to="/profile" className="hover:text-brand-600">
                {user.username}
              </Link>
              <button
                onClick={handleLogout}
                className="rounded bg-gray-100 px-3 py-1.5 text-gray-700 hover:bg-gray-200"
              >
                Logout
              </button>
            </>
          )}

          {!user && (
            <>
              <Link to="/login" className="hover:text-brand-600">Login</Link>
              <Link
                to="/signup"
                className="rounded bg-brand-600 px-3 py-1.5 text-white hover:bg-brand-700"
              >
                Sign up
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
