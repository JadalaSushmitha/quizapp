// src/pages/Courses.jsx
import React, { useEffect, useState } from 'react';
import axiosInstance from '../utils/axiosInstance';
import '../styles/Dashboard.css';

const Courses = () => {
    const [courses, setCourses] = useState([]);

    useEffect(() => {
        axiosInstance.get('/courses')
            .then(res => setCourses(res.data))
            .catch(err => console.error('Failed to load courses', err));
    }, []);

    const handleStartTest = (testId) => {
        // ✅ Correctly open React route in new tab
        const popupUrl = `${window.location.origin}/instructions/${testId}`;
        window.open(popupUrl, '_blank', 'width=1000,height=700');
    };

    return (
        <div className="courses-container">
            <h2>Available Courses</h2>
            {courses.map((course, index) => (
                <div key={index} className="course-card">
                    <h3>{course.course_name}</h3>
                    {course.tests.length > 0 ? (
                        <ul>
                            {course.tests.map(test => (
                                <li key={test.test_id} className="test-item">
                                    {test.test_name}
                                    <button onClick={() => handleStartTest(test.test_id)}>Start Test</button>
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <p>No tests available</p>
                    )}
                </div>
            ))}
        </div>
    );
};

export default Courses;
