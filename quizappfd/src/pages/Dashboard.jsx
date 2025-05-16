import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axiosInstance from "../utils/axiosInstance";
import "./../styles/Dashboard.css"; 

export default function Dashboard() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("courses");
  const [user, setUser] = useState(null);
  const [tests, setTests] = useState([]);
  const [results, setResults] = useState([]);

  useEffect(() => {
    const fetchDashboardData = async () => {
      const token = localStorage.getItem("jwtToken");
      if (!token) {
        navigate("/login");
        return;
      }

      try {
        const res = await axiosInstance.get(`/users/dashboard/${id}`);
        setUser(res.data.user);
        setTests(res.data.tests);

        const resultRes = await axiosInstance.get(`/users/results/${id}`);
        setResults(resultRes.data);
      } catch (error) {
        alert("Failed to load dashboard");
      }
    };

    fetchDashboardData();
  }, [id, navigate]);

  const handleLogout = () => {
    localStorage.removeItem("jwtToken");
    navigate("/login");
  };

  return (
    <div className="dashboard-wrapper">
      <aside className="sidebar">
        <h3>Menu</h3>
        <button onClick={() => setActiveTab("courses")}>📘 My Courses</button>
        <button onClick={() => setActiveTab("results")}>📊 Results</button>
      </aside>

      <div className="main-content">
        <div className="top-bar">
          <div className="profile-dropdown">
            <img
              src={`http://localhost:5000/uploads/${user?.profile_pic}`} 
              alt="Profile"
              className="profile-img"
            />
            <div className="dropdown">
              <p onClick={() => navigate(`/profile/${id}`)}>My Profile</p>
              <p onClick={() => navigate("/change-password")}>Change Password</p>
              <p onClick={handleLogout}>Logout</p>
            </div>
          </div>
        </div>

        <div className="content-area">
          <h2>Welcome, {user?.full_name}</h2>

          {activeTab === "courses" && (
            <>
              <h3>Available Tests</h3>
              {tests.length > 0 ? (
                <ul className="test-list">
                  {tests.map(test => (
                    <li key={test.id}>
                      <h4>{test.test_name}</h4>
                      <p>Course: {test.course_name}</p>
                      <button
                        onClick={() =>
                          navigate(`/test/${test.id}`, {
                            state: { userId: id },
                          })
                        }
                      >
                        Start Test
                      </button>
                    </li>
                  ))}
                </ul>
              ) : (
                <p>No tests assigned.</p>
              )}
            </>
          )}

          {activeTab === "results" && (
            <>
              <h3>Test Results</h3>
              {results.length > 0 ? (
                <table className="results-table">
                  <thead>
                    <tr>
                      <th>Test</th>
                      <th>Score</th>
                      <th>Percentage</th>
                      <th>Rank</th>
                    </tr>
                  </thead>
                  <tbody>
                    {results.map(res => (
                      <tr key={res.id}>
                        <td>{res.test_name}</td>
                        <td>{res.score}</td>
                        <td>{res.percentage}%</td>
                        <td>{res.rank}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <p>No results found.</p>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
