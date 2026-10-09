import { Router } from 'express';
import * as authController from '../controllers/auth.controller.js';
import { validateRequest } from '../middleware/validateRequest.js';
import { authenticate } from '../middleware/authenticate.js';
import { updateProfileSchema } from '../validators/auth.validator.js';

const router = Router();

router.patch(
  '/me',
  authenticate,
  validateRequest({ body: updateProfileSchema }),
  authController.updateProfile
);

export default router;
