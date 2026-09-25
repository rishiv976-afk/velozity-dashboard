import jwt from "jsonwebtoken";

export interface TokenPayload {
  userId: number;
  role: string;
}

export const generateAccessToken = (payload: TokenPayload) => {
  const secret = process.env.JWT_ACCESS_SECRET;

  if (!secret) {
    throw new Error("JWT_ACCESS_SECRET is not configured");
  }

  return jwt.sign(payload, secret, {
    expiresIn: "15m",
  });
};

export const generateRefreshToken = (payload: TokenPayload) => {
  const secret = process.env.JWT_REFRESH_SECRET;

  if (!secret) {
    throw new Error("JWT_REFRESH_SECRET is not configured");
  }

  return jwt.sign(payload, secret, {
    expiresIn: "7d",
  });
};

export const verifyAccessToken = (token: string) => {
  const secret = process.env.JWT_ACCESS_SECRET;

  if (!secret) {
    throw new Error("JWT_ACCESS_SECRET is not configured");
  }

  return jwt.verify(token, secret) as TokenPayload;
};

export const verifyRefreshToken = (token: string) => {
  const secret = process.env.JWT_REFRESH_SECRET;

  if (!secret) {
    throw new Error("JWT_REFRESH_SECRET is not configured");
  }

  return jwt.verify(token, secret) as TokenPayload;
};