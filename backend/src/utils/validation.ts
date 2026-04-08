import Joi from 'joi';

// User validation schemas
export const registerSchema = Joi.object({
  username: Joi.string().min(3).max(50).required(),
  email: Joi.string().email().required(),
  password: Joi.string().min(8).required(),
  display_name: Joi.string().max(100).optional(),
});

export const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required(),
});

// Plant validation schemas
export const createUserPlantSchema = Joi.object({
  plant_id: Joi.string().required(),
  nickname: Joi.string().max(100).optional(),
  environment: Joi.object({
    temperature: Joi.number().min(-50).max(60).optional(),
    humidity: Joi.number().min(0).max(100).optional(),
    light_dli: Joi.number().min(0).max(100).optional(),
  }).optional(),
});

export const updateUserPlantSchema = Joi.object({
  nickname: Joi.string().max(100).optional(),
});

export const waterPlantSchema = Joi.object({
  amount: Joi.number().min(0.1).max(10).default(1),
});

export const adjustEnvironmentSchema = Joi.object({
  temperature: Joi.number().min(-50).max(60).optional(),
  humidity: Joi.number().min(0).max(100).optional(),
  light_dli: Joi.number().min(0).max(100).optional(),
});

// Validation middleware
export const validate = (schema: Joi.ObjectSchema) => {
  return (req: any, res: any, next: any) => {
    const { error, value } = schema.validate(req.body, { abortEarly: false });

    if (error) {
      const details = error.details.map((detail) => ({
        field: detail.path.join('.'),
        message: detail.message,
      }));

      return res.status(422).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid input data',
          details,
        },
        timestamp: new Date().toISOString(),
      });
    }

    req.validatedBody = value;
    next();
  };
};
