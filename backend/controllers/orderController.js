const mongoose = require("mongoose");
const Order = require("../models/Order");
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
 * POST /api/v1/orders
 * BUYER only. Converts the authenticated buyer's cart into an order.
 *
 * Runs inside a MongoDB transaction so that, under concurrent purchases of
 * the same product, either the whole checkout succeeds (order created,
 * stock deducted via bulkWrite, cart cleared) or none of it happens. Stock is the
 * authoritative check here — the cart-add check earlier is best-effort only.
 *
 * Requires a MongoDB deployment that supports transactions
 * (replica set / MongoDB Atlas). A standalone mongod will throw here.
 */
const createOrder = asyncHandler(async (req, res) => {
  const { shippingAddress, paymentMethod } = req.body;

  if (
    !shippingAddress ||
    !shippingAddress.fullName ||
    !shippingAddress.phone ||
    !shippingAddress.addressLine1 ||
    !shippingAddress.city ||
    !shippingAddress.state ||
    !shippingAddress.postalCode ||
    !shippingAddress.country
  ) {
    throw new ApiError(400, "A complete shipping address is required");
  }

  const session = await mongoose.startSession();
  let createdOrder;

  try {
    await session.withTransaction(async () => {
      const cart = await Cart.findOne({ user: req.user.id }).session(session);

      if (!cart || cart.items.length === 0) {
        throw new ApiError(400, "Your cart is empty");
      }

      const productIds = cart.items.map((item) => item.product);
      const products = await Product.find({ _id: { $in: productIds } }).session(session);

      const productMap = new Map(products.map((p) => [p._id.toString(), p]));

      const orderItems = [];
      let totalAmount = 0;

      for (const cartItem of cart.items) {
        const product = productMap.get(cartItem.product.toString());

        if (!product || !product.isActive) {
          throw new ApiError(404, "A product in your cart is no longer available");
        }

        if (product.stock < cartItem.quantity) {
          throw new ApiError(
            409,
            `Insufficient stock for "${product.name}" (only ${product.stock} left)`
          );
        }

        const subtotal = roundCurrency(product.price * cartItem.quantity);
        totalAmount = roundCurrency(totalAmount + subtotal);

        orderItems.push({
          product: product._id,
          seller: product.seller,
          name: product.name,
          price: product.price,
          quantity: cartItem.quantity,
          subtotal,
          itemStatus: "PENDING",
        });
      }

      // Atomic, batch stock deduction via bulkWrite inside the active transaction.
      // Replaces sequential update loops to reduce round-trips while holding transaction locks.
      const bulkOps = orderItems.map((item) => ({
        updateOne: {
          filter: { _id: item.product, stock: { $gte: item.quantity } },
          update: { $inc: { stock: -item.quantity } },
        },
      }));

      const bulkResult = await Product.bulkWrite(bulkOps, { session });

      if (bulkResult.modifiedCount !== orderItems.length) {
        throw new ApiError(
          409,
          "One or more items in your cart went out of stock. Please update your cart."
        );
      }

      const [order] = await Order.create(
        [
          {
            user: req.user.id,
            items: orderItems,
            shippingAddress,
            paymentMethod: paymentMethod === "COD" ? "COD" : "COD",
            totalAmount,
            orderStatus: "PENDING",
            paymentStatus: "PENDING",
          },
        ],
        { session }
      );

      cart.items = [];
      await cart.save({ session });

      createdOrder = order;
    });
  } finally {
    session.endSession();
  }

  res.status(201).json({ success: true, message: "Order placed successfully", data: createdOrder });
});

/**
 * GET /api/v1/orders
 * BUYER  -> only their own orders.
 * SELLER -> only orders that contain at least one of their items (with
 *           other sellers' items filtered out of the response).
 * ADMIN  -> all orders.
 */
const getOrders = asyncHandler(async (req, res) => {
  const { role, id } = req.user;

  let orders;

  if (role === "BUYER") {
    orders = await Order.find({ user: id }).sort({ createdAt: -1 });
  } else if (role === "SELLER") {
    orders = await Order.find({ "items.seller": id }).sort({ createdAt: -1 });
    orders = orders.map((order) => scopeOrderToSeller(order, id));
  } else {
    orders = await Order.find({}).sort({ createdAt: -1 });
  }

  res.status(200).json({ success: true, count: orders.length, data: orders });
});

/**
 * GET /api/v1/orders/:orderId
 */
const getOrderById = asyncHandler(async (req, res) => {
  const { orderId } = req.params;
  validateObjectId(orderId, "orderId");

  const order = await Order.findById(orderId);
  if (!order) {
    throw new ApiError(404, "Order not found");
  }

  const { role, id } = req.user;

  if (role === "BUYER") {
    if (order.user.toString() !== id) {
      throw new ApiError(403, "You do not have access to this order");
    }
    return res.status(200).json({ success: true, data: order });
  }

  if (role === "SELLER") {
    const hasSellerItems = order.items.some((item) => item.seller.toString() === id);
    if (!hasSellerItems) {
      throw new ApiError(403, "You do not have access to this order");
    }
    return res.status(200).json({ success: true, data: scopeOrderToSeller(order, id) });
  }

  // ADMIN
  res.status(200).json({ success: true, data: order });
});

/**
 * PUT /api/v1/orders/:orderId/status
 * SELLER -> may only update the itemStatus of order items that belong to
 *           them (e.g. marking their own items SHIPPED / DELIVERED).
 * ADMIN  -> may update the overall orderStatus / paymentStatus.
 */
const updateOrderStatus = asyncHandler(async (req, res) => {
  const { orderId } = req.params;
  validateObjectId(orderId, "orderId");

  const order = await Order.findById(orderId);
  if (!order) {
    throw new ApiError(404, "Order not found");
  }

  const { role, id } = req.user;

  if (role === "SELLER") {
    const { itemStatus } = req.body;
    const validItemStatuses = ["PENDING", "SHIPPED", "DELIVERED", "CANCELLED"];

    if (!validItemStatuses.includes(itemStatus)) {
      throw new ApiError(400, "Invalid item status");
    }

    const sellerItems = order.items.filter((item) => item.seller.toString() === id);
    if (sellerItems.length === 0) {
      throw new ApiError(403, "You do not have items in this order");
    }

    sellerItems.forEach((item) => {
      item.itemStatus = itemStatus;
    });

    await order.save();

    return res.status(200).json({ success: true, data: scopeOrderToSeller(order, id) });
  }

  if (role === "ADMIN") {
    const { orderStatus, paymentStatus } = req.body;
    const validOrderStatuses = ["PENDING", "PAID", "SHIPPED", "DELIVERED", "CANCELLED"];
    const validPaymentStatuses = ["PENDING", "PAID", "FAILED", "REFUNDED"];

    if (orderStatus !== undefined) {
      if (!validOrderStatuses.includes(orderStatus)) {
        throw new ApiError(400, "Invalid order status");
      }
      order.orderStatus = orderStatus;
    }

    if (paymentStatus !== undefined) {
      if (!validPaymentStatuses.includes(paymentStatus)) {
        throw new ApiError(400, "Invalid payment status");
      }
      order.paymentStatus = paymentStatus;
    }

    await order.save();

    return res.status(200).json({ success: true, data: order });
  }

  throw new ApiError(403, "You do not have permission to update order status");
});

/**
 * POST /api/v1/orders/:orderId/cancel
 * BUYER only, and only their own order, and only while cancellation still
 * makes sense (not already shipped/delivered/cancelled).
 *
 * Performs an atomic transition on orderStatus inside a transaction to prevent
 * double-cancellation race conditions, then restores stock via bulkWrite.
 */
const cancelOrder = asyncHandler(async (req, res) => {
  const { orderId } = req.params;
  validateObjectId(orderId, "orderId");

  const session = await mongoose.startSession();
  let updatedOrder;

  try {
    await session.withTransaction(async () => {
      // 1. Atomic state transition: guarantees only ONE concurrent execution can succeed
      const order = await Order.findOneAndUpdate(
        {
          _id: orderId,
          user: req.user.id,
          orderStatus: { $nin: ["SHIPPED", "DELIVERED", "CANCELLED"] },
        },
        {
          $set: {
            orderStatus: "CANCELLED",
            "items.$[].itemStatus": "CANCELLED",
          },
        },
        { session, new: true }
      );

      if (!order) {
        // Inspect order state to provide precise, granular HTTP error status
        const existingOrder = await Order.findById(orderId).session(session);

        if (!existingOrder) {
          throw new ApiError(404, "Order not found");
        }

        if (existingOrder.user.toString() !== req.user.id) {
          throw new ApiError(403, "You can only cancel your own orders");
        }

        const nonCancellable = ["SHIPPED", "DELIVERED", "CANCELLED"];
        if (nonCancellable.includes(existingOrder.orderStatus)) {
          throw new ApiError(
            400,
            `Order cannot be cancelled once it is ${existingOrder.orderStatus}`
          );
        }

        throw new ApiError(400, "Order cannot be cancelled");
      }

      // 2. Atomic bulk restock inside the active session
      const restoreOps = order.items.map((item) => ({
        updateOne: {
          filter: { _id: item.product },
          update: { $inc: { stock: item.quantity } },
        },
      }));

      if (restoreOps.length > 0) {
        await Product.bulkWrite(restoreOps, { session });
      }

      updatedOrder = order;
    });
  } finally {
    session.endSession();
  }

  res.status(200).json({ success: true, message: "Order cancelled", data: updatedOrder });
});

/**
 * Returns a plain-object copy of the order with only the requesting
 * seller's items included, recalculates totalAmount for that seller's items only,
 * and redacts customer contact details if the order has been cancelled.
 */
const scopeOrderToSeller = (order, sellerId) => {
  const plain = order.toObject ? order.toObject() : { ...order };
  const sellerItems = (plain.items || []).filter(
    (item) => item.seller && item.seller.toString() === sellerId
  );
  const sellerSubtotal = roundCurrency(
    sellerItems.reduce((acc, item) => acc + (Number(item.subtotal) || 0), 0)
  );

  let shippingAddress = plain.shippingAddress;
  if (plain.orderStatus === "CANCELLED" && shippingAddress) {
    shippingAddress = {
      ...shippingAddress,
      phone: "[REDACTED - ORDER CANCELLED]",
      addressLine1: "[REDACTED - ORDER CANCELLED]",
      addressLine2: "",
    };
  }

  return {
    ...plain,
    items: sellerItems,
    totalAmount: sellerSubtotal,
    shippingAddress,
  };
};

module.exports = { createOrder, getOrders, getOrderById, updateOrderStatus, cancelOrder };
