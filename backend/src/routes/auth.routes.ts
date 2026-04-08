import { Router } from 'express';
import { AuthController } from '../controllers/auth.controller';
import { validate, registerSchema, loginSchema } from '../utils/validation';

const router = Router();

router.post('/register', validate(registerSchema), AuthController.register);
router.post('/login', validate(loginSchema), AuthController.login);

export default router;
