import mongoose from 'mongoose';

const performanceReviewSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    reviewer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    cycle: {
      type: String,
      required: true,
      trim: true
    },
    goals: {
      type: [String],
      default: []
    },
    rating: {
      type: Number,
      min: 1,
      max: 5,
      default: 3
    },
    feedback: {
      type: String,
      default: ''
    },
    status: {
      type: String,
      enum: ['draft', 'completed'],
      default: 'completed'
    }
  },
  { timestamps: true }
);

export const PerformanceReview = mongoose.model('PerformanceReview', performanceReviewSchema);
