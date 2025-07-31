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
const client_1 = require("@prisma/client");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const crypto_1 = __importDefault(require("crypto"));
const router = express_1.default.Router();
const prisma = new client_1.PrismaClient();
// JWT Secret
const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";
// Middleware to verify user authentication
const verifyAuth = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const token = (_a = req.header("Authorization")) === null || _a === void 0 ? void 0 : _a.replace("Bearer ", "");
        if (!token) {
            return res
                .status(401)
                .json({ error: "Access denied. No token provided." });
        }
        const decoded = jsonwebtoken_1.default.verify(token, JWT_SECRET);
        const user = yield prisma.user.findUnique({
            where: { id: decoded.userId },
            select: { id: true, email: true, name: true, role: true, isActive: true },
        });
        if (!user || !user.isActive) {
            return res.status(401).json({ error: "User not found or inactive" });
        }
        req.user = user;
        next();
    }
    catch (error) {
        res.status(401).json({ error: "Invalid token" });
    }
});
// Middleware to verify admin role only
const verifyAdmin = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    verifyAuth(req, res, () => {
        if (req.user.role !== "ADMIN") {
            return res
                .status(403)
                .json({ error: "Access denied. Admin role required." });
        }
        next();
    });
});
// Middleware to verify admin or mentor role
const verifyAdminOrMentor = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    verifyAuth(req, res, () => {
        if (req.user.role !== "ADMIN" &&
            req.user.role !== "MENTOR") {
            return res
                .status(403)
                .json({ error: "Access denied. Admin or Mentor role required." });
        }
        next();
    });
});
// Get all users (admin only)
router.get("/", verifyAdmin, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const users = yield prisma.user.findMany({
            select: {
                id: true,
                email: true,
                name: true,
                role: true,
                isActive: true,
                createdAt: true,
                creator: {
                    select: { name: true, email: true },
                },
            },
            orderBy: { createdAt: "desc" },
        });
        res.json(users);
    }
    catch (error) {
        console.error("Error fetching users:", error);
        res.status(500).json({ error: "Failed to fetch users" });
    }
}));
// Register new user (admin/mentor only)
router.post("/register", verifyAdminOrMentor, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { email, name, role } = req.body;
        if (!email || !name || !role) {
            return res
                .status(400)
                .json({ error: "Email, name, and role are required" });
        }
        // Validate role assignment permissions
        if (req.user.role === "MENTOR") {
            // Mentors can only create SK, ASK users
            if (!["SK", "ASK"].includes(role)) {
                return res.status(403).json({
                    error: "Mentors can only register SK or ASK users",
                });
            }
        }
        // Check if user already exists
        const existingUser = yield prisma.user.findUnique({
            where: { email },
        });
        if (existingUser) {
            return res
                .status(400)
                .json({ error: "User with this email already exists" });
        }
        // Create user
        const user = yield prisma.user.create({
            data: {
                email,
                name,
                role: role,
                createdBy: req.user.id,
            },
        });
        // Create notification
        yield prisma.notification.create({
            data: {
                title: "New User Registered",
                message: `👤 ${name} (${role}) has been registered by ${req.user.name}`,
                type: "USER_REGISTERED",
            },
        });
        // Send welcome email with OTP setup
        try {
            const otp = crypto_1.default.randomInt(100000, 999999).toString();
            const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
            yield prisma.oTP.create({
                data: {
                    email,
                    code: otp,
                    expiresAt,
                },
            });
            // Send welcome email (you can customize this)
            console.log(`Welcome OTP for ${email}: ${otp}`);
        }
        catch (emailError) {
            console.error("Error sending welcome email:", emailError);
        }
        res.status(201).json({
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
            createdAt: user.createdAt,
        });
    }
    catch (error) {
        console.error("Error registering user:", error);
        res.status(500).json({ error: "Failed to register user" });
    }
}));
// Update user (admin only, or admin can promote to mentor)
router.put("/:id", verifyAdmin, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const { name, role, isActive } = req.body;
        const user = yield prisma.user.update({
            where: { id },
            data: Object.assign(Object.assign(Object.assign({}, (name && { name })), (role && { role: role })), (isActive !== undefined && { isActive })),
        });
        res.json({
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
            isActive: user.isActive,
        });
    }
    catch (error) {
        console.error("Error updating user:", error);
        res.status(500).json({ error: "Failed to update user" });
    }
}));
// Deactivate user (admin only)
router.delete("/:id", verifyAdmin, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const user = yield prisma.user.update({
            where: { id },
            data: { isActive: false },
        });
        res.json({ message: "User deactivated successfully", user });
    }
    catch (error) {
        console.error("Error deactivating user:", error);
        res.status(500).json({ error: "Failed to deactivate user" });
    }
}));
// Get current user profile
router.get("/profile", verifyAuth, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const user = yield prisma.user.findUnique({
            where: { id: req.user.id },
            select: {
                id: true,
                email: true,
                name: true,
                role: true,
                isActive: true,
                createdAt: true,
                scheduledMeetings: {
                    select: {
                        id: true,
                        title: true,
                        startTime: true,
                        status: true,
                    },
                    orderBy: { startTime: "asc" },
                },
            },
        });
        res.json(user);
    }
    catch (error) {
        console.error("Error fetching user profile:", error);
        res.status(500).json({ error: "Failed to fetch user profile" });
    }
}));
exports.default = router;
