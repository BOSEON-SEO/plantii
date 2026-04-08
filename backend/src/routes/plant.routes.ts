import { Router } from 'express';
import { PlantController } from '../controllers/plant.controller';

const router = Router();

router.get('/', PlantController.getAll);
router.get('/:id', PlantController.getById);

export default router;
