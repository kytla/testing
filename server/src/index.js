import "dotenv/config";
import express from "express";
import cors from "cors";
import { pool } from "./db.js";
import authRoutes from "./routes/auth.js";

const app = express();
app.use(cors());
app.use(express.json());

app.get("/health", async (req, res) => {
  try {
    const { rows } = await pool.query("SELECT NOW() AS now");
    res.json({ ok: true, dbTime: rows[0].now });
  } catch (err) {
    console.error(err);
    res.status(500).json({ ok: false, error: "Database connection failed." });
  }
});

app.use("/auth", authRoutes);

const port = process.env.PORT || 3000;
app.listen(port, "0.0.0.0", () => console.log(`API running on port ${port}`));