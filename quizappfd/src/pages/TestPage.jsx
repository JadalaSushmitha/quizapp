// quizappfd/src/components/TestPage.jsx
import React, { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axiosInstance from "../utils/axiosInstance";
import Numpad from "../components/Numpad"; // Assuming you have this component
import Calculator from "../components/Calculator"; // NEW: Import Calculator component
import "../styles/TestPage.css"; // Make sure to update this CSS file
import Swal from "sweetalert2";

const TestPage = () => {
  const { testId } = useParams();
  const navigate = useNavigate();

  const [test, setTest] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState({}); // Stores answers: { question_id: "selected_option_text" (MCQ/NAT) or ["opt1", "opt2"] (MSQ) }
  const [markedForReview, setMarkedForReview] = useState({});
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [isPaletteCollapsed, setIsPaletteCollapsed] = useState(false);

  // NEW STATE FOR PROFILE POPUP
  const [showProfilePopup, setShowProfilePopup] = useState(false);
  const [userProfile, setUserProfile] = useState(null);
  const profileWidgetRef = useRef(null); // Ref for the profile widget element

  // NEW STATE FOR CALCULATOR VISIBILITY
  const [showCalculator, setShowCalculator] = useState(false); //

  const timerRef = useRef(null);
  const PROFILE_BASE_URL = "http://localhost:5000/uploads/"; // Adjust if your backend serves uploads differently

  // Store startTime in localStorage when the test is loaded
  useEffect(() => {
    localStorage.setItem("testStartTime", Date.now().toString());
  }, []);

  // --- Test Submission Function (Moved to Top to Fix ReferenceError) ---
  const handleSubmitTest = useCallback(
    async (isAutoSubmit = false) => {
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
          answers: userAnswers, // This will now contain arrays for MSQ questions
          markedForReview: markedForReview,
          timeTaken: timeTakenSeconds, // Send timeTaken to backend
        };
        const res = await axiosInstance.post(`/tests/submit`, submissionData);

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
    },
    [test, userAnswers, markedForReview, navigate]
  );

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
          if (q.question_type === "MCQ") {
            initialAnswers[q.question_id] = ""; // Single selection, empty string
          } else if (q.question_type === "MSQ") {
            initialAnswers[q.question_id] = []; // Multiple selection, empty array
          } else if (q.question_type === "NAT") {
            initialAnswers[q.question_id] = null; // Numerical, null
          }
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

  // NEW: Fetch user profile details on component mount
  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        const response = await axiosInstance.get("/users/profile-details"); // New endpoint
        setUserProfile(response.data);
      } catch (error) {
        console.error("Error fetching user profile:", error);
        // Handle error, e.g., show a message or redirect
      }
    };
    fetchUserProfile();
  }, []);

  // NEW: Handle clicks outside the profile popup to close it
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (profileWidgetRef.current && !profileWidgetRef.current.contains(event.target) && showProfilePopup) {
        setShowProfilePopup(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showProfilePopup]);


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

  const handleAnswerChange = useCallback((questionId, value, type) => {
    setUserAnswers((prev) => {
      if (type === "MCQ" || type === "NAT") {
        return { ...prev, [questionId]: value };
      } else if (type === "MSQ") {
        const currentSelections = prev[questionId] || [];
        if (currentSelections.includes(value)) {
          // Deselect if already selected
          return {
            ...prev,
            [questionId]: currentSelections.filter((item) => item !== value),
          };
        } else {
          // Select if not already selected
          return { ...prev, [questionId]: [...currentSelections, value] };
        }
      }
      return prev;
    });
  }, []);

  const handleNumpadInput = useCallback(
    (value) => {
      const q = questions[currentQuestionIndex];
      if (q.question_type === "NAT") {
        let natVal = userAnswers[q.question_id] || "";
        if (value === "C") natVal = ""; // Clear
        else if (value === "B") natVal = natVal.slice(0, -1); // Backspace
        else natVal += value; // Append
        handleAnswerChange(q.question_id, natVal, "NAT");
      }
    },
    [currentQuestionIndex, questions, userAnswers, handleAnswerChange]
  );

  const getCurrentQuestionStatus = useCallback(
    (q) => {
      const ans = userAnswers[q.question_id];
      const isMarked = markedForReview[q.question_id];
      let hasAnswered = false;

      if (q.question_type === "MCQ") {
        hasAnswered = ans !== "";
      } else if (q.question_type === "NAT") {
        hasAnswered = ans !== null && ans !== "";
      } else if (q.question_type === "MSQ") {
        hasAnswered = Array.isArray(ans) && ans.length > 0;
      }

      if (hasAnswered) {
        return isMarked ? "answered-and-marked-for-review" : "answered";
      }
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
      [questions[currentQuestionIndex].question_id]: false, // Unmark if previously marked
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
    let clearedValue;
    if (q.question_type === "MCQ") {
      clearedValue = "";
    } else if (q.question_type === "MSQ") {
      clearedValue = [];
    } else if (q.question_type === "NAT") {
      clearedValue = null;
    }
    setUserAnswers((prev) => ({
      ...prev,
      [q.question_id]: clearedValue,
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

  // NEW: Function to toggle calculator visibility
  const toggleCalculator = useCallback(() => { //
    setShowCalculator((prev) => !prev); //
  }, []); //


  const totalQuestions = questions.length;
  const answeredQuestionsCount = Object.values(userAnswers).filter(
    (ans, index) => {
      const q = questions[index]; // Make sure q is defined here
      if (!q) return false; // Handle cases where question might not exist at index

      if (q.question_type === "MCQ") {
        return ans !== "";
      } else if (q.question_type === "NAT") {
        return ans !== null && ans !== "";
      } else if (q.question_type === "MSQ") {
        return Array.isArray(ans) && ans.length > 0;
      }
      return false;
    }
  ).length;

  const progressPercentage = totalQuestions > 0 ? (answeredQuestionsCount / totalQuestions) * 100 : 0;


  if (!test || questions.length === 0) {
    return (
      <div className="test-loading">
        <p>Loading test, please wait...</p>
        <div className="spinner"></div>
      </div>
    );
  }

  const currentQuestion = questions[currentQuestionIndex];

  return (
    <div className="test-page-container">
      <header className="test-header">
        <div className="header-left">
          <div className="test-title">
            {test.course_name} - {test.test_name}
          </div>
          <div className="test-welcome-message">
            Good luck, {userProfile?.full_name?.split(' ')[0] || 'examinee'}!
          </div>
        </div>
        <div className="header-right">
          <div className="test-timer">
            Time Left:{" "}
            <span className={timeRemaining <= 600 ? "time-critical" : ""}>
              {formatTime(timeRemaining)}
            </span>
          </div>
          {/* MODIFIED: User Profile Display for hover and click */}
          {userProfile && (
            <div
              className="user-profile-widget"
              ref={profileWidgetRef} // Attach ref here
              onMouseEnter={() => setShowProfilePopup(true)} // Show on hover
              onMouseLeave={() => setShowProfilePopup(false)} // Hide on mouse leave
              onClick={() => setShowProfilePopup(prev => !prev)} // Toggle on click for mobile/touch
            >
              <img
                src={userProfile.profile_pic ? `${PROFILE_BASE_URL}${userProfile.profile_pic}` : "/default-avatar.png"} // Provide a default if no pic
                alt="Profile"
                className="user-profile-pic"
              />
              <span className="user-profile-name">{userProfile.full_name}</span>

              {/* Popup is rendered based on showProfilePopup state */}
              {showProfilePopup && (
                <div className="profile-popup">
                  <img
                    src={userProfile.profile_pic ? `${PROFILE_BASE_URL}${userProfile.profile_pic}` : "/default-avatar.png"}
                    alt="Profile"
                    className="profile-popup-pic"
                  />
                  <p><strong>Name:</strong> {userProfile.full_name}</p>
                  <p><strong>Email:</strong> {userProfile.email}</p>
                  <p><strong>Roll No:</strong> {userProfile.college_id}</p>
                </div>
              )}
            </div>
          )}
          {/* NEW: Calculator Toggle Button */}
          <button onClick={toggleCalculator} className="calculator-toggle-button"> {/* */}
            {showCalculator ? 'Hide Calculator' : 'Show Calculator'} {/* */}
          </button> {/* */}
        </div>
        {/* Progress Bar */}
        <div className="progress-bar-container">
          <div className="progress-bar" style={{ width: `${progressPercentage}%` }}></div>
        </div>
      </header>

      <div className="test-main-content">
        <div className={`question-panel ${isPaletteCollapsed ? "expanded" : ""}`}>
          <div className="question-info">
            <span className="question-number">Question No. {currentQuestionIndex + 1}</span>
            <span className="question-type-display">Type: {currentQuestion.question_type}</span>
            {/* Display Marks: Added a fallback for 'N/A' if marks are not present */}
            <span className="question-marks-display">
              Marks: {currentQuestion.marks !== undefined && currentQuestion.marks !== null ? currentQuestion.marks : 'N/A'}
            </span>
          </div>
          <div className="question-text">{currentQuestion.question_text}</div>

          {/* Render options based on question type */}
          {(currentQuestion.question_type === "MCQ" || currentQuestion.question_type === "MSQ") && (
            <div className="options-container">
              {/* IMPORTANT: For MSQ options to display, currentQuestion.options MUST be an array of objects
                          e.g., currentQuestion.options = [{ option_id: '...', option_text: 'Opt A' }, ...]
                          If 'options' is null/undefined/empty for an MSQ from the backend, nothing will render here.
                        */}
              {currentQuestion.options && currentQuestion.options.map((opt, i) => (
                <label key={opt.option_id || i} className="option-label">
                  <input
                    type={currentQuestion.question_type === "MCQ" ? "radio" : "checkbox"}
                    name={`question-${currentQuestion.question_id}`}
                    value={opt.option_text}
                    checked={
                      currentQuestion.question_type === "MCQ"
                        ? userAnswers[currentQuestion.question_id] === opt.option_text
                        : (userAnswers[currentQuestion.question_id] || []).includes(opt.option_text)
                    }
                    onChange={() =>
                      handleAnswerChange(
                        currentQuestion.question_id,
                        opt.option_text,
                        currentQuestion.question_type
                      )
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

          {/* MODIFIED: Ensure buttons stay on one line.
                This is primarily controlled by CSS, but the flex container here helps. */}
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
              {/* This is the container that will have its own scrollbar */}
              <div className="question-grid-container"> {/* NEW: Wrapper for scrollbar */}
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
      {/* NEW: Calculator component, conditionally rendered and positioned */}
      {showCalculator && ( //
        <div className="calculator-container-wrapper"> {/* */}
          <Calculator /> {/* */}
        </div> //
      )}
    </div>
  );
};

export default TestPage;