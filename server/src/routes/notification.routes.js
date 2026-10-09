import { Router } from 'express';
import * as notificationController from '../controllers/notification.controller.js';
import { authenticate } from '../middleware/authenticate.js';
import { validateRequest } from '../middleware/validateRequest.js';
import {
  notificationQuerySchema,
  notificationIdSchema,
} from '../validators/notification.validator.js';

const router = Router();

router.use(authenticate);

router.get(
  '/',
  validateRequest({ query: notificationQuerySchema }),
  notificationController.list
);
router.get('/unread-count', notificationController.unreadCount);
router.post('/read-all', notificationController.markAllRead);
router.delete('/', notificationController.clearAll);
router.patch(
  '/:id/read',
  validateRequest({ params: notificationIdSchema }),
  notificationController.markRead
);
router.delete(
  '/:id',
  validateRequest({ params: notificationIdSchema }),
  notificationController.remove
);

export default router;
