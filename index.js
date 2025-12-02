require("dotenv").config();
const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const pool = require("./db/db");

const app = express();

app.use(bodyParser.json());

// CORS: allow all origins (or replace with your frontend domain)
app.use(cors());

// Routes
const studentRoutes = require("./routes/studentRoutes");
const attendanceRoutes = require("./routes/attendanceRoutes");
const batchRoutes = require("./routes/batchRoutes");
const authRoutes = require("./routes/authRoutes");
const feeRoutes = require("./routes/feeRoutes");

app.use("/students", studentRoutes);
app.use("/attendance", attendanceRoutes);
app.use("/batches", batchRoutes);
app.use("/auth", authRoutes);
app.use("/fees", feeRoutes);

// Test route
app.get("/", async (req, res) => {
  try {
    const result = await pool.query("SELECT NOW()");
    res.send("SS Academy Backend Running. DB Time: " + result.rows[0].now);
  } catch (error) {
    res.status(500).send("DB Error: " + error.message);
  }
});

// Catch all unknown routes
app.use((req, res) => {
  res.status(404).send({ success: false, error: "Route not found" });
});

// ✅ Listen on Render-provided port
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
