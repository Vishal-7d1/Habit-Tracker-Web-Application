const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const morgan = require("morgan");

const config = require("./config/env");
const connectDB = require("./config/db");

// Connect to MongoDB
connectDB();

const app = express();

// ---------- Core Middlewares ----------
app.use(
  cors({
    origin: config.clientUrl,
    credentials: true,
  })
);
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));
app.use(cookieParser());

if (config.env === "development") {
  app.use(morgan("dev"));
}

// ---------- Health Check ----------
app.get("/api/health", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Habit Tracker API is running",
    environment: config.env,
    timestamp: new Date().toISOString(),
  });
});

// ---------- API Routes ----------
// Route modules will be mounted here as they are generated:
// app.use("/api/auth", require("./routes/authRoutes"));
// app.use("/api/habits", require("./routes/habitRoutes"));
// app.use("/api/journal", require("./routes/journalRoutes"));
// app.use("/api/rewards", require("./routes/rewardRoutes"));
// app.use("/api/analytics", require("./routes/analyticsRoutes"));
// app.use("/api/reminders", require("./routes/reminderRoutes"));
// app.use("/api/dashboard", require("./routes/dashboardRoutes"));
// app.use("/api/profile", require("./routes/profileRoutes"));

// ---------- 404 Handler ----------
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.originalUrl} not found`,
  });
});

// ---------- Global Error Handler ----------
app.use((err, req, res, next) => {
  console.error(err.stack);
  const statusCode = err.statusCode || 500;
  res.status(statusCode).json({
    success: false,
    message: err.message || "Internal Server Error",
    ...(config.env === "development" && { stack: err.stack }),
  });
});

const PORT = config.port;

const server = app.listen(PORT, () => {
  console.log(
    `Server running in ${config.env} mode on port ${PORT}`
  );
});

// Handle unhandled promise rejections
process.on("unhandledRejection", (err) => {
  console.error(`Unhandled Rejection: ${err.message}`);
  server.close(() => process.exit(1));
});

module.exports = app;
