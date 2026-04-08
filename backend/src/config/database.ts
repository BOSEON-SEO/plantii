import knex, { Knex } from 'knex';
import dotenv from 'dotenv';

dotenv.config();

const config: Knex.Config = {
  client: 'pg',
  connection: {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    user: process.env.DB_USER || 'plantii',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'plantii_dev',
  },
  pool: {
    min: 2,
    max: 10,
  },
  migrations: {
    directory: '../migrations',
    extension: 'sql',
  },
  seeds: {
    directory: '../seeds',
  },
};

const db = knex(config);

export default db;

// Test database connection
export const testConnection = async (): Promise<boolean> => {
  try {
    await db.raw('SELECT 1');
    console.log('✅ Database connected successfully');
    return true;
  } catch (error) {
    console.error('❌ Database connection failed:', error);
    return false;
  }
};
