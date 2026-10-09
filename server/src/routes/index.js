import { Router } from 'express';
import authRoutes from './auth.routes.js';
import userRoutes from './user.routes.js';
import transactionRoutes from './transaction.routes.js';
import dashboardRoutes from './dashboard.routes.js';
import budgetRoutes from './budget.routes.js';
import reportRoutes from './report.routes.js';
import categoryRoutes from './category.routes.js';
import goalRoutes from './goal.routes.js';
import agentRoutes from './agent.routes.js';
import notificationRoutes from './notification.routes.js';

const router = Router();

router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/transactions', transactionRoutes);
router.use('/dashboard', dashboardRoutes);
router.use('/budgets', budgetRoutes);
router.use('/reports', reportRoutes);
router.use('/categories', categoryRoutes);
router.use('/goals', goalRoutes);
router.use('/agent', agentRoutes);
router.use('/notifications', notificationRoutes);

export default router;
