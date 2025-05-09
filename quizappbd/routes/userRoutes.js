const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");
const db = require("../models/db");
const {
  registerUser,
  loginUser,
  getUserDashboard,
  submitTest,
  changePassword,
  resendPassword,
  getUserResults
} = require("../controllers/userController");
const authenticateJWT = require("../middleware/authMiddleware");

// Updated Multer storage logic to avoid same filename
const storage = multer.diskStorage({
  destination: "uploads/",
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const fieldPrefix = file.fieldname === "profile_pic" ? "PROFILE" : "IDCARD";
    cb(null, `${fieldPrefix}_${Date.now()}${ext}`);
  },
});
const upload = multer({ storage });

router.post("/register", upload.fields([
  { name: "profile_pic" },
  { name: "college_id_card" }
]), registerUser);

router.post("/login", loginUser);
router.get("/dashboard/:id", authenticateJWT, getUserDashboard);

router.post("/submit", authenticateJWT, submitTest);
router.post("/change-password", authenticateJWT, changePassword);
router.post("/resend-password", resendPassword);

router.get("/results/:id", authenticateJWT, getUserResults);

router.get("/dashboard-direct/:id", authenticateJWT, async (req, res) => {
  const userId = req.userId;
  try {
    const [user] = await db.promise().query("SELECT * FROM users WHERE id = ?", [userId]);
    const [tests] = await db.promise().query("SELECT * FROM tests WHERE user_id = ?", [userId]);

    res.json({
      user: user[0],
      tests: tests
    });
  } catch (err) {
    res.status(500).json({ error: "Dashboard fetch error" });
  }
});

module.exports = router;
