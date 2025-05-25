const db = require("../models/db");
const { sendEmail } = require("./userController");

// Helper for executing pooled queries
const executeQuery = (query, params) =>
  new Promise((resolve, reject) => {
    db.query(query, params, (err, results) => {
      if (err) reject(err);
      else resolve(results);
    });
  });

// Get a specific test and its questions
exports.getTestAndQuestions = async (req, res) => {
  const { testId } = req.params;

  try {
    const testRows = await executeQuery(
      "SELECT id AS test_id, test_name, course_name, duration FROM tests WHERE id = ?",
      [testId]
    );

    if (testRows.length === 0) {
      return res.status(404).json({ message: "Test not found" });
    }

    const test = testRows[0];

    const questionRows = await executeQuery(
      "SELECT question_id, question_text, question_type, correct_answer, explanation FROM questions WHERE test_id = ? ORDER BY question_id ASC",
      [test.test_id]
    );

    for (let i = 0; i < questionRows.length; i++) {
      if (questionRows[i].question_type === "MCQ") {
        const optionRows = await executeQuery(
          "SELECT option_id, option_text FROM options WHERE question_id = ? ORDER BY option_id ASC",
          [questionRows[i].question_id]
        );
        questionRows[i].options = optionRows;
      } else {
        questionRows[i].options = [];
      }

      // Remove sensitive fields before sending to frontend
      delete questionRows[i].correct_answer;
      delete questionRows[i].explanation;
    }

    res.status(200).json({
      test,
      questions: questionRows,
    });
  } catch (error) {
    console.error("Error fetching test and questions:", error);
    res.status(500).json({
      message: "Server error while fetching test data",
      error: error.message,
      stack: error.stack,
    });
  }
};

// Submit test answers
exports.submitTest = async (req, res) => {
  const { testId, answers, markedForReview, timeTaken } = req.body; // Get timeTaken from req.body
  const userId = req.user.id;

  if (!testId || !answers || typeof answers !== "object") {
    return res.status(400).json({ message: "Invalid submission data" });
  }

  try {
    await executeQuery("START TRANSACTION");

    const questionsData = await executeQuery(
      "SELECT question_id, question_type, correct_answer FROM questions WHERE test_id = ?",
      [testId]
    );

    const correctAnswersMap = new Map();
    const questionTypesMap = new Map();

    questionsData.forEach((q) => {
      correctAnswersMap.set(q.question_id, q.correct_answer);
      questionTypesMap.set(q.question_id, q.question_type);
    });

    let score = 0;
    let correctCount = 0;
    let attemptedCount = 0;
    const totalQuestions = questionsData.length;

    const responseInserts = [];

    for (const qId in answers) {
      const userAnswer = answers[qId];
      const correctAnswer = correctAnswersMap.get(parseInt(qId));
      const questionType = questionTypesMap.get(parseInt(qId));

      const isAttempted = userAnswer !== "" && userAnswer !== null && userAnswer !== undefined;
      if (isAttempted) attemptedCount++;

      let isCorrect = false;
      if (isAttempted && correctAnswer !== null && correctAnswer !== undefined) {
        isCorrect =
          questionType === "NAT"
            ? parseFloat(userAnswer) === parseFloat(correctAnswer)
            : userAnswer.toString().toLowerCase() ===
              correctAnswer.toString().toLowerCase();
      }

      if (isCorrect) {
        score += 1;
        correctCount++;
      }

      responseInserts.push([
        testId,
        userId,
        parseInt(qId),
        isAttempted ? userAnswer.toString() : null,
        isCorrect,
        markedForReview[qId] || false,
      ]);
    }

    // Insert test result first to get result_id, including time_taken_seconds
    const resultInsert = await executeQuery(
      `INSERT INTO Test_Results
       (test_id, user_id, score, total_questions, attempted_questions, correct_answers, percentage, submission_time, time_taken_seconds)
       VALUES (?, ?, ?, ?, ?, ?, ?, NOW(), ?)`,
      [
        testId,
        userId,
        score,
        totalQuestions,
        attemptedCount,
        correctCount,
        totalQuestions > 0 ? (score / totalQuestions) * 100 : 0,
        timeTaken, // Include timeTaken here
      ]
    );

    const resultId = resultInsert.insertId;

    // Now insert Test_Responses with result_id to link answers to this attempt
    if (responseInserts.length > 0) {
      // Add resultId to each response record
      const responsesWithResultId = responseInserts.map((row) => [
        ...row,
        resultId,
      ]);

      await executeQuery(
        "INSERT INTO Test_Responses (test_id, user_id, question_id, user_answer, is_correct, marked_for_review, result_id) VALUES ?",
        [responsesWithResultId]
      );
    }

    const [testRow] = await executeQuery(
      "SELECT test_name, course_name FROM tests WHERE id = ?",
      [testId]
    );
    const [userRow] = await executeQuery(
      "SELECT full_name, email FROM users WHERE id = ?",
      [userId]
    );

    if (testRow && userRow) {
      const subject = `Test Submission Confirmation: ${testRow.test_name}`;
      const body = `
Dear ${userRow.full_name},

Your test for:
Course: ${testRow.course_name}
Test: ${testRow.test_name}

has been successfully submitted.

You can view your results on the portal.

Best Regards,
nDMatrix
      `;

      await sendEmail(userRow.email, subject, body);
    }

    await executeQuery("COMMIT");

    res.status(200).json({
      message: "Test submitted successfully!",
      resultId,
    });
  } catch (error) {
    await executeQuery("ROLLBACK");
    console.error("Error submitting test:", error);
    res
      .status(500)
      .json({ message: "Server error during test submission", error: error.message });
  }
};

// Get detailed result by result ID
exports.getDetailedResult = async (req, res) => {
  const { resultId } = req.params;

  try {
    // Step 1: Fetch test result with test and user info, including time_taken_seconds
    const [resultRows] = await db.promise().query(
      `
      SELECT r.*,
             t.test_name, t.course_name, t.duration
      FROM Test_Results r
      JOIN tests t ON r.test_id = t.id
      WHERE r.result_id = ?
    `,
      [resultId]
    );

    if (resultRows.length === 0) {
      return res.status(404).json({ message: "Result not found" });
    }

    const result = resultRows[0];

    // Format time_taken_seconds
    const formatTime = (seconds) => {
      if (!seconds) return null;
      const hrs = Math.floor(seconds / 3600);
      const mins = Math.floor((seconds % 3600) / 60);
      const secs = seconds % 60;
      return `${hrs.toString().padStart(2, "0")}:${mins
        .toString()
        .padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
    };

    // Step 2: Derive additional metrics
    const incorrect = result.attempted_questions - result.correct_answers;
    const left = result.total_questions - result.attempted_questions;
    const max_marks = result.total_questions;
    const right_marks = result.correct_answers * 1; // assuming 1 mark per correct
    const negative_marks = incorrect * 0; // update if negative marking applies

    const time_taken = formatTime(result.time_taken_seconds); // Use the formatTime function here

    // Step 3: Fetch detailed question-level responses
    const [responses] = await db.promise().query(
      `
      SELECT q.question_text, q.correct_answer, q.explanation, tr.user_answer, tr.is_correct
      FROM Test_Responses tr
      JOIN questions q ON tr.question_id = q.question_id
      WHERE tr.result_id = ?
      ORDER BY tr.question_id ASC
    `,
      [resultId]
    );

    // Step 4: Send extended data
    res.json({
      result: {
        ...result,
        incorrect,
        left,
        max_marks,
        right_marks,
        negative_marks,
        total_time: result.duration, // from tests table
        time_taken, // now correctly formatted
      },
      responses,
    });
  } catch (error) {
    console.error("Error fetching detailed result:", error);
    res
      .status(500)
      .json({ message: "Server error while fetching result", error: error.message });
  }
};