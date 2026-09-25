import { getSocketIO } from "../sockets/socket-instance";
import type { Response } from "express";
import {
  Priority,
  Role,
  TaskStatus,
} from "@prisma/client";

import prisma from "../config/prisma";
import type { AuthRequest } from "../middleware/auth.middleware";

const validStatuses = Object.values(TaskStatus);
const validPriorities = Object.values(Priority);

const priorityOrder: Record<Priority, number> = {
  CRITICAL: 4,
  HIGH: 3,
  MEDIUM: 2,
  LOW: 1,
};

export const getTasks = async (
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

    const { status, priority, dueDate } = req.query;

    if (
      status &&
      !validStatuses.includes(status as TaskStatus)
    ) {
      return res.status(400).json({
        success: false,
        error: {
          code: "VALIDATION_ERROR",
          message: "Invalid task status",
        },
      });
    }

    if (
      priority &&
      !validPriorities.includes(
        priority as Priority
      )
    ) {
      return res.status(400).json({
        success: false,
        error: {
          code: "VALIDATION_ERROR",
          message: "Invalid task priority",
        },
      });
    }

    const where: any = {};

    if (status) {
      where.status = status as TaskStatus;
    }

    if (priority) {
      where.priority = priority as Priority;
    }

    if (dueDate) {
      const parsedDate = new Date(
        String(dueDate)
      );

      if (Number.isNaN(parsedDate.getTime())) {
        return res.status(400).json({
          success: false,
          error: {
            code: "VALIDATION_ERROR",
            message: "Invalid due date",
          },
        });
      }

      const start = new Date(parsedDate);
      start.setHours(0, 0, 0, 0);

      const end = new Date(parsedDate);
      end.setHours(23, 59, 59, 999);

      where.dueDate = {
        gte: start,
        lte: end,
      };
    }

    if (
      req.user.role === Role.PROJECT_MANAGER
    ) {
      where.project = {
        createdById: req.user.userId,
      };
    }

    if (req.user.role === Role.DEVELOPER) {
      where.assignedToId = req.user.userId;
    }

    const tasks = await prisma.task.findMany({
      where,
      include: {
        project: {
          select: {
            id: true,
            name: true,
            createdById: true,
          },
        },
        assignedTo: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: {
        dueDate: "asc",
      },
    });

    if (req.user.role === Role.DEVELOPER) {
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
    }

    return res.status(200).json({
      success: true,
      data: tasks,
    });
  } catch (error) {
    console.error(
      "Get tasks error:",
      error
    );

    return res.status(500).json({
      success: false,
      error: {
        code: "INTERNAL_SERVER_ERROR",
        message: "Unable to retrieve tasks",
      },
    });
  }
};

export const getTaskById = async (
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

    const taskId = Number(req.params.id);

    if (
      !Number.isInteger(taskId) ||
      taskId <= 0
    ) {
      return res.status(400).json({
        success: false,
        error: {
          code: "VALIDATION_ERROR",
          message: "Invalid task id",
        },
      });
    }

    const task = await prisma.task.findUnique({
      where: {
        id: taskId,
      },
      include: {
        project: {
          include: {
            client: true,
          },
        },
        assignedTo: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        activities: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
              },
            },
          },
          orderBy: {
            createdAt: "desc",
          },
        },
      },
    });

    if (!task) {
      return res.status(404).json({
        success: false,
        error: {
          code: "TASK_NOT_FOUND",
          message: "Task not found",
        },
      });
    }

    if (
      req.user.role ===
        Role.PROJECT_MANAGER &&
      task.project.createdById !==
        req.user.userId
    ) {
      return res.status(403).json({
        success: false,
        error: {
          code: "FORBIDDEN",
          message:
            "You cannot access tasks from another project manager",
        },
      });
    }

    if (
      req.user.role === Role.DEVELOPER &&
      task.assignedToId !== req.user.userId
    ) {
      return res.status(403).json({
        success: false,
        error: {
          code: "FORBIDDEN",
          message:
            "You can only access tasks assigned to you",
        },
      });
    }

    return res.status(200).json({
      success: true,
      data: task,
    });
  } catch (error) {
    console.error(
      "Get task error:",
      error
    );

    return res.status(500).json({
      success: false,
      error: {
        code: "INTERNAL_SERVER_ERROR",
        message: "Unable to retrieve task",
      },
    });
  }
};

export const createTask = async (
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

    const {
      title,
      description,
      projectId,
      assignedToId,
      priority,
      dueDate,
    } = req.body;

    if (
      typeof title !== "string" ||
      title.trim().length === 0 ||
      !Number.isInteger(Number(projectId)) ||
      !Number.isInteger(
        Number(assignedToId)
      ) ||
      !validPriorities.includes(
        priority as Priority
      ) ||
      !dueDate
    ) {
      return res.status(400).json({
        success: false,
        error: {
          code: "VALIDATION_ERROR",
          message:
            "title, projectId, assignedToId, priority and dueDate are required",
        },
      });
    }

    const parsedDueDate = new Date(dueDate);

    if (
      Number.isNaN(parsedDueDate.getTime())
    ) {
      return res.status(400).json({
        success: false,
        error: {
          code: "VALIDATION_ERROR",
          message: "Invalid due date",
        },
      });
    }

    const project =
      await prisma.project.findUnique({
        where: {
          id: Number(projectId),
        },
      });

    if (!project) {
      return res.status(404).json({
        success: false,
        error: {
          code: "PROJECT_NOT_FOUND",
          message: "Project not found",
        },
      });
    }

    if (
      req.user.role ===
        Role.PROJECT_MANAGER &&
      project.createdById !==
        req.user.userId
    ) {
      return res.status(403).json({
        success: false,
        error: {
          code: "FORBIDDEN",
          message:
            "You can only manage projects you created",
        },
      });
    }

    const developer =
      await prisma.user.findUnique({
        where: {
          id: Number(assignedToId),
        },
      });

    if (
      !developer ||
      developer.role !== Role.DEVELOPER
    ) {
      return res.status(400).json({
        success: false,
        error: {
          code: "INVALID_DEVELOPER",
          message:
            "Assigned user must be a developer",
        },
      });
    }

    const task =
      await prisma.$transaction(
        async (tx) => {
          const createdTask =
            await tx.task.create({
              data: {
                title: title.trim(),
                description:
                  typeof description ===
                  "string"
                    ? description.trim()
                    : null,
                projectId: Number(projectId),
                assignedToId:
                  Number(assignedToId),
                priority:
                  priority as Priority,
                dueDate: parsedDueDate,
                status: TaskStatus.TODO,
                isOverdue:
                  parsedDueDate.getTime() <
                  Date.now(),
              },
              include: {
                project: true,
                assignedTo: {
                  select: {
                    id: true,
                    name: true,
                    email: true,
                  },
                },
              },
            });

          const notification =
            await tx.notification.create({
              data: {
                userId:
                  Number(assignedToId),
                taskId: createdTask.id,
                message:
                  `You were assigned to "${createdTask.title}"`,
              },
            });

          return {
            createdTask,
            notification,
          };
        }
      );

    const io = getSocketIO();

    io.to(
      `user:${Number(assignedToId)}`
    ).emit(
      "notification:new",
      task.notification
    );

    return res.status(201).json({
      success: true,
      data: task.createdTask,
    });
  } catch (error) {
    console.error(
      "Create task error:",
      error
    );

    return res.status(500).json({
      success: false,
      error: {
        code: "INTERNAL_SERVER_ERROR",
        message: "Unable to create task",
      },
    });
  }
};

export const updateTaskStatus = async (
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

    const taskId = Number(req.params.id);
    const { status } = req.body;

    if (
      !Number.isInteger(taskId) ||
      taskId <= 0
    ) {
      return res.status(400).json({
        success: false,
        error: {
          code: "VALIDATION_ERROR",
          message: "Invalid task id",
        },
      });
    }

    if (
      !validStatuses.includes(
        status as TaskStatus
      )
    ) {
      return res.status(400).json({
        success: false,
        error: {
          code: "VALIDATION_ERROR",
          message: "Invalid task status",
        },
      });
    }

    const existingTask =
      await prisma.task.findUnique({
        where: {
          id: taskId,
        },
        include: {
          project: true,
        },
      });

    if (!existingTask) {
      return res.status(404).json({
        success: false,
        error: {
          code: "TASK_NOT_FOUND",
          message: "Task not found",
        },
      });
    }

    if (
      req.user.role ===
        Role.PROJECT_MANAGER &&
      existingTask.project.createdById !==
        req.user.userId
    ) {
      return res.status(403).json({
        success: false,
        error: {
          code: "FORBIDDEN",
          message:
            "You can only manage tasks in projects you created",
        },
      });
    }

    if (
      req.user.role === Role.DEVELOPER &&
      existingTask.assignedToId !==
        req.user.userId
    ) {
      return res.status(403).json({
        success: false,
        error: {
          code: "FORBIDDEN",
          message:
            "You can only update tasks assigned to you",
        },
      });
    }

    const newStatus =
      status as TaskStatus;

    if (
      existingTask.status === newStatus
    ) {
      return res.status(200).json({
        success: true,
        data: existingTask,
        message:
          "Task is already in this status",
      });
    }

    const result =
      await prisma.$transaction(
        async (tx) => {
          const updatedTask =
            await tx.task.update({
              where: {
                id: taskId,
              },
              data: {
                status: newStatus,
                isOverdue:
                  newStatus !==
                    TaskStatus.DONE &&
                  existingTask.dueDate.getTime() <
                    Date.now(),
              },
              include: {
                project: true,
                assignedTo: {
                  select: {
                    id: true,
                    name: true,
                    email: true,
                  },
                },
              },
            });

          const activity =
            await tx.activityLog.create({
              data: {
                taskId: existingTask.id,
                projectId:
                  existingTask.projectId,
                userId:
                  req.user!.userId,
                oldStatus:
                  existingTask.status,
                newStatus,
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
                    createdById: true,
                  },
                },
              },
            });

          let notification = null;

          if (
            newStatus ===
            TaskStatus.IN_REVIEW
          ) {
            notification =
              await tx.notification.create({
                data: {
                  userId:
                    existingTask.project
                      .createdById,
                  taskId:
                    existingTask.id,
                  message:
                    `"${existingTask.title}" was moved to In Review`,
                },
              });
          }

          return {
            updatedTask,
            activity,
            notification,
          };
        }
      );

  const io = getSocketIO();

    // Admin receives every activity.
    io.to("admins").emit(
      "activity:new",
      result.activity
    );

    // Owning PM receives activity for their project.
    io.to(
      `pm:${existingTask.project.createdById}`
    ).emit(
      "activity:new",
      result.activity
    );

    // Only the assigned developer receives this
    // task's activity.
    if (existingTask.assignedToId) {
      io.to(
        `developer:${existingTask.assignedToId}`
      ).emit(
        "activity:new",
        result.activity
      );
    }

    if (result.notification) {
      io.to(
        `user:${result.notification.userId}`
      ).emit(
        "notification:new",
        result.notification
      );
    }

    return res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error(
      "Update task status error:",
      error
    );

    return res.status(500).json({
      success: false,
      error: {
        code: "INTERNAL_SERVER_ERROR",
        message:
          "Unable to update task status",
      },
    });
  }
};