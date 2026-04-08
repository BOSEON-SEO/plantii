import { Request, Response, NextFunction } from 'express';
import { AuthService } from '../services/auth.service';
import { successResponse } from '../utils/response';

export const AuthController = {
  async register(req: Request, res: Response, next: NextFunction) {
    try {
      const { username, email, password, display_name } = req.body;
      const result = await AuthService.register(username, email, password, display_name);
      successResponse(res, result, 201);
    } catch (error) {
      next(error);
    }
  },

  async login(req: Request, res: Response, next: NextFunction) {
    try {
      const { email, password } = req.body;
      const result = await AuthService.login(email, password);
      successResponse(res, result, 200);
    } catch (error) {
      next(error);
    }
  },
};
