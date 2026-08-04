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

// Public catalog browsing — optionalAuth-style: authMiddleware is NOT
// applied here so buyers can browse without logging in. When a token IS
// present (seller checking their own listing), we still want req.user set,
// so we use a lightweight inline check instead of the strict middleware.
const optionalAuth = async (req, res, next) => {
  const authMiddleware = require("../middleware/authMiddleware");
  if (!req.cookies?.token) return next();
  return authMiddleware(req, res, next);
};

router.get("/", optionalAuth, getProducts);
router.get("/:productId", getProductById);

router.post("/", authMiddleware, checkRole(["SELLER"]), createProduct);
router.put("/:productId", authMiddleware, checkRole(["SELLER", "ADMIN"]), updateProduct);
router.delete("/:productId", authMiddleware, checkRole(["SELLER", "ADMIN"]), deleteProduct);

module.exports = router;
