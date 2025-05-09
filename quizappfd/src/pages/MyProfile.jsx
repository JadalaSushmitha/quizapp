import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import axiosInstance from "../utils/axiosInstance";
import "./../styles/Dashboard.css";

export default function MyProfile() {
  const { id } = useParams();
  const [user, setUser] = useState(null);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const token = localStorage.getItem("jwtToken");
        if (!token) return;

        const res = await axiosInstance.get(`/users/dashboard/${id}`);
        setUser(res.data.user);
      } catch (error) {
        console.error("Failed to load profile:", error);
      }
    };

    fetchProfile();
  }, [id]);

  if (!user) return <p>Loading profile...</p>;

  return (
    <div className="profile-container">
      <h2>My Profile</h2>
      <img
        src={`http://localhost:5000/uploads/${user.profile_pic}`}
        alt="Profile"
        width="150"
        className="profile-img"
      />
      <p><strong>Name:</strong> {user.full_name}</p>
      <p><strong>Email:</strong> {user.email}</p>
      <p><strong>Phone:</strong> {user.phone}</p>
      <p><strong>College Name:</strong> {user.college_name}</p>
      <p><strong>College ID:</strong> {user.college_id}</p>
    </div>
  );
}
