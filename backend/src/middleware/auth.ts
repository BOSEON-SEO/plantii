import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken, JWTPayload } from '../utils/encryption';
import { errorResponse } from '../utils/response';

export interface AuthRequest extends Request {
  user?: JWTPayload;
}

export const authenticate = (req: AuthRequest, res: Response, next: NextFunction): void => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      errorResponse(res, 'UNAUTHORIZED', 'No token provided', 401);
      return;
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    try {
      const payload = verifyAccessToken(token);
      req.user = payload;
      next();
    } catch (error) {
      errorResponse(res, 'UNAUTHORIZED', 'Invalid or expired token', 401);
      return;
    }
  } catch (error) {
    errorResponse(res, 'UNAUTHORIZED', 'Authentication failed', 401);
    return;
  }
};
