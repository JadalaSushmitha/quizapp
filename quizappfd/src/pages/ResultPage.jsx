// src/pages/ResultPage.jsx
import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import axiosInstance from "../utils/axiosInstance";
import "../styles/ResultPage.css";

const ResultPage = () => {
  const { resultId } = useParams();
  const [resultData, setResultData] = useState(null);

  useEffect(() => {
    const fetchResult = async () => {
      try {
        const res = await axiosInstance.get(`/result/details/${resultId}`);
        setResultData(res.data);
      } catch (err) {
        console.error("Failed to load result:", err);
      }
    };

    fetchResult();
  }, [resultId]);

  if (!resultData) return <div className="result-page">Loading result...</div>;

  const { result } = resultData;

  return (
    <div className="result-page">
      <h2>Test Report - {result.test_name}</h2>

      <div className="basic-details">
        <p><strong>Course:</strong> {result.course_name}</p>
        <p><strong>Student:</strong> {result.full_name}</p>
        <p><strong>Score:</strong> {result.score}/{result.total_questions}</p>
        <p><strong>Percentage:</strong> {Number(result.percentage).toFixed(2)}%</p>

        <div className="button-container">
          <Link to={`/solution/${result.result_id}`} className="view-solutions-btn">
            View Detailed Solutions
          </Link>
        </div>
      </div>

      <hr />

      <h3>Performance Summary</h3>
      <div className="report-table-wrapper">
        <table className="metric-table">
          <thead>
            <tr>
              <th>Metric</th>
              <th>Value</th>
            </tr>
          </thead>
          <tbody>
            <tr><td>Total Questions</td><td>{result.total_questions}</td></tr>
            <tr><td>Maximum Marks</td><td>{result.max_marks}</td></tr>
            <tr><td>Total Attempted</td><td>{result.attempted_questions}</td></tr>
            <tr><td>Left Unanswered</td><td>{result.left}</td></tr>
            <tr><td>Correct Answers</td><td>{result.correct_answers}</td></tr>
            <tr><td>Incorrect Answers</td><td>{result.incorrect}</td></tr>
            <tr><td>Total Time (in min)</td><td>{result.total_time}</td></tr>
            <tr><td>Time Taken</td><td>{result.time_taken || "—"}</td></tr>
            <tr><td>Marks from Correct Answers</td><td>{result.right_marks}</td></tr>
            <tr><td>Negative Marks</td><td>{result.negative_marks}</td></tr>
            <tr>
              <td><strong>Total Marks Scored</strong></td>
              <td><strong>{result.score}</strong></td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ResultPage;
