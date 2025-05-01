const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");
const { registerUser, loginUser, getUserDashboard, submitTest, changePassword, resendPassword } = require("../controllers/userController"); 

// Setup multer
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "./uploads"),
  filename: (req, file, cb) => cb(null, Date.now() + path.extname(file.originalname))
});
const upload = multer({ storage });

// Routes
router.post("/register", upload.fields([
  { name: "profile_pic", maxCount: 1 },
  { name: "college_id_card", maxCount: 1 }
]), registerUser);

router.post("/login", loginUser);
router.get("/dashboard/:id", getUserDashboard);
router.post("/submit", submitTest);
router.post("/change-password", changePassword);
router.post("/resend-password", resendPassword);

module.exports = router;
