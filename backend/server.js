import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { connectDB, isDbConnected } from "./config/db.js";
import recordRoutes from "./routes/recordRoutes.js";

// Determine directory name in ES module
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables (from backend/.env first, then root .env fallback)
dotenv.config({ path: path.resolve(__dirname, ".env") });
dotenv.config({ path: path.resolve(__dirname, "../.env") });

const app = express();
const PORT = process.env.PORT || process.env.MERN_PORT || 5000;

// Connect to MongoDB
connectDB();

// CORS configuration to allow existing React frontend
app.use(
  cors({
    origin: [
      "http://localhost:8080",
      "http://127.0.0.1:8080",
      "http://localhost:5173",
      "http://127.0.0.1:5173",
      "http://localhost:3000",
    ],
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  }),
);

// Body parser middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Root welcome endpoint
app.get("/", (req, res) => {
  res.status(200).json({
    service: "HostelFix MERN API Server",
    status: "online",
    mongodbConnected: isDbConnected(),
    endpoints: {
      records: "/api/records",
      health: "/api/health",
    },
  });
});

// Health check endpoint
app.get("/api/health", (req, res) => {
  res.status(200).json({
    status: "ok",
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    mongodb: isDbConnected() ? "connected" : "disconnected",
  });
});

// API Routes
app.use("/api/records", recordRoutes);

// 404 Route Handler for undefined endpoints
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `API endpoint not found: ${req.method} ${req.originalUrl}`,
  });
});

// Centralized Error Handling Middleware
app.use((err, req, res, next) => {
  console.error("[MERN Server Error]:", err);

  const statusCode = err.status || err.statusCode || 500;
  res.status(statusCode).json({
    success: false,
    message: err.message || "Internal Server Error",
    stack: process.env.NODE_ENV === "production" ? undefined : err.stack,
  });
});

// Start Express server
const server = app.listen(PORT, () => {
  console.log(`\n======================================================`);
  console.log(`🚀 HostelFix MERN Backend Server running on port ${PORT}`);
  console.log(`📍 Local API URL: http://localhost:${PORT}`);
  console.log(`📍 Records Endpoint: http://localhost:${PORT}/api/records`);
  console.log(`📍 Health Check: http://localhost:${PORT}/api/health`);
  console.log(`======================================================\n`);
});

export default app;
