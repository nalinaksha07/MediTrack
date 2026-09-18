const mongoose = require('mongoose');

const transferSchema = new mongoose.Schema(
  {
    transferNumber: { type: String, required: true, unique: true },
    fromHospital: { type: mongoose.Schema.Types.ObjectId, ref: 'Hospital', required: true },
    toHospital: { type: mongoose.Schema.Types.ObjectId, ref: 'Hospital', required: true },
    medicine: { type: mongoose.Schema.Types.ObjectId, ref: 'Medicine', required: true },
    quantity: { type: Number, required: true, min: 1 },
    batchNumber: String,
    status: {
      type: String,
      enum: ['recommended', 'pending', 'approved', 'in_transit', 'completed', 'cancelled'],
      default: 'recommended',
    },
    reason: String,
    recommendedByAI: { type: Boolean, default: false },
    transportDetails: {
      vehicle: String,
      estimatedTimeHours: Number,
      distanceKm: Number,
      cost: Number,
    },
    requestedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    completedAt: Date,
    notes: String,
  },
  { timestamps: true }
);

module.exports = mongoose.model('Transfer', transferSchema);
