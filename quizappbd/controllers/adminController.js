// quizappbd/controllers/adminController.js
const db = require('../models/db'); // db is MySQL connection pool setup
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');

const ADMIN_SECRET = process.env.ADMIN_SECRET || 'adminsupersecretdevkey';

/**
 * Middleware to verify admin JWT token.
 */
const verifyAdmin = (req, res, next) => {
    const token = req.headers.authorization?.split(' ')[1];
    console.log("Backend: verifyAdmin - Token received:", token ? token.substring(0, 10) + '...' : 'No Token');

    if (!token) {
        console.log("Backend: verifyAdmin - No token provided, sending 401.");
        return res.status(401).json({ message: 'Authentication failed: No token provided.' });
    }

    jwt.verify(token, ADMIN_SECRET, (err, decoded) => {
        if (err) {
            console.error("Backend: JWT verification error:", err.message);
            if (err.name === 'TokenExpiredError') {
                return res.status(401).json({ message: 'Authentication failed: Token expired.' });
            }
            return res.status(403).json({ message: 'Authentication failed: Invalid token.' });
        }
        req.admin = decoded;
        console.log("Backend: verifyAdmin - Token successfully decoded for admin ID:", decoded.id);
        next();
    });
};

/**
 * Admin user registration.
 */
const registerAdmin = async (req, res) => {
    const { username, password, email } = req.body;
    if (!username || !password || !email) {
        return res.status(400).json({ message: 'Username, password, and email are required.' });
    }
    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        const sql = 'INSERT INTO admin (username, password, email) VALUES (?, ?, ?)';
        db.query(sql, [username, hashedPassword, email], (err, result) => {
            if (err) {
                console.error("Error registering admin:", err);
                if (err.code === 'ER_DUP_ENTRY') {
                    return res.status(409).json({ message: 'Admin user with this username or email already exists.' });
                }
                return res.status(500).json({ message: 'Error registering admin.' });
            }
            res.status(201).json({ message: 'Admin registered successfully.' });
        });
    } catch (error) {
        console.error("Admin registration hashing error:", error);
        res.status(500).json({ message: 'Server error during registration.' });
    }
};

/**
 * Admin login.
 */
const loginAdmin = (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) {
        return res.status(400).json({ message: 'Username and password are required.' });
    }
    const sql = 'SELECT id, username, password FROM admin WHERE username = ?';
    db.query(sql, [username], async (err, results) => {
        if (err) {
            console.error("Admin login DB error:", err);
            return res.status(500).json({ message: 'Database error during login.' });
        }
        if (results.length === 0) {
            return res.status(401).json({ message: 'Invalid username or password.' });
        }

        const admin = results[0];
        const isMatch = await bcrypt.compare(password, admin.password);
        if (!isMatch) {
            return res.status(401).json({ message: 'Invalid username or password.' });
        }

        const token = jwt.sign({ id: admin.id, username: admin.username, role: 'admin' }, ADMIN_SECRET, { expiresIn: '1d' });
        console.log("Backend: Admin logged in, token generated.");
        res.status(200).json({ message: 'Login successful', token: token });
    });
};

/**
 * Helper function to send email
 */
const sendEmail = async (to, subject, text) => {
    try {
        const transporter = nodemailer.createTransport({
            service: "Gmail",
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS,
            },
        });

        await transporter.sendMail({
            from: process.env.EMAIL_USER,
            to,
            subject,
            text,
        });
        
        console.log(`Email sent to ${to}`);
        return true;
    } catch (error) {
        console.error("Email sending error:", error);
        return false;
    }
};

/**
 * Get admin profile information
 */
const getAdminProfile = async (req, res) => {
    try {
        const adminId = req.admin.id;
        
        const sql = 'SELECT id, username, email, profile_picture FROM admin WHERE id = ?';
        db.query(sql, [adminId], (err, results) => {
            if (err) {
                console.error("Error fetching admin profile:", err);
                return res.status(500).json({ message: 'Error fetching profile information.' });
            }
            
            if (results.length === 0) {
                return res.status(404).json({ message: 'Admin profile not found.' });
            }
            
            const adminProfile = results[0];
            res.status(200).json(adminProfile);
        });
    } catch (error) {
        console.error("Admin profile fetch error:", error);
        res.status(500).json({ message: 'Server error during profile fetch.' });
    }
};

/**
 * Update admin profile information
 */
const updateAdminProfile = async (req, res) => {
    try {
        const adminId = req.admin.id;
        const { username, email } = req.body;
        
        // Validate input
        if (!username || !email) {
            return res.status(400).json({ message: 'Username and email are required.' });
        }
        
        // Check if username or email already exists for another admin
        const checkSql = 'SELECT id FROM admin WHERE (username = ? OR email = ?) AND id != ?';
        db.query(checkSql, [username, email, adminId], (checkErr, checkResults) => {
            if (checkErr) {
                console.error("Error checking admin uniqueness:", checkErr);
                return res.status(500).json({ message: 'Database error during profile update.' });
            }
            
            if (checkResults.length > 0) {
                return res.status(409).json({ message: 'Username or email already in use by another admin.' });
            }
            
            // Update profile
            const updateSql = 'UPDATE admin SET username = ?, email = ? WHERE id = ?';
            db.query(updateSql, [username, email, adminId], (updateErr, updateResult) => {
                if (updateErr) {
                    console.error("Error updating admin profile:", updateErr);
                    return res.status(500).json({ message: 'Failed to update profile.' });
                }
                
                if (updateResult.affectedRows === 0) {
                    return res.status(404).json({ message: 'Admin profile not found.' });
                }
                
                res.status(200).json({ message: 'Profile updated successfully.' });
            });
        });
    } catch (error) {
        console.error("Admin profile update error:", error);
        res.status(500).json({ message: 'Server error during profile update.' });
    }
};

/**
 * Change admin password
 */
const changeAdminPassword = async (req, res) => {
    try {
        const adminId = req.admin.id;
        const { currentPassword, newPassword } = req.body;
        
        // Validate input
        if (!currentPassword || !newPassword) {
            return res.status(400).json({ message: 'Current password and new password are required.' });
        }
        
        // Get current admin data
        const sql = 'SELECT password FROM admin WHERE id = ?';
        db.query(sql, [adminId], async (err, results) => {
            if (err) {
                console.error("Error fetching admin data:", err);
                return res.status(500).json({ message: 'Database error during password change.' });
            }
            
            if (results.length === 0) {
                return res.status(404).json({ message: 'Admin not found.' });
            }
            
            const admin = results[0];
            
            // Verify current password
            const isMatch = await bcrypt.compare(currentPassword, admin.password);
            if (!isMatch) {
                return res.status(401).json({ message: 'Current password is incorrect.' });
            }
            
            // Hash new password
            const hashedPassword = await bcrypt.hash(newPassword, 10);
            
            // Update password
            const updateSql = 'UPDATE admin SET password = ? WHERE id = ?';
            db.query(updateSql, [hashedPassword, adminId], (updateErr, updateResult) => {
                if (updateErr) {
                    console.error("Error updating admin password:", updateErr);
                    return res.status(500).json({ message: 'Failed to update password.' });
                }
                
                res.status(200).json({ message: 'Password changed successfully.' });
            });
        });
    } catch (error) {
        console.error("Admin password change error:", error);
        res.status(500).json({ message: 'Server error during password change.' });
    }
};

/**
 * Update admin profile picture
 */
const updateProfilePicture = async (req, res) => {
    try {
        const adminId = req.admin.id;
        
        if (!req.file) {
            return res.status(400).json({ message: 'No profile picture uploaded.' });
        }
        
        const profilePicture = req.file.filename;
        
        // Update profile picture
        const sql = 'UPDATE admin SET profile_picture = ? WHERE id = ?';
        db.query(sql, [profilePicture, adminId], (err, result) => {
            if (err) {
                console.error("Error updating profile picture:", err);
                return res.status(500).json({ message: 'Failed to update profile picture.' });
            }
            
            if (result.affectedRows === 0) {
                return res.status(404).json({ message: 'Admin profile not found.' });
            }
            
            res.status(200).json({ 
                message: 'Profile picture updated successfully.',
                profilePicture: profilePicture
            });
        });
    } catch (error) {
        console.error("Profile picture update error:", error);
        res.status(500).json({ message: 'Server error during profile picture update.' });
    }
};

/**
 * Admin forgot password.
 * Generates a new random password and sends it to the admin's email.
 */
const forgotAdminPassword = async (req, res) => {
    const { email } = req.body;
    
    if (!email) {
        return res.status(400).json({ message: 'Email is required.' });
    }
    
    try {
        // Check if admin with this email exists
        const sql = 'SELECT id, username, email FROM admin WHERE email = ?';
        db.query(sql, [email], async (err, results) => {
            if (err) {
                console.error("Admin forgot password DB error:", err);
                return res.status(500).json({ message: 'Database error during password reset.' });
            }
            
            if (results.length === 0) {
                return res.status(404).json({ message: 'No admin account found with this email.' });
            }
            
            const admin = results[0];
            
            // Generate a new random password
            const newPassword = require('crypto').randomBytes(4).toString('hex');
            const hashedPassword = await bcrypt.hash(newPassword, 10);
            
            // Update the admin's password in the database
            const updateSql = 'UPDATE admin SET password = ? WHERE id = ?';
            db.query(updateSql, [hashedPassword, admin.id], async (updateErr) => {
                if (updateErr) {
                    console.error("Admin password update error:", updateErr);
                    return res.status(500).json({ message: 'Failed to update password.' });
                }
                
                // Send the new password to the admin's email
                const emailSent = await sendEmail(
                    admin.email,
                    "Admin Password Reset",
                    `Hello ${admin.username},\n\nYour admin password has been reset.\n\nYour new password is: ${newPassword}\n\nPlease login with this password and change it immediately for security reasons.\n\nRegards,\nSystem Administrator`
                );
                
                if (emailSent) {
                    res.status(200).json({ message: 'A new password has been sent to your email.' });
                } else {
                    // If email fails, still return success but with a warning
                    res.status(200).json({ 
                        message: 'Password reset successful, but failed to send email. Please contact system administrator.',
                        password: newPassword // Only in development! Remove in production
                    });
                }
            });
        });
    } catch (error) {
        console.error("Admin forgot password error:", error);
        res.status(500).json({ message: 'Server error during password reset.' });
    }
};

/**
 * Fetches all registered students.
 */
const getAllStudents = (req, res) => {
    const sql = 'SELECT id, full_name, email, phone, college_name, college_id, profile_pic FROM users ORDER BY full_name ASC';
    db.query(sql, (err, results) => {
        if (err) {
            console.error("Error fetching students:", err);
            return res.status(500).json({ message: 'Error fetching students.' });
        }
        res.status(200).json(results);
    });
};

/**
 * Deletes a student by ID.
 */
const deleteStudent = (req, res) => {
    const { id } = req.params;
    if (!id) {
        return res.status(400).json({ message: 'Student ID is required for deletion.' });
    }
    const sql = 'DELETE FROM users WHERE id = ?';
    db.query(sql, [id], (err, result) => {
        if (err) {
            console.error("Error deleting student:", err);
            return res.status(500).json({ message: 'Failed to delete student.' });
        }
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Student not found.' });
        }
        res.status(200).json({ message: 'Student deleted successfully.' });
    });
};

/**
 * Fetches all test results with pagination.
 */
const getAllResults = async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    try {
        const [totalCountRows] = await db.promise().query('SELECT COUNT(*) AS totalCount FROM test_results');
        const totalCount = totalCountRows[0].totalCount;

        const sql = `
            SELECT 
                tr.result_id,
                tr.test_id,
                tr.user_id,
                tr.score,
                tr.total_questions,
                tr.attempted_questions,
                tr.correct_answers,
                COALESCE(tr.percentage, 0.00) AS percentage,
                tr.submission_time,
                u.full_name AS student_name,
                u.email AS student_email,
                t.test_name,
                t.course_name
            FROM test_results tr
            JOIN users u ON tr.user_id = u.id
            JOIN tests t ON tr.test_id = t.id
            ORDER BY tr.submission_time DESC
            LIMIT ? OFFSET ?;
        `;
        const [results] = await db.promise().query(sql, [limit, offset]);
        console.log("Backend: Fetched results for admin, count:", results.length);

        res.status(200).json({
            results: results,
            totalCount: totalCount,
            currentPage: page,
            totalPages: Math.ceil(totalCount / limit)
        });
    } catch (err) {
        console.error("Backend: Error fetching all results:", err);
        res.status(500).json({ message: 'Error fetching test results.' });
    }
};

/**
 * Fetches detailed information for a specific test result.
 */
const getDetailedResult = async (req, res) => {
    const { resultId } = req.params;
    if (!resultId) {
        return res.status(400).json({ message: 'Result ID is required.' });
    }

    try {
        const [resultRows] = await db.promise().query(
            `SELECT 
                tr.result_id, tr.test_id, tr.user_id, tr.score, tr.total_questions, 
                tr.attempted_questions, tr.correct_answers, COALESCE(tr.percentage, 0.00) AS percentage, tr.submission_time,
                u.full_name AS student_name, u.email AS student_email,
                t.test_name, t.course_name
            FROM test_results tr
            JOIN users u ON tr.user_id = u.id
            JOIN tests t ON tr.test_id = t.id
            WHERE tr.result_id = ?`, [resultId]
        );

        if (resultRows.length === 0) {
            return res.status(404).json({ message: 'Result not found.' });
        }
        const resultSummary = resultRows[0];

        const [responses] = await db.promise().query(
            `SELECT
                tresp.question_id,
                tresp.user_answer,
                tresp.is_correct,
                q.question_text,
                q.question_type,
                q.correct_answer AS actual_correct_answer,
                q.explanation,
                GROUP_CONCAT(CONCAT(o.option_id, ':', o.option_text) ORDER BY o.option_id ASC SEPARATOR '|||') AS options_data
            FROM test_responses tresp
            JOIN questions q ON tresp.question_id = q.question_id
            LEFT JOIN options o ON q.question_id = o.question_id
            WHERE tresp.result_id = ?
            GROUP BY tresp.question_id, tresp.user_answer, tresp.is_correct, q.question_text, q.question_type, q.correct_answer, q.explanation
            ORDER BY tresp.question_id ASC`, [resultId]
        );

        const detailedResponses = responses.map(response => {
            const options = {};
            if (response.options_data) {
                response.options_data.split('|||').forEach(opt => {
                    const [id, text] = opt.split(':');
                    if (id && text) { 
                         options[id] = text;
                    }
                });
            }
            return {
                question_id: response.question_id,
                question_text: response.question_text,
                question_type: response.question_type,
                user_answer: response.user_answer,
                is_correct: response.is_correct,
                actual_correct_answer: response.actual_correct_answer,
                explanation: response.explanation,
                options: options
            };
        });

        res.status(200).json({
            ...resultSummary,
            detailed_responses: detailedResponses
        });

    } catch (err) {
        console.error("Backend: Error fetching detailed result:", err);
        res.status(500).json({ message: 'Error fetching detailed result.' });
    }
};

/**
 * Creates a new test.
 * Uses existing `tests` table columns: id, course_name, test_name, duration
 */
const createTest = async (req, res) => {
    const { course_name, test_name, duration } = req.body; 
    if (!course_name || course_name.trim() === '' || !test_name || test_name.trim() === '' || !duration) {
        return res.status(400).json({ message: 'Course name, test name, and duration are required.' });
    }
    try {
        const sql = 'INSERT INTO tests (course_name, test_name, duration) VALUES (?, ?, ?)';
        const [result] = await db.promise().query(sql, [course_name.trim(), test_name.trim(), duration]);
        res.status(201).json({ message: 'Test created successfully', testId: result.insertId });
    } catch (err) {
        console.error("Backend: Error creating test:", err);
        res.status(500).json({ message: 'Error creating test.' });
    }
};

/**
 * Fetches all tests.
 * Uses existing `tests` table columns: id, course_name, test_name, duration
 */
const getAllTests = async (req, res) => {
    try {
        const sql = 'SELECT id, course_name, test_name, duration FROM tests ORDER BY id DESC';
        const [tests] = await db.promise().query(sql);
        res.status(200).json(tests);
    } catch (err) {
        console.error("Backend: Error fetching all tests:", err);
        res.status(500).json({ message: 'Error fetching tests.' });
    }
};

/**
 * Fetches details for a specific test, including its questions and options.
 */
const getTestDetails = async (req, res) => {
    const { testId } = req.params;
    if (!testId) {
        return res.status(400).json({ message: 'Test ID is required.' });
    }
    try {
        // Fetch test basic info
        const [testRows] = await db.promise().query(
            'SELECT id, course_name, test_name, duration FROM tests WHERE id = ?',
            [testId]
        );
        if (testRows.length === 0) {
            return res.status(404).json({ message: 'Test not found.' });
        }
        const testDetails = testRows[0];

        // Fetch questions for this test
        const [questions] = await db.promise().query(
            'SELECT question_id, test_id, question_text, question_type, correct_answer, explanation, marks FROM questions WHERE test_id = ? ORDER BY question_id ASC',
            [testId]
        );

        // For each MCQ or MSQ question, fetch its options
        for (let i = 0; i < questions.length; i++) {
            // Fetch options for both MCQ and MSQ first
            if (questions[i].question_type === 'MCQ' || questions[i].question_type === 'MSQ') {
                const [options] = await db.promise().query(
                    'SELECT option_id, option_text FROM options WHERE question_id = ? ORDER BY option_id ASC',
                    [questions[i].question_id]
                );
                questions[i].options = options;
                
                // Parse correct_answers for MSQ questions
                if (questions[i].question_type === 'MSQ') {
                    if (questions[i].correct_answer) {
                        // Split the comma-separated string into an array of labels (A, B, C, etc.)
                        const labels = questions[i].correct_answer.split(',').map(item => item.trim());
                        // Filter out empty strings
                        const validLabels = labels.filter(label => label !== '');
                        
                        // Store the original labels
                        questions[i].correct_answer_labels = validLabels;
                        
                        // Convert labels to option text
                        const correctAnswers = [];
                        validLabels.forEach(label => {
                            // Convert label to index (A -> 0, B -> 1, etc.)
                            const index = label.charCodeAt(0) - 65; // 65 is ASCII for 'A'
                            if (index >= 0 && index < options.length) {
                                correctAnswers.push(options[index].option_text);
                            }
                        });
                        
                        questions[i].correct_answers = correctAnswers;
                        console.log(`Converted MSQ labels to option text for question ${questions[i].question_id}:`, {
                            labels: validLabels,
                            optionText: correctAnswers
                        });
                    } else {
                        questions[i].correct_answers = [];
                        questions[i].correct_answer_labels = [];
                    }
                }
            }
        }
        
        res.status(200).json({ ...testDetails, questions });
    } catch (err) {
        console.error("Backend: Error fetching test details and questions:", err);
        res.status(500).json({ message: 'Error fetching test details and questions.' });
    }
};

/**
 * Updates an existing test.
 */
const updateTest = async (req, res) => {
    const { testId } = req.params;
    const { course_name, test_name, duration } = req.body; 

    if (!testId || !course_name || course_name.trim() === '' || !test_name || test_name.trim() === '' || !duration) {
        return res.status(400).json({ message: 'Test ID, course name, test name, and duration are required for update.' });
    }
    
    // Ensure duration is an integer before using in SQL
    const parsedDuration = parseInt(duration, 10);
    if (isNaN(parsedDuration)) {
        return res.status(400).json({ message: 'Duration must be a valid number.' });
    }

    try {
        const sql = 'UPDATE tests SET course_name = ?, test_name = ?, duration = ? WHERE id = ?';
        const [result] = await db.promise().query(sql, [course_name.trim(), test_name.trim(), parsedDuration, testId]);
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Test not found or no changes made.' });
        }
        res.status(200).json({ message: 'Test updated successfully.' });
    } catch (err) {
        console.error("Backend: Error updating test:", err);
        res.status(500).json({ message: 'Error updating test.' });
    }
};

/**
 * Deletes a test by ID.
 * Note: If you have foreign key constraints with ON DELETE CASCADE,
 * related questions, options, test_responses, and test_results will also be deleted.
 */
const deleteTest = async (req, res) => {
    const { testId } = req.params;
    if (!testId) {
        return res.status(400).json({ message: 'Test ID is required for deletion.' });
    }
    try {
        const sql = 'DELETE FROM tests WHERE id = ?';
        const [result] = await db.promise().query(sql, [testId]);
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Test not found.' });
        }
        res.status(200).json({ message: 'Test deleted successfully.' });
    }
    catch (err) {
        console.error("Backend: Error deleting test:", err);
        res.status(500).json({ message: 'Error deleting test.' });
    }
};

/**
 * Creates a new question for a specific test.
 * Handles MCQ, MSQ, and NAT, and their options (if MCQ or MSQ).
 */
const createQuestion = async (req, res) => {
    try {
        // Extract data from request
        const { testId } = req.params;
        const { question_text, question_type, correct_answer, correct_answers, explanation, marks, options } = req.body;
        
        // Basic validation
        if (!testId || !question_text || !question_type || marks === undefined || marks === null) {
            return res.status(400).json({ message: 'Missing required fields' });
        }
        
        // Parse marks to integer
        const parsedMarks = parseInt(marks, 10);
        if (isNaN(parsedMarks) || parsedMarks <= 0) {
            return res.status(400).json({ message: 'Marks must be a positive number' });
        }
        
        // Validate MSQ options
        if (question_type === 'MSQ' && (!correct_answers || !Array.isArray(correct_answers) || correct_answers.length === 0)) {
            return res.status(400).json({ message: 'MSQ questions require at least one correct option' });
        }
        
        // Start transaction
        await db.promise().beginTransaction();
        
        // For MSQ, store correct answers as option labels (A, B, C, D)
        let correctAnswerValue = '';
        if (question_type === 'MSQ' && correct_answers && Array.isArray(correct_answers)) {
            // Convert selected option texts to their corresponding labels (A, B, C, etc.)
            const optionLabels = [];
            
            // First, get all valid option texts
            const filteredOptions = (options || []).filter(opt => opt.option_text && opt.option_text.trim() !== '');
            const optionTexts = filteredOptions.map(opt => opt.option_text.trim());
            
            correct_answers.forEach(answer => {
                const index = optionTexts.indexOf(answer);
                if (index !== -1) {
                    // Convert index to letter (0 -> A, 1 -> B, etc.)
                    const label = String.fromCharCode(65 + index); // 65 is ASCII for 'A'
                    optionLabels.push(label);
                }
            });
            
            correctAnswerValue = optionLabels.join(', ');
            console.log("MSQ correct answers converted to labels for create:", correctAnswerValue);
        } else if (correct_answer) {
            correctAnswerValue = correct_answer.trim();
        }
        
        // Insert question
        const [questionResult] = await db.promise().query(
            'INSERT INTO questions (test_id, question_text, question_type, correct_answer, explanation, marks) VALUES (?, ?, ?, ?, ?, ?)',
            [testId, question_text.trim(), question_type, correctAnswerValue, explanation ? explanation.trim() : '', parsedMarks]
        );
        
        const questionId = questionResult.insertId;
        
        // If MCQ or MSQ, insert options
        if ((question_type === 'MCQ' || question_type === 'MSQ') && options && Array.isArray(options)) {
            // Filter out empty options
            const validOptions = options.filter(opt => opt && opt.option_text && opt.option_text.trim() !== '');
            
            // Insert each option individually
            for (const opt of validOptions) {
                await db.promise().query(
                    'INSERT INTO options (question_id, option_text) VALUES (?, ?)',
                    [questionId, opt.option_text.trim()]
                );
            }
        }
        
        // Commit transaction
        await db.promise().commit();
        
        // Send success response
        res.status(201).json({ 
            message: 'Question created successfully', 
            questionId 
        });
        
    } catch (err) {
        // Rollback transaction on error
        try {
            await db.promise().rollback();
        } catch (rollbackErr) {
            console.error("Error during rollback:", rollbackErr);
        }
        
        console.error("Error creating question:", err);
        res.status(500).json({ message: 'Failed to create question. Please try again.' });
    }
};

/**
 * Updates an existing question.
 * Handles updating question text, type, correct answer, explanation, marks, and options for MCQ and MSQ.
 */
const updateQuestion = async (req, res) => {
    const { questionId } = req.params;
    const { question_text, question_type, correct_answer, correct_answers, explanation, marks, options } = req.body;

    console.log("Update Question Request:", {
        questionId,
        question_type,
        correct_answer: correct_answer || 'none',
        correct_answers: correct_answers || 'none',
        options: options ? options.length : 0
    });

    if (!questionId) {
        return res.status(400).json({ message: 'Question ID is required for update.' });
    }
    if (!question_text || question_text.trim() === '' || !question_type || marks === undefined || marks === null || marks === '') {
        return res.status(400).json({ message: 'Question text, type, and marks are required for update.' });
    }

    const parsedMarks = parseInt(marks, 10);
    if (isNaN(parsedMarks) || parsedMarks <= 0) {
        return res.status(400).json({ message: 'Marks must be a positive number.' });
    }

    if (question_type === 'MCQ') {
        const filledOptions = (options || []).filter(opt => opt.option_text && opt.option_text.trim() !== '');
        if (filledOptions.length < 2) {
            return res.status(400).json({ message: 'MCQ questions require at least two non-empty options.' });
        }
        if (!correct_answer || correct_answer.trim() === '') {
            return res.status(400).json({ message: 'MCQ questions require a correct option to be selected.' });
        }
    } else if (question_type === 'MSQ') {
        const filledOptions = (options || []).filter(opt => opt.option_text && opt.option_text.trim() !== '');
        if (filledOptions.length < 2) {
            return res.status(400).json({ message: 'MSQ questions require at least two non-empty options.' });
        }
        if (!correct_answers || !Array.isArray(correct_answers) || correct_answers.length === 0) {
            return res.status(400).json({ message: 'MSQ questions require at least one correct option to be selected.' });
        }
    } else if (question_type === 'NAT' && (!correct_answer || correct_answer.trim() === '')) {
        return res.status(400).json({ message: 'NAT questions require a correct answer.' });
    }

    try {
        console.log(`Starting update for question ${questionId} of type ${question_type}`);
        await db.promise().beginTransaction();

        // For MSQ, store correct answers as option labels (A, B, C, D)
        let correctAnswerValue = '';
        if (question_type === 'MSQ' && correct_answers) {
            if (Array.isArray(correct_answers)) {
                // Convert selected option texts to their corresponding labels (A, B, C, etc.)
                const optionLabels = [];
                
                // First, get all valid option texts
                const filteredOptions = (options || []).filter(opt => opt.option_text && opt.option_text.trim() !== '');
                const optionTexts = filteredOptions.map(opt => opt.option_text.trim());
                
                correct_answers.forEach(answer => {
                    const index = optionTexts.indexOf(answer);
                    if (index !== -1) {
                        // Convert index to letter (0 -> A, 1 -> B, etc.)
                        const label = String.fromCharCode(65 + index); // 65 is ASCII for 'A'
                        optionLabels.push(label);
                    }
                });
                
                correctAnswerValue = optionLabels.join(', ');
                console.log("MSQ correct answers converted to labels for update:", correctAnswerValue);
            } else if (typeof correct_answers === 'string') {
                // If it's already a string in the format "A, B, C", use it directly
                if (/^[A-Z](, [A-Z])*$/.test(correct_answers)) {
                    correctAnswerValue = correct_answers;
                } else {
                    // Try to convert from comma-separated text to labels
                    // This is a fallback and might not work correctly
                    correctAnswerValue = correct_answers;
                }
            }
            console.log("MSQ correct answers for update:", correctAnswerValue);
        } else if (correct_answer) {
            correctAnswerValue = correct_answer.trim();
        }
        
        console.log("Final correct answer value:", correctAnswerValue);

        // Validate the question exists before updating
        const [existingQuestion] = await db.promise().query(
            'SELECT * FROM questions WHERE question_id = ?',
            [questionId]
        );
        
        if (!existingQuestion || existingQuestion.length === 0) {
            await db.promise().rollback();
            return res.status(404).json({ message: 'Question not found.' });
        }
        
        console.log(`Updating question ${questionId} from type ${existingQuestion[0].question_type} to ${question_type}`);
        
        // Update question details
        try {
            const [questionUpdateResult] = await db.promise().query(
                'UPDATE questions SET question_text = ?, question_type = ?, correct_answer = ?, explanation = ?, marks = ? WHERE question_id = ?',
                [question_text.trim(), question_type, correctAnswerValue, explanation ? explanation.trim() : null, parsedMarks, questionId]
            );
            console.log(`Question update result: ${questionUpdateResult.affectedRows} rows affected`);
        } catch (updateErr) {
            console.error("Error updating question:", updateErr);
            throw new Error(`Failed to update question: ${updateErr.message}`);
        }
        // We've already checked if the question exists, so we don't need to check affectedRows here

        // If MCQ or MSQ, handle options update: delete existing and insert new ones
        if (question_type === 'MCQ' || question_type === 'MSQ') {
            try {
                // Delete existing options
                await db.promise().query('DELETE FROM options WHERE question_id = ?', [questionId]);
                console.log(`Deleted existing options for question ${questionId}`);
                
                // Filter and validate options
                const filteredOptions = Array.isArray(options) 
                    ? options.filter(opt => opt && opt.option_text && opt.option_text.trim() !== '')
                    : [];
                    
                console.log("Filtered options:", JSON.stringify(filteredOptions));
                
                // Insert new options one by one
                if (filteredOptions.length > 0) {
                    for (const opt of filteredOptions) {
                        const optionText = opt.option_text.trim();
                        console.log(`Inserting option: "${optionText}" for question ${questionId}`);
                        
                        await db.promise().query(
                            'INSERT INTO options (question_id, option_text) VALUES (?, ?)',
                            [questionId, optionText]
                        );
                    }
                    console.log(`Added ${filteredOptions.length} options for question ${questionId}`);
                } else {
                    console.log(`No valid options to add for question ${questionId}`);
                }
            } catch (optErr) {
                console.error("Error handling options:", optErr);
                throw new Error(`Failed to update options: ${optErr.message}`);
            }
        } else { 
            // If not MCQ or MSQ (e.g., NAT), ensure no options are linked
            await db.promise().query('DELETE FROM options WHERE question_id = ?', [questionId]);
            console.log(`Deleted options for NAT question ${questionId}`);
        }

        await db.promise().commit();
        res.status(200).json({ message: 'Question updated successfully' });
    } catch (err) {
        try {
            await db.promise().rollback();
        } catch (rollbackErr) {
            console.error("Error during rollback:", rollbackErr);
        }
        
        console.error("Backend: Error updating question:", err);
        let errorMessage = 'An unexpected database error occurred while updating the question.';
        if (err.code) {
             switch (err.code) {
                case 'ER_BAD_FIELD_ERROR':
                    errorMessage = `Database Schema Error: A column in your database query does not match your table schema. Error: ${err.message}`;
                    break;
                case 'ER_PARSE_ERROR':
                    errorMessage = `SQL Syntax Error: There is an error in the SQL query itself. Error: ${err.message}`;
                    break;
                case 'ER_NO_REFERENCED_ROW_2': 
                case 'ER_NO_REFERENCED_ROW':
                    errorMessage = `Foreign Key Constraint Error: The question ID used does not exist in a referenced table. Error: ${err.message}`;
                    break;
                case 'ER_DUP_ENTRY':
                    errorMessage = `Duplicate Entry Error: A record with this unique identifier already exists. Error: ${err.message}`;
                    break;
                case 'ER_DATA_TOO_LONG':
                    errorMessage = `Data too long for column: One of the text fields might be too long for its column type in your database. Error: ${err.message}`;
                    break;
                case 'ER_TRUNCATED_WRONG_VALUE_FOR_FIELD':
                    errorMessage = `Data Type Mismatch: An invalid value was provided for a field. Error: ${err.message}`;
                    break;
                default:
                    errorMessage = `Unhandled Database Error (${err.code}): ${err.message}`;
                    break;
            }
        } else if (err.message) {
            errorMessage = err.message;
        } else {
            errorMessage = `Unknown error: ${JSON.stringify(err)}`;
        }
        
        console.error("Sending error response:", errorMessage);
        res.status(500).json({ message: errorMessage });
    }
};

/**
 * Deletes a question and its associated options.
 * Using ON DELETE CASCADE in schema handles related options.
 */
const deleteQuestion = async (req, res) => {
    const { questionId } = req.params;
    if (!questionId) {
        return res.status(400).json({ message: 'Question ID is required for deletion.' });
    }
    try {
        const sql = 'DELETE FROM questions WHERE question_id = ?';
        const [result] = await db.promise().query(sql, [questionId]);
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Question not found.' });
        }
        res.status(200).json({ message: 'Question deleted successfully.' });
    } catch (err) {
        console.error("Backend: Error deleting question:", err);
        res.status(500).json({ message: 'Error deleting question: ' + (err.message || 'Unknown database error.') });
    }
};

module.exports = {
    verifyAdmin,
    registerAdmin,
    loginAdmin,
    forgotAdminPassword,
    getAdminProfile,
    updateAdminProfile,
    changeAdminPassword,
    updateProfilePicture,
    getAllStudents,
    deleteStudent,
    getAllResults,
    getDetailedResult,
    createTest,
    getAllTests,
    getTestDetails,
    updateTest, 
    deleteTest, 
    createQuestion,
    updateQuestion,
    deleteQuestion
};
