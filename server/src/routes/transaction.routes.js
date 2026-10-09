import { Router } from 'express';
import * as transactionController from '../controllers/transaction.controller.js';
import { authenticate } from '../middleware/authenticate.js';
import { validateRequest } from '../middleware/validateRequest.js';
import {
  createTransactionSchema,
  updateTransactionSchema,
  transactionQuerySchema,
} from '../validators/transaction.validator.js';

const router = Router();

router.use(authenticate);

router.get('/', validateRequest({ query: transactionQuerySchema }), transactionController.list);
router.post('/', validateRequest({ body: createTransactionSchema }), transactionController.create);
router.get('/:id', transactionController.getOne);
router.patch(
  '/:id',
  validateRequest({ body: updateTransactionSchema }),
  transactionController.update
);
router.delete('/:id', transactionController.remove);

export default router;
