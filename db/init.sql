-- Students Table
CREATE TABLE IF NOT EXISTS students (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    class VARCHAR(20),
    roll_no INT,
    parent_phone VARCHAR(15),
    address TEXT
);

-- Batches Table
CREATE TABLE IF NOT EXISTS batches (
    id SERIAL PRIMARY KEY,
    batch_code VARCHAR(100) NOT NULL,
    batch_name VARCHAR(255),
    timings VARCHAR(100)
);

-- Batch-Students Relationship Table
CREATE TABLE IF NOT EXISTS batch_students (
    id SERIAL PRIMARY KEY,
    batch_id INT REFERENCES batches(id) ON DELETE CASCADE,
    student_id INT REFERENCES students(id) ON DELETE CASCADE
);

-- Attendance Table
CREATE TABLE IF NOT EXISTS attendance (
    id SERIAL PRIMARY KEY,
    batch_id INT REFERENCES batches(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    present_students INT[]  -- array of student IDs
);

-- Fees Table
CREATE TABLE IF NOT EXISTS fees (
    id SERIAL PRIMARY KEY,
    student_id INT REFERENCES students(id) ON DELETE CASCADE,
    paid_amount INT,
    remaining_amount INT,
    paid_on DATE
);
