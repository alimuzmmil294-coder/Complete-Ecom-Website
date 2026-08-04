const jwt = require("jsonwebtoken");
const User = require("../models/User");
const ApiError = require("../utils/ApiError");
const asyncHandler = require("../utils/asyncHandler");

/**
 * Requires a valid `token` HTTP-only cookie.
 * - Verifies the JWT signature/expiry.
 * - Re-fetches the user so isActive is checked against current DB state
 *   (not just what was true when the token was issued).
 * - Attaches a trimmed user object to req.user for downstream handlers.
 */
const authMiddleware = asyncHandler(async (req, res, next) => {
  const token = req.cookies?.token;

  if (!token) {
    throw new ApiError(401, "Not authenticated");
  }

  let decoded;
  try {
    decoded = jwt.verify(token, process.env.JWT_SECRET);
  } catch (err) {
    throw new ApiError(401, "Invalid or expired session");
  }

  const user = await User.findById(decoded.id);

  if (!user) {
    throw new ApiError(401, "User no longer exists");
  }

  if (!user.isActive) {
    throw new ApiError(401, "This account has been deactivated");
  }

  req.user = {
    id: user._id.toString(),
    role: user.role,
  };

  next();
});

module.exports = authMiddleware;
