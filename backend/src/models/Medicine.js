const mongoose = require('mongoose');

const medicineSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    genericName: { type: String, trim: true },
    code: { type: String, required: true, unique: true, uppercase: true },
    category: {
      type: String,
      enum: ['Antibiotic', 'Analgesic', 'Antipyretic', 'Antiviral', 'Vaccine', 'Cardiac', 'Diabetes', 'Respiratory', 'Other'],
      default: 'Other',
    },
    unit: { type: String, default: 'units' }, // tablets, vials, bottles, etc.
    description: String,
    manufacturer: String,
    minStockLevel: { type: Number, default: 50 },
    maxStockLevel: { type: Number, default: 500 },
    reorderPoint: { type: Number, default: 100 },
    averageDailyConsumption: { type: Number, default: 5 },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Medicine', medicineSchema);
