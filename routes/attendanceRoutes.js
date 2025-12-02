const express = require("express");
const router = express.Router();
const db = require("../db/db");

// ===============================
// MARK ATTENDANCE FOR A BATCH
// ===============================
router.post("/mark-batch", async (req, res) => {
  const client = await db.connect();

  try {
    const { batch_id, date, marked_by, students } = req.body;

    await client.query("BEGIN");

    const attendanceRecords = [];
    const presentStudents = [];
    const absentStudents = [];

    for (const student of students) {
      // Check if attendance already marked
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
      const studentName = studentRes.rows[0]?.name || `ID:${student.student_id}`;

      if (student.status.toUpperCase() === "P") {
        presentStudents.push(studentName);
      } else if (student.status.toUpperCase() === "A") {
        absentStudents.push(studentName);
      }
    }

    await client.query("COMMIT");

    // Generate report
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

// ===============================
// GET STUDENT-WISE ATTENDANCE HISTORY
// ===============================
router.get("/student-history", async (req, res) => {
  try {
    const result = await db.query(`
      SELECT a.*, s.name AS student_name, b.name AS batch_name
      FROM attendance a
      JOIN students s ON a.student_id = s.id
      JOIN batches b ON a.batch_id = b.id
      ORDER BY s.name, a.date DESC
    `);

    const students = {};
    result.rows.forEach((row) => {
      if (!students[row.student_id]) {
        students[row.student_id] = {
          student_name: row.student_name,
          attendance: [],
        };
      }
      students[row.student_id].attendance.push({
        date: row.date,
        batch_name: row.batch_name,
        status: row.status,
        marked_by: row.marked_by,
      });
    });

    res.json({ success: true, students });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// ===============================
// OPTIONAL: GET BATCH-WISE ATTENDANCE HISTORY
// ===============================
router.get("/batch-history", async (req, res) => {
  try {
    const result = await db.query(`
      SELECT a.*, s.name AS student_name, b.name AS batch_name
      FROM attendance a
      JOIN students s ON a.student_id = s.id
      JOIN batches b ON a.batch_id = b.id
      ORDER BY b.name, a.date DESC
    `);

    const batches = {};
    result.rows.forEach((row) => {
      if (!batches[row.batch_id]) {
        batches[row.batch_id] = {
          batch_name: row.batch_name,
          records: [],
        };
      }
      batches[row.batch_id].records.push({
        date: row.date,
        student_name: row.student_name,
        status: row.status,
        marked_by: row.marked_by,
      });
    });

    res.json({ success: true, batches });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
