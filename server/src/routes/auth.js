import { Router } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import nodemailer from "nodemailer";
import crypto from "crypto"; // Needed for the UUID
import { pool } from "../db.js";
import { requireAuth } from "../middleware/requireAuth.js";

const router = Router();

const makeToken = (user) =>
  jwt.sign({ sub: user.id, role: user.role }, process.env.JWT_SECRET, {
    expiresIn: "7d",
  });

router.post("/register", async (req, res) => {
  try {
    const { full_name, password, recovery_email } = req.body;
    const email = (req.body.email ?? "").trim().toLowerCase();
    
    if (!full_name || !email || !password || password.length < 8 || !recovery_email) {
      return res
        .status(400)
        .json({ error: "Missing fields, or password shorter than 8." });
    }
    
    const hash = await bcrypt.hash(password, 10);
    
    const { rows } = await pool.query(
      `INSERT INTO users (full_name, email, password_hash, recovery_email)
       VALUES ($1, $2, $3, $4)
       RETURNING id, full_name, email, role`,
      [full_name.trim(), email, hash, recovery_email.trim().toLowerCase()],
    );
    
    res.status(201).json({ user: rows[0], token: makeToken(rows[0]) });
  } catch (err) {
    if (err.code === "23505")
      return res.status(409).json({ error: "That email is already registered.", field: "email" });
    if (err.code === "23514")
      return res.status(400).json({ error: "Use your CTU email (name@ctu.edu.ph).", field: "email" });
    console.error(err);
    res.status(500).json({ error: "Server error." });
  }
});

router.post("/login", async (req, res) => {
  try {
    const { email = "", password = "" } = req.body;
    const { rows } = await pool.query(
      `SELECT id, full_name, email, role, is_active, password_hash
       FROM users WHERE email = $1`,
      [email.trim().toLowerCase()],
    );
    const user = rows[0];
    const ok =
      user && user.is_active && (await bcrypt.compare(password, user.password_hash));
    if (!ok) return res.status(401).json({ error: "Invalid email or password." });

    delete user.password_hash;
    res.json({ user, token: makeToken(user) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error." });
  }
});

router.get("/me", requireAuth, async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT id, full_name, email, role, is_active, created_at
       FROM users WHERE id = $1`,
      [req.user.id],
    );
    const user = rows[0];
    if (!user || !user.is_active)
      return res.status(401).json({ error: "Account not available." });
    res.json({ user });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error." });
  }
});

// --- FORGOT PASSWORD (SEND OTP TO GMAIL) ---
router.post("/forgot-password", async (req, res) => {
  try {
    const { email, recovery_email } = req.body; 
    
    const { rows } = await pool.query(
      "SELECT id FROM users WHERE email = $1 AND recovery_email = $2", 
      [email.trim().toLowerCase(), recovery_email.trim().toLowerCase()]
    );
    
    if (rows.length === 0) {
      return res.status(400).json({ 
        error: "No account found matching that CTU email and Recovery Gmail." 
      });
    }
    const userId = rows[0].id;

    // 1. Generate a random UUID for the OTP row (since your id column is uuid)
    const otpId = crypto.randomUUID();
    
    // 2. Generate the plain 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    
    // 3. Hash the OTP for storage
    const otpHash = await bcrypt.hash(otp, 10);
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 mins

    // 4. Clear old OTPs for this user
    await pool.query("DELETE FROM otp_codes WHERE user_id = $1", [userId]);
    
    // 5. Insert matching your exact table columns
    await pool.query(
      `INSERT INTO otp_codes (id, user_id, email, purpose, code_hash, expires_at, attempts) 
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [otpId, userId, email.trim().toLowerCase(), 'reset_password', otpHash, expiresAt, 0]
    );

    // 6. Send the email
    let transporter = nodemailer.createTransport({
      service: "gmail",
      auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
    });

    await transporter.sendMail({
      from: `"CTU Confessions" <${process.env.EMAIL_USER}>`,
      to: recovery_email,
      subject: "Your Password Reset Code",
      html: `
        <h2>Password Reset</h2>
        <p>Your 6-digit verification code is:</p>
        <h1 style="color: #b91c1c; font-size: 32px; letter-spacing: 5px;">${otp}</h1>
        <p>This code expires in 5 minutes.</p>
      `,
    });

    res.status(200).json({ message: "OTP sent successfully." });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error." });
  }
});

// --- RESET PASSWORD (VERIFY OTP & CHANGE) ---
router.post("/reset-password", async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;
    if (!email || !otp || !newPassword || newPassword.length < 8) {
      return res.status(400).json({ error: "Missing fields or password too short." });
    }

    const userRes = await pool.query("SELECT id FROM users WHERE email = $1", [email.trim().toLowerCase()]);
    if (userRes.rows.length === 0) return res.status(400).json({ error: "Invalid request." });
    const userId = userRes.rows[0].id;

    // 1. Get the active OTP record
    const { rows } = await pool.query(
      `SELECT id, code_hash FROM otp_codes 
       WHERE user_id = $1 AND purpose = 'reset_password' AND expires_at > NOW() AND used_at IS NULL`,
      [userId]
    );

    if (rows.length === 0) {
      return res.status(400).json({ error: "Invalid or expired OTP." });
    }

    const otpRecord = rows[0];

    // 2. Compare the plain text OTP from user with the hashed OTP in DB
    const isValid = await bcrypt.compare(otp.trim(), otpRecord.code_hash);
    
    if (!isValid) {
      // Optional: You could increment the 'attempts' column here to lock out brute force
      return res.status(400).json({ error: "Invalid or expired OTP." });
    }

    // 3. Update the password
    const hash = await bcrypt.hash(newPassword, 10);
    await pool.query("UPDATE users SET password_hash = $1 WHERE id = $2", [hash, userId]);

    // 4. Mark OTP as used (instead of deleting, per your DB design)
    await pool.query("UPDATE otp_codes SET used_at = NOW() WHERE id = $1", [otpRecord.id]);

    res.status(200).json({ message: "Password updated successfully." });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error." });
  }
});

router.patch("/me", requireAuth, async (req, res) => {
  try {
    const full_name = (req.body.full_name ?? "").trim();
    const email = (req.body.email ?? "").trim().toLowerCase();
    if (!full_name || !email)
      return res.status(400).json({ error: "Name and email are required." });
    const { rows } = await pool.query(
      `UPDATE users SET full_name = $1, email = $2
       WHERE id = $3 AND is_active
       RETURNING id, full_name, email, role, created_at`,
      [full_name, email, req.user.id],
    );
    if (!rows[0]) return res.status(401).json({ error: "Account not available." });
    res.json({ user: rows[0] });
  } catch (err) {
    if (err.code === "23505")
      return res.status(409).json({ error: "That email is already used by another account.", field: "email" });
    if (err.code === "23514")
      return res.status(400).json({
        error: err.constraint === "users_full_name_not_blank" ? "Please enter your name." : "Use your CTU email (name@ctu.edu.ph).",
        field: err.constraint === "users_full_name_not_blank" ? "fullName" : "email",
      });
    console.error(err);
    res.status(500).json({ error: "Server error." });
  }
});

export default router;