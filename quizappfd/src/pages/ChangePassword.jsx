import React, { useState } from "react";
import axiosInstance from "../utils/axiosInstance";

const ChangePassword = () => {
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("");

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
    } catch (err) {
      setMessage(err.response?.data?.message || "Something went wrong.");
    }
  };

  return (
    <div className="change-password-container">
      <h2>Change Password</h2>
      <input type="password" placeholder="Old Password" onChange={e => setOldPassword(e.target.value)} />
      <input type="password" placeholder="New Password" onChange={e => setNewPassword(e.target.value)} />
      <input type="password" placeholder="Confirm New Password" onChange={e => setConfirmPassword(e.target.value)} />
      <button onClick={handleChangePassword}>Change Password</button>
      <p>{message}</p>
    </div>
  );
};

export default ChangePassword;
