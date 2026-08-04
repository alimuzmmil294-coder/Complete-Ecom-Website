export const Button = ({ children, variant = "primary", className = "", ...props }) => {
  const base = "rounded-md px-4 py-2 text-sm font-medium transition disabled:opacity-50 disabled:cursor-not-allowed";
  const variants = {
    primary: "bg-brand-600 text-white hover:bg-brand-700",
    secondary: "bg-gray-100 text-gray-800 hover:bg-gray-200",
    danger: "bg-red-600 text-white hover:bg-red-700",
    outline: "border border-gray-300 text-gray-700 hover:bg-gray-50",
  };
  return (
    <button className={`${base} ${variants[variant]} ${className}`} {...props}>
      {children}
    </button>
  );
};

export const Input = ({ label, error, className = "", ...props }) => (
  <label className="block text-sm">
    {label && <span className="mb-1 block font-medium text-gray-700">{label}</span>}
    <input
      className={`w-full rounded-md border px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 ${
        error ? "border-red-400" : "border-gray-300"
      } ${className}`}
      {...props}
    />
    {error && <span className="mt-1 block text-xs text-red-600">{error}</span>}
  </label>
);

export const Select = ({ label, className = "", children, ...props }) => (
  <label className="block text-sm">
    {label && <span className="mb-1 block font-medium text-gray-700">{label}</span>}
    <select
      className={`w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 ${className}`}
      {...props}
    >
      {children}
    </select>
  </label>
);

export const Card = ({ children, className = "" }) => (
  <div className={`rounded-lg border bg-white p-4 shadow-sm ${className}`}>{children}</div>
);

export const Alert = ({ type = "error", children }) => {
  const styles = {
    error: "bg-red-50 text-red-700 border-red-200",
    success: "bg-green-50 text-green-700 border-green-200",
    info: "bg-blue-50 text-blue-700 border-blue-200",
  };
  if (!children) return null;
  return <div className={`mb-4 rounded-md border px-3 py-2 text-sm ${styles[type]}`}>{children}</div>;
};

export const Badge = ({ children, tone = "gray" }) => {
  const tones = {
    gray: "bg-gray-100 text-gray-700",
    green: "bg-green-100 text-green-700",
    yellow: "bg-yellow-100 text-yellow-800",
    red: "bg-red-100 text-red-700",
    blue: "bg-blue-100 text-blue-700",
  };
  return (
    <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${tones[tone]}`}>
      {children}
    </span>
  );
};

export const statusTone = (status) => {
  const map = {
    PENDING: "yellow",
    PAID: "blue",
    SHIPPED: "blue",
    DELIVERED: "green",
    CANCELLED: "red",
    FAILED: "red",
    REFUNDED: "gray",
  };
  return map[status] || "gray";
};
