/**
 * Simulation Service Unit Tests
 * Tests the core plant growth calculation logic
 */

import { SimulationService } from '../../services/simulation.service';

describe('SimulationService - Temperature Factor', () => {
  test('should return 1.0 for optimal temperature range', () => {
    const factor = SimulationService.calculateTemperatureFactor(
      22, // current
      20, // optimal_min
      27, // optimal_max
      15, // tolerance_min
      30, // tolerance_max
      5,  // critical_min
      40  // critical_max
    );
    expect(factor).toBe(1.0);
  });

  test('should return 0 for critical temperature (too cold)', () => {
    const factor = SimulationService.calculateTemperatureFactor(
      3,  // current (below critical_min)
      20, 27, 15, 30, 5, 40
    );
    expect(factor).toBe(0);
  });

  test('should return 0 for critical temperature (too hot)', () => {
    const factor = SimulationService.calculateTemperatureFactor(
      45, // current (above critical_max)
      20, 27, 15, 30, 5, 40
    );
    expect(factor).toBe(0);
  });

  test('should return value between 0.3-1.0 for tolerance range', () => {
    const factor = SimulationService.calculateTemperatureFactor(
      17, // current (in tolerance range)
      20, 27, 15, 30, 5, 40
    );
    expect(factor).toBeGreaterThan(0.3);
    expect(factor).toBeLessThan(1.0);
  });

  test('should return value between 0-0.3 for stress range', () => {
    const factor = SimulationService.calculateTemperatureFactor(
      8,  // current (in stress range)
      20, 27, 15, 30, 5, 40
    );
    expect(factor).toBeGreaterThan(0);
    expect(factor).toBeLessThanOrEqual(0.3);
  });
});

describe('SimulationService - Humidity Factor', () => {
  test('should return 1.0 for optimal humidity', () => {
    const factor = SimulationService.calculateHumidityFactor(
      60, // current
      50, // optimal_min
      70  // optimal_max
    );
    expect(factor).toBe(1.0);
  });

  test('should return reduced factor for low humidity', () => {
    const factor = SimulationService.calculateHumidityFactor(
      45, // current (below optimal but in tolerance)
      50, 70
    );
    expect(factor).toBeGreaterThan(0.5);
    expect(factor).toBeLessThan(1.0);
  });

  test('should return reduced factor for high humidity', () => {
    const factor = SimulationService.calculateHumidityFactor(
      90, // current (above optimal)
      50, 70
    );
    expect(factor).toBeGreaterThan(0);
    expect(factor).toBeLessThan(1.0);
  });

  test('should return minimum factor for extreme humidity', () => {
    const factor = SimulationService.calculateHumidityFactor(
      10, // current (extremely low)
      50, 70
    );
    expect(factor).toBeGreaterThanOrEqual(0);
    expect(factor).toBeLessThan(0.5);
  });
});

describe('SimulationService - Light Factor', () => {
  test('should return 1.0 for optimal light', () => {
    const factor = SimulationService.calculateLightFactor(
      18, // current_dli
      10, // dli_min
      15, // dli_optimal
      20  // dli_max
    );
    expect(factor).toBe(1.0);
  });

  test('should return reduced factor for insufficient light', () => {
    const factor = SimulationService.calculateLightFactor(
      5,  // current_dli (below min)
      10, 15, 20
    );
    expect(factor).toBeGreaterThan(0);
    expect(factor).toBeLessThan(0.5);
  });

  test('should return reduced factor for excessive light', () => {
    const factor = SimulationService.calculateLightFactor(
      30, // current_dli (above max)
      10, 15, 20
    );
    expect(factor).toBeGreaterThanOrEqual(0.3);
    expect(factor).toBeLessThan(1.0);
  });

  test('should increase factor as light approaches optimal', () => {
    const factor1 = SimulationService.calculateLightFactor(10, 10, 15, 20);
    const factor2 = SimulationService.calculateLightFactor(12, 10, 15, 20);
    const factor3 = SimulationService.calculateLightFactor(15, 10, 15, 20);

    expect(factor1).toBeLessThan(factor2);
    expect(factor2).toBeLessThan(factor3);
    expect(factor3).toBe(1.0);
  });
});

describe('SimulationService - Water Factor', () => {
  test('should return 1.0 for optimal soil moisture', () => {
    const factor = SimulationService.calculateWaterFactor(
      70, // soil_moisture
      60, // optimal_min
      80  // optimal_max
    );
    expect(factor).toBe(1.0);
  });

  test('should return 0 for severe drought', () => {
    const factor = SimulationService.calculateWaterFactor(
      20, // soil_moisture (severe drought)
      60, 80
    );
    expect(factor).toBe(0);
  });

  test('should return reduced factor for moderate drought', () => {
    const factor = SimulationService.calculateWaterFactor(
      40, // soil_moisture (moderate drought)
      60, 80
    );
    expect(factor).toBeGreaterThan(0);
    expect(factor).toBeLessThan(1.0);
  });

  test('should return reduced factor for overwatering', () => {
    const factor = SimulationService.calculateWaterFactor(
      95, // soil_moisture (slight overwatering)
      60, 80
    );
    expect(factor).toBeGreaterThan(0.5);
    expect(factor).toBeLessThan(1.0);
  });

  test('should return low factor for severe overwatering', () => {
    const factor = SimulationService.calculateWaterFactor(
      110, // soil_moisture (severe overwatering)
      60, 80
    );
    expect(factor).toBe(0.2);
  });
});

describe('SimulationService - Growth Rate Calculation', () => {
  const mockPlantEnvironment = {
    temperature: {
      optimal_min: 20,
      optimal_max: 25,
      tolerance_min: 15,
      tolerance_max: 30,
    },
    humidity: {
      optimal_min: 50,
      optimal_max: 70,
    },
    light: {
      dli_min: 10,
      dli_optimal: 15,
      dli_max: 20,
    },
    water: {
      soil_moisture_min: 60,
      soil_moisture_max: 80,
    },
  };

  test('should return high growth rate for optimal environment', () => {
    const growthRate = SimulationService.calculateGrowthRate(
      {
        temperature: 22,
        humidity: 60,
        light_dli: 15,
        soil_moisture: 70,
      },
      mockPlantEnvironment,
      1.0
    );

    expect(growthRate).toBeCloseTo(1.0, 1);
  });

  test('should return low growth rate for poor environment', () => {
    const growthRate = SimulationService.calculateGrowthRate(
      {
        temperature: 10, // below tolerance
        humidity: 30,    // below optimal
        light_dli: 5,    // insufficient
        soil_moisture: 30, // drought
      },
      mockPlantEnvironment,
      1.0
    );

    expect(growthRate).toBeLessThan(0.3);
  });

  test('should return very low growth rate for critical temperature', () => {
    const growthRate = SimulationService.calculateGrowthRate(
      {
        temperature: 0,  // critical (but other factors are good)
        humidity: 60,
        light_dli: 15,
        soil_moisture: 70,
      },
      mockPlantEnvironment,
      1.0
    );

    expect(growthRate).toBeLessThan(0.5);
  });

  test('should clamp growth rate between 0 and 2', () => {
    const growthRate = SimulationService.calculateGrowthRate(
      {
        temperature: 22,
        humidity: 60,
        light_dli: 15,
        soil_moisture: 70,
      },
      mockPlantEnvironment,
      5.0 // high base rate
    );

    expect(growthRate).toBeLessThanOrEqual(2);
  });
});

describe('SimulationService - Health Update', () => {
  test('should increase health in optimal environment', () => {
    const factors = {
      temperature: 1.0,
      humidity: 1.0,
      light: 1.0,
      water: 1.0,
    };

    const newHealth = SimulationService.updateHealth(80, factors, 24);
    expect(newHealth).toBeGreaterThan(80);
  });

  test('should maintain health in good environment', () => {
    const factors = {
      temperature: 0.7,
      humidity: 0.7,
      light: 0.7,
      water: 0.7,
    };

    const newHealth = SimulationService.updateHealth(80, factors, 24);
    expect(newHealth).toBeCloseTo(80, 0);
  });

  test('should decrease health in poor environment', () => {
    const factors = {
      temperature: 0.3,
      humidity: 0.3,
      light: 0.3,
      water: 0.3,
    };

    const newHealth = SimulationService.updateHealth(80, factors, 24);
    expect(newHealth).toBeLessThan(80);
  });

  test('should not go below 0 health', () => {
    const factors = {
      temperature: 0.1,
      humidity: 0.1,
      light: 0.1,
      water: 0.1,
    };

    const newHealth = SimulationService.updateHealth(10, factors, 100);
    expect(newHealth).toBeGreaterThanOrEqual(0);
  });

  test('should not exceed 100 health', () => {
    const factors = {
      temperature: 1.0,
      humidity: 1.0,
      light: 1.0,
      water: 1.0,
    };

    const newHealth = SimulationService.updateHealth(95, factors, 100);
    expect(newHealth).toBeLessThanOrEqual(100);
  });
});

describe('SimulationService - Soil Moisture Depletion', () => {
  test('should decrease moisture over time', () => {
    const newMoisture = SimulationService.calculateSoilMoistureDepletion(
      80,  // current
      20,  // temperature
      60,  // humidity
      24   // elapsed hours
    );

    expect(newMoisture).toBeLessThan(80);
  });

  test('should deplete faster in high temperature', () => {
    const normal = SimulationService.calculateSoilMoistureDepletion(
      80, 20, 60, 24
    );
    const hot = SimulationService.calculateSoilMoistureDepletion(
      80, 35, 60, 24
    );

    expect(hot).toBeLessThan(normal);
  });

  test('should deplete faster in low humidity', () => {
    const normal = SimulationService.calculateSoilMoistureDepletion(
      80, 20, 60, 24
    );
    const dry = SimulationService.calculateSoilMoistureDepletion(
      80, 20, 30, 24
    );

    expect(dry).toBeLessThan(normal);
  });

  test('should not go below 0', () => {
    const newMoisture = SimulationService.calculateSoilMoistureDepletion(
      10, 40, 20, 500
    );

    expect(newMoisture).toBeGreaterThanOrEqual(0);
  });
});

describe('SimulationService - Environment Score', () => {
  const mockPlantEnvironment = {
    temperature: { optimal_min: 20, optimal_max: 25, tolerance_min: 15, tolerance_max: 30 },
    humidity: { optimal_min: 50, optimal_max: 70 },
    light: { dli_min: 10, dli_optimal: 15, dli_max: 20 },
    water: { soil_moisture_min: 60, soil_moisture_max: 80 },
  };

  test('should return score near 100 for optimal environment', () => {
    const score = SimulationService.calculateEnvironmentScore(
      { temperature: 22, humidity: 60, light_dli: 15, soil_moisture: 70 },
      mockPlantEnvironment
    );

    expect(score).toBeGreaterThanOrEqual(90);
    expect(score).toBeLessThanOrEqual(100);
  });

  test('should return low score for poor environment', () => {
    const score = SimulationService.calculateEnvironmentScore(
      { temperature: 10, humidity: 30, light_dli: 5, soil_moisture: 30 },
      mockPlantEnvironment
    );

    expect(score).toBeLessThan(50);
  });

  test('should return low score for critical temperature', () => {
    const score = SimulationService.calculateEnvironmentScore(
      { temperature: 0, humidity: 60, light_dli: 15, soil_moisture: 20 },
      mockPlantEnvironment
    );

    expect(score).toBeLessThan(70);
  });
});

describe('SimulationService - Growth Stage Determination', () => {
  const mockGrowthStages = [
    { stage: 'seed', duration_days: 0 },
    { stage: 'sprout', duration_days: 7 },
    { stage: 'seedling', duration_days: 21 },
    { stage: 'vegetative', duration_days: 45 },
    { stage: 'mature', duration_days: 90 },
  ];

  test('should return seed stage for day 0', () => {
    const result = SimulationService.determineGrowthStage(0, mockGrowthStages);
    expect(result.stage).toBe('seed');
  });

  test('should return sprout stage for day 7-20', () => {
    const result = SimulationService.determineGrowthStage(10, mockGrowthStages);
    expect(result.stage).toBe('sprout');
    expect(result.progress).toBeGreaterThan(0);
    expect(result.progress).toBeLessThan(100);
  });

  test('should return mature stage for day 90+', () => {
    const result = SimulationService.determineGrowthStage(100, mockGrowthStages);
    expect(result.stage).toBe('mature');
    expect(result.progress).toBe(100);
  });

  test('should calculate progress correctly', () => {
    const result = SimulationService.determineGrowthStage(14, mockGrowthStages);
    expect(result.stage).toBe('sprout');
    expect(result.progress).toBeCloseTo(50, 0); // 50% through sprout stage (7->21)
  });
});
