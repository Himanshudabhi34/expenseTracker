import mongoose from 'mongoose';
import { GOAL_STATUS_VALUES } from '../config/constants.js';

const goalSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 120,
    },
    targetAmountMinor: {
      type: Number,
      required: true,
      min: [1, 'Target amount must be greater than zero'],
      validate: {
        validator: Number.isInteger,
        message: 'targetAmountMinor must be an integer (minor units)',
      },
    },
    currentAmountMinor: {
      type: Number,
      default: 0,
      min: 0,
      validate: {
        validator: Number.isInteger,
        message: 'currentAmountMinor must be an integer (minor units)',
      },
    },
    targetDate: {
      type: Date,
      default: null,
    },
    status: {
      type: String,
      enum: GOAL_STATUS_VALUES,
      default: 'active',
    },
  },
  { timestamps: true }
);

goalSchema.index({ userId: 1, status: 1 });

goalSchema.virtual('progressPercent').get(function getProgress() {
  if (!this.targetAmountMinor) return 0;
  return Math.min(100, Math.round((this.currentAmountMinor / this.targetAmountMinor) * 100));
});

goalSchema.set('toJSON', { virtuals: true });
goalSchema.set('toObject', { virtuals: true });

const Goal = mongoose.model('Goal', goalSchema);

export default Goal;
