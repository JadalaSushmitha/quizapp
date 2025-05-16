const db = require("../models/db");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const nodemailer = require("nodemailer");

// Helper: Send email
const sendEmail = async (to, subject, text) => {
  const transporter = nodemailer.createTransport({
    service: "Gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  await transporter.sendMail({
    from: process.env.EMAIL_USER,
    to,
    subject,
    text,
  });
};

// Register user
exports.registerUser = async (req, res) => {
  try {
    const { full_name, email, phone, college_name, college_id } = req.body;
    const profilePic = req.files?.profile_pic?.[0]?.filename;
    const collegeIdCard = req.files?.college_id_card?.[0]?.filename;

    console.log("Uploaded Profile Pic:", profilePic);
    console.log("Uploaded College ID Card:", collegeIdCard);

    if (!full_name || !email || !phone || !college_name || !college_id) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const [existing] = await db.promise().query("SELECT id FROM users WHERE email = ?", [email]);
    if (existing.length > 0) {
      return res.status(400).json({ error: "Email already registered" });
    }

    const rawPassword = crypto.randomBytes(6).toString("hex");
    const hashedPassword = await bcrypt.hash(rawPassword, 12);

    await db.promise().query(
      "INSERT INTO users (full_name, email, phone, college_name, college_id, profile_pic, college_id_card, password) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
      [full_name, email, phone, college_name, college_id, profilePic, collegeIdCard, hashedPassword]
    );

    let emailWarning = null;
    try {
      await sendEmail(
        email,
        "Registration Successful",
        `Hi ${full_name},\n\nYour account has been created.\nYour login password: ${rawPassword}\n\nPlease log in and change your password.`
      );
    } catch (err) {
      console.error("Email failed:", err);
      emailWarning = "User registered, but failed to send confirmation email.";
    }

    res.status(201).json({
      success: true,
      message: emailWarning || "User registered and password sent to email"
    });
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
    res.json({
      token,
      user: {
        id: user.id,
        full_name: user.full_name,
        email: user.email,
        phone: user.phone,
        college_name: user.college_name,
        college_id: user.college_id,
        profile_pic: user.profile_pic,
        college_id_card: user.college_id_card,
      }
    });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ error: "Login failed" });
  }
};

// Get dashboard
exports.getUserDashboard = async (req, res) => {
  const userId = req.user?.id || req.params.id;

  if (!userId) {
    return res.status(400).json({ error: "User ID is missing" });
  }

  try {
    const [user] = await db.promise().query("SELECT * FROM users WHERE id = ?", [userId]);
    if (user.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }

    const [tests] = await db.promise().query("SELECT * FROM tests");
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
  const { userId, testId, answers } = req.body;

  try {
    for (const answer of answers) {
      await db.promise().query(
        "INSERT INTO test_responses (user_id, test_id, question_id, selected_option) VALUES (?, ?, ?, ?)",
        [userId, testId, answer.question_id, answer.selected_option]
      );
    }

    res.json({ message: "Test submitted successfully" });
  } catch (err) {
    console.error("Test submission error:", err);
    res.status(500).json({ error: "Test submission failed" });
  }
};

// Change password
exports.changePassword = async (req, res) => {
  const userId = req.user.id; // from JWT middleware
  const { oldPassword, newPassword } = req.body;

  try {
    // Use promise().query for async/await
    const [rows] = await db.promise().query("SELECT * FROM users WHERE id = ?", [userId]);
    if (rows.length === 0) return res.status(404).json({ message: "User not found" });

    const user = rows[0];

    // Compare old password
    const isMatch = await bcrypt.compare(oldPassword, user.password);
    if (!isMatch) return res.status(400).json({ message: "Old password is incorrect." });

    // Validate new password policy
    const passwordRegex = /^(?=.*[A-Z])(?=.*[a-z])(?=.*[0-9]).{8,}$/;
    if (!passwordRegex.test(newPassword)) {
      return res.status(400).json({ message: "New password does not meet the criteria." });
    }

    // Check if new password is same as old
    const isSame = await bcrypt.compare(newPassword, user.password);
    if (isSame) return res.status(400).json({ message: "New password must be different from the old password." });

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 12);

    // Update password
    await db.promise().query("UPDATE users SET password = ? WHERE id = ?", [hashedPassword, userId]);

    // Email notification
    await sendEmail(user.email, "Password Changed Successfully", `
Dear ${user.full_name},

Your password has been changed successfully.

If you did not perform this change, please contact support immediately.

Best Regards,
nDMatrix
    `);

    return res.json({ message: "Password changed successfully." });

  } catch (error) {
    console.error("Change Password Error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

// Resend password
exports.resendPassword = async (req, res) => {
  const { email } = req.body;
  try {
    const [users] = await db.promise().query("SELECT * FROM users WHERE email = ?", [email]);
    const user = users[0];
    if (!user) return res.status(404).json({ error: "User not found" });

    const newPassword = crypto.randomBytes(6).toString("hex");
    const hashedPassword = await bcrypt.hash(newPassword, 12);

    await db.promise().query("UPDATE users SET password = ? WHERE email = ?", [hashedPassword, email]);

    try {
      await sendEmail(
        email,
        "Your New Password",
        `Hi ${user.full_name},\n\nHere is your new password: ${newPassword}\n\nPlease login and change it immediately.`
      );
    } catch (err) {
      console.error("Email resend failed:", err);
      return res.status(500).json({ error: "Password updated, but failed to send email." });
    }

    res.json({ message: "Password resent successfully" });
  } catch (err) {
    console.error("Password resend error:", err);
    res.status(500).json({ error: "Failed to resend password" });
  }
};

// Get user results
exports.getUserResults = async (req, res) => {
  const userId = req.params.id;
  try {
    const [results] = await db.promise().query(
      `SELECT s.*, t.test_name 
       FROM submissions s 
       JOIN tests t ON s.test_id = t.id 
       WHERE s.user_id = ?`,
      [userId]
    );

    res.json(results);
  } catch (err) {
    console.error("Result fetch error:", err);
    res.status(500).json({ error: "Failed to fetch results" });
  }
};
