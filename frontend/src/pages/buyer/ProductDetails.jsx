import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import * as productService from "../../services/productService";
import * as cartService from "../../services/cartService";
import { Button, Alert, Card, Input } from "../../components/ui.jsx";

const ProductDetails = () => {
  const { productId } = useParams();
  const navigate = useNavigate();

  const [product, setProduct] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const res = await productService.getProductById(productId);
        setProduct(res.data);
      } catch (err) {
        setError(err.response?.data?.message || "Product not found");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [productId]);

  const handleAddToCart = async () => {
    setError("");
    setMessage("");
    try {
      await cartService.addToCart(productId, Number(quantity));
      setMessage("Added to cart");
    } catch (err) {
      setError(err.response?.data?.message || "Could not add to cart");
    }
  };

  if (loading) return <p className="p-8 text-gray-500">Loading...</p>;
  if (error && !product) return <div className="p-8"><Alert type="error">{error}</Alert></div>;
  if (!product) return null;

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <Button variant="outline" className="mb-4" onClick={() => navigate(-1)}>
        ← Back
      </Button>
      <Card className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <div className="flex h-72 items-center justify-center rounded bg-gray-100 text-gray-400">
          {product.images?.[0] ? (
            <img src={product.images[0]} alt={product.name} className="h-72 w-full rounded object-cover" />
          ) : (
            "No image"
          )}
        </div>
        <div>
          <h1 className="text-2xl font-semibold">{product.name}</h1>
          <p className="mt-1 text-sm text-gray-500">
            Sold by {product.seller?.shopName || product.seller?.username}
          </p>
          <p className="mt-4 text-2xl font-bold text-brand-600">${product.price.toFixed(2)}</p>
          <p className="mt-4 text-gray-700">{product.description}</p>
          <p className="mt-3 text-sm text-gray-500">
            {product.stock > 0 ? `${product.stock} in stock` : "Out of stock"}
          </p>

          <Alert type="error">{error}</Alert>
          <Alert type="success">{message}</Alert>

          <div className="mt-4 flex items-end gap-3">
            <Input
              label="Quantity"
              type="number"
              min={1}
              max={product.stock}
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              className="w-24"
            />
            <Button disabled={product.stock === 0} onClick={handleAddToCart}>
              Add to cart
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default ProductDetails;
