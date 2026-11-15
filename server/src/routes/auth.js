import { Router } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { pool } from "../db.js";
import { requireAuth } from "../middleware/requireAuth.js";

const router = Router();

const makeToken = (user) =>
  jwt.sign({ sub: user.id, role: user.role }, process.env.JWT_SECRET, {
    expiresIn: "7d",
  });

router.post("/register", async (req, res) => {
  try {
   // 1. Destructure recovery_email
    const { full_name, password, recovery_email } = req.body;
    const email = (req.body.email ?? "").trim().toLowerCase();
    
    // 2. Add validation for the new field
    if (!full_name || !email || !password || password.length < 8 || !recovery_email) {
      return res
        .status(400)
        .json({ error: "Missing fields, or password shorter than 8." });
    }
    
    // 3. Hash password
    const hash = await bcrypt.hash(password, 10);
    
    // 4. Update the INSERT query
    const { rows } = await pool.query(
      `INSERT INTO users (full_name, email, password_hash, recovery_email)
       VALUES ($1, $2, $3, $4)
       RETURNING id, full_name, email, role`,
      [full_name.trim(), email, hash, recovery_email.trim().toLowerCase()],
    );
    
    res.status(201).json({ user: rows[0], token: makeToken(rows[0]) });






  } catch (err) {
    if (err.code === "23505")
      return res
        .status(409)
        .json({ error: "That email is already registered.", field: "email" });
    if (err.code === "23514")
      return res
        .status(400)
        .json({ error: "Use your CTU email (name@ctu.edu.ph).", field: "email" });
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

// Who am I? Used when the app opens and right after login.
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


//--------------------

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
      return res
        .status(409)
        .json({ error: "That email is already used by another account.", field: "email" });
    if (err.code === "23514")
      return res.status(400).json({
        error:
          err.constraint === "users_full_name_not_blank"
            ? "Please enter your name."
            : "Use your CTU email (name@ctu.edu.ph).",
        field: err.constraint === "users_full_name_not_blank" ? "fullName" : "email",
      });
    console.error(err);
    res.status(500).json({ error: "Server error." });
  }
});

export default router;