import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axiosInstance from "../utils/axiosInstance"; // ✅ Import reusable instance

export default function Dashboard() {
  const { id } = useParams(); // user ID from route
  const [tests, setTests] = useState([]);
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

  // Fetch user's dashboard info on mount
  useEffect(() => {
    const fetchDashboardData = async () => {
      const token = localStorage.getItem('jwtToken'); // ✅ Still check if token exists
      if (!token) {
        navigate("/login"); // ⛔ Unauthorized users redirected
        return;
      }

      try {
        const res = await axiosInstance.get(`/users/dashboard/${id}`); // ✅ No need to manually add token
        setTests(res.data.tests);
        setUser(res.data.user);
      } catch (error) {
        alert("Failed to load dashboard data");
      }
    };

    fetchDashboardData();
  }, [id, navigate]);

  return (
    <div className="dashboard-container">
      <header style={{ padding: '1rem', backgroundColor: '#f0f0f0' }}>
        <h2>Welcome, {user?.full_name || "Student"}</h2>
        <p>Enrolled Tests:</p>
      </header>

      <main style={{ padding: '1rem' }}>
        {tests.length > 0 ? (
          <ul style={{ listStyle: 'none', padding: 0 }}>
            {tests.map(test => (
              <li key={test.id} style={{
                border: "1px solid #ccc",
                marginBottom: "1rem",
                padding: "1rem",
                borderRadius: "8px"
              }}>
                <h4>{test.test_name}</h4>
                <p>Course: {test.course_name}</p>
                <button
                  onClick={() => navigate(`/test/${test.id}`, {
                    state: { userId: id }
                  })}
                  style={{
                    padding: "0.5rem 1rem",
                    backgroundColor: "#4caf50",
                    color: "#fff",
                    border: "none",
                    borderRadius: "5px",
                    cursor: "pointer"
                  }}
                >
                  Start Test
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <p>No tests assigned yet.</p>
        )}
      </main>
    </div>
  );
}
