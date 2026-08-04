const ApiError = require("../utils/ApiError");

/**
 * Usage: checkRole(["SELLER"]) or checkRole(["SELLER", "ADMIN"])
 * Must run after authMiddleware, which populates req.user.
 */
const checkRole = (allowedRoles = []) => {
  return (req, res, next) => {
    if (!req.user) {
      return next(new ApiError(401, "Not authenticated"));
    }

    if (!allowedRoles.includes(req.user.role)) {
      return next(new ApiError(403, "You do not have permission to perform this action"));
    }

    next();
  };
};

module.exports = checkRole;
