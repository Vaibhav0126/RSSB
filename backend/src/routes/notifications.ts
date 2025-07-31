import express from "express";
import { PrismaClient } from "@prisma/client";
import jwt from "jsonwebtoken";

// Auth middleware
const verifyAuth = async (req: any, res: any, next: any) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith("Bearer ")) {
      return res.status(401).json({ error: "Authentication required" });
    }

    const token = authHeader.substring(7);
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: { id: true, email: true, name: true, role: true, isActive: true },
    });

    if (!user || !user.isActive) {
      return res.status(401).json({ error: "Invalid user" });
    }

    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({ error: "Invalid token" });
  }
};

const router = express.Router();
const prisma = new PrismaClient();

// Get all notifications (with authentication)
router.get("/", verifyAuth, async (req: any, res) => {
  try {
    const { isRead, type, page = 1, limit = 20 } = req.query;

    const skip = (Number(page) - 1) * Number(limit);
    const take = Number(limit);

    // Build where clause - only get notifications for this user or global ones
    const userId = req.user.id;
    const where: any = {
      OR: [
        { userId: userId }, // User-specific notifications
        { userId: null }, // Global notifications
      ],
    };

    if (isRead !== undefined) {
      where.isRead = isRead === "true";
    }

    if (type && type !== "all") {
      where.type = type as string;
    }

    // Get notifications with pagination
    const [notifications, total] = await Promise.all([
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
  } catch (error) {
    console.error("Error fetching notifications:", error);
    res.status(500).json({ error: "Failed to fetch notifications" });
  }
});

// Get notification stats (user-specific) - MUST be before /:id route
router.get("/stats", verifyAuth, async (req: any, res) => {
  try {
    const userId = req.user.id;

    const userNotificationWhere = {
      OR: [
        { userId: userId }, // User-specific notifications
        { userId: null }, // Global notifications
      ],
    };

    const [total, unread, byType] = await Promise.all([
      prisma.notification.count({ where: userNotificationWhere }),
      prisma.notification.count({
        where: {
          ...userNotificationWhere,
          isRead: false,
        },
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
      }, {} as Record<string, number>),
    });
  } catch (error) {
    console.error("Error fetching notification stats:", error);
    res.status(500).json({ error: "Failed to fetch notification stats" });
  }
});

// Get notification by ID
router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const notification = await prisma.notification.findUnique({
      where: { id },
    });

    if (!notification) {
      return res.status(404).json({ error: "Notification not found" });
    }

    res.json(notification);
  } catch (error) {
    console.error("Error fetching notification by ID:", error);
    res.status(500).json({ error: "Failed to fetch notification" });
  }
});

// Create new notification
router.post("/", async (req, res) => {
  try {
    const { title, message, type } = req.body;

    if (!title || !message) {
      return res.status(400).json({ error: "Title and message are required" });
    }

    const notification = await prisma.notification.create({
      data: {
        title,
        message,
        type: type || "info",
      },
    });

    res.status(201).json(notification);
  } catch (error) {
    console.error("Error creating notification:", error);
    res.status(500).json({ error: "Failed to create notification" });
  }
});

// Mark notification as read
router.put("/:id/read", async (req, res) => {
  try {
    const { id } = req.params;

    const notification = await prisma.notification.update({
      where: { id },
      data: { isRead: true },
    });

    res.json(notification);
  } catch (error) {
    console.error("Error marking notification as read:", error);
    res.status(500).json({ error: "Failed to update notification" });
  }
});

// Mark all notifications as read
router.put("/read-all", async (req, res) => {
  try {
    await prisma.notification.updateMany({
      where: { isRead: false },
      data: { isRead: true },
    });

    res.json({ message: "All notifications marked as read" });
  } catch (error) {
    console.error("Error marking all notifications as read:", error);
    res.status(500).json({ error: "Failed to update notifications" });
  }
});

// Delete notification
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    await prisma.notification.delete({
      where: { id },
    });

    res.json({ message: "Notification deleted successfully" });
  } catch (error) {
    console.error("Error deleting notification:", error);
    res.status(500).json({ error: "Failed to delete notification" });
  }
});

export default router;
