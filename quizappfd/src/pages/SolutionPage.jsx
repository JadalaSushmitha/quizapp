// src/pages/SolutionPage.jsx
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import axiosInstance from "../utils/axiosInstance";
import "../styles/ResultPage.css";

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
      {responses.map((q, idx) => (
        <div
          key={idx}
          className={`question-block ${q.is_correct ? "correct" : "incorrect"}`}
        >
          <p><strong>Q{idx + 1}.</strong> {q.question_text}</p>

          <p>
            <strong>Correct Answer:</strong>{" "}
            {q.correct_answer !== null && q.correct_answer !== "" ? q.correct_answer : "—"}
          </p>

          <p>
            <strong>Your Answer:</strong>{" "}
            {q.user_answer !== null && q.user_answer !== "" ? q.user_answer : "Not Attempted"}
          </p>

          {q.explanation && (
            <div className="explanation-box">
              <p><strong>Explanation:</strong> {q.explanation}</p>
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

export default SolutionPage;
