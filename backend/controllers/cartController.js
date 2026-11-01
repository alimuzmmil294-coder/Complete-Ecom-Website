const mongoose = require("mongoose");
const Cart = require("../models/Cart");
const Product = require("../models/Product");
const ApiError = require("../utils/ApiError");
const asyncHandler = require("../utils/asyncHandler");
const validateObjectId = require("../utils/validateObjectId");

/**
 * Standard rounding helper to eliminate IEEE 754 floating-point drift in monetary calculations.
 */
const roundCurrency = (val) => Math.round((Number(val) + Number.EPSILON) * 100) / 100;

/**
 * GET /api/v1/cart
 * Uses an aggregation with $lookup to join product details and compute
 * per-item and cart-level totals in a single query.
 */
const getCart = asyncHandler(async (req, res) => {
  const userId = new mongoose.Types.ObjectId(req.user.id);

  const result = await Cart.aggregate([
    { $match: { user: userId } },
    { $unwind: { path: "$items", preserveNullAndEmptyArrays: true } },
    {
      $lookup: {
        from: "products",
        localField: "items.product",
        foreignField: "_id",
        as: "productDetails",
      },
    },
    { $unwind: { path: "$productDetails", preserveNullAndEmptyArrays: true } },
    {
      $group: {
        _id: "$_id",
        user: { $first: "$user" },
        items: {
          $push: {
            $cond: [
              { $ifNull: ["$items.product", false] },
              {
                product: "$items.product",
                name: "$productDetails.name",
                image: { $arrayElemAt: ["$productDetails.images", 0] },
                price: "$productDetails.price",
                stock: "$productDetails.stock",
                quantity: "$items.quantity",
                subtotal: {
                  $round: [
                    { $multiply: ["$productDetails.price", "$items.quantity"] },
                    2,
                  ],
                },
              },
              "$$REMOVE",
            ],
          },
        },
      },
    },
    {
      $addFields: {
        cartTotal: {
          $round: [{ $sum: "$items.subtotal" }, 2],
        },
      },
    },
  ]);

  if (!result.length) {
    return res.status(200).json({
      success: true,
      data: { items: [], cartTotal: 0 },
    });
  }

  const { _id, user, ...cart } = result[0];

  const formattedItems = (cart.items || []).map((item) => ({
    ...item,
    subtotal: roundCurrency(item.subtotal),
  }));

  res.status(200).json({
    success: true,
    data: {
      ...cart,
      items: formattedItems,
      cartTotal: roundCurrency(cart.cartTotal),
    },
  });
});

/**
 * POST /api/v1/cart/add
 * Validates stock for immediate feedback. This is NOT the authoritative
 * check — checkout re-validates stock inside a transaction.
 */
const addToCart = asyncHandler(async (req, res) => {
  const { productId, quantity } = req.body;

  validateObjectId(productId, "productId");

  const parsedQuantity = Number(quantity);
  if (!Number.isInteger(parsedQuantity) || parsedQuantity <= 0) {
    throw new ApiError(400, "Quantity must be a positive integer");
  }

  const product = await Product.findById(productId);
  if (!product || !product.isActive) {
    throw new ApiError(404, "Product not found");
  }

  let cart = await Cart.findOne({ user: req.user.id });
  if (!cart) {
    cart = await Cart.create({ user: req.user.id, items: [] });
  }

  const existingItem = cart.items.find((item) => item.product.toString() === productId);
  const desiredQuantity = existingItem ? existingItem.quantity + parsedQuantity : parsedQuantity;

  if (desiredQuantity > product.stock) {
    throw new ApiError(409, `Only ${product.stock} unit(s) of "${product.name}" available`);
  }

  if (existingItem) {
    existingItem.quantity = desiredQuantity;
  } else {
    cart.items.push({ product: productId, quantity: parsedQuantity });
  }

  await cart.save();

  res.status(200).json({ success: true, message: "Item added to cart" });
});

/**
 * DELETE /api/v1/cart/item/:productId
 */
const removeCartItem = asyncHandler(async (req, res) => {
  const { productId } = req.params;
  validateObjectId(productId, "productId");

  const cart = await Cart.findOne({ user: req.user.id });
  if (!cart) {
    throw new ApiError(404, "Cart not found");
  }

  cart.items = cart.items.filter((item) => item.product.toString() !== productId);
  await cart.save();

  res.status(200).json({ success: true, message: "Item removed from cart" });
});

/**
 * PUT /api/v1/cart/item/:productId
 */
const updateCartItemQuantity = asyncHandler(async (req, res) => {
  const { productId } = req.params;
  const { quantity } = req.body;

  validateObjectId(productId, "productId");

  const parsedQuantity = Number(quantity);
  if (!Number.isInteger(parsedQuantity) || parsedQuantity < 0) {
    throw new ApiError(400, "Quantity must be a non-negative integer");
  }

  const cart = await Cart.findOne({ user: req.user.id });
  if (!cart) {
    throw new ApiError(404, "Cart not found");
  }

  if (parsedQuantity === 0) {
    cart.items = cart.items.filter((item) => item.product.toString() !== productId);
    await cart.save();
    return res.status(200).json({ success: true, message: "Item removed from cart" });
  }

  const product = await Product.findById(productId);
  if (!product || !product.isActive) {
    throw new ApiError(404, "Product not found or unavailable");
  }

  if (parsedQuantity > product.stock) {
    throw new ApiError(409, `Only ${product.stock} unit(s) of "${product.name}" available`);
  }

  const item = cart.items.find((i) => i.product.toString() === productId);
  if (!item) {
    throw new ApiError(404, "Item not found in cart");
  }

  item.quantity = parsedQuantity;
  await cart.save();

  res.status(200).json({ success: true, message: "Cart updated" });
});

/**
 * DELETE /api/v1/cart/clear
 */
const clearCart = asyncHandler(async (req, res) => {
  await Cart.findOneAndUpdate(
    { user: req.user.id },
    { $set: { items: [] } },
    { upsert: true }
  );

  res.status(200).json({ success: true, message: "Cart cleared" });
});

module.exports = { getCart, addToCart, updateCartItemQuantity, removeCartItem, clearCart };
