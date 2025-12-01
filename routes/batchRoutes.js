const express = require("express");
const router = express.Router();
const pool = require("../db/db");

// ➤ Create a new batch
router.post("/create", async (req, res) => {
  try {
    const { batch_name } = req.body;

    const result = await pool.query(
      "INSERT INTO batches (batch_name) VALUES ($1) RETURNING *",
      [batch_name]
    );

    res.json({ success: true, batch: result.rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ➤ Add a student to batch
router.post("/add-student", async (req, res) => {
  try {
    const { batch_id, student_id } = req.body;

    const result = await pool.query(
      "INSERT INTO batch_students (batch_id, student_id) VALUES ($1, $2) RETURNING *",
      [batch_id, student_id]
    );

    res.json({ success: true, assigned: result.rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ➤ Remove a student from a batch (also delete their attendance for this batch)
router.delete("/:batch_id/students/:student_id", async (req, res) => {
  try {
    const { batch_id, student_id } = req.params;

    const result = await pool.query(
      "DELETE FROM batch_students WHERE batch_id=$1 AND student_id=$2 RETURNING *",
      [batch_id, student_id]
    );

    if (result.rows.length === 0) {
      return res
        .status(404)
        .json({ success: false, error: "Student not found in this batch" });
    }

    // Also remove attendance entries for this student in this batch
    await pool.query(
      "DELETE FROM attendance WHERE batch_id=$1 AND student_id=$2",
      [batch_id, student_id]
    );

    res.json({ success: true, removed: result.rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ➤ Delete a batch (also remove all students assigned and attendance)
router.delete("/:batch_id", async (req, res) => {
  try {
    const { batch_id } = req.params;

    // Delete attendance for this batch
    await pool.query("DELETE FROM attendance WHERE batch_id=$1", [batch_id]);

    // Delete batch assignments
    await pool.query("DELETE FROM batch_students WHERE batch_id=$1", [
      batch_id,
    ]);

    // Delete batch itself
    const result = await pool.query(
      "DELETE FROM batches WHERE id=$1 RETURNING *",
      [batch_id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: "Batch not found" });
    }

    res.json({ success: true, deleted_batch: result.rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Get all batches
router.get("/list", async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM batches ORDER BY id ASC");
    res.json({ success: true, batches: result.rows });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ➤ Get all students of a batch
router.get("/:batch_id/students", async (req, res) => {
  try {
    const { batch_id } = req.params;

    const result = await pool.query(
      `SELECT s.id, s.name 
       FROM students s
       INNER JOIN batch_students bs ON s.id = bs.student_id
       WHERE bs.batch_id = $1`,
      [batch_id]
    );

    res.json({ success: true, students: result.rows });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
