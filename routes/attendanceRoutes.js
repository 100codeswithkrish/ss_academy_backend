const express = require("express");
const router = express.Router();
const db = require("../db/db");

// ------------------------------------------
// MARK ATTENDANCE FOR BATCH
// ------------------------------------------
router.post("/mark-batch", async (req, res) => {
  const client = await db.connect();

  try {
    const { batch_id, date, marked_by, students } = req.body;

    await client.query("BEGIN");

    const attendanceRecords = [];
    const presentStudents = [];
    const absentStudents = [];

    for (const student of students) {
      const checkQuery = `
        SELECT * FROM attendance
        WHERE batch_id = $1 AND student_id = $2 AND date = $3;
      `;
      const checkResult = await client.query(checkQuery, [
        batch_id,
        student.student_id,
        date,
      ]);

      if (checkResult.rows.length > 0) {
        attendanceRecords.push({
          student_id: student.student_id,
          status: student.status,
          message: "Already marked for this date",
        });
        continue;
      }

      const insertQuery = `
        INSERT INTO attendance (batch_id, date, student_id, status, marked_by)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING *;
      `;
      const result = await client.query(insertQuery, [
        batch_id,
        date,
        student.student_id,
        student.status,
        marked_by,
      ]);
      attendanceRecords.push(result.rows[0]);

      const studentRes = await client.query(
        "SELECT name FROM students WHERE id=$1",
        [student.student_id]
      );
      const studentName =
        studentRes.rows[0]?.name || `ID:${student.student_id}`;

      if (student.status.toUpperCase() === "P") {
        presentStudents.push(studentName);
      } else if (student.status.toUpperCase() === "A") {
        absentStudents.push(studentName);
      }
    }

    await client.query("COMMIT");

    const report = `
Attendance Report for Batch ${batch_id} on ${new Date(
      date
    ).toLocaleDateString()}:

Present Students:
${presentStudents.length ? presentStudents.join("\n") : "None"}

Absent Students:
${absentStudents.length ? absentStudents.join("\n") : "None"}
`;

    res.json({ success: true, attendance: attendanceRecords, report });
  } catch (error) {
    await client.query("ROLLBACK");
    res.status(500).json({ success: false, error: error.message });
  } finally {
    client.release();
  }
});

// ------------------------------------------
// 🔍 NEW: GET STUDENT ATTENDANCE HISTORY
// ------------------------------------------
router.get("/history/student/:student_id", async (req, res) => {
  try {
    const { student_id } = req.params;

    const result = await db.query(
      `
      SELECT a.*, s.name 
      FROM attendance a
      JOIN students s ON a.student_id = s.id
      WHERE student_id = $1
      ORDER BY date DESC
      `,
      [student_id]
    );

    res.json({ success: true, history: result.rows });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ------------------------------------------
// 🔍 NEW: GET BATCH ATTENDANCE HISTORY
// ------------------------------------------
router.get("/history/batch/:batch_id", async (req, res) => {
  try {
    const { batch_id } = req.params;

    const result = await db.query(
      `
      SELECT a.*, s.name 
      FROM attendance a
      JOIN students s ON a.student_id = s.id
      WHERE batch_id = $1
      ORDER BY date DESC
      `,
      [batch_id]
    );

    res.json({ success: true, history: result.rows });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
