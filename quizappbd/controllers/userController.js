const db = require("../models/db");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const nodemailer = require("nodemailer");

// Helper function for sending emails
const sendEmail = async (to, subject, text) => {
  const transporter = nodemailer.createTransport({
    service: "Gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  try {
    await transporter.sendMail({
      to,
      subject,
      text,
    });
  } catch (err) {
    console.error("Error sending email: ", err);
  }
};

// Register user
exports.registerUser = async (req, res) => {
  try {
    const { full_name, email, phone, college_name, college_id } = req.body;
    const profilePic = req.files?.profile_pic?.[0]?.filename || null;
    const collegeIdCard = req.files?.college_id_card?.[0]?.filename || null;

    // Validate required fields
    if (!full_name || !email || !phone || !college_name || !college_id) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    // Generate random password
    const rawPassword = crypto.randomBytes(6).toString("hex");
    const hashedPassword = await bcrypt.hash(rawPassword, 10);

    // Save user to DB
    const [result] = await db
      .promise()
      .query(
        "INSERT INTO users (full_name, email, phone, college_name, college_id, profile_pic, college_id_card, password) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
        [
          full_name,
          email,
          phone,
          college_name,
          college_id,
          profilePic,
          collegeIdCard,
          hashedPassword,
        ]
      );

    // Send password via email
    await sendEmail(
      email,
      "Registration Successful",
      `Hi ${full_name},\n\nYour account has been created.\nYour login password: ${rawPassword}\n\nPlease log in and change your password.`
    );

    res
      .status(201)
      .json({ message: "User registered and password sent to email" });
  } catch (err) {
    console.error("Registration error:", err);
    res.status(500).json({ error: "Registration failed" });
  }
};

// Login user
exports.loginUser = async (req, res) => {
  const { email, password } = req.body;
  try {
    const [users] = await db.promise().query("SELECT * FROM users WHERE email = ?", [email]);
    const user = users[0];
    if (!user) return res.status(400).json({ error: "User not found" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(401).json({ error: "Invalid password" });

    const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, { expiresIn: "1h" });
    res.json({ token, userId: user.id });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ error: "Login failed" });
  }
};

// Get user dashboard
exports.getUserDashboard = async (req, res) => {
  const userId = req.params.id;
  try {
    const [user] = await db.promise().query("SELECT * FROM users WHERE id = ?", [userId]);
    const [tests] = await db.promise().query("SELECT * FROM tests WHERE user_id = ?", [userId]);

    res.json({
      user: user[0],
      tests: tests
    });
  } catch (err) {
    console.error("Dashboard fetch error:", err);
    res.status(500).json({ error: "Dashboard fetch error" });
  }
};

// Submit test
exports.submitTest = async (req, res) => {
  // Your implementation
  res.json({ message: "Test submitted successfully" });
};

// Change password
exports.changePassword = async (req, res) => {
  const { userId, oldPassword, newPassword } = req.body;
  try {
    const [users] = await db.promise().query("SELECT * FROM users WHERE id = ?", [userId]);
    const user = users[0];

    const isMatch = await bcrypt.compare(oldPassword, user.password);
    if (!isMatch) return res.status(401).json({ error: "Incorrect old password" });

    const hashedNewPassword = await bcrypt.hash(newPassword, 10);
    await db.promise().query("UPDATE users SET password = ? WHERE id = ?", [hashedNewPassword, userId]);

    res.json({ message: "Password changed successfully" });
  } catch (err) {
    console.error("Password change error:", err);
    res.status(500).json({ error: "Password change failed" });
  }
};

// Resend password
exports.resendPassword = async (req, res) => {
  const { email } = req.body;
  try {
    const [users] = await db.promise().query("SELECT * FROM users WHERE email = ?", [email]);
    const user = users[0];
    if (!user) return res.status(404).json({ error: "User not found" });

    // Generate new random password
    const newPassword = crypto.randomBytes(6).toString("hex");
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update password in DB
    await db.promise().query("UPDATE users SET password = ? WHERE email = ?", [hashedPassword, email]);

    // Send new password via email
    await sendEmail(
      email,
      "Your New Password",
      `Hi ${user.full_name},\n\nHere is your new password: ${newPassword}\n\nPlease login and change it immediately.`
    );

    res.json({ message: "Password resent successfully" });
  } catch (err) {
    console.error("Password resend error:", err);
    res.status(500).json({ error: "Failed to resend password" });
  }
};
