import { Router } from 'express';
import authRoutes from './auth.routes';
import plantRoutes from './plant.routes';
import userPlantRoutes from './userPlant.routes';

const router = Router();

// API routes
router.use('/auth', authRoutes);
router.use('/plants', plantRoutes);
router.use('/user-plants', userPlantRoutes);

// API info
router.get('/', (req, res) => {
  res.json({
    message: 'Welcome to Plantii API',
    version: '1.0.0',
    endpoints: {
      auth: {
        register: 'POST /api/v1/auth/register',
        login: 'POST /api/v1/auth/login',
      },
      plants: {
        getAll: 'GET /api/v1/plants',
        getById: 'GET /api/v1/plants/:id',
      },
      userPlants: {
        create: 'POST /api/v1/user-plants',
        getAll: 'GET /api/v1/user-plants',
        getById: 'GET /api/v1/user-plants/:id',
        update: 'PATCH /api/v1/user-plants/:id',
        delete: 'DELETE /api/v1/user-plants/:id',
        water: 'POST /api/v1/user-plants/:id/water',
        adjustEnvironment: 'POST /api/v1/user-plants/:id/environment',
        harvest: 'POST /api/v1/user-plants/:id/harvest',
      },
    },
  });
});

export default router;
