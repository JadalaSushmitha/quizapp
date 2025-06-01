import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom"; // Import useNavigate
import axiosInstance from "../utils/axiosInstance";
import "./../styles/Dashboard.css"; // Import the Dashboard.css for consistent styling

export default function MyProfile() {
  const { id } = useParams();
  const [user, setUser] = useState(null);
  const navigate = useNavigate(); // Initialize useNavigate

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const token = localStorage.getItem("jwtToken");
        if (!token) {
          // If no token, redirect to login (or dashboard if that's the entry point)
          navigate("/login"); // Assuming a login route
          return;
        }

        const res = await axiosInstance.get(`/users/dashboard/${id}`);
        setUser(res.data.user);
      } catch (error) {
        console.error("Failed to load profile:", error);
        // Optionally, handle specific errors, e.g., if user not found or unauthorized
        // navigate('/dashboard'); // Or navigate to an error page
      }
    };

    fetchProfile();
  }, [id, navigate]); // Add navigate to dependency array

  if (!user) return <p className="loading-message">Loading profile...</p>; // Added a class for potential styling

  return (
    // Wrap the profile-container with dashboard-wrapper for consistent background and overall layout
    <div className="dashboard-wrapper">
      {/* This new div will hold the profile content and apply the glassmorphism card style */}
      <div className="profile-content-card">
        <h2>My Profile</h2>
        <img
          src={`http://localhost:5000/uploads/${user.profile_pic}`}
          alt="Profile"
          width="150"
          className="profile-img-display" // Renamed to avoid conflict with existing .profile-img in Dashboard.css
        />
        <p>
          <strong>Name:</strong> {user.full_name}
        </p>
        <p>
          <strong>Email:</strong> {user.email}
        </p>
        <p>
          <strong>Phone:</strong> {user.phone}
        </p>
        <p>
          <strong>College Name:</strong> {user.college_name}
        </p>
        <p>
          <strong>College ID:</strong> {user.college_id}
        </p>
        {/* Button to redirect to dashboard */}
        <button
          onClick={() => navigate(`/dashboard/${id}`)} // Assuming dashboard route is /dashboard/:id
          className="btn-primary mt-3" // Add some utility classes for styling
        >
          Go to Dashboard
        </button>
      </div>
    </div>
  );
}