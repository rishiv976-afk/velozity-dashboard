import type { Response } from "express";
import { Role } from "@prisma/client";

import prisma from "../config/prisma";
import type { AuthRequest } from "../middleware/auth.middleware";

const parseId = (
  value: string | string[] | undefined
): number | null => {
  if (Array.isArray(value)) {
    return null;
  }

  const id = Number(value);

  if (!Number.isInteger(id) || id <= 0) {
    return null;
  }

  return id;
};

export const getProjects = async (
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

    if (req.user.role === Role.ADMIN) {
      const projects = await prisma.project.findMany({
        include: {
          client: true,
          createdBy: {
            select: {
              id: true,
              name: true,
              email: true,
              role: true,
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

      return res.status(200).json({
        success: true,
        data: projects,
      });
    }

    if (req.user.role === Role.PROJECT_MANAGER) {
      const projects = await prisma.project.findMany({
        where: {
          createdById: req.user.userId,
        },
        include: {
          client: true,
          createdBy: {
            select: {
              id: true,
              name: true,
              email: true,
              role: true,
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

      return res.status(200).json({
        success: true,
        data: projects,
      });
    }

    if (req.user.role === Role.DEVELOPER) {
      const projects = await prisma.project.findMany({
        where: {
          tasks: {
            some: {
              assignedToId: req.user.userId,
            },
          },
        },
        select: {
          id: true,
          name: true,
          description: true,
          client: {
            select: {
              id: true,
              name: true,
            },
          },
          tasks: {
            where: {
              assignedToId: req.user.userId,
            },
            include: {
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
          },
        },
        orderBy: {
          createdAt: "desc",
        },
      });

      return res.status(200).json({
        success: true,
        data: projects,
      });
    }

    return res.status(403).json({
      success: false,
      error: {
        code: "FORBIDDEN",
        message: "Invalid role",
      },
    });
  } catch (error) {
    console.error("Get projects error:", error);

    return res.status(500).json({
      success: false,
      error: {
        code: "INTERNAL_SERVER_ERROR",
        message: "Unable to retrieve projects",
      },
    });
  }
};

export const getProjectById = async (
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

    const projectId = parseId(req.params.id);

    if (!projectId) {
      return res.status(400).json({
        success: false,
        error: {
          code: "VALIDATION_ERROR",
          message: "Invalid project id",
        },
      });
    }

    const project = await prisma.project.findUnique({
      where: {
        id: projectId,
      },
      include: {
        client: true,
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
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
          orderBy: {
            dueDate: "asc",
          },
        },
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
      req.user.role === Role.PROJECT_MANAGER &&
      project.createdById !== req.user.userId
    ) {
      return res.status(403).json({
        success: false,
        error: {
          code: "FORBIDDEN",
          message: "You can only access projects you created",
        },
      });
    }

    if (req.user.role === Role.DEVELOPER) {
      const tasks = project.tasks.filter(
        (task) =>
          task.assignedToId === req.user!.userId
      );

      if (tasks.length === 0) {
        return res.status(403).json({
          success: false,
          error: {
            code: "FORBIDDEN",
            message:
              "You are not assigned to this project",
          },
        });
      }

      return res.status(200).json({
        success: true,
        data: {
          id: project.id,
          name: project.name,
          description: project.description,
          client: project.client,
          tasks,
        },
      });
    }

    return res.status(200).json({
      success: true,
      data: project,
    });
  } catch (error) {
    console.error("Get project error:", error);

    return res.status(500).json({
      success: false,
      error: {
        code: "INTERNAL_SERVER_ERROR",
        message: "Unable to retrieve project",
      },
    });
  }
};

export const createProject = async (
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
      name,
      description,
      clientId,
    } = req.body;

    const parsedClientId = Number(clientId);

    if (
      typeof name !== "string" ||
      name.trim().length === 0 ||
      !Number.isInteger(parsedClientId) ||
      parsedClientId <= 0
    ) {
      return res.status(400).json({
        success: false,
        error: {
          code: "VALIDATION_ERROR",
          message:
            "Valid name and clientId are required",
        },
      });
    }

    const client =
      await prisma.client.findUnique({
        where: {
          id: parsedClientId,
        },
      });

    if (!client) {
      return res.status(404).json({
        success: false,
        error: {
          code: "CLIENT_NOT_FOUND",
          message: "Client not found",
        },
      });
    }

    const project =
      await prisma.project.create({
        data: {
          name: name.trim(),

          description:
            typeof description === "string" &&
            description.trim().length > 0
              ? description.trim()
              : null,

          clientId: parsedClientId,

          createdById: req.user.userId,
        },
        include: {
          client: true,

          createdBy: {
            select: {
              id: true,
              name: true,
              email: true,
              role: true,
            },
          },
        },
      });

    return res.status(201).json({
      success: true,
      data: project,
    });
  } catch (error) {
    console.error(
      "Create project error:",
      error
    );

    return res.status(500).json({
      success: false,
      error: {
        code: "INTERNAL_SERVER_ERROR",
        message: "Unable to create project",
      },
    });
  }
};

export const updateProject = async (
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

    const projectId = parseId(req.params.id);

    if (!projectId) {
      return res.status(400).json({
        success: false,
        error: {
          code: "VALIDATION_ERROR",
          message: "Invalid project id",
        },
      });
    }

    const existingProject =
      await prisma.project.findUnique({
        where: {
          id: projectId,
        },
      });

    if (!existingProject) {
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
      existingProject.createdById !==
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

    const {
      name,
      description,
      clientId,
    } = req.body;

    let newClientId =
      existingProject.clientId;

    if (clientId !== undefined) {
      const parsedClientId =
        Number(clientId);

      if (
        !Number.isInteger(parsedClientId) ||
        parsedClientId <= 0
      ) {
        return res.status(400).json({
          success: false,
          error: {
            code: "VALIDATION_ERROR",
            message: "Invalid client id",
          },
        });
      }

      const client =
        await prisma.client.findUnique({
          where: {
            id: parsedClientId,
          },
        });

      if (!client) {
        return res.status(404).json({
          success: false,
          error: {
            code: "CLIENT_NOT_FOUND",
            message: "Client not found",
          },
        });
      }

      newClientId = parsedClientId;
    }

    let newName =
      existingProject.name;

    if (name !== undefined) {
      if (
        typeof name !== "string" ||
        name.trim().length === 0
      ) {
        return res.status(400).json({
          success: false,
          error: {
            code: "VALIDATION_ERROR",
            message:
              "Project name cannot be empty",
          },
        });
      }

      newName = name.trim();
    }

    let newDescription =
      existingProject.description;

    if (description === null) {
      newDescription = null;
    } else if (
      typeof description === "string"
    ) {
      newDescription =
        description.trim().length > 0
          ? description.trim()
          : null;
    }

    const project =
      await prisma.project.update({
        where: {
          id: projectId,
        },
        data: {
          name: newName,
          description: newDescription,
          clientId: newClientId,
        },
        include: {
          client: true,

          createdBy: {
            select: {
              id: true,
              name: true,
              email: true,
              role: true,
            },
          },
        },
      });

    return res.status(200).json({
      success: true,
      data: project,
    });
  } catch (error) {
    console.error(
      "Update project error:",
      error
    );

    return res.status(500).json({
      success: false,
      error: {
        code: "INTERNAL_SERVER_ERROR",
        message: "Unable to update project",
      },
    });
  }
};

export const deleteProject = async (
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

    const projectId = parseId(req.params.id);

    if (!projectId) {
      return res.status(400).json({
        success: false,
        error: {
          code: "VALIDATION_ERROR",
          message: "Invalid project id",
        },
      });
    }

    const project =
      await prisma.project.findUnique({
        where: {
          id: projectId,
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
            "You can only delete projects you created",
        },
      });
    }

    await prisma.project.delete({
      where: {
        id: projectId,
      },
    });

    return res.status(200).json({
      success: true,
      message:
        "Project deleted successfully",
    });
  } catch (error) {
    console.error(
      "Delete project error:",
      error
    );

    return res.status(500).json({
      success: false,
      error: {
        code: "INTERNAL_SERVER_ERROR",
        message: "Unable to delete project",
      },
    });
  }
};