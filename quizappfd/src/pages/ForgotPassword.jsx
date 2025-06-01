// src/components/ForgotPassword.jsx
import React, { useState } from "react";
import axios from "axios";
import { Link } from "react-router-dom"; // Import Link for navigation
import "../styles/ForgotPassword.css"; // Ensure this path is correct

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleForgotPasswordSubmit = async (e) => {
    e.preventDefault(); // Prevent default form submission behavior

    setMessage(""); // Clear any previous success messages
    setError("");   // Clear any previous error messages

    // Basic client-side validation for email
    if (!email) {
      setError("Please enter your email address.");
      return;
    }

    setIsLoading(true); // Set loading state to true while the request is in progress

    try {
      // Your backend endpoint for generating and sending a new system-generated password
      // Based on your previous Login.jsx, this was '/api/auth/resend-password'
      // Confirm this endpoint actually generates a *new* password on your backend.
      const res = await axios.post("http://localhost:5000/api/auth/resend-password", { email });

      // Display the success message from the backend, or a default one
      setMessage(res.data.message || "A new password has been sent to your email!");
      setEmail(""); // Optionally clear the email input field after successful submission
    } catch (err) {
      // Handle errors from the API call
      console.error("Forgot password error:", err);
      // Display a user-friendly error message, falling back to a generic one
      setError(err.response?.data?.error || "Failed to send new password. Please try again.");
    } finally {
      setIsLoading(false); // Reset loading state to false once the request is complete
    }
  };

  return (
    // Outer wrapper for background and centering, matching login/register pages
    <div className="forgot-password-page-wrapper">
      {/* Optional: Add decorative blobs if desired, similar to login/register */}
      {/* <div className="second-blob"></div> */}

      {/* Main glassmorphism container for the form */}
      <div className="forgot-password-container">
        <h2>Forgot Password?</h2>
        <p>
          Enter your email address below and we'll send you a system-generated password to your email.
        </p>

        <form onSubmit={handleForgotPasswordSubmit}>
          <div className="input-group"> {/* Wrapper for label and input */}
            <label htmlFor="email">Email:</label> {/* Label for accessibility and styling */}
            <input
              type="email"
              id="email" // Link id to label's htmlFor
              name="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Your Email Address"
              required
              disabled={isLoading} // Disable input while loading
              aria-describedby="email-error email-success" // For accessibility
            />
          </div>

          <button type="submit" disabled={isLoading}>
            {isLoading ? "Sending..." : "Send New Password"} {/* Dynamic button text */}
          </button>
        </form>

        {/* Display success or error messages, using classes that match CSS */}
        {message && <p className="success-msg" id="email-success">{message}</p>}
        {error && <p className="error-msg" id="email-error">{error}</p>}

        {/* Links container at the bottom, matching styling from other pages */}
        <div className="forgot-password-links-container">
          <p>
            Remembered your password?{" "}
            <Link to="/login" className="login-link"> {/* Link to login page */}
              Log In
            </Link>
          </p>
          <p>
            Don't have an account?{" "}
            <Link to="/register" className="register-link"> {/* Link to register page */}
              Register
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;