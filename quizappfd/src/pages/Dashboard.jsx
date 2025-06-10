import { useEffect, useState, useCallback } from "react";
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
  const [loadingResults, setLoadingResults] = useState(true);

  const handleViewReport = useCallback((resultId) => {
    navigate(`/result/${resultId}`);
  }, [navigate]);

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

        setLoadingResults(true);

        const resultRes = await axiosInstance.get(`/users/results/${id}`);
        const userResults = resultRes.data;

        console.log("User's results:", userResults); // Debug 1: Check user's results

        const uniqueTestIds = [...new Set(userResults.map(res => res.test_id))];
        console.log("Unique Test IDs:", uniqueTestIds); // Debug 2: Check unique test IDs

        const allTestResultsMap = new Map();
        for (const testId of uniqueTestIds) {
          try {
            const allResultsRes = await axiosInstance.get(`/tests/${testId}/all-results`);
            allTestResultsMap.set(testId, allResultsRes.data);
            console.log(`All results for test ${testId}:`, allResultsRes.data); // Debug 3: Check all results for each test
          } catch (error) {
            console.error(`Error fetching all results for test ${testId}:`, error);
            allTestResultsMap.set(testId, []);
          }
        }

        const resultsWithRank = userResults.map(userResult => {
          const allResultsForThisTest = allTestResultsMap.get(userResult.test_id) || [];
          console.log(`Processing user result for test ${userResult.test_id}, result_id: ${userResult.result_id}`); // Debug 4: Current user result
          console.log("All results for this specific test from map:", allResultsForThisTest); // Debug 5: Results from map for current test

          const sortedResults = [...allResultsForThisTest].sort((a, b) => {
            if (parseFloat(b.percentage) !== parseFloat(a.percentage)) {
              return parseFloat(b.percentage) - parseFloat(a.percentage);
            }
            return new Date(a.submission_time).getTime() - new Date(b.submission_time).getTime();
          });
          console.log("Sorted results for this test:", sortedResults); // Debug 6: Check sorted results

          // IMPORTANT: Ensure userResult.result_id matches the property name from your backend.
          // If your backend returns 'id' instead of 'result_id' for results, change 'result_id' here.
          const rankIndex = sortedResults.findIndex(
            (r) => r.result_id === userResult.result_id // This comparison is critical
          );
          console.log(`Found rankIndex for result_id ${userResult.result_id}: ${rankIndex}`); // Debug 7: Check found index

          const rank = rankIndex !== -1 ? rankIndex + 1 : 'N/A'; // If not found, it's N/A
          console.log(`Calculated rank for result_id ${userResult.result_id}: ${rank}`); // Debug 8: Final calculated rank

          return { ...userResult, rank: rank };
        });

        setResults(resultsWithRank);
        setLoadingResults(false);

      } catch (error) {
        console.error("Failed to load dashboard data:", error);
        alert(`Failed to load dashboard: ${error.response?.data?.message || error.message}`);
        setLoadingResults(false);
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
              {loadingResults ? (
                <p>Loading results...</p>
              ) : (
                results.length > 0 ? (
                  <table className="results-table">
                    <thead>
                      <tr>
                        <th>Test</th>
                        <th>Score</th>
                        <th>Percentage</th>
                        <th>Rank</th>
                        <th>Submission Time</th>
                        <th>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {results.map(res => (
                        <tr key={res.result_id}>
                          <td>{res.test_name}</td>
                          <td>{res.score}</td>
                          <td>{res.percentage}%</td>
                          <td>{res.rank}</td>
                          <td>
                            {res.submission_time ?
                              new Date(res.submission_time).toLocaleString() :
                              'N/A'
                            }
                          </td>
                          <td>
                            <button onClick={() => handleViewReport(res.result_id)}>
                              View Report
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <p>No results found.</p>
                )
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}