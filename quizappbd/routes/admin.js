// quizappbd/routes/admin.js
const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Setup multer for file uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        // Ensure the 'uploads/admin' directory exists
        const uploadDir = './uploads/admin';
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        // Generate a unique filename with original extension
        const ext = path.extname(file.originalname);
        cb(null, `admin_${Date.now()}${ext}`);
    }
});

const upload = multer({ 
    storage: storage,
    limits: {
        fileSize: 5 * 1024 * 1024 // Limit file size to 5MB
    },
    fileFilter: (req, file, cb) => {
        // Only allow image files
        if (file.mimetype.startsWith('image/')) {
            cb(null, true);
        } else {
            cb(new Error('Only image files are allowed!'), false);
        }
    }
});
const { 
    verifyAdmin, 
    loginAdmin, 
    registerAdmin,
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
} = require('../controllers/adminController');

// Admin authentication routes
router.post('/login-admin', loginAdmin);
router.post('/register-admin', registerAdmin); 
router.post('/forgot-password', forgotAdminPassword); 

// Admin profile routes
router.get('/profile', verifyAdmin, getAdminProfile);
router.put('/profile', verifyAdmin, updateAdminProfile);
router.put('/change-password', verifyAdmin, changeAdminPassword);
router.put('/profile-picture', verifyAdmin, upload.single('profilePicture'), updateProfilePicture);

// Student Management Routes
router.get('/students', verifyAdmin, getAllStudents);
router.delete('/students/:id', verifyAdmin, deleteStudent);

// Test Results Routes
router.get('/results', verifyAdmin, getAllResults);
router.get('/results/details/:resultId', verifyAdmin, getDetailedResult);

// Test Management Routes
router.post('/tests', verifyAdmin, createTest); // Create a new test
router.get('/tests', verifyAdmin, getAllTests); // Get all tests
router.get('/tests/:testId', verifyAdmin, getTestDetails); // Get details for a specific test (including its questions)
router.put('/tests/:testId', verifyAdmin, updateTest); // Update test details (Fixed: ensured this route is present)
router.delete('/tests/:testId', verifyAdmin, deleteTest); // Delete a test (Fixed: ensured this route is present)

// Question Management Routes for a specific test
router.post('/tests/:testId/questions', verifyAdmin, createQuestion); // Create question for a test
router.post('/tests/:testId/add-question-simple', verifyAdmin, (req, res) => {
    // This is a simplified version that will be used as a fallback
    try {
        const { testId } = req.params;
        const { question_text, question_type, correct_answer, explanation, marks, options } = req.body;
        
        // Insert question directly using callback style to avoid promise issues
        db.query(
            'INSERT INTO questions (test_id, question_text, question_type, correct_answer, explanation, marks) VALUES (?, ?, ?, ?, ?, ?)',
            [testId, question_text, question_type, correct_answer || '', explanation || '', marks || 1],
            (err, result) => {
                if (err) {
                    console.error("Error inserting question:", err);
                    return res.status(500).json({ message: 'Failed to create question' });
                }
                
                const questionId = result.insertId;
                
                // If it's an MCQ and has options, insert them
                if (question_type === 'MCQ' && options && options.length > 0) {
                    // Insert each option individually to avoid batch insert issues
                    let optionsProcessed = 0;
                    let optionsSuccess = 0;
                    
                    options.forEach(opt => {
                        if (opt && opt.option_text) {
                            db.query(
                                'INSERT INTO options (question_id, option_text) VALUES (?, ?)',
                                [questionId, opt.option_text],
                                (optErr) => {
                                    optionsProcessed++;
                                    if (!optErr) optionsSuccess++;
                                    
                                    // When all options are processed, send response
                                    if (optionsProcessed === options.length) {
                                        res.status(201).json({ 
                                            message: 'Question created successfully', 
                                            questionId,
                                            optionsAdded: optionsSuccess
                                        });
                                    }
                                }
                            );
                        } else {
                            optionsProcessed++;
                            if (optionsProcessed === options.length) {
                                res.status(201).json({ 
                                    message: 'Question created successfully', 
                                    questionId,
                                    optionsAdded: optionsSuccess
                                });
                            }
                        }
                    });
                } else {
                    // If not MCQ or no options, just return success
                    res.status(201).json({ 
                        message: 'Question created successfully', 
                        questionId 
                    });
                }
            }
        );
    } catch (error) {
        console.error("Error in add-question-simple:", error);
        res.status(500).json({ message: 'Server error' });
    }
});
router.put('/questions/:questionId', verifyAdmin, updateQuestion); // Update a specific question
router.delete('/questions/:questionId', verifyAdmin, deleteQuestion); // Delete a specific question

module.exports = router;