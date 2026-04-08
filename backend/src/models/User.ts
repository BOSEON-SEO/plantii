import db from '../config/database';

export interface User {
  id: string;
  username: string;
  email: string;
  password_hash: string;
  display_name?: string;
  profile_image_url?: string;
  experience_points: number;
  level: number;
  coins: number;
  created_at: Date;
  updated_at: Date;
  last_login_at?: Date;
  is_active: boolean;
}

export interface CreateUserInput {
  username: string;
  email: string;
  password_hash: string;
  display_name?: string;
}

export const UserModel = {
  async create(data: CreateUserInput): Promise<User> {
    const [user] = await db('users').insert(data).returning('*');
    return user;
  },

  async findById(id: string): Promise<User | null> {
    return await db('users').where({ id }).first();
  },

  async findByEmail(email: string): Promise<User | null> {
    return await db('users').where({ email }).first();
  },

  async findByUsername(username: string): Promise<User | null> {
    return await db('users').where({ username }).first();
  },

  async updateLastLogin(id: string): Promise<void> {
    await db('users').where({ id }).update({ last_login_at: db.fn.now() });
  },

  async addExperience(id: string, points: number): Promise<void> {
    await db('users')
      .where({ id })
      .increment('experience_points', points);
  },

  async addCoins(id: string, amount: number): Promise<void> {
    await db('users')
      .where({ id })
      .increment('coins', amount);
  },
};
