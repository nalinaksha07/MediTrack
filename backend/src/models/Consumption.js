const mongoose = require('mongoose');

const consumptionSchema = new mongoose.Schema(
  {
    hospital: { type: mongoose.Schema.Types.ObjectId, ref: 'Hospital', required: true },
    medicine: { type: mongoose.Schema.Types.ObjectId, ref: 'Medicine', required: true },
    batchNumber: String,
    quantity: { type: Number, required: true, min: 1 },
    consumptionDate: { type: Date, default: Date.now },
    department: { type: String, default: 'General' },
    reason: {
      type: String,
      enum: ['patient_use', 'procedure', 'emergency', 'waste', 'other'],
      default: 'patient_use',
    },
    recordedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    notes: String,
  },
  { timestamps: true }
);

consumptionSchema.index({ hospital: 1, medicine: 1, consumptionDate: -1 });

module.exports = mongoose.model('Consumption', consumptionSchema);
