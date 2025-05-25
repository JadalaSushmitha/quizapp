import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axiosInstance from "../utils/axiosInstance";
import "./../styles/Dashboard.css";

export default function Dashboard() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("courses");
  const [user, setUser] = useState(null);
  const [courses, setCourses] = useState([]);
  const [results, setResults] = useState([]);

  useEffect(() => {
    const fetchDashboardData = async () => {
    const token = localStorage.getItem("jwtToken");
    if (!token) {
      navigate("/login");
      return;
    }

    try {
      const userRes = await axiosInstance.get(`/users/dashboard/${id}`);
      setUser(userRes.data.user);

      const coursesRes = await axiosInstance.get('/users/courses');
      setCourses(coursesRes.data);

      const resultRes = await axiosInstance.get(`/users/results/${id}`);
      setResults(resultRes.data);
    } catch (error) {
      console.error("Failed to load dashboard data:", error);
      alert(`Failed to load dashboard: ${error.response?.data?.message || error.message}`);
    }
  };


    fetchDashboardData();
  }, [id, navigate]);

  const handleLogout = () => {
    localStorage.removeItem("jwtToken");
    navigate("/login");
  };

  const handleStartTest = (testId) => {
    const url = `${window.location.origin}/instructions/${testId}`;
    window.open(url, '_blank', 'width=1200,height=800');
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
              src={user?.profile_pic ? `http://localhost:5000/uploads/${user.profile_pic}` : '/default-avatar.png'}
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
            <div className="courses-container">
              <h3>Available Tests</h3>
              {courses.length > 0 ? (
                courses.map((course, index) => (
                  <div key={index} className="course-card">
                    <h4>{course.course_name}</h4>
                    {course.tests.length > 0 ? (
                      <ul className="test-list">
                        {course.tests.map(test => (
                          <li key={test.test_id} className="test-item">
                            {test.test_name}
                            <button onClick={() => handleStartTest(test.test_id)}>Start Test</button>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p style={{ color: 'red' }}>No tests available for this course.</p>
                    )}
                  </div>
                ))
              ) : (
                <p>No courses found.</p>
              )}
            </div>
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
                        <td>{res.rank || 'N/A'}</td>
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

  // New handler for viewing detailed report
  const handleViewReport = (resultId) => { // Assuming result_id is available in `res` object
    navigate(`/result/${resultId}`); // This route needs to be defined in App.jsx
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
              src={user?.profile_pic ? `http://localhost:5000/uploads/${user.profile_pic}` : '/default-avatar.png'}
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
            <div className="courses-container">
              <h3>Available Tests</h3>
              {courses.length > 0 ? (
                courses.map((course, index) => (
                  <div key={index} className="course-card">
                    <h4>{course.course_name}</h4>
                    {course.tests.length > 0 ? (
                      <ul className="test-list">
                        {course.tests.map(test => (
                          <li key={test.test_id} className="test-item">
                            {test.test_name}
                            <button onClick={() => handleStartTest(test.test_id)}>Start Test</button>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p style={{ color: 'red' }}>No tests available for this course.</p>
                    )}
                  </div>
                ))
              ) : (
                <p>No courses found.</p>
              )}
            </div>
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
                      <th>Submission Time</th> {/* Added new table header */}
                      <th>Action</th> {/* Added header for the button */}
                    </tr>
                  </thead>
                  <tbody>
                    {results.map(res => (
                      <tr key={res.id}> {/* Assuming 'id' is the unique submission ID */}
                        <td>{res.test_name}</td>
                        <td>{res.score}</td>
                        <td>{res.percentage}%</td>
                        <td>{res.rank || 'N/A'}</td>
                        <td>{new Date(res.submission_time).toLocaleString()}</td> {/* Display submission time */}
                        <td>
                          <button onClick={() => handleViewReport(res.id)}> {/* Assuming res.id is the result_id from your backend */}
                            View Report
                          </button>
                        </td>
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
