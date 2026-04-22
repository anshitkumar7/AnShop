const mongoose = require("mongoose");
const User = require("../models/User");
const Order = require("../models/Order");

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function getCreditLevel(score) {
  if (score >= 800) {
    return "Elite";
  }

  if (score >= 700) {
    return "Prime";
  }

  if (score >= 550) {
    return "Growing";
  }

  return "Starter";
}

function getCreditLimit(score) {
  if (score >= 800) {
    return 30000;
  }

  if (score >= 700) {
    return 15000;
  }

  if (score >= 550) {
    return 7000;
  }

  // Keep a small starter line so new users don't see a dead-zero capacity card.
  return 2000;
}

function buildUserMatch(userId) {
  const objectId = new mongoose.Types.ObjectId(userId);
  return {
    $or: [
      { userId: objectId },
      { userId: String(userId) }
    ]
  };
}

async function recalculateCreditProfile(userId) {
  if (!mongoose.Types.ObjectId.isValid(userId)) {
    throw new Error("Invalid user id for credit calculation");
  }

  const userMatch = buildUserMatch(userId);

  const [user, totalOrders, deliveredOrders, cancelledOrders, deliveredSpendStats] = await Promise.all([
    User.findById(userId),
    Order.countDocuments(userMatch),
    Order.countDocuments({ ...userMatch, status: "delivered" }),
    Order.countDocuments({ ...userMatch, status: "cancelled" }),
    Order.aggregate([
      {
        $match: {
          ...userMatch,
          status: "delivered"
        }
      },
      {
        $group: {
          _id: null,
          deliveredSpend: { $sum: { $ifNull: ["$totalAmount", 0] } }
        }
      }
    ])
  ]);

  if (!user) {
    throw new Error("User not found");
  }

  const deliveredSpend = Number(deliveredSpendStats[0] && deliveredSpendStats[0].deliveredSpend) || 0;

  const deliveredBonus = Math.min(deliveredOrders * 10, 200);
  const cancellationPenalty = Math.min(cancelledOrders * 25, 200);
  const spendBonus = Math.min(Math.floor(deliveredSpend / 2000) * 5, 100);

  const rawScore = 600 + deliveredBonus + spendBonus - cancellationPenalty;
  const score = clamp(rawScore, 300, 900);
  const creditLimit = getCreditLimit(score);

  const currentUsed = Number(user.creditProfile && user.creditProfile.usedAmount) || 0;
  const usedAmount = clamp(currentUsed, 0, creditLimit);
  const availableAmount = Math.max(creditLimit - usedAmount, 0);

  user.creditProfile = {
    score,
    level: getCreditLevel(score),
    creditLimit,
    usedAmount,
    availableAmount,
    totalOrders,
    deliveredOrders,
    cancelledOrders,
    totalDeliveredSpend: deliveredSpend,
    lastCalculatedAt: new Date()
  };

  await user.save();

  return user.creditProfile;
}

module.exports = {
  recalculateCreditProfile,
  getCreditLevel,
  getCreditLimit
};
