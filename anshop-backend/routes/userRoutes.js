const express = require("express");
const router = express.Router();

const {
	signup,
	login,
	googleAuth,
	getUserProfile,
	updateUserProfile,
	getCreditProfile,
	recalculateCreditProfileForUser,
	getAdminCreditProfiles
} = require("../controllers/userController");
const { authenticateToken, requireAdmin } = require("../middleware/authMiddleware");

router.post("/signup", signup);
router.post("/login", login);
router.post("/google", googleAuth);
router.get("/admin/credit-profiles", authenticateToken, requireAdmin, getAdminCreditProfiles);
router.post("/:userId/credit-profile/recalculate", authenticateToken, requireAdmin, recalculateCreditProfileForUser);
router.get("/:userId/credit-profile", authenticateToken, getCreditProfile);
router.post("/update/:userId", updateUserProfile);
router.get("/:userId", getUserProfile);
router.put("/:userId", updateUserProfile);

module.exports = router;
