const express = require("express");
const {
  getCart,
  addToCart,
  updateCartItemQuantity,
  removeCartItem,
  clearCart,
} = require("../controllers/cartController");
const authMiddleware = require("../middleware/authMiddleware");
const checkRole = require("../middleware/checkRole");

const router = express.Router();

router.use(authMiddleware, checkRole(["BUYER"]));

router.get("/", getCart);
router.post("/add", addToCart);
router.put("/item/:productId", updateCartItemQuantity);
router.delete("/item/:productId", removeCartItem);
router.delete("/clear", clearCart);

module.exports = router;
