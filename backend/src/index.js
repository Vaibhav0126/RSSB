"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const morgan_1 = __importDefault(require("morgan"));
const dotenv_1 = __importDefault(require("dotenv"));
const client_1 = require("@prisma/client");
// Import routes
const content_1 = __importDefault(require("./routes/content"));
const notifications_1 = __importDefault(require("./routes/notifications"));
const users_1 = __importDefault(require("./routes/users"));
const meetings_1 = __importDefault(require("./routes/meetings"));
const threads_1 = __importDefault(require("./routes/threads"));
// Load environment variables
dotenv_1.default.config();
const app = (0, express_1.default)();
const prisma = new client_1.PrismaClient();
const PORT = process.env.PORT || 5000;
// Middleware
app.use((0, helmet_1.default)());
app.use((0, cors_1.default)({
    origin: [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        process.env.FRONTEND_URL || "http://localhost:3000",
    ],
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
}));
app.use((0, morgan_1.default)("combined"));
app.use(express_1.default.json({ limit: "10mb" }));
app.use(express_1.default.urlencoded({ extended: true }));
// Routes
app.use("/api/content", content_1.default);
app.use("/api/notifications", notifications_1.default);
app.use("/api/users", users_1.default);
app.use("/api/meetings", meetings_1.default);
app.use("/api/threads", threads_1.default);
// Health check with database connectivity
app.get("/api/health", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // Test database connection
        yield prisma.$queryRaw `SELECT 1`;
        res.json({
            status: "OK",
            message: "Spiritual Content API is running",
            database: "Connected",
            timestamp: new Date().toISOString(),
        });
    }
    catch (error) {
        console.error("Health check failed:", error);
        res.status(503).json({
            status: "ERROR",
            message: "Database connection failed",
            error: process.env.NODE_ENV === "development" ? String(error) : "Service unavailable",
            timestamp: new Date().toISOString(),
        });
    }
}));
// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({
        error: "Something went wrong!",
        message: process.env.NODE_ENV === "development"
            ? err.message
            : "Internal server error",
    });
});
// 404 handler
app.use("*", (req, res) => {
    res.status(404).json({ error: "Route not found" });
});
// Graceful shutdown
process.on("SIGINT", () => __awaiter(void 0, void 0, void 0, function* () {
    console.log("\nShutting down gracefully...");
    yield prisma.$disconnect();
    process.exit(0);
}));
// Start server with proper error handling
function startServer() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            // Test database connection on startup
            console.log("🔍 Testing database connection...");
            yield prisma.$connect();
            console.log("✅ Database connected successfully");
            app.listen(PORT, () => {
                console.log(`🚀 Server running on port ${PORT}`);
                console.log(`📊 Environment: ${process.env.NODE_ENV || "development"}`);
                console.log(`🔗 Health check: http://localhost:${PORT}/api/health`);
            });
        }
        catch (error) {
            console.error("❌ Failed to start server:", error);
            console.error("🔍 Check your DATABASE_URL and ensure PostgreSQL is running");
            process.exit(1);
        }
    });
}
startServer();
exports.default = app;
