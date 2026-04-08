import cron from 'node-cron';
import { UserPlantModel } from '../models/UserPlant';
import { PlantModel } from '../models/Plant';
import { SimulationService } from '../services/simulation.service';
import logger from '../utils/logger';
import db from '../config/database';

/**
 * Background simulation job
 * Runs every hour to update plant states
 */

const runSimulation = async () => {
  try {
    logger.info('🌱 Starting background simulation...');

    // Get all active plants
    const activePlants = await db('user_plants').where({ is_active: true });

    logger.info(`Processing ${activePlants.length} active plants`);

    for (const userPlant of activePlants) {
      try {
        const plant = await PlantModel.findById(userPlant.plant_id);
        if (!plant) continue;

        const now = Date.now();
        const lastUpdate = new Date(userPlant.updated_at).getTime();
        const elapsedHours = (now - lastUpdate) / (1000 * 60 * 60);

        // Skip if less than 1 hour elapsed
        if (elapsedHours < 1) continue;

        // Calculate environment factors
        const environment = {
          temperature: userPlant.temperature,
          humidity: userPlant.humidity,
          light_dli: userPlant.light_dli,
          soil_moisture: userPlant.soil_moisture,
        };

        const factors = SimulationService.calculateAllFactors(environment, plant.environment);

        // Calculate growth rate
        const growthRate = SimulationService.calculateGrowthRate(
          environment,
          plant.environment,
          plant.growth.growth_rate_base
        );

        // Update health
        const newHealth = SimulationService.updateHealth(
          userPlant.health,
          factors,
          elapsedHours
        );

        // Calculate age increase
        const ageDays = (elapsedHours / 24) * growthRate;
        const newAge = userPlant.current_age_days + ageDays;

        // Determine growth stage
        const { stage, progress } = SimulationService.determineGrowthStage(
          newAge,
          plant.growth.growth_stages || []
        );

        // Calculate soil moisture depletion
        const newMoisture = SimulationService.calculateSoilMoistureDepletion(
          userPlant.soil_moisture || 75,
          userPlant.temperature || 20,
          userPlant.humidity || 60,
          elapsedHours
        );

        // Check if harvestable
        const isHarvestable = newAge >= (plant.growth.harvest_days_min || 60);

        // Check if wilted
        const isWilted = newHealth < 20 || newMoisture < 20;

        // Count optimal days
        const environmentScore = (factors.temperature + factors.humidity + factors.light + factors.water) / 4 * 100;
        const optimalDaysCount = environmentScore >= 70
          ? userPlant.optimal_days_count + (elapsedHours / 24)
          : userPlant.optimal_days_count;

        // Update user plant
        await UserPlantModel.update(userPlant.id, {
          current_age_days: newAge,
          current_stage: stage,
          growth_progress: progress,
          health: newHealth,
          soil_moisture: newMoisture,
          is_harvestable: isHarvestable,
          is_wilted: isWilted,
          optimal_days_count: optimalDaysCount,
        });

        // Save state history
        await db('plant_states').insert({
          user_plant_id: userPlant.id,
          temperature: userPlant.temperature,
          humidity: userPlant.humidity,
          light_dli: userPlant.light_dli,
          soil_moisture: newMoisture,
          health: newHealth,
          growth_rate: growthRate,
          stage,
          age_days: newAge,
          stress_level: (1 - growthRate) * 100,
          environment_score: environmentScore,
        });

      } catch (error) {
        logger.error(`Error simulating plant ${userPlant.id}:`, error);
      }
    }

    logger.info('✅ Background simulation completed');
  } catch (error) {
    logger.error('Background simulation failed:', error);
  }
};

// Schedule to run every hour
cron.schedule('0 * * * *', runSimulation);

// Run once on startup (after 10 seconds)
setTimeout(runSimulation, 10000);

logger.info('⏰ Background simulation cron job initialized (runs every hour)');

export default runSimulation;
