import { Router } from 'express';
import * as goalController from '../controllers/goal.controller.js';
import { authenticate } from '../middleware/authenticate.js';
import { validateRequest } from '../middleware/validateRequest.js';
import { createGoalSchema, updateGoalSchema } from '../validators/goal.validator.js';

const router = Router();

router.use(authenticate);

router.get('/', goalController.list);
router.post('/', validateRequest({ body: createGoalSchema }), goalController.create);
router.patch('/:id', validateRequest({ body: updateGoalSchema }), goalController.update);
router.delete('/:id', goalController.remove);

export default router;
