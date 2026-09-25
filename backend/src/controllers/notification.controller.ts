import type { Response } from "express";

import prisma from "../config/prisma";
import type { AuthRequest } from "../middleware/auth.middleware";

export const getNotifications = async (
  req: AuthRequest,
  res: Response
) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: {
          code: "UNAUTHORIZED",
          message: "Authentication required",
        },
      });
    }

    const notifications =
      await prisma.notification.findMany({
        where: {
          userId: req.user.userId,
        },
        include: {
          task: {
            select: {
              id: true,
              title: true,
              projectId: true,
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
        take: 50,
      });

    const unreadCount =
      await prisma.notification.count({
        where: {
          userId: req.user.userId,
          isRead: false,
        },
      });

    return res.status(200).json({
      success: true,
      data: {
        notifications,
        unreadCount,
      },
    });
  } catch (error) {
    console.error(
      "Get notifications error:",
      error
    );

    return res.status(500).json({
      success: false,
      error: {
        code: "INTERNAL_SERVER_ERROR",
        message:
          "Unable to retrieve notifications",
      },
    });
  }
};

export const getUnreadCount = async (
  req: AuthRequest,
  res: Response
) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: {
          code: "UNAUTHORIZED",
          message: "Authentication required",
        },
      });
    }

    const unreadCount =
      await prisma.notification.count({
        where: {
          userId: req.user.userId,
          isRead: false,
        },
      });

    return res.status(200).json({
      success: true,
      data: {
        unreadCount,
      },
    });
  } catch (error) {
    console.error(
      "Get unread count error:",
      error
    );

    return res.status(500).json({
      success: false,
      error: {
        code: "INTERNAL_SERVER_ERROR",
        message:
          "Unable to retrieve unread notification count",
      },
    });
  }
};

export const markNotificationRead = async (
  req: AuthRequest,
  res: Response
) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: {
          code: "UNAUTHORIZED",
          message: "Authentication required",
        },
      });
    }

    const notificationId = Number(req.params.id);

    if (
      !Number.isInteger(notificationId) ||
      notificationId <= 0
    ) {
      return res.status(400).json({
        success: false,
        error: {
          code: "VALIDATION_ERROR",
          message: "Invalid notification id",
        },
      });
    }

    const notification =
      await prisma.notification.findUnique({
        where: {
          id: notificationId,
        },
      });

    if (!notification) {
      return res.status(404).json({
        success: false,
        error: {
          code: "NOTIFICATION_NOT_FOUND",
          message: "Notification not found",
        },
      });
    }

    if (
      notification.userId !==
      req.user.userId
    ) {
      return res.status(403).json({
        success: false,
        error: {
          code: "FORBIDDEN",
          message:
            "You cannot modify another user's notification",
        },
      });
    }

    const updatedNotification =
      await prisma.notification.update({
        where: {
          id: notificationId,
        },
        data: {
          isRead: true,
        },
      });

    const unreadCount =
      await prisma.notification.count({
        where: {
          userId: req.user.userId,
          isRead: false,
        },
      });

    return res.status(200).json({
      success: true,
      data: {
        notification: updatedNotification,
        unreadCount,
      },
    });
  } catch (error) {
    console.error(
      "Mark notification read error:",
      error
    );

    return res.status(500).json({
      success: false,
      error: {
        code: "INTERNAL_SERVER_ERROR",
        message:
          "Unable to mark notification as read",
      },
    });
  }
};

export const markAllNotificationsRead = async (
  req: AuthRequest,
  res: Response
) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: {
          code: "UNAUTHORIZED",
          message: "Authentication required",
        },
      });
    }

    const result =
      await prisma.notification.updateMany({
        where: {
          userId: req.user.userId,
          isRead: false,
        },
        data: {
          isRead: true,
        },
      });

    return res.status(200).json({
      success: true,
      data: {
        updatedCount: result.count,
        unreadCount: 0,
      },
      message:
        "All notifications marked as read",
    });
  } catch (error) {
    console.error(
      "Mark all notifications read error:",
      error
    );

    return res.status(500).json({
      success: false,
      error: {
        code: "INTERNAL_SERVER_ERROR",
        message:
          "Unable to mark all notifications as read",
      },
    });
  }
};