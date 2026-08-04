const jwt = require("jsonwebtoken");

const TOKEN_TTL_MS = 60 * 60 * 1000; // 1 hour

/**
 * Signs a JWT containing only the fields the rest of the app relies on
 * (id + role). Keep this payload minimal — it is decoded on every
 * authenticated request.
 */
const signToken = (user) => {
  return jwt.sign(
    { id: user._id.toString(), role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: "1h" }
  );
};

/**
 * Sets the HTTP-only auth cookie on the response.
 * `secure` and `sameSite` are chosen based on NODE_ENV so local HTTP
 * development still works while production enforces HTTPS-only cookies.
 */
const setAuthCookie = (res, token) => {
  const isProduction = process.env.NODE_ENV === "production";

  res.cookie("token", token, {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? "none" : "lax",
    maxAge: TOKEN_TTL_MS,
  });
};

/**
 * Clears the auth cookie on logout. Options must mirror the ones used to
 * set the cookie or some browsers will not clear it correctly.
 */
const clearAuthCookie = (res) => {
  const isProduction = process.env.NODE_ENV === "production";

  res.clearCookie("token", {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? "none" : "lax",
  });
};

module.exports = { signToken, setAuthCookie, clearAuthCookie, TOKEN_TTL_MS };
