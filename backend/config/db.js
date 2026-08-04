const mongoose = require("mongoose");

/**
 * Connects to MongoDB using MONGO_URI.
 * The server refuses to start if this fails (see server.js),
 * since every route depends on a working database connection.
 */
const connectDB = async () => {
  const uri = process.env.MONGO_URI;

  if (!uri) {
    throw new Error("MONGO_URI is not defined in the environment");
  }

  mongoose.set("strictQuery", true);

  const conn = await mongoose.connect(uri);

  console.log(`MongoDB connected: ${conn.connection.host}/${conn.connection.name}`);

  return conn;
};

module.exports = connectDB;
