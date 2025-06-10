// src/pages/SolutionPage.jsx
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import axiosInstance from "../utils/axiosInstance";
import "../styles/ResultPage.css"; // Assuming ResultPage.css has relevant styling

const SolutionPage = () => {
  const { resultId } = useParams();
  const [data, setData] = useState(null);

  useEffect(() => {
    const fetchSolution = async () => {
      try {
        const res = await axiosInstance.get(`/result/details/${resultId}`);
        setData(res.data);
      } catch (err) {
        console.error("Failed to fetch detailed solutions", err);
      }
    };

    fetchSolution();
  }, [resultId]);

  if (!data) return <div className="result-page">Loading...</div>;

  const { responses } = data;

  return (
    <div className="result-page">
      <h2>Detailed Solutions</h2>
      {responses.map((q, idx) => {
        // Determine the class for user's selected option(s) for visual feedback
        const getUserOptionClass = (optionText) => {
          if (q.question_type === "MCQ") {
            // For MCQ, q.user_answer is a string
            if (q.is_correct && q.user_answer === optionText) {
              return "user-selected correct-answer-option"; // Correctly selected and correct
            } else if (!q.is_correct && q.user_answer === optionText) {
              return "user-selected incorrect-answer-option"; // Selected but incorrect
            } else if (q.correct_answer === optionText) {
                return "correct-answer-option"; // The correct option
            }
          } else if (q.question_type === "MSQ") {
            // For MSQ, q.user_answer is an array of strings
            const userSelected = (q.user_answer || []).includes(optionText);
            const isCorrectOption = (q.correct_answer || []).includes(optionText);

            if (userSelected && isCorrectOption) {
              return "user-selected correct-answer-option"; // User selected it and it's correct
            } else if (userSelected && !isCorrectOption) {
              return "user-selected incorrect-answer-option"; // User selected it but it's incorrect
            } else if (!userSelected && isCorrectOption) {
                return "correct-answer-option"; // User did NOT select but it's correct
            }
          }
          return ""; // Default
        };

        return (
          <div
            key={idx}
            className={`question-block ${q.is_correct ? "correct" : "incorrect"}`}
          >
            <p>
              <strong>Q{idx + 1}.</strong> {q.question_text} (Marks: {q.marks})
            </p>

            {/* Display Options for MCQ/MSQ */}
            {(q.question_type === "MCQ" || q.question_type === "MSQ") && q.options && q.options.length > 0 && (
              <div className="options-container solution-options">
                {q.options.map((opt, i) => (
                  <div
                    key={opt.option_id || i}
                    className={`option-item ${getUserOptionClass(opt.option_text)}`}
                  >
                    <span className="option-label">{String.fromCharCode(65 + i)}.</span>
                    <span className="option-text">{opt.option_text}</span>
                  </div>
                ))}
              </div>
            )}

            <p>
              <strong>Correct Answer:</strong>{" "}
              {Array.isArray(q.correct_answer)
                ? q.correct_answer.length > 0
                  ? q.correct_answer.join(", ")
                  : "—"
                : q.correct_answer !== null && q.correct_answer !== ""
                ? q.correct_answer
                : "—"}
            </p>

            <p>
              <strong>Your Answer:</strong>{" "}
              {Array.isArray(q.user_answer)
                ? q.user_answer.length > 0
                  ? q.user_answer.join(", ")
                  : "Not Attempted"
                : q.user_answer !== null && q.user_answer !== ""
                ? q.user_answer
                : "Not Attempted"}
            </p>

            {q.explanation && (
              <div className="explanation-box">
                <p><strong>Explanation:</strong> {q.explanation}</p>
              </div>
            )}
            <hr /> {/* Separator between questions */}
          </div>
        );
      })}
    </div>
  );
};

export default SolutionPage;