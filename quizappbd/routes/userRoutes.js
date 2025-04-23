const express = require("express");
const router = express.Router();
const multer = require("multer");
const db = require("../models/db");

const {
  registerUser,
  loginUser,
  getUserDashboard,
  submitTest,
  changePassword,
} = require("../controllers/userController");

// Import the JWT middleware
const authenticateJWT = require('../middleware/authMiddleware');

// File Uploads
const storage = multer.diskStorage({
  destination: "uploads/",
  filename: (req, file, cb) => {
    cb(null, Date.now() + "_" + file.originalname);
  },
});
const upload = multer({ storage: storage });

// Routes
router.post("/register", upload.fields([
  { name: "profilePic" },
  { name: "collegeIdCard" }
]), registerUser);

router.post("/login", loginUser);

// Apply JWT middleware to the dashboard route
router.get("/dashboard/:id", authenticateJWT, getUserDashboard);

router.post("/submit", submitTest);
router.post("/change-password", changePassword);

router.get('/dashboard-direct/:id', async (req, res) => {
  const userId = req.userId;  // Using userId from the JWT
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

const { resendPassword } = require("../controllers/userController");

router.post("/resend-password", resendPassword);

module.exports = router;
