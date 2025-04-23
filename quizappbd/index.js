const express = require('express');
const cors = require('cors');
const multer = require('multer');
const bodyParser = require('body-parser');
const path = require('path');
require('dotenv').config();

// Import routes
const authRoutes = require("./routes/auth");
const userRoutes = require("./routes/userRoutes");

const app = express();
const PORT = 5000;

// ✅ CORS Configuration
app.use(cors({
  origin: "http://localhost:5173", 
  credentials: true
}));

// ✅ Middlewares
app.use(express.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Setup multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, './uploads');
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});
const upload = multer({ storage: storage });

// ✅ API Routes
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);

// ✅ Root Route
app.get('/', (req, res) => {
  res.send('<h3>✅ Online Test Portal Backend is running</h3>');
});

// ✅ Start Server
app.listen(PORT, () => {
  console.log(`🚀 Server is running on http://localhost:${PORT}`);
});
