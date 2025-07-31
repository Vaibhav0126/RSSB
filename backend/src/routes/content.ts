import express from "express";
import { PrismaClient, UserRole } from "@prisma/client";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import { sendOTPEmail } from "../services/emailService";

const router = express.Router();
const prisma = new PrismaClient();

// JWT Secret (in production, use environment variable)
const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";

// Middleware to verify user authentication
const verifyAuth = async (req: any, res: any, next: any) => {
  try {
    const token = req.header("Authorization")?.replace("Bearer ", "");

    if (!token) {
      return res
        .status(401)
        .json({ error: "Access denied. No token provided." });
    }

    const decoded = jwt.verify(token, JWT_SECRET) as any;
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: { id: true, email: true, name: true, role: true, isActive: true },
    });

    if (!user || !user.isActive) {
      return res.status(401).json({ error: "User not found or inactive" });
    }

    req.user = user;
    next();
  } catch (error) {
    res.status(401).json({ error: "Invalid token" });
  }
};

// Middleware to verify admin or mentor role
const verifyAdminOrMentor = async (req: any, res: any, next: any) => {
  verifyAuth(req, res, () => {
    if (
      (req as any).user.role !== "ADMIN" &&
      (req as any).user.role !== "MENTOR"
    ) {
      return res
        .status(403)
        .json({ error: "Access denied. Admin or Mentor role required." });
    }
    next();
  });
};

// Get books with search and pagination
router.get("/books", async (req, res) => {
  try {
    const {
      search,
      category,
      page = 1,
      limit = 20,
      sortBy = "createdAt",
      sortOrder = "desc",
      latest = false,
    } = req.query;

    const skip = (Number(page) - 1) * Number(limit);
    const take = latest === "true" ? 4 : Number(limit); // For home page, show only 4

    // Build where clause for enhanced search
    const where: any = {};

    if (search) {
      // Split search into multiple keywords
      const searchTerms = (search as string)
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
      where.category = category as string;
    }

    // Get books with pagination
    const [books, total] = await Promise.all([
      prisma.book.findMany({
        where,
        skip: latest === "true" ? 0 : skip, // Don't skip for home page
        take,
        orderBy: {
          [sortBy as string]: sortOrder as "asc" | "desc",
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
  } catch (error) {
    console.error("Error fetching books:", error);
    res.status(500).json({ error: "Failed to fetch books" });
  }
});

// Get book by ID
router.get("/books/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const book = await prisma.book.findUnique({
      where: { id },
    });

    if (!book) {
      return res.status(404).json({ error: "Book not found" });
    }

    res.json(book);
  } catch (error) {
    console.error("Error fetching book by ID:", error);
    res.status(500).json({ error: "Failed to fetch book" });
  }
});

// Middleware to verify admin token
const verifyAdmin = async (req: any, res: any, next: any) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) {
      return res.status(401).json({ error: "No token provided" });
    }

    const decoded = jwt.verify(token, JWT_SECRET) as any;
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: { id: true, email: true, name: true, role: true, isActive: true },
    });

    if (!user || !user.isActive) {
      return res.status(401).json({ error: "User not found or inactive" });
    }

    req.user = user;
    next();
  } catch (error) {
    res.status(401).json({ error: "Invalid token" });
  }
};

// Generate OTP for admin login
router.post("/admin/generate-otp", async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: "Email is required" });
    }

    // Check if user exists with this email and has appropriate role
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return res.status(401).json({ error: "User not found with this email" });
    }

    // Only allow ADMIN, MENTOR, SK, ASK to login via OTP
    if (user.role === "USER") {
      return res.status(401).json({
        error:
          "Regular users cannot access this login. Please use the library as a guest.",
      });
    }

    // Generate 6-digit OTP
    const otp = crypto.randomInt(100000, 999999).toString();

    // Set expiration time (10 minutes from now)
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

    // Store OTP in database
    await prisma.oTP.create({
      data: {
        email,
        code: otp,
        expiresAt,
      },
    });

    // Send OTP via email
    const emailSent = await sendOTPEmail(email, otp);

    if (!emailSent) {
      return res.status(500).json({ error: "Failed to send OTP email" });
    }

    res.json({
      message: "OTP sent successfully to your email",
      email: email.replace(/(.{2})(.*)(@.*)/, "$1***$3"), // Mask email for security
    });
  } catch (error) {
    console.error("Error generating OTP:", error);
    res.status(500).json({ error: "Failed to generate OTP" });
  }
});

// Verify OTP and login
router.post("/admin/verify-otp", async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({ error: "Email and OTP are required" });
    }

    // Find valid OTP
    const otpRecord = await prisma.oTP.findFirst({
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
    await prisma.oTP.update({
      where: { id: otpRecord.id },
      data: { used: true },
    });

    // Get user details
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return res.status(401).json({ error: "User not found" });
    }

    // Generate JWT token
    const token = jwt.sign({ userId: user.id }, JWT_SECRET, {
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
  } catch (error) {
    console.error("Error verifying OTP:", error);
    res.status(500).json({ error: "OTP verification failed" });
  }
});

// Create new book (admin or mentor only)
router.post("/admin/books", verifyAdminOrMentor, async (req, res) => {
  try {
    const { title, briefIntro, content, keywords, category } = req.body;

    if (!title || !briefIntro || !content) {
      return res
        .status(400)
        .json({ error: "Title, brief intro, and content are required" });
    }

    const book = await prisma.book.create({
      data: {
        title,
        briefIntro,
        content,
        keywords: keywords || [],
        category: category || "spiritual",
      },
    });

    // Create notification for new book
    await prisma.notification.create({
      data: {
        title: "New Book Added",
        message: `📚 "${title}" has been added to the library`,
        type: "BOOK_ADDED",
      },
    });

    res.status(201).json(book);
  } catch (error) {
    console.error("Error creating book:", error);
    res.status(500).json({ error: "Failed to create book" });
  }
});

// Update book (admin or mentor only)
router.put("/admin/books/:id", verifyAdminOrMentor, async (req, res) => {
  try {
    const { id } = req.params;
    const { title, briefIntro, content, keywords, category } = req.body;

    const book = await prisma.book.update({
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
  } catch (error) {
    console.error("Error updating book:", error);
    res.status(500).json({ error: "Failed to update book" });
  }
});

// Delete book (admin or mentor only)
router.delete("/admin/books/:id", verifyAdminOrMentor, async (req, res) => {
  try {
    const { id } = req.params;

    // Get book details before deletion for notification
    const book = await prisma.book.findUnique({
      where: { id },
      select: { title: true },
    });

    await prisma.book.delete({
      where: { id },
    });

    // Create notification for deleted book
    if (book) {
      await prisma.notification.create({
        data: {
          title: "Book Removed",
          message: `🗑️ "${book.title}" has been removed from the library`,
          type: "BOOK_REMOVED",
        },
      });
    }

    res.json({ message: "Book deleted successfully" });
  } catch (error) {
    console.error("Error deleting book:", error);
    res.status(500).json({ error: "Failed to delete book" });
  }
});

// Get categories
router.get("/meta/categories", async (req, res) => {
  try {
    const categories = await prisma.category.findMany({
      orderBy: { name: "asc" },
    });

    res.json(categories);
  } catch (error) {
    console.error("Error fetching categories:", error);
    res.status(500).json({ error: "Failed to fetch categories" });
  }
});

// Search endpoint with text excerpts
router.get("/search", async (req, res) => {
  try {
    const { q: searchQuery } = req.query;

    if (!searchQuery) {
      return res.status(400).json({ error: "Search query is required" });
    }

    // Split search into multiple keywords
    const searchTerms = (searchQuery as string)
      .trim()
      .split(/\s+/)
      .filter((term) => term.length > 0);

    if (searchTerms.length === 0) {
      return res.json({ results: [], searchTerms: [], totalResults: 0 });
    }

    // Build search conditions
    const searchConditions = searchTerms.flatMap((term) => [
      { title: { contains: term, mode: "insensitive" as any } },
      { briefIntro: { contains: term, mode: "insensitive" as any } },
      { content: { contains: term, mode: "insensitive" as any } },
      { keywords: { has: term } },
    ]);

    // Find books with search terms
    const books = await prisma.book.findMany({
      where: {
        OR: searchConditions,
      },
      orderBy: { createdAt: "desc" },
    });

    // Process results and extract excerpts
    const results = books.map((book) => {
      const excerpts = [];

      // Check title
      const titleMatches = searchTerms.some((term) =>
        book.title.toLowerCase().includes(term.toLowerCase())
      );
      if (titleMatches) {
        excerpts.push({
          text: book.title,
          type: "title",
        });
      }

      // Check brief intro
      const briefIntroMatches = searchTerms.some((term) =>
        book.briefIntro.toLowerCase().includes(term.toLowerCase())
      );
      if (briefIntroMatches) {
        excerpts.push({
          text: book.briefIntro,
          type: "briefIntro",
        });
      }

      // Check content
      const contentMatches = searchTerms.some((term) =>
        book.content.toLowerCase().includes(term.toLowerCase())
      );
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
    const filteredResults = results.filter(
      (result) => result.excerpts.length > 0
    );

    res.json({
      results: filteredResults,
      searchTerms,
      totalResults: filteredResults.reduce(
        (total, result) => total + result.excerpts.length,
        0
      ),
    });
  } catch (error) {
    console.error("Error performing search:", error);
    res.status(500).json({ error: "Failed to perform search" });
  }
});

export default router;
