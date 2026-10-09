import mongoose from 'mongoose';
import {
  NOTIFICATION_TYPE_VALUES,
  NOTIFICATION_LEVEL_VALUES,
} from '../config/constants.js';

const notificationSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    type: {
      type: String,
      enum: NOTIFICATION_TYPE_VALUES,
      required: true,
    },
    level: {
      type: String,
      enum: NOTIFICATION_LEVEL_VALUES,
      default: 'info',
    },
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 120,
    },
    message: {
      type: String,
      required: true,
      trim: true,
      maxlength: 400,
    },
    // Free-form contextual payload (budgetId, threshold, percent, goalId, ...).
    data: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    read: {
      type: Boolean,
      default: false,
      index: true,
    },
    readAt: {
      type: Date,
      default: null,
    },
    // Unique per user so the same event is never recorded twice (e.g. the same
    // budget threshold within the same period).
    dedupeKey: {
      type: String,
      default: null,
    },
  },
  { timestamps: true }
);

notificationSchema.index({ userId: 1, read: 1, createdAt: -1 });
notificationSchema.index(
  { userId: 1, dedupeKey: 1 },
  { unique: true, partialFilterExpression: { dedupeKey: { $type: 'string' } } }
);

const Notification = mongoose.model('Notification', notificationSchema);

export default Notification;
