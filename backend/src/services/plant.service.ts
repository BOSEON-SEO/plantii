import { PlantModel } from '../models/Plant';
import { AppError } from '../utils/response';

export const PlantService = {
  async getAllPlants(filters?: { category?: string; difficulty?: string }) {
    return await PlantModel.findAll(filters);
  },

  async getPlantById(id: string) {
    const plant = await PlantModel.findById(id);
    if (!plant) {
      throw new AppError('PLANT_NOT_FOUND', 'Plant not found', 404);
    }
    return plant;
  },

  async getUnlockedPlants(userLevel: number) {
    return await PlantModel.findUnlocked(userLevel);
  },
};
