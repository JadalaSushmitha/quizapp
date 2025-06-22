import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axiosInstance from "../utils/axiosInstance";
import "./../styles/Dashboard.css";
import "./../styles/MyProfile.css"; // We'll create this file for profile-specific styles

export default function MyProfile() {
  const { id } = useParams();
  const [user, setUser] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    full_name: "",
    phone: "",
    college_name: "",
    college_id: ""
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ text: "", type: "" });
  const navigate = useNavigate();

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const token = localStorage.getItem("jwtToken");
        if (!token) {
          navigate("/login");
          return;
        }

        const res = await axiosInstance.get(`/users/dashboard/${id}`);
        setUser(res.data.user);
        
        // Initialize form data with user data
        setFormData({
          full_name: res.data.user.full_name,
          phone: res.data.user.phone,
          college_name: res.data.user.college_name,
          college_id: res.data.user.college_id
        });
      } catch (error) {
        console.error("Failed to load profile:", error);
        setMessage({ text: "Failed to load profile", type: "error" });
      }
    };

    fetchProfile();
  }, [id, navigate]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const [profilePreview, setProfilePreview] = useState(null);
  const [profileFile, setProfileFile] = useState(null);

  const handleProfilePicChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setProfileFile(file);
      // Create a preview URL for the selected image
      const previewUrl = URL.createObjectURL(file);
      setProfilePreview(previewUrl);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ text: "", type: "" });

    try {
      // Create FormData object to handle file uploads
      const formDataToSend = new FormData();
      formDataToSend.append("full_name", formData.full_name);
      formDataToSend.append("phone", formData.phone);
      formDataToSend.append("college_name", formData.college_name);
      formDataToSend.append("college_id", formData.college_id);
      
      // Only append the profile pic if a new one was selected
      if (profileFile) {
        formDataToSend.append("profile_pic", profileFile);
      }

      const response = await axiosInstance.put(
        `/users/profile/${id}`, 
        formDataToSend,
        {
          headers: {
            "Content-Type": "multipart/form-data"
          }
        }
      );
      
      setUser(response.data.user);
      setMessage({ text: "Profile updated successfully!", type: "success" });
      setIsEditing(false);
      
      // Clean up the preview URL
      if (profilePreview) {
        URL.revokeObjectURL(profilePreview);
        setProfilePreview(null);
      }
      setProfileFile(null);
    } catch (error) {
      console.error("Failed to update profile:", error);
      setMessage({ 
        text: error.response?.data?.message || "Failed to update profile", 
        type: "error" 
      });
    } finally {
      setLoading(false);
    }
  };

  if (!user) return <p className="loading-message">Loading profile...</p>;

  return (
    <div className="dashboard-wrapper">
      <div className="profile-content-card">
        <h2>My Profile</h2>
        
        {message.text && (
          <div className={`message ${message.type}`}>
            {message.text}
          </div>
        )}
        
        {isEditing && profilePreview ? (
          <div className="profile-pic-container">
            <img
              src={profilePreview}
              alt="Profile Preview"
              className="profile-img-display"
            />
            <button 
              type="button" 
              className="remove-pic-btn"
              onClick={() => {
                URL.revokeObjectURL(profilePreview);
                setProfilePreview(null);
                setProfileFile(null);
              }}
            >
              ✕
            </button>
          </div>
        ) : (
          <img
            src={`http://localhost:5000/uploads/${user.profile_pic}`}
            alt="Profile"
            className="profile-img-display"
          />
        )}
        
        {isEditing ? (
          <form onSubmit={handleSubmit} className="profile-edit-form">
            <div className="form-group profile-pic-upload">
              <label htmlFor="profile_pic">Profile Picture:</label>
              <div className="file-input-container">
                <input
                  type="file"
                  id="profile_pic"
                  name="profile_pic"
                  accept="image/*"
                  onChange={handleProfilePicChange}
                  className="file-input"
                />
                <label htmlFor="profile_pic" className="file-input-label">
                  {profileFile ? profileFile.name : "Choose a new profile picture"}
                </label>
              </div>
            </div>
            
            <div className="form-group">
              <label htmlFor="full_name">Name:</label>
              <input
                type="text"
                id="full_name"
                name="full_name"
                value={formData.full_name}
                onChange={handleInputChange}
                required
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="email">Email:</label>
              <input
                type="email"
                id="email"
                value={user.email}
                disabled
                className="disabled-input"
              />
              <small className="form-text">Email cannot be changed</small>
            </div>
            
            <div className="form-group">
              <label htmlFor="phone">Phone:</label>
              <input
                type="text"
                id="phone"
                name="phone"
                value={formData.phone}
                onChange={handleInputChange}
                required
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="college_name">College Name:</label>
              <input
                type="text"
                id="college_name"
                name="college_name"
                value={formData.college_name}
                onChange={handleInputChange}
                required
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="college_id">College ID:</label>
              <input
                type="text"
                id="college_id"
                name="college_id"
                value={formData.college_id}
                onChange={handleInputChange}
                required
              />
            </div>
            
            <div className="button-group">
              <button 
                type="submit" 
                className="btn-primary" 
                disabled={loading}
              >
                {loading ? "Saving..." : "Save Changes"}
              </button>
              <button 
                type="button" 
                className="btn-secondary" 
                onClick={() => setIsEditing(false)}
                disabled={loading}
              >
                Cancel
              </button>
            </div>
          </form>
        ) : (
          <div className="profile-info">
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
            
            <div className="button-group">
              <button
                onClick={() => setIsEditing(true)}
                className="btn-primary"
              >
                Edit Profile
              </button>
              <button
                onClick={() => navigate(`/dashboard/${id}`)}
                className="btn-secondary"
              >
                Go to Dashboard
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}