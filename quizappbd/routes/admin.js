const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../models/db');

// Secret key for admin login token
const SECRET_KEY = process.env.ADMIN_SECRET || 'adminsupersecret';

// Route to create admin user (one-time setup, then disable this in production)
router.post('/register-admin', async (req, res) => {
  const { username, password } = req.body;
  const hashedPassword = await bcrypt.hash(password, 10);
  const sql = 'INSERT INTO admin (username, password) VALUES (?, ?)';
  db.query(sql, [username, hashedPassword], (err, result) => {
    if (err) return res.status(500).send('Error registering admin');
    res.send('Admin registered');
  });
});

// Admin login route
router.post('/login-admin', (req, res) => {
  const { username, password } = req.body;
  const sql = 'SELECT * FROM admin WHERE username = ?';
  db.query(sql, [username], async (err, results) => {
    if (err) return res.status(500).send('Database error');
    if (results.length === 0) return res.status(401).send('Invalid credentials');

    const admin = results[0];
    const isMatch = await bcrypt.compare(password, admin.password);
    if (!isMatch) return res.status(401).send('Invalid credentials');

    const token = jwt.sign({ id: admin.id }, SECRET_KEY, { expiresIn: '1d' });
    res.json({ token });
  });
});

// Middleware to protect admin actions
const verifyAdmin = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).send('No token');

  jwt.verify(token, SECRET_KEY, (err, decoded) => {
    if (err) return res.status(403).send('Invalid token');
    req.admin = decoded;
    next();
  });
};

// Get all registered students
router.get('/students', verifyAdmin, (req, res) => {
  db.query('SELECT id, full_name, email, phone, college_name, college_id FROM users', (err, results) => {
    if (err) return res.status(500).send('Error fetching students');
    res.json(results);
  });
});

// Delete student by ID
router.delete('/students/:id', verifyAdmin, (req, res) => {
  const id = req.params.id;
  db.query('DELETE FROM users WHERE id = ?', [id], (err) => {
    if (err) return res.status(500).send('Delete failed');
    res.send('Student deleted');
  });
});

// View all results (if results table exists)
router.get('/results', verifyAdmin, (req, res) => {
  // Add pagination params (page, limit)
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 20;
  const offset = (page - 1) * limit;

  const sql = `
    SELECT r.result_id, r.test_id, r.user_id, r.score, r.total_questions, r.attempted_questions, 
           r.correct_answers, r.percentage, r.submission_time,
           u.full_name AS student_name, u.email AS student_email,
           t.test_name, t.course_name
    FROM test_results r
    JOIN users u ON r.user_id = u.id
    JOIN tests t ON r.test_id = t.id
    ORDER BY r.submission_time DESC
    LIMIT ? OFFSET ?`;

  db.query(sql, [limit, offset], (err, results) => {
  if (err) {
    console.error("Results API DB error:", err);
    return res.status(500).send('Error fetching results');
  }
  console.log("Fetched results:", results);
  res.json(results);
});

});

module.exports = router;
