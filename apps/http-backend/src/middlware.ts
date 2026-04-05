import { NextFunction, Request, Response } from "express";
import jwt, { decode } from "jsonwebtoken";
import { JWT_SECRET } from "@repo/backend-common/config";

// Extend Express Request interface to include userId
declare global {
  namespace Express {
    interface Request {
      userId?: number;
    }
  }
}

export function middleware(req: Request, res: Response, next: NextFunction) {
  const token = req.headers["authorization"] ?? "";
  const decoded = jwt.verify(token, JWT_SECRET);
  if (decoded) {
    req.userId = (decoded as { userId: number }).userId;
    next();
  } else {
    res.status(401).json({ message: "Unauthorized" });
  }
}
