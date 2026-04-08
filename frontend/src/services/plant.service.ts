import api from './api';

export interface Plant {
  id: string;
  name_ko: string;
  name_en: string;
  category: string;
  difficulty: string;
  environment: any;
  growth: any;
  rewards: any;
}

export interface UserPlant {
  id: string;
  plant_id: string;
  nickname?: string;
  current_stage: string;
  current_age_days: number;
  health: number;
  growth_progress: number;
  temperature?: number;
  humidity?: number;
  light_dli?: number;
  soil_moisture?: number;
  last_watered_at?: string;
  is_harvestable: boolean;
  planted_at: string;
}

export const plantService = {
  async getAllPlants(): Promise<Plant[]> {
    const response = await api.get('/plants');
    return response.data.plants;
  },

  async getPlantById(id: string): Promise<Plant> {
    const response = await api.get(`/plants/${id}`);
    return response.data;
  },

  async getUserPlants(): Promise<UserPlant[]> {
    const response = await api.get('/user-plants');
    return response.data.plants;
  },

  async getUserPlantById(id: string): Promise<any> {
    const response = await api.get(`/user-plants/${id}`);
    return response.data;
  },

  async createUserPlant(data: {
    plant_id: string;
    nickname?: string;
    environment?: any;
  }): Promise<UserPlant> {
    const response = await api.post('/user-plants', data);
    return response.data;
  },

  async waterPlant(id: string, amount: number = 1): Promise<any> {
    const response = await api.post(`/user-plants/${id}/water`, { amount });
    return response.data;
  },

  async adjustEnvironment(
    id: string,
    environment: { temperature?: number; humidity?: number; light_dli?: number }
  ): Promise<any> {
    const response = await api.post(`/user-plants/${id}/environment`, environment);
    return response.data;
  },

  async harvestPlant(id: string): Promise<any> {
    const response = await api.post(`/user-plants/${id}/harvest`);
    return response.data;
  },
};
