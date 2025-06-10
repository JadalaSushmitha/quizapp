const express = require('express');
const router = express.Router();
const authenticateJWT = require('../middleware/authMiddleware');
const {
  getTestAndQuestions,
  submitTest,
  getDetailedResult,
  getAllResultsForTest // Import the new function
} = require('../controllers/testController');

// Fetch test and its questions
router.get('/tests/:testId/questions', authenticateJWT, getTestAndQuestions);

// Submit test
router.post('/tests/submit', authenticateJWT, submitTest);

// Get all results for a specific test (for rank calculation)
router.get('/tests/:testId/all-results', authenticateJWT, getAllResultsForTest); // NEW ROUTE

module.exports = router;