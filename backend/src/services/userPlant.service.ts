import { UserPlantModel } from '../models/UserPlant';
import { PlantModel } from '../models/Plant';
import { UserModel } from '../models/User';
import { AppError } from '../utils/response';
import { SimulationService } from './simulation.service';

export const UserPlantService = {
  async createUserPlant(
    userId: string,
    plantId: string,
    nickname?: string,
    environment?: { temperature?: number; humidity?: number; light_dli?: number }
  ) {
    // Verify plant exists
    const plant = await PlantModel.findById(plantId);
    if (!plant) {
      throw new AppError('PLANT_NOT_FOUND', 'Plant not found', 404);
    }

    // Create user plant
    const userPlant = await UserPlantModel.create({
      user_id: userId,
      plant_id: plantId,
      nickname,
      ...environment,
    });

    return userPlant;
  },

  async getUserPlants(userId: string) {
    return await UserPlantModel.findByUserId(userId);
  },

  async getUserPlantById(id: string, userId: string) {
    const userPlant = await UserPlantModel.findById(id);
    if (!userPlant) {
      throw new AppError('USER_PLANT_NOT_FOUND', 'Plant not found', 404);
    }

    if (userPlant.user_id !== userId) {
      throw new AppError('FORBIDDEN', 'Access denied', 403);
    }

    // Get plant data
    const plant = await PlantModel.findById(userPlant.plant_id);

    return {
      ...userPlant,
      plant_data: plant,
    };
  },

  async updateUserPlant(id: string, userId: string, data: { nickname?: string }) {
    const userPlant = await UserPlantModel.findById(id);
    if (!userPlant) {
      throw new AppError('USER_PLANT_NOT_FOUND', 'Plant not found', 404);
    }

    if (userPlant.user_id !== userId) {
      throw new AppError('FORBIDDEN', 'Access denied', 403);
    }

    return await UserPlantModel.update(id, data);
  },

  async deleteUserPlant(id: string, userId: string) {
    const userPlant = await UserPlantModel.findById(id);
    if (!userPlant) {
      throw new AppError('USER_PLANT_NOT_FOUND', 'Plant not found', 404);
    }

    if (userPlant.user_id !== userId) {
      throw new AppError('FORBIDDEN', 'Access denied', 403);
    }

    await UserPlantModel.delete(id);
  },

  async waterPlant(id: string, userId: string, amount: number = 1) {
    const userPlant = await UserPlantModel.findById(id);
    if (!userPlant) {
      throw new AppError('USER_PLANT_NOT_FOUND', 'Plant not found', 404);
    }

    if (userPlant.user_id !== userId) {
      throw new AppError('FORBIDDEN', 'Access denied', 403);
    }

    const updated = await UserPlantModel.water(id, amount);

    // Add experience
    await UserModel.addExperience(userId, 5);

    return {
      ...updated,
      message: '물을 주었습니다!',
      experience_gained: 5,
    };
  },

  async adjustEnvironment(
    id: string,
    userId: string,
    environment: { temperature?: number; humidity?: number; light_dli?: number }
  ) {
    const userPlant = await UserPlantModel.findById(id);
    if (!userPlant) {
      throw new AppError('USER_PLANT_NOT_FOUND', 'Plant not found', 404);
    }

    if (userPlant.user_id !== userId) {
      throw new AppError('FORBIDDEN', 'Access denied', 403);
    }

    const updated = await UserPlantModel.updateEnvironment(id, environment);

    // Calculate environment score
    const plant = await PlantModel.findById(userPlant.plant_id);
    const score = plant ? SimulationService.calculateEnvironmentScore(environment, plant.environment) : 0;

    return {
      ...updated,
      environment_score: score,
      message: score >= 80 ? '환경이 최적 상태입니다!' : '환경을 조절했습니다.',
      cost_coins: 10,
    };
  },

  async harvestPlant(id: string, userId: string) {
    const userPlant = await UserPlantModel.findById(id);
    if (!userPlant) {
      throw new AppError('USER_PLANT_NOT_FOUND', 'Plant not found', 404);
    }

    if (userPlant.user_id !== userId) {
      throw new AppError('FORBIDDEN', 'Access denied', 403);
    }

    if (!userPlant.is_harvestable) {
      throw new AppError('NOT_HARVESTABLE', 'Plant is not ready for harvest', 400);
    }

    const plant = await PlantModel.findById(userPlant.plant_id);
    if (!plant) {
      throw new AppError('PLANT_NOT_FOUND', 'Plant data not found', 404);
    }

    // Calculate rewards
    const baseExp = plant.rewards.base_experience || 50;
    const baseCoins = plant.rewards.coins || 100;

    const optimalPercentage = (userPlant.optimal_days_count / userPlant.current_age_days) * 100;
    const bonus = optimalPercentage >= 70 ? 1.5 : 1.0;

    const totalExp = Math.floor(baseExp * bonus);
    const totalCoins = Math.floor(baseCoins * bonus);

    // Update user stats
    await UserModel.addExperience(userId, totalExp);
    await UserModel.addCoins(userId, totalCoins);

    // Mark as harvested
    const harvested = await UserPlantModel.harvest(id);

    return {
      ...harvested,
      rewards: {
        experience: baseExp,
        coins: baseCoins,
        bonus_experience: totalExp - baseExp,
        bonus_coins: totalCoins - baseCoins,
        total_experience: totalExp,
        total_coins: totalCoins,
      },
      final_health: userPlant.health,
      optimal_days_percentage: optimalPercentage,
    };
  },
};
