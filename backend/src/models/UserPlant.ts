import db from '../config/database';

export interface UserPlant {
  id: string;
  user_id: string;
  plant_id: string;
  variant_id?: string;
  nickname?: string;
  planted_at: Date;
  current_stage: string;
  current_age_days: number;
  health: number;
  growth_progress: number;
  temperature?: number;
  humidity?: number;
  light_dli?: number;
  soil_moisture?: number;
  last_watered_at?: Date;
  is_active: boolean;
  is_wilted: boolean;
  is_harvestable: boolean;
  harvested_at?: Date;
  total_water_given: number;
  total_environment_adjustments: number;
  optimal_days_count: number;
  updated_at: Date;
}

export interface CreateUserPlantInput {
  user_id: string;
  plant_id: string;
  nickname?: string;
  temperature?: number;
  humidity?: number;
  light_dli?: number;
}

export const UserPlantModel = {
  async create(data: CreateUserPlantInput): Promise<UserPlant> {
    const plantData = {
      ...data,
      soil_moisture: 75, // Initial soil moisture
      current_stage: 'seed',
      current_age_days: 0,
      health: 100,
      growth_progress: 0,
      is_active: true,
      is_wilted: false,
      is_harvestable: false,
      total_water_given: 0,
      total_environment_adjustments: 0,
      optimal_days_count: 0,
    };

    const [userPlant] = await db('user_plants').insert(plantData).returning('*');
    return userPlant;
  },

  async findById(id: string): Promise<UserPlant | null> {
    return await db('user_plants').where({ id }).first();
  },

  async findByUserId(userId: string, isActive: boolean = true): Promise<UserPlant[]> {
    return await db('user_plants').where({ user_id: userId, is_active: isActive });
  },

  async update(id: string, data: Partial<UserPlant>): Promise<UserPlant> {
    const [updated] = await db('user_plants')
      .where({ id })
      .update(data)
      .returning('*');
    return updated;
  },

  async delete(id: string): Promise<void> {
    await db('user_plants').where({ id }).update({ is_active: false });
  },

  async water(id: string, amount: number = 1): Promise<UserPlant> {
    const plant = await this.findById(id);
    if (!plant) throw new Error('Plant not found');

    const newMoisture = Math.min(100, (plant.soil_moisture || 0) + amount * 10);

    const [updated] = await db('user_plants')
      .where({ id })
      .update({
        soil_moisture: newMoisture,
        last_watered_at: db.fn.now(),
        total_water_given: plant.total_water_given + 1,
      })
      .returning('*');

    return updated;
  },

  async updateEnvironment(
    id: string,
    environment: { temperature?: number; humidity?: number; light_dli?: number }
  ): Promise<UserPlant> {
    const plant = await this.findById(id);
    if (!plant) throw new Error('Plant not found');

    const [updated] = await db('user_plants')
      .where({ id })
      .update({
        ...environment,
        total_environment_adjustments: plant.total_environment_adjustments + 1,
      })
      .returning('*');

    return updated;
  },

  async harvest(id: string): Promise<UserPlant> {
    const [updated] = await db('user_plants')
      .where({ id })
      .update({
        harvested_at: db.fn.now(),
        is_active: false,
      })
      .returning('*');

    return updated;
  },
};
