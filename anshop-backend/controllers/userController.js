const User = require("../models/User");
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const { OAuth2Client } = require("google-auth-library");
const { recalculateCreditProfile } = require("../services/creditService");
let firebaseAdmin = null;

try {
  firebaseAdmin = require("firebase-admin");
} catch (error) {
  // firebase-admin is optional in development until configured.
}

const googleClient = new OAuth2Client();
let firebaseInitialized = false;

function isBcryptHash(value) {
  return /^\$2[aby]\$\d{2}\$/.test(String(value || ""));
}

function createAuthToken(user) {
  const jwtSecret = process.env.JWT_SECRET;
  if (!jwtSecret) {
    throw new Error("JWT_SECRET is missing. Add it in your .env file.");
  }

  return jwt.sign(
    {
      userId: user._id.toString(),
      role: user.role || "user"
    },
    jwtSecret,
    { expiresIn: "7d" }
  );
}

function normalizePhone(value) {
  return String(value || "").replace(/\D/g, "").trim();
}

function getAuthResponse(user, message) {
  const token = createAuthToken(user);

  return {
    success: true,
    message,
    token,
    user: {
      _id: user._id,
      name: user.name,
      email: user.email,
      phone: user.phone || "",
      role: user.role,
      photoURL: user.photoURL || ""
    }
  };
}

function canAccessUserProfile(auth, targetUserId) {
  if (!auth) {
    return false;
  }

  return auth.role === "admin" || String(auth.userId) === String(targetUserId);
}

function initFirebaseAdminIfNeeded() {
  if (!firebaseAdmin || firebaseInitialized) {
    return;
  }

  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKeyRaw = process.env.FIREBASE_PRIVATE_KEY;

  if (!projectId || !clientEmail || !privateKeyRaw) {
    console.warn("[Firebase] Missing config: projectId=%s clientEmail=%s privateKey=%s", !!projectId, !!clientEmail, !!privateKeyRaw);
    return;
  }

  const privateKey = privateKeyRaw.replace(/\\n/g, "\n");

  if (!firebaseAdmin.apps.length) {
    try {
      firebaseAdmin.initializeApp({
        credential: firebaseAdmin.credential.cert({
          projectId,
          clientEmail,
          privateKey
        })
      });
      console.log("[Firebase] Admin SDK initialized successfully");
    } catch (error) {
      console.error("[Firebase] Initialization failed:", error.message);
      return;
    }
  }

  firebaseInitialized = true;
}

async function verifyGoogleToken(idToken) {
  initFirebaseAdminIfNeeded();

  if (firebaseInitialized && firebaseAdmin && firebaseAdmin.auth) {
    try {
      console.log("[verifyGoogleToken] Using Firebase Admin SDK");
      const decoded = await firebaseAdmin.auth().verifyIdToken(idToken);

      return {
        email: decoded.email,
        name: decoded.name || "",
        phone: decoded.phone_number || ""
      };
    } catch (firebaseError) {
      console.error("[verifyGoogleToken] Firebase verification failed:", firebaseError.message);
      // Fall through to google-auth-library fallback
    }
  }

  // Fallback to google-auth-library if Firebase isn't initialized or fails
  console.log("[verifyGoogleToken] Using google-auth-library fallback");
  const clientId = process.env.GOOGLE_CLIENT_ID;
  if (!clientId) {
    throw new Error("Google login is not configured on server");
  }

  const ticket = await googleClient.verifyIdToken({
    idToken,
    audience: clientId
  });
  const payload = ticket.getPayload();

  return {
    email: payload && payload.email,
    name: payload && payload.name,
    phone: ""
  };
}

exports.signup = async (req, res) => {
  try {
    const { name, email, password, phone } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: "Name, email and password are required" });
    }

    if (String(password).trim().length < 6) {
      return res.status(400).json({ message: "Password must be at least 6 characters" });
    }

    const safePhone = normalizePhone(phone);
    if (safePhone && !/^\d{10}$/.test(safePhone)) {
      return res.status(400).json({ message: "Phone must be 10 digits" });
    }

    const existingUser = await User.findOne({ email: email.toLowerCase().trim() });
    if (existingUser) {
      return res.status(409).json({ message: "Email already registered" });
    }

    if (safePhone) {
      const existingPhoneUser = await User.findOne({ phone: safePhone });
      if (existingPhoneUser) {
        return res.status(409).json({ message: "Phone already registered" });
      }
    }

    const passwordHash = await bcrypt.hash(password.trim(), 10);

    const user = await User.create({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      phone: safePhone,
      password: passwordHash
    });

    return res.status(201).json(getAuthResponse(user, "Signup successful"));
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

exports.login = async (req, res) => {
  try {
    const { identifier, email, password } = req.body;
    const loginIdentifier = String(identifier || email || "").trim();

    if (!loginIdentifier || !password) {
      return res.status(400).json({ message: "Email/phone and password are required" });
    }

    const normalizedPhone = normalizePhone(loginIdentifier);
    const isPhoneLogin = /^\d{10}$/.test(normalizedPhone);

    const user = await User.findOne(
      isPhoneLogin
        ? { phone: normalizedPhone }
        : { email: loginIdentifier.toLowerCase() }
    );

    if (!user) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const incomingPassword = password.trim();
    let isPasswordValid = false;

    if (isBcryptHash(user.password)) {
      isPasswordValid = await bcrypt.compare(incomingPassword, user.password);
    } else {
      // Legacy support: existing plain-text users can still login once, then we upgrade.
      isPasswordValid = user.password === incomingPassword;
      if (isPasswordValid) {
        user.password = await bcrypt.hash(incomingPassword, 10);
        await user.save();
      }
    }

    if (!isPasswordValid) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    return res.json(getAuthResponse(user, "Login successful"));
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

exports.googleAuth = async (req, res) => {
  try {
    const { idToken, photoURL } = req.body;

    console.log("[GoogleAuth] Request received. PhotoURL:", photoURL);

    if (!idToken) {
      return res.status(400).json({ message: "Google token is required" });
    }

    console.log("[GoogleAuth] Verifying token...");
    const payload = await verifyGoogleToken(idToken);
    console.log("[GoogleAuth] Token verified, payload:", { email: payload.email, name: payload.name });

    if (!payload || !payload.email) {
      console.error("[GoogleAuth] Invalid payload:", payload);
      return res.status(401).json({ message: "Invalid Google account data" });
    }

    const safeEmail = String(payload.email).toLowerCase().trim();
    let user = await User.findOne({ email: safeEmail });

    if (!user) {
      console.log("[GoogleAuth] Creating new user:", safeEmail);
      const generatedPassword = crypto.randomBytes(32).toString("hex");
      const passwordHash = await bcrypt.hash(generatedPassword, 10);

      user = await User.create({
        name: String(payload.name || safeEmail.split("@")[0] || "User").trim(),
        email: safeEmail,
        password: passwordHash,
        phone: "",
        photoURL: photoURL || ""
      });
      console.log("[GoogleAuth] User created:", user._id, "PhotoURL stored:", user.photoURL);
    } else {
      console.log("[GoogleAuth] Existing user found:", user._id);
      // Update profile photo if provided
      if (photoURL) {
        user.photoURL = photoURL;
        await user.save();
        console.log("[GoogleAuth] User photo updated. New photoURL:", user.photoURL);
      }
    }

    const response = getAuthResponse(user, "Google login successful");
    console.log("[GoogleAuth] Returning response with photoURL:", response.user.photoURL);
    return res.json(response);
  } catch (error) {
    console.error("[GoogleAuth] Error:", error);
    if (/not configured/i.test(String(error && error.message))) {
      return res.status(500).json({ message: "Google login is not configured on server" });
    }
    return res.status(401).json({ message: error.message || "Google authentication failed" });
  }
};

exports.getUserProfile = async (req, res) => {
  try {
    const { userId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ message: "Invalid user id" });
    }

    const user = await User.findById(userId).select("_id name email phone address createdAt photoURL");
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    return res.json({
      success: true,
      user
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

exports.updateUserProfile = async (req, res) => {
  try {
    const { userId } = req.params;
    const {
      name,
      phone,
      address,
      city,
      state,
      pincode
    } = req.body;

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ message: "Invalid user id" });
    }

    if (!name || !String(name).trim()) {
      return res.status(400).json({ message: "Name is required" });
    }

    const safePhone = String(phone || "").trim();
    if (safePhone && !/^\d{10}$/.test(safePhone)) {
      return res.status(400).json({ message: "Phone must be 10 digits" });
    }

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      {
        name: String(name).trim(),
        phone: safePhone,
        address: {
          address: String(address || "").trim(),
          city: String(city || "").trim(),
          state: String(state || "").trim(),
          pincode: String(pincode || "").trim()
        }
      },
      {
        new: true,
        runValidators: true
      }
    ).select("_id name email phone address createdAt");

    if (!updatedUser) {
      return res.status(404).json({ message: "User not found" });
    }

    return res.json({
      success: true,
      message: "Profile updated successfully",
      user: updatedUser
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

exports.getCreditProfile = async (req, res) => {
  try {
    const { userId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ message: "Invalid user id" });
    }

    if (!canAccessUserProfile(req.auth, userId)) {
      return res.status(403).json({ message: "You can only view your own credit profile." });
    }

    // Recompute from order history so old users do not see stale zero values.
    await recalculateCreditProfile(userId);

    const user = await User.findById(userId).select("_id name email creditProfile createdAt");
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const creditProfile = user.creditProfile || {};

    return res.json({
      success: true,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        createdAt: user.createdAt
      },
      creditProfile: {
        score: Number(creditProfile.score) || 600,
        level: creditProfile.level || "Starter",
        creditLimit: Number(creditProfile.creditLimit) || 0,
        usedAmount: Number(creditProfile.usedAmount) || 0,
        availableAmount: Number(creditProfile.availableAmount) || 0,
        totalOrders: Number(creditProfile.totalOrders) || 0,
        deliveredOrders: Number(creditProfile.deliveredOrders) || 0,
        cancelledOrders: Number(creditProfile.cancelledOrders) || 0,
        totalDeliveredSpend: Number(creditProfile.totalDeliveredSpend) || 0,
        lastCalculatedAt: creditProfile.lastCalculatedAt || null
      }
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

exports.recalculateCreditProfileForUser = async (req, res) => {
  try {
    const { userId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ message: "Invalid user id" });
    }

    const creditProfile = await recalculateCreditProfile(userId);

    return res.json({
      success: true,
      message: "Credit profile recalculated successfully",
      creditProfile
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

exports.getAdminCreditProfiles = async (req, res) => {
  try {
    const users = await User.find()
      .select("_id name email role creditProfile createdAt")
      .sort({ createdAt: -1 })
      .limit(300);

    const data = users.map(user => {
      const credit = user.creditProfile || {};

      return {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        createdAt: user.createdAt,
        creditProfile: {
          score: Number(credit.score) || 600,
          level: credit.level || "Starter",
          creditLimit: Number(credit.creditLimit) || 0,
          usedAmount: Number(credit.usedAmount) || 0,
          availableAmount: Number(credit.availableAmount) || 0,
          totalOrders: Number(credit.totalOrders) || 0,
          deliveredOrders: Number(credit.deliveredOrders) || 0,
          cancelledOrders: Number(credit.cancelledOrders) || 0,
          totalDeliveredSpend: Number(credit.totalDeliveredSpend) || 0,
          lastCalculatedAt: credit.lastCalculatedAt || null
        }
      };
    });

    return res.json({
      success: true,
      count: data.length,
      users: data
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};
