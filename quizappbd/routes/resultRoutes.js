// quizappbd/routes/resultRoutes.js
const express = require("express");
const router = express.Router();
const { getDetailedResult } = require("../controllers/testController");
const authMiddleware = require("../middleware/authMiddleware");

router.get("/details/:resultId", authMiddleware, getDetailedResult);

module.exports = router;
