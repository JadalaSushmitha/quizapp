import React, { useState } from "react";
import axiosInstance from "../utils/axiosInstance";
import '../styles/Dashboard.css'; // Import the Dashboard.css for consistent styling
import { useNavigate } from "react-router-dom"; // Import useNavigate

const ChangePassword = () => {
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("");
  const navigate = useNavigate(); // Initialize useNavigate

  // *** IMPORTANT: Replace '3' with the actual dynamic ID if it's not always '3' ***
  // For example, if you get the user ID from context or a URL parameter:
  // const { userId } = useContext(AuthContext); // Example if you have an AuthContext
  // const { id } = useParams(); // Example if 'id' is a URL parameter in the route rendering this component
  const dashboardId = '3'; // Hardcoding for now, adjust as per your app's logic

  const handleChangePassword = async () => {
    if (newPassword !== confirmPassword) {
      return setMessage("New passwords do not match.");
    }

    const passwordRegex = /^(?=.*[A-Z])(?=.*[a-z])(?=.*[0-9]).{8,}$/;
    if (!passwordRegex.test(newPassword)) {
      return setMessage("Password must contain at least 8 characters, including uppercase, lowercase, and numbers.");
    }

    try {
      const res = await axiosInstance.post("/users/change-password", {
        oldPassword,
        newPassword,
      });

      setMessage(res.data.message);
      // Optionally clear fields on success
      setOldPassword("");
      setNewPassword("");
      setConfirmPassword("");

      // Redirect to dashboard after a short delay to show the success message
      setTimeout(() => {
        // Corrected navigation path to include the ID
        navigate(`/dashboard/${dashboardId}`);
      }, 1500); // Redirect after 1.5 seconds

    } catch (err) {
      setMessage(err.response?.data?.message || "Something went wrong.");
    }
  };

  const handleGoBack = () => {
    // Corrected navigation path to include the ID
    navigate(`/dashboard/${dashboardId}`);
  };

  return (
    // Wrap the change-password-container with dashboard-wrapper
    <div className="dashboard-wrapper">
      <div className="change-password-container">
        <h2>Change Password</h2>
        <input
          type="password"
          placeholder="Old Password"
          value={oldPassword} // Controlled component
          onChange={(e) => setOldPassword(e.target.value)}
        />
        <input
          type="password"
          placeholder="New Password"
          value={newPassword} // Controlled component
          onChange={(e) => setNewPassword(e.target.value)}
        />
        <input
          type="password"
          placeholder="Confirm New Password"
          value={confirmPassword} // Controlled component
          onChange={(e) => setConfirmPassword(e.target.value)}
        />
        <button onClick={handleChangePassword}>Change Password</button>
        <button onClick={handleGoBack} className="go-back-button">Go Back to Dashboard</button> {/* Added a go back button */}
        {message && <p className="message">{message}</p>} {/* Added a class for styling */}
      </div>
    </div>
  );
};

export default ChangePassword;