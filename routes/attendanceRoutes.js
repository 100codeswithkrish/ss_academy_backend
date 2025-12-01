const express = require("express");
const router = express.Router();
const db = require("../db/db");

// Mark attendance for a batch safely and generate report
router.post("/mark-batch", async (req, res) => {
  const client = await db.connect();

  try {
    const { batch_id, date, marked_by, students } = req.body;

    // Start transaction
    await client.query("BEGIN");

    const attendanceRecords = [];
    const presentStudents = [];
    const absentStudents = [];

    for (const student of students) {
      // Check if attendance already marked for this student on this date
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
        // Skip if already marked
        attendanceRecords.push({
          student_id: student.student_id,
          status: student.status,
          message: "Already marked for this date",
        });
        continue;
      }

      // Insert attendance
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

      // Fetch student name for report
      const studentRes = await client.query(
        "SELECT name FROM students WHERE id=$1",
        [student.student_id]
      );
      const studentName =
        studentRes.rows[0]?.name || `ID:${student.student_id}`;

      // Separate present and absent
      if (student.status.toUpperCase() === "P") {
        presentStudents.push(studentName);
      } else if (student.status.toUpperCase() === "A") {
        absentStudents.push(studentName);
      }
    }

    // Commit transaction
    await client.query("COMMIT");

    // Generate text report
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

module.exports = router;
