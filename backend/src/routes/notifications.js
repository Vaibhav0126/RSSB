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
// Auth middleware
const verifyAuth = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const authHeader = req.headers.authorization;
        if (!(authHeader === null || authHeader === void 0 ? void 0 : authHeader.startsWith("Bearer "))) {
            return res.status(401).json({ error: "Authentication required" });
        }
        const token = authHeader.substring(7);
        const decoded = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET);
        const user = yield prisma.user.findUnique({
            where: { id: decoded.userId },
            select: { id: true, email: true, name: true, role: true, isActive: true },
        });
        if (!user || !user.isActive) {
            return res.status(401).json({ error: "Invalid user" });
        }
        req.user = user;
        next();
    }
    catch (error) {
        return res.status(401).json({ error: "Invalid token" });
    }
});
const router = express_1.default.Router();
const prisma = new client_1.PrismaClient();
// Get all notifications (with authentication)
router.get("/", verifyAuth, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { isRead, type, page = 1, limit = 20 } = req.query;
        const skip = (Number(page) - 1) * Number(limit);
        const take = Number(limit);
        // Build where clause - only get notifications for this user or global ones
        const userId = req.user.id;
        const where = {
            OR: [
                { userId: userId }, // User-specific notifications
                { userId: null }, // Global notifications
            ],
        };
        if (isRead !== undefined) {
            where.isRead = isRead === "true";
        }
        if (type && type !== "all") {
            where.type = type;
        }
        // Get notifications with pagination
        const [notifications, total] = yield Promise.all([
            prisma.notification.findMany({
                where,
                skip,
                take,
                orderBy: { createdAt: "desc" },
            }),
            prisma.notification.count({ where }),
        ]);
        const totalPages = Math.ceil(total / take);
        res.json({
            notifications,
            pagination: {
                page: Number(page),
                limit: take,
                total,
                totalPages,
                hasNext: Number(page) < totalPages,
                hasPrev: Number(page) > 1,
            },
        });
    }
    catch (error) {
        console.error("Error fetching notifications:", error);
        res.status(500).json({ error: "Failed to fetch notifications" });
    }
}));
// Get notification stats (user-specific) - MUST be before /:id route
router.get("/stats", verifyAuth, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const userId = req.user.id;
        const userNotificationWhere = {
            OR: [
                { userId: userId }, // User-specific notifications
                { userId: null }, // Global notifications
            ],
        };
        const [total, unread, byType] = yield Promise.all([
            prisma.notification.count({ where: userNotificationWhere }),
            prisma.notification.count({
                where: Object.assign(Object.assign({}, userNotificationWhere), { isRead: false }),
            }),
            prisma.notification.groupBy({
                by: ["type"],
                where: userNotificationWhere,
                _count: { type: true },
            }),
        ]);
        res.json({
            total,
            unread,
            read: total - unread,
            byType: byType.reduce((acc, item) => {
                acc[item.type] = item._count.type;
                return acc;
            }, {}),
        });
    }
    catch (error) {
        console.error("Error fetching notification stats:", error);
        res.status(500).json({ error: "Failed to fetch notification stats" });
    }
}));
// Get notification by ID
router.get("/:id", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const notification = yield prisma.notification.findUnique({
            where: { id },
        });
        if (!notification) {
            return res.status(404).json({ error: "Notification not found" });
        }
        res.json(notification);
    }
    catch (error) {
        console.error("Error fetching notification by ID:", error);
        res.status(500).json({ error: "Failed to fetch notification" });
    }
}));
// Create new notification
router.post("/", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { title, message, type } = req.body;
        if (!title || !message) {
            return res.status(400).json({ error: "Title and message are required" });
        }
        const notification = yield prisma.notification.create({
            data: {
                title,
                message,
                type: type || "info",
            },
        });
        res.status(201).json(notification);
    }
    catch (error) {
        console.error("Error creating notification:", error);
        res.status(500).json({ error: "Failed to create notification" });
    }
}));
// Mark notification as read
router.put("/:id/read", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const notification = yield prisma.notification.update({
            where: { id },
            data: { isRead: true },
        });
        res.json(notification);
    }
    catch (error) {
        console.error("Error marking notification as read:", error);
        res.status(500).json({ error: "Failed to update notification" });
    }
}));
// Mark all notifications as read
router.put("/read-all", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        yield prisma.notification.updateMany({
            where: { isRead: false },
            data: { isRead: true },
        });
        res.json({ message: "All notifications marked as read" });
    }
    catch (error) {
        console.error("Error marking all notifications as read:", error);
        res.status(500).json({ error: "Failed to update notifications" });
    }
}));
// Delete notification
router.delete("/:id", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        yield prisma.notification.delete({
            where: { id },
        });
        res.json({ message: "Notification deleted successfully" });
    }
    catch (error) {
        console.error("Error deleting notification:", error);
        res.status(500).json({ error: "Failed to delete notification" });
    }
}));
exports.default = router;
