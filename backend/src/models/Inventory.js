const mongoose = require('mongoose');

const batchSchema = new mongoose.Schema({
  batchNumber: { type: String, required: true },
  quantity: { type: Number, required: true, min: 0 },
  expiryDate: { type: Date, required: true },
  manufactureDate: Date,
  unitCost: { type: Number, default: 0 },
  supplier: { type: mongoose.Schema.Types.ObjectId, ref: 'Supplier' },
  receivedDate: { type: Date, default: Date.now },
  status: {
    type: String,
    enum: ['active', 'expired', 'quarantine', 'disposed'],
    default: 'active',
  },
});

const inventorySchema = new mongoose.Schema(
  {
    hospital: { type: mongoose.Schema.Types.ObjectId, ref: 'Hospital', required: true },
    medicine: { type: mongoose.Schema.Types.ObjectId, ref: 'Medicine', required: true },
    batches: [batchSchema],
    totalQuantity: { type: Number, default: 0 },
    reservedQuantity: { type: Number, default: 0 }, // for pending transfers
  },
  { timestamps: true }
);

inventorySchema.index({ hospital: 1, medicine: 1 }, { unique: true });

// Calculate total quantity before save
inventorySchema.pre('save', function (next) {
  this.totalQuantity = this.batches
    .filter((b) => b.status === 'active')
    .reduce((sum, b) => sum + b.quantity, 0);
  next();
});

module.exports = mongoose.model('Inventory', inventorySchema);
