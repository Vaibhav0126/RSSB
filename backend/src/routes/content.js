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
const emailService_1 = require("../services/emailService");
const router = express_1.default.Router();
const prisma = new client_1.PrismaClient();
// JWT Secret (in production, use environment variable)
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
// Get books with search and pagination
router.get("/books", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { search, category, page = 1, limit = 20, sortBy = "createdAt", sortOrder = "desc", latest = false, } = req.query;
        const skip = (Number(page) - 1) * Number(limit);
        const take = latest === "true" ? 4 : Number(limit); // For home page, show only 4
        // Build where clause for enhanced search
        const where = {};
        if (search) {
            // Split search into multiple keywords
            const searchTerms = search
                .trim()
                .split(/\s+/)
                .filter((term) => term.length > 0);
            if (searchTerms.length > 0) {
                where.OR = searchTerms.flatMap((term) => [
                    { title: { contains: term, mode: "insensitive" } },
                    { briefIntro: { contains: term, mode: "insensitive" } },
                    { content: { contains: term, mode: "insensitive" } },
                    { keywords: { has: term } },
                ]);
            }
        }
        if (category && category !== "all") {
            where.category = category;
        }
        // Get books with pagination
        const [books, total] = yield Promise.all([
            prisma.book.findMany({
                where,
                skip: latest === "true" ? 0 : skip, // Don't skip for home page
                take,
                orderBy: {
                    [sortBy]: sortOrder,
                },
            }),
            prisma.book.count({ where }),
        ]);
        const totalPages = Math.ceil(total / Number(limit));
        res.json({
            books,
            pagination: {
                page: Number(page),
                limit: Number(limit),
                total,
                totalPages,
                hasNext: Number(page) < totalPages,
                hasPrev: Number(page) > 1,
            },
        });
    }
    catch (error) {
        console.error("Error fetching books:", error);
        res.status(500).json({ error: "Failed to fetch books" });
    }
}));
// Get book by ID
router.get("/books/:id", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const book = yield prisma.book.findUnique({
            where: { id },
        });
        if (!book) {
            return res.status(404).json({ error: "Book not found" });
        }
        res.json(book);
    }
    catch (error) {
        console.error("Error fetching book by ID:", error);
        res.status(500).json({ error: "Failed to fetch book" });
    }
}));
// Middleware to verify admin token
const verifyAdmin = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const token = (_a = req.headers.authorization) === null || _a === void 0 ? void 0 : _a.split(" ")[1];
        if (!token) {
            return res.status(401).json({ error: "No token provided" });
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
// Generate OTP for admin login
router.post("/admin/generate-otp", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { email } = req.body;
        if (!email) {
            return res.status(400).json({ error: "Email is required" });
        }
        // Check if user exists with this email and has appropriate role
        const user = yield prisma.user.findUnique({
            where: { email },
        });
        if (!user) {
            return res.status(401).json({ error: "User not found with this email" });
        }
        // Only allow ADMIN, MENTOR, SK, ASK to login via OTP
        if (user.role === "USER") {
            return res.status(401).json({
                error: "Regular users cannot access this login. Please use the library as a guest.",
            });
        }
        // Generate 6-digit OTP
        const otp = crypto_1.default.randomInt(100000, 999999).toString();
        // Set expiration time (10 minutes from now)
        const expiresAt = new Date(Date.now() + 10 * 60 * 1000);
        // Store OTP in database
        yield prisma.oTP.create({
            data: {
                email,
                code: otp,
                expiresAt,
            },
        });
        // Send OTP via email
        const emailSent = yield (0, emailService_1.sendOTPEmail)(email, otp);
        if (!emailSent) {
            return res.status(500).json({ error: "Failed to send OTP email" });
        }
        res.json({
            message: "OTP sent successfully to your email",
            email: email.replace(/(.{2})(.*)(@.*)/, "$1***$3"), // Mask email for security
        });
    }
    catch (error) {
        console.error("Error generating OTP:", error);
        res.status(500).json({ error: "Failed to generate OTP" });
    }
}));
// Verify OTP and login
router.post("/admin/verify-otp", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { email, otp } = req.body;
        if (!email || !otp) {
            return res.status(400).json({ error: "Email and OTP are required" });
        }
        // Find valid OTP
        const otpRecord = yield prisma.oTP.findFirst({
            where: {
                email,
                code: otp,
                used: false,
                expiresAt: {
                    gt: new Date(),
                },
            },
            orderBy: { createdAt: "desc" },
        });
        if (!otpRecord) {
            return res.status(401).json({ error: "Invalid or expired OTP" });
        }
        // Mark OTP as used
        yield prisma.oTP.update({
            where: { id: otpRecord.id },
            data: { used: true },
        });
        // Get user details
        const user = yield prisma.user.findUnique({
            where: { email },
        });
        if (!user) {
            return res.status(401).json({ error: "User not found" });
        }
        // Generate JWT token
        const token = jsonwebtoken_1.default.sign({ userId: user.id }, JWT_SECRET, {
            expiresIn: "24h",
        });
        res.json({
            token,
            user: {
                id: user.id,
                email: user.email,
                name: user.name,
                role: user.role,
            },
        });
    }
    catch (error) {
        console.error("Error verifying OTP:", error);
        res.status(500).json({ error: "OTP verification failed" });
    }
}));
// Create new book (admin or mentor only)
router.post("/admin/books", verifyAdminOrMentor, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { title, briefIntro, content, keywords, category } = req.body;
        if (!title || !briefIntro || !content) {
            return res
                .status(400)
                .json({ error: "Title, brief intro, and content are required" });
        }
        const book = yield prisma.book.create({
            data: {
                title,
                briefIntro,
                content,
                keywords: keywords || [],
                category: category || "spiritual",
            },
        });
        // Create notification for new book
        yield prisma.notification.create({
            data: {
                title: "New Book Added",
                message: `📚 "${title}" has been added to the library`,
                type: "BOOK_ADDED",
            },
        });
        res.status(201).json(book);
    }
    catch (error) {
        console.error("Error creating book:", error);
        res.status(500).json({ error: "Failed to create book" });
    }
}));
// Update book (admin or mentor only)
router.put("/admin/books/:id", verifyAdminOrMentor, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const { title, briefIntro, content, keywords, category } = req.body;
        const book = yield prisma.book.update({
            where: { id },
            data: {
                title,
                briefIntro,
                content,
                keywords,
                category,
            },
        });
        res.json(book);
    }
    catch (error) {
        console.error("Error updating book:", error);
        res.status(500).json({ error: "Failed to update book" });
    }
}));
// Delete book (admin or mentor only)
router.delete("/admin/books/:id", verifyAdminOrMentor, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        // Get book details before deletion for notification
        const book = yield prisma.book.findUnique({
            where: { id },
            select: { title: true },
        });
        yield prisma.book.delete({
            where: { id },
        });
        // Create notification for deleted book
        if (book) {
            yield prisma.notification.create({
                data: {
                    title: "Book Removed",
                    message: `🗑️ "${book.title}" has been removed from the library`,
                    type: "BOOK_REMOVED",
                },
            });
        }
        res.json({ message: "Book deleted successfully" });
    }
    catch (error) {
        console.error("Error deleting book:", error);
        res.status(500).json({ error: "Failed to delete book" });
    }
}));
// Get categories
router.get("/meta/categories", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const categories = yield prisma.category.findMany({
            orderBy: { name: "asc" },
        });
        res.json(categories);
    }
    catch (error) {
        console.error("Error fetching categories:", error);
        res.status(500).json({ error: "Failed to fetch categories" });
    }
}));
// Search endpoint with text excerpts
router.get("/search", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { q: searchQuery } = req.query;
        if (!searchQuery) {
            return res.status(400).json({ error: "Search query is required" });
        }
        // Split search into multiple keywords
        const searchTerms = searchQuery
            .trim()
            .split(/\s+/)
            .filter((term) => term.length > 0);
        if (searchTerms.length === 0) {
            return res.json({ results: [], searchTerms: [], totalResults: 0 });
        }
        // Build search conditions
        const searchConditions = searchTerms.flatMap((term) => [
            { title: { contains: term, mode: "insensitive" } },
            { briefIntro: { contains: term, mode: "insensitive" } },
            { content: { contains: term, mode: "insensitive" } },
            { keywords: { has: term } },
        ]);
        // Find books with search terms
        const books = yield prisma.book.findMany({
            where: {
                OR: searchConditions,
            },
            orderBy: { createdAt: "desc" },
        });
        // Process results and extract excerpts
        const results = books.map((book) => {
            const excerpts = [];
            // Check title
            const titleMatches = searchTerms.some((term) => book.title.toLowerCase().includes(term.toLowerCase()));
            if (titleMatches) {
                excerpts.push({
                    text: book.title,
                    type: "title",
                });
            }
            // Check brief intro
            const briefIntroMatches = searchTerms.some((term) => book.briefIntro.toLowerCase().includes(term.toLowerCase()));
            if (briefIntroMatches) {
                excerpts.push({
                    text: book.briefIntro,
                    type: "briefIntro",
                });
            }
            // Check content
            const contentMatches = searchTerms.some((term) => book.content.toLowerCase().includes(term.toLowerCase()));
            if (contentMatches) {
                excerpts.push({
                    text: book.content,
                    type: "content",
                });
            }
            return {
                bookId: book.id,
                bookTitle: book.title,
                bookCategory: book.category,
                excerpts,
            };
        });
        // Filter out books with no excerpts
        const filteredResults = results.filter((result) => result.excerpts.length > 0);
        res.json({
            results: filteredResults,
            searchTerms,
            totalResults: filteredResults.reduce((total, result) => total + result.excerpts.length, 0),
        });
    }
    catch (error) {
        console.error("Error performing search:", error);
        res.status(500).json({ error: "Failed to perform search" });
    }
}));
exports.default = router;
