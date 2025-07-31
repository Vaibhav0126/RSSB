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
// Get all threads
router.get("/", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { page = 1, limit = 10, search } = req.query;
        const skip = (Number(page) - 1) * Number(limit);
        const take = Number(limit);
        // Build search filter
        const searchFilter = search
            ? {
                OR: [
                    {
                        title: {
                            contains: search,
                            mode: "insensitive",
                        },
                    },
                    {
                        content: {
                            contains: search,
                            mode: "insensitive",
                        },
                    },
                ],
            }
            : {};
        const [threads, total] = yield Promise.all([
            prisma.thread.findMany({
                where: searchFilter,
                skip,
                take,
                include: {
                    author: {
                        select: { id: true, name: true, role: true },
                    },
                    _count: {
                        select: { comments: true },
                    },
                },
                orderBy: { updatedAt: "desc" },
            }),
            prisma.thread.count({ where: searchFilter }),
        ]);
        res.json({
            threads,
            pagination: {
                page: Number(page),
                limit: take,
                total,
                totalPages: Math.ceil(total / take),
                hasNext: Number(page) < Math.ceil(total / take),
                hasPrev: Number(page) > 1,
            },
        });
    }
    catch (error) {
        console.error("Error fetching threads:", error);
        res.status(500).json({ error: "Failed to fetch threads" });
    }
}));
// Get single thread with comments
router.get("/:id", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const thread = yield prisma.thread.findUnique({
            where: { id },
            include: {
                author: {
                    select: { id: true, name: true, role: true },
                },
                comments: {
                    include: {
                        author: {
                            select: { id: true, name: true, role: true },
                        },
                    },
                    orderBy: { createdAt: "asc" },
                },
            },
        });
        if (!thread) {
            return res.status(404).json({ error: "Thread not found" });
        }
        res.json(thread);
    }
    catch (error) {
        console.error("Error fetching thread:", error);
        res.status(500).json({ error: "Failed to fetch thread" });
    }
}));
// Create new thread (authenticated users only)
router.post("/", verifyAuth, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { title, content } = req.body;
        if (!title || !content) {
            return res.status(400).json({
                error: "Title and content are required",
            });
        }
        const thread = yield prisma.thread.create({
            data: {
                title,
                content,
                authorId: req.user.id,
            },
            include: {
                author: {
                    select: { id: true, name: true, role: true },
                },
                _count: {
                    select: { comments: true },
                },
            },
        });
        res.status(201).json(thread);
    }
    catch (error) {
        console.error("Error creating thread:", error);
        res.status(500).json({ error: "Failed to create thread" });
    }
}));
// Update thread (author only or admin)
router.put("/:id", verifyAuth, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const { title, content } = req.body;
        const existingThread = yield prisma.thread.findUnique({
            where: { id },
        });
        if (!existingThread) {
            return res.status(404).json({ error: "Thread not found" });
        }
        // Check if user can edit (author or admin)
        if (existingThread.authorId !== req.user.id &&
            req.user.role !== "ADMIN") {
            return res.status(403).json({
                error: "You can only edit your own threads",
            });
        }
        const updateData = {};
        if (title)
            updateData.title = title;
        if (content)
            updateData.content = content;
        const updatedThread = yield prisma.thread.update({
            where: { id },
            data: updateData,
            include: {
                author: {
                    select: { id: true, name: true, role: true },
                },
                _count: {
                    select: { comments: true },
                },
            },
        });
        res.json(updatedThread);
    }
    catch (error) {
        console.error("Error updating thread:", error);
        res.status(500).json({ error: "Failed to update thread" });
    }
}));
// Delete thread (author only or admin)
router.delete("/:id", verifyAuth, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const existingThread = yield prisma.thread.findUnique({
            where: { id },
        });
        if (!existingThread) {
            return res.status(404).json({ error: "Thread not found" });
        }
        // Check if user can delete (author or admin)
        if (existingThread.authorId !== req.user.id &&
            req.user.role !== "ADMIN") {
            return res.status(403).json({
                error: "You can only delete your own threads",
            });
        }
        yield prisma.thread.delete({
            where: { id },
        });
        res.json({ message: "Thread deleted successfully" });
    }
    catch (error) {
        console.error("Error deleting thread:", error);
        res.status(500).json({ error: "Failed to delete thread" });
    }
}));
// Add comment to thread (authenticated users only)
router.post("/:id/comments", verifyAuth, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const { content } = req.body;
        if (!content) {
            return res.status(400).json({
                error: "Content is required",
            });
        }
        // Check if thread exists
        const thread = yield prisma.thread.findUnique({
            where: { id },
        });
        if (!thread) {
            return res.status(404).json({ error: "Thread not found" });
        }
        if (thread.isLocked) {
            return res.status(403).json({ error: "Thread is locked" });
        }
        const comment = yield prisma.comment.create({
            data: {
                content,
                authorId: req.user.id,
                threadId: id,
            },
            include: {
                author: {
                    select: { id: true, name: true, role: true },
                },
            },
        });
        // Update thread's updatedAt to bring it to top
        yield prisma.thread.update({
            where: { id },
            data: { updatedAt: new Date() },
        });
        res.status(201).json(comment);
    }
    catch (error) {
        console.error("Error creating comment:", error);
        res.status(500).json({ error: "Failed to create comment" });
    }
}));
// Update comment (author only or admin)
router.put("/comments/:commentId", verifyAuth, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { commentId } = req.params;
        const { content } = req.body;
        const existingComment = yield prisma.comment.findUnique({
            where: { id: commentId },
        });
        if (!existingComment) {
            return res.status(404).json({ error: "Comment not found" });
        }
        // Check if user can edit (author or admin)
        if (existingComment.authorId !== req.user.id &&
            req.user.role !== "ADMIN") {
            return res.status(403).json({
                error: "You can only edit your own comments",
            });
        }
        const updatedComment = yield prisma.comment.update({
            where: { id: commentId },
            data: { content },
            include: {
                author: {
                    select: { id: true, name: true, role: true },
                },
            },
        });
        res.json(updatedComment);
    }
    catch (error) {
        console.error("Error updating comment:", error);
        res.status(500).json({ error: "Failed to update comment" });
    }
}));
// Delete comment (author only or admin)
router.delete("/comments/:commentId", verifyAuth, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { commentId } = req.params;
        const existingComment = yield prisma.comment.findUnique({
            where: { id: commentId },
        });
        if (!existingComment) {
            return res.status(404).json({ error: "Comment not found" });
        }
        // Check if user can delete (author or admin)
        if (existingComment.authorId !== req.user.id &&
            req.user.role !== "ADMIN") {
            return res.status(403).json({
                error: "You can only delete your own comments",
            });
        }
        yield prisma.comment.delete({
            where: { id: commentId },
        });
        res.json({ message: "Comment deleted successfully" });
    }
    catch (error) {
        console.error("Error deleting comment:", error);
        res.status(500).json({ error: "Failed to delete comment" });
    }
}));
// Toggle thread lock status (admin only)
router.patch("/:id/lock", verifyAuth, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        if (req.user.role !== "ADMIN") {
            return res.status(403).json({
                error: "Only admins can lock/unlock threads",
            });
        }
        const thread = yield prisma.thread.findUnique({
            where: { id },
        });
        if (!thread) {
            return res.status(404).json({ error: "Thread not found" });
        }
        const updatedThread = yield prisma.thread.update({
            where: { id },
            data: { isLocked: !thread.isLocked },
            include: {
                author: {
                    select: { id: true, name: true, role: true },
                },
                _count: {
                    select: { comments: true },
                },
            },
        });
        res.json(updatedThread);
    }
    catch (error) {
        console.error("Error toggling thread lock:", error);
        res.status(500).json({ error: "Failed to toggle thread lock" });
    }
}));
exports.default = router;
