import { useEffect, useState } from "react";
import * as userService from "../../services/userService";
import { Button, Select, Badge, Alert, Card } from "../../components/ui.jsx";

const AdminUsers = () => {
  const [users, setUsers] = useState([]);
  const [filter, setFilter] = useState("all");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const res = await userService.getUsers(filter);
      setUsers(res.data);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load users");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter]);

  const handleRoleChange = async (userId, role) => {
    setError("");
    try {
      await userService.updateUser(userId, { role });
      load();
    } catch (err) {
      setError(err.response?.data?.message || "Could not update role");
    }
  };

  const handleToggleActive = async (userId, isActive) => {
    setError("");
    try {
      if (isActive) {
        await userService.deleteUser(userId); // soft delete -> isActive=false
      } else {
        await userService.updateUser(userId, { isActive: true });
      }
      load();
    } catch (err) {
      setError(err.response?.data?.message || "Could not update user");
    }
  };

  if (loading) return <p className="p-8 text-gray-500">Loading users...</p>;

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Users</h1>
        <Select value={filter} onChange={(e) => setFilter(e.target.value)} className="!w-40">
          <option value="all">All</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </Select>
      </div>

      <Alert type="error">{error}</Alert>

      <div className="space-y-2">
        {users.map((u) => (
          <Card key={u.id} className="flex items-center justify-between">
            <div>
              <p className="font-medium">
                {u.username} <span className="text-sm text-gray-500">({u.email})</span>
              </p>
              <p className="text-xs text-gray-500">
                {u.shopName ? `Shop: ${u.shopName} · ` : ""}
                Joined {new Date(u.createdAt).toLocaleDateString()}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Badge tone={u.isActive ? "green" : "red"}>{u.isActive ? "Active" : "Inactive"}</Badge>
              <Select
                value={u.role}
                onChange={(e) => handleRoleChange(u.id, e.target.value)}
                className="!w-32"
              >
                <option value="BUYER">BUYER</option>
                <option value="SELLER">SELLER</option>
                <option value="ADMIN">ADMIN</option>
              </Select>
              <Button
                variant={u.isActive ? "danger" : "outline"}
                onClick={() => handleToggleActive(u.id, u.isActive)}
              >
                {u.isActive ? "Deactivate" : "Activate"}
              </Button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default AdminUsers;
