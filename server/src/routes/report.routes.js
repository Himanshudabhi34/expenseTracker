import { Router } from 'express';
import * as reportController from '../controllers/report.controller.js';
import { authenticate } from '../middleware/authenticate.js';

const router = Router();

router.use(authenticate);

router.get('/spending', reportController.spending);
router.get('/suggestions', reportController.suggestions);
router.get('/export.csv', reportController.exportCsv);

export default router;
