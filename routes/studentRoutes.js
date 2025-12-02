const express = require("express");
const router = express.Router();
const db = require("../db/db");

// 👉 Add student with fee setup
router.post("/add", async (req, res) => {
  try {
    let { name, class_std, roll_no, parent_phone, address, total_fee } = req.body;

    // Make roll_no optional: if empty string or undefined, set to null
    roll_no = roll_no === "" || roll_no === undefined ? null : Number(roll_no);

    const query = `
      INSERT INTO students 
      (name, class_std, roll_no, parent_phone, address, total_fee, paid_fee, remaining_fee)
      VALUES ($1, $2, $3, $4, $5, $6, 0, $6)
      RETURNING *;
    `;

    const result = await db.query(query, [
      name,
      class_std,
      roll_no,
      parent_phone,
      address,
      total_fee,
    ]);

    res.json({ success: true, student: result.rows[0] });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 👉 Get all students
router.get("/list", async (req, res) => {
  try {
    const result = await db.query(`SELECT * FROM students ORDER BY id ASC`);
    res.json({ success: true, students: result.rows });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 👉 Update total_fee AND recalculate remaining_fee
router.put("/update-fee/:student_id", async (req, res) => {
  try {
    const { student_id } = req.params;
    const { total_fee } = req.body;

    const prev = await db.query(
      "SELECT paid_fee FROM students WHERE id=$1",
      [student_id]
    );

    if (prev.rows.length === 0) {
      return res
        .status(404)
        .json({ success: false, error: "Student not found" });
    }

    const paid_fee = prev.rows[0].paid_fee;
    const remaining_fee = total_fee - paid_fee;

    const result = await db.query(
      `
      UPDATE students 
      SET total_fee=$1, remaining_fee=$2
      WHERE id=$3
      RETURNING *;
      `,
      [total_fee, remaining_fee, student_id]
    );

    res.json({ success: true, student: result.rows[0] });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
