import React, { useState } from 'react';
import axios from 'axios';

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

    const handleChange = (e) => {
        const { name, value, files } = e.target;
        if (files) {
            const file = files[0];
            if (name === 'profile_pic') {
                setFormData((prev) => ({ ...prev, profile_pic: file }));
                setPreviewProfile(URL.createObjectURL(file));
            } else {
                setFormData((prev) => ({ ...prev, college_id_card: file }));
                setPreviewIDCard(URL.createObjectURL(file));
            }
        } else {
            setFormData((prev) => ({ ...prev, [name]: value }));
        }
    };

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

            setTimeout(() => {
                window.location.href = '/login';
            }, 2000);
        } catch (err) {
            setError(err.response?.data?.error || 'Registration failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="register-container">
            <h2 className="register-title">Register for Online Test Portal</h2>
            <form onSubmit={handleSubmit} className="register-form" encType="multipart/form-data">
                <div className="input-group">
                    <input type="text" name="full_name" placeholder="Full Name" required onChange={handleChange} />
                </div>
                <div className="input-group">
                    <input type="email" name="email" placeholder="Email Address" required onChange={handleChange} />
                </div>
                <div className="input-group">
                    <input type="text" name="phone" placeholder="Phone Number" required onChange={handleChange} />
                </div>
                <div className="input-group">
                    <input type="text" name="college_name" placeholder="College Name" required onChange={handleChange} />
                </div>
                <div className="input-group">
                    <input type="text" name="college_id" placeholder="College ID" required onChange={handleChange} />
                </div>

                <div className="input-group">
                    <label>Profile Picture</label>
                    <input type="file" name="profile_pic" accept="image/*" required onChange={handleChange} />
                    {previewProfile && <img src={previewProfile} alt="Profile Preview" />}
                </div>

                <div className="input-group">
                    <label>College ID Card</label>
                    <input type="file" name="college_id_card" accept="image/*" required onChange={handleChange} />
                    {previewIDCard && <img src={previewIDCard} alt="ID Card Preview" />}
                </div>

                <button type="submit" disabled={loading}>
                    {loading ? 'Registering...' : 'Register'}
                </button>
                {msg && <p className="success-msg">{msg}</p>}
                {error && <p className="error-msg">{error}</p>}
            </form>

            <div className="login-redirect">
                <p>Already have an account? <a href="/login">Login here</a></p>
            </div>
        </div>
    );
};

export default Register;
