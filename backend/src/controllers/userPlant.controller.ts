import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth';
import { UserPlantService } from '../services/userPlant.service';
import { successResponse } from '../utils/response';

export const UserPlantController = {
  async create(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.userId;
      const { plant_id, nickname, environment } = req.body;
      const userPlant = await UserPlantService.createUserPlant(userId, plant_id, nickname, environment);
      successResponse(res, userPlant, 201);
    } catch (error) {
      next(error);
    }
  },

  async getAll(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.userId;
      const plants = await UserPlantService.getUserPlants(userId);
      successResponse(res, { plants, total: plants.length });
    } catch (error) {
      next(error);
    }
  },

  async getById(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.userId;
      const { id } = req.params;
      const plant = await UserPlantService.getUserPlantById(id, userId);
      successResponse(res, plant);
    } catch (error) {
      next(error);
    }
  },

  async update(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.userId;
      const { id } = req.params;
      const updated = await UserPlantService.updateUserPlant(id, userId, req.body);
      successResponse(res, updated);
    } catch (error) {
      next(error);
    }
  },

  async delete(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.userId;
      const { id } = req.params;
      await UserPlantService.deleteUserPlant(id, userId);
      successResponse(res, { message: 'Plant removed successfully' });
    } catch (error) {
      next(error);
    }
  },

  async water(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.userId;
      const { id } = req.params;
      const { amount = 1 } = req.body;
      const result = await UserPlantService.waterPlant(id, userId, amount);
      successResponse(res, result);
    } catch (error) {
      next(error);
    }
  },

  async adjustEnvironment(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.userId;
      const { id } = req.params;
      const { temperature, humidity, light_dli } = req.body;
      const result = await UserPlantService.adjustEnvironment(id, userId, {
        temperature,
        humidity,
        light_dli,
      });
      successResponse(res, result);
    } catch (error) {
      next(error);
    }
  },

  async harvest(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.userId;
      const { id } = req.params;
      const result = await UserPlantService.harvestPlant(id, userId);
      successResponse(res, result);
    } catch (error) {
      next(error);
    }
  },
};
