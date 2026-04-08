import { Request, Response, NextFunction } from 'express';
import { PlantService } from '../services/plant.service';
import { successResponse } from '../utils/response';

export const PlantController = {
  async getAll(req: Request, res: Response, next: NextFunction) {
    try {
      const { category, difficulty } = req.query;
      const plants = await PlantService.getAllPlants({
        category: category as string,
        difficulty: difficulty as string,
      });
      successResponse(res, { plants, total: plants.length });
    } catch (error) {
      next(error);
    }
  },

  async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const plant = await PlantService.getPlantById(id);
      successResponse(res, plant);
    } catch (error) {
      next(error);
    }
  },
};
