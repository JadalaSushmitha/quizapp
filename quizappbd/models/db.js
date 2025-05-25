require("dotenv").config();
const mysql = require("mysql2");

const db = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10, // number of simultaneous connections
  queueLimit: 0
});

// Optional: Test the DB connection
db.getConnection((err, connection) => {
  if (err) {
    console.error("❌ Error connecting to MySQL DB:", err.message);
  } else {
    console.log("~Connected to MySQL DB (using connection pool)");
    connection.release(); // release test connection
  }
});

module.exports = db;
