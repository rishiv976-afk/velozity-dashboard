import { Server } from "socket.io";
import type { Server as HttpServer } from "http";
import { Role } from "@prisma/client";
import prisma from "../config/prisma";
import { verifyAccessToken } from "../utils/tokens";

interface SocketUser {
  userId: number;
  role: string;
}

const onlineUsers = new Map<number, number>();

export const initializeSocket = (httpServer: HttpServer) => {
  const io = new Server(httpServer, {
    cors: {
      origin: process.env.FRONTEND_URL || "http://localhost:5173",
      credentials: true,
    },
  });

  // Authenticate every socket connection using the access token.
  io.use((socket, next) => {
    try {
      const token =
        socket.handshake.auth?.token ||
        socket.handshake.headers.authorization
          ?.toString()
          .replace("Bearer ", "");

      if (!token) {
        return next(new Error("Authentication required"));
      }

      const payload = verifyAccessToken(token);

      socket.data.user = {
        userId: payload.userId,
        role: payload.role,
      } satisfies SocketUser;

      next();
    } catch {
      next(new Error("Invalid or expired access token"));
    }
  });

  io.on("connection", async (socket) => {
    const user = socket.data.user as SocketUser;

    const currentConnections =
      onlineUsers.get(user.userId) || 0;

    onlineUsers.set(
      user.userId,
      currentConnections + 1
    );

    // Private room used for notifications.
    socket.join(`user:${user.userId}`);

    if (user.role === Role.ADMIN) {
      socket.join("admins");
    }

    if (user.role === Role.PROJECT_MANAGER) {
      socket.join(`pm:${user.userId}`);
    }

    if (user.role === Role.DEVELOPER) {
      socket.join(`developer:${user.userId}`);
    }

    // -----------------------------------------------------
    // Join only project rooms the authenticated user
    // is authorized to view.
    // -----------------------------------------------------

    if (user.role === Role.ADMIN) {
      const projects = await prisma.project.findMany({
        select: {
          id: true,
        },
      });

      for (const project of projects) {
        socket.join(`project:${project.id}`);
      }
    }

    if (user.role === Role.PROJECT_MANAGER) {
      const projects = await prisma.project.findMany({
        where: {
          createdById: user.userId,
        },
        select: {
          id: true,
        },
      });

      for (const project of projects) {
        socket.join(`project:${project.id}`);
      }
    }

    if (user.role === Role.DEVELOPER) {
      const tasks = await prisma.task.findMany({
        where: {
          assignedToId: user.userId,
        },
        select: {
          id: true,
          projectId: true,
        },
      });

      for (const task of tasks) {
        socket.join(`task:${task.id}`);
      }
    }

    // -----------------------------------------------------
    // Send last 20 authorized activity records.
    // This provides reconnect / offline catch-up.
    // -----------------------------------------------------

    let activities;

    if (user.role === Role.ADMIN) {
      activities = await prisma.activityLog.findMany({
        take: 20,
        orderBy: {
          createdAt: "desc",
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
            },
          },
          task: {
            select: {
              id: true,
              title: true,
              assignedToId: true,
            },
          },
          project: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      });
    } else if (user.role === Role.PROJECT_MANAGER) {
      activities = await prisma.activityLog.findMany({
        where: {
          project: {
            createdById: user.userId,
          },
        },
        take: 20,
        orderBy: {
          createdAt: "desc",
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
            },
          },
          task: {
            select: {
              id: true,
              title: true,
              assignedToId: true,
            },
          },
          project: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      });
    } else {
      activities = await prisma.activityLog.findMany({
        where: {
          task: {
            assignedToId: user.userId,
          },
        },
        take: 20,
        orderBy: {
          createdAt: "desc",
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
            },
          },
          task: {
            select: {
              id: true,
              title: true,
              assignedToId: true,
            },
          },
          project: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      });
    }

    socket.emit(
      "activity:catchup",
      activities.reverse()
    );

    io.to("admins").emit(
      "presence:update",
      onlineUsers.size
    );

    socket.on("disconnect", () => {
      const connections =
        onlineUsers.get(user.userId) || 0;

      if (connections <= 1) {
        onlineUsers.delete(user.userId);
      } else {
        onlineUsers.set(
          user.userId,
          connections - 1
        );
      }

      io.to("admins").emit(
        "presence:update",
        onlineUsers.size
      );
    });
  });

  return io;
};