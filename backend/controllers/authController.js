const User = require("../models/User");
const ApiError = require("../utils/ApiError");
const asyncHandler = require("../utils/asyncHandler");
const { signToken, setAuthCookie, clearAuthCookie } = require("../utils/token");

/**
 * POST /api/v1/auth/signup
 * Supports LOCAL and GOOGLE signup. Public signup can only ever create
 * BUYER or SELLER accounts — ADMIN is never accepted from this endpoint,
 * even if a client sends role: "ADMIN".
 */
const signup = asyncHandler(async (req, res) => {
  const { username, email, password, authProvider, googleToken, role, shopName, avatar } = req.body;

  if (!username || !email) {
    throw new ApiError(400, "Username and email are required");
  }

  const provider = authProvider === "GOOGLE" ? "GOOGLE" : "LOCAL";

  // Only BUYER or SELLER may be self-registered. Anything else (including
  // an attempted "ADMIN") is coerced to the default.
  const requestedRole = role === "SELLER" ? "SELLER" : "BUYER";

  if (requestedRole === "SELLER" && !shopName) {
    throw new ApiError(400, "Shop name is required for seller accounts");
  }

  const existing = await User.findOne({ email: email.toLowerCase() });
  if (existing) {
    throw new ApiError(409, "An account with this email already exists");
  }

  const userData = {
    username,
    email,
    authProvider: provider,
    role: requestedRole,
    avatar: avatar || "",
    ...(requestedRole === "SELLER" ? { shopName } : {}),
  };

  if (provider === "LOCAL") {
    if (!password || password.length < 8) {
      throw new ApiError(400, "Password must be at least 8 characters");
    }
    userData.password = password;
  } else {
    // GOOGLE signup: in production, googleToken must be verified against
    // Google's servers (e.g. via google-auth-library's OAuth2Client.verifyIdToken)
    // and the verified `sub` claim used as googleId. We never trust a raw
    // client-supplied googleId as proof of identity.
    if (!googleToken) {
      throw new ApiError(400, "Google token is required for Google signup");
    }
    const verifiedGoogleId = await verifyGoogleToken(googleToken);
    userData.googleId = verifiedGoogleId;
  }

  const user = await User.create(userData);

  const token = signToken(user);
  setAuthCookie(res, token);

  res.status(201).json({
    success: true,
    message: "Account created successfully",
    data: user.toSafeJSON(),
  });
});

/**
 * POST /api/v1/auth/login
 */
const login = asyncHandler(async (req, res) => {
  const { email, password, authProvider, googleToken } = req.body;

  if (!email) {
    throw new ApiError(400, "Email is required");
  }

  const user = await User.findOne({ email: email.toLowerCase() }).select("+password");

  if (!user) {
    throw new ApiError(401, "Invalid email or password");
  }

  if (!user.isActive) {
    throw new ApiError(401, "This account has been deactivated");
  }

  const provider = authProvider === "GOOGLE" ? "GOOGLE" : "LOCAL";

  if (provider === "LOCAL") {
    if (user.authProvider !== "LOCAL") {
      throw new ApiError(400, `This account uses ${user.authProvider} sign-in`);
    }
    if (!password) {
      throw new ApiError(400, "Password is required");
    }
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      throw new ApiError(401, "Invalid email or password");
    }
  } else {
    if (user.authProvider !== "GOOGLE") {
      throw new ApiError(400, "This account uses local email/password sign-in");
    }
    if (!googleToken) {
      throw new ApiError(400, "Google token is required");
    }
    const verifiedGoogleId = await verifyGoogleToken(googleToken);
    if (verifiedGoogleId !== user.googleId) {
      throw new ApiError(401, "Google authentication failed");
    }
  }

  const token = signToken(user);
  setAuthCookie(res, token);

  res.status(200).json({
    success: true,
    message: "Logged in successfully",
    data: user.toSafeJSON(),
  });
});

/**
 * POST /api/v1/auth/logout
 */
const logout = asyncHandler(async (req, res) => {
  clearAuthCookie(res);
  res.status(200).json({ success: true, message: "Logged out successfully" });
});

/**
 * GET /api/v1/auth/me
 * Used by the React frontend on startup to restore auth state, since the
 * JWT itself lives in an HTTP-only cookie the frontend cannot read.
 */
const getMe = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.id);

  if (!user || !user.isActive) {
    throw new ApiError(401, "Not authenticated");
  }

  res.status(200).json({
    success: true,
    data: user.toSafeJSON(),
  });
});

/**
 * Placeholder Google token verification.
 *
 * Replace this with real verification before going to production, e.g.:
 *
 *   const { OAuth2Client } = require("google-auth-library");
 *   const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
 *   const ticket = await client.verifyIdToken({ idToken: googleToken, audience: process.env.GOOGLE_CLIENT_ID });
 *   return ticket.getPayload().sub;
 *
 * As written, this intentionally throws so the app never silently trusts
 * an unverified token in an environment without Google credentials configured.
 */
const verifyGoogleToken = async (_googleToken) => {
  if (!process.env.GOOGLE_CLIENT_ID) {
    throw new ApiError(
      501,
      "Google sign-in is not configured on this server. Set GOOGLE_CLIENT_ID and implement verifyGoogleToken."
    );
  }
  throw new ApiError(501, "Google token verification not implemented");
};

module.exports = { signup, login, logout, getMe };
