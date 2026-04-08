import { Knex } from 'knex';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config();

const config: { [key: string]: Knex.Config } = {
  development: {
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
      directory: path.join(__dirname, '../migrations'),
      extension: 'sql',
    },
    seeds: {
      directory: path.join(__dirname, '../seeds'),
    },
  },

  production: {
    client: 'pg',
    connection: process.env.DATABASE_URL,
    pool: {
      min: 2,
      max: 10,
    },
    migrations: {
      directory: path.join(__dirname, '../migrations'),
      extension: 'sql',
    },
  },
};

export default config;
