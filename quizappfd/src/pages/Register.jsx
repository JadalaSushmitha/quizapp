import React, { useState, useEffect } from 'react'; // Import useEffect
import axios from 'axios';
import '../styles/Register.css'; // Import the new CSS file
import { Link } from 'react-router-dom'; // Import Link for proper navigation
import { useNavigate } from 'react-router-dom'; // Import useNavigate for redirection

const Register = () => {
    const [formData, setFormData] = useState({
        full_name: '',
        email: '',
        phone: '',
        college_name: '',
        college_id: '',
        profile_pic: null,
        college_id_card: null
    });

    const [previewProfile, setPreviewProfile] = useState(null);
    const [previewIDCard, setPreviewIDCard] = useState(null);
    const [loading, setLoading] = useState(false);
    const [msg, setMsg] = useState('');
    const [error, setError] = useState('');

    const navigate = useNavigate(); // Initialize useNavigate

    const handleChange = (e) => {
        const { name, value, files } = e.target;
        if (files) {
            const file = files[0];
            // Set the file object in formData
            setFormData((prev) => ({ ...prev, [name]: file }));

            // For file preview
            if (name === 'profile_pic') {
                setPreviewProfile(URL.createObjectURL(file));
            } else if (name === 'college_id_card') {
                setPreviewIDCard(URL.createObjectURL(file));
            }

            // Set the data-file-name attribute for CSS ::after
            // Using a simple conditional check to avoid errors if ref isn't ready
            if (e.target.dataset) { // Check if dataset exists
                e.target.dataset.fileName = file ? file.name : '';
            }

        } else {
            setFormData((prev) => ({ ...prev, [name]: value }));
        }
    };

    // Clean up object URLs when component unmounts or previews change
    useEffect(() => {
        return () => {
            if (previewProfile) URL.revokeObjectURL(previewProfile);
            if (previewIDCard) URL.revokeObjectURL(previewIDCard);
        };
    }, [previewProfile, previewIDCard]);


    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setMsg('');
        setError('');

        const form = new FormData();
        for (const key in formData) {
            form.append(key, formData[key]);
        }

        try {
            const res = await axios.post('/api/auth/register', form, {
                headers: { 'Content-Type': 'multipart/form-data' },
                withCredentials: true
            });

            setMsg(res.data.message);

            // Show email warning alert if email failed
            if (res.data.message?.toLowerCase().includes("failed to send confirmation email")) {
                alert(res.data.message);
            }

            // Redirect after successful registration
            setTimeout(() => {
                navigate('/login'); // Use navigate hook for redirection
            }, 2000);
        } catch (err) {
            setError(err.response?.data?.error || 'Registration failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="register-page-wrapper">
            <div className="register-container">
                <h2 className="register-title">Register for Online Test Portal</h2>
                <form onSubmit={handleSubmit} className="register-form" encType="multipart/form-data">
                    <div className="input-group">
                        <label htmlFor="full_name">Full Name</label>
                        <input type="text" id="full_name" name="full_name" placeholder="Enter your full name" required onChange={handleChange} />
                    </div>
                    <div className="input-group">
                        <label htmlFor="email">Email Address</label>
                        <input type="email" id="email" name="email" placeholder="Enter your email address" required onChange={handleChange} />
                    </div>
                    <div className="input-group">
                        <label htmlFor="phone">Phone Number</label>
                        <input type="tel" id="phone" name="phone" placeholder="Enter your phone number" required onChange={handleChange} />
                    </div>
                    <div className="input-group">
                        <label htmlFor="college_name">College Name</label>
                        <input type="text" id="college_name" name="college_name" placeholder="Enter your college name" required onChange={handleChange} />
                    </div>
                    <div className="input-group">
                        <label htmlFor="college_id">College ID</label>
                        <input type="text" id="college_id" name="college_id" placeholder="Enter your college ID" required onChange={handleChange} />
                    </div>

                    <div className="input-group">
                        <label htmlFor="profile_pic">Profile Picture</label>
                        <input
                            type="file"
                            id="profile_pic"
                            name="profile_pic"
                            accept="image/*"
                            required
                            onChange={handleChange}
                            data-file-name={formData.profile_pic ? formData.profile_pic.name : 'No file chosen'} // Dynamic data attribute
                        />
                        {previewProfile && <img src={previewProfile} alt="Profile Preview" />}
                    </div>

                    <div className="input-group">
                        <label htmlFor="college_id_card">College ID Card</label>
                        <input
                            type="file"
                            id="college_id_card"
                            name="college_id_card"
                            accept="image/*"
                            required
                            onChange={handleChange}
                            data-file-name={formData.college_id_card ? formData.college_id_card.name : 'No file chosen'} // Dynamic data attribute
                        />
                        {previewIDCard && <img src={previewIDCard} alt="ID Card Preview" />}
                    </div>

                    <button type="submit" disabled={loading}>
                        {loading ? 'Registering...' : 'Register'}
                    </button>
                    {msg && <p className="success-msg">{msg}</p>}
                    {error && <p className="error-msg">{error}</p>}
                </form>

                <div className="login-redirect">
                    <p>Already have an account? <Link to="/login">Login here</Link></p>
                </div>
            </div>
        </div>
    );
};

export default Register;