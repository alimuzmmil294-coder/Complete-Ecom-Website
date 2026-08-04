import { Link } from "react-router-dom";

export const Unauthorized = () => (
  <div className="flex min-h-[calc(100vh-57px)] flex-col items-center justify-center px-4 text-center">
    <h1 className="text-2xl font-bold">403 — Not authorized</h1>
    <p className="mt-2 text-gray-600">You don't have permission to view this page.</p>
    <Link to="/" className="mt-4 text-brand-600">
      Go home
    </Link>
  </div>
);

export const NotFound = () => (
  <div className="flex min-h-[calc(100vh-57px)] flex-col items-center justify-center px-4 text-center">
    <h1 className="text-2xl font-bold">404 — Page not found</h1>
    <Link to="/" className="mt-4 text-brand-600">
      Go home
    </Link>
  </div>
);
