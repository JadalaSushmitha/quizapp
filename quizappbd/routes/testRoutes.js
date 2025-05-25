const express = require('express');
const router = express.Router();
const authenticateJWT = require('../middleware/authMiddleware');
const {
  getTestAndQuestions,
  submitTest,
  getDetailedResult
} = require('../controllers/testController');

// Fetch test and its questions
router.get('/tests/:testId/questions', authenticateJWT, getTestAndQuestions);

// Submit test
router.post('/tests/submit', authenticateJWT, submitTest);

module.exports = router;
