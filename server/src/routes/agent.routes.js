import { Router } from 'express';
import * as agentController from '../controllers/agent.controller.js';
import { authenticate } from '../middleware/authenticate.js';
import { validateRequest } from '../middleware/validateRequest.js';
import { agentMessageSchema } from '../validators/agent.validator.js';

const router = Router();

router.use(authenticate);

router.post('/message', validateRequest({ body: agentMessageSchema }), agentController.message);

export default router;
