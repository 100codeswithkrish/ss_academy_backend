const express = require("express");
const router = express.Router();
const db = require("../db/db");

// 👉 Add fee payment
router.post("/add", async (req, res) => {
  try {
    const { student_id, paid_amount, paid_on } = req.body;

    // Get fee details of student
    const studentRes = await db.query(
      "SELECT total_fee, paid_fee, remaining_fee FROM students WHERE id=$1",
      [student_id]
    );

    if (studentRes.rows.length === 0) {
      return res
        .status(404)
        .json({ success: false, error: "Student not found" });
    }

    const { total_fee, paid_fee, remaining_fee } = studentRes.rows[0];

    const new_paid_fee = paid_fee + parseInt(paid_amount);

    // ❌ No overpayment allowed
    if (new_paid_fee > total_fee) {
      return res.json({
        success: false,
        error: "Payment exceeds total fee",
      });
    }

    const new_remaining_fee = total_fee - new_paid_fee;

    // Insert into fees history table
    const history = await db.query(
      `
      INSERT INTO fees (student_id, paid_amount, remaining_amount, paid_on)
      VALUES ($1, $2, $3, $4)
      RETURNING *;
      `,
      [student_id, paid_amount, new_remaining_fee, paid_on]
    );

    // Update student table
    await db.query(
      `
      UPDATE students 
      SET paid_fee=$1, remaining_fee=$2
      WHERE id=$3
      `,
      [new_paid_fee, new_remaining_fee, student_id]
    );

    res.json({
      success: true,
      payment: history.rows[0],
      updated_student_fee_status: {
        total_fee,
        paid_fee: new_paid_fee,
        remaining_fee: new_remaining_fee,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 👉 Get all payments for a student
router.get("/history/:student_id", async (req, res) => {
  try {
    const { student_id } = req.params;

    const result = await db.query(
      "SELECT * FROM fees WHERE student_id=$1 ORDER BY paid_on ASC, id ASC",
      [student_id]
    );

    res.json({ success: true, history: result.rows });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
