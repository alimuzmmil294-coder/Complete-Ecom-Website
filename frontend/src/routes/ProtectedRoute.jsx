import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

/**
 * Gates a route behind authentication and (optionally) specific roles.
 *
 * This is UI/navigation protection only — the backend remains the real
 * authorization boundary. This component just prevents rendering a page
 * the user has no route to before the API rejects the underlying requests.
 *
 * Crucially, it waits for `loading` to resolve before redirecting, so a
 * logged-in user is never bounced to /login during the initial /auth/me check.
 */
const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center text-gray-500">
        Loading...
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/unauthorized" replace />;
  }

  return children;
};

export default ProtectedRoute;
