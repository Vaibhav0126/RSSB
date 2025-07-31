import express from "express";
import { PrismaClient, MeetingStatus } from "@prisma/client";
import jwt from "jsonwebtoken";

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

// Middleware to verify admin or mentor role (can schedule meetings)
const verifyScheduler = async (req: any, res: any, next: any) => {
  verifyAuth(req, res, () => {
    if (
      (req as any).user.role !== "ADMIN" &&
      (req as any).user.role !== "MENTOR"
    ) {
      return res.status(403).json({
        error: "Access denied. Only Admin or Mentor can schedule meetings.",
      });
    }
    next();
  });
};

// Get all meetings (filter based on user role)
router.get("/", verifyAuth, async (req, res) => {
  try {
    let meetings;

    if (
      (req as any).user.role === "ADMIN" ||
      (req as any).user.role === "MENTOR"
    ) {
      // Admin/Mentor can see all meetings
      meetings = await prisma.meeting.findMany({
        include: {
          scheduler: {
            select: { name: true, email: true },
          },
        },
        orderBy: { startTime: "asc" },
      });
    } else {
      // SK/ASK can only see meetings they're attending
      meetings = await prisma.meeting.findMany({
        where: {
          targetRoles: {
            has: (req as any).user.role,
          },
        },
        include: {
          scheduler: {
            select: { name: true, email: true },
          },
        },
        orderBy: { startTime: "asc" },
      });
    }

    res.json(meetings);
  } catch (error) {
    console.error("Error fetching meetings:", error);
    res.status(500).json({ error: "Failed to fetch meetings" });
  }
});

// Create new meeting (admin/mentor only)
router.post("/", verifyScheduler, async (req, res) => {
  try {
    const {
      title,
      description,
      location,
      startTime,
      endTime,
      targetRoles,
      meetingLink,
    } = req.body;

    if (
      !title ||
      !startTime ||
      !endTime ||
      !targetRoles ||
      targetRoles.length === 0
    ) {
      return res.status(400).json({
        error: "Title, start time, end time, and target roles are required",
      });
    }

    // Validate target roles
    const validRoles = ["SK", "ASK", "MENTOR", "ADMIN"];
    const invalidRoles = targetRoles.filter(
      (role: string) => !validRoles.includes(role)
    );
    if (invalidRoles.length > 0) {
      return res.status(400).json({
        error: `Invalid roles: ${invalidRoles.join(
          ", "
        )}. Valid roles: ${validRoles.join(", ")}`,
      });
    }

    // Create meeting
    const meeting = await prisma.meeting.create({
      data: {
        title,
        description,
        location,
        startTime: new Date(startTime),
        endTime: new Date(endTime),
        meetingLink,
        schedulerId: (req as any).user.id,
        targetRoles,
      },
      include: {
        scheduler: {
          select: { name: true, email: true },
        },
      },
    });

    // Create notifications for all users with target roles
    const targetUsers = await prisma.user.findMany({
      where: {
        role: { in: targetRoles as any },
        isActive: true,
      },
    });

    if (targetUsers.length > 0) {
      await prisma.notification.createMany({
        data: targetUsers.map((user) => ({
          title: "New Meeting Scheduled",
          message: `📅 "${title}" scheduled for ${targetRoles.join(", ")} by ${
            (req as any).user.name
          } on ${new Date(startTime).toLocaleDateString()}`,
          type: "MEETING_SCHEDULED" as const,
          userId: user.id,
          meetingId: meeting.id,
        })),
      });
    }

    // Create general notification
    await prisma.notification.create({
      data: {
        title: "Meeting Scheduled",
        message: `📅 ${(req as any).user.name} scheduled a meeting: "${title}"`,
        type: "MEETING_SCHEDULED",
        meetingId: meeting.id,
      },
    });

    res.status(201).json(meeting);
  } catch (error) {
    console.error("Error creating meeting:", error);
    res.status(500).json({ error: "Failed to create meeting" });
  }
});

// Update meeting (admin/mentor only, only their own meetings)
router.put("/:id", verifyScheduler, async (req, res) => {
  try {
    const { id } = req.params;
    const {
      title,
      description,
      location,
      startTime,
      endTime,
      status,
      targetRoles,
      meetingLink,
    } = req.body;

    // Check if user can edit this meeting
    const existingMeeting = await prisma.meeting.findUnique({
      where: { id },
    });

    if (!existingMeeting) {
      return res.status(404).json({ error: "Meeting not found" });
    }

    if (
      existingMeeting.schedulerId !== (req as any).user.id &&
      (req as any).user.role !== "ADMIN"
    ) {
      return res
        .status(403)
        .json({ error: "You can only edit meetings you scheduled" });
    }

    const updateData: any = {};
    if (title) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (location !== undefined) updateData.location = location;
    if (startTime) updateData.startTime = new Date(startTime);
    if (endTime) updateData.endTime = new Date(endTime);
    if (status) updateData.status = status as MeetingStatus;
    if (meetingLink !== undefined) updateData.meetingLink = meetingLink;

    // Handle target roles updates
    if (targetRoles && targetRoles.length > 0) {
      const validRoles = ["SK", "ASK", "MENTOR", "ADMIN"];
      const invalidRoles = targetRoles.filter(
        (role: string) => !validRoles.includes(role)
      );
      if (invalidRoles.length > 0) {
        return res.status(400).json({
          error: `Invalid roles: ${invalidRoles.join(
            ", "
          )}. Valid roles: ${validRoles.join(", ")}`,
        });
      }
      updateData.targetRoles = targetRoles;
    }

    const meeting = await prisma.meeting.update({
      where: { id },
      data: updateData,
      include: {
        scheduler: {
          select: { name: true, email: true },
        },
      },
    });

    res.json(meeting);
  } catch (error) {
    console.error("Error updating meeting:", error);
    res.status(500).json({ error: "Failed to update meeting" });
  }
});

// Cancel meeting (admin/mentor only, only their own meetings)
router.delete("/:id", verifyScheduler, async (req, res) => {
  try {
    const { id } = req.params;

    const existingMeeting = await prisma.meeting.findUnique({
      where: { id },
    });

    if (!existingMeeting) {
      return res.status(404).json({ error: "Meeting not found" });
    }

    if (
      existingMeeting.schedulerId !== (req as any).user.id &&
      (req as any).user.role !== "ADMIN"
    ) {
      return res
        .status(403)
        .json({ error: "You can only cancel meetings you scheduled" });
    }

    // Update meeting status to cancelled
    const meeting = await prisma.meeting.update({
      where: { id },
      data: { status: "CANCELLED" },
    });

    // Notify users with target roles about cancellation
    const targetUsers = await prisma.user.findMany({
      where: {
        role: { in: existingMeeting.targetRoles as any },
        isActive: true,
      },
    });

    if (targetUsers.length > 0) {
      await prisma.notification.createMany({
        data: targetUsers.map((user) => ({
          title: "Meeting Cancelled",
          message: `❌ "${existingMeeting.title}" has been cancelled by ${
            (req as any).user.name
          }`,
          type: "MEETING_CANCELLED" as const,
          userId: user.id,
          meetingId: meeting.id,
        })),
      });
    }

    res.json({ message: "Meeting cancelled successfully", meeting });
  } catch (error) {
    console.error("Error cancelling meeting:", error);
    res.status(500).json({ error: "Failed to cancel meeting" });
  }
});

// Get SK and ASK users for meeting scheduling
router.get("/available-roles", verifyScheduler, async (req, res) => {
  try {
    const roles = [
      {
        value: "SK",
        label: "SK (Satsang Kendra)",
        description: "Satsang Kendra members",
      },
      {
        value: "ASK",
        label: "ASK (Assistant Satsang Kendra)",
        description: "Assistant Satsang Kendra members",
      },
      {
        value: "MENTOR",
        label: "Mentors",
        description: "Mentor staff members",
      },
      { value: "ADMIN", label: "Admins", description: "Administrative staff" },
    ];

    // Add count of users in each role
    const roleCounts = await prisma.user.groupBy({
      by: ["role"],
      where: { isActive: true },
      _count: { role: true },
    });

    const rolesWithCounts = roles.map((role) => {
      const count =
        roleCounts.find((rc) => rc.role === role.value)?._count.role || 0;
      return { ...role, userCount: count };
    });

    res.json(rolesWithCounts);
  } catch (error) {
    console.error("Error fetching available roles:", error);
    res.status(500).json({ error: "Failed to fetch available roles" });
  }
});

export default router;
