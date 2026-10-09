import { Router } from 'express';
import * as categoryController from '../controllers/category.controller.js';
import { authenticate } from '../middleware/authenticate.js';
import { validateRequest } from '../middleware/validateRequest.js';
import { createCategorySchema } from '../validators/category.validator.js';

const router = Router();

router.use(authenticate);

router.get('/', categoryController.list);
router.post('/', validateRequest({ body: createCategorySchema }), categoryController.create);

export default router;
