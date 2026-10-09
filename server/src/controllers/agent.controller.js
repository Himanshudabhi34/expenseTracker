import { handleAgentMessage } from '../agents/agent.js';
import { sendSuccess } from '../middleware/errorHandler.js';
import asyncHandler from '../utils/asyncHandler.js';

export const message = asyncHandler(async (req, res) => {
  const result = await handleAgentMessage({
    userId: req.user._id,
    message: req.body.message,
    timeZone: req.body.timezone || req.user.timezone,
    currency: req.user.currency,
    history: req.body.history,
    useLlm: req.body.useLlm,
    confirm: req.body.confirm,
    draft: req.body.draft,
  });
  sendSuccess(res, result);
});

export default { message };
