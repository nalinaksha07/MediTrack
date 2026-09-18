const mongoose = require('mongoose');

const purchaseItemSchema = new mongoose.Schema({
  medicine: { type: mongoose.Schema.Types.ObjectId, ref: 'Medicine', required: true },
  quantity: { type: Number, required: true, min: 1 },
  unitCost: { type: Number, required: true },
  batchNumber: String,
  expiryDate: Date,
  receivedQuantity: { type: Number, default: 0 },
});

const purchaseSchema = new mongoose.Schema(
  {
    purchaseOrderNumber: { type: String, required: true, unique: true },
    hospital: { type: mongoose.Schema.Types.ObjectId, ref: 'Hospital', required: true },
    supplier: { type: mongoose.Schema.Types.ObjectId, ref: 'Supplier', required: true },
    items: [purchaseItemSchema],
    orderDate: { type: Date, default: Date.now },
    expectedDeliveryDate: Date,
    actualDeliveryDate: Date,
    status: {
      type: String,
      enum: ['pending', 'ordered', 'partial', 'received', 'cancelled'],
      default: 'pending',
    },
    totalAmount: { type: Number, default: 0 },
    notes: String,
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Purchase', purchaseSchema);
