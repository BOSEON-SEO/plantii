/**
 * Plantii Simulation Engine
 *
 * Calculates plant growth based on environmental factors
 * Based on real botanical data and growth algorithms
 */

interface EnvironmentFactors {
  temperature: number;
  humidity: number;
  light: number;
  water: number;
}

export const SimulationService = {
  /**
   * Calculate temperature factor (0-1)
   */
  calculateTemperatureFactor(
    current: number,
    optimal_min: number,
    optimal_max: number,
    tolerance_min: number,
    tolerance_max: number,
    critical_min: number = -50,
    critical_max: number = 60
  ): number {
    // Critical range: 0 (plant death)
    if (current <= critical_min || current >= critical_max) {
      return 0;
    }

    // Optimal range: 1.0 (full growth)
    if (current >= optimal_min && current <= optimal_max) {
      return 1.0;
    }

    // Tolerance range: linear decrease (0.3 ~ 1.0)
    if (current >= tolerance_min && current < optimal_min) {
      const range = optimal_min - tolerance_min;
      const distance = optimal_min - current;
      return 0.3 + 0.7 * (1 - distance / range);
    }

    if (current > optimal_max && current <= tolerance_max) {
      const range = tolerance_max - optimal_max;
      const distance = current - optimal_max;
      return 0.3 + 0.7 * (1 - distance / range);
    }

    // Stress range: rapid decrease (0 ~ 0.3)
    if (current > critical_min && current < tolerance_min) {
      const range = tolerance_min - critical_min;
      const distance = current - critical_min;
      return 0.3 * (distance / range);
    }

    if (current > tolerance_max && current < critical_max) {
      const range = critical_max - tolerance_max;
      const distance = critical_max - current;
      return 0.3 * (distance / range);
    }

    return 0;
  },

  /**
   * Calculate humidity factor (0-1)
   */
  calculateHumidityFactor(
    current: number,
    optimal_min: number,
    optimal_max: number,
    tolerance_min: number = optimal_min - 10,
    tolerance_max: number = optimal_max + 15
  ): number {
    // Optimal range
    if (current >= optimal_min && current <= optimal_max) {
      return 1.0;
    }

    // Tolerance range
    if (current >= tolerance_min && current < optimal_min) {
      const range = optimal_min - tolerance_min;
      const distance = optimal_min - current;
      return 0.5 + 0.5 * (1 - distance / range);
    }

    if (current > optimal_max && current <= tolerance_max) {
      const range = tolerance_max - optimal_max;
      const distance = current - optimal_max;
      return 0.5 + 0.5 * (1 - distance / range);
    }

    // Out of range: rapid decrease
    if (current < tolerance_min) {
      return Math.max(0, 0.5 - (tolerance_min - current) * 0.05);
    }

    if (current > tolerance_max) {
      return Math.max(0, 0.5 - (current - tolerance_max) * 0.05);
    }

    return 0.5;
  },

  /**
   * Calculate light factor (0-1)
   */
  calculateLightFactor(
    current_dli: number,
    dli_min: number,
    dli_optimal: number,
    dli_max: number
  ): number {
    // Insufficient light
    if (current_dli < dli_min) {
      return Math.max(0.1, (current_dli / dli_min) * 0.5);
    }

    // Optimal range approach
    if (current_dli >= dli_min && current_dli <= dli_optimal) {
      const range = dli_optimal - dli_min;
      const distance = current_dli - dli_min;
      return 0.5 + 0.5 * (distance / range);
    }

    if (current_dli > dli_optimal && current_dli <= dli_max) {
      return 1.0;
    }

    // Excessive light (photoinhibition)
    if (current_dli > dli_max) {
      const excess = current_dli - dli_max;
      return Math.max(0.3, 1.0 - (excess / dli_max) * 0.7);
    }

    return 0.5;
  },

  /**
   * Calculate water factor (0-1)
   */
  calculateWaterFactor(
    soil_moisture: number,
    optimal_min: number,
    optimal_max: number
  ): number {
    // Optimal moisture
    if (soil_moisture >= optimal_min && soil_moisture <= optimal_max) {
      return 1.0;
    }

    // Drought
    if (soil_moisture < optimal_min) {
      if (soil_moisture < optimal_min * 0.5) {
        return 0; // Severe drought: growth stopped
      }
      return (soil_moisture / optimal_min) * 0.8;
    }

    // Overwatering
    if (soil_moisture > optimal_max) {
      if (soil_moisture > optimal_max * 1.2) {
        return 0.2; // Severe overwatering: root rot risk
      }
      const excess = soil_moisture - optimal_max;
      return Math.max(0.5, 1.0 - (excess / optimal_max) * 0.5);
    }

    return 1.0;
  },

  /**
   * Calculate overall growth rate
   */
  calculateGrowthRate(
    environment: { temperature?: number; humidity?: number; light_dli?: number; soil_moisture?: number },
    plantEnvironment: any,
    baseGrowthRate: number = 1.0
  ): number {
    const temp = environment.temperature ?? 20;
    const humidity = environment.humidity ?? 60;
    const light = environment.light_dli ?? 15;
    const moisture = environment.soil_moisture ?? 75;

    const tempFactor = this.calculateTemperatureFactor(
      temp,
      plantEnvironment.temperature?.optimal_min || 15,
      plantEnvironment.temperature?.optimal_max || 25,
      plantEnvironment.temperature?.tolerance_min || 10,
      plantEnvironment.temperature?.tolerance_max || 30,
      plantEnvironment.temperature?.critical_min,
      plantEnvironment.temperature?.critical_max
    );

    const humidityFactor = this.calculateHumidityFactor(
      humidity,
      plantEnvironment.humidity?.optimal_min || 50,
      plantEnvironment.humidity?.optimal_max || 70
    );

    const lightFactor = this.calculateLightFactor(
      light,
      plantEnvironment.light?.dli_min || 10,
      plantEnvironment.light?.dli_optimal || 15,
      plantEnvironment.light?.dli_max || 20
    );

    const waterFactor = this.calculateWaterFactor(
      moisture,
      plantEnvironment.water?.soil_moisture_min || 60,
      plantEnvironment.water?.soil_moisture_max || 80
    );

    const growthRate = baseGrowthRate * tempFactor * humidityFactor * lightFactor * waterFactor;

    return Math.max(0, Math.min(2, growthRate)); // Clamp between 0-2
  },

  /**
   * Calculate environment score (0-100)
   */
  calculateEnvironmentScore(
    environment: { temperature?: number; humidity?: number; light_dli?: number; soil_moisture?: number },
    plantEnvironment: any
  ): number {
    const factors = this.calculateAllFactors(environment, plantEnvironment);
    const avgFactor = (factors.temperature + factors.humidity + factors.light + factors.water) / 4;
    return Math.round(avgFactor * 100);
  },

  /**
   * Calculate all environment factors
   */
  calculateAllFactors(
    environment: { temperature?: number; humidity?: number; light_dli?: number; soil_moisture?: number },
    plantEnvironment: any
  ): EnvironmentFactors {
    const temp = environment.temperature ?? 20;
    const humidity = environment.humidity ?? 60;
    const light = environment.light_dli ?? 15;
    const moisture = environment.soil_moisture ?? 75;

    return {
      temperature: this.calculateTemperatureFactor(
        temp,
        plantEnvironment.temperature?.optimal_min || 15,
        plantEnvironment.temperature?.optimal_max || 25,
        plantEnvironment.temperature?.tolerance_min || 10,
        plantEnvironment.temperature?.tolerance_max || 30
      ),
      humidity: this.calculateHumidityFactor(
        humidity,
        plantEnvironment.humidity?.optimal_min || 50,
        plantEnvironment.humidity?.optimal_max || 70
      ),
      light: this.calculateLightFactor(
        light,
        plantEnvironment.light?.dli_min || 10,
        plantEnvironment.light?.dli_optimal || 15,
        plantEnvironment.light?.dli_max || 20
      ),
      water: this.calculateWaterFactor(
        moisture,
        plantEnvironment.water?.soil_moisture_min || 60,
        plantEnvironment.water?.soil_moisture_max || 80
      ),
    };
  },

  /**
   * Update plant health based on environment
   */
  updateHealth(
    currentHealth: number,
    environmentFactors: EnvironmentFactors,
    elapsedHours: number
  ): number {
    const avgFactor = (environmentFactors.temperature + environmentFactors.humidity +
      environmentFactors.light + environmentFactors.water) / 4;

    const environmentScore = avgFactor * 100;

    let healthChange = 0;

    if (environmentScore >= 80) {
      // Optimal environment: health recovery
      healthChange = +0.5 * elapsedHours;
    } else if (environmentScore >= 60) {
      // Good environment: maintain
      healthChange = 0;
    } else if (environmentScore >= 40) {
      // Stress environment: decrease
      healthChange = -0.3 * elapsedHours;
    } else if (environmentScore >= 20) {
      // Bad environment: rapid decrease
      healthChange = -0.8 * elapsedHours;
    } else {
      // Critical environment: severe decrease
      healthChange = -2.0 * elapsedHours;
    }

    const newHealth = Math.max(0, Math.min(100, currentHealth + healthChange));
    return newHealth;
  },

  /**
   * Calculate soil moisture depletion
   */
  calculateSoilMoistureDepletion(
    currentMoisture: number,
    temperature: number,
    humidity: number,
    elapsedHours: number
  ): number {
    // Base evaporation rate (% per hour)
    const baseEvaporation = 0.5;

    // Temperature influence (higher = faster evaporation)
    const tempMultiplier = 1 + (temperature - 20) * 0.05;

    // Humidity influence (lower = faster evaporation)
    const humidityMultiplier = 1 + (60 - humidity) * 0.02;

    // Total evaporation
    const evaporation = baseEvaporation * tempMultiplier * humidityMultiplier * elapsedHours;

    // Moisture decrease
    const newMoisture = Math.max(0, currentMoisture - evaporation);

    return newMoisture;
  },

  /**
   * Determine growth stage based on age
   */
  determineGrowthStage(currentAgeDays: number, growthStages: any[]): { stage: string; progress: number } {
    if (!growthStages || growthStages.length === 0) {
      return { stage: 'mature', progress: 100 };
    }

    for (let i = growthStages.length - 1; i >= 0; i--) {
      const stage = growthStages[i];
      if (currentAgeDays >= stage.duration_days) {
        const currentStage = stage.stage;

        if (i < growthStages.length - 1) {
          const nextStage = growthStages[i + 1];
          const stageRange = nextStage.duration_days - stage.duration_days;
          const stageProgress = currentAgeDays - stage.duration_days;
          const progress = Math.min(100, (stageProgress / stageRange) * 100);

          return { stage: currentStage, progress };
        } else {
          return { stage: currentStage, progress: 100 };
        }
      }
    }

    return { stage: 'seed', progress: 0 };
  },
};
