const express = require("express");
const {
  createOrder,
  getOrders,
  getOrderById,
  updateOrderStatus,
  cancelOrder,
} = require("../controllers/orderController");
const authMiddleware = require("../middleware/authMiddleware");
const checkRole = require("../middleware/checkRole");

const router = express.Router();

router.use(authMiddleware);

router.post("/", checkRole(["BUYER"]), createOrder);
router.get("/", checkRole(["BUYER", "SELLER", "ADMIN"]), getOrders);
router.get("/:orderId", checkRole(["BUYER", "SELLER", "ADMIN"]), getOrderById);
router.put("/:orderId/status", checkRole(["SELLER", "ADMIN"]), updateOrderStatus);
router.post("/:orderId/cancel", checkRole(["BUYER"]), cancelOrder);

module.exports = router;
