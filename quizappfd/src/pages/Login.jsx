import React, { useState } from "react";
import axios from "axios";
import "../styles/Login.css";
import { useNavigate } from "react-router-dom";

const Login = ({ setUser }) => {
  const [formData, setFormData] = useState({ email: "", password: "" });
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

      //  Store JWT token
      localStorage.setItem("jwtToken", res.data.token);

      //  Optionally store refresh token (if used)
      localStorage.setItem("refreshToken", res.data.refreshToken);

      //  Save user state in app
      setUser(res.data.user);

      setMessage("Login successful!");

      //  Redirect to user dashboard
      navigate(`/dashboard/${res.data.user.id}`);

    } catch (err) {
      console.error("Login error:", err);
      setMessage(err.response?.data?.error || "Login failed.");
    }
  };

  const handleResendPassword = async () => {
    setResendMsg("");
    setResendError("");
    if (!resendEmail) {
      setResendError("Please enter your email address.");
      return;
    }

    try {
      const res = await axios.post("/api/auth/resend-password", { email: resendEmail });
      setResendMsg(res.data.message);
    } catch (err) {
      setResendError(err.response?.data?.error || "Failed to resend password.");
    }
  };

  return (
    <div className="login-container">
      <h2>Login</h2>
      <form onSubmit={handleSubmit}>
        <div className="input-group">
          <input
            type="email"
            name="email"
            value={formData.email}
            placeholder="Email Address"
            onChange={handleChange}
            required
          />
        </div>
        <div className="input-group">
          <input
            type="password"
            name="password"
            value={formData.password}
            placeholder="Password"
            onChange={handleChange}
            required
          />
        </div>
        <button type="submit">Login</button>
        {message && <p>{message}</p>}
      </form>

      <div className="forgot-password">
        <h3>Forgot your password?</h3>
        <input
          type="email"
          placeholder="Enter your email"
          value={resendEmail}
          onChange={(e) => setResendEmail(e.target.value)}
        />
        <button onClick={handleResendPassword}>Resend Password</button>
        {resendMsg && <p className="success-msg">{resendMsg}</p>}
        {resendError && <p className="error-msg">{resendError}</p>}
      </div>
    </div>
  );
};

export default Login;
