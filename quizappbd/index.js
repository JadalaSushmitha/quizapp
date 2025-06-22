// quizappbd/index.js
const express = require('express');
const cors = require('cors');
const multer = require('multer');
const bodyParser = require('body-parser');
const path = require('path');
require('dotenv').config(); // Ensure dotenv is loaded early
const rateLimit = require("express-rate-limit");
const fs = require('fs'); // Import fs module for directory check

// Import routes
const authRoutes = require("./routes/auth");
const userRoutes = require("./routes/userRoutes");
const testRoutes = require("./routes/testRoutes");
const resultRoutes = require("./routes/resultRoutes");
const adminRoutes = require('./routes/admin'); 

const app = express();
const PORT = process.env.PORT || 5000; // Use PORT from .env or default to 5000

// CORS Configuration
app.use(cors({
    origin: "http://localhost:5173", // Your frontend URL
    credentials: true
}));

// Rate Limiting Middleware
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // max requests per IP
    message: "Too many requests from this IP, please try again after 15 minutes."
});

// Apply to specific routes that might be vulnerable to brute force
app.use("/api/auth/login", limiter);
app.use("/api/auth/resend-password", limiter); // Apply to resend password as well
app.use("/api/admin/login-admin", limiter); // Apply to admin login

// Middlewares for parsing request bodies
app.use(express.json()); // For JSON payloads
app.use(express.urlencoded({ extended: true })); // For URL-encoded payloads (form submissions)

// Serve static files from the 'uploads' directory
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Setup multer for file uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        // Ensure the 'uploads' directory exists
        const uploadDir = './uploads';
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir);
        }
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        // Generate a unique filename with original extension
        cb(null, `${Date.now()}-${file.originalname}`);
    }
});
const upload = multer({ 
    storage: storage,
    limits: {
        fileSize: 5 * 1024 * 1024 // Limit file size to 5MB (adjust as per your project's needs, e.g., 50KB-500KB as in problem statement, needs more granular control per field)
    },
    fileFilter: (req, file, cb) => {
        // Basic file type validation (e.g., images)
        if (file.mimetype.startsWith('image/')) {
            cb(null, true);
        } else {
            cb(new Error('Only image files are allowed!'), false);
        }
    }
});

// Middleware for handling file uploads on specific routes (e.g., user registration)
// You might need to apply this 'upload' middleware directly to your user registration route
// For example, in userRoutes.js or authRoutes.js, you'd use it like:
// router.post('/register', upload.fields([{ name: 'profile_pic', maxCount: 1 }, { name: 'college_id_card', maxCount: 1 }]), userController.registerUser);

// API Routes
app.use("/api/auth", authRoutes); // Authentication routes (login, register, forgot password etc.)
app.use("/api/users", userRoutes); // User-specific routes (dashboard, profile, change password etc.)
app.use("/api", testRoutes); // Test creation, fetching questions etc.
app.use("/api/result", resultRoutes); // Result submission and viewing by students
app.use('/api/admin', adminRoutes); // Admin specific routes

// Root Route
app.get('/', (req, res) => {
    res.send('<h3>Online Test Portal Backend is running</h3>');
});

// Direct question update endpoint - bypassing all complex logic
app.put('/api/direct/update-question/:questionId', async (req, res) => {
    try {
        const db = require('./models/db');
        const { questionId } = req.params;
        const { question_text, question_type, correct_answer, correct_answers, explanation, marks, options } = req.body;
        
        console.log("Direct update endpoint received:", { 
            questionId, 
            question_type,
            correct_answer: correct_answer || 'none',
            correct_answers: correct_answers || 'none',
            options: options ? options.length : 0
        });
        
        // Handle correct_answers for MSQ questions
        let correctAnswerValue = '';
        if (question_type === 'MSQ' && correct_answers) {
            // Convert option text to option labels (A, B, C, D, etc.)
            if (Array.isArray(correct_answers) && options && Array.isArray(options)) {
                // Map selected option texts to their corresponding labels (A, B, C, etc.)
                const optionLabels = [];
                const optionTexts = options.map(opt => opt.option_text.trim());
                
                correct_answers.forEach(answer => {
                    const index = optionTexts.indexOf(answer);
                    if (index !== -1) {
                        // Convert index to letter (0 -> A, 1 -> B, etc.)
                        const label = String.fromCharCode(65 + index); // 65 is ASCII for 'A'
                        optionLabels.push(label);
                    }
                });
                
                correctAnswerValue = optionLabels.join(', ');
                console.log("Converted MSQ answers to labels:", correctAnswerValue);
            } else if (typeof correct_answers === 'string') {
                // If it's already in the format "A, B, C", use it directly
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
            correctAnswerValue = correct_answer;
        }
        
        // First, check if the question exists
        db.query('SELECT * FROM questions WHERE question_id = ?', [questionId], (err, results) => {
            if (err) {
                console.error("Error checking question existence:", err);
                return res.status(500).json({ message: 'Database error', error: err.message });
            }
            
            if (results.length === 0) {
                return res.status(404).json({ message: 'Question not found' });
            }
            
            // Update the question
            db.query(
                'UPDATE questions SET question_text = ?, question_type = ?, correct_answer = ?, explanation = ?, marks = ? WHERE question_id = ?',
                [question_text, question_type, correctAnswerValue, explanation || '', marks || 1, questionId],
                (updateErr, updateResult) => {
                    if (updateErr) {
                        console.error("Error updating question:", updateErr);
                        return res.status(500).json({ message: 'Database error', error: updateErr.message });
                    }
                    
                    // Delete existing options
                    db.query('DELETE FROM options WHERE question_id = ?', [questionId], (deleteErr) => {
                        if (deleteErr) {
                            console.error("Error deleting options:", deleteErr);
                            return res.status(500).json({ message: 'Database error', error: deleteErr.message });
                        }
                        
                        // If MCQ or MSQ with options, insert them
                        if ((question_type === 'MCQ' || question_type === 'MSQ') && options && options.length > 0) {
                            let completed = 0;
                            let optionsAdded = 0;
                            
                            // Process each option
                            options.forEach(opt => {
                                if (!opt || !opt.option_text) {
                                    completed++;
                                    checkDone();
                                    return;
                                }
                                
                                db.query(
                                    'INSERT INTO options (question_id, option_text) VALUES (?, ?)',
                                    [questionId, opt.option_text.trim()],
                                    (optErr) => {
                                        if (optErr) {
                                            console.error("Error adding option:", optErr);
                                        }
                                        completed++;
                                        if (!optErr) optionsAdded++;
                                        checkDone();
                                    }
                                );
                            });
                            
                            function checkDone() {
                                if (completed === options.length) {
                                    console.log(`Added ${optionsAdded} options for question ${questionId}`);
                                    res.status(200).json({ 
                                        success: true,
                                        message: 'Question updated successfully', 
                                        questionId,
                                        optionsAdded
                                    });
                                }
                            }
                        } else {
                            // No options to add
                            res.status(200).json({ 
                                success: true,
                                message: 'Question updated successfully', 
                                questionId
                            });
                        }
                    });
                }
            );
        });
    } catch (error) {
        console.error("Direct update endpoint critical error:", error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// Direct question creation endpoint - bypassing all complex logic
app.post('/api/direct/add-question/:testId', async (req, res) => {
    try {
        const db = require('./models/db');
        const { testId } = req.params;
        const { question_text, question_type, correct_answer, correct_answers, explanation, marks, options } = req.body;
        
        console.log("Direct endpoint received:", { 
            testId, 
            question_type,
            correct_answer: correct_answer || 'none',
            correct_answers: correct_answers || 'none',
            options: options ? options.length : 0
        });
        
        // Handle correct_answers for MSQ questions
        let correctAnswerValue = '';
        if (question_type === 'MSQ' && correct_answers) {
            // Convert option text to option labels (A, B, C, D, etc.)
            if (Array.isArray(correct_answers) && options && Array.isArray(options)) {
                // Map selected option texts to their corresponding labels (A, B, C, etc.)
                const optionLabels = [];
                const optionTexts = options.map(opt => opt.option_text.trim());
                
                correct_answers.forEach(answer => {
                    const index = optionTexts.indexOf(answer);
                    if (index !== -1) {
                        // Convert index to letter (0 -> A, 1 -> B, etc.)
                        const label = String.fromCharCode(65 + index); // 65 is ASCII for 'A'
                        optionLabels.push(label);
                    }
                });
                
                correctAnswerValue = optionLabels.join(', ');
                console.log("Converted MSQ answers to labels:", correctAnswerValue);
            } else if (typeof correct_answers === 'string') {
                // If it's already in the format "A, B, C", use it directly
                if (/^[A-Z](, [A-Z])*$/.test(correct_answers)) {
                    correctAnswerValue = correct_answers;
                } else {
                    // Try to convert from comma-separated text to labels
                    // This is a fallback and might not work correctly
                    correctAnswerValue = correct_answers;
                }
            }
            console.log("MSQ correct answers:", correctAnswerValue);
        } else if (correct_answer) {
            correctAnswerValue = correct_answer;
        }
        
        // Simple insert without transactions
        db.query(
            'INSERT INTO questions (test_id, question_text, question_type, correct_answer, explanation, marks) VALUES (?, ?, ?, ?, ?, ?)',
            [testId, question_text, question_type, correctAnswerValue, explanation || '', marks || 1],
            (err, result) => {
                if (err) {
                    console.error("Direct endpoint error:", err);
                    return res.status(500).json({ message: 'Database error', error: err.message });
                }
                
                const questionId = result.insertId;
                console.log("Question inserted with ID:", questionId);
                
                // If MCQ or MSQ with options, insert them
                if ((question_type === 'MCQ' || question_type === 'MSQ') && options && options.length > 0) {
                    let completed = 0;
                    let optionsAdded = 0;
                    
                    // Process each option
                    options.forEach(opt => {
                        if (!opt || !opt.option_text) {
                            completed++;
                            checkDone();
                            return;
                        }
                        
                        db.query(
                            'INSERT INTO options (question_id, option_text) VALUES (?, ?)',
                            [questionId, opt.option_text],
                            (optErr) => {
                                if (optErr) {
                                    console.error("Error adding option:", optErr);
                                }
                                completed++;
                                if (!optErr) optionsAdded++;
                                checkDone();
                            }
                        );
                    });
                    
                    function checkDone() {
                        if (completed === options.length) {
                            console.log(`Added ${optionsAdded} options for question ${questionId}`);
                            res.status(201).json({ 
                                success: true,
                                message: 'Question created successfully', 
                                questionId,
                                optionsAdded
                            });
                        }
                    }
                } else {
                    // No options to add
                    res.status(201).json({ 
                        success: true,
                        message: 'Question created successfully', 
                        questionId
                    });
                }
            }
        );
    } catch (error) {
        console.error("Direct endpoint critical error:", error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// Generic Error Handling Middleware 
app.use((err, req, res, next) => {
    console.error(err.stack); // Log the error stack for debugging
    res.status(500).json({ message: 'Something went wrong!', error: err.message });
});

// Start Server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});