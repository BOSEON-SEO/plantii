import { Router } from 'express';
import { UserPlantController } from '../controllers/userPlant.controller';
import { authenticate } from '../middleware/auth';
import {
  validate,
  createUserPlantSchema,
  updateUserPlantSchema,
  waterPlantSchema,
  adjustEnvironmentSchema,
} from '../utils/validation';

const router = Router();

// All routes require authentication
router.use(authenticate);

router.post('/', validate(createUserPlantSchema), UserPlantController.create);
router.get('/', UserPlantController.getAll);
router.get('/:id', UserPlantController.getById);
router.patch('/:id', validate(updateUserPlantSchema), UserPlantController.update);
router.delete('/:id', UserPlantController.delete);

// Actions
router.post('/:id/water', validate(waterPlantSchema), UserPlantController.water);
router.post('/:id/environment', validate(adjustEnvironmentSchema), UserPlantController.adjustEnvironment);
router.post('/:id/harvest', UserPlantController.harvest);

export default router;
