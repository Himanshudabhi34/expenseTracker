import { Router } from 'express';
import * as budgetController from '../controllers/budget.controller.js';
import { authenticate } from '../middleware/authenticate.js';
import { validateRequest } from '../middleware/validateRequest.js';
import { createBudgetSchema, updateBudgetSchema } from '../validators/budget.validator.js';

const router = Router();

router.use(authenticate);

router.get('/', budgetController.list);
router.get('/history', budgetController.history);
router.post('/', validateRequest({ body: createBudgetSchema }), budgetController.create);
router.patch('/:id', validateRequest({ body: updateBudgetSchema }), budgetController.update);
router.delete('/:id', budgetController.remove);

export default router;
