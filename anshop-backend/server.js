const path = require("path");
require("dotenv").config({ path: path.join(__dirname, ".env") });

const connectDB = require("./config/db");
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");

const app = express();

function normalizeOrigin(value) {
  return String(value || "")
    .trim()
    .replace(/^['"]+|['"]+$/g, "")
    .replace(/\/+$/, "");
}

const defaultAllowedOrigins = [
  "http://localhost:5500",
  "http://127.0.0.1:5500",
  "https://anshop7.netlify.app"
];

const allowedOrigins = [
  ...new Set(
    String(process.env.CORS_ORIGIN || "")
      .split(",")
      .concat(defaultAllowedOrigins)
      .map(origin => normalizeOrigin(origin))
      .filter(Boolean)
  )
];

const corsOptions = {
  origin(origin, callback) {
    // Allow requests without Origin header (server-to-server tools, health checks, Postman).
    if (!origin) {
      return callback(null, true);
    }

    const normalizedRequestOrigin = normalizeOrigin(origin);

    if (allowedOrigins.includes(normalizedRequestOrigin)) {
      return callback(null, true);
    }

    return callback(new Error("Not allowed by CORS"));
  }
};

const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    message: "Too many auth attempts. Please try again after 15 minutes."
  }
});

// middleware
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" }
  })
);
app.use(cors(corsOptions));
app.use(express.json());

// Limit signup/login brute-force attempts.
app.use("/api/v1/users/signup", authRateLimiter);
app.use("/api/v1/users/login", authRateLimiter);

// Use absolute path so images load correctly regardless of terminal cwd.
app.use("/images", express.static(path.join(__dirname, "images")));

// test route
app.get("/", (req, res) => {
  res.send("AnShop Backend Running 🚀");
});

app.get("/health", (req, res) => {
  res.status(200).json({
    status: "ok",
    uptime: process.uptime(),
    timestamp: new Date().toISOString()
  });
});

// routes
const productRoutes = require("./routes/productRoutes");
app.use("/api/v1/products", productRoutes);

const userRoutes = require("./routes/userRoutes");
app.use("/api/v1/users", userRoutes);

const cartRoutes = require("./routes/cartRoutes");
app.use("/api/v1/cart", cartRoutes);

const orderRoutes = require("./routes/orderRoutes");
app.use("/api/v1/orders", orderRoutes);

const wishlistRoutes = require("./routes/wishlistRoutes");
app.use("/api/v1/wishlist", wishlistRoutes);

app.use((error, req, res, next) => {
  if (error && error.message === "Not allowed by CORS") {
    return res.status(403).json({ message: "Blocked by CORS policy." });
  }

  return next(error);
});

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    const dbState = await connectDB();

    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
      if (dbState?.connected) {
        console.log(`Database mode: ${dbState.source}`);
      } else {
        console.log("Database mode: none (read/write APIs may fail until DB is connected)");
      }
    });
  } catch (error) {
    console.error("Server startup failed:", error.message);
    process.exit(1);
  }
};

startServer();