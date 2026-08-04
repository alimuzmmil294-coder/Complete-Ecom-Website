const Product = require("../models/Product");
const ApiError = require("../utils/ApiError");
const asyncHandler = require("../utils/asyncHandler");
const validateObjectId = require("../utils/validateObjectId");

/**
 * POST /api/v1/products
 * SELLER only. Seller is always taken from req.user.id — never from the
 * request body — so a client can never create a product on someone else's
 * behalf.
 */
const createProduct = asyncHandler(async (req, res) => {
  const { name, description, price, category, images, stock } = req.body;

  if (!name || !description) {
    throw new ApiError(400, "Name and description are required");
  }
  if (price === undefined || price < 0) {
    throw new ApiError(400, "A valid, non-negative price is required");
  }

  const product = await Product.create({
    name,
    description,
    price,
    category,
    images: Array.isArray(images) ? images : [],
    stock: stock !== undefined ? stock : 0,
    seller: req.user.id,
  });

  res.status(201).json({ success: true, data: product });
});

/**
 * GET /api/v1/products
 * SELLER -> only their own products (active + inactive, so they can manage them).
 * BUYER / ADMIN -> global catalog. Buyers only ever see active products.
 * Supports pagination (skip/limit), category filter, and price sorting.
 */
const getProducts = asyncHandler(async (req, res) => {
  const { skip = 0, limit = 20, category, price } = req.query;

  const filter = {};

  if (req.user?.role === "SELLER") {
    filter.seller = req.user.id;
  } else {
    // BUYER, ADMIN, or unauthenticated public catalog browsing
    filter.isActive = true;
  }

  if (category) {
    filter.category = category;
  }

  let sort = { createdAt: -1 };
  if (price === "high") sort = { price: -1 };
  if (price === "low") sort = { price: 1 };

  const parsedSkip = Math.max(0, parseInt(skip, 10) || 0);
  const parsedLimit = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));

  const [products, total] = await Promise.all([
    Product.find(filter).sort(sort).skip(parsedSkip).limit(parsedLimit).populate("seller", "username shopName"),
    Product.countDocuments(filter),
  ]);

  res.status(200).json({
    success: true,
    count: products.length,
    total,
    data: products,
  });
});

/**
 * GET /api/v1/products/:productId
 * Public product details.
 */
const getProductById = asyncHandler(async (req, res) => {
  const { productId } = req.params;
  validateObjectId(productId, "productId");

  const product = await Product.findById(productId).populate("seller", "username shopName");

  if (!product) {
    throw new ApiError(404, "Product not found");
  }

  res.status(200).json({ success: true, data: product });
});

/**
 * PUT /api/v1/products/:productId
 * SELLER can only update their own product. ADMIN can update any product.
 * Ownership (`seller`) can never be transferred through this endpoint.
 */
const updateProduct = asyncHandler(async (req, res) => {
  const { productId } = req.params;
  validateObjectId(productId, "productId");

  const product = await Product.findById(productId);
  if (!product) {
    throw new ApiError(404, "Product not found");
  }

  if (req.user.role === "SELLER" && product.seller.toString() !== req.user.id) {
    throw new ApiError(403, "You can only update your own products");
  }

  const { name, description, price, category, images, stock, isActive } = req.body;

  if (name !== undefined) product.name = name;
  if (description !== undefined) product.description = description;
  if (price !== undefined) {
    if (price < 0) throw new ApiError(400, "Price cannot be negative");
    product.price = price;
  }
  if (category !== undefined) product.category = category;
  if (images !== undefined) product.images = images;
  if (stock !== undefined) {
    if (stock < 0) throw new ApiError(400, "Stock cannot be negative");
    product.stock = stock;
  }
  // `seller` is intentionally never assigned from req.body — ownership
  // transfer is not permitted here even for admins, to keep provenance clear.
  if (isActive !== undefined) {
    product.isActive = Boolean(isActive);
  }

  await product.save();

  res.status(200).json({ success: true, data: product });
});

/**
 * DELETE /api/v1/products/:productId
 * Soft delete (isActive = false). SELLER can only delete their own; ADMIN any.
 */
const deleteProduct = asyncHandler(async (req, res) => {
  const { productId } = req.params;
  validateObjectId(productId, "productId");

  const product = await Product.findById(productId);
  if (!product) {
    throw new ApiError(404, "Product not found");
  }

  if (req.user.role === "SELLER" && product.seller.toString() !== req.user.id) {
    throw new ApiError(403, "You can only delete your own products");
  }

  product.isActive = false;
  await product.save();

  res.status(200).json({ success: true, message: "Product deleted" });
});

module.exports = { createProduct, getProducts, getProductById, updateProduct, deleteProduct };
