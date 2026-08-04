import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import * as productService from "../../services/productService";
import { Button, Input, Select, Alert, Card } from "../../components/ui.jsx";

const emptyForm = { name: "", description: "", price: "", category: "General", stock: "", images: "" };

const ProductForm = () => {
  const { productId } = useParams();
  const isEdit = Boolean(productId);
  const navigate = useNavigate();

  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(isEdit);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!isEdit) return;
    const load = async () => {
      try {
        const res = await productService.getProductById(productId);
        const p = res.data;
        setForm({
          name: p.name,
          description: p.description,
          price: p.price,
          category: p.category,
          stock: p.stock,
          images: (p.images || []).join(", "),
        });
      } catch (err) {
        setError(err.response?.data?.message || "Failed to load product");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [isEdit, productId]);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);

    const payload = {
      name: form.name,
      description: form.description,
      price: Number(form.price),
      category: form.category,
      stock: Number(form.stock),
      images: form.images
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean),
    };

    try {
      if (isEdit) {
        await productService.updateProduct(productId, payload);
      } else {
        await productService.createProduct(payload);
      }
      navigate("/seller/products");
    } catch (err) {
      setError(err.response?.data?.message || "Save failed");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <p className="p-8 text-gray-500">Loading...</p>;

  return (
    <div className="mx-auto max-w-lg px-4 py-8">
      <h1 className="mb-4 text-2xl font-semibold">{isEdit ? "Edit product" : "New product"}</h1>
      <Card>
        <Alert type="error">{error}</Alert>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input label="Name" name="name" value={form.name} onChange={handleChange} required />
          <label className="block text-sm">
            <span className="mb-1 block font-medium text-gray-700">Description</span>
            <textarea
              name="description"
              value={form.description}
              onChange={handleChange}
              rows={4}
              required
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
            />
          </label>
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Price ($)"
              type="number"
              min={0}
              step="0.01"
              name="price"
              value={form.price}
              onChange={handleChange}
              required
            />
            <Input
              label="Stock"
              type="number"
              min={0}
              name="stock"
              value={form.stock}
              onChange={handleChange}
              required
            />
          </div>
          <Select label="Category" name="category" value={form.category} onChange={handleChange}>
            <option value="General">General</option>
            <option value="Electronics">Electronics</option>
            <option value="Fashion">Fashion</option>
            <option value="Home">Home</option>
          </Select>
          <Input
            label="Image URLs (comma-separated)"
            name="images"
            value={form.images}
            onChange={handleChange}
            placeholder="https://example.com/image1.jpg"
          />
          <Button type="submit" className="w-full" disabled={submitting}>
            {submitting ? "Saving..." : isEdit ? "Save changes" : "Create product"}
          </Button>
        </form>
      </Card>
    </div>
  );
};

export default ProductForm;
