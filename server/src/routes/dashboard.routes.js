import { Router } from 'express';
import * as dashboardController from '../controllers/dashboard.controller.js';
import { authenticate } from '../middleware/authenticate.js';

const router = Router();

router.use(authenticate);

router.get('/summary', dashboardController.summary);
router.get('/suggestions', dashboardController.suggestions);

export default router;
