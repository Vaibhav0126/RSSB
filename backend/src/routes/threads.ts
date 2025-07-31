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

// Get all threads
router.get("/", async (req, res) => {
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
                contains: search as string,
                mode: "insensitive" as const,
              },
            },
            {
              content: {
                contains: search as string,
                mode: "insensitive" as const,
              },
            },
          ],
        }
      : {};

    const [threads, total] = await Promise.all([
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
  } catch (error) {
    console.error("Error fetching threads:", error);
    res.status(500).json({ error: "Failed to fetch threads" });
  }
});

// Get single thread with comments
router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const thread = await prisma.thread.findUnique({
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
  } catch (error) {
    console.error("Error fetching thread:", error);
    res.status(500).json({ error: "Failed to fetch thread" });
  }
});

// Create new thread (authenticated users only)
router.post("/", verifyAuth, async (req, res) => {
  try {
    const { title, content } = req.body;

    if (!title || !content) {
      return res.status(400).json({
        error: "Title and content are required",
      });
    }

    const thread = await prisma.thread.create({
      data: {
        title,
        content,
        authorId: (req as any).user.id,
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
  } catch (error) {
    console.error("Error creating thread:", error);
    res.status(500).json({ error: "Failed to create thread" });
  }
});

// Update thread (author only or admin)
router.put("/:id", verifyAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { title, content } = req.body;

    const existingThread = await prisma.thread.findUnique({
      where: { id },
    });

    if (!existingThread) {
      return res.status(404).json({ error: "Thread not found" });
    }

    // Check if user can edit (author or admin)
    if (
      existingThread.authorId !== (req as any).user.id &&
      (req as any).user.role !== "ADMIN"
    ) {
      return res.status(403).json({
        error: "You can only edit your own threads",
      });
    }

    const updateData: any = {};
    if (title) updateData.title = title;
    if (content) updateData.content = content;

    const updatedThread = await prisma.thread.update({
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
  } catch (error) {
    console.error("Error updating thread:", error);
    res.status(500).json({ error: "Failed to update thread" });
  }
});

// Delete thread (author only or admin)
router.delete("/:id", verifyAuth, async (req, res) => {
  try {
    const { id } = req.params;

    const existingThread = await prisma.thread.findUnique({
      where: { id },
    });

    if (!existingThread) {
      return res.status(404).json({ error: "Thread not found" });
    }

    // Check if user can delete (author or admin)
    if (
      existingThread.authorId !== (req as any).user.id &&
      (req as any).user.role !== "ADMIN"
    ) {
      return res.status(403).json({
        error: "You can only delete your own threads",
      });
    }

    await prisma.thread.delete({
      where: { id },
    });

    res.json({ message: "Thread deleted successfully" });
  } catch (error) {
    console.error("Error deleting thread:", error);
    res.status(500).json({ error: "Failed to delete thread" });
  }
});

// Add comment to thread (authenticated users only)
router.post("/:id/comments", verifyAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { content } = req.body;

    if (!content) {
      return res.status(400).json({
        error: "Content is required",
      });
    }

    // Check if thread exists
    const thread = await prisma.thread.findUnique({
      where: { id },
    });

    if (!thread) {
      return res.status(404).json({ error: "Thread not found" });
    }

    if (thread.isLocked) {
      return res.status(403).json({ error: "Thread is locked" });
    }

    const comment = await prisma.comment.create({
      data: {
        content,
        authorId: (req as any).user.id,
        threadId: id,
      },
      include: {
        author: {
          select: { id: true, name: true, role: true },
        },
      },
    });

    // Update thread's updatedAt to bring it to top
    await prisma.thread.update({
      where: { id },
      data: { updatedAt: new Date() },
    });

    res.status(201).json(comment);
  } catch (error) {
    console.error("Error creating comment:", error);
    res.status(500).json({ error: "Failed to create comment" });
  }
});

// Update comment (author only or admin)
router.put("/comments/:commentId", verifyAuth, async (req, res) => {
  try {
    const { commentId } = req.params;
    const { content } = req.body;

    const existingComment = await prisma.comment.findUnique({
      where: { id: commentId },
    });

    if (!existingComment) {
      return res.status(404).json({ error: "Comment not found" });
    }

    // Check if user can edit (author or admin)
    if (
      existingComment.authorId !== (req as any).user.id &&
      (req as any).user.role !== "ADMIN"
    ) {
      return res.status(403).json({
        error: "You can only edit your own comments",
      });
    }

    const updatedComment = await prisma.comment.update({
      where: { id: commentId },
      data: { content },
      include: {
        author: {
          select: { id: true, name: true, role: true },
        },
      },
    });

    res.json(updatedComment);
  } catch (error) {
    console.error("Error updating comment:", error);
    res.status(500).json({ error: "Failed to update comment" });
  }
});

// Delete comment (author only or admin)
router.delete("/comments/:commentId", verifyAuth, async (req, res) => {
  try {
    const { commentId } = req.params;

    const existingComment = await prisma.comment.findUnique({
      where: { id: commentId },
    });

    if (!existingComment) {
      return res.status(404).json({ error: "Comment not found" });
    }

    // Check if user can delete (author or admin)
    if (
      existingComment.authorId !== (req as any).user.id &&
      (req as any).user.role !== "ADMIN"
    ) {
      return res.status(403).json({
        error: "You can only delete your own comments",
      });
    }

    await prisma.comment.delete({
      where: { id: commentId },
    });

    res.json({ message: "Comment deleted successfully" });
  } catch (error) {
    console.error("Error deleting comment:", error);
    res.status(500).json({ error: "Failed to delete comment" });
  }
});

// Toggle thread lock status (admin only)
router.patch("/:id/lock", verifyAuth, async (req, res) => {
  try {
    const { id } = req.params;

    if ((req as any).user.role !== "ADMIN") {
      return res.status(403).json({
        error: "Only admins can lock/unlock threads",
      });
    }

    const thread = await prisma.thread.findUnique({
      where: { id },
    });

    if (!thread) {
      return res.status(404).json({ error: "Thread not found" });
    }

    const updatedThread = await prisma.thread.update({
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
  } catch (error) {
    console.error("Error toggling thread lock:", error);
    res.status(500).json({ error: "Failed to toggle thread lock" });
  }
});

export default router;
