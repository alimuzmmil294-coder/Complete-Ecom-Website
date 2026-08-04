const User = require("../models/User");
const ApiError = require("../utils/ApiError");
const asyncHandler = require("../utils/asyncHandler");
const validateObjectId = require("../utils/validateObjectId");

/**
 * POST /api/v1/users
 * Admin-only user creation. Unlike public signup, admins may create any role.
 */
const createUser = asyncHandler(async (req, res) => {
  const { username, email, password, authProvider, googleId, role, shopName, avatar } = req.body;

  if (!username || !email) {
    throw new ApiError(400, "Username and email are required");
  }

  const provider = authProvider === "GOOGLE" ? "GOOGLE" : "LOCAL";
  const allowedRoles = ["BUYER", "SELLER", "ADMIN"];
  const finalRole = allowedRoles.includes(role) ? role : "BUYER";

  if (finalRole === "SELLER" && !shopName) {
    throw new ApiError(400, "Shop name is required for seller accounts");
  }

  if (provider === "LOCAL" && (!password || password.length < 8)) {
    throw new ApiError(400, "Password must be at least 8 characters for local accounts");
  }

  if (provider === "GOOGLE" && !googleId) {
    throw new ApiError(400, "googleId is required for Google accounts");
  }

  const existing = await User.findOne({ email: email.toLowerCase() });
  if (existing) {
    throw new ApiError(409, "An account with this email already exists");
  }

  const user = await User.create({
    username,
    email,
    authProvider: provider,
    role: finalRole,
    avatar: avatar || "",
    ...(finalRole === "SELLER" ? { shopName } : {}),
    ...(provider === "LOCAL" ? { password } : { googleId }),
  });

  res.status(201).json({ success: true, data: user.toSafeJSON() });
});

/**
 * GET /api/v1/users?userStatus=all|active|inactive
 * Admin-only.
 */
const getUsers = asyncHandler(async (req, res) => {
  const { userStatus } = req.query;

  const filter = {};
  if (userStatus === "active") filter.isActive = true;
  if (userStatus === "inactive") filter.isActive = false;
  // "all" or missing -> no filter

  const users = await User.find(filter).sort({ createdAt: -1 });

  res.status(200).json({
    success: true,
    count: users.length,
    data: users.map((u) => u.toSafeJSON()),
  });
});

/**
 * PUT /api/v1/users/me
 * Authenticated users update their own profile. role/isActive/authProvider/
 * googleId are stripped out even if present in the request body.
 */
const updateMe = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.id);

  if (!user) {
    throw new ApiError(404, "User not found");
  }

  const { username, email, avatar, shopName, password } = req.body;

  if (username !== undefined) user.username = username;
  if (avatar !== undefined) user.avatar = avatar;

  if (email !== undefined && email.toLowerCase() !== user.email) {
    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) {
      throw new ApiError(409, "An account with this email already exists");
    }
    user.email = email;
  }

  if (shopName !== undefined) {
    user.shopName = shopName;
  }
  if (user.role === "SELLER" && !user.shopName) {
    throw new ApiError(400, "Shop name is required for seller accounts");
  }

  if (password !== undefined) {
    if (user.authProvider !== "LOCAL") {
      throw new ApiError(400, "Cannot set a password on a Google-authenticated account");
    }
    if (password.length < 8) {
      throw new ApiError(400, "Password must be at least 8 characters");
    }
    user.password = password; // hashed by the pre-save hook
  }

  await user.save();

  res.status(200).json({ success: true, data: user.toSafeJSON() });
});

/**
 * PUT /api/v1/users/:userId
 * Admin-only update of another user, including role and isActive.
 */
const updateUser = asyncHandler(async (req, res) => {
  const { userId } = req.params;
  validateObjectId(userId, "userId");

  const user = await User.findById(userId);
  if (!user) {
    throw new ApiError(404, "User not found");
  }

  const { username, email, avatar, shopName, role, isActive } = req.body;

  if (username !== undefined) user.username = username;
  if (avatar !== undefined) user.avatar = avatar;

  if (email !== undefined && email.toLowerCase() !== user.email) {
    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) {
      throw new ApiError(409, "An account with this email already exists");
    }
    user.email = email;
  }

  if (role !== undefined) {
    if (!["BUYER", "SELLER", "ADMIN"].includes(role)) {
      throw new ApiError(400, "Invalid role");
    }
    user.role = role;
  }

  if (user.role === "SELLER") {
    if (shopName !== undefined) user.shopName = shopName;
    if (!user.shopName) {
      throw new ApiError(400, "Shop name is required when assigning the SELLER role");
    }
  }

  if (isActive !== undefined) {
    user.isActive = Boolean(isActive);
  }

  await user.save();

  res.status(200).json({ success: true, data: user.toSafeJSON() });
});

/**
 * DELETE /api/v1/users/:userId
 * Admin-only. Soft delete only — isActive = false. Inactive users are
 * rejected at login and by authMiddleware.
 */
const deleteUser = asyncHandler(async (req, res) => {
  const { userId } = req.params;
  validateObjectId(userId, "userId");

  const user = await User.findById(userId);
  if (!user) {
    throw new ApiError(404, "User not found");
  }

  user.isActive = false;
  await user.save();

  res.status(200).json({ success: true, message: "User deactivated" });
});

module.exports = { createUser, getUsers, updateMe, updateUser, deleteUser };
