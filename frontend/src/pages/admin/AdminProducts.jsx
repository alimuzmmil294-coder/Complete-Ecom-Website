import { useEffect, useState } from "react";
import * as productService from "../../services/productService";
import { Button, Alert, Card, Badge } from "../../components/ui.jsx";

const AdminProducts = () => {
  const [products, setProducts] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const res = await productService.getProducts({ limit: 100 });
      setProducts(res.data);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load products");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleDelete = async (productId) => {
    if (!window.confirm("Delete this product?")) return;
    setError("");
    try {
      await productService.deleteProduct(productId);
      load();
    } catch (err) {
      setError(err.response?.data?.message || "Could not delete product");
    }
  };

  if (loading) return <p className="p-8 text-gray-500">Loading products...</p>;

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <h1 className="mb-4 text-2xl font-semibold">All Products</h1>
      <Alert type="error">{error}</Alert>

      <div className="space-y-2">
        {products.map((p) => (
          <Card key={p._id} className="flex items-center justify-between">
            <div>
              <p className="font-medium">
                {p.name} {!p.isActive && <Badge tone="red">Deleted</Badge>}
              </p>
              <p className="text-sm text-gray-500">
                ${p.price.toFixed(2)} · {p.stock} in stock · Sold by{" "}
                {p.seller?.shopName || p.seller?.username}
              </p>
            </div>
            {p.isActive && (
              <Button variant="danger" onClick={() => handleDelete(p._id)}>
                Delete
              </Button>
            )}
          </Card>
        ))}
      </div>
    </div>
  );
};

export default AdminProducts;
