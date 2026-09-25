import type { Response } from "express";
import {
  Priority,
  Role,
  TaskStatus,
} from "@prisma/client";

import prisma from "../config/prisma";
import type { AuthRequest } from "../middleware/auth.middleware";

const priorityOrder: Record<Priority, number> = {
  CRITICAL: 4,
  HIGH: 3,
  MEDIUM: 2,
  LOW: 1,
};

export const getDashboard = async (
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

    const { userId, role } = req.user;

    // -----------------------------------------------------
    // ADMIN DASHBOARD
    // -----------------------------------------------------

    if (role === Role.ADMIN) {
      const [
        totalUsers,
        totalClients,
        totalProjects,
        totalTasks,
        overdueTasks,
        todoTasks,
        inProgressTasks,
        inReviewTasks,
        doneTasks,
        recentActivities,
      ] = await Promise.all([
        prisma.user.count(),

        prisma.client.count(),

        prisma.project.count(),

        prisma.task.count(),

        prisma.task.count({
          where: {
            isOverdue: true,
            status: {
              not: TaskStatus.DONE,
            },
          },
        }),

        prisma.task.count({
          where: {
            status: TaskStatus.TODO,
          },
        }),

        prisma.task.count({
          where: {
            status: TaskStatus.IN_PROGRESS,
          },
        }),

        prisma.task.count({
          where: {
            status: TaskStatus.IN_REVIEW,
          },
        }),

        prisma.task.count({
          where: {
            status: TaskStatus.DONE,
          },
        }),

        prisma.activityLog.findMany({
          take: 10,
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
              },
            },
            project: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        }),
      ]);

      return res.status(200).json({
        success: true,
        data: {
          role: Role.ADMIN,

          summary: {
            totalUsers,
            totalClients,
            totalProjects,
            totalTasks,
            overdueTasks,
          },

          taskStatus: {
            TODO: todoTasks,
            IN_PROGRESS: inProgressTasks,
            IN_REVIEW: inReviewTasks,
            DONE: doneTasks,
          },

          recentActivities,
        },
      });
    }

    // -----------------------------------------------------
    // PROJECT MANAGER DASHBOARD
    // -----------------------------------------------------

    if (role === Role.PROJECT_MANAGER) {
      const now = new Date();

      const endOfWeek = new Date(now);
      endOfWeek.setDate(now.getDate() + 7);
      endOfWeek.setHours(23, 59, 59, 999);

      const projects = await prisma.project.findMany({
        where: {
          createdById: userId,
        },
        include: {
          client: {
            select: {
              id: true,
              name: true,
            },
          },
          tasks: {
            include: {
              assignedTo: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                },
              },
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
      });

      const allTasks = projects.flatMap(
        (project) => project.tasks
      );

      const prioritySummary = {
        CRITICAL: allTasks.filter(
          (task) =>
            task.priority === Priority.CRITICAL
        ).length,

        HIGH: allTasks.filter(
          (task) =>
            task.priority === Priority.HIGH
        ).length,

        MEDIUM: allTasks.filter(
          (task) =>
            task.priority === Priority.MEDIUM
        ).length,

        LOW: allTasks.filter(
          (task) =>
            task.priority === Priority.LOW
        ).length,
      };

      const dueThisWeek = allTasks
        .filter(
          (task) =>
            task.dueDate >= now &&
            task.dueDate <= endOfWeek &&
            task.status !== TaskStatus.DONE
        )
        .sort(
          (a, b) =>
            a.dueDate.getTime() -
            b.dueDate.getTime()
        );

      const overdueTasks = allTasks.filter(
        (task) =>
          task.isOverdue &&
          task.status !== TaskStatus.DONE
      );

      const projectSummary = projects.map(
        (project) => {
          const tasks = project.tasks;

          return {
            id: project.id,
            name: project.name,
            description: project.description,
            client: project.client,

            totalTasks: tasks.length,

            completedTasks: tasks.filter(
              (task) =>
                task.status === TaskStatus.DONE
            ).length,

            overdueTasks: tasks.filter(
              (task) =>
                task.isOverdue &&
                task.status !== TaskStatus.DONE
            ).length,

            inReviewTasks: tasks.filter(
              (task) =>
                task.status ===
                TaskStatus.IN_REVIEW
            ).length,
          };
        }
      );

      return res.status(200).json({
        success: true,
        data: {
          role: Role.PROJECT_MANAGER,

          summary: {
            totalProjects: projects.length,
            totalTasks: allTasks.length,
            overdueTasks: overdueTasks.length,
            dueThisWeek: dueThisWeek.length,
          },

          prioritySummary,

          projectSummary,

          dueThisWeek,
        },
      });
    }

    // -----------------------------------------------------
    // DEVELOPER DASHBOARD
    // -----------------------------------------------------

    if (role === Role.DEVELOPER) {
      const tasks = await prisma.task.findMany({
        where: {
          assignedToId: userId,
        },
        include: {
          project: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      });

      tasks.sort((a, b) => {
        const priorityDifference =
          priorityOrder[b.priority] -
          priorityOrder[a.priority];

        if (priorityDifference !== 0) {
          return priorityDifference;
        }

        return (
          a.dueDate.getTime() -
          b.dueDate.getTime()
        );
      });

      const summary = {
        totalTasks: tasks.length,

        todo: tasks.filter(
          (task) =>
            task.status === TaskStatus.TODO
        ).length,

        inProgress: tasks.filter(
          (task) =>
            task.status ===
            TaskStatus.IN_PROGRESS
        ).length,

        inReview: tasks.filter(
          (task) =>
            task.status ===
            TaskStatus.IN_REVIEW
        ).length,

        done: tasks.filter(
          (task) =>
            task.status === TaskStatus.DONE
        ).length,

        overdue: tasks.filter(
          (task) =>
            task.isOverdue &&
            task.status !== TaskStatus.DONE
        ).length,
      };

      return res.status(200).json({
        success: true,
        data: {
          role: Role.DEVELOPER,
          summary,
          tasks,
        },
      });
    }

    return res.status(403).json({
      success: false,
      error: {
        code: "FORBIDDEN",
        message:
          "You do not have permission to access the dashboard",
      },
    });
  } catch (error) {
    console.error(
      "Dashboard error:",
      error
    );

    return res.status(500).json({
      success: false,
      error: {
        code: "INTERNAL_SERVER_ERROR",
        message:
          "Unable to retrieve dashboard data",
      },
    });
  }
};