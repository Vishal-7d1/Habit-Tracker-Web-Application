require("dotenv").config();

/**
 * Centralized, validated access point for all environment variables.
 * Importing from here (instead of process.env directly) ensures
 * every required variable is present before the server starts.
 */
const requiredVars = ["MONGO_URI", "JWT_SECRET", "JWT_REFRESH_SECRET"];

const missing = requiredVars.filter((key) => !process.env[key]);

if (missing.length > 0) {
  console.error(
    `Missing required environment variables: ${missing.join(", ")}`
  );
  console.error("Copy .env.example to .env and fill in the values.");
  process.exit(1);
}

const config = {
  env: process.env.NODE_ENV || "development",
  port: process.env.PORT || 5000,
  clientUrl: process.env.CLIENT_URL || "http://localhost:5173",

  mongoUri: process.env.MONGO_URI,

  jwtSecret: process.env.JWT_SECRET,
  jwtExpire: process.env.JWT_EXPIRE || "7d",
  jwtCookieExpire: parseInt(process.env.JWT_COOKIE_EXPIRE, 10) || 7,

  jwtRefreshSecret: process.env.JWT_REFRESH_SECRET,
  jwtRefreshExpire: process.env.JWT_REFRESH_EXPIRE || "30d",

  smtp: {
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT, 10) || 587,
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
    fromName: process.env.FROM_NAME || "Habit Tracker",
    fromEmail: process.env.FROM_EMAIL || "noreply@habittracker.com",
  },

  bcryptSaltRounds: parseInt(process.env.BCRYPT_SALT_ROUNDS, 10) || 10,
};

module.exports = config;
