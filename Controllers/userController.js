const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const db = require("../DB/connection.js");
const crypto = require("crypto");
const nodemailer = require("nodemailer");
require("dotenv").config();
//Register User
exports.register = async (req, res) => {
  const { email, password, name, company } = req.body;
  console.log("Received registration data:", req.body); // Log the incoming request data

  if (!email || !password || !name || !company) {
    return res.status(400).send("Missing required fields");
  }

  try {
    // Check if the email already exists in the database
    const emailCheckSql = 'SELECT * FROM users WHERE email = ?';
    db.query(emailCheckSql, [email], (err, results) => {
      if (err) {
        console.error("Error executing query:", err); // Log the error for debugging
        return res.status(500).send("Server error");
      }

      if (results.length > 0) {
        return res.status(409).send("Email is already registered");
      }

      const hashedPassword = bcrypt.hashSync(password, 8);
      const sql = `INSERT INTO users (name, company, email, password, userImage) VALUES (?, ?, ?, ?, ?)`;
      db.query(sql, [name, company, email, hashedPassword, ''], (err, result) => {
        if (err) {
          console.error("Error executing query:", err);
          return res.status(500).send("Server error");
        }
        res.status(200).send("User registered");
      });
    });
  } catch (err) {
    console.error("Unexpected error:", err); 
    res.status(500).send("Server error");
  }
};
// User Login
exports.login = async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).send("Missing email or password");
  }
  const sql = `SELECT * FROM users WHERE email = ?`;
  db.query(sql, [email], async (err, results) => {
    if (err) {
      console.error("Error executing query:", err);
      return res.status(500).send("Server error");
    }
    if (results.length === 0) {
      return res.status(401).send("User not found");
    }
    const user = results[0];
    if (user) {
      const token = jwt.sign({ userId: user._id }, "superkey2024");
      const passwordMatch = await bcrypt.compare(password, user.password);
      if (!passwordMatch) {
        return res.status(401).send("Invalid password");
      }
      res.status(200).json({ user, token });
    }
  });
};

//Edit User
exports.editUser = async (req, res) => {
  const { id } = req.params;
  const { name, company } = req.body;
  const uploadImage = req.file ? req.file.filename : req.body.userImage;
  if (!id) {
    return res.status(400).send("Missing user ID");
  }

  try {
    const sql = `UPDATE users SET
      name = ?,
      company = ?,
      userImage = ?
      WHERE id = ${id}`;

    db.query(sql, [name, company, uploadImage], (err, result) => {
      if (err) {
        console.error("Error executing query:", err);
        return res.status(500).send("Server error");
      }
      if (result.affectedRows === 0) {
        return res.status(404).send("User not found");
      }
      res.status(200).send("User updated successfully");
    });
  } catch (err) {
    res.status(500).json(err);
  }
};
// View User
exports.getUser = async (req, res) => {
  const { id } = req.params;

  if (!id) {
    return res.status(400).send("Missing user ID");
  }

  try {
    const sql = `SELECT * FROM users WHERE id = ?`;
    db.query(sql, [id], (err, result) => {
      if (err) {
        console.error("Error executing query:", err);
        return res.status(500).send("Server error");
      }
      if (result.length === 0) {
        return res.status(404).send("User not found");
      }
      res.status(200).json(result[0]);
    });
  } catch (err) {
    res.status(500).json(err);
  }
};

const generateResetToken = () => {
  return crypto.randomBytes(32).toString("hex");
};

exports.resetPassword = async (req, res) => {
  const { email } = req.body;

  if (!email) {
    console.error("Email not provided");
    return res.status(400).send("Email is required");
  }

  const token = generateResetToken();
  console.log(`Reset token generated for email: ${email}`);

  const sql = `UPDATE users SET reset_token = ? WHERE email = ?`;

  db.query(sql, [token, email], (err, result) => {
    if (err) {
      console.error("Database error:", err);
      return res.status(500).send("Server error");
    }

    if (result.affectedRows === 0) {
      console.error("Email not found in database:", email);
      return res.status(404).send("Email not found");
    }

    const transporter = nodemailer.createTransport({
      service: "Gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: "ndemivoupyzhyhhg",
      },
    });

    const mailOptions = {
      to: email,
      subject: "Password Reset",
      text: `You requested a password reset. Click the link to reset your password: http://localhost:3001/reset-password/${token}`,
    };

    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.error("Email sending failed:", error);
        return res.status(500).send("Email sending failed");
      }

      console.log(`Password reset email sent to ${email}: ${info.response}`);
      res?.status(200).send("Password reset email sent");
    });
  });
};

// Handle password reset
exports.resetPasswordConfirm = async (req, res) => {
  const { token, newPassword } = req.body;

  const sql = `UPDATE users SET password = ?, reset_token = NULL WHERE reset_token = ?`;
  db.query(sql, [newPassword, token], (err, results) => {
    if (err) return res.status(500).send("Server error");
    if (results.affectedRows === 0)
      return res.status(400).send("Invalid token");
    res.status(200).send("Password reset successful");
  });
};
