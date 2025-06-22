// quizappfd/pages/SuperSecretAdmin.jsx
import React, { useState, useEffect } from 'react';
import axiosInstance from '../utils/axiosInstance';
import axios from 'axios'; // Import axios directly for the direct endpoint
import '../styles/SuperSecretAdmin.css';

// Component for a custom confirmation modal
const ConfirmationModal = ({ message, onConfirm, onCancel }) => {
    return (
        <div className="modal-overlay">
            <div className="modal-content">
                <p>{message}</p>
                <div className="modal-actions">
                    <button onClick={onConfirm} className="btn btn-confirm">Yes</button>
                    <button onClick={onCancel} className="btn btn-cancel">No</button>
                </div>
            </div>
        </div>
    );
};

// Component for a custom message display (replaces alert)
const MessagePopup = ({ message, type, onClose }) => {
    if (!message) return null;
    return (
        <div className={`message-popup ${type}`}>
            <span>{message}</span>
            <button onClick={onClose} className="close-btn">&times;</button>
        </div>
    );
};

// Main SuperSecretAdmin Component
function SuperSecretAdmin() {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [token, setToken] = useState(localStorage.getItem('adminToken') || '');
    
    // Admin dashboard states
    const [students, setStudents] = useState([]);
    const [results, setResults] = useState([]);
    const [tests, setTests] = useState([]); 
    const [view, setView] = useState('dashboard'); // 'dashboard', 'students', 'results', 'tests', 'createTest', 'editTest', 'manageQuestions', 'detailedResult', 'profile'
    
    // Admin profile states
    const [adminProfile, setAdminProfile] = useState({
        id: '',
        username: '',
        email: '',
        profile_picture: ''
    });
    const [profileFormData, setProfileFormData] = useState({
        username: '',
        email: ''
    });
    const [passwordFormData, setPasswordFormData] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
    });
    const [profilePicture, setProfilePicture] = useState(null);

    // Pagination and loading states
    const [page, setPage] = useState(1);
    const [totalResults, setTotalResults] = useState(0);
    const [totalPages, setTotalPages] = useState(1);
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');
    const [messageType, setMessageType] = useState('');

    // Detailed result view state
    const [detailedResult, setDetailedResult] = useState(null);

    // Test creation/editing form states
    const [testFormData, setTestFormData] = useState({ 
        id: null, 
        course_name: '',
        test_name: '',
        duration: '' 
    });

    // States for managing questions within a selected test
    const [selectedTest, setSelectedTest] = useState(null); 
    const [questionsForSelectedTest, setQuestionsForSelectedTest] = useState([]);
    const [questionFormData, setQuestionFormData] = useState({ 
        question_text: '',
        question_type: 'MCQ', 
        correct_answer: '',
        correct_answers: [], // Array for MSQ correct answers
        explanation: '',
        marks: '', // Initialize as empty string for number input
        options: [{ option_text: '' }, { option_text: '' }] 
    });
    const [editQuestionId, setEditQuestionId] = useState(null); 


    // Confirmation modal state
    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [confirmAction, setConfirmAction] = useState(null); // { message: string, action: function }

    // Function to show a message
    const showMessage = (msg, type) => {
        setMessage(msg);
        setMessageType(type);
        const timer = setTimeout(() => {
            setMessage('');
            setMessageType('');
        }, 5000);
        return () => clearTimeout(timer);
    };

    // State for forgot password
    const [forgotPasswordEmail, setForgotPasswordEmail] = useState('');
    const [showForgotPassword, setShowForgotPassword] = useState(false);
    
    // Handle Admin Login
    const handleLogin = async (e) => {
        e.preventDefault();
        setLoading(true);
        setMessage('');
        try {
            const res = await axiosInstance.post('/admin/login-admin', { username, password });
            setToken(res.data.token);
            localStorage.setItem('adminToken', res.data.token);
            showMessage('Admin logged in successfully!', 'success');
            // After successful login, explicitly set view to dashboard and fetch initial data
            setView('dashboard');
            fetchStudents();
            fetchResults(1);
            fetchTests();
            setUsername('');
            setPassword('');
        } catch (err) {
            console.error("Login error:", err.response?.data?.message || err.message);
            showMessage(err.response?.data?.message || 'Login failed. Please check your credentials.', 'error');
        } finally {
            setLoading(false);
        }
    };
    
    // Handle Forgot Password
    const handleForgotPassword = async (e) => {
        e.preventDefault();
        if (!forgotPasswordEmail) {
            showMessage('Please enter your email address.', 'error');
            return;
        }
        
        setLoading(true);
        setMessage('');
        
        try {
            const res = await axiosInstance.post('/admin/forgot-password', { email: forgotPasswordEmail });
            showMessage(res.data.message, 'success');
            setForgotPasswordEmail('');
            setShowForgotPassword(false);
        } catch (err) {
            console.error("Forgot password error:", err.response?.data?.message || err.message);
            showMessage(err.response?.data?.message || 'Failed to reset password. Please try again.', 'error');
        } finally {
            setLoading(false);
        }
    };

    // Fetch All Registered Students
    const fetchStudents = async () => {
        setLoading(true);
        setMessage('');
        try {
            const res = await axiosInstance.get('/admin/students');
            setStudents(res.data);
            showMessage('Students data loaded.', 'success');
        } catch (err) {
            console.error("Error fetching students:", err.response?.data?.message || err.message);
            showMessage(err.response?.data?.message || 'Error fetching students.', 'error');
            if (err.response && (err.response.status === 401 || err.response.status === 403)) {
                logout();
            }
        } finally {
            setLoading(false);
        }
    };

    // Delete a Student
    const handleDeleteStudent = (id) => {
        setConfirmAction({
            message: "Are you sure you want to delete this student? This action cannot be undone.",
            action: async () => {
                setLoading(true);
                setMessage('');
                try {
                    await axiosInstance.delete(`/admin/students/${id}`);
                    setStudents(students.filter((s) => s.id !== id));
                    showMessage('Student deleted successfully!', 'success');
                } catch (err) {
                    console.error("Error deleting student:", err.response?.data?.message || err.message);
                    showMessage(err.response?.data?.message || 'Failed to delete student.', 'error');
                    if (err.response && (err.response.status === 401 || err.response.status === 403)) {
                        logout();
                    }
                } finally {
                    setLoading(false);
                    setShowConfirmModal(false);
                }
            }
        });
        setShowConfirmModal(true);
    };

    // Fetch All Test Results with Pagination
    const fetchResults = async (pageNumber = 1) => {
        setLoading(true);
        setMessage('');
        try {
            const res = await axiosInstance.get(`/admin/results?page=${pageNumber}&limit=10`);
            setResults(res.data.results || []);
            setPage(res.data.currentPage);
            setTotalResults(res.data.totalCount);
            setTotalPages(res.data.totalPages);
            showMessage('Test results loaded successfully.', 'success');
        } catch (err) {
            console.error("Frontend: Error fetching results:", err.response?.data?.message || err.message);
            showMessage(err.response?.data?.message || 'Error fetching test results.', 'error');
            if (err.response && (err.response.status === 401 || err.response.status === 403)) {
                logout();
            }
        } finally {
            setLoading(false);
        }
    };

    // View Detailed Result for a Specific Test
    const viewResultDetails = async (resultId) => {
        setLoading(true);
        setMessage('');
        try {
            const res = await axiosInstance.get(`/admin/results/details/${resultId}`);
            setDetailedResult(res.data);
            setView('detailedResult');
            showMessage('Detailed result loaded successfully.', 'success');
        } catch (err) {
            console.error("Error fetching detailed result:", err.response?.data?.message || err.message);
            showMessage(err.response?.data?.message || 'Failed to fetch result details.', 'error');
            if (err.response && (err.response.status === 401 || err.response.status === 403)) {
                logout();
            }
        } finally {
            setLoading(false);
        }
    };

    // Fetch All Tests
    const fetchTests = async () => {
        setLoading(true);
        setMessage('');
        try {
            const res = await axiosInstance.get('/admin/tests');
            setTests(res.data);
            showMessage('Tests loaded successfully.', 'success');
        } catch (err) {
            console.error("Error fetching tests:", err.response?.data?.message || err.message);
            showMessage(err.response?.data?.message || 'Error fetching tests.', 'error');
            if (err.response && (err.response.status === 401 || err.response.status === 403)) {
                logout();
            }
        } finally {
            setLoading(false);
        }
    };

    // Handle Test Form Data Change (for both create and edit)
    const handleTestFormChange = (e) => {
        const { name, value } = e.target;
        // Trim only text inputs, not numbers like duration (handled by parseInt later)
        setTestFormData(prev => ({ 
            ...prev, 
            [name]: (name === 'course_name' || name === 'test_name') ? value.trimStart() : value // Trim start for live input
        }));
    };

    // Handle Create/Update Test Submission
    const handleTestSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setMessage('');

        // Ensure duration is parsed to a number before validation/sending
        const durationValue = parseInt(testFormData.duration, 10);
        if (isNaN(durationValue) || durationValue <= 0) {
            showMessage('Duration must be a positive number.', 'error');
            setLoading(false);
            return;
        }

        // Final trim before sending
        const finalCourseName = testFormData.course_name.trim();
        const finalTestName = testFormData.test_name.trim();

        if (!finalCourseName || !finalTestName) {
            showMessage('Course name and test name are required.', 'error');
            setLoading(false);
            return;
        }

        try {
            if (testFormData.id) {
                // Update existing test
                await axiosInstance.put(`/admin/tests/${testFormData.id}`, {
                    course_name: finalCourseName,
                    test_name: finalTestName,
                    duration: durationValue 
                });
                showMessage('Test updated successfully!', 'success');
            } else {
                // Create new test
                await axiosInstance.post('/admin/tests', {
                    course_name: finalCourseName,
                    test_name: finalTestName,
                    duration: durationValue 
                });
                showMessage('Test created successfully!', 'success');
            }
            
            setTestFormData({ id: null, course_name: '', test_name: '', duration: '' }); // Clear form
            fetchTests(); // Refresh the list of tests
            setView('tests'); // Go back to tests list
        } catch (err) {
            console.error("Error submitting test:", err.response?.data?.message || err.message);
            showMessage(err.response?.data?.message || `Failed to ${testFormData.id ? 'update' : 'create'} test.`, 'error');
            if (err.response && (err.response.status === 401 || err.response.status === 403)) {
                logout();
            }
        } finally {
            setLoading(false);
        }
    };

    // Handle Edit Course: Prepare form data and switch view
    const handleEditTest = (test) => {
        setTestFormData({
            id: test.id,
            course_name: test.course_name,
            test_name: test.test_name,
            duration: parseInt(test.duration, 10) 
        });
        setView('editTest'); // Set view to 'editTest' to show the form
    };

    // Handle Delete Test
    const handleDeleteTest = (testId) => {
        setConfirmAction({
            message: "Are you sure you want to delete this test? All associated questions, results, and responses will also be deleted. This action cannot be undone.",
            action: async () => {
                setLoading(true);
                setMessage('');
                try {
                    await axiosInstance.delete(`/admin/tests/${testId}`);
                    showMessage('Test deleted successfully!', 'success');
                    fetchTests(); // Refresh test list
                } catch (err) {
                    console.error("Error deleting test:", err.response?.data?.message || err.message);
                    showMessage(err.response?.data?.message || 'Failed to delete test.', 'error');
                    if (err.response && (err.response.status === 401 || err.response.status === 403)) {
                        logout();
                    }
                } finally {
                    setLoading(false);
                    setShowConfirmModal(false);
                }
            }
        });
        setShowConfirmModal(true);
    };

    // Function to navigate to Manage Questions for a specific test
    const handleManageQuestions = async (test) => {
        setLoading(true);
        setMessage('');
        try {
            const res = await axiosInstance.get(`/admin/tests/${test.id}`);
            setSelectedTest(res.data); // Stores the entire test object including its questions
            setQuestionsForSelectedTest(res.data.questions || []);
            setView('manageQuestions');
            showMessage(`Questions for "${test.test_name}" loaded.`, 'success');
            // Reset question form when entering manageQuestions view
            setQuestionFormData({
                question_text: '',
                question_type: 'MCQ',
                correct_answer: '',
                correct_answers: [],
                explanation: '',
                marks: '', 
                options: [{ option_text: '' }, { option_text: '' }]
            });
            setEditQuestionId(null);
        } catch (err) {
            console.error("Error fetching questions for test:", err.response?.data?.message || err.message);
            showMessage(err.response?.data?.message || 'Failed to load questions for test.', 'error');
            if (err.response && (err.response.status === 401 || err.response.status === 403)) {
                logout();
            }
        } finally {
            setLoading(false);
        }
    };

    // Handle New Question Form Changes
    const handleQuestionFormChange = (e) => {
        const { name, value } = e.target;
        // Trim only text inputs, not numbers like marks (handled by parseInt later)
        setQuestionFormData(prev => ({ 
            ...prev, 
            [name]: (name === 'question_text' || name === 'correct_answer' || name === 'explanation') ? value.trimStart() : value 
        }));
    };

    // Handle Option Text Change for MCQ
    const handleOptionChange = (index, value) => {
        const updatedOptions = [...questionFormData.options];
        updatedOptions[index].option_text = value.trimStart(); // Trim start for live input
        setQuestionFormData(prev => ({ ...prev, options: updatedOptions }));
    };

    // Add New Option Field
    const handleAddOption = () => {
        setQuestionFormData(prev => ({
            ...prev,
            options: [...prev.options, { option_text: '' }]
        }));
    };

    // Remove Option Field
    const handleRemoveOption = (index) => {
        const updatedOptions = questionFormData.options.filter((_, i) => i !== index);
        setQuestionFormData(prev => ({ ...prev, options: updatedOptions }));
        // If the correct answer was the removed option, clear it
        if (questionFormData.options[index] && questionFormData.correct_answer === questionFormData.options[index].option_text) {
            setQuestionFormData(prev => ({ ...prev, correct_answer: '' }));
        }
    };

    // Handle Create/Update Question Submission
    const handleQuestionSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setMessage('');

        try {
            // Basic validation
            if (!questionFormData.question_text || !questionFormData.question_type || !questionFormData.marks) {
                showMessage('Question text, type, and marks are required.', 'error');
                setLoading(false);
                return;
            }

            // Validate marks
            const marksValue = parseInt(questionFormData.marks, 10);
            if (isNaN(marksValue) || marksValue <= 0) {
                showMessage('Marks must be a positive number.', 'error');
                setLoading(false);
                return;
            }

            // Validate MCQ options
            if (questionFormData.question_type === 'MCQ') {
                const filledOptions = questionFormData.options.filter(opt => opt.option_text && opt.option_text.trim() !== '');
                if (filledOptions.length < 2) {
                    showMessage('MCQ questions require at least two non-empty options.', 'error');
                    setLoading(false);
                    return;
                }
                if (!questionFormData.correct_answer) {
                    showMessage('MCQ questions require a correct option to be selected.', 'error');
                    setLoading(false);
                    return;
                }
            } else if (questionFormData.question_type === 'MSQ') {
                const filledOptions = questionFormData.options.filter(opt => opt.option_text && opt.option_text.trim() !== '');
                if (filledOptions.length < 2) {
                    showMessage('MSQ questions require at least two non-empty options.', 'error');
                    setLoading(false);
                    return;
                }
                if (!questionFormData.correct_answers || !Array.isArray(questionFormData.correct_answers) || questionFormData.correct_answers.length === 0) {
                    showMessage('MSQ questions require at least one correct option to be selected.', 'error');
                    setLoading(false);
                    return;
                }
                
                // Ensure all selected correct answers exist in the options
                const optionTexts = filledOptions.map(opt => opt.option_text.trim());
                const validCorrectAnswers = questionFormData.correct_answers.filter(ans => optionTexts.includes(ans));
                
                if (validCorrectAnswers.length === 0) {
                    showMessage('Selected correct answers must match one of the options.', 'error');
                    setLoading(false);
                    return;
                }
                
                // Update correct_answers to only include valid options
                if (validCorrectAnswers.length !== questionFormData.correct_answers.length) {
                    setQuestionFormData(prev => ({
                        ...prev,
                        correct_answers: validCorrectAnswers
                    }));
                }
            } else if (questionFormData.question_type === 'NAT' && !questionFormData.correct_answer) {
                showMessage('NAT questions require a correct answer.', 'error');
                setLoading(false);
                return;
            }

            // Create simple payload
            let msqCorrectAnswers = [];
            if (questionFormData.question_type === 'MSQ') {
                if (Array.isArray(questionFormData.correct_answers)) {
                    msqCorrectAnswers = questionFormData.correct_answers;
                } else if (typeof questionFormData.correct_answers === 'string') {
                    msqCorrectAnswers = questionFormData.correct_answers.split(',').map(item => item.trim());
                }
            }
            
            // Filter options to only include non-empty ones
            const filteredOptions = (questionFormData.question_type === 'MCQ' || questionFormData.question_type === 'MSQ')
                ? questionFormData.options.filter(opt => opt.option_text && opt.option_text.trim() !== '')
                : [];
            
            const payload = {
                question_text: questionFormData.question_text.trim(),
                question_type: questionFormData.question_type,
                // For MSQ, we'll let the backend handle the conversion to A, B, C format
                correct_answer: questionFormData.question_type !== 'MSQ' ? 
                    (questionFormData.correct_answer ? questionFormData.correct_answer.trim() : '') : '',
                // Include correct_answers for backend to convert to A, B, C format
                correct_answers: questionFormData.question_type === 'MSQ' ? 
                    msqCorrectAnswers : [],
                explanation: questionFormData.explanation ? questionFormData.explanation.trim() : '',
                marks: marksValue,
                options: filteredOptions
            };
            
            // Debug log for MSQ questions
            if (questionFormData.question_type === 'MSQ') {
                console.log("MSQ payload:", {
                    correct_answer: payload.correct_answer,
                    correct_answers: payload.correct_answers,
                    msqCorrectAnswers,
                    options: payload.options
                });
            }

            if (editQuestionId) {
                // Update existing question
                try {
                    console.log("Updating question with payload:", payload);
                    
                    // Use the direct endpoint that bypasses all complex logic
                    const response = await axios.put(
                        `http://localhost:5000/api/direct/update-question/${editQuestionId}`, 
                        payload,
                        { headers: { 'Authorization': `Bearer ${localStorage.getItem('adminToken')}` } }
                    );
                    
                    console.log("Update response:", response.data);
                    showMessage('Question updated successfully!', 'success');
                } catch (updateErr) {
                    console.error("Error updating question:", updateErr.response?.data || updateErr);
                    throw updateErr; // Re-throw to be caught by the outer catch block
                }
            } else {
                // Create new question
                if (!selectedTest || !selectedTest.id) {
                    showMessage('Cannot add question: No test selected. Please select a test first.', 'error');
                    setLoading(false);
                    return;
                }
                
                // Use the direct endpoint that bypasses all complex logic
                const directResponse = await axios.post(
                    `http://localhost:5000/api/direct/add-question/${selectedTest.id}`, 
                    payload,
                    { headers: { 'Authorization': `Bearer ${localStorage.getItem('adminToken')}` } }
                );
                console.log("Direct endpoint response:", directResponse.data);
                showMessage('Question created successfully!', 'success');
            }
            
            // Clear form and reset states
            setQuestionFormData({
                question_text: '',
                question_type: 'MCQ',
                correct_answer: '',
                correct_answers: [],
                explanation: '',
                marks: '',
                options: [{ option_text: '' }, { option_text: '' }]
            });
            setEditQuestionId(null);
            
            // Refresh questions list for the current test
            if (selectedTest) {
                handleManageQuestions(selectedTest);
            }
        } catch (err) {
            console.error("Error submitting question:", err);
            showMessage('Failed to save question. Please try again.', 'error');
            
            if (err.response && (err.response.status === 401 || err.response.status === 403)) {
                logout();
            }
        } finally {
            setLoading(false);
        }
    };

    // Function to start editing a question
    const handleEditQuestion = (question) => {
        console.log("Editing question:", question);
        
        // Parse correct_answers for MSQ if it's stored as a string
        let correctAnswers = [];
        if (question.question_type === 'MSQ') {
            if (question.correct_answers && Array.isArray(question.correct_answers)) {
                correctAnswers = [...question.correct_answers];
                console.log("Using correct_answers array:", correctAnswers);
            } else if (question.correct_answer && typeof question.correct_answer === 'string') {
                // Split the comma-separated string into an array
                correctAnswers = question.correct_answer.split(',').map(item => item.trim());
                
                // Filter out empty strings
                correctAnswers = correctAnswers.filter(answer => answer !== '');
                console.log("Parsed correct_answer string:", correctAnswers);
            }
        }
        
        console.log("MSQ correct answers:", correctAnswers);
        
        setEditQuestionId(question.question_id);
        setQuestionFormData({
            question_text: question.question_text || '',
            question_type: question.question_type || 'MCQ',
            correct_answer: question.correct_answer || '',
            correct_answers: correctAnswers,
            explanation: question.explanation || '',
            marks: question.marks || '', // Ensure marks is handled as a string for input value
            options: (question.question_type === 'MCQ' || question.question_type === 'MSQ')
                     ? (question.options && question.options.length > 0 
                        ? question.options.map(opt => ({ option_text: opt.option_text || '' })) 
                        : [{ option_text: '' }, { option_text: '' }]) 
                     : []
        });
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    // Handle Delete Question
    const handleDeleteQuestion = (questionId) => {
        setConfirmAction({
            message: "Are you sure you want to delete this question? This action cannot be undone.",
            action: async () => {
                setLoading(true);
                setMessage('');
                try {
                    await axiosInstance.delete(`/admin/questions/${questionId}`);
                    showMessage('Question deleted successfully!', 'success');
                    handleManageQuestions(selectedTest); // Refresh questions list
                    if (editQuestionId === questionId) {
                        setEditQuestionId(null);
                        setQuestionFormData({
                            question_text: '',
                            question_type: 'MCQ',
                            correct_answer: '',
                            explanation: '',
                            marks: '',
                            options: [{ option_text: '' }, { option_text: '' }]
                        });
                    }
                } catch (err) {
                    console.error("Error deleting question:", err.response?.data?.message || err.message);
                    showMessage(err.response?.data?.message || 'Failed to delete question.', 'error');
                    if (err.response && (err.response.status === 401 || err.response.status === 403)) {
                        logout();
                    }
                } finally {
                    setLoading(false);
                    setShowConfirmModal(false);
                }
            }
        });
        setShowConfirmModal(true);
    };

    // Admin Logout
    const logout = () => {
        setToken('');
        localStorage.removeItem('adminToken');
        setView('dashboard');
        setStudents([]);
        setResults([]);
        setTests([]); 
        setSelectedTest(null); 
        setQuestionsForSelectedTest([]); 
        setDetailedResult(null);
        setPage(1);
        setTotalResults(0);
        setTotalPages(1);
        showMessage('You have been logged out.', 'success');
    };

    // Fetch Admin Profile
    const fetchAdminProfile = async () => {
        setLoading(true);
        try {
            const res = await axiosInstance.get('/admin/profile');
            setAdminProfile(res.data);
            setProfileFormData({
                username: res.data.username,
                email: res.data.email
            });
        } catch (err) {
            console.error("Error fetching admin profile:", err.response?.data?.message || err.message);
            showMessage(err.response?.data?.message || 'Error fetching profile.', 'error');
            if (err.response && (err.response.status === 401 || err.response.status === 403)) {
                logout();
            }
        } finally {
            setLoading(false);
        }
    };

    // Handle Profile Form Change
    const handleProfileFormChange = (e) => {
        const { name, value } = e.target;
        setProfileFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    // Handle Password Form Change
    const handlePasswordFormChange = (e) => {
        const { name, value } = e.target;
        setPasswordFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    // Handle Profile Picture Change
    const handleProfilePictureChange = (e) => {
        if (e.target.files && e.target.files[0]) {
            setProfilePicture(e.target.files[0]);
        }
    };

    // Update Admin Profile
    const handleUpdateProfile = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const res = await axiosInstance.put('/admin/profile', profileFormData);
            showMessage(res.data.message, 'success');
            fetchAdminProfile(); // Refresh profile data
        } catch (err) {
            console.error("Error updating profile:", err.response?.data?.message || err.message);
            showMessage(err.response?.data?.message || 'Failed to update profile.', 'error');
        } finally {
            setLoading(false);
        }
    };

    // Change Admin Password
    const handleChangePassword = async (e) => {
        e.preventDefault();
        
        // Validate passwords
        if (passwordFormData.newPassword !== passwordFormData.confirmPassword) {
            showMessage('New passwords do not match.', 'error');
            return;
        }
        
        setLoading(true);
        try {
            const res = await axiosInstance.put('/admin/change-password', {
                currentPassword: passwordFormData.currentPassword,
                newPassword: passwordFormData.newPassword
            });
            showMessage(res.data.message, 'success');
            setPasswordFormData({
                currentPassword: '',
                newPassword: '',
                confirmPassword: ''
            });
        } catch (err) {
            console.error("Error changing password:", err.response?.data?.message || err.message);
            showMessage(err.response?.data?.message || 'Failed to change password.', 'error');
        } finally {
            setLoading(false);
        }
    };

    // Update Profile Picture
    const handleUpdateProfilePicture = async (e) => {
        e.preventDefault();
        if (!profilePicture) {
            showMessage('Please select a profile picture.', 'error');
            return;
        }
        
        const formData = new FormData();
        formData.append('profilePicture', profilePicture);
        
        setLoading(true);
        try {
            const res = await axiosInstance.put('/admin/profile-picture', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            });
            showMessage(res.data.message, 'success');
            fetchAdminProfile(); // Refresh profile data
            setProfilePicture(null);
        } catch (err) {
            console.error("Error updating profile picture:", err.response?.data?.message || err.message);
            showMessage(err.response?.data?.message || 'Failed to update profile picture.', 'error');
        } finally {
            setLoading(false);
        }
    };

    // Effect to fetch initial dashboard data if token exists
    useEffect(() => {
        if (token) {
            fetchStudents(); 
            fetchResults(1); 
            fetchTests();
            fetchAdminProfile();
        } else {
            setView('dashboard'); 
        }
    }, [token]); 

    // Render Login Form if no token
    if (!token) {
        return (
            <div className="admin-login-page-wrapper">
                {!showForgotPassword ? (
                    <form className="admin-login-container" onSubmit={handleLogin}>
                        <h2>Admin Login</h2>
                        <MessagePopup message={message} type={messageType} onClose={() => setMessage('')} />
                        <div className="input-group">
                            <label htmlFor="username">Username</label>
                            <input
                                type="text"
                                id="username"
                                placeholder="Enter admin username"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                required
                            />
                            <span className="icon">👤</span>
                        </div>
                        <div className="input-group">
                            <label htmlFor="password">Password</label>
                            <input
                                type="password"
                                id="password"
                                placeholder="Enter admin password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                            />
                            <span className="icon">🔒</span>
                        </div>
                        <button type="submit" className="login-button" disabled={loading}>
                            {loading ? 'Logging In...' : 'Login'}
                        </button>
                        <p className="forgot-password-link">
                            <a href="#" onClick={(e) => { e.preventDefault(); setShowForgotPassword(true); }}>
                                Forgot Password?
                            </a>
                        </p>
                    </form>
                ) : (
                    <form className="admin-login-container" onSubmit={handleForgotPassword}>
                        <h2>Forgot Password</h2>
                        <MessagePopup message={message} type={messageType} onClose={() => setMessage('')} />
                        <div className="input-group">
                            <label htmlFor="email">Email Address</label>
                            <input
                                type="email"
                                id="email"
                                placeholder="Enter your admin email"
                                value={forgotPasswordEmail}
                                onChange={(e) => setForgotPasswordEmail(e.target.value)}
                                required
                            />
                            <span className="icon">✉️</span>
                        </div>
                        <button type="submit" className="login-button" disabled={loading}>
                            {loading ? 'Sending...' : 'Reset Password'}
                        </button>
                        <p className="back-to-login-link">
                            <a href="#" onClick={(e) => { e.preventDefault(); setShowForgotPassword(false); }}>
                                Back to Login
                            </a>
                        </p>
                    </form>
                )}
            </div>
        );
    }

    // Render Admin Dashboard if logged in
    return (
        <div className="admin-dashboard-wrapper">
            <div className="admin-sidebar">
                <div className="admin-profile-section">
                    <div className="admin-avatar">👨‍💻</div>
                    <h3>Admin Panel</h3>
                    <p>Welcome, Admin!</p>
                </div>
                <nav className="admin-nav">
                    <ul>
                        <li><button onClick={() => setView('dashboard')} className={view === 'dashboard' ? 'active' : ''}>Overview</button></li>
                        <li><button onClick={() => setView('profile')} className={view === 'profile' ? 'active' : ''}>My Profile</button></li>
                        <li><button onClick={() => setView('students')} className={view === 'students' ? 'active' : ''}>Manage Students</button></li>
                        <li><button onClick={() => setView('tests')} className={view.startsWith('test') || view === 'manageQuestions' ? 'active' : ''}>Manage Tests & Questions</button></li>
                        <li><button onClick={() => setView('results')} className={view.startsWith('results') ? 'active' : ''}>View Results</button></li>
                        <li><button onClick={logout} className="logout-button">Logout</button></li>
                    </ul>
                </nav>
            </div>

            <div className="admin-main-content">
                <header className="admin-header">
                    <h1>Admin Dashboard</h1>
                    <MessagePopup message={message} type={messageType} onClose={() => setMessage('')} />
                </header>

                <div className="admin-content-area">
                    {loading && <div className="loading-spinner"></div>}

                    {view === 'dashboard' && (
                        <div className="admin-overview">
                            <h2>Welcome to the Admin Dashboard</h2>
                            <p>Use the sidebar to navigate through administrative tasks.</p>
                            <div className="stats-grid">
                                <div className="stat-card">
                                    <h3>Total Students</h3>
                                    <p>{students.length > 0 ? students.length : '0'}</p>
                                    <button onClick={() => setView('students')} className="btn-small">View Students</button>
                                </div>
                                <div className="stat-card">
                                    <h3>Total Tests</h3> 
                                    <p>{tests.length > 0 ? tests.length : '0'}</p>
                                    <button onClick={() => setView('tests')} className="btn-small">Manage Tests</button>
                                </div>
                                <div className="stat-card">
                                    <h3>Total Results</h3>
                                    <p>{totalResults > 0 ? totalResults : '0'}</p>
                                    <button onClick={() => setView('results')} className="btn-small">View Results</button>
                                </div>
                            </div>
                        </div>
                    )}
                    
                    {view === 'profile' && (
                        <div className="admin-profile-section-content">
                            <h2>My Profile</h2>
                            
                            <div className="profile-container">
                                <div className="profile-header">
                                    <div className="profile-picture-container">
                                        {adminProfile.profile_picture ? (
                                            <img 
                                                src={`http://localhost:5000/uploads/admin/${adminProfile.profile_picture}`} 
                                                alt="Profile" 
                                                className="profile-picture"
                                            />
                                        ) : (
                                            <div className="profile-picture-placeholder">
                                                <span>👨‍💻</span>
                                            </div>
                                        )}
                                    </div>
                                    <div className="profile-info">
                                        <h3>{adminProfile.username}</h3>
                                        <p>{adminProfile.email}</p>
                                        <p><strong>Role:</strong> Administrator</p>
                                    </div>
                                </div>
                                
                                <div className="profile-tabs">
                                    <div className="tabs-container">
                                        <input type="radio" id="tab1" name="profile-tab" defaultChecked />
                                        <label htmlFor="tab1" className="tab-label">Edit Profile</label>
                                        <div className="tab-content">
                                            <form onSubmit={handleUpdateProfile} className="profile-form">
                                                <div className="form-group">
                                                    <label htmlFor="username">Username</label>
                                                    <input 
                                                        type="text" 
                                                        id="username" 
                                                        name="username"
                                                        value={profileFormData.username}
                                                        onChange={handleProfileFormChange}
                                                        required
                                                    />
                                                </div>
                                                <div className="form-group">
                                                    <label htmlFor="email">Email</label>
                                                    <input 
                                                        type="email" 
                                                        id="email" 
                                                        name="email"
                                                        value={profileFormData.email}
                                                        onChange={handleProfileFormChange}
                                                        required
                                                    />
                                                </div>
                                                <button type="submit" className="btn-primary" disabled={loading}>
                                                    {loading ? 'Updating...' : 'Update Profile'}
                                                </button>
                                            </form>
                                        </div>
                                        
                                        <input type="radio" id="tab2" name="profile-tab" />
                                        <label htmlFor="tab2" className="tab-label">Change Password</label>
                                        <div className="tab-content">
                                            <form onSubmit={handleChangePassword} className="profile-form">
                                                <div className="form-group">
                                                    <label htmlFor="currentPassword">Current Password</label>
                                                    <input 
                                                        type="password" 
                                                        id="currentPassword" 
                                                        name="currentPassword"
                                                        value={passwordFormData.currentPassword}
                                                        onChange={handlePasswordFormChange}
                                                        required
                                                    />
                                                </div>
                                                <div className="form-group">
                                                    <label htmlFor="newPassword">New Password</label>
                                                    <input 
                                                        type="password" 
                                                        id="newPassword" 
                                                        name="newPassword"
                                                        value={passwordFormData.newPassword}
                                                        onChange={handlePasswordFormChange}
                                                        required
                                                    />
                                                </div>
                                                <div className="form-group">
                                                    <label htmlFor="confirmPassword">Confirm New Password</label>
                                                    <input 
                                                        type="password" 
                                                        id="confirmPassword" 
                                                        name="confirmPassword"
                                                        value={passwordFormData.confirmPassword}
                                                        onChange={handlePasswordFormChange}
                                                        required
                                                    />
                                                </div>
                                                <button type="submit" className="btn-primary" disabled={loading}>
                                                    {loading ? 'Changing...' : 'Change Password'}
                                                </button>
                                            </form>
                                        </div>
                                        
                                        <input type="radio" id="tab3" name="profile-tab" />
                                        <label htmlFor="tab3" className="tab-label">Profile Picture</label>
                                        <div className="tab-content">
                                            <form onSubmit={handleUpdateProfilePicture} className="profile-form">
                                                <div className="form-group">
                                                    <label htmlFor="profilePicture">Upload New Profile Picture</label>
                                                    <input 
                                                        type="file" 
                                                        id="profilePicture" 
                                                        name="profilePicture"
                                                        accept="image/*"
                                                        onChange={handleProfilePictureChange}
                                                        required
                                                    />
                                                </div>
                                                {profilePicture && (
                                                    <div className="profile-picture-preview">
                                                        <img 
                                                            src={URL.createObjectURL(profilePicture)} 
                                                            alt="Preview" 
                                                        />
                                                    </div>
                                                )}
                                                <button type="submit" className="btn-primary" disabled={loading}>
                                                    {loading ? 'Uploading...' : 'Update Picture'}
                                                </button>
                                            </form>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {view === 'students' && (
                        <div className="admin-students-section">
                            <h2>Registered Students</h2>
                            {students.length === 0 ? (
                                <p>No students registered yet.</p>
                            ) : (
                                <div className="table-responsive">
                                    <table className="admin-table">
                                        <thead>
                                            <tr>
                                                <th>ID</th>
                                                <th>Full Name</th>
                                                <th>Email</th>
                                                <th>Phone</th>
                                                <th>College Name</th>
                                                <th>College ID</th>
                                                <th>Profile Pic</th>
                                                <th>Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {students.map((student) => (
                                                <tr key={student.id}>
                                                    <td>{student.id}</td>
                                                    <td>{student.full_name}</td>
                                                    <td>{student.email}</td>
                                                    <td>{student.phone}</td>
                                                    <td>{student.college_name}</td>
                                                    <td>{student.college_id}</td>
                                                    <td>
                                                        {student.profile_pic ? (
                                                            <img
                                                                src={`http://localhost:5000/uploads/${student.profile_pic}`}
                                                                alt="Profile"
                                                                className="profile-thumbnail"
                                                                onError={(e) => { e.target.onerror = null; e.target.src = 'https://placehold.co/50x50/cccccc/ffffff?text=No+Image'; }}
                                                            />
                                                        ) : (
                                                            <span>No Image</span>
                                                        )}
                                                    </td>
                                                    <td>
                                                        <button onClick={() => handleDeleteStudent(student.id)} className="btn-delete">Delete</button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    )}

                    {view === 'tests' && ( 
                        <div className="admin-tests-section">
                            <h2>Manage Tests</h2>
                            <button onClick={() => { setView('createTest'); setTestFormData({ id: null, course_name: '', test_name: '', duration: '' }); }} className="btn-primary create-test-button">Create New Test</button>
                            {tests.length === 0 ? (
                                <p>No tests created yet.</p>
                            ) : (
                                <div className="table-responsive">
                                    <table className="admin-table">
                                        <thead>
                                            <tr>
                                                <th>ID</th>
                                                <th>Course Name</th>
                                                <th>Test Name</th>
                                                <th>Duration (mins)</th>
                                                <th>Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {tests.map((test) => (
                                                <tr key={test.id}>
                                                    <td>{test.id}</td>
                                                    <td>{test.course_name}</td>
                                                    <td>{test.test_name}</td>
                                                    <td>{test.duration}</td>
                                                    <td>
                                                        <button onClick={() => handleManageQuestions(test)} className="btn-view" style={{marginRight: '8px'}}>Manage Questions</button>
                                                        <button onClick={() => handleEditTest(test)} className="btn-edit" style={{marginRight: '8px'}}>Edit Course</button>
                                                        <button onClick={() => handleDeleteTest(test.id)} className="btn-delete">Delete</button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    )}

                    {view === 'createTest' && ( 
                        <div className="admin-create-test-section">
                            <h2>Create New Test</h2>
                            <form onSubmit={handleTestSubmit} className="test-form">
                                <div className="input-group">
                                    <label htmlFor="course_name">Course Name</label>
                                    <input
                                        type="text"
                                        id="course_name"
                                        name="course_name"
                                        value={testFormData.course_name}
                                        onChange={handleTestFormChange}
                                        placeholder="e.g., Computer Science"
                                        required
                                    />
                                </div>
                                <div className="input-group">
                                    <label htmlFor="test_name">Test Name</label>
                                    <input
                                        type="text"
                                        id="test_name"
                                        name="test_name"
                                        value={testFormData.test_name}
                                        onChange={handleTestFormChange}
                                        placeholder="e.g., Mid-Term Exam"
                                        required
                                    />
                                </div>
                                <div className="input-group">
                                    <label htmlFor="duration">Duration (minutes)</label>
                                    <input
                                        type="number"
                                        id="duration"
                                        name="duration"
                                        value={testFormData.duration}
                                        onChange={handleTestFormChange}
                                        placeholder="e.g., 180"
                                        min="1"
                                        required
                                    />
                                </div>
                                <div className="form-actions">
                                    <button type="submit" className="btn-primary" disabled={loading}>
                                        {loading ? 'Creating...' : 'Create Test'}
                                    </button>
                                    <button type="button" onClick={() => setView('tests')} className="btn btn-back">
                                        Cancel
                                    </button>
                                </div>
                            </form>
                        </div>
                    )}

                    {view === 'editTest' && testFormData.id && (
                        <div className="admin-edit-test-section">
                            <h2>Edit Course: {testFormData.test_name}</h2>
                            <form onSubmit={handleTestSubmit} className="test-form">
                                <div className="input-group">
                                    <label htmlFor="edit_course_name">Course Name</label>
                                    <input
                                        type="text"
                                        id="edit_course_name"
                                        name="course_name"
                                        value={testFormData.course_name}
                                        onChange={handleTestFormChange}
                                        required
                                    />
                                </div>
                                <div className="input-group">
                                    <label htmlFor="edit_test_name">Test Name</label>
                                    <input
                                        type="text"
                                        id="edit_test_name"
                                        name="test_name"
                                        value={testFormData.test_name}
                                        onChange={handleTestFormChange}
                                        required
                                    />
                                </div>
                                <div className="input-group">
                                    <label htmlFor="edit_duration">Duration (minutes)</label>
                                    <input
                                        type="number"
                                        id="edit_duration"
                                        name="duration"
                                        value={testFormData.duration}
                                        onChange={handleTestFormChange}
                                        min="1"
                                        required
                                    />
                                </div>
                                <div className="form-actions">
                                    <button type="submit" className="btn-primary" disabled={loading}>
                                        {loading ? 'Updating...' : 'Update Test'}
                                    </button>
                                    <button type="button" onClick={() => setView('tests')} className="btn btn-back">
                                        Cancel
                                    </button>
                                </div>
                            </form>
                        </div>
                    )}

                    {view === 'manageQuestions' && selectedTest && ( 
                        <div className="admin-manage-questions-section">
                            <h2>Manage Questions for: {selectedTest.test_name} ({selectedTest.course_name})</h2>
                            <p className="test-info-summary">Duration: {selectedTest.duration} minutes</p>

                            <div className="question-form-container">
                                <h3>{editQuestionId ? 'Edit Question' : 'Add New Question'}</h3>
                                <form onSubmit={handleQuestionSubmit} className="question-form">
                                    <div className="input-group">
                                        <label htmlFor="question_text">Question Text</label>
                                        <textarea
                                            id="question_text"
                                            name="question_text"
                                            value={questionFormData.question_text}
                                            onChange={handleQuestionFormChange}
                                            placeholder="Enter question text"
                                            rows="4"
                                            required
                                        ></textarea>
                                    </div>
                                    <div className="input-group">
                                        <label htmlFor="question_type">Question Type</label>
                                        <select
                                            id="question_type"
                                            name="question_type"
                                            value={questionFormData.question_type}
                                            onChange={(e) => {
                                                setQuestionFormData(prev => ({
                                                    ...prev,
                                                    question_type: e.target.value,
                                                    correct_answer: '',
                                                    correct_answers: [],
                                                    options: (e.target.value === 'MCQ' || e.target.value === 'MSQ') ? [{ option_text: '' }, { option_text: '' }] : [] 
                                                }));
                                            }}
                                            required
                                        >
                                            <option value="MCQ">Multiple Choice Question (MCQ)</option>
                                            <option value="MSQ">Multiple Select Question (MSQ)</option>
                                            <option value="NAT">Numerical Answer Type (NAT)</option>
                                        </select>
                                    </div>

                                    {(questionFormData.question_type === 'MCQ' || questionFormData.question_type === 'MSQ') && (
                                        <div className="options-group-wrapper">
                                            <label>Options</label>
                                            {questionFormData.options.map((option, index) => (
                                                <div key={index} className="option-input-group">
                                                    <input
                                                        type="text"
                                                        value={option.option_text}
                                                        onChange={(e) => handleOptionChange(index, e.target.value)}
                                                        placeholder={`Option ${index + 1}`}
                                                        required
                                                    />
                                                    {questionFormData.options.length > 2 && (
                                                        <button type="button" onClick={() => handleRemoveOption(index)} className="btn-remove-option">
                                                            &times;
                                                        </button>
                                                    )}
                                                </div>
                                            ))}
                                            <button type="button" onClick={handleAddOption} className="btn-add-option">
                                                + Add Option
                                            </button>
                                        </div>
                                    )}

                                    {questionFormData.question_type === 'MSQ' ? (
                                        <div className="input-group">
                                            <label>Correct Options (Select Multiple)</label>
                                            <div className="msq-options-container">
                                                {questionFormData.options.filter(opt => opt.option_text.trim() !== '').map((option, index) => (
                                                    <div key={index} className="msq-option-checkbox">
                                                        <input
                                                            type="checkbox"
                                                            id={`msq-option-${index}`}
                                                            checked={questionFormData.correct_answers && Array.isArray(questionFormData.correct_answers) && 
                                                                    questionFormData.correct_answers.some(ans => ans === option.option_text.trim())}
                                                            onChange={(e) => {
                                                                const isChecked = e.target.checked;
                                                                const optionText = option.option_text.trim();
                                                                
                                                                setQuestionFormData(prev => {
                                                                    // Ensure correct_answers is an array
                                                                    const currentAnswers = Array.isArray(prev.correct_answers) ? 
                                                                        prev.correct_answers : [];
                                                                    
                                                                    if (isChecked) {
                                                                        // Only add if not already in the array
                                                                        if (!currentAnswers.includes(optionText)) {
                                                                            return {
                                                                                ...prev,
                                                                                correct_answers: [...currentAnswers, optionText]
                                                                            };
                                                                        }
                                                                        return prev;
                                                                    } else {
                                                                        return {
                                                                            ...prev,
                                                                            correct_answers: currentAnswers.filter(ans => ans !== optionText)
                                                                        };
                                                                    }
                                                                });
                                                                console.log("MSQ checkbox changed:", optionText, isChecked);
                                                            }}
                                                        />
                                                        <label htmlFor={`msq-option-${index}`}>{option.option_text}</label>
                                                    </div>
                                                ))}
                                            </div>
                                            {questionFormData.options.filter(opt => opt.option_text.trim() !== '').length < 2 && (
                                                <p className="form-hint">Add at least two options to select correct answers.</p>
                                            )}
                                        </div>
                                    ) : (
                                        <div className="input-group">
                                            <label htmlFor="correct_answer">{questionFormData.question_type === 'MCQ' ? 'Correct Option' : 'Correct Answer'}</label>
                                            {questionFormData.question_type === 'MCQ' ? (
                                                <select
                                                    id="correct_answer"
                                                    name="correct_answer"
                                                    value={questionFormData.correct_answer}
                                                    onChange={handleQuestionFormChange}
                                                    required
                                                >
                                                    <option value="">Select Correct Option</option>
                                                    {questionFormData.options.filter(opt => opt.option_text.trim() !== '').map((option, index) => (
                                                        <option key={index} value={option.option_text}>
                                                            {option.option_text}
                                                        </option>
                                                    ))}
                                                </select>
                                            ) : (
                                                <input
                                                    type="text"
                                                    id="correct_answer"
                                                    name="correct_answer"
                                                    value={questionFormData.correct_answer}
                                                    onChange={handleQuestionFormChange}
                                                    placeholder="Enter correct numerical answer"
                                                    required
                                                />
                                            )}
                                        </div>
                                    )}
                                    <div className="input-group">
                                        <label htmlFor="marks">Marks</label>
                                        <input
                                            type="number"
                                            id="marks"
                                            name="marks"
                                            value={questionFormData.marks}
                                            onChange={handleQuestionFormChange}
                                            placeholder="e.g., 2"
                                            min="1"
                                            required
                                        />
                                    </div>
                                    <div className="input-group">
                                        <label htmlFor="explanation">Explanation (Optional)</label>
                                        <textarea
                                            id="explanation"
                                            name="explanation"
                                            value={questionFormData.explanation}
                                            onChange={handleQuestionFormChange}
                                            placeholder="Enter explanation for the correct answer"
                                            rows="2"
                                        ></textarea>
                                    </div>
                                    <div className="form-actions">
                                        <button type="submit" className="btn-primary" disabled={loading}>
                                            {loading ? (editQuestionId ? 'Updating...' : 'Adding...') : (editQuestionId ? 'Update Question' : 'Add Question')}
                                        </button>
                                        {editQuestionId && (
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setEditQuestionId(null);
                                                    setQuestionFormData({
                                                        question_text: '',
                                                        question_type: 'MCQ',
                                                        correct_answer: '',
                                                        explanation: '',
                                                        marks: '',
                                                        options: [{ option_text: '' }, { option_text: '' }]
                                                    });
                                                }}
                                                className="btn btn-back"
                                            >
                                                Cancel Edit
                                            </button>
                                        )}
                                    </div>
                                </form>
                            </div>

                            <div className="questions-list-container">
                                <h3>Existing Questions ({questionsForSelectedTest.length})</h3>
                                {questionsForSelectedTest.length === 0 ? (
                                    <p>No questions added to this test yet.</p>
                                ) : (
                                    <div className="table-responsive">
                                        <table className="admin-table">
                                            <thead>
                                                <tr>
                                                    <th>ID</th>
                                                    <th>Question Text</th>
                                                    <th>Type</th>
                                                    <th>Marks</th>
                                                    <th>Correct Answer</th>
                                                    <th>Actions</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {questionsForSelectedTest.map((question) => (
                                                    <tr key={question.question_id}>
                                                        <td>{question.question_id}</td>
                                                        <td><div dangerouslySetInnerHTML={{ __html: question.question_text }}></div></td>
                                                        <td>{question.question_type}</td>
                                                        <td>{question.marks}</td>
                                                        <td>
                                                            {question.question_type === 'MCQ' ? 
                                                                (question.options.find(opt => opt.option_text === question.correct_answer)?.option_text || question.correct_answer || 'N/A') :
                                                                (question.correct_answer || 'N/A')}
                                                        </td>
                                                        <td>
                                                            <button onClick={() => handleEditQuestion(question)} className="btn-edit" style={{marginRight: '8px'}}>Edit</button>
                                                            <button onClick={() => handleDeleteQuestion(question.question_id)} className="btn-delete">Delete</button>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </div>
                            <button onClick={() => setView('tests')} className="btn btn-back back-to-tests-button">Back to All Tests</button>
                        </div>
                    )}

                    {view === 'results' && (
                        <div className="admin-results-section">
                            <h2>Test Results Overview</h2>
                            {results.length === 0 ? (
                                <p>No test results found.</p>
                            ) : (
                                <>
                                    <div className="table-responsive">
                                        <table className="admin-table">
                                            <thead>
                                                <tr>
                                                    <th>Result ID</th>
                                                    <th>Student Name</th>
                                                    <th>Test Name</th>
                                                    <th>Course</th>
                                                    <th>Score</th>
                                                    <th>Percentage</th>
                                                    <th>Submitted On</th>
                                                    <th>Actions</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {results.map((result) => (
                                                    <tr key={result.result_id}>
                                                        <td>{result.result_id}</td>
                                                        <td>{result.student_name}</td>
                                                        <td>{result.test_name}</td>
                                                        <td>{result.course_name}</td>
                                                        <td>{result.score} / {result.total_questions}</td>
                                                        <td>{typeof result.percentage === 'number' ? parseFloat(result.percentage).toFixed(2) : '0.00'}%</td>
                                                        <td>{new Date(result.submission_time).toLocaleString()}</td>
                                                        <td>
                                                            <button onClick={() => viewResultDetails(result.result_id)} className="btn-view">View Details</button>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                    <div className="pagination-controls">
                                        <button
                                            onClick={() => fetchResults(page - 1)}
                                            disabled={page === 1}
                                            className="btn-pagination"
                                        >
                                            Previous
                                        </button>
                                        <span> Page {page} of {totalPages} </span>
                                        <button
                                            onClick={() => fetchResults(page + 1)}
                                            disabled={page >= totalPages}
                                            className="btn-pagination"
                                        >
                                            Next
                                        </button>
                                    </div>
                                </>
                            )}
                        </div>
                    )}

                    {view === 'detailedResult' && detailedResult && (
                        <div className="admin-detailed-result-section">
                            <h2>Detailed Result for {detailedResult.student_name} - {detailedResult.test_name}</h2>
                            <div className="result-summary">
                                <p><strong>Score:</strong> {detailedResult.score} / {detailedResult.total_questions}</p>
                                <p><strong>Percentage:</strong> {typeof detailedResult.percentage === 'number' ? parseFloat(detailedResult.percentage).toFixed(2) : '0.00'}%</p>
                                <p><strong>Attempted:</strong> {detailedResult.attempted_questions}</p>
                                <p><strong>Correct:</strong> {detailedResult.correct_answers}</p>
                                <p><strong>Submitted:</strong> {new Date(detailedResult.submission_time).toLocaleString()}</p>
                            </div>

                            <div className="questions-review">
                                <h3>Question-by-Question Review</h3>
                                {detailedResult.detailed_responses && detailedResult.detailed_responses.length > 0 ? (
                                    detailedResult.detailed_responses.map((q, index) => (
                                        <div key={q.question_id} className={`question-card ${q.is_correct ? 'correct-answer' : 'incorrect-answer'}`}>
                                            <p className="question-number">Question {index + 1} ({q.question_type})</p>
                                            <p className="question-text" dangerouslySetInnerHTML={{ __html: q.question_text }}></p>

                                            {q.question_type === 'MCQ' && q.options && (
                                                <div className="options-list">
                                                    {Object.entries(q.options).map(([optionId, optionText]) => (
                                                        <div key={optionId} className="option-item">
                                                            <input
                                                                type="radio"
                                                                id={`q${q.question_id}-option${optionId}`}
                                                                name={`question-${q.question_id}`}
                                                                value={optionText}
                                                                checked={q.user_answer === optionText}
                                                                readOnly
                                                                disabled
                                                            />
                                                            <label htmlFor={`q${q.question_id}-option${optionId}`}
                                                                className={
                                                                    (q.user_answer === optionText && q.is_correct) ? 'selected-correct' :
                                                                    (q.user_answer === optionText && !q.is_correct) ? 'selected-incorrect' :
                                                                    (q.actual_correct_answer === optionText) ? 'actual-correct' : ''
                                                                }
                                                            >
                                                                {optionText}
                                                            </label>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}

                                            {q.question_type === 'NAT' && (
                                                <div className="nat-answers">
                                                    <p><strong>Your Answer:</strong> <span className={q.is_correct ? 'text-green-strong' : 'text-red-strong'}>{q.user_answer || 'No Answer'}</span></p>
                                                    <p><strong>Correct Answer:</strong> <span className="text-blue-strong">{q.actual_correct_answer}</span></p>
                                                </div>
                                            )}

                                            <p className="user-selected">
                                                <strong>User Selected:</strong> <span className={q.is_correct ? 'text-green-strong' : 'text-red-strong'}>{q.user_answer || 'N/A'}</span>
                                            </p>
                                            <p>
                                                <strong>Correct Answer:</strong> <span className="text-blue-strong">{q.actual_correct_answer || 'N/A'}</span>
                                            </p>
                                            {q.explanation && (
                                                <div className="explanation-box">
                                                    <strong>Explanation:</strong> <span dangerouslySetInnerHTML={{ __html: q.explanation }}></span>
                                                </div>
                                            )}
                                        </div>
                                    ))
                                ) : (
                                    <p>No detailed responses available for this result.</p>
                                )}
                            </div>
                            <button onClick={() => setView('results')} className="btn btn-back">Back to Results Overview</button>
                        </div>
                    )}
                </div>
            </div>
            {showConfirmModal && (
                <ConfirmationModal
                    message={confirmAction?.message || "Are you sure you want to proceed?"}
                    onConfirm={() => confirmAction?.action()}
                    onCancel={() => setShowConfirmModal(false)}
                />
            )}
        </div>
    );
}

export default SuperSecretAdmin;