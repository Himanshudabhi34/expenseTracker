import * as categoryService from '../services/category.service.js';
import { sendSuccess } from '../middleware/errorHandler.js';
import asyncHandler from '../utils/asyncHandler.js';

export const list = asyncHandler(async (req, res) => {
  const categories = await categoryService.listCategories(req.user._id, { type: req.query.type });
  sendSuccess(res, { categories });
});

export const create = asyncHandler(async (req, res) => {
  const category = await categoryService.createCategory(req.user._id, req.body);
  sendSuccess(res, { category }, 201);
});

export default { list, create };
