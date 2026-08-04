import { useState } from "react";
import { useAuth } from "../context/AuthContext.jsx";
import * as authService from "../services/authService";
import { Button, Input, Alert, Card } from "../components/ui.jsx";

const Profile = () => {
  const { user, refreshUser } = useAuth();
  const [form, setForm] = useState({
    username: user?.username || "",
    email: user?.email || "",
    shopName: user?.shopName || "",
    password: "",
  });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setSubmitting(true);
    try {
      const payload = { username: form.username, email: form.email };
      if (user.role === "SELLER") payload.shopName = form.shopName;
      if (form.password) payload.password = form.password;

      await authService.updateMyProfile(payload);
      await refreshUser();
      setSuccess("Profile updated");
      setForm((f) => ({ ...f, password: "" }));
    } catch (err) {
      setError(err.response?.data?.message || "Update failed");
    } finally {
      setSubmitting(false);
    }
  };

  if (!user) return null;

  return (
    <div className="mx-auto max-w-lg px-4 py-8">
      <h1 className="mb-4 text-xl font-semibold">My Profile</h1>
      <Card>
        <Alert type="error">{error}</Alert>
        <Alert type="success">{success}</Alert>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input label="Username" name="username" value={form.username} onChange={handleChange} />
          <Input label="Email" type="email" name="email" value={form.email} onChange={handleChange} />
          {user.role === "SELLER" && (
            <Input label="Shop name" name="shopName" value={form.shopName} onChange={handleChange} />
          )}
          {user.authProvider === "LOCAL" && (
            <Input
              label="New password (leave blank to keep current)"
              type="password"
              name="password"
              value={form.password}
              onChange={handleChange}
              minLength={8}
            />
          )}
          <div className="text-xs text-gray-500">
            Role: <span className="font-medium">{user.role}</span> · Signed in via {user.authProvider}
          </div>
          <Button type="submit" disabled={submitting}>
            {submitting ? "Saving..." : "Save changes"}
          </Button>
        </form>
      </Card>
    </div>
  );
};

export default Profile;
