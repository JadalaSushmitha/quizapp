import React, { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axiosInstance from "../utils/axiosInstance";
import Numpad from "../components/Numpad";
import "../styles/TestPage.css";
import Swal from "sweetalert2";

const TestPage = () => {
  const { testId } = useParams();
  const navigate = useNavigate();

  const [test, setTest] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState({});
  const [markedForReview, setMarkedForReview] = useState({});
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [isPaletteCollapsed, setIsPaletteCollapsed] = useState(false);

  const timerRef = useRef(null);

  // Store startTime in localStorage when the test is loaded
  useEffect(() => {
    localStorage.setItem("testStartTime", Date.now().toString());
  }, []);

  // --- Test Submission Function (Moved to Top to Fix ReferenceError) ---
  const handleSubmitTest = useCallback(async (isAutoSubmit = false) => {
    if (!isAutoSubmit) {
      const result = await Swal.fire({
        title: "Are you sure?",
        text: "You are about to submit the test. You cannot change answers after submission.",
        icon: "warning",
        showCancelButton: true,
        confirmButtonText: "Yes, submit it!",
        cancelButtonText: "No, continue test",
        customClass: { container: "my-swal-container" },
      });

      if (!result.isConfirmed) return;
    }

    clearInterval(timerRef.current);

    // Calculate time taken
    const endTime = Date.now();
    const startTime = parseInt(localStorage.getItem("testStartTime"), 10);
    const timeTakenSeconds = Math.floor((endTime - startTime) / 1000);

    try {
      const submissionData = {
        testId: test?.test_id,
        answers: userAnswers,
        markedForReview: markedForReview,
        timeTaken: timeTakenSeconds, // Send timeTaken to backend
      };
      const res = await axiosInstance.post(`/tests/submit`, submissionData); // Changed from '/test/submit' to '/tests/submit' (plural)

      // Extract resultId from the response and navigate
      const resultId = res.data.resultId; // This line expects your backend to send a `resultId`
      Swal.fire({
        title: "Success!",
        text: "Test submitted successfully!",
        icon: "success",
        confirmButtonText: "View Results",
      }).then(() => {
        navigate(`/result/${resultId}`); // This is the crucial change for redirection
      });
    } catch (error) {
      console.error("Error submitting test:", error);
      const msg =
        error.response?.data?.message || "Failed to submit test. Try again.";
      Swal.fire("Error", msg, "error");
    }
  }, [test, userAnswers, markedForReview, testId, navigate]);

  // --- Fetch Test Data ---
  useEffect(() => {
    const fetchTestData = async () => {
      try {
        const response = await axiosInstance.get(`/tests/${testId}/questions`);
        const testData = response.data.test;
        const fetchedQuestions = response.data.questions.sort(
          (a, b) => a.question_id - b.question_id
        );
        setTest(testData);
        setQuestions(fetchedQuestions);
        setTimeRemaining(testData.duration * 60);

        const initialAnswers = {};
        const initialMarked = {};
        fetchedQuestions.forEach((q) => {
          initialAnswers[q.question_id] = q.question_type === "MCQ" ? "" : null;
          initialMarked[q.question_id] = false;
        });
        setUserAnswers(initialAnswers);
        setMarkedForReview(initialMarked);
      } catch (error) {
        console.error("Error fetching test data:", error);
        Swal.fire("Error", "Failed to load test. Try again.", "error");
        navigate("/dashboard/courses");
      }
    };

    fetchTestData();
  }, [testId, navigate]);

  // --- Timer Logic ---
  useEffect(() => {
    if (timeRemaining > 0) {
      timerRef.current = setInterval(() => {
        setTimeRemaining((prevTime) => {
          if (prevTime <= 1) {
            clearInterval(timerRef.current);
            handleSubmitTest(true);
            return 0;
          }
          return prevTime - 1;
        });
      }, 1000);
    } else if (timeRemaining === 0 && test) {
      clearInterval(timerRef.current);
      handleSubmitTest(true);
    }

    return () => clearInterval(timerRef.current);
  }, [timeRemaining, test, handleSubmitTest]);

  // --- Utilities ---
  const formatTime = (seconds) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h.toString().padStart(2, "0")}:${m
      .toString()
      .padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  const handleAnswerChange = useCallback((questionId, value) => {
    setUserAnswers((prev) => ({ ...prev, [questionId]: value }));
  }, []);

  const handleNumpadInput = useCallback(
    (value) => {
      const q = questions[currentQuestionIndex];
      if (q.question_type === "NAT") {
        let natVal = userAnswers[q.question_id] || "";
        if (value === "C") natVal = "";
        else if (value === "B") natVal = natVal.slice(0, -1);
        else natVal += value;
        handleAnswerChange(q.question_id, natVal);
      }
    },
    [currentQuestionIndex, questions, userAnswers, handleAnswerChange]
  );

  const getCurrentQuestionStatus = useCallback(
    (q) => {
      const ans = userAnswers[q.question_id];
      const isMarked = markedForReview[q.question_id];
      const hasAnswered =
        (q.question_type === "MCQ" && ans !== "") ||
        (q.question_type === "NAT" && ans !== null && ans !== "");
      if (hasAnswered)
        return isMarked ? "answered-and-marked-for-review" : "answered";
      if (isMarked) return "marked-for-review";
      return currentQuestionIndex >= questions.indexOf(q)
        ? "not-answered"
        : "not-visited";
    },
    [userAnswers, markedForReview, currentQuestionIndex, questions]
  );

  const saveAndProceed = useCallback(() => {
    if (currentQuestionIndex < questions.length - 1)
      setCurrentQuestionIndex((prev) => prev + 1);
  }, [currentQuestionIndex, questions.length]);

  const handleSaveAndNext = useCallback(() => {
    saveAndProceed();
    setMarkedForReview((prev) => ({
      ...prev,
      [questions[currentQuestionIndex].question_id]: false,
    }));
  }, [saveAndProceed, currentQuestionIndex, questions]);

  const handleMarkForReviewAndNext = useCallback(() => {
    const q = questions[currentQuestionIndex];
    setMarkedForReview((prev) => ({
      ...prev,
      [q.question_id]: true,
    }));
    saveAndProceed();
  }, [saveAndProceed, currentQuestionIndex, questions]);

  const handleClearResponse = useCallback(() => {
    const q = questions[currentQuestionIndex];
    setUserAnswers((prev) => ({
      ...prev,
      [q.question_id]: q.question_type === "MCQ" ? "" : null,
    }));
    setMarkedForReview((prev) => ({ ...prev, [q.question_id]: false }));
  }, [currentQuestionIndex, questions]);

  const goToQuestion = useCallback(
    (index) => {
      if (index >= 0 && index < questions.length) setCurrentQuestionIndex(index);
    },
    [questions.length]
  );

  const handlePrevious = useCallback(() => {
    if (currentQuestionIndex > 0) setCurrentQuestionIndex((prev) => prev - 1);
  }, [currentQuestionIndex]);

  const togglePalette = useCallback(() => {
    setIsPaletteCollapsed((prev) => !prev);
  }, []);

  if (!test || questions.length === 0) {
    return (
      <div className="test-loading">
        <p>Loading test, please wait...</p>
      </div>
    );
  }

  const currentQuestion = questions[currentQuestionIndex];

  return (
    <div className="test-page-container">
      <header className="test-header">
        <div className="test-title">
          {test.course_name} - {test.test_name}
        </div>
        <div className="test-timer">
          Time Left:{" "}
          <span className={timeRemaining <= 600 ? "time-critical" : ""}>
            {formatTime(timeRemaining)}
          </span>
        </div>
      </header>

      <div className="test-main-content">
        <div className={`question-panel ${isPaletteCollapsed ? "expanded" : ""}`}>
          <div className="question-header">Question No. {currentQuestionIndex + 1}</div>
          <div className="question-text">{currentQuestion.question_text}</div>

          {currentQuestion.question_type === "MCQ" && (
            <div className="options-container">
              {currentQuestion.options.map((opt, i) => (
                <label key={opt.option_id || i} className="option-label">
                  <input
                    type="radio"
                    name={`question-${currentQuestion.question_id}`}
                    value={opt.option_text}
                    checked={
                      userAnswers[currentQuestion.question_id] === opt.option_text
                    }
                    onChange={() =>
                      handleAnswerChange(currentQuestion.question_id, opt.option_text)
                    }
                  />
                  <span className="option-text">
                    {String.fromCharCode(65 + i)}. {opt.option_text}
                  </span>
                </label>
              ))}
            </div>
          )}

          {currentQuestion.question_type === "NAT" && (
            <div className="nat-input-container">
              <label htmlFor={`nat-answer-${currentQuestion.question_id}`}>
                Enter your numerical answer:
              </label>
              <input
                id={`nat-answer-${currentQuestion.question_id}`}
                type="text"
                className="nat-input"
                value={userAnswers[currentQuestion.question_id] || ""}
                readOnly
              />
              <Numpad onInput={handleNumpadInput} />
            </div>
          )}

          <div className="question-navigation-buttons">
            <button
              onClick={handlePrevious}
              disabled={currentQuestionIndex === 0}
              className="nav-button prev"
            >
              Previous
            </button>
            <button onClick={handleClearResponse} className="nav-button clear">
              Clear Response
            </button>
            <button
              onClick={handleMarkForReviewAndNext}
              className="nav-button mark-review"
            >
              Mark for Review & Next
            </button>
            <button onClick={handleSaveAndNext} className="nav-button save-next">
              Save & Next
            </button>
          </div>
        </div>

        <div className={`question-palette-panel ${isPaletteCollapsed ? "collapsed" : ""}`}>
          <div className="palette-toggle-button" onClick={togglePalette}>
            {isPaletteCollapsed ? "»" : "«"}
          </div>
          {!isPaletteCollapsed && (
            <>
              <div className="palette-header">Question Palette</div>
              <div className="question-grid">
                {questions.map((q, i) => (
                  <div
                    key={q.question_id}
                    className={`question-number-box ${getCurrentQuestionStatus(q)} ${
                      i === currentQuestionIndex ? "active" : ""
                    }`}
                    onClick={() => goToQuestion(i)}
                  >
                    {i + 1}
                  </div>
                ))}
              </div>
              <div className="palette-legend">
                <p>Legend:</p>
                <div className="legend-row">
                  <span className="q-status-box q-status-not-visited"></span>
                  <span>Not Visited</span>
                </div>
                <div className="legend-row">
                  <span className="q-status-box q-status-not-answered"></span>
                  <span>Not Answered</span>
                </div>
                <div className="legend-row">
                  <span className="q-status-box q-status-answered"></span>
                  <span>Answered</span>
                </div>
                <div className="legend-row">
                  <span className="q-status-box q-status-marked-for-review"></span>
                  <span>Marked for Review</span>
                </div>
                <div className="legend-row">
                  <span className="q-status-box q-status-answered-and-marked-for-review"></span>
                  <span>Ans & Marked for Review</span>
                </div>
              </div>
              <button onClick={() => handleSubmitTest()} className="submit-test-button">
                Submit Test
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default TestPage;