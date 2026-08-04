import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import * as productService from "../../services/productService";
import { Button, Alert, Card, Badge } from "../../components/ui.jsx";

const MyProducts = () => {
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

  if (loading) return <p className="p-8 text-gray-500">Loading...</p>;

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-2xl font-semibold">My Products</h1>
        <Link to="/seller/products/new">
          <Button>+ New product</Button>
        </Link>
      </div>

      <Alert type="error">{error}</Alert>

      {products.length === 0 ? (
        <p className="text-gray-500">You haven't listed any products yet.</p>
      ) : (
        <div className="space-y-3">
          {products.map((p) => (
            <Card key={p._id} className="flex items-center justify-between">
              <div>
                <p className="font-medium">
                  {p.name} {!p.isActive && <Badge tone="red">Deleted</Badge>}
                </p>
                <p className="text-sm text-gray-500">
                  ${p.price.toFixed(2)} · {p.stock} in stock · {p.category}
                </p>
              </div>
              <div className="flex gap-2">
                <Link to={`/seller/products/${p._id}/edit`}>
                  <Button variant="outline">Edit</Button>
                </Link>
                {p.isActive && (
                  <Button variant="danger" onClick={() => handleDelete(p._id)}>
                    Delete
                  </Button>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default MyProducts;
