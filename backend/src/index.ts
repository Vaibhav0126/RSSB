import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import dotenv from "dotenv";
import path from "path";
import fs from "fs";
import { PrismaClient } from "@prisma/client";

// Import routes
import contentRoutes from "./routes/content";
import notificationRoutes from "./routes/notifications";
import userRoutes from "./routes/users";
import meetingRoutes from "./routes/meetings";
import threadRoutes from "./routes/threads";

// Load environment variables
dotenv.config();

const app = express();
const prisma = new PrismaClient();
const PORT = parseInt(
  process.env.PORT || process.env.RAILWAY_PORT || "5000",
  10
);

// Middleware
app.use(helmet());
app.use(
  cors({
    origin: (origin, callback) => {
      const allowedOrigins = [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        process.env.FRONTEND_URL || "http://localhost:3000",
      ];

      // Allow same-origin requests (no origin header) and be permissive in production
      if (!origin || process.env.NODE_ENV === "production") {
        return callback(null, true);
      }

      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      return callback(new Error("Not allowed by CORS"));
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);
app.use(morgan("combined"));
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

// Routes
// Health check with database connectivity
app.get("/api/health", async (req, res) => {
  try {
    // Test database connection
    await prisma.$queryRaw`SELECT 1`;

    res.json({
      status: "OK",
      message: "Spiritual Content API is running",
      database: "Connected",
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Health check failed:", error);
    res.status(503).json({
      status: "ERROR",
      message: "Database connection failed",
      error:
        process.env.NODE_ENV === "development"
          ? String(error)
          : "Service unavailable",
      timestamp: new Date().toISOString(),
    });
  }
});

// API Routes
app.use("/api/content", contentRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/users", userRoutes);
app.use("/api/meetings", meetingRoutes);
app.use("/api/threads", threadRoutes);

// Serve React frontend in production
if (process.env.NODE_ENV === "production") {
  // Find frontend build files - try multiple possible locations
  let frontendBuildPath: string | undefined;
  const possiblePaths = [
    // Prefer co-located build bundled during deploy
    path.join(__dirname, "public"),
    process.env.FRONTEND_BUILD_PATH || "",
    "/app/frontend/build",
    path.join(process.cwd(), "../frontend/build"),
    path.join(__dirname, "../../frontend/build"),
    path.join(__dirname, "../../../frontend/build"),
    path.join(__dirname, "../../../../frontend/build"),
    path.join(__dirname, "../frontend/build"),
    path.join(process.cwd(), "frontend/build"),
  ];

  console.log("🔍 Current __dirname:", __dirname);
  console.log("🔍 Current process.cwd():", process.cwd());

  for (const rawPath of possiblePaths) {
    const testPath = rawPath?.trim();
    if (!testPath) continue;
    console.log(
      `🔍 Testing path: ${testPath} - exists: ${fs.existsSync(testPath)}`
    );
    if (fs.existsSync(testPath)) {
      frontendBuildPath = testPath;
      console.log("✅ Found frontend build directory at:", frontendBuildPath);
      const files = fs.readdirSync(frontendBuildPath);
      console.log("📄 Build files:", files.slice(0, 5));
      break;
    }
  }

  if (!frontendBuildPath) {
    console.error("❌ Frontend build directory NOT found in any location");
    // List contents of current directory for debugging
    console.log("📁 Contents of __dirname:", fs.readdirSync(__dirname));
    console.log("📁 Contents of process.cwd():", fs.readdirSync(process.cwd()));
  }

  // Serve static files from React build (only if path exists)
  if (frontendBuildPath) {
    app.use(express.static(frontendBuildPath));
  }

  // Handle React routing, return index.html for non-API routes
  app.get("*", (req, res) => {
    // Don't serve index.html for API routes
    if (req.path.startsWith("/api/")) {
      return res.status(404).json({ error: "API route not found" });
    }

    console.log("📄 Serving index.html for path:", req.path);
    const indexPath = frontendBuildPath
      ? path.join(frontendBuildPath, "index.html")
      : "";

    // Check if index.html exists before trying to serve it
    if (frontendBuildPath && fs.existsSync(indexPath)) {
      res.sendFile(indexPath);
    } else {
      console.error("❌ index.html not found at:", indexPath);
      res.status(500).json({
        error: "Frontend not available",
        path: indexPath,
        buildPathFound: !!frontendBuildPath,
      });
    }
  });
}

// Error handling middleware
app.use(
  (
    err: any,
    req: express.Request,
    res: express.Response,
    next: express.NextFunction
  ) => {
    console.error("❌ Error occurred:");
    console.error("URL:", req.method, req.url);
    console.error("Error:", err.stack);
    console.error("Message:", err.message);

    res.status(500).json({
      error: "Something went wrong!",
      message:
        process.env.NODE_ENV === "development"
          ? err.message
          : "Internal server error",
    });
  }
);

// 404 handler for development (production uses React routing)
if (process.env.NODE_ENV !== "production") {
  app.use("*", (req, res) => {
    res.status(404).json({ error: "Route not found" });
  });
}

// Graceful shutdown
process.on("SIGINT", async () => {
  console.log("\nShutting down gracefully...");
  await prisma.$disconnect();
  process.exit(0);
});

// Start server with proper error handling
async function startServer() {
  try {
    // Test database connection on startup
    console.log("🔍 Testing database connection...");
    await prisma.$connect();
    console.log("✅ Database connected successfully");

    app.listen(PORT, "0.0.0.0", () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`📊 Environment: ${process.env.NODE_ENV || "development"}`);
      console.log(`🌐 PORT from env: ${process.env.PORT}`);
      console.log(`🚂 RAILWAY_PORT from env: ${process.env.RAILWAY_PORT}`);
      console.log(`🔗 Health check: http://localhost:${PORT}/api/health`);
    });
  } catch (error) {
    console.error("❌ Failed to start server:", error);
    console.error(
      "🔍 Check your DATABASE_URL and ensure PostgreSQL is running"
    );
    process.exit(1);
  }
}

startServer();

export default app;
