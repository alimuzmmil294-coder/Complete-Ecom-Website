import { useEffect, useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import * as productService from "../../services/productService";
import { useCart } from "../../context/CartContext.jsx";
import { useAuth } from "../../context/AuthContext.jsx";
import { Button, Select, Alert, Card, ProductImage } from "../../components/ui.jsx";

const PAGE_SIZE = 12;

const ProductCatalog = () => {
  const { user } = useAuth();
  const { addToCart } = useCart();
  const navigate = useNavigate();
  const location = useLocation();

  const [products, setProducts] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [category, setCategory] = useState("");
  const [priceSort, setPriceSort] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [addingId, setAddingId] = useState(null);

  useEffect(() => {
    const controller = new AbortController();
    let isCurrent = true;

    const fetchProducts = async () => {
      setLoading(true);
      setError("");
      try {
        const res = await productService.getProducts(
          {
            skip: page * PAGE_SIZE,
            limit: PAGE_SIZE,
            ...(category ? { category } : {}),
            ...(priceSort ? { price: priceSort } : {}),
          },
          controller.signal
        );
        if (isCurrent) {
          setProducts(res.data);
          setTotal(res.total);
        }
      } catch (err) {
        if (err.name === "CanceledError" || err.code === "ERR_CANCELED") {
          return; // Ignore aborted requests
        }
        if (isCurrent) {
          setError(err.response?.data?.message || "Failed to load products");
        }
      } finally {
        if (isCurrent) {
          setLoading(false);
        }
      }
    };

    fetchProducts();

    return () => {
      isCurrent = false;
      controller.abort();
    };
  }, [page, category, priceSort]);

  const handleAddToCart = async (productId) => {
    if (!user) {
      navigate("/login", { state: { from: location.pathname } });
      return;
    }
    if (user.role !== "BUYER") {
      setError("Only buyer accounts can add items to cart");
      return;
    }
    setMessage("");
    setError("");
    setAddingId(productId);
    try {
      await addToCart(productId, 1);
      setMessage("Added to cart");
    } catch (err) {
      setError(err.response?.data?.message || "Could not add to cart");
    } finally {
      setAddingId(null);
    }
  };

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <h1 className="text-2xl font-semibold">Shop</h1>
        <div className="flex gap-3">
          <Select
            aria-label="Filter by category"
            value={category}
            onChange={(e) => {
              setPage(0);
              setCategory(e.target.value);
            }}
          >
            <option value="">All categories</option>
            <option value="Electronics">Electronics</option>
            <option value="Fashion">Fashion</option>
            <option value="Home">Home</option>
            <option value="General">General</option>
          </Select>
          <Select
            aria-label="Sort by price"
            value={priceSort}
            onChange={(e) => {
              setPage(0);
              setPriceSort(e.target.value);
            }}
          >
            <option value="">Sort by</option>
            <option value="low">Price: Low to High</option>
            <option value="high">Price: High to Low</option>
          </Select>
        </div>
      </div>

      <Alert type="error">{error}</Alert>
      <Alert type="success">{message}</Alert>

      {loading ? (
        <p className="text-gray-500">Loading products...</p>
      ) : products.length === 0 ? (
        <p className="text-gray-500">No products found.</p>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {products.map((p) => (
            <Card key={p._id} className="flex flex-col">
              <Link to={`/buyer/products/${p._id}`} className="mb-2">
                <div className="mb-3 flex h-36 items-center justify-center overflow-hidden rounded bg-gray-100 text-gray-400">
                  <ProductImage
                    src={p.images?.[0]}
                    alt={p.name}
                    className="h-36 w-full rounded object-cover"
                  />
                </div>
                <h3 className="font-medium">{p.name}</h3>
                <p className="text-xs text-gray-500">{p.seller?.shopName}</p>
              </Link>
              <div className="mt-auto flex items-center justify-between pt-2">
                <span className="font-semibold">${p.price.toFixed(2)}</span>
                <span className="text-xs text-gray-500">{p.stock} in stock</span>
              </div>
              <Button
                className="mt-3"
                disabled={p.stock === 0 || addingId === p._id}
                onClick={() => handleAddToCart(p._id)}
              >
                {p.stock === 0
                  ? "Out of stock"
                  : addingId === p._id
                  ? "Adding..."
                  : "Add to cart"}
              </Button>
            </Card>
          ))}
        </div>
      )}

      <div className="mt-6 flex items-center justify-center gap-3">
        <Button variant="outline" disabled={page === 0} onClick={() => setPage((p) => p - 1)}>
          Previous
        </Button>
        <span className="text-sm text-gray-600">
          Page {page + 1} of {totalPages}
        </span>
        <Button
          variant="outline"
          disabled={page + 1 >= totalPages}
          onClick={() => setPage((p) => p + 1)}
        >
          Next
        </Button>
      </div>
    </div>
  );
};

export default ProductCatalog;
