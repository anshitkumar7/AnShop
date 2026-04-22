const jwt = require("jsonwebtoken");
const User = require("../models/User");

function getTokenFromRequest(req) {
  const authHeader = req.headers.authorization || "";
  if (authHeader.startsWith("Bearer ")) {
    return authHeader.slice(7).trim();
  }

  return "";
}

async function authenticateToken(req, res, next) {
  try {
    const token = getTokenFromRequest(req);

    if (!token) {
      return res.status(401).json({ message: "Access denied. Token missing." });
    }

    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      return res.status(500).json({ message: "Server auth is not configured." });
    }

    const decoded = jwt.verify(token, jwtSecret);
    const user = await User.findById(decoded.userId).select("_id role");

    if (!user) {
      return res.status(401).json({ message: "Invalid token user." });
    }

    req.auth = {
      userId: user._id.toString(),
      role: user.role || "user"
    };

    next();
  } catch (error) {
    return res.status(401).json({ message: "Invalid or expired token." });
  }
}

function requireAdmin(req, res, next) {
  if (!req.auth || req.auth.role !== "admin") {
    return res.status(403).json({ message: "Admin access required." });
  }

  next();
}

module.exports = {
  authenticateToken,
  requireAdmin
};
