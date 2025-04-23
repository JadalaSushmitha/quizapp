import { useEffect, useState } from "react";
import { useParams, useLocation, useNavigate } from "react-router-dom";
import axios from "axios";

export default function TestPage() {
  const { testId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const userId = location.state?.userId;
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({});

  useEffect(() => {
    axios.get(`http://localhost:5000/api/tests/${testId}`)
      .then(res => setQuestions(res.data.questions))
      .catch(() => alert("Failed to load test"));
  }, [testId]);

  const handleChange = (qid, value) => {
    setAnswers({ ...answers, [qid]: value });
  };

  const handleSubmit = async () => {
    let score = 0;
    let total = questions.length;

    questions.forEach(q => {
      if (q.answer === answers[q.id]) score++;
    });

    const percentage = ((score / total) * 100).toFixed(2);
    const result = {
      userId,
      testId,
      score,
      percentage,
      rank: 1,
      userAnswers: answers,
    };

    await axios.post("http://localhost:5000/api/users/submit", result);
    navigate(`/result/${userId}`, { state: result });
  };

  return (
    <div>
      <h2>Test Interface</h2>
      {questions.map((q, index) => (
        <div key={q.id}>
          <p>{index + 1}. {q.question}</p>
          {q.type === "MCQ" ? (
            q.options.map((opt, idx) => (
              <label key={idx}>
                <input
                  type="radio"
                  name={q.id}
                  value={opt}
                  onChange={(e) => handleChange(q.id, e.target.value)}
                />
                {opt}
              </label>
            ))
          ) : (
            <input
              type="number"
              placeholder="Enter number"
              onChange={(e) => handleChange(q.id, e.target.value)}
            />
          )}
        </div>
      ))}
      <button onClick={handleSubmit}>Submit Test</button>
    </div>
  );
}
