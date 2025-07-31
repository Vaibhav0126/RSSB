import express from "express";
import { PrismaClient, UserRole } from "@prisma/client";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import { sendOTPEmail } from "../services/emailService";

const router = express.Router();
const prisma = new PrismaClient();

// JWT Secret
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

// Middleware to verify admin role only
const verifyAdmin = async (req: any, res: any, next: any) => {
  verifyAuth(req, res, () => {
    if ((req as any).user.role !== "ADMIN") {
      return res
        .status(403)
        .json({ error: "Access denied. Admin role required." });
    }
    next();
  });
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

// Get all users (admin only)
router.get("/", verifyAdmin, async (req, res) => {
  try {
    const users = await prisma.user.findMany({
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
  } catch (error) {
    console.error("Error fetching users:", error);
    res.status(500).json({ error: "Failed to fetch users" });
  }
});

// Register new user (admin/mentor only)
router.post("/register", verifyAdminOrMentor, async (req, res) => {
  try {
    const { email, name, role } = req.body;

    if (!email || !name || !role) {
      return res
        .status(400)
        .json({ error: "Email, name, and role are required" });
    }

    // Validate role assignment permissions
    if ((req as any).user.role === "MENTOR") {
      // Mentors can only create SK, ASK users
      if (!["SK", "ASK"].includes(role)) {
        return res.status(403).json({
          error: "Mentors can only register SK or ASK users",
        });
      }
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return res
        .status(400)
        .json({ error: "User with this email already exists" });
    }

    // Create user
    const user = await prisma.user.create({
      data: {
        email,
        name,
        role: role as UserRole,
        createdBy: (req as any).user.id,
      },
    });

    // Create notification
    await prisma.notification.create({
      data: {
        title: "New User Registered",
        message: `👤 ${name} (${role}) has been registered by ${
          (req as any).user.name
        }`,
        type: "USER_REGISTERED",
      },
    });

    // Send welcome email with OTP setup
    try {
      const otp = crypto.randomInt(100000, 999999).toString();
      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

      await prisma.oTP.create({
        data: {
          email,
          code: otp,
          expiresAt,
        },
      });

      // Send welcome email (you can customize this)
      console.log(`Welcome OTP for ${email}: ${otp}`);
    } catch (emailError) {
      console.error("Error sending welcome email:", emailError);
    }

    res.status(201).json({
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      createdAt: user.createdAt,
    });
  } catch (error) {
    console.error("Error registering user:", error);
    res.status(500).json({ error: "Failed to register user" });
  }
});

// Update user (admin only, or admin can promote to mentor)
router.put("/:id", verifyAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, role, isActive } = req.body;

    const user = await prisma.user.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(role && { role: role as UserRole }),
        ...(isActive !== undefined && { isActive }),
      },
    });

    res.json({
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      isActive: user.isActive,
    });
  } catch (error) {
    console.error("Error updating user:", error);
    res.status(500).json({ error: "Failed to update user" });
  }
});

// Deactivate user (admin only)
router.delete("/:id", verifyAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    const user = await prisma.user.update({
      where: { id },
      data: { isActive: false },
    });

    res.json({ message: "User deactivated successfully", user });
  } catch (error) {
    console.error("Error deactivating user:", error);
    res.status(500).json({ error: "Failed to deactivate user" });
  }
});

// Get current user profile
router.get("/profile", verifyAuth, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: (req as any).user.id },
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
  } catch (error) {
    console.error("Error fetching user profile:", error);
    res.status(500).json({ error: "Failed to fetch user profile" });
  }
});

export default router;
