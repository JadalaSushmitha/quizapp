import React, { useState, useEffect } from 'react';
import axios from 'axios';

function SuperSecretAdmin() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [token, setToken] = useState('');
  const [students, setStudents] = useState([]);
  const [results, setResults] = useState([]);
  const [view, setView] = useState('dashboard');

  // New state variables for pagination and detailed results
  const [page, setPage] = useState(1);
  const [totalResults, setTotalResults] = useState(0); // Assuming API will return total count
  const [detailedResult, setDetailedResult] = useState(null);

  const handleLogin = async () => {
    try {
      const res = await axios.post('/api/admin/login-admin', { username, password });
      setToken(res.data.token);
      alert('Admin logged in!');
    } catch (err) {
      alert('Login failed');
    }
  };

  const fetchStudents = async () => {
    try {
      const res = await axios.get('/api/admin/students', {
        headers: { Authorization: `Bearer ${token}` },
      });
      setStudents(res.data);
      setView('students');
    } catch {
      alert('Error fetching students');
    }
  };

  const deleteStudent = async (id) => {
    if (!window.confirm('Are you sure to delete this student?')) return;
    try {
      await axios.delete(`/api/admin/students/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setStudents(students.filter((s) => s.id !== id));
    } catch {
      alert('Failed to delete');
    }
  };

  // Modified fetchResults to include pagination
  const fetchResults = async (pageNumber = 1) => {
    try {
      const res = await axios.get(`/api/admin/results?page=${pageNumber}&limit=10`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setResults(res.data.results || []); // Make sure it's always an array
      setPage(pageNumber);
      setTotalResults(res.data.totalCount || 0); // Default to 0
      setView('results');
      setDetailedResult(null); // Reset detailed view when fetching new results
    } catch {
      alert('Error fetching results');
    }
  };

  // New function to view detailed results
  const viewResultDetails = async (resultId) => {
    try {
      const res = await axios.get(`/api/results/details/${resultId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setDetailedResult(res.data);
    } catch {
      alert('Failed to fetch result details');
    }
  };

  // Modified logout function to clear new states
  const logout = () => {
    setToken('');
    setView('dashboard');
    setStudents([]);
    setResults([]);
    setDetailedResult(null); // Clear detailed result on logout
    setPage(1); // Reset page on logout
    setTotalResults(0); // Reset totalResults on logout
  };

  // Effect to fetch initial results when token is present and view is 'results'
  useEffect(() => {
    if (token && view === 'results' && results.length === 0 && totalResults === 0) {
      fetchResults(1);
    }
  }, [token, view]);

  if (!token) {
    return (
      <div style={{ padding: '2rem' }}>
        <h2>Admin Login</h2>
        <input placeholder="Username" value={username} onChange={e => setUsername(e.target.value)} /><br />
        <input type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} /><br />
        <button onClick={handleLogin}>Login</button>
      </div>
    );
  }

  return (
    <div style={{ padding: '2rem' }}>
      <h2>Admin Dashboard</h2>
      <button onClick={() => { setView('students'); fetchStudents(); }}>📋 View Students</button>
      <button onClick={() => { setView('results'); fetchResults(); }}>📊 View Results</button>
      <button onClick={logout}>🚪 Logout</button>

      {view === 'students' && (
        <>
          <h3>Registered Students</h3>
          <table border="1" cellPadding="8">
            <thead>
              <tr>
                <th>ID</th>
                <th>Name</th>
                <th>Email</th>
                <th>Phone</th>
                <th>College</th>
                <th>College ID</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {students.map((s) => (
                <tr key={s.id}>
                  <td>{s.id}</td>
                  <td>{s.full_name}</td>
                  <td>{s.email}</td>
                  <td>{s.phone}</td>
                  <td>{s.college_name}</td>
                  <td>{s.college_id}</td>
                  <td><button onClick={() => deleteStudent(s.id)}>Delete</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}

      {view === 'results' && (
        <>
          <h3>Test Results</h3>
          {detailedResult ? (
            <div>
              <h4>Details for Result ID: {detailedResult.id}</h4>
              <pre>{JSON.stringify(detailedResult, null, 2)}</pre>
              <button onClick={() => setDetailedResult(null)}>Back to Results</button>
            </div>
          ) : (
            <>
              {results.length === 0 ? (
                <p>No results found.</p>
              ) : (
                <>
                  <table border="1" cellPadding="8">
                    <thead>
                      <tr>
                        {/* Only render header if results exist */}
                        {results.length > 0 && Object.keys(results[0]).map((col) => (
                          <th key={col}>{col}</th>
                        ))}
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {results.map((r, i) => (
                        <tr key={r.id || i}>
                          {Object.values(r).map((val, j) => (
                            <td key={j}>{val}</td>
                          ))}
                          <td>
                            <button onClick={() => viewResultDetails(r.id)}>View Details</button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>

                  <div style={{ marginTop: '1rem' }}>
                    <button
                      onClick={() => fetchResults(page - 1)}
                      disabled={page === 1}
                    >
                      Previous
                    </button>
                    <span> Page {page} of {Math.ceil(totalResults / 10)} </span>
                    <button
                      onClick={() => fetchResults(page + 1)}
                      disabled={page * 10 >= totalResults}
                    >
                      Next
                    </button>
                  </div>
                </>
              )}
            </>
          )}
        </>
      )}
    </div>
  );
}

export default SuperSecretAdmin;
