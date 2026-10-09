import Category from '../models/Category.js';
import { DEFAULT_CATEGORIES, FALLBACK_CATEGORY } from '../config/constants.js';
import ApiError from '../utils/ApiError.js';

export async function listCategories(userId, { type } = {}) {
  const filter = {
    isActive: true,
    $or: [{ userId: null }, { userId }],
  };
  if (type) filter.type = { $in: [type, 'both'] };

  const categories = await Category.find(filter).sort({ isDefault: -1, name: 1 }).lean();
  return categories;
}

export async function getDefaultCategory(type = 'expense') {
  return Category.findOne({ userId: null, isDefault: true, type: { $in: [type, 'both'] } })
    .sort({ name: 1 })
    .lean();
}

export async function getFallbackCategory(type = 'expense') {
  const found = await Category.findOne({ userId: null, name: FALLBACK_CATEGORY }).lean();
  if (found) return found;
  return getDefaultCategory(type);
}

export async function getCategoryById(userId, categoryId) {
  const category = await Category.findOne({
    _id: categoryId,
    $or: [{ userId: null }, { userId }],
  }).lean();
  if (!category) throw ApiError.notFound('Category not found');
  return category;
}

export async function createCategory(userId, payload) {
  const exists = await Category.findOne({
    $or: [
      { userId, name: payload.name },
      { userId: null, name: payload.name },
    ],
  });
  if (exists) throw ApiError.conflict('A category with this name already exists');

  const category = await Category.create({
    name: payload.name,
    type: payload.type,
    iconKey: payload.iconKey,
    isDefault: false,
    userId,
  });
  return category.toJSON();
}

export async function findAllDefaultCategoryNames() {
  return DEFAULT_CATEGORIES.map((c) => c.name);
}

export default {
  listCategories,
  getDefaultCategory,
  getFallbackCategory,
  getCategoryById,
  createCategory,
  findAllDefaultCategoryNames,
};
