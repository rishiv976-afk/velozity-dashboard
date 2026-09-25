import type { Response } from "express";
import { Role } from "@prisma/client";
import bcrypt from "bcrypt";

import prisma from "../config/prisma";
import type { AuthRequest } from "../middleware/auth.middleware";

export const getUsers = async (
  req: AuthRequest,
  res: Response
) => {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return res.status(200).json({
      success: true,
      data: users,
    });
  } catch (error) {
    console.error("Get users error:", error);

    return res.status(500).json({
      success: false,
      error: {
        code: "INTERNAL_SERVER_ERROR",
        message: "Unable to retrieve users",
      },
    });
  }
};

export const createUser = async (
  req: AuthRequest,
  res: Response
) => {
  try {
    const { name, email, password, role } = req.body;

    if (
      typeof name !== "string" ||
      name.trim().length === 0 ||
      typeof email !== "string" ||
      email.trim().length === 0 ||
      typeof password !== "string" ||
      password.length < 8 ||
      !Object.values(Role).includes(role as Role)
    ) {
      return res.status(400).json({
        success: false,
        error: {
          code: "VALIDATION_ERROR",
          message:
            "Valid name, email, password (minimum 8 characters) and role are required",
        },
      });
    }

    const existingUser = await prisma.user.findUnique({
      where: {
        email: email.trim().toLowerCase(),
      },
    });

    if (existingUser) {
      return res.status(409).json({
        success: false,
        error: {
          code: "EMAIL_EXISTS",
          message: "A user with this email already exists",
        },
      });
    }

    const passwordHash = await bcrypt.hash(password, 12);

    const user = await prisma.user.create({
      data: {
        name: name.trim(),
        email: email.trim().toLowerCase(),
        passwordHash,
        role: role as Role,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
      },
    });

    return res.status(201).json({
      success: true,
      data: user,
    });
  } catch (error) {
    console.error("Create user error:", error);

    return res.status(500).json({
      success: false,
      error: {
        code: "INTERNAL_SERVER_ERROR",
        message: "Unable to create user",
      },
    });
  }
};

export const updateUserRole = async (
  req: AuthRequest,
  res: Response
) => {
  try {
    const userId = Number(req.params.id);
    const { role } = req.body;

    if (
      !Number.isInteger(userId) ||
      userId <= 0 ||
      !Object.values(Role).includes(role as Role)
    ) {
      return res.status(400).json({
        success: false,
        error: {
          code: "VALIDATION_ERROR",
          message: "Valid user id and role are required",
        },
      });
    }

    const existingUser = await prisma.user.findUnique({
      where: {
        id: userId,
      },
    });

    if (!existingUser) {
      return res.status(404).json({
        success: false,
        error: {
          code: "USER_NOT_FOUND",
          message: "User not found",
        },
      });
    }

    const updatedUser = await prisma.user.update({
      where: {
        id: userId,
      },
      data: {
        role: role as Role,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        updatedAt: true,
      },
    });

    return res.status(200).json({
      success: true,
      data: updatedUser,
    });
  } catch (error) {
    console.error("Update user role error:", error);

    return res.status(500).json({
      success: false,
      error: {
        code: "INTERNAL_SERVER_ERROR",
        message: "Unable to update user role",
      },
    });
  }
};

export const deleteUser = async (
  req: AuthRequest,
  res: Response
) => {
  try {
    const userId = Number(req.params.id);

    if (!Number.isInteger(userId) || userId <= 0) {
      return res.status(400).json({
        success: false,
        error: {
          code: "VALIDATION_ERROR",
          message: "Invalid user id",
        },
      });
    }

    if (req.user?.userId === userId) {
      return res.status(400).json({
        success: false,
        error: {
          code: "INVALID_OPERATION",
          message: "You cannot delete your own account",
        },
      });
    }

    const user = await prisma.user.findUnique({
      where: {
        id: userId,
      },
      include: {
        projectsCreated: true,
        assignedTasks: true,
      },
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        error: {
          code: "USER_NOT_FOUND",
          message: "User not found",
        },
      });
    }

    if (
      user.projectsCreated.length > 0 ||
      user.assignedTasks.length > 0
    ) {
      return res.status(409).json({
        success: false,
        error: {
          code: "USER_IN_USE",
          message:
            "Cannot delete a user who owns projects or has assigned tasks",
        },
      });
    }

    await prisma.user.delete({
      where: {
        id: userId,
      },
    });

    return res.status(200).json({
      success: true,
      message: "User deleted successfully",
    });
  } catch (error) {
    console.error("Delete user error:", error);

    return res.status(500).json({
      success: false,
      error: {
        code: "INTERNAL_SERVER_ERROR",
        message: "Unable to delete user",
      },
    });
  }
};

export const getClients = async (
  req: AuthRequest,
  res: Response
) => {
  try {
    const clients = await prisma.client.findMany({
      include: {
        projects: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return res.status(200).json({
      success: true,
      data: clients,
    });
  } catch (error) {
    console.error("Get clients error:", error);

    return res.status(500).json({
      success: false,
      error: {
        code: "INTERNAL_SERVER_ERROR",
        message: "Unable to retrieve clients",
      },
    });
  }
};

export const createClient = async (
  req: AuthRequest,
  res: Response
) => {
  try {
    const { name, email, phone } = req.body;

    if (
      typeof name !== "string" ||
      name.trim().length === 0
    ) {
      return res.status(400).json({
        success: false,
        error: {
          code: "VALIDATION_ERROR",
          message: "Client name is required",
        },
      });
    }

    const client = await prisma.client.create({
      data: {
        name: name.trim(),
        email:
          typeof email === "string" && email.trim().length > 0
            ? email.trim()
            : null,
        phone:
          typeof phone === "string" && phone.trim().length > 0
            ? phone.trim()
            : null,
      },
    });

    return res.status(201).json({
      success: true,
      data: client,
    });
  } catch (error) {
    console.error("Create client error:", error);

    return res.status(500).json({
      success: false,
      error: {
        code: "INTERNAL_SERVER_ERROR",
        message: "Unable to create client",
      },
    });
  }
};

export const updateClient = async (
  req: AuthRequest,
  res: Response
) => {
  try {
    const clientId = Number(req.params.id);
    const { name, email, phone } = req.body;

    if (!Number.isInteger(clientId) || clientId <= 0) {
      return res.status(400).json({
        success: false,
        error: {
          code: "VALIDATION_ERROR",
          message: "Invalid client id",
        },
      });
    }

    const client = await prisma.client.findUnique({
      where: {
        id: clientId,
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

    const updatedClient = await prisma.client.update({
      where: {
        id: clientId,
      },
      data: {
        name:
          typeof name === "string" && name.trim().length > 0
            ? name.trim()
            : client.name,
        email:
          typeof email === "string"
            ? email.trim() || null
            : client.email,
        phone:
          typeof phone === "string"
            ? phone.trim() || null
            : client.phone,
      },
    });

    return res.status(200).json({
      success: true,
      data: updatedClient,
    });
  } catch (error) {
    console.error("Update client error:", error);

    return res.status(500).json({
      success: false,
      error: {
        code: "INTERNAL_SERVER_ERROR",
        message: "Unable to update client",
      },
    });
  }
};

export const deleteClient = async (
  req: AuthRequest,
  res: Response
) => {
  try {
    const clientId = Number(req.params.id);

    if (!Number.isInteger(clientId) || clientId <= 0) {
      return res.status(400).json({
        success: false,
        error: {
          code: "VALIDATION_ERROR",
          message: "Invalid client id",
        },
      });
    }

    const client = await prisma.client.findUnique({
      where: {
        id: clientId,
      },
      include: {
        projects: true,
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

    if (client.projects.length > 0) {
      return res.status(409).json({
        success: false,
        error: {
          code: "CLIENT_IN_USE",
          message:
            "Cannot delete a client that still has projects",
        },
      });
    }

    await prisma.client.delete({
      where: {
        id: clientId,
      },
    });

    return res.status(200).json({
      success: true,
      message: "Client deleted successfully",
    });
  } catch (error) {
    console.error("Delete client error:", error);

    return res.status(500).json({
      success: false,
      error: {
        code: "INTERNAL_SERVER_ERROR",
        message: "Unable to delete client",
      },
    });
  }
};