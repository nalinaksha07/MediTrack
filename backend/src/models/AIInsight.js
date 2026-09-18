const mongoose = require('mongoose');

const aiInsightSchema = new mongoose.Schema(
  {
    hospital: { type: mongoose.Schema.Types.ObjectId, ref: 'Hospital', required: true },
    medicine: { type: mongoose.Schema.Types.ObjectId, ref: 'Medicine', required: true },
    problem: {
      type: String,
      enum: ['Expiry Risk', 'High Demand', 'Stockout Risk', 'Overstock', 'Supplier Issue'],
      required: true,
    },
    currentStock: Number,
    prediction: String,
    riskLevel: {
      type: String,
      enum: ['Low', 'Medium', 'High', 'Critical'],
      default: 'Medium',
    },
    reason: String,
    recommendedAction: {
      type: String,
      enum: [
        'Use First (FEFO)',
        'Transfer In',
        'Transfer Out',
        'Procure',
        'Reduce Purchase',
        'Return/Dispose',
        'Switch Supplier',
        'Monitor',
      ],
      required: true,
    },
    recommendedQuantity: Number,
    urgency: {
      type: String,
      enum: ['Low', 'Medium', 'High', 'Immediate'],
      default: 'Medium',
    },
    status: {
      type: String,
      enum: ['Open', 'Acknowledged', 'In Progress', 'Resolved', 'Dismissed'],
      default: 'Open',
    },
    relatedTransfer: { type: mongoose.Schema.Types.ObjectId, ref: 'Transfer' },
    relatedPurchase: { type: mongoose.Schema.Types.ObjectId, ref: 'Purchase' },
    expiresAt: Date, // insight validity
    metadata: mongoose.Schema.Types.Mixed,
  },
  { timestamps: true }
);

aiInsightSchema.index({ hospital: 1, status: 1, riskLevel: 1 });

module.exports = mongoose.model('AIInsight', aiInsightSchema);
