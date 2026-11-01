const express = require("express");
const {
  createProduct,
  getProducts,
  getProductById,
  updateProduct,
  deleteProduct,
} = require("../controllers/productController");
const authMiddleware = require("../middleware/authMiddleware");
const checkRole = require("../middleware/checkRole");

const router = express.Router();

const jwt = require("jsonwebtoken");
const User = require("../models/User");

// Public catalog browsing — optionalAuth-style: authMiddleware is NOT
// strictly required so buyers/visitors can browse without logging in. When a valid
// token IS present (seller checking their own listing), we still set req.user.
// If the token is expired or invalid, we simply proceed as a guest.
const optionalAuth = async (req, res, next) => {
  const token = req.cookies?.token;
  if (!token) return next();

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id);
    if (user && user.isActive) {
      req.user = { id: user._id.toString(), role: user.role };
    }
  } catch (err) {
    // Expired or invalid token: continue as guest
  }
  return next();
};

router.get("/", optionalAuth, getProducts);
router.get("/:productId", getProductById);

router.post("/", authMiddleware, checkRole(["SELLER"]), createProduct);
router.put("/:productId", authMiddleware, checkRole(["SELLER", "ADMIN"]), updateProduct);
router.delete("/:productId", authMiddleware, checkRole(["SELLER", "ADMIN"]), deleteProduct);

module.exports = router;
