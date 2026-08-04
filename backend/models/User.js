const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: [true, "Username is required"],
      trim: true,
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, "Please provide a valid email"],
    },
    authProvider: {
      type: String,
      enum: ["LOCAL", "GOOGLE"],
      required: true,
      default: "LOCAL",
    },
    password: {
      type: String,
      required: [
        function () {
          return this.authProvider === "LOCAL";
        },
        "Password is required for local accounts",
      ],
      select: false, // never returned by default on find/findOne
      minlength: 8,
    },
    googleId: {
      type: String,
      required: [
        function () {
          return this.authProvider === "GOOGLE";
        },
        "Google ID is required for Google accounts",
      ],
      unique: true,
      sparse: true, // allows many docs with no googleId
    },
    avatar: {
      type: String,
      default: "",
    },
    role: {
      type: String,
      enum: ["SELLER", "BUYER", "ADMIN"],
      default: "BUYER",
    },
    shopName: {
      type: String,
      required: [
        function () {
          return this.role === "SELLER";
        },
        "Shop name is required for sellers",
      ],
      trim: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true },
);

// Hash password before saving, only if it was modified.
userSchema.pre("save", async function (next) {
  if (!this.isModified("password") || !this.password) {
    return next();
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Instance method used by the auth controller to compare a plaintext
// password against the stored hash.
userSchema.methods.comparePassword = async function (candidatePassword) {
  if (!this.password) return false;
  return bcrypt.compare(candidatePassword, this.password);
};

// Shape returned to clients — strips password and other internal fields.
userSchema.methods.toSafeJSON = function () {
  return {
    id: this._id,
    username: this.username,
    email: this.email,
    avatar: this.avatar,
    role: this.role,
    shopName: this.shopName,
    authProvider: this.authProvider,
    isActive: this.isActive,
    createdAt: this.createdAt,
  };
};

module.exports = mongoose.model("User", userSchema);
