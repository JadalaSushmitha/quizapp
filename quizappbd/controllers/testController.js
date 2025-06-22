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
      "SELECT question_id, question_text, question_type, correct_answer, explanation, marks FROM questions WHERE test_id = ? ORDER BY question_id ASC",
      [test.test_id]
    );

    const questionsForFrontend = [];
    for (let i = 0; i < questionRows.length; i++) {
      const q = { ...questionRows[i] };

      if (["MCQ", "MSQ"].includes(q.question_type)) {
        const optionRows = await executeQuery(
          "SELECT option_id, option_text FROM options WHERE question_id = ? ORDER BY option_id ASC",
          [q.question_id]
        );
        q.options = optionRows;
      } else {
        q.options = [];
      }

      delete q.correct_answer;
      delete q.explanation;
      questionsForFrontend.push(q);
    }

    res.status(200).json({
      test,
      questions: questionsForFrontend,
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
  const { testId, answers, markedForReview, timeTaken } = req.body;
  const userId = req.user.id;

  if (!testId || !answers || typeof answers !== "object") {
    return res.status(400).json({ message: "Invalid submission data" });
  }

  try {
    await executeQuery("START TRANSACTION");

    const responseInserts = []; 

    const questionsData = await executeQuery(
      "SELECT question_id, question_type, correct_answer, marks FROM questions WHERE test_id = ?",
      [testId]
    );

    const correctAnswersMap = new Map();
    const questionTypesMap = new Map();
    const questionMarksMap = new Map();
    const questionOptionsMap = new Map();

    for (const q of questionsData) {
      correctAnswersMap.set(q.question_id, q.correct_answer);
      questionTypesMap.set(q.question_id, q.question_type);
      questionMarksMap.set(q.question_id, q.marks || 0);

      if (["MCQ", "MSQ"].includes(q.question_type)) {
        const options = await executeQuery(
          "SELECT option_id, option_text FROM options WHERE question_id = ? ORDER BY option_id ASC",
          [q.question_id]
        );
        questionOptionsMap.set(q.question_id, options);
      }
    }

    let totalScore = 0;
    let correctCount = 0;
    let attemptedCount = 0;
    let totalMaxMarks = 0;
    let totalNegativeMarks = 0;

    questionsData.forEach(q => {
      totalMaxMarks += (q.marks || 0);
    });

    for (const qId_str in answers) {
      const qId = parseInt(qId_str);
      const userAnswer = answers[qId_str];
      const dbCorrectAnswer = correctAnswersMap.get(qId);
      const questionType = questionTypesMap.get(qId);
      const questionMarks = questionMarksMap.get(qId);
      const questionOptions = questionOptionsMap.get(qId);

      let isAttempted = false;
      let isCorrect = false;
      let marksAwarded = 0;

      if (questionType === "MCQ" || questionType === "NAT") {
        isAttempted = userAnswer !== "" && userAnswer !== null && userAnswer !== undefined;
      } else if (questionType === "MSQ") {
        isAttempted = Array.isArray(userAnswer) && userAnswer.length > 0;
      }

      if (isAttempted) attemptedCount++;

      if (isAttempted && dbCorrectAnswer !== null && dbCorrectAnswer !== undefined) {
        if (questionType === "MCQ") {
          isCorrect = userAnswer.toString().toLowerCase() === dbCorrectAnswer.toString().toLowerCase();
          if (isCorrect) {
            marksAwarded = questionMarks;
          } else {
            if (questionMarks === 1) marksAwarded = -1 / 3;
            else if (questionMarks === 2) marksAwarded = -2 / 3;
            totalNegativeMarks += Math.abs(marksAwarded);
          }
        } else if (questionType === "NAT") {
          isCorrect = parseFloat(userAnswer) === parseFloat(dbCorrectAnswer);
          if (isCorrect) marksAwarded = questionMarks;
        } else if (questionType === "MSQ") {
          const correctOptionsFromDbLabels = [];
          if (dbCorrectAnswer) {
            const labels = dbCorrectAnswer.split(',').map(s => s.trim().toUpperCase());
            labels.forEach(label => {
              const optionIndex = label.charCodeAt(0) - 65;
              if (questionOptions && questionOptions[optionIndex]) {
                correctOptionsFromDbLabels.push(questionOptions[optionIndex].option_text);
              }
            });
          }

          const normalizedCorrectOptions = correctOptionsFromDbLabels.map(s => s.trim().toLowerCase()).sort();
          const normalizedUserOptions = (userAnswer || []).map(s => s.trim().toLowerCase()).sort();

          isCorrect = normalizedCorrectOptions.length === normalizedUserOptions.length &&
            normalizedCorrectOptions.every((val, index) => val === normalizedUserOptions[index]);

          if (isCorrect) marksAwarded = questionMarks;
        }
      }

      if (isCorrect) correctCount++;
      totalScore += marksAwarded;

      const userAnswerForDb = Array.isArray(userAnswer)
        ? userAnswer.join(',')
        : (userAnswer !== null && userAnswer !== undefined ? userAnswer.toString() : null);

      responseInserts.push([
        testId,
        userId,
        qId,
        userAnswerForDb,
        isCorrect,
        markedForReview[qId_str] || false
      ]);
    }

    totalScore = Math.max(0, totalScore);

    const finalPercentage = totalMaxMarks > 0 ? (totalScore / totalMaxMarks) * 100 : 0;

    const resultInsert = await executeQuery(
      `INSERT INTO Test_Results
        (test_id, user_id, score, total_questions, attempted_questions, correct_answers, percentage, submission_time, time_taken_seconds)
        VALUES (?, ?, ?, ?, ?, ?, ?, NOW(), ?)`,
      [
        testId,
        userId,
        totalScore.toFixed(2),
        questionsData.length,
        attemptedCount,
        correctCount,
        finalPercentage.toFixed(2),
        timeTaken
      ]
    );

    const resultId = resultInsert.insertId;

    if (responseInserts.length > 0) {
      const responsesWithResultId = responseInserts.map((row) => [...row, resultId]);

      await executeQuery(
        "INSERT INTO Test_Responses (test_id, user_id, question_id, user_answer, is_correct, marked_for_review, result_id) VALUES ?",
        [responsesWithResultId]
      );
    }

    const [testRow] = await executeQuery("SELECT test_name, course_name FROM tests WHERE id = ?", [testId]);
    const [userRow] = await executeQuery("SELECT full_name, email FROM users WHERE id = ?", [userId]);

    if (testRow && userRow) {
      const subject = `Test Submission Confirmation: ${testRow.test_name}`;
      const body = `
Dear ${userRow.full_name},

Your test for:
Course: ${testRow.course_name}
Test: ${testRow.test_name}

has been successfully submitted.

Your total score is: ${totalScore.toFixed(2)} out of ${totalMaxMarks}
Your percentage is: ${finalPercentage.toFixed(2)}%

Best Regards,
nDMatrix
      `;

      await sendEmail(userRow.email, subject, body);
    }

    await executeQuery("COMMIT");

    res.status(200).json({
      message: "Test submitted successfully!",
      resultId
    });
  } catch (error) {
    await executeQuery("ROLLBACK");
    console.error("Error submitting test:", error);
    res.status(500).json({ message: "Server error during test submission", error: error.message });
  }
};

// Get detailed result by result ID
exports.getDetailedResult = async (req, res) => {
  const { resultId } = req.params;

  try {
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

    const formatTime = (seconds) => {
      if (!seconds) return null;
      const hrs = Math.floor(seconds / 3600);
      const mins = Math.floor((seconds % 3600) / 60);
      const secs = seconds % 60;
      return `${hrs.toString().padStart(2, "0")}:${mins
        .toString()
        .padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
    };

    const total_questions_in_test = result.total_questions;
    const max_possible_marks_for_test = (await executeQuery("SELECT SUM(marks) as total_marks FROM questions WHERE test_id = ?", [result.test_id]))[0].total_marks || 0;

    const [responses] = await db.promise().query(
      `
      SELECT q.question_id, q.question_text, q.correct_answer, q.explanation, q.question_type, q.marks, tr.user_answer, tr.is_correct
      FROM Test_Responses tr
      JOIN questions q ON tr.question_id = q.question_id
      WHERE tr.result_id = ?
      ORDER BY tr.question_id ASC
    `,
      [resultId]
    );

    let calculatedRightMarks = 0;
    let calculatedNegativeMarks = 0;
    let calculatedIncorrectCount = 0;
    let calculatedLeftCount = total_questions_in_test - result.attempted_questions;

    const processedResponses = [];
    for (const response of responses) {
        let questionSpecificMarksAwarded = 0;
        let optionsForQuestion = [];

        if (["MCQ", "MSQ"].includes(response.question_type)) {
            optionsForQuestion = await executeQuery(
                "SELECT option_id, option_text FROM options WHERE question_id = ? ORDER BY option_id ASC",
                [response.question_id]
            );
        }

        if (response.is_correct) {
            calculatedRightMarks += response.marks;
            questionSpecificMarksAwarded = response.marks;
        } else if (response.user_answer !== null && response.user_answer !== '' && (Array.isArray(response.user_answer) ? response.user_answer.length > 0 : true)) {
            calculatedIncorrectCount++;
            if (response.question_type === "MCQ") {
                if (response.marks === 1) {
                    questionSpecificMarksAwarded = -1 / 3;
                    calculatedNegativeMarks += 1 / 3;
                } else if (response.marks === 2) {
                    questionSpecificMarksAwarded = -2 / 3;
                    calculatedNegativeMarks += 2 / 3;
                }
            }
        }

        let displayUserAnswer = response.user_answer;
        let displayCorrectAnswer = response.correct_answer;

        if (response.question_type === "MSQ") {
            displayUserAnswer = response.user_answer ? response.user_answer.split(',').map(s => s.trim()) : [];

            const correctOptionsArray = [];
            if (response.correct_answer) {
                const labels = response.correct_answer.split(',').map(s => s.trim().toUpperCase());
                labels.forEach(label => {
                    const optionIndex = label.charCodeAt(0) - 65;
                    if (optionsForQuestion && optionsForQuestion[optionIndex]) {
                        correctOptionsArray.push(optionsForQuestion[optionIndex].option_text);
                    }
                });
            }
            displayCorrectAnswer = correctOptionsArray;
        }

        processedResponses.push({
            ...response,
            user_answer: displayUserAnswer,
            correct_answer: displayCorrectAnswer,
            marks_awarded_for_this_question: questionSpecificMarksAwarded,
            options: optionsForQuestion
        });
    }

    const time_taken = formatTime(result.time_taken_seconds);

    res.json({
      result: {
        ...result,
        total_questions: total_questions_in_test,
        max_marks: max_possible_marks_for_test,
        right_marks: calculatedRightMarks.toFixed(2),
        negative_marks: calculatedNegativeMarks.toFixed(2),
        score_after_negative: result.score,
        incorrect: calculatedIncorrectCount,
        left: calculatedLeftCount,
        total_time: result.duration,
        time_taken,
      },
      responses: processedResponses,
    });
  } catch (error) {
    console.error("Error fetching detailed result:", error);
    res
      .status(500)
      .json({ message: "Server error while fetching result", error: error.message });
  }
};

// Existing function in your userController.js:
// Ensure this function is correctly implemented in your userRoutes to fetch results for the dashboard.
// It should return result_id, test_id, test_name, score, percentage, and submission_time.
// Example:
// Assuming you have a file like `userRoutes.js` and a `userController.js`
// In userController.js:
// exports.getResultsForUser = async (req, res) => {
//   const userId = req.user.id; // Or req.params.id if you're fetching for a specific user ID from URL
//   try {
//     const results = await executeQuery(
//       `SELECT tr.result_id, tr.test_id, t.test_name, tr.score, tr.percentage, tr.submission_time
//        FROM Test_Results tr
//        JOIN tests t ON tr.test_id = t.id
//        WHERE tr.user_id = ?
//        ORDER BY tr.submission_time DESC`,
//       [userId]
//     );
//     res.status(200).json(results);
//   } catch (error) {
//     console.error("Error fetching user results:", error);
//     res.status(500).json({ message: "Server error fetching user results", error: error.message });
//   }
// };


// NEW ENDPOINT for fetching all results for a specific test (for rank calculation on frontend)
// This will be called by the Dashboard.jsx component for each unique test to get all submissions
// and then calculate rank locally.
exports.getAllResultsForTest = async (req, res) => {
  const { testId } = req.params; // Get testId from URL parameters
  try {
    const results = await executeQuery(
      `SELECT result_id, user_id, score, percentage, submission_time
       FROM Test_Results
       WHERE test_id = ?
       ORDER BY percentage DESC, submission_time ASC`, // Order by percentage, then submission time for ties
      [testId]
    );
    res.status(200).json(results);
  } catch (error) {
    console.error("Error fetching all results for test:", error);
    res.status(500).json({ message: "Server error fetching test results", error: error.message });
  }
};