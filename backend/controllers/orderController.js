const mongoose = require("mongoose");
const Order = require("../models/Order");
const Cart = require("../models/Cart");
const Product = require("../models/Product");
const ApiError = require("../utils/ApiError");
const asyncHandler = require("../utils/asyncHandler");
const validateObjectId = require("../utils/validateObjectId");

/**
 * POST /api/v1/orders
 * BUYER only. Converts the authenticated buyer's cart into an order.
 *
 * Runs inside a MongoDB transaction so that, under concurrent purchases of
 * the same product, either the whole checkout succeeds (order created,
 * stock deducted, cart cleared) or none of it happens. Stock is the
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
          throw new ApiError(404, `A product in your cart is no longer available`);
        }

        if (product.stock < cartItem.quantity) {
          throw new ApiError(
            409,
            `Insufficient stock for "${product.name}" (only ${product.stock} left)`
          );
        }

        const subtotal = product.price * cartItem.quantity;
        totalAmount += subtotal;

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

      // Atomic, conditional stock deduction: the filter re-checks stock >=
      // quantity at write time, so a concurrent checkout that already
      // consumed the stock will cause this update to match zero documents.
      for (const item of orderItems) {
        const updateResult = await Product.updateOne(
          { _id: item.product, stock: { $gte: item.quantity } },
          { $inc: { stock: -item.quantity } },
          { session }
        );

        if (updateResult.modifiedCount === 0) {
          throw new ApiError(409, `"${item.name}" went out of stock. Please update your cart.`);
        }
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
 * Restores stock for every item in the order inside a transaction, since
 * cancelling must be as atomic as placing the order.
 */
const cancelOrder = asyncHandler(async (req, res) => {
  const { orderId } = req.params;
  validateObjectId(orderId, "orderId");

  const session = await mongoose.startSession();
  let updatedOrder;

  try {
    await session.withTransaction(async () => {
      const order = await Order.findById(orderId).session(session);

      if (!order) {
        throw new ApiError(404, "Order not found");
      }

      if (order.user.toString() !== req.user.id) {
        throw new ApiError(403, "You can only cancel your own orders");
      }

      const nonCancellable = ["SHIPPED", "DELIVERED", "CANCELLED"];
      if (nonCancellable.includes(order.orderStatus)) {
        throw new ApiError(400, `Order cannot be cancelled once it is ${order.orderStatus}`);
      }

      for (const item of order.items) {
        await Product.updateOne(
          { _id: item.product },
          { $inc: { stock: item.quantity } },
          { session }
        );
      }

      order.orderStatus = "CANCELLED";
      order.items.forEach((item) => {
        item.itemStatus = "CANCELLED";
      });

      await order.save({ session });
      updatedOrder = order;
    });
  } finally {
    session.endSession();
  }

  res.status(200).json({ success: true, message: "Order cancelled", data: updatedOrder });
});

/**
 * Returns a plain-object copy of the order with only the requesting
 * seller's items included, so a seller response never leaks another
 * seller's items, prices, or quantities.
 */
const scopeOrderToSeller = (order, sellerId) => {
  const plain = order.toObject ? order.toObject() : order;
  return {
    ...plain,
    items: plain.items.filter((item) => item.seller.toString() === sellerId),
  };
};

module.exports = { createOrder, getOrders, getOrderById, updateOrderStatus, cancelOrder };
