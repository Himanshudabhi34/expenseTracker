import mongoose from 'mongoose';
import { BUDGET_PERIOD_VALUES, DEFAULT_WARNING_THRESHOLDS } from '../config/constants.js';

const budgetSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    name: {
      type: String,
      trim: true,
      maxlength: 80,
      default: 'Monthly Budget',
    },
    period: {
      type: String,
      enum: BUDGET_PERIOD_VALUES,
      default: 'monthly',
    },
    amountMinor: {
      type: Number,
      required: true,
      min: [1, 'Budget amount must be greater than zero'],
      validate: {
        validator: Number.isInteger,
        message: 'amountMinor must be an integer (minor units)',
      },
    },
    categoryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category',
      default: null,
    },
    warningThresholds: {
      type: [Number],
      default: () => [...DEFAULT_WARNING_THRESHOLDS],
      validate: {
        validator: (arr) => arr.every((n) => Number.isFinite(n) && n > 0 && n <= 100),
        message: 'Warning thresholds must be between 1 and 100',
      },
    },
    // Tracks which threshold alerts have already been emitted, keyed by period
    // (e.g. "2026-01") so alerts are not generated again on every dashboard load.
    alertState: {
      type: Map,
      of: [Number],
      default: () => new Map(),
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

budgetSchema.index({ userId: 1, isActive: 1 });

const Budget = mongoose.model('Budget', budgetSchema);

export default Budget;
