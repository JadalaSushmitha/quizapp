const express = require("express");
const rateLimit = require("express-rate-limit");
const router = express.Router();
const { registerUser, loginUser } = require("../controllers/userController");

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // limit each IP to 5 requests per windowMs
  message: "Too many requests from this IP, please try again later.",
});

// Upload middleware for registration
const multer = require("multer");
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, './uploads');
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});
const upload = multer({ storage: storage });

router.post("/register", upload.fields([{ name: 'profile_pic' }, { name: 'college_id_card' }]), authLimiter, registerUser);
router.post("/login", authLimiter, loginUser);

module.exports = router;
