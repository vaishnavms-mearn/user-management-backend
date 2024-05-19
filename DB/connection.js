require("dotenv").config();
const mysql = require('mysql2');
const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: process.env.DB_PASS,
    database: 'user_management'
});

db.connect((err) => {
    if (err) {
        console.error('Database connection error: ', err);
        return;
    }
    console.log('Connected to database');
});

module.exports = db;
