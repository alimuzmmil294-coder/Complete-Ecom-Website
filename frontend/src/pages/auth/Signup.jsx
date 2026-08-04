import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext.jsx";
import { Button, Input, Select, Alert, Card } from "../../components/ui.jsx";

const roleHome = {
  BUYER: "/buyer/products",
  SELLER: "/seller/dashboard",
};

const Signup = () => {
  const { signup } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    username: "",
    email: "",
    password: "",
    role: "BUYER",
    shopName: "",
  });
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      const user = await signup({ ...form, authProvider: "LOCAL" });
      navigate(roleHome[user.role] || "/", { replace: true });
    } catch (err) {
      setError(err.response?.data?.message || "Signup failed");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-[calc(100vh-57px)] items-center justify-center px-4 py-8">
      <Card className="w-full max-w-sm">
        <h1 className="mb-4 text-xl font-semibold">Create an account</h1>
        <Alert type="error">{error}</Alert>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input label="Username" name="username" value={form.username} onChange={handleChange} required />
          <Input
            label="Email"
            type="email"
            name="email"
            value={form.email}
            onChange={handleChange}
            required
          />
          <Input
            label="Password"
            type="password"
            name="password"
            value={form.password}
            onChange={handleChange}
            minLength={8}
            required
          />
          <Select label="I want to" name="role" value={form.role} onChange={handleChange}>
            <option value="BUYER">Shop as a Buyer</option>
            <option value="SELLER">Sell as a Seller</option>
          </Select>
          {form.role === "SELLER" && (
            <Input
              label="Shop name"
              name="shopName"
              value={form.shopName}
              onChange={handleChange}
              required
            />
          )}
          <Button type="submit" className="w-full" disabled={submitting}>
            {submitting ? "Creating account..." : "Sign up"}
          </Button>
        </form>
        <p className="mt-4 text-center text-sm text-gray-600">
          Already have an account?{" "}
          <Link to="/login" className="font-medium text-brand-600">
            Log in
          </Link>
        </p>
      </Card>
    </div>
  );
};

export default Signup;
