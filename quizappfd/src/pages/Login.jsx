import React, { useState } from "react";
import axios from "axios";
import "../styles/Login.css";
import { useNavigate, Link } from "react-router-dom"; // Import Link for navigation

const Login = ({ setUser }) => {
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [rememberMe, setRememberMe] = useState(false); // State for "Remember me"
  const [message, setMessage] = useState("");
  const [resendEmail, setResendEmail] = useState("");
  const [resendMsg, setResendMsg] = useState("");
  const [resendError, setResendError] = useState("");

  const navigate = useNavigate();

  const handleChange = (e) =>
    setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const res = await axios.post("http://localhost:5000/api/auth/login", formData);

      // Store JWT token
      localStorage.setItem("jwtToken", res.data.token);
      localStorage.setItem("refreshToken", res.data.refreshToken);

      // Save user state in app
      setUser(res.data.user);

      setMessage("Login successful!");
      navigate(`/dashboard/${res.data.user.id}`);

    } catch (err) {
      console.error("Login error:", err);
      setMessage(err.response?.data?.error || "Login failed.");
    }
  };

  // Note: The handleResendPassword is for a "Resend Password" *button* functionality,
  // whereas the image shows a "Forgot Password" *link*.
  // I'm keeping the existing resend password functionality but placing it
  // within a conditional render or a separate modal if you prefer.
  // For now, I'll assume "Forgot Password" link navigates to a separate page or triggers a modal.
  // If you want the email input and resend button directly visible like before,
  // we'll need to adjust the UI to match the image's aesthetic for "Forgot Password" link
  // while still allowing the resend functionality.
  // For the current task, I will remove the immediate visibility of the resend password
  // section and assume 'Forgot Password' navigates. If you need it back, let me know.

  return (
    <div className="login-page-wrapper">
      {/* You can add a dummy div here if you want to use .second-blob::before pseudo-element */}
      {/* <div className="second-blob"></div> */}
      <div className="login-container">
        <h2>Login Here</h2> {/* Changed heading */}
        <form onSubmit={handleSubmit}>
          <div className="input-group">
            <label htmlFor="email">Email:</label> {/* Added label */}
            <input
              type="email"
              id="email" // Added id for label association
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
            />
            <span className="icon email-icon"></span> {/* Email icon placeholder */}
          </div>
          <div className="input-group">
            <label htmlFor="password">Password:</label> {/* Added label */}
            <input
              type="password"
              id="password" // Added id for label association
              name="password"
              value={formData.password}
              onChange={handleChange}
              required
            />
            <span className="icon password-icon"></span> {/* Password icon placeholder */}
          </div>
          <div className="options-group"> {/* New div for remember me and forgot password */}
            <div className="remember-me">
              <input
                type="checkbox"
                id="rememberMe"
                checked={rememberMe}
                onChange={() => setRememberMe(!rememberMe)}
              />
              <label htmlFor="rememberMe">Remember me</label>
            </div>
            <Link to="/forgot-password" className="forgot-password-link">
              Forgot Password
            </Link>
          </div>
          <button type="submit">Log In</button> {/* Changed button text */}
          {message && <p className={message.includes("successful") ? "success-msg" : "error-msg"}>{message}</p>}
        </form>

        {/* Removed the direct "Forgot your password?" section as per image,
            assuming the link handles navigation. If you need this functionality
            back and visible, we can re-integrate it, perhaps in a modal. */}

        <div className="register-link-container"> {/* New div for register link */}
          <p>Don't have an account? <Link to="/register" className="register-link">register</Link></p>
        </div>
      </div>
    </div>
  );
};

export default Login;