const express = require("express");
const router = express.Router();
const db = require("../db/db");

// Simple login
router.post("/login", async (req, res) => {
  try {
    const { username, password } = req.body;

    const query = `
      SELECT * FROM users
      WHERE username = $1 AND password = $2
    `;
    const result = await db.query(query, [username, password]);

    if (result.rows.length === 0) {
      return res
        .status(401)
        .json({ success: false, error: "Invalid username or password" });
    }

    const user = result.rows[0];
    res.json({
      success: true,
      user: { id: user.id, username: user.username, role: user.role },
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
