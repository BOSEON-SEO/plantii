import db from '../config/database';

export interface Plant {
  id: string;
  name_ko: string;
  name_en: string;
  name_scientific?: string;
  category: string;
  difficulty: string;
  description?: string;
  icon_url?: string;
  environment: any;
  growth: any;
  stress_factors?: any;
  rewards: any;
  is_unlocked_by_default: boolean;
  unlock_level: number;
  unlock_cost: number;
  created_at: Date;
  updated_at: Date;
}

export const PlantModel = {
  async findAll(filters?: { category?: string; difficulty?: string }): Promise<Plant[]> {
    let query = db('plants').select('*');

    if (filters?.category) {
      query = query.where({ category: filters.category });
    }
    if (filters?.difficulty) {
      query = query.where({ difficulty: filters.difficulty });
    }

    return await query;
  },

  async findById(id: string): Promise<Plant | null> {
    return await db('plants').where({ id }).first();
  },

  async findUnlocked(userLevel: number): Promise<Plant[]> {
    return await db('plants')
      .where('unlock_level', '<=', userLevel)
      .orWhere('is_unlocked_by_default', true);
  },
};
