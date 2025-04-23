import { useLocation } from "react-router-dom";

export default function ResultPage() {
  const { state } = useLocation();

  return (
    <div>
      <h2>Test Results</h2>
      <p><b>Score:</b> {state?.score}</p>
      <p><b>Percentage:</b> {state?.percentage}%</p>
      <p><b>Rank:</b> {state?.rank}</p>

      <h3>Detailed Solutions</h3>
      <ul>
        {state?.userAnswers &&
          Object.entries(state.userAnswers).map(([qid, answer]) => (
            <li key={qid}>
              Question ID: {qid}, Your Answer: {answer}
            </li>
          ))}
      </ul>
    </div>
  );
}
