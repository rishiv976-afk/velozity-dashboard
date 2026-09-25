import type { Request, Response } from "express";
import bcrypt from "bcrypt";

import prisma from "../config/prisma";

import {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
} from "../utils/tokens";

const isProduction =
  process.env.NODE_ENV === "production";

const refreshCookieOptions = {
  httpOnly: true,
  secure: isProduction,
  sameSite: isProduction
    ? ("none" as const)
    : ("lax" as const),
  maxAge:
    7 *
    24 *
    60 *
    60 *
    1000,
};

const refreshCookieClearOptions = {
  httpOnly: true,
  secure: isProduction,
  sameSite: isProduction
    ? ("none" as const)
    : ("lax" as const),
};

export const login = async (
  req: Request,
  res: Response
) => {
  try {
    const { email, password } =
      req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: {
          code: "VALIDATION_ERROR",
          message:
            "Email and password are required",
        },
      });
    }

    const user =
      await prisma.user.findUnique({
        where: {
          email,
        },
      });

    if (!user) {
      return res.status(401).json({
        success: false,
        error: {
          code: "INVALID_CREDENTIALS",
          message:
            "Invalid email or password",
        },
      });
    }

    const passwordMatches =
      await bcrypt.compare(
        password,
        user.passwordHash
      );

    if (!passwordMatches) {
      return res.status(401).json({
        success: false,
        error: {
          code: "INVALID_CREDENTIALS",
          message:
            "Invalid email or password",
        },
      });
    }

    const payload = {
      userId: user.id,
      role: user.role,
    };

    const accessToken =
      generateAccessToken(payload);

    const refreshToken =
      generateRefreshToken(payload);

    res.cookie(
      "refreshToken",
      refreshToken,
      refreshCookieOptions
    );

    return res.status(200).json({
      success: true,
      data: {
        accessToken,

        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
        },
      },
    });
  } catch (error) {
    console.error(
      "Login error:",
      error
    );

    return res.status(500).json({
      success: false,
      error: {
        code: "INTERNAL_SERVER_ERROR",
        message: "Unable to login",
      },
    });
  }
};

export const refresh = async (
  req: Request,
  res: Response
) => {
  try {
    const refreshToken =
      req.cookies.refreshToken;

    if (!refreshToken) {
      return res.status(401).json({
        success: false,
        error: {
          code:
            "REFRESH_TOKEN_REQUIRED",
          message:
            "Refresh token required",
        },
      });
    }

    const payload =
      verifyRefreshToken(
        refreshToken
      );

    const user =
      await prisma.user.findUnique({
        where: {
          id: payload.userId,
        },
      });

    if (!user) {
      return res.status(401).json({
        success: false,
        error: {
          code:
            "INVALID_REFRESH_TOKEN",
          message:
            "Invalid refresh token",
        },
      });
    }

    const accessToken =
      generateAccessToken({
        userId: user.id,
        role: user.role,
      });

    return res.status(200).json({
      success: true,
      data: {
        accessToken,

        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
        },
      },
    });
  } catch {
    return res.status(401).json({
      success: false,
      error: {
        code:
          "INVALID_REFRESH_TOKEN",
        message:
          "Invalid or expired refresh token",
      },
    });
  }
};

export const logout = async (
  _req: Request,
  res: Response
) => {
  res.clearCookie(
    "refreshToken",
    refreshCookieClearOptions
  );

  return res.status(200).json({
    success: true,
    message:
      "Logged out successfully",
  });
};