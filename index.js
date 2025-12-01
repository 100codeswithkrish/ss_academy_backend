require("dotenv").config();
const express = require("express");
const bodyParser = require("body-parser");
const pool = require("./db/db");

const app = express();
app.use(bodyParser.json());
const cors = require("cors");
app.use(cors());

// 👉 Import routes
const studentRoutes = require("./routes/studentRoutes");
const attendanceRoutes = require("./routes/attendanceRoutes");
const batchRoutes = require("./routes/batchRoutes");
const authRoutes = require("./routes/authRoutes");
const feeRoutes = require("./routes/feeRoutes");

// 👉 Use routes
app.use("/students", studentRoutes);
app.use("/attendance", attendanceRoutes);
app.use("/batches", batchRoutes); // /batches routes are now connected
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

app.listen(3000, () => {
  console.log("Server running on http://localhost:3000");
});
