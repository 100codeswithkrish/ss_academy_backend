const { Pool } = require("pg");
const path = require("path");

// Load .env from parent folder
require("dotenv").config({ path: path.resolve(__dirname, "../.env") });

// Debug: check environment variables
console.log("NEON_USER:", process.env.NEON_USER);
console.log("NEON_PASSWORD:", process.env.NEON_PASSWORD);

// Determine if Neon should be used
const useNeon = !!process.env.NEON_USER && !!process.env.NEON_PASSWORD;

const pool = new Pool(
  useNeon
    ? {
        user: process.env.NEON_USER,
        password: process.env.NEON_PASSWORD,
        host: process.env.NEON_HOST,
        database: process.env.NEON_DB,
        port: parseInt(process.env.NEON_PORT, 10),
        ssl: { rejectUnauthorized: false },
      }
    : {
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        host: process.env.DB_HOST,
        database: process.env.DB_NAME,
        port: parseInt(process.env.DB_PORT, 10),
      }
);

// Test connection
pool.query("SELECT NOW()", (err, res) => {
  if (err) console.error("DB Error:", err);
  else console.log("DB Connected:", res.rows[0]);
});

module.exports = pool;
