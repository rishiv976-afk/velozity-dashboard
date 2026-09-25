import { NextFunction, Request, Response } from "express";
import { verifyAccessToken } from "../utils/tokens";

export interface AuthRequest extends Request {
  user?: {
    userId: number;
    role: string;
  };
}

export const authenticate = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const authorization = req.headers.authorization;

    if (!authorization?.startsWith("Bearer ")) {
      return res.status(401).json({
        success: false,
        error: {
          code: "UNAUTHORIZED",
          message: "Access token required",
        },
      });
    }

   const token = authorization.split(" ")[1];

if (!token) {
  return res.status(401).json({
    success: false,
    error: {
      code: "UNAUTHORIZED",
      message: "Access token required",
    },
  });
}

const payload = verifyAccessToken(token);
    req.user = {
      userId: payload.userId,
      role: payload.role,
    };

    next();
  } catch {
    return res.status(401).json({
      success: false,
      error: {
        code: "INVALID_TOKEN",
        message: "Invalid or expired access token",
      },
    });
  }
};