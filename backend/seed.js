require("dotenv").config();
const mongoose = require("mongoose");
const connectDB = require("./config/db");
const User = require("./models/User");
const Product = require("./models/Product");

const seedDatabase = async () => {
  try {
    await connectDB();
    console.log("Connected to MongoDB. Starting database seed...");

    // Check if admin already exists
    let admin = await User.findOne({ email: "admin@marketplace.com" });
    if (!admin) {
      admin = await User.create({
        username: "Admin User",
        email: "admin@marketplace.com",
        password: "adminpassword123",
        role: "ADMIN",
        authProvider: "LOCAL",
      });
      console.log("Created Admin: admin@marketplace.com / adminpassword123");
    } else {
      console.log("Admin already exists: admin@marketplace.com");
    }

    // Check if seller already exists
    let seller = await User.findOne({ email: "seller@techgear.com" });
    if (!seller) {
      seller = await User.create({
        username: "TechGear Official",
        email: "seller@techgear.com",
        password: "sellerpassword123",
        role: "SELLER",
        shopName: "TechGear Innovations",
        authProvider: "LOCAL",
      });
      console.log("Created Seller: seller@techgear.com / sellerpassword123");
    } else {
      console.log("Seller already exists: seller@techgear.com");
    }

    // Check if buyer already exists
    let buyer = await User.findOne({ email: "buyer@example.com" });
    if (!buyer) {
      buyer = await User.create({
        username: "John Buyer",
        email: "buyer@example.com",
        password: "buyerpassword123",
        role: "BUYER",
        authProvider: "LOCAL",
      });
      console.log("Created Buyer: buyer@example.com / buyerpassword123");
    } else {
      console.log("Buyer already exists: buyer@example.com");
    }

    // Add demo products if none exist
    const productCount = await Product.countDocuments();
    if (productCount === 0) {
      const demoProducts = [
        {
          name: "Wireless Noise-Canceling Headphones",
          description: "High-fidelity audio with active noise cancelation, 30-hour battery life, and comfortable over-ear design.",
          price: 199.99,
          category: "Electronics",
          stock: 25,
          images: ["https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&q=80"],
          seller: seller._id,
        },
        {
          name: "Mechanical Gaming Keyboard RGB",
          description: "Custom tactile switches, customizable per-key RGB backlighting, and durable aircraft-grade aluminum frame.",
          price: 89.99,
          category: "Electronics",
          stock: 40,
          images: ["https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=800&q=80"],
          seller: seller._id,
        },
        {
          name: "Classic Minimalist Watch",
          description: "Sleek stainless steel case with genuine leather band and Japanese quartz movement.",
          price: 129.5,
          category: "Fashion",
          stock: 15,
          images: ["https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&q=80"],
          seller: seller._id,
        },
        {
          name: "Smart Fitness Watch",
          description: "Track steps, heart rate, sleep quality, and workouts with 7-day battery life and water resistance.",
          price: 79.99,
          category: "Electronics",
          stock: 30,
          images: ["https://images.unsplash.com/photo-1579586337278-3befd40fd17a?w=800&q=80"],
          seller: seller._id,
        },
        {
          name: "Ceramic Pour-Over Coffee Maker",
          description: "Artisan matte black ceramic dripper set with heat-resistant glass carafe for the perfect brew.",
          price: 34.0,
          category: "Home",
          stock: 50,
          images: ["https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=800&q=80"],
          seller: seller._id,
        },
      ];

      await Product.insertMany(demoProducts);
      console.log(`Seeded ${demoProducts.length} demo products.`);
    } else {
      console.log(`Products already exist (${productCount} products found).`);
    }

    console.log("Database seed completed successfully!");
    process.exit(0);
  } catch (err) {
    console.error("Seed failed:", err);
    process.exit(1);
  }
};

seedDatabase();
