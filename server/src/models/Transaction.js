import mongoose from 'mongoose';
import { TRANSACTION_TYPE_VALUES, PAYMENT_METHOD_VALUES } from '../config/constants.js';

const transactionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    type: {
      type: String,
      required: true,
      enum: TRANSACTION_TYPE_VALUES,
    },
    amountMinor: {
      type: Number,
      required: true,
      min: [1, 'Amount must be greater than zero'],
      validate: {
        validator: Number.isInteger,
        message: 'amountMinor must be an integer (minor units)',
      },
    },
    currency: {
      type: String,
      default: 'INR',
      uppercase: true,
      trim: true,
      maxlength: 3,
    },
    categoryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category',
      required: true,
      index: true,
    },
    description: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200,
    },
    merchant: {
      type: String,
      trim: true,
      maxlength: 120,
      default: '',
    },
    transactionDate: {
      type: Date,
      required: true,
      index: true,
    },
    paymentMethod: {
      type: String,
      enum: PAYMENT_METHOD_VALUES,
      default: 'other',
    },
    notes: {
      type: String,
      trim: true,
      maxlength: 500,
      default: '',
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform(_doc, ret) {
        delete ret.__v;
        return ret;
      },
    },
  }
);

transactionSchema.index({ userId: 1, transactionDate: -1, _id: -1 });
transactionSchema.index({ userId: 1, type: 1, transactionDate: -1 });
transactionSchema.index({ userId: 1, categoryId: 1, transactionDate: -1 });
transactionSchema.index({ userId: 1, description: 'text', merchant: 'text' });

const Transaction = mongoose.model('Transaction', transactionSchema);

export default Transaction;
